#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";

const artifactDirectory = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(artifactDirectory, "../../../../..");
const schemaPath = path.join(repoRoot, "prisma/schema.prisma");
const migrationPath = path.join(
  repoRoot,
  "prisma/migrations/20260812090000_t010_family_sharing_authority/migration.sql",
);
const testPath = path.join(
  repoRoot,
  "packages/nurture-db/tests/t010-family-sharing-c4.production-shape.integration.test.ts",
);
const prismaCli = path.join(repoRoot, "node_modules/prisma/build/index.js");
const vitestCli = path.join(repoRoot, "node_modules/vitest/vitest.mjs");
const targetEnv = "NURTURE_T010_C4_DATABASE_URL";
const approvalEnv = "NURTURE_T010_C4_DISPOSABLE_APPROVED";
const approvalValue = "I_APPROVE_T010_C4_DISPOSABLE_WRITES";

assertVehicleFiles();
if (process.argv.includes("--check-only")) {
  process.stdout.write(
    "[ok] T-010 I4-C4 qualification vehicle is deterministic and requires an explicit approved disposable target.\n",
  );
  process.exit(0);
}

const target = approvedTarget(process.env);
const prisma = new PrismaClient({ datasources: { db: { url: target.url } } });
try {
  await assertEmptyTarget(prisma, target.databaseName);
} finally {
  await prisma.$disconnect();
}

runNode(prismaCli, [
  "migrate",
  "deploy",
  "--schema",
  schemaPath,
], { ...process.env, DATABASE_URL: target.url });

runNode(vitestCli, [
  "run",
  "-c",
  path.join(repoRoot, "vitest.db.config.ts"),
  testPath,
], process.env);

const verified = new PrismaClient({ datasources: { db: { url: target.url } } });
try {
  const residual = await verified.$queryRawUnsafe(`
    SELECT
      (SELECT COUNT(*)::int FROM "nurture_participant"
        WHERE "workspace_id" LIKE 't010-c4-workspace-%') AS participants,
      (SELECT COUNT(*)::int FROM "nurture_command_execution"
        WHERE "workspace_id" LIKE 't010-c4-workspace-%') AS executions,
      (SELECT COUNT(*)::int FROM "nurture_scenario_invocation_nonce") AS nonces
  `);
  const counts = residual[0];
  if (!counts || counts.participants !== 0 || counts.executions !== 0 || counts.nonces !== 0) {
    throw new Error(`T-010 qualification left residual data: ${JSON.stringify(counts)}`);
  }
} finally {
  await verified.$disconnect();
}

process.stdout.write(
  `[ok] T-010 I4-C4 production-shape qualification passed on ${target.databaseName}; migrations remain, synthetic business data is absent.\n`,
);

function assertVehicleFiles() {
  for (const file of [schemaPath, migrationPath, testPath, prismaCli, vitestCli]) {
    if (!existsSync(file)) throw new Error(`T-010 qualification dependency is absent: ${file}`);
  }
  const migration = readFileSync(migrationPath, "utf8");
  for (const invariant of [
    'CREATE TABLE "nurture_family_sharing_authority"',
    'CREATE TABLE "nurture_family_sharing_policy"',
    'CREATE UNIQUE INDEX "uq_nurture_family_sharing_authority_current"',
    'CREATE UNIQUE INDEX "uq_nurture_family_sharing_policy_current"',
  ]) {
    if (!migration.includes(invariant)) {
      throw new Error(`T-010 C1 migration is missing qualification invariant: ${invariant}`);
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
  const databaseName = decodeURIComponent(parsed.pathname.replace(/^\//u, ""));
  if (!/^t010_i4c4_(?:test|disposable)(?:_[a-z0-9_]+)*$/u.test(databaseName)) {
    throw new Error(`${targetEnv} must name a dedicated t010_i4c4 test/disposable database.`);
  }
  if (parsed.searchParams.get("schema") && parsed.searchParams.get("schema") !== "public") {
    throw new Error(`${targetEnv} must use the isolated database public schema.`);
  }
  if (env[approvalEnv] !== approvalValue) {
    throw new Error(`${approvalEnv} must contain the exact disposable-write approval token.`);
  }
  return { url: value, databaseName };
}

async function assertEmptyTarget(database, expectedDatabaseName) {
  const identity = await database.$queryRawUnsafe(
    "SELECT current_database() AS database_name, current_schema() AS schema_name",
  );
  if (
    identity.length !== 1 ||
    identity[0]?.database_name !== expectedDatabaseName ||
    identity[0]?.schema_name !== "public"
  ) {
    throw new Error(`T-010 target identity mismatch: ${JSON.stringify(identity)}`);
  }
  const tables = await database.$queryRawUnsafe(`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename
  `);
  if (tables.length !== 0) {
    throw new Error(
      `T-010 migration runner requires an empty disposable public schema; found ${tables.length} table(s).`,
    );
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
