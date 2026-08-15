import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import {
  DIRECTOR_PRESENTER_INTERFACE,
  type DirectorPresenterExactAuthorityV1,
  type DirectorPresenterOperation,
} from "@the-nurture/scenario";
import { assertPublishedDirectorPresenterResponse } from "../../../apps/scenario-service/src/director-presenter-response-validator.js";
import { createPrismaClient } from "../src/client.js";
import { createPrismaDirectorPresenterBinding } from "../src/director-presenter.composition.js";
import { seedT010FamilySharingFixture } from "./helpers/t010-family-sharing-fixture.js";

const prisma = createPrismaClient();
const INTEGRITY_KEY = "t011-director-presenter-integrity-key-32";
const LOCAL_DATE = "2026-08-15";
const DAY = new Date(`${LOCAL_DATE}T00:00:00.000Z`);
const NOW = new Date(`${LOCAL_DATE}T12:00:00.000Z`);

afterAll(async () => {
  await prisma.$disconnect();
});

type Scope = Awaited<ReturnType<typeof seedScope>>;

const seedScope = async (input: {
  label: string;
  directorUserId?: string;
}) => {
  const base = await prisma.$transaction((transaction) =>
    seedT010FamilySharingFixture(
      transaction,
      `t011-director-${input.label.toLowerCase()}`,
    ));
  await prisma.nurtureCareInstitution.update({
    where: { id: base.institutionId },
    data: { displayName: `Director ${input.label} Institution` },
  });
  const director = await prisma.nurtureParticipant.create({
    data: {
      workspaceId: base.workspaceId,
      myChatUserId: input.directorUserId ?? `director-${base.runId}`,
      displayName: `Director ${input.label}`,
      status: "active",
      aggregateVersion: 2,
    },
  });
  const directorRole = await prisma.nurtureCareRoleAssignment.create({
    data: {
      workspaceId: base.workspaceId,
      participantId: director.id,
      role: "institution_admin",
      scopeType: "institution",
      scopeId: base.institutionId,
      displayLabel: "园长",
      status: "active",
      aggregateVersion: 3,
    },
  });
  await prisma.nurtureInstitutionPublicationPolicy.create({
    data: {
      workspaceId: base.workspaceId,
      institutionId: base.institutionId,
      policyRef: "nurture.institution-publication-policy@1.0.0",
      policyVersion: 1,
      policyHead: 1,
      timeZone: "UTC",
      defaultReleaseLocalTime: "17:00",
      retryCutoffLocalTime: "19:00",
      organizeIdleSeconds: 600,
      organizeFallbackLeadSeconds: 1_800,
      automaticQuiescenceSeconds: 60,
      captureActivityLeaseSeconds: 60,
      automaticOrganizeEnabled: false,
      effectiveFrom: new Date("2026-01-01T00:00:00.000Z"),
    },
  });
  await prisma.nurtureInstitutionSupportSignalPolicy.create({
    data: {
      workspaceId: base.workspaceId,
      institutionId: base.institutionId,
      contractVersion: "1.0.0",
      policyRef: `policy:configured-load:${base.runId}`,
      category: "configured_load_threshold",
      absoluteThreshold: 1,
      windowKey: `local-day:${LOCAL_DATE}`,
      checkpointRef: "family-care:pending-work",
      enabled: true,
      policyRevision: 1,
      effectiveFrom: new Date("2026-01-01T00:00:00.000Z"),
      changedByRoleAssignmentId: directorRole.id,
      changeReason: "W4 disposable owner qualification",
    },
  });
  await prisma.nurtureDailyAttendanceSubmission.create({
    data: {
      workspaceId: base.workspaceId,
      careGroupId: base.careGroupId,
      localDate: DAY,
      state: "submitted",
      submittedByRoleAssignmentId: directorRole.id,
      submittedAt: new Date(`${LOCAL_DATE}T01:00:00.000Z`),
      entries: {
        create: {
          workspaceId: base.workspaceId,
          childCareProcessId: base.processId,
          state: "present",
          aggregateVersion: 1,
        },
      },
    },
  });
  await prisma.nurtureActivityPlacement.createMany({
    data: [
      {
        workspaceId: base.workspaceId,
        sourceKind: "daily_care_log",
        sourceId: `activity-a-${base.runId}`,
        careGroupId: base.careGroupId,
        localDate: DAY,
        state: "placed",
        activityRef: "morning",
        decidedBy: "source_binding",
      },
      {
        workspaceId: base.workspaceId,
        sourceKind: "care_capture",
        sourceId: `activity-b-${base.runId}`,
        careGroupId: base.careGroupId,
        localDate: DAY,
        state: "placed",
        activityRef: "outdoor",
        decidedBy: "source_binding",
      },
    ],
  });
  const questionGrant = await prisma.nurtureChildLinkGrant.create({
    data: {
      workspaceId: base.workspaceId,
      childCareProcessId: base.processId,
      enrollmentId: base.enrollmentId,
      grantedByParticipantId: base.participantId,
      grantedToScopeType: "care_group",
      grantedToScopeId: base.careGroupId,
      directions: ["family_to_org"],
      dataClasses: ["family_care_question"],
      purposes: ["family_care_workflow", "family_communication"],
      policySnapshotPayload: {
        institution_admin_business_communication: {
          schema_version: 1,
          disclosed: true,
          institution_id: base.institutionId,
          enrollment_id: base.enrollmentId,
          care_group_id: base.careGroupId,
          directions: ["family_to_org"],
          data_classes: ["family_care_question"],
          purposes: ["family_care_workflow"],
        },
      },
      status: "active",
      effectiveFrom: new Date(`${LOCAL_DATE}T00:00:00.000Z`),
      aggregateVersion: 4,
      createdAt: new Date(`${LOCAL_DATE}T02:00:00.000Z`),
      updatedAt: new Date(`${LOCAL_DATE}T02:00:00.000Z`),
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
      aggregateVersion: 2,
    },
  });
  const familyMessage = await prisma.nurtureFamilyCareMessage.create({
    data: {
      workspaceId: base.workspaceId,
      threadId: thread.id,
      childCareProcessId: base.processId,
      senderParticipantId: base.participantId,
      senderRoleAssignmentId: base.roleAssignmentId,
      messageKind: "family_message",
      authorshipKind: "family_authored",
      bodyFormat: "plain_text",
      bodyStorageMode: "protected",
      sourceSurface: "mobile",
      grantId: questionGrant.id,
      status: "sent",
      writerContract: "harness_g2_v1",
      enrollmentId: base.enrollmentId,
      careGroupId: base.careGroupId,
      direction: "family_to_org",
      replyOrderKey: `question-${base.runId}`,
      createdAt: new Date(`${LOCAL_DATE}T03:00:00.000Z`),
      updatedAt: new Date(`${LOCAL_DATE}T03:00:00.000Z`),
    },
  });
  const priorFamilyMessage = await prisma.nurtureFamilyCareMessage.create({
    data: {
      workspaceId: base.workspaceId,
      threadId: thread.id,
      childCareProcessId: base.processId,
      senderParticipantId: base.participantId,
      senderRoleAssignmentId: base.roleAssignmentId,
      messageKind: "family_message",
      authorshipKind: "family_authored",
      bodyFormat: "plain_text",
      bodyStorageMode: "protected",
      sourceSurface: "mobile",
      grantId: questionGrant.id,
      status: "sent",
      writerContract: "harness_g2_v1",
      enrollmentId: base.enrollmentId,
      careGroupId: base.careGroupId,
      direction: "family_to_org",
      replyOrderKey: `prior-question-${base.runId}`,
      createdAt: new Date("2026-08-14T23:00:00.000Z"),
      updatedAt: new Date("2026-08-14T23:00:00.000Z"),
    },
  });
  await prisma.nurtureFamilyCareMessage.create({
    data: {
      workspaceId: base.workspaceId,
      threadId: thread.id,
      childCareProcessId: base.processId,
      senderParticipantId: director.id,
      senderRoleAssignmentId: directorRole.id,
      messageKind: "caregiver_reply",
      authorshipKind: "caregiver_confirmed",
      bodyFormat: "plain_text",
      bodyStorageMode: "protected",
      sourceSurface: "web",
      status: "sent",
      writerContract: "harness_g2_v1",
      enrollmentId: base.enrollmentId,
      careGroupId: base.careGroupId,
      direction: "org_to_family",
      replyOrderKey: `reply-${base.runId}`,
      createdAt: new Date(`${LOCAL_DATE}T04:00:00.000Z`),
      updatedAt: new Date(`${LOCAL_DATE}T04:00:00.000Z`),
    },
  });
  await prisma.nurtureFamilyCareItem.createMany({
    data: [
      {
        workspaceId: base.workspaceId,
        sourceMessageId: familyMessage.id,
        threadId: thread.id,
        childCareProcessId: base.processId,
        familyId: base.familyId,
        enrollmentId: base.enrollmentId,
        careGroupId: base.careGroupId,
        dataClass: "family_care_question",
        category: "question",
        summary: "待回复问题",
        urgency: "normal",
        requiresReply: true,
        status: "open",
        classificationSource: "manual",
        grantId: questionGrant.id,
        writerContract: "harness_g2_v1",
        responseState: "awaiting_reply",
        lifecycleState: "active",
        createdAt: new Date(`${LOCAL_DATE}T03:01:00.000Z`),
        updatedAt: new Date(`${LOCAL_DATE}T03:01:00.000Z`),
      },
      {
        workspaceId: base.workspaceId,
        sourceMessageId: priorFamilyMessage.id,
        threadId: thread.id,
        childCareProcessId: base.processId,
        familyId: base.familyId,
        enrollmentId: base.enrollmentId,
        careGroupId: base.careGroupId,
        dataClass: "family_care_question",
        category: "question",
        summary: "已回复问题",
        urgency: "normal",
        requiresReply: true,
        status: "replied",
        classificationSource: "manual",
        grantId: questionGrant.id,
        writerContract: "harness_g2_v1",
        responseState: "responded",
        lifecycleState: "active",
        createdAt: new Date(`${LOCAL_DATE}T05:00:00.000Z`),
        updatedAt: new Date(`${LOCAL_DATE}T05:00:00.000Z`),
      },
    ],
  });
  const focusCycle = await prisma.nurtureFocusCycle.create({
    data: {
      workspaceId: base.workspaceId,
      familyRefKey: `family:${base.familyId}`,
      familyRef: { kind: "family", id: base.familyId },
      status: "active",
      aggregateVersion: 1,
    },
  });
  const focusGoal = await prisma.nurtureFocusGoal.create({
    data: {
      workspaceId: base.workspaceId,
      focusCycleId: focusCycle.id,
      familyRefKey: `family:${base.familyId}`,
      goalKey: `goal:${base.runId}`,
      aggregateVersion: 1,
      createdAt: new Date(`${LOCAL_DATE}T06:00:00.000Z`),
      updatedAt: new Date(`${LOCAL_DATE}T06:00:00.000Z`),
    },
  });
  await prisma.nurtureFocusGoalChildScope.create({
    data: {
      workspaceId: base.workspaceId,
      focusGoalId: focusGoal.id,
      childCareProcessId: base.processId,
      scopeVersion: 1,
      aggregateVersion: 1,
    },
  });

  return {
    ...base,
    director,
    directorRole,
    binding: createPrismaDirectorPresenterBinding({
      prisma,
      integrityKey: INTEGRITY_KEY,
      now: () => NOW,
    }),
  };
};

const identityOf = (scope: Scope) => ({
  interface_contract: DIRECTOR_PRESENTER_INTERFACE,
  workspace_id: scope.workspaceId,
  my_chat_user_id: scope.director.myChatUserId,
  host_request_id: `host-${randomUUID()}`,
  context_ref: `context:${scope.runId}`,
});

const resolveAuthority = async (
  scope: Scope,
  operation: DirectorPresenterOperation,
): Promise<DirectorPresenterExactAuthorityV1> => {
  const result = await scope.binding.authorityResolver.resolve({
    ...identityOf(scope),
    operation,
  });
  expect(result.status).toBe("resolved");
  if (result.status !== "resolved") throw new Error("W4 authority did not resolve");
  return result.owner_resolution;
};

const asRecord = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("expected record");
  }
  return value as Record<string, unknown>;
};

const section = (
  overview: Record<string, unknown>,
  sectionKey: string,
): Record<string, unknown> => {
  const found = (overview.sections as Array<Record<string, unknown>>)
    .find((candidate) => candidate.section_key === sectionKey);
  if (!found) throw new Error(`missing W4 section ${sectionKey}`);
  return found;
};

describe("T-011 W4 director presenter real owner ports", () => {
  it("projects canonical institution facts and bounded drilldowns", async () => {
    const scope = await seedScope({ label: "Canonical" });
    const identity = identityOf(scope);
    const authority = await resolveAuthority(scope, "overview_query");
    const overview = asRecord(await scope.binding.owner.overview({
      request: { ...identity, local_date: LOCAL_DATE },
      authority,
    }));
    assertPublishedDirectorPresenterResponse("overview_query", overview);

    expect(overview).toMatchObject({
      status: "ready",
      overall_state: "partial",
      organization: {
        display_name: "Director Canonical Institution",
        local_date: LOCAL_DATE,
      },
    });
    expect(section(overview, "attendance")).toMatchObject({
      status: "ready",
      metric: { primary_value: 1, secondary_value: 1, unit: "ratio" },
    });
    expect(section(overview, "activity")).toMatchObject({
      status: "ready",
      metric: { primary_value: 2 },
    });
    expect(section(overview, "message_response")).toMatchObject({
      status: "ready",
      metric: { primary_value: 1, secondary_value: 2 },
    });
    expect(section(overview, "home_kindergarten_flow")).toMatchObject({
      status: "ready",
      metric: { primary_value: 1, secondary_value: 1 },
    });
    expect(section(overview, "authorization_changes")).toMatchObject({
      status: "ready",
      metric: { primary_value: 1 },
    });
    expect(section(overview, "class_load_attention")).toMatchObject({
      status: "ready",
      metric: { primary_value: 1 },
    });
    expect(section(overview, "family_focus_attention")).toMatchObject({
      status: "ready",
      metric: { primary_value: 1 },
    });
    expect(section(overview, "philosophy_observation")).toMatchObject({
      status: "unavailable",
    });
    expect(section(overview, "organized_materials")).toMatchObject({
      status: "unavailable",
    });

    const drilldownRef = String(section(overview, "attendance").drilldown_ref);
    const drilldown = await scope.binding.owner.drilldown({
      request: { ...identity, drilldown_ref: drilldownRef },
      authority,
    });
    assertPublishedDirectorPresenterResponse("drilldown_query", drilldown);
    expect(drilldown).toMatchObject({
      status: "ready",
      items: [{ label: "T010 synthetic group", summary: "1/1 人已到园。" }],
    });

    const materials = await scope.binding.owner.materials({
      request: { ...identity, collection_ref: "opaque-material-collection" },
      authority,
    });
    assertPublishedDirectorPresenterResponse("material_query", materials);
    expect(materials).toMatchObject({
      status: "masked",
      mask_signal: { reason_code: "protected_material_denied" },
    });
  });

  it("closes both old and new reads after exact role revocation", async () => {
    const scope = await seedScope({ label: "Revoked" });
    const authority = await resolveAuthority(scope, "overview_query");
    await prisma.nurtureCareRoleAssignment.update({
      where: { id: scope.directorRole.id },
      data: { status: "revoked" },
    });

    const response = await scope.binding.owner.overview({
      request: { ...identityOf(scope), local_date: LOCAL_DATE },
      authority,
    });
    assertPublishedDirectorPresenterResponse("overview_query", response);
    expect(response).toMatchObject({
      status: "masked",
      mask_signal: { reason_code: "access_changed" },
    });
    await expect(scope.binding.authorityResolver.resolve({
      ...identityOf(scope),
      operation: "overview_query",
    })).resolves.toMatchObject({
      status: "closed",
      response: {
        status: "masked",
        mask_signal: { reason_code: "access_changed" },
      },
    });
  });

  it("isolates workspaces and closes an ambiguous authority mapping", async () => {
    const sharedUserId = `shared-director-${randomUUID()}`;
    const left = await seedScope({ label: "Left", directorUserId: sharedUserId });
    const right = await seedScope({ label: "Right", directorUserId: sharedUserId });
    const leftAuthority = await resolveAuthority(left, "overview_query");
    const rightAuthority = await resolveAuthority(right, "overview_query");
    const leftOverview = asRecord(await left.binding.owner.overview({
      request: { ...identityOf(left), local_date: LOCAL_DATE },
      authority: leftAuthority,
    }));
    const rightOverview = asRecord(await right.binding.owner.overview({
      request: { ...identityOf(right), local_date: LOCAL_DATE },
      authority: rightAuthority,
    }));
    expect(leftOverview).toMatchObject({
      organization: { display_name: "Director Left Institution" },
    });
    expect(rightOverview).toMatchObject({
      organization: { display_name: "Director Right Institution" },
    });
    expect(leftOverview).not.toEqual(rightOverview);

    await expect(left.binding.owner.overview({
      request: {
        ...identityOf(left),
        workspace_id: right.workspaceId,
        local_date: LOCAL_DATE,
      },
      authority: leftAuthority,
    })).resolves.toMatchObject({
      status: "masked",
      mask_signal: { reason_code: "access_changed" },
    });

    const ambiguousInstitution = await prisma.nurtureCareInstitution.create({
      data: {
        workspaceId: left.workspaceId,
        displayName: "Director Ambiguous Institution",
        status: "active",
      },
    });
    await prisma.nurtureCareRoleAssignment.create({
      data: {
        workspaceId: left.workspaceId,
        participantId: left.director.id,
        role: "institution_admin",
        scopeType: "institution",
        scopeId: ambiguousInstitution.id,
        status: "active",
      },
    });
    await expect(left.binding.authorityResolver.resolve({
      ...identityOf(left),
      operation: "overview_query",
    })).resolves.toMatchObject({
      status: "closed",
      response: {
        status: "masked",
        mask_signal: { reason_code: "ambiguous_institution" },
      },
    });
  });
});
