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
    const resolveCurrent = vi.fn(async () => ({
      status: "resolved" as const,
      authority,
    }));
    const prepare = vi.fn(async () => ({
      status: "ready_to_confirm" as const,
      command_request_id: "command-request-01",
      confirmation_ref: "owner-confirmation-ref-01",
      expires_at: "2026-08-11T00:01:00.000Z",
      effect: "publish_institution_knowledge_revision" as const,
    }));
    const handlers = createNurtureInstitutionKnowledgeFormalInvocationHandlers({
      surfaceDeps: defaultNurtureInstitutionKnowledgeSurfaceDeps,
      authorityResolver: { resolveCurrent },
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
      authority,
      command: expect.objectContaining({ clientCommandId: "client-command-01" }),
    }));
    expect(resolveCurrent).toHaveBeenCalledWith(expect.objectContaining({
      declared_operation_key: "prepare_institution_knowledge_command",
      capability_key: "publish_institution_knowledge_revision",
      target_option_ref: "revision-option-01",
    }));
  });

  it("rejects a prepared result whose effect does not match the frozen intent", async () => {
    const handlers = createNurtureInstitutionKnowledgeFormalInvocationHandlers({
      surfaceDeps: defaultNurtureInstitutionKnowledgeSurfaceDeps,
      authorityResolver: {
        resolveCurrent: async () => ({ status: "resolved", authority }),
      },
      preparedCommandOwner: {
        prepare: async () => ({
          status: "ready_to_confirm",
          command_request_id: "command-request-01",
          confirmation_ref: "owner-confirmation-ref-01",
          expires_at: "2026-08-11T00:01:00.000Z",
          effect: "revoke_institution_knowledge_revision",
        }),
        consumeConfirmed: async () => ({ status: "unavailable", reason_code: "unused" }),
      },
    });
    await expect(handlers[NURTURE_INSTITUTION_KNOWLEDGE_FORMAL_HANDLER_KEYS.prepare]?.(
      verified("prepare", {
        contractVersion: 1,
        clientCommandId: "client-command-01",
        request: commandIntent(),
      }),
    )).resolves.toEqual({
      status: "unavailable",
      reason_code: "institution_knowledge_owner_response_invalid",
    });
  });

  it("consumes an owner-held payload and rechecks the exact local authority", async () => {
    const resolve = vi.fn(async () => ({
      status: "denied" as const,
      reason_code: "sentinel_after_authority_recheck",
    }));
    const resolveCurrent = vi.fn(async () => ({
      status: "resolved" as const,
      authority,
    }));
    const handlers = createNurtureInstitutionKnowledgeFormalInvocationHandlers({
      surfaceDeps: {
        ...defaultNurtureInstitutionKnowledgeSurfaceDeps,
        bindings: { resolve },
      },
      authorityResolver: { resolveCurrent },
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
    expect(resolveCurrent).toHaveBeenCalledWith(expect.objectContaining({
      declared_operation_key: "execute_prepared_institution_knowledge_command",
      capability_key: "publish_institution_knowledge_revision",
      target_option_ref: "revision-option-01",
    }));
  });

  it("rejects command/confirmation drift before business binding", async () => {
    const resolve = vi.fn();
    const resolveCurrent = vi.fn(async () => ({ status: "resolved" as const, authority }));
    const handlers = createNurtureInstitutionKnowledgeFormalInvocationHandlers({
      surfaceDeps: {
        ...defaultNurtureInstitutionKnowledgeSurfaceDeps,
        bindings: { resolve },
      },
      authorityResolver: { resolveCurrent },
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
    });
    await expect(handlers[NURTURE_INSTITUTION_KNOWLEDGE_FORMAL_HANDLER_KEYS.execute]?.(
      verified("execute", executeInput()),
    )).resolves.toEqual({
      status: "conflict",
      reason_code: "prepared_command_binding_drift",
    });
    expect(resolve).not.toHaveBeenCalled();
    expect(resolveCurrent).not.toHaveBeenCalled();
  });

  it("reparses owner-held commands before current-authority lookup", async () => {
    const resolve = vi.fn();
    const resolveCurrent = vi.fn();
    const handlers = createNurtureInstitutionKnowledgeFormalInvocationHandlers({
      surfaceDeps: {
        ...defaultNurtureInstitutionKnowledgeSurfaceDeps,
        bindings: { resolve },
      },
      authorityResolver: { resolveCurrent },
      preparedCommandOwner: {
        prepare: async () => ({ status: "unavailable", reason_code: "unused" }),
        consumeConfirmed: async () => ({
          status: "resolved",
          command_request_id: "command-request-01",
          frozen_request: {
            ...commandIntent(),
            confirmationRef: "owner-confirmation-ref-01",
            participantRef: "participant-injected-01",
          } as never,
          authority,
        }),
      },
    });
    await expect(handlers[NURTURE_INSTITUTION_KNOWLEDGE_FORMAL_HANDLER_KEYS.execute]?.(
      verified("execute", executeInput()),
    )).resolves.toEqual({
      status: "unavailable",
      reason_code: "institution_knowledge_owner_response_invalid",
    });
    expect(resolveCurrent).not.toHaveBeenCalled();
    expect(resolve).not.toHaveBeenCalled();
  });

  it("serves preview without requiring the My-Chat retrieval owner", async () => {
    const handlers = createNurtureInstitutionKnowledgeFormalInvocationHandlers({
      surfaceDeps: {
        ...defaultNurtureInstitutionKnowledgeSurfaceDeps,
        bindings: {
          resolve: async () => ({
            status: "resolved",
            binding: {
              capability_key: "query_institution_knowledge_preview",
              target_option_ref: "institution-option-01",
              workspace_id: authority.workspace_id,
              actor_participant_ref: authority.participant_ref,
              surface_key: authority.surface_key,
              active_role: authority.active_role,
              institution_ref: authority.institution_ref,
              role_assignment_ref: authority.role_assignment_ref,
              evaluated_at: authority.evaluated_at,
              authority_links: [],
            },
          }),
        },
        preview: { preview: async () => ({ status: "resolved", options: [] }) },
      },
      authorityResolver: {
        resolveCurrent: async () => ({ status: "resolved", authority }),
      },
    });
    await expect(handlers[NURTURE_INSTITUTION_KNOWLEDGE_FORMAL_HANDLER_KEYS.query]?.(
      verified("query", {
        contractVersion: 1,
        request: {
          capabilityKey: "query_institution_knowledge_preview",
          capabilityVersion: "1.0.0",
          targetOptionRef: "institution-option-01",
          operationInput: { revisionOptionRefs: ["revision-option-01"] },
        },
      }),
    )).resolves.toEqual({ status: "ok", result: { options: [] } });
  });

  it("fails closed on direct-registry declaration drift before owner calls", async () => {
    const prepare = vi.fn();
    const resolveCurrent = vi.fn();
    const handlers = createNurtureInstitutionKnowledgeFormalInvocationHandlers({
      surfaceDeps: defaultNurtureInstitutionKnowledgeSurfaceDeps,
      authorityResolver: { resolveCurrent },
      preparedCommandOwner: {
        prepare,
        consumeConfirmed: async () => ({ status: "unavailable", reason_code: "unused" }),
      },
    });
    const drifted = [
      verified("prepare", { contractVersion: 1, clientCommandId: "client-command-01", request: commandIntent() }),
      verified("prepare", { contractVersion: 1, clientCommandId: "client-command-01", request: commandIntent() }),
      verified("prepare", { contractVersion: 1, clientCommandId: "client-command-01", request: commandIntent() }),
    ];
    Reflect.set(drifted[0].declaration, "method", "GET");
    Reflect.set(drifted[1].invocation.route, "scenario_key", "other");
    Reflect.set(drifted[2].invocation.route, "method", "GET");
    for (const invocation of drifted) {
      await expect(handlers[NURTURE_INSTITUTION_KNOWLEDGE_FORMAL_HANDLER_KEYS.prepare]?.(
        invocation,
      )).resolves.toEqual({
        status: "unavailable",
        reason_code: "institution_knowledge_formal_declaration_drift",
      });
    }
    expect(resolveCurrent).not.toHaveBeenCalled();
    expect(prepare).not.toHaveBeenCalled();
  });

  it("rechecks current authority and denies a prepared authority-version drift", async () => {
    const resolve = vi.fn();
    const handlers = createNurtureInstitutionKnowledgeFormalInvocationHandlers({
      surfaceDeps: {
        ...defaultNurtureInstitutionKnowledgeSurfaceDeps,
        bindings: { resolve },
      },
      authorityResolver: {
        resolveCurrent: async () => ({
          status: "resolved",
          authority: { ...authority, authority_version: "authority-v8" },
        }),
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
    });
    await expect(handlers[NURTURE_INSTITUTION_KNOWLEDGE_FORMAL_HANDLER_KEYS.execute]?.(
      verified("execute", executeInput()),
    )).resolves.toEqual({
      status: "denied",
      reason_code: "institution_authority_snapshot_drift",
    });
    expect(resolve).not.toHaveBeenCalled();
  });

  it("keeps every formal lane unavailable when production owners are absent", async () => {
    const handlers = createNurtureInstitutionKnowledgeFormalInvocationHandlers({
      surfaceDeps: defaultNurtureInstitutionKnowledgeSurfaceDeps,
    });
    const inputs = {
      query: {
        contractVersion: 1,
        request: {
          capabilityKey: "query_institution_knowledge_preview",
          capabilityVersion: "1.0.0",
          targetOptionRef: "institution-option-01",
          operationInput: { revisionOptionRefs: ["revision-option-01"] },
        },
      },
      prepare: {
        contractVersion: 1,
        clientCommandId: "client-command-01",
        request: commandIntent(),
      },
      execute: executeInput(),
    } as const;
    for (const lane of ["query", "prepare", "execute"] as const) {
      await expect(handlers[NURTURE_INSTITUTION_KNOWLEDGE_FORMAL_HANDLER_KEYS[lane]]?.(
        verified(lane, inputs[lane]),
      )).resolves.toEqual({
        status: "unavailable",
        reason_code: "institution_knowledge_formal_ingress_unavailable",
      });
    }
  });

  it("does not forward malformed authority-owner reason codes", async () => {
    const handlers = createNurtureInstitutionKnowledgeFormalInvocationHandlers({
      surfaceDeps: defaultNurtureInstitutionKnowledgeSurfaceDeps,
      authorityResolver: {
        resolveCurrent: async () => ({
          status: "denied",
          reason_code: "raw internal authority/id",
        }),
      },
    });
    await expect(handlers[NURTURE_INSTITUTION_KNOWLEDGE_FORMAL_HANDLER_KEYS.query]?.(
      verified("query", {
        contractVersion: 1,
        request: {
          capabilityKey: "query_institution_knowledge_preview",
          capabilityVersion: "1.0.0",
          targetOptionRef: "institution-option-01",
          operationInput: { revisionOptionRefs: ["revision-option-01"] },
        },
      }),
    )).resolves.toEqual({
      status: "unavailable",
      reason_code: "institution_knowledge_owner_response_invalid",
    });
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
