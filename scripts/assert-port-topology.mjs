import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseYaml } from "../.ai/scripts/lib/yaml-lite.mjs";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

const read = (relativePath) =>
  fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
const readJson = (relativePath) => JSON.parse(read(relativePath));
const readYaml = (relativePath) => parseYaml(read(relativePath));

const contract = readYaml("env/contract.yaml");
assertEqual(contract.variables?.PORT?.default, 8000, "PORT default");
// T-014: the legacy host is deleted; its port vocabulary must not return.
assertEqual(contract.variables?.DEV_HOST_PORT, undefined, "DEV_HOST_PORT retired");
assertEqual(
  contract.variables?.NURTURE_BACKEND_URL,
  undefined,
  "NURTURE_BACKEND_URL retired",
);
assertEqual(
  contract.variables?.DEV_HOST_DATABASE_URL,
  undefined,
  "DEV_HOST_DATABASE_URL retired",
);

const devValues = readYaml("env/values/dev.yaml");
assertEqual(devValues.PORT, 8000, "dev PORT");
assertEqual(devValues.DEV_HOST_PORT, undefined, "dev DEV_HOST_PORT retired");

const scenarioConfig = read("apps/scenario-service/src/config.ts");
assertIncludes(scenarioConfig, "const DEFAULT_PORT = 8000;", "scenario port");
assertIncludes(scenarioConfig, "parsePort(env.PORT)", "scenario PORT input");

const frontendPackage = readJson("apps/frontend/package.json");
assertEqual(frontendPackage.scripts?.dev, "next dev -p 3201", "frontend dev");
assertEqual(
  frontendPackage.scripts?.start,
  "next start -p 3201",
  "frontend start",
);

// T-013 cut the frontend loose from the legacy host: it consumes no backend
// endpoint until the real scenario-service ingress exists, so the frontend
// must no longer hardcode the retired host's port.
assertExcludes(
  read("apps/frontend/next.config.ts"),
  "http://localhost:3200",
  "frontend retired backend endpoint",
);

const devTemplate = read("config/environments/dev.yaml.template");
assertExcludes(
  devTemplate,
  "NURTURE_BACKEND_URL",
  "development template retired backend environment key",
);
assertExcludes(
  devTemplate,
  "API_BASE_URL",
  "development template stale backend environment key",
);

process.stdout.write(
  "[ok] port topology scenario=8000 frontend=3201 legacy-host=absent\n",
);

function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(
      `${label}: expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`,
    );
  }
}

function assertIncludes(content, expected, label) {
  if (!content.includes(expected)) {
    throw new Error(`${label}: missing ${JSON.stringify(expected)}`);
  }
}

function assertExcludes(content, rejected, label) {
  if (content.includes(rejected)) {
    throw new Error(`${label}: found forbidden ${JSON.stringify(rejected)}`);
  }
}
