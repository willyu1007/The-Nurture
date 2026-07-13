import { describe, expect, it } from "vitest";
import { normalizeWeights, rankActivities } from "../../src/domain/comparison-scoring.js";

describe("comparison scoring", () => {
  it("normalizes weights to sum 1", () => {
    const w = normalizeWeights({ goals: 2, cost: 2 });
    const sum = Object.values(w).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1, 6);
  });

  it("ranks higher goal/evidence and lower cost/burden first", () => {
    const res = rankActivities([
      { option_ref_id: "a", scores: { goals: 0.9, evidence: 0.8, cost: 0.1, burden: 0.1, constraints: 1 } },
      { option_ref_id: "b", scores: { goals: 0.3, evidence: 0.2, cost: 0.9, burden: 0.9, constraints: 1 } },
    ]);
    expect(res.top_option_ref_id).toBe("a");
    expect(res.ranking[0]?.option_ref_id).toBe("a");
  });

  it("re-weighting toward cost flips the ranking", () => {
    const options = [
      { option_ref_id: "rich", scores: { goals: 0.9, cost: 0.9, burden: 0.5, evidence: 0.5, constraints: 1 } },
      { option_ref_id: "cheap", scores: { goals: 0.5, cost: 0.1, burden: 0.5, evidence: 0.5, constraints: 1 } },
    ];
    const goalHeavy = rankActivities(options, { goals: 5, cost: 1, burden: 1, evidence: 1, constraints: 1 });
    const costHeavy = rankActivities(options, { goals: 1, cost: 5, burden: 1, evidence: 1, constraints: 1 });
    expect(goalHeavy.top_option_ref_id).toBe("rich");
    expect(costHeavy.top_option_ref_id).toBe("cheap");
  });

  it("disqualifies hard-constraint violations from the top spot", () => {
    const res = rankActivities([
      { option_ref_id: "best_but_illegal", scores: { goals: 1, evidence: 1, cost: 0, burden: 0, constraints: 1 }, hard_constraint_violation: true },
      { option_ref_id: "ok", scores: { goals: 0.4, evidence: 0.4, cost: 0.4, burden: 0.4, constraints: 1 } },
    ]);
    expect(res.top_option_ref_id).toBe("ok");
    expect(res.ranking.find((r) => r.option_ref_id === "best_but_illegal")?.disqualified).toBe(true);
  });

  it("is deterministic with a stable tie-break by id", () => {
    const options = [
      { option_ref_id: "z", scores: { goals: 0.5, cost: 0.5, burden: 0.5, evidence: 0.5, constraints: 0.5 } },
      { option_ref_id: "a", scores: { goals: 0.5, cost: 0.5, burden: 0.5, evidence: 0.5, constraints: 0.5 } },
    ];
    const r1 = rankActivities(options);
    const r2 = rankActivities([...options].reverse());
    expect(r1.ranking.map((r) => r.option_ref_id)).toEqual(["a", "z"]);
    expect(r2.ranking.map((r) => r.option_ref_id)).toEqual(["a", "z"]);
  });
});
