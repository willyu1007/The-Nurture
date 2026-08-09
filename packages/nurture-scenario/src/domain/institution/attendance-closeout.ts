import type { NurtureCommandSpec } from "../commands/command-kernel.js";
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
 * The head and state a legal command lands on.
 *
 * Shared by the decision and the write so the two cannot disagree about what
 * "next" means. The write runs inside the same Serializable transaction as the
 * decision, so re-deciding there would be a second copy of the rule rather
 * than a safety check — and a copy is what drifts.
 */
export const nextAttendanceHead = (
  command: NurtureAttendanceCommand,
  current: NurtureAttendanceCurrentState,
): { next_head: number; next_state: "submitted" | "reopened" } => ({
  next_head: current.kind === "unsubmitted" ? 1 : current.submission_head + 1,
  next_state:
    command.kind === "reopen" || (command.kind === "revise" && current.kind === "reopened")
      ? "reopened"
      : "submitted",
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
      return { status: "allowed", ...nextAttendanceHead(command, current) };

    case "revise":
      if (current.kind === "unsubmitted") return denyAuthority("not_authorized");
      // 0D-1 §5: same-day revision is direct; after the day has passed a class
      // caregiver cannot revise until an Admin reopens. A `reopened` row is
      // revisable regardless of day, which is what the reopen was for.
      if (!authority.is_same_day && current.kind !== "reopened") {
        return denyAuthority("not_authorized");
      }
      return { status: "allowed", ...nextAttendanceHead(command, current) };

    case "reopen":
      if (current.kind === "unsubmitted") return denyAuthority("not_authorized");
      // Reopen changes no entry. It increments the head so a client holding
      // the pre-reopen value is refused and must reload — without that,
      // reopening would silently widen the window a stale client can write in.
      return { status: "allowed", ...nextAttendanceHead(command, current) };
  }
};


/**
 * The owner write port, inside the command transaction.
 *
 * Reads and the write live in one transaction on purpose: the decision above
 * is made against state read inside the same Serializable transaction that
 * writes, so no window exists between them for another writer to slip into.
 */
export type NurtureAttendanceCommandTransaction = {
  loadAttendanceAuthority(input: {
    workspace_id: string;
    role_assignment_ref: string;
    care_group_ref: string;
    local_date: string;
  }): Promise<NurtureAttendanceAuthority | null>;
  loadAttendanceCurrent(input: {
    workspace_id: string;
    care_group_ref: string;
    local_date: string;
  }): Promise<NurtureAttendanceCurrentState>;
  applyAttendanceCommand(input: {
    workspace_id: string;
    care_group_ref: string;
    local_date: string;
    role_assignment_ref: string;
    command: NurtureAttendanceCommand;
    next_head: number;
    next_state: "submitted" | "reopened";
    expected_head: number;
  }): Promise<{ committed: boolean; submission_ref: string; submission_head: number }>;
};

export type NurtureAttendanceCommandPayload = {
  workspace_id: string;
  care_group_ref: string;
  local_date: string;
  role_assignment_ref: string;
  expected_head: number;
  /** Absent for `reopen`, which changes no entry. */
  entries?: NurtureAttendanceEntryInput[];
};

const attendanceCommandOf = (
  kind: "submit" | "revise" | "reopen",
  payload: NurtureAttendanceCommandPayload,
): NurtureAttendanceCommand =>
  kind === "reopen" ? { kind } : { kind, entries: payload.entries ?? [] };

/**
 * Builds one of the three specs. They differ only in the command they carry,
 * so the authority, concurrency and write rules exist once — three specs with
 * three copies of the same precondition would be three chances to drift.
 *
 * Idempotency is the runner's, not this spec's: the same
 * `command_request_id` returns the first execution's result and writes
 * nothing further, which is 0D-1 §5's exact-replay requirement.
 */
const attendanceCommandSpec = (
  kind: "submit" | "revise" | "reopen",
): NurtureCommandSpec<NurtureAttendanceCommandPayload> => ({
  command_key: `nurture.${kind}_daily_attendance`,
  command_scope: "care_group",
  contract_version: 1,
  canonicalize: (input) => ({
    care_group_ref: input.care_group_ref,
    local_date: input.local_date,
    role_assignment_ref: input.role_assignment_ref,
    expected_head: input.expected_head,
    // Entry order must not change the command identity: the same set of
    // per-child states is the same command however the client listed them.
    entries: [...(input.entries ?? [])]
      .map((entry) => ({
        child_process_ref: entry.child_process_ref,
        state: entry.state,
        adjusted_from_inference: entry.adjusted_from_inference ?? false,
      }))
      .sort((left, right) => left.child_process_ref.localeCompare(right.child_process_ref)),
  }),
  async checkPreconditions(transaction, input) {
    const attendance = transaction.attendance;
    if (!attendance) return { status: "invalid", reason_code: "attendance_owner_unavailable" };
    const authority = await attendance.loadAttendanceAuthority({
      workspace_id: input.workspace_id,
      role_assignment_ref: input.role_assignment_ref,
      care_group_ref: input.care_group_ref,
      local_date: input.local_date,
    });
    // No resolvable assignment is indistinguishable from one that does not
    // cover this class on this date.
    if (!authority) return { status: "blocked", reason_code: "not_authorized" };
    const current = await attendance.loadAttendanceCurrent({
      workspace_id: input.workspace_id,
      care_group_ref: input.care_group_ref,
      local_date: input.local_date,
    });
    const decision = decideAttendanceCommand({
      command: attendanceCommandOf(kind, input),
      current,
      expected_head: input.expected_head,
      authority,
    });
    if (decision.status === "denied") {
      // The refusal layer maps onto the kernel's own classes: an authority
      // refusal is `blocked`, a stale head is `conflict`. Neither is
      // `invalid`, which the kernel reserves for a malformed envelope.
      return decision.layer === "authority"
        ? { status: "blocked", reason_code: decision.reason_code }
        : { status: "conflict", reason_code: decision.reason_code };
    }
    return { status: "ready" };
  },
  async apply(transaction, input) {
    const attendance = transaction.attendance;
    if (!attendance) throw new Error("attendance owner adapter is not wired");
    // No re-decision here. `checkPreconditions` ran inside this same
    // Serializable transaction under the same advisory lock, so authority and
    // head cannot have moved between the two — a second authority read would
    // be a check for a state nothing can produce, which is the dead surface
    // 0G finding 2 warns about. The current state is read once because the
    // head to write is derived from it.
    const current = await attendance.loadAttendanceCurrent({
      workspace_id: input.workspace_id,
      care_group_ref: input.care_group_ref,
      local_date: input.local_date,
    });
    const command = attendanceCommandOf(kind, input);
    const next = nextAttendanceHead(command, current);
    const applied = await attendance.applyAttendanceCommand({
      workspace_id: input.workspace_id,
      care_group_ref: input.care_group_ref,
      local_date: input.local_date,
      role_assignment_ref: input.role_assignment_ref,
      command,
      next_head: next.next_head,
      next_state: next.next_state,
      expected_head: input.expected_head,
    });
    if (!applied.committed) throw new Error("attendance_write_conflict");
    return {
      output_refs: [
        {
          schema_version: 1,
          namespace: "nurture",
          object_type: "daily_attendance_submission",
          object_id: applied.submission_ref,
          version: applied.submission_head,
        },
      ],
      result_schema_version: 1,
      // Replay-stable: the same request id returns this, not a recomputation.
      committed_result: {
        submission_head: applied.submission_head,
        state: next.next_state,
      },
    };
  },
});

export const submitDailyAttendanceSpec = attendanceCommandSpec("submit");
export const reviseDailyAttendanceSpec = attendanceCommandSpec("revise");
export const reopenDailyAttendanceSpec = attendanceCommandSpec("reopen");
