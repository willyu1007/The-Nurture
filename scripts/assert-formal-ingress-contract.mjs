import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { parseYaml } from "../.ai/scripts/lib/yaml-lite.mjs";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const read = (relativePath) =>
  fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

const healthPath = "/health";
const ownerPath = "/internal/nurture/scenario-binding/authorize";
const harnessPreparePath = "/internal/nurture/harness/prepare-action";
const harnessExecutePath = "/internal/nurture/harness/execute-action";
const harnessQueryPath = "/internal/nurture/harness/query";
const harnessReadResultPath = "/internal/nurture/harness/read-result";
const institutionBusinessCommunicationReadPath =
  "/internal/nurture/institution/business-communications:read";
const familySharingPrivatePath =
  "/internal/nurture/family-sharing/invoke";
const teacherReleaseOwnerPaths = {
  TEACHER_RELEASE_OWNER_QUERY_PATH:
    "/internal/nurture/teacher-release-owner/v3/query",
  TEACHER_RELEASE_OWNER_TARGETS_PATH:
    "/internal/nurture/teacher-release-owner/v3/targets",
  TEACHER_RELEASE_OWNER_PREPARE_PATH:
    "/internal/nurture/teacher-release-owner/v3/prepare",
  TEACHER_RELEASE_OWNER_CONFIRM_PATH:
    "/internal/nurture/teacher-release-owner/v3/confirm",
};
const parentContextPresenterPaths = {
  PARENT_CONTEXT_PRESENTER_DAY_PATH:
    "/internal/nurture/parent-context-presenter/v1/day",
  PARENT_CONTEXT_PRESENTER_DAILY_CARE_PATH:
    "/internal/nurture/parent-context-presenter/v1/daily-care",
  PARENT_CONTEXT_PRESENTER_ACTIVITY_DETAIL_PATH:
    "/internal/nurture/parent-context-presenter/v1/activity-detail",
  PARENT_CONTEXT_PRESENTER_NOTICES_PATH:
    "/internal/nurture/parent-context-presenter/v1/notices",
  PARENT_CONTEXT_PRESENTER_FRESHNESS_ATTENDANCE_PATH:
    "/internal/nurture/parent-context-presenter/v1/freshness-attendance",
};
const parentCommunicationOwnerPaths = {
  PARENT_COMMUNICATION_OWNER_SUMMARY_PATH:
    "/internal/nurture/parent-communication-owner/v1/summary",
  PARENT_COMMUNICATION_OWNER_DETAIL_PATH:
    "/internal/nurture/parent-communication-owner/v1/detail",
  PARENT_COMMUNICATION_OWNER_MEDIA_ACCESS_PATH:
    "/internal/nurture/parent-communication-owner/v1/media-access",
  PARENT_COMMUNICATION_OWNER_SEND_TEXT_PATH:
    "/internal/nurture/parent-communication-owner/v1/send-text",
};
const directorPresenterPaths = {
  DIRECTOR_PRESENTER_OVERVIEW_PATH:
    "/internal/nurture/director-presenter/v1/overview",
  DIRECTOR_PRESENTER_DRILLDOWN_PATH:
    "/internal/nurture/director-presenter/v1/drilldown",
  DIRECTOR_PRESENTER_MATERIALS_PATH:
    "/internal/nurture/director-presenter/v1/materials",
};
const expectedPaths = [
  healthPath,
  ownerPath,
  harnessPreparePath,
  harnessExecutePath,
  harnessQueryPath,
  harnessReadResultPath,
  institutionBusinessCommunicationReadPath,
];
const expectedControllerRoutes = [
  `apps/scenario-service/src/binding-owner.controller.ts:POST:SCENARIO_BINDING_OWNER_PATH`,
  'apps/scenario-service/src/family-growth-rendition.controller.ts:GET:`${FAMILY_GROWTH_RENDITION_MEDIA_PATH}/:lease`',
  `apps/scenario-service/src/family-growth-rendition.controller.ts:POST:FAMILY_GROWTH_RENDITION_RESOLVE_PATH`,
  `apps/scenario-service/src/family-sharing-private.controller.ts:POST:NURTURE_FAMILY_SHARING_PRIVATE_PATH`,
  `apps/scenario-service/src/harness.controller.ts:POST:HARNESS_EXECUTE_PATH`,
  `apps/scenario-service/src/harness.controller.ts:POST:HARNESS_PREPARE_PATH`,
  `apps/scenario-service/src/harness.controller.ts:POST:HARNESS_QUERY_PATH`,
  `apps/scenario-service/src/harness.controller.ts:POST:HARNESS_READ_RESULT_PATH`,
  `apps/scenario-service/src/harness.controller.ts:POST:INSTITUTION_BUSINESS_COMMUNICATION_READ_PATH`,
  `apps/scenario-service/src/health.controller.ts:GET:"/health"`,
  `apps/scenario-service/src/teacher-release-owner.controller.ts:POST:TEACHER_RELEASE_OWNER_CONFIRM_PATH`,
  `apps/scenario-service/src/teacher-release-owner.controller.ts:POST:TEACHER_RELEASE_OWNER_PREPARE_PATH`,
  `apps/scenario-service/src/teacher-release-owner.controller.ts:POST:TEACHER_RELEASE_OWNER_QUERY_PATH`,
  `apps/scenario-service/src/teacher-release-owner.controller.ts:POST:TEACHER_RELEASE_OWNER_TARGETS_PATH`,
  `apps/scenario-service/src/parent-context-presenter.controller.ts:POST:PARENT_CONTEXT_PRESENTER_ACTIVITY_DETAIL_PATH`,
  `apps/scenario-service/src/parent-context-presenter.controller.ts:POST:PARENT_CONTEXT_PRESENTER_DAILY_CARE_PATH`,
  `apps/scenario-service/src/parent-context-presenter.controller.ts:POST:PARENT_CONTEXT_PRESENTER_DAY_PATH`,
  `apps/scenario-service/src/parent-context-presenter.controller.ts:POST:PARENT_CONTEXT_PRESENTER_FRESHNESS_ATTENDANCE_PATH`,
  `apps/scenario-service/src/parent-context-presenter.controller.ts:POST:PARENT_CONTEXT_PRESENTER_NOTICES_PATH`,
  `apps/scenario-service/src/parent-communication-owner.controller.ts:POST:PARENT_COMMUNICATION_OWNER_DETAIL_PATH`,
  `apps/scenario-service/src/parent-communication-owner.controller.ts:POST:PARENT_COMMUNICATION_OWNER_MEDIA_ACCESS_PATH`,
  `apps/scenario-service/src/parent-communication-owner.controller.ts:POST:PARENT_COMMUNICATION_OWNER_SEND_TEXT_PATH`,
  `apps/scenario-service/src/parent-communication-owner.controller.ts:POST:PARENT_COMMUNICATION_OWNER_SUMMARY_PATH`,
  `apps/scenario-service/src/director-presenter.controller.ts:POST:DIRECTOR_PRESENTER_DRILLDOWN_PATH`,
  `apps/scenario-service/src/director-presenter.controller.ts:POST:DIRECTOR_PRESENTER_MATERIALS_PATH`,
  `apps/scenario-service/src/director-presenter.controller.ts:POST:DIRECTOR_PRESENTER_OVERVIEW_PATH`,
].sort();
const expectedRegisteredControllers = [
  "apps/scenario-service/src/health.controller.ts#HealthController",
  "apps/scenario-service/src/binding-owner.controller.ts#BindingOwnerController",
  "apps/scenario-service/src/harness.controller.ts#HarnessController",
  "apps/scenario-service/src/family-growth-rendition.controller.ts#FamilyGrowthRenditionController",
  "apps/scenario-service/src/teacher-release-owner.controller.ts#TeacherReleaseOwnerController",
  "apps/scenario-service/src/parent-context-presenter.controller.ts#ParentContextPresenterController",
  "apps/scenario-service/src/parent-communication-owner.controller.ts#ParentCommunicationOwnerController",
  "apps/scenario-service/src/director-presenter.controller.ts#DirectorPresenterController",
  "apps/scenario-service/src/family-sharing-private.controller.ts#FamilySharingPrivateController",
];
const expectedPrivateResponseControllers = [
  "apps/scenario-service/src/teacher-release-owner.controller.ts#TeacherReleaseOwnerController",
  "apps/scenario-service/src/parent-context-presenter.controller.ts#ParentContextPresenterController",
  "apps/scenario-service/src/parent-communication-owner.controller.ts#ParentCommunicationOwnerController",
  "apps/scenario-service/src/director-presenter.controller.ts#DirectorPresenterController",
  "apps/scenario-service/src/family-sharing-private.controller.ts#FamilySharingPrivateController",
].sort();
const expectedPrivateResponseFilterProviders = [
  "apps/scenario-service/src/private-response-exception.filter.ts#PrivateResponseExceptionFilter",
  "apps/scenario-service/src/safe-exception.filter.ts#SafeExceptionFilter",
].sort();
const nestRouteDecoratorNames = new Set([
  "Get",
  "Post",
  "Put",
  "Patch",
  "Delete",
  "Options",
  "Head",
  "All",
]);
const expectedHarnessSharedRequiredFields = [
  "workspace_id",
  "actor_participant_id",
  "surface",
  "capability_key",
  "capability_version",
];
const expectedHarnessExecuteRequiredFields = [
  ...expectedHarnessSharedRequiredFields,
  "invocation_request_id",
  "command_request_id",
  "confirmation_ref",
];
/**
 * The T-005 action keys, pinned as history: they were qualified at G2 Exit and
 * must never quietly leave the ingress.
 */
const expectedHarnessActionKeys = [
  "submit_family_care_question",
  "initiate_caregiver_direct_message",
  "acknowledge_family_care_item",
  "reply_family_care_item",
  "correct_family_care_message",
  "withdraw_family_care_request",
  "redact_family_care_message",
  "policy_redact_family_care_message",
];

/**
 * Capabilities that are registered in the surface contract but deliberately not
 * routed yet. One-off freezes stay explicit; cohesive default-off increments
 * are derived from their unique registry gate and qualified by their dedicated
 * exact-inventory suite. A capability in neither group fails this guard.
 */
const explicitlyUnroutedCapabilityKeys = [
  // Frozen by G4-0C-4 but not implemented: 0C is a freeze stage and I1 has not
  // opened, so this capability has a descriptor and no handler. It leaves this
  // list the moment it is routed, and this guard fails if it does not.
  "query_institution_communication_review",
];
const expectedOwnerRequiredFields = [
  "workspace_id",
  "acting_user_id",
  "idempotency_key",
  "subject_type",
  "subject_id",
  "scenario_key",
  "acting_actor_id",
  "purpose",
];
const expectedOwnerOptionalFields = [
  "represented_organization_id",
  "correlation_id",
  "trace_id",
];
const expectedInstitutionBusinessCommunicationReadFields = [
  "workspace_id",
  "actor_participant_id",
  "surface",
  "interface_contract",
  "target_option_ref",
];
const expectedInstitutionBusinessCommunicationInterface = {
  key: "nurture.institution-business-communication-owner-read",
  version: "1.0.0",
  digest: "sha256:dd1b63fe6c7975bafb4170aff3dccc92463dfaf3e5ea7e5bd3c80f1298d6c921",
};

assertArrayEqual(
  censusControllerRoutes(),
  expectedControllerRoutes,
  "scenario-service controller route census",
);
assertArrayEqual(
  censusRegisteredControllers(),
  expectedRegisteredControllers,
  "scenario-service Nest module controller registration",
);
assertArrayEqual(
  censusPrivateResponseFilterProviders(),
  expectedPrivateResponseFilterProviders,
  "scenario-service private response filter providers",
);
assertScenarioServiceBootstrapRegistration();

const openApi = parseYaml(read("docs/context/api/openapi.yaml"));
assertArrayEqual(
  Object.keys(openApi.paths ?? {}).sort(),
  [...expectedPaths].sort(),
  "OpenAPI formal path set",
);
assertTruthy(openApi.paths?.[healthPath]?.get, "OpenAPI health GET");
assertTruthy(openApi.paths?.[ownerPath]?.post, "OpenAPI owner POST");
assertArrayEqual(
  Object.keys(openApi.paths?.[healthPath] ?? {}).sort(),
  ["get"],
  "OpenAPI health operation set",
);
assertArrayEqual(
  Object.keys(openApi.paths?.[ownerPath] ?? {}).sort(),
  ["post"],
  "OpenAPI owner operation set",
);
assertArrayEqual(
  openApi.components?.schemas?.ScenarioBindingAuthorizeRequest?.required ?? [],
  expectedOwnerRequiredFields,
  "OpenAPI owner required fields",
);
assertArrayEqual(
  Object.keys(
    openApi.components?.schemas?.ScenarioBindingAuthorizeRequest?.properties ??
      {},
  ).sort(),
  [...expectedOwnerRequiredFields, ...expectedOwnerOptionalFields].sort(),
  "OpenAPI owner property set",
);

const healthSource = read("apps/scenario-service/src/health.controller.ts");
assertIncludes(healthSource, `@Get("${healthPath}")`, "health controller path");

const ownerTransportSource = read(
  "packages/nurture-scenario/src/adapters/binding-owner-http.ts",
);
assertIncludes(
  ownerTransportSource,
  `"${ownerPath}"`,
  "binding-owner transport path",
);
const ownerControllerSource = read(
  "apps/scenario-service/src/binding-owner.controller.ts",
);
assertIncludes(
  ownerControllerSource,
  "@Post(SCENARIO_BINDING_OWNER_PATH)",
  "binding-owner controller route",
);

for (const harnessPath of [
  harnessPreparePath,
  harnessExecutePath,
  harnessQueryPath,
  harnessReadResultPath,
]) {
  assertTruthy(openApi.paths?.[harnessPath]?.post, `OpenAPI harness POST ${harnessPath}`);
  assertArrayEqual(
    Object.keys(openApi.paths?.[harnessPath] ?? {}).sort(),
    ["post"],
    `OpenAPI harness operation set ${harnessPath}`,
  );
}
assertTruthy(
  openApi.paths?.[institutionBusinessCommunicationReadPath]?.post,
  "OpenAPI Institution business-communication owner-read POST",
);
assertArrayEqual(
  Object.keys(openApi.paths?.[institutionBusinessCommunicationReadPath] ?? {}).sort(),
  ["post"],
  "OpenAPI Institution business-communication owner-read operation set",
);
assertArrayEqual(
  openApi.components?.schemas?.InstitutionBusinessCommunicationReadRequest?.required ?? [],
  expectedInstitutionBusinessCommunicationReadFields,
  "OpenAPI Institution business-communication owner-read required fields",
);
const institutionInterfaceSchema =
  openApi.components?.schemas?.InstitutionBusinessCommunicationInterfaceContract?.properties ?? {};
assertArrayEqual(
  [
    institutionInterfaceSchema.key?.const,
    institutionInterfaceSchema.version?.const,
    institutionInterfaceSchema.digest?.const,
  ],
  [
    expectedInstitutionBusinessCommunicationInterface.key,
    expectedInstitutionBusinessCommunicationInterface.version,
    expectedInstitutionBusinessCommunicationInterface.digest,
  ],
  "OpenAPI Institution business-communication exact interface pin",
);
assertArrayEqual(
  openApi.components?.schemas?.HarnessPrepareRequest?.required ?? [],
  expectedHarnessSharedRequiredFields,
  "OpenAPI harness prepare required fields",
);
assertArrayEqual(
  openApi.components?.schemas?.HarnessExecuteRequest?.required ?? [],
  expectedHarnessExecuteRequiredFields,
  "OpenAPI harness execute required fields",
);
const harnessTransportSource = read(
  "apps/scenario-service/src/harness-http.ts",
);
const institutionBusinessCommunicationSource = read(
  "packages/nurture-scenario/src/harness/institution-business-communication.ts",
);
for (const identityPart of Object.values(expectedInstitutionBusinessCommunicationInterface)) {
  assertIncludes(
    institutionBusinessCommunicationSource,
    identityPart,
    "Institution business-communication source exact interface pin",
  );
}
assertIncludes(
  harnessTransportSource,
  `"${harnessPreparePath}"`,
  "harness transport prepare path",
);
assertIncludes(
  harnessTransportSource,
  `"${harnessExecutePath}"`,
  "harness transport execute path",
);
assertIncludes(
  harnessTransportSource,
  `"${institutionBusinessCommunicationReadPath}"`,
  "Institution business-communication owner-read transport path",
);
const harnessControllerSource = read(
  "apps/scenario-service/src/harness.controller.ts",
);
assertIncludes(
  harnessControllerSource,
  "@Post(HARNESS_PREPARE_PATH)",
  "harness controller prepare route",
);
assertIncludes(
  harnessControllerSource,
  "@Post(HARNESS_EXECUTE_PATH)",
  "harness controller execute route",
);

assertIncludes(
  harnessControllerSource,
  "@Post(HARNESS_QUERY_PATH)",
  "harness controller query route",
);
assertIncludes(
  harnessControllerSource,
  "@Post(HARNESS_READ_RESULT_PATH)",
  "harness controller read-result route",
);
assertIncludes(
  harnessControllerSource,
  "@Post(INSTITUTION_BUSINESS_COMMUNICATION_READ_PATH)",
  "Institution business-communication owner-read controller route",
);

// ---------------------------------------------------------------------------
// New private ingress routes are intentionally outside the public OpenAPI
// inventory, but they still require a closed source census and complete trust
// posture. The assertions below bind every physical route to its authentication,
// cache, exact-pin and default-off implementation.

const teacherReleaseControllerSource = read(
  "apps/scenario-service/src/teacher-release-owner.controller.ts",
);
const teacherReleaseHttpSource = read(
  "apps/scenario-service/src/teacher-release-owner-http.ts",
);
const teacherReleaseContractSource = read(
  "packages/nurture-scenario/src/teacher-release-owner-contract.ts",
);
const teacherReleaseRuntimeSource = read(
  "apps/scenario-service/src/teacher-release-owner-runtime.ts",
);
const scenarioServiceConfigSource = read("apps/scenario-service/src/config.ts");
const scenarioServiceApplicationSource = read(
  "apps/scenario-service/src/application.ts",
);
const privateResponseExceptionFilterSource = read(
  "apps/scenario-service/src/private-response-exception.filter.ts",
);

assertArrayEqual(
  censusPrivateResponseFilterControllers(),
  expectedPrivateResponseControllers,
  "private response exception-filter controller registration",
);
for (const fragment of [
  'response.setHeader("Cache-Control", "private, no-store")',
  'response.setHeader("Pragma", "no-cache")',
]) {
  assertIncludes(
    privateResponseExceptionFilterSource,
    fragment,
    "private response exception filter privacy headers",
  );
}
assertIncludes(
  privateResponseExceptionFilterSource,
  "this.safeExceptionFilter.catch(exception, host);",
  "private response exception filter delegates to the safe error serializer",
);

assertIncludes(
  teacherReleaseControllerSource,
  "@Controller()\n@UseFilters(PrivateResponseExceptionFilter)\n@UseGuards(TeacherReleaseOwnerServiceAuthGuard)",
  "teacher-release routes use the private response filter and service-bearer guard",
);
assertIncludes(
  teacherReleaseControllerSource,
  "!this.config.composition || !this.config.serviceAuth.configured",
  "teacher-release guard fails closed when disabled or unauthenticated",
);
assertIncludes(
  teacherReleaseControllerSource,
  "this.config.serviceAuth.bearerAuthorized(request.headers.authorization)",
  "teacher-release guard authenticates the service bearer",
);
for (const fragment of [
  'interface_key: "nurture.teacher-release-owner"',
  'interface_version: "3.0.0"',
  'authentication: "service_bearer"',
  'cache_control: "private, no-store"',
  'key: "nurture.surface-contract"',
  'version: "1.20.0"',
  'sha256:35d6340f60aa2d81523b0c8af977c8c5bb8f01a05a84d1a73b5baffbe8654273',
  'key: "query_teacher_publish_queue"',
  'key: "release_publish_process"',
  'sha256:b17970ed6ad8b1db36737348c54c14cae00a02bf4074b902fcc9c5d81cf5ae73',
]) {
  assertIncludes(
    teacherReleaseContractSource,
    fragment,
    `teacher-release exact contract pin ${fragment}`,
  );
}
for (const fragment of [
  "body.interface_contract.key !== TEACHER_RELEASE_OWNER_INTERFACE.key",
  "body.interface_contract.version !==\n      TEACHER_RELEASE_OWNER_INTERFACE.version",
  "body.interface_contract.digest !== TEACHER_RELEASE_OWNER_INTERFACE.digest",
]) {
  assertIncludes(
    teacherReleaseHttpSource,
    fragment,
    "teacher-release request requires the exact interface key/version/digest",
  );
}
assertIncludes(
  scenarioServiceConfigSource,
  "env.NURTURE_TEACHER_RELEASE_OWNER_ENABLED",
  "teacher-release has an explicit runtime gate",
);
assertIncludes(
  scenarioServiceConfigSource,
  'if (value === undefined || value === "false") return false;',
  "teacher-release runtime gate defaults off",
);
assertIncludes(
  teacherReleaseRuntimeSource,
  "if (!input.enabled || !input.serviceAuth.configured || !prisma || !engine)",
  "teacher-release composition requires every enabled dependency",
);

for (const route of [
  {
    constant: "TEACHER_RELEASE_OWNER_QUERY_PATH",
    handler: "query",
    parser: "parseTeacherReleaseOwnerQueryRequestV3",
  },
  {
    constant: "TEACHER_RELEASE_OWNER_TARGETS_PATH",
    handler: "targets",
    parser: "parseTeacherReleaseOwnerTargetsRequestV3",
  },
  {
    constant: "TEACHER_RELEASE_OWNER_PREPARE_PATH",
    handler: "prepare",
    parser: "parseTeacherReleaseOwnerPrepareRequestV3",
  },
  {
    constant: "TEACHER_RELEASE_OWNER_CONFIRM_PATH",
    handler: "confirm",
    parser: "parseTeacherReleaseOwnerConfirmRequestV3",
  },
]) {
  const expectedPath = teacherReleaseOwnerPaths[route.constant];
  assertTruthy(expectedPath, `${route.constant} expected literal path`);
  assertMatches(
    teacherReleaseContractSource,
    new RegExp(
      `export const ${route.constant} =\\s+${escapeRegExp(JSON.stringify(expectedPath))};`,
      "u",
    ),
    `${route.handler} route exact path pin`,
  );
  assertIncludes(
    teacherReleaseContractSource,
    `path: ${route.constant}`,
    `${route.handler} trusted owner handler declaration`,
  );
  const block = routeDecoratorBlock(
    teacherReleaseControllerSource,
    `@Post(${route.constant})`,
  );
  assertIncludes(block, '@Header("Cache-Control", "private, no-store")',
    `${route.handler} private no-store response`);
  assertIncludes(block, '@Header("Pragma", "no-cache")',
    `${route.handler} legacy no-cache response`);
  assertIncludes(block, `${route.parser}(body)`,
    `${route.handler} exact pinned request parser`);
  assertIncludes(block, `this.composition().${route.handler}(`,
    `${route.handler} trusted composition handler`);
  // The class-level assertions apply independently to every route in this
  // closed loop; adding a route requires an explicit profile entry above.
  assertIncludes(teacherReleaseControllerSource, "TeacherReleaseOwnerServiceAuthGuard",
    `${route.handler} service-bearer authentication mode`);
  assertIncludes(teacherReleaseRuntimeSource, "!input.enabled",
    `${route.handler} remains default-off`);
}

const parentContextPresenterControllerSource = read(
  "apps/scenario-service/src/parent-context-presenter.controller.ts",
);
const parentContextPresenterHttpSource = read(
  "apps/scenario-service/src/parent-context-presenter-http.ts",
);
const parentContextPresenterRuntimeSource = read(
  "apps/scenario-service/src/parent-context-presenter-runtime.ts",
);
const parentContextPresenterCompositionSource = read(
  "apps/scenario-service/src/parent-context-presenter-composition.ts",
);
const parentContextPresenterResponseValidatorSource = read(
  "apps/scenario-service/src/parent-context-presenter-response-validator.ts",
);
const parentContextPresenterContractSource = read(
  "packages/nurture-scenario/src/parent-context-presenter-contract.ts",
);
const parentContextPresenterArtifact = JSON.parse(
  read(
    "packages/nurture-scenario/contracts/parent-context-presenter/v1/parent-context-presenter.owner-contract.json",
  ),
);

assertIncludes(
  parentContextPresenterControllerSource,
  "@Controller()\n@UseFilters(PrivateResponseExceptionFilter)\n@UseGuards(ParentContextPresenterServiceAuthGuard)",
  "parent-context routes use the private response filter and service-bearer guard",
);
assertIncludes(
  parentContextPresenterControllerSource,
  "!this.config.composition || !this.config.serviceAuth.configured",
  "parent-context guard fails closed when disabled or unauthenticated",
);
assertIncludes(
  parentContextPresenterControllerSource,
  "this.config.serviceAuth.bearerAuthorized(request.headers.authorization)",
  "parent-context guard authenticates the service bearer",
);
for (const fragment of [
  'key: "nurture.parent-context-presenter"',
  'version: "1.0.0"',
  "sha256:3ac0906c6b514c861d266c3b4e470e5dcacb6cccdd61887e7b7a03e4c194c196",
  'authentication: "service_bearer"',
  'cache_control: "private, no-store"',
  "default_off: true",
]) {
  assertIncludes(
    parentContextPresenterContractSource,
    fragment,
    `parent-context exact contract pin ${fragment}`,
  );
}
assertEqual(
  parentContextPresenterArtifact.publication_posture?.route_registration,
  "scenario_service_mounted_default_off",
  "parent-context artifact mounted route posture",
);
assertEqual(
  parentContextPresenterArtifact.publication_posture?.runtime_adapter,
  "owner_ports_required_default_off",
  "parent-context artifact owner-port posture",
);
assertIncludes(
  scenarioServiceConfigSource,
  "env.NURTURE_PARENT_CONTEXT_PRESENTER_ENABLED",
  "parent-context has an explicit runtime gate",
);
assertIncludes(
  parentContextPresenterRuntimeSource,
  "|| !binding.asyncBoundary",
  "parent-context composition requires the active consumer boundary",
);
for (const fragment of [
  "|| !binding?.authorityResolver",
  "|| !binding.owner",
  "|| !binding.asyncBoundary",
]) {
  assertIncludes(
    parentContextPresenterRuntimeSource,
    fragment,
    `parent-context complete owner binding ${fragment}`,
  );
}
assertIncludes(
  parentContextPresenterResponseValidatorSource,
  "ajv.addSchema(artifact.schemas)",
  "parent-context runtime compiles the published schema artifact",
);
assertIncludes(
  parentContextPresenterResponseValidatorSource,
  "digest !== PARENT_CONTEXT_PRESENTER_INTERFACE.digest",
  "parent-context runtime hard-checks the compiled artifact pin",
);
assertIncludes(
  parentContextPresenterCompositionSource,
  "assertPublishedParentContextPresenterResponse(operation, response)",
  "parent-context composition enforces the published response schema",
);
assertIncludes(
  parentContextPresenterCompositionSource,
  "noticeStatusMatchesKind(request.kind, response.status)",
  "parent-context composition enforces the notice kind/status matrix",
);
assertIncludes(
  parentContextPresenterCompositionSource,
  "lateResultMayApply({",
  "parent-context composition owns ASYNC-12 result rejection",
);
assertEqual(
  parentContextPresenterArtifact.operations?.notice_list_and_confirmation
    ?.exchange_schema_ref,
  "urn:nurture:parent-context-presenter:1#/$defs/notice_operation_exchange",
  "parent-context notice exchange matrix schema pin",
);
for (const route of [
  {
    constant: "PARENT_CONTEXT_PRESENTER_DAY_PATH",
    handler: "day",
    parser: "parseParentContextPresenterDayRequestV1",
  },
  {
    constant: "PARENT_CONTEXT_PRESENTER_DAILY_CARE_PATH",
    handler: "dailyCare",
    parser: "parseParentContextPresenterDailyCareRequestV1",
  },
  {
    constant: "PARENT_CONTEXT_PRESENTER_ACTIVITY_DETAIL_PATH",
    handler: "activityDetail",
    parser: "parseParentContextPresenterActivityDetailRequestV1",
  },
  {
    constant: "PARENT_CONTEXT_PRESENTER_NOTICES_PATH",
    handler: "notices",
    parser: "parseParentContextPresenterNoticeRequestV1",
  },
  {
    constant: "PARENT_CONTEXT_PRESENTER_FRESHNESS_ATTENDANCE_PATH",
    handler: "freshnessAttendance",
    parser: "parseParentContextPresenterFreshnessAttendanceRequestV1",
  },
]) {
  const expectedPath = parentContextPresenterPaths[route.constant];
  assertTruthy(expectedPath, `${route.constant} expected literal path`);
  assertMatches(
    parentContextPresenterContractSource,
    new RegExp(
      `export const ${route.constant} =\\s+${escapeRegExp(JSON.stringify(expectedPath))};`,
      "u",
    ),
    `${route.handler} route exact path pin`,
  );
  const block = routeDecoratorBlock(
    parentContextPresenterControllerSource,
    `@Post(${route.constant})`,
  );
  assertIncludes(
    block,
    '@Header("Cache-Control", "private, no-store")',
    `${route.handler} private no-store response`,
  );
  assertIncludes(
    block,
    '@Header("Pragma", "no-cache")',
    `${route.handler} legacy no-cache response`,
  );
  assertIncludes(
    block,
    `${route.parser}(`,
    `${route.handler} exact pinned request parser`,
  );
  assertIncludes(
    block,
    `this.composition().${route.handler}(`,
    `${route.handler} Q6 owner composition`,
  );
  assertIncludes(
    parentContextPresenterHttpSource,
    "body.interface_contract.digest !== PARENT_CONTEXT_PRESENTER_INTERFACE.digest",
    `${route.handler} exact interface digest admission`,
  );
  assertIncludes(
    parentContextPresenterRuntimeSource,
    "!input.enabled",
    `${route.handler} remains default-off`,
  );
}

const parentCommunicationOwnerControllerSource = read(
  "apps/scenario-service/src/parent-communication-owner.controller.ts",
);
const parentCommunicationOwnerHttpSource = read(
  "apps/scenario-service/src/parent-communication-owner-http.ts",
);
const parentCommunicationOwnerRuntimeSource = read(
  "apps/scenario-service/src/parent-communication-owner-runtime.ts",
);
const parentCommunicationOwnerCompositionSource = read(
  "apps/scenario-service/src/parent-communication-owner-composition.ts",
);
const parentCommunicationOwnerResponseValidatorSource = read(
  "apps/scenario-service/src/parent-communication-owner-response-validator.ts",
);
const parentCommunicationOwnerContractSource = read(
  "packages/nurture-scenario/src/parent-communication-owner-contract.ts",
);
const parentCommunicationOwnerArtifact = JSON.parse(
  read(
    "packages/nurture-scenario/contracts/parent-communication-owner/v1/parent-communication-owner.owner-contract.json",
  ),
);

assertIncludes(
  parentCommunicationOwnerControllerSource,
  "@Controller()\n@UseFilters(PrivateResponseExceptionFilter)\n@UseGuards(ParentCommunicationOwnerServiceAuthGuard)",
  "parent-communication routes use private response and service-bearer guards",
);
assertIncludes(
  parentCommunicationOwnerControllerSource,
  "!this.config.composition || !this.config.serviceAuth.configured",
  "parent-communication guard fails closed without full composition",
);
for (const fragment of [
  'key: "nurture.parent-communication-owner"',
  'version: "1.0.0"',
  "sha256:b1dce3a73ac45ff244452e13434834a152bc1ffdc8ede685f8a20b04c9b24a7f",
  'authentication: "service_bearer"',
  'cache_control: "private, no-store"',
  "default_off: true",
  'p0_send_scope: "text_only_teacher_segment"',
]) {
  assertIncludes(
    parentCommunicationOwnerContractSource,
    fragment,
    `parent-communication exact contract pin ${fragment}`,
  );
}
assertEqual(
  parentCommunicationOwnerArtifact.publication_posture?.route_registration,
  "scenario_service_mounted_default_off",
  "parent-communication mounted route posture",
);
assertEqual(
  parentCommunicationOwnerArtifact.command_semantics?.p0_scope,
  "text_only_teacher_segment",
  "parent-communication P0 command scope",
);
assertEqual(
  parentCommunicationOwnerArtifact.media_policy?.maximum_access_ttl_seconds,
  60,
  "parent-communication media TTL",
);
assertIncludes(
  scenarioServiceConfigSource,
  "env.NURTURE_PARENT_COMMUNICATION_OWNER_ENABLED",
  "parent-communication has an explicit runtime gate",
);
for (const fragment of [
  "!input.enabled",
  "|| !binding?.authorityResolver",
  "|| !binding.owner",
  "|| !binding.asyncBoundary",
]) {
  assertIncludes(
    parentCommunicationOwnerRuntimeSource,
    fragment,
    `parent-communication complete owner binding ${fragment}`,
  );
}
assertIncludes(
  parentCommunicationOwnerResponseValidatorSource,
  "ajv.addSchema(artifact.contract_schema)",
  "parent-communication runtime compiles the published schema artifact",
);
assertIncludes(
  parentCommunicationOwnerResponseValidatorSource,
  "digest !== PARENT_COMMUNICATION_OWNER_INTERFACE.digest",
  "parent-communication runtime hard-checks the artifact pin",
);
for (const fragment of [
  "assertPublishedParentCommunicationOwnerResponse(operation, response)",
  'recovery: "reconcile_same_command"',
  "response.preview.body === request.body",
  "response.messages.length <= request.page_size",
]) {
  assertIncludes(
    parentCommunicationOwnerCompositionSource,
    fragment,
    `parent-communication composition rule ${fragment}`,
  );
}
for (const route of [
  {
    constant: "PARENT_COMMUNICATION_OWNER_SUMMARY_PATH",
    handler: "summary",
    parser: "parseParentCommunicationSummaryRequestV1",
  },
  {
    constant: "PARENT_COMMUNICATION_OWNER_DETAIL_PATH",
    handler: "detail",
    parser: "parseParentCommunicationDetailRequestV1",
  },
  {
    constant: "PARENT_COMMUNICATION_OWNER_MEDIA_ACCESS_PATH",
    handler: "mediaAccess",
    parser: "parseParentCommunicationMediaAccessRequestV1",
  },
  {
    constant: "PARENT_COMMUNICATION_OWNER_SEND_TEXT_PATH",
    handler: "sendText",
    parser: "parseParentCommunicationSendTextRequestV1",
  },
]) {
  const expectedPath = parentCommunicationOwnerPaths[route.constant];
  assertTruthy(expectedPath, `${route.constant} expected literal path`);
  assertMatches(
    parentCommunicationOwnerContractSource,
    new RegExp(
      `export const ${route.constant} =\\s+${escapeRegExp(JSON.stringify(expectedPath))};`,
      "u",
    ),
    `${route.handler} route exact path pin`,
  );
  const block = routeDecoratorBlock(
    parentCommunicationOwnerControllerSource,
    `@Post(${route.constant})`,
  );
  assertIncludes(block, '@Header("Cache-Control", "private, no-store")',
    `${route.handler} private no-store response`);
  assertIncludes(block, '@Header("Pragma", "no-cache")',
    `${route.handler} legacy no-cache response`);
  assertIncludes(block, `${route.parser}(`,
    `${route.handler} exact pinned request parser`);
  assertIncludes(block, `this.composition().${route.handler}(`,
    `${route.handler} current-authority owner composition`);
  assertIncludes(
    parentCommunicationOwnerHttpSource,
    "body.interface_contract.digest !== PARENT_COMMUNICATION_OWNER_INTERFACE.digest",
    `${route.handler} exact digest admission`,
  );
}

const directorPresenterControllerSource = read(
  "apps/scenario-service/src/director-presenter.controller.ts",
);
const directorPresenterHttpSource = read(
  "apps/scenario-service/src/director-presenter-http.ts",
);
const directorPresenterRuntimeSource = read(
  "apps/scenario-service/src/director-presenter-runtime.ts",
);
const directorPresenterCompositionSource = read(
  "apps/scenario-service/src/director-presenter-composition.ts",
);
const directorPresenterResponseValidatorSource = read(
  "apps/scenario-service/src/director-presenter-response-validator.ts",
);
const directorPresenterContractSource = read(
  "packages/nurture-scenario/src/director-presenter-contract.ts",
);
const directorPresenterArtifact = JSON.parse(
  read(
    "packages/nurture-scenario/contracts/director-presenter/v1/director-presenter.owner-contract.json",
  ),
);
assertIncludes(
  directorPresenterControllerSource,
  "!this.config.composition || !this.config.serviceAuth.configured",
  "director presenter guard fails closed when disabled or unauthenticated",
);
assertIncludes(
  directorPresenterControllerSource,
  "this.config.serviceAuth.bearerAuthorized(request.headers.authorization)",
  "director presenter guard authenticates the service bearer",
);
for (const fragment of [
  'key: "nurture.director-presenter"',
  'version: "1.0.0"',
  "sha256:6ce74306c0fc976feecb5f530cd1a43f5986e9c982cdb12a3b4b5a2a568c7ac1",
  'authentication: "service_bearer"',
  'cache_control: "private, no-store"',
  "default_off: true",
  'mobile_mode: "read_only"',
]) {
  assertIncludes(
    directorPresenterContractSource,
    fragment,
    `director presenter exact contract pin ${fragment}`,
  );
}
assertEqual(
  directorPresenterArtifact.publication_posture?.route_registration,
  "scenario_service_mounted_default_off",
  "director presenter mounted route posture",
);
assertEqual(
  directorPresenterArtifact.mobile_posture?.mode,
  "read_only",
  "director presenter Mobile remains read-only",
);
assertEqual(
  directorPresenterArtifact.mobile_posture?.operation_entry,
  "web_workbench_required",
  "director presenter routes Institution operations to Web",
);
assertIncludes(
  scenarioServiceConfigSource,
  "env.NURTURE_DIRECTOR_PRESENTER_ENABLED",
  "director presenter has an explicit runtime gate",
);
for (const fragment of [
  "!input.enabled",
  "|| !binding?.authorityResolver",
  "|| !binding.owner",
]) {
  assertIncludes(
    directorPresenterRuntimeSource,
    fragment,
    `director presenter complete owner binding ${fragment}`,
  );
}
assertIncludes(
  directorPresenterResponseValidatorSource,
  "ajv.addSchema(artifact.schemas)",
  "director presenter runtime compiles the published schema artifact",
);
assertIncludes(
  directorPresenterResponseValidatorSource,
  "digest !== DIRECTOR_PRESENTER_INTERFACE.digest",
  "director presenter runtime hard-checks the artifact pin",
);
assertIncludes(
  directorPresenterCompositionSource,
  "assertPublishedDirectorPresenterResponse(operation, response)",
  "director presenter composition enforces published responses",
);
assertIncludes(
  directorPresenterCompositionSource,
  "await this.authorityResolver.resolve({",
  "director presenter rereads current authority for every operation",
);
for (const route of [
  {
    constant: "DIRECTOR_PRESENTER_OVERVIEW_PATH",
    handler: "overview",
    parser: "parseDirectorPresenterOverviewRequestV1",
  },
  {
    constant: "DIRECTOR_PRESENTER_DRILLDOWN_PATH",
    handler: "drilldown",
    parser: "parseDirectorPresenterDrilldownRequestV1",
  },
  {
    constant: "DIRECTOR_PRESENTER_MATERIALS_PATH",
    handler: "materials",
    parser: "parseDirectorPresenterMaterialRequestV1",
  },
]) {
  const expectedPath = directorPresenterPaths[route.constant];
  assertTruthy(expectedPath, `${route.constant} expected literal path`);
  assertMatches(
    directorPresenterContractSource,
    new RegExp(
      `export const ${route.constant} =\\s+${escapeRegExp(JSON.stringify(expectedPath))};`,
      "u",
    ),
    `${route.handler} route exact path pin`,
  );
  const block = routeDecoratorBlock(
    directorPresenterControllerSource,
    `@Post(${route.constant})`,
  );
  assertIncludes(block, '@Header("Cache-Control", "private, no-store")',
    `${route.handler} private no-store response`);
  assertIncludes(block, '@Header("Pragma", "no-cache")',
    `${route.handler} legacy no-cache response`);
  assertIncludes(block, `${route.parser}(`,
    `${route.handler} exact pinned request parser`);
  assertIncludes(block, `this.composition().${route.handler}(`,
    `${route.handler} current-authority owner composition`);
  assertIncludes(
    directorPresenterHttpSource,
    "contract.digest !== DIRECTOR_PRESENTER_INTERFACE.digest",
    `${route.handler} exact digest admission`,
  );
}

const familySharingControllerSource = read(
  "apps/scenario-service/src/family-sharing-private.controller.ts",
);
const familySharingRuntimeSource = read(
  "apps/scenario-service/src/family-sharing-private-runtime.ts",
);
const familySharingCompositionSource = read(
  "apps/scenario-service/src/family-sharing-private-composition.ts",
);
const familySharingTransportSource = read(
  "packages/nurture-scenario/src/domain/family-sharing/private-transport.ts",
);
const familySharingEligibilitySource = read(
  "packages/nurture-scenario/src/harness/family-sharing-eligibility.ts",
);
const trustedInvocationSource = read(
  "packages/nurture-scenario/src/c30/trusted-invocation.ts",
);
const familySharingGuardBlock = familySharingControllerSource.slice(
  0,
  familySharingControllerSource.indexOf("@Controller()"),
);
const familySharingRouteBlock = routeDecoratorBlock(
  familySharingControllerSource,
  "@Post(NURTURE_FAMILY_SHARING_PRIVATE_PATH)",
);

assertIncludes(
  familySharingControllerSource,
  "@Post(NURTURE_FAMILY_SHARING_PRIVATE_PATH)\n  @UseGuards(FamilySharingPrivateServiceAuthGuard)",
  "family-sharing signed route declaration and service-bearer authentication",
);
assertIncludes(
  familySharingGuardBlock,
  "this.config.serviceAuth.bearerAuthorized(request.headers.authorization)",
  "family-sharing signed route service-bearer verification",
);
for (const fragment of [
  'response.setHeader("Cache-Control", "private, no-store")',
  'response.setHeader("Pragma", "no-cache")',
]) {
  assertIncludes(
    familySharingRouteBlock,
    fragment,
    "family-sharing private no-store headers on successful responses",
  );
}
for (const [label, fragment] of [
  ["path", `"${familySharingPrivatePath}" as const`],
  ["endpoint", '"nurture.family_sharing.private" as const'],
  ["ingress", '"my-chat.family-nurture-authorization" as const'],
  ["eligibility operation", '"read_family_sharing_eligibility" as const'],
  ["cleanup operation", '"cleanup_family_sharing_withdrawal" as const'],
  ["input schema", "NURTURE_FAMILY_SHARING_PRIVATE_INPUT_SCHEMA_VERSION = 1 as const"],
  ["cleanup key", 'key: "nurture.family-sharing-withdrawal-cleanup"'],
  ["cleanup version", 'version: "1.0.0"'],
  ["cleanup digest", "sha256:9dcbf4e0ed3eb20dc915e4006691aaaa5d0be43c53fd687166bdfce85ed9aeda"],
]) {
  assertIncludes(
    familySharingTransportSource,
    fragment,
    `family-sharing exact ${label} pin`,
  );
}
for (const [label, fragment] of [
  ["eligibility key", 'key: "nurture.family-sharing-eligibility"'],
  ["eligibility version", 'version: "1.0.0"'],
  ["eligibility digest", "sha256:0cc3ccc8df55b1c6060c5b39af02fb1026c260dae53727f5fdeff72f2b08f5d8"],
]) {
  assertIncludes(
    familySharingEligibilitySource,
    fragment,
    `family-sharing exact ${label} pin`,
  );
}
for (const fragment of [
  "declaration(NURTURE_FAMILY_SHARING_ELIGIBILITY_OPERATION)",
  "declaration(NURTURE_FAMILY_SHARING_CLEANUP_OPERATION)",
  "endpoint_key: NURTURE_FAMILY_SHARING_PRIVATE_ENDPOINT",
  'method: "POST" as const',
  "input_schema_version: NURTURE_FAMILY_SHARING_PRIVATE_INPUT_SCHEMA_VERSION",
  'ingress_category: "workflow_runtime" as const',
  "ingress_key: NURTURE_FAMILY_SHARING_PRIVATE_INGRESS",
  'principal_origins: ["durable_run_actor"] as const',
]) {
  assertIncludes(
    familySharingRuntimeSource,
    fragment,
    "family-sharing exact trusted handler declarations",
  );
}
assertIncludes(
  familySharingRuntimeSource,
  "verifyNurtureScenarioInvocation({",
  "family-sharing signed route invokes the trusted verifier",
);
assertIncludes(
  trustedInvocationSource,
  'record.algorithm !== "Ed25519"',
  "family-sharing signed route requires Ed25519 metadata",
);
assertIncludes(
  trustedInvocationSource,
  "if (!verifyDetached(unsignedSignature, signature.signature, trustPolicy.public_key))",
  "family-sharing signed route verifies the Ed25519 signature",
);
assertIncludes(
  trustedInvocationSource,
  "assertScenarioPrivateInvocationV1(input.invocation);",
  "family-sharing signed route applies the pinned invocation contract",
);
assertIncludes(
  trustedInvocationSource,
  "expiresAt - issuedAt > 60_000",
  "family-sharing signed route enforces the 60-second invocation lifetime",
);
assertIncludes(
  trustedInvocationSource,
  "input.nonce_store.consumeOnce({",
  "family-sharing signed route consumes a nonce before dispatch",
);
assertIncludes(
  familySharingRuntimeSource,
  "nonce_store: this.dependencies.nonceStore",
  "family-sharing signed route passes its required nonce store",
);
assertIncludes(
  familySharingCompositionSource,
  "nonceStore: new PrismaNurtureScenarioNonceStore(input.prisma)",
  "family-sharing enabled composition uses the persistent nonce store",
);
assertIncludes(
  familySharingRuntimeSource,
  "return Object.freeze({});",
  "family-sharing signed runtime has an empty disabled state",
);
assertIncludes(
  scenarioServiceApplicationSource,
  "createDisabledFamilySharingPrivateRuntime()",
  "family-sharing signed route defaults off in application composition",
);
assertIncludes(
  familySharingControllerSource,
  "!this.config.runtime.engine || !this.config.serviceAuth.configured",
  "family-sharing signed route fails closed while default-off",
);

// ---------------------------------------------------------------------------
// Every routed capability must be registered at the exact version it is routed
// at, and every registered capability must be either routed or explicitly
// listed as not yet routed. Both directions matter: the first stops the ingress
// admitting a version the contract never registered, the second stops routing
// coverage shrinking without anyone noticing.

const capabilityRegistry = JSON.parse(
  read(
    "packages/nurture-scenario/contracts/surfaces/v1/source/capabilities/capability-registry.json",
  ),
);
const registeredVersions = new Map(
  capabilityRegistry.capabilities.map((capability) => [
    capability.capabilityKey,
    capability.capabilityVersion,
  ]),
);
const registeredQueryKeys = new Set(
  capabilityRegistry.capabilities
    .filter((capability) => capability.executionClass === "query")
    .map((capability) => capability.capabilityKey),
);
// Each I2 artifact's exact inventory is owned by its dedicated contract suite.
// Formal ingress derives the still-unrouted set from the artifact's unique
// default-off runtime gate so a second hand-maintained key list cannot drift.
const explicitlyUnroutedRuntimeGates = new Set([
  "t007_enrollment_journey_runtime",
  "t007_institution_knowledge_runtime",
]);
const expectedUnroutedCapabilityKeys = [
  ...explicitlyUnroutedCapabilityKeys,
  ...capabilityRegistry.capabilities
    .filter((capability) =>
      capability.dependencyGates?.some(
        (gate) => explicitlyUnroutedRuntimeGates.has(gate.dependencyKey),
      ),
    )
    .map((capability) => capability.capabilityKey),
];

const parseRoutedVersions = (constName) => {
  const block = harnessTransportSource.match(
    new RegExp(`export const ${constName} = \\{([\\s\\S]*?)\\n\\} as const;`),
  );
  assertTruthy(block, `harness transport ${constName} block`);
  const routed = new Map();
  for (const line of block[1].split("\n")) {
    const text = line.trim();
    if (text === "" || text.startsWith("//") || text.startsWith("*") || text.startsWith("/*")) {
      continue;
    }
    const entry = text.match(/^([a-z0-9_]+):\s*"([0-9]+\.[0-9]+\.[0-9]+)",$/);
    if (entry) {
      routed.set(entry[1], entry[2]);
      continue;
    }
    // Anything the parser does not understand — a spread, a computed key, a
    // conditional — would silently contribute keys this census cannot see, and
    // the published enum would then be compared against an incomplete set.
    throw new Error(
      `${constName} contains an entry this census cannot read: ${text}. ` +
        "Admission must stay a literal key-to-version map.",
    );
  }
  return routed;
};

const routedActionVersions = parseRoutedVersions("HARNESS_CAPABILITY_VERSIONS");
const routedQueryVersions = parseRoutedVersions("HARNESS_QUERY_CAPABILITY_VERSIONS");
const routedVersions = new Map([...routedActionVersions, ...routedQueryVersions]);

for (const [key, version] of routedVersions) {
  assertEqual(
    registeredVersions.get(key),
    version,
    `routed capability ${key} is registered at the exact version it is admitted at`,
  );
}
for (const key of routedQueryVersions.keys()) {
  assertTruthy(registeredQueryKeys.has(key), `query-lane capability ${key} is a registered query`);
}
for (const key of routedActionVersions.keys()) {
  assertEqual(
    registeredQueryKeys.has(key),
    false,
    `action-lane capability ${key} is not a registered query`,
  );
}
assertArrayEqual(
  [...registeredVersions.keys()].filter((key) => !routedVersions.has(key)).sort(),
  [...expectedUnroutedCapabilityKeys].sort(),
  "registered capabilities that are deliberately not routed yet",
);
// Containment, not equality: the T-005 eight must never leave the ingress, but
// the action lane is expected to grow as T-006 write keys land.
for (const actionKey of expectedHarnessActionKeys) {
  assertTruthy(routedActionVersions.has(actionKey), `T-005 action key still routed: ${actionKey}`);
}
assertArrayEqual(
  openApi.components?.schemas?.HarnessQueryRequest?.properties?.capability_key?.enum ?? [],
  [...routedQueryVersions.keys()],
  "OpenAPI query key set matches the routed query lane",
);

// The published action key set is exactly the routed one, in the same order the
// transport declares it: a published enum that drifted from the routed map
// would tell callers a key is admitted when it is not, or hide one that is.
assertArrayEqual(
  openApi.components?.schemas?.HarnessPrepareRequest?.properties?.capability_key?.enum ?? [],
  [...routedActionVersions.keys()],
  "OpenAPI Harness action key set matches the routed action lane",
);
assertArrayEqual(
  openApi.components?.schemas?.HarnessExecuteRequest?.properties?.capability_key?.enum ?? [],
  [...routedActionVersions.keys()],
  "OpenAPI Harness execute key set matches the routed action lane",
);

const apiIndex = JSON.parse(read("docs/context/api/api-index.json"));
assertArrayEqual(
  apiIndex.endpoints
    .map((endpoint) => `${endpoint.method} ${endpoint.path}`)
    .sort(),
  [
    `GET ${healthPath}`,
    `POST ${ownerPath}`,
    `POST ${harnessPreparePath}`,
    `POST ${harnessExecutePath}`,
    `POST ${harnessQueryPath}`,
    `POST ${harnessReadResultPath}`,
    `POST ${institutionBusinessCommunicationReadPath}`,
  ].sort(),
  "API index formal route set",
);
const institutionBusinessCommunicationReadIndex = apiIndex.endpoints.find(
  (endpoint) =>
    endpoint.method === "POST" &&
    endpoint.path === institutionBusinessCommunicationReadPath,
);
assertTruthy(
  institutionBusinessCommunicationReadIndex,
  "API index Institution business-communication owner-read operation",
);
assertArrayEqual(
  institutionBusinessCommunicationReadIndex.input?.body?.required ?? [],
  expectedInstitutionBusinessCommunicationReadFields,
  "API index Institution business-communication owner-read required fields",
);
const ownerIndex = apiIndex.endpoints.find(
  (endpoint) => endpoint.method === "POST" && endpoint.path === ownerPath,
);
assertTruthy(ownerIndex, "API index owner operation");
assertArrayEqual(
  ownerIndex.input?.body?.required ?? [],
  expectedOwnerRequiredFields,
  "API index owner required fields",
);
assertArrayEqual(
  ownerIndex.input?.body?.optional ?? [],
  expectedOwnerOptionalFields,
  "API index owner optional fields",
);

process.stdout.write(
  `[ok] formal ingress contract formal-routes=7 controller-routes=${expectedControllerRoutes.length} ` +
    `teacher-release-routes=4 parent-context-routes=5 signed-family-sharing-routes=1 owner-fields=8 ` +
    `harness-actions=${routedActionVersions.size} ` +
    `harness-queries=${routedQueryVersions.size} registered=${registeredVersions.size} ` +
    `unrouted=${expectedUnroutedCapabilityKeys.length} versions=per-capability ` +
    "harness-execute-fields=8 institution-owner-read-fields=5\n",
);

function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}
function assertTruthy(value, label) {
  if (!value) throw new Error(`${label}: expected a truthy value`);
}

function assertIncludes(content, expected, label) {
  if (!content.includes(expected)) {
    throw new Error(`${label}: missing ${JSON.stringify(expected)}`);
  }
}

function assertMatches(content, expected, label) {
  if (!expected.test(content)) {
    throw new Error(`${label}: source did not match ${expected}`);
  }
}

function assertArrayEqual(actual, expected, label) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      `${label}: expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`,
    );
  }
}

function censusControllerRoutes() {
  const sourceDirectory = path.join(repoRoot, "apps/scenario-service/src");
  const routes = [];
  for (const absolutePath of collectTypeScriptFiles(sourceDirectory)) {
    const relativePath = toRepoRelativePath(absolutePath);
    routes.push(...parseControllerRouteDeclarations(relativePath, read(relativePath)));
  }
  assertRouteCensusSelfChecks();
  return routes.sort();
}

function collectTypeScriptFiles(directory) {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectTypeScriptFiles(absolutePath));
    } else if (entry.isFile() && entry.name.endsWith(".ts")) {
      files.push(absolutePath);
    }
  }
  return files.sort();
}

function parseControllerRouteDeclarations(relativePath, source) {
  const sourceFile = parseTypeScriptSource(relativePath, source);
  const imports = collectImportBindings(sourceFile);
  const declarations = [];
  walk(sourceFile, (node) => {
    if (!ts.isDecorator(node)) return;
    const expression = node.expression;
    const target = ts.isCallExpression(expression)
      ? expression.expression
      : expression;
    const imported = resolveImportedSymbol(target, imports);
    if (
      imported?.moduleSpecifier !== "@nestjs/common" ||
      !nestRouteDecoratorNames.has(imported.importedName)
    ) return;
    assertTruthy(
      ts.isCallExpression(expression),
      `${relativePath} ${imported.importedName} route decorator must be called`,
    );
    assertEqual(
      expression.arguments.length,
      1,
      `${relativePath} ${imported.importedName} route decorator argument count`,
    );
    const routeArgument = expression.arguments[0];
    assertTruthy(
      routeArgument,
      `${relativePath} ${imported.importedName} route decorator argument`,
    );
    declarations.push(
      `${relativePath}:${imported.importedName.toUpperCase()}:${routeArgument.getText(sourceFile)}`,
    );
  });
  return declarations;
}

function assertRouteCensusSelfChecks() {
  const fixtures = [
    {
      label: "aliased routing decorator",
      relativePath: "guard-self-check.controller.ts",
      source:
        'import { Controller, Post as RoutePost } from "@nestjs/common";\n' +
        "@Controller()\nclass GuardSelfCheck {\n  @RoutePost(ALIASED_PRIVATE_ROUTE)\n  invoke() {}\n}\n",
      expected: "guard-self-check.controller.ts:POST:ALIASED_PRIVATE_ROUTE",
    },
    {
      label: "namespace-qualified routing decorator",
      relativePath: "guard-self-check.controller.ts",
      source:
        'import * as Nest from "@nestjs/common";\n' +
        "@Nest.Controller()\nclass GuardSelfCheck {\n  @Nest.Post(NAMESPACE_PRIVATE_ROUTE)\n  invoke() {}\n}\n",
      expected: "guard-self-check.controller.ts:POST:NAMESPACE_PRIVATE_ROUTE",
    },
    {
      label: "controller in a non-standard filename",
      relativePath: "guard-self-check.private-endpoint.ts",
      source:
        'import { Controller, Post } from "@nestjs/common";\n' +
        "@Controller()\nclass GuardSelfCheck {\n  @Post(NON_STANDARD_FILE_ROUTE)\n  invoke() {}\n}\n",
      expected: "guard-self-check.private-endpoint.ts:POST:NON_STANDARD_FILE_ROUTE",
    },
  ];
  for (const fixture of fixtures) {
    const actual = parseControllerRouteDeclarations(
      fixture.relativePath,
      fixture.source,
    );
    assertArrayEqual(
      actual,
      [fixture.expected],
      `controller route census self-check detects ${fixture.label}`,
    );
    assertThrows(
      () => assertArrayEqual(actual, [], `${fixture.label} closed census`),
      `controller route census self-check rejects ${fixture.label}`,
    );
  }
}

function censusRegisteredControllers() {
  const staticModule = nestModuleArray("controllers");
  const dynamicModule = dynamicModuleArray("controllers", false);
  return [staticModule, dynamicModule].flatMap(
    ({ elements, imports, relativePath }) => elements.map((element) =>
      resolveControllerReference(element, imports, relativePath)
    ),
  );
}

function censusPrivateResponseFilterProviders() {
  const { elements, imports, relativePath } = dynamicModuleArray("providers");
  const expected = new Set(expectedPrivateResponseFilterProviders);
  const providers = [];
  for (const element of elements) {
    const target = unwrapExpression(element);
    if (
      !ts.isIdentifier(target) &&
      !ts.isPropertyAccessExpression(target) &&
      !ts.isElementAccessExpression(target)
    ) continue;
    const reference = resolveControllerReference(target, imports, relativePath);
    if (expected.has(reference)) providers.push(reference);
  }
  return providers.sort();
}

function nestModuleArray(propertyName) {
  const relativePath = "apps/scenario-service/src/app.module.ts";
  const sourceFile = parseTypeScriptSource(relativePath, read(relativePath));
  const imports = collectImportBindings(sourceFile);
  const moduleClasses = sourceFile.statements.filter(
    (statement) => ts.isClassDeclaration(statement) &&
      decoratorsOf(statement).some((decorator) =>
        isImportedDecorator(decorator, imports, "@nestjs/common", "Module")
      ),
  );
  assertEqual(moduleClasses.length, 1, "scenario-service Nest module class count");
  const moduleClass = moduleClasses[0];
  assertTruthy(moduleClass, "scenario-service Nest module class");
  const moduleDecorators = decoratorsOf(moduleClass).filter((decorator) =>
    isImportedDecorator(decorator, imports, "@nestjs/common", "Module")
  );
  assertEqual(moduleDecorators.length, 1, "scenario-service @Module decorator count");
  const moduleDecorator = moduleDecorators[0];
  assertTruthy(moduleDecorator, "scenario-service @Module decorator");
  const call = moduleDecorator.expression;
  assertTruthy(ts.isCallExpression(call), "scenario-service @Module call");
  assertEqual(call.arguments.length, 1, "scenario-service @Module metadata argument count");
  const metadata = unwrapExpression(call.arguments[0]);
  assertTruthy(ts.isObjectLiteralExpression(metadata), "scenario-service @Module metadata object");
  const matchingProperties = metadata.properties.filter(
    (property) => ts.isPropertyAssignment(property) &&
      propertyNameText(property.name) === propertyName,
  );
  assertEqual(
    matchingProperties.length,
    1,
    `scenario-service @Module ${propertyName} property count`,
  );
  const matchingProperty = matchingProperties[0];
  assertTruthy(
    ts.isPropertyAssignment(matchingProperty),
    `scenario-service @Module ${propertyName} property`,
  );
  const values = unwrapExpression(matchingProperty.initializer);
  assertTruthy(
    ts.isArrayLiteralExpression(values),
    `scenario-service @Module ${propertyName} array`,
  );
  return { elements: values.elements, imports, relativePath };
}

function dynamicModuleArray(propertyName, required = true) {
  const relativePath = "apps/scenario-service/src/app.module.ts";
  const sourceFile = parseTypeScriptSource(relativePath, read(relativePath));
  const imports = collectImportBindings(sourceFile);
  const moduleObjects = [];
  walk(sourceFile, (node) => {
    if (!ts.isObjectLiteralExpression(node)) return;
    const moduleProperty = node.properties.find(
      (property) => ts.isPropertyAssignment(property) &&
        propertyNameText(property.name) === "module" &&
        ts.isIdentifier(unwrapExpression(property.initializer)) &&
        unwrapExpression(property.initializer).text === "AppModule",
    );
    if (!moduleProperty) return;
    moduleObjects.push(node);
  });
  assertEqual(
    moduleObjects.length,
    1,
    "scenario-service dynamic module object count",
  );
  const moduleObject = moduleObjects[0];
  assertTruthy(moduleObject, "scenario-service dynamic module object");
  const matches = moduleObject.properties.filter(
    (candidate) => ts.isPropertyAssignment(candidate) &&
      propertyNameText(candidate.name) === propertyName,
  );
  assertEqual(
    matches.length,
    required ? 1 : Math.min(matches.length, 1),
    `scenario-service dynamic module ${propertyName} property count`,
  );
  if (matches.length === 0) return { elements: [], imports, relativePath };
  const property = matches[0];
  assertTruthy(property, `scenario-service dynamic module ${propertyName} property`);
  const values = unwrapExpression(property.initializer);
  assertTruthy(
    ts.isArrayLiteralExpression(values),
    `scenario-service dynamic module ${propertyName} array`,
  );
  return { elements: values.elements, imports, relativePath };
}

function assertScenarioServiceBootstrapRegistration() {
  const sourceDirectory = path.join(repoRoot, "apps/scenario-service/src");
  const matches = [];
  for (const absolutePath of collectTypeScriptFiles(sourceDirectory)) {
    const relativePath = toRepoRelativePath(absolutePath);
    const sourceFile = parseTypeScriptSource(relativePath, read(relativePath));
    const imports = collectImportBindings(sourceFile);
    walk(sourceFile, (node) => {
      if (
        !ts.isCallExpression(node) ||
        !ts.isPropertyAccessExpression(node.expression) ||
        node.expression.name.text !== "create"
      ) return;
      const factory = resolveImportedSymbol(node.expression.expression, imports);
      if (
        factory?.moduleSpecifier !== "@nestjs/core" ||
        factory.importedName !== "NestFactory"
      ) return;
      const rootModule = unwrapExpression(node.arguments[0]);
      assertTruthy(
        ts.isCallExpression(rootModule) &&
          ts.isPropertyAccessExpression(rootModule.expression) &&
          rootModule.expression.name.text === "register",
        `${relativePath} NestFactory.create root module uses register()`,
      );
      matches.push(
        `${relativePath}:${resolveControllerReference(
          rootModule.expression.expression,
          imports,
          relativePath,
        )}`,
      );
    });
  }
  assertArrayEqual(
    matches,
    [
      "apps/scenario-service/src/application.ts:" +
        "apps/scenario-service/src/app.module.ts#AppModule",
    ],
    "scenario-service Nest bootstrap call inventory",
  );
}

function censusPrivateResponseFilterControllers() {
  const sourceDirectory = path.join(repoRoot, "apps/scenario-service/src");
  const expectedFilter =
    "apps/scenario-service/src/private-response-exception.filter.ts#PrivateResponseExceptionFilter";
  const controllers = [];
  for (const absolutePath of collectTypeScriptFiles(sourceDirectory)) {
    const relativePath = toRepoRelativePath(absolutePath);
    const sourceFile = parseTypeScriptSource(relativePath, read(relativePath));
    const imports = collectImportBindings(sourceFile);
    walk(sourceFile, (node) => {
      if (!ts.isClassDeclaration(node) || !node.name) return;
      const registered = decoratorsOf(node).some((decorator) => {
        if (!isImportedDecorator(
          decorator,
          imports,
          "@nestjs/common",
          "UseFilters",
        )) return false;
        const expression = decorator.expression;
        assertTruthy(
          ts.isCallExpression(expression),
          `${relativePath} @UseFilters decorator call`,
        );
        return expression.arguments.some((argument) =>
          resolveControllerReference(argument, imports, relativePath) ===
            expectedFilter
        );
      });
      if (registered) controllers.push(`${relativePath}#${node.name.text}`);
    });
  }
  return controllers.sort();
}

function parseTypeScriptSource(relativePath, source) {
  const sourceFile = ts.createSourceFile(
    relativePath,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const diagnostics = sourceFile.parseDiagnostics ?? [];
  if (diagnostics.length > 0) {
    throw new Error(`${relativePath} contains TypeScript parse diagnostics`);
  }
  return sourceFile;
}

function collectImportBindings(sourceFile) {
  const bindings = new Map();
  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement)) continue;
    if (!ts.isStringLiteral(statement.moduleSpecifier)) continue;
    const importClause = statement.importClause;
    if (!importClause) continue;
    const moduleSpecifier = statement.moduleSpecifier.text;
    if (importClause.name) {
      bindings.set(importClause.name.text, {
        moduleSpecifier,
        importedName: "default",
      });
    }
    const namedBindings = importClause.namedBindings;
    if (namedBindings && ts.isNamespaceImport(namedBindings)) {
      bindings.set(namedBindings.name.text, {
        moduleSpecifier,
        importedName: "*",
      });
    } else if (namedBindings && ts.isNamedImports(namedBindings)) {
      for (const specifier of namedBindings.elements) {
        bindings.set(specifier.name.text, {
          moduleSpecifier,
          importedName: specifier.propertyName?.text ?? specifier.name.text,
        });
      }
    }
  }
  return bindings;
}

function resolveImportedSymbol(expression, imports) {
  const target = unwrapExpression(expression);
  if (ts.isIdentifier(target)) {
    const binding = imports.get(target.text);
    return binding?.importedName === "*" ? undefined : binding;
  }
  if (ts.isPropertyAccessExpression(target) && ts.isIdentifier(target.expression)) {
    const binding = imports.get(target.expression.text);
    if (binding?.importedName === "*" || binding?.importedName === "default") {
      return {
        moduleSpecifier: binding.moduleSpecifier,
        importedName: target.name.text,
      };
    }
  }
  if (
    ts.isElementAccessExpression(target) &&
    ts.isIdentifier(target.expression) &&
    ts.isStringLiteral(target.argumentExpression)
  ) {
    const binding = imports.get(target.expression.text);
    if (binding?.importedName === "*" || binding?.importedName === "default") {
      return {
        moduleSpecifier: binding.moduleSpecifier,
        importedName: target.argumentExpression.text,
      };
    }
  }
  return undefined;
}

function resolveControllerReference(expression, imports, currentRelativePath) {
  const target = unwrapExpression(expression);
  const imported = resolveImportedSymbol(target, imports);
  if (imported) {
    assertTruthy(
      imported.moduleSpecifier.startsWith("."),
      `${currentRelativePath} controller reference ${target.getText()} uses a local import`,
    );
    return `${resolveLocalImportPath(currentRelativePath, imported.moduleSpecifier)}#${imported.importedName}`;
  }
  if (ts.isIdentifier(target)) {
    return `${currentRelativePath}#${target.text}`;
  }
  throw new Error(
    `${currentRelativePath} controller reference ${target.getText()} has an unsupported shape`,
  );
}

function resolveLocalImportPath(currentRelativePath, moduleSpecifier) {
  const joined = path.posix.normalize(
    path.posix.join(path.posix.dirname(currentRelativePath), moduleSpecifier),
  );
  if (joined.endsWith(".js")) return `${joined.slice(0, -3)}.ts`;
  if (path.posix.extname(joined) === "") return `${joined}.ts`;
  return joined;
}

function isImportedDecorator(
  decorator,
  imports,
  moduleSpecifier,
  importedName,
) {
  const expression = ts.isCallExpression(decorator.expression)
    ? decorator.expression.expression
    : decorator.expression;
  const imported = resolveImportedSymbol(expression, imports);
  return imported?.moduleSpecifier === moduleSpecifier &&
    imported.importedName === importedName;
}

function decoratorsOf(node) {
  return ts.canHaveDecorators(node) ? ts.getDecorators(node) ?? [] : [];
}

function propertyNameText(name) {
  return ts.isIdentifier(name) || ts.isStringLiteral(name)
    ? name.text
    : undefined;
}

function unwrapExpression(expression) {
  let current = expression;
  while (
    current &&
    (ts.isParenthesizedExpression(current) ||
      ts.isAsExpression(current) ||
      ts.isTypeAssertionExpression(current) ||
      ts.isSatisfiesExpression(current))
  ) current = current.expression;
  return current;
}

function walk(node, visit) {
  visit(node);
  ts.forEachChild(node, (child) => walk(child, visit));
}

function toRepoRelativePath(absolutePath) {
  return path.relative(repoRoot, absolutePath).split(path.sep).join("/");
}

function assertThrows(run, label) {
  try {
    run();
  } catch {
    return;
  }
  throw new Error(`${label}: expected the self-check mutation to fail`);
}

function routeDecoratorBlock(source, decorator) {
  const start = source.indexOf(decorator);
  assertTruthy(start >= 0, `${decorator} controller block`);
  const next = source.indexOf("\n  @Post(", start + decorator.length);
  return source.slice(start, next < 0 ? source.length : next);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}
