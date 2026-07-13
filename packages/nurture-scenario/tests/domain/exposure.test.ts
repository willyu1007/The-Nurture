import { describe, expect, it } from "vitest";
import { buildExposureResolver } from "../../src/domain/exposure.js";
import { nurtureScenarioManifest } from "../../src/registry.js";

const resolver = buildExposureResolver(nurtureScenarioManifest.artifact_policy.exposure_levels);

describe("exposure resolver (data-driven from manifest)", () => {
  it("L1 shows all six summary types", () => {
    for (const t of nurtureScenarioManifest.artifact_policy.artifact_types) {
      expect(resolver.isVisible(t, "L1")).toEqual({ visible: true });
    }
  });

  it("L2 and L3 are disjoint independent buckets (not a ladder)", () => {
    // health_state_summary is in L3 but NOT L2.
    expect(resolver.isVisible("health_state_summary", "L3")).toEqual({ visible: true });
    expect(resolver.isVisible("health_state_summary", "L2")).toEqual({ visible: false, reason: "exposure_level_restricted" });
    // activity_comparison_summary is in L2 but NOT L3.
    expect(resolver.isVisible("activity_comparison_summary", "L2")).toEqual({ visible: true });
    expect(resolver.isVisible("activity_comparison_summary", "L3")).toEqual({ visible: false, reason: "exposure_level_restricted" });
  });

  it("L0 and L4 hide everything (ref-only)", () => {
    for (const t of nurtureScenarioManifest.artifact_policy.artifact_types) {
      expect(resolver.isVisible(t, "L0").visible).toBe(false);
      expect(resolver.isVisible(t, "L4").visible).toBe(false);
    }
  });

  it("fails closed on unknown type and unknown level", () => {
    expect(resolver.isVisible("nope", "L1")).toEqual({ visible: false, reason: "unknown_artifact_type" });
    expect(resolver.isVisible("care_plan_summary", "L9")).toEqual({ visible: false, reason: "unknown_exposure_level" });
  });
});
