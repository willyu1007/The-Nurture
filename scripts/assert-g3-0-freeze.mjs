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

const expectedLegacyEnums = {
  NurtureMediaAssetStatus: ["active", "hidden", "deleted"],
  NurtureMediaAttributionStatus: [
    "candidate",
    "confirmed",
    "rejected",
    "corrected",
    "hidden",
    "deleted",
  ],
};
for (const [enumName, expectedValues] of Object.entries(expectedLegacyEnums)) {
  const enumEntry = findBy(dbContext.enums, "name", enumName, `DB enum ${enumName}`);
  assertDeepEqual(enumEntry.values, expectedValues, `${enumName} G3-0 baseline`);
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
const stillUnimplementedCapabilities = [
  // Needs a T-007-resolved schedule window before it can validate anything.
  "reschedule_publish_process",
  "confirm_child_media_attribution",
  "reject_child_media_attribution",
  "supersede_child_media_attribution",
  "release_publish_process",
  "correct_publication",
  "remove_publication_target_visibility",
  "redact_publication",
];
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
    "t005=exact t007=contract-frozen schema_delta=frozen " +
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
