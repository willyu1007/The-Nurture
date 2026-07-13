#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { PrismaClient } from '@prisma/client';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const contract = JSON.parse(await readFile(path.join(repoRoot, 'docs/context/db/schema.json'), 'utf8'));
const expectedTables = contract.tables.map((table) => table.dbName).sort();
const expectedEnums = contract.enums.map((entry) => entry.name).sort();

if (expectedTables.length === 0 || expectedTables.some((name) => !name.startsWith('nurture_'))) {
  throw new Error(`Production DB contract contains non-Nurture tables: ${expectedTables.join(', ')}`);
}
if (expectedEnums.some((name) => name.startsWith('Workflow'))) {
  throw new Error(`Production DB contract contains Workflow runtime enums: ${expectedEnums.join(', ')}`);
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
    throw new Error(`Production table mismatch: expected=${expectedTables.join(',')} actual=${actualTables.join(',')}`);
  }
  if (JSON.stringify(actualEnums) !== JSON.stringify(expectedEnums)) {
    throw new Error(`Production enum mismatch: expected=${expectedEnums.join(',')} actual=${actualEnums.join(',')}`);
  }
  process.stdout.write(`[ok] production DB boundary tables=${actualTables.length} enums=${actualEnums.length}\n`);
} finally {
  await prisma.$disconnect();
}
