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
    }))).resolves.toEqual(expect.objectContaining({
      status: "unavailable",
      safe_reason: expect.objectContaining({ reason_code: "subject_unavailable" }),
    }));
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

  it.each([
    ["endpoint", (value: WorkflowVerifiedScenarioInvocationV1) => {
      value.invocation.route.endpoint_key = "nurture.subject_context.resolve";
    }],
    ["schema", (value: WorkflowVerifiedScenarioInvocationV1) => {
      value.declaration.input_schema_version = 2;
    }],
    ["ingress", (value: WorkflowVerifiedScenarioInvocationV1) => {
      value.invocation.route.ingress.ingress_key = "nurture.subject_context.resolve";
    }],
    ["origin", (value: WorkflowVerifiedScenarioInvocationV1) => {
      value.invocation.principal.principal_origin = "durable_run_actor";
    }],
  ] as const)("fails safe-unavailable on %s drift before owner dispatch", async (_label, mutate) => {
    const list = vi.fn();
    const handlers = createNurtureC30TrustedInvocationHandlers({
      list,
      resolve: vi.fn(),
      present: vi.fn(),
    });
    const drifted = verified("list_subject_contexts", { input_version: 1 });
    mutate(drifted);

    await expect(handlers["nurture.c30.list_subject_contexts.transport"]?.(
      drifted,
    )).resolves.toEqual(expect.objectContaining({
      status: "unavailable",
      safe_reason: expect.objectContaining({ reason_code: "authority_changed" }),
    }));
    expect(list).not.toHaveBeenCalled();
  });
});

function verified(
  operationKey: "list_subject_contexts" | "resolve_subject_context" | "present_subject_context",
  input: unknown,
): WorkflowVerifiedScenarioInvocationV1 {
  const binding = operationBinding(operationKey);
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
      endpoint_key: binding.endpoint_key,
      method: "POST",
      ingress: {
        ingress_version: 1,
        ingress_category: binding.ingress_category,
        ingress_key: binding.ingress_key,
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
      ingress_category: binding.ingress_category,
      ingress_key: binding.ingress_key,
      principal_origins: ["interactive_session"],
    },
  };
}

function operationBinding(
  operationKey: "list_subject_contexts" | "resolve_subject_context" | "present_subject_context",
) {
  if (operationKey === "list_subject_contexts") return {
    endpoint_key: "nurture.subject_context.list",
    ingress_category: "host_transition" as const,
    ingress_key: "nurture.subject_context.list",
  };
  if (operationKey === "resolve_subject_context") return {
    endpoint_key: "nurture.subject_context.resolve",
    ingress_category: "host_transition" as const,
    ingress_key: "nurture.subject_context.resolve",
  };
  return {
    endpoint_key: "nurture.subject_context.present",
    ingress_category: "product_surface" as const,
    ingress_key: "nurture.child_care_process_overview_v1",
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
    reason_code: "subject_unavailable",
    message: { kind: "plain_text" as const, value: "Unavailable.", locale: "en" },
    retry_class: "refresh" as const,
  };
}
