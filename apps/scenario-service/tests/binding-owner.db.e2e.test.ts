import type { AddressInfo } from "node:net";
import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { createNurtureBindingOwnerHttpSource } from "@my-chat/scenario-integrations";
import {
  createGuardianRoleAuthorityReader,
  createPrismaClient,
  createScenarioBindingOwnerAuthorizer,
  HmacNurtureBindingEvidenceHasher,
  PrismaNurtureScenarioBindingAuthorizationRepository,
  type NurturePrismaClient,
} from "@the-nurture/db/binding-owner";
import {
  NurtureScenarioBindingOwnerVerifier,
  parseNurtureBindingOwnerRef,
  ScenarioBindingAuthorizeInput,
  type ScenarioBindingOwnerAuthorizer,
} from "@the-nurture/scenario/binding-owner";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createScenarioServiceApplication } from "../src/application.js";
import { createBindingOwnerRuntime } from "../src/binding-owner-runtime.js";
import { createBindingOwnerServiceAuth } from "../src/binding-owner-service-auth.js";

const TOKEN = "m3-postgres-service-token";
const EVIDENCE_KEY = "m3-postgres-evidence-key-material";
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required for the M3 PostgreSQL suite.");
}

const adminPrisma = createPrismaClient(databaseUrl);
const serviceAuth = createBindingOwnerServiceAuth(TOKEN);
const runtime = createBindingOwnerRuntime({
  env: {
    DATABASE_URL: databaseUrl,
    NURTURE_BINDING_EVIDENCE_KEY: EVIDENCE_KEY,
  },
  serviceAuth,
});

let baseUrl = "";
let closeService: (() => Promise<void>) | undefined;

beforeAll(async () => {
  const { app } = await createScenarioServiceApplication({
    bindingOwnerRuntime: runtime,
    bindingOwnerServiceAuth: serviceAuth,
    logSink: () => undefined,
  });
  await app.listen(0, "127.0.0.1");
  const address = app.getHttpServer().address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${address.port}`;
  closeService = () => app.close();
});

afterAll(async () => {
  await closeService?.();
  await adminPrisma.$disconnect();
});

describe("M3 Nest binding-owner PostgreSQL journey", () => {
  it("authorizes child/family, exact-replays, recovers response loss, and rejects divergent replay", async () => {
    const workspaceId = `ws-${randomUUID()}`;
    const { participant } = await seedGuardian(adminPrisma, workspaceId);
    const source = ownerSource(baseUrl);

    const childRequest = request(
      workspaceId,
      participant.myChatUserId,
      "child",
    );
    const child = await requireAuthorized(source.resolve(childRequest));
    expect(child.receipt.ownerRef).toMatch(
      /^nurture_child_binding_anchor_v1:[0-9a-f-]{36}$/,
    );
    await expect(source.resolve(childRequest)).resolves.toEqual(child);

    const familyRequest = request(
      workspaceId,
      participant.myChatUserId,
      "family",
    );
    const family = await requireAuthorized(source.resolve(familyRequest));
    expect(family.receipt.ownerRef).toMatch(
      /^nurture_family_binding_anchor_v1:[0-9a-f-]{36}$/,
    );
    expect(family.receipt.ownerRef).not.toBe(child.receipt.ownerRef);

    let loseFirstResponse = true;
    const lossySource = createNurtureBindingOwnerHttpSource({
      baseUrl,
      serviceToken: TOKEN,
      fetch: async (url, init) => {
        const response = await fetch(url, init);
        if (loseFirstResponse) {
          loseFirstResponse = false;
          await response.clone().arrayBuffer();
          throw new Error("simulated response loss after owner commit");
        }
        return response;
      },
    });
    const lossRequest = request(
      workspaceId,
      participant.myChatUserId,
      "child",
    );
    await expect(lossySource.resolve(lossRequest)).resolves.toEqual({
      status: "unavailable",
      reason_code: "owner_read_failed",
    });
    const recovered = await requireAuthorized(source.resolve(lossRequest));
    await expect(source.resolve(lossRequest)).resolves.toEqual(recovered);

    await expect(
      source.resolve({ ...lossRequest, subjectId: `child-${randomUUID()}` }),
    ).resolves.toEqual({
      status: "denied",
      reason_code: "authorization_replay_conflict",
    });

    const persistedAuthorizations =
      await adminPrisma.nurtureScenarioBindingAuthorization.findMany({
        where: { workspaceId },
      });
    const persistedJson = JSON.stringify(persistedAuthorizations);
    for (const rawIdentity of [
      childRequest.actingUserId,
      childRequest.actingActorId,
      childRequest.subjectId,
      familyRequest.actingUserId,
      familyRequest.actingActorId,
      familyRequest.subjectId,
      lossRequest.actingUserId,
      lossRequest.actingActorId,
      lossRequest.subjectId,
    ]) {
      expect(persistedJson).not.toContain(rawIdentity);
    }
  });

  it("fails closed for unknown, soft-deleted, ended, future, revoked, and inactive authority", async () => {
    const source = ownerSource(baseUrl);
    const unknownWorkspace = `ws-${randomUUID()}`;
    const childAnchorsBeforeUnknown =
      await adminPrisma.nurtureChildBindingAnchor.count();
    await expect(
      source.resolve(request(unknownWorkspace, `user-${randomUUID()}`, "child")),
    ).resolves.toEqual({
      status: "denied",
      reason_code: "owner_authorization_denied",
    });
    await expect(
      adminPrisma.nurtureChildBindingAnchor.count(),
    ).resolves.toBe(childAnchorsBeforeUnknown);

    const softDeletedWorkspace = `ws-${randomUUID()}`;
    const softDeleted = await seedGuardian(adminPrisma, softDeletedWorkspace);
    await adminPrisma.nurtureParticipant.update({
      where: { id: softDeleted.participant.id },
      data: { deletedAt: new Date() },
    });
    await expect(
      source.resolve(
        request(
          softDeletedWorkspace,
          softDeleted.participant.myChatUserId,
          "child",
        ),
      ),
    ).resolves.toEqual({
      status: "denied",
      reason_code: "owner_authorization_denied",
    });

    const endedWorkspace = `ws-${randomUUID()}`;
    const ended = await seedGuardian(adminPrisma, endedWorkspace, {
      endsAt: new Date(Date.now() - 60_000),
    });
    await expect(
      source.resolve(
        request(endedWorkspace, ended.participant.myChatUserId, "child"),
      ),
    ).resolves.toEqual({
      status: "denied",
      reason_code: "owner_authorization_denied",
    });

    const futureWorkspace = `ws-${randomUUID()}`;
    const futureStartsAt = new Date(Date.now() + 60_000);
    const future = await seedGuardian(adminPrisma, futureWorkspace, {
      startsAt: futureStartsAt,
    });
    expect(future.role.startsAt).toEqual(futureStartsAt);
    await expect(
      adminPrisma.$transaction(async (transaction) => {
        await transaction.$executeRaw(
          Prisma.sql`SET LOCAL TIME ZONE 'Asia/Shanghai'`,
        );
        return createGuardianRoleAuthorityReader(
          () => new Date(futureStartsAt.getTime() - 60_000),
        ).verifyCurrent(transaction, {
          workspaceId: futureWorkspace,
          actingUserId: future.participant.myChatUserId,
          actingActorId: `actor-${randomUUID()}`,
          subjectType: "child",
          ownerRef: `nurture_child_binding_anchor_v1:${randomUUID()}`,
          ownerVersion: 1,
          purpose: "scenario_binding_write",
          anchorId: randomUUID(),
        });
      }),
    ).rejects.toMatchObject({ code: "owner_authorization_denied" });
    await expect(
      source.resolve(
        request(futureWorkspace, future.participant.myChatUserId, "child"),
      ),
    ).resolves.toEqual({
      status: "denied",
      reason_code: "owner_authorization_denied",
    });

    const activeWorkspace = `ws-${randomUUID()}`;
    const active = await seedGuardian(adminPrisma, activeWorkspace);
    const activeRequest = request(
      activeWorkspace,
      active.participant.myChatUserId,
      "child",
    );
    const authorized = await requireAuthorized(source.resolve(activeRequest));
    const authorizationId = authorized.receipt.authorizationRef.split(":")[1];
    if (!authorizationId) throw new Error("authorization id missing");
    await adminPrisma.nurtureScenarioBindingAuthorization.update({
      where: { id: authorizationId },
      data: {
        status: "revoked",
        revokedAt: new Date(),
        aggregateVersion: { increment: 1 },
      },
    });
    await expect(source.resolve(activeRequest)).resolves.toEqual({
      status: "denied",
      reason_code: "authorization_receipt_inactive",
    });

    await adminPrisma.nurtureCareRoleAssignment.update({
      where: { id: active.role.id },
      data: { status: "revoked", aggregateVersion: { increment: 1 } },
    });
    await expect(
      source.resolve({ ...activeRequest, idempotencyKey: randomUUID() }),
    ).resolves.toEqual({
      status: "denied",
      reason_code: "owner_authorization_denied",
    });
  });

  it("holds participant and exact authority locks until the HTTP receipt commits", async () => {
    const workspaceId = `ws-${randomUUID()}`;
    const { participant, role } = await seedGuardian(adminPrisma, workspaceId);
    const authorityLocked = deferred();
    const releaseAuthority = deferred();
    let pauseFirstRead = true;
    const authorizer = createScenarioBindingOwnerAuthorizer({
      nurturePrisma: adminPrisma,
      evidenceKey: EVIDENCE_KEY,
      authorityReaderFactory: (now) => {
        const authorityReader = createGuardianRoleAuthorityReader(now);
        return {
          verifyCurrent: async (transaction, input) => {
            const evidence = await authorityReader.verifyCurrent(
              transaction,
              input,
            );
            if (pauseFirstRead) {
              pauseFirstRead = false;
              authorityLocked.resolve();
              await releaseAuthority.promise;
            }
            return evidence;
          },
        };
      },
    });
    const isolated = await startInjectedService(authorizer);
    try {
      const source = ownerSource(isolated.baseUrl);
      const issuance = source.resolve(
        request(workspaceId, participant.myChatUserId, "child"),
      );

      await authorityLocked.promise;
      await expect(
        adminPrisma.$transaction(async (transaction) => {
          await transaction.$executeRaw(
            Prisma.sql`SET LOCAL lock_timeout = '100ms'`,
          );
          await transaction.nurtureParticipant.update({
            where: { id: participant.id },
            data: { status: "suspended" },
          });
        }),
      ).rejects.toThrow();
      await expect(
        adminPrisma.$transaction(async (transaction) => {
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

      releaseAuthority.resolve();
      await expect(issuance).resolves.toMatchObject({ status: "authorized" });
    } finally {
      releaseAuthority.resolve();
      await isolated.close();
    }
  });

  it("returns pinned-consumer denial for missing and stale production anchors", async () => {
    const workspaceId = `ws-${randomUUID()}`;
    const actingUserId = `user-${randomUUID()}`;
    const missingRequest = request(workspaceId, actingUserId, "child");
    const missing = await createPreparedAnchorAuthorizer("missing");
    await expectInjectedResolution(missing.authorizer, missingRequest, {
      status: "denied",
      reason_code: "anchor_not_found",
    });

    const staleRequest = request(workspaceId, actingUserId, "child");
    const stale = await createPreparedAnchorAuthorizer("stale");
    await expectInjectedResolution(stale.authorizer, staleRequest, {
      status: "denied",
      reason_code: "anchor_not_current",
    });
  });
});

function ownerSource(targetBaseUrl: string) {
  return createNurtureBindingOwnerHttpSource({
    baseUrl: targetBaseUrl,
    serviceToken: TOKEN,
  });
}

async function startInjectedService(authorizer: ScenarioBindingOwnerAuthorizer) {
  const { app } = await createScenarioServiceApplication({
    bindingOwnerAuthorizer: authorizer,
    bindingOwnerServiceAuth: serviceAuth,
    logSink: () => undefined,
  });
  await app.listen(0, "127.0.0.1");
  const address = app.getHttpServer().address() as AddressInfo;
  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    close: () => app.close(),
  };
}

async function createPreparedAnchorAuthorizer(
  state: "missing" | "stale",
): Promise<{ authorizer: ScenarioBindingOwnerAuthorizer }> {
  const verifier = new NurtureScenarioBindingOwnerVerifier(
    new PrismaNurtureScenarioBindingAuthorizationRepository(adminPrisma),
    new HmacNurtureBindingEvidenceHasher(EVIDENCE_KEY),
  );
  const reserved = await verifier.reserveAnchor("child", randomUUID());
  const { anchorId } = parseNurtureBindingOwnerRef(reserved.ownerRef);
  if (state === "missing") {
    await adminPrisma.nurtureChildBindingAnchor.delete({
      where: { id: anchorId },
    });
  } else {
    await adminPrisma.nurtureChildBindingAnchor.update({
      where: { id: anchorId },
      data: { aggregateVersion: { increment: 1 } },
    });
  }
  return {
    authorizer: {
      authorize: (input) =>
        verifier.verify({
          ...input,
          ownerRef: reserved.ownerRef,
          ownerVersion: reserved.ownerVersion,
        }),
    },
  };
}

async function expectInjectedResolution(
  authorizer: ScenarioBindingOwnerAuthorizer,
  input: ScenarioBindingAuthorizeInput,
  expected: { status: "denied"; reason_code: string },
): Promise<void> {
  const service = await startInjectedService(authorizer);
  try {
    await expect(ownerSource(service.baseUrl).resolve(input)).resolves.toEqual(
      expected,
    );
  } finally {
    await service.close();
  }
}

async function seedGuardian(
  prisma: NurturePrismaClient,
  workspaceId: string,
  time?: { startsAt?: Date; endsAt?: Date },
) {
  const participant = await prisma.nurtureParticipant.create({
    data: {
      workspaceId,
      myChatUserId: `user-${randomUUID()}`,
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
      startsAt: time?.startsAt,
      endsAt: time?.endsAt,
    },
  });
  return { participant, role };
}

function request(
  workspaceId: string,
  actingUserId: string,
  subjectType: "child" | "family",
): ScenarioBindingAuthorizeInput {
  return {
    workspaceId,
    actingUserId,
    idempotencyKey: randomUUID(),
    subjectType,
    subjectId: `${subjectType}-${randomUUID()}`,
    scenarioKey: "nurture",
    actingActorId: `actor-${randomUUID()}`,
    purpose: "scenario_binding_write",
  };
}

async function requireAuthorized(
  pending: ReturnType<
    ReturnType<typeof createNurtureBindingOwnerHttpSource>["resolve"]
  >,
) {
  const resolution = await pending;
  if (resolution.status !== "authorized") {
    throw new Error(`Expected authorized: ${JSON.stringify(resolution)}`);
  }
  return resolution;
}

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
