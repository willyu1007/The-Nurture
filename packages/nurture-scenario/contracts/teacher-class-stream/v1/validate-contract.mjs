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
const artifactPath = path.join(directory, "teacher-class-stream.owner-contract.json");
const fixturesPath = path.join(directory, "conformance-fixtures.json");
const publishedDigest =
  "sha256:00a8494544e9b2ba6045f79da196b1003e2744f905399aab86bb5efdb9be5df3";

const operations = [
  "class_context_query",
  "child_strip_query",
  "child_day_detail_query",
  "schedule_query",
];
const rows = ["T-S03", "T-F01", "T-H01", "T-F03", "T-F04", "T-F06", "T-F07"];
const detailSectionOrder = [
  "arrival",
  "daily_care",
  "family_instructions",
  "observations",
  "focus_link",
];
const negativeScenarios = [
  "not_authorized_admin",
  "not_authorized_other_class",
  "not_authorized_guardian",
  "revoked_mid_window",
  "stale_context_ref",
  "cross_scope_class_ref",
  "cross_class_child_ref",
  "invalid_local_date",
  "disabled_gate",
  "service_auth_missing",
  "forbidden_request_field",
  "hidden_payload_rejected",
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
  "care_group_id",
  "enrollment_id",
  "grant_id",
  "storage_ref",
  "signed_url",
  "url",
]);

const assert = (condition, message) => {
  if (!condition) throw new Error(`Teacher class-stream conformance: ${message}`);
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

// Request-scoped consistency between the caller identity and every envelope
// the ready response carries.
const validateReadyBinding = (fixture) => {
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
  if (operation === "class_context_query") {
    assert(resolution.scope_kind === "participant", `${id} scope kind drifted`);
    const currentClasses = response.classes.filter((entry) => entry.current);
    assert(currentClasses.length === 1, `${id} must mark exactly one current class`);
    const classRefs = new Set(response.classes.map((entry) => entry.class_ref));
    assert(
      classRefs.size === response.classes.length,
      `${id} duplicated a class_ref`,
    );
    assert(
      classRefs.has(response.day_header.class_ref)
        && response.day_header.class_ref === currentClasses[0].class_ref,
      `${id} day header is not the current class`,
    );
    assert(
      response.day_header.local_date === request.local_date,
      `${id} day header date drifted`,
    );
  } else {
    assert(resolution.scope_kind === "care_group", `${id} scope kind drifted`);
    assert(
      resolution.scope_ref === request.class_ref,
      `${id} scope_ref is not the requested class`,
    );
  }
  if (operation === "child_strip_query") {
    for (const card of response.children) {
      assert(
        card.attention.count === 0
          ? card.attention.highest_priority === "none"
          : card.attention.highest_priority !== "none",
        `${id} attention priority contradicts its count`,
      );
    }
    const childRefs = new Set(response.children.map((card) => card.child_ref));
    assert(
      childRefs.size === response.children.length,
      `${id} duplicated a child_ref`,
    );
  }
  if (operation === "child_day_detail_query") {
    assert(
      response.child_ref === request.child_ref
        && response.local_date === request.local_date,
      `${id} detail identity drifted`,
    );
    assert(
      response.sections.map((section) => section.section_key).join("|")
        === detailSectionOrder.join("|"),
      `${id} sections are not the five ordered keys`,
    );
    for (const section of response.sections) {
      if (section.status !== "ready") continue;
      assert(
        section.generated_at !== undefined && section.source_head !== undefined,
        `${id} ready section ${section.section_key} lacks freshness`,
      );
      if (
        section.section_key === "daily_care"
        || section.section_key === "family_instructions"
        || section.section_key === "observations"
      ) {
        assert(
          Array.isArray(section.entries) && section.entries.length > 0,
          `${id} ready list section ${section.section_key} must carry entries`,
        );
        const refField = section.section_key === "daily_care"
          ? "log_ref"
          : section.section_key === "family_instructions"
            ? "instruction_ref"
            : "observation_ref";
        assert(
          section.entries.every((entry) => typeof entry[refField] === "string"),
          `${id} ${section.section_key} entries are not kind-matched`,
        );
      }
      if (section.section_key === "arrival") {
        assert(
          section.arrival_state !== undefined,
          `${id} ready arrival section lacks arrival_state`,
        );
      }
      if (section.section_key === "focus_link") {
        assert(
          section.focus_ref !== undefined && section.focus_label !== undefined,
          `${id} ready focus section lacks its link`,
        );
      }
    }
  }
  if (operation === "schedule_query") {
    assert(
      response.local_date === request.local_date,
      `${id} schedule date drifted`,
    );
    const currentSlots = response.slots.filter((slot) => slot.current);
    assert(currentSlots.length <= 1, `${id} marked more than one current slot`);
    for (const slot of response.slots) {
      assert(slot.starts_at < slot.ends_at, `${id} slot ${slot.slot_ref} time order broke`);
    }
    if (response.resolution === "none") {
      assert(
        response.slots.length === 0 && response.schedule_version_head === 0,
        `${id} resolution none must be empty`,
      );
    } else {
      assert(
        response.schedule_version_head >= 1,
        `${id} resolved schedule needs a version head`,
      );
    }
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
  validateReadyBinding(fixture);
};

const artifact = await readStrictJson(artifactPath);
const fixtures = await readStrictJson(fixturesPath);
const computedDigest = digestOf(artifact);
assert(computedDigest === publishedDigest, `digest mismatch; computed ${computedDigest}`);
assert(
  artifact.interface?.key === "nurture.teacher-class-stream-presenter"
    && artifact.interface.version === "1.0.0"
    && artifact.interface.kind === "private_owner_presenter",
  "interface identity drifted",
);
assert(
  artifact.publication_posture?.default_off === true
    && artifact.mobile_posture?.mode === "read_only"
    && artifact.mobile_posture?.write_paths === "none_in_this_contract",
  "default-off or read-only posture drifted",
);
assert(
  artifact.operation_order.join("|") === operations.join("|"),
  "operation order drifted",
);
for (const operation of operations) {
  assert(
    typeof artifact.transport.paths[operation] === "string"
      && artifact.transport.paths[operation].startsWith(
        "/internal/nurture/teacher-class-stream/v1/",
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
const readyOperations = new Set();
let maskedCount = 0;
let unavailableCount = 0;
for (const fixture of fixtures.fixtures) {
  assert(!fixtureIds.has(fixture.fixture_id), `duplicate ${fixture.fixture_id}`);
  fixtureIds.add(fixture.fixture_id);
  validateFixture(fixture, validators);
  if (fixture.response.status === "ready") readyOperations.add(fixture.operation);
  if (fixture.response.status === "masked") maskedCount += 1;
  if (fixture.response.status === "unavailable") unavailableCount += 1;
}
assert(
  operations.every((operation) => readyOperations.has(operation)),
  "every operation needs at least one ready fixture",
);
assert(maskedCount >= 1 && unavailableCount >= 2, "failure coverage is incomplete");

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
  `teacher-class-stream contract OK: digest ${publishedDigest}, `
    + `${fixtures.fixtures.length} fixtures, `
    + `${fixtures.invalid_fixtures.length} invalid probes`,
);
