import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import {
  NurtureInstitutionKnowledgeCurrentnessProvider,
  NurtureInstitutionKnowledgePreviewProvider,
  NurtureInstitutionKnowledgeSourceProvider,
  canonicalJsonV1,
  decideInstitutionKnowledgeEligibility,
  hashInstitutionKnowledgeAuthoritySnapshot,
  institutionKnowledgeSourceVersion,
  retrieveCurrentInstitutionKnowledgeCandidates,
  validateInstitutionKnowledgeOnlineQuery,
  type NurtureAuthoritySourceCurrentnessOwnerV1,
  type NurtureAuthorityKnowledgeSourceCurrentnessProviderV1,
  type NurtureInstitutionAdminKnowledgeAuthorityV1,
  type NurtureInstitutionKnowledgeBodyV1,
  type NurtureInstitutionKnowledgeReadFactsV1,
  type NurtureInstitutionKnowledgeReadOwnerV1,
  type NurtureInstitutionKnowledgeRetrievalCandidateV1,
  type NurtureInstitutionKnowledgeSourceChangeV1,
  type NurtureInstitutionKnowledgeSourceCurrentnessProviderV1,
} from "../../src/index.js";

const body: NurtureInstitutionKnowledgeBodyV1 = {
  title: "Calm transitions",
  summary: "General guidance for institution staff.",
  sections: [
    { sectionKey: "routine", heading: "Routine", body: "Keep transitions observable." },
  ],
};
const plaintext = canonicalJsonV1(body);
const contentHash = createHash("sha256").update(plaintext, "utf8").digest("hex");
const envelope = {
  algVersion: 1 as const,
  keyRef: "knowledge-test-key",
  ciphertext: "c2VhbGVk",
  integrityTag: "dGFn",
};

const sourceRef = (suffix = "1") => ({
  schema_version: 1 as const,
  namespace: "nurture",
  object_type: "institution_knowledge_source",
  object_id: `opaque-source-${suffix}`,
});

const authorityRef = {
  schema_version: 1 as const,
  namespace: "my_chat",
  object_type: "knowledge_source",
  object_id: "authority-source-1",
  version: 7,
};

const authorityLink = () => {
  const seed = {
    authority_source_ref: authorityRef,
    source_version: "2026.08.10",
    publisher: "Public health authority",
    title: "Daily care guidance",
    source_date: "2026-08-01",
    deep_link: "https://example.test/guidance",
    excerpt: "A bounded source excerpt.",
    verified_at: "2026-08-10T01:00:00.000Z",
  };
  return { ...seed, snapshot_hash: hashInstitutionKnowledgeAuthoritySnapshot(seed) };
};

const facts = (
  overrides: {
    valid_from?: string;
    valid_until?: string;
    safety_class?: "general_guidance" | "care_safety" | "basic_health_first_aid";
    age_band_keys?: string[];
    scenario_keys?: string[];
    intended_audiences?: Array<"institution_admin" | "caregiver" | "guardian">;
    review?: "reviewed" | "changes_requested" | "none";
    published?: boolean;
    authority_links?: ReturnType<typeof authorityLink>[];
    stored_hash?: string;
  } = {},
): NurtureInstitutionKnowledgeReadFactsV1 => {
  const revision = {
    revision_ref: "knowledge-revision-1",
    item_ref: "knowledge-item-1",
    workspace_id: "workspace-1",
    institution_ref: "institution-1",
    revision_number: 1,
    body_envelope: envelope,
    content_hash: overrides.stored_hash ?? contentHash,
    authorship: "institution_authored" as const,
    intended_audiences: overrides.intended_audiences ?? ["institution_admin" as const],
    age_band_keys: overrides.age_band_keys ?? [],
    scenario_keys: overrides.scenario_keys ?? [],
    safety_class: overrides.safety_class ?? "care_safety",
    ...(overrides.valid_from ? { valid_from: overrides.valid_from } : {}),
    ...(overrides.valid_until ? { valid_until: overrides.valid_until } : {}),
    author_participant_ref: "admin-1",
    author_role_assignment_ref: "role-1",
    created_at: "2026-08-10T01:00:00.000Z",
  };
  const events = [
    {
      event_ref: "event-1",
      workspace_id: "workspace-1",
      institution_ref: "institution-1",
      item_ref: "knowledge-item-1",
      revision_ref: revision.revision_ref,
      event_type: "revision_created" as const,
      item_head: 1,
      event_ordinal: 0,
      actor_participant_ref: "admin-1",
      actor_role_assignment_ref: "role-1",
      reason_key: "created",
      command_execution_ref: "execution-1",
      occurred_at: "2026-08-10T01:00:00.000Z",
    },
    ...(overrides.review === "none"
      ? []
      : [
          {
            event_ref: "event-2",
            workspace_id: "workspace-1",
            institution_ref: "institution-1",
            item_ref: "knowledge-item-1",
            revision_ref: revision.revision_ref,
            event_type: overrides.review ?? ("reviewed" as const),
            item_head: 2,
            event_ordinal: 0,
            actor_participant_ref: "admin-1",
            actor_role_assignment_ref: "role-1",
            reason_key: "reviewed",
            command_execution_ref: "execution-2",
            occurred_at: "2026-08-10T02:00:00.000Z",
          },
        ]),
    ...(overrides.published === false
      ? []
      : [
          {
            event_ref: "event-3",
            workspace_id: "workspace-1",
            institution_ref: "institution-1",
            item_ref: "knowledge-item-1",
            revision_ref: revision.revision_ref,
            event_type: "published" as const,
            item_head: overrides.review === "none" ? 2 : 3,
            event_ordinal: 0,
            actor_participant_ref: "admin-1",
            actor_role_assignment_ref: "role-1",
            reason_key: "published",
            command_execution_ref: "execution-3",
            occurred_at: "2026-08-10T03:00:00.000Z",
          },
        ]),
  ];
  const itemHead = events.at(-1)?.item_head ?? 1;
  return {
    source: {
      source_ref: sourceRef(),
      source_version: institutionKnowledgeSourceVersion(revision),
      content_hash: revision.content_hash,
    },
    ...(overrides.published === false
      ? {}
      : {
          publication_event_ref: {
            schema_version: 1 as const,
            namespace: "nurture",
            object_type: "institution_knowledge_revision_event",
            object_id: "opaque-publication-event-1",
            version: itemHead,
          },
        }),
    item: {
      item_ref: "knowledge-item-1",
      workspace_id: "workspace-1",
      institution_ref: "institution-1",
      category: "daily_care_safety",
      item_head: itemHead,
      latest_revision_ref: revision.revision_ref,
      ...(overrides.published === false
        ? {}
        : { current_published_revision_ref: revision.revision_ref }),
      created_at: "2026-08-10T01:00:00.000Z",
      updated_at: "2026-08-10T03:00:00.000Z",
    },
    revision,
    revisions: [revision],
    events,
    authority_links: overrides.authority_links ?? [],
  };
};

const evaluatedAt = "2026-08-10T12:00:00.000Z";
const onlineContext = {
  workspace_id: "workspace-1",
  institution_ref: "institution-1",
  participant_ref: "admin-1",
  role_assignment_ref: "role-1",
  surface: "institution_workbench",
  purpose: "institution_admin_online_answer",
  invocation_ref: "invocation-1",
  evaluated_at: evaluatedAt,
  age_band_keys: ["age_3_4"],
  scenario_keys: ["daily_routine"],
};

const authorityDecisions = (decision: "eligible" | "denied" = "eligible") => [
  { authority_source_ref: authorityRef, source_version: "2026.08.10", decision },
];

describe("G4-E retrieval eligibility", () => {
  it("separates future-effective indexing from online eligibility and applies exact filters", () => {
    const future = facts({
      valid_from: "2026-08-11T00:00:00.000Z",
      age_band_keys: ["age_3_4"],
      scenario_keys: ["daily_routine"],
    });
    expect(
      decideInstitutionKnowledgeEligibility({
        facts: future,
        context: {
          workspace_id: "workspace-1",
          institution_ref: "institution-1",
          purpose: "institution_knowledge_indexing",
          evaluated_at: evaluatedAt,
        },
        body_hash: contentHash,
      }),
    ).toEqual({ status: "eligible" });
    expect(
      decideInstitutionKnowledgeEligibility({
        facts: future,
        context: {
          workspace_id: "workspace-1",
          institution_ref: "institution-1",
          purpose: "institution_admin_online_answer",
          evaluated_at: evaluatedAt,
          age_band_keys: ["age_3_4"],
          scenario_keys: ["daily_routine"],
        },
      }),
    ).toEqual({ status: "denied", reason_code: "not_yet_valid" });
    expect(
      decideInstitutionKnowledgeEligibility({
        facts: facts({ age_band_keys: ["age_5_6"] }),
        context: {
          workspace_id: "workspace-1",
          institution_ref: "institution-1",
          purpose: "institution_admin_online_answer",
          evaluated_at: evaluatedAt,
          age_band_keys: ["age_3_4"],
          scenario_keys: [],
        },
      }),
    ).toEqual({ status: "denied", reason_code: "applicability_mismatch" });
  });

  it("requires reviewed current publication, audience, time, exact hash and medical authority", () => {
    const decide = (row: NurtureInstitutionKnowledgeReadFactsV1, decisions = authorityDecisions()) =>
      decideInstitutionKnowledgeEligibility({
        facts: row,
        context: {
          workspace_id: "workspace-1",
          institution_ref: "institution-1",
          purpose: "institution_admin_online_answer",
          evaluated_at: evaluatedAt,
          age_band_keys: [],
          scenario_keys: [],
          expected_source: row.source,
        },
        authority_decisions: decisions,
      });
    expect(decide(facts({ review: "changes_requested" }))).toMatchObject({ reason_code: "review_incomplete" });
    expect(decide(facts({ published: false }))).toMatchObject({ reason_code: "not_published" });
    expect(decide(facts({ intended_audiences: ["caregiver"] }))).toMatchObject({ reason_code: "audience_denied" });
    expect(decide(facts({ valid_until: evaluatedAt }))).toMatchObject({ reason_code: "expired" });
    const medical = facts({ safety_class: "basic_health_first_aid", authority_links: [authorityLink()] });
    expect(decide(medical, authorityDecisions("denied"))).toMatchObject({ reason_code: "authority_source_invalid" });
    expect(decide(medical)).toEqual({ status: "eligible" });
    expect(
      decideInstitutionKnowledgeEligibility({
        facts: medical,
        context: {
          workspace_id: "workspace-1",
          institution_ref: "institution-1",
          purpose: "institution_admin_online_answer",
          evaluated_at: evaluatedAt,
          age_band_keys: [],
          scenario_keys: [],
          expected_source: { ...medical.source, content_hash: "f".repeat(64) },
        },
        authority_decisions: authorityDecisions(),
      }),
    ).toMatchObject({ reason_code: "content_drift" });
  });
});

const createReads = (row = facts()) => ({
  listSourceChanges: vi.fn(async () => ({ status: "resolved" as const, changes: [] })),
  readCurrentPublication: vi.fn(async () => ({ status: "resolved" as const, facts: row })),
  listCurrentPublications: vi.fn(async () => ({
    status: "resolved" as const,
    reconciliation_ref: "opaque-reconciliation-1",
    evaluated_at: evaluatedAt,
    rows: [row],
    complete: true,
  })),
  readPreviewOptions: vi.fn(async (
    input: Parameters<NurtureInstitutionKnowledgeReadOwnerV1["readPreviewOptions"]>[0],
  ) => ({
    status: "resolved" as const,
    rows: input.revision_option_refs.map((revisionOptionRef) => ({
      revision_option_ref: revisionOptionRef,
      facts: row,
    })),
  })),
}) satisfies NurtureInstitutionKnowledgeReadOwnerV1;

const serviceAuthority = (decision: "authorized" | "denied" | "unavailable" = "authorized") => ({
  authorize: vi.fn(async () => decision),
});
const adminAuthority = (decision: "authorized" | "denied" | "unavailable" = "authorized") => ({
  authorize: vi.fn(async () => decision),
}) satisfies NurtureInstitutionAdminKnowledgeAuthorityV1;
const authorityOwner = (decision: "eligible" | "denied" = "eligible") => ({
  validateExactSources: vi.fn(async (
    input: Parameters<NurtureAuthoritySourceCurrentnessOwnerV1["validateExactSources"]>[0],
  ) => ({
    status: "resolved" as const,
    decisions: input.sources.map((source) => ({ ...source, decision })),
  })),
}) satisfies NurtureAuthoritySourceCurrentnessOwnerV1;
const protectedContent = { unseal: vi.fn(() => plaintext) };
const authorityCandidateCurrentness = (
  decision: "eligible" | "denied" = "eligible",
): NurtureAuthorityKnowledgeSourceCurrentnessProviderV1 => ({
  validateSources: vi.fn(async (
    input: Parameters<NurtureAuthorityKnowledgeSourceCurrentnessProviderV1["validateSources"]>[0],
  ) => ({
    status: "resolved" as const,
    decisions: input.sources.map((source) => ({ ...source, decision })),
  })),
});

describe("G4-E source and currentness providers", () => {
  it("denies the generic ingestion purpose before any owner or protected-body read", async () => {
    const reads = createReads();
    const provider = new NurtureInstitutionKnowledgeSourceProvider(
      reads,
      serviceAuthority(),
      authorityOwner(),
      protectedContent,
      () => evaluatedAt,
    );
    await expect(
      provider.readSourceForIndexing({
        workspace_id: "workspace-1",
        institution_ref: "institution-1",
        service_invocation_ref: "service-1",
        purpose: "knowledge_ingestion",
        source_ref: sourceRef(),
        source_version: facts().source.source_version,
      }),
    ).resolves.toEqual({ status: "denied" });
    expect(reads.readCurrentPublication).not.toHaveBeenCalled();
    expect(protectedContent.unseal).not.toHaveBeenCalled();
  });

  it("returns an exact index snapshot and a stable terminal reconciliation", async () => {
    const reads = createReads();
    const provider = new NurtureInstitutionKnowledgeSourceProvider(
      reads,
      serviceAuthority(),
      authorityOwner(),
      protectedContent,
      () => evaluatedAt,
    );
    const common = {
      workspace_id: "workspace-1",
      institution_ref: "institution-1",
      service_invocation_ref: "service-1",
      purpose: "institution_knowledge_indexing",
    };
    await expect(
      provider.readSourceForIndexing({
        ...common,
        source_ref: sourceRef(),
        source_version: facts().source.source_version,
      }),
    ).resolves.toMatchObject({
      status: "resolved",
      source: {
        source_kind: "nurture_institution_revision",
        provenance_kind: "institution_authored",
        item_ref: "knowledge-item-1",
        revision_ref: "knowledge-revision-1",
        revision_number: 1,
        published_at: "2026-08-10T03:00:00.000Z",
        body,
      },
    });
    await expect(provider.listCurrentSourceStates({ ...common, limit: 100 })).resolves.toEqual({
      status: "resolved",
      reconciliation_ref: "opaque-reconciliation-1",
      evaluated_at: evaluatedAt,
      rows: [{ ...facts().source, decision: "indexable" }],
      complete: true,
    });
    expect(reads.listCurrentPublications).toHaveBeenCalledWith({
      workspace_id: "workspace-1",
      institution_ref: "institution-1",
      limit: 100,
    });
  });

  it("replays body-free review changes with the same opaque cursor", async () => {
    const change: NurtureInstitutionKnowledgeSourceChangeV1 & { body: string } = {
      cursor: "opaque-change-cursor-1",
      source: facts().source,
      institution_ref: "institution-1",
      item_head: 3,
      event_ref: {
        schema_version: 1,
        namespace: "nurture",
        object_type: "institution_knowledge_revision_event",
        object_id: "opaque-event-3",
        version: 3,
      },
      event_type: "review_changed",
      committed_at: "2026-08-10T03:00:00.000Z",
      body: "must-not-cross-provider",
    };
    const reads = {
      ...createReads(),
      listSourceChanges: vi.fn(async () => ({
        status: "resolved" as const,
        changes: [change],
        next_cursor: change.cursor,
      })),
    } satisfies NurtureInstitutionKnowledgeReadOwnerV1;
    const provider = new NurtureInstitutionKnowledgeSourceProvider(
      reads,
      serviceAuthority(),
      authorityOwner(),
      protectedContent,
    );
    const request = {
      workspace_id: "workspace-1",
      institution_ref: "institution-1",
      service_invocation_ref: "service-1",
      purpose: "institution_knowledge_indexing",
      limit: 100,
    };
    const first = await provider.listSourceChanges(request);
    const replay = await provider.listSourceChanges(request);
    expect(replay).toEqual(first);
    expect(JSON.stringify(first)).not.toContain("must-not-cross-provider");
    expect(first).toMatchObject({
      status: "resolved",
      changes: [{ event_type: "review_changed", cursor: "opaque-change-cursor-1" }],
    });
  });

  it("keeps policy denial distinct from owner unavailability and detects stale source identity", async () => {
    const reads = createReads();
    const currentness = new NurtureInstitutionKnowledgeCurrentnessProvider(
      reads,
      adminAuthority(),
      authorityOwner(),
    );
    await expect(
      currentness.validateSources({
        context: onlineContext,
        sources: [{ ...facts().source, source_version: `r9:${contentHash}` }],
      }),
    ).resolves.toMatchObject({
      status: "resolved",
      decisions: [{ decision: "denied", reason_code: "content_drift" }],
    });
    const unavailableReads = {
      ...createReads(),
      readCurrentPublication: vi.fn(async () => ({ status: "unavailable" as const })),
    } satisfies NurtureInstitutionKnowledgeReadOwnerV1;
    await expect(
      new NurtureInstitutionKnowledgeCurrentnessProvider(
        unavailableReads,
        adminAuthority(),
        authorityOwner(),
      ).validateSources({ context: onlineContext, sources: [facts().source] }),
    ).resolves.toEqual({ status: "unavailable" });
  });
});

const candidate = (): NurtureInstitutionKnowledgeRetrievalCandidateV1 => ({
  ...facts().source,
  candidate_ref: "candidate-1",
  source_owner: "nurture",
  source_kind: "nurture_institution_revision",
  provenance_kind: "institution_authored",
  rank: 1,
  match_reason: "semantic_match",
  excerpt: "Keep transitions observable.",
  host_current_source_decision: "current",
  title: "Calm transitions",
  item_ref: "knowledge-item-1",
  revision_ref: "knowledge-revision-1",
  revision_number: 1,
  publication_event_ref: {
    schema_version: 1,
    namespace: "nurture",
    object_type: "institution_knowledge_revision_event",
    object_id: "opaque-publication-event-1",
    version: 3,
  },
  published_at: "2026-08-10T03:00:00.000Z",
  open_ref: "opaque-institution-open-ref-1",
  authority_sources: [],
});

const authorityCandidate = (): NurtureInstitutionKnowledgeRetrievalCandidateV1 => ({
  candidate_ref: "authority-candidate-1",
  source_ref: {
    schema_version: 1,
    namespace: "my_chat",
    object_type: "knowledge_source",
    object_id: "opaque-authority-source-1",
  },
  source_version: "2026.08.10",
  content_hash: "b".repeat(64),
  source_owner: "my_chat",
  source_kind: "authority_source",
  provenance_kind: "authority_source",
  rank: 2,
  match_reason: "linked_authority_source",
  excerpt: "Seek qualified help when warning signs are present.",
  host_current_source_decision: "current",
  publisher: "Public health authority",
  title: "Warning signs",
  source_date: "2026-08-01",
  open_ref: "opaque-open-ref-1",
});

describe("G4-E online retrieval and preview", () => {
  it("rejects caller authority/source fields and checks Admin authority before retrieval", async () => {
    expect(validateInstitutionKnowledgeOnlineQuery({ question: "What helps?", child_id: "forbidden" })).toBe(false);
    const retrievalOwner = { retrieveCandidates: vi.fn(async () => ({ status: "resolved" as const, candidates: [candidate()] })) };
    await expect(
      retrieveCurrentInstitutionKnowledgeCandidates({
        public_query: { question: "What helps?" },
        trusted_context: onlineContext,
        retrieval_owner: retrievalOwner,
        currentness_provider: { validateSources: vi.fn() },
        authority_currentness_provider: authorityCandidateCurrentness(),
        admin_authority: adminAuthority("denied"),
      }),
    ).resolves.toEqual({ status: "denied" });
    expect(retrievalOwner.retrieveCandidates).not.toHaveBeenCalled();
  });

  it("treats an owner empty set as legal and filters a stale candidate after retrieval", async () => {
    const empty = await retrieveCurrentInstitutionKnowledgeCandidates({
      public_query: { question: "What helps?" },
      trusted_context: onlineContext,
      retrieval_owner: { retrieveCandidates: vi.fn(async () => ({ status: "resolved" as const, candidates: [] })) },
      currentness_provider: { validateSources: vi.fn() },
      authority_currentness_provider: authorityCandidateCurrentness(),
      admin_authority: adminAuthority(),
    });
    expect(empty).toEqual({ status: "resolved", candidates: [] });
    const stale = await retrieveCurrentInstitutionKnowledgeCandidates({
      public_query: { question: "What helps?" },
      trusted_context: onlineContext,
      retrieval_owner: { retrieveCandidates: vi.fn(async () => ({ status: "resolved" as const, candidates: [candidate()] })) },
      currentness_provider: {
        validateSources: vi.fn(async () => ({
          status: "resolved" as const,
          decisions: [{ ...facts().source, decision: "denied" as const, reason_code: "content_drift" as const }],
        })),
      },
      authority_currentness_provider: authorityCandidateCurrentness(),
      admin_authority: adminAuthority(),
    });
    expect(stale).toEqual({ status: "resolved", candidates: [] });
  });

  it("keeps authority sources distinct and validates them before model context", async () => {
    const authorityCurrentness = authorityCandidateCurrentness("denied");
    const result = await retrieveCurrentInstitutionKnowledgeCandidates({
      public_query: { question: "What warning signs matter?" },
      trusted_context: onlineContext,
      retrieval_owner: {
        retrieveCandidates: vi.fn(async () => ({
          status: "resolved" as const,
          candidates: [candidate(), authorityCandidate()],
        })),
      },
      currentness_provider: {
        validateSources: vi.fn(async (
          input: Parameters<NurtureInstitutionKnowledgeSourceCurrentnessProviderV1["validateSources"]>[0],
        ) => ({
          status: "resolved" as const,
          decisions: input.sources.map((source) => ({
            ...source,
            decision: "eligible" as const,
          })),
        })),
      },
      authority_currentness_provider: authorityCurrentness,
      admin_authority: adminAuthority(),
    });
    expect(result).toEqual({ status: "resolved", candidates: [candidate()] });
    expect(authorityCurrentness.validateSources).toHaveBeenCalledWith({
      context: { ...onlineContext, age_band_keys: [], scenario_keys: [] },
      sources: [
        {
          source_ref: authorityCandidate().source_ref,
          source_version: "2026.08.10",
          content_hash: "b".repeat(64),
        },
      ],
    });

    await expect(retrieveCurrentInstitutionKnowledgeCandidates({
      public_query: { question: "What warning signs matter?" },
      trusted_context: onlineContext,
      retrieval_owner: {
        retrieveCandidates: vi.fn(async () => ({
          status: "resolved" as const,
          candidates: [{
            ...authorityCandidate(),
            source_ref: { ...authorityCandidate().source_ref, namespace: "nurture" },
          }],
        })),
      },
      currentness_provider: { validateSources: vi.fn() },
      authority_currentness_provider: authorityCandidateCurrentness(),
      admin_authority: adminAuthority(),
    })).resolves.toEqual({ status: "unavailable" });
  });

  it("allows an unreviewed draft only in exact editor preview and fails all-or-nothing", async () => {
    const draft = facts({ review: "none", published: false });
    const reads = createReads(draft);
    const preview = new NurtureInstitutionKnowledgePreviewProvider(
      reads,
      adminAuthority(),
      authorityOwner(),
      protectedContent,
    );
    await expect(
      preview.preview({
        context: { ...onlineContext, purpose: "institution_admin_editor_preview" },
        request: { revision_option_refs: ["opaque-option-1"] },
      }),
    ).resolves.toMatchObject({
      status: "resolved",
      options: [{ state: "draft", warnings: ["draft", "unreviewed"] }],
    });
    reads.readPreviewOptions.mockResolvedValue({ status: "resolved", rows: [] });
    await expect(
      preview.preview({
        context: { ...onlineContext, purpose: "institution_admin_editor_preview" },
        request: { revision_option_refs: ["opaque-option-1"] },
      }),
    ).resolves.toEqual({ status: "unavailable" });
  });

  it("turns medical source denial into a preview warning but owner outage into unavailability", async () => {
    const medical = facts({
      safety_class: "basic_health_first_aid",
      authority_links: [authorityLink()],
    });
    const request = {
      context: { ...onlineContext, purpose: "institution_admin_editor_preview" },
      request: { revision_option_refs: ["opaque-option-1"] },
    };
    await expect(
      new NurtureInstitutionKnowledgePreviewProvider(
        createReads(medical),
        adminAuthority(),
        authorityOwner("denied"),
        protectedContent,
      ).preview(request),
    ).resolves.toMatchObject({
      status: "resolved",
      options: [{ warnings: ["authority_source_invalid"] }],
    });
    const unavailableOwner: NurtureAuthoritySourceCurrentnessOwnerV1 = {
      validateExactSources: vi.fn(async () => ({ status: "unavailable" as const })),
    };
    await expect(
      new NurtureInstitutionKnowledgePreviewProvider(
        createReads(medical),
        adminAuthority(),
        unavailableOwner,
        protectedContent,
      ).preview(request),
    ).resolves.toEqual({ status: "unavailable" });
  });

  it("rejects every bounded-port overflow instead of truncating", async () => {
    const sourceProvider = new NurtureInstitutionKnowledgeSourceProvider(
      createReads(),
      serviceAuthority(),
      authorityOwner(),
      protectedContent,
    );
    await expect(
      sourceProvider.listSourceChanges({
        workspace_id: "workspace-1",
        institution_ref: "institution-1",
        service_invocation_ref: "service-1",
        purpose: "institution_knowledge_indexing",
        limit: 101,
      }),
    ).resolves.toEqual({ status: "denied" });
    const currentness = new NurtureInstitutionKnowledgeCurrentnessProvider(
      createReads(),
      adminAuthority(),
      authorityOwner(),
    );
    await expect(
      currentness.validateSources({
        context: onlineContext,
        sources: Array.from({ length: 33 }, (_, index) => ({
          ...facts().source,
          source_ref: sourceRef(String(index + 1)),
        })),
      }),
    ).resolves.toEqual({ status: "denied" });
    await expect(
      retrieveCurrentInstitutionKnowledgeCandidates({
        public_query: { question: "What helps?" },
        trusted_context: onlineContext,
        retrieval_owner: {
          retrieveCandidates: vi.fn(async () => ({
            status: "resolved" as const,
            candidates: Array.from({ length: 17 }, (_, index) => ({
              ...candidate(),
              candidate_ref: `candidate-${index + 1}`,
            })),
          })),
        },
        currentness_provider: { validateSources: vi.fn() },
        authority_currentness_provider: authorityCandidateCurrentness(),
        admin_authority: adminAuthority(),
      }),
    ).resolves.toEqual({ status: "unavailable" });
    const previewAuthority = adminAuthority();
    await expect(
      new NurtureInstitutionKnowledgePreviewProvider(
        createReads(),
        previewAuthority,
        authorityOwner(),
        protectedContent,
      ).preview({
        context: { ...onlineContext, purpose: "institution_admin_editor_preview" },
        request: {
          revision_option_refs: Array.from(
            { length: 9 },
            (_, index) => `opaque-option-${index + 1}`,
          ),
        },
      }),
    ).resolves.toEqual({ status: "denied" });
    expect(previewAuthority.authorize).not.toHaveBeenCalled();
  });

  it("keeps Host runtime, child facts, local vector/cache and My-Chat ORM out of I1.2", () => {
    const source = readFileSync(
      "packages/nurture-scenario/src/domain/institution/institution-knowledge-retrieval.ts",
      "utf8",
    );
    for (const forbidden of [
      "@prisma/client",
      "@my-chat/rag",
      "@my-chat/permissions",
      "child_id",
      "family_id",
      "NurtureContextMaterial",
      "NurtureRuntimeContextPack",
    ]) expect(source).not.toContain(forbidden);
  });
});
