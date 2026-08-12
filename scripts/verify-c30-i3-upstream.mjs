import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const baseRoot = resolve(repositoryRoot, "../My-Workflow-Base");
const hostRoot = resolve(repositoryRoot, "../My-Chat");

// Base and My-Chat independently committed and sealed the dedicated trusted
// invocation handler registry before Nurture adoption. Later My-Chat default-off
// owner commits are content-inert for the C30 Host source profiles.
const expected = {
  baseHead: "536638a204865ebdc43bca70992388352789a36f",
  hostHead: "6d4baeea3f8b23ff5a836c6e9c6e9c8ce55fe36b",
};

const run = (command, args, cwd) =>
  execFileSync(command, args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();

const assertExactHead = (root, revision, label) => {
  const actual = run("git", ["rev-parse", "HEAD"], root);
  if (actual !== revision) {
    throw new Error(`${label} HEAD mismatch: expected ${revision}, received ${actual}`);
  }
  const status = run("git", ["status", "--porcelain"], root);
  if (status !== "") throw new Error(`${label} worktree must be clean`);
};

assertExactHead(baseRoot, expected.baseHead, "My-Workflow-Base");
assertExactHead(hostRoot, expected.hostHead, "My-Chat");

run(
  process.execPath,
  [
    "conformance/scripts/compute-workflow-contract-source-hash.mjs",
    "--check",
    "conformance/workflow-contract-source-lock.json",
  ],
  baseRoot,
);
run(
  process.execPath,
  [
    "packages/workflow-runtime/conformance/compute-scenario-host-adoption-hash.mjs",
    "--check",
    "packages/workflow-runtime/conformance/scenario-host-adoption-lock.json",
  ],
  hostRoot,
);

console.log("C30-I3 upstream revisions and source profiles are exact");
