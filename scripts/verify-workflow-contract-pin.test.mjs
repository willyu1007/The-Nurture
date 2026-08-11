import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, mkdir, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import test from 'node:test';

import {
  computeContractHash,
  isMainModule,
  verifyWorkflowContractPin,
} from './verify-workflow-contract-pin.mjs';

test('CLI entry detection resolves filesystem aliases', async (context) => {
  const root = await mkdtemp(path.join(tmpdir(), 'workflow-contract-pin-entry-'));
  context.after(() => rm(root, { recursive: true, force: true }));
  const target = path.join(root, 'target.mjs');
  const alias = path.join(root, 'alias.mjs');
  await writeFile(target, 'export {};\n');
  await symlink(target, alias);

  assert.equal(isMainModule(alias, pathToFileURL(target).href), true);
  assert.equal(isMainModule(undefined, pathToFileURL(target).href), false);
});

test('contract hash is stable across input order and directory traversal', async (context) => {
  const root = await mkdtemp(path.join(tmpdir(), 'workflow-contract-pin-'));
  context.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(path.join(root, 'contract'));
  await writeFile(path.join(root, 'contract', 'a.ts'), 'export const a = 1;\n');
  await writeFile(path.join(root, 'contract', 'b.ts'), 'export const b = 2;\n');

  const directoryHash = await computeContractHash(root, ['contract']);
  const reversedFileHash = await computeContractHash(root, ['contract/b.ts', 'contract/a.ts']);

  assert.equal(directoryHash.sha256, reversedFileHash.sha256);
  assert.deepEqual(directoryHash.files, ['contract/a.ts', 'contract/b.ts']);
});

test('contract hash normalizes UTF-8 BOM and line endings', async (context) => {
  const left = await mkdtemp(path.join(tmpdir(), 'workflow-contract-pin-lf-'));
  const right = await mkdtemp(path.join(tmpdir(), 'workflow-contract-pin-crlf-'));
  context.after(() => Promise.all([rm(left, { recursive: true, force: true }), rm(right, { recursive: true, force: true })]));
  await writeFile(path.join(left, 'value.ts'), 'export const value = 1;\n');
  await writeFile(path.join(right, 'value.ts'), '\uFEFFexport const value = 1;\r\n');

  const lf = await computeContractHash(left, ['value.ts']);
  const crlf = await computeContractHash(right, ['value.ts']);
  assert.equal(lf.sha256, crlf.sha256);
});

test('committed LF blob and CRLF working tree hash identically', async (context) => {
  const root = await mkdtemp(path.join(tmpdir(), 'workflow-contract-pin-git-eol-'));
  context.after(() => rm(root, { recursive: true, force: true }));
  await writeFile(path.join(root, 'value.ts'), 'export const value = 1;\n');
  execFileSync('git', ['init', '--quiet', root]);
  execFileSync('git', ['-C', root, 'config', 'user.name', 'Contract Pin Test']);
  execFileSync('git', ['-C', root, 'config', 'user.email', 'contract-pin@example.invalid']);
  execFileSync('git', ['-C', root, 'add', 'value.ts']);
  execFileSync('git', ['-C', root, 'commit', '--quiet', '-m', 'test contract']);
  const committed = await computeContractHash(root, ['value.ts']);
  await writeFile(path.join(root, 'value.ts'), 'export const value = 1;\r\n');
  const working = await computeContractHash(root, ['value.ts']);
  assert.equal(working.sha256, committed.sha256);
});

test('contract hash changes when content or relative path changes', async (context) => {
  const left = await mkdtemp(path.join(tmpdir(), 'workflow-contract-pin-left-'));
  const right = await mkdtemp(path.join(tmpdir(), 'workflow-contract-pin-right-'));
  context.after(() => Promise.all([rm(left, { recursive: true, force: true }), rm(right, { recursive: true, force: true })]));
  await mkdir(path.join(left, 'contract'));
  await mkdir(path.join(right, 'renamed'));
  await writeFile(path.join(left, 'contract', 'value.ts'), 'same content\n');
  await writeFile(path.join(right, 'renamed', 'value.ts'), 'same content\n');

  const leftHash = await computeContractHash(left, ['contract/value.ts']);
  const rightHash = await computeContractHash(right, ['renamed/value.ts']);
  assert.notEqual(leftHash.sha256, rightHash.sha256);

  await writeFile(path.join(left, 'contract', 'value.ts'), 'changed content\n');
  const changedHash = await computeContractHash(left, ['contract/value.ts']);
  assert.notEqual(leftHash.sha256, changedHash.sha256);
});

test('contract inputs cannot escape the repository root', async (context) => {
  const root = await mkdtemp(path.join(tmpdir(), 'workflow-contract-pin-root-'));
  context.after(() => rm(root, { recursive: true, force: true }));
  await assert.rejects(() => computeContractHash(root, ['../outside']), /escapes repository root/);
});

async function createGitContractRepo(root, content) {
  await mkdir(path.join(root, 'contract'), { recursive: true });
  await mkdir(path.join(root, 'source'), { recursive: true });
  await writeFile(path.join(root, 'contract', 'value.ts'), content);
  await writeFile(path.join(root, 'source', 'value.txt'), 'source content\n');
  execFileSync('git', ['init', '--quiet', root]);
  execFileSync('git', ['-C', root, 'config', 'user.name', 'Contract Pin Test']);
  execFileSync('git', ['-C', root, 'config', 'user.email', 'contract-pin@example.invalid']);
  execFileSync('git', ['-C', root, 'add', 'contract/value.ts', 'source/value.txt']);
  execFileSync('git', ['-C', root, 'commit', '--quiet', '-m', 'test contract']);
  return execFileSync('git', ['-C', root, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
}

test('full verifier rejects contract drift at the pinned revision', async (context) => {
  const root = await mkdtemp(path.join(tmpdir(), 'workflow-contract-pin-full-'));
  context.after(() => rm(root, { recursive: true, force: true }));
  const workflowBaseRepo = path.join(root, 'workflow-base');
  const myChatRepo = path.join(root, 'my-chat');
  const nurtureRepo = path.join(root, 'nurture');
  const workflowBaseRevision = await createGitContractRepo(workflowBaseRepo, 'export const value = 1;\n');
  const myChatRevision = await createGitContractRepo(myChatRepo, 'export const value = 1;\n');
  const nurtureFiles = {
    'package.json': '{"private":true}\n',
    'pnpm-lock.yaml': 'lockfileVersion: 9\n',
    'pnpm-workspace.yaml': 'packages: []\n',
    'tsconfig.json': '{"compilerOptions":{}}\n',
    'apps/scenario-service/package.json': '{"private":true}\n',
    'apps/scenario-service/src/main.ts': 'export const service = true;\n',
    'apps/scenario-service/tsconfig.build.json': '{"extends":"./tsconfig.json"}\n',
    'apps/scenario-service/tsconfig.db.json': '{"extends":"./tsconfig.json"}\n',
    'apps/scenario-service/tsconfig.json': '{"compilerOptions":{}}\n',
    'docs/context/workflow/nurture-scenario-contract.md': '# Contract\n',
    'packages/nurture-db/package.json': '{"private":true}\n',
    'packages/nurture-db/src/index.ts': 'export const database = true;\n',
    'packages/nurture-db/tsconfig.build.json': '{"extends":"./tsconfig.json"}\n',
    'packages/nurture-db/tsconfig.json': '{"compilerOptions":{}}\n',
    'packages/nurture-scenario/package.json': '{"private":true}\n',
    'packages/nurture-scenario/scenario.manifest.yaml': 'key: test\n',
    'packages/nurture-scenario/src/index.ts': 'export const scenario = true;\n',
    'packages/nurture-scenario/tsconfig.build.json': '{"extends":"./tsconfig.json"}\n',
    'packages/nurture-scenario/tsconfig.json': '{"compilerOptions":{}}\n',
    'prisma/migrations/0001_initial/migration.sql': 'SELECT 1;\n',
    'prisma/schema.prisma': 'generator client { provider = "prisma-client-js" }\n',
  };
  for (const [relativePath, content] of Object.entries(nurtureFiles)) {
    const absolutePath = path.join(nurtureRepo, relativePath);
    await mkdir(path.dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, content);
  }
  const nurtureContractPaths = [
    'package.json',
    'pnpm-lock.yaml',
    'pnpm-workspace.yaml',
    'tsconfig.json',
    'apps/scenario-service',
    'docs/context/workflow/nurture-scenario-contract.md',
    'packages/nurture-db',
    'packages/nurture-scenario',
    'prisma',
  ];

  const dependencyHash = await computeContractHash(path.join(workflowBaseRepo, 'contract'), ['value.ts']);
  const sourceHash = await computeContractHash(workflowBaseRepo, ['source/value.txt']);
  const scenarioHash = await computeContractHash(nurtureRepo, nurtureContractPaths);
  const pinPath = path.join(root, 'pin.json');
  const pin = {
      schemaVersion: 3,
      hashAlgorithm: 'sha256-path-utf8-lf-content-v2',
      compatibility: { baseAndMyChatContractParityRequired: true },
      myWorkflowBase: {
        repository: 'example/workflow-base',
        revision: workflowBaseRevision,
        contractRoot: 'contract',
        contractPaths: ['value.ts'],
        contractSha256: dependencyHash.sha256,
        sourcePins: [
          {
            key: 'web_workbench',
            root: '.',
            paths: ['source/value.txt'],
            sha256: sourceHash.sha256,
          },
        ],
      },
      myChat: {
        repository: 'example/my-chat',
        revision: myChatRevision,
        contractRoot: 'contract',
        contractPaths: ['value.ts'],
        contractSha256: dependencyHash.sha256,
        sourcePins: [
          {
            key: 'x5_joint_api',
            root: '.',
            paths: ['source/value.txt'],
            sha256: sourceHash.sha256,
          },
          {
            key: 'wave4_binding_host',
            root: '.',
            paths: ['source/value.txt'],
            sha256: sourceHash.sha256,
          },
        ],
      },
      nurtureScenario: {
        contractRoot: '.',
        contractPaths: nurtureContractPaths,
        contractSha256: scenarioHash.sha256,
      },
    };
  await writeFile(pinPath, JSON.stringify(pin));

  await verifyWorkflowContractPin({ nurtureRepo, workflowBaseRepo, myChatRepo, pinPath });
  await writeFile(pinPath, JSON.stringify({
    ...pin,
    hashAlgorithm: 'sha256-path-content-v1',
  }));
  await assert.rejects(
    () => verifyWorkflowContractPin({ nurtureRepo, workflowBaseRepo, myChatRepo, pinPath }),
    /Unsupported hashAlgorithm/,
  );
  await writeFile(pinPath, JSON.stringify({ ...pin, legacyContractHash: dependencyHash.sha256 }));
  await assert.rejects(
    () => verifyWorkflowContractPin({ nurtureRepo, workflowBaseRepo, myChatRepo, pinPath }),
    /Unknown or missing pin fields/,
  );
  await writeFile(pinPath, JSON.stringify(pin));
  const narrowedPaths = nurtureContractPaths.filter((entry) => entry !== 'packages/nurture-db');
  const narrowedHash = await computeContractHash(nurtureRepo, narrowedPaths);
  await writeFile(
    pinPath,
    JSON.stringify({
      ...pin,
      nurtureScenario: {
        ...pin.nurtureScenario,
        contractPaths: narrowedPaths,
        contractSha256: narrowedHash.sha256,
      },
    }),
  );
  await assert.rejects(
    () => verifyWorkflowContractPin({ nurtureRepo, workflowBaseRepo, myChatRepo, pinPath }),
    /exact runtime path is not pinned: packages\/nurture-db\//,
  );
  await writeFile(pinPath, JSON.stringify(pin));
  await writeFile(path.join(workflowBaseRepo, 'source', 'value.txt'), 'changed source\n');
  await assert.rejects(
    () => verifyWorkflowContractPin({ nurtureRepo, workflowBaseRepo, myChatRepo, pinPath }),
    /source pin web_workbench hash mismatch/,
  );
  await writeFile(path.join(workflowBaseRepo, 'source', 'value.txt'), 'source content\n');
  await writeFile(path.join(myChatRepo, 'contract', 'value.ts'), 'export const value = 2;\n');
  await assert.rejects(
    () => verifyWorkflowContractPin({ nurtureRepo, workflowBaseRepo, myChatRepo, pinPath }),
    /My-Chat contract hash mismatch/,
  );
});
