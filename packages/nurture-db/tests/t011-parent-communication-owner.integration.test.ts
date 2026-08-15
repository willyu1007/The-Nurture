import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { hashScenarioToken } from "@the-nurture/scenario";
import { createPrismaClient } from "../src/client.js";
import { createAesGcmProtectedContentPort } from "../src/protected-content.js";
import { createPrismaParentCommunicationOwnerBinding } from "../src/parent-communication-owner.composition.js";
import { seedT010FamilySharingFixture } from "./helpers/t010-family-sharing-fixture.js";
import { parentContextSelectionFor } from "./helpers/parent-context-selection.js";
import { assertPublishedParentCommunicationOwnerResponse } from "../../../apps/scenario-service/src/parent-communication-owner-response-validator.js";

const prisma = createPrismaClient();
const INTEGRITY_KEY = "t011-parent-communication-integrity-key-32chars";
const protectedContent = createAesGcmProtectedContentPort({
  keyRef: "t011-content-k1",
  keyMaterial: "t011-parent-communication-content-key-32chars",
});

afterAll(async () => {
  await prisma.$disconnect();
});

const seedScope = async () => {
  const base = await prisma.$transaction((transaction) =>
    seedT010FamilySharingFixture(transaction, "t011-parent-communication"));
  await prisma.nurtureChildCareProcess.update({
    where: { id: base.processId },
    data: { primaryFamilyId: base.familyId, aggregateVersion: { increment: 1 } },
  });
  const caregiver = await prisma.nurtureParticipant.create({
    data: {
      workspaceId: base.workspaceId,
      myChatUserId: `t011-caregiver-${base.runId}`,
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
  const grant = await prisma.nurtureChildLinkGrant.create({
    data: {
      workspaceId: base.workspaceId,
      childCareProcessId: base.processId,
      enrollmentId: base.enrollmentId,
      grantedByParticipantId: base.participantId,
      grantedToScopeType: "care_group",
      grantedToScopeId: base.careGroupId,
      directions: ["family_to_org", "org_to_family"],
      dataClasses: ["family_care_question"],
      purposes: ["family_care_workflow"],
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
  const guardianMembership = await prisma.nurtureFamilyCareThreadParticipant.create({
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
  await prisma.nurtureFamilyCareThreadParticipant.create({
    data: {
      workspaceId: base.workspaceId,
      threadId: thread.id,
      participantId: caregiver.id,
      roleAssignmentId: caregiverRole.id,
      participantKind: "caregiver",
      visibilityStatus: "active",
      aggregateVersion: 7,
    },
  });
  const contextRef = `context-${base.runId}`;
  const binding = createPrismaParentCommunicationOwnerBinding({
    prisma,
    protectedContent,
    integrityKey: INTEGRITY_KEY,
  });
  return { ...base, caregiver, grant, thread, guardianMembership, contextRef, binding };
};

const requireRecord = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("expected record");
  }
  return value as Record<string, unknown>;
};

const selectionFor = (
  scope: Awaited<ReturnType<typeof seedScope>>,
  identity: Readonly<{
    workspace_id: string;
    my_chat_user_id: string;
    host_request_id: string;
    context_ref: string;
  }>,
) => parentContextSelectionFor({
  workspaceId: identity.workspace_id,
  myChatUserId: identity.my_chat_user_id,
  hostRequestId: identity.host_request_id,
  contextRef: identity.context_ref,
  childAnchorId: scope.childAnchorId,
  familyAnchorId: scope.familyAnchorId,
  childOwnerVersion: 4,
  familyOwnerVersion: 5,
});

describe("T-011 W3.1 parent communication owner", () => {
  it("qualifies current reads, atomic send, exact replay and protected content", async () => {
    const scope = await seedScope();
    const identity = {
      workspace_id: scope.workspaceId,
      my_chat_user_id: scope.myChatUserId,
      host_request_id: `host-${randomUUID()}`,
      context_ref: scope.contextRef,
    };
    const resolved = await scope.binding.authorityResolver.resolve({
      operation: "summary_query",
      ...identity,
      context_selection: selectionFor(scope, identity),
    });
    expect(resolved.status).toBe("resolved");
    if (resolved.status !== "resolved") throw new Error("authority did not resolve");
    const summary = requireRecord(await scope.binding.owner.execute({
      operation: "summary_query",
      request: identity,
      authority: resolved.authority,
    }));
    expect(summary).toMatchObject({
      status: "ready",
      segments: {
        teachers: { available: true, unread_count: 0 },
        class_group: { available: false, unread_count: 0 },
      },
    });
    expect(() => assertPublishedParentCommunicationOwnerResponse("summary_query", summary)).not.toThrow();
    const presentationVersion = String(summary.presentation_version);
    const initialDetail = requireRecord(await scope.binding.owner.execute({
      operation: "detail_query",
      request: { ...identity, segment: "teachers", page_size: 20 },
      authority: resolved.authority,
    }));
    expect(initialDetail.presentation_version).toBe(presentationVersion);
    expect(initialDetail).toMatchObject({
      status: "ready",
      members: [{ display_name: "林老师", role_display: "主带班老师" }],
      messages: [],
    });
    const commandRequestId = `send-${randomUUID()}`;
    const body = "老师您好，今天接孩子会晚十分钟。";
    const prepared = requireRecord(await scope.binding.owner.execute({
      operation: "send_text_exchange",
      request: {
        kind: "prepare",
        ...identity,
        presentation_version: presentationVersion,
        segment: "teachers",
        command_request_id: commandRequestId,
        body,
        purpose: "family_teacher_communication",
      },
      authority: resolved.authority,
    }));
    expect(prepared).toMatchObject({
      status: "ready_to_confirm",
      command_request_id: commandRequestId,
      preview: { body, effect: "send_text_message" },
    });
    expect(() => assertPublishedParentCommunicationOwnerResponse("send_text_exchange", prepared)).not.toThrow();
    await expect(prisma.nurtureFamilyCareMessage.count({
      where: { workspaceId: scope.workspaceId },
    })).resolves.toBe(0);
    await expect(prisma.nurtureCommandExecution.count({
      where: { workspaceId: scope.workspaceId },
    })).resolves.toBe(1);
    // The fixture owns one unrelated historical execution; prepare itself
    // creates only the expiring interaction context and no business fact.
    const confirmRequest = {
      kind: "confirm" as const,
      ...identity,
      presentation_version: presentationVersion,
      segment: "teachers" as const,
      command_request_id: commandRequestId,
      confirmation_ref: String(prepared.confirmation_ref),
      prepared_preview_digest: String(prepared.prepared_preview_digest),
      purpose: "family_teacher_communication" as const,
    };
    const committed = requireRecord(await scope.binding.owner.execute({
      operation: "send_text_exchange",
      request: confirmRequest,
      authority: resolved.authority,
    }));
    expect(committed).toMatchObject({
      status: "committed",
      execution_disposition: "executed",
      command_request_id: commandRequestId,
    });
    expect(() => assertPublishedParentCommunicationOwnerResponse("send_text_exchange", committed)).not.toThrow();
    expect(String(committed.message_ref)).not.toContain(scope.thread.id);
    const message = await prisma.nurtureFamilyCareMessage.findFirstOrThrow({
      where: { workspaceId: scope.workspaceId },
    });
    expect(message).toMatchObject({
      body: null,
      bodyStorageMode: "encrypted",
      writerContract: "harness_g2_v1",
      direction: "family_to_org",
    });
    expect(protectedContent.unseal(message.bodyProtectionPayload as never)).toBe(body);
    expect(JSON.stringify(message.bodyProtectionPayload)).not.toContain(body);
    await expect(prisma.nurtureFamilyCareItem.count({ where: { workspaceId: scope.workspaceId } })).resolves.toBe(1);
    await expect(prisma.nurtureFamilyCareItemEvent.count({ where: { workspaceId: scope.workspaceId } })).resolves.toBe(1);
    await expect(prisma.nurtureChildLinkReceipt.count({ where: { workspaceId: scope.workspaceId } })).resolves.toBe(1);
    await expect(prisma.nurtureTeacherAttentionItem.count({ where: { workspaceId: scope.workspaceId } })).resolves.toBe(1);
    const replayAuthority = await scope.binding.authorityResolver.resolve({
      operation: "send_text_exchange",
      ...identity,
      context_selection: selectionFor(scope, identity),
    });
    expect(replayAuthority.status).toBe("resolved");
    if (replayAuthority.status !== "resolved") throw new Error("replay authority did not resolve");
    const detail = requireRecord(await scope.binding.owner.execute({
      operation: "detail_query",
      request: { ...identity, segment: "teachers", page_size: 20 },
      authority: replayAuthority.authority,
    }));
    expect(detail).toMatchObject({
      status: "ready",
      segment: "teachers",
      members: [{ display_name: "林老师", role_display: "主带班老师" }],
      messages: [{ kind: "text", sender_kind: "parent", body }],
    });
    expect(() => assertPublishedParentCommunicationOwnerResponse("detail_query", detail)).not.toThrow();
    const replay = requireRecord(await scope.binding.owner.execute({
      operation: "send_text_exchange",
      request: confirmRequest,
      authority: replayAuthority.authority,
    }));
    expect(replay).toEqual({ ...committed, execution_disposition: "replayed" });
    expect(() => assertPublishedParentCommunicationOwnerResponse("send_text_exchange", replay)).not.toThrow();
    await expect(prisma.nurtureFamilyCareMessage.count({ where: { workspaceId: scope.workspaceId } })).resolves.toBe(1);

    // The command ledger is workspace-scoped, so the command payload must
    // carry an actor-bound opaque value. A second authorized guardian cannot
    // turn a known command id and preview digest into another actor's replay.
    const otherGuardian = await prisma.nurtureParticipant.create({
      data: {
        workspaceId: scope.workspaceId,
        myChatUserId: `other-guardian-${scope.runId}`,
        status: "active",
      },
    });
    const otherRole = await prisma.nurtureCareRoleAssignment.create({
      data: {
        workspaceId: scope.workspaceId,
        participantId: otherGuardian.id,
        role: "guardian",
        scopeType: "family",
        scopeId: scope.familyId,
        status: "active",
      },
    });
    await prisma.nurtureFamilyCareThreadParticipant.create({
      data: {
        workspaceId: scope.workspaceId,
        threadId: scope.thread.id,
        participantId: otherGuardian.id,
        roleAssignmentId: otherRole.id,
        participantKind: "guardian",
        visibilityStatus: "active",
      },
    });
    const otherIdentity = {
      ...identity,
      my_chat_user_id: otherGuardian.myChatUserId,
      host_request_id: `host-${randomUUID()}`,
    };
    const otherAuthority = await scope.binding.authorityResolver.resolve({
      operation: "send_text_exchange",
      ...otherIdentity,
      context_selection: selectionFor(scope, otherIdentity),
    });
    expect(otherAuthority.status).toBe("resolved");
    if (otherAuthority.status !== "resolved") {
      throw new Error("other guardian authority did not resolve");
    }
    const crossActorReplay = requireRecord(await scope.binding.owner.execute({
      operation: "send_text_exchange",
      request: { ...confirmRequest, ...otherIdentity },
      authority: otherAuthority.authority,
    }));
    expect(crossActorReplay).toMatchObject({
      status: "not_committed",
      command_request_id: commandRequestId,
      reason_code: "message_rejected",
    });
    await expect(prisma.nurtureFamilyCareMessage.count({
      where: { workspaceId: scope.workspaceId },
    })).resolves.toBe(1);
  });

  it("rolls back confirm consumption when current authority is revoked", async () => {
    const scope = await seedScope();
    const identity = {
      workspace_id: scope.workspaceId,
      my_chat_user_id: scope.myChatUserId,
      host_request_id: `host-${randomUUID()}`,
      context_ref: scope.contextRef,
    };
    const resolved = await scope.binding.authorityResolver.resolve({
      operation: "summary_query",
      ...identity,
      context_selection: selectionFor(scope, identity),
    });
    if (resolved.status !== "resolved") throw new Error("authority did not resolve");
    const summary = requireRecord(await scope.binding.owner.execute({
      operation: "summary_query",
      request: identity,
      authority: resolved.authority,
    }));
    const commandRequestId = `send-${randomUUID()}`;
    const prepared = requireRecord(await scope.binding.owner.execute({
      operation: "send_text_exchange",
      request: {
        kind: "prepare",
        ...identity,
        presentation_version: String(summary.presentation_version),
        segment: "teachers",
        command_request_id: commandRequestId,
        body: "这条消息不应提交。",
        purpose: "family_teacher_communication",
      },
      authority: resolved.authority,
    }));
    await prisma.nurtureCareRoleAssignment.update({
      where: { id: scope.roleAssignmentId },
      data: { status: "revoked", aggregateVersion: { increment: 1 } },
    });
    const confirmationRef = String(prepared.confirmation_ref);
    const rejected = requireRecord(await scope.binding.owner.execute({
      operation: "send_text_exchange",
      request: {
        kind: "confirm",
        ...identity,
        presentation_version: String(summary.presentation_version),
        segment: "teachers",
        command_request_id: commandRequestId,
        confirmation_ref: confirmationRef,
        prepared_preview_digest: String(prepared.prepared_preview_digest),
        purpose: "family_teacher_communication",
      },
      authority: resolved.authority,
    }));
    expect(rejected).toMatchObject({ status: "not_committed", reason_code: "access_changed" });
    expect(() => assertPublishedParentCommunicationOwnerResponse("send_text_exchange", rejected)).not.toThrow();
    await expect(prisma.nurtureFamilyCareMessage.count({ where: { workspaceId: scope.workspaceId } })).resolves.toBe(0);
    const context = await prisma.nurtureInteractionContext.findUniqueOrThrow({
      where: {
        workspaceId_tokenHash: {
          workspaceId: scope.workspaceId,
          tokenHash: hashScenarioToken(scope.workspaceId, confirmationRef),
        },
      },
    });
    expect(context.status).toBe("active");
  });
});
