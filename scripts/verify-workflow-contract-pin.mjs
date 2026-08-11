#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { realpathSync } from 'node:fs';
import { lstat, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HASH_ALGORITHM = 'sha256-path-utf8-lf-content-v2';
const REQUIRED_NURTURE_EXACT_PATHS = [
  'package.json',
  'pnpm-lock.yaml',
  'pnpm-workspace.yaml',
  'tsconfig.json',
  'apps/scenario-service/package.json',
  'apps/scenario-service/src',
  'apps/scenario-service/tsconfig.build.json',
  'apps/scenario-service/tsconfig.db.json',
  'apps/scenario-service/tsconfig.json',
  'docs/context/workflow/nurture-scenario-contract.md',
  'packages/nurture-db/package.json',
  'packages/nurture-db/src',
  'packages/nurture-db/tsconfig.build.json',
  'packages/nurture-db/tsconfig.json',
  'packages/nurture-scenario/package.json',
  'packages/nurture-scenario/scenario.manifest.yaml',
  'packages/nurture-scenario/src',
  'packages/nurture-scenario/tsconfig.build.json',
  'packages/nurture-scenario/tsconfig.json',
  'prisma/migrations',
  'prisma/schema.prisma',
];

function parseArgs(argv) {
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const nurtureRepo = path.resolve(scriptDir, '..');
  const options = {
    nurtureRepo,
    pinPath: path.join(nurtureRepo, 'docs/project/integrations/my-chat-workflow-contract.json'),
    myChatRepo: path.resolve(nurtureRepo, '..', 'My-Chat'),
    workflowBaseRepo: path.resolve(nurtureRepo, '..', 'My-Workflow-Base'),
    report: false,
  };

  const nextValue = (index, argument) => {
    const value = argv[index + 1];
    if (!value || value.startsWith('--')) throw new Error(`Missing value for ${argument}`);
    return value;
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--my-chat-repo') options.myChatRepo = path.resolve(nextValue(index++, argument));
    else if (argument === '--workflow-base-repo') options.workflowBaseRepo = path.resolve(nextValue(index++, argument));
    else if (argument === '--pin') options.pinPath = path.resolve(nextValue(index++, argument));
    else if (argument === '--report') options.report = true;
    else throw new Error(`Unknown argument: ${argument}`);
  }

  return options;
}

function resolveInside(repoRoot, relativePath) {
  if (path.isAbsolute(relativePath)) throw new Error(`Contract path must be relative: ${relativePath}`);
  const resolvedRoot = path.resolve(repoRoot);
  const resolvedPath = path.resolve(resolvedRoot, relativePath);
  if (resolvedPath !== resolvedRoot && !resolvedPath.startsWith(`${resolvedRoot}${path.sep}`)) {
    throw new Error(`Contract path escapes repository root: ${relativePath}`);
  }
  return resolvedPath;
}

async function collectFiles(repoRoot, relativePath) {
  const absolutePath = resolveInside(repoRoot, relativePath);
  const metadata = await lstat(absolutePath);
  if (metadata.isSymbolicLink()) throw new Error(`Symlinks are not allowed in contract inputs: ${relativePath}`);
  if (metadata.isFile()) return [relativePath.split(path.sep).join('/')];
  if (!metadata.isDirectory()) throw new Error(`Unsupported contract input: ${relativePath}`);

  const entries = await readdir(absolutePath, { withFileTypes: true });
  const files = [];
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    const childRelativePath = path.join(relativePath, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Symlinks are not allowed in contract inputs: ${childRelativePath}`);
    if (entry.isDirectory()) files.push(...(await collectFiles(repoRoot, childRelativePath)));
    else if (entry.isFile()) files.push(childRelativePath.split(path.sep).join('/'));
    else throw new Error(`Unsupported contract input: ${childRelativePath}`);
  }
  return files;
}

export async function computeContractHash(repoRoot, contractPaths) {
  if (!Array.isArray(contractPaths) || contractPaths.length === 0) {
    throw new Error('contractPaths must contain at least one path');
  }

  const files = [];
  for (const contractPath of contractPaths) files.push(...(await collectFiles(repoRoot, contractPath)));
  const uniqueFiles = [...new Set(files)].sort();
  const hash = createHash('sha256');
  for (const relativePath of uniqueFiles) {
    hash.update(relativePath);
    hash.update('\0');
    const bytes = await readFile(resolveInside(repoRoot, relativePath));
    const source = new TextDecoder('utf-8', { fatal: true }).decode(bytes)
      .replace(/^\uFEFF/u, '')
      .replace(/\r\n?/gu, '\n');
    hash.update(source, 'utf8');
    hash.update('\0');
  }
  return { algorithm: HASH_ALGORITHM, sha256: hash.digest('hex'), files: uniqueFiles };
}

function readHead(repoRoot) {
  return execFileSync('git', ['-C', repoRoot, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
}

function assertPinShape(pin) {
  assertExactKeys(pin, [
    'compatibility',
    'hashAlgorithm',
    'myChat',
    'myWorkflowBase',
    'nurtureScenario',
    'schemaVersion',
  ], 'pin');
  if (pin?.schemaVersion !== 3) throw new Error('Unsupported pin schemaVersion');
  if (pin?.hashAlgorithm !== HASH_ALGORITHM) throw new Error(`Unsupported hashAlgorithm: ${pin?.hashAlgorithm}`);
  assertExactKeys(pin.compatibility, ['baseAndMyChatContractParityRequired'], 'compatibility');
  if (pin?.compatibility?.baseAndMyChatContractParityRequired !== true) {
    throw new Error('Base/My-Chat contract parity must be explicitly required');
  }
  for (const key of ['myWorkflowBase', 'myChat']) {
    const dependency = pin[key];
    assertExactKeys(dependency, [
      'contractPaths',
      'contractRoot',
      'contractSha256',
      'repository',
      'revision',
      'sourcePins',
    ], key);
    if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(dependency?.repository ?? '') || !/^[0-9a-f]{40}$/.test(dependency.revision ?? '')) {
      throw new Error(`Invalid ${key} repository or revision`);
    }
    if (
      typeof dependency.contractRoot !== 'string' ||
      !Array.isArray(dependency.contractPaths) ||
      !/^[0-9a-f]{64}$/.test(dependency.contractSha256 ?? '')
    ) {
      throw new Error(`Invalid ${key} contract pin`);
    }
    for (const sourcePin of dependency.sourcePins ?? []) {
      assertExactKeys(sourcePin, ['key', 'paths', 'root', 'sha256'], `${key}.sourcePins`);
      if (
        !/^[a-z0-9_]+$/.test(sourcePin?.key ?? '') ||
        typeof sourcePin.root !== 'string' ||
        !Array.isArray(sourcePin.paths) ||
        sourcePin.paths.length === 0 ||
        !/^[0-9a-f]{64}$/.test(sourcePin.sha256 ?? '')
      ) {
        throw new Error(`Invalid ${key} source pin`);
      }
    }
  }
  if (!pin.myWorkflowBase.sourcePins?.some((entry) => entry.key === 'web_workbench')) {
    throw new Error('My-Workflow-Base web_workbench source pin is required');
  }
  if (!pin.myChat.sourcePins?.some((entry) => entry.key === 'x5_joint_api')) {
    throw new Error('My-Chat x5_joint_api source pin is required');
  }
  if (!pin.myChat.sourcePins?.some((entry) => entry.key === 'wave4_binding_host')) {
    throw new Error('My-Chat wave4_binding_host source pin is required');
  }
  if (
    typeof pin?.nurtureScenario?.contractRoot !== 'string' ||
    !Array.isArray(pin?.nurtureScenario?.contractPaths) ||
    !/^[0-9a-f]{64}$/.test(pin?.nurtureScenario?.contractSha256 ?? '')
  ) {
    throw new Error('Invalid nurtureScenario contract pin');
  }
  assertExactKeys(
    pin.nurtureScenario,
    ['contractPaths', 'contractRoot', 'contractSha256'],
    'nurtureScenario',
  );
  if (pin.nurtureScenario.contractRoot !== '.') {
    throw new Error('The-Nurture scenario contractRoot must be the repository root');
  }
  for (const requiredPath of REQUIRED_NURTURE_EXACT_PATHS) {
    const covered = pin.nurtureScenario.contractPaths.some(
      (contractPath) => contractPath === requiredPath || requiredPath.startsWith(`${contractPath}/`),
    );
    if (!covered) {
      throw new Error(`The-Nurture exact runtime path is not pinned: ${requiredPath}`);
    }
  }
}

function assertExactKeys(value, expected, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`Invalid ${label} fields`);
  }
  const actual = Object.keys(value).sort();
  const exact = [...expected].sort();
  if (actual.length !== exact.length || actual.some((key, index) => key !== exact[index])) {
    throw new Error(`Unknown or missing ${label} fields: ${actual.join(',')}`);
  }
}

async function verifyDependency(label, repoRoot, pin) {
  const revision = readHead(repoRoot);
  if (revision !== pin.revision) throw new Error(`${label} revision mismatch: expected ${pin.revision}, got ${revision}`);
  const content = await computeContractHash(resolveInside(repoRoot, pin.contractRoot), pin.contractPaths);
  if (content.sha256 !== pin.contractSha256) {
    throw new Error(`${label} contract hash mismatch: expected ${pin.contractSha256}, got ${content.sha256}`);
  }
  const sourceResults = [];
  for (const sourcePin of pin.sourcePins ?? []) {
    const sourceContent = await computeContractHash(resolveInside(repoRoot, sourcePin.root), sourcePin.paths);
    if (sourceContent.sha256 !== sourcePin.sha256) {
      throw new Error(
        `${label} source pin ${sourcePin.key} hash mismatch: expected ${sourcePin.sha256}, got ${sourceContent.sha256}`,
      );
    }
    sourceResults.push({ label: `${label} source:${sourcePin.key}`, revision, ...sourceContent });
  }
  return { contract: { label, revision, ...content }, sourceResults };
}

export async function verifyWorkflowContractPin(options) {
  const pin = JSON.parse(await readFile(options.pinPath, 'utf8'));
  assertPinShape(pin);
  const results = [];
  const workflowBase = await verifyDependency('My-Workflow-Base', options.workflowBaseRepo, pin.myWorkflowBase);
  const myChat = await verifyDependency('My-Chat', options.myChatRepo, pin.myChat);
  if (workflowBase.contract.sha256 !== myChat.contract.sha256) {
    throw new Error(
      `Base/My-Chat contract parity mismatch: Base ${workflowBase.contract.sha256}, My-Chat ${myChat.contract.sha256}`,
    );
  }
  results.push(workflowBase.contract, ...workflowBase.sourceResults, myChat.contract, ...myChat.sourceResults);

  const nurtureScenario = await computeContractHash(
    resolveInside(options.nurtureRepo, pin.nurtureScenario.contractRoot),
    pin.nurtureScenario.contractPaths,
  );
  if (nurtureScenario.sha256 !== pin.nurtureScenario.contractSha256) {
    throw new Error(
      `The-Nurture scenario contract hash mismatch: expected ${pin.nurtureScenario.contractSha256}, got ${nurtureScenario.sha256}`,
    );
  }
  results.push({ label: 'The-Nurture scenario', ...nurtureScenario });
  return results;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const results = await verifyWorkflowContractPin(options);
  if (options.report) {
    process.stdout.write(`${JSON.stringify(results, null, 2)}\n`);
    return;
  }
  for (const result of results) {
    const revision = result.revision ? ` revision=${result.revision}` : '';
    process.stdout.write(`[ok] ${result.label}${revision} sha256=${result.sha256} files=${result.files.length}\n`);
  }
}

export function isMainModule(invokedPath, moduleUrl) {
  if (!invokedPath) return false;
  try {
    return realpathSync(invokedPath) === realpathSync(fileURLToPath(moduleUrl));
  } catch {
    return false;
  }
}

if (isMainModule(process.argv[1], import.meta.url)) {
  main().catch((error) => {
    process.stderr.write(`[error] ${error.message}\n`);
    process.exitCode = 1;
  });
}
