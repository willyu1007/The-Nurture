#!/usr/bin/env node

import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relativePath) => readFile(path.join(repoRoot, relativePath), 'utf8');
const readMigrationStream = async (relativeRoot) => {
  const entries = await readdir(path.join(repoRoot, relativeRoot), { recursive: true });
  const migrationPaths = entries
    .filter((entry) => entry.endsWith('migration.sql'))
    .sort()
    .map((entry) => path.join(relativeRoot, entry));
  return (await Promise.all(migrationPaths.map((migrationPath) => read(migrationPath)))).join('\n');
};
const failures = [];
const reject = (label, content, pattern) => {
  if (pattern.test(content)) failures.push(`${label} matched ${pattern}`);
};

const productionSchema = await read('prisma/schema.prisma');
const productionMigration = await readMigrationStream('prisma/migrations');
const nurtureDbExports = await read('packages/nurture-db/src/index.ts');
reject('production schema', productionSchema, /^(?:model|enum) Workflow/m);
reject('production schema', productionSchema, /@@map\("workflow_/);
reject('production migration', productionMigration, /(?:CREATE TABLE|ALTER TABLE|REFERENCES) "workflow_/);
reject('production migration', productionMigration, /CREATE TYPE "Workflow/);
reject('Nurture DB exports', nurtureDbExports, /Workflow(?:Run|Step|Artifact|Approval|ContextBinding|OutboxEvent|StepResultStatus|ApprovalStatus)/);

const devHostSchema = await read('apps/backend/prisma/schema.prisma');
const devHostMigration = await readMigrationStream('apps/backend/prisma/migrations');
reject('dev-host schema', devHostSchema, /^(?:model|enum) Nurture/m);
reject('dev-host schema', devHostSchema, /@@map\("nurture_/);
reject('dev-host migration', devHostMigration, /(?:CREATE TABLE|ALTER TABLE|REFERENCES) "nurture_/);
reject('dev-host migration', devHostMigration, /CREATE TYPE "Nurture/);

for (const relativePath of [
  'apps/backend/src/actions/action-service.ts',
  'apps/backend/src/deps/mock-deps.ts',
  'apps/backend/src/dispatcher.ts',
  'apps/backend/src/ledger/pg-workflow-ledger.repository.ts',
  'apps/backend/src/runtime/pg-workflow-runtime.port.ts',
]) {
  reject(relativePath, await read(relativePath), /from "@the-nurture\/db"/);
}

for (const relativePath of [
  'apps/backend/src/app.ts',
  'apps/backend/src/server.ts',
  'apps/backend/tests/approval-pause-resume.e2e.test.ts',
  'apps/backend/tests/nurture-family-rule-trial-first-slice.e2e.test.ts',
  'apps/backend/tests/p3-audit-fixes.e2e.test.ts',
  'apps/backend/tests/p4-audit-fixes.e2e.test.ts',
  'apps/backend/tests/safety-escalation.e2e.test.ts',
  'apps/backend/tests/thin-vertical.e2e.test.ts',
  'apps/backend/tests/two-issue-types.e2e.test.ts',
]) {
  reject(relativePath, await read(relativePath), /app\.prisma\b/);
}

if (failures.length > 0) throw new Error(`Persistence boundary violations:\n- ${failures.join('\n- ')}`);
process.stdout.write('[ok] persistence source boundaries are isolated\n');
