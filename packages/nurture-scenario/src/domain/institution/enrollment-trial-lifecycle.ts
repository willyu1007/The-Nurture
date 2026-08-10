import { randomUUID } from "node:crypto";
import {
  assertCanonicalRef,
  type CanonicalRef,
} from "@my-chat/workflow-contracts";
import {
  NurtureDeterministicRollback,
  type NurtureCommandExecutionContext,
  type NurtureCommandSpec,
} from "../commands/command-kernel.js";
import type {
  NurtureEnrollmentJourneyCommandKey,
  NurtureEnrollmentJourneyTransitionDraftV1,
} from "./enrollment-journey-command.js";
import type {
  NurtureEnrollmentJourneyMilestone,
  NurtureEnrollmentJourneyWorkflowSnapshotV1,
} from "./enrollment-journey-workflow.js";

export const NURTURE_ENROLLMENT_TRIAL_LIFECYCLE_CONTRACT_VERSION =
  "1.0.0" as const;

const TRIAL_COMMAND_KEYS = [
  "prepare_trial_relationship",
  "start_trial",
  "mark_trial_review_reached",
  "extend_trial",
  "propose_formal_enrollment",
  "end_trial",
] as const satisfies readonly NurtureEnrollmentJourneyCommandKey[];

type TrialCommandKey = (typeof TRIAL_COMMAND_KEYS)[number];

export type NurtureTrialPairOwnerSnapshotV1 = {
  contract_version: typeof NURTURE_ENROLLMENT_TRIAL_LIFECYCLE_CONTRACT_VERSION;
  actor_ref: CanonicalRef;
  guardian_participant_ref: string;
  guardian_role_assignment_ref: string;
  child_owner_ref: string;
  child_owner_version: number;
  family_owner_ref: string;
  family_owner_version: number;
  child_association_ref: string;
  child_association_head: number;
  family_association_ref: string;
  family_association_head: number;
  child_care_process_ref: string;
  verified_at: string;
  expires_at: string;
};

export type NurtureTrialGrantTermsSnapshotV1 = {
  contract_version: typeof NURTURE_ENROLLMENT_TRIAL_LIFECYCLE_CONTRACT_VERSION;
  policy_ref: string;
  policy_revision: number;
  directions: readonly ["family_to_org", "org_to_family"];
  data_classes: readonly (
    | "daily_care_log"
    | "care_day_note"
    | "care_constraint_update"
    | "family_care_question"
    | "family_follow_up_request"
    | "direct_care_communication"
    | "child_growth_record"
  )[];
  purposes: readonly string[];
  verified_at: string;
  expires_at: string;
};

type TrialBasePayload = {
  workspace_id: string;
  institution_ref: string;
  workflow_ref: string;
  expected_workflow_head: number;
  role_assignment_ref: string;
  reservation_ref: string;
  expected_reservation_head: number;
};

type TrialEntitiesPayload = TrialBasePayload & {
  enrollment_ref: string;
  expected_enrollment_head: number;
  grant_ref: string;
  expected_grant_head: number;
};

export type NurturePrepareTrialRelationshipPayload = TrialBasePayload & {
  expected_capacity_revision: number;
  pair_owner_snapshot: NurtureTrialPairOwnerSnapshotV1;
  grant_terms_snapshot: NurtureTrialGrantTermsSnapshotV1;
};

export type NurtureStartTrialPayload = TrialEntitiesPayload & {
  expected_capacity_revision: number;
  pair_owner_snapshot: NurtureTrialPairOwnerSnapshotV1;
};

export type NurtureMarkTrialReviewReachedPayload = TrialEntitiesPayload;

export type NurtureExtendTrialPayload = TrialEntitiesPayload & {
  trial_ends_at: string;
  review_at: string;
  reason_key: string;
};

export type NurtureProposeFormalEnrollmentPayload = TrialEntitiesPayload;

export type NurtureEndTrialPayload = TrialEntitiesPayload & {
  reason_key: string;
};

type MutationBase = TrialBasePayload & {
  participant_ref: string;
};

type MutationEntities = MutationBase & {
  enrollment_ref: string;
  expected_enrollment_head: number;
  grant_ref: string;
  expected_grant_head: number;
};

export type NurtureEnrollmentTrialLifecycleMutation =
  | (MutationBase & {
      kind: "prepare_trial_relationship";
      expected_capacity_revision: number;
      pair_owner_snapshot: NurtureTrialPairOwnerSnapshotV1;
      grant_terms_snapshot: NurtureTrialGrantTermsSnapshotV1;
    })
  | (MutationEntities & {
      kind: "start_trial";
      expected_capacity_revision: number;
      pair_owner_snapshot: NurtureTrialPairOwnerSnapshotV1;
    })
  | (MutationEntities & { kind: "mark_trial_review_reached" })
  | (MutationEntities & {
      kind: "extend_trial";
      trial_ends_at: string;
      review_at: string;
      reason_key: string;
    })
  | (MutationEntities & { kind: "propose_formal_enrollment" })
  | (MutationEntities & { kind: "end_trial"; reason_key: string });

export type NurtureEnrollmentTrialLifecycleFailure = {
  status: "invalid" | "denied" | "unavailable" | "conflict";
  reason_code: string;
};

export type NurtureEnrollmentTrialLifecycleResult =
  | {
      status: "committed";
      before: NurtureEnrollmentJourneyWorkflowSnapshotV1;
      workflow: NurtureEnrollmentJourneyWorkflowSnapshotV1;
      added_milestones: readonly NurtureEnrollmentJourneyMilestone[];
      enrollment_ref: string;
      enrollment_head: number;
      enrollment_status: "pending" | "active" | "ended";
      participation_phase?: "trial";
      grant_ref: string;
      grant_head: number;
      grant_status: "pending" | "active" | "revoked";
      reservation_ref: string;
      reservation_head: number;
      reservation_state: "held" | "converted_to_occupancy" | "released";
    }
  | NurtureEnrollmentTrialLifecycleFailure;

export type NurtureEnrollmentTrialLifecycleTransaction = {
  prepareMutation(
    mutation: NurtureEnrollmentTrialLifecycleMutation,
  ): Promise<{ status: "ready" } | NurtureEnrollmentTrialLifecycleFailure>;
  commitMutation(
    mutation: NurtureEnrollmentTrialLifecycleMutation,
  ): Promise<NurtureEnrollmentTrialLifecycleResult>;
};

const REFERENCE_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/;
const TOKEN_PATTERN = /^[a-z][a-z0-9_:-]{0,99}$/;
const DATA_CLASSES = new Set<NurtureTrialGrantTermsSnapshotV1["data_classes"][number]>([
  "daily_care_log",
  "care_day_note",
  "care_constraint_update",
  "family_care_question",
  "family_follow_up_request",
  "direct_care_communication",
  "child_growth_record",
]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const onlyKeys = (value: unknown, keys: readonly string[]): boolean =>
  isRecord(value) && Object.keys(value).every((key) => keys.includes(key));
const validRef = (value: unknown): value is string =>
  typeof value === "string" && REFERENCE_PATTERN.test(value);
const validToken = (value: unknown): value is string =>
  typeof value === "string" && TOKEN_PATTERN.test(value);
const validHead = (value: unknown, minimum = 1): value is number =>
  Number.isSafeInteger(value) && Number(value) >= minimum;
const validInstant = (value: unknown): value is string => {
  if (typeof value !== "string") return false;
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString() === value;
};
const validMyChatActorRef = (value: unknown): value is CanonicalRef => {
  try {
    assertCanonicalRef(value);
    return value.namespace === "my_chat" && value.object_type === "actor";
  } catch {
    return false;
  }
};
const unique = (values: readonly string[]): boolean =>
  new Set(values).size === values.length;

export const validateTrialPairOwnerSnapshotV1 = (
  value: unknown,
): value is NurtureTrialPairOwnerSnapshotV1 =>
  onlyKeys(value, [
    "contract_version", "actor_ref", "guardian_participant_ref",
    "guardian_role_assignment_ref", "child_owner_ref", "child_owner_version",
    "family_owner_ref", "family_owner_version", "child_association_ref",
    "child_association_head", "family_association_ref", "family_association_head",
    "child_care_process_ref", "verified_at", "expires_at",
  ]) &&
  isRecord(value) &&
  value.contract_version === NURTURE_ENROLLMENT_TRIAL_LIFECYCLE_CONTRACT_VERSION &&
  validMyChatActorRef(value.actor_ref) &&
  [
    value.guardian_participant_ref, value.guardian_role_assignment_ref,
    value.child_owner_ref, value.family_owner_ref, value.child_association_ref,
    value.family_association_ref, value.child_care_process_ref,
  ].every(validRef) &&
  typeof value.child_owner_ref === "string" &&
  value.child_owner_ref.startsWith("nurture_child_binding_anchor_v1:") &&
  typeof value.family_owner_ref === "string" &&
  value.family_owner_ref.startsWith("nurture_family_binding_anchor_v1:") &&
  validHead(value.child_owner_version) &&
  validHead(value.family_owner_version) &&
  validHead(value.child_association_head) &&
  validHead(value.family_association_head) &&
  validInstant(value.verified_at) &&
  validInstant(value.expires_at) &&
  value.verified_at < value.expires_at;

export const validateTrialGrantTermsSnapshotV1 = (
  value: unknown,
): value is NurtureTrialGrantTermsSnapshotV1 =>
  onlyKeys(value, [
    "contract_version", "policy_ref", "policy_revision", "directions",
    "data_classes", "purposes", "verified_at", "expires_at",
  ]) &&
  isRecord(value) &&
  value.contract_version === NURTURE_ENROLLMENT_TRIAL_LIFECYCLE_CONTRACT_VERSION &&
  validRef(value.policy_ref) &&
  validHead(value.policy_revision) &&
  Array.isArray(value.directions) &&
  value.directions.length === 2 &&
  value.directions[0] === "family_to_org" &&
  value.directions[1] === "org_to_family" &&
  Array.isArray(value.data_classes) &&
  value.data_classes.length > 0 &&
  value.data_classes.length <= DATA_CLASSES.size &&
  value.data_classes.every((entry) => typeof entry === "string" && DATA_CLASSES.has(entry as NurtureTrialGrantTermsSnapshotV1["data_classes"][number])) &&
  unique(value.data_classes as string[]) &&
  Array.isArray(value.purposes) &&
  value.purposes.length > 0 &&
  value.purposes.length <= 16 &&
  value.purposes.every(validToken) &&
  unique(value.purposes) &&
  validInstant(value.verified_at) &&
  validInstant(value.expires_at) &&
  value.verified_at < value.expires_at;

const BASE_KEYS = [
  "workspace_id", "institution_ref", "workflow_ref", "expected_workflow_head",
  "role_assignment_ref", "reservation_ref", "expected_reservation_head",
] as const;
const ENTITY_KEYS = [
  ...BASE_KEYS, "enrollment_ref", "expected_enrollment_head", "grant_ref",
  "expected_grant_head",
] as const;

const validBase = (value: unknown): value is Record<string, unknown> =>
  isRecord(value) &&
  [
    value.workspace_id, value.institution_ref, value.workflow_ref,
    value.role_assignment_ref, value.reservation_ref,
  ].every(validRef) &&
  validHead(value.expected_workflow_head) &&
  validHead(value.expected_reservation_head);
const validEntities = (value: unknown): value is Record<string, unknown> =>
  validBase(value) &&
  validRef(value.enrollment_ref) &&
  validHead(value.expected_enrollment_head, 0) &&
  validRef(value.grant_ref) &&
  validHead(value.expected_grant_head, 0);

export const validatePrepareTrialRelationshipPayload = (
  value: unknown,
): value is NurturePrepareTrialRelationshipPayload =>
  onlyKeys(value, [
    ...BASE_KEYS, "expected_capacity_revision", "pair_owner_snapshot",
    "grant_terms_snapshot",
  ]) &&
  validBase(value) &&
  validHead(value.expected_capacity_revision, 0) &&
  validateTrialPairOwnerSnapshotV1(value.pair_owner_snapshot) &&
  validateTrialGrantTermsSnapshotV1(value.grant_terms_snapshot);

export const validateStartTrialPayload = (
  value: unknown,
): value is NurtureStartTrialPayload =>
  onlyKeys(value, [...ENTITY_KEYS, "expected_capacity_revision", "pair_owner_snapshot"]) &&
  validEntities(value) &&
  validHead(value.expected_capacity_revision, 0) &&
  validateTrialPairOwnerSnapshotV1(value.pair_owner_snapshot);

const validateEntityPayload = (value: unknown): value is TrialEntitiesPayload =>
  onlyKeys(value, ENTITY_KEYS) && validEntities(value);

export const validateExtendTrialPayload = (
  value: unknown,
): value is NurtureExtendTrialPayload =>
  onlyKeys(value, [...ENTITY_KEYS, "trial_ends_at", "review_at", "reason_key"]) &&
  validEntities(value) &&
  validInstant(value.trial_ends_at) &&
  validInstant(value.review_at) &&
  value.review_at < value.trial_ends_at &&
  validToken(value.reason_key);

export const validateEndTrialPayload = (
  value: unknown,
): value is NurtureEndTrialPayload =>
  onlyKeys(value, [...ENTITY_KEYS, "reason_key"]) &&
  validEntities(value) &&
  validToken(value.reason_key);

const canonicalOwnerFacts = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonicalOwnerFacts);
  if (!isRecord(value)) return value;
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => key !== "verified_at")
      .map(([key, entry]) => [key, canonicalOwnerFacts(entry)]),
  );
};

const localRef = (objectType: string, objectId: string, version: number): CanonicalRef => ({
  schema_version: 1,
  namespace: "nurture",
  object_type: objectType,
  object_id: objectId,
  version,
});

const failureDecision = (
  failure: NurtureEnrollmentTrialLifecycleFailure,
): "invalid" | "blocked" | "conflict" =>
  failure.status === "invalid"
    ? "invalid"
    : failure.status === "conflict"
      ? "conflict"
      : "blocked";

const mutationBase = (
  payload: TrialBasePayload,
  context: NurtureCommandExecutionContext,
): MutationBase => ({
  ...payload,
  participant_ref: context.business_actor_ref,
});

const transitionFromResult = (input: {
  command_key: TrialCommandKey;
  reason_key: string;
  role_assignment_ref: string;
  result: Extract<NurtureEnrollmentTrialLifecycleResult, { status: "committed" }>;
}): NurtureEnrollmentJourneyTransitionDraftV1 => ({
  transition_ref: randomUUID(),
  workspace_id: input.result.workflow.workspace_id,
  institution_ref: input.result.workflow.institution_ref,
  workflow_ref: input.result.workflow.workflow_ref,
  workflow_head_before: input.result.before.workflow_head,
  workflow_head_after: input.result.workflow.workflow_head,
  stage_before: input.result.before.current_stage,
  stage_after: input.result.workflow.current_stage,
  waiting_state_before: input.result.before.waiting_state,
  waiting_state_after: input.result.workflow.waiting_state,
  pending_transition_before: input.result.before.pending_transition,
  pending_transition_after: input.result.workflow.pending_transition,
  lifecycle_before: input.result.before.lifecycle,
  lifecycle_after: input.result.workflow.lifecycle,
  terminal_outcome_before: input.result.before.terminal_outcome,
  terminal_outcome_after: input.result.workflow.terminal_outcome,
  added_milestones: input.result.added_milestones,
  command_key: input.command_key,
  actor_role_assignment_ref: input.role_assignment_ref,
  reason_key: input.reason_key,
});

type TrialFinalization = {
  transition: NurtureEnrollmentJourneyTransitionDraftV1;
};

const trialSpec = <Payload>(input: {
  command_key: TrialCommandKey;
  validate(payload: unknown): payload is Payload;
  mutation(
    payload: Payload,
    context: NurtureCommandExecutionContext,
  ): NurtureEnrollmentTrialLifecycleMutation;
  role(payload: Payload): string;
  reason(payload: Payload): string;
}): NurtureCommandSpec<Payload> => ({
  command_key: `nurture.${input.command_key}`,
  command_scope: "institution_enrollment_journey",
  contract_version: 1,
  canonicalize: canonicalOwnerFacts,
  async checkPreconditions(transaction, payload, context) {
    if (!input.validate(payload)) {
      return { status: "invalid", reason_code: "contract_mismatch" };
    }
    const owner = transaction.enrollmentTrialLifecycle;
    if (!owner) {
      return { status: "blocked", reason_code: "trial_lifecycle_owner_unavailable" };
    }
    const mutation = input.mutation(payload, context);
    if (mutation.workspace_id !== context.workspace_id) {
      return { status: "invalid", reason_code: "contract_mismatch" };
    }
    const prepared = await owner.prepareMutation(mutation);
    return prepared.status === "ready"
      ? prepared
      : { status: failureDecision(prepared), reason_code: prepared.reason_code };
  },
  async apply(transaction, payload, context) {
    const owner = transaction.enrollmentTrialLifecycle;
    if (!owner) throw new Error("trial lifecycle owner adapter is not wired");
    const result = await owner.commitMutation(input.mutation(payload, context));
    if (result.status !== "committed") {
      throw new NurtureDeterministicRollback(
        result.reason_code,
        failureDecision(result),
      );
    }
    const transition = transitionFromResult({
      command_key: input.command_key,
      reason_key: input.reason(payload),
      role_assignment_ref: input.role(payload),
      result,
    });
    return {
      output_refs: [
        localRef("institution_workflow", result.workflow.workflow_ref, result.workflow.workflow_head),
        localRef("institution_workflow_transition", transition.transition_ref, 1),
        localRef("enrollment", result.enrollment_ref, result.enrollment_head),
        localRef("child_link_grant", result.grant_ref, result.grant_head),
        localRef("enrollment_trial_reservation", result.reservation_ref, result.reservation_head),
      ],
      result_schema_version: 1,
      committed_result: {
        contract_version: NURTURE_ENROLLMENT_TRIAL_LIFECYCLE_CONTRACT_VERSION,
        workflow_ref: result.workflow.workflow_ref,
        workflow_head: result.workflow.workflow_head,
        current_stage: result.workflow.current_stage,
        enrollment_ref: result.enrollment_ref,
        enrollment_head: result.enrollment_head,
        enrollment_status: result.enrollment_status,
        ...(result.participation_phase
          ? { participation_phase: result.participation_phase }
          : {}),
        grant_ref: result.grant_ref,
        grant_head: result.grant_head,
        grant_status: result.grant_status,
        reservation_ref: result.reservation_ref,
        reservation_head: result.reservation_head,
        reservation_state: result.reservation_state,
      },
      finalization_payload: { transition } satisfies TrialFinalization,
    };
  },
  async afterExecutionCreated(transaction, _payload, _context, applied) {
    const journey = transaction.enrollmentJourney;
    const finalization = applied.finalization_payload as TrialFinalization | undefined;
    if (!journey || !finalization?.transition) {
      throw new Error("trial lifecycle finalizer is unavailable");
    }
    await journey.appendTransition({
      transition: finalization.transition,
      command_execution_ref: applied.execution.id,
    });
  },
});

const entityMutation = <
  Kind extends Exclude<TrialCommandKey, "prepare_trial_relationship">,
  Payload extends TrialEntitiesPayload,
>(
  kind: Kind,
  payload: Payload,
  context: NurtureCommandExecutionContext,
): MutationEntities & { kind: Kind } => ({
  kind,
  ...mutationBase(payload, context),
  enrollment_ref: payload.enrollment_ref,
  expected_enrollment_head: payload.expected_enrollment_head,
  grant_ref: payload.grant_ref,
  expected_grant_head: payload.expected_grant_head,
});

export const prepareTrialRelationshipSpec =
  trialSpec<NurturePrepareTrialRelationshipPayload>({
    command_key: "prepare_trial_relationship",
    validate: validatePrepareTrialRelationshipPayload,
    mutation: (payload, context) => ({
      kind: "prepare_trial_relationship",
      ...mutationBase(payload, context),
      expected_capacity_revision: payload.expected_capacity_revision,
      pair_owner_snapshot: payload.pair_owner_snapshot,
      grant_terms_snapshot: payload.grant_terms_snapshot,
    }),
    role: (payload) => payload.role_assignment_ref,
    reason: () => "trial_relationship_prepared",
  });

export const startTrialSpec = trialSpec<NurtureStartTrialPayload>({
  command_key: "start_trial",
  validate: validateStartTrialPayload,
  mutation: (payload, context) => ({
    ...entityMutation("start_trial", payload, context),
    expected_capacity_revision: payload.expected_capacity_revision,
    pair_owner_snapshot: payload.pair_owner_snapshot,
  }),
  role: (payload) => payload.role_assignment_ref,
  reason: () => "trial_started",
});

export const markTrialReviewReachedSpec =
  trialSpec<NurtureMarkTrialReviewReachedPayload>({
    command_key: "mark_trial_review_reached",
    validate: validateEntityPayload,
    mutation: (payload, context) =>
      entityMutation("mark_trial_review_reached", payload, context),
    role: (payload) => payload.role_assignment_ref,
    reason: () => "trial_review_reached",
  });

export const extendTrialSpec = trialSpec<NurtureExtendTrialPayload>({
  command_key: "extend_trial",
  validate: validateExtendTrialPayload,
  mutation: (payload, context) => ({
    ...entityMutation("extend_trial", payload, context),
    trial_ends_at: payload.trial_ends_at,
    review_at: payload.review_at,
    reason_key: payload.reason_key,
  }),
  role: (payload) => payload.role_assignment_ref,
  reason: (payload) => payload.reason_key,
});

export const proposeFormalEnrollmentSpec =
  trialSpec<NurtureProposeFormalEnrollmentPayload>({
    command_key: "propose_formal_enrollment",
    validate: validateEntityPayload,
    mutation: (payload, context) =>
      entityMutation("propose_formal_enrollment", payload, context),
    role: (payload) => payload.role_assignment_ref,
    reason: () => "formal_enrollment_proposed",
  });

export const endTrialSpec = trialSpec<NurtureEndTrialPayload>({
  command_key: "end_trial",
  validate: validateEndTrialPayload,
  mutation: (payload, context) => ({
    ...entityMutation("end_trial", payload, context),
    reason_key: payload.reason_key,
  }),
  role: (payload) => payload.role_assignment_ref,
  reason: (payload) => payload.reason_key,
});
