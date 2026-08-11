import { createHash } from "node:crypto";
import type { CanonicalRef } from "@my-chat/workflow-contracts";
import { canonicalJsonV1 } from "../commands/command-kernel.js";
import {
  INSTITUTION_KNOWLEDGE_CONFLICT_CLASSES,
  type InstitutionKnowledgeConflictCandidateRecorderV1,
  type NurtureInstitutionKnowledgeConflictFindingV1,
  type NurtureInstitutionKnowledgeExactSourceTupleV1,
} from "./institution-knowledge-conflict-candidate.js";
import {
  retrieveCurrentInstitutionKnowledgeCandidates,
  validateInstitutionKnowledgeOnlineQuery,
  type InstitutionKnowledgeOnlineQueryV1,
  type InstitutionKnowledgeRetrievalOwnerPortV1,
  type NurtureAuthorityKnowledgeSourceCurrentnessProviderV1,
  type NurtureInstitutionAdminKnowledgeAuthorityV1,
  type NurtureInstitutionKnowledgeOnlineContextV1,
  type NurtureInstitutionKnowledgeRetrievalCandidateV1,
  type NurtureInstitutionKnowledgeSourceCurrentnessProviderV1,
} from "./institution-knowledge-retrieval.js";

export const INSTITUTION_KNOWLEDGE_ANSWER_SAFETY_CONTRACT = {
  key: "nurture.institution-knowledge-answer-safety",
  version: "2.0.0",
} as const;

export const INSTITUTION_KNOWLEDGE_CLAIM_KINDS = [
  "institution_process",
  "developmental_guidance",
  "care_guidance",
  "medical_fact",
  "first_aid_action",
  "danger_signal",
] as const;

export type InstitutionKnowledgeClaimKind =
  (typeof INSTITUTION_KNOWLEDGE_CLAIM_KINDS)[number];

export const INSTITUTION_KNOWLEDGE_SAFETY_REASONS = [
  "child_specific_or_private_fact",
  "person_specific_diagnosis",
  "prescriptive_medication_or_dose",
  "emergency_replacement",
  "unsupported_deterministic_step",
] as const;

export type InstitutionKnowledgeSafetyReason =
  (typeof INSTITUTION_KNOWLEDGE_SAFETY_REASONS)[number];

export const INSTITUTION_KNOWLEDGE_SAFETY_NOTICE_KEYS = [
  "not_a_diagnosis",
  "not_a_prescription",
  "not_emergency_replacement",
  "seek_qualified_medical_help",
  "remove_child_specific_details",
] as const;

export type InstitutionKnowledgeSafetyNoticeKey =
  (typeof INSTITUTION_KNOWLEDGE_SAFETY_NOTICE_KEYS)[number];

export type InstitutionKnowledgeSafetyNoticeV1 = {
  reason_keys: InstitutionKnowledgeSafetyNoticeKey[];
};

export type InstitutionKnowledgeSafetySourceV1 =
  NurtureInstitutionKnowledgeExactSourceTupleV1 & {
    candidate_ref: string;
    source_owner: "nurture" | "my_chat";
    source_kind: "nurture_institution_revision" | "authority_source";
    excerpt: string;
  };

type SafetyDecisionIdentity = {
  rule_set_ref: string;
  rule_version: string;
  decision_fingerprint: string;
};

export type InstitutionKnowledgeRequestSafetyDecisionV1 =
  | ({ status: "general_clear" | "medical_clear" } & SafetyDecisionIdentity)
  | ({ status: "unsafe_request"; reason_codes: InstitutionKnowledgeSafetyReason[] } &
      SafetyDecisionIdentity)
  | ({
      status: "material_source_conflict";
      findings: NurtureInstitutionKnowledgeConflictFindingV1[];
    } & SafetyDecisionIdentity)
  | { status: "unavailable" };

export type InstitutionKnowledgeDraftSafetyDecisionV1 =
  | ({ status: "safe" } & SafetyDecisionIdentity)
  | ({ status: "unsafe"; reason_codes: InstitutionKnowledgeSafetyReason[] } &
      SafetyDecisionIdentity)
  | { status: "unavailable" };

export type InstitutionKnowledgeGenerationClaimDraftV1 = {
  text: string;
  claim_kind: InstitutionKnowledgeClaimKind;
  candidate_refs: string[];
};

export type InstitutionKnowledgeGenerationDraftV1 = {
  generation_ref: string;
  input_digest: string;
  generated_at: string;
  assistance_kind: "ai_generated_with_retrieved_sources";
  claims: InstitutionKnowledgeGenerationClaimDraftV1[];
};

export const INSTITUTION_KNOWLEDGE_ANSWER_SAFETY_SERVICE_PIN_V2 = Object.freeze({
  gateway_id: "my-chat-llm-gateway",
  gateway_version: "1.0.0",
  provider_id: "aliyun-bailian",
  provider_api_version: "dashscope-compatible-api-v1",
  model_id: "qwen-plus-2025-12-01",
  model_version: "2025-12-01",
  deployment_id: "aliyun-bailian-cn-qwen-plus-2025-12-01",
  prompt_template_id: "nurture-institution-knowledge-safety",
  prompt_version: "1",
  owner_contract_key: "my-chat.nurture-institution-knowledge-answer-safety-owner",
  owner_contract_version: "2.0.0",
  answer_safety_contract_key: "nurture.institution-knowledge-answer-safety",
  answer_safety_contract_version: "2.0.0",
} as const);

export const INSTITUTION_KNOWLEDGE_ANSWER_SAFETY_DECISION_RULE_PIN_V2 =
  Object.freeze({
    answer_policy_version: "1.0.0",
    rule_set_ref: "nurture-institution-answer-safety-service",
    rule_version: "1.0.0",
  } as const);

export type InstitutionKnowledgeAnswerSafetyOwnerPortV2 = {
  readonly service_pin: typeof INSTITUTION_KNOWLEDGE_ANSWER_SAFETY_SERVICE_PIN_V2;
  evaluateRequestAndSources(input: {
    rule_set_ref: string;
    rule_version: string;
    workspace_id: string;
    institution_ref: string;
    purpose: "institution_admin_online_answer";
    question: string;
    sources: InstitutionKnowledgeSafetySourceV1[];
  }): Promise<InstitutionKnowledgeRequestSafetyDecisionV1>;
  validateDraft(input: {
    rule_set_ref: string;
    rule_version: string;
    workspace_id: string;
    institution_ref: string;
    purpose: "institution_admin_online_answer";
    generation_ref: string;
    claims: InstitutionKnowledgeGenerationClaimDraftV1[];
    sources: InstitutionKnowledgeSafetySourceV1[];
  }): Promise<InstitutionKnowledgeDraftSafetyDecisionV1>;
};

export type InstitutionKnowledgeGenerationOwnerPortV1 = {
  generate(input: {
    workspace_id: string;
    institution_ref: string;
    invocation_ref: string;
    purpose: "institution_admin_online_answer";
    answer_policy_version: string;
    input_digest: string;
    question: string;
    candidates: NurtureInstitutionKnowledgeRetrievalCandidateV1[];
  }): Promise<
    | { status: "resolved"; draft: InstitutionKnowledgeGenerationDraftV1 }
    | { status: "unavailable" }
  >;
};

export const INSTITUTION_KNOWLEDGE_AUTHORITY_CITATION_DENIAL_REASONS = [
  "scope_denied",
  "source_not_current",
  "source_not_readable",
  "content_drift",
] as const;

type AuthorityCitationDenialReason =
  (typeof INSTITUTION_KNOWLEDGE_AUTHORITY_CITATION_DENIAL_REASONS)[number];

type AuthorityCitationCurrentnessDecision = NurtureInstitutionKnowledgeExactSourceTupleV1 &
  (
    | { decision: "eligible" }
    | { decision: "denied"; reason_code: AuthorityCitationDenialReason }
    | { decision: "unavailable" }
  );

export type InstitutionKnowledgeAuthorityCitationCurrentnessOwnerPortV1 = {
  validateSources(input: {
    context: NurtureInstitutionKnowledgeOnlineContextV1;
    sources: NurtureInstitutionKnowledgeExactSourceTupleV1[];
  }): Promise<
    | { status: "resolved"; decisions: AuthorityCitationCurrentnessDecision[] }
    | { status: "unavailable" }
  >;
};

type CitationCommon = NurtureInstitutionKnowledgeExactSourceTupleV1 & {
  citation_ref: string;
  title: string;
  excerpt: string;
  open_ref?: string;
};

export type InstitutionKnowledgeCitationV1 =
  | (CitationCommon & {
      source_kind: "institution_material";
      label: "园区材料";
      provenance_kind: "institution_authored";
      item_ref: string;
      revision_ref: string;
      revision_number: number;
      publication_event_ref: CanonicalRef;
      published_at: string;
    })
  | (CitationCommon & {
      source_kind: "authority_source";
      label: "权威来源";
      provenance_kind: "authority_source";
      publisher: string;
      source_date: string;
    });

export type InstitutionKnowledgeClaimV1 = {
  text: string;
  claim_kind: InstitutionKnowledgeClaimKind;
  citation_refs: string[];
};

type AnswerProvenance = {
  generation_ref: string;
  generated_at: string;
  assistance_kind: "ai_generated_with_retrieved_sources";
};

export type InstitutionKnowledgeAnswerResultV1 =
  | ({
      status: "answered";
      contract_version: typeof INSTITUTION_KNOWLEDGE_ANSWER_SAFETY_CONTRACT.version;
      claims: InstitutionKnowledgeClaimV1[];
      citations: InstitutionKnowledgeCitationV1[];
      safety_notice?: InstitutionKnowledgeSafetyNoticeV1;
    } & AnswerProvenance)
  | {
      status: "abstained_no_source" | "abstained_source_changed";
      contract_version: typeof INSTITUTION_KNOWLEDGE_ANSWER_SAFETY_CONTRACT.version;
    }
  | {
      status: "abstained_medical_conflict";
      contract_version: typeof INSTITUTION_KNOWLEDGE_ANSWER_SAFETY_CONTRACT.version;
      conflicts: Array<{
        conflict_class: NurtureInstitutionKnowledgeConflictFindingV1["conflict_class"];
        finding_fingerprint: string;
        candidate_ref: string;
        citation_refs: string[];
      }>;
      citations: InstitutionKnowledgeCitationV1[];
      safety_notice: InstitutionKnowledgeSafetyNoticeV1;
    }
  | {
      status: "abstained_safety";
      contract_version: typeof INSTITUTION_KNOWLEDGE_ANSWER_SAFETY_CONTRACT.version;
      reason_codes: InstitutionKnowledgeSafetyReason[];
      safety_notice: InstitutionKnowledgeSafetyNoticeV1;
    };

export type InstitutionKnowledgePortableAnswerV1 = {
  contract_version: typeof INSTITUTION_KNOWLEDGE_ANSWER_SAFETY_CONTRACT.version;
  claims: InstitutionKnowledgeClaimV1[];
  citations: InstitutionKnowledgeCitationV1[];
  safety_notice?: InstitutionKnowledgeSafetyNoticeV1;
} & AnswerProvenance;

export type InstitutionKnowledgeAnswerOperationResultV1 =
  | { status: "resolved"; result: InstitutionKnowledgeAnswerResultV1 }
  | { status: "denied" }
  | { status: "unavailable" };

const HASH_PATTERN = /^[0-9a-f]{64}$/;
const REF_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/;
const VERSION_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:+-]{0,199}$/;
const MEDICAL_CLAIMS = new Set<InstitutionKnowledgeClaimKind>([
  "medical_fact",
  "first_aid_action",
  "danger_signal",
]);

const exactKeys = (
  value: object,
  required: readonly string[],
  optional: readonly string[] = [],
): boolean => {
  const keys = Object.keys(value);
  return required.every((key) => keys.includes(key)) &&
    keys.every((key) => required.includes(key) || optional.includes(key));
};

const validInstant = (value: string): boolean =>
  !Number.isNaN(Date.parse(value)) && new Date(value).toISOString() === value;

const sourceTuple = (
  candidate: NurtureInstitutionKnowledgeRetrievalCandidateV1,
): NurtureInstitutionKnowledgeExactSourceTupleV1 => ({
  source_ref: candidate.source_ref,
  source_version: candidate.source_version,
  content_hash: candidate.content_hash,
});

const sourceKey = (source: NurtureInstitutionKnowledgeExactSourceTupleV1): string =>
  canonicalJsonV1([source.source_ref, source.source_version, source.content_hash]);

const safetySource = (
  candidate: NurtureInstitutionKnowledgeRetrievalCandidateV1,
): InstitutionKnowledgeSafetySourceV1 => ({
  ...sourceTuple(candidate),
  candidate_ref: candidate.candidate_ref,
  source_owner: candidate.source_owner,
  source_kind: candidate.source_kind,
  excerpt: candidate.excerpt,
});

const validDecisionIdentity = (
  value: SafetyDecisionIdentity,
  ruleSetRef: string,
  ruleVersion: string,
): boolean =>
  value.rule_set_ref === ruleSetRef &&
  value.rule_version === ruleVersion &&
  HASH_PATTERN.test(value.decision_fingerprint);

const validReasonCodes = (value: InstitutionKnowledgeSafetyReason[]): boolean =>
  value.length >= 1 &&
  value.length <= INSTITUTION_KNOWLEDGE_SAFETY_REASONS.length &&
  value.every((reason) => INSTITUTION_KNOWLEDGE_SAFETY_REASONS.includes(reason)) &&
  new Set(value).size === value.length;

const validFinding = (
  value: NurtureInstitutionKnowledgeConflictFindingV1,
  candidateSourceKeys: ReadonlySet<string>,
): boolean =>
  exactKeys(value, ["conflict_class", "finding_fingerprint", "sources"]) &&
  INSTITUTION_KNOWLEDGE_CONFLICT_CLASSES.includes(value.conflict_class) &&
  HASH_PATTERN.test(value.finding_fingerprint) &&
  value.sources.length >= 2 &&
  value.sources.length <= 8 &&
  value.sources.every(
    (source) =>
      exactKeys(source, ["source_ref", "source_version", "content_hash"]) &&
      VERSION_PATTERN.test(source.source_version) &&
      HASH_PATTERN.test(source.content_hash) &&
      candidateSourceKeys.has(sourceKey(source)),
  ) &&
  new Set(value.sources.map(sourceKey)).size === value.sources.length;

const validRequestSafetyDecision = (input: {
  value: InstitutionKnowledgeRequestSafetyDecisionV1;
  rule_set_ref: string;
  rule_version: string;
  candidate_source_keys: ReadonlySet<string>;
}): boolean => {
  const value = input.value;
  if (value.status === "unavailable") return exactKeys(value, ["status"]);
  if (!validDecisionIdentity(value, input.rule_set_ref, input.rule_version)) return false;
  if (value.status === "general_clear" || value.status === "medical_clear") {
    return exactKeys(value, ["status", "rule_set_ref", "rule_version", "decision_fingerprint"]);
  }
  if (value.status === "unsafe_request") {
    return exactKeys(value, [
      "status", "rule_set_ref", "rule_version", "decision_fingerprint", "reason_codes",
    ]) && validReasonCodes(value.reason_codes);
  }
  if (value.status !== "material_source_conflict") return false;
  return exactKeys(value, [
    "status", "rule_set_ref", "rule_version", "decision_fingerprint", "findings",
  ]) &&
    value.findings.length >= 1 &&
    value.findings.length <= 8 &&
    value.findings.every((finding) => validFinding(finding, input.candidate_source_keys)) &&
    new Set(value.findings.map((finding) => finding.finding_fingerprint)).size ===
      value.findings.length;
};

const validDraftSafetyDecision = (input: {
  value: InstitutionKnowledgeDraftSafetyDecisionV1;
  rule_set_ref: string;
  rule_version: string;
}): boolean => {
  const value = input.value;
  if (value.status === "unavailable") return exactKeys(value, ["status"]);
  if (!validDecisionIdentity(value, input.rule_set_ref, input.rule_version)) return false;
  if (value.status === "safe") {
    return exactKeys(value, ["status", "rule_set_ref", "rule_version", "decision_fingerprint"]);
  }
  return exactKeys(value, [
    "status", "rule_set_ref", "rule_version", "decision_fingerprint", "reason_codes",
  ]) && validReasonCodes(value.reason_codes);
};

const validDraft = (input: {
  value: InstitutionKnowledgeGenerationDraftV1;
  input_digest: string;
  candidate_refs: ReadonlySet<string>;
}): boolean => {
  const value = input.value;
  if (
    !exactKeys(value, [
      "generation_ref", "input_digest", "generated_at", "assistance_kind", "claims",
    ]) ||
    !REF_PATTERN.test(value.generation_ref) ||
    value.input_digest !== input.input_digest ||
    !validInstant(value.generated_at) ||
    value.assistance_kind !== "ai_generated_with_retrieved_sources" ||
    value.claims.length < 1 ||
    value.claims.length > 8
  ) return false;
  return value.claims.every((claim) =>
    exactKeys(claim, ["text", "claim_kind", "candidate_refs"]) &&
    claim.text.trim().length > 0 &&
    claim.text.length <= 800 &&
    Buffer.byteLength(claim.text, "utf8") <= 3_200 &&
    INSTITUTION_KNOWLEDGE_CLAIM_KINDS.includes(claim.claim_kind) &&
    claim.candidate_refs.length >= 1 &&
    claim.candidate_refs.length <= 4 &&
    claim.candidate_refs.every((ref) => input.candidate_refs.has(ref)) &&
    new Set(claim.candidate_refs).size === claim.candidate_refs.length,
  );
};

const safetyNotice = (
  reasons: readonly InstitutionKnowledgeSafetyReason[],
): InstitutionKnowledgeSafetyNoticeV1 => {
  const keys = new Set<InstitutionKnowledgeSafetyNoticeKey>();
  for (const reason of reasons) {
    if (reason === "child_specific_or_private_fact") keys.add("remove_child_specific_details");
    if (reason === "person_specific_diagnosis") keys.add("not_a_diagnosis");
    if (reason === "prescriptive_medication_or_dose") keys.add("not_a_prescription");
    if (reason === "emergency_replacement") keys.add("not_emergency_replacement");
    if (reason !== "child_specific_or_private_fact") keys.add("seek_qualified_medical_help");
  }
  return {
    reason_keys: INSTITUTION_KNOWLEDGE_SAFETY_NOTICE_KEYS.filter((key) => keys.has(key)),
  };
};

const medicalNotice = (): InstitutionKnowledgeSafetyNoticeV1 => ({
  reason_keys: [
    "not_a_diagnosis",
    "not_a_prescription",
    "not_emergency_replacement",
    "seek_qualified_medical_help",
  ],
});

const authorizeAdmin = async (
  authority: NurtureInstitutionAdminKnowledgeAuthorityV1,
  context: NurtureInstitutionKnowledgeOnlineContextV1,
): Promise<"authorized" | "denied" | "unavailable"> => {
  try {
    return await authority.authorize(context);
  } catch {
    return "unavailable";
  }
};

type FinalCurrentness =
  | { status: "eligible" }
  | { status: "changed" }
  | { status: "denied" }
  | { status: "unavailable" };

const exactOrderedDecisions = (
  sources: readonly NurtureInstitutionKnowledgeExactSourceTupleV1[],
  decisions: readonly NurtureInstitutionKnowledgeExactSourceTupleV1[],
): boolean =>
  decisions.length === sources.length &&
  decisions.every((decision, index) => sourceKey(decision) === sourceKey(sources[index]!));

const validateFinalCurrentness = async (input: {
  context: NurtureInstitutionKnowledgeOnlineContextV1;
  candidates: NurtureInstitutionKnowledgeRetrievalCandidateV1[];
  nurture_currentness: NurtureInstitutionKnowledgeSourceCurrentnessProviderV1;
  authority_currentness: InstitutionKnowledgeAuthorityCitationCurrentnessOwnerPortV1;
}): Promise<FinalCurrentness> => {
  const nurtureSources = input.candidates
    .filter((candidate) => candidate.source_owner === "nurture")
    .map(sourceTuple);
  const authoritySources = input.candidates
    .filter((candidate) => candidate.source_owner === "my_chat")
    .map(sourceTuple);
  try {
    if (nurtureSources.length > 0) {
      const result = await input.nurture_currentness.validateSources({
        context: input.context,
        sources: nurtureSources,
      });
      if (result.status === "denied") return { status: "denied" };
      if (result.status === "unavailable") return { status: "unavailable" };
      if (!exactOrderedDecisions(nurtureSources, result.decisions)) {
        return { status: "unavailable" };
      }
      if (result.decisions.some(
        (decision) => decision.decision !== "eligible" && decision.decision !== "denied",
      )) return { status: "unavailable" };
      if (result.decisions.some((decision) => decision.decision === "denied")) {
        return { status: "changed" };
      }
    }
    if (authoritySources.length > 0) {
      const result = await input.authority_currentness.validateSources({
        context: input.context,
        sources: authoritySources,
      });
      if (result.status === "unavailable") return { status: "unavailable" };
      if (
        !exactOrderedDecisions(authoritySources, result.decisions) ||
        result.decisions.some((decision) => {
          if (decision.decision === "eligible") {
            return !exactKeys(decision, [
              "source_ref", "source_version", "content_hash", "decision",
            ]);
          }
          if (decision.decision === "unavailable") {
            return !exactKeys(decision, [
              "source_ref", "source_version", "content_hash", "decision",
            ]);
          }
          return !exactKeys(decision, [
            "source_ref", "source_version", "content_hash", "decision", "reason_code",
          ]) || !INSTITUTION_KNOWLEDGE_AUTHORITY_CITATION_DENIAL_REASONS.includes(
            decision.reason_code,
          );
        })
      ) return { status: "unavailable" };
      if (result.decisions.some((decision) => decision.decision === "unavailable")) {
        return { status: "unavailable" };
      }
      if (result.decisions.some((decision) => decision.decision === "denied")) {
        return { status: "changed" };
      }
    }
  } catch {
    return { status: "unavailable" };
  }
  return { status: "eligible" };
};

const citationFrom = (
  candidate: NurtureInstitutionKnowledgeRetrievalCandidateV1,
  citationRef: string,
): InstitutionKnowledgeCitationV1 | null => {
  if (
    candidate.excerpt.length > 600 ||
    Buffer.byteLength(candidate.excerpt, "utf8") > 2_400
  ) return null;
  const common = {
    ...sourceTuple(candidate),
    citation_ref: citationRef,
    title: candidate.title,
    excerpt: candidate.excerpt,
    ...(candidate.open_ref ? { open_ref: candidate.open_ref } : {}),
  };
  return candidate.source_owner === "nurture"
    ? {
        ...common,
        source_kind: "institution_material",
        label: "园区材料",
        provenance_kind: "institution_authored",
        item_ref: candidate.item_ref,
        revision_ref: candidate.revision_ref,
        revision_number: candidate.revision_number,
        publication_event_ref: candidate.publication_event_ref,
        published_at: candidate.published_at,
      }
    : {
        ...common,
        source_kind: "authority_source",
        label: "权威来源",
        provenance_kind: "authority_source",
        publisher: candidate.publisher,
        source_date: candidate.source_date,
      };
};

const citationsFor = (
  candidates: readonly NurtureInstitutionKnowledgeRetrievalCandidateV1[],
): InstitutionKnowledgeCitationV1[] | null => {
  const citations = candidates.map((candidate, index) =>
    citationFrom(candidate, `citation-${index + 1}`),
  );
  return citations.some((citation) => citation === null)
    ? null
    : citations as InstitutionKnowledgeCitationV1[];
};

const resolved = (
  result: InstitutionKnowledgeAnswerResultV1,
): InstitutionKnowledgeAnswerOperationResultV1 => ({ status: "resolved", result });

const abstained = (
  status: "abstained_no_source" | "abstained_source_changed",
): InstitutionKnowledgeAnswerOperationResultV1 => resolved({
  status,
  contract_version: INSTITUTION_KNOWLEDGE_ANSWER_SAFETY_CONTRACT.version,
});

const generationInputDigest = (input: {
  context: NurtureInstitutionKnowledgeOnlineContextV1;
  answer_policy_version: string;
  question: string;
  candidates: NurtureInstitutionKnowledgeRetrievalCandidateV1[];
}): string => createHash("sha256").update(
  `nurture.institution-knowledge-generation-input.v1\0${canonicalJsonV1({
    workspace_id: input.context.workspace_id,
    institution_ref: input.context.institution_ref,
    invocation_ref: input.context.invocation_ref,
    purpose: "institution_admin_online_answer",
    answer_policy_version: input.answer_policy_version,
    question: input.question,
    candidates: input.candidates,
  })}`,
  "utf8",
).digest("hex");

const candidatesForFinding = (
  finding: NurtureInstitutionKnowledgeConflictFindingV1,
  candidates: readonly NurtureInstitutionKnowledgeRetrievalCandidateV1[],
): NurtureInstitutionKnowledgeRetrievalCandidateV1[] => {
  const keys = new Set(finding.sources.map(sourceKey));
  return candidates.filter((candidate) => keys.has(sourceKey(candidate)));
};

const conflictResult = async (input: {
  findings: NurtureInstitutionKnowledgeConflictFindingV1[];
  rule_set_ref: string;
  rule_version: string;
  context: NurtureInstitutionKnowledgeOnlineContextV1;
  candidates: NurtureInstitutionKnowledgeRetrievalCandidateV1[];
  nurture_currentness: NurtureInstitutionKnowledgeSourceCurrentnessProviderV1;
  authority_currentness: InstitutionKnowledgeAuthorityCitationCurrentnessOwnerPortV1;
  recorder: InstitutionKnowledgeConflictCandidateRecorderV1;
}): Promise<InstitutionKnowledgeAnswerOperationResultV1> => {
  const involvedKeys = new Set(input.findings.flatMap((finding) => finding.sources.map(sourceKey)));
  const involved = input.candidates.filter((candidate) => involvedKeys.has(sourceKey(candidate)));
  const currentness = await validateFinalCurrentness({
    context: input.context,
    candidates: involved,
    nurture_currentness: input.nurture_currentness,
    authority_currentness: input.authority_currentness,
  });
  if (currentness.status === "denied") return { status: "denied" };
  if (currentness.status === "unavailable") return { status: "unavailable" };
  if (currentness.status === "changed") return abstained("abstained_source_changed");

  const conflicts: Extract<
    InstitutionKnowledgeAnswerResultV1,
    { status: "abstained_medical_conflict" }
  >["conflicts"] = [];
  const citations = citationsFor(involved);
  if (!citations) return { status: "unavailable" };
  const citationBySource = new Map(
    involved.map((candidate, index) => [sourceKey(candidate), citations[index]!.citation_ref]),
  );
  for (const finding of input.findings) {
    const findingCandidates = candidatesForFinding(finding, involved);
    const recorded = await input.recorder.record({
      workspace_id: input.context.workspace_id,
      institution_ref: input.context.institution_ref,
      rule_set_ref: input.rule_set_ref,
      rule_version: input.rule_version,
      finding,
      targeted_nurture_revision_refs: [...new Set(
        findingCandidates.flatMap((candidate) =>
          candidate.source_owner === "nurture" ? [candidate.revision_ref] : [],
        ),
      )].sort(),
    });
    if (
      recorded.status === "unavailable" ||
      !REF_PATTERN.test(recorded.candidate_ref)
    ) return { status: "unavailable" };
    conflicts.push({
      conflict_class: finding.conflict_class,
      finding_fingerprint: finding.finding_fingerprint,
      candidate_ref: recorded.candidate_ref,
      citation_refs: finding.sources.map((source) => citationBySource.get(sourceKey(source))!),
    });
  }
  const result: Extract<
    InstitutionKnowledgeAnswerResultV1,
    { status: "abstained_medical_conflict" }
  > = {
    status: "abstained_medical_conflict",
    contract_version: INSTITUTION_KNOWLEDGE_ANSWER_SAFETY_CONTRACT.version,
    conflicts,
    citations,
    safety_notice: medicalNotice(),
  };
  return Buffer.byteLength(canonicalJsonV1(result), "utf8") <= 65_536
    ? resolved(result)
    : { status: "unavailable" };
};

export const answerInstitutionKnowledgeV1 = async (input: {
  public_query: unknown;
  trusted_context: Omit<
    NurtureInstitutionKnowledgeOnlineContextV1,
    "age_band_keys" | "scenario_keys"
  >;
  answer_policy_version: string;
  rule_set_ref: string;
  rule_version: string;
  retrieval_owner: InstitutionKnowledgeRetrievalOwnerPortV1;
  pre_generation_nurture_currentness: NurtureInstitutionKnowledgeSourceCurrentnessProviderV1;
  pre_generation_authority_currentness: NurtureAuthorityKnowledgeSourceCurrentnessProviderV1;
  final_nurture_currentness: NurtureInstitutionKnowledgeSourceCurrentnessProviderV1;
  final_authority_currentness: InstitutionKnowledgeAuthorityCitationCurrentnessOwnerPortV1;
  admin_authority: NurtureInstitutionAdminKnowledgeAuthorityV1;
  safety_owner: InstitutionKnowledgeAnswerSafetyOwnerPortV2;
  generation_owner: InstitutionKnowledgeGenerationOwnerPortV1;
  conflict_recorder: InstitutionKnowledgeConflictCandidateRecorderV1;
}): Promise<InstitutionKnowledgeAnswerOperationResultV1> => {
  if (
    !validateInstitutionKnowledgeOnlineQuery(input.public_query) ||
    !VERSION_PATTERN.test(input.answer_policy_version) ||
    !REF_PATTERN.test(input.rule_set_ref) ||
    !VERSION_PATTERN.test(input.rule_version)
  ) return { status: "denied" };
  const query: InstitutionKnowledgeOnlineQueryV1 = input.public_query;
  const context: NurtureInstitutionKnowledgeOnlineContextV1 = {
    ...input.trusted_context,
    age_band_keys: query.age_band_keys ?? [],
    scenario_keys: query.scenario_keys ?? [],
  };
  const retrieval = await retrieveCurrentInstitutionKnowledgeCandidates({
    public_query: query,
    trusted_context: input.trusted_context,
    retrieval_owner: input.retrieval_owner,
    currentness_provider: input.pre_generation_nurture_currentness,
    authority_currentness_provider: input.pre_generation_authority_currentness,
    admin_authority: input.admin_authority,
  });
  if (retrieval.status !== "resolved") return retrieval;
  if (retrieval.candidates.length === 0) return abstained("abstained_no_source");

  const candidateSourceKeys = new Set(retrieval.candidates.map(sourceKey));
  let requestSafety: InstitutionKnowledgeRequestSafetyDecisionV1;
  try {
    requestSafety = await input.safety_owner.evaluateRequestAndSources({
      rule_set_ref: input.rule_set_ref,
      rule_version: input.rule_version,
      workspace_id: context.workspace_id,
      institution_ref: context.institution_ref,
      purpose: "institution_admin_online_answer",
      question: query.question,
      sources: retrieval.candidates.map(safetySource),
    });
  } catch {
    return { status: "unavailable" };
  }
  if (!validRequestSafetyDecision({
    value: requestSafety,
    rule_set_ref: input.rule_set_ref,
    rule_version: input.rule_version,
    candidate_source_keys: candidateSourceKeys,
  }) || requestSafety.status === "unavailable") return { status: "unavailable" };
  if (requestSafety.status === "unsafe_request") {
    return resolved({
      status: "abstained_safety",
      contract_version: INSTITUTION_KNOWLEDGE_ANSWER_SAFETY_CONTRACT.version,
      reason_codes: requestSafety.reason_codes,
      safety_notice: safetyNotice(requestSafety.reason_codes),
    });
  }
  if (requestSafety.status === "material_source_conflict") {
    const finalAuthority = await authorizeAdmin(input.admin_authority, context);
    if (finalAuthority !== "authorized") return { status: finalAuthority };
    return conflictResult({
      findings: requestSafety.findings,
      rule_set_ref: input.rule_set_ref,
      rule_version: input.rule_version,
      context,
      candidates: retrieval.candidates,
      nurture_currentness: input.final_nurture_currentness,
      authority_currentness: input.final_authority_currentness,
      recorder: input.conflict_recorder,
    });
  }

  const inputDigest = generationInputDigest({
    context,
    answer_policy_version: input.answer_policy_version,
    question: query.question,
    candidates: retrieval.candidates,
  });
  let generated: Awaited<ReturnType<InstitutionKnowledgeGenerationOwnerPortV1["generate"]>>;
  try {
    generated = await input.generation_owner.generate({
      workspace_id: context.workspace_id,
      institution_ref: context.institution_ref,
      invocation_ref: context.invocation_ref,
      purpose: "institution_admin_online_answer",
      answer_policy_version: input.answer_policy_version,
      input_digest: inputDigest,
      question: query.question,
      candidates: retrieval.candidates,
    });
  } catch {
    return { status: "unavailable" };
  }
  if (
    generated.status === "unavailable" ||
    !exactKeys(generated, ["status", "draft"]) ||
    !validDraft({
      value: generated.draft,
      input_digest: inputDigest,
      candidate_refs: new Set(retrieval.candidates.map((candidate) => candidate.candidate_ref)),
    })
  ) return { status: "unavailable" };

  const usedRefs = new Set(generated.draft.claims.flatMap((claim) => claim.candidate_refs));
  const usedCandidates = retrieval.candidates.filter((candidate) =>
    usedRefs.has(candidate.candidate_ref),
  );
  let draftSafety: InstitutionKnowledgeDraftSafetyDecisionV1;
  try {
    draftSafety = await input.safety_owner.validateDraft({
      rule_set_ref: input.rule_set_ref,
      rule_version: input.rule_version,
      workspace_id: context.workspace_id,
      institution_ref: context.institution_ref,
      purpose: "institution_admin_online_answer",
      generation_ref: generated.draft.generation_ref,
      claims: generated.draft.claims,
      sources: usedCandidates.map(safetySource),
    });
  } catch {
    return { status: "unavailable" };
  }
  if (!validDraftSafetyDecision({
    value: draftSafety,
    rule_set_ref: input.rule_set_ref,
    rule_version: input.rule_version,
  }) || draftSafety.status === "unavailable") return { status: "unavailable" };
  if (draftSafety.status === "unsafe") {
    return resolved({
      status: "abstained_safety",
      contract_version: INSTITUTION_KNOWLEDGE_ANSWER_SAFETY_CONTRACT.version,
      reason_codes: draftSafety.reason_codes,
      safety_notice: safetyNotice(draftSafety.reason_codes),
    });
  }

  const finalAuthority = await authorizeAdmin(input.admin_authority, context);
  if (finalAuthority !== "authorized") return { status: finalAuthority };

  const finalCurrentness = await validateFinalCurrentness({
    context,
    candidates: usedCandidates,
    nurture_currentness: input.final_nurture_currentness,
    authority_currentness: input.final_authority_currentness,
  });
  if (finalCurrentness.status === "denied") return { status: "denied" };
  if (finalCurrentness.status === "unavailable") return { status: "unavailable" };
  if (finalCurrentness.status === "changed") return abstained("abstained_source_changed");

  const citations = citationsFor(usedCandidates);
  if (!citations) return { status: "unavailable" };
  const citationByCandidate = new Map(
    usedCandidates.map((candidate, index) => [candidate.candidate_ref, citations[index]!.citation_ref]),
  );
  const claims: InstitutionKnowledgeClaimV1[] = generated.draft.claims.map((claim) => ({
    text: claim.text,
    claim_kind: claim.claim_kind,
    citation_refs: claim.candidate_refs.map((ref) => citationByCandidate.get(ref)!),
  }));
  const citationByRef = new Map(citations.map((citation) => [citation.citation_ref, citation]));
  if (claims.some((claim) =>
    MEDICAL_CLAIMS.has(claim.claim_kind) &&
    !claim.citation_refs.some((ref) => citationByRef.get(ref)?.source_kind === "authority_source"),
  )) return { status: "unavailable" };
  const medical = requestSafety.status === "medical_clear" ||
    claims.some((claim) => MEDICAL_CLAIMS.has(claim.claim_kind));
  const answer: Extract<InstitutionKnowledgeAnswerResultV1, { status: "answered" }> = {
    status: "answered",
    contract_version: INSTITUTION_KNOWLEDGE_ANSWER_SAFETY_CONTRACT.version,
    claims,
    citations,
    generation_ref: generated.draft.generation_ref,
    generated_at: generated.draft.generated_at,
    assistance_kind: generated.draft.assistance_kind,
    ...(medical ? { safety_notice: medicalNotice() } : {}),
  };
  if (Buffer.byteLength(canonicalJsonV1(answer), "utf8") > 65_536) {
    return { status: "unavailable" };
  }
  return resolved(answer);
};

export const createInstitutionKnowledgePortableAnswer = (
  result: InstitutionKnowledgeAnswerResultV1,
): { status: "resolved"; artifact: InstitutionKnowledgePortableAnswerV1 } | { status: "invalid" } => {
  if (result.status !== "answered") return { status: "invalid" };
  const artifact: InstitutionKnowledgePortableAnswerV1 = {
    contract_version: result.contract_version,
    claims: result.claims,
    citations: result.citations,
    generation_ref: result.generation_ref,
    generated_at: result.generated_at,
    assistance_kind: result.assistance_kind,
    ...(result.safety_notice ? { safety_notice: result.safety_notice } : {}),
  };
  return Buffer.byteLength(canonicalJsonV1(artifact), "utf8") <= 65_536
    ? { status: "resolved", artifact }
    : { status: "invalid" };
};
