import type { ScenarioHumanPrincipalV1 } from "@my-chat/workflow-contracts";
import {
  parseNurtureInstitutionKnowledgeSurfaceRequest,
  parseNurtureInstitutionKnowledgeCommandIntent,
  type NurtureInstitutionKnowledgeActionKey,
  type NurtureInstitutionKnowledgeSurfaceRequest,
  type NurtureInstitutionKnowledgeCommandIntentV1,
  type NurtureInstitutionKnowledgeQueryKey,
} from "./institution-knowledge-surfaces.js";

export const NURTURE_INSTITUTION_KNOWLEDGE_FORMAL_INGRESS_V1 = Object.freeze({
  contract_version: 1,
  principal_origin: "interactive_session",
  client_surface: "web_run_workbench",
  ingress_category: "host_transition",
  query: Object.freeze({
    endpoint_key: "nurture.institution_knowledge.query",
    method: "POST",
    operation_key: "query_institution_knowledge",
    input_schema_key: "nurture.institution_knowledge.query.input",
    input_schema_version: 1,
    handler_key: "nurture.institution_knowledge.query.formal.v1",
    ingress_key: "nurture.institution_knowledge.query",
  }),
  prepare: Object.freeze({
    endpoint_key: "nurture.institution_knowledge.command.prepare",
    method: "POST",
    operation_key: "prepare_institution_knowledge_command",
    input_schema_key: "nurture.institution_knowledge.command.prepare.input",
    input_schema_version: 1,
    handler_key: "nurture.institution_knowledge.command.prepare.formal.v1",
    ingress_key: "nurture.institution_knowledge.command.prepare",
  }),
  execute: Object.freeze({
    endpoint_key: "nurture.institution_knowledge.command.execute",
    method: "POST",
    operation_key: "execute_prepared_institution_knowledge_command",
    input_schema_key: "nurture.institution_knowledge.command.execute.input",
    input_schema_version: 1,
    handler_key: "nurture.institution_knowledge.command.execute.formal.v1",
    ingress_key: "nurture.institution_knowledge.command.execute",
  }),
  idempotency: "owner_command_request_id_replayed_with_exact_confirmation",
  confirmation: "owner_held_frozen_payload",
} as const);

export type NurtureInstitutionKnowledgeFormalQueryInputV1 = {
  contractVersion: 1;
  request: NurtureInstitutionKnowledgeSurfaceRequest<NurtureInstitutionKnowledgeQueryKey>;
};

export type NurtureInstitutionKnowledgeFormalPrepareInputV1 = {
  contractVersion: 1;
  clientCommandId: string;
  request: NurtureInstitutionKnowledgeCommandIntentV1;
};

/** Execute never accepts target, operation input, client surface or authority. */
export type NurtureInstitutionKnowledgeFormalExecuteInputV1 = {
  contractVersion: 1;
  commandRequestId: string;
  confirmationRef: string;
};

export type NurtureInstitutionKnowledgeLocalAuthorityV1 = {
  workspace_id: string;
  participant_ref: string;
  institution_ref: string;
  role_assignment_ref: string;
  active_role: "institution_admin";
  surface_key: "institution_workbench";
  authority_version: string;
  evaluated_at: string;
};

export type NurtureInstitutionKnowledgeFormalAuthorityResolverV1 = {
  resolveCurrent(input: {
    principal: ScenarioHumanPrincipalV1;
    invocation_request_id: string;
    declared_operation_key: string;
    capability_key:
      | NurtureInstitutionKnowledgeQueryKey
      | NurtureInstitutionKnowledgeActionKey;
    target_option_ref: string;
  }): Promise<
    | { status: "resolved"; authority: NurtureInstitutionKnowledgeLocalAuthorityV1 }
    | { status: "denied" | "unavailable"; reason_code: string }
  >;
};

export type NurtureInstitutionKnowledgePreparedCommandOwnerV1 = {
  prepare(input: {
    principal: ScenarioHumanPrincipalV1;
    invocation_request_id: string;
    client_surface: "web_run_workbench";
    authority: NurtureInstitutionKnowledgeLocalAuthorityV1;
    command: NurtureInstitutionKnowledgeFormalPrepareInputV1;
  }): Promise<
    | {
        status: "ready_to_confirm";
        command_request_id: string;
        confirmation_ref: string;
        expires_at: string;
        effect: NurtureInstitutionKnowledgeActionKey;
      }
    | { status: "not_prepared"; reason_code: string }
    | { status: "unavailable"; reason_code: string }
  >;
  consumeConfirmed(input: {
    principal: ScenarioHumanPrincipalV1;
    invocation_request_id: string;
    client_surface: "web_run_workbench";
    command: NurtureInstitutionKnowledgeFormalExecuteInputV1;
  }): Promise<
    | {
        status: "resolved";
        command_request_id: string;
        frozen_request: NurtureInstitutionKnowledgeSurfaceRequest<NurtureInstitutionKnowledgeActionKey>;
        authority: NurtureInstitutionKnowledgeLocalAuthorityV1;
      }
    | { status: "denied" | "conflict" | "unavailable"; reason_code: string }
  >;
};

export function parseNurtureInstitutionKnowledgeFormalQueryInputV1(
  value: unknown,
): NurtureInstitutionKnowledgeFormalQueryInputV1 | null {
  if (!exactRecord(value, ["contractVersion", "request"]) || value.contractVersion !== 1) {
    return null;
  }
  const request = parseNurtureInstitutionKnowledgeSurfaceRequest(value.request);
  return request?.capabilityKey === "query_institution_knowledge_preview"
    ? { contractVersion: 1, request }
    : null;
}

export function parseNurtureInstitutionKnowledgeFormalPrepareInputV1(
  value: unknown,
): NurtureInstitutionKnowledgeFormalPrepareInputV1 | null {
  if (
    !exactRecord(value, ["clientCommandId", "contractVersion", "request"]) ||
    value.contractVersion !== 1 ||
    !opaqueId(value.clientCommandId)
  ) return null;
  const request = parseNurtureInstitutionKnowledgeCommandIntent(value.request);
  return request
    ? { contractVersion: 1, clientCommandId: value.clientCommandId, request }
    : null;
}

export function parseNurtureInstitutionKnowledgeFormalExecuteInputV1(
  value: unknown,
): NurtureInstitutionKnowledgeFormalExecuteInputV1 | null {
  if (
    !exactRecord(value, ["commandRequestId", "confirmationRef", "contractVersion"]) ||
    value.contractVersion !== 1 ||
    !opaqueId(value.commandRequestId) ||
    !opaqueRef(value.confirmationRef)
  ) return null;
  return {
    contractVersion: 1,
    commandRequestId: value.commandRequestId,
    confirmationRef: value.confirmationRef,
  };
}

function exactRecord(
  value: unknown,
  expectedKeys: readonly string[],
): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const keys = Object.keys(value);
  return keys.length === expectedKeys.length &&
    expectedKeys.every((key) => Object.prototype.hasOwnProperty.call(value, key));
}

function opaqueId(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9][A-Za-z0-9._:~-]{0,190}$/u.test(value);
}

function opaqueRef(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9][A-Za-z0-9._:~=-]{15,511}$/u.test(value);
}
