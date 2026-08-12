import type {
  CanonicalRef,
  WorkflowCommandMeta,
} from "@my-chat/workflow-contracts";
import type { NurtureCommandSpec } from "./domain/commands/command-kernel.js";
import {
  NURTURE_ENROLLMENT_JOURNEY_COMMAND_KEYS,
  NurtureEnrollmentJourneyQueryService,
  closeInquirySpec,
  confirmIntentConversationSpec,
  confirmNativeTouchpointNoteSpec,
  recordExternalTouchpointSpec,
  recordOrSkipVisitSpec,
  startEnrollmentInquirySpec,
  type NurtureCloseInquiryPayload,
  type NurtureConfirmIntentConversationPayload,
  type NurtureConfirmNativeTouchpointNotePayload,
  type NurtureEnrollmentContactOwnerSnapshotV1,
  type NurtureEnrollmentJourneyCommandKey,
  type NurtureEnrollmentJourneyRepository,
  type NurtureEnrollmentNativeSourceOwnerSnapshotV1,
  type NurtureRecordExternalTouchpointPayload,
  type NurtureRecordOrSkipVisitPayload,
  type NurtureStartEnrollmentInquiryPayload,
} from "./domain/institution/enrollment-journey-command.js";
import {
  acceptTrialOfferSpec,
  cancelTrialPreparationSpec,
  declineOrExpireTrialOfferSpec,
  issueTrialOfferSpec,
  NurtureEnrollmentWaitlistQueryService,
  overrideWaitlistCategorySpec,
  qualifyCapacityWaitlistSpec,
  reviewWaitlistInterestSpec,
  withdrawFromWaitlistSpec,
  type NurtureAcceptTrialOfferPayload,
  type NurtureAdminWaitlistProjectionV1,
  type NurtureCancelTrialPreparationPayload,
  type NurtureDeclineOrExpireTrialOfferPayload,
  type NurtureEnrollmentGuardianActionOwnerSnapshotV1,
  type NurtureEnrollmentWaitlistQueryRepository,
  type NurtureFamilyWaitlistProjectionV1,
  type NurtureIssueTrialOfferPayload,
  type NurtureOverrideWaitlistCategoryPayload,
  type NurtureQualifyCapacityWaitlistPayload,
  type NurtureReviewWaitlistInterestPayload,
  type NurtureWithdrawFromWaitlistPayload,
} from "./domain/institution/enrollment-waitlist.js";
import {
  endTrialSpec,
  extendTrialSpec,
  markTrialReviewReachedSpec,
  prepareTrialRelationshipSpec,
  proposeFormalEnrollmentSpec,
  startTrialSpec,
  type NurtureEndTrialPayload,
  type NurtureExtendTrialPayload,
  type NurtureMarkTrialReviewReachedPayload,
  type NurturePrepareTrialRelationshipPayload,
  type NurtureProposeFormalEnrollmentPayload,
  type NurtureStartTrialPayload,
  type NurtureTrialGrantTermsSnapshotV1,
  type NurtureTrialPairOwnerSnapshotV1,
} from "./domain/institution/enrollment-trial-lifecycle.js";
import {
  formalizeEnrollmentSpec,
  type NurtureEnrollmentFormalizationOwnerEvidenceV1,
  type NurtureFormalizeEnrollmentPayload,
} from "./domain/institution/enrollment-formalization.js";
import type {
  NurtureEnrollmentJourneyWorkflowSnapshotV1,
  NurtureInstitutionWorkflowProjectionV1,
} from "./domain/institution/enrollment-journey-workflow.js";
import type { ProtectedContentEnvelopeV1 } from "./harness/protected-content.js";
import {
  parseNurtureWorkflowRunReservationEvidenceV1,
  type NurtureWorkflowRunReservationEvidenceV1,
} from "./domain/institution/workflow-run-settlement.js";
import type { NurtureEnrollmentJourneyCurrentOwnerCarrierV1 } from "./enrollment-journey-current-owner-carrier.js";
import {
  parseNurtureEnrollmentJourneyGuardianOwnerCarrierV1,
  type NurtureEnrollmentJourneyGuardianOwnerCarrierV1,
} from "./enrollment-journey-guardian-owner-carrier.js";

export const NURTURE_ENROLLMENT_JOURNEY_QUERY_KEYS = [
  "query_institution_enrollment_journey",
  "query_institution_capacity_waitlist",
  "query_guardian_enrollment_waitlist",
] as const;

export type NurtureEnrollmentJourneyQueryKey =
  (typeof NURTURE_ENROLLMENT_JOURNEY_QUERY_KEYS)[number];
export type NurtureEnrollmentJourneySurfaceCapabilityKey =
  | NurtureEnrollmentJourneyQueryKey
  | NurtureEnrollmentJourneyCommandKey;
export type NurtureEnrollmentJourneySurfaceKey =
  | "institution_board"
  | "institution_workbench"
  | "guardian_nurture_chat"
  | "guardian_family_board";
export type NurtureEnrollmentJourneyActiveRole =
  | "institution_admin"
  | "guardian";

type EmptyInput = Record<string, never>;
type ReasonInput = { reasonKey: string };
type StartInquiryInput = {
  preferredLabel: string;
  birthYearMonth?: string;
  ageBandKey?: string;
  expectedEntryStartDate: string;
  expectedEntryEndDate: string;
  targetClassTypeKey: string;
  targetAgeBandKey: string;
  targetCareGroupOptionRef?: string;
  careScheduleNeedKeys: string[];
  sourceChannel: string;
  safetyLabelKeys: string[];
  initialContactAt: string;
  nextTouchpointAt: string;
};
type ExternalTouchpointInput = {
  sourceChannel: string;
  confirmedNeedKeys: string[];
  safetyLabelKeys: string[];
  nextActionKey: string;
  responsibleRole: "institution_admin" | "guardian" | "caregiver" | "system_owner" | "none";
  dueAt: string;
  nextTouchpointAt: string;
  occurredAt: string;
  summary: string;
  supersededTouchpointOptionRef?: string;
  correctionReason?: string;
};
type NativeTouchpointInput = Omit<ExternalTouchpointInput, "occurredAt" | "summary" | "supersededTouchpointOptionRef" | "correctionReason"> & {
  sourceMessageOptionRef: string;
};
type VisitInput = { disposition: "recorded" | "skipped" };
type QualifyWaitlistInput = {
  targetCareGroupOptionRef: string;
  categoryKey: string;
  categoryBasisKey: string;
  nextReviewAt: string;
};
type ReviewWaitlistInput = {
  interestState: "confirmed" | "unanswered";
  nextReviewAt: string;
};
type OverrideWaitlistInput = {
  categoryKey: string;
  categoryBasisKey: string;
  reasonKey: string;
};
type IssueOfferInput = {
  expiresAt: string;
  trialStartsAt: string;
  trialEndsAt: string;
  reviewAt: string;
  reasonKey: string;
};
type DeclineOfferInput = {
  disposition: "declined" | "expired";
  nextReviewAt: string;
  reasonKey: string;
};
type ExtendTrialInput = {
  trialEndsAt: string;
  reviewAt: string;
  reasonKey: string;
};
type ProposeFormalInput = {
  proposedFormalStartAt: string;
  proposedGrantPurposes: string[];
  proposedGrantExpiresAt: string;
  safeFamilySummary: string;
  proposalExpiresAt: string;
  reasonKey: string;
};

type OperationInputByCapability = {
  query_institution_enrollment_journey: EmptyInput;
  query_institution_capacity_waitlist: EmptyInput;
  query_guardian_enrollment_waitlist: EmptyInput;
  start_enrollment_inquiry: StartInquiryInput;
  record_external_touchpoint: ExternalTouchpointInput;
  confirm_native_touchpoint_note: NativeTouchpointInput;
  confirm_intent_conversation: EmptyInput;
  record_or_skip_visit: VisitInput;
  close_inquiry: ReasonInput;
  qualify_capacity_waitlist: QualifyWaitlistInput;
  review_waitlist_interest: ReviewWaitlistInput;
  override_waitlist_category: OverrideWaitlistInput;
  issue_trial_offer: IssueOfferInput;
  accept_trial_offer: EmptyInput;
  decline_or_expire_trial_offer: DeclineOfferInput;
  withdraw_from_waitlist: ReasonInput;
  cancel_trial_preparation: ReasonInput;
  prepare_trial_relationship: EmptyInput;
  start_trial: EmptyInput;
  mark_trial_review_reached: EmptyInput;
  extend_trial: ExtendTrialInput;
  propose_formal_enrollment: ProposeFormalInput;
  formalize_enrollment: EmptyInput;
  end_trial: ReasonInput;
};

/**
 * Default-off module bridge input. It composes the public business DTO with
 * opaque prepare/confirmation refs, but is not the formal Surface invocation
 * envelope or its public error response; I3 owns that ingress mapping.
 */
export type NurtureEnrollmentJourneyAdapterRequest<
  Key extends NurtureEnrollmentJourneySurfaceCapabilityKey =
    NurtureEnrollmentJourneySurfaceCapabilityKey,
> = {
  capabilityKey: Key;
  capabilityVersion: "1.0.0";
  targetOptionRef: string;
  operationInput: OperationInputByCapability[Key];
} & (Key extends NurtureEnrollmentJourneyQueryKey
  ? { confirmationRef?: never }
  : { confirmationRef: string });

export type NurtureEnrollmentJourneyTrustedContextV1 = {
  workspace_id: string;
  actor_participant_ref: string;
  /** Verified Host invocation identity; never a Nurture command id. */
  invocation_request_id: string;
  host_correlation_id: string;
  host_trace_id?: string;
  command_request_id: string;
  client_surface: WorkflowCommandMeta["client_surface"];
  /** Signed Host reservation evidence; admitted only for inquiry creation. */
  host_workflow_run_reservation?: NurtureWorkflowRunReservationEvidenceV1;
  /** Request-scoped Host owner evidence; never persisted in prepared state. */
  current_owner_carrier?: NurtureEnrollmentJourneyCurrentOwnerCarrierV1;
  /** Fresh Host Guardian action/pair evidence for chat/mobile execution. */
  guardian_owner_carrier?: NurtureEnrollmentJourneyGuardianOwnerCarrierV1;
  /** Derived only from the enclosing signed invocation at formalization time. */
  guardian_invocation_nonce_hash?: string;
  guardian_evidence_expires_at?: string;
};

type PreparedHeads = {
  workflow?: number;
  waitlist_entry?: number;
  trial_offer?: number;
  reservation?: number;
  capacity_revision?: number;
  enrollment?: number;
  grant?: number;
  formal_proposal?: 1;
};

type PreparedRefs = {
  workflow?: string;
  target_care_group?: string;
  waitlist_entry?: string;
  trial_offer?: string;
  reservation?: string;
  enrollment?: string;
  grant?: string;
  formal_proposal?: string;
  superseded_touchpoint?: string;
};

/**
 * Server-only binding result. None of these fields may be read from the public
 * operation DTO. I3 will supply the authenticated owner implementation; I2-B
 * uses only injected synthetic bindings.
 */
export type NurtureEnrollmentJourneyPreparedBindingV1 = {
  surface_key: NurtureEnrollmentJourneySurfaceKey;
  active_role: NurtureEnrollmentJourneyActiveRole;
  institution_ref: string;
  role_assignment_ref?: string;
  workflow_run_ref?: CanonicalRef;
  heads: PreparedHeads;
  refs: PreparedRefs;
  contact_owner_snapshot?: NurtureEnrollmentContactOwnerSnapshotV1;
  native_source_owner_snapshot?: NurtureEnrollmentNativeSourceOwnerSnapshotV1;
  guardian_action_owner_snapshot?: NurtureEnrollmentGuardianActionOwnerSnapshotV1;
  family_acceptance_owner_snapshot?: NurtureEnrollmentGuardianActionOwnerSnapshotV1;
  pair_owner_snapshot?: NurtureTrialPairOwnerSnapshotV1;
  grant_terms_snapshot?: NurtureTrialGrantTermsSnapshotV1;
  formalization_owner_evidence?: NurtureEnrollmentFormalizationOwnerEvidenceV1;
  acceptance_ref?: CanonicalRef;
  accepted_at?: string;
  protected_birth_year_month?: ProtectedContentEnvelopeV1;
  protected_external_summary?: ProtectedContentEnvelopeV1;
};

export type NurtureEnrollmentJourneyBindingDecision =
  | { status: "resolved"; binding: NurtureEnrollmentJourneyPreparedBindingV1 }
  | { status: "denied" | "unavailable"; reason_code: string };

export type NurtureEnrollmentJourneyBindingPort = {
  resolve(input: {
    request: NurtureEnrollmentJourneyAdapterRequest;
    trusted: NurtureEnrollmentJourneyTrustedContextV1;
  }): Promise<NurtureEnrollmentJourneyBindingDecision>;
};

export type NurtureEnrollmentJourneyCommandExecutionResult =
  | {
      status: "committed";
      disposition: "executed" | "replayed";
      workflow: NurtureEnrollmentJourneyWorkflowSnapshotV1;
    }
  | {
      status: "not_committed";
      decision: "invalid" | "blocked" | "conflict" | "idempotency_conflict" | "command_busy" | "technical_error";
      reason_code: string;
    }
  | { status: "outcome_unknown"; reason_code: string };

export type NurtureEnrollmentJourneyCommandExecutor = {
  execute<Input>(input: {
    capability_key: NurtureEnrollmentJourneyCommandKey;
    /** I3 must verify and consume this binding inside the command transaction. */
    confirmation_ref: string;
    institution_ref: string;
    role_assignment_ref?: string;
    trusted: NurtureEnrollmentJourneyTrustedContextV1;
    spec: NurtureCommandSpec<Input>;
    payload: Input;
  }): Promise<NurtureEnrollmentJourneyCommandExecutionResult>;
};

export type NurtureEnrollmentJourneyTargetOptionIssuer = {
  issue(input: {
    workspace_id: string;
    actor_participant_ref: string;
  } & ({
    kind: "care_group";
    target_ref: string;
  } | {
    kind: "journey";
    target_ref: string;
    waitlist_entry_ref: string;
    waitlist_entry_head: number;
  })): string | null;
};

export type NurtureEnrollmentJourneySurfaceDeps = {
  bindings: NurtureEnrollmentJourneyBindingPort;
  commands: NurtureEnrollmentJourneyCommandExecutor;
  journeyQueries: NurtureEnrollmentJourneyRepository;
  waitlistQueries: NurtureEnrollmentWaitlistQueryRepository;
  targetOptions: NurtureEnrollmentJourneyTargetOptionIssuer;
};

type NurtureEnrollmentJourneyActionResultV1 = {
  effect: NurtureEnrollmentJourneyCommandKey;
  workflowRunRef: string;
  workflowHead: number;
  lifecycle: NurtureEnrollmentJourneyWorkflowSnapshotV1["lifecycle"];
  currentStage: NurtureEnrollmentJourneyWorkflowSnapshotV1["current_stage"];
  waitingState: NurtureEnrollmentJourneyWorkflowSnapshotV1["waiting_state"];
  pendingTransition: NurtureEnrollmentJourneyWorkflowSnapshotV1["pending_transition"];
  completedMilestones: readonly NurtureEnrollmentJourneyWorkflowSnapshotV1["completed_milestones"][number][];
  updatedAt: string;
};

const TOKEN = /^[a-z][a-z0-9_:-]{0,99}$/;
const OPAQUE_REF = /^.{1,512}$/s;
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const onlyKeys = (value: Record<string, unknown>, keys: readonly string[]): boolean =>
  Object.keys(value).every((key) => keys.includes(key));
const token = (value: unknown): value is string =>
  typeof value === "string" && TOKEN.test(value);
const text = (value: unknown, max: number): value is string =>
  typeof value === "string" && value.length > 0 && value.length <= max;
const trustedIdentity = (value: unknown): value is string =>
  text(value, 200) && value.trim() === value;
const instant = (value: unknown): value is string => {
  if (typeof value !== "string") return false;
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString() === value;
};
const date = (value: unknown): value is string =>
  typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  new Date(`${value}T00:00:00.000Z`).toISOString().slice(0, 10) === value;
const tokenList = (value: unknown, min = 0, max = 32): value is string[] =>
  Array.isArray(value) && value.length >= min && value.length <= max &&
  value.every(token) && new Set(value).size === value.length;
const exact = (value: unknown, keys: readonly string[]): value is Record<string, unknown> =>
  isRecord(value) && onlyKeys(value, keys);

const validateOperationInput = (
  capability: NurtureEnrollmentJourneySurfaceCapabilityKey,
  value: unknown,
): value is OperationInputByCapability[typeof capability] => {
  const empty = [
    ...NURTURE_ENROLLMENT_JOURNEY_QUERY_KEYS,
    "confirm_intent_conversation",
    "accept_trial_offer",
    "prepare_trial_relationship",
    "start_trial",
    "mark_trial_review_reached",
    "formalize_enrollment",
  ] as readonly string[];
  if (empty.includes(capability)) return exact(value, []);
  if (["close_inquiry", "withdraw_from_waitlist", "cancel_trial_preparation", "end_trial"].includes(capability)) {
    return exact(value, ["reasonKey"]) && token(value.reasonKey);
  }
  if (capability === "record_or_skip_visit") {
    return exact(value, ["disposition"]) &&
      (value.disposition === "recorded" || value.disposition === "skipped");
  }
  if (capability === "start_enrollment_inquiry") {
    if (!exact(value, [
      "preferredLabel", "birthYearMonth", "ageBandKey", "expectedEntryStartDate",
      "expectedEntryEndDate", "targetClassTypeKey", "targetAgeBandKey",
      "targetCareGroupOptionRef", "careScheduleNeedKeys", "sourceChannel",
      "safetyLabelKeys", "initialContactAt", "nextTouchpointAt",
    ])) return false;
    const hasBirthMonth = typeof value.birthYearMonth === "string";
    const hasAgeBand = typeof value.ageBandKey === "string";
    return text(value.preferredLabel, 120) && hasBirthMonth !== hasAgeBand &&
      (!hasBirthMonth || /^\d{4}-(0[1-9]|1[0-2])$/.test(String(value.birthYearMonth))) &&
      (!hasAgeBand || token(value.ageBandKey)) && date(value.expectedEntryStartDate) &&
      date(value.expectedEntryEndDate) && value.expectedEntryEndDate >= value.expectedEntryStartDate &&
      token(value.targetClassTypeKey) && token(value.targetAgeBandKey) &&
      (value.targetCareGroupOptionRef === undefined ||
        (typeof value.targetCareGroupOptionRef === "string" && OPAQUE_REF.test(value.targetCareGroupOptionRef))) &&
      tokenList(value.careScheduleNeedKeys, 1) && token(value.sourceChannel) &&
      tokenList(value.safetyLabelKeys) && instant(value.initialContactAt) &&
      instant(value.nextTouchpointAt) && value.nextTouchpointAt >= value.initialContactAt;
  }
  if (capability === "record_external_touchpoint" || capability === "confirm_native_touchpoint_note") {
    const external = capability === "record_external_touchpoint";
    const keys = external
      ? ["sourceChannel", "confirmedNeedKeys", "safetyLabelKeys", "nextActionKey", "responsibleRole", "dueAt", "nextTouchpointAt", "occurredAt", "summary", "supersededTouchpointOptionRef", "correctionReason"]
      : ["sourceMessageOptionRef", "sourceChannel", "confirmedNeedKeys", "safetyLabelKeys", "nextActionKey", "responsibleRole", "dueAt", "nextTouchpointAt"];
    if (!exact(value, keys)) return false;
    const role = value.responsibleRole;
    const common = token(value.sourceChannel) && tokenList(value.confirmedNeedKeys) &&
      tokenList(value.safetyLabelKeys) && token(value.nextActionKey) &&
      ["institution_admin", "guardian", "caregiver", "system_owner", "none"].includes(String(role)) &&
      instant(value.dueAt) && instant(value.nextTouchpointAt) &&
      String(value.nextTouchpointAt) >= String(value.dueAt);
    if (!common) return false;
    if (!external) return typeof value.sourceMessageOptionRef === "string" && OPAQUE_REF.test(value.sourceMessageOptionRef);
    const corrected = value.supersededTouchpointOptionRef !== undefined || value.correctionReason !== undefined;
    return instant(value.occurredAt) && String(value.dueAt) >= String(value.occurredAt) && text(value.summary, 2_000) &&
      (!corrected || (typeof value.supersededTouchpointOptionRef === "string" &&
        OPAQUE_REF.test(value.supersededTouchpointOptionRef) && text(value.correctionReason, 1_000)));
  }
  if (capability === "qualify_capacity_waitlist") {
    return exact(value, ["targetCareGroupOptionRef", "categoryKey", "categoryBasisKey", "nextReviewAt"]) &&
      typeof value.targetCareGroupOptionRef === "string" && OPAQUE_REF.test(value.targetCareGroupOptionRef) &&
      token(value.categoryKey) && token(value.categoryBasisKey) && instant(value.nextReviewAt);
  }
  if (capability === "review_waitlist_interest") {
    return exact(value, ["interestState", "nextReviewAt"]) &&
      (value.interestState === "confirmed" || value.interestState === "unanswered") && instant(value.nextReviewAt);
  }
  if (capability === "override_waitlist_category") {
    return exact(value, ["categoryKey", "categoryBasisKey", "reasonKey"]) &&
      token(value.categoryKey) && token(value.categoryBasisKey) && token(value.reasonKey);
  }
  if (capability === "issue_trial_offer") {
    return exact(value, ["expiresAt", "trialStartsAt", "trialEndsAt", "reviewAt", "reasonKey"]) &&
      instant(value.expiresAt) && instant(value.trialStartsAt) && instant(value.trialEndsAt) &&
      instant(value.reviewAt) && token(value.reasonKey);
  }
  if (capability === "decline_or_expire_trial_offer") {
    return exact(value, ["disposition", "nextReviewAt", "reasonKey"]) &&
      (value.disposition === "declined" || value.disposition === "expired") &&
      instant(value.nextReviewAt) && token(value.reasonKey);
  }
  if (capability === "extend_trial") {
    return exact(value, ["trialEndsAt", "reviewAt", "reasonKey"]) &&
      instant(value.trialEndsAt) && instant(value.reviewAt) && token(value.reasonKey);
  }
  if (capability === "propose_formal_enrollment") {
    return exact(value, ["proposedFormalStartAt", "proposedGrantPurposes", "proposedGrantExpiresAt", "safeFamilySummary", "proposalExpiresAt", "reasonKey"]) &&
      instant(value.proposedFormalStartAt) && tokenList(value.proposedGrantPurposes, 1, 16) &&
      instant(value.proposedGrantExpiresAt) && text(value.safeFamilySummary, 500) &&
      instant(value.proposalExpiresAt) && token(value.reasonKey);
  }
  return false;
};

const isQueryKey = (key: string): key is NurtureEnrollmentJourneyQueryKey =>
  (NURTURE_ENROLLMENT_JOURNEY_QUERY_KEYS as readonly string[]).includes(key);
const isCommandKey = (value: string): value is NurtureEnrollmentJourneyCommandKey =>
  (NURTURE_ENROLLMENT_JOURNEY_COMMAND_KEYS as readonly string[]).includes(value);

/**
 * Command intent = the adapter request without its confirmation. The prepare
 * lane freezes exactly this shape; the confirmation is owner-issued, never
 * caller-supplied (record 86 / G4-E shape).
 */
export type NurtureEnrollmentJourneyCommandIntentV1<
  Key extends NurtureEnrollmentJourneyCommandKey = NurtureEnrollmentJourneyCommandKey,
> = {
  capabilityKey: Key;
  capabilityVersion: "1.0.0";
  targetOptionRef: string;
  operationInput: OperationInputByCapability[Key];
};

export const parseNurtureEnrollmentJourneyCommandIntent = (
  value: unknown,
): NurtureEnrollmentJourneyCommandIntentV1 | null => {
  if (!exact(value, [
    "capabilityKey",
    "capabilityVersion",
    "targetOptionRef",
    "operationInput",
  ]) || typeof value.capabilityKey !== "string") {
    return null;
  }
  const capability = value.capabilityKey;
  if (!isCommandKey(capability) ||
    value.capabilityVersion !== "1.0.0" || typeof value.targetOptionRef !== "string" ||
    !OPAQUE_REF.test(value.targetOptionRef) ||
    !validateOperationInput(capability, value.operationInput)) {
    return null;
  }
  return value as NurtureEnrollmentJourneyCommandIntentV1;
};

export const parseNurtureEnrollmentJourneyAdapterRequest = (
  value: unknown,
): NurtureEnrollmentJourneyAdapterRequest | null => {
  if (!exact(value, [
    "capabilityKey",
    "capabilityVersion",
    "targetOptionRef",
    "operationInput",
    "confirmationRef",
  ]) || typeof value.capabilityKey !== "string") {
    return null;
  }
  const capability = value.capabilityKey;
  if ((!isQueryKey(capability) && !isCommandKey(capability)) ||
    value.capabilityVersion !== "1.0.0" || typeof value.targetOptionRef !== "string" ||
    !OPAQUE_REF.test(value.targetOptionRef) ||
    (value.confirmationRef !== undefined &&
      (typeof value.confirmationRef !== "string" || !OPAQUE_REF.test(value.confirmationRef)))) {
    return null;
  }
  const query = isQueryKey(capability);
  if ((query && value.confirmationRef !== undefined) ||
    (!query && value.confirmationRef === undefined) ||
    !validateOperationInput(capability, value.operationInput)) return null;
  return value as NurtureEnrollmentJourneyAdapterRequest;
};

const validTrustedContext = (
  trusted: NurtureEnrollmentJourneyTrustedContextV1,
): boolean =>
  trustedIdentity(trusted.workspace_id) &&
  trustedIdentity(trusted.actor_participant_ref) &&
  trustedIdentity(trusted.invocation_request_id) &&
  trustedIdentity(trusted.host_correlation_id) &&
  (trusted.host_trace_id === undefined || trustedIdentity(trusted.host_trace_id)) &&
  trustedIdentity(trusted.command_request_id) &&
  (trusted.host_workflow_run_reservation === undefined ||
    parseNurtureWorkflowRunReservationEvidenceV1(
      trusted.host_workflow_run_reservation,
    ) !== null) &&
  (trusted.guardian_invocation_nonce_hash === undefined ||
    /^[0-9a-f]{64}$/u.test(trusted.guardian_invocation_nonce_hash)) &&
  (trusted.guardian_evidence_expires_at === undefined ||
    instant(trusted.guardian_evidence_expires_at)) &&
  (trusted.guardian_owner_carrier === undefined
    ? trusted.guardian_invocation_nonce_hash === undefined
      && trusted.guardian_evidence_expires_at === undefined
    : parseNurtureEnrollmentJourneyGuardianOwnerCarrierV1(
        trusted.guardian_owner_carrier,
      ) !== null
      && trusted.guardian_invocation_nonce_hash !== undefined
      && trusted.guardian_evidence_expires_at !== undefined) &&
  ["chat_workflow_control", "web_run_workbench", "mobile_dashboard"].includes(
    trusted.client_surface,
  );

const sameCanonicalRef = (left: CanonicalRef, right: CanonicalRef): boolean =>
  left.schema_version === right.schema_version &&
  left.namespace === right.namespace &&
  left.object_type === right.object_type &&
  left.object_id === right.object_id &&
  left.version === right.version;

const required = <Value>(value: Value | undefined): Value => {
  if (value === undefined) throw new Error("incomplete_trusted_binding");
  return value;
};
const workflowBase = (
  trusted: NurtureEnrollmentJourneyTrustedContextV1,
  binding: NurtureEnrollmentJourneyPreparedBindingV1,
) => ({
  workspace_id: trusted.workspace_id,
  institution_ref: binding.institution_ref,
  workflow_ref: required(binding.refs.workflow),
  expected_workflow_head: required(binding.heads.workflow),
});
const adminBase = (
  trusted: NurtureEnrollmentJourneyTrustedContextV1,
  binding: NurtureEnrollmentJourneyPreparedBindingV1,
) => ({ ...workflowBase(trusted, binding), role_assignment_ref: required(binding.role_assignment_ref) });
const entryBase = (
  trusted: NurtureEnrollmentJourneyTrustedContextV1,
  binding: NurtureEnrollmentJourneyPreparedBindingV1,
) => ({
  ...workflowBase(trusted, binding),
  entry_ref: required(binding.refs.waitlist_entry),
  expected_entry_head: required(binding.heads.waitlist_entry),
});
const offerBase = (
  trusted: NurtureEnrollmentJourneyTrustedContextV1,
  binding: NurtureEnrollmentJourneyPreparedBindingV1,
) => ({
  ...entryBase(trusted, binding),
  offer_ref: required(binding.refs.trial_offer),
  expected_offer_head: required(binding.heads.trial_offer),
});
const entitiesBase = (
  trusted: NurtureEnrollmentJourneyTrustedContextV1,
  binding: NurtureEnrollmentJourneyPreparedBindingV1,
) => ({
  ...adminBase(trusted, binding),
  reservation_ref: required(binding.refs.reservation),
  expected_reservation_head: required(binding.heads.reservation),
  enrollment_ref: required(binding.refs.enrollment),
  expected_enrollment_head: required(binding.heads.enrollment),
  grant_ref: required(binding.refs.grant),
  expected_grant_head: required(binding.heads.grant),
});
const mixedActor = (binding: NurtureEnrollmentJourneyPreparedBindingV1) =>
  binding.active_role === "institution_admin"
    ? { role_assignment_ref: required(binding.role_assignment_ref) }
    : { guardian_action_owner_snapshot: required(binding.guardian_action_owner_snapshot) };

const roleAndSurfaceAllowed = (
  capability: NurtureEnrollmentJourneySurfaceCapabilityKey,
  input: OperationInputByCapability[NurtureEnrollmentJourneySurfaceCapabilityKey],
  binding: NurtureEnrollmentJourneyPreparedBindingV1,
): boolean => {
  if (capability === "query_institution_enrollment_journey" || capability === "query_institution_capacity_waitlist") {
    return binding.active_role === "institution_admin" &&
      (binding.surface_key === "institution_board" || binding.surface_key === "institution_workbench");
  }
  if (capability === "query_guardian_enrollment_waitlist") {
    return binding.active_role === "guardian" &&
      (binding.surface_key === "guardian_nurture_chat" || binding.surface_key === "guardian_family_board");
  }
  const guardianOnly = ["accept_trial_offer", "withdraw_from_waitlist", "formalize_enrollment"] as readonly string[];
  let requiredRole: NurtureEnrollmentJourneyActiveRole = guardianOnly.includes(capability)
    ? "guardian"
    : "institution_admin";
  if (capability === "review_waitlist_interest" && (input as ReviewWaitlistInput).interestState === "confirmed") requiredRole = "guardian";
  if (capability === "decline_or_expire_trial_offer" && (input as DeclineOfferInput).disposition === "declined") requiredRole = "guardian";
  if (capability === "cancel_trial_preparation") requiredRole = binding.active_role;
  return binding.active_role === requiredRole &&
    (requiredRole === "institution_admin"
      ? binding.surface_key === "institution_workbench"
      : binding.surface_key === "guardian_nurture_chat" || binding.surface_key === "guardian_family_board");
};

const clientSurfaceMatches = (
  clientSurface: WorkflowCommandMeta["client_surface"],
  surface: NurtureEnrollmentJourneySurfaceKey,
): boolean =>
  (clientSurface === "web_run_workbench" && surface === "institution_workbench") ||
  (clientSurface === "mobile_dashboard" && (surface === "institution_board" || surface === "guardian_family_board")) ||
  (clientSurface === "chat_workflow_control" && surface === "guardian_nurture_chat");

const presentWorkflow = (
  projection: NurtureInstitutionWorkflowProjectionV1,
) => ({
  contractVersion: projection.contractVersion,
  workflowRunRef: projection.workflowRunRef.object_id,
  workflowType: projection.workflowType,
  safeTitle: projection.safeTitle,
  safeSummary: projection.safeSummary,
  state: projection.state,
  lifecycle: projection.lifecycle,
  currentStage: projection.currentStage,
  waitingState: projection.waitingState,
  pendingTransition: projection.pendingTransition,
  completedMilestones: projection.completedMilestones,
  ...(projection.safeBlocker ? { safeBlocker: projection.safeBlocker } : {}),
  nextAction: projection.nextAction,
  responsibleRole: projection.responsibleRole,
  ...(projection.dueAt ? { dueAt: projection.dueAt } : {}),
  workflowHead: projection.workflowHead,
  projectionVersion: projection.projectionVersion,
  startedAt: projection.startedAt,
  updatedAt: projection.updatedAt,
});

const presentNurtureEnrollmentJourneyAction = (
  effect: NurtureEnrollmentJourneyCommandKey,
  workflow: NurtureEnrollmentJourneyWorkflowSnapshotV1,
): NurtureEnrollmentJourneyActionResultV1 => ({
  effect,
  workflowRunRef: workflow.workflow_run_ref.object_id,
  workflowHead: workflow.workflow_head,
  lifecycle: workflow.lifecycle,
  currentStage: workflow.current_stage,
  waitingState: workflow.waiting_state,
  pendingTransition: workflow.pending_transition,
  completedMilestones: workflow.completed_milestones,
  updatedAt: workflow.updated_at,
});

const publicFamilyWaitlist = (projection: NurtureFamilyWaitlistProjectionV1) => ({
  contractVersion: projection.contractVersion,
  status: projection.status,
  targetClassSafeLabel: projection.targetClassSafeLabel,
  lastReviewAt: projection.lastReviewAt,
  nextExpectedContactAt: projection.nextExpectedContactAt,
});

const presentAdminWaitlist = (
  projection: NurtureAdminWaitlistProjectionV1,
  trusted: NurtureEnrollmentJourneyTrustedContextV1,
  options: NurtureEnrollmentJourneyTargetOptionIssuer,
) => {
  const targetCareGroupRef = options.issue({
    workspace_id: trusted.workspace_id,
    actor_participant_ref: trusted.actor_participant_ref,
    kind: "care_group",
    target_ref: projection.targetCareGroupRef,
  });
  if (!targetCareGroupRef || !OPAQUE_REF.test(targetCareGroupRef)) return null;
  const orderedEntries = [];
  for (const entry of projection.orderedEntries) {
    const journeyTargetOptionRef = options.issue({
      workspace_id: trusted.workspace_id,
      actor_participant_ref: trusted.actor_participant_ref,
      kind: "journey",
      target_ref: entry.workflowRef,
      waitlist_entry_ref: entry.entryRef,
      waitlist_entry_head: entry.entryHead,
    });
    if (!journeyTargetOptionRef || !OPAQUE_REF.test(journeyTargetOptionRef)) return null;
    orderedEntries.push({
      journeyTargetOptionRef,
      targetClassSafeLabel: entry.targetClassSafeLabel,
      lifecycle: entry.lifecycle,
      continuedInterest: entry.continuedInterest,
      categoryKey: entry.categoryKey,
      categoryBasisKey: entry.categoryBasisKey,
      policyRef: entry.policyRef,
      policyRevision: entry.policyRevision,
      waitlistQualifiedAt: entry.waitlistQualifiedAt,
      nextReviewAt: entry.nextReviewAt,
      lastConfirmedAt: entry.lastConfirmedAt,
      hasOpenOffer: entry.currentOfferRef !== undefined,
    });
  }
  return {
    contractVersion: projection.contractVersion,
    targetCareGroupRef,
    targetClassSafeLabel: projection.targetClassSafeLabel,
    orderedEntries,
  };
};

type NurtureEnrollmentJourneyAdapterResponse =
  | {
      status: "ok";
      result:
        | { workflow: ReturnType<typeof presentWorkflow> }
        | { waitlist: ReturnType<typeof publicFamilyWaitlist> | NonNullable<ReturnType<typeof presentAdminWaitlist>> }
        | NurtureEnrollmentJourneyActionResultV1;
      disposition?: "executed" | "replayed";
    }
  | { status: "invalid" | "denied" | "unavailable"; reason_code: string }
  | {
      status: "not_committed";
      decision: Exclude<NurtureEnrollmentJourneyCommandExecutionResult, { status: "committed" } | { status: "outcome_unknown" }>["decision"];
      reason_code: string;
    }
  | { status: "outcome_unknown"; reason_code: string };

const defaultUnavailable = Object.freeze({
  status: "unavailable" as const,
  reason_code: "enrollment_journey_runtime_unavailable",
});
export const defaultNurtureEnrollmentJourneySurfaceDeps: NurtureEnrollmentJourneySurfaceDeps = Object.freeze({
  bindings: Object.freeze({ resolve: async () => defaultUnavailable }),
  commands: Object.freeze({
    execute: async () => ({
      status: "not_committed" as const,
      decision: "blocked" as const,
      reason_code: defaultUnavailable.reason_code,
    }),
  }),
  journeyQueries: Object.freeze({ readWorkflow: async () => defaultUnavailable }),
  waitlistQueries: Object.freeze({
    readAdminQueue: async () => defaultUnavailable,
    readFamilyStatus: async () => defaultUnavailable,
  }),
  targetOptions: Object.freeze({ issue: () => null }),
});

export class NurtureEnrollmentJourneySurfaceHandler {
  constructor(private readonly deps: NurtureEnrollmentJourneySurfaceDeps) {}

  async handle(
    requestValue: unknown,
    trusted: NurtureEnrollmentJourneyTrustedContextV1,
  ): Promise<NurtureEnrollmentJourneyAdapterResponse> {
    const request = parseNurtureEnrollmentJourneyAdapterRequest(requestValue);
    if (!request) return { status: "invalid", reason_code: "invalid_enrollment_journey_request" };
    if (!validTrustedContext(trusted)) {
      return { status: "unavailable", reason_code: "invalid_trusted_enrollment_journey_context" };
    }
    const resolved = await this.deps.bindings.resolve({ request, trusted });
    if (resolved.status !== "resolved") return resolved;
    const { binding } = resolved;
    if (!clientSurfaceMatches(trusted.client_surface, binding.surface_key) ||
      !roleAndSurfaceAllowed(request.capabilityKey, request.operationInput, binding)) {
      return { status: "denied", reason_code: "enrollment_journey_surface_not_authorized" };
    }
    try {
      return isQueryKey(request.capabilityKey)
        ? this.query(
            request as NurtureEnrollmentJourneyAdapterRequest<NurtureEnrollmentJourneyQueryKey>,
            trusted,
            binding,
          )
        : this.execute(
            request as NurtureEnrollmentJourneyAdapterRequest<NurtureEnrollmentJourneyCommandKey>,
            trusted,
            binding,
          );
    } catch (error) {
      if (error instanceof Error && error.message === "incomplete_trusted_binding") {
        return { status: "unavailable", reason_code: error.message };
      }
      throw error;
    }
  }

  private async query(
    request: NurtureEnrollmentJourneyAdapterRequest<NurtureEnrollmentJourneyQueryKey>,
    trusted: NurtureEnrollmentJourneyTrustedContextV1,
    binding: NurtureEnrollmentJourneyPreparedBindingV1,
  ): Promise<NurtureEnrollmentJourneyAdapterResponse> {
    if (request.capabilityKey === "query_institution_enrollment_journey") {
      const result = await new NurtureEnrollmentJourneyQueryService(this.deps.journeyQueries).read({
        workspace_id: trusted.workspace_id,
        institution_ref: binding.institution_ref,
        participant_ref: trusted.actor_participant_ref,
        role_assignment_ref: required(binding.role_assignment_ref),
        workflow_ref: required(binding.refs.workflow),
        surface: binding.surface_key === "institution_board" ? "institution_admin_mobile" : "institution_admin_web",
      });
      if (result.status !== "resolved") return result;
      if (!sameCanonicalRef(result.projection.workflowRunRef, required(binding.workflow_run_ref))) {
        return { status: "unavailable", reason_code: "query_target_drift" };
      }
      return { status: "ok", result: { workflow: presentWorkflow(result.projection) } };
    }
    if (request.capabilityKey === "query_institution_capacity_waitlist") {
      const result = await new NurtureEnrollmentWaitlistQueryService(this.deps.waitlistQueries).readAdminQueue({
        workspace_id: trusted.workspace_id,
        institution_ref: binding.institution_ref,
        participant_ref: trusted.actor_participant_ref,
        role_assignment_ref: required(binding.role_assignment_ref),
        target_care_group_ref: required(binding.refs.target_care_group),
      });
      if (result.status !== "resolved") return result;
      if (result.projection.targetCareGroupRef !== binding.refs.target_care_group) {
        return { status: "unavailable", reason_code: "query_target_drift" };
      }
      const waitlist = presentAdminWaitlist(result.projection, trusted, this.deps.targetOptions);
      return waitlist
        ? { status: "ok", result: { waitlist } }
        : { status: "unavailable", reason_code: "target_option_issuer_unavailable" };
    }
    const result = await new NurtureEnrollmentWaitlistQueryService(this.deps.waitlistQueries).readFamilyStatus({
      workspace_id: trusted.workspace_id,
      institution_ref: binding.institution_ref,
      workflow_ref: required(binding.refs.workflow),
      owner_snapshot: required(binding.guardian_action_owner_snapshot),
    });
    return result.status === "resolved"
      ? { status: "ok", result: { waitlist: publicFamilyWaitlist(result.projection) } }
      : result;
  }

  private async execute(
    request: NurtureEnrollmentJourneyAdapterRequest<NurtureEnrollmentJourneyCommandKey>,
    trusted: NurtureEnrollmentJourneyTrustedContextV1,
    binding: NurtureEnrollmentJourneyPreparedBindingV1,
  ): Promise<NurtureEnrollmentJourneyAdapterResponse> {
    const key = request.capabilityKey;
    const input = request.operationInput;
    const run = <Input>(spec: NurtureCommandSpec<Input>, payload: Input) =>
      this.deps.commands.execute({
        capability_key: key,
        confirmation_ref: request.confirmationRef,
        institution_ref: binding.institution_ref,
        ...(binding.role_assignment_ref
          ? { role_assignment_ref: binding.role_assignment_ref }
          : {}),
        trusted,
        spec,
        payload,
      });
    let execution: NurtureEnrollmentJourneyCommandExecutionResult;
    switch (key) {
      case "start_enrollment_inquiry": {
        const value = input as StartInquiryInput;
        const payload: NurtureStartEnrollmentInquiryPayload = {
          workspace_id: trusted.workspace_id,
          institution_ref: binding.institution_ref,
          role_assignment_ref: required(binding.role_assignment_ref),
          expected_workflow_head: 0,
          workflow_run_ref: required(binding.workflow_run_ref),
          contact_owner_snapshot: required(binding.contact_owner_snapshot),
          preferred_label: value.preferredLabel,
          ...(value.birthYearMonth ? { protected_birth_year_month: required(binding.protected_birth_year_month) } : {}),
          ...(value.ageBandKey ? { age_band_key: value.ageBandKey } : {}),
          expected_entry_start_date: value.expectedEntryStartDate,
          expected_entry_end_date: value.expectedEntryEndDate,
          target_class_type_key: value.targetClassTypeKey,
          target_age_band_key: value.targetAgeBandKey,
          ...(value.targetCareGroupOptionRef ? { target_care_group_ref: required(binding.refs.target_care_group) } : {}),
          care_schedule_need_keys: value.careScheduleNeedKeys,
          source_channel: value.sourceChannel,
          safety_label_keys: value.safetyLabelKeys,
          initial_contact_at: value.initialContactAt,
          next_touchpoint_at: value.nextTouchpointAt,
        };
        execution = await run(startEnrollmentInquirySpec, payload);
        break;
      }
      case "record_external_touchpoint": {
        const value = input as ExternalTouchpointInput;
        const payload: NurtureRecordExternalTouchpointPayload = {
          ...adminBase(trusted, binding), source_channel: value.sourceChannel,
          confirmed_need_keys: value.confirmedNeedKeys, safety_label_keys: value.safetyLabelKeys,
          next_action_key: value.nextActionKey, responsible_role: value.responsibleRole,
          due_at: value.dueAt, next_touchpoint_at: value.nextTouchpointAt,
          occurred_at: value.occurredAt,
          external_summary_body_envelope: required(binding.protected_external_summary),
          ...(value.supersededTouchpointOptionRef ? {
            supersedes_touchpoint_ref: required(binding.refs.superseded_touchpoint),
            correction_reason: value.correctionReason,
          } : {}),
        };
        execution = await run(recordExternalTouchpointSpec, payload);
        break;
      }
      case "confirm_native_touchpoint_note": {
        const value = input as NativeTouchpointInput;
        const payload: NurtureConfirmNativeTouchpointNotePayload = {
          ...adminBase(trusted, binding), source_channel: value.sourceChannel,
          confirmed_need_keys: value.confirmedNeedKeys, safety_label_keys: value.safetyLabelKeys,
          next_action_key: value.nextActionKey, responsible_role: value.responsibleRole,
          due_at: value.dueAt, next_touchpoint_at: value.nextTouchpointAt,
          source_owner_snapshot: required(binding.native_source_owner_snapshot),
        };
        execution = await run(confirmNativeTouchpointNoteSpec, payload);
        break;
      }
      case "confirm_intent_conversation": {
        const payload: NurtureConfirmIntentConversationPayload = adminBase(trusted, binding);
        execution = await run(confirmIntentConversationSpec, payload);
        break;
      }
      case "record_or_skip_visit": {
        const payload: NurtureRecordOrSkipVisitPayload = {
          ...adminBase(trusted, binding), disposition: (input as VisitInput).disposition,
        };
        execution = await run(recordOrSkipVisitSpec, payload);
        break;
      }
      case "close_inquiry": {
        const payload: NurtureCloseInquiryPayload = {
          ...adminBase(trusted, binding), close_reason_key: (input as ReasonInput).reasonKey,
        };
        execution = await run(closeInquirySpec, payload);
        break;
      }
      case "qualify_capacity_waitlist": {
        const value = input as QualifyWaitlistInput;
        const payload: NurtureQualifyCapacityWaitlistPayload = {
          ...adminBase(trusted, binding), target_care_group_ref: required(binding.refs.target_care_group),
          expected_capacity_revision: required(binding.heads.capacity_revision),
          category_key: value.categoryKey, category_basis_key: value.categoryBasisKey,
          next_review_at: value.nextReviewAt,
          family_acceptance_owner_snapshot: required(binding.family_acceptance_owner_snapshot),
        };
        execution = await run(qualifyCapacityWaitlistSpec, payload);
        break;
      }
      case "review_waitlist_interest": {
        const value = input as ReviewWaitlistInput;
        const payload: NurtureReviewWaitlistInterestPayload = {
          ...entryBase(trusted, binding), ...mixedActor(binding),
          interest_state: value.interestState, next_review_at: value.nextReviewAt,
        };
        execution = await run(reviewWaitlistInterestSpec, payload);
        break;
      }
      case "override_waitlist_category": {
        const value = input as OverrideWaitlistInput;
        const payload: NurtureOverrideWaitlistCategoryPayload = {
          ...entryBase(trusted, binding), role_assignment_ref: required(binding.role_assignment_ref),
          category_key: value.categoryKey, category_basis_key: value.categoryBasisKey,
          reason_key: value.reasonKey,
        };
        execution = await run(overrideWaitlistCategorySpec, payload);
        break;
      }
      case "issue_trial_offer": {
        const value = input as IssueOfferInput;
        const payload: NurtureIssueTrialOfferPayload = {
          ...entryBase(trusted, binding), role_assignment_ref: required(binding.role_assignment_ref),
          expires_at: value.expiresAt, trial_starts_at: value.trialStartsAt,
          trial_ends_at: value.trialEndsAt, review_at: value.reviewAt, reason_key: value.reasonKey,
        };
        execution = await run(issueTrialOfferSpec, payload);
        break;
      }
      case "accept_trial_offer": {
        const payload: NurtureAcceptTrialOfferPayload = {
          ...offerBase(trusted, binding),
          guardian_action_owner_snapshot: required(binding.guardian_action_owner_snapshot),
        };
        execution = await run(acceptTrialOfferSpec, payload);
        break;
      }
      case "decline_or_expire_trial_offer": {
        const value = input as DeclineOfferInput;
        const payload: NurtureDeclineOrExpireTrialOfferPayload = {
          ...offerBase(trusted, binding), ...mixedActor(binding), disposition: value.disposition,
          next_review_at: value.nextReviewAt, reason_key: value.reasonKey,
        };
        execution = await run(declineOrExpireTrialOfferSpec, payload);
        break;
      }
      case "withdraw_from_waitlist": {
        const payload: NurtureWithdrawFromWaitlistPayload = {
          ...entryBase(trusted, binding),
          guardian_action_owner_snapshot: required(binding.guardian_action_owner_snapshot),
          reason_key: (input as ReasonInput).reasonKey,
        };
        execution = await run(withdrawFromWaitlistSpec, payload);
        break;
      }
      case "cancel_trial_preparation": {
        const payload: NurtureCancelTrialPreparationPayload = {
          ...offerBase(trusted, binding), ...mixedActor(binding),
          reservation_ref: required(binding.refs.reservation),
          expected_reservation_head: required(binding.heads.reservation),
          reason_key: (input as ReasonInput).reasonKey,
        };
        execution = await run(cancelTrialPreparationSpec, payload);
        break;
      }
      case "prepare_trial_relationship": {
        const payload: NurturePrepareTrialRelationshipPayload = {
          ...adminBase(trusted, binding), reservation_ref: required(binding.refs.reservation),
          expected_reservation_head: required(binding.heads.reservation),
          expected_capacity_revision: required(binding.heads.capacity_revision),
          pair_owner_snapshot: required(binding.pair_owner_snapshot),
          grant_terms_snapshot: required(binding.grant_terms_snapshot),
        };
        execution = await run(prepareTrialRelationshipSpec, payload);
        break;
      }
      case "start_trial": {
        const payload: NurtureStartTrialPayload = {
          ...entitiesBase(trusted, binding),
          expected_capacity_revision: required(binding.heads.capacity_revision),
          pair_owner_snapshot: required(binding.pair_owner_snapshot),
        };
        execution = await run(startTrialSpec, payload);
        break;
      }
      case "mark_trial_review_reached": {
        const payload: NurtureMarkTrialReviewReachedPayload = entitiesBase(trusted, binding);
        execution = await run(markTrialReviewReachedSpec, payload);
        break;
      }
      case "extend_trial": {
        const value = input as ExtendTrialInput;
        const payload: NurtureExtendTrialPayload = {
          ...entitiesBase(trusted, binding), trial_ends_at: value.trialEndsAt,
          review_at: value.reviewAt, reason_key: value.reasonKey,
        };
        execution = await run(extendTrialSpec, payload);
        break;
      }
      case "propose_formal_enrollment": {
        const value = input as ProposeFormalInput;
        const payload: NurtureProposeFormalEnrollmentPayload = {
          ...entitiesBase(trusted, binding),
          expected_capacity_revision: required(binding.heads.capacity_revision),
          proposed_formal_start_at: value.proposedFormalStartAt,
          proposed_grant_purposes: value.proposedGrantPurposes,
          proposed_grant_expires_at: value.proposedGrantExpiresAt,
          safe_family_summary: value.safeFamilySummary,
          proposal_expires_at: value.proposalExpiresAt,
          reason_key: value.reasonKey,
        };
        execution = await run(proposeFormalEnrollmentSpec, payload);
        break;
      }
      case "formalize_enrollment": {
        const payload: NurtureFormalizeEnrollmentPayload = {
          workflow_ref: required(binding.refs.workflow),
          proposal_ref: required(binding.refs.formal_proposal),
          acceptance_ref: required(binding.acceptance_ref),
          accepted_at: required(binding.accepted_at),
          expected_workflow_head: required(binding.heads.workflow),
          expected_proposal_head: required(binding.heads.formal_proposal),
          expected_enrollment_head: required(binding.heads.enrollment),
          expected_grant_head: required(binding.heads.grant),
          expected_reservation_head: required(binding.heads.reservation),
          owner_evidence: required(binding.formalization_owner_evidence),
        };
        execution = await run(formalizeEnrollmentSpec, payload);
        break;
      }
      case "end_trial": {
        const payload: NurtureEndTrialPayload = {
          ...entitiesBase(trusted, binding), reason_key: (input as ReasonInput).reasonKey,
        };
        execution = await run(endTrialSpec, payload);
        break;
      }
    }
    if (execution.status === "committed") {
      const expectedWorkflowRef = binding.refs.workflow;
      if (
        execution.workflow.workspace_id !== trusted.workspace_id ||
        execution.workflow.institution_ref !== binding.institution_ref ||
        !sameCanonicalRef(
          execution.workflow.workflow_run_ref,
          required(binding.workflow_run_ref),
        ) ||
        (expectedWorkflowRef !== undefined && execution.workflow.workflow_ref !== expectedWorkflowRef)
      ) {
        return { status: "unavailable", reason_code: "committed_result_scope_drift" };
      }
      return {
        status: "ok",
        disposition: execution.disposition,
        result: presentNurtureEnrollmentJourneyAction(key, execution.workflow),
      };
    }
    return execution;
  }
}
