import type {
  ScenarioHumanPrincipalV1,
  WorkflowTrustedInvocationHandlerRegistry,
  WorkflowVerifiedScenarioInvocationV1,
} from "@my-chat/workflow-contracts";
import type { InstitutionKnowledgeRetrievalOwnerPortV1 } from "./domain/institution/institution-knowledge-retrieval.js";
import {
  NurtureInstitutionKnowledgeSurfaceHandler,
  parseNurtureInstitutionKnowledgeAdapterRequest,
  type NurtureInstitutionKnowledgeActionKey,
  type NurtureInstitutionKnowledgeAdapterRequest,
  type NurtureInstitutionKnowledgeQueryKey,
  type NurtureInstitutionKnowledgeSurfaceDeps,
} from "./institution-knowledge-surfaces.js";

export const NURTURE_INSTITUTION_KNOWLEDGE_TRUSTED_HANDLER_KEYS = Object.freeze({
  query: "nurture.institution_knowledge.query.v1",
  execute: "nurture.institution_knowledge.execute.v1",
} as const);

export type NurtureInstitutionKnowledgeParticipantResolution =
  | { status: "resolved"; participant_ref: string }
  | { status: "denied" | "unavailable"; reason_code: string };

/** Scenario-owned current actor-to-participant association lookup. */
export type NurtureInstitutionKnowledgeParticipantResolver = {
  resolveCurrentParticipant(input: {
    principal: ScenarioHumanPrincipalV1;
    invocation_request_id: string;
  }): Promise<NurtureInstitutionKnowledgeParticipantResolution>;
};

/** Host owner rebound to the verified principal; authorization stays host-side. */
export type NurtureInstitutionKnowledgeAuthorizedRetrievalOwnerFactory = {
  createForPrincipal(principal: ScenarioHumanPrincipalV1): InstitutionKnowledgeRetrievalOwnerPortV1;
};

export type NurtureInstitutionKnowledgeTrustedQueryInputV1 = {
  request: NurtureInstitutionKnowledgeAdapterRequest<NurtureInstitutionKnowledgeQueryKey>;
};

export type NurtureInstitutionKnowledgeTrustedCommandInputV1 = {
  commandRequestId: string;
  request: NurtureInstitutionKnowledgeAdapterRequest<NurtureInstitutionKnowledgeActionKey>;
};

export type NurtureInstitutionKnowledgeTrustedIngressDeps = {
  surfaceDeps: NurtureInstitutionKnowledgeSurfaceDeps;
  participantResolver?: NurtureInstitutionKnowledgeParticipantResolver;
  authorizedRetrievalOwnerFactory?: NurtureInstitutionKnowledgeAuthorizedRetrievalOwnerFactory;
};

export function createNurtureInstitutionKnowledgeTrustedInvocationHandlers(
  deps: NurtureInstitutionKnowledgeTrustedIngressDeps,
): WorkflowTrustedInvocationHandlerRegistry {
  return Object.freeze({
    [NURTURE_INSTITUTION_KNOWLEDGE_TRUSTED_HANDLER_KEYS.query]:
      (verified) => invoke(verified, deps, "query"),
    [NURTURE_INSTITUTION_KNOWLEDGE_TRUSTED_HANDLER_KEYS.execute]:
      (verified) => invoke(verified, deps, "command"),
  });
}

async function invoke(
  verified: WorkflowVerifiedScenarioInvocationV1,
  deps: NurtureInstitutionKnowledgeTrustedIngressDeps,
  lane: "query" | "command",
): Promise<unknown> {
  const operationKey = lane === "query"
    ? "query_institution_knowledge"
    : "execute_institution_knowledge";
  if (
    verified.invocation.route.scenario_key !== "nurture" ||
    verified.invocation.operation.operation_key !== operationKey ||
    verified.declaration.operation_key !== operationKey
  ) {
    throw new Error("trusted Institution Knowledge operation does not match its handler");
  }
  const parsed = parseTrustedInput(verified.invocation.operation.input, lane);
  if (!parsed) {
    return { status: "invalid", reason_code: "invalid_institution_knowledge_trusted_input" };
  }
  if (!deps.participantResolver || !deps.authorizedRetrievalOwnerFactory) return unavailable();

  let participant: NurtureInstitutionKnowledgeParticipantResolution;
  try {
    participant = await deps.participantResolver.resolveCurrentParticipant({
      principal: verified.invocation.principal,
      invocation_request_id: verified.invocation.request.request_id,
    });
  } catch {
    return unavailable();
  }
  if (participant.status !== "resolved") {
    return { status: participant.status, reason_code: participant.reason_code };
  }

  const handler = new NurtureInstitutionKnowledgeSurfaceHandler({
    ...deps.surfaceDeps,
    retrievalOwner: deps.authorizedRetrievalOwnerFactory.createForPrincipal(
      verified.invocation.principal,
    ),
  });
  return handler.handle(parsed.request, {
    workspace_id: verified.invocation.principal.workspace_ref.object_id,
    actor_participant_ref: participant.participant_ref,
    invocation_request_id: verified.invocation.request.request_id,
    command_request_id: parsed.commandRequestId ?? verified.invocation.request.request_id,
    client_surface: "web_run_workbench",
  });
}

function parseTrustedInput(
  value: unknown,
  lane: "query" | "command",
): { request: NurtureInstitutionKnowledgeAdapterRequest; commandRequestId?: string } | null {
  if (!isRecord(value)) return null;
  const expectedKeys = lane === "query" ? ["request"] : ["commandRequestId", "request"];
  if (Object.keys(value).length !== expectedKeys.length ||
      !expectedKeys.every((key) => key in value)) return null;
  const request = parseNurtureInstitutionKnowledgeAdapterRequest(value.request);
  if (!request) return null;
  const isQuery = request.capabilityKey === "query_institution_knowledge_preview";
  if (isQuery !== (lane === "query")) return null;
  if (lane === "query") return { request };
  if (!opaqueId(value.commandRequestId)) return null;
  return { request, commandRequestId: value.commandRequestId };
}

function unavailable() {
  return {
    status: "unavailable" as const,
    reason_code: "institution_knowledge_trusted_ingress_unavailable",
  };
}

function opaqueId(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9][A-Za-z0-9._:~-]{0,190}$/u.test(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
