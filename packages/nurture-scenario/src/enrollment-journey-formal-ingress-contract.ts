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
import {
  parseNurtureEnrollmentJourneyGuardianOwnerCarrierV1,
  type NurtureEnrollmentJourneyGuardianOwnerCarrierV1,
} from "./enrollment-journey-guardian-owner-carrier.js";
export {
  parseNurtureEnrollmentJourneyGuardianOwnerCarrierV1,
  type NurtureEnrollmentJourneyGuardianOwnerCarrierV1,
} from "./enrollment-journey-guardian-owner-carrier.js";
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
 * Formal query coverage is complete across the Admin workbench and the
 * Guardian chat/family-board surfaces. The transport surface is private
 * signed input and is cross-checked against capability authority.
 */
export const NURTURE_ENROLLMENT_JOURNEY_FORMAL_QUERY_KEYS = [
  "query_institution_enrollment_journey",
  "query_institution_capacity_waitlist",
  "query_guardian_enrollment_waitlist",
] as const;

export type NurtureEnrollmentJourneyFormalQueryKey =
  (typeof NURTURE_ENROLLMENT_JOURNEY_FORMAL_QUERY_KEYS)[number];

export type NurtureEnrollmentJourneyFormalClientSurface =
  | "web_run_workbench"
  | "chat_workflow_control"
  | "mobile_dashboard";

export const NURTURE_ENROLLMENT_JOURNEY_FORMAL_INGRESS_V1 = Object.freeze({
  contract_version: 1,
  principal_origin: "interactive_session",
  ingress_category: "host_transition",
  query: Object.freeze({
    endpoint_key: "nurture.enrollment_journey.query",
    method: "POST",
    operation_key: "query_enrollment_journey",
    input_schema_key: "nurture.enrollment_journey.query.input",
    input_schema_version: 2,
    handler_key: "nurture.enrollment_journey.query.formal.v2",
    ingress_key: "nurture.enrollment_journey.query",
  }),
  prepare: Object.freeze({
    endpoint_key: "nurture.enrollment_journey.command.prepare",
    method: "POST",
    operation_key: "prepare_enrollment_journey_command",
    input_schema_key: "nurture.enrollment_journey.command.prepare.input",
    input_schema_version: 3,
    handler_key: "nurture.enrollment_journey.command.prepare.formal.v3",
    ingress_key: "nurture.enrollment_journey.command.prepare",
  }),
  execute: Object.freeze({
    endpoint_key: "nurture.enrollment_journey.command.execute",
    method: "POST",
    operation_key: "execute_prepared_enrollment_journey_command",
    input_schema_key: "nurture.enrollment_journey.command.execute.input",
    input_schema_version: 4,
    handler_key: "nurture.enrollment_journey.command.execute.formal.v4",
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

export type NurtureEnrollmentJourneyFormalQueryInputV2 = {
  contractVersion: 2;
  clientSurface: NurtureEnrollmentJourneyFormalClientSurface;
  request: NurtureEnrollmentJourneyAdapterRequest<NurtureEnrollmentJourneyFormalQueryKey>;
  guardianOwnerCarrier?: NurtureEnrollmentJourneyGuardianOwnerCarrierV1;
};

/** Host-only wire input. `currentOwnerCarrier` is never frozen in the ledger. */
export type NurtureEnrollmentJourneyFormalPrepareInputV3 = {
  contractVersion: 3;
  clientSurface: NurtureEnrollmentJourneyFormalClientSurface;
  clientCommandId: string;
  request: NurtureEnrollmentJourneyCommandIntentV1<NurtureEnrollmentJourneyLedgeredCommandKey>;
  currentOwnerCarrier?: NurtureEnrollmentJourneyCurrentOwnerCarrierV1;
  guardianOwnerCarrier?: NurtureEnrollmentJourneyGuardianOwnerCarrierV1;
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
export type NurtureEnrollmentJourneyFormalExecuteInputV4 =
  | {
      contractVersion: 4;
      clientSurface: NurtureEnrollmentJourneyFormalClientSurface;
      commandRequestId: string;
      confirmationRef: string;
      hostWorkflowRunReservation?: NurtureWorkflowRunReservationEvidenceV1;
      currentOwnerCarrier?: NurtureEnrollmentJourneyCurrentOwnerCarrierV1;
      guardianOwnerCarrier?: NurtureEnrollmentJourneyGuardianOwnerCarrierV1;
    }
  | {
      contractVersion: 4;
      clientSurface: NurtureEnrollmentJourneyFormalClientSurface;
      clientCommandId: string;
      request: NurtureEnrollmentJourneyCommandIntentV1<NurtureEnrollmentJourneyDirectCommandKey>;
      guardianOwnerCarrier?: NurtureEnrollmentJourneyGuardianOwnerCarrierV1;
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

type NurtureEnrollmentJourneyLocalAuthorityBaseV1 = {
  workspace_id: string;
  participant_ref: string;
  institution_ref: string;
  authority_version: string;
  evaluated_at: string;
};

export type NurtureEnrollmentJourneyLocalAuthorityV1 =
  | (NurtureEnrollmentJourneyLocalAuthorityBaseV1 & {
      role_assignment_ref: string;
      active_role: "institution_admin";
      surface_key: "institution_workbench" | "institution_board";
    })
  | (NurtureEnrollmentJourneyLocalAuthorityBaseV1 & {
      active_role: "guardian";
      surface_key: "guardian_nurture_chat" | "guardian_family_board";
    });

export type NurtureEnrollmentJourneyFormalAuthorityResolverV1 = {
  resolveCurrent(input: {
    principal: ScenarioHumanPrincipalV1;
    invocation_request_id: string;
    declared_operation_key: string;
    client_surface: NurtureEnrollmentJourneyFormalClientSurface;
    capability_key:
      | NurtureEnrollmentJourneyQueryKey
      | NurtureEnrollmentJourneyCommandKey;
    target_option_ref: string;
    guardian_owner_carrier?: NurtureEnrollmentJourneyGuardianOwnerCarrierV1;
  }): Promise<
    | { status: "resolved"; authority: NurtureEnrollmentJourneyLocalAuthorityV1 }
    | { status: "denied" | "unavailable"; reason_code: string }
  >;
};

export type NurtureEnrollmentJourneyPreparedCommandOwnerV1 = {
  prepare(input: {
    principal: ScenarioHumanPrincipalV1;
    invocation_request_id: string;
    client_surface: NurtureEnrollmentJourneyFormalClientSurface;
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
    client_surface: NurtureEnrollmentJourneyFormalClientSurface;
    command: { commandRequestId: string; confirmationRef: string };
  }): Promise<
    | {
        status: "resolved";
        command_request_id: string;
        ledger_status: "prepared" | "consumed";
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
    client_surface: NurtureEnrollmentJourneyFormalClientSurface;
    command: {
      clientCommandId: string;
      request: NurtureEnrollmentJourneyCommandIntentV1<NurtureEnrollmentJourneyDirectCommandKey>;
    };
  }): Promise<
    | { status: "resolved"; command_request_id: string; confirmation_ref: string }
    | { status: "denied" | "unavailable"; reason_code: string }
  >;
};

export function parseNurtureEnrollmentJourneyFormalQueryInputV2(
  value: unknown,
): NurtureEnrollmentJourneyFormalQueryInputV2 | null {
  if (
    !recordWithAllowedKeys(
      value,
      ["clientSurface", "contractVersion", "request"],
      ["guardianOwnerCarrier"],
    )
    || value.contractVersion !== 2
    || !formalClientSurface(value.clientSurface)
  ) {
    return null;
  }
  const request = parseNurtureEnrollmentJourneyAdapterRequest(value.request);
  const guardianOwnerCarrier = "guardianOwnerCarrier" in value
    ? parseNurtureEnrollmentJourneyGuardianOwnerCarrierV1(value.guardianOwnerCarrier)
    : undefined;
  if (guardianOwnerCarrier === null) return null;
  return request &&
    (NURTURE_ENROLLMENT_JOURNEY_FORMAL_QUERY_KEYS as readonly string[])
      .includes(request.capabilityKey)
    ? {
        contractVersion: 2,
        clientSurface: value.clientSurface,
        request: request as NurtureEnrollmentJourneyFormalQueryInputV2["request"],
        ...(guardianOwnerCarrier === undefined ? {} : { guardianOwnerCarrier }),
      }
    : null;
}

export function parseNurtureEnrollmentJourneyFormalPrepareInputV3(
  value: unknown,
): NurtureEnrollmentJourneyFormalPrepareInputV3 | null {
  if (
    !recordWithAllowedKeys(
      value,
      ["clientCommandId", "clientSurface", "contractVersion", "request"],
      ["currentOwnerCarrier", "guardianOwnerCarrier"],
    )
    || value.contractVersion !== 3
    || !formalClientSurface(value.clientSurface)
    || !opaqueId(value.clientCommandId)
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
  const guardianOwnerCarrier = "guardianOwnerCarrier" in value
    ? parseNurtureEnrollmentJourneyGuardianOwnerCarrierV1(value.guardianOwnerCarrier)
    : undefined;
  if (guardianOwnerCarrier === null || (currentOwnerCarrier && guardianOwnerCarrier)) {
    return null;
  }
  return request &&
    (NURTURE_ENROLLMENT_JOURNEY_LEDGERED_COMMAND_KEYS as readonly string[])
      .includes(request.capabilityKey)
    ? {
        contractVersion: 3,
        clientSurface: value.clientSurface,
        clientCommandId: value.clientCommandId,
        request: request as NurtureEnrollmentJourneyFormalPrepareInputV3["request"],
        ...(currentOwnerCarrier === undefined ? {} : { currentOwnerCarrier }),
        ...(guardianOwnerCarrier === undefined ? {} : { guardianOwnerCarrier }),
      }
    : null;
}

export function parseNurtureEnrollmentJourneyFormalExecuteInputV4(
  value: unknown,
): NurtureEnrollmentJourneyFormalExecuteInputV4 | null {
  if (
    recordWithAllowedKeys(
      value,
      ["clientSurface", "commandRequestId", "confirmationRef", "contractVersion"],
      [
        "currentOwnerCarrier",
        "guardianOwnerCarrier",
        "hostWorkflowRunReservation",
      ],
    )
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
    const guardianOwnerCarrier = "guardianOwnerCarrier" in value
      ? parseNurtureEnrollmentJourneyGuardianOwnerCarrierV1(value.guardianOwnerCarrier)
      : undefined;
    if (
      value.contractVersion !== 4
      || !formalClientSurface(value.clientSurface)
      || !opaqueId(value.commandRequestId)
      || !opaqueRef(value.confirmationRef)
      || hostReservation === null
      || guardianOwnerCarrier === null
      || Boolean(currentOwnerCarrier && guardianOwnerCarrier)
    ) return null;
    return {
      contractVersion: 4,
      clientSurface: value.clientSurface,
      commandRequestId: value.commandRequestId,
      confirmationRef: value.confirmationRef,
      ...(hostReservation === undefined
        ? {}
        : { hostWorkflowRunReservation: hostReservation }),
      ...(currentOwnerCarrier === undefined ? {} : { currentOwnerCarrier }),
      ...(guardianOwnerCarrier === undefined ? {} : { guardianOwnerCarrier }),
    };
  }
  if (
    !recordWithAllowedKeys(
      value,
      ["clientCommandId", "clientSurface", "contractVersion", "request"],
      ["guardianOwnerCarrier"],
    )
    || value.contractVersion !== 4
    || !formalClientSurface(value.clientSurface)
    || !opaqueId(value.clientCommandId)
  ) return null;
  const request = parseNurtureEnrollmentJourneyCommandIntent(value.request);
  const guardianOwnerCarrier = "guardianOwnerCarrier" in value
    ? parseNurtureEnrollmentJourneyGuardianOwnerCarrierV1(value.guardianOwnerCarrier)
    : undefined;
  if (guardianOwnerCarrier === null) return null;
  return request &&
    (NURTURE_ENROLLMENT_JOURNEY_DIRECT_COMMAND_KEYS as readonly string[])
      .includes(request.capabilityKey)
    ? {
        contractVersion: 4,
        clientSurface: value.clientSurface,
        clientCommandId: value.clientCommandId,
        request: request as Extract<
          NurtureEnrollmentJourneyFormalExecuteInputV4,
          { clientCommandId: string }
        >["request"],
        ...(guardianOwnerCarrier === undefined ? {} : { guardianOwnerCarrier }),
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

function recordWithAllowedKeys(
  value: unknown,
  requiredKeys: readonly string[],
  optionalKeys: readonly string[],
): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const allowed = new Set([...requiredKeys, ...optionalKeys]);
  const keys = Object.keys(value);
  return requiredKeys.every((key) => Object.prototype.hasOwnProperty.call(value, key))
    && keys.every((key) => allowed.has(key));
}

function formalClientSurface(
  value: unknown,
): value is NurtureEnrollmentJourneyFormalClientSurface {
  return value === "web_run_workbench"
    || value === "chat_workflow_control"
    || value === "mobile_dashboard";
}


function opaqueId(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9][A-Za-z0-9._:~-]{0,190}$/u.test(value);
}

function opaqueRef(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9][A-Za-z0-9._:~=-]{15,511}$/u.test(value);
}
