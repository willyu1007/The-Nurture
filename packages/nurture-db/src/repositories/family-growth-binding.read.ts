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
      select: { status: true, expiresAt: true },
    });
    return row ? { status: row.status, expiresAt: row.expiresAt } : null;
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
      select: { status: true, currentKey: true },
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
        status: association.childAnchor.status,
        ownerRef: formatNurtureBindingOwnerRef("child", association.childAnchor.id),
      },
      familyAnchor: {
        anchorId: association.familyAnchor.id,
        status: association.familyAnchor.status,
        ownerRef: formatNurtureBindingOwnerRef("family", association.familyAnchor.id),
      },
      childAssociation: {
        status: childAssociation.status,
        currentKey: childAssociation.currentKey,
      },
      familyAssociation: {
        status: association.status,
        currentKey: association.currentKey,
      },
      childAuthorization,
      familyAuthorization,
    };
  }
}
