import type { NurturePolicyReasonCode } from "./institution-context.js";

/**
 * G4-B increment 1 — the daily attendance closeout write path, frozen by 0D-1
 * (26-g4-0d-1-attendance-closeout-freeze.md).
 *
 * The decision is pure so the whole state space is reachable from unit tests,
 * and so the repository holds no rule of its own. The repository reads current
 * state and writes the outcome; which outcome is legal is decided here.
 */

/** 0D-1 §3. Four states, closed. */
export const NURTURE_ATTENDANCE_ENTRY_STATES = [
  "present",
  "absent",
  "excused_absent",
  // A child with no enrolment on that date. Distinct from `absent`, which
  // asserts that someone expected them and they did not come.
  "not_expected",
] as const;

export type NurtureAttendanceEntryState = (typeof NURTURE_ATTENDANCE_ENTRY_STATES)[number];

export type NurtureAttendanceEntryInput = {
  child_process_ref: string;
  state: NurtureAttendanceEntryState;
  adjusted_from_inference?: boolean;
};

/**
 * What the repository read. `absent` here means the day has no submission at
 * all, which 0D-1 defines as `unsubmitted` — the state an absent teacher
 * produces, and the one that must never settle itself.
 */
export type NurtureAttendanceCurrentState =
  | { kind: "unsubmitted" }
  | {
      kind: "submitted" | "reopened";
      submission_head: number;
      /** The local date the stored row carries, for the cross-day test. */
      local_date: string;
    };

export type NurtureAttendanceCommand =
  | { kind: "submit"; entries: NurtureAttendanceEntryInput[] }
  | { kind: "revise"; entries: NurtureAttendanceEntryInput[] }
  | { kind: "reopen" };

/**
 * Authority facts, all read from stored rows. `assignment_current_on_date` is
 * the one 0D-1 §4 is emphatic about: the test is whether the caregiver's
 * assignment covered that class **on that date**, not whether it is current
 * now. A teacher who moved classes yesterday may not submit yesterday's day
 * from today's assignment.
 */
export type NurtureAttendanceAuthority = {
  role_kind: "caregiver" | "lead_caregiver" | "institution_admin" | "guardian" | "system_operator";
  assignment_current_on_date: boolean;
  /** Whether the request's date is the class's own current local date. */
  is_same_day: boolean;
};

/**
 * Two refusal layers, kept apart deliberately.
 *
 * `authority` carries a `NurturePolicyReasonCode`, which is the
 * authority-decision vocabulary and nothing else. `concurrency` carries
 * `conflict`, which the command kernel already owns as an execution status —
 * squeezing it into the authority union would be a second spelling of
 * something that exists (0G 0D audit, finding 1).
 *
 * Input shape is a third layer and is absent here on purpose: an empty entry
 * list is a schema fault the admission step rejects, not a decision this
 * function makes.
 */
export type NurtureAttendanceDecision =
  | { status: "allowed"; next_head: number; next_state: "submitted" | "reopened" }
  | { status: "denied"; layer: "authority"; reason_code: NurturePolicyReasonCode }
  | { status: "denied"; layer: "concurrency"; reason_code: "conflict" };

const denyAuthority = (reason_code: NurturePolicyReasonCode): NurtureAttendanceDecision => ({
  status: "denied",
  layer: "authority",
  reason_code,
});

const denyConflict = (): NurtureAttendanceDecision => ({
  status: "denied",
  layer: "concurrency",
  reason_code: "conflict",
});

/**
 * 0D-1 §4 and §5.
 *
 * `expected_head` is carried by all three commands, `submit` supplying `0` to
 * mean "I believe this day is still unsubmitted". That is not a third rule: it
 * is the precondition `revise` already had, applied at the entry point that
 * lacked it, and it is what makes two concurrent submits resolve as one
 * winner. The storage layer's unique constraint on (class, date) is the same
 * rule again, for the case where both callers read "no row" simultaneously.
 */
export const decideAttendanceCommand = (input: {
  command: NurtureAttendanceCommand;
  current: NurtureAttendanceCurrentState;
  expected_head: number;
  authority: NurtureAttendanceAuthority;
}): NurtureAttendanceDecision => {
  const { command, current, expected_head, authority } = input;

  // 0D-1 §4. Admin may read, chase, return and reopen — never submit or edit
  // an entry. A dual-role user switches roles rather than unioning
  // permissions, so the role under test here is the one they selected.
  if (command.kind === "reopen") {
    if (authority.role_kind !== "institution_admin") return denyAuthority("not_authorized");
  } else if (authority.role_kind !== "caregiver" && authority.role_kind !== "lead_caregiver") {
    return denyAuthority("not_authorized");
  }

  // The class-assignment test applies to the writing roles only: an Admin
  // reopens by institution scope, which 0C-2 and 0C-3 already established.
  if (command.kind !== "reopen" && !authority.assignment_current_on_date) {
    return denyAuthority("not_authorized");
  }

  if (expected_head !== (current.kind === "unsubmitted" ? 0 : current.submission_head)) {
    return denyConflict();
  }

  switch (command.kind) {
    case "submit":
      // A day that already has a submission is revised, never re-submitted.
      // Reaching here with a stored row means the head matched, so the caller
      // knows the row exists and still called the wrong command.
      if (current.kind !== "unsubmitted") return denyConflict();
      return { status: "allowed", next_head: 1, next_state: "submitted" };

    case "revise":
      if (current.kind === "unsubmitted") return denyAuthority("not_authorized");
      // 0D-1 §5: same-day revision is direct; after the day has passed a class
      // caregiver cannot revise until an Admin reopens. A `reopened` row is
      // revisable regardless of day, which is what the reopen was for.
      if (!authority.is_same_day && current.kind !== "reopened") {
        return denyAuthority("not_authorized");
      }
      return {
        status: "allowed",
        next_head: current.submission_head + 1,
        next_state: current.kind === "reopened" ? "reopened" : "submitted",
      };

    case "reopen":
      if (current.kind === "unsubmitted") return denyAuthority("not_authorized");
      // Reopen changes no entry. It increments the head so a client holding
      // the pre-reopen value is refused and must reload — without that,
      // reopening would silently widen the window a stale client can write in.
      return {
        status: "allowed",
        next_head: current.submission_head + 1,
        next_state: "reopened",
      };
  }
};

/**
 * The write port. `loadCurrent` and `apply` are separate so the decision above
 * runs between them on facts the repository read, never on facts a caller
 * supplied.
 */
export type NurtureAttendanceRepository = {
  loadCurrent(input: {
    workspace_id: string;
    care_group_ref: string;
    local_date: string;
  }): Promise<NurtureAttendanceCurrentState>;
  /**
   * Reads the authority facts for this actor against this class AND this date.
   * The date is a parameter rather than "now" because 0D-1 §4 tests the
   * assignment as it stood on the day being closed out.
   */
  loadAuthority(input: {
    workspace_id: string;
    role_assignment_ref: string;
    care_group_ref: string;
    local_date: string;
  }): Promise<NurtureAttendanceAuthority | null>;
  apply(input: {
    workspace_id: string;
    care_group_ref: string;
    local_date: string;
    role_assignment_ref: string;
    command: NurtureAttendanceCommand;
    decision: Extract<NurtureAttendanceDecision, { status: "allowed" }>;
    expected_head: number;
  }): Promise<{ committed: boolean; submission_head: number }>;
};

export type NurtureAttendanceRequest = {
  workspace_id: string;
  care_group_ref: string;
  local_date: string;
  role_assignment_ref: string;
  expected_head: number;
  command: NurtureAttendanceCommand;
};

export type NurtureAttendanceOutcome =
  | { status: "committed"; submission_head: number; state: "submitted" | "reopened" }
  | { status: "denied"; layer: "authority"; reason_code: NurturePolicyReasonCode }
  | { status: "denied"; layer: "concurrency"; reason_code: "conflict" };

/**
 * The service. Reads, decides, writes — and treats a rejected write as a
 * conflict rather than an error.
 *
 * `apply` returning `committed: false` is the storage layer refusing on the
 * (class, date) unique constraint or on a head that moved between the read and
 * the write. Both mean another writer won the race, which is the same answer
 * `decideAttendanceCommand` gives for a stale head — so it is reported
 * identically rather than as a distinct failure a caller would have to handle
 * twice.
 */
export class NurtureAttendanceCloseoutService {
  constructor(private readonly repository: NurtureAttendanceRepository) {}

  async execute(request: NurtureAttendanceRequest): Promise<NurtureAttendanceOutcome> {
    const authority = await this.repository.loadAuthority({
      workspace_id: request.workspace_id,
      role_assignment_ref: request.role_assignment_ref,
      care_group_ref: request.care_group_ref,
      local_date: request.local_date,
    });
    // No resolvable assignment is indistinguishable from one that does not
    // cover this class on this date.
    if (!authority) return { status: "denied", layer: "authority", reason_code: "not_authorized" };

    const current = await this.repository.loadCurrent({
      workspace_id: request.workspace_id,
      care_group_ref: request.care_group_ref,
      local_date: request.local_date,
    });
    const decision = decideAttendanceCommand({
      command: request.command,
      current,
      expected_head: request.expected_head,
      authority,
    });
    if (decision.status === "denied") return decision;

    const applied = await this.repository.apply({
      workspace_id: request.workspace_id,
      care_group_ref: request.care_group_ref,
      local_date: request.local_date,
      role_assignment_ref: request.role_assignment_ref,
      command: request.command,
      decision,
      expected_head: request.expected_head,
    });
    if (!applied.committed) {
      return { status: "denied", layer: "concurrency", reason_code: "conflict" };
    }
    return {
      status: "committed",
      submission_head: applied.submission_head,
      state: decision.next_state,
    };
  }
}
