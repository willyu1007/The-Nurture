import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { createPrismaClient } from "../src/client.js";
import { createPrismaParentContextPresenterBinding } from "../src/parent-context-presenter.composition.js";
import { seedT010FamilySharingFixture } from "./helpers/t010-family-sharing-fixture.js";
import { assertPublishedParentContextPresenterResponse } from "../../../apps/scenario-service/src/parent-context-presenter-response-validator.js";
import {
  formatNurtureBindingOwnerRef,
  MY_CHAT_PARENT_CONTEXT_SELECTION_INTERFACE,
} from "@the-nurture/scenario";

const prisma = createPrismaClient();
const INTEGRITY_KEY = "t011-parent-context-presenter-integrity-key-32";
const LOCAL_DATE = "2026-08-14";
const DAY = new Date(`${LOCAL_DATE}T00:00:00.000Z`);
const NOW = new Date("2026-08-15T09:00:00.000Z");

afterAll(async () => {
  await prisma.$disconnect();
});

const seedScope = async () => {
  const base = await prisma.$transaction((transaction) =>
    seedT010FamilySharingFixture(transaction, "t011-parent-context-presenter"));
  const caregiver = await prisma.nurtureParticipant.create({
    data: {
      workspaceId: base.workspaceId,
      myChatUserId: `t011-w2-caregiver-${base.runId}`,
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
      status: "active",
      aggregateVersion: 3,
    },
  });
  const grant = await prisma.nurtureChildLinkGrant.create({
    data: {
      workspaceId: base.workspaceId,
      childCareProcessId: base.processId,
      enrollmentId: base.enrollmentId,
      grantedByParticipantId: base.participantId,
      grantedToScopeType: "care_group",
      grantedToScopeId: base.careGroupId,
      directions: ["org_to_family"],
      dataClasses: ["daily_care_log"],
      purposes: ["family_daily_care_update"],
      status: "active",
      aggregateVersion: 4,
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
      aggregateVersion: 5,
    },
  });
  await prisma.nurtureFamilyCareThreadParticipant.create({
    data: {
      workspaceId: base.workspaceId,
      threadId: thread.id,
      participantId: base.participantId,
      roleAssignmentId: base.roleAssignmentId,
      participantKind: "guardian",
      visibilityStatus: "active",
      aggregateVersion: 6,
    },
  });
  const log = await prisma.nurtureDailyCareLog.create({
    data: {
      workspaceId: base.workspaceId,
      childCareProcessId: base.processId,
      enrollmentId: base.enrollmentId,
      careGroupId: base.careGroupId,
      recordedByRoleAssignmentId: caregiverRole.id,
      logDate: DAY,
      mealPayload: { summary: "早餐吃得很好" },
      napPayload: { minutes: 80 },
      activityPayload: "raw-activity-code",
      moodPayload: 5,
      healthObservationPayload: { diagnostic_code: "must-not-display" },
      summary: "早餐完成，午睡 80 分钟",
      status: "shared",
      grantId: grant.id,
      aggregateVersion: 7,
      updatedAt: new Date(`${LOCAL_DATE}T04:30:00.000Z`),
    },
  });
  await prisma.nurtureDailyAttendanceSubmission.create({
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
        },
      },
    },
  });
  const notice = await prisma.nurtureChildLinkReceipt.create({
    data: {
      workspaceId: base.workspaceId,
      grantId: grant.id,
      childCareProcessId: base.processId,
      enrollmentId: base.enrollmentId,
      direction: "org_to_family",
      dataClass: "daily_care_log",
      sourceType: "daily_care_log",
      sourceId: log.id,
      routingAttemptKey: `w2-notice-${base.runId}`,
      targetScopeType: "enrollment",
      targetScopeId: base.enrollmentId,
      status: "delivered",
      version: 2,
      deliveredAt: new Date(`${LOCAL_DATE}T04:31:00.000Z`),
    },
  });
  return {
    ...base,
    grant,
    thread,
    log,
    notice,
    binding: createPrismaParentContextPresenterBinding({
      prisma,
      integrityKey: INTEGRITY_KEY,
      now: () => NOW,
    }),
  };
};

const identityOf = (scope: Awaited<ReturnType<typeof seedScope>>) => ({
  workspace_id: scope.workspaceId,
  my_chat_user_id: scope.myChatUserId,
  host_request_id: `host-${randomUUID()}`,
  context_ref: `context:${scope.runId}`,
});

const selectionOf = (
  scope: Awaited<ReturnType<typeof seedScope>>,
  identity: ReturnType<typeof identityOf>,
) => ({
  interface_contract: MY_CHAT_PARENT_CONTEXT_SELECTION_INTERFACE,
  workspace_id: identity.workspace_id,
  my_chat_user_id: identity.my_chat_user_id,
  host_request_id: identity.host_request_id,
  context_ref: identity.context_ref,
  context_version: `parent-context:${scope.runId}`,
  child_binding: {
    owner_ref: formatNurtureBindingOwnerRef("child", scope.childAnchorId),
    owner_version: 4,
  },
  family_binding: {
    owner_ref: formatNurtureBindingOwnerRef("family", scope.familyAnchorId),
    owner_version: 5,
  },
});

const resolvedAuthority = async (
  scope: Awaited<ReturnType<typeof seedScope>>,
  operation: Parameters<typeof scope.binding.authorityResolver.resolve>[0]["operation"],
) => {
  const identity = identityOf(scope);
  const resolved = await scope.binding.authorityResolver.resolve({
    operation,
    ...identity,
    context_selection: selectionOf(scope, identity),
  });
  expect(resolved.status).toBe("resolved");
  if (resolved.status !== "resolved") throw new Error("W2 authority did not resolve");
  return resolved.authority;
};

const record = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("expected record");
  }
  return value as Record<string, unknown>;
};

describe("T-011 W2 parent-context presenter real owner ports", () => {
  it("projects shared daily care, activity detail and canonical attendance", async () => {
    const scope = await seedScope();
    const identity = identityOf(scope);
    const dayAuthority = await resolvedAuthority(scope, "day_query");
    const day = record(await scope.binding.owner.present({
      operation: "day_query",
      request: { ...identity, local_date: LOCAL_DATE },
      authority: dayAuthority,
    }));
    assertPublishedParentContextPresenterResponse("day_query", day);
    expect(day).toMatchObject({
      status: "ready",
      day: { selected_date: LOCAL_DATE },
      activities: [{ title_display: "活动记录", media_state: "none" }],
    });

    const dailyAuthority = await resolvedAuthority(scope, "daily_care_cards_query");
    const dailyCare = record(await scope.binding.owner.present({
      operation: "daily_care_cards_query",
      request: { ...identity, local_date: LOCAL_DATE },
      authority: dailyAuthority,
    }));
    assertPublishedParentContextPresenterResponse("daily_care_cards_query", dailyCare);
    expect(dailyCare.cards).toHaveLength(5);
    expect(dailyCare).toMatchObject({
      status: "ready",
      cards: [
        { label: "饮食", value_state: "provided", value_display: "早餐吃得很好" },
        { label: "午睡", value_state: "provided", value_display: "80 分钟" },
        { label: "活动", value_state: "missing" },
        { label: "情绪", value_state: "missing" },
        { label: "健康观察", value_state: "missing" },
      ],
    });

    const activityRef = String((day.activities as Array<Record<string, unknown>>)[0]!.activity_ref);
    const detailAuthority = await resolvedAuthority(scope, "activity_detail_query");
    const detail = record(await scope.binding.owner.present({
      operation: "activity_detail_query",
      request: { ...identity, local_date: LOCAL_DATE, activity_ref: activityRef },
      authority: detailAuthority,
    }));
    assertPublishedParentContextPresenterResponse("activity_detail_query", detail);
    expect(detail).toMatchObject({
      status: "ready",
      activity: {
        activity_ref: activityRef,
        summary_display: "早餐完成，午睡 80 分钟",
        media_state: "none",
        media: [],
      },
    });

    const freshnessAuthority = await resolvedAuthority(
      scope,
      "freshness_attendance_projection",
    );
    const freshness = record(await scope.binding.owner.present({
      operation: "freshness_attendance_projection",
      request: { ...identity, local_date: LOCAL_DATE },
      authority: freshnessAuthority,
    }));
    assertPublishedParentContextPresenterResponse(
      "freshness_attendance_projection",
      freshness,
    );
    expect(freshness).toMatchObject({
      status: "ready",
      freshness: { state: "fresh", read_only: false },
      attendance: { display_state: "present", source_display: "园所考勤记录" },
    });
  });

  it("prepares, commits and exactly replays one notice read", async () => {
    const scope = await seedScope();
    await prisma.nurtureChildLinkReceipt.create({
      data: {
        workspaceId: scope.workspaceId,
        grantId: scope.grant.id,
        childCareProcessId: scope.processId,
        enrollmentId: scope.enrollmentId,
        direction: "org_to_family",
        dataClass: "daily_care_log",
        sourceType: "system_summary",
        sourceId: `blocked-${scope.runId}`,
        routingAttemptKey: `w2-blocked-${scope.runId}`,
        targetScopeType: "enrollment",
        targetScopeId: scope.enrollmentId,
        status: "blocked",
        reasonCode: "policy_blocked_fixture",
        version: 1,
      },
    });
    const identity = identityOf(scope);
    const listAuthority = await resolvedAuthority(scope, "notice_list_and_confirmation");
    const listed = record(await scope.binding.owner.present({
      operation: "notice_list_and_confirmation",
      request: { ...identity, kind: "list", page_size: 20 },
      authority: listAuthority,
    }));
    assertPublishedParentContextPresenterResponse(
      "notice_list_and_confirmation",
      listed,
    );
    const notice = (listed.notices as Array<Record<string, unknown>>)[0]!;
    const action = notice.action as Record<string, unknown>;
    expect(listed.notices).toHaveLength(1);
    expect(notice).toMatchObject({
      display_status: "action_required",
      action: { label: "标记已读", action_semantics: "confirm_notice" },
    });

    const prepareAuthority = await resolvedAuthority(scope, "notice_list_and_confirmation");
    const prepared = record(await scope.binding.owner.present({
      operation: "notice_list_and_confirmation",
      request: {
        ...identity,
        kind: "prepare_confirmation",
        notice_ref: String(notice.notice_ref),
        action_ref: String(action.action_ref),
        action_version: Number(action.action_version),
        expected_notice_version: Number(notice.notice_version),
      },
      authority: prepareAuthority,
    }));
    assertPublishedParentContextPresenterResponse(
      "notice_list_and_confirmation",
      prepared,
    );
    expect(prepared).toMatchObject({
      status: "ready_to_confirm",
      preview: { effect: "confirm_notice", title: "确认已读" },
    });
    await expect(prisma.nurtureChildLinkReceipt.findUniqueOrThrow({
      where: { id: scope.notice.id },
    })).resolves.toMatchObject({ status: "delivered", version: 2 });

    const confirmRequest = {
      ...identity,
      kind: "confirm" as const,
      invocation_request_id: `invoke-${randomUUID()}`,
      command_request_id: String(prepared.command_request_id),
      confirmation_ref: String(prepared.confirmation_ref),
      action_ref: String(prepared.action_ref),
      action_version: Number(prepared.action_version),
      prepared_preview_digest: String(prepared.prepared_preview_digest),
    };
    const confirmAuthority = await resolvedAuthority(scope, "notice_list_and_confirmation");
    const committed = record(await scope.binding.owner.present({
      operation: "notice_list_and_confirmation",
      request: confirmRequest,
      authority: confirmAuthority,
    }));
    assertPublishedParentContextPresenterResponse(
      "notice_list_and_confirmation",
      committed,
    );
    expect(committed).toMatchObject({
      status: "committed",
      execution_disposition: "executed",
      business_outcome: "applied",
      committed_result: {
        notice_ref: notice.notice_ref,
        display_status: "read",
      },
    });
    await expect(prisma.nurtureChildLinkReceipt.findUniqueOrThrow({
      where: { id: scope.notice.id },
    })).resolves.toMatchObject({ status: "read", version: 3 });

    const replay = record(await scope.binding.owner.present({
      operation: "notice_list_and_confirmation",
      request: confirmRequest,
      authority: confirmAuthority,
    }));
    assertPublishedParentContextPresenterResponse(
      "notice_list_and_confirmation",
      replay,
    );
    expect(replay).toMatchObject({
      status: "committed",
      execution_disposition: "replayed",
      business_outcome: "applied",
      committed_result: { notice_ref: notice.notice_ref, display_status: "read" },
    });
    await expect(prisma.nurtureChildLinkReceipt.findUniqueOrThrow({
      where: { id: scope.notice.id },
    })).resolves.toMatchObject({ status: "read", version: 3 });
  });

  it("uses the explicit enrollment mapping and fails closed when it or authority changes", async () => {
    const mapped = await seedScope();
    const secondInstitution = await prisma.nurtureCareInstitution.create({
      data: {
        workspaceId: mapped.workspaceId,
        displayName: "第二园所",
        status: "active",
      },
    });
    const secondGroup = await prisma.nurtureCareGroup.create({
      data: {
        workspaceId: mapped.workspaceId,
        institutionId: secondInstitution.id,
        name: "第二班级",
        status: "active",
      },
    });
    await prisma.nurtureEnrollment.create({
      data: {
        workspaceId: mapped.workspaceId,
        childCareProcessId: mapped.processId,
        institutionId: secondInstitution.id,
        careGroupId: secondGroup.id,
        status: "active",
        participationPhase: "formal",
      },
    });
    await prisma.nurtureCareRoleAssignment.create({
      data: {
        workspaceId: mapped.workspaceId,
        participantId: mapped.participantId,
        role: "guardian",
        scopeType: "family",
        scopeId: mapped.familyId,
        status: "active",
      },
    });
    const mappedIdentity = identityOf(mapped);
    await expect(mapped.binding.authorityResolver.resolve({
      operation: "day_query",
      ...mappedIdentity,
      context_selection: selectionOf(mapped, mappedIdentity),
    })).resolves.toMatchObject({
      status: "resolved",
      authority: { enrollment_ref: mapped.enrollmentId },
    });

    const staleBindingIdentity = identityOf(mapped);
    await expect(mapped.binding.authorityResolver.resolve({
      operation: "day_query",
      ...staleBindingIdentity,
      context_selection: {
        ...selectionOf(mapped, staleBindingIdentity),
        child_binding: {
          ...selectionOf(mapped, staleBindingIdentity).child_binding,
          owner_version: 3,
        },
      },
    })).resolves.toEqual({ status: "stale_context_ref" });

    await prisma.nurtureParentContextEnrollmentSelection.delete({
      where: {
        workspaceId_childCareProcessId: {
          workspaceId: mapped.workspaceId,
          childCareProcessId: mapped.processId,
        },
      },
    });
    const missingSelectionIdentity = identityOf(mapped);
    await expect(mapped.binding.authorityResolver.resolve({
      operation: "day_query",
      ...missingSelectionIdentity,
      context_selection: selectionOf(mapped, missingSelectionIdentity),
    })).resolves.toEqual({ status: "ambiguous_enrollment" });

    const revoked = await seedScope();
    const authority = await resolvedAuthority(revoked, "day_query");
    const wrongContext = record(await revoked.binding.owner.present({
      operation: "day_query",
      request: {
        ...identityOf(revoked),
        context_ref: `foreign-${revoked.runId}`,
        local_date: LOCAL_DATE,
      },
      authority,
    }));
    assertPublishedParentContextPresenterResponse("day_query", wrongContext);
    expect(wrongContext).toMatchObject({
      status: "masked",
      context_ref: `foreign-${revoked.runId}`,
    });

    await prisma.nurtureCareRoleAssignment.update({
      where: { id: revoked.roleAssignmentId },
      data: { status: "revoked", aggregateVersion: { increment: 1 } },
    });
    const response = record(await revoked.binding.owner.present({
      operation: "day_query",
      request: { ...identityOf(revoked), local_date: LOCAL_DATE },
      authority,
    }));
    assertPublishedParentContextPresenterResponse("day_query", response);
    expect(response).toMatchObject({
      status: "masked",
      mask_signal: { reason_code: "access_changed", purge_partition: true },
    });
  });
});
