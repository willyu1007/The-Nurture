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

export type FamilyGrowthReleaseEmissionPrepResultV1 =
  | { status: "prepared"; emission: FamilyGrowthPreparedReleaseEmissionV1 }
  | { status: "denied"; reason: FamilyGrowthTargetDenyReasonV1 };

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
  }): Promise<FamilyGrowthReleaseEmissionPrepResultV1>;
};

/** The teacher-queue reason code a denied resolution surfaces (§四 vocabulary). */
export const FAMILY_GROWTH_BINDING_UNAVAILABLE_REASON = "binding_unavailable" as const;
