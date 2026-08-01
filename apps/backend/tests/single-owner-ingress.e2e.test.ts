import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { SCENARIO_BINDING_OWNER_PATH } from "@the-nurture/scenario/binding-owner-http";
import { createNurtureApp } from "../src/app.js";
import { buildServer } from "../src/server.js";

// ING-D4 regression gate: the dev host must never serve the owner endpoint
// again; the formal NestJS scenario-service is the only live owner ingress.
describe("single owner ingress (ING-D4)", () => {
  let app: Awaited<ReturnType<typeof createNurtureApp>>;
  let server: ReturnType<typeof buildServer>;
  let baseUrl: string;

  beforeAll(async () => {
    app = createNurtureApp({});
    server = buildServer(app, { internalServiceToken: "test-token-0123456789abcdef" });
    await server.listen({ host: "127.0.0.1", port: 0 });
    const address = server.server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterAll(async () => {
    await server.close();
    await app.disconnect();
  });

  it("returns 404 for the removed binding-owner route", async () => {
    const response = await fetch(`${baseUrl}${SCENARIO_BINDING_OWNER_PATH}`, {
      method: "POST",
      headers: {
        authorization: "Bearer test-token-0123456789abcdef",
        "content-type": "application/json",
      },
      body: "{}",
    });
    expect(response.status).toBe(404);
  });
});
