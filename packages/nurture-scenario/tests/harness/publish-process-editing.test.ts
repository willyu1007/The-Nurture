import { describe, expect, it } from "vitest";
import { issueBoardSealedRef } from "../../src/harness/board-projection.js";
import {
  PUBLISH_PROCESS_TARGET_KIND,
  type PublishProcessStateV1,
} from "../../src/harness/publish-process.js";
import {
  DEFAULT_EDIT_HOLD_TTL_SECONDS,
  acquirePublishEditHold,
  cancelPublishProcess,
  parseSavePublishProcessDraftInputV1,
  releasePublishEditHold,
  renewPublishEditHold,
  requiresOnlineEditHold,
  savePublishProcessDraft,
  computeDraftContentDigest,
  type PublishCancelFactsV1,
  type PublishDraftFactsV1,
  type PublishEditHoldFactsV1,
} from "../../src/harness/publish-process-editing.js";
import { BOARD_INTEGRITY_KEY, caregiverAuthority } from "./board-fixtures.js";

const scope = { workspace_id: "ws-1", participant_id: "caregiver-1" };
const other = { workspace_id: "ws-1", participant_id: "caregiver-2" };
const now = () => new Date("2026-08-01T09:00:00.000Z");
const PROCESS_KEY = "care-group-1~trigger-1";

const processRef = (forScope = scope) =>
  issueBoardSealedRef(BOARD_INTEGRITY_KEY, forScope, PUBLISH_PROCESS_TARGET_KIND, PROCESS_KEY);

const holdFacts = (
  overrides: Partial<PublishEditHoldFactsV1> = {},
): PublishEditHoldFactsV1 => ({
  process_state: "draft",
  authority: caregiverAuthority(),
  ...overrides,
});

const draftFacts = (overrides: Partial<PublishDraftFactsV1> = {}): PublishDraftFactsV1 => ({
  ...holdFacts(),
  current_revision: 4,
  known_source_refs: ["source-ref-1"],
  ...overrides,
});

const cancelFacts = (overrides: Partial<PublishCancelFactsV1> = {}): PublishCancelFactsV1 => ({
  ...holdFacts(),
  committed_release_count: 0,
  ...overrides,
});

const holdDeps = (facts: PublishEditHoldFactsV1 | null, keys = [PROCESS_KEY]) => ({
  integrity_key: BOARD_INTEGRITY_KEY,
  now,
  reads: {
    listEditableProcessKeys: async () => keys,
    loadEditHoldFacts: async () => facts,
  },
});

const draftDeps = (facts: PublishDraftFactsV1 | null, keys = [PROCESS_KEY]) => ({
  integrity_key: BOARD_INTEGRITY_KEY,
  now,
  reads: {
    listEditableProcessKeys: async () => keys,
    loadEditHoldFacts: async () => facts,
    loadDraftFacts: async () => facts,
  },
});

const cancelDeps = (facts: PublishCancelFactsV1 | null, keys = [PROCESS_KEY]) => ({
  integrity_key: BOARD_INTEGRITY_KEY,
  now,
  reads: {
    listEditableProcessKeys: async () => keys,
    loadEditHoldFacts: async () => facts,
    loadCancelFacts: async () => facts,
  },
});

const liveHold = (participantId: string) => ({
  holder_participant_id: participantId,
  holder_label: "Syn Colleague",
  expires_at: "2026-08-01T09:01:00.000Z",
  hold_version: 1,
});

const expiredHold = (participantId: string) => ({
  holder_participant_id: participantId,
  holder_label: "Syn Colleague",
  expires_at: "2026-08-01T08:59:00.000Z",
  hold_version: 1,
});

describe("G3-B1 publish edit hold", () => {
  it("grants one short renewable hold to an exact-CareGroup class teacher", async () => {
    const decision = await acquirePublishEditHold(holdDeps(holdFacts()), scope, {
      process_ref: processRef(),
    });
    expect(decision.status).toBe("granted");
    if (decision.status !== "granted") return;
    expect(decision.hold.ttlSeconds).toBe(DEFAULT_EDIT_HOLD_TTL_SECONDS);
    expect(decision.hold.expiresAt).toBe("2026-08-01T09:02:00.000Z");
  });

  it("lets a colleague keep reading and waiting instead of editing concurrently", async () => {
    const decision = await acquirePublishEditHold(
      holdDeps(holdFacts({ current_hold: liveHold("caregiver-9") })),
      scope,
      { process_ref: processRef() },
    );
    expect(decision).toEqual({
      status: "held_by_other",
      holderLabel: "Syn Colleague",
      expiresAt: "2026-08-01T09:01:00.000Z",
    });
  });

  it("frees the card once a hold expires so shared responsibility still works", async () => {
    const decision = await acquirePublishEditHold(
      holdDeps(holdFacts({ current_hold: expiredHold("caregiver-9") })),
      scope,
      { process_ref: processRef() },
    );
    expect(decision.status).toBe("granted");
  });

  it("is never authority: a lapsed class role is refused even with a live hold", async () => {
    for (const wider of [
      caregiverAuthority({ role: "institution_admin" }),
      caregiverAuthority({ role_scope_type: "institution" }),
      caregiverAuthority({ role_scope_matches_source: false }),
      caregiverAuthority({ role_assignment_current: false }),
    ]) {
      await expect(
        acquirePublishEditHold(
          holdDeps(holdFacts({ authority: wider, current_hold: liveHold("caregiver-1") })),
          scope,
          { process_ref: processRef() },
        ),
      ).resolves.toEqual({ status: "denied", reason_code: "not_authorized" });
    }
  });

  it("refuses a hold on a process that is no longer editable", async () => {
    for (const state of ["released", "cancelled"] as PublishProcessStateV1[]) {
      await expect(
        acquirePublishEditHold(holdDeps(holdFacts({ process_state: state })), scope, {
          process_ref: processRef(),
        }),
      ).resolves.toEqual({ status: "denied", reason_code: "process_not_editable" });
    }
  });

  it("renews only a live hold held by this actor", async () => {
    await expect(
      renewPublishEditHold(
        holdDeps(holdFacts({ current_hold: liveHold("caregiver-1") })),
        scope,
        { process_ref: processRef() },
      ),
    ).resolves.toMatchObject({ status: "granted" });
    await expect(
      renewPublishEditHold(
        holdDeps(holdFacts({ current_hold: expiredHold("caregiver-1") })),
        scope,
        { process_ref: processRef() },
      ),
    ).resolves.toEqual({ status: "denied", reason_code: "hold_expired" });
    await expect(
      renewPublishEditHold(
        holdDeps(holdFacts({ current_hold: liveHold("caregiver-9") })),
        scope,
        { process_ref: processRef() },
      ),
    ).resolves.toMatchObject({ status: "held_by_other" });
  });

  it("treats releasing an absent or expired hold as a no-op", async () => {
    await expect(
      releasePublishEditHold(holdDeps(holdFacts()), scope, { process_ref: processRef() }),
    ).resolves.toEqual({ status: "released" });
    await expect(
      releasePublishEditHold(
        holdDeps(holdFacts({ current_hold: expiredHold("caregiver-9") })),
        scope,
        { process_ref: processRef() },
      ),
    ).resolves.toEqual({ status: "released" });
  });

  it("resolves a sealed process ref only for the actor who still has access", async () => {
    await expect(
      acquirePublishEditHold(holdDeps(holdFacts()), scope, { process_ref: processRef(other) }),
    ).resolves.toEqual({ status: "denied", reason_code: "target_unavailable" });
    await expect(
      acquirePublishEditHold(holdDeps(holdFacts(), []), scope, { process_ref: processRef() }),
    ).resolves.toEqual({ status: "denied", reason_code: "target_unavailable" });
    expect(processRef()).not.toContain("care-group-1");
    expect(processRef()).not.toContain("trigger-1");
  });
});

describe("G3-B1 draft autosave", () => {
  const input = { title: "户外活动 · 3 张照片", segments: [{ text: "原文" }] };
  const save = (
    facts: PublishDraftFactsV1 | null,
    overrides: Partial<{
      expected_draft_revision: number;
      operation_input: unknown;
      command_request_id: string;
    }> = {},
  ) =>
    savePublishProcessDraft(draftDeps(facts), scope, {
      process_ref: processRef(),
      command_request_id: "command:save-1",
      expected_draft_revision: 4,
      operation_input: input,
      ...overrides,
    });

  it("keeps concurrency metadata out of the typed business input", () => {
    expect(parseSavePublishProcessDraftInputV1(input)).toEqual({ status: "ok", input });
    for (const invalid of [
      { ...input, expectedHeads: { draft: 4 } },
      { ...input, targetOptionRef: "x" },
      { ...input, commandIdentity: "x" },
      { title: "", segments: [] },
      { title: "ok", segments: [{ text: "" }] },
      { title: "ok", segments: [{ text: "ok", role: "caregiver" }] },
      "not-an-object",
    ]) {
      expect(parseSavePublishProcessDraftInputV1(invalid).status).toBe("invalid");
    }
  });

  it("advances the revision on an exact head match", async () => {
    const decision = await save(draftFacts());
    expect(decision.status).toBe("saved");
    if (decision.status !== "saved") return;
    expect(decision.result.revision).toBe(5);
    expect(decision.result.savedAt).toBe("2026-08-01T09:00:00.000Z");
    expect(decision.result.contentDigest).toBe(
      computeDraftContentDigest(BOARD_INTEGRITY_KEY, input),
    );
  });

  it("conflicts on revision drift instead of overwriting a colleague", async () => {
    const decision = await save(draftFacts({ current_revision: 6 }));
    expect(decision).toEqual({ status: "conflict", currentRevision: 6 });
  });

  it("replays an identical command and conflicts when the same identity changed payload", async () => {
    const replayed = {
      revision: 5,
      content_digest: computeDraftContentDigest(BOARD_INTEGRITY_KEY, input),
      saved_at: "2026-08-01T08:59:00.000Z",
    };
    const decision = await save(
      draftFacts({ current_revision: 5, replayed_revision: replayed }),
    );
    expect(decision.status).toBe("replayed");
    if (decision.status !== "replayed") return;
    expect(decision.result.revision).toBe(5);
    expect(decision.result.savedAt).toBe("2026-08-01T08:59:00.000Z");

    const drifted = await save(
      draftFacts({ current_revision: 5, replayed_revision: replayed }),
      { operation_input: { ...input, title: "另一个标题" } },
    );
    expect(drifted).toEqual({ status: "conflict", currentRevision: 5 });
  });

  it("requires an online hold once the content is queued and refuses a colleague's hold", async () => {
    expect(requiresOnlineEditHold("pending_release")).toBe(true);
    expect(requiresOnlineEditHold("draft")).toBe(false);
    await expect(save(draftFacts({ process_state: "pending_release" }))).resolves.toEqual({
      status: "denied",
      reason_code: "edit_hold_required",
    });
    await expect(
      save(
        draftFacts({
          process_state: "pending_release",
          current_hold: liveHold("caregiver-1"),
        }),
      ),
    ).resolves.toMatchObject({ status: "saved" });
    await expect(
      save(draftFacts({ current_hold: liveHold("caregiver-9") })),
    ).resolves.toMatchObject({ status: "held_by_other" });
  });

  it("never edits a released or cancelled process in place", async () => {
    for (const state of ["released", "cancelled"] as PublishProcessStateV1[]) {
      await expect(save(draftFacts({ process_state: state }))).resolves.toEqual({
        status: "denied",
        reason_code: "process_not_editable",
      });
    }
  });

  it("refuses a segment that claims provenance the owner never issued", async () => {
    await expect(
      save(draftFacts(), {
        operation_input: {
          title: "标题",
          segments: [{ text: "原文", sourceRef: "source-ref-unknown" }],
        },
      }),
    ).resolves.toEqual({ status: "denied", reason_code: "unknown_source_ref" });
    await expect(
      save(draftFacts(), {
        operation_input: {
          title: "标题",
          segments: [{ text: "原文", sourceRef: "source-ref-1" }],
        },
      }),
    ).resolves.toMatchObject({ status: "saved" });
  });

  it("refuses a malformed expected revision before reading anything", async () => {
    for (const expected of [-1, 1.5]) {
      await expect(save(draftFacts(), { expected_draft_revision: expected })).resolves.toEqual({
        status: "denied",
        reason_code: "invalid_expected_revision",
      });
    }
  });

  it("lets the first save of a process state that it expects revision zero", async () => {
    // A process with nothing saved reports `current_revision: 0`. Rejecting 0
    // as malformed left it with no input it could ever satisfy — the earlier
    // expectation here treated that dead end as the contract.
    const result = await save(draftFacts({ current_revision: 0 }), {
      expected_draft_revision: 0,
    });
    expect(result.status).toBe("saved");
    if (result.status !== "saved") return;
    expect(result.result.revision).toBe(1);
  });
});

describe("G3-B1 pre-release cancel", () => {
  const cancel = (facts: PublishCancelFactsV1 | null) =>
    cancelPublishProcess(cancelDeps(facts), scope, { process_ref: processRef() });

  it("lets any current class teacher cancel before a single target commits", async () => {
    for (const state of ["draft", "needs_review", "pending_release"] as PublishProcessStateV1[]) {
      const decision = await cancel(cancelFacts({ process_state: state }));
      expect(decision.status, state).toBe("cancelled");
    }
  });

  it("refuses to cancel once any target has committed", async () => {
    await expect(cancel(cancelFacts({ committed_release_count: 1 }))).resolves.toEqual({
      status: "denied",
      reason_code: "already_released",
    });
    await expect(
      cancel(cancelFacts({ process_state: "released", committed_release_count: 3 })),
    ).resolves.toEqual({ status: "denied", reason_code: "already_released" });
  });

  it("is idempotent and still refuses a wider identity", async () => {
    await expect(cancel(cancelFacts({ process_state: "cancelled" }))).resolves.toEqual({
      status: "already_satisfied",
      processRef: processRef(),
    });
    await expect(
      cancel(cancelFacts({ authority: caregiverAuthority({ role: "institution_admin" }) })),
    ).resolves.toEqual({ status: "denied", reason_code: "not_authorized" });
  });
});
