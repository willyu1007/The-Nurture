import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { computeContractHash, verifyWorkflowContractPin } from './verify-workflow-contract-pin.mjs';

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
  await mkdir(path.join(nurtureRepo, 'scenario'), { recursive: true });
  await writeFile(path.join(nurtureRepo, 'scenario', 'contract.md'), '# Scenario\n');

  const dependencyHash = await computeContractHash(path.join(workflowBaseRepo, 'contract'), ['value.ts']);
  const sourceHash = await computeContractHash(workflowBaseRepo, ['source/value.txt']);
  const scenarioHash = await computeContractHash(nurtureRepo, ['scenario/contract.md']);
  const pinPath = path.join(root, 'pin.json');
  await writeFile(
    pinPath,
    JSON.stringify({
      schemaVersion: 2,
      hashAlgorithm: 'sha256-path-content-v1',
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
      },
      nurtureScenario: {
        contractRoot: '.',
        contractPaths: ['scenario/contract.md'],
        contractSha256: scenarioHash.sha256,
      },
    }),
  );

  await verifyWorkflowContractPin({ nurtureRepo, workflowBaseRepo, myChatRepo, pinPath });
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
