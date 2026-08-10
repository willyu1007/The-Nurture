import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  NurtureCommandRunner,
  createInMemoryNurtureCommandRepository,
  createInstitutionKnowledgeCommandSpecs,
  decideInstitutionKnowledgeCommand,
  deriveInstitutionKnowledgeRevisionState,
  hashCommandRequestId,
  hashInstitutionKnowledgeAuthoritySnapshot,
  validateInstitutionKnowledgeAuthorityLink,
  validateInstitutionKnowledgeBody,
  validateInstitutionKnowledgeCommand,
  type NurtureCreateInstitutionKnowledgeItemPayload,
  type NurtureInstitutionKnowledgeCommandFacts,
  type NurtureInstitutionKnowledgeEventDraft,
  type NurtureInstitutionKnowledgeItemV1,
  type NurtureInstitutionKnowledgeMutationResult,
  type NurtureInstitutionKnowledgeRevisionEventV1,
  type NurtureInstitutionKnowledgeRevisionSummaryV1,
  type NurtureInstitutionKnowledgeTransaction,
} from "../../src/index.js";

const body = (sectionBody = "Keep the daily routine calm and observable.") => ({
  title: "A calm daily routine",
  summary: "General, non-diagnostic guidance for institution staff.",
  sections: [
    {
      sectionKey: "daily_routine",
      heading: "Daily routine",
      body: sectionBody,
    },
  ],
});

const createPayload = (
  overrides: Partial<NurtureCreateInstitutionKnowledgeItemPayload> = {},
): NurtureCreateInstitutionKnowledgeItemPayload => ({
  workspace_id: "workspace-1",
  institution_ref: "institution-1",
  role_assignment_ref: "admin-role-1",
  category: "daily_care_safety",
  body: body(),
  intended_audiences: ["institution_admin"],
  safety_class: "care_safety",
  ...overrides,
});

const item = (
  overrides: Partial<NurtureInstitutionKnowledgeItemV1> = {},
): NurtureInstitutionKnowledgeItemV1 => ({
  item_ref: "knowledge-item-1",
  workspace_id: "workspace-1",
  institution_ref: "institution-1",
  category: "daily_care_safety",
  item_head: 1,
  latest_revision_ref: "knowledge-revision-1",
  created_at: "2026-08-10T01:00:00.000Z",
  updated_at: "2026-08-10T01:00:00.000Z",
  ...overrides,
});

const revision = (
  number: number,
  overrides: Partial<NurtureInstitutionKnowledgeRevisionSummaryV1> = {},
): NurtureInstitutionKnowledgeRevisionSummaryV1 => ({
  revision_ref: `knowledge-revision-${number}`,
  item_ref: "knowledge-item-1",
  workspace_id: "workspace-1",
  institution_ref: "institution-1",
  revision_number: number,
  content_hash: "a".repeat(64),
  authorship: "institution_authored",
  intended_audiences: ["institution_admin"],
  age_band_keys: [],
  scenario_keys: [],
  safety_class: "care_safety",
  author_participant_ref: "admin-participant-1",
  author_role_assignment_ref: "admin-role-1",
  created_at: `2026-08-10T0${number}:00:00.000Z`,
  ...overrides,
});

const event = (
  eventType: NurtureInstitutionKnowledgeRevisionEventV1["event_type"],
  revisionRef: string,
  head: number,
  ordinal = 0,
): NurtureInstitutionKnowledgeRevisionEventV1 => ({
  event_ref: `event-${head}-${ordinal}`,
  workspace_id: "workspace-1",
  institution_ref: "institution-1",
  item_ref: "knowledge-item-1",
  revision_ref: revisionRef,
  event_type: eventType,
  item_head: head,
  event_ordinal: ordinal,
  actor_participant_ref: "admin-participant-1",
  actor_role_assignment_ref: "admin-role-1",
  reason_key: "test_event",
  command_execution_ref: `execution-${head}`,
  occurred_at: `2026-08-10T0${head}:00:00.000Z`,
});

const facts = (
  overrides: Partial<NurtureInstitutionKnowledgeCommandFacts> = {},
): NurtureInstitutionKnowledgeCommandFacts => ({
  actor_participant_ref: "admin-participant-1",
  actor_role_assignment_ref: "admin-role-1",
  item: item(),
  revisions: [revision(1)],
  events: [event("revision_created", "knowledge-revision-1", 1)],
  ...overrides,
});

describe("G4-E Institution Knowledge lifecycle policy", () => {
  it("accepts only the exact bounded body and metadata vocabulary", () => {
    expect(validateInstitutionKnowledgeBody(body())).toBe(true);
    expect(
      validateInstitutionKnowledgeBody({ ...body(), generatedAnswer: "not allowed" }),
    ).toBe(false);
    expect(validateInstitutionKnowledgeBody(body("x".repeat(8_100)))).toBe(false);
    expect(
      validateInstitutionKnowledgeCommand({
        action: "create_institution_knowledge_item",
        ...createPayload(),
        child_id: "forbidden",
      }),
    ).toEqual({ status: "invalid", reason_code: "contract_mismatch" });
    expect(
      validateInstitutionKnowledgeCommand({
        action: "create_institution_knowledge_item",
        ...createPayload({ intended_audiences: ["institution_admin", "institution_admin"] }),
      }),
    ).toEqual({ status: "invalid", reason_code: "contract_mismatch" });
  });

  it("validates an exact owner snapshot without changing institution authorship", () => {
    const seed = {
      authority_source_ref: {
        schema_version: 1 as const,
        namespace: "my_chat",
        object_type: "knowledge_source",
        object_id: "source-1",
        version: 4,
      },
      source_version: "2026.08.10",
      publisher: "Public health authority",
      title: "Daily care guidance",
      source_date: "2026-08-01",
      deep_link: "https://example.test/guidance",
      excerpt: "A short bounded provenance excerpt.",
      verified_at: "2026-08-10T01:00:00.000Z",
    };
    const snapshot = {
      ...seed,
      snapshot_hash: hashInstitutionKnowledgeAuthoritySnapshot(seed),
    };
    expect(validateInstitutionKnowledgeAuthorityLink(snapshot)).toBe(true);
    expect(
      validateInstitutionKnowledgeAuthorityLink({ ...snapshot, publisher: "Changed" }),
    ).toBe(false);
    expect(revision(1).authorship).toBe("institution_authored");
  });

  it("rejects stale heads and an actor/assignment mismatch", () => {
    const command = {
      action: "create_institution_knowledge_revision" as const,
      ...createPayload(),
      item_ref: "knowledge-item-1",
      expected_item_head: 0,
    };
    const { category: _category, ...revisionCommand } = command;
    expect(
      decideInstitutionKnowledgeCommand({ command: revisionCommand, facts: facts() }),
    ).toMatchObject({ status: "denied", layer: "concurrency", reason_code: "item_head_conflict" });
    expect(
      decideInstitutionKnowledgeCommand({
        command: { ...revisionCommand, expected_item_head: 1 },
        facts: facts({ actor_role_assignment_ref: "another-role" }),
      }),
    ).toMatchObject({ status: "denied", layer: "authority", reason_code: "not_authorized" });
  });

  it("keeps an older publication live while a new draft is authored", () => {
    const publishedFacts = facts({
      item: item({ item_head: 2, current_published_revision_ref: "knowledge-revision-1" }),
      events: [
        event("revision_created", "knowledge-revision-1", 1),
        event("published", "knowledge-revision-1", 2),
      ],
    });
    const createRevisionCommand = {
      action: "create_institution_knowledge_revision" as const,
      ...createPayload(),
      item_ref: "knowledge-item-1",
      expected_item_head: 2,
    };
    const { category: _category, ...command } = createRevisionCommand;
    expect(
      decideInstitutionKnowledgeCommand({ command, facts: publishedFacts }),
    ).toMatchObject({
      status: "ready",
      revision_number: 2,
      resulting_state: "draft",
    });
    expect(
      decideInstitutionKnowledgeCommand({ command, facts: publishedFacts }),
    ).not.toHaveProperty("superseded_revision_ref");
  });

  it("publishes only the latest draft, supersedes the old publication, then revokes exactly it", () => {
    const readyToPublish = facts({
      item: item({
        item_head: 3,
        latest_revision_ref: "knowledge-revision-2",
        current_published_revision_ref: "knowledge-revision-1",
      }),
      revisions: [revision(1), revision(2)],
      events: [
        event("revision_created", "knowledge-revision-1", 1),
        event("published", "knowledge-revision-1", 2),
        event("revision_created", "knowledge-revision-2", 3),
      ],
    });
    expect(
      decideInstitutionKnowledgeCommand({
        command: {
          action: "publish_institution_knowledge_revision",
          workspace_id: "workspace-1",
          institution_ref: "institution-1",
          role_assignment_ref: "admin-role-1",
          item_ref: "knowledge-item-1",
          revision_ref: "knowledge-revision-2",
          expected_item_head: 3,
        },
        facts: readyToPublish,
      }),
    ).toMatchObject({
      status: "ready",
      resulting_state: "published",
      superseded_revision_ref: "knowledge-revision-1",
    });

    const published = facts({
      ...readyToPublish,
      item: item({
        item_head: 4,
        latest_revision_ref: "knowledge-revision-2",
        current_published_revision_ref: "knowledge-revision-2",
      }),
      events: [
        ...readyToPublish.events,
        event("publication_superseded", "knowledge-revision-1", 4, 0),
        event("published", "knowledge-revision-2", 4, 1),
      ],
    });
    expect(
      deriveInstitutionKnowledgeRevisionState({
        facts: published,
        revision_ref: "knowledge-revision-1",
      }),
    ).toBe("superseded");
    expect(
      decideInstitutionKnowledgeCommand({
        command: {
          action: "revoke_institution_knowledge_revision",
          workspace_id: "workspace-1",
          institution_ref: "institution-1",
          role_assignment_ref: "admin-role-1",
          item_ref: "knowledge-item-1",
          revision_ref: "knowledge-revision-2",
          expected_item_head: 4,
          reason_key: "source_withdrawn",
        },
        facts: published,
      }),
    ).toMatchObject({ status: "ready", resulting_state: "revoked" });
  });
});

const envelope = {
  algVersion: 1 as const,
  keyRef: "knowledge-test-key",
  ciphertext: "c2VhbGVk",
  integrityTag: "dGFn",
};

const createOwner = () => {
  let mutations = 0;
  let appendedEvents = 0;
  const committedItem = item();
  const committedRevision = revision(1);
  const draft: NurtureInstitutionKnowledgeEventDraft = {
    workspace_id: "workspace-1",
    institution_ref: "institution-1",
    item_ref: committedItem.item_ref,
    revision_ref: committedRevision.revision_ref,
    event_type: "revision_created",
    item_head: 1,
    event_ordinal: 0,
    actor_participant_ref: "admin-participant-1",
    actor_role_assignment_ref: "admin-role-1",
    reason_key: "knowledge_item_created",
    occurred_at: "2026-08-10T01:00:00.000Z",
  };
  const owner: NurtureInstitutionKnowledgeTransaction = {
    async loadCommandFacts() {
      return {
        status: "resolved",
        facts: {
          actor_participant_ref: "admin-participant-1",
          actor_role_assignment_ref: "admin-role-1",
          revisions: [],
          events: [],
        },
      };
    },
    async applyMutation(): Promise<NurtureInstitutionKnowledgeMutationResult> {
      mutations += 1;
      return {
        committed: true,
        item: committedItem,
        revision: committedRevision,
        revision_state: "draft",
        event_drafts: [draft],
        occurred_at: "2026-08-10T01:00:00.000Z",
      };
    },
    async appendEvents(input) {
      appendedEvents += input.events.length;
    },
  };
  return {
    owner,
    counts: () => ({ mutations, appendedEvents }),
  };
};

describe("G4-E Institution Knowledge command integration", () => {
  it("denies unresolved Admin scope before sealing or mutating protected content", async () => {
    let seals = 0;
    let mutations = 0;
    const owner: NurtureInstitutionKnowledgeTransaction = {
      async loadCommandFacts() {
        return { status: "denied", reason_code: "not_authorized" };
      },
      async applyMutation() {
        mutations += 1;
        return { committed: false };
      },
      async appendEvents() {
        throw new Error("events must not be reached");
      },
    };
    const spec = createInstitutionKnowledgeCommandSpecs({
      protected_content: {
        seal: () => {
          seals += 1;
          return envelope;
        },
      },
    }).createInstitutionKnowledgeItem;
    await expect(
      new NurtureCommandRunner(
        createInMemoryNurtureCommandRepository({ institutionKnowledge: owner }),
      ).execute({
        workspace_id: "workspace-1",
        invocation_request_id: "knowledge-invocation-denied",
        command_request_id: "knowledge-command-denied",
        business_actor_ref: "caregiver-participant-1",
        payload: createPayload(),
        spec,
      }),
    ).resolves.toEqual({
      status: "not_committed",
      decision: "blocked",
      reason_code: "not_authorized",
    });
    expect({ seals, mutations }).toEqual({ seals: 0, mutations: 0 });
  });

  it("commits once, freezes a body-free result, and replays exactly", async () => {
    const state = createOwner();
    const repository = createInMemoryNurtureCommandRepository({
      institutionKnowledge: state.owner,
    });
    const spec = createInstitutionKnowledgeCommandSpecs({
      protected_content: { seal: () => envelope },
    }).createInstitutionKnowledgeItem;
    const runner = new NurtureCommandRunner(repository);
    const execute = (payload = createPayload()) =>
      runner.execute({
        workspace_id: "workspace-1",
        invocation_request_id: "knowledge-invocation-1",
        command_request_id: "knowledge-command-1",
        business_actor_ref: "admin-participant-1",
        payload,
        spec,
      });
    const first = await execute();
    const replay = await execute();
    expect(first).toMatchObject({
      status: "ok",
      disposition: "executed",
      committed_result: {
        item_ref: "knowledge-item-1",
        revision_ref: "knowledge-revision-1",
        item_head: 1,
        revision_state: "draft",
      },
    });
    expect(replay).toMatchObject({ status: "ok", disposition: "replayed" });
    expect(state.counts()).toEqual({ mutations: 1, appendedEvents: 1 });
    const record = await repository.findCommitted({
      workspace_id: "workspace-1",
      command_request_id_hash: hashCommandRequestId(
        "workspace-1",
        "knowledge-command-1",
      ),
    });
    expect(JSON.stringify(record)).not.toContain("A calm daily routine");
    expect(JSON.stringify(record)).not.toContain("c2VhbGVk");
    await expect(execute(createPayload({ safety_class: "general_guidance" }))).resolves.toMatchObject({
      status: "not_committed",
      decision: "idempotency_conflict",
    });
  });

  it("fails closed when protected content cannot be sealed", async () => {
    const state = createOwner();
    const repository = createInMemoryNurtureCommandRepository({
      institutionKnowledge: state.owner,
    });
    const spec = createInstitutionKnowledgeCommandSpecs({
      protected_content: {
        seal: () => {
          throw new Error("key unavailable");
        },
      },
    }).createInstitutionKnowledgeItem;
    await expect(
      new NurtureCommandRunner(repository).execute({
        workspace_id: "workspace-1",
        invocation_request_id: "knowledge-invocation-protected",
        command_request_id: "knowledge-command-protected",
        business_actor_ref: "admin-participant-1",
        payload: createPayload(),
        spec,
      }),
    ).resolves.toEqual({
      status: "not_committed",
      decision: "technical_error",
      reason_code: "protected_content_unavailable",
    });
    expect(state.counts()).toEqual({ mutations: 0, appendedEvents: 0 });
  });
});

describe("G4-E Institution Knowledge migration artifact", () => {
  it("contains exactly four owner tables, append-only history, and no second ledger", () => {
    const sql = readFileSync(
      "prisma/migrations/20260810210000_g4e_institution_knowledge_lifecycle/migration.sql",
      "utf8",
    );
    expect(sql.match(/CREATE TABLE /g)).toHaveLength(4);
    for (const table of [
      "nurture_institution_knowledge_item",
      "nurture_institution_knowledge_revision",
      "nurture_institution_knowledge_authority_link",
      "nurture_institution_knowledge_revision_event",
    ]) {
      expect(sql).toContain(`CREATE TABLE "${table}"`);
    }
    expect(sql).toContain("trg_nurture_knowledge_revision_append_only");
    expect(sql).toContain("trg_nurture_knowledge_item_committed_state");
    expect(sql).toContain('REFERENCES "nurture_command_execution"');
    expect(sql).not.toMatch(/CREATE TABLE "[^"]*(outbox|command_execution)/);
  });

  it("keeps Prisma out of the scenario business layer", () => {
    for (const file of [
      "packages/nurture-scenario/src/domain/institution/institution-knowledge-lifecycle.ts",
      "packages/nurture-scenario/src/domain/institution/institution-knowledge-commands.ts",
    ]) {
      expect(readFileSync(file, "utf8")).not.toContain("@prisma/client");
    }
  });
});
