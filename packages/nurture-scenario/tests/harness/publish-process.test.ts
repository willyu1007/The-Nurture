import { describe, expect, it } from "vitest";
import { assembleDeterministicDraft } from "../../src/harness/content-assembler.js";
import {
  DEFAULT_QUICK_ADJUST_SECONDS,
  PUBLISH_PROCESS_STATES,
  admitToPendingRelease,
  createPublishCandidate,
  evaluateQuickAdjust,
  isLegalPublishProcessTransition,
  publishProcessKey,
  type ContentSafetyAssessmentV1,
  type ContentSafetyRoutePort,
  type CreatePublishCandidateInputV1,
  type PublishProcessStateV1,
  type PublishTargetCandidateV1,
} from "../../src/harness/publish-process.js";
import type { OrganizeTriggerEvidenceV1 } from "../../src/harness/care-capture-batch.js";
import { BOARD_INTEGRITY_KEY, caregiverAuthority } from "./board-fixtures.js";

const scope = { workspace_id: "ws-1", participant_id: "caregiver-1" };
const now = () => new Date("2026-08-01T08:30:00.000Z");

const assessment = (
  overrides: Partial<ContentSafetyAssessmentV1> = {},
): ContentSafetyAssessmentV1 => ({
  route: "ordinary",
  policyRef: "syn-content-safety-1",
  policyHead: 2,
  ruleRevision: "rules-1.0.0",
  riskCodes: [],
  ...overrides,
});

const safetyPort = (
  value: ContentSafetyAssessmentV1 | null | "throw" = assessment(),
): ContentSafetyRoutePort => ({
  deriveRoute: async () => {
    if (value === "throw") throw new Error("provider unavailable");
    return value;
  },
});

const evidence: OrganizeTriggerEvidenceV1 = {
  trigger: "manual",
  triggerRequestId: "trigger-1",
  policyRef: "syn-policy-1",
  policyHead: 3,
  timeZone: "Asia/Shanghai",
  quiescenceSeconds: 60,
  observedUserActivityAt: "2026-08-01T08:00:00.000Z",
  leaseActive: false,
  watermark: { source_sequence: 2, cut_at: "2026-08-01T08:30:00.000Z" },
};

const content = () => {
  const assembled = assembleDeterministicDraft(BOARD_INTEGRITY_KEY, scope, {
    organizer_input_revision: "organizer-rev-1",
    activity_label: "户外活动",
    activity_key: "outdoor_play",
    sources: [
      {
        capture_id: "c-1",
        kind: "text",
        text: "户外活动结束。",
        source_sequence: 1,
        occurred_at: "2026-08-01T09:00:00.000Z",
      },
      {
        capture_id: "c-2",
        kind: "media",
        media_asset_id: "media-1",
        source_sequence: 2,
        occurred_at: "2026-08-01T09:01:00.000Z",
      },
    ],
  });
  if (assembled.status !== "ok") throw new Error("fixture assembly failed");
  return assembled.content;
};

const target = (
  overrides: Partial<PublishTargetCandidateV1> = {},
): PublishTargetCandidateV1 => ({
  child_care_process_id: "child-1",
  enrollment_id: "enrollment-1",
  family_id: "family-1",
  grant_id: "grant-1",
  data_class: "daily_care_log",
  purpose_key: "family_daily_care_update",
  authority: caregiverAuthority(),
  ...overrides,
});

const candidateInput = (
  overrides: Partial<CreatePublishCandidateInputV1> = {},
): CreatePublishCandidateInputV1 => ({
  care_group_id: "care-group-1",
  organizer_input_revision: "organizer-rev-1",
  source_ids: ["c-1", "c-2"],
  content: content(),
  targets: [target()],
  watermark: evidence.watermark,
  trigger_evidence: evidence,
  ...overrides,
});

const create = (
  input = candidateInput(),
  safety: ContentSafetyAssessmentV1 | null | "throw" = assessment(),
) =>
  createPublishCandidate(
    { integrity_key: BOARD_INTEGRITY_KEY, safety: safetyPort(safety), now },
    scope,
    input,
  );

describe("G3-B1 PublishProcess state machine", () => {
  it("has exactly five business states and no scheduling or delivery state", () => {
    expect([...PUBLISH_PROCESS_STATES]).toEqual([
      "draft",
      "needs_review",
      "pending_release",
      "released",
      "cancelled",
    ]);
    for (const invented of [
      "scheduled",
      "sending",
      "failed",
      "delivered",
      "corrected",
      "partially_released",
    ]) {
      expect(PUBLISH_PROCESS_STATES as readonly string[]).not.toContain(invented);
    }
  });

  it("allows only the frozen transitions", () => {
    const legal: Array<[PublishProcessStateV1, PublishProcessStateV1]> = [
      ["draft", "needs_review"],
      ["draft", "pending_release"],
      ["draft", "cancelled"],
      ["needs_review", "pending_release"],
      ["needs_review", "cancelled"],
      ["pending_release", "released"],
      ["pending_release", "cancelled"],
    ];
    for (const [from, to] of legal) {
      expect(isLegalPublishProcessTransition(from, to), `${from}->${to}`).toBe(true);
    }
    for (const [from, to] of [
      ["released", "draft"],
      ["released", "cancelled"],
      ["released", "pending_release"],
      ["cancelled", "draft"],
      ["pending_release", "draft"],
      ["needs_review", "draft"],
    ] as Array<[PublishProcessStateV1, PublishProcessStateV1]>) {
      expect(isLegalPublishProcessTransition(from, to), `${from}->${to}`).toBe(false);
    }
  });
});

describe("G3-B1 publication candidate creation", () => {
  it("creates one draft with a shared revision and starts the quick-adjust window", async () => {
    const decision = await create();
    expect(decision.status).toBe("draft_created");
    if (decision.status !== "draft_created") return;
    expect(decision.process.state).toBe("draft");
    expect(decision.process.currentRevision.revision).toBe(1);
    expect(decision.process.currentRevision.organizerInputRevision).toBe("organizer-rev-1");
    expect(decision.process.sourceWatermark).toEqual(evidence.watermark);
    expect(decision.process.triggerEvidence).toEqual(evidence);
    expect(decision.quickAdjust.seconds).toBe(DEFAULT_QUICK_ADJUST_SECONDS);
    expect(decision.quickAdjust.deadlineAt).toBe("2026-08-01T08:30:30.000Z");
    expect(decision.processKey).toBe(publishProcessKey("care-group-1", "trigger-1"));
  });

  it("returns the same candidate identity for an exact organize replay", async () => {
    const first = await create();
    const replay = await create();
    expect(first).toEqual(replay);
    const other = await create(
      candidateInput({
        trigger_evidence: { ...evidence, triggerRequestId: "trigger-2" },
      }),
    );
    expect(other.status).toBe("draft_created");
    if (other.status !== "draft_created" || first.status !== "draft_created") return;
    expect(other.process.processRef).not.toBe(first.process.processRef);
  });

  it("keeps one shared revision across several targets and hides no per-target content", async () => {
    const decision = await create(
      candidateInput({
        targets: [
          target({ child_care_process_id: "child-1" }),
          target({ child_care_process_id: "child-2", enrollment_id: "enrollment-2" }),
          target({ child_care_process_id: "child-3", enrollment_id: "enrollment-3" }),
        ],
      }),
    );
    expect(decision.status).toBe("draft_created");
    if (decision.status !== "draft_created") return;
    expect(decision.process.targets).toHaveLength(3);
    expect(new Set(decision.process.targets.map((entry) => entry.targetRef)).size).toBe(3);
    const serializedTargets = JSON.stringify(decision.process.targets);
    for (const contentField of ["title", "body", "segments", "mediaRefs", "户外活动"]) {
      expect(serializedTargets).not.toContain(contentField);
    }
    expect(serializedTargets).not.toContain("child-1");
  });

  it("refuses a mixed audience data class or purpose instead of merging them", async () => {
    for (const mixed of [
      [target(), target({ data_class: "child_growth_record" })],
      [target(), target({ purpose_key: "family_growth_update" })],
    ]) {
      await expect(create(candidateInput({ targets: mixed }))).resolves.toEqual({
        status: "denied",
        reason_code: "mixed_audience_data_class",
      });
    }
  });

  it("routes review-required content to needs_review without a quick-adjust window", async () => {
    const decision = await create(
      candidateInput(),
      assessment({ route: "review_required", riskCodes: ["evaluative_wording"] }),
    );
    expect(decision.status).toBe("needs_review");
    if (decision.status !== "needs_review") return;
    expect(decision.process.state).toBe("needs_review");
    expect(decision).not.toHaveProperty("quickAdjust");
  });

  it("keeps direct-interaction content out of batch publication entirely", async () => {
    const decision = await create(
      candidateInput(),
      assessment({ route: "direct_interaction_required", riskCodes: ["health_symptom"] }),
    );
    expect(decision.status).toBe("direct_interaction_required");
    if (decision.status !== "direct_interaction_required") return;
    // No process, no draft and no sixth state: only the internal source stays.
    expect(decision).not.toHaveProperty("process");
    expect(decision.internalSourceRefs).toHaveLength(2);
    expect(JSON.stringify(decision)).not.toContain("户外活动");
  });

  it("fails closed when the safety route is missing or the provider throws", async () => {
    for (const broken of [null, "throw"] as const) {
      await expect(create(candidateInput(), broken)).resolves.toEqual({
        status: "denied",
        reason_code: "safety_route_unavailable",
      });
    }
  });

  it("refuses a target the actor may not publish to and an empty assembly", async () => {
    for (const wider of [
      caregiverAuthority({ role: "institution_admin" }),
      caregiverAuthority({ role_scope_type: "institution" }),
      caregiverAuthority({ role_scope_matches_source: false }),
      caregiverAuthority({ purpose_allowed: false }),
    ]) {
      await expect(
        create(candidateInput({ targets: [target({ authority: wider })] })),
      ).resolves.toEqual({ status: "denied", reason_code: "not_authorized" });
    }
    await expect(create(candidateInput({ targets: [] }))).resolves.toEqual({
      status: "denied",
      reason_code: "no_eligible_target",
    });
    await expect(
      create(
        candidateInput({
          content: { ...content(), mediaRefs: [], body: undefined },
        }),
      ),
    ).resolves.toEqual({ status: "skipped", reason: "empty_assembly" });
  });

  it("refuses content assembled from a different organizer input revision", async () => {
    await expect(
      create(candidateInput({ organizer_input_revision: "organizer-rev-2" })),
    ).resolves.toEqual({
      status: "denied",
      reason_code: "organizer_input_revision_mismatch",
    });
  });
});

describe("G3-B1 quick-adjust window", () => {
  const posture = { deadlineAt: "2026-08-01T08:30:30.000Z", seconds: 30 };

  it("counts down, pauses on touch or hold, and only then elapses", () => {
    expect(
      evaluateQuickAdjust({
        now: new Date("2026-08-01T08:30:10.000Z"),
        posture,
        editing: false,
        edit_hold_active: false,
      }),
    ).toEqual({ status: "running", remainingSeconds: 20 });
    expect(
      evaluateQuickAdjust({
        now: new Date("2026-08-01T08:30:29.000Z"),
        posture,
        editing: true,
        edit_hold_active: false,
      }),
    ).toEqual({ status: "paused", reason: "editing" });
    expect(
      evaluateQuickAdjust({
        now: new Date("2026-08-01T08:30:29.000Z"),
        posture,
        editing: false,
        edit_hold_active: true,
      }),
    ).toEqual({ status: "paused", reason: "edit_hold" });
    expect(
      evaluateQuickAdjust({
        now: new Date("2026-08-01T08:30:31.000Z"),
        posture,
        editing: false,
        edit_hold_active: false,
      }),
    ).toEqual({ status: "elapsed" });
  });

  it("never lets a timeout reach the queue before its own deadline or while gated", () => {
    const base = {
      now: new Date("2026-08-01T08:30:10.000Z"),
      state: "draft" as PublishProcessStateV1,
      posture,
      editing: false,
      edit_hold_active: false,
      has_unsaved_revision: false,
      resolved_schedule_available: true,
    };
    expect(admitToPendingRelease(base)).toEqual({
      status: "blocked",
      reason_code: "quick_adjust_active",
    });
    const elapsed = { ...base, now: new Date("2026-08-01T08:31:00.000Z") };
    expect(admitToPendingRelease(elapsed)).toEqual({ status: "admitted" });
    expect(admitToPendingRelease({ ...elapsed, edit_hold_active: true })).toEqual({
      status: "blocked",
      reason_code: "edit_hold_active",
    });
    expect(admitToPendingRelease({ ...elapsed, has_unsaved_revision: true })).toEqual({
      status: "blocked",
      reason_code: "unsaved_revision",
    });
    expect(admitToPendingRelease({ ...elapsed, state: "needs_review" })).toEqual({
      status: "blocked",
      reason_code: "needs_review",
    });
    expect(admitToPendingRelease({ ...elapsed, state: "released" })).toEqual({
      status: "blocked",
      reason_code: "illegal_transition",
    });
  });

  it("blocks the send queue while the institution schedule is unresolved", () => {
    expect(
      admitToPendingRelease({
        now: new Date("2026-08-01T08:31:00.000Z"),
        state: "draft",
        posture,
        editing: false,
        edit_hold_active: false,
        has_unsaved_revision: false,
        resolved_schedule_available: false,
      }),
    ).toEqual({ status: "blocked", reason_code: "dependency_no_go" });
  });
});
