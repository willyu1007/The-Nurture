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
import { createHash, createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import {
  familyGrowthEmissionRejectionReasonCode,
  type FamilyGrowthPreparedReleaseEmissionV1,
  type FamilyGrowthReleaseEmissionPreparerV1,
} from "../domain/family-growth/emission.js";
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
  /** Current owner-produced display label. It never participates in authority. */
  safe_label?: string;
  /** Owner fact heads used only to bind the human review snapshot. */
  target_version?: number;
  child_care_process_version?: number;
  family_label_version?: number;
  child_label_version?: number;
  enrollment_version?: number;
  grant_version?: number;
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
  /** Current T-007 owner answer, reread for every release attempt. */
  current_policy: {
    policy_ref: string;
    policy_head: number;
    policy_version: number;
  } | null;
  /** False when a stored release lacks the Receipt required to prove commit. */
  receipt_evidence_available: boolean;
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
    trigger: ReleaseTriggerV1;
    /**
     * T-009: the prepared family-growth emission for this target. When
     * present, the owner appends the outbox event inside the same
     * transaction as the release and Receipt (N5); when absent, the commit
     * behaves exactly as the qualified G3-D path.
     */
    family_growth?: FamilyGrowthPreparedReleaseEmissionV1;
  }): Promise<CommitTargetReleaseResultV1>;
};

export type PublicationReleaseDependencies = {
  integrity_key: string;
  reads: PublicationReleasePort;
  /**
   * T-009 pre-commit preparer (resolution + fact loading, both allowed to
   * touch the network — which is exactly why they run before the commit
   * transaction). Absent = family-growth delivery off; a denial rejects only
   * that target, before any write.
   */
  family_growth?: FamilyGrowthReleaseEmissionPreparerV1;
  now?: () => Date;
};

export const RELEASE_TARGET_SNAPSHOT_TTL_MS = 5 * 60_000;
export const RELEASE_TARGET_SNAPSHOT_KIND = "publish_target_snapshot";

export type ReleaseTargetPresentationV1 = {
  selectionMode: "fixed_process_targets";
  processRef: string;
  targetSnapshotRef: string;
  snapshotVersion: string;
  generatedAt: string;
  expiresAt: string;
  targets: Array<
    | {
        targetRef: string;
        availability: "available" | "already_released";
        displayLabel: string;
        safeDisambiguation?: string;
      }
    | {
        targetRef: string;
        availability: "unavailable";
        safeReasonCode: "target_unavailable";
      }
  >;
};

export type ReleaseTargetPresentationDecisionV1 =
  | { status: "ready"; presentation: ReleaseTargetPresentationV1 }
  | { status: "denied"; reason_code: string };

const isSafeTargetLabel = (value: string | undefined): value is string =>
  typeof value === "string" &&
  value === value.trim() &&
  value.length > 0 &&
  value.length <= 80 &&
  !hasControlCharacter(value);

const hasControlCharacter = (value: string): boolean =>
  [...value].some((character) => {
    const codePoint = character.codePointAt(0);
    return codePoint !== undefined && (codePoint <= 31 || codePoint === 127);
  });

/**
 * Internal version of the exact human-reviewed target set. It is never sent
 * directly: the presenter emits only actor-bound opaque refs derived from it.
 */
export const computeReleaseTargetSnapshotVersion = (
  facts: ReleaseFactsV1,
): string =>
  createHash("sha256")
    .update(
      JSON.stringify({
        process_state: facts.process_state,
        current_revision: facts.current_revision,
        frozen_revision: facts.frozen_revision ?? null,
        media: [...facts.media]
          .sort((left, right) =>
            left.media_asset_id.localeCompare(right.media_asset_id),
          )
          .map((asset) => ({
            media_asset_id: asset.media_asset_id,
            media_revision: asset.media_revision,
            current_media_revision: asset.current_media_revision,
            lifecycle: asset.lifecycle,
            visible_children: [...asset.visible_children]
              .sort((left, right) =>
                `${left.child_care_process_id ?? ""}:${left.attribution_status ?? ""}:${left.clearly_visible}`.localeCompare(
                  `${right.child_care_process_id ?? ""}:${right.attribution_status ?? ""}:${right.clearly_visible}`,
                ),
              )
              .map((child) => ({
                child_care_process_id:
                  child.child_care_process_id ?? null,
                attribution_status: child.attribution_status ?? null,
                clearly_visible: child.clearly_visible,
              })),
          })),
        targets: [...facts.targets]
          .sort((left, right) => left.target_key.localeCompare(right.target_key))
          .map((target) => ({
            target_key: target.target_key,
            child_care_process_id: target.child_care_process_id,
            safe_label: target.safe_label ?? null,
            target_version: target.target_version ?? null,
            child_care_process_version:
              target.child_care_process_version ?? null,
            family_label_version: target.family_label_version ?? null,
            child_label_version: target.child_label_version ?? null,
            enrollment_version: target.enrollment_version ?? null,
            grant_version: target.grant_version ?? null,
            enrollment_active: target.enrollment_active,
            grant_allows: target.grant_allows,
            data_class_allowed: target.data_class_allowed,
            purpose_allowed: target.purpose_allowed,
            exposure_allows_child_ids: [
              ...target.exposure_allows_child_ids,
            ].sort(),
            already_committed: target.already_committed
              ? {
                  publication_ref: target.already_committed.publication_ref,
                  receipt_ref: target.already_committed.receipt_ref,
                }
              : null,
          })),
      }),
      "utf8",
    )
    .digest("hex");

const releaseTargetSnapshotMac = (
  integrityKey: string,
  scope: BoardScopeV1,
  snapshotVersion: string,
  expiresAtMs: number,
): string =>
  createHmac("sha256", integrityKey)
    .update(
      `nurture.${RELEASE_TARGET_SNAPSHOT_KIND}.v1\0${scope.workspace_id}\0${scope.participant_id}\0${snapshotVersion}\0${expiresAtMs}`,
      "utf8",
    )
    .digest("hex");

export const issueReleaseTargetSnapshotRef = (input: {
  integrity_key: string;
  scope: BoardScopeV1;
  snapshot_version: string;
  now: Date;
}): { ref: string; expires_at: string } => {
  const expiresAtMs = input.now.getTime() + RELEASE_TARGET_SNAPSHOT_TTL_MS;
  return {
    ref: `1.${expiresAtMs}.${releaseTargetSnapshotMac(
      input.integrity_key,
      input.scope,
      input.snapshot_version,
      expiresAtMs,
    )}`,
    expires_at: new Date(expiresAtMs).toISOString(),
  };
};

export const releaseTargetSnapshotRefMatches = (input: {
  integrity_key: string;
  scope: BoardScopeV1;
  snapshot_version: string;
  ref: string;
  now: Date;
}): boolean => {
  const match = /^1\.(\d{13})\.([0-9a-f]{64})$/u.exec(input.ref);
  if (!match) return false;
  const expiresAtMs = Number(match[1]);
  const providedMac = match[2];
  if (
    !Number.isSafeInteger(expiresAtMs) ||
    expiresAtMs <= input.now.getTime() ||
    !providedMac
  ) {
    return false;
  }
  const expectedMac = releaseTargetSnapshotMac(
    input.integrity_key,
    input.scope,
    input.snapshot_version,
    expiresAtMs,
  );
  return timingSafeEqual(
    Buffer.from(providedMac, "hex"),
    Buffer.from(expectedMac, "hex"),
  );
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
  // Every release depends on the exact policy that produced the frozen window.
  // "Send now" bypasses clock bounds, not policy compatibility.
  if (!facts.schedule) {
    return { denied: "schedule_unavailable" };
  }
  if (!facts.current_policy) return { denied: "publication_policy_unavailable" };
  if (
    facts.current_policy.policy_ref !== facts.schedule.policyRef ||
    facts.current_policy.policy_head !== facts.schedule.policyHead ||
    facts.current_policy.policy_version !== facts.schedule.policyVersion
  ) {
    return { denied: "publication_policy_drift" };
  }
  if (!facts.receipt_evidence_available) {
    return { denied: "receipt_evidence_unavailable" };
  }
  if (
    request.trigger === "scheduler" &&
    now.getTime() >= Date.parse(facts.schedule.notAfter)
  ) {
    return { denied: "past_cutoff" };
  }
  if (
    request.trigger === "scheduler" &&
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
 * Human-readable review of the fixed target set already owned by one
 * PublishProcess. This is intentionally not a subset-selection command.
 */
export const presentReleaseTargets = async (
  deps: PublicationReleaseDependencies,
  scope: BoardScopeV1,
  request: { process_ref: string },
): Promise<ReleaseTargetPresentationDecisionV1> => {
  const context = await resolveReleaseAttemptContext(deps, scope, {
    process_ref: request.process_ref,
    trigger: "immediate",
  });
  if ("denied" in context) {
    return { status: "denied", reason_code: context.denied };
  }

  const eligibility = derivePublishEligibility(deps.integrity_key, scope, {
    process_state: context.facts.process_state,
    media: context.facts.media,
    targets: context.facts.targets,
  });
  const eligibilityByRef = new Map(
    eligibility.targets.map((target) => [target.targetRef, target]),
  );
  const orderedTargets = [...context.facts.targets].sort((left, right) =>
    left.target_key.localeCompare(right.target_key),
  );
  const eligibleLabels = orderedTargets.flatMap((target) => {
    const targetRef = issuePublishTargetRef(
      deps.integrity_key,
      scope,
      target.target_key,
    );
    const derived = eligibilityByRef.get(targetRef);
    return derived?.eligible && isSafeTargetLabel(target.safe_label)
      ? [target.safe_label]
      : [];
  });
  const labelCounts = new Map<string, number>();
  for (const label of eligibleLabels) {
    labelCounts.set(label, (labelCounts.get(label) ?? 0) + 1);
  }
  if (
    orderedTargets.some((target) => {
      const targetRef = issuePublishTargetRef(
        deps.integrity_key,
        scope,
        target.target_key,
      );
      return (
        eligibilityByRef.get(targetRef)?.eligible === true &&
        !isSafeTargetLabel(target.safe_label)
      );
    })
  ) {
    return { status: "denied", reason_code: "target_label_unavailable" };
  }

  const snapshotVersion = computeReleaseTargetSnapshotVersion(context.facts);
  const issued = issueReleaseTargetSnapshotRef({
    integrity_key: deps.integrity_key,
    scope,
    snapshot_version: snapshotVersion,
    now: context.now,
  });
  const duplicateOrdinals = new Map<string, number>();
  const targets: ReleaseTargetPresentationV1["targets"] =
    orderedTargets.map((target) => {
      const targetRef = issuePublishTargetRef(
        deps.integrity_key,
        scope,
        target.target_key,
      );
      const derived = eligibilityByRef.get(targetRef);
      if (!derived?.eligible || !isSafeTargetLabel(target.safe_label)) {
        return {
          targetRef,
          availability: "unavailable" as const,
          safeReasonCode: "target_unavailable" as const,
        };
      }
      const duplicated = (labelCounts.get(target.safe_label) ?? 0) > 1;
      const duplicateOrdinal =
        (duplicateOrdinals.get(target.safe_label) ?? 0) + 1;
      if (duplicated) {
        duplicateOrdinals.set(target.safe_label, duplicateOrdinal);
      }
      return {
        targetRef,
        availability: target.already_committed
          ? ("already_released" as const)
          : ("available" as const),
        displayLabel: target.safe_label,
        ...(duplicated
          ? { safeDisambiguation: `同名目标 ${duplicateOrdinal}` }
          : {}),
      };
    });

  return {
    status: "ready",
    presentation: {
      selectionMode: "fixed_process_targets",
      processRef: request.process_ref,
      targetSnapshotRef: issued.ref,
      snapshotVersion: issueBoardOpaqueRef(
        deps.integrity_key,
        scope,
        "publish_target_snapshot_version",
        snapshotVersion,
      ),
      generatedAt: context.now.toISOString(),
      expiresAt: issued.expires_at,
      targets,
    },
  };
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
    /** Internal digest bound by the Q4 human target review. */
    expected_target_snapshot_version?: string;
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
  if (
    request.expected_target_snapshot_version !== undefined &&
    request.expected_target_snapshot_version !==
      computeReleaseTargetSnapshotVersion(facts)
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
    // T-009: resolve and prepare the family-growth emission BEFORE the commit
    // transaction (the owner exchange is a network call). A denied resolution
    // rejects this one target and never reaches the owner; other targets keep
    // their independence (N2).
    let familyGrowth: FamilyGrowthPreparedReleaseEmissionV1 | undefined;
    if (deps.family_growth) {
      const prepared = await deps.family_growth.prepare({
        workspace_id: scope.workspace_id,
        process_key: processKey,
        target_key: target.target_key,
        child_care_process_id: target.child_care_process_id,
        revision: releaseRevision,
      });
      if (prepared.status === "denied") {
        results.push({
          targetRef,
          outcome: "rejected",
          reasonCode: familyGrowthEmissionRejectionReasonCode(prepared.reason),
          blockingReasons: [],
        });
        continue;
      }
      familyGrowth = prepared.emission;
    }
    const commit = await deps.reads.commitTargetRelease({
      ...scope,
      process_key: processKey,
      target_key: target.target_key,
      revision: releaseRevision,
      command_request_id: request.command_request_id,
      trigger: request.trigger,
      ...(familyGrowth ? { family_growth: familyGrowth } : {}),
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

const TERMINAL_INTEGRITY_DRIFT_REJECTIONS = new Set([
  "binding_unavailable",
  "binding_target_mismatch",
  "publication_policy_drift",
  "revision_conflict",
  "family_growth_emission_invalid",
  "command_identity_conflict",
  "receipt_evidence_unavailable",
]);

export const derivePartialReleaseFollowUp = (
  decision: Extract<ReleaseDecisionV1, { status: "released" | "still_pending" }>,
): PartialReleaseFollowUpV1 => ({
  retryableTargets: decision.results
    .filter(
      (result) =>
        result.outcome === "rejected"
        && !TERMINAL_INTEGRITY_DRIFT_REJECTIONS.has(result.reasonCode ?? ""),
    )
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
  expected_target_snapshot_version?: string;
  trigger: ReleaseTriggerV1;
};

export const canonicalizeReleasePublishProcessCommand = (
  input: ReleasePublishProcessCommandV1,
): unknown => ({
  process_key: input.process_key,
  expected_release_revision: input.expected_release_revision,
  ...(input.expected_target_snapshot_version
    ? {
        expected_target_snapshot_version:
          input.expected_target_snapshot_version,
      }
    : {}),
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
    target_snapshot_ref?: string;
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
  const targetSnapshotVersion = computeReleaseTargetSnapshotVersion(
    context.facts,
  );
  if (
    request.target_snapshot_ref !== undefined &&
    !releaseTargetSnapshotRefMatches({
      integrity_key: deps.integrity_key,
      scope,
      snapshot_version: targetSnapshotVersion,
      ref: request.target_snapshot_ref,
      now: context.now,
    })
  ) {
    return { status: "needs_input", fields: ["target_snapshot"] };
  }

  const command: ReleasePublishProcessCommandV1 = {
    process_key: context.processKey,
    expected_release_revision: context.releaseRevision,
    ...(request.target_snapshot_ref
      ? { expected_target_snapshot_version: targetSnapshotVersion }
      : {}),
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
      target_refs: {
        publish_process: context.processKey,
        ...(request.target_snapshot_ref
          ? { publish_target_snapshot: targetSnapshotVersion }
          : {}),
      },
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
