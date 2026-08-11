import type {
  ScenarioPrivateInvocationV1,
  WorkflowVerifiedScenarioInvocationV1,
} from "@my-chat/workflow-contracts";
import { describe, expect, it, vi } from "vitest";
import { createNurtureC30TrustedInvocationHandlers } from "../../src/c30/trusted-handler-registry.js";

const handlerKeys = [
  "nurture.c30.list_subject_contexts.transport",
  "nurture.c30.present_subject_context.transport",
  "nurture.c30.resolve_subject_context.transport",
];

describe("Nurture C30 trusted invocation registry", () => {
  it("registers only the three declared handlers and stays unavailable without an owner", async () => {
    const handlers = createNurtureC30TrustedInvocationHandlers();

    expect(Object.keys(handlers).sort()).toEqual(handlerKeys);
    await expect(handlers[handlerKeys[0]]?.(verified("list_subject_contexts", {
      input_version: 1,
    }))).resolves.toEqual(expect.objectContaining({ status: "unavailable" }));
  });

  it("forwards sanitized principal and typed input to the selected owner operation", async () => {
    const list = vi.fn(async () => ({ status: "unavailable" as const, safe_reason: safeReason() }));
    const handlers = createNurtureC30TrustedInvocationHandlers({
      list,
      resolve: vi.fn(),
      present: vi.fn(),
    });
    const input = { input_version: 1 as const, page_size: 5 };

    await handlers["nurture.c30.list_subject_contexts.transport"]?.(
      verified("list_subject_contexts", input),
    );

    expect(list).toHaveBeenCalledWith(
      expect.objectContaining({ principal_origin: "interactive_session" }),
      input,
    );
  });

  it("fails closed when direct registry invocation drifts from its operation", async () => {
    const handlers = createNurtureC30TrustedInvocationHandlers();

    await expect(handlers["nurture.c30.list_subject_contexts.transport"]?.(
      verified("resolve_subject_context", { input_version: 1, subject_context_ref: "opaque" }),
    )).rejects.toThrow("operation does not match its handler");
  });
});

function verified(
  operationKey: "list_subject_contexts" | "resolve_subject_context" | "present_subject_context",
  input: unknown,
): WorkflowVerifiedScenarioInvocationV1 {
  const invocation: ScenarioPrivateInvocationV1 = {
    invocation_version: 1,
    contract_version: 1,
    contract_hash: "a".repeat(64),
    issuer: "my_chat.host",
    assertion_audience: "scenario.private",
    caller_binding: { caller_subject: "my-chat-host-runtime" },
    principal: {
      principal_version: 1,
      principal_kind: "human_user",
      account_ref: ref("user", "user_01"),
      actor_ref: ref("actor", "actor_01"),
      workspace_ref: ref("workspace", "workspace_01"),
      principal_origin: "interactive_session",
    },
    route: {
      scenario_key: "nurture",
      endpoint_key: `nurture.${operationKey}`,
      method: "POST",
      ingress: {
        ingress_version: 1,
        ingress_category: "host_transition",
        ingress_key: `nurture.${operationKey}`,
      },
    },
    request: {
      request_id: "request_01",
      correlation_id: "correlation_01",
      issued_at: "2026-08-11T00:00:00.000Z",
      expires_at: "2026-08-11T00:00:30.000Z",
      nonce: "0123456789abcdef0123456789abcdef",
    },
    operation: {
      operation_key: operationKey,
      input_schema_version: 1,
      input,
    },
  };
  return {
    invocation,
    declaration: {
      scenario_key: "nurture",
      endpoint_key: invocation.route.endpoint_key,
      method: "POST",
      operation_key: operationKey,
      input_schema_version: 1,
      ingress_category: "host_transition",
      ingress_key: invocation.route.ingress.ingress_key,
      principal_origins: ["interactive_session"],
    },
  };
}

function ref(objectType: string, objectId: string) {
  return {
    schema_version: 1 as const,
    namespace: "my_chat",
    object_type: objectType,
    object_id: objectId,
  };
}

function safeReason() {
  return {
    reason_code: "unavailable",
    message: { kind: "plain_text" as const, value: "Unavailable.", locale: "en" },
    retry_class: "refresh" as const,
  };
}
