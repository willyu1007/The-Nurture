// Pure, deterministic pregnancy-stage bucketing for evaluate_pregnancy_stage.
// NON-DIAGNOSTIC: coarse bucket + general non-medical preparation prompts only.
// This handler NEVER escalates and emits no PII beyond the coarse bucket.

export type PregnancyStageBucket =
  | "first_trimester"
  | "second_trimester"
  | "third_trimester"
  | "term_or_beyond"
  | "unknown_stage";

export type PregnancyStageResult = {
  bucket: PregnancyStageBucket;
  weeks?: number;
  assumption?: string;
  preparation_checklist: string[];
  non_medical_prompts: string[];
  disclaimer: string;
};

const DISCLAIMER =
  "This is general, non-medical preparation guidance only. It is not diagnosis, " +
  "not medical advice, and not a substitute for your healthcare provider.";

const CHECKLISTS: Record<PregnancyStageBucket, string[]> = {
  first_trimester: ["Note questions for your next prenatal visit.", "Plan rest and gentle daily routines.", "Set up a place to track appointments."],
  second_trimester: ["Start thinking about support at home.", "Plan time for gentle activity you enjoy.", "Begin a simple preparation checklist."],
  third_trimester: ["Pack and confirm logistics for the hospital/birth plan with your provider.", "Arrange help for the first weeks at home.", "Prepare the baby's sleeping space."],
  term_or_beyond: ["Confirm your birth plan and contacts with your provider.", "Keep your bag and transport ready.", "Line up immediate post-birth support."],
  unknown_stage: ["Confirm how many weeks along you are at your next visit.", "Keep a list of questions for your provider.", "Set up appointment tracking."],
};

const PROMPTS: Record<PregnancyStageBucket, string[]> = {
  first_trimester: ["What would make daily routines feel more manageable right now?", "Who can you lean on this month?"],
  second_trimester: ["What kind of support do you want lined up at home?", "What feels most uncertain that you'd like to prepare for?"],
  third_trimester: ["What still feels unprepared for the first weeks?", "Who is your go-to for help right after birth?"],
  term_or_beyond: ["Is everything ready for a quick departure?", "Who will help in the very first days?"],
  unknown_stage: ["When is your next prenatal visit?", "What would you most like to feel ready for?"],
};

/** Map gestational weeks to a coarse, non-diagnostic bucket. Unknown weeks -> unknown_stage. */
export const weeksToBucket = (weeks: number | undefined): PregnancyStageBucket => {
  if (weeks === undefined || Number.isNaN(weeks) || weeks < 0) return "unknown_stage";
  if (weeks <= 13) return "first_trimester";
  if (weeks <= 27) return "second_trimester";
  if (weeks <= 40) return "third_trimester";
  return "term_or_beyond";
};

export const evaluatePregnancyStage = (input: { gestational_age_weeks?: number }): PregnancyStageResult => {
  const bucket = weeksToBucket(input.gestational_age_weeks);
  return {
    bucket,
    weeks: bucket === "unknown_stage" ? undefined : input.gestational_age_weeks,
    assumption: bucket === "unknown_stage" ? "Gestational age was not available; guidance is generic." : undefined,
    preparation_checklist: CHECKLISTS[bucket],
    non_medical_prompts: PROMPTS[bucket],
    disclaimer: DISCLAIMER,
  };
};
