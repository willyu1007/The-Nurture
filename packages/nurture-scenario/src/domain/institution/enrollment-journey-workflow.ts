import {
  assertCanonicalRef,
  type CanonicalRef,
} from "@my-chat/workflow-contracts";

export const NURTURE_ENROLLMENT_JOURNEY_WORKFLOW_CONTRACT_VERSION =
  "1.0.0" as const;
export const NURTURE_ENROLLMENT_JOURNEY_WORKFLOW_TYPE =
  "EnrollmentJourneyWorkflowV1" as const;

export const NURTURE_ENROLLMENT_JOURNEY_STAGES = [
  "inquiry",
  "intent_conversation",
  "visit_or_consultation",
  "capacity_waitlist",
  "trial_preparation",
  "trial_in_progress",
  "trial_review",
  "formal_enrollment_confirmation",
  "completed",
  "closed",
] as const;

export type NurtureEnrollmentJourneyStage =
  (typeof NURTURE_ENROLLMENT_JOURNEY_STAGES)[number];

export const NURTURE_ENROLLMENT_JOURNEY_WAITING_STATES = [
  "ready",
  "waiting_on_guardian",
  "waiting_on_caregiver",
  "waiting_on_system",
  "scheduled_future",
  "blocked",
] as const;

export type NurtureEnrollmentJourneyWaitingState =
  (typeof NURTURE_ENROLLMENT_JOURNEY_WAITING_STATES)[number];

export const NURTURE_ENROLLMENT_JOURNEY_PENDING_TRANSITIONS = [
  "none",
  "trial_start_pending",
  "formalization_pending",
  "exit_pending",
] as const;

export type NurtureEnrollmentJourneyPendingTransition =
  (typeof NURTURE_ENROLLMENT_JOURNEY_PENDING_TRANSITIONS)[number];

export const NURTURE_ENROLLMENT_JOURNEY_MILESTONES = [
  "inquiry_started",
  "intent_confirmed",
  "visit_recorded",
  "waitlist_qualified",
  "trial_offer_accepted",
  "trial_started",
  "trial_review_reached",
  "trial_extended",
  "formal_proposed",
  "guardian_formal_acceptance_recorded",
  "preparation_cancelled",
  "trial_ended",
  "formal_enrollment_committed",
  "journey_completed",
] as const;

export type NurtureEnrollmentJourneyMilestone =
  (typeof NURTURE_ENROLLMENT_JOURNEY_MILESTONES)[number];

export type NurtureEnrollmentJourneyLifecycle =
  (typeof NURTURE_ENROLLMENT_JOURNEY_LIFECYCLES)[number];

export const NURTURE_ENROLLMENT_JOURNEY_LIFECYCLES = [
  "active",
  "completed",
  "closed_without_formalization",
] as const;

export type NurtureEnrollmentJourneyTerminalOutcome =
  (typeof NURTURE_ENROLLMENT_JOURNEY_TERMINAL_OUTCOMES)[number];

export const NURTURE_ENROLLMENT_JOURNEY_TERMINAL_OUTCOMES = [
  "none",
  "formalized",
  "inquiry_closed",
  "waitlist_withdrawn",
  "preparation_cancelled",
  "trial_ended",
] as const;

export type NurtureInstitutionWorkflowDefinitionV1 = {
  contract_version: typeof NURTURE_ENROLLMENT_JOURNEY_WORKFLOW_CONTRACT_VERSION;
  workflow_type: typeof NURTURE_ENROLLMENT_JOURNEY_WORKFLOW_TYPE;
  stages: typeof NURTURE_ENROLLMENT_JOURNEY_STAGES;
  waiting_states: typeof NURTURE_ENROLLMENT_JOURNEY_WAITING_STATES;
  pending_transitions: typeof NURTURE_ENROLLMENT_JOURNEY_PENDING_TRANSITIONS;
  milestones: typeof NURTURE_ENROLLMENT_JOURNEY_MILESTONES;
  lifecycles: typeof NURTURE_ENROLLMENT_JOURNEY_LIFECYCLES;
  terminal_outcomes: typeof NURTURE_ENROLLMENT_JOURNEY_TERMINAL_OUTCOMES;
};

/**
 * G4-D increment 1 keeps the domain registry local and default-off. This is
 * not the scenario manifest and does not register a Host Run/Step capability.
 */
export const NURTURE_INSTITUTION_WORKFLOW_REGISTRY_V1 = [
  {
    contract_version: NURTURE_ENROLLMENT_JOURNEY_WORKFLOW_CONTRACT_VERSION,
    workflow_type: NURTURE_ENROLLMENT_JOURNEY_WORKFLOW_TYPE,
    stages: NURTURE_ENROLLMENT_JOURNEY_STAGES,
    waiting_states: NURTURE_ENROLLMENT_JOURNEY_WAITING_STATES,
    pending_transitions: NURTURE_ENROLLMENT_JOURNEY_PENDING_TRANSITIONS,
    milestones: NURTURE_ENROLLMENT_JOURNEY_MILESTONES,
    lifecycles: NURTURE_ENROLLMENT_JOURNEY_LIFECYCLES,
    terminal_outcomes: NURTURE_ENROLLMENT_JOURNEY_TERMINAL_OUTCOMES,
  },
] as const satisfies readonly NurtureInstitutionWorkflowDefinitionV1[];

export const findNurtureInstitutionWorkflowDefinitionV1 = (
  workflowType: string,
): NurtureInstitutionWorkflowDefinitionV1 | null =>
  workflowType === NURTURE_ENROLLMENT_JOURNEY_WORKFLOW_TYPE
    ? NURTURE_INSTITUTION_WORKFLOW_REGISTRY_V1[0]
    : null;

/**
 * Private business snapshot supplied by the future Nurture repository. It is
 * deliberately body-free and contains no Host claim/lease or raw identity.
 */
export type NurtureEnrollmentJourneyWorkflowSnapshotV1 = {
  contract_version: string;
  workflow_ref: string;
  workflow_run_ref: CanonicalRef;
  workflow_type: string;
  workflow_head: number;
  lifecycle: NurtureEnrollmentJourneyLifecycle;
  current_stage: NurtureEnrollmentJourneyStage;
  waiting_state: NurtureEnrollmentJourneyWaitingState;
  pending_transition: NurtureEnrollmentJourneyPendingTransition;
  terminal_outcome: NurtureEnrollmentJourneyTerminalOutcome;
  completed_milestones: readonly NurtureEnrollmentJourneyMilestone[];
  due_at?: string;
  started_at: string;
  updated_at: string;
};

export type NurtureInstitutionWorkflowProjectionSurface =
  | "institution_admin_mobile"
  | "institution_admin_web";

export type NurtureInstitutionWorkflowResponsibleRole =
  | "institution_admin"
  | "guardian"
  | "caregiver"
  | "system_owner"
  | "none";

export type NurtureInstitutionWorkflowProjectionState =
  | "active"
  | "waiting"
  | "blocked"
  | "completed"
  | "closed";

export type NurtureInstitutionWorkflowProjectionV1 = {
  contractVersion: typeof NURTURE_ENROLLMENT_JOURNEY_WORKFLOW_CONTRACT_VERSION;
  workflowRunRef: CanonicalRef;
  workflowType: typeof NURTURE_ENROLLMENT_JOURNEY_WORKFLOW_TYPE;
  safeTitle: "Enrollment journey";
  safeSummary: string;
  state: NurtureInstitutionWorkflowProjectionState;
  lifecycle: NurtureEnrollmentJourneyLifecycle;
  currentStage: NurtureEnrollmentJourneyStage;
  waitingState: NurtureEnrollmentJourneyWaitingState;
  pendingTransition: NurtureEnrollmentJourneyPendingTransition;
  completedMilestones: readonly NurtureEnrollmentJourneyMilestone[];
  safeBlocker?: string;
  nextAction: string;
  responsibleRole: NurtureInstitutionWorkflowResponsibleRole;
  dueAt?: string;
  workflowHead: number;
  projectionVersion: 1;
  capabilityRefs: readonly [];
  startedAt: string;
  updatedAt: string;
};

export type NurtureInstitutionWorkflowProjectionDecision =
  | { status: "ok"; output: NurtureInstitutionWorkflowProjectionV1 }
  | {
      status: "unavailable";
      reason_code:
        | "contract_mismatch"
        | "unsupported_workflow_type"
        | "invalid_snapshot"
        | "invalid_lifecycle"
        | "invalid_pending_transition";
    };

const validInstant = (value: string): boolean =>
  value.length > 0 && !Number.isNaN(new Date(value).getTime());

const isWorkflowRunRef = (ref: unknown): ref is CanonicalRef => {
  try {
    assertCanonicalRef(ref);
  } catch {
    return false;
  }
  return ref.namespace === "my_chat" && ref.object_type === "workflow_run";
};

const isMember = <Member extends string>(
  values: readonly Member[],
  value: unknown,
): value is Member =>
  typeof value === "string" && (values as readonly string[]).includes(value);

const snapshotVocabularyIsKnown = (
  snapshot: NurtureEnrollmentJourneyWorkflowSnapshotV1,
): boolean =>
  isMember(NURTURE_ENROLLMENT_JOURNEY_STAGES, snapshot.current_stage) &&
  isMember(
    NURTURE_ENROLLMENT_JOURNEY_WAITING_STATES,
    snapshot.waiting_state,
  ) &&
  isMember(
    NURTURE_ENROLLMENT_JOURNEY_PENDING_TRANSITIONS,
    snapshot.pending_transition,
  ) &&
  isMember(NURTURE_ENROLLMENT_JOURNEY_LIFECYCLES, snapshot.lifecycle) &&
  isMember(
    NURTURE_ENROLLMENT_JOURNEY_TERMINAL_OUTCOMES,
    snapshot.terminal_outcome,
  ) &&
  Array.isArray(snapshot.completed_milestones) &&
  snapshot.completed_milestones.every((milestone) =>
    isMember(NURTURE_ENROLLMENT_JOURNEY_MILESTONES, milestone),
  );

const milestoneOrder = new Map<NurtureEnrollmentJourneyMilestone, number>(
  NURTURE_ENROLLMENT_JOURNEY_MILESTONES.map((milestone, index) => [
    milestone,
    index,
  ]),
);

const milestonesAreCanonical = (
  milestones: readonly NurtureEnrollmentJourneyMilestone[],
): boolean => {
  const unique = new Set(milestones);
  if (unique.size !== milestones.length) return false;
  return milestones.every((milestone, index) => {
    if (index === 0) return true;
    const previous = milestones[index - 1];
    return (
      previous !== undefined &&
      (milestoneOrder.get(previous) ?? -1) <
        (milestoneOrder.get(milestone) ?? -1)
    );
  });
};

const pendingTransitionMatchesStage = (
  pending: NurtureEnrollmentJourneyPendingTransition,
  stage: NurtureEnrollmentJourneyStage,
  waiting: NurtureEnrollmentJourneyWaitingState,
): boolean => {
  switch (pending) {
    case "none":
      return true;
    case "trial_start_pending":
      return stage === "trial_preparation" && waiting === "waiting_on_system";
    case "formalization_pending":
      return (
        stage === "formal_enrollment_confirmation" &&
        waiting === "waiting_on_system"
      );
    case "exit_pending":
      return (
        (stage === "trial_in_progress" || stage === "trial_review") &&
        waiting === "waiting_on_system"
      );
  }
};

const hasMilestone = (
  snapshot: NurtureEnrollmentJourneyWorkflowSnapshotV1,
  milestone: NurtureEnrollmentJourneyMilestone,
): boolean => snapshot.completed_milestones.includes(milestone);

const lifecycleIsValid = (
  snapshot: NurtureEnrollmentJourneyWorkflowSnapshotV1,
): boolean => {
  if (!hasMilestone(snapshot, "inquiry_started")) return false;
  switch (snapshot.lifecycle) {
    case "active":
      return (
        snapshot.current_stage !== "completed" &&
        snapshot.current_stage !== "closed" &&
        snapshot.terminal_outcome === "none" &&
        !hasMilestone(snapshot, "preparation_cancelled") &&
        !hasMilestone(snapshot, "trial_ended") &&
        !hasMilestone(snapshot, "formal_enrollment_committed") &&
        !hasMilestone(snapshot, "journey_completed")
      );
    case "completed":
      return (
        snapshot.current_stage === "completed" &&
        snapshot.terminal_outcome === "formalized" &&
        snapshot.pending_transition === "none" &&
        (snapshot.waiting_state === "ready" ||
          snapshot.waiting_state === "waiting_on_system") &&
        hasMilestone(snapshot, "intent_confirmed") &&
        hasMilestone(snapshot, "trial_started") &&
        hasMilestone(snapshot, "trial_review_reached") &&
        hasMilestone(snapshot, "formal_proposed") &&
        hasMilestone(snapshot, "guardian_formal_acceptance_recorded") &&
        hasMilestone(snapshot, "formal_enrollment_committed") &&
        hasMilestone(snapshot, "journey_completed")
      );
    case "closed_without_formalization": {
      if (
        snapshot.current_stage !== "closed" ||
        snapshot.terminal_outcome === "none" ||
        snapshot.terminal_outcome === "formalized" ||
        snapshot.pending_transition !== "none" ||
        (snapshot.waiting_state !== "ready" &&
          snapshot.waiting_state !== "waiting_on_system") ||
        hasMilestone(snapshot, "formal_enrollment_committed") ||
        hasMilestone(snapshot, "journey_completed")
      ) {
        return false;
      }
      if (snapshot.terminal_outcome === "preparation_cancelled") {
        return (
          hasMilestone(snapshot, "trial_offer_accepted") &&
          hasMilestone(snapshot, "preparation_cancelled") &&
          !hasMilestone(snapshot, "trial_started") &&
          !hasMilestone(snapshot, "trial_ended")
        );
      }
      if (snapshot.terminal_outcome === "trial_ended") {
        return (
          hasMilestone(snapshot, "trial_started") &&
          hasMilestone(snapshot, "trial_ended") &&
          !hasMilestone(snapshot, "preparation_cancelled")
        );
      }
      if (snapshot.terminal_outcome === "waitlist_withdrawn") {
        return hasMilestone(snapshot, "waitlist_qualified");
      }
      return true;
    }
  }
};

const stageHasRequiredMilestones = (
  snapshot: NurtureEnrollmentJourneyWorkflowSnapshotV1,
): boolean => {
  switch (snapshot.current_stage) {
    case "inquiry":
      return true;
    case "intent_conversation":
      return hasMilestone(snapshot, "intent_confirmed");
    case "visit_or_consultation":
      return (
        hasMilestone(snapshot, "intent_confirmed") &&
        hasMilestone(snapshot, "visit_recorded")
      );
    case "capacity_waitlist":
      return (
        hasMilestone(snapshot, "intent_confirmed") &&
        hasMilestone(snapshot, "waitlist_qualified")
      );
    case "trial_preparation":
      return (
        hasMilestone(snapshot, "intent_confirmed") &&
        hasMilestone(snapshot, "trial_offer_accepted")
      );
    case "trial_in_progress":
      return hasMilestone(snapshot, "trial_started");
    case "trial_review":
      return (
        hasMilestone(snapshot, "trial_started") &&
        hasMilestone(snapshot, "trial_review_reached")
      );
    case "formal_enrollment_confirmation":
      return (
        hasMilestone(snapshot, "trial_started") &&
        hasMilestone(snapshot, "trial_review_reached") &&
        hasMilestone(snapshot, "formal_proposed")
      );
    case "completed":
    case "closed":
      return true;
  }
};

const summaryByStage: Record<NurtureEnrollmentJourneyStage, string> = {
  inquiry: "An enrollment inquiry is open.",
  intent_conversation: "The institution and family are confirming intent.",
  visit_or_consultation: "An optional visit or consultation is being handled.",
  capacity_waitlist: "The exact target class is currently at capacity.",
  trial_preparation: "Trial care requirements are being prepared.",
  trial_in_progress: "The child is in the bounded trial period.",
  trial_review: "The bounded trial is ready for an institution review.",
  formal_enrollment_confirmation:
    "The current formal enrollment proposal requires confirmation.",
  completed: "Formal enrollment was committed and the journey is complete.",
  closed: "The journey closed without formal enrollment.",
};

const blockerFor = (
  waiting: NurtureEnrollmentJourneyWaitingState,
): string | undefined => {
  switch (waiting) {
    case "blocked":
      return "A current authority, data, or configuration source blocks progress.";
    case "waiting_on_system":
      return "A current owner system response is required.";
    default:
      return undefined;
  }
};

const nextActionFor = (
  snapshot: NurtureEnrollmentJourneyWorkflowSnapshotV1,
): string => {
  switch (snapshot.pending_transition) {
    case "trial_start_pending":
      return "Complete the frozen trial-start checks.";
    case "formalization_pending":
      return "Complete current-owner validation and formalization.";
    case "exit_pending":
      return "Complete the local trial-exit transaction.";
    case "none":
      break;
  }

  switch (snapshot.waiting_state) {
    case "waiting_on_guardian":
      return "Wait for the Guardian's current action.";
    case "waiting_on_caregiver":
      return "Wait for current exact-class caregiver evidence.";
    case "waiting_on_system":
      return "Retry the current owner-system operation safely.";
    case "scheduled_future":
      return "Resume at the agreed future time.";
    case "blocked":
      return "Resolve the current blocker from its owning source.";
    case "ready":
      break;
  }

  switch (snapshot.current_stage) {
    case "inquiry":
      return "Record a current touchpoint and explicitly confirm intent.";
    case "intent_conversation":
      return "Record or skip the optional visit, then choose an eligible next step.";
    case "visit_or_consultation":
      return "Choose the next eligible enrollment step.";
    case "capacity_waitlist":
      return "Review the current waitlist entry under its pinned policy.";
    case "trial_preparation":
      return "Complete the trial-preparation requirements.";
    case "trial_in_progress":
      return "Continue ordinary care until the bounded review.";
    case "trial_review":
      return "Extend trial, propose formal enrollment, or end trial.";
    case "formal_enrollment_confirmation":
      return "Obtain Guardian acceptance of the current formal proposal.";
    case "completed":
    case "closed":
      return "No Enrollment Journey business action is required.";
  }
};

const responsibleRoleFor = (
  snapshot: NurtureEnrollmentJourneyWorkflowSnapshotV1,
): NurtureInstitutionWorkflowResponsibleRole => {
  if (snapshot.waiting_state === "waiting_on_system") return "system_owner";
  if (snapshot.lifecycle !== "active") return "none";
  if (snapshot.pending_transition === "formalization_pending") {
    return "system_owner";
  }
  switch (snapshot.waiting_state) {
    case "waiting_on_guardian":
      return "guardian";
    case "waiting_on_caregiver":
      return "caregiver";
    case "ready":
      return snapshot.current_stage === "formal_enrollment_confirmation"
        ? "guardian"
        : "institution_admin";
    case "scheduled_future":
    case "blocked":
      return "institution_admin";
  }
};

const projectionStateFor = (
  snapshot: NurtureEnrollmentJourneyWorkflowSnapshotV1,
): NurtureInstitutionWorkflowProjectionState => {
  if (snapshot.waiting_state === "waiting_on_system") return "waiting";
  if (snapshot.lifecycle === "completed") return "completed";
  if (snapshot.lifecycle === "closed_without_formalization") return "closed";
  if (snapshot.waiting_state === "blocked") return "blocked";
  if (snapshot.waiting_state !== "ready") return "waiting";
  return "active";
};

/**
 * Pure first-increment projection. Capability refs are intentionally empty
 * until the I2 contract and current authority-backed command lookup exist.
 */
export const projectNurtureEnrollmentJourneyWorkflowV1 = (input: {
  snapshot: NurtureEnrollmentJourneyWorkflowSnapshotV1;
  surface: NurtureInstitutionWorkflowProjectionSurface;
}): NurtureInstitutionWorkflowProjectionDecision => {
  const { snapshot } = input;
  if (
    snapshot.contract_version !==
    NURTURE_ENROLLMENT_JOURNEY_WORKFLOW_CONTRACT_VERSION
  ) {
    return { status: "unavailable", reason_code: "contract_mismatch" };
  }
  if (
    findNurtureInstitutionWorkflowDefinitionV1(snapshot.workflow_type) === null
  ) {
    return { status: "unavailable", reason_code: "unsupported_workflow_type" };
  }
  if (
    typeof snapshot.workflow_ref !== "string" ||
    snapshot.workflow_ref.length === 0 ||
    !isWorkflowRunRef(snapshot.workflow_run_ref) ||
    !snapshotVocabularyIsKnown(snapshot) ||
    !Number.isSafeInteger(snapshot.workflow_head) ||
    snapshot.workflow_head < 1 ||
    typeof snapshot.started_at !== "string" ||
    !validInstant(snapshot.started_at) ||
    typeof snapshot.updated_at !== "string" ||
    !validInstant(snapshot.updated_at) ||
    new Date(snapshot.started_at) > new Date(snapshot.updated_at) ||
    (snapshot.due_at !== undefined &&
      (typeof snapshot.due_at !== "string" || !validInstant(snapshot.due_at))) ||
    !milestonesAreCanonical(snapshot.completed_milestones)
  ) {
    return { status: "unavailable", reason_code: "invalid_snapshot" };
  }
  if (
    !pendingTransitionMatchesStage(
      snapshot.pending_transition,
      snapshot.current_stage,
      snapshot.waiting_state,
    )
  ) {
    return {
      status: "unavailable",
      reason_code: "invalid_pending_transition",
    };
  }
  if (!lifecycleIsValid(snapshot) || !stageHasRequiredMilestones(snapshot)) {
    return { status: "unavailable", reason_code: "invalid_lifecycle" };
  }

  const safeBlocker = blockerFor(snapshot.waiting_state);
  return {
    status: "ok",
    output: {
      contractVersion: NURTURE_ENROLLMENT_JOURNEY_WORKFLOW_CONTRACT_VERSION,
      workflowRunRef: {
        schema_version: 1,
        namespace: "my_chat",
        object_type: "workflow_run",
        object_id: snapshot.workflow_run_ref.object_id,
        ...(snapshot.workflow_run_ref.version === undefined
          ? {}
          : { version: snapshot.workflow_run_ref.version }),
      },
      workflowType: NURTURE_ENROLLMENT_JOURNEY_WORKFLOW_TYPE,
      safeTitle: "Enrollment journey",
      safeSummary: summaryByStage[snapshot.current_stage],
      state: projectionStateFor(snapshot),
      lifecycle: snapshot.lifecycle,
      currentStage: snapshot.current_stage,
      waitingState: snapshot.waiting_state,
      pendingTransition: snapshot.pending_transition,
      completedMilestones: [...snapshot.completed_milestones],
      ...(safeBlocker === undefined ? {} : { safeBlocker }),
      nextAction: nextActionFor(snapshot),
      responsibleRole: responsibleRoleFor(snapshot),
      ...(snapshot.due_at === undefined ? {} : { dueAt: snapshot.due_at }),
      workflowHead: snapshot.workflow_head,
      projectionVersion: 1,
      capabilityRefs: [],
      startedAt: snapshot.started_at,
      updatedAt: snapshot.updated_at,
    },
  };
};
