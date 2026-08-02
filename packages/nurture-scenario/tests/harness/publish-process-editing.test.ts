import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  NurtureDeterministicRollback,
  type NurtureCommandExecutionContext,
  type NurtureCommandTransaction,
} from "../../src/domain/commands/command-kernel.js";
import {
  NurtureInteractionContextService,
  type NurtureInteractionContextRepository,
} from "../../src/domain/interactions/interaction-context.js";
import type { NurturePublishProcessCancelFacts } from "../../src/domain/institution/publish-process-transaction.js";
import { issueBoardOpaqueRef, issueBoardSealedRef } from "../../src/harness/board-projection.js";
import {
  PUBLISH_PROCESS_TARGET_KIND,
  type PublishProcessStateV1,
} from "../../src/harness/publish-process.js";
import {
  CANCEL_PUBLISH_PROCESS_CAPABILITY,
  DEFAULT_EDIT_HOLD_TTL_SECONDS,
  acquirePublishEditHold,
  cancelPublishProcess,
  createCancelPublishProcessSpec,
  parseCancelPublishProcessInputV1,
  parseSavePublishProcessDraftInputV1,
  preparePublishProcessCancel,
  releasePublishEditHold,
  renewPublishEditHold,
  requiresOnlineEditHold,
  savePublishProcessDraft,
  computeDraftContentDigest,
  type CancelPublishProcessCommandV1,
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
  process_version: 3,
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

  it("is idempotent from the owner's recorded instant, never an invented one", async () => {
    const repeated = await cancel(
      cancelFacts({ process_state: "cancelled", cancelled_at: "2026-08-01T08:45:00.000Z" }),
    );
    const fresh = await cancel(cancelFacts());
    if (repeated.status !== "already_satisfied" || fresh.status !== "cancelled") {
      throw new Error(`unexpected cancel decisions: ${repeated.status}/${fresh.status}`);
    }
    // The repeat answers the same process and the same audit handle, at the
    // instant the owner stored rather than at "now".
    expect(repeated.processRef).toBe(processRef());
    expect(repeated.auditRef).toBe(fresh.auditRef);
    expect(repeated.cancelledAt).toBe("2026-08-01T08:45:00.000Z");
    expect(fresh.cancelledAt).toBe(now().toISOString());

    // A cancelled process the owner cannot date is refused rather than dated
    // from the clock, which would report a cancel at a moment it did not happen.
    await expect(cancel(cancelFacts({ process_state: "cancelled" }))).resolves.toEqual({
      status: "denied",
      reason_code: "cancel_evidence_unavailable",
    });
  });

  it("still refuses a wider identity and an unknown owner state", async () => {
    await expect(
      cancel(cancelFacts({ authority: caregiverAuthority({ role: "institution_admin" }) })),
    ).resolves.toEqual({ status: "denied", reason_code: "not_authorized" });
    await expect(
      cancel(cancelFacts({ process_state: "archived" as never })),
    ).resolves.toEqual({ status: "denied", reason_code: "illegal_transition" });
  });
});

// ---------------------------------------------------------------------------
// The cancel command: prepare freezes the owner head, execute re-reads the same
// owner inside the write transaction and writes under that head.

const commandContext: NurtureCommandExecutionContext = {
  workspace_id: scope.workspace_id,
  business_actor_ref: scope.participant_id,
};

const OWNER_CANCELLED_AT = "2026-08-01T09:07:11.000Z";

const ownerProcessRef = {
  schema_version: 1 as const,
  namespace: "nurture",
  object_type: "publish_process",
  object_id: "publish-process-1",
  version: 3,
};

const contexts = (): NurtureInteractionContextService =>
  new NurtureInteractionContextService({
    create: async (input: unknown) =>
      ({
        ...(input as object),
        id: randomUUID(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }) as never,
    findByTokenHash: async () => null,
    findLatestActiveByConversationHash: async () => null,
    consume: async () => null,
    revoke: async () => null,
  } satisfies NurtureInteractionContextRepository);

const ownerCancelFacts = (
  overrides: Partial<NurturePublishProcessCancelFacts> = {},
): NurturePublishProcessCancelFacts => ({
  authority: caregiverAuthority(),
  publish_process_ref: ownerProcessRef,
  process_state: "draft",
  process_version: 3,
  committed_release_count: 0,
  ...overrides,
});

const cancelTransaction = (
  facts: NurturePublishProcessCancelFacts | null = ownerCancelFacts(),
  applied: { calls: Array<{ expected_process_version: number; cancelled_at: string }> } = {
    calls: [],
  },
): NurtureCommandTransaction =>
  ({
    publishProcess: {
      loadPublishProcessCancelFacts: async () => facts,
      applyPublishProcessCancel: async (input: {
        expected_process_version: number;
        cancelled_at: string;
      }) => {
        applied.calls.push({
          expected_process_version: input.expected_process_version,
          cancelled_at: input.cancelled_at,
        });
        // The owner answers with the instant it stored, which is not the one
        // the command computed.
        return { publish_process_ref: ownerProcessRef, cancelled_at: OWNER_CANCELLED_AT };
      },
    },
  }) as unknown as NurtureCommandTransaction;

/**
 * A clock that moves on every read. A fixed one would make "the result carries
 * the owner's instant" indistinguishable from "the result carries this
 * process's instant" — they would simply be equal.
 */
const movingClock = (startMs = Date.parse("2026-08-01T09:00:00.000Z")) => {
  let current = startMs;
  return () => new Date((current += 1_000));
};

const cancelCommand = (
  overrides: Partial<CancelPublishProcessCommandV1> = {},
): CancelPublishProcessCommandV1 => ({
  process_key: PROCESS_KEY,
  expected_process_version: 3,
  ...overrides,
});

describe("cancel_publish_process prepare", () => {
  const prepareDeps = (facts: PublishCancelFactsV1 | null, keys = [PROCESS_KEY]) => ({
    ...cancelDeps(facts, keys),
    contexts: contexts(),
    create_command_id: () => "command:cancel-1",
  });

  it("accepts only the frozen empty typed input", () => {
    expect(parseCancelPublishProcessInputV1(undefined).status).toBe("ok");
    expect(parseCancelPublishProcessInputV1({}).status).toBe("ok");
    for (const invalid of [{ processRef: "x" }, [], "", 0, null]) {
      expect(parseCancelPublishProcessInputV1(invalid).status).toBe("invalid");
    }
  });

  it("freezes the owner head and previews the effect it actually found", async () => {
    const ready = await preparePublishProcessCancel(prepareDeps(cancelFacts()), {
      ...scope,
      surface: "board",
      target_option_ref: processRef(),
    });
    expect(ready).toMatchObject({
      status: "ready_to_confirm",
      command_request_id: "command:cancel-1",
      preview: { effect: "cancel_publish_process", state: "draft" },
    });

    // An already-cancelled process still prepares — the repeat is legal — but
    // it is not presented as a fresh cancel.
    const repeat = await preparePublishProcessCancel(
      prepareDeps(
        cancelFacts({ process_state: "cancelled", cancelled_at: OWNER_CANCELLED_AT }),
      ),
      { ...scope, surface: "board", target_option_ref: processRef() },
    );
    expect(repeat).toMatchObject({
      status: "ready_to_confirm",
      preview: { effect: "already_cancelled", state: "cancelled" },
    });
  });

  it("refuses a ref the owner would not accept a cancel for", async () => {
    for (const badRef of [PROCESS_KEY, processRef(other)]) {
      await expect(
        preparePublishProcessCancel(prepareDeps(cancelFacts()), {
          ...scope,
          surface: "board",
          target_option_ref: badRef,
        }),
      ).resolves.toEqual({ status: "denied", reason_code: "target_unavailable" });
    }
    await expect(
      preparePublishProcessCancel(prepareDeps(cancelFacts()), {
        ...scope,
        surface: "board",
        target_option_ref: processRef(),
        operation_input: { processRef: "raw" },
      }),
    ).resolves.toEqual({ status: "needs_input", fields: ["operation_input"] });
    await expect(
      preparePublishProcessCancel(prepareDeps(cancelFacts()), { ...scope, surface: "board" }),
    ).resolves.toEqual({ status: "needs_input", fields: ["target"] });
    await expect(
      preparePublishProcessCancel(
        prepareDeps(cancelFacts({ committed_release_count: 1 })),
        { ...scope, surface: "board", target_option_ref: processRef() },
      ),
    ).resolves.toEqual({ status: "denied", reason_code: "already_released" });
  });
});

describe("cancel_publish_process command", () => {
  const spec = (now = movingClock()) =>
    createCancelPublishProcessSpec({ integrity_key: BOARD_INTEGRITY_KEY, now });

  it("fails closed without the publish-process owner port", async () => {
    await expect(
      spec().checkPreconditions({} as NurtureCommandTransaction, cancelCommand(), commandContext),
    ).resolves.toEqual({
      status: "invalid",
      reason_code: "publish_process_port_unavailable",
    });
  });

  it("re-runs the same cancel rule against the owner read inside the write", async () => {
    await expect(
      spec().checkPreconditions(cancelTransaction(), cancelCommand(), commandContext),
    ).resolves.toEqual({ status: "ready" });
    await expect(
      spec().checkPreconditions(
        cancelTransaction(
          ownerCancelFacts({ authority: caregiverAuthority({ role: "institution_admin" }) }),
        ),
        cancelCommand(),
        commandContext,
      ),
    ).resolves.toEqual({ status: "blocked", reason_code: "not_authorized" });
    await expect(
      spec().checkPreconditions(
        cancelTransaction(ownerCancelFacts({ committed_release_count: 1 })),
        cancelCommand(),
        commandContext,
      ),
    ).resolves.toEqual({ status: "blocked", reason_code: "already_released" });
    await expect(
      spec().checkPreconditions(cancelTransaction(null), cancelCommand(), commandContext),
    ).resolves.toEqual({ status: "blocked", reason_code: "target_unavailable" });
  });

  it("conflicts on a head the owner has moved, and never writes against it", async () => {
    const applied = { calls: [] as Array<{ expected_process_version: number; cancelled_at: string }> };
    await expect(
      spec().checkPreconditions(
        cancelTransaction(ownerCancelFacts({ process_version: 9 }), applied),
        cancelCommand(),
        commandContext,
      ),
    ).resolves.toEqual({ status: "conflict", reason_code: "stale_confirmation" });
    await expect(
      spec().apply(
        cancelTransaction(ownerCancelFacts({ process_version: 9 }), applied),
        cancelCommand(),
        commandContext,
      ),
    ).rejects.toThrow(NurtureDeterministicRollback);
    expect(applied.calls).toEqual([]);
  });

  it("answers an already-cancelled process from the ref the owner just returned", async () => {
    const decision = await spec().checkPreconditions(
      cancelTransaction(
        ownerCancelFacts({
          process_state: "cancelled",
          // The head has necessarily moved past what prepare froze.
          process_version: 4,
          cancelled_at: OWNER_CANCELLED_AT,
        }),
      ),
      cancelCommand(),
      commandContext,
    );
    expect(decision).toEqual({
      status: "already_satisfied",
      output_refs: [ownerProcessRef],
      result_schema_version: 1,
      committed_result: {
        processRef: processRef(),
        cancelledAt: OWNER_CANCELLED_AT,
        auditRef: issueBoardOpaqueRef(
          BOARD_INTEGRITY_KEY,
          scope,
          "publish_cancel",
          PROCESS_KEY,
        ),
      },
    });
  });

  it("writes under the frozen head and reports the instant the owner stored", async () => {
    const applied = { calls: [] as Array<{ expected_process_version: number; cancelled_at: string }> };
    const clock = movingClock();
    const result = await spec(clock).apply(
      cancelTransaction(ownerCancelFacts(), applied),
      cancelCommand(),
      commandContext,
    );
    expect(applied.calls).toHaveLength(1);
    expect(applied.calls[0]?.expected_process_version).toBe(3);
    expect(result).toEqual({
      output_refs: [ownerProcessRef],
      result_schema_version: 1,
      committed_result: {
        processRef: processRef(),
        cancelledAt: OWNER_CANCELLED_AT,
        auditRef: issueBoardOpaqueRef(
          BOARD_INTEGRITY_KEY,
          scope,
          "publish_cancel",
          PROCESS_KEY,
        ),
      },
    });
    // The clock this command carries kept moving, so the committed instant
    // being the owner's is an observable fact rather than a coincidence.
    expect(applied.calls[0]?.cancelled_at).not.toBe(OWNER_CANCELLED_AT);
  });

  it("keeps its own command identity and result-bearing scope", () => {
    const created = spec();
    expect(created.command_key).toBe(CANCEL_PUBLISH_PROCESS_CAPABILITY.key);
    expect(created.command_scope).toBe("publish_process_cancel");
    expect(created.canonicalize(cancelCommand())).toEqual({
      process_key: PROCESS_KEY,
      expected_process_version: 3,
    });
    expect(created.canonicalize(cancelCommand())).not.toEqual(
      created.canonicalize(cancelCommand({ expected_process_version: 4 })),
    );
  });
});
