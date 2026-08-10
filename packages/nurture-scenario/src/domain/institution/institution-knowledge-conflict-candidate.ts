import { createHash } from "node:crypto";
import { assertCanonicalRef, type CanonicalRef } from "@my-chat/workflow-contracts";
import {
  assertProtectedContentEnvelopeV1,
  assertProtectedContentPlaintext,
  type ProtectedContentEnvelopeV1,
  type ProtectedContentWritePort,
} from "../../harness/protected-content.js";
import {
  NurtureCommandRunner,
  NurtureDeterministicRollback,
  canonicalJsonV1,
  type NurtureCommandSpec,
} from "../commands/command-kernel.js";

export const INSTITUTION_KNOWLEDGE_CONFLICT_CANDIDATE_CONTRACT = {
  key: "nurture.institution-knowledge-conflict-review-candidate",
  version: "1.0.0",
} as const;

export const INSTITUTION_KNOWLEDGE_CONFLICT_CLASSES = [
  "contradictory_action",
  "contradictory_sequence",
  "contradictory_escalation",
  "contraindication_conflict",
] as const;

export type NurtureInstitutionKnowledgeConflictClass =
  (typeof INSTITUTION_KNOWLEDGE_CONFLICT_CLASSES)[number];

export type NurtureInstitutionKnowledgeExactSourceTupleV1 = {
  source_ref: CanonicalRef;
  source_version: string;
  content_hash: string;
};

export type NurtureInstitutionKnowledgeConflictFindingV1 = {
  conflict_class: NurtureInstitutionKnowledgeConflictClass;
  finding_fingerprint: string;
  sources: NurtureInstitutionKnowledgeExactSourceTupleV1[];
};

export type NurtureInstitutionKnowledgeConflictCandidatePayloadV1 = {
  workspace_id: string;
  institution_ref: string;
  rule_set_ref: string;
  rule_version: string;
  finding: NurtureInstitutionKnowledgeConflictFindingV1;
  targeted_nurture_revision_refs: string[];
};

export type NurtureInstitutionKnowledgeConflictReviewCandidateV1 = {
  contract_version: typeof INSTITUTION_KNOWLEDGE_CONFLICT_CANDIDATE_CONTRACT.version;
  candidate_ref: string;
  workspace_id: string;
  institution_ref: string;
  candidate_identity_hash: string;
  rule_set_ref: string;
  rule_version: string;
  conflict_class: NurtureInstitutionKnowledgeConflictClass;
  finding_fingerprint: string;
  source_tuples: NurtureInstitutionKnowledgeExactSourceTupleV1[];
  targeted_nurture_revision_refs: string[];
  evidence_mode: "none";
  evidence_envelope: ProtectedContentEnvelopeV1;
  command_execution_ref: string;
  created_at: string;
};

export type NurtureInstitutionKnowledgeConflictCandidateTransaction = {
  findByIdentity(input: {
    workspace_id: string;
    institution_ref: string;
    candidate_identity_hash: string;
  }): Promise<NurtureInstitutionKnowledgeConflictReviewCandidateV1 | null>;
  appendCandidate(input: Omit<
    NurtureInstitutionKnowledgeConflictReviewCandidateV1,
    "contract_version" | "created_at" | "command_execution_ref"
  > & {
    command_execution_id: string;
  }): Promise<NurtureInstitutionKnowledgeConflictReviewCandidateV1 | null>;
};

export type InstitutionKnowledgeConflictCandidateRecorderV1 = {
  record(
    payload: NurtureInstitutionKnowledgeConflictCandidatePayloadV1,
  ): Promise<{ status: "resolved"; candidate_ref: string } | { status: "unavailable" }>;
};

const HASH_PATTERN = /^[0-9a-f]{64}$/;
const REF_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/;
const VERSION_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:+-]{0,199}$/;
const INTERNAL_ACTOR_REF = "institution-knowledge-answer-safety";
const COMMAND_KEY = "nurture.record_institution_knowledge_conflict_candidate";
const COMMAND_SCOPE = "institution_knowledge_conflict_review";

const exactKeys = (value: object, keys: readonly string[]): boolean => {
  const actual = Object.keys(value);
  return actual.length === keys.length && actual.every((key) => keys.includes(key));
};

const validSourceTuple = (
  value: NurtureInstitutionKnowledgeExactSourceTupleV1,
): boolean => {
  try {
    assertCanonicalRef(value.source_ref);
    return (
      exactKeys(value, ["source_ref", "source_version", "content_hash"]) &&
      VERSION_PATTERN.test(value.source_version) &&
      HASH_PATTERN.test(value.content_hash)
    );
  } catch {
    return false;
  }
};

const sourceTupleKey = (
  value: NurtureInstitutionKnowledgeExactSourceTupleV1,
): string => canonicalJsonV1([value.source_ref, value.source_version, value.content_hash]);

const sortSourceTuples = (
  sources: readonly NurtureInstitutionKnowledgeExactSourceTupleV1[],
): NurtureInstitutionKnowledgeExactSourceTupleV1[] =>
  [...sources].sort((left, right) => sourceTupleKey(left).localeCompare(sourceTupleKey(right)));

export const validateInstitutionKnowledgeConflictCandidatePayload = (
  value: NurtureInstitutionKnowledgeConflictCandidatePayloadV1,
): boolean => {
  if (
    !exactKeys(value, [
      "workspace_id",
      "institution_ref",
      "rule_set_ref",
      "rule_version",
      "finding",
      "targeted_nurture_revision_refs",
    ]) ||
    !REF_PATTERN.test(value.workspace_id) ||
    !REF_PATTERN.test(value.institution_ref) ||
    !REF_PATTERN.test(value.rule_set_ref) ||
    !VERSION_PATTERN.test(value.rule_version) ||
    !exactKeys(value.finding, ["conflict_class", "finding_fingerprint", "sources"]) ||
    !INSTITUTION_KNOWLEDGE_CONFLICT_CLASSES.includes(value.finding.conflict_class) ||
    !HASH_PATTERN.test(value.finding.finding_fingerprint) ||
    value.finding.sources.length < 2 ||
    value.finding.sources.length > 8 ||
    value.finding.sources.some((source) => !validSourceTuple(source)) ||
    new Set(value.finding.sources.map(sourceTupleKey)).size !== value.finding.sources.length ||
    value.targeted_nurture_revision_refs.length > 8 ||
    value.targeted_nurture_revision_refs.some((ref) => !REF_PATTERN.test(ref)) ||
    new Set(value.targeted_nurture_revision_refs).size !==
      value.targeted_nurture_revision_refs.length
  ) return false;
  return true;
};

const canonicalPayload = (
  payload: NurtureInstitutionKnowledgeConflictCandidatePayloadV1,
): NurtureInstitutionKnowledgeConflictCandidatePayloadV1 => ({
  ...payload,
  finding: {
    ...payload.finding,
    sources: sortSourceTuples(payload.finding.sources),
  },
  targeted_nurture_revision_refs: [...payload.targeted_nurture_revision_refs].sort(),
});

export const institutionKnowledgeConflictCandidateIdentityHash = (
  payload: NurtureInstitutionKnowledgeConflictCandidatePayloadV1,
): string => {
  if (!validateInstitutionKnowledgeConflictCandidatePayload(payload)) {
    throw new Error("invalid institution knowledge conflict candidate payload");
  }
  const canonical = canonicalPayload(payload);
  return createHash("sha256")
    .update(
      `nurture.institution-knowledge-conflict-candidate.v1\0${canonicalJsonV1({
        workspace_id: canonical.workspace_id,
        institution_ref: canonical.institution_ref,
        rule_set_ref: canonical.rule_set_ref,
        rule_version: canonical.rule_version,
        conflict_class: canonical.finding.conflict_class,
        finding_fingerprint: canonical.finding.finding_fingerprint,
        source_tuples: canonical.finding.sources,
        targeted_nurture_revision_refs: canonical.targeted_nurture_revision_refs,
      })}`,
      "utf8",
    )
    .digest("hex");
};

const candidateRefFor = (identityHash: string): string =>
  `institution-knowledge-conflict-${identityHash}`;

const candidateOutputRef = (candidateRef: string): CanonicalRef => ({
  schema_version: 1,
  namespace: "nurture",
  object_type: "institution_knowledge_conflict_review_candidate",
  object_id: candidateRef,
  version: 1,
});

type CandidateFinalization = {
  candidate_ref: string;
  candidate_identity_hash: string;
  evidence_envelope: ProtectedContentEnvelopeV1;
};

const isCandidateFinalization = (value: unknown): value is CandidateFinalization => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  try {
    assertProtectedContentEnvelopeV1(record.evidence_envelope);
  } catch {
    return false;
  }
  return (
    exactKeys(record, ["candidate_ref", "candidate_identity_hash", "evidence_envelope"]) &&
    typeof record.candidate_ref === "string" &&
    REF_PATTERN.test(record.candidate_ref) &&
    typeof record.candidate_identity_hash === "string" &&
    HASH_PATTERN.test(record.candidate_identity_hash)
  );
};

const committedResult = (candidateRef: string, identityHash: string) => ({
  candidate_ref: candidateRef,
  candidate_identity_hash: identityHash,
});

const buildEvidence = (
  payload: NurtureInstitutionKnowledgeConflictCandidatePayloadV1,
): string => assertProtectedContentPlaintext(canonicalJsonV1({
  schema_version: 1,
  evidence_mode: "none",
  rule_set_ref: payload.rule_set_ref,
  rule_version: payload.rule_version,
  conflict_class: payload.finding.conflict_class,
  finding_fingerprint: payload.finding.finding_fingerprint,
  source_tuples: sortSourceTuples(payload.finding.sources),
  targeted_nurture_revision_refs: [...payload.targeted_nurture_revision_refs].sort(),
}));

const existingDecision = (
  candidate: NurtureInstitutionKnowledgeConflictReviewCandidateV1,
) => ({
  status: "already_satisfied" as const,
  output_refs: [candidateOutputRef(candidate.candidate_ref)],
  result_schema_version: 1,
  committed_result: committedResult(
    candidate.candidate_ref,
    candidate.candidate_identity_hash,
  ),
});

export const createInstitutionKnowledgeConflictCandidateSpec = (input: {
  protected_content: Pick<ProtectedContentWritePort, "seal">;
}): NurtureCommandSpec<NurtureInstitutionKnowledgeConflictCandidatePayloadV1> => ({
  command_key: COMMAND_KEY,
  command_scope: COMMAND_SCOPE,
  contract_version: 1,
  canonicalize(payload) {
    if (!validateInstitutionKnowledgeConflictCandidatePayload(payload)) {
      throw new Error("invalid conflict candidate payload");
    }
    return canonicalPayload(payload);
  },
  async checkPreconditions(transaction, payload, context) {
    if (
      !transaction.institutionKnowledgeConflicts ||
      context.business_actor_ref !== INTERNAL_ACTOR_REF ||
      context.workspace_id !== payload.workspace_id ||
      !validateInstitutionKnowledgeConflictCandidatePayload(payload)
    ) return { status: "invalid", reason_code: "conflict_candidate_contract_mismatch" };
    const identityHash = institutionKnowledgeConflictCandidateIdentityHash(payload);
    const existing = await transaction.institutionKnowledgeConflicts.findByIdentity({
      workspace_id: payload.workspace_id,
      institution_ref: payload.institution_ref,
      candidate_identity_hash: identityHash,
    });
    if (
      existing &&
      (existing.candidate_identity_hash !== identityHash ||
        existing.candidate_ref !== candidateRefFor(identityHash))
    ) return { status: "blocked", reason_code: "conflict_candidate_owner_unavailable" };
    return existing ? existingDecision(existing) : { status: "ready" };
  },
  async apply(transaction, payload, context) {
    const owner = transaction.institutionKnowledgeConflicts;
    if (!owner || context.business_actor_ref !== INTERNAL_ACTOR_REF) {
      throw new NurtureDeterministicRollback(
        "conflict_candidate_owner_unavailable",
        "technical_error",
      );
    }
    const identityHash = institutionKnowledgeConflictCandidateIdentityHash(payload);
    const candidateRef = candidateRefFor(identityHash);
    let evidenceEnvelope: ProtectedContentEnvelopeV1;
    try {
      evidenceEnvelope = assertProtectedContentEnvelopeV1(
        input.protected_content.seal(buildEvidence(canonicalPayload(payload))),
      );
    } catch {
      throw new NurtureDeterministicRollback(
        "conflict_candidate_protected_content_unavailable",
        "technical_error",
      );
    }
    return {
      output_refs: [candidateOutputRef(candidateRef)],
      result_schema_version: 1,
      committed_result: committedResult(candidateRef, identityHash),
      finalization_payload: {
        candidate_ref: candidateRef,
        candidate_identity_hash: identityHash,
        evidence_envelope: evidenceEnvelope,
      } satisfies CandidateFinalization,
    };
  },
  async afterExecutionCreated(transaction, payload, _context, applied) {
    const owner = transaction.institutionKnowledgeConflicts;
    if (!owner || !isCandidateFinalization(applied.finalization_payload)) {
      throw new NurtureDeterministicRollback(
        "conflict_candidate_finalization_unavailable",
        "technical_error",
      );
    }
    const canonical = canonicalPayload(payload);
    const created = await owner.appendCandidate({
      candidate_ref: applied.finalization_payload.candidate_ref,
      workspace_id: canonical.workspace_id,
      institution_ref: canonical.institution_ref,
      candidate_identity_hash: applied.finalization_payload.candidate_identity_hash,
      rule_set_ref: canonical.rule_set_ref,
      rule_version: canonical.rule_version,
      conflict_class: canonical.finding.conflict_class,
      finding_fingerprint: canonical.finding.finding_fingerprint,
      source_tuples: canonical.finding.sources,
      targeted_nurture_revision_refs: canonical.targeted_nurture_revision_refs,
      evidence_mode: "none",
      evidence_envelope: applied.finalization_payload.evidence_envelope,
      command_execution_id: applied.execution.id,
    });
    if (
      !created ||
      created.candidate_ref !== applied.finalization_payload.candidate_ref ||
      created.candidate_identity_hash !== applied.finalization_payload.candidate_identity_hash
    ) {
      throw new NurtureDeterministicRollback(
        "conflict_candidate_write_unavailable",
        "technical_error",
      );
    }
  },
});

const validCommittedResult = (
  value: unknown,
): value is { candidate_ref: string; candidate_identity_hash: string } => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return (
    exactKeys(record, ["candidate_ref", "candidate_identity_hash"]) &&
    typeof record.candidate_ref === "string" &&
    REF_PATTERN.test(record.candidate_ref) &&
    typeof record.candidate_identity_hash === "string" &&
    HASH_PATTERN.test(record.candidate_identity_hash)
  );
};

export const createInstitutionKnowledgeConflictCandidateRecorder = (input: {
  command_runner: NurtureCommandRunner;
  protected_content: Pick<ProtectedContentWritePort, "seal">;
}): InstitutionKnowledgeConflictCandidateRecorderV1 => {
  const spec = createInstitutionKnowledgeConflictCandidateSpec({
    protected_content: input.protected_content,
  });
  return {
    async record(payload) {
      let identityHash: string;
      try {
        identityHash = institutionKnowledgeConflictCandidateIdentityHash(payload);
      } catch {
        return { status: "unavailable" };
      }
      const requestId = `institution-knowledge-conflict:${identityHash}`;
      const result = await input.command_runner.execute({
        workspace_id: payload.workspace_id,
        invocation_request_id: requestId,
        command_request_id: requestId,
        business_actor_ref: INTERNAL_ACTOR_REF,
        payload,
        spec,
      });
      if (
        result.status !== "ok" ||
        !validCommittedResult(result.committed_result) ||
        result.committed_result.candidate_identity_hash !== identityHash ||
        result.committed_result.candidate_ref !== candidateRefFor(identityHash)
      ) {
        return { status: "unavailable" };
      }
      return { status: "resolved", candidate_ref: result.committed_result.candidate_ref };
    },
  };
};
