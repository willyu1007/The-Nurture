import { createHash } from "node:crypto";
import {
  lstatSync,
  readFileSync,
  readdirSync,
  statSync,
} from "node:fs";
import { relative, resolve, sep } from "node:path";
import { parseYaml } from "../../.ai/scripts/lib/yaml-lite.mjs";

export const CANDIDATE_KIND = "nurture_service_candidate_v1";
export const CANDIDATE_REF = "nurture.service-candidate@1.0.0";
export const CANDIDATE_SCHEMA_VERSION = 1;
export const INVENTORY_ALGORITHM =
  "sha256(path_utf8_nul_sha256_bytes_nul_size_decimal_lf)_v1";
export const CANDIDATE_DIGEST_ALGORITHM = "sha256(canonical_json_utf8)_v1";

const executableRoots = [
  "apps/scenario-service/dist",
  "packages/nurture-db/dist",
  "packages/nurture-scenario/dist",
];

const standaloneContractFixtures = [
  "packages/nurture-scenario/contracts/parent-context-presenter/v1/conformance-fixtures.json",
  "packages/nurture-scenario/contracts/parent-communication-owner/v1/conformance-fixtures.json",
  "packages/nurture-scenario/contracts/director-presenter/v1/conformance-fixtures.json",
  "packages/nurture-scenario/contracts/teacher-class-stream/v1/conformance-fixtures.json",
  "packages/nurture-scenario/contracts/teacher-organization-owner/v1/conformance-fixtures.json",
  "packages/nurture-scenario/contracts/teacher-communication-owner/v1/conformance-fixtures.json",
  "packages/nurture-scenario/contracts/teacher-media-association-owner/v1/conformance-fixtures.json",
];

const sha256Hex = (value) => createHash("sha256").update(value).digest("hex");

const compareText = (left, right) => {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
};

export const sha256Ref = (value) => `sha256:${sha256Hex(value)}`;

export const canonicalJson = (value) => {
  if (value === null || typeof value === "boolean" || typeof value === "string") {
    return JSON.stringify(value);
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new TypeError("canonical JSON rejects non-finite numbers");
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((entry) => canonicalJson(entry)).join(",")}]`;
  }
  if (typeof value === "object" && value !== undefined) {
    const entries = Object.entries(value).sort(([left], [right]) => compareText(left, right));
    return `{${entries.map(([key, entry]) =>
      `${JSON.stringify(key)}:${canonicalJson(entry)}`).join(",")}}`;
  }
  throw new TypeError(`canonical JSON rejects ${typeof value}`);
};

export const candidateDigest = (candidate) => {
  const digestInput = { ...candidate };
  delete digestInput.candidate_digest;
  return sha256Ref(Buffer.from(canonicalJson(digestInput), "utf8"));
};

const toRepoPath = (repoRoot, absolutePath) =>
  relative(repoRoot, absolutePath).split(sep).join("/");

const collectPath = (repoRoot, path, output) => {
  const absolutePath = resolve(repoRoot, path);
  const metadata = lstatSync(absolutePath);
  if (metadata.isSymbolicLink()) {
    throw new Error(`Candidate inventory rejects symlink ${toRepoPath(repoRoot, absolutePath)}`);
  }
  if (metadata.isDirectory()) {
    for (const entry of readdirSync(absolutePath, { withFileTypes: true })
      .sort((left, right) => compareText(left.name, right.name))) {
      collectPath(repoRoot, resolve(absolutePath, entry.name), output);
    }
    return;
  }
  if (!metadata.isFile()) {
    throw new Error(`Candidate inventory rejects non-file ${toRepoPath(repoRoot, absolutePath)}`);
  }
  const content = readFileSync(absolutePath);
  output.push({
    path: toRepoPath(repoRoot, absolutePath),
    sha256: sha256Ref(content),
    size_bytes: content.byteLength,
  });
};

export const fileInventory = (repoRoot, paths) => {
  const files = [];
  for (const path of paths) collectPath(repoRoot, path, files);
  files.sort((left, right) => compareText(left.path, right.path));
  const seen = new Set();
  for (const file of files) {
    if (seen.has(file.path)) throw new Error(`Candidate inventory duplicates ${file.path}`);
    seen.add(file.path);
  }
  const aggregate = files.map((file) =>
    `${file.path}\0${file.sha256.slice("sha256:".length)}\0${file.size_bytes}\n`).join("");
  return {
    algorithm: INVENTORY_ALGORITHM,
    digest: sha256Ref(Buffer.from(aggregate, "utf8")),
    file_count: files.length,
    files,
  };
};

const readJson = (repoRoot, path) => JSON.parse(readFileSync(resolve(repoRoot, path), "utf8"));

const fileRef = (repoRoot, path) => {
  const content = readFileSync(resolve(repoRoot, path));
  return { path, sha256: sha256Ref(content), size_bytes: content.byteLength };
};

const interfaceRef = (fixtures) => {
  const value = fixtures.interface_contract ?? fixtures.interface;
  if (!value?.key || !value?.version || !value?.digest) {
    throw new Error("Standalone contract fixtures lack an exact interface identity");
  }
  return { key: value.key, version: value.version, digest: value.digest };
};

const assertDefaultOff = (manifest, envContract, prismaSchema) => {
  const capabilities = manifest.capabilities ?? [];
  const enabledCapabilities = capabilities
    .filter(({ enablement_policy: policy }) => policy !== "disabled")
    .map(({ capability_key: key }) => key);
  const boolDefaults = Object.entries(envContract.variables ?? {})
    .filter(([, variable]) => variable?.type === "bool")
    .map(([key, variable]) => ({ key, default: variable.default }))
    .sort((left, right) => compareText(left.key, right.key));
  const enabledBoolDefaults = boolDefaults.filter(({ default: value }) => value !== false);
  const contracts = manifest.scenario_contracts ?? {};
  const actionOfferCount = (contracts.product_surfaces ?? [])
    .flatMap(({ action_keys: actionKeys }) => actionKeys ?? []).length;
  const census = {
    legacy_capabilities: capabilities.length,
    enabled_legacy_capabilities: enabledCapabilities.length,
    production_contract_capabilities: (contracts.capability_dependencies ?? []).length,
    production_domain_actions: (contracts.domain_action_contracts ?? []).length,
    production_protected_interactions: (contracts.protected_interaction_contracts ?? []).length,
    production_action_offers: actionOfferCount,
    configuration_bool_defaults: boolDefaults,
    enabled_configuration_bool_defaults: enabledBoolDefaults.length,
    workspace_activation_models: Number(
      prismaSchema.includes("ScenarioWorkspaceActivation")
      || prismaSchema.includes("ScenarioCapabilityActivation"),
    ),
  };
  if (
    census.enabled_legacy_capabilities !== 0
    || census.production_domain_actions !== 0
    || census.production_protected_interactions !== 0
    || census.production_action_offers !== 0
    || census.enabled_configuration_bool_defaults !== 0
    || census.workspace_activation_models !== 0
  ) {
    throw new Error(`Candidate is not default-off: ${JSON.stringify(census)}`);
  }
  return census;
};

export const buildCandidate = ({ repoRoot, sourceRevision, frozenOn }) => {
  if (!/^[0-9a-f]{40}$/u.test(sourceRevision)) {
    throw new Error("sourceRevision must be one full lowercase Git commit hash");
  }
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(frozenOn)) {
    throw new Error("frozenOn must use YYYY-MM-DD");
  }

  const manifestPath = "packages/nurture-scenario/scenario.manifest.yaml";
  const generatedManifestPath = "packages/nurture-scenario/src/generated/manifest.generated.ts";
  const modulePath = "packages/nurture-scenario/src/module.ts";
  const schemaPath = "prisma/schema.prisma";
  const envContractPath = "env/contract.yaml";
  const generatedEnvContractPath = "docs/context/env/contract.json";
  const betaProfilePath = "dev-docs/active/nurture-store-beta-readiness/08-beta-profile-v1.md";
  const workflowPinPath = "docs/project/integrations/my-chat-workflow-contract.json";
  const c30LockPath = "docs/project/integrations/c30-i3-owner-adoption-lock.json";

  const manifest = parseYaml(readFileSync(resolve(repoRoot, manifestPath), "utf8"));
  const envContract = readJson(repoRoot, generatedEnvContractPath);
  const prismaSchema = readFileSync(resolve(repoRoot, schemaPath), "utf8");
  const workflowPin = readJson(repoRoot, workflowPinPath);
  const c30Lock = readJson(repoRoot, c30LockPath);
  const surfacePin = readJson(
    repoRoot,
    "packages/nurture-scenario/contracts/surfaces/v1/generated/surface-contract.artifact-pin.json",
  );
  const publishedContracts = standaloneContractFixtures
    .map((path) => interfaceRef(readJson(repoRoot, path)))
    .sort((left, right) => left.key.localeCompare(right.key));
  const executable = fileInventory(repoRoot, executableRoots);
  const migrations = fileInventory(repoRoot, ["prisma/migrations"]);
  const migrationDirectories = readdirSync(resolve(repoRoot, "prisma/migrations"), {
    withFileTypes: true,
  }).filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
  const contractSet = fileInventory(repoRoot, ["packages/nurture-scenario/contracts"]);
  const defaultOffCensus = assertDefaultOff(manifest, envContract, prismaSchema);
  const entrypoint = "apps/scenario-service/dist/main.js";
  if (!statSync(resolve(repoRoot, entrypoint)).isFile()) {
    throw new Error(`Candidate executable entrypoint is missing: ${entrypoint}`);
  }

  const candidate = {
    schema_version: CANDIDATE_SCHEMA_VERSION,
    candidate_kind: CANDIDATE_KIND,
    candidate_ref: CANDIDATE_REF,
    candidate_digest: "",
    frozen_on: frozenOn,
    lifecycle: "frozen",
    qualification_state: "not_run",
    deployment_state: "undeployed",
    identity_inputs: {
      source: {
        repository: "willyu1007/The-Nurture",
        revision: sourceRevision,
      },
      executable: {
        target: "@the-nurture/scenario-service",
        artifact_kind: "node_esm_dist_set_v1",
        build_command: "pnpm build:scenario-service",
        install_command: "pnpm install --frozen-lockfile",
        entrypoint,
        node_engine: ">=20.0.0",
        package_manager: "pnpm@9.0.0",
        dependency_lock: fileRef(repoRoot, "pnpm-lock.yaml"),
        runtime_package_manifests: [
          fileRef(repoRoot, "apps/scenario-service/package.json"),
          fileRef(repoRoot, "packages/nurture-db/package.json"),
          fileRef(repoRoot, "packages/nurture-scenario/package.json"),
        ],
        inventory: executable,
      },
      data_shape: {
        prisma_schema: fileRef(repoRoot, schemaPath),
        migration_set: {
          root: "prisma/migrations",
          head: migrationDirectories.at(-1),
          directory_count: migrationDirectories.length,
          inventory: migrations,
        },
      },
      scenario: {
        manifest: fileRef(repoRoot, manifestPath),
        generated_manifest: fileRef(repoRoot, generatedManifestPath),
        public_module: fileRef(repoRoot, modulePath),
        source_closure: {
          algorithm: workflowPin.hashAlgorithm,
          digest: `sha256:${workflowPin.nurtureScenario.contractSha256}`,
          path_count: workflowPin.nurtureScenario.contractPaths.length,
          paths: workflowPin.nurtureScenario.contractPaths,
        },
      },
      contracts_and_fixtures: {
        surface_contract: {
          key: surfacePin.interfaceContract.key,
          version: surfacePin.interfaceContract.version,
          digest: surfacePin.interfaceContract.digest,
          manifest_digest: surfacePin.manifestDigest,
        },
        published_contracts: publishedContracts,
        contract_set: contractSet,
      },
      configuration_and_gates: {
        source_contract: fileRef(repoRoot, envContractPath),
        generated_contract_semantic: {
          path: generatedEnvContractPath,
          algorithm: CANDIDATE_DIGEST_ALGORITHM,
          digest: sha256Ref(Buffer.from(canonicalJson({
            ssot_mode: envContract.ssot_mode,
            envs: envContract.envs,
            variables: envContract.variables,
          }), "utf8")),
        },
        default_off_census: defaultOffCensus,
      },
      beta_profile: {
        ref: "nurture.six-surface-beta-profile@1.0.0",
        state: "CONFIRMED_G5_INPUT",
        artifact: fileRef(repoRoot, betaProfilePath),
      },
      owner_pins: {
        workflow_pin_artifact: fileRef(repoRoot, workflowPinPath),
        base_revision: workflowPin.myWorkflowBase.revision,
        base_contract_digest: `sha256:${workflowPin.myWorkflowBase.contractSha256}`,
        my_chat_revision: workflowPin.myChat.revision,
        my_chat_contract_digest: `sha256:${workflowPin.myChat.contractSha256}`,
        my_chat_x5_joint_api_digest: `sha256:${workflowPin.myChat.sourcePins
          .find(({ key }) => key === "x5_joint_api").sha256}`,
        my_chat_wave4_binding_host_digest: `sha256:${workflowPin.myChat.sourcePins
          .find(({ key }) => key === "wave4_binding_host").sha256}`,
        nurture_scenario_digest: `sha256:${workflowPin.nurtureScenario.contractSha256}`,
        c30_owner_lock_artifact: fileRef(repoRoot, c30LockPath),
        c30_owner_source_digest: `sha256:${c30Lock.source_hash}`,
      },
      freeze_posture: {
        capabilities: "default_off",
        activation_authority: "none",
        deployment_authority: "none",
        database_apply_authority: "none",
        traffic_authority: "none",
      },
    },
    boundaries: {
      contains_secrets: false,
      contains_pii: false,
      contains_my_chat_runtime_or_client_bundle: false,
      authorizes_database_apply: false,
      authorizes_deployment: false,
      authorizes_activation: false,
      authorizes_internal_testing: false,
      authorizes_traffic: false,
    },
  };
  candidate.candidate_digest = candidateDigest(candidate);
  return candidate;
};

export const assertCandidateIntegrity = (candidate) => {
  if (candidate.schema_version !== CANDIDATE_SCHEMA_VERSION) throw new Error("schema drift");
  if (candidate.candidate_kind !== CANDIDATE_KIND) throw new Error("candidate kind drift");
  if (candidate.candidate_ref !== CANDIDATE_REF) throw new Error("candidate ref drift");
  if (candidate.lifecycle !== "frozen") throw new Error("candidate is not frozen");
  if (candidate.qualification_state !== "not_run") throw new Error("Freeze cannot claim qualification");
  if (candidate.deployment_state !== "undeployed") throw new Error("Freeze cannot claim deployment");
  if (candidate.candidate_digest !== candidateDigest(candidate)) {
    throw new Error("candidate digest mismatch");
  }
  if (Object.values(candidate.boundaries ?? {}).some((value) => value !== false)) {
    throw new Error("candidate boundary flags must all remain false");
  }
  if (candidate.identity_inputs?.freeze_posture?.capabilities !== "default_off") {
    throw new Error("candidate capability posture drifted");
  }
};

export const candidateOutputPath = (repoRoot) =>
  resolve(repoRoot, "release/candidates/nurture-service-candidate-1.0.0.json");

export const candidateSchemaPath = (repoRoot) =>
  resolve(repoRoot, "release/candidates/nurture-service-candidate-v1.schema.json");

export const executableInventoryRoots = executableRoots;
