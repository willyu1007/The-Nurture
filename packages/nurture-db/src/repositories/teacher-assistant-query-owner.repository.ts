import type { Prisma } from "@prisma/client";
import type {
  NurtureTeacherAssistantTransaction,
  NurtureWeeklyDraftFacts,
  TeacherAssistantCareKind,
  TeacherAssistantClassChildV1,
  TeacherAssistantQueryReadPortV1,
  TeacherAssistantWeeklyChildFactsV1,
} from "@the-nurture/scenario";
import { TEACHER_ASSISTANT_CARE_KINDS } from "@the-nurture/scenario";
import { activeRoleWindow, type BoardPrisma } from "./board-read-support.js";
import { publishDraftCommandIdentity } from "./publish-process.transaction.js";

const CAREGIVER_ROLES = ["caregiver", "lead_caregiver"] as const;

const asJson = (value: unknown): Prisma.InputJsonValue => value as Prisma.InputJsonValue;

const utcDayWindow = (localDate: string) => {
  const start = new Date(`${localDate}T00:00:00.000Z`);
  return { start, end: new Date(start.getTime() + 86_400_000) };
};

const utcWeekWindow = (weekStart: string, weekEnd: string) => ({
  start: new Date(`${weekStart}T00:00:00.000Z`),
  end: new Date(new Date(`${weekEnd}T00:00:00.000Z`).getTime() + 86_400_000),
});

type DailyLogKindRow = Readonly<{
  childCareProcessId: string;
  mealPayload: unknown;
  napPayload: unknown;
  moodPayload: unknown;
  activityPayload: unknown;
  healthObservationPayload: unknown;
}>;

/** The daily-care kinds a log row actually carries (payload present). */
const kindsOf = (row: DailyLogKindRow): TeacherAssistantCareKind[] => {
  const kinds: TeacherAssistantCareKind[] = [];
  if (row.mealPayload !== null) kinds.push("meal");
  if (row.napPayload !== null) kinds.push("nap");
  if (row.moodPayload !== null) kinds.push("mood");
  if (row.activityPayload !== null) kinds.push("activity");
  if (row.healthObservationPayload !== null) kinds.push("health_observation");
  return kinds;
};

const KIND_SELECT = {
  childCareProcessId: true,
  mealPayload: true,
  napPayload: true,
  moodPayload: true,
  activityPayload: true,
  healthObservationPayload: true,
} as const;

const readSafetyPolicyIdentity = (
  payload: unknown,
): { policy_ref: string; policy_head: number } | null => {
  if (typeof payload !== "object" || payload === null) return null;
  const record = payload as {
    contentSafetyPolicyRef?: unknown;
    contentSafetyPolicyHead?: unknown;
  };
  if (
    typeof record.contentSafetyPolicyRef !== "string" ||
    !Number.isSafeInteger(record.contentSafetyPolicyHead)
  ) {
    return null;
  }
  return {
    policy_ref: record.contentSafetyPolicyRef,
    policy_head: record.contentSafetyPolicyHead as number,
  };
};

/**
 * W10 Prisma facts for the teacher assistant queries: enrolled children of
 * the exact class, per-day recorded kinds, the weekly per-kind day counts
 * with the W9-chain confirmed-media counts, and the (class, week) draft
 * lookup. Owner facts only — no bodies, no storage refs, no model calls.
 */
export class PrismaTeacherAssistantQueryReadPort
implements TeacherAssistantQueryReadPortV1 {
  constructor(private readonly prisma: BoardPrisma) {}

  async listClassChildren(input: {
    workspace_id: string;
    care_group_id: string;
  }): Promise<readonly TeacherAssistantClassChildV1[]> {
    const readAt = new Date();
    const enrollments = await this.prisma.nurtureEnrollment.findMany({
      where: {
        workspaceId: input.workspace_id,
        careGroupId: input.care_group_id,
        status: "active",
        deletedAt: null,
        OR: [{ leftAt: null }, { leftAt: { gt: readAt } }],
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
    return enrollments.map((row) => ({
      child_care_process_id: row.childCareProcessId,
      display_label: row.childCareProcess.child.displayName ?? "",
    }));
  }

  async listRecordedDayKinds(input: {
    workspace_id: string;
    care_group_id: string;
    local_date: string;
  }): Promise<
    readonly Readonly<{
      child_care_process_id: string;
      kinds: readonly TeacherAssistantCareKind[];
    }>[]
  > {
    const day = utcDayWindow(input.local_date);
    const logs = await this.prisma.nurtureDailyCareLog.findMany({
      where: {
        workspaceId: input.workspace_id,
        careGroupId: input.care_group_id,
        logDate: { gte: day.start, lt: day.end },
        status: { in: ["recorded", "shared"] },
        deletedAt: null,
      },
      select: KIND_SELECT,
    });
    const byChild = new Map<string, Set<TeacherAssistantCareKind>>();
    for (const log of logs) {
      const bucket = byChild.get(log.childCareProcessId) ?? new Set();
      for (const kind of kindsOf(log)) bucket.add(kind);
      byChild.set(log.childCareProcessId, bucket);
    }
    return [...byChild.entries()].map(([childCareProcessId, kinds]) => ({
      child_care_process_id: childCareProcessId,
      kinds: TEACHER_ASSISTANT_CARE_KINDS.filter((kind) => kinds.has(kind)),
    }));
  }

  async loadWeeklyCareFacts(input: {
    workspace_id: string;
    care_group_id: string;
    week_start: string;
    week_end: string;
  }): Promise<readonly TeacherAssistantWeeklyChildFactsV1[]> {
    const window = utcWeekWindow(input.week_start, input.week_end);
    const [logs, confirmed] = await Promise.all([
      this.prisma.nurtureDailyCareLog.findMany({
        where: {
          workspaceId: input.workspace_id,
          careGroupId: input.care_group_id,
          logDate: { gte: window.start, lt: window.end },
          status: { in: ["recorded", "shared"] },
          deletedAt: null,
        },
        select: KIND_SELECT,
      }),
      // The observation chain the W9 association supplies: confirmed
      // attributions of assets captured inside the exact week.
      this.prisma.nurtureChildMediaAttribution.findMany({
        where: {
          workspaceId: input.workspace_id,
          state: "confirmed",
          mediaAssetRef: {
            workspaceId: input.workspace_id,
            careGroupId: input.care_group_id,
            capturedAt: { gte: window.start, lt: window.end },
            deletedAt: null,
          },
        },
        select: { childCareProcessId: true },
      }),
    ]);
    const countsByChild = new Map<
      string,
      Record<TeacherAssistantCareKind, number>
    >();
    for (const log of logs) {
      const counts =
        countsByChild.get(log.childCareProcessId)
        ?? ({
          meal: 0,
          nap: 0,
          mood: 0,
          activity: 0,
          health_observation: 0,
        } as Record<TeacherAssistantCareKind, number>);
      for (const kind of kindsOf(log)) counts[kind] += 1;
      countsByChild.set(log.childCareProcessId, counts);
    }
    const mediaByChild = new Map<string, number>();
    for (const row of confirmed) {
      mediaByChild.set(
        row.childCareProcessId,
        (mediaByChild.get(row.childCareProcessId) ?? 0) + 1,
      );
    }
    const childIds = new Set([...countsByChild.keys(), ...mediaByChild.keys()]);
    return [...childIds].sort().map((childCareProcessId) => ({
      child_care_process_id: childCareProcessId,
      care_counts: countsByChild.get(childCareProcessId) ?? {
        meal: 0,
        nap: 0,
        mood: 0,
        activity: 0,
        health_observation: 0,
      },
      confirmed_media_count: mediaByChild.get(childCareProcessId) ?? 0,
    }));
  }

  async findWeeklyDraftProcessId(input: {
    workspace_id: string;
    process_key: string;
  }): Promise<string | null> {
    const row = await this.prisma.nurturePublishProcess.findFirst({
      where: {
        workspaceId: input.workspace_id,
        processKey: input.process_key,
      },
      select: { id: true },
    });
    return row?.id ?? null;
  }
}

/**
 * W10 canonical-owner write: the weekly draft process with its sealed first
 * revision, per-family targets and the safety-assessment row, all inside
 * the surrounding command transaction. The authority, safety-policy
 * identity, existing (class, week) process and target set are re-read in
 * this same transaction by `loadWeeklyDraftFacts`.
 */
export class PrismaTeacherAssistantTransaction
implements NurtureTeacherAssistantTransaction {
  constructor(private readonly transaction: Prisma.TransactionClient) {}

  async loadWeeklyDraftFacts(input: {
    workspace_id: string;
    participant_id: string;
    care_group_id: string;
    process_key: string;
  }): Promise<NurtureWeeklyDraftFacts | null> {
    const readAt = new Date();
    const role = await this.transaction.nurtureCareRoleAssignment.findFirst({
      where: {
        workspaceId: input.workspace_id,
        participantId: input.participant_id,
        role: { in: [...CAREGIVER_ROLES] },
        scopeType: "care_group",
        scopeId: input.care_group_id,
        ...activeRoleWindow(readAt),
      },
    });
    if (!role) return null;
    const group = await this.transaction.nurtureCareGroup.findFirst({
      where: {
        id: input.care_group_id,
        workspaceId: input.workspace_id,
        status: "active",
        deletedAt: null,
      },
      include: { institution: true },
    });
    if (!group || group.institution.status !== "active") return null;

    const existing = await this.transaction.nurturePublishProcess.findFirst({
      where: {
        workspaceId: input.workspace_id,
        processKey: input.process_key,
      },
      select: { id: true, state: true },
    });

    const enrollments = await this.transaction.nurtureEnrollment.findMany({
      where: {
        workspaceId: input.workspace_id,
        careGroupId: input.care_group_id,
        status: "active",
        deletedAt: null,
        OR: [{ leftAt: null }, { leftAt: { gt: readAt } }],
      },
      orderBy: { id: "asc" },
    });
    const processIds = [
      ...new Set(enrollments.map((entry) => entry.childCareProcessId)),
    ];
    const [families, grants] = await Promise.all([
      this.transaction.nurtureFamily.findMany({
        where: {
          workspaceId: input.workspace_id,
          childCareProcessId: { in: processIds },
          status: "active",
          deletedAt: null,
        },
        orderBy: { id: "asc" },
      }),
      this.transaction.nurtureChildLinkGrant.findMany({
        where: {
          workspaceId: input.workspace_id,
          enrollmentId: { in: enrollments.map((entry) => entry.id) },
          status: "active",
          revokedAt: null,
          deletedAt: null,
          directions: { has: "org_to_family" },
          dataClasses: { has: "care_day_note" },
          purposes: { has: "family_weekly_summary" },
          AND: [
            { OR: [{ effectiveFrom: null }, { effectiveFrom: { lte: readAt } }] },
            { OR: [{ expiresAt: null }, { expiresAt: { gt: readAt } }] },
          ],
        },
        orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
      }),
    ]);
    const familyByProcess = new Map(
      families.map((family) => [family.childCareProcessId, family]),
    );
    const grantByEnrollment = new Map<string, (typeof grants)[number]>();
    for (const grant of grants) {
      if (!grantByEnrollment.has(grant.enrollmentId)) {
        grantByEnrollment.set(grant.enrollmentId, grant);
      }
    }

    const safetyPolicy = readSafetyPolicyIdentity(
      group.institution.policyConfigPayload ?? null,
    );
    return {
      authorizing_role_assignment_id: role.id,
      ...(safetyPolicy ? { safety_policy: safetyPolicy } : {}),
      ...(existing
        ? {
            existing: {
              process_id: existing.id,
              // The lane-entry reading of a later-stage process: it exists,
              // so the (class, week) draft is already satisfied.
              state: existing.state === "needs_review" ? "needs_review" : "draft",
            },
          }
        : {}),
      targets: enrollments.flatMap((enrollment) => {
        const family = familyByProcess.get(enrollment.childCareProcessId);
        const grant = grantByEnrollment.get(enrollment.id);
        if (!family || !grant) return [];
        return [
          {
            child_care_process_id: enrollment.childCareProcessId,
            enrollment_id: enrollment.id,
            family_id: family.id,
            grant_id: grant.id,
          },
        ];
      }),
    };
  }

  async applyWeeklyDraftProcess(input: {
    workspace_id: string;
    care_group_id: string;
    process_key: string;
    state: "draft" | "needs_review";
    week_start: string;
    week_end: string;
    safety: {
      route: string;
      policy_ref: string;
      policy_head: number;
      rule_revision: string;
      risk_codes: string[];
    };
    content_digest: string;
    organizer_input_revision: string;
    command_request_id: string;
    title_envelope: unknown;
    body_envelope: unknown;
    authorizing_role_assignment_id: string;
    targets: Array<{
      target_key: string;
      child_care_process_id: string;
      enrollment_id: string;
      family_id: string;
      grant_id: string;
    }>;
  }): Promise<{ process_id: string; process_version: number }> {
    const process = await this.transaction.nurturePublishProcess.create({
      data: {
        workspaceId: input.workspace_id,
        careGroupId: input.care_group_id,
        processKey: input.process_key,
        state: input.state,
        dataClass: "care_day_note",
        purposeKey: "family_weekly_summary",
        authorizingRoleAssignmentId: input.authorizing_role_assignment_id,
      },
    });
    const revision = await this.transaction.nurturePublishProcessRevision.create({
      data: {
        workspaceId: input.workspace_id,
        publishProcessId: process.id,
        revision: 1,
        contentDigest: input.content_digest,
        organizerInputRevision: input.organizer_input_revision,
        commandRequestIdHash: publishDraftCommandIdentity(input.command_request_id),
        titleProtectionPayload: asJson(input.title_envelope),
        bodyProtectionPayload: asJson(input.body_envelope),
        mediaCompositionPayload: asJson({ media: [] }),
        sourceRefsPayload: asJson([
          `weekly:${input.week_start}..${input.week_end}`,
        ]),
      },
    });
    await this.transaction.nurturePublishProcess.update({
      where: { id: process.id },
      data: { currentRevisionId: revision.id },
    });
    for (const target of input.targets) {
      await this.transaction.nurturePublishProcessTarget.create({
        data: {
          workspaceId: input.workspace_id,
          publishProcessId: process.id,
          targetKey: target.target_key,
          childCareProcessId: target.child_care_process_id,
          enrollmentId: target.enrollment_id,
          familyRefKey: `${input.workspace_id}:${target.family_id}`,
          grantId: target.grant_id,
        },
      });
    }
    await this.transaction.nurtureContentSafetyAssessment.create({
      data: {
        workspaceId: input.workspace_id,
        publishProcessId: process.id,
        careGroupId: input.care_group_id,
        organizerInputRevision: input.organizer_input_revision,
        route: input.safety.route as never,
        policyRef: input.safety.policy_ref,
        policyHead: input.safety.policy_head,
        ruleRevision: input.safety.rule_revision,
        riskCodesPayload: asJson(input.safety.risk_codes),
        sourceHeadsPayload: asJson({
          weekly_window: [input.week_start, input.week_end],
        }),
      },
    });
    return { process_id: process.id, process_version: process.aggregateVersion };
  }
}
