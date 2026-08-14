import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { issueBoardOpaqueRef } from "@the-nurture/scenario/harness";
import { createPrismaClient } from "../src/client.js";
import {
  createAesGcmProtectedContentPort,
  createPrismaTeacherOrganizationBinding,
} from "../src/index.js";

// W7-3 owner-side proof: the six organization operations over real Prisma
// facts and the generic command ledger — actor-bound idempotency, exact
// replay, and the frozen read bindings, all on a disposable database.
const prisma = createPrismaClient();
const protectedContent = createAesGcmProtectedContentPort({
  keyRef: "w7-test-key",
  keyMaterial: "0123456789abcdef0123456789abcdef",
});
const INTEGRITY_KEY = "w7-teacher-organization-integration-key";

afterAll(async () => {
  await prisma.$disconnect();
});

const ref = (workspaceId: string, kind: string, id: string) =>
  issueBoardOpaqueRef(INTEGRITY_KEY, { workspace_id: workspaceId }, kind, id);

const seedWorld = async () => {
  const workspaceId = randomUUID();
  const teacher = await prisma.nurtureParticipant.create({
    data: { workspaceId, myChatUserId: `teacher:${workspaceId}`, status: "active" },
  });
  const colleague = await prisma.nurtureParticipant.create({
    data: { workspaceId, myChatUserId: `colleague:${workspaceId}`, status: "active" },
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
  await prisma.nurtureChildLinkGrant.create({
    data: {
      workspaceId,
      childCareProcessId: childProcess.id,
      enrollmentId: enrollment.id,
      grantedByParticipantId: teacher.id,
      grantedToScopeType: "care_group",
      grantedToScopeId: group.id,
      directions: ["org_to_family"],
      dataClasses: ["daily_care_log"],
      purposes: ["family_daily_care_update"],
      status: "active",
    },
  });
  return {
    workspaceId,
    teacher,
    colleague,
    institution,
    group,
    teacherRole,
    child,
    childProcess,
    enrollment,
  };
};

type World = Awaited<ReturnType<typeof seedWorld>>;

const bindingFor = (now?: () => Date) =>
  createPrismaTeacherOrganizationBinding({
    prisma,
    integrityKey: INTEGRITY_KEY,
    protectedContent,
    now: now ?? (() => new Date()),
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
    | "feed_query"
    | "organization_query"
    | "organize_exchange"
    | "supplement_exchange"
    | "class_note_exchange"
    | "queue_admission_exchange",
) => {
  const decision = await binding.authorityResolver.resolve({
    ...requestFor(world, `authority:${operation}`),
    operation,
  });
  expect(decision.status).toBe("resolved");
  return (decision as unknown as { owner_resolution: never }).owner_resolution;
};

const seedAdmittableProcess = async (world: World, ageSeconds: number) => {
  const process = await prisma.nurturePublishProcess.create({
    data: {
      workspaceId: world.workspaceId,
      careGroupId: world.group.id,
      processKey: `publish:${randomUUID()}`,
      state: "draft",
      dataClass: "daily_care_log",
      purposeKey: "family_daily_care_update",
      authorizingRoleAssignmentId: world.teacherRole.id,
      createdAt: new Date(Date.now() - ageSeconds * 1_000),
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
    data: { currentRevisionId: revision.id },
  });
  await prisma.nurturePublishProcessTarget.create({
    data: {
      workspaceId: world.workspaceId,
      publishProcessId: process.id,
      targetKey: `target:${world.childProcess.id}`,
      childCareProcessId: world.childProcess.id,
      enrollmentId: world.enrollment.id,
      familyRefKey: `family:${world.child.id}`,
      grantId: (
        await prisma.nurtureChildLinkGrant.create({
          data: {
            workspaceId: world.workspaceId,
            childCareProcessId: world.childProcess.id,
            enrollmentId: world.enrollment.id,
            grantedByParticipantId: world.teacher.id,
            grantedToScopeType: "care_group",
            grantedToScopeId: world.group.id,
            directions: ["org_to_family"],
            dataClasses: ["daily_care_log"],
            purposes: ["family_daily_care_update"],
            status: "active",
          },
        })
      ).id,
    },
  });
  return process;
};

describe("W7 teacher organization owner on real Prisma facts", () => {
  it("records a class note once and answers exact replays from the ledger", async () => {
    const world = await seedWorld();
    const binding = bindingFor();
    const authority = await authorityFor(binding, world, "class_note_exchange");
    const request = {
      ...requestFor(world, "host-note-1"),
      command_request_id: `command-note-${world.workspaceId}`,
      text: "今天户外活动 40 分钟",
    };
    const first = (await binding.owner.classNote({ request, authority })) as Record<string, unknown>;
    expect(first).toMatchObject({ status: "committed", executed: "executed" });

    const replay = (await binding.owner.classNote({
      request: { ...request, host_request_id: "host-note-2" },
      authority,
    })) as Record<string, unknown>;
    expect(replay).toMatchObject({
      status: "committed",
      executed: "replayed",
      capture_ref: first.capture_ref,
    });

    const divergent = (await binding.owner.classNote({
      request: { ...request, host_request_id: "host-note-3", text: "另一段内容" },
      authority,
    })) as Record<string, unknown>;
    expect(divergent).toMatchObject({
      status: "not_committed",
      reason_code: "command_payload_conflict",
    });

    const captures = await prisma.nurtureCareCapture.findMany({
      where: { workspaceId: world.workspaceId, careGroupId: world.group.id },
    });
    expect(captures).toHaveLength(1);
    expect(captures[0]?.stable).toBe(true);
    expect(captures[0]?.kind).toBe("text");

    // The same command identity from another authorized teacher is denied.
    const colleagueBinding = bindingFor();
    const colleagueDecision = await colleagueBinding.authorityResolver.resolve({
      ...request,
      my_chat_user_id: world.colleague.myChatUserId,
      operation: "class_note_exchange",
    });
    expect(colleagueDecision.status).toBe("resolved");
    const crossActor = (await colleagueBinding.owner.classNote({
      request: {
        ...request,
        my_chat_user_id: world.colleague.myChatUserId,
        host_request_id: "host-note-4",
      },
      authority: (colleagueDecision as unknown as { owner_resolution: never }).owner_resolution,
    })) as Record<string, unknown>;
    expect(crossActor).toMatchObject({
      status: "not_committed",
      reason_code: "command_payload_conflict",
    });
  });

  it("serves the feed and organization reads over the live batch", async () => {
    const world = await seedWorld();
    const binding = bindingFor();
    const noteAuthority = await authorityFor(binding, world, "class_note_exchange");
    await binding.owner.classNote({
      request: {
        ...requestFor(world, "host-note-feed"),
        command_request_id: `command-note-feed-${world.workspaceId}`,
        text: "午睡整体安稳",
      },
      authority: noteAuthority,
    });

    const feedAuthority = await authorityFor(binding, world, "feed_query");
    const feed = (await binding.owner.feed({
      request: requestFor(world, "host-feed-1"),
      authority: feedAuthority,
    })) as Record<string, unknown>;
    expect(feed.status).toBe("ready");
    expect(feed.batch_state).toBe("collecting");
    const captures = feed.captures as Array<Record<string, unknown>>;
    expect(captures).toHaveLength(1);
    expect(captures[0]).toMatchObject({
      kind: "text",
      stability: "stable",
      text_excerpt: "午睡整体安稳",
    });

    const organizationAuthority = await authorityFor(binding, world, "organization_query");
    const organization = (await binding.owner.organization({
      request: requestFor(world, "host-organization-1"),
      authority: organizationAuthority,
    })) as Record<string, unknown>;
    expect(organization.status).toBe("ready");
    const batch = organization.batch as Record<string, unknown>;
    expect(batch).toMatchObject({
      state: "collecting",
      capture_count: 1,
      stable_capture_count: 1,
    });
    expect((batch.trigger as Record<string, unknown>).availability).toBe("available");
    const cache = organization.cache_partition as Record<string, unknown>;
    expect(cache.query_key).toBe(requestFor(world, "x").class_ref);
  });

  it("cuts the batch through the organize command and replays the recorded result", async () => {
    const world = await seedWorld();
    const binding = bindingFor();
    const noteAuthority = await authorityFor(binding, world, "class_note_exchange");
    await binding.owner.classNote({
      request: {
        ...requestFor(world, "host-note-organize"),
        command_request_id: `command-note-organize-${world.workspaceId}`,
        text: "上午拼图活动完成",
      },
      authority: noteAuthority,
    });

    const organizeAuthority = await authorityFor(binding, world, "organize_exchange");
    const request = {
      ...requestFor(world, "host-organize-1"),
      command_request_id: `command-organize-${world.workspaceId}`,
      trigger: "manual" as const,
    };
    const first = (await binding.owner.organize({
      request,
      authority: organizeAuthority,
    })) as Record<string, unknown>;
    expect(first.status).toBe("committed");
    expect(first.executed).toBe("executed");
    expect(first.included_capture_count).toBe(1);
    expect(["organized", "needs_review", "direct_interaction_required"]).toContain(
      first.outcome,
    );

    const replay = (await binding.owner.organize({
      request: { ...request, host_request_id: "host-organize-2" },
      authority: organizeAuthority,
    })) as Record<string, unknown>;
    expect(replay).toMatchObject({
      status: "committed",
      executed: "replayed",
      outcome: first.outcome,
      batch_ref: first.batch_ref,
    });

    const batches = await prisma.nurtureCareCaptureBatch.findMany({
      where: { workspaceId: world.workspaceId, careGroupId: world.group.id },
    });
    expect(batches.some((row) => row.state === "organized")).toBe(true);
  });

  it("prepares and confirms a supplement over the real daily-care write path", async () => {
    const world = await seedWorld();
    const binding = bindingFor();
    const authority = await authorityFor(binding, world, "supplement_exchange");
    const base = {
      ...requestFor(world, "host-supplement-1"),
      child_ref: ref(world.workspaceId, "child_care_process", world.childProcess.id),
      command_request_id: `command-supplement-${world.workspaceId}`,
    };
    const prepared = (await binding.owner.supplement({
      request: {
        ...base,
        kind: "prepare" as const,
        prepare: {
          local_date: "2026-08-14",
          care_kind: "meal" as const,
          text: "午餐加了一次饭",
        },
      },
      authority,
    })) as Record<string, unknown>;
    expect(prepared.status).toBe("ready_to_confirm");

    const confirmed = (await binding.owner.supplement({
      request: {
        ...base,
        host_request_id: "host-supplement-2",
        kind: "confirm" as const,
        confirm: {
          confirmation_ref: String(prepared.confirmation_ref),
          prepared_preview_digest: String(prepared.prepared_preview_digest),
        },
      },
      authority,
    })) as Record<string, unknown>;
    expect(confirmed).toMatchObject({ status: "committed", executed: "executed" });
    expect(typeof confirmed.log_ref).toBe("string");

    const logs = await prisma.nurtureDailyCareLog.findMany({
      where: { workspaceId: world.workspaceId },
    });
    expect(logs).toHaveLength(1);

    // The confirmation is single-use: a second confirm of the same command
    // replays the recorded commit instead of consuming anything again.
    const replay = (await binding.owner.supplement({
      request: {
        ...base,
        host_request_id: "host-supplement-3",
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
      log_ref: confirmed.log_ref,
    });

    const foreignDigest = (await binding.owner.supplement({
      request: {
        ...base,
        host_request_id: "host-supplement-4",
        command_request_id: `command-supplement-2-${world.workspaceId}`,
        kind: "confirm" as const,
        confirm: {
          confirmation_ref: String(prepared.confirmation_ref),
          prepared_preview_digest: String(prepared.prepared_preview_digest),
        },
      },
      authority,
    })) as Record<string, unknown>;
    // A different command identity cannot ride the first confirmation.
    expect(foreignDigest).toMatchObject({ status: "not_committed" });
  });

  it("admits a draft to the queue once and keeps the waiting windows closed", async () => {
    const world = await seedWorld();
    const binding = bindingFor();
    const young = await seedAdmittableProcess(world, 5);
    const authority = await authorityFor(binding, world, "queue_admission_exchange");
    const waiting = (await binding.owner.queueAdmission({
      request: {
        ...requestFor(world, "host-admission-1"),
        process_ref: ref(world.workspaceId, "publish_process", young.id),
        command_request_id: `command-admission-1-${world.workspaceId}`,
      },
      authority,
    })) as Record<string, unknown>;
    expect(waiting).toMatchObject({
      status: "not_committed",
      reason_code: "quick_adjust_active",
    });

    const mature = await seedAdmittableProcess(world, 120);
    const request = {
      ...requestFor(world, "host-admission-2"),
      process_ref: ref(world.workspaceId, "publish_process", mature.id),
      command_request_id: `command-admission-2-${world.workspaceId}`,
    };
    const committed = (await binding.owner.queueAdmission({
      request,
      authority,
    })) as Record<string, unknown>;
    expect(committed).toMatchObject({
      status: "committed",
      executed: "executed",
      disposition: "queued",
      process_ref: request.process_ref,
      schedule_policy_head: 7,
    });

    const replay = (await binding.owner.queueAdmission({
      request: { ...request, host_request_id: "host-admission-3" },
      authority,
    })) as Record<string, unknown>;
    expect(replay).toMatchObject({
      status: "committed",
      executed: "replayed",
      disposition: "queued",
      scheduled_at: committed.scheduled_at,
    });

    const again = (await binding.owner.queueAdmission({
      request: {
        ...request,
        host_request_id: "host-admission-4",
        command_request_id: `command-admission-3-${world.workspaceId}`,
      },
      authority,
    })) as Record<string, unknown>;
    expect(again).toMatchObject({
      status: "committed",
      executed: "executed",
      disposition: "already_satisfied",
    });

    const row = await prisma.nurturePublishProcess.findFirst({
      where: { id: mature.id },
    });
    expect(row?.state).toBe("pending_release");
  });

  it("masks foreign classes and keeps the resolver current", async () => {
    const world = await seedWorld();
    const other = await seedWorld();
    const binding = bindingFor();
    const decision = await binding.authorityResolver.resolve({
      ...requestFor(world, "host-foreign-1"),
      class_ref: ref(world.workspaceId, "care_group", other.group.id),
      operation: "feed_query",
    });
    expect(decision.status).toBe("closed");
    expect((decision as { response: { status: string } }).response.status).toBe(
      "masked",
    );
  });
});
