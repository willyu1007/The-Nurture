import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { issueBoardOpaqueRef } from "@the-nurture/scenario/harness";
import { createPrismaClient } from "../src/client.js";
import {
  createAesGcmProtectedContentPort,
  createPrismaTeacherAssistantQueryBinding,
} from "../src/index.js";

// W10-3 owner-side proof: the assistant queries and the weekly-draft
// exchange over real daily-care rows, W9 attribution rows and the generic
// command ledger on a disposable database.
const prisma = createPrismaClient();
const INTEGRITY_KEY = "w10-teacher-assistant-query-integration";
const protectedContent = createAesGcmProtectedContentPort({
  keyRef: "w10-integration",
  keyMaterial: "w10-teacher-assistant-protected-content-key",
});

afterAll(async () => {
  await prisma.$disconnect();
});

const ref = (workspaceId: string, kind: string, id: string) =>
  issueBoardOpaqueRef(INTEGRITY_KEY, { workspace_id: workspaceId }, kind, id);

const LOCAL_DATE = "2026-08-12";
const WEEK_START = "2026-08-10";

const seedWorld = async (options: { weeklyGrant?: boolean } = {}) => {
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
  if (options.weeklyGrant !== false) {
    await prisma.nurtureChildLinkGrant.create({
      data: {
        workspaceId,
        childCareProcessId: childProcess.id,
        enrollmentId: enrollment.id,
        grantedByParticipantId: teacher.id,
        grantedToScopeType: "care_group",
        grantedToScopeId: group.id,
        directions: ["org_to_family"],
        dataClasses: ["care_day_note"],
        purposes: ["family_weekly_summary"],
        status: "active",
      },
    });
  }
  // Two in-week daily logs (Mon: meal+nap, Wed: meal) and one out-of-week
  // log that must not count.
  await prisma.nurtureDailyCareLog.create({
    data: {
      workspaceId,
      childCareProcessId: childProcess.id,
      enrollmentId: enrollment.id,
      careGroupId: group.id,
      recordedByRoleAssignmentId: teacherRole.id,
      logDate: new Date("2026-08-10T00:00:00.000Z"),
      status: "recorded",
      mealPayload: { note: "吃得很好" },
      napPayload: { minutes: 90 },
    },
  });
  await prisma.nurtureDailyCareLog.create({
    data: {
      workspaceId,
      childCareProcessId: childProcess.id,
      enrollmentId: enrollment.id,
      careGroupId: group.id,
      recordedByRoleAssignmentId: teacherRole.id,
      logDate: new Date(`${LOCAL_DATE}T00:00:00.000Z`),
      status: "recorded",
      mealPayload: { note: "午餐正常" },
    },
  });
  await prisma.nurtureDailyCareLog.create({
    data: {
      workspaceId,
      childCareProcessId: childProcess.id,
      enrollmentId: enrollment.id,
      careGroupId: group.id,
      recordedByRoleAssignmentId: teacherRole.id,
      logDate: new Date("2026-08-03T00:00:00.000Z"),
      status: "recorded",
      moodPayload: { mood: "calm" },
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
      capturedAt: new Date("2026-08-11T08:30:00.000Z"),
      lifecycle: "ready",
    },
  });
  await prisma.nurtureChildMediaAttribution.create({
    data: {
      workspaceId,
      mediaAssetRefId: asset.id,
      childCareProcessId: childProcess.id,
      source: "history_match",
      state: "confirmed",
      attributionRevision: 2,
      confirmedByRoleAssignmentId: teacherRole.id,
      confirmedAt: new Date("2026-08-11T09:00:00.000Z"),
      exposurePolicyPayload: { audience: "own_family" },
    },
  });
  return { workspaceId, teacher, colleague, group, childProcess };
};

type World = Awaited<ReturnType<typeof seedWorld>>;

const bindingFor = () =>
  createPrismaTeacherAssistantQueryBinding({
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
  local_date: LOCAL_DATE,
});

const authorityFor = async (
  binding: ReturnType<typeof bindingFor>,
  world: World,
  operation:
    | "missing_records_query"
    | "weekly_source_query"
    | "weekly_draft_exchange",
) => {
  const decision = await binding.authorityResolver.resolve({
    ...requestFor(world, `authority:${operation}`),
    operation,
  });
  expect(decision.status).toBe("resolved");
  return (decision as unknown as { owner_resolution: never }).owner_resolution;
};

describe("W10 teacher assistant-query owner on real Prisma facts", () => {
  it("answers the missing-record partition with the typed handoff over live logs", async () => {
    const world = await seedWorld();
    const binding = bindingFor();
    const response = (await binding.owner.missingRecords({
      request: requestFor(world, "host-missing-1"),
      authority: await authorityFor(binding, world, "missing_records_query"),
    })) as Record<string, unknown>;
    expect(response.status).toBe("ready");
    expect(response.local_date).toBe(LOCAL_DATE);
    expect(response.missing_count).toBe(4);
    const children = response.children as Array<Record<string, unknown>>;
    expect(children).toHaveLength(1);
    expect(children[0]).toMatchObject({
      child_ref: ref(world.workspaceId, "child_care_process", world.childProcess.id),
      child_safe_label: "小明",
      present_kinds: ["meal"],
      missing_kinds: ["nap", "mood", "activity", "health_observation"],
    });
    expect(children[0]?.handoff).toMatchObject({
      interface_key: "nurture.teacher-organization-owner",
      operation: "supplement_exchange",
      availability: "available",
    });
  });

  it("aggregates the owner-computed week from live logs and W9 attributions", async () => {
    const world = await seedWorld();
    const binding = bindingFor();
    const response = (await binding.owner.weeklySource({
      request: requestFor(world, "host-weekly-1"),
      authority: await authorityFor(binding, world, "weekly_source_query"),
    })) as Record<string, unknown>;
    expect(response.status).toBe("ready");
    expect(response.week_start).toBe(WEEK_START);
    expect(response.week_end).toBe("2026-08-16");
    const children = response.children as Array<Record<string, unknown>>;
    expect(children[0]).toMatchObject({
      care_counts: { meal: 2, nap: 1, mood: 0, activity: 0, health_observation: 0 },
      confirmed_media_count: 1,
    });
    expect(response.class_total_records).toBe(3);
    expect(response.class_total_confirmed_media).toBe(1);
    expect(response.draft_process_ref).toBeUndefined();
  });

  it("creates the weekly draft once, replays it, and answers already_satisfied for a new command", async () => {
    const world = await seedWorld();
    const binding = bindingFor();
    const request = {
      ...requestFor(world, "host-draft-1"),
      command_request_id: `command-weekly-${world.workspaceId}`,
    };
    const authority = await authorityFor(binding, world, "weekly_draft_exchange");
    const first = (await binding.owner.weeklyDraft({
      request,
      authority,
    })) as Record<string, unknown>;
    expect(first).toMatchObject({
      status: "committed",
      executed: "executed",
      disposition: "created",
      week_start: WEEK_START,
      state: "draft",
    });

    const process = await prisma.nurturePublishProcess.findFirst({
      where: {
        workspaceId: world.workspaceId,
        processKey: `weekly:${world.group.id}:${WEEK_START}`,
      },
      include: { revisions: true, targets: true, safetyAssessments: true },
    });
    expect(process?.state).toBe("draft");
    expect(process?.dataClass).toBe("care_day_note");
    expect(process?.purposeKey).toBe("family_weekly_summary");
    expect(process?.captureBatchId).toBeNull();
    expect(process?.revisions).toHaveLength(1);
    expect(process?.targets).toHaveLength(1);
    expect(process?.safetyAssessments).toHaveLength(1);
    const body = process?.revisions[0]?.bodyProtectionPayload;
    const document = JSON.parse(
      protectedContent.unseal(body as never),
    ) as Record<string, unknown>;
    expect(document).toMatchObject({
      kind: "weekly_care_summary_facts",
      week_start: WEEK_START,
    });
    expect(first.process_ref).toBe(
      ref(world.workspaceId, "publish_process", process?.id ?? ""),
    );

    const replay = (await binding.owner.weeklyDraft({
      request: { ...request, host_request_id: "host-draft-2" },
      authority,
    })) as Record<string, unknown>;
    expect(replay).toMatchObject({
      status: "committed",
      executed: "replayed",
      disposition: "created",
      process_ref: first.process_ref,
    });

    const duplicate = (await binding.owner.weeklyDraft({
      request: {
        ...request,
        host_request_id: "host-draft-3",
        command_request_id: `command-weekly-2-${world.workspaceId}`,
      },
      authority,
    })) as Record<string, unknown>;
    expect(duplicate).toMatchObject({
      status: "committed",
      executed: "executed",
      disposition: "already_satisfied",
      process_ref: first.process_ref,
    });
    const processCount = await prisma.nurturePublishProcess.count({
      where: { workspaceId: world.workspaceId },
    });
    expect(processCount).toBe(1);

    // The weekly-source read now names the existing draft.
    const source = (await binding.owner.weeklySource({
      request: requestFor(world, "host-weekly-2"),
      authority: await authorityFor(binding, world, "weekly_source_query"),
    })) as Record<string, unknown>;
    expect(source.draft_process_ref).toBe(first.process_ref);
  });

  it("denies cross-actor reuse of the same command identity", async () => {
    const world = await seedWorld();
    const binding = bindingFor();
    const request = {
      ...requestFor(world, "host-draft-4"),
      command_request_id: `command-cross-${world.workspaceId}`,
    };
    const first = (await binding.owner.weeklyDraft({
      request,
      authority: await authorityFor(binding, world, "weekly_draft_exchange"),
    })) as Record<string, unknown>;
    expect(first.status).toBe("committed");

    const colleagueBinding = bindingFor();
    const colleagueRequest = {
      ...request,
      my_chat_user_id: world.colleague.myChatUserId,
      host_request_id: "host-draft-5",
    };
    const colleagueDecision = await colleagueBinding.authorityResolver.resolve({
      ...colleagueRequest,
      operation: "weekly_draft_exchange",
    });
    expect(colleagueDecision.status).toBe("resolved");
    const crossActor = (await colleagueBinding.owner.weeklyDraft({
      request: colleagueRequest,
      authority: (colleagueDecision as unknown as { owner_resolution: never })
        .owner_resolution,
    })) as Record<string, unknown>;
    expect(crossActor).toMatchObject({
      status: "not_committed",
      reason_code: "command_payload_conflict",
    });
  });

  it("refuses a weekly-grant-free class and masks foreign classes", async () => {
    const world = await seedWorld({ weeklyGrant: false });
    const binding = bindingFor();
    const refusal = (await binding.owner.weeklyDraft({
      request: {
        ...requestFor(world, "host-draft-6"),
        command_request_id: `command-nogrant-${world.workspaceId}`,
      },
      authority: await authorityFor(binding, world, "weekly_draft_exchange"),
    })) as Record<string, unknown>;
    expect(refusal).toMatchObject({
      status: "not_committed",
      reason_code: "no_eligible_target",
    });

    const other = await seedWorld();
    const foreign = await binding.authorityResolver.resolve({
      ...requestFor(world, "host-foreign-1"),
      class_ref: ref(world.workspaceId, "care_group", other.group.id),
      operation: "missing_records_query",
    });
    expect(foreign.status).toBe("closed");
  });
});
