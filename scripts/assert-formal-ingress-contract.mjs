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
const harnessPreparePath = "/internal/nurture/harness/prepare-action";
const harnessExecutePath = "/internal/nurture/harness/execute-action";
const harnessQueryPath = "/internal/nurture/harness/query";
const harnessReadResultPath = "/internal/nurture/harness/read-result";
const institutionBusinessCommunicationReadPath =
  "/internal/nurture/institution/business-communications:read";
const expectedPaths = [
  healthPath,
  ownerPath,
  harnessPreparePath,
  harnessExecutePath,
  harnessQueryPath,
  harnessReadResultPath,
  institutionBusinessCommunicationReadPath,
];
const expectedHarnessSharedRequiredFields = [
  "workspace_id",
  "actor_participant_id",
  "surface",
  "capability_key",
  "capability_version",
];
const expectedHarnessExecuteRequiredFields = [
  ...expectedHarnessSharedRequiredFields,
  "invocation_request_id",
  "command_request_id",
  "confirmation_ref",
];
const expectedHarnessActionKeys = [
  "submit_family_care_question",
  "initiate_caregiver_direct_message",
  "acknowledge_family_care_item",
  "reply_family_care_item",
  "correct_family_care_message",
  "withdraw_family_care_request",
  "redact_family_care_message",
  "policy_redact_family_care_message",
];
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
const expectedInstitutionBusinessCommunicationReadFields = [
  "workspace_id",
  "actor_participant_id",
  "surface",
  "interface_contract",
  "target_option_ref",
];
const expectedInstitutionBusinessCommunicationInterface = {
  key: "nurture.institution-business-communication-owner-read",
  version: "1.0.0",
  digest: "sha256:dd1b63fe6c7975bafb4170aff3dccc92463dfaf3e5ea7e5bd3c80f1298d6c921",
};

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

for (const harnessPath of [
  harnessPreparePath,
  harnessExecutePath,
  harnessQueryPath,
  harnessReadResultPath,
]) {
  assertTruthy(openApi.paths?.[harnessPath]?.post, `OpenAPI harness POST ${harnessPath}`);
  assertArrayEqual(
    Object.keys(openApi.paths?.[harnessPath] ?? {}).sort(),
    ["post"],
    `OpenAPI harness operation set ${harnessPath}`,
  );
}
assertTruthy(
  openApi.paths?.[institutionBusinessCommunicationReadPath]?.post,
  "OpenAPI Institution business-communication owner-read POST",
);
assertArrayEqual(
  Object.keys(openApi.paths?.[institutionBusinessCommunicationReadPath] ?? {}).sort(),
  ["post"],
  "OpenAPI Institution business-communication owner-read operation set",
);
assertArrayEqual(
  openApi.components?.schemas?.InstitutionBusinessCommunicationReadRequest?.required ?? [],
  expectedInstitutionBusinessCommunicationReadFields,
  "OpenAPI Institution business-communication owner-read required fields",
);
const institutionInterfaceSchema =
  openApi.components?.schemas?.InstitutionBusinessCommunicationInterfaceContract?.properties ?? {};
assertArrayEqual(
  [
    institutionInterfaceSchema.key?.const,
    institutionInterfaceSchema.version?.const,
    institutionInterfaceSchema.digest?.const,
  ],
  [
    expectedInstitutionBusinessCommunicationInterface.key,
    expectedInstitutionBusinessCommunicationInterface.version,
    expectedInstitutionBusinessCommunicationInterface.digest,
  ],
  "OpenAPI Institution business-communication exact interface pin",
);
assertArrayEqual(
  openApi.components?.schemas?.HarnessPrepareRequest?.required ?? [],
  expectedHarnessSharedRequiredFields,
  "OpenAPI harness prepare required fields",
);
assertArrayEqual(
  openApi.components?.schemas?.HarnessExecuteRequest?.required ?? [],
  expectedHarnessExecuteRequiredFields,
  "OpenAPI harness execute required fields",
);
assertArrayEqual(
  openApi.components?.schemas?.HarnessPrepareRequest?.properties?.capability_key?.enum ?? [],
  expectedHarnessActionKeys,
  "OpenAPI Harness action key set",
);

const harnessTransportSource = read(
  "apps/scenario-service/src/harness-http.ts",
);
const institutionBusinessCommunicationSource = read(
  "packages/nurture-scenario/src/harness/institution-business-communication.ts",
);
for (const identityPart of Object.values(expectedInstitutionBusinessCommunicationInterface)) {
  assertIncludes(
    institutionBusinessCommunicationSource,
    identityPart,
    "Institution business-communication source exact interface pin",
  );
}
for (const actionKey of expectedHarnessActionKeys) {
  assertIncludes(
    harnessTransportSource,
    `"${actionKey}"`,
    `Harness transport action ${actionKey}`,
  );
}
assertIncludes(
  harnessTransportSource,
  `"${harnessPreparePath}"`,
  "harness transport prepare path",
);
assertIncludes(
  harnessTransportSource,
  `"${harnessExecutePath}"`,
  "harness transport execute path",
);
assertIncludes(
  harnessTransportSource,
  `"${institutionBusinessCommunicationReadPath}"`,
  "Institution business-communication owner-read transport path",
);
const harnessControllerSource = read(
  "apps/scenario-service/src/harness.controller.ts",
);
assertIncludes(
  harnessControllerSource,
  "@Post(HARNESS_PREPARE_PATH)",
  "harness controller prepare route",
);
assertIncludes(
  harnessControllerSource,
  "@Post(HARNESS_EXECUTE_PATH)",
  "harness controller execute route",
);

assertIncludes(
  harnessControllerSource,
  "@Post(HARNESS_QUERY_PATH)",
  "harness controller query route",
);
assertIncludes(
  harnessControllerSource,
  "@Post(HARNESS_READ_RESULT_PATH)",
  "harness controller read-result route",
);
assertIncludes(
  harnessControllerSource,
  "@Post(INSTITUTION_BUSINESS_COMMUNICATION_READ_PATH)",
  "Institution business-communication owner-read controller route",
);

const apiIndex = JSON.parse(read("docs/context/api/api-index.json"));
assertArrayEqual(
  apiIndex.endpoints
    .map((endpoint) => `${endpoint.method} ${endpoint.path}`)
    .sort(),
  [
    `GET ${healthPath}`,
    `POST ${ownerPath}`,
    `POST ${harnessPreparePath}`,
    `POST ${harnessExecutePath}`,
    `POST ${harnessQueryPath}`,
    `POST ${harnessReadResultPath}`,
    `POST ${institutionBusinessCommunicationReadPath}`,
  ].sort(),
  "API index formal route set",
);
const institutionBusinessCommunicationReadIndex = apiIndex.endpoints.find(
  (endpoint) =>
    endpoint.method === "POST" &&
    endpoint.path === institutionBusinessCommunicationReadPath,
);
assertTruthy(
  institutionBusinessCommunicationReadIndex,
  "API index Institution business-communication owner-read operation",
);
assertArrayEqual(
  institutionBusinessCommunicationReadIndex.input?.body?.required ?? [],
  expectedInstitutionBusinessCommunicationReadFields,
  "API index Institution business-communication owner-read required fields",
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
  "[ok] formal ingress contract routes=7 owner-fields=8 harness-actions=8 harness-execute-fields=8 institution-owner-read-fields=5\n",
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
