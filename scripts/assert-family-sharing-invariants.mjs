#!/usr/bin/env node
// T-011 W5 N7: pin the family-sharing authority guarantees that Prisma and
// docs/context/db/schema.json cannot express. Assertions operate on parsed,
// comment-free statements so text in comments cannot masquerade as coverage.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const migrationPath = join(
  root,
  "prisma/migrations/20260812090000_t010_family_sharing_authority/migration.sql",
);
const schemaPath = join(root, "prisma/schema.prisma");
const failures = [];
const migrationSource = read(migrationPath);
const migrationStatements = sqlStatements(migrationSource);
const schema = normalize(read(schemaPath));
const requiredStatements = new Set();

function read(path) {
  try {
    return readFileSync(path, "utf8");
  } catch {
    failures.push(`missing file: ${path}`);
    return "";
  }
}

function normalize(text) {
  return text.replace(/\s+/gu, " ").trim().replace(/;$/u, "");
}

function stripSqlComments(text) {
  let output = "";
  let mode = "plain";
  let dollarTag = "";
  for (let index = 0; index < text.length;) {
    const character = text[index];
    const next = text[index + 1];
    if (mode === "line-comment") {
      if (character === "\n") {
        output += "\n";
        mode = "plain";
      } else {
        output += " ";
      }
      index += 1;
      continue;
    }
    if (mode === "block-comment") {
      if (character === "*" && next === "/") {
        output += "  ";
        mode = "plain";
        index += 2;
      } else {
        output += character === "\n" ? "\n" : " ";
        index += 1;
      }
      continue;
    }
    if (mode === "single-quote") {
      output += character;
      if (character === "'" && next === "'") {
        output += next;
        index += 2;
      } else {
        if (character === "'") mode = "plain";
        index += 1;
      }
      continue;
    }
    if (mode === "double-quote") {
      output += character;
      if (character === '"' && next === '"') {
        output += next;
        index += 2;
      } else {
        if (character === '"') mode = "plain";
        index += 1;
      }
      continue;
    }
    if (mode === "dollar-quote") {
      if (text.startsWith(dollarTag, index)) {
        output += dollarTag;
        index += dollarTag.length;
        mode = "plain";
      } else {
        output += character;
        index += 1;
      }
      continue;
    }
    if (character === "-" && next === "-") {
      output += "  ";
      mode = "line-comment";
      index += 2;
      continue;
    }
    if (character === "/" && next === "*") {
      output += "  ";
      mode = "block-comment";
      index += 2;
      continue;
    }
    if (character === "'") mode = "single-quote";
    if (character === '"') mode = "double-quote";
    if (character === "$") {
      const match = text.slice(index).match(/^\$(?:[A-Za-z_][A-Za-z0-9_]*)?\$/u);
      if (match) {
        dollarTag = match[0];
        output += dollarTag;
        index += dollarTag.length;
        mode = "dollar-quote";
        continue;
      }
    }
    output += character;
    index += 1;
  }
  return output;
}

function sqlStatements(text) {
  const stripped = stripSqlComments(text);
  const statements = [];
  let current = "";
  let mode = "plain";
  let dollarTag = "";
  for (let index = 0; index < stripped.length;) {
    const character = stripped[index];
    const next = stripped[index + 1];
    if (mode === "single-quote") {
      current += character;
      if (character === "'" && next === "'") {
        current += next;
        index += 2;
      } else {
        if (character === "'") mode = "plain";
        index += 1;
      }
      continue;
    }
    if (mode === "double-quote") {
      current += character;
      if (character === '"' && next === '"') {
        current += next;
        index += 2;
      } else {
        if (character === '"') mode = "plain";
        index += 1;
      }
      continue;
    }
    if (mode === "dollar-quote") {
      if (stripped.startsWith(dollarTag, index)) {
        current += dollarTag;
        index += dollarTag.length;
        mode = "plain";
      } else {
        current += character;
        index += 1;
      }
      continue;
    }
    if (character === "'") mode = "single-quote";
    if (character === '"') mode = "double-quote";
    if (character === "$") {
      const match = stripped.slice(index).match(/^\$(?:[A-Za-z_][A-Za-z0-9_]*)?\$/u);
      if (match) {
        dollarTag = match[0];
        current += dollarTag;
        index += dollarTag.length;
        mode = "dollar-quote";
        continue;
      }
    }
    if (character === ";") {
      const statement = normalize(current);
      if (statement) statements.push(statement);
      current = "";
      index += 1;
      continue;
    }
    current += character;
    index += 1;
  }
  const trailing = normalize(current);
  if (trailing) statements.push(trailing);
  return statements;
}

function requireStatement(label, expected) {
  const normalized = normalize(expected);
  requiredStatements.add(normalized);
  const count = migrationStatements.filter((statement) => statement === normalized).length;
  if (count !== 1) {
    failures.push(`migration: ${label} must appear exactly once (found ${count})`);
  }
}

if (!migrationSource.includes("intentionally not applied by this task")) {
  failures.push("migration: missing preview-only marker");
}

const tables = [
  "nurture_family_sharing_authority",
  "nurture_family_sharing_policy",
];
const checks = [
  [
    "direction",
    `CHECK ( ("category" = 'daily_activity' AND "direction" = 'nurture_to_family') OR ("category" IN ('media', 'focus_collaboration') AND "direction" = 'family_to_nurture') )`,
  ],
  [
    "purpose",
    `CHECK ("purpose" = 'family_nurture_sharing_authorization')`,
  ],
  [
    "revocation",
    `CHECK (("status" = 'revoked') = ("revoked_at" IS NOT NULL))`,
  ],
  [
    "expiry",
    `CHECK ("expires_at" IS NULL OR "expires_at" > "effective_from")`,
  ],
];
for (const table of tables) {
  for (const [suffix, definition] of checks) {
    requireStatement(
      `${table} ${suffix} CHECK bound to its owning table`,
      `ALTER TABLE "${table}" ADD CONSTRAINT "ck_${table}_${suffix}" ${definition}`,
    );
  }
}

for (const [label, statement] of [
  [
    "authority partial unique (at most one active per scope)",
    `CREATE UNIQUE INDEX "uq_nurture_family_sharing_authority_current" ON "nurture_family_sharing_authority" ("workspace_id", "child_care_process_id", "family_id", "enrollment_id", "category") WHERE "status" = 'active'`,
  ],
  [
    "policy partial unique (at most one active per scope+axis)",
    `CREATE UNIQUE INDEX "uq_nurture_family_sharing_policy_current" ON "nurture_family_sharing_policy" ("workspace_id", "child_care_process_id", "family_id", "enrollment_id", "category", "axis") WHERE "status" = 'active'`,
  ],
  [
    "process composite FK target unique",
    `CREATE UNIQUE INDEX "uq_nurture_child_care_process_workspace_id" ON "nurture_child_care_process"("workspace_id", "id")`,
  ],
  [
    "family composite FK target unique",
    `CREATE UNIQUE INDEX "uq_nurture_family_workspace_process_id" ON "nurture_family"("workspace_id", "child_care_process_id", "id")`,
  ],
  [
    "enrollment composite FK target unique",
    `CREATE UNIQUE INDEX "uq_nurture_enrollment_workspace_process_id" ON "nurture_enrollment"("workspace_id", "child_care_process_id", "id")`,
  ],
  [
    "role-assignment composite FK target unique",
    `CREATE UNIQUE INDEX "uq_nurture_care_role_assignment_workspace_role_id" ON "nurture_care_role_assignment"("workspace_id", "role", "id")`,
  ],
]) requireStatement(label, statement);

const foreignKeys = [
  [
    "process_id_fkey",
    `"workspace_id", "child_care_process_id"`,
    "nurture_child_care_process",
    `"workspace_id", "id"`,
  ],
  [
    "family_id_fkey",
    `"workspace_id", "child_care_process_id", "family_id"`,
    "nurture_family",
    `"workspace_id", "child_care_process_id", "id"`,
  ],
  [
    "enrollment_id_fkey",
    `"workspace_id", "child_care_process_id", "enrollment_id"`,
    "nurture_enrollment",
    `"workspace_id", "child_care_process_id", "id"`,
  ],
  [
    "role_assignment_id_fkey",
    `"workspace_id", "authorizing_role", "authorizing_role_assignment_id"`,
    "nurture_care_role_assignment",
    `"workspace_id", "role", "id"`,
  ],
];
for (const table of tables) {
  for (const [suffix, columns, referencedTable, referencedColumns] of foreignKeys) {
    requireStatement(
      `${table} composite FK ${suffix} with exact target and actions`,
      `ALTER TABLE "${table}" ADD CONSTRAINT "${table}_${suffix}" FOREIGN KEY (${columns}) REFERENCES "${referencedTable}"(${referencedColumns}) ON DELETE RESTRICT ON UPDATE CASCADE`,
    );
  }
}

function isAllowedMigrationStatement(statement) {
  if (statement === "BEGIN" || statement === "COMMIT") return true;
  if (requiredStatements.has(statement)) return true;
  if (/^CREATE TYPE "[^"]+" AS ENUM \('[^']+'(?:, '[^']+')*\)$/u.test(statement)) {
    return true;
  }
  if (
    /^CREATE TABLE "[^"]+" \(.+ CONSTRAINT "[^"]+" PRIMARY KEY \("[^"]+"\) \)$/u.test(
      statement,
    )
  ) {
    return true;
  }
  if (
    /^CREATE (?:UNIQUE )?INDEX "[^"]+" ON "[^"]+" ?\("[^"]+"(?:, "[^"]+")*\)(?: WHERE "[^"]+" = '[^']+')?$/u.test(
      statement,
    )
  ) {
    return true;
  }
  // Fully anchored single-action FK shape. A trailing comma-clause cannot
  // match after the final referential action.
  return /^ALTER TABLE "[^"]+" ADD CONSTRAINT "[^"]+" FOREIGN KEY \("[^"]+"(?:, "[^"]+")*\) REFERENCES "[^"]+"\("[^"]+"(?:, "[^"]+")*\)(?: ON DELETE (?:RESTRICT|NO ACTION|CASCADE|SET NULL|SET DEFAULT))?(?: ON UPDATE (?:RESTRICT|NO ACTION|CASCADE|SET NULL|SET DEFAULT))?$/iu.test(
    statement,
  );
}

for (const statement of migrationStatements) {
  if (!isAllowedMigrationStatement(statement)) {
    failures.push(`migration: statement is outside the additive allowlist: ${statement}`);
  }
}

const representativeForeignKey =
  `ALTER TABLE "nurture_family_sharing_authority" ADD CONSTRAINT "example_fkey" ` +
  `FOREIGN KEY ("workspace_id") REFERENCES "nurture_child_care_process"("workspace_id") ` +
  `ON DELETE RESTRICT ON UPDATE CASCADE`;
for (const forbidden of [
  "DO $$ BEGIN NULL; END $$",
  "WITH removed AS (DELETE FROM example RETURNING *) SELECT * FROM removed",
  "ALTER TYPE example ADD VALUE 'unsafe'",
  `${representativeForeignKey}, DROP COLUMN "workspace_id"`,
  `ALTER TABLE "wrong_table" ADD CONSTRAINT "ck_nurture_family_sharing_authority_purpose" CHECK ("purpose" = 'family_nurture_sharing_authorization')`,
]) {
  if (isAllowedMigrationStatement(forbidden)) {
    failures.push(`guard self-check: forbidden statement shape was allowlisted: ${forbidden}`);
  }
}
if (sqlStatements(`-- ${representativeForeignKey};`).length !== 0) {
  failures.push("guard self-check: SQL inside a comment was parsed as a statement");
}

for (const model of [
  "model NurtureFamilySharingAuthority",
  "model NurtureFamilySharingPolicy",
  "enum NurtureFamilySharingCategory",
  "enum NurtureFamilySharingDirection",
  "enum NurtureFamilySharingPolicyAxis",
  "enum NurtureFamilySharingRecordStatus",
]) {
  if (!schema.includes(normalize(model))) failures.push(`schema: missing ${model}`);
}

if (failures.length > 0) {
  for (const failure of failures) console.error(`[error] ${failure}`);
  process.exit(1);
}
console.log(
  "[ok] family-sharing invariants pinned: parsed additive SQL allowlist, 8 table-bound CHECKs, 2 partial uniques, 4 target uniques, 8 complete composite FKs",
);
