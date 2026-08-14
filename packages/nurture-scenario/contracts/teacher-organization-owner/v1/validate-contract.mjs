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
const artifactPath = path.join(directory, "teacher-organization-owner.owner-contract.json");
const fixturesPath = path.join(directory, "conformance-fixtures.json");
const publishedDigest =
  "sha256:b0d4602ff30017338f2a46d3a84cfdaaa011a2d04e134aba8d4dde0125304161";

const readOperations = ["feed_query", "organization_query"];
const exchangeOperations = [
  "organize_exchange",
  "supplement_exchange",
  "class_note_exchange",
  "queue_admission_exchange",
];
const operations = [...readOperations, ...exchangeOperations];
const rows = ["T-F08", "T-F09", "T-F10", "T-F11", "T-F02", "T-F05", "T-F15"];
const negativeScenarios = [
  "not_authorized_admin",
  "not_authorized_other_class",
  "not_authorized_guardian",
  "revoked_mid_window",
  "stale_context_ref",
  "cross_scope_class_ref",
  "cross_class_child_ref",
  "cross_scope_process_ref",
  "disabled_gate",
  "service_auth_missing",
  "forbidden_request_field",
  "hidden_payload_rejected",
  "cross_actor_replay_denied",
  "divergent_command_payload_conflict",
  "confirmation_expired",
  "confirmation_single_use",
  "outcome_unknown_same_command_recovery",
  "voice_note_rejected",
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
  if (!condition) throw new Error(`Teacher organization conformance: ${message}`);
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

const validateReadBinding = (fixture) => {
  const { request, response, operation, fixture_id: id } = fixture;
  if (response.status !== "ready") {
    assert(
      response.context_ref === request.context_ref,
      `${id} failure context_ref drifted`,
    );
    if (response.status === "unavailable") {
      assert(
        response.reason_code === "temporarily_unavailable"
          ? response.retryable === true
          : response.retryable === false,
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
      && partition.query_key === request.class_ref,
    `${id} scope or query key is not the requested class`,
  );
  if (operation === "feed_query") {
    for (const capture of response.captures) {
      assert(
        capture.kind !== "media" || capture.text_excerpt === undefined,
        `${id} media capture carries a text excerpt`,
      );
      assert(
        capture.stability === "stable" || capture.text_excerpt === undefined,
        `${id} processing capture carries a text excerpt`,
      );
    }
    const refs = new Set(response.captures.map((capture) => capture.capture_ref));
    assert(refs.size === response.captures.length, `${id} duplicated a capture_ref`);
  }
  if (operation === "organization_query") {
    const activeQuickAdjust = response.lane.filter(
      (card) => card.quick_adjust_until !== undefined,
    );
    assert(
      activeQuickAdjust.length <= 1,
      `${id} more than one lane card reports an active quick-adjust window`,
    );
    const refs = new Set(response.lane.map((card) => card.process_ref));
    assert(refs.size === response.lane.length, `${id} duplicated a process_ref`);
    assert(
      response.batch.stable_capture_count <= response.batch.capture_count,
      `${id} stable captures exceed total captures`,
    );
    for (const card of response.lane) {
      if (card.state === "pending_release") {
        assert(
          card.admission_preview.status === "already_satisfied",
          `${id} pending_release card must preview already_satisfied`,
        );
      }
    }
  }
};

const validateExchangeBinding = (fixture) => {
  const { request, response, operation, fixture_id: id } = fixture;
  assert(
    response.context_ref === request.context_ref,
    `${id} exchange context_ref drifted`,
  );
  if (response.status === "masked" || response.status === "unavailable") {
    if (response.status === "unavailable") {
      assert(
        response.reason_code === "temporarily_unavailable"
          ? response.retryable === true
          : response.retryable === false,
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
  if (operation === "supplement_exchange") {
    if (request.kind === "prepare") {
      assert(
        ["ready_to_confirm", "not_committed", "outcome_unknown"].includes(
          response.status,
        ),
        `${id} prepare answered ${response.status}`,
      );
    } else {
      assert(
        response.status !== "ready_to_confirm",
        `${id} confirm answered ready_to_confirm`,
      );
      if (response.status === "committed") {
        assert(
          request.confirm !== undefined,
          `${id} committed without a confirm payload`,
        );
      }
    }
  }
  if (operation === "queue_admission_exchange" && response.status === "committed") {
    assert(
      response.process_ref === request.process_ref,
      `${id} admission answered a foreign process`,
    );
  }
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
    `${fixture.fixture_id} accepts caller authority`,
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
  artifact.interface?.key === "nurture.teacher-organization-owner"
    && artifact.interface.version === "1.0.0"
    && artifact.interface.kind === "private_owner_exchange",
  "interface identity drifted",
);
assert(
  artifact.publication_posture?.default_off === true
    && artifact.mobile_posture?.mode === "read_and_command"
    && artifact.command_model?.no_auto_send !== undefined,
  "default-off or command posture drifted",
);
assert(
  artifact.operation_order.join("|") === operations.join("|"),
  "operation order drifted",
);
for (const operation of operations) {
  assert(
    typeof artifact.transport.paths[operation] === "string"
      && artifact.transport.paths[operation].startsWith(
        "/internal/nurture/teacher-organization-owner/v1/",
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
  `teacher-organization-owner contract OK: digest ${publishedDigest}, `
    + `${fixtures.fixtures.length} fixtures, `
    + `${fixtures.invalid_fixtures.length} invalid probes`,
);
