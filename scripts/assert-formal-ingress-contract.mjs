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

const healthPath = "/health";
const ownerPath = "/internal/nurture/scenario-binding/authorize";
const expectedPaths = [healthPath, ownerPath];
const expectedOwnerRequiredFields = [
  "workspace_id",
  "acting_user_id",
  "idempotency_key",
  "subject_type",
  "subject_id",
  "scenario_key",
  "acting_actor_id",
  "purpose",
];
const expectedOwnerOptionalFields = [
  "represented_organization_id",
  "correlation_id",
  "trace_id",
];

const openApi = parseYaml(read("docs/context/api/openapi.yaml"));
assertArrayEqual(
  Object.keys(openApi.paths ?? {}).sort(),
  [...expectedPaths].sort(),
  "OpenAPI formal path set",
);
assertTruthy(openApi.paths?.[healthPath]?.get, "OpenAPI health GET");
assertTruthy(openApi.paths?.[ownerPath]?.post, "OpenAPI owner POST");
assertArrayEqual(
  Object.keys(openApi.paths?.[healthPath] ?? {}).sort(),
  ["get"],
  "OpenAPI health operation set",
);
assertArrayEqual(
  Object.keys(openApi.paths?.[ownerPath] ?? {}).sort(),
  ["post"],
  "OpenAPI owner operation set",
);
assertArrayEqual(
  openApi.components?.schemas?.ScenarioBindingAuthorizeRequest?.required ?? [],
  expectedOwnerRequiredFields,
  "OpenAPI owner required fields",
);
assertArrayEqual(
  Object.keys(
    openApi.components?.schemas?.ScenarioBindingAuthorizeRequest?.properties ??
      {},
  ).sort(),
  [...expectedOwnerRequiredFields, ...expectedOwnerOptionalFields].sort(),
  "OpenAPI owner property set",
);

const healthSource = read("apps/scenario-service/src/health.controller.ts");
assertIncludes(healthSource, `@Get("${healthPath}")`, "health controller path");

const ownerTransportSource = read(
  "packages/nurture-scenario/src/adapters/binding-owner-http.ts",
);
assertIncludes(
  ownerTransportSource,
  `"${ownerPath}"`,
  "binding-owner transport path",
);
const ownerControllerSource = read(
  "apps/scenario-service/src/binding-owner.controller.ts",
);
assertIncludes(
  ownerControllerSource,
  "@Post(SCENARIO_BINDING_OWNER_PATH)",
  "binding-owner controller route",
);

const apiIndex = JSON.parse(read("docs/context/api/api-index.json"));
assertArrayEqual(
  apiIndex.endpoints
    .map((endpoint) => `${endpoint.method} ${endpoint.path}`)
    .sort(),
  [`GET ${healthPath}`, `POST ${ownerPath}`].sort(),
  "API index formal route set",
);
const ownerIndex = apiIndex.endpoints.find(
  (endpoint) => endpoint.method === "POST" && endpoint.path === ownerPath,
);
assertTruthy(ownerIndex, "API index owner operation");
assertArrayEqual(
  ownerIndex.input?.body?.required ?? [],
  expectedOwnerRequiredFields,
  "API index owner required fields",
);
assertArrayEqual(
  ownerIndex.input?.body?.optional ?? [],
  expectedOwnerOptionalFields,
  "API index owner optional fields",
);

process.stdout.write(
  "[ok] formal ingress contract routes=2 owner-fields=8\n",
);

function assertTruthy(value, label) {
  if (!value) throw new Error(`${label}: expected a truthy value`);
}

function assertIncludes(content, expected, label) {
  if (!content.includes(expected)) {
    throw new Error(`${label}: missing ${JSON.stringify(expected)}`);
  }
}

function assertArrayEqual(actual, expected, label) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      `${label}: expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`,
    );
  }
}
