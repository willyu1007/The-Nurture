import type { ScenarioHumanPrincipalV1 } from "@my-chat/workflow-contracts";
import {
  parseNurtureEnrollmentJourneyAdapterRequest,
  parseNurtureEnrollmentJourneyCommandIntent,
  type NurtureEnrollmentJourneyAdapterRequest,
  type NurtureEnrollmentJourneyCommandIntentV1,
  type NurtureEnrollmentJourneyQueryKey,
} from "./enrollment-journey-surfaces.js";
import {
  parseNurtureEnrollmentJourneyCurrentOwnerCarrierV1,
  type NurtureEnrollmentJourneyCurrentOwnerCarrierV1,
} from "./enrollment-journey-current-owner-carrier.js";
export {
  parseNurtureEnrollmentJourneyCurrentOwnerCarrierV1,
  type NurtureEnrollmentJourneyCurrentOwnerCarrierV1,
} from "./enrollment-journey-current-owner-carrier.js";
import type { NurtureEnrollmentJourneyCommandKey } from "./domain/institution/enrollment-journey-command.js";
import {
  parseNurtureWorkflowRunReservationEvidenceV1,
  type NurtureWorkflowRunReservationEvidenceV1,
} from "./domain/institution/workflow-run-settlement.js";

/**
 * G4-D formal trusted ingress (record 86 plus the request-scoped owner carrier
 * in record 91). The reviewable and
 * strong confirmation classes go through the durable prepared-command ledger;
 * the three direct_commit capabilities bypass it on the execute lane with an
 * owner-derived deterministic command id. Consumption happens inside the same
 * transaction as the I1 effect (record 63), so the execute handler verifies
 * without consuming and the production command executor consumes.
 */
export const NURTURE_ENROLLMENT_JOURNEY_LEDGERED_COMMAND_KEYS = [
  "start_enrollment_inquiry",
  "record_external_touchpoint",
  "confirm_native_touchpoint_note",
  "confirm_intent_conversation",
  "close_inquiry",
  "qualify_capacity_waitlist",
  "override_waitlist_category",
  "issue_trial_offer",
  "accept_trial_offer",
  "decline_or_expire_trial_offer",
  "withdraw_from_waitlist",
  "cancel_trial_preparation",
  "prepare_trial_relationship",
  "start_trial",
  "extend_trial",
  "propose_formal_enrollment",
  "formalize_enrollment",
  "end_trial",
] as const;

export const NURTURE_ENROLLMENT_JOURNEY_DIRECT_COMMAND_KEYS = [
  "record_or_skip_visit",
  "review_waitlist_interest",
  "mark_trial_review_reached",
] as const;

export type NurtureEnrollmentJourneyLedgeredCommandKey =
  (typeof NURTURE_ENROLLMENT_JOURNEY_LEDGERED_COMMAND_KEYS)[number];
export type NurtureEnrollmentJourneyDirectCommandKey =
  (typeof NURTURE_ENROLLMENT_JOURNEY_DIRECT_COMMAND_KEYS)[number];

/**
 * The workbench ingress can only ever satisfy institution_admin bindings
 * (client_surface web_run_workbench ↔ institution_workbench), so the query
 * lane admits the two admin queries; the guardian waitlist query has no lane
 * here and stays fail-closed until a guardian ingress exists.
 */
export const NURTURE_ENROLLMENT_JOURNEY_FORMAL_QUERY_KEYS = [
  "query_institution_enrollment_journey",
  "query_institution_capacity_waitlist",
] as const;

export type NurtureEnrollmentJourneyFormalQueryKey =
  (typeof NURTURE_ENROLLMENT_JOURNEY_FORMAL_QUERY_KEYS)[number];

export const NURTURE_ENROLLMENT_JOURNEY_FORMAL_INGRESS_V1 = Object.freeze({
  contract_version: 1,
  principal_origin: "interactive_session",
  client_surface: "web_run_workbench",
  ingress_category: "host_transition",
  query: Object.freeze({
    endpoint_key: "nurture.enrollment_journey.query",
    method: "POST",
    operation_key: "query_enrollment_journey",
    input_schema_key: "nurture.enrollment_journey.query.input",
    input_schema_version: 1,
    handler_key: "nurture.enrollment_journey.query.formal.v1",
    ingress_key: "nurture.enrollment_journey.query",
  }),
  prepare: Object.freeze({
    endpoint_key: "nurture.enrollment_journey.command.prepare",
    method: "POST",
    operation_key: "prepare_enrollment_journey_command",
    input_schema_key: "nurture.enrollment_journey.command.prepare.input",
    input_schema_version: 2,
    handler_key: "nurture.enrollment_journey.command.prepare.formal.v2",
    ingress_key: "nurture.enrollment_journey.command.prepare",
  }),
  execute: Object.freeze({
    endpoint_key: "nurture.enrollment_journey.command.execute",
    method: "POST",
    operation_key: "execute_prepared_enrollment_journey_command",
    input_schema_key: "nurture.enrollment_journey.command.execute.input",
    input_schema_version: 3,
    handler_key: "nurture.enrollment_journey.command.execute.formal.v3",
    ingress_key: "nurture.enrollment_journey.command.execute",
  }),
  settlementStatus: Object.freeze({
    endpoint_key: "nurture.enrollment_journey.workflow_run_settlement.status",
    method: "POST",
    operation_key: "read_enrollment_journey_workflow_run_settlement_status",
    input_schema_key:
      "nurture.enrollment_journey.workflow_run_settlement.status.input",
    input_schema_version: 1,
    handler_key:
      "nurture.enrollment_journey.workflow_run_settlement.status.formal.v1",
    ingress_key: "nurture.enrollment_journey.workflow_run_settlement.status",
  }),
  settlementConfirmNoEffect: Object.freeze({
    endpoint_key:
      "nurture.enrollment_journey.workflow_run_settlement.confirm_no_effect",
    method: "POST",
    operation_key:
      "confirm_enrollment_journey_workflow_run_settlement_no_effect",
    input_schema_key:
      "nurture.enrollment_journey.workflow_run_settlement.confirm_no_effect.input",
    input_schema_version: 2,
    handler_key:
      "nurture.enrollment_journey.workflow_run_settlement.confirm_no_effect.formal.v2",
    ingress_key:
      "nurture.enrollment_journey.workflow_run_settlement.confirm_no_effect",
  }),
  idempotency: "owner_command_request_id_replayed_with_exact_confirmation",
  confirmation: "owner_held_frozen_payload_consumed_with_the_effect",
} as const);

export type NurtureEnrollmentJourneyFormalQueryInputV1 = {
  contractVersion: 1;
  request: NurtureEnrollmentJourneyAdapterRequest<NurtureEnrollmentJourneyFormalQueryKey>;
};

/** Host-only wire input. `currentOwnerCarrier` is never frozen in the ledger. */
export type NurtureEnrollmentJourneyFormalPrepareInputV2 = {
  contractVersion: 2;
  clientCommandId: string;
  request: NurtureEnrollmentJourneyCommandIntentV1<NurtureEnrollmentJourneyLedgeredCommandKey>;
  currentOwnerCarrier?: NurtureEnrollmentJourneyCurrentOwnerCarrierV1;
};

/** Nurture-owned ledger draft after the request-scoped carrier is removed. */
export type NurtureEnrollmentJourneyPreparedCommandDraftV1 = {
  contractVersion: 1;
  clientCommandId: string;
  request: NurtureEnrollmentJourneyCommandIntentV1<NurtureEnrollmentJourneyLedgeredCommandKey>;
};

/**
 * Execute is a closed union: the ledgered form never accepts target,
 * operation input, client surface or authority; the direct form carries the
 * full intent for exactly the three direct_commit capabilities and no
 * confirmation (the owner derives the deterministic command id).
 */
export type NurtureEnrollmentJourneyFormalExecuteInputV3 =
  | {
      contractVersion: 3;
      commandRequestId: string;
      confirmationRef: string;
      hostWorkflowRunReservation?: NurtureWorkflowRunReservationEvidenceV1;
      currentOwnerCarrier?: NurtureEnrollmentJourneyCurrentOwnerCarrierV1;
    }
  | {
      contractVersion: 3;
      clientCommandId: string;
      request: NurtureEnrollmentJourneyCommandIntentV1<NurtureEnrollmentJourneyDirectCommandKey>;
    };

/**
 * Historical reconciliation is deliberately independent from prepared-command
 * expiry and current Scenario authority. The exact Host reservation evidence
 * remains mandatory so this read cannot become a command-id existence oracle.
 */
export type NurtureEnrollmentJourneyWorkflowRunSettlementStatusInputV1 = {
  contractVersion: 1;
  commandRequestId: string;
  hostWorkflowRunReservation: NurtureWorkflowRunReservationEvidenceV1;
};

/**
 * A writer-fenced no-effect decision is valid only for the same confirmation
 * that identified the frozen prepared command. The confirmation is checked
 * against owner-held historical evidence before the settlement row is
 * registered; expiry and current authority do not participate in this
 * reconciliation-only identity check.
 */
export type NurtureEnrollmentJourneyWorkflowRunSettlementConfirmNoEffectInputV2 = {
  contractVersion: 2;
  commandRequestId: string;
  confirmationRef: string;
  hostWorkflowRunReservation: NurtureWorkflowRunReservationEvidenceV1;
};

export type NurtureEnrollmentJourneyLocalAuthorityV1 = {
  workspace_id: string;
  participant_ref: string;
  institution_ref: string;
  role_assignment_ref: string;
  active_role: "institution_admin";
  surface_key: "institution_workbench";
  authority_version: string;
  evaluated_at: string;
};

export type NurtureEnrollmentJourneyFormalAuthorityResolverV1 = {
  resolveCurrent(input: {
    principal: ScenarioHumanPrincipalV1;
    invocation_request_id: string;
    declared_operation_key: string;
    capability_key:
      | NurtureEnrollmentJourneyQueryKey
      | NurtureEnrollmentJourneyCommandKey;
    target_option_ref: string;
  }): Promise<
    | { status: "resolved"; authority: NurtureEnrollmentJourneyLocalAuthorityV1 }
    | { status: "denied" | "unavailable"; reason_code: string }
  >;
};

export type NurtureEnrollmentJourneyPreparedCommandOwnerV1 = {
  prepare(input: {
    principal: ScenarioHumanPrincipalV1;
    invocation_request_id: string;
    client_surface: "web_run_workbench";
    authority: NurtureEnrollmentJourneyLocalAuthorityV1;
    command: NurtureEnrollmentJourneyPreparedCommandDraftV1;
  }): Promise<
    | {
        status: "ready_to_confirm";
        command_request_id: string;
        confirmation_ref: string;
        expires_at: string;
        effect: NurtureEnrollmentJourneyLedgeredCommandKey;
      }
    | { status: "not_prepared"; reason_code: string }
    | { status: "unavailable"; reason_code: string }
  >;
  /**
   * Read-only verification: opens the frozen payload and cross-checks it
   * without consuming. The production command executor consumes the ledger
   * row inside the same transaction as the I1 effect; a consumed record is
   * accepted here so the kernel's exact replay stays reachable.
   */
  verifyConfirmed(input: {
    principal: ScenarioHumanPrincipalV1;
    invocation_request_id: string;
    client_surface: "web_run_workbench";
    command: { commandRequestId: string; confirmationRef: string };
  }): Promise<
    | {
        status: "resolved";
        command_request_id: string;
        frozen_request: NurtureEnrollmentJourneyAdapterRequest<NurtureEnrollmentJourneyLedgeredCommandKey>;
        authority: NurtureEnrollmentJourneyLocalAuthorityV1;
      }
    | { status: "denied" | "conflict" | "unavailable"; reason_code: string }
  >;
  verifyHistoricalConfirmation(input: {
    workspace_id: string;
    command: { commandRequestId: string; confirmationRef: string };
  }): Promise<
    | {
        status: "resolved";
        command_request_id: string;
        effect: "start_enrollment_inquiry";
      }
    | { status: "denied" | "conflict" | "unavailable"; reason_code: string }
  >;
  /**
   * Deterministic direct_commit context: no ledger row is created; the
   * command id is an owner-keyed tag over the client command id so the I1
   * kernel's idempotency dedups replays across invocations.
   */
  deriveDirectContext(input: {
    principal: ScenarioHumanPrincipalV1;
    invocation_request_id: string;
    client_surface: "web_run_workbench";
    command: {
      clientCommandId: string;
      request: NurtureEnrollmentJourneyCommandIntentV1<NurtureEnrollmentJourneyDirectCommandKey>;
    };
  }): Promise<
    | { status: "resolved"; command_request_id: string; confirmation_ref: string }
    | { status: "denied" | "unavailable"; reason_code: string }
  >;
};

export function parseNurtureEnrollmentJourneyFormalQueryInputV1(
  value: unknown,
): NurtureEnrollmentJourneyFormalQueryInputV1 | null {
  if (!exactRecord(value, ["contractVersion", "request"]) || value.contractVersion !== 1) {
    return null;
  }
  const request = parseNurtureEnrollmentJourneyAdapterRequest(value.request);
  return request &&
    (NURTURE_ENROLLMENT_JOURNEY_FORMAL_QUERY_KEYS as readonly string[])
      .includes(request.capabilityKey)
    ? {
        contractVersion: 1,
        request: request as NurtureEnrollmentJourneyFormalQueryInputV1["request"],
      }
    : null;
}

export function parseNurtureEnrollmentJourneyFormalPrepareInputV2(
  value: unknown,
): NurtureEnrollmentJourneyFormalPrepareInputV2 | null {
  if (
    !exactRecordOneOf(value, [
      ["clientCommandId", "contractVersion", "request"],
      ["clientCommandId", "contractVersion", "currentOwnerCarrier", "request"],
    ]) ||
    value.contractVersion !== 2 ||
    !opaqueId(value.clientCommandId)
  ) return null;
  const request = parseNurtureEnrollmentJourneyCommandIntent(value.request);
  let currentOwnerCarrier: NurtureEnrollmentJourneyCurrentOwnerCarrierV1 | undefined;
  if ("currentOwnerCarrier" in value) {
    const parsed = parseNurtureEnrollmentJourneyCurrentOwnerCarrierV1(
      value.currentOwnerCarrier,
    );
    if (!parsed) return null;
    currentOwnerCarrier = parsed;
  }
  return request &&
    (NURTURE_ENROLLMENT_JOURNEY_LEDGERED_COMMAND_KEYS as readonly string[])
      .includes(request.capabilityKey)
    ? {
        contractVersion: 2,
        clientCommandId: value.clientCommandId,
        request: request as NurtureEnrollmentJourneyFormalPrepareInputV2["request"],
        ...(currentOwnerCarrier === undefined ? {} : { currentOwnerCarrier }),
      }
    : null;
}

export function parseNurtureEnrollmentJourneyFormalExecuteInputV3(
  value: unknown,
): NurtureEnrollmentJourneyFormalExecuteInputV3 | null {
  if (
    exactRecord(value, ["commandRequestId", "confirmationRef", "contractVersion"]) ||
    exactRecord(value, [
      "commandRequestId",
      "confirmationRef",
      "contractVersion",
      "hostWorkflowRunReservation",
    ]) ||
    exactRecord(value, [
      "commandRequestId",
      "confirmationRef",
      "contractVersion",
      "currentOwnerCarrier",
    ]) ||
    exactRecord(value, [
      "commandRequestId",
      "confirmationRef",
      "contractVersion",
      "currentOwnerCarrier",
      "hostWorkflowRunReservation",
    ])
  ) {
    const hostReservation = "hostWorkflowRunReservation" in value
      ? parseNurtureWorkflowRunReservationEvidenceV1(
          value.hostWorkflowRunReservation,
        )
      : undefined;
    let currentOwnerCarrier: NurtureEnrollmentJourneyCurrentOwnerCarrierV1 | undefined;
    if ("currentOwnerCarrier" in value) {
      const parsed = parseNurtureEnrollmentJourneyCurrentOwnerCarrierV1(
        value.currentOwnerCarrier,
      );
      if (!parsed) return null;
      currentOwnerCarrier = parsed;
    }
    if (
      value.contractVersion !== 3 ||
      !opaqueId(value.commandRequestId) ||
      !opaqueRef(value.confirmationRef) ||
      hostReservation === null
    ) return null;
    return {
      contractVersion: 3,
      commandRequestId: value.commandRequestId,
      confirmationRef: value.confirmationRef,
      ...(hostReservation === undefined
        ? {}
        : { hostWorkflowRunReservation: hostReservation }),
      ...(currentOwnerCarrier === undefined ? {} : { currentOwnerCarrier }),
    };
  }
  if (
    !exactRecord(value, ["clientCommandId", "contractVersion", "request"]) ||
    value.contractVersion !== 3 ||
    !opaqueId(value.clientCommandId)
  ) return null;
  const request = parseNurtureEnrollmentJourneyCommandIntent(value.request);
  return request &&
    (NURTURE_ENROLLMENT_JOURNEY_DIRECT_COMMAND_KEYS as readonly string[])
      .includes(request.capabilityKey)
    ? {
        contractVersion: 3,
        clientCommandId: value.clientCommandId,
        request: request as Extract<
          NurtureEnrollmentJourneyFormalExecuteInputV3,
          { clientCommandId: string }
        >["request"],
      }
    : null;
}

export function parseNurtureEnrollmentJourneyWorkflowRunSettlementStatusInputV1(
  value: unknown,
): NurtureEnrollmentJourneyWorkflowRunSettlementStatusInputV1 | null {
  if (
    !exactRecord(value, [
      "commandRequestId",
      "contractVersion",
      "hostWorkflowRunReservation",
    ]) ||
    value.contractVersion !== 1 ||
    !opaqueId(value.commandRequestId)
  ) return null;
  const hostWorkflowRunReservation =
    parseNurtureWorkflowRunReservationEvidenceV1(
      value.hostWorkflowRunReservation,
    );
  return hostWorkflowRunReservation
    ? {
        contractVersion: 1,
        commandRequestId: value.commandRequestId,
        hostWorkflowRunReservation,
      }
    : null;
}

export function parseNurtureEnrollmentJourneyWorkflowRunSettlementConfirmNoEffectInputV2(
  value: unknown,
): NurtureEnrollmentJourneyWorkflowRunSettlementConfirmNoEffectInputV2 | null {
  if (
    !exactRecord(value, [
      "commandRequestId",
      "confirmationRef",
      "contractVersion",
      "hostWorkflowRunReservation",
    ]) ||
    value.contractVersion !== 2 ||
    !opaqueId(value.commandRequestId) ||
    !opaqueRef(value.confirmationRef)
  ) return null;
  const hostWorkflowRunReservation =
    parseNurtureWorkflowRunReservationEvidenceV1(
      value.hostWorkflowRunReservation,
    );
  return hostWorkflowRunReservation
    ? {
        contractVersion: 2,
        commandRequestId: value.commandRequestId,
        confirmationRef: value.confirmationRef,
        hostWorkflowRunReservation,
      }
    : null;
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

function exactRecordOneOf(
  value: unknown,
  expectedKeySets: readonly (readonly string[])[],
): value is Record<string, unknown> {
  return expectedKeySets.some((expectedKeys) => exactRecord(value, expectedKeys));
}


function opaqueId(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9][A-Za-z0-9._:~-]{0,190}$/u.test(value);
}

function opaqueRef(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9][A-Za-z0-9._:~=-]{15,511}$/u.test(value);
}
