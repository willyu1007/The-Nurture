import type { Prisma } from "@prisma/client";
import {
  parseNurtureBindingOwnerRef,
  type ParentContextSelectionV1,
} from "@the-nurture/scenario";

type SelectionIdentity = Readonly<{
  workspace_id: string;
  my_chat_user_id: string;
  host_request_id: string;
  context_ref: string;
  context_selection: ParentContextSelectionV1;
}>;

export type ParentContextSelectionRoute = Readonly<{
  status: "resolved";
  selection: ParentContextSelectionV1;
  childAnchorId: string;
  familyAnchorId: string;
}>;

export const resolveParentContextSelectionRoute = (
  input: SelectionIdentity,
): ParentContextSelectionRoute | Readonly<{ status: "stale_context_ref" }> => {
  const selection = input.context_selection;
  if (
    selection.workspace_id !== input.workspace_id
    || selection.my_chat_user_id !== input.my_chat_user_id
    || selection.host_request_id !== input.host_request_id
    || selection.context_ref !== input.context_ref
  ) {
    return { status: "stale_context_ref" };
  }

  try {
    const child = parseNurtureBindingOwnerRef(selection.child_binding.owner_ref);
    const family = parseNurtureBindingOwnerRef(selection.family_binding.owner_ref);
    if (child.subjectType !== "child" || family.subjectType !== "family") {
      return { status: "stale_context_ref" };
    }
    return {
      status: "resolved",
      selection,
      childAnchorId: child.anchorId,
      familyAnchorId: family.anchorId,
    };
  } catch {
    return { status: "stale_context_ref" };
  }
};

const findCurrentAssociations = (
  transaction: Prisma.TransactionClient,
  input: {
    workspaceId: string;
    childAnchorId: string;
    childAnchorVersion: number;
    familyAnchorId: string;
    familyAnchorVersion: number;
  },
) => transaction.nurtureFamilyAnchorAssociation.findMany({
  where: {
    workspaceId: input.workspaceId,
    childAnchorId: input.childAnchorId,
    familyAnchorId: input.familyAnchorId,
    status: "active",
    currentKey: "current",
    currentChildAssociationId: { not: null },
    revokedAt: null,
    quarantinedAt: null,
    familyAnchor: {
      status: "associated",
      aggregateVersion: input.familyAnchorVersion,
      revokedAt: null,
      quarantinedAt: null,
    },
    childAnchor: {
      status: "associated",
      aggregateVersion: input.childAnchorVersion,
      revokedAt: null,
      quarantinedAt: null,
    },
    childAssociation: {
      status: "active",
      currentKey: "current",
      revokedAt: null,
      quarantinedAt: null,
    },
    currentChildAssociation: {
      is: {
        status: "active",
        currentKey: "current",
        revokedAt: null,
        quarantinedAt: null,
      },
    },
    family: { status: "active", deletedAt: null },
    childCareProcess: { status: "active", deletedAt: null },
  },
  include: {
    family: true,
    childCareProcess: true,
    childAnchor: true,
    familyAnchor: true,
  },
  orderBy: { id: "asc" },
  take: 2,
});

const findCurrentSelection = (
  transaction: Prisma.TransactionClient,
  workspaceId: string,
  childCareProcessId: string,
) => transaction.nurtureParentContextEnrollmentSelection.findUnique({
  where: {
    workspaceId_childCareProcessId: { workspaceId, childCareProcessId },
  },
  include: {
    enrollment: {
      include: { careGroup: { include: { institution: true } } },
    },
  },
});

type CurrentAssociation = Awaited<ReturnType<typeof findCurrentAssociations>>[number];
type CurrentSelection = NonNullable<Awaited<ReturnType<typeof findCurrentSelection>>>;

export type ParentContextEnrollmentSelectionMapping = Readonly<{
  status: "resolved";
  association: CurrentAssociation;
  selection: CurrentSelection;
}>;

export type ParentContextEnrollmentSelectionMappingResult =
  | ParentContextEnrollmentSelectionMapping
  | Readonly<{
      status: "stale_context_ref" | "ambiguous_enrollment" | "scope_loss";
    }>;

/**
 * Resolves My-Chat's binding-only carrier to Nurture's current local
 * Enrollment selection. The result is routing context only; callers must
 * independently resolve the authority required by their operation.
 */
export const mapParentContextEnrollmentSelection = async (
  transaction: Prisma.TransactionClient,
  input: Readonly<{
    workspace_id: string;
    route: ParentContextSelectionRoute;
  }>,
  at: Date,
): Promise<ParentContextEnrollmentSelectionMappingResult> => {
  const { route } = input;
  const selection = route.selection;
  const associations = await findCurrentAssociations(transaction, {
    workspaceId: input.workspace_id,
    childAnchorId: route.childAnchorId,
    childAnchorVersion: selection.child_binding.owner_version,
    familyAnchorId: route.familyAnchorId,
    familyAnchorVersion: selection.family_binding.owner_version,
  });
  if (associations.length !== 1) return { status: "stale_context_ref" };
  const association = associations[0]!;
  if (association.childAssociationId !== association.currentChildAssociationId) {
    return { status: "stale_context_ref" };
  }

  const currentSelection = await findCurrentSelection(
    transaction,
    input.workspace_id,
    association.childCareProcessId,
  );
  if (!currentSelection) return { status: "ambiguous_enrollment" };
  const enrollment = currentSelection.enrollment;
  if (
    enrollment.status !== "active"
    || enrollment.deletedAt
    || (enrollment.leftAt && enrollment.leftAt <= at)
    || enrollment.childCareProcessId !== association.childCareProcessId
    || enrollment.careGroup.status !== "active"
    || enrollment.careGroup.deletedAt
    || enrollment.careGroup.institution.status !== "active"
    || enrollment.careGroup.institution.deletedAt
    || enrollment.institutionId !== enrollment.careGroup.institutionId
  ) {
    return { status: "scope_loss" };
  }

  return { status: "resolved", association, selection: currentSelection };
};
