#!/usr/bin/env node

/**
 * Trust model: this runner cannot prove that a loopback URL terminates at a
 * local Docker container. The approval value binds the operator to the exact
 * URL digest and repeats the database name literally. URL loopback filtering
 * and the server-side private-address assertion are defense-in-depth against
 * mistakes, including tunnels; they are not proof of target ownership.
 */

import { createHash, randomUUID } from "node:crypto";
import {
  cpSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";

const artifactDirectory = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(artifactDirectory, "../../../../..");
const prismaDirectory = path.join(repoRoot, "prisma");
const schemaPath = path.join(prismaDirectory, "schema.prisma");
const migrationDirectoryName = "20260813120000_t011_family_growth_outbox_scope";
const migrationPath = path.join(prismaDirectory, "migrations", migrationDirectoryName, "migration.sql");
const assertionPath = path.join(repoRoot, "scripts/assert-family-growth-outbox-invariants.mjs");
const prismaCli = path.join(repoRoot, "node_modules/prisma/build/index.js");
const targetEnv = "NURTURE_T011_N3_DATABASE_URL";
const approvalEnv = "I_APPROVE_T011_N3_DISPOSABLE_WRITES";
const workspacePrefix = "t011-n3-workspace-";
const newConstraintNames = [
  "fk_nurture_fg_outbox_workspace_release",
  "fk_nurture_fg_outbox_workspace_release_visibility",
  "fk_nurture_fg_receipt_workspace_outbox",
];
const newIndexNames = [
  "uq_nurture_publication_release_workspace_id",
  "uq_nurture_visibility_event_workspace_release_id",
  "uq_nurture_family_growth_outbox_workspace_id",
  "uq_nurture_family_growth_outbox_workspace_visibility",
];
const b2ReleaseUniqueIndexSql = `CREATE UNIQUE INDEX "uq_nurture_publication_release_workspace_id"
  ON "nurture_publication_release"("workspace_id", "id")`;
const b2ReleaseConstraintSql = `ALTER TABLE "nurture_family_growth_outbox_event"
  ADD CONSTRAINT "fk_nurture_fg_outbox_workspace_release"
  FOREIGN KEY ("workspace_id", "publication_release_id")
  REFERENCES "nurture_publication_release"("workspace_id", "id")
  ON DELETE RESTRICT ON UPDATE CASCADE`;

// Declared before the top-level qualification flow below so the class
// binding is initialized when phase B2 runs (module TDZ).
class ExpectedB2ForeignKeyViolation extends Error {}

assertVehicleFiles();
runNode(assertionPath, [], process.env);
if (process.argv.includes("--check-only")) {
  process.stdout.write(
    "[ok] T-011 N3 qualification vehicle defines empty replay, populated upgrade, and expected-abort phases; database execution requires an operator-approved exact URL digest plus literal database name. Loopback/private-address checks are defense-in-depth, not proof of local Docker ownership.\n",
  );
  process.exit(0);
}

const target = approvedTarget(process.env);
await withApprovedClient(target, "initial emptiness check", async (database) => {
  await assertEmptyTarget(database);
});

const temporaryRoot = mkdtempSync(path.join(tmpdir(), "nurture-t011-n3-"));
const previousPrismaDirectory = path.join(temporaryRoot, "prisma");
const previousSchemaPath = path.join(previousPrismaDirectory, "schema.prisma");
try {
  createPreviousHeadPrismaTree(previousPrismaDirectory);

  process.stdout.write("[phase A] full from-empty replay and scope/lineage probes\n");
  await migrateDeploy(target, schemaPath, "phase A full replay");
  await withApprovedClient(target, "phase A probes", async (database) => {
    await runNegativeInsertQualification(database);
    await cleanupSyntheticRows(database);
    await assertResidualCensus(database);
  });

  await resetPublicSchema(target, "between phase A and phase B1");
  process.stdout.write("[phase B1] populated upgrade from the previous migration head\n");
  await migrateDeploy(target, previousSchemaPath, "phase B1 previous-head replay");
  await withApprovedClient(target, "phase B1 legacy seed", async (database) => {
    await seedCoherentLegacyPopulation(database, "populated-upgrade");
  });
  await migrateDeploy(target, schemaPath, "phase B1 T-011-only apply");
  await withApprovedClient(target, "phase B1 populated validation", async (database) => {
    await assertT011Validated(database);
    await assertPopulatedQualificationRows(database);
  });

  await resetPublicSchema(target, "between phase B1 and phase B2");
  process.stdout.write("[phase B2] populated cross-scope row must abort T-011 cleanly\n");
  await migrateDeploy(target, previousSchemaPath, "phase B2 previous-head replay");
  await withApprovedClient(target, "phase B2 violating legacy seed", async (database) => {
    await seedCrossScopeLegacyViolation(database);
  });
  const foreignKeyCause = await withApprovedClient(
    target,
    "phase B2 direct FK-cause proof",
    proveB2ForeignKeyCause,
  );
  await migrateDeploy(target, schemaPath, "phase B2 expected T-011 abort", true);
  const postState = await withApprovedClient(
    target,
    "phase B2 clean-abort assertion",
    async (database) => assertT011AbsentAfterAbort(database),
  );
  assertB2PassByAbortEvidence(foreignKeyCause, postState);
  process.stdout.write(
    `[cause-proof] exact ADD CONSTRAINT rejected the violating row with SQLSTATE ${foreignKeyCause.sqlState}; the proof transaction rolled back.\n`,
  );
  process.stdout.write(
    "[pass-by-abort] T-011 rejected the populated cross-scope row and left no new index/constraint installed.\n",
  );

  await resetPublicSchema(target, "final disposable cleanup");
  await withApprovedClient(target, "final emptiness check", async (database) => {
    await assertEmptyTarget(database);
  });
} finally {
  rmSync(temporaryRoot, { recursive: true, force: true });
}

process.stdout.write(
  `[ok] T-011 N3 qualification passed on ${target.databaseName}; the disposable database was returned to an empty public schema.\n`,
);

function digest(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function client(url) {
  return new PrismaClient({ datasources: { db: { url } } });
}

function assertVehicleFiles() {
  for (const file of [schemaPath, migrationPath, assertionPath, prismaCli]) {
    if (!existsSync(file)) throw new Error(`T-011 N3 qualification dependency is absent: ${file}`);
  }
  const migration = readFileSync(migrationPath, "utf8");
  if (!/^\s*--[\s\S]*?\bBEGIN;/u.test(migration) || !/COMMIT;\s*$/u.test(migration)) {
    throw new Error("T-011 N3 migration must be explicitly transactional for clean aborts.");
  }
  const normalizedMigration = migration.replace(/\s+/gu, " ");
  for (const exactProofStatement of [b2ReleaseUniqueIndexSql, b2ReleaseConstraintSql]) {
    if (!normalizedMigration.includes(exactProofStatement.replace(/\s+/gu, " "))) {
      throw new Error("T-011 N3 B2 cause proof must execute the migration's exact SQL statements.");
    }
  }
}

function approvedTarget(env) {
  const value = env[targetEnv];
  if (!value) throw new Error(`${targetEnv} is required; DATABASE_URL is never a fallback.`);
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${targetEnv} must be a valid PostgreSQL URL.`);
  }
  if (parsed.protocol !== "postgresql:" && parsed.protocol !== "postgres:") {
    throw new Error(`${targetEnv} must use PostgreSQL.`);
  }
  if (parsed.hostname !== "127.0.0.1" && parsed.hostname !== "localhost") {
    throw new Error(`${targetEnv} host must be exactly 127.0.0.1 or localhost.`);
  }
  const databaseName = decodeURIComponent(parsed.pathname.replace(/^\//u, ""));
  if (!/^t011_n3_(?:test|disposable)(?:_[a-z0-9_]+)*$/u.test(databaseName)) {
    throw new Error(`${targetEnv} must name a dedicated t011_n3 test/disposable database.`);
  }
  if (parsed.searchParams.get("schema") && parsed.searchParams.get("schema") !== "public") {
    throw new Error(`${targetEnv} must use the isolated database public schema.`);
  }
  const approvalValue = `${databaseName}:sha256:${digest(value)}`;
  if (env[approvalEnv] !== approvalValue) {
    throw new Error(
      `${approvalEnv} must repeat the database name and equal ${databaseName}:sha256(<exact ${targetEnv} bytes>); expected ${approvalValue}.`,
    );
  }
  return { url: value, databaseName };
}

async function withApprovedClient(target, label, work) {
  const database = client(target.url);
  try {
    await database.$connect();
    await assertTargetIdentity(database, target, label);
    return await work(database);
  } finally {
    await database.$disconnect();
  }
}

async function assertTargetIdentity(database, target, label) {
  const identity = await database.$queryRawUnsafe(
    `SELECT current_database() AS database_name,
      current_schema() AS schema_name,
      inet_server_addr()::text AS server_address`,
  );
  const row = identity[0];
  // This is defense-in-depth only. A tunnel can make a remote database appear
  // at loopback, and a private server address does not prove local Docker.
  const serverAddress = String(row?.server_address ?? "");
  const privateServer =
    serverAddress === "127.0.0.1"
    || serverAddress === "::1"
    || serverAddress.startsWith("127.")
    || serverAddress.startsWith("10.")
    || serverAddress.startsWith("192.168.")
    || /^172\.(1[6-9]|2\d|3[01])\./.test(serverAddress)
    || /^f[cd][0-9a-f]{2}:/iu.test(serverAddress)
    || serverAddress === "";
  if (
    identity.length !== 1
    || row?.database_name !== target.databaseName
    || row?.schema_name !== "public"
    || !privateServer
  ) {
    throw new Error(`T-011 N3 ${label} target identity mismatch: ${JSON.stringify(identity)}`);
  }
}

async function assertEmptyTarget(database) {
  const objects = await database.$queryRawUnsafe(`
    WITH user_namespaces AS (
      SELECT oid, nspname
      FROM pg_namespace
      WHERE nspname <> 'information_schema'
        AND nspname !~ '^pg_'
    )
    SELECT object_kind, schema_name, object_name
    FROM (
      SELECT
        CASE class.relkind
          WHEN 'r' THEN 'table'
          WHEN 'p' THEN 'partitioned_table'
          WHEN 'v' THEN 'view'
          WHEN 'm' THEN 'materialized_view'
          WHEN 'S' THEN 'sequence'
          WHEN 'f' THEN 'foreign_table'
          ELSE class.relkind::text
        END AS object_kind,
        namespace.nspname AS schema_name,
        class.relname AS object_name
      FROM pg_class class
      INNER JOIN user_namespaces namespace ON namespace.oid = class.relnamespace
      WHERE class.relkind IN ('r', 'p', 'v', 'm', 'S', 'f')
      UNION ALL
      SELECT
        CASE type.typtype
          WHEN 'd' THEN 'domain'
          WHEN 'e' THEN 'enum'
          WHEN 'r' THEN 'range'
          WHEN 'm' THEN 'multirange'
          ELSE 'type'
        END,
        namespace.nspname,
        type.typname
      FROM pg_type type
      INNER JOIN user_namespaces namespace ON namespace.oid = type.typnamespace
      WHERE type.typisdefined
        AND type.typtype IN ('d', 'e', 'r', 'm')
        AND type.typelem = 0
      UNION ALL
      SELECT
        CASE procedure.prokind
          WHEN 'p' THEN 'procedure'
          WHEN 'a' THEN 'aggregate'
          WHEN 'w' THEN 'window_function'
          ELSE 'function'
        END,
        namespace.nspname,
        procedure.proname
      FROM pg_proc procedure
      INNER JOIN user_namespaces namespace ON namespace.oid = procedure.pronamespace
      UNION ALL
      SELECT
        'extension',
        namespace.nspname,
        extension.extname
      FROM pg_extension extension
      INNER JOIN pg_namespace namespace ON namespace.oid = extension.extnamespace
      WHERE extension.extname NOT IN ('plpgsql')
    ) objects
    ORDER BY schema_name, object_kind, object_name
  `);
  if (objects.length !== 0) {
    throw new Error(
      `T-011 N3 runner requires every non-system schema to be object-empty; found ${JSON.stringify(objects)}.`,
    );
  }
}

function createPreviousHeadPrismaTree(destination) {
  cpSync(prismaDirectory, destination, {
    recursive: true,
    filter: (source) => path.basename(source) !== migrationDirectoryName,
  });
  if (existsSync(path.join(destination, "migrations", migrationDirectoryName))) {
    throw new Error("T-011 migration leaked into the previous-head migration tree.");
  }
}

async function migrateDeploy(target, selectedSchemaPath, label, expectFailure = false) {
  const migrationUrl = target.url;
  const migrationEnvironment = { ...process.env, DATABASE_URL: migrationUrl };
  // Use Prisma CLI itself for the immediately preceding identity assertion,
  // with the same schema and exact DATABASE_URL bytes as migrate deploy. This
  // avoids a separate preflight-only PrismaClient with independently supplied
  // connection configuration.
  assertPrismaMigrationTargetIdentity(
    target,
    selectedSchemaPath,
    `${label} migration identity assertion`,
    migrationEnvironment,
  );
  const result = spawnSync(
    process.execPath,
    [prismaCli, "migrate", "deploy", "--schema", selectedSchemaPath],
    {
      cwd: repoRoot,
      env: migrationEnvironment,
      encoding: "utf8",
      windowsHide: true,
    },
  );
  if (result.error) throw result.error;
  const output = [result.stdout, result.stderr].filter(Boolean).join("\n");
  if (expectFailure) {
    if (result.status === 0) throw new Error(`${label} was incorrectly accepted.`);
    return output;
  }
  if (result.status !== 0) {
    throw new Error(`${label} failed with exit code ${result.status}:\n${output}`);
  }
  return output;
}

// Honest limitation: `prisma migrate deploy` always opens its own
// connection, so a literal same-connection assertion is impossible. The
// achievable guarantee is same-target-URL: this identity DO-block runs
// through the same prisma CLI with the byte-identical URL immediately
// before the migration, and the caller re-asserts identity on a fresh
// connection afterwards. Combined with the URL-digest approval, the
// window for target substitution is operator-controlled configuration,
// not runner behavior.
function assertPrismaMigrationTargetIdentity(target, selectedSchemaPath, label, environment) {
  const statement = `DO $t011_n3_identity$
DECLARE
  actual_database text := current_database();
  actual_schema text := current_schema();
  server_address inet := inet_server_addr();
BEGIN
  IF actual_database <> '${target.databaseName}'
    OR actual_schema <> 'public'
    OR NOT (
      server_address IS NULL
      OR server_address <<= inet '127.0.0.0/8'
      OR server_address <<= inet '10.0.0.0/8'
      OR server_address <<= inet '172.16.0.0/12'
      OR server_address <<= inet '192.168.0.0/16'
      OR server_address <<= inet '::1/128'
      OR server_address <<= inet 'fc00::/7'
    )
  THEN
    RAISE EXCEPTION 'T-011 N3 migration target identity mismatch: database=%, schema=%, server=%',
      actual_database, actual_schema, COALESCE(server_address::text, 'local-socket');
  END IF;
END
$t011_n3_identity$;`;
  const result = spawnSync(
    process.execPath,
    [prismaCli, "db", "execute", "--schema", selectedSchemaPath, "--stdin"],
    {
      cwd: repoRoot,
      env: environment,
      input: statement,
      encoding: "utf8",
      windowsHide: true,
    },
  );
  if (result.error) throw result.error;
  if (result.status !== 0) {
    const output = [result.stdout, result.stderr].filter(Boolean).join("\n");
    throw new Error(`${label} failed with exit code ${result.status}:\n${output}`);
  }
}

async function resetPublicSchema(target, label) {
  await withApprovedClient(target, label, async (database) => {
    await database.$executeRawUnsafe('DROP SCHEMA "public" CASCADE');
    await database.$executeRawUnsafe('CREATE SCHEMA "public"');
  });
}

async function runNegativeInsertQualification(database) {
  const workspaceA = `${workspacePrefix}a-${randomUUID()}`;
  const workspaceB = `${workspacePrefix}b-${randomUUID()}`;
  const releaseA1 = await seedRelease(database, workspaceA, "a1");
  const releaseA2 = await seedRelease(database, workspaceA, "a2");
  const releaseB = await seedRelease(database, workspaceB, "b1");

  await expectForeignKeyRejection(
    database,
    "cross-workspace outbox/release",
    "fk_nurture_fg_outbox_workspace_release",
    `INSERT INTO "nurture_family_growth_outbox_event" (
      "id", "workspace_id", "kind", "publication_release_id",
      "payload_digest", "envelope_payload", "updated_at"
    ) VALUES ($1, $2, 'released', $3, $4, '{}'::jsonb, CURRENT_TIMESTAMP)`,
    [randomUUID(), workspaceA, releaseB.release.id, digest("phase-a-cross-release")],
  );

  await expectForeignKeyRejection(
    database,
    "cross-release outbox/visibility",
    "fk_nurture_fg_outbox_workspace_release_visibility",
    `INSERT INTO "nurture_family_growth_outbox_event" (
      "id", "workspace_id", "kind", "publication_release_id",
      "visibility_event_id", "payload_digest", "envelope_payload", "updated_at"
    ) VALUES ($1, $2, 'correction', $3, $4, $5, '{}'::jsonb, CURRENT_TIMESTAMP)`,
    [
      randomUUID(),
      workspaceA,
      releaseA1.release.id,
      releaseA2.visibility.id,
      digest("phase-a-cross-visibility"),
    ],
  );

  const validOutbox = await database.nurtureFamilyGrowthOutboxEvent.create({
    data: {
      id: randomUUID(),
      workspaceId: workspaceB,
      kind: "released",
      publicationReleaseId: releaseB.release.id,
      payloadDigest: digest("phase-a-valid-outbox"),
      envelopePayload: {},
    },
  });

  await expectForeignKeyRejection(
    database,
    "cross-workspace receipt/outbox",
    "fk_nurture_fg_receipt_workspace_outbox",
    `INSERT INTO "nurture_family_growth_admission_receipt" (
      "id", "workspace_id", "outbox_event_id", "receipt_id", "status",
      "reason_code", "processed_at", "receipt_payload"
    ) VALUES ($1, $2, $3, $4, 'rejected', 'qualification_probe',
      CURRENT_TIMESTAMP, '{}'::jsonb)`,
    [randomUUID(), workspaceA, validOutbox.id, `receipt:${randomUUID()}`],
  );

  await database.nurtureFamilyGrowthAdmissionReceipt.create({
    data: {
      workspaceId: workspaceB,
      outboxEventId: validOutbox.id,
      receiptId: `receipt:${randomUUID()}`,
      status: "rejected",
      reasonCode: "qualification_control",
      processedAt: new Date(),
      receiptPayload: {},
    },
  });
}

async function seedCoherentLegacyPopulation(database, tag) {
  const workspaceId = `${workspacePrefix}${tag}-${randomUUID()}`;
  const releaseA = await seedRelease(database, workspaceId, `${tag}-a`);
  const releaseB = await seedRelease(database, workspaceId, `${tag}-b`);
  const releasedOutbox = await database.nurtureFamilyGrowthOutboxEvent.create({
    data: {
      id: randomUUID(),
      workspaceId,
      kind: "released",
      publicationReleaseId: releaseA.release.id,
      payloadDigest: digest(`${tag}:released`),
      envelopePayload: {},
    },
  });
  await database.nurtureFamilyGrowthOutboxEvent.create({
    data: {
      id: randomUUID(),
      workspaceId,
      kind: "correction",
      publicationReleaseId: releaseB.release.id,
      visibilityEventId: releaseB.visibility.id,
      payloadDigest: digest(`${tag}:correction`),
      envelopePayload: {},
    },
  });
  await database.nurtureFamilyGrowthAdmissionReceipt.create({
    data: {
      workspaceId,
      outboxEventId: releasedOutbox.id,
      receiptId: `receipt:${randomUUID()}`,
      status: "rejected",
      reasonCode: "qualification_control",
      processedAt: new Date(),
      receiptPayload: {},
    },
  });
}

async function seedCrossScopeLegacyViolation(database) {
  const workspaceA = `${workspacePrefix}violating-a-${randomUUID()}`;
  const workspaceB = `${workspacePrefix}violating-b-${randomUUID()}`;
  await seedRelease(database, workspaceA, "violating-a");
  const releaseB = await seedRelease(database, workspaceB, "violating-b");
  await database.$executeRawUnsafe(
    `INSERT INTO "nurture_family_growth_outbox_event" (
      "id", "workspace_id", "kind", "publication_release_id",
      "payload_digest", "envelope_payload", "updated_at"
    ) VALUES ($1, $2, 'released', $3, $4, '{}'::jsonb, CURRENT_TIMESTAMP)`,
    randomUUID(),
    workspaceA,
    releaseB.release.id,
    digest("populated-cross-scope-violation"),
  );
}

async function proveB2ForeignKeyCause(database) {
  let evidence;
  try {
    await database.$transaction(async (transaction) => {
      await transaction.$executeRawUnsafe(b2ReleaseUniqueIndexSql);
      try {
        // This is the migration's exact ADD CONSTRAINT statement. The
        // supporting unique index is created only inside this proof
        // transaction, so both statements disappear on rollback.
        await transaction.$executeRawUnsafe(b2ReleaseConstraintSql);
      } catch (error) {
        const detail = databaseErrorDetail(error);
        if (
          !detail.includes("23503")
          || !detail.includes("fk_nurture_fg_outbox_workspace_release")
        ) {
          throw new Error(`T-011 N3 direct FK-cause proof failed for the wrong reason: ${detail}`);
        }
        evidence = {
          sqlState: "23503",
          constraintName: "fk_nurture_fg_outbox_workspace_release",
        };
        throw new ExpectedB2ForeignKeyViolation("rollback expected FK-cause proof");
      }
      throw new Error("T-011 N3 direct FK-cause proof was incorrectly accepted.");
    });
  } catch (error) {
    if (!(error instanceof ExpectedB2ForeignKeyViolation)) throw error;
  }
  if (!evidence) throw new Error("T-011 N3 direct FK-cause proof captured no SQLSTATE evidence.");
  return evidence;
}

function databaseErrorDetail(error) {
  const record = typeof error === "object" && error !== null ? error : {};
  const meta = typeof record.meta === "object" && record.meta !== null ? record.meta : {};
  return [
    error instanceof Error ? error.message : String(error),
    typeof record.code === "string" ? record.code : "",
    typeof meta.code === "string" ? meta.code : "",
    typeof meta.message === "string" ? meta.message : "",
  ].join("\n");
}

async function seedRelease(database, workspaceId, tag) {
  const teacher = await database.nurtureParticipant.create({
    data: {
      workspaceId,
      myChatUserId: `t011-n3-teacher:${tag}:${randomUUID()}`,
      status: "active",
    },
  });
  const guardian = await database.nurtureParticipant.create({
    data: {
      workspaceId,
      myChatUserId: `t011-n3-guardian:${tag}:${randomUUID()}`,
      status: "active",
    },
  });
  const institution = await database.nurtureCareInstitution.create({
    data: { workspaceId, displayName: `T011 N3 ${tag}`, status: "active" },
  });
  const careGroup = await database.nurtureCareGroup.create({
    data: {
      workspaceId,
      institutionId: institution.id,
      name: `T011 N3 ${tag}`,
      status: "active",
    },
  });
  const role = await database.nurtureCareRoleAssignment.create({
    data: {
      workspaceId,
      participantId: teacher.id,
      role: "caregiver",
      scopeType: "care_group",
      scopeId: careGroup.id,
      status: "active",
    },
  });
  const child = await database.nurtureChild.create({
    data: { workspaceId, displayName: `T011 N3 child ${tag}`, status: "active" },
  });
  const careProcess = await database.nurtureChildCareProcess.create({
    data: { workspaceId, childId: child.id, status: "active" },
  });
  const enrollment = await database.nurtureEnrollment.create({
    data: {
      workspaceId,
      childCareProcessId: careProcess.id,
      institutionId: institution.id,
      careGroupId: careGroup.id,
      status: "active",
      participationPhase: "formal",
    },
  });
  const grant = await database.nurtureChildLinkGrant.create({
    data: {
      workspaceId,
      childCareProcessId: careProcess.id,
      enrollmentId: enrollment.id,
      grantedByParticipantId: guardian.id,
      grantedToScopeType: "care_group",
      grantedToScopeId: careGroup.id,
      directions: ["org_to_family"],
      dataClasses: ["child_growth_record"],
      purposes: ["child_growth_publication"],
      status: "active",
    },
  });
  const process = await database.nurturePublishProcess.create({
    data: {
      workspaceId,
      careGroupId: careGroup.id,
      processKey: `t011-n3:${tag}:${randomUUID()}`,
      state: "pending_release",
      dataClass: "child_growth_record",
      purposeKey: "child_growth_publication",
      authorizingRoleAssignmentId: role.id,
    },
  });
  const revision = await database.nurturePublishProcessRevision.create({
    data: {
      workspaceId,
      publishProcessId: process.id,
      revision: 1,
      // Real migration CHECKs require digest-shaped identities; never use a
      // human-readable `qualification:<uuid>` placeholder in seeded facts.
      contentDigest: digest(`revision:${workspaceId}:${tag}`),
      organizerInputRevision: digest(`organizer:${workspaceId}:${tag}`),
    },
  });
  await database.nurturePublishProcess.update({
    where: { id: process.id },
    data: {
      state: "released",
      currentRevisionId: revision.id,
      frozenRevisionId: revision.id,
    },
  });
  const target = await database.nurturePublishProcessTarget.create({
    data: {
      workspaceId,
      publishProcessId: process.id,
      targetKey: `target:${tag}`,
      childCareProcessId: careProcess.id,
      enrollmentId: enrollment.id,
      familyRefKey: `family:${tag}`,
      grantId: grant.id,
    },
  });
  const receipt = await database.nurtureChildLinkReceipt.create({
    data: {
      workspaceId,
      grantId: grant.id,
      childCareProcessId: careProcess.id,
      enrollmentId: enrollment.id,
      direction: "org_to_family",
      dataClass: "child_growth_record",
      sourceType: "publication_release",
      sourceId: target.id,
      routingAttemptKey: digest(`routing:${workspaceId}:${tag}`),
      targetScopeType: "family",
      targetScopeId: `family:${tag}`,
      status: "delivered",
      deliveredAt: new Date(),
    },
  });
  const release = await database.nurturePublicationRelease.create({
    data: {
      workspaceId,
      publishProcessId: process.id,
      publishProcessTargetId: target.id,
      publishProcessRevisionId: revision.id,
      releasedByRoleAssignmentId: role.id,
      commandRequestIdHash: digest(`release-command:${workspaceId}:${tag}`),
      receiptId: receipt.id,
    },
  });
  const visibility = await database.nurturePublicationVisibilityEvent.create({
    data: {
      workspaceId,
      publicationReleaseId: release.id,
      kind: "correction",
      reasonKey: "qualification_probe",
      actorRoleAssignmentId: role.id,
      sourceReleaseRevision: 1,
    },
  });
  return { release, visibility };
}

async function expectForeignKeyRejection(database, label, constraintName, statement, values) {
  let rejection;
  try {
    await database.$executeRawUnsafe(statement, ...values);
  } catch (error) {
    rejection = error;
  }
  if (!rejection) throw new Error(`T-011 N3 ${label} probe was incorrectly accepted.`);
  const detail = [
    rejection instanceof Error ? rejection.message : String(rejection),
    rejection?.meta?.code ?? "",
    rejection?.meta?.message ?? "",
  ].join("\n");
  if (!detail.includes(constraintName) || !detail.includes("23503")) {
    throw new Error(`T-011 N3 ${label} failed for the wrong reason: ${detail}`);
  }
}

async function assertT011Validated(database) {
  const constraints = await database.$queryRawUnsafe(
    `SELECT conname, convalidated
     FROM pg_constraint
     WHERE conname = ANY($1::text[])
     ORDER BY conname`,
    newConstraintNames,
  );
  if (
    constraints.length !== newConstraintNames.length
    || constraints.some((constraint) => constraint.convalidated !== true)
  ) {
    throw new Error(`T-011 populated constraints are absent/unvalidated: ${JSON.stringify(constraints)}`);
  }
  const indexes = await database.$queryRawUnsafe(
    `SELECT class.relname AS index_name, index.indisvalid, index.indisready
     FROM pg_index index
     INNER JOIN pg_class class ON class.oid = index.indexrelid
     WHERE class.relname = ANY($1::text[])
     ORDER BY class.relname`,
    newIndexNames,
  );
  if (
    indexes.length !== newIndexNames.length
    || indexes.some((index) => index.indisvalid !== true || index.indisready !== true)
  ) {
    throw new Error(`T-011 populated indexes are absent/invalid: ${JSON.stringify(indexes)}`);
  }
}

async function assertPopulatedQualificationRows(database) {
  const rows = await database.$queryRawUnsafe(
    `SELECT
      (SELECT COUNT(*)::int FROM "nurture_publication_release"
        WHERE "workspace_id" LIKE $1) AS releases,
      (SELECT COUNT(*)::int FROM "nurture_family_growth_outbox_event"
        WHERE "workspace_id" LIKE $1) AS outbox_events,
      (SELECT COUNT(*)::int FROM "nurture_family_growth_admission_receipt"
        WHERE "workspace_id" LIKE $1) AS receipts`,
    `${workspacePrefix}populated-upgrade-%`,
  );
  const row = rows[0];
  if (!row || row.releases < 2 || row.outbox_events < 2 || row.receipts < 1) {
    throw new Error(`T-011 populated upgrade lost legacy rows: ${JSON.stringify(rows)}`);
  }
}

async function assertT011AbsentAfterAbort(database) {
  const constraints = await database.$queryRawUnsafe(
    `SELECT conname FROM pg_constraint WHERE conname = ANY($1::text[])`,
    newConstraintNames,
  );
  const indexes = await database.$queryRawUnsafe(
    `SELECT relname FROM pg_class WHERE relkind = 'i' AND relname = ANY($1::text[])`,
    newIndexNames,
  );
  const violatingRows = await database.$queryRawUnsafe(
    `SELECT COUNT(*)::int AS count
     FROM "nurture_family_growth_outbox_event"
     WHERE "workspace_id" LIKE $1`,
    `${workspacePrefix}violating-a-%`,
  );
  if (constraints.length !== 0 || indexes.length !== 0 || violatingRows[0]?.count !== 1) {
    throw new Error(
      `T-011 expected abort was not clean: ${JSON.stringify({ constraints, indexes, violatingRows })}`,
    );
  }
  return {
    constraintsAbsent: constraints.length === 0,
    indexesAbsent: indexes.length === 0,
    violatingRowRetained: violatingRows[0]?.count === 1,
  };
}

function assertB2PassByAbortEvidence(foreignKeyCause, postState) {
  const captured23503 =
    foreignKeyCause.sqlState === "23503"
    && foreignKeyCause.constraintName === "fk_nurture_fg_outbox_workspace_release";
  const postStateAbsent =
    postState.constraintsAbsent
    && postState.indexesAbsent
    && postState.violatingRowRetained;
  if (!captured23503 || !postStateAbsent) {
    throw new Error(
      `T-011 N3 B2 requires both captured 23503 cause evidence and clean post-state absence: ${JSON.stringify({ foreignKeyCause, postState })}`,
    );
  }
}

async function cleanupSyntheticRows(database) {
  const where = { workspaceId: { startsWith: workspacePrefix } };
  await database.nurtureFamilyGrowthAdmissionReceipt.deleteMany({ where });
  await database.nurtureFamilyGrowthOutboxEvent.deleteMany({ where });
  await database.nurturePublicationVisibilityEvent.deleteMany({ where });
  await database.nurturePublicationRelease.deleteMany({ where });
  await database.nurtureChildLinkReceipt.deleteMany({ where });
  await database.nurturePublishProcessTarget.deleteMany({ where });
  await database.nurturePublishProcess.updateMany({
    where,
    data: { state: "pending_release", currentRevisionId: null, frozenRevisionId: null },
  });
  await database.nurturePublishProcessRevision.deleteMany({ where });
  await database.nurturePublishProcess.deleteMany({ where });
  await database.nurtureChildLinkGrant.deleteMany({ where });
  await database.nurtureEnrollment.deleteMany({ where });
  await database.nurtureChildCareProcess.deleteMany({ where });
  await database.nurtureChild.deleteMany({ where });
  await database.nurtureCareRoleAssignment.deleteMany({ where });
  await database.nurtureCareGroup.deleteMany({ where });
  await database.nurtureCareInstitution.deleteMany({ where });
  await database.nurtureParticipant.deleteMany({ where });
}

async function assertResidualCensus(database) {
  const tables = await database.$queryRawUnsafe(`
    SELECT table_name
    FROM information_schema.columns
    WHERE table_schema = 'public' AND column_name = 'workspace_id'
    ORDER BY table_name
  `);
  const residual = [];
  for (const { table_name: tableName } of tables) {
    const quoted = `"${String(tableName).replaceAll('"', '""')}"`;
    const rows = await database.$queryRawUnsafe(
      `SELECT COUNT(*)::int AS count FROM ${quoted} WHERE "workspace_id" LIKE $1`,
      `${workspacePrefix}%`,
    );
    const count = rows[0]?.count ?? -1;
    if (count !== 0) residual.push({ table: tableName, count });
  }
  if (residual.length > 0) {
    throw new Error(`T-011 N3 qualification left residual data: ${JSON.stringify(residual)}`);
  }
}

function runNode(entry, args, env) {
  const result = spawnSync(process.execPath, [entry, ...args], {
    cwd: repoRoot,
    env,
    stdio: "inherit",
    windowsHide: true,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${path.basename(entry)} failed with exit code ${result.status}`);
  }
}
