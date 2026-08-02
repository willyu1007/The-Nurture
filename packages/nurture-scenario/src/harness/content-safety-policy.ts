import type {
  ContentSafetyAssessmentV1,
  ContentSafetyRouteV1,
  ContentSafetyRoutePort,
} from "./publish-process.js";

/**
 * G3-C1 Nurture `ContentSafetyPolicy` (02-architecture.md D-15).
 *
 * Nurture owns the route. Deterministic hard rules over the exact source kinds
 * run first; an institution overlay, an optional classifier and the class
 * teacher may each only raise the tier, never lower it. A provider that is
 * unavailable, malformed, low-confidence or in conflict never resolves to
 * ordinary — correctable uncertainty goes to review instead.
 */
export const CONTENT_SAFETY_POLICY = {
  key: "nurture_content_safety_policy",
  version: "1.0.0",
} as const;

export const CONTENT_SAFETY_RULE_REVISION = "content-safety-rules-1.0.0";

/** Least to most severe; the derivation only ever moves right. */
const TIER_RANK: Record<ContentSafetyRouteV1, number> = {
  ordinary: 0,
  review_required: 1,
  direct_interaction_required: 2,
};

export type RaisableTierV1 = Exclude<ContentSafetyRouteV1, "ordinary">;

/**
 * Content that leaves the batch publication lane entirely. It is not "do not
 * tell the family": it needs explanation, a reply and a receipt, so the class
 * teacher enters T-005 explicitly with an exact child/family target.
 */
export const DIRECT_INTERACTION_MARKERS = [
  "injury_or_accident",
  "health_symptom",
  "medication_or_medical_material",
  "marked_emotional_or_behavioural_event",
  "body_privacy_or_toileting_imagery",
  "identity_document_or_contact_detail",
] as const;

/** Correctable gray zone: the teacher fixes the wording, target or source. */
export const REVIEW_MARKERS = [
  "evaluative_wording",
  "insufficient_context",
  "ambiguous_child_attribution",
  "unresolved_group_photo_exposure",
] as const;

export type DirectInteractionMarkerV1 = (typeof DIRECT_INTERACTION_MARKERS)[number];
export type ReviewMarkerV1 = (typeof REVIEW_MARKERS)[number];
export type ContentSafetyMarkerV1 = DirectInteractionMarkerV1 | ReviewMarkerV1;

const HARD_RULE_TIERS = new Map<string, RaisableTierV1>([
  ...DIRECT_INTERACTION_MARKERS.map(
    (marker) => [marker, "direct_interaction_required"] as const,
  ),
  ...REVIEW_MARKERS.map((marker) => [marker, "review_required"] as const),
]);

export const hardRuleTier = (marker: string): RaisableTierV1 | undefined =>
  HARD_RULE_TIERS.get(marker);

export type ContentSafetySourceSignalV1 = {
  source_id: string;
  fact_kind:
    | "daily_care_log"
    | "growth_record"
    | "media_photo"
    | "media_video"
    | "teacher_text"
    | "voice_transcript";
  /**
   * Deterministic markers the owner derived from the exact source. They are
   * stable rule keys, never model prose and never the source body.
   */
  markers: string[];
};

export type ClassifierSignalV1 = {
  provider_revision: string;
  model_revision: string;
  prompt_policy_revision: string;
  status: "ok" | "unavailable" | "malformed" | "low_confidence";
  risk_codes: string[];
  confidence: number;
};

/** An institution may tighten its own content bar. It can never loosen it. */
export type InstitutionSafetyOverlayV1 = {
  policy_ref: string;
  policy_head: number;
  raise_markers: Record<string, RaisableTierV1>;
  minimum_tier?: ContentSafetyTierFloorV1;
};

export type ContentSafetyTierFloorV1 = ContentSafetyRouteV1;

/** The class teacher may raise a tier; they can never clear a hard-rule hit. */
export type TeacherSafetyDeclarationV1 = {
  raised_tier?: RaisableTierV1;
};

export type ContentSafetyEvaluationInputV1 = {
  policy_ref: string;
  policy_head: number;
  sources: ContentSafetySourceSignalV1[];
  /**
   * `null` means no classifier participates at all — the deterministic path is
   * complete on its own. A present signal that failed is a different thing: it
   * means an expected opinion is missing, which is correctable uncertainty.
   */
  classifier: ClassifierSignalV1 | null;
  institution?: InstitutionSafetyOverlayV1;
  teacher?: TeacherSafetyDeclarationV1;
  classifier_confidence_floor?: number;
};

export const DEFAULT_CLASSIFIER_CONFIDENCE_FLOOR = 0.8;

export type ContentSafetyEvaluationV1 = {
  assessment: ContentSafetyAssessmentV1;
  /** Body-free audit: which layer raised the tier and why. */
  evidence: {
    hardRuleTier: ContentSafetyRouteV1;
    institutionTier: ContentSafetyRouteV1;
    classifierTier: ContentSafetyRouteV1;
    teacherTier: ContentSafetyRouteV1;
    classifierStatus: ClassifierSignalV1["status"] | "absent";
    sourceHeads: string[];
    providerRevisions?: {
      providerRevision: string;
      modelRevision: string;
      promptPolicyRevision: string;
    };
  };
};

const raise = (
  current: ContentSafetyRouteV1,
  next: ContentSafetyRouteV1,
): ContentSafetyRouteV1 => (TIER_RANK[next] > TIER_RANK[current] ? next : current);

/**
 * Derives the route. Every layer is applied through `raise`, so no ordering
 * mistake or hostile input can produce a downgrade.
 */
export const evaluateContentSafetyRoute = (
  input: ContentSafetyEvaluationInputV1,
): ContentSafetyEvaluationV1 => {
  const riskCodes = new Set<string>();

  let hardTier: ContentSafetyRouteV1 = "ordinary";
  for (const source of input.sources) {
    for (const marker of source.markers) {
      const tier = hardRuleTier(marker);
      if (!tier) continue;
      riskCodes.add(marker);
      hardTier = raise(hardTier, tier);
    }
  }

  let institutionTier: ContentSafetyRouteV1 = "ordinary";
  if (input.institution) {
    const declaredMarkers = new Set(
      input.sources.flatMap((source) => source.markers),
    );
    for (const [marker, tier] of Object.entries(input.institution.raise_markers)) {
      if (!declaredMarkers.has(marker)) continue;
      riskCodes.add(`institution:${marker}`);
      institutionTier = raise(institutionTier, tier);
    }
    if (input.institution.minimum_tier) {
      institutionTier = raise(institutionTier, input.institution.minimum_tier);
    }
  }

  let classifierTier: ContentSafetyRouteV1 = "ordinary";
  const classifierStatus = input.classifier ? input.classifier.status : "absent";
  if (input.classifier) {
    const floor = input.classifier_confidence_floor ?? DEFAULT_CLASSIFIER_CONFIDENCE_FLOOR;
    if (input.classifier.status === "ok" && input.classifier.confidence >= floor) {
      for (const code of input.classifier.risk_codes) {
        const tier = hardRuleTier(code);
        if (!tier) continue;
        riskCodes.add(`classifier:${code}`);
        classifierTier = raise(classifierTier, tier);
      }
    } else {
      // An expected opinion that did not arrive is uncertainty, not consent.
      riskCodes.add(`classifier_unusable:${input.classifier.status}`);
      classifierTier = raise(classifierTier, "review_required");
    }
  }

  let teacherTier: ContentSafetyRouteV1 = "ordinary";
  if (input.teacher?.raised_tier) {
    riskCodes.add(`teacher_raised:${input.teacher.raised_tier}`);
    teacherTier = raise(teacherTier, input.teacher.raised_tier);
  }

  const route = [institutionTier, classifierTier, teacherTier].reduce(raise, hardTier);

  return {
    assessment: {
      route,
      policyRef: input.policy_ref,
      policyHead: input.policy_head,
      ruleRevision: CONTENT_SAFETY_RULE_REVISION,
      riskCodes: [...riskCodes].sort(),
    },
    evidence: {
      hardRuleTier: hardTier,
      institutionTier,
      classifierTier,
      teacherTier,
      classifierStatus,
      sourceHeads: input.sources.map((source) => source.source_id).sort(),
      ...(input.classifier
        ? {
            providerRevisions: {
              providerRevision: input.classifier.provider_revision,
              modelRevision: input.classifier.model_revision,
              promptPolicyRevision: input.classifier.prompt_policy_revision,
            },
          }
        : {}),
    },
  };
};

/**
 * True when the class teacher's edit cannot lower the tier, because a hard rule
 * hit rather than a correctable gray-zone marker. `review_required` content may
 * be re-derived after an edit; a hard-rule hit stays out of batch publication.
 */
export const isTeacherCorrectable = (evaluation: ContentSafetyEvaluationV1): boolean =>
  evaluation.evidence.hardRuleTier !== "direct_interaction_required";

export type ContentSafetySourceReadPort = {
  loadSafetySignals(input: {
    workspace_id: string;
    care_group_id: string;
    organizer_input_revision: string;
    source_ids: string[];
  }): Promise<{
    policy_ref: string;
    policy_head: number;
    sources: ContentSafetySourceSignalV1[];
    classifier: ClassifierSignalV1 | null;
    institution?: InstitutionSafetyOverlayV1;
  } | null>;
};

/**
 * Adapts the policy into the port the capture-to-draft lane consumes. Returning
 * `null` keeps the caller failing closed; the policy never invents a route for
 * sources it could not read.
 */
export const createContentSafetyRoutePort = (
  reads: ContentSafetySourceReadPort,
): ContentSafetyRoutePort => ({
  async deriveRoute(input) {
    const signals = await reads.loadSafetySignals(input);
    if (!signals) return null;
    return evaluateContentSafetyRoute({
      policy_ref: signals.policy_ref,
      policy_head: signals.policy_head,
      sources: signals.sources,
      classifier: signals.classifier,
      ...(signals.institution ? { institution: signals.institution } : {}),
    }).assessment;
  },
});
