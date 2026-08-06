import { describe, expect, it } from "vitest";
import {
  assembleLifecycleEventV1,
  assembleReleaseEventV1,
  FamilyGrowthAssemblyError,
  type ReleaseEnvelopeFactsV1,
} from "../../../src/domain/family-growth/assembler.js";
import {
  validateLifecycleEventV1,
  validateReleaseEventV1,
} from "../../../src/domain/family-growth/envelope.js";
import {
  lifecyclePayloadDigestV1,
  releasePayloadDigestV1,
  sha256Hex,
} from "../../../src/domain/family-growth/jcs.js";

const releaseFacts = (): ReleaseEnvelopeFactsV1 => ({
  eventId: "0d4f8f4e-6f0a-4bfa-9a25-0a2ba32e6f01",
  occurredAt: "2026-08-07T06:00:00.000Z",
  source: {
    publication_release_ref: "pub-rel-1",
    publish_process_ref: "pub-proc-1",
    publish_revision_ref: "pub-rev-1",
    publish_revision: 2,
    content_digest: "a".repeat(64),
    receipt_ref: "receipt-1",
    source_target_ref: "target-ref-1",
    committed_at: "2026-08-07T05:59:00.000Z",
  },
  target: { child_id: "mc-child-1", family_id: "mc-family-1" },
  admission: { mode: "direct_family_release", policy_ref: "pol-1", policy_version: 1 },
  material: {
    occurredAt: "2026-08-07T03:30:00.000Z",
    displaySnapshot: { title: "户外写生", source_label: "向日葵班" },
    attribution: {
      source_contributor_ref: "contrib-1",
      source_organization_ref: "org-1",
      contributed_at: "2026-08-07T03:30:00.000Z",
    },
    media: [
      {
        source_asset_ref: "asset-1",
        source_media_revision: 1,
        content_digest: "b".repeat(64),
        family_rendition_ref: "rendition-1",
        mime_type: "image/jpeg",
        access_mode: "authorized_short_lived_url",
        width: 4032,
        height: 3024,
      },
    ],
  },
  retentionMode: "family_retained",
});

describe("assembleReleaseEventV1", () => {
  it("produces a schema-valid envelope with a verifiable digest", () => {
    const envelope = assembleReleaseEventV1(releaseFacts());
    expect(validateReleaseEventV1(envelope)).toEqual([]);
    expect(envelope.source.scenario_key).toBe("nurture");
    expect(envelope.material.data_class).toBe("child_growth_record");
    expect(envelope.retention.redaction_policy).toBe("cascade_required");
    const { source, target, admission, material, retention } = envelope;
    expect(envelope.payload_digest).toBe(
      releasePayloadDigestV1({ source, target, admission, material, retention }),
    );
  });

  it("is deterministic: same facts, same envelope, same digest", () => {
    const one = assembleReleaseEventV1(releaseFacts());
    const two = assembleReleaseEventV1(releaseFacts());
    expect(one).toEqual(two);
    expect(one.payload_digest).toBe(two.payload_digest);
  });

  it("changes digest when any released fact changes", () => {
    const base = assembleReleaseEventV1(releaseFacts());
    const changed = releaseFacts();
    changed.material.displaySnapshot = { title: "户外写生（更正）", source_label: "向日葵班" };
    expect(assembleReleaseEventV1(changed).payload_digest).not.toBe(base.payload_digest);
  });

  it("fails closed on empty media and on out-of-range display fields", () => {
    const noMedia = releaseFacts();
    noMedia.material.media = [];
    expect(() => assembleReleaseEventV1(noMedia)).toThrow(FamilyGrowthAssemblyError);

    const longTitle = releaseFacts();
    longTitle.material.displaySnapshot = { title: "长".repeat(121), source_label: "班" };
    expect(() => assembleReleaseEventV1(longTitle)).toThrow(FamilyGrowthAssemblyError);
  });

  it("rejects a non-digest media content digest instead of shipping it", () => {
    const bad = releaseFacts();
    bad.material.media = [{ ...bad.material.media[0]!, content_digest: "not-a-digest" }];
    expect(() => assembleReleaseEventV1(bad)).toThrow(/content_digest/);
  });

  it("collects every violation in one pass", () => {
    const bad = releaseFacts();
    bad.material.media = [];
    bad.material.displaySnapshot = { title: "", source_label: "" };
    try {
      assembleReleaseEventV1(bad);
      expect.unreachable("assembly must fail");
    } catch (error) {
      expect(error).toBeInstanceOf(FamilyGrowthAssemblyError);
      expect((error as FamilyGrowthAssemblyError).violations.length).toBeGreaterThanOrEqual(3);
    }
  });
});

describe("assembleLifecycleEventV1", () => {
  const lifecycleFacts = () => ({
    eventId: "5b0e2b3a-8a6c-4a3e-b8c2-9f0d7a1e2f03",
    occurredAt: "2026-08-07T07:00:00.000Z",
    source: {
      publicationReleaseRef: "pub-rel-1",
      eventRef: "vis-evt-1",
      sourceReleaseRevision: 2,
      reasonKey: "content_error" as const,
    },
    target: { child_id: "mc-child-1", family_id: "mc-family-1" },
  });

  it("assembles a correction with the display-safe text digested", () => {
    const envelope = assembleLifecycleEventV1({
      ...lifecycleFacts(),
      kind: "correction",
      correctionDisplaySafeText: "活动时间更正为周三上午",
    });
    expect(validateLifecycleEventV1(envelope)).toEqual([]);
    expect(envelope.correction?.content_digest).toBe(sha256Hex("活动时间更正为周三上午"));
    expect(envelope.payload_digest).toBe(
      lifecyclePayloadDigestV1({
        source: envelope.source,
        target: envelope.target,
        correction: envelope.correction,
      }),
    );
  });

  it("assembles target_removal and redaction without a correction body", () => {
    for (const kind of ["target_removal", "redaction"] as const) {
      const envelope = assembleLifecycleEventV1({ ...lifecycleFacts(), kind });
      expect(validateLifecycleEventV1(envelope)).toEqual([]);
      expect(envelope.correction).toBeUndefined();
    }
  });

  it("enforces correction text exactly when the kind is correction", () => {
    expect(() =>
      assembleLifecycleEventV1({ ...lifecycleFacts(), kind: "correction" }),
    ).toThrow(/display-safe text/);
    expect(() =>
      assembleLifecycleEventV1({
        ...lifecycleFacts(),
        kind: "redaction",
        correctionDisplaySafeText: "不应存在",
      }),
    ).toThrow(/only correction/);
  });
});
