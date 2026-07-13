import { describe, expect, it } from "vitest";
import { classifySafetyIntent } from "../../src/domain/safety-classifier.js";

describe("safety classifier", () => {
  it("escalates an emergency intent (zh)", () => {
    const r = classifySafetyIntent({ normalized_intent_summary: "孩子突然抽搐、无法呼吸怎么办" });
    expect(r.requires_escalation).toBe(true);
    expect(r.overall_level).toBe("restricted");
    expect(r.reason_code).toBe("SAFETY_EMERGENCY_INTENT");
    expect(r.signals[0]?.intent_class).toBe("emergency");
  });

  it("escalates a medication-decision intent (en)", () => {
    const r = classifySafetyIntent({ normalized_intent_summary: "should I increase the dose to 20mg" });
    expect(r.requires_escalation).toBe(true);
    expect(r.reason_code).toBe("SAFETY_MEDICATION_DECISION");
  });

  it("escalates a diagnosis intent (zh)", () => {
    const r = classifySafetyIntent({ normalized_intent_summary: "他是不是得了自闭症" });
    expect(r.requires_escalation).toBe(true);
    expect(r.reason_code).toBe("SAFETY_DIAGNOSIS_INTENT");
  });

  it("escalates a prescription intent (en)", () => {
    const r = classifySafetyIntent({ normalized_intent_summary: "what medicine should I give him" });
    expect(r.requires_escalation).toBe(true);
    expect(r.reason_code).toBe("SAFETY_PRESCRIPTION_INTENT");
  });

  it("does not escalate a benign parenting intent", () => {
    const r = classifySafetyIntent({ normalized_intent_summary: "we want fewer screen-time arguments at bedtime" });
    expect(r.requires_escalation).toBe(false);
    expect(r.overall_level).toBe("none");
    expect(r.signals).toHaveLength(0);
  });

  it("flags a low health mention without escalating", () => {
    const r = classifySafetyIntent({ normalized_intent_summary: "孩子最近睡不好" });
    expect(r.requires_escalation).toBe(false);
    expect(r.overall_level).toBe("low");
    expect(r.signals[0]?.required_action).toBe("ask_safety_check");
  });

  it("limits output when the safety boundary is unacknowledged", () => {
    const r = classifySafetyIntent({ normalized_intent_summary: "general planning", safety_boundary_acknowledged: false });
    expect(r.overall_level).toBe("low");
    expect(r.signals[0]?.required_action).toBe("limit_output");
  });

  it.each([
    "I want to kill myself",
    "I want to die",
    "end my life",
    "he can't breathe",
    "she cant breathe", // apostrophe-less
    "不想活了",
  ])("escalates safety-critical phrasing %j (recall requirement)", (text) => {
    const r = classifySafetyIntent({ normalized_intent_summary: text });
    expect(r.requires_escalation).toBe(true);
    expect(r.reason_code).toBe("SAFETY_EMERGENCY_INTENT");
  });

  it("does not over-match the 想死 idiom in 想死你了", () => {
    const r = classifySafetyIntent({ normalized_intent_summary: "宝宝想死你了" });
    expect(r.requires_escalation).toBe(false);
  });

  it("caps signals at 3 and picks highest severity reason", () => {
    const r = classifySafetyIntent({
      normalized_intent_summary: "急救 抽搐, 剂量 加药, 开药, 确诊 自闭症",
    });
    expect(r.signals.length).toBeLessThanOrEqual(3);
    expect(r.reason_code).toBe("SAFETY_EMERGENCY_INTENT");
  });
});
