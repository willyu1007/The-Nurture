import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import {
  createInstitutionKnowledgeCommandSpecs,
  hashInstitutionKnowledgeAuthoritySnapshot,
  institutionKnowledgeSourceVersion,
  NurtureCommandRunner,
} from "@the-nurture/scenario";
import { createPrismaClient } from "../src/client.js";
import {
  createAesGcmProtectedContentPort,
  institutionKnowledgeSourceObjectId,
  PrismaInstitutionKnowledgeReadOwner,
  PrismaNurtureCommandRepository,
} from "../src/index.js";

const prisma = createPrismaClient();

afterAll(async () => {
  await prisma.$disconnect();
});

const protectedContent = createAesGcmProtectedContentPort({
  keyRef: "read-owner-it",
  keyMaterial: "read-owner-integration-test-key-material",
});

const authorityLink = () => {
  const seed = {
    authority_source_ref: {
      schema_version: 1 as const,
      namespace: "my_chat",
      object_type: "knowledge_source",
      object_id: `authority:${randomUUID()}`,
      version: 2,
    },
    source_version: "2026.08.01",
    publisher: "Public health authority",
    title: "Daily care guidance",
    source_date: "2026-08-01",
    deep_link: "https://example.test/read-owner-guidance",
    excerpt: "A bounded, non-diagnostic excerpt.",
    verified_at: "2026-08-10T12:00:00.000Z",
  };
  return { ...seed, snapshot_hash: hashInstitutionKnowledgeAuthoritySnapshot(seed) };
};

async function seedWorld() {
  const suffix = randomUUID();
  const workspaceId = `read-owner-ws-${suffix}`;
  const institution = await prisma.nurtureCareInstitution.create({
    data: { workspaceId, displayName: "Read owner IT", status: "active" },
  });
  const participant = await prisma.nurtureParticipant.create({
    data: {
      workspaceId,
      myChatUserId: `read-owner-admin-${suffix}`,
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
  const runner = new NurtureCommandRunner(new PrismaNurtureCommandRepository(prisma));
  const specs = createInstitutionKnowledgeCommandSpecs({
    protected_content: protectedContent,
  });
  const run = async <Payload>(commandId: string, payload: Payload, spec: never) => {
    const result = await runner.execute({
      workspace_id: workspaceId,
      invocation_request_id: `invocation:${commandId}`,
      command_request_id: commandId,
      business_actor_ref: participant.id,
      payload,
      spec,
    }) as { status: string; committed_result?: { item_ref: string; revision_ref: string } };
    if (result.status !== "ok") {
      throw new Error(`${commandId} failed: ${JSON.stringify(result)}`);
    }
    return result;
  };
  const scoped = (payload: Record<string, unknown>) => ({
    workspace_id: workspaceId,
    institution_ref: institution.id,
    role_assignment_ref: role.id,
    ...payload,
  });
  const created = await run(`ro-create-${suffix}`, scoped({
    category: "daily_care_safety",
    body: {
      title: "Read owner routine",
      summary: "General, non-diagnostic guidance.",
      sections: [{
        sectionKey: "main",
        heading: "Routine",
        body: "Record the routine and its completion evidence.",
      }],
    },
    intended_audiences: ["institution_admin"],
    safety_class: "care_safety",
    verified_authority_links: [authorityLink()],
  }), specs.createInstitutionKnowledgeItem as never);
  const itemRef = created.committed_result!.item_ref;
  const revisionRef = created.committed_result!.revision_ref;
  await run(`ro-changes-${suffix}`, scoped({
    item_ref: itemRef,
    revision_ref: revisionRef,
    expected_item_head: 1,
    decision: "changes_requested",
    reason_key: "needs_detail",
  }), specs.recordInstitutionKnowledgeReview as never);
  await run(`ro-review-${suffix}`, scoped({
    item_ref: itemRef,
    revision_ref: revisionRef,
    expected_item_head: 2,
    decision: "reviewed",
    reason_key: "admin_reviewed",
  }), specs.recordInstitutionKnowledgeReview as never);
  await run(`ro-publish-${suffix}`, scoped({
    item_ref: itemRef,
    revision_ref: revisionRef,
    expected_item_head: 3,
  }), specs.publishInstitutionKnowledgeRevision as never);
  return { suffix, workspaceId, institution, participant, role, itemRef, revisionRef, run, scoped };
}

async function seedRepublishedWorld() {
  const world = await seedWorld();
  const specs = createInstitutionKnowledgeCommandSpecs({
    protected_content: protectedContent,
  });
  const created = await world.run(`ro-revise-${world.suffix}`, world.scoped({
    item_ref: world.itemRef,
    expected_item_head: 4,
    body: {
      title: "Read owner routine v2",
      summary: "Updated non-diagnostic guidance.",
      sections: [{
        sectionKey: "main",
        heading: "Routine",
        body: "Record the routine, the responsible role and the completion evidence.",
      }],
    },
    intended_audiences: ["institution_admin"],
    safety_class: "care_safety",
    verified_authority_links: [authorityLink()],
  }), specs.createInstitutionKnowledgeRevision as never);
  const secondRevisionRef = created.committed_result!.revision_ref;
  await world.run(`ro-review2-${world.suffix}`, world.scoped({
    item_ref: world.itemRef,
    revision_ref: secondRevisionRef,
    expected_item_head: 5,
    decision: "reviewed",
    reason_key: "admin_reviewed",
  }), specs.recordInstitutionKnowledgeReview as never);
  await world.run(`ro-publish2-${world.suffix}`, world.scoped({
    item_ref: world.itemRef,
    revision_ref: secondRevisionRef,
    expected_item_head: 6,
  }), specs.publishInstitutionKnowledgeRevision as never);
  return { ...world, secondRevisionRef };
}


describe("PrismaInstitutionKnowledgeReadOwner", () => {
  it("serves published facts with an opaque non-row-id source ref", async () => {
    const world = await seedWorld();
    const reads = new PrismaInstitutionKnowledgeReadOwner(prisma);
    {
      const objectId = institutionKnowledgeSourceObjectId({
        workspace_id: world.workspaceId,
        institution_ref: world.institution.id,
        item_row_id: world.itemRef,
      });
      expect(objectId).not.toBe(world.itemRef);
      expect(objectId).toMatch(/^[0-9a-f]{64}$/u);

      const read = await reads.readCurrentPublication({
        workspace_id: world.workspaceId,
        institution_ref: world.institution.id,
        source_ref: {
          schema_version: 1,
          namespace: "nurture",
          object_type: "institution_knowledge_source",
          object_id: objectId,
        } as never,
      });
      expect(read.status).toBe("resolved");
      if (read.status !== "resolved") throw new Error("unreachable");
      const revision = await prisma.nurtureInstitutionKnowledgeRevision
        .findUniqueOrThrow({ where: { id: world.revisionRef } });
      expect(read.facts.source.source_version).toBe(
        institutionKnowledgeSourceVersion({
          revision_number: revision.revisionNumber,
          content_hash: revision.contentHash,
        }),
      );
      expect(read.facts.item.item_ref).toBe(world.itemRef);
      expect(read.facts.revision.revision_ref).toBe(world.revisionRef);
      expect(read.facts.authority_links).toHaveLength(1);
      expect(read.facts.publication_event_ref?.version).toBe(4);

      const unknown = await reads.readCurrentPublication({
        workspace_id: world.workspaceId,
        institution_ref: world.institution.id,
        source_ref: {
          schema_version: 1,
          namespace: "nurture",
          object_type: "institution_knowledge_source",
          object_id: "f".repeat(64),
        } as never,
      });
      expect(unknown.status).toBe("missing");

      const listed = await reads.listCurrentPublications({
        workspace_id: world.workspaceId,
        institution_ref: world.institution.id,
        limit: 10,
      });
      expect(listed.status).toBe("resolved");
      if (listed.status !== "resolved") throw new Error("unreachable");
      expect(listed.rows).toHaveLength(1);
      expect(listed.complete).toBe(true);
    }
  });

  it("walks the change feed completely through limit-1 keyset pagination", async () => {
    const world = await seedWorld();
    const reads = new PrismaInstitutionKnowledgeReadOwner(prisma);
    {
      const full = await reads.listSourceChanges({
        workspace_id: world.workspaceId,
        institution_ref: world.institution.id,
        limit: 50,
      });
      expect(full.status).toBe("resolved");
      if (full.status !== "resolved") throw new Error("unreachable");
      // changes_requested + reviewed map to review_changed; publish maps to
      // published; revision_created is not a source change.
      expect(full.changes.map((change) => change.event_type)).toEqual([
        "review_changed",
        "review_changed",
        "published",
      ]);
      expect(full.next_cursor).toBeUndefined();

      const walked: string[] = [];
      let cursor: string | undefined;
      for (let hop = 0; hop < 10; hop += 1) {
        const page = await reads.listSourceChanges({
          workspace_id: world.workspaceId,
          institution_ref: world.institution.id,
          limit: 1,
          ...(cursor === undefined ? {} : { after_cursor: cursor }),
        });
        expect(page.status).toBe("resolved");
        if (page.status !== "resolved") throw new Error("unreachable");
        if (page.changes.length === 0) break;
        walked.push(...page.changes.map((change) => change.cursor));
        cursor = page.changes.at(-1)!.cursor;
        if (page.next_cursor === undefined) {
          const rest = await reads.listSourceChanges({
            workspace_id: world.workspaceId,
            institution_ref: world.institution.id,
            limit: 50,
            after_cursor: cursor,
          });
          expect(rest).toMatchObject({ status: "resolved", changes: [] });
          break;
        }
      }
      expect(walked).toEqual(full.changes.map((change) => change.cursor));
      expect(new Set(walked).size).toBe(walked.length);

      const badCursor = await reads.listSourceChanges({
        workspace_id: world.workspaceId,
        institution_ref: world.institution.id,
        limit: 10,
        after_cursor: "not-a-cursor",
      });
      expect(badCursor.status).toBe("unavailable");

      // The change cursor must be opaque: no persistence row id may appear in
      // it, and it must decode back to the same ordering key.
      for (const change of full.changes) {
        const decoded = JSON.parse(
          Buffer.from(change.cursor, "base64url").toString("utf8"),
        );
        expect(decoded).toHaveLength(3);
        expect(String(decoded[1])).toMatch(/^[0-9a-f]{64}$/u);
        expect(JSON.stringify(decoded)).not.toContain(world.itemRef);
      }
    }
  });

  it("orders a real republish superseded/published pair by ordinal and walks by next_cursor only", async () => {
    // A genuine second-revision publish writes publication_superseded (ordinal
    // 0) and published (ordinal 1) in one transaction at a single timestamp —
    // the exact tie a raw-id order could invert. Built through the real command
    // runner so every history invariant holds.
    const world = await seedRepublishedWorld();
    const reads = new PrismaInstitutionKnowledgeReadOwner(prisma);
    {
      const full = await reads.listSourceChanges({
        workspace_id: world.workspaceId,
        institution_ref: world.institution.id,
        limit: 50,
      });
      if (full.status !== "resolved") throw new Error("unreachable");
      const supersededIndex = full.changes.findIndex((c) => c.event_type === "superseded");
      const republishIndex = full.changes.map((c) => c.event_type).lastIndexOf("published");
      expect(supersededIndex).toBeGreaterThanOrEqual(0);
      // The superseded of the old publication must sort before the new
      // published event that shares its timestamp and item head.
      const superseded = full.changes[supersededIndex]!;
      const republished = full.changes[republishIndex]!;
      if (superseded.committed_at === republished.committed_at) {
        expect(supersededIndex).toBeLessThan(republishIndex);
      }

      // Walk strictly through next_cursor at limit 1 and require the exact same
      // ordering as the full page.
      const walked: string[] = [];
      let cursor: string | undefined;
      for (let hop = 0; hop < 20; hop += 1) {
        const page = await reads.listSourceChanges({
          workspace_id: world.workspaceId,
          institution_ref: world.institution.id,
          limit: 1,
          ...(cursor === undefined ? {} : { after_cursor: cursor }),
        });
        if (page.status !== "resolved") throw new Error("unreachable");
        walked.push(...page.changes.map((change) => change.event_type));
        if (page.next_cursor === undefined) break;
        cursor = page.next_cursor;
      }
      expect(walked).toEqual(full.changes.map((change) => change.event_type));
    }
  });

  it("keeps evaluated_at and reconciliation_ref stable across reconciliation pages", async () => {
    const world = await seedWorld();
    // A fixed clock proves the watermark comes from the reconciliation ref, not
    // from a per-page call to the clock.
    let tick = 1_000;
    const reads = new PrismaInstitutionKnowledgeReadOwner(
      prisma,
      () => new Date(1_760_000_000_000 + (tick += 1_000)),
    );
    {
      const first = await reads.listCurrentPublications({
        workspace_id: world.workspaceId,
        institution_ref: world.institution.id,
        limit: 1,
      });
      if (first.status !== "resolved") throw new Error("unreachable");
      const continued = await reads.listCurrentPublications({
        workspace_id: world.workspaceId,
        institution_ref: world.institution.id,
        reconciliation_ref: first.reconciliation_ref,
        ...(first.next_source_cursor
          ? { after_source_cursor: first.next_source_cursor }
          : {}),
        limit: 1,
      });
      if (continued.status !== "resolved") throw new Error("unreachable");
      expect(continued.reconciliation_ref).toBe(first.reconciliation_ref);
      expect(continued.evaluated_at).toBe(first.evaluated_at);

      // A reconciliation ref minted for a different scope must fail closed.
      const foreign = await reads.listCurrentPublications({
        workspace_id: world.workspaceId,
        institution_ref: "institution-not-this-one",
        reconciliation_ref: first.reconciliation_ref,
        limit: 1,
      });
      expect(foreign.status).toBe("unavailable");
    }
  });
});

// The institution knowledge history tables are append-only (database
// triggers reject deletes), so worlds are isolated by per-run random
// workspace ids instead of cleanup, matching the sibling g4e suite.
