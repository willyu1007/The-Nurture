import type { Prisma, PrismaClient } from "@prisma/client";
import { FAMILY_CARE_PURPOSE, type SubmitEligibilityReadPort } from "@the-nurture/scenario/harness";

/**
 * Read-only guardian submit eligibility for the Harness prepare step
 * (08-increment-1). A target is offered only when the complete graph is
 * currently active: guardian role reach, enrollment + institution + care
 * group, family, Enrollment-private thread and one current bidirectional
 * family_care_question grant. Prepare never writes.
 */
export class PrismaSubmitEligibilityReadPort implements SubmitEligibilityReadPort {
  constructor(private readonly prisma: PrismaClient | Prisma.TransactionClient) {}

  async resolveGuardianSubmitEligibility(input: {
    workspace_id: string;
    participant_id: string;
  }): Promise<{
    participant_active: boolean;
    targets: Array<{
      enrollment_id: string;
      care_group_id: string;
      child_care_process_id: string;
      family_id: string;
      display_label: string;
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
    if (!participant) return { participant_active: false, targets: [] };

    const roles = await this.prisma.nurtureCareRoleAssignment.findMany({
      where: {
        workspaceId: input.workspace_id,
        participantId: input.participant_id,
        role: "guardian",
        status: "active",
        deletedAt: null,
        OR: [{ startsAt: null }, { startsAt: { lte: now } }],
        AND: [{ OR: [{ endsAt: null }, { endsAt: { gt: now } }] }],
      },
    });
    if (roles.length === 0) return { participant_active: true, targets: [] };

    // An enrollment-scoped guardian role reaches only that enrollment; only
    // process- and family-scoped roles reach the whole child-care process.
    // Widening would offer another Institution's enrollment as a target.
    const processIds = new Set<string>();
    const enrollmentIds = new Set<string>();
    for (const role of roles) {
      if (role.scopeType === "child_care_process") processIds.add(role.scopeId);
      else if (role.scopeType === "family") {
        const family = await this.prisma.nurtureFamily.findFirst({
          where: { id: role.scopeId, workspaceId: input.workspace_id, status: "active", deletedAt: null },
        });
        if (family) processIds.add(family.childCareProcessId);
      } else if (role.scopeType === "enrollment") {
        enrollmentIds.add(role.scopeId);
      }
    }
    if (processIds.size === 0 && enrollmentIds.size === 0) {
      return { participant_active: true, targets: [] };
    }

    const enrollments = await this.prisma.nurtureEnrollment.findMany({
      where: {
        workspaceId: input.workspace_id,
        AND: [
          {
            OR: [
              ...(processIds.size > 0
                ? [{ childCareProcessId: { in: [...processIds] } }]
                : []),
              ...(enrollmentIds.size > 0 ? [{ id: { in: [...enrollmentIds] } }] : []),
            ],
          },
        ],
        status: "active",
        deletedAt: null,
        OR: [{ leftAt: null }, { leftAt: { gt: now } }],
        institution: { status: "active", deletedAt: null },
        careGroup: { status: "active", deletedAt: null },
      },
      include: { institution: true, careGroup: true },
      orderBy: { id: "asc" },
    });

    const targets: Array<{
      enrollment_id: string;
      care_group_id: string;
      child_care_process_id: string;
      family_id: string;
      display_label: string;
    }> = [];
    for (const enrollment of enrollments) {
      const [family, thread, grant] = await Promise.all([
        this.prisma.nurtureFamily.findFirst({
          where: {
            workspaceId: input.workspace_id,
            childCareProcessId: enrollment.childCareProcessId,
            status: "active",
            deletedAt: null,
          },
          orderBy: { id: "asc" },
        }),
        this.prisma.nurtureFamilyCareThread.findFirst({
          where: {
            workspaceId: input.workspace_id,
            childCareProcessId: enrollment.childCareProcessId,
            enrollmentId: enrollment.id,
            visibilityScope: { in: ["family_private", "enrollment_private"] },
            status: "active",
            deletedAt: null,
          },
        }),
        this.prisma.nurtureChildLinkGrant.findFirst({
          where: {
            workspaceId: input.workspace_id,
            childCareProcessId: enrollment.childCareProcessId,
            enrollmentId: enrollment.id,
            status: "active",
            revokedAt: null,
            deletedAt: null,
            directions: { hasEvery: ["family_to_org", "org_to_family"] },
            dataClasses: { has: "family_care_question" },
            purposes: { has: FAMILY_CARE_PURPOSE },
            OR: [
              { grantedToScopeType: "care_group", grantedToScopeId: enrollment.careGroupId },
              { grantedToScopeType: "institution", grantedToScopeId: enrollment.institutionId },
              { grantedToScopeType: "enrollment", grantedToScopeId: enrollment.id },
            ],
            AND: [
              { OR: [{ effectiveFrom: null }, { effectiveFrom: { lte: now } }] },
              { OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
            ],
          },
        }),
      ]);
      if (!family || !thread || !grant) continue;
      targets.push({
        enrollment_id: enrollment.id,
        care_group_id: enrollment.careGroupId,
        child_care_process_id: enrollment.childCareProcessId,
        family_id: family.id,
        display_label: `${enrollment.institution.displayName} · ${enrollment.careGroup.name}`,
      });
    }
    return { participant_active: true, targets };
  }

  async resolveContinuationSource(input: {
    workspace_id: string;
    participant_id: string;
    item_id: string;
    enrollment_id: string;
  }): Promise<{ eligible: boolean }> {
    const now = new Date();
    const enrollment = await this.prisma.nurtureEnrollment.findFirst({
      where: { id: input.enrollment_id, workspaceId: input.workspace_id, deletedAt: null },
    });
    if (!enrollment) return { eligible: false };
    const family = await this.prisma.nurtureFamily.findFirst({
      where: {
        workspaceId: input.workspace_id,
        childCareProcessId: enrollment.childCareProcessId,
        status: "active",
        deletedAt: null,
      },
      orderBy: { id: "asc" },
    });
    if (!family) return { eligible: false };
    const source = await this.prisma.nurtureFamilyCareItem.findFirst({
      where: {
        id: input.item_id,
        workspaceId: input.workspace_id,
        childCareProcessId: enrollment.childCareProcessId,
        enrollmentId: input.enrollment_id,
        familyId: family.id,
        responseState: "responded",
        // A suppressed/closed source is no longer readable, so it must not be
        // referenceable either; its own original grant must also still stand.
        lifecycleState: "active",
      },
    });
    if (!source?.grantId) return { eligible: false };
    const sourceGrant = await this.prisma.nurtureChildLinkGrant.findFirst({
      where: {
        id: source.grantId,
        workspaceId: input.workspace_id,
        status: "active",
        revokedAt: null,
        deletedAt: null,
        AND: [
          { OR: [{ effectiveFrom: null }, { effectiveFrom: { lte: now } }] },
          { OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
        ],
      },
    });
    return { eligible: Boolean(sourceGrant) };
  }
}
