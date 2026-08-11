import type { WorkflowVerifiedScenarioInvocationV1 } from "@my-chat/workflow-contracts";
import { describe, expect, it, vi } from "vitest";
import {
  createNurtureInstitutionKnowledgeTrustedInvocationHandlers,
  NURTURE_INSTITUTION_KNOWLEDGE_TRUSTED_HANDLER_KEYS,
} from "../../src/institution-knowledge-trusted-ingress.js";
import {
  defaultNurtureInstitutionKnowledgeSurfaceDeps,
} from "../../src/institution-knowledge-surfaces.js";

describe("Institution Knowledge trusted ingress", () => {
  it("uses current participant resolution and a caller-stable command id", async () => {
    const resolve = vi.fn(async () => ({
      status: "denied" as const,
      reason_code: "sentinel_binding_denied",
    }));
    const createForPrincipal = vi.fn(() => ({
      retrieveCandidates: async () => ({ status: "resolved" as const, candidates: [] }),
    }));
    const handlers = createNurtureInstitutionKnowledgeTrustedInvocationHandlers({
      surfaceDeps: { ...defaultNurtureInstitutionKnowledgeSurfaceDeps, bindings: { resolve } },
      participantResolver: {
        resolveCurrentParticipant: async () => ({
          status: "resolved",
          participant_ref: "participant-current-01",
        }),
      },
      authorizedRetrievalOwnerFactory: { createForPrincipal },
    });
    const handler = handlers[NURTURE_INSTITUTION_KNOWLEDGE_TRUSTED_HANDLER_KEYS.execute];

    await expect(handler?.(verified({
      commandRequestId: "command-stable-01",
      request: {
        capabilityKey: "publish_institution_knowledge_revision",
        capabilityVersion: "1.0.0",
        targetOptionRef: "revision-option-01",
        confirmationRef: "confirmation-01",
        operationInput: {},
      },
    }))).resolves.toEqual({
      status: "denied",
      reason_code: "sentinel_binding_denied",
    });
    expect(createForPrincipal).toHaveBeenCalledWith(expect.objectContaining({
      actor_ref: expect.objectContaining({ object_id: "actor-01" }),
    }));
    expect(resolve).toHaveBeenCalledWith(expect.objectContaining({
      trusted: {
        workspace_id: "workspace-01",
        actor_participant_ref: "participant-current-01",
        invocation_request_id: "invocation-01",
        command_request_id: "command-stable-01",
        client_surface: "web_run_workbench",
      },
    }));
  });

  it("fails closed without owner dependencies or an exact command shape", async () => {
    const handlers = createNurtureInstitutionKnowledgeTrustedInvocationHandlers({
      surfaceDeps: defaultNurtureInstitutionKnowledgeSurfaceDeps,
    });
    const handler = handlers[NURTURE_INSTITUTION_KNOWLEDGE_TRUSTED_HANDLER_KEYS.execute];
    await expect(handler?.(verified({ request: {} }))).resolves.toEqual({
      status: "invalid",
      reason_code: "invalid_institution_knowledge_trusted_input",
    });
    await expect(handler?.(verified({
      commandRequestId: "command-01",
      request: {
        capabilityKey: "publish_institution_knowledge_revision",
        capabilityVersion: "1.0.0",
        targetOptionRef: "revision-option-01",
        confirmationRef: "confirmation-01",
        operationInput: {},
      },
    }))).resolves.toEqual({
      status: "unavailable",
      reason_code: "institution_knowledge_trusted_ingress_unavailable",
    });
  });
});

function verified(input: unknown): WorkflowVerifiedScenarioInvocationV1 {
  const endpointKey = "nurture.institution_knowledge.execute";
  const operationKey = "execute_institution_knowledge";
  return {
    declaration: {
      scenario_key: "nurture",
      endpoint_key: endpointKey,
      method: "POST",
      operation_key: operationKey,
      input_schema_version: 1,
      ingress_category: "host_transition",
      ingress_key: endpointKey,
      principal_origins: ["interactive_session"],
    },
    invocation: {
      invocation_version: 1,
      contract_version: 1,
      contract_hash: "a".repeat(64),
      issuer: "my_chat",
      assertion_audience: "nurture",
      caller_binding: { caller_subject: "my-chat-host" },
      principal: {
        principal_version: 1,
        principal_kind: "human_user",
        principal_origin: "interactive_session",
        account_ref: ref("user", "user-01"),
        actor_ref: ref("actor", "actor-01"),
        workspace_ref: ref("workspace", "workspace-01"),
      },
      route: {
        scenario_key: "nurture",
        endpoint_key: endpointKey,
        method: "POST",
        ingress: {
          ingress_version: 1,
          ingress_category: "host_transition",
          ingress_key: endpointKey,
        },
      },
      request: {
        request_id: "invocation-01",
        correlation_id: "correlation-01",
        issued_at: "2026-08-11T00:00:00.000Z",
        expires_at: "2026-08-11T00:01:00.000Z",
        nonce: "nonce-01",
      },
      operation: { operation_key: operationKey, input_schema_version: 1, input },
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
