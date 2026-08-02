import { describe, expect, it } from "vitest";
import { issueBoardSealedRef } from "../../src/harness/board-projection.js";
import { issueMediaAssetTargetRef } from "../../src/harness/media-attribution.js";
import {
  PUBLISH_PROCESS_TARGET_KIND,
  issuePublicationRef,
} from "../../src/harness/publish-process.js";
import type { PublishProcessStateV1 } from "../../src/harness/publish-process.js";
import {
  PUBLICATION_SAFETY_REASONS,
  correctPublication,
  detachPublishProcessMedia,
  discardMediaAsset,
  redactPublication,
  removePublicationTargetVisibility,
  type CommittedPublicationFactV1,
  type MediaLifecycleFactsV1,
  type PublicationSafetyFactsV1,
} from "../../src/harness/publication-safety.js";
import { BOARD_INTEGRITY_KEY, caregiverAuthority } from "./board-fixtures.js";

const scope = { workspace_id: "ws-1", participant_id: "caregiver-1" };
const now = () => new Date("2026-08-03T10:00:00.000Z");
const PROCESS_KEY = "care-group-1~trigger-1";
const MEDIA_ID = "media-1";

const processRef = (forScope = scope) =>
  issueBoardSealedRef(BOARD_INTEGRITY_KEY, forScope, PUBLISH_PROCESS_TARGET_KIND, PROCESS_KEY);
const mediaRef = (forScope = scope) =>
  issueMediaAssetTargetRef(BOARD_INTEGRITY_KEY, forScope, MEDIA_ID);

const publication = (
  overrides: Partial<CommittedPublicationFactV1> = {},
): CommittedPublicationFactV1 => ({
  publication_id: "pub-1",
  target_key: "child-1~enrollment-1~grant-1",
  receipt_id: "receipt-1",
  release_revision: 4,
  visibility: "visible",
  ...overrides,
});

const safetyFacts = (
  overrides: Partial<PublicationSafetyFactsV1> = {},
): PublicationSafetyFactsV1 => ({
  authority: caregiverAuthority(),
  process_state: "released",
  publications: [publication()],
  ...overrides,
});

const safetyDeps = (value: PublicationSafetyFactsV1 | null, keys = [PROCESS_KEY]) => ({
  integrity_key: BOARD_INTEGRITY_KEY,
  now,
  reads: {
    listSafetyProcessKeys: async () => keys,
    loadPublicationSafetyFacts: async () => value,
  },
});

const mediaFacts = (
  overrides: Partial<MediaLifecycleFactsV1> = {},
): MediaLifecycleFactsV1 => ({
  authority: caregiverAuthority(),
  process_state: "draft",
  composition_media_ids: [MEDIA_ID, "media-2"],
  media_revision: 3,
  media_lifecycle: "ready",
  committed_release_count: 0,
  referencing_draft_count: 2,
  ...overrides,
});

const mediaDeps = (value: MediaLifecycleFactsV1 | null, mediaIds = [MEDIA_ID]) => ({
  integrity_key: BOARD_INTEGRITY_KEY,
  now,
  reads: {
    listSafetyProcessKeys: async () => [PROCESS_KEY],
    listMediaLifecycleAssetIds: async () => mediaIds,
    loadMediaLifecycleFacts: async () => value,
  },
});

describe("G3-D post-release safety actions", () => {
  it("appends a correction without touching the original release or Receipt", async () => {
    const decision = await correctPublication(safetyDeps(safetyFacts()), scope, {
      process_ref: processRef(),
      operation_input: { reason: "content_error", correctionText: "更正:活动是在室内进行的。" },
    });
    expect(decision.status).toBe("appended");
    if (decision.status !== "appended") return;
    const event = decision.events[0];
    expect(event?.kind).toBe("correction");
    expect(event?.reason).toBe("content_error");
    expect(event?.sourceReleaseRevision).toBe(4);
    expect(event?.preservedReceiptRef).toBeDefined();
    expect(event?.occurredAt).toBe("2026-08-03T10:00:00.000Z");
    expect(JSON.stringify(decision)).not.toContain("receipt-1");
    expect(JSON.stringify(decision)).not.toContain("pub-1");
  });

  it("never claims recall of already-read content or a sent notification", async () => {
    const decision = await redactPublication(safetyDeps(safetyFacts()), scope, {
      process_ref: processRef(),
      operation_input: { reason: "policy_requirement" },
    });
    expect(decision.status).toBe("appended");
    const serialized = JSON.stringify(decision).toLowerCase();
    for (const forbidden of ["recall", "unsend", "unread", "delivered", "notification", "erase"]) {
      expect(serialized).not.toContain(forbidden);
    }
  });

  it("removes one target's visibility and leaves the other releases alone", async () => {
    const facts = safetyFacts({
      publications: [
        publication({ publication_id: "pub-1", target_key: "t-1" }),
        publication({ publication_id: "pub-2", target_key: "t-2" }),
      ],
    });
    const decision = await removePublicationTargetVisibility(safetyDeps(facts), scope, {
      process_ref: processRef(),
      operation_input: {
        reason: "wrong_target",
        publicationRef: issuePublicationRef(BOARD_INTEGRITY_KEY, scope, "pub-2"),
      },
    });
    expect(decision.status).toBe("appended");
    if (decision.status !== "appended") return;
    expect(decision.events).toHaveLength(1);
    expect(decision.events[0]?.kind).toBe("target_removal");
  });

  it("redacts every release of the process and is idempotent afterwards", async () => {
    const decision = await redactPublication(
      safetyDeps(
        safetyFacts({
          publications: [
            publication({ publication_id: "pub-1" }),
            publication({ publication_id: "pub-2" }),
          ],
        }),
      ),
      scope,
      { process_ref: processRef(), operation_input: { reason: "family_request" } },
    );
    expect(decision.status).toBe("appended");
    if (decision.status !== "appended") return;
    expect(decision.events).toHaveLength(2);

    const repeat = await redactPublication(
      safetyDeps(
        safetyFacts({
          publications: [publication({ visibility: "redacted" })],
        }),
      ),
      scope,
      { process_ref: processRef(), operation_input: { reason: "family_request" } },
    );
    expect(repeat.status).toBe("already_satisfied");
  });

  it("has no expiry window: a safety action is legal long after the release", async () => {
    const decision = await correctPublication(
      {
        ...safetyDeps(safetyFacts()),
        // Months later; there is no five-minute or twenty-four-hour gate.
        now: () => new Date("2027-02-01T10:00:00.000Z"),
      },
      scope,
      {
        process_ref: processRef(),
        operation_input: { reason: "content_error", correctionText: "更正。" },
      },
    );
    expect(decision.status).toBe("appended");
  });

  it("keeps the reason taxonomy closed and the input free of prose fields", async () => {
    expect([...PUBLICATION_SAFETY_REASONS]).toEqual([
      "wrong_target",
      "wrong_media",
      "wrong_attribution",
      "content_error",
      "family_request",
      "policy_requirement",
    ]);
    for (const invalid of [
      {},
      { reason: "because_i_said_so" },
      { reason: "content_error" },
      { reason: "content_error", correctionText: "" },
      { reason: "content_error", correctionText: "ok", note: "extra" },
    ]) {
      const decision = await correctPublication(safetyDeps(safetyFacts()), scope, {
        process_ref: processRef(),
        operation_input: invalid,
      });
      expect(decision.status).toBe("needs_input");
    }
  });

  it("refuses a wider identity, an unknown process and a process with no release", async () => {
    await expect(
      redactPublication(
        safetyDeps(safetyFacts({ authority: caregiverAuthority({ role: "institution_admin" }) })),
        scope,
        { process_ref: processRef(), operation_input: { reason: "policy_requirement" } },
      ),
    ).resolves.toEqual({ status: "denied", reason_code: "not_authorized" });
    await expect(
      redactPublication(safetyDeps(safetyFacts(), []), scope, {
        process_ref: processRef(),
        operation_input: { reason: "policy_requirement" },
      }),
    ).resolves.toEqual({ status: "denied", reason_code: "target_unavailable" });
    await expect(
      redactPublication(safetyDeps(safetyFacts({ publications: [] })), scope, {
        process_ref: processRef(),
        operation_input: { reason: "policy_requirement" },
      }),
    ).resolves.toEqual({ status: "denied", reason_code: "no_committed_publication" });
  });
});

describe("G3-D media lifecycle capabilities", () => {
  it("detaches one media reference from one draft composition", async () => {
    const decision = await detachPublishProcessMedia(mediaDeps(mediaFacts()), scope, {
      process_ref: processRef(),
      media_ref: mediaRef(),
    });
    expect(decision).toMatchObject({ status: "detached", remainingMediaCount: 1 });
  });

  it("refuses to detach from a released or cancelled process", async () => {
    for (const state of ["released", "cancelled"] as PublishProcessStateV1[]) {
      await expect(
        detachPublishProcessMedia(mediaDeps(mediaFacts({ process_state: state })), scope, {
          process_ref: processRef(),
          media_ref: mediaRef(),
        }),
        state,
      ).resolves.toEqual({ status: "denied", reason_code: "process_not_editable" });
    }
  });

  it("allows a global discard only before any release commits", async () => {
    await expect(
      discardMediaAsset(mediaDeps(mediaFacts()), scope, { media_ref: mediaRef() }),
    ).resolves.toMatchObject({ status: "discardable", affectedDraftCount: 2 });
    await expect(
      discardMediaAsset(mediaDeps(mediaFacts({ committed_release_count: 1 })), scope, {
        media_ref: mediaRef(),
      }),
    ).resolves.toEqual({ status: "denied", reason_code: "already_released" });
  });

  it("refuses a wider identity and a ref the actor cannot resolve", async () => {
    await expect(
      discardMediaAsset(
        mediaDeps(mediaFacts({ authority: caregiverAuthority({ role_scope_type: "institution" }) })),
        scope,
        { media_ref: mediaRef() },
      ),
    ).resolves.toEqual({ status: "denied", reason_code: "not_authorized" });
    await expect(
      discardMediaAsset(mediaDeps(mediaFacts()), scope, { media_ref: MEDIA_ID }),
    ).resolves.toEqual({ status: "denied", reason_code: "target_unavailable" });
    await expect(
      discardMediaAsset(mediaDeps(mediaFacts(), []), scope, { media_ref: mediaRef() }),
    ).resolves.toEqual({ status: "denied", reason_code: "target_unavailable" });
  });
});
