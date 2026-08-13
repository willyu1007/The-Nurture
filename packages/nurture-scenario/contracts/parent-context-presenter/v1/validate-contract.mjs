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
const artifactPath = path.join(directory, "parent-context-presenter.owner-contract.json");
const fixturesPath = path.join(directory, "conformance-fixtures.json");
const publishedAdoptionDigest =
  "sha256:3ac0906c6b514c861d266c3b4e470e5dcacb6cccdd61887e7b7a03e4c194c196";

const expectedOperations = [
  "day_query",
  "daily_care_cards_query",
  "activity_detail_query",
  "notice_list_and_confirmation",
  "freshness_attendance_projection",
];

const requiredNegativeScenarios = [
  "scope_loss",
  "revoked",
  "stale_context_ref",
  "ambiguous_enrollment",
  "protected_display_denial",
  "non_retryable_refresh",
];

const forbiddenCallerAuthorityFields = new Set([
  "participant_id",
  "participant_ref",
  "role",
  "role_assignment_id",
  "role_assignment_ref",
  "scope_id",
  "scope_ref",
  "family_id",
  "child_id",
  "enrollment_id",
  "grant_id",
  "care_group_id",
  "institution_id",
]);

const forbiddenResponseFields = new Set([
  "participant_id",
  "participant_ref",
  "role_assignment_id",
  "role_assignment_ref",
  "family_id",
  "child_id",
  "enrollment_id",
  "grant_id",
  "care_group_id",
  "institution_id",
  "storage_ref",
  "signed_url",
  "url",
]);

function assert(condition, message) {
  if (!condition) throw new Error(`Parent-context presenter conformance: ${message}`);
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function exactKeys(value, required, optional, label) {
  assert(isRecord(value), `${label} must be an object`);
  const actual = Object.keys(value).sort();
  const expected = [...required, ...optional].sort();
  assert(required.every((key) => actual.includes(key)), `${label} is missing a required field`);
  assert(actual.every((key) => expected.includes(key)), `${label} has an unexpected field`);
}

function collectKeys(value, keys = []) {
  if (Array.isArray(value)) {
    for (const item of value) collectKeys(item, keys);
    return keys;
  }
  if (!isRecord(value)) return keys;
  for (const [key, child] of Object.entries(value)) {
    keys.push(key);
    collectKeys(child, keys);
  }
  return keys;
}

function sha256Canonical(value) {
  return `sha256:${createHash("sha256")
    .update(nurtureCanonicalJson(value), "utf8")
    .digest("hex")}`;
}

async function readStrictJson(filePath) {
  return parseStrictJson(await readFile(filePath, "utf8"), path.basename(filePath));
}

function formatErrors(errors) {
  return (errors ?? [])
    .map((error) => `${error.instancePath || "/"} ${error.message}`)
    .join("; ");
}

function safeReasonOf(response) {
  if (!isRecord(response)) return undefined;
  if (typeof response.reason_code === "string") return response.reason_code;
  if (isRecord(response.mask_signal) && typeof response.mask_signal.reason_code === "string") {
    return response.mask_signal.reason_code;
  }
  return undefined;
}

function validateReadyBinding(fixture, digest) {
  const response = fixture.response;
  if (!isRecord(response) || !isRecord(response.owner_resolution)) return;
  const resolution = response.owner_resolution;
  assert(
    resolution.context_ref === fixture.request.context_ref,
    `${fixture.fixture_id} owner resolution context_ref drifted from the request`,
  );
  assert(
    response.cache_partition?.context_ref === fixture.request.context_ref,
    `${fixture.fixture_id} cache context_ref drifted from the request`,
  );
  assert(
    response.cache_partition?.workspace_id === fixture.request.workspace_id,
    `${fixture.fixture_id} cache workspace drifted from the request`,
  );
  assert(
    response.cache_partition?.my_chat_user_id === fixture.request.my_chat_user_id,
    `${fixture.fixture_id} cache actor drifted from the request`,
  );
  assert(
    response.cache_partition?.operation === fixture.operation,
    `${fixture.fixture_id} cache operation is not exact`,
  );
  assert(
    response.cache_partition?.resolution_ref === resolution.resolution_ref,
    `${fixture.fixture_id} cache resolution_ref is not owner-bound`,
  );
  assert(
    response.cache_partition?.scope_version === resolution.scope_version,
    `${fixture.fixture_id} cache scope_version is not owner-bound`,
  );
  assert(
    response.cache_partition?.contract_digest === digest,
    `${fixture.fixture_id} cache digest does not match the artifact`,
  );
}

function assertEqual(actual, expected, message) {
  assert(
    actual === expected,
    `${message}: expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`,
  );
}

function responseIs(fixture, status) {
  return isRecord(fixture.response) && fixture.response.status === status;
}

function validateOperationConsistency(fixture) {
  const { request, response } = fixture;
  assert(isRecord(request), `${fixture.fixture_id} request must be an object`);
  assert(isRecord(response), `${fixture.fixture_id} response must be an object`);
  if (fixture.operation === "notice_list_and_confirmation") {
    const allowedStatuses = {
      list: ["ready", "masked", "unavailable"],
      prepare_confirmation: ["ready_to_confirm", "masked", "unavailable"],
      confirm: [
        "committed",
        "not_committed",
        "outcome_unknown",
        "masked",
        "unavailable",
      ],
    }[request.kind];
    assert(
      allowedStatuses?.includes(response.status),
      `${fixture.fixture_id} response status ${JSON.stringify(response.status)} is invalid for notice kind ${JSON.stringify(request.kind)}`,
    );
  }
  if (response.status === "masked" || response.status === "unavailable") {
    assertEqual(
      response.context_ref,
      request.context_ref,
      `${fixture.fixture_id} failure context_ref drifted`,
    );
    return;
  }
  if (fixture.operation === "day_query" && response.status === "ready") {
    assertEqual(
      response.day?.selected_date,
      request.local_date,
      `${fixture.fixture_id} selected date is not request-bound`,
    );
    assertEqual(
      response.cache_partition?.query_key,
      request.local_date,
      `${fixture.fixture_id} day query key is not date-bound`,
    );
    const options = response.day?.calendar?.date_options ?? [];
    assert(
      options.some((option) => option.date === request.local_date),
      `${fixture.fixture_id} selected date is absent from the calendar`,
    );
    assert(
      response.day.calendar.earliest_date <= request.local_date
        && request.local_date <= response.day.calendar.latest_date,
      `${fixture.fixture_id} selected date is outside calendar bounds`,
    );
    assert(
      response.day.previous_date === null
        || response.day.previous_date < request.local_date,
      `${fixture.fixture_id} previous date is not before the selection`,
    );
    assert(
      response.day.next_date === null || response.day.next_date > request.local_date,
      `${fixture.fixture_id} next date is not after the selection`,
    );
    const activityRefs = response.activities.map((activity) => activity.activity_ref);
    assert(
      new Set(activityRefs).size === activityRefs.length,
      `${fixture.fixture_id} activity summaries contain duplicate refs`,
    );
  }
  if (fixture.operation === "daily_care_cards_query" && response.status === "ready") {
    assertEqual(
      response.local_date,
      request.local_date,
      `${fixture.fixture_id} daily-care date is not request-bound`,
    );
    assertEqual(
      response.cache_partition?.query_key,
      request.local_date,
      `${fixture.fixture_id} daily-care query key is not date-bound`,
    );
  }
  if (fixture.operation === "activity_detail_query" && response.status === "ready") {
    assertEqual(
      response.activity?.local_date,
      request.local_date,
      `${fixture.fixture_id} activity date is not request-bound`,
    );
    assertEqual(
      response.activity?.activity_ref,
      request.activity_ref,
      `${fixture.fixture_id} activity_ref is foreign to the request`,
    );
    assertEqual(
      response.cache_partition?.query_key,
      request.activity_ref,
      `${fixture.fixture_id} activity query key is not ref-bound`,
    );
    if (response.activity.media_state === "none") {
      assert(
        response.activity.media.length === 0,
        `${fixture.fixture_id} media_state=none carried protected media refs`,
      );
    }
    if (response.activity.media_state === "protected") {
      assert(
        response.activity.media.some((item) => item.status === "protected_available"),
        `${fixture.fixture_id} protected media state has no protected access ref`,
      );
    }
  }
  if (
    fixture.operation === "freshness_attendance_projection"
    && response.status === "ready"
  ) {
    assertEqual(
      response.local_date,
      request.local_date,
      `${fixture.fixture_id} freshness date is not request-bound`,
    );
    assertEqual(
      response.cache_partition?.query_key,
      request.local_date,
      `${fixture.fixture_id} freshness query key is not date-bound`,
    );
  }
  if (
    fixture.operation === "notice_list_and_confirmation"
    && request.kind === "list"
    && response.status === "ready"
  ) {
    const noticeRefs = response.notices.map((notice) => notice.notice_ref);
    assert(
      new Set(noticeRefs).size === noticeRefs.length,
      `${fixture.fixture_id} notice list contains duplicate refs`,
    );
    assert(
      response.page_info.has_more === false
        || typeof response.page_info.next_cursor === "string",
      `${fixture.fixture_id} has_more=true omitted next_cursor`,
    );
  }
}

function applyFixtureMutation(value, mutation, label) {
  assert(isRecord(mutation), `${label} mutation must be an object`);
  assert(
    mutation.kind === "set" || mutation.kind === "delete",
    `${label} mutation kind is invalid`,
  );
  assert(
    Array.isArray(mutation.path) && mutation.path.length > 0,
    `${label} mutation path is invalid`,
  );
  let target = value;
  for (const segment of mutation.path.slice(0, -1)) {
    assert(
      (typeof segment === "string" || Number.isSafeInteger(segment))
        && target !== null
        && typeof target === "object"
        && segment in target,
      `${label} mutation path does not exist`,
    );
    target = target[segment];
  }
  const leaf = mutation.path.at(-1);
  assert(
    typeof leaf === "string" || Number.isSafeInteger(leaf),
    `${label} mutation leaf is invalid`,
  );
  assert(
    target !== null && typeof target === "object",
    `${label} mutation target is not an object`,
  );
  if (mutation.kind === "delete") {
    assert(leaf in target, `${label} delete target does not exist`);
    delete target[leaf];
  } else {
    assert(Object.hasOwn(mutation, "value"), `${label} set mutation lacks value`);
    target[leaf] = structuredClone(mutation.value);
  }
}

function lateResultMayApply(fixture) {
  const boundary = fixture.boundary_input;
  return boundary?.response_generation === boundary?.active_generation
    && boundary?.active_context_ref === fixture.request.context_ref
    && fixture.response.cache_partition?.context_ref === boundary.active_context_ref;
}

const artifact = await readStrictJson(artifactPath);
const fixtures = await readStrictJson(fixturesPath);
assert(isRecord(artifact), "artifact must be an object");
assert(isRecord(fixtures), "fixture set must be an object");

const digest = sha256Canonical(artifact);
assert(
  digest === publishedAdoptionDigest,
  `computed digest ${digest} does not match published adoption digest ${publishedAdoptionDigest}`,
);
assert(
  artifact.interface?.key === "nurture.parent-context-presenter"
    && artifact.interface?.version === "1.0.0",
  "interface identity must be nurture.parent-context-presenter@1.0.0",
);
assert(
  artifact.surface_baseline?.key === "nurture.surface-contract"
    && artifact.surface_baseline?.version === "1.20.0"
    && artifact.surface_baseline?.relationship === "standalone_composition_no_surface_mutation",
  "standalone surface-baseline composition is not pinned",
);
assert(artifact.publication_posture?.default_off === true, "artifact must remain default-off");
assert(
  artifact.publication_posture?.route_registration
    === "scenario_service_mounted_default_off",
  "scenario-service routes must be mounted default-off",
);
assert(
  artifact.publication_posture?.runtime_adapter
    === "owner_ports_required_default_off",
  "runtime owner ports must remain required and default-off",
);
assert(artifact.transport?.authentication?.mode === "service_bearer", "service bearer auth is required");
assert(artifact.transport?.response_headers?.["cache-control"] === "private, no-store", "no-store is required");
assert(artifact.transport?.response_headers?.pragma === "no-cache", "pragma no-cache is required");

assert(
  JSON.stringify(artifact.operation_order) === JSON.stringify(expectedOperations),
  "operation order or population drifted",
);
assert(
  JSON.stringify(Object.keys(artifact.operations)) === JSON.stringify(expectedOperations),
  "operation registry must contain exactly the five W2 operations",
);
assert(
  new Set(Object.values(artifact.transport.paths)).size === expectedOperations.length,
  "each operation must have one distinct ingress path",
);

const reasonCodes = artifact.safe_reason_codes.map((entry) => entry.code);
assert(new Set(reasonCodes).size === reasonCodes.length, "safe reason codes must be unique");
for (const entry of artifact.safe_reason_codes) {
  exactKeys(entry, ["code", "meaning", "retryable", "mask_required", "recovery"], [], `reason ${entry.code}`);
}

assert(
  fixtures.interface_contract?.key === artifact.interface.key
    && fixtures.interface_contract?.version === artifact.interface.version
    && fixtures.interface_contract?.digest === digest,
  "fixture set does not carry the computed exact pin",
);
assert(
  JSON.stringify(fixtures.fixture_contract?.required_negative_scenarios)
    === JSON.stringify(requiredNegativeScenarios),
  "negative scenario declaration drifted",
);
assert(
  fixtures.fixture_contract?.private_response_headers?.["cache-control"] === "private, no-store"
    && fixtures.fixture_contract?.private_response_headers?.pragma === "no-cache",
  "joint fixtures must pin private no-store response headers",
);
assert(
  fixtures.fixture_contract?.expected_invalid_structural_fixtures === true,
  "fixture contract must require executed structural negatives",
);

const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
ajv.addSchema(artifact.schemas);
const validators = new Map();
for (const operation of expectedOperations) {
  const definition = artifact.operations[operation];
  const requestValidator = ajv.getSchema(definition.request_schema_ref);
  const responseValidator = ajv.getSchema(definition.response_schema_ref);
  const exchangeValidator = definition.exchange_schema_ref === undefined
    ? undefined
    : ajv.getSchema(definition.exchange_schema_ref);
  assert(requestValidator, `${operation} request schema did not compile`);
  assert(responseValidator, `${operation} response schema did not compile`);
  if (operation === "notice_list_and_confirmation") {
    assert(
      exchangeValidator,
      "notice_list_and_confirmation exchange schema did not compile",
    );
  } else {
    assert(
      exchangeValidator === undefined,
      `${operation} unexpectedly declares an exchange schema`,
    );
  }
  validators.set(operation, {
    requestValidator,
    responseValidator,
    exchangeValidator,
  });
}

const fixtureIds = new Set();
const coverage = new Map(expectedOperations.map((operation) => [operation, new Set()]));
const seenNegativeScenarios = new Set();
const noticeKinds = new Set();

for (const [index, fixture] of fixtures.fixtures.entries()) {
  exactKeys(
    fixture,
    ["fixture_id", "operation", "polarity", "scenario", "request", "response", "expected"],
    ["boundary_input"],
    `fixtures[${index}]`,
  );
  assert(!fixtureIds.has(fixture.fixture_id), `duplicate fixture ${fixture.fixture_id}`);
  fixtureIds.add(fixture.fixture_id);
  assert(expectedOperations.includes(fixture.operation), `${fixture.fixture_id} has an unknown operation`);
  assert(["positive", "negative"].includes(fixture.polarity), `${fixture.fixture_id} has invalid polarity`);
  coverage.get(fixture.operation).add(fixture.polarity);
  if (fixture.polarity === "negative") seenNegativeScenarios.add(fixture.scenario);

  const {
    requestValidator,
    responseValidator,
    exchangeValidator,
  } = validators.get(fixture.operation);
  assert(
    requestValidator(fixture.request),
    `${fixture.fixture_id} request schema failed: ${formatErrors(requestValidator.errors)}`,
  );
  assert(
    responseValidator(fixture.response),
    `${fixture.fixture_id} response schema failed: ${formatErrors(responseValidator.errors)}`,
  );
  if (exchangeValidator) {
    assert(
      exchangeValidator({ request: fixture.request, response: fixture.response }),
      `${fixture.fixture_id} exchange schema failed: ${formatErrors(exchangeValidator.errors)}`,
    );
  }

  const requestKeys = collectKeys(fixture.request);
  assert(
    !requestKeys.some((key) => forbiddenCallerAuthorityFields.has(key)),
    `${fixture.fixture_id} supplies an owner-resolved authority field`,
  );
  const responseKeys = collectKeys(fixture.response);
  assert(
    !responseKeys.some((key) => forbiddenResponseFields.has(key)),
    `${fixture.fixture_id} exposes a raw owner or storage field`,
  );

  assert(
    fixture.request.interface_contract.digest === digest,
    `${fixture.fixture_id} request does not use the computed exact pin`,
  );
  assert(
    fixture.expected.response_status === fixture.response.status,
    `${fixture.fixture_id} expected status is not exact`,
  );
  if (fixture.expected.safe_reason_code !== undefined) {
    assert(reasonCodes.includes(fixture.expected.safe_reason_code), `${fixture.fixture_id} uses an unreviewed reason`);
    assert(
      safeReasonOf(fixture.response) === fixture.expected.safe_reason_code,
      `${fixture.fixture_id} expected reason does not match the response`,
    );
  }
  validateReadyBinding(fixture, digest);
  validateOperationConsistency(fixture);

  if (fixture.operation === "notice_list_and_confirmation") {
    noticeKinds.add(fixture.request.kind);
  }
  if (fixture.scenario === "late_completion") {
    assert(
      fixture.boundary_input?.response_generation < fixture.boundary_input?.active_generation,
      `${fixture.fixture_id} must model a superseded generation`,
    );
    assert(
      fixture.expected.client_rule === "drop_superseded_generation_without_render_or_cache_write",
      `${fixture.fixture_id} must fail closed at the ASYNC-12 boundary`,
    );
    assert(
      lateResultMayApply(fixture) === false,
      `${fixture.fixture_id} late completion was accepted by the generation/context gate`,
    );
  }
}

for (const operation of expectedOperations) {
  assert(coverage.get(operation).has("positive"), `${operation} lacks a positive fixture`);
  assert(coverage.get(operation).has("negative"), `${operation} lacks a negative fixture`);
}
for (const scenario of requiredNegativeScenarios) {
  assert(seenNegativeScenarios.has(scenario), `required negative scenario ${scenario} is absent`);
}
for (const kind of ["list", "prepare_confirmation", "confirm"]) {
  assert(noticeKinds.has(kind), `notice ${kind} sub-exchange has no fixture`);
}

const readyDays = fixtures.fixtures.filter(
  (fixture) => fixture.operation === "day_query" && responseIs(fixture, "ready"),
);
for (const fixture of fixtures.fixtures.filter(
  (candidate) =>
    candidate.operation === "activity_detail_query"
    && responseIs(candidate, "ready"),
)) {
  const source = readyDays.find(
    (day) =>
      day.request.context_ref === fixture.request.context_ref
      && day.request.local_date === fixture.request.local_date,
  );
  assert(source, `${fixture.fixture_id} has no same-context day activity source`);
  assert(
    source.response.activities.some(
      (activity) => activity.activity_ref === fixture.request.activity_ref,
    ),
    `${fixture.fixture_id} activity_ref is foreign to the day summary source`,
  );
}

const readyNoticeLists = fixtures.fixtures.filter(
  (fixture) =>
    fixture.operation === "notice_list_and_confirmation"
    && fixture.request.kind === "list"
    && responseIs(fixture, "ready"),
);
const preparedNotices = fixtures.fixtures.filter(
  (fixture) =>
    fixture.operation === "notice_list_and_confirmation"
    && fixture.request.kind === "prepare_confirmation"
    && responseIs(fixture, "ready_to_confirm"),
);
for (const fixture of preparedNotices) {
  const list = readyNoticeLists.find(
    (candidate) => candidate.request.context_ref === fixture.request.context_ref,
  );
  const notice = list?.response.notices.find(
    (candidate) => candidate.notice_ref === fixture.request.notice_ref,
  );
  assert(notice, `${fixture.fixture_id} notice_ref is foreign to the list source`);
  assertEqual(
    notice.notice_version,
    fixture.request.expected_notice_version,
    `${fixture.fixture_id} notice version is foreign to the list source`,
  );
  assert(isRecord(notice.action), `${fixture.fixture_id} list notice has no action`);
  assertEqual(
    notice.action.action_ref,
    fixture.request.action_ref,
    `${fixture.fixture_id} action_ref is foreign to the list source`,
  );
  assertEqual(
    notice.action.action_version,
    fixture.request.action_version,
    `${fixture.fixture_id} action_version is foreign to the list source`,
  );
  assertEqual(
    fixture.response.notice_ref,
    fixture.request.notice_ref,
    `${fixture.fixture_id} prepared notice identity drifted`,
  );
  assertEqual(
    fixture.response.notice_version,
    fixture.request.expected_notice_version,
    `${fixture.fixture_id} prepared notice version drifted`,
  );
  assertEqual(
    fixture.response.action_ref,
    fixture.request.action_ref,
    `${fixture.fixture_id} prepared action identity drifted`,
  );
  assertEqual(
    fixture.response.action_version,
    fixture.request.action_version,
    `${fixture.fixture_id} prepared action version drifted`,
  );
  assertEqual(
    fixture.response.preview?.effect,
    notice.action.action_semantics,
    `${fixture.fixture_id} prepared effect differs from list copy`,
  );
  assertEqual(
    fixture.response.preview?.title,
    notice.action.confirmation_title,
    `${fixture.fixture_id} prepared title differs from list copy`,
  );
  assertEqual(
    fixture.response.preview?.body,
    notice.action.confirmation_body,
    `${fixture.fixture_id} prepared body differs from list copy`,
  );
  assertEqual(
    fixture.response.prepared_preview_digest,
    sha256Canonical(fixture.response.preview),
    `${fixture.fixture_id} prepared preview digest is not RFC 8785-bound`,
  );
}

for (const fixture of fixtures.fixtures.filter(
  (candidate) =>
    candidate.operation === "notice_list_and_confirmation"
    && candidate.request.kind === "confirm",
)) {
  const prepared = preparedNotices.find(
    (candidate) =>
      candidate.request.context_ref === fixture.request.context_ref
      && candidate.response.action_ref === fixture.request.action_ref
      && candidate.response.action_version === fixture.request.action_version
      && candidate.response.prepared_preview_digest
        === fixture.request.prepared_preview_digest
      && candidate.response.confirmation_ref === fixture.request.confirmation_ref
      && candidate.response.command_request_id === fixture.request.command_request_id,
  );
  assert(
    prepared,
    `${fixture.fixture_id} confirm identity/digest is foreign to prepared preview`,
  );
  if (fixture.response.status === "committed") {
    assertEqual(
      fixture.response.committed_result?.notice_ref,
      prepared.response.notice_ref,
      `${fixture.fixture_id} committed notice_ref is foreign to prepare`,
    );
  }
}

assert(
  Array.isArray(fixtures.invalid_fixtures) && fixtures.invalid_fixtures.length > 0,
  "expected-invalid structural fixture population is empty",
);
const invalidFixtureIds = new Set();
const invalidTargets = new Set();
for (const [index, fixture] of fixtures.invalid_fixtures.entries()) {
  exactKeys(
    fixture,
    [
      "fixture_id",
      "operation",
      "source_fixture_id",
      "target",
      "mutation",
    ],
    [],
    `invalid_fixtures[${index}]`,
  );
  assert(
    !fixtureIds.has(fixture.fixture_id) && !invalidFixtureIds.has(fixture.fixture_id),
    `duplicate invalid fixture ${fixture.fixture_id}`,
  );
  invalidFixtureIds.add(fixture.fixture_id);
  assert(
    expectedOperations.includes(fixture.operation),
    `${fixture.fixture_id} has an unknown operation`,
  );
  assert(
    fixture.target === "request" || fixture.target === "response",
    `${fixture.fixture_id} has an invalid target`,
  );
  invalidTargets.add(fixture.target);
  const source = fixtures.fixtures.find(
    (candidate) => candidate.fixture_id === fixture.source_fixture_id,
  );
  assert(source, `${fixture.fixture_id} source fixture is absent`);
  assertEqual(
    source.operation,
    fixture.operation,
    `${fixture.fixture_id} source operation drifted`,
  );
  const payload = structuredClone(source[fixture.target]);
  applyFixtureMutation(payload, fixture.mutation, fixture.fixture_id);
  const validator = validators.get(fixture.operation)[
    fixture.target === "request" ? "requestValidator" : "responseValidator"
  ];
  assert(
    !validator(payload),
    `${fixture.fixture_id} expected-invalid ${fixture.target} was accepted`,
  );
}
assert(
  invalidTargets.has("request") && invalidTargets.has("response"),
  "expected-invalid fixtures must exercise requests and responses",
);

const dayBindingProbe = structuredClone(
  fixtures.fixtures.find((fixture) => fixture.fixture_id === "w2-day-ready"),
);
dayBindingProbe.response.day.selected_date = "2026-08-12";
assertRejectsConsistency(
  () => validateOperationConsistency(dayBindingProbe),
  "selected-date binding probe",
);

const dailyCareBindingProbe = structuredClone(
  fixtures.fixtures.find(
    (fixture) => fixture.fixture_id === "w2-daily-care-partial-ready",
  ),
);
dailyCareBindingProbe.response.local_date = "2026-08-12";
assertRejectsConsistency(
  () => validateOperationConsistency(dailyCareBindingProbe),
  "daily-care selected-date binding probe",
);

const activityBindingProbe = structuredClone(
  fixtures.fixtures.find(
    (fixture) => fixture.fixture_id === "w2-activity-protected-media-ready",
  ),
);
activityBindingProbe.request.activity_ref = "activity:foreign:01";
activityBindingProbe.response.activity.activity_ref = "activity:foreign:01";
assertRejectsConsistency(() => {
  validateOperationConsistency(activityBindingProbe);
  const source = readyDays.find(
    (day) =>
      day.request.context_ref === activityBindingProbe.request.context_ref
      && day.request.local_date === activityBindingProbe.request.local_date,
  );
  assert(
    source?.response.activities.some(
      (activity) =>
        activity.activity_ref === activityBindingProbe.request.activity_ref,
    ),
    "foreign activity ref passed day-source consistency",
  );
}, "activity_ref foreign-consistency probe");

const mediaStateProbe = structuredClone(
  fixtures.fixtures.find(
    (fixture) => fixture.fixture_id === "w2-activity-protected-media-ready",
  ),
);
mediaStateProbe.response.activity.media_state = "none";
assertRejectsConsistency(
  () => validateOperationConsistency(mediaStateProbe),
  "media_state=none protected-ref exclusion probe",
);

const noticeRefProbe = structuredClone(
  fixtures.fixtures.find(
    (fixture) => fixture.fixture_id === "w2-notice-prepare-ready",
  ),
);
noticeRefProbe.request.notice_ref = "notice:foreign:01";
assertRejectsConsistency(() => {
  const list = readyNoticeLists.find(
    (candidate) => candidate.request.context_ref === noticeRefProbe.request.context_ref,
  );
  assert(
    list?.response.notices.some(
      (notice) => notice.notice_ref === noticeRefProbe.request.notice_ref,
    ),
    "foreign notice ref passed list-source consistency",
  );
}, "notice_ref foreign-consistency probe");

const noticeDigestProbe = structuredClone(
  fixtures.fixtures.find(
    (fixture) => fixture.fixture_id === "w2-notice-confirm-committed",
  ),
);
noticeDigestProbe.request.prepared_preview_digest = `sha256:${"0".repeat(64)}`;
assertRejectsConsistency(() => {
  assert(
    preparedNotices.some(
      (prepared) =>
        prepared.request.context_ref === noticeDigestProbe.request.context_ref
        && prepared.response.action_ref === noticeDigestProbe.request.action_ref
        && prepared.response.action_version === noticeDigestProbe.request.action_version
        && prepared.response.prepared_preview_digest
          === noticeDigestProbe.request.prepared_preview_digest,
    ),
    "foreign notice preview digest passed prepare consistency",
  );
}, "notice prepared-preview digest probe");

const noticeConfirmationRefProbe = structuredClone(
  fixtures.fixtures.find(
    (fixture) => fixture.fixture_id === "w2-notice-confirm-committed",
  ),
);
noticeConfirmationRefProbe.request.confirmation_ref =
  "confirm_notice_actor_context_foreign_0001";
assertRejectsConsistency(() => {
  assert(
    preparedNotices.some(
      (prepared) =>
        prepared.request.context_ref
          === noticeConfirmationRefProbe.request.context_ref
        && prepared.response.action_ref
          === noticeConfirmationRefProbe.request.action_ref
        && prepared.response.action_version
          === noticeConfirmationRefProbe.request.action_version
        && prepared.response.prepared_preview_digest
          === noticeConfirmationRefProbe.request.prepared_preview_digest
        && prepared.response.confirmation_ref
          === noticeConfirmationRefProbe.request.confirmation_ref
        && prepared.response.command_request_id
          === noticeConfirmationRefProbe.request.command_request_id,
    ),
    "foreign confirmation_ref passed prepare consistency",
  );
}, "notice confirmation_ref binding probe");

const noticeCommandRequestIdProbe = structuredClone(
  fixtures.fixtures.find(
    (fixture) => fixture.fixture_id === "w2-notice-confirm-committed",
  ),
);
noticeCommandRequestIdProbe.request.command_request_id =
  "command-notice-confirm-foreign";
assertRejectsConsistency(() => {
  assert(
    preparedNotices.some(
      (prepared) =>
        prepared.request.context_ref === noticeCommandRequestIdProbe.request.context_ref
        && prepared.response.action_ref === noticeCommandRequestIdProbe.request.action_ref
        && prepared.response.action_version
          === noticeCommandRequestIdProbe.request.action_version
        && prepared.response.prepared_preview_digest
          === noticeCommandRequestIdProbe.request.prepared_preview_digest
        && prepared.response.confirmation_ref
          === noticeCommandRequestIdProbe.request.confirmation_ref
        && prepared.response.command_request_id
          === noticeCommandRequestIdProbe.request.command_request_id,
    ),
    "foreign command_request_id passed prepare consistency",
  );
}, "notice command_request_id binding probe");

const noticeMatrixProbe = {
  fixture_id: "notice-list-not-committed-probe",
  operation: "notice_list_and_confirmation",
  request: structuredClone(
    fixtures.fixtures.find(
      (fixture) => fixture.fixture_id === "w2-notice-list-ready",
    ).request,
  ),
  response: structuredClone(
    fixtures.fixtures.find(
      (fixture) => fixture.fixture_id === "w2-notice-confirmation-replayed",
    ).response,
  ),
};
const noticeExchangeValidator = validators.get(
  "notice_list_and_confirmation",
).exchangeValidator;
assert(
  noticeExchangeValidator
    && !noticeExchangeValidator({
      request: noticeMatrixProbe.request,
      response: noticeMatrixProbe.response,
    }),
  "notice exchange schema accepted list + not_committed",
);
assertRejectsConsistency(
  () => validateOperationConsistency(noticeMatrixProbe),
  "notice kind/status matrix probe",
);

const cursorProbe = structuredClone(
  fixtures.fixtures.find((fixture) => fixture.fixture_id === "w2-notice-list-ready"),
);
cursorProbe.response.page_info.has_more = true;
assertRejectsConsistency(
  () => validateOperationConsistency(cursorProbe),
  "has_more cursor requirement probe",
);

const freshnessBindingProbe = structuredClone(
  fixtures.fixtures.find(
    (fixture) => fixture.fixture_id === "w2-freshness-attendance-ready",
  ),
);
freshnessBindingProbe.response.local_date = "2026-08-12";
assertRejectsConsistency(
  () => validateOperationConsistency(freshnessBindingProbe),
  "freshness selected-date binding probe",
);

for (const operation of expectedOperations) {
  const sample = fixtures.fixtures.find(
    (fixture) => fixture.operation === operation && fixture.polarity === "positive",
  );
  const { requestValidator, responseValidator } = validators.get(operation);
  const authorityInjection = structuredClone(sample.request);
  authorityInjection.participant_id = "forbidden-participant";
  assert(
    !requestValidator(authorityInjection),
    `${operation} accepted a caller-supplied Participant`,
  );
  const foreignResponse = structuredClone(sample.response);
  foreignResponse.unexpected_owner_field = "forbidden";
  assert(
    !responseValidator(foreignResponse),
    `${operation} accepted a foreign response field`,
  );
}

process.stdout.write(
  `[ok] parent-context-presenter contract=${artifact.interface.key}@${artifact.interface.version} digest=${digest} operations=${expectedOperations.length} fixtures=${fixtures.fixtures.length} invalid-fixtures=${fixtures.invalid_fixtures.length} consistency-probes=11 strict-probes=${expectedOperations.length * 2}\n`,
);

function assertRejectsConsistency(run, label) {
  try {
    run();
  } catch {
    return;
  }
  throw new Error(`Parent-context presenter conformance: ${label} was accepted`);
}
