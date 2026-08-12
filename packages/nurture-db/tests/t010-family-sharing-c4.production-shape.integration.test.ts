import { createHash, randomUUID } from "node:crypto";
import type { Prisma, PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import {
  NURTURE_FAMILY_SHARING_AUTHORITY_READ_AUDIENCE,
  NURTURE_FAMILY_SHARING_AUTHORITY_READ_OPERATION,
  NURTURE_FAMILY_SHARING_CLEANUP_CONTRACT,
  NURTURE_FAMILY_SHARING_ELIGIBILITY_PURPOSE,
  NurtureFamilySharingCleanupOwner,
  nurtureSha256Base64Url,
  type NurtureFamilySharingCleanupPrivateInputV1,
  type NurtureFamilySharingCleanupScopeV1,
  type NurtureFamilySharingCurrentAuthorityReadInputV1,
} from "@the-nurture/scenario";
import { createPrismaClient } from "../src/client.js";
import { PrismaNurtureScenarioNonceStore } from "../src/c30/nonce-store.js";
import { PrismaNurtureFamilySharingCleanupLedger } from "../src/repositories/family-sharing-cleanup-ledger.repository.js";
import { PrismaNurtureFamilySharingCurrentAuthorityRepository } from "../src/repositories/family-sharing-current-authority.repository.js";
import { PrismaNurtureFamilySharingExactLocalPairResolver } from "../src/repositories/family-sharing-exact-local-pair.repository.js";

const TARGET_ENV = "NURTURE_T010_C4_DATABASE_URL";
const APPROVAL_ENV = "NURTURE_T010_C4_DISPOSABLE_APPROVED";
const APPROVAL_VALUE = "I_APPROVE_T010_C4_DISPOSABLE_WRITES";
const EVALUATED_AT = "2026-08-12T08:00:00.000Z";
const target = readQualificationTarget(process.env);
const prisma = target ? createPrismaClient(target.url) : undefined;

type QualificationFixture = Readonly<{
  workspaceId: string;
  participantId: string;
  roleAssignmentId: string;
  childAnchorId: string;
  familyAnchorId: string;
  childAssociationId: string;
  familyAssociationId: string;
  childId: string;
  processId: string;
  familyId: string;
  institutionId: string;
  careGroupId: string;
  enrollmentId: string;
  pairOperationId: string;
}>;

let fixture: QualificationFixture | undefined;
const nonceBodyHashes = new Set<string>();

describe("T-010 I4-C4 qualification vehicle safety", () => {
  it("never falls back to DATABASE_URL", () => {
    expect(readQualificationTarget({ DATABASE_URL: "postgresql://host/unknown" })).toBeNull();
  });

  it("rejects an unapproved or generically named database before connection", () => {
    expect(() => readQualificationTarget({
      [TARGET_ENV]: "postgresql://localhost/the_nurture",
      [APPROVAL_ENV]: APPROVAL_VALUE,
    })).toThrow("dedicated t010_i4c4 test/disposable database");
    expect(() => readQualificationTarget({
      [TARGET_ENV]: "postgresql://localhost/t010_i4c4_disposable_local",
    })).toThrow(APPROVAL_ENV);
  });

  it("accepts only an explicit approved disposable target", () => {
    expect(readQualificationTarget({
      [TARGET_ENV]: "postgresql://localhost/t010_i4c4_disposable_local?schema=public",
      [APPROVAL_ENV]: APPROVAL_VALUE,
    })).toEqual({
      databaseName: "t010_i4c4_disposable_local",
      url: "postgresql://localhost/t010_i4c4_disposable_local?schema=public",
    });
  });

  it("does not invoke purge when the DB-exclusive lock is unavailable", async () => {
    const operation = vi.fn(async () => ({ status: "unavailable" as const }));
    const transaction = {
      $queryRaw: vi.fn(async () => [{ acquired: false }]),
    };
    const database = {
      $transaction: vi.fn(async (run: (value: typeof transaction) => Promise<unknown>) =>
        run(transaction)),
    };
    const ledger = new PrismaNurtureFamilySharingCleanupLedger(
      database as unknown as PrismaClient,
    );
    await expect(ledger.executeExclusive({
      workspace_id: "workspace-1",
      cleanup_command_ref: "cleanup-1",
      request_fingerprint: "a".repeat(64),
      child_care_process_ref: "process-1",
      invocation_request_ref: "invocation-1",
      service_ref: "service-1",
      operation,
    })).resolves.toEqual({ status: "unavailable" });
    expect(operation).not.toHaveBeenCalled();
  });

  it("does not invoke purge when an existing key has another fingerprint", async () => {
    const operation = vi.fn(async () => ({ status: "unavailable" as const }));
    const stored = storedCleanupReceipt("b".repeat(64));
    const transaction = {
      $queryRaw: vi.fn(async () => [{ acquired: true }]),
      nurtureCommandExecution: {
        findUnique: vi.fn(async () => ({
          commandKey: "cleanup_family_sharing_withdrawal",
          commandScope: "family_sharing_cleanup",
          commandContractVersion: 1,
          payloadHash: stored.request_fingerprint,
          resultSchemaVersion: 1,
          committedResultPayload: stored,
        })),
      },
    };
    const database = {
      $transaction: vi.fn(async (run: (value: typeof transaction) => Promise<unknown>) =>
        run(transaction)),
    };
    const ledger = new PrismaNurtureFamilySharingCleanupLedger(
      database as unknown as PrismaClient,
    );
    await expect(ledger.executeExclusive({
      workspace_id: "workspace-1",
      cleanup_command_ref: stored.cleanup_command_ref,
      request_fingerprint: "a".repeat(64),
      child_care_process_ref: "process-1",
      invocation_request_ref: "invocation-1",
      service_ref: "service-1",
      operation,
    })).resolves.toEqual({ status: "conflict" });
    expect(operation).not.toHaveBeenCalled();
  });

  it("does not write a receipt when the locked purge callback fails closed", async () => {
    const create = vi.fn();
    const transaction = {
      $queryRaw: vi.fn(async () => [{ acquired: true }]),
      nurtureCommandExecution: {
        findUnique: vi.fn(async () => null),
        create,
      },
    };
    const database = {
      $transaction: vi.fn(async (run: (value: typeof transaction) => Promise<unknown>) =>
        run(transaction)),
    };
    const ledger = new PrismaNurtureFamilySharingCleanupLedger(
      database as unknown as PrismaClient,
    );
    await expect(ledger.executeExclusive({
      workspace_id: "workspace-1",
      cleanup_command_ref: "cleanup-1",
      request_fingerprint: "a".repeat(64),
      child_care_process_ref: "process-1",
      invocation_request_ref: "invocation-1",
      service_ref: "service-1",
      operation: async () => ({ status: "unavailable" }),
    })).resolves.toEqual({ status: "unavailable" });
    expect(create).not.toHaveBeenCalled();
  });
});

if (target) describe("T-010 I4-C4 production-shape PostgreSQL qualification", () => {
  beforeAll(async () => {
    const database = requirePrisma();
    await assertMigratedProductionShape(database, target!.databaseName);
    fixture = await database.$transaction(
      (transaction) => seedQualificationFixture(transaction),
      { isolationLevel: "Serializable" },
    );
  });

  afterAll(async () => {
    if (!prisma) return;
    try {
      if (fixture) await removeQualificationFixture(prisma, fixture);
      if (nonceBodyHashes.size > 0) {
        await prisma.nurtureScenarioInvocationNonce.deleteMany({
          where: { bodySha256: { in: [...nonceBodyHashes] } },
        });
      }
    } finally {
      await prisma.$disconnect();
    }
  });

  it("executes the exact-pair resolver and coherent current-authority SQL", async () => {
    const database = requirePrisma();
    const exactInput = currentAuthorityInput(requireFixture());
    const resolver = new PrismaNurtureFamilySharingExactLocalPairResolver(database);
    await expect(resolver.resolveExact({
      workspace_id: exactInput.local_pair.workspace_id,
      pair_evidence: exactInput.pair_evidence,
      target: exactInput.target,
      evaluated_at: exactInput.evaluated_at,
    })).resolves.toEqual({
      status: "resolved",
      local_pair: exactInput.local_pair,
    });

    const repository = new PrismaNurtureFamilySharingCurrentAuthorityRepository(database);
    await expect(repository.loadCurrent(exactInput)).resolves.toMatchObject({
      status: "resolved",
      authority_version: expect.stringMatching(/^v1\.sha256:[a-f0-9]{64}$/u),
      categories: [
        { category_key: "daily_activity", direction: "nurture_to_family" },
        { category_key: "media", direction: "family_to_nurture" },
        { category_key: "focus_collaboration", direction: "family_to_nurture" },
      ],
    });
  });

  it("fails closed when a real PostgreSQL snapshot contains duplicate authority cardinality", async () => {
    const database = requirePrisma();
    const exactInput = currentAuthorityInput(requireFixture());
    const rollback = new Error("rollback qualification-only duplicate state");

    await expect(database.$transaction(async (transaction) => {
      await transaction.$executeRawUnsafe(
        'DROP INDEX "uq_nurture_family_sharing_authority_current"',
      );
      await transaction.nurtureFamilySharingAuthority.create({
        data: authorityRow(requireFixture(), "media", "family_to_nurture", "duplicate"),
      });
      const repository = new PrismaNurtureFamilySharingCurrentAuthorityRepository(
        transaction as unknown as Pick<PrismaClient, "$queryRaw">,
      );
      await expect(repository.loadCurrent(exactInput)).resolves.toEqual({
        status: "unavailable",
      });
      throw rollback;
    }, { timeout: 20_000 })).rejects.toBe(rollback);

    const indexes = await database.$queryRaw<Array<{ indexname: string }>>`
      SELECT indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND indexname = 'uq_nurture_family_sharing_authority_current'`;
    expect(indexes).toHaveLength(1);
  });

  it("persists one DB nonce under concurrent exact replay and stores hashes only", async () => {
    const database = requirePrisma();
    const bodySha256 = nurtureSha256Base64Url(Buffer.from(randomUUID(), "utf8"));
    nonceBodyHashes.add(bodySha256);
    const now = new Date(EVALUATED_AT);
    const input = {
      issuer: "my-chat.host",
      assertion_audience: "nurture.scenario",
      caller_subject: "my-chat-family-sharing-runtime",
      credential_subject: "my-chat-family-sharing-workload",
      nonce: randomUUID().replaceAll("-", "").padEnd(32, "n"),
      request_id: `t010-c4-request-${randomUUID()}`,
      body_sha256: bodySha256,
      expires_at: "2026-08-12T08:01:00.000Z",
    };
    const results = await Promise.all([
      new PrismaNurtureScenarioNonceStore(database).consumeOnce(input, now),
      new PrismaNurtureScenarioNonceStore(database).consumeOnce(input, now),
    ]);
    expect(results.sort()).toEqual([false, true]);
    const row = await database.nurtureScenarioInvocationNonce.findFirstOrThrow({
      where: { bodySha256 },
    });
    const serialized = JSON.stringify(row);
    expect(serialized).not.toContain(input.nonce);
    expect(serialized).not.toContain(input.request_id);
    expect(serialized).not.toContain(input.credential_subject);
  });

  it("recovers cleanup response loss by exact ledger replay without over-delete", async () => {
    const database = requirePrisma();
    const local = requireFixture();
    const scopes: NurtureFamilySharingCleanupScopeV1[] = [];
    const purge = vi.fn(async (scope: NurtureFamilySharingCleanupScopeV1) => {
      scopes.push(scope);
      return {
        store_ref: "t010-c4-derived-store",
        store_version: 1,
        disposition: "purged" as const,
      };
    });
    const owner = new NurtureFamilySharingCleanupOwner(
      new PrismaNurtureFamilySharingCleanupLedger(database),
      [{ store_ref: "t010-c4-derived-store", purge }],
      () => new Date(EVALUATED_AT),
    );
    const request = cleanupRequest(local, `t010-c4-cleanup-${randomUUID()}`);
    const protectedCountsBefore = await protectedPairCounts(database, local);

    // The first response is deliberately discarded to model response loss.
    await owner.cleanup({
      invocation_request_ref: `t010-c4-invocation-${randomUUID()}`,
      service_ref: "my-chat-family-sharing-runtime",
      request,
    });
    const replay = await owner.cleanup({
      invocation_request_ref: `t010-c4-invocation-${randomUUID()}`,
      service_ref: "my-chat-family-sharing-runtime",
      request,
    });

    expect(replay).toMatchObject({
      status: "cleaned",
      disposition: "replayed",
      cleanup_command_ref: request.wire.cleanup_command_ref,
      purged_store_count: 1,
    });
    expect(purge).toHaveBeenCalledOnce();
    expect(scopes).toEqual([{
      workspace_id: local.workspaceId,
      child_care_process_ref: local.processId,
      family_ref: local.familyId,
      enrollment_ref: local.enrollmentId,
      purpose: NURTURE_FAMILY_SHARING_ELIGIBILITY_PURPOSE,
      categories: ["media"],
    }]);
    expect(JSON.stringify(scopes)).not.toContain("anchor");
    expect(JSON.stringify(scopes)).not.toContain("association");
    expect(await protectedPairCounts(database, local)).toEqual(protectedCountsBefore);
    expect(await database.nurtureCommandExecution.count({
      where: {
        workspaceId: local.workspaceId,
        commandKey: "cleanup_family_sharing_withdrawal",
      },
    })).toBe(1);
  });

  it("writes no cleanup success receipt after a partial purge failure", async () => {
    const database = requirePrisma();
    const local = requireFixture();
    const commandRef = `t010-c4-partial-${randomUUID()}`;
    const firstPurge = vi.fn(async () => ({
      store_ref: "a-t010-c4-store",
      store_version: 1,
      disposition: "purged" as const,
    }));
    const owner = new NurtureFamilySharingCleanupOwner(
      new PrismaNurtureFamilySharingCleanupLedger(database),
      [
        { store_ref: "a-t010-c4-store", purge: firstPurge },
        {
          store_ref: "b-t010-c4-store",
          purge: async () => {
            throw new Error("qualification store outage");
          },
        },
      ],
      () => new Date(EVALUATED_AT),
    );
    const result = await owner.cleanup({
      invocation_request_ref: `t010-c4-invocation-${randomUUID()}`,
      service_ref: "my-chat-family-sharing-runtime",
      request: cleanupRequest(local, commandRef),
    });

    expect(result).toEqual({ status: "unavailable" });
    expect(firstPurge).toHaveBeenCalledOnce();
    await expect(new PrismaNurtureFamilySharingCleanupLedger(database).find({
      workspace_id: local.workspaceId,
      cleanup_command_ref: commandRef,
    })).resolves.toBeNull();
  });

  it("serializes same-key different-fingerprint cleanup before either scope can over-delete", async () => {
    const database = requirePrisma();
    const peer = createPrismaClient(target.url);
    const local = requireFixture();
    const commandRef = `t010-c4-concurrent-${randomUUID()}`;
    let releaseFirst!: () => void;
    let markStarted!: () => void;
    const firstMayFinish = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });
    const firstStarted = new Promise<void>((resolve) => {
      markStarted = resolve;
    });
    const firstPurge = vi.fn(async () => {
      markStarted();
      await firstMayFinish;
      return {
        store_ref: "t010-c4-concurrency-store",
        store_version: 1,
        disposition: "purged" as const,
      };
    });
    const secondPurge = vi.fn(async () => ({
      store_ref: "t010-c4-concurrency-store",
      store_version: 1,
      disposition: "purged" as const,
    }));
    const firstOwner = new NurtureFamilySharingCleanupOwner(
      new PrismaNurtureFamilySharingCleanupLedger(database),
      [{ store_ref: "t010-c4-concurrency-store", purge: firstPurge }],
      () => new Date(EVALUATED_AT),
    );
    const secondOwner = new NurtureFamilySharingCleanupOwner(
      new PrismaNurtureFamilySharingCleanupLedger(peer),
      [{ store_ref: "t010-c4-concurrency-store", purge: secondPurge }],
      () => new Date(EVALUATED_AT),
    );
    const firstRequest = cleanupRequest(local, commandRef);
    const secondRequest = {
      ...cleanupRequest(local, commandRef),
      wire: {
        ...cleanupRequest(local, commandRef).wire,
        categories: ["focus_collaboration"] as const,
      },
    };

    try {
      const firstResult = firstOwner.cleanup({
        invocation_request_ref: `t010-c4-invocation-${randomUUID()}`,
        service_ref: "my-chat-family-sharing-runtime",
        request: firstRequest,
      });
      await firstStarted;
      const lockLoser = await secondOwner.cleanup({
        invocation_request_ref: `t010-c4-invocation-${randomUUID()}`,
        service_ref: "my-chat-family-sharing-runtime",
        request: secondRequest,
      });
      expect(lockLoser).toEqual({ status: "unavailable" });
      expect(secondPurge).not.toHaveBeenCalled();
      releaseFirst();
      await expect(firstResult).resolves.toMatchObject({
        status: "cleaned",
        disposition: "executed",
      });

      const conflictingRetry = await secondOwner.cleanup({
        invocation_request_ref: `t010-c4-invocation-${randomUUID()}`,
        service_ref: "my-chat-family-sharing-runtime",
        request: secondRequest,
      });
      expect(conflictingRetry).toEqual({ status: "unavailable" });
      expect(secondPurge).not.toHaveBeenCalled();
    } finally {
      releaseFirst();
      await peer.$disconnect();
    }
  });
});

function readQualificationTarget(
  env: Readonly<Record<string, string | undefined>>,
): Readonly<{ url: string; databaseName: string }> | null {
  const value = env[TARGET_ENV];
  if (!value) return null;
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${TARGET_ENV} must be a valid PostgreSQL URL.`);
  }
  if (parsed.protocol !== "postgresql:" && parsed.protocol !== "postgres:") {
    throw new Error(`${TARGET_ENV} must use PostgreSQL.`);
  }
  const databaseName = decodeURIComponent(parsed.pathname.replace(/^\//u, ""));
  if (!/^t010_i4c4_(?:test|disposable)(?:_[a-z0-9_]+)*$/u.test(databaseName)) {
    throw new Error(`${TARGET_ENV} must name a dedicated t010_i4c4 test/disposable database.`);
  }
  const schema = parsed.searchParams.get("schema");
  if (schema && schema !== "public") {
    throw new Error(`${TARGET_ENV} must use the isolated database public schema.`);
  }
  if (env[APPROVAL_ENV] !== APPROVAL_VALUE) {
    throw new Error(`${APPROVAL_ENV} must contain the exact disposable-write approval token.`);
  }
  return { url: value, databaseName };
}

async function assertMigratedProductionShape(
  database: PrismaClient,
  expectedDatabaseName: string,
): Promise<void> {
  const identity = await database.$queryRaw<Array<{
    database_name: string;
    schema_name: string;
  }>>`
    SELECT current_database() AS database_name, current_schema() AS schema_name`;
  expect(identity).toEqual([{
    database_name: expectedDatabaseName,
    schema_name: "public",
  }]);
  const migrations = await database.$queryRaw<Array<{
    migration_name: string;
    finished_at: Date | null;
    rolled_back_at: Date | null;
  }>>`
    SELECT migration_name, finished_at, rolled_back_at
    FROM "_prisma_migrations"
    ORDER BY migration_name`;
  expect(migrations.length).toBeGreaterThan(0);
  expect(migrations.every(
    (item) => item.finished_at instanceof Date && item.rolled_back_at === null,
  )).toBe(true);
  expect(migrations.map((item) => item.migration_name)).toContain(
    "20260812090000_t010_family_sharing_authority",
  );
  const shape = await database.$queryRaw<Array<{ name: string }>>`
    SELECT conname AS name
    FROM pg_constraint
    WHERE conname IN (
      'ck_nurture_family_sharing_authority_direction',
      'ck_nurture_family_sharing_policy_direction',
      'nurture_family_sharing_authority_role_assignment_id_fkey',
      'nurture_family_sharing_policy_role_assignment_id_fkey'
    )
    UNION ALL
    SELECT indexname AS name
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname IN (
        'uq_nurture_family_sharing_authority_current',
        'uq_nurture_family_sharing_policy_current'
      )`;
  expect(new Set(shape.map((item) => item.name))).toEqual(new Set([
    "ck_nurture_family_sharing_authority_direction",
    "ck_nurture_family_sharing_policy_direction",
    "nurture_family_sharing_authority_role_assignment_id_fkey",
    "nurture_family_sharing_policy_role_assignment_id_fkey",
    "uq_nurture_family_sharing_authority_current",
    "uq_nurture_family_sharing_policy_current",
  ]));
}

async function seedQualificationFixture(database: Prisma.TransactionClient): Promise<QualificationFixture> {
  const run = randomUUID();
  const item = {
    workspaceId: `t010-c4-workspace-${run}`,
    participantId: `t010-c4-participant-${run}`,
    roleAssignmentId: `t010-c4-role-${run}`,
    childAnchorId: `t010-c4-child-anchor-${run}`,
    familyAnchorId: `t010-c4-family-anchor-${run}`,
    childAssociationId: `t010-c4-child-association-${run}`,
    familyAssociationId: `t010-c4-family-association-${run}`,
    childId: `t010-c4-child-${run}`,
    processId: `t010-c4-process-${run}`,
    familyId: `t010-c4-family-${run}`,
    institutionId: `t010-c4-institution-${run}`,
    careGroupId: `t010-c4-group-${run}`,
    enrollmentId: `t010-c4-enrollment-${run}`,
    pairOperationId: `t010-c4-pair-${run}`,
  } satisfies QualificationFixture;

  await database.nurtureParticipant.create({ data: {
    id: item.participantId,
    workspaceId: item.workspaceId,
    myChatUserId: `t010-c4-user-${run}`,
    status: "active",
    aggregateVersion: 3,
  } });
  await Promise.all([
    database.nurtureChildBindingAnchor.create({ data: {
      id: item.childAnchorId,
      reservationKeyHash: digest(`child-anchor:${run}`),
      status: "associated",
      aggregateVersion: 4,
    } }),
    database.nurtureFamilyBindingAnchor.create({ data: {
      id: item.familyAnchorId,
      reservationKeyHash: digest(`family-anchor:${run}`),
      status: "associated",
      aggregateVersion: 5,
    } }),
    database.nurtureChild.create({ data: {
      id: item.childId,
      workspaceId: item.workspaceId,
      displayName: "T010 C4 synthetic child",
      status: "active",
      aggregateVersion: 6,
    } }),
    database.nurtureCareInstitution.create({ data: {
      id: item.institutionId,
      workspaceId: item.workspaceId,
      displayName: "T010 C4 synthetic institution",
      status: "active",
      aggregateVersion: 7,
    } }),
  ]);
  await database.nurtureChildCareProcess.create({ data: {
    id: item.processId,
    workspaceId: item.workspaceId,
    childId: item.childId,
    status: "active",
    aggregateVersion: 8,
  } });
  await Promise.all([
    database.nurtureFamily.create({ data: {
      id: item.familyId,
      workspaceId: item.workspaceId,
      childCareProcessId: item.processId,
      status: "active",
      aggregateVersion: 9,
    } }),
    database.nurtureCareGroup.create({ data: {
      id: item.careGroupId,
      workspaceId: item.workspaceId,
      institutionId: item.institutionId,
      name: "T010 C4 synthetic group",
      status: "active",
      aggregateVersion: 10,
    } }),
    database.nurtureCareRoleAssignment.create({ data: {
      id: item.roleAssignmentId,
      workspaceId: item.workspaceId,
      participantId: item.participantId,
      role: "guardian",
      scopeType: "child_care_process",
      scopeId: item.processId,
      status: "active",
      aggregateVersion: 11,
    } }),
    database.nurtureChildAnchorAssociation.create({ data: {
      id: item.childAssociationId,
      workspaceId: item.workspaceId,
      childAnchorId: item.childAnchorId,
      childId: item.childId,
      status: "active",
      currentKey: "current",
      aggregateVersion: 12,
    } }),
  ]);
  await database.nurtureEnrollment.create({ data: {
    id: item.enrollmentId,
    workspaceId: item.workspaceId,
    childCareProcessId: item.processId,
    institutionId: item.institutionId,
    careGroupId: item.careGroupId,
    status: "active",
    participationPhase: "formal",
    aggregateVersion: 13,
  } });
  await database.nurtureFamilyAnchorAssociation.create({ data: {
    id: item.familyAssociationId,
    workspaceId: item.workspaceId,
    familyAnchorId: item.familyAnchorId,
    childAnchorId: item.childAnchorId,
    childAssociationId: item.childAssociationId,
    currentChildAssociationId: item.childAssociationId,
    childId: item.childId,
    childCareProcessId: item.processId,
    familyId: item.familyId,
    status: "active",
    currentKey: "current",
    aggregateVersion: 14,
  } });
  await database.nurtureC30PairOperation.create({ data: {
    id: item.pairOperationId,
    workspaceId: item.workspaceId,
    scenarioKey: "nurture",
    participantId: item.participantId,
    accountObjectId: `t010-c4-account-${run}`,
    actorObjectId: `t010-c4-actor-${run}`,
    childAnchorId: item.childAnchorId,
    familyAnchorId: item.familyAnchorId,
    childOwnerVersion: 4,
    familyOwnerVersion: 5,
    authoritySourceRef: `t010-c4-authority-${run}`,
    authoritySourceVersion: 1,
    principalProvenanceHash: digest(`principal:${run}`),
    continuationContextHash: digest(`continuation:${run}`),
    pairRelationEvidenceHash: digest(`relation:${run}`),
    currentOwnerEvidenceHash: digest(`owner:${run}`),
    canonicalInputHash: digest(`input:${run}`),
    pairCommitEvidenceHash: digest(`commit:${run}`),
    associationExpectationHash: digest(`expectation:${run}`),
    scenarioCommandId: `t010-c4-command-${run}`,
    scenarioCommandHash: digest(`command:${run}`),
    requestNonceHash: digest(`nonce:${run}`),
    hostIdentityEvidenceHash: digest(`host:${run}`),
    deadlineEvidenceHash: digest(`deadline:${run}`),
    attemptLedgerHash: digest(`attempt:${run}`),
    writerFenceHash: digest(`fence:${run}`),
    effectDeadlineAt: new Date("2026-08-12T08:05:00.000Z"),
    state: "committed",
    childAssociationId: item.childAssociationId,
    familyAssociationId: item.familyAssociationId,
    scenarioCommitEvidenceHash: digest(`scenario-commit:${run}`),
    participantVersion: 3,
    childCareProcessVersion: 8,
    familyVersion: 9,
    committedAt: new Date("2026-08-12T07:59:00.000Z"),
  } });
  await database.nurtureFamilySharingAuthority.createMany({ data: [
    authorityRow(item, "daily_activity", "nurture_to_family", run),
    authorityRow(item, "media", "family_to_nurture", run),
    authorityRow(item, "focus_collaboration", "family_to_nurture", run),
  ] });
  await database.nurtureFamilySharingPolicy.createMany({ data:
    ([
      ["daily_activity", "nurture_to_family"],
      ["media", "family_to_nurture"],
      ["focus_collaboration", "family_to_nurture"],
    ] as const).flatMap(([category, direction]) => [
      policyRow(item, category, direction, "release", run),
      policyRow(item, category, direction, "receiving", run),
    ]),
  });
  return item;
}

function authorityRow(
  item: QualificationFixture,
  category: "daily_activity" | "media" | "focus_collaboration",
  direction: "nurture_to_family" | "family_to_nurture",
  suffix: string,
): Prisma.NurtureFamilySharingAuthorityCreateManyInput {
  return {
    id: `t010-c4-authority-${category}-${suffix}`,
    workspaceId: item.workspaceId,
    childCareProcessId: item.processId,
    familyId: item.familyId,
    enrollmentId: item.enrollmentId,
    category,
    direction,
    purpose: NURTURE_FAMILY_SHARING_ELIGIBILITY_PURPOSE,
    status: "active",
    effectiveFrom: new Date("2026-08-12T07:00:00.000Z"),
    expiresAt: new Date("2026-08-12T09:00:00.000Z"),
    authorizingRole: "guardian",
    authorizingRoleAssignmentId: item.roleAssignmentId,
    authorityVersion: 1,
  };
}

function policyRow(
  item: QualificationFixture,
  category: "daily_activity" | "media" | "focus_collaboration",
  direction: "nurture_to_family" | "family_to_nurture",
  axis: "release" | "receiving",
  suffix: string,
): Prisma.NurtureFamilySharingPolicyCreateManyInput {
  return {
    id: `t010-c4-policy-${category}-${axis}-${suffix}`,
    workspaceId: item.workspaceId,
    childCareProcessId: item.processId,
    familyId: item.familyId,
    enrollmentId: item.enrollmentId,
    category,
    direction,
    axis,
    purpose: NURTURE_FAMILY_SHARING_ELIGIBILITY_PURPOSE,
    status: "active",
    effectiveFrom: new Date("2026-08-12T07:00:00.000Z"),
    expiresAt: new Date("2026-08-12T09:00:00.000Z"),
    authorizingRole: "guardian",
    authorizingRoleAssignmentId: item.roleAssignmentId,
    policyVersion: 1,
  };
}

function currentAuthorityInput(
  item: QualificationFixture,
): NurtureFamilySharingCurrentAuthorityReadInputV1 {
  return {
    principal: {
      verification: "verified_service_principal",
      service_ref: "my-chat-family-sharing-runtime",
      trust_source_ref: "c30.trust:my-chat.host:my-chat-family-sharing-workload",
      trust_source_version: 1,
      audience: NURTURE_FAMILY_SHARING_AUTHORITY_READ_AUDIENCE,
      operation: NURTURE_FAMILY_SHARING_AUTHORITY_READ_OPERATION,
    },
    pair_evidence: {
      verification: "verified_current_pair_evidence",
      evidence_ref: "t010-c4-pair-evidence-1",
      evidence_version: 1,
      verified_at: "2026-08-12T07:59:00.000Z",
      expires_at: "2026-08-12T08:01:00.000Z",
      child_anchor_ref: item.childAnchorId,
      child_owner_version: 4,
      family_anchor_ref: item.familyAnchorId,
      family_owner_version: 5,
      my_chat_family_lifecycle: "active",
    },
    local_pair: {
      workspace_id: item.workspaceId,
      child_ref: item.childId,
      child_care_process_ref: item.processId,
      family_ref: item.familyId,
      child_association_ref: item.childAssociationId,
      family_association_ref: item.familyAssociationId,
    },
    target: {
      verification: "verified_exact_target_selector",
      pair_evidence_ref: "t010-c4-pair-evidence-1",
      pair_evidence_version: 1,
      target_kind: "enrollment",
      enrollment_ref: item.enrollmentId,
      enrollment_revision: 13,
    },
    purpose: NURTURE_FAMILY_SHARING_ELIGIBILITY_PURPOSE,
    evaluated_at: EVALUATED_AT,
  };
}

function cleanupRequest(
  item: QualificationFixture,
  cleanupCommandRef: string,
): Readonly<{
  wire: NurtureFamilySharingCleanupPrivateInputV1;
  local_pair: NurtureFamilySharingCurrentAuthorityReadInputV1["local_pair"];
}> {
  const authority = currentAuthorityInput(item);
  return {
    wire: {
      cleanup_contract: NURTURE_FAMILY_SHARING_CLEANUP_CONTRACT,
      cleanup_command_ref: cleanupCommandRef,
      purpose: NURTURE_FAMILY_SHARING_ELIGIBILITY_PURPOSE,
      categories: ["media"],
      pair_evidence: {
        evidence_ref: authority.pair_evidence.evidence_ref,
        evidence_version: authority.pair_evidence.evidence_version,
        verified_at: authority.pair_evidence.verified_at,
        expires_at: authority.pair_evidence.expires_at,
        child_anchor_ref: authority.pair_evidence.child_anchor_ref,
        child_owner_version: authority.pair_evidence.child_owner_version,
        family_anchor_ref: authority.pair_evidence.family_anchor_ref,
        family_owner_version: authority.pair_evidence.family_owner_version,
        my_chat_family_lifecycle: authority.pair_evidence.my_chat_family_lifecycle,
      },
      target: {
        pair_evidence_ref: authority.target.pair_evidence_ref,
        pair_evidence_version: authority.target.pair_evidence_version,
        target_kind: "enrollment",
        enrollment_ref: authority.target.enrollment_ref,
        enrollment_revision: authority.target.enrollment_revision,
      },
    },
    local_pair: authority.local_pair,
  };
}

async function protectedPairCounts(
  database: PrismaClient,
  item: QualificationFixture,
): Promise<readonly number[]> {
  return Promise.all([
    database.nurtureChild.count({ where: { id: item.childId } }),
    database.nurtureChildCareProcess.count({ where: { id: item.processId } }),
    database.nurtureFamily.count({ where: { id: item.familyId } }),
    database.nurtureChildBindingAnchor.count({ where: { id: item.childAnchorId } }),
    database.nurtureFamilyBindingAnchor.count({ where: { id: item.familyAnchorId } }),
    database.nurtureChildAnchorAssociation.count({ where: { id: item.childAssociationId } }),
    database.nurtureFamilyAnchorAssociation.count({ where: { id: item.familyAssociationId } }),
  ]);
}

async function removeQualificationFixture(
  database: PrismaClient,
  item: QualificationFixture,
): Promise<void> {
  await database.nurtureCommandExecution.deleteMany({ where: { workspaceId: item.workspaceId } });
  await database.nurtureFamilySharingPolicy.deleteMany({ where: { workspaceId: item.workspaceId } });
  await database.nurtureFamilySharingAuthority.deleteMany({ where: { workspaceId: item.workspaceId } });
  await database.nurtureC30PairOperation.deleteMany({ where: { id: item.pairOperationId } });
  await database.nurtureFamilyAnchorAssociation.deleteMany({ where: { id: item.familyAssociationId } });
  await database.nurtureChildAnchorAssociation.deleteMany({ where: { id: item.childAssociationId } });
  await database.nurtureEnrollment.deleteMany({ where: { id: item.enrollmentId } });
  await database.nurtureCareRoleAssignment.deleteMany({ where: { id: item.roleAssignmentId } });
  await database.nurtureCareGroup.deleteMany({ where: { id: item.careGroupId } });
  await database.nurtureCareInstitution.deleteMany({ where: { id: item.institutionId } });
  await database.nurtureFamily.deleteMany({ where: { id: item.familyId } });
  await database.nurtureChildCareProcess.deleteMany({ where: { id: item.processId } });
  await database.nurtureChild.deleteMany({ where: { id: item.childId } });
  await database.nurtureChildBindingAnchor.deleteMany({ where: { id: item.childAnchorId } });
  await database.nurtureFamilyBindingAnchor.deleteMany({ where: { id: item.familyAnchorId } });
  await database.nurtureParticipant.deleteMany({ where: { id: item.participantId } });
}

function requirePrisma(): PrismaClient {
  if (!prisma) throw new Error("T-010 qualification target is not configured.");
  return prisma;
}

function requireFixture(): QualificationFixture {
  if (!fixture) throw new Error("T-010 qualification fixture is not ready.");
  return fixture;
}

function digest(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function storedCleanupReceipt(requestFingerprint: string) {
  return {
    receipt_version: 1 as const,
    cleanup_receipt_ref: `cleanup.v1.${"c".repeat(64)}`,
    cleanup_command_ref: "cleanup-1",
    request_fingerprint: requestFingerprint,
    categories: ["media"] as const,
    store_receipts: [{
      store_ref: "store-1",
      store_version: 1,
      disposition: "purged" as const,
    }],
    completed_at: EVALUATED_AT,
  };
}
