import type { CanonicalRef } from "@my-chat/workflow-contracts";
import type {
  CaregiverDailyCareEligibilityReadPort,
  GuardianFocusEligibilityReadPort,
  NurtureBoardMutationTransaction,
  NurtureCaregiverDailyCareFacts,
  NurtureGuardianFocusGoalFacts,
} from "@the-nurture/scenario/harness";
import { activeRoleWindow, type BoardPrisma } from "./board-read-support.js";

type DomainContextRef = CanonicalRef;

const domainRef = (objectType: string, objectId: string, version = 1): DomainContextRef => ({
  schema_version: 1,
  namespace: "nurture",
  object_type: objectType,
  object_id: objectId,
  version,
});

const NO_GUARDIAN_FOCUS_FACTS: NurtureGuardianFocusGoalFacts = {
  participant_active: false,
  guardian_authority_current: false,
  focus_cycle_version: 0,
  focus_goal_version: 0,
  child_scope_explicit: false,
};

const NO_DAILY_CARE_FACTS: NurtureCaregiverDailyCareFacts = {
  participant_active: false,
  caregiver_role: "",
  role_scope_type: "",
  role_scope_matches_source: false,
  enrollment_active: false,
  care_group_version: 0,
  caregiver_role_version: 0,
  enrollment_version: 0,
};

/**
 * Prepare-step eligibility for the two G3-A inline board mutations. Prepare
 * only reads: it enumerates the targets the fact owner would currently accept a
 * write for, and the presenter turns those into action refs. A role that reads
 * "guardian" with nothing behind it yields an empty target list.
 */
export class PrismaGuardianFocusEligibilityReadPort implements GuardianFocusEligibilityReadPort {
  constructor(private readonly prisma: BoardPrisma) {}

  async resolveGuardianFocusEligibility(input: {
    workspace_id: string;
    participant_id: string;
  }): Promise<{
    participant_active: boolean;
    goals: Array<{
      focus_goal_id: string;
      focus_cycle_id: string;
      display_label: string;
      focus_cycle_version: number;
      focus_goal_version: number;
    }>;
  }> {
    const now = new Date();
    const participant = await this.prisma.nurtureParticipant.findFirst({
      where: {
        id: input.participant_id,
        workspaceId: input.workspace_id,
        status: "active",
        deletedAt: null,
      },
    });
    if (!participant) return { participant_active: false, goals: [] };

    const familyRefKeys = await guardianFamilyRefKeys(
      this.prisma,
      input.workspace_id,
      input.participant_id,
      now,
    );
    if (familyRefKeys.length === 0) return { participant_active: true, goals: [] };

    const cycles = await this.prisma.nurtureFocusCycle.findMany({
      where: {
        workspaceId: input.workspace_id,
        familyRefKey: { in: familyRefKeys },
        status: "active",
        deletedAt: null,
      },
      include: {
        goals: { orderBy: [{ priority: "asc" }, { createdAt: "asc" }, { id: "asc" }] },
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    });

    return {
      participant_active: true,
      goals: cycles.flatMap((cycle) =>
        cycle.goals.map((goal) => ({
          focus_goal_id: goal.id,
          focus_cycle_id: cycle.id,
          display_label: goal.goalKey ?? "",
          focus_cycle_version: cycle.aggregateVersion,
          focus_goal_version: goal.aggregateVersion,
        })),
      ),
    };
  }
}

export class PrismaCaregiverDailyCareEligibilityReadPort
  implements CaregiverDailyCareEligibilityReadPort
{
  constructor(private readonly prisma: BoardPrisma) {}

  async resolveCaregiverDailyCareEligibility(input: {
    workspace_id: string;
    participant_id: string;
  }): Promise<{
    participant_active: boolean;
    children: Array<{
      child_care_process_id: string;
      display_label: string;
      care_group_version: number;
      caregiver_role_version: number;
      enrollment_version: number;
    }>;
  }> {
    const now = new Date();
    const participant = await this.prisma.nurtureParticipant.findFirst({
      where: {
        id: input.participant_id,
        workspaceId: input.workspace_id,
        status: "active",
        deletedAt: null,
      },
    });
    if (!participant) return { participant_active: false, children: [] };

    const roles = await this.prisma.nurtureCareRoleAssignment.findMany({
      where: {
        workspaceId: input.workspace_id,
        participantId: input.participant_id,
        role: { in: ["caregiver", "lead_caregiver"] },
        scopeType: "care_group",
        ...activeRoleWindow(now),
      },
    });
    if (roles.length === 0) return { participant_active: true, children: [] };

    const children: Array<{
      child_care_process_id: string;
      display_label: string;
      care_group_version: number;
      caregiver_role_version: number;
      enrollment_version: number;
    }> = [];
    for (const role of roles) {
      const group = await this.prisma.nurtureCareGroup.findFirst({
        where: {
          id: role.scopeId,
          workspaceId: input.workspace_id,
          status: "active",
          deletedAt: null,
        },
      });
      if (!group) continue;
      const enrollments = await this.prisma.nurtureEnrollment.findMany({
        where: {
          workspaceId: input.workspace_id,
          careGroupId: group.id,
          status: "active",
          deletedAt: null,
        },
        include: { childCareProcess: { include: { child: { select: { displayName: true } } } } },
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      });
      for (const enrollment of enrollments) {
        children.push({
          child_care_process_id: enrollment.childCareProcessId,
          display_label: enrollment.childCareProcess.child.displayName ?? "",
          care_group_version: group.aggregateVersion,
          caregiver_role_version: role.aggregateVersion,
          enrollment_version: enrollment.aggregateVersion,
        });
      }
    }
    return { participant_active: true, children };
  }
}

/**
 * Canonical-owner writes behind the two inline board mutations. The board never
 * owns a fact, so each apply re-reads the owner inside the command transaction
 * and writes the owner row itself; no board snapshot, cache or derived
 * projection is touched, and a stale expected version fails the write instead
 * of overwriting a newer one.
 */
export class PrismaBoardMutationTransaction implements NurtureBoardMutationTransaction {
  constructor(private readonly prisma: BoardPrisma) {}

  async loadGuardianFocusGoalFacts(input: {
    workspace_id: string;
    participant_id: string;
    focus_goal_id: string;
  }): Promise<NurtureGuardianFocusGoalFacts> {
    const now = new Date();
    const participant = await this.prisma.nurtureParticipant.findFirst({
      where: {
        id: input.participant_id,
        workspaceId: input.workspace_id,
        status: "active",
        deletedAt: null,
      },
    });
    if (!participant) return NO_GUARDIAN_FOCUS_FACTS;

    const goal = await this.prisma.nurtureFocusGoal.findFirst({
      where: { id: input.focus_goal_id, workspaceId: input.workspace_id },
      include: {
        focusCycle: true,
        childScopes: { where: { deletedAt: null }, orderBy: [{ createdAt: "asc" }, { id: "asc" }] },
      },
    });
    if (!goal) return { ...NO_GUARDIAN_FOCUS_FACTS, participant_active: true };

    const familyRefKeys = await guardianFamilyRefKeys(
      this.prisma,
      input.workspace_id,
      input.participant_id,
      now,
    );
    const scope = goal.childScopes[0];
    return {
      participant_active: true,
      // Authority is measured against the exact family the goal belongs to, not
      // against "is this participant a guardian somewhere".
      guardian_authority_current: familyRefKeys.includes(goal.familyRefKey),
      family_ref_key: goal.familyRefKey,
      focus_cycle_id: goal.focusCycleId,
      focus_cycle_version: goal.focusCycle.aggregateVersion,
      focus_goal_version: goal.aggregateVersion,
      child_scope_explicit: Boolean(scope),
      ...(scope ? { child_care_process_id: scope.childCareProcessId } : {}),
    };
  }

  async applyGuardianFocusGoalUpdate(input: {
    workspace_id: string;
    participant_id: string;
    focus_goal_id: string;
    focus_cycle_id: string;
    label: string;
    priority: number;
    expected_focus_goal_version: number;
  }): Promise<{ focus_goal_ref: DomainContextRef; revision: number }> {
    // The expected version is part of the filter, so a concurrent write makes
    // this update match zero rows rather than silently winning.
    const updated = await this.prisma.nurtureFocusGoal.updateMany({
      where: {
        id: input.focus_goal_id,
        workspaceId: input.workspace_id,
        focusCycleId: input.focus_cycle_id,
        aggregateVersion: input.expected_focus_goal_version,
      },
      data: {
        goalKey: input.label,
        priority: input.priority,
        aggregateVersion: { increment: 1 },
      },
    });
    if (updated.count !== 1) {
      throw new Error("nurture board mutation: focus goal version conflict");
    }
    const revision = input.expected_focus_goal_version + 1;
    return {
      focus_goal_ref: domainRef("focus_goal", input.focus_goal_id, revision),
      revision,
    };
  }

  async loadCaregiverDailyCareFacts(input: {
    workspace_id: string;
    participant_id: string;
    child_care_process_id: string;
  }): Promise<NurtureCaregiverDailyCareFacts> {
    const now = new Date();
    const participant = await this.prisma.nurtureParticipant.findFirst({
      where: {
        id: input.participant_id,
        workspaceId: input.workspace_id,
        status: "active",
        deletedAt: null,
      },
    });
    if (!participant) return NO_DAILY_CARE_FACTS;

    const roles = await this.prisma.nurtureCareRoleAssignment.findMany({
      where: {
        workspaceId: input.workspace_id,
        participantId: input.participant_id,
        role: { in: ["caregiver", "lead_caregiver"] },
        ...activeRoleWindow(now),
      },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    });
    const role = roles[0];
    if (!role) return { ...NO_DAILY_CARE_FACTS, participant_active: true };

    const enrollment = await this.prisma.nurtureEnrollment.findFirst({
      where: {
        workspaceId: input.workspace_id,
        childCareProcessId: input.child_care_process_id,
        status: "active",
        deletedAt: null,
        careGroup: { status: "active", deletedAt: null },
      },
      include: { careGroup: true },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    });
    if (!enrollment) {
      return {
        ...NO_DAILY_CARE_FACTS,
        participant_active: true,
        caregiver_role: role.role,
        role_scope_type: role.scopeType,
        caregiver_role_version: role.aggregateVersion,
      };
    }

    // The write is admitted only when the actor's own assignment is scoped to
    // the exact CareGroup that owns the enrollment. An institution-scoped
    // assignment reaching a class it does not hold is refused here.
    const matches =
      role.scopeType === "care_group" && role.scopeId === enrollment.careGroupId;
    return {
      participant_active: true,
      caregiver_role: role.role,
      role_scope_type: role.scopeType,
      role_scope_matches_source: matches,
      ...(matches ? { caregiver_role_assignment_id: role.id } : {}),
      care_group_id: enrollment.careGroupId,
      enrollment_id: enrollment.id,
      enrollment_active: true,
      care_group_version: enrollment.careGroup.aggregateVersion,
      caregiver_role_version: role.aggregateVersion,
      enrollment_version: enrollment.aggregateVersion,
    };
  }

  async applyCaregiverDailyCareRecord(input: {
    workspace_id: string;
    participant_id: string;
    child_care_process_id: string;
    care_group_id: string;
    enrollment_id: string;
    recorded_by_role_assignment_id: string;
    kind: string;
    summary: string;
    expected_enrollment_version: number;
  }): Promise<{ daily_care_log_ref: DomainContextRef; recorded_at: string }> {
    const enrollment = await this.prisma.nurtureEnrollment.findFirst({
      where: {
        id: input.enrollment_id,
        workspaceId: input.workspace_id,
        childCareProcessId: input.child_care_process_id,
        careGroupId: input.care_group_id,
        status: "active",
        deletedAt: null,
        aggregateVersion: input.expected_enrollment_version,
      },
    });
    if (!enrollment) {
      throw new Error("nurture board mutation: enrollment version conflict");
    }

    const recordedAt = new Date();
    const logDate = new Date(
      Date.UTC(
        recordedAt.getUTCFullYear(),
        recordedAt.getUTCMonth(),
        recordedAt.getUTCDate(),
      ),
    );
    const kindData = dailyCarePayload(input.kind, input.summary);
    if (!kindData) {
      throw new Error(`nurture board mutation: unknown daily care kind ${input.kind}`);
    }
    const log = await this.prisma.nurtureDailyCareLog.create({
      data: {
        workspaceId: input.workspace_id,
        childCareProcessId: input.child_care_process_id,
        enrollmentId: input.enrollment_id,
        careGroupId: input.care_group_id,
        recordedByRoleAssignmentId: input.recorded_by_role_assignment_id,
        logDate,
        summary: input.summary,
        status: "recorded",
        ...kindData,
      },
    });
    return {
      daily_care_log_ref: domainRef("daily_care_log", log.id),
      recorded_at: log.createdAt.toISOString(),
    };
  }
}

/**
 * The owner keeps one payload column per care kind. Naming each column
 * explicitly means an unknown kind fails the write instead of landing as a log
 * row with no content in any column.
 */
const dailyCarePayload = (kind: string, summary: string) => {
  const payload = { kind, summary };
  switch (kind) {
    case "meal":
      return { mealPayload: payload };
    case "nap":
      return { napPayload: payload };
    case "mood":
      return { moodPayload: payload };
    case "activity":
      return { activityPayload: payload };
    case "health_observation":
      return { healthObservationPayload: payload };
    default:
      return null;
  }
};

/** The family scope keys a guardian currently holds authority over. */
const guardianFamilyRefKeys = async (
  prisma: BoardPrisma,
  workspaceId: string,
  participantId: string,
  at: Date,
): Promise<string[]> => {
  const roles = await prisma.nurtureCareRoleAssignment.findMany({
    where: { workspaceId, participantId, role: "guardian", ...activeRoleWindow(at) },
  });
  const processIds = new Set<string>();
  const familyIds = new Set<string>();
  for (const role of roles) {
    if (role.scopeType === "child_care_process") processIds.add(role.scopeId);
    else if (role.scopeType === "family") familyIds.add(role.scopeId);
  }
  if (processIds.size === 0 && familyIds.size === 0) return [];
  const families = await prisma.nurtureFamily.findMany({
    where: {
      workspaceId,
      status: "active",
      deletedAt: null,
      OR: [
        ...(processIds.size > 0 ? [{ childCareProcessId: { in: [...processIds] } }] : []),
        ...(familyIds.size > 0 ? [{ id: { in: [...familyIds] } }] : []),
      ],
    },
    select: { childCareProcessId: true },
  });
  return families.map((family) => `${workspaceId}:${family.childCareProcessId}`);
};
