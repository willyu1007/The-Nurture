import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import {
  NurtureCommandRunner,
  acknowledgeFamilyCareItemSpec,
  redactFamilyCareMessageSpec,
  replyFamilyCareItemSpec,
  revokeFamilyCareGrantSpec,
  familyCareRef,
} from "@the-nurture/scenario";
import { createPrismaClient } from "../src/client.js";
import { PrismaNurtureCommandRepository } from "../src/repositories/institution-core.repositories.js";

// Single-writer cutover (10-g2-schema-freeze.md C6/C8, T005-AC-007): the
// legacy loop handlers are read/migration compatibility only. They must never
// mutate a harness-managed row, because the canonical state of such a row
// lives on the three axes rather than the derived legacy status column.
const prisma = createPrismaClient();
const runner = new NurtureCommandRunner(new PrismaNurtureCommandRepository(prisma));

afterAll(async () => {
  await prisma.$disconnect();
});

const seedG2Item = async (options: { writerContract?: "harness_g2_v1" | "legacy_v1" } = {}) => {
  const writerContract = options.writerContract ?? "harness_g2_v1";
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
  const isG2 = writerContract === "harness_g2_v1";
  const message = await prisma.nurtureFamilyCareMessage.create({
    data: {
      workspaceId,
      threadId: thread.id,
      childCareProcessId: process.id,
      senderParticipantId: guardian.id,
      senderRoleAssignmentId: guardianRole.id,
      messageKind: "family_message",
      authorshipKind: "family_authored",
      bodyFormat: "plain_text",
      bodyStorageMode: isG2 ? "encrypted" : "protected",
      bodyProtectionPayload: isG2
        ? { algVersion: 1, keyRef: "k", ciphertext: "x", integrityTag: "y" }
        : { content_ref: "legacy" },
      sourceSurface: "mobile",
      grantId: grant.id,
      status: "sent",
      writerContract,
      ...(isG2
        ? { enrollmentId: enrollment.id, careGroupId: group.id, direction: "family_to_org" as const }
        : {}),
    },
  });
  const item = await prisma.nurtureFamilyCareItem.create({
    data: {
      workspaceId,
      sourceMessageId: message.id,
      threadId: thread.id,
      childCareProcessId: process.id,
      familyId: family.id,
      enrollmentId: enrollment.id,
      careGroupId: group.id,
      dataClass: "family_care_question",
      category: "question",
      summary: "New family care question",
      urgency: "today_attention",
      requiresAck: true,
      requiresReply: true,
      status: "open",
      classificationSource: "system",
      grantId: grant.id,
      writerContract,
    },
  });
  return { workspaceId, guardian, caregiver, guardianRole, caregiverRole, process, grant, message, item };
};

type Scope = Awaited<ReturnType<typeof seedG2Item>>;

const runLegacy = <T>(scope: Scope, actorId: string, payload: T, spec: never) =>
  runner.execute({
    workspace_id: scope.workspaceId,
    invocation_request_id: `invocation:${randomUUID()}`,
    command_request_id: `command:${randomUUID()}`,
    business_actor_ref: actorId,
    child_care_process_id: scope.process.id,
    payload,
    spec,
  });

describe("legacy single-writer cutover", () => {
  it("refuses a legacy acknowledge against a harness-managed item", async () => {
    const scope = await seedG2Item();
    const result = await runLegacy(
      scope,
      scope.caregiver.id,
      {
        participant_id: scope.caregiver.id,
        role_assignment_id: scope.caregiverRole.id,
        item_id: scope.item.id,
        expected_version: scope.item.version,
        required_direction: "family_to_org" as const,
      },
      acknowledgeFamilyCareItemSpec as never,
    );
    expect(result.status).toBe("not_committed");
    await expect(
      prisma.nurtureFamilyCareItem.findFirstOrThrow({ where: { id: scope.item.id } }),
    ).resolves.toMatchObject({
      status: "open",
      acknowledgementState: "pending",
      acknowledgementHead: 0,
      ackedByParticipantId: null,
      version: scope.item.version,
    });
  });

  it("refuses a legacy reply against a harness-managed item and writes nothing", async () => {
    const scope = await seedG2Item();
    const result = await runLegacy(
      scope,
      scope.caregiver.id,
      {
        participant_id: scope.caregiver.id,
        role_assignment_id: scope.caregiverRole.id,
        item_id: scope.item.id,
        expected_version: scope.item.version,
        required_direction: "org_to_family" as const,
        protected_content_ref: familyCareRef("protected_message_content", "legacy-body", 1),
        safe_summary: "legacy reply",
        routing_attempt_key: `legacy:${randomUUID()}`,
      },
      replyFamilyCareItemSpec as never,
    );
    expect(result.status).toBe("not_committed");
    await expect(
      prisma.nurtureFamilyCareMessage.count({
        where: { workspaceId: scope.workspaceId, messageKind: "caregiver_reply" },
      }),
    ).resolves.toBe(0);
    await expect(
      prisma.nurtureFamilyCareItem.findFirstOrThrow({ where: { id: scope.item.id } }),
    ).resolves.toMatchObject({
      status: "open",
      responseState: "awaiting_reply",
      responseHead: 0,
      linkedReplyMessageId: null,
    });
  });

  it("refuses a legacy redaction against a harness-managed message", async () => {
    const scope = await seedG2Item();
    const result = await runLegacy(
      scope,
      scope.guardian.id,
      {
        participant_id: scope.guardian.id,
        role_assignment_id: scope.guardianRole.id,
        message_id: scope.message.id,
        expected_version: scope.message.aggregateVersion,
        reason_code: "author_redacted",
      },
      redactFamilyCareMessageSpec as never,
    );
    expect(result.status).toBe("not_committed");
    await expect(
      prisma.nurtureFamilyCareMessage.findFirstOrThrow({ where: { id: scope.message.id } }),
    ).resolves.toMatchObject({ status: "sent", bodyStorageMode: "encrypted" });
  });

  it("still lets the legacy path drive genuinely legacy rows", async () => {
    const scope = await seedG2Item({ writerContract: "legacy_v1" });
    const result = await runLegacy(
      scope,
      scope.caregiver.id,
      {
        participant_id: scope.caregiver.id,
        role_assignment_id: scope.caregiverRole.id,
        item_id: scope.item.id,
        expected_version: scope.item.version,
        required_direction: "family_to_org" as const,
      },
      acknowledgeFamilyCareItemSpec as never,
    );
    expect(result).toMatchObject({ status: "ok" });
    await expect(
      prisma.nurtureFamilyCareItem.findFirstOrThrow({ where: { id: scope.item.id } }),
    ).resolves.toMatchObject({
      status: "acknowledged",
      // The three axes stay untouched on a legacy row: they are only
      // trustworthy once the row is migrated to legacy_migrated_v1.
      acknowledgementState: "pending",
      writerContract: "legacy_v1",
    });
  });

  it("moves the canonical lifecycle axis when a grant revoke suppresses a harness item", async () => {
    const scope = await seedG2Item();
    const result = await runner.execute({
      workspace_id: scope.workspaceId,
      invocation_request_id: `invocation:${randomUUID()}`,
      command_request_id: `command:${randomUUID()}`,
      business_actor_ref: scope.guardian.id,
      child_care_process_id: scope.process.id,
      payload: {
        participant_id: scope.guardian.id,
        role_assignment_id: scope.guardianRole.id,
        grant_id: scope.grant.id,
        expected_version: scope.grant.aggregateVersion,
        reason_code: "user_revoked",
      },
      spec: revokeFamilyCareGrantSpec as never,
    });
    expect(result).toMatchObject({ status: "ok" });
    await expect(
      prisma.nurtureFamilyCareItem.findFirstOrThrow({ where: { id: scope.item.id } }),
    ).resolves.toMatchObject({
      status: "suppressed",
      lifecycleState: "suppressed",
      lifecycleReason: "grant_revoked",
      lifecycleHead: 1,
    });
  });
});
