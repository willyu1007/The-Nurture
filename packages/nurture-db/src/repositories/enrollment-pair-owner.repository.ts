import type { Prisma, PrismaClient } from "@prisma/client";
import {
  assertCanonicalRef,
  assertScenarioCurrentOwnerBindingPairEvidenceV1,
  type CanonicalRef,
  type ScenarioCurrentOwnerBindingPairEvidenceV1,
} from "@my-chat/workflow-contracts";
import {
  parseNurtureBindingOwnerRef,
  validateEnrollmentFormalizationOwnerEvidenceV1,
  validateTrialGrantTermsSnapshotV1,
  validateTrialPairOwnerSnapshotV1,
  type NurtureEnrollmentFormalizationOwnerEvidenceV1,
  type NurtureTrialGrantTermsSnapshotV1,
  type NurtureTrialPairOwnerSnapshotV1,
} from "@the-nurture/scenario";

type PairOwnerPrisma = PrismaClient | Prisma.TransactionClient;

export type NurtureResolvedFormalizationGuardian = {
  participant_ref: string;
  role_assignment_ref: string;
  family_ref: string;
};

export type NurtureDerivedTrialOwnerFacts = {
  pair: NurtureTrialPairOwnerSnapshotV1;
  grant_terms: NurtureTrialGrantTermsSnapshotV1;
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

  async deriveTrialPair(input: {
    workspace_id: string;
    institution_ref: string;
    workflow_ref: string;
    current_owner_evidence: ScenarioCurrentOwnerBindingPairEvidenceV1;
  }): Promise<NurtureDerivedTrialOwnerFacts | null> {
    try {
      assertScenarioCurrentOwnerBindingPairEvidenceV1(input.current_owner_evidence);
    } catch {
      return null;
    }
    if (input.current_owner_evidence.purpose_key !== "enrollment_trial_pair") {
      return null;
    }
    const [childBinding, familyBinding] = input.current_owner_evidence.owner_bindings;
    let childOwner: ReturnType<typeof parseNurtureBindingOwnerRef>;
    let familyOwner: ReturnType<typeof parseNurtureBindingOwnerRef>;
    try {
      childOwner = parseNurtureBindingOwnerRef(childBinding.owner_ref.object_id);
      familyOwner = parseNurtureBindingOwnerRef(familyBinding.owner_ref.object_id);
    } catch {
      return null;
    }
    if (
      childBinding.binding_slot !== "child" ||
      familyBinding.binding_slot !== "family" ||
      childOwner.subjectType !== "child" ||
      familyOwner.subjectType !== "family"
    ) return null;

    const now = this.now();
    const [workflow, reservations, childAssociation, familyAssociation, childAuthorizations, familyAuthorizations, policies] =
      await Promise.all([
        this.prisma.nurtureInstitutionWorkflow.findFirst({
          where: {
            id: input.workflow_ref,
            workspaceId: input.workspace_id,
            institutionId: input.institution_ref,
            lifecycle: "active",
            currentStage: "trial_preparation",
            pendingTransition: { in: ["none", "trial_start_pending"] },
            institution: { status: "active", deletedAt: null },
          },
          select: { id: true, childCareProcessId: true },
        }),
        this.prisma.nurtureEnrollmentTrialReservation.findMany({
          where: {
            workspaceId: input.workspace_id,
            institutionId: input.institution_ref,
            workflowId: input.workflow_ref,
            state: "held",
            releasedAt: null,
            trialEndsAt: { gt: now },
          },
          select: {
            acceptedActorRef: true,
            trialEndsAt: true,
          },
          take: 2,
        }),
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
            status: "active",
            currentKey: "current",
          },
          include: {
            familyAnchor: true,
            family: true,
            childCareProcess: true,
          },
        }),
        this.currentAuthorizations(input.workspace_id, "child", childOwner.anchorId, now),
        this.currentAuthorizations(input.workspace_id, "family", familyOwner.anchorId, now),
        this.prisma.nurtureEnrollmentTrialGrantPolicy.findMany({
          where: {
            workspaceId: input.workspace_id,
            institutionId: input.institution_ref,
            effectiveFrom: { lte: now },
            expiresAt: { gt: now },
            supersededAt: null,
          },
          take: 2,
        }),
      ]);
    const reservation = reservations.length === 1 ? reservations[0] : undefined;
    const policy = policies.length === 1 ? policies[0] : undefined;
    const childAuthorization = only(childAuthorizations);
    const familyAuthorization = only(familyAuthorizations);
    if (
      !workflow ||
      !reservation ||
      !childAssociation ||
      !familyAssociation ||
      !childAuthorization ||
      !familyAuthorization ||
      !policy ||
      policy.expiresAt < reservation.trialEndsAt ||
      childAssociation.childAnchor.status !== "associated" ||
      childAssociation.childAnchor.aggregateVersion !== childBinding.owner_ref.version ||
      childAssociation.child.status !== "active" ||
      childAssociation.child.deletedAt !== null ||
      familyAssociation.familyAnchor.status !== "associated" ||
      familyAssociation.familyAnchor.aggregateVersion !== familyBinding.owner_ref.version ||
      familyAssociation.childAssociationId !== childAssociation.id ||
      familyAssociation.currentChildAssociationId !== childAssociation.id ||
      familyAssociation.childId !== childAssociation.childId ||
      familyAssociation.family.status !== "active" ||
      familyAssociation.family.deletedAt !== null ||
      familyAssociation.childCareProcess.status !== "active" ||
      familyAssociation.childCareProcess.deletedAt !== null ||
      (workflow.childCareProcessId !== null &&
        workflow.childCareProcessId !== familyAssociation.childCareProcessId) ||
      childAuthorization.ownerRef !== childBinding.owner_ref.object_id ||
      childAuthorization.ownerVersion !== childBinding.owner_ref.version ||
      familyAuthorization.ownerRef !== familyBinding.owner_ref.object_id ||
      familyAuthorization.ownerVersion !== familyBinding.owner_ref.version
    ) return null;

    let actorRef: CanonicalRef;
    try {
      assertCanonicalRef(reservation.acceptedActorRef);
      actorRef = reservation.acceptedActorRef;
    } catch {
      return null;
    }
    if (actorRef.namespace !== "my_chat" || actorRef.object_type !== "actor") {
      return null;
    }
    const bindings = await this.prisma.nurtureParticipantPrincipalBinding.findMany({
      where: {
        workspaceId: input.workspace_id,
        actorObjectId: actorRef.object_id,
        status: "active",
        currentKey: "current",
        participant: { status: "active", deletedAt: null },
      },
      select: { participantId: true },
      take: 2,
    });
    const binding = bindings.length === 1 ? bindings[0] : undefined;
    if (!binding) return null;
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
            scopeId: familyAssociation.childCareProcessId,
          },
          { scopeType: "family", scopeId: familyAssociation.familyId },
        ],
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
          { OR: [{ endsAt: null }, { endsAt: { gt: now } }] },
        ],
      },
      select: { id: true, endsAt: true },
      take: 2,
    });
    const role = roles.length === 1 ? roles[0] : undefined;
    if (!role) return null;

    const pairExpiry = earliestInstant(
      childAuthorization.expiresAt,
      familyAuthorization.expiresAt,
      role.endsAt,
    );
    const pair: NurtureTrialPairOwnerSnapshotV1 = {
      contract_version: "1.0.0",
      actor_ref: actorRef,
      guardian_participant_ref: binding.participantId,
      guardian_role_assignment_ref: role.id,
      child_owner_ref: childBinding.owner_ref.object_id,
      child_owner_version: childBinding.owner_ref.version,
      family_owner_ref: familyBinding.owner_ref.object_id,
      family_owner_version: familyBinding.owner_ref.version,
      child_association_ref: childAssociation.id,
      child_association_head: childAssociation.aggregateVersion,
      family_association_ref: familyAssociation.id,
      family_association_head: familyAssociation.aggregateVersion,
      child_care_process_ref: familyAssociation.childCareProcessId,
      verified_at: now.toISOString(),
      expires_at: pairExpiry.toISOString(),
    };
    const grantTerms = {
      contract_version: "1.0.0",
      policy_ref: policy.policyRef,
      policy_revision: policy.policyRevision,
      directions: policy.directions,
      data_classes: policy.dataClasses,
      purposes: policy.purposes,
      verified_at: now.toISOString(),
      expires_at: policy.expiresAt.toISOString(),
    };
    return validateTrialPairOwnerSnapshotV1(pair) &&
      validateTrialGrantTermsSnapshotV1(grantTerms)
      ? { pair, grant_terms: grantTerms }
      : null;
  }

  async isTrialGrantTermsCurrent(input: {
    workspace_id: string;
    institution_ref: string;
    snapshot: NurtureTrialGrantTermsSnapshotV1;
    required_until: Date;
  }): Promise<boolean> {
    if (!validateTrialGrantTermsSnapshotV1(input.snapshot)) return false;
    const now = this.now();
    if (
      new Date(input.snapshot.verified_at) > now ||
      new Date(input.snapshot.expires_at) <= now ||
      new Date(input.snapshot.expires_at) < input.required_until
    ) return false;
    const policies = await this.prisma.nurtureEnrollmentTrialGrantPolicy.findMany({
      where: {
        workspaceId: input.workspace_id,
        institutionId: input.institution_ref,
        effectiveFrom: { lte: now },
        expiresAt: { gt: now },
        supersededAt: null,
      },
      take: 2,
    });
    const policy = only(policies);
    return Boolean(
      policy &&
      policy.expiresAt >= input.required_until &&
      input.snapshot.contract_version === policy.contractVersion &&
      input.snapshot.policy_ref === policy.policyRef &&
      input.snapshot.policy_revision === policy.policyRevision &&
      input.snapshot.expires_at === policy.expiresAt.toISOString() &&
      sameValues(input.snapshot.directions, policy.directions) &&
      sameValues(input.snapshot.data_classes, policy.dataClasses) &&
      sameValues(input.snapshot.purposes, policy.purposes),
    );
  }

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

    const [childAssociation, familyAssociation, bindings, childAuthorizations, familyAuthorizations] =
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
        this.prisma.nurtureParticipantPrincipalBinding.findMany({
          where: {
            workspaceId,
            actorObjectId: snapshot.actor_ref.object_id,
            status: "active",
            currentKey: "current",
            participant: {
              status: "active",
              deletedAt: null,
            },
          },
          select: {
            actorObjectId: true,
            participant: {
              select: {
                id: true,
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
            },
          },
          take: 2,
        }),
        this.currentAuthorizations(
          workspaceId,
          "child",
          childOwner.anchorId,
          now,
        ),
        this.currentAuthorizations(
          workspaceId,
          "family",
          familyOwner.anchorId,
          now,
        ),
      ]);

    const binding = only(bindings);
    const childAuthorization = only(childAuthorizations);
    const familyAuthorization = only(familyAuthorizations);
    const role = binding?.participant.roleAssignments[0];
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
      binding &&
      binding.actorObjectId === snapshot.actor_ref.object_id &&
      binding.participant.id === snapshot.guardian_participant_ref &&
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

    const [childAssociation, familyAssociation, bindings, childAuthorizations, familyAuthorizations] =
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
        this.currentAuthorizations(
          input.workspace_id,
          "child",
          childOwner.anchorId,
          now,
        ),
        this.currentAuthorizations(
          input.workspace_id,
          "family",
          familyOwner.anchorId,
          now,
        ),
      ]);
    const binding = bindings.length === 1 ? bindings[0] : undefined;
    const childAuthorization = only(childAuthorizations);
    const familyAuthorization = only(familyAuthorizations);
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

  private currentAuthorizations(
    workspaceId: string,
    subjectType: "child" | "family",
    anchorId: string,
    now: Date,
  ) {
    return this.prisma.nurtureScenarioBindingAuthorization.findMany({
      where: {
        workspaceId,
        subjectType,
        ...(subjectType === "child"
          ? { childAnchorId: anchorId }
          : { familyAnchorId: anchorId }),
        purpose: "scenario_binding_write",
        status: "active",
        verifiedAt: { lte: now },
        expiresAt: { gt: now },
      },
      orderBy: [{ ownerVersion: "desc" }, { verifiedAt: "desc" }],
      take: 2,
    });
  }
}

function earliestInstant(first: Date, second: Date, third: Date | null): Date {
  const values = third ? [first, second, third] : [first, second];
  return new Date(Math.min(...values.map((value) => value.getTime())));
}

function only<Value>(values: readonly Value[]): Value | undefined {
  return values.length === 1 ? values[0] : undefined;
}

function sameValues(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length &&
    left.every((value, index) => value === right[index]);
}
