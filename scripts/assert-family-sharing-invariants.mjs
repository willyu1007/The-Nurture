#!/usr/bin/env node
// T-010 I4-C1: the exactly-one-current and scope-integrity guarantees live in
// hand-authored SQL that Prisma (and the generated docs/context/db/schema.json)
// cannot express. This verifier pins them so silent removal from the unapplied
// migration cannot pass unnoticed.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const migrationPath = join(
  root,
  "prisma/migrations/20260812090000_t010_family_sharing_authority/migration.sql",
);
const schemaPath = join(root, "prisma/schema.prisma");

const failures = [];
const migration = normalize(read(migrationPath));
const schema = normalize(read(schemaPath));

function read(path) {
  try {
    return readFileSync(path, "utf8");
  } catch {
    failures.push(`missing file: ${path}`);
    return "";
  }
}

function normalize(text) {
  return text.replace(/\s+/g, " ");
}

function requireFragment(haystackName, haystack, label, fragment) {
  if (!haystack.includes(normalize(fragment))) {
    failures.push(`${haystackName}: missing ${label}`);
  }
}

requireFragment(
  "migration",
  migration,
  "preview-only marker",
  "intentionally not applied by this task",
);

for (const table of [
  "nurture_family_sharing_authority",
  "nurture_family_sharing_policy",
]) {
  requireFragment(
    "migration",
    migration,
    `${table} direction CHECK`,
    `ADD CONSTRAINT "ck_${table}_direction" CHECK ( ("category" = 'daily_activity' AND "direction" = 'nurture_to_family') OR ("category" IN ('media', 'focus_collaboration') AND "direction" = 'family_to_nurture') )`,
  );
  requireFragment(
    "migration",
    migration,
    `${table} purpose CHECK`,
    `ADD CONSTRAINT "ck_${table}_purpose" CHECK ("purpose" = 'family_nurture_sharing_authorization')`,
  );
  requireFragment(
    "migration",
    migration,
    `${table} revocation CHECK`,
    `ADD CONSTRAINT "ck_${table}_revocation" CHECK (("status" = 'revoked') = ("revoked_at" IS NOT NULL))`,
  );
  requireFragment(
    "migration",
    migration,
    `${table} expiry CHECK`,
    `ADD CONSTRAINT "ck_${table}_expiry" CHECK ("expires_at" IS NULL OR "expires_at" > "effective_from")`,
  );
}

requireFragment(
  "migration",
  migration,
  "authority partial unique (at most one active per scope)",
  `CREATE UNIQUE INDEX "uq_nurture_family_sharing_authority_current" ON "nurture_family_sharing_authority" ("workspace_id", "child_care_process_id", "family_id", "enrollment_id", "category") WHERE "status" = 'active'`,
);
requireFragment(
  "migration",
  migration,
  "policy partial unique (at most one active per scope+axis)",
  `CREATE UNIQUE INDEX "uq_nurture_family_sharing_policy_current" ON "nurture_family_sharing_policy" ("workspace_id", "child_care_process_id", "family_id", "enrollment_id", "category", "axis") WHERE "status" = 'active'`,
);

for (const unique of [
  `CREATE UNIQUE INDEX "uq_nurture_child_care_process_workspace_id" ON "nurture_child_care_process"("workspace_id", "id")`,
  `CREATE UNIQUE INDEX "uq_nurture_family_workspace_process_id" ON "nurture_family"("workspace_id", "child_care_process_id", "id")`,
  `CREATE UNIQUE INDEX "uq_nurture_enrollment_workspace_process_id" ON "nurture_enrollment"("workspace_id", "child_care_process_id", "id")`,
  `CREATE UNIQUE INDEX "uq_nurture_care_role_assignment_workspace_role_id" ON "nurture_care_role_assignment"("workspace_id", "role", "id")`,
]) {
  requireFragment("migration", migration, "composite FK target unique", unique);
}

for (const prefix of [
  "nurture_family_sharing_authority",
  "nurture_family_sharing_policy",
]) {
  for (const [name, fkColumns] of [
    ["process_id_fkey", 'FOREIGN KEY ("workspace_id", "child_care_process_id")'],
    [
      "family_id_fkey",
      'FOREIGN KEY ("workspace_id", "child_care_process_id", "family_id")',
    ],
    [
      "enrollment_id_fkey",
      'FOREIGN KEY ("workspace_id", "child_care_process_id", "enrollment_id")',
    ],
    [
      "role_assignment_id_fkey",
      'FOREIGN KEY ("workspace_id", "authorizing_role", "authorizing_role_assignment_id")',
    ],
  ]) {
    requireFragment(
      "migration",
      migration,
      `${prefix} composite FK ${name}`,
      `ADD CONSTRAINT "${prefix}_${name}" ${fkColumns}`,
    );
  }
}

for (const model of [
  "model NurtureFamilySharingAuthority",
  "model NurtureFamilySharingPolicy",
  "enum NurtureFamilySharingCategory",
  "enum NurtureFamilySharingDirection",
  "enum NurtureFamilySharingPolicyAxis",
  "enum NurtureFamilySharingRecordStatus",
]) {
  requireFragment("schema", schema, model, model);
}

if (failures.length > 0) {
  for (const failure of failures) console.error(`[error] ${failure}`);
  process.exit(1);
}
console.log(
  "[ok] family-sharing invariants pinned: 8 CHECKs, 2 partial uniques, 4 target uniques, 8 composite FKs",
);
