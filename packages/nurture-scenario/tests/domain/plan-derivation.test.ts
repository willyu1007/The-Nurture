import { describe, expect, it } from "vitest";
import { clampWindow, deriveCarePlan } from "../../src/domain/plan-derivation.js";

describe("plan derivation", () => {
  it("clamps the trial window to [7,14]", () => {
    expect(clampWindow(3)).toBe(7);
    expect(clampWindow(30)).toBe(14);
    expect(clampWindow(10)).toBe(10);
    expect(clampWindow(undefined)).toBe(14);
  });

  it("drives two issue_types through the same structure (shared schema, not hardcoded)", () => {
    const screen = deriveCarePlan({ issue_type: "screen" });
    const bedtime = deriveCarePlan({ issue_type: "bedtime" });
    // Same structure / keys, differing only in content.
    expect(Object.keys(screen)).toEqual(Object.keys(bedtime));
    expect(screen.plan_payload.rules.length).toBeGreaterThan(0);
    expect(bedtime.plan_payload.rules.length).toBeGreaterThan(0);
    expect(screen.baseline_payload.baseline_metric_codes[0]).toContain("screen");
    expect(bedtime.baseline_payload.baseline_metric_codes[0]).toContain("bedtime");
  });

  it("reduces to a single gentle rule under low bandwidth / high overload", () => {
    const plan = deriveCarePlan({ issue_type: "bedtime", parent_bandwidth: 0.2, overload_risk: 0.9, requested_window_days: 14 });
    expect(plan.plan_payload.rules).toHaveLength(1);
    expect(plan.plan_payload.specificity).toBe("reduced");
  });

  it("produces a question_set (low specificity) when a restricted safety hint is present", () => {
    const plan = deriveCarePlan({ issue_type: "homework", safety_boundary_hint: "restricted" });
    expect(plan.plan_payload.specificity).toBe("question_set");
  });

  it("keeps supportive fallbacks and a checkpoint cadence", () => {
    const plan = deriveCarePlan({ issue_type: "snack", parent_bandwidth: 0.7, requested_window_days: 14 });
    expect(plan.plan_payload.rules.every((r) => r.fallback_if_missed.length > 0)).toBe(true);
    expect(plan.measurement_plan_payload.checkpoints).toBeGreaterThanOrEqual(1);
    expect(plan.measurement_plan_payload.metric_codes).toContain("workflow.burden.parent_burden");
  });
});
