import { randomUUID } from "node:crypto";
import { afterAll, afterEach, describe, expect, it } from "vitest";
import {
  DAILY_ATTENDANCE_CLOSEOUT_CONTRACT,
  DAILY_ATTENDANCE_CLOSEOUT_POLICY_REF,
} from "@the-nurture/scenario";
import type {
  NurtureInstitutionSupportSignalOwnerReadRequest,
  NurtureInstitutionSupportSignalPolicyV1,
} from "@the-nurture/scenario";
import { createPrismaClient } from "../src/client.js";
import {
  PRISMA_INSTITUTION_SUPPORT_SIGNAL_CHECKPOINTS,
  createPrismaInstitutionSupportSignalOwnerBindings,
  createPrismaInstitutionSupportSignalRepository,
} from "../src/repositories/institution-support-signal.owner-providers.js";
import { loadInstitutionLocalDay } from "../src/repositories/institution-local-day.js";

const prisma = createPrismaClient();
const testWorkspaceIds = new Set<string>();

const cleanupTestWorkspaces = async () => {
  const workspaceIds = [...testWorkspaceIds];
  if (workspaceIds.length === 0) return;
  await prisma.$transaction(async (tx) => {
    const where = { workspaceId: { in: workspaceIds } };
    await tx.nurtureActivityPlacement.deleteMany({ where });
    await tx.nurtureChildLinkReceipt.deleteMany({ where });
    await tx.nurtureDailyCareLog.deleteMany({ where });
    await tx.nurtureFamilyCareItem.deleteMany({ where });
    await tx.nurtureFamilyCareMessage.deleteMany({ where });
    await tx.nurtureFamilyCareThread.deleteMany({ where });
    await tx.nurtureAttendanceEntry.deleteMany({ where });
    await tx.nurtureDailyAttendanceSubmission.deleteMany({ where });
    await tx.nurtureChildLinkGrant.deleteMany({ where });
    await tx.nurtureAttendanceCloseoutPolicy.deleteMany({ where });
    await tx.nurtureCareRoleAssignment.deleteMany({ where });
    await tx.nurtureEnrollment.deleteMany({ where });
    await tx.nurtureFamily.deleteMany({ where });
    await tx.nurtureCareGroup.deleteMany({ where });
    await tx.nurtureInstitutionPublicationPolicy.deleteMany({ where });
    await tx.nurtureCareInstitution.deleteMany({ where });
    await tx.nurtureChildCareProcess.deleteMany({ where });
    await tx.nurtureChild.deleteMany({ where });
    await tx.nurtureParticipant.deleteMany({ where });
  });
  for (const workspaceId of workspaceIds) testWorkspaceIds.delete(workspaceId);
};

afterEach(cleanupTestWorkspaces);

afterAll(async () => {
  try {
    await cleanupTestWorkspaces();
  } finally {
    await prisma.$disconnect();
  }
});

const localDate = "2099-08-09";
const day = new Date(`${localDate}T00:00:00.000Z`);
const snapshotAt = `${localDate}T23:59:59.999Z`;

const seedScope = async () => {
  const workspaceId = randomUUID();
  testWorkspaceIds.add(workspaceId);
  const [admin, caregiver, guardian] = await Promise.all([
    prisma.nurtureParticipant.create({
      data: { workspaceId, myChatUserId: `admin:${workspaceId}`, status: "active" },
    }),
    prisma.nurtureParticipant.create({
      data: { workspaceId, myChatUserId: `caregiver:${workspaceId}`, status: "active" },
    }),
    prisma.nurtureParticipant.create({
      data: { workspaceId, myChatUserId: `guardian:${workspaceId}`, status: "active" },
    }),
  ]);
  const child = await prisma.nurtureChild.create({
    data: { workspaceId, displayName: "Child", status: "active" },
  });
  const process = await prisma.nurtureChildCareProcess.create({
    data: { workspaceId, childId: child.id, status: "active" },
  });
  const family = await prisma.nurtureFamily.create({
    data: { workspaceId, childCareProcessId: process.id, status: "active" },
  });
  const institution = await prisma.nurtureCareInstitution.create({
    data: { workspaceId, displayName: "Signal Institution", status: "active" },
  });
  await prisma.nurtureInstitutionPublicationPolicy.create({
    data: {
      workspaceId,
      institutionId: institution.id,
      policyRef: "nurture.institution-publication-policy@1.0.0",
      policyVersion: 1,
      policyHead: 1,
      timeZone: "UTC",
      defaultReleaseLocalTime: "17:00",
      retryCutoffLocalTime: "19:00",
      organizeIdleSeconds: 600,
      organizeFallbackLeadSeconds: 1800,
      automaticQuiescenceSeconds: 60,
      captureActivityLeaseSeconds: 60,
      automaticOrganizeEnabled: false,
      effectiveFrom: new Date("2026-01-01T00:00:00.000Z"),
    },
  });
  const careGroup = await prisma.nurtureCareGroup.create({
    data: {
      workspaceId,
      institutionId: institution.id,
      name: "Signal Class",
      ageBandKey: "01",
      status: "active",
    },
  });
  const enrollment = await prisma.nurtureEnrollment.create({
    data: {
      workspaceId,
      childCareProcessId: process.id,
      institutionId: institution.id,
      careGroupId: careGroup.id,
      status: "active",
      participationPhase: "formal",
    },
  });
  const [adminRole, caregiverRole, guardianRole] = await Promise.all([
    prisma.nurtureCareRoleAssignment.create({
      data: {
        workspaceId,
        participantId: admin.id,
        role: "institution_admin",
        scopeType: "institution",
        scopeId: institution.id,
        status: "active",
      },
    }),
    prisma.nurtureCareRoleAssignment.create({
      data: {
        workspaceId,
        participantId: caregiver.id,
        role: "caregiver",
        scopeType: "care_group",
        scopeId: careGroup.id,
        status: "active",
      },
    }),
    prisma.nurtureCareRoleAssignment.create({
      data: {
        workspaceId,
        participantId: guardian.id,
        role: "guardian",
        scopeType: "child_care_process",
        scopeId: process.id,
        status: "active",
      },
    }),
  ]);
  const grant = await prisma.nurtureChildLinkGrant.create({
    data: {
      workspaceId,
      childCareProcessId: process.id,
      enrollmentId: enrollment.id,
      grantedByParticipantId: guardian.id,
      grantedToScopeType: "care_group",
      grantedToScopeId: careGroup.id,
      directions: ["family_to_org", "org_to_family"],
      dataClasses: ["family_care_question", "daily_care_log"],
      purposes: ["family_care_workflow", "family_communication", "care_coordination"],
      policySnapshotPayload: {
        institution_admin_business_communication: {
          schema_version: 1,
          disclosed: true,
          institution_id: institution.id,
          enrollment_id: enrollment.id,
          care_group_id: careGroup.id,
          directions: ["family_to_org"],
          data_classes: ["family_care_question"],
          purposes: ["family_care_workflow"],
        },
      },
      status: "active",
    },
  });
  const thread = await prisma.nurtureFamilyCareThread.create({
    data: {
      workspaceId,
      childCareProcessId: process.id,
      familyId: family.id,
      enrollmentId: enrollment.id,
      careGroupId: careGroup.id,
      visibilityScope: "family_private",
      status: "active",
    },
  });
  return {
    workspaceId,
    admin,
    caregiver,
    guardian,
    process,
    family,
    institution,
    careGroup,
    enrollment,
    adminRole,
    caregiverRole,
    guardianRole,
    grant,
    thread,
  };
};

type Scope = Awaited<ReturnType<typeof seedScope>>;

type AttendancePolicyOverrides = Partial<{
  policyRevision: number;
  checkpointLocalTime: string;
  effectiveFrom: Date;
  effectiveTo: Date | null;
  changeReason: string;
}>;

const createAttendanceCloseoutPolicy = (
  scope: Scope,
  overrides: AttendancePolicyOverrides = {},
) =>
  prisma.nurtureAttendanceCloseoutPolicy.create({
    data: {
      workspaceId: scope.workspaceId,
      institutionId: scope.institution.id,
      careGroupId: scope.careGroup.id,
      contractVersion: DAILY_ATTENDANCE_CLOSEOUT_CONTRACT.version,
      policyRef: DAILY_ATTENDANCE_CLOSEOUT_POLICY_REF,
      policyRevision: 1,
      checkpointLocalTime: "17:30",
      effectiveFrom: new Date("2026-01-01T00:00:00.000Z"),
      changedByRoleAssignmentId: scope.adminRole.id,
      changeReason: "owner integration fixture",
      ...overrides,
    },
  });

const policy = (
  scope: Scope,
  category: NurtureInstitutionSupportSignalPolicyV1["category"],
  checkpointRef: string,
): NurtureInstitutionSupportSignalPolicyV1 => ({
  contract_version: "1.0.0",
  policy_ref: `policy:${category}`,
  workspace_id: scope.workspaceId,
  institution_ref: scope.institution.id,
  category,
  ...(category === "review_backlog_threshold" || category === "configured_load_threshold"
    ? { absolute_threshold: 1 }
    : {}),
  window_key: `local-day:${localDate}`,
  checkpoint_ref: checkpointRef,
  enabled: true,
  policy_revision: 1,
  effective_from: "2026-01-01T00:00:00.000Z",
  changed_by_role_assignment_ref: scope.adminRole.id,
  change_reason: "owner integration fixture",
});

const request = (
  scope: Scope,
  policies: NurtureInstitutionSupportSignalPolicyV1[],
): NurtureInstitutionSupportSignalOwnerReadRequest => ({
  workspace_id: scope.workspaceId,
  participant_ref: scope.admin.id,
  role_assignment_ref: scope.adminRole.id,
  institution_ref: scope.institution.id,
  snapshot_at: snapshotAt,
  policies,
});

const allPolicies = (scope: Scope): NurtureInstitutionSupportSignalPolicyV1[] => [
  policy(
    scope,
    "attendance_submission_overdue",
    PRISMA_INSTITUTION_SUPPORT_SIGNAL_CHECKPOINTS.attendance,
  ),
  policy(
    scope,
    "business_response_overdue",
    PRISMA_INSTITUTION_SUPPORT_SIGNAL_CHECKPOINTS.business_response,
  ),
  policy(
    scope,
    "review_backlog_threshold",
    PRISMA_INSTITUTION_SUPPORT_SIGNAL_CHECKPOINTS.review_backlog,
  ),
  policy(
    scope,
    "authority_or_source_blocked",
    PRISMA_INSTITUTION_SUPPORT_SIGNAL_CHECKPOINTS.authority_source_blocker,
  ),
  policy(
    scope,
    "work_item_or_workflow_blocked",
    PRISMA_INSTITUTION_SUPPORT_SIGNAL_CHECKPOINTS.work_item_workflow_blocker,
  ),
  policy(
    scope,
    "configured_load_threshold",
    PRISMA_INSTITUTION_SUPPORT_SIGNAL_CHECKPOINTS.configured_load,
  ),
];

const createQuestion = async (
  scope: Scope,
  input: {
    lifecycle?: "active" | "suppressed";
    sourceRedacted?: boolean;
    grant?: Scope["grant"];
    duplicateSourceItem?: boolean;
  },
) => {
  const grant = input.grant ?? scope.grant;
  const message = await prisma.nurtureFamilyCareMessage.create({
    data: {
      workspaceId: scope.workspaceId,
      threadId: scope.thread.id,
      childCareProcessId: scope.process.id,
      senderParticipantId: scope.guardian.id,
      senderRoleAssignmentId: scope.guardianRole.id,
      messageKind: "family_message",
      authorshipKind: "family_authored",
      bodyFormat: "plain_text",
      bodyStorageMode: input.sourceRedacted ? "redacted" : "protected",
      sourceSurface: "mobile",
      grantId: grant.id,
      status: input.sourceRedacted ? "redacted" : "sent",
      ...(input.sourceRedacted
        ? {
            redactedAt: new Date(`${localDate}T10:00:00.000Z`),
            redactionReason: "source redacted owner fixture",
          }
        : {}),
      writerContract: "harness_g2_v1",
      enrollmentId: scope.enrollment.id,
      careGroupId: scope.careGroup.id,
      direction: "family_to_org",
      createdAt: new Date(`${localDate}T08:00:00.000Z`),
    },
  });
  const createItem = () =>
    prisma.nurtureFamilyCareItem.create({
      data: {
        workspaceId: scope.workspaceId,
        sourceMessageId: message.id,
        threadId: scope.thread.id,
        childCareProcessId: scope.process.id,
        familyId: scope.family.id,
        enrollmentId: scope.enrollment.id,
        careGroupId: scope.careGroup.id,
        dataClass: "family_care_question",
        category: "question",
        summary: "Question",
        urgency: "normal",
        requiresAck: true,
        requiresReply: true,
        status: input.sourceRedacted ? "suppressed" : "open",
        classificationSource: "system",
        grantId: grant.id,
        writerContract: "harness_g2_v1",
        responseState: "awaiting_reply",
        lifecycleState: input.lifecycle ?? "active",
        ...(input.sourceRedacted ? { lifecycleReason: "source_redacted" as const } : {}),
        ...(input.sourceRedacted
          ? {
              suppressedAt: new Date(`${localDate}T10:00:00.000Z`),
              suppressionReason: "source redacted owner fixture",
            }
          : {}),
        dueAt: new Date(`${localDate}T09:00:00.000Z`),
        createdAt: new Date(`${localDate}T08:00:00.000Z`),
        updatedAt: new Date(`${localDate}T08:00:00.000Z`),
      },
    });
  const item = await createItem();
  if (input.duplicateSourceItem) await createItem();
  return { message, item };
};

describe("T-007 G4-B exact support-signal owner providers", () => {
  it("uses only the attendance owner's configured checkpoint for an unsubmitted day", async () => {
    const scope = await seedScope();
    const bindings = createPrismaInstitutionSupportSignalOwnerBindings({
      prisma,
      owner_ref_integrity_key: "g4b-support-signal-owner-test-key",
    });
    const attendancePolicy = allPolicies(scope)[0]!;
    await expect(
      bindings.attendance.loadAttendanceSubmissionFacts(
        request(scope, [attendancePolicy]),
      ),
    ).resolves.toEqual({ status: "unavailable" });

    await prisma.nurtureInstitutionPublicationPolicy.updateMany({
      where: {
        workspaceId: scope.workspaceId,
        institutionId: scope.institution.id,
      },
      data: { timeZone: "Asia/Shanghai" },
    });
    await createAttendanceCloseoutPolicy(scope);
    await expect(
      bindings.attendance.loadAttendanceSubmissionFacts(
        request(scope, [attendancePolicy]),
      ),
    ).resolves.toEqual({
      status: "available",
      facts: [
        expect.objectContaining({
          source_type: "daily_attendance_closeout",
          submission_state: "unsubmitted",
          checkpoint_deadline_at: `${localDate}T09:30:00.000Z`,
          occurred_at: `${localDate}T09:30:00.000Z`,
        }),
      ],
    });

    await prisma.nurtureDailyAttendanceSubmission.create({
      data: {
        workspaceId: scope.workspaceId,
        careGroupId: scope.careGroup.id,
        localDate: day,
        state: "submitted",
        submittedByRoleAssignmentId: scope.caregiverRole.id,
        submittedAt: new Date(`${localDate}T10:00:00.000Z`),
      },
    });
    expect(
      await loadInstitutionLocalDay(prisma, {
        workspace_id: scope.workspaceId,
        institution_id: scope.institution.id,
        local_date: localDate,
        at: new Date(snapshotAt),
      }),
    ).not.toBeNull();
    expect(
      await prisma.nurtureDailyAttendanceSubmission.findFirst({
        where: {
          workspaceId: scope.workspaceId,
          careGroupId: scope.careGroup.id,
          localDate: day,
          createdAt: { lte: new Date(snapshotAt) },
          deletedAt: null,
        },
      }),
    ).not.toBeNull();
    await expect(
      bindings.attendance.loadAttendanceSubmissionFacts(
        request(scope, [attendancePolicy]),
      ),
    ).resolves.toEqual({ status: "available", facts: [] });
  });

  it("fails closed when two attendance checkpoint policies overlap", async () => {
    const scope = await seedScope();
    await createAttendanceCloseoutPolicy(scope);
    await createAttendanceCloseoutPolicy(scope, {
      policyRevision: 2,
      checkpointLocalTime: "18:00",
    });
    const bindings = createPrismaInstitutionSupportSignalOwnerBindings({
      prisma,
      owner_ref_integrity_key: "g4b-support-signal-owner-test-key",
    });
    await expect(
      bindings.attendance.loadAttendanceSubmissionFacts(
        request(scope, [allPolicies(scope)[0]!]),
      ),
    ).resolves.toEqual({ status: "unavailable" });
  });

  it("does not retroactively apply a policy first effective after the local day began", async () => {
    const scope = await seedScope();
    await createAttendanceCloseoutPolicy(scope, {
      effectiveFrom: new Date(`${localDate}T08:00:00.000Z`),
    });
    const bindings = createPrismaInstitutionSupportSignalOwnerBindings({
      prisma,
      owner_ref_integrity_key: "g4b-support-signal-owner-test-key",
    });
    await expect(
      bindings.attendance.loadAttendanceSubmissionFacts(
        request(scope, [allPolicies(scope)[0]!]),
      ),
    ).resolves.toEqual({ status: "unavailable" });
  });

  it("enforces attendance checkpoint policy constraints in PostgreSQL", async () => {
    const scope = await seedScope();
    await expect(
      createAttendanceCloseoutPolicy(scope, { policyRevision: 0 }),
    ).rejects.toThrow();
    await expect(
      createAttendanceCloseoutPolicy(scope, { checkpointLocalTime: "24:00" }),
    ).rejects.toThrow();
    await expect(
      createAttendanceCloseoutPolicy(scope, {
        effectiveTo: new Date("2025-12-31T23:59:59.999Z"),
      }),
    ).rejects.toThrow();
    await expect(
      createAttendanceCloseoutPolicy(scope, { changeReason: "" }),
    ).rejects.toThrow();
    expect(
      await prisma.nurtureAttendanceCloseoutPolicy.count({
        where: { workspaceId: scope.workspaceId },
      }),
    ).toBe(0);
  });

  it("does not translate a redacted source into an authority/source blocker", async () => {
    const scope = await seedScope();
    await createQuestion(scope, { lifecycle: "suppressed", sourceRedacted: true });
    const bindings = createPrismaInstitutionSupportSignalOwnerBindings({
      prisma,
      owner_ref_integrity_key: "g4b-support-signal-owner-test-key",
    });
    const authorityPolicy = allPolicies(scope)[3]!;
    await expect(
      bindings.authority_source_blocker.loadAuthoritySourceBlockerFacts(
        request(scope, [authorityPolicy]),
      ),
    ).resolves.toEqual({ status: "unavailable" });
  });

  it("fails closed instead of truncating an over-limit owner scope", async () => {
    const scope = await seedScope();
    await prisma.nurtureCareGroup.createMany({
      data: Array.from({ length: 100 }, (_, index) => ({
        workspaceId: scope.workspaceId,
        institutionId: scope.institution.id,
        name: `Overflow Class ${index}`,
        ageBandKey: String(index + 2).padStart(3, "0"),
        status: "active" as const,
      })),
    });
    const bindings = createPrismaInstitutionSupportSignalOwnerBindings({
      prisma,
      owner_ref_integrity_key: "g4b-support-signal-owner-test-key",
    });
    const businessPolicy = allPolicies(scope)[1]!;
    await expect(
      bindings.business_response.loadBusinessResponseFacts(
        request(scope, [businessPolicy]),
      ),
    ).resolves.toEqual({ status: "unavailable" });
  });

  it("binds the four currently provable source families through real owner rows", async () => {
    const scope = await seedScope();
    await prisma.nurtureDailyAttendanceSubmission.create({
      data: {
        workspaceId: scope.workspaceId,
        careGroupId: scope.careGroup.id,
        localDate: day,
        state: "submitted",
        submittedByRoleAssignmentId: scope.caregiverRole.id,
        submittedAt: new Date(`${localDate}T10:00:00.000Z`),
      },
    });
    const activeQuestion = await createQuestion(scope, {});
    await prisma.nurtureChildLinkReceipt.create({
      data: {
        workspaceId: scope.workspaceId,
        grantId: scope.grant.id,
        childCareProcessId: scope.process.id,
        enrollmentId: scope.enrollment.id,
        direction: "family_to_org",
        dataClass: "family_care_question",
        sourceType: "family_care_message",
        sourceId: activeQuestion.message.id,
        routingAttemptKey: randomUUID(),
        status: "blocked",
        driverType: "workflow_step",
        reasonCode: "owner_blocked_fixture",
      },
    });
    await prisma.nurtureChildLinkReceipt.create({
      data: {
        workspaceId: scope.workspaceId,
        grantId: scope.grant.id,
        childCareProcessId: scope.process.id,
        enrollmentId: scope.enrollment.id,
        direction: "org_to_family",
        dataClass: "daily_care_log",
        sourceType: "family_care_message",
        sourceId: activeQuestion.message.id,
        routingAttemptKey: randomUUID(),
        status: "blocked",
        driverType: "workflow_step",
        reasonCode: "mismatched_owner_source_fixture",
      },
    });
    const dailyLog = await prisma.nurtureDailyCareLog.create({
      data: {
        workspaceId: scope.workspaceId,
        childCareProcessId: scope.process.id,
        enrollmentId: scope.enrollment.id,
        careGroupId: scope.careGroup.id,
        recordedByRoleAssignmentId: scope.caregiverRole.id,
        logDate: day,
        status: "recorded",
        grantId: scope.grant.id,
      },
    });
    await prisma.nurtureActivityPlacement.create({
      data: {
        workspaceId: scope.workspaceId,
        sourceKind: "daily_care_log",
        sourceId: dailyLog.id,
        careGroupId: scope.careGroup.id,
        localDate: day,
        state: "unplaced",
        decidedBy: "source_binding",
        updatedAt: new Date(`${localDate}T11:00:00.000Z`),
      },
    });
    const unreadableGrant = await prisma.nurtureChildLinkGrant.create({
      data: {
        workspaceId: scope.workspaceId,
        childCareProcessId: scope.process.id,
        enrollmentId: scope.enrollment.id,
        grantedByParticipantId: scope.guardian.id,
        grantedToScopeType: "care_group",
        grantedToScopeId: scope.careGroup.id,
        directions: ["org_to_family"],
        dataClasses: ["daily_care_log"],
        purposes: ["family_communication"],
        status: "active",
      },
    });
    const unreadableLog = await prisma.nurtureDailyCareLog.create({
      data: {
        workspaceId: scope.workspaceId,
        childCareProcessId: scope.process.id,
        enrollmentId: scope.enrollment.id,
        careGroupId: scope.careGroup.id,
        recordedByRoleAssignmentId: scope.caregiverRole.id,
        logDate: day,
        status: "recorded",
        grantId: unreadableGrant.id,
      },
    });
    await prisma.nurtureActivityPlacement.create({
      data: {
        workspaceId: scope.workspaceId,
        sourceKind: "daily_care_log",
        sourceId: unreadableLog.id,
        careGroupId: scope.careGroup.id,
        localDate: day,
        state: "unplaced",
        decidedBy: "source_binding",
        updatedAt: new Date(`${localDate}T15:00:00.000Z`),
      },
    });

    const repository = createPrismaInstitutionSupportSignalRepository({
      prisma,
      owner_ref_integrity_key: "g4b-support-signal-owner-test-key",
    });
    const provablePolicies = allPolicies(scope).filter(
      (candidate) => candidate.category !== "authority_or_source_blocked",
    );
    const result = await repository.loadAuthorizedSources(
      request(scope, provablePolicies),
    );
    expect(result.status).toBe("available");
    expect(result.sources.map((source) => source.category)).toEqual([
      "business_response_overdue",
      "review_backlog_threshold",
      "work_item_or_workflow_blocked",
      "configured_load_threshold",
    ]);
    expect(result.sources[1]!.aggregate!.members).toEqual([
      expect.objectContaining({ member_ref: scope.process.id, current_count: 1 }),
    ]);
    expect(result.sources[1]!.occurred_at).toBe(`${localDate}T11:00:00.000Z`);
    expect(result.sources[3]!.aggregate!.members).toEqual([
      expect.objectContaining({ member_ref: scope.process.id, current_count: 1 }),
    ]);
    for (const source of result.sources) {
      expect(source.source_ref).toHaveLength(32);
      expect(source.source_ref).not.toContain(scope.process.id);
      expect(source.source_ref).not.toContain(activeQuestion.message.id);
    }
  });

  it("rechecks the exact selected Admin role inside every owner read", async () => {
    const scope = await seedScope();
    const bindings = createPrismaInstitutionSupportSignalOwnerBindings({
      prisma,
      owner_ref_integrity_key: "g4b-support-signal-owner-test-key",
    });
    const wrongRoleRequest = {
      ...request(scope, allPolicies(scope)),
      role_assignment_ref: scope.caregiverRole.id,
    };
    const reads = await Promise.all([
      bindings.attendance.loadAttendanceSubmissionFacts(wrongRoleRequest),
      bindings.business_response.loadBusinessResponseFacts(wrongRoleRequest),
      bindings.review_backlog.loadReviewBacklogFacts(wrongRoleRequest),
      bindings.authority_source_blocker.loadAuthoritySourceBlockerFacts(wrongRoleRequest),
      bindings.work_item_workflow_blocker.loadWorkItemWorkflowBlockerFacts(wrongRoleRequest),
      bindings.configured_load.loadConfiguredLoadFacts(wrongRoleRequest),
    ]);
    expect(reads.every((read) => read.status === "unavailable")).toBe(true);
  });

  it("does not cache authority when the same request object is reused", async () => {
    const scope = await seedScope();
    await prisma.nurtureDailyAttendanceSubmission.create({
      data: {
        workspaceId: scope.workspaceId,
        careGroupId: scope.careGroup.id,
        localDate: day,
        state: "submitted",
        submittedByRoleAssignmentId: scope.caregiverRole.id,
        submittedAt: new Date(`${localDate}T10:00:00.000Z`),
      },
    });
    const bindings = createPrismaInstitutionSupportSignalOwnerBindings({
      prisma,
      owner_ref_integrity_key: "g4b-support-signal-owner-test-key",
    });
    const sameRequest = request(scope, [allPolicies(scope)[0]!]);

    await expect(
      bindings.attendance.loadAttendanceSubmissionFacts(sameRequest),
    ).resolves.toEqual({ status: "available", facts: [] });
    await prisma.nurtureCareRoleAssignment.update({
      where: { id: scope.adminRole.id },
      data: { status: "revoked" },
    });
    await expect(
      bindings.attendance.loadAttendanceSubmissionFacts(sameRequest),
    ).resolves.toEqual({ status: "unavailable" });
  });

  it("excludes pending work whose owner disclosure is not authorized", async () => {
    const scope = await seedScope();
    const undisclosedGrant = await prisma.nurtureChildLinkGrant.create({
      data: {
        workspaceId: scope.workspaceId,
        childCareProcessId: scope.process.id,
        enrollmentId: scope.enrollment.id,
        grantedByParticipantId: scope.guardian.id,
        grantedToScopeType: "care_group",
        grantedToScopeId: scope.careGroup.id,
        directions: ["family_to_org"],
        dataClasses: ["family_care_question"],
        purposes: ["family_care_workflow", "family_communication"],
        status: "active",
      },
    });
    await createQuestion(scope, { grant: undisclosedGrant });
    const bindings = createPrismaInstitutionSupportSignalOwnerBindings({
      prisma,
      owner_ref_integrity_key: "g4b-support-signal-owner-test-key",
    });

    await expect(
      bindings.configured_load.loadConfiguredLoadFacts(
        request(scope, [allPolicies(scope)[5]!]),
      ),
    ).resolves.toEqual({ status: "available", facts: [] });
  });

  it("fails closed when one family message maps to multiple source items", async () => {
    const scope = await seedScope();
    await createQuestion(scope, { duplicateSourceItem: true });
    const bindings = createPrismaInstitutionSupportSignalOwnerBindings({
      prisma,
      owner_ref_integrity_key: "g4b-support-signal-owner-test-key",
    });

    await expect(
      bindings.configured_load.loadConfiguredLoadFacts(
        request(scope, [allPolicies(scope)[5]!]),
      ),
    ).resolves.toEqual({ status: "available", facts: [] });
  });

  it("does not count a completed acknowledgement-only item as pending work", async () => {
    const scope = await seedScope();
    const question = await createQuestion(scope, {});
    await prisma.nurtureFamilyCareItem.update({
      where: { id: question.item.id },
      data: {
        requiresReply: false,
        acknowledgementState: "acknowledged",
        status: "acknowledged",
        updatedAt: new Date(`${localDate}T10:00:00.000Z`),
      },
    });
    const bindings = createPrismaInstitutionSupportSignalOwnerBindings({
      prisma,
      owner_ref_integrity_key: "g4b-support-signal-owner-test-key",
    });

    await expect(
      bindings.configured_load.loadConfiguredLoadFacts(
        request(scope, [allPolicies(scope)[5]!]),
      ),
    ).resolves.toEqual({ status: "available", facts: [] });
  });
});
