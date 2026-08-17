import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { afterEach, describe, expect, it } from "vitest";
import { createScenarioServiceApplication } from "../src/application.js";
import { createBindingOwnerServiceAuth } from "../src/binding-owner-service-auth.js";
import type { ScenarioBindingOwnerAuthorizer } from "@the-nurture/scenario/binding-owner";
import type { ScenarioStructuredLogRecord } from "../src/structured-logger.js";

describe("scenario-service M1/M2 HTTP boundary", () => {
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
    expect(health.headers.get("x-powered-by")).toBeNull();
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

    const teacherDisabled = await fetch(
      `${baseUrl}/internal/nurture/teacher-class-stream/v1/class-context`,
      {
        method: "POST",
        headers: {
          authorization: "Bearer secret-marker",
          "content-type": "application/json",
        },
        body: "{}",
      },
    );
    expect(teacherDisabled.status).toBe(503);
    expect(await teacherDisabled.json()).toEqual({
      error: "teacher_class_stream_presenter_disabled",
    });

    for (const path of ["/api/workflow/runs"]) {
      const absent = await fetch(`${baseUrl}${path}`, { method: "POST" });
      expect(absent.status).toBe(404);
      expect(await absent.json()).toEqual({ error: "not_found" });
    }

    // T-014 Wave 2: the activation owner routes migrated here from the legacy
    // host; unconfigured they stay fail-closed instead of absent.
    for (const [path, error] of [
      ["/internal/nurture/activation/user-attention/resolve", "activation_owner_disabled"],
      ["/internal/nurture/growth-record/contribution/resolve", "contribution_resolve_disabled"],
    ] as const) {
      const migrated = await fetch(`${baseUrl}${path}`, { method: "POST" });
      expect(migrated.status).toBe(503);
      expect(await migrated.json()).toEqual({ error });
    }

    const unknownMethod = await fetch(`${baseUrl}/not-registered`, {
      method: "PROPFIND",
    });
    expect(unknownMethod.status).toBe(404);
    expect(await unknownMethod.json()).toEqual({ error: "not_found" });

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
        expect.objectContaining({
          event: "request_completed",
          route_class: "teacher_class_stream_class_context",
          status_code: 503,
        }),
        expect.objectContaining({
          event: "request_refused",
          route_class: "teacher_class_stream_class_context",
          status_code: 503,
          reason_code: "teacher_class_stream_presenter_disabled",
        }),
        expect.objectContaining({
          event: "request_completed",
          method: "UNKNOWN",
          route_class: "unknown",
          status_code: 404,
        }),
      ]),
    );
  });

  it("applies Node HTTP receive deadlines as well as the handler deadline", async () => {
    const { app, config } = await createScenarioServiceApplication({
      logSink: () => undefined,
    });
    close = () => app.close();
    const server = app.getHttpServer() as Server;

    expect(server.requestTimeout).toBe(config.requestTimeoutMs);
    expect(server.headersTimeout).toBe(config.requestTimeoutMs);
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

  it.each([
    { authorization: undefined, condition: "missing" },
    { authorization: "Bearer wrong-token", condition: "wrong" },
  ])(
    "returns 401 when owner composition is available but the bearer is $condition",
    async ({ authorization }) => {
      const { app } = await createScenarioServiceApplication({
        bindingOwnerAuthorizer: fakeAuthorizer,
        bindingOwnerServiceAuth:
          createBindingOwnerServiceAuth("expected-token"),
        logSink: () => undefined,
      });
      await app.listen(0, "127.0.0.1");
      close = () => app.close();
      const address = app.getHttpServer().address() as AddressInfo;
      const headers = new Headers();
      if (authorization) headers.set("authorization", authorization);
      const response = await fetch(
        `http://127.0.0.1:${address.port}/internal/nurture/scenario-binding/authorize`,
        { method: "POST", headers },
      );

      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({
        error: "service_auth_required",
      });
    },
  );
});

const fakeAuthorizer: ScenarioBindingOwnerAuthorizer = {
  authorize: async () => {
    throw new Error("The M2 disabled controller must not invoke the authorizer.");
  },
};
