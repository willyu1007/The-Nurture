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
 * Loads the LATEST family-anchor association state for one care process —
 * not only the `currentKey = "current"` row — so a revoked or quarantined
 * chain denies with its precise reason instead of presenting as "missing".
 * Currency itself is judged by the resolver, not here.
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
    const association = await this.prisma.nurtureFamilyAnchorAssociation.findFirst({
      where: {
        workspaceId: input.workspaceId,
        childCareProcessId: input.childCareProcessId,
      },
      // Latest state wins; the current row (if any) is also the newest by
      // construction because revocation updates the row it clears. The id
      // tiebreaker keeps same-instant rows deterministic.
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      include: { familyAnchor: true, childAnchor: true },
    });
    if (!association) return null;

    const childAssociation = await this.prisma.nurtureChildAnchorAssociation.findFirst({
      where: {
        workspaceId: input.workspaceId,
        childAnchorId: association.childAnchorId,
        childId: association.childId,
      },
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      select: { status: true, currentKey: true },
    });
    if (!childAssociation) return null;

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
