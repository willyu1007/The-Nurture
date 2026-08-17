import type { AddressInfo } from "node:net";
import { afterEach, describe, expect, it } from "vitest";
import type {
  NurtureUserAttentionAcknowledgeOutcome,
  NurtureUserAttentionResolution,
} from "@the-nurture/scenario";
import { createScenarioServiceApplication } from "../src/application.js";
import { createBindingOwnerServiceAuth } from "../src/binding-owner-service-auth.js";
import {
  USER_ATTENTION_ACKNOWLEDGE_PATH,
  USER_ATTENTION_RESOLVE_PATH,
  type UserAttentionOwnerService,
} from "../src/user-attention-owner.controller.js";

// Migrated from the legacy host's user-attention-owner-auth e2e (T-014 Wave 2):
// the same 503/401/400/200 fences now guard the scenario-service routes.

const TOKEN = "user-attention-service-token";

const requestPayload = {
  workspace_id: "workspace-1",
  source_context_refs: [],
};

const acknowledgePayload = {
  workspace_id: "workspace-1",
  source_context_refs: [],
  actor_user_id: "user-1",
  expected_item_version: 1,
  idempotency_key: "command-1",
};

const stubService = () => {
  const resolveCalls: unknown[] = [];
  const acknowledgeCalls: unknown[] = [];
  const service: UserAttentionOwnerService = {
    async resolve(input): Promise<NurtureUserAttentionResolution> {
      resolveCalls.push(input);
      return { status: "stopped", reason_code: "policy_blocked" };
    },
    async acknowledge(input): Promise<NurtureUserAttentionAcknowledgeOutcome> {
      acknowledgeCalls.push(input);
      return { status: "rejected", reason_code: "policy_blocked" };
    },
  };
  return { service, resolveCalls, acknowledgeCalls };
};

describe("user-attention owner routes (scenario-service)", () => {
  let close: (() => Promise<void>) | undefined;

  afterEach(async () => {
    await close?.();
    close = undefined;
  });

  const boot = async (config: {
    token?: string;
    service: UserAttentionOwnerService;
  }) => {
    const { app } = await createScenarioServiceApplication({
      userAttentionOwner: {
        serviceAuth: createBindingOwnerServiceAuth(config.token),
        service: config.service,
      },
    });
    await app.listen(0, "127.0.0.1");
    close = () => app.close();
    const address = app.getHttpServer().address() as AddressInfo;
    return `http://127.0.0.1:${address.port}`;
  };

  const post = (baseUrl: string, path: string, payload: unknown, authorization?: string) =>
    fetch(`${baseUrl}${path}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(authorization ? { authorization } : {}),
      },
      body: JSON.stringify(payload),
    });

  it("stays fail-closed when service authentication is not configured", async () => {
    const { service, resolveCalls, acknowledgeCalls } = stubService();
    const baseUrl = await boot({ service });

    for (const path of [USER_ATTENTION_RESOLVE_PATH, USER_ATTENTION_ACKNOWLEDGE_PATH]) {
      const response = await post(baseUrl, path, requestPayload);
      expect(response.status).toBe(503);
      expect(await response.json()).toEqual({ error: "activation_owner_disabled" });
    }
    expect(resolveCalls).toHaveLength(0);
    expect(acknowledgeCalls).toHaveLength(0);
  });

  it("rejects missing and incorrect bearer credentials", async () => {
    const { service, resolveCalls } = stubService();
    const baseUrl = await boot({ token: TOKEN, service });

    for (const authorization of [undefined, "Bearer wrong-token", `Basic ${TOKEN}`]) {
      const response = await post(baseUrl, USER_ATTENTION_RESOLVE_PATH, requestPayload, authorization);
      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({ error: "service_auth_required" });
    }
    expect(resolveCalls).toHaveLength(0);
  });

  it("validates the request before invoking the owner and accepts the configured token", async () => {
    const { service, resolveCalls } = stubService();
    const baseUrl = await boot({ token: TOKEN, service });
    const authorization = `Bearer ${TOKEN}`;

    const invalid = await post(baseUrl, USER_ATTENTION_RESOLVE_PATH, {}, authorization);
    expect(invalid.status).toBe(400);
    expect(await invalid.json()).toEqual({ error: "invalid_owner_read_request" });
    expect(resolveCalls).toHaveLength(0);

    const accepted = await post(baseUrl, USER_ATTENTION_RESOLVE_PATH, requestPayload, authorization);
    expect(accepted.status).toBe(200);
    expect(await accepted.json()).toEqual({ status: "stopped", reason_code: "policy_blocked" });
    expect(resolveCalls).toEqual([requestPayload]);
  });

  it("applies the same auth and validation fences on the acknowledge action route", async () => {
    const { service, acknowledgeCalls } = stubService();
    const baseUrl = await boot({ token: TOKEN, service });
    const authorization = `Bearer ${TOKEN}`;

    const unauthorized = await post(
      baseUrl,
      USER_ATTENTION_ACKNOWLEDGE_PATH,
      acknowledgePayload,
      "Bearer wrong-token",
    );
    expect(unauthorized.status).toBe(401);

    for (const payload of [
      {},
      { ...acknowledgePayload, actor_user_id: "" },
      { ...acknowledgePayload, expected_item_version: 0 },
      { ...acknowledgePayload, expected_item_version: 1.5 },
      { ...acknowledgePayload, idempotency_key: "" },
    ]) {
      const invalid = await post(baseUrl, USER_ATTENTION_ACKNOWLEDGE_PATH, payload, authorization);
      expect(invalid.status).toBe(400);
      expect(await invalid.json()).toEqual({ error: "invalid_owner_action_request" });
    }
    expect(acknowledgeCalls).toHaveLength(0);

    const accepted = await post(baseUrl, USER_ATTENTION_ACKNOWLEDGE_PATH, acknowledgePayload, authorization);
    expect(accepted.status).toBe(200);
    expect(await accepted.json()).toEqual({ status: "rejected", reason_code: "policy_blocked" });
    expect(acknowledgeCalls).toEqual([acknowledgePayload]);
  });
});
