import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { createPrismaClient } from "../src/client.js";

// DB-level proof of the frozen G2 guards
// (dev-docs/archive/nurture-family-care-conversation/10-g2-schema-freeze.md):
// complete-graph and protected-body CHECKs, lifecycle-reason coupling,
// immutable reply order and the strict correction head.
const prisma = createPrismaClient();

afterAll(async () => {
  await prisma.$disconnect();
});

const seedScope = async () => {
  const workspaceId = randomUUID();
  const guardian = await prisma.nurtureParticipant.create({
    data: {
      workspaceId,
      myChatUserId: `guardian:${workspaceId}`,
      status: "active",
    },
  });
  const caregiver = await prisma.nurtureParticipant.create({
    data: {
      workspaceId,
      myChatUserId: `caregiver:${workspaceId}`,
      status: "active",
    },
  });
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
    data: {
      workspaceId,
      displayName: "Care Center",
      status: "active",
      createdByParticipantId: caregiver.id,
    },
  });
  const group = await prisma.nurtureCareGroup.create({
    data: {
      workspaceId,
      institutionId: institution.id,
      name: "Class A",
      status: "active",
    },
  });
  const enrollment = await prisma.nurtureEnrollment.create({
    data: {
      workspaceId,
      childCareProcessId: process.id,
      institutionId: institution.id,
      careGroupId: group.id,
      status: "active",
    },
  });
  const guardianRole = await prisma.nurtureCareRoleAssignment.create({
    data: {
      workspaceId,
      participantId: guardian.id,
      role: "guardian",
      scopeType: "child_care_process",
      scopeId: process.id,
      status: "active",
    },
  });
  const caregiverRole = await prisma.nurtureCareRoleAssignment.create({
    data: {
      workspaceId,
      participantId: caregiver.id,
      role: "caregiver",
      scopeType: "care_group",
      scopeId: group.id,
      status: "active",
    },
  });
  const grant = await prisma.nurtureChildLinkGrant.create({
    data: {
      workspaceId,
      childCareProcessId: process.id,
      enrollmentId: enrollment.id,
      grantedByParticipantId: guardian.id,
      grantedToScopeType: "care_group",
      grantedToScopeId: group.id,
      directions: ["family_to_org", "org_to_family"],
      dataClasses: ["family_care_question"],
      purposes: ["family_care_workflow"],
      status: "active",
    },
  });
  const thread = await prisma.nurtureFamilyCareThread.create({
    data: {
      workspaceId,
      childCareProcessId: process.id,
      familyId: family.id,
      enrollmentId: enrollment.id,
      careGroupId: group.id,
      visibilityScope: "family_private",
      status: "active",
    },
  });
  const sourceMessage = await prisma.nurtureFamilyCareMessage.create({
    data: {
      workspaceId,
      threadId: thread.id,
      childCareProcessId: process.id,
      senderParticipantId: guardian.id,
      senderRoleAssignmentId: guardianRole.id,
      messageKind: "family_message",
      authorshipKind: "family_authored",
      bodyFormat: "plain_text",
      bodyStorageMode: "encrypted",
      bodyProtectionPayload: { algVersion: 1, keyRef: "test", ciphertext: "x", integrityTag: "y" },
      sourceSurface: "mobile",
      grantId: grant.id,
      status: "sent",
      writerContract: "harness_g2_v1",
      enrollmentId: enrollment.id,
      careGroupId: group.id,
      direction: "family_to_org",
    },
  });
  return {
    workspaceId,
    guardian,
    caregiver,
    process,
    family,
    group,
    enrollment,
    guardianRole,
    caregiverRole,
    grant,
    thread,
    sourceMessage,
  };
};

const g2ItemData = (scope: Awaited<ReturnType<typeof seedScope>>) => ({
  workspaceId: scope.workspaceId,
  sourceMessageId: scope.sourceMessage.id,
  threadId: scope.thread.id,
  childCareProcessId: scope.process.id,
  familyId: scope.family.id,
  enrollmentId: scope.enrollment.id,
  careGroupId: scope.group.id,
  dataClass: "family_care_question" as const,
  category: "question" as const,
  summary: "safe summary",
  urgency: "today_attention" as const,
  requiresAck: true,
  requiresReply: true,
  status: "open" as const,
  grantId: scope.grant.id,
  classificationSource: "system" as const,
  writerContract: "harness_g2_v1" as const,
});

const g2ReplyData = (
  scope: Awaited<ReturnType<typeof seedScope>>,
  itemId: string,
  replyOrderKey: string | null,
) => ({
  workspaceId: scope.workspaceId,
  threadId: scope.thread.id,
  childCareProcessId: scope.process.id,
  senderParticipantId: scope.caregiver.id,
  senderRoleAssignmentId: scope.caregiverRole.id,
  messageKind: "caregiver_reply" as const,
  authorshipKind: "caregiver_confirmed" as const,
  sourceItemId: itemId,
  bodyFormat: "plain_text" as const,
  bodyStorageMode: "encrypted" as const,
  bodyProtectionPayload: { algVersion: 1, keyRef: "test", ciphertext: "x", integrityTag: "y" },
  sourceSurface: "mobile" as const,
  grantId: scope.grant.id,
  status: "sent" as const,
  writerContract: "harness_g2_v1" as const,
  enrollmentId: scope.enrollment.id,
  careGroupId: scope.group.id,
  direction: "org_to_family" as const,
  ...(replyOrderKey === null ? {} : { replyOrderKey }),
});

describe("G2 three-axis schema guards", () => {
  it("keeps legacy rows valid with untrusted three-axis defaults", async () => {
    const scope = await seedScope();
    const legacyItem = await prisma.nurtureFamilyCareItem.create({
      data: {
        workspaceId: scope.workspaceId,
        threadId: scope.thread.id,
        childCareProcessId: scope.process.id,
        familyId: scope.family.id,
        careGroupId: scope.group.id,
        dataClass: "family_care_question",
        category: "question",
        summary: "legacy row",
        urgency: "today_attention",
        status: "open",
        classificationSource: "system",
      },
    });
    expect(legacyItem).toMatchObject({
      writerContract: "legacy_v1",
      acknowledgementState: "pending",
      responseState: "awaiting_reply",
      lifecycleState: "active",
      acknowledgementHead: 0,
      responseHead: 0,
      lifecycleHead: 0,
    });
  });

  it("rejects a harness item without the complete original scope", async () => {
    const scope = await seedScope();
    await expect(
      prisma.nurtureFamilyCareItem.create({
        data: { ...g2ItemData(scope), sourceMessageId: null },
      }),
    ).rejects.toThrow(/ck_nurture_item_g2_complete_graph/);
    await expect(
      prisma.nurtureFamilyCareItem.create({
        data: { ...g2ItemData(scope), grantId: null },
      }),
    ).rejects.toThrow(/ck_nurture_item_g2_complete_graph/);
    await expect(
      prisma.nurtureFamilyCareItem.create({ data: g2ItemData(scope) }),
    ).resolves.toMatchObject({ writerContract: "harness_g2_v1" });
  });

  it("couples lifecycleReason to closed or suppressed states", async () => {
    const scope = await seedScope();
    await expect(
      prisma.nurtureFamilyCareItem.create({
        data: {
          ...g2ItemData(scope),
          lifecycleState: "active",
          lifecycleReason: "family_withdrawn",
        },
      }),
    ).rejects.toThrow(/ck_nurture_item_lifecycle_reason/);
    await expect(
      prisma.nurtureFamilyCareItem.create({
        data: {
          ...g2ItemData(scope),
          lifecycleState: "closed",
          lifecycleReason: "family_withdrawn",
        },
      }),
    ).resolves.toMatchObject({ lifecycleReason: "family_withdrawn" });
  });

  it("rejects harness messages without the exact original scope", async () => {
    const scope = await seedScope();
    const item = await prisma.nurtureFamilyCareItem.create({
      data: g2ItemData(scope),
    });
    await expect(
      prisma.nurtureFamilyCareMessage.create({
        data: {
          ...g2ReplyData(scope, item.id, "0001-a"),
          enrollmentId: null,
        },
      }),
    ).rejects.toThrow(/ck_nurture_message_g2_scope/);
    await expect(
      prisma.nurtureFamilyCareMessage.create({
        data: { ...g2ReplyData(scope, item.id, "0001-a"), direction: null },
      }),
    ).rejects.toThrow(/ck_nurture_message_g2_scope/);
  });

  it("rejects plaintext or dev-mode bodies on harness messages", async () => {
    const scope = await seedScope();
    const item = await prisma.nurtureFamilyCareItem.create({
      data: g2ItemData(scope),
    });
    await expect(
      prisma.nurtureFamilyCareMessage.create({
        data: {
          ...g2ReplyData(scope, item.id, "0002-a"),
          body: "raw plaintext",
        },
      }),
    ).rejects.toThrow(/ck_nurture_message_g2_protected_body/);
    await expect(
      prisma.nurtureFamilyCareMessage.create({
        data: {
          ...g2ReplyData(scope, item.id, "0002-b"),
          bodyStorageMode: "plain_text_dev",
        },
      }),
    ).rejects.toThrow(/ck_nurture_message_g2_protected_body/);
  });

  it("requires an immutable reply order key on harness replies", async () => {
    const scope = await seedScope();
    const item = await prisma.nurtureFamilyCareItem.create({
      data: g2ItemData(scope),
    });
    await expect(
      prisma.nurtureFamilyCareMessage.create({
        data: g2ReplyData(scope, item.id, null),
      }),
    ).rejects.toThrow(/ck_nurture_message_g2_reply_order/);
  });

  it("enforces per-item uniqueness of the reply order key", async () => {
    const scope = await seedScope();
    const item = await prisma.nurtureFamilyCareItem.create({
      data: g2ItemData(scope),
    });
    await prisma.nurtureFamilyCareMessage.create({
      data: g2ReplyData(scope, item.id, "0003-a"),
    });
    await expect(
      prisma.nurtureFamilyCareMessage.create({
        data: g2ReplyData(scope, item.id, "0003-a"),
      }),
    ).rejects.toThrow(/uq_nurture_reply_order|Unique constraint/);
    await expect(
      prisma.nurtureFamilyCareMessage.create({
        data: g2ReplyData(scope, item.id, "0003-b"),
      }),
    ).resolves.toMatchObject({ replyOrderKey: "0003-b" });
  });

  // The unique index guarantees one row per (message, version) — it does not
  // by itself enforce the frozen "max + 1" successor rule, which the Increment
  // 2 correction command owns and must prove separately.
  it("rejects a duplicate correction version per message", async () => {
    const scope = await seedScope();
    const first = await prisma.nurtureFamilyCareMessageCorrection.create({
      data: {
        workspaceId: scope.workspaceId,
        messageId: scope.sourceMessage.id,
        correctionVersion: 1,
        authorParticipantId: scope.guardian.id,
        authorRoleAssignmentId: scope.guardianRole.id,
        bodyStorageMode: "encrypted",
        bodyProtectionPayload: { algVersion: 1, keyRef: "test", ciphertext: "x", integrityTag: "y" },
        status: "active",
      },
    });
    expect(first.correctionVersion).toBe(1);
    await expect(
      prisma.nurtureFamilyCareMessageCorrection.create({
        data: {
          workspaceId: scope.workspaceId,
          messageId: scope.sourceMessage.id,
          correctionVersion: 1,
          authorParticipantId: scope.guardian.id,
          authorRoleAssignmentId: scope.guardianRole.id,
          bodyStorageMode: "encrypted",
          status: "active",
        },
      }),
    ).rejects.toMatchObject({ code: "P2002" });
    await expect(
      prisma.nurtureFamilyCareMessageCorrection.create({
        data: {
          workspaceId: scope.workspaceId,
          messageId: scope.sourceMessage.id,
          correctionVersion: 2,
          authorParticipantId: scope.guardian.id,
          authorRoleAssignmentId: scope.guardianRole.id,
          bodyStorageMode: "encrypted",
          status: "active",
        },
      }),
    ).resolves.toMatchObject({ correctionVersion: 2 });
  });
});
