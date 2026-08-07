import type { CanonicalRef } from "@my-chat/workflow-contracts";
import type {
  CaregiverDailyCareEligibilityReadPort,
  NurtureBoardMutationTransaction,
  NurtureCaregiverDailyCareFacts,
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

    // Scoped exactly as the prepare-side eligibility port scopes it. Reading
    // roles of any scope type and taking the earliest made prepare and execute
    // disagree: a teacher holding an older institution-wide role plus a newer
    // class role was offered a target and then refused for it.
    const roles = await this.prisma.nurtureCareRoleAssignment.findMany({
      where: {
        workspaceId: input.workspace_id,
        participantId: input.participant_id,
        role: { in: ["caregiver", "lead_caregiver"] },
        scopeType: "care_group",
        ...activeRoleWindow(now),
      },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    });
    if (roles.length === 0) return { ...NO_DAILY_CARE_FACTS, participant_active: true };

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
      const first = roles[0]!;
      return {
        ...NO_DAILY_CARE_FACTS,
        participant_active: true,
        caregiver_role: first.role,
        role_scope_type: first.scopeType,
        caregiver_role_version: first.aggregateVersion,
      };
    }

    // The write is admitted only through the assignment scoped to the exact
    // CareGroup that owns the enrollment — the same one prepare matched.
    const role = roles.find((entry) => entry.scopeId === enrollment.careGroupId) ?? roles[0]!;
    const matches = role.scopeId === enrollment.careGroupId;
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

