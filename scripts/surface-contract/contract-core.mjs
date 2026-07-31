/** @reference .ai/skills/standards/naming-conventions/SKILL.md */

import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));

export const repoRoot = path.resolve(scriptDirectory, "../..");
export const sourceRoot = path.join(
  repoRoot,
  "packages/nurture-scenario/contracts/surfaces/v1/source",
);
export const generatedManifestPath = path.join(
  repoRoot,
  "packages/nurture-scenario/contracts/surfaces/v1/generated/surface-contract.manifest.json",
);
export const generatedArtifactPinPath = path.join(
  path.dirname(generatedManifestPath),
  "surface-contract.artifact-pin.json",
);

const descriptorKeys = new Set([
  "capabilityKey",
  "capabilityVersion",
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
]);

const stableKeyPattern = /^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/;
const semverPattern = /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/;

export async function buildSurfaceContract(outputPath = generatedManifestPath) {
  assertGeneratedOutputPath(outputPath);
  const sourceFiles = await collectJsonFiles(sourceRoot);
  const parsedByPath = new Map();
  for (const absolutePath of sourceFiles) {
    const relativePath = toPosix(path.relative(sourceRoot, absolutePath));
    const text = await readFile(absolutePath, "utf8");
    parsedByPath.set(relativePath, parseStrictJson(text, relativePath));
  }

  const canonicalization = objectAt(
    parsedByPath,
    "interface/canonicalization.json",
  );
  const normalizedByPath = normalizeArtifacts(parsedByPath, canonicalization);
  validateSource(normalizedByPath, canonicalization);

  const sourceArtifacts = [...normalizedByPath.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([artifactPath, value]) => ({
      path: artifactPath,
      value,
    }));

  const rootPayload = {
    canonicalizationSchemaVersion: integer(
      canonicalization.schemaVersion,
      "canonicalization.schemaVersion",
    ),
    artifacts: sourceArtifacts,
  };
  const rootDigest = digest(rootPayload);
  const contractRegistry = objectAt(
    normalizedByPath,
    "capabilities/capability-registry.json",
  );
  const contractSource = record(
    contractRegistry.contract,
    "capability registry contract",
  );
  const interfaceContract = {
    key: text(contractSource.key, "contract.key"),
    version: text(contractSource.version, "contract.version"),
    digest: rootDigest,
  };

  const inventory = sourceArtifacts.map((artifact) => ({
    path: artifact.path,
    artifactHash: digest(artifact.value),
  }));
  const sharedCoreHash = buildSharedCoreHash(
    normalizedByPath,
    canonicalization,
  );
  const capabilities = buildCapabilitySlices(
    normalizedByPath,
    canonicalization,
    interfaceContract,
  );
  const surfaces = buildSurfaceSlices(normalizedByPath, canonicalization);
  const fixtures = buildFixtureSlices(normalizedByPath, canonicalization);

  const manifest = {
    schemaVersion: 1,
    interfaceContract,
    canonicalization: {
      schemaVersion: 1,
      algorithm: "sha256",
      encoding: "utf-8",
      inventoryOrder: "path_lexicographic",
      objectKeys: "lexicographic",
      arrayOrder: "semantic_except_declared_registries",
      duplicateObjectKeys: "reject",
    },
    sourceSet: {
      sourceDigest: rootDigest,
      inventory,
    },
    sharedCoreHash,
    capabilities,
    surfaces,
    fixtures,
    admission: {
      mode: "exact_key_version_digest",
      versionRanges: "forbidden",
      latestAlias: "forbidden",
      fallback: "forbidden",
    },
  };

  const output = `${JSON.stringify(sortObjectKeys(manifest), null, 2)}\n`;
  const artifactPin = {
    schemaVersion: 1,
    artifactKind: "surface_contract_manifest",
    interfaceContract,
    manifestDigest: digest(manifest),
  };
  const artifactPinOutput = `${JSON.stringify(
    sortObjectKeys(artifactPin),
    null,
    2,
  )}\n`;
  const artifactPinPath = path.join(
    path.dirname(outputPath),
    "surface-contract.artifact-pin.json",
  );
  await assertVersionRotation(outputPath, interfaceContract);
  await mkdir(path.dirname(outputPath), { recursive: true });
  await Promise.all([
    writeFile(outputPath, output, "utf8"),
    writeFile(artifactPinPath, artifactPinOutput, "utf8"),
  ]);
  return {
    manifest,
    output,
    outputPath,
    artifactPin,
    artifactPinOutput,
    artifactPinPath,
  };
}

export function parseStrictJson(source, label = "JSON") {
  let index = 0;

  function fail(message) {
    throw new Error(`${label}:${index}: ${message}`);
  }

  function skipWhitespace() {
    while (
      index < source.length &&
      (source[index] === " " ||
        source[index] === "\t" ||
        source[index] === "\r" ||
        source[index] === "\n")
    ) {
      index += 1;
    }
  }

  function parseString() {
    const start = index;
    index += 1;
    let escaped = false;
    while (index < source.length) {
      const character = source[index];
      if (!escaped && character === '"') {
        index += 1;
        try {
          return JSON.parse(source.slice(start, index));
        } catch {
          fail("invalid string");
        }
      }
      if (!escaped && character === "\\") escaped = true;
      else escaped = false;
      index += 1;
    }
    fail("unterminated string");
  }

  function parseNumber() {
    const match = source
      .slice(index)
      .match(/^-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?/);
    if (!match) fail("invalid number");
    index += match[0].length;
    const value = Number(match[0]);
    if (!Number.isFinite(value)) fail("number must be finite");
    return value;
  }

  function parseArray() {
    index += 1;
    const result = [];
    skipWhitespace();
    if (source[index] === "]") {
      index += 1;
      return result;
    }
    while (index < source.length) {
      result.push(parseValue());
      skipWhitespace();
      if (source[index] === "]") {
        index += 1;
        return result;
      }
      if (source[index] !== ",") fail("expected ',' or ']'");
      index += 1;
      skipWhitespace();
    }
    fail("unterminated array");
  }

  function parseObject() {
    index += 1;
    const result = {};
    const keys = new Set();
    skipWhitespace();
    if (source[index] === "}") {
      index += 1;
      return result;
    }
    while (index < source.length) {
      if (source[index] !== '"') fail("expected object key");
      const key = parseString();
      if (keys.has(key)) fail(`duplicate object key '${key}'`);
      keys.add(key);
      skipWhitespace();
      if (source[index] !== ":") fail("expected ':'");
      index += 1;
      result[key] = parseValue();
      skipWhitespace();
      if (source[index] === "}") {
        index += 1;
        return result;
      }
      if (source[index] !== ",") fail("expected ',' or '}'");
      index += 1;
      skipWhitespace();
    }
    fail("unterminated object");
  }

  function parseValue() {
    skipWhitespace();
    const character = source[index];
    if (character === '"') return parseString();
    if (character === "{") return parseObject();
    if (character === "[") return parseArray();
    if (character === "-" || /[0-9]/.test(character ?? "")) {
      return parseNumber();
    }
    for (const [token, value] of [
      ["true", true],
      ["false", false],
      ["null", null],
    ]) {
      if (source.startsWith(token, index)) {
        index += token.length;
        return value;
      }
    }
    fail("invalid value");
  }

  const result = parseValue();
  skipWhitespace();
  if (index !== source.length) fail("unexpected trailing content");
  return result;
}

export function canonicalStringify(value) {
  return JSON.stringify(sortObjectKeys(value));
}

function digest(value) {
  return `sha256:${createHash("sha256")
    .update(canonicalStringify(value), "utf8")
    .digest("hex")}`;
}

async function collectJsonFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries.sort((left, right) =>
    left.name.localeCompare(right.name),
  )) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await collectJsonFiles(absolutePath)));
    else if (entry.isFile() && entry.name.endsWith(".json")) files.push(absolutePath);
  }
  return files;
}

function normalizeArtifacts(parsedByPath, canonicalization) {
  const result = new Map();
  for (const [artifactPath, value] of parsedByPath) {
    result.set(artifactPath, structuredClone(value));
  }

  for (const [ruleIndex, ruleValue] of array(
    canonicalization.registryOrdering,
    "canonicalization.registryOrdering",
  ).entries()) {
    const rule = record(ruleValue, `registryOrdering[${ruleIndex}]`);
    const artifactPath = text(rule.path, `registryOrdering[${ruleIndex}].path`);
    const pointer = text(
      rule.arrayPointer,
      `registryOrdering[${ruleIndex}].arrayPointer`,
    );
    const stableKey = text(
      rule.stableKey,
      `registryOrdering[${ruleIndex}].stableKey`,
    );
    const artifact = objectAt(result, artifactPath);
    const registry = array(
      resolvePointer(artifact, pointer),
      `${artifactPath}${pointer}`,
    );
    registry.sort((leftValue, rightValue) => {
      const leftRecord = record(leftValue, `${artifactPath}${pointer}`);
      const rightRecord = record(rightValue, `${artifactPath}${pointer}`);
      const left = text(
        leftRecord[stableKey],
        `${artifactPath}${pointer}.${stableKey}`,
      );
      const right = text(
        rightRecord[stableKey],
        `${artifactPath}${pointer}.${stableKey}`,
      );
      return left.localeCompare(right);
    });
  }
  return result;
}

function validateSource(artifacts, canonicalization) {
  assertExactKeys(
    canonicalization,
    [
      "schemaVersion",
      "canonicalJson",
      "rootDigest",
      "registryOrdering",
      "sharedCorePaths",
      "fixtureSlices",
      "capabilitySlices",
      "surfaceSlices",
    ],
    "canonicalization",
  );
  for (const sharedPath of strings(
    canonicalization.sharedCorePaths,
    "canonicalization.sharedCorePaths",
  )) {
    if (!artifacts.has(sharedPath)) {
      throw new Error(`Shared core artifact is missing: ${sharedPath}`);
    }
  }

  const capabilityRegistry = objectAt(
    artifacts,
    "capabilities/capability-registry.json",
  );
  assertExactKeys(
    capabilityRegistry,
    ["schemaVersion", "contract", "capabilities"],
    "capability registry",
  );
  const contract = record(capabilityRegistry.contract, "capability contract");
  assertExactKeys(contract, ["key", "version"], "capability contract");
  if (contract.key !== "nurture.surface-contract") {
    throw new Error("Unexpected interface contract key");
  }
  assertSemver(contract.version, "contract.version");

  const schemaRegistry = objectAt(artifacts, "interface/schema-registry.json");
  const schemaEntries = array(schemaRegistry.schemas, "schema registry");
  const schemaByRef = uniqueRecords(schemaEntries, "schemaRef", "schema registry");
  for (const [schemaRef, entry] of schemaByRef) {
    const artifactPath = text(entry.artifactPath, `${schemaRef}.artifactPath`);
    if (!artifacts.has(artifactPath)) {
      throw new Error(`${schemaRef} points to missing artifact ${artifactPath}`);
    }
    const pointer = text(entry.jsonPointer, `${schemaRef}.jsonPointer`);
    resolvePointer(artifacts.get(artifactPath), pointer);
  }

  const surfaceRegistry = objectAt(
    artifacts,
    "surfaces/surface-registry.json",
  );
  const surfaceByKey = uniqueRecords(
    array(surfaceRegistry.surfaces, "surface registry"),
    "surfaceKey",
    "surface registry",
  );
  const presenterRegistry = objectAt(
    artifacts,
    "surfaces/presenter-registry.json",
  );
  const presenterBySurface = uniqueRecords(
    array(presenterRegistry.presenters, "presenter registry"),
    "surfaceKey",
    "presenter registry",
  );
  if (surfaceByKey.size !== presenterBySurface.size) {
    throw new Error("Every surface must have exactly one presenter contract");
  }
  for (const [surfaceKey, surface] of surfaceByKey) {
    const presenter = presenterBySurface.get(surfaceKey);
    if (!presenter) throw new Error(`Missing presenter for ${surfaceKey}`);
    if (presenter.presenterKey !== surface.presenterBinding) {
      throw new Error(`Presenter binding mismatch for ${surfaceKey}`);
    }
    if (presenter.surfaceVersion !== surface.surfaceVersion) {
      throw new Error(`Presenter version mismatch for ${surfaceKey}`);
    }
  }

  const portRegistry = objectAt(artifacts, "interface/port-registry.json");
  if (portRegistry.fallbackPolicy !== "forbidden") {
    throw new Error("Port fallback must remain forbidden");
  }
  const policyByRef = versionedRecords(
    array(portRegistry.policies, "port policies"),
    "port policies",
  );
  const repositoryByRef = versionedRecords(
    array(portRegistry.repositories, "port repositories"),
    "port repositories",
  );
  for (const [policyRef, policy] of policyByRef) {
    for (const repositoryRefValue of array(
      policy.repositoryRefs,
      `${policyRef}.repositoryRefs`,
    )) {
      const repositoryRef = versionedRef(
        repositoryRefValue,
        `${policyRef}.repositoryRef`,
      );
      if (!repositoryByRef.has(repositoryRef)) {
        throw new Error(`${policyRef} requires missing ${repositoryRef}`);
      }
    }
  }

  const capabilities = array(
    capabilityRegistry.capabilities,
    "capability registry capabilities",
  );
  const capabilityByKey = uniqueRecords(
    capabilities,
    "capabilityKey",
    "capability registry",
  );
  for (const [capabilityKey, descriptor] of capabilityByKey) {
    assertStableKey(capabilityKey, `${capabilityKey}.capabilityKey`);
    assertSemver(
      descriptor.capabilityVersion,
      `${capabilityKey}.capabilityVersion`,
    );
    for (const key of Object.keys(descriptor)) {
      if (!descriptorKeys.has(key)) {
        throw new Error(`${capabilityKey} has unknown descriptor key ${key}`);
      }
    }
    for (const requiredKey of descriptorKeys) {
      if (requiredKey === "supportedRoles") continue;
      if (!(requiredKey in descriptor)) {
        throw new Error(`${capabilityKey} is missing ${requiredKey}`);
      }
    }
    validateDescriptorStructure(descriptor, capabilityKey);
    for (const refField of [
      "inputSchemaRef",
      "resultSchemaRef",
      "errorSchemaRef",
    ]) {
      const schemaRef = text(descriptor[refField], `${capabilityKey}.${refField}`);
      if (!schemaByRef.has(schemaRef)) {
        throw new Error(`${capabilityKey} references missing ${schemaRef}`);
      }
    }
    const targetPolicy = record(
      descriptor.targetPolicy,
      `${capabilityKey}.targetPolicy`,
    );
    if (targetPolicy.optionSchemaRef !== null) {
      const targetSchemaRef = text(
        targetPolicy.optionSchemaRef,
        `${capabilityKey}.targetPolicy.optionSchemaRef`,
      );
      if (!schemaByRef.has(targetSchemaRef)) {
        throw new Error(`${capabilityKey} references missing ${targetSchemaRef}`);
      }
    }
    const policyRef = versionedRef(
      descriptor.eligibilityPolicyRef,
      `${capabilityKey}.eligibilityPolicyRef`,
    );
    if (!policyByRef.has(policyRef)) {
      throw new Error(`${capabilityKey} references missing policy ${policyRef}`);
    }
    for (const bindingValue of array(
      descriptor.presenterBindings,
      `${capabilityKey}.presenterBindings`,
    )) {
      const binding = record(bindingValue, `${capabilityKey}.presenterBinding`);
      const surfaceKey = text(binding.surfaceKey, "presenter surfaceKey");
      const presenter = presenterBySurface.get(surfaceKey);
      if (!presenter || presenter.presenterKey !== binding.presenterKey) {
        throw new Error(`${capabilityKey} has invalid presenter binding`);
      }
    }
  }

  validateAllLocalSchemaReferences(artifacts);
}

function validateDescriptorStructure(descriptor, capabilityKey) {
  const targetPolicy = record(
    descriptor.targetPolicy,
    `${capabilityKey}.targetPolicy`,
  );
  assertExactKeys(
    targetPolicy,
    ["kind", "optionSchemaRef"],
    `${capabilityKey}.targetPolicy`,
  );
  const targetKind = text(
    targetPolicy.kind,
    `${capabilityKey}.targetPolicy.kind`,
  );
  assertOneOf(
    targetKind,
    ["none", "exact_bound", "owner_option_required", "unique_eligible_default"],
    `${capabilityKey}.targetPolicy.kind`,
  );
  if (targetKind === "none" && targetPolicy.optionSchemaRef !== null) {
    throw new Error(`${capabilityKey} none target must not name an option schema`);
  }
  if (targetKind !== "none") {
    text(
      targetPolicy.optionSchemaRef,
      `${capabilityKey}.targetPolicy.optionSchemaRef`,
    );
  }

  const concurrency = record(
    descriptor.concurrencyPolicy,
    `${capabilityKey}.concurrencyPolicy`,
  );
  assertExactKeys(
    concurrency,
    ["class", "headBindings"],
    `${capabilityKey}.concurrencyPolicy`,
  );
  uniqueByCanonicalValue(
    array(
      concurrency.headBindings,
      `${capabilityKey}.concurrencyPolicy.headBindings`,
    ),
    `${capabilityKey}.concurrencyPolicy.headBindings`,
  );
  for (const [index, bindingValue] of array(
    concurrency.headBindings,
    `${capabilityKey}.headBindings`,
  ).entries()) {
    const binding = record(bindingValue, `${capabilityKey}.headBindings[${index}]`);
    const allowedKeys = ["headKey", "mode"];
    if ("predicateRef" in binding) allowedKeys.push("predicateRef");
    if ("postconditionRef" in binding) allowedKeys.push("postconditionRef");
    assertExactKeys(
      binding,
      allowedKeys,
      `${capabilityKey}.headBindings[${index}]`,
    );
    assertStableKey(
      binding.headKey,
      `${capabilityKey}.headBindings[${index}].headKey`,
    );
    const mode = text(
      binding.mode,
      `${capabilityKey}.headBindings[${index}].mode`,
    );
    assertOneOf(
      mode,
      [
        "must_equal",
        "must_satisfy",
        "compatible_append",
        "convergent_postcondition",
      ],
      `${capabilityKey}.headBindings[${index}].mode`,
    );
    if (mode === "must_satisfy") {
      if (!("predicateRef" in binding) || "postconditionRef" in binding) {
        throw new Error(`${capabilityKey} must_satisfy requires predicateRef only`);
      }
      versionedRef(
        binding.predicateRef,
        `${capabilityKey}.headBindings[${index}].predicateRef`,
      );
    } else if (mode === "convergent_postcondition") {
      if (!("postconditionRef" in binding) || "predicateRef" in binding) {
        throw new Error(
          `${capabilityKey} convergent_postcondition requires postconditionRef only`,
        );
      }
      versionedRef(
        binding.postconditionRef,
        `${capabilityKey}.headBindings[${index}].postconditionRef`,
      );
    } else if ("predicateRef" in binding || "postconditionRef" in binding) {
      throw new Error(`${capabilityKey} ${mode} cannot carry a predicate ref`);
    }
  }

  const eligibilityPolicy = record(
    descriptor.eligibilityPolicyRef,
    `${capabilityKey}.eligibilityPolicyRef`,
  );
  assertExactKeys(
    eligibilityPolicy,
    ["key", "version"],
    `${capabilityKey}.eligibilityPolicyRef`,
  );
  versionedRef(eligibilityPolicy, `${capabilityKey}.eligibilityPolicyRef`);

  const handler = record(
    descriptor.handlerBinding,
    `${capabilityKey}.handlerBinding`,
  );
  assertExactKeys(
    handler,
    ["bindingKey", "bindingKind"],
    `${capabilityKey}.handlerBinding`,
  );
  assertStableKey(handler.bindingKey, `${capabilityKey}.handlerBinding.bindingKey`);
  assertOneOf(
    text(handler.bindingKind, `${capabilityKey}.handlerBinding.bindingKind`),
    ["query", "action", "institution_workflow", "publish_process"],
    `${capabilityKey}.handlerBinding.bindingKind`,
  );

  uniqueByCanonicalValue(
    array(descriptor.presenterBindings, `${capabilityKey}.presenterBindings`),
    `${capabilityKey}.presenterBindings`,
  );
  for (const [index, bindingValue] of array(
    descriptor.presenterBindings,
    `${capabilityKey}.presenterBindings`,
  ).entries()) {
    const binding = record(
      bindingValue,
      `${capabilityKey}.presenterBindings[${index}]`,
    );
    assertExactKeys(
      binding,
      ["surfaceKey", "presenterKey"],
      `${capabilityKey}.presenterBindings[${index}]`,
    );
    assertStableKey(binding.surfaceKey, `${capabilityKey}.presenter.surfaceKey`);
    assertStableKey(binding.presenterKey, `${capabilityKey}.presenter.presenterKey`);
  }

  uniqueByCanonicalValue(
    array(descriptor.dependencyGates, `${capabilityKey}.dependencyGates`),
    `${capabilityKey}.dependencyGates`,
  );
  for (const [index, gateValue] of array(
    descriptor.dependencyGates,
    `${capabilityKey}.dependencyGates`,
  ).entries()) {
    const gate = record(gateValue, `${capabilityKey}.dependencyGates[${index}]`);
    assertExactKeys(
      gate,
      ["dependencyKey", "minimumVersion", "requiredGate"],
      `${capabilityKey}.dependencyGates[${index}]`,
    );
    assertStableKey(gate.dependencyKey, `${capabilityKey}.dependencyKey`);
    assertSemver(gate.minimumVersion, `${capabilityKey}.minimumVersion`);
    assertOneOf(
      text(gate.requiredGate, `${capabilityKey}.requiredGate`),
      ["contract_boundary", "owner_integration", "joint_conformance", "activation"],
      `${capabilityKey}.requiredGate`,
    );
  }

  assertOneOf(
    text(descriptor.domainClass, `${capabilityKey}.domainClass`),
    ["care_interaction", "institution_management", "publish_process", "read_model"],
    `${capabilityKey}.domainClass`,
  );
  assertOneOf(
    text(descriptor.executionClass, `${capabilityKey}.executionClass`),
    [
      "query",
      "action_execution",
      "institution_workflow_action",
      "publish_process_transition",
    ],
    `${capabilityKey}.executionClass`,
  );
  assertOneOf(
    text(descriptor.deliveryClass, `${capabilityKey}.deliveryClass`),
    ["none", "action_delivery_candidate"],
    `${capabilityKey}.deliveryClass`,
  );
  assertOneOf(
    text(descriptor.confirmationPolicy, `${capabilityKey}.confirmationPolicy`),
    ["none", "direct_commit", "reviewable_commit", "strong_confirmation"],
    `${capabilityKey}.confirmationPolicy`,
  );
  assertOneOf(
    text(concurrency.class, `${capabilityKey}.concurrencyPolicy.class`),
    ["exact_state", "lifecycle_authority", "append_compatible"],
    `${capabilityKey}.concurrencyPolicy.class`,
  );

  for (const [field, values] of [
    ["intentKeys", descriptor.intentKeys],
    ["invalidationScopeKinds", descriptor.invalidationScopeKinds],
    ["supportedRoles", descriptor.supportedRoles ?? []],
  ]) {
    const entries = strings(values, `${capabilityKey}.${field}`);
    if (field !== "supportedRoles" && entries.length === 0) {
      throw new Error(`${capabilityKey}.${field} must not be empty`);
    }
    if (new Set(entries).size !== entries.length) {
      throw new Error(`${capabilityKey}.${field} must be unique`);
    }
  }
}

function buildSharedCoreHash(artifacts, canonicalization) {
  const paths = strings(
    canonicalization.sharedCorePaths,
    "canonicalization.sharedCorePaths",
  ).sort();
  return digest(
    paths.map((artifactPath) => ({
      path: artifactPath,
      value: artifacts.get(artifactPath),
    })),
  );
}

function buildCapabilitySlices(artifacts, canonicalization, contract) {
  const sliceConfig = record(
    canonicalization.capabilitySlices,
    "canonicalization.capabilitySlices",
  );
  const registry = objectAt(
    artifacts,
    text(sliceConfig.registryPath, "capabilitySlices.registryPath"),
  );
  const schemaRegistry = objectAt(
    artifacts,
    text(sliceConfig.schemaRegistryPath, "capabilitySlices.schemaRegistryPath"),
  );
  const portRegistry = objectAt(
    artifacts,
    text(sliceConfig.portRegistryPath, "capabilitySlices.portRegistryPath"),
  );
  const schemaByRef = uniqueRecords(
    array(schemaRegistry.schemas, "schema registry"),
    "schemaRef",
    "schema registry",
  );
  const policyByRef = versionedRecords(
    array(portRegistry.policies, "port policies"),
    "port policies",
  );
  const repositoryByRef = versionedRecords(
    array(portRegistry.repositories, "port repositories"),
    "port repositories",
  );

  return array(registry.capabilities, "capabilities")
    .map((descriptorValue) => {
      const descriptor = record(descriptorValue, "capability descriptor");
      const schemaRefs = new Set([
        text(descriptor.inputSchemaRef, "inputSchemaRef"),
        text(descriptor.resultSchemaRef, "resultSchemaRef"),
        text(descriptor.errorSchemaRef, "errorSchemaRef"),
      ]);
      const targetPolicy = record(descriptor.targetPolicy, "targetPolicy");
      if (targetPolicy.optionSchemaRef !== null) {
        schemaRefs.add(text(targetPolicy.optionSchemaRef, "optionSchemaRef"));
      }
      const schemaBindings = [...schemaRefs]
        .sort()
        .map((schemaRef) => {
          const entry = schemaByRef.get(schemaRef);
          if (!entry) throw new Error(`Missing schema entry ${schemaRef}`);
          return entry;
        });
      const schemaArtifactPaths = collectSchemaArtifactClosure(
        artifacts,
        schemaBindings.map((entry) => text(entry.artifactPath, "artifactPath")),
      );
      const policyRef = versionedRef(
        descriptor.eligibilityPolicyRef,
        "eligibilityPolicyRef",
      );
      const policy = policyByRef.get(policyRef);
      if (!policy) throw new Error(`Missing policy ${policyRef}`);
      const repositories = array(policy.repositoryRefs, `${policyRef}.repositories`)
        .map((value) => {
          const ref = versionedRef(value, `${policyRef}.repository`);
          const repository = repositoryByRef.get(ref);
          if (!repository) throw new Error(`Missing repository ${ref}`);
          return repository;
        })
        .sort((left, right) =>
          text(left.key, "repository.key").localeCompare(
            text(right.key, "repository.key"),
          ),
        );
      const slicePayload = {
        descriptor,
        schemaBindings,
        schemaArtifacts: schemaArtifactPaths.map((artifactPath) => ({
          path: artifactPath,
          value: artifacts.get(artifactPath),
        })),
        policy,
        repositories,
      };
      const materializedDescriptor = {
        ...descriptor,
        contract,
      };
      return {
        capabilityKey: text(descriptor.capabilityKey, "capabilityKey"),
        capabilityVersion: text(
          descriptor.capabilityVersion,
          "capabilityVersion",
        ),
        sliceHash: digest(slicePayload),
        descriptor: materializedDescriptor,
      };
    })
    .sort((left, right) =>
      left.capabilityKey.localeCompare(right.capabilityKey),
    );
}

function buildFixtureSlices(artifacts, canonicalization) {
  const sliceConfig = record(
    canonicalization.fixtureSlices,
    "canonicalization.fixtureSlices",
  );
  const worldPrefix = text(sliceConfig.worldPathPrefix, "worldPathPrefix");
  const journeysPrefix = text(
    sliceConfig.journeysPathPrefix,
    "journeysPathPrefix",
  );
  const selectionPrefix = text(
    sliceConfig.selectionPathPrefix,
    "selectionPathPrefix",
  );
  const worldSchemaFile = text(sliceConfig.worldSchemaFile, "worldSchemaFile");
  const sharedSchemaFiles = strings(
    sliceConfig.sharedSchemaFiles,
    "fixtureSlices.sharedSchemaFiles",
  );
  for (const requiredPath of [worldSchemaFile, ...sharedSchemaFiles]) {
    if (!artifacts.has(requiredPath)) {
      throw new Error(`Fixture slice artifact is missing: ${requiredPath}`);
    }
  }

  const memberPaths = new Map();
  const addMember = (fixtureKey, artifactPath) => {
    if (!memberPaths.has(fixtureKey)) memberPaths.set(fixtureKey, new Set());
    memberPaths.get(fixtureKey).add(artifactPath);
  };
  for (const artifactPath of [...artifacts.keys()].sort()) {
    if (!artifactPath.startsWith("fixtures/")) continue;
    if (artifactPath.startsWith(worldPrefix)) {
      addMember("world", artifactPath);
    } else if (artifactPath.startsWith(selectionPrefix)) {
      addMember("selection", artifactPath);
    } else if (sharedSchemaFiles.includes(artifactPath)) {
      continue;
    } else if (artifactPath.startsWith(journeysPrefix)) {
      const remainder = artifactPath.slice(journeysPrefix.length);
      const journeyKey = remainder.split("/", 1)[0];
      if (!/^(?:gj|rj)-[1-9]$/.test(journeyKey) || !remainder.includes("/")) {
        throw new Error(`Unclassifiable journey fixture path: ${artifactPath}`);
      }
      addMember(`journey:${journeyKey}`, artifactPath);
    } else {
      throw new Error(`Unclassifiable fixture path: ${artifactPath}`);
    }
  }

  return [...memberPaths.keys()].sort().map((fixtureKey) => {
    const dependencyPaths =
      fixtureKey === "world" ? [] : [worldSchemaFile, ...sharedSchemaFiles];
    const slicePaths = [
      ...new Set([...memberPaths.get(fixtureKey), ...dependencyPaths]),
    ].sort();
    return {
      fixtureKey,
      fixtureKind: fixtureKey === "world"
        ? "world"
        : fixtureKey === "selection"
          ? "selection"
          : "journey",
      sliceHash: digest(
        slicePaths.map((artifactPath) => ({
          path: artifactPath,
          value: artifacts.get(artifactPath),
        })),
      ),
    };
  });
}

function buildSurfaceSlices(artifacts, canonicalization) {
  const sliceConfig = record(
    canonicalization.surfaceSlices,
    "canonicalization.surfaceSlices",
  );
  const surfaceRegistry = objectAt(
    artifacts,
    text(sliceConfig.surfaceRegistryPath, "surfaceSlices.surfaceRegistryPath"),
  );
  const presenterRegistry = objectAt(
    artifacts,
    text(
      sliceConfig.presenterRegistryPath,
      "surfaceSlices.presenterRegistryPath",
    ),
  );
  const visibilityMatrix = objectAt(
    artifacts,
    text(
      sliceConfig.visibilityMatrixPath,
      "surfaceSlices.visibilityMatrixPath",
    ),
  );
  const presenterBySurface = uniqueRecords(
    array(presenterRegistry.presenters, "presenters"),
    "surfaceKey",
    "presenters",
  );
  const visibilityBySurface = uniqueRecords(
    array(visibilityMatrix.surfaces, "visibility surfaces"),
    "surfaceKey",
    "visibility surfaces",
  );

  return array(surfaceRegistry.surfaces, "surfaces")
    .map((surfaceValue) => {
      const surface = record(surfaceValue, "surface");
      const surfaceKey = text(surface.surfaceKey, "surfaceKey");
      const presenter = presenterBySurface.get(surfaceKey);
      const visibility = visibilityBySurface.get(surfaceKey);
      if (!presenter || !visibility) {
        throw new Error(`Incomplete surface slice ${surfaceKey}`);
      }
      const slicePayload = {
        surface,
        presenter,
        visibility: {
          dataClasses: visibilityMatrix.dataClasses,
          dataClassOwners: visibilityMatrix.dataClassOwners,
          surface: visibility,
        },
      };
      return {
        surfaceKey,
        surfaceVersion: text(surface.surfaceVersion, "surfaceVersion"),
        presenterKey: text(presenter.presenterKey, "presenterKey"),
        sliceHash: digest(slicePayload),
      };
    })
    .sort((left, right) => left.surfaceKey.localeCompare(right.surfaceKey));
}

function collectSchemaArtifactClosure(artifacts, entryPaths) {
  const pending = [...new Set(entryPaths)];
  const visited = new Set();
  while (pending.length > 0) {
    const artifactPath = pending.pop();
    if (artifactPath === undefined || visited.has(artifactPath)) continue;
    visited.add(artifactPath);
    const schema = artifacts.get(artifactPath);
    if (schema === undefined) throw new Error(`Missing schema ${artifactPath}`);
    for (const reference of collectReferences(schema)) {
      if (reference.startsWith("#") || reference.startsWith("https://")) continue;
      const [fileReference] = reference.split("#", 1);
      const resolvedPath = toPosix(
        path.normalize(path.join(path.dirname(artifactPath), fileReference)),
      );
      if (!visited.has(resolvedPath)) pending.push(resolvedPath);
    }
  }
  return [...visited].sort();
}

function validateAllLocalSchemaReferences(artifacts) {
  for (const [artifactPath, value] of artifacts) {
    if (!artifactPath.endsWith(".schema.json")) continue;
    for (const reference of collectReferences(value)) {
      if (reference.startsWith("https://")) continue;
      const [fileReference, pointer = ""] = reference.split("#", 2);
      const targetPath =
        fileReference.length === 0
          ? artifactPath
          : toPosix(
              path.normalize(path.join(path.dirname(artifactPath), fileReference)),
            );
      const target = artifacts.get(targetPath);
      if (target === undefined) {
        throw new Error(`${artifactPath} cannot resolve ${reference}`);
      }
      if (pointer.length > 0) resolvePointer(target, `/${pointer.replace(/^\//, "")}`);
    }
  }
}

function collectReferences(value, result = []) {
  if (Array.isArray(value)) {
    for (const item of value) collectReferences(item, result);
    return result;
  }
  if (isRecord(value)) {
    for (const [key, child] of Object.entries(value)) {
      if (key === "$ref" && typeof child === "string") result.push(child);
      else collectReferences(child, result);
    }
  }
  return result;
}

function resolvePointer(value, pointer) {
  if (pointer === "") return value;
  if (!pointer.startsWith("/")) throw new Error(`Invalid JSON pointer ${pointer}`);
  let current = value;
  for (const encodedPart of pointer.slice(1).split("/")) {
    const part = encodedPart.replace(/~1/g, "/").replace(/~0/g, "~");
    if (Array.isArray(current)) {
      const arrayIndex = Number(part);
      if (!Number.isInteger(arrayIndex) || current[arrayIndex] === undefined) {
        throw new Error(`JSON pointer does not resolve: ${pointer}`);
      }
      current = current[arrayIndex];
    } else if (isRecord(current) && part in current) {
      current = current[part];
    } else {
      throw new Error(`JSON pointer does not resolve: ${pointer}`);
    }
  }
  return current;
}

function uniqueRecords(values, keyName, label) {
  const result = new Map();
  for (const [index, value] of values.entries()) {
    const item = record(value, `${label}[${index}]`);
    const key = text(item[keyName], `${label}[${index}].${keyName}`);
    if (result.has(key)) throw new Error(`${label} has duplicate ${key}`);
    result.set(key, item);
  }
  return result;
}

function uniqueByCanonicalValue(values, label) {
  const canonicalValues = values.map(canonicalStringify);
  if (new Set(canonicalValues).size !== canonicalValues.length) {
    throw new Error(`${label} must contain unique values`);
  }
}

function versionedRecords(values, label) {
  const result = new Map();
  for (const [index, value] of values.entries()) {
    const item = record(value, `${label}[${index}]`);
    const key = versionedRef(item, `${label}[${index}]`);
    if (result.has(key)) throw new Error(`${label} has duplicate ${key}`);
    result.set(key, item);
  }
  return result;
}

function versionedRef(value, label) {
  const item = record(value, label);
  const key = text(item.key, `${label}.key`);
  const version = text(item.version, `${label}.version`);
  assertStableKey(key, `${label}.key`);
  assertSemver(version, `${label}.version`);
  return `${key}@${version}`;
}

function assertExactKeys(value, expected, label) {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) {
    throw new Error(
      `${label} keys mismatch: expected ${wanted.join(", ")}, got ${actual.join(", ")}`,
    );
  }
}

function assertStableKey(value, label) {
  const candidate = text(value, label);
  if (!stableKeyPattern.test(candidate)) {
    throw new Error(`${label} is not a stable key`);
  }
}

function assertOneOf(value, allowed, label) {
  if (!allowed.includes(value)) {
    throw new Error(`${label} must be one of ${allowed.join(", ")}`);
  }
}

function assertGeneratedOutputPath(outputPath) {
  const resolvedOutput = path.resolve(outputPath);
  const relativeOutput = path.relative(repoRoot, resolvedOutput);
  if (
    relativeOutput.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relativeOutput)
  ) {
    throw new Error("Generated output must remain inside the repository");
  }
  if (path.basename(resolvedOutput) !== "surface-contract.manifest.json") {
    throw new Error(
      "Generated output filename must be surface-contract.manifest.json",
    );
  }
}

async function assertVersionRotation(outputPath, nextContract) {
  let existingText;
  try {
    existingText = await readFile(outputPath, "utf8");
  } catch (error) {
    if (isNodeError(error) && error.code === "ENOENT") return;
    throw error;
  }
  const existing = record(
    parseStrictJson(existingText, toPosix(path.relative(repoRoot, outputPath))),
    "existing generated manifest",
  );
  const existingContract = record(
    existing.interfaceContract,
    "existing interface contract",
  );
  const existingVersion = text(
    existingContract.version,
    "existing interface contract version",
  );
  const existingDigest = text(
    existingContract.digest,
    "existing interface contract digest",
  );
  if (
    existingVersion === nextContract.version &&
    existingDigest === nextContract.digest
  ) {
    return;
  }
  if (existingVersion === nextContract.version) {
    throw new Error(
      `Surface contract content changed without a version rotation from ${existingVersion}`,
    );
  }
  if (compareSemver(nextContract.version, existingVersion) <= 0) {
    throw new Error(
      `Surface contract version must increase from ${existingVersion} to replace the checked artifact`,
    );
  }
}

function compareSemver(left, right) {
  assertSemver(left, "left SemVer");
  assertSemver(right, "right SemVer");
  const leftParts = left.split(".").map(Number);
  const rightParts = right.split(".").map(Number);
  for (let index = 0; index < 3; index += 1) {
    const difference = leftParts[index] - rightParts[index];
    if (difference !== 0) return difference;
  }
  return 0;
}

function isNodeError(error) {
  return error instanceof Error && "code" in error;
}

function assertSemver(value, label) {
  const candidate = text(value, label);
  if (!semverPattern.test(candidate)) {
    throw new Error(`${label} is not release SemVer`);
  }
}

function objectAt(artifacts, artifactPath) {
  const value = artifacts.get(artifactPath);
  if (value === undefined) throw new Error(`Missing artifact ${artifactPath}`);
  return record(value, artifactPath);
}

function record(value, label) {
  if (!isRecord(value)) throw new Error(`${label} must be an object`);
  return value;
}

function array(value, label) {
  if (!Array.isArray(value)) throw new Error(`${label} must be an array`);
  return value;
}

function strings(value, label) {
  return array(value, label).map((item, index) =>
    text(item, `${label}[${index}]`),
  );
}

function text(value, label) {
  if (typeof value !== "string") throw new Error(`${label} must be a string`);
  return value;
}

function integer(value, label) {
  if (!Number.isInteger(value)) throw new Error(`${label} must be an integer`);
  return value;
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sortObjectKeys(value) {
  if (Array.isArray(value)) return value.map(sortObjectKeys);
  if (!isRecord(value)) return value;
  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, sortObjectKeys(value[key])]),
  );
}

function toPosix(value) {
  return value.split(path.sep).join("/");
}
