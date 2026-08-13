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
const artifactPath = path.join(directory, "parent-communication-owner.owner-contract.json");
const fixturesPath = path.join(directory, "conformance-fixtures.json");
const publishedDigest =
  "sha256:b1dce3a73ac45ff244452e13434834a152bc1ffdc8ede685f8a20b04c9b24a7f";
const operations = [
  "summary_query",
  "detail_query",
  "media_access_query",
  "send_text_exchange",
];
const forbiddenCallerFields = new Set([
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
  if (!condition) throw new Error(`Parent-communication owner conformance: ${message}`);
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function collectKeys(value, output = []) {
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
}

function canonicalDigest(value) {
  return `sha256:${createHash("sha256")
    .update(nurtureCanonicalJson(value), "utf8")
    .digest("hex")}`;
}

function schemaName(operation, target) {
  return `${operation.replace(/_(query|exchange)$/, "")}_${target}`;
}

function assertReadyBinding(fixture, digest) {
  const response = fixture.response;
  if (!isRecord(response) || !isRecord(response.owner_resolution)) return;
  const resolution = response.owner_resolution;
  const partition = response.cache_partition;
  assert(isRecord(partition), `${fixture.fixture_id} is missing a cache partition`);
  assert(resolution.context_ref === fixture.request.context_ref, `${fixture.fixture_id} context drifted`);
  assert(partition.context_ref === fixture.request.context_ref, `${fixture.fixture_id} cache context drifted`);
  assert(partition.workspace_id === fixture.request.workspace_id, `${fixture.fixture_id} cache workspace drifted`);
  assert(partition.my_chat_user_id === fixture.request.my_chat_user_id, `${fixture.fixture_id} cache actor drifted`);
  assert(partition.operation === fixture.operation, `${fixture.fixture_id} cache operation drifted`);
  assert(partition.contract_digest === digest, `${fixture.fixture_id} cache digest drifted`);
  assert(partition.resolution_ref === resolution.resolution_ref, `${fixture.fixture_id} resolution drifted`);
  assert(partition.scope_version === resolution.scope_version, `${fixture.fixture_id} scope version drifted`);
  assert(partition.presentation_version === response.presentation_version, `${fixture.fixture_id} presentation version drifted`);
  assert(Date.parse(partition.expires_at) > Date.parse(response.refreshed_at ?? "2026-08-14T01:00:00.000Z"), `${fixture.fixture_id} cache is not future-expiring`);
}

function assertFixtureSemantics(fixture) {
  const { request, response } = fixture;
  assert(isRecord(request) && isRecord(response), `${fixture.fixture_id} must use object request and response`);
  assert(request.interface_contract.digest === publishedDigest, `${fixture.fixture_id} request digest drifted`);
  assert(!collectKeys(request).some((key) => forbiddenCallerFields.has(key)), `${fixture.fixture_id} supplies caller authority`);
  assert(!collectKeys(response).some((key) => forbiddenResponseFields.has(key)), `${fixture.fixture_id} leaks owner/storage authority`);
  if (response.status === "masked" || response.status === "unavailable") {
    assert(response.context_ref === request.context_ref, `${fixture.fixture_id} boundary context drifted`);
    return;
  }
  if (fixture.operation === "summary_query") {
    assert(response.status === "ready", `${fixture.fixture_id} summary status is invalid`);
    const keys = new Set(collectKeys(response.segments));
    for (const forbidden of ["body", "message_ref", "media_ref", "receipt_ref", "member_ref"]) {
      assert(!keys.has(forbidden), `${fixture.fixture_id} summary leaks ${forbidden}`);
    }
    for (const segment of Object.values(response.segments)) {
      assert(segment.available || segment.unread_count === 0, `${fixture.fixture_id} exposes unread for an unavailable segment`);
    }
  }
  if (fixture.operation === "detail_query" && response.status === "ready") {
    assert(response.segment === request.segment, `${fixture.fixture_id} segment drifted`);
    assert(response.members.length <= 20 && response.messages.length <= request.page_size, `${fixture.fixture_id} exceeds bounds`);
    assert(new Set(response.members.map((item) => item.member_ref)).size === response.members.length, `${fixture.fixture_id} repeats a member ref`);
    assert(new Set(response.messages.map((item) => item.message_ref)).size === response.messages.length, `${fixture.fixture_id} repeats a message ref`);
    assert(response.page_info.has_more === false || typeof response.page_info.next_cursor === "string", `${fixture.fixture_id} omits next cursor`);
    for (const message of response.messages) {
      if (message.instruction_receipt) {
        assert(message.kind === "text" && message.sender_kind === "parent", `${fixture.fixture_id} infers a non-parent receipt`);
      }
      if (message.sender_kind === "system" || message.sender_kind === "agent") {
        assert(message.delivery_state === "not_applicable", `${fixture.fixture_id} gives system/agent a human delivery state`);
      }
    }
  }
  if (fixture.operation === "media_access_query" && response.status === "ready") {
    assert(response.presentation_version === request.presentation_version, `${fixture.fixture_id} media presentation drifted`);
    assert(response.message_ref === request.message_ref && response.media_ref === request.media_ref, `${fixture.fixture_id} media binding drifted`);
    assert(response.stream_path.startsWith("/internal/nurture/parent-communication-owner/v1/media/"), `${fixture.fixture_id} media path is not owner-relative`);
    assert(Date.parse(response.expires_at) - Date.parse("2026-08-14T01:00:00.000Z") <= 60_000, `${fixture.fixture_id} media TTL exceeds 60 seconds`);
  }
  if (fixture.operation === "send_text_exchange") {
    if (request.kind === "prepare") {
      assert(response.status === "ready_to_confirm", `${fixture.fixture_id} prepare status is invalid`);
      assert(response.command_request_id === request.command_request_id, `${fixture.fixture_id} prepare command drifted`);
      assert(response.segment === request.segment && response.presentation_version === request.presentation_version, `${fixture.fixture_id} prepare scope drifted`);
      assert(response.preview.body === request.body, `${fixture.fixture_id} preview body was rewritten`);
      assert(response.prepared_preview_digest === canonicalDigest(response.preview), `${fixture.fixture_id} preview digest is invalid`);
    } else {
      assert(["committed", "not_committed", "outcome_unknown", "masked", "unavailable"].includes(response.status), `${fixture.fixture_id} confirm status is invalid`);
      if ("command_request_id" in response) {
        assert(response.command_request_id === request.command_request_id, `${fixture.fixture_id} confirm command drifted`);
      }
      if (response.status === "outcome_unknown") {
        assert(response.recovery === "reconcile_same_command", `${fixture.fixture_id} allows a fresh command after uncertainty`);
      }
    }
  }
  assertReadyBinding(fixture, publishedDigest);
}

const artifact = parseStrictJson(await readFile(artifactPath, "utf8"), path.basename(artifactPath));
const fixtures = parseStrictJson(await readFile(fixturesPath, "utf8"), path.basename(fixturesPath));
const digest = canonicalDigest(artifact);
assert(digest === publishedDigest, `published digest drifted: ${digest}`);
assert(artifact.interface?.key === "nurture.parent-communication-owner" && artifact.interface?.version === "1.0.0", "interface identity is invalid");
assert(fixtures.interface?.digest === digest, "fixture digest is not exact");
assert(JSON.stringify(Object.keys(artifact.operations).sort()) === JSON.stringify([...operations].sort()), "operation set is not closed");
assert(artifact.publication_posture?.default_off === true, "contract must remain default-off");
assert(artifact.command_semantics?.p0_scope === "text_only_teacher_segment", "P0 command scope drifted");
assert(artifact.command_semantics?.attachments.includes("outside P0"), "attachment exclusion is missing");
assert(artifact.media_policy?.maximum_access_ttl_seconds === 60, "media TTL is not 60 seconds");
assert(artifact.media_policy?.redirects === "forbidden", "media redirects are not forbidden");

const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
ajv.addSchema(artifact.contract_schema);
const validators = Object.fromEntries(operations.map((operation) => {
  const descriptor = artifact.operations[operation];
  const request = ajv.getSchema(descriptor.request_schema_ref);
  const response = ajv.getSchema(descriptor.response_schema_ref);
  assert(request && response, `${operation} schema did not compile`);
  return [operation, { request, response }];
}));

const covered = new Set();
for (const fixture of fixtures.fixtures) {
  assert(operations.includes(fixture.operation), `${fixture.fixture_id} has an unknown operation`);
  const validator = validators[fixture.operation];
  assert(validator.request(fixture.request), `${fixture.fixture_id} request rejected: ${ajv.errorsText(validator.request.errors)}`);
  assert(validator.response(fixture.response), `${fixture.fixture_id} response rejected: ${ajv.errorsText(validator.response.errors)}`);
  assertFixtureSemantics(fixture);
  covered.add(fixture.operation);
}
assert(covered.size === operations.length, "not every operation has a positive fixture");

const invalidCovered = new Set();
for (const fixture of fixtures.invalid_fixtures) {
  assert(operations.includes(fixture.operation), `${fixture.fixture_id} has an unknown operation`);
  assert(fixture.target === "request" || fixture.target === "response", `${fixture.fixture_id} target is invalid`);
  const validator = validators[fixture.operation][fixture.target];
  assert(!validator(fixture.value), `${fixture.fixture_id} unexpectedly passed ${schemaName(fixture.operation, fixture.target)} validation`);
  invalidCovered.add(fixture.operation);
}
assert(invalidCovered.size === operations.length, "not every operation has a negative fixture");

process.stdout.write(
  `[ok] parent-communication-owner contract=${artifact.interface.key}@${artifact.interface.version} digest=${digest} operations=${operations.length} fixtures=${fixtures.fixtures.length} invalid-fixtures=${fixtures.invalid_fixtures.length}\n`,
);
