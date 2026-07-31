import type { AddressInfo } from "node:net";
import { afterEach, describe, expect, it } from "vitest";
import { createScenarioServiceApplication } from "../src/application.js";
import type { ScenarioStructuredLogRecord } from "../src/structured-logger.js";

describe("scenario-service M1 HTTP boundary", () => {
  let close: (() => Promise<void>) | undefined;

  afterEach(async () => {
    await close?.();
    close = undefined;
  });

  it("exposes health, keeps P7 disabled, and omits legacy routes", async () => {
    const records: ScenarioStructuredLogRecord[] = [];
    const { app } = await createScenarioServiceApplication({
      logSink: (record) => records.push(record),
    });
    await app.listen(0, "127.0.0.1");
    close = () => app.close();
    const address = app.getHttpServer().address() as AddressInfo;
    const baseUrl = `http://127.0.0.1:${address.port}`;

    const health = await fetch(`${baseUrl}/health?secret=secret-marker`, {
      headers: { authorization: "Bearer secret-marker" },
    });
    expect(health.status).toBe(200);
    expect(await health.json()).toEqual({ ok: true });
    expect(health.headers.get("x-request-id")).toMatch(
      /^[0-9a-f-]{36}$/,
    );

    const disabled = await fetch(
      `${baseUrl}/internal/nurture/scenario-binding/authorize`,
      {
        method: "POST",
        headers: {
          authorization: "Bearer secret-marker",
          "content-type": "application/json",
        },
        body: JSON.stringify({ protected: "secret-marker" }),
      },
    );
    expect(disabled.status).toBe(503);
    expect(await disabled.json()).toEqual({
      error: "binding_owner_disabled",
    });

    for (const path of [
      "/internal/nurture/activation/user-attention/resolve",
      "/api/workflow/runs",
    ]) {
      const absent = await fetch(`${baseUrl}${path}`, { method: "POST" });
      expect(absent.status).toBe(404);
      expect(await absent.json()).toEqual({ error: "not_found" });
    }

    expect(JSON.stringify(records)).not.toContain("secret-marker");
    expect(records).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          event: "request_completed",
          route_class: "health",
          status_code: 200,
        }),
        expect.objectContaining({
          event: "request_completed",
          route_class: "binding_owner",
          status_code: 503,
        }),
      ]),
    );
  });

  it("returns a body-safe error when the JSON body exceeds 64 KiB", async () => {
    const { app } = await createScenarioServiceApplication({
      logSink: () => undefined,
    });
    await app.listen(0, "127.0.0.1");
    close = () => app.close();
    const address = app.getHttpServer().address() as AddressInfo;
    const response = await fetch(
      `http://127.0.0.1:${address.port}/internal/nurture/scenario-binding/authorize`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ value: "x".repeat(65_536) }),
      },
    );

    expect(response.status).toBe(413);
    expect(await response.json()).toEqual({
      error: "payload_too_large",
    });
  });
});
