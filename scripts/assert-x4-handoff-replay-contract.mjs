#!/usr/bin/env node

import { readFile } from "node:fs/promises";

const migrationPath =
  "prisma/migrations/20260728160000_nurture_canonical_ref_v1/migration.sql";
const [schema, migration] = await Promise.all([
  readFile("prisma/schema.prisma", "utf8"),
  readFile(migrationPath, "utf8"),
]);

const failures = [];
const requireMatch = (pattern, message) => {
  if (!pattern.test(migration)) failures.push(message);
};

if (!/handoffRequestSnapshotsPayload\s+Json/.test(schema)) {
  failures.push("Execution snapshot payload is not required JSON in Prisma");
}
if (!/handoffDriverRef\s+Json\?/.test(schema)) {
  failures.push("Execution durable driver ref is not optional JSON in Prisma");
}
requireMatch(
  /DROP CONSTRAINT "ck_nurture_command_execution_handoff_v1"/,
  "Canonical-ref migration does not replace the legacy X4 replay constraint",
);
requireMatch(
  /ADD CONSTRAINT "ck_nurture_command_execution_handoff_v2"/,
  "Canonical-ref migration does not add the v2 replay-seed constraint",
);
requireMatch(
  /SET "handoff_driver_ref" = jsonb_build_object\([\s\S]*'schema_version', 1[\s\S]*'namespace', 'my_chat'/,
  "Legacy durable drivers are not migrated to the canonical reference shape",
);
requireMatch(
  /SET "handoff_request_snapshots_payload" = transformed_snapshots\.payload/,
  "Legacy replay snapshot refs are not migrated to the canonical reference shape",
);
requireMatch(
  /jsonb_array_length\("handoff_request_snapshots_payload"\) <= 32/,
  "X4 replay seed is not bounded to the host batch limit",
);
requireMatch(
  /jsonb_array_length\("handoff_request_snapshots_payload"\) = 0[\s\S]*"handoff_driver_ref" IS NULL/,
  "Explicit-empty Executions do not require a null durable driver",
);
requireMatch(
  /jsonb_array_length\("handoff_request_snapshots_payload"\) > 0[\s\S]*jsonb_typeof\("handoff_driver_ref"\) = 'object'/,
  "Non-empty replay seeds do not require a durable driver object",
);
for (const expected of [
  "'schema_version' = '1'::jsonb",
  "'namespace' = 'my_chat'",
  "'object_type' = 'workflow_step'",
]) {
  if (!migration.includes(expected)) failures.push(`Durable driver constraint is missing ${expected}`);
}
for (const forbidden of ["version", "claimToken", "claim_token", "expectedStepVersion"]) {
  if (!migration.includes(`? '${forbidden}'`)) {
    failures.push(`Durable driver constraint does not forbid ${forbidden}`);
  }
}
requireMatch(
  /"handoff_driver_ref" = jsonb_build_object\([\s\S]*'schema_version', 1,[\s\S]*'namespace', 'my_chat',[\s\S]*'object_id', "handoff_driver_ref" ->> 'object_id'/,
  "Durable driver constraint does not reject unknown or extra object keys",
);
for (const forbiddenSnapshotField of [
  "claimToken",
  "claim_token",
  "expectedStepVersion",
  "contractHash",
  "consumer_scenario_key",
  "owner_scope",
  "canonical_ref",
  "kind",
  "id",
]) {
  if (!migration.includes(forbiddenSnapshotField)) {
    failures.push(`Replay-seed payload constraint does not forbid ${forbiddenSnapshotField}`);
  }
}
if (/CREATE TABLE\s+"workflow_|CREATE TYPE\s+"Workflow/m.test(migration)) {
  failures.push("X4 Nurture migration contains My-Chat Workflow runtime state");
}

if (failures.length > 0) {
  throw new Error(`X4 handoff replay contract violations:\n- ${failures.join("\n- ")}`);
}

process.stdout.write("[ok] X4 handoff replay contract batch=32 driver=my_chat/workflow_step schema=1\n");
