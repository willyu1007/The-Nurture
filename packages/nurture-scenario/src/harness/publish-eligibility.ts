import { issueBoardOpaqueRef, type BoardScopeV1 } from "./board-projection.js";
import {
  mediaUsableForDraft,
  type ChildAttributionStateV1,
  type MediaAssetLifecycleV1,
} from "./media-attribution.js";
import {
  issuePublishTargetRef,
  type PublishProcessStateV1,
} from "./publish-process.js";

/**
 * G3-C1 publish eligibility (02-architecture.md D-12).
 *
 * Eligibility is always derived at read time from the current media revision,
 * the current attributions and the current exposure/authority facts. There is
 * deliberately no `publishable` state to persist: a stored flag would be a
 * fourth axis that could disagree with all three real ones.
 */
export type PublishEligibilityReasonV1 =
  | "media_not_ready"
  | "media_revision_drift"
  | "target_child_not_confirmed"
  | "unknown_visible_child"
  | "unconfirmed_visible_child"
  | "exposure_not_allowed"
  | "enrollment_inactive"
  | "grant_not_allowed"
  | "data_class_not_allowed"
  | "purpose_not_allowed";

/**
 * The only four ways a blocked group photo is resolved. Cropping, blurring,
 * beautifying or generating any other visual rendition is not among them: a
 * publication always binds the exact unchanged original revision.
 */
export const GROUP_PHOTO_RESOLUTION_PATHS = [
  "correct_attribution",
  "remove_media_from_candidate",
  "remove_target",
  "split_process",
] as const;

export type GroupPhotoResolutionPathV1 = (typeof GROUP_PHOTO_RESOLUTION_PATHS)[number];

/** Reasons a class teacher can fix without weakening any policy. */
const CORRECTABLE_REASONS = new Set<PublishEligibilityReasonV1>([
  "unknown_visible_child",
  "unconfirmed_visible_child",
  "target_child_not_confirmed",
  "exposure_not_allowed",
]);

export type VisibleChildV1 = {
  /** Absent when the face is present but unidentified. */
  child_care_process_id?: string;
  attribution_status?: ChildAttributionStateV1;
  /**
   * Only clearly visible children gate a publication. A blurred passer-by at
   * the edge of the frame is not an attribution obligation.
   */
  clearly_visible: boolean;
};

export type MediaEligibilityInputV1 = {
  media_asset_id: string;
  /** The exact immutable original revision the draft composed. */
  media_revision: number;
  current_media_revision: number;
  lifecycle: MediaAssetLifecycleV1;
  visible_children: VisibleChildV1[];
};

export type TargetEligibilityInputV1 = {
  target_key: string;
  child_care_process_id: string;
  enrollment_active: boolean;
  grant_allows: boolean;
  data_class_allowed: boolean;
  purpose_allowed: boolean;
  /**
   * Which children this audience may currently see, from the exposure policy.
   * A child confirmed in the photo but absent here blocks the target.
   */
  exposure_allows_child_ids: string[];
};

export type PublishEligibilityInputV1 = {
  process_state: PublishProcessStateV1;
  media: MediaEligibilityInputV1[];
  targets: TargetEligibilityInputV1[];
};

export type TargetEligibilityV1 = {
  targetRef: string;
  eligible: boolean;
  blockingReasons: PublishEligibilityReasonV1[];
};

export type PublishEligibilityV1 = {
  /** True only when at least one target may commit right now. */
  eligible: boolean;
  route: "publishable" | "needs_review" | "blocked";
  targets: TargetEligibilityV1[];
  blockingReasons: PublishEligibilityReasonV1[];
  resolutionPaths: GroupPhotoResolutionPathV1[];
  /** One ref per exact original media revision; never a derived rendition. */
  mediaRefs: string[];
};

const mediaBlockingReasons = (
  media: MediaEligibilityInputV1,
): PublishEligibilityReasonV1[] => {
  const reasons: PublishEligibilityReasonV1[] = [];
  if (!mediaUsableForDraft(media.lifecycle)) reasons.push("media_not_ready");
  if (media.media_revision !== media.current_media_revision) {
    reasons.push("media_revision_drift");
  }
  for (const child of media.visible_children) {
    if (!child.clearly_visible) continue;
    if (!child.child_care_process_id) {
      reasons.push("unknown_visible_child");
      continue;
    }
    if (child.attribution_status !== "confirmed") {
      reasons.push("unconfirmed_visible_child");
    }
  }
  return reasons;
};

const targetBlockingReasons = (
  target: TargetEligibilityInputV1,
  media: readonly MediaEligibilityInputV1[],
): PublishEligibilityReasonV1[] => {
  const reasons: PublishEligibilityReasonV1[] = [];
  if (!target.enrollment_active) reasons.push("enrollment_inactive");
  if (!target.grant_allows) reasons.push("grant_not_allowed");
  if (!target.data_class_allowed) reasons.push("data_class_not_allowed");
  if (!target.purpose_allowed) reasons.push("purpose_not_allowed");

  const allowed = new Set(target.exposure_allows_child_ids);
  let targetChildConfirmed = media.length === 0;
  for (const asset of media) {
    for (const child of asset.visible_children) {
      if (!child.clearly_visible || !child.child_care_process_id) continue;
      if (
        child.child_care_process_id === target.child_care_process_id &&
        child.attribution_status === "confirmed"
      ) {
        targetChildConfirmed = true;
      }
      // Every clearly visible child must be one this audience may see.
      if (!allowed.has(child.child_care_process_id)) {
        reasons.push("exposure_not_allowed");
      }
    }
  }
  if (!targetChildConfirmed) reasons.push("target_child_not_confirmed");
  return reasons;
};

/**
 * The owner transaction uses the same eligibility rule as the preview lane.
 * Keeping this derivation ref-free lets persistence revalidate the exact
 * target without inventing an integrity key merely to discard projected refs.
 */
export const deriveTargetPublishBlockingReasons = (
  target: TargetEligibilityInputV1,
  media: readonly MediaEligibilityInputV1[],
): PublishEligibilityReasonV1[] =>
  [...new Set([...media.flatMap(mediaBlockingReasons), ...targetBlockingReasons(target, media)])]
    .sort();

export const deriveMediaRef = (
  integrityKey: string,
  scope: BoardScopeV1,
  media: Pick<MediaEligibilityInputV1, "media_asset_id" | "media_revision">,
): string =>
  issueBoardOpaqueRef(
    integrityKey,
    scope,
    "media_asset_revision",
    `${media.media_asset_id}~${media.media_revision}`,
  );

/**
 * Derives per-target eligibility for one shared content revision. A partially
 * blocked set is reported per target rather than collapsed, so a single blocked
 * family never silently cancels the rest.
 */
export const derivePublishEligibility = (
  integrityKey: string,
  scope: BoardScopeV1,
  input: PublishEligibilityInputV1,
): PublishEligibilityV1 => {
  const targets = input.targets.map((target) => {
    const reasons = deriveTargetPublishBlockingReasons(target, input.media);
    return {
      targetRef: issuePublishTargetRef(integrityKey, scope, target.target_key),
      eligible: reasons.length === 0,
      blockingReasons: reasons.sort(),
    };
  });

  const blockingReasons = [
    ...new Set(targets.flatMap((target) => target.blockingReasons)),
  ].sort();
  const eligible =
    input.process_state !== "cancelled" &&
    input.process_state !== "released" &&
    targets.some((target) => target.eligible);
  const correctable = blockingReasons.some((reason) => CORRECTABLE_REASONS.has(reason));

  return {
    eligible,
    route: eligible ? "publishable" : correctable ? "needs_review" : "blocked",
    targets,
    blockingReasons,
    resolutionPaths: correctable ? [...GROUP_PHOTO_RESOLUTION_PATHS] : [],
    mediaRefs: input.media.map((media) => deriveMediaRef(integrityKey, scope, media)),
  };
};

// ---------------------------------------------------------------------------
// Product "delete" mapped to its actual stage.

export type MediaDetachDecisionV1 =
  | { status: "detached"; mediaRef: string; remainingMediaCount: number }
  | { status: "denied"; reason_code: string };

/**
 * "Remove from this card" detaches one media reference from one draft. It never
 * touches the asset lifecycle, another draft or anything already published.
 */
export const evaluateMediaDetach = (
  integrityKey: string,
  scope: BoardScopeV1,
  input: {
    process_state: PublishProcessStateV1;
    composition_media_ids: string[];
    media_asset_id: string;
    media_revision: number;
  },
): MediaDetachDecisionV1 => {
  if (
    input.process_state === "released" ||
    input.process_state === "cancelled"
  ) {
    return { status: "denied", reason_code: "process_not_editable" };
  }
  if (!input.composition_media_ids.includes(input.media_asset_id)) {
    return { status: "denied", reason_code: "media_not_in_composition" };
  }
  return {
    status: "detached",
    mediaRef: deriveMediaRef(integrityKey, scope, input),
    // The owner removes every occurrence of the asset, so the preview counts
    // the same way — `length - 1` disagreed with the commit whenever the
    // composition carried the asset twice.
    remainingMediaCount: input.composition_media_ids.filter(
      (entry) => entry !== input.media_asset_id,
    ).length,
  };
};

export type MediaDiscardDecisionV1 =
  | { status: "discardable"; mediaRef: string; affectedDraftCount: number }
  | { status: "denied"; reason_code: string };

/**
 * Global pre-publication delete. It is only legal while no target anywhere has
 * committed a release; afterwards the remedy is per-target visibility removal
 * or redaction, which preserve the Receipt and audit trail.
 */
export const evaluateMediaDiscard = (
  integrityKey: string,
  scope: BoardScopeV1,
  input: {
    lifecycle: MediaAssetLifecycleV1;
    committed_release_count: number;
    referencing_draft_count: number;
    media_asset_id: string;
    media_revision: number;
  },
): MediaDiscardDecisionV1 => {
  if (input.committed_release_count > 0) {
    return { status: "denied", reason_code: "already_released" };
  }
  if (input.lifecycle === "discarded" || input.lifecycle === "redacted") {
    return { status: "denied", reason_code: "media_already_terminal" };
  }
  return {
    status: "discardable",
    mediaRef: deriveMediaRef(integrityKey, scope, input),
    // The UI states the blast radius before the teacher confirms; those drafts
    // owner-reread as unavailable afterwards.
    affectedDraftCount: input.referencing_draft_count,
  };
};
