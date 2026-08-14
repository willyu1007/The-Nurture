import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const baseRoot = resolve(repositoryRoot, "../My-Workflow-Base");
const hostRoot = resolve(repositoryRoot, "../My-Chat");

// Base and My-Chat independently committed and sealed the dedicated trusted
// invocation handler registry before Nurture adoption. Later My-Chat default-off
// owner, signed-route and execute-schema repairs are content-inert for the C30
// Host source profiles, but the qualified repository head remains exact.
const expected = {
  baseHead: "536638a204865ebdc43bca70992388352789a36f",
  // 2026-08-14 reseal: My-Chat afb25b5 threads the original intake instant
  // through receipts (T-031) and Nurture aligns replay settlement plus the
  // t009 provenance seed; wire receipt semantics converge on the frozen
  // contract, no capability or activation change.
  hostHead: "afb25b57d89c9bf98e3eb2ec9259d22643e538af",
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
