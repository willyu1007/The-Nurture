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

const steps = [
  ["node", ["scripts/surface-contract/verify-surface-contract.mjs"]],
  ["node", ["scripts/surface-contract/validate-surface-contract-schemas.mjs"]],
  ["node", ["--test", "scripts/surface-contract/contract-core.test.mjs"]],
  [
    "pnpm",
    [
      "exec",
      "vitest",
      "run",
      "-c",
      "vitest.config.ts",
      "packages/nurture-scenario/tests/surface-contract",
    ],
  ],
];

for (const [command, args] of steps) {
  execFileSync(command, args, { cwd: repoRoot, stdio: "inherit" });
}

const manifest = JSON.parse(readFileSync(generatedManifestPath, "utf8"));
const registry = JSON.parse(
  readFileSync(
    path.join(sourceRoot, "conformance/conformance-cases.json"),
    "utf8",
  ),
);
const coverage = checkConformanceRegistry(registry, manifest);
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
