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

export const NURTURE_ENROLLMENT_WAITLIST_CONTRACT_VERSION = "1.0.0" as const;
export const NURTURE_DEFAULT_WAITLIST_POLICY_REF =
  "nurture.default-standard-fifo" as const;

export type NurtureEnrollmentGuardianActionOwnerSnapshotV1 = {
  contract_version: typeof NURTURE_ENROLLMENT_WAITLIST_CONTRACT_VERSION;
  actor_ref: CanonicalRef;
  contact_ref: CanonicalRef;
  action_ref: CanonicalRef;
  occurred_at: string;
  verified_at: string;
};

export type NurtureEnrollmentWaitlistActor =
  | {
      kind: "institution_admin";
      participant_ref: string;
      role_assignment_ref: string;
    }
  | {
      kind: "guardian";
      participant_ref: string;
      owner_snapshot: NurtureEnrollmentGuardianActionOwnerSnapshotV1;
    };

type MutationCommon = {
  workspace_id: string;
  institution_ref: string;
  workflow_ref: string;
  expected_workflow_head: number;
  actor: NurtureEnrollmentWaitlistActor;
};

export type NurtureEnrollmentWaitlistMutation =
  | (MutationCommon & {
      kind: "qualify_capacity_waitlist";
      target_care_group_ref: string;
      expected_capacity_revision: number;
      category_key: string;
      category_basis_key: string;
      next_review_at: string;
      family_acceptance: NurtureEnrollmentGuardianActionOwnerSnapshotV1;
    })
  | (MutationCommon & {
      kind: "review_waitlist_interest";
      entry_ref: string;
      expected_entry_head: number;
      interest_state: "confirmed" | "unanswered";
      next_review_at: string;
    })
  | (MutationCommon & {
      kind: "override_waitlist_category";
      entry_ref: string;
      expected_entry_head: number;
      category_key: string;
      category_basis_key: string;
      reason_key: string;
    })
  | (MutationCommon & {
      kind: "issue_trial_offer";
      entry_ref: string;
      expected_entry_head: number;
      expires_at: string;
      trial_starts_at: string;
      trial_ends_at: string;
      review_at: string;
      reason_key: string;
    })
  | (MutationCommon & {
      kind: "accept_trial_offer";
      entry_ref: string;
      expected_entry_head: number;
      offer_ref: string;
      expected_offer_head: number;
    })
  | (MutationCommon & {
      kind: "decline_or_expire_trial_offer";
      entry_ref: string;
      expected_entry_head: number;
      offer_ref: string;
      expected_offer_head: number;
      disposition: "declined" | "expired";
      next_review_at: string;
      reason_key: string;
    })
  | (MutationCommon & {
      kind: "withdraw_from_waitlist";
      entry_ref: string;
      expected_entry_head: number;
      reason_key: string;
    })
  | (MutationCommon & {
      kind: "cancel_trial_preparation";
      entry_ref: string;
      expected_entry_head: number;
      offer_ref: string;
      expected_offer_head: number;
      reservation_ref: string;
      expected_reservation_head: number;
      reason_key: string;
    });

export type NurtureEnrollmentWaitlistEntityStateV1 = {
  entry_ref: string;
  entry_head: number;
  entry_lifecycle:
    | "active"
    | "offer_open"
    | "accepted"
    | "withdrawn";
  offer_ref?: string;
  offer_head?: number;
  offer_lifecycle?: "open" | "accepted" | "declined" | "expired" | "withdrawn";
  reservation_ref?: string;
  reservation_head?: number;
  reservation_state?: "held" | "converted_to_occupancy" | "released";
};

export type NurtureEnrollmentWaitlistOverrideDraftV1 = {
  override_ref: string;
  workspace_id: string;
  institution_ref: string;
  entry_ref: string;
  entry_head_before: number;
  entry_head_after: number;
  before_policy_ref: string;
  before_policy_revision: number;
  before_category_key: string;
  before_category_order: number;
  after_policy_ref: string;
  after_policy_revision: number;
  after_category_key: string;
  after_category_order: number;
  after_category_basis_key: string;
  actor_role_assignment_ref: string;
  reason_key: string;
};

export type NurtureEnrollmentWaitlistMutationFailure =
  | { status: "invalid"; reason_code: string }
  | { status: "denied"; reason_code: string }
  | { status: "unavailable"; reason_code: string }
  | { status: "conflict"; reason_code: string };

export type NurtureEnrollmentWaitlistMutationResult =
  | {
      status: "committed";
      before: NurtureEnrollmentJourneyWorkflowSnapshotV1;
      workflow: NurtureEnrollmentJourneyWorkflowSnapshotV1;
      added_milestones: readonly NurtureEnrollmentJourneyMilestone[];
      entities: NurtureEnrollmentWaitlistEntityStateV1;
      override?: NurtureEnrollmentWaitlistOverrideDraftV1;
    }
  | NurtureEnrollmentWaitlistMutationFailure;

export type NurtureEnrollmentWaitlistTransaction = {
  prepareMutation(
    mutation: NurtureEnrollmentWaitlistMutation,
  ): Promise<{ status: "ready" } | NurtureEnrollmentWaitlistMutationFailure>;
  commitMutation(
    mutation: NurtureEnrollmentWaitlistMutation,
  ): Promise<NurtureEnrollmentWaitlistMutationResult>;
  appendOverride(input: {
    override: NurtureEnrollmentWaitlistOverrideDraftV1;
    command_execution_ref: string;
  }): Promise<void>;
};

export type NurtureAdminWaitlistEntryProjectionV1 = {
  entryRef: string;
  workflowRef: string;
  targetCareGroupRef: string;
  targetClassSafeLabel: string;
  lifecycle: "active" | "offer_open";
  continuedInterest: "confirmed" | "waiting_on_guardian";
  categoryKey: string;
  categoryBasisKey: string;
  policyRef: string;
  policyRevision: number;
  waitlistQualifiedAt: string;
  nextReviewAt: string;
  lastConfirmedAt: string;
  currentOfferRef?: string;
  entryHead: number;
};

export type NurtureAdminWaitlistProjectionV1 = {
  contractVersion: typeof NURTURE_ENROLLMENT_WAITLIST_CONTRACT_VERSION;
  targetCareGroupRef: string;
  targetClassSafeLabel: string;
  orderedEntries: readonly NurtureAdminWaitlistEntryProjectionV1[];
};

export type NurtureFamilyWaitlistProjectionV1 = {
  contractVersion: typeof NURTURE_ENROLLMENT_WAITLIST_CONTRACT_VERSION;
  status: "waitlisted" | "waiting_on_guardian" | "offer_open" | "trial_preparation";
  targetClassSafeLabel: string;
  lastReviewAt: string;
  nextExpectedContactAt: string;
};

export type NurtureEnrollmentWaitlistQueryRepository = {
  readAdminQueue(input: {
    workspace_id: string;
    institution_ref: string;
    participant_ref: string;
    role_assignment_ref: string;
    target_care_group_ref: string;
  }): Promise<
    | { status: "resolved"; projection: NurtureAdminWaitlistProjectionV1 }
    | { status: "denied" | "unavailable"; reason_code: string }
  >;
  readFamilyStatus(input: {
    workspace_id: string;
    institution_ref: string;
    workflow_ref: string;
    owner_snapshot: NurtureEnrollmentGuardianActionOwnerSnapshotV1;
  }): Promise<
    | { status: "resolved"; projection: NurtureFamilyWaitlistProjectionV1 }
    | { status: "denied" | "unavailable"; reason_code: string }
  >;
};

const REFERENCE_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/;
const TOKEN_PATTERN = /^[a-z][a-z0-9_:-]{0,99}$/;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const hasOnlyKeys = (value: unknown, keys: readonly string[]): boolean =>
  isRecord(value) && Object.keys(value).every((key) => keys.includes(key));

const validReference = (value: unknown): value is string =>
  typeof value === "string" && REFERENCE_PATTERN.test(value);

const validToken = (value: unknown): value is string =>
  typeof value === "string" && TOKEN_PATTERN.test(value);

const validHead = (value: unknown): value is number =>
  Number.isSafeInteger(value) && Number(value) >= 1;

const validInstant = (value: unknown): value is string => {
  if (typeof value !== "string") return false;
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString() === value;
};

const validCanonicalRef = (
  value: unknown,
  namespace: string,
): value is CanonicalRef => {
  try {
    assertCanonicalRef(value);
  } catch {
    return false;
  }
  return value.namespace === namespace;
};

export const validateEnrollmentGuardianActionOwnerSnapshotV1 = (
  value: unknown,
): value is NurtureEnrollmentGuardianActionOwnerSnapshotV1 => {
  if (
    !hasOnlyKeys(value, [
      "contract_version",
      "actor_ref",
      "contact_ref",
      "action_ref",
      "occurred_at",
      "verified_at",
    ]) ||
    !isRecord(value) ||
    value.contract_version !== NURTURE_ENROLLMENT_WAITLIST_CONTRACT_VERSION ||
    !validCanonicalRef(value.actor_ref, "my_chat") ||
    !validCanonicalRef(value.contact_ref, "my_chat") ||
    !validCanonicalRef(value.action_ref, "my_chat") ||
    !validInstant(value.occurred_at) ||
    !validInstant(value.verified_at)
  ) {
    return false;
  }
  return value.verified_at >= value.occurred_at;
};

const validBase = (value: unknown): value is Record<string, unknown> =>
  isRecord(value) &&
  validReference(value.workspace_id) &&
  validReference(value.institution_ref) &&
  validReference(value.workflow_ref) &&
  validHead(value.expected_workflow_head);

const validEntry = (value: unknown): value is Record<string, unknown> =>
  validBase(value) &&
  validReference(value.entry_ref) &&
  validHead(value.expected_entry_head);

const validOffer = (value: unknown): value is Record<string, unknown> =>
  validEntry(value) &&
  validReference(value.offer_ref) &&
  validHead(value.expected_offer_head);

const validActor = (
  value: Record<string, unknown>,
  kind: "admin" | "guardian",
): boolean =>
  kind === "admin"
    ? validReference(value.role_assignment_ref) &&
      value.guardian_action_owner_snapshot === undefined
    : value.role_assignment_ref === undefined &&
      validateEnrollmentGuardianActionOwnerSnapshotV1(
        value.guardian_action_owner_snapshot,
      );

type WaitlistPayloadBase = {
  workspace_id: string;
  institution_ref: string;
  workflow_ref: string;
  expected_workflow_head: number;
};

type WaitlistEntryPayloadBase = WaitlistPayloadBase & {
  entry_ref: string;
  expected_entry_head: number;
};

type WaitlistOfferPayloadBase = WaitlistEntryPayloadBase & {
  offer_ref: string;
  expected_offer_head: number;
};

type AdminPayload = { role_assignment_ref: string };
type GuardianPayload = {
  guardian_action_owner_snapshot: NurtureEnrollmentGuardianActionOwnerSnapshotV1;
};
type MixedActorPayload = {
  role_assignment_ref?: string;
  guardian_action_owner_snapshot?: NurtureEnrollmentGuardianActionOwnerSnapshotV1;
};

export type NurtureQualifyCapacityWaitlistPayload = WaitlistPayloadBase &
  AdminPayload & {
  target_care_group_ref: string;
  expected_capacity_revision: number;
  category_key: string;
  category_basis_key: string;
  next_review_at: string;
  family_acceptance_owner_snapshot: NurtureEnrollmentGuardianActionOwnerSnapshotV1;
  };

export type NurtureReviewWaitlistInterestPayload = WaitlistEntryPayloadBase &
  MixedActorPayload & {
  interest_state: "confirmed" | "unanswered";
  next_review_at: string;
  };

export type NurtureOverrideWaitlistCategoryPayload = WaitlistEntryPayloadBase &
  AdminPayload & {
  category_key: string;
  category_basis_key: string;
  reason_key: string;
  };

export type NurtureIssueTrialOfferPayload = WaitlistEntryPayloadBase &
  AdminPayload & {
  expires_at: string;
  trial_starts_at: string;
  trial_ends_at: string;
  review_at: string;
  reason_key: string;
  };

export type NurtureAcceptTrialOfferPayload = WaitlistOfferPayloadBase &
  GuardianPayload;

export type NurtureDeclineOrExpireTrialOfferPayload =
  WaitlistOfferPayloadBase &
  MixedActorPayload & {
  disposition: "declined" | "expired";
  next_review_at: string;
  reason_key: string;
  };

export type NurtureWithdrawFromWaitlistPayload = WaitlistEntryPayloadBase &
  GuardianPayload & {
  reason_key: string;
  };

export type NurtureCancelTrialPreparationPayload = WaitlistOfferPayloadBase &
  MixedActorPayload & {
  reservation_ref: string;
  expected_reservation_head: number;
  reason_key: string;
  };

const BASE_KEYS = [
  "workspace_id", "institution_ref", "workflow_ref", "expected_workflow_head",
] as const;
const ENTRY_KEYS = [...BASE_KEYS, "entry_ref", "expected_entry_head"] as const;
const OFFER_KEYS = [...ENTRY_KEYS, "offer_ref", "expected_offer_head"] as const;
const ADMIN_KEYS = ["role_assignment_ref"] as const;
const MIXED_ACTOR_KEYS = [
  "role_assignment_ref", "guardian_action_owner_snapshot",
] as const;

export const validateQualifyCapacityWaitlistPayload = (
  value: unknown,
): value is NurtureQualifyCapacityWaitlistPayload =>
  hasOnlyKeys(value, [
    ...BASE_KEYS, ...ADMIN_KEYS, "target_care_group_ref", "expected_capacity_revision",
    "category_key", "category_basis_key", "next_review_at",
    "family_acceptance_owner_snapshot",
  ]) &&
  validBase(value) &&
  validActor(value, "admin") &&
  validReference(value.target_care_group_ref) &&
  Number.isSafeInteger(value.expected_capacity_revision) &&
  Number(value.expected_capacity_revision) >= 0 &&
  validToken(value.category_key) &&
  validToken(value.category_basis_key) &&
  validInstant(value.next_review_at) &&
  validateEnrollmentGuardianActionOwnerSnapshotV1(
    value.family_acceptance_owner_snapshot,
  );

const validReviewPayload = (
  value: unknown,
): value is NurtureReviewWaitlistInterestPayload => {
  if (
    !hasOnlyKeys(value, [
      ...ENTRY_KEYS, ...MIXED_ACTOR_KEYS, "interest_state", "next_review_at",
    ]) ||
    !validEntry(value) ||
    !validInstant(value.next_review_at)
  ) return false;
  return value.interest_state === "confirmed"
    ? validActor(value, "guardian")
    : value.interest_state === "unanswered" && validActor(value, "admin");
};

const validOverridePayload = (
  value: unknown,
): value is NurtureOverrideWaitlistCategoryPayload =>
  hasOnlyKeys(value, [
    ...ENTRY_KEYS, ...ADMIN_KEYS, "category_key", "category_basis_key", "reason_key",
  ]) &&
  validEntry(value) && validActor(value, "admin") &&
  validToken(value.category_key) && validToken(value.category_basis_key) &&
  validToken(value.reason_key);

const validIssuePayload = (
  value: unknown,
): value is NurtureIssueTrialOfferPayload =>
  hasOnlyKeys(value, [
    ...ENTRY_KEYS, ...ADMIN_KEYS, "expires_at",
    "trial_starts_at", "trial_ends_at", "review_at", "reason_key",
  ]) &&
  validEntry(value) && validActor(value, "admin") &&
  validInstant(value.expires_at) && validInstant(value.trial_starts_at) &&
  validInstant(value.trial_ends_at) && validInstant(value.review_at) &&
  value.expires_at < value.trial_starts_at &&
  value.trial_starts_at < value.trial_ends_at &&
  value.review_at >= value.trial_starts_at &&
  value.review_at <= value.trial_ends_at && validToken(value.reason_key);

const validAcceptPayload = (
  value: unknown,
): value is NurtureAcceptTrialOfferPayload =>
  hasOnlyKeys(value, [
    ...OFFER_KEYS, "guardian_action_owner_snapshot",
  ]) &&
  validOffer(value) && validActor(value, "guardian");

const validDeclineExpiryPayload = (
  value: unknown,
): value is NurtureDeclineOrExpireTrialOfferPayload => {
  if (
    !hasOnlyKeys(value, [
      ...OFFER_KEYS, ...MIXED_ACTOR_KEYS, "disposition", "next_review_at", "reason_key",
    ]) ||
    !validOffer(value) || !validInstant(value.next_review_at) ||
    !validToken(value.reason_key)
  ) return false;
  return value.disposition === "declined"
    ? validActor(value, "guardian")
    : value.disposition === "expired" && validActor(value, "admin");
};

const validWithdrawPayload = (
  value: unknown,
): value is NurtureWithdrawFromWaitlistPayload =>
  hasOnlyKeys(value, [
    ...ENTRY_KEYS, "reason_key", "guardian_action_owner_snapshot",
  ]) &&
  validEntry(value) && validToken(value.reason_key) &&
  validActor(value, "guardian");

const validCancelPayload = (
  value: unknown,
): value is NurtureCancelTrialPreparationPayload => {
  if (
    !hasOnlyKeys(value, [
      ...OFFER_KEYS, ...MIXED_ACTOR_KEYS, "reservation_ref",
      "expected_reservation_head", "reason_key",
    ]) ||
    !validOffer(value) ||
    !validReference(value.reservation_ref) ||
    !validHead(value.expected_reservation_head) || !validToken(value.reason_key)
  ) return false;
  return validActor(value, "admin") || validActor(value, "guardian");
};

const adminActor = (
  participantRef: string,
  roleAssignmentRef: string,
): NurtureEnrollmentWaitlistActor => ({
  kind: "institution_admin",
  participant_ref: participantRef,
  role_assignment_ref: roleAssignmentRef,
});

const guardianActor = (
  participantRef: string,
  snapshot: NurtureEnrollmentGuardianActionOwnerSnapshotV1,
): NurtureEnrollmentWaitlistActor => ({
  kind: "guardian",
  participant_ref: participantRef,
  owner_snapshot: snapshot,
});

const mixedActor = (
  context: NurtureCommandExecutionContext,
  payload: MixedActorPayload,
): NurtureEnrollmentWaitlistActor =>
  payload.role_assignment_ref
    ? adminActor(context.business_actor_ref, payload.role_assignment_ref)
    : guardianActor(
        context.business_actor_ref,
        payload.guardian_action_owner_snapshot!,
      );

const mutationBase = (
  payload: WaitlistPayloadBase,
  actor: NurtureEnrollmentWaitlistActor,
): MutationCommon => ({
  workspace_id: payload.workspace_id,
  institution_ref: payload.institution_ref,
  workflow_ref: payload.workflow_ref,
  expected_workflow_head: payload.expected_workflow_head,
  actor,
});

const entryMutationBase = (
  payload: WaitlistEntryPayloadBase,
  actor: NurtureEnrollmentWaitlistActor,
) => ({
  ...mutationBase(payload, actor),
  entry_ref: payload.entry_ref,
  expected_entry_head: payload.expected_entry_head,
});

const offerMutationBase = (
  payload: WaitlistOfferPayloadBase,
  actor: NurtureEnrollmentWaitlistActor,
) => ({
  ...entryMutationBase(payload, actor),
  offer_ref: payload.offer_ref,
  expected_offer_head: payload.expected_offer_head,
});

const canonicalOwnerFacts = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonicalOwnerFacts);
  if (!isRecord(value)) return value;
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => key !== "verified_at")
      .map(([key, entry]) => [key, canonicalOwnerFacts(entry)]),
  );
};

const mutationFailureDecision = (
  failure: NurtureEnrollmentWaitlistMutationFailure,
): "invalid" | "blocked" | "conflict" =>
  failure.status === "invalid"
    ? "invalid"
    : failure.status === "conflict"
      ? "conflict"
      : "blocked";

const localRef = (
  objectType: string,
  objectId: string,
  version: number,
): CanonicalRef => ({
  schema_version: 1,
  namespace: "nurture",
  object_type: objectType,
  object_id: objectId,
  version,
});

const transitionFromResult = (input: {
  command_key: NurtureEnrollmentJourneyCommandKey;
  reason_key: string;
  actor: NurtureEnrollmentWaitlistActor;
  result: Extract<NurtureEnrollmentWaitlistMutationResult, { status: "committed" }>;
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
  ...(input.actor.kind === "institution_admin"
    ? { actor_role_assignment_ref: input.actor.role_assignment_ref }
    : {
        actor_ref: input.actor.owner_snapshot.actor_ref,
        owner_action_ref: input.actor.owner_snapshot.action_ref,
      }),
  reason_key: input.reason_key,
});

type WaitlistFinalization = {
  transition: NurtureEnrollmentJourneyTransitionDraftV1;
  override?: NurtureEnrollmentWaitlistOverrideDraftV1;
};

const waitlistSpec = <Payload>(input: {
  command_key: Extract<
    NurtureEnrollmentJourneyCommandKey,
    | "qualify_capacity_waitlist"
    | "review_waitlist_interest"
    | "override_waitlist_category"
    | "issue_trial_offer"
    | "accept_trial_offer"
    | "decline_or_expire_trial_offer"
    | "withdraw_from_waitlist"
    | "cancel_trial_preparation"
  >;
  validate(payload: unknown): payload is Payload;
  mutation(payload: Payload, context: NurtureCommandExecutionContext): NurtureEnrollmentWaitlistMutation;
  reason(payload: Payload): string;
}): NurtureCommandSpec<Payload> => ({
  command_key: `nurture.${input.command_key}`,
  command_scope: "institution_enrollment_journey",
  contract_version: 1,
  canonicalize: canonicalOwnerFacts,
  async checkPreconditions(transaction, payload, context) {
    const owner = transaction.enrollmentWaitlist;
    if (!owner) return { status: "blocked", reason_code: "waitlist_owner_unavailable" };
    if (!input.validate(payload)) {
      return { status: "invalid", reason_code: "contract_mismatch" };
    }
    const mutation = input.mutation(payload, context);
    if (mutation.workspace_id !== context.workspace_id) {
      return { status: "invalid", reason_code: "contract_mismatch" };
    }
    const prepared = await owner.prepareMutation(mutation);
    return prepared.status === "ready"
      ? prepared
      : {
          status: mutationFailureDecision(prepared),
          reason_code: prepared.reason_code,
        };
  },
  async apply(transaction, payload, context) {
    const owner = transaction.enrollmentWaitlist;
    if (!owner) throw new Error("waitlist owner adapter is not wired");
    const mutation = input.mutation(payload, context);
    const result = await owner.commitMutation(mutation);
    if (result.status !== "committed") {
      throw new NurtureDeterministicRollback(
        result.reason_code,
        mutationFailureDecision(result),
      );
    }
    const transition = transitionFromResult({
      command_key: input.command_key,
      reason_key: input.reason(payload),
      actor: mutation.actor,
      result,
    });
    const outputRefs = [
      localRef("institution_workflow", result.workflow.workflow_ref, result.workflow.workflow_head),
      localRef("institution_workflow_transition", transition.transition_ref, 1),
      localRef("enrollment_waitlist_entry", result.entities.entry_ref, result.entities.entry_head),
      ...(result.entities.offer_ref && result.entities.offer_head
        ? [localRef("enrollment_trial_offer", result.entities.offer_ref, result.entities.offer_head)]
        : []),
      ...(result.entities.reservation_ref && result.entities.reservation_head
        ? [localRef("enrollment_trial_reservation", result.entities.reservation_ref, result.entities.reservation_head)]
        : []),
    ];
    const finalization: WaitlistFinalization = {
      transition,
      ...(result.override ? { override: result.override } : {}),
    };
    return {
      output_refs: outputRefs,
      result_schema_version: 1,
      committed_result: {
        contract_version: NURTURE_ENROLLMENT_WAITLIST_CONTRACT_VERSION,
        workflow_ref: result.workflow.workflow_ref,
        workflow_head: result.workflow.workflow_head,
        current_stage: result.workflow.current_stage,
        waiting_state: result.workflow.waiting_state,
        entry_ref: result.entities.entry_ref,
        entry_head: result.entities.entry_head,
        entry_lifecycle: result.entities.entry_lifecycle,
        ...(result.entities.offer_ref ? { offer_ref: result.entities.offer_ref } : {}),
        ...(result.entities.offer_lifecycle
          ? { offer_lifecycle: result.entities.offer_lifecycle }
          : {}),
        ...(result.entities.reservation_ref
          ? { reservation_ref: result.entities.reservation_ref }
          : {}),
        ...(result.entities.reservation_state
          ? { reservation_state: result.entities.reservation_state }
          : {}),
      },
      finalization_payload: finalization,
    };
  },
  async afterExecutionCreated(transaction, _payload, _context, applied) {
    const waitlist = transaction.enrollmentWaitlist;
    const journey = transaction.enrollmentJourney;
    const finalization = applied.finalization_payload as WaitlistFinalization | undefined;
    if (!waitlist || !journey || !finalization?.transition) {
      throw new Error("waitlist finalizer is unavailable");
    }
    if (finalization.override) {
      await waitlist.appendOverride({
        override: finalization.override,
        command_execution_ref: applied.execution.id,
      });
    }
    await journey.appendTransition({
      transition: finalization.transition,
      command_execution_ref: applied.execution.id,
    });
  },
});

export const qualifyCapacityWaitlistSpec =
  waitlistSpec<NurtureQualifyCapacityWaitlistPayload>({
    command_key: "qualify_capacity_waitlist",
    validate: validateQualifyCapacityWaitlistPayload,
    mutation: (payload, context) => ({
      kind: "qualify_capacity_waitlist",
      ...mutationBase(
        payload,
        adminActor(context.business_actor_ref, payload.role_assignment_ref),
      ),
      target_care_group_ref: payload.target_care_group_ref,
      expected_capacity_revision: payload.expected_capacity_revision,
      category_key: payload.category_key,
      category_basis_key: payload.category_basis_key,
      next_review_at: payload.next_review_at,
      family_acceptance: payload.family_acceptance_owner_snapshot,
    }),
    reason: () => "waitlist_qualified",
  });

export const reviewWaitlistInterestSpec =
  waitlistSpec<NurtureReviewWaitlistInterestPayload>({
    command_key: "review_waitlist_interest",
    validate: validReviewPayload,
    mutation: (payload, context) => ({
      kind: "review_waitlist_interest",
      ...entryMutationBase(payload, mixedActor(context, payload)),
      interest_state: payload.interest_state,
      next_review_at: payload.next_review_at,
    }),
    reason: (payload) =>
      payload.interest_state === "confirmed"
        ? "waitlist_interest_confirmed"
        : "waitlist_review_unanswered",
  });

export const overrideWaitlistCategorySpec =
  waitlistSpec<NurtureOverrideWaitlistCategoryPayload>({
    command_key: "override_waitlist_category",
    validate: validOverridePayload,
    mutation: (payload, context) => ({
      kind: "override_waitlist_category",
      ...entryMutationBase(
        payload,
        adminActor(context.business_actor_ref, payload.role_assignment_ref),
      ),
      category_key: payload.category_key,
      category_basis_key: payload.category_basis_key,
      reason_key: payload.reason_key,
    }),
    reason: (payload) => payload.reason_key,
  });

export const issueTrialOfferSpec = waitlistSpec<NurtureIssueTrialOfferPayload>({
  command_key: "issue_trial_offer",
  validate: validIssuePayload,
  mutation: (payload, context) => ({
    kind: "issue_trial_offer",
    ...entryMutationBase(
      payload,
      adminActor(context.business_actor_ref, payload.role_assignment_ref),
    ),
    expires_at: payload.expires_at,
    trial_starts_at: payload.trial_starts_at,
    trial_ends_at: payload.trial_ends_at,
    review_at: payload.review_at,
    reason_key: payload.reason_key,
  }),
  reason: (payload) => payload.reason_key,
});

export const acceptTrialOfferSpec = waitlistSpec<NurtureAcceptTrialOfferPayload>({
  command_key: "accept_trial_offer",
  validate: validAcceptPayload,
  mutation: (payload, context) => ({
    kind: "accept_trial_offer",
    ...offerMutationBase(
      payload,
      guardianActor(
        context.business_actor_ref,
        payload.guardian_action_owner_snapshot,
      ),
    ),
  }),
  reason: () => "trial_offer_accepted",
});

export const declineOrExpireTrialOfferSpec =
  waitlistSpec<NurtureDeclineOrExpireTrialOfferPayload>({
    command_key: "decline_or_expire_trial_offer",
    validate: validDeclineExpiryPayload,
    mutation: (payload, context) => ({
      kind: "decline_or_expire_trial_offer",
      ...offerMutationBase(payload, mixedActor(context, payload)),
      disposition: payload.disposition,
      next_review_at: payload.next_review_at,
      reason_key: payload.reason_key,
    }),
    reason: (payload) =>
      payload.disposition === "declined"
        ? "trial_offer_declined"
        : "trial_offer_expired",
  });

export const withdrawFromWaitlistSpec =
  waitlistSpec<NurtureWithdrawFromWaitlistPayload>({
    command_key: "withdraw_from_waitlist",
    validate: validWithdrawPayload,
    mutation: (payload, context) => ({
      kind: "withdraw_from_waitlist",
      ...entryMutationBase(
        payload,
        guardianActor(
          context.business_actor_ref,
          payload.guardian_action_owner_snapshot,
        ),
      ),
      reason_key: payload.reason_key,
    }),
    reason: (payload) => payload.reason_key,
  });

export const cancelTrialPreparationSpec =
  waitlistSpec<NurtureCancelTrialPreparationPayload>({
    command_key: "cancel_trial_preparation",
    validate: validCancelPayload,
    mutation: (payload, context) => ({
      kind: "cancel_trial_preparation",
      ...offerMutationBase(payload, mixedActor(context, payload)),
      reservation_ref: payload.reservation_ref,
      expected_reservation_head: payload.expected_reservation_head,
      reason_key: payload.reason_key,
    }),
    reason: (payload) => payload.reason_key,
  });

export class NurtureEnrollmentWaitlistQueryService {
  constructor(private readonly repository: NurtureEnrollmentWaitlistQueryRepository) {}

  readAdminQueue(
    input: Parameters<NurtureEnrollmentWaitlistQueryRepository["readAdminQueue"]>[0],
  ) {
    return this.repository.readAdminQueue(input);
  }

  readFamilyStatus(
    input: Parameters<NurtureEnrollmentWaitlistQueryRepository["readFamilyStatus"]>[0],
  ) {
    if (!validateEnrollmentGuardianActionOwnerSnapshotV1(input.owner_snapshot)) {
      return Promise.resolve({
        status: "denied" as const,
        reason_code: "invalid_guardian_owner_snapshot",
      });
    }
    return this.repository.readFamilyStatus(input);
  }
}
