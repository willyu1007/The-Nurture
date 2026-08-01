import type { AddressInfo } from "node:net";
import { afterEach, describe, expect, it } from "vitest";
import { INSTITUTION_BUSINESS_COMMUNICATION_INTERFACE } from "@the-nurture/scenario/harness";
import { createScenarioServiceApplication } from "../src/application.js";
import { createBindingOwnerServiceAuth } from "../src/binding-owner-service-auth.js";
import { HarnessRuntime, type HarnessEngine } from "../src/harness-runtime.js";
import {
  HARNESS_EXECUTE_PATH,
  HARNESS_PREPARE_PATH,
  INSTITUTION_BUSINESS_COMMUNICATION_READ_PATH,
} from "../src/harness-http.js";

const TOKEN = "harness-e2e-service-token-32-characters";

let close: (() => Promise<void>) | undefined;

afterEach(async () => {
  await close?.();
  close = undefined;
});

const fakeEngine = (overrides: Partial<HarnessEngine>): HarnessEngine => ({
  prepare: async () => {
    throw new Error("prepare must not run");
  },
  execute: async () => {
    throw new Error("execute must not run");
  },
  query: async () => {
    throw new Error("query must not run");
  },
  readResult: async () => {
    throw new Error("readResult must not run");
  },
  readInstitutionBusinessCommunication: async () => {
    throw new Error("readInstitutionBusinessCommunication must not run");
  },
  ...overrides,
});

const start = async (
  engine?: HarnessEngine,
  institutionBusinessCommunicationReadEnabled = false,
) => {
  const serviceAuth = createBindingOwnerServiceAuth(TOKEN);
  const { app } = await createScenarioServiceApplication({
    bindingOwnerServiceAuth: serviceAuth,
    harnessRuntime: new HarnessRuntime(
      engine,
      undefined,
      institutionBusinessCommunicationReadEnabled,
    ),
    logSink: () => undefined,
  });
  await app.listen(0, "127.0.0.1");
  const address = app.getHttpServer().address() as AddressInfo;
  close = () => app.close();
  return `http://127.0.0.1:${address.port}`;
};

const post = (baseUrl: string, path: string, body: unknown, token = TOKEN) =>
  fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      connection: "close",
    },
    body: JSON.stringify(body),
  });

const prepareBody = {
  workspace_id: "ws-1",
  actor_participant_id: "participant-1",
  surface: "chat",
  capability_key: "submit_family_care_question",
  capability_version: "1.0.0",
  operation_input: { body: "hello" },
};

describe("Harness controller boundary", () => {
  it("keeps the protected Institution Admin owner-read default-off", async () => {
    let calls = 0;
    const baseUrl = await start(
      fakeEngine({
        readInstitutionBusinessCommunication: async () => {
          calls += 1;
          throw new Error("must not run");
        },
      }),
    );
    const response = await post(
      baseUrl,
      INSTITUTION_BUSINESS_COMMUNICATION_READ_PATH,
      {
        workspace_id: "ws-1",
        actor_participant_id: "participant-1",
        surface: "admin",
        interface_contract: INSTITUTION_BUSINESS_COMMUNICATION_INTERFACE,
        target_option_ref: `1.${Buffer.from("message-id").toString("base64url")}.${"0".repeat(32)}`,
      },
    );
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: "institution_business_communication_read_disabled",
    });
    expect(calls).toBe(0);
  });

  it("stays disabled without an engine", async () => {
    const baseUrl = await start(undefined);
    const response = await post(baseUrl, HARNESS_PREPARE_PATH, prepareBody);
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({ error: "harness_disabled" });
  });

  it("requires the service bearer before touching the engine", async () => {
    let calls = 0;
    const baseUrl = await start(
      fakeEngine({
        prepare: async () => {
          calls += 1;
          throw new Error("must not run");
        },
      }),
    );
    const response = await post(baseUrl, HARNESS_PREPARE_PATH, prepareBody, "wrong-token");
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "service_auth_required" });
    expect(calls).toBe(0);
  });

  it("rejects invalid shells and unknown capabilities without engine calls", async () => {
    let calls = 0;
    const baseUrl = await start(
      fakeEngine({
        prepare: async () => {
          calls += 1;
          throw new Error("must not run");
        },
        execute: async () => {
          calls += 1;
          throw new Error("must not run");
        },
      }),
    );
    const invalid = await post(baseUrl, HARNESS_PREPARE_PATH, {
      ...prepareBody,
      unexpected: true,
    });
    expect(invalid.status).toBe(400);
    await expect(invalid.json()).resolves.toEqual({ error: "invalid_harness_request" });

    const unknown = await post(baseUrl, HARNESS_PREPARE_PATH, {
      ...prepareBody,
      capability_key: "publish_everything",
    });
    expect(unknown.status).toBe(400);
    await expect(unknown.json()).resolves.toEqual({ error: "unknown_capability" });
    expect(calls).toBe(0);
  });

  it("routes parsed prepare and execute requests to the engine", async () => {
    const seen: string[] = [];
    const baseUrl = await start(
      fakeEngine({
        prepare: async (request) => {
          seen.push(`prepare:${request.capability_key}`);
          return { status: "denied", reason_code: "not_authorized" };
        },
        execute: async (request) => {
          seen.push(`execute:${request.command_request_id}`);
          return {
            status: "not_committed",
            decision: "conflict",
            reason_code: "confirmation_expired",
            recovery: "reprepare",
          };
        },
      }),
    );
    const prepared = await post(baseUrl, HARNESS_PREPARE_PATH, prepareBody);
    expect(prepared.status).toBe(200);
    await expect(prepared.json()).resolves.toEqual({
      status: "denied",
      reason_code: "not_authorized",
    });

    const executed = await post(baseUrl, HARNESS_EXECUTE_PATH, {
      workspace_id: "ws-1",
      actor_participant_id: "participant-1",
      surface: "chat",
      capability_key: "reply_family_care_item",
      capability_version: "1.0.0",
      invocation_request_id: "invocation:1",
      command_request_id: "command:1",
      confirmation_ref: "a".repeat(48),
      operation_input: { body: "hello" },
    });
    expect(executed.status).toBe(200);
    await expect(executed.json()).resolves.toMatchObject({
      status: "not_committed",
      recovery: "reprepare",
    });
    expect(seen).toEqual(["prepare:submit_family_care_question", "execute:command:1"]);
  });
});
