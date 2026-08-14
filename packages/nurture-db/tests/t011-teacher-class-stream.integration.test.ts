import { afterAll, describe, expect, it } from "vitest";
import { createPrismaClient } from "../src/client.js";
import { createPrismaTeacherClassStreamBinding } from "../src/teacher-class-stream.composition.js";
import { seedT010FamilySharingFixture } from "./helpers/t010-family-sharing-fixture.js";
import { assertPublishedTeacherClassStreamResponse } from "../../../apps/scenario-service/src/teacher-class-stream-response-validator.js";

const prisma = createPrismaClient();
const INTEGRITY_KEY = "t011-teacher-class-stream-integrity-32";
const LOCAL_DATE = "2026-08-14";
const DAY = new Date(`${LOCAL_DATE}T00:00:00.000Z`);
const NOW = new Date(`${LOCAL_DATE}T09:00:00.000Z`);

afterAll(async () => {
  await prisma.$disconnect();
});

type Scope = Awaited<ReturnType<typeof seedScope>>;

const seedScope = async () => {
  const base = await prisma.$transaction((transaction) =>
    seedT010FamilySharingFixture(transaction, "t011-teacher-class-stream"));
  const caregiver = await prisma.nurtureParticipant.create({
    data: {
      workspaceId: base.workspaceId,
      myChatUserId: `t011-tcs-teacher-${base.runId}`,
      displayName: "林老师",
      status: "active",
      aggregateVersion: 2,
    },
  });
  const caregiverRole = await prisma.nurtureCareRoleAssignment.create({
    data: {
      workspaceId: base.workspaceId,
      participantId: caregiver.id,
      role: "lead_caregiver",
      scopeType: "care_group",
      scopeId: base.careGroupId,
      displayLabel: "主带班老师",
      status: "active",
      aggregateVersion: 3,
    },
  });
  const dailyLog = await prisma.nurtureDailyCareLog.create({
    data: {
      workspaceId: base.workspaceId,
      childCareProcessId: base.processId,
      enrollmentId: base.enrollmentId,
      careGroupId: base.careGroupId,
      recordedByRoleAssignmentId: caregiverRole.id,
      logDate: DAY,
      mealPayload: { note: "breakfast finished" },
      napPayload: { minutes: 80 },
      summary: "早餐完成，午睡 80 分钟",
      status: "recorded",
      aggregateVersion: 5,
    },
  });
  await prisma.nurtureTeacherAttentionItem.create({
    data: {
      workspaceId: base.workspaceId,
      careGroupId: base.careGroupId,
      childCareProcessId: base.processId,
      sourceType: "family_care_item",
      title: "家庭嘱托待确认",
      summary: "今日午睡请盖薄毯",
      priority: "time_sensitive",
      status: "active",
      effectiveDate: DAY,
    },
  });
  const submission = await prisma.nurtureDailyAttendanceSubmission.create({
    data: {
      workspaceId: base.workspaceId,
      careGroupId: base.careGroupId,
      localDate: DAY,
      state: "submitted",
      submittedByRoleAssignmentId: caregiverRole.id,
      submittedAt: new Date(`${LOCAL_DATE}T00:40:00.000Z`),
      entries: {
        create: {
          workspaceId: base.workspaceId,
          childCareProcessId: base.processId,
          state: "present",
          aggregateVersion: 2,
        },
      },
    },
  });
  const thread = await prisma.nurtureFamilyCareThread.create({
    data: {
      workspaceId: base.workspaceId,
      childCareProcessId: base.processId,
      familyId: base.familyId,
      enrollmentId: base.enrollmentId,
      careGroupId: base.careGroupId,
      visibilityScope: "family_private",
      status: "active",
    },
  });
  await prisma.nurtureFamilyCareItem.create({
    data: {
      workspaceId: base.workspaceId,
      threadId: thread.id,
      childCareProcessId: base.processId,
      familyId: base.familyId,
      enrollmentId: base.enrollmentId,
      careGroupId: base.careGroupId,
      dataClass: "care_constraint_update",
      category: "constraint",
      summary: "今日午睡请盖薄毯",
      urgency: "today_attention",
      status: "open",
      classificationSource: "manual",
      lifecycleState: "active",
      version: 2,
      createdAt: new Date(`${LOCAL_DATE}T01:10:00.000Z`),
    },
  });
  await prisma.nurtureClassScheduleDayOverride.create({
    data: {
      workspaceId: base.workspaceId,
      careGroupId: base.careGroupId,
      localDate: DAY,
      slotsPayload: [
        {
          slotRef: "slot-morning",
          label: "晨间活动",
          startsAt: "08:30",
          endsAt: "09:30",
        },
        {
          slotRef: "slot-outdoor",
          label: "户外游戏",
          startsAt: "10:00",
          endsAt: "10:45",
        },
      ],
      aggregateVersion: 4,
    },
  });
  return { ...base, dailyLogId: dailyLog.id, caregiverUserId: caregiver.myChatUserId, submissionId: submission.id };
};

const binding = createPrismaTeacherClassStreamBinding({
  prisma,
  integrityKey: INTEGRITY_KEY,
  now: () => NOW,
});

const requestOf = (scope: Scope) => ({
  workspace_id: scope.workspaceId,
  my_chat_user_id: scope.caregiverUserId,
  host_request_id: `req-${scope.runId}`,
  context_ref: `context:teacher:${scope.runId}`,
});

const resolveClassRef = async (scope: Scope): Promise<string> => {
  const decision = await binding.authorityResolver.resolve({
    ...requestOf(scope),
    operation: "class_context_query",
  });
  expect(decision.status).toBe("resolved");
  if (decision.status !== "resolved") throw new Error("unresolved");
  const response = (await binding.owner.classContext({
    request: { ...requestOf(scope), local_date: LOCAL_DATE },
    authority: decision.owner_resolution,
  })) as { classes: Array<{ class_ref: string; current: boolean }> };
  return response.classes.find((entry) => entry.current)!.class_ref;
};

describe("t011 W6 teacher class-stream real owner ports", () => {
  it("serves the class context from live caregiver facts", async () => {
    const scope = await seedScope();
    const decision = await binding.authorityResolver.resolve({
      ...requestOf(scope),
      operation: "class_context_query",
    });
    expect(decision.status).toBe("resolved");
    if (decision.status !== "resolved") return;
    expect(decision.owner_resolution.presentation_role).toBe("lead_caregiver");
    const response = await binding.owner.classContext({
      request: { ...requestOf(scope), local_date: LOCAL_DATE },
      authority: decision.owner_resolution,
    });
    assertPublishedTeacherClassStreamResponse("class_context_query", response);
    expect(response).toMatchObject({
      day_header: {
        local_date: LOCAL_DATE,
        effective_schedule: "available",
      },
    });
  });

  it("serves the strip, day detail and schedule from canonical rows", async () => {
    const scope = await seedScope();
    const classRef = await resolveClassRef(scope);
    const request = requestOf(scope);

    const stripAuthority = await binding.authorityResolver.resolve({
      ...request,
      operation: "child_strip_query",
      class_ref: classRef,
    });
    expect(stripAuthority.status).toBe("resolved");
    if (stripAuthority.status !== "resolved") return;
    const strip = await binding.owner.childStrip({
      request: { ...request, class_ref: classRef, local_date: LOCAL_DATE },
      authority: stripAuthority.owner_resolution,
    });
    assertPublishedTeacherClassStreamResponse("child_strip_query", strip);
    const stripBody = strip as {
      children: Array<{
        child_ref: string;
        attention: { count: number; highest_priority: string };
        last_activity_at?: string;
      }>;
    };
    expect(stripBody.children).toHaveLength(1);
    expect(stripBody.children[0]!.attention).toMatchObject({
      count: 1,
      highest_priority: "urgent",
    });
    expect(stripBody.children[0]!.last_activity_at).toBeDefined();

    const detailAuthority = await binding.authorityResolver.resolve({
      ...request,
      operation: "child_day_detail_query",
      class_ref: classRef,
    });
    if (detailAuthority.status !== "resolved") throw new Error("unresolved");
    const detail = await binding.owner.childDayDetail({
      request: {
        ...request,
        class_ref: classRef,
        child_ref: stripBody.children[0]!.child_ref,
        local_date: LOCAL_DATE,
      },
      authority: detailAuthority.owner_resolution,
    });
    assertPublishedTeacherClassStreamResponse("child_day_detail_query", detail);
    const detailBody = detail as { sections: Array<Record<string, unknown>> };
    expect(
      detailBody.sections.map((section) => `${section.section_key}:${section.status}`),
    ).toEqual([
      "arrival:ready",
      "daily_care:ready",
      "family_instructions:ready",
      "observations:unavailable",
      "focus_link:unavailable",
    ]);
    expect(detailBody.sections[0]).toMatchObject({ arrival_state: "arrived" });
    const entries = detailBody.sections[1]!.entries as Array<{ kind: string }>;
    expect(entries.map((entry) => entry.kind).sort()).toEqual(["meal", "nap"]);

    const scheduleAuthority = await binding.authorityResolver.resolve({
      ...request,
      operation: "schedule_query",
      class_ref: classRef,
    });
    if (scheduleAuthority.status !== "resolved") throw new Error("unresolved");
    const schedule = await binding.owner.schedule({
      request: { ...request, class_ref: classRef, local_date: LOCAL_DATE },
      authority: scheduleAuthority.owner_resolution,
    });
    assertPublishedTeacherClassStreamResponse("schedule_query", schedule);
    expect(schedule).toMatchObject({
      resolution: "day_override",
      schedule_version_head: 4,
      slots: [
        { label: "晨间活动", current: false },
        { label: "户外游戏", current: false },
      ],
    });
  });

  it("fails closed for guardians, foreign refs and revoked assignments", async () => {
    const scope = await seedScope();
    const classRef = await resolveClassRef(scope);

    // The seeded guardian participant of the same workspace has no caregiver
    // role; the resolver must close with a purging mask.
    const guardianUser = await prisma.nurtureParticipant.findUniqueOrThrow({
      where: { id: scope.participantId },
      select: { myChatUserId: true },
    });
    const guardianDecision = await binding.authorityResolver.resolve({
      workspace_id: scope.workspaceId,
      my_chat_user_id: guardianUser.myChatUserId,
      host_request_id: `req-guardian-${scope.runId}`,
      context_ref: `context:guardian:${scope.runId}`,
      operation: "child_strip_query",
      class_ref: classRef,
    });
    expect(guardianDecision.status).toBe("closed");
    if (guardianDecision.status === "closed") {
      expect(guardianDecision.response).toMatchObject({
        status: "masked",
        mask_signal: { reason_code: "access_changed" },
      });
    }

    const foreign = await binding.authorityResolver.resolve({
      ...requestOf(scope),
      operation: "schedule_query",
      class_ref: "1.ffffffffffffffffffffffffffffffff",
    });
    expect(foreign.status).toBe("closed");

    await prisma.nurtureCareRoleAssignment.updateMany({
      where: { workspaceId: scope.workspaceId, scopeId: scope.careGroupId, role: "lead_caregiver" },
      data: { status: "revoked" },
    });
    const revoked = await binding.authorityResolver.resolve({
      ...requestOf(scope),
      operation: "child_strip_query",
      class_ref: classRef,
    });
    expect(revoked.status).toBe("closed");
  });

  it("reports an owner-confirmed schedule absence and a malformed payload", async () => {
    const scope = await seedScope();
    const classRef = await resolveClassRef(scope);
    await prisma.nurtureClassScheduleDayOverride.deleteMany({
      where: { workspaceId: scope.workspaceId, careGroupId: scope.careGroupId },
    });
    const request = requestOf(scope);
    const authority = await binding.authorityResolver.resolve({
      ...request,
      operation: "schedule_query",
      class_ref: classRef,
    });
    if (authority.status !== "resolved") throw new Error("unresolved");
    const absent = await binding.owner.schedule({
      request: { ...request, class_ref: classRef, local_date: LOCAL_DATE },
      authority: authority.owner_resolution,
    });
    assertPublishedTeacherClassStreamResponse("schedule_query", absent);
    expect(absent).toMatchObject({ resolution: "none", schedule_version_head: 0, slots: [] });

    await prisma.nurtureClassScheduleDayOverride.create({
      data: {
        workspaceId: scope.workspaceId,
        careGroupId: scope.careGroupId,
        localDate: DAY,
        slotsPayload: [{ slotRef: "bad", label: "坏时段", startsAt: "25:99", endsAt: "26:00" }],
        aggregateVersion: 1,
      },
    });
    const malformed = await binding.owner.schedule({
      request: { ...request, class_ref: classRef, local_date: LOCAL_DATE },
      authority: authority.owner_resolution,
    });
    expect(malformed).toMatchObject({
      status: "unavailable",
      reason_code: "content_unavailable",
      retryable: false,
    });
  });
});
