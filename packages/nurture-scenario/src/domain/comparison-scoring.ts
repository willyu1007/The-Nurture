// Pure, deterministic activity-comparison scoring for compare_activities.
// "lock the chrome": criteria are fixed; scenarios only re-weight (intervention).

export type ComparisonCriterion = "goals" | "constraints" | "cost" | "burden" | "evidence";

// Higher is better for goals/evidence; lower is better for cost/burden;
// constraints is a 0..1 satisfaction score (hard violations handled separately).
export const COMPARISON_CRITERIA: ComparisonCriterion[] = ["goals", "constraints", "cost", "burden", "evidence"];
const INVERTED: ReadonlySet<ComparisonCriterion> = new Set(["cost", "burden"]);

export type ActivityOption = {
  option_ref_id: string;
  scores: Partial<Record<ComparisonCriterion, number>>; // each in [0,1]
  hard_constraint_violation?: boolean;
};

export type CriterionWeights = Partial<Record<ComparisonCriterion, number>>;

export type RankedOption = {
  option_ref_id: string;
  total: number;
  disqualified: boolean;
  contributions: Record<ComparisonCriterion, number>;
};

export type ComparisonResult = {
  weights: Record<ComparisonCriterion, number>;
  ranking: RankedOption[];
  top_option_ref_id: string | null;
};

const DEFAULT_WEIGHT = 1;

/** Normalize weights to sum 1 over the fixed criteria; missing -> default, negatives clamped to 0. */
export const normalizeWeights = (weights: CriterionWeights | undefined): Record<ComparisonCriterion, number> => {
  // Per-criterion finite guard: a single NaN/Infinity/non-numeric value must
  // fall back to the default, not poison the whole sum (which would silently
  // discard every other weight). weight_override_payload arrives as `unknown`.
  const raw = COMPARISON_CRITERIA.map((c) => {
    const v = weights?.[c];
    return Number.isFinite(v) ? Math.max(0, v as number) : DEFAULT_WEIGHT;
  });
  const sum = raw.reduce((a, b) => a + b, 0);
  const result = {} as Record<ComparisonCriterion, number>;
  COMPARISON_CRITERIA.forEach((c, i) => {
    result[c] = sum > 0 ? raw[i]! / sum : 1 / COMPARISON_CRITERIA.length;
  });
  return result;
};

const clamp01 = (n: number): number => (n < 0 ? 0 : n > 1 ? 1 : n);

/**
 * Deterministic weighted ranking. Inverted criteria (cost/burden) count as (1 - score).
 * Hard-constraint violations are disqualified (cannot be the top recommendation).
 * Tie-break: higher total, then lexicographic option_ref_id.
 */
export const rankActivities = (options: ActivityOption[], weights?: CriterionWeights): ComparisonResult => {
  const w = normalizeWeights(weights);
  const ranking: RankedOption[] = options.map((opt) => {
    const contributions = {} as Record<ComparisonCriterion, number>;
    let total = 0;
    for (const c of COMPARISON_CRITERIA) {
      const base = clamp01(opt.scores[c] ?? 0);
      const effective = INVERTED.has(c) ? 1 - base : base;
      const contribution = effective * w[c];
      contributions[c] = contribution;
      total += contribution;
    }
    return { option_ref_id: opt.option_ref_id, total, disqualified: opt.hard_constraint_violation === true, contributions };
  });

  ranking.sort((a, b) => {
    if (a.disqualified !== b.disqualified) return a.disqualified ? 1 : -1;
    if (b.total !== a.total) return b.total - a.total;
    return a.option_ref_id < b.option_ref_id ? -1 : a.option_ref_id > b.option_ref_id ? 1 : 0;
  });

  const topEligible = ranking.find((r) => !r.disqualified);
  return { weights: w, ranking, top_option_ref_id: topEligible?.option_ref_id ?? null };
};
