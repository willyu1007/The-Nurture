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
const artifactPath = path.join(
  directory,
  "parent-communication-owner-extension.owner-contract.json",
);
const fixturesPath = path.join(directory, "conformance-fixtures.json");
const baseArtifactPath = path.join(
  directory,
  "..",
  "v1",
  "parent-communication-owner.owner-contract.json",
);
const publishedDigest =
  "sha256:d705146eb00185cbec425953e9a6fa358cc5fb9af193c86f788276617c7b29d1";
const baseDigest =
  "sha256:b1dce3a73ac45ff244452e13434834a152bc1ffdc8ede685f8a20b04c9b24a7f";

const readOperations = ["redaction_preview_query", "delivery_receipt_query"];
const exchangeOperations = ["redact_exchange"];
const operations = [
  "redaction_preview_query",
  "redact_exchange",
  "delivery_receipt_query",
];
const rows = ["P-H05", "P-H06"];
const negativeScenarios = [
  "guardian_only_author_redaction",
  "teacher_authored_message_masked",
  "stale_context_ref",
  "cross_scope_message_ref",
  "disabled_gate",
  "service_auth_missing",
  "forbidden_request_field",
  "hidden_payload_rejected",
  "confirmation_foreign_refused",
  "confirmation_expired_refused",
  "preview_digest_mismatch_refused",
  "already_redacted_answers_already_satisfied",
  "cross_actor_replay_denied",
  "divergent_command_payload_conflict",
  "outcome_unknown_same_command_recovery",
  "receipt_identity_never_exposed",
];
const forbiddenRequestFields = new Set([
  "participant_id",
  "role",
  "role_assignment_id",
  "family_id",
  "enrollment_id",
  "child_id",
  "child_care_process_id",
  "grant_id",
  "receipt_id",
  "message_id",
]);
const forbiddenResponseFields = new Set([
  "participant_id",
  "role_assignment_id",
  "family_id",
  "enrollment_id",
  "child_id",
  "child_care_process_id",
  "grant_id",
  "receipt_id",
  "receipt_ref",
  "recipient_count",
  "message_id",
  "body",
]);
const recoveryByReason = {
  stale_confirmation: "re_prepare",
  confirmation_expired: "re_prepare",
  confirmation_foreign: "re_prepare",
  preview_digest_mismatch: "re_prepare",
  redaction_evidence_unavailable: "none",
  command_payload_conflict: "new_command",
};

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(`Parent-communication extension conformance: ${message}`);
  }
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

const assertEnvelope = (fixture, response) => {
  const { request, fixture_id: id } = fixture;
  const resolution = response.owner_resolution;
  const cache = response.cache_partition;
  assert(
    resolution.context_ref === request.context_ref
      && cache.context_ref === request.context_ref,
    `${id} context_ref drifted`,
  );
  assert(
    cache.workspace_id === request.workspace_id
      && cache.my_chat_user_id === request.my_chat_user_id,
    `${id} cache identity drifted from the request`,
  );
  assert(
    cache.contract_digest === publishedDigest
      && request.interface_contract.digest === publishedDigest,
    `${id} digest drifted`,
  );
  assert(
    cache.resolution_ref === resolution.resolution_ref
      && cache.scope_version === resolution.scope_version,
    `${id} cache partition is not bound to the owner resolution`,
  );
  assert(
    cache.operation === fixture.operation,
    `${id} cache operation drifted`,
  );
  assert(
    cache.presentation_version === response.presentation_version,
    `${id} presentation version detached from its partition`,
  );
};

const validateReadBinding = (fixture) => {
  const { request, response, operation, fixture_id: id } = fixture;
  if (response.status === "masked" || response.status === "unavailable") {
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
  assertEnvelope(fixture, response);
  if (operation === "redaction_preview_query") {
    assert(
      response.status === "ready_to_confirm"
        && response.command_request_id === request.command_request_id,
      `${id} preview command identity drifted`,
    );
    assert(
      response.preview.message_ref === request.message_ref,
      `${id} preview answered a foreign message`,
    );
    assert(
      response.presentation_version === request.presentation_version,
      `${id} preview presentation drifted from the request`,
    );
  }
  if (operation === "delivery_receipt_query") {
    assert(response.status === "ready", `${id} unexpected status`);
    assert(
      response.message_ref === request.message_ref,
      `${id} receipt answered a foreign message`,
    );
    assert(
      response.refreshed_at < response.cache_partition.expires_at,
      `${id} lifetime ordering broke`,
    );
  }
};

const validateExchangeBinding = (fixture) => {
  const { request, response, fixture_id: id } = fixture;
  if (response.status === "masked" || response.status === "unavailable") {
    assert(
      response.context_ref === request.context_ref,
      `${id} failure context_ref drifted`,
    );
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
  if (response.status === "committed") {
    assert(
      response.message_ref === request.message_ref,
      `${id} committed a foreign message`,
    );
    if (response.disposition === "applied") {
      assert(
        typeof response.redacted_at === "string" && isRecord(response.cascade),
        `${id} applied commit lacks its instant or cascade`,
      );
    } else {
      assert(
        !("redacted_at" in response) && !("cascade" in response),
        `${id} already_satisfied fabricated apply evidence`,
      );
    }
  }
  if (response.status === "not_committed") {
    assert(
      recoveryByReason[response.reason_code] === response.recovery,
      `${id} reason/recovery pairing drifted`,
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
const baseArtifact = await readStrictJson(baseArtifactPath);
const computedDigest = digestOf(artifact);
assert(computedDigest === publishedDigest, `digest mismatch; computed ${computedDigest}`);
// The extension's core promise: the frozen 1.0.0 artifact stays
// byte-identical, and the extension names it exactly.
const computedBaseDigest = digestOf(baseArtifact);
assert(
  computedBaseDigest === baseDigest,
  `frozen v1 artifact moved; computed ${computedBaseDigest}`,
);
assert(
  artifact.interface?.key === "nurture.parent-communication-owner"
    && artifact.interface.version === "1.1.0"
    && artifact.interface.kind === "private_owner_query_and_command",
  "interface identity drifted",
);
assert(
  artifact.base_interface?.key === artifact.interface.key
    && artifact.base_interface.version === "1.0.0"
    && artifact.base_interface.digest === baseDigest
    && artifact.base_interface.relationship
      === "additive_extension_no_base_mutation",
  "base interface pin drifted",
);
assert(
  artifact.publication_posture?.default_off === true
    && artifact.publication_posture.base_contract === "frozen_1_0_0_untouched"
    && String(artifact.command_semantics?.outcome_unknown ?? "").includes(
      "exact same-command replay",
    )
    && String(artifact.command_semantics?.already_satisfied ?? "").includes(
      "already_satisfied",
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
        "/internal/nurture/parent-communication-owner/v1.1/",
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
  fixtures.base_interface_contract?.digest === baseDigest,
  "fixture base pin drifted",
);
assert(
  [...fixtures.required_negative_scenarios].sort().join("|")
    === [...negativeScenarios].sort().join("|"),
  "required negative scenario declaration drifted",
);

const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
ajv.addSchema(artifact.contract_schema);
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
let alreadySatisfiedCount = 0;
for (const fixture of fixtures.fixtures) {
  assert(!fixtureIds.has(fixture.fixture_id), `duplicate ${fixture.fixture_id}`);
  fixtureIds.add(fixture.fixture_id);
  validateFixture(fixture, validators);
  coveredOperations.add(fixture.operation);
  if (fixture.response.status === "masked") maskedCount += 1;
  if (fixture.response.status === "unavailable") unavailableCount += 1;
  if (fixture.response.status === "outcome_unknown") unknownCount += 1;
  if (fixture.response.execution_disposition === "replayed") replayedCount += 1;
  if (fixture.response.disposition === "already_satisfied") {
    alreadySatisfiedCount += 1;
  }
}
assert(
  operations.every((operation) => coveredOperations.has(operation)),
  "every operation needs at least one fixture",
);
assert(
  maskedCount >= 1
    && unavailableCount >= 1
    && unknownCount >= 1
    && replayedCount >= 1
    && alreadySatisfiedCount >= 1,
  "failure/replay/already-satisfied coverage is incomplete",
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
  `parent-communication-owner extension contract OK: digest ${publishedDigest}, `
    + `base ${baseDigest} unmoved, ${fixtures.fixtures.length} fixtures, `
    + `${fixtures.invalid_fixtures.length} invalid probes`,
);
