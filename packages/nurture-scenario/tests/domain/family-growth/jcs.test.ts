import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import {
  NurtureCanonicalJsonError,
  nurtureCanonicalJsonBytes,
} from "../../../src/c30/canonical-json.js";
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

  it("rejects values that cannot come from parsed JSON instead of coercing them", () => {
    const sparse = [1, 2];
    delete sparse[0];
    const arrayWithProperty = [1];
    Object.assign(arrayWithProperty, { extra: true });
    const cyclic: Record<string, unknown> = {};
    cyclic.self = cyclic;

    for (const value of [
      { a: 1, b: undefined },
      [undefined],
      sparse,
      arrayWithProperty,
      new Date(),
      new Map([["a", 1]]),
      cyclic,
      Number.POSITIVE_INFINITY,
    ]) {
      expect(() => canonicalJson(value)).toThrow(NurtureCanonicalJsonError);
    }
  });

  it("serializes integers the way JSON.stringify does", () => {
    expect(canonicalJson({ n: 42, z: 0 })).toBe('{"n":42,"z":0}');
  });

  it("matches the RFC 8785 primitive and recursive-ordering vector", () => {
    const value = {
      numbers: [333333333.33333329, 1E30, 4.50, 2e-3, 0.000000000000000000000000001],
      string: "€$\u000f\nA'B\"\\\\\"/",
      literals: [null, true, false],
    };
    const expected = String.raw`{"literals":[null,true,false],"numbers":[333333333.3333333,1e+30,4.5,0.002,1e-27],"string":"€$\u000f\nA'B\"\\\\\"/"}`;

    expect(canonicalJson(value)).toBe(expected);
    expect(nurtureCanonicalJsonBytes(value).toString("utf8")).toBe(expected);
  });

  it("matches the RFC 8785 UTF-16 property-ordering vector", () => {
    const value = {
      "\u20ac": "Euro Sign",
      "\r": "Carriage Return",
      "\ufb33": "Hebrew Letter Dalet With Dagesh",
      "1": "One",
      "\ud83d\ude00": "Emoji: Grinning Face",
      "\u0080": "Control",
      "\u00f6": "Latin Small Letter O With Diaeresis",
    };
    expect(canonicalJson(value)).toBe(
      '{"\\r":"Carriage Return","1":"One","":"Control","ö":"Latin Small Letter O With Diaeresis","€":"Euro Sign","😀":"Emoji: Grinning Face","דּ":"Hebrew Letter Dalet With Dagesh"}',
    );
  });

  it.each([
    ["0000000000000000", "0"],
    ["8000000000000000", "0"],
    ["0000000000000001", "5e-324"],
    ["8000000000000001", "-5e-324"],
    ["7fefffffffffffff", "1.7976931348623157e+308"],
    ["ffefffffffffffff", "-1.7976931348623157e+308"],
    ["4340000000000000", "9007199254740992"],
    ["c340000000000000", "-9007199254740992"],
    ["4430000000000000", "295147905179352830000"],
    ["44b52d02c7e14af5", "9.999999999999997e+22"],
    ["44b52d02c7e14af6", "1e+23"],
    ["44b52d02c7e14af7", "1.0000000000000001e+23"],
    ["444b1ae4d6e2ef4e", "999999999999999700000"],
    ["444b1ae4d6e2ef4f", "999999999999999900000"],
    ["444b1ae4d6e2ef50", "1e+21"],
    ["3eb0c6f7a0b5ed8c", "9.999999999999997e-7"],
    ["3eb0c6f7a0b5ed8d", "0.000001"],
    ["41b3de4355555553", "333333333.3333332"],
    ["41b3de4355555554", "333333333.33333325"],
    ["41b3de4355555555", "333333333.3333333"],
    ["41b3de4355555556", "333333333.3333334"],
    ["41b3de4355555557", "333333333.33333343"],
    ["becbf647612f3696", "-0.0000033333333333333333"],
    ["43143ff3c1cb0959", "1424953923781206.2"],
  ])("matches RFC 8785 Appendix B number %s", (hex, expected) => {
    expect(canonicalJson(Buffer.from(hex, "hex").readDoubleBE())).toBe(expected);
  });

  it("rejects RFC 8785-forbidden lone surrogates in values and property names", () => {
    for (const value of ["\ud800", "\udc00", { ["\ud800"]: true }, { ["\udc00"]: true }]) {
      expect(() => canonicalJson(value)).toThrow(/unpaired surrogate/u);
      expect(() => nurtureCanonicalJsonBytes(value)).toThrow(/unpaired surrogate/u);
    }
    expect(canonicalJson("\ud83d\ude00")).toBe('"😀"');
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
