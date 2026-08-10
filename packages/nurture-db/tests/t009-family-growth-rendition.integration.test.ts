import { createHash, randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { createPrismaClient } from "../src/client.js";
import { familyRenditionRefV1 } from "../src/repositories/family-growth-emission.preparer.js";
import {
  parseFamilyRenditionRefV1,
  PrismaFamilyGrowthRenditionReadPort,
} from "../src/repositories/family-growth-rendition.read.js";

// T-009 I5: rendition resolution re-authorizes on every call against the
// released outbox envelope and the release's current visibility; every
// failure collapses to null (the endpoint's single 404 answer).
const prisma = createPrismaClient();
afterAll(async () => {
  await prisma.$disconnect();
});

const hash = (value: string): string => createHash("sha256").update(value).digest("hex");
const MEDIA_DIGEST = hash("media-bytes");

const seedReleasedRendition = async (options: {
  assetOverrides?: Record<string, unknown>;
  visibility?: "visible" | "removed" | "redacted";
} = {}) => {
  const workspaceId = randomUUID();
  const teacher = await prisma.nurtureParticipant.create({
    data: { workspaceId, myChatUserId: `teacher:${workspaceId}`, status: "active" },
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
  const guardian = await prisma.nurtureParticipant.create({
    data: { workspaceId, myChatUserId: `guardian:${workspaceId}`, status: "active" },
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
      participationPhase: "formal",
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
  const asset = await prisma.nurtureMediaAssetRef.create({
    data: {
      workspaceId,
      institutionId: institution.id,
      careGroupId: group.id,
      sourceKind: "class_album",
      storageRefPayload: { bucket: "media", key: randomUUID() },
      lifecycle: "ready",
      mediaRevision: 1,
      contentDigest: MEDIA_DIGEST,
      contentMimeType: "image/jpeg",
      ...(options.assetOverrides ?? {}),
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
      contentDigest: hash("content"),
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
      familyRefKey: `${workspaceId}:${family.id}`,
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
      commandRequestIdHash: hash(randomUUID()),
      visibility: options.visibility ?? "visible",
    },
  });
  const ref = familyRenditionRefV1(asset.id, 1);
  await prisma.nurtureFamilyGrowthOutboxEvent.create({
    data: {
      id: randomUUID(),
      workspaceId,
      kind: "released",
      publicationReleaseId: release.id,
      payloadDigest: hash("payload"),
      envelopePayload: {
        target: { child_id: "mc-child-1", family_id: "mc-family-1" },
        material: { media: [{ family_rendition_ref: ref }] },
      },
    },
  });
  return { workspaceId, asset, release, ref };
};

const port = () => new PrismaFamilyGrowthRenditionReadPort(prisma);

describe("T-009 I5: rendition resolution over real rows", () => {
  it("resolves a delivered, visible rendition with its media facts", async () => {
    const world = await seedReleasedRendition();
    const resolved = await port().resolveRendition(world.ref);
    expect(resolved).toEqual({
      assetId: world.asset.id,
      mediaRevision: 1,
      workspaceId: world.workspaceId,
      contentDigest: MEDIA_DIGEST,
      contentMimeType: "image/jpeg",
      storageRefPayload: world.asset.storageRefPayload,
    });
  });

  it("parses only well-formed refs", () => {
    expect(parseFamilyRenditionRefV1("garbage")).toBeNull();
    expect(parseFamilyRenditionRefV1(`nurture_family_rendition_v1:${randomUUID()}:0`)).toBeNull();
    const id = randomUUID();
    expect(parseFamilyRenditionRefV1(`nurture_family_rendition_v1:${id}:7`)).toEqual({
      assetId: id,
      mediaRevision: 7,
    });
  });

  it("collapses never-released refs to null", async () => {
    await seedReleasedRendition();
    expect(
      await port().resolveRendition(familyRenditionRefV1(randomUUID(), 1)),
    ).toBeNull();
  });

  it("denies from the moment the release is removed or redacted", async () => {
    for (const visibility of ["removed", "redacted"] as const) {
      const world = await seedReleasedRendition({ visibility });
      expect(await port().resolveRendition(world.ref)).toBeNull();
    }
  });

  it("denies when the asset drifted past the pinned revision or lost its facts", async () => {
    const drifted = await seedReleasedRendition({ assetOverrides: { mediaRevision: 2 } });
    // The envelope pinned revision 1; the asset row now carries revision 2.
    expect(await port().resolveRendition(drifted.ref)).toBeNull();

    const unready = await seedReleasedRendition({ assetOverrides: { lifecycle: "unavailable" } });
    expect(await port().resolveRendition(unready.ref)).toBeNull();
  });
});
