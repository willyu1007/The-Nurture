import { randomUUID } from "node:crypto";
import {
  assertCanonicalRef,
  type CanonicalRef,
} from "@my-chat/workflow-contracts";
import {
  assertProtectedContentEnvelopeV1,
  type ProtectedContentEnvelopeV1,
} from "../../harness/protected-content.js";
import {
  NurtureDeterministicRollback,
  type NurtureCommandExecutionRecord,
  type NurtureCommandSpec,
} from "../commands/command-kernel.js";
import {
  NURTURE_ENROLLMENT_JOURNEY_WORKFLOW_CONTRACT_VERSION,
  NURTURE_ENROLLMENT_JOURNEY_WORKFLOW_TYPE,
  NURTURE_INSTITUTION_WORKFLOW_RESPONSIBLE_ROLES,
  projectNurtureEnrollmentJourneyWorkflowV1,
  type NurtureEnrollmentJourneyMilestone,
  type NurtureEnrollmentJourneyWorkflowSnapshotV1,
  type NurtureInstitutionWorkflowProjectionContextV1,
  type NurtureInstitutionWorkflowResponsibleRole,
  type NurtureInstitutionWorkflowProjectionSurface,
  type NurtureInstitutionWorkflowProjectionV1,
} from "./enrollment-journey-workflow.js";
import type { NurturePolicyReasonCode } from "./institution-context.js";

export const NURTURE_ENROLLMENT_JOURNEY_COMMAND_KEYS = [
  "start_enrollment_inquiry",
  "record_external_touchpoint",
  "confirm_native_touchpoint_note",
  "confirm_intent_conversation",
  "record_or_skip_visit",
  "close_inquiry",
  "qualify_capacity_waitlist",
  "review_waitlist_interest",
  "override_waitlist_category",
  "issue_trial_offer",
  "accept_trial_offer",
  "decline_or_expire_trial_offer",
  "withdraw_from_waitlist",
  "cancel_trial_preparation",
] as const;

export type NurtureEnrollmentJourneyCommandKey =
  (typeof NURTURE_ENROLLMENT_JOURNEY_COMMAND_KEYS)[number];

export type NurtureEnrollmentContactOwnerSnapshotV1 = {
  contract_version: "1.0.0";
  contact_ref: CanonicalRef;
  safe_label: string;
  verified_at: string;
};

export type NurtureEnrollmentNativeSourceOwnerSnapshotV1 = {
  contract_version: "1.0.0";
  source_ref: CanonicalRef;
  occurred_at: string;
  verified_at: string;
};

export type NurtureEnrollmentInquiryRecordV1 = {
  inquiry_ref: string;
  workflow_ref: string;
  preferred_label: string;
  protected_birth_year_month?: ProtectedContentEnvelopeV1;
  age_band_key?: string;
  expected_entry_start_date: string;
  expected_entry_end_date: string;
  target_class_type_key: string;
  target_age_band_key: string;
  target_care_group_ref?: string;
  care_schedule_need_keys: readonly string[];
  source_channel: string;
  host_contact_ref: CanonicalRef;
  contact_safe_label: string;
  safety_label_keys: readonly string[];
  last_touchpoint_at: string;
  next_touchpoint_at: string;
  visit_disposition: "not_decided" | "recorded" | "skipped";
};

export type NurtureEnrollmentTouchpointV1 = {
  touchpoint_ref: string;
  workflow_ref: string;
  inquiry_ref: string;
  source_kind: "native_business_communication" | "external_structured_summary";
  source_channel: string;
  native_source_ref?: CanonicalRef;
  external_summary_body_envelope?: ProtectedContentEnvelopeV1;
  confirmed_need_keys: readonly string[];
  safety_label_keys: readonly string[];
  next_action_key: string;
  responsible_role: NurtureInstitutionWorkflowResponsibleRole;
  occurred_at: string;
  due_at: string;
  next_touchpoint_at: string;
  actor_role_assignment_ref: string;
  supersedes_touchpoint_ref?: string;
  correction_reason?: string;
};

export type NurtureEnrollmentJourneyTransitionDraftV1 = {
  transition_ref: string;
  workspace_id: string;
  institution_ref: string;
  workflow_ref: string;
  workflow_head_before: number;
  workflow_head_after: number;
  stage_before?: NurtureEnrollmentJourneyWorkflowSnapshotV1["current_stage"];
  stage_after: NurtureEnrollmentJourneyWorkflowSnapshotV1["current_stage"];
  waiting_state_before?: NurtureEnrollmentJourneyWorkflowSnapshotV1["waiting_state"];
  waiting_state_after: NurtureEnrollmentJourneyWorkflowSnapshotV1["waiting_state"];
  pending_transition_before?: NurtureEnrollmentJourneyWorkflowSnapshotV1["pending_transition"];
  pending_transition_after: NurtureEnrollmentJourneyWorkflowSnapshotV1["pending_transition"];
  lifecycle_before?: NurtureEnrollmentJourneyWorkflowSnapshotV1["lifecycle"];
  lifecycle_after: NurtureEnrollmentJourneyWorkflowSnapshotV1["lifecycle"];
  terminal_outcome_before?: NurtureEnrollmentJourneyWorkflowSnapshotV1["terminal_outcome"];
  terminal_outcome_after: NurtureEnrollmentJourneyWorkflowSnapshotV1["terminal_outcome"];
  added_milestones: readonly NurtureEnrollmentJourneyMilestone[];
  command_key: NurtureEnrollmentJourneyCommandKey;
  actor_role_assignment_ref?: string;
  actor_ref?: CanonicalRef;
  owner_action_ref?: CanonicalRef;
  reason_key: string;
};

export type NurtureEnrollmentJourneyCommandFacts = {
  actor_role_assignment_ref: string;
  workflow?: NurtureEnrollmentJourneyWorkflowSnapshotV1;
  confirmed_touchpoint_count: number;
};

export type NurtureEnrollmentJourneyCommandFactsResult =
  | { status: "resolved"; facts: NurtureEnrollmentJourneyCommandFacts }
  | { status: "denied"; reason_code: NurturePolicyReasonCode }
  | { status: "unavailable"; reason_code: string };

type StartInquiryMutation = {
  kind: "start_inquiry";
  workspace_id: string;
  institution_ref: string;
  participant_ref: string;
  role_assignment_ref: string;
  expected_workflow_head: 0;
  workflow_run_ref: CanonicalRef;
  inquiry: Omit<NurtureEnrollmentInquiryRecordV1, "inquiry_ref" | "workflow_ref">;
};

type ExternalTouchpointMutation = {
  kind: "record_external_touchpoint";
  workspace_id: string;
  institution_ref: string;
  participant_ref: string;
  role_assignment_ref: string;
  workflow_ref: string;
  expected_workflow_head: number;
  touchpoint: Omit<
    NurtureEnrollmentTouchpointV1,
    | "touchpoint_ref"
    | "workflow_ref"
    | "inquiry_ref"
    | "source_kind"
    | "actor_role_assignment_ref"
  >;
};

type NativeTouchpointMutation = {
  kind: "confirm_native_touchpoint_note";
  workspace_id: string;
  institution_ref: string;
  participant_ref: string;
  role_assignment_ref: string;
  workflow_ref: string;
  expected_workflow_head: number;
  touchpoint: Omit<
    NurtureEnrollmentTouchpointV1,
    | "touchpoint_ref"
    | "workflow_ref"
    | "inquiry_ref"
    | "source_kind"
    | "actor_role_assignment_ref"
    | "external_summary_body_envelope"
    | "supersedes_touchpoint_ref"
    | "correction_reason"
  >;
};

type AdvanceMutation = {
  kind: "confirm_intent" | "record_visit" | "skip_visit" | "close_inquiry";
  workspace_id: string;
  institution_ref: string;
  participant_ref: string;
  role_assignment_ref: string;
  workflow_ref: string;
  expected_workflow_head: number;
  reason_key: string;
};

export type NurtureEnrollmentJourneyMutation =
  | StartInquiryMutation
  | ExternalTouchpointMutation
  | NativeTouchpointMutation
  | AdvanceMutation;

export type NurtureEnrollmentJourneyMutationResult =
  | {
      status: "committed";
      workflow: NurtureEnrollmentJourneyWorkflowSnapshotV1;
      before?: NurtureEnrollmentJourneyWorkflowSnapshotV1;
      added_milestones: readonly NurtureEnrollmentJourneyMilestone[];
    }
  | {
      status: "conflict";
      reason_code:
        | "workflow_head_conflict"
        | "workflow_run_already_bound"
        | "native_source_already_confirmed"
        | "touchpoint_already_corrected"
        | "touchpoint_time_conflict"
        | "touchpoint_correction_conflict"
        | "workflow_state_conflict"
        | "enrollment_journey_write_conflict";
    }
  | { status: "denied"; reason_code: NurturePolicyReasonCode }
  | { status: "unavailable"; reason_code: string };

export type NurtureEnrollmentJourneyTransaction = {
  loadCommandFacts(input: {
    workspace_id: string;
    institution_ref: string;
    participant_ref: string;
    role_assignment_ref: string;
    workflow_ref?: string;
  }): Promise<NurtureEnrollmentJourneyCommandFactsResult>;
  commitMutation(
    input: NurtureEnrollmentJourneyMutation,
  ): Promise<NurtureEnrollmentJourneyMutationResult>;
  appendTransition(input: {
    transition: NurtureEnrollmentJourneyTransitionDraftV1;
    command_execution_ref: string;
  }): Promise<void>;
};

export type NurtureEnrollmentJourneyReadResult =
  | {
      status: "resolved";
      workflow: NurtureEnrollmentJourneyWorkflowSnapshotV1;
      projection_context: NurtureInstitutionWorkflowProjectionContextV1;
    }
  | { status: "denied"; reason_code: NurturePolicyReasonCode }
  | { status: "unavailable"; reason_code: string };

export type NurtureEnrollmentJourneyRepository = {
  readWorkflow(input: {
    workspace_id: string;
    institution_ref: string;
    participant_ref: string;
    role_assignment_ref?: string;
    workflow_ref: string;
  }): Promise<NurtureEnrollmentJourneyReadResult>;
};

export type NurtureEnrollmentJourneyQueryResult =
  | {
      status: "resolved";
      projection: NurtureInstitutionWorkflowProjectionV1;
    }
  | { status: "denied"; reason_code: NurturePolicyReasonCode }
  | { status: "unavailable"; reason_code: string };

type CommonPayload = {
  workspace_id: string;
  institution_ref: string;
  role_assignment_ref: string;
  workflow_ref: string;
  expected_workflow_head: number;
};

export type NurtureStartEnrollmentInquiryPayload = {
  workspace_id: string;
  institution_ref: string;
  role_assignment_ref: string;
  expected_workflow_head: 0;
  workflow_run_ref: CanonicalRef;
  contact_owner_snapshot: NurtureEnrollmentContactOwnerSnapshotV1;
  preferred_label: string;
  protected_birth_year_month?: ProtectedContentEnvelopeV1;
  age_band_key?: string;
  expected_entry_start_date: string;
  expected_entry_end_date: string;
  target_class_type_key: string;
  target_age_band_key: string;
  target_care_group_ref?: string;
  care_schedule_need_keys: string[];
  source_channel: string;
  safety_label_keys: string[];
  initial_contact_at: string;
  next_touchpoint_at: string;
};

type TouchpointPayload = CommonPayload & {
  source_channel: string;
  confirmed_need_keys: string[];
  safety_label_keys: string[];
  next_action_key: string;
  responsible_role: NurtureInstitutionWorkflowResponsibleRole;
  due_at: string;
  next_touchpoint_at: string;
};

export type NurtureRecordExternalTouchpointPayload = TouchpointPayload & {
  occurred_at: string;
  external_summary_body_envelope: ProtectedContentEnvelopeV1;
  supersedes_touchpoint_ref?: string;
  correction_reason?: string;
};

export type NurtureConfirmNativeTouchpointNotePayload = TouchpointPayload & {
  source_owner_snapshot: NurtureEnrollmentNativeSourceOwnerSnapshotV1;
};

export type NurtureConfirmIntentConversationPayload = CommonPayload;

export type NurtureRecordOrSkipVisitPayload = CommonPayload & {
  disposition: "recorded" | "skipped";
};

export type NurtureCloseInquiryPayload = CommonPayload & {
  close_reason_key: string;
};

const REFERENCE_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/;
const TOKEN_PATTERN = /^[a-z][a-z0-9_:-]{0,99}$/;
const LOCAL_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MAX_LIST_LENGTH = 32;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const hasOnlyKeys = (
  value: unknown,
  keys: readonly string[],
): boolean =>
  isRecord(value) && Object.keys(value).every((key) => keys.includes(key));

const validReference = (value: unknown): value is string =>
  typeof value === "string" && REFERENCE_PATTERN.test(value);

const validToken = (value: unknown): value is string =>
  typeof value === "string" && TOKEN_PATTERN.test(value);

const validText = (value: unknown, max: number): value is string =>
  typeof value === "string" &&
  value.trim() === value &&
  value.length > 0 &&
  value.length <= max;

const validInstant = (value: unknown): value is string => {
  if (typeof value !== "string") return false;
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString() === value;
};

const validLocalDate = (value: unknown): value is string => {
  if (typeof value !== "string" || !LOCAL_DATE_PATTERN.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
};

const validHead = (value: unknown, allowZero = false): value is number =>
  typeof value === "number" &&
  Number.isSafeInteger(value) &&
  value >= (allowZero ? 0 : 1);

const validTokenList = (value: unknown, requireValue: boolean): value is string[] =>
  Array.isArray(value) &&
  value.length <= MAX_LIST_LENGTH &&
  (!requireValue || value.length > 0) &&
  value.every(validToken) &&
  new Set(value).size === value.length;

const validCanonicalRef = (
  value: unknown,
  expected?: { namespace: string; object_type: string },
): value is CanonicalRef => {
  try {
    assertCanonicalRef(value);
  } catch {
    return false;
  }
  return (
    expected === undefined ||
    (value.namespace === expected.namespace &&
      value.object_type === expected.object_type)
  );
};

const isMember = <Member extends string>(
  values: readonly Member[],
  value: unknown,
): value is Member =>
  typeof value === "string" && (values as readonly string[]).includes(value);

const validContactSnapshot = (
  value: unknown,
): value is NurtureEnrollmentContactOwnerSnapshotV1 =>
  isRecord(value) &&
  Object.keys(value).every((key) =>
    ["contract_version", "contact_ref", "safe_label", "verified_at"].includes(key),
  ) &&
  value.contract_version === "1.0.0" &&
  validCanonicalRef(value.contact_ref) &&
  value.contact_ref.namespace === "my_chat" &&
  validText(value.safe_label, 200) &&
  validInstant(value.verified_at);

const validNativeSourceSnapshot = (
  value: unknown,
): value is NurtureEnrollmentNativeSourceOwnerSnapshotV1 =>
  isRecord(value) &&
  Object.keys(value).every((key) =>
    ["contract_version", "source_ref", "occurred_at", "verified_at"].includes(key),
  ) &&
  value.contract_version === "1.0.0" &&
  validCanonicalRef(value.source_ref, {
    namespace: "nurture",
    object_type: "family_care_message",
  }) &&
  validInstant(value.occurred_at) &&
  validInstant(value.verified_at) &&
  value.verified_at >= value.occurred_at;

const validCommon = (payload: unknown): payload is CommonPayload =>
  isRecord(payload) &&
  validReference(payload.workspace_id) &&
  validReference(payload.institution_ref) &&
  validReference(payload.role_assignment_ref) &&
  validReference(payload.workflow_ref) &&
  validHead(payload.expected_workflow_head);

const validTouchpointCommon = (
  payload: unknown,
): payload is TouchpointPayload & Record<string, unknown> => {
  if (!isRecord(payload) || !validCommon(payload)) return false;
  const record: Record<string, unknown> = payload;
  return (
    validToken(record.source_channel) &&
    validTokenList(record.confirmed_need_keys, false) &&
    validTokenList(record.safety_label_keys, false) &&
    validToken(record.next_action_key) &&
    isMember(
      NURTURE_INSTITUTION_WORKFLOW_RESPONSIBLE_ROLES,
      record.responsible_role,
    ) &&
    validInstant(record.due_at) &&
    validInstant(record.next_touchpoint_at) &&
    record.next_touchpoint_at >= record.due_at
  );
};

export const validateStartEnrollmentInquiryPayload = (
  payload: unknown,
): boolean => {
  if (!isRecord(payload)) return false;
  let protectedBirthMonthValid = false;
  if (payload.protected_birth_year_month !== undefined) {
    try {
      assertProtectedContentEnvelopeV1(payload.protected_birth_year_month);
      protectedBirthMonthValid = true;
    } catch {
      return false;
    }
  }
  const hasAgeBand = payload.age_band_key !== undefined;
  return (
    hasOnlyKeys(payload, [
      "workspace_id",
      "institution_ref",
      "role_assignment_ref",
      "expected_workflow_head",
      "workflow_run_ref",
      "contact_owner_snapshot",
      "preferred_label",
      "protected_birth_year_month",
      "age_band_key",
      "expected_entry_start_date",
      "expected_entry_end_date",
      "target_class_type_key",
      "target_age_band_key",
      "target_care_group_ref",
      "care_schedule_need_keys",
      "source_channel",
      "safety_label_keys",
      "initial_contact_at",
      "next_touchpoint_at",
    ]) &&
    validReference(payload.workspace_id) &&
    validReference(payload.institution_ref) &&
    validReference(payload.role_assignment_ref) &&
    payload.expected_workflow_head === 0 &&
    validCanonicalRef(payload.workflow_run_ref, {
      namespace: "my_chat",
      object_type: "workflow_run",
    }) &&
    validContactSnapshot(payload.contact_owner_snapshot) &&
    validText(payload.preferred_label, 120) &&
    protectedBirthMonthValid !== hasAgeBand &&
    (payload.age_band_key === undefined || validToken(payload.age_band_key)) &&
    validLocalDate(payload.expected_entry_start_date) &&
    validLocalDate(payload.expected_entry_end_date) &&
    payload.expected_entry_end_date >= payload.expected_entry_start_date &&
    validToken(payload.target_class_type_key) &&
    validToken(payload.target_age_band_key) &&
    (payload.target_care_group_ref === undefined ||
      validReference(payload.target_care_group_ref)) &&
    validTokenList(payload.care_schedule_need_keys, true) &&
    validToken(payload.source_channel) &&
    validTokenList(payload.safety_label_keys, false) &&
    validInstant(payload.initial_contact_at) &&
    validInstant(payload.next_touchpoint_at) &&
    payload.next_touchpoint_at >= payload.initial_contact_at
  );
};

export const validateExternalTouchpointPayload = (
  payload: unknown,
): boolean => {
  if (!isRecord(payload)) return false;
  try {
    assertProtectedContentEnvelopeV1(payload.external_summary_body_envelope);
  } catch {
    return false;
  }
  return (
    hasOnlyKeys(payload, [
      "workspace_id",
      "institution_ref",
      "role_assignment_ref",
      "workflow_ref",
      "expected_workflow_head",
      "source_channel",
      "confirmed_need_keys",
      "safety_label_keys",
      "next_action_key",
      "responsible_role",
      "due_at",
      "next_touchpoint_at",
      "occurred_at",
      "external_summary_body_envelope",
      "supersedes_touchpoint_ref",
      "correction_reason",
    ]) &&
    validTouchpointCommon(payload) &&
    validInstant(payload.occurred_at) &&
    payload.due_at >= payload.occurred_at &&
    (payload.supersedes_touchpoint_ref === undefined
      ? payload.correction_reason === undefined
      : validReference(payload.supersedes_touchpoint_ref) &&
        validText(payload.correction_reason, 1_000))
  );
};

export const validateNativeTouchpointPayload = (
  payload: unknown,
): boolean =>
  isRecord(payload) &&
  hasOnlyKeys(payload, [
    "workspace_id",
    "institution_ref",
    "role_assignment_ref",
    "workflow_ref",
    "expected_workflow_head",
    "source_channel",
    "confirmed_need_keys",
    "safety_label_keys",
    "next_action_key",
    "responsible_role",
    "due_at",
    "next_touchpoint_at",
    "source_owner_snapshot",
  ]) &&
  validTouchpointCommon(payload) &&
  validNativeSourceSnapshot(payload.source_owner_snapshot) &&
  payload.due_at >= payload.source_owner_snapshot.occurred_at;

const unavailableOwner = () => ({
  status: "invalid" as const,
  reason_code: "enrollment_journey_owner_unavailable",
});

const mutationFailure = (
  result: Exclude<NurtureEnrollmentJourneyMutationResult, { status: "committed" }>,
): never => {
  if (result.status === "conflict") {
    throw new NurtureDeterministicRollback(result.reason_code, "conflict");
  }
  if (result.status === "denied") {
    throw new NurtureDeterministicRollback(result.reason_code, "blocked");
  }
  throw new Error(result.reason_code);
};

const transitionFrom = (input: {
  command_key: NurtureEnrollmentJourneyCommandKey;
  reason_key: string;
  role_assignment_ref: string;
  result: Extract<NurtureEnrollmentJourneyMutationResult, { status: "committed" }>;
}): NurtureEnrollmentJourneyTransitionDraftV1 => ({
  transition_ref: randomUUID(),
  workspace_id: input.result.workflow.workspace_id,
  institution_ref: input.result.workflow.institution_ref,
  workflow_ref: input.result.workflow.workflow_ref,
  workflow_head_before: input.result.before?.workflow_head ?? 0,
  workflow_head_after: input.result.workflow.workflow_head,
  ...(input.result.before
    ? {
        stage_before: input.result.before.current_stage,
        waiting_state_before: input.result.before.waiting_state,
        pending_transition_before: input.result.before.pending_transition,
        lifecycle_before: input.result.before.lifecycle,
        terminal_outcome_before: input.result.before.terminal_outcome,
      }
    : {}),
  stage_after: input.result.workflow.current_stage,
  waiting_state_after: input.result.workflow.waiting_state,
  pending_transition_after: input.result.workflow.pending_transition,
  lifecycle_after: input.result.workflow.lifecycle,
  terminal_outcome_after: input.result.workflow.terminal_outcome,
  added_milestones: input.result.added_milestones,
  command_key: input.command_key,
  actor_role_assignment_ref: input.role_assignment_ref,
  reason_key: input.reason_key,
});

const workflowRef = (workflowRefValue: string, head: number): CanonicalRef => ({
  schema_version: 1,
  namespace: "nurture",
  object_type: "institution_workflow",
  object_id: workflowRefValue,
  version: head,
});

const transitionRef = (value: string): CanonicalRef => ({
  schema_version: 1,
  namespace: "nurture",
  object_type: "institution_workflow_transition",
  object_id: value,
  version: 1,
});

const applyMutation = async (input: {
  transaction: { enrollmentJourney?: NurtureEnrollmentJourneyTransaction };
  mutation: NurtureEnrollmentJourneyMutation;
  command_key: NurtureEnrollmentJourneyCommandKey;
  reason_key: string;
  role_assignment_ref: string;
}) => {
  const owner = input.transaction.enrollmentJourney;
  if (!owner) throw new Error("enrollment journey owner adapter is not wired");
  const result = await owner.commitMutation(input.mutation);
  if (result.status !== "committed") return mutationFailure(result);
  const transition = transitionFrom({
    command_key: input.command_key,
    reason_key: input.reason_key,
    role_assignment_ref: input.role_assignment_ref,
    result,
  });
  return {
    output_refs: [
      workflowRef(result.workflow.workflow_ref, result.workflow.workflow_head),
      transitionRef(transition.transition_ref),
    ],
    result_schema_version: 1,
    committed_result: {
      contract_version: NURTURE_ENROLLMENT_JOURNEY_WORKFLOW_CONTRACT_VERSION,
      workflow_ref: result.workflow.workflow_ref,
      transition_ref: transition.transition_ref,
      workflow_head: result.workflow.workflow_head,
      current_stage: result.workflow.current_stage,
      waiting_state: result.workflow.waiting_state,
      added_milestones: [...result.added_milestones],
    },
    finalization_payload: transition,
  };
};

const appendTransitionAfterExecution = async (input: {
  transaction: { enrollmentJourney?: NurtureEnrollmentJourneyTransaction };
  execution: NurtureCommandExecutionRecord;
  finalization_payload?: unknown;
}): Promise<void> => {
  const owner = input.transaction.enrollmentJourney;
  if (!owner || !isRecord(input.finalization_payload)) {
    throw new Error("enrollment journey transition finalizer is unavailable");
  }
  await owner.appendTransition({
    transition:
      input.finalization_payload as NurtureEnrollmentJourneyTransitionDraftV1,
    command_execution_ref: input.execution.id,
  });
};

const loadFacts = async (input: {
  owner: NurtureEnrollmentJourneyTransaction;
  payload: {
    workspace_id: string;
    institution_ref: string;
    role_assignment_ref: string;
    workflow_ref?: string;
  };
  participant_ref: string;
}): Promise<NurtureEnrollmentJourneyCommandFactsResult> =>
  input.owner.loadCommandFacts({
    workspace_id: input.payload.workspace_id,
    institution_ref: input.payload.institution_ref,
    participant_ref: input.participant_ref,
    role_assignment_ref: input.payload.role_assignment_ref,
    ...(input.payload.workflow_ref
      ? { workflow_ref: input.payload.workflow_ref }
      : {}),
  });

const factsDecision = (
  result: NurtureEnrollmentJourneyCommandFactsResult,
  expected: {
    workspace_id: string;
    institution_ref: string;
    role_assignment_ref: string;
    workflow_ref?: string;
  },
) => {
  if (result.status === "resolved") {
    const workflow = result.facts.workflow;
    if (
      result.facts.actor_role_assignment_ref !== expected.role_assignment_ref ||
      (expected.workflow_ref !== undefined &&
        (!workflow ||
          workflow.workspace_id !== expected.workspace_id ||
          workflow.institution_ref !== expected.institution_ref ||
          workflow.workflow_ref !== expected.workflow_ref))
    ) {
      return { status: "blocked" as const, reason_code: "not_authorized" };
    }
    return { status: "ready" as const };
  }
  return { status: "blocked" as const, reason_code: result.reason_code };
};

const canonicalStartPayload = (
  payload: NurtureStartEnrollmentInquiryPayload,
): unknown => {
  const { contact_owner_snapshot: ownerSnapshot, ...request } = payload;
  return { ...request, contact_ref: ownerSnapshot.contact_ref };
};

const canonicalNativeTouchpointPayload = (
  payload: NurtureConfirmNativeTouchpointNotePayload,
): unknown => {
  const { source_owner_snapshot: ownerSnapshot, ...request } = payload;
  return { ...request, source_ref: ownerSnapshot.source_ref };
};

export const startEnrollmentInquirySpec: NurtureCommandSpec<NurtureStartEnrollmentInquiryPayload> = {
  command_key: "nurture.start_enrollment_inquiry",
  command_scope: "institution_enrollment_journey",
  contract_version: 1,
  // Owner-derived labels and verification instants are not caller identity.
  // Re-resolving the same exact ref must still replay the committed result.
  canonicalize: canonicalStartPayload,
  async checkPreconditions(transaction, payload, context) {
    const owner = transaction.enrollmentJourney;
    if (!owner) return unavailableOwner();
    if (
      !isRecord(payload) ||
      payload.workspace_id !== context.workspace_id ||
      !validateStartEnrollmentInquiryPayload(payload)
    ) {
      return { status: "invalid", reason_code: "contract_mismatch" };
    }
    const facts = await loadFacts({
        owner,
        payload,
        participant_ref: context.business_actor_ref,
      });
    return factsDecision(facts, payload);
  },
  async apply(transaction, payload, context) {
    const contact = payload.contact_owner_snapshot;
    return applyMutation({
      transaction,
      command_key: "start_enrollment_inquiry",
      reason_key: "inquiry_started",
      role_assignment_ref: payload.role_assignment_ref,
      mutation: {
        kind: "start_inquiry",
        workspace_id: payload.workspace_id,
        institution_ref: payload.institution_ref,
        participant_ref: context.business_actor_ref,
        role_assignment_ref: payload.role_assignment_ref,
        expected_workflow_head: 0,
        workflow_run_ref: payload.workflow_run_ref,
        inquiry: {
          preferred_label: payload.preferred_label,
          ...(payload.protected_birth_year_month
            ? {
                protected_birth_year_month:
                  payload.protected_birth_year_month,
              }
            : {}),
          ...(payload.age_band_key
            ? { age_band_key: payload.age_band_key }
            : {}),
          expected_entry_start_date: payload.expected_entry_start_date,
          expected_entry_end_date: payload.expected_entry_end_date,
          target_class_type_key: payload.target_class_type_key,
          target_age_band_key: payload.target_age_band_key,
          ...(payload.target_care_group_ref
            ? { target_care_group_ref: payload.target_care_group_ref }
            : {}),
          care_schedule_need_keys: payload.care_schedule_need_keys,
          source_channel: payload.source_channel,
          host_contact_ref: contact.contact_ref,
          contact_safe_label: contact.safe_label,
          safety_label_keys: payload.safety_label_keys,
          last_touchpoint_at: payload.initial_contact_at,
          next_touchpoint_at: payload.next_touchpoint_at,
          visit_disposition: "not_decided",
        },
      },
    });
  },
  afterExecutionCreated(transaction, _payload, _context, applied) {
    return appendTransitionAfterExecution({
      transaction,
      execution: applied.execution,
      finalization_payload: applied.finalization_payload,
    });
  },
};

export const recordExternalTouchpointSpec: NurtureCommandSpec<NurtureRecordExternalTouchpointPayload> = {
  command_key: "nurture.record_external_touchpoint",
  command_scope: "institution_enrollment_journey",
  contract_version: 1,
  canonicalize: (payload) => payload,
  async checkPreconditions(transaction, payload, context) {
    const owner = transaction.enrollmentJourney;
    if (!owner) return unavailableOwner();
    if (
      !isRecord(payload) ||
      payload.workspace_id !== context.workspace_id ||
      !validateExternalTouchpointPayload(payload)
    ) {
      return { status: "invalid", reason_code: "contract_mismatch" };
    }
    const result = await loadFacts({
      owner,
      payload,
      participant_ref: context.business_actor_ref,
    });
    if (result.status !== "resolved") return factsDecision(result, payload);
    const decision = factsDecision(result, payload);
    if (decision.status !== "ready") return decision;
    if (result.facts.workflow?.workflow_head !== payload.expected_workflow_head) {
      return { status: "conflict", reason_code: "workflow_head_conflict" };
    }
    return { status: "ready" };
  },
  async apply(transaction, payload, context) {
    return applyMutation({
      transaction,
      command_key: "record_external_touchpoint",
      reason_key: payload.supersedes_touchpoint_ref
        ? "external_touchpoint_corrected"
        : "external_touchpoint_recorded",
      role_assignment_ref: payload.role_assignment_ref,
      mutation: {
        kind: "record_external_touchpoint",
        workspace_id: payload.workspace_id,
        institution_ref: payload.institution_ref,
        participant_ref: context.business_actor_ref,
        role_assignment_ref: payload.role_assignment_ref,
        workflow_ref: payload.workflow_ref,
        expected_workflow_head: payload.expected_workflow_head,
        touchpoint: {
          source_channel: payload.source_channel,
          external_summary_body_envelope:
            payload.external_summary_body_envelope,
          confirmed_need_keys: payload.confirmed_need_keys,
          safety_label_keys: payload.safety_label_keys,
          next_action_key: payload.next_action_key,
          responsible_role: payload.responsible_role,
          occurred_at: payload.occurred_at,
          due_at: payload.due_at,
          next_touchpoint_at: payload.next_touchpoint_at,
          ...(payload.supersedes_touchpoint_ref
            ? {
                supersedes_touchpoint_ref:
                  payload.supersedes_touchpoint_ref,
                correction_reason: payload.correction_reason,
              }
            : {}),
        },
      },
    });
  },
  afterExecutionCreated(transaction, _payload, _context, applied) {
    return appendTransitionAfterExecution({
      transaction,
      execution: applied.execution,
      finalization_payload: applied.finalization_payload,
    });
  },
};

export const confirmNativeTouchpointNoteSpec: NurtureCommandSpec<NurtureConfirmNativeTouchpointNotePayload> = {
  command_key: "nurture.confirm_native_touchpoint_note",
  command_scope: "institution_enrollment_journey",
  contract_version: 1,
  canonicalize: canonicalNativeTouchpointPayload,
  async checkPreconditions(transaction, payload, context) {
    const owner = transaction.enrollmentJourney;
    if (!owner) return unavailableOwner();
    if (
      !isRecord(payload) ||
      payload.workspace_id !== context.workspace_id ||
      !validateNativeTouchpointPayload(payload)
    ) {
      return { status: "invalid", reason_code: "contract_mismatch" };
    }
    const result = await loadFacts({
      owner,
      payload,
      participant_ref: context.business_actor_ref,
    });
    if (result.status !== "resolved") return factsDecision(result, payload);
    const decision = factsDecision(result, payload);
    if (decision.status !== "ready") return decision;
    if (result.facts.workflow?.workflow_head !== payload.expected_workflow_head) {
      return { status: "conflict", reason_code: "workflow_head_conflict" };
    }
    return { status: "ready" };
  },
  async apply(transaction, payload, context) {
    const source = payload.source_owner_snapshot;
    return applyMutation({
      transaction,
      command_key: "confirm_native_touchpoint_note",
      reason_key: "native_touchpoint_confirmed",
      role_assignment_ref: payload.role_assignment_ref,
      mutation: {
        kind: "confirm_native_touchpoint_note",
        workspace_id: payload.workspace_id,
        institution_ref: payload.institution_ref,
        participant_ref: context.business_actor_ref,
        role_assignment_ref: payload.role_assignment_ref,
        workflow_ref: payload.workflow_ref,
        expected_workflow_head: payload.expected_workflow_head,
        touchpoint: {
          source_channel: payload.source_channel,
          native_source_ref: source.source_ref,
          confirmed_need_keys: payload.confirmed_need_keys,
          safety_label_keys: payload.safety_label_keys,
          next_action_key: payload.next_action_key,
          responsible_role: payload.responsible_role,
          occurred_at: source.occurred_at,
          due_at: payload.due_at,
          next_touchpoint_at: payload.next_touchpoint_at,
        },
      },
    });
  },
  afterExecutionCreated(transaction, _payload, _context, applied) {
    return appendTransitionAfterExecution({
      transaction,
      execution: applied.execution,
      finalization_payload: applied.finalization_payload,
    });
  },
};

const workflowAdvanceSpec = <Payload extends CommonPayload>(input: {
  command_key:
    | "confirm_intent_conversation"
    | "record_or_skip_visit"
    | "close_inquiry";
  validate(payload: Payload): boolean;
  precondition(
    payload: Payload,
    facts: NurtureEnrollmentJourneyCommandFacts,
  ): { status: "ready" } | { status: "invalid" | "blocked" | "conflict"; reason_code: string };
  mutation(payload: Payload): AdvanceMutation["kind"];
  reason(payload: Payload): string;
}): NurtureCommandSpec<Payload> => ({
  command_key: `nurture.${input.command_key}`,
  command_scope: "institution_enrollment_journey",
  contract_version: 1,
  canonicalize: (payload) => payload,
  async checkPreconditions(transaction, payload, context) {
    const owner = transaction.enrollmentJourney;
    if (!owner) return unavailableOwner();
    if (
      !isRecord(payload) ||
      payload.workspace_id !== context.workspace_id ||
      !input.validate(payload)
    ) {
      return { status: "invalid", reason_code: "contract_mismatch" };
    }
    const result = await loadFacts({
      owner,
      payload,
      participant_ref: context.business_actor_ref,
    });
    if (result.status !== "resolved") return factsDecision(result, payload);
    const decision = factsDecision(result, payload);
    if (decision.status !== "ready") return decision;
    if (result.facts.workflow?.workflow_head !== payload.expected_workflow_head) {
      return { status: "conflict", reason_code: "workflow_head_conflict" };
    }
    return input.precondition(payload, result.facts);
  },
  async apply(transaction, payload, context) {
    return applyMutation({
      transaction,
      command_key: input.command_key,
      reason_key: input.reason(payload),
      role_assignment_ref: payload.role_assignment_ref,
      mutation: {
        kind: input.mutation(payload),
        workspace_id: payload.workspace_id,
        institution_ref: payload.institution_ref,
        participant_ref: context.business_actor_ref,
        role_assignment_ref: payload.role_assignment_ref,
        workflow_ref: payload.workflow_ref,
        expected_workflow_head: payload.expected_workflow_head,
        reason_key: input.reason(payload),
      },
    });
  },
  afterExecutionCreated(transaction, _payload, _context, applied) {
    return appendTransitionAfterExecution({
      transaction,
      execution: applied.execution,
      finalization_payload: applied.finalization_payload,
    });
  },
});

export const confirmIntentConversationSpec = workflowAdvanceSpec<NurtureConfirmIntentConversationPayload>({
  command_key: "confirm_intent_conversation",
  validate: (payload) =>
    hasOnlyKeys(payload, [
      "workspace_id",
      "institution_ref",
      "role_assignment_ref",
      "workflow_ref",
      "expected_workflow_head",
    ]) && validCommon(payload),
  precondition: (_payload, facts) =>
    facts.workflow?.current_stage === "inquiry" &&
    facts.confirmed_touchpoint_count > 0
      ? { status: "ready" }
      : { status: "blocked", reason_code: "confirmed_touchpoint_required" },
  mutation: () => "confirm_intent",
  reason: () => "intent_confirmed",
});

export const recordOrSkipVisitSpec = workflowAdvanceSpec<NurtureRecordOrSkipVisitPayload>({
  command_key: "record_or_skip_visit",
  validate: (payload) =>
    hasOnlyKeys(payload, [
      "workspace_id",
      "institution_ref",
      "role_assignment_ref",
      "workflow_ref",
      "expected_workflow_head",
      "disposition",
    ]) &&
    validCommon(payload) &&
    (payload.disposition === "recorded" || payload.disposition === "skipped"),
  precondition: (_payload, facts) =>
    facts.workflow?.current_stage === "intent_conversation"
      ? { status: "ready" }
      : { status: "blocked", reason_code: "intent_conversation_required" },
  mutation: (payload) =>
    payload.disposition === "recorded" ? "record_visit" : "skip_visit",
  reason: (payload) =>
    payload.disposition === "recorded" ? "visit_recorded" : "visit_skipped",
});

export const closeInquirySpec = workflowAdvanceSpec<NurtureCloseInquiryPayload>({
  command_key: "close_inquiry",
  validate: (payload) =>
    hasOnlyKeys(payload, [
      "workspace_id",
      "institution_ref",
      "role_assignment_ref",
      "workflow_ref",
      "expected_workflow_head",
      "close_reason_key",
    ]) &&
    validCommon(payload) &&
    validToken(payload.close_reason_key),
  precondition: (_payload, facts) =>
    facts.workflow &&
    ["inquiry", "intent_conversation", "visit_or_consultation"].includes(
      facts.workflow.current_stage,
    )
      ? { status: "ready" }
      : { status: "blocked", reason_code: "inquiry_close_not_allowed" },
  mutation: () => "close_inquiry",
  reason: (payload) => payload.close_reason_key,
});

export class NurtureEnrollmentJourneyQueryService {
  constructor(private readonly repository: NurtureEnrollmentJourneyRepository) {}

  async read(
    input: Parameters<NurtureEnrollmentJourneyRepository["readWorkflow"]>[0] & {
      surface: NurtureInstitutionWorkflowProjectionSurface;
    },
  ): Promise<NurtureEnrollmentJourneyQueryResult> {
    const result = await this.repository.readWorkflow(input);
    if (result.status !== "resolved") return result;
    const projection = projectNurtureEnrollmentJourneyWorkflowV1({
      snapshot: result.workflow,
      surface: input.surface,
      context: result.projection_context,
    });
    return projection.status === "ok"
      ? { status: "resolved", projection: projection.output }
      : {
          status: "unavailable",
          reason_code: projection.reason_code,
        };
  }
}

export const NURTURE_ENROLLMENT_JOURNEY_WORKFLOW_IDENTITY = {
  contract_version: NURTURE_ENROLLMENT_JOURNEY_WORKFLOW_CONTRACT_VERSION,
  workflow_type: NURTURE_ENROLLMENT_JOURNEY_WORKFLOW_TYPE,
} as const;
