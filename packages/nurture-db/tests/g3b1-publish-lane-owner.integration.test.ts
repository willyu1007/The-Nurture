import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { createPrismaClient } from "../src/client.js";
import {
  createAesGcmProtectedContentPort,
  PrismaCareCaptureReadPort,
  PrismaPublishLaneReadPort,
} from "../src/index.js";

// Owner-side proof for the publish queue, draft/hold/cancel and capture ports
// (G3-E prerequisites B2 and B3). The queue is class-shared work, so what has
// to hold here is that authority is measured against the exact source
// CareGroup, that the queue census is queue-wide rather than page-wide, and
// that reading the capture lane never advances it.
const prisma = createPrismaClient();
const protectedContent = createAesGcmProtectedContentPort({
  keyRef: "test-key",
  keyMaterial: "0123456789abcdef0123456789abcdef",
});

afterAll(async () => {
  await prisma.$disconnect();
});

const SNAPSHOT_AT = "2026-08-02T04:00:00.000Z";

const seedGroup = async () => {
  const workspaceId = randomUUID();
  const teacher = await prisma.nurtureParticipant.create({
    data: { workspaceId, myChatUserId: `teacher:${workspaceId}`, status: "active" },
  });
  const colleague = await prisma.nurtureParticipant.create({
    data: { workspaceId, myChatUserId: `colleague:${workspaceId}`, status: "active" },
  });
  const institution = await prisma.nurtureCareInstitution.create({
    data: { workspaceId, displayName: "Care Center", status: "active" },
  });
  const group = await prisma.nurtureCareGroup.create({
    data: { workspaceId, institutionId: institution.id, name: "Class A", status: "active" },
  });
  const otherGroup = await prisma.nurtureCareGroup.create({
    data: { workspaceId, institutionId: institution.id, name: "Class B", status: "active" },
  });
  const teacherRole = await prisma.nurtureCareRoleAssignment.create({
    data: {
      workspaceId,
      participantId: teacher.id,
      role: "caregiver",
      scopeType: "care_group",
      scopeId: group.id,
      status: "active",
      displayLabel: "Teacher Lin",
    },
  });
  const colleagueRole = await prisma.nurtureCareRoleAssignment.create({
    data: {
      workspaceId,
      participantId: colleague.id,
      role: "caregiver",
      scopeType: "care_group",
      scopeId: group.id,
      status: "active",
      displayLabel: "Teacher Wu",
    },
  });
  return {
    workspaceId,
    teacher,
    colleague,
    institution,
    group,
    otherGroup,
    teacherRole,
    colleagueRole,
  };
};

type Group = Awaited<ReturnType<typeof seedGroup>>;

const seedProcess = async (
  world: Group,
  overrides: { state?: "draft" | "needs_review" | "pending_release" | "released" | "cancelled" } = {},
) => {
  const process = await prisma.nurturePublishProcess.create({
    data: {
      workspaceId: world.workspaceId,
      careGroupId: world.group.id,
      processKey: `publish:${randomUUID()}`,
      state: overrides.state ?? "draft",
      dataClass: "child_growth_record",
      purposeKey: "child_growth_publication",
    },
  });
  const revision = await prisma.nurturePublishProcessRevision.create({
    data: {
      workspaceId: world.workspaceId,
      publishProcessId: process.id,
      revision: 1,
      contentDigest: "sha256:content",
      organizerInputRevision: "organizer:1",
      titleProtectionPayload: protectedContent.seal("Spring outing"),
      sourceRefsPayload: ["source-ref-1", "source-ref-2"],
    },
  });
  await prisma.nurturePublishProcess.update({
    where: { id: process.id },
    data: { currentRevisionId: revision.id },
  });
  return { process, revision };
};

describe("G3-B1 owner reads: teacher publish queue", () => {
  it("reports a queue-wide census while returning only one page", async () => {
    const world = await seedGroup();
    for (const state of ["draft", "draft", "needs_review", "released"] as const) {
      await seedProcess(world, { state });
    }
    const reads = new PrismaPublishLaneReadPort(prisma, protectedContent);
    const page = await reads.listTeacherPublishQueue({
      workspace_id: world.workspaceId,
      participant_id: world.teacher.id,
      care_group_id: world.group.id,
      snapshot_at: SNAPSHOT_AT,
      take: 1,
    });
    expect(page.authorized).toBe(true);
    expect(page.rows).toHaveLength(1);
    expect(page.has_more).toBe(true);
    // The census counts the whole queue, not the single row on this page.
    expect(page.state_counts).toEqual({
      draft: 2,
      needs_review: 1,
      pending_release: 0,
      released: 1,
      cancelled: 0,
    });
  });

  it("shows the saved revision's title and never the sealed payload", async () => {
    const world = await seedGroup();
    await seedProcess(world);
    const withKey = new PrismaPublishLaneReadPort(prisma, protectedContent);
    const readable = await withKey.listTeacherPublishQueue({
      workspace_id: world.workspaceId,
      participant_id: world.teacher.id,
      care_group_id: world.group.id,
      snapshot_at: SNAPSHOT_AT,
      take: 10,
    });
    expect(readable.rows[0]?.title).toBe("Spring outing");

    // Without key material the protected-content boundary stays closed: the
    // queue shows no title rather than ciphertext.
    const withoutKey = new PrismaPublishLaneReadPort(prisma);
    const sealed = await withoutKey.listTeacherPublishQueue({
      workspace_id: world.workspaceId,
      participant_id: world.teacher.id,
      care_group_id: world.group.id,
      snapshot_at: SNAPSHOT_AT,
      take: 10,
    });
    expect(sealed.rows[0]?.title).toBe("");
  });

  it("counts released targets per target rather than collapsing to published", async () => {
    const world = await seedGroup();
    const { process, revision } = await seedProcess(world, { state: "released" });
    const child = await prisma.nurtureChild.create({
      data: { workspaceId: world.workspaceId, displayName: "Child", status: "active" },
    });
    const careProcess = await prisma.nurtureChildCareProcess.create({
      data: { workspaceId: world.workspaceId, childId: child.id, status: "active" },
    });
    const enrollment = await prisma.nurtureEnrollment.create({
      data: {
        workspaceId: world.workspaceId,
        childCareProcessId: careProcess.id,
        institutionId: world.institution.id,
        careGroupId: world.group.id,
        status: "active",
      },
    });
    const grant = await prisma.nurtureChildLinkGrant.create({
      data: {
        workspaceId: world.workspaceId,
        childCareProcessId: careProcess.id,
        enrollmentId: enrollment.id,
        grantedByParticipantId: world.teacher.id,
        grantedToScopeType: "care_group",
        grantedToScopeId: world.group.id,
        directions: ["org_to_family"],
        dataClasses: ["child_growth_record"],
        purposes: ["child_growth_publication"],
        status: "active",
      },
    });
    const targets = await Promise.all(
      ["a", "b"].map((tag) =>
        prisma.nurturePublishProcessTarget.create({
          data: {
            workspaceId: world.workspaceId,
            publishProcessId: process.id,
            targetKey: `target:${tag}`,
            childCareProcessId: careProcess.id,
            enrollmentId: enrollment.id,
            familyRefKey: `${world.workspaceId}:${careProcess.id}`,
            grantId: grant.id,
          },
        }),
      ),
    );
    await prisma.nurturePublicationRelease.create({
      data: {
        workspaceId: world.workspaceId,
        publishProcessId: process.id,
        publishProcessTargetId: targets[0]!.id,
        publishProcessRevisionId: revision.id,
        releasedByRoleAssignmentId: world.teacherRole.id,
        commandRequestIdHash: "sha256:command-1",
      },
    });

    const reads = new PrismaPublishLaneReadPort(prisma, protectedContent);
    const page = await reads.listTeacherPublishQueue({
      workspace_id: world.workspaceId,
      participant_id: world.teacher.id,
      care_group_id: world.group.id,
      snapshot_at: SNAPSHOT_AT,
      take: 10,
    });
    expect(page.rows[0]?.target_count).toBe(2);
    expect(page.rows[0]?.released_target_count).toBe(1);
  });

  it("omits a scheduled time until the owner has actually resolved one", async () => {
    const world = await seedGroup();
    const { process } = await seedProcess(world);
    const reads = new PrismaPublishLaneReadPort(prisma, protectedContent);
    const unscheduled = await reads.listTeacherPublishQueue({
      workspace_id: world.workspaceId,
      participant_id: world.teacher.id,
      care_group_id: world.group.id,
      snapshot_at: SNAPSHOT_AT,
      take: 10,
    });
    expect(unscheduled.rows[0]?.scheduled_at).toBeUndefined();

    await prisma.nurturePublishProcess.update({
      where: { id: process.id },
      data: { scheduledAt: new Date("2026-08-03T09:00:00.000Z") },
    });
    const scheduled = await reads.listTeacherPublishQueue({
      workspace_id: world.workspaceId,
      participant_id: world.teacher.id,
      care_group_id: world.group.id,
      snapshot_at: SNAPSHOT_AT,
      take: 10,
    });
    expect(scheduled.rows[0]?.scheduled_at).toBe("2026-08-03T09:00:00.000Z");
  });

  it("refuses a sibling class and an institution-scoped assignment", async () => {
    const world = await seedGroup();
    await seedProcess(world);
    const reads = new PrismaPublishLaneReadPort(prisma, protectedContent);

    const sibling = await reads.listTeacherPublishQueue({
      workspace_id: world.workspaceId,
      participant_id: world.teacher.id,
      care_group_id: world.otherGroup.id,
      snapshot_at: SNAPSHOT_AT,
      take: 10,
    });
    expect(sibling.authorized).toBe(false);
    expect(sibling.state_counts.draft).toBe(0);

    await prisma.nurtureCareRoleAssignment.update({
      where: { id: world.teacherRole.id },
      data: { scopeType: "institution", scopeId: world.institution.id },
    });
    const widened = await reads.listTeacherPublishQueue({
      workspace_id: world.workspaceId,
      participant_id: world.teacher.id,
      care_group_id: world.group.id,
      snapshot_at: SNAPSHOT_AT,
      take: 10,
    });
    expect(widened.authorized).toBe(false);
  });
});

describe("G3-B1 owner reads: edit hold, draft and cancel", () => {
  it("reports a colleague's live hold and stops reporting an expired one", async () => {
    const world = await seedGroup();
    const { process } = await seedProcess(world);
    const reads = new PrismaPublishLaneReadPort(prisma, protectedContent);

    const hold = await prisma.nurturePublishEditHold.create({
      data: {
        workspaceId: world.workspaceId,
        publishProcessId: process.id,
        holderRoleAssignmentId: world.colleagueRole.id,
        holderParticipantId: world.colleague.id,
        expiresAt: new Date(Date.now() + 60_000),
      },
    });
    const held = await reads.loadEditHoldFacts({
      workspace_id: world.workspaceId,
      participant_id: world.teacher.id,
      process_key: process.processKey,
    });
    expect(held?.current_hold?.holder_participant_id).toBe(world.colleague.id);
    expect(held?.current_hold?.holder_label).toBe("Teacher Wu");
    // Shared class responsibility: the colleague's hold does not remove the
    // reader's own authority over the card.
    expect(held?.authority.role_scope_matches_source).toBe(true);

    await prisma.nurturePublishEditHold.update({
      where: { id: hold.id },
      data: { expiresAt: new Date(Date.now() - 60_000) },
    });
    const lapsed = await reads.loadEditHoldFacts({
      workspace_id: world.workspaceId,
      participant_id: world.teacher.id,
      process_key: process.processKey,
    });
    // An expired hold is no hold, and reading it never renews it.
    expect(lapsed?.current_hold).toBeUndefined();
    const stored = await prisma.nurturePublishEditHold.findUniqueOrThrow({
      where: { id: hold.id },
    });
    expect(stored.expiresAt.getTime()).toBeLessThan(Date.now());
  });

  it("returns only the source refs the owner recorded for this process", async () => {
    const world = await seedGroup();
    const { process } = await seedProcess(world);
    const reads = new PrismaPublishLaneReadPort(prisma, protectedContent);
    const facts = await reads.loadDraftFacts({
      workspace_id: world.workspaceId,
      participant_id: world.teacher.id,
      process_key: process.processKey,
      command_request_id: "command-new",
    });
    expect(facts?.known_source_refs).toEqual(["source-ref-1", "source-ref-2"]);
    expect(facts?.current_revision).toBe(1);
    expect(facts?.replayed_revision).toBeUndefined();
  });

  it("answers an exact command replay from the revision that command wrote", async () => {
    const world = await seedGroup();
    const { process } = await seedProcess(world);
    const reads = new PrismaPublishLaneReadPort(prisma, protectedContent);
    const facts = await reads.loadDraftFacts({
      workspace_id: world.workspaceId,
      participant_id: world.teacher.id,
      process_key: process.processKey,
      command_request_id: "organizer:1",
    });
    expect(facts?.replayed_revision).toEqual({
      revision: 1,
      content_digest: "sha256:content",
      saved_at: expect.any(String),
    });
  });

  it("treats a malformed source-ref payload as no known refs, not a partial set", async () => {
    const world = await seedGroup();
    const { process, revision } = await seedProcess(world);
    await prisma.nurturePublishProcessRevision.update({
      where: { id: revision.id },
      data: { sourceRefsPayload: { unexpected: "shape" } },
    });
    const reads = new PrismaPublishLaneReadPort(prisma, protectedContent);
    const facts = await reads.loadDraftFacts({
      workspace_id: world.workspaceId,
      participant_id: world.teacher.id,
      process_key: process.processKey,
      command_request_id: "command-new",
    });
    expect(facts?.known_source_refs).toEqual([]);
  });

  it("counts committed releases so the pre-release cancel window can close", async () => {
    const world = await seedGroup();
    const { process } = await seedProcess(world);
    const reads = new PrismaPublishLaneReadPort(prisma, protectedContent);
    const facts = await reads.loadCancelFacts({
      workspace_id: world.workspaceId,
      participant_id: world.teacher.id,
      process_key: process.processKey,
    });
    expect(facts?.committed_release_count).toBe(0);
    expect(facts?.process_state).toBe("draft");
  });

  it("resolves a process key only while the actor still reaches its class", async () => {
    const world = await seedGroup();
    const { process } = await seedProcess(world);
    const reads = new PrismaPublishLaneReadPort(prisma, protectedContent);
    expect(
      await reads.listEditableProcessKeys({
        workspace_id: world.workspaceId,
        participant_id: world.teacher.id,
      }),
    ).toEqual([process.processKey]);

    await prisma.nurtureCareRoleAssignment.update({
      where: { id: world.teacherRole.id },
      data: { status: "revoked" },
    });
    expect(
      await reads.listEditableProcessKeys({
        workspace_id: world.workspaceId,
        participant_id: world.teacher.id,
      }),
    ).toEqual([]);
    expect(
      await reads.loadEditHoldFacts({
        workspace_id: world.workspaceId,
        participant_id: world.teacher.id,
        process_key: process.processKey,
      }),
    ).toBeNull();
  });
});

describe("G3-B1 owner reads: capture lane", () => {
  const seedBatch = async (world: Group) => {
    const batch = await prisma.nurtureCareCaptureBatch.create({
      data: {
        workspaceId: world.workspaceId,
        careGroupId: world.group.id,
        state: "collecting",
        quiescenceSeconds: 60,
        observedUserActivityAt: new Date("2026-08-02T03:55:00.000Z"),
      },
    });
    for (const [sequence, stable] of [
      [1, true],
      [2, true],
      [3, false],
      [4, true],
    ] as const) {
      await prisma.nurtureCareCapture.create({
        data: {
          workspaceId: world.workspaceId,
          careGroupId: world.group.id,
          captureBatchId: batch.id,
          capturedByRoleAssignmentId: world.teacherRole.id,
          kind: "text",
          sourceSequence: sequence,
          stable,
          occurredAt: new Date(`2026-08-02T03:5${sequence}:00.000Z`),
        },
      });
    }
    return batch;
  };

  it("reports the intake in sequence order with the owner's own stability fact", async () => {
    const world = await seedGroup();
    const batch = await seedBatch(world);
    const reads = new PrismaCareCaptureReadPort(prisma);
    const source = await reads.loadOrganizeSource({
      workspace_id: world.workspaceId,
      participant_id: world.teacher.id,
      care_group_id: world.group.id,
      snapshot_at: SNAPSHOT_AT,
    });
    expect(source?.batch_id).toBe(batch.id);
    expect(source?.state).toBe("collecting");
    // The owner reports stability; cutting the stable prefix is the evaluator's
    // job, so an unstable capture is reported rather than filtered away.
    expect(source?.captures.map((capture) => [capture.source_sequence, capture.stable])).toEqual([
      [1, true],
      [2, true],
      [3, false],
      [4, true],
    ]);
    expect(source?.activity.last_user_activity_at).toBe("2026-08-02T03:55:00.000Z");
  });

  it("never opens or advances a batch as a side effect of being read", async () => {
    const world = await seedGroup();
    const reads = new PrismaCareCaptureReadPort(prisma);
    expect(
      await reads.loadOrganizeSource({
        workspace_id: world.workspaceId,
        participant_id: world.teacher.id,
        care_group_id: world.group.id,
        snapshot_at: SNAPSHOT_AT,
      }),
    ).toBeNull();
    expect(
      await prisma.nurtureCareCaptureBatch.count({ where: { workspaceId: world.workspaceId } }),
    ).toBe(0);

    const batch = await seedBatch(world);
    await reads.loadOrganizeSource({
      workspace_id: world.workspaceId,
      participant_id: world.teacher.id,
      care_group_id: world.group.id,
      snapshot_at: SNAPSHOT_AT,
    });
    const stored = await prisma.nurtureCareCaptureBatch.findUniqueOrThrow({
      where: { id: batch.id },
    });
    expect(stored.state).toBe("collecting");
    expect(stored.watermarkSourceSequence).toBeNull();
    expect(stored.cutAt).toBeNull();
  });

  it("refuses a caregiver of another class and a revoked assignment", async () => {
    const world = await seedGroup();
    await seedBatch(world);
    const reads = new PrismaCareCaptureReadPort(prisma);
    expect(
      await reads.loadOrganizeSource({
        workspace_id: world.workspaceId,
        participant_id: world.teacher.id,
        care_group_id: world.otherGroup.id,
        snapshot_at: SNAPSHOT_AT,
      }),
    ).toBeNull();

    await prisma.nurtureCareRoleAssignment.update({
      where: { id: world.teacherRole.id },
      data: { status: "revoked" },
    });
    expect(
      await reads.loadOrganizeSource({
        workspace_id: world.workspaceId,
        participant_id: world.teacher.id,
        care_group_id: world.group.id,
        snapshot_at: SNAPSHOT_AT,
      }),
    ).toBeNull();
  });
});
