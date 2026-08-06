import { describe, expect, it } from "vitest";
import {
  PILOT_ORGANIZE_TRIGGER_DEFAULTS,
  evaluateOrganizeTrigger,
  fallbackLocalMinutes,
  localMinutesOfDay,
  resolveOrganizeTrigger,
  resolveCaptureWatermark,
  validateOrganizeTriggerPolicy,
  type CaptureActivityHeadV1,
  type OrganizeTriggerPolicyV1,
  type OrganizeTriggerRequestV1,
  type RawCaptureRow,
} from "../../src/harness/care-capture-batch.js";
import { caregiverAuthority } from "./board-fixtures.js";

const policy = (overrides: Partial<OrganizeTriggerPolicyV1> = {}): OrganizeTriggerPolicyV1 => ({
  policy_ref: "syn-policy-1",
  policy_head: 3,
  time_zone: "Asia/Shanghai",
  default_release_local_time: PILOT_ORGANIZE_TRIGGER_DEFAULTS.default_release_local_time,
  organize_idle_seconds: PILOT_ORGANIZE_TRIGGER_DEFAULTS.organize_idle_seconds,
  organize_fallback_lead_seconds:
    PILOT_ORGANIZE_TRIGGER_DEFAULTS.organize_fallback_lead_seconds,
  automatic_quiescence_seconds:
    PILOT_ORGANIZE_TRIGGER_DEFAULTS.automatic_quiescence_seconds,
  capture_activity_lease_seconds:
    PILOT_ORGANIZE_TRIGGER_DEFAULTS.capture_activity_lease_seconds,
  automatic_organize_enabled: true,
  ...overrides,
});

const capture = (overrides: Partial<RawCaptureRow> = {}): RawCaptureRow => ({
  capture_id: "capture-1",
  kind: "media",
  stable: true,
  source_sequence: 1,
  occurred_at: "2026-08-01T08:00:00.000Z",
  authority: caregiverAuthority(),
  ...overrides,
});

const activity = (
  overrides: Partial<CaptureActivityHeadV1> = {},
): CaptureActivityHeadV1 => ({
  last_user_activity_at: "2026-08-01T08:00:00.000Z",
  ...overrides,
});

const request = (
  overrides: Partial<OrganizeTriggerRequestV1> = {},
): OrganizeTriggerRequestV1 => ({
  trigger: "manual",
  trigger_request_id: "trigger-1",
  now: new Date("2026-08-01T08:30:00.000Z"),
  policy: policy(),
  batch: { state: "collecting", captures: [capture()], activity: activity() },
  ...overrides,
});

describe("G3-B1 organize trigger policy", () => {
  it("keeps the quiescence gate configurable but never zero while auto-organize is on", () => {
    expect(validateOrganizeTriggerPolicy(policy())).toEqual({ status: "ok" });
    expect(validateOrganizeTriggerPolicy(policy({ automatic_quiescence_seconds: 30 }))).toEqual({
      status: "ok",
    });
    expect(validateOrganizeTriggerPolicy(policy({ automatic_quiescence_seconds: 180 }))).toEqual(
      { status: "ok" },
    );
    for (const seconds of [0, 29, 181]) {
      expect(
        validateOrganizeTriggerPolicy(policy({ automatic_quiescence_seconds: seconds })),
      ).toEqual({ status: "invalid", reason_code: "invalid_quiescence_gate" });
    }
    // Fully manual: the gate stops taking part in any decision.
    expect(
      validateOrganizeTriggerPolicy(
        policy({ automatic_organize_enabled: false, automatic_quiescence_seconds: 0 }),
      ),
    ).toEqual({ status: "ok" });
  });

  it("refuses an idle period shorter than its own gate and other malformed policy", () => {
    expect(
      validateOrganizeTriggerPolicy(policy({ organize_idle_seconds: 45 })),
    ).toEqual({ status: "invalid", reason_code: "idle_below_quiescence_gate" });
    expect(validateOrganizeTriggerPolicy(policy({ time_zone: "Not/AZone" }))).toEqual({
      status: "invalid",
      reason_code: "invalid_time_zone",
    });
    expect(
      validateOrganizeTriggerPolicy(policy({ default_release_local_time: "25:00" })),
    ).toEqual({ status: "invalid", reason_code: "invalid_release_local_time" });
    expect(validateOrganizeTriggerPolicy(policy({ policy_head: 0 }))).toEqual({
      status: "invalid",
      reason_code: "invalid_policy_head",
    });
  });

  it("resolves the daily fallback point from institution timezone and lead time", () => {
    // 17:00 default send window minus a 30-minute lead.
    expect(fallbackLocalMinutes(policy())).toBe(16 * 60 + 30);
    expect(localMinutesOfDay(new Date("2026-08-01T08:35:00.000Z"), "Asia/Shanghai")).toBe(
      16 * 60 + 35,
    );
    expect(localMinutesOfDay(new Date("2026-08-01T08:35:00.000Z"), "UTC")).toBe(8 * 60 + 35);
  });
});

describe("G3-B1 source watermark", () => {
  it("cuts the contiguous stable prefix and defers everything behind an in-flight upload", () => {
    const { watermark, included, deferred } = resolveCaptureWatermark(
      [
        capture({ capture_id: "c-1", source_sequence: 1 }),
        capture({ capture_id: "c-2", source_sequence: 2, stable: false }),
        capture({ capture_id: "c-3", source_sequence: 3 }),
      ],
      "2026-08-01T08:30:00.000Z",
    );
    expect(watermark.source_sequence).toBe(1);
    expect(included.map((entry) => entry.capture_id)).toEqual(["c-1"]);
    // c-3 is settled but sits behind an unfinished upload; it must not be
    // skipped over and stranded.
    expect(deferred.map((entry) => entry.capture_id)).toEqual(["c-2", "c-3"]);
  });

  it("ignores intake order noise and excludes a capture whose class role lapsed", () => {
    const { included, deferred } = resolveCaptureWatermark(
      [
        capture({ capture_id: "c-2", source_sequence: 2 }),
        capture({ capture_id: "c-1", source_sequence: 1 }),
        capture({
          capture_id: "c-3",
          source_sequence: 3,
          authority: caregiverAuthority({ role_assignment_current: false }),
        }),
      ],
      "2026-08-01T08:30:00.000Z",
    );
    expect(included.map((entry) => entry.capture_id)).toEqual(["c-1", "c-2"]);
    expect(deferred.map((entry) => entry.capture_id)).toEqual(["c-3"]);
  });
});

describe("G3-B1 organize trigger", () => {
  it("cuts on an explicit manual organize even while a teacher is still capturing", () => {
    const decision = evaluateOrganizeTrigger(
      request({
        batch: {
          state: "collecting",
          captures: [capture()],
          // Activity one second ago plus a live lease: an automatic trigger
          // would wait, manual does not.
          activity: activity({
            last_user_activity_at: "2026-08-01T08:29:59.000Z",
            activity_lease_expires_at: "2026-08-01T08:31:00.000Z",
          }),
        },
      }),
    );
    expect(decision.status).toBe("cut");
    if (decision.status !== "cut") return;
    expect(decision.evidence.trigger).toBe("manual");
    expect(decision.evidence.leaseActive).toBe(true);
    expect(decision.evidence.watermark.source_sequence).toBe(1);
  });

  it("produces nothing from an empty or entirely unstable batch", () => {
    expect(
      evaluateOrganizeTrigger(
        request({ batch: { state: "collecting", captures: [], activity: activity() } }),
      ),
    ).toEqual({ status: "waiting", reason: "empty_stable_batch" });
    expect(
      evaluateOrganizeTrigger(
        request({
          batch: {
            state: "collecting",
            captures: [capture({ stable: false })],
            activity: activity(),
          },
        }),
      ),
    ).toEqual({ status: "waiting", reason: "empty_stable_batch" });
  });

  it("waits for the full idle period and treats a live lease as ongoing activity", () => {
    const base = request({ trigger: "idle", now: new Date("2026-08-01T08:09:00.000Z") });
    expect(evaluateOrganizeTrigger(base)).toEqual({
      status: "waiting",
      reason: "idle_not_reached",
    });
    const matured = request({ trigger: "idle", now: new Date("2026-08-01T08:10:00.000Z") });
    expect(evaluateOrganizeTrigger(matured).status).toBe("cut");
    expect(
      evaluateOrganizeTrigger({
        ...matured,
        batch: {
          ...matured.batch,
          activity: activity({ activity_lease_expires_at: "2026-08-01T08:10:30.000Z" }),
        },
      }),
    ).toEqual({ status: "waiting", reason: "idle_not_reached" });
  });

  it("never makes a matured idle trigger wait out the gate a second time", () => {
    // Idle is validated to be at least the gate, so reaching it already proves
    // the class has been quiet for longer than the gate requires.
    const decision = evaluateOrganizeTrigger(
      request({ trigger: "idle", now: new Date("2026-08-01T08:10:00.000Z") }),
    );
    expect(decision.status).toBe("cut");
    if (decision.status !== "cut") return;
    expect(decision.evidence.quiescenceSeconds).toBe(60);
  });

  it("marks the daily fallback due and then only waits out the one-minute gate", () => {
    const notDue = request({
      trigger: "daily_fallback",
      now: new Date("2026-08-01T08:20:00.000Z"),
    });
    expect(evaluateOrganizeTrigger(notDue)).toEqual({
      status: "waiting",
      reason: "fallback_not_due",
    });

    const dueButBusy = request({
      trigger: "daily_fallback",
      now: new Date("2026-08-01T08:35:00.000Z"),
      batch: {
        state: "collecting",
        captures: [capture()],
        activity: activity({ last_user_activity_at: "2026-08-01T08:34:30.000Z" }),
      },
    });
    expect(evaluateOrganizeTrigger(dueButBusy)).toEqual({
      status: "waiting",
      reason: "quiescence_gate",
    });

    const dueAndQuiet = request({
      trigger: "daily_fallback",
      now: new Date("2026-08-01T08:35:00.000Z"),
      batch: {
        state: "collecting",
        captures: [capture()],
        // One quiet minute is enough; the full ten-minute idle is not required.
        activity: activity({ last_user_activity_at: "2026-08-01T08:33:59.000Z" }),
      },
    });
    expect(evaluateOrganizeTrigger(dueAndQuiet).status).toBe("cut");
  });

  it("never lets background machine progress reset the gate", () => {
    const decision = evaluateOrganizeTrigger(
      request({
        trigger: "daily_fallback",
        now: new Date("2026-08-01T08:35:00.000Z"),
        batch: {
          state: "collecting",
          captures: [capture()],
          activity: activity({
            last_user_activity_at: "2026-08-01T08:30:00.000Z",
            // Upload percentages, thumbnails, heartbeats and provider jobs.
            last_machine_progress_at: "2026-08-01T08:34:59.000Z",
          }),
        },
      }),
    );
    expect(decision.status).toBe("cut");
    if (decision.status !== "cut") return;
    expect(decision.evidence.observedUserActivityAt).toBe("2026-08-01T08:30:00.000Z");
  });

  it("lets an institution turn automatic organize off without disabling manual", () => {
    const disabled = policy({ automatic_organize_enabled: false });
    for (const trigger of ["idle", "daily_fallback"] as const) {
      expect(
        evaluateOrganizeTrigger(
          request({ trigger, policy: disabled, now: new Date("2026-08-01T09:00:00.000Z") }),
        ),
      ).toEqual({ status: "waiting", reason: "automatic_disabled" });
    }
    expect(
      evaluateOrganizeTrigger(request({ trigger: "manual", policy: disabled })).status,
    ).toBe("cut");
  });

  it("records the resolved trigger evidence without any raw device operation stream", () => {
    const decision = evaluateOrganizeTrigger(request());
    expect(decision.status).toBe("cut");
    if (decision.status !== "cut") return;
    expect(decision.evidence).toEqual({
      trigger: "manual",
      triggerRequestId: "trigger-1",
      policyRef: "syn-policy-1",
      policyHead: 3,
      timeZone: "Asia/Shanghai",
      quiescenceSeconds: 60,
      observedUserActivityAt: "2026-08-01T08:00:00.000Z",
      leaseActive: false,
      watermark: { source_sequence: 1, cut_at: "2026-08-01T08:30:00.000Z" },
    });
    const serialized = JSON.stringify(decision.evidence);
    for (const forbidden of ["tap", "keystroke", "device", "operationStream"]) {
      expect(serialized).not.toContain(forbidden);
    }
  });

  it("returns the identical cut for an exact trigger replay and refuses a cut batch", () => {
    const first = evaluateOrganizeTrigger(request());
    const replay = evaluateOrganizeTrigger(request());
    expect(replay).toEqual(first);
    expect(
      evaluateOrganizeTrigger(
        request({ batch: { state: "cut", captures: [capture()], activity: activity() } }),
      ),
    ).toEqual({ status: "waiting", reason: "batch_not_collecting" });
  });

  it("refuses to decide anything under an invalid policy", () => {
    expect(
      evaluateOrganizeTrigger(request({ policy: policy({ automatic_quiescence_seconds: 0 }) })),
    ).toEqual({ status: "invalid", reason_code: "invalid_quiescence_gate" });
  });
});

describe("G3-B1 provider-backed trigger resolution", () => {
  const source = (organizePolicy: OrganizeTriggerPolicyV1 | undefined) => ({
    batch_id: "batch-1",
    batch_version: 4,
    state: "collecting" as const,
    ...(organizePolicy ? { organize_policy: organizePolicy } : {}),
    captures: [capture()],
    activity: activity(),
  });

  it("uses only the policy returned by the owner read", async () => {
    const resolved = await resolveOrganizeTrigger(
      {
        reads: {
          loadOrganizeSource: async () =>
            source(policy({ policy_ref: "owner-policy", policy_head: 9 })),
          listOrganizeCareGroups: async () => [],
        },
        now: () => new Date("2026-08-01T08:30:00.000Z"),
      },
      { workspace_id: "ws-1", participant_id: "caregiver-1", care_group_id: "group-1" },
      { trigger: "manual", trigger_request_id: "trigger-owner-policy" },
    );
    expect(resolved).toMatchObject({
      status: "evaluated",
      decision: {
        status: "cut",
        evidence: { policyRef: "owner-policy", policyHead: 9 },
      },
    });
  });

  it("fails closed when the owner returns no policy", async () => {
    const resolved = await resolveOrganizeTrigger(
      {
        reads: {
          loadOrganizeSource: async () => source(undefined),
          listOrganizeCareGroups: async () => [],
        },
      },
      { workspace_id: "ws-1", participant_id: "caregiver-1", care_group_id: "group-1" },
      { trigger: "idle", trigger_request_id: "trigger-no-policy" },
    );
    expect(resolved).toEqual({
      status: "evaluated",
      batch_id: "batch-1",
      decision: { status: "invalid", reason_code: "policy_unavailable" },
    });
  });
});
