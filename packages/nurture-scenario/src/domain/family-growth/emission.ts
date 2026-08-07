import type {
  FamilyGrowthAdmissionV1,
  FamilyGrowthAttributionV1,
  FamilyGrowthCanonicalTargetV1,
  FamilyGrowthDisplaySnapshotV1,
  FamilyGrowthMediaItemV1,
  FamilyGrowthRetentionModeV1,
} from "./envelope.js";
import type { FamilyGrowthTargetDenyReasonV1 } from "./target-resolution.js";

/**
 * T-009 I3 (non-wire half): the prepared per-target emission contract.
 *
 * Everything network-dependent — canonical target resolution (the owner
 * exchange) and fact loading — happens BEFORE the release transaction and
 * lands here as plain data. Inside the transaction only pure assembly and
 * the outbox row append remain, so N5's no-network rule holds while the
 * envelope still binds the exact committed release/receipt identities.
 */
export type FamilyGrowthPreparedReleaseEmissionV1 = {
  /** Canonical pair from the fail-closed I4 resolution. */
  target: FamilyGrowthCanonicalTargetV1;
  admission: FamilyGrowthAdmissionV1;
  material: {
    occurredAt: string;
    displaySnapshot: FamilyGrowthDisplaySnapshotV1;
    attribution: FamilyGrowthAttributionV1;
    /** Target-eligible media subset only; the preparer owns that filter. */
    media: FamilyGrowthMediaItemV1[];
  };
  retentionMode: FamilyGrowthRetentionModeV1;
  /** 64-hex digest of the frozen revision content (envelope `source.content_digest`). */
  contentDigest: string;
};

/**
 * Fact-loading failures beyond target resolution. Each is a stable teacher-
 * queue reason code of its own (requirements §四: binding 不可用 / policy
 * drift / 媒体不合规 are distinct displayable states).
 */
export type FamilyGrowthPreparationDenyReasonV1 =
  | "release_facts_unavailable"
  | "publication_policy_unavailable"
  | "media_facts_unavailable"
  | "display_content_unavailable";

export type FamilyGrowthEmissionDenyReasonV1 =
  | FamilyGrowthTargetDenyReasonV1
  | FamilyGrowthPreparationDenyReasonV1;

export type FamilyGrowthReleaseEmissionPrepResultV1 =
  | { status: "prepared"; emission: FamilyGrowthPreparedReleaseEmissionV1 }
  | { status: "denied"; reason: FamilyGrowthEmissionDenyReasonV1 };

/**
 * Pre-commit preparer, injected into the release flow. Absent dependency =
 * family-growth delivery off (the T-006 default-off posture is unchanged);
 * present + denied = that one target is rejected before any write, other
 * targets proceed independently (N2).
 */
export type FamilyGrowthReleaseEmissionPreparerV1 = {
  prepare(input: {
    workspace_id: string;
    process_key: string;
    target_key: string;
    child_care_process_id: string;
    /** The exact revision this release will bind; never "whatever is current". */
    revision: number;
  }): Promise<FamilyGrowthReleaseEmissionPrepResultV1>;
};

/** The teacher-queue reason code a denied resolution surfaces (§四 vocabulary). */
export const FAMILY_GROWTH_BINDING_UNAVAILABLE_REASON = "binding_unavailable" as const;

const PREPARATION_REASONS: readonly FamilyGrowthPreparationDenyReasonV1[] = [
  "release_facts_unavailable",
  "publication_policy_unavailable",
  "media_facts_unavailable",
  "display_content_unavailable",
];

/**
 * Map a denial to its teacher-queue reason code: every resolution-chain
 * denial collapses to `binding_unavailable` (the queue must not distinguish
 * revoked from quarantined from expired — that would leak binding state
 * detail through a class surface), while preparation denials keep their own
 * stable keys.
 */
export const familyGrowthEmissionRejectionReasonCode = (
  reason: FamilyGrowthEmissionDenyReasonV1,
): string =>
  (PREPARATION_REASONS as readonly string[]).includes(reason)
    ? reason
    : FAMILY_GROWTH_BINDING_UNAVAILABLE_REASON;
