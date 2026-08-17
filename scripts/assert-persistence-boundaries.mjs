#!/usr/bin/env node

import { existsSync } from 'node:fs';
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

// T-014: the legacy workflow test host is deleted; its private schema and
// runtime must never come back.
if (existsSync(path.join(repoRoot, 'apps/backend'))) {
  failures.push('apps/backend exists: the deleted legacy host must not return');
}

if (failures.length > 0) throw new Error(`Persistence boundary violations:\n- ${failures.join('\n- ')}`);
process.stdout.write('[ok] persistence source boundaries are isolated\n');
