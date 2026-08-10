import { randomUUID } from "node:crypto";
import {
  assertCanonicalRef,
  assertScenarioCurrentOwnerBindingPairEvidenceV1,
  type CanonicalRef,
  type ScenarioCurrentOwnerBindingPairEvidenceV1,
} from "@my-chat/workflow-contracts";
import {
  NurtureDeterministicRollback,
  type NurtureCommandExecutionContext,
  type NurtureCommandSpec,
} from "../commands/command-kernel.js";
import type { NurtureEnrollmentJourneyTransitionDraftV1 } from "./enrollment-journey-command.js";
import type {
  NurtureEnrollmentJourneyMilestone,
  NurtureEnrollmentJourneyWorkflowSnapshotV1,
} from "./enrollment-journey-workflow.js";

export const NURTURE_ENROLLMENT_FORMALIZATION_CONTRACT_VERSION = "1.0.0" as const;

export type NurtureEnrollmentFormalProposalInputV1 = {
  expected_capacity_revision: number;
  proposed_formal_start_at: string;
  proposed_grant_purposes: readonly string[];
  proposed_grant_expires_at: string;
  safe_family_summary: string;
  proposal_expires_at: string;
  reason_key: string;
};

export type NurtureEnrollmentFormalProposalRecordV1 = {
  proposal_ref: string;
  proposal_head: 1;
  workflow_ref: string;
  enrollment_ref: string;
  grant_ref: string;
  reservation_ref: string;
  care_group_ref: string;
  care_group_head: number;
  proposed_formal_start_at: string;
  proposed_grant_purposes: readonly string[];
  proposed_grant_expires_at: string;
  safe_family_summary: string;
  issued_by_role_assignment_ref: string;
  issue_reason_key: string;
  issued_at: string;
  expires_at: string;
};

export type NurtureEnrollmentFormalizationOwnerEvidenceV1 = {
  contract_version: typeof NURTURE_ENROLLMENT_FORMALIZATION_CONTRACT_VERSION;
  actor_ref: CanonicalRef;
  audience: "nurture";
  current_owner_evidence: ScenarioCurrentOwnerBindingPairEvidenceV1;
  request_nonce_hash: string;
  verified_at: string;
  expires_at: string;
};

export type NurtureFormalizeEnrollmentPayload = {
  workflow_ref: string;
  proposal_ref: string;
  acceptance_ref: CanonicalRef;
  accepted_at: string;
  expected_workflow_head: number;
  expected_proposal_head: 1;
  expected_enrollment_head: number;
  expected_grant_head: number;
  expected_reservation_head: number;
  owner_evidence: NurtureEnrollmentFormalizationOwnerEvidenceV1;
};

export type NurtureEnrollmentFormalizationMutation = NurtureFormalizeEnrollmentPayload & {
  workspace_id: string;
  actor_object_id: string;
};

export type NurtureEnrollmentFormalizationFailure = {
  status: "invalid" | "denied" | "unavailable" | "conflict";
  reason_code: string;
};

export type NurtureEnrollmentFormalizationResult =
  | {
      status: "committed";
      before: NurtureEnrollmentJourneyWorkflowSnapshotV1;
      workflow: NurtureEnrollmentJourneyWorkflowSnapshotV1;
      added_milestones: readonly NurtureEnrollmentJourneyMilestone[];
      proposal_ref: string;
      proposal_head: 1;
      enrollment_ref: string;
      enrollment_head: number;
      grant_ref: string;
      grant_head: number;
      grant_purposes: readonly string[];
      grant_expires_at: string;
      reservation_ref: string;
      reservation_head: number;
      care_group_ref: string;
      actor_ref: CanonicalRef;
      acceptance_ref: CanonicalRef;
      owner_evidence_hash: string;
    }
  | NurtureEnrollmentFormalizationFailure;

export type NurtureEnrollmentFormalizationTransaction = {
  prepareMutation(
    mutation: NurtureEnrollmentFormalizationMutation,
  ): Promise<{ status: "ready" } | NurtureEnrollmentFormalizationFailure>;
  commitMutation(
    mutation: NurtureEnrollmentFormalizationMutation,
  ): Promise<NurtureEnrollmentFormalizationResult>;
};

const REFERENCE_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/;
const TOKEN_PATTERN = /^[a-z][a-z0-9_:-]{0,99}$/;
const SHA256_PATTERN = /^[0-9a-f]{64}$/;
const PROPOSAL_KEYS = [
  "expected_capacity_revision",
  "proposed_formal_start_at",
  "proposed_grant_purposes",
  "proposed_grant_expires_at",
  "safe_family_summary",
  "proposal_expires_at",
  "reason_key",
] as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const onlyKeys = (value: unknown, keys: readonly string[]): boolean =>
  isRecord(value) && Object.keys(value).every((key) => keys.includes(key));
const validRef = (value: unknown): value is string =>
  typeof value === "string" && REFERENCE_PATTERN.test(value);
const validHead = (value: unknown, minimum = 1): value is number =>
  Number.isSafeInteger(value) && Number(value) >= minimum;
const validToken = (value: unknown): value is string =>
  typeof value === "string" && TOKEN_PATTERN.test(value);
const validInstant = (value: unknown): value is string => {
  if (typeof value !== "string") return false;
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString() === value;
};
const validCanonicalRef = (
  value: unknown,
  namespace: string,
  objectType: string,
): value is CanonicalRef => {
  try {
    assertCanonicalRef(value);
    return value.namespace === namespace && value.object_type === objectType;
  } catch {
    return false;
  }
};
const unique = (values: readonly string[]): boolean =>
  new Set(values).size === values.length;

export const validateEnrollmentFormalProposalInputV1 = (
  value: unknown,
): value is NurtureEnrollmentFormalProposalInputV1 =>
  onlyKeys(value, PROPOSAL_KEYS) &&
  isRecord(value) &&
  validHead(value.expected_capacity_revision, 0) &&
  validInstant(value.proposed_formal_start_at) &&
  Array.isArray(value.proposed_grant_purposes) &&
  value.proposed_grant_purposes.length > 0 &&
  value.proposed_grant_purposes.length <= 16 &&
  value.proposed_grant_purposes.every(validToken) &&
  unique(value.proposed_grant_purposes) &&
  validInstant(value.proposed_grant_expires_at) &&
  value.proposed_formal_start_at < value.proposed_grant_expires_at &&
  typeof value.safe_family_summary === "string" &&
  value.safe_family_summary === value.safe_family_summary.trim() &&
  value.safe_family_summary.length > 0 &&
  value.safe_family_summary.length <= 500 &&
  validInstant(value.proposal_expires_at) &&
  value.proposed_formal_start_at < value.proposal_expires_at &&
  validToken(value.reason_key);

export const validateEnrollmentFormalizationOwnerEvidenceV1 = (
  value: unknown,
): value is NurtureEnrollmentFormalizationOwnerEvidenceV1 => {
  if (
    !onlyKeys(value, [
      "contract_version",
      "actor_ref",
      "audience",
      "current_owner_evidence",
      "request_nonce_hash",
      "verified_at",
      "expires_at",
    ]) ||
    !isRecord(value) ||
    value.contract_version !== NURTURE_ENROLLMENT_FORMALIZATION_CONTRACT_VERSION ||
    !validCanonicalRef(value.actor_ref, "my_chat", "actor") ||
    value.audience !== "nurture" ||
    typeof value.request_nonce_hash !== "string" ||
    !SHA256_PATTERN.test(value.request_nonce_hash) ||
    !validInstant(value.verified_at) ||
    !validInstant(value.expires_at) ||
    value.verified_at >= value.expires_at
  ) return false;
  try {
    assertScenarioCurrentOwnerBindingPairEvidenceV1(value.current_owner_evidence);
  } catch {
    return false;
  }
  const evidence = value.current_owner_evidence;
  return evidence.purpose_key === "formalize_enrollment" &&
    evidence.owner_bindings[0].binding_slot === "child" &&
    evidence.owner_bindings[1].binding_slot === "family" &&
    evidence.owner_bindings[0].owner_ref.namespace === "scenario-owner" &&
    evidence.owner_bindings[0].owner_ref.object_type === "child_binding_owner" &&
    evidence.owner_bindings[1].owner_ref.namespace === "scenario-owner" &&
    evidence.owner_bindings[1].owner_ref.object_type === "family_binding_owner";
};

export const validateFormalizeEnrollmentPayload = (
  value: unknown,
): value is NurtureFormalizeEnrollmentPayload =>
  onlyKeys(value, [
    "workflow_ref",
    "proposal_ref",
    "acceptance_ref",
    "accepted_at",
    "expected_workflow_head",
    "expected_proposal_head",
    "expected_enrollment_head",
    "expected_grant_head",
    "expected_reservation_head",
    "owner_evidence",
  ]) &&
  isRecord(value) &&
  validRef(value.workflow_ref) &&
  validRef(value.proposal_ref) &&
  validCanonicalRef(value.acceptance_ref, "my_chat", "enrollment_action") &&
  validInstant(value.accepted_at) &&
  validHead(value.expected_workflow_head) &&
  value.expected_proposal_head === 1 &&
  validHead(value.expected_enrollment_head, 0) &&
  validHead(value.expected_grant_head, 0) &&
  validHead(value.expected_reservation_head) &&
  validateEnrollmentFormalizationOwnerEvidenceV1(value.owner_evidence);

const failureDecision = (
  failure: NurtureEnrollmentFormalizationFailure,
): "invalid" | "blocked" | "conflict" =>
  failure.status === "invalid"
    ? "invalid"
    : failure.status === "conflict"
      ? "conflict"
      : "blocked";

const localRef = (objectType: string, objectId: string, version: number): CanonicalRef => ({
  schema_version: 1,
  namespace: "nurture",
  object_type: objectType,
  object_id: objectId,
  version,
});

const canonicalFormalization = (payload: NurtureFormalizeEnrollmentPayload): unknown => ({
  ...payload,
  owner_evidence: {
    contract_version: payload.owner_evidence.contract_version,
    actor_ref: payload.owner_evidence.actor_ref,
    audience: payload.owner_evidence.audience,
    current_owner_evidence: {
      binding_evidence_version:
        payload.owner_evidence.current_owner_evidence.binding_evidence_version,
      purpose_key: payload.owner_evidence.current_owner_evidence.purpose_key,
      owner_bindings: payload.owner_evidence.current_owner_evidence.owner_bindings,
      pair_relation_evidence_hash:
        payload.owner_evidence.current_owner_evidence.pair_relation_evidence_hash,
    },
  },
});

const mutation = (
  payload: NurtureFormalizeEnrollmentPayload,
  context: NurtureCommandExecutionContext,
): NurtureEnrollmentFormalizationMutation => ({
  ...payload,
  workspace_id: context.workspace_id,
  actor_object_id: context.business_actor_ref,
});

type FormalizationFinalization = {
  transition: NurtureEnrollmentJourneyTransitionDraftV1;
};

const transitionFrom = (
  result: Extract<NurtureEnrollmentFormalizationResult, { status: "committed" }>,
  payload: NurtureFormalizeEnrollmentPayload,
): NurtureEnrollmentJourneyTransitionDraftV1 => ({
  transition_ref: randomUUID(),
  workspace_id: result.workflow.workspace_id,
  institution_ref: result.workflow.institution_ref,
  workflow_ref: result.workflow.workflow_ref,
  workflow_head_before: result.before.workflow_head,
  workflow_head_after: result.workflow.workflow_head,
  stage_before: result.before.current_stage,
  stage_after: result.workflow.current_stage,
  waiting_state_before: result.before.waiting_state,
  waiting_state_after: result.workflow.waiting_state,
  pending_transition_before: result.before.pending_transition,
  pending_transition_after: result.workflow.pending_transition,
  lifecycle_before: result.before.lifecycle,
  lifecycle_after: result.workflow.lifecycle,
  terminal_outcome_before: result.before.terminal_outcome,
  terminal_outcome_after: result.workflow.terminal_outcome,
  added_milestones: result.added_milestones,
  command_key: "formalize_enrollment",
  actor_ref: result.actor_ref,
  owner_action_ref: result.acceptance_ref,
  formal_proposal_ref: result.proposal_ref,
  owner_evidence_hash: result.owner_evidence_hash,
  owner_evidence_metadata: {
    contract_version: NURTURE_ENROLLMENT_FORMALIZATION_CONTRACT_VERSION,
    purpose_key: "formalize_enrollment",
    audience: "nurture",
    request_nonce_hash: payload.owner_evidence.request_nonce_hash,
    verified_at: payload.owner_evidence.verified_at,
    expires_at: payload.owner_evidence.expires_at,
  },
  reason_key: "formal_enrollment_committed",
});

export const formalizeEnrollmentSpec: NurtureCommandSpec<NurtureFormalizeEnrollmentPayload> = {
  command_key: "nurture.formalize_enrollment",
  command_scope: "institution_enrollment_journey",
  contract_version: 1,
  canonicalize(payload) {
    return validateFormalizeEnrollmentPayload(payload)
      ? canonicalFormalization(payload)
      : payload;
  },
  async checkPreconditions(transaction, payload, context) {
    if (!validateFormalizeEnrollmentPayload(payload)) {
      return { status: "invalid", reason_code: "contract_mismatch" };
    }
    const owner = transaction.enrollmentFormalization;
    if (!owner) {
      return { status: "blocked", reason_code: "formalization_owner_unavailable" };
    }
    const prepared = await owner.prepareMutation(mutation(payload, context));
    return prepared.status === "ready"
      ? prepared
      : { status: failureDecision(prepared), reason_code: prepared.reason_code };
  },
  async apply(transaction, payload, context) {
    const owner = transaction.enrollmentFormalization;
    if (!owner) throw new Error("formalization owner adapter is not wired");
    const result = await owner.commitMutation(mutation(payload, context));
    if (result.status !== "committed") {
      throw new NurtureDeterministicRollback(
        result.reason_code,
        failureDecision(result),
      );
    }
    const transition = transitionFrom(result, payload);
    return {
      output_refs: [
        localRef("institution_workflow", result.workflow.workflow_ref, result.workflow.workflow_head),
        localRef("institution_workflow_transition", transition.transition_ref, 1),
        localRef("enrollment_formal_proposal", result.proposal_ref, result.proposal_head),
        localRef("enrollment", result.enrollment_ref, result.enrollment_head),
        localRef("child_link_grant", result.grant_ref, result.grant_head),
        localRef("enrollment_trial_reservation", result.reservation_ref, result.reservation_head),
      ],
      result_schema_version: 1,
      committed_result: {
        contract_version: NURTURE_ENROLLMENT_FORMALIZATION_CONTRACT_VERSION,
        workflow_ref: result.workflow.workflow_ref,
        workflow_head: result.workflow.workflow_head,
        lifecycle: result.workflow.lifecycle,
        terminal_outcome: result.workflow.terminal_outcome,
        proposal_ref: result.proposal_ref,
        proposal_head: result.proposal_head,
        enrollment_ref: result.enrollment_ref,
        enrollment_head: result.enrollment_head,
        participation_phase: "formal",
        grant_ref: result.grant_ref,
        grant_head: result.grant_head,
        reservation_ref: result.reservation_ref,
        reservation_head: result.reservation_head,
      },
      finalization_payload: { transition } satisfies FormalizationFinalization,
    };
  },
  async afterExecutionCreated(transaction, _payload, _context, applied) {
    const journey = transaction.enrollmentJourney;
    const finalization = applied.finalization_payload as FormalizationFinalization | undefined;
    if (!journey || !finalization?.transition) {
      throw new Error("formalization transition finalizer is unavailable");
    }
    await journey.appendTransition({
      transition: finalization.transition,
      command_execution_ref: applied.execution.id,
    });
  },
};
