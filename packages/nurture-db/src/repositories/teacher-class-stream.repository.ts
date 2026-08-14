import type {
  TeacherCaregiverContextV1,
  TeacherChildDayFactsV1,
  TeacherClassChildFactsV1,
  TeacherClassFactsV1,
  TeacherClassStreamReadPortV1,
  TeacherDailyCareFactV1,
  TeacherScheduleFactsV1,
} from "@the-nurture/scenario";
import { activeRoleWindow, type BoardPrisma } from "./board-read-support.js";
import { loadCurrentInstitutionPublicationPolicy } from "./institution-publication-policy.read.js";

/**
 * W6 Prisma reads for the teacher class-stream presenter. Every read is
 * anchored on the canonical class-day columns (`log_date`, `local_date` are
 * `@db.Date`), so no timezone conversion happens here; the one timestamp
 * filter (family instructions) uses the UTC day window under the same
 * documented limitation as the G3 caregiver board until an institution
 * timezone becomes canonical.
 */

const ATTENTION_PRIORITY = {
  normal: "routine",
  attention: "attention",
  time_sensitive: "urgent",
} as const;

const DAILY_CARE_KINDS = [
  ["mealPayload", "meal"],
  ["napPayload", "nap"],
  ["moodPayload", "mood"],
  ["activityPayload", "activity"],
  ["healthObservationPayload", "health_observation"],
] as const;

const INSTRUCTION_CATEGORIES = ["today_attention", "constraint", "schedule"] as const;

const utcDayWindow = (localDate: string) => {
  const start = new Date(`${localDate}T00:00:00.000Z`);
  return { start, end: new Date(start.getTime() + 86_400_000) };
};

const timeOfDayPattern = /^([01][0-9]|2[0-3]):[0-5][0-9]$/;

type RawScheduleSlot = Readonly<{
  source_ref: string;
  label: string;
  starts_at: string;
  ends_at: string;
}>;

const parseSlotsPayload = (payload: unknown): RawScheduleSlot[] | null => {
  if (!Array.isArray(payload)) return null;
  const slots: RawScheduleSlot[] = [];
  for (const candidate of payload) {
    if (candidate === null || typeof candidate !== "object" || Array.isArray(candidate)) {
      return null;
    }
    const slot = candidate as Record<string, unknown>;
    const sourceRef = slot.slotRef;
    const label = slot.label;
    const startsAt = slot.startsAt;
    const endsAt = slot.endsAt;
    if (
      typeof sourceRef !== "string" || sourceRef.length === 0
      || typeof label !== "string" || label.length === 0
      || typeof startsAt !== "string" || !timeOfDayPattern.test(startsAt)
      || typeof endsAt !== "string" || !timeOfDayPattern.test(endsAt)
      || startsAt >= endsAt
    ) {
      return null;
    }
    slots.push({
      source_ref: sourceRef,
      label,
      starts_at: startsAt,
      ends_at: endsAt,
    });
  }
  return slots;
};

export class PrismaTeacherClassStreamReadPort
implements TeacherClassStreamReadPortV1 {
  constructor(private readonly prisma: BoardPrisma) {}

  async loadCaregiverContext(input: {
    workspace_id: string;
    my_chat_user_id: string;
    at: Date;
  }): Promise<TeacherCaregiverContextV1 | null> {
    const participants = await this.prisma.nurtureParticipant.findMany({
      where: {
        workspaceId: input.workspace_id,
        myChatUserId: input.my_chat_user_id,
        status: "active",
        deletedAt: null,
      },
      orderBy: { id: "asc" },
      take: 2,
    });
    if (participants.length !== 1) return null;
    const participant = participants[0]!;

    const roles = await this.prisma.nurtureCareRoleAssignment.findMany({
      where: {
        workspaceId: input.workspace_id,
        participantId: participant.id,
        role: { in: ["caregiver", "lead_caregiver"] },
        scopeType: "care_group",
        ...activeRoleWindow(input.at),
      },
      select: { scopeId: true, role: true, aggregateVersion: true },
    });
    if (roles.length === 0) {
      return {
        participant_id: participant.id,
        participant_version: participant.aggregateVersion,
        classes: [],
      };
    }

    const careGroups = await this.prisma.nurtureCareGroup.findMany({
      where: {
        workspaceId: input.workspace_id,
        id: { in: [...new Set(roles.map((role) => role.scopeId))] },
        status: "active",
        deletedAt: null,
        institution: { status: "active", deletedAt: null },
      },
      select: {
        id: true,
        name: true,
        aggregateVersion: true,
        institutionId: true,
      },
    });

    const policyByInstitution = new Map<string, boolean>();
    for (const institutionId of new Set(
      careGroups.map((group) => group.institutionId),
    )) {
      const policy = await loadCurrentInstitutionPublicationPolicy(this.prisma, {
        workspace_id: input.workspace_id,
        institution_id: institutionId,
        at: input.at,
      });
      policyByInstitution.set(institutionId, policy !== null);
    }

    const classes: TeacherClassFactsV1[] = careGroups.map((group) => {
      const groupRoles = roles.filter((role) => role.scopeId === group.id);
      const lead = groupRoles.find((role) => role.role === "lead_caregiver");
      const strongest = lead ?? groupRoles[0]!;
      return {
        care_group_id: group.id,
        care_group_label: group.name,
        role: lead ? "lead_caregiver" : "caregiver",
        role_version: Math.max(
          ...groupRoles.map((role) => role.aggregateVersion),
          strongest.aggregateVersion,
        ),
        care_group_version: group.aggregateVersion,
        institution_id: group.institutionId,
        publication_policy_resolved:
          policyByInstitution.get(group.institutionId) ?? false,
      };
    });

    return {
      participant_id: participant.id,
      participant_version: participant.aggregateVersion,
      classes,
    };
  }

  async listClassChildren(input: {
    workspace_id: string;
    care_group_id: string;
    local_date: string;
  }): Promise<readonly TeacherClassChildFactsV1[]> {
    const day = utcDayWindow(input.local_date);
    const enrollments = await this.prisma.nurtureEnrollment.findMany({
      where: {
        workspaceId: input.workspace_id,
        careGroupId: input.care_group_id,
        status: "active",
        deletedAt: null,
      },
      include: {
        childCareProcess: {
          include: { child: { select: { displayName: true } } },
        },
      },
      orderBy: [
        { childCareProcess: { child: { displayName: "asc" } } },
        { childCareProcessId: "asc" },
      ],
    });
    const processIds = enrollments.map((row) => row.childCareProcessId);
    if (processIds.length === 0) return [];

    const [logs, attention] = await Promise.all([
      this.prisma.nurtureDailyCareLog.findMany({
        where: {
          workspaceId: input.workspace_id,
          careGroupId: input.care_group_id,
          childCareProcessId: { in: processIds },
          logDate: { gte: day.start, lt: day.end },
          status: { in: ["recorded", "shared"] },
          deletedAt: null,
        },
        select: { childCareProcessId: true, updatedAt: true },
      }),
      this.prisma.nurtureTeacherAttentionItem.findMany({
        where: {
          workspaceId: input.workspace_id,
          careGroupId: input.care_group_id,
          childCareProcessId: { in: processIds },
          status: "active",
          OR: [{ effectiveDate: null }, { effectiveDate: { lt: day.end } }],
        },
        select: { childCareProcessId: true, priority: true },
      }),
    ]);

    const lastActivityByChild = new Map<string, string>();
    for (const log of logs) {
      const current = lastActivityByChild.get(log.childCareProcessId);
      const candidate = log.updatedAt.toISOString();
      if (!current || candidate > current) {
        lastActivityByChild.set(log.childCareProcessId, candidate);
      }
    }
    const attentionByChild = new Map<string, ("routine" | "attention" | "urgent")[]>();
    for (const item of attention) {
      const bucket = attentionByChild.get(item.childCareProcessId) ?? [];
      bucket.push(ATTENTION_PRIORITY[item.priority]);
      attentionByChild.set(item.childCareProcessId, bucket);
    }

    return enrollments.map((row) => ({
      child_care_process_id: row.childCareProcessId,
      child_safe_label: row.childCareProcess.child.displayName ?? "",
      last_activity_at: lastActivityByChild.get(row.childCareProcessId) ?? null,
      attention_priorities: attentionByChild.get(row.childCareProcessId) ?? [],
    }));
  }

  async loadChildDay(input: {
    workspace_id: string;
    care_group_id: string;
    child_care_process_id: string;
    local_date: string;
  }): Promise<TeacherChildDayFactsV1 | null> {
    const day = utcDayWindow(input.local_date);
    const enrollment = await this.prisma.nurtureEnrollment.findFirst({
      where: {
        workspaceId: input.workspace_id,
        careGroupId: input.care_group_id,
        childCareProcessId: input.child_care_process_id,
        status: "active",
        deletedAt: null,
      },
      include: {
        childCareProcess: {
          include: { child: { select: { displayName: true } } },
        },
      },
    });
    if (!enrollment) return null;

    const [submission, logs, instructions] = await Promise.all([
      this.prisma.nurtureDailyAttendanceSubmission.findFirst({
        where: {
          workspaceId: input.workspace_id,
          careGroupId: input.care_group_id,
          localDate: { gte: day.start, lt: day.end },
          deletedAt: null,
        },
        include: {
          entries: {
            where: { childCareProcessId: input.child_care_process_id },
          },
        },
      }),
      this.prisma.nurtureDailyCareLog.findMany({
        where: {
          workspaceId: input.workspace_id,
          careGroupId: input.care_group_id,
          childCareProcessId: input.child_care_process_id,
          logDate: { gte: day.start, lt: day.end },
          status: { in: ["recorded", "shared"] },
          deletedAt: null,
        },
        orderBy: [{ logDate: "asc" }, { id: "asc" }],
      }),
      this.prisma.nurtureFamilyCareItem.findMany({
        where: {
          workspaceId: input.workspace_id,
          careGroupId: input.care_group_id,
          childCareProcessId: input.child_care_process_id,
          category: { in: [...INSTRUCTION_CATEGORIES] },
          lifecycleState: "active",
          suppressedAt: null,
          OR: [
            { createdAt: { gte: day.start, lt: day.end } },
            { dueAt: { gte: day.start, lt: day.end } },
          ],
        },
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        select: {
          id: true,
          summary: true,
          createdAt: true,
          version: true,
        },
      }),
    ]);

    const entry = submission?.entries[0];
    const dailyCare: TeacherDailyCareFactV1[] = logs.flatMap((log) =>
      DAILY_CARE_KINDS.filter(([field]) => log[field] !== null).map(([, kind]) => ({
        log_id: log.id,
        kind,
        summary: log.summary ?? "",
        occurred_at: log.logDate.toISOString(),
        fact_version: log.aggregateVersion,
      })));

    return {
      child_safe_label: enrollment.childCareProcess.child.displayName ?? "",
      arrival: submission && entry
        ? {
            state: entry.state,
            recorded_at: submission.submittedAt.toISOString(),
            fact_version: entry.aggregateVersion,
          }
        : null,
      daily_care: dailyCare,
      family_instructions: instructions.map((item) => ({
        item_id: item.id,
        summary: item.summary,
        received_at: item.createdAt.toISOString(),
        fact_version: Math.max(1, item.version),
      })),
    };
  }

  async loadClassSchedule(input: {
    workspace_id: string;
    institution_id: string;
    care_group_id: string;
    local_date: string;
  }): Promise<TeacherScheduleFactsV1> {
    const day = utcDayWindow(input.local_date);
    const override = await this.prisma.nurtureClassScheduleDayOverride.findFirst({
      where: {
        workspaceId: input.workspace_id,
        careGroupId: input.care_group_id,
        localDate: { gte: day.start, lt: day.end },
        deletedAt: null,
      },
    });
    if (override) {
      const slots = parseSlotsPayload(override.slotsPayload);
      if (slots === null) return { status: "malformed" };
      return {
        status: "resolved",
        resolution: "day_override",
        version_head: Math.max(1, override.aggregateVersion),
        slots,
      };
    }

    const classTemplate = await this.prisma.nurtureClassScheduleTemplate.findFirst({
      where: {
        workspaceId: input.workspace_id,
        institutionId: input.institution_id,
        careGroupId: input.care_group_id,
        layer: "class_standing",
        deletedAt: null,
      },
    });
    if (classTemplate) {
      const slots = parseSlotsPayload(classTemplate.slotsPayload);
      if (slots === null) return { status: "malformed" };
      return {
        status: "resolved",
        resolution: "class_template",
        version_head: Math.max(1, classTemplate.aggregateVersion),
        slots,
      };
    }

    const institutionTemplate =
      await this.prisma.nurtureClassScheduleTemplate.findFirst({
        where: {
          workspaceId: input.workspace_id,
          institutionId: input.institution_id,
          careGroupId: null,
          layer: "institution_default",
          deletedAt: null,
        },
      });
    if (institutionTemplate) {
      const slots = parseSlotsPayload(institutionTemplate.slotsPayload);
      if (slots === null) return { status: "malformed" };
      return {
        status: "resolved",
        resolution: "institution_template",
        version_head: Math.max(1, institutionTemplate.aggregateVersion),
        slots,
      };
    }

    return { status: "resolved", resolution: "none", version_head: 0, slots: [] };
  }
}
