import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { issueBoardOpaqueRef } from "@the-nurture/scenario/harness";
import { createPrismaClient } from "../src/client.js";
import { createPrismaTeacherMediaAssociationBinding } from "../src/index.js";

// W9-3 owner-side proof: the four association operations over real G3-C1
// attribution rows and the generic command ledger on a disposable database.
const prisma = createPrismaClient();
const INTEGRITY_KEY = "w9-teacher-media-association-integration";

afterAll(async () => {
  await prisma.$disconnect();
});

const ref = (workspaceId: string, kind: string, id: string) =>
  issueBoardOpaqueRef(INTEGRITY_KEY, { workspace_id: workspaceId }, kind, id);

const seedWorld = async () => {
  const workspaceId = randomUUID();
  const teacher = await prisma.nurtureParticipant.create({
    data: {
      workspaceId,
      myChatUserId: `teacher:${workspaceId}`,
      displayName: "林老师",
      status: "active",
    },
  });
  const colleague = await prisma.nurtureParticipant.create({
    data: {
      workspaceId,
      myChatUserId: `colleague:${workspaceId}`,
      displayName: "吴老师",
      status: "active",
    },
  });
  const institution = await prisma.nurtureCareInstitution.create({
    data: { workspaceId, displayName: "Care Center", status: "active" },
  });
  const group = await prisma.nurtureCareGroup.create({
    data: { workspaceId, institutionId: institution.id, name: "向日葵班", status: "active" },
  });
  const teacherRole = await prisma.nurtureCareRoleAssignment.create({
    data: {
      workspaceId,
      participantId: teacher.id,
      role: "lead_caregiver",
      scopeType: "care_group",
      scopeId: group.id,
      status: "active",
      displayLabel: "林老师",
    },
  });
  await prisma.nurtureCareRoleAssignment.create({
    data: {
      workspaceId,
      participantId: colleague.id,
      role: "caregiver",
      scopeType: "care_group",
      scopeId: group.id,
      status: "active",
      displayLabel: "吴老师",
    },
  });
  const child = await prisma.nurtureChild.create({
    data: { workspaceId, displayName: "小明", status: "active" },
  });
  const childProcess = await prisma.nurtureChildCareProcess.create({
    data: { workspaceId, childId: child.id, status: "active" },
  });
  await prisma.nurtureFamily.create({
    data: {
      workspaceId,
      childCareProcessId: childProcess.id,
      displayName: "小明家庭",
      status: "active",
    },
  });
  const enrollment = await prisma.nurtureEnrollment.create({
    data: {
      workspaceId,
      childCareProcessId: childProcess.id,
      institutionId: institution.id,
      careGroupId: group.id,
      status: "active",
      participationPhase: "formal",
    },
  });
  const asset = await prisma.nurtureMediaAssetRef.create({
    data: {
      workspaceId,
      institutionId: institution.id,
      careGroupId: group.id,
      uploadedByRoleAssignmentId: teacherRole.id,
      sourceKind: "class_album",
      storageRefPayload: { bucket: "media", key: randomUUID() },
      safeTitle: "户外活动照片",
      capturedAt: new Date("2026-08-14T08:30:00.000Z"),
      lifecycle: "ready",
    },
  });
  await prisma.nurtureChildMediaAttribution.create({
    data: {
      workspaceId,
      mediaAssetRefId: asset.id,
      childCareProcessId: childProcess.id,
      source: "history_match",
      state: "candidate",
      attributionRevision: 1,
    },
  });
  return {
    workspaceId,
    teacher,
    colleague,
    group,
    teacherRole,
    child,
    childProcess,
    enrollment,
    asset,
  };
};

type World = Awaited<ReturnType<typeof seedWorld>>;

const bindingFor = () =>
  createPrismaTeacherMediaAssociationBinding({
    prisma,
    integrityKey: INTEGRITY_KEY,
  });

const requestFor = (world: World, hostRequestId: string) => ({
  workspace_id: world.workspaceId,
  my_chat_user_id: world.teacher.myChatUserId,
  host_request_id: hostRequestId,
  context_ref: `context:teacher:${world.workspaceId}`,
  class_ref: ref(world.workspaceId, "care_group", world.group.id),
});

const authorityFor = async (
  binding: ReturnType<typeof bindingFor>,
  world: World,
  operation:
    | "unassociated_query"
    | "association_query"
    | "associate_exchange"
    | "discard_exchange",
) => {
  const decision = await binding.authorityResolver.resolve({
    ...requestFor(world, `authority:${operation}`),
    operation,
  });
  expect(decision.status).toBe("resolved");
  return (decision as unknown as { owner_resolution: never }).owner_resolution;
};

describe("W9 teacher media-association owner on real Prisma facts", () => {
  it("lists the unassociated queue with children options over live rows", async () => {
    const world = await seedWorld();
    const binding = bindingFor();
    const response = (await binding.owner.unassociated({
      request: requestFor(world, "host-unassoc-1"),
      authority: await authorityFor(binding, world, "unassociated_query"),
    })) as Record<string, unknown>;
    expect(response.status).toBe("ready");
    expect(response.unassociated_count).toBe(1);
    const assets = response.assets as Array<Record<string, unknown>>;
    expect(assets[0]).toMatchObject({
      media_ref: ref(world.workspaceId, "media_asset", world.asset.id),
      safe_title: "户外活动照片",
      lifecycle: "ready",
      media_revision: 1,
      candidate_count: 1,
      confirmed_count: 0,
    });
    const children = response.children as Array<Record<string, unknown>>;
    expect(children[0]).toMatchObject({
      child_ref: ref(world.workspaceId, "child_care_process", world.childProcess.id),
      child_safe_label: "小明",
    });
  });

  it("confirms an attribution once, replays it, and refuses cross-actor reuse", async () => {
    const world = await seedWorld();
    const binding = bindingFor();
    const mediaRef = ref(world.workspaceId, "media_asset", world.asset.id);
    const childRef = ref(
      world.workspaceId,
      "child_care_process",
      world.childProcess.id,
    );
    const request = {
      ...requestFor(world, "host-associate-1"),
      media_ref: mediaRef,
      child_ref: childRef,
      command_request_id: `command-associate-${world.workspaceId}`,
      decision: "confirm" as const,
      expected_attribution_revision: 1,
      expected_media_revision: 1,
    };
    const authority = await authorityFor(binding, world, "associate_exchange");
    const first = (await binding.owner.associate({
      request,
      authority,
    })) as Record<string, unknown>;
    expect(first).toMatchObject({
      status: "committed",
      executed: "executed",
      disposition: "applied",
      state: "confirmed",
      media_ref: mediaRef,
      child_ref: childRef,
    });

    const replay = (await binding.owner.associate({
      request: { ...request, host_request_id: "host-associate-2" },
      authority,
    })) as Record<string, unknown>;
    expect(replay).toMatchObject({
      status: "committed",
      executed: "replayed",
      state: "confirmed",
      decided_at: first.decided_at,
    });

    const association = (await binding.owner.association({
      request: { ...requestFor(world, "host-assoc-read-1"), media_ref: mediaRef },
      authority: await authorityFor(binding, world, "association_query"),
    })) as Record<string, unknown>;
    const attributions = association.attributions as Array<Record<string, unknown>>;
    expect(attributions.some((entry) => entry.state === "confirmed")).toBe(true);

    // Same command identity from another authorized teacher is denied.
    const colleagueBinding = bindingFor();
    const colleagueDecision = await colleagueBinding.authorityResolver.resolve({
      ...request,
      my_chat_user_id: world.colleague.myChatUserId,
      operation: "associate_exchange",
    });
    expect(colleagueDecision.status).toBe("resolved");
    const crossActor = (await colleagueBinding.owner.associate({
      request: {
        ...request,
        my_chat_user_id: world.colleague.myChatUserId,
        host_request_id: "host-associate-3",
      },
      authority: (colleagueDecision as unknown as { owner_resolution: never })
        .owner_resolution,
    })) as Record<string, unknown>;
    expect(crossActor).toMatchObject({
      status: "not_committed",
      reason_code: "command_payload_conflict",
    });

    // The confirmed asset leaves the unassociated queue.
    const queue = (await binding.owner.unassociated({
      request: requestFor(world, "host-unassoc-2"),
      authority: await authorityFor(binding, world, "unassociated_query"),
    })) as Record<string, unknown>;
    expect(queue.unassociated_count).toBe(0);
  });

  it("refuses a moved media revision with the frozen reason", async () => {
    const world = await seedWorld();
    const binding = bindingFor();
    const request = {
      ...requestFor(world, "host-associate-4"),
      media_ref: ref(world.workspaceId, "media_asset", world.asset.id),
      child_ref: ref(
        world.workspaceId,
        "child_care_process",
        world.childProcess.id,
      ),
      command_request_id: `command-associate-moved-${world.workspaceId}`,
      decision: "confirm" as const,
      expected_attribution_revision: 1,
      expected_media_revision: 99,
    };
    const response = (await binding.owner.associate({
      request,
      authority: await authorityFor(binding, world, "associate_exchange"),
    })) as Record<string, unknown>;
    expect(response).toMatchObject({
      status: "not_committed",
      reason_code: "media_revision_moved",
    });
  });

  it("discards an asset once, replays the recorded instant, then refuses terminal reuse", async () => {
    const world = await seedWorld();
    const binding = bindingFor();
    const mediaRef = ref(world.workspaceId, "media_asset", world.asset.id);
    const request = {
      ...requestFor(world, "host-discard-1"),
      media_ref: mediaRef,
      command_request_id: `command-discard-${world.workspaceId}`,
    };
    const authority = await authorityFor(binding, world, "discard_exchange");
    const first = (await binding.owner.discard({
      request,
      authority,
    })) as Record<string, unknown>;
    expect(first).toMatchObject({
      status: "committed",
      executed: "executed",
      media_ref: mediaRef,
      affected_draft_count: 0,
    });
    expect(typeof first.discarded_at).toBe("string");

    const replay = (await binding.owner.discard({
      request: { ...request, host_request_id: "host-discard-2" },
      authority,
    })) as Record<string, unknown>;
    expect(replay).toMatchObject({
      status: "committed",
      executed: "replayed",
      discarded_at: first.discarded_at,
    });

    const fresh = (await binding.owner.discard({
      request: {
        ...request,
        host_request_id: "host-discard-3",
        command_request_id: `command-discard-2-${world.workspaceId}`,
      },
      authority,
    })) as Record<string, unknown>;
    expect(fresh).toMatchObject({
      status: "not_committed",
      reason_code: "media_already_terminal",
    });

    const row = await prisma.nurtureMediaAssetRef.findFirst({
      where: { id: world.asset.id },
    });
    expect(row?.lifecycle).toBe("discarded");
  });

  it("masks foreign classes and foreign media end to end", async () => {
    const world = await seedWorld();
    const other = await seedWorld();
    const binding = bindingFor();
    const decision = await binding.authorityResolver.resolve({
      ...requestFor(world, "host-foreign-1"),
      class_ref: ref(world.workspaceId, "care_group", other.group.id),
      operation: "unassociated_query",
    });
    expect(decision.status).toBe("closed");
    const foreignMedia = (await binding.owner.association({
      request: {
        ...requestFor(world, "host-foreign-2"),
        media_ref: ref(world.workspaceId, "media_asset", other.asset.id),
      },
      authority: await authorityFor(binding, world, "association_query"),
    })) as Record<string, unknown>;
    expect(foreignMedia.status).toBe("masked");
  });
});
