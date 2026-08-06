import { createHash } from "node:crypto";
import type {
  FamilyGrowthLifecycleEventV1,
  FamilyGrowthReleaseEventV1,
} from "./envelope.js";

/**
 * Canonical JSON serialization for the family-growth payload digests.
 *
 * The wire rule (fixed by the My-Chat consumer at `d4ed0ce`) is: recursively
 * sort object keys by UTF-16 code units, then serialize with
 * `JSON.stringify` and no whitespace. For this contract's value domain —
 * object/array/string/boolean/null and integers — that output is identical
 * to RFC 8785 (JCS): `JSON.stringify` already emits JCS-conformant string
 * escapes and ECMAScript shortest-round-trip numbers, and the default
 * `Array.prototype.sort` compares by UTF-16 code units. Divergence is only
 * possible for exotic doubles this contract never carries.
 */
export const canonicalJson = (value: unknown): string => {
  if (value === undefined) {
    throw new Error("family growth canonicalization: undefined is not serializable");
  }
  if (typeof value === "number" && !Number.isFinite(value)) {
    throw new Error("family growth canonicalization: non-finite number");
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalJson(item === undefined ? null : item)).join(",")}]`;
  }
  if (value !== null && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const parts: string[] = [];
    for (const key of Object.keys(record).sort()) {
      const item = record[key];
      if (item === undefined) continue;
      parts.push(`${JSON.stringify(key)}:${canonicalJson(item)}`);
    }
    return `{${parts.join(",")}}`;
  }
  return JSON.stringify(value);
};

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
