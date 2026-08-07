import { createHash, randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { createPrismaClient } from "../src/client.js";
import { PrismaFamilyGrowthOutboxPort } from "../src/repositories/family-growth-outbox.transaction.js";

const prisma = createPrismaClient();
afterAll(async () => {
  await prisma.$disconnect();
});

const DIGEST = "a".repeat(64);

/** Minimal chain up to one committed per-target release (direct seeding). */
const seedRelease = async () => {
  const workspaceId = randomUUID();
  const teacher = await prisma.nurtureParticipant.create({
    data: { workspaceId, myChatUserId: `teacher:${workspaceId}`, status: "active" },
  });
  const guardian = await prisma.nurtureParticipant.create({
    data: { workspaceId, myChatUserId: `guardian:${workspaceId}`, status: "active" },
  });
  const institution = await prisma.nurtureCareInstitution.create({
    data: { workspaceId, displayName: "Care Center", status: "active" },
  });
  const group = await prisma.nurtureCareGroup.create({
    data: { workspaceId, institutionId: institution.id, name: "Class A", status: "active" },
  });
  const teacherRole = await prisma.nurtureCareRoleAssignment.create({
    data: {
      workspaceId,
      participantId: teacher.id,
      role: "caregiver",
      scopeType: "care_group",
      scopeId: group.id,
      status: "active",
    },
  });
  const child = await prisma.nurtureChild.create({
    data: { workspaceId, displayName: "Child A", status: "active" },
  });
  const careProcess = await prisma.nurtureChildCareProcess.create({
    data: { workspaceId, childId: child.id, status: "active" },
  });
  const family = await prisma.nurtureFamily.create({
    data: {
      workspaceId,
      childCareProcessId: careProcess.id,
      displayName: "Family A",
      status: "active",
    },
  });
  const enrollment = await prisma.nurtureEnrollment.create({
    data: {
      workspaceId,
      childCareProcessId: careProcess.id,
      institutionId: institution.id,
      careGroupId: group.id,
      status: "active",
    },
  });
  const grant = await prisma.nurtureChildLinkGrant.create({
    data: {
      workspaceId,
      childCareProcessId: careProcess.id,
      enrollmentId: enrollment.id,
      grantedByParticipantId: guardian.id,
      grantedToScopeType: "care_group",
      grantedToScopeId: group.id,
      directions: ["org_to_family"],
      dataClasses: ["child_growth_record"],
      purposes: ["child_growth_publication"],
      status: "active",
    },
  });
  const process = await prisma.nurturePublishProcess.create({
    data: {
      workspaceId,
      careGroupId: group.id,
      processKey: `publish:${randomUUID()}`,
      state: "pending_release",
      dataClass: "child_growth_record",
      purposeKey: "child_growth_publication",
      authorizingRoleAssignmentId: teacherRole.id,
    },
  });
  const revision = await prisma.nurturePublishProcessRevision.create({
    data: {
      workspaceId,
      publishProcessId: process.id,
      revision: 1,
      contentDigest: "sha256:content",
      organizerInputRevision: "organizer:1",
    },
  });
  await prisma.nurturePublishProcess.update({
    where: { id: process.id },
    data: { currentRevisionId: revision.id, frozenRevisionId: revision.id, state: "released" },
  });
  const target = await prisma.nurturePublishProcessTarget.create({
    data: {
      workspaceId,
      publishProcessId: process.id,
      targetKey: "target:child-A",
      childCareProcessId: careProcess.id,
      enrollmentId: enrollment.id,
      familyRefKey: family.id,
      grantId: grant.id,
    },
  });
  const release = await prisma.nurturePublicationRelease.create({
    data: {
      workspaceId,
      publishProcessId: process.id,
      publishProcessTargetId: target.id,
      publishProcessRevisionId: revision.id,
      releasedByRoleAssignmentId: teacherRole.id,
      commandRequestIdHash: createHash("sha256").update(randomUUID()).digest("hex"),
    },
  });
  const visibilityEvent = await prisma.nurturePublicationVisibilityEvent.create({
    data: {
      workspaceId,
      publicationReleaseId: release.id,
      kind: "correction",
      reasonKey: "content_error",
      actorRoleAssignmentId: teacherRole.id,
      sourceReleaseRevision: 1,
    },
  });
  return { workspaceId, release, visibilityEvent };
};

const port = () => new PrismaFamilyGrowthOutboxPort(prisma);

describe("T-009 I2: family-growth outbox schema and port", () => {
  it("appends a released event atomically with the caller's transaction", async () => {
    const world = await seedRelease();
    const eventId = randomUUID();

    await expect(
      prisma.$transaction(async (tx) => {
        await port().appendWithin(tx, {
          workspaceId: world.workspaceId,
          eventId,
          kind: "released",
          publicationReleaseId: world.release.id,
          payloadDigest: DIGEST,
          envelope: { probe: "rollback" },
        });
        throw new Error("force rollback");
      }),
    ).rejects.toThrow("force rollback");
    expect(
      await prisma.nurtureFamilyGrowthOutboxEvent.count({
        where: { workspaceId: world.workspaceId },
      }),
    ).toBe(0);

    await prisma.$transaction(async (tx) => {
      await port().appendWithin(tx, {
        workspaceId: world.workspaceId,
        eventId,
        kind: "released",
        publicationReleaseId: world.release.id,
        payloadDigest: DIGEST,
        envelope: { probe: "committed" },
      });
    });
    const row = await prisma.nurtureFamilyGrowthOutboxEvent.findUniqueOrThrow({
      where: { id: eventId },
    });
    expect(row.deliveryState).toBe("pending");
    expect(row.visibilityEventId).toBeNull();
  });

  it("enforces one released event per release via the partial unique index", async () => {
    const world = await seedRelease();
    const append = (eventId: string) =>
      prisma.$transaction(async (tx) => {
        await port().appendWithin(tx, {
          workspaceId: world.workspaceId,
          eventId,
          kind: "released",
          publicationReleaseId: world.release.id,
          payloadDigest: DIGEST,
          envelope: {},
        });
      });
    await append(randomUUID());
    await expect(append(randomUUID())).rejects.toThrow();
    // Lifecycle events for the same release stay allowed.
    await prisma.$transaction(async (tx) => {
      await port().appendWithin(tx, {
        workspaceId: world.workspaceId,
        eventId: randomUUID(),
        kind: "correction",
        publicationReleaseId: world.release.id,
        visibilityEventId: world.visibilityEvent.id,
        payloadDigest: DIGEST,
        envelope: {},
      });
    });
  });

  it("enforces kind/source coherence and digest format at the database", async () => {
    const world = await seedRelease();
    // released must not name a visibility event.
    await expect(
      prisma.nurtureFamilyGrowthOutboxEvent.create({
        data: {
          id: randomUUID(),
          workspaceId: world.workspaceId,
          kind: "released",
          publicationReleaseId: world.release.id,
          visibilityEventId: world.visibilityEvent.id,
          payloadDigest: DIGEST,
          envelopePayload: {},
        },
      }),
    ).rejects.toThrow();
    // lifecycle must name one.
    await expect(
      prisma.nurtureFamilyGrowthOutboxEvent.create({
        data: {
          id: randomUUID(),
          workspaceId: world.workspaceId,
          kind: "redaction",
          publicationReleaseId: world.release.id,
          payloadDigest: DIGEST,
          envelopePayload: {},
        },
      }),
    ).rejects.toThrow();
    // placeholder digests never land.
    await expect(
      prisma.nurtureFamilyGrowthOutboxEvent.create({
        data: {
          id: randomUUID(),
          workspaceId: world.workspaceId,
          kind: "released",
          publicationReleaseId: world.release.id,
          payloadDigest: "THIS-IS-NOT-A-DIGEST".padEnd(64, "x"),
          envelopePayload: {},
        },
      }),
    ).rejects.toThrow();
  });

  it("claims due rows once and settles them from receipts", async () => {
    const world = await seedRelease();
    const eventId = randomUUID();
    await prisma.$transaction(async (tx) => {
      await port().appendWithin(tx, {
        workspaceId: world.workspaceId,
        eventId,
        kind: "released",
        publicationReleaseId: world.release.id,
        payloadDigest: DIGEST,
        envelope: { event_id: eventId },
      });
    });

    const now = new Date();
    const claimed = (await port().claimDue({ now, limit: 50 })).filter(
      (row) => row.workspaceId === world.workspaceId,
    );
    expect(claimed.map((row) => row.eventId)).toEqual([eventId]);
    expect(claimed[0]!.attemptCount).toBe(1);
    // A delivering row is not claimable again.
    expect(
      (await port().claimDue({ now, limit: 50 })).filter(
        (row) => row.workspaceId === world.workspaceId,
      ),
    ).toEqual([]);

    // Transport failure: retriable outcome_unknown, due only after backoff.
    const backoff = new Date(now.getTime() + 60_000);
    await port().recordTransportFailure({ outboxEventId: eventId, nextAttemptAt: backoff });
    expect(
      (await port().claimDue({ now, limit: 50 })).filter(
        (row) => row.workspaceId === world.workspaceId,
      ),
    ).toEqual([]);
    const reclaimed = (
      await port().claimDue({ now: new Date(backoff.getTime() + 1), limit: 50 })
    ).filter((row) => row.workspaceId === world.workspaceId);
    expect(reclaimed.map((row) => row.eventId)).toEqual([eventId]);
    expect(reclaimed[0]!.attemptCount).toBe(2);

    // Receipt settles the row; replaying the same receipt is a no-op append.
    const processedAt = new Date();
    const record = () =>
      port().recordReceipt({
        workspaceId: world.workspaceId,
        outboxEventId: eventId,
        receiptId: "rcpt-1",
        status: "applied",
        admissionRef: "adm-1",
        materialRef: "mat-1",
        processedAt,
        receiptPayload: { receipt_id: "rcpt-1" },
      });
    await record();
    await record();
    const settled = await prisma.nurtureFamilyGrowthOutboxEvent.findUniqueOrThrow({
      where: { id: eventId },
    });
    expect(settled.deliveryState).toBe("delivered");
    expect(
      await prisma.nurtureFamilyGrowthAdmissionReceipt.count({
        where: { workspaceId: world.workspaceId, outboxEventId: eventId },
      }),
    ).toBe(1);
  });

  it("enforces receipt companion refs and settles rejections as failed", async () => {
    const world = await seedRelease();
    const eventId = randomUUID();
    await prisma.$transaction(async (tx) => {
      await port().appendWithin(tx, {
        workspaceId: world.workspaceId,
        eventId,
        kind: "released",
        publicationReleaseId: world.release.id,
        payloadDigest: DIGEST,
        envelope: {},
      });
    });
    // applied without material_ref violates the companion CHECK.
    await expect(
      prisma.nurtureFamilyGrowthAdmissionReceipt.create({
        data: {
          workspaceId: world.workspaceId,
          outboxEventId: eventId,
          receiptId: "rcpt-bad",
          status: "applied",
          admissionRef: "adm-1",
          processedAt: new Date(),
          receiptPayload: {},
        },
      }),
    ).rejects.toThrow();

    await port().recordReceipt({
      workspaceId: world.workspaceId,
      outboxEventId: eventId,
      receiptId: "rcpt-2",
      status: "rejected",
      reasonCode: "policy_prerequisite_failed",
      processedAt: new Date(),
      receiptPayload: {},
    });
    const settled = await prisma.nurtureFamilyGrowthOutboxEvent.findUniqueOrThrow({
      where: { id: eventId },
    });
    expect(settled.deliveryState).toBe("failed");
  });

  it("guards the media content digest format", async () => {
    const world = await seedRelease();
    const institution = await prisma.nurtureCareInstitution.findFirstOrThrow({
      where: { workspaceId: world.workspaceId },
    });
    await expect(
      prisma.nurtureMediaAssetRef.create({
        data: {
          workspaceId: world.workspaceId,
          institutionId: institution.id,
          sourceKind: "class_album",
          storageRefPayload: { bucket: "media", key: randomUUID() },
          lifecycle: "ready",
          contentDigest: "not-a-real-digest".padEnd(64, "z"),
        },
      }),
    ).rejects.toThrow();
    const asset = await prisma.nurtureMediaAssetRef.create({
      data: {
        workspaceId: world.workspaceId,
        institutionId: institution.id,
        sourceKind: "class_album",
        storageRefPayload: { bucket: "media", key: randomUUID() },
        lifecycle: "ready",
        contentDigest: DIGEST,
      },
    });
    expect(asset.contentDigest).toBe(DIGEST);
  });
});
