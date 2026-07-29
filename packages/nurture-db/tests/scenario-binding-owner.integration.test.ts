import { randomBytes, randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { afterAll, describe, expect, it } from "vitest";
import {
  NurtureScenarioBindingError,
  NurtureScenarioBindingOwnerVerifier,
  parseNurtureBindingOwnerRef,
} from "@the-nurture/scenario";
import { HmacNurtureBindingEvidenceHasher } from "../src/binding-evidence-hasher.js";
import { createPrismaClient } from "../src/client.js";
import {
  PrismaNurtureScenarioBindingAuthorizationRepository,
  type TransactionalNurtureBindingAuthorityReader,
} from "../src/repositories/scenario-binding-owner.repository.js";

const prisma = createPrismaClient();

afterAll(async () => {
  await prisma.$disconnect();
});

describe("Wave 4 binding persistence", () => {
  it("issues and exact-replays one real body-free authorization row", async () => {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 5 * 60_000);
    const authorizationSourceRef = `nurture-binding-intent:${randomUUID()}`;
    const repository = new PrismaNurtureScenarioBindingAuthorizationRepository(
      prisma,
      {
        verifyCurrent: async () => ({
          authorizationSourceRef,
          authorizationSourceVersion: 1,
          verifiedAt: now,
          expiresAt,
        }),
      },
    );
    const verifier = new NurtureScenarioBindingOwnerVerifier(
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

  it("locks the exact authority source until receipt issuance commits", async () => {
    const now = new Date();
    const workspaceId = randomUUID();
    const participant = await prisma.nurtureParticipant.create({
      data: {
        workspaceId,
        myChatUserId: `platform-user:${randomUUID()}`,
        status: "active",
      },
    });
    const role = await prisma.nurtureCareRoleAssignment.create({
      data: {
        workspaceId,
        participantId: participant.id,
        role: "guardian",
        scopeType: "family",
        scopeId: randomUUID(),
        status: "active",
        aggregateVersion: 1,
      },
    });
    const authorityLocked = deferred();
    const releaseAuthority = deferred();
    let pauseFirstRead = true;
    const authorityReader: TransactionalNurtureBindingAuthorityReader = {
      verifyCurrent: async (transaction, input) => {
        const rows = await transaction.$queryRaw<
          {
            id: string;
            workspaceId: string;
            status: string;
            aggregateVersion: number;
          }[]
        >(
          Prisma.sql`
            SELECT
              "id",
              "workspace_id" AS "workspaceId",
              "status",
              "aggregate_version" AS "aggregateVersion"
            FROM "nurture_care_role_assignment"
            WHERE "id" = ${role.id}
            FOR UPDATE
          `,
        );
        const current = rows[0];
        if (
          !current ||
          current.workspaceId !== input.workspaceId ||
          current.status !== "active"
        ) {
          throw new NurtureScenarioBindingError(
            "owner_authorization_denied",
            "The exact Nurture care role is not current.",
          );
        }
        if (pauseFirstRead) {
          pauseFirstRead = false;
          authorityLocked.resolve();
          await releaseAuthority.promise;
        }
        return {
          authorizationSourceRef: `nurture-care-role:${current.id}`,
          authorizationSourceVersion: current.aggregateVersion,
          verifiedAt: now,
          expiresAt: new Date(now.getTime() + 5 * 60_000),
        };
      },
    };
    const repository = new PrismaNurtureScenarioBindingAuthorizationRepository(
      prisma,
      authorityReader,
    );
    const verifier = new NurtureScenarioBindingOwnerVerifier(
      repository,
      new HmacNurtureBindingEvidenceHasher("k".repeat(32)),
      () => now,
    );
    const reserved = await verifier.reserveAnchor("child", randomUUID());
    const ownerRef = parseNurtureBindingOwnerRef(reserved.ownerRef);
    const request = {
      workspaceId,
      actingUserId: participant.myChatUserId,
      idempotencyKey: randomUUID(),
      subjectType: "child" as const,
      subjectId: `platform-child:${randomUUID()}`,
      scenarioKey: "nurture" as const,
      ownerRef: reserved.ownerRef,
      ownerVersion: reserved.ownerVersion,
      actingActorId: `platform-actor:${randomUUID()}`,
      purpose: "scenario_binding_write" as const,
    };

    const issuance = verifier.verify(request);
    await authorityLocked.promise;
    try {
      await expect(
        prisma.$transaction(async (transaction) => {
          await transaction.$executeRaw(
            Prisma.sql`SET LOCAL lock_timeout = '100ms'`,
          );
          await transaction.nurtureCareRoleAssignment.update({
            where: { id: role.id },
            data: {
              status: "revoked",
              aggregateVersion: { increment: 1 },
            },
          });
        }),
      ).rejects.toThrow();
      await expect(
        prisma.nurtureCareRoleAssignment.findUniqueOrThrow({
          where: { id: role.id },
        }),
      ).resolves.toMatchObject({ status: "active", aggregateVersion: 1 });
    } finally {
      releaseAuthority.resolve();
    }
    await expect(issuance).resolves.toMatchObject({
      ownerRef: reserved.ownerRef,
      ownerVersion: reserved.ownerVersion,
    });
    await prisma.nurtureCareRoleAssignment.update({
      where: { id: role.id },
      data: {
        status: "revoked",
        aggregateVersion: { increment: 1 },
      },
    });
    await expect(
      verifier.verify({ ...request, idempotencyKey: randomUUID() }),
    ).rejects.toMatchObject({ code: "owner_authorization_denied" });
    await expect(
      prisma.nurtureScenarioBindingAuthorization.count({
        where: { childAnchorId: ownerRef.anchorId },
      }),
    ).resolves.toBe(1);
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

function deferred(): {
  promise: Promise<void>;
  resolve: () => void;
} {
  let resolve: (() => void) | undefined;
  const promise = new Promise<void>((accept) => {
    resolve = accept;
  });
  return {
    promise,
    resolve: () => {
      if (!resolve) {
        throw new Error("Deferred promise is not initialized.");
      }
      resolve();
    },
  };
}
