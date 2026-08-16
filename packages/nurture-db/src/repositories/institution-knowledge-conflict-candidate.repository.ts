import {
  Prisma,
  type NurtureInstitutionKnowledgeConflictReviewCandidate as PrismaConflictCandidate,
  type PrismaClient,
} from "@prisma/client";
import {
  assertProtectedContentEnvelopeV1,
  institutionKnowledgeConflictCandidateIdentityHash,
  validateInstitutionKnowledgeConflictCandidatePayload,
  type NurtureInstitutionKnowledgeConflictCandidateTransaction,
  type NurtureInstitutionKnowledgeConflictReviewCandidateV1,
  type NurtureInstitutionKnowledgeExactSourceTupleV1,
} from "@the-nurture/scenario";
import { asJson } from "./prisma-json.js";

const toCandidate = (
  row: PrismaConflictCandidate,
): NurtureInstitutionKnowledgeConflictReviewCandidateV1 => {
  const payload = {
    workspace_id: row.workspaceId,
    institution_ref: row.institutionId,
    rule_set_ref: row.ruleSetRef,
    rule_version: row.ruleVersion,
    finding: {
      conflict_class: row.conflictClass as NurtureInstitutionKnowledgeConflictReviewCandidateV1["conflict_class"],
      finding_fingerprint: row.findingFingerprint,
      sources: row.sourceTuples as unknown as NurtureInstitutionKnowledgeExactSourceTupleV1[],
    },
    targeted_nurture_revision_refs: row.targetedNurtureRevisionRefs,
  };
  if (
    row.evidenceMode !== "none" ||
    !validateInstitutionKnowledgeConflictCandidatePayload(payload) ||
    institutionKnowledgeConflictCandidateIdentityHash(payload) !== row.candidateIdentityHash ||
    row.candidateRef !== `institution-knowledge-conflict-${row.candidateIdentityHash}`
  ) throw new Error("invalid stored institution knowledge conflict candidate");
  return {
    contract_version: "1.0.0",
    candidate_ref: row.candidateRef,
    workspace_id: row.workspaceId,
    institution_ref: row.institutionId,
    candidate_identity_hash: row.candidateIdentityHash,
    rule_set_ref: row.ruleSetRef,
    rule_version: row.ruleVersion,
    conflict_class: payload.finding.conflict_class,
    finding_fingerprint: row.findingFingerprint,
    source_tuples: payload.finding.sources,
    targeted_nurture_revision_refs: row.targetedNurtureRevisionRefs,
    evidence_mode: "none",
    evidence_envelope: assertProtectedContentEnvelopeV1(row.evidenceEnvelope),
    command_execution_ref: row.commandExecutionId,
    created_at: row.createdAt.toISOString(),
  };
};

export class PrismaInstitutionKnowledgeConflictCandidateRepository
  implements NurtureInstitutionKnowledgeConflictCandidateTransaction
{
  constructor(private readonly prisma: PrismaClient | Prisma.TransactionClient) {}

  async findByIdentity(input: {
    workspace_id: string;
    institution_ref: string;
    candidate_identity_hash: string;
  }): Promise<NurtureInstitutionKnowledgeConflictReviewCandidateV1 | null> {
    const row = await this.prisma.nurtureInstitutionKnowledgeConflictReviewCandidate.findUnique({
      where: {
        workspaceId_institutionId_candidateIdentityHash: {
          workspaceId: input.workspace_id,
          institutionId: input.institution_ref,
          candidateIdentityHash: input.candidate_identity_hash,
        },
      },
    });
    return row ? toCandidate(row) : null;
  }

  async appendCandidate(
    input: Parameters<NurtureInstitutionKnowledgeConflictCandidateTransaction["appendCandidate"]>[0],
  ): Promise<NurtureInstitutionKnowledgeConflictReviewCandidateV1 | null> {
    const row = await this.prisma.nurtureInstitutionKnowledgeConflictReviewCandidate.create({
      data: {
        candidateRef: input.candidate_ref,
        workspaceId: input.workspace_id,
        institutionId: input.institution_ref,
        candidateIdentityHash: input.candidate_identity_hash,
        ruleSetRef: input.rule_set_ref,
        ruleVersion: input.rule_version,
        conflictClass: input.conflict_class,
        findingFingerprint: input.finding_fingerprint,
        sourceTuples: asJson(input.source_tuples),
        targetedNurtureRevisionRefs: input.targeted_nurture_revision_refs,
        evidenceMode: input.evidence_mode,
        evidenceEnvelope: asJson(input.evidence_envelope),
        commandExecutionId: input.command_execution_id,
      },
    });
    return toCandidate(row);
  }
}
