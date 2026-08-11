import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import {
  INSTITUTION_KNOWLEDGE_ANSWER_SAFETY_SERVICE_PIN_V2,
  NurtureCommandRunner,
  answerInstitutionKnowledgeV1,
  createInMemoryNurtureCommandRepository,
  createInstitutionKnowledgeConflictCandidateRecorder,
  createInstitutionKnowledgePortableAnswer,
  institutionKnowledgeConflictCandidateIdentityHash,
  type InstitutionKnowledgeAnswerSafetyOwnerPortV2,
  type InstitutionKnowledgeAuthorityCitationCurrentnessOwnerPortV1,
  type InstitutionKnowledgeConflictCandidateRecorderV1,
  type InstitutionKnowledgeGenerationOwnerPortV1,
  type NurtureAuthorityKnowledgeSourceCurrentnessProviderV1,
  type NurtureInstitutionKnowledgeConflictCandidatePayloadV1,
  type NurtureInstitutionKnowledgeConflictCandidateTransaction,
  type NurtureInstitutionKnowledgeRetrievalCandidateV1,
  type NurtureInstitutionKnowledgeSourceCurrentnessProviderV1,
} from "../../src/index.js";

const HASH_A = "a".repeat(64);
const HASH_B = "b".repeat(64);
const DECISION_HASH = "d".repeat(64);
const FINDING_HASH = "f".repeat(64);

const sourceRef = {
  schema_version: 1 as const,
  namespace: "nurture",
  object_type: "institution_knowledge_source",
  object_id: "opaque-source-1",
};

const authorityRef = {
  schema_version: 1 as const,
  namespace: "my_chat",
  object_type: "knowledge_source",
  object_id: "opaque-authority-source-1",
};

const nurtureCandidate = (): NurtureInstitutionKnowledgeRetrievalCandidateV1 => ({
  candidate_ref: "candidate-nurture-1",
  source_ref: sourceRef,
  source_version: `r1:${HASH_A}`,
  content_hash: HASH_A,
  source_owner: "nurture",
  source_kind: "nurture_institution_revision",
  provenance_kind: "institution_authored",
  rank: 1,
  match_reason: "semantic_match",
  excerpt: "Follow the institution transition routine.",
  host_current_source_decision: "current",
  title: "Transition routine",
  item_ref: "knowledge-item-1",
  revision_ref: "knowledge-revision-1",
  revision_number: 1,
  publication_event_ref: {
    schema_version: 1,
    namespace: "nurture",
    object_type: "institution_knowledge_revision_event",
    object_id: "publication-event-1",
    version: 3,
  },
  published_at: "2026-08-10T03:00:00.000Z",
  open_ref: "institution-open-1",
  authority_sources: [],
});

const authorityCandidate = (): NurtureInstitutionKnowledgeRetrievalCandidateV1 => ({
  candidate_ref: "candidate-authority-1",
  source_ref: authorityRef,
  source_version: "2026.08.10",
  content_hash: HASH_B,
  source_owner: "my_chat",
  source_kind: "authority_source",
  provenance_kind: "authority_source",
  rank: 2,
  match_reason: "authority_match",
  excerpt: "Seek qualified medical help for danger signs.",
  host_current_source_decision: "current",
  publisher: "Public health authority",
  title: "Danger signs",
  source_date: "2026-08-01",
  open_ref: "authority-open-1",
});

const trustedContext = {
  workspace_id: "workspace-1",
  institution_ref: "institution-1",
  participant_ref: "admin-1",
  role_assignment_ref: "admin-role-1",
  surface: "institution_workbench",
  purpose: "institution_admin_online_answer",
  invocation_ref: "invocation-1",
  evaluated_at: "2026-08-10T12:00:00.000Z",
};

const nurtureCurrentness = (
  decision: "eligible" | "denied" = "eligible",
): NurtureInstitutionKnowledgeSourceCurrentnessProviderV1 => ({
  validateSources: vi.fn(async (
    { sources }: Parameters<NurtureInstitutionKnowledgeSourceCurrentnessProviderV1["validateSources"]>[0],
  ) => ({
    status: "resolved" as const,
    decisions: sources.map((source) => decision === "eligible"
      ? { ...source, decision }
      : { ...source, decision, reason_code: "content_drift" as const }),
  })),
});

const preAuthorityCurrentness = (): NurtureAuthorityKnowledgeSourceCurrentnessProviderV1 => ({
  validateSources: vi.fn(async (
    { sources }: Parameters<NurtureAuthorityKnowledgeSourceCurrentnessProviderV1["validateSources"]>[0],
  ) => ({
    status: "resolved" as const,
    decisions: sources.map((source) => ({ ...source, decision: "eligible" as const })),
  })),
});

const finalAuthorityCurrentness = (
  decision: "eligible" | "denied" = "eligible",
): InstitutionKnowledgeAuthorityCitationCurrentnessOwnerPortV1 => ({
  validateSources: vi.fn(async (
    { sources }: Parameters<InstitutionKnowledgeAuthorityCitationCurrentnessOwnerPortV1["validateSources"]>[0],
  ) => ({
    status: "resolved" as const,
    decisions: sources.map((source) => decision === "eligible"
      ? { ...source, decision }
      : { ...source, decision, reason_code: "content_drift" as const }),
  })),
});

const clearSafety = (
  requestStatus: "general_clear" | "medical_clear" = "general_clear",
): InstitutionKnowledgeAnswerSafetyOwnerPortV2 => ({
  service_pin: INSTITUTION_KNOWLEDGE_ANSWER_SAFETY_SERVICE_PIN_V2,
  evaluateRequestAndSources: vi.fn(async () => ({
    status: requestStatus,
    rule_set_ref: "answer-safety-rules",
    rule_version: "1.0.0",
    decision_fingerprint: DECISION_HASH,
  })),
  validateDraft: vi.fn(async () => ({
    status: "safe" as const,
    rule_set_ref: "answer-safety-rules",
    rule_version: "1.0.0",
    decision_fingerprint: DECISION_HASH,
  })),
});

const generation = (input: {
  claim_kind?: "institution_process" | "medical_fact";
  candidate_refs?: string[];
  extra_draft_field?: boolean;
} = {}): InstitutionKnowledgeGenerationOwnerPortV1 => ({
  generate: vi.fn(async (request) => ({
    status: "resolved" as const,
    draft: {
      generation_ref: "generation-1",
      input_digest: request.input_digest,
      generated_at: "2026-08-10T12:00:01.000Z",
      assistance_kind: "ai_generated_with_retrieved_sources" as const,
      claims: [{
        text: "Use the cited guidance.",
        claim_kind: input.claim_kind ?? "institution_process",
        candidate_refs: input.candidate_refs ?? ["candidate-nurture-1"],
      }],
      ...(input.extra_draft_field ? { provider: "forbidden" } : {}),
    },
  })),
});

const recorder = (
  status: "resolved" | "unavailable" = "resolved",
): InstitutionKnowledgeConflictCandidateRecorderV1 => ({
  record: vi.fn(async () => status === "resolved"
    ? { status, candidate_ref: "institution-knowledge-conflict-recorded" }
    : { status }),
});

const dependencies = (
  candidates: NurtureInstitutionKnowledgeRetrievalCandidateV1[],
  overrides: Partial<Parameters<typeof answerInstitutionKnowledgeV1>[0]> = {},
): Parameters<typeof answerInstitutionKnowledgeV1>[0] => ({
  public_query: { question: "What should an administrator do?" },
  trusted_context: trustedContext,
  answer_policy_version: "1.0.0",
  rule_set_ref: "answer-safety-rules",
  rule_version: "1.0.0",
  retrieval_owner: {
    retrieveCandidates: vi.fn(async () => ({ status: "resolved" as const, candidates })),
  },
  pre_generation_nurture_currentness: nurtureCurrentness(),
  pre_generation_authority_currentness: preAuthorityCurrentness(),
  final_nurture_currentness: nurtureCurrentness(),
  final_authority_currentness: finalAuthorityCurrentness(),
  admin_authority: { authorize: vi.fn(async () => "authorized" as const) },
  safety_owner: clearSafety(),
  generation_owner: generation(),
  conflict_recorder: recorder(),
  ...overrides,
});

describe("G4-E answer safety orchestration", () => {
  it("returns only strict cited claims and preserves them in portable output", async () => {
    const result = await answerInstitutionKnowledgeV1(dependencies([nurtureCandidate()]));
    expect(result).toMatchObject({
      status: "resolved",
      result: {
        status: "answered",
        claims: [{ citation_refs: ["citation-1"] }],
        citations: [{
          source_kind: "institution_material",
          label: "园区材料",
          provenance_kind: "institution_authored",
        }],
        assistance_kind: "ai_generated_with_retrieved_sources",
      },
    });
    if (result.status !== "resolved") throw new Error("answer was not resolved");
    const portable = createInstitutionKnowledgePortableAnswer(result.result);
    expect(portable).toMatchObject({
      status: "resolved",
      artifact: {
        claims: result.result.status === "answered" ? result.result.claims : [],
        citations: result.result.status === "answered" ? result.result.citations : [],
        generation_ref: "generation-1",
      },
    });
  });

  it("requires a separately current authority citation for every medical claim", async () => {
    const candidates = [nurtureCandidate(), authorityCandidate()];
    const answered = await answerInstitutionKnowledgeV1(dependencies(candidates, {
      safety_owner: clearSafety("medical_clear"),
      generation_owner: generation({
        claim_kind: "medical_fact",
        candidate_refs: ["candidate-nurture-1", "candidate-authority-1"],
      }),
    }));
    expect(answered).toMatchObject({
      status: "resolved",
      result: {
        status: "answered",
        citations: [
          { source_kind: "institution_material", provenance_kind: "institution_authored" },
          { source_kind: "authority_source", provenance_kind: "authority_source" },
        ],
        safety_notice: { reason_keys: expect.arrayContaining(["not_a_diagnosis"]) },
      },
    });

    await expect(answerInstitutionKnowledgeV1(dependencies([nurtureCandidate()], {
      safety_owner: clearSafety("medical_clear"),
      generation_owner: generation({ claim_kind: "medical_fact" }),
    }))).resolves.toEqual({ status: "unavailable" });
  });

  it("keeps no-source and unsafe-request abstentions pre-generation and side-effect free", async () => {
    const noSourceGeneration = generation();
    const noSourceRecorder = recorder();
    await expect(answerInstitutionKnowledgeV1(dependencies([], {
      generation_owner: noSourceGeneration,
      conflict_recorder: noSourceRecorder,
    }))).resolves.toEqual({
      status: "resolved",
      result: { status: "abstained_no_source", contract_version: "2.0.0" },
    });
    expect(noSourceGeneration.generate).not.toHaveBeenCalled();
    expect(noSourceRecorder.record).not.toHaveBeenCalled();

    const unsafeGeneration = generation();
    const unsafeRecorder = recorder();
    const unsafeSafety: InstitutionKnowledgeAnswerSafetyOwnerPortV2 = {
      ...clearSafety(),
      evaluateRequestAndSources: vi.fn(async () => ({
        status: "unsafe_request" as const,
        rule_set_ref: "answer-safety-rules",
        rule_version: "1.0.0",
        decision_fingerprint: DECISION_HASH,
        reason_codes: ["child_specific_or_private_fact" as const],
      })),
    };
    await expect(answerInstitutionKnowledgeV1(dependencies([nurtureCandidate()], {
      safety_owner: unsafeSafety,
      generation_owner: unsafeGeneration,
      conflict_recorder: unsafeRecorder,
    }))).resolves.toMatchObject({
      status: "resolved",
      result: {
        status: "abstained_safety",
        safety_notice: { reason_keys: ["remove_child_specific_details"] },
      },
    });
    expect(unsafeGeneration.generate).not.toHaveBeenCalled();
    expect(unsafeRecorder.record).not.toHaveBeenCalled();
  });

  it("rejects model-added fields and hides sources that drift after generation", async () => {
    await expect(answerInstitutionKnowledgeV1(dependencies([nurtureCandidate()], {
      generation_owner: generation({ extra_draft_field: true }),
    }))).resolves.toEqual({ status: "unavailable" });

    await expect(answerInstitutionKnowledgeV1(dependencies([nurtureCandidate()], {
      final_nurture_currentness: nurtureCurrentness("denied"),
    }))).resolves.toEqual({
      status: "resolved",
      result: { status: "abstained_source_changed", contract_version: "2.0.0" },
    });

    await expect(answerInstitutionKnowledgeV1(dependencies([authorityCandidate()], {
      generation_owner: generation({ candidate_refs: ["candidate-authority-1"] }),
      final_authority_currentness: finalAuthorityCurrentness("denied"),
    }))).resolves.toEqual({
      status: "resolved",
      result: { status: "abstained_source_changed", contract_version: "2.0.0" },
    });
  });

  it("routes an unsafe draft to fixed notices without exposing draft text or writing a candidate", async () => {
    const conflictRecorder = recorder();
    const safety: InstitutionKnowledgeAnswerSafetyOwnerPortV2 = {
      ...clearSafety(),
      validateDraft: vi.fn(async () => ({
        status: "unsafe" as const,
        rule_set_ref: "answer-safety-rules",
        rule_version: "1.0.0",
        decision_fingerprint: DECISION_HASH,
        reason_codes: ["prescriptive_medication_or_dose" as const],
      })),
    };
    const result = await answerInstitutionKnowledgeV1(dependencies([nurtureCandidate()], {
      safety_owner: safety,
      conflict_recorder: conflictRecorder,
    }));
    expect(result).toEqual({
      status: "resolved",
      result: {
        status: "abstained_safety",
        contract_version: "2.0.0",
        reason_codes: ["prescriptive_medication_or_dose"],
        safety_notice: {
          reason_keys: ["not_a_prescription", "seek_qualified_medical_help"],
        },
      },
    });
    expect(JSON.stringify(result)).not.toContain("Use the cited guidance.");
    expect(conflictRecorder.record).not.toHaveBeenCalled();
    if (result.status !== "resolved") throw new Error("unsafe result was not resolved");
    expect(createInstitutionKnowledgePortableAnswer(result.result)).toEqual({ status: "invalid" });
  });

  it("rejects extra deterministic-safety fields instead of accepting a compatibility shape", async () => {
    const malformed = {
      ...clearSafety(),
      evaluateRequestAndSources: vi.fn(async () => ({
        status: "general_clear" as const,
        rule_set_ref: "answer-safety-rules",
        rule_version: "1.0.0",
        decision_fingerprint: DECISION_HASH,
        model_self_rating: "safe",
      })),
    } satisfies InstitutionKnowledgeAnswerSafetyOwnerPortV2;
    await expect(answerInstitutionKnowledgeV1(dependencies([nurtureCandidate()], {
      safety_owner: malformed,
    }))).resolves.toEqual({ status: "unavailable" });
  });

  it("finally revalidates conflict evidence and records one immutable candidate per finding", async () => {
    const candidates = [nurtureCandidate(), authorityCandidate()];
    const conflictRecorder = recorder();
    const conflictSafety: InstitutionKnowledgeAnswerSafetyOwnerPortV2 = {
      ...clearSafety(),
      evaluateRequestAndSources: vi.fn(async () => ({
        status: "material_source_conflict" as const,
        rule_set_ref: "answer-safety-rules",
        rule_version: "1.0.0",
        decision_fingerprint: DECISION_HASH,
        findings: [{
          conflict_class: "contradictory_action" as const,
          finding_fingerprint: FINDING_HASH,
          sources: candidates.map(({ source_ref, source_version, content_hash }) => ({
            source_ref,
            source_version,
            content_hash,
          })),
        }],
      })),
    };
    const result = await answerInstitutionKnowledgeV1(dependencies(candidates, {
      safety_owner: conflictSafety,
      conflict_recorder: conflictRecorder,
    }));
    expect(result).toMatchObject({
      status: "resolved",
      result: {
        status: "abstained_medical_conflict",
        conflicts: [{
          candidate_ref: "institution-knowledge-conflict-recorded",
          citation_refs: ["citation-1", "citation-2"],
        }],
        citations: [
          { source_kind: "institution_material" },
          { source_kind: "authority_source" },
        ],
      },
    });
    expect(conflictRecorder.record).toHaveBeenCalledWith(expect.objectContaining({
      targeted_nurture_revision_refs: ["knowledge-revision-1"],
    }));
  });

  it("never reports an unrecorded conflict candidate", async () => {
    const candidates = [nurtureCandidate(), authorityCandidate()];
    const safety: InstitutionKnowledgeAnswerSafetyOwnerPortV2 = {
      ...clearSafety(),
      evaluateRequestAndSources: vi.fn(async () => ({
        status: "material_source_conflict" as const,
        rule_set_ref: "answer-safety-rules",
        rule_version: "1.0.0",
        decision_fingerprint: DECISION_HASH,
        findings: [{
          conflict_class: "contraindication_conflict" as const,
          finding_fingerprint: FINDING_HASH,
          sources: candidates.map(({ source_ref, source_version, content_hash }) => ({
            source_ref,
            source_version,
            content_hash,
          })),
        }],
      })),
    };
    await expect(answerInstitutionKnowledgeV1(dependencies(candidates, {
      safety_owner: safety,
      conflict_recorder: recorder("unavailable"),
    }))).resolves.toEqual({ status: "unavailable" });
  });
});

const candidatePayload = (): NurtureInstitutionKnowledgeConflictCandidatePayloadV1 => ({
  workspace_id: "workspace-1",
  institution_ref: "institution-1",
  rule_set_ref: "answer-safety-rules",
  rule_version: "1.0.0",
  finding: {
    conflict_class: "contradictory_action",
    finding_fingerprint: FINDING_HASH,
    sources: [nurtureCandidate(), authorityCandidate()].map(
      ({ source_ref, source_version, content_hash }) => ({
        source_ref,
        source_version,
        content_hash,
      }),
    ),
  },
  targeted_nurture_revision_refs: ["knowledge-revision-1"],
});

describe("G4-E immutable conflict candidate command", () => {
  it("converges reordered evidence on one command execution and one candidate", async () => {
    const candidates = new Map<string, Awaited<ReturnType<
      NurtureInstitutionKnowledgeConflictCandidateTransaction["appendCandidate"]
    >>>();
    const appendCandidate = vi.fn(async (
      input: Parameters<NurtureInstitutionKnowledgeConflictCandidateTransaction["appendCandidate"]>[0],
    ) => {
      const row = {
        contract_version: "1.0.0" as const,
        candidate_ref: input.candidate_ref,
        workspace_id: input.workspace_id,
        institution_ref: input.institution_ref,
        candidate_identity_hash: input.candidate_identity_hash,
        rule_set_ref: input.rule_set_ref,
        rule_version: input.rule_version,
        conflict_class: input.conflict_class,
        finding_fingerprint: input.finding_fingerprint,
        source_tuples: input.source_tuples,
        targeted_nurture_revision_refs: input.targeted_nurture_revision_refs,
        evidence_mode: input.evidence_mode,
        evidence_envelope: input.evidence_envelope,
        command_execution_ref: input.command_execution_id,
        created_at: "2026-08-10T12:00:00.000Z",
      };
      candidates.set(input.candidate_identity_hash, row);
      return row;
    });
    const owner: NurtureInstitutionKnowledgeConflictCandidateTransaction = {
      findByIdentity: vi.fn(async ({ candidate_identity_hash }) =>
        candidates.get(candidate_identity_hash) ?? null),
      appendCandidate,
    };
    const repository = createInMemoryNurtureCommandRepository({
      institutionKnowledgeConflicts: owner,
    });
    const seal = vi.fn((_plaintext: string) => ({
      algVersion: 1 as const,
      keyRef: "test-key",
      ciphertext: "c2VhbGVk",
      integrityTag: "dGFn",
    }));
    const conflictRecorder = createInstitutionKnowledgeConflictCandidateRecorder({
      command_runner: new NurtureCommandRunner(repository),
      protected_content: { seal },
    });
    const firstPayload = candidatePayload();
    const reorderedPayload = {
      ...candidatePayload(),
      finding: {
        ...candidatePayload().finding,
        sources: [...candidatePayload().finding.sources].reverse(),
      },
    };
    const first = await conflictRecorder.record(firstPayload);
    const replay = await conflictRecorder.record(reorderedPayload);
    expect(replay).toEqual(first);
    expect(appendCandidate).toHaveBeenCalledTimes(1);
    expect(institutionKnowledgeConflictCandidateIdentityHash(reorderedPayload)).toBe(
      institutionKnowledgeConflictCandidateIdentityHash(firstPayload),
    );
    expect(seal).toHaveBeenCalledTimes(1);
    const sealedPlaintext = seal.mock.calls[0]?.[0] ?? "";
    expect(Buffer.byteLength(sealedPlaintext, "utf8")).toBeLessThanOrEqual(8_192);
    expect(JSON.parse(sealedPlaintext)).toMatchObject({
      evidence_mode: "none",
      finding_fingerprint: FINDING_HASH,
      source_tuples: expect.any(Array),
    });
    expect(sealedPlaintext).not.toMatch(/question|child|family|provider|excerpt/i);
  });

  it("does not merge a changed rule or exact source version", () => {
    const baseline = candidatePayload();
    expect(institutionKnowledgeConflictCandidateIdentityHash({
      ...baseline,
      rule_version: "1.0.1",
    })).not.toBe(institutionKnowledgeConflictCandidateIdentityHash(baseline));
    expect(institutionKnowledgeConflictCandidateIdentityHash({
      ...baseline,
      finding: {
        ...baseline.finding,
        sources: baseline.finding.sources.map((source, index) =>
          index === 0 ? { ...source, content_hash: "c".repeat(64) } : source,
        ),
      },
    })).not.toBe(institutionKnowledgeConflictCandidateIdentityHash(baseline));
  });

  it("freezes one append-only table without review-state or deadline fields", () => {
    const schema = readFileSync("prisma/schema.prisma", "utf8");
    const migration = readFileSync(
      "prisma/migrations/20260810230000_g4e_institution_knowledge_answer_safety/migration.sql",
      "utf8",
    );
    const model = schema.match(
      /model NurtureInstitutionKnowledgeConflictReviewCandidate \{([\s\S]*?)\n\}/,
    )?.[1] ?? "";
    expect(model).toContain("commandExecutionId");
    expect(model).toContain("evidenceEnvelope");
    expect(model).not.toMatch(/status|deadline|blocker|resolvedAt|updatedAt/i);
    expect(migration).toContain("trg_nurture_knowledge_conflict_append_only");
    expect(migration).toContain("nurture.record_institution_knowledge_conflict_candidate");
    expect(migration).toContain("institution-knowledge-answer-safety");
    const table = migration.match(
      /CREATE TABLE "nurture_institution_knowledge_conflict_review_candidate" \(([\s\S]*?)\n\);/,
    )?.[1] ?? "";
    expect(migration).not.toMatch(/CREATE TYPE .*Status/i);
    expect(migration.match(/CREATE TABLE /g)).toHaveLength(1);
    expect(table).not.toMatch(/deadline|blocker|dismiss|status/i);
  });
});
