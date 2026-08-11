import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { createPrismaClient } from "../src/client.js";
import {
  createAesGcmProtectedContentPort,
  PrismaCareCaptureTransaction,
  PrismaCareCaptureReadPort,
  PrismaMediaSafetyReadPort,
  PrismaPublicationReleasePort,
  PrismaPublishLaneReadPort,
  PrismaPublishProcessTransaction,
  publishDraftCommandIdentity,
} from "../src/index.js";
import { resolveOrganizeTrigger } from "@the-nurture/scenario/harness";

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

const seedPublicationPolicy = (world: Group) =>
  prisma.nurtureInstitutionPublicationPolicy.create({
    data: {
      workspaceId: world.workspaceId,
      institutionId: world.institution.id,
      policyRef: "nurture.institution-publication-policy@1.0.0",
      policyVersion: 1,
      policyHead: 7,
      timeZone: "Asia/Shanghai",
      defaultReleaseLocalTime: "17:00",
      retryCutoffLocalTime: "19:00",
      organizeIdleSeconds: 600,
      organizeFallbackLeadSeconds: 1800,
      automaticQuiescenceSeconds: 60,
      captureActivityLeaseSeconds: 60,
      automaticOrganizeEnabled: true,
      effectiveFrom: new Date("2026-01-01T00:00:00.000Z"),
    },
  });

const seedProcess = async (
  world: Group,
  overrides: { state?: "draft" | "needs_review" | "pending_release" | "released" | "cancelled" } = {},
) => {
  // A process is created before it has a revision, so it starts in an
  // unreleased state and reaches `released` only by the same update that
  // freezes the revision — which is exactly what commitTargetRelease does.
  const state = overrides.state ?? "draft";
  const process = await prisma.nurturePublishProcess.create({
    data: {
      workspaceId: world.workspaceId,
      careGroupId: world.group.id,
      processKey: `publish:${randomUUID()}`,
      state: state === "released" ? "pending_release" : state,
      dataClass: "child_growth_record",
      purposeKey: "child_growth_publication",
      // A cancelled process carries the instant it was cancelled; the owner
      // constraint refuses one that does not, so a fixture cannot seed a state
      // the write lane can never produce.
      ...(state === "cancelled" ? { cancelledAt: new Date(SNAPSHOT_AT) } : {}),
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
    data: {
      currentRevisionId: revision.id,
      ...(state === "released" ? { state, frozenRevisionId: revision.id } : {}),
    },
  });
  return { process: { ...process, state }, revision };
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
    // queue uses a non-sensitive contract-safe label rather than ciphertext.
    const withoutKey = new PrismaPublishLaneReadPort(prisma);
    const sealed = await withoutKey.listTeacherPublishQueue({
      workspace_id: world.workspaceId,
      participant_id: world.teacher.id,
      care_group_id: world.group.id,
      snapshot_at: SNAPSHOT_AT,
      take: 10,
    });
    expect(sealed.rows[0]?.title).toBe("Class update");
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
        participationPhase: "formal",
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
        commandRequestIdHash: "a".repeat(64),
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
    expect(page.rows[0]?.action_grants).toEqual([
      expect.objectContaining({
        capability_key: "release_publish_process",
        capability_version: "1.0.0",
        availability: "available",
      }),
    ]);
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

    // A resolved window is all five fields; the database now refuses a partial
    // one, so this records the whole resolution the way the owner would.
    await prisma.nurturePublishProcess.update({
      where: { id: process.id },
      data: {
        scheduledAt: new Date("2026-08-03T09:00:00.000Z"),
        notAfter: new Date("2026-08-03T11:00:00.000Z"),
        scheduleTimeZone: "Asia/Shanghai",
        schedulePolicyRef: "nurture.institution-publication-policy@1.0.0",
        schedulePolicyHead: 3,
        schedulePolicyVersion: 1,
        scheduleResolvedAt: new Date("2026-08-03T02:00:00.000Z"),
      },
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

  it("excludes a process whose data class is not publishable, rather than relabelling it", async () => {
    const world = await seedGroup();
    await seedProcess(world);
    const foreign = await prisma.nurturePublishProcess.create({
      data: {
        workspaceId: world.workspaceId,
        careGroupId: world.group.id,
        processKey: `publish:${randomUUID()}`,
        state: "draft",
        dataClass: "direct_care_communication",
        purposeKey: "family_care_workflow",
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
    expect(page.rows.map((row) => row.process_key)).not.toContain(foreign.processKey);
    // And it is not counted as queue work either.
    expect(page.state_counts.draft).toBe(1);
  });

  it("advertises no action for states without an executable owner write", async () => {
    const world = await seedGroup();
    for (const state of ["draft", "released", "cancelled"] as const) {
      await seedProcess(world, { state });
    }
    const reads = new PrismaPublishLaneReadPort(prisma, protectedContent);
    const page = await reads.listTeacherPublishQueue({
      workspace_id: world.workspaceId,
      participant_id: world.teacher.id,
      care_group_id: world.group.id,
      snapshot_at: SNAPSHOT_AT,
      take: 10,
    });
    expect(page.rows).toHaveLength(3);
    // A released row with no remaining target is already satisfied. Draft,
    // fully released and cancelled rows must not regain the obsolete
    // save-draft placeholder or promise another unsupported action.
    expect(page.rows.flatMap((row) => row.action_grants)).toEqual([]);
  });

  it("keeps the queue source head scope-level rather than page-shaped", async () => {
    const world = await seedGroup();
    for (const state of ["draft", "draft", "draft"] as const) {
      await seedProcess(world, { state });
    }
    const reads = new PrismaPublishLaneReadPort(prisma, protectedContent);
    const read = (take: number) =>
      reads.listTeacherPublishQueue({
        workspace_id: world.workspaceId,
        participant_id: world.teacher.id,
        care_group_id: world.group.id,
        snapshot_at: SNAPSHOT_AT,
        take,
      });
    const small = await read(1);
    const large = await read(10);
    // A head that moved with the page size would not be describing the source.
    expect(small.heads).toEqual(large.heads);

    await seedProcess(world, { state: "draft" });
    const afterChange = await read(1);
    expect(afterChange.heads).not.toEqual(small.heads);
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

    // A hold lapses; it is never born expired, which is what the new CHECK
    // says. Move its creation back with it.
    await prisma.nurturePublishEditHold.update({
      where: { id: hold.id },
      data: {
        createdAt: new Date(Date.now() - 3_600_000),
        expiresAt: new Date(Date.now() - 60_000),
      },
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
    const { process, revision } = await seedProcess(world);
    const reads = new PrismaPublishLaneReadPort(prisma, protectedContent);

    // The fixture's assembler lineage is `organizer:1`. Asking with that as a
    // command id must find nothing: the two columns mean different things, and
    // an earlier version of this test passed only because they happened to
    // carry the same string.
    const byLineage = await reads.loadDraftFacts({
      workspace_id: world.workspaceId,
      participant_id: world.teacher.id,
      process_key: process.processKey,
      command_request_id: "organizer:1",
    });
    expect(byLineage?.replayed_revision).toBeUndefined();

    await prisma.nurturePublishProcessRevision.update({
      where: { id: revision.id },
      data: { commandRequestIdHash: publishDraftCommandIdentity("command:save-1") },
    });
    const facts = await reads.loadDraftFacts({
      workspace_id: world.workspaceId,
      participant_id: world.teacher.id,
      process_key: process.processKey,
      command_request_id: "command:save-1",
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

  it("reaches BOTH classes of a dual-class caregiver, not just the first", async () => {
    // The blind spot in the flesh: Teacher Lin also takes Class B. Every
    // listing must union both classes, and a Class B row must load with the
    // authority of Class B — "the first class" answered for both before.
    const world = await seedGroup();
    await prisma.nurtureCareRoleAssignment.create({
      data: {
        workspaceId: world.workspaceId,
        participantId: world.teacher.id,
        role: "caregiver",
        scopeType: "care_group",
        scopeId: world.otherGroup.id,
        status: "active",
        displayLabel: "Teacher Lin (B)",
      },
    });
    const inFirst = await seedProcess(world);
    const inSecond = await prisma.nurturePublishProcess.create({
      data: {
        workspaceId: world.workspaceId,
        careGroupId: world.otherGroup.id,
        processKey: `publish:${randomUUID()}`,
        state: "draft",
        dataClass: "child_growth_record",
        purposeKey: "child_growth_publication",
      },
    });
    const reads = new PrismaPublishLaneReadPort(prisma, protectedContent);
    const keys = await reads.listEditableProcessKeys({
      workspace_id: world.workspaceId,
      participant_id: world.teacher.id,
    });
    expect(keys).toContain(inFirst.process.processKey);
    expect(keys).toContain(inSecond.processKey);

    // The Class B row answers with Class B authority, matched to its source.
    const owner = new PrismaPublishProcessTransaction(prisma);
    const facts = await owner.loadPublishProcessCancelFacts({
      workspace_id: world.workspaceId,
      participant_id: world.teacher.id,
      process_key: inSecond.processKey,
    });
    expect(facts?.authority).toMatchObject({
      role_scope_matches_source: true,
      role_assignment_current: true,
    });

    // The union is a property of EVERY listing lane, not just the edit lane:
    // release/safety keys and attributable media must span both classes too.
    const releasePort = new PrismaPublicationReleasePort(prisma);
    const releaseKeys = await releasePort.listReleasableProcessKeys({
      workspace_id: world.workspaceId,
      participant_id: world.teacher.id,
    });
    expect(releaseKeys).toContain(inFirst.process.processKey);
    expect(releaseKeys).toContain(inSecond.processKey);

    const assetInSecond = await prisma.nurtureMediaAssetRef.create({
      data: {
        workspaceId: world.workspaceId,
        institutionId: world.institution.id,
        careGroupId: world.otherGroup.id,
        sourceKind: "class_album",
        storageRefPayload: { bucket: "media", key: randomUUID() },
        lifecycle: "ready",
      },
    });
    const mediaIds = await new PrismaMediaSafetyReadPort(prisma).listAttributableMediaIds({
      workspace_id: world.workspaceId,
      participant_id: world.teacher.id,
    });
    expect(mediaIds).toContain(assetInSecond.id);
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

  it("drives idle from the exact T-007 owner policy and replays the same watermark", async () => {
    const world = await seedGroup();
    await Promise.all([seedBatch(world), seedPublicationPolicy(world)]);
    const reads = new PrismaCareCaptureReadPort(prisma);
    const request = { trigger: "idle" as const, trigger_request_id: "trigger:idle:1" };
    const run = () =>
      resolveOrganizeTrigger(
        { reads, now: () => new Date("2026-08-02T04:05:00.000Z") },
        {
          workspace_id: world.workspaceId,
          participant_id: world.teacher.id,
          care_group_id: world.group.id,
        },
        request,
      );
    const first = await run();
    expect(first).toMatchObject({
      status: "evaluated",
      decision: {
        status: "cut",
        evidence: {
          trigger: "idle",
          policyRef: "nurture.institution-publication-policy@1.0.0",
          policyHead: 7,
          watermark: { source_sequence: 2 },
        },
        includedCaptureIds: expect.any(Array),
      },
    });
    await expect(run()).resolves.toEqual(first);
  });

  it("lets daily fallback ignore machine progress but fails closed without policy", async () => {
    const world = await seedGroup();
    const batch = await seedBatch(world);
    await prisma.nurtureCareCaptureBatch.update({
      where: { id: batch.id },
      data: { observedUserActivityAt: new Date("2026-08-02T08:30:00.000Z") },
    });
    const reads = new PrismaCareCaptureReadPort(prisma);
    const scope = {
      workspace_id: world.workspaceId,
      participant_id: world.teacher.id,
      care_group_id: world.group.id,
    };
    const request = {
      trigger: "daily_fallback" as const,
      trigger_request_id: "trigger:fallback:1",
    };
    await expect(
      resolveOrganizeTrigger(
        { reads, now: () => new Date("2026-08-02T08:35:00.000Z") },
        scope,
        request,
      ),
    ).resolves.toMatchObject({
      status: "evaluated",
      decision: { status: "invalid", reason_code: "policy_unavailable" },
    });

    await seedPublicationPolicy(world);
    const resolved = await resolveOrganizeTrigger(
      { reads, now: () => new Date("2026-08-02T08:35:00.000Z") },
      scope,
      request,
    );
    expect(resolved).toMatchObject({
      status: "evaluated",
      decision: {
        status: "cut",
        evidence: {
          trigger: "daily_fallback",
          observedUserActivityAt: "2026-08-02T08:30:00.000Z",
        },
      },
    });
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

describe("T-006 owner write: organize media composition", () => {
  const applyWithMedia = async (
    world: Group,
    batchId: string,
    mediaAssetId: string,
  ) =>
    prisma.$transaction((tx) =>
      new PrismaCareCaptureTransaction(tx).applyOrganizeCut({
        workspace_id: world.workspaceId,
        participant_id: world.teacher.id,
        command_request_id: randomUUID(),
        batch_id: batchId,
        expected_batch_version: 0,
        included_capture_ids: [],
        organizer_input_revision: `organizer:${randomUUID()}`,
        trigger_evidence: {
          trigger: "manual",
          policy_ref: "nurture.institution-publication-policy@1.0.0",
          policy_head: 7,
          time_zone: "Asia/Shanghai",
          quiescence_seconds: 60,
          observed_user_activity_at: new Date().toISOString(),
        },
        safety: {
          route: "ordinary",
          policy_ref: "nurture.content-safety@1.0.0",
          policy_head: 1,
          rule_revision: "rules:1",
          risk_codes: [],
        },
        watermark: { source_sequence: 0, cut_at: new Date().toISOString() },
        process: {
          process_key: `publish:${randomUUID()}`,
          state: "draft",
          data_class: "daily_care_log",
          purpose_key: "family_daily_care_update",
          content_digest: "sha256:organized",
          title_envelope: protectedContent.seal("Organized media"),
          media_asset_ids: [mediaAssetId],
          source_refs: [],
          authorizing_role_assignment_id: world.teacherRole.id,
          targets: [],
        },
      }),
    );

  it("stores the canonical composition shape and refuses an asset from another class", async () => {
    const world = await seedGroup();
    const batch = await prisma.nurtureCareCaptureBatch.create({
      data: { workspaceId: world.workspaceId, careGroupId: world.group.id, state: "collecting" },
    });
    const asset = await prisma.nurtureMediaAssetRef.create({
      data: {
        workspaceId: world.workspaceId,
        institutionId: world.institution.id,
        careGroupId: world.group.id,
        sourceKind: "class_album",
        storageRefPayload: { bucket: "media", key: randomUUID() },
        lifecycle: "ready",
        mediaRevision: 3,
      },
    });

    const applied = await applyWithMedia(world, batch.id, asset.id);
    const revision = await prisma.nurturePublishProcessRevision.findFirstOrThrow({
      where: {
        workspaceId: world.workspaceId,
        publishProcess: { captureBatchId: batch.id },
      },
    });
    expect(applied.process_revision).toBe(1);
    expect(revision.mediaCompositionPayload).toEqual({
      media: [{ mediaAssetId: asset.id, mediaRevision: 3 }],
    });

    const foreignBatch = await prisma.nurtureCareCaptureBatch.create({
      data: { workspaceId: world.workspaceId, careGroupId: world.group.id, state: "collecting" },
    });
    const foreignAsset = await prisma.nurtureMediaAssetRef.create({
      data: {
        workspaceId: world.workspaceId,
        institutionId: world.institution.id,
        careGroupId: world.otherGroup.id,
        sourceKind: "class_album",
        storageRefPayload: { bucket: "media", key: randomUUID() },
        lifecycle: "ready",
      },
    });
    await expect(applyWithMedia(world, foreignBatch.id, foreignAsset.id)).rejects.toThrow(
      /media asset unavailable/,
    );
    expect(
      await prisma.nurtureCareCaptureBatch.findUniqueOrThrow({ where: { id: foreignBatch.id } }),
    ).toMatchObject({ state: "collecting", aggregateVersion: 0 });
  });
});

describe("T-006 owner write: pre-release publish-process cancel", () => {
  const CANCELLED_AT = "2026-08-03T02:15:00.000Z";

  it("cancels under the expected head and records the instant it happened", async () => {
    const world = await seedGroup();
    const { process } = await seedProcess(world, { state: "draft" });
    const owner = new PrismaPublishProcessTransaction(prisma);

    const before = await owner.loadPublishProcessCancelFacts({
      workspace_id: world.workspaceId,
      participant_id: world.teacher.id,
      process_key: process.processKey,
    });
    expect(before).toMatchObject({
      process_state: "draft",
      committed_release_count: 0,
      authority: { role: "caregiver", role_scope_matches_source: true },
    });
    // Not yet cancelled, so the owner reports no instant at all rather than a
    // stand-in the repeat would later present as the cancel time.
    expect(before?.cancelled_at).toBeUndefined();

    const applied = await owner.applyPublishProcessCancel({
      workspace_id: world.workspaceId,
      participant_id: world.teacher.id,
      process_key: process.processKey,
      expected_process_version: before!.process_version,
      cancelled_at: CANCELLED_AT,
    });
    expect(applied.cancelled_at).toBe(CANCELLED_AT);

    const stored = await prisma.nurturePublishProcess.findUniqueOrThrow({
      where: { id: process.id },
    });
    expect(stored.state).toBe("cancelled");
    expect(stored.cancelledAt?.toISOString()).toBe(CANCELLED_AT);
    expect(stored.aggregateVersion).toBe(before!.process_version + 1);

    // The reread is what an idempotent repeat answers from.
    const after = await owner.loadPublishProcessCancelFacts({
      workspace_id: world.workspaceId,
      participant_id: world.teacher.id,
      process_key: process.processKey,
    });
    expect(after).toMatchObject({
      process_state: "cancelled",
      cancelled_at: CANCELLED_AT,
      process_version: before!.process_version + 1,
    });
  });

  it("matches zero rows on a stale head and on a process someone already cancelled", async () => {
    const world = await seedGroup();
    const { process } = await seedProcess(world, { state: "needs_review" });
    const owner = new PrismaPublishProcessTransaction(prisma);
    const facts = await owner.loadPublishProcessCancelFacts({
      workspace_id: world.workspaceId,
      participant_id: world.teacher.id,
      process_key: process.processKey,
    });

    await expect(
      owner.applyPublishProcessCancel({
        workspace_id: world.workspaceId,
        participant_id: world.teacher.id,
        process_key: process.processKey,
        expected_process_version: facts!.process_version + 1,
        cancelled_at: CANCELLED_AT,
      }),
    ).rejects.toThrow(/cancel version conflict/);
    expect(
      (await prisma.nurturePublishProcess.findUniqueOrThrow({ where: { id: process.id } })).state,
    ).toBe("needs_review");

    await owner.applyPublishProcessCancel({
      workspace_id: world.workspaceId,
      participant_id: world.teacher.id,
      process_key: process.processKey,
      expected_process_version: facts!.process_version,
      cancelled_at: CANCELLED_AT,
    });
    // A second cancel finds no cancellable state, so it cannot re-stamp the
    // instant the first one recorded.
    await expect(
      owner.applyPublishProcessCancel({
        workspace_id: world.workspaceId,
        participant_id: world.teacher.id,
        process_key: process.processKey,
        expected_process_version: facts!.process_version + 1,
        cancelled_at: "2026-08-03T09:00:00.000Z",
      }),
    ).rejects.toThrow(/cancel version conflict/);
    expect(
      (
        await prisma.nurturePublishProcess.findUniqueOrThrow({ where: { id: process.id } })
      ).cancelledAt?.toISOString(),
    ).toBe(CANCELLED_AT);
  });

  it("reports a released process and its committed releases to the cancel rule", async () => {
    const world = await seedGroup();
    const { process, revision } = await seedProcess(world, { state: "pending_release" });
    const careProcess = await prisma.nurtureChildCareProcess.create({
      data: {
        workspaceId: world.workspaceId,
        childId: (
          await prisma.nurtureChild.create({
            data: { workspaceId: world.workspaceId, displayName: "Child", status: "active" },
          })
        ).id,
        status: "active",
      },
    });
    const enrollment = await prisma.nurtureEnrollment.create({
      data: {
        workspaceId: world.workspaceId,
        childCareProcessId: careProcess.id,
        institutionId: world.institution.id,
        careGroupId: world.group.id,
        status: "active",
        participationPhase: "formal",
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
    const target = await prisma.nurturePublishProcessTarget.create({
      data: {
        workspaceId: world.workspaceId,
        publishProcessId: process.id,
        targetKey: `target:${randomUUID()}`,
        childCareProcessId: careProcess.id,
        enrollmentId: enrollment.id,
        familyRefKey: `${world.workspaceId}:${careProcess.id}`,
        grantId: grant.id,
      },
    });
    await prisma.nurturePublicationRelease.create({
      data: {
        workspaceId: world.workspaceId,
        publishProcessId: process.id,
        publishProcessTargetId: target.id,
        publishProcessRevisionId: revision.id,
        releasedByRoleAssignmentId: world.teacherRole.id,
        commandRequestIdHash: "b".repeat(64),
      },
    });

    const owner = new PrismaPublishProcessTransaction(prisma);
    const facts = await owner.loadPublishProcessCancelFacts({
      workspace_id: world.workspaceId,
      participant_id: world.teacher.id,
      process_key: process.processKey,
    });
    expect(facts?.committed_release_count).toBe(1);
  });

  it("refuses a caregiver of another class and one whose assignment is revoked", async () => {
    const world = await seedGroup();
    const { process } = await seedProcess(world, { state: "draft" });
    const owner = new PrismaPublishProcessTransaction(prisma);

    const outsider = await prisma.nurtureParticipant.create({
      data: {
        workspaceId: world.workspaceId,
        myChatUserId: `outsider:${randomUUID()}`,
        status: "active",
      },
    });
    await prisma.nurtureCareRoleAssignment.create({
      data: {
        workspaceId: world.workspaceId,
        participantId: outsider.id,
        role: "caregiver",
        scopeType: "care_group",
        scopeId: world.otherGroup.id,
        status: "active",
      },
    });
    // The authority question is asked of the process's OWN class, so a
    // sibling-class caregiver holds no reach there at all: the facts are
    // absent, not merely flagged. (The old shape answered with
    // role_scope_matches_source=false from whichever class came first —
    // the dual-class blind spot in mirror image.)
    expect(
      await owner.loadPublishProcessCancelFacts({
        workspace_id: world.workspaceId,
        participant_id: outsider.id,
        process_key: process.processKey,
      }),
    ).toBeNull();

    await prisma.nurtureCareRoleAssignment.update({
      where: { id: world.teacherRole.id },
      data: { status: "revoked" },
    });
    expect(
      await owner.loadPublishProcessCancelFacts({
        workspace_id: world.workspaceId,
        participant_id: world.teacher.id,
        process_key: process.processKey,
      }),
    ).toBeNull();
  });
});

describe("T-006 owner write: the edit lane", () => {
  const owner = () => new PrismaPublishProcessTransaction(prisma);

  const laneScope = async () => {
    const world = await seedGroup();
    const { process, revision } = await seedProcess(world, { state: "draft" });
    return { world, process, revision };
  };

  it("reports the hold as stored plus the instant the read was true at", async () => {
    const { world, process } = await laneScope();
    const before = Date.now();
    const facts = await owner().loadPublishEditHoldFacts({
      workspace_id: world.workspaceId,
      participant_id: world.teacher.id,
      process_key: process.processKey,
    });
    expect(facts?.current_hold).toBeUndefined();
    // Expiry is the rule's call, so the owner has to say when it looked.
    const readAt = Date.parse(facts!.read_at);
    expect(readAt).toBeGreaterThanOrEqual(before);
    expect(readAt).toBeLessThanOrEqual(Date.now());
  });

  it("takes a hold that can never carry the reserved absence version", async () => {
    const { world, process } = await laneScope();
    const expiresAt = new Date(Date.now() + 120_000).toISOString();
    await owner().applyPublishEditHoldGrant({
      workspace_id: world.workspaceId,
      participant_id: world.teacher.id,
      process_key: process.processKey,
      expected_hold_version: 0,
      expires_at: expiresAt,
    });
    const stored = await prisma.nurturePublishEditHold.findFirstOrThrow({
      where: { workspaceId: world.workspaceId, publishProcessId: process.id },
    });
    expect(stored.holderParticipantId).toBe(world.teacher.id);
    expect(stored.holderRoleAssignmentId).toBe(world.teacherRole.id);
    // 0 means "no hold". A real row must never be able to claim it.
    expect(stored.aggregateVersion).toBeGreaterThanOrEqual(1);
    await expect(
      prisma.nurturePublishEditHold.update({
        where: { id: stored.id },
        data: { aggregateVersion: 0 },
      }),
    ).rejects.toThrow(/ck_nurture_publish_edit_hold_version_floor/);
  });

  it("acquires over an expired hold by sweeping the dead row, not by colliding on it", async () => {
    const { world, process } = await laneScope();
    // The colleague's hold lapses without an explicit release — the ordinary
    // closed-laptop case the short TTL exists for. The row survives the lapse.
    await owner().applyPublishEditHoldGrant({
      workspace_id: world.workspaceId,
      participant_id: world.colleague.id,
      process_key: process.processKey,
      expected_hold_version: 0,
      expires_at: new Date(Date.now() + 60_000).toISOString(),
    });
    const stale = await prisma.nurturePublishEditHold.findFirstOrThrow({
      where: { workspaceId: world.workspaceId, publishProcessId: process.id },
    });
    // Real expiry is time passing after a valid grant. The window CHECK keeps
    // `expires_at > created_at`, so the lapse is simulated by shifting the
    // whole window into the past, not by bending expiry below creation.
    await prisma.nurturePublishEditHold.update({
      where: { id: stale.id },
      data: {
        createdAt: new Date(Date.now() - 300_000),
        expiresAt: new Date(Date.now() - 180_000),
      },
    });

    // Prepared against "no hold" (the query port filters expired rows), so the
    // frozen head is 0 — and the write must succeed, not retry forever on the
    // unique slot the dead row still occupies.
    const expiresAt = new Date(Date.now() + 120_000).toISOString();
    await owner().applyPublishEditHoldGrant({
      workspace_id: world.workspaceId,
      participant_id: world.teacher.id,
      process_key: process.processKey,
      expected_hold_version: 0,
      expires_at: expiresAt,
    });
    const holds = await prisma.nurturePublishEditHold.findMany({
      where: { workspaceId: world.workspaceId, publishProcessId: process.id },
    });
    expect(holds).toHaveLength(1);
    expect(holds[0]?.holderParticipantId).toBe(world.teacher.id);
    expect(holds[0]?.id).not.toBe(stale.id);
  });

  it("release with the absence head clears the expired row it was prepared against", async () => {
    const { world, process } = await laneScope();
    await owner().applyPublishEditHoldGrant({
      workspace_id: world.workspaceId,
      participant_id: world.colleague.id,
      process_key: process.processKey,
      expected_hold_version: 0,
      expires_at: new Date(Date.now() + 60_000).toISOString(),
    });
    const stale = await prisma.nurturePublishEditHold.findFirstOrThrow({
      where: { workspaceId: world.workspaceId, publishProcessId: process.id },
    });
    await prisma.nurturePublishEditHold.update({
      where: { id: stale.id },
      data: {
        createdAt: new Date(Date.now() - 300_000),
        expiresAt: new Date(Date.now() - 180_000),
      },
    });

    // A different teacher sweeps it: expiry-scoped, not holder-scoped.
    await owner().applyPublishEditHoldRelease({
      workspace_id: world.workspaceId,
      participant_id: world.teacher.id,
      process_key: process.processKey,
      expected_hold_version: 0,
    });
    expect(
      await prisma.nurturePublishEditHold.count({
        where: { workspaceId: world.workspaceId, publishProcessId: process.id },
      }),
    ).toBe(0);

    // But the absence head never sweeps a LIVE hold: with a live row present,
    // the same call has nothing expired to clear and must fail loudly.
    await owner().applyPublishEditHoldGrant({
      workspace_id: world.workspaceId,
      participant_id: world.colleague.id,
      process_key: process.processKey,
      expected_hold_version: 0,
      expires_at: new Date(Date.now() + 60_000).toISOString(),
    });
    await expect(
      owner().applyPublishEditHoldRelease({
        workspace_id: world.workspaceId,
        participant_id: world.teacher.id,
        process_key: process.processKey,
        expected_hold_version: 0,
      }),
    ).rejects.toThrow(/release version conflict/);
  });

  it("refuses to take a hold a colleague took in between", async () => {
    const { world, process } = await laneScope();
    const expiresAt = new Date(Date.now() + 120_000).toISOString();
    await owner().applyPublishEditHoldGrant({
      workspace_id: world.workspaceId,
      participant_id: world.colleague.id,
      process_key: process.processKey,
      expected_hold_version: 0,
      expires_at: expiresAt,
    });
    // Prepared against "no hold", so this is exactly the race the reserved
    // absence value exists to stop.
    await expect(
      owner().applyPublishEditHoldGrant({
        workspace_id: world.workspaceId,
        participant_id: world.teacher.id,
        process_key: process.processKey,
        expected_hold_version: 0,
        expires_at: expiresAt,
      }),
    ).rejects.toThrow();
    const stored = await prisma.nurturePublishEditHold.findFirstOrThrow({
      where: { workspaceId: world.workspaceId, publishProcessId: process.id },
    });
    expect(stored.holderParticipantId).toBe(world.colleague.id);
  });

  it("extends and releases only the holder's own hold, under its own version", async () => {
    const { world, process } = await laneScope();
    await owner().applyPublishEditHoldGrant({
      workspace_id: world.workspaceId,
      participant_id: world.teacher.id,
      process_key: process.processKey,
      expected_hold_version: 0,
      expires_at: new Date(Date.now() + 60_000).toISOString(),
    });
    const taken = await prisma.nurturePublishEditHold.findFirstOrThrow({
      where: { workspaceId: world.workspaceId, publishProcessId: process.id },
    });

    const extendedTo = new Date(Date.now() + 300_000).toISOString();
    await owner().applyPublishEditHoldGrant({
      workspace_id: world.workspaceId,
      participant_id: world.teacher.id,
      process_key: process.processKey,
      expected_hold_version: taken.aggregateVersion,
      expires_at: extendedTo,
    });
    const extended = await prisma.nurturePublishEditHold.findFirstOrThrow({
      where: { id: taken.id },
    });
    expect(extended.expiresAt.toISOString()).toBe(extendedTo);
    expect(extended.aggregateVersion).toBe(taken.aggregateVersion + 1);

    // A colleague cannot extend or release it, and a stale version cannot either.
    for (const attempt of [
      () =>
        owner().applyPublishEditHoldGrant({
          workspace_id: world.workspaceId,
          participant_id: world.colleague.id,
          process_key: process.processKey,
          expected_hold_version: extended.aggregateVersion,
          expires_at: extendedTo,
        }),
      () =>
        owner().applyPublishEditHoldRelease({
          workspace_id: world.workspaceId,
          participant_id: world.colleague.id,
          process_key: process.processKey,
          expected_hold_version: extended.aggregateVersion,
        }),
      () =>
        owner().applyPublishEditHoldRelease({
          workspace_id: world.workspaceId,
          participant_id: world.teacher.id,
          process_key: process.processKey,
          expected_hold_version: taken.aggregateVersion,
        }),
    ]) {
      await expect(attempt()).rejects.toThrow(/version conflict/);
    }
    expect(
      await prisma.nurturePublishEditHold.count({ where: { id: taken.id } }),
    ).toBe(1);

    await owner().applyPublishEditHoldRelease({
      workspace_id: world.workspaceId,
      participant_id: world.teacher.id,
      process_key: process.processKey,
      expected_hold_version: extended.aggregateVersion,
    });
    // Releasing deletes the coordination row and nothing else.
    expect(await prisma.nurturePublishEditHold.count({ where: { id: taken.id } })).toBe(0);
    expect(
      (await prisma.nurturePublishProcess.findUniqueOrThrow({ where: { id: process.id } })).state,
    ).toBe("draft");
  });

  it("appends a draft revision that carries the lineage and the command identity", async () => {
    const { world, process, revision } = await laneScope();
    await prisma.nurturePublishProcessRevision.update({
      where: { id: revision.id },
      data: { sourceRefsPayload: ["source-ref-1", "source-ref-2"] },
    });
    const applied = await owner().applyPublishProcessDraftSave({
      workspace_id: world.workspaceId,
      participant_id: world.teacher.id,
      process_key: process.processKey,
      command_request_id: "command:save-1",
      expected_draft_revision: 1,
      content: {
        title_envelope: protectedContent.seal("春游安排"),
        body_envelope: protectedContent.seal(JSON.stringify([{ text: "老师原文" }])),
        content_digest: "sha256:saved",
      },
    });
    expect(applied.revision).toBe(2);

    const stored = await prisma.nurturePublishProcessRevision.findFirstOrThrow({
      where: { workspaceId: world.workspaceId, publishProcessId: process.id, revision: 2 },
    });
    expect(stored.contentDigest).toBe("sha256:saved");
    // The assembler lineage is carried forward, never rewritten by an edit.
    expect(stored.organizerInputRevision).toBe(revision.organizerInputRevision);
    expect(stored.savedByRoleAssignmentId).toBe(world.teacherRole.id);
    // The provenance the process knows stays the process's.
    expect(stored.sourceRefsPayload).toEqual(["source-ref-1", "source-ref-2"]);
    // Only envelopes reach the owner: the plaintext is nowhere in the row.
    expect(JSON.stringify(stored)).not.toContain("春游安排");
    expect(protectedContent.unseal(stored.titleProtectionPayload as never)).toBe("春游安排");

    const advanced = await prisma.nurturePublishProcess.findUniqueOrThrow({
      where: { id: process.id },
    });
    expect(advanced.currentRevisionId).toBe(stored.id);

    // Revision 1 is still there: a save appends, it never rewrites.
    expect(
      await prisma.nurturePublishProcessRevision.count({
        where: { workspaceId: world.workspaceId, publishProcessId: process.id },
      }),
    ).toBe(2);

    // And the replay lookup finds it by the command that wrote it.
    const facts = await owner().loadPublishDraftFacts({
      workspace_id: world.workspaceId,
      participant_id: world.teacher.id,
      process_key: process.processKey,
      command_request_id: "command:save-1",
    });
    expect(facts?.replayed_revision).toMatchObject({
      revision: 2,
      content_digest: "sha256:saved",
    });
    expect(facts?.current_revision).toBe(2);
  });

  it("refuses a stale revision head and a second revision for one command", async () => {
    const { world, process } = await laneScope();
    const content = {
      title_envelope: protectedContent.seal("t"),
      body_envelope: protectedContent.seal("[]"),
      content_digest: "sha256:a",
    };
    await expect(
      owner().applyPublishProcessDraftSave({
        workspace_id: world.workspaceId,
        participant_id: world.teacher.id,
        process_key: process.processKey,
        command_request_id: "command:stale",
        expected_draft_revision: 5,
        content,
      }),
    ).rejects.toThrow(/revision conflict/);

    await owner().applyPublishProcessDraftSave({
      workspace_id: world.workspaceId,
      participant_id: world.teacher.id,
      process_key: process.processKey,
      command_request_id: "command:once",
      expected_draft_revision: 1,
      content,
    });
    // The revision-level unique is the second layer: even a caller that got
    // past every check above cannot append twice for one command.
    await expect(
      owner().applyPublishProcessDraftSave({
        workspace_id: world.workspaceId,
        participant_id: world.teacher.id,
        process_key: process.processKey,
        command_request_id: "command:once",
        expected_draft_revision: 2,
        content: { ...content, content_digest: "sha256:b" },
      }),
    ).rejects.toThrow();
    expect(
      await prisma.nurturePublishProcessRevision.count({
        where: { workspaceId: world.workspaceId, publishProcessId: process.id },
      }),
    ).toBe(2);
  });
});

describe("T-006 owner write: media detach", () => {
  it("appends a revision minus the one entry, carrying everything else forward", async () => {
    const { world, process, revision } = await (async () => {
      const world = await seedGroup();
      const seeded = await seedProcess(world, { state: "draft" });
      await prisma.nurturePublishProcessRevision.update({
        where: { id: seeded.revision.id },
        data: {
          mediaCompositionPayload: {
            media: [
              { mediaAssetId: "asset-1", mediaRevision: 2 },
              { mediaAssetId: "asset-2", mediaRevision: 1 },
            ],
          },
          sourceRefsPayload: ["source-ref-1"],
        },
      });
      return { world, ...seeded };
    })();
    const owner = new PrismaPublishProcessTransaction(prisma);

    const applied = await owner.applyPublishProcessMediaDetach({
      workspace_id: world.workspaceId,
      participant_id: world.teacher.id,
      process_key: process.processKey,
      command_request_id: "command:detach-1",
      expected_draft_revision: 1,
      media_asset_id: "asset-1",
    });
    expect(applied).toMatchObject({
      revision: 2,
      remaining_media_count: 1,
      detached_media_revision: 2,
    });

    const stored = await prisma.nurturePublishProcessRevision.findFirstOrThrow({
      where: { workspaceId: world.workspaceId, publishProcessId: process.id, revision: 2 },
    });
    // Only the composition changed; lineage, digest and provenance carry over.
    expect(stored.mediaCompositionPayload).toEqual({
      media: [{ mediaAssetId: "asset-2", mediaRevision: 1 }],
    });
    expect(stored.organizerInputRevision).toBe(revision.organizerInputRevision);
    expect(stored.contentDigest).toBe(revision.contentDigest);
    expect(stored.sourceRefsPayload).toEqual(["source-ref-1"]);
    expect(stored.commandRequestIdHash).toBe(publishDraftCommandIdentity("command:detach-1"));

    // The revision that composed the asset is history, not gone.
    expect(
      (
        await prisma.nurturePublishProcessRevision.findFirstOrThrow({
          where: { id: revision.id },
        })
      ).mediaCompositionPayload,
    ).toEqual({
      media: [
        { mediaAssetId: "asset-1", mediaRevision: 2 },
        { mediaAssetId: "asset-2", mediaRevision: 1 },
      ],
    });
  });

  it("refuses a stale revision head and an asset the composition does not carry", async () => {
    const world = await seedGroup();
    const { process, revision } = await seedProcess(world, { state: "draft" });
    await prisma.nurturePublishProcessRevision.update({
      where: { id: revision.id },
      data: {
        mediaCompositionPayload: { media: [{ mediaAssetId: "asset-1", mediaRevision: 1 }] },
      },
    });
    const owner = new PrismaPublishProcessTransaction(prisma);
    await expect(
      owner.applyPublishProcessMediaDetach({
        workspace_id: world.workspaceId,
        participant_id: world.teacher.id,
        process_key: process.processKey,
        command_request_id: "command:detach-stale",
        expected_draft_revision: 5,
        media_asset_id: "asset-1",
      }),
    ).rejects.toThrow(/revision conflict/);
    await expect(
      owner.applyPublishProcessMediaDetach({
        workspace_id: world.workspaceId,
        participant_id: world.teacher.id,
        process_key: process.processKey,
        command_request_id: "command:detach-missing",
        expected_draft_revision: 1,
        media_asset_id: "asset-9",
      }),
    ).rejects.toThrow(/media not in composition/);
    expect(
      await prisma.nurturePublishProcessRevision.count({
        where: { workspaceId: world.workspaceId, publishProcessId: process.id },
      }),
    ).toBe(1);
  });
});
