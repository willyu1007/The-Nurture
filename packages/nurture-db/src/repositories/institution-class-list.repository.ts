import type { PrismaClient } from "@prisma/client";
import type {
  NurtureAggregateMember,
  NurtureClassPendingCounts,
  NurtureInstitutionClassListRepository,
} from "@the-nurture/scenario/harness";

/**
 * G4-B increment 3 — the Admin class list read, over stored rows.
 *
 * Read-only by construction: this class has no method that writes, and the
 * port it implements declares none.
 */
export class PrismaInstitutionClassListRepository
  implements NurtureInstitutionClassListRepository
{
  constructor(private readonly prisma: PrismaClient) {}

  private static day(localDate: string): Date {
    return new Date(`${localDate}T00:00:00.000Z`);
  }

  /**
   * The classes an Admin sees, with the two stable attributes the order is
   * derived from. Deliberately NOT ordered here: 0C-5 §6's rule belongs in one
   * place, and a database `ORDER BY` alongside it would be a second ordering
   * that could disagree — including by collation, which differs from the
   * domain's own comparison.
   */
  async listClasses(input: { workspace_id: string; institution_ref: string }) {
    const rows = await this.prisma.nurtureCareGroup.findMany({
      where: {
        workspaceId: input.workspace_id,
        institutionId: input.institution_ref,
        status: "active",
        deletedAt: null,
      },
      select: { id: true, ageBandKey: true, name: true },
    });
    return rows.map((row) => ({
      care_group_ref: row.id,
      age_band_key: row.ageBandKey,
      name: row.name,
      safe_class_label: row.name,
    }));
  }

  async loadClassAttendance(input: {
    workspace_id: string;
    care_group_ref: string;
    local_date: string;
  }): Promise<
    | { state: "unsubmitted" }
    | { state: "submitted" | "reopened"; entries: Array<{ member_ref: string; present: boolean }> }
  > {
    const row = await this.prisma.nurtureDailyAttendanceSubmission.findFirst({
      where: {
        workspaceId: input.workspace_id,
        careGroupId: input.care_group_ref,
        localDate: PrismaInstitutionClassListRepository.day(input.local_date),
        deletedAt: null,
      },
      include: { entries: { select: { childCareProcessId: true, state: true } } },
    });
    // No row IS unsubmitted, and it carries no entries to summarize — which is
    // why the Admin sees "awaiting the teacher's confirmation" and no number.
    if (!row) return { state: "unsubmitted" };
    return {
      state: row.state,
      entries: row.entries.map((entry) => ({
        member_ref: entry.childCareProcessId,
        // Only `present` counts as present. `excused_absent` and
        // `not_expected` are not attendance in the sense a count means, and
        // folding either into the figure would overstate the class.
        present: entry.state === "present",
      })),
    };
  }

  /**
   * The population and its grant terms, in the shape the aggregate rule needs.
   * Population is scope — a current enrolment in this class — never a
   * protected fact, per 0C-5 §5.
   */
  async loadAttendanceReadPopulation(input: {
    workspace_id: string;
    institution_ref: string;
    care_group_ref: string;
    local_date: string;
  }): Promise<NurtureAggregateMember[]> {
    const at = PrismaInstitutionClassListRepository.day(input.local_date);
    const enrollments = await this.prisma.nurtureEnrollment.findMany({
      where: {
        workspaceId: input.workspace_id,
        institutionId: input.institution_ref,
        careGroupId: input.care_group_ref,
        status: "active",
        deletedAt: null,
      },
      orderBy: { id: "asc" },
    });
    if (enrollments.length === 0) return [];

    const grants = await this.prisma.nurtureChildLinkGrant.findMany({
      where: {
        workspaceId: input.workspace_id,
        childCareProcessId: { in: enrollments.map((row) => row.childCareProcessId) },
        deletedAt: null,
      },
      orderBy: { updatedAt: "desc" },
    });

    return enrollments.map((enrollment) => {
      const scoped = grants.filter(
        (grant) =>
          grant.childCareProcessId === enrollment.childCareProcessId &&
          ((grant.grantedToScopeType === "care_group" &&
            grant.grantedToScopeId === enrollment.careGroupId) ||
            (grant.grantedToScopeType === "institution" &&
              grant.grantedToScopeId === enrollment.institutionId) ||
            (grant.grantedToScopeType === "enrollment" &&
              grant.grantedToScopeId === enrollment.id)),
      );
      // Grant currency, not the lifecycle conjunction — 0G finding 3, since
      // ChildLinkGrant has status and no deletedAt.
      const current = scoped.filter(
        (grant) =>
          grant.status === "active" &&
          !grant.revokedAt &&
          (!grant.effectiveFrom || grant.effectiveFrom <= at) &&
          (!grant.expiresAt || grant.expiresAt > at),
      );
      const revoked = scoped.find((grant) => grant.status === "revoked" || grant.revokedAt);
      return {
        member_ref: enrollment.childCareProcessId,
        grant_state: (current.length > 0 ? "active" : revoked ? "revoked" : "missing") as
          | "active"
          | "revoked"
          | "missing",
        grant_terms: current.map((grant) => ({
          directions: grant.directions,
          data_classes: grant.dataClasses,
          purposes: grant.purposes,
        })),
      };
    });
  }

  /**
   * The Admin's own outstanding work at this entry point — not a measure of
   * the class or the teacher (0C-5 §6). Each count is of work items, not of
   * members, which is why none of them runs through the aggregate rule.
   */
  async loadPendingCounts(input: {
    workspace_id: string;
    care_group_ref: string;
    local_date: string;
  }): Promise<NurtureClassPendingCounts> {
    const day = PrismaInstitutionClassListRepository.day(input.local_date);
    const dayEnd = new Date(day.getTime() + 86_400_000);
    const [awaiting_response, new_family_feedback, institution_action_needed] = await Promise.all([
      this.prisma.nurtureFamilyCareItem.count({
        where: {
          workspaceId: input.workspace_id,
          careGroupId: input.care_group_ref,
          status: { in: ["open", "acknowledged", "waiting_for_family"] },
          requiresReply: true,
        },
      }),
      this.prisma.nurtureFamilyCareItem.count({
        where: {
          workspaceId: input.workspace_id,
          careGroupId: input.care_group_ref,
          status: "open",
          createdAt: { gte: day, lt: dayEnd },
        },
      }),
      this.prisma.nurtureTeacherAttentionItem.count({
        where: {
          workspaceId: input.workspace_id,
          careGroupId: input.care_group_ref,
          status: "active",
        },
      }),
    ]);
    return { awaiting_response, new_family_feedback, institution_action_needed };
  }
}
