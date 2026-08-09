import { describe, expect, it } from "vitest";
import {
  DAILY_ATTENDANCE_CLOSEOUT_POLICY_REF,
  decideAttendanceCommand,
  resolveAttendanceCheckpoint,
  type NurtureAttendanceAuthority,
  type NurtureAttendanceCommand,
  type NurtureAttendanceCurrentState,
} from "../../src/index.js";

/**
 * G4-B increment 1 — 0D-1's write path.
 *
 * The frozen rules that are easiest to lose are the ones asserted here: an
 * Admin can reopen and nothing else, a teacher's assignment is tested against
 * the day being closed rather than today, and `unsubmitted` never settles
 * itself.
 */

const authority = (
  overrides: Partial<NurtureAttendanceAuthority> = {},
): NurtureAttendanceAuthority => ({
  role_kind: "caregiver",
  assignment_current_on_date: true,
  is_same_day: true,
  ...overrides,
});

const entries = [{ child_process_ref: "process-1", state: "present" as const }];
const submit: NurtureAttendanceCommand = { kind: "submit", entries };
const revise: NurtureAttendanceCommand = { kind: "revise", entries };
const reopen: NurtureAttendanceCommand = { kind: "reopen" };

const submitted = (submission_head = 1): NurtureAttendanceCurrentState => ({
  kind: "submitted",
  submission_head,
  local_date: "2026-08-09",
});
const reopened = (submission_head = 2): NurtureAttendanceCurrentState => ({
  kind: "reopened",
  submission_head,
  local_date: "2026-08-09",
});
const unsubmitted: NurtureAttendanceCurrentState = { kind: "unsubmitted" };

const decide = (
  command: NurtureAttendanceCommand,
  current: NurtureAttendanceCurrentState,
  expected_head: number,
  auth: NurtureAttendanceAuthority = authority(),
) => decideAttendanceCommand({ command, current, expected_head, authority: auth });

describe("0D-1 attendance closeout decision (G4-B increment 1)", () => {
  it("submits an unsubmitted day at head 0 and lands on head 1", () => {
    expect(decide(submit, unsubmitted, 0)).toEqual({
      status: "allowed",
      next_head: 1,
      next_state: "submitted",
    });
  });

  /**
   * The open point 0D-1 closed. `submit` carries the precondition `revise`
   * already had, so the second of two concurrent submits is refused rather
   * than overwriting a colleague's confirmation — a confirmation the second
   * teacher could not have seen, because their preview predates it.
   */
  it("refuses a second submit once the day has a submission", () => {
    // The second caller still believes the day is unsubmitted.
    expect(decide(submit, submitted(), 0)).toMatchObject({
      status: "denied",
      layer: "concurrency",
      reason_code: "conflict",
    });
    // And with a correct head, `submit` is still the wrong command.
    expect(decide(submit, submitted(), 1)).toMatchObject({ reason_code: "conflict" });
  });

  it("refuses every command whose expected head has moved", () => {
    expect(decide(revise, submitted(3), 2)).toMatchObject({ reason_code: "conflict" });
    expect(decide(reopen, submitted(3), 2, authority({ role_kind: "institution_admin" })))
      .toMatchObject({ reason_code: "conflict" });
  });

  it("denies an Admin submit and entry revision, and admits only their reopen", () => {
    const admin = authority({ role_kind: "institution_admin" });
    expect(decide(submit, unsubmitted, 0, admin)).toMatchObject({
      layer: "authority",
      reason_code: "not_authorized",
    });
    expect(decide(revise, submitted(), 1, admin)).toMatchObject({
      reason_code: "not_authorized",
    });
    expect(decide(reopen, submitted(), 1, admin)).toEqual({
      status: "allowed",
      next_head: 2,
      next_state: "reopened",
    });
  });

  it("denies a caregiver reopen, which is the Admin's alone", () => {
    expect(decide(reopen, submitted(), 1)).toMatchObject({ reason_code: "not_authorized" });
  });

  it("denies every role that is neither caregiver nor admin", () => {
    for (const role_kind of ["guardian", "system_operator"] as const) {
      expect(decide(submit, unsubmitted, 0, authority({ role_kind })), role_kind).toMatchObject({
        reason_code: "not_authorized",
      });
    }
  });

  /**
   * 0D-1 §4: current for that class ON THAT DATE, not merely current now. A
   * teacher who changed classes cannot close out the day they no longer
   * covered.
   */
  it("denies a writer whose assignment did not cover the class on that date", () => {
    const moved = authority({ assignment_current_on_date: false });
    expect(decide(submit, unsubmitted, 0, moved)).toMatchObject({
      reason_code: "not_authorized",
    });
    expect(decide(revise, submitted(), 1, moved)).toMatchObject({
      reason_code: "not_authorized",
    });
  });

  it("allows same-day revision directly and denies it once the day has passed", () => {
    expect(decide(revise, submitted(), 1)).toEqual({
      status: "allowed",
      next_head: 2,
      next_state: "submitted",
    });
    expect(decide(revise, submitted(), 1, authority({ is_same_day: false }))).toMatchObject({
      reason_code: "not_authorized",
    });
  });

  it("allows cross-day revision only after a reopen, and keeps the row reopened", () => {
    const crossDay = authority({ is_same_day: false });
    expect(decide(revise, reopened(2), 2, crossDay)).toEqual({
      status: "allowed",
      next_head: 3,
      next_state: "reopened",
    });
  });

  it("increments the head on reopen, so a pre-reopen client is refused", () => {
    const admin = authority({ role_kind: "institution_admin" });
    const afterReopen = decide(reopen, submitted(1), 1, admin);
    expect(afterReopen).toMatchObject({ next_head: 2 });
    // The teacher still holding head 1 must reload rather than write.
    expect(decide(revise, reopened(2), 1, authority({ is_same_day: false }))).toMatchObject({
      reason_code: "conflict",
    });
  });

  it("never settles an unsubmitted day by revising or reopening it", () => {
    expect(decide(revise, unsubmitted, 0)).toMatchObject({ reason_code: "not_authorized" });
    expect(
      decide(reopen, unsubmitted, 0, authority({ role_kind: "institution_admin" })),
    ).toMatchObject({ reason_code: "not_authorized" });
  });

  it("separates the authority and concurrency refusal layers", () => {
    // 0G 0D finding 1: `conflict` is a command-execution status and
    // `not_authorized` is an authority code. They are never the same field.
    const authorityDenial = decide(submit, unsubmitted, 0, authority({ role_kind: "guardian" }));
    const concurrencyDenial = decide(revise, submitted(2), 1);
    expect(authorityDenial).toMatchObject({ layer: "authority" });
    expect(concurrencyDenial).toMatchObject({ layer: "concurrency" });
  });
});

describe("0D-1 attendance checkpoint owner policy", () => {
  const policy = {
    contract_version: "1.0.0" as const,
    policy_ref: DAILY_ATTENDANCE_CLOSEOUT_POLICY_REF,
    policy_revision: 1,
    workspace_id: "workspace-1",
    institution_ref: "institution-1",
    care_group_ref: "class-1",
    checkpoint_local_time: "17:30",
    effective_from: "2026-01-01T00:00:00.000Z",
    changed_by_role_assignment_ref: "role-1",
    change_reason: "Set the daily closeout checkpoint.",
  };

  it("resolves the configured class/date wall clock to one canonical instant", () => {
    expect(
      resolveAttendanceCheckpoint({
        policy,
        local_date: "2026-08-09",
        time_zone: "Asia/Shanghai",
        at: new Date("2026-08-09T12:00:00.000Z"),
      }),
    ).toEqual({ status: "resolved", checkpoint_at: "2026-08-09T09:30:00.000Z" });
  });

  it("refuses malformed, expired and nonexistent wall-clock configurations", () => {
    expect(
      resolveAttendanceCheckpoint({
        policy: { ...policy, checkpoint_local_time: "24:00" },
        local_date: "2026-08-09",
        time_zone: "Asia/Shanghai",
        at: new Date("2026-08-09T12:00:00.000Z"),
      }),
    ).toMatchObject({ status: "unavailable" });
    expect(
      resolveAttendanceCheckpoint({
        policy: { ...policy, effective_to: "2026-08-09T11:00:00.000Z" },
        local_date: "2026-08-09",
        time_zone: "Asia/Shanghai",
        at: new Date("2026-08-09T12:00:00.000Z"),
      }),
    ).toMatchObject({ status: "unavailable" });
    expect(
      resolveAttendanceCheckpoint({
        policy: {
          ...policy,
          checkpoint_local_time: "02:30",
        },
        local_date: "2026-03-08",
        time_zone: "America/New_York",
        at: new Date("2026-03-08T12:00:00.000Z"),
      }),
    ).toEqual({
      status: "unavailable",
      reason_code: "checkpoint_wall_clock_unavailable",
    });
  });
});
