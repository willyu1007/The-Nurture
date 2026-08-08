import { describe, expect, it } from "vitest";
import { assertScenarioManifestV2 } from "@my-chat/workflow-contracts";
import { nurtureScenarioManifest } from "../../src/registry.js";
import {
  C30_I3_TEST_ONLY_ACTION_KEYS,
  c30I3FullGraphFixture,
} from "./full-graph.fixture.js";

describe("C30-I3 cumulative manifest convergence", () => {
  it("keeps production at the exact action-free two-capability prefix", () => {
    expect(
      nurtureScenarioManifest.scenario_contracts?.source_dependencies.map(
        ({ source_identity }) => source_identity,
      ),
    ).toEqual([
      "platform_child_family_identity_source_v1",
      "scenario_interface_source_v1",
    ]);
    expect(
      nurtureScenarioManifest.scenario_contracts?.capability_dependencies.map(
        ({ capability_key }) => capability_key,
      ),
    ).toEqual([
      "trusted_scenario_invocation_v1",
      "scenario_subject_presentation_v1",
    ]);
    expect(nurtureScenarioManifest.scenario_contracts?.domain_action_contracts).toEqual([]);
    expect(nurtureScenarioManifest.scenario_contracts?.protected_interaction_contracts).toEqual([]);
    expect(
      nurtureScenarioManifest.scenario_contracts?.product_surfaces.map((surface) => ({
        action_offer_policy: surface.action_offer_policy,
        action_keys: surface.action_keys,
      })),
    ).toEqual([{ action_offer_policy: "none", action_keys: [] }]);
  });

  it("accepts one isolated dependency-complete test fixture", () => {
    expect(() => assertScenarioManifestV2(c30I3FullGraphFixture)).not.toThrow();
    expect(
      c30I3FullGraphFixture.scenario_contracts?.capability_dependencies.map(
        ({ capability_key }) => capability_key,
      ),
    ).toEqual([
      "trusted_scenario_invocation_v1",
      "scenario_subject_presentation_v1",
      "scenario_domain_action_execution_v1",
      "scenario_protected_interaction_v1",
    ]);
    expect(
      c30I3FullGraphFixture.scenario_contracts?.domain_action_contracts.map(
        ({ action_key, driver }) => ({ action_key, driver }),
      ),
    ).toEqual([
      {
        action_key: C30_I3_TEST_ONLY_ACTION_KEYS[0],
        driver: "scenario_direct_empty_v1",
      },
      {
        action_key: C30_I3_TEST_ONLY_ACTION_KEYS[1],
        driver: "workflow_claimed_step_v1",
      },
    ]);
    expect(c30I3FullGraphFixture.scenario_contracts?.protected_interaction_contracts)
      .toHaveLength(1);
  });

  it("does not mutate or activate the production manifest", () => {
    expect(
      nurtureScenarioManifest.capabilities.every(
        (capability) => capability.enablement_policy === "disabled",
      ),
    ).toBe(true);
    expect(nurtureScenarioManifest.scenario_contracts?.domain_action_contracts).toEqual([]);
    expect(nurtureScenarioManifest.scenario_contracts?.protected_interaction_contracts).toEqual([]);
  });
});
