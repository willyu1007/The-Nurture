import { randomBytes, randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import {
  NurtureScenarioBindingOwnerVerifier,
  parseNurtureBindingOwnerRef,
} from "@the-nurture/scenario";
import { HmacNurtureBindingEvidenceHasher } from "../src/binding-evidence-hasher.js";
import { createPrismaClient } from "../src/client.js";
import { PrismaNurtureScenarioBindingAuthorizationRepository } from "../src/repositories/scenario-binding-owner.repository.js";

const prisma = createPrismaClient();

afterAll(async () => {
  await prisma.$disconnect();
});

describe("Wave 4 binding persistence", () => {
  it("issues and exact-replays one real body-free authorization row", async () => {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 5 * 60_000);
    const authorizationSourceRef = `nurture-binding-intent:${randomUUID()}`;
    const repository =
      new PrismaNurtureScenarioBindingAuthorizationRepository(prisma);
    const verifier = new NurtureScenarioBindingOwnerVerifier(
      {
        verifyCurrent: async () => ({
          authorizationSourceRef,
          authorizationSourceVersion: 1,
          verifiedAt: now,
          expiresAt,
        }),
      },
      repository,
      new HmacNurtureBindingEvidenceHasher("k".repeat(32)),
      () => now,
    );
    const reserved = await verifier.reserveAnchor("child", randomUUID());
    const ownerRef = parseNurtureBindingOwnerRef(reserved.ownerRef);
    const request = {
      workspaceId: randomUUID(),
      actingUserId: `platform-user:${randomUUID()}`,
      idempotencyKey: randomUUID(),
      subjectType: "child" as const,
      subjectId: `platform-child:${randomUUID()}`,
      scenarioKey: "nurture" as const,
      ownerRef: reserved.ownerRef,
      ownerVersion: reserved.ownerVersion,
      actingActorId: `platform-actor:${randomUUID()}`,
      purpose: "scenario_binding_write" as const,
    };

    const first = await verifier.verify(request);
    const replay = await verifier.verify(request);
    const rows = await prisma.nurtureScenarioBindingAuthorization.findMany({
      where: { childAnchorId: ownerRef.anchorId },
    });

    expect(replay).toEqual(first);
    expect(rows).toHaveLength(1);
    const persisted = JSON.stringify(rows[0]);
    expect(persisted).not.toContain(request.subjectId);
    expect(persisted).not.toContain(request.actingUserId);
    expect(persisted).not.toContain(request.actingActorId);

    const family = await verifier.reserveAnchor("family", randomUUID());
    expect(family.ownerRef).toMatch(
      /^nurture_family_binding_anchor_v1:[0-9a-f-]{36}$/,
    );
  });

  it("blocks new plaintext birth dates but permits unrelated updates", async () => {
    const workspaceId = randomUUID();

    await expect(
      prisma.nurtureChild.create({
        data: {
          workspaceId,
          displayName: "Rejected child",
          birthDate: new Date("2024-01-01T00:00:00.000Z"),
          status: "active",
        },
      }),
    ).rejects.toThrow();

    const child = await prisma.nurtureChild.create({
      data: {
        workspaceId,
        displayName: "Local care label",
        status: "active",
      },
    });
    const updated = await prisma.nurtureChild.update({
      where: { id: child.id },
      data: { displayName: "Updated local care label" },
    });

    expect(updated.displayName).toBe("Updated local care label");
    expect(updated.birthDate).toBeNull();
  });

  it("rejects a family association that crosses the child/process scope", async () => {
    const workspaceId = randomUUID();
    const childA = await prisma.nurtureChild.create({
      data: { workspaceId, displayName: "Child A", status: "active" },
    });
    const childB = await prisma.nurtureChild.create({
      data: { workspaceId, displayName: "Child B", status: "active" },
    });
    const processB = await prisma.nurtureChildCareProcess.create({
      data: { workspaceId, childId: childB.id, status: "active" },
    });
    const processA = await prisma.nurtureChildCareProcess.create({
      data: { workspaceId, childId: childA.id, status: "active" },
    });
    const familyB = await prisma.nurtureFamily.create({
      data: {
        workspaceId,
        childCareProcessId: processB.id,
        status: "active",
      },
    });
    const familyA = await prisma.nurtureFamily.create({
      data: {
        workspaceId,
        childCareProcessId: processA.id,
        status: "active",
      },
    });
    const childAnchor = await prisma.nurtureChildBindingAnchor.create({
      data: {
        reservationKeyHash: randomBytes(32).toString("hex"),
        status: "associated",
      },
    });
    const familyAnchor = await prisma.nurtureFamilyBindingAnchor.create({
      data: {
        reservationKeyHash: randomBytes(32).toString("hex"),
        status: "associated",
      },
    });
    const childAssociation =
      await prisma.nurtureChildAnchorAssociation.create({
        data: {
          workspaceId,
          childAnchorId: childAnchor.id,
          childId: childA.id,
        },
      });

    await expect(
      prisma.nurtureFamilyAnchorAssociation.create({
        data: {
          workspaceId,
          familyAnchorId: familyAnchor.id,
          childAnchorId: childAnchor.id,
          childAssociationId: childAssociation.id,
          currentChildAssociationId: childAssociation.id,
          childId: childA.id,
          childCareProcessId: processB.id,
          familyId: familyB.id,
        },
      }),
    ).rejects.toThrow();

    const familyAssociation =
      await prisma.nurtureFamilyAnchorAssociation.create({
        data: {
          workspaceId,
          familyAnchorId: familyAnchor.id,
          childAnchorId: childAnchor.id,
          childAssociationId: childAssociation.id,
          currentChildAssociationId: childAssociation.id,
          childId: childA.id,
          childCareProcessId: processA.id,
          familyId: familyA.id,
        },
      });

    await expect(
      prisma.nurtureChildAnchorAssociation.update({
        where: { id: childAssociation.id },
        data: {
          status: "revoked",
          currentKey: null,
          revokedAt: new Date(),
        },
      }),
    ).rejects.toThrow();

    const revokedAt = new Date();
    await prisma.nurtureFamilyAnchorAssociation.update({
      where: { id: familyAssociation.id },
      data: {
        status: "revoked",
        currentKey: null,
        currentChildAssociationId: null,
        revokedAt,
      },
    });
    await prisma.nurtureChildAnchorAssociation.update({
      where: { id: childAssociation.id },
      data: {
        status: "revoked",
        currentKey: null,
        revokedAt,
      },
    });

    const replacementChildAssociation =
      await prisma.nurtureChildAnchorAssociation.create({
        data: {
          workspaceId,
          childAnchorId: childAnchor.id,
          childId: childA.id,
        },
      });
    const replacementFamilyAssociation =
      await prisma.nurtureFamilyAnchorAssociation.create({
        data: {
          workspaceId,
          familyAnchorId: familyAnchor.id,
          childAnchorId: childAnchor.id,
          childAssociationId: replacementChildAssociation.id,
          currentChildAssociationId: replacementChildAssociation.id,
          childId: childA.id,
          childCareProcessId: processA.id,
          familyId: familyA.id,
        },
      });

    expect(replacementFamilyAssociation.status).toBe("active");
  });
});
