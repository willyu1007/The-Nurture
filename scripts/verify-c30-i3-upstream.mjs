import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const baseRoot = resolve(repositoryRoot, "../My-Workflow-Base");
const hostRoot = resolve(repositoryRoot, "../My-Chat");

// Advanced 2026-08-08 by the C30 cross-repository landing: Base main
// fast-forwarded to exactly this branch tip, and My-Chat main merged the
// host adoption as dc3607e. The source-profile checks below are unchanged and
// remain the substantive gate — only the head identities moved.
const expected = {
  baseHead: "4350086993d837baa8030564f4e19593dedd96b0",
  hostHead: "dc3607e74b01def9cf855d3eca14ebff7c3c492f",
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
