// Pure, IO-free medical/safety intent classifier for apply_medical_safety_gate.
// Recall-biased: a false positive (over-escalation) is acceptable; a false
// negative is not. This is the SINGLE escalation owner in the scenario.
//
// TODO(clinical-sign-off): these keyword lists are a provisional engineering
// starting point. The vetted lexicon must be owned + signed off by product /
// clinical before production use. Gate + review packet + sign-off record:
// dev-docs/active/nurture-mvp/safety-lexicon-signoff.md (status: PENDING).

export type SafetyLevel = "none" | "low" | "restricted";
export type SafetyIntentClass = "emergency" | "medication_decision" | "prescription" | "diagnosis";
export type SafetyRequiredAction = "none" | "ask_safety_check" | "limit_output" | "escalate";

export type SafetySignal = {
  signal_key: string;
  signal_type: "health_or_safety";
  level: SafetyLevel;
  intent_class?: SafetyIntentClass;
  matched_terms: string[];
  required_action: SafetyRequiredAction;
};

export type SafetyClassification = {
  signals: SafetySignal[];
  overall_level: SafetyLevel;
  requires_escalation: boolean;
  reason_code?: string;
};

export type SafetyClassifierInput = {
  normalized_intent_summary?: string;
  health_or_safety_material?: string[];
  safety_boundary_acknowledged?: boolean;
};

// Highest-severity first; the reason_code uses the highest class that hit.
const RESTRICTED_CLASSES: Array<{ intent_class: SafetyIntentClass; reason_code: string; terms: string[] }> = [
  {
    intent_class: "emergency",
    reason_code: "SAFETY_EMERGENCY_INTENT",
    terms: [
      "急救", "呼吸困难", "抽搐", "昏迷", "大量出血", "出血不止", "自杀", "自残", "轻生", "胸痛", "中毒", "窒息", "高烧不退", "失去意识", "急诊",
      // self-harm / suicidal ideation (high-recall natural phrasings; avoid bare 想死 which idioms like 想死你了 would false-match)
      "不想活", "不想活了", "了结自己", "结束生命", "自我了断",
      "emergency", "can't breathe", "cant breathe", "cannot breathe", "not breathing", "seizure", "unconscious", "overdose", "self-harm", "self harm", "hurt myself", "harm myself", "suicide", "suicidal", "kill myself", "killing myself", "want to die", "wanna die", "end my life", "ending my life", "don't want to live", "no reason to live", "bleeding heavily", "choking", "call 911", "emergency room",
    ],
  },
  {
    intent_class: "medication_decision",
    reason_code: "SAFETY_MEDICATION_DECISION",
    terms: [
      "剂量", "加药", "减药", "停药", "换药", "用药", "抗生素", "处方药", "退烧药", "吃多少", "mg", "毫克",
      "dose", "dosage", "increase the dose", "lower the dose", "stop the medication", "antibiotic", "how much medicine", "how many mg",
    ],
  },
  {
    intent_class: "prescription",
    reason_code: "SAFETY_PRESCRIPTION_INTENT",
    terms: [
      "开药", "该吃什么药", "吃什么药", "推荐药", "开点药",
      "prescribe", "what medication should", "what medicine should", "which drug",
    ],
  },
  {
    intent_class: "diagnosis",
    reason_code: "SAFETY_DIAGNOSIS_INTENT",
    terms: [
      "确诊", "是不是得了", "是什么病", "诊断", "自闭症", "多动症", "抑郁症", "焦虑症",
      "diagnose", "diagnosis", "does he have", "does she have", "is it autism", "adhd", "depression disorder",
    ],
  },
];

// Generic, non-escalating health mention.
const LOW_HEALTH_TERMS = [
  "睡不好", "发烧", "咳嗽", "肚子疼", "不舒服", "情绪", "焦虑", "压力",
  "fever", "cough", "sick", "unwell", "stomachache", "not sleeping", "stressed", "anxious",
];

// Delete apostrophes (so "can't" and "cant" normalize identically) BEFORE
// turning other punctuation into spaces. Otherwise "can't breathe" -> "can t
// breathe" never matches the very common apostrophe-less "cant breathe".
const normalize = (text: string): string =>
  text
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[\p{P}\p{S}]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

const findMatches = (haystack: string, terms: string[]): string[] => {
  const matches: string[] = [];
  for (const term of terms) {
    if (haystack.includes(normalize(term))) matches.push(term);
  }
  return matches;
};

const SIGNAL_CAP = 3;

/** Classify candidate text into safety signals. Fail-closed: no health-relevant text => level none. */
export const classifySafetyIntent = (input: SafetyClassifierInput): SafetyClassification => {
  const candidate = normalize([input.normalized_intent_summary ?? "", ...(input.health_or_safety_material ?? [])].join(" "));

  const signals: SafetySignal[] = [];
  let topReason: string | undefined;

  for (const cls of RESTRICTED_CLASSES) {
    const matched = findMatches(candidate, cls.terms);
    if (matched.length > 0) {
      signals.push({
        signal_key: cls.intent_class,
        signal_type: "health_or_safety",
        level: "restricted",
        intent_class: cls.intent_class,
        matched_terms: matched.slice(0, 5),
        required_action: "escalate",
      });
      if (!topReason) topReason = cls.reason_code; // RESTRICTED_CLASSES is severity-ordered
    }
  }

  if (signals.length === 0) {
    const lowMatched = findMatches(candidate, LOW_HEALTH_TERMS);
    const boundaryUnacknowledged = input.safety_boundary_acknowledged === false;
    if (lowMatched.length > 0 || boundaryUnacknowledged) {
      signals.push({
        signal_key: lowMatched.length > 0 ? "general_health_mention" : "boundary_unacknowledged",
        signal_type: "health_or_safety",
        level: "low",
        matched_terms: lowMatched.slice(0, 5),
        required_action: boundaryUnacknowledged ? "limit_output" : "ask_safety_check",
      });
    }
  }

  const capped = signals.slice(0, SIGNAL_CAP);
  const overall_level: SafetyLevel = capped.some((s) => s.level === "restricted")
    ? "restricted"
    : capped.some((s) => s.level === "low")
      ? "low"
      : "none";

  return {
    signals: capped,
    overall_level,
    requires_escalation: overall_level === "restricted",
    reason_code: overall_level === "restricted" ? topReason : undefined,
  };
};
