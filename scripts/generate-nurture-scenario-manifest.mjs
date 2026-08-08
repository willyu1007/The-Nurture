import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseYaml } from "../.ai/scripts/lib/yaml-lite.mjs";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = resolve(
  repositoryRoot,
  "packages/nurture-scenario/scenario.manifest.yaml",
);
const outputPath = resolve(
  repositoryRoot,
  "packages/nurture-scenario/src/generated/manifest.generated.ts",
);

const manifest = parseYaml(readFileSync(sourcePath, "utf8"));
if (manifest === null || typeof manifest !== "object" || Array.isArray(manifest)) {
  throw new Error("scenario.manifest.yaml must contain one object");
}

const generated = `// Generated from scenario.manifest.yaml. Do not edit.\n` +
  `import type { ScenarioManifestV2 } from "@my-chat/workflow-contracts";\n\n` +
  `export const nurtureScenarioManifest: ScenarioManifestV2 = ${JSON.stringify(manifest, null, 2)};\n`;

if (process.argv.includes("--check")) {
  const current = readFileSync(outputPath, "utf8");
  if (current !== generated) {
    throw new Error("generated Scenario manifest is stale");
  }
  console.log("generated Scenario manifest is current");
} else {
  writeFileSync(outputPath, generated, "utf8");
  console.log("generated Scenario manifest refreshed");
}
