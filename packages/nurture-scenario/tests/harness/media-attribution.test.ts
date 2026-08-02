import { describe, expect, it } from "vitest";
import {
  CHILD_ATTRIBUTION_STATES,
  MEDIA_ASSET_LIFECYCLE_STATES,
  confirmChildMediaAttribution,
  isLegalAttributionTransition,
  isLegalMediaAssetTransition,
  issueChildOptionRef,
  issueMediaAssetTargetRef,
  mapLegacyAttributionStatus,
  mapLegacyMediaAssetStatus,
  mediaUsableForDraft,
  rejectChildMediaAttribution,
  supersedeChildMediaAttribution,
  type ChildAttributionStateV1,
  type MediaAssetLifecycleV1,
  type MediaAttributionFactsV1,
  type MediaAttributionReadPort,
} from "../../src/harness/media-attribution.js";
import { BOARD_INTEGRITY_KEY, caregiverAuthority } from "./board-fixtures.js";

const scope = { workspace_id: "ws-1", participant_id: "caregiver-1" };
const other = { workspace_id: "ws-1", participant_id: "caregiver-2" };
const now = () => new Date("2026-08-02T10:00:00.000Z");
const MEDIA_ID = "media-1";

const mediaRef = (forScope = scope) =>
  issueMediaAssetTargetRef(BOARD_INTEGRITY_KEY, forScope, MEDIA_ID);
const childRef = (childId: string, forScope = scope) =>
  issueChildOptionRef(BOARD_INTEGRITY_KEY, forScope, childId);

const facts = (
  overrides: Partial<MediaAttributionFactsV1> = {},
): MediaAttributionFactsV1 => ({
  authority: caregiverAuthority(),
  media_lifecycle: "ready",
  media_revision: 3,
  eligible_child_ids: ["child-1", "child-2"],
  attributions: [],
  ...overrides,
});

const deps = (value: MediaAttributionFactsV1 | null, mediaIds = [MEDIA_ID]) => ({
  integrity_key: BOARD_INTEGRITY_KEY,
  now,
  reads: {
    listAttributableMediaIds: async () => mediaIds,
    loadMediaAttributionFacts: async () => value,
  } satisfies MediaAttributionReadPort,
});

describe("G3-C1 three-axis lifecycles", () => {
  it("keeps media availability and child attribution as separate closed axes", () => {
    expect([...MEDIA_ASSET_LIFECYCLE_STATES]).toEqual([
      "preparing",
      "ready",
      "unavailable",
      "discarded",
      "redacted",
    ]);
    expect([...CHILD_ATTRIBUTION_STATES]).toEqual([
      "candidate",
      "confirmed",
      "rejected",
      "superseded",
    ]);
    // `published` is a third axis and never appears on either of these two.
    for (const invented of ["published", "publishable", "released", "uploaded"]) {
      expect(MEDIA_ASSET_LIFECYCLE_STATES as readonly string[]).not.toContain(invented);
      expect(CHILD_ATTRIBUTION_STATES as readonly string[]).not.toContain(invented);
    }
  });

  it("allows only the frozen media transitions and keeps both endings terminal", () => {
    for (const [from, to] of [
      ["preparing", "ready"],
      ["ready", "unavailable"],
      ["unavailable", "ready"],
      ["ready", "discarded"],
      ["ready", "redacted"],
    ] as Array<[MediaAssetLifecycleV1, MediaAssetLifecycleV1]>) {
      expect(isLegalMediaAssetTransition(from, to), `${from}->${to}`).toBe(true);
    }
    for (const [from, to] of [
      ["discarded", "ready"],
      ["redacted", "ready"],
      ["discarded", "redacted"],
      ["ready", "preparing"],
    ] as Array<[MediaAssetLifecycleV1, MediaAssetLifecycleV1]>) {
      expect(isLegalMediaAssetTransition(from, to), `${from}->${to}`).toBe(false);
    }
    expect(mediaUsableForDraft("ready")).toBe(true);
    for (const state of ["preparing", "unavailable", "discarded", "redacted"] as const) {
      expect(mediaUsableForDraft(state), state).toBe(false);
    }
  });

  it("corrects a confirmed attribution by supersession, never by rejection", () => {
    for (const [from, to] of [
      ["candidate", "confirmed"],
      ["candidate", "rejected"],
      ["confirmed", "superseded"],
    ] as Array<[ChildAttributionStateV1, ChildAttributionStateV1]>) {
      expect(isLegalAttributionTransition(from, to), `${from}->${to}`).toBe(true);
    }
    for (const [from, to] of [
      ["confirmed", "rejected"],
      ["confirmed", "candidate"],
      ["rejected", "confirmed"],
      ["superseded", "confirmed"],
    ] as Array<[ChildAttributionStateV1, ChildAttributionStateV1]>) {
      expect(isLegalAttributionTransition(from, to), `${from}->${to}`).toBe(false);
    }
  });
});

describe("G3-C1 one-time legacy mapping", () => {
  it("maps active media deterministically and fails closed on hidden/deleted", () => {
    expect(mapLegacyMediaAssetStatus({ legacy_status: "active" })).toEqual({
      status: "mapped",
      state: "ready",
    });
    expect(
      mapLegacyMediaAssetStatus({ legacy_status: "active", owner_can_provide: false }),
    ).toEqual({ status: "mapped", state: "unavailable" });
    for (const legacy of ["hidden", "deleted"] as const) {
      expect(mapLegacyMediaAssetStatus({ legacy_status: legacy }), legacy).toEqual({
        status: "ambiguous",
        reason_code: "missing_release_evidence",
      });
      expect(
        mapLegacyMediaAssetStatus({ legacy_status: legacy, has_committed_release: true }),
      ).toEqual({ status: "mapped", state: "redacted" });
      expect(
        mapLegacyMediaAssetStatus({ legacy_status: legacy, has_committed_release: false }),
      ).toEqual({ status: "mapped", state: "discarded" });
    }
  });

  it("requires a supersession link before calling a corrected attribution superseded", () => {
    for (const legacy of ["candidate", "confirmed", "rejected"] as const) {
      expect(mapLegacyAttributionStatus({ legacy_status: legacy })).toEqual({
        status: "mapped",
        state: legacy,
      });
    }
    expect(mapLegacyAttributionStatus({ legacy_status: "corrected" })).toEqual({
      status: "ambiguous",
      reason_code: "missing_supersession_link",
    });
    expect(
      mapLegacyAttributionStatus({
        legacy_status: "corrected",
        superseded_by_attribution_id: "attr-9",
      }),
    ).toEqual({ status: "mapped", state: "superseded" });
    for (const legacy of ["hidden", "deleted"] as const) {
      expect(mapLegacyAttributionStatus({ legacy_status: legacy }), legacy).toEqual({
        status: "ambiguous",
        reason_code: "missing_resolution_evidence",
      });
      expect(
        mapLegacyAttributionStatus({
          legacy_status: legacy,
          resolved_as: "rejected",
          evidence_ref: "evidence-1",
        }),
      ).toEqual({ status: "mapped", state: "rejected" });
      expect(
        mapLegacyAttributionStatus({
          legacy_status: legacy,
          resolved_as: "superseded",
          evidence_ref: "evidence-1",
        }),
      ).toEqual({ status: "ambiguous", reason_code: "missing_supersession_link" });
    }
  });
});

describe("G3-C1 manual attribution capabilities", () => {
  it("confirms a candidate as a manual decision bound to the exact media revision", async () => {
    const decision = await confirmChildMediaAttribution(
      deps(
        facts({
          attributions: [
            {
              attribution_id: "attr-1",
              child_care_process_id: "child-1",
              status: "candidate",
              revision: 1,
              source: "organizer_candidate",
            },
          ],
        }),
      ),
      scope,
      { media_ref: mediaRef(), operation_input: { childRef: childRef("child-1") } },
    );
    expect(decision.status).toBe("committed");
    if (decision.status !== "committed") return;
    expect(decision.mediaRevision).toBe(3);
    expect(decision.records).toHaveLength(1);
    expect(decision.records[0]).toMatchObject({
      status: "confirmed",
      revision: 2,
      source: "manual",
      decidedAt: "2026-08-02T10:00:00.000Z",
    });
    expect(JSON.stringify(decision)).not.toContain("child-1");
    expect(JSON.stringify(decision)).not.toContain("attr-1");
  });

  it("is idempotent on an already confirmed child", async () => {
    const decision = await confirmChildMediaAttribution(
      deps(
        facts({
          attributions: [
            {
              attribution_id: "attr-1",
              child_care_process_id: "child-1",
              status: "confirmed",
              revision: 4,
              source: "manual",
            },
          ],
        }),
      ),
      scope,
      { media_ref: mediaRef(), operation_input: { childRef: childRef("child-1") } },
    );
    expect(decision.status).toBe("already_satisfied");
  });

  it("rejects a candidate but refuses to reject confirmed history", async () => {
    const rejected = await rejectChildMediaAttribution(
      deps(
        facts({
          attributions: [
            {
              attribution_id: "attr-1",
              child_care_process_id: "child-1",
              status: "candidate",
              revision: 1,
              source: "organizer_candidate",
            },
          ],
        }),
      ),
      scope,
      { media_ref: mediaRef(), operation_input: { childRef: childRef("child-1") } },
    );
    expect(rejected.status).toBe("committed");
    if (rejected.status !== "committed") return;
    expect(rejected.records[0]?.status).toBe("rejected");

    const confirmedHistory = await rejectChildMediaAttribution(
      deps(
        facts({
          attributions: [
            {
              attribution_id: "attr-1",
              child_care_process_id: "child-1",
              status: "confirmed",
              revision: 2,
              source: "manual",
            },
          ],
        }),
      ),
      scope,
      { media_ref: mediaRef(), operation_input: { childRef: childRef("child-1") } },
    );
    expect(confirmedHistory).toEqual({
      status: "denied",
      reason_code: "illegal_attribution_transition",
    });
  });

  it("supersedes a wrong confirmation by appending both facts", async () => {
    const decision = await supersedeChildMediaAttribution(
      deps(
        facts({
          attributions: [
            {
              attribution_id: "attr-1",
              child_care_process_id: "child-1",
              status: "confirmed",
              revision: 2,
              source: "automatic_face_match",
            },
          ],
        }),
      ),
      scope,
      {
        media_ref: mediaRef(),
        operation_input: {
          fromChildRef: childRef("child-1"),
          toChildRef: childRef("child-2"),
        },
      },
    );
    expect(decision.status).toBe("committed");
    if (decision.status !== "committed") return;
    expect(decision.records.map((record) => record.status)).toEqual([
      "superseded",
      "confirmed",
    ]);
    // The correction is manual, not an inherited automatic source.
    expect(decision.records[1]?.source).toBe("manual");
    expect(decision.records[0]?.revision).toBe(3);
    expect(decision.records[1]?.revision).toBe(1);
    expect(decision.records[0]?.attributionRef).not.toBe(decision.records[1]?.attributionRef);
  });

  it("refuses a supersession that is not actually a correction", async () => {
    const base = facts({
      attributions: [
        {
          attribution_id: "attr-1",
          child_care_process_id: "child-1",
          status: "confirmed",
          revision: 2,
          source: "manual",
        },
        {
          attribution_id: "attr-2",
          child_care_process_id: "child-2",
          status: "confirmed",
          revision: 1,
          source: "manual",
        },
      ],
    });
    await expect(
      supersedeChildMediaAttribution(deps(base), scope, {
        media_ref: mediaRef(),
        operation_input: {
          fromChildRef: childRef("child-1"),
          toChildRef: childRef("child-2"),
        },
      }),
    ).resolves.toEqual({ status: "denied", reason_code: "target_child_already_confirmed" });
    await expect(
      supersedeChildMediaAttribution(deps(base), scope, {
        media_ref: mediaRef(),
        operation_input: {
          fromChildRef: childRef("child-1"),
          toChildRef: childRef("child-1"),
        },
      }),
    ).resolves.toEqual({
      status: "denied",
      reason_code: "supersession_requires_distinct_child",
    });
  });

  it("refuses every wider identity and a terminal asset", async () => {
    for (const authority of [
      caregiverAuthority({ role: "institution_admin" }),
      caregiverAuthority({ role_scope_type: "institution" }),
      caregiverAuthority({ role_scope_matches_source: false }),
      caregiverAuthority({ role_assignment_current: false }),
    ]) {
      await expect(
        confirmChildMediaAttribution(deps(facts({ authority })), scope, {
          media_ref: mediaRef(),
          operation_input: { childRef: childRef("child-1") },
        }),
      ).resolves.toEqual({ status: "denied", reason_code: "not_authorized" });
    }
    for (const lifecycle of ["discarded", "redacted"] as const) {
      await expect(
        confirmChildMediaAttribution(deps(facts({ media_lifecycle: lifecycle })), scope, {
          media_ref: mediaRef(),
          operation_input: { childRef: childRef("child-1") },
        }),
      ).resolves.toEqual({ status: "denied", reason_code: "media_not_attributable" });
    }
  });

  it("only accepts owner-issued refs for both the asset and the child", async () => {
    await expect(
      confirmChildMediaAttribution(deps(facts()), scope, {
        media_ref: MEDIA_ID,
        operation_input: { childRef: childRef("child-1") },
      }),
    ).resolves.toEqual({ status: "denied", reason_code: "target_unavailable" });
    await expect(
      confirmChildMediaAttribution(deps(facts()), scope, {
        media_ref: mediaRef(other),
        operation_input: { childRef: childRef("child-1") },
      }),
    ).resolves.toEqual({ status: "denied", reason_code: "target_unavailable" });
    await expect(
      confirmChildMediaAttribution(deps(facts()), scope, {
        media_ref: mediaRef(),
        operation_input: { childRef: "child-1" },
      }),
    ).resolves.toEqual({ status: "denied", reason_code: "child_not_eligible" });
    await expect(
      confirmChildMediaAttribution(deps(facts()), scope, {
        media_ref: mediaRef(),
        operation_input: { childRef: childRef("child-9") },
      }),
    ).resolves.toEqual({ status: "denied", reason_code: "child_not_eligible" });
    expect(mediaRef()).not.toContain(MEDIA_ID);
    expect(childRef("child-1")).not.toContain("child-1");
  });

  it("keeps the typed input closed", async () => {
    for (const invalid of [
      {},
      { childRef: "" },
      { childRef: childRef("child-1"), expectedHeads: {} },
      "not-an-object",
    ]) {
      const decision = await confirmChildMediaAttribution(deps(facts()), scope, {
        media_ref: mediaRef(),
        operation_input: invalid,
      });
      expect(decision.status).toBe("needs_input");
    }
  });
});
