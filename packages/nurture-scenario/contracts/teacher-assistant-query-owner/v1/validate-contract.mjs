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
const artifactPath = path.join(directory, "teacher-assistant-query-owner.owner-contract.json");
const fixturesPath = path.join(directory, "conformance-fixtures.json");
const publishedDigest =
  "sha256:d401066102cb398f00b6bd897611ba794abb36d11837a25423f1c19101cadb8e";

const readOperations = ["missing_records_query", "weekly_source_query"];
const exchangeOperations = ["weekly_draft_exchange"];
const operations = [...readOperations, ...exchangeOperations];
const rows = ["T-H02", "T-H04"];
const careKinds = ["meal", "nap", "mood", "activity", "health_observation"];
const negativeScenarios = [
  "not_authorized_admin",
  "not_authorized_other_class",
  "not_authorized_guardian",
  "revoked_mid_window",
  "stale_context_ref",
  "cross_scope_class_ref",
  "invalid_local_date",
  "disabled_gate",
  "service_auth_missing",
  "forbidden_request_field",
  "hidden_payload_rejected",
  "cross_actor_replay_denied",
  "divergent_command_payload_conflict",
  "outcome_unknown_same_command_recovery",
  "duplicate_week_already_satisfied_same_process",
  "handoff_never_executable",
  "week_boundary_tampering_rejected",
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
  "process_id",
  "revision_id",
  "purpose",
  "week_start",
  "week_end",
]);
const forbiddenResponseFields = new Set([
  "action_ref",
  "participant_id",
  "role_assignment_id",
  "institution_id",
  "family_id",
  "child_id",
  "care_group_id",
  "enrollment_id",
  "grant_id",
  "storage_ref",
  "signed_url",
  "url",
]);

const assert = (condition, message) => {
  if (!condition) throw new Error(`Teacher assistant-query conformance: ${message}`);
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

// Owner-computed week identity: reads key by request date, weekly by the
// owner's answered Monday; the caller never supplies week boundaries.
const queryKeyFor = (fixture) =>
  fixture.operation === "missing_records_query"
    ? `${fixture.request.class_ref}|${fixture.request.local_date}`
    : `${fixture.request.class_ref}|${fixture.response.week_start}`;

const validateMissingRecordsContent = (fixture) => {
  const { request, response, fixture_id: id } = fixture;
  assert(response.local_date === request.local_date, `${id} local_date echo drifted`);
  const childRefs = new Set(response.children.map((child) => child.child_ref));
  assert(childRefs.size === response.children.length, `${id} duplicated a child_ref`);
  let missingTotal = 0;
  for (const child of response.children) {
    missingTotal += child.missing_kinds.length;
    const union = [...child.present_kinds, ...child.missing_kinds].sort();
    assert(
      union.join("|") === [...careKinds].sort().join("|"),
      `${id} kinds do not partition the five daily-care kinds`,
    );
    if (child.missing_kinds.length > 0) {
      assert(
        child.handoff && child.handoff.child_ref === child.child_ref,
        `${id} missing child lacks its own handoff descriptor`,
      );
    } else {
      assert(!("handoff" in child), `${id} complete child carries a handoff`);
    }
  }
  assert(
    response.missing_count === missingTotal,
    `${id} missing_count detached from its children`,
  );
};

const validateWeeklySourceContent = (fixture) => {
  const { request, response, fixture_id: id } = fixture;
  assert(
    Date.parse(response.week_end) - Date.parse(response.week_start)
      === 6 * 86_400_000,
    `${id} week window is not seven days`,
  );
  assert(
    response.week_start <= request.local_date
      && request.local_date <= response.week_end,
    `${id} answered a week that excludes the requested date`,
  );
  const childRefs = new Set(response.children.map((child) => child.child_ref));
  assert(childRefs.size === response.children.length, `${id} duplicated a child_ref`);
  const recordTotal = response.children.reduce(
    (sum, child) =>
      sum + careKinds.reduce((inner, kind) => inner + child.care_counts[kind], 0),
    0,
  );
  const mediaTotal = response.children.reduce(
    (sum, child) => sum + child.confirmed_media_count,
    0,
  );
  assert(
    response.class_total_records === recordTotal
      && response.class_total_confirmed_media === mediaTotal,
    `${id} class totals detached from the per-child facts`,
  );
};

const validateReadBinding = (fixture) => {
  const { request, response, operation, fixture_id: id } = fixture;
  if (response.status !== "ready") {
    assert(
      response.context_ref === request.context_ref,
      `${id} failure context_ref drifted`,
    );
    if (response.status === "unavailable") {
      assert(
        (response.reason_code === "temporarily_unavailable")
          === response.retryable,
        `${id} retryable does not match its reason code`,
      );
    }
    return;
  }
  const resolution = response.owner_resolution;
  const partition = response.cache_partition;
  assert(
    resolution.context_ref === request.context_ref
      && partition.context_ref === request.context_ref,
    `${id} context_ref drifted`,
  );
  assert(
    partition.workspace_id === request.workspace_id
      && partition.my_chat_user_id === request.my_chat_user_id,
    `${id} cache identity drifted from the request`,
  );
  assert(partition.operation === operation, `${id} cache operation drifted`);
  assert(
    partition.contract_digest === publishedDigest
      && request.interface_contract.digest === publishedDigest,
    `${id} digest drifted`,
  );
  assert(
    partition.resolution_ref === resolution.resolution_ref
      && partition.scope_version === resolution.scope_version
      && partition.presentation_role === resolution.presentation_role,
    `${id} cache partition is not bound to the owner resolution`,
  );
  assert(
    resolution.resolved_at <= response.generated_at
      && response.generated_at < partition.expires_at,
    `${id} lifetime ordering broke`,
  );
  assert(
    response.freshness.resolved_at === resolution.resolved_at,
    `${id} freshness detached from the resolution`,
  );
  assert(
    resolution.scope_ref === request.class_ref
      && partition.query_key === queryKeyFor(fixture),
    `${id} scope or query key derivation drifted`,
  );
  if (operation === "missing_records_query") validateMissingRecordsContent(fixture);
  if (operation === "weekly_source_query") validateWeeklySourceContent(fixture);
};

const validateExchangeBinding = (fixture) => {
  const { request, response, fixture_id: id } = fixture;
  assert(
    response.context_ref === request.context_ref,
    `${id} exchange context_ref drifted`,
  );
  if (response.status === "masked" || response.status === "unavailable") {
    if (response.status === "unavailable") {
      assert(
        (response.reason_code === "temporarily_unavailable")
          === response.retryable,
        `${id} retryable does not match its reason code`,
      );
    }
    return;
  }
  assert(
    response.command_request_id === request.command_request_id,
    `${id} command identity drifted`,
  );
  assert(
    request.interface_contract.digest === publishedDigest,
    `${id} request digest drifted`,
  );
};

const validateFixture = (fixture, validators) => {
  const pair = validators.get(fixture.operation);
  assert(pair, `${fixture.fixture_id} names unknown operation ${fixture.operation}`);
  assert(
    pair.request(fixture.request),
    `${fixture.fixture_id} request rejected: ${JSON.stringify(pair.request.errors)}`,
  );
  assert(
    pair.response(fixture.response),
    `${fixture.fixture_id} response rejected: ${JSON.stringify(pair.response.errors)}`,
  );
  const requestKeys = collectKeys(fixture.request);
  const responseKeys = collectKeys(fixture.response);
  assert(
    requestKeys.every((key) => !forbiddenRequestFields.has(key)),
    `${fixture.fixture_id} accepts caller authority or week boundaries`,
  );
  assert(
    responseKeys.every((key) => !forbiddenResponseFields.has(key)),
    `${fixture.fixture_id} exposes a forbidden response field`,
  );
  if (readOperations.includes(fixture.operation)) {
    validateReadBinding(fixture);
  } else {
    validateExchangeBinding(fixture);
  }
};

const artifact = await readStrictJson(artifactPath);
const fixtures = await readStrictJson(fixturesPath);
const computedDigest = digestOf(artifact);
assert(computedDigest === publishedDigest, `digest mismatch; computed ${computedDigest}`);
assert(
  artifact.interface?.key === "nurture.teacher-assistant-query-owner"
    && artifact.interface.version === "1.0.0"
    && artifact.interface.kind === "private_owner_exchange",
  "interface identity drifted",
);
assert(
  artifact.publication_posture?.default_off === true
    && artifact.mobile_posture?.mode === "read_and_command"
    && String(artifact.command_model?.outcome_unknown ?? "").includes(
      "exact same-command replay",
    ),
  "default-off or command posture drifted",
);
assert(
  artifact.mobile_posture.forbidden_response_fields.includes("action_ref")
    && artifact.mobile_posture.rules.some((rule) =>
      rule.includes("never calls a model provider"),
    ),
  "handoff/generation boundary posture drifted",
);
assert(
  artifact.operation_order.join("|") === operations.join("|"),
  "operation order drifted",
);
for (const operation of operations) {
  assert(
    typeof artifact.transport.paths[operation] === "string"
      && artifact.transport.paths[operation].startsWith(
        "/internal/nurture/teacher-assistant-query-owner/v1/",
      ),
    `${operation} path drifted`,
  );
}
const mappedRows = operations.flatMap(
  (operation) => artifact.operations[operation].t039_rows,
);
assert(
  [...new Set(mappedRows)].sort().join("|") === [...rows].sort().join("|"),
  "T-039 row coverage drifted",
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

const fixtureIds = new Set();
const coveredOperations = new Set();
let maskedCount = 0;
let unavailableCount = 0;
let unknownCount = 0;
let replayedCount = 0;
for (const fixture of fixtures.fixtures) {
  assert(!fixtureIds.has(fixture.fixture_id), `duplicate ${fixture.fixture_id}`);
  fixtureIds.add(fixture.fixture_id);
  validateFixture(fixture, validators);
  coveredOperations.add(fixture.operation);
  if (fixture.response.status === "masked") maskedCount += 1;
  if (fixture.response.status === "unavailable") unavailableCount += 1;
  if (fixture.response.status === "outcome_unknown") unknownCount += 1;
  if (fixture.response.executed === "replayed") replayedCount += 1;
}
assert(
  operations.every((operation) => coveredOperations.has(operation)),
  "every operation needs at least one fixture",
);
assert(
  maskedCount >= 1 && unavailableCount >= 1 && unknownCount >= 1 && replayedCount >= 1,
  "failure/replay coverage is incomplete",
);

// Domain idempotency across fixtures: a duplicate week answers
// already_satisfied with a process_ref some created draft already named.
const committedDrafts = fixtures.fixtures.filter(
  (fixture) =>
    fixture.operation === "weekly_draft_exchange"
    && fixture.response.status === "committed",
);
const createdRefs = new Set(
  committedDrafts
    .filter((fixture) => fixture.response.disposition === "created")
    .map((fixture) => fixture.response.process_ref),
);
const satisfied = committedDrafts.filter(
  (fixture) => fixture.response.disposition === "already_satisfied",
);
assert(satisfied.length >= 1, "no already_satisfied duplicate-week fixture");
assert(
  satisfied.every((fixture) => createdRefs.has(fixture.response.process_ref)),
  "already_satisfied answered a process no created draft names",
);

const byId = new Map(fixtures.fixtures.map((fixture) => [fixture.fixture_id, fixture]));
for (const invalid of fixtures.invalid_fixtures) {
  assert(!fixtureIds.has(invalid.fixture_id), `duplicate ${invalid.fixture_id}`);
  fixtureIds.add(invalid.fixture_id);
  const source = byId.get(invalid.source_fixture_id);
  assert(source, `${invalid.fixture_id} names unknown source ${invalid.source_fixture_id}`);
  assert(
    source.operation === invalid.operation,
    `${invalid.fixture_id} operation drifted from its source`,
  );
  const pair = validators.get(invalid.operation);
  const mutated = structuredClone(
    invalid.target === "request" ? source.request : source.response,
  );
  applyMutation(mutated, invalid.mutation);
  const accepted = invalid.target === "request"
    ? pair.request(mutated)
    : pair.response(mutated);
  assert(!accepted, `${invalid.fixture_id} was not rejected`);
}

console.log(
  `teacher-assistant-query-owner contract OK: digest ${publishedDigest}, `
    + `${fixtures.fixtures.length} fixtures, `
    + `${fixtures.invalid_fixtures.length} invalid probes`,
);
