#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { PrismaClient } from '../apps/backend/src/generated/dev-host-prisma/index.js';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const schema = await readFile(path.join(repoRoot, 'apps/backend/prisma/schema.prisma'), 'utf8');
const expectedTables = [...schema.matchAll(/@@map\("([^"]+)"\)/g)].map((match) => match[1]).sort();
const expectedEnums = [...schema.matchAll(/^enum\s+(Workflow\w+)\s*\{/gm)].map((match) => match[1]).sort();

if (expectedTables.length === 0 || expectedTables.some((name) => !name.startsWith('workflow_'))) {
  throw new Error(`Dev-host schema contains non-workflow tables: ${expectedTables.join(', ')}`);
}
if (expectedEnums.length === 0 || expectedEnums.some((name) => !name.startsWith('Workflow'))) {
  throw new Error(`Dev-host schema contains invalid runtime enums: ${expectedEnums.join(', ')}`);
}

const prisma = new PrismaClient();
try {
  const tableRows = await prisma.$queryRaw`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = current_schema()
      AND tablename <> '_prisma_migrations'
    ORDER BY tablename
  `;
  const enumRows = await prisma.$queryRaw`
    SELECT type.typname
    FROM pg_type AS type
    JOIN pg_namespace AS namespace ON namespace.oid = type.typnamespace
    WHERE namespace.nspname = current_schema()
      AND type.typtype = 'e'
    ORDER BY type.typname
  `;
  const actualTables = tableRows.map((row) => row.tablename).sort();
  const actualEnums = enumRows.map((row) => row.typname).sort();

  if (JSON.stringify(actualTables) !== JSON.stringify(expectedTables)) {
    throw new Error(`Dev-host table mismatch: expected=${expectedTables.join(',')} actual=${actualTables.join(',')}`);
  }
  if (JSON.stringify(actualEnums) !== JSON.stringify(expectedEnums)) {
    throw new Error(`Dev-host enum mismatch: expected=${expectedEnums.join(',')} actual=${actualEnums.join(',')}`);
  }
  process.stdout.write(`[ok] dev-host DB boundary tables=${actualTables.length} enums=${actualEnums.length}\n`);
} finally {
  await prisma.$disconnect();
}
