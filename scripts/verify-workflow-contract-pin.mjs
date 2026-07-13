#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { lstat, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HASH_ALGORITHM = 'sha256-path-content-v1';

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
    hash.update(await readFile(resolveInside(repoRoot, relativePath)));
    hash.update('\0');
  }
  return { algorithm: HASH_ALGORITHM, sha256: hash.digest('hex'), files: uniqueFiles };
}

function readHead(repoRoot) {
  return execFileSync('git', ['-C', repoRoot, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
}

function assertPinShape(pin) {
  if (pin?.schemaVersion !== 1) throw new Error('Unsupported pin schemaVersion');
  if (pin?.hashAlgorithm !== HASH_ALGORITHM) throw new Error(`Unsupported hashAlgorithm: ${pin?.hashAlgorithm}`);
  if (pin?.compatibility?.baseAndMyChatContractParityRequired !== true) {
    throw new Error('Base/My-Chat contract parity must be explicitly required');
  }
  for (const key of ['myWorkflowBase', 'myChat']) {
    const dependency = pin[key];
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
  }
  if (
    typeof pin?.nurtureScenario?.contractRoot !== 'string' ||
    !Array.isArray(pin?.nurtureScenario?.contractPaths) ||
    !/^[0-9a-f]{64}$/.test(pin?.nurtureScenario?.contractSha256 ?? '')
  ) {
    throw new Error('Invalid nurtureScenario contract pin');
  }
}

async function verifyDependency(label, repoRoot, pin) {
  const revision = readHead(repoRoot);
  if (revision !== pin.revision) throw new Error(`${label} revision mismatch: expected ${pin.revision}, got ${revision}`);
  const content = await computeContractHash(resolveInside(repoRoot, pin.contractRoot), pin.contractPaths);
  if (content.sha256 !== pin.contractSha256) {
    throw new Error(`${label} contract hash mismatch: expected ${pin.contractSha256}, got ${content.sha256}`);
  }
  return { label, revision, ...content };
}

export async function verifyWorkflowContractPin(options) {
  const pin = JSON.parse(await readFile(options.pinPath, 'utf8'));
  assertPinShape(pin);
  const results = [];
  const workflowBase = await verifyDependency('My-Workflow-Base', options.workflowBaseRepo, pin.myWorkflowBase);
  const myChat = await verifyDependency('My-Chat', options.myChatRepo, pin.myChat);
  if (workflowBase.sha256 !== myChat.sha256) {
    throw new Error(`Base/My-Chat contract parity mismatch: Base ${workflowBase.sha256}, My-Chat ${myChat.sha256}`);
  }
  results.push(workflowBase, myChat);

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

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    process.stderr.write(`[error] ${error.message}\n`);
    process.exitCode = 1;
  });
}
