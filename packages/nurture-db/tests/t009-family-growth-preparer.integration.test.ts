import { createHash, randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import type { FamilyGrowthCanonicalExchangePort } from "@the-nurture/scenario/family-growth";
import { createPrismaClient } from "../src/client.js";
import { createAesGcmProtectedContentPort } from "../src/protected-content.js";
import { PrismaFamilyGrowthBindingReadPort } from "../src/repositories/family-growth-binding.read.js";
import {
  familyRenditionRefV1,
  PrismaFamilyGrowthEmissionPreparer,
} from "../src/repositories/family-growth-emission.preparer.js";
import { PrismaPublicationReleasePort } from "../src/index.js";

// T-009 I3c: the fact preparer assembles a prepared emission from real
// canonical rows — binding chain, policy, frozen revision, media facts and
// the sealed display title — failing each gap closed with its own reason.
const prisma = createPrismaClient();
afterAll(async () => {
  await prisma.$disconnect();
});

const hash = (value: string): string => createHash("sha256").update(value).digest("hex");
const HEX_DIGEST = hash("revision-content");
const MEDIA_DIGEST = hash("media-bytes");
const FUTURE = new Date("2099-01-01T00:00:00.000Z");

const protectedContent = createAesGcmProtectedContentPort({
  keyRef: "t009-test-key",
  keyMaterial: "0123456789abcdef0123456789abcdef",
});

const SCHEDULE = {
  scheduledAt: new Date("2026-08-03T09:00:00.000Z"),
  notAfter: new Date("2099-08-03T11:00:00.000Z"),
  scheduleTimeZone: "Asia/Shanghai",
  schedulePolicyRef: "nurture.institution-publication-policy@1.0.0",
  schedulePolicyHead: 3,
  schedulePolicyVersion: 1,
  scheduleResolvedAt: new Date("2026-08-03T02:00:00.000Z"),
};

type SeedOptions = {
  policy?: boolean;
  schedule?: boolean;
  binding?: boolean;
  sealedTitle?: boolean;
  mediaDigest?: string | null;
  mediaMime?: string | null;
  mediaRevisionDrift?: boolean;
  emptyComposition?: boolean;
};

const seedWorld = async (options: SeedOptions = {}) => {
  const workspaceId = randomUUID();
  const [teacher, guardian] = await Promise.all(
    ["teacher", "guardian"].map((tag) =>
      prisma.nurtureParticipant.create({
        data: { workspaceId, myChatUserId: `${tag}:${workspaceId}`, status: "active" },
      }),
    ),
  );
  const institution = await prisma.nurtureCareInstitution.create({
    data: { workspaceId, displayName: "Care Center", status: "active" },
  });
  const group = await prisma.nurtureCareGroup.create({
    data: { workspaceId, institutionId: institution.id, name: "向日葵班", status: "active" },
  });
  const teacherRole = await prisma.nurtureCareRoleAssignment.create({
    data: {
      workspaceId,
      participantId: teacher!.id,
      role: "caregiver",
      scopeType: "care_group",
      scopeId: group.id,
      status: "active",
    },
  });
  if (options.policy !== false) {
    await prisma.nurtureInstitutionPublicationPolicy.create({
      data: {
        workspaceId,
        institutionId: institution.id,
        policyRef: SCHEDULE.schedulePolicyRef,
        policyVersion: SCHEDULE.schedulePolicyVersion,
        policyHead: SCHEDULE.schedulePolicyHead,
        timeZone: SCHEDULE.scheduleTimeZone,
        defaultReleaseLocalTime: "17:00",
        retryCutoffLocalTime: "19:00",
        organizeIdleSeconds: 600,
        organizeFallbackLeadSeconds: 1800,
        automaticQuiescenceSeconds: 60,
        captureActivityLeaseSeconds: 60,
        automaticOrganizeEnabled: true,
        effectiveFrom: new Date("2026-08-01T00:00:00.000Z"),
      },
    });
  }
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
      grantedByParticipantId: guardian!.id,
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
      mediaRevision: options.mediaRevisionDrift ? 2 : 1,
      capturedAt: new Date("2026-08-07T02:15:00.000Z"),
      contentDigest: options.mediaDigest === undefined ? MEDIA_DIGEST : options.mediaDigest,
      contentMimeType: options.mediaMime === undefined ? "image/jpeg" : options.mediaMime,
    },
  });
  await prisma.nurtureChildMediaAttribution.create({
    data: {
      workspaceId,
      mediaAssetRefId: asset.id,
      childCareProcessId: careProcess.id,
      source: "manual",
      state: "confirmed",
      confirmedByRoleAssignmentId: teacherRole.id,
      confirmedAt: new Date(),
      exposurePolicyPayload: { allow: [careProcess.id] },
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
      ...(options.schedule !== false ? SCHEDULE : {}),
    },
  });
  const revision = await prisma.nurturePublishProcessRevision.create({
    data: {
      workspaceId,
      publishProcessId: process.id,
      revision: 1,
      contentDigest: HEX_DIGEST,
      organizerInputRevision: "organizer:1",
      ...(options.sealedTitle !== false
        ? { titleProtectionPayload: protectedContent.seal("户外写生活动") as never }
        : {}),
      mediaCompositionPayload: options.emptyComposition
        ? { media: [] }
        : { media: [{ mediaAssetId: asset.id, mediaRevision: 1 }] },
    },
  });
  await prisma.nurturePublishProcess.update({
    where: { id: process.id },
    data: { currentRevisionId: revision.id },
  });
  const target = await prisma.nurturePublishProcessTarget.create({
    data: {
      workspaceId,
      publishProcessId: process.id,
      targetKey: "target:child-A",
      childCareProcessId: careProcess.id,
      enrollmentId: enrollment.id,
      // The production capture path writes the prefixed key form; the
      // preparer must strip it before handing the resolver a family id.
      familyRefKey: `${workspaceId}:${family.id}`,
      grantId: grant.id,
    },
  });

  if (options.binding !== false) {
    const childAnchor = await prisma.nurtureChildBindingAnchor.create({
      data: { reservationKeyHash: hash(`child:${workspaceId}`), status: "associated" },
    });
    const familyAnchor = await prisma.nurtureFamilyBindingAnchor.create({
      data: { reservationKeyHash: hash(`family:${workspaceId}`), status: "associated" },
    });
    const childAssociation = await prisma.nurtureChildAnchorAssociation.create({
      data: {
        workspaceId,
        childAnchorId: childAnchor.id,
        childId: child.id,
        status: "active",
        currentKey: "current",
      },
    });
    await prisma.nurtureFamilyAnchorAssociation.create({
      data: {
        workspaceId,
        familyAnchorId: familyAnchor.id,
        childAnchorId: childAnchor.id,
        childAssociationId: childAssociation.id,
        currentChildAssociationId: childAssociation.id,
        childId: child.id,
        childCareProcessId: careProcess.id,
        familyId: family.id,
        status: "active",
        currentKey: "current",
      },
    });
    for (const [subjectType, anchorId] of [
      ["child", childAnchor.id],
      ["family", familyAnchor.id],
    ] as const) {
      await prisma.nurtureScenarioBindingAuthorization.create({
        data: {
          workspaceId,
          subjectType,
          ...(subjectType === "child"
            ? { childAnchorId: anchorId }
            : { familyAnchorId: anchorId }),
          ownerRef: `nurture_${subjectType}_binding_anchor_v1:${anchorId}`,
          ownerVersion: 1,
          idempotencyKeyHash: hash(`auth:${subjectType}:${workspaceId}`),
          requestFingerprint: hash(`fp:${subjectType}:${workspaceId}`),
          subjectEvidenceHash: hash("subject"),
          userEvidenceHash: hash("user"),
          actorEvidenceHash: hash("actor"),
          purpose: "scenario_binding_write",
          authorizationSourceRef: "my_chat_child_identity",
          authorizationSourceVersion: 1,
          status: "active",
          verifiedAt: new Date("2026-08-05T08:00:00.000Z"),
          expiresAt: FUTURE,
        },
      });
    }
  }

  return { workspaceId, teacher: teacher!, process, revision, target, asset, family };
};

const exchangeOk: FamilyGrowthCanonicalExchangePort = {
  exchange: async () => ({
    status: "exchanged",
    childId: "mc-child-1",
    familyId: "mc-family-1",
  }),
};

const preparer = (exchange: FamilyGrowthCanonicalExchangePort = exchangeOk) =>
  new PrismaFamilyGrowthEmissionPreparer(prisma, {
    binding: new PrismaFamilyGrowthBindingReadPort(prisma),
    canonicalExchange: exchange,
    protectedContent,
  });

const prepare = (world: Awaited<ReturnType<typeof seedWorld>>) =>
  preparer().prepare({
    workspace_id: world.workspaceId,
    process_key: world.process.processKey,
    target_key: world.target.targetKey,
    child_care_process_id: world.target.childCareProcessId,
    revision: 1,
  });

describe("T-009 I3c: fact preparer over real canonical rows", () => {
  it("prepares a complete emission the release commit accepts end to end", async () => {
    const world = await seedWorld();
    const result = await prepare(world);
    expect(result.status).toBe("prepared");
    if (result.status !== "prepared") return;

    expect(result.emission.target).toEqual({
      child_id: "mc-child-1",
      family_id: "mc-family-1",
    });
    expect(result.emission.admission).toEqual({
      mode: "direct_family_release",
      policy_ref: SCHEDULE.schedulePolicyRef,
      policy_version: SCHEDULE.schedulePolicyVersion,
    });
    expect(result.emission.material.displaySnapshot).toEqual({
      title: "户外写生活动",
      source_label: "向日葵班",
    });
    expect(result.emission.material.occurredAt).toBe("2026-08-07T02:15:00.000Z");
    expect(result.emission.material.media).toEqual([
      {
        source_asset_ref: world.asset.id,
        source_media_revision: 1,
        content_digest: MEDIA_DIGEST,
        family_rendition_ref: familyRenditionRefV1(world.asset.id, 1),
        mime_type: "image/jpeg",
        access_mode: "authorized_short_lived_url",
      },
    ]);
    expect(result.emission.retentionMode).toBe("family_retained");
    expect(result.emission.contentDigest).toBe(HEX_DIGEST);

    // The prepared emission is exactly what the commit path accepts.
    const commit = await new PrismaPublicationReleasePort(prisma).commitTargetRelease({
      workspace_id: world.workspaceId,
      participant_id: world.teacher.id,
      process_key: world.process.processKey,
      target_key: world.target.targetKey,
      revision: 1,
      command_request_id: `cmd:${randomUUID()}`,
      trigger: "immediate",
      family_growth: result.emission,
    });
    expect(commit.status).toBe("committed");
    expect(
      await prisma.nurtureFamilyGrowthOutboxEvent.count({
        where: { workspaceId: world.workspaceId, kind: "released" },
      }),
    ).toBe(1);
  });

  it("denies with the resolution reason when the binding chain is absent", async () => {
    const world = await seedWorld({ binding: false });
    expect(await prepare(world)).toEqual({ status: "denied", reason: "binding_missing" });
  });

  it("denies when the process carries no resolved schedule policy identity", async () => {
    // The admission identity is the schedule's frozen policy; a process that
    // never resolved its window has no policy identity to release under.
    // (A missing CURRENT policy row is the commit gate's in-transaction
    // concern, not the preparer's.)
    const world = await seedWorld({ schedule: false });
    expect(await prepare(world)).toEqual({
      status: "denied",
      reason: "publication_policy_unavailable",
    });
  });

  it("denies media without a digest, without a mime type, or drifted", async () => {
    for (const options of [
      { mediaDigest: null },
      { mediaMime: null },
      { mediaRevisionDrift: true },
      { emptyComposition: true },
    ] satisfies SeedOptions[]) {
      const world = await seedWorld(options);
      expect(await prepare(world)).toEqual({
        status: "denied",
        reason: "media_facts_unavailable",
      });
    }
  });

  it("denies when the display title cannot be produced", async () => {
    const world = await seedWorld({ sealedTitle: false });
    expect(await prepare(world)).toEqual({
      status: "denied",
      reason: "display_content_unavailable",
    });
  });

  it("denies unknown process, target or revision as release_facts_unavailable", async () => {
    const world = await seedWorld();
    expect(
      await preparer().prepare({
        workspace_id: world.workspaceId,
        process_key: world.process.processKey,
        target_key: world.target.targetKey,
        child_care_process_id: world.target.childCareProcessId,
        revision: 99,
      }),
    ).toEqual({ status: "denied", reason: "release_facts_unavailable" });
  });
});
