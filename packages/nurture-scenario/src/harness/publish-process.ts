import { createHmac } from "node:crypto";
import {
  CAREGIVER_BOARD_ROLES,
  issueBoardOpaqueRef,
  issueBoardSealedRef,
  type BoardScopeV1,
  type CaregiverFactAuthorityV1,
} from "./board-projection.js";
import type { CaptureWatermarkV1, OrganizeTriggerEvidenceV1 } from "./care-capture-batch.js";
import type { AssembledDraftContentV1 } from "./content-assembler.js";

/**
 * G3-B1 `PublishProcess` — the caregiver-side content work unit
 * (02-architecture.md D-02/D-05/D-06).
 *
 * It starts only when internal capture has been explicitly organized into a
 * family-publication candidate, and it owns nothing else: not the camera or
 * upload transport, not T-005 `CareInteraction`, not My-Chat `ActionDelivery`
 * and not an Institution Workflow run.
 */
export const PUBLISH_PROCESS_STATES = [
  "draft",
  "needs_review",
  "pending_release",
  "released",
  "cancelled",
] as const;

export type PublishProcessStateV1 = (typeof PUBLISH_PROCESS_STATES)[number];

/**
 * The whole state machine. Scheduling, sending, retrying, per-target failure,
 * delivery and post-release safety actions are deliberately absent: they are
 * attributes, executions, per-target results, ActionDelivery or later facts.
 */
const LEGAL_TRANSITIONS: Record<PublishProcessStateV1, readonly PublishProcessStateV1[]> = {
  draft: ["needs_review", "pending_release", "cancelled"],
  needs_review: ["pending_release", "cancelled"],
  pending_release: ["released", "cancelled"],
  released: [],
  cancelled: [],
};

export const isLegalPublishProcessTransition = (
  from: PublishProcessStateV1,
  to: PublishProcessStateV1,
): boolean => LEGAL_TRANSITIONS[from].includes(to);

/** One audience data class per content unit; mixed audiences split the process. */
export type PublishDataClassV1 = "daily_care_log" | "child_growth_record";

export type ContentSafetyRouteV1 =
  | "ordinary"
  | "review_required"
  | "direct_interaction_required";

/**
 * A Nurture-owned, versioned route decision. G3-C1 owns the policy itself; the
 * capture-to-draft lane only consumes it and may never substitute a default.
 */
export type ContentSafetyAssessmentV1 = {
  route: ContentSafetyRouteV1;
  policyRef: string;
  policyHead: number;
  ruleRevision: string;
  /** Structured codes only — never a sensitive body or model chain-of-thought. */
  riskCodes: string[];
};

export type ContentSafetyRoutePort = {
  deriveRoute(input: {
    workspace_id: string;
    care_group_id: string;
    organizer_input_revision: string;
    source_ids: string[];
  }): Promise<ContentSafetyAssessmentV1 | null>;
};

export type PublishTargetCandidateV1 = {
  child_care_process_id: string;
  enrollment_id: string;
  family_id: string;
  grant_id: string;
  data_class: PublishDataClassV1;
  purpose_key: string;
  authority: CaregiverFactAuthorityV1;
};

/**
 * The public target projection. It carries identity and nothing else on
 * purpose: a per-target body or media set would hide target-specific content
 * inside one shared revision instead of splitting the process.
 */
export type PublishTargetRefV1 = {
  targetRef: string;
  dataClass: PublishDataClassV1;
  purposeKey: string;
};

export type PublishProcessRevisionV1 = {
  revision: number;
  contentDigest: string;
  organizerInputRevision: string;
  assembledAt: string;
};

export type PublishProcessV1 = {
  processRef: string;
  state: PublishProcessStateV1;
  careGroupRef: string;
  dataClass: PublishDataClassV1;
  purposeKey: string;
  currentRevision: PublishProcessRevisionV1;
  targets: PublishTargetRefV1[];
  sourceWatermark: CaptureWatermarkV1;
  triggerEvidence: OrganizeTriggerEvidenceV1;
  safety: ContentSafetyAssessmentV1;
};

/**
 * The 30-second window is an interaction posture, not a sixth state and not a
 * publication. Product copy says "enters the send queue in 30 seconds", never
 * "publishes in 30 seconds".
 */
export const DEFAULT_QUICK_ADJUST_SECONDS = 30;

export const PUBLISH_PROCESS_TARGET_KIND = "publish_process";
export const PUBLISH_TARGET_KIND = "publish_target";

/** Owner-internal composite; it never leaves the server in any form. */
export const publishTargetKey = (
  target: Pick<
    PublishTargetCandidateV1,
    "child_care_process_id" | "enrollment_id" | "grant_id"
  >,
): string =>
  `${target.child_care_process_id}~${target.enrollment_id}~${target.grant_id}`;

/** Deterministic natural key so an exact organize replay is idempotent. */
export const publishProcessKey = (careGroupId: string, triggerRequestId: string): string =>
  `${careGroupId}~${triggerRequestId}`;

export type QuickAdjustPostureV1 = {
  deadlineAt: string;
  seconds: number;
};

export type CreatePublishCandidateInputV1 = {
  care_group_id: string;
  organizer_input_revision: string;
  source_ids: string[];
  content: AssembledDraftContentV1;
  targets: PublishTargetCandidateV1[];
  watermark: CaptureWatermarkV1;
  trigger_evidence: OrganizeTriggerEvidenceV1;
  quick_adjust_seconds?: number;
};

export type CreatePublishCandidateDecisionV1 =
  | {
      status: "draft_created";
      process: PublishProcessV1;
      processKey: string;
      quickAdjust: QuickAdjustPostureV1;
    }
  | { status: "needs_review"; process: PublishProcessV1; processKey: string }
  | {
      /**
       * Restricted content keeps its internal source and never becomes a batch
       * publication candidate. T-006 emits no action of its own here: the class
       * teacher enters T-005 through an owner-issued route, and no
       * `CareInteraction` is created on their behalf.
       */
      status: "direct_interaction_required";
      assessment: ContentSafetyAssessmentV1;
      internalSourceRefs: string[];
    }
  | { status: "skipped"; reason: "empty_assembly" }
  | { status: "denied"; reason_code: string };

export type PublishProcessDependencies = {
  integrity_key: string;
  safety: ContentSafetyRoutePort;
  now?: () => Date;
};

const targetWritable = (authority: CaregiverFactAuthorityV1): boolean =>
  CAREGIVER_BOARD_ROLES.includes(authority.role) &&
  authority.role_scope_type === "care_group" &&
  authority.role_scope_matches_source &&
  authority.role_assignment_current &&
  authority.purpose_allowed;

/** Keyed digest over the exact shared composition; no body is stored with it. */
export const computePublishContentDigest = (
  integrityKey: string,
  content: AssembledDraftContentV1,
): string =>
  createHmac("sha256", integrityKey)
    .update("nurture.publish-content.v1\0", "utf8")
    .update(
      JSON.stringify([
        content.template,
        content.organizerInputRevision,
        content.title,
        content.tags,
        content.body?.segments.map((segment) => [segment.text, segment.provenance]) ?? null,
        content.mediaRefs,
        content.metadata,
      ]),
      "utf8",
    )
    .digest("hex");

/**
 * Turns one organized cut into at most one family-publication candidate.
 *
 * A capture batch that produced no assembled content creates nothing, and a
 * missing or failed safety route fails closed rather than defaulting to
 * ordinary.
 */
export const createPublishCandidate = async (
  deps: PublishProcessDependencies,
  scope: BoardScopeV1,
  input: CreatePublishCandidateInputV1,
): Promise<CreatePublishCandidateDecisionV1> => {
  if (input.content.mediaRefs.length === 0 && !input.content.body) {
    return { status: "skipped", reason: "empty_assembly" };
  }
  if (input.content.organizerInputRevision !== input.organizer_input_revision) {
    return { status: "denied", reason_code: "organizer_input_revision_mismatch" };
  }
  if (input.targets.length === 0) return { status: "denied", reason_code: "no_eligible_target" };
  if (!input.targets.every((target) => targetWritable(target.authority))) {
    return { status: "denied", reason_code: "not_authorized" };
  }
  const dataClasses = new Set(input.targets.map((target) => target.data_class));
  const purposes = new Set(input.targets.map((target) => target.purpose_key));
  if (dataClasses.size !== 1 || purposes.size !== 1) {
    // One audience data class and purpose per content unit; otherwise split.
    return { status: "denied", reason_code: "mixed_audience_data_class" };
  }

  let assessment: ContentSafetyAssessmentV1 | null;
  try {
    assessment = await deps.safety.deriveRoute({
      workspace_id: scope.workspace_id,
      care_group_id: input.care_group_id,
      organizer_input_revision: input.organizer_input_revision,
      source_ids: input.source_ids,
    });
  } catch {
    // Provider failure never resolves to ordinary.
    return { status: "denied", reason_code: "safety_route_unavailable" };
  }
  if (!assessment) return { status: "denied", reason_code: "safety_route_unavailable" };

  if (assessment.route === "direct_interaction_required") {
    return {
      status: "direct_interaction_required",
      assessment,
      internalSourceRefs: input.content.sourceRefs,
    };
  }

  const now = (deps.now ?? (() => new Date()))();
  const dataClass = [...dataClasses][0] as PublishDataClassV1;
  const purposeKey = [...purposes][0] as string;
  // The process key is derived from the exact trigger identity, so an exact
  // replay of the same organize command resolves to the same candidate instead
  // of creating a second card.
  const processKey = publishProcessKey(
    input.care_group_id,
    input.trigger_evidence.triggerRequestId,
  );
  const process: PublishProcessV1 = {
    processRef: issueBoardSealedRef(
      deps.integrity_key,
      scope,
      PUBLISH_PROCESS_TARGET_KIND,
      processKey,
    ),
    state: assessment.route === "ordinary" ? "draft" : "needs_review",
    careGroupRef: issueBoardOpaqueRef(
      deps.integrity_key,
      scope,
      "care_group",
      input.care_group_id,
    ),
    dataClass,
    purposeKey,
    currentRevision: {
      revision: 1,
      contentDigest: computePublishContentDigest(deps.integrity_key, input.content),
      organizerInputRevision: input.organizer_input_revision,
      assembledAt: now.toISOString(),
    },
    targets: input.targets.map((target) => ({
      targetRef: issueBoardSealedRef(
        deps.integrity_key,
        scope,
        PUBLISH_TARGET_KIND,
        publishTargetKey(target),
      ),
      dataClass: target.data_class,
      purposeKey: target.purpose_key,
    })),
    sourceWatermark: input.watermark,
    triggerEvidence: input.trigger_evidence,
    safety: assessment,
  };

  if (assessment.route === "review_required") {
    // Only exceptional content is gated, and it never starts the quick-adjust
    // window: a scheduler must not be able to advance it by timeout.
    return { status: "needs_review", process, processKey };
  }

  const seconds = input.quick_adjust_seconds ?? DEFAULT_QUICK_ADJUST_SECONDS;
  return {
    status: "draft_created",
    process,
    processKey,
    quickAdjust: {
      deadlineAt: new Date(now.getTime() + seconds * 1_000).toISOString(),
      seconds,
    },
  };
};

export type QuickAdjustStatusV1 =
  | { status: "running"; remainingSeconds: number }
  | { status: "paused"; reason: "editing" | "edit_hold" }
  | { status: "elapsed" };

/**
 * A teacher touching the candidate, or holding the edit lock, pauses the
 * window: content must never time out into the queue mid-edit.
 */
export const evaluateQuickAdjust = (input: {
  now: Date;
  posture: QuickAdjustPostureV1;
  editing: boolean;
  edit_hold_active: boolean;
}): QuickAdjustStatusV1 => {
  if (input.editing) return { status: "paused", reason: "editing" };
  if (input.edit_hold_active) return { status: "paused", reason: "edit_hold" };
  const remainingMs = new Date(input.posture.deadlineAt).getTime() - input.now.getTime();
  if (remainingMs <= 0) return { status: "elapsed" };
  return { status: "running", remainingSeconds: Math.ceil(remainingMs / 1_000) };
};

export type PendingReleaseAdmissionV1 =
  | { status: "admitted" }
  | {
      status: "blocked";
      reason_code:
        | "quick_adjust_active"
        | "needs_review"
        | "edit_hold_active"
        | "unsaved_revision"
        | "illegal_transition"
        | "dependency_no_go";
    };

/**
 * Everything the capture-to-draft lane can decide about entering the
 * send queue. The queue itself still needs a resolved institution schedule, so
 * without the T-007 publication-policy provider this fails closed instead of
 * inventing a send time.
 */
export const admitToPendingRelease = (input: {
  now: Date;
  state: PublishProcessStateV1;
  posture?: QuickAdjustPostureV1;
  editing: boolean;
  edit_hold_active: boolean;
  has_unsaved_revision: boolean;
  resolved_schedule_available: boolean;
}): PendingReleaseAdmissionV1 => {
  if (!isLegalPublishProcessTransition(input.state, "pending_release")) {
    return {
      status: "blocked",
      reason_code: input.state === "needs_review" ? "needs_review" : "illegal_transition",
    };
  }
  if (input.state === "needs_review") return { status: "blocked", reason_code: "needs_review" };
  if (input.edit_hold_active) return { status: "blocked", reason_code: "edit_hold_active" };
  if (input.has_unsaved_revision) {
    return { status: "blocked", reason_code: "unsaved_revision" };
  }
  if (input.posture) {
    const quickAdjust = evaluateQuickAdjust({
      now: input.now,
      posture: input.posture,
      editing: input.editing,
      edit_hold_active: input.edit_hold_active,
    });
    // A scheduler may never publish before this candidate's own deadline.
    if (quickAdjust.status !== "elapsed") {
      return { status: "blocked", reason_code: "quick_adjust_active" };
    }
  }
  if (!input.resolved_schedule_available) {
    return { status: "blocked", reason_code: "dependency_no_go" };
  }
  return { status: "admitted" };
};
