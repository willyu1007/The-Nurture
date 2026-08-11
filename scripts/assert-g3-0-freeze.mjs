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
  "dev-docs/archive/nurture-child-care-boards/06-g3-0-fact-contract-schema-freeze.md";
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
    // guardian_current_focus was ceded to My-Chat cultivation in surface
    // contract 1.16.0 (T-009 D-T009-01).
    modules: [
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

/**
 * The two frozen invariants this guard never asserted.
 *
 * "Every typed module result binds contract, capability version, actor/scope,
 * snapshot ref and version, a stable semantic order and sourceHeads[]" and
 * "cursor identity binds contract/capability/actor/scope/snapshot/order/page
 * size" were checked nowhere: the guard read eleven files and neither of these.
 * Deleting `snapshot` and `sourceHeads` from the frozen schema left it green,
 * because the artifact would simply rotate and the semver floor was satisfied.
 */
const boardTypes = readJson(
  "packages/nurture-scenario/contracts/surfaces/v1/source/capabilities/contracts/board-types.schema.json",
);
assertDeepEqual(
  boardTypes.$defs?.moduleBinding?.required ?? [],
  ["contract", "capability", "actor", "snapshot", "order", "sourceHeads"],
  "frozen module-result binding",
);
assertDeepEqual(
  boardTypes.$defs?.moduleBinding?.properties?.snapshot?.required ?? [],
  ["snapshotRef", "snapshotVersion"],
  "frozen module snapshot binding",
);
assertDeepEqual(
  Object.keys(boardTypes.$defs?.sourceHead?.properties ?? {}).sort(),
  ["factVersion", "lifecycleHead", "sourceKind", "sourceRef", "visibilityHead"],
  "frozen source-head shape",
);

/**
 * Cursor identity, pinned against the runtime that issues it. The contract
 * schema describes the page info; the terms the cursor actually binds live in
 * `BoardCursorIdentityV1`, and a term dropped there would silently let a page
 * resume under a different contract, capability, actor, order or page size.
 */
const boardProjection = read("packages/nurture-scenario/src/harness/board-projection.ts");
const cursorIdentity = boardProjection.match(
  /export type BoardCursorIdentityV1 = \{([\s\S]*?)\n\};/,
);
assertTruthy(cursorIdentity, "cursor identity type");
assertDeepEqual(
  [...cursorIdentity[1].matchAll(/^\s{2}([a-z_]+):/gm)].map((match) => match[1]).sort(),
  [
    "capability_key",
    "capability_version",
    "contract_digest",
    "order",
    "page_size",
    "query_key",
    "scope_ref",
  ],
  "frozen cursor identity terms",
);
// A cursor that merely encodes its binding publishes the position it carries;
// the child's process id and safe label travel in the sort key.
assertTextIncludes(boardProjection, "aes-256-gcm", "cursor payload is sealed, not just signed");

const dbContext = readJson("docs/context/db/schema.json");
const requiredFactTables = [
  "NurtureFamilyCharter",
  "NurtureFamilyCharterItem",
  // T-009 provider outbox + receipt store: outbound contract events and
  // consumed admission receipts, never board rows (D-T009-07).
  "NurtureFamilyGrowthAdmissionReceipt",
  "NurtureFamilyGrowthOutboxEvent",
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
 * The exact persisted table set.
 *
 * "The board envelope is a derived result and is never persisted as a unified
 * child-state row" used to be checked as the absence of three specific model
 * names. Any other name — `NurtureChildBoardSnapshot`, say — passed. An
 * allow-list census can never object to a new table, so the freeze's sharpest
 * structural claim rested on guessing what someone would call it.
 *
 * Pinning the whole set turns that into a real gate: a new persisted table is a
 * deliberate declaration here, reviewed against this claim, rather than a
 * silent addition.
 *
 * 2026-08-08 — the C30 cross-repository landing adds ten tables, declared here
 * after review against the claim above. None is a board envelope or a unified
 * child-state row: eight `NurtureC30*` tables cover canonical-action operation
 * state, its outbox and three audit trails, pair-operation state and protected
 * content; `NurtureParticipantPrincipalBinding` is an identity binding; and
 * `NurtureScenarioInvocationNonce` is a replay-prevention nonce store. The C30
 * branch never updated this census, so the gate had been failing on that branch
 * — its own qualification ran typecheck, lint, unit, routing, persistence, N1
 * and X4 but not this one.
 *
 * 2026-08-09 — T-007 G4-B increment 12 adds
 * `NurtureAttendanceCloseoutPolicy`. It is 0D-1's exact-class, versioned
 * checkpoint owner policy; the signal and board projections remain unstored.
 *
 * 2026-08-09 — T-007 G4-C declares `NurtureContentRevision` and
 * `NurtureAttributionCorrectionCandidate`: append-only owner/audit facts, not
 * board snapshots. G4-D increment 2 declares the private
 * `NurtureInstitutionWorkflow`, inquiry, touchpoint and transition carriers.
 * The public Workflow projection remains request-composed and unstored.
 */
const expectedTableCensus = [
  "NurtureActivityComparisonDraft",
  "NurtureActivityOption",
  "NurtureActivityPlacement",
  "NurtureAttendanceCloseoutPolicy",
  "NurtureAttendanceEntry",
  "NurtureAttendanceInferenceRun",
  "NurtureAttributionCorrectionCandidate",
  "NurtureC30ActionAuditRecord",
  "NurtureC30ActionOperation",
  "NurtureC30ActionOutboxEvent",
  "NurtureC30AuditRecord",
  "NurtureC30OutboxEvent",
  "NurtureC30PairOperation",
  "NurtureC30ProtectedContent",
  "NurtureC30ProtectedContentAuditRecord",
  "NurtureCareCapture",
  "NurtureCareCaptureBatch",
  "NurtureCareGroup",
  "NurtureCareInstitution",
  "NurtureCareRoleAssignment",
  "NurtureChild",
  "NurtureChildAnchorAssociation",
  "NurtureChildBindingAnchor",
  "NurtureChildCareProcess",
  "NurtureChildLinkGrant",
  "NurtureChildLinkReceipt",
  "NurtureChildMediaAttribution",
  "NurtureChildProfileSnapshot",
  "NurtureClassScheduleDayOverride",
  "NurtureClassScheduleTemplate",
  "NurtureCommandExecution",
  "NurtureContentRevision",
  "NurtureContentSafetyAssessment",
  "NurtureContextMaterial",
  "NurtureDailyAttendanceSubmission",
  "NurtureDailyCareLog",
  "NurtureEnrollment",
  "NurtureEnrollmentFormalProposal",
  "NurtureEnrollmentInquiry",
  "NurtureEnrollmentTouchpoint",
  "NurtureEnrollmentTrialOffer",
  "NurtureEnrollmentTrialReservation",
  "NurtureEnrollmentWaitlistEntry",
  "NurtureEnrollmentWaitlistOverride",
  "NurtureEnrollmentWaitlistPolicy",
  "NurtureEvidence",
  "NurtureEvidenceRef",
  "NurtureFamily",
  "NurtureFamilyAnchorAssociation",
  "NurtureFamilyBindingAnchor",
  "NurtureFamilyCareCascadeAudit",
  "NurtureFamilyCareItem",
  "NurtureFamilyCareItemEvent",
  "NurtureFamilyCareMessage",
  "NurtureFamilyCareMessageCorrection",
  "NurtureFamilyCareThread",
  "NurtureFamilyCareThreadParticipant",
  "NurtureFamilyCharter",
  "NurtureFamilyCharterItem",
  "NurtureFamilyGrowthAdmissionReceipt",
  "NurtureFamilyGrowthOutboxEvent",
  "NurtureFamilyPolicy",
  "NurtureFamilyProfileSnapshot",
  "NurtureFamilyQuantificationSnapshot",
  "NurtureFocusCycle",
  "NurtureFocusGoal",
  "NurtureFocusGoalChildScope",
  "NurtureHealthStateSummary",
  "NurtureInstitutionKnowledgeAuthorityLink",
  "NurtureInstitutionKnowledgeConflictReviewCandidate",
  "NurtureInstitutionKnowledgeItem",
  "NurtureInstitutionKnowledgePreparedCommand",
  "NurtureInstitutionKnowledgeRevision",
  "NurtureInstitutionKnowledgeRevisionEvent",
  "NurtureInstitutionPublicationPolicy",
  "NurtureInstitutionSupportSignalPolicy",
  "NurtureInstitutionWorkflow",
  "NurtureInstitutionWorkflowTransition",
  "NurtureInteractionContext",
  "NurtureMediaAssetRef",
  "NurtureMetricDefinition",
  "NurtureMetricObservation",
  "NurtureParticipant",
  "NurtureParticipantPrincipalBinding",
  "NurtureProfileProjection",
  "NurturePublicationRelease",
  "NurturePublicationVisibilityEvent",
  "NurturePublishEditHold",
  "NurturePublishProcess",
  "NurturePublishProcessRevision",
  "NurturePublishProcessTarget",
  "NurtureRuntimeContextPack",
  "NurtureScenarioBindingAuthorization",
  "NurtureScenarioInvocationNonce",
  "NurtureTeacherAttentionItem",
  "NurtureWorkflowCapture",
  "NurtureWorkflowCheckpoint",
  "NurtureWorkflowProject",
  "NurtureWorkflowReview"
];
assertDeepEqual(
  [...tableNames].sort(),
  expectedTableCensus,
  "persisted table census (a new table must be declared against the no-board-row claim)",
);

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

// The command-identity amendment: the write lane cannot record a command
// without these, and each was missing in a way that made a check impossible
// rather than merely inconvenient.
const assessmentTable = findBy(
  dbContext.tables,
  "name",
  "NurtureContentSafetyAssessment",
  "content safety assessment table",
);
assertEqual(
  findBy(assessmentTable.columns, "name", "publishProcessId", "assessment process link").nullable,
  true,
  "the restricted route creates no process, so its assessment must not require one",
);
for (const columnName of ["careGroupId", "organizerInputRevision"]) {
  assertEqual(
    findBy(assessmentTable.columns, "name", columnName, `assessment ${columnName}`).nullable,
    false,
    `assessment stays anchored by ${columnName} whichever route it took`,
  );
}
assertTruthy(
  findBy(
    findBy(dbContext.tables, "name", "NurturePublishProcessRevision", "publish revision table")
      .columns,
    "name",
    "commandRequestIdHash",
    "publish revision command identity",
  ),
  "a draft revision names the command that produced it",
);
assertTruthy(
  findBy(
    findBy(dbContext.tables, "name", "NurturePublicationVisibilityEvent", "visibility event table")
      .columns,
    "name",
    "commandExecutionId",
    "visibility event command identity",
  ),
  "the visibility lineage names the command behind it",
);
for (const columnName of ["schedulePolicyVersion", "scheduleResolvedAt"]) {
  assertTruthy(
    findBy(
      findBy(dbContext.tables, "name", "NurturePublishProcess", "publish process table").columns,
      "name",
      columnName,
      `publish process ${columnName}`,
    ),
    `the resolved window freezes ${columnName} instead of borrowing a column a reschedule moves`,
  );
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
//
// This used to require three strings that all lived inside the RAISE EXCEPTION
// *message*, so changing `IF ambiguous > 0 THEN` to `IF false THEN` — disabling
// the gate entirely — left the guard green. What has to be pinned is the
// conditional and the census it reads, which is what actually fails closed.
const g3Migration = read(
  "prisma/migrations/20260802120000_g3_publish_process_and_media_lifecycle/migration.sql",
);
const gateBlocks = [...g3Migration.matchAll(/DO \$\$?([\s\S]*?)END \$\$?;/g)].map(
  (match) => match[1],
);
assertEqual(gateBlocks.length, 2, "one-time migration keeps both ambiguity gates");
for (const [index, block] of gateBlocks.entries()) {
  const declared = block.match(/DECLARE\s+([a-z_]+)\s+BIGINT/);
  assertTruthy(declared, `gate ${index} counts into a declared variable`);
  const counter = declared[1];
  assertTruthy(
    new RegExp(`SELECT\\s+count\\(\\*\\)\\s+INTO\\s+${counter}`, "i").test(block),
    `gate ${index} censuses the ambiguous rows into ${counter}`,
  );
  // The conditional must read the census. A constant, a negation or a different
  // variable would disable the gate while leaving the message in place.
  assertTruthy(
    new RegExp(`IF\\s+${counter}\\s*>\\s*0\\s+THEN`, "i").test(block),
    `gate ${index} aborts on a non-zero ${counter}, not on a constant`,
  );
  assertTruthy(/RAISE EXCEPTION/.test(block), `gate ${index} raises rather than continuing`);
}
for (const requiredText of [
  "g3 media lifecycle migration gate",
  "g3 attribution state migration gate",
]) {
  assertTextIncludes(g3Migration, requiredText, `migration gate ${requiredText}`);
}

// The adoption set reserves semantic identities; a key may only appear in the
// registry once its checkpoint actually implemented it, and every new key
// starts at 1.0.0.
// query/update_guardian_current_focus were adopted in G3-A and RETIRED in
// surface contract 1.16.0 (T-009 D-T009-01, cession to My-Chat cultivation).
const adoptedInG3A = [
  "query_guardian_family_board",
  "query_guardian_enrollment_activity",
  "query_caregiver_teacher_board",
  "query_caregiver_child_today",
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
/**
 * Reserved identities that no checkpoint has adopted yet. Empty today: every
 * key the freeze reserved is registered. The census below is what keeps that
 * true, so this list must stay a declaration rather than a habit — a key added
 * here is a claim that it is deliberately unregistered.
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
// The adoption declaration is the section body. Amendments follow it as
// appendices and restate any identity they add into the list above, so reading
// past them made the reserved-key count depend on prose — an amendment naming a
// column changed it, which the exact count caught.
const adoptionSetStart = freeze.indexOf("## Capability Adoption Set");
const firstAmendment = freeze.indexOf("### Amendment", adoptionSetStart);
const adoptionSet = freeze.slice(
  adoptionSetStart,
  firstAmendment === -1 ? freeze.indexOf("## DB SSOT Delta") : firstAmendment,
);
assertTruthy(adoptionSet.length > 0, "adoption set section present");
const reservedKeys = [
  ...new Set(
    [...adoptionSet.matchAll(/`([a-z][a-z0-9_]*)`/g)].map((match) => match[1]),
  ),
].filter((key) => key.includes("_"));
// Exact, not a floor: `>= 18` let the adoption set grow without anyone
// declaring it, which is the opposite of a closed set.
assertEqual(reservedKeys.length, 19, "adoption set reserves exactly its declared capability keys");
// Reserved by the G3-0 freeze, implemented in G3-A, then RETIRED in surface
// contract 1.16.0: the guardian current-focus pair was ceded to My-Chat
// cultivation (T-009 D-T009-01). The identities stay reserved so no future
// capability can silently reuse them.
const retiredInSurface1160 = [
  "query_guardian_current_focus",
  "update_guardian_current_focus",
];
const accountedFor = new Set([
  ...adoptedInG3A,
  ...retiredInSurface1160,
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
  "Implementation candidate: ready; database qualification pending",
  "Provider/consumer qualification: pending database-backed execution",
]) {
  assertTextIncludes(t007Freeze, requiredText, `T-007 policy ${requiredText}`);
}

// The frozen input identity was checked only by appearing as text in this
// document. Its digest is history — the current artifact has rotated past it —
// so nothing here can compare it to a live artifact. What can be checked is
// that the guard which DOES prove it against artifact evidence still pins the
// same value: `assert-g2-exit-contract.mjs` holds `sharedCoreHash` and every
// T-005 slice hash byte-identical since this digest.
const g2ExitGuard = read("scripts/assert-g2-exit-contract.mjs");
assertTextIncludes(
  g2ExitGuard,
  frozenInputInterface.digest,
  "G3-0 frozen input digest still pinned by the G2 Exit contract guard",
);
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
