import type {
  FamilyGrowthAdmissionV1,
  FamilyGrowthAttributionV1,
  FamilyGrowthCanonicalTargetV1,
  FamilyGrowthCorrectionV1,
  FamilyGrowthDisplaySnapshotV1,
  FamilyGrowthLifecycleEventV1,
  FamilyGrowthLifecycleKindV1,
  FamilyGrowthLifecycleReasonV1,
  FamilyGrowthMediaItemV1,
  FamilyGrowthReleaseEventV1,
  FamilyGrowthReleaseSourceV1,
} from "./envelope.js";
import {
  FAMILY_GROWTH_CONTRACT_VERSION,
  FAMILY_GROWTH_LIFECYCLE_CONTRACT_KEY,
  FAMILY_GROWTH_RELEASE_CONTRACT_KEY,
  validateLifecycleEventV1,
  validateReleaseEventV1,
} from "./envelope.js";
import { lifecyclePayloadDigestV1, releasePayloadDigestV1, sha256Hex } from "./jcs.js";

/**
 * Pure envelope assembly (T-009 I1). No I/O, no clock, no randomness: every
 * identity and timestamp is an input, so the same facts always produce the
 * same envelope and the same payload digest. Callers resolve facts BEFORE
 * the release transaction; the assembled envelope is what the outbox row
 * stores (the single sanctioned place a canonical child/family ID rests).
 */

export const NURTURE_SCENARIO_KEY = "nurture" as const;

export class FamilyGrowthAssemblyError extends Error {
  readonly violations: readonly { path: string; message: string }[];
  constructor(message: string, violations: readonly { path: string; message: string }[]) {
    super(
      `${message}: ${violations
        .slice(0, 5)
        .map((item) => `${item.path} ${item.message}`)
        .join("; ")}${violations.length > 5 ? ` (+${violations.length - 5} more)` : ""}`,
    );
    this.name = "FamilyGrowthAssemblyError";
    this.violations = violations;
  }
}

export type ReleaseEnvelopeFactsV1 = {
  /** Provider outbox event id — the envelope's replay identity. */
  eventId: string;
  /** Event emission instant, RFC 3339. Passed in, never read from a clock. */
  occurredAt: string;
  source: Omit<FamilyGrowthReleaseSourceV1, "scenario_key">;
  /** Canonical IDs from the fail-closed resolution port (N1). */
  target: FamilyGrowthCanonicalTargetV1;
  admission: FamilyGrowthAdmissionV1;
  material: {
    occurredAt: string;
    displaySnapshot: FamilyGrowthDisplaySnapshotV1;
    attribution: FamilyGrowthAttributionV1;
    /**
     * The target-eligible media subset ONLY. The assembler cannot know which
     * children are visible in which asset; the caller owns that filter and
     * this contract line is why (05-pitfalls: sibling-child leakage).
     */
    media: FamilyGrowthMediaItemV1[];
  };
  retentionMode: "family_retained" | "source_linked";
};

export const assembleReleaseEventV1 = (
  facts: ReleaseEnvelopeFactsV1,
): FamilyGrowthReleaseEventV1 => {
  const body = {
    source: { scenario_key: NURTURE_SCENARIO_KEY, ...facts.source },
    target: facts.target,
    admission: facts.admission,
    material: {
      material_kind: "photo" as const,
      data_class: "child_growth_record" as const,
      purpose_key: "child_growth_publication" as const,
      occurred_at: facts.material.occurredAt,
      display_snapshot: facts.material.displaySnapshot,
      attribution: facts.material.attribution,
      media: facts.material.media,
    },
    retention: {
      retention_mode: facts.retentionMode,
      redaction_policy: "cascade_required" as const,
    },
  };
  const envelope: FamilyGrowthReleaseEventV1 = {
    contract_key: FAMILY_GROWTH_RELEASE_CONTRACT_KEY,
    contract_version: FAMILY_GROWTH_CONTRACT_VERSION,
    event_id: facts.eventId,
    event_kind: "released",
    occurred_at: facts.occurredAt,
    payload_digest: releasePayloadDigestV1(body),
    ...body,
  };
  const violations = validateReleaseEventV1(envelope);
  if (violations.length > 0) {
    throw new FamilyGrowthAssemblyError("release envelope assembly failed", violations);
  }
  return envelope;
};

export type LifecycleEnvelopeFactsV1 = {
  eventId: string;
  occurredAt: string;
  kind: FamilyGrowthLifecycleKindV1;
  source: {
    publicationReleaseRef: string;
    /** The Nurture visibility-event ref behind this lifecycle change. */
    eventRef: string;
    sourceReleaseRevision: number;
    reasonKey: FamilyGrowthLifecycleReasonV1;
  };
  target: FamilyGrowthCanonicalTargetV1;
  /**
   * Correction events only: the display-safe text from the explicit
   * unseal-for-provider step. The assembler hashes it; the sealed body never
   * reaches this layer.
   */
  correctionDisplaySafeText?: string;
};

export const assembleLifecycleEventV1 = (
  facts: LifecycleEnvelopeFactsV1,
): FamilyGrowthLifecycleEventV1 => {
  if (facts.kind === "correction" && facts.correctionDisplaySafeText === undefined) {
    throw new FamilyGrowthAssemblyError("lifecycle envelope assembly failed", [
      { path: "lifecycle.correction", message: "correction requires display-safe text" },
    ]);
  }
  if (facts.kind !== "correction" && facts.correctionDisplaySafeText !== undefined) {
    throw new FamilyGrowthAssemblyError("lifecycle envelope assembly failed", [
      { path: "lifecycle.correction", message: "only correction events carry text" },
    ]);
  }
  const correction: FamilyGrowthCorrectionV1 | undefined =
    facts.correctionDisplaySafeText === undefined
      ? undefined
      : {
          display_safe_text: facts.correctionDisplaySafeText,
          content_digest: sha256Hex(facts.correctionDisplaySafeText),
        };
  const body = {
    source: {
      scenario_key: NURTURE_SCENARIO_KEY,
      publication_release_ref: facts.source.publicationReleaseRef,
      event_ref: facts.source.eventRef,
      source_release_revision: facts.source.sourceReleaseRevision,
      reason_key: facts.source.reasonKey,
    },
    target: facts.target,
    ...(correction ? { correction } : {}),
  };
  const envelope: FamilyGrowthLifecycleEventV1 = {
    contract_key: FAMILY_GROWTH_LIFECYCLE_CONTRACT_KEY,
    contract_version: FAMILY_GROWTH_CONTRACT_VERSION,
    event_id: facts.eventId,
    event_kind: facts.kind,
    occurred_at: facts.occurredAt,
    payload_digest: lifecyclePayloadDigestV1(body),
    ...body,
  };
  const violations = validateLifecycleEventV1(envelope);
  if (violations.length > 0) {
    throw new FamilyGrowthAssemblyError("lifecycle envelope assembly failed", violations);
  }
  return envelope;
};
