/** @reference .ai/skills/standards/naming-conventions/SKILL.md */

// Single-command deterministic synthetic contract qualification. Reruns the
// full conformance suite (digest rebuild, strict schema validation with the
// conformance-case registry checks, generator tooling guards and every
// surface-contract vitest file), then prints the qualification summary.
// Synthetic PASS never claims Owner Integration Readiness or Joint
// Conformance; those layers bind the real pinned owner path separately.

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  checkConformanceRegistry,
  generatedManifestPath,
  repoRoot,
  sourceRoot,
} from "./contract-core.mjs";

const manifest = JSON.parse(readFileSync(generatedManifestPath, "utf8"));
const registry = JSON.parse(
  readFileSync(
    path.join(sourceRoot, "conformance/conformance-cases.json"),
    "utf8",
  ),
);
const coverage = checkConformanceRegistry(registry, manifest);

// Execution derives from the case registry, so the declared suite targets and
// the commands that actually run cannot drift apart. Vitest targets share one
// invocation; script/node_test targets run in declaration order.
const scriptTargets = [];
const nodeTestTargets = [];
const vitestTargets = [];
for (const conformanceCase of registry.cases) {
  const { runner, target } = conformanceCase.suiteRef;
  const bucket =
    runner === "script"
      ? scriptTargets
      : runner === "node_test"
        ? nodeTestTargets
        : vitestTargets;
  if (!bucket.includes(target)) bucket.push(target);
}
const steps = [
  ...scriptTargets.map((target) => ["node", [target]]),
  ...nodeTestTargets.map((target) => ["node", ["--test", target]]),
  ["pnpm", ["exec", "vitest", "run", "-c", "vitest.config.ts", ...vitestTargets]],
];

for (const [command, args] of steps) {
  execFileSync(command, args, { cwd: repoRoot, stdio: "inherit" });
}
const contract = manifest.interfaceContract;

process.stdout.write(
  [
    "[ok] synthetic surface-contract qualification",
    `  interface=${contract.key}@${contract.version} ${contract.digest}`,
    `  layer=${registry.qualificationLayer} cases=${registry.cases.length} slices=${coverage.covered}/${coverage.universe}`,
    `  capabilities=${manifest.capabilities.length} surfaces=${manifest.surfaces.length} fixtures=${manifest.fixtures.length} shared-core=1`,
    "  owner-integration=NO-GO joint-conformance=NOT-RUN (synthetic PASS never claims the real owner path)",
    "",
  ].join("\n"),
);
