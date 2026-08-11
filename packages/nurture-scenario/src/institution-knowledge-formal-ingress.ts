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
  type NurtureInstitutionKnowledgeBindingPort,
  type NurtureInstitutionKnowledgeSurfaceDeps,
  type NurtureInstitutionKnowledgeTrustedContextV1,
} from "./institution-knowledge-surfaces.js";

export const NURTURE_INSTITUTION_KNOWLEDGE_FORMAL_HANDLER_KEYS = Object.freeze({
  query: "nurture.institution_knowledge.query.formal.v1",
  prepare: "nurture.institution_knowledge.command.prepare.formal.v1",
  execute: "nurture.institution_knowledge.command.execute.formal.v1",
} as const);

export type NurtureInstitutionKnowledgeAuthorizedRetrievalOwnerFactoryV1 = {
  createForPrincipal(
    principal: WorkflowVerifiedScenarioInvocationV1["invocation"]["principal"],
  ): InstitutionKnowledgeRetrievalOwnerPortV1;
};

export type NurtureInstitutionKnowledgeFormalIngressDeps = {
  surfaceDeps: NurtureInstitutionKnowledgeSurfaceDeps;
  authorityResolver?: NurtureInstitutionKnowledgeFormalAuthorityResolverV1;
  preparedCommandOwner?: NurtureInstitutionKnowledgePreparedCommandOwnerV1;
  authorizedRetrievalOwnerFactory?: NurtureInstitutionKnowledgeAuthorizedRetrievalOwnerFactoryV1;
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
  assertOperation(verified, "query");
  const input = parseNurtureInstitutionKnowledgeFormalQueryInputV1(
    verified.invocation.operation.input,
  );
  if (!input) return invalid();
  if (!deps.authorityResolver || !deps.authorizedRetrievalOwnerFactory) return unavailable();
  try {
    const resolution = await deps.authorityResolver.resolveCurrent({
      principal: verified.invocation.principal,
      invocation_request_id: verified.invocation.request.request_id,
    });
    if (resolution.status !== "resolved") return resolution;
    return invokeSurface(
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
  assertOperation(verified, "prepare");
  const input = parseNurtureInstitutionKnowledgeFormalPrepareInputV1(
    verified.invocation.operation.input,
  );
  if (!input) return invalid();
  if (!deps.preparedCommandOwner) return unavailable();
  try {
    return await deps.preparedCommandOwner.prepare({
      principal: verified.invocation.principal,
      invocation_request_id: verified.invocation.request.request_id,
      client_surface: NURTURE_INSTITUTION_KNOWLEDGE_FORMAL_INGRESS_V1.client_surface,
      command: input,
    });
  } catch {
    return unavailable();
  }
}

async function execute(
  verified: WorkflowVerifiedScenarioInvocationV1,
  deps: NurtureInstitutionKnowledgeFormalIngressDeps,
): Promise<unknown> {
  assertOperation(verified, "execute");
  const input = parseNurtureInstitutionKnowledgeFormalExecuteInputV1(
    verified.invocation.operation.input,
  );
  if (!input) return invalid();
  if (!deps.preparedCommandOwner || !deps.authorizedRetrievalOwnerFactory) return unavailable();
  try {
    const consumed = await deps.preparedCommandOwner.consumeConfirmed({
      principal: verified.invocation.principal,
      invocation_request_id: verified.invocation.request.request_id,
      client_surface: NURTURE_INSTITUTION_KNOWLEDGE_FORMAL_INGRESS_V1.client_surface,
      command: input,
    });
    if (consumed.status !== "resolved") return consumed;
    if (
      consumed.command_request_id !== input.commandRequestId ||
      consumed.frozen_request.confirmationRef !== input.confirmationRef
    ) return { status: "conflict", reason_code: "prepared_command_binding_drift" };
    return invokeSurface(
      verified,
      deps,
      consumed.authority,
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
  request: Parameters<NurtureInstitutionKnowledgeSurfaceHandler["handle"]>[0],
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
  const handler = new NurtureInstitutionKnowledgeSurfaceHandler({
    ...deps.surfaceDeps,
    bindings: authorityBoundBindings(deps.surfaceDeps.bindings, authority),
    retrievalOwner: deps.authorizedRetrievalOwnerFactory!.createForPrincipal(
      verified.invocation.principal,
    ),
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

function assertOperation(
  verified: WorkflowVerifiedScenarioInvocationV1,
  lane: "query" | "prepare" | "execute",
): void {
  const contract = NURTURE_INSTITUTION_KNOWLEDGE_FORMAL_INGRESS_V1[lane];
  const invocation = verified.invocation;
  const declaration = verified.declaration;
  if (
    declaration.scenario_key !== "nurture" ||
    declaration.endpoint_key !== contract.endpoint_key ||
    declaration.operation_key !== contract.operation_key ||
    declaration.input_schema_version !== contract.input_schema_version ||
    declaration.ingress_category !== "host_transition" ||
    declaration.ingress_key !== contract.endpoint_key ||
    declaration.principal_origins.length !== 1 ||
    declaration.principal_origins[0] !== "interactive_session" ||
    invocation.route.endpoint_key !== contract.endpoint_key ||
    invocation.route.ingress.ingress_category !== "host_transition" ||
    invocation.route.ingress.ingress_key !== contract.endpoint_key ||
    invocation.operation.operation_key !== contract.operation_key ||
    invocation.operation.input_schema_version !== contract.input_schema_version ||
    invocation.principal.principal_origin !== "interactive_session"
  ) throw new Error("verified Institution Knowledge declaration drift");
}

function invalid() {
  return { status: "invalid" as const, reason_code: "invalid_institution_knowledge_formal_input" };
}

function unavailable() {
  return { status: "unavailable" as const, reason_code: "institution_knowledge_formal_ingress_unavailable" };
}
