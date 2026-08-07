import { describe, expect, it, vi } from "vitest";
import type { NurtureApp } from "../src/app.js";
import { buildServer } from "../src/server.js";

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

const appWithResolver = () => {
  const resolveUserAttention = vi.fn(async () => ({
    status: "stopped" as const,
    reason_code: "policy_blocked" as const,
  }));
  const acknowledgeUserAttention = vi.fn(async () => ({
    status: "rejected" as const,
    reason_code: "policy_blocked" as const,
  }));
  return {
    app: { resolveUserAttention, acknowledgeUserAttention } as unknown as NurtureApp,
    resolveUserAttention,
    acknowledgeUserAttention,
  };
};

describe("Nurture user-attention owner endpoint", () => {
  it("stays fail-closed when service authentication is not configured", async () => {
    const { app, resolveUserAttention } = appWithResolver();
    const server = buildServer(app);

    const response = await server.inject({
      method: "POST",
      url: "/internal/nurture/activation/user-attention/resolve",
      payload: requestPayload,
    });

    expect(response.statusCode).toBe(503);
    expect(response.json()).toEqual({ error: "activation_owner_disabled" });
    expect(resolveUserAttention).not.toHaveBeenCalled();
    await server.close();
  });

  it("rejects missing and incorrect bearer credentials", async () => {
    const { app, resolveUserAttention } = appWithResolver();
    const server = buildServer(app, { internalServiceToken: "expected-token" });

    for (const authorization of [undefined, "Bearer wrong-token", "Basic expected-token"]) {
      const response = await server.inject({
        method: "POST",
        url: "/internal/nurture/activation/user-attention/resolve",
        ...(authorization ? { headers: { authorization } } : {}),
        payload: requestPayload,
      });
      expect(response.statusCode).toBe(401);
      expect(response.json()).toEqual({ error: "service_auth_required" });
    }
    expect(resolveUserAttention).not.toHaveBeenCalled();
    await server.close();
  });

  it("validates the request before invoking the owner and accepts the configured token", async () => {
    const { app, resolveUserAttention } = appWithResolver();
    const server = buildServer(app, { internalServiceToken: "expected-token" });
    const headers = { authorization: "Bearer expected-token" };

    const invalid = await server.inject({
      method: "POST",
      url: "/internal/nurture/activation/user-attention/resolve",
      headers,
      payload: {},
    });
    expect(invalid.statusCode).toBe(400);
    expect(resolveUserAttention).not.toHaveBeenCalled();

    const accepted = await server.inject({
      method: "POST",
      url: "/internal/nurture/activation/user-attention/resolve",
      headers,
      payload: requestPayload,
    });
    expect(accepted.statusCode).toBe(200);
    expect(resolveUserAttention).toHaveBeenCalledWith(requestPayload);
    await server.close();
  });

  it("applies the same auth and validation fences on the acknowledge action route", async () => {
    const unconfigured = appWithResolver();
    const disabledServer = buildServer(unconfigured.app);
    const disabled = await disabledServer.inject({
      method: "POST",
      url: "/internal/nurture/activation/user-attention/acknowledge",
      payload: acknowledgePayload,
    });
    expect(disabled.statusCode).toBe(503);
    expect(unconfigured.acknowledgeUserAttention).not.toHaveBeenCalled();
    await disabledServer.close();

    const { app, acknowledgeUserAttention } = appWithResolver();
    const server = buildServer(app, { internalServiceToken: "expected-token" });
    const headers = { authorization: "Bearer expected-token" };

    const unauthorized = await server.inject({
      method: "POST",
      url: "/internal/nurture/activation/user-attention/acknowledge",
      headers: { authorization: "Bearer wrong-token" },
      payload: acknowledgePayload,
    });
    expect(unauthorized.statusCode).toBe(401);

    for (const payload of [
      {},
      { ...acknowledgePayload, actor_user_id: "" },
      { ...acknowledgePayload, expected_item_version: 0 },
      { ...acknowledgePayload, expected_item_version: 1.5 },
      { ...acknowledgePayload, idempotency_key: "" },
    ]) {
      const invalid = await server.inject({
        method: "POST",
        url: "/internal/nurture/activation/user-attention/acknowledge",
        headers,
        payload,
      });
      expect(invalid.statusCode).toBe(400);
      expect(invalid.json()).toEqual({ error: "invalid_owner_action_request" });
    }
    expect(acknowledgeUserAttention).not.toHaveBeenCalled();

    const accepted = await server.inject({
      method: "POST",
      url: "/internal/nurture/activation/user-attention/acknowledge",
      headers,
      payload: acknowledgePayload,
    });
    expect(accepted.statusCode).toBe(200);
    expect(accepted.json()).toEqual({ status: "rejected", reason_code: "policy_blocked" });
    expect(acknowledgeUserAttention).toHaveBeenCalledWith(acknowledgePayload);
    await server.close();
  });
});
