import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import {
  NurtureCommandRunner,
  NurtureInteractionContextService,
  createAcknowledgeFamilyCareItemSpec,
  createReplyFamilyCareItemSpec,
  createSubmitFamilyCareQuestionSpec,
  issueCareItemTargetRef,
  prepareAcknowledgeFamilyCareItem,
  prepareReplyFamilyCareItem,
  prepareSubmitFamilyCareQuestion,
  withHarnessConfirmation,
  type ItemActionPrepareDecision,
} from "@the-nurture/scenario";
import { createPrismaClient } from "../src/client.js";
import {
  PrismaInteractionContextRepository,
  PrismaNurtureCommandRepository,
} from "../src/repositories/institution-core.repositories.js";
import { PrismaFamilyCareCommandTransaction } from "../src/repositories/family-care-command.transaction.js";
import { PrismaSubmitEligibilityReadPort } from "../src/repositories/submit-eligibility.read.js";
import { createAesGcmProtectedContentPort } from "../src/protected-content.js";

// G2-A caregiver actions: convergent class acknowledgement and the
// append-compatible class reply on the three-axis item.
const prisma = createPrismaClient();
const runner = new NurtureCommandRunner(new PrismaNurtureCommandRepository(prisma));
const contexts = new NurtureInteractionContextService(
  new PrismaInteractionContextRepository(prisma),
);
const factsPort = new PrismaFamilyCareCommandTransaction(prisma);
const submitEligibility = new PrismaSubmitEligibilityReadPort(prisma);

const INTEGRITY_KEY = "g2-item-actions-integrity-key-32chars!!!";
const CONTENT_KEY = "g2-item-actions-content-key-32chars!!!!!";
const protectedContent = createAesGcmProtectedContentPort({
  keyRef: "g2-items-k1",
  keyMaterial: CONTENT_KEY,
});
const submitSpec = createSubmitFamilyCareQuestionSpec({
  protected_content: protectedContent,
  integrity_key: INTEGRITY_KEY,
});
const acknowledgeSpec = createAcknowledgeFamilyCareItemSpec();
const replySpec = createReplyFamilyCareItemSpec({
  protected_content: protectedContent,
  integrity_key: INTEGRITY_KEY,
});

afterAll(async () => {
  await prisma.$disconnect();
});

const seedScope = async () => {
  const workspaceId = randomUUID();
  const guardian = await prisma.nurtureParticipant.create({
    data: { workspaceId, myChatUserId: `guardian:${workspaceId}`, status: "active" },
  });
  const caregiverA = await prisma.nurtureParticipant.create({
    data: { workspaceId, myChatUserId: `caregiver-a:${workspaceId}`, status: "active" },
  });
  const caregiverB = await prisma.nurtureParticipant.create({
    data: { workspaceId, myChatUserId: `caregiver-b:${workspaceId}`, status: "active" },
  });
  const admin = await prisma.nurtureParticipant.create({
    data: { workspaceId, myChatUserId: `admin:${workspaceId}`, status: "active" },
  });
  const child = await prisma.nurtureChild.create({
    data: { workspaceId, displayName: "Child", status: "active" },
  });
  const process = await prisma.nurtureChildCareProcess.create({
    data: { workspaceId, childId: child.id, status: "active" },
  });
  const family = await prisma.nurtureFamily.create({
    data: { workspaceId, childCareProcessId: process.id, displayName: "Family", status: "active" },
  });
  const institution = await prisma.nurtureCareInstitution.create({
    data: {
      workspaceId,
      displayName: "Care Center",
      status: "active",
      createdByParticipantId: caregiverA.id,
    },
  });
  const group = await prisma.nurtureCareGroup.create({
    data: { workspaceId, institutionId: institution.id, name: "Class A", status: "active" },
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
  await prisma.nurtureCareRoleAssignment.create({
    data: {
      workspaceId,
      participantId: guardian.id,
      role: "guardian",
      scopeType: "child_care_process",
      scopeId: process.id,
      status: "active",
    },
  });
  const roleA = await prisma.nurtureCareRoleAssignment.create({
    data: {
      workspaceId,
      participantId: caregiverA.id,
      role: "caregiver",
      scopeType: "care_group",
      scopeId: group.id,
      status: "active",
    },
  });
  const roleB = await prisma.nurtureCareRoleAssignment.create({
    data: {
      workspaceId,
      participantId: caregiverB.id,
      role: "lead_caregiver",
      scopeType: "care_group",
      scopeId: group.id,
      status: "active",
    },
  });
  await prisma.nurtureCareRoleAssignment.create({
    data: {
      workspaceId,
      participantId: admin.id,
      role: "institution_admin",
      scopeType: "institution",
      scopeId: institution.id,
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
    },
  });
  await prisma.nurtureFamilyCareThread.create({
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
  return { workspaceId, guardian, caregiverA, caregiverB, admin, roleA, roleB, process, family, group, enrollment, grant };
};

type Scope = Awaited<ReturnType<typeof seedScope>>;

const submitItem = async (scope: Scope): Promise<string> => {
  const decision = await prepareSubmitFamilyCareQuestion(
    { eligibility: submitEligibility, contexts, integrity_key: INTEGRITY_KEY },
    {
      workspace_id: scope.workspaceId,
      participant_id: scope.guardian.id,
      surface: "chat",
      operation_input: { body: "请老师关注一下午睡情况" },
    },
  );
  if (decision.status !== "ready_to_confirm") throw new Error("submit prepare failed");
  const committed = await runner.execute({
    workspace_id: scope.workspaceId,
    invocation_request_id: `invocation:${decision.command_request_id}`,
    command_request_id: decision.command_request_id,
    business_actor_ref: scope.guardian.id,
    payload: { body: "请老师关注一下午睡情况", enrollment_id: decision.enrollment_id },
    spec: withHarnessConfirmation(submitSpec, {
      confirmation_ref: decision.confirmation_ref,
      actor_participant_id: scope.guardian.id,
      surface: "chat",
      command_request_id: decision.command_request_id,
      capability_key: "submit_family_care_question",
      capability_version: "1.0.0",
      integrity_key: INTEGRITY_KEY,
    }),
  });
  if (committed.status !== "ok") throw new Error("submit execute failed");
  const item = await prisma.nurtureFamilyCareItem.findFirstOrThrow({
    where: { workspaceId: scope.workspaceId },
  });
  return item.id;
};

const itemRefFor = (scope: Scope, participantId: string, itemId: string) =>
  issueCareItemTargetRef(INTEGRITY_KEY, {
    workspace_id: scope.workspaceId,
    participant_id: participantId,
    item_id: itemId,
  });

const requireReady = (decision: ItemActionPrepareDecision) => {
  if (decision.status !== "ready_to_confirm") {
    throw new Error(`expected ready_to_confirm: ${JSON.stringify(decision)}`);
  }
  return decision;
};

const executeAcknowledge = async (
  scope: Scope,
  actorId: string,
  itemId: string,
  ready: ReturnType<typeof requireReady>,
  heads: { acknowledgement: number; lifecycle: number },
) =>
  runner.execute({
    workspace_id: scope.workspaceId,
    invocation_request_id: `invocation:${ready.command_request_id}`,
    command_request_id: ready.command_request_id,
    business_actor_ref: actorId,
    payload: {
      item_id: itemId,
      expected_acknowledgement_head: heads.acknowledgement,
      expected_lifecycle_head: heads.lifecycle,
    },
    spec: withHarnessConfirmation(acknowledgeSpec, {
      confirmation_ref: ready.confirmation_ref,
      actor_participant_id: actorId,
      surface: "board",
      command_request_id: ready.command_request_id,
      capability_key: "acknowledge_family_care_item",
      capability_version: "1.0.0",
      integrity_key: INTEGRITY_KEY,
    }),
  });

const executeReply = async (
  scope: Scope,
  actorId: string,
  itemId: string,
  ready: ReturnType<typeof requireReady>,
  body: string,
  lifecycleHead: number,
) =>
  runner.execute({
    workspace_id: scope.workspaceId,
    invocation_request_id: `invocation:${ready.command_request_id}`,
    command_request_id: ready.command_request_id,
    business_actor_ref: actorId,
    payload: { body, item_id: itemId, expected_lifecycle_head: lifecycleHead },
    spec: withHarnessConfirmation(replySpec, {
      confirmation_ref: ready.confirmation_ref,
      actor_participant_id: actorId,
      surface: "board",
      command_request_id: ready.command_request_id,
      capability_key: "reply_family_care_item",
      capability_version: "1.0.0",
      integrity_key: INTEGRITY_KEY,
    }),
  });

const prepareAck = (scope: Scope, actorId: string, itemId: string) =>
  prepareAcknowledgeFamilyCareItem(
    { facts: factsPort, contexts, integrity_key: INTEGRITY_KEY },
    {
      workspace_id: scope.workspaceId,
      participant_id: actorId,
      surface: "board",
      target_option_ref: itemRefFor(scope, actorId, itemId),
    },
  );

const prepareReply = (scope: Scope, actorId: string, itemId: string, body: string) =>
  prepareReplyFamilyCareItem(
    { facts: factsPort, contexts, integrity_key: INTEGRITY_KEY },
    {
      workspace_id: scope.workspaceId,
      participant_id: actorId,
      surface: "board",
      target_option_ref: itemRefFor(scope, actorId, itemId),
      operation_input: { body },
    },
  );

describe("G2-A acknowledge and reply verticals", () => {
  it("acknowledges once with class semantics and converges the second command", async () => {
    const scope = await seedScope();
    const itemId = await submitItem(scope);

    const ready = requireReady(await prepareAck(scope, scope.caregiverA.id, itemId));
    const committed = await executeAcknowledge(scope, scope.caregiverA.id, itemId, ready, {
      acknowledgement: 0,
      lifecycle: 0,
    });
    expect(committed).toMatchObject({
      status: "ok",
      disposition: "executed",
      business_outcome: "applied",
    });
    const item = await prisma.nurtureFamilyCareItem.findFirstOrThrow({ where: { id: itemId } });
    expect(item).toMatchObject({
      acknowledgementState: "acknowledged",
      acknowledgementHead: 1,
      responseState: "awaiting_reply",
      status: "acknowledged",
      ackedByParticipantId: scope.caregiverA.id,
      ackedByRoleAssignmentId: scope.roleA.id,
      assignedToRoleAssignmentId: null,
    });
    await expect(
      prisma.nurtureChildLinkReceipt.count({
        where: { workspaceId: scope.workspaceId, direction: "family_to_org", status: "acknowledged" },
      }),
    ).resolves.toBe(1);

    const secondReady = requireReady(await prepareAck(scope, scope.caregiverB.id, itemId));
    const converged = await executeAcknowledge(scope, scope.caregiverB.id, itemId, secondReady, {
      acknowledgement: 1,
      lifecycle: 0,
    });
    expect(converged).toMatchObject({
      status: "ok",
      disposition: "executed",
      business_outcome: "already_satisfied",
    });
    const after = await prisma.nurtureFamilyCareItem.findFirstOrThrow({ where: { id: itemId } });
    expect(after.ackedByParticipantId).toBe(scope.caregiverA.id);
    await expect(
      prisma.nurtureFamilyCareItemEvent.count({
        where: { workspaceId: scope.workspaceId, itemId, eventType: "acknowledged" },
      }),
    ).resolves.toBe(1);
  });

  it("denies non-caregiver actors and forged item refs at prepare", async () => {
    const scope = await seedScope();
    const itemId = await submitItem(scope);

    await expect(prepareAck(scope, scope.admin.id, itemId)).resolves.toEqual({
      status: "denied",
      reason_code: "not_authorized",
    });
    const forged = await prepareAcknowledgeFamilyCareItem(
      { facts: factsPort, contexts, integrity_key: INTEGRITY_KEY },
      {
        workspace_id: scope.workspaceId,
        participant_id: scope.caregiverA.id,
        surface: "board",
        target_option_ref: `1.${itemId}.${"0".repeat(32)}`,
      },
    );
    expect(forged).toEqual({ status: "denied", reason_code: "not_authorized" });
  });

  it("appends independent class replies: first resolves attention, later ones stay applied", async () => {
    const scope = await seedScope();
    const itemId = await submitItem(scope);

    const firstReady = requireReady(
      await prepareReply(scope, scope.caregiverA.id, itemId, "今天午睡两小时,状态很好"),
    );
    const first = await executeReply(
      scope,
      scope.caregiverA.id,
      itemId,
      firstReady,
      "今天午睡两小时,状态很好",
      0,
    );
    expect(first).toMatchObject({ status: "ok", business_outcome: "applied" });

    const item = await prisma.nurtureFamilyCareItem.findFirstOrThrow({ where: { id: itemId } });
    expect(item).toMatchObject({
      responseState: "responded",
      responseHead: 1,
      lifecycleState: "active",
      status: "replied",
      linkedReplyMessageId: null,
    });
    await expect(
      prisma.nurtureTeacherAttentionItem.findFirstOrThrow({
        where: { workspaceId: scope.workspaceId, sourceId: itemId },
      }),
    ).resolves.toMatchObject({ status: "resolved" });

    // A second legitimate reply from another caregiver appends; the earlier
    // response transition never makes it stale.
    const secondReady = requireReady(
      await prepareReply(scope, scope.caregiverB.id, itemId, "补充:下午加了一次水"),
    );
    const second = await executeReply(
      scope,
      scope.caregiverB.id,
      itemId,
      secondReady,
      "补充:下午加了一次水",
      0,
    );
    expect(second).toMatchObject({ status: "ok", business_outcome: "applied" });

    const replies = await prisma.nurtureFamilyCareMessage.findMany({
      where: { workspaceId: scope.workspaceId, messageKind: "caregiver_reply" },
      orderBy: { replyOrderKey: "asc" },
    });
    expect(replies).toHaveLength(2);
    expect(replies[0]!.replyOrderKey).not.toBe(replies[1]!.replyOrderKey);
    expect(replies.map((reply) => reply.senderParticipantId)).toEqual([
      scope.caregiverA.id,
      scope.caregiverB.id,
    ]);
    for (const reply of replies) {
      expect(reply.bodyStorageMode).toBe("encrypted");
      expect(reply.body).toBeNull();
      expect(reply.direction).toBe("org_to_family");
    }
    expect(protectedContent.unseal(replies[0]!.bodyProtectionPayload as never)).toBe(
      "今天午睡两小时,状态很好",
    );
    const after = await prisma.nurtureFamilyCareItem.findFirstOrThrow({ where: { id: itemId } });
    expect(after).toMatchObject({ responseState: "responded", responseHead: 1, lifecycleState: "active" });
    await expect(
      prisma.nurtureChildLinkReceipt.count({
        where: { workspaceId: scope.workspaceId, direction: "org_to_family", status: "delivered" },
      }),
    ).resolves.toBe(2);
  });

  it("replays the same reply command exactly instead of appending twice", async () => {
    const scope = await seedScope();
    const itemId = await submitItem(scope);
    const ready = requireReady(
      await prepareReply(scope, scope.caregiverA.id, itemId, "回复内容"),
    );
    const committed = await executeReply(scope, scope.caregiverA.id, itemId, ready, "回复内容", 0);
    const replay = await executeReply(scope, scope.caregiverA.id, itemId, ready, "回复内容", 0);
    expect(replay).toMatchObject({ status: "ok", disposition: "replayed" });
    if (committed.status !== "ok" || replay.status !== "ok") throw new Error("unreachable");
    expect(replay.output_refs).toEqual(committed.output_refs);
    await expect(
      prisma.nurtureFamilyCareMessage.count({
        where: { workspaceId: scope.workspaceId, messageKind: "caregiver_reply" },
      }),
    ).resolves.toBe(1);
  });

  it("goes stale when the lifecycle head moves after prepare", async () => {
    const scope = await seedScope();
    const itemId = await submitItem(scope);
    const ready = requireReady(
      await prepareReply(scope, scope.caregiverA.id, itemId, "准备好的回复"),
    );
    await prisma.nurtureFamilyCareItem.update({
      where: { id: itemId },
      data: {
        lifecycleState: "closed",
        lifecycleReason: "family_withdrawn",
        lifecycleHead: { increment: 1 },
        status: "closed",
      },
    });
    const stale = await executeReply(scope, scope.caregiverA.id, itemId, ready, "准备好的回复", 0);
    expect(stale).toMatchObject({ status: "not_committed", decision: "conflict" });
    await expect(
      prisma.nurtureFamilyCareMessage.count({
        where: { workspaceId: scope.workspaceId, messageKind: "caregiver_reply" },
      }),
    ).resolves.toBe(0);
  });

  it("keeps an acknowledge confirmation valid across appended replies", async () => {
    const scope = await seedScope();
    const itemId = await submitItem(scope);

    const ackReady = requireReady(await prepareAck(scope, scope.caregiverA.id, itemId));
    const replyReady = requireReady(
      await prepareReply(scope, scope.caregiverB.id, itemId, "先回复再确认"),
    );
    const replied = await executeReply(
      scope,
      scope.caregiverB.id,
      itemId,
      replyReady,
      "先回复再确认",
      0,
    );
    expect(replied).toMatchObject({ status: "ok", business_outcome: "applied" });

    // The response-axis move must not invalidate the acknowledgement heads.
    const acked = await executeAcknowledge(scope, scope.caregiverA.id, itemId, ackReady, {
      acknowledgement: 0,
      lifecycle: 0,
    });
    expect(acked).toMatchObject({ status: "ok", business_outcome: "applied" });
    await expect(
      prisma.nurtureFamilyCareItem.findFirstOrThrow({ where: { id: itemId } }),
    ).resolves.toMatchObject({
      acknowledgementState: "acknowledged",
      responseState: "responded",
      status: "replied",
      lifecycleState: "active",
    });
  });
});
