#!/usr/bin/env node

import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function collect(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await collect(absolute)));
    else if (entry.isFile() && entry.name.endsWith('.test.ts')) files.push(path.relative(repoRoot, absolute).split(path.sep).join('/'));
  }
  return files;
}

const files = [...(await collect(path.join(repoRoot, 'packages'))), ...(await collect(path.join(repoRoot, 'apps')))];
const routes = { unit: [], productionDb: [], devHost: [], unclassified: [] };
for (const file of files.sort()) {
  if (file.startsWith('packages/nurture-scenario/')) routes.unit.push(file);
  else if (file.startsWith('packages/nurture-db/')) routes.productionDb.push(file);
  else if (file.startsWith('apps/backend/') && file.endsWith('.e2e.test.ts')) routes.devHost.push(file);
  else routes.unclassified.push(file);
}

if (routes.unclassified.length > 0) throw new Error(`Unclassified tests: ${routes.unclassified.join(', ')}`);
if (routes.unit.length !== 19 || routes.productionDb.length !== 3 || routes.devHost.length !== 8) {
  throw new Error(
    `Test file census changed: unit=${routes.unit.length}/19 productionDb=${routes.productionDb.length}/3 devHost=${routes.devHost.length}/8`,
  );
}
process.stdout.write(
  `[ok] test routing files=${files.length} unit=${routes.unit.length} production-db=${routes.productionDb.length} dev-host=${routes.devHost.length}\n`,
);
