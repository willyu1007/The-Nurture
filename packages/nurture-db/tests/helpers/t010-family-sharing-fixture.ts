import { createHash, randomUUID } from "node:crypto";
import type { Prisma, PrismaClient } from "@prisma/client";
import {
  NURTURE_FAMILY_SHARING_AUTHORITY_READ_AUDIENCE,
  NURTURE_FAMILY_SHARING_AUTHORITY_READ_OPERATION,
  NURTURE_FAMILY_SHARING_CLEANUP_CONTRACT,
  NURTURE_FAMILY_SHARING_ELIGIBILITY_PURPOSE,
  type NurtureFamilySharingCleanupPrivateInputV1,
  type NurtureFamilySharingCurrentAuthorityReadInputV1,
} from "@the-nurture/scenario";

export const T010_EVALUATED_AT = "2026-08-12T08:00:00.000Z";

export type T010FamilySharingFixture = Readonly<{
  runId: string;
  workspaceId: string;
  myChatUserId: string;
  participantId: string;
  participantBindingId: string;
  roleAssignmentId: string;
  childAnchorId: string;
  familyAnchorId: string;
  childAssociationId: string;
  familyAssociationId: string;
  childId: string;
  processId: string;
  familyId: string;
  institutionId: string;
  careGroupId: string;
  enrollmentId: string;
  commandExecutionId: string;
  pairOperationId: string;
}>;

export async function seedT010FamilySharingFixture(
  database: Prisma.TransactionClient,
  prefix = "t010-c4",
): Promise<T010FamilySharingFixture> {
  const runId = randomUUID();
  const item = {
    runId,
    workspaceId: `${prefix}-workspace-${runId}`,
    myChatUserId: `${prefix}-user-${runId}`,
    participantId: `${prefix}-participant-${runId}`,
    participantBindingId: randomUUID(),
    roleAssignmentId: `${prefix}-role-${runId}`,
    childAnchorId: randomUUID(),
    familyAnchorId: randomUUID(),
    childAssociationId: randomUUID(),
    familyAssociationId: randomUUID(),
    childId: `${prefix}-child-${runId}`,
    processId: `${prefix}-process-${runId}`,
    familyId: `${prefix}-family-${runId}`,
    institutionId: `${prefix}-institution-${runId}`,
    careGroupId: `${prefix}-group-${runId}`,
    enrollmentId: `${prefix}-enrollment-${runId}`,
    commandExecutionId: randomUUID(),
    pairOperationId: `${prefix}-pair-${runId}`,
  } satisfies T010FamilySharingFixture;

  await database.nurtureParticipant.create({
    data: {
      id: item.participantId,
      workspaceId: item.workspaceId,
      myChatUserId: item.myChatUserId,
      status: "active",
      aggregateVersion: 3,
    },
  });
  await database.nurtureParticipantPrincipalBinding.create({
    data: {
      id: item.participantBindingId,
      participantId: item.participantId,
      workspaceId: item.workspaceId,
      accountObjectId: `${prefix}-account-${runId}`,
      actorObjectId: `${prefix}-actor-${runId}`,
      bindingVersion: 1,
      status: "active",
      currentKey: "current",
      aggregateVersion: 1,
    },
  });
  await Promise.all([
    database.nurtureChildBindingAnchor.create({
      data: {
        id: item.childAnchorId,
        reservationKeyHash: digest(`child-anchor:${runId}`),
        status: "associated",
        aggregateVersion: 4,
      },
    }),
    database.nurtureFamilyBindingAnchor.create({
      data: {
        id: item.familyAnchorId,
        reservationKeyHash: digest(`family-anchor:${runId}`),
        status: "associated",
        aggregateVersion: 5,
      },
    }),
    database.nurtureChild.create({
      data: {
        id: item.childId,
        workspaceId: item.workspaceId,
        displayName: "T010 synthetic child",
        status: "active",
        aggregateVersion: 6,
      },
    }),
    database.nurtureCareInstitution.create({
      data: {
        id: item.institutionId,
        workspaceId: item.workspaceId,
        displayName: "T010 synthetic institution",
        status: "active",
        aggregateVersion: 7,
      },
    }),
  ]);
  await database.nurtureChildCareProcess.create({
    data: {
      id: item.processId,
      workspaceId: item.workspaceId,
      childId: item.childId,
      status: "active",
      aggregateVersion: 8,
    },
  });
  await Promise.all([
    database.nurtureFamily.create({
      data: {
        id: item.familyId,
        workspaceId: item.workspaceId,
        childCareProcessId: item.processId,
        status: "active",
        aggregateVersion: 9,
      },
    }),
    database.nurtureCareGroup.create({
      data: {
        id: item.careGroupId,
        workspaceId: item.workspaceId,
        institutionId: item.institutionId,
        name: "T010 synthetic group",
        status: "active",
        aggregateVersion: 10,
      },
    }),
    database.nurtureCareRoleAssignment.create({
      data: {
        id: item.roleAssignmentId,
        workspaceId: item.workspaceId,
        participantId: item.participantId,
        role: "guardian",
        scopeType: "child_care_process",
        scopeId: item.processId,
        status: "active",
        aggregateVersion: 11,
      },
    }),
    database.nurtureChildAnchorAssociation.create({
      data: {
        id: item.childAssociationId,
        workspaceId: item.workspaceId,
        childAnchorId: item.childAnchorId,
        childId: item.childId,
        status: "active",
        currentKey: "current",
        aggregateVersion: 12,
      },
    }),
  ]);
  await database.nurtureEnrollment.create({
    data: {
      id: item.enrollmentId,
      workspaceId: item.workspaceId,
      childCareProcessId: item.processId,
      institutionId: item.institutionId,
      careGroupId: item.careGroupId,
      status: "active",
      participationPhase: "formal",
      aggregateVersion: 13,
    },
  });
  await database.nurtureParentContextEnrollmentSelection.create({
    data: {
      workspaceId: item.workspaceId,
      childCareProcessId: item.processId,
      enrollmentId: item.enrollmentId,
      aggregateVersion: 1,
      selectedAt: new Date("2026-08-12T07:59:00.000Z"),
    },
  });
  await database.nurtureFamilyAnchorAssociation.create({
    data: {
      id: item.familyAssociationId,
      workspaceId: item.workspaceId,
      familyAnchorId: item.familyAnchorId,
      childAnchorId: item.childAnchorId,
      childAssociationId: item.childAssociationId,
      currentChildAssociationId: item.childAssociationId,
      childId: item.childId,
      childCareProcessId: item.processId,
      familyId: item.familyId,
      status: "active",
      currentKey: "current",
      aggregateVersion: 14,
    },
  });
  await database.nurtureCommandExecution.create({
    data: {
      id: item.commandExecutionId,
      workspaceId: item.workspaceId,
      commandRequestIdHash: digest(`command-request:${runId}`),
      originInvocationRequestIdHash: digest(`origin-invocation:${runId}`),
      commandKey: "t010_family_sharing_qualification",
      commandScope: "c30_pair",
      commandContractVersion: 1,
      payloadHash: digest(`payload:${runId}`),
      businessActorRef: item.participantId,
      businessOutcome: "applied",
      outputRefs: [],
      handoffRequestSnapshotsPayload: [],
      committedAt: new Date("2026-08-12T07:59:00.000Z"),
    },
  });
  await database.nurtureC30PairOperation.create({
    data: {
      id: item.pairOperationId,
      workspaceId: item.workspaceId,
      scenarioKey: "nurture",
      participantId: item.participantId,
      participantBindingId: item.participantBindingId,
      accountObjectId: `${prefix}-account-${runId}`,
      actorObjectId: `${prefix}-actor-${runId}`,
      childAnchorId: item.childAnchorId,
      familyAnchorId: item.familyAnchorId,
      childOwnerVersion: 4,
      familyOwnerVersion: 5,
      authoritySourceRef: `${prefix}-authority-${runId}`,
      authoritySourceVersion: 1,
      principalProvenanceHash: digest(`principal:${runId}`),
      continuationContextHash: digest(`continuation:${runId}`),
      pairRelationEvidenceHash: digest(`relation:${runId}`),
      currentOwnerEvidenceHash: digest(`owner:${runId}`),
      canonicalInputHash: digest(`input:${runId}`),
      pairCommitEvidenceHash: digest(`commit:${runId}`),
      associationExpectationHash: digest(`expectation:${runId}`),
      scenarioCommandId: `${prefix}-command-${runId}`,
      scenarioCommandHash: digest(`command:${runId}`),
      requestNonceHash: digest(`nonce:${runId}`),
      hostIdentityEvidenceHash: digest(`host:${runId}`),
      deadlineEvidenceHash: digest(`deadline:${runId}`),
      attemptLedgerHash: digest(`attempt:${runId}`),
      writerFenceHash: digest(`fence:${runId}`),
      effectDeadlineAt: new Date("2026-08-12T08:05:00.000Z"),
      state: "committed",
      childAssociationId: item.childAssociationId,
      familyAssociationId: item.familyAssociationId,
      commandExecutionId: item.commandExecutionId,
      scenarioCommitEvidenceHash: digest(`scenario-commit:${runId}`),
      participantVersion: 3,
      childCareProcessVersion: 8,
      familyVersion: 9,
      committedAt: new Date("2026-08-12T07:59:00.000Z"),
    },
  });
  await database.nurtureFamilySharingAuthority.createMany({
    data: [
      authorityRow(item, "daily_activity", "nurture_to_family"),
      authorityRow(item, "media", "family_to_nurture"),
      authorityRow(item, "focus_collaboration", "family_to_nurture"),
    ],
  });
  await database.nurtureFamilySharingPolicy.createMany({
    data: ([
      ["daily_activity", "nurture_to_family"],
      ["media", "family_to_nurture"],
      ["focus_collaboration", "family_to_nurture"],
    ] as const).flatMap(([category, direction]) => [
      policyRow(item, category, direction, "release"),
      policyRow(item, category, direction, "receiving"),
    ]),
  });
  return item;
}

export async function removeT010FamilySharingFixture(
  database: PrismaClient,
  item: T010FamilySharingFixture,
): Promise<void> {
  await database.nurtureFamilySharingPolicy.deleteMany({
    where: { workspaceId: item.workspaceId },
  });
  await database.nurtureFamilySharingAuthority.deleteMany({
    where: { workspaceId: item.workspaceId },
  });
  await database.nurtureC30PairOperation.deleteMany({
    where: { id: item.pairOperationId },
  });
  await database.nurtureCommandExecution.deleteMany({
    where: { workspaceId: item.workspaceId },
  });
  await database.nurtureFamilyAnchorAssociation.deleteMany({
    where: { id: item.familyAssociationId },
  });
  await database.nurtureChildAnchorAssociation.deleteMany({
    where: { id: item.childAssociationId },
  });
  await database.nurtureParentContextEnrollmentSelection.deleteMany({
    where: { workspaceId: item.workspaceId },
  });
  await database.nurtureEnrollment.deleteMany({ where: { id: item.enrollmentId } });
  await database.nurtureCareRoleAssignment.deleteMany({
    where: { id: item.roleAssignmentId },
  });
  await database.nurtureCareGroup.deleteMany({ where: { id: item.careGroupId } });
  await database.nurtureCareInstitution.deleteMany({
    where: { id: item.institutionId },
  });
  await database.nurtureFamily.deleteMany({ where: { id: item.familyId } });
  await database.nurtureChildCareProcess.deleteMany({
    where: { id: item.processId },
  });
  await database.nurtureChild.deleteMany({ where: { id: item.childId } });
  await database.nurtureChildBindingAnchor.deleteMany({
    where: { id: item.childAnchorId },
  });
  await database.nurtureFamilyBindingAnchor.deleteMany({
    where: { id: item.familyAnchorId },
  });
  await database.nurtureParticipantPrincipalBinding.deleteMany({
    where: { id: item.participantBindingId },
  });
  await database.nurtureParticipant.deleteMany({ where: { id: item.participantId } });
}

export function t010CurrentAuthorityInput(
  item: T010FamilySharingFixture,
): NurtureFamilySharingCurrentAuthorityReadInputV1 {
  return {
    principal: {
      verification: "verified_service_principal",
      service_ref: "my-chat-family-sharing-runtime",
      trust_source_ref: "c30.trust:my-chat.host:my-chat-family-sharing-workload",
      trust_source_version: 1,
      audience: NURTURE_FAMILY_SHARING_AUTHORITY_READ_AUDIENCE,
      operation: NURTURE_FAMILY_SHARING_AUTHORITY_READ_OPERATION,
    },
    pair_evidence: {
      verification: "verified_current_pair_evidence",
      evidence_ref: `t010-pair-evidence-${item.runId}`,
      evidence_version: 1,
      verified_at: "2026-08-12T07:59:00.000Z",
      expires_at: "2026-08-12T08:01:00.000Z",
      child_anchor_ref: item.childAnchorId,
      child_owner_version: 4,
      family_anchor_ref: item.familyAnchorId,
      family_owner_version: 5,
      my_chat_family_lifecycle: "active",
    },
    local_pair: {
      workspace_id: item.workspaceId,
      child_ref: item.childId,
      child_care_process_ref: item.processId,
      family_ref: item.familyId,
      child_association_ref: item.childAssociationId,
      family_association_ref: item.familyAssociationId,
    },
    target: {
      verification: "verified_exact_target_selector",
      pair_evidence_ref: `t010-pair-evidence-${item.runId}`,
      pair_evidence_version: 1,
      target_kind: "enrollment",
      enrollment_ref: item.enrollmentId,
      enrollment_revision: 13,
    },
    purpose: NURTURE_FAMILY_SHARING_ELIGIBILITY_PURPOSE,
    evaluated_at: T010_EVALUATED_AT,
  };
}

export function t010CleanupRequest(
  item: T010FamilySharingFixture,
  cleanupCommandRef: string,
  categories: readonly ("media" | "focus_collaboration")[] = ["media"],
): Readonly<{
  wire: NurtureFamilySharingCleanupPrivateInputV1;
  local_pair: NurtureFamilySharingCurrentAuthorityReadInputV1["local_pair"];
}> {
  const authority = t010CurrentAuthorityInput(item);
  return {
    wire: {
      cleanup_contract: NURTURE_FAMILY_SHARING_CLEANUP_CONTRACT,
      cleanup_command_ref: cleanupCommandRef,
      purpose: NURTURE_FAMILY_SHARING_ELIGIBILITY_PURPOSE,
      categories,
      pair_evidence: {
        evidence_ref: authority.pair_evidence.evidence_ref,
        evidence_version: authority.pair_evidence.evidence_version,
        verified_at: authority.pair_evidence.verified_at,
        expires_at: authority.pair_evidence.expires_at,
        child_anchor_ref: authority.pair_evidence.child_anchor_ref,
        child_owner_version: authority.pair_evidence.child_owner_version,
        family_anchor_ref: authority.pair_evidence.family_anchor_ref,
        family_owner_version: authority.pair_evidence.family_owner_version,
        my_chat_family_lifecycle: authority.pair_evidence.my_chat_family_lifecycle,
      },
      target: {
        pair_evidence_ref: authority.target.pair_evidence_ref,
        pair_evidence_version: authority.target.pair_evidence_version,
        target_kind: "enrollment",
        enrollment_ref: authority.target.enrollment_ref,
        enrollment_revision: authority.target.enrollment_revision,
      },
    },
    local_pair: authority.local_pair,
  };
}

function authorityRow(
  item: T010FamilySharingFixture,
  category: "daily_activity" | "media" | "focus_collaboration",
  direction: "nurture_to_family" | "family_to_nurture",
): Prisma.NurtureFamilySharingAuthorityCreateManyInput {
  return {
    id: `t010-authority-${category}-${item.runId}`,
    workspaceId: item.workspaceId,
    childCareProcessId: item.processId,
    familyId: item.familyId,
    enrollmentId: item.enrollmentId,
    category,
    direction,
    purpose: NURTURE_FAMILY_SHARING_ELIGIBILITY_PURPOSE,
    status: "active",
    effectiveFrom: new Date("2026-08-12T07:00:00.000Z"),
    expiresAt: new Date("2026-08-12T09:00:00.000Z"),
    authorizingRole: "guardian",
    authorizingRoleAssignmentId: item.roleAssignmentId,
    authorityVersion: 1,
  };
}

function policyRow(
  item: T010FamilySharingFixture,
  category: "daily_activity" | "media" | "focus_collaboration",
  direction: "nurture_to_family" | "family_to_nurture",
  axis: "release" | "receiving",
): Prisma.NurtureFamilySharingPolicyCreateManyInput {
  return {
    id: `t010-policy-${category}-${axis}-${item.runId}`,
    workspaceId: item.workspaceId,
    childCareProcessId: item.processId,
    familyId: item.familyId,
    enrollmentId: item.enrollmentId,
    category,
    direction,
    axis,
    purpose: NURTURE_FAMILY_SHARING_ELIGIBILITY_PURPOSE,
    status: "active",
    effectiveFrom: new Date("2026-08-12T07:00:00.000Z"),
    expiresAt: new Date("2026-08-12T09:00:00.000Z"),
    authorizingRole: "guardian",
    authorizingRoleAssignmentId: item.roleAssignmentId,
    policyVersion: 1,
  };
}

function digest(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}
