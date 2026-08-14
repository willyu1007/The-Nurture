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
const artifactPath = path.join(directory, "teacher-communication-owner.owner-contract.json");
const fixturesPath = path.join(directory, "conformance-fixtures.json");
const publishedDigest =
  "sha256:e4a831cdb867ab2a5ad38d6e634e13b9da41d44606a9644c6aa0b7fd36503edf";

const readOperations = ["targets_query", "membership_query", "timeline_query"];
const exchangeOperations = [
  "send_text_exchange",
  "withdraw_staged_exchange",
  "mark_read_exchange",
];
const operations = [...readOperations, ...exchangeOperations];
const rows = ["T-C02", "T-S04", "T-C03", "T-C04", "T-C09", "T-C07", "T-C05"];
const negativeScenarios = [
  "not_authorized_admin",
  "not_authorized_other_class",
  "not_authorized_guardian",
  "revoked_mid_window",
  "stale_context_ref",
  "cross_scope_class_ref",
  "cross_scope_thread_ref",
  "cross_thread_message_ref",
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
  "backwards_mark_read_denied",
  "timeline_cursor_echo_enforced",
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
  "thread_id",
  "message_id",
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
  "thread_id",
  "message_id",
  "storage_ref",
  "signed_url",
  "url",
]);

const assert = (condition, message) => {
  if (!condition) throw new Error(`Teacher communication conformance: ${message}`);
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

const queryKeyFor = (fixture) => {
  const request = fixture.request;
  if (fixture.operation === "targets_query") return request.class_ref;
  if (fixture.operation === "membership_query") return request.thread_ref;
  return `${request.thread_ref}|${request.cursor ?? "first"}`;
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
  if (operation === "targets_query") {
    const refs = new Set(response.threads.map((thread) => thread.thread_ref));
    assert(refs.size === response.threads.length, `${id} duplicated a thread_ref`);
    const total = response.threads.reduce(
      (sum, thread) => sum + thread.unread_count,
      0,
    );
    const withUnread = response.threads.filter(
      (thread) => thread.unread_count > 0,
    ).length;
    assert(
      response.unread_summary.total_unread === Math.min(total, 999)
        && response.unread_summary.threads_with_unread === withUnread,
      `${id} unread summary disagrees with its threads`,
    );
  }
  if (operation === "membership_query") {
    assert(response.thread_ref === request.thread_ref, `${id} thread echo drifted`);
    const refs = new Set(response.members.map((member) => member.member_ref));
    assert(refs.size === response.members.length, `${id} duplicated a member_ref`);
  }
  if (operation === "timeline_query") {
    assert(response.thread_ref === request.thread_ref, `${id} thread echo drifted`);
    assert(
      response.cursor_echo === (request.cursor ?? null),
      `${id} cursor echo drifted (W4 replay rule)`,
    );
    const refs = new Set(response.messages.map((message) => message.message_ref));
    assert(refs.size === response.messages.length, `${id} duplicated a message_ref`);
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
  if (operation === "send_text_exchange") {
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
    }
  }
  if (operation === "withdraw_staged_exchange" && response.status === "committed") {
    assert(
      response.process_ref === request.process_ref,
      `${id} withdraw answered a foreign process`,
    );
  }
  if (operation === "mark_read_exchange" && response.status === "committed") {
    assert(
      response.thread_ref === request.thread_ref,
      `${id} mark-read answered a foreign thread`,
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
  artifact.interface?.key === "nurture.teacher-communication-owner"
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
  artifact.operation_order.join("|") === operations.join("|"),
  "operation order drifted",
);
for (const operation of operations) {
  assert(
    typeof artifact.transport.paths[operation] === "string"
      && artifact.transport.paths[operation].startsWith(
        "/internal/nurture/teacher-communication-owner/v1/",
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
  `teacher-communication-owner contract OK: digest ${publishedDigest}, `
    + `${fixtures.fixtures.length} fixtures, `
    + `${fixtures.invalid_fixtures.length} invalid probes`,
);
