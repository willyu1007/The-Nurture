import type { AddressInfo } from "node:net";
import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  INSTITUTION_BUSINESS_COMMUNICATION_INTERFACE,
  issueCareItemTargetRef,
  issueFamilyCareMessageTargetRef,
} from "@the-nurture/scenario/harness";
import { createPrismaClient, Prisma } from "@the-nurture/db";
import { createScenarioServiceApplication } from "../src/application.js";
import { createBindingOwnerServiceAuth } from "../src/binding-owner-service-auth.js";
import { createHarnessRuntime } from "../src/harness-runtime.js";
import { loadScenarioServiceConfig } from "../src/config.js";
import {
  HARNESS_EXECUTE_PATH,
  HARNESS_PREPARE_PATH,
  HARNESS_QUERY_PATH,
  HARNESS_READ_RESULT_PATH,
  INSTITUTION_BUSINESS_COMMUNICATION_READ_PATH,
} from "../src/harness-http.js";

// Full G2-A loop through the formal NestJS ingress on the real disposable
// PostgreSQL: guardian submit -> caregiver acknowledge -> caregiver reply.
const TOKEN = "harness-db-e2e-service-token-32-chars!";
const INTEGRITY_KEY = "harness-db-e2e-integrity-key-32chars!!!";
const CONTENT_KEY = "harness-db-e2e-content-key-32chars!!!!!";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required for the Harness ingress suite.");
}

const prisma = createPrismaClient(databaseUrl);
let baseUrl = "";
let closeService: (() => Promise<void>) | undefined;

beforeAll(async () => {
  const serviceAuth = createBindingOwnerServiceAuth(TOKEN);
  const runtimeEnv = {
    DATABASE_URL: databaseUrl,
    NURTURE_HARNESS_INTEGRITY_KEY: INTEGRITY_KEY,
    NURTURE_PROTECTED_CONTENT_KEY: CONTENT_KEY,
    NURTURE_INSTITUTION_BUSINESS_COMMUNICATION_READ_ENABLED: "true",
  };
  const harnessRuntime = createHarnessRuntime({
    env: runtimeEnv,
    serviceAuth,
    institutionBusinessCommunicationReadEnabled:
      loadScenarioServiceConfig(runtimeEnv)
        .institutionBusinessCommunicationReadEnabled,
  });
  const { app } = await createScenarioServiceApplication({
    bindingOwnerServiceAuth: serviceAuth,
    harnessRuntime,
    logSink: () => undefined,
  });
  await app.listen(0, "127.0.0.1");
  const address = app.getHttpServer().address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${address.port}`;
  closeService = () => app.close();
});

afterAll(async () => {
  await closeService?.();
  await prisma.$disconnect();
});

const post = async (
  path: string,
  body: unknown,
): Promise<{ status: number; json: any; headers: Headers }> => {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${TOKEN}`,
      "content-type": "application/json",
      connection: "close",
    },
    body: JSON.stringify(body),
  });
  return { status: response.status, json: await response.json(), headers: response.headers };
};

const seedScope = async () => {
  const workspaceId = randomUUID();
  const guardian = await prisma.nurtureParticipant.create({
    data: { workspaceId, myChatUserId: `guardian:${workspaceId}`, status: "active" },
  });
  const caregiver = await prisma.nurtureParticipant.create({
    data: { workspaceId, myChatUserId: `caregiver:${workspaceId}`, status: "active" },
  });
  const caregiverB = await prisma.nurtureParticipant.create({
    data: { workspaceId, myChatUserId: `caregiver-b:${workspaceId}`, status: "active" },
  });
  const admin = await prisma.nurtureParticipant.create({
    data: { workspaceId, myChatUserId: `admin:${workspaceId}`, status: "active" },
  });
  const system = await prisma.nurtureParticipant.create({
    data: { workspaceId, myChatUserId: `system:${workspaceId}`, status: "active" },
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
  const caregiverBRole = await prisma.nurtureCareRoleAssignment.create({
    data: {
      workspaceId,
      participantId: caregiverB.id,
      role: "lead_caregiver",
      scopeType: "care_group",
      scopeId: group.id,
      status: "active",
    },
  });
  const adminRole = await prisma.nurtureCareRoleAssignment.create({
    data: {
      workspaceId,
      participantId: admin.id,
      role: "institution_admin",
      scopeType: "institution",
      scopeId: institution.id,
      status: "active",
    },
  });
  const systemRole = await prisma.nurtureCareRoleAssignment.create({
    data: {
      workspaceId,
      participantId: system.id,
      role: "system_operator",
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
      policySnapshotPayload: {
        institution_admin_business_communication: {
          schema_version: 1,
          disclosed: true,
          institution_id: institution.id,
          enrollment_id: enrollment.id,
          care_group_id: group.id,
          directions: ["family_to_org", "org_to_family"],
          data_classes: ["family_care_question"],
          purposes: ["family_care_workflow"],
        },
      },
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
  return {
    workspaceId,
    guardian,
    caregiver,
    caregiverB,
    admin,
    system,
    guardianRole,
    caregiverRole,
    caregiverBRole,
    adminRole,
    systemRole,
    process,
    family,
    institution,
    group,
    enrollment,
    grant,
  };
};

type SeedScope = Awaited<ReturnType<typeof seedScope>>;

const prepareAndExecute = async (input: {
  scope: SeedScope;
  actorId: string;
  surface: "chat" | "board";
  capabilityKey: string;
  operationInput?: unknown;
  targetOptionRef?: string;
}) => {
  const prepared = await post(HARNESS_PREPARE_PATH, {
    workspace_id: input.scope.workspaceId,
    actor_participant_id: input.actorId,
    surface: input.surface,
    capability_key: input.capabilityKey,
    capability_version: "1.0.0",
    ...(input.operationInput !== undefined ? { operation_input: input.operationInput } : {}),
    ...(input.targetOptionRef ? { target_option_ref: input.targetOptionRef } : {}),
  });
  if (prepared.json.status !== "ready_to_confirm") return { prepared };
  const commandId = prepared.json.command_request_id as string;
  const executed = await post(HARNESS_EXECUTE_PATH, {
    workspace_id: input.scope.workspaceId,
    actor_participant_id: input.actorId,
    surface: input.surface,
    capability_key: input.capabilityKey,
    capability_version: "1.0.0",
    invocation_request_id: `invocation:${commandId}`,
    command_request_id: commandId,
    confirmation_ref: prepared.json.confirmation_ref,
    ...(input.operationInput !== undefined ? { operation_input: input.operationInput } : {}),
  });
  return { prepared, executed, commandId };
};

const prepareAction = async (input: {
  scope: SeedScope;
  actorId: string;
  surface: "chat" | "board";
  capabilityKey: string;
  targetOptionRef: string;
  operationInput?: unknown;
}) =>
  post(HARNESS_PREPARE_PATH, {
    workspace_id: input.scope.workspaceId,
    actor_participant_id: input.actorId,
    surface: input.surface,
    capability_key: input.capabilityKey,
    capability_version: "1.0.0",
    target_option_ref: input.targetOptionRef,
    ...(input.operationInput !== undefined ? { operation_input: input.operationInput } : {}),
  });

const executePrepared = async (input: {
  scope: SeedScope;
  actorId: string;
  surface: "chat" | "board";
  capabilityKey: string;
  prepared: { json: any };
  operationInput?: unknown;
  invocationSuffix?: string;
}) => {
  const commandId = input.prepared.json.command_request_id as string;
  return post(HARNESS_EXECUTE_PATH, {
    workspace_id: input.scope.workspaceId,
    actor_participant_id: input.actorId,
    surface: input.surface,
    capability_key: input.capabilityKey,
    capability_version: "1.0.0",
    invocation_request_id: `invocation:${commandId}${input.invocationSuffix ?? ""}`,
    command_request_id: commandId,
    confirmation_ref: input.prepared.json.confirmation_ref,
    ...(input.operationInput !== undefined ? { operation_input: input.operationInput } : {}),
  });
};

const messageTargetRef = (scope: SeedScope, participantId: string, messageId: string) =>
  issueFamilyCareMessageTargetRef(INTEGRITY_KEY, {
    workspace_id: scope.workspaceId,
    participant_id: participantId,
    message_id: messageId,
  });

const itemTargetRef = (scope: SeedScope, participantId: string, itemId: string) =>
  issueCareItemTargetRef(INTEGRITY_KEY, {
    workspace_id: scope.workspaceId,
    participant_id: participantId,
    item_id: itemId,
  });

const readInstitutionBusinessCommunication = (
  scope: SeedScope,
  actorId: string,
  messageId: string,
) =>
  post(INSTITUTION_BUSINESS_COMMUNICATION_READ_PATH, {
    workspace_id: scope.workspaceId,
    actor_participant_id: actorId,
    surface: "admin",
    interface_contract: INSTITUTION_BUSINESS_COMMUNICATION_INTERFACE,
    target_option_ref: messageTargetRef(scope, actorId, messageId),
  });

const submitQuestion = async (scope: SeedScope, body: string) => {
  const result = await prepareAndExecute({
    scope,
    actorId: scope.guardian.id,
    surface: "chat",
    capabilityKey: "submit_family_care_question",
    operationInput: { body },
  });
  expect(result.executed?.json).toMatchObject({ status: "committed" });
  const item = await prisma.nurtureFamilyCareItem.findFirstOrThrow({
    where: { workspaceId: scope.workspaceId },
    orderBy: { createdAt: "desc" },
  });
  const message = await prisma.nurtureFamilyCareMessage.findFirstOrThrow({
    where: { workspaceId: scope.workspaceId, id: item.sourceMessageId! },
  });
  return { item, message, commandId: result.commandId! };
};

const replyToItem = async (
  scope: SeedScope,
  actorId: string,
  itemId: string,
  body: string,
) => {
  const itemRef = issueCareItemTargetRef(INTEGRITY_KEY, {
    workspace_id: scope.workspaceId,
    participant_id: actorId,
    item_id: itemId,
  });
  const result = await prepareAndExecute({
    scope,
    actorId,
    surface: "board",
    capabilityKey: "reply_family_care_item",
    operationInput: { body },
    targetOptionRef: itemRef,
  });
  expect(result.executed?.json).toMatchObject({ status: "committed" });
  return prisma.nurtureFamilyCareMessage.findFirstOrThrow({
    where: {
      workspaceId: scope.workspaceId,
      sourceItemId: itemId,
      senderParticipantId: actorId,
      messageKind: "caregiver_reply",
    },
    orderBy: { createdAt: "desc" },
  });
};

describe("G2-A loop through the formal Harness ingress", () => {
  it("runs submit -> acknowledge -> reply with exact replay over HTTP", async () => {
    const scope = await seedScope();

    const prepared = await post(HARNESS_PREPARE_PATH, {
      workspace_id: scope.workspaceId,
      actor_participant_id: scope.guardian.id,
      surface: "chat",
      capability_key: "submit_family_care_question",
      capability_version: "1.0.0",
      operation_input: { body: "老师好,今天想请假半天" },
    });
    expect(prepared.status).toBe(200);
    expect(prepared.json).toMatchObject({ status: "ready_to_confirm" });
    expect(JSON.stringify(prepared.json)).not.toContain("enrollment_id");

    const submitCommand = prepared.json.command_request_id as string;
    const executed = await post(HARNESS_EXECUTE_PATH, {
      workspace_id: scope.workspaceId,
      actor_participant_id: scope.guardian.id,
      surface: "chat",
      capability_key: "submit_family_care_question",
      capability_version: "1.0.0",
      invocation_request_id: `invocation:${submitCommand}`,
      command_request_id: submitCommand,
      confirmation_ref: prepared.json.confirmation_ref,
      operation_input: { body: "老师好,今天想请假半天" },
    });
    expect(executed.status).toBe(200);
    expect(executed.json).toMatchObject({
      status: "committed",
      execution_disposition: "executed",
      business_outcome: "applied",
    });

    const replay = await post(HARNESS_EXECUTE_PATH, {
      workspace_id: scope.workspaceId,
      actor_participant_id: scope.guardian.id,
      surface: "chat",
      capability_key: "submit_family_care_question",
      capability_version: "1.0.0",
      invocation_request_id: `invocation:${submitCommand}:retry`,
      command_request_id: submitCommand,
      confirmation_ref: prepared.json.confirmation_ref,
      operation_input: { body: "老师好,今天想请假半天" },
    });
    expect(replay.json).toMatchObject({
      status: "committed",
      execution_disposition: "replayed",
    });
    expect(replay.json.output_refs).toEqual(executed.json.output_refs);

    const item = await prisma.nurtureFamilyCareItem.findFirstOrThrow({
      where: { workspaceId: scope.workspaceId },
    });
    const itemRef = issueCareItemTargetRef(INTEGRITY_KEY, {
      workspace_id: scope.workspaceId,
      participant_id: scope.caregiver.id,
      item_id: item.id,
    });

    const ackPrepared = await post(HARNESS_PREPARE_PATH, {
      workspace_id: scope.workspaceId,
      actor_participant_id: scope.caregiver.id,
      surface: "board",
      capability_key: "acknowledge_family_care_item",
      capability_version: "1.0.0",
      target_option_ref: itemRef,
    });
    expect(ackPrepared.json).toMatchObject({ status: "ready_to_confirm" });
    const ackCommand = ackPrepared.json.command_request_id as string;
    const acked = await post(HARNESS_EXECUTE_PATH, {
      workspace_id: scope.workspaceId,
      actor_participant_id: scope.caregiver.id,
      surface: "board",
      capability_key: "acknowledge_family_care_item",
      capability_version: "1.0.0",
      invocation_request_id: `invocation:${ackCommand}`,
      command_request_id: ackCommand,
      confirmation_ref: ackPrepared.json.confirmation_ref,
    });
    expect(acked.json).toMatchObject({ status: "committed", business_outcome: "applied" });

    const replyPrepared = await post(HARNESS_PREPARE_PATH, {
      workspace_id: scope.workspaceId,
      actor_participant_id: scope.caregiver.id,
      surface: "board",
      capability_key: "reply_family_care_item",
      capability_version: "1.0.0",
      target_option_ref: itemRef,
      operation_input: { body: "收到,已安排好" },
    });
    expect(replyPrepared.json).toMatchObject({ status: "ready_to_confirm" });
    const replyCommand = replyPrepared.json.command_request_id as string;
    const replied = await post(HARNESS_EXECUTE_PATH, {
      workspace_id: scope.workspaceId,
      actor_participant_id: scope.caregiver.id,
      surface: "board",
      capability_key: "reply_family_care_item",
      capability_version: "1.0.0",
      invocation_request_id: `invocation:${replyCommand}`,
      command_request_id: replyCommand,
      confirmation_ref: replyPrepared.json.confirmation_ref,
      operation_input: { body: "收到,已安排好" },
    });
    expect(replied.json).toMatchObject({ status: "committed", business_outcome: "applied" });

    await expect(
      prisma.nurtureFamilyCareItem.findFirstOrThrow({ where: { id: item.id } }),
    ).resolves.toMatchObject({
      acknowledgementState: "acknowledged",
      responseState: "responded",
      lifecycleState: "active",
      status: "replied",
    });
    const persisted = await prisma.nurtureFamilyCareMessage.findMany({
      where: { workspaceId: scope.workspaceId },
    });
    expect(persisted).toHaveLength(2);
    for (const message of persisted) {
      expect(message.body).toBeNull();
      expect(message.bodyStorageMode).toBe("encrypted");
    }
    expect(JSON.stringify(persisted)).not.toContain("请假");
    expect(JSON.stringify(persisted)).not.toContain("已安排好");

    // Query lane over the same ingress: role-safe projections with
    // owner-issued opaque refs, decrypted only through the owner read.
    const timeline = await post(HARNESS_QUERY_PATH, {
      workspace_id: scope.workspaceId,
      actor_participant_id: scope.guardian.id,
      surface: "chat",
      capability_key: "query_guardian_family_care_timeline",
      capability_version: "1.0.0",
    });
    expect(timeline.status).toBe(200);
    expect(timeline.json.status).toBe("ok");
    expect(timeline.json.output.items).toHaveLength(2);
    const timelineBodies = timeline.json.output.items.map(
      (entry: { content?: { body: string } }) => entry.content?.body,
    );
    expect(timelineBodies).toContain("老师好,今天想请假半天");
    expect(timelineBodies).toContain("收到,已安排好");
    // Display refs are irreversible 32-hex opaque tokens; the actionable
    // careItemRef is the keyed target ref whose embedded id is unusable
    // without its signature tag.
    for (const entry of timeline.json.output.items) {
      expect(entry.itemRef).toMatch(/^[0-9a-f]{32}$/);
      expect(entry.enrollmentRef).toMatch(/^[0-9a-f]{32}$/);
      expect(entry.receipt.receiptRef).toMatch(/^[0-9a-f]{32}$/);
      expect(entry.careItemRef).toMatch(/^1\..+\.[0-9a-f]{32}$/);
    }

    const work = await post(HARNESS_QUERY_PATH, {
      workspace_id: scope.workspaceId,
      actor_participant_id: scope.caregiver.id,
      surface: "board",
      capability_key: "query_caregiver_family_care_work",
      capability_version: "1.0.0",
    });
    expect(work.json.status).toBe("ok");
    expect(work.json.output.items).toHaveLength(1);
    const workItem = work.json.output.items[0];
    expect(workItem).toMatchObject({
      acknowledgementState: "acknowledged",
      responseState: "responded",
      lifecycle: "active",
      attentionState: "resolved",
    });
    expect(workItem.sourceSafeSummary).toBe("New family care question");
    const ackAction = workItem.actions.find(
      (action: { capabilityKey: string }) =>
        action.capabilityKey === "acknowledge_family_care_item",
    );
    expect(ackAction.availability).toBe("already_satisfied");

    const detail = await post(HARNESS_QUERY_PATH, {
      workspace_id: scope.workspaceId,
      actor_participant_id: scope.caregiver.id,
      surface: "board",
      capability_key: "query_family_care_item",
      capability_version: "1.0.0",
      target_option_ref: workItem.careItemRef,
    });
    expect(detail.json.status).toBe("ok");
    expect(detail.json.output).toMatchObject({
      projectionRole: "caregiver",
      progress: { responseState: "responded", replyCount: 1 },
    });
    expect(detail.json.output.messages).toHaveLength(2);
    expect(detail.json.output.messages[0].content.body).toBe("老师好,今天想请假半天");

    const readResult = await post(HARNESS_READ_RESULT_PATH, {
      workspace_id: scope.workspaceId,
      actor_participant_id: scope.guardian.id,
      surface: "chat",
      command_request_id: submitCommand,
    });
    expect(readResult.json.status).toBe("ok");
    expect(readResult.json.output).toMatchObject({ projectionRole: "guardian" });

    // read-result is bound to the committed execution's own actor: another
    // participant cannot read a command they did not run, and an unknown
    // command identity is never an id oracle.
    const foreignRead = await post(HARNESS_READ_RESULT_PATH, {
      workspace_id: scope.workspaceId,
      actor_participant_id: scope.caregiver.id,
      surface: "board",
      command_request_id: submitCommand,
    });
    expect(foreignRead.json).toEqual({ status: "denied", reason_code: "not_authorized" });
    const unknownRead = await post(HARNESS_READ_RESULT_PATH, {
      workspace_id: scope.workspaceId,
      actor_participant_id: scope.guardian.id,
      surface: "chat",
      command_request_id: `command:${randomUUID()}`,
    });
    expect(unknownRead.json).toEqual({ status: "denied", reason_code: "not_authorized" });
  });

  it("maps a consumed confirmation to a refresh recovery over HTTP", async () => {
    const scope = await seedScope();
    const prepared = await post(HARNESS_PREPARE_PATH, {
      workspace_id: scope.workspaceId,
      actor_participant_id: scope.guardian.id,
      surface: "chat",
      capability_key: "submit_family_care_question",
      capability_version: "1.0.0",
      operation_input: { body: "第一条" },
    });
    const command = prepared.json.command_request_id as string;
    const executeBody = {
      workspace_id: scope.workspaceId,
      actor_participant_id: scope.guardian.id,
      surface: "chat",
      capability_key: "submit_family_care_question",
      capability_version: "1.0.0",
      invocation_request_id: `invocation:${command}`,
      command_request_id: command,
      confirmation_ref: prepared.json.confirmation_ref,
      operation_input: { body: "第一条" },
    };
    await post(HARNESS_EXECUTE_PATH, executeBody);

    const reused = await post(HARNESS_EXECUTE_PATH, {
      ...executeBody,
      command_request_id: `${command}:second`,
      invocation_request_id: `invocation:${command}:second`,
    });
    expect(reused.json).toMatchObject({
      status: "not_committed",
      reason_code: "confirmation_replayed",
      recovery: "refresh",
    });
  });
});

describe("G2-B lifecycle changes through the formal Harness ingress", () => {
  it("appends an exact-author correction, presents the latest body, and rejects a stale head", async () => {
    const scope = await seedScope();
    const { item, message } = await submitQuestion(scope, "原始问题");
    const targetOptionRef = messageTargetRef(scope, scope.guardian.id, message.id);
    const firstInput = { body: "第一次更正" };
    const secondInput = { body: "并发的第二次更正" };

    const first = await prepareAction({
      scope,
      actorId: scope.guardian.id,
      surface: "chat",
      capabilityKey: "correct_family_care_message",
      targetOptionRef,
      operationInput: firstInput,
    });
    const second = await prepareAction({
      scope,
      actorId: scope.guardian.id,
      surface: "chat",
      capabilityKey: "correct_family_care_message",
      targetOptionRef,
      operationInput: secondInput,
    });
    expect(first.json.status).toBe("ready_to_confirm");
    expect(second.json.status).toBe("ready_to_confirm");

    const corrected = await executePrepared({
      scope,
      actorId: scope.guardian.id,
      surface: "chat",
      capabilityKey: "correct_family_care_message",
      prepared: first,
      operationInput: firstInput,
    });
    expect(corrected.json).toMatchObject({
      status: "committed",
      execution_disposition: "executed",
      business_outcome: "applied",
      committed_result: {
        capability_key: "correct_family_care_message",
        correction_version: 1,
        content_state: "corrected",
      },
    });

    const replay = await executePrepared({
      scope,
      actorId: scope.guardian.id,
      surface: "chat",
      capabilityKey: "correct_family_care_message",
      prepared: first,
      operationInput: firstInput,
      invocationSuffix: ":retry",
    });
    expect(replay.json).toMatchObject({
      status: "committed",
      execution_disposition: "replayed",
      committed_result: corrected.json.committed_result,
    });

    const stale = await executePrepared({
      scope,
      actorId: scope.guardian.id,
      surface: "chat",
      capabilityKey: "correct_family_care_message",
      prepared: second,
      operationInput: secondInput,
    });
    expect(stale.json).toEqual({
      status: "not_committed",
      decision: "conflict",
      reason_code: "stale_confirmation",
      recovery: "reprepare",
    });

    const correction = await prisma.nurtureFamilyCareMessageCorrection.findFirstOrThrow({
      where: { workspaceId: scope.workspaceId, messageId: message.id },
      include: { commandExecution: true, receipt: true },
    });
    expect(correction).toMatchObject({
      correctionVersion: 1,
      authorParticipantId: scope.guardian.id,
      authorRoleAssignmentId: scope.guardianRole.id,
      bodyStorageMode: "encrypted",
      status: "active",
    });
    expect(correction.bodyProtectionPayload).not.toBeNull();
    expect(correction.commandExecution).toMatchObject({
      commandKey: "correct_family_care_message",
      businessOutcome: "applied",
    });
    expect(correction.receipt).toMatchObject({ status: "delivered" });
    await expect(
      prisma.nurtureFamilyCareMessage.findFirstOrThrow({ where: { id: message.id } }),
    ).resolves.toMatchObject({
      aggregateVersion: 1,
      bodyStorageMode: "encrypted",
      bodyProtectionPayload: message.bodyProtectionPayload,
    });

    const detail = await post(HARNESS_QUERY_PATH, {
      workspace_id: scope.workspaceId,
      actor_participant_id: scope.guardian.id,
      surface: "chat",
      capability_key: "query_family_care_item",
      capability_version: "1.0.0",
      target_option_ref: itemTargetRef(scope, scope.guardian.id, item.id),
    });
    expect(detail.json.output.messages[0]).toMatchObject({
      kind: "correction_notice",
      content: { body: "第一次更正" },
    });
    expect(
      detail.json.output.actions.map((action: { capabilityKey: string }) => action.capabilityKey),
    ).toEqual(
      expect.arrayContaining([
        "withdraw_family_care_request",
        "correct_family_care_message",
        "redact_family_care_message",
      ]),
    );
  });

  it("withdraws only by the exact family author and converges future requests", async () => {
    const scope = await seedScope();
    const { item, message } = await submitQuestion(scope, "请撤回这条问题");
    const pendingReceipt = await prisma.nurtureChildLinkReceipt.create({
      data: {
        workspaceId: scope.workspaceId,
        grantId: scope.grant.id,
        childCareProcessId: scope.process.id,
        enrollmentId: scope.enrollment.id,
        direction: "family_to_org",
        dataClass: "family_care_question",
        sourceType: "family_care_message",
        sourceId: message.id,
        routingAttemptKey: `pending-before-withdraw:${randomUUID()}`,
        targetScopeType: "care_group",
        targetScopeId: scope.group.id,
        status: "pending",
        pendingReason: "workflow_processing",
        driverType: "workflow_step",
        driverRef: { test_driver: "withdrawal_pending_receipt" },
      },
    });
    const targetOptionRef = itemTargetRef(scope, scope.guardian.id, item.id);
    const withdrawn = await prepareAndExecute({
      scope,
      actorId: scope.guardian.id,
      surface: "chat",
      capabilityKey: "withdraw_family_care_request",
      targetOptionRef,
    });
    expect(withdrawn.executed?.json).toMatchObject({
      status: "committed",
      business_outcome: "applied",
      committed_result: {
        lifecycle: "closed",
        lifecycle_reason: "family_withdrawn",
      },
    });

    await expect(
      prisma.nurtureFamilyCareItem.findFirstOrThrow({ where: { id: item.id } }),
    ).resolves.toMatchObject({
      status: "closed",
      lifecycleState: "closed",
      lifecycleReason: "family_withdrawn",
      lifecycleHead: 1,
    });
    await expect(
      prisma.nurtureTeacherAttentionItem.findFirstOrThrow({
        where: { workspaceId: scope.workspaceId, sourceId: item.id },
      }),
    ).resolves.toMatchObject({ status: "resolved" });
    await expect(
      prisma.nurtureChildLinkReceipt.findFirstOrThrow({ where: { id: pendingReceipt.id } }),
    ).resolves.toMatchObject({ status: "blocked", reasonCode: "family_withdrawn" });

    const adminRead = await readInstitutionBusinessCommunication(
      scope,
      scope.admin.id,
      message.id,
    );
    expect(adminRead.json).toMatchObject({
      status: "ok",
      output: {
        projectionRole: "institution_admin",
        changeState: {
          content: "original",
          lifecycle: "closed",
          lifecycleReason: "family_withdrawn",
        },
        content: { body: "请撤回这条问题" },
        actions: [],
      },
    });

    const converged = await prepareAndExecute({
      scope,
      actorId: scope.guardian.id,
      surface: "chat",
      capabilityKey: "withdraw_family_care_request",
      targetOptionRef,
    });
    expect(converged.executed?.json).toMatchObject({
      status: "committed",
      business_outcome: "already_satisfied",
      committed_result: {
        capability_key: "withdraw_family_care_request",
        lifecycle: "closed",
        lifecycle_reason: "family_withdrawn",
      },
    });

    const replyDenied = await prepareAction({
      scope,
      actorId: scope.caregiver.id,
      surface: "board",
      capabilityKey: "reply_family_care_item",
      targetOptionRef: itemTargetRef(scope, scope.caregiver.id, item.id),
      operationInput: { body: "不应再允许回复" },
    });
    expect(replyDenied.json).toEqual({ status: "denied", reason_code: "target_unavailable" });
  });

  it("redacts a source question to closure across more than one cascade page", async () => {
    const scope = await seedScope();
    const { item, message } = await submitQuestion(scope, "需要彻底脱敏的源问题");
    const correctionCount = 105;
    const receiptCount = 105;
    await prisma.nurtureFamilyCareMessageCorrection.createMany({
      data: Array.from({ length: correctionCount }, (_, index) => ({
        id: randomUUID(),
        workspaceId: scope.workspaceId,
        messageId: message.id,
        correctionVersion: index + 1,
        authorParticipantId: scope.guardian.id,
        authorRoleAssignmentId: scope.guardianRole.id,
        bodyStorageMode: "encrypted" as const,
        bodyProtectionPayload: message.bodyProtectionPayload!,
        status: "active" as const,
      })),
    });
    await prisma.nurtureChildLinkReceipt.createMany({
      data: Array.from({ length: receiptCount }, (_, index) => ({
        id: randomUUID(),
        workspaceId: scope.workspaceId,
        grantId: scope.grant.id,
        childCareProcessId: scope.process.id,
        enrollmentId: scope.enrollment.id,
        direction: "family_to_org" as const,
        dataClass: "family_care_question" as const,
        sourceType: "family_care_message" as const,
        sourceId: message.id,
        routingAttemptKey: `cascade-pending:${index}:${randomUUID()}`,
        targetScopeType: "care_group" as const,
        targetScopeId: scope.group.id,
        status: "pending" as const,
        pendingReason: "workflow_processing" as const,
        driverType: "workflow_step" as const,
        driverRef: { test_driver: "redaction_cascade", index },
      })),
    });

    const redacted = await prepareAndExecute({
      scope,
      actorId: scope.guardian.id,
      surface: "chat",
      capabilityKey: "redact_family_care_message",
      targetOptionRef: messageTargetRef(scope, scope.guardian.id, message.id),
    });
    expect(redacted.executed?.json).toMatchObject({
      status: "committed",
      business_outcome: "applied",
      committed_result: {
        content_state: "redacted",
        cascade_scope: "source_question",
      },
    });

    await expect(
      prisma.nurtureFamilyCareMessage.findFirstOrThrow({ where: { id: message.id } }),
    ).resolves.toMatchObject({
      status: "redacted",
      bodyStorageMode: "redacted",
      body: null,
      bodyProtectionPayload: null,
      attachmentsPayload: null,
      redactionReason: "author_redaction",
    });
    expect(
      await prisma.nurtureFamilyCareMessageCorrection.count({
        where: {
          workspaceId: scope.workspaceId,
          messageId: message.id,
          OR: [
            { status: { not: "redacted" } },
            { bodyProtectionPayload: { not: Prisma.DbNull } },
          ],
        },
      }),
    ).toBe(0);
    await expect(
      prisma.nurtureFamilyCareItem.findFirstOrThrow({ where: { id: item.id } }),
    ).resolves.toMatchObject({
      status: "suppressed",
      lifecycleState: "suppressed",
      lifecycleReason: "source_redacted",
      summary: "Content no longer available.",
      detail: null,
    });
    await expect(
      prisma.nurtureTeacherAttentionItem.findFirstOrThrow({
        where: { workspaceId: scope.workspaceId, sourceId: item.id },
      }),
    ).resolves.toMatchObject({ status: "suppressed", summary: null });
    expect(
      await prisma.nurtureChildLinkReceipt.count({
        where: {
          workspaceId: scope.workspaceId,
          sourceType: "family_care_message",
          sourceId: message.id,
          status: { in: ["pending", "delivered", "read", "acknowledged"] },
        },
      }),
    ).toBe(0);

    const audit = await prisma.nurtureFamilyCareCascadeAudit.findFirstOrThrow({
      where: { workspaceId: scope.workspaceId, rootMessageId: message.id },
      include: { commandExecution: true },
    });
    expect(audit).toMatchObject({ cascadeScope: "source_question", closureState: "complete" });
    expect(audit.commandExecution).toMatchObject({
      commandKey: "redact_family_care_message",
      businessOutcome: "applied",
    });
    const affectedRefs = (
      audit.affectedRefsPayload as { affected_refs: unknown[] }
    ).affected_refs;
    expect(affectedRefs.length).toBeGreaterThan(correctionCount + receiptCount);

    const timeline = await post(HARNESS_QUERY_PATH, {
      workspace_id: scope.workspaceId,
      actor_participant_id: scope.guardian.id,
      surface: "chat",
      capability_key: "query_guardian_family_care_timeline",
      capability_version: "1.0.0",
    });
    expect(timeline.json.output.items[0]).toMatchObject({ kind: "redaction_tombstone" });
    expect(timeline.json.output.items[0]).not.toHaveProperty("content");

    const adminRead = await readInstitutionBusinessCommunication(
      scope,
      scope.admin.id,
      message.id,
    );
    expect(adminRead.json).toMatchObject({
      status: "ok",
      output: {
        changeState: { content: "redacted", lifecycle: "suppressed" },
        actions: [],
      },
    });
    expect(adminRead.json.output).not.toHaveProperty("content");

    const readResult = await post(HARNESS_READ_RESULT_PATH, {
      workspace_id: scope.workspaceId,
      actor_participant_id: scope.guardian.id,
      surface: "chat",
      command_request_id: redacted.commandId,
    });
    expect(readResult.json).toMatchObject({
      status: "ok",
      output: { progress: { lifecycle: "suppressed" } },
    });
    expect(readResult.json.output.messages[0]).not.toHaveProperty("content");

    const converged = await prepareAndExecute({
      scope,
      actorId: scope.guardian.id,
      surface: "chat",
      capabilityKey: "redact_family_care_message",
      targetOptionRef: messageTargetRef(scope, scope.guardian.id, message.id),
    });
    expect(converged.executed?.json).toMatchObject({
      status: "committed",
      business_outcome: "already_satisfied",
      committed_result: {
        capability_key: "redact_family_care_message",
        content_state: "redacted",
        cascade_scope: "source_question",
      },
    });
  });

  it("keeps reply redaction local and preserves sibling replies and item progress", async () => {
    const scope = await seedScope();
    const { item } = await submitQuestion(scope, "请两位老师分别回复");
    const firstReply = await replyToItem(
      scope,
      scope.caregiver.id,
      item.id,
      "第一位老师的回复",
    );
    const secondReply = await replyToItem(
      scope,
      scope.caregiverB.id,
      item.id,
      "第二位老师的回复",
    );

    const redacted = await prepareAndExecute({
      scope,
      actorId: scope.caregiver.id,
      surface: "board",
      capabilityKey: "redact_family_care_message",
      targetOptionRef: messageTargetRef(scope, scope.caregiver.id, firstReply.id),
    });
    expect(redacted.executed?.json).toMatchObject({
      status: "committed",
      committed_result: { cascade_scope: "reply_local" },
    });
    await expect(
      prisma.nurtureFamilyCareMessage.findFirstOrThrow({ where: { id: firstReply.id } }),
    ).resolves.toMatchObject({ status: "redacted", bodyProtectionPayload: null });
    await expect(
      prisma.nurtureFamilyCareMessage.findFirstOrThrow({ where: { id: secondReply.id } }),
    ).resolves.toMatchObject({ status: "sent", bodyStorageMode: "encrypted" });
    await expect(
      prisma.nurtureFamilyCareItem.findFirstOrThrow({ where: { id: item.id } }),
    ).resolves.toMatchObject({
      status: "replied",
      lifecycleState: "active",
      responseState: "responded",
      responseHead: 1,
    });
    await expect(
      prisma.nurtureTeacherAttentionItem.findFirstOrThrow({
        where: { workspaceId: scope.workspaceId, sourceId: item.id },
      }),
    ).resolves.toMatchObject({ status: "resolved" });

    const detail = await post(HARNESS_QUERY_PATH, {
      workspace_id: scope.workspaceId,
      actor_participant_id: scope.caregiverB.id,
      surface: "board",
      capability_key: "query_family_care_item",
      capability_version: "1.0.0",
      target_option_ref: itemTargetRef(scope, scope.caregiverB.id, item.id),
    });
    const replyMessages = detail.json.output.messages.slice(1);
    expect(replyMessages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "redaction_tombstone" }),
        expect.objectContaining({ content: { body: "第二位老师的回复" } }),
      ]),
    );
  });

  it("requires a new Item after a family question has a response and preserves that reply on withdrawal", async () => {
    const scope = await seedScope();
    const { item, message } = await submitQuestion(scope, "已被回复的问题");
    const reply = await replyToItem(
      scope,
      scope.caregiver.id,
      item.id,
      "已经形成的独立回复",
    );
    const correctionDenied = await prepareAction({
      scope,
      actorId: scope.guardian.id,
      surface: "chat",
      capabilityKey: "correct_family_care_message",
      targetOptionRef: messageTargetRef(scope, scope.guardian.id, message.id),
      operationInput: { body: "不能在原事项上继续更正" },
    });
    expect(correctionDenied.json).toEqual({
      status: "denied",
      reason_code: "not_authorized",
    });

    const withdrawn = await prepareAndExecute({
      scope,
      actorId: scope.guardian.id,
      surface: "chat",
      capabilityKey: "withdraw_family_care_request",
      targetOptionRef: itemTargetRef(scope, scope.guardian.id, item.id),
    });
    expect(withdrawn.executed?.json).toMatchObject({
      status: "committed",
      business_outcome: "applied",
    });
    await expect(
      prisma.nurtureFamilyCareMessage.findFirstOrThrow({ where: { id: reply.id } }),
    ).resolves.toMatchObject({ status: "sent", bodyStorageMode: "encrypted" });
    await expect(
      prisma.nurtureFamilyCareItem.findFirstOrThrow({ where: { id: item.id } }),
    ).resolves.toMatchObject({
      lifecycleState: "closed",
      lifecycleReason: "family_withdrawn",
      responseState: "responded",
    });
  });

  it("allows exact-author erasure after Grant loss but never lets a coworker erase the reply", async () => {
    const scope = await seedScope();
    const { item } = await submitQuestion(scope, "作者移除权限独立于 Grant");
    const reply = await replyToItem(
      scope,
      scope.caregiver.id,
      item.id,
      "只能由我移除的回复",
    );
    const coworkerDenied = await prepareAction({
      scope,
      actorId: scope.caregiverB.id,
      surface: "board",
      capabilityKey: "redact_family_care_message",
      targetOptionRef: messageTargetRef(scope, scope.caregiverB.id, reply.id),
    });
    expect(coworkerDenied.json).toEqual({
      status: "denied",
      reason_code: "not_authorized",
    });

    await prisma.nurtureChildLinkGrant.update({
      where: { id: scope.grant.id },
      data: {
        status: "revoked",
        revokedAt: new Date(),
        revokedByParticipantId: scope.guardian.id,
        revokeReason: "test_revoked_before_author_redaction",
      },
    });
    const authorApplied = await prepareAndExecute({
      scope,
      actorId: scope.caregiver.id,
      surface: "board",
      capabilityKey: "redact_family_care_message",
      targetOptionRef: messageTargetRef(scope, scope.caregiver.id, reply.id),
    });
    expect(authorApplied.executed?.json).toMatchObject({
      status: "committed",
      business_outcome: "applied",
      committed_result: { cascade_scope: "reply_local" },
    });
    await expect(
      prisma.nurtureFamilyCareMessage.findFirstOrThrow({ where: { id: reply.id } }),
    ).resolves.toMatchObject({
      status: "redacted",
      redactedByParticipantId: scope.caregiver.id,
      redactionReason: "author_redaction",
    });
  });

  it("separates exact-author and server-owned policy redaction authority", async () => {
    const scope = await seedScope();
    const { message } = await submitQuestion(scope, "策略执行者权限测试");

    const authorDenied = await prepareAction({
      scope,
      actorId: scope.admin.id,
      surface: "board",
      capabilityKey: "redact_family_care_message",
      targetOptionRef: messageTargetRef(scope, scope.admin.id, message.id),
    });
    expect(authorDenied.json).toEqual({ status: "denied", reason_code: "not_authorized" });

    const policyDenied = await prepareAction({
      scope,
      actorId: scope.admin.id,
      surface: "board",
      capabilityKey: "policy_redact_family_care_message",
      targetOptionRef: messageTargetRef(scope, scope.admin.id, message.id),
    });
    expect(policyDenied.json).toEqual({ status: "denied", reason_code: "not_authorized" });

    const policyApplied = await prepareAndExecute({
      scope,
      actorId: scope.system.id,
      surface: "board",
      capabilityKey: "policy_redact_family_care_message",
      targetOptionRef: messageTargetRef(scope, scope.system.id, message.id),
    });
    expect(policyApplied.executed?.json).toMatchObject({
      status: "committed",
      committed_result: {
        capability_key: "policy_redact_family_care_message",
        content_state: "redacted",
      },
    });
    await expect(
      prisma.nurtureFamilyCareMessage.findFirstOrThrow({ where: { id: message.id } }),
    ).resolves.toMatchObject({
      redactedByParticipantId: scope.system.id,
      redactionReason: "policy_redaction",
    });
  });
});

describe("G2-B Institution Admin exact owner-read", () => {
  it("returns the latest disclosed business content over a pinned no-store interface", async () => {
    const scope = await seedScope();
    const { message } = await submitQuestion(scope, "园区可监督的业务沟通");
    const corrected = await prepareAndExecute({
      scope,
      actorId: scope.guardian.id,
      surface: "chat",
      capabilityKey: "correct_family_care_message",
      targetOptionRef: messageTargetRef(scope, scope.guardian.id, message.id),
      operationInput: { body: "园区可监督的已更正业务沟通" },
    });
    expect(corrected.executed?.json.status).toBe("committed");

    const read = await readInstitutionBusinessCommunication(
      scope,
      scope.admin.id,
      message.id,
    );
    expect(read.status).toBe(200);
    expect(read.headers.get("cache-control")).toBe("private, no-store");
    expect(read.json).toMatchObject({
      status: "ok",
      output: {
        interfaceContract: INSTITUTION_BUSINESS_COMMUNICATION_INTERFACE,
        projectionRole: "institution_admin",
        businessScope: {
          dataClass: "family_care_question",
          direction: "family_to_org",
          purpose: "family_care_workflow",
          adminSupervision: "pre_send_disclosed",
        },
        author: { side: "family", role: "guardian" },
        changeState: { content: "corrected", lifecycle: "active" },
        content: { body: "园区可监督的已更正业务沟通" },
        actions: [],
      },
    });
    const serialized = JSON.stringify(read.json);
    for (const internalId of [
      message.id,
      scope.enrollment.id,
      scope.group.id,
      scope.institution.id,
      scope.grant.id,
      scope.guardian.id,
    ]) {
      expect(serialized).not.toContain(internalId);
    }
  });

  it("fails closed on contract drift, missing disclosure, authority loss, and scope drift", async () => {
    const contractScope = await seedScope();
    const contractMessage = await submitQuestion(contractScope, "contract pin");
    const drifted = await post(INSTITUTION_BUSINESS_COMMUNICATION_READ_PATH, {
      workspace_id: contractScope.workspaceId,
      actor_participant_id: contractScope.admin.id,
      surface: "admin",
      interface_contract: {
        ...INSTITUTION_BUSINESS_COMMUNICATION_INTERFACE,
        digest: `sha256:${"0".repeat(64)}`,
      },
      target_option_ref: messageTargetRef(
        contractScope,
        contractScope.admin.id,
        contractMessage.message.id,
      ),
    });
    expect(drifted).toMatchObject({
      status: 400,
      json: { error: "invalid_harness_request" },
    });

    const undisclosedScope = await seedScope();
    const undisclosedMessage = await submitQuestion(undisclosedScope, "not disclosed");
    await prisma.nurtureChildLinkGrant.update({
      where: { id: undisclosedScope.grant.id },
      data: { policySnapshotPayload: {} },
    });
    await expect(
      readInstitutionBusinessCommunication(
        undisclosedScope,
        undisclosedScope.admin.id,
        undisclosedMessage.message.id,
      ),
    ).resolves.toMatchObject({
      status: 200,
      json: { status: "denied", reason_code: "not_authorized" },
    });

    const lostRoleScope = await seedScope();
    const lostRoleMessage = await submitQuestion(lostRoleScope, "role loss");
    await prisma.nurtureCareRoleAssignment.update({
      where: { id: lostRoleScope.adminRole.id },
      data: { status: "revoked" },
    });
    await expect(
      readInstitutionBusinessCommunication(
        lostRoleScope,
        lostRoleScope.admin.id,
        lostRoleMessage.message.id,
      ),
    ).resolves.toMatchObject({
      json: { status: "denied", reason_code: "not_authorized" },
    });

    const scopeDrift = await seedScope();
    const scopeDriftMessage = await submitQuestion(scopeDrift, "institution drift");
    await prisma.nurtureCareRoleAssignment.update({
      where: { id: scopeDrift.adminRole.id },
      data: { scopeId: randomUUID() },
    });
    await expect(
      readInstitutionBusinessCommunication(
        scopeDrift,
        scopeDrift.admin.id,
        scopeDriftMessage.message.id,
      ),
    ).resolves.toMatchObject({
      json: { status: "denied", reason_code: "not_authorized" },
    });

    const revokedGrantScope = await seedScope();
    const revokedGrantMessage = await submitQuestion(revokedGrantScope, "grant loss");
    await prisma.nurtureChildLinkGrant.update({
      where: { id: revokedGrantScope.grant.id },
      data: {
        status: "revoked",
        revokedAt: new Date(),
        revokedByParticipantId: revokedGrantScope.guardian.id,
        revokeReason: "test_revoked",
      },
    });
    await expect(
      readInstitutionBusinessCommunication(
        revokedGrantScope,
        revokedGrantScope.admin.id,
        revokedGrantMessage.message.id,
      ),
    ).resolves.toMatchObject({
      json: { status: "denied", reason_code: "not_authorized" },
    });
  });
});
