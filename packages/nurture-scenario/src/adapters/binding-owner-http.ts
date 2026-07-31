import {
  NurtureScenarioBindingError,
  type NurtureScenarioBindingErrorCode,
  type NurtureScenarioOwnerAuthorizationReceipt,
  type ScenarioBindingAuthorizeInput,
} from "../domain/identity/scenario-binding-owner.js";

export const SCENARIO_BINDING_OWNER_PATH =
  "/internal/nurture/scenario-binding/authorize";

const MAX_IDENTIFIER_LENGTH = 512;

export const SCENARIO_BINDING_ERROR_STATUS: Readonly<
  Record<NurtureScenarioBindingErrorCode, number>
> = Object.freeze({
  invalid_binding_request: 400,
  invalid_owner_ref: 400,
  anchor_not_found: 409,
  anchor_not_current: 409,
  authorization_replay_conflict: 409,
  authorization_receipt_inactive: 409,
  owner_authorization_denied: 403,
  owner_authorization_unavailable: 503,
});

export type ScenarioBindingAuthorizeResponse = Readonly<{
  status: "authorized";
  authorization_ref: string;
  workspace_id: string;
  subject_type: "child" | "family";
  subject_id: string;
  scenario_key: "nurture";
  owner_ref: string;
  owner_version: number;
  authorized_actor_id: string;
  represented_organization_id?: string;
  purpose: "scenario_binding_write";
  verified_at: string;
  expires_at: string;
}>;

/**
 * Preserve the P7 transport adapter exactly: required identity fields receive
 * the wider 512-code-unit HTTP check, unknown top-level fields are ignored,
 * and optional correlation/trace values are forwarded only when truthy. The
 * domain verifier remains the stricter canonical-text boundary.
 */
export function parseScenarioBindingAuthorizeBody(
  value: unknown,
): ScenarioBindingAuthorizeInput {
  const body =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  if (
    !isBoundedText(body.workspace_id) ||
    !isBoundedText(body.acting_user_id) ||
    !isBoundedText(body.idempotency_key) ||
    (body.subject_type !== "child" && body.subject_type !== "family") ||
    !isBoundedText(body.subject_id) ||
    body.scenario_key !== "nurture" ||
    !isBoundedText(body.acting_actor_id) ||
    (body.represented_organization_id !== undefined &&
      !isBoundedText(body.represented_organization_id)) ||
    body.purpose !== "scenario_binding_write"
  ) {
    throw new NurtureScenarioBindingError(
      "invalid_binding_request",
      "The scenario-binding owner request is invalid.",
    );
  }

  return {
    workspaceId: body.workspace_id,
    actingUserId: body.acting_user_id,
    idempotencyKey: body.idempotency_key,
    subjectType: body.subject_type,
    subjectId: body.subject_id,
    scenarioKey: "nurture",
    actingActorId: body.acting_actor_id,
    ...(body.represented_organization_id
      ? { representedOrganizationId: body.represented_organization_id }
      : {}),
    purpose: "scenario_binding_write",
    ...(body.correlation_id
      ? { correlationId: body.correlation_id as string }
      : {}),
    ...(body.trace_id ? { traceId: body.trace_id as string } : {}),
  };
}

export function formatScenarioBindingAuthorizeResponse(
  receipt: NurtureScenarioOwnerAuthorizationReceipt,
): ScenarioBindingAuthorizeResponse {
  return {
    status: "authorized",
    authorization_ref: receipt.authorizationRef,
    workspace_id: receipt.workspaceId,
    subject_type: receipt.subjectType,
    subject_id: receipt.subjectId,
    scenario_key: receipt.scenarioKey,
    owner_ref: receipt.ownerRef,
    owner_version: receipt.ownerVersion,
    authorized_actor_id: receipt.authorizedActorId,
    ...(receipt.representedOrganizationId
      ? { represented_organization_id: receipt.representedOrganizationId }
      : {}),
    purpose: receipt.purpose,
    verified_at: receipt.verifiedAt.toISOString(),
    expires_at: receipt.expiresAt.toISOString(),
  };
}

function isBoundedText(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= MAX_IDENTIFIER_LENGTH
  );
}
