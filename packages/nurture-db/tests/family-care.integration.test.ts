import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import {
  NurtureCommandRunner,
  NurtureInstitutionWorkQueryService,
  acknowledgeFamilyCareItemSpec,
  cancelFamilyCareRouteSpec,
  familyCareRef,
  defaultNurtureDeps,
  readInstitutionSurface,
  familyInputRouteSpec,
  redactFamilyCareMessageSpec,
  replyFamilyCareItemSpec,
  revokeFamilyCareGrantSpec,
  type NurtureCommandSpec,
  type NurtureCommandHandoffActivation,
  type NurtureResolvedContext,
} from "@the-nurture/scenario";
import { createPrismaClient } from "../src/client.js";
import { createNurtureRepositories } from "../src/index.js";

const prisma = createPrismaClient();
const repositories = createNurtureRepositories(prisma);

afterAll(async () => {
  await prisma.$disconnect();
});

type Fixture = Awaited<ReturnType<typeof seedFixture>>;

const seedFixture = async () => {
  const workspaceId = randomUUID();
  const guardian = await prisma.nurtureParticipant.create({
    data: {
      workspaceId,
      myChatUserId: `guardian:${workspaceId}`,
      displayName: "Guardian",
      status: "active",
    },
  });
  const caregiver = await prisma.nurtureParticipant.create({
    data: {
      workspaceId,
      myChatUserId: `caregiver:${workspaceId}`,
      displayName: "Caregiver",
      status: "active",
    },
  });
  const child = await prisma.nurtureChild.create({
    data: { workspaceId, displayName: "Child A", status: "active" },
  });
  const process = await prisma.nurtureChildCareProcess.create({
    data: { workspaceId, childId: child.id, status: "active" },
  });
  const family = await prisma.nurtureFamily.create({
    data: {
      workspaceId,
      childCareProcessId: process.id,
      displayName: "Family A",
      status: "active",
    },
  });
  await prisma.nurtureChildCareProcess.update({
    where: { id: process.id },
    data: { primaryFamilyId: family.id },
  });
  const institution = await prisma.nurtureCareInstitution.create({
    data: {
      workspaceId,
      displayName: "Care Center",
      status: "active",
      createdByParticipantId: caregiver.id,
    },
  });
  const group = await prisma.nurtureCareGroup.create({
    data: {
      workspaceId,
      institutionId: institution.id,
      name: "Class A",
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
      joinedAt: new Date(),
    },
  });
  const guardianRole = await prisma.nurtureCareRoleAssignment.create({
    data: {
      workspaceId,
      participantId: guardian.id,
      role: "guardian",
      scopeType: "child_care_process",
      scopeId: process.id,
      status: "active",
    },
  });
  const caregiverRole = await prisma.nurtureCareRoleAssignment.create({
    data: {
      workspaceId,
      participantId: caregiver.id,
      role: "caregiver",
      scopeType: "care_group",
      scopeId: group.id,
      status: "active",
    },
  });
  const grant = await prisma.nurtureChildLinkGrant.create({
    data: {
      workspaceId,
      childCareProcessId: process.id,
      enrollmentId: enrollment.id,
      grantedByParticipantId: guardian.id,
      grantedToScopeType: "care_group",
      grantedToScopeId: group.id,
      directions: ["family_to_org", "org_to_family"],
      dataClasses: ["family_care_question"],
      purposes: ["family_care_workflow"],
      status: "active",
      effectiveFrom: new Date(Date.now() - 60_000),
    },
  });
  const thread = await prisma.nurtureFamilyCareThread.create({
    data: {
      workspaceId,
      childCareProcessId: process.id,
      familyId: family.id,
      enrollmentId: enrollment.id,
      careGroupId: group.id,
      visibilityScope: "family_private",
      status: "active",
    },
  });
  await prisma.nurtureFamilyCareThreadParticipant.createMany({
    data: [
      {
        workspaceId,
        threadId: thread.id,
        participantId: guardian.id,
        roleAssignmentId: guardianRole.id,
        participantKind: "guardian",
        visibilityStatus: "active",
      },
      {
        workspaceId,
        threadId: thread.id,
        participantId: caregiver.id,
        roleAssignmentId: caregiverRole.id,
        participantKind: "caregiver",
        visibilityStatus: "active",
      },
    ],
  });
  return {
    workspaceId,
    guardian,
    caregiver,
    child,
    process,
    family,
    institution,
    group,
    enrollment,
    guardianRole,
    caregiverRole,
    grant,
    thread,
  };
};

const routePayload = (fixture: Fixture, suffix: string) => ({
  participant_id: fixture.guardian.id,
  role_assignment_id: fixture.guardianRole.id,
  child_care_process_id: fixture.process.id,
  family_id: fixture.family.id,
  enrollment_id: fixture.enrollment.id,
  care_group_id: fixture.group.id,
  thread_id: fixture.thread.id,
  data_class: "family_care_question" as const,
  category: "question" as const,
  urgency: "today_attention" as const,
  safe_summary: `Pickup plan ${suffix}`,
  protected_content_ref: familyCareRef("protected_message_content", `content:${suffix}`, 1),
  attachment_refs: [],
  source_surface: "mobile" as const,
  routing_attempt_key: `route:${suffix}`,
  route_mode: "immediate" as const,
  requires_ack: true,
  requires_reply: true,
});

const execute = <T>(input: {
  fixture: Fixture;
  spec: NurtureCommandSpec<T>;
  payload: T;
  command_request_id: string;
  actor_id: string;
  handoff_activation?: NurtureCommandHandoffActivation;
}) =>
  new NurtureCommandRunner(repositories.commands).execute({
    workspace_id: input.fixture.workspaceId,
    invocation_request_id: `invocation:${input.command_request_id}`,
    command_request_id: input.command_request_id,
    business_actor_ref: input.actor_id,
    child_care_process_id: input.fixture.process.id,
    ...(input.handoff_activation
      ? { handoff_activation: input.handoff_activation }
      : {}),
    payload: input.payload,
    spec: input.spec,
  });

const capture = async (fixture: Fixture, suffix: string) => {
  const payload = routePayload(fixture, suffix);
  const result = await execute({
    fixture,
    spec: familyInputRouteSpec,
    payload,
    command_request_id: `capture:${suffix}`,
    actor_id: fixture.guardian.id,
  });
  expect(result).toMatchObject({ status: "ok", handoff_request_snapshots: [] });
  const [message, receipt, item, attention] = await Promise.all([
    prisma.nurtureFamilyCareMessage.findFirstOrThrow({
      where: { workspaceId: fixture.workspaceId, senderParticipantId: fixture.guardian.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.nurtureChildLinkReceipt.findFirstOrThrow({
      where: { workspaceId: fixture.workspaceId, routingAttemptKey: payload.routing_attempt_key },
    }),
    prisma.nurtureFamilyCareItem.findFirstOrThrow({
      where: { workspaceId: fixture.workspaceId, summary: payload.safe_summary },
    }),
    prisma.nurtureTeacherAttentionItem.findFirstOrThrow({
      where: { workspaceId: fixture.workspaceId, title: payload.safe_summary },
    }),
  ]);
  return { payload, result, message, receipt, item, attention };
};

const caregiverContext = (fixture: Fixture): NurtureResolvedContext => ({
  actor: {
    participant_id: fixture.caregiver.id,
    my_chat_user_id: fixture.caregiver.myChatUserId,
    role_assignment_id: fixture.caregiverRole.id,
    role_kind: "caregiver",
    scope_type: "care_group",
    scope_id: fixture.group.id,
  },
  work_scope: { kind: "care_group", care_group_id: fixture.group.id },
  continuity: {},
  policy_seed: { action_key: "open_class_family_inbox", direction: "family_to_org" },
});

describe("N1 family-care Postgres journey", () => {
  it("commits message, receipt, item, attention, and Execution atomically and replays exactly", async () => {
    const fixture = await seedFixture();
    const first = await capture(fixture, randomUUID());
    const replay = await execute({
      fixture,
      spec: familyInputRouteSpec,
      payload: first.payload,
      command_request_id: `capture:${first.payload.routing_attempt_key.slice("route:".length)}`,
      actor_id: fixture.guardian.id,
    });
    expect(replay).toMatchObject({ status: "ok", disposition: "replayed" });
    expect(first.message).toMatchObject({
      body: null,
      bodyStorageMode: "protected",
      status: "sent",
      grantId: fixture.grant.id,
    });
    expect(first.receipt).toMatchObject({
      status: "delivered",
      targetScopeType: "care_group",
      targetScopeId: fixture.group.id,
    });
    expect(first.item).toMatchObject({ status: "open", grantId: fixture.grant.id });
    expect(first.attention).toMatchObject({ status: "active", sourceId: first.item.id });
    await expect(
      prisma.nurtureCommandExecution.count({ where: { workspaceId: fixture.workspaceId } }),
    ).resolves.toBe(1);
    const execution = await prisma.nurtureCommandExecution.findFirstOrThrow({
      where: { workspaceId: fixture.workspaceId },
    });
    expect(execution.handoffRequestSnapshotsPayload).toEqual([]);
  });

  it("persists one refs-only user-attention seed and fences DB replay to the original Step", async () => {
    const fixture = await seedFixture();
    const suffix = randomUUID();
    const payload = routePayload(fixture, suffix);
    const commandRequestId = `capture-activated:${suffix}`;
    const activation = (
      stepId: string,
      claimToken: string,
      expectedStepVersion: number,
    ): NurtureCommandHandoffActivation => ({
      request_id: `attention:${suffix}`,
      driver_context: {
        driverRef: {
          namespace: "host.workflow",
          object_type: "workflow_step",
          object_id: stepId,
          owner_scope: "workspace",
        },
        contractHash: "contract-hash-for-db-test",
        capabilityKey: "class_family_inbox",
        entrypointKey: "capture_family_input",
        claimToken,
        expectedStepVersion,
      },
    });

    const first = await execute({
      fixture,
      spec: familyInputRouteSpec,
      payload,
      command_request_id: commandRequestId,
      actor_id: fixture.guardian.id,
      handoff_activation: activation(`step:${suffix}`, "claim-token-initial", 2),
    });
    expect(first).toMatchObject({
      status: "ok",
      disposition: "executed",
      handoff_request_snapshots: [
        {
          requestId: `attention:${suffix}`,
          handoffKey: "user_attention",
          requestedPurpose: "user_attention",
          sourceContextRefs: [
            { object_type: "family_care_message" },
            { object_type: "child_link_receipt" },
            { object_type: "family_care_item" },
          ],
        },
      ],
    });
    const execution = await prisma.nurtureCommandExecution.findFirstOrThrow({
      where: { workspaceId: fixture.workspaceId, commandKey: familyInputRouteSpec.command_key },
    });
    expect(execution.handoffDriverRef).toEqual({
      namespace: "host.workflow",
      consumer_scenario_key: "nurture",
      object_type: "workflow_step",
      object_id: `step:${suffix}`,
      owner_scope: "workspace",
    });
    expect(JSON.stringify(execution)).not.toContain("claim-token-initial");
    expect(JSON.stringify(execution.handoffDriverRef)).not.toContain("version");

    const reclaimed = await execute({
      fixture,
      spec: familyInputRouteSpec,
      payload,
      command_request_id: commandRequestId,
      actor_id: fixture.guardian.id,
      handoff_activation: activation(`step:${suffix}`, "claim-token-rotated", 9),
    });
    expect(reclaimed).toMatchObject({ status: "ok", disposition: "replayed" });

    const wrongStep = await execute({
      fixture,
      spec: familyInputRouteSpec,
      payload,
      command_request_id: commandRequestId,
      actor_id: fixture.guardian.id,
      handoff_activation: activation(`step:other:${suffix}`, "claim-token-other", 1),
    });
    expect(wrongStep).toMatchObject({
      status: "not_committed",
      reason_code: "invalid_durable_handoff_driver",
    });
    await expect(
      prisma.nurtureCommandExecution.count({ where: { workspaceId: fixture.workspaceId } }),
    ).resolves.toBe(1);
    await expect(
      prisma.nurtureFamilyCareMessage.count({ where: { workspaceId: fixture.workspaceId } }),
    ).resolves.toBe(1);
  });

  it("serves class inbox and attention through current owner reads without private bodies", async () => {
    const fixture = await seedFixture();
    const captured = await capture(fixture, randomUUID());
    const service = new NurtureInstitutionWorkQueryService(repositories.familyCareQuery!);
    const inbox = await service.openClassFamilyInbox({
      workspace_id: fixture.workspaceId,
      context: caregiverContext(fixture),
    });
    expect(inbox).toMatchObject({ status: "ok", items: [{ item_id: captured.item.id }] });
    const board = await service.openTeacherAttentionBoard({
      workspace_id: fixture.workspaceId,
      context: caregiverContext(fixture),
      on_date: new Date().toISOString().slice(0, 10),
    });
    expect(board).toMatchObject({
      status: "ok",
      items: [{ attention_item_id: captured.attention.id }],
    });
    const serialized = JSON.stringify({ inbox, board });
    expect(serialized).not.toContain("bodyProtectionPayload");
    expect(serialized).not.toContain(fixture.thread.id);
    expect(serialized).not.toContain(fixture.grant.id);
  });

  it("serves DB-backed scenario surfaces and removes revoked content on owner reread", async () => {
    const fixture = await seedFixture();
    const captured = await capture(fixture, randomUUID());
    const deps = { ...defaultNurtureDeps, repositories };

    const inbox = await readInstitutionSurface(deps, {
      view_key: "class_family_inbox",
      workspace_id: fixture.workspaceId,
      my_chat_user_id: fixture.caregiver.myChatUserId,
      host_request_id: `surface-inbox:${captured.item.id}`,
      surface: "mobile_dashboard",
    });
    const board = await readInstitutionSurface(deps, {
      view_key: "teacher_attention_board",
      workspace_id: fixture.workspaceId,
      my_chat_user_id: fixture.caregiver.myChatUserId,
      host_request_id: `surface-board:${captured.attention.id}`,
      surface: "web_domain_workbench",
      on_date: new Date().toISOString().slice(0, 10),
    });
    expect(inbox).toMatchObject({
      status: "ready",
      items: [{ opaque_ref: `nurture:item:${captured.item.id}` }],
    });
    expect(board).toMatchObject({
      status: "ready",
      items: [{ opaque_ref: `nurture:attention:${captured.attention.id}` }],
    });
    const serialized = JSON.stringify({ inbox, board });
    expect(serialized).not.toContain(fixture.process.id);
    expect(serialized).not.toContain(fixture.thread.id);
    expect(serialized).not.toContain(fixture.grant.id);
    expect(serialized).not.toContain("bodyProtectionPayload");

    const guardianRead = await readInstitutionSurface(deps, {
      view_key: "class_family_inbox",
      workspace_id: fixture.workspaceId,
      my_chat_user_id: fixture.guardian.myChatUserId,
      host_request_id: `surface-guardian:${captured.item.id}`,
      surface: "mobile_dashboard",
    });
    expect(guardianRead).toMatchObject({ status: "unavailable" });

    await execute({
      fixture,
      spec: revokeFamilyCareGrantSpec,
      payload: {
        participant_id: fixture.guardian.id,
        role_assignment_id: fixture.guardianRole.id,
        grant_id: fixture.grant.id,
        expected_version: 0,
        reason_code: "user_revoked",
      },
      command_request_id: `surface-revoke:${fixture.grant.id}`,
      actor_id: fixture.guardian.id,
    });
    const afterRevoke = await readInstitutionSurface(deps, {
      view_key: "class_family_inbox",
      workspace_id: fixture.workspaceId,
      my_chat_user_id: fixture.caregiver.myChatUserId,
      host_request_id: `surface-after-revoke:${captured.item.id}`,
      surface: "mobile_dashboard",
    });
    expect(afterRevoke).toMatchObject({ status: "ready", items: [] });
  });

  it("acknowledges and writes a caregiver-confirmed family reply in the same private thread", async () => {
    const fixture = await seedFixture();
    const captured = await capture(fixture, randomUUID());
    const acknowledged = await execute({
      fixture,
      spec: acknowledgeFamilyCareItemSpec,
      payload: {
        participant_id: fixture.caregiver.id,
        role_assignment_id: fixture.caregiverRole.id,
        item_id: captured.item.id,
        expected_version: 0,
        required_direction: "family_to_org",
      },
      command_request_id: `ack:${captured.item.id}`,
      actor_id: fixture.caregiver.id,
    });
    expect(acknowledged).toMatchObject({ status: "ok" });
    const replied = await execute({
      fixture,
      spec: replyFamilyCareItemSpec,
      payload: {
        participant_id: fixture.caregiver.id,
        role_assignment_id: fixture.caregiverRole.id,
        item_id: captured.item.id,
        expected_version: 1,
        required_direction: "org_to_family",
        protected_content_ref: familyCareRef(
          "protected_message_content",
          `reply:${captured.item.id}`,
          1,
        ),
        safe_summary: "Pickup plan confirmed",
        routing_attempt_key: `reply:${captured.item.id}`,
      },
      command_request_id: `reply:${captured.item.id}`,
      actor_id: fixture.caregiver.id,
    });
    expect(replied).toMatchObject({ status: "ok" });
    const item = await prisma.nurtureFamilyCareItem.findUniqueOrThrow({
      where: { id: captured.item.id },
    });
    expect(item).toMatchObject({ status: "replied", version: 2 });
    const reply = await prisma.nurtureFamilyCareMessage.findFirstOrThrow({
      where: {
        workspaceId: fixture.workspaceId,
        messageKind: "caregiver_reply",
        sourceItemId: captured.item.id,
      },
    });
    expect(reply).toMatchObject({
      threadId: fixture.thread.id,
      authorshipKind: "caregiver_confirmed",
      senderParticipantId: fixture.caregiver.id,
    });
    await expect(
      prisma.nurtureChildLinkReceipt.findFirst({
        where: {
          workspaceId: fixture.workspaceId,
          direction: "org_to_family",
          sourceId: reply.id,
          status: "delivered",
        },
      }),
    ).resolves.not.toBeNull();
  });

  it("requires caregiver thread membership for acknowledge and reply writes", async () => {
    const fixture = await seedFixture();
    const captured = await capture(fixture, randomUUID());
    await prisma.nurtureFamilyCareThreadParticipant.updateMany({
      where: {
        workspaceId: fixture.workspaceId,
        threadId: fixture.thread.id,
        participantId: fixture.caregiver.id,
      },
      data: { visibilityStatus: "removed" },
    });
    const acknowledged = await execute({
      fixture,
      spec: acknowledgeFamilyCareItemSpec,
      payload: {
        participant_id: fixture.caregiver.id,
        role_assignment_id: fixture.caregiverRole.id,
        item_id: captured.item.id,
        expected_version: 0,
        required_direction: "family_to_org",
      },
      command_request_id: `ack-denied:${captured.item.id}`,
      actor_id: fixture.caregiver.id,
    });
    expect(acknowledged).toMatchObject({ status: "not_committed", reason_code: "thread_inactive" });
    const result = await execute({
      fixture,
      spec: replyFamilyCareItemSpec,
      payload: {
        participant_id: fixture.caregiver.id,
        role_assignment_id: fixture.caregiverRole.id,
        item_id: captured.item.id,
        expected_version: 0,
        required_direction: "org_to_family",
        protected_content_ref: familyCareRef(
          "protected_message_content",
          `reply-denied:${captured.item.id}`,
          1,
        ),
        safe_summary: "Should not commit",
        routing_attempt_key: `reply-denied:${captured.item.id}`,
      },
      command_request_id: `reply-denied:${captured.item.id}`,
      actor_id: fixture.caregiver.id,
    });
    expect(result).toMatchObject({ status: "not_committed", reason_code: "thread_inactive" });
    await expect(
      prisma.nurtureFamilyCareMessage.count({
        where: { workspaceId: fixture.workspaceId, messageKind: "caregiver_reply" },
      }),
    ).resolves.toBe(0);
  });

  it("revokes delivery and does not let a replacement grant reactivate the old item", async () => {
    const fixture = await seedFixture();
    const captured = await capture(fixture, randomUUID());
    const revoked = await execute({
      fixture,
      spec: revokeFamilyCareGrantSpec,
      payload: {
        participant_id: fixture.guardian.id,
        role_assignment_id: fixture.guardianRole.id,
        grant_id: fixture.grant.id,
        expected_version: 0,
        reason_code: "user_revoked",
      },
      command_request_id: `revoke:${fixture.grant.id}`,
      actor_id: fixture.guardian.id,
    });
    expect(revoked).toMatchObject({ status: "ok" });
    const [grant, receipt, item, message] = await Promise.all([
      prisma.nurtureChildLinkGrant.findUniqueOrThrow({ where: { id: fixture.grant.id } }),
      prisma.nurtureChildLinkReceipt.findUniqueOrThrow({ where: { id: captured.receipt.id } }),
      prisma.nurtureFamilyCareItem.findUniqueOrThrow({ where: { id: captured.item.id } }),
      prisma.nurtureFamilyCareMessage.findUniqueOrThrow({ where: { id: captured.message.id } }),
    ]);
    expect(grant.status).toBe("revoked");
    expect(receipt.status).toBe("revoked_after_delivery");
    expect(item).toMatchObject({ status: "suppressed", suppressionReason: "grant_revoked" });
    expect(message.status).toBe("sent");

    await prisma.nurtureChildLinkGrant.create({
      data: {
        workspaceId: fixture.workspaceId,
        childCareProcessId: fixture.process.id,
        enrollmentId: fixture.enrollment.id,
        grantedByParticipantId: fixture.guardian.id,
        grantedToScopeType: "care_group",
        grantedToScopeId: fixture.group.id,
        directions: ["family_to_org", "org_to_family"],
        dataClasses: ["family_care_question"],
        purposes: ["replacement_relationship"],
        status: "active",
      },
    });
    const oldItemAction = await execute({
      fixture,
      spec: acknowledgeFamilyCareItemSpec,
      payload: {
        participant_id: fixture.caregiver.id,
        role_assignment_id: fixture.caregiverRole.id,
        item_id: captured.item.id,
        expected_version: item.version,
        required_direction: "family_to_org",
      },
      command_request_id: `ack-after-replacement:${captured.item.id}`,
      actor_id: fixture.caregiver.id,
    });
    expect(oldItemAction).toMatchObject({ status: "not_committed", reason_code: "grant_revoked" });
  });

  it("redacts derived display and cancels only a pending workflow route", async () => {
    const fixture = await seedFixture();
    const captured = await capture(fixture, randomUUID());
    const redacted = await execute({
      fixture,
      spec: redactFamilyCareMessageSpec,
      payload: {
        participant_id: fixture.guardian.id,
        role_assignment_id: fixture.guardianRole.id,
        message_id: captured.message.id,
        expected_version: 0,
        reason_code: "user_redacted",
      },
      command_request_id: `redact:${captured.message.id}`,
      actor_id: fixture.guardian.id,
    });
    expect(redacted).toMatchObject({ status: "ok" });
    const [message, item, attention, receipt] = await Promise.all([
      prisma.nurtureFamilyCareMessage.findUniqueOrThrow({ where: { id: captured.message.id } }),
      prisma.nurtureFamilyCareItem.findUniqueOrThrow({ where: { id: captured.item.id } }),
      prisma.nurtureTeacherAttentionItem.findUniqueOrThrow({ where: { id: captured.attention.id } }),
      prisma.nurtureChildLinkReceipt.findUniqueOrThrow({ where: { id: captured.receipt.id } }),
    ]);
    expect(message).toMatchObject({
      status: "redacted",
      body: null,
      bodyProtectionPayload: null,
      attachmentsPayload: null,
    });
    expect(item).toMatchObject({
      status: "suppressed",
      summary: "Content no longer available.",
      detail: null,
    });
    expect(attention).toMatchObject({
      status: "suppressed",
      title: "Content no longer available",
      summary: null,
    });
    expect(receipt.status).toBe("revoked_after_delivery");

    const suffix = randomUUID();
    const pendingPayload = {
      ...routePayload(fixture, suffix),
      route_mode: "pending_workflow" as const,
      pending_driver_ref: {
        namespace: "host.workflow",
        consumer_scenario_key: "nurture",
        object_type: "workflow_step",
        object_id: `step:${suffix}`,
        owner_scope: "workspace" as const,
      },
    };
    const pending = await execute({
      fixture,
      spec: familyInputRouteSpec,
      payload: pendingPayload,
      command_request_id: `capture:${suffix}`,
      actor_id: fixture.guardian.id,
    });
    expect(pending).toMatchObject({ status: "ok" });
    const pendingReceipt = await prisma.nurtureChildLinkReceipt.findFirstOrThrow({
      where: { workspaceId: fixture.workspaceId, routingAttemptKey: pendingPayload.routing_attempt_key },
    });
    expect(pendingReceipt.status).toBe("pending");
    const cancelled = await execute({
      fixture,
      spec: cancelFamilyCareRouteSpec,
      payload: {
        participant_id: fixture.guardian.id,
        role_assignment_id: fixture.guardianRole.id,
        receipt_id: pendingReceipt.id,
        expected_version: pendingReceipt.version,
      },
      command_request_id: `cancel:${pendingReceipt.id}`,
      actor_id: fixture.guardian.id,
    });
    expect(cancelled).toMatchObject({ status: "ok" });
    await expect(
      prisma.nurtureChildLinkReceipt.findUniqueOrThrow({ where: { id: pendingReceipt.id } }),
    ).resolves.toMatchObject({ status: "blocked", reasonCode: "user_cancelled_before_delivery" });
  });
});
