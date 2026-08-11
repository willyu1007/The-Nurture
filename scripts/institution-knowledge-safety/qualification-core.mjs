/** @reference .ai/skills/workflows/llm/llm-engineering/SKILL.md */

import { createHash } from "node:crypto";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  canonicalStringify,
  parseStrictJson,
} from "../surface-contract/contract-core.mjs";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
export const repoRoot = path.resolve(scriptDirectory, "../..");
export const sourceRoot = path.join(
  repoRoot,
  "packages/nurture-scenario/contracts/institution-knowledge-answer-safety/v2/source",
);
export const generatedManifestPath = path.join(
  repoRoot,
  "packages/nurture-scenario/contracts/institution-knowledge-answer-safety/v2/generated/qualification.manifest.json",
);

const DIGEST_PATTERN = /^sha256:[0-9a-f]{64}$/u;
const ID_PATTERN = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/u;
const REF_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._~:/+@=-]{0,299}$/u;
const SEMVER_PATTERN = /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/u;
const MOVING_VERSION_PATTERN =
  /(?:^|[._~:/+@=-])(latest|current|stable|main|master|head|trunk|snapshot)(?:$|[._~:/+@=-])/iu;
const MOVING_REF_PATTERN =
  /(?:^|[._~:/+@=-])(latest|current|stable|main|master|head|trunk|snapshot)(?:$|[._~:/+@=-])/iu;
const WILDCARD_VERSION_PATTERN = /(?:^|[._~:/+@=-])[xX](?:$|[._~:/+@=-])/u;

const sha256 = (value) => `sha256:${createHash("sha256")
  .update(value, "utf8")
  .digest("hex")}`;

export const computeFixtureInputDigest = (fixture) => sha256(canonicalStringify({
  fixture_id: fixture.fixtureId,
  stage: fixture.stage,
  input: fixture.input,
}));

export const computeServiceRequestDigest = ({
  qualificationDigest,
  service,
  fixture,
}) => sha256(canonicalStringify({
  schemaVersion: 1,
  qualification_contract_digest: qualificationDigest,
  service_pins: service,
  fixture: {
    fixture_id: fixture.fixtureId,
    stage: fixture.stage,
    input: fixture.input,
  },
}));

export const computeStructuredDecisionResponseDigest = (decision) =>
  sha256(canonicalStringify(decision));

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(`Institution Knowledge safety qualification: ${message}`);
  }
};

const assertRecord = (value, label) => {
  assert(
    value !== null && typeof value === "object" && !Array.isArray(value),
    `${label} must be an object`,
  );
};

const exactKeys = (value, required, optional = []) => {
  assertRecord(value, "object");
  const keys = Object.keys(value);
  assert(
    required.every((key) => keys.includes(key)),
    `missing required key from ${required.join(", ")}`,
  );
  assert(
    keys.every((key) => required.includes(key) || optional.includes(key)),
    `unexpected key in ${keys.join(", ")}`,
  );
};

const assertString = (value, label) => {
  assert(
    typeof value === "string" && value.length > 0,
    `${label} must be a non-empty string`,
  );
};

const assertStringArray = (value, label) => {
  assert(
    Array.isArray(value) && value.length > 0,
    `${label} must be a non-empty array`,
  );
  for (const [index, item] of value.entries()) {
    assertString(item, `${label}[${index}]`);
  }
  assert(new Set(value).size === value.length, `${label} has duplicates`);
};

async function readSourceFile(name) {
  const text = await readFile(path.join(sourceRoot, name), "utf8");
  return { name, value: parseStrictJson(text, name) };
}

export async function buildQualificationManifest() {
  const [contractSource, fixturesSource] = await Promise.all([
    readSourceFile("qualification-contract.json"),
    readSourceFile("qualification-fixtures.json"),
  ]);
  validateContract(contractSource.value);
  validateFixtures(fixturesSource.value, contractSource.value);

  const inventory = [contractSource, fixturesSource]
    .sort((left, right) => left.name.localeCompare(right.name, "en"))
    .map(({ name, value }) => ({
      path: name,
      sha256: sha256(canonicalStringify(value)),
    }));
  const sourceDigest = sha256(canonicalStringify({
    schemaVersion: 1,
    sources: inventory,
  }));
  const fixtures = fixturesSource.value.fixtures;
  const manifest = {
    schemaVersion: 1,
    qualificationContract: {
      ...contractSource.value.qualificationContract,
      digest: sourceDigest,
    },
    answerSafetyContract: contractSource.value.answerSafetyContract,
    providerClass: contractSource.value.providerClass,
    sourceSet: { sourceDigest, inventory },
    fixtureSummary: {
      total: fixtures.length,
      request: fixtures.filter(({ stage }) => stage === "request").length,
      draft: fixtures.filter(({ stage }) => stage === "draft").length,
      admission: fixtures.filter(({ stage }) => stage === "admission").length,
      minimumInvocationAttempts: Math.min(
        ...fixtures.map(({ invocationAttempts }) => invocationAttempts),
      ),
    },
    requiredServicePins: contractSource.value.requiredServicePins,
    regression: contractSource.value.regression,
    qualificationEffects: contractSource.value.qualificationEffects,
    forbiddenSubstitutes: contractSource.value.forbiddenSubstitutes,
    admission: contractSource.value.admission,
  };
  return {
    contract: contractSource.value,
    fixtures: fixturesSource.value,
    manifest,
    output: `${JSON.stringify(sortObjectKeys(manifest), null, 2)}\n`,
  };
}

export async function writeQualificationManifest() {
  const built = await buildQualificationManifest();
  await mkdir(path.dirname(generatedManifestPath), { recursive: true });
  await writeFile(generatedManifestPath, built.output, "utf8");
  return built;
}

export async function verifyQualificationManifest() {
  const built = await buildQualificationManifest();
  const current = await readFile(generatedManifestPath, "utf8");
  assert(current === built.output, "generated qualification manifest drift");
  return built;
}

export function validateCandidateEvidence(evidence, built) {
  exactKeys(evidence, [
    "schemaVersion",
    "qualificationContract",
    "evidence_mode",
    "service",
    "results",
  ]);
  assert(evidence.schemaVersion === 1, "evidence.schemaVersion must be 1");
  assert(
    evidence.evidence_mode === "adapter_recorded",
    "current verifier accepts adapter_recorded evidence only",
  );
  exactKeys(evidence.qualificationContract, ["key", "version", "digest"]);
  assert(
    canonicalStringify(evidence.qualificationContract) ===
      canonicalStringify(built.manifest.qualificationContract),
    "evidence qualification contract pin mismatch",
  );
  validateServicePin(evidence.service, built.contract.requiredServicePins);
  assert(Array.isArray(evidence.results), "evidence.results must be an array");

  const fixtures = built.fixtures.fixtures;
  assert(
    evidence.results.length === fixtures.length,
    "evidence must cover every fixture exactly once",
  );
  const fixtureById = new Map(
    fixtures.map((fixture) => [fixture.fixtureId, fixture]),
  );
  const seen = new Set();
  const invocationIds = new Set();
  for (const result of evidence.results) {
    exactKeys(result, ["fixture_id", "input_digest", "attempts"]);
    assertString(result.fixture_id, "result.fixture_id");
    assert(!seen.has(result.fixture_id), `duplicate result ${result.fixture_id}`);
    seen.add(result.fixture_id);
    const fixture = fixtureById.get(result.fixture_id);
    assert(fixture, `unknown fixture ${result.fixture_id}`);
    assert(
      result.input_digest === computeFixtureInputDigest(fixture),
      `${result.fixture_id} input digest mismatch`,
    );
    assert(
      Array.isArray(result.attempts) &&
        result.attempts.length >= fixture.invocationAttempts,
      `${result.fixture_id} must include ${fixture.invocationAttempts} attempts`,
    );
    for (const attempt of result.attempts) {
      assertString(attempt.invocation_id, "attempt.invocation_id");
      assert(
        REF_PATTERN.test(attempt.invocation_id),
        "attempt.invocation_id has invalid characters",
      );
      assert(
        !invocationIds.has(attempt.invocation_id),
        `duplicate invocation id ${attempt.invocation_id}`,
      );
      invocationIds.add(attempt.invocation_id);
      const decision = validateAttempt(
        attempt,
        fixture.expected,
      );
      const expectedRequestDigest = computeServiceRequestDigest({
        qualificationDigest: built.manifest.qualificationContract.digest,
        service: evidence.service,
        fixture,
      });
      assert(
        attempt.request_digest === expectedRequestDigest,
        `${result.fixture_id} request digest mismatch`,
      );
      assert(
        attempt.response_digest ===
          computeStructuredDecisionResponseDigest(decision),
        `${result.fixture_id} response digest mismatch`,
      );
    }
  }
  assert(seen.size === fixtures.length, "evidence fixture coverage mismatch");
  return {
    provider_id: evidence.service.provider_id,
    model_id: evidence.service.model_id,
    deployment_id: evidence.service.deployment_id,
    prompt_template_id: evidence.service.prompt_template_id,
    prompt_version: evidence.service.prompt_version,
    qualification_digest: built.manifest.qualificationContract.digest,
    fixtures: fixtures.length,
    qualification_effect: "service_backed_regression_qualification",
    adapter_qualified: true,
    live_qualified: false,
    capability_posture: "default_off",
    bitwise_determinism: false,
  };
}

function validateContract(contract) {
  exactKeys(contract, [
    "schemaVersion",
    "qualificationContract",
    "answerSafetyContract",
    "providerClass",
    "ownership",
    "requiredServicePins",
    "decisionContract",
    "regression",
    "qualificationEffects",
    "forbiddenSubstitutes",
    "admission",
  ]);
  assert(contract.schemaVersion === 1, "contract.schemaVersion must be 1");
  for (const [label, identity] of [
    ["qualificationContract", contract.qualificationContract],
    ["answerSafetyContract", contract.answerSafetyContract],
  ]) {
    exactKeys(identity, ["key", "version"]);
    assertString(identity.key, `${label}.key`);
    assert(
      SEMVER_PATTERN.test(identity.version),
      `${label}.version must be semver`,
    );
  }
  assert(
    contract.providerClass === "my_chat_gateway_structured_safety_service",
    "providerClass drift",
  );
  assertStringArray(contract.requiredServicePins, "requiredServicePins");
  for (const field of [
    "gateway_id",
    "gateway_version",
    "provider_id",
    "provider_api_version",
    "model_id",
    "model_version",
    "deployment_id",
    "prompt_template_id",
    "prompt_version",
    "owner_contract_key",
    "owner_contract_version",
    "answer_safety_contract_key",
    "answer_safety_contract_version",
  ]) {
    assert(
      contract.requiredServicePins.includes(field),
      `required service pin missing ${field}`,
    );
  }
  assertStringArray(contract.forbiddenSubstitutes, "forbiddenSubstitutes");
  assertRecord(contract.decisionContract, "decisionContract");
  assertStringArray(
    contract.decisionContract.requestStatuses,
    "requestStatuses",
  );
  assertStringArray(
    contract.decisionContract.draftStatuses,
    "draftStatuses",
  );
  assertStringArray(contract.decisionContract.reasonCodes, "reasonCodes");
  assertStringArray(
    contract.decisionContract.conflictClasses,
    "conflictClasses",
  );
  assert(
    contract.regression.minimumInvocationAttempts >= 2,
    "minimumInvocationAttempts must be at least 2",
  );
  exactKeys(contract.regression, [
    "canonicalInputEncoding",
    "minimumInvocationAttempts",
    "responseMode",
    "sameExpectedOutcomeRequired",
    "bitwiseDeterminism",
    "movingServiceAlias",
    "requestDigestAlgorithm",
    "responseDigestAlgorithm",
    "independentInvocationIdsRequired",
    "qualificationEffect",
  ]);
  assert(
    contract.regression.responseMode === "strict_structured_json" &&
      contract.regression.sameExpectedOutcomeRequired === true &&
      contract.regression.bitwiseDeterminism === "not_claimed" &&
      contract.regression.movingServiceAlias === "forbidden" &&
      contract.regression.requestDigestAlgorithm ===
        "sha256_canonical_gateway_service_fixture_v1" &&
      contract.regression.responseDigestAlgorithm ===
        "sha256_canonical_structured_decision_v1" &&
      contract.regression.independentInvocationIdsRequired === true &&
      contract.regression.qualificationEffect ===
        "service_backed_regression_qualification",
    "service-backed regression posture drift",
  );
  exactKeys(contract.qualificationEffects, [
    "currentVerifierMaximum",
    "adapterQualified",
    "liveQualified",
    "requiredLiveCallFields",
    "capabilityPosture",
  ]);
  assert(
    contract.qualificationEffects.currentVerifierMaximum === "adapter_qualified" &&
      contract.qualificationEffects.adapterQualified ===
        "closes_q3_implementation_gate_allows_e7_e8_default_off" &&
      contract.qualificationEffects.liveQualified ===
        "requires_verified_my_chat_gateway_service_calls" &&
      contract.qualificationEffects.capabilityPosture === "default_off",
    "qualification effect split drift",
  );
  assertStringArray(
    contract.qualificationEffects.requiredLiveCallFields,
    "requiredLiveCallFields",
  );
}

function validateFixtures(suite, contract) {
  exactKeys(suite, ["schemaVersion", "qualificationContract", "fixtures"]);
  assert(suite.schemaVersion === 1, "fixtures.schemaVersion must be 1");
  assert(
    canonicalStringify(suite.qualificationContract) ===
      canonicalStringify(contract.qualificationContract),
    "fixture qualification contract identity mismatch",
  );
  assert(
    Array.isArray(suite.fixtures) && suite.fixtures.length > 0,
    "fixtures must be non-empty",
  );
  const ids = new Set();
  const statuses = new Set();
  const reasons = new Set();
  const conflicts = new Set();
  for (const fixture of suite.fixtures) {
    exactKeys(fixture, [
      "fixtureId",
      "stage",
      "invocationAttempts",
      "input",
      "expected",
    ]);
    assert(
      /^q3-[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(fixture.fixtureId),
      `invalid fixture id ${fixture.fixtureId}`,
    );
    assert(!ids.has(fixture.fixtureId), `duplicate fixture ${fixture.fixtureId}`);
    ids.add(fixture.fixtureId);
    assert(
      ["request", "draft", "admission"].includes(fixture.stage),
      `${fixture.fixtureId} has invalid stage`,
    );
    assert(
      Number.isInteger(fixture.invocationAttempts) &&
        fixture.invocationAttempts >= contract.regression.minimumInvocationAttempts,
      `${fixture.fixtureId} invocationAttempts too small`,
    );
    assertRecord(fixture.input, `${fixture.fixtureId}.input`);
    assertRecord(fixture.expected, `${fixture.fixtureId}.expected`);
    validateExpected(fixture.expected, contract.decisionContract);
    statuses.add(`${fixture.stage}:${fixture.expected.status}`);
    for (const reason of fixture.expected.reason_codes ?? []) reasons.add(reason);
    for (const finding of fixture.expected.findings ?? []) {
      conflicts.add(finding.conflict_class);
    }
  }
  for (const status of [
    "request:general_clear",
    "request:medical_clear",
    "request:unsafe_request",
    "request:material_source_conflict",
    "admission:unavailable",
    "draft:safe",
    "draft:unsafe",
  ]) {
    assert(statuses.has(status), `missing fixture coverage ${status}`);
  }
  for (const reason of contract.decisionContract.reasonCodes) {
    assert(reasons.has(reason), `missing reason coverage ${reason}`);
  }
  for (const conflict of contract.decisionContract.conflictClasses) {
    assert(conflicts.has(conflict), `missing conflict coverage ${conflict}`);
  }
}

function validateExpected(expected, decisionContract) {
  assertString(expected.status, "expected.status");
  const allStatuses = new Set([
    ...decisionContract.requestStatuses,
    ...decisionContract.draftStatuses,
  ]);
  assert(allStatuses.has(expected.status), `unknown status ${expected.status}`);
  if (["unsafe_request", "unsafe"].includes(expected.status)) {
    exactKeys(expected, ["status", "reason_codes"]);
    assertStringArray(expected.reason_codes, "expected.reason_codes");
    assert(
      expected.reason_codes.every((reason) =>
        decisionContract.reasonCodes.includes(reason)),
      "unknown reason code",
    );
    return;
  }
  if (expected.status === "material_source_conflict") {
    exactKeys(expected, ["status", "findings"]);
    assert(
      Array.isArray(expected.findings) && expected.findings.length > 0,
      "conflict findings required",
    );
    for (const finding of expected.findings) {
      exactKeys(finding, ["conflict_class", "source_refs"]);
      assert(
        decisionContract.conflictClasses.includes(finding.conflict_class),
        "unknown conflict class",
      );
      assertStringArray(finding.source_refs, "finding.source_refs");
    }
    return;
  }
  exactKeys(expected, ["status"]);
}

function validateServicePin(service, requiredFields) {
  exactKeys(service, requiredFields);
  for (const field of requiredFields) {
    assertString(service[field], `service.${field}`);
  }
  assert(ID_PATTERN.test(service.provider_id), "provider_id must be kebab-case");
  for (const field of [
    "gateway_version",
    "provider_api_version",
    "model_version",
    "prompt_version",
    "owner_contract_version",
    "answer_safety_contract_version",
  ]) {
    validateExactVersion(service[field], `service.${field}`);
  }
  for (const field of [
    "gateway_id",
    "provider_id",
    "model_id",
    "deployment_id",
    "prompt_template_id",
    "owner_contract_key",
    "answer_safety_contract_key",
  ]) {
    validatePinnedIdentifier(service[field], `service.${field}`);
  }
}

function validateExactVersion(value, label) {
  assert(REF_PATTERN.test(value), `${label} has invalid characters`);
  assert(
    !MOVING_VERSION_PATTERN.test(value) &&
      !WILDCARD_VERSION_PATTERN.test(value) &&
      !/[<>=*^~]/u.test(value),
    `${label} must be an exact immutable value`,
  );
}

function validatePinnedIdentifier(value, label) {
  assert(REF_PATTERN.test(value), `${label} has invalid characters`);
  assert(
    !MOVING_REF_PATTERN.test(value) &&
      !WILDCARD_VERSION_PATTERN.test(value) &&
      !/[<*>^~]/u.test(value),
    `${label} must not contain a moving alias or range`,
  );
}

function validateAttempt(attempt, expected) {
  if (expected.status === "unavailable") {
    exactKeys(attempt, [
      "invocation_id",
      "request_digest",
      "response_digest",
      "status",
    ]);
    assert(
      attempt.status === "unavailable",
      "unavailable fixture must fail closed",
    );
    assert(
      DIGEST_PATTERN.test(attempt.request_digest) &&
        DIGEST_PATTERN.test(attempt.response_digest),
      "call digests must be sha256:<hex>",
    );
    return { status: attempt.status };
  }
  exactKeys(
    attempt,
    [
      "invocation_id",
      "request_digest",
      "response_digest",
      "status",
    ],
    ["reason_codes", "findings"],
  );
  assert(attempt.status === expected.status, `expected ${expected.status}`);
  assert(
    DIGEST_PATTERN.test(attempt.request_digest) &&
      DIGEST_PATTERN.test(attempt.response_digest),
    "call digests must be sha256:<hex>",
  );
  if (expected.reason_codes) {
    assert(
      canonicalStringify(attempt.reason_codes) ===
        canonicalStringify(expected.reason_codes),
      "reason code mismatch",
    );
  } else {
    assert(attempt.reason_codes === undefined, "unexpected reason_codes");
  }
  if (expected.findings) {
    assert(
      canonicalStringify(attempt.findings) ===
        canonicalStringify(expected.findings),
      "conflict finding mismatch",
    );
  } else {
    assert(attempt.findings === undefined, "unexpected findings");
  }
  return Object.fromEntries(
    Object.entries(attempt).filter(
      ([key]) => ![
        "invocation_id",
        "request_digest",
        "response_digest",
      ].includes(key),
    ),
  );
}

function sortObjectKeys(value) {
  if (Array.isArray(value)) return value.map(sortObjectKeys);
  if (value === null || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right, "en"))
      .map(([key, child]) => [key, sortObjectKeys(child)]),
  );
}

async function main() {
  const args = process.argv.slice(2);
  const write = args.includes("--write");
  const check = args.includes("--check");
  const evidenceIndex = args.indexOf("--evidence");
  assert(
    Number(write) + Number(check) + Number(evidenceIndex >= 0) === 1,
    "choose exactly one of --write, --check or --evidence <path>",
  );
  if (write) {
    const built = await writeQualificationManifest();
    console.log(
      `[ok] wrote ${path.relative(repoRoot, generatedManifestPath)} ` +
        built.manifest.qualificationContract.digest,
    );
    return;
  }
  const built = await verifyQualificationManifest();
  if (check) {
    console.log(
      `[ok] qualification contract ${built.manifest.qualificationContract.digest} ` +
        `fixtures=${built.manifest.fixtureSummary.total}`,
    );
    return;
  }
  const evidencePath = args[evidenceIndex + 1];
  assertString(evidencePath, "--evidence path");
  const evidenceText = await readFile(path.resolve(repoRoot, evidencePath), "utf8");
  const result = validateCandidateEvidence(
    parseStrictJson(evidenceText, evidencePath),
    built,
  );
  console.log(
    `[ok] adapter service-backed regression qualification; ` +
      `adapter-qualified=true; live-qualified=false; capability=default-off; ` +
      `bitwise-determinism=false ${JSON.stringify(result)}`,
  );
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
