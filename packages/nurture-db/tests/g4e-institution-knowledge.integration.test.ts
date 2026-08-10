import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import {
  NurtureCommandRunner,
  createInstitutionKnowledgeCommandSpecs,
  createInstitutionKnowledgeConflictCandidateRecorder,
  hashInstitutionKnowledgeAuthoritySnapshot,
  type NurtureCommandSpec,
  type NurtureCreateInstitutionKnowledgeItemPayload,
  type NurtureInstitutionKnowledgeCommittedResultV1,
  type NurtureInstitutionKnowledgeConflictCandidatePayloadV1,
} from "@the-nurture/scenario";
import { createPrismaClient } from "../src/client.js";
import {
  PrismaNurtureCommandRepository,
  createAesGcmProtectedContentPort,
} from "../src/index.js";

const prisma = createPrismaClient();
const protectedContent = createAesGcmProtectedContentPort({
  keyRef: "g4e-institution-knowledge",
  keyMaterial: "g4e-institution-knowledge-test-key-material",
});

afterAll(async () => {
  await prisma.$disconnect();
});

const seed = async () => {
  const workspaceId = randomUUID();
  const institution = await prisma.nurtureCareInstitution.create({
    data: {
      workspaceId,
      displayName: "Knowledge Qualification Institution",
      status: "active",
    },
  });
  const participant = await prisma.nurtureParticipant.create({
    data: {
      workspaceId,
      myChatUserId: `knowledge-admin:${randomUUID()}`,
      status: "active",
    },
  });
  const role = await prisma.nurtureCareRoleAssignment.create({
    data: {
      workspaceId,
      participantId: participant.id,
      role: "institution_admin",
      scopeType: "institution",
      scopeId: institution.id,
      status: "active",
    },
  });
  return {
    workspaceId,
    institution,
    participant,
    role,
    runner: new NurtureCommandRunner(new PrismaNurtureCommandRepository(prisma)),
  };
};

type World = Awaited<ReturnType<typeof seed>>;

const isKnowledgeCommittedResult = (
  value: unknown,
): value is NurtureInstitutionKnowledgeCommittedResultV1 => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return (
    Object.keys(record).length === 6 &&
    typeof record.item_ref === "string" &&
    typeof record.revision_ref === "string" &&
    Number.isInteger(record.item_head) &&
    Number.isInteger(record.revision_number) &&
    typeof record.revision_state === "string" &&
    ["draft", "published", "superseded", "revoked"].includes(record.revision_state) &&
    typeof record.committed_at === "string"
  );
};

const execute = <Payload>(input: {
  world: World;
  commandId: string;
  payload: Payload;
  spec: NurtureCommandSpec<Payload>;
  actorRef?: string;
}) =>
  input.world.runner.execute({
    workspace_id: input.world.workspaceId,
    invocation_request_id: `invocation:${input.commandId}`,
    command_request_id: input.commandId,
    business_actor_ref: input.actorRef ?? input.world.participant.id,
    payload: input.payload,
    spec: input.spec,
  });

const authorityLink = () => {
  const seed = {
    authority_source_ref: {
      schema_version: 1 as const,
      namespace: "my_chat",
      object_type: "knowledge_source",
      object_id: `authority:${randomUUID()}`,
      version: 4,
    },
    source_version: "2026.08.10",
    publisher: "Public health authority",
    title: "Daily care guidance",
    source_date: "2026-08-01",
    deep_link: "https://example.test/daily-care-guidance",
    excerpt: "A bounded, non-diagnostic daily-care excerpt.",
    verified_at: "2026-08-10T12:00:00.000Z",
  };
  return { ...seed, snapshot_hash: hashInstitutionKnowledgeAuthoritySnapshot(seed) };
};

const createPayload = (world: World): NurtureCreateInstitutionKnowledgeItemPayload => ({
  workspace_id: world.workspaceId,
  institution_ref: world.institution.id,
  role_assignment_ref: world.role.id,
  category: "daily_care_safety",
  body: {
    title: "Calm transition routine",
    summary: "General, non-diagnostic guidance for institution staff.",
    sections: [
      {
        sectionKey: "transition_routine",
        heading: "Transition routine",
        body: "Keep the routine calm, observable and appropriate to the institution context.",
      },
    ],
  },
  intended_audiences: ["institution_admin", "caregiver"],
  age_band_keys: ["toddler"],
  scenario_keys: ["daily_transition"],
  safety_class: "care_safety",
  verified_authority_links: [authorityLink()],
});

describe("T-007 G4-E Institution Knowledge owner (production DB lane)", () => {
  it("commits lifecycle state once, replays exactly and preserves append-only history", async () => {
    const world = await seed();
    const specs = createInstitutionKnowledgeCommandSpecs({
      protected_content: protectedContent,
    });
    const commandId = `knowledge-create:${randomUUID()}`;
    const payload = createPayload(world);
    const created = await execute({
      world,
      commandId,
      payload,
      spec: specs.createInstitutionKnowledgeItem,
    });
    expect(created).toMatchObject({
      status: "ok",
      disposition: "executed",
      committed_result: { item_head: 1, revision_number: 1, revision_state: "draft" },
    });
    if (
      created.status !== "ok" ||
      !isKnowledgeCommittedResult(created.committed_result)
    ) {
      throw new Error("knowledge item creation did not commit");
    }
    const replay = await execute({
      world,
      commandId,
      payload: {
        ...payload,
        intended_audiences: [...payload.intended_audiences].reverse(),
      },
      spec: specs.createInstitutionKnowledgeItem,
    });
    expect(replay).toMatchObject({ status: "ok", disposition: "replayed" });

    const itemRef = created.committed_result.item_ref;
    const revisionRef = created.committed_result.revision_ref;
    await expect(
      execute({
        world,
        commandId: `knowledge-review:${randomUUID()}`,
        payload: {
          workspace_id: world.workspaceId,
          institution_ref: world.institution.id,
          role_assignment_ref: world.role.id,
          item_ref: itemRef,
          revision_ref: revisionRef,
          expected_item_head: 1,
          decision: "reviewed" as const,
          reason_key: "admin_reviewed",
        },
        spec: specs.recordInstitutionKnowledgeReview,
      }),
    ).resolves.toMatchObject({
      status: "ok",
      committed_result: { item_head: 2, revision_state: "draft" },
    });
    const published = await execute({
      world,
      commandId: `knowledge-publish:${randomUUID()}`,
      payload: {
        workspace_id: world.workspaceId,
        institution_ref: world.institution.id,
        role_assignment_ref: world.role.id,
        item_ref: itemRef,
        revision_ref: revisionRef,
        expected_item_head: 2,
      },
      spec: specs.publishInstitutionKnowledgeRevision,
    });
    if (published.status !== "ok") {
      throw new Error(`knowledge publication did not commit: ${JSON.stringify(published)}`);
    }
    expect(published).toMatchObject({
      status: "ok",
      committed_result: { item_head: 3, revision_state: "published" },
    });
    await expect(
      execute({
        world,
        commandId: `knowledge-revoke:${randomUUID()}`,
        payload: {
          workspace_id: world.workspaceId,
          institution_ref: world.institution.id,
          role_assignment_ref: world.role.id,
          item_ref: itemRef,
          revision_ref: revisionRef,
          expected_item_head: 3,
          reason_key: "source_withdrawn",
        },
        spec: specs.revokeInstitutionKnowledgeRevision,
      }),
    ).resolves.toMatchObject({
      status: "ok",
      committed_result: { item_head: 4, revision_state: "revoked" },
    });

    expect(
      await prisma.nurtureInstitutionKnowledgeItem.findUniqueOrThrow({
        where: { id: itemRef },
      }),
    ).toMatchObject({ itemHead: 4, currentPublishedRevisionId: null });
    expect(
      await prisma.nurtureInstitutionKnowledgeRevision.count({
        where: { workspaceId: world.workspaceId },
      }),
    ).toBe(1);
    expect(
      await prisma.nurtureInstitutionKnowledgeAuthorityLink.count({
        where: { workspaceId: world.workspaceId },
      }),
    ).toBe(1);
    expect(
      await prisma.nurtureInstitutionKnowledgeRevisionEvent.findMany({
        where: { workspaceId: world.workspaceId },
        orderBy: [{ itemHead: "asc" }, { eventOrdinal: "asc" }],
        select: { eventType: true },
      }),
    ).toEqual([
      { eventType: "revision_created" },
      { eventType: "reviewed" },
      { eventType: "published" },
      { eventType: "revoked" },
    ]);
    const storedRevision =
      await prisma.nurtureInstitutionKnowledgeRevision.findUniqueOrThrow({
        where: { id: revisionRef },
        select: { contentHash: true },
      });
    await expect(
      prisma.nurtureInstitutionKnowledgeRevision.update({
        where: { id: revisionRef },
        data: { contentHash: "b".repeat(64) },
      }),
    ).rejects.toThrow();
    expect(
      await prisma.nurtureInstitutionKnowledgeRevision.findUniqueOrThrow({
        where: { id: revisionRef },
        select: { contentHash: true },
      }),
    ).toEqual(storedRevision);
  });

  it("records one immutable conflict candidate for reordered exact sources", async () => {
    const world = await seed();
    const recorder = createInstitutionKnowledgeConflictCandidateRecorder({
      command_runner: world.runner,
      protected_content: protectedContent,
    });
    const payload: NurtureInstitutionKnowledgeConflictCandidatePayloadV1 = {
      workspace_id: world.workspaceId,
      institution_ref: world.institution.id,
      rule_set_ref: "institution-answer-safety",
      rule_version: "1.0.0",
      finding: {
        conflict_class: "contraindication_conflict",
        finding_fingerprint: "f".repeat(64),
        sources: [
          {
            source_ref: {
              schema_version: 1,
              namespace: "nurture",
              object_type: "institution_knowledge_source",
              object_id: "nurture-source-1",
              version: 1,
            },
            source_version: `r1:${"a".repeat(64)}`,
            content_hash: "a".repeat(64),
          },
          {
            source_ref: {
              schema_version: 1,
              namespace: "my_chat",
              object_type: "knowledge_source",
              object_id: "authority-source-1",
              version: 4,
            },
            source_version: "2026.08.10",
            content_hash: "b".repeat(64),
          },
        ],
      },
      targeted_nurture_revision_refs: ["nurture-revision-1"],
    };
    const first = await recorder.record(payload);
    const replay = await recorder.record({
      ...payload,
      finding: { ...payload.finding, sources: [...payload.finding.sources].reverse() },
    });
    expect(first).toMatchObject({ status: "resolved" });
    expect(replay).toEqual(first);
    const candidate =
      await prisma.nurtureInstitutionKnowledgeConflictReviewCandidate.findFirstOrThrow({
        where: { workspaceId: world.workspaceId },
      });
    expect(candidate).toMatchObject({
      evidenceMode: "none",
      ruleSetRef: payload.rule_set_ref,
      ruleVersion: payload.rule_version,
    });
    expect(
      await prisma.nurtureInstitutionKnowledgeConflictReviewCandidate.count({
        where: { workspaceId: world.workspaceId },
      }),
    ).toBe(1);
    await expect(
      prisma.nurtureInstitutionKnowledgeConflictReviewCandidate.update({
        where: { id: candidate.id },
        data: { ruleVersion: "1.0.1" },
      }),
    ).rejects.toThrow();
    expect(
      await prisma.nurtureInstitutionKnowledgeConflictReviewCandidate.findUniqueOrThrow({
        where: { id: candidate.id },
        select: { ruleVersion: true },
      }),
    ).toEqual({ ruleVersion: "1.0.0" });
  });
});
