/** @reference .ai/skills/standards/naming-conventions/SKILL.md */

// Owner-integration evidence layer for the T-006 capability set.
//
// The synthetic qualification (`run-surface-conformance.mjs`) deliberately
// claims nothing about the real owner path. This runner is that missing
// layer's evidence: it proves, mechanically, that every capability the formal
// ingress admits is exercised end to end through the REAL scenario-service
// HTTP surface against real PostgreSQL — a census first (a routed key with no
// end-to-end evidence fails before anything runs), then the actual suites.
//
// It does NOT claim Joint Conformance: the T-007 provider run and the T-005
// G2-C joint journey remain separate, externally-gated qualifications.

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { generatedManifestPath, repoRoot } from "./contract-core.mjs";

const httpSource = readFileSync(
  path.join(repoRoot, "apps/scenario-service/src/harness-http.ts"),
  "utf8",
);
const [actionBlock, queryBlock] = httpSource.split("HARNESS_QUERY_CAPABILITY_VERSIONS");
// [a-z0-9_]: a key containing a digit must be censused, not silently skipped.
const keysOf = (block) =>
  [...block.matchAll(/^\s+([a-z0-9_]+): "\d+\.\d+\.\d+",$/gm)].map((match) => match[1]);
const actionKeys = keysOf(actionBlock);
const queryKeys = keysOf(queryBlock).filter((key) => key.startsWith("query_"));

if (actionKeys.length === 0 || queryKeys.length === 0) {
  throw new Error("owner integration census: failed to read the admitted key sets");
}

// The evidence itself: the formal service booted for real, driven over HTTP,
// against disposable PostgreSQL — plus the binding-owner journey suite. The
// run also writes the runtime capability-evidence artifact the census reads.
execFileSync("pnpm", ["test:scenario-service:db"], { cwd: repoRoot, stdio: "inherit" });

// Census over RUNTIME evidence, not literals: a key counts only when a real
// HTTP call actually succeeded on it — a refusal-only test, a comment or a
// skipped block cannot stand in for end-to-end evidence.
const evidence = JSON.parse(
  readFileSync(
    path.join(repoRoot, ".ai/.tmp/test-results/owner-integration-evidence.json"),
    "utf8",
  ),
);
const missingPositive = [
  ...actionKeys
    .filter((key) => !(evidence[key] ?? []).includes("committed"))
    .map((key) => `${key} (no committed execution)`),
  ...queryKeys
    .filter((key) => !(evidence[key] ?? []).includes("ok"))
    .map((key) => `${key} (no ok read)`),
];
if (missingPositive.length > 0) {
  throw new Error(
    `owner integration census: admitted keys without positive real-path evidence: ${missingPositive.join(", ")}`,
  );
}

const manifest = JSON.parse(readFileSync(generatedManifestPath, "utf8"));
const contract = manifest.interfaceContract;

process.stdout.write(
  [
    "[ok] owner-integration evidence layer",
    `  interface=${contract.key}@${contract.version} ${contract.digest}`,
    `  ingress-actions=${actionKeys.length} ingress-queries=${queryKeys.length} unexercised=0`,
    "  path=formal scenario-service HTTP + real PostgreSQL, runtime-recorded per-key evidence",
    "  joint-conformance=NOT-RUN (T-007 provider and T-005 G2-C joint runs are gated externally)",
    "",
  ].join("\n"),
);
