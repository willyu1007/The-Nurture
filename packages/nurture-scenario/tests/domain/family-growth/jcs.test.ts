import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import {
  canonicalJson,
  lifecyclePayloadDigestV1,
  releasePayloadDigestV1,
  sha256Hex,
} from "../../../src/domain/family-growth/jcs.js";

describe("canonicalJson", () => {
  it("sorts object keys recursively by UTF-16 code units", () => {
    expect(canonicalJson({ b: 1, a: { d: 2, c: 3 } })).toBe('{"a":{"c":3,"d":2},"b":1}');
  });

  it("preserves array order and nested values", () => {
    expect(canonicalJson([3, { z: null, a: true }, "x"])).toBe('[3,{"a":true,"z":null},"x"]');
  });

  it("matches JSON string escaping for control characters and unicode", () => {
    // RFC 8785 escaping equals JSON.stringify: named escapes, \u00XX for
    // other control chars, raw unicode above U+001F.
    expect(canonicalJson({ s: "a\nb\té中" })).toBe(`{"s":${JSON.stringify("a\nb\té中")}}`);
  });

  it("sorts keys by code units, not locale or codepoint groups", () => {
    // "Z" (0x5A) < "a" (0x61) < "é" (0xE9) < "中" (0x4E2D is lower than 0xE9? no:
    // 0x4E2D > 0xE9) — expected order: Z, a, é, 中.
    expect(canonicalJson({ 中: 1, é: 2, a: 3, Z: 4 })).toBe('{"Z":4,"a":3,"é":2,"中":1}');
  });

  it("drops undefined object members and rejects non-finite numbers", () => {
    expect(canonicalJson({ a: 1, b: undefined })).toBe('{"a":1}');
    expect(() => canonicalJson({ a: Number.POSITIVE_INFINITY })).toThrow(/non-finite/);
  });

  it("serializes integers the way JSON.stringify does", () => {
    expect(canonicalJson({ n: 42, z: 0 })).toBe('{"n":42,"z":0}');
  });
});

describe("payload digests", () => {
  // Reference implementation replicating the My-Chat consumer verifier
  // (validation.ts `canonicalize` + JSON.stringify + sha256). Divergence
  // here means release events would be rejected as digest mismatches.
  const consumerCanonicalize = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(consumerCanonicalize);
    if (value && typeof value === "object") {
      const record = value as Record<string, unknown>;
      return Object.fromEntries(
        Object.keys(record)
          .sort()
          .map((key) => [key, consumerCanonicalize(record[key])]),
      );
    }
    return value;
  };
  const consumerDigest = (payload: unknown): string =>
    createHash("sha256").update(JSON.stringify(consumerCanonicalize(payload)), "utf8").digest("hex");

  const source = {
    scenario_key: "nurture",
    publication_release_ref: "rel-1",
    publish_process_ref: "proc-1",
    publish_revision_ref: "rev-1",
    publish_revision: 3,
    content_digest: "a".repeat(64),
    receipt_ref: "receipt-1",
    source_target_ref: "target-1",
    committed_at: "2026-08-07T05:00:00.000Z",
  };
  const target = { child_id: "child-1", family_id: "family-1" };

  it("release digest matches the consumer algorithm and scope", () => {
    const payload = {
      source,
      target,
      admission: { mode: "direct_family_release" as const, policy_ref: "pol-1", policy_version: 1 },
      material: {
        material_kind: "photo" as const,
        data_class: "child_growth_record" as const,
        purpose_key: "child_growth_publication" as const,
        occurred_at: "2026-08-07T04:00:00.000Z",
        display_snapshot: { title: "户外活动", source_label: "小一班" },
        attribution: {
          source_contributor_ref: "contrib-1",
          source_organization_ref: "org-1",
          contributed_at: "2026-08-07T04:00:00.000Z",
        },
        media: [
          {
            source_asset_ref: "asset-1",
            source_media_revision: 1,
            content_digest: "b".repeat(64),
            family_rendition_ref: "rendition-1",
            mime_type: "image/jpeg",
            access_mode: "authorized_short_lived_url" as const,
          },
        ],
      },
      retention: {
        retention_mode: "family_retained" as const,
        redaction_policy: "cascade_required" as const,
      },
    };
    expect(releasePayloadDigestV1(payload)).toBe(consumerDigest(payload));
  });

  it("lifecycle digest includes correction only when present", () => {
    const base = {
      source: {
        scenario_key: "nurture",
        publication_release_ref: "rel-1",
        event_ref: "vis-1",
        source_release_revision: 2,
        reason_key: "content_error" as const,
      },
      target,
    };
    expect(lifecyclePayloadDigestV1(base)).toBe(consumerDigest(base));
    const withCorrection = {
      ...base,
      correction: { display_safe_text: "时间更正为周三", content_digest: "c".repeat(64) },
    };
    expect(lifecyclePayloadDigestV1(withCorrection)).toBe(consumerDigest(withCorrection));
    expect(lifecyclePayloadDigestV1(base)).not.toBe(lifecyclePayloadDigestV1(withCorrection));
  });

  it("sha256Hex hashes utf-8 bytes", () => {
    expect(sha256Hex("abc")).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });
});
