#!/usr/bin/env node

/**
 * Surface terminology guard.
 *
 * The B3-0 surface lock separates two things that were historically written as
 * one: My-Chat's generic `web_run_workbench` (Workflow Run surface, MUST NOT
 * grant Nurture business access) and Nurture's own `web_domain_workbench`
 * (business workbench, route namespace `/nurture`, current instance
 * `institution_workbench`). Prose that predates the lock keeps re-introducing
 * the conflation, so this check fails the build on the exact phrasings that
 * carry the old semantics.
 *
 * Scope: tracked text files. Machine contracts under `packages/` are excluded —
 * they are covered by the cross-repo source pin and change only through a
 * reseal, not through prose edits.
 *
 * Usage: node scripts/assert-surface-terminology.mjs [--fix-hint]
 */

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Files whose terminology is frozen by the cross-repo pin or is the guard itself. */
const EXCLUDED = [
  'scripts/assert-surface-terminology.mjs',
  'packages/',
  'docs/context/glossary.json', // canonical definitions legitimately quote both keys
];

/** Extensions worth scanning; binaries and lockfiles are skipped. */
const SCANNED_EXTENSIONS = new Set(['.md', '.json', '.yaml', '.yml', '.ts', '.tsx', '.mjs']);

/**
 * Each rule matches prose that asserts the pre-B3-0 meaning. `allow` lets a line
 * pass when it already carries the disambiguating context.
 */
const RULES = [
  {
    id: 'run-workbench-as-nurture-surface',
    // Bare "web run workbench" prose: ambiguous between the two surfaces.
    pattern: /web\s+run\s+workbench/gi,
    allow: /web_run_workbench|`web run workbench`/i,
    message:
      'bare "web run workbench" prose is ambiguous. Use `web_run_workbench` (My-Chat generic Run surface) or `web_domain_workbench` (Nurture business workbench).',
  },
  {
    id: 'independent-nurture-console',
    // The init-era claim that the Nurture console is a standalone shell.
    pattern: /The Nurture 独立 web 操作台|独立产品 shell 的 web 操作台/g,
    allow: null,
    message:
      'The Nurture web console is not an independent product shell (README.md "Non-Negotiables"). Describe it as a My-Chat-hosted scenario surface.',
  },
  {
    id: 'deep-console-alias',
    // "深度 web 操作台" was the init-era name for what is now web_domain_workbench.
    pattern: /深度\s*web\s*操作台|深度操作台/g,
    allow: /web_domain_workbench/,
    message:
      'use `web_domain_workbench` instead of the init-era name "深度 web 操作台".',
  },
];

function trackedFiles() {
  const out = execFileSync('git', ['ls-files', '-z'], { cwd: repoRoot, encoding: 'utf8' });
  return out.split('\0').filter(Boolean);
}

function isScanned(file) {
  if (EXCLUDED.some((prefix) => file === prefix || file.startsWith(prefix))) return false;
  return SCANNED_EXTENSIONS.has(path.extname(file));
}

const violations = [];

for (const file of trackedFiles().filter(isScanned)) {
  let content;
  try {
    content = readFileSync(path.join(repoRoot, file), 'utf8');
  } catch {
    continue; // unreadable or deleted between listing and read
  }
  const lines = content.split('\n');
  for (const rule of RULES) {
    lines.forEach((line, index) => {
      rule.pattern.lastIndex = 0;
      if (!rule.pattern.test(line)) return;
      if (rule.allow?.test(line)) return;
      violations.push({ file, line: index + 1, rule: rule.id, message: rule.message, text: line.trim() });
    });
  }
}

if (violations.length > 0) {
  console.error(`\n[assert-surface-terminology] ${violations.length} violation(s):\n`);
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}  [${v.rule}]`);
    console.error(`    ${v.text.slice(0, 160)}`);
    console.error(`    → ${v.message}\n`);
  }
  console.error('Canonical definitions: docs/context/glossary.json (web_run_workbench, web_domain_workbench).');
  process.exit(1);
}

console.log('[assert-surface-terminology] OK — no pre-B3-0 surface terminology found.');
