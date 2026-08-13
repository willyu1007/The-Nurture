#!/usr/bin/env node
// T-011 W5 N3: pin the additive provider-outbox tenant/lineage constraints
// that Prisma relation declarations alone do not prove survived migration SQL.
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const migrationsDirectory = join(root, "prisma/migrations");
const migrationPath = join(
  migrationsDirectory,
  "20260813120000_t011_family_growth_outbox_scope/migration.sql",
);
const schemaPath = join(root, "prisma/schema.prisma");
const failures = [];
const migrationStatements = sqlStatements(read(migrationPath));
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
  if (!migrationStatements.includes(normalized)) failures.push(`migration: missing ${label}`);
}

for (const [label, statement] of [
  [
    "release workspace target unique",
    `CREATE UNIQUE INDEX "uq_nurture_publication_release_workspace_id" ON "nurture_publication_release"("workspace_id", "id")`,
  ],
  [
    "visibility workspace/release target unique",
    `CREATE UNIQUE INDEX "uq_nurture_visibility_event_workspace_release_id" ON "nurture_publication_visibility_event"("workspace_id", "publication_release_id", "id")`,
  ],
  [
    "outbox workspace target unique",
    `CREATE UNIQUE INDEX "uq_nurture_family_growth_outbox_workspace_id" ON "nurture_family_growth_outbox_event"("workspace_id", "id")`,
  ],
  [
    "outbox visibility source unique",
    `CREATE UNIQUE INDEX "uq_nurture_family_growth_outbox_workspace_visibility" ON "nurture_family_growth_outbox_event"("workspace_id", "publication_release_id", "visibility_event_id")`,
  ],
  [
    "workspace-scoped release FK",
    `ALTER TABLE "nurture_family_growth_outbox_event" ADD CONSTRAINT "fk_nurture_fg_outbox_workspace_release" FOREIGN KEY ("workspace_id", "publication_release_id") REFERENCES "nurture_publication_release"("workspace_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE`,
  ],
  [
    "workspace/release-scoped visibility FK",
    `ALTER TABLE "nurture_family_growth_outbox_event" ADD CONSTRAINT "fk_nurture_fg_outbox_workspace_release_visibility" FOREIGN KEY ("workspace_id", "publication_release_id", "visibility_event_id") REFERENCES "nurture_publication_visibility_event"("workspace_id", "publication_release_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE`,
  ],
  [
    "workspace-scoped receipt FK",
    `ALTER TABLE "nurture_family_growth_admission_receipt" ADD CONSTRAINT "fk_nurture_fg_receipt_workspace_outbox" FOREIGN KEY ("workspace_id", "outbox_event_id") REFERENCES "nurture_family_growth_outbox_event"("workspace_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE`,
  ],
]) requireStatement(label, statement);

function isAllowedMigrationStatement(statement) {
  if (statement === "BEGIN" || statement === "COMMIT") return true;
  if (/^CREATE UNIQUE INDEX "[^"]+" ON "[^"]+"\("[^"]+"(?:, "[^"]+")*\)$/u.test(statement)) {
    return true;
  }
  // Fully anchored single-action shape: a trailing comma-clause such as
  // `, DROP COLUMN "x"` cannot match because the expression must end at
  // the final ON DELETE/ON UPDATE clause. Only FOREIGN KEY constraint
  // additions are allowlisted; unique enforcement travels exclusively via
  // the CREATE UNIQUE INDEX shape above.
  if (
    /^ALTER TABLE "[^"]+" ADD CONSTRAINT "[^"]+" FOREIGN KEY \("[^"]+"(?:, "[^"]+")*\) REFERENCES "[^"]+"\("[^"]+"(?:, "[^"]+")*\)(?: ON DELETE (?:RESTRICT|NO ACTION|CASCADE|SET NULL|SET DEFAULT))?(?: ON UPDATE (?:RESTRICT|NO ACTION|CASCADE|SET NULL|SET DEFAULT))?$/iu.test(
      statement,
    )
  ) {
    return true;
  }
  return /^COMMENT ON (?:TABLE|COLUMN|CONSTRAINT|INDEX) [^;]+$/iu.test(statement);
}

for (const statement of migrationStatements) {
  if (!isAllowedMigrationStatement(statement)) {
    failures.push(`migration: statement is outside the additive allowlist: ${statement}`);
  }
}

for (const forbidden of [
  "DO $$ BEGIN NULL; END $$",
  "WITH removed AS (DELETE FROM example RETURNING *) SELECT * FROM removed",
  "ALTER TYPE example ADD VALUE 'unsafe'",
]) {
  if (isAllowedMigrationStatement(forbidden)) {
    failures.push(`guard self-check: forbidden statement shape was allowlisted: ${forbidden}`);
  }
}

// Build the current FK schema by replaying ADD/DROP constraint declarations
// from every migration in order. This proves a legacy FK still exists at the
// current head instead of merely finding its name in the historical file that
// first introduced it.
function currentForeignKeys() {
  const foreignKeys = new Map();
  const migrationDirectories = readdirSync(migrationsDirectory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  for (const directory of migrationDirectories) {
    const statements = sqlStatements(read(join(migrationsDirectory, directory, "migration.sql")));
    for (const statement of statements) {
      const add = statement.match(
        /^ALTER TABLE "([^"]+)" ADD CONSTRAINT "([^"]+)" FOREIGN KEY \(([^)]+)\) REFERENCES "([^"]+)"\(([^)]+)\)/iu,
      );
      if (add) {
        foreignKeys.set(add[2], {
          table: add[1],
          columns: normalize(add[3]),
          referencedTable: add[4],
          referencedColumns: normalize(add[5]),
        });
      }
      const drop = statement.match(
        /^ALTER TABLE "([^"]+)" DROP CONSTRAINT(?: IF EXISTS)? "([^"]+)"/iu,
      );
      if (drop) foreignKeys.delete(drop[2]);
    }
  }
  return foreignKeys;
}

const foreignKeys = currentForeignKeys();
for (const [name, expected] of [
  [
    "nurture_family_growth_outbox_event_publication_release_id_fkey",
    {
      table: "nurture_family_growth_outbox_event",
      columns: '"publication_release_id"',
      referencedTable: "nurture_publication_release",
      referencedColumns: '"id"',
    },
  ],
  [
    "nurture_family_growth_outbox_event_visibility_event_id_fkey",
    {
      table: "nurture_family_growth_outbox_event",
      columns: '"visibility_event_id"',
      referencedTable: "nurture_publication_visibility_event",
      referencedColumns: '"id"',
    },
  ],
  [
    "nurture_family_growth_admission_receipt_outbox_event_id_fkey",
    {
      table: "nurture_family_growth_admission_receipt",
      columns: '"outbox_event_id"',
      referencedTable: "nurture_family_growth_outbox_event",
      referencedColumns: '"id"',
    },
  ],
]) {
  const actual = foreignKeys.get(name);
  if (!actual || JSON.stringify(actual) !== JSON.stringify(expected)) {
    failures.push(`current migration schema: missing or changed legacy FK ${name}`);
  }
}

for (const [label, fragment] of [
  [
    "release composite unique",
    `@@unique([workspaceId, id], map: "uq_nurture_publication_release_workspace_id")`,
  ],
  [
    "visibility composite unique",
    `@@unique([workspaceId, publicationReleaseId, id], map: "uq_nurture_visibility_event_workspace_release_id")`,
  ],
  [
    "outbox composite release relation",
    `@relation(fields: [workspaceId, publicationReleaseId], references: [workspaceId, id], onDelete: Restrict, map: "fk_nurture_fg_outbox_workspace_release")`,
  ],
  [
    "outbox composite visibility relation",
    `@relation(fields: [workspaceId, publicationReleaseId, visibilityEventId], references: [workspaceId, publicationReleaseId, id], onDelete: Restrict, map: "fk_nurture_fg_outbox_workspace_release_visibility")`,
  ],
  [
    "receipt composite outbox relation",
    `@relation(fields: [workspaceId, outboxEventId], references: [workspaceId, id], onDelete: Restrict, map: "fk_nurture_fg_receipt_workspace_outbox")`,
  ],
]) {
  if (!schema.includes(normalize(fragment))) failures.push(`schema: missing ${label}`);
}

if (failures.length > 0) {
  for (const failure of failures) console.error(`[error] ${failure}`);
  process.exit(1);
}

console.log(
  "[ok] family-growth outbox invariants pinned: parsed additive SQL allowlist, 4 uniques, 3 composite FKs, 3 current legacy FKs",
);
