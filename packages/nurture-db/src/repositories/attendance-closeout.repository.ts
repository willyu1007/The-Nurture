import type { Prisma } from "@prisma/client";
import type {
  NurtureAttendanceAuthority,
  NurtureAttendanceCommandTransaction,
  NurtureAttendanceCurrentState,
} from "@the-nurture/scenario/harness";

/**
 * G4-B increment 1 — the daily attendance closeout, over stored rows.
 *
 * The repository holds no rule: it reads current state and authority facts,
 * and applies a decision made elsewhere. What it does own is making the
 * storage layer agree with that decision under concurrency, which is why every
 * write is conditional on the head it read.
 */
export class PrismaAttendanceTransaction implements NurtureAttendanceCommandTransaction {
  constructor(private readonly transaction: Prisma.TransactionClient) {}

  /** A DATE column compares by day; the time component would defeat that. */
  private static day(localDate: string): Date {
    return new Date(`${localDate}T00:00:00.000Z`);
  }

  async loadAttendanceCurrent(input: {
    workspace_id: string;
    care_group_ref: string;
    local_date: string;
  }): Promise<NurtureAttendanceCurrentState> {
    const row = await this.transaction.nurtureDailyAttendanceSubmission.findFirst({
      where: {
        workspaceId: input.workspace_id,
        careGroupId: input.care_group_ref,
        localDate: PrismaAttendanceTransaction.day(input.local_date),
        deletedAt: null,
      },
      select: { state: true, submissionHead: true, localDate: true },
    });
    // No row IS `unsubmitted` — 0D-1's default, and the reason the stored enum
    // carries no such member.
    if (!row) return { kind: "unsubmitted" };
    return {
      kind: row.state,
      submission_head: row.submissionHead,
      local_date: row.localDate.toISOString().slice(0, 10),
    };
  }

  /**
   * 0D-1 §4. The assignment must have covered this class **on that date**, so
   * the window test uses the day being closed out rather than now. A teacher
   * who changed classes yesterday cannot submit yesterday from today's
   * assignment, and one whose assignment ended cannot reopen the past.
   */
  async loadAttendanceAuthority(input: {
    workspace_id: string;
    role_assignment_ref: string;
    care_group_ref: string;
    local_date: string;
  }): Promise<NurtureAttendanceAuthority | null> {
    const day = PrismaAttendanceTransaction.day(input.local_date);
    const role = await this.transaction.nurtureCareRoleAssignment.findFirst({
      where: {
        id: input.role_assignment_ref,
        workspaceId: input.workspace_id,
        status: "active",
        deletedAt: null,
      },
      select: { role: true, scopeType: true, scopeId: true, startsAt: true, endsAt: true },
    });
    if (!role) return null;

    const withinWindow =
      (!role.startsAt || role.startsAt <= day) && (!role.endsAt || role.endsAt > day);

    // The class test differs by scope type on purpose. A caregiver is bound to
    // the class itself; an Admin reaches it through the institution, which is
    // the scope 0C-2 established and the only one reopen needs.
    let coversClass = false;
    if (role.scopeType === "care_group") {
      coversClass = role.scopeId === input.care_group_ref;
    } else if (role.scopeType === "institution") {
      coversClass = Boolean(
        await this.transaction.nurtureCareGroup.findFirst({
          where: {
            id: input.care_group_ref,
            workspaceId: input.workspace_id,
            institutionId: role.scopeId,
          },
          select: { id: true },
        }),
      );
    }

    const today = new Date().toISOString().slice(0, 10);
    return {
      role_kind: role.role,
      assignment_current_on_date: withinWindow && coversClass,
      is_same_day: input.local_date === today,
    };
  }

  async applyAttendanceCommand(
    input: Parameters<NurtureAttendanceCommandTransaction["applyAttendanceCommand"]>[0],
  ): Promise<{ committed: boolean; submission_ref: string; submission_head: number }> {
    const day = PrismaAttendanceTransaction.day(input.local_date);
    const now = new Date();
    const tx = this.transaction;
    if (input.command.kind === "submit") {
      // The unique index on (workspace, class, date) is the race decider. Two
      // callers that both read "no row" arrive here together and exactly one
      // create succeeds; the other raises P2002. The kernel's Serializable
      // isolation would also catch it, but as a retryable abort rather than
      // the business answer "someone already confirmed this day".
      const created = await tx.nurtureDailyAttendanceSubmission.create({
        data: {
          workspaceId: input.workspace_id,
          careGroupId: input.care_group_ref,
          localDate: day,
          state: "submitted",
          submissionHead: input.next_head,
          submittedByRoleAssignmentId: input.role_assignment_ref,
          submittedAt: now,
        },
      });
      await tx.nurtureAttendanceEntry.createMany({
        data: (input.command.entries ?? []).map((entry) => ({
          workspaceId: input.workspace_id,
          submissionId: created.id,
          childCareProcessId: entry.child_process_ref,
          state: entry.state,
          adjustedFromInference: entry.adjusted_from_inference ?? false,
        })),
      });
      return { committed: true, submission_ref: created.id, submission_head: created.submissionHead };
    }

    // revise and reopen are conditional updates: the head must still be what
    // the decision was made against. `updateMany` returning 0 means another
    // writer moved it between the read and the write — the same answer a stale
    // expected_head gets, never a merge.
    const updated = await tx.nurtureDailyAttendanceSubmission.updateMany({
      where: {
        workspaceId: input.workspace_id,
        careGroupId: input.care_group_ref,
        localDate: day,
        submissionHead: input.expected_head,
        deletedAt: null,
      },
      data: {
        state: input.next_state,
        submissionHead: input.next_head,
        ...(input.command.kind === "reopen"
          ? { reopenedByRoleAssignmentId: input.role_assignment_ref, reopenedAt: now }
          : {}),
      },
    });
    if (updated.count === 0) {
      return { committed: false, submission_ref: "", submission_head: input.expected_head };
    }
    const row = await tx.nurtureDailyAttendanceSubmission.findFirstOrThrow({
      where: {
        workspaceId: input.workspace_id,
        careGroupId: input.care_group_ref,
        localDate: day,
      },
      select: { id: true },
    });
    if (input.command.kind === "revise") {
      // Entries are replaced wholesale: a revision submits the class's full
      // state, so a child dropped from the list is a removal the teacher made
      // rather than one left behind from the prior head.
      await tx.nurtureAttendanceEntry.deleteMany({
        where: { workspaceId: input.workspace_id, submissionId: row.id },
      });
      await tx.nurtureAttendanceEntry.createMany({
        data: (input.command.entries ?? []).map((entry) => ({
          workspaceId: input.workspace_id,
          submissionId: row.id,
          childCareProcessId: entry.child_process_ref,
          state: entry.state,
          adjustedFromInference: entry.adjusted_from_inference ?? false,
        })),
      });
    }
    return { committed: true, submission_ref: row.id, submission_head: input.next_head };
  }
}
