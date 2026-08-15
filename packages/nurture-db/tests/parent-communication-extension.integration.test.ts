import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { createPrismaClient } from "../src/client.js";
import { createAesGcmProtectedContentPort } from "../src/protected-content.js";
import { createPrismaParentCommunicationOwnerBinding } from "../src/parent-communication-owner.composition.js";
import { createPrismaParentCommunicationExtensionBinding } from "../src/parent-communication-extension.composition.js";
import { seedT010FamilySharingFixture } from "./helpers/t010-family-sharing-fixture.js";
import { parentContextSelectionFor } from "./helpers/parent-context-selection.js";

// W11-3 owner-side proof: the guardian redaction preview/commit pair and
// the delivery aggregate over real v1-sent messages, receipts and the
// generic command ledger on a disposable database.
const prisma = createPrismaClient();
const INTEGRITY_KEY = "w11-parent-communication-extension-key-32chars";
const protectedContent = createAesGcmProtectedContentPort({
  keyRef: "w11-content-k1",
  keyMaterial: "w11-parent-communication-content-key-32chars",
});

afterAll(async () => {
  await prisma.$disconnect();
});

const requireRecord = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("expected record");
  }
  return value as Record<string, unknown>;
};

// Seeds the v1 world, sends one guardian message through the FROZEN v1
// owner (prepare + confirm), and assembles the extension binding over the
// same integrity key so v1-issued refs resolve in the extension.
const seedWorld = async () => {
  const base = await prisma.$transaction((transaction) =>
    seedT010FamilySharingFixture(transaction, `w11-ext-${randomUUID().slice(0, 8)}`));
  await prisma.nurtureChildCareProcess.update({
    where: { id: base.processId },
    data: { primaryFamilyId: base.familyId, aggregateVersion: { increment: 1 } },
  });
  const caregiver = await prisma.nurtureParticipant.create({
    data: {
      workspaceId: base.workspaceId,
      myChatUserId: `w11-caregiver-${base.runId}`,
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
  await prisma.nurtureChildLinkGrant.create({
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
  const v1 = createPrismaParentCommunicationOwnerBinding({
    prisma,
    protectedContent,
    integrityKey: INTEGRITY_KEY,
  });
  const extension = createPrismaParentCommunicationExtensionBinding({
    prisma,
    integrityKey: INTEGRITY_KEY,
  });
  const identity = {
    workspace_id: base.workspaceId,
    my_chat_user_id: base.myChatUserId,
    host_request_id: `host-${randomUUID()}`,
    context_ref: contextRef,
  };
  const selectionFor = (request: typeof identity) => parentContextSelectionFor({
    workspaceId: request.workspace_id,
    myChatUserId: request.my_chat_user_id,
    hostRequestId: request.host_request_id,
    contextRef: request.context_ref,
    childAnchorId: base.childAnchorId,
    familyAnchorId: base.familyAnchorId,
    childOwnerVersion: 4,
    familyOwnerVersion: 5,
  });
  const resolved = await v1.authorityResolver.resolve({
    operation: "summary_query",
    ...identity,
    context_selection: selectionFor(identity),
  });
  if (resolved.status !== "resolved") throw new Error("v1 authority did not resolve");
  const summary = requireRecord(await v1.owner.execute({
    operation: "summary_query",
    request: identity,
    authority: resolved.authority,
  }));
  const presentationVersion = String(summary.presentation_version);
  const sendCommandId = `send-${randomUUID()}`;
  const prepared = requireRecord(await v1.owner.execute({
    operation: "send_text_exchange",
    request: {
      kind: "prepare",
      ...identity,
      presentation_version: presentationVersion,
      segment: "teachers",
      command_request_id: sendCommandId,
      body: "老师您好，今天接孩子会晚十分钟。",
      purpose: "family_teacher_communication",
    },
    authority: resolved.authority,
  }));
  const committed = requireRecord(await v1.owner.execute({
    operation: "send_text_exchange",
    request: {
      kind: "confirm",
      ...identity,
      presentation_version: presentationVersion,
      segment: "teachers",
      command_request_id: sendCommandId,
      confirmation_ref: String(prepared.confirmation_ref),
      prepared_preview_digest: String(prepared.prepared_preview_digest),
      purpose: "family_teacher_communication",
    },
    authority: resolved.authority,
  }));
  if (committed.status !== "committed") {
    throw new Error(`v1 send did not commit: ${JSON.stringify(committed)}`);
  }
  const message = await prisma.nurtureFamilyCareMessage.findFirstOrThrow({
    where: { workspaceId: base.workspaceId, threadId: thread.id },
  });
  // The extension answers the CURRENT presentation; re-resolve and re-read
  // after the send moved the heads.
  const postIdentity = { ...identity, host_request_id: `host-${randomUUID()}` };
  const postResolved = await v1.authorityResolver.resolve({
    operation: "summary_query",
    ...postIdentity,
    context_selection: selectionFor(postIdentity),
  });
  if (postResolved.status !== "resolved") {
    throw new Error("post-send authority did not resolve");
  }
  const postSummary = requireRecord(await v1.owner.execute({
    operation: "summary_query",
    request: { ...identity, host_request_id: `host-${randomUUID()}` },
    authority: postResolved.authority,
  }));
  return {
    base,
    thread,
    identity,
    extension,
    messageId: message.id,
    messageRef: String(committed.message_ref),
    presentationVersion: String(postSummary.presentation_version),
    selectionFor,
  };
};

type World = Awaited<ReturnType<typeof seedWorld>>;

const authorityFor = (
  world: World,
  request: Readonly<{
    workspace_id: string;
    my_chat_user_id: string;
    host_request_id: string;
    context_ref: string;
  }>,
) => ({
  presentation_role: "parent" as const,
  scope_kind: "parent_communication" as const,
  context_ref: request.context_ref,
  resolution_ref: "test-resolution",
  scope_version: 1,
  context_selection: world.selectionFor(request),
});

const previewFor = async (world: World, commandRequestId: string) => {
  const request = {
    ...world.identity,
    host_request_id: `host-${randomUUID()}`,
    message_ref: world.messageRef,
    presentation_version: world.presentationVersion,
    command_request_id: commandRequestId,
  };
  const response = requireRecord(await world.extension.owner.redactionPreview({
    request,
    authority: authorityFor(world, request),
  }));
  return { request, response };
};

describe("W11 parent-communication extension on real Prisma facts", () => {
  it("previews, commits and replays the guardian redaction end to end", async () => {
    const world = await seedWorld();
    const commandRequestId = `redact-${randomUUID()}`;
    const { request, response: preview } = await previewFor(world, commandRequestId);
    expect(preview).toMatchObject({
      status: "ready_to_confirm",
      command_request_id: commandRequestId,
      preview: {
        message_ref: world.messageRef,
        cascade_scope: "source_question",
        affected_reply_count: 0,
        derived_record_present: false,
        effect: "redact_family_care_message_irreversibly",
      },
    });

    const confirm = {
      ...request,
      host_request_id: `host-${randomUUID()}`,
      confirmation_ref: String(preview.confirmation_ref),
      prepared_preview_digest: String(preview.prepared_preview_digest),
    };
    const committed = requireRecord(await world.extension.owner.redact({
      request: confirm,
      authority: authorityFor(world, confirm),
    }));
    expect(committed).toMatchObject({
      status: "committed",
      execution_disposition: "executed",
      disposition: "applied",
      command_request_id: commandRequestId,
      message_ref: world.messageRef,
      // Exactly what the preview promised (zero replies) — never the
      // internal cascade fan-out.
      cascade: { scope: "source_question", affected_count: 0 },
    });
    expect(typeof committed.redacted_at).toBe("string");
    const message = await prisma.nurtureFamilyCareMessage.findFirstOrThrow({
      where: { id: world.messageId },
    });
    expect(message.status).toBe("redacted");
    await expect(prisma.nurtureFamilyCareCascadeAudit.count({
      where: { workspaceId: world.base.workspaceId },
    })).resolves.toBeGreaterThan(0);

    const replayRequest = { ...confirm, host_request_id: `host-${randomUUID()}` };
    const replay = requireRecord(await world.extension.owner.redact({
      request: replayRequest,
      authority: authorityFor(world, replayRequest),
    }));
    expect(replay).toMatchObject({
      status: "committed",
      execution_disposition: "replayed",
      disposition: "applied",
      redacted_at: committed.redacted_at,
    });
  });

  it("answers already_satisfied for a fresh command against the redacted message", async () => {
    const world = await seedWorld();
    const first = await previewFor(world, `redact-${randomUUID()}`);
    const firstConfirm = {
        ...first.request,
        host_request_id: `host-${randomUUID()}`,
        confirmation_ref: String(first.response.confirmation_ref),
        prepared_preview_digest: String(first.response.prepared_preview_digest),
    };
    await world.extension.owner.redact({
      request: firstConfirm,
      authority: authorityFor(world, firstConfirm),
    });

    const second = await previewFor(world, `redact-${randomUUID()}`);
    const secondConfirm = {
        ...second.request,
        host_request_id: `host-${randomUUID()}`,
        confirmation_ref: String(second.response.confirmation_ref),
        prepared_preview_digest: String(second.response.prepared_preview_digest),
    };
    const satisfied = requireRecord(await world.extension.owner.redact({
      request: secondConfirm,
      authority: authorityFor(world, secondConfirm),
    }));
    expect(satisfied).toMatchObject({
      status: "committed",
      disposition: "already_satisfied",
      message_ref: world.messageRef,
    });
    expect(satisfied).not.toHaveProperty("redacted_at");
    expect(satisfied).not.toHaveProperty("cascade");
  });

  it("refuses a divergent reuse of the same command identity", async () => {
    const world = await seedWorld();
    const commandRequestId = `redact-${randomUUID()}`;
    const first = await previewFor(world, commandRequestId);
    const firstConfirm = {
        ...first.request,
        host_request_id: `host-${randomUUID()}`,
        confirmation_ref: String(first.response.confirmation_ref),
        prepared_preview_digest: String(first.response.prepared_preview_digest),
    };
    const committed = requireRecord(await world.extension.owner.redact({
      request: firstConfirm,
      authority: authorityFor(world, firstConfirm),
    }));
    expect(committed.status).toBe("committed");

    // Same command id, different confirmation → different canonical
    // payload → the ledger denies the divergence.
    const second = await previewFor(world, commandRequestId);
    const secondConfirm = {
        ...second.request,
        host_request_id: `host-${randomUUID()}`,
        confirmation_ref: String(second.response.confirmation_ref),
        prepared_preview_digest: String(second.response.prepared_preview_digest),
    };
    const divergent = requireRecord(await world.extension.owner.redact({
      request: secondConfirm,
      authority: authorityFor(world, secondConfirm),
    }));
    expect(divergent).toMatchObject({
      status: "not_committed",
      reason_code: "command_payload_conflict",
      recovery: "new_command",
    });
  });

  it("aggregates delivery receipts over live rows", async () => {
    const world = await seedWorld();
    const request = {
      ...world.identity,
      host_request_id: `host-${randomUUID()}`,
      message_ref: world.messageRef,
    };
    // The v1 confirm lands the receipt as delivered in the same commit.
    const delivered = requireRecord(await world.extension.owner.deliveryReceipt({
      request,
      authority: authorityFor(world, request),
    }));
    expect(delivered).toMatchObject({
      status: "ready",
      message_ref: world.messageRef,
      delivery: { delivery_state: "delivered" },
    });

    await prisma.nurtureChildLinkReceipt.updateMany({
      where: {
        workspaceId: world.base.workspaceId,
        sourceType: "family_care_message",
        sourceId: world.messageId,
      },
      data: { status: "read", readAt: new Date("2026-08-15T08:59:00.000Z") },
    });
    const readRequest = { ...request, host_request_id: `host-${randomUUID()}` };
    const read = requireRecord(await world.extension.owner.deliveryReceipt({
      request: readRequest,
      authority: authorityFor(world, readRequest),
    }));
    expect(read).toMatchObject({
      status: "ready",
      delivery: {
        delivery_state: "read",
        advanced_at: "2026-08-15T08:59:00.000Z",
      },
    });
    expect(JSON.stringify(read)).not.toContain(world.messageId);
  });

  it("masks foreign refs and stale contexts through the v1 boundary", async () => {
    const world = await seedWorld();
    const foreignRequest = {
        ...world.identity,
        host_request_id: `host-${randomUUID()}`,
        message_ref: "0".repeat(64),
    };
    const foreign = requireRecord(await world.extension.owner.deliveryReceipt({
      request: foreignRequest,
      authority: authorityFor(world, foreignRequest),
    }));
    expect(foreign).toMatchObject({
      status: "masked",
      mask_signal: { reason_code: "access_changed" },
    });

    const stale = await world.extension.authorityResolver.resolve({
      ...world.identity,
      context_ref: "context-foreign",
      operation: "delivery_receipt_query",
      message_ref: world.messageRef,
      context_selection: world.selectionFor({
        ...world.identity,
        context_ref: `stale-${world.identity.context_ref}`,
      }),
    });
    expect(stale.status).toBe("closed");
    expect(
      (stale as { response: Record<string, unknown> }).response,
    ).toMatchObject({
      status: "masked",
      mask_signal: { reason_code: "context_changed" },
    });
  });
});
