import {
  defaultNurtureInstitutionKnowledgeSurfaceDeps,
  type NurtureInstitutionKnowledgeSurfaceDeps,
} from "./institution-knowledge-surfaces.js";
import {
  INSTITUTION_KNOWLEDGE_ANSWER_SAFETY_DECISION_RULE_PIN_V2,
  INSTITUTION_KNOWLEDGE_ANSWER_SAFETY_SERVICE_PIN_V2,
} from "./domain/institution/institution-knowledge-answer-safety.js";

/**
 * Exact committed My-Chat checkpoint adopted by T-007 record 78. These are
 * owner contracts, not an instruction to import My-Chat source or its ORM.
 */
export const NURTURE_INSTITUTION_KNOWLEDGE_MY_CHAT_Q2_OWNER_PIN = Object.freeze({
  repository: "willyu1007/My-Chat",
  revision: "942bd009fa646a8fd82ada2e7b3c5fbc174d270e",
  retrieval_currentness_owner: Object.freeze({
    key: "my-chat.nurture-institution-knowledge-owner",
    version: "1.0.0",
    retrievalPurpose: "institution_admin_online_answer",
  }),
  source_consumer: Object.freeze({
    key: "my-chat.nurture-institution-knowledge-source-consumer",
    version: "2.0.0",
    purpose: "institution_knowledge_indexing",
  }),
  generation_owner: Object.freeze({
    key: "my-chat.nurture-institution-knowledge-generation-owner",
    version: "1.0.0",
    purpose: "institution_admin_online_answer",
    profileId: "nurture-institution-knowledge-answer-v1",
    promptTemplateId: "nurture-institution-knowledge-answer",
    promptVersion: 1,
  }),
} as const);

/**
 * Single-track E7 adapter-qualified pin. The qualification digest is isolated
 * here so a contract rotation has one runtime adoption point. This tuple does
 * not claim a live provider call and cannot enable a manifest capability.
 */
export const NURTURE_INSTITUTION_KNOWLEDGE_Q3_ADAPTER_QUALIFICATION_PIN =
  Object.freeze({
    qualification_contract: Object.freeze({
      key: "nurture.institution-knowledge-answer-safety-provider-qualification",
      version: "2.1.0",
      digest: "sha256:b2e39994e712877277b2efa49300a3cf9a8b313db0f03a64fd3ffc59fb9b5741",
    }),
    service_pins: INSTITUTION_KNOWLEDGE_ANSWER_SAFETY_SERVICE_PIN_V2,
    qualification_level: "adapter_qualified",
    live_qualified: false,
    capability_posture: "default_off",
    bitwise_determinism: false,
  } as const);

export type NurtureInstitutionKnowledgeOwnerIntegration = Readonly<{
  q2_owner_pin: unknown;
  q3_adapter_qualification_pin: unknown;
  surface_deps: NurtureInstitutionKnowledgeSurfaceDeps;
}>;

/**
 * Admit a real dependency set only when both external owner identities match
 * byte-for-byte in structure and value. Missing, extra or drifted pin fields
 * retain the immutable I2-B unavailable implementation.
 */
export function admitNurtureInstitutionKnowledgeOwnerIntegration(
  integration: NurtureInstitutionKnowledgeOwnerIntegration | undefined,
): NurtureInstitutionKnowledgeSurfaceDeps {
  try {
    if (
      !integration ||
      !exactValue(
        integration.q2_owner_pin,
        NURTURE_INSTITUTION_KNOWLEDGE_MY_CHAT_Q2_OWNER_PIN,
      ) ||
      !exactValue(
        integration.q3_adapter_qualification_pin,
        NURTURE_INSTITUTION_KNOWLEDGE_Q3_ADAPTER_QUALIFICATION_PIN,
      ) ||
      !exactValue(
        integration.surface_deps?.safetyOwner?.service_pin,
        NURTURE_INSTITUTION_KNOWLEDGE_Q3_ADAPTER_QUALIFICATION_PIN.service_pins,
      ) ||
      !exactValue(
        integration.surface_deps?.answerPolicy,
        INSTITUTION_KNOWLEDGE_ANSWER_SAFETY_DECISION_RULE_PIN_V2,
      ) ||
      !isSurfaceDeps(integration.surface_deps)
    ) {
      return defaultNurtureInstitutionKnowledgeSurfaceDeps;
    }
    return integration.surface_deps;
  } catch {
    return defaultNurtureInstitutionKnowledgeSurfaceDeps;
  }
}

function exactValue(actual: unknown, expected: unknown): boolean {
  if (actual === expected) return true;
  if (!isRecord(actual) || !isRecord(expected)) return false;
  const actualKeys = Object.keys(actual).sort();
  const expectedKeys = Object.keys(expected).sort();
  return actualKeys.length === expectedKeys.length &&
    actualKeys.every((key, index) =>
      key === expectedKeys[index] && exactValue(actual[key], expected[key]));
}

function isSurfaceDeps(value: unknown): value is NurtureInstitutionKnowledgeSurfaceDeps {
  if (!isRecord(value)) return false;
  return hasMethod(value.bindings, "resolve") &&
    hasMethod(value.commands, "execute") &&
    hasMethod(value.preview, "preview") &&
    hasMethod(value.protectedContent, "seal") &&
    hasMethod(value.adminAuthority, "authorize") &&
    hasMethod(value.retrievalOwner, "retrieveCandidates") &&
    hasMethod(value.nurtureCurrentness, "validateSources") &&
    hasMethod(value.authorityCurrentness, "validateSources") &&
    hasMethod(value.finalAuthorityCurrentness, "validateSources") &&
    isRecord(value.safetyOwner) &&
    exactValue(
      value.safetyOwner.service_pin,
      INSTITUTION_KNOWLEDGE_ANSWER_SAFETY_SERVICE_PIN_V2,
    ) &&
    hasMethod(value.safetyOwner, "evaluateRequestAndSources") &&
    hasMethod(value.safetyOwner, "validateDraft") &&
    hasMethod(value.generationOwner, "generate") &&
    hasMethod(value.conflictCandidates, "record") &&
    hasMethod(value.optionIssuer, "issue") &&
    exactValue(
      value.answerPolicy,
      INSTITUTION_KNOWLEDGE_ANSWER_SAFETY_DECISION_RULE_PIN_V2,
    );
}

function hasMethod(value: unknown, method: string): boolean {
  return isRecord(value) && typeof value[method] === "function";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
