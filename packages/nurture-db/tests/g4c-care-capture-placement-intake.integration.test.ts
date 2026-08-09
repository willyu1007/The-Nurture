import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { createPrismaClient } from "../src/client.js";
import { PrismaCareCapturePlacementIntakeConsumer } from "../src/repositories/care-capture-placement-intake.js";

const prisma = createPrismaClient();
const consumer = new PrismaCareCapturePlacementIntakeConsumer(prisma);

afterAll(async () => {
  await prisma.$disconnect();
});

const seed = async (withPolicy = true) => {
  const workspaceId = randomUUID();
  const institution = await prisma.nurtureCareInstitution.create({
    data: { workspaceId, displayName: "Placement Intake Institution", status: "active" },
  });
  const careGroup = await prisma.nurtureCareGroup.create({
    data: { workspaceId, institutionId: institution.id, name: "Class", status: "active" },
  });
  const teacher = await prisma.nurtureParticipant.create({
    data: { workspaceId, myChatUserId: `teacher:${randomUUID()}`, status: "active" },
  });
  const teacherRole = await prisma.nurtureCareRoleAssignment.create({
    data: {
      workspaceId,
      participantId: teacher.id,
      role: "caregiver",
      scopeType: "care_group",
      scopeId: careGroup.id,
      status: "active",
    },
  });
  if (withPolicy) {
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
  }
  await prisma.nurtureClassScheduleTemplate.create({
    data: {
      workspaceId,
      institutionId: institution.id,
      careGroupId: careGroup.id,
      layer: "class_standing",
      slotsPayload: [
        { slot_ref: "midnight", label: "Midnight", starts_at_minute: 0, ends_at_minute: 60 },
      ],
    },
  });
  const capture = await prisma.nurtureCareCapture.create({
    data: {
      workspaceId,
      careGroupId: careGroup.id,
      capturedByRoleAssignmentId: teacherRole.id,
      kind: "text",
      sourceSequence: 1,
      stable: true,
      occurredAt: new Date("2026-08-08T16:30:00.000Z"),
    },
  });
  return { workspaceId, institution, careGroup, capture };
};

describe("T-007 care-capture automatic placement intake (production DB lane)", () => {
  it("uses the exact capture class and Institution-local date across UTC midnight", async () => {
    const scope = await seed();
    await expect(
      consumer.consume({ workspace_id: scope.workspaceId, capture_ref: scope.capture.id }),
    ).resolves.toMatchObject({
      status: "consumed",
      care_group_ref: scope.careGroup.id,
      local_date: "2026-08-09",
      applied: 1,
    });
    await expect(
      prisma.nurtureActivityPlacement.findUnique({
        where: {
          workspaceId_sourceKind_sourceId: {
            workspaceId: scope.workspaceId,
            sourceKind: "care_capture",
            sourceId: scope.capture.id,
          },
        },
      }),
    ).resolves.toMatchObject({
      careGroupId: scope.careGroup.id,
      localDate: new Date("2026-08-09T00:00:00.000Z"),
      state: "placed",
      activityRef: "midnight",
      decidedBy: "schedule_window",
    });
  });

  it("is replay-safe through the existing placement no-op and write fence", async () => {
    const scope = await seed();
    await consumer.consume({ workspace_id: scope.workspaceId, capture_ref: scope.capture.id });
    await expect(
      consumer.consume({ workspace_id: scope.workspaceId, capture_ref: scope.capture.id }),
    ).resolves.toMatchObject({ status: "consumed", applied: 0, skipped: 1 });
    await expect(
      prisma.nurtureActivityPlacement.findFirst({
        where: { workspaceId: scope.workspaceId, sourceId: scope.capture.id },
      }),
    ).resolves.toMatchObject({ placementHead: 1 });
  });

  it("fails closed for the wrong workspace or an unavailable timezone owner", async () => {
    const wrongWorkspace = await seed();
    await expect(
      consumer.consume({ workspace_id: randomUUID(), capture_ref: wrongWorkspace.capture.id }),
    ).resolves.toEqual({ status: "unavailable", reason_code: "unavailable" });

    const missingPolicy = await seed(false);
    await expect(
      consumer.consume({ workspace_id: missingPolicy.workspaceId, capture_ref: missingPolicy.capture.id }),
    ).resolves.toEqual({ status: "unavailable", reason_code: "unavailable" });
    await expect(
      prisma.nurtureActivityPlacement.count({
        where: { workspaceId: missingPolicy.workspaceId, sourceId: missingPolicy.capture.id },
      }),
    ).resolves.toBe(0);
  });
});
