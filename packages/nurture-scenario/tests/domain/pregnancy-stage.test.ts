import { describe, expect, it } from "vitest";
import { evaluatePregnancyStage, weeksToBucket } from "../../src/domain/pregnancy-stage.js";

describe("pregnancy stage", () => {
  it("buckets weeks at the documented boundaries", () => {
    expect(weeksToBucket(13)).toBe("first_trimester");
    expect(weeksToBucket(14)).toBe("second_trimester");
    expect(weeksToBucket(27)).toBe("second_trimester");
    expect(weeksToBucket(28)).toBe("third_trimester");
    expect(weeksToBucket(40)).toBe("third_trimester");
    expect(weeksToBucket(41)).toBe("term_or_beyond");
  });

  it("returns unknown_stage with an explicit assumption when weeks are absent", () => {
    const r = evaluatePregnancyStage({});
    expect(r.bucket).toBe("unknown_stage");
    expect(r.assumption).toBeTruthy();
    expect(r.weeks).toBeUndefined();
  });

  it("is non-diagnostic: guidance content has no medical/diagnostic/dosing terms, disclaimer present", () => {
    const r = evaluatePregnancyStage({ gestational_age_weeks: 20 });
    expect(r.bucket).toBe("second_trimester");
    expect(r.disclaimer).toMatch(/not.*medical/i);
    // Scan only the generated guidance (NOT the disclaimer, which legitimately
    // says "not diagnosis / not medical advice").
    const content = JSON.stringify([r.preparation_checklist, r.non_medical_prompts]).toLowerCase();
    for (const banned of ["diagnos", "prescri", "dosage", "medication"]) {
      expect(content).not.toContain(banned);
    }
  });
});
