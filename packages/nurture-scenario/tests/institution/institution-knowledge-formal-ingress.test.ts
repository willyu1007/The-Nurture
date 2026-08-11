import type { WorkflowVerifiedScenarioInvocationV1 } from "@my-chat/workflow-contracts";
import { describe, expect, it, vi } from "vitest";
import {
  createNurtureInstitutionKnowledgeFormalInvocationHandlers,
  NURTURE_INSTITUTION_KNOWLEDGE_FORMAL_HANDLER_KEYS,
} from "../../src/institution-knowledge-formal-ingress.js";
import {
  defaultNurtureInstitutionKnowledgeSurfaceDeps,
} from "../../src/institution-knowledge-surfaces.js";

const authority = {
  workspace_id: "workspace-01",
  participant_ref: "participant-current-01",
  institution_ref: "institution-01",
  role_assignment_ref: "role-current-01",
  active_role: "institution_admin" as const,
  surface_key: "institution_workbench" as const,
  authority_version: "authority-v7",
  evaluated_at: "2026-08-11T00:00:00.000Z",
};

describe("Institution Knowledge formal trusted handlers", () => {
  it("prepares only through the fixed Workbench surface", async () => {
    const prepare = vi.fn(async () => ({
      status: "ready_to_confirm" as const,
      command_request_id: "command-request-01",
      confirmation_ref: "owner-confirmation-ref-01",
      expires_at: "2026-08-11T00:01:00.000Z",
      effect: "publish_institution_knowledge_revision" as const,
    }));
    const handlers = createNurtureInstitutionKnowledgeFormalInvocationHandlers({
      surfaceDeps: defaultNurtureInstitutionKnowledgeSurfaceDeps,
      preparedCommandOwner: {
        prepare,
        consumeConfirmed: async () => ({ status: "unavailable", reason_code: "unused" }),
      },
    });
    await expect(handlers[NURTURE_INSTITUTION_KNOWLEDGE_FORMAL_HANDLER_KEYS.prepare]?.(
      verified("prepare", {
        contractVersion: 1,
        clientCommandId: "client-command-01",
        request: commandIntent(),
      }),
    )).resolves.toMatchObject({ status: "ready_to_confirm" });
    expect(prepare).toHaveBeenCalledWith(expect.objectContaining({
      client_surface: "web_run_workbench",
      command: expect.objectContaining({ clientCommandId: "client-command-01" }),
    }));
  });

  it("consumes an owner-held payload and rechecks the exact local authority", async () => {
    const resolve = vi.fn(async () => ({
      status: "denied" as const,
      reason_code: "sentinel_after_authority_recheck",
    }));
    const createForPrincipal = vi.fn(() => ({
      retrieveCandidates: async () => ({ status: "resolved" as const, candidates: [] }),
    }));
    const handlers = createNurtureInstitutionKnowledgeFormalInvocationHandlers({
      surfaceDeps: {
        ...defaultNurtureInstitutionKnowledgeSurfaceDeps,
        bindings: { resolve },
      },
      preparedCommandOwner: {
        prepare: async () => ({ status: "unavailable", reason_code: "unused" }),
        consumeConfirmed: async () => ({
          status: "resolved",
          command_request_id: "command-request-01",
          frozen_request: {
            ...commandIntent(),
            confirmationRef: "owner-confirmation-ref-01",
          },
          authority,
        }),
      },
      authorizedRetrievalOwnerFactory: { createForPrincipal },
    });
    await expect(handlers[NURTURE_INSTITUTION_KNOWLEDGE_FORMAL_HANDLER_KEYS.execute]?.(
      verified("execute", executeInput()),
    )).resolves.toEqual({
      status: "denied",
      reason_code: "sentinel_after_authority_recheck",
    });
    expect(resolve).toHaveBeenCalledWith(expect.objectContaining({
      trusted: {
        workspace_id: "workspace-01",
        actor_participant_ref: "participant-current-01",
        invocation_request_id: "invocation-01",
        command_request_id: "command-request-01",
        client_surface: "web_run_workbench",
      },
    }));
    expect(createForPrincipal).toHaveBeenCalledTimes(1);
  });

  it("rejects command/confirmation drift before business binding", async () => {
    const resolve = vi.fn();
    const handlers = createNurtureInstitutionKnowledgeFormalInvocationHandlers({
      surfaceDeps: {
        ...defaultNurtureInstitutionKnowledgeSurfaceDeps,
        bindings: { resolve },
      },
      preparedCommandOwner: {
        prepare: async () => ({ status: "unavailable", reason_code: "unused" }),
        consumeConfirmed: async () => ({
          status: "resolved",
          command_request_id: "different-command-request",
          frozen_request: {
            ...commandIntent(),
            confirmationRef: "different-confirmation-ref",
          },
          authority,
        }),
      },
      authorizedRetrievalOwnerFactory: {
        createForPrincipal: () => ({
          retrieveCandidates: async () => ({ status: "resolved", candidates: [] }),
        }),
      },
    });
    await expect(handlers[NURTURE_INSTITUTION_KNOWLEDGE_FORMAL_HANDLER_KEYS.execute]?.(
      verified("execute", executeInput()),
    )).resolves.toEqual({
      status: "conflict",
      reason_code: "prepared_command_binding_drift",
    });
    expect(resolve).not.toHaveBeenCalled();
  });
});

function commandIntent() {
  return {
    capabilityKey: "publish_institution_knowledge_revision" as const,
    capabilityVersion: "1.0.0" as const,
    targetOptionRef: "revision-option-01",
    operationInput: {},
  };
}

function executeInput() {
  return {
    contractVersion: 1,
    commandRequestId: "command-request-01",
    confirmationRef: "owner-confirmation-ref-01",
  };
}

function verified(
  lane: "query" | "prepare" | "execute",
  input: unknown,
): WorkflowVerifiedScenarioInvocationV1 {
  const bindings = {
    query: ["nurture.institution_knowledge.query", "query_institution_knowledge"],
    prepare: ["nurture.institution_knowledge.command.prepare", "prepare_institution_knowledge_command"],
    execute: ["nurture.institution_knowledge.command.execute", "execute_prepared_institution_knowledge_command"],
  } as const;
  const [endpointKey, operationKey] = bindings[lane];
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
