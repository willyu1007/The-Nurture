import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import {
  computeGitRevisionHash,
  verifyKnowledgeRagContractPin,
} from "./verify-knowledge-rag-contract-pin.mjs";

const git = (repoRoot, args) =>
  execFileSync("git", ["-C", repoRoot, ...args], { encoding: "utf8" }).trim();

const fixture = async (context) => {
  const repoRoot = await mkdtemp(path.join(tmpdir(), "nurture-rag-pin-"));
  context.after(() => rm(repoRoot, { recursive: true, force: true }));
  git(repoRoot, ["init", "--quiet"]);
  git(repoRoot, ["config", "user.email", "pin-test@example.invalid"]);
  git(repoRoot, ["config", "user.name", "Pin Test"]);
  await mkdir(path.join(repoRoot, "contracts"));
  await writeFile(path.join(repoRoot, "contracts", "owner.ts"), "export const owner = 1;\n");
  git(repoRoot, ["add", "contracts/owner.ts"]);
  git(repoRoot, ["commit", "--quiet", "-m", "fixture"]);
  const revision = git(repoRoot, ["rev-parse", "HEAD"]);
  const paths = ["contracts/owner.ts"];
  const sha256 = computeGitRevisionHash(repoRoot, revision, paths);
  return { repoRoot, revision, paths, sha256 };
};

test("hashes committed owner files rather than the mutable checkout", async (context) => {
  const data = await fixture(context);
  await writeFile(
    path.join(data.repoRoot, "contracts", "owner.ts"),
    "export const owner = 2;\n",
  );
  assert.equal(
    computeGitRevisionHash(data.repoRoot, data.revision, data.paths),
    data.sha256,
  );
});

test("verifies an exact revision source pin and reports checkout drift", async (context) => {
  const data = await fixture(context);
  const pinPath = path.join(data.repoRoot, "pin.json");
  await writeFile(pinPath, JSON.stringify({
    schemaVersion: 1,
    hashAlgorithm: "sha256-path-content-v1",
    repository: "example/owner",
    revision: data.revision,
    paths: data.paths,
    sha256: data.sha256,
  }));
  await writeFile(path.join(data.repoRoot, "second.txt"), "second\n");
  git(data.repoRoot, ["add", "second.txt"]);
  git(data.repoRoot, ["commit", "--quiet", "-m", "second"]);

  const result = await verifyKnowledgeRagContractPin({
    myChatRepo: data.repoRoot,
    pinPath,
  });
  assert.equal(result.revision, data.revision);
  assert.notEqual(result.checkoutHead, result.revision);
});

test("rejects source hash drift", async (context) => {
  const data = await fixture(context);
  const pinPath = path.join(data.repoRoot, "pin.json");
  await writeFile(pinPath, JSON.stringify({
    schemaVersion: 1,
    hashAlgorithm: "sha256-path-content-v1",
    repository: "example/owner",
    revision: data.revision,
    paths: data.paths,
    sha256: "0".repeat(64),
  }));
  await assert.rejects(
    verifyKnowledgeRagContractPin({ myChatRepo: data.repoRoot, pinPath }),
    /source hash mismatch/,
  );
});
