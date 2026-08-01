import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import {
  NurtureCommandRunner,
  NurtureInteractionContextService,
  createReplyFamilyCareItemSpec,
  createSubmitFamilyCareQuestionSpec,
  issueCareItemTargetRef,
  prepareAcknowledgeFamilyCareItem,
  prepareReplyFamilyCareItem,
  prepareSubmitFamilyCareQuestion,
  withHarnessConfirmation,
  type NurtureCommandResult,
} from "@the-nurture/scenario";
import { createPrismaClient } from "../src/client.js";
import {
  PrismaInteractionContextRepository,
  PrismaNurtureCommandRepository,
} from "../src/repositories/institution-core.repositories.js";
import { PrismaFamilyCareCommandTransaction } from "../src/repositories/family-care-command.transaction.js";
import { PrismaSubmitEligibilityReadPort } from "../src/repositories/submit-eligibility.read.js";
import { createAesGcmProtectedContentPort } from "../src/protected-content.js";

// G2-A checkpoint gap closure (01-plan G2-A list): the authority matrix, real
// concurrency, duplicate clicks, execute-time grant staleness, chat/board
// surface equivalence and the per-workspace leakage census.
const prisma = createPrismaClient();
const runner = new NurtureCommandRunner(new PrismaNurtureCommandRepository(prisma));
const contexts = new NurtureInteractionContextService(
  new PrismaInteractionContextRepository(prisma),
);
const factsPort = new PrismaFamilyCareCommandTransaction(prisma);
const submitEligibility = new PrismaSubmitEligibilityReadPort(prisma);

const INTEGRITY_KEY = "g2a-checkpoint-integrity-key-32chars!!!";
const CONTENT_KEY = "g2a-checkpoint-content-key-32chars!!!!!";
const protectedContent = createAesGcmProtectedContentPort({
  keyRef: "g2a-k1",
  keyMaterial: CONTENT_KEY,
});
const submitSpec = createSubmitFamilyCareQuestionSpec({
  protected_content: protectedContent,
  integrity_key: INTEGRITY_KEY,
});
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
  const otherGroup = await prisma.nurtureCareGroup.create({
    data: { workspaceId, institutionId: institution.id, name: "Class B", status: "active" },
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
  await prisma.nurtureCareRoleAssignment.create({
    data: {
      workspaceId,
      participantId: caregiverA.id,
      role: "caregiver",
      scopeType: "care_group",
      scopeId: group.id,
      status: "active",
    },
  });
  await prisma.nurtureCareRoleAssignment.create({
    data: {
      workspaceId,
      participantId: caregiverB.id,
      role: "lead_caregiver",
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
  return { workspaceId, guardian, caregiverA, caregiverB, process, family, group, otherGroup, enrollment, grant };
};

type Scope = Awaited<ReturnType<typeof seedScope>>;

const submitItem = async (scope: Scope, surface: "chat" | "board" = "chat") => {
  const decision = await prepareSubmitFamilyCareQuestion(
    { eligibility: submitEligibility, contexts, integrity_key: INTEGRITY_KEY },
    {
      workspace_id: scope.workspaceId,
      participant_id: scope.guardian.id,
      surface,
      operation_input: { body: "请老师帮忙留意一下情绪变化" },
    },
  );
  if (decision.status !== "ready_to_confirm") throw new Error("submit prepare failed");
  const result = await runner.execute({
    workspace_id: scope.workspaceId,
    invocation_request_id: `invocation:${decision.command_request_id}`,
    command_request_id: decision.command_request_id,
    business_actor_ref: scope.guardian.id,
    payload: { body: "请老师帮忙留意一下情绪变化", enrollment_id: decision.enrollment_id },
    spec: withHarnessConfirmation(submitSpec, {
      confirmation_ref: decision.confirmation_ref,
      actor_participant_id: scope.guardian.id,
      surface,
      command_request_id: decision.command_request_id,
      capability_key: "submit_family_care_question",
      capability_version: "1.0.0",
      integrity_key: INTEGRITY_KEY,
    }),
  });
  if (result.status !== "ok") throw new Error("submit execute failed");
  return prisma.nurtureFamilyCareItem.findFirstOrThrow({
    where: { workspaceId: scope.workspaceId },
    orderBy: { createdAt: "desc" },
  });
};

const itemRefFor = (scope: Scope, participantId: string, itemId: string) =>
  issueCareItemTargetRef(INTEGRITY_KEY, {
    workspace_id: scope.workspaceId,
    participant_id: participantId,
    item_id: itemId,
  });

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

const executeReply = (
  scope: Scope,
  actorId: string,
  itemId: string,
  ready: { confirmation_ref: string; command_request_id: string },
  body: string,
  invocationSuffix = "",
): Promise<NurtureCommandResult> =>
  runner.execute({
    workspace_id: scope.workspaceId,
    invocation_request_id: `invocation:${ready.command_request_id}${invocationSuffix}`,
    command_request_id: ready.command_request_id,
    business_actor_ref: actorId,
    payload: { body, item_id: itemId, expected_lifecycle_head: 0 },
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

const requireReady = <T extends { status: string }>(decision: T) => {
  if (decision.status !== "ready_to_confirm") {
    throw new Error(`expected ready_to_confirm: ${JSON.stringify(decision)}`);
  }
  return decision as T & {
    confirmation_ref: string;
    command_request_id: string;
  };
};

describe("G2-A checkpoint gap closure", () => {
  it("denies the authority matrix: cross-group, expired role, guardian-as-caregiver", async () => {
    const scope = await seedScope();
    const item = await submitItem(scope);

    const crossGroup = await prisma.nurtureParticipant.create({
      data: {
        workspaceId: scope.workspaceId,
        myChatUserId: `cross:${scope.workspaceId}`,
        status: "active",
      },
    });
    await prisma.nurtureCareRoleAssignment.create({
      data: {
        workspaceId: scope.workspaceId,
        participantId: crossGroup.id,
        role: "caregiver",
        scopeType: "care_group",
        scopeId: scope.otherGroup.id,
        status: "active",
      },
    });
    const expired = await prisma.nurtureParticipant.create({
      data: {
        workspaceId: scope.workspaceId,
        myChatUserId: `expired:${scope.workspaceId}`,
        status: "active",
      },
    });
    await prisma.nurtureCareRoleAssignment.create({
      data: {
        workspaceId: scope.workspaceId,
        participantId: expired.id,
        role: "caregiver",
        scopeType: "care_group",
        scopeId: scope.group.id,
        status: "active",
        endsAt: new Date(Date.now() - 60_000),
      },
    });

    for (const actor of [crossGroup.id, expired.id, scope.guardian.id]) {
      await expect(prepareReply(scope, actor, item.id, "越权回复")).resolves.toEqual({
        status: "denied",
        reason_code: "not_authorized",
      });
      await expect(
        prepareAcknowledgeFamilyCareItem(
          { facts: factsPort, contexts, integrity_key: INTEGRITY_KEY },
          {
            workspace_id: scope.workspaceId,
            participant_id: actor,
            surface: "board",
            target_option_ref: itemRefFor(scope, actor, item.id),
          },
        ),
      ).resolves.toEqual({ status: "denied", reason_code: "not_authorized" });
    }
    await expect(
      prisma.nurtureFamilyCareMessage.count({
        where: { workspaceId: scope.workspaceId, messageKind: "caregiver_reply" },
      }),
    ).resolves.toBe(0);
  });

  it("commits two truly concurrent independent replies exactly once each", async () => {
    const scope = await seedScope();
    const item = await submitItem(scope);
    const readyA = requireReady(
      await prepareReply(scope, scope.caregiverA.id, item.id, "并发回复A"),
    );
    const readyB = requireReady(
      await prepareReply(scope, scope.caregiverB.id, item.id, "并发回复B"),
    );

    const run = (actorId: string, ready: typeof readyA, body: string) =>
      executeReply(scope, actorId, item.id, ready, body).then(async (result) =>
        // Serializable SSI can surface a retryable no-commit under true
        // concurrency; one retry with the same command must converge.
        result.status === "not_committed" && result.decision === "technical_error"
          ? executeReply(scope, actorId, item.id, ready, body, ":retry")
          : result,
      );
    const [resultA, resultB] = await Promise.all([
      run(scope.caregiverA.id, readyA, "并发回复A"),
      run(scope.caregiverB.id, readyB, "并发回复B"),
    ]);
    expect(resultA).toMatchObject({ status: "ok", business_outcome: "applied" });
    expect(resultB).toMatchObject({ status: "ok", business_outcome: "applied" });

    const replies = await prisma.nurtureFamilyCareMessage.findMany({
      where: { workspaceId: scope.workspaceId, messageKind: "caregiver_reply" },
      orderBy: { replyOrderKey: "asc" },
    });
    expect(replies).toHaveLength(2);
    expect(replies[0]!.replyOrderKey! < replies[1]!.replyOrderKey!).toBe(true);
    const after = await prisma.nurtureFamilyCareItem.findFirstOrThrow({
      where: { id: item.id },
    });
    expect(after).toMatchObject({ responseState: "responded", responseHead: 1 });
    await expect(
      prisma.nurtureTeacherAttentionItem.count({
        where: { workspaceId: scope.workspaceId, sourceId: item.id, status: "resolved" },
      }),
    ).resolves.toBe(1);
  });

  it("collapses a duplicate click into one effect plus an exact replay", async () => {
    const scope = await seedScope();
    const item = await submitItem(scope);
    const ready = requireReady(
      await prepareReply(scope, scope.caregiverA.id, item.id, "双击回复"),
    );
    const attempt = () => executeReply(scope, scope.caregiverA.id, item.id, ready, "双击回复");
    const settled = await Promise.all([attempt(), attempt()]);

    const outcomes = await Promise.all(
      settled.map(async (result) =>
        result.status === "not_committed" &&
        (result.reason_code === "command_busy" ||
          result.decision === "technical_error")
          ? attempt()
          : result,
      ),
    );
    const okDispositions = outcomes
      .filter(
        (result): result is Extract<NurtureCommandResult, { status: "ok" }> =>
          result.status === "ok",
      )
      .map((result) => result.disposition)
      .sort();
    expect(okDispositions).toEqual(["executed", "replayed"]);
    await expect(
      prisma.nurtureFamilyCareMessage.count({
        where: { workspaceId: scope.workspaceId, messageKind: "caregiver_reply" },
      }),
    ).resolves.toBe(1);
  });

  it("fails closed when the original grant is revoked between prepare and execute", async () => {
    const scope = await seedScope();
    const item = await submitItem(scope);
    const ready = requireReady(
      await prepareReply(scope, scope.caregiverA.id, item.id, "撤销前准备"),
    );
    await prisma.nurtureChildLinkGrant.update({
      where: { id: scope.grant.id },
      data: {
        status: "revoked",
        revokedAt: new Date(),
        revokedByParticipantId: scope.guardian.id,
        revokeReason: "user_revoked",
      },
    });
    const stale = await executeReply(scope, scope.caregiverA.id, item.id, ready, "撤销前准备");
    expect(stale).toMatchObject({
      status: "not_committed",
      decision: "blocked",
      reason_code: "grant_unavailable",
    });
    await expect(
      prisma.nurtureFamilyCareMessage.count({
        where: { workspaceId: scope.workspaceId, messageKind: "caregiver_reply" },
      }),
    ).resolves.toBe(0);
  });

  it("produces surface-equivalent canonical effects and refusals for chat and board", async () => {
    const chatScope = await seedScope();
    const boardScope = await seedScope();
    await submitItem(chatScope, "chat");
    await submitItem(boardScope, "board");

    const shape = async (scope: Scope) => {
      const item = await prisma.nurtureFamilyCareItem.findFirstOrThrow({
        where: { workspaceId: scope.workspaceId },
      });
      const message = await prisma.nurtureFamilyCareMessage.findFirstOrThrow({
        where: { workspaceId: scope.workspaceId },
      });
      const receipt = await prisma.nurtureChildLinkReceipt.findFirstOrThrow({
        where: { workspaceId: scope.workspaceId },
      });
      return {
        item: {
          writerContract: item.writerContract,
          acknowledgementState: item.acknowledgementState,
          responseState: item.responseState,
          lifecycleState: item.lifecycleState,
          status: item.status,
          requiresAck: item.requiresAck,
          requiresReply: item.requiresReply,
          summary: item.summary,
        },
        message: {
          writerContract: message.writerContract,
          bodyStorageMode: message.bodyStorageMode,
          direction: message.direction,
          body: message.body,
        },
        receipt: { direction: receipt.direction, status: receipt.status },
      };
    };
    expect(await shape(chatScope)).toEqual(await shape(boardScope));

    // Refusal equivalence: an unauthorized actor is denied identically on
    // either surface.
    const results = [];
    for (const surface of ["chat", "board"] as const) {
      const stranger = await prisma.nurtureParticipant.create({
        data: {
          workspaceId: chatScope.workspaceId,
          myChatUserId: `stranger-${surface}:${chatScope.workspaceId}`,
          status: "active",
        },
      });
      results.push(
        await prepareSubmitFamilyCareQuestion(
          { eligibility: submitEligibility, contexts, integrity_key: INTEGRITY_KEY },
          {
            workspace_id: chatScope.workspaceId,
            participant_id: stranger.id,
            surface,
            operation_input: { body: "无权提交" },
          },
        ),
      );
    }
    expect(results[0]).toEqual(results[1]);
    expect(results[0]).toEqual({ status: "denied", reason_code: "not_authorized" });
  });

  it("passes the per-workspace leakage census over the whole loop", async () => {
    const scope = await seedScope();
    const item = await submitItem(scope);
    const ready = requireReady(
      await prepareReply(scope, scope.caregiverA.id, item.id, "回复中的私密内容"),
    );
    await executeReply(scope, scope.caregiverA.id, item.id, ready, "回复中的私密内容");

    const [items, messages, receipts, events, attentions, executions, confirmations] =
      await Promise.all([
        prisma.nurtureFamilyCareItem.findMany({ where: { workspaceId: scope.workspaceId } }),
        prisma.nurtureFamilyCareMessage.findMany({ where: { workspaceId: scope.workspaceId } }),
        prisma.nurtureChildLinkReceipt.findMany({ where: { workspaceId: scope.workspaceId } }),
        prisma.nurtureFamilyCareItemEvent.findMany({ where: { workspaceId: scope.workspaceId } }),
        prisma.nurtureTeacherAttentionItem.findMany({ where: { workspaceId: scope.workspaceId } }),
        prisma.nurtureCommandExecution.findMany({ where: { workspaceId: scope.workspaceId } }),
        prisma.nurtureInteractionContext.findMany({ where: { workspaceId: scope.workspaceId } }),
      ]);
    const dump = JSON.stringify({ items, messages, receipts, events, attentions, executions, confirmations });
    for (const sentinel of [
      "请老师帮忙留意一下情绪变化",
      "回复中的私密内容",
      ready.confirmation_ref,
      "protected_content_ref",
    ]) {
      expect(dump).not.toContain(sentinel);
    }
    expect(messages.every((message) => message.body === null)).toBe(true);
  });
});
