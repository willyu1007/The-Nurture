#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseYaml } from "../.ai/scripts/lib/yaml-lite.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath) =>
  fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
const readJson = (relativePath) => JSON.parse(read(relativePath));

/**
 * The exact artifact T-005 was qualified against. It is history, not the
 * current head: later tasks MAY rotate the artifact, but only additively.
 * `compatibility-policy.json` states `additiveNewSlice:
 * preserve_existing_slice_evidence`, so this guard proves the rotation really
 * was additive instead of re-pinning the head and losing the guarantee.
 */
const qualifiedInterface = {
  key: "nurture.surface-contract",
  version: "1.8.0",
  digest:
    "sha256:4fe91e1314c89d09c4081001a61b93ff68392000f7725e8e21a8e7209341d47a",
};
const expectedSharedCoreHash =
  // Rotated by surface contract 1.16.0 (T-009 I6: guardian current-focus
  // cession changed the shared envelope enum); re-verified in the same batch.
  "sha256:7bd8a82d4ad6e2ee6a5cdf02f50792049fe7bdfa546992058cb860c1baac4c6d";
/** Exact key@version plus the slice hash each one was qualified with. */
const expectedCapabilitySlices = {
  "acknowledge_family_care_item@1.0.0":
    "sha256:6237365e4a1538de56f71abec0b1bf387180d29740c455a4246b5721a2a35cf7",
  "correct_family_care_message@1.0.0":
    "sha256:111c258019da3988278ca94156436d38b2d1e3f002306e17cb8fec4ad8c856c3",
  "initiate_caregiver_direct_message@1.0.0":
    "sha256:d88aec58676ddc83c5a1e7e437a12aec97e056f351f386d1017ec4bf6349ac05",
  "policy_redact_family_care_message@1.0.0":
    "sha256:6ea83260c0ce7141ffdcc4b781ea28613feeb9f2be123131c0a3711f00612371",
  "query_caregiver_family_care_work@1.1.0":
    "sha256:c670fee50cee1cd814ac376c0f2933ba621deb3c1d6502c2253b4c956f32b9b7",
  "query_family_care_item@1.1.0":
    "sha256:1bfdbb7f79b68a929799fd8959d20e5c95b6bef7d517780a35f7d076286ef323",
  "query_guardian_family_care_timeline@1.1.0":
    "sha256:4834eb685080ad38befdcf157af3ddc392763a77331251c2722c4b2253b08793",
  "redact_family_care_message@1.0.0":
    "sha256:136ad70d1d4f0eb84a3417cfc5c5274f95cb2d134a03551a13a48843204cbbe5",
  "reply_family_care_item@1.0.0":
    "sha256:6b726c8e5aafd945c624c1b460aa1307b37a975119b43363a6d6579640d70da6",
  "submit_family_care_question@1.0.0":
    "sha256:1c85661fb834cbf937548f7bc28aa2df963a6c27b7ed4464598887b4e6a10d68",
  "withdraw_family_care_request@1.0.0":
    "sha256:9f76604c4ad892d8d5b9740390e6493b5026f5ced678e42c1ff3fd3d5988612b",
};
const expectedCapabilities = Object.keys(expectedCapabilitySlices);
const g2ExitRecordPath =
  "dev-docs/archive/nurture-family-care-conversation/14-g2-exit-qualification-and-beta-handoff.md";
const qualifiedNurtureSelfPin =
  "4cd8b8b5e59869af9f5b957845a3daa054e4c3754484371b4f3795d341948d3e";
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

// The qualified identity is recorded evidence and must stay readable in the
// archived exit record, whatever the current head is.
const g2ExitRecord = read(g2ExitRecordPath);
for (const identityPart of [qualifiedInterface.version, qualifiedInterface.digest]) {
  assertTruthy(
    g2ExitRecord.includes(identityPart),
    `G2 Exit record retains ${identityPart}`,
  );
}
assertTruthy(
  g2ExitRecord.includes(`${qualifiedNurtureSelfPin.slice(0, 8)}…`),
  "G2 Exit record retains its historical Nurture scenario self-pin",
);

const artifactPin = readJson(
  "packages/nurture-scenario/contracts/surfaces/v1/generated/surface-contract.artifact-pin.json",
);
const generatedManifest = readJson(
  "packages/nurture-scenario/contracts/surfaces/v1/generated/surface-contract.manifest.json",
);
assertDeepEqual(
  artifactPin.interfaceContract,
  generatedManifest.interfaceContract,
  "artifact pin matches the generated manifest",
);
assertEqual(
  artifactPin.interfaceContract?.key,
  qualifiedInterface.key,
  "surface contract key",
);
assertTruthy(
  compareSemver(
    String(artifactPin.interfaceContract?.version),
    qualifiedInterface.version,
  ) >= 0,
  `current surface version must not regress below ${qualifiedInterface.version}`,
);
// Any shared-core change invalidates all surface-contract evidence, so an
// unchanged shared core is what keeps the G2 Exit qualification valid.
assertEqual(
  generatedManifest.sharedCoreHash,
  expectedSharedCoreHash,
  "G1 shared-core hash",
);
const generatedSlices = new Map(
  (generatedManifest.capabilities ?? []).map((capability) => [
    `${capability.capabilityKey}@${capability.capabilityVersion}`,
    capability.sliceHash,
  ]),
);
for (const [pair, sliceHash] of Object.entries(expectedCapabilitySlices)) {
  assertEqual(
    generatedSlices.get(pair),
    sliceHash,
    `G2 Exit capability slice ${pair}`,
  );
}

const sourceRegistry = readJson(
  "packages/nurture-scenario/contracts/surfaces/v1/source/capabilities/capability-registry.json",
);
assertEqual(
  sourceRegistry.contract?.key,
  qualifiedInterface.key,
  "source registry identity",
);
assertEqual(
  sourceRegistry.contract?.version,
  artifactPin.interfaceContract?.version,
  "source registry version matches the generated artifact",
);
const sourcePairs = new Set(capabilityPairs(sourceRegistry.capabilities));
for (const pair of expectedCapabilities) {
  assertTruthy(sourcePairs.has(pair), `source capability population keeps ${pair}`);
}

const workflowPin = readJson(
  "docs/project/integrations/my-chat-workflow-contract.json",
);
assertEqual(
  workflowPin.myWorkflowBase?.revision,
  // Requalified on 2026-08-12 against the current C30 upstream pin.
  "536638a204865ebdc43bca70992388352789a36f",
  "My-Workflow-Base revision",
);
assertEqual(
  workflowPin.myChat?.revision,
  // Resealed on 2026-08-13 after the T-042 authorization-hardening batch:
  // x5_joint_api content rotated (worker/notification/scenario-integration
  // fixes); the shared Base/My-Chat workflow contract and wave4 profile
  // remain byte-identical.
  "b90cce2e11e17dec238854b39954b4dae31e14db",
  "My-Chat revision",
);
assertEqual(
  workflowPin.myWorkflowBase?.contractSha256,
  // The current Base/My-Chat contract populations remain byte-identical.
  "85cf56e24227e730f23f5b5f68684aec507d04b017e8746e4d078a2dd2151225",
  "My-Workflow-Base workflow contract hash",
);
assertEqual(
  workflowPin.myChat?.contractSha256,
  workflowPin.myWorkflowBase?.contractSha256,
  "Base/My-Chat workflow contract parity",
);
assertTruthy(
  /^[0-9a-f]{64}$/.test(workflowPin.nurtureScenario?.contractSha256 ?? ""),
  "current Nurture scenario self-pin remains exact",
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
  "export const nurtureScenarioModule: WorkflowScenarioModule = {",
  "canonical default-off scenario module",
);
assertTruthy(
  !scenarioModule.includes("createNurtureActivationScenarioModule") &&
    !scenarioModule.includes("nurturePreActivationScenarioModule"),
  "C30-I3 removes activation/pre-activation module aliases",
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
  `[ok] G2 Exit contract ${qualifiedInterface.key}@${qualifiedInterface.version} ` +
    `current=${artifactPin.interfaceContract.version} ` +
    `capabilities=${expectedCapabilities.length} slices=preserved ` +
    `shared-core=${expectedSharedCoreHash} ` +
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

function compareSemver(left, right) {
  const parse = (value) => String(value).split(".").map((part) => Number(part));
  const [leftParts, rightParts] = [parse(left), parse(right)];
  for (let index = 0; index < 3; index += 1) {
    const difference = (leftParts[index] ?? 0) - (rightParts[index] ?? 0);
    if (difference !== 0) return difference > 0 ? 1 : -1;
  }
  return 0;
}
