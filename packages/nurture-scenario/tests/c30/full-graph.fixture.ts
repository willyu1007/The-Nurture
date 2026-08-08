import type {
  ScenarioContractManifestV1,
  ScenarioManifestV2,
} from "@my-chat/workflow-contracts";
import { nurtureScenarioManifest } from "../../src/registry.js";

const ACTION_SOURCE_HASH =
  "b7c35259d03a84778cc909075a08d6b147a43a38a12cddeb875c94f01591e48d";
const PROTECTED_SOURCE_HASH =
  "78eadaf4448b61ab3629026fefe4befbb2522eccbc7e459366d1032885d90efb";

export const C30_I3_TEST_ONLY_ACTION_KEYS = [
  "fixture.neutral_direct_v1",
  "fixture.neutral_claimed_v1",
] as const;

const productionContracts = nurtureScenarioManifest.scenario_contracts;
if (!productionContracts) throw new Error("C30-I3 production contracts are required");

const fullGraphContracts = {
  ...structuredClone(productionContracts),
  source_dependencies: [
    ...structuredClone(productionContracts.source_dependencies),
    {
      source_identity: "scenario_domain_action_source_v1",
      source_hash: ACTION_SOURCE_HASH,
    },
    {
      source_identity: "scenario_protected_interaction_source_v1",
      source_hash: PROTECTED_SOURCE_HASH,
    },
  ],
  capability_dependencies: [
    ...structuredClone(productionContracts.capability_dependencies),
    {
      capability_key: "scenario_domain_action_execution_v1",
      requires_capabilities: [
        "trusted_scenario_invocation_v1",
        "scenario_subject_presentation_v1",
      ],
      requires_sources: ["scenario_domain_action_source_v1"],
    },
    {
      capability_key: "scenario_protected_interaction_v1",
      requires_capabilities: [
        "trusted_scenario_invocation_v1",
        "scenario_subject_presentation_v1",
        "scenario_domain_action_execution_v1",
      ],
      requires_sources: ["scenario_protected_interaction_source_v1"],
    },
  ],
  trusted_invocation: {
    ...structuredClone(productionContracts.trusted_invocation),
    operations: [
      ...structuredClone(productionContracts.trusted_invocation.operations),
      {
        endpoint_key: "fixture.neutral_action.prepare",
        method: "POST",
        operation_key: "prepare_domain_action",
        input_schema_key: "fixture.neutral_action.prepare.input",
        input_schema_version: 1,
        handler_key: "fixture.neutral_action.prepare.handler",
        ingress: [{
          ingress_category: "product_surface",
          ingress_key: "nurture.child_care_process_overview_v1",
          principal_origins: ["interactive_session"],
        }],
      },
      {
        endpoint_key: "fixture.neutral_protected.read",
        method: "POST",
        operation_key: "read_protected_detail",
        input_schema_key: "fixture.neutral_protected.read.input",
        input_schema_version: 1,
        handler_key: "fixture.neutral_protected.read.handler",
        ingress: [{
          ingress_category: "product_surface",
          ingress_key: "nurture.child_care_process_overview_v1",
          principal_origins: ["interactive_session"],
        }],
      },
    ],
  },
  product_surfaces: productionContracts.product_surfaces.map((surface) => ({
    ...structuredClone(surface),
    action_offer_policy: "declared_actions" as const,
    action_keys: [...C30_I3_TEST_ONLY_ACTION_KEYS],
  })),
  domain_action_contracts: [
    {
      action_contract_version: 1,
      scenario_key: "nurture",
      action_key: C30_I3_TEST_ONLY_ACTION_KEYS[0],
      input_schema_key: "fixture.neutral_direct.input",
      input_schema_version: 1,
      target_ref_class: "fixture.neutral_target",
      confirmation_class: "explicit",
      entitled_ingress_keys: ["nurture.child_care_process_overview_v1"],
      handler_key: "fixture.neutral_direct.handler",
      command_contract: {
        command_key: "fixture.neutral_direct.command",
        command_contract_version: 1,
      },
      driver: "scenario_direct_empty_v1",
    },
    {
      action_contract_version: 1,
      scenario_key: "nurture",
      action_key: C30_I3_TEST_ONLY_ACTION_KEYS[1],
      input_schema_key: "fixture.neutral_claimed.input",
      input_schema_version: 1,
      target_ref_class: "fixture.neutral_target",
      confirmation_class: "explicit",
      entitled_ingress_keys: ["nurture.child_care_process_overview_v1"],
      handler_key: "fixture.neutral_claimed.handler",
      command_contract: {
        command_key: "fixture.neutral_claimed.command",
        command_contract_version: 1,
      },
      driver: "workflow_claimed_step_v1",
    },
  ],
  protected_interaction_contracts: [{
    protected_interaction_contract_version: 1,
    scenario_key: "nurture",
    action_key: C30_I3_TEST_ONLY_ACTION_KEYS[0],
    protected_field_key: "fixture_neutral_plain_text",
    content_kind: "fixture.neutral_protected_content",
    prepare_operation_key: "prepare_domain_action",
    read_operation_key: "read_protected_detail",
    content_profile: {
      media_type: "text/plain; charset=utf-8",
      normalization: "trim_outer_whitespace_and_crlf_to_lf_v1",
      min_characters: 1,
      max_characters: 2000,
      attachments: "none",
    },
  }],
} satisfies ScenarioContractManifestV1;

/** Test-only complete graph. It is never exported by the Scenario package. */
export const c30I3FullGraphFixture: ScenarioManifestV2 = {
  ...structuredClone(nurtureScenarioManifest),
  scenario_contracts: fullGraphContracts,
};
