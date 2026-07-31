/** @reference .ai/skills/standards/naming-conventions/SKILL.md */

import path from "node:path";
import { buildSurfaceContract, generatedManifestPath, repoRoot } from "./contract-core.mjs";

const outputFlag = process.argv.indexOf("--output");
const outputPath =
  outputFlag === -1
    ? generatedManifestPath
    : path.resolve(repoRoot, process.argv[outputFlag + 1] ?? "");

if (outputFlag !== -1 && !process.argv[outputFlag + 1]) {
  throw new Error("--output requires a repository-relative path");
}

const result = await buildSurfaceContract(outputPath);
process.stdout.write(
  `[ok] surface contract ${result.manifest.interfaceContract.version} ${result.manifest.interfaceContract.digest} capabilities=${result.manifest.capabilities.length} surfaces=${result.manifest.surfaces.length}\n`,
);
