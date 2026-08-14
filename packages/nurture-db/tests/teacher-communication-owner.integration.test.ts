import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { issueBoardOpaqueRef } from "@the-nurture/scenario/harness";
import { createPrismaClient } from "../src/client.js";
import {
  createAesGcmProtectedContentPort,
  createPrismaTeacherCommunicationBinding,
} from "../src/index.js";

// W8-3 owner-side proof: the six communication operations over real
// thread/message rows and the generic command ledger on a disposable
// database — unread cursors, cursor-sealed paging, prepare/confirm send,
// staged withdrawal and the own-cursor mark-read.
const prisma = createPrismaClient();
const protectedContent = createAesGcmProtectedContentPort({
  keyRef: "w8-test-key",
  keyMaterial: "0123456789abcdef0123456789abcdef",
});
const INTEGRITY_KEY = "w8-teacher-communication-integration-key";

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
  const guardian = await prisma.nurtureParticipant.create({
    data: {
      workspaceId,
      myChatUserId: `guardian:${workspaceId}`,
      displayName: "小明妈妈",
      status: "active",
    },
  });
  const institution = await prisma.nurtureCareInstitution.create({
    data: {
      workspaceId,
      displayName: "Care Center",
      status: "active",
      policyConfigPayload: {
        contentSafetyPolicyRef: "syn-content-safety-1",
        contentSafetyPolicyHead: 2,
      },
    },
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
  const guardianRole = await prisma.nurtureCareRoleAssignment.create({
    data: {
      workspaceId,
      participantId: guardian.id,
      role: "guardian",
      scopeType: "family",
      scopeId: `family-scope-${workspaceId}`,
      status: "active",
      displayLabel: "小明妈妈",
    },
  });
  await prisma.nurtureInstitutionPublicationPolicy.create({
    data: {
      workspaceId,
      institutionId: institution.id,
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
  const child = await prisma.nurtureChild.create({
    data: { workspaceId, displayName: "小明", status: "active" },
  });
  const childProcess = await prisma.nurtureChildCareProcess.create({
    data: { workspaceId, childId: child.id, status: "active" },
  });
  const family = await prisma.nurtureFamily.create({
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
  const thread = await prisma.nurtureFamilyCareThread.create({
    data: {
      workspaceId,
      childCareProcessId: childProcess.id,
      familyId: family.id,
      enrollmentId: enrollment.id,
      careGroupId: group.id,
      visibilityScope: "enrollment_private",
      status: "active",
    },
  });
  await prisma.nurtureFamilyCareThreadParticipant.create({
    data: {
      workspaceId,
      threadId: thread.id,
      participantId: guardian.id,
      roleAssignmentId: guardianRole.id,
      participantKind: "guardian",
      visibilityStatus: "active",
    },
  });
  const messageAt = (minutes: number) =>
    new Date(Date.parse("2026-08-14T08:00:00.000Z") + minutes * 60_000);
  const parentMessages = [];
  for (const [index, text] of ["今天有点咳嗽，请留意。", "午睡后麻烦多喝水。"].entries()) {
    parentMessages.push(
      await prisma.nurtureFamilyCareMessage.create({
        data: {
          workspaceId,
          threadId: thread.id,
          childCareProcessId: childProcess.id,
          senderParticipantId: guardian.id,
          senderRoleAssignmentId: guardianRole.id,
          messageKind: "family_message",
          authorshipKind: "family_authored",
          bodyFormat: "plain_text",
          bodyStorageMode: "protected",
          bodyProtectionPayload: protectedContent.seal(text),
          sourceSurface: "mobile",
          status: "sent",
          createdAt: messageAt(index),
        },
      }),
    );
  }
  await prisma.nurtureFamilyCareThread.update({
    where: { id: thread.id },
    data: { latestMessageAt: messageAt(1) },
  });
  return {
    workspaceId,
    teacher,
    guardian,
    group,
    teacherRole,
    child,
    childProcess,
    family,
    enrollment,
    thread,
    parentMessages,
  };
};

type World = Awaited<ReturnType<typeof seedWorld>>;

const bindingFor = () =>
  createPrismaTeacherCommunicationBinding({
    prisma,
    integrityKey: INTEGRITY_KEY,
    protectedContent,
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
    | "targets_query"
    | "membership_query"
    | "timeline_query"
    | "send_text_exchange"
    | "withdraw_staged_exchange"
    | "mark_read_exchange",
) => {
  const decision = await binding.authorityResolver.resolve({
    ...requestFor(world, `authority:${operation}`),
    operation,
  });
  expect(decision.status).toBe("resolved");
  return (decision as unknown as { owner_resolution: never }).owner_resolution;
};

describe("W8 teacher communication owner on real Prisma facts", () => {
  it("serves the rail, membership and cursor-sealed timeline over live rows", async () => {
    const world = await seedWorld();
    const binding = bindingFor();
    const threadRef = ref(world.workspaceId, "family_care_thread", world.thread.id);

    const targets = (await binding.owner.targets({
      request: requestFor(world, "host-targets-1"),
      authority: await authorityFor(binding, world, "targets_query"),
    })) as Record<string, unknown>;
    expect(targets.status).toBe("ready");
    const threads = targets.threads as Array<Record<string, unknown>>;
    expect(threads).toHaveLength(1);
    expect(threads[0]).toMatchObject({
      thread_ref: threadRef,
      family_safe_label: "小明家庭",
      child_safe_label: "小明",
      unread_count: 2,
    });
    expect(targets.unread_summary).toEqual({
      total_unread: 2,
      threads_with_unread: 1,
    });
    expect(targets.class_group).toEqual({
      send_availability: "unavailable",
      reason_code: "class_group_reserved",
    });

    const membership = (await binding.owner.membership({
      request: { ...requestFor(world, "host-membership-1"), thread_ref: threadRef },
      authority: await authorityFor(binding, world, "membership_query"),
    })) as Record<string, unknown>;
    expect(membership.status).toBe("ready");
    const members = membership.members as Array<Record<string, unknown>>;
    expect(members.map((member) => member.display_name)).toContain("小明妈妈");

    const timelineAuthority = await authorityFor(binding, world, "timeline_query");
    const timeline = (await binding.owner.timeline({
      request: { ...requestFor(world, "host-timeline-1"), thread_ref: threadRef },
      authority: timelineAuthority,
    })) as Record<string, unknown>;
    expect(timeline.status).toBe("ready");
    expect(timeline.cursor_echo).toBeNull();
    const messages = timeline.messages as Array<Record<string, unknown>>;
    expect(messages).toHaveLength(2);
    expect(messages[0]).toMatchObject({
      sender_kind: "parent",
      delivery_state: "not_applicable",
      body: "午睡后麻烦多喝水。",
    });
  });

  it("sends teacher text through prepare/confirm and replays from the ledger", async () => {
    const world = await seedWorld();
    const binding = bindingFor();
    const threadRef = ref(world.workspaceId, "family_care_thread", world.thread.id);
    const authority = await authorityFor(binding, world, "send_text_exchange");
    const base = {
      ...requestFor(world, "host-send-1"),
      thread_ref: threadRef,
      command_request_id: `command-send-${world.workspaceId}`,
    };
    const prepared = (await binding.owner.sendText({
      request: {
        ...base,
        kind: "prepare" as const,
        prepare: { text: "收到，我们会随时观察体温。" },
      },
      authority,
    })) as Record<string, unknown>;
    expect(prepared.status).toBe("ready_to_confirm");

    const confirmed = (await binding.owner.sendText({
      request: {
        ...base,
        host_request_id: "host-send-2",
        kind: "confirm" as const,
        confirm: {
          confirmation_ref: String(prepared.confirmation_ref),
          prepared_preview_digest: String(prepared.prepared_preview_digest),
        },
      },
      authority,
    })) as Record<string, unknown>;
    expect(confirmed).toMatchObject({ status: "committed", executed: "executed" });

    const replay = (await binding.owner.sendText({
      request: {
        ...base,
        host_request_id: "host-send-3",
        kind: "confirm" as const,
        confirm: {
          confirmation_ref: String(prepared.confirmation_ref),
          prepared_preview_digest: String(prepared.prepared_preview_digest),
        },
      },
      authority,
    })) as Record<string, unknown>;
    expect(replay).toMatchObject({
      status: "committed",
      executed: "replayed",
      message_ref: confirmed.message_ref,
    });

    const rows = await prisma.nurtureFamilyCareMessage.findMany({
      where: { workspaceId: world.workspaceId, messageKind: "caregiver_reply" },
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]?.bodyStorageMode).toBe("protected");

    const timeline = (await binding.owner.timeline({
      request: { ...requestFor(world, "host-send-4"), thread_ref: threadRef },
      authority: await authorityFor(binding, world, "timeline_query"),
    })) as Record<string, unknown>;
    const messages = timeline.messages as Array<Record<string, unknown>>;
    expect(messages[0]).toMatchObject({
      sender_kind: "teacher",
      delivery_state: "sent",
      body: "收到，我们会随时观察体温。",
    });
  });

  it("advances only the actor's own cursor and refuses regressions", async () => {
    const world = await seedWorld();
    const binding = bindingFor();
    const threadRef = ref(world.workspaceId, "family_care_thread", world.thread.id);
    const newest = world.parentMessages[1]!;
    const oldest = world.parentMessages[0]!;
    const authority = await authorityFor(binding, world, "mark_read_exchange");

    const advanced = (await binding.owner.markRead({
      request: {
        ...requestFor(world, "host-markread-1"),
        thread_ref: threadRef,
        message_ref: ref(world.workspaceId, "family_care_message", newest.id),
        command_request_id: `command-markread-1-${world.workspaceId}`,
      },
      authority,
    })) as Record<string, unknown>;
    expect(advanced).toMatchObject({
      status: "committed",
      disposition: "advanced",
      thread_ref: threadRef,
    });

    const targets = (await binding.owner.targets({
      request: requestFor(world, "host-markread-2"),
      authority: await authorityFor(binding, world, "targets_query"),
    })) as Record<string, unknown>;
    expect((targets.threads as Array<Record<string, unknown>>)[0]?.unread_count).toBe(0);

    const regression = (await binding.owner.markRead({
      request: {
        ...requestFor(world, "host-markread-3"),
        thread_ref: threadRef,
        message_ref: ref(world.workspaceId, "family_care_message", oldest.id),
        command_request_id: `command-markread-2-${world.workspaceId}`,
      },
      authority,
    })) as Record<string, unknown>;
    expect(regression).toMatchObject({
      status: "not_committed",
      reason_code: "cursor_regression",
    });

    const foreign = (await binding.owner.markRead({
      request: {
        ...requestFor(world, "host-markread-4"),
        thread_ref: threadRef,
        message_ref: ref(world.workspaceId, "family_care_message", "message-foreign"),
        command_request_id: `command-markread-3-${world.workspaceId}`,
      },
      authority,
    })) as Record<string, unknown>;
    expect(foreign.status).toBe("masked");
  });

  it("withdraws a staged process once and replays the recorded result", async () => {
    const world = await seedWorld();
    const binding = bindingFor();
    const process = await prisma.nurturePublishProcess.create({
      data: {
        workspaceId: world.workspaceId,
        careGroupId: world.group.id,
        processKey: `publish:${randomUUID()}`,
        state: "draft",
        dataClass: "daily_care_log",
        purposeKey: "family_daily_care_update",
        authorizingRoleAssignmentId: world.teacherRole.id,
      },
    });
    const revision = await prisma.nurturePublishProcessRevision.create({
      data: {
        workspaceId: world.workspaceId,
        publishProcessId: process.id,
        revision: 1,
        contentDigest: "sha256:content",
        organizerInputRevision: "organizer:1",
        titleProtectionPayload: protectedContent.seal("今日照护记录"),
        sourceRefsPayload: ["source-ref-1"],
      },
    });
    await prisma.nurturePublishProcess.update({
      where: { id: process.id },
      data: {
        currentRevisionId: revision.id,
        state: "pending_release",
        scheduledAt: new Date("2026-08-14T17:00:00.000Z"),
        notAfter: new Date("2026-08-14T19:00:00.000Z"),
        scheduleTimeZone: "Asia/Shanghai",
        schedulePolicyRef: "nurture.institution-publication-policy@1.0.0",
        schedulePolicyHead: 7,
        schedulePolicyVersion: 1,
        scheduleResolvedAt: new Date("2026-08-14T09:00:00.000Z"),
      },
    });

    const authority = await authorityFor(binding, world, "withdraw_staged_exchange");
    const request = {
      ...requestFor(world, "host-withdraw-1"),
      process_ref: ref(world.workspaceId, "publish_process", process.id),
      command_request_id: `command-withdraw-${world.workspaceId}`,
    };
    const withdrawn = (await binding.owner.withdrawStaged({
      request,
      authority,
    })) as Record<string, unknown>;
    expect(withdrawn).toMatchObject({
      status: "committed",
      executed: "executed",
      disposition: "withdrawn",
      process_ref: request.process_ref,
    });

    const replay = (await binding.owner.withdrawStaged({
      request: { ...request, host_request_id: "host-withdraw-2" },
      authority,
    })) as Record<string, unknown>;
    expect(replay).toMatchObject({
      status: "committed",
      executed: "replayed",
      disposition: "withdrawn",
      withdrawn_at: withdrawn.withdrawn_at,
    });

    const row = await prisma.nurturePublishProcess.findFirst({
      where: { id: process.id },
    });
    expect(row?.state).toBe("cancelled");
  });

  it("masks foreign classes end to end", async () => {
    const world = await seedWorld();
    const other = await seedWorld();
    const binding = bindingFor();
    const decision = await binding.authorityResolver.resolve({
      ...requestFor(world, "host-foreign-1"),
      class_ref: ref(world.workspaceId, "care_group", other.group.id),
      operation: "targets_query",
    });
    expect(decision.status).toBe("closed");
    expect((decision as { response: { status: string } }).response.status).toBe(
      "masked",
    );
  });
});
