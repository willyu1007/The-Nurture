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
const routes = { unit: [], productionDb: [], devHost: [], scenarioService: [], x5Joint: [], unclassified: [] };
const expectedCounts = { unit: 94, productionDb: 45, devHost: 11, scenarioService: 16, x5Joint: 3 };
for (const file of files.sort()) {
  if (file.startsWith('packages/nurture-scenario/')) routes.unit.push(file);
  else if (
    file === 'packages/nurture-db/tests/x5-joint-acceptance.integration.test.ts' ||
    file === 'packages/nurture-db/tests/t009-family-growth-joint.integration.test.ts' ||
    file === 'packages/nurture-db/tests/t007-institution-knowledge-e8-joint.integration.test.ts'
  ) routes.x5Joint.push(file);
  else if (file.startsWith('packages/nurture-db/')) routes.productionDb.push(file);
  else if (file.startsWith('apps/backend/') && file.endsWith('.e2e.test.ts')) routes.devHost.push(file);
  else if (file.startsWith('apps/scenario-service/')) routes.scenarioService.push(file);
  else routes.unclassified.push(file);
}

if (routes.unclassified.length > 0) throw new Error(`Unclassified tests: ${routes.unclassified.join(', ')}`);
const mismatches = Object.entries(expectedCounts)
  .filter(([route, expected]) => routes[route].length !== expected)
  .map(([route, expected]) => `${route}=${routes[route].length}/${expected}`);
if (mismatches.length > 0) {
  throw new Error(`Test file census changed: ${mismatches.join(' ')}`);
}
process.stdout.write(
  `[ok] test routing files=${files.length} unit=${routes.unit.length} production-db=${routes.productionDb.length} dev-host=${routes.devHost.length} scenario-service=${routes.scenarioService.length} x5-joint=${routes.x5Joint.length}\n`,
);
