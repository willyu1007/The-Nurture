import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const baseRoot = resolve(repositoryRoot, "../My-Workflow-Base");
// RESEAL_MY_CHAT_ROOT points a reseal-time verification at a clean secondary
// worktree when the shared sibling checkout carries another session's WIP.
const hostRoot = process.env.RESEAL_MY_CHAT_ROOT
  ? resolve(process.env.RESEAL_MY_CHAT_ROOT)
  : resolve(repositoryRoot, "../My-Chat");

// Base and My-Chat independently committed and sealed the dedicated trusted
// invocation handler registry before Nurture adoption. Later My-Chat default-off
// owner, signed-route and execute-schema repairs are content-inert for the C30
// Host source profiles, but the qualified repository head remains exact.
const expected = {
  baseHead: "536638a204865ebdc43bca70992388352789a36f",
  // 2026-08-17 reseal: adopt My-Chat bb545671; pinned-scope changes are inert
  // (forwarding wrapper, conditional type resolving to the same type, three
  // symbols exported). Also reseals the Nurture contract hash for the
  // committed Wave 4 / T-014 packages changes, whose sessions archived without
  // resealing.
  hostHead: "bb545671df7eed54abf02675a5b0629f6f97a37c",
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
