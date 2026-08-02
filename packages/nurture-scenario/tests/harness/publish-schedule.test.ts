import { describe, expect, it } from "vitest";
import {
  PILOT_RELEASE_DEFAULTS,
  evaluateReschedule,
  evaluateSchedulerAttempt,
  parseRescheduleInputV1,
  resolvePublishSchedule,
  scheduleAfterPolicyChange,
  validateInstitutionPublicationPolicy,
  zonedLocalTimeToInstant,
  type InstitutionPublicationPolicyV1,
  type ResolvedPublishScheduleV1,
} from "../../src/harness/publish-schedule.js";
import type { PublishProcessStateV1 } from "../../src/harness/publish-process.js";

const policy = (
  overrides: Partial<InstitutionPublicationPolicyV1> = {},
): InstitutionPublicationPolicyV1 => ({
  policy_ref: "syn-publication-policy-1",
  policy_head: 5,
  policy_version: 2,
  institution_ref: "syn-institution-1",
  time_zone: "Asia/Shanghai",
  default_release_local_time: PILOT_RELEASE_DEFAULTS.default_release_local_time,
  retry_cutoff_local_time: PILOT_RELEASE_DEFAULTS.retry_cutoff_local_time,
  organize_idle_seconds: 600,
  organize_fallback_lead_seconds: 1800,
  automatic_quiescence_seconds: 60,
  capture_activity_lease_seconds: 60,
  automatic_organize_enabled: true,
  effective_from: "2026-01-01T00:00:00.000Z",
  ...overrides,
});

// 2026-08-01 10:00 Asia/Shanghai — before the 17:00 send window.
const morning = new Date("2026-08-01T02:00:00.000Z");
// 2026-08-01 20:00 Asia/Shanghai — after the 19:00 cutoff.
const afterCutoff = new Date("2026-08-01T12:00:00.000Z");

describe("G3-D schedule resolution", () => {
  it("resolves the institution-local send window to exact UTC instants", () => {
    const result = resolvePublishSchedule({ policy: policy(), now: morning });
    expect(result.status).toBe("resolved");
    if (result.status !== "resolved") return;
    // 17:00 and 19:00 Asia/Shanghai on the same local day.
    expect(result.schedule.scheduledAt).toBe("2026-08-01T09:00:00.000Z");
    expect(result.schedule.notAfter).toBe("2026-08-01T11:00:00.000Z");
    expect(result.schedule.timeZone).toBe("Asia/Shanghai");
    expect(result.schedule.policyHead).toBe(5);
    expect(result.schedule.policyVersion).toBe(2);
    expect(result.schedule.resolvedAt).toBe(morning.toISOString());
  });

  it("uses the institution timezone rather than the server's", () => {
    const utc = resolvePublishSchedule({
      policy: policy({ time_zone: "UTC" }),
      now: new Date("2026-08-01T02:00:00.000Z"),
    });
    expect(utc.status).toBe("resolved");
    if (utc.status !== "resolved") return;
    expect(utc.schedule.scheduledAt).toBe("2026-08-01T17:00:00.000Z");
    expect(zonedLocalTimeToInstant({ year: 2026, month: 8, day: 1 }, 17 * 60, "UTC")).toEqual(
      new Date("2026-08-01T17:00:00.000Z"),
    );
  });

  it("takes the next day's window for content queued after the cutoff", () => {
    const result = resolvePublishSchedule({ policy: policy(), now: afterCutoff });
    expect(result.status).toBe("resolved");
    if (result.status !== "resolved") return;
    expect(result.schedule.scheduledAt).toBe("2026-08-02T09:00:00.000Z");
    expect(result.schedule.notAfter).toBe("2026-08-02T11:00:00.000Z");
  });

  it("fails closed instead of inventing a window", () => {
    expect(resolvePublishSchedule({ policy: null, now: morning })).toEqual({
      status: "unavailable",
      reason_code: "policy_unavailable",
    });
    for (const [override, reason] of [
      [{ retry_cutoff_local_time: "16:00" }, "cutoff_not_after_release"],
      [{ retry_cutoff_local_time: "25:00" }, "invalid_retry_cutoff_local_time"],
      [{ institution_ref: "" }, "missing_institution_ref"],
      [{ policy_version: 0 }, "invalid_policy_version"],
      [{ effective_from: "2027-01-01T00:00:00.000Z" }, "policy_not_yet_effective"],
      [{ effective_to: "2026-01-02T00:00:00.000Z" }, "policy_expired"],
      [{ time_zone: "Not/AZone" }, "invalid_time_zone"],
    ] as const) {
      expect(
        resolvePublishSchedule({ policy: policy(override), now: morning }),
        reason,
      ).toEqual({ status: "unavailable", reason_code: reason });
    }
  });

  it("validates the policy against the frozen T-007 field set", () => {
    expect(validateInstitutionPublicationPolicy(policy(), morning)).toEqual({ status: "ok" });
  });

  it("never moves an already-resolved window when the policy changes", () => {
    const resolved = resolvePublishSchedule({ policy: policy(), now: morning });
    expect(resolved.status).toBe("resolved");
    if (resolved.status !== "resolved") return;
    const after = scheduleAfterPolicyChange({
      frozen: resolved.schedule,
      current_policy_head: 6,
    });
    expect(after.moved).toBe(false);
    expect(after.schedule).toEqual(resolved.schedule);
    expect(after.policyDrift).toBe(true);
    expect(
      scheduleAfterPolicyChange({ frozen: resolved.schedule, current_policy_head: 5 })
        .policyDrift,
    ).toBe(false);
  });
});

describe("G3-D reschedule", () => {
  const frozen: ResolvedPublishScheduleV1 = {
    scheduledAt: "2026-08-01T09:00:00.000Z",
    notAfter: "2026-08-01T11:00:00.000Z",
    timeZone: "Asia/Shanghai",
    policyRef: "syn-publication-policy-1",
    policyHead: 5,
    policyVersion: 2,
    resolvedAt: "2026-08-01T02:00:00.000Z",
  };
  const base = {
    now: new Date("2026-08-01T08:00:00.000Z"),
    state: "pending_release" as PublishProcessStateV1,
    frozen,
    edit_hold_held_by_other: false,
    has_committed_release: false,
    operation_input: { scheduledAt: "2026-08-01T10:00:00.000Z" },
  };

  it("moves a queued card inside its own frozen window", () => {
    const decision = evaluateReschedule(base);
    expect(decision.status).toBe("rescheduled");
    if (decision.status !== "rescheduled") return;
    expect(decision.schedule.scheduledAt).toBe("2026-08-01T10:00:00.000Z");
    // Everything else about the frozen window is untouched.
    expect(decision.schedule.notAfter).toBe(frozen.notAfter);
    expect(decision.schedule.policyHead).toBe(frozen.policyHead);
  });

  it("refuses a time outside the window, a released process and a colleague's hold", () => {
    expect(
      evaluateReschedule({
        ...base,
        operation_input: { scheduledAt: "2026-08-01T07:00:00.000Z" },
      }),
    ).toEqual({ status: "denied", reason_code: "scheduled_at_in_past" });
    expect(
      evaluateReschedule({
        ...base,
        operation_input: { scheduledAt: "2026-08-01T11:00:00.000Z" },
      }),
    ).toEqual({ status: "denied", reason_code: "scheduled_at_after_cutoff" });
    expect(evaluateReschedule({ ...base, has_committed_release: true })).toEqual({
      status: "denied",
      reason_code: "already_released",
    });
    expect(evaluateReschedule({ ...base, state: "draft" })).toEqual({
      status: "denied",
      reason_code: "process_not_queued",
    });
    expect(evaluateReschedule({ ...base, edit_hold_held_by_other: true })).toEqual({
      status: "denied",
      reason_code: "edit_hold_active",
    });
  });

  it("keeps the typed input closed", () => {
    expect(parseRescheduleInputV1({ scheduledAt: "2026-08-01T10:00:00.000Z" }).status).toBe(
      "ok",
    );
    for (const invalid of [
      {},
      { scheduledAt: "not-a-date" },
      { scheduledAt: "2026-08-01T10:00:00+08:00" },
      { scheduledAt: "2026-08-01T10:00:00.000Z", expectedHeads: {} },
      "not-an-object",
    ]) {
      expect(parseRescheduleInputV1(invalid).status).toBe("invalid");
    }
  });
});

describe("G3-D scheduler attempt window", () => {
  const schedule: ResolvedPublishScheduleV1 = {
    scheduledAt: "2026-08-01T09:00:00.000Z",
    notAfter: "2026-08-01T11:00:00.000Z",
    timeZone: "Asia/Shanghai",
    policyRef: "syn-publication-policy-1",
    policyHead: 5,
    policyVersion: 2,
    resolvedAt: "2026-08-01T02:00:00.000Z",
  };
  const base = {
    now: new Date("2026-08-01T09:30:00.000Z"),
    state: "pending_release" as PublishProcessStateV1,
    schedule,
    authorizing_role_current: true,
    edit_hold_active: false,
    has_unsaved_revision: false,
    policy_head_current: 5,
    quick_adjust_active: false,
  };

  it("attempts only inside the window", () => {
    expect(evaluateSchedulerAttempt(base)).toEqual({ status: "attempt" });
    expect(
      evaluateSchedulerAttempt({ ...base, now: new Date("2026-08-01T08:59:00.000Z") }),
    ).toEqual({ status: "wait", reason_code: "before_scheduled_at" });
    expect(
      evaluateSchedulerAttempt({ ...base, now: new Date("2026-08-01T11:00:00.000Z") }),
    ).toEqual({ status: "missed", reason_code: "past_cutoff" });
  });

  it("skips rather than publishing an old revision or swapping the authorizing teacher", () => {
    for (const [override, reason] of [
      [{ edit_hold_active: true }, "edit_hold_active"],
      [{ has_unsaved_revision: true }, "unsaved_revision"],
      [{ authorizing_role_current: false }, "authorizing_role_lapsed"],
      [{ policy_head_current: 6 }, "policy_drift"],
      [{ quick_adjust_active: true }, "quick_adjust_active"],
      [{ state: "draft" as PublishProcessStateV1 }, "not_queued"],
      [{ state: "released" as PublishProcessStateV1 }, "not_queued"],
    ] as const) {
      expect(evaluateSchedulerAttempt({ ...base, ...override }), reason).toEqual({
        status: "skip",
        reason_code: reason,
      });
    }
  });

  it("reports a missed send before it inspects any other drift", () => {
    // Past the cutoff the card stays queued and surfaces attention; it is never
    // rolled to the next day and never published late at night.
    expect(
      evaluateSchedulerAttempt({
        ...base,
        now: new Date("2026-08-01T23:00:00.000Z"),
        edit_hold_active: true,
      }),
    ).toEqual({ status: "missed", reason_code: "past_cutoff" });
  });
});
