#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath) =>
  fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
const readJson = (relativePath) => JSON.parse(read(relativePath));

/**
 * The exact artifact G3-0 froze as its input. Each G3 checkpoint adds only the
 * keys it implemented and rotates the artifact, so this stays recorded history:
 * the freeze document must keep citing it and the current artifact must never
 * regress below it.
 */
const frozenInputInterface = {
  key: "nurture.surface-contract",
  version: "1.8.0",
  digest:
    "sha256:4fe91e1314c89d09c4081001a61b93ff68392000f7725e8e21a8e7209341d47a",
};
const freezePath =
  "dev-docs/active/nurture-child-care-boards/06-g3-0-fact-contract-schema-freeze.md";
const t007FreezePath =
  "dev-docs/active/nurture-institution-surfaces/08-g4-0b-publication-policy-freeze.md";

const artifactPin = readJson(
  "packages/nurture-scenario/contracts/surfaces/v1/generated/surface-contract.artifact-pin.json",
);
assertEqual(
  artifactPin.interfaceContract?.key,
  frozenInputInterface.key,
  "surface artifact key",
);
assertTruthy(
  compareSemver(
    String(artifactPin.interfaceContract?.version),
    frozenInputInterface.version,
  ) >= 0,
  `current surface version must not regress below ${frozenInputInterface.version}`,
);

const capabilityRegistry = readJson(
  "packages/nurture-scenario/contracts/surfaces/v1/source/capabilities/capability-registry.json",
);
const directAction = findBy(
  capabilityRegistry.capabilities,
  "capabilityKey",
  "initiate_caregiver_direct_message",
  "T-005 direct capability",
);
assertEqual(directAction.capabilityVersion, "1.0.0", "T-005 capability version");
assertEqual(
  directAction.inputSchemaRef,
  "schema:nurture.initiate-caregiver-direct-message-input@1",
  "T-005 input schema",
);
assertEqual(
  directAction.resultSchemaRef,
  "schema:nurture.initiate-caregiver-direct-message-result@1",
  "T-005 result schema",
);
assertEqual(
  directAction.targetPolicy?.kind,
  "owner_option_required",
  "T-005 owner target policy",
);
assertDeepEqual(
  directAction.concurrencyPolicy?.headBindings?.map((entry) => entry.headKey),
  [
    "enrollment_lifecycle",
    "care_group_authority",
    "direct_message_grant",
    "direct_message_safety",
  ],
  "T-005 current-head bindings",
);

const directSchema = readJson(
  "packages/nurture-scenario/contracts/surfaces/v1/source/capabilities/contracts/initiate-caregiver-direct-message.schema.json",
);
assertDeepEqual(
  directSchema.$defs?.result?.required,
  ["messageRef", "receiptRef", "contentState"],
  "T-005 typed result fields",
);
assertEqual(
  directSchema.$defs?.result?.properties?.contentState?.const,
  "sent",
  "T-005 content state",
);
const prepareResult = readJson(
  "packages/nurture-scenario/contracts/surfaces/v1/source/invocation/prepare-action-result.schema.json",
);
assertDeepEqual(
  prepareResult.$defs?.safeFailure?.properties?.status?.enum,
  ["denied", "unavailable"],
  "safe prepare failure states",
);
assertDeepEqual(
  prepareResult.$defs?.safeFailure?.properties?.reasonCode?.enum,
  [
    "not_authorized",
    "target_unavailable",
    "dependency_no_go",
    "contract_mismatch",
  ],
  "safe prepare failure reasons",
);

const surfaceRegistry = readJson(
  "packages/nurture-scenario/contracts/surfaces/v1/source/surfaces/surface-registry.json",
);
const expectedSurfaces = {
  guardian_family_board: {
    version: "1.0.0",
    presenter: "present_guardian_family_board",
    modules: [
      "guardian_current_focus",
      "guardian_enrollment_activity",
      "institution_workflow_projection",
    ],
  },
  caregiver_teacher_board: {
    version: "1.0.0",
    presenter: "present_caregiver_teacher_board",
    modules: [
      "caregiver_child_today",
      "caregiver_family_care_work",
      "teacher_publish_queue",
    ],
  },
};
for (const [surfaceKey, expected] of Object.entries(expectedSurfaces)) {
  const surface = findBy(
    surfaceRegistry.surfaces,
    "surfaceKey",
    surfaceKey,
    `surface ${surfaceKey}`,
  );
  assertEqual(surface.surfaceVersion, expected.version, `${surfaceKey} version`);
  assertEqual(
    surface.presenterBinding,
    expected.presenter,
    `${surfaceKey} presenter`,
  );
  assertDeepEqual(
    surface.orderedContentKinds,
    expected.modules,
    `${surfaceKey} module order`,
  );
}

const visibility = readJson(
  "packages/nurture-scenario/contracts/surfaces/v1/source/interface/visibility-matrix.json",
);
const guardianVisibility = findBy(
  visibility.surfaces,
  "surfaceKey",
  "guardian_family_board",
  "Guardian visibility",
);
const caregiverVisibility = findBy(
  visibility.surfaces,
  "surfaceKey",
  "caregiver_teacher_board",
  "Caregiver visibility",
);
assertIncludes(
  guardianVisibility.read,
  "institution_workflow_projection",
  "Guardian Workflow projection read",
);
assertIncludes(
  caregiverVisibility.explicitlyDenied,
  "institution_workflow_projection",
  "Caregiver Workflow projection denial",
);

const dbContext = readJson("docs/context/db/schema.json");
const requiredFactTables = [
  "NurtureFamilyCharter",
  "NurtureFamilyCharterItem",
  "NurtureFocusCycle",
  "NurtureFocusGoal",
  "NurtureDailyCareLog",
  "NurtureTeacherAttentionItem",
  "NurtureMediaAssetRef",
  "NurtureChildMediaAttribution",
  "NurtureChildCareProcess",
  "NurtureCareGroup",
  "NurtureCareRoleAssignment",
  "NurtureEnrollment",
  "NurtureChildLinkGrant",
  "NurtureChildLinkReceipt",
  "NurtureCommandExecution",
];
const tableNames = new Set(dbContext.tables?.map((table) => table.name));
for (const tableName of requiredFactTables) {
  assertTruthy(tableNames.has(tableName), `landed fact table ${tableName}`);
}

/**
 * The legacy media/attribution unions G3-0 recorded as its baseline. They are
 * history: the frozen delta replaces them once through an evidence-backed
 * migration, so the check is that the freeze still records the baseline and
 * that no compatibility branch survived in the database.
 */
const retiredLegacyEnums = ["NurtureMediaAssetStatus", "NurtureMediaAttributionStatus"];
const dbEnumNames = new Set(dbContext.enums?.map((entry) => entry.name));
const frozenLifecycleEnums = {
  NurtureMediaAssetLifecycle: [
    "preparing",
    "ready",
    "unavailable",
    "discarded",
    "redacted",
  ],
  NurtureChildAttributionState: ["candidate", "confirmed", "rejected", "superseded"],
  NurturePublishProcessState: [
    "draft",
    "needs_review",
    "pending_release",
    "released",
    "cancelled",
  ],
  NurtureCareCaptureBatchState: ["collecting", "cut", "organized", "cancelled"],
  NurtureContentSafetyRoute: [
    "ordinary",
    "review_required",
    "direct_interaction_required",
  ],
};
for (const [enumName, expectedValues] of Object.entries(frozenLifecycleEnums)) {
  const enumEntry = findBy(dbContext.enums, "name", enumName, `DB enum ${enumName}`);
  assertDeepEqual(enumEntry.values, expectedValues, `${enumName} frozen delta`);
}
for (const enumName of retiredLegacyEnums) {
  assertEqual(
    dbEnumNames.has(enumName),
    false,
    `retired legacy enum ${enumName} left no compatibility branch`,
  );
}
assertIncludes(
  findBy(dbContext.enums, "name", "NurtureGrantDataClass", "grant data class").values,
  "child_growth_record",
  "frozen Grant data-class delta",
);
assertIncludes(
  findBy(
    dbContext.enums,
    "name",
    "NurtureChildLinkReceiptSourceType",
    "receipt source type",
  ).values,
  "publication_release",
  "frozen Receipt source-type delta",
);

// The additive T-006 fact models the freeze enumerates must all exist.
for (const tableName of [
  "NurtureFocusGoalChildScope",
  "NurtureCareCapture",
  "NurtureCareCaptureBatch",
  "NurturePublishProcess",
  "NurturePublishProcessRevision",
  "NurturePublishProcessTarget",
  "NurturePublishEditHold",
  "NurtureContentSafetyAssessment",
  "NurturePublicationRelease",
  "NurturePublicationVisibilityEvent",
]) {
  assertTruthy(tableNames.has(tableName), `additive G3 fact table ${tableName}`);
}

// The content-safety marker amendment: the input fact must exist on both source
// tables and must stay nullable, because "never derived" and "derived, none
// found" are different facts and only the first may fail closed.
for (const tableName of ["NurtureCareCapture", "NurtureMediaAssetRef"]) {
  const table = findBy(dbContext.tables, "name", tableName, `safety marker table ${tableName}`);
  const column = findBy(
    table.columns,
    "name",
    "safetyMarkersPayload",
    `${tableName}.safetyMarkersPayload`,
  );
  assertEqual(column.nullable, true, `${tableName}.safetyMarkersPayload stays nullable`);
}

// The one-time migration must keep its ambiguity gate rather than guessing.
const g3Migration = read(
  "prisma/migrations/20260802120000_g3_publish_process_and_media_lifecycle/migration.sql",
);
for (const requiredText of [
  "g3 media lifecycle migration gate",
  "g3 attribution state migration gate",
  "RAISE EXCEPTION",
]) {
  assertTextIncludes(g3Migration, requiredText, `migration gate ${requiredText}`);
}

// The adoption set reserves semantic identities; a key may only appear in the
// registry once its checkpoint actually implemented it, and every new key
// starts at 1.0.0.
const adoptedInG3A = [
  "query_guardian_family_board",
  "query_guardian_current_focus",
  "query_guardian_enrollment_activity",
  "query_caregiver_teacher_board",
  "query_caregiver_child_today",
  "update_guardian_current_focus",
  "record_caregiver_daily_care",
];
const adoptedInG3B1 = [
  "query_teacher_publish_queue",
  "organize_care_capture_batch",
  "save_publish_process_draft",
  "acquire_publish_edit_hold",
  "renew_publish_edit_hold",
  "release_publish_edit_hold",
  "cancel_publish_process",
];
const adoptedInG3C1 = [
  "confirm_child_media_attribution",
  "reject_child_media_attribution",
  "supersede_child_media_attribution",
];
const adoptedInG3D = [
  "release_publish_process",
  "reschedule_publish_process",
  "correct_publication",
  "remove_publication_target_visibility",
  "redact_publication",
  "detach_publish_process_media",
  "discard_media_asset",
];
/**
 * G3-D closed the adoption set: every reserved identity is now implemented and
 * registered. The list stays so a future freeze amendment that reserves a new
 * identity has somewhere to declare it before its checkpoint lands.
 */
const stillUnimplementedCapabilities = [];
const registeredVersions = new Map(
  capabilityRegistry.capabilities.map((capability) => [
    capability.capabilityKey,
    capability.capabilityVersion,
  ]),
);
for (const capabilityKey of adoptedInG3A) {
  assertEqual(
    registeredVersions.get(capabilityKey),
    "1.0.0",
    `G3-A adopted capability ${capabilityKey}`,
  );
}
for (const capabilityKey of adoptedInG3B1) {
  assertEqual(
    registeredVersions.get(capabilityKey),
    "1.0.0",
    `G3-B1 adopted capability ${capabilityKey}`,
  );
}
for (const capabilityKey of adoptedInG3C1) {
  assertEqual(
    registeredVersions.get(capabilityKey),
    "1.0.0",
    `G3-C1 adopted capability ${capabilityKey}`,
  );
}
for (const capabilityKey of adoptedInG3D) {
  assertEqual(
    registeredVersions.get(capabilityKey),
    "1.0.0",
    `G3-D adopted capability ${capabilityKey}`,
  );
}
// G3-C2 stays default-off: no biometric capability identity may exist at all.
for (const capability of capabilityRegistry.capabilities) {
  assertEqual(
    /face_match|biometric/.test(capability.capabilityKey),
    false,
    `G3-C2 matcher capability absent (${capability.capabilityKey})`,
  );
}
for (const capabilityKey of stillUnimplementedCapabilities) {
  assertEqual(
    registeredVersions.has(capabilityKey),
    false,
    `unimplemented capability placeholder ${capabilityKey}`,
  );
}

const prismaSchema = read("prisma/schema.prisma");
for (const forbiddenName of [
  "NurtureBoardChildState",
  "NurtureG3MediaAsset",
  "NurtureG3MediaAttribution",
]) {
  assertEqual(
    prismaSchema.includes(forbiddenName),
    false,
    `forbidden duplicate model ${forbiddenName}`,
  );
}

const freeze = read(freezePath);

/**
 * Every capability identity the freeze reserves must be accounted for: either a
 * checkpoint already registered it at `1.0.0`, or it is explicitly still
 * unimplemented. This is what keeps the adoption set from quietly acquiring a
 * key nobody tracks, or losing one the product mapping needs.
 */
const adoptionSet = freeze.slice(
  freeze.indexOf("## Capability Adoption Set"),
  freeze.indexOf("## DB SSOT Delta"),
);
assertTruthy(adoptionSet.length > 0, "adoption set section present");
const reservedKeys = [
  ...new Set(
    [...adoptionSet.matchAll(/`([a-z][a-z0-9_]*)`/g)].map((match) => match[1]),
  ),
].filter((key) => key.includes("_"));
assertTruthy(reservedKeys.length >= 18, "adoption set reserves capability keys");
const accountedFor = new Set([
  ...adoptedInG3A,
  ...adoptedInG3B1,
  ...adoptedInG3C1,
  ...adoptedInG3D,
  ...stillUnimplementedCapabilities,
  // Consumed directly from T-005 rather than adopted as a new T-006 identity.
  "initiate_caregiver_direct_message",
]);
for (const capabilityKey of reservedKeys) {
  assertEqual(
    accountedFor.has(capabilityKey),
    true,
    `reserved capability ${capabilityKey} is tracked as adopted or unimplemented`,
  );
}

for (const requiredText of [
  "G3_0_FREEZE_PASS",
  "query_guardian_family_board",
  "query_caregiver_teacher_board",
  "query_caregiver_family_care_work",
  "T-003 design module",
  "NurtureFocusGoalChildScope",
  "NurturePublicationRelease",
  "Caregiver Workflow projection: excluded",
  "G3-B2 AI copy | optional, absent initially",
  "G3-C2 `ClassScopedFaceMatch` | optional/default-off",
  "T006-AC-010",
  "Amendment 2026-08-02 — media lifecycle identities",
  "legacy `active/hidden/deleted` must be migrated once with an evidence-backed",
  "detach_publish_process_media",
  "discard_media_asset",
]) {
  assertTextIncludes(freeze, requiredText, `G3-0 freeze ${requiredText}`);
}

const t007Freeze = read(t007FreezePath);
for (const requiredText of [
  "nurture.institution-publication-policy@1.0.0",
  "timeZone: IANA time-zone identifier",
  "defaultReleaseLocalTime = 17:00",
  "retryCutoffLocalTime = 19:00",
  "organizeIdleSeconds = 600",
  "organizeFallbackLeadSeconds = 1800",
  "automaticQuiescenceSeconds = 60",
  "captureActivityLeaseSeconds = 60",
  "Implementation: pending",
  "Provider/consumer qualification: pending",
]) {
  assertTextIncludes(t007Freeze, requiredText, `T-007 policy ${requiredText}`);
}

for (const identityPart of [
  frozenInputInterface.version,
  frozenInputInterface.digest,
]) {
  assertTextIncludes(freeze, identityPart, `G3-0 frozen input ${identityPart}`);
}

process.stdout.write(
  `[ok] G3-0 freeze facts=${requiredFactTables.length} surfaces=2 ` +
    `input=${frozenInputInterface.version} current=${artifactPin.interfaceContract.version} ` +
    `g3a-adopted=${adoptedInG3A.length} g3b1-adopted=${adoptedInG3B1.length} ` +
    `g3c1-adopted=${adoptedInG3C1.length} g3d-adopted=${adoptedInG3D.length} ` +
    "schema_delta=landed legacy_enums=retired migration_gate=fail_closed " +
    "safety_markers=nullable " +
    "c2-matcher=absent " +
    `reserved-keys=${reservedKeys.length} ` +
    "t005=exact t007=contract-frozen " +
    "caregiver_workflow_denied=true placeholders=absent stage_gates=explicit\n",
);

function findBy(values, key, expected, label) {
  const matches = (values ?? []).filter((value) => value?.[key] === expected);
  assertEqual(matches.length, 1, `${label} unique match`);
  return matches[0];
}

function assertTruthy(value, label) {
  if (!value) throw new Error(`${label}: expected a truthy value`);
}

function assertIncludes(values, expected, label) {
  if (!values?.includes(expected)) {
    throw new Error(`${label}: missing ${JSON.stringify(expected)}`);
  }
}

function assertTextIncludes(content, expected, label) {
  if (!content.includes(expected)) {
    throw new Error(`${label}: missing ${JSON.stringify(expected)}`);
  }
}

function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(
      `${label}: expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`,
    );
  }
}

function assertDeepEqual(actual, expected, label) {
  const actualJson = JSON.stringify(canonicalize(actual));
  const expectedJson = JSON.stringify(canonicalize(expected));
  if (actualJson !== expectedJson) {
    throw new Error(
      `${label}: expected ${expectedJson}, received ${actualJson}`,
    );
  }
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, child]) => [key, canonicalize(child)]),
    );
  }
  return value;
}

function compareSemver(left, right) {
  const parse = (value) => String(value).split(".").map((part) => Number(part));
  const [leftParts, rightParts] = [parse(left), parse(right)];
  for (let index = 0; index < 3; index += 1) {
    const difference = (leftParts[index] ?? 0) - (rightParts[index] ?? 0);
    if (difference !== 0) return difference > 0 ? 1 : -1;
  }
  return 0;
}
