#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { nurtureCanonicalJson } from "../../../src/c30/canonical-json.ts";
import { parseStrictJson } from "../../../../../scripts/surface-contract/contract-core.mjs";

const directory = path.dirname(fileURLToPath(import.meta.url));
const artifactPath = path.join(directory, "director-presenter.owner-contract.json");
const fixturesPath = path.join(directory, "conformance-fixtures.json");
const publishedDigest =
  "sha256:6ce74306c0fc976feecb5f530cd1a43f5986e9c982cdb12a3b4b5a2a568c7ac1";

const operations = ["overview_query", "drilldown_query", "material_query"];
const rows = [
  "D-O01",
  "D-O02",
  "D-O03",
  "D-O04",
  "D-O05",
  "D-O06",
  "D-O07",
  "D-O08",
  "D-O09",
  "D-O10",
  "D-O11",
  "D-O12",
  "D-O13",
  "D-O14",
];
const sectionKeys = [
  "attendance",
  "activity",
  "message_response",
  "home_kindergarten_flow",
  "authorization_changes",
  "philosophy_observation",
  "trend",
  "class_load_attention",
  "family_focus_attention",
  "organized_materials",
  "operation_entry",
];
const negativeScenarios = [
  "scope_loss",
  "revoked",
  "stale_context_ref",
  "ambiguous_institution",
  "purpose_denied",
  "non_retryable_refresh",
  "protected_material_denied",
  "mobile_action_forbidden",
];
const forbiddenRequestFields = new Set([
  "participant_id",
  "role",
  "role_assignment_id",
  "scope_id",
  "institution_id",
  "care_group_id",
  "family_id",
  "child_id",
  "enrollment_id",
  "grant_id",
  "purpose",
]);
const forbiddenResponseFields = new Set([
  "action_ref",
  "confirmation_ref",
  "command_request_id",
  "participant_id",
  "role_assignment_id",
  "institution_id",
  "family_id",
  "child_id",
  "grant_id",
  "storage_ref",
  "signed_url",
  "url",
]);

const assert = (condition, message) => {
  if (!condition) throw new Error(`Director presenter conformance: ${message}`);
};

const isRecord = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const readStrictJson = async (filePath) =>
  parseStrictJson(await readFile(filePath, "utf8"), path.basename(filePath));

const digestOf = (value) =>
  `sha256:${createHash("sha256")
    .update(nurtureCanonicalJson(value), "utf8")
    .digest("hex")}`;

const collectKeys = (value, output = []) => {
  if (Array.isArray(value)) {
    for (const item of value) collectKeys(item, output);
    return output;
  }
  if (!isRecord(value)) return output;
  for (const [key, child] of Object.entries(value)) {
    output.push(key);
    collectKeys(child, output);
  }
  return output;
};

const applyMutation = (value, mutation) => {
  let target = value;
  for (const segment of mutation.path.slice(0, -1)) {
    target = target[segment];
  }
  const leaf = mutation.path.at(-1);
  if (mutation.kind === "delete") delete target[leaf];
  else target[leaf] = mutation.value;
};

const validateReadyBinding = (fixture) => {
  const { request, response, operation } = fixture;
  if (response.status !== "ready") {
    assert(
      response.context_ref === request.context_ref,
      `${fixture.fixture_id} failure context_ref drifted`,
    );
    return;
  }
  assert(
    response.owner_resolution.context_ref === request.context_ref,
    `${fixture.fixture_id} owner context_ref drifted`,
  );
  assert(
    response.cache_partition.context_ref === request.context_ref,
    `${fixture.fixture_id} cache context_ref drifted`,
  );
  assert(
    response.cache_partition.workspace_id === request.workspace_id
      && response.cache_partition.my_chat_user_id === request.my_chat_user_id,
    `${fixture.fixture_id} cache actor partition drifted`,
  );
  assert(
    response.cache_partition.resolution_ref
      === response.owner_resolution.resolution_ref
      && response.cache_partition.scope_version
        === response.owner_resolution.scope_version,
    `${fixture.fixture_id} cache is not owner-resolution bound`,
  );
  assert(
    response.cache_partition.operation === operation
      && response.cache_partition.contract_digest === publishedDigest,
    `${fixture.fixture_id} cache operation or digest drifted`,
  );
  if (operation === "overview_query") {
    assert(
      response.organization.local_date === request.local_date
        && response.cache_partition.query_key === request.local_date,
      `${fixture.fixture_id} overview date drifted`,
    );
    const actual = response.sections.map((section) => section.section_key);
    assert(
      actual.length === new Set(actual).size
        && [...actual].sort().join("|") === [...sectionKeys].sort().join("|"),
      `${fixture.fixture_id} section coverage is not exact`,
    );
    const operationEntry = response.sections.find(
      (section) => section.section_key === "operation_entry",
    );
    assert(
      operationEntry?.status === "unavailable"
        && operationEntry.availability === "web_workbench_required",
      `${fixture.fixture_id} exposed a Mobile operation entry`,
    );
  }
  if (operation === "drilldown_query") {
    assert(
      response.drilldown_ref === request.drilldown_ref
        && response.cache_partition.query_key === request.drilldown_ref,
      `${fixture.fixture_id} drilldown ref drifted`,
    );
  }
  if (operation === "material_query") {
    assert(
      response.collection_ref === request.collection_ref
        && response.cache_partition.query_key === request.collection_ref,
      `${fixture.fixture_id} material collection drifted`,
    );
  }
};

const validateFixtureSemantics = (fixture) => {
  const requestKeys = collectKeys(fixture.request);
  const responseKeys = collectKeys(fixture.response);
  assert(
    fixture.request.interface_contract?.key === "nurture.director-presenter"
      && fixture.request.interface_contract.version === "1.0.0"
      && fixture.request.interface_contract.digest === publishedDigest,
    `${fixture.fixture_id} request pin drifted`,
  );
  assert(
    requestKeys.every((key) => !forbiddenRequestFields.has(key)),
    `${fixture.fixture_id} accepts caller authority`,
  );
  assert(
    responseKeys.every((key) => !forbiddenResponseFields.has(key)),
    `${fixture.fixture_id} exposes a forbidden response field`,
  );
  validateReadyBinding(fixture);
};

const artifact = await readStrictJson(artifactPath);
const fixtures = await readStrictJson(fixturesPath);
const computedDigest = digestOf(artifact);
assert(computedDigest === publishedDigest, `digest mismatch; computed ${computedDigest}`);
assert(
  artifact.interface?.key === "nurture.director-presenter"
    && artifact.interface.version === "1.0.0",
  "interface identity drifted",
);
assert(
  artifact.publication_posture?.default_off === true
    && artifact.mobile_posture?.mode === "read_only"
    && artifact.mobile_posture?.operation_entry === "web_workbench_required",
  "default-off or read-only posture drifted",
);
assert(
  artifact.operation_order.join("|") === operations.join("|"),
  "operation order drifted",
);
const mappedRows = operations.flatMap(
  (operation) => artifact.operations[operation].t039_rows,
);
assert(
  [...new Set(mappedRows)].sort().join("|") === rows.sort().join("|"),
  "D-O01 through D-O14 coverage is incomplete",
);
assert(
  fixtures.interface_contract?.key === artifact.interface.key
    && fixtures.interface_contract.version === artifact.interface.version
    && fixtures.interface_contract.digest === publishedDigest,
  "fixture interface pin drifted",
);
assert(
  [...fixtures.required_negative_scenarios].sort().join("|")
    === [...negativeScenarios].sort().join("|"),
  "required negative scenario declaration drifted",
);

const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
ajv.addSchema(artifact.schemas);
const validators = new Map(
  operations.map((operation) => {
    const definition = artifact.operations[operation];
    const request = ajv.getSchema(definition.request_schema_ref);
    const response = ajv.getSchema(definition.response_schema_ref);
    assert(request && response, `${operation} schemas did not compile`);
    return [operation, { request, response }];
  }),
);

const positiveCoverage = new Set();
const negativeCoverage = new Set();
const fixturesById = new Map();
for (const fixture of fixtures.fixtures) {
  const validator = validators.get(fixture.operation);
  assert(validator, `${fixture.fixture_id} uses an unknown operation`);
  assert(
    validator.request(fixture.request),
    `${fixture.fixture_id} request failed schema: ${ajv.errorsText(validator.request.errors)}`,
  );
  assert(
    validator.response(fixture.response),
    `${fixture.fixture_id} response failed schema: ${ajv.errorsText(validator.response.errors)}`,
  );
  validateFixtureSemantics(fixture);
  fixturesById.set(fixture.fixture_id, fixture);
  if (fixture.polarity === "positive") positiveCoverage.add(fixture.operation);
  else negativeCoverage.add(fixture.scenario);
}
assert(
  operations.every((operation) => positiveCoverage.has(operation)),
  "positive operation coverage is incomplete",
);
assert(
  negativeScenarios.every((scenario) => negativeCoverage.has(scenario)),
  "negative scenario coverage is incomplete",
);

for (const invalid of fixtures.invalid_fixtures) {
  const source = fixturesById.get(invalid.source_fixture_id);
  assert(source, `${invalid.fixture_id} source fixture is missing`);
  const mutated = structuredClone(source);
  applyMutation(mutated[invalid.target], invalid.mutation);
  const validator = validators.get(invalid.operation);
  let rejected = invalid.target === "request"
    ? !validator.request(mutated.request)
    : !validator.response(mutated.response);
  if (!rejected) {
    try {
      validateFixtureSemantics(mutated);
    } catch {
      rejected = true;
    }
  }
  assert(rejected, `${invalid.fixture_id} was accepted`);
}

console.log(
  `Director presenter contract PASS (${computedDigest}; ${fixtures.fixtures.length} fixtures; ${fixtures.invalid_fixtures.length} invalid probes)`,
);
