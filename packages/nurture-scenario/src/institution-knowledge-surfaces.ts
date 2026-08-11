import type { WorkflowCommandMeta } from "@my-chat/workflow-contracts";
import type { NurtureCommandSpec } from "./domain/commands/command-kernel.js";
import {
  INSTITUTION_KNOWLEDGE_ANSWER_SAFETY_SERVICE_PIN_V2,
  answerInstitutionKnowledgeV1,
  type InstitutionKnowledgeAnswerResultV1,
  type InstitutionKnowledgeAnswerSafetyOwnerPortV2,
  type InstitutionKnowledgeAuthorityCitationCurrentnessOwnerPortV1,
  type InstitutionKnowledgeCitationV1,
  type InstitutionKnowledgeGenerationOwnerPortV1,
  type InstitutionKnowledgeSafetyNoticeV1,
} from "./domain/institution/institution-knowledge-answer-safety.js";
import {
  createInstitutionKnowledgeCommandSpecs,
  type NurtureInstitutionKnowledgeCommittedResultV1,
} from "./domain/institution/institution-knowledge-commands.js";
import type { InstitutionKnowledgeConflictCandidateRecorderV1 } from "./domain/institution/institution-knowledge-conflict-candidate.js";
import {
  INSTITUTION_KNOWLEDGE_AUDIENCES,
  INSTITUTION_KNOWLEDGE_CATEGORIES,
  INSTITUTION_KNOWLEDGE_SAFETY_CLASSES,
  validateInstitutionKnowledgeBody,
  type NurtureCreateInstitutionKnowledgeItemPayload,
  type NurtureCreateInstitutionKnowledgeRevisionPayload,
  type NurtureInstitutionKnowledgeAuthorityLinkSnapshotV1,
  type NurtureInstitutionKnowledgeBodyV1,
  type NurturePublishInstitutionKnowledgeRevisionPayload,
  type NurtureRecordInstitutionKnowledgeReviewPayload,
  type NurtureRevokeInstitutionKnowledgeRevisionPayload,
} from "./domain/institution/institution-knowledge-lifecycle.js";
import {
  validateInstitutionKnowledgeOnlineQuery,
  type InstitutionKnowledgeOnlineQueryV1,
  type InstitutionKnowledgeRetrievalOwnerPortV1,
  type NurtureAuthorityKnowledgeSourceCurrentnessProviderV1,
  type NurtureInstitutionAdminKnowledgeAuthorityV1,
  type NurtureInstitutionKnowledgePreviewOptionV1,
  type NurtureInstitutionKnowledgePreviewProvider,
  type NurtureInstitutionKnowledgeSourceCurrentnessProviderV1,
} from "./domain/institution/institution-knowledge-retrieval.js";
import type { ProtectedContentWritePort } from "./harness/protected-content.js";

export const NURTURE_INSTITUTION_KNOWLEDGE_QUERY_KEYS = [
  "query_institution_knowledge_preview",
] as const;
export const NURTURE_INSTITUTION_KNOWLEDGE_ACTION_KEYS = [
  "answer_institution_knowledge",
  "create_institution_knowledge_item",
  "create_institution_knowledge_revision",
  "record_institution_knowledge_review",
  "publish_institution_knowledge_revision",
  "revoke_institution_knowledge_revision",
] as const;

export type NurtureInstitutionKnowledgeQueryKey =
  (typeof NURTURE_INSTITUTION_KNOWLEDGE_QUERY_KEYS)[number];
export type NurtureInstitutionKnowledgeActionKey =
  (typeof NURTURE_INSTITUTION_KNOWLEDGE_ACTION_KEYS)[number];
export type NurtureInstitutionKnowledgeLifecycleActionKey = Exclude<
  NurtureInstitutionKnowledgeActionKey,
  "answer_institution_knowledge"
>;
export type NurtureInstitutionKnowledgeSurfaceCapabilityKey =
  | NurtureInstitutionKnowledgeQueryKey
  | NurtureInstitutionKnowledgeActionKey;

type AuthoringInput = {
  body: NurtureInstitutionKnowledgeBodyV1;
  intendedAudiences: NurtureCreateInstitutionKnowledgeItemPayload["intended_audiences"];
  ageBandKeys?: string[];
  scenarioKeys?: string[];
  safetyClass: NurtureCreateInstitutionKnowledgeItemPayload["safety_class"];
  validFrom?: string;
  validUntil?: string;
  authoritySourceOptionRefs?: string[];
};

type OperationInputByCapability = {
  query_institution_knowledge_preview: { revisionOptionRefs: string[] };
  answer_institution_knowledge: {
    question: string;
    ageBandKeys?: string[];
    scenarioKeys?: string[];
  };
  create_institution_knowledge_item: AuthoringInput & {
    category: NurtureCreateInstitutionKnowledgeItemPayload["category"];
  };
  create_institution_knowledge_revision: AuthoringInput;
  record_institution_knowledge_review: {
    decision: "reviewed" | "changes_requested";
    reasonKey: string;
  };
  publish_institution_knowledge_revision: Record<string, never>;
  revoke_institution_knowledge_revision: { reasonKey: string };
};

/** Exact request consumed by the Institution Knowledge surface handler. */
export type NurtureInstitutionKnowledgeSurfaceRequest<
  Key extends NurtureInstitutionKnowledgeSurfaceCapabilityKey =
    NurtureInstitutionKnowledgeSurfaceCapabilityKey,
> = Key extends NurtureInstitutionKnowledgeSurfaceCapabilityKey
  ? {
      capabilityKey: Key;
      capabilityVersion: "1.0.0";
      targetOptionRef: string;
      operationInput: OperationInputByCapability[Key];
    } & (Key extends NurtureInstitutionKnowledgeQueryKey
      ? { confirmationRef?: never }
      : { confirmationRef: string })
  : never;

/**
 * Unconfirmed command intent accepted only by the formal prepare owner. It
 * deliberately has no confirmation field; execute accepts no typed payload.
 */
export type NurtureInstitutionKnowledgeCommandIntentV1<
  Key extends NurtureInstitutionKnowledgeActionKey =
    NurtureInstitutionKnowledgeActionKey,
> = Key extends NurtureInstitutionKnowledgeActionKey
  ? {
      capabilityKey: Key;
      capabilityVersion: "1.0.0";
      targetOptionRef: string;
      operationInput: OperationInputByCapability[Key];
    }
  : never;

export type NurtureInstitutionKnowledgeTrustedContextV1 = {
  workspace_id: string;
  actor_participant_ref: string;
  invocation_request_id: string;
  command_request_id: string;
  client_surface: WorkflowCommandMeta["client_surface"];
};

export type NurtureInstitutionKnowledgePreparedBindingV1 = {
  capability_key: NurtureInstitutionKnowledgeSurfaceCapabilityKey;
  target_option_ref: string;
  confirmation_ref?: string;
  workspace_id: string;
  actor_participant_ref: string;
  surface_key: "institution_workbench";
  active_role: "institution_admin";
  institution_ref: string;
  role_assignment_ref: string;
  evaluated_at: string;
  item_ref?: string;
  revision_ref?: string;
  expected_item_head?: number;
  authority_links: Array<{
    option_ref: string;
    snapshot: NurtureInstitutionKnowledgeAuthorityLinkSnapshotV1;
  }>;
};

export type NurtureInstitutionKnowledgeBindingDecision =
  | { status: "resolved"; binding: NurtureInstitutionKnowledgePreparedBindingV1 }
  | { status: "denied" | "unavailable"; reason_code: string };

export type NurtureInstitutionKnowledgeBindingPort = {
  resolve(input: {
    request: NurtureInstitutionKnowledgeSurfaceRequest;
    trusted: NurtureInstitutionKnowledgeTrustedContextV1;
  }): Promise<NurtureInstitutionKnowledgeBindingDecision>;
};

export type NurtureInstitutionKnowledgeCommandExecutionResult =
  | {
      status: "committed";
      disposition: "executed" | "replayed";
      result: NurtureInstitutionKnowledgeCommittedResultV1;
    }
  | {
      status: "not_committed";
      decision:
        | "invalid"
        | "blocked"
        | "conflict"
        | "idempotency_conflict"
        | "command_busy"
        | "technical_error";
      reason_code: string;
    }
  | { status: "outcome_unknown"; reason_code: string };

export type NurtureInstitutionKnowledgeCommandExecutor = {
  execute<Input>(input: {
    capability_key: NurtureInstitutionKnowledgeLifecycleActionKey;
    confirmation_ref: string;
    trusted: NurtureInstitutionKnowledgeTrustedContextV1;
    spec: NurtureCommandSpec<Input>;
    payload: Input;
  }): Promise<NurtureInstitutionKnowledgeCommandExecutionResult>;
};

export type NurtureInstitutionKnowledgeOptionIssuer = {
  issue(input: {
    workspace_id: string;
    actor_participant_ref: string;
    kind: "item" | "revision";
    target_ref: string;
    version?: number;
  }): string | null;
};

export type NurtureInstitutionKnowledgeSurfaceDeps = {
  bindings: NurtureInstitutionKnowledgeBindingPort;
  commands: NurtureInstitutionKnowledgeCommandExecutor;
  preview: Pick<NurtureInstitutionKnowledgePreviewProvider, "preview">;
  protectedContent: Pick<ProtectedContentWritePort, "seal">;
  adminAuthority: NurtureInstitutionAdminKnowledgeAuthorityV1;
  retrievalOwner: InstitutionKnowledgeRetrievalOwnerPortV1;
  nurtureCurrentness: NurtureInstitutionKnowledgeSourceCurrentnessProviderV1;
  authorityCurrentness: NurtureAuthorityKnowledgeSourceCurrentnessProviderV1;
  finalAuthorityCurrentness: InstitutionKnowledgeAuthorityCitationCurrentnessOwnerPortV1;
  safetyOwner: InstitutionKnowledgeAnswerSafetyOwnerPortV2;
  generationOwner: InstitutionKnowledgeGenerationOwnerPortV1;
  conflictCandidates: InstitutionKnowledgeConflictCandidateRecorderV1;
  optionIssuer: NurtureInstitutionKnowledgeOptionIssuer;
  answerPolicy: {
    answer_policy_version: string;
    rule_set_ref: string;
    rule_version: string;
  };
};

const TOKEN = /^[a-z][a-z0-9._:-]{0,99}$/;
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const exact = (
  value: unknown,
  required: readonly string[],
  optional: readonly string[] = [],
): value is Record<string, unknown> => {
  if (!isRecord(value)) return false;
  const keys = Object.keys(value);
  return required.every((key) => keys.includes(key)) &&
    keys.every((key) => required.includes(key) || optional.includes(key));
};
const opaqueRef = (value: unknown): value is string =>
  typeof value === "string" && value.length >= 1 && value.length <= 512;
const token = (value: unknown): value is string =>
  typeof value === "string" && TOKEN.test(value);
const tokenList = (value: unknown, min = 0, max = 16): value is string[] =>
  Array.isArray(value) && value.length >= min && value.length <= max &&
  value.every(token) && new Set(value).size === value.length;
const text = (value: unknown, max: number): value is string =>
  typeof value === "string" && value.trim().length > 0 && value.length <= max;
const instant = (value: unknown): value is string => {
  if (typeof value !== "string") return false;
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString() === value;
};

const authoringKeys = [
  "body", "intendedAudiences", "ageBandKeys", "scenarioKeys", "safetyClass",
  "validFrom", "validUntil", "authoritySourceOptionRefs",
] as const;
const validAuthoring = (value: Record<string, unknown>): boolean => {
  const audiences = value.intendedAudiences;
  const authorityRefs = value.authoritySourceOptionRefs ?? [];
  const validFrom = value.validFrom;
  const validUntil = value.validUntil;
  return validateInstitutionKnowledgeBody(value.body) && Array.isArray(audiences) &&
    audiences.length >= 1 && audiences.length <= 3 &&
    audiences.every((entry) =>
      (INSTITUTION_KNOWLEDGE_AUDIENCES as readonly unknown[]).includes(entry),
    ) && new Set(audiences).size === audiences.length &&
    (value.ageBandKeys === undefined || tokenList(value.ageBandKeys)) &&
    (value.scenarioKeys === undefined || tokenList(value.scenarioKeys)) &&
    (INSTITUTION_KNOWLEDGE_SAFETY_CLASSES as readonly unknown[]).includes(value.safetyClass) &&
    (validFrom === undefined || instant(validFrom)) &&
    (validUntil === undefined || instant(validUntil)) &&
    (validFrom === undefined || validUntil === undefined || String(validFrom) < String(validUntil)) &&
    Array.isArray(authorityRefs) && authorityRefs.length <= 16 &&
    authorityRefs.every(opaqueRef) && new Set(authorityRefs).size === authorityRefs.length;
};

const toOnlineQuery = (value: Record<string, unknown>): InstitutionKnowledgeOnlineQueryV1 => ({
  question: String(value.question),
  ...(value.ageBandKeys ? { age_band_keys: value.ageBandKeys as string[] } : {}),
  ...(value.scenarioKeys ? { scenario_keys: value.scenarioKeys as string[] } : {}),
});

const validOperationInput = (
  capability: NurtureInstitutionKnowledgeSurfaceCapabilityKey,
  value: unknown,
): boolean => {
  switch (capability) {
    case "query_institution_knowledge_preview":
      return exact(value, ["revisionOptionRefs"]) &&
        Array.isArray(value.revisionOptionRefs) && value.revisionOptionRefs.length >= 1 &&
        value.revisionOptionRefs.length <= 8 && value.revisionOptionRefs.every(opaqueRef) &&
        new Set(value.revisionOptionRefs).size === value.revisionOptionRefs.length;
    case "answer_institution_knowledge":
      return exact(value, ["question"], ["ageBandKeys", "scenarioKeys"]) &&
        validateInstitutionKnowledgeOnlineQuery(toOnlineQuery(value));
    case "create_institution_knowledge_item":
      return exact(value, ["category", "body", "intendedAudiences", "safetyClass"],
        authoringKeys.filter((key) => !["body", "intendedAudiences", "safetyClass"].includes(key))) &&
        (INSTITUTION_KNOWLEDGE_CATEGORIES as readonly unknown[]).includes(value.category) &&
        validAuthoring(value);
    case "create_institution_knowledge_revision":
      return exact(value, ["body", "intendedAudiences", "safetyClass"],
        authoringKeys.filter((key) => !["body", "intendedAudiences", "safetyClass"].includes(key))) &&
        validAuthoring(value);
    case "record_institution_knowledge_review":
      return exact(value, ["decision", "reasonKey"]) &&
        (value.decision === "reviewed" || value.decision === "changes_requested") &&
        token(value.reasonKey);
    case "publish_institution_knowledge_revision":
      return exact(value, []);
    case "revoke_institution_knowledge_revision":
      return exact(value, ["reasonKey"]) && token(value.reasonKey);
  }
};

const isQueryKey = (value: string): value is NurtureInstitutionKnowledgeQueryKey =>
  (NURTURE_INSTITUTION_KNOWLEDGE_QUERY_KEYS as readonly string[]).includes(value);
const isActionKey = (value: string): value is NurtureInstitutionKnowledgeActionKey =>
  (NURTURE_INSTITUTION_KNOWLEDGE_ACTION_KEYS as readonly string[]).includes(value);
export const parseNurtureInstitutionKnowledgeSurfaceRequest = (
  value: unknown,
): NurtureInstitutionKnowledgeSurfaceRequest | null => {
  if (!exact(
    value,
    ["capabilityKey", "capabilityVersion", "targetOptionRef", "operationInput"],
    ["confirmationRef"],
  ) || typeof value.capabilityKey !== "string") return null;
  const capability = value.capabilityKey;
  if ((!isQueryKey(capability) && !isActionKey(capability)) ||
    value.capabilityVersion !== "1.0.0" || !opaqueRef(value.targetOptionRef) ||
    !validOperationInput(capability, value.operationInput)) return null;
  if (isQueryKey(capability)) {
    if (value.confirmationRef !== undefined) return null;
  } else if (!opaqueRef(value.confirmationRef)) return null;
  return value as NurtureInstitutionKnowledgeSurfaceRequest;
};

export const parseNurtureInstitutionKnowledgeCommandIntent = (
  value: unknown,
): NurtureInstitutionKnowledgeCommandIntentV1 | null => {
  if (!exact(
    value,
    ["capabilityKey", "capabilityVersion", "targetOptionRef", "operationInput"],
  ) || typeof value.capabilityKey !== "string") return null;
  const capability = value.capabilityKey;
  if (
    !isActionKey(capability) ||
    value.capabilityVersion !== "1.0.0" ||
    !opaqueRef(value.targetOptionRef) ||
    !validOperationInput(capability, value.operationInput)
  ) return null;
  return value as NurtureInstitutionKnowledgeCommandIntentV1;
};

const validTrustedContext = (
  value: NurtureInstitutionKnowledgeTrustedContextV1,
): boolean =>
  [
    value.workspace_id,
    value.actor_participant_ref,
    value.invocation_request_id,
    value.command_request_id,
  ].every((entry) => typeof entry === "string" && entry.trim().length > 0 && entry.length <= 200) &&
  value.client_surface === "web_run_workbench";

const requestedAuthorityRefs = (
  request: NurtureInstitutionKnowledgeSurfaceRequest,
): string[] => {
  if (request.capabilityKey !== "create_institution_knowledge_item" &&
    request.capabilityKey !== "create_institution_knowledge_revision") return [];
  return request.operationInput.authoritySourceOptionRefs ?? [];
};

const validBinding = (input: {
  request: NurtureInstitutionKnowledgeSurfaceRequest;
  trusted: NurtureInstitutionKnowledgeTrustedContextV1;
  binding: NurtureInstitutionKnowledgePreparedBindingV1;
}): boolean => {
  const { request, trusted, binding } = input;
  if (binding.capability_key !== request.capabilityKey ||
    binding.target_option_ref !== request.targetOptionRef ||
    (isQueryKey(request.capabilityKey)
      ? binding.confirmation_ref !== undefined
      : binding.confirmation_ref !== request.confirmationRef) ||
    binding.workspace_id !== trusted.workspace_id ||
    binding.actor_participant_ref !== trusted.actor_participant_ref ||
    binding.surface_key !== "institution_workbench" ||
    binding.active_role !== "institution_admin" ||
    !text(binding.institution_ref, 200) || !text(binding.role_assignment_ref, 200) ||
    !instant(binding.evaluated_at)) return false;
  const refs = requestedAuthorityRefs(request);
  if (binding.authority_links.length !== refs.length ||
    binding.authority_links.some((entry, index) => entry.option_ref !== refs[index])) return false;
  if (request.capabilityKey === "create_institution_knowledge_revision") {
    return text(binding.item_ref, 200) && Number.isSafeInteger(binding.expected_item_head) &&
      Number(binding.expected_item_head) >= 1;
  }
  if ([
    "record_institution_knowledge_review",
    "publish_institution_knowledge_revision",
    "revoke_institution_knowledge_revision",
  ].includes(request.capabilityKey)) {
    return text(binding.item_ref, 200) && text(binding.revision_ref, 200) &&
      Number.isSafeInteger(binding.expected_item_head) && Number(binding.expected_item_head) >= 1;
  }
  return true;
};

const required = <Value>(value: Value | undefined): Value => {
  if (value === undefined) throw new Error("incomplete_trusted_knowledge_binding");
  return value;
};
const metadataPayload = (
  input: AuthoringInput,
  binding: NurtureInstitutionKnowledgePreparedBindingV1,
) => ({
  body: input.body,
  intended_audiences: input.intendedAudiences,
  ...(input.ageBandKeys ? { age_band_keys: input.ageBandKeys } : {}),
  ...(input.scenarioKeys ? { scenario_keys: input.scenarioKeys } : {}),
  safety_class: input.safetyClass,
  ...(input.validFrom ? { valid_from: input.validFrom } : {}),
  ...(input.validUntil ? { valid_until: input.validUntil } : {}),
  ...(binding.authority_links.length > 0
    ? { verified_authority_links: binding.authority_links.map(({ snapshot }) => snapshot) }
    : {}),
});

const presentPreview = (
  options: NurtureInstitutionKnowledgePreviewOptionV1[],
) => ({
  options: options.map((option) => ({
    revisionOptionRef: option.revision_option_ref,
    sourceRef: option.source_ref.object_id,
    sourceVersion: option.source_version,
    revisionNumber: option.revision_number,
    state: option.state,
    body: option.body,
    warnings: option.warnings,
  })),
});

const presentCitation = (
  citation: InstitutionKnowledgeCitationV1,
  trusted: NurtureInstitutionKnowledgeTrustedContextV1,
  issuer: NurtureInstitutionKnowledgeOptionIssuer,
) => {
  const common = {
    citationRef: citation.citation_ref,
    sourceRef: citation.source_ref.object_id,
    sourceVersion: citation.source_version,
    contentHash: citation.content_hash,
    sourceKind: citation.source_kind,
    label: citation.label,
    provenanceKind: citation.provenance_kind,
    title: citation.title,
    excerpt: citation.excerpt,
    ...(citation.open_ref ? { openRef: citation.open_ref } : {}),
  };
  if (citation.source_kind === "authority_source") {
    return {
      ...common,
      publisher: citation.publisher,
      sourceDate: citation.source_date,
    };
  }
  const itemOptionRef = issuer.issue({
    workspace_id: trusted.workspace_id,
    actor_participant_ref: trusted.actor_participant_ref,
    kind: "item",
    target_ref: citation.item_ref,
  });
  const revisionOptionRef = issuer.issue({
    workspace_id: trusted.workspace_id,
    actor_participant_ref: trusted.actor_participant_ref,
    kind: "revision",
    target_ref: citation.revision_ref,
    version: citation.revision_number,
  });
  if (!opaqueRef(itemOptionRef) || !opaqueRef(revisionOptionRef)) return null;
  return {
    ...common,
    itemOptionRef,
    revisionOptionRef,
    revisionNumber: citation.revision_number,
    publicationEventRef: citation.publication_event_ref.object_id,
    publishedAt: citation.published_at,
  };
};

const presentSafetyNotice = (
  notice: InstitutionKnowledgeSafetyNoticeV1,
) => ({ reasonKeys: notice.reason_keys });

const presentCitations = (
  citations: InstitutionKnowledgeCitationV1[],
  trusted: NurtureInstitutionKnowledgeTrustedContextV1,
  issuer: NurtureInstitutionKnowledgeOptionIssuer,
) => {
  const presented = [];
  for (const citation of citations) {
    const value = presentCitation(citation, trusted, issuer);
    if (!value) return null;
    presented.push(value);
  }
  return presented;
};

export const presentInstitutionKnowledgeAnswer = (
  result: InstitutionKnowledgeAnswerResultV1,
  trusted: NurtureInstitutionKnowledgeTrustedContextV1,
  issuer: NurtureInstitutionKnowledgeOptionIssuer,
) => {
  switch (result.status) {
    case "abstained_no_source":
    case "abstained_source_changed":
      return { status: result.status, contractVersion: result.contract_version };
    case "abstained_safety":
      return {
        status: result.status,
        contractVersion: result.contract_version,
        reasonCodes: result.reason_codes,
        safetyNotice: presentSafetyNotice(result.safety_notice),
      };
    case "abstained_medical_conflict": {
      const citations = presentCitations(result.citations, trusted, issuer);
      if (!citations) return null;
      return {
        status: result.status,
        contractVersion: result.contract_version,
        citations,
        conflicts: result.conflicts.map((conflict) => ({
          conflictClass: conflict.conflict_class,
          findingFingerprint: conflict.finding_fingerprint,
          candidateRef: conflict.candidate_ref,
          citationRefs: conflict.citation_refs,
        })),
        safetyNotice: presentSafetyNotice(result.safety_notice),
      };
    }
    case "answered": {
      const citations = presentCitations(result.citations, trusted, issuer);
      if (!citations) return null;
      return {
        status: result.status,
        contractVersion: result.contract_version,
        citations,
        generationRef: result.generation_ref,
        generatedAt: result.generated_at,
        assistanceKind: result.assistance_kind,
        claims: result.claims.map((claim) => ({
          text: claim.text,
          claimKind: claim.claim_kind,
          citationRefs: claim.citation_refs,
        })),
        ...(result.safety_notice
          ? { safetyNotice: presentSafetyNotice(result.safety_notice) }
          : {}),
      };
    }
  }
};

type NurtureInstitutionKnowledgeActionResultV1 = {
  effect: NurtureInstitutionKnowledgeLifecycleActionKey;
  itemOptionRef: string;
  revisionOptionRef: string;
  itemHead: number;
  revisionNumber: number;
  revisionState: NurtureInstitutionKnowledgeCommittedResultV1["revision_state"];
  committedAt: string;
};

type NurtureInstitutionKnowledgeAdapterResponse =
  | {
      status: "ok";
      result:
        | ReturnType<typeof presentPreview>
        | NonNullable<ReturnType<typeof presentInstitutionKnowledgeAnswer>>
        | NurtureInstitutionKnowledgeActionResultV1;
      disposition?: "executed" | "replayed";
    }
  | { status: "invalid" | "denied" | "unavailable"; reason_code: string }
  | Exclude<NurtureInstitutionKnowledgeCommandExecutionResult, { status: "committed" }>;

const unavailable = Object.freeze({
  status: "unavailable" as const,
  reason_code: "institution_knowledge_runtime_unavailable",
});
export const defaultNurtureInstitutionKnowledgeSurfaceDeps: NurtureInstitutionKnowledgeSurfaceDeps =
  Object.freeze({
    bindings: Object.freeze({ resolve: async () => unavailable }),
    commands: Object.freeze({
      execute: async () => ({
        status: "not_committed" as const,
        decision: "blocked" as const,
        reason_code: unavailable.reason_code,
      }),
    }),
    preview: Object.freeze({ preview: async () => ({ status: "unavailable" as const }) }),
    protectedContent: Object.freeze({
      seal: () => { throw new Error(unavailable.reason_code); },
    }),
    adminAuthority: Object.freeze({ authorize: async () => "unavailable" as const }),
    retrievalOwner: Object.freeze({
      retrieveCandidates: async () => ({ status: "unavailable" as const }),
    }),
    nurtureCurrentness: Object.freeze({
      validateSources: async () => ({ status: "unavailable" as const }),
    }),
    authorityCurrentness: Object.freeze({
      validateSources: async () => ({ status: "unavailable" as const }),
    }),
    finalAuthorityCurrentness: Object.freeze({
      validateSources: async () => ({ status: "unavailable" as const }),
    }),
    safetyOwner: Object.freeze({
      service_pin: INSTITUTION_KNOWLEDGE_ANSWER_SAFETY_SERVICE_PIN_V2,
      evaluateRequestAndSources: async () => ({ status: "unavailable" as const }),
      validateDraft: async () => ({ status: "unavailable" as const }),
    }),
    generationOwner: Object.freeze({
      generate: async () => ({ status: "unavailable" as const }),
    }),
    conflictCandidates: Object.freeze({
      record: async () => ({ status: "unavailable" as const }),
    }),
    optionIssuer: Object.freeze({ issue: () => null }),
    answerPolicy: Object.freeze({
      answer_policy_version: "unavailable",
      rule_set_ref: "unavailable",
      rule_version: "unavailable",
    }),
  });

export class NurtureInstitutionKnowledgeSurfaceHandler {
  private readonly commandSpecs;

  constructor(private readonly deps: NurtureInstitutionKnowledgeSurfaceDeps) {
    this.commandSpecs = createInstitutionKnowledgeCommandSpecs({
      protected_content: deps.protectedContent,
    });
  }

  async handle(
    requestValue: unknown,
    trusted: NurtureInstitutionKnowledgeTrustedContextV1,
  ): Promise<NurtureInstitutionKnowledgeAdapterResponse> {
    const request = parseNurtureInstitutionKnowledgeSurfaceRequest(requestValue);
    if (!request) return { status: "invalid", reason_code: "invalid_institution_knowledge_request" };
    if (!validTrustedContext(trusted)) {
      return { status: "unavailable", reason_code: "invalid_trusted_institution_knowledge_context" };
    }
    let resolved: NurtureInstitutionKnowledgeBindingDecision;
    try {
      resolved = await this.deps.bindings.resolve({ request, trusted });
    } catch {
      return unavailable;
    }
    if (resolved.status !== "resolved") return resolved;
    try {
      if (!validBinding({ request, trusted, binding: resolved.binding })) {
        return { status: "unavailable", reason_code: "institution_knowledge_binding_drift" };
      }
      if (request.capabilityKey === "query_institution_knowledge_preview") {
        return await this.preview(request, trusted, resolved.binding);
      }
      if (request.capabilityKey === "answer_institution_knowledge") {
        return await this.answer(request, trusted, resolved.binding);
      }
      return await this.execute(request, trusted, resolved.binding);
    } catch (error) {
      return error instanceof Error && error.message === "incomplete_trusted_knowledge_binding"
        ? { status: "unavailable", reason_code: error.message }
        : unavailable;
    }
  }

  private async preview(
    request: NurtureInstitutionKnowledgeSurfaceRequest<"query_institution_knowledge_preview">,
    trusted: NurtureInstitutionKnowledgeTrustedContextV1,
    binding: NurtureInstitutionKnowledgePreparedBindingV1,
  ): Promise<NurtureInstitutionKnowledgeAdapterResponse> {
    const result = await this.deps.preview.preview({
      context: {
        workspace_id: trusted.workspace_id,
        institution_ref: binding.institution_ref,
        participant_ref: trusted.actor_participant_ref,
        role_assignment_ref: binding.role_assignment_ref,
        surface: binding.surface_key,
        purpose: "institution_admin_editor_preview",
        invocation_ref: trusted.invocation_request_id,
        evaluated_at: binding.evaluated_at,
      },
      request: { revision_option_refs: request.operationInput.revisionOptionRefs },
    });
    return result.status === "resolved"
      ? { status: "ok", result: presentPreview(result.options) }
      : { status: result.status, reason_code: `institution_knowledge_preview_${result.status}` };
  }

  private async answer(
    request: NurtureInstitutionKnowledgeSurfaceRequest<"answer_institution_knowledge">,
    trusted: NurtureInstitutionKnowledgeTrustedContextV1,
    binding: NurtureInstitutionKnowledgePreparedBindingV1,
  ): Promise<NurtureInstitutionKnowledgeAdapterResponse> {
    const result = await answerInstitutionKnowledgeV1({
      public_query: {
        question: request.operationInput.question,
        ...(request.operationInput.ageBandKeys
          ? { age_band_keys: request.operationInput.ageBandKeys }
          : {}),
        ...(request.operationInput.scenarioKeys
          ? { scenario_keys: request.operationInput.scenarioKeys }
          : {}),
      },
      trusted_context: {
        workspace_id: trusted.workspace_id,
        institution_ref: binding.institution_ref,
        participant_ref: trusted.actor_participant_ref,
        role_assignment_ref: binding.role_assignment_ref,
        surface: binding.surface_key,
        purpose: "institution_admin_online_answer",
        invocation_ref: trusted.invocation_request_id,
        evaluated_at: binding.evaluated_at,
      },
      ...this.deps.answerPolicy,
      retrieval_owner: this.deps.retrievalOwner,
      pre_generation_nurture_currentness: this.deps.nurtureCurrentness,
      pre_generation_authority_currentness: this.deps.authorityCurrentness,
      final_nurture_currentness: this.deps.nurtureCurrentness,
      final_authority_currentness: this.deps.finalAuthorityCurrentness,
      admin_authority: this.deps.adminAuthority,
      safety_owner: this.deps.safetyOwner,
      generation_owner: this.deps.generationOwner,
      conflict_recorder: this.deps.conflictCandidates,
    });
    if (result.status !== "resolved") {
      return {
        status: result.status,
        reason_code: `institution_knowledge_answer_${result.status}`,
      };
    }
    const presented = presentInstitutionKnowledgeAnswer(
      result.result,
      trusted,
      this.deps.optionIssuer,
    );
    return presented
      ? { status: "ok", result: presented }
      : { status: "unavailable", reason_code: "institution_knowledge_option_issuer_unavailable" };
  }

  private execute(
    request: NurtureInstitutionKnowledgeSurfaceRequest<NurtureInstitutionKnowledgeLifecycleActionKey>,
    trusted: NurtureInstitutionKnowledgeTrustedContextV1,
    binding: NurtureInstitutionKnowledgePreparedBindingV1,
  ): Promise<NurtureInstitutionKnowledgeAdapterResponse> {
    const common = {
      workspace_id: trusted.workspace_id,
      institution_ref: binding.institution_ref,
      role_assignment_ref: binding.role_assignment_ref,
    };
    switch (request.capabilityKey) {
      case "create_institution_knowledge_item": {
        const input = request.operationInput;
        const payload: NurtureCreateInstitutionKnowledgeItemPayload = {
          ...common,
          ...metadataPayload(input, binding),
          category: input.category,
        };
        return this.run(request, trusted, binding,
          this.commandSpecs.createInstitutionKnowledgeItem, payload);
      }
      case "create_institution_knowledge_revision": {
        const payload: NurtureCreateInstitutionKnowledgeRevisionPayload = {
          ...common,
          ...metadataPayload(request.operationInput, binding),
          item_ref: required(binding.item_ref),
          expected_item_head: required(binding.expected_item_head),
        };
        return this.run(request, trusted, binding,
          this.commandSpecs.createInstitutionKnowledgeRevision, payload);
      }
      case "record_institution_knowledge_review": {
        const payload: NurtureRecordInstitutionKnowledgeReviewPayload = {
          ...common,
          item_ref: required(binding.item_ref),
          revision_ref: required(binding.revision_ref),
          expected_item_head: required(binding.expected_item_head),
          decision: request.operationInput.decision,
          reason_key: request.operationInput.reasonKey,
        };
        return this.run(request, trusted, binding,
          this.commandSpecs.recordInstitutionKnowledgeReview, payload);
      }
      case "publish_institution_knowledge_revision": {
        const payload: NurturePublishInstitutionKnowledgeRevisionPayload = {
          ...common,
          item_ref: required(binding.item_ref),
          revision_ref: required(binding.revision_ref),
          expected_item_head: required(binding.expected_item_head),
        };
        return this.run(request, trusted, binding,
          this.commandSpecs.publishInstitutionKnowledgeRevision, payload);
      }
      case "revoke_institution_knowledge_revision": {
        const payload: NurtureRevokeInstitutionKnowledgeRevisionPayload = {
          ...common,
          item_ref: required(binding.item_ref),
          revision_ref: required(binding.revision_ref),
          expected_item_head: required(binding.expected_item_head),
          reason_key: request.operationInput.reasonKey,
        };
        return this.run(request, trusted, binding,
          this.commandSpecs.revokeInstitutionKnowledgeRevision, payload);
      }
    }
  }

  private async run<Input>(
    request: NurtureInstitutionKnowledgeSurfaceRequest<NurtureInstitutionKnowledgeLifecycleActionKey>,
    trusted: NurtureInstitutionKnowledgeTrustedContextV1,
    binding: NurtureInstitutionKnowledgePreparedBindingV1,
    spec: NurtureCommandSpec<Input>,
    payload: Input,
  ): Promise<NurtureInstitutionKnowledgeAdapterResponse> {
    const execution = await this.deps.commands.execute({
      capability_key: request.capabilityKey,
      confirmation_ref: request.confirmationRef,
      trusted,
      spec,
      payload,
    });
    if (execution.status !== "committed") return execution;
    const result = execution.result;
    const targetsExistingItem = request.capabilityKey !== "create_institution_knowledge_item";
    const targetsExistingRevision = [
      "record_institution_knowledge_review",
      "publish_institution_knowledge_revision",
      "revoke_institution_knowledge_revision",
    ].includes(request.capabilityKey);
    if ((targetsExistingItem && result.item_ref !== binding.item_ref) ||
      (targetsExistingRevision && result.revision_ref !== binding.revision_ref) ||
      (binding.expected_item_head !== undefined && result.item_head <= binding.expected_item_head)) {
      return { status: "unavailable", reason_code: "institution_knowledge_committed_result_drift" };
    }
    const itemOptionRef = this.deps.optionIssuer.issue({
      workspace_id: trusted.workspace_id,
      actor_participant_ref: trusted.actor_participant_ref,
      kind: "item",
      target_ref: result.item_ref,
      version: result.item_head,
    });
    const revisionOptionRef = this.deps.optionIssuer.issue({
      workspace_id: trusted.workspace_id,
      actor_participant_ref: trusted.actor_participant_ref,
      kind: "revision",
      target_ref: result.revision_ref,
      version: result.revision_number,
    });
    if (!opaqueRef(itemOptionRef) || !opaqueRef(revisionOptionRef)) {
      return { status: "unavailable", reason_code: "institution_knowledge_option_issuer_unavailable" };
    }
    return {
      status: "ok",
      disposition: execution.disposition,
      result: {
        effect: request.capabilityKey,
        itemOptionRef,
        revisionOptionRef,
        itemHead: result.item_head,
        revisionNumber: result.revision_number,
        revisionState: result.revision_state,
        committedAt: result.committed_at,
      },
    };
  }
}
