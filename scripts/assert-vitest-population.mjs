#!/usr/bin/env node

import { readFile } from 'node:fs/promises';

const [resultPath, label, minimumText] = process.argv.slice(2);
const minimum = Number.parseInt(minimumText ?? '', 10);

if (!resultPath || !label || !Number.isInteger(minimum) || minimum < 1) {
  process.stderr.write('Usage: node scripts/assert-vitest-population.mjs <result.json> <label> <minimum>\n');
  process.exit(2);
}

const result = JSON.parse(await readFile(resultPath, 'utf8'));
const total = Number(result.numTotalTests);
const passed = Number(result.numPassedTests);
const failed = Number(result.numFailedTests);

if (result.success !== true || !Number.isInteger(total) || total < minimum || passed !== total || failed !== 0) {
  throw new Error(
    `${label} population gate failed: success=${result.success} total=${total} passed=${passed} failed=${failed} minimum=${minimum}`,
  );
}

process.stdout.write(`[ok] ${label} population total=${total} passed=${passed} minimum=${minimum}\n`);
