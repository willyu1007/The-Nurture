import type { Prisma, PrismaClient } from "@prisma/client";
import {
  FAMILY_CARE_PURPOSE,
  type CaregiverDirectMessageEligibilityReadPort,
} from "@the-nurture/scenario/harness";

const MAX_ELIGIBLE_TARGETS = 100;

/**
 * Bounded, batch-loaded target discovery for G2-C prepare. Only a current
 * exact CareGroup caregiver role and the exact Enrollment's current direct
 * disclosure Grant can produce an owner-issued target option.
 */
export class PrismaCaregiverDirectMessageEligibilityReadPort
  implements CaregiverDirectMessageEligibilityReadPort
{
  constructor(private readonly prisma: PrismaClient | Prisma.TransactionClient) {}

  async resolveCaregiverDirectMessageEligibility(input: {
    workspace_id: string;
    participant_id: string;
  }) {
    const now = new Date();
    const participant = await this.prisma.nurtureParticipant.findFirst({
      where: {
        id: input.participant_id,
        workspaceId: input.workspace_id,
        status: "active",
        deletedAt: null,
      },
    });
    if (!participant) {
      return { participant_active: false, target_set_complete: true, targets: [] };
    }
    const roles = await this.prisma.nurtureCareRoleAssignment.findMany({
      where: {
        workspaceId: input.workspace_id,
        participantId: input.participant_id,
        role: { in: ["caregiver", "lead_caregiver"] },
        scopeType: "care_group",
        status: "active",
        deletedAt: null,
        OR: [{ startsAt: null }, { startsAt: { lte: now } }],
        AND: [{ OR: [{ endsAt: null }, { endsAt: { gt: now } }] }],
      },
      orderBy: { id: "asc" },
      take: MAX_ELIGIBLE_TARGETS + 1,
    });
    const rolesByGroup = new Map<string, Array<(typeof roles)[number]>>();
    for (const role of roles.slice(0, MAX_ELIGIBLE_TARGETS)) {
      const entries = rolesByGroup.get(role.scopeId) ?? [];
      entries.push(role);
      rolesByGroup.set(role.scopeId, entries);
    }
    if (rolesByGroup.size === 0) {
      return { participant_active: true, target_set_complete: true, targets: [] };
    }
    const enrollments = await this.prisma.nurtureEnrollment.findMany({
      where: {
        workspaceId: input.workspace_id,
        careGroupId: { in: [...rolesByGroup.keys()] },
        status: "active",
        deletedAt: null,
        OR: [{ leftAt: null }, { leftAt: { gt: now } }],
        institution: { status: "active", deletedAt: null },
        careGroup: { status: "active", deletedAt: null },
      },
      include: {
        institution: true,
        careGroup: true,
        childCareProcess: { include: { child: true } },
      },
      orderBy: { id: "asc" },
      take: MAX_ELIGIBLE_TARGETS + 1,
    });
    const bounded = enrollments.slice(0, MAX_ELIGIBLE_TARGETS);
    const processIds = [...new Set(bounded.map((entry) => entry.childCareProcessId))];
    const enrollmentIds = bounded.map((entry) => entry.id);
    const [families, threads, grants] = await Promise.all([
      this.prisma.nurtureFamily.findMany({
        where: {
          workspaceId: input.workspace_id,
          childCareProcessId: { in: processIds },
          status: "active",
          deletedAt: null,
        },
        orderBy: { id: "asc" },
      }),
      this.prisma.nurtureFamilyCareThread.findMany({
        where: {
          workspaceId: input.workspace_id,
          enrollmentId: { in: enrollmentIds },
          visibilityScope: { in: ["family_private", "enrollment_private"] },
          status: "active",
          deletedAt: null,
        },
        orderBy: { id: "asc" },
      }),
      this.prisma.nurtureChildLinkGrant.findMany({
        where: {
          workspaceId: input.workspace_id,
          enrollmentId: { in: enrollmentIds },
          status: "active",
          revokedAt: null,
          deletedAt: null,
          directions: { has: "org_to_family" },
          dataClasses: { has: "direct_care_communication" },
          purposes: { has: FAMILY_CARE_PURPOSE },
          AND: [
            { OR: [{ effectiveFrom: null }, { effectiveFrom: { lte: now } }] },
            { OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
          ],
        },
        orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
      }),
    ]);
    const familiesByProcess = new Map<string, Array<(typeof families)[number]>>();
    for (const family of families) {
      const entries = familiesByProcess.get(family.childCareProcessId) ?? [];
      entries.push(family);
      familiesByProcess.set(family.childCareProcessId, entries);
    }
    const threadsByEnrollment = new Map<string, Array<(typeof threads)[number]>>();
    for (const thread of threads) {
      if (!thread.enrollmentId) continue;
      const entries = threadsByEnrollment.get(thread.enrollmentId) ?? [];
      entries.push(thread);
      threadsByEnrollment.set(thread.enrollmentId, entries);
    }
    const grantsByEnrollment = new Map<string, Array<(typeof grants)[number]>>();
    for (const grant of grants) {
      const entries = grantsByEnrollment.get(grant.enrollmentId) ?? [];
      entries.push(grant);
      grantsByEnrollment.set(grant.enrollmentId, entries);
    }
    const targets = bounded.flatMap((enrollment) => {
      const roleCandidates = rolesByGroup.get(enrollment.careGroupId) ?? [];
      const role = roleCandidates.length === 1 ? roleCandidates[0] : undefined;
      const familyCandidates = familiesByProcess.get(enrollment.childCareProcessId) ?? [];
      // More than one current family projection is ambiguous and therefore
      // cannot be silently resolved by row order.
      const family = familyCandidates.length === 1 ? familyCandidates[0] : undefined;
      const threadCandidates = family
        ? (threadsByEnrollment.get(enrollment.id) ?? []).filter(
            (entry) =>
              entry.childCareProcessId === enrollment.childCareProcessId &&
              entry.familyId === family.id &&
              entry.careGroupId === enrollment.careGroupId,
          )
        : [];
      const thread = threadCandidates.length === 1 ? threadCandidates[0] : undefined;
      const grant = (grantsByEnrollment.get(enrollment.id) ?? []).find(
        (entry) =>
          entry.childCareProcessId === enrollment.childCareProcessId &&
          ((entry.grantedToScopeType === "care_group" &&
            entry.grantedToScopeId === enrollment.careGroupId) ||
            (entry.grantedToScopeType === "enrollment" &&
              entry.grantedToScopeId === enrollment.id) ||
            (entry.grantedToScopeType === "institution" &&
              entry.grantedToScopeId === enrollment.institutionId)),
      );
      if (!role || !family || !thread || !grant) return [];
      return [
        {
          enrollment_id: enrollment.id,
          grant_id: grant.id,
          display_label: `${enrollment.childCareProcess.child?.displayName ?? "Child"} · ${enrollment.institution.displayName} · ${enrollment.careGroup.name}`,
          enrollment_version: enrollment.aggregateVersion,
          care_group_version: enrollment.careGroup.aggregateVersion,
          caregiver_role_version: role.aggregateVersion,
          grant_version: grant.aggregateVersion,
          thread_version: thread.aggregateVersion,
        },
      ];
    });
    return {
      participant_active: true,
      target_set_complete:
        roles.length <= MAX_ELIGIBLE_TARGETS &&
        enrollments.length <= MAX_ELIGIBLE_TARGETS,
      targets,
    };
  }
}
