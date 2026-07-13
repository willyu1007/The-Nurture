// Pure, deterministic family_rule_trial plan derivation for generate_care_plan.
// The SAME code path serves every issue_type — only rule phrasing / metric codes
// vary by issue_type, never the structure (no per-issue hardcoded handler).

export type IssueType = "screen" | "bedtime" | "homework" | "snack" | "custom";

export type CarePlanInput = {
  issue_type: IssueType;
  requested_window_days?: number;
  // Calibration signals (0..1); low bandwidth / high overload => fewer, gentler rules.
  parent_bandwidth?: number;
  overload_risk?: number;
  non_punitive?: boolean;
  // From the safety gate (non-binding hint); restricted => low-specificity plan.
  safety_boundary_hint?: "none" | "low" | "restricted";
};

export type CarePlanRule = {
  rule_key: string;
  statement: string;
  fallback_if_missed: string;
  metric_code: string;
};

export type CarePlan = {
  baseline_payload: { issue_type: IssueType; baseline_metric_codes: string[] };
  plan_payload: {
    issue_type: IssueType;
    trial_window_days: number;
    rules: CarePlanRule[];
    specificity: "full" | "reduced" | "question_set";
    safety_boundary_hint: "none" | "low" | "restricted";
  };
  measurement_plan_payload: { metric_codes: string[]; checkpoint_cadence_days: number; checkpoints: number };
  capture_prompt_payload: { prompts: string[] };
  adjustment_conditions: string[];
};

const WINDOW_MIN = 7;
const WINDOW_MAX = 14;

export const clampWindow = (days: number | undefined): number => {
  const d = days ?? WINDOW_MAX;
  return d < WINDOW_MIN ? WINDOW_MIN : d > WINDOW_MAX ? WINDOW_MAX : Math.round(d);
};

// issue_type-specific phrasing + metric code; structure is shared.
const ISSUE_TEMPLATES: Record<IssueType, { topic: string; ruleStatements: string[]; metricCode: string }> = {
  screen: { topic: "screen time", metricCode: "family.screen.daily_minutes", ruleStatements: ["Agree a daily screen window the whole family can keep.", "Screens off 60 minutes before bed.", "One screen-free shared activity per day."] },
  bedtime: { topic: "bedtime", metricCode: "family.bedtime.conflict_count", ruleStatements: ["Keep a consistent bedtime cue at the same time.", "Wind-down routine starts 30 minutes before lights out.", "No new demands after the wind-down begins."] },
  homework: { topic: "homework", metricCode: "family.homework.on_time_rate", ruleStatements: ["A fixed homework start time on school days.", "A short break is allowed after focused work.", "Parent checks in once, not repeatedly."] },
  snack: { topic: "snacks", metricCode: "family.snack.balanced_rate", ruleStatements: ["Offer the planned snack at set times.", "Child chooses between two acceptable options.", "No bargaining for a different snack after the choice."] },
  custom: { topic: "the agreed rule", metricCode: "family.custom.adherence_rate", ruleStatements: ["Keep the agreed rule consistently.", "Use a supportive reminder, not a punishment.", "Review together if it is not working."] },
};

const BURDEN_METRIC = "workflow.burden.parent_burden";
const CONSISTENCY_METRIC = "family.consistency.rule_execution";

/** Derive a 7-14 day rule-trial plan. Bandwidth/overload cap rule count; safety hint reduces specificity. */
export const deriveCarePlan = (input: CarePlanInput): CarePlan => {
  const tmpl = ISSUE_TEMPLATES[input.issue_type];
  const window = clampWindow(input.requested_window_days);
  const hint = input.safety_boundary_hint ?? "none";

  // Rule count: low bandwidth or high overload => fewer rules (min 1, max 3).
  const lowBandwidth = (input.parent_bandwidth ?? 0.6) < 0.34;
  const highOverload = (input.overload_risk ?? 0) > 0.66;
  const maxRules = lowBandwidth || highOverload ? 1 : 3;

  const specificity: CarePlan["plan_payload"]["specificity"] = hint === "restricted" ? "question_set" : lowBandwidth || highOverload ? "reduced" : "full";

  const fallback = input.non_punitive === false ? "Note what got in the way." : "Offer a supportive reminder and note what got in the way.";

  const rules: CarePlanRule[] = tmpl.ruleStatements.slice(0, maxRules).map((statement, i) => ({
    rule_key: `${input.issue_type}_rule_${i + 1}`,
    statement,
    fallback_if_missed: fallback,
    metric_code: tmpl.metricCode,
  }));

  const checkpointCadence = window <= WINDOW_MIN ? WINDOW_MIN : Math.floor(window / 2);
  const checkpoints = Math.max(1, Math.floor(window / checkpointCadence));
  const metricCodes = [tmpl.metricCode, CONSISTENCY_METRIC, BURDEN_METRIC];

  return {
    baseline_payload: { issue_type: input.issue_type, baseline_metric_codes: metricCodes },
    plan_payload: { issue_type: input.issue_type, trial_window_days: window, rules, specificity, safety_boundary_hint: hint },
    measurement_plan_payload: { metric_codes: metricCodes, checkpoint_cadence_days: checkpointCadence, checkpoints },
    capture_prompt_payload: {
      prompts: [
        `How did ${tmpl.topic} go today? (kept / partly / not today)`,
        "Any conflict or pushback? Briefly, what happened?",
        "How heavy did this feel for the parent today? (light / ok / heavy)",
      ],
    },
    adjustment_conditions: [
      "If parent burden stays heavy for 3 days, reduce to one rule.",
      "If conflict rises vs baseline, soften the rule or shift the timing.",
      highOverload ? "Overload high: keep intensity low this cycle." : "If going well at checkpoint, hold steady.",
    ],
  };
};
