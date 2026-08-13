import { createHash } from "node:crypto";
import { nurtureCanonicalJson } from "../../c30/canonical-json.js";
import type {
  FamilyGrowthLifecycleEventV1,
  FamilyGrowthReleaseEventV1,
} from "./envelope.js";

/**
 * Canonical JSON serialization for the family-growth payload digests.
 *
 * The wire rule (fixed by the My-Chat consumer at `d4ed0ce`) is RFC 8785.
 * C30 owns the repository's single strict implementation; this compatibility
 * export preserves every byte produced for valid persisted JSON while now
 * rejecting non-JSON values and invalid Unicode instead of coercing them.
 */
export const canonicalJson = nurtureCanonicalJson;

export const sha256Hex = (input: string): string =>
  createHash("sha256").update(input, "utf8").digest("hex");

/**
 * Digest scope is NOT the whole envelope. The consumer verifies the release
 * digest over exactly `{source, target, admission, material, retention}` and
 * the lifecycle digest over `{source, target, correction?}` (correction only
 * when present). Envelope identity fields (contract keys, event id, kind,
 * occurred_at, the digest itself) are outside the digest.
 */
export const releasePayloadDigestV1 = (
  payload: Pick<
    FamilyGrowthReleaseEventV1,
    "source" | "target" | "admission" | "material" | "retention"
  >,
): string =>
  sha256Hex(
    canonicalJson({
      source: payload.source,
      target: payload.target,
      admission: payload.admission,
      material: payload.material,
      retention: payload.retention,
    }),
  );

export const lifecyclePayloadDigestV1 = (
  payload: Pick<FamilyGrowthLifecycleEventV1, "source" | "target" | "correction">,
): string =>
  sha256Hex(
    canonicalJson({
      source: payload.source,
      target: payload.target,
      ...(payload.correction ? { correction: payload.correction } : {}),
    }),
  );
