import { createHash, randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import {
  resolveFamilyGrowthTargetV1,
  type FamilyGrowthCanonicalExchangePort,
} from "@the-nurture/scenario/family-growth";
import { createPrismaClient } from "../src/client.js";
import { PrismaFamilyGrowthBindingReadPort } from "../src/repositories/family-growth-binding.read.js";

const prisma = createPrismaClient();
afterAll(async () => {
  await prisma.$disconnect();
});

const NOW = new Date("2026-08-07T08:00:00.000Z");
const FUTURE = new Date("2026-08-08T08:00:00.000Z");
const PAST = new Date("2026-08-06T08:00:00.000Z");

const hash = (value: string): string => createHash("sha256").update(value).digest("hex");

type SeedOptions = {
  childAnchorStatus?: "associated" | "revoked" | "quarantined" | "retired";
  familyAnchorStatus?: "associated" | "revoked" | "quarantined";
  familyAssociation?: "current" | "revoked";
  childAuthorization?: "active" | "expired" | "revoked" | "missing";
  familyAuthorization?: "active" | "expired" | "revoked" | "missing";
};

const seedBinding = async (options: SeedOptions = {}) => {
  const workspaceId = randomUUID();
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
  const guardian = await prisma.nurtureParticipant.create({
    data: {
      workspaceId,
      myChatUserId: `guardian:${workspaceId}`,
      status: "active",
    },
  });
  const guardianRole = await prisma.nurtureCareRoleAssignment.create({
    data: {
      workspaceId,
      participantId: guardian.id,
      role: "guardian",
      scopeType: "family",
      scopeId: family.id,
      status: "active",
      aggregateVersion: 1,
    },
  });
  const anchorLifecycle = (status: string) => ({
    status: status as never,
    ...(status === "revoked" ? { revokedAt: NOW } : {}),
    ...(status === "quarantined"
      ? { quarantinedAt: NOW, quarantineReason: "test_quarantine" }
      : {}),
  });
  const childAnchor = await prisma.nurtureChildBindingAnchor.create({
    data: {
      reservationKeyHash: hash(`child:${workspaceId}`),
      ...anchorLifecycle(options.childAnchorStatus ?? "associated"),
    },
  });
  const familyAnchor = await prisma.nurtureFamilyBindingAnchor.create({
    data: {
      reservationKeyHash: hash(`family:${workspaceId}`),
      ...anchorLifecycle(options.familyAnchorStatus ?? "associated"),
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
  const familyAssociationCurrent = (options.familyAssociation ?? "current") === "current";
  const familyAssociation = await prisma.nurtureFamilyAnchorAssociation.create({
    data: {
      workspaceId,
      familyAnchorId: familyAnchor.id,
      childAnchorId: childAnchor.id,
      childAssociationId: childAssociation.id,
      // An active family association MUST name its child association as
      // current (ck_nurture_family_anchor_assoc_lifecycle) — which is why a
      // "current family association over a revoked child association" cannot
      // exist in rows; the resolver's child-association guard is
      // defense-in-depth covered by the unit suite.
      ...(familyAssociationCurrent ? { currentChildAssociationId: childAssociation.id } : {}),
      childId: child.id,
      childCareProcessId: careProcess.id,
      familyId: family.id,
      status: familyAssociationCurrent ? "active" : "revoked",
      currentKey: familyAssociationCurrent ? "current" : null,
      ...(familyAssociationCurrent ? {} : { revokedAt: NOW }),
    },
  });

  const authorization = async (
    subjectType: "child" | "family",
    anchorId: string,
    kind: "active" | "expired" | "revoked" | "missing",
  ) => {
    if (kind === "missing") return undefined;
    return prisma.nurtureScenarioBindingAuthorization.create({
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
        status: kind === "revoked" ? "revoked" : "active",
        verifiedAt: new Date("2026-08-05T08:00:00.000Z"),
        expiresAt: kind === "expired" ? PAST : FUTURE,
        ...(kind === "revoked" ? { revokedAt: NOW } : {}),
      },
    });
  };
  const childAuthorization = await authorization(
    "child",
    childAnchor.id,
    options.childAuthorization ?? "active",
  );
  const familyAuthorization = await authorization(
    "family",
    familyAnchor.id,
    options.familyAuthorization ?? "active",
  );

  return {
    workspaceId,
    careProcess,
    family,
    childAnchor,
    familyAnchor,
    childAssociation,
    familyAssociation,
    childAuthorization,
    familyAuthorization,
    guardian,
    guardianRole,
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

const resolve = async (
  world: Awaited<ReturnType<typeof seedBinding>>,
  exchange: FamilyGrowthCanonicalExchangePort = exchangeOk,
  overrides: Partial<{ localFamilyId: string }> = {},
) =>
  resolveFamilyGrowthTargetV1(
    {
      binding: new PrismaFamilyGrowthBindingReadPort(prisma),
      canonicalExchange: exchange,
    },
    {
      workspaceId: world.workspaceId,
      childCareProcessId: world.careProcess.id,
      localFamilyId: overrides.localFamilyId ?? world.family.id,
    },
    NOW,
  );

describe("T-009 I4: canonical target resolution over real binding rows", () => {
  it("resolves a healthy chain and hands the owner refs to the exchange", async () => {
    const world = await seedBinding();
    let seenChildRef = "";
    let seenFamilyRef = "";
    const result = await resolve(world, {
      exchange: async (input) => {
        seenChildRef = input.childOwnerRef;
        seenFamilyRef = input.familyOwnerRef;
        return {
          status: "exchanged",
          childId: "mc-child-1",
          familyId: "mc-family-1",
          ownerEvidenceExpiresAt: "2099-01-01T00:00:00.000Z",
        };
      },
    });
    expect(result).toEqual({
      status: "resolved",
      target: { child_id: "mc-child-1", family_id: "mc-family-1" },
      evidence: {
        canonicalTarget: { child_id: "mc-child-1", family_id: "mc-family-1" },
        workspaceId: world.workspaceId,
        localFamilyId: world.family.id,
        childCareProcessId: world.careProcess.id,
        childAnchor: {
          anchorId: world.childAnchor.id,
          aggregateVersion: world.childAnchor.aggregateVersion,
        },
        familyAnchor: {
          anchorId: world.familyAnchor.id,
          aggregateVersion: world.familyAnchor.aggregateVersion,
        },
        childAssociation: {
          associationId: world.childAssociation.id,
          aggregateVersion: world.childAssociation.aggregateVersion,
        },
        familyAssociation: {
          associationId: world.familyAssociation.id,
          aggregateVersion: world.familyAssociation.aggregateVersion,
        },
        childAuthorization: {
          authorizationId: world.childAuthorization!.id,
          aggregateVersion: world.childAuthorization!.aggregateVersion,
          expiresAt: FUTURE.toISOString(),
          ownerRef: world.childAuthorization!.ownerRef,
          ownerVersion: world.childAuthorization!.ownerVersion,
          purpose: world.childAuthorization!.purpose,
          authorizationSourceRef: world.childAuthorization!.authorizationSourceRef,
          authorizationSourceVersion: world.childAuthorization!.authorizationSourceVersion,
          guardianRole: {
            roleAssignmentId: world.guardianRole.id,
            participantId: world.guardianRole.participantId,
            aggregateVersion: world.guardianRole.aggregateVersion,
            status: world.guardianRole.status,
            role: world.guardianRole.role,
            startsAt: null,
            endsAt: null,
          },
          participant: {
            participantId: world.guardian.id,
            aggregateVersion: world.guardian.aggregateVersion,
            status: world.guardian.status,
          },
        },
        familyAuthorization: {
          authorizationId: world.familyAuthorization!.id,
          aggregateVersion: world.familyAuthorization!.aggregateVersion,
          expiresAt: FUTURE.toISOString(),
          ownerRef: world.familyAuthorization!.ownerRef,
          ownerVersion: world.familyAuthorization!.ownerVersion,
          purpose: world.familyAuthorization!.purpose,
          authorizationSourceRef: world.familyAuthorization!.authorizationSourceRef,
          authorizationSourceVersion: world.familyAuthorization!.authorizationSourceVersion,
          guardianRole: {
            roleAssignmentId: world.guardianRole.id,
            participantId: world.guardianRole.participantId,
            aggregateVersion: world.guardianRole.aggregateVersion,
            status: world.guardianRole.status,
            role: world.guardianRole.role,
            startsAt: null,
            endsAt: null,
          },
          participant: {
            participantId: world.guardian.id,
            aggregateVersion: world.guardian.aggregateVersion,
            status: world.guardian.status,
          },
        },
        canonicalOwnerEvidenceExpiresAt: "2099-01-01T00:00:00.000Z",
      },
    });
    expect(seenChildRef).toBe(`nurture_child_binding_anchor_v1:${world.childAnchor.id}`);
    expect(seenFamilyRef).toBe(`nurture_family_binding_anchor_v1:${world.familyAnchor.id}`);
  });

  it("denies when no association chain exists at all", async () => {
    const world = await seedBinding();
    const result = await resolveFamilyGrowthTargetV1(
      {
        binding: new PrismaFamilyGrowthBindingReadPort(prisma),
        canonicalExchange: exchangeOk,
      },
      {
        workspaceId: world.workspaceId,
        childCareProcessId: randomUUID(),
        localFamilyId: world.family.id,
      },
      NOW,
    );
    expect(result).toEqual({ status: "denied", reason: "binding_missing" });
  });

  it("treats a revoked historical family association as no current binding", async () => {
    const world = await seedBinding({ familyAssociation: "revoked" });
    expect(await resolve(world)).toEqual({
      status: "denied",
      reason: "binding_missing",
    });
  });

  it("denies quarantined and retired anchors", async () => {
    const quarantined = await seedBinding({ childAnchorStatus: "quarantined" });
    expect(await resolve(quarantined)).toEqual({
      status: "denied",
      reason: "child_anchor_not_associated",
    });
    const revokedFamily = await seedBinding({ familyAnchorStatus: "revoked" });
    expect(await resolve(revokedFamily)).toEqual({
      status: "denied",
      reason: "family_anchor_not_associated",
    });
  });

  it("denies missing, expired and revoked authorizations", async () => {
    const missing = await seedBinding({ childAuthorization: "missing" });
    expect(await resolve(missing)).toEqual({
      status: "denied",
      reason: "authorization_missing",
    });
    const expired = await seedBinding({ childAuthorization: "expired" });
    expect(await resolve(expired)).toEqual({
      status: "denied",
      reason: "authorization_expired",
    });
    const revoked = await seedBinding({ familyAuthorization: "revoked" });
    expect(await resolve(revoked)).toEqual({
      status: "denied",
      reason: "authorization_revoked",
    });
  });

  it("denies a target family that does not match the bound family", async () => {
    const world = await seedBinding();
    expect(await resolve(world, exchangeOk, { localFamilyId: randomUUID() })).toEqual({
      status: "denied",
      reason: "target_mismatch",
    });
  });

  it("fails closed when the owner exchange is unavailable", async () => {
    const world = await seedBinding();
    expect(
      await resolve(world, { exchange: async () => ({ status: "unavailable" }) }),
    ).toEqual({ status: "denied", reason: "canonical_exchange_unavailable" });
  });
});
