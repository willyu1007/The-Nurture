import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { createPrismaClient } from "../src/client.js";
import {
  PrismaNurtureCommandRepository,
  PrismaPublicationReleasePort,
  PrismaPublicationSafetyTransaction,
  publicationReleaseAttemptIdentity,
  publicationReleaseCommandIdentity,
} from "../src/index.js";
import { NurtureCommandRunner, type NurtureCommandSpec } from "@the-nurture/scenario";

// Owner-side proof for the release and post-release safety ports (G3-E
// prerequisite B2-4). `commitTargetRelease` is the only place in T-006 where
// three facts must land as one, so what has to hold here is atomicity under a
// mid-transaction failure, an exact replay that writes nothing, and a per-target
// identity that lets one attempt reach several targets.
const prisma = createPrismaClient();

afterAll(async () => {
  await prisma.$disconnect();
});

const SCHEDULE = {
  scheduledAt: new Date("2026-08-03T09:00:00.000Z"),
  notAfter: new Date("2026-08-03T11:00:00.000Z"),
  scheduleTimeZone: "Asia/Shanghai",
  schedulePolicyRef: "nurture.institution-publication-policy@1.0.0",
  schedulePolicyHead: 3,
};

const seedWorld = async () => {
  const workspaceId = randomUUID();
  const [teacher, guardian, outsider] = await Promise.all(
    ["teacher", "guardian", "outsider"].map((tag) =>
      prisma.nurtureParticipant.create({
        data: { workspaceId, myChatUserId: `${tag}:${workspaceId}`, status: "active" },
      }),
    ),
  );
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
      participantId: teacher!.id,
      role: "caregiver",
      scopeType: "care_group",
      scopeId: group.id,
      status: "active",
    },
  });
  await prisma.nurtureCareRoleAssignment.create({
    data: {
      workspaceId,
      participantId: outsider!.id,
      role: "caregiver",
      scopeType: "care_group",
      scopeId: otherGroup.id,
      status: "active",
    },
  });

  const children = await Promise.all(
    ["A", "B"].map(async (tag) => {
      const child = await prisma.nurtureChild.create({
        data: { workspaceId, displayName: `Child ${tag}`, status: "active" },
      });
      const process = await prisma.nurtureChildCareProcess.create({
        data: { workspaceId, childId: child.id, status: "active" },
      });
      const family = await prisma.nurtureFamily.create({
        data: {
          workspaceId,
          childCareProcessId: process.id,
          displayName: `Family ${tag}`,
          status: "active",
        },
      });
      const enrollment = await prisma.nurtureEnrollment.create({
        data: {
          workspaceId,
          childCareProcessId: process.id,
          institutionId: institution.id,
          careGroupId: group.id,
          status: "active",
        },
      });
      const grant = await prisma.nurtureChildLinkGrant.create({
        data: {
          workspaceId,
          childCareProcessId: process.id,
          enrollmentId: enrollment.id,
          grantedByParticipantId: guardian!.id,
          grantedToScopeType: "care_group",
          grantedToScopeId: group.id,
          directions: ["org_to_family"],
          dataClasses: ["child_growth_record"],
          purposes: ["child_growth_publication"],
          status: "active",
        },
      });
      return { tag, child, process, family, enrollment, grant };
    }),
  );

  return {
    workspaceId,
    teacher: teacher!,
    guardian: guardian!,
    outsider: outsider!,
    institution,
    group,
    otherGroup,
    teacherRole,
    children,
  };
};

type World = Awaited<ReturnType<typeof seedWorld>>;

const seedProcess = async (world: World, overrides: { schedule?: boolean } = {}) => {
  const process = await prisma.nurturePublishProcess.create({
    data: {
      workspaceId: world.workspaceId,
      careGroupId: world.group.id,
      processKey: `publish:${randomUUID()}`,
      state: "pending_release",
      dataClass: "child_growth_record",
      purposeKey: "child_growth_publication",
      authorizingRoleAssignmentId: world.teacherRole.id,
      ...(overrides.schedule === false ? {} : SCHEDULE),
    },
  });
  const revision = await prisma.nurturePublishProcessRevision.create({
    data: {
      workspaceId: world.workspaceId,
      publishProcessId: process.id,
      revision: 1,
      contentDigest: "sha256:content",
      organizerInputRevision: "organizer:1",
    },
  });
  await prisma.nurturePublishProcess.update({
    where: { id: process.id },
    data: { currentRevisionId: revision.id },
  });
  const targets = await Promise.all(
    world.children.map((entry) =>
      prisma.nurturePublishProcessTarget.create({
        data: {
          workspaceId: world.workspaceId,
          publishProcessId: process.id,
          targetKey: `target:child-${entry.tag}`,
          childCareProcessId: entry.process.id,
          enrollmentId: entry.enrollment.id,
          familyRefKey: entry.family.id,
          grantId: entry.grant.id,
        },
      }),
    ),
  );
  return { process, revision, targets };
};

const census = async (workspaceId: string) => ({
  releases: await prisma.nurturePublicationRelease.count({ where: { workspaceId } }),
  receipts: await prisma.nurtureChildLinkReceipt.count({ where: { workspaceId } }),
  executions: await prisma.nurtureCommandExecution.count({ where: { workspaceId } }),
});

describe("G3-D owner writes: atomic per-target release", () => {
  it("lands the release, its Receipt and the immutable CommandExecution together", async () => {
    const world = await seedWorld();
    const { process, targets } = await seedProcess(world);
    const port = new PrismaPublicationReleasePort(prisma);
    const commandRequestId = randomUUID();

    const result = await port.commitTargetRelease({
      workspace_id: world.workspaceId,
      participant_id: world.teacher.id,
      process_key: process.processKey,
      target_key: targets[0]!.targetKey,
      revision: 1,
      command_request_id: commandRequestId,
    });
    expect(result.status).toBe("committed");
    if (result.status !== "committed") return;

    expect(await census(world.workspaceId)).toEqual({
      releases: 1,
      receipts: 1,
      executions: 1,
    });
    const receipt = await prisma.nurtureChildLinkReceipt.findUniqueOrThrow({
      where: { id: result.receipt_ref },
    });
    // The T-005 receipt lifecycle CHECK governs this source type too.
    expect(receipt.sourceType).toBe("publication_release");
    expect(receipt.status).toBe("delivered");
    expect(receipt.dataClass).toBe("child_growth_record");
    expect(receipt.deliveredAt).not.toBeNull();

    const execution = await prisma.nurtureCommandExecution.findFirstOrThrow({
      where: { workspaceId: world.workspaceId },
    });
    expect(execution.commandKey).toBe("release_publish_process");
    expect(execution.commandRequestIdHash).toBe(
      publicationReleaseCommandIdentity(commandRequestId, targets[0]!.targetKey),
    );
    expect(execution.parentCommandRequestIdHash).toBe(
      publicationReleaseAttemptIdentity(commandRequestId),
    );
    expect(execution.outputRefs).toEqual([
      expect.objectContaining({ object_type: "publication_release", object_id: result.publication_ref }),
      expect.objectContaining({ object_type: "child_link_receipt", object_id: result.receipt_ref }),
    ]);
  });

  it("rolls back the Receipt and the release when the audit row cannot land", async () => {
    const world = await seedWorld();
    const { process, targets } = await seedProcess(world);
    const port = new PrismaPublicationReleasePort(prisma);
    const commandRequestId = randomUUID();

    // Occupy the exact committed identity this target would claim, so the audit
    // write inside the transaction fails after the other two have been issued.
    await prisma.nurtureCommandExecution.create({
      data: {
        workspaceId: world.workspaceId,
        commandRequestIdHash: publicationReleaseCommandIdentity(
          commandRequestId,
          targets[0]!.targetKey,
        ),
        originInvocationRequestIdHash: "0".repeat(64),
        commandKey: "unrelated_command",
        commandScope: world.group.id,
        commandContractVersion: 1,
        payloadHash: "0".repeat(64),
        businessActorRef: world.teacherRole.id,
        businessOutcome: "applied",
        outputRefs: [],
        handoffRequestSnapshotsPayload: [],
      },
    });

    const result = await port.commitTargetRelease({
      workspace_id: world.workspaceId,
      participant_id: world.teacher.id,
      process_key: process.processKey,
      target_key: targets[0]!.targetKey,
      revision: 1,
      command_request_id: commandRequestId,
    });
    expect(result.status).toBe("rejected");

    // Nothing partial survives: no publication the family could hold without a
    // receipt, and no receipt pointing at a release that never committed.
    expect(await census(world.workspaceId)).toEqual({
      releases: 0,
      receipts: 0,
      executions: 1,
    });
    const untouched = await prisma.nurturePublishProcess.findUniqueOrThrow({
      where: { id: process.id },
    });
    expect(untouched.state).toBe("pending_release");
    expect(untouched.frozenRevisionId).toBeNull();
  });

  it("answers an exact replay from the original commit without writing again", async () => {
    const world = await seedWorld();
    const { process, targets } = await seedProcess(world);
    const port = new PrismaPublicationReleasePort(prisma);
    const commandRequestId = randomUUID();
    const commit = () =>
      port.commitTargetRelease({
        workspace_id: world.workspaceId,
        participant_id: world.teacher.id,
        process_key: process.processKey,
        target_key: targets[0]!.targetKey,
        revision: 1,
        command_request_id: commandRequestId,
      });

    const first = await commit();
    const after = await census(world.workspaceId);
    const replay = await commit();

    expect(replay).toEqual(first);
    expect(await census(world.workspaceId)).toEqual(after);
  });

  it("refuses a different command reaching an already-released target", async () => {
    const world = await seedWorld();
    const { process, targets } = await seedProcess(world);
    const port = new PrismaPublicationReleasePort(prisma);
    await port.commitTargetRelease({
      workspace_id: world.workspaceId,
      participant_id: world.teacher.id,
      process_key: process.processKey,
      target_key: targets[0]!.targetKey,
      revision: 1,
      command_request_id: randomUUID(),
    });
    const second = await port.commitTargetRelease({
      workspace_id: world.workspaceId,
      participant_id: world.teacher.id,
      process_key: process.processKey,
      target_key: targets[0]!.targetKey,
      revision: 1,
      command_request_id: randomUUID(),
    });
    expect(second).toEqual({ status: "rejected", reason_code: "already_released" });
    expect((await census(world.workspaceId)).releases).toBe(1);
  });

  it("carries one attempt across several targets and freezes the revision once", async () => {
    const world = await seedWorld();
    const { process, targets, revision } = await seedProcess(world);
    const port = new PrismaPublicationReleasePort(prisma);
    const commandRequestId = randomUUID();

    for (const target of targets) {
      const result = await port.commitTargetRelease({
        workspace_id: world.workspaceId,
        participant_id: world.teacher.id,
        process_key: process.processKey,
        target_key: target.targetKey,
        revision: 1,
        command_request_id: commandRequestId,
      });
      expect(result.status).toBe("committed");
    }

    const executions = await prisma.nurtureCommandExecution.findMany({
      where: { workspaceId: world.workspaceId },
    });
    // Each target has its own immutable committed result, and all of them name
    // the same attempt as their parent.
    expect(executions).toHaveLength(2);
    expect(new Set(executions.map((row) => row.commandRequestIdHash)).size).toBe(2);
    expect(new Set(executions.map((row) => row.parentCommandRequestIdHash))).toEqual(
      new Set([publicationReleaseAttemptIdentity(commandRequestId)]),
    );

    const released = await prisma.nurturePublishProcess.findUniqueOrThrow({
      where: { id: process.id },
    });
    expect(released.state).toBe("released");
    // The first commit froze the shared revision; the second bound to it.
    expect(released.frozenRevisionId).toBe(revision.id);
  });

  it("refuses a revision the process does not have, before writing anything", async () => {
    const world = await seedWorld();
    const { process, targets } = await seedProcess(world);
    const port = new PrismaPublicationReleasePort(prisma);
    const result = await port.commitTargetRelease({
      workspace_id: world.workspaceId,
      participant_id: world.teacher.id,
      process_key: process.processKey,
      target_key: targets[0]!.targetKey,
      revision: 7,
      command_request_id: randomUUID(),
    });
    expect(result).toEqual({ status: "rejected", reason_code: "revision_unavailable" });
    expect(await census(world.workspaceId)).toEqual({
      releases: 0,
      receipts: 0,
      executions: 0,
    });
  });

  it("refuses a target whose Grant was revoked after eligibility was read", async () => {
    const world = await seedWorld();
    const { process, targets } = await seedProcess(world);
    const port = new PrismaPublicationReleasePort(prisma);
    const commandRequestId = randomUUID();

    // First target commits under a live Grant.
    const first = await port.commitTargetRelease({
      workspace_id: world.workspaceId,
      participant_id: world.teacher.id,
      process_key: process.processKey,
      target_key: targets[0]!.targetKey,
      revision: 1,
      command_request_id: commandRequestId,
    });
    expect(first.status).toBe("committed");

    // The second family withdraws consent mid fan-out. Eligibility was read
    // before the attempt began, so only a re-check inside the transaction can
    // stop this target.
    await prisma.nurtureChildLinkGrant.update({
      where: { id: world.children[1]!.grant.id },
      data: {
        status: "revoked",
        revokedAt: new Date("2026-08-02T05:00:00.000Z"),
        revokedByParticipantId: world.guardian.id,
      },
    });

    const second = await port.commitTargetRelease({
      workspace_id: world.workspaceId,
      participant_id: world.teacher.id,
      process_key: process.processKey,
      target_key: targets[1]!.targetKey,
      revision: 1,
      command_request_id: commandRequestId,
    });
    expect(second).toEqual({ status: "rejected", reason_code: "grant_not_allowed" });

    // No publication and, crucially, no delivered Receipt under withdrawn consent.
    expect(await census(world.workspaceId)).toEqual({
      releases: 1,
      receipts: 1,
      executions: 1,
    });
  });

  it("refuses a target whose Enrollment ended after eligibility was read", async () => {
    const world = await seedWorld();
    const { process, targets } = await seedProcess(world);
    await prisma.nurtureEnrollment.update({
      where: { id: world.children[0]!.enrollment.id },
      data: { status: "ended" },
    });
    const port = new PrismaPublicationReleasePort(prisma);
    const result = await port.commitTargetRelease({
      workspace_id: world.workspaceId,
      participant_id: world.teacher.id,
      process_key: process.processKey,
      target_key: targets[0]!.targetKey,
      revision: 1,
      command_request_id: randomUUID(),
    });
    expect(result).toEqual({ status: "rejected", reason_code: "enrollment_inactive" });
    expect((await census(world.workspaceId)).releases).toBe(0);
  });

  it("refuses a caregiver of another class", async () => {
    const world = await seedWorld();
    const { process, targets } = await seedProcess(world);
    const port = new PrismaPublicationReleasePort(prisma);
    const result = await port.commitTargetRelease({
      workspace_id: world.workspaceId,
      participant_id: world.outsider.id,
      process_key: process.processKey,
      target_key: targets[0]!.targetKey,
      revision: 1,
      command_request_id: randomUUID(),
    });
    expect(result).toEqual({ status: "rejected", reason_code: "target_unavailable" });
    expect((await census(world.workspaceId)).releases).toBe(0);
  });
});

describe("G3-D owner reads: release facts", () => {
  it("reports per-target eligibility from the current Grant, not from the target row", async () => {
    const world = await seedWorld();
    const { process } = await seedProcess(world);
    const port = new PrismaPublicationReleasePort(prisma);

    const before = await port.loadReleaseFacts({
      workspace_id: world.workspaceId,
      participant_id: world.teacher.id,
      process_key: process.processKey,
    });
    expect(before?.targets.every((target) => target.grant_allows)).toBe(true);
    expect(before?.targets.every((target) => target.data_class_allowed)).toBe(true);
    expect(before?.authorizing_role_current).toBe(true);

    await prisma.nurtureChildLinkGrant.update({
      where: { id: world.children[0]!.grant.id },
      data: {
        status: "revoked",
        revokedAt: new Date("2026-08-02T05:00:00.000Z"),
        revokedByParticipantId: world.guardian.id,
      },
    });
    const after = await port.loadReleaseFacts({
      workspace_id: world.workspaceId,
      participant_id: world.teacher.id,
      process_key: process.processKey,
    });
    const revoked = after?.targets.find(
      (target) => target.child_care_process_id === world.children[0]!.process.id,
    );
    expect(revoked?.grant_allows).toBe(false);
    // The other target is untouched: one revoked Grant blocks its own target.
    expect(after?.targets.filter((target) => target.grant_allows)).toHaveLength(1);
  });

  it("reports an unresolved schedule as unresolved, not as a missing target", async () => {
    const world = await seedWorld();
    const { process } = await seedProcess(world, { schedule: false });
    const port = new PrismaPublicationReleasePort(prisma);
    const read = () =>
      port.loadReleaseFacts({
        workspace_id: world.workspaceId,
        participant_id: world.teacher.id,
        process_key: process.processKey,
      });

    // The process exists and the actor may act on it; only the window is
    // missing. Answering `null` would classify that as "no such target".
    const unscheduled = await read();
    expect(unscheduled).not.toBeNull();
    expect(unscheduled?.schedule).toBeNull();

    // A half-recorded window is now impossible rather than merely refused: the
    // owner cannot store one, so the port's guard is defence in depth behind a
    // constraint rather than the only thing standing between a partial
    // resolution and a release.
    await expect(
      prisma.nurturePublishProcess.update({
        where: { id: process.id },
        data: { scheduledAt: SCHEDULE.scheduledAt, notAfter: SCHEDULE.notAfter },
      }),
    ).rejects.toThrow(/ck_nurture_publish_process_state/);

    await prisma.nurturePublishProcess.update({
      where: { id: process.id },
      data: SCHEDULE,
    });
    expect((await read())?.schedule?.timeZone).toBe("Asia/Shanghai");
  });

  it("reports a lapsed authorizing role as no longer current", async () => {
    const world = await seedWorld();
    const { process } = await seedProcess(world);
    await prisma.nurtureCareRoleAssignment.update({
      where: { id: world.teacherRole.id },
      data: { endsAt: new Date("2026-08-01T00:00:00.000Z") },
    });
    const port = new PrismaPublicationReleasePort(prisma);
    // The reader itself now has no reach either, which is the same fact seen
    // from the actor's side.
    expect(
      await port.loadReleaseFacts({
        workspace_id: world.workspaceId,
        participant_id: world.teacher.id,
        process_key: process.processKey,
      }),
    ).toBeNull();
  });

  it("surfaces an already committed target so a retry reconciles instead of duplicating", async () => {
    const world = await seedWorld();
    const { process, targets } = await seedProcess(world);
    const port = new PrismaPublicationReleasePort(prisma);
    const committed = await port.commitTargetRelease({
      workspace_id: world.workspaceId,
      participant_id: world.teacher.id,
      process_key: process.processKey,
      target_key: targets[0]!.targetKey,
      revision: 1,
      command_request_id: randomUUID(),
    });
    expect(committed.status).toBe("committed");
    if (committed.status !== "committed") return;

    const facts = await port.loadReleaseFacts({
      workspace_id: world.workspaceId,
      participant_id: world.teacher.id,
      process_key: process.processKey,
    });
    const first = facts?.targets.find((target) => target.target_key === targets[0]!.targetKey);
    expect(first?.already_committed).toEqual({
      publication_ref: committed.publication_ref,
      receipt_ref: committed.receipt_ref,
    });
    expect(
      facts?.targets.find((target) => target.target_key === targets[1]!.targetKey)
        ?.already_committed,
    ).toBeUndefined();
    // The frozen revision is what the remaining target must bind to.
    expect(facts?.frozen_revision).toBe(1);
  });
});

describe("G3-D owner reads: post-release safety", () => {
  it("lists every committed publication whatever its current visibility", async () => {
    const world = await seedWorld();
    const { process, targets } = await seedProcess(world);
    const port = new PrismaPublicationReleasePort(prisma);
    for (const target of targets) {
      await port.commitTargetRelease({
        workspace_id: world.workspaceId,
        participant_id: world.teacher.id,
        process_key: process.processKey,
        target_key: target.targetKey,
        revision: 1,
        command_request_id: randomUUID(),
      });
    }
    const releases = await prisma.nurturePublicationRelease.findMany({
      where: { workspaceId: world.workspaceId },
      orderBy: { committedAt: "asc" },
    });
    await prisma.nurturePublicationRelease.update({
      where: { id: releases[0]!.id },
      data: { visibility: "redacted" },
    });

    const facts = await port.loadPublicationSafetyFacts({
      workspace_id: world.workspaceId,
      participant_id: world.teacher.id,
      process_key: process.processKey,
    });
    expect(facts?.publications).toHaveLength(2);
    // A redacted publication stays addressable: post-release safety has no
    // expiry window and never deletes the Receipt or the audit trail.
    expect(facts?.publications.map((entry) => entry.visibility).sort()).toEqual([
      "redacted",
      "visible",
    ]);
    expect(facts?.publications.every((entry) => entry.receipt_id !== "")).toBe(true);
    expect(facts?.publications.every((entry) => entry.release_revision === 1)).toBe(true);
  });

  it("resolves a process key only while the actor still reaches its class", async () => {
    const world = await seedWorld();
    const { process } = await seedProcess(world);
    const port = new PrismaPublicationReleasePort(prisma);
    expect(
      await port.listSafetyProcessKeys({
        workspace_id: world.workspaceId,
        participant_id: world.teacher.id,
      }),
    ).toEqual([process.processKey]);
    expect(
      await port.listReleasableProcessKeys({
        workspace_id: world.workspaceId,
        participant_id: world.outsider.id,
      }),
    ).toEqual([]);
    // A teacher of another class can never name this process key — sealed refs
    // resolve only against their own list. Asked directly, the authority
    // question is asked of the process's OWN class, where the outsider holds
    // nothing: the facts are absent entirely.
    const foreign = await port.loadPublicationSafetyFacts({
      workspace_id: world.workspaceId,
      participant_id: world.outsider.id,
      process_key: process.processKey,
    });
    expect(foreign).toBeNull();
  });

  it("reports the composed media revision against the asset's current one", async () => {
    const world = await seedWorld();
    const { process, revision } = await seedProcess(world);
    const asset = await prisma.nurtureMediaAssetRef.create({
      data: {
        workspaceId: world.workspaceId,
        institutionId: world.institution.id,
        careGroupId: world.group.id,
        sourceKind: "class_album",
        storageRefPayload: { bucket: "media", key: randomUUID() },
        lifecycle: "ready",
      },
    });
    await prisma.nurturePublishProcessRevision.update({
      where: { id: revision.id },
      data: { mediaCompositionPayload: { media: [{ mediaAssetId: asset.id, mediaRevision: 1 }] } },
    });
    const port = new PrismaPublicationReleasePort(prisma);

    const before = await port.loadReleaseFacts({
      workspace_id: world.workspaceId,
      participant_id: world.teacher.id,
      process_key: process.processKey,
    });
    expect(before?.media).toEqual([
      {
        media_asset_id: asset.id,
        media_revision: 1,
        current_media_revision: 1,
        lifecycle: "ready",
        visible_children: [],
      },
    ]);

    // A new original is a new revision. The draft still names the one it
    // composed, so the drift is visible instead of silently republished.
    await prisma.nurtureMediaAssetRef.update({
      where: { id: asset.id },
      data: { mediaRevision: 2 },
    });
    const after = await port.loadReleaseFacts({
      workspace_id: world.workspaceId,
      participant_id: world.teacher.id,
      process_key: process.processKey,
    });
    expect(after?.media[0]?.media_revision).toBe(1);
    expect(after?.media[0]?.current_media_revision).toBe(2);
  });
});

describe("T-006 owner write: post-release safety", () => {
  const owner = () => new PrismaPublicationSafetyTransaction(prisma);

  /** One committed release, landed by the real per-target release port. */
  const seedCommittedRelease = async (world: World) => {
    const { process, targets } = await seedProcess(world);
    const port = new PrismaPublicationReleasePort(prisma);
    const result = await port.commitTargetRelease({
      workspace_id: world.workspaceId,
      participant_id: world.teacher.id,
      process_key: process.processKey,
      target_key: targets[0]!.targetKey,
      revision: 1,
      command_request_id: randomUUID(),
    });
    if (result.status !== "committed") {
      throw new Error(`seedCommittedRelease failed: ${JSON.stringify(result)}`);
    }
    const release = await prisma.nurturePublicationRelease.findFirstOrThrow({
      where: { workspaceId: world.workspaceId, publishProcessId: process.id },
    });
    return { process, release };
  };

  it("rolls the visibility update back when the finalize step throws mid-command", async () => {
    // The safety trio splits its write: apply flips visibility, finalize
    // appends the command-naming lineage. Atomicity rests entirely on the
    // wiring — the TransactionClient construction and afterExecutionCreated
    // running inside the same $transaction — so this pins it against the real
    // database: a refactor that moves either outside the transaction turns a
    // definite rollback into a committed removal no stored fact can explain.
    const world = await seedWorld();
    const released = await seedCommittedRelease(world);
    const probeSpec: NurtureCommandSpec<{ publication_id: string }> = {
      command_key: "probe_finalize_atomicity",
      command_scope: "probe",
      contract_version: 1,
      canonicalize: (input) => input,
      checkPreconditions: async () => ({ status: "ready" }),
      apply: async (transaction, input) => {
        await transaction.publicationSafety!.applyPublicationVisibilityUpdate({
          workspace_id: world.workspaceId,
          participant_id: world.teacher.id,
          updates: [
            {
              publication_id: input.publication_id,
              from_visibility: ["visible"],
              to_visibility: "removed",
            },
          ],
        });
        return {
          output_refs: [
            {
              schema_version: 1,
              namespace: "nurture",
              object_type: "probe_output",
              object_id: input.publication_id,
              version: 1,
            },
          ],
        };
      },
      afterExecutionCreated: async () => {
        throw new Error("finalize failed after the visibility update");
      },
    };
    const result = await new NurtureCommandRunner(
      new PrismaNurtureCommandRepository(prisma),
    ).execute({
      workspace_id: world.workspaceId,
      invocation_request_id: "invocation:probe-finalize-1",
      command_request_id: "command:probe-finalize-1",
      business_actor_ref: world.teacher.id,
      payload: { publication_id: released.release.id },
      spec: probeSpec,
    });
    expect(result).toEqual({
      status: "not_committed",
      decision: "technical_error",
      reason_code: "command_execution_failed",
    });
    // Everything rolled back together: the visibility, the execution row.
    expect(
      (
        await prisma.nurturePublicationRelease.findUniqueOrThrow({
          where: { id: released.release.id },
        })
      ).visibility,
    ).toBe("visible");
    expect(
      await prisma.nurtureCommandExecution.count({
        where: { workspaceId: world.workspaceId, commandKey: "probe_finalize_atomicity" },
      }),
    ).toBe(0);
  });

  it("moves visibility monotonically and refuses a transition the lineage already passed", async () => {
    const world = await seedWorld();
    const released = await seedCommittedRelease(world);
    await owner().applyPublicationVisibilityUpdate({
      workspace_id: world.workspaceId,
      participant_id: world.teacher.id,
      updates: [
        {
          publication_id: released.release.id,
          from_visibility: ["visible"],
          to_visibility: "removed",
        },
      ],
    });
    expect(
      (
        await prisma.nurturePublicationRelease.findUniqueOrThrow({
          where: { id: released.release.id },
        })
      ).visibility,
    ).toBe("removed");

    // Removing again finds nothing visible: the FROM set is the guard.
    await expect(
      owner().applyPublicationVisibilityUpdate({
        workspace_id: world.workspaceId,
        participant_id: world.teacher.id,
        updates: [
          {
            publication_id: released.release.id,
            from_visibility: ["visible"],
            to_visibility: "removed",
          },
        ],
      }),
    ).rejects.toThrow(/visibility transition conflict/);

    // But redaction still covers a removed release.
    await owner().applyPublicationVisibilityUpdate({
      workspace_id: world.workspaceId,
      participant_id: world.teacher.id,
      updates: [
        {
          publication_id: released.release.id,
          from_visibility: ["visible", "removed"],
          to_visibility: "redacted",
        },
      ],
    });
    expect(
      (
        await prisma.nurturePublicationRelease.findUniqueOrThrow({
          where: { id: released.release.id },
        })
      ).visibility,
    ).toBe("redacted");
  });

  it("appends lineage rows that name the command execution, under pre-generated ids", async () => {
    const world = await seedWorld();
    const released = await seedCommittedRelease(world);
    const execution = await prisma.nurtureCommandExecution.create({
      data: {
        workspaceId: world.workspaceId,
        commandRequestIdHash: "e".repeat(64),
        originInvocationRequestIdHash: "f".repeat(64),
        requestIdentityHashVersion: 1,
        commandKey: "remove_publication_target_visibility",
        commandScope: "publication_remove_target",
        commandContractVersion: 1,
        payloadHash: "1".repeat(64),
        payloadCanonicalizationVersion: 1,
        businessActorRef: world.teacher.id,
        targetRefs: [],
        businessOutcome: "applied",
        outputRefs: [],
        handoffSnapshotSchemaVersion: 1,
        handoffRequestSnapshotsPayload: [],
      },
    });

    const eventId = randomUUID();
    await owner().appendPublicationVisibilityEvents({
      workspace_id: world.workspaceId,
      participant_id: world.teacher.id,
      command_execution_id: execution.id,
      actor_role_assignment_id: world.teacherRole.id,
      events: [
        {
          event_id: eventId,
          publication_id: released.release.id,
          kind: "target_removal",
          reason_key: "family_request",
          source_release_revision: 1,
          occurred_at: "2026-08-04T08:00:00.000Z",
        },
      ],
    });
    const stored = await prisma.nurturePublicationVisibilityEvent.findUniqueOrThrow({
      where: { id: eventId },
    });
    expect(stored.commandExecutionId).toBe(execution.id);
    expect(stored.actorRoleAssignmentId).toBe(world.teacherRole.id);
    expect(stored.occurredAt.toISOString()).toBe("2026-08-04T08:00:00.000Z");

    // The lineage must name a real execution: a made-up id fails the FK.
    await expect(
      owner().appendPublicationVisibilityEvents({
        workspace_id: world.workspaceId,
        participant_id: world.teacher.id,
        command_execution_id: randomUUID(),
        actor_role_assignment_id: world.teacherRole.id,
        events: [
          {
            event_id: randomUUID(),
            publication_id: released.release.id,
            kind: "redaction",
            reason_key: "policy_requirement",
            source_release_revision: 1,
            occurred_at: "2026-08-04T08:05:00.000Z",
          },
        ],
      }),
    ).rejects.toThrow();
  });
});
