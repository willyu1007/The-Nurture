import { describe, expect, it } from "vitest";
import {
  CONTENT_SAFETY_RULE_REVISION,
  DIRECT_INTERACTION_MARKERS,
  REVIEW_MARKERS,
  UNRECOGNISED_MARKER_RISK_CODE,
  createContentSafetyRoutePort,
  evaluateContentSafetyRoute,
  hardRuleTier,
  isTeacherCorrectable,
  type ClassifierSignalV1,
  type ContentSafetyEvaluationInputV1,
  type ContentSafetySourceSignalV1,
} from "../../src/harness/content-safety-policy.js";

const source = (
  markers: string[],
  overrides: Partial<ContentSafetySourceSignalV1> = {},
): ContentSafetySourceSignalV1 => ({
  source_id: "capture-1",
  fact_kind: "teacher_text",
  markers,
  ...overrides,
});

const classifier = (
  overrides: Partial<ClassifierSignalV1> = {},
): ClassifierSignalV1 => ({
  provider_revision: "provider-1",
  model_revision: "model-1",
  prompt_policy_revision: "prompt-1",
  status: "ok",
  risk_codes: [],
  confidence: 0.95,
  ...overrides,
});

const evaluate = (overrides: Partial<ContentSafetyEvaluationInputV1> = {}) =>
  evaluateContentSafetyRoute({
    policy_ref: "syn-content-safety-1",
    policy_head: 2,
    sources: [source([])],
    classifier: null,
    ...overrides,
  });

describe("G3-C1 ContentSafetyPolicy hard rules", () => {
  it("routes each frozen D-15 category to its tier", () => {
    for (const marker of DIRECT_INTERACTION_MARKERS) {
      expect(hardRuleTier(marker), marker).toBe("direct_interaction_required");
      expect(evaluate({ sources: [source([marker])] }).assessment.route, marker).toBe(
        "direct_interaction_required",
      );
    }
    for (const marker of REVIEW_MARKERS) {
      expect(hardRuleTier(marker), marker).toBe("review_required");
      expect(evaluate({ sources: [source([marker])] }).assessment.route, marker).toBe(
        "review_required",
      );
    }
    expect(hardRuleTier("some_unknown_marker")).toBeUndefined();
  });

  it("raises an unrecognised marker instead of dropping it", () => {
    // A newer policy's rule key must not read as "no rule" and leave the route
    // ordinary; unknown is uncertainty, and uncertainty is correctable.
    const result = evaluate({ sources: [source(["weapon_or_hazard_not_in_this_build"])] });
    expect(result.assessment.route).toBe("review_required");
    expect(result.assessment.riskCodes).toEqual([UNRECOGNISED_MARKER_RISK_CODE]);
    // The unknown key itself never reaches the risk-code list.
    expect(result.assessment.riskCodes.join()).not.toContain("weapon_or_hazard");
  });

  it("still lets a known hard rule outrank an unrecognised one", () => {
    const result = evaluate({
      sources: [source(["unknown_key", "health_symptom"])],
    });
    expect(result.assessment.route).toBe("direct_interaction_required");
    expect(result.assessment.riskCodes.sort()).toEqual(
      [UNRECOGNISED_MARKER_RISK_CODE, "health_symptom"].sort(),
    );
  });

  it("leaves neutral deterministic content ordinary with no classifier at all", () => {
    const result = evaluate();
    expect(result.assessment.route).toBe("ordinary");
    expect(result.assessment.riskCodes).toEqual([]);
    expect(result.evidence.classifierStatus).toBe("absent");
    expect(result.assessment.ruleRevision).toBe(CONTENT_SAFETY_RULE_REVISION);
  });

  it("takes the most severe hit across every source", () => {
    const result = evaluate({
      sources: [
        source(["evaluative_wording"], { source_id: "capture-1" }),
        source(["health_symptom"], { source_id: "capture-2", fact_kind: "daily_care_log" }),
      ],
    });
    expect(result.assessment.route).toBe("direct_interaction_required");
    expect(result.assessment.riskCodes).toEqual(["evaluative_wording", "health_symptom"]);
    expect(result.evidence.sourceHeads).toEqual(["capture-1", "capture-2"]);
  });
});

describe("G3-C1 ContentSafetyPolicy layering", () => {
  it("lets an institution tighten but never loosen", () => {
    const raised = evaluate({
      sources: [source(["some_local_marker"])],
      institution: {
        policy_ref: "syn-institution-policy-1",
        policy_head: 4,
        raise_markers: { some_local_marker: "review_required" },
      },
    });
    expect(raised.assessment.route).toBe("review_required");

    // A hard direct-interaction hit stays put even if the institution only asks
    // for review.
    const cannotLower = evaluate({
      sources: [source(["health_symptom"])],
      institution: {
        policy_ref: "syn-institution-policy-1",
        policy_head: 4,
        raise_markers: { health_symptom: "review_required" },
        minimum_tier: "ordinary",
      },
    });
    expect(cannotLower.assessment.route).toBe("direct_interaction_required");
  });

  it("applies an institution minimum tier as a floor", () => {
    const result = evaluate({
      institution: {
        policy_ref: "syn-institution-policy-1",
        policy_head: 4,
        raise_markers: {},
        minimum_tier: "review_required",
      },
    });
    expect(result.assessment.route).toBe("review_required");
    expect(result.evidence.institutionTier).toBe("review_required");
  });

  it("lets a classifier raise a tier but never own the route", () => {
    const raised = evaluate({
      classifier: classifier({ risk_codes: ["body_privacy_or_toileting_imagery"] }),
    });
    expect(raised.assessment.route).toBe("direct_interaction_required");
    expect(raised.assessment.riskCodes).toContain(
      "classifier:body_privacy_or_toileting_imagery",
    );

    // A clean classifier cannot clear a hard rule.
    const cannotClear = evaluate({
      sources: [source(["injury_or_accident"])],
      classifier: classifier({ risk_codes: [] }),
    });
    expect(cannotClear.assessment.route).toBe("direct_interaction_required");
    expect(cannotClear.evidence.classifierTier).toBe("ordinary");
  });

  it("never resolves an unusable classifier to ordinary", () => {
    for (const status of ["unavailable", "malformed", "low_confidence"] as const) {
      const result = evaluate({ classifier: classifier({ status, risk_codes: [] }) });
      expect(result.assessment.route, status).toBe("review_required");
      expect(result.assessment.riskCodes, status).toContain(`classifier_unusable:${status}`);
    }
    // A confident-looking answer below the floor is treated the same way.
    const belowFloor = evaluate({
      classifier: classifier({ confidence: 0.4 }),
      classifier_confidence_floor: 0.8,
    });
    expect(belowFloor.assessment.route).toBe("review_required");
  });

  it("lets the class teacher raise a tier and re-derive gray-zone content only", () => {
    const raised = evaluate({ teacher: { raised_tier: "direct_interaction_required" } });
    expect(raised.assessment.route).toBe("direct_interaction_required");
    expect(raised.assessment.riskCodes).toContain(
      "teacher_raised:direct_interaction_required",
    );

    const grayZone = evaluate({ sources: [source(["evaluative_wording"])] });
    expect(isTeacherCorrectable(grayZone)).toBe(true);
    const hardHit = evaluate({ sources: [source(["medication_or_medical_material"])] });
    expect(isTeacherCorrectable(hardHit)).toBe(false);
  });

  it("keeps the audit body-free and free of model reasoning", () => {
    const result = evaluate({
      sources: [source(["health_symptom"], { fact_kind: "daily_care_log" })],
      classifier: classifier({ risk_codes: ["evaluative_wording"] }),
    });
    const serialized = JSON.stringify(result);
    for (const forbidden of ["chain", "reasoning", "rationale", "prompt_text", "body"]) {
      expect(serialized.toLowerCase()).not.toContain(forbidden);
    }
    expect(result.evidence.providerRevisions).toEqual({
      providerRevision: "provider-1",
      modelRevision: "model-1",
      promptPolicyRevision: "prompt-1",
    });
  });
});

describe("G3-C1 ContentSafetyRoutePort adapter", () => {
  it("derives the route the capture-to-draft lane consumes", async () => {
    const port = createContentSafetyRoutePort({
      loadSafetySignals: async () => ({
        policy_ref: "syn-content-safety-1",
        policy_head: 2,
        sources: [source(["evaluative_wording"])],
        classifier: null,
      }),
    });
    await expect(
      port.deriveRoute({
        workspace_id: "ws-1",
        care_group_id: "care-group-1",
        organizer_input_revision: "organizer-rev-1",
        source_ids: ["capture-1"],
      }),
    ).resolves.toMatchObject({ route: "review_required", policyHead: 2 });
  });

  it("returns null rather than inventing a route for unreadable sources", async () => {
    const port = createContentSafetyRoutePort({ loadSafetySignals: async () => null });
    await expect(
      port.deriveRoute({
        workspace_id: "ws-1",
        care_group_id: "care-group-1",
        organizer_input_revision: "organizer-rev-1",
        source_ids: ["capture-1"],
      }),
    ).resolves.toBeNull();
  });
});
