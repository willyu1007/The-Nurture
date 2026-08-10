import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import {
  issueCareItemTargetRef,
  NurtureCommandRunner,
  NurtureInteractionContextService,
  createSubmitFamilyCareQuestionSpec,
  prepareSubmitFamilyCareQuestion,
  withHarnessConfirmation,
  type SubmitPrepareDecision,
} from "@the-nurture/scenario";
import { createPrismaClient } from "../src/client.js";
import {
  PrismaInteractionContextRepository,
  PrismaNurtureCommandRepository,
} from "../src/repositories/institution-core.repositories.js";
import { PrismaSubmitEligibilityReadPort } from "../src/repositories/submit-eligibility.read.js";
import { createAesGcmProtectedContentPort } from "../src/protected-content.js";

// End-to-end G2-A submit vertical: prepare decision -> confirmation ->
// three-axis transactional write, per 08-increment-1 and the schema freeze.
const prisma = createPrismaClient();
const runner = new NurtureCommandRunner(new PrismaNurtureCommandRepository(prisma));
const contexts = new NurtureInteractionContextService(
  new PrismaInteractionContextRepository(prisma),
);
const eligibility = new PrismaSubmitEligibilityReadPort(prisma);

const INTEGRITY_KEY = "g2-submit-harness-integrity-key-32chars!";
const CONTENT_KEY = "g2-submit-protected-content-key-32chars!";
const protectedContent = createAesGcmProtectedContentPort({
  keyRef: "g2-test-k1",
  keyMaterial: CONTENT_KEY,
});
const spec = createSubmitFamilyCareQuestionSpec({
  protected_content: protectedContent,
  integrity_key: INTEGRITY_KEY,
});

afterAll(async () => {
  await prisma.$disconnect();
});

const seedScope = async (options: { grantStatus?: "active" | "revoked" } = {}) => {
  const workspaceId = randomUUID();
  const guardian = await prisma.nurtureParticipant.create({
    data: { workspaceId, myChatUserId: `guardian:${workspaceId}`, status: "active" },
  });
  const caregiver = await prisma.nurtureParticipant.create({
    data: { workspaceId, myChatUserId: `caregiver:${workspaceId}`, status: "active" },
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
      createdByParticipantId: caregiver.id,
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
      participationPhase: "formal",
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
      status: options.grantStatus ?? "active",
      ...(options.grantStatus === "revoked"
        ? {
            revokedAt: new Date(),
            revokedByParticipantId: guardian.id,
            revokeReason: "user_revoked",
          }
        : {}),
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
  return { workspaceId, guardian, process, family, institution, group, enrollment, guardianRole, grant, thread };
};

const prepare = (
  scope: Awaited<ReturnType<typeof seedScope>>,
  body: string,
  extra: { target_option_ref?: string; continuation_ref?: string } = {},
) =>
  prepareSubmitFamilyCareQuestion(
    { eligibility, contexts, integrity_key: INTEGRITY_KEY },
    {
      workspace_id: scope.workspaceId,
      participant_id: scope.guardian.id,
      surface: "chat",
      operation_input: {
        body,
        ...(extra.continuation_ref
          ? { context_continuation_of_item_ref: extra.continuation_ref }
          : {}),
      },
      ...(extra.target_option_ref ? { target_option_ref: extra.target_option_ref } : {}),
    },
  );

const requireReady = (decision: SubmitPrepareDecision) => {
  if (decision.status !== "ready_to_confirm") {
    throw new Error(`expected ready_to_confirm: ${JSON.stringify(decision)}`);
  }
  return decision;
};

const execute = (
  scope: Awaited<ReturnType<typeof seedScope>>,
  ready: ReturnType<typeof requireReady>,
  body: string,
  continuationItemId?: string,
) =>
  runner.execute({
    workspace_id: scope.workspaceId,
    invocation_request_id: `invocation:${ready.command_request_id}`,
    command_request_id: ready.command_request_id,
    business_actor_ref: scope.guardian.id,
    child_care_process_id: scope.process.id,
    payload: {
      body,
      enrollment_id: ready.enrollment_id,
      ...(continuationItemId ? { context_continuation_of_item_id: continuationItemId } : {}),
    },
    spec: withHarnessConfirmation(spec, {
      confirmation_ref: ready.confirmation_ref,
      actor_participant_id: scope.guardian.id,
      surface: "chat",
      command_request_id: ready.command_request_id,
      capability_key: "submit_family_care_question",
      capability_version: "1.0.0",
      integrity_key: INTEGRITY_KEY,
    }),
  });

describe("G2-A submit_family_care_question vertical", () => {
  it("prepares deterministically and commits the three-axis write once", async () => {
    const scope = await seedScope();
    const body = "老师您好,想沟通一下接送时间安排";
    const ready = requireReady(await prepare(scope, `  ${body}  `));
    expect(ready.preview.normalized_body).toBe(body);
    expect(ready.preview.target_label).toContain("Care Center");

    const committed = await execute(scope, ready, body);
    expect(committed).toMatchObject({
      status: "ok",
      disposition: "executed",
      business_outcome: "applied",
    });

    const message = await prisma.nurtureFamilyCareMessage.findFirstOrThrow({
      where: { workspaceId: scope.workspaceId, messageKind: "family_message" },
    });
    expect(message).toMatchObject({
      writerContract: "harness_g2_v1",
      bodyStorageMode: "encrypted",
      body: null,
      enrollmentId: scope.enrollment.id,
      careGroupId: scope.group.id,
      direction: "family_to_org",
      grantId: scope.grant.id,
    });
    expect(
      protectedContent.unseal(message.bodyProtectionPayload as never),
    ).toBe(body);
    expect(JSON.stringify(message.bodyProtectionPayload)).not.toContain("接送时间");

    const item = await prisma.nurtureFamilyCareItem.findFirstOrThrow({
      where: { workspaceId: scope.workspaceId },
    });
    expect(item).toMatchObject({
      writerContract: "harness_g2_v1",
      acknowledgementState: "pending",
      responseState: "awaiting_reply",
      lifecycleState: "active",
      status: "open",
      sourceMessageId: message.id,
      enrollmentId: scope.enrollment.id,
      grantId: scope.grant.id,
      requiresAck: true,
      requiresReply: true,
      summary: "New family care question",
      contextContinuationOfItemId: null,
    });
    expect(item.summary).not.toContain("接送时间");

    await expect(
      prisma.nurtureChildLinkReceipt.count({
        where: { workspaceId: scope.workspaceId, direction: "family_to_org", status: "delivered" },
      }),
    ).resolves.toBe(1);
    await expect(
      prisma.nurtureTeacherAttentionItem.count({
        where: { workspaceId: scope.workspaceId, sourceId: item.id, status: "active" },
      }),
    ).resolves.toBe(1);
    await expect(
      prisma.nurtureFamilyCareItemEvent.count({
        where: { workspaceId: scope.workspaceId, itemId: item.id, eventType: "created" },
      }),
    ).resolves.toBe(1);

    const replay = await execute(scope, ready, body);
    expect(replay).toMatchObject({ status: "ok", disposition: "replayed" });
    if (committed.status !== "ok" || replay.status !== "ok") throw new Error("unreachable");
    expect(replay.output_refs).toEqual(committed.output_refs);
    await expect(
      prisma.nurtureFamilyCareMessage.count({ where: { workspaceId: scope.workspaceId } }),
    ).resolves.toBe(1);
  });

  it("requires an owner-issued choice across multiple enrollments", async () => {
    const scope = await seedScope();
    const otherInstitution = await prisma.nurtureCareInstitution.create({
      data: {
        workspaceId: scope.workspaceId,
        displayName: "Second Center",
        status: "active",
        createdByParticipantId: scope.guardian.id,
      },
    });
    const otherGroup = await prisma.nurtureCareGroup.create({
      data: {
        workspaceId: scope.workspaceId,
        institutionId: otherInstitution.id,
        name: "Class B",
        status: "active",
      },
    });
    const otherEnrollment = await prisma.nurtureEnrollment.create({
      data: {
        workspaceId: scope.workspaceId,
        childCareProcessId: scope.process.id,
        institutionId: otherInstitution.id,
        careGroupId: otherGroup.id,
        status: "active",
        participationPhase: "formal",
      },
    });
    await prisma.nurtureChildLinkGrant.create({
      data: {
        workspaceId: scope.workspaceId,
        childCareProcessId: scope.process.id,
        enrollmentId: otherEnrollment.id,
        grantedByParticipantId: scope.guardian.id,
        grantedToScopeType: "care_group",
        grantedToScopeId: otherGroup.id,
        directions: ["family_to_org", "org_to_family"],
        dataClasses: ["family_care_question"],
        purposes: ["family_care_workflow"],
        status: "active",
      },
    });
    await prisma.nurtureFamilyCareThread.create({
      data: {
        workspaceId: scope.workspaceId,
        childCareProcessId: scope.process.id,
        familyId: scope.family.id,
        enrollmentId: otherEnrollment.id,
        careGroupId: otherGroup.id,
        visibilityScope: "family_private",
        status: "active",
      },
    });

    const ambiguous = await prepare(scope, "请问下周活动安排");
    if (ambiguous.status !== "needs_input") {
      throw new Error(`expected needs_input: ${JSON.stringify(ambiguous)}`);
    }
    expect(ambiguous.choices).toHaveLength(2);
    expect(JSON.stringify(ambiguous.choices)).not.toContain(scope.enrollment.id);
    expect(JSON.stringify(ambiguous.choices)).not.toContain(otherEnrollment.id);
    const second = ambiguous.choices!.find((choice) =>
      choice.display_label.includes("Second Center"),
    )!;

    const ready = requireReady(
      await prepare(scope, "请问下周活动安排", { target_option_ref: second.target_option_ref }),
    );
    expect(ready.enrollment_id).toBe(otherEnrollment.id);

    const forged = await prepare(scope, "请问下周活动安排", {
      target_option_ref: `1.${"0".repeat(32)}`,
    });
    expect(forged).toEqual({ status: "denied", reason_code: "not_authorized" });
  });

  it("fails safety-gated input before any business fact", async () => {
    const scope = await seedScope();
    const decision = await prepare(scope, "孩子出现呼吸困难需要急救怎么办");
    expect(decision).toMatchObject({
      status: "unavailable",
      alternate_process: "offline_emergency_or_medical_channel",
    });
    await expect(
      prisma.nurtureFamilyCareMessage.count({ where: { workspaceId: scope.workspaceId } }),
    ).resolves.toBe(0);
    await expect(
      prisma.nurtureInteractionContext.count({ where: { workspaceId: scope.workspaceId } }),
    ).resolves.toBe(0);
  });

  it("denies when no current bidirectional grant exists", async () => {
    const scope = await seedScope({ grantStatus: "revoked" });
    const decision = await prepare(scope, "想咨询一下");
    expect(decision).toEqual({ status: "denied", reason_code: "not_authorized" });
  });

  it("refuses drifted input at execute without consuming the confirmation", async () => {
    const scope = await seedScope();
    const ready = requireReady(await prepare(scope, "确认后的内容"));
    const drifted = await execute(scope, ready, "被改掉的内容");
    expect(drifted).toMatchObject({
      status: "not_committed",
      decision: "conflict",
      reason_code: "input_integrity_mismatch",
    });
    await expect(
      prisma.nurtureFamilyCareMessage.count({ where: { workspaceId: scope.workspaceId } }),
    ).resolves.toBe(0);
    const recovered = await execute(scope, ready, "确认后的内容");
    expect(recovered).toMatchObject({ status: "ok", disposition: "executed" });
  });

  it("carries an eligible context continuation and rejects an ineligible one", async () => {
    const scope = await seedScope();
    const first = requireReady(await prepare(scope, "第一条问题"));
    await execute(scope, first, "第一条问题");
    const sourceItem = await prisma.nurtureFamilyCareItem.findFirstOrThrow({
      where: { workspaceId: scope.workspaceId },
    });

    // Clients receive a signed care-item ref from the query lane, so the
    // continuation input is that same signed ref — a raw id is refused.
    const continuationRef = issueCareItemTargetRef(INTEGRITY_KEY, {
      workspace_id: scope.workspaceId,
      participant_id: scope.guardian.id,
      item_id: sourceItem.id,
    });
    await expect(
      prepare(scope, "继续沟通", { continuation_ref: sourceItem.id }),
    ).resolves.toEqual({ status: "denied", reason_code: "invalid_continuation" });

    const notResponded = await prepare(scope, "继续沟通", {
      continuation_ref: continuationRef,
    });
    expect(notResponded).toEqual({ status: "denied", reason_code: "invalid_continuation" });

    await prisma.nurtureFamilyCareItem.update({
      where: { id: sourceItem.id },
      data: { responseState: "responded" },
    });
    const ready = requireReady(
      await prepare(scope, "继续沟通", { continuation_ref: continuationRef }),
    );
    const committed = await execute(scope, ready, "继续沟通", sourceItem.id);
    expect(committed).toMatchObject({ status: "ok", disposition: "executed" });
    const continuationItem = await prisma.nurtureFamilyCareItem.findFirstOrThrow({
      where: { workspaceId: scope.workspaceId, contextContinuationOfItemId: sourceItem.id },
    });
    expect(continuationItem.id).not.toBe(sourceItem.id);
  });
});
