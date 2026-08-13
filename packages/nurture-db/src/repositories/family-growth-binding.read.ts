import type {
  FamilyGrowthAuthorizationSnapshotV1,
  FamilyGrowthBindingReadPort,
  FamilyGrowthBindingSnapshotV1,
} from "@the-nurture/scenario/family-growth";
import { formatNurtureBindingOwnerRef } from "@the-nurture/scenario/binding-owner";
import type { NurturePrismaClient } from "../client.js";

/**
 * T-009 I4: the binding read behind canonical target resolution (N1).
 *
 * Loads the one current family-anchor association for a care process, then
 * follows that row's exact child-association reference. Historical rows are
 * never candidates: touching one after revocation must not shadow the current
 * binding and create a false denial.
 */
export class PrismaFamilyGrowthBindingReadPort implements FamilyGrowthBindingReadPort {
  constructor(private readonly prisma: NurturePrismaClient) {}

  private async latestAuthorization(
    workspaceId: string,
    subjectType: "child" | "family",
    anchorId: string,
  ): Promise<FamilyGrowthAuthorizationSnapshotV1 | null> {
    const row = await this.prisma.nurtureScenarioBindingAuthorization.findFirst({
      where: {
        workspaceId,
        subjectType,
        ...(subjectType === "child" ? { childAnchorId: anchorId } : { familyAnchorId: anchorId }),
      },
      orderBy: [{ verifiedAt: "desc" }, { id: "desc" }],
      select: {
        id: true,
        status: true,
        expiresAt: true,
        aggregateVersion: true,
        ownerRef: true,
        ownerVersion: true,
        purpose: true,
        authorizationSourceRef: true,
        authorizationSourceVersion: true,
      },
    });
    if (!row) return null;
    const sourcePrefix = "nurture-care-role:";
    const roleAssignmentId = row.authorizationSourceRef.startsWith(sourcePrefix)
      ? row.authorizationSourceRef.slice(sourcePrefix.length)
      : null;
    const role = roleAssignmentId
      ? await this.prisma.nurtureCareRoleAssignment.findFirst({
          where: { id: roleAssignmentId, workspaceId },
          select: {
            id: true,
            participantId: true,
            aggregateVersion: true,
            status: true,
            role: true,
            startsAt: true,
            endsAt: true,
            deletedAt: true,
            participant: {
              select: {
                id: true,
                aggregateVersion: true,
                status: true,
                deletedAt: true,
              },
            },
          },
        })
      : null;
    return {
      authorizationId: row.id,
      aggregateVersion: row.aggregateVersion,
      status: row.status,
      ownerRef: row.ownerRef,
      ownerVersion: row.ownerVersion,
      purpose: row.purpose,
      authorizationSourceRef: row.authorizationSourceRef,
      authorizationSourceVersion: row.authorizationSourceVersion,
      expiresAt: row.expiresAt,
      guardianRole: role
        ? {
            roleAssignmentId: role.id,
            participantId: role.participantId,
            aggregateVersion: role.aggregateVersion,
            status: role.status,
            role: role.role,
            startsAt: role.startsAt,
            endsAt: role.endsAt,
            deletedAt: role.deletedAt,
          }
        : null,
      participant: role
        ? {
            participantId: role.participant.id,
            aggregateVersion: role.participant.aggregateVersion,
            status: role.participant.status,
            deletedAt: role.participant.deletedAt,
          }
        : null,
    };
  }

  async loadCurrentBinding(input: {
    workspaceId: string;
    childCareProcessId: string;
  }): Promise<FamilyGrowthBindingSnapshotV1 | null> {
    const associations = await this.prisma.nurtureFamilyAnchorAssociation.findMany({
      where: {
        workspaceId: input.workspaceId,
        childCareProcessId: input.childCareProcessId,
        currentKey: "current",
      },
      take: 2,
      include: { familyAnchor: true, childAnchor: true },
    });
    if (associations.length !== 1) return null;
    const association = associations[0]!;

    const childAssociations = await this.prisma.nurtureChildAnchorAssociation.findMany({
      where: {
        id: association.childAssociationId,
        workspaceId: input.workspaceId,
        currentKey: "current",
      },
      take: 2,
      select: { id: true, aggregateVersion: true, status: true, currentKey: true },
    });
    if (childAssociations.length !== 1) return null;
    const childAssociation = childAssociations[0]!;

    const [childAuthorization, familyAuthorization] = await Promise.all([
      this.latestAuthorization(input.workspaceId, "child", association.childAnchorId),
      this.latestAuthorization(input.workspaceId, "family", association.familyAnchorId),
    ]);

    return {
      workspaceId: association.workspaceId,
      localFamilyId: association.familyId,
      childCareProcessId: association.childCareProcessId,
      childAnchor: {
        anchorId: association.childAnchor.id,
        aggregateVersion: association.childAnchor.aggregateVersion,
        status: association.childAnchor.status,
        ownerRef: formatNurtureBindingOwnerRef("child", association.childAnchor.id),
      },
      familyAnchor: {
        anchorId: association.familyAnchor.id,
        aggregateVersion: association.familyAnchor.aggregateVersion,
        status: association.familyAnchor.status,
        ownerRef: formatNurtureBindingOwnerRef("family", association.familyAnchor.id),
      },
      childAssociation: {
        associationId: childAssociation.id,
        aggregateVersion: childAssociation.aggregateVersion,
        status: childAssociation.status,
        currentKey: childAssociation.currentKey,
      },
      familyAssociation: {
        associationId: association.id,
        aggregateVersion: association.aggregateVersion,
        status: association.status,
        currentKey: association.currentKey,
      },
      childAuthorization,
      familyAuthorization,
    };
  }
}
