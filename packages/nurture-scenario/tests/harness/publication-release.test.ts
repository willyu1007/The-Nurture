import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import type { FamilyGrowthPreparedReleaseEmissionV1 } from "../../src/domain/family-growth/emission.js";
import {
  NurtureInteractionContextService,
  type NurtureInteractionContextRepository,
} from "../../src/domain/interactions/interaction-context.js";
import { issueBoardSealedRef } from "../../src/harness/board-projection.js";
import { PUBLISH_PROCESS_TARGET_KIND } from "../../src/harness/publish-process.js";
import type { PublishProcessStateV1 } from "../../src/harness/publish-process.js";
import type { ResolvedPublishScheduleV1 } from "../../src/harness/publish-schedule.js";
import {
  derivePartialReleaseFollowUp,
  prepareReleasePublishProcess,
  releasePublishProcess,
  type CommitTargetReleaseResultV1,
  type ReleaseFactsV1,
  type ReleaseTargetFactsV1,
} from "../../src/harness/publication-release.js";
import { BOARD_INTEGRITY_KEY, caregiverAuthority } from "./board-fixtures.js";

const scope = { workspace_id: "ws-1", participant_id: "caregiver-1" };
const PROCESS_KEY = "care-group-1~trigger-1";
const processRef = (forScope = scope) =>
  issueBoardSealedRef(BOARD_INTEGRITY_KEY, forScope, PUBLISH_PROCESS_TARGET_KIND, PROCESS_KEY);

const schedule: ResolvedPublishScheduleV1 = {
  scheduledAt: "2026-08-01T09:00:00.000Z",
  notAfter: "2026-08-01T11:00:00.000Z",
  timeZone: "Asia/Shanghai",
  policyRef: "syn-publication-policy-1",
  policyHead: 5,
  policyVersion: 2,
  resolvedAt: "2026-08-01T02:00:00.000Z",
};

const target = (
  overrides: Partial<ReleaseTargetFactsV1> = {},
): ReleaseTargetFactsV1 => ({
  target_key: "child-1~enrollment-1~grant-1",
  child_care_process_id: "child-1",
  enrollment_active: true,
  grant_allows: true,
  data_class_allowed: true,
  purpose_allowed: true,
  exposure_allows_child_ids: ["child-1", "child-2", "child-3"],
  ...overrides,
});

const media = () => ({
  media_asset_id: "media-1",
  media_revision: 3,
  current_media_revision: 3,
  lifecycle: "ready" as const,
  visible_children: [
    {
      child_care_process_id: "child-1",
      attribution_status: "confirmed" as const,
      clearly_visible: true,
    },
  ],
});

const facts = (overrides: Partial<ReleaseFactsV1> = {}): ReleaseFactsV1 => ({
  authority: caregiverAuthority(),
  authorizing_role_current: true,
  process_state: "pending_release",
  current_revision: 4,
  has_unsaved_revision: false,
  edit_hold_active: false,
  schedule,
  current_policy: {
    policy_ref: schedule.policyRef,
    policy_head: schedule.policyHead,
    policy_version: schedule.policyVersion,
  },
  receipt_evidence_available: true,
  media: [media()],
  targets: [target()],
  ...overrides,
});

const deps = (
  value: ReleaseFactsV1 | null,
  commit: (input: { target_key: string; revision: number }) => CommitTargetReleaseResultV1 = (
    input,
  ) => ({
    status: "committed",
    publication_ref: `pub-${input.target_key}`,
    receipt_ref: `receipt-${input.target_key}`,
  }),
  now = () => new Date("2026-08-01T09:30:00.000Z"),
) => {
  const commits: Array<{
    target_key: string;
    revision: number;
    command_request_id: string;
    trigger: "immediate" | "scheduler";
  }> = [];
  return {
    integrity_key: BOARD_INTEGRITY_KEY,
    now,
    commits,
    reads: {
      listReleasableProcessKeys: async () => [PROCESS_KEY],
      loadReleaseFacts: async () => value,
      commitTargetRelease: async (input: {
        target_key: string;
        revision: number;
        command_request_id: string;
        trigger: "immediate" | "scheduler";
      }) => {
        commits.push(input);
        return commit(input);
      },
    },
  };
};

const release = (
  value: ReleaseFactsV1 | null,
  commit?: (input: { target_key: string; revision: number }) => CommitTargetReleaseResultV1,
  trigger: "immediate" | "scheduler" = "immediate",
  now?: () => Date,
) => {
  const dependencies = deps(value, commit, now);
  return {
    dependencies,
    run: () =>
      releasePublishProcess(dependencies, scope, {
        process_ref: processRef(),
        command_request_id: "command:release-1",
        trigger,
      }),
  };
};

describe("G3-D release loop", () => {
  it("commits one release per target and freezes the revision on the first commit", async () => {
    const { dependencies, run } = release(
      facts({
        targets: [
          target({ target_key: "t-1", child_care_process_id: "child-1" }),
          target({ target_key: "t-2", child_care_process_id: "child-1" }),
        ],
      }),
    );
    const decision = await run();
    expect(decision.status).toBe("released");
    if (decision.status === "denied") return;
    expect(decision.processState).toBe("released");
    expect(decision.frozenRevision).toBe(4);
    expect(decision.summary).toEqual({
      total: 2,
      committed: 2,
      rejected: 0,
      outcomeUnknown: 0,
    });
    expect(dependencies.commits.map((entry) => entry.revision)).toEqual([4, 4]);
    // Every target got its own publication and its own Receipt.
    expect(new Set(decision.results.map((result) => result.publicationRef)).size).toBe(2);
    expect(new Set(decision.results.map((result) => result.receiptRef)).size).toBe(2);
    expect(JSON.stringify(decision)).not.toContain("t-1");
  });

  it("never rolls back a committed family because another one failed", async () => {
    const { dependencies, run } = release(
      facts({
        targets: [
          target({ target_key: "t-1" }),
          target({ target_key: "t-2", grant_allows: false }),
          target({ target_key: "t-3" }),
        ],
      }),
    );
    const decision = await run();
    expect(decision.status).toBe("released");
    if (decision.status === "denied") return;
    expect(decision.summary).toEqual({
      total: 3,
      committed: 2,
      rejected: 1,
      outcomeUnknown: 0,
    });
    expect(decision.results[1]?.outcome).toBe("rejected");
    expect(decision.results[1]?.blockingReasons).toContain("grant_not_allowed");
    // The blocked family was never even attempted at the commit port.
    expect(dependencies.commits.map((entry) => entry.target_key)).toEqual(["t-1", "t-3"]);
  });

  it("keeps the process queued when no target commits", async () => {
    const { run } = release(
      facts({ targets: [target({ target_key: "t-1", enrollment_active: false })] }),
    );
    const decision = await run();
    expect(decision.status).toBe("still_pending");
    if (decision.status === "denied") return;
    expect(decision.processState).toBe("pending_release");
    expect(decision).not.toHaveProperty("frozenRevision");
    expect(decision.summary.committed).toBe(0);
  });

  it("replays an already-committed target instead of publishing it twice", async () => {
    const { dependencies, run } = release(
      facts({
        process_state: "released",
        frozen_revision: 4,
        current_revision: 7,
        targets: [
          target({
            target_key: "t-1",
            already_committed: { publication_ref: "pub-1", receipt_ref: "receipt-1" },
          }),
          target({ target_key: "t-2" }),
        ],
      }),
    );
    const decision = await run();
    expect(decision.status).toBe("released");
    if (decision.status === "denied") return;
    expect(decision.results[0]?.outcome).toBe("already_committed");
    expect(dependencies.commits.map((entry) => entry.target_key)).toEqual(["t-2"]);
    // A released process retries against the frozen revision, not the newer one.
    expect(dependencies.commits[0]?.revision).toBe(4);
    expect(decision.frozenRevision).toBe(4);
  });

  it("separates a transient outcome-unknown from an authority rejection", async () => {
    const { run } = release(
      facts({
        targets: [
          target({ target_key: "t-1" }),
          target({ target_key: "t-2" }),
          target({ target_key: "t-3" }),
        ],
      }),
      (input) =>
        input.target_key === "t-2"
          ? { status: "outcome_unknown" }
          : input.target_key === "t-3"
            ? { status: "rejected", reason_code: "owner_rejected" }
            : {
                status: "committed",
                publication_ref: "pub-1",
                receipt_ref: "receipt-1",
              },
    );
    const decision = await run();
    expect(decision.status).toBe("released");
    if (decision.status === "denied") return;
    expect(decision.summary).toEqual({
      total: 3,
      committed: 1,
      rejected: 1,
      outcomeUnknown: 1,
    });
    const followUp = derivePartialReleaseFollowUp(decision);
    expect(followUp.reconcileTargets).toHaveLength(1);
    expect(followUp.retryableTargets).toHaveLength(1);
    // The shared revision is frozen the moment one family received it.
    expect(followUp.sharedRevisionEditable).toBe(false);
    expect(followUp.requiresNewProcessForContentChange).toBe(true);
  });

  it("uses the same command identity for every target of one attempt", async () => {
    const { dependencies, run } = release(
      facts({ targets: [target({ target_key: "t-1" }), target({ target_key: "t-2" })] }),
    );
    await run();
    expect(dependencies.commits.map((entry) => entry.command_request_id)).toEqual([
      "command:release-1",
      "command:release-1",
    ]);
  });

  it("refuses to publish anything that is not a saved, eligible, queued revision", async () => {
    for (const [override, reason] of [
      [{ process_state: "needs_review" as PublishProcessStateV1 }, "needs_review"],
      [{ process_state: "draft" as PublishProcessStateV1 }, "process_not_queued"],
      [{ process_state: "cancelled" as PublishProcessStateV1 }, "process_cancelled"],
      [{ edit_hold_active: true }, "edit_hold_active"],
      [{ has_unsaved_revision: true }, "unsaved_revision"],
      [{ authorizing_role_current: false }, "not_authorized"],
      [{ authority: caregiverAuthority({ role: "institution_admin" }) }, "not_authorized"],
      [{ authority: caregiverAuthority({ role_scope_type: "institution" }) }, "not_authorized"],
    ] as const) {
      const { dependencies, run } = release(facts(override));
      await expect(run(), reason).resolves.toEqual({
        status: "denied",
        reason_code: reason,
      });
      expect(dependencies.commits).toEqual([]);
    }
  });

  it("bounds the scheduler by the window but not an explicit send now", async () => {
    const late = () => new Date("2026-08-01T23:00:00.000Z");
    await expect(
      release(facts(), undefined, "scheduler", late).run(),
    ).resolves.toEqual({ status: "denied", reason_code: "past_cutoff" });
    await expect(
      release(facts(), undefined, "scheduler", () => new Date("2026-08-01T08:00:00.000Z")).run(),
    ).resolves.toEqual({ status: "denied", reason_code: "before_scheduled_at" });

    // The class teacher may still send explicitly after the cutoff.
    const explicit = await release(facts(), undefined, "immediate", late).run();
    expect(explicit.status).toBe("released");
  });

  it("fails closed when the T-007 policy is absent or drifted", async () => {
    await expect(release(facts({ current_policy: null })).run()).resolves.toEqual({
      status: "denied",
      reason_code: "publication_policy_unavailable",
    });
    await expect(
      release(
        facts({
          current_policy: {
            policy_ref: schedule.policyRef,
            policy_head: schedule.policyHead + 1,
            policy_version: schedule.policyVersion + 1,
          },
        }),
      ).run(),
    ).resolves.toEqual({
      status: "denied",
      reason_code: "publication_policy_drift",
    });
  });

  it("fails closed before preview or commit when any stored release lacks its Receipt", async () => {
    const attempt = release(facts({ receipt_evidence_available: false }));
    await expect(attempt.run()).resolves.toEqual({
      status: "denied",
      reason_code: "receipt_evidence_unavailable",
    });
    expect(attempt.dependencies.commits).toEqual([]);
  });

  it("surfaces a missed-send attention when nothing committed past the cutoff", async () => {
    const decision = await release(
      facts({ targets: [target({ grant_allows: false })] }),
      undefined,
      "immediate",
      () => new Date("2026-08-01T23:00:00.000Z"),
    ).run();
    expect(decision.status).toBe("still_pending");
    if (decision.status === "denied") return;
    expect(decision.missedSendAttention).toBe(true);
  });

  it("blocks a target whose group photo is not fully attributed", async () => {
    const decision = await release(
      facts({
        media: [
          {
            ...media(),
            visible_children: [
              {
                child_care_process_id: "child-1",
                attribution_status: "confirmed",
                clearly_visible: true,
              },
              { clearly_visible: true },
            ],
          },
        ],
      }),
    ).run();
    expect(decision.status).toBe("still_pending");
    if (decision.status === "denied") return;
    expect(decision.results[0]?.blockingReasons).toContain("unknown_visible_child");
  });

  it("resolves only an owner-issued process ref", async () => {
    const dependencies = deps(facts());
    await expect(
      releasePublishProcess(dependencies, scope, {
        process_ref: PROCESS_KEY,
        command_request_id: "command:release-1",
        trigger: "immediate",
      }),
    ).resolves.toEqual({ status: "denied", reason_code: "target_unavailable" });
    await expect(
      releasePublishProcess(dependencies, scope, {
        process_ref: processRef({ workspace_id: "ws-1", participant_id: "caregiver-2" }),
        command_request_id: "command:release-1",
        trigger: "immediate",
      }),
    ).resolves.toEqual({ status: "denied", reason_code: "target_unavailable" });
  });
});

describe("G3-D release formal-ingress entry", () => {
  const prepareContexts = (): NurtureInteractionContextService =>
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

  const prepare = (value: ReleaseFactsV1 | null, operationInput?: unknown) =>
    prepareReleasePublishProcess(
      { ...deps(value), contexts: prepareContexts() },
      {
        ...scope,
        surface: "board",
        operation_input: operationInput,
        target_option_ref: processRef(),
      },
    );

  it("freezes the release revision as the draft_revision head and previews the attempt", async () => {
    const decision = await prepare(facts());
    expect(decision.status).toBe("ready_to_confirm");
    if (decision.status !== "ready_to_confirm") return;
    expect(decision.preview).toEqual({
      effect: "release_publish_process",
      target_count: 1,
      already_committed_count: 0,
      release_revision: 4,
    });
    expect(decision.command_request_id).toMatch(/^command:/);
  });

  it("refuses a queued process the same way the attempt would", async () => {
    const cases: Array<[Partial<ReleaseFactsV1>, string]> = [
      [{ process_state: "draft" }, "process_not_queued"],
      [{ edit_hold_active: true }, "edit_hold_active"],
      [{ has_unsaved_revision: true }, "unsaved_revision"],
      [{ receipt_evidence_available: false }, "receipt_evidence_unavailable"],
      [{ targets: [] }, "no_eligible_target"],
    ];
    for (const [overrides, reason] of cases) {
      await expect(prepare(facts(overrides))).resolves.toEqual({
        status: "denied",
        reason_code: reason,
      });
    }
  });

  it("rejects any non-empty operation input: the frozen contract's input is empty", async () => {
    await expect(prepare(facts(), { anything: 1 })).resolves.toEqual({
      status: "needs_input",
      fields: ["operation_input"],
    });
  });

  it("refuses stale_confirmation before committing anything when a save landed in between", async () => {
    // The teacher confirmed revision 4; a colleague saved revision 5.
    const attempt = release(facts({ current_revision: 5 }));
    const decision = await releasePublishProcess(attempt.dependencies, scope, {
      process_ref: processRef(),
      command_request_id: "command:release-1",
      trigger: "immediate",
      expected_release_revision: 4,
    });
    expect(decision).toEqual({ status: "denied", reason_code: "stale_confirmation" });
    // Nothing was committed for any target: the refusal is attempt-wide.
    expect(attempt.dependencies.commits).toHaveLength(0);
  });

  it("releases normally when the frozen revision still matches", async () => {
    const attempt = release(facts());
    const decision = await releasePublishProcess(attempt.dependencies, scope, {
      process_ref: processRef(),
      command_request_id: "command:release-1",
      trigger: "immediate",
      expected_release_revision: 4,
    });
    expect(decision).toMatchObject({ status: "released" });
    expect(attempt.dependencies.commits).toHaveLength(1);
  });
});

describe("T-009 family-growth pre-commit preparation", () => {
  const emission = (): FamilyGrowthPreparedReleaseEmissionV1 => ({
    target: { child_id: "mc-child-1", family_id: "mc-family-1" },
    admission: { mode: "direct_family_release", policy_ref: "pol-1", policy_version: 1 },
    material: {
      occurredAt: "2026-08-01T09:00:00.000Z",
      displaySnapshot: { title: "outdoor", source_label: "class" },
      attribution: {
        source_contributor_ref: "contrib-1",
        source_organization_ref: "org-1",
        contributed_at: "2026-08-01T09:00:00.000Z",
      },
      media: [
        {
          source_asset_ref: "asset-1",
          source_media_revision: 3,
          content_digest: "b".repeat(64),
          family_rendition_ref: "rendition-1",
          mime_type: "image/jpeg",
          access_mode: "authorized_short_lived_url",
        },
      ],
    },
    retentionMode: "family_retained",
    contentDigest: "c".repeat(64),
  });

  it("a denied resolution rejects the target before any commit call", async () => {
    const dependencies = deps(facts());
    const prepares: unknown[] = [];
    const decision = await releasePublishProcess(
      {
        ...dependencies,
        family_growth: {
          prepare: async (input) => {
            prepares.push(input);
            return { status: "denied", reason: "binding_missing" };
          },
        },
      },
      scope,
      { process_ref: processRef(), command_request_id: "command:release-1", trigger: "immediate" },
    );
    expect(decision.status).toBe("still_pending");
    if (decision.status !== "released" && decision.status !== "still_pending") return;
    expect(decision.results[0]).toMatchObject({
      outcome: "rejected",
      reasonCode: "binding_unavailable",
    });
    expect(prepares).toHaveLength(1);
    expect(prepares[0]).toMatchObject({
      process_key: PROCESS_KEY,
      child_care_process_id: "child-1",
    });
    expect(dependencies.commits).toHaveLength(0);
  });

  it("a prepared emission rides into the commit input", async () => {
    const dependencies = deps(facts());
    const prepared = emission();
    const decision = await releasePublishProcess(
      {
        ...dependencies,
        family_growth: { prepare: async () => ({ status: "prepared", emission: prepared }) },
      },
      scope,
      { process_ref: processRef(), command_request_id: "command:release-1", trigger: "immediate" },
    );
    expect(decision.status).toBe("released");
    expect(dependencies.commits).toHaveLength(1);
    expect(
      (dependencies.commits[0] as { family_growth?: unknown }).family_growth,
    ).toBe(prepared);
  });

  it("without the preparer the commit input stays exactly the G3-D shape", async () => {
    const dependencies = deps(facts());
    const decision = await releasePublishProcess(dependencies, scope, {
      process_ref: processRef(),
      command_request_id: "command:release-1",
      trigger: "immediate",
    });
    expect(decision.status).toBe("released");
    expect(dependencies.commits).toHaveLength(1);
    expect("family_growth" in (dependencies.commits[0] as object)).toBe(false);
  });
});

