import {
  CAREGIVER_BOARD_ROLES,
  issueBoardOpaqueRef,
  resolveBoardSealedRef,
  type BoardScopeV1,
  type CaregiverFactAuthorityV1,
} from "./board-projection.js";
import {
  derivePublishEligibility,
  type MediaEligibilityInputV1,
  type PublishEligibilityReasonV1,
} from "./publish-eligibility.js";
import {
  PUBLISH_PROCESS_TARGET_KIND,
  issuePublicationRef,
  issuePublishTargetRef,
  type PublishProcessStateV1,
} from "./publish-process.js";
import type { ResolvedPublishScheduleV1 } from "./publish-schedule.js";
import { randomUUID } from "node:crypto";
import type { NurtureInteractionContextService } from "../domain/interactions/interaction-context.js";
import {
  computeHarnessInputIntegrityTag,
  issueHarnessConfirmation,
} from "./confirmation.js";

/**
 * G3-D release loop (02-architecture.md D-05/D-06/D-09).
 *
 * One shared content revision fans out to one `PublicationRelease` per target.
 * Each release is its own authority check, its own Receipt and its own retry
 * unit: a multi-family send is never a cross-family all-or-nothing transaction,
 * and one blocked family never rolls back another that already committed.
 */
export const RELEASE_PUBLISH_PROCESS_CAPABILITY = {
  key: "release_publish_process",
  version: "1.0.0",
} as const;

export type ReleaseTriggerV1 = "immediate" | "scheduler";

export type TargetReleaseOutcomeV1 =
  | "committed"
  | "already_committed"
  | "rejected"
  | "outcome_unknown";

export type TargetReleaseResultV1 = {
  targetRef: string;
  outcome: TargetReleaseOutcomeV1;
  publicationRef?: string;
  receiptRef?: string;
  reasonCode?: string;
  blockingReasons?: PublishEligibilityReasonV1[];
};

export type ReleaseSummaryV1 = {
  total: number;
  committed: number;
  rejected: number;
  outcomeUnknown: number;
};

export type ReleaseDecisionV1 =
  | {
      status: "released" | "still_pending";
      processState: PublishProcessStateV1;
      /** Set the moment the first target commits; the revision is frozen then. */
      frozenRevision?: number;
      results: TargetReleaseResultV1[];
      summary: ReleaseSummaryV1;
      missedSendAttention: boolean;
    }
  | { status: "denied"; reason_code: string };

export type ReleaseTargetFactsV1 = {
  target_key: string;
  child_care_process_id: string;
  enrollment_active: boolean;
  grant_allows: boolean;
  data_class_allowed: boolean;
  purpose_allowed: boolean;
  exposure_allows_child_ids: string[];
  /** Present after a prior attempt committed this target. */
  already_committed?: { publication_ref: string; receipt_ref: string };
};

export type ReleaseFactsV1 = {
  authority: CaregiverFactAuthorityV1;
  authorizing_role_current: boolean;
  process_state: PublishProcessStateV1;
  current_revision: number;
  /** Set once the process is released; remaining targets bind to it. */
  frozen_revision?: number;
  has_unsaved_revision: boolean;
  edit_hold_active: boolean;
  /**
   * `null` when the institution window has not resolved. That is a different
   * refusal from a target that does not exist, and it never blocks a teacher
   * sending explicitly — only the scheduler depends on a window.
   */
  schedule: ResolvedPublishScheduleV1 | null;
  media: MediaEligibilityInputV1[];
  targets: ReleaseTargetFactsV1[];
};

export type CommitTargetReleaseResultV1 =
  | { status: "committed"; publication_ref: string; receipt_ref: string }
  | { status: "rejected"; reason_code: string }
  | { status: "outcome_unknown" };

export type PublicationReleasePort = {
  listReleasableProcessKeys(input: {
    workspace_id: string;
    participant_id: string;
  }): Promise<string[]>;
  loadReleaseFacts(input: {
    workspace_id: string;
    participant_id: string;
    process_key: string;
  }): Promise<ReleaseFactsV1 | null>;
  /**
   * Commits one target atomically: the `PublicationRelease`, its logical
   * Receipt and the immutable `CommandExecution` land together or not at all.
   * The same command identity for the same target is an exact replay.
   */
  commitTargetRelease(input: {
    workspace_id: string;
    participant_id: string;
    process_key: string;
    target_key: string;
    revision: number;
    command_request_id: string;
  }): Promise<CommitTargetReleaseResultV1>;
};

export type PublicationReleaseDependencies = {
  integrity_key: string;
  reads: PublicationReleasePort;
  now?: () => Date;
};

const actorEligible = (authority: CaregiverFactAuthorityV1): boolean =>
  CAREGIVER_BOARD_ROLES.includes(authority.role) &&
  authority.role_scope_type === "care_group" &&
  authority.role_scope_matches_source &&
  authority.role_assignment_current;

type ReleaseAttemptContext = {
  processKey: string;
  facts: ReleaseFactsV1;
  releaseRevision: number;
  now: Date;
};

/**
 * The process-level gates every attempt runs — shared by prepare and the
 * commit loop so the two can never drift apart: what prepare refuses, execute
 * refuses for the same reason, and what prepare previews is what the loop
 * releases.
 */
const resolveReleaseAttemptContext = async (
  deps: PublicationReleaseDependencies,
  scope: BoardScopeV1,
  request: { process_ref: string; trigger: ReleaseTriggerV1 },
): Promise<ReleaseAttemptContext | { denied: string }> => {
  const processKey = resolveBoardSealedRef(
    deps.integrity_key,
    scope,
    PUBLISH_PROCESS_TARGET_KIND,
    request.process_ref,
    await deps.reads.listReleasableProcessKeys(scope),
  );
  if (!processKey) return { denied: "target_unavailable" };

  const now = (deps.now ?? (() => new Date()))();
  const facts = await deps.reads.loadReleaseFacts({ ...scope, process_key: processKey });
  if (!facts) return { denied: "target_unavailable" };
  if (!actorEligible(facts.authority) || !facts.authorizing_role_current) {
    return { denied: "not_authorized" };
  }
  if (facts.process_state === "needs_review") return { denied: "needs_review" };
  if (facts.process_state === "cancelled") return { denied: "process_cancelled" };
  if (facts.process_state !== "pending_release" && facts.process_state !== "released") {
    return { denied: "process_not_queued" };
  }
  if (facts.edit_hold_active) return { denied: "edit_hold_active" };
  if (facts.has_unsaved_revision) {
    // Only a revision Nurture has actually committed may be released.
    return { denied: "unsaved_revision" };
  }
  // An explicit "send now" is the class teacher's own decision and is not bound
  // by the automatic retry cutoff; the scheduler is.
  if (request.trigger === "scheduler" && !facts.schedule) {
    return { denied: "schedule_unavailable" };
  }
  if (
    request.trigger === "scheduler" &&
    facts.schedule !== null &&
    now.getTime() >= Date.parse(facts.schedule.notAfter)
  ) {
    return { denied: "past_cutoff" };
  }
  if (
    request.trigger === "scheduler" &&
    facts.schedule !== null &&
    now.getTime() < Date.parse(facts.schedule.scheduledAt)
  ) {
    return { denied: "before_scheduled_at" };
  }
  if (facts.targets.length === 0) return { denied: "no_eligible_target" };

  const releaseRevision =
    facts.process_state === "released" ? facts.frozen_revision : facts.current_revision;
  if (releaseRevision === undefined) return { denied: "frozen_revision_missing" };

  return { processKey, facts, releaseRevision, now };
};

/**
 * Runs one release attempt over every target of a process.
 *
 * A `pending_release` process publishes its current saved revision; a process
 * already `released` only reconciles or retries its uncommitted targets against
 * the revision frozen by the first commit.
 */
export const releasePublishProcess = async (
  deps: PublicationReleaseDependencies,
  scope: BoardScopeV1,
  request: {
    process_ref: string;
    command_request_id: string;
    trigger: ReleaseTriggerV1;
    /**
     * The revision the caller's confirmation froze (the registry's
     * `draft_revision must_equal` head). A save landing between prepare and
     * execute must surface as a conflict, not silently publish content the
     * teacher never confirmed.
     */
    expected_release_revision?: number;
  },
): Promise<ReleaseDecisionV1> => {
  const context = await resolveReleaseAttemptContext(deps, scope, request);
  if ("denied" in context) return { status: "denied", reason_code: context.denied };
  const { processKey, facts, releaseRevision, now } = context;
  if (
    request.expected_release_revision !== undefined &&
    request.expected_release_revision !== releaseRevision
  ) {
    return { status: "denied", reason_code: "stale_confirmation" };
  }

  const eligibility = derivePublishEligibility(deps.integrity_key, scope, {
    process_state: facts.process_state,
    media: facts.media,
    targets: facts.targets,
  });
  const eligibilityByRef = new Map(
    eligibility.targets.map((target) => [target.targetRef, target]),
  );

  const results: TargetReleaseResultV1[] = [];
  let committed = 0;
  for (const target of facts.targets) {
    const targetRef = issuePublishTargetRef(deps.integrity_key, scope, target.target_key);
    if (target.already_committed) {
      // Exact replay: a committed target is never published twice.
      committed += 1;
      results.push({
        targetRef,
        outcome: "already_committed",
        publicationRef: issuePublicationRef(
          deps.integrity_key,
          scope,
          target.already_committed.publication_ref,
        ),
        receiptRef: issueBoardOpaqueRef(
          deps.integrity_key,
          scope,
          "publication_receipt",
          target.already_committed.receipt_ref,
        ),
      });
      continue;
    }
    const derived = eligibilityByRef.get(targetRef);
    if (!derived || !derived.eligible) {
      results.push({
        targetRef,
        outcome: "rejected",
        reasonCode: "not_publishable",
        blockingReasons: derived?.blockingReasons ?? [],
      });
      continue;
    }
    const commit = await deps.reads.commitTargetRelease({
      ...scope,
      process_key: processKey,
      target_key: target.target_key,
      revision: releaseRevision,
      command_request_id: request.command_request_id,
    });
    if (commit.status === "committed") {
      committed += 1;
      results.push({
        targetRef,
        outcome: "committed",
        publicationRef: issuePublicationRef(
          deps.integrity_key,
          scope,
          commit.publication_ref,
        ),
        receiptRef: issueBoardOpaqueRef(
          deps.integrity_key,
          scope,
          "publication_receipt",
          commit.receipt_ref,
        ),
      });
      continue;
    }
    if (commit.status === "rejected") {
      results.push({ targetRef, outcome: "rejected", reasonCode: commit.reason_code });
      continue;
    }
    // Outcome unknown: the next attempt reconciles with the same identity
    // rather than issuing a new command.
    results.push({ targetRef, outcome: "outcome_unknown" });
  }

  const summary: ReleaseSummaryV1 = {
    total: results.length,
    committed,
    rejected: results.filter((result) => result.outcome === "rejected").length,
    outcomeUnknown: results.filter((result) => result.outcome === "outcome_unknown").length,
  };
  // Zero commits leaves the process queued; it is never labelled released.
  const released = committed > 0;
  return {
    status: released ? "released" : "still_pending",
    processState: released ? "released" : "pending_release",
    ...(released ? { frozenRevision: releaseRevision } : {}),
    results,
    summary,
    missedSendAttention:
      !released &&
        facts.schedule !== null &&
        now.getTime() >= Date.parse(facts.schedule.notAfter),
  };
};

/**
 * What a partially released process may still do. The shared revision is frozen
 * from the first commit, so a text, media or target change needs a new process
 * rather than a rewrite of the one families already received.
 */
export type PartialReleaseFollowUpV1 = {
  retryableTargets: string[];
  reconcileTargets: string[];
  sharedRevisionEditable: boolean;
  requiresNewProcessForContentChange: boolean;
};

export const derivePartialReleaseFollowUp = (
  decision: Extract<ReleaseDecisionV1, { status: "released" | "still_pending" }>,
): PartialReleaseFollowUpV1 => ({
  retryableTargets: decision.results
    .filter((result) => result.outcome === "rejected")
    .map((result) => result.targetRef),
  reconcileTargets: decision.results
    .filter((result) => result.outcome === "outcome_unknown")
    .map((result) => result.targetRef),
  sharedRevisionEditable: decision.status !== "released",
  requiresNewProcessForContentChange: decision.status === "released",
});

// ---------------------------------------------------------------------------
// Formal-ingress entry: prepare + canonical command identity.
//
// Release is the one T-006 write that deliberately is NOT a single kernel
// command: each target commits its own PublicationRelease + Receipt +
// CommandExecution atomically inside the owner (`commitTargetRelease`), with
// the attempt identity as the executions' parent. The transport therefore
// runs a fan-out attempt, not a spec — replay of a consumed confirmation is
// answered by re-preparing (reconciliation reads stored facts, keyed by rows,
// not by command identity).

export type ReleasePublishProcessCommandV1 = {
  process_key: string;
  expected_release_revision: number;
  trigger: ReleaseTriggerV1;
};

export const canonicalizeReleasePublishProcessCommand = (
  input: ReleasePublishProcessCommandV1,
): unknown => ({
  process_key: input.process_key,
  expected_release_revision: input.expected_release_revision,
  trigger: input.trigger,
});

export type ReleasePrepareDecision =
  | {
      status: "ready_to_confirm";
      preview: {
        effect: typeof RELEASE_PUBLISH_PROCESS_CAPABILITY.key;
        target_count: number;
        already_committed_count: number;
        release_revision: number;
      };
      confirmation_ref: string;
      expires_at: string;
      command_request_id: string;
    }
  | { status: "needs_input"; fields: string[] }
  | { status: "denied"; reason_code: string };

type ReleasePrepareDeps = PublicationReleaseDependencies & {
  contexts: NurtureInteractionContextService;
  create_command_id?: () => string;
};

export const prepareReleasePublishProcess = async (
  deps: ReleasePrepareDeps,
  request: BoardScopeV1 & {
    surface: string;
    host_conversation_ref?: string;
    operation_input?: unknown;
    target_option_ref?: string;
  },
): Promise<ReleasePrepareDecision> => {
  // The frozen contract's input is empty; the target is the sealed process
  // ref and the head is frozen server-side.
  if (
    request.operation_input !== undefined &&
    (typeof request.operation_input !== "object" ||
      request.operation_input === null ||
      Array.isArray(request.operation_input) ||
      Object.keys(request.operation_input).length > 0)
  ) {
    return { status: "needs_input", fields: ["operation_input"] };
  }
  if (!request.target_option_ref) return { status: "needs_input", fields: ["target"] };
  const scope: BoardScopeV1 = {
    workspace_id: request.workspace_id,
    participant_id: request.participant_id,
  };
  const context = await resolveReleaseAttemptContext(deps, scope, {
    process_ref: request.target_option_ref,
    trigger: "immediate",
  });
  if ("denied" in context) return { status: "denied", reason_code: context.denied };

  const command: ReleasePublishProcessCommandV1 = {
    process_key: context.processKey,
    expected_release_revision: context.releaseRevision,
    trigger: "immediate",
  };
  const commandRequestId = (deps.create_command_id ?? (() => `command:${randomUUID()}`))();
  const issued = await issueHarnessConfirmation(deps.contexts, {
    workspace_id: request.workspace_id,
    participant_id: request.participant_id,
    surface: request.surface,
    ...(request.host_conversation_ref
      ? { host_conversation_ref: request.host_conversation_ref }
      : {}),
    payload: {
      capability_key: RELEASE_PUBLISH_PROCESS_CAPABILITY.key,
      capability_version: RELEASE_PUBLISH_PROCESS_CAPABILITY.version,
      command_request_id: commandRequestId,
      target_refs: { publish_process: context.processKey },
      // The registry's `draft_revision must_equal` head: the revision the
      // teacher is releasing. Enforced by the attempt itself, which refuses
      // `stale_confirmation` when a save landed in between.
      expected_heads: { draft_revision: context.releaseRevision },
      input_integrity_tag: computeHarnessInputIntegrityTag(
        deps.integrity_key,
        canonicalizeReleasePublishProcessCommand(command),
      ),
      integrity_tag_version: 1,
    },
  });
  return {
    status: "ready_to_confirm",
    preview: {
      effect: RELEASE_PUBLISH_PROCESS_CAPABILITY.key,
      target_count: context.facts.targets.length,
      already_committed_count: context.facts.targets.filter(
        (target) => target.already_committed,
      ).length,
      release_revision: context.releaseRevision,
    },
    confirmation_ref: issued.token,
    expires_at: issued.expires_at,
    command_request_id: commandRequestId,
  };
};
