import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, extname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseYaml } from "../.ai/scripts/lib/yaml-lite.mjs";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path) => readFileSync(resolve(repositoryRoot, path), "utf8");
const fail = (message) => { throw new Error(`C30-I3 default-off: ${message}`); };
const assert = (condition, message) => { if (!condition) fail(message); };
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

const manifest = parseYaml(read("packages/nurture-scenario/scenario.manifest.yaml"));
assert(manifest && typeof manifest === "object" && !Array.isArray(manifest), "invalid manifest");
const contracts = manifest.scenario_contracts;
assert(contracts && typeof contracts === "object", "scenario_contracts is absent");

const expectedSources = [
  [
    "platform_child_family_identity_source_v1",
    "9655e83ff6a973055fb1b3f170cdbcd3c3eea6cb117f59209844a2a355b6a861",
  ],
  [
    "scenario_interface_source_v1",
    "be67d3264a9442ce30a8303d6acf86a05ea86c8a3ed1d933f41c5aa922b1ff95",
  ],
];
assert(
  JSON.stringify(contracts.source_dependencies?.map(
    ({ source_identity, source_hash }) => [source_identity, source_hash],
  )) === JSON.stringify(expectedSources),
  "production source population is not the exact two-source prefix",
);

const expectedCapabilities = [
  {
    capability_key: "trusted_scenario_invocation_v1",
    requires_capabilities: [],
    requires_sources: ["scenario_interface_source_v1"],
  },
  {
    capability_key: "scenario_subject_presentation_v1",
    requires_capabilities: ["trusted_scenario_invocation_v1"],
    requires_sources: [
      "platform_child_family_identity_source_v1",
      "scenario_interface_source_v1",
    ],
  },
];
assert(
  JSON.stringify(contracts.capability_dependencies) === JSON.stringify(expectedCapabilities),
  "production contract capability population is not the exact dependency-complete prefix",
);
assert(
  Array.isArray(contracts.domain_action_contracts)
    && contracts.domain_action_contracts.length === 0,
  "production domain actions must be empty",
);
assert(
  Array.isArray(contracts.protected_interaction_contracts)
    && contracts.protected_interaction_contracts.length === 0,
  "production protected interactions must be empty",
);
assert(
  contracts.product_surfaces?.every(
    ({ action_offer_policy, action_keys }) =>
      action_offer_policy === "none" && Array.isArray(action_keys) && action_keys.length === 0,
  ),
  "production presentation must be action-free",
);
assert(
  manifest.capabilities?.every(({ enablement_policy }) => enablement_policy === "disabled"),
  "a legacy Scenario capability is enabled",
);

const expectedTrustedHandlerKeys = [
  "nurture.c30.list_subject_contexts.transport",
  "nurture.c30.resolve_subject_context.transport",
  "nurture.c30.present_subject_context.transport",
  "nurture.institution_knowledge.query.formal.v1",
  "nurture.institution_knowledge.command.prepare.formal.v1",
  "nurture.institution_knowledge.command.execute.formal.v1",
  "nurture.enrollment_journey.query.formal.v2",
  "nurture.enrollment_journey.command.prepare.formal.v3",
  "nurture.enrollment_journey.command.execute.formal.v4",
  "nurture.enrollment_journey.workflow_run_settlement.status.formal.v1",
  "nurture.enrollment_journey.workflow_run_settlement.confirm_no_effect.formal.v2",
];
assert(
  JSON.stringify(contracts.trusted_invocation.operations.map(({ handler_key }) => handler_key)) ===
    JSON.stringify(expectedTrustedHandlerKeys),
  "trusted invocation handler population drifted",
);
assert(
  JSON.stringify(manifest.surface_mapping?.web_run_workbench?.institution_knowledge) ===
    JSON.stringify({
      contract_version: "1.0.0",
      ingress_category: "host_transition",
      query_endpoint_key: "nurture.institution_knowledge.query",
      prepare_endpoint_key: "nurture.institution_knowledge.command.prepare",
      execute_endpoint_key: "nurture.institution_knowledge.command.execute",
      enablement_policy: "disabled",
    }),
  "Institution Knowledge must have one exact disabled formal Workbench mapping",
);
const enrollmentMapping = manifest.surface_mapping?.web_run_workbench?.enrollment_journey;
assert(
  JSON.stringify(manifest.surface_mapping?.chat_workflow_control?.enrollment_journey)
      === JSON.stringify(enrollmentMapping)
    && JSON.stringify(manifest.surface_mapping?.mobile_dashboard?.enrollment_journey)
      === JSON.stringify(enrollmentMapping)
    && enrollmentMapping?.enablement_policy === "disabled",
  "Enrollment Journey formal mappings must be identical and disabled across Host surfaces",
);

const c30RouteTokens = new Set([
  ...contracts.trusted_invocation.operations.map(({ endpoint_key }) => endpoint_key),
  ...contracts.trusted_invocation.operations.map(({ handler_key }) => handler_key),
  ...contracts.subject_context_providers.map(({ handler_key }) => handler_key),
  ...contracts.semantic_presentations.map(({ handler_key }) => handler_key),
]);
const c30ApplicationRouteMarkers = new Set([
  ...c30RouteTokens,
  "/internal/nurture/c30",
  "/internal/nurture/subject-context",
  "/internal/nurture/subject_context",
]);
const internalRoutes = manifest.internal_api?.routes ?? [];
assert(
  internalRoutes.every(({ path, handler_key }) =>
    !String(path).includes("/c30/")
    && !String(path).includes("/subject-context")
    && !c30RouteTokens.has(handler_key)),
  "a C30 production internal route is populated",
);

const sourceFiles = (root) => {
  const absoluteRoot = resolve(repositoryRoot, root);
  const walk = (directory) => readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) => {
      const absolute = resolve(directory, entry.name);
      if (entry.isDirectory()) return walk(absolute);
      return [absolute];
    });
  return walk(absoluteRoot)
    .filter((path) => [".ts", ".mts", ".js", ".mjs"].includes(extname(path)))
    .sort();
};

const applicationSource = [...sourceFiles("apps/scenario-service/src")];
const positiveRouteHits = [];
for (const absolutePath of applicationSource) {
  const source = readFileSync(absolutePath, "utf8");
  for (const token of c30ApplicationRouteMarkers) {
    if (source.includes(token)) {
      positiveRouteHits.push(`${relative(repositoryRoot, absolutePath)}:${token}`);
    }
  }
}
assert(positiveRouteHits.length === 0, `positive C30 route registration: ${positiveRouteHits.join(", ")}`);

const moduleSource = read("packages/nurture-scenario/src/module.ts");
assert(
  (moduleSource.match(/export const nurtureScenarioModule\b/gu) ?? []).length === 1,
  "production must export exactly one canonical module",
);
for (const forbidden of [
  "createNurtureActivationScenarioModule",
  "createNurturePreactivationScenarioModule",
  "scenario_domain_action_execution_v1",
  "scenario_protected_interaction_v1",
]) {
  assert(!moduleSource.includes(forbidden), `module contains forbidden production population ${forbidden}`);
}

const prismaSchema = read("prisma/schema.prisma");
assert(!prismaSchema.includes("ScenarioWorkspaceActivation"), "Workspace activation model exists");
assert(!prismaSchema.includes("ScenarioCapabilityActivation"), "capability activation model exists");

const productionC30Sources = sourceFiles("packages/nurture-scenario/src")
  .filter((path) => !path.includes("/generated/"));
for (const absolutePath of productionC30Sources) {
  const source = readFileSync(absolutePath, "utf8");
  assert(
    !source.includes("fixture.neutral_direct_v1")
      && !source.includes("fixture.neutral_claimed_v1"),
    `test-only declaration escaped into ${relative(repositoryRoot, absolutePath)}`,
  );
  for (const forbidden of [
    "@my-chat/db",
    "@my-chat/workflow-runtime",
    "@my-chat/workers",
    "@prisma/client",
  ]) {
    assert(
      !source.includes(forbidden),
      `${relative(repositoryRoot, absolutePath)} imports forbidden owner dependency ${forbidden}`,
    );
  }
}
assert(
  !/from\s+["'][^"']*\/protected-content(?:\.js)?["']/u.test(
    read("packages/nurture-scenario/src/c30/protected-content.ts"),
  ),
  "C30 protected owner imports the legacy fallback",
);
assert(
  !read("packages/nurture-scenario/src/c30/canonical-action.ts")
    .includes("capture_family_input"),
  "C30 canonical action aliases the legacy product action",
);

const evidence = {
  production_contract_capabilities: contracts.capability_dependencies.length,
  production_domain_actions: contracts.domain_action_contracts.length,
  production_protected_interactions: contracts.protected_interaction_contracts.length,
  production_action_offers: contracts.product_surfaces
    .flatMap(({ action_keys }) => action_keys).length,
  enabled_manifest_capabilities: manifest.capabilities
    .filter(({ enablement_policy }) => enablement_policy !== "disabled").length,
  trusted_invocation_handlers: contracts.trusted_invocation.operations.length,
  positive_c30_internal_routes: internalRoutes.filter(({ handler_key }) =>
    c30RouteTokens.has(handler_key)).length,
  positive_c30_application_registrations: positiveRouteHits.length,
  workspace_activation_models: Number(
    prismaSchema.includes("ScenarioWorkspaceActivation")
      || prismaSchema.includes("ScenarioCapabilityActivation"),
  ),
};
const evidenceHash = sha256(`${JSON.stringify(evidence)}\n`);
console.log(`C30-I3 default-off census ok: ${evidenceHash}`);
console.log(JSON.stringify(evidence));
