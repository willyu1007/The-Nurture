import { Prisma, type PrismaClient } from "@prisma/client";
import {
  type DirectorContextReadV1,
  type DirectorDrilldownKindV1,
  type DirectorDrilldownRowV1,
  type DirectorOverviewFactsV1,
  type DirectorOwnerReadV1,
  type DirectorPresenterExactAuthorityV1,
  type DirectorPresenterReadPortV1,
  type DirectorSourceReadV1,
  zonedLocalTimeToInstant,
} from "@the-nurture/scenario";
import { activeRoleWindow } from "./board-read-support.js";
import { loadInstitutionLocalDay } from "./institution-local-day.js";

type PrismaReader = PrismaClient | Prisma.TransactionClient;

const MAX_CLASSES = 100;
const MAX_ENROLLMENTS = 2_000;
const MAX_RESPONSE_ITEMS = 2_000;
const MAX_MESSAGES = 5_000;
const MAX_FOCUS_SCOPES = 2_000;

const current = <T>(value: T): DirectorSourceReadV1<T> => ({
  status: "current",
  value,
});
const sourceUnavailable = <T>(): DirectorSourceReadV1<T> => ({
  status: "unavailable",
});

export class PrismaDirectorPresenterReadRepository
implements DirectorPresenterReadPortV1 {
  constructor(private readonly prisma: PrismaClient) {}

  loadDirectorContext(input: {
    workspace_id: string;
    my_chat_user_id: string;
    at: Date;
  }): Promise<DirectorContextReadV1> {
    return this.prisma.$transaction(async (transaction) => {
      const participants = await transaction.nurtureParticipant.findMany({
        where: {
          workspaceId: input.workspace_id,
          myChatUserId: input.my_chat_user_id,
          status: "active",
          deletedAt: null,
        },
        orderBy: { id: "asc" },
        take: 2,
      });
      if (participants.length === 0) return { status: "access_changed" };
      if (participants.length !== 1) return { status: "ambiguous_institution" };
      const participant = participants[0]!;

      const roles = await transaction.nurtureCareRoleAssignment.findMany({
        where: {
          workspaceId: input.workspace_id,
          participantId: participant.id,
          role: "institution_admin",
          scopeType: "institution",
          ...activeRoleWindow(input.at),
        },
        orderBy: { id: "asc" },
        take: 2,
      });
      if (roles.length === 0) return { status: "access_changed" };
      if (roles.length !== 1) return { status: "ambiguous_institution" };
      const role = roles[0]!;

      const institution = await transaction.nurtureCareInstitution.findFirst({
        where: {
          id: role.scopeId,
          workspaceId: input.workspace_id,
          status: "active",
          deletedAt: null,
        },
      });
      if (!institution) return { status: "access_changed" };
      return {
        status: "resolved",
        facts: {
          participant_id: participant.id,
          participant_version: participant.aggregateVersion,
          role_assignment_id: role.id,
          role_version: role.aggregateVersion,
          institution_id: institution.id,
          institution_version: institution.aggregateVersion,
        },
      };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });
  }

  authorityIsCurrent(input: {
    workspace_id: string;
    authority: DirectorPresenterExactAuthorityV1;
    at: Date;
  }): Promise<boolean> {
    return this.prisma.$transaction(
      (transaction) => directorAuthorityIsCurrent(
        transaction,
        input.workspace_id,
        input.authority,
        input.at,
      ),
      { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
    );
  }

  async loadOverviewFacts(input: {
    workspace_id: string;
    authority: DirectorPresenterExactAuthorityV1;
    local_date: string;
    at: Date;
  }): Promise<DirectorOwnerReadV1<DirectorOverviewFactsV1>> {
    const day = await loadDirectorDay(this.prisma, {
      workspace_id: input.workspace_id,
      institution_id: input.authority.exact.institution_id,
      local_date: input.local_date,
      at: input.at,
    });
    return this.prisma.$transaction(async (transaction) => {
      if (!await directorAuthorityIsCurrent(
        transaction,
        input.workspace_id,
        input.authority,
        input.at,
      )) return { status: "scope_changed" };

      const institution = await transaction.nurtureCareInstitution.findFirst({
        where: {
          id: input.authority.exact.institution_id,
          workspaceId: input.workspace_id,
          aggregateVersion: input.authority.exact.institution_version,
          status: "active",
          deletedAt: null,
        },
        select: { displayName: true },
      });
      if (!institution) return { status: "scope_changed" };
      if (!day || day.start > input.at) {
        return {
          status: "current",
          value: allSourcesUnavailable(institution.displayName),
        };
      }
      const groups = await transaction.nurtureCareGroup.findMany({
        where: {
          workspaceId: input.workspace_id,
          institutionId: input.authority.exact.institution_id,
          status: "active",
          deletedAt: null,
        },
        orderBy: [{ name: "asc" }, { id: "asc" }],
        select: { id: true },
        take: MAX_CLASSES + 1,
      });
      if (groups.length > MAX_CLASSES) {
        return {
          status: "current",
          value: allSourcesUnavailable(institution.displayName),
        };
      }
      const groupIds = groups.map((group) => group.id);
      const trendStart = day.trend_windows[0]!.start;

      const enrollments = await transaction.nurtureEnrollment.findMany({
        where: activeInstitutionEnrollmentWhere(
          input.workspace_id,
          input.authority.exact.institution_id,
          groupIds,
        ),
        orderBy: { id: "asc" },
        select: { careGroupId: true, childCareProcessId: true },
        take: MAX_ENROLLMENTS + 1,
      });
      const enrollmentOverflow = enrollments.length > MAX_ENROLLMENTS;
      const boundedEnrollments = enrollments.slice(0, MAX_ENROLLMENTS);
      const processIds = [...new Set(
        boundedEnrollments.map((row) => row.childCareProcessId),
      )];
      const enrolledGroupIds = [...new Set(
        boundedEnrollments.map((row) => row.careGroupId),
      )];

      let attendance: DirectorOverviewFactsV1["attendance"];
      if (enrollmentOverflow || boundedEnrollments.length !== processIds.length) {
        attendance = sourceUnavailable();
      } else if (processIds.length === 0) {
        attendance = current({ present_count: 0, roster_count: 0 });
      } else {
        const submissions = await transaction.nurtureDailyAttendanceSubmission.findMany({
          where: {
            workspaceId: input.workspace_id,
            careGroupId: { in: enrolledGroupIds },
            localDate: day.storage_date,
            state: { in: ["submitted", "reopened"] },
            createdAt: { lte: input.at },
            updatedAt: { lte: input.at },
            deletedAt: null,
          },
          include: {
            entries: {
              where: {
                workspaceId: input.workspace_id,
                childCareProcessId: { in: processIds },
                createdAt: { lte: input.at },
                updatedAt: { lte: input.at },
              },
              select: { childCareProcessId: true, state: true },
            },
          },
          take: enrolledGroupIds.length + 1,
        });
        const rosterByGroup = groupSet(boundedEnrollments, "childCareProcessId");
        const submissionByGroup = new Map(
          submissions.map((submission) => [submission.careGroupId, submission] as const),
        );
        const present = new Set<string>();
        let complete = submissions.length === enrolledGroupIds.length;
        for (const groupId of enrolledGroupIds) {
          const roster = rosterByGroup.get(groupId) ?? new Set<string>();
          const entries = submissionByGroup.get(groupId)?.entries.filter(
            (entry) => roster.has(entry.childCareProcessId),
          ) ?? [];
          if (new Set(entries.map((entry) => entry.childCareProcessId)).size !== roster.size) {
            complete = false;
            break;
          }
          for (const entry of entries) {
            if (entry.state === "present") present.add(entry.childCareProcessId);
          }
        }
        attendance = complete
          ? current({ present_count: present.size, roster_count: processIds.length })
          : sourceUnavailable();
      }

      const activityCount = groupIds.length === 0
        ? 0
        : await transaction.nurtureActivityPlacement.count({
            where: {
              workspaceId: input.workspace_id,
              careGroupId: { in: groupIds },
              localDate: day.storage_date,
              state: "placed",
              createdAt: { lte: input.at },
              updatedAt: { lte: input.at },
            },
          });

      const responseItems = groupIds.length === 0
        ? []
        : await transaction.nurtureFamilyCareItem.findMany({
            where: {
              workspaceId: input.workspace_id,
              careGroupId: { in: groupIds },
              enrollment: {
                is: activeScopedEnrollmentRelation(
                  input.authority.exact.institution_id,
                  groupIds,
                ),
              },
              writerContract: "harness_g2_v1",
              lifecycleState: "active",
              requiresReply: true,
              responseState: { in: ["awaiting_reply", "responded"] },
              createdAt: { gte: day.start, lt: day.end, lte: input.at },
              updatedAt: { lte: input.at },
            },
            orderBy: { id: "asc" },
            select: { responseState: true },
            take: MAX_RESPONSE_ITEMS + 1,
          });
      const messageResponse = responseItems.length > MAX_RESPONSE_ITEMS
        ? sourceUnavailable<Readonly<{ responded_count: number; total_count: number }>>()
        : current({
            responded_count: responseItems.filter(
              (item) => item.responseState === "responded",
            ).length,
            total_count: responseItems.length,
          });

      const messages = groupIds.length === 0
        ? []
        : await transaction.nurtureFamilyCareMessage.findMany({
            where: {
              workspaceId: input.workspace_id,
              careGroupId: { in: groupIds },
              enrollment: {
                is: activeScopedEnrollmentRelation(
                  input.authority.exact.institution_id,
                  groupIds,
                ),
              },
              writerContract: "harness_g2_v1",
              status: "sent",
              direction: { in: ["family_to_org", "org_to_family"] },
              createdAt: { gte: trendStart, lt: day.end, lte: input.at },
              updatedAt: { lte: input.at },
            },
            orderBy: [{ createdAt: "asc" }, { id: "asc" }],
            select: { createdAt: true, direction: true },
            take: MAX_MESSAGES + 1,
          });
      const messageOverflow = messages.length > MAX_MESSAGES;
      const selectedDayMessages = messages.filter(
        (message) => message.createdAt >= day.start,
      );
      const flow = messageOverflow
        ? sourceUnavailable<Readonly<{
            home_to_kindergarten_count: number;
            kindergarten_to_home_count: number;
          }>>()
        : current({
            home_to_kindergarten_count: selectedDayMessages.filter(
              (message) => message.direction === "family_to_org",
            ).length,
            kindergarten_to_home_count: selectedDayMessages.filter(
              (message) => message.direction === "org_to_family",
            ).length,
          });
      const trend = messageOverflow
        ? sourceUnavailable<Readonly<{ points: readonly number[] }>>()
        : current({ points: dailyCounts(messages, day.trend_windows) });

      const authorizationCount = groupIds.length === 0
        ? 0
        : await transaction.nurtureChildLinkGrant.count({
            where: {
              workspaceId: input.workspace_id,
              enrollment: {
                is: activeScopedEnrollmentRelation(
                  input.authority.exact.institution_id,
                  groupIds,
                ),
              },
              updatedAt: { gte: day.start, lt: day.end, lte: input.at },
            },
          });

      const focusScopes = processIds.length === 0
        ? []
        : await transaction.nurtureFocusGoalChildScope.findMany({
            where: {
              workspaceId: input.workspace_id,
              childCareProcessId: { in: processIds },
              deletedAt: null,
              focusGoal: {
                updatedAt: { gte: day.start, lt: day.end, lte: input.at },
                focusCycle: {
                  workspaceId: input.workspace_id,
                  status: "active",
                  deletedAt: null,
                },
              },
            },
            orderBy: { id: "asc" },
            select: { childCareProcessId: true },
            take: MAX_FOCUS_SCOPES + 1,
          });
      const focus = focusScopes.length > MAX_FOCUS_SCOPES
        ? sourceUnavailable<Readonly<{ count: number }>>()
        : current({
            count: new Set(focusScopes.map((row) => row.childCareProcessId)).size,
          });

      return {
        status: "current",
        value: {
          organization_display_name: institution.displayName,
          attendance,
          activity: current({ count: activityCount }),
          message_response: messageResponse,
          home_kindergarten_flow: flow,
          authorization_changes: current({ count: authorizationCount }),
          trend,
          family_focus_attention: focus,
        },
      };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });
  }

  async loadDrilldownFacts(input: {
    workspace_id: string;
    authority: DirectorPresenterExactAuthorityV1;
    local_date: string;
    kind: Exclude<DirectorDrilldownKindV1, "class_load_attention">;
    take: number;
    at: Date;
  }): Promise<DirectorOwnerReadV1<Readonly<{
    organization_display_name: string;
    rows: readonly DirectorDrilldownRowV1[];
  }>>> {
    const day = await loadDirectorDay(this.prisma, {
      workspace_id: input.workspace_id,
      institution_id: input.authority.exact.institution_id,
      local_date: input.local_date,
      at: input.at,
    });
    return this.prisma.$transaction(async (transaction) => {
      if (!await directorAuthorityIsCurrent(
        transaction,
        input.workspace_id,
        input.authority,
        input.at,
      )) return { status: "scope_changed" };
      const institution = await transaction.nurtureCareInstitution.findFirst({
        where: {
          id: input.authority.exact.institution_id,
          workspaceId: input.workspace_id,
          aggregateVersion: input.authority.exact.institution_version,
          status: "active",
          deletedAt: null,
        },
        select: { displayName: true },
      });
      if (!institution) return { status: "scope_changed" };
      if (!day || day.start > input.at) return { status: "unavailable" };
      const groups = await transaction.nurtureCareGroup.findMany({
        where: {
          workspaceId: input.workspace_id,
          institutionId: input.authority.exact.institution_id,
          status: "active",
          deletedAt: null,
        },
        orderBy: [{ name: "asc" }, { id: "asc" }],
        select: { id: true, name: true },
        take: Math.min(input.take, 50),
      });
      const rows = await drilldownRows(
        transaction,
        input.workspace_id,
        input.authority.exact.institution_id,
        day,
        input.kind,
        groups,
        input.at,
      );
      return {
        status: "current",
        value: {
          organization_display_name: institution.displayName,
          rows,
        },
      };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });
  }
}

export async function directorAuthorityIsCurrent(
  transaction: PrismaReader,
  workspaceId: string,
  authority: DirectorPresenterExactAuthorityV1,
  at: Date,
): Promise<boolean> {
  const participant = await transaction.nurtureParticipant.count({
    where: {
      id: authority.exact.participant_id,
      workspaceId,
      aggregateVersion: authority.exact.participant_version,
      status: "active",
      deletedAt: null,
    },
  });
  if (participant !== 1) return false;
  const role = await transaction.nurtureCareRoleAssignment.count({
    where: {
      id: authority.exact.role_assignment_id,
      workspaceId,
      participantId: authority.exact.participant_id,
      aggregateVersion: authority.exact.role_version,
      role: "institution_admin",
      scopeType: "institution",
      scopeId: authority.exact.institution_id,
      ...activeRoleWindow(at),
    },
  });
  if (role !== 1) return false;
  const institution = await transaction.nurtureCareInstitution.count({
    where: {
      id: authority.exact.institution_id,
      workspaceId,
      aggregateVersion: authority.exact.institution_version,
      status: "active",
      deletedAt: null,
    },
  });
  return institution === 1;
}

const activeEnrollmentRelation = (institutionId: string) => ({
  institutionId,
  status: "active" as const,
  deletedAt: null,
  childCareProcess: { status: "active" as const, deletedAt: null },
});

const activeScopedEnrollmentRelation = (
  institutionId: string,
  groupIds: readonly string[],
) => ({
  ...activeEnrollmentRelation(institutionId),
  careGroupId: { in: [...groupIds] },
});

const activeInstitutionEnrollmentWhere = (
  workspaceId: string,
  institutionId: string,
  groupIds: readonly string[],
) => ({
  workspaceId,
  institutionId,
  careGroupId: { in: [...groupIds] },
  status: "active" as const,
  deletedAt: null,
  childCareProcess: { status: "active" as const, deletedAt: null },
});

const allSourcesUnavailable = (
  organizationDisplayName: string,
): DirectorOverviewFactsV1 => ({
  organization_display_name: organizationDisplayName,
  attendance: sourceUnavailable(),
  activity: sourceUnavailable(),
  message_response: sourceUnavailable(),
  home_kindergarten_flow: sourceUnavailable(),
  authorization_changes: sourceUnavailable(),
  trend: sourceUnavailable(),
  family_focus_attention: sourceUnavailable(),
});

type DirectorDayWindow = Readonly<{ start: Date; end: Date }>;
type DirectorDay = DirectorDayWindow & Readonly<{
  storage_date: Date;
  trend_windows: readonly DirectorDayWindow[];
}>;

const shiftedDateParts = (storageDate: Date, days: number) => {
  const shifted = new Date(storageDate.getTime() + days * 86_400_000);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
  };
};

const loadDirectorDay = async (
  prisma: PrismaClient,
  input: Readonly<{
    workspace_id: string;
    institution_id: string;
    local_date: string;
    at: Date;
  }>,
): Promise<DirectorDay | null> => {
  const localDay = await loadInstitutionLocalDay(prisma, input);
  if (!localDay) return null;
  const storageDate = new Date(localDay.storage_date);
  const trendWindows = Array.from({ length: 7 }, (_, index) => {
    const offset = index - 6;
    return {
      start: zonedLocalTimeToInstant(
        shiftedDateParts(storageDate, offset),
        0,
        localDay.time_zone,
      ),
      end: zonedLocalTimeToInstant(
        shiftedDateParts(storageDate, offset + 1),
        0,
        localDay.time_zone,
      ),
    };
  });
  return {
    storage_date: storageDate,
    start: new Date(localDay.occurred_from),
    end: new Date(localDay.occurred_before),
    trend_windows: trendWindows,
  };
};

const dailyCounts = (
  messages: readonly Readonly<{ createdAt: Date }>[],
  windows: readonly DirectorDayWindow[],
): number[] => windows.map((window) => messages.filter(
  (message) => message.createdAt >= window.start && message.createdAt < window.end,
).length);

type ClassRow = Readonly<{ id: string; name: string }>;

async function drilldownRows(
  transaction: Prisma.TransactionClient,
  workspaceId: string,
  institutionId: string,
  day: DirectorDay,
  kind: Exclude<DirectorDrilldownKindV1, "class_load_attention">,
  groups: readonly ClassRow[],
  at: Date,
): Promise<DirectorDrilldownRowV1[]> {
  const groupIds = groups.map((group) => group.id);
  const base = new Map(groups.map((group) => [group.id, group] as const));
  const values = new Map<string, { status: "current" | "unavailable"; primary: number; secondary?: number }>();

  if (kind === "attendance") {
    const enrollments = await transaction.nurtureEnrollment.findMany({
      where: activeInstitutionEnrollmentWhere(workspaceId, institutionId, groupIds),
      select: { careGroupId: true, childCareProcessId: true },
      take: MAX_ENROLLMENTS + 1,
    });
    if (enrollments.length > MAX_ENROLLMENTS) return groups.map(unavailableRow);
    const processByGroup = groupSet(enrollments, "childCareProcessId");
    const submissions = await transaction.nurtureDailyAttendanceSubmission.findMany({
      where: {
        workspaceId,
        careGroupId: { in: groupIds },
        localDate: day.storage_date,
        state: { in: ["submitted", "reopened"] },
        createdAt: { lte: at },
        updatedAt: { lte: at },
        deletedAt: null,
      },
      include: {
        entries: {
          where: {
            workspaceId,
            createdAt: { lte: at },
            updatedAt: { lte: at },
          },
          select: { childCareProcessId: true, state: true },
        },
      },
    });
    const submissionByGroup = new Map(submissions.map((row) => [row.careGroupId, row]));
    for (const group of groups) {
      const roster = processByGroup.get(group.id) ?? new Set<string>();
      const submission = submissionByGroup.get(group.id);
      if (roster.size === 0) {
        values.set(group.id, { status: "current", primary: 0, secondary: 0 });
        continue;
      }
      const entries = submission?.entries.filter((entry) => roster.has(entry.childCareProcessId));
      const complete = entries && new Set(entries.map((entry) => entry.childCareProcessId)).size === roster.size;
      values.set(group.id, complete
        ? {
            status: "current",
            primary: new Set(
              entries
                .filter((entry) => entry.state === "present")
                .map((entry) => entry.childCareProcessId),
            ).size,
            secondary: roster.size,
          }
        : { status: "unavailable", primary: 0 });
    }
  } else if (kind === "activity") {
    const counts = await transaction.nurtureActivityPlacement.groupBy({
      by: ["careGroupId"],
      where: {
        workspaceId,
        careGroupId: { in: groupIds },
        localDate: day.storage_date,
        state: "placed",
        createdAt: { lte: at },
        updatedAt: { lte: at },
      },
      _count: { _all: true },
    });
    for (const row of counts) {
      values.set(row.careGroupId, { status: "current", primary: row._count._all });
    }
  } else if (kind === "message_response") {
    const items = await transaction.nurtureFamilyCareItem.findMany({
      where: {
        workspaceId,
        careGroupId: { in: groupIds },
        enrollment: { is: activeScopedEnrollmentRelation(institutionId, groupIds) },
        writerContract: "harness_g2_v1",
        lifecycleState: "active",
        requiresReply: true,
        responseState: { in: ["awaiting_reply", "responded"] },
        createdAt: { gte: day.start, lt: day.end, lte: at },
        updatedAt: { lte: at },
      },
      select: { careGroupId: true, responseState: true },
      take: MAX_RESPONSE_ITEMS + 1,
    });
    if (items.length > MAX_RESPONSE_ITEMS) return groups.map(unavailableRow);
    const grouped = groupList(items);
    for (const group of groups) {
      const rows = grouped.get(group.id) ?? [];
      values.set(group.id, {
        status: "current",
        primary: rows.filter((row) => row.responseState === "responded").length,
        secondary: rows.length,
      });
    }
  } else if (kind === "home_kindergarten_flow") {
    const messages = await transaction.nurtureFamilyCareMessage.findMany({
      where: {
        workspaceId,
        careGroupId: { in: groupIds },
        enrollment: { is: activeScopedEnrollmentRelation(institutionId, groupIds) },
        writerContract: "harness_g2_v1",
        status: "sent",
        direction: { in: ["family_to_org", "org_to_family"] },
        createdAt: { gte: day.start, lt: day.end, lte: at },
        updatedAt: { lte: at },
      },
      select: { careGroupId: true, direction: true },
      take: MAX_MESSAGES + 1,
    });
    if (messages.length > MAX_MESSAGES) return groups.map(unavailableRow);
    const grouped = groupList(messages);
    for (const group of groups) {
      const rows = grouped.get(group.id) ?? [];
      values.set(group.id, {
        status: "current",
        primary: rows.filter((row) => row.direction === "family_to_org").length,
        secondary: rows.filter((row) => row.direction === "org_to_family").length,
      });
    }
  } else if (kind === "authorization_changes") {
    const grants = await transaction.nurtureChildLinkGrant.findMany({
      where: {
        workspaceId,
        enrollment: { is: activeScopedEnrollmentRelation(institutionId, groupIds) },
        updatedAt: { gte: day.start, lt: day.end, lte: at },
      },
      select: { enrollment: { select: { careGroupId: true } } },
      take: MAX_ENROLLMENTS + 1,
    });
    if (grants.length > MAX_ENROLLMENTS) return groups.map(unavailableRow);
    for (const row of grants) {
      const prior = values.get(row.enrollment.careGroupId)?.primary ?? 0;
      values.set(row.enrollment.careGroupId, { status: "current", primary: prior + 1 });
    }
  } else {
    const scopes = await transaction.nurtureFocusGoalChildScope.findMany({
      where: {
        workspaceId,
        deletedAt: null,
        focusGoal: {
          updatedAt: { gte: day.start, lt: day.end, lte: at },
          focusCycle: { workspaceId, status: "active", deletedAt: null },
        },
        childCareProcess: {
          status: "active",
          deletedAt: null,
          enrollments: {
            some: {
              institutionId,
              careGroupId: { in: groupIds },
              status: "active",
              deletedAt: null,
            },
          },
        },
      },
      select: {
        childCareProcessId: true,
        childCareProcess: {
          select: {
            enrollments: {
              where: {
                institutionId,
                careGroupId: { in: groupIds },
                status: "active",
                deletedAt: null,
              },
              select: { careGroupId: true },
            },
          },
        },
      },
      take: MAX_FOCUS_SCOPES + 1,
    });
    if (scopes.length > MAX_FOCUS_SCOPES) return groups.map(unavailableRow);
    const processes = new Map<string, Set<string>>();
    for (const row of scopes) {
      for (const enrollment of row.childCareProcess.enrollments) {
        const set = processes.get(enrollment.careGroupId) ?? new Set<string>();
        set.add(row.childCareProcessId);
        processes.set(enrollment.careGroupId, set);
      }
    }
    for (const [groupId, processIds] of processes) {
      values.set(groupId, { status: "current", primary: processIds.size });
    }
  }

  return [...base.values()].map((group) => {
    const value = values.get(group.id) ?? {
      status: "current" as const,
      primary: 0,
    };
    return {
      care_group_id: group.id,
      class_label: group.name,
      status: value.status,
      primary_value: value.primary,
      ...(value.secondary === undefined ? {} : { secondary_value: value.secondary }),
    };
  });
}

const unavailableRow = (group: ClassRow): DirectorDrilldownRowV1 => ({
  care_group_id: group.id,
  class_label: group.name,
  status: "unavailable",
  primary_value: 0,
});

const groupList = <T extends { careGroupId: string | null }>(
  rows: readonly T[],
): Map<string, T[]> => {
  const grouped = new Map<string, T[]>();
  for (const row of rows) {
    if (row.careGroupId === null) continue;
    const entries = grouped.get(row.careGroupId) ?? [];
    entries.push(row);
    grouped.set(row.careGroupId, entries);
  }
  return grouped;
};

const groupSet = <T extends { careGroupId: string }, K extends keyof T>(
  rows: readonly T[],
  key: K,
): Map<string, Set<T[K]>> => {
  const grouped = new Map<string, Set<T[K]>>();
  for (const row of rows) {
    const values = grouped.get(row.careGroupId) ?? new Set<T[K]>();
    values.add(row[key]);
    grouped.set(row.careGroupId, values);
  }
  return grouped;
};
