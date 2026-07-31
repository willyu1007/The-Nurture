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
assertEqual(
  contract.variables?.DEV_HOST_PORT?.default,
  3001,
  "DEV_HOST_PORT default",
);
assertEqual(
  contract.variables?.NURTURE_BACKEND_URL?.default,
  "http://localhost:3200",
  "NURTURE_BACKEND_URL default",
);

const devValues = readYaml("env/values/dev.yaml");
assertEqual(devValues.PORT, 8000, "dev PORT");
assertEqual(devValues.DEV_HOST_PORT, 3001, "dev DEV_HOST_PORT");
assertEqual(
  devValues.NURTURE_BACKEND_URL,
  "http://localhost:3200",
  "dev NURTURE_BACKEND_URL",
);

const scenarioConfig = read("apps/scenario-service/src/config.ts");
assertIncludes(scenarioConfig, "const DEFAULT_PORT = 8000;", "scenario port");
assertIncludes(scenarioConfig, "parsePort(env.PORT)", "scenario PORT input");

const devHostMain = read("apps/backend/src/main.ts");
assertIncludes(
  devHostMain,
  "process.env.DEV_HOST_PORT",
  "dev-host dedicated port input",
);
assertExcludes(devHostMain, "process.env.PORT", "dev-host shared PORT input");

const frontendPackage = readJson("apps/frontend/package.json");
assertEqual(frontendPackage.scripts?.dev, "next dev -p 3201", "frontend dev");
assertEqual(
  frontendPackage.scripts?.start,
  "next start -p 3201",
  "frontend start",
);

for (const relativePath of [
  "apps/frontend/next.config.ts",
  "apps/frontend/src/lib/api.ts",
]) {
  const content = read(relativePath);
  assertIncludes(
    content,
    "process.env.NURTURE_BACKEND_URL",
    `${relativePath} backend environment key`,
  );
  assertIncludes(
    content,
    "http://localhost:3200",
    `${relativePath} backend endpoint`,
  );
}

const devTemplate = read("config/environments/dev.yaml.template");
assertIncludes(
  devTemplate,
  "${NURTURE_BACKEND_URL:-http://localhost:3200}",
  "development template backend environment key",
);
assertExcludes(
  devTemplate,
  "API_BASE_URL",
  "development template stale backend environment key",
);

process.stdout.write(
  "[ok] port topology scenario=8000 dev-host=3001 backend=3200 frontend=3201\n",
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
