import type { Prisma, PrismaClient } from "@prisma/client";
import {
  parseNurtureBindingOwnerRef,
  validateEnrollmentFormalizationOwnerEvidenceV1,
  validateTrialPairOwnerSnapshotV1,
  type NurtureEnrollmentFormalizationOwnerEvidenceV1,
  type NurtureTrialPairOwnerSnapshotV1,
} from "@the-nurture/scenario";

type PairOwnerPrisma = PrismaClient | Prisma.TransactionClient;

export type NurtureResolvedFormalizationGuardian = {
  participant_ref: string;
  role_assignment_ref: string;
  family_ref: string;
};

/**
 * One local current-owner verifier shared by trial setup and formalization.
 * It never treats a binding or role as permission by itself: the exact active
 * Child, Family, CareProcess, associations, authorizations and Guardian scope
 * must all agree at the transaction's current time.
 */
export class PrismaEnrollmentPairOwnerRepository {
  constructor(
    private readonly prisma: PairOwnerPrisma,
    private readonly now: () => Date,
  ) {}

  async isTrialSnapshotCurrent(
    workspaceId: string,
    snapshot: NurtureTrialPairOwnerSnapshotV1,
  ): Promise<boolean> {
    if (!validateTrialPairOwnerSnapshotV1(snapshot)) return false;
    const now = this.now();
    if (
      new Date(snapshot.verified_at) > now ||
      new Date(snapshot.expires_at) <= now
    ) return false;

    let childOwner: ReturnType<typeof parseNurtureBindingOwnerRef>;
    let familyOwner: ReturnType<typeof parseNurtureBindingOwnerRef>;
    try {
      childOwner = parseNurtureBindingOwnerRef(snapshot.child_owner_ref);
      familyOwner = parseNurtureBindingOwnerRef(snapshot.family_owner_ref);
    } catch {
      return false;
    }
    if (childOwner.subjectType !== "child" || familyOwner.subjectType !== "family") {
      return false;
    }

    const [childAssociation, familyAssociation, participant, childAuthorization, familyAuthorization] =
      await Promise.all([
        this.prisma.nurtureChildAnchorAssociation.findFirst({
          where: {
            id: snapshot.child_association_ref,
            workspaceId,
            childAnchorId: childOwner.anchorId,
            status: "active",
            currentKey: "current",
            aggregateVersion: snapshot.child_association_head,
          },
          include: { childAnchor: true, child: true },
        }),
        this.prisma.nurtureFamilyAnchorAssociation.findFirst({
          where: {
            id: snapshot.family_association_ref,
            workspaceId,
            familyAnchorId: familyOwner.anchorId,
            childAnchorId: childOwner.anchorId,
            childCareProcessId: snapshot.child_care_process_ref,
            status: "active",
            currentKey: "current",
            aggregateVersion: snapshot.family_association_head,
          },
          include: {
            familyAnchor: true,
            family: true,
            childCareProcess: true,
          },
        }),
        this.prisma.nurtureParticipant.findFirst({
          where: {
            id: snapshot.guardian_participant_ref,
            workspaceId,
            status: "active",
            deletedAt: null,
          },
          include: {
            principalBindings: {
              where: { status: "active", currentKey: "current" },
              take: 1,
            },
            roleAssignments: {
              where: {
                id: snapshot.guardian_role_assignment_ref,
                role: "guardian",
                status: "active",
                deletedAt: null,
                AND: [
                  { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
                  { OR: [{ endsAt: null }, { endsAt: { gt: now } }] },
                ],
              },
              take: 1,
            },
          },
        }),
        this.currentAuthorization(
          workspaceId,
          "child",
          childOwner.anchorId,
          now,
        ),
        this.currentAuthorization(
          workspaceId,
          "family",
          familyOwner.anchorId,
          now,
        ),
      ]);

    const role = participant?.roleAssignments[0];
    return Boolean(
      childAssociation &&
      familyAssociation &&
      childAssociation.childAnchor.status === "associated" &&
      childAssociation.childAnchor.aggregateVersion === snapshot.child_owner_version &&
      childAssociation.child.status === "active" &&
      childAssociation.child.deletedAt === null &&
      familyAssociation.familyAnchor.status === "associated" &&
      familyAssociation.familyAnchor.aggregateVersion === snapshot.family_owner_version &&
      familyAssociation.childAssociationId === childAssociation.id &&
      familyAssociation.currentChildAssociationId === childAssociation.id &&
      familyAssociation.childId === childAssociation.childId &&
      familyAssociation.family.status === "active" &&
      familyAssociation.family.deletedAt === null &&
      familyAssociation.childCareProcess.status === "active" &&
      familyAssociation.childCareProcess.deletedAt === null &&
      participant?.principalBindings[0]?.actorObjectId === snapshot.actor_ref.object_id &&
      role &&
      ((role.scopeType === "child_care_process" &&
        role.scopeId === snapshot.child_care_process_ref) ||
        (role.scopeType === "family" && role.scopeId === familyAssociation.familyId)) &&
      childAuthorization?.ownerRef === snapshot.child_owner_ref &&
      childAuthorization.ownerVersion === snapshot.child_owner_version &&
      familyAuthorization?.ownerRef === snapshot.family_owner_ref &&
      familyAuthorization.ownerVersion === snapshot.family_owner_version
    );
  }

  async resolveFormalizationGuardian(input: {
    workspace_id: string;
    child_care_process_ref: string;
    actor_object_id: string;
    evidence: NurtureEnrollmentFormalizationOwnerEvidenceV1;
  }): Promise<NurtureResolvedFormalizationGuardian | null> {
    if (!validateEnrollmentFormalizationOwnerEvidenceV1(input.evidence)) return null;
    const now = this.now();
    if (
      input.evidence.actor_ref.object_id !== input.actor_object_id ||
      new Date(input.evidence.verified_at) > now ||
      new Date(input.evidence.expires_at) <= now
    ) return null;

    const childOwnerRef = input.evidence.current_owner_evidence.owner_bindings[0].owner_ref;
    const familyOwnerRef = input.evidence.current_owner_evidence.owner_bindings[1].owner_ref;
    let childOwner: ReturnType<typeof parseNurtureBindingOwnerRef>;
    let familyOwner: ReturnType<typeof parseNurtureBindingOwnerRef>;
    try {
      childOwner = parseNurtureBindingOwnerRef(childOwnerRef.object_id);
      familyOwner = parseNurtureBindingOwnerRef(familyOwnerRef.object_id);
    } catch {
      return null;
    }
    if (
      childOwner.subjectType !== "child" ||
      familyOwner.subjectType !== "family" ||
      !Number.isSafeInteger(childOwnerRef.version) ||
      !Number.isSafeInteger(familyOwnerRef.version)
    ) return null;

    const [childAssociation, familyAssociation, bindings, childAuthorization, familyAuthorization] =
      await Promise.all([
        this.prisma.nurtureChildAnchorAssociation.findFirst({
          where: {
            workspaceId: input.workspace_id,
            childAnchorId: childOwner.anchorId,
            status: "active",
            currentKey: "current",
          },
          include: { childAnchor: true, child: true },
        }),
        this.prisma.nurtureFamilyAnchorAssociation.findFirst({
          where: {
            workspaceId: input.workspace_id,
            familyAnchorId: familyOwner.anchorId,
            childAnchorId: childOwner.anchorId,
            childCareProcessId: input.child_care_process_ref,
            status: "active",
            currentKey: "current",
          },
          include: {
            familyAnchor: true,
            family: true,
            childCareProcess: true,
          },
        }),
        this.prisma.nurtureParticipantPrincipalBinding.findMany({
          where: {
            workspaceId: input.workspace_id,
            actorObjectId: input.actor_object_id,
            status: "active",
            currentKey: "current",
            participant: { status: "active", deletedAt: null },
          },
          take: 2,
        }),
        this.currentAuthorization(
          input.workspace_id,
          "child",
          childOwner.anchorId,
          now,
        ),
        this.currentAuthorization(
          input.workspace_id,
          "family",
          familyOwner.anchorId,
          now,
        ),
      ]);
    const binding = bindings.length === 1 ? bindings[0] : undefined;
    if (
      !childAssociation ||
      !familyAssociation ||
      !binding ||
      childAssociation.childAnchor.status !== "associated" ||
      childAssociation.childAnchor.aggregateVersion !== childOwnerRef.version ||
      childAssociation.child.status !== "active" ||
      childAssociation.child.deletedAt !== null ||
      familyAssociation.familyAnchor.status !== "associated" ||
      familyAssociation.familyAnchor.aggregateVersion !== familyOwnerRef.version ||
      familyAssociation.childAssociationId !== childAssociation.id ||
      familyAssociation.currentChildAssociationId !== childAssociation.id ||
      familyAssociation.childId !== childAssociation.childId ||
      familyAssociation.family.status !== "active" ||
      familyAssociation.family.deletedAt !== null ||
      familyAssociation.childCareProcess.status !== "active" ||
      familyAssociation.childCareProcess.deletedAt !== null ||
      childAuthorization?.ownerRef !== childOwnerRef.object_id ||
      childAuthorization.ownerVersion !== childOwnerRef.version ||
      familyAuthorization?.ownerRef !== familyOwnerRef.object_id ||
      familyAuthorization.ownerVersion !== familyOwnerRef.version
    ) return null;

    const roles = await this.prisma.nurtureCareRoleAssignment.findMany({
      where: {
        workspaceId: input.workspace_id,
        participantId: binding.participantId,
        role: "guardian",
        status: "active",
        deletedAt: null,
        OR: [
          {
            scopeType: "child_care_process",
            scopeId: input.child_care_process_ref,
          },
          {
            scopeType: "family",
            scopeId: familyAssociation.familyId,
          },
        ],
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
          { OR: [{ endsAt: null }, { endsAt: { gt: now } }] },
        ],
      },
      take: 2,
    });
    return roles.length === 1 && roles[0]
      ? {
          participant_ref: binding.participantId,
          role_assignment_ref: roles[0].id,
          family_ref: familyAssociation.familyId,
        }
      : null;
  }

  private currentAuthorization(
    workspaceId: string,
    subjectType: "child" | "family",
    anchorId: string,
    now: Date,
  ) {
    return this.prisma.nurtureScenarioBindingAuthorization.findFirst({
      where: {
        workspaceId,
        subjectType,
        ...(subjectType === "child"
          ? { childAnchorId: anchorId }
          : { familyAnchorId: anchorId }),
        status: "active",
        verifiedAt: { lte: now },
        expiresAt: { gt: now },
      },
      orderBy: [{ ownerVersion: "desc" }, { verifiedAt: "desc" }],
    });
  }
}
