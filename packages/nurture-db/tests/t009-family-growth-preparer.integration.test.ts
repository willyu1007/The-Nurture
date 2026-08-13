import { createHash, randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
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
import { familyGrowthPreparedBindingHeadsAreCurrent } from "../src/repositories/publication-release.transaction.js";

// T-009 I3c: the fact preparer assembles a prepared emission from real
// canonical rows — binding chain, policy, frozen revision, media facts and
// the sealed display title — failing each gap closed with its own reason.
const prisma = createPrismaClient();
const revoker = createPrismaClient();
afterAll(async () => {
  await Promise.all([prisma.$disconnect(), revoker.$disconnect()]);
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
        data: {
          workspaceId,
          myChatUserId: `${tag}:${workspaceId}`,
          status: "active",
        },
      }),
    ),
  );
  const institution = await prisma.nurtureCareInstitution.create({
    data: { workspaceId, displayName: "Care Center", status: "active" },
  });
  const group = await prisma.nurtureCareGroup.create({
    data: {
      workspaceId,
      institutionId: institution.id,
      name: "向日葵班",
      status: "active",
    },
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
  const guardianRole = await prisma.nurtureCareRoleAssignment.create({
    data: {
      workspaceId,
      participantId: guardian!.id,
      role: "guardian",
      scopeType: "family",
      scopeId: workspaceId,
      status: "active",
      aggregateVersion: 1,
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
      participationPhase: "formal",
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
        ? {
            titleProtectionPayload: protectedContent.seal("户外写生活动") as never,
          }
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

  let binding:
    | {
        childAnchorId: string;
        familyAnchorId: string;
        childAssociationId: string;
        familyAssociationId: string;
        childAuthorizationId: string;
        familyAuthorizationId: string;
      }
    | undefined;
  if (options.binding !== false) {
    const childAnchor = await prisma.nurtureChildBindingAnchor.create({
      data: {
        reservationKeyHash: hash(`child:${workspaceId}`),
        status: "associated",
      },
    });
    const familyAnchor = await prisma.nurtureFamilyBindingAnchor.create({
      data: {
        reservationKeyHash: hash(`family:${workspaceId}`),
        status: "associated",
      },
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
    const familyAssociation = await prisma.nurtureFamilyAnchorAssociation.create({
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
    const authorization = (subjectType: "child" | "family", anchorId: string) =>
      prisma.nurtureScenarioBindingAuthorization.create({
        data: {
          workspaceId,
          subjectType,
          ...(subjectType === "child" ? { childAnchorId: anchorId } : { familyAnchorId: anchorId }),
          ownerRef: `nurture_${subjectType}_binding_anchor_v1:${anchorId}`,
          ownerVersion: 1,
          idempotencyKeyHash: hash(`auth:${subjectType}:${workspaceId}`),
          requestFingerprint: hash(`fp:${subjectType}:${workspaceId}`),
          subjectEvidenceHash: hash("subject"),
          userEvidenceHash: hash("user"),
          actorEvidenceHash: hash("actor"),
          purpose: "scenario_binding_write",
          authorizationSourceRef: `nurture-care-role:${guardianRole.id}`,
          authorizationSourceVersion: guardianRole.aggregateVersion,
          status: "active",
          verifiedAt: new Date("2026-08-05T08:00:00.000Z"),
          expiresAt: FUTURE,
        },
      });
    const [childAuthorization, familyAuthorization] = await Promise.all([
      authorization("child", childAnchor.id),
      authorization("family", familyAnchor.id),
    ]);
    binding = {
      childAnchorId: childAnchor.id,
      familyAnchorId: familyAnchor.id,
      childAssociationId: childAssociation.id,
      familyAssociationId: familyAssociation.id,
      childAuthorizationId: childAuthorization.id,
      familyAuthorizationId: familyAuthorization.id,
    };
  }

  return {
    workspaceId,
    teacher: teacher!,
    guardianRole,
    process,
    revision,
    target,
    asset,
    family,
    child,
    careProcess,
    binding,
  };
};

const exchangeOk: FamilyGrowthCanonicalExchangePort = {
  exchange: async () => ({
    status: "exchanged",
    childId: "mc-child-1",
    familyId: "mc-family-1",
    ownerEvidenceExpiresAt: "2099-01-01T00:00:00.000Z",
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

const commitPrepared = (
  world: Awaited<ReturnType<typeof seedWorld>>,
  emission: Extract<Awaited<ReturnType<typeof prepare>>, { status: "prepared" }>["emission"],
) =>
  new PrismaPublicationReleasePort(prisma).commitTargetRelease({
    workspace_id: world.workspaceId,
    participant_id: world.teacher.id,
    process_key: world.process.processKey,
    target_key: world.target.targetKey,
    revision: 1,
    command_request_id: `cmd:${randomUUID()}`,
    trigger: "immediate",
    family_growth: emission,
  });

const expectNoReleaseWrites = async (world: Awaited<ReturnType<typeof seedWorld>>) => {
  expect(
    await prisma.nurturePublicationRelease.count({
      where: { workspaceId: world.workspaceId },
    }),
  ).toBe(0);
  expect(
    await prisma.nurtureChildLinkReceipt.count({
      where: { workspaceId: world.workspaceId },
    }),
  ).toBe(0);
  expect(
    await prisma.nurtureFamilyGrowthOutboxEvent.count({
      where: { workspaceId: world.workspaceId },
    }),
  ).toBe(0);
};

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
    const commit = await commitPrepared(world, result.emission);
    expect(commit.status).toBe("committed");
    expect(
      await prisma.nurtureFamilyGrowthOutboxEvent.count({
        where: { workspaceId: world.workspaceId, kind: "released" },
      }),
    ).toBe(1);
  });

  it("rejects write-free when authorization is revoked between prepare and commit", async () => {
    const world = await seedWorld();
    const result = await prepare(world);
    expect(result.status).toBe("prepared");
    if (result.status !== "prepared") return;

    await prisma.nurtureScenarioBindingAuthorization.update({
      where: {
        id: result.emission.localBindingHeads.familyAuthorization.authorizationId,
      },
      data: {
        status: "revoked",
        revokedAt: new Date(),
        aggregateVersion: { increment: 1 },
      },
    });

    expect(await commitPrepared(world, result.emission)).toEqual({
      status: "rejected",
      reason_code: "binding_unavailable",
    });
    await expectNoReleaseWrites(world);
  });

  it("rejects write-free when the family is rebound between prepare and commit", async () => {
    const world = await seedWorld();
    const result = await prepare(world);
    expect(result.status).toBe("prepared");
    if (result.status !== "prepared" || !world.binding) return;

    const reboundFamilyAnchor = await prisma.nurtureFamilyBindingAnchor.create({
      data: {
        reservationKeyHash: hash(`family-rebind:${world.workspaceId}`),
        status: "associated",
      },
    });
    await prisma.$transaction([
      prisma.nurtureFamilyAnchorAssociation.update({
        where: { id: world.binding.familyAssociationId },
        data: {
          status: "revoked",
          currentKey: null,
          currentChildAssociationId: null,
          revokedAt: new Date(),
          aggregateVersion: { increment: 1 },
        },
      }),
      prisma.nurtureFamilyAnchorAssociation.create({
        data: {
          workspaceId: world.workspaceId,
          familyAnchorId: reboundFamilyAnchor.id,
          childAnchorId: world.binding.childAnchorId,
          childAssociationId: world.binding.childAssociationId,
          currentChildAssociationId: world.binding.childAssociationId,
          childId: world.child.id,
          childCareProcessId: world.careProcess.id,
          familyId: world.family.id,
          status: "active",
          currentKey: "current",
        },
      }),
      prisma.nurtureScenarioBindingAuthorization.create({
        data: {
          workspaceId: world.workspaceId,
          subjectType: "family",
          familyAnchorId: reboundFamilyAnchor.id,
          ownerRef: `nurture_family_binding_anchor_v1:${reboundFamilyAnchor.id}`,
          ownerVersion: reboundFamilyAnchor.aggregateVersion,
          idempotencyKeyHash: hash(`auth:family-rebind:${world.workspaceId}`),
          requestFingerprint: hash(`fp:family-rebind:${world.workspaceId}`),
          subjectEvidenceHash: hash("subject"),
          userEvidenceHash: hash("user"),
          actorEvidenceHash: hash("actor"),
          purpose: "scenario_binding_write",
          authorizationSourceRef: `nurture-care-role:${world.guardianRole.id}`,
          authorizationSourceVersion: world.guardianRole.aggregateVersion,
          status: "active",
          verifiedAt: new Date("2026-08-06T08:00:00.000Z"),
          expiresAt: FUTURE,
        },
      }),
    ]);

    expect(await commitPrepared(world, result.emission)).toEqual({
      status: "rejected",
      reason_code: "binding_unavailable",
    });
    await expectNoReleaseWrites(world);
  });

  it("rejects valid prepared heads cross-paired with another target", async () => {
    const [worldA, worldB] = await Promise.all([seedWorld(), seedWorld()]);
    const [preparedA, preparedB] = await Promise.all([prepare(worldA), prepare(worldB)]);
    expect(preparedA.status).toBe("prepared");
    expect(preparedB.status).toBe("prepared");
    if (preparedA.status !== "prepared" || preparedB.status !== "prepared") return;

    const crossPaired = {
      ...preparedA.emission,
      localBindingHeads: preparedB.emission.localBindingHeads,
    };
    expect(await commitPrepared(worldA, crossPaired)).toEqual({
      status: "rejected",
      reason_code: "binding_target_mismatch",
    });
    await expectNoReleaseWrites(worldA);
  });

  it("rejects a swapped canonical tuple while keeping its prepared heads", async () => {
    const world = await seedWorld();
    const prepared = await prepare(world);
    expect(prepared.status).toBe("prepared");
    if (prepared.status !== "prepared") return;

    const swappedCanonicalTuple = {
      ...prepared.emission,
      target: { child_id: "mc-child-other", family_id: "mc-family-other" },
    };
    expect(await commitPrepared(world, swappedCanonicalTuple)).toEqual({
      status: "rejected",
      reason_code: "binding_target_mismatch",
    });
    await expectNoReleaseWrites(world);
  });

  it.each([
    Prisma.TransactionIsolationLevel.ReadCommitted,
    Prisma.TransactionIsolationLevel.RepeatableRead,
    Prisma.TransactionIsolationLevel.Serializable,
  ])("blocks a concurrent revocation after the release guard locks at %s", async (isolationLevel) => {
    const world = await seedWorld();
    const prepared = await prepare(world);
    expect(prepared.status).toBe("prepared");
    if (prepared.status !== "prepared") return;

    let releaseGuardLocked!: () => void;
    const locked = new Promise<void>((resolve) => {
      releaseGuardLocked = resolve;
    });
    let finishReleaseGuard!: () => void;
    const finish = new Promise<void>((resolve) => {
      finishReleaseGuard = resolve;
    });

    const releaseTransaction = prisma.$transaction(
      async (transaction) => {
        expect(
          await familyGrowthPreparedBindingHeadsAreCurrent(
            transaction,
            prepared.emission.localBindingHeads,
            new Date(),
          ),
        ).toBe(true);
        releaseGuardLocked();
        await finish;
      },
      { isolationLevel },
    );
    await locked;

    let revocationSettled = false;
    const revocation = revoker.nurtureScenarioBindingAuthorization
      .update({
        where: {
          id: prepared.emission.localBindingHeads.familyAuthorization.authorizationId,
        },
        data: {
          status: "revoked",
          revokedAt: new Date(),
          aggregateVersion: { increment: 1 },
        },
      })
      .then(() => {
        revocationSettled = true;
      });
    await Promise.race([revocation, new Promise<void>((resolve) => setTimeout(resolve, 100))]);
    expect(revocationSettled).toBe(false);

    finishReleaseGuard();
    await releaseTransaction;
    await revocation;
    expect(revocationSettled).toBe(true);
  });

  it("denies with the resolution reason when the binding chain is absent", async () => {
    const world = await seedWorld({ binding: false });
    expect(await prepare(world)).toEqual({
      status: "denied",
      reason: "binding_missing",
    });
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
