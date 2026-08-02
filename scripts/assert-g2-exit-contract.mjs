#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseYaml } from "../.ai/scripts/lib/yaml-lite.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath) =>
  fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
const readJson = (relativePath) => JSON.parse(read(relativePath));

const expectedInterface = {
  key: "nurture.surface-contract",
  version: "1.8.0",
  digest:
    "sha256:4fe91e1314c89d09c4081001a61b93ff68392000f7725e8e21a8e7209341d47a",
};
const expectedSharedCoreHash =
  "sha256:042272641eb98cb934acfe902259ea93502be92ffa8e95257ddc63abf48c0ae2";
const expectedCapabilities = [
  "acknowledge_family_care_item@1.0.0",
  "correct_family_care_message@1.0.0",
  "initiate_caregiver_direct_message@1.0.0",
  "policy_redact_family_care_message@1.0.0",
  "query_caregiver_family_care_work@1.1.0",
  "query_family_care_item@1.1.0",
  "query_guardian_family_care_timeline@1.1.0",
  "redact_family_care_message@1.0.0",
  "reply_family_care_item@1.0.0",
  "submit_family_care_question@1.0.0",
  "withdraw_family_care_request@1.0.0",
];
const protectedGateVariables = [
  "NURTURE_BINDING_EVIDENCE_KEY",
  "NURTURE_INTERNAL_SERVICE_TOKEN",
  "NURTURE_HARNESS_INTEGRITY_KEY",
  "NURTURE_PROTECTED_CONTENT_KEY",
  "NURTURE_INSTITUTION_BUSINESS_COMMUNICATION_READ_ENABLED",
];
const forbiddenLegacyCapabilityKeys = expectedCapabilities.map((entry) =>
  entry.slice(0, entry.lastIndexOf("@")),
);

const artifactPin = readJson(
  "packages/nurture-scenario/contracts/surfaces/v1/generated/surface-contract.artifact-pin.json",
);
assertDeepEqual(
  artifactPin.interfaceContract,
  expectedInterface,
  "surface artifact pin",
);

const generatedManifest = readJson(
  "packages/nurture-scenario/contracts/surfaces/v1/generated/surface-contract.manifest.json",
);
assertDeepEqual(
  generatedManifest.interfaceContract,
  expectedInterface,
  "generated surface identity",
);
assertEqual(
  generatedManifest.sharedCoreHash,
  expectedSharedCoreHash,
  "G1 shared-core hash",
);
assertDeepEqual(
  capabilityPairs(generatedManifest.capabilities),
  expectedCapabilities,
  "generated capability population",
);

const sourceRegistry = readJson(
  "packages/nurture-scenario/contracts/surfaces/v1/source/capabilities/capability-registry.json",
);
assertDeepEqual(
  sourceRegistry.contract,
  { key: expectedInterface.key, version: expectedInterface.version },
  "source registry identity",
);
assertDeepEqual(
  capabilityPairs(sourceRegistry.capabilities),
  expectedCapabilities,
  "source capability population",
);

const workflowPin = readJson(
  "docs/project/integrations/my-chat-workflow-contract.json",
);
assertEqual(
  workflowPin.myWorkflowBase?.revision,
  "06303e9f404e4ccc0ba3054b763675efe81b5b15",
  "My-Workflow-Base revision",
);
assertEqual(
  workflowPin.myChat?.revision,
  "a0195662228a2fc6323b9ea0cd327d3608d8cc17",
  "My-Chat revision",
);
assertEqual(
  workflowPin.myWorkflowBase?.contractSha256,
  "8dd53be4ba392c6eb254c462066d9c7e65b239bc79142911de4ef58faf3da34d",
  "My-Workflow-Base workflow contract hash",
);
assertEqual(
  workflowPin.myChat?.contractSha256,
  workflowPin.myWorkflowBase?.contractSha256,
  "Base/My-Chat workflow contract parity",
);
assertEqual(
  workflowPin.nurtureScenario?.contractSha256,
  "a23f0c069dbd335c4c0b2befec5443bf9e151595ea0b6dfd8c95ae7f99173141",
  "Nurture scenario self-pin",
);

const envContract = parseYaml(read("env/contract.yaml"));
for (const variable of protectedGateVariables.slice(0, 4)) {
  const contract = envContract.variables?.[variable];
  assertTruthy(contract, `environment contract ${variable}`);
  assertEqual(contract.required, false, `${variable} optional/default-off`);
  assertEqual(contract.secret, true, `${variable} secret classification`);
}
assertEqual(
  envContract.variables?.NURTURE_INSTITUTION_BUSINESS_COMMUNICATION_READ_ENABLED
    ?.default,
  false,
  "Institution owner-read default",
);
for (const profile of ["dev", "staging", "prod"]) {
  const values = parseYaml(read(`env/values/${profile}.yaml`));
  for (const variable of protectedGateVariables) {
    assertEqual(
      Object.hasOwn(values, variable),
      false,
      `${profile} must not activate ${variable}`,
    );
  }
}

const scenarioManifest = parseYaml(
  read("packages/nurture-scenario/scenario.manifest.yaml"),
);
assertEqual(scenarioManifest.launch_phase, "dev", "scenario launch phase");
assertEqual(
  scenarioManifest.scenario_record?.required_status,
  "draft",
  "scenario required status",
);
const legacyManifestText = JSON.stringify(scenarioManifest);
for (const capabilityKey of forbiddenLegacyCapabilityKeys) {
  assertEqual(
    legacyManifestText.includes(`\"${capabilityKey}\"`),
    false,
    `legacy Workflow manifest must not activate ${capabilityKey}`,
  );
}

const harnessRuntime = read("apps/scenario-service/src/harness-runtime.ts");
for (const variable of [
  "NURTURE_HARNESS_INTEGRITY_KEY",
  "NURTURE_PROTECTED_CONTENT_KEY",
]) {
  assertIncludes(harnessRuntime, variable, `Harness runtime gate ${variable}`);
}
assertIncludes(
  harnessRuntime,
  "return new HarnessRuntime(undefined);",
  "Harness incomplete-config fail-closed branch",
);
const bindingOwnerRuntime = read(
  "apps/scenario-service/src/binding-owner-runtime.ts",
);
assertIncludes(
  bindingOwnerRuntime,
  "NURTURE_BINDING_EVIDENCE_KEY",
  "binding-owner evidence gate",
);
const serviceConfig = read("apps/scenario-service/src/config.ts");
for (const variable of [
  "NURTURE_INTERNAL_SERVICE_TOKEN",
  "NURTURE_INSTITUTION_BUSINESS_COMMUNICATION_READ_ENABLED",
]) {
  assertIncludes(serviceConfig, variable, `scenario-service gate ${variable}`);
}
const scenarioModule = read("packages/nurture-scenario/src/module.ts");
assertIncludes(
  scenarioModule,
  "export const nurtureScenarioModule = nurturePreActivationScenarioModule;",
  "default scenario module pre-activation alias",
);

const migration = read(
  "prisma/migrations/20260801021044_g2_three_axis_care_interaction/migration.sql",
);
assertEqual(
  migration.split("legacy_migrated_v1").length - 1,
  1,
  "migration must declare but never guess legacy_migrated_v1 rows",
);
for (const guard of [
  "ck_nurture_item_g2_complete_graph",
  "ck_nurture_item_lifecycle_reason",
  "ck_nurture_message_g2_scope",
  "ck_nurture_message_g2_protected_body",
  "ck_nurture_message_g2_reply_order",
  "uq_nurture_reply_order",
]) {
  assertIncludes(migration, guard, `G2 migration guard ${guard}`);
}

const legacyCutoverTests = read(
  "packages/nurture-db/tests/g2-legacy-cutover.integration.test.ts",
);
for (const behavior of [
  "refuses a legacy acknowledge against a harness-managed item",
  "refuses a legacy reply against a harness-managed item and writes nothing",
  "refuses a legacy redaction against a harness-managed message",
  "still lets the legacy path drive genuinely legacy rows",
]) {
  assertIncludes(legacyCutoverTests, behavior, `legacy cutover test ${behavior}`);
}
const checkpointTests = read(
  "packages/nurture-db/tests/g2a-checkpoint.integration.test.ts",
);
for (const behavior of [
  "produces surface-equivalent canonical effects and refusals for chat and board",
  "passes the per-workspace leakage census over the whole loop",
]) {
  assertIncludes(checkpointTests, behavior, `G2 qualification test ${behavior}`);
}

process.stdout.write(
  `[ok] G2 Exit contract ${expectedInterface.key}@${expectedInterface.version} ` +
    `capabilities=${expectedCapabilities.length} shared-core=${expectedSharedCoreHash} ` +
    "pins=exact gates=default-off legacy-activation=absent\n",
);

function capabilityPairs(capabilities) {
  const pairs = (capabilities ?? [])
    .map((capability) =>
      `${capability.capabilityKey}@${capability.capabilityVersion}`,
    )
    .sort();
  assertEqual(new Set(pairs).size, pairs.length, "unique capability population");
  return pairs;
}

function assertTruthy(value, label) {
  if (!value) throw new Error(`${label}: expected a truthy value`);
}

function assertIncludes(content, expected, label) {
  if (!content.includes(expected)) {
    throw new Error(`${label}: missing ${JSON.stringify(expected)}`);
  }
}

function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(
      `${label}: expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`,
    );
  }
}

function assertDeepEqual(actual, expected, label) {
  const actualJson = JSON.stringify(canonicalize(actual));
  const expectedJson = JSON.stringify(canonicalize(expected));
  if (actualJson !== expectedJson) {
    throw new Error(
      `${label}: expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`,
    );
  }
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, child]) => [key, canonicalize(child)]),
    );
  }
  return value;
}
