import { createHash } from "node:crypto";
import type {
  CapabilityDescriptorV1,
  ContractAdmissionV1,
  DependencyGateStageV1,
  DependencyReadinessV1,
  DependencyStateV1,
  InterfaceContractRefV1,
  SurfaceContractArtifactPinV1,
  SurfaceContractManifestV1,
} from "./types.js";

const digestPattern = /^sha256:[0-9a-f]{64}$/;
const semverPattern =
  /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/;
const stableKeyPattern = /^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/;
const schemaRefPattern =
  /^schema:nurture\.[a-z0-9]+(?:-[a-z0-9]+)*@[1-9][0-9]*$/;
const sourceArtifactPathPattern =
  /^[a-z0-9]+(?:[/-][a-z0-9]+)*(?:\.schema)?\.json$/;
const dependencyGateStages = [
  "contract_boundary",
  "owner_integration",
  "joint_conformance",
  "activation",
] as const;
const invalidationScopeKinds = [
  "capability",
  "surface",
  "target",
  "collection",
  "subject",
  "care_group",
  "enrollment",
  "institution",
] as const;
const capabilityActorRoles = [
  "guardian",
  "caregiver",
  "lead_caregiver",
  "institution_admin",
  "system_policy",
] as const;

const descriptorKeys = [
  "capabilityKey",
  "capabilityVersion",
  "contract",
  "domainClass",
  "executionClass",
  "deliveryClass",
  "intentKeys",
  "inputSchemaRef",
  "resultSchemaRef",
  "errorSchemaRef",
  "targetPolicy",
  "confirmationPolicy",
  "concurrencyPolicy",
  "eligibilityPolicyRef",
  "handlerBinding",
  "presenterBindings",
  "invalidationScopeKinds",
  "dependencyGates",
  "supportedRoles",
] as const;

const gateRank: Record<DependencyGateStageV1, number> = {
  contract_boundary: 0,
  owner_integration: 1,
  joint_conformance: 2,
  activation: 3,
};

export class SurfaceContractValidationError extends Error {
  readonly code = "invalid_surface_contract";
}

export function loadSurfaceContractManifest(
  input: unknown,
  trustedArtifactPin: unknown,
): SurfaceContractManifestV1 {
  const manifest = asRecord(input, "manifest");
  assertExactKeys(
    manifest,
    [
      "schemaVersion",
      "interfaceContract",
      "canonicalization",
      "sourceSet",
      "sharedCoreHash",
      "capabilities",
      "surfaces",
      "fixtures",
      "admission",
    ],
    "manifest",
  );
  assertEqual(manifest.schemaVersion, 1, "manifest.schemaVersion");
  const contract = validateContractRef(
    manifest.interfaceContract,
    "manifest.interfaceContract",
  );
  validateCanonicalization(manifest.canonicalization);
  const sourceDigest = validateSourceSet(manifest.sourceSet);
  if (sourceDigest !== contract.digest) {
    fail("manifest source digest must equal the exact interface digest");
  }
  assertDigest(manifest.sharedCoreHash, "manifest.sharedCoreHash");
  validateCapabilities(manifest.capabilities, contract);
  validateSurfaces(manifest.surfaces);
  validateFixtures(manifest.fixtures);
  validateAdmission(manifest.admission);
  validateTrustedArtifactPin(trustedArtifactPin, contract, input);
  deepFreeze(input);
  return input as SurfaceContractManifestV1;
}

export function admitSurfaceContract(
  expected: InterfaceContractRefV1,
  actual: InterfaceContractRefV1,
): ContractAdmissionV1 {
  if (
    expected.key === actual.key &&
    expected.version === actual.version &&
    expected.digest === actual.digest
  ) {
    return { admitted: true, contract: actual };
  }
  return {
    admitted: false,
    error: {
      code: "contract_mismatch",
      retryHint: "required_upgrade",
      contract: actual,
    },
  };
}

export function findCapabilityExact(
  manifest: SurfaceContractManifestV1,
  capabilityKey: string,
  capabilityVersion: string,
): CapabilityDescriptorV1 | undefined {
  return manifest.capabilities.find(
    (entry) =>
      entry.capabilityKey === capabilityKey &&
      entry.capabilityVersion === capabilityVersion,
  )?.descriptor;
}

export function evaluateDependencyReadiness(
  descriptor: CapabilityDescriptorV1,
  dependencyStates: readonly DependencyStateV1[],
): DependencyReadinessV1 {
  const states = validateDependencyStates(dependencyStates);
  const reasons: Array<{
    code: "dependency_no_go";
    dependencyKey: string;
    retryHint: "required_upgrade" | "none";
  }> = [];

  for (const gate of descriptor.dependencyGates) {
    const state = states.get(gate.dependencyKey);
    if (!state) {
      reasons.push({
        code: "dependency_no_go",
        dependencyKey: gate.dependencyKey,
        retryHint: "none",
      });
      continue;
    }
    if (
      compareSemver(state.version, gate.minimumVersion) < 0 ||
      gateRank[state.achievedGate] < gateRank[gate.requiredGate]
    ) {
      reasons.push({
        code: "dependency_no_go",
        dependencyKey: gate.dependencyKey,
        retryHint:
          compareSemver(state.version, gate.minimumVersion) < 0
            ? "required_upgrade"
            : "none",
      });
    }
  }

  return reasons.length === 0
    ? { status: "eligible", reasons: [] }
    : { status: "unavailable", reasons };
}

function validateContractRef(
  value: unknown,
  label: string,
): InterfaceContractRefV1 {
  const contract = asRecord(value, label);
  assertExactKeys(contract, ["key", "version", "digest"], label);
  assertEqual(contract.key, "nurture.surface-contract", `${label}.key`);
  assertSemver(contract.version, `${label}.version`);
  assertDigest(contract.digest, `${label}.digest`);
  return contract as InterfaceContractRefV1;
}

function validateCanonicalization(value: unknown): void {
  const canonicalization = asRecord(value, "manifest.canonicalization");
  assertExactKeys(
    canonicalization,
    [
      "schemaVersion",
      "algorithm",
      "encoding",
      "inventoryOrder",
      "objectKeys",
      "arrayOrder",
      "duplicateObjectKeys",
    ],
    "manifest.canonicalization",
  );
  assertEqual(
    canonicalization.schemaVersion,
    1,
    "canonicalization.schemaVersion",
  );
  assertEqual(canonicalization.algorithm, "sha256", "canonicalization.algorithm");
  assertEqual(canonicalization.encoding, "utf-8", "canonicalization.encoding");
  assertEqual(
    canonicalization.inventoryOrder,
    "path_lexicographic",
    "canonicalization.inventoryOrder",
  );
  assertEqual(
    canonicalization.objectKeys,
    "lexicographic",
    "canonicalization.objectKeys",
  );
  assertEqual(
    canonicalization.arrayOrder,
    "semantic_except_declared_registries",
    "canonicalization.arrayOrder",
  );
  assertEqual(
    canonicalization.duplicateObjectKeys,
    "reject",
    "canonicalization.duplicateObjectKeys",
  );
}

function validateSourceSet(value: unknown): string {
  const sourceSet = asRecord(value, "manifest.sourceSet");
  assertExactKeys(sourceSet, ["sourceDigest", "inventory"], "sourceSet");
  assertDigest(sourceSet.sourceDigest, "sourceSet.sourceDigest");
  const sourceDigest = sourceSet.sourceDigest;
  const inventory = asArray(sourceSet.inventory, "sourceSet.inventory");
  if (inventory.length === 0) fail("sourceSet.inventory must not be empty");
  let priorPath = "";
  const seen = new Set<string>();
  for (const [index, entryValue] of inventory.entries()) {
    const entry = asRecord(entryValue, `sourceSet.inventory[${index}]`);
    assertExactKeys(
      entry,
      ["path", "artifactHash"],
      `sourceSet.inventory[${index}]`,
    );
    const artifactPath = asString(
      entry.path,
      `sourceSet.inventory[${index}].path`,
    );
    if (!sourceArtifactPathPattern.test(artifactPath)) {
      fail(`sourceSet.inventory[${index}].path is not canonical`);
    }
    if (seen.has(artifactPath) || artifactPath.localeCompare(priorPath) < 0) {
      fail("sourceSet.inventory must be unique and path-sorted");
    }
    seen.add(artifactPath);
    priorPath = artifactPath;
    assertDigest(
      entry.artifactHash,
      `sourceSet.inventory[${index}].artifactHash`,
    );
  }
  return sourceDigest;
}

function validateCapabilities(
  value: unknown,
  contract: InterfaceContractRefV1,
): void {
  const capabilities = asArray(value, "manifest.capabilities");
  const identities = new Set<string>();
  let priorKey = "";
  for (const [index, entryValue] of capabilities.entries()) {
    const entry = asRecord(entryValue, `capabilities[${index}]`);
    assertExactKeys(
      entry,
      ["capabilityKey", "capabilityVersion", "sliceHash", "descriptor"],
      `capabilities[${index}]`,
    );
    const key = asString(entry.capabilityKey, `capabilities[${index}].key`);
    assertStableKey(key, `capabilities[${index}].key`);
    const version = assertSemver(
      entry.capabilityVersion,
      `capabilities[${index}].version`,
    );
    const identity = `${key}@${version}`;
    if (identities.has(identity) || key.localeCompare(priorKey) < 0) {
      fail("manifest.capabilities must be unique and key-sorted");
    }
    identities.add(identity);
    priorKey = key;
    assertDigest(entry.sliceHash, `capabilities[${index}].sliceHash`);
    const descriptor = asRecord(
      entry.descriptor,
      `capabilities[${index}].descriptor`,
    );
    const allowedDescriptorKeys = descriptorKeys.filter(
      (field) => field !== "supportedRoles" || field in descriptor,
    );
    assertExactKeys(
      descriptor,
      allowedDescriptorKeys,
      `capabilities[${index}].descriptor`,
    );
    assertEqual(descriptor.capabilityKey, key, `${identity}.descriptor.key`);
    assertEqual(
      descriptor.capabilityVersion,
      version,
      `${identity}.descriptor.version`,
    );
    const descriptorContract = validateContractRef(
      descriptor.contract,
      `${identity}.descriptor.contract`,
    );
    if (!admitSurfaceContract(contract, descriptorContract).admitted) {
      fail(`${identity} descriptor contract does not match manifest`);
    }
    validateDescriptorStructure(descriptor, identity);
  }
}

function validateDescriptorStructure(
  descriptor: Record<string, unknown>,
  identity: string,
): void {
  const targetPolicy = asRecord(
    descriptor.targetPolicy,
    `${identity}.targetPolicy`,
  );
  assertExactKeys(
    targetPolicy,
    ["kind", "optionSchemaRef"],
    `${identity}.targetPolicy`,
  );
  const targetKind = asString(
    targetPolicy.kind,
    `${identity}.targetPolicy.kind`,
  );
  assertOneOf(
    targetKind,
    ["none", "exact_bound", "owner_option_required", "unique_eligible_default"],
    `${identity}.targetPolicy.kind`,
  );
  if (targetKind === "none") {
    assertEqual(
      targetPolicy.optionSchemaRef,
      null,
      `${identity}.targetPolicy.optionSchemaRef`,
    );
  } else {
    asString(
      targetPolicy.optionSchemaRef,
      `${identity}.targetPolicy.optionSchemaRef`,
    );
    assertSchemaRef(
      targetPolicy.optionSchemaRef,
      `${identity}.targetPolicy.optionSchemaRef`,
    );
  }
  const concurrency = asRecord(
    descriptor.concurrencyPolicy,
    `${identity}.concurrencyPolicy`,
  );
  assertOneOf(
    asString(concurrency.class, `${identity}.concurrencyPolicy.class`),
    ["exact_state", "lifecycle_authority", "append_compatible"],
    `${identity}.concurrencyPolicy.class`,
  );
  assertExactKeys(
    concurrency,
    ["class", "headBindings"],
    `${identity}.concurrencyPolicy`,
  );
  const headBindings = asArray(
    concurrency.headBindings,
    `${identity}.headBindings`,
  );
  assertUniqueCanonical(headBindings, `${identity}.headBindings`);
  for (const [index, bindingValue] of headBindings.entries()) {
    const binding = asRecord(bindingValue, `${identity}.headBindings[${index}]`);
    const expectedKeys = ["headKey", "mode"];
    if ("predicateRef" in binding) expectedKeys.push("predicateRef");
    if ("postconditionRef" in binding) expectedKeys.push("postconditionRef");
    assertExactKeys(
      binding,
      expectedKeys,
      `${identity}.headBindings[${index}]`,
    );
    assertStableKey(
      asString(binding.headKey, `${identity}.headBindings[${index}].headKey`),
      `${identity}.headBindings[${index}].headKey`,
    );
    const mode = asString(
      binding.mode,
      `${identity}.headBindings[${index}].mode`,
    );
    assertOneOf(
      mode,
      [
        "must_equal",
        "must_satisfy",
        "compatible_append",
        "convergent_postcondition",
      ],
      `${identity}.headBindings[${index}].mode`,
    );
    if (mode === "must_satisfy") {
      if (!("predicateRef" in binding) || "postconditionRef" in binding) {
        fail(`${identity}.headBindings[${index}] requires predicateRef only`);
      }
      validateVersionedRef(
        binding.predicateRef,
        `${identity}.headBindings[${index}].predicateRef`,
      );
    } else if (mode === "convergent_postcondition") {
      if (!("postconditionRef" in binding) || "predicateRef" in binding) {
        fail(`${identity}.headBindings[${index}] requires postconditionRef only`);
      }
      validateVersionedRef(
        binding.postconditionRef,
        `${identity}.headBindings[${index}].postconditionRef`,
      );
    } else if ("predicateRef" in binding || "postconditionRef" in binding) {
      fail(`${identity}.headBindings[${index}] cannot carry a condition ref`);
    }
  }
  validateVersionedRef(
    descriptor.eligibilityPolicyRef,
    `${identity}.eligibilityPolicyRef`,
  );
  const handler = asRecord(
    descriptor.handlerBinding,
    `${identity}.handlerBinding`,
  );
  assertExactKeys(
    handler,
    ["bindingKey", "bindingKind"],
    `${identity}.handlerBinding`,
  );
  assertStableKey(
    asString(handler.bindingKey, `${identity}.handlerBinding.bindingKey`),
    `${identity}.handlerBinding.bindingKey`,
  );
  assertOneOf(
    asString(handler.bindingKind, `${identity}.handlerBinding.bindingKind`),
    ["query", "action", "institution_workflow", "publish_process"],
    `${identity}.handlerBinding.bindingKind`,
  );
  const presenterBindings = asArray(
    descriptor.presenterBindings,
    `${identity}.presenterBindings`,
  );
  assertUniqueCanonical(presenterBindings, `${identity}.presenterBindings`);
  for (const [index, presenterValue] of presenterBindings.entries()) {
    const presenter = asRecord(
      presenterValue,
      `${identity}.presenterBindings[${index}]`,
    );
    assertExactKeys(
      presenter,
      ["surfaceKey", "presenterKey"],
      `${identity}.presenterBindings[${index}]`,
    );
    assertStableKey(
      asString(presenter.surfaceKey, `${identity}.presenter.surfaceKey`),
      `${identity}.presenter.surfaceKey`,
    );
    assertStableKey(
      asString(presenter.presenterKey, `${identity}.presenter.presenterKey`),
      `${identity}.presenter.presenterKey`,
    );
  }
  const dependencyGates = asArray(
    descriptor.dependencyGates,
    `${identity}.dependencyGates`,
  );
  assertUniqueCanonical(dependencyGates, `${identity}.dependencyGates`);
  for (const [index, gateValue] of dependencyGates.entries()) {
    const gate = asRecord(gateValue, `${identity}.dependencyGates[${index}]`);
    assertExactKeys(
      gate,
      ["dependencyKey", "minimumVersion", "requiredGate"],
      `${identity}.dependencyGates[${index}]`,
    );
    assertStableKey(
      asString(gate.dependencyKey, `${identity}.dependencyKey`),
      `${identity}.dependencyKey`,
    );
    assertSemver(gate.minimumVersion, `${identity}.minimumVersion`);
    assertOneOf(
      asString(gate.requiredGate, `${identity}.requiredGate`),
      dependencyGateStages,
      `${identity}.requiredGate`,
    );
  }
  const intentKeys = validateUniqueStableKeyArray(
    descriptor.intentKeys,
    `${identity}.intentKeys`,
  );
  if (intentKeys.length === 0) fail(`${identity}.intentKeys must not be empty`);
  const invalidationScopes = validateUniqueStableKeyArray(
    descriptor.invalidationScopeKinds,
    `${identity}.invalidationScopeKinds`,
  );
  if (invalidationScopes.length === 0) {
    fail(`${identity}.invalidationScopeKinds must not be empty`);
  }
  for (const scopeKind of invalidationScopes) {
    assertOneOf(
      scopeKind,
      invalidationScopeKinds,
      `${identity}.invalidationScopeKinds[]`,
    );
  }
  if ("supportedRoles" in descriptor) {
    const roles = validateUniqueStableKeyArray(
      descriptor.supportedRoles,
      `${identity}.supportedRoles`,
    );
    for (const role of roles) {
      assertOneOf(role, capabilityActorRoles, `${identity}.supportedRoles[]`);
    }
  }
  for (const field of ["inputSchemaRef", "resultSchemaRef", "errorSchemaRef"]) {
    assertSchemaRef(descriptor[field], `${identity}.${field}`);
  }
  assertOneOf(
    asString(descriptor.domainClass, `${identity}.domainClass`),
    ["care_interaction", "institution_management", "publish_process", "read_model"],
    `${identity}.domainClass`,
  );
  assertOneOf(
    asString(descriptor.executionClass, `${identity}.executionClass`),
    [
      "query",
      "action_execution",
      "institution_workflow_action",
      "publish_process_transition",
    ],
    `${identity}.executionClass`,
  );
  assertOneOf(
    asString(descriptor.deliveryClass, `${identity}.deliveryClass`),
    ["none", "action_delivery_candidate"],
    `${identity}.deliveryClass`,
  );
  assertOneOf(
    asString(descriptor.confirmationPolicy, `${identity}.confirmationPolicy`),
    ["none", "direct_commit", "reviewable_commit", "strong_confirmation"],
    `${identity}.confirmationPolicy`,
  );
}

function validateVersionedRef(value: unknown, label: string): void {
  const reference = asRecord(value, label);
  assertExactKeys(reference, ["key", "version"], label);
  assertStableKey(asString(reference.key, `${label}.key`), `${label}.key`);
  assertSemver(reference.version, `${label}.version`);
}

function validateSurfaces(value: unknown): void {
  const surfaces = asArray(value, "manifest.surfaces");
  const identities = new Set<string>();
  let priorKey = "";
  for (const [index, entryValue] of surfaces.entries()) {
    const entry = asRecord(entryValue, `surfaces[${index}]`);
    assertExactKeys(
      entry,
      ["surfaceKey", "surfaceVersion", "presenterKey", "sliceHash"],
      `surfaces[${index}]`,
    );
    const key = asString(entry.surfaceKey, `surfaces[${index}].surfaceKey`);
    assertStableKey(key, `surfaces[${index}].surfaceKey`);
    const version = assertSemver(
      entry.surfaceVersion,
      `surfaces[${index}].surfaceVersion`,
    );
    const identity = `${key}@${version}`;
    if (identities.has(identity) || key.localeCompare(priorKey) < 0) {
      fail("manifest.surfaces must be unique and key-sorted");
    }
    identities.add(identity);
    priorKey = key;
    assertStableKey(
      asString(entry.presenterKey, `${identity}.presenterKey`),
      `${identity}.presenterKey`,
    );
    assertDigest(entry.sliceHash, `${identity}.sliceHash`);
  }
}

function validateFixtures(value: unknown): void {
  const fixtures = asArray(value, "manifest.fixtures");
  if (fixtures.length === 0) fail("manifest.fixtures must not be empty");
  const keys = new Set<string>();
  let priorKey = "";
  for (const [index, entryValue] of fixtures.entries()) {
    const entry = asRecord(entryValue, `fixtures[${index}]`);
    assertExactKeys(
      entry,
      ["fixtureKey", "fixtureKind", "sliceHash"],
      `fixtures[${index}]`,
    );
    const key = asString(entry.fixtureKey, `fixtures[${index}].fixtureKey`);
    if (!/^[a-z0-9]+(?:[:-][a-z0-9]+)*$/.test(key) || key.length > 64) {
      fail(`fixtures[${index}].fixtureKey is not a valid fixture key`);
    }
    if (keys.has(key) || key.localeCompare(priorKey) < 0) {
      fail("manifest.fixtures must be unique and key-sorted");
    }
    keys.add(key);
    priorKey = key;
    const kind = asString(entry.fixtureKind, `${key}.fixtureKind`);
    if (kind !== "world" && kind !== "journey" && kind !== "selection") {
      fail(`${key}.fixtureKind is not a known fixture kind`);
    }
    if ((kind === "journey") !== key.startsWith("journey:")) {
      fail(`${key} fixtureKind does not match its key namespace`);
    }
    assertDigest(entry.sliceHash, `${key}.sliceHash`);
  }
}

function validateAdmission(value: unknown): void {
  const admission = asRecord(value, "manifest.admission");
  assertExactKeys(
    admission,
    ["mode", "versionRanges", "latestAlias", "fallback"],
    "manifest.admission",
  );
  assertEqual(admission.mode, "exact_key_version_digest", "admission.mode");
  assertEqual(admission.versionRanges, "forbidden", "admission.versionRanges");
  assertEqual(admission.latestAlias, "forbidden", "admission.latestAlias");
  assertEqual(admission.fallback, "forbidden", "admission.fallback");
}

function validateTrustedArtifactPin(
  value: unknown,
  contract: InterfaceContractRefV1,
  manifest: unknown,
): SurfaceContractArtifactPinV1 {
  const pin = asRecord(value, "trustedArtifactPin");
  assertExactKeys(
    pin,
    [
      "schemaVersion",
      "artifactKind",
      "interfaceContract",
      "manifestDigest",
    ],
    "trustedArtifactPin",
  );
  assertEqual(pin.schemaVersion, 1, "trustedArtifactPin.schemaVersion");
  assertEqual(
    pin.artifactKind,
    "surface_contract_manifest",
    "trustedArtifactPin.artifactKind",
  );
  const pinnedContract = validateContractRef(
    pin.interfaceContract,
    "trustedArtifactPin.interfaceContract",
  );
  if (!admitSurfaceContract(pinnedContract, contract).admitted) {
    fail("trusted artifact pin contract does not match manifest");
  }
  assertDigest(pin.manifestDigest, "trustedArtifactPin.manifestDigest");
  if (pin.manifestDigest !== digestCanonical(manifest)) {
    fail("manifest content does not match the trusted artifact pin");
  }
  return pin as SurfaceContractArtifactPinV1;
}

function validateDependencyStates(
  values: readonly DependencyStateV1[],
): Map<string, DependencyStateV1> {
  const states = new Map<string, DependencyStateV1>();
  for (const [index, value] of (values as readonly unknown[]).entries()) {
    const state = asRecord(value, `dependencyStates[${index}]`);
    assertExactKeys(
      state,
      ["dependencyKey", "version", "achievedGate"],
      `dependencyStates[${index}]`,
    );
    const dependencyKey = asString(
      state.dependencyKey,
      `dependencyStates[${index}].dependencyKey`,
    );
    assertStableKey(
      dependencyKey,
      `dependencyStates[${index}].dependencyKey`,
    );
    assertSemver(state.version, `dependencyStates[${index}].version`);
    assertOneOf(
      asString(
        state.achievedGate,
        `dependencyStates[${index}].achievedGate`,
      ),
      dependencyGateStages,
      `dependencyStates[${index}].achievedGate`,
    );
    if (states.has(dependencyKey)) {
      fail(`dependencyStates contains duplicate ${dependencyKey}`);
    }
    states.set(dependencyKey, state as DependencyStateV1);
  }
  return states;
}

function compareSemver(left: string, right: string): number {
  const leftParts = left.split(".").map(Number);
  const rightParts = right.split(".").map(Number);
  for (let index = 0; index < 3; index += 1) {
    const difference = (leftParts[index] ?? 0) - (rightParts[index] ?? 0);
    if (difference !== 0) return difference;
  }
  return 0;
}

function validateUniqueStableKeyArray(
  value: unknown,
  label: string,
): string[] {
  const items = asArray(value, label).map((item, index) => {
    const key = asString(item, `${label}[${index}]`);
    assertStableKey(key, `${label}[${index}]`);
    return key;
  });
  if (new Set(items).size !== items.length) {
    fail(`${label} must contain unique values`);
  }
  return items;
}

function assertUniqueCanonical(values: readonly unknown[], label: string): void {
  const canonical = values
    .map(sortObjectKeys)
    .map((value) => JSON.stringify(value));
  if (new Set(canonical).size !== canonical.length) {
    fail(`${label} must contain unique values`);
  }
}

function assertSchemaRef(value: unknown, label: string): void {
  const candidate = asString(value, label);
  if (!schemaRefPattern.test(candidate)) fail(`${label} must be a schema ref`);
}

function assertExactKeys(
  value: Record<string, unknown>,
  expected: readonly string[],
  label: string,
): void {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (
    actual.length !== wanted.length ||
    actual.some((key, index) => key !== wanted[index])
  ) {
    fail(`${label} contains missing or unknown fields`);
  }
}

function asRecord(value: unknown, label: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    fail(`${label} must be an object`);
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    fail(`${label} must be a plain object`);
  }
  return value as Record<string, unknown>;
}

function asArray(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) fail(`${label} must be an array`);
  return value;
}

function asString(value: unknown, label: string): string {
  if (typeof value !== "string") fail(`${label} must be a string`);
  return value;
}

function assertSemver(value: unknown, label: string): string {
  const candidate = asString(value, label);
  if (!semverPattern.test(candidate)) fail(`${label} must be release SemVer`);
  return candidate;
}

function assertDigest(value: unknown, label: string): asserts value is string {
  if (typeof value !== "string" || !digestPattern.test(value)) {
    fail(`${label} must be a lowercase sha256 digest`);
  }
}

function assertEqual(
  actual: unknown,
  expected: string | number | null,
  label: string,
): void {
  if (actual !== expected) fail(`${label} must equal ${expected}`);
}

function assertStableKey(value: string, label: string): void {
  if (!stableKeyPattern.test(value)) fail(`${label} must be a stable key`);
}

function assertOneOf(
  value: string,
  allowed: readonly string[],
  label: string,
): void {
  if (!allowed.includes(value)) {
    fail(`${label} must be one of ${allowed.join(", ")}`);
  }
}

function digestCanonical(value: unknown): string {
  return `sha256:${createHash("sha256")
    .update(JSON.stringify(sortObjectKeys(value)), "utf8")
    .digest("hex")}`;
}

function sortObjectKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortObjectKeys);
  if (typeof value !== "object" || value === null) return value;
  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [
        key,
        sortObjectKeys((value as Record<string, unknown>)[key]),
      ]),
  );
}

function deepFreeze(value: unknown): void {
  if (typeof value !== "object" || value === null || Object.isFrozen(value)) {
    return;
  }
  for (const child of Object.values(value)) deepFreeze(child);
  Object.freeze(value);
}

function fail(message: string): never {
  throw new SurfaceContractValidationError(message);
}
