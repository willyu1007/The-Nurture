import { describe, expect, it } from "vitest";
import {
  GROUP_PHOTO_RESOLUTION_PATHS,
  deriveTargetPublishBlockingReasons,
  derivePublishEligibility,
  deriveMediaRef,
  evaluateMediaDetach,
  evaluateMediaDiscard,
  type MediaEligibilityInputV1,
  type PublishEligibilityInputV1,
  type TargetEligibilityInputV1,
} from "../../src/harness/publish-eligibility.js";
import { BOARD_INTEGRITY_KEY } from "./board-fixtures.js";

const scope = { workspace_id: "ws-1", participant_id: "caregiver-1" };

const media = (
  overrides: Partial<MediaEligibilityInputV1> = {},
): MediaEligibilityInputV1 => ({
  media_asset_id: "media-1",
  media_revision: 3,
  current_media_revision: 3,
  lifecycle: "ready",
  visible_children: [
    { child_care_process_id: "child-1", attribution_status: "confirmed", clearly_visible: true },
  ],
  ...overrides,
});

const target = (
  overrides: Partial<TargetEligibilityInputV1> = {},
): TargetEligibilityInputV1 => ({
  target_key: "child-1~enrollment-1~grant-1",
  child_care_process_id: "child-1",
  enrollment_active: true,
  grant_allows: true,
  data_class_allowed: true,
  purpose_allowed: true,
  exposure_allows_child_ids: ["child-1"],
  ...overrides,
});

const derive = (overrides: Partial<PublishEligibilityInputV1> = {}) =>
  derivePublishEligibility(BOARD_INTEGRITY_KEY, scope, {
    process_state: "draft",
    media: [media()],
    targets: [target()],
    ...overrides,
  });

describe("G3-C1 publish eligibility derivation", () => {
  it("is derived every time and never exposes a stored publishable flag", () => {
    const result = derive();
    expect(result.eligible).toBe(true);
    expect(result.route).toBe("publishable");
    expect(result.blockingReasons).toEqual([]);
    expect(Object.keys(result).sort()).toEqual([
      "blockingReasons",
      "eligible",
      "mediaRefs",
      "resolutionPaths",
      "route",
      "targets",
    ]);
    expect(derive()).toEqual(result);
  });

  it("blocks on anything but a currently ready, exact original revision", () => {
    for (const lifecycle of ["preparing", "unavailable", "discarded", "redacted"] as const) {
      expect(derive({ media: [media({ lifecycle })] }).blockingReasons, lifecycle).toContain(
        "media_not_ready",
      );
    }
    expect(
      derive({ media: [media({ current_media_revision: 4 })] }).blockingReasons,
    ).toContain("media_revision_drift");
  });

  it("exposes the same ref-free target rule for transactional revalidation", () => {
    const blockedMedia = media({ lifecycle: "unavailable" });
    const blockedTarget = target({ grant_allows: false });
    const projected = derive({ media: [blockedMedia], targets: [blockedTarget] });

    expect(deriveTargetPublishBlockingReasons(blockedTarget, [blockedMedia])).toEqual(
      projected.targets[0]?.blockingReasons,
    );
  });

  it("holds a group photo until every clearly visible child is confirmed", () => {
    const unknownFace = derive({
      media: [
        media({
          visible_children: [
            {
              child_care_process_id: "child-1",
              attribution_status: "confirmed",
              clearly_visible: true,
            },
            { clearly_visible: true },
          ],
        }),
      ],
    });
    expect(unknownFace.eligible).toBe(false);
    expect(unknownFace.route).toBe("needs_review");
    expect(unknownFace.blockingReasons).toContain("unknown_visible_child");

    const candidateOnly = derive({
      media: [
        media({
          visible_children: [
            {
              child_care_process_id: "child-1",
              attribution_status: "confirmed",
              clearly_visible: true,
            },
            {
              child_care_process_id: "child-2",
              attribution_status: "candidate",
              clearly_visible: true,
            },
          ],
          },
        ),
      ],
      targets: [target({ exposure_allows_child_ids: ["child-1", "child-2"] })],
    });
    expect(candidateOnly.route).toBe("needs_review");
    expect(candidateOnly.blockingReasons).toContain("unconfirmed_visible_child");
  });

  it("ignores a child who is present but not clearly visible", () => {
    const result = derive({
      media: [
        media({
          visible_children: [
            {
              child_care_process_id: "child-1",
              attribution_status: "confirmed",
              clearly_visible: true,
            },
            { clearly_visible: false },
          ],
        }),
      ],
    });
    expect(result.eligible).toBe(true);
  });

  it("blocks a target whose audience may not see another confirmed child", () => {
    const result = derive({
      media: [
        media({
          visible_children: [
            {
              child_care_process_id: "child-1",
              attribution_status: "confirmed",
              clearly_visible: true,
            },
            {
              child_care_process_id: "child-2",
              attribution_status: "confirmed",
              clearly_visible: true,
            },
          ],
        }),
      ],
      targets: [target({ exposure_allows_child_ids: ["child-1"] })],
    });
    expect(result.eligible).toBe(false);
    expect(result.route).toBe("needs_review");
    expect(result.blockingReasons).toContain("exposure_not_allowed");
  });

  it("offers only the four allowed remedies and never a visual variant", () => {
    const blocked = derive({
      media: [media({ visible_children: [{ clearly_visible: true }] })],
    });
    expect(blocked.resolutionPaths).toEqual([...GROUP_PHOTO_RESOLUTION_PATHS]);
    const serialized = JSON.stringify(blocked);
    for (const forbidden of ["crop", "blur", "beautif", "variant", "thumbnail", "render"]) {
      expect(serialized.toLowerCase()).not.toContain(forbidden);
    }
  });

  it("reports authority failures per target without offering a correction path", () => {
    for (const [override, reason] of [
      [{ enrollment_active: false }, "enrollment_inactive"],
      [{ grant_allows: false }, "grant_not_allowed"],
      [{ data_class_allowed: false }, "data_class_not_allowed"],
      [{ purpose_allowed: false }, "purpose_not_allowed"],
    ] as const) {
      const result = derive({ targets: [target(override)] });
      expect(result.blockingReasons, reason).toContain(reason);
      expect(result.route, reason).toBe("blocked");
      expect(result.resolutionPaths, reason).toEqual([]);
    }
  });

  it("keeps one blocked family from cancelling the rest", () => {
    const result = derive({
      media: [
        media({
          visible_children: [
            {
              child_care_process_id: "child-1",
              attribution_status: "confirmed",
              clearly_visible: true,
            },
            {
              child_care_process_id: "child-2",
              attribution_status: "confirmed",
              clearly_visible: true,
            },
          ],
        }),
      ],
      targets: [
        target({
          target_key: "child-1~enrollment-1~grant-1",
          child_care_process_id: "child-1",
          exposure_allows_child_ids: ["child-1", "child-2"],
        }),
        target({
          target_key: "child-2~enrollment-2~grant-2",
          child_care_process_id: "child-2",
          grant_allows: false,
          exposure_allows_child_ids: ["child-1", "child-2"],
        }),
      ],
    });
    expect(result.targets.map((entry) => entry.eligible)).toEqual([true, false]);
    expect(result.eligible).toBe(true);
    expect(result.targets[1]?.blockingReasons).toEqual(["grant_not_allowed"]);
    expect(JSON.stringify(result.targets)).not.toContain("child-1~enrollment-1");
  });

  it("stops deriving eligibility once the process is terminal", () => {
    for (const state of ["released", "cancelled"] as const) {
      expect(derive({ process_state: state }).eligible, state).toBe(false);
    }
  });

  it("binds one ref per exact original revision", () => {
    const result = derive({
      media: [media({ media_asset_id: "media-1" }), media({ media_asset_id: "media-2" })],
      targets: [target({ exposure_allows_child_ids: ["child-1"] })],
    });
    expect(result.mediaRefs).toEqual([
      deriveMediaRef(BOARD_INTEGRITY_KEY, scope, {
        media_asset_id: "media-1",
        media_revision: 3,
      }),
      deriveMediaRef(BOARD_INTEGRITY_KEY, scope, {
        media_asset_id: "media-2",
        media_revision: 3,
      }),
    ]);
    expect(
      deriveMediaRef(BOARD_INTEGRITY_KEY, scope, {
        media_asset_id: "media-1",
        media_revision: 4,
      }),
    ).not.toBe(result.mediaRefs[0]);
    expect(JSON.stringify(result.mediaRefs)).not.toContain("media-1");
  });
});

describe("G3-C1 product delete mapped to its stage", () => {
  it("detaches one media reference from one draft only", () => {
    const decision = evaluateMediaDetach(BOARD_INTEGRITY_KEY, scope, {
      process_state: "draft",
      composition_media_ids: ["media-1", "media-2"],
      media_asset_id: "media-1",
      media_revision: 3,
    });
    expect(decision).toEqual({
      status: "detached",
      mediaRef: deriveMediaRef(BOARD_INTEGRITY_KEY, scope, {
        media_asset_id: "media-1",
        media_revision: 3,
      }),
      remainingMediaCount: 1,
    });
    expect(
      evaluateMediaDetach(BOARD_INTEGRITY_KEY, scope, {
        process_state: "draft",
        composition_media_ids: ["media-2"],
        media_asset_id: "media-1",
        media_revision: 3,
      }),
    ).toEqual({ status: "denied", reason_code: "media_not_in_composition" });
    for (const state of ["released", "cancelled"] as const) {
      expect(
        evaluateMediaDetach(BOARD_INTEGRITY_KEY, scope, {
          process_state: state,
          composition_media_ids: ["media-1"],
          media_asset_id: "media-1",
          media_revision: 3,
        }),
        state,
      ).toEqual({ status: "denied", reason_code: "process_not_editable" });
    }
  });

  it("allows a global discard only while nothing has been released", () => {
    const discardable = evaluateMediaDiscard(BOARD_INTEGRITY_KEY, scope, {
      lifecycle: "ready",
      committed_release_count: 0,
      referencing_draft_count: 2,
      media_asset_id: "media-1",
      media_revision: 3,
    });
    expect(discardable).toMatchObject({ status: "discardable", affectedDraftCount: 2 });
    expect(
      evaluateMediaDiscard(BOARD_INTEGRITY_KEY, scope, {
        lifecycle: "ready",
        committed_release_count: 1,
        referencing_draft_count: 0,
        media_asset_id: "media-1",
        media_revision: 3,
      }),
    ).toEqual({ status: "denied", reason_code: "already_released" });
    for (const lifecycle of ["discarded", "redacted"] as const) {
      expect(
        evaluateMediaDiscard(BOARD_INTEGRITY_KEY, scope, {
          lifecycle,
          committed_release_count: 0,
          referencing_draft_count: 0,
          media_asset_id: "media-1",
          media_revision: 3,
        }),
        lifecycle,
      ).toEqual({ status: "denied", reason_code: "media_already_terminal" });
    }
  });
});
