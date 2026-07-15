import type { PrismaClient } from "@prisma/client";
import type {
  ClassFamilyInboxItem,
  NurtureFamilyCareQueryRepository,
  TeacherAttentionCard,
} from "@the-nurture/scenario";
import { NurtureFamilyCareQueryAccessError } from "@the-nurture/scenario";

const currentRole = (row: {
  status: string;
  startsAt: Date | null;
  endsAt: Date | null;
}, at: Date): boolean =>
  row.status === "active" &&
  (!row.startsAt || row.startsAt <= at) &&
  (!row.endsAt || row.endsAt > at);

export class PrismaFamilyCareQueryRepository implements NurtureFamilyCareQueryRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private async authorizeCareGroup(input: {
    workspace_id: string;
    participant_id: string;
    role_assignment_id: string;
    care_group_id: string;
  }): Promise<boolean> {
    const [role, group] = await Promise.all([
      this.prisma.nurtureCareRoleAssignment.findFirst({
        where: {
          id: input.role_assignment_id,
          workspaceId: input.workspace_id,
          participantId: input.participant_id,
          deletedAt: null,
        },
        include: { participant: true },
      }),
      this.prisma.nurtureCareGroup.findFirst({
        where: {
          id: input.care_group_id,
          workspaceId: input.workspace_id,
          status: "active",
          deletedAt: null,
          institution: { status: "active", deletedAt: null },
        },
      }),
    ]);
    if (
      !role ||
      !group ||
      !currentRole(role, new Date()) ||
      role.participant.status !== "active" ||
      role.participant.deletedAt !== null
    ) {
      return false;
    }
    if (!["caregiver", "lead_caregiver", "institution_admin"].includes(role.role)) return false;
    if (role.scopeType === "care_group") return role.scopeId === group.id;
    if (role.scopeType === "institution") return role.scopeId === group.institutionId;
    if (role.scopeType === "enrollment") {
      return Boolean(
        await this.prisma.nurtureEnrollment.findFirst({
          where: {
            id: role.scopeId,
            workspaceId: input.workspace_id,
            careGroupId: group.id,
            status: "active",
            deletedAt: null,
            OR: [{ leftAt: null }, { leftAt: { gt: new Date() } }],
          },
          select: { id: true },
        }),
      );
    }
    return false;
  }

  private grantAllowsFamilyToOrg(
    row: {
      dataClass: string;
      careGroupId: string;
      thread: { status: string; deletedAt: Date | null };
      enrollment: {
        id: string;
        institutionId: string;
        status: string;
        leftAt: Date | null;
        deletedAt: Date | null;
      } | null;
      grant: {
        status: string;
        directions: string[];
        dataClasses: string[];
        effectiveFrom: Date | null;
        expiresAt: Date | null;
        revokedAt: Date | null;
        deletedAt: Date | null;
        grantedToScopeType: string;
        grantedToScopeId: string;
      } | null;
    },
    at: Date,
  ): boolean {
    const grant = row.grant;
    const grantTargetMatches = Boolean(
      grant &&
        row.enrollment &&
        ((grant.grantedToScopeType === "care_group" &&
          grant.grantedToScopeId === row.careGroupId) ||
          (grant.grantedToScopeType === "enrollment" &&
            grant.grantedToScopeId === row.enrollment.id) ||
          (grant.grantedToScopeType === "institution" &&
            grant.grantedToScopeId === row.enrollment.institutionId)),
    );
    return Boolean(
      row.enrollment?.status === "active" &&
        row.thread.status === "active" &&
        row.thread.deletedAt === null &&
        row.enrollment.deletedAt === null &&
        (!row.enrollment.leftAt || row.enrollment.leftAt > at) &&
        grant?.status === "active" &&
        grant.deletedAt === null &&
        !grant.revokedAt &&
        (!grant.effectiveFrom || grant.effectiveFrom <= at) &&
        (!grant.expiresAt || grant.expiresAt > at) &&
        grant.directions.includes("family_to_org") &&
        grant.dataClasses.includes(row.dataClass) &&
        grantTargetMatches,
    );
  }

  private async visibleItems(input: {
    workspace_id: string;
    care_group_id: string;
    ids?: string[];
    limit: number;
  }) {
    const rows = await this.prisma.nurtureFamilyCareItem.findMany({
      where: {
        workspaceId: input.workspace_id,
        careGroupId: input.care_group_id,
        ...(input.ids ? { id: { in: input.ids } } : {}),
        status: { in: ["open", "acknowledged", "waiting_for_family", "replied", "followed_up"] },
      },
      include: {
        enrollment: true,
        grant: true,
        thread: true,
        childCareProcess: { include: { child: { select: { displayName: true } } } },
      },
      orderBy: [{ dueAt: "asc" }, { updatedAt: "desc" }, { id: "asc" }],
      take: input.ids ? input.limit : Math.min(input.limit * 3, 300),
    });
    const sourceMessageIds = rows.flatMap((row) => (row.sourceMessageId ? [row.sourceMessageId] : []));
    const sourceMessages = sourceMessageIds.length
      ? await this.prisma.nurtureFamilyCareMessage.findMany({
          where: { workspaceId: input.workspace_id, id: { in: sourceMessageIds } },
          select: { id: true, status: true },
        })
      : [];
    const sourceStatus = new Map(sourceMessages.map((row) => [row.id, row.status]));
    const now = new Date();
    const urgencyOrder: Record<string, number> = {
      urgent_non_emergency: 0,
      time_sensitive: 1,
      today_attention: 2,
      normal: 3,
    };
    return rows
      .filter(
        (row) =>
          this.grantAllowsFamilyToOrg(row, now) &&
          (!row.sourceMessageId || sourceStatus.get(row.sourceMessageId) === "sent"),
      )
      .sort((left, right) => {
        const urgency = (urgencyOrder[left.urgency] ?? 99) - (urgencyOrder[right.urgency] ?? 99);
        if (urgency !== 0) return urgency;
        const due = (left.dueAt?.getTime() ?? Number.MAX_SAFE_INTEGER) -
          (right.dueAt?.getTime() ?? Number.MAX_SAFE_INTEGER);
        if (due !== 0) return due;
        const updated = right.updatedAt.getTime() - left.updatedAt.getTime();
        return updated !== 0 ? updated : left.id.localeCompare(right.id);
      })
      .slice(0, input.limit);
  }

  async listClassFamilyInbox(input: {
    workspace_id: string;
    participant_id: string;
    role_assignment_id: string;
    care_group_id: string;
    limit: number;
  }): Promise<ClassFamilyInboxItem[]> {
    if (!(await this.authorizeCareGroup(input))) throw new NurtureFamilyCareQueryAccessError();
    const rows = await this.visibleItems({
      workspace_id: input.workspace_id,
      care_group_id: input.care_group_id,
      limit: input.limit,
    });
    return rows.map((row) => ({
      item_id: row.id,
      child_care_process_id: row.childCareProcessId,
      child_display_name: row.childCareProcess.child.displayName,
      category: row.category,
      urgency: row.urgency,
      status: row.status,
      safe_summary: row.summary,
      requires_ack: row.requiresAck,
      requires_reply: row.requiresReply,
      version: row.version,
      updated_at: row.updatedAt.toISOString(),
    }));
  }

  async listTeacherAttentionBoard(input: {
    workspace_id: string;
    participant_id: string;
    role_assignment_id: string;
    care_group_id: string;
    on_date: string;
    limit: number;
  }): Promise<TeacherAttentionCard[]> {
    if (!(await this.authorizeCareGroup(input))) throw new NurtureFamilyCareQueryAccessError();
    const dayStart = new Date(`${input.on_date}T00:00:00.000Z`);
    const nextDay = new Date(dayStart.getTime() + 86_400_000);
    const rows = await this.prisma.nurtureTeacherAttentionItem.findMany({
      where: {
        workspaceId: input.workspace_id,
        careGroupId: input.care_group_id,
        status: "active",
        OR: [{ effectiveDate: null }, { effectiveDate: { lt: nextDay } }],
        AND: [{ OR: [{ expiresAt: null }, { expiresAt: { gt: dayStart } }] }],
      },
      include: { childCareProcess: { include: { child: { select: { displayName: true } } } } },
      orderBy: [{ effectiveDate: "asc" }, { updatedAt: "desc" }, { id: "asc" }],
      take: Math.min(input.limit * 3, 300),
    });
    const backingIds = rows.flatMap((row) =>
      row.sourceType === "family_care_item" && row.sourceId ? [row.sourceId] : [],
    );
    const visibleBacking = new Set(
      (
        await this.visibleItems({
          workspace_id: input.workspace_id,
          care_group_id: input.care_group_id,
          ids: backingIds,
          limit: Math.max(1, backingIds.length),
        })
      ).map((row) => row.id),
    );
    const priorityOrder: Record<string, number> = {
      urgent: 0,
      time_sensitive: 1,
      attention: 2,
      normal: 3,
    };
    return rows
      .filter(
        (row) =>
          row.sourceType !== "family_care_item" ||
          (row.sourceId !== null && visibleBacking.has(row.sourceId)),
      )
      .sort((left, right) => {
        const priority = (priorityOrder[left.priority] ?? 99) - (priorityOrder[right.priority] ?? 99);
        if (priority !== 0) return priority;
        const effective = (left.effectiveDate?.getTime() ?? 0) -
          (right.effectiveDate?.getTime() ?? 0);
        if (effective !== 0) return effective;
        return left.id.localeCompare(right.id);
      })
      .slice(0, input.limit)
      .map((row) => ({
        attention_item_id: row.id,
        child_care_process_id: row.childCareProcessId,
        child_display_name: row.childCareProcess.child.displayName,
        source_type: row.sourceType,
        ...(row.sourceId ? { source_id: row.sourceId } : {}),
        safe_title: row.title,
        ...(row.summary ? { safe_summary: row.summary } : {}),
        priority: row.priority,
        ...(row.effectiveDate ? { effective_date: row.effectiveDate.toISOString().slice(0, 10) } : {}),
        aggregate_version: row.aggregateVersion,
      }));
  }
}
