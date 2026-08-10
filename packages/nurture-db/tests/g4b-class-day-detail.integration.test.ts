import { createHash, randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import {
  NurtureInstitutionAuthorityChain,
  NurtureInstitutionClassDayDetailService,
  resolveEffectiveSchedule,
} from "@the-nurture/scenario";
import { createPrismaClient } from "../src/client.js";
import { createAesGcmProtectedContentPort } from "../src/protected-content.js";
import { PrismaInstitutionClassDayDetailRepository } from "../src/repositories/institution-class-day-detail.repository.js";
import { PrismaInstitutionContextRepository } from "../src/repositories/institution-context.repository.js";

/**
 * G4-B increment 8 — `InstitutionClassDayDetailProjectionV1` over real owner
 * rows. The unit lane owns projection edge cases; this lane proves that the
 * composed service crosses the Prisma boundary through the real 0C authority
 * chain and the existing communication owner-read predicate.
 */

const prisma = createPrismaClient();
const protectedContent = createAesGcmProtectedContentPort({
  keyRef: "g4b-detail-k1",
  keyMaterial: "g4b-class-day-detail-content-key-32chars!!!!",
});
const repository = new PrismaInstitutionClassDayDetailRepository(
  prisma,
  (layers, careGroupRef, localDate) =>
    resolveEffectiveSchedule({ care_group_ref: careGroupRef, local_date: localDate, layers }),
);
const authority = new NurtureInstitutionAuthorityChain(
  new PrismaInstitutionContextRepository(prisma),
);
const issueRef = (input: { kind: string; source_id: string }): string =>
  `${input.kind}:${createHash("sha256").update(input.source_id).digest("base64url").slice(0, 24)}`;
const service = new NurtureInstitutionClassDayDetailService(
  repository,
  authority,
  (envelope) => protectedContent.unseal(envelope as never),
  issueRef,
);

afterAll(async () => {
  await prisma.$disconnect();
});

const today = new Date().toISOString().slice(0, 10);
const day = new Date(`${today}T00:00:00.000Z`);
const shanghaiLocalStart = new Date(day.getTime() - 8 * 60 * 60 * 1_000);
const shanghaiLocalEnd = new Date(shanghaiLocalStart.getTime() + 86_400_000);
const snapshotAt = `${today}T23:59:59.999Z`;

const seedScope = async () => {
  const workspaceId = randomUUID();
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
    data: {
      workspaceId,
      childCareProcessId: process.id,
      displayName: "Family",
      status: "active",
    },
  });
  const institution = await prisma.nurtureCareInstitution.create({
    data: { workspaceId, displayName: "Detail Institution", status: "active" },
  });
  await prisma.nurtureInstitutionPublicationPolicy.create({
    data: {
      workspaceId,
      institutionId: institution.id,
      policyRef: "nurture.institution-publication-policy@1.0.0",
      policyVersion: 1,
      policyHead: 1,
      timeZone: "Asia/Shanghai",
      defaultReleaseLocalTime: "17:00",
      retryCutoffLocalTime: "19:00",
      organizeIdleSeconds: 600,
      organizeFallbackLeadSeconds: 1800,
      automaticQuiescenceSeconds: 60,
      captureActivityLeaseSeconds: 60,
      automaticOrganizeEnabled: true,
      effectiveFrom: new Date("2026-01-01T00:00:00.000Z"),
    },
  });
  const careGroup = await prisma.nurtureCareGroup.create({
    data: {
      workspaceId,
      institutionId: institution.id,
      name: "Detail Class",
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
      dataClasses: ["family_care_question", "direct_care_communication"],
      purposes: ["family_care_workflow"],
      policySnapshotPayload: {
        institution_admin_business_communication: {
          schema_version: 1,
          disclosed: true,
          institution_id: institution.id,
          enrollment_id: enrollment.id,
          care_group_id: careGroup.id,
          directions: ["family_to_org", "org_to_family"],
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
    adminRole,
    caregiverRole,
    guardian,
    guardianRole,
    process,
    family,
    institution,
    careGroup,
    enrollment,
    grant,
    thread,
  };
};

type Scope = Awaited<ReturnType<typeof seedScope>>;

const compose = (scope: Scope) =>
  service.compose({
    workspace_id: scope.workspaceId,
    participant_ref: scope.admin.id,
    role_assignment_ref: scope.adminRole.id,
    institution_ref: scope.institution.id,
    care_group_ref: scope.careGroup.id,
    local_date: today,
    snapshot_at: snapshotAt,
  });

describe("T-007 G4-B class-day detail (production DB lane)", () => {
  it("composes the authorized timeline, attendance and owner-read communication", async () => {
    const scope = await seedScope();
    await prisma.nurtureClassScheduleTemplate.create({
      data: {
        workspaceId: scope.workspaceId,
        institutionId: scope.institution.id,
        careGroupId: scope.careGroup.id,
        layer: "class_standing",
        slotsPayload: [
          {
            slot_ref: "morning",
            label: "Morning",
            starts_at_minute: 540,
            ends_at_minute: 660,
          },
        ],
      },
    });
    const text = await prisma.nurtureCareCapture.create({
      data: {
        workspaceId: scope.workspaceId,
        careGroupId: scope.careGroup.id,
        capturedByRoleAssignmentId: scope.caregiverRole.id,
        kind: "text",
        sourceSequence: 1,
        stable: true,
        bodyProtectionPayload: protectedContent.seal("We built a tall tower") as never,
        occurredAt: new Date(`${today}T09:30:00.000Z`),
      },
    });
    await prisma.nurtureCareCapture.createMany({
      data: [
        {
          workspaceId: scope.workspaceId,
          careGroupId: scope.careGroup.id,
          capturedByRoleAssignmentId: scope.caregiverRole.id,
          kind: "text",
          sourceSequence: 3,
          stable: true,
          bodyProtectionPayload: protectedContent.seal("Inside local day boundary") as never,
          occurredAt: new Date(shanghaiLocalStart.getTime() + 30 * 60 * 1_000),
        },
        {
          workspaceId: scope.workspaceId,
          careGroupId: scope.careGroup.id,
          capturedByRoleAssignmentId: scope.caregiverRole.id,
          kind: "text",
          sourceSequence: 4,
          stable: true,
          bodyProtectionPayload: protectedContent.seal("Outside local day boundary") as never,
          occurredAt: new Date(shanghaiLocalEnd.getTime() + 30 * 60 * 1_000),
        },
      ],
    });
    await prisma.nurtureActivityPlacement.create({
      data: {
        workspaceId: scope.workspaceId,
        sourceKind: "care_capture",
        sourceId: text.id,
        careGroupId: scope.careGroup.id,
        localDate: day,
        state: "placed",
        activityRef: "morning",
        decidedBy: "schedule_window",
      },
    });
    const asset = await prisma.nurtureMediaAssetRef.create({
      data: {
        workspaceId: scope.workspaceId,
        institutionId: scope.institution.id,
        careGroupId: scope.careGroup.id,
        uploadedByRoleAssignmentId: scope.caregiverRole.id,
        sourceKind: "class_album",
        lifecycle: "ready",
        storageRefPayload: { ref: randomUUID() },
      },
    });
    await prisma.nurtureCareCapture.create({
      data: {
        workspaceId: scope.workspaceId,
        careGroupId: scope.careGroup.id,
        capturedByRoleAssignmentId: scope.caregiverRole.id,
        kind: "media",
        sourceSequence: 2,
        stable: true,
        mediaAssetRefId: asset.id,
        occurredAt: new Date(`${today}T10:30:00.000Z`),
      },
    });
    await prisma.nurtureDailyAttendanceSubmission.create({
      data: {
        workspaceId: scope.workspaceId,
        careGroupId: scope.careGroup.id,
        localDate: day,
        state: "submitted",
        submissionHead: 2,
        submittedByRoleAssignmentId: scope.caregiverRole.id,
        submittedAt: new Date(`${today}T11:00:00.000Z`),
      },
    });
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
        purposes: ["family_care_workflow"],
        status: "active",
      },
    });
    const undisclosedMessage = await prisma.nurtureFamilyCareMessage.create({
      data: {
        workspaceId: scope.workspaceId,
        threadId: scope.thread.id,
        childCareProcessId: scope.process.id,
        senderParticipantId: scope.guardian.id,
        senderRoleAssignmentId: scope.guardianRole.id,
        messageKind: "family_message",
        authorshipKind: "family_authored",
        bodyFormat: "plain_text",
        bodyStorageMode: "encrypted",
        bodyProtectionPayload: protectedContent.seal("Undisclosed question") as never,
        sourceSurface: "mobile",
        grantId: undisclosedGrant.id,
        status: "sent",
        writerContract: "harness_g2_v1",
        enrollmentId: scope.enrollment.id,
        careGroupId: scope.careGroup.id,
        direction: "family_to_org",
        createdAt: new Date(`${today}T07:00:00.000Z`),
      },
    });
    await prisma.nurtureFamilyCareItem.create({
      data: {
        workspaceId: scope.workspaceId,
        sourceMessageId: undisclosedMessage.id,
        threadId: scope.thread.id,
        childCareProcessId: scope.process.id,
        familyId: scope.family.id,
        enrollmentId: scope.enrollment.id,
        careGroupId: scope.careGroup.id,
        dataClass: "family_care_question",
        category: "question",
        summary: "Undisclosed question",
        urgency: "normal",
        status: "open",
        classificationSource: "system",
        grantId: undisclosedGrant.id,
        writerContract: "harness_g2_v1",
        createdAt: new Date(`${today}T07:00:00.000Z`),
      },
    });
    const secondMessage = await prisma.nurtureFamilyCareMessage.create({
      data: {
        workspaceId: scope.workspaceId,
        threadId: scope.thread.id,
        childCareProcessId: scope.process.id,
        senderParticipantId: scope.guardian.id,
        senderRoleAssignmentId: scope.guardianRole.id,
        messageKind: "family_message",
        authorshipKind: "family_authored",
        bodyFormat: "plain_text",
        bodyStorageMode: "encrypted",
        bodyProtectionPayload: protectedContent.seal("Second private question") as never,
        sourceSurface: "mobile",
        grantId: scope.grant.id,
        status: "sent",
        writerContract: "harness_g2_v1",
        enrollmentId: scope.enrollment.id,
        careGroupId: scope.careGroup.id,
        direction: "family_to_org",
        createdAt: new Date(`${today}T09:00:00.000Z`),
      },
    });
    await prisma.nurtureFamilyCareItem.create({
      data: {
        workspaceId: scope.workspaceId,
        sourceMessageId: secondMessage.id,
        threadId: scope.thread.id,
        childCareProcessId: scope.process.id,
        familyId: scope.family.id,
        enrollmentId: scope.enrollment.id,
        careGroupId: scope.careGroup.id,
        dataClass: "family_care_question",
        category: "question",
        summary: "Second question",
        urgency: "normal",
        status: "open",
        classificationSource: "system",
        grantId: scope.grant.id,
        writerContract: "harness_g2_v1",
        createdAt: new Date(`${today}T09:00:00.000Z`),
      },
    });
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
        bodyStorageMode: "encrypted",
        bodyProtectionPayload: protectedContent.seal("Private pickup question") as never,
        sourceSurface: "mobile",
        grantId: scope.grant.id,
        status: "sent",
        writerContract: "harness_g2_v1",
        enrollmentId: scope.enrollment.id,
        careGroupId: scope.careGroup.id,
        direction: "family_to_org",
        createdAt: new Date(`${today}T08:00:00.000Z`),
      },
    });
    await prisma.nurtureFamilyCareItem.create({
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
        summary: "Pickup question",
        urgency: "today_attention",
        requiresAck: true,
        requiresReply: true,
        status: "open",
        classificationSource: "system",
        grantId: scope.grant.id,
        writerContract: "harness_g2_v1",
        createdAt: new Date(`${today}T08:00:00.000Z`),
      },
    });

    // The limit applies after exact owner-read admission. The earlier
    // undisclosed candidate must not consume the one authorized result.
    const localDay = await repository.loadInstitutionLocalDay({
      workspace_id: scope.workspaceId,
      institution_ref: scope.institution.id,
      local_date: today,
      snapshot_at: snapshotAt,
    });
    expect(localDay).not.toBeNull();
    if (!localDay) return;
    const firstCommunicationPage = await repository.listAuthorizedCommunications({
      workspace_id: scope.workspaceId,
      participant_id: scope.admin.id,
      care_group_ref: scope.careGroup.id,
      local_date: today,
      snapshot_at: snapshotAt,
      limit: 1,
      local_day: localDay,
    });
    expect(firstCommunicationPage).toEqual({
      rows: [expect.objectContaining({ message_id: message.id })],
      has_more: true,
    });
    expect(JSON.stringify(firstCommunicationPage)).not.toMatch(
      /body_envelope|Private pickup question/,
    );

    const decision = await compose(scope);
    expect(decision.status).toBe("ok");
    if (decision.status !== "ok") return;
    expect(decision.output.activities[0]!.timeline).toEqual([
      expect.objectContaining({ kind: "text", body: "We built a tall tower" }),
    ]);
    expect(decision.output.unplaced).toEqual([
      expect.objectContaining({ kind: "text", body: "Inside local day boundary" }),
      expect.objectContaining({ kind: "photo", media_ref: asset.id }),
    ]);
    expect(decision.output.attendance).toMatchObject({
      state: "submitted",
      submission_head: 2,
    });
    expect(decision.output.communications).toEqual([
      expect.objectContaining({
        direction: "family_to_org",
        data_class: "family_care_question",
        response_state: "awaiting_reply",
      }),
      expect.objectContaining({
        direction: "family_to_org",
        data_class: "family_care_question",
      }),
    ]);
    expect(decision.output.home_institution_dynamics.family_feedback).toHaveLength(2);
    const serialized = JSON.stringify(decision.output);
    expect(serialized).not.toContain(message.id);
    expect(serialized).not.toContain(undisclosedMessage.id);
    expect(serialized).not.toContain("Private pickup question");
    expect(serialized).not.toContain("Undisclosed question");
    expect(serialized).not.toContain("Outside local day boundary");
    expect(serialized).not.toContain("Second private question");
    expect(serialized).not.toContain("bodyProtectionPayload");
  });

  it("denies a foreign class before loading its detail rows", async () => {
    const home = await seedScope();
    const foreign = await seedScope();
    const decision = await service.compose({
      workspace_id: home.workspaceId,
      participant_ref: home.admin.id,
      role_assignment_ref: home.adminRole.id,
      institution_ref: home.institution.id,
      care_group_ref: foreign.careGroup.id,
      local_date: today,
      snapshot_at: snapshotAt,
    });
    expect(decision).toEqual({ status: "denied", reason_code: "not_authorized" });
  });
});
