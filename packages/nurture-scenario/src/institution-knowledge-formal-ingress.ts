import type {
  WorkflowTrustedInvocationHandlerRegistry,
  WorkflowVerifiedScenarioInvocationV1,
} from "@my-chat/workflow-contracts";
import type { InstitutionKnowledgeRetrievalOwnerPortV1 } from "./domain/institution/institution-knowledge-retrieval.js";
import {
  NURTURE_INSTITUTION_KNOWLEDGE_FORMAL_INGRESS_V1,
  parseNurtureInstitutionKnowledgeFormalExecuteInputV1,
  parseNurtureInstitutionKnowledgeFormalPrepareInputV1,
  parseNurtureInstitutionKnowledgeFormalQueryInputV1,
  type NurtureInstitutionKnowledgeFormalAuthorityResolverV1,
  type NurtureInstitutionKnowledgeLocalAuthorityV1,
  type NurtureInstitutionKnowledgePreparedCommandOwnerV1,
} from "./institution-knowledge-formal-ingress-contract.js";
import {
  NurtureInstitutionKnowledgeSurfaceHandler,
  parseNurtureInstitutionKnowledgeSurfaceRequest,
  type NurtureInstitutionKnowledgeSurfaceRequest,
  type NurtureInstitutionKnowledgeBindingPort,
  type NurtureInstitutionKnowledgeSurfaceDeps,
  type NurtureInstitutionKnowledgeTrustedContextV1,
} from "./institution-knowledge-surfaces.js";

export const NURTURE_INSTITUTION_KNOWLEDGE_FORMAL_HANDLER_KEYS = Object.freeze({
  query: NURTURE_INSTITUTION_KNOWLEDGE_FORMAL_INGRESS_V1.query.handler_key,
  prepare: NURTURE_INSTITUTION_KNOWLEDGE_FORMAL_INGRESS_V1.prepare.handler_key,
  execute: NURTURE_INSTITUTION_KNOWLEDGE_FORMAL_INGRESS_V1.execute.handler_key,
} as const);

export type NurtureInstitutionKnowledgeAuthorizedRetrievalOwnerFactoryPortV1 = {
  createForPrincipal(
    principal: WorkflowVerifiedScenarioInvocationV1["invocation"]["principal"],
  ): InstitutionKnowledgeRetrievalOwnerPortV1 & {
    assertStillAuthorized(input: {
      workspace_id: string;
      institution_ref: string;
    }): Promise<"authorized" | "unavailable">;
  };
};

export type NurtureInstitutionKnowledgeFormalIngressDeps = {
  surfaceDeps: NurtureInstitutionKnowledgeSurfaceDeps;
  authorityResolver?: NurtureInstitutionKnowledgeFormalAuthorityResolverV1;
  preparedCommandOwner?: NurtureInstitutionKnowledgePreparedCommandOwnerV1;
  authorizedRetrievalOwnerFactory?: NurtureInstitutionKnowledgeAuthorizedRetrievalOwnerFactoryPortV1;
};

export function createNurtureInstitutionKnowledgeFormalInvocationHandlers(
  deps: NurtureInstitutionKnowledgeFormalIngressDeps,
): WorkflowTrustedInvocationHandlerRegistry {
  return Object.freeze({
    [NURTURE_INSTITUTION_KNOWLEDGE_FORMAL_HANDLER_KEYS.query]:
      (verified) => query(verified, deps),
    [NURTURE_INSTITUTION_KNOWLEDGE_FORMAL_HANDLER_KEYS.prepare]:
      (verified) => prepare(verified, deps),
    [NURTURE_INSTITUTION_KNOWLEDGE_FORMAL_HANDLER_KEYS.execute]:
      (verified) => execute(verified, deps),
  });
}

async function query(
  verified: WorkflowVerifiedScenarioInvocationV1,
  deps: NurtureInstitutionKnowledgeFormalIngressDeps,
): Promise<unknown> {
  if (!matchesOperation(verified, "query")) return declarationDrift();
  const input = parseNurtureInstitutionKnowledgeFormalQueryInputV1(
    verified.invocation.operation.input,
  );
  if (!input) return invalid();
  if (!deps.authorityResolver) return unavailable();
  try {
    const resolution = await resolveCurrentAuthority(verified, deps, input.request);
    if (resolution.status !== "resolved") return resolution;
    return await invokeSurface(
      verified,
      deps,
      resolution.authority,
      input.request,
      verified.invocation.request.request_id,
    );
  } catch {
    return unavailable();
  }
}

async function prepare(
  verified: WorkflowVerifiedScenarioInvocationV1,
  deps: NurtureInstitutionKnowledgeFormalIngressDeps,
): Promise<unknown> {
  if (!matchesOperation(verified, "prepare")) return declarationDrift();
  const input = parseNurtureInstitutionKnowledgeFormalPrepareInputV1(
    verified.invocation.operation.input,
  );
  if (!input) return invalid();
  if (!deps.preparedCommandOwner || !deps.authorityResolver) return unavailable();
  try {
    const resolution = await resolveCurrentAuthority(verified, deps, input.request);
    if (resolution.status !== "resolved") return resolution;
    const prepared = await deps.preparedCommandOwner.prepare({
      principal: verified.invocation.principal,
      invocation_request_id: verified.invocation.request.request_id,
      client_surface: NURTURE_INSTITUTION_KNOWLEDGE_FORMAL_INGRESS_V1.client_surface,
      authority: resolution.authority,
      command: input,
    });
    return normalizePreparedResult(prepared, input.request.capabilityKey);
  } catch {
    return unavailable();
  }
}

async function execute(
  verified: WorkflowVerifiedScenarioInvocationV1,
  deps: NurtureInstitutionKnowledgeFormalIngressDeps,
): Promise<unknown> {
  if (!matchesOperation(verified, "execute")) return declarationDrift();
  const input = parseNurtureInstitutionKnowledgeFormalExecuteInputV1(
    verified.invocation.operation.input,
  );
  if (!input) return invalid();
  if (!deps.preparedCommandOwner || !deps.authorityResolver) return unavailable();
  try {
    const consumed = normalizeConsumedResult(
      await deps.preparedCommandOwner.consumeConfirmed({
      principal: verified.invocation.principal,
      invocation_request_id: verified.invocation.request.request_id,
      client_surface: NURTURE_INSTITUTION_KNOWLEDGE_FORMAL_INGRESS_V1.client_surface,
      command: input,
      }),
    );
    if (consumed.status !== "resolved") return consumed;
    if (
      consumed.command_request_id !== input.commandRequestId ||
      consumed.frozen_request.confirmationRef !== input.confirmationRef
    ) return { status: "conflict", reason_code: "prepared_command_binding_drift" };
    const current = await resolveCurrentAuthority(verified, deps, consumed.frozen_request);
    if (current.status !== "resolved") return current;
    if (!sameAuthority(consumed.authority, current.authority)) {
      return { status: "denied", reason_code: "institution_authority_snapshot_drift" };
    }
    return await invokeSurface(
      verified,
      deps,
      current.authority,
      consumed.frozen_request,
      consumed.command_request_id,
    );
  } catch {
    return unavailable();
  }
}

async function invokeSurface(
  verified: WorkflowVerifiedScenarioInvocationV1,
  deps: NurtureInstitutionKnowledgeFormalIngressDeps,
  authority: NurtureInstitutionKnowledgeLocalAuthorityV1,
  request: NurtureInstitutionKnowledgeSurfaceRequest,
  commandRequestId: string,
): Promise<unknown> {
  const workspaceId = verified.invocation.principal.workspace_ref.object_id;
  if (authority.workspace_id !== workspaceId) {
    return { status: "denied", reason_code: "institution_authority_workspace_drift" };
  }
  const trusted: NurtureInstitutionKnowledgeTrustedContextV1 = {
    workspace_id: workspaceId,
    actor_participant_ref: authority.participant_ref,
    invocation_request_id: verified.invocation.request.request_id,
    command_request_id: commandRequestId,
    client_surface: NURTURE_INSTITUTION_KNOWLEDGE_FORMAL_INGRESS_V1.client_surface,
  };
  let retrievalOwner = deps.surfaceDeps.retrievalOwner;
  let hostAccess: Awaited<ReturnType<
    NurtureInstitutionKnowledgeAuthorizedRetrievalOwnerFactoryPortV1["createForPrincipal"]
  >> | undefined;
  if (request.capabilityKey === "answer_institution_knowledge") {
    if (!deps.authorizedRetrievalOwnerFactory) return unavailable();
    try {
      hostAccess = deps.authorizedRetrievalOwnerFactory.createForPrincipal(
        verified.invocation.principal,
      );
    } catch {
      return unavailable();
    }
    if (
      !hostAccess
      || typeof hostAccess.retrieveCandidates !== "function"
      || typeof hostAccess.assertStillAuthorized !== "function"
    ) return unavailable();
    retrievalOwner = hostAccess;
  }
  const handler = new NurtureInstitutionKnowledgeSurfaceHandler({
    ...deps.surfaceDeps,
    bindings: authorityBoundBindings(deps.surfaceDeps.bindings, authority),
    adminAuthority: {
      authorize: async (context) => {
        let admitted: "authorized" | "denied" | "unavailable";
        try {
          admitted = await deps.surfaceDeps.adminAuthority.authorize(context);
        } catch {
          return "unavailable";
        }
        if (admitted !== "authorized") return admitted;
        let current;
        try {
          current = await resolveCurrentAuthority(verified, deps, request);
        } catch {
          return "unavailable";
        }
        if (current.status !== "resolved" || !sameAuthority(authority, current.authority)) {
          return current.status === "denied" ? "denied" : "unavailable";
        }
        return hostAccess
          ? hostAccess.assertStillAuthorized({
              workspace_id: context.workspace_id,
              institution_ref: context.institution_ref,
            }).catch(() => "unavailable" as const)
          : "authorized";
      },
    },
    retrievalOwner,
  });
  return handler.handle(request, trusted);
}

function authorityBoundBindings(
  source: NurtureInstitutionKnowledgeBindingPort,
  authority: NurtureInstitutionKnowledgeLocalAuthorityV1,
): NurtureInstitutionKnowledgeBindingPort {
  return {
    async resolve(input) {
      const result = await source.resolve(input);
      if (result.status !== "resolved") return result;
      const binding = result.binding;
      return binding.workspace_id === authority.workspace_id &&
        binding.actor_participant_ref === authority.participant_ref &&
        binding.institution_ref === authority.institution_ref &&
        binding.role_assignment_ref === authority.role_assignment_ref &&
        binding.active_role === authority.active_role &&
        binding.surface_key === authority.surface_key
        ? result
        : { status: "unavailable", reason_code: "institution_authority_binding_drift" };
    },
  };
}

async function resolveCurrentAuthority(
  verified: WorkflowVerifiedScenarioInvocationV1,
  deps: NurtureInstitutionKnowledgeFormalIngressDeps,
  request: {
    capabilityKey: NurtureInstitutionKnowledgeSurfaceRequest["capabilityKey"];
    targetOptionRef: string;
  },
) {
  if (!deps.authorityResolver) return unavailable();
  return normalizeAuthorityResolution(
    await deps.authorityResolver.resolveCurrent({
      principal: verified.invocation.principal,
      invocation_request_id: verified.invocation.request.request_id,
      declared_operation_key: verified.declaration.operation_key,
      capability_key: request.capabilityKey,
      target_option_ref: request.targetOptionRef,
    }),
  );
}

function normalizeAuthorityResolution(
  value: Awaited<ReturnType<NurtureInstitutionKnowledgeFormalAuthorityResolverV1["resolveCurrent"]>>,
) {
  if (value.status === "resolved") {
    return validAuthority(value.authority)
      ? { status: "resolved" as const, authority: { ...value.authority } }
      : unavailable("institution_knowledge_owner_response_invalid");
  }
  return validReasonCode(value.reason_code)
    ? { status: value.status, reason_code: value.reason_code }
    : unavailable("institution_knowledge_owner_response_invalid");
}

function normalizePreparedResult(
  value: Awaited<ReturnType<NurtureInstitutionKnowledgePreparedCommandOwnerV1["prepare"]>>,
  expectedEffect: NurtureInstitutionKnowledgeSurfaceRequest["capabilityKey"],
) {
  if (value.status === "ready_to_confirm") {
    if (
      !opaqueId(value.command_request_id) ||
      !opaqueRef(value.confirmation_ref) ||
      !canonicalInstant(value.expires_at) ||
      value.effect !== expectedEffect
    ) {
      return unavailable("institution_knowledge_owner_response_invalid");
    }
    return {
      status: "ready_to_confirm" as const,
      command_request_id: value.command_request_id,
      confirmation_ref: value.confirmation_ref,
      expires_at: value.expires_at,
      effect: value.effect,
    };
  }
  return validReasonCode(value.reason_code)
    ? { status: value.status, reason_code: value.reason_code }
    : unavailable("institution_knowledge_owner_response_invalid");
}

function normalizeConsumedResult(
  value: Awaited<ReturnType<NurtureInstitutionKnowledgePreparedCommandOwnerV1["consumeConfirmed"]>>,
) {
  if (value.status !== "resolved") {
    return validReasonCode(value.reason_code)
      ? { status: value.status, reason_code: value.reason_code }
      : unavailable("institution_knowledge_owner_response_invalid");
  }
  const frozenRequest = parseNurtureInstitutionKnowledgeSurfaceRequest(
    value.frozen_request,
  );
  if (
    !opaqueId(value.command_request_id) ||
    !frozenRequest ||
    frozenRequest.capabilityKey === "query_institution_knowledge_preview" ||
    !validAuthority(value.authority)
  ) {
    return unavailable("institution_knowledge_owner_response_invalid");
  }
  return {
    status: "resolved" as const,
    command_request_id: value.command_request_id,
    frozen_request: frozenRequest,
    authority: { ...value.authority },
  };
}

function validAuthority(
  value: unknown,
): value is NurtureInstitutionKnowledgeLocalAuthorityV1 {
  return isRecord(value) && exactKeys(value, [
    "active_role",
    "authority_version",
    "evaluated_at",
    "institution_ref",
    "participant_ref",
    "role_assignment_ref",
    "surface_key",
    "workspace_id",
  ]) &&
    opaqueId(value.workspace_id) &&
    opaqueId(value.participant_ref) &&
    opaqueId(value.institution_ref) &&
    opaqueId(value.role_assignment_ref) &&
    value.active_role === "institution_admin" &&
    value.surface_key === "institution_workbench" &&
    opaqueId(value.authority_version) &&
    canonicalInstant(value.evaluated_at);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function exactKeys(value: object, expected: readonly string[]): boolean {
  const keys = Object.keys(value);
  return keys.length === expected.length &&
    expected.every((key) => Object.prototype.hasOwnProperty.call(value, key));
}

function opaqueId(value: unknown): value is string {
  return typeof value === "string" &&
    /^[A-Za-z0-9][A-Za-z0-9._:~-]{0,190}$/u.test(value);
}

function opaqueRef(value: unknown): value is string {
  return typeof value === "string" &&
    /^[A-Za-z0-9][A-Za-z0-9._:~=-]{15,511}$/u.test(value);
}

function validReasonCode(value: unknown): value is string {
  return typeof value === "string" && /^[a-z][a-z0-9_]{0,119}$/u.test(value);
}

function canonicalInstant(value: unknown): value is string {
  return typeof value === "string" &&
    !Number.isNaN(Date.parse(value)) &&
    new Date(value).toISOString() === value;
}

function sameAuthority(
  prepared: NurtureInstitutionKnowledgeLocalAuthorityV1,
  current: NurtureInstitutionKnowledgeLocalAuthorityV1,
): boolean {
  return prepared.workspace_id === current.workspace_id &&
    prepared.participant_ref === current.participant_ref &&
    prepared.institution_ref === current.institution_ref &&
    prepared.role_assignment_ref === current.role_assignment_ref &&
    prepared.active_role === current.active_role &&
    prepared.surface_key === current.surface_key &&
    prepared.authority_version === current.authority_version;
}

function matchesOperation(
  verified: WorkflowVerifiedScenarioInvocationV1,
  lane: "query" | "prepare" | "execute",
): boolean {
  const contract = NURTURE_INSTITUTION_KNOWLEDGE_FORMAL_INGRESS_V1[lane];
  const invocation = verified.invocation;
  const declaration = verified.declaration;
  return declaration.scenario_key === "nurture" &&
    declaration.method === contract.method &&
    declaration.endpoint_key === contract.endpoint_key &&
    declaration.operation_key === contract.operation_key &&
    declaration.input_schema_version === contract.input_schema_version &&
    declaration.ingress_category === NURTURE_INSTITUTION_KNOWLEDGE_FORMAL_INGRESS_V1.ingress_category &&
    declaration.ingress_key === contract.ingress_key &&
    declaration.principal_origins.length === 1 &&
    declaration.principal_origins[0] === NURTURE_INSTITUTION_KNOWLEDGE_FORMAL_INGRESS_V1.principal_origin &&
    invocation.route.scenario_key === declaration.scenario_key &&
    invocation.route.method === declaration.method &&
    invocation.route.endpoint_key === declaration.endpoint_key &&
    invocation.route.ingress.ingress_category === declaration.ingress_category &&
    invocation.route.ingress.ingress_key === declaration.ingress_key &&
    invocation.operation.operation_key === declaration.operation_key &&
    invocation.operation.input_schema_version === declaration.input_schema_version &&
    invocation.principal.principal_origin === declaration.principal_origins[0];
}

function invalid() {
  return { status: "invalid" as const, reason_code: "invalid_institution_knowledge_formal_input" };
}

function unavailable(
  reasonCode = "institution_knowledge_formal_ingress_unavailable",
) {
  return { status: "unavailable" as const, reason_code: reasonCode };
}

function declarationDrift() {
  return { status: "unavailable" as const, reason_code: "institution_knowledge_formal_declaration_drift" };
}
