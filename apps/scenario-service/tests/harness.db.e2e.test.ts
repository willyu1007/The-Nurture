import type { AddressInfo } from "node:net";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  INSTITUTION_BUSINESS_COMMUNICATION_INTERFACE,
  issueCareItemTargetRef,
  issueDisplayRef,
  issueFamilyCareMessageTargetRef,
  issueBoardSealedRef,
  issueTargetOptionRef,
  issueChildOptionRef,
  issueMediaAssetTargetRef,
  issuePublicationRef,
  CHILD_CARE_PROCESS_TARGET_KIND,
  PUBLISH_PROCESS_TARGET_KIND,
  issuePolicyRedactionDecisionRef,
} from "@the-nurture/scenario/harness";
import {
  createAesGcmProtectedContentPort,
  createPrismaClient,
  Prisma,
  PrismaPublishQueueAdmissionService,
  publicationReleaseAttemptIdentity,
} from "@the-nurture/db";
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
  const evidencePath = new URL(
    "../../../.ai/.tmp/test-results/owner-integration-evidence.json",
    import.meta.url,
  );
  await mkdir(new URL(".", evidencePath), { recursive: true });
  await writeFile(
    evidencePath,
    JSON.stringify(
      Object.fromEntries(
        Object.entries(capabilityEvidence).map(([key, statuses]) => [key, [...statuses].sort()]),
      ),
      null,
      2,
    ),
  );
  await closeService?.();
  await prisma.$disconnect();
});

/**
 * Runtime capability evidence for `verify:owner-integration`: every call that
 * actually succeeded on the real path is recorded, and the census reads the
 * artifact instead of grepping literals — a refusal-only test, a comment or a
 * skipped block can no longer count as end-to-end evidence.
 */
const capabilityEvidence: Record<string, Set<string>> = {};
const JOINT_EVIDENCE_KEYS = {
  t007T006Publication: "joint:t007_t006_publication",
  t005T006DirectInteraction: "joint:t005_t006_direct_interaction",
} as const;
const recordEvidence = (body: unknown, json: { status?: string }): void => {
  const key = (body as { capability_key?: string })?.capability_key;
  if (!key || typeof json?.status !== "string") return;
  (capabilityEvidence[key] ??= new Set()).add(json.status);
};
const recordJointEvidence = (key: (typeof JOINT_EVIDENCE_KEYS)[keyof typeof JOINT_EVIDENCE_KEYS]) => {
  (capabilityEvidence[key] ??= new Set()).add("passed");
};

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
  const json = await response.json();
  recordEvidence(body, json as { status?: string });
  return { status: response.status, json, headers: response.headers };
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
      dataClasses: ["family_care_question", "direct_care_communication"],
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
      capability_version: "1.1.0",
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
      expect(entry.messageRef).toMatch(/^1\..+\.[0-9a-f]{32}$/);
      expect(entry.careItemRef).toMatch(/^1\..+\.[0-9a-f]{32}$/);
    }

    const work = await post(HARNESS_QUERY_PATH, {
      workspace_id: scope.workspaceId,
      actor_participant_id: scope.caregiver.id,
      surface: "board",
      capability_key: "query_caregiver_family_care_work",
      capability_version: "1.1.0",
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
      capability_version: "1.1.0",
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
    });
    expect(corrected.json.committed_result).toEqual({
      effect: "correction_appended",
      messageRef: expect.stringMatching(/^[0-9a-f]{32}$/),
      correctionRef: expect.stringMatching(/^[0-9a-f]{32}$/),
      receiptRef: expect.stringMatching(/^[0-9a-f]{32}$/),
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
      capability_version: "1.1.0",
      target_option_ref: itemTargetRef(scope, scope.guardian.id, item.id),
    });
    expect(detail.json.output.messages[0]).toMatchObject({
      kind: "correction_notice",
      content: { body: "第一次更正" },
    });
    const timeline = await post(HARNESS_QUERY_PATH, {
      workspace_id: scope.workspaceId,
      actor_participant_id: scope.guardian.id,
      surface: "chat",
      capability_key: "query_guardian_family_care_timeline",
      capability_version: "1.1.0",
    });
    expect(timeline.json.output.items[0]).toMatchObject({
      kind: "correction_notice",
      receipt: {
        receiptRef: issueDisplayRef(
          INTEGRITY_KEY,
          { workspace_id: scope.workspaceId },
          "receipt",
          correction.receipt!.id,
        ),
      },
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
    });
    expect(withdrawn.executed?.json.committed_result).toEqual({
      effect: "request_withdrawn",
      careItemRef: expect.stringMatching(/^[0-9a-f]{32}$/),
      receiptRef: expect.stringMatching(/^[0-9a-f]{32}$/),
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

    const timeline = await post(HARNESS_QUERY_PATH, {
      workspace_id: scope.workspaceId,
      actor_participant_id: scope.guardian.id,
      surface: "chat",
      capability_key: "query_guardian_family_care_timeline",
      capability_version: "1.1.0",
    });
    expect(timeline.json.output.items[0]).toMatchObject({
      kind: "withdrawal_notice",
      state: { lifecycle: "closed" },
    });

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
    });
    expect(converged.executed?.json.committed_result).toEqual(
      withdrawn.executed?.json.committed_result,
    );

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
    });
    expect(redacted.executed?.json.committed_result).toEqual({
      effect: "content_redacted",
      messageRef: expect.stringMatching(/^[0-9a-f]{32}$/),
      tombstoneRef: expect.stringMatching(/^[0-9a-f]{32}$/),
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
      capability_version: "1.1.0",
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
    });
    expect(converged.executed?.json.committed_result).toEqual(
      redacted.executed?.json.committed_result,
    );
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
    });
    expect(redacted.executed?.json.committed_result).toEqual({
      effect: "content_redacted",
      messageRef: expect.stringMatching(/^[0-9a-f]{32}$/),
      tombstoneRef: expect.stringMatching(/^[0-9a-f]{32}$/),
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
      capability_version: "1.1.0",
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
    });
    expect(authorApplied.executed?.json.committed_result).toEqual({
      effect: "content_redacted",
      messageRef: expect.stringMatching(/^[0-9a-f]{32}$/),
      tombstoneRef: expect.stringMatching(/^[0-9a-f]{32}$/),
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
    const adminPolicyInput = {
      policyDecisionRef: issuePolicyRedactionDecisionRef(INTEGRITY_KEY, {
        workspace_id: scope.workspaceId,
        participant_id: scope.admin.id,
        message_id: message.id,
        message_version: message.aggregateVersion,
      }),
    };
    const systemPolicyInput = {
      policyDecisionRef: issuePolicyRedactionDecisionRef(INTEGRITY_KEY, {
        workspace_id: scope.workspaceId,
        participant_id: scope.system.id,
        message_id: message.id,
        message_version: message.aggregateVersion,
      }),
    };

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
      operationInput: adminPolicyInput,
    });
    expect(policyDenied.json).toEqual({ status: "denied", reason_code: "not_authorized" });

    const policyInputRequired = await prepareAction({
      scope,
      actorId: scope.system.id,
      surface: "board",
      capabilityKey: "policy_redact_family_care_message",
      targetOptionRef: messageTargetRef(scope, scope.system.id, message.id),
    });
    expect(policyInputRequired.json).toEqual({
      status: "needs_input",
      fields: ["policyDecisionRef"],
    });
    const wrongPolicyDecision = await prepareAction({
      scope,
      actorId: scope.system.id,
      surface: "board",
      capabilityKey: "policy_redact_family_care_message",
      targetOptionRef: messageTargetRef(scope, scope.system.id, message.id),
      operationInput: {
        policyDecisionRef: issuePolicyRedactionDecisionRef(INTEGRITY_KEY, {
          workspace_id: scope.workspaceId,
          participant_id: scope.system.id,
          message_id: randomUUID(),
          message_version: message.aggregateVersion,
        }),
      },
    });
    expect(wrongPolicyDecision.json).toEqual({
      status: "denied",
      reason_code: "not_authorized",
    });

    const policyApplied = await prepareAndExecute({
      scope,
      actorId: scope.system.id,
      surface: "board",
      capabilityKey: "policy_redact_family_care_message",
      targetOptionRef: messageTargetRef(scope, scope.system.id, message.id),
      operationInput: systemPolicyInput,
    });
    expect(policyApplied.prepared.json).toMatchObject({ status: "ready_to_confirm" });
    expect(policyApplied.executed?.json).toMatchObject({
      status: "committed",
    });
    expect(policyApplied.executed?.json.committed_result).toEqual({
      effect: "policy_content_redacted",
      messageRef: expect.stringMatching(/^[0-9a-f]{32}$/),
      tombstoneRef: expect.stringMatching(/^[0-9a-f]{32}$/),
      auditEventRef: expect.stringMatching(/^[0-9a-f]{32}$/),
    });
    await expect(
      prisma.nurtureFamilyCareMessage.findFirstOrThrow({ where: { id: message.id } }),
    ).resolves.toMatchObject({
      redactedByParticipantId: scope.system.id,
      redactionReason: "policy_redaction",
    });
  });
});

describe("G2-C caregiver direct communication through the formal Harness ingress", () => {
  it("creates only Message + Receipt, replays exactly, and projects lifecycle changes", async () => {
    const scope = await seedScope();
    const initial = await post(HARNESS_PREPARE_PATH, {
      workspace_id: scope.workspaceId,
      actor_participant_id: scope.caregiver.id,
      surface: "board",
      capability_key: "initiate_caregiver_direct_message",
      capability_version: "1.0.0",
      operation_input: { body: "今天午睡比平时短约半小时，请家里留意晚间状态。" },
    });
    expect(initial.json).toMatchObject({ status: "needs_input" });
    expect(initial.json.choices).toHaveLength(1);
    const targetOptionRef = initial.json.choices[0].target_option_ref as string;
    expect(targetOptionRef).toMatch(/^1\.[0-9a-f]{32}$/);
    const choicePayload = JSON.stringify(initial.json);
    for (const rawId of [scope.enrollment.id, scope.family.id, scope.group.id, scope.grant.id]) {
      expect(choicePayload).not.toContain(rawId);
    }

    const prepared = await prepareAction({
      scope,
      actorId: scope.caregiver.id,
      surface: "board",
      capabilityKey: "initiate_caregiver_direct_message",
      targetOptionRef,
      operationInput: { body: "今天午睡比平时短约半小时，请家里留意晚间状态。" },
    });
    expect(prepared.json).toMatchObject({
      status: "ready_to_confirm",
      preview: { effect: "send_caregiver_direct_message" },
    });
    const executed = await executePrepared({
      scope,
      actorId: scope.caregiver.id,
      surface: "board",
      capabilityKey: "initiate_caregiver_direct_message",
      prepared,
      operationInput: { body: "今天午睡比平时短约半小时，请家里留意晚间状态。" },
    });
    expect(executed.json).toMatchObject({
      status: "committed",
      execution_disposition: "executed",
      business_outcome: "applied",
      committed_result: {
        messageRef: expect.stringMatching(/^[0-9a-f]{32}$/),
        receiptRef: expect.stringMatching(/^[0-9a-f]{32}$/),
        contentState: "sent",
      },
    });
    expect(Object.keys(executed.json.committed_result).sort()).toEqual([
      "contentState",
      "messageRef",
      "receiptRef",
    ]);
    const message = await prisma.nurtureFamilyCareMessage.findFirstOrThrow({
      where: {
        workspaceId: scope.workspaceId,
        messageKind: "caregiver_direct_message",
      },
    });
    expect(message).toMatchObject({
      senderParticipantId: scope.caregiver.id,
      senderRoleAssignmentId: scope.caregiverRole.id,
      threadId: expect.any(String),
      childCareProcessId: scope.process.id,
      enrollmentId: scope.enrollment.id,
      careGroupId: scope.group.id,
      grantId: scope.grant.id,
      direction: "org_to_family",
      writerContract: "harness_g2_v1",
      body: null,
      bodyStorageMode: "encrypted",
      status: "sent",
    });
    expect(JSON.stringify(message)).not.toContain("午睡");
    const receipt = await prisma.nurtureChildLinkReceipt.findFirstOrThrow({
      where: {
        workspaceId: scope.workspaceId,
        sourceType: "family_care_message",
        sourceId: message.id,
      },
    });
    expect(receipt).toMatchObject({
      grantId: scope.grant.id,
      enrollmentId: scope.enrollment.id,
      direction: "org_to_family",
      dataClass: "direct_care_communication",
      targetScopeType: "family",
      targetScopeId: scope.family.id,
      status: "delivered",
    });
    await expect(
      prisma.nurtureFamilyCareItem.count({ where: { workspaceId: scope.workspaceId } }),
    ).resolves.toBe(0);
    await expect(
      prisma.nurtureTeacherAttentionItem.count({ where: { workspaceId: scope.workspaceId } }),
    ).resolves.toBe(0);

    const replay = await executePrepared({
      scope,
      actorId: scope.caregiver.id,
      surface: "board",
      capabilityKey: "initiate_caregiver_direct_message",
      prepared,
      operationInput: { body: "今天午睡比平时短约半小时，请家里留意晚间状态。" },
      invocationSuffix: ":retry",
    });
    expect(replay.json).toMatchObject({
      status: "committed",
      execution_disposition: "replayed",
    });
    expect(replay.json.committed_result).toEqual(executed.json.committed_result);
    await expect(
      prisma.nurtureFamilyCareMessage.count({
        where: { workspaceId: scope.workspaceId, messageKind: "caregiver_direct_message" },
      }),
    ).resolves.toBe(1);

    const readResult = await post(HARNESS_READ_RESULT_PATH, {
      workspace_id: scope.workspaceId,
      actor_participant_id: scope.caregiver.id,
      surface: "board",
      command_request_id: prepared.json.command_request_id,
    });
    expect(readResult.json).toEqual({ status: "ok", output: executed.json.committed_result });

    const timeline = await post(HARNESS_QUERY_PATH, {
      workspace_id: scope.workspaceId,
      actor_participant_id: scope.guardian.id,
      surface: "chat",
      capability_key: "query_guardian_family_care_timeline",
      capability_version: "1.1.0",
    });
    expect(timeline.json.output.items).toHaveLength(1);
    expect(timeline.json.output.items[0]).toMatchObject({
      kind: "caregiver_direct_message",
      messageRef: expect.stringMatching(/^1\..+\.[0-9a-f]{32}$/),
      content: { body: "今天午睡比平时短约半小时，请家里留意晚间状态。" },
      receipt: { direction: "org_to_family", logicalStatus: "delivered" },
    });
    expect(timeline.json.output.items[0]).not.toHaveProperty("careItemRef");
    expect(timeline.json.output.items[0]).not.toHaveProperty("state");

    const corrected = await prepareAndExecute({
      scope,
      actorId: scope.caregiver.id,
      surface: "board",
      capabilityKey: "correct_family_care_message",
      targetOptionRef: messageTargetRef(scope, scope.caregiver.id, message.id),
      operationInput: { body: "更正：今天午睡比平时短约二十分钟，请家里留意晚间状态。" },
    });
    expect(corrected.executed?.json.status).toBe("committed");
    const correctionReceipt = await prisma.nurtureChildLinkReceipt.findFirstOrThrow({
      where: {
        workspaceId: scope.workspaceId,
        sourceId: message.id,
        routingAttemptKey: { startsWith: "g2-correction:" },
      },
    });
    expect(correctionReceipt.targetScopeId).toBe(scope.family.id);
    const correctedTimeline = await post(HARNESS_QUERY_PATH, {
      workspace_id: scope.workspaceId,
      actor_participant_id: scope.guardian.id,
      surface: "chat",
      capability_key: "query_guardian_family_care_timeline",
      capability_version: "1.1.0",
    });
    expect(correctedTimeline.json.output.items[0]).toMatchObject({
      kind: "correction_notice",
      content: { body: "更正：今天午睡比平时短约二十分钟，请家里留意晚间状态。" },
    });
    expect(correctedTimeline.json.output.items[0]).not.toHaveProperty("careItemRef");

    const redacted = await prepareAndExecute({
      scope,
      actorId: scope.caregiver.id,
      surface: "board",
      capabilityKey: "redact_family_care_message",
      targetOptionRef: messageTargetRef(scope, scope.caregiver.id, message.id),
    });
    expect(redacted.executed?.json.status).toBe("committed");
    const redactedTimeline = await post(HARNESS_QUERY_PATH, {
      workspace_id: scope.workspaceId,
      actor_participant_id: scope.guardian.id,
      surface: "chat",
      capability_key: "query_guardian_family_care_timeline",
      capability_version: "1.1.0",
    });
    expect(redactedTimeline.json.output.items[0]).toMatchObject({
      kind: "redaction_tombstone",
    });
    expect(redactedTimeline.json.output.items[0]).not.toHaveProperty("content");
    expect(redactedTimeline.json.output.items[0]).not.toHaveProperty("careItemRef");
  });

  it("fails closed for unsafe content, raw fields, wrong role, and missing disclosure", async () => {
    const scope = await seedScope();
    for (const body of [
      "孩子突然抽搐、无法呼吸怎么办",
      "他是不是得了自闭症",
      "what medicine should I give him",
    ]) {
      const response = await post(HARNESS_PREPARE_PATH, {
        workspace_id: scope.workspaceId,
        actor_participant_id: scope.caregiver.id,
        surface: "board",
        capability_key: "initiate_caregiver_direct_message",
        capability_version: "1.0.0",
        operation_input: { body },
      });
      expect(response.json).toMatchObject({
        status: "unavailable",
        alternate_process: "offline_emergency_or_medical_channel",
      });
    }
    const rawFields = await post(HARNESS_PREPARE_PATH, {
      workspace_id: scope.workspaceId,
      actor_participant_id: scope.caregiver.id,
      surface: "board",
      capability_key: "initiate_caregiver_direct_message",
      capability_version: "1.0.0",
      operation_input: {
        body: "普通事实沟通",
        target_id: scope.enrollment.id,
        grant_id: scope.grant.id,
        source: "generated",
        attachments: [],
      },
    });
    expect(rawFields.json.status).toBe("needs_input");
    expect(rawFields.json.fields.sort()).toEqual([
      "attachments",
      "grant_id",
      "source",
      "target_id",
    ]);
    const admin = await post(HARNESS_PREPARE_PATH, {
      workspace_id: scope.workspaceId,
      actor_participant_id: scope.admin.id,
      surface: "board",
      capability_key: "initiate_caregiver_direct_message",
      capability_version: "1.0.0",
      operation_input: { body: "普通事实沟通" },
    });
    expect(admin.json).toEqual({ status: "denied", reason_code: "not_authorized" });

    await prisma.nurtureCareRoleAssignment.update({
      where: { id: scope.caregiverBRole.id },
      data: { scopeId: randomUUID(), aggregateVersion: { increment: 1 } },
    });
    const wrongGroup = await post(HARNESS_PREPARE_PATH, {
      workspace_id: scope.workspaceId,
      actor_participant_id: scope.caregiverB.id,
      surface: "board",
      capability_key: "initiate_caregiver_direct_message",
      capability_version: "1.0.0",
      operation_input: { body: "普通事实沟通" },
    });
    expect(wrongGroup.json).toEqual({ status: "denied", reason_code: "not_authorized" });

    await prisma.nurtureChildLinkGrant.update({
      where: { id: scope.grant.id },
      data: {
        dataClasses: ["family_care_question"],
        aggregateVersion: { increment: 1 },
      },
    });
    const undisclosed = await post(HARNESS_PREPARE_PATH, {
      workspace_id: scope.workspaceId,
      actor_participant_id: scope.caregiver.id,
      surface: "board",
      capability_key: "initiate_caregiver_direct_message",
      capability_version: "1.0.0",
      operation_input: { body: "普通事实沟通" },
    });
    expect(undisclosed.json).toEqual({ status: "denied", reason_code: "not_authorized" });
    await expect(
      prisma.nurtureFamilyCareMessage.count({ where: { workspaceId: scope.workspaceId } }),
    ).resolves.toBe(0);
  });

  it("rejects a stale prepared Grant head without partial effects", async () => {
    const scope = await seedScope();
    const choices = await post(HARNESS_PREPARE_PATH, {
      workspace_id: scope.workspaceId,
      actor_participant_id: scope.caregiver.id,
      surface: "board",
      capability_key: "initiate_caregiver_direct_message",
      capability_version: "1.0.0",
      operation_input: { body: "普通事实沟通" },
    });
    const prepared = await prepareAction({
      scope,
      actorId: scope.caregiver.id,
      surface: "board",
      capabilityKey: "initiate_caregiver_direct_message",
      targetOptionRef: choices.json.choices[0].target_option_ref,
      operationInput: { body: "普通事实沟通" },
    });
    expect(prepared.json.status).toBe("ready_to_confirm");
    await prisma.nurtureChildLinkGrant.update({
      where: { id: scope.grant.id },
      data: { aggregateVersion: { increment: 1 } },
    });
    const executed = await executePrepared({
      scope,
      actorId: scope.caregiver.id,
      surface: "board",
      capabilityKey: "initiate_caregiver_direct_message",
      prepared,
      operationInput: { body: "普通事实沟通" },
    });
    expect(executed.json).toEqual({
      status: "not_committed",
      decision: "conflict",
      reason_code: "stale_confirmation",
      recovery: "reprepare",
    });
    await expect(
      prisma.nurtureFamilyCareMessage.count({ where: { workspaceId: scope.workspaceId } }),
    ).resolves.toBe(0);
    await expect(
      prisma.nurtureChildLinkReceipt.count({ where: { workspaceId: scope.workspaceId } }),
    ).resolves.toBe(0);
  });

  it("does not let a same-version replacement Grant take over a prepared command", async () => {
    const scope = await seedScope();
    const choices = await post(HARNESS_PREPARE_PATH, {
      workspace_id: scope.workspaceId,
      actor_participant_id: scope.caregiver.id,
      surface: "board",
      capability_key: "initiate_caregiver_direct_message",
      capability_version: "1.0.0",
      operation_input: { body: "普通事实沟通" },
    });
    const prepared = await prepareAction({
      scope,
      actorId: scope.caregiver.id,
      surface: "board",
      capabilityKey: "initiate_caregiver_direct_message",
      targetOptionRef: choices.json.choices[0].target_option_ref,
      operationInput: { body: "普通事实沟通" },
    });
    expect(prepared.json.status).toBe("ready_to_confirm");
    await prisma.nurtureChildLinkGrant.update({
      where: { id: scope.grant.id },
      data: {
        status: "revoked",
        revokedAt: new Date(),
        revokedByParticipantId: scope.guardian.id,
        revokeReason: "same_version_replacement",
      },
    });
    const replacement = await prisma.nurtureChildLinkGrant.create({
      data: {
        workspaceId: scope.workspaceId,
        childCareProcessId: scope.process.id,
        enrollmentId: scope.enrollment.id,
        grantedByParticipantId: scope.guardian.id,
        grantedToScopeType: "care_group",
        grantedToScopeId: scope.group.id,
        directions: ["org_to_family"],
        dataClasses: ["direct_care_communication"],
        purposes: ["family_care_workflow"],
        policySnapshotPayload: {},
        status: "active",
      },
    });
    expect(replacement.aggregateVersion).toBe(scope.grant.aggregateVersion);
    const executed = await executePrepared({
      scope,
      actorId: scope.caregiver.id,
      surface: "board",
      capabilityKey: "initiate_caregiver_direct_message",
      prepared,
      operationInput: { body: "普通事实沟通" },
    });
    expect(executed.json).toMatchObject({
      status: "not_committed",
      decision: "blocked",
      reason_code: "not_authorized",
    });
    await expect(
      prisma.nurtureFamilyCareMessage.count({ where: { workspaceId: scope.workspaceId } }),
    ).resolves.toBe(0);
  });

  it("removes protected read access after the original Grant is revoked", async () => {
    const scope = await seedScope();
    const choices = await post(HARNESS_PREPARE_PATH, {
      workspace_id: scope.workspaceId,
      actor_participant_id: scope.caregiver.id,
      surface: "board",
      capability_key: "initiate_caregiver_direct_message",
      capability_version: "1.0.0",
      operation_input: { body: "离园前体温记录为正常范围。" },
    });
    const sent = await prepareAndExecute({
      scope,
      actorId: scope.caregiver.id,
      surface: "board",
      capabilityKey: "initiate_caregiver_direct_message",
      targetOptionRef: choices.json.choices[0].target_option_ref,
      operationInput: { body: "离园前体温记录为正常范围。" },
    });
    expect(sent.executed?.json.status).toBe("committed");
    const message = await prisma.nurtureFamilyCareMessage.findFirstOrThrow({
      where: {
        workspaceId: scope.workspaceId,
        messageKind: "caregiver_direct_message",
      },
    });
    await prisma.nurtureChildLinkGrant.update({
      where: { id: scope.grant.id },
      data: {
        status: "revoked",
        revokedAt: new Date(),
        revokedByParticipantId: scope.guardian.id,
        revokeReason: "test_revocation",
        aggregateVersion: { increment: 1 },
      },
    });
    const timeline = await post(HARNESS_QUERY_PATH, {
      workspace_id: scope.workspaceId,
      actor_participant_id: scope.guardian.id,
      surface: "chat",
      capability_key: "query_guardian_family_care_timeline",
      capability_version: "1.1.0",
    });
    expect(timeline.json.output.items[0]).toMatchObject({
      kind: "caregiver_direct_message",
    });
    expect(timeline.json.output.items[0]).not.toHaveProperty("content");
    const readResult = await post(HARNESS_READ_RESULT_PATH, {
      workspace_id: scope.workspaceId,
      actor_participant_id: scope.caregiver.id,
      surface: "board",
      command_request_id: sent.commandId,
    });
    expect(readResult.json).toEqual({ status: "denied", reason_code: "not_authorized" });
    const correction = await prepareAction({
      scope,
      actorId: scope.caregiver.id,
      surface: "board",
      capabilityKey: "correct_family_care_message",
      targetOptionRef: messageTargetRef(scope, scope.caregiver.id, message.id),
      operationInput: { body: "不应允许的更正" },
    });
    expect(correction.json).toEqual({ status: "denied", reason_code: "not_authorized" });
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

// ---------------------------------------------------------------------------
// G3-A board lane through the same formal ingress.

describe("G3-A board lane through the formal Harness ingress", () => {
  it("reads the guardian board through the query route", async () => {
    const scope = await seedScope();
    const board = await post(HARNESS_QUERY_PATH, {
      workspace_id: scope.workspaceId,
      actor_participant_id: scope.guardian.id,
      surface: "board",
      capability_key: "query_guardian_family_board",
      capability_version: "1.0.0",
    });
    expect(board.status).toBe(200);
    expect(board.json.status).toBe("ok");
    // The envelope binds the exact admitted contract read from the artifact pin.
    expect(board.json.output.contract.key).toBe("nurture.surface-contract");
    expect(board.json.output.surfaceKey).toBe("guardian_family_board");
  });

  it("serves the remaining board queries on the real owner path", async () => {
    const scope = await seedScope();

    // Guardian enrollment activity: target selection is the owner-issued
    // option, never a raw Enrollment id.
    const activity = await post(HARNESS_QUERY_PATH, {
      workspace_id: scope.workspaceId,
      actor_participant_id: scope.guardian.id,
      surface: "board",
      capability_key: "query_guardian_enrollment_activity",
      capability_version: "1.0.0",
      target_option_ref: issueTargetOptionRef(INTEGRITY_KEY, {
        workspace_id: scope.workspaceId,
        participant_id: scope.guardian.id,
        enrollment_id: scope.enrollment.id,
      }),
    });
    expect(activity.status).toBe(200);
    expect(activity.json.status).toBe("ok");
    expect(activity.json.output.items).toEqual([]);
    expect(JSON.stringify(activity.json)).not.toContain(scope.enrollment.id);

    const childToday = await post(HARNESS_QUERY_PATH, {
      workspace_id: scope.workspaceId,
      actor_participant_id: scope.caregiver.id,
      surface: "board",
      capability_key: "query_caregiver_child_today",
      capability_version: "1.0.0",
    });
    expect(childToday.status).toBe(200);
    expect(childToday.json.status).toBe("ok");
    // The seeded class has one enrolled child; a content-free "ok" would let
    // an empty projection pass as evidence.
    expect(childToday.json.output.children).toHaveLength(1);
    expect(JSON.stringify(childToday.json)).not.toContain(scope.process.id);

    // Seed a real draft so the queue projects a non-trivial state count.
    await prisma.nurturePublishProcess.create({
      data: {
        workspaceId: scope.workspaceId,
        careGroupId: scope.group.id,
        processKey: `publish:${randomUUID()}`,
        state: "draft",
        dataClass: "child_growth_record",
        purposeKey: "child_growth_publication",
      },
    });
    const queue = await post(HARNESS_QUERY_PATH, {
      workspace_id: scope.workspaceId,
      actor_participant_id: scope.caregiver.id,
      surface: "board",
      capability_key: "query_teacher_publish_queue",
      capability_version: "1.0.0",
    });
    expect(queue.status).toBe(200);
    expect(queue.json.status).toBe("ok");
    expect(queue.json.output.counts.draft).toBe(1);
    expect(JSON.stringify(queue.json)).not.toContain(scope.group.id);

    // The teacher board itself, on the ok path — its only prior e2e coverage
    // was the guardian-refusal test, which the runtime census rightly rejects
    // as evidence.
    const board = await post(HARNESS_QUERY_PATH, {
      workspace_id: scope.workspaceId,
      actor_participant_id: scope.caregiver.id,
      surface: "board",
      capability_key: "query_caregiver_teacher_board",
      capability_version: "1.0.0",
    });
    expect(board.status).toBe(200);
    expect(board.json.status).toBe("ok");
    expect(board.json.output.surfaceKey).toBe("caregiver_teacher_board");
    expect(JSON.stringify(board.json)).not.toContain(scope.group.id);
  });

  it("refuses the caregiver board to a guardian and the guardian board to a caregiver", async () => {
    const scope = await seedScope();
    for (const [actorId, capabilityKey] of [
      [scope.guardian.id, "query_caregiver_teacher_board"],
      [scope.caregiver.id, "query_guardian_family_board"],
    ] as const) {
      const refused = await post(HARNESS_QUERY_PATH, {
        workspace_id: scope.workspaceId,
        actor_participant_id: actorId,
        surface: "board",
        capability_key: capabilityKey,
        capability_version: "1.0.0",
      });
      expect(refused.status, capabilityKey).toBe(200);
      expect(refused.json, capabilityKey).toMatchObject({ status: "denied" });
    }
  });

  it("commits a daily care record and refuses a caregiver of another class", async () => {
    const scope = await seedScope();
    const targetOptionRef = issueBoardSealedRef(
      INTEGRITY_KEY,
      { workspace_id: scope.workspaceId, participant_id: scope.caregiver.id },
      CHILD_CARE_PROCESS_TARGET_KIND,
      scope.process.id,
    );
    const committed = await prepareAndExecute({
      scope,
      actorId: scope.caregiver.id,
      surface: "board",
      capabilityKey: "record_caregiver_daily_care",
      targetOptionRef,
      operationInput: { kind: "meal", summary: "ate well" },
    });
    expect(committed.executed?.json.status).toBe("committed");
    const logs = await prisma.nurtureDailyCareLog.findMany({
      where: { workspaceId: scope.workspaceId, childCareProcessId: scope.process.id },
    });
    expect(logs).toHaveLength(1);
    expect(logs[0]?.mealPayload).toEqual({ kind: "meal", summary: "ate well" });

    // The guardian holds no caregiver role, so the same target does not resolve.
    const refused = await prepareAction({
      scope,
      actorId: scope.guardian.id,
      surface: "board",
      capabilityKey: "record_caregiver_daily_care",
      targetOptionRef,
      operationInput: { kind: "meal", summary: "ate well" },
    });
    expect(refused.json).toMatchObject({ status: "denied" });
  });
});

describe("T-006 pre-release cancel through the formal Harness ingress", () => {
  const seedPublishProcess = async (scope: SeedScope, state = "draft" as const) => {
    const process = await prisma.nurturePublishProcess.create({
      data: {
        workspaceId: scope.workspaceId,
        careGroupId: scope.group.id,
        processKey: `publish:${randomUUID()}`,
        state,
        dataClass: "child_growth_record",
        purposeKey: "child_growth_publication",
      },
    });
    const revision = await prisma.nurturePublishProcessRevision.create({
      data: {
        workspaceId: scope.workspaceId,
        publishProcessId: process.id,
        revision: 1,
        contentDigest: "sha256:content",
        organizerInputRevision: "organizer:1",
      },
    });
    return prisma.nurturePublishProcess.update({
      where: { id: process.id },
      data: { currentRevisionId: revision.id },
    });
  };

  const processTargetRef = (scope: SeedScope, participantId: string, processKey: string) =>
    issueBoardSealedRef(
      INTEGRITY_KEY,
      { workspace_id: scope.workspaceId, participant_id: participantId },
      PUBLISH_PROCESS_TARGET_KIND,
      processKey,
    );

  it("commits the cancel on the owner row and replays the same outcome", async () => {
    const scope = await seedScope();
    const process = await seedPublishProcess(scope);
    const targetOptionRef = processTargetRef(scope, scope.caregiver.id, process.processKey);

    const prepared = await prepareAction({
      scope,
      actorId: scope.caregiver.id,
      surface: "board",
      capabilityKey: "cancel_publish_process",
      targetOptionRef,
    });
    expect(prepared.json.status).toBe("ready_to_confirm");
    expect(prepared.json.preview).toMatchObject({ effect: "cancel_publish_process" });

    const executed = await executePrepared({
      scope,
      actorId: scope.caregiver.id,
      surface: "board",
      capabilityKey: "cancel_publish_process",
      prepared,
    });
    expect(executed.json).toMatchObject({
      status: "committed",
      execution_disposition: "executed",
      business_outcome: "applied",
    });

    // The write landed on the process owner row, under its own version.
    const stored = await prisma.nurturePublishProcess.findUniqueOrThrow({
      where: { id: process.id },
    });
    expect(stored.state).toBe("cancelled");
    expect(stored.cancelledAt).not.toBeNull();
    expect(stored.aggregateVersion).toBe(process.aggregateVersion + 1);
    expect(executed.json.committed_result.cancelledAt).toBe(
      stored.cancelledAt?.toISOString(),
    );
    // No raw owner identifier reaches ANY part of the wire response — the
    // committed_result was always sealed, but output_refs and execution_ref
    // used to carry the raw row ids beside it.
    const serialized = JSON.stringify(executed.json);
    for (const raw of [process.id, process.processKey, scope.group.id]) {
      expect(serialized).not.toContain(raw);
    }

    const execution = await prisma.nurtureCommandExecution.findFirstOrThrow({
      where: { workspaceId: scope.workspaceId, commandKey: "cancel_publish_process" },
    });
    expect(execution.businessOutcome).toBe("applied");
    expect(execution.commandScope).toBe("publish_process_cancel");

    // The same command identity replays its own committed effect rather than
    // recomputing it against a process that has since changed state.
    const replayed = await executePrepared({
      scope,
      actorId: scope.caregiver.id,
      surface: "board",
      capabilityKey: "cancel_publish_process",
      prepared,
      invocationSuffix: ":replay",
    });
    expect(replayed.json).toMatchObject({
      status: "committed",
      execution_disposition: "replayed",
      business_outcome: "applied",
    });
    expect(replayed.json.committed_result).toEqual(executed.json.committed_result);
  });

  it("answers a second, distinct cancel from the instant the owner recorded", async () => {
    const scope = await seedScope();
    const process = await seedPublishProcess(scope);
    const targetOptionRef = processTargetRef(scope, scope.caregiver.id, process.processKey);
    const first = await prepareAndExecute({
      scope,
      actorId: scope.caregiver.id,
      surface: "board",
      capabilityKey: "cancel_publish_process",
      targetOptionRef,
    });
    expect(first.executed?.json.status).toBe("committed");

    // A different class teacher, a fresh command identity, the same process.
    const repeat = await prepareAndExecute({
      scope,
      actorId: scope.caregiverB.id,
      surface: "board",
      capabilityKey: "cancel_publish_process",
      targetOptionRef: processTargetRef(scope, scope.caregiverB.id, process.processKey),
    });
    expect(repeat.prepared.json.preview).toMatchObject({ effect: "already_cancelled" });
    expect(repeat.executed?.json).toMatchObject({
      status: "committed",
      execution_disposition: "executed",
      business_outcome: "already_satisfied",
    });
    expect(repeat.executed?.json.committed_result.cancelledAt).toBe(
      first.executed?.json.committed_result.cancelledAt,
    );
    // Nothing was written twice: the owner still carries the first instant.
    const stored = await prisma.nurturePublishProcess.findUniqueOrThrow({
      where: { id: process.id },
    });
    expect(stored.aggregateVersion).toBe(process.aggregateVersion + 1);
  });

  it("refuses a guardian, a stale head and a process that already released", async () => {
    const scope = await seedScope();
    const process = await seedPublishProcess(scope);

    // A guardian holds no class role, so the owner offers no cancellable
    // process and the ref does not resolve.
    await expect(
      prepareAction({
        scope,
        actorId: scope.guardian.id,
        surface: "board",
        capabilityKey: "cancel_publish_process",
        targetOptionRef: processTargetRef(scope, scope.guardian.id, process.processKey),
      }).then((response) => response.json),
    ).resolves.toMatchObject({ status: "denied", reason_code: "target_unavailable" });

    // Prepared, then the process moves under the confirmation.
    const prepared = await prepareAction({
      scope,
      actorId: scope.caregiver.id,
      surface: "board",
      capabilityKey: "cancel_publish_process",
      targetOptionRef: processTargetRef(scope, scope.caregiver.id, process.processKey),
    });
    expect(prepared.json.status).toBe("ready_to_confirm");
    await prisma.nurturePublishProcess.update({
      where: { id: process.id },
      data: { aggregateVersion: { increment: 1 } },
    });
    const stale = await executePrepared({
      scope,
      actorId: scope.caregiver.id,
      surface: "board",
      capabilityKey: "cancel_publish_process",
      prepared,
    });
    expect(stale.json).toMatchObject({
      status: "not_committed",
      reason_code: "stale_confirmation",
      recovery: "reprepare",
    });
    expect(
      (await prisma.nurturePublishProcess.findUniqueOrThrow({ where: { id: process.id } })).state,
    ).toBe("draft");
  });
});

describe("T-006 edit lane through the formal Harness ingress", () => {
  const seedEditableProcess = async (scope: SeedScope) => {
    const process = await prisma.nurturePublishProcess.create({
      data: {
        workspaceId: scope.workspaceId,
        careGroupId: scope.group.id,
        processKey: `publish:${randomUUID()}`,
        state: "draft",
        dataClass: "child_growth_record",
        purposeKey: "child_growth_publication",
      },
    });
    const revision = await prisma.nurturePublishProcessRevision.create({
      data: {
        workspaceId: scope.workspaceId,
        publishProcessId: process.id,
        revision: 1,
        contentDigest: "sha256:content",
        organizerInputRevision: "organizer:1",
        sourceRefsPayload: ["source-ref-1"],
      },
    });
    await prisma.nurturePublishProcess.update({
      where: { id: process.id },
      data: { currentRevisionId: revision.id },
    });
    return { process, revision };
  };

  const processRefFor = (scope: SeedScope, participantId: string, processKey: string) =>
    issueBoardSealedRef(
      INTEGRITY_KEY,
      { workspace_id: scope.workspaceId, participant_id: participantId },
      PUBLISH_PROCESS_TARGET_KIND,
      processKey,
    );

  it("takes, extends and releases one hold, and refuses a colleague in between", async () => {
    const scope = await seedScope();
    const { process } = await seedEditableProcess(scope);
    const mine = processRefFor(scope, scope.caregiver.id, process.processKey);

    const acquired = await prepareAndExecute({
      scope,
      actorId: scope.caregiver.id,
      surface: "board",
      capabilityKey: "acquire_publish_edit_hold",
      targetOptionRef: mine,
      operationInput: { ttlSeconds: 300 },
    });
    expect(acquired.executed?.json).toMatchObject({
      status: "committed",
      business_outcome: "applied",
    });
    expect(acquired.executed?.json.committed_result.ttlSeconds).toBe(300);
    const held = await prisma.nurturePublishEditHold.findFirstOrThrow({
      where: { workspaceId: scope.workspaceId, publishProcessId: process.id },
    });
    expect(held.holderParticipantId).toBe(scope.caregiver.id);
    expect(acquired.executed?.json.committed_result.expiresAt).toBe(
      held.expiresAt.toISOString(),
    );

    // A colleague of the same class sees the card but cannot take the hold.
    const colleague = await prepareAction({
      scope,
      actorId: scope.caregiverB.id,
      surface: "board",
      capabilityKey: "acquire_publish_edit_hold",
      targetOptionRef: processRefFor(scope, scope.caregiverB.id, process.processKey),
    });
    expect(colleague.json).toMatchObject({ status: "denied", reason_code: "held_by_other" });

    const renewed = await prepareAndExecute({
      scope,
      actorId: scope.caregiver.id,
      surface: "board",
      capabilityKey: "renew_publish_edit_hold",
      targetOptionRef: mine,
      operationInput: { ttlSeconds: 600 },
    });
    expect(renewed.executed?.json.status).toBe("committed");
    const extended = await prisma.nurturePublishEditHold.findFirstOrThrow({
      where: { id: held.id },
    });
    expect(extended.aggregateVersion).toBe(held.aggregateVersion + 1);
    expect(extended.expiresAt.getTime()).toBeGreaterThan(held.expiresAt.getTime());

    const released = await prepareAndExecute({
      scope,
      actorId: scope.caregiver.id,
      surface: "board",
      capabilityKey: "release_publish_edit_hold",
      targetOptionRef: mine,
    });
    expect(released.executed?.json).toMatchObject({
      status: "committed",
      business_outcome: "applied",
    });
    expect(await prisma.nurturePublishEditHold.count({ where: { id: held.id } })).toBe(0);
    // The hold was never a process state.
    expect(
      (await prisma.nurturePublishProcess.findUniqueOrThrow({ where: { id: process.id } })).state,
    ).toBe("draft");

    // Releasing again changed nothing, and says so.
    const again = await prepareAndExecute({
      scope,
      actorId: scope.caregiver.id,
      surface: "board",
      capabilityKey: "release_publish_edit_hold",
      targetOptionRef: mine,
    });
    expect(again.executed?.json).toMatchObject({
      status: "committed",
      business_outcome: "already_satisfied",
    });
  });

  it("recovers the lane after a hold lapses by TTL instead of bricking it", async () => {
    const scope = await seedScope();
    const { process } = await seedEditableProcess(scope);

    // Teacher B takes the hold and their laptop closes: the TTL lapses with no
    // explicit release, and the dead row keeps occupying the unique slot.
    const taken = await prepareAndExecute({
      scope,
      actorId: scope.caregiverB.id,
      surface: "board",
      capabilityKey: "acquire_publish_edit_hold",
      targetOptionRef: processRefFor(scope, scope.caregiverB.id, process.processKey),
      operationInput: { ttlSeconds: 120 },
    });
    expect(taken.executed?.json.status).toBe("committed");
    const stale = await prisma.nurturePublishEditHold.findFirstOrThrow({
      where: { workspaceId: scope.workspaceId, publishProcessId: process.id },
    });
    await prisma.nurturePublishEditHold.update({
      where: { id: stale.id },
      data: {
        createdAt: new Date(Date.now() - 300_000),
        expiresAt: new Date(Date.now() - 180_000),
      },
    });

    // The next teacher's acquire must commit — previously this retried forever
    // on the unique collision with the dead row.
    const acquired = await prepareAndExecute({
      scope,
      actorId: scope.caregiver.id,
      surface: "board",
      capabilityKey: "acquire_publish_edit_hold",
      targetOptionRef: processRefFor(scope, scope.caregiver.id, process.processKey),
      operationInput: { ttlSeconds: 300 },
    });
    expect(acquired.executed?.json).toMatchObject({
      status: "committed",
      business_outcome: "applied",
    });
    const holds = await prisma.nurturePublishEditHold.findMany({
      where: { workspaceId: scope.workspaceId, publishProcessId: process.id },
    });
    expect(holds).toHaveLength(1);
    expect(holds[0]?.holderParticipantId).toBe(scope.caregiver.id);

    // Release-after-expiry is a real write that clears the slot, not an
    // already_satisfied that leaves the dead row standing.
    await prisma.nurturePublishEditHold.update({
      where: { id: holds[0]!.id },
      data: {
        createdAt: new Date(Date.now() - 300_000),
        expiresAt: new Date(Date.now() - 180_000),
      },
    });
    const swept = await prepareAndExecute({
      scope,
      actorId: scope.caregiverB.id,
      surface: "board",
      capabilityKey: "release_publish_edit_hold",
      targetOptionRef: processRefFor(scope, scope.caregiverB.id, process.processKey),
    });
    expect(swept.executed?.json).toMatchObject({
      status: "committed",
      business_outcome: "applied",
    });
    expect(
      await prisma.nurturePublishEditHold.count({
        where: { workspaceId: scope.workspaceId, publishProcessId: process.id },
      }),
    ).toBe(0);
  });

  it("saves a draft revision and refuses the head the owner has moved past", async () => {
    const scope = await seedScope();
    const { process, revision } = await seedEditableProcess(scope);
    const mine = processRefFor(scope, scope.caregiver.id, process.processKey);
    const draft = {
      expectedDraftRevision: 1,
      title: "春游安排",
      segments: [{ text: "今天孩子们去了公园", sourceRef: "source-ref-1" }],
    };

    const saved = await prepareAndExecute({
      scope,
      actorId: scope.caregiver.id,
      surface: "board",
      capabilityKey: "save_publish_process_draft",
      targetOptionRef: mine,
      operationInput: draft,
    });
    expect(saved.executed?.json).toMatchObject({
      status: "committed",
      business_outcome: "applied",
    });
    expect(saved.executed?.json.committed_result.revision).toBe(2);
    // Neither the body nor any raw owner id appears anywhere in the response.
    expect(JSON.stringify(saved.executed?.json)).not.toContain("春游安排");
    expect(JSON.stringify(saved.executed?.json)).not.toContain(process.processKey);
    expect(JSON.stringify(saved.executed?.json)).not.toContain(process.id);

    const stored = await prisma.nurturePublishProcessRevision.findFirstOrThrow({
      where: { workspaceId: scope.workspaceId, publishProcessId: process.id, revision: 2 },
    });
    expect(stored.organizerInputRevision).toBe(revision.organizerInputRevision);
    expect(stored.commandRequestIdHash).not.toBeNull();
    expect(
      await prisma.nurturePublishProcessRevision.count({
        where: { workspaceId: scope.workspaceId, publishProcessId: process.id },
      }),
    ).toBe(2);

    // The LWW kill shot: a buffer composed against revision 1 arrives AFTER the
    // save that made revision 2. Prepare itself must conflict — previously the
    // server substituted its own head here and the stale buffer silently won.
    const staleBase = await prepareAction({
      scope,
      actorId: scope.caregiverB.id,
      surface: "board",
      capabilityKey: "save_publish_process_draft",
      targetOptionRef: processRefFor(scope, scope.caregiverB.id, process.processKey),
      operationInput: { expectedDraftRevision: 1, title: "旧缓冲", segments: [{ text: "旧" }] },
    });
    expect(staleBase.json).toEqual({
      status: "denied",
      reason_code: "draft_revision_conflict",
    });
    // Nothing was written: the overwrite the old behavior would have committed.
    expect(
      await prisma.nurturePublishProcessRevision.count({
        where: { workspaceId: scope.workspaceId, publishProcessId: process.id },
      }),
    ).toBe(2);

    // Prepared against revision 2, then a colleague saves revision 3 first.
    const stalePrepared = await prepareAction({
      scope,
      actorId: scope.caregiver.id,
      surface: "board",
      capabilityKey: "save_publish_process_draft",
      targetOptionRef: mine,
      operationInput: { ...draft, expectedDraftRevision: 2 },
    });
    expect(stalePrepared.json.status).toBe("ready_to_confirm");
    await prepareAndExecute({
      scope,
      actorId: scope.caregiverB.id,
      surface: "board",
      capabilityKey: "save_publish_process_draft",
      targetOptionRef: processRefFor(scope, scope.caregiverB.id, process.processKey),
      operationInput: {
        expectedDraftRevision: 2,
        title: "另一位老师",
        segments: [{ text: "另一段" }],
      },
    });
    const stale = await executePrepared({
      scope,
      actorId: scope.caregiver.id,
      surface: "board",
      capabilityKey: "save_publish_process_draft",
      prepared: stalePrepared,
      operationInput: { ...draft, expectedDraftRevision: 2 },
    });
    // No last-write-wins: the client refreshes and reapplies.
    expect(stale.json).toMatchObject({
      status: "not_committed",
      reason_code: "stale_confirmation",
      recovery: "reprepare",
    });
    expect(
      (await prisma.nurturePublishProcess.findUniqueOrThrow({ where: { id: process.id } }))
        .currentRevisionId,
    ).not.toBe(stored.id);
  });

  it("refuses a guardian, an unknown source ref and a cancelled process", async () => {
    const scope = await seedScope();
    const { process } = await seedEditableProcess(scope);

    await expect(
      prepareAction({
        scope,
        actorId: scope.guardian.id,
        surface: "board",
        capabilityKey: "acquire_publish_edit_hold",
        targetOptionRef: processRefFor(scope, scope.guardian.id, process.processKey),
      }).then((response) => response.json),
    ).resolves.toMatchObject({ status: "denied", reason_code: "target_unavailable" });

    const mine = processRefFor(scope, scope.caregiver.id, process.processKey);
    await expect(
      prepareAction({
        scope,
        actorId: scope.caregiver.id,
        surface: "board",
        capabilityKey: "save_publish_process_draft",
        targetOptionRef: mine,
        operationInput: {
          expectedDraftRevision: 1,
          title: "t",
          segments: [{ text: "x", sourceRef: "1.not-issued" }],
        },
      }).then((response) => response.json),
    ).resolves.toMatchObject({ status: "denied", reason_code: "unknown_source_ref" });

    await prepareAndExecute({
      scope,
      actorId: scope.caregiver.id,
      surface: "board",
      capabilityKey: "cancel_publish_process",
      targetOptionRef: mine,
    });
    // A cancelled process is never edited in place.
    for (const capabilityKey of [
      "acquire_publish_edit_hold",
      "save_publish_process_draft",
    ] as const) {
      const refused = await prepareAction({
        scope,
        actorId: scope.caregiver.id,
        surface: "board",
        capabilityKey,
        targetOptionRef: mine,
        ...(capabilityKey === "save_publish_process_draft"
          ? { operationInput: { expectedDraftRevision: 1, title: "t", segments: [{ text: "x" }] } }
          : {}),
      });
      expect(refused.json, capabilityKey).toMatchObject({
        status: "denied",
        reason_code: "process_not_editable",
      });
    }
  });
});

describe("T-006 attribution lane through the formal Harness ingress", () => {
  const seedAttributableAsset = async (scope: SeedScope) => {
    const asset = await prisma.nurtureMediaAssetRef.create({
      data: {
        workspaceId: scope.workspaceId,
        institutionId: scope.institution.id,
        careGroupId: scope.group.id,
        sourceKind: "class_album",
        storageRefPayload: { bucket: "media", key: randomUUID() },
        lifecycle: "ready",
      },
    });
    const candidate = await prisma.nurtureChildMediaAttribution.create({
      data: {
        workspaceId: scope.workspaceId,
        mediaAssetRefId: asset.id,
        childCareProcessId: scope.process.id,
        source: "system",
        state: "candidate",
        attributionRevision: 1,
      },
    });
    return { asset, candidate };
  };

  const mediaRefFor = (scope: SeedScope, participantId: string, assetId: string) =>
    issueMediaAssetTargetRef(INTEGRITY_KEY, {
      workspace_id: scope.workspaceId,
      participant_id: participantId,
    }, assetId);

  const childRefFor = (scope: SeedScope, participantId: string, childProcessId: string) =>
    issueChildOptionRef(INTEGRITY_KEY, {
      workspace_id: scope.workspaceId,
      participant_id: participantId,
    }, childProcessId);

  it("confirms a candidate on the owner rows and replays the exact result", async () => {
    const scope = await seedScope();
    const { asset } = await seedAttributableAsset(scope);
    const prepared = await prepareAction({
      scope,
      actorId: scope.caregiver.id,
      surface: "board",
      capabilityKey: "confirm_child_media_attribution",
      targetOptionRef: mediaRefFor(scope, scope.caregiver.id, asset.id),
      operationInput: { childRef: childRefFor(scope, scope.caregiver.id, scope.process.id) },
    });
    expect(prepared.json.status).toBe("ready_to_confirm");
    const executed = await executePrepared({
      scope,
      actorId: scope.caregiver.id,
      surface: "board",
      capabilityKey: "confirm_child_media_attribution",
      prepared,
      operationInput: { childRef: childRefFor(scope, scope.caregiver.id, scope.process.id) },
    });
    expect(executed.json).toMatchObject({
      status: "committed",
      business_outcome: "applied",
    });
    expect(executed.json.committed_result.records).toHaveLength(1);
    expect(executed.json.committed_result.records[0]).toMatchObject({
      status: "confirmed",
      revision: 2,
      source: "manual",
    });

    const stored = await prisma.nurtureChildMediaAttribution.findFirstOrThrow({
      where: {
        workspaceId: scope.workspaceId,
        mediaAssetRefId: asset.id,
        attributionRevision: 2,
      },
    });
    expect(stored.state).toBe("confirmed");
    expect(stored.confirmedAt?.toISOString()).toBe(
      executed.json.committed_result.records[0].decidedAt,
    );

    // No raw id anywhere on the wire.
    const serialized = JSON.stringify(executed.json);
    for (const raw of [asset.id, scope.process.id, stored.id]) {
      expect(serialized).not.toContain(raw);
    }

    // The same command identity replays the same stored result.
    const replayed = await executePrepared({
      scope,
      actorId: scope.caregiver.id,
      surface: "board",
      capabilityKey: "confirm_child_media_attribution",
      prepared,
      operationInput: { childRef: childRefFor(scope, scope.caregiver.id, scope.process.id) },
      invocationSuffix: ":replay",
    });
    expect(replayed.json).toMatchObject({
      status: "committed",
      execution_disposition: "replayed",
    });
    expect(replayed.json.committed_result).toEqual(executed.json.committed_result);
  });

  it("a second teacher's repeat answers from the stored instant; supersede corrects A to B", async () => {
    const scope = await seedScope();
    const { asset } = await seedAttributableAsset(scope);
    const first = await prepareAndExecute({
      scope,
      actorId: scope.caregiver.id,
      surface: "board",
      capabilityKey: "confirm_child_media_attribution",
      targetOptionRef: mediaRefFor(scope, scope.caregiver.id, asset.id),
      operationInput: { childRef: childRefFor(scope, scope.caregiver.id, scope.process.id) },
    });
    expect(first.executed?.json.status).toBe("committed");

    // Colleague repeats the same confirmation: already_satisfied, the SAME
    // stored instant, no third revision.
    const repeat = await prepareAndExecute({
      scope,
      actorId: scope.caregiverB.id,
      surface: "board",
      capabilityKey: "confirm_child_media_attribution",
      targetOptionRef: mediaRefFor(scope, scope.caregiverB.id, asset.id),
      operationInput: { childRef: childRefFor(scope, scope.caregiverB.id, scope.process.id) },
    });
    expect(repeat.executed?.json).toMatchObject({
      status: "committed",
      business_outcome: "already_satisfied",
    });
    expect(repeat.executed?.json.committed_result.records[0].decidedAt).toBe(
      first.executed?.json.committed_result.records[0].decidedAt,
    );
    expect(
      await prisma.nurtureChildMediaAttribution.count({
        where: { workspaceId: scope.workspaceId, mediaAssetRefId: asset.id },
      }),
    ).toBe(2);

    // The photo is actually the second child: supersede A → B in one commit.
    const childB = await prisma.nurtureChild.create({
      data: { workspaceId: scope.workspaceId, displayName: "Child B", status: "active" },
    });
    const processB = await prisma.nurtureChildCareProcess.create({
      data: { workspaceId: scope.workspaceId, childId: childB.id, status: "active" },
    });
    await prisma.nurtureEnrollment.create({
      data: {
        workspaceId: scope.workspaceId,
        childCareProcessId: processB.id,
        institutionId: scope.institution.id,
        careGroupId: scope.group.id,
        status: "active",
      },
    });
    const superseded = await prepareAndExecute({
      scope,
      actorId: scope.caregiver.id,
      surface: "board",
      capabilityKey: "supersede_child_media_attribution",
      targetOptionRef: mediaRefFor(scope, scope.caregiver.id, asset.id),
      operationInput: {
        fromChildRef: childRefFor(scope, scope.caregiver.id, scope.process.id),
        toChildRef: childRefFor(scope, scope.caregiver.id, processB.id),
      },
    });
    expect(superseded.executed?.json.status).toBe("committed");
    expect(
      superseded.executed?.json.committed_result.records.map(
        (record: { status: string; revision: number }) => [record.status, record.revision],
      ),
    ).toEqual([
      ["superseded", 3],
      ["confirmed", 1],
    ]);
    const linked = await prisma.nurtureChildMediaAttribution.findFirstOrThrow({
      where: {
        workspaceId: scope.workspaceId,
        mediaAssetRefId: asset.id,
        childCareProcessId: scope.process.id,
        attributionRevision: 3,
      },
    });
    expect(linked.supersededByAttributionId).not.toBeNull();
  });

  it("commits a rejection: the candidate's next revision records the decision", async () => {
    // The runtime evidence census exposed this gap: reject had only
    // refusal-path e2e coverage, which is not real-path evidence.
    const scope = await seedScope();
    const { asset } = await seedAttributableAsset(scope);
    const rejected = await prepareAndExecute({
      scope,
      actorId: scope.caregiver.id,
      surface: "board",
      capabilityKey: "reject_child_media_attribution",
      targetOptionRef: mediaRefFor(scope, scope.caregiver.id, asset.id),
      operationInput: { childRef: childRefFor(scope, scope.caregiver.id, scope.process.id) },
    });
    expect(rejected.executed?.json).toMatchObject({
      status: "committed",
      business_outcome: "applied",
    });
    const current = await prisma.nurtureChildMediaAttribution.findFirstOrThrow({
      where: {
        workspaceId: scope.workspaceId,
        mediaAssetRefId: asset.id,
        childCareProcessId: scope.process.id,
      },
      orderBy: { attributionRevision: "desc" },
    });
    expect(current.state).toBe("rejected");
    expect(JSON.stringify(rejected.executed?.json)).not.toContain(asset.id);
  });

  it("refuses a guardian, a stale head, and a resubmitted child that differs from the prepared one", async () => {
    const scope = await seedScope();
    const { asset } = await seedAttributableAsset(scope);

    // A guardian holds no class role: the media ref never resolves.
    await expect(
      prepareAction({
        scope,
        actorId: scope.guardian.id,
        surface: "board",
        capabilityKey: "confirm_child_media_attribution",
        targetOptionRef: mediaRefFor(scope, scope.guardian.id, asset.id),
        operationInput: { childRef: childRefFor(scope, scope.guardian.id, scope.process.id) },
      }).then((response) => response.json),
    ).resolves.toMatchObject({ status: "denied", reason_code: "target_unavailable" });

    // Prepared, then the attribution advances under the confirmation.
    const prepared = await prepareAction({
      scope,
      actorId: scope.caregiver.id,
      surface: "board",
      capabilityKey: "reject_child_media_attribution",
      targetOptionRef: mediaRefFor(scope, scope.caregiver.id, asset.id),
      operationInput: { childRef: childRefFor(scope, scope.caregiver.id, scope.process.id) },
    });
    expect(prepared.json.status).toBe("ready_to_confirm");
    await prisma.nurtureChildMediaAttribution.create({
      data: {
        workspaceId: scope.workspaceId,
        mediaAssetRefId: asset.id,
        childCareProcessId: scope.process.id,
        source: "manual",
        state: "confirmed",
        attributionRevision: 2,
        confirmedByRoleAssignmentId: scope.caregiverRole.id,
        confirmedAt: new Date(),
        exposurePolicyPayload: { audience: "own_family" },
      },
    });
    const stale = await executePrepared({
      scope,
      actorId: scope.caregiver.id,
      surface: "board",
      capabilityKey: "reject_child_media_attribution",
      prepared,
      operationInput: { childRef: childRefFor(scope, scope.caregiver.id, scope.process.id) },
    });
    // The re-run rule sees the moved state before the head comparison does:
    // rejecting a now-confirmed fact is an illegal transition, refused without
    // any write. The head comparison stays behind it as the backstop for drift
    // the state rules cannot see.
    expect(stale.json).toMatchObject({
      status: "not_committed",
      decision: "blocked",
      reason_code: "illegal_attribution_transition",
    });
    expect(
      await prisma.nurtureChildMediaAttribution.count({
        where: { workspaceId: scope.workspaceId, mediaAssetRefId: asset.id },
      }),
    ).toBe(2);

    // A resubmitted child that differs from the prepared one is refused by the
    // binding, not silently corrected back by the confirmation.
    const prepared2 = await prepareAction({
      scope,
      actorId: scope.caregiver.id,
      surface: "board",
      capabilityKey: "confirm_child_media_attribution",
      targetOptionRef: mediaRefFor(scope, scope.caregiver.id, asset.id),
      operationInput: { childRef: childRefFor(scope, scope.caregiver.id, scope.process.id) },
    });
    // Already confirmed now, so prepare reports the repeat posture — fine; the
    // point is the execute-side binding below.
    const mismatched = await executePrepared({
      scope,
      actorId: scope.caregiver.id,
      surface: "board",
      capabilityKey: "confirm_child_media_attribution",
      prepared: prepared2,
      operationInput: {
        childRef: childRefFor(scope, scope.caregiver.id, "some-other-child"),
      },
    });
    expect(mismatched.json).toMatchObject({
      status: "not_committed",
      decision: "invalid",
      reason_code: "invalid_operation_input",
    });
  });
});

describe("T-006 media lifecycle through the formal Harness ingress", () => {
  const seedComposedDraft = async (scope: SeedScope) => {
    const asset = await prisma.nurtureMediaAssetRef.create({
      data: {
        workspaceId: scope.workspaceId,
        institutionId: scope.institution.id,
        careGroupId: scope.group.id,
        sourceKind: "class_album",
        storageRefPayload: { bucket: "media", key: randomUUID() },
        lifecycle: "ready",
      },
    });
    const process = await prisma.nurturePublishProcess.create({
      data: {
        workspaceId: scope.workspaceId,
        careGroupId: scope.group.id,
        processKey: `publish:${randomUUID()}`,
        state: "draft",
        dataClass: "child_growth_record",
        purposeKey: "child_growth_publication",
      },
    });
    const revision = await prisma.nurturePublishProcessRevision.create({
      data: {
        workspaceId: scope.workspaceId,
        publishProcessId: process.id,
        revision: 1,
        contentDigest: "sha256:content",
        organizerInputRevision: "organizer:1",
        mediaCompositionPayload: {
          media: [
            { mediaAssetId: asset.id, mediaRevision: 1 },
            { mediaAssetId: randomUUID(), mediaRevision: 1 },
          ],
        },
      },
    });
    await prisma.nurturePublishProcess.update({
      where: { id: process.id },
      data: { currentRevisionId: revision.id },
    });
    return { asset, process };
  };

  it("detaches one entry from the card and discards the asset globally", async () => {
    const scope = await seedScope();
    const { asset, process } = await seedComposedDraft(scope);
    const processRef = issueBoardSealedRef(
      INTEGRITY_KEY,
      { workspace_id: scope.workspaceId, participant_id: scope.caregiver.id },
      PUBLISH_PROCESS_TARGET_KIND,
      process.processKey,
    );
    const mediaRef = issueMediaAssetTargetRef(
      INTEGRITY_KEY,
      { workspace_id: scope.workspaceId, participant_id: scope.caregiver.id },
      asset.id,
    );

    const detached = await prepareAndExecute({
      scope,
      actorId: scope.caregiver.id,
      surface: "board",
      capabilityKey: "detach_publish_process_media",
      targetOptionRef: processRef,
      operationInput: { mediaRef },
    });
    expect(detached.prepared.json.preview).toMatchObject({ remaining_media_count: 1 });
    expect(detached.executed?.json).toMatchObject({
      status: "committed",
      business_outcome: "applied",
    });
    expect(detached.executed?.json.committed_result.remainingMediaCount).toBe(1);
    const current = await prisma.nurturePublishProcess.findUniqueOrThrow({
      where: { id: process.id },
      include: { currentRevision: true },
    });
    expect(current.currentRevision?.revision).toBe(2);
    expect(JSON.stringify(current.currentRevision?.mediaCompositionPayload)).not.toContain(
      asset.id,
    );
    // The asset row is untouched by a card-level detach.
    expect(
      (await prisma.nurtureMediaAssetRef.findUniqueOrThrow({ where: { id: asset.id } }))
        .lifecycle,
    ).toBe("ready");
    // No raw id on the wire.
    for (const raw of [asset.id, process.id, process.processKey]) {
      expect(JSON.stringify(detached.executed?.json)).not.toContain(raw);
    }

    // Now the global pre-publication delete: the blast radius is stated at
    // prepare and recorded at commit.
    const discarded = await prepareAndExecute({
      scope,
      actorId: scope.caregiverB.id,
      surface: "board",
      capabilityKey: "discard_media_asset",
      targetOptionRef: issueMediaAssetTargetRef(
        INTEGRITY_KEY,
        { workspace_id: scope.workspaceId, participant_id: scope.caregiverB.id },
        asset.id,
      ),
    });
    // The detach above removed the only citing draft, so the radius is zero.
    expect(discarded.prepared.json.preview).toMatchObject({ affected_draft_count: 0 });
    expect(discarded.executed?.json).toMatchObject({
      status: "committed",
      business_outcome: "applied",
    });
    expect(discarded.executed?.json.committed_result.affectedDraftCount).toBe(0);
    for (const raw of [asset.id, process.id, process.processKey, scope.group.id]) {
      expect(JSON.stringify(discarded.executed?.json)).not.toContain(raw);
    }
    expect(
      (await prisma.nurtureMediaAssetRef.findUniqueOrThrow({ where: { id: asset.id } }))
        .lifecycle,
    ).toBe("discarded");

    // Terminal media takes no further decisions of any kind.
    const refused = await prepareAction({
      scope,
      actorId: scope.caregiver.id,
      surface: "board",
      capabilityKey: "discard_media_asset",
      targetOptionRef: mediaRef,
    });
    expect(refused.json).toMatchObject({
      status: "denied",
      reason_code: "media_already_terminal",
    });
  });

  it("refuses the discard while a committed release's frozen composition carries the asset", async () => {
    const scope = await seedScope();
    const { asset, process } = await seedComposedDraft(scope);
    const revision = await prisma.nurturePublishProcessRevision.findFirstOrThrow({
      where: { workspaceId: scope.workspaceId, publishProcessId: process.id },
    });
    const grant = await prisma.nurtureChildLinkGrant.create({
      data: {
        workspaceId: scope.workspaceId,
        childCareProcessId: scope.process.id,
        enrollmentId: scope.enrollment.id,
        grantedByParticipantId: scope.guardian.id,
        grantedToScopeType: "care_group",
        grantedToScopeId: scope.group.id,
        directions: ["org_to_family"],
        dataClasses: ["child_growth_record"],
        purposes: ["child_growth_publication"],
        status: "active",
      },
    });
    const target = await prisma.nurturePublishProcessTarget.create({
      data: {
        workspaceId: scope.workspaceId,
        publishProcessId: process.id,
        targetKey: `target:${randomUUID()}`,
        childCareProcessId: scope.process.id,
        enrollmentId: scope.enrollment.id,
        familyRefKey: `${scope.workspaceId}:${scope.process.id}`,
        grantId: grant.id,
      },
    });
    await prisma.nurturePublicationRelease.create({
      data: {
        workspaceId: scope.workspaceId,
        publishProcessId: process.id,
        publishProcessTargetId: target.id,
        publishProcessRevisionId: revision.id,
        releasedByRoleAssignmentId: scope.caregiverRole.id,
        commandRequestIdHash: "d".repeat(64),
      },
    });

    const refused = await prepareAction({
      scope,
      actorId: scope.caregiver.id,
      surface: "board",
      capabilityKey: "discard_media_asset",
      targetOptionRef: issueMediaAssetTargetRef(
        INTEGRITY_KEY,
        { workspace_id: scope.workspaceId, participant_id: scope.caregiver.id },
        asset.id,
      ),
    });
    expect(refused.json).toMatchObject({ status: "denied", reason_code: "already_released" });
    expect(
      (await prisma.nurtureMediaAssetRef.findUniqueOrThrow({ where: { id: asset.id } }))
        .lifecycle,
    ).toBe("ready");
  });

  it("refuses the discard when the blast radius moved between prepare and execute", async () => {
    const scope = await seedScope();
    const { asset, process } = await seedComposedDraft(scope);

    const prepared = await prepareAction({
      scope,
      actorId: scope.caregiver.id,
      surface: "board",
      capabilityKey: "discard_media_asset",
      targetOptionRef: issueMediaAssetTargetRef(
        INTEGRITY_KEY,
        { workspace_id: scope.workspaceId, participant_id: scope.caregiver.id },
        asset.id,
      ),
    });
    expect(prepared.json.status).toBe("ready_to_confirm");
    expect(prepared.json.preview).toMatchObject({ affected_draft_count: 1 });

    // A colleague edits the citing draft and drops the asset: the number the
    // teacher confirmed is no longer the number a commit would record.
    const next = await prisma.nurturePublishProcessRevision.create({
      data: {
        workspaceId: scope.workspaceId,
        publishProcessId: process.id,
        revision: 2,
        contentDigest: "sha256:content-detached",
        organizerInputRevision: "organizer:2",
        mediaCompositionPayload: [],
      },
    });
    await prisma.nurturePublishProcess.update({
      where: { id: process.id },
      data: { currentRevisionId: next.id },
    });

    const executed = await executePrepared({
      scope,
      actorId: scope.caregiver.id,
      surface: "board",
      capabilityKey: "discard_media_asset",
      prepared,
    });
    expect(executed.json).toMatchObject({
      status: "not_committed",
      reason_code: "stale_confirmation",
      recovery: "reprepare",
    });
    // Nothing moved: the asset is still live.
    expect(
      (await prisma.nurtureMediaAssetRef.findUniqueOrThrow({ where: { id: asset.id } }))
        .lifecycle,
    ).toBe("ready");
  });
});

describe("T-006 post-release safety through the formal Harness ingress", () => {
  const seedReleased = async (scope: SeedScope) => {
    // `released` requires its frozen revision (the state CHECK enforces it),
    // so the process reaches `released` only together with the freeze — the
    // same shape commitTargetRelease writes.
    const process = await prisma.nurturePublishProcess.create({
      data: {
        workspaceId: scope.workspaceId,
        careGroupId: scope.group.id,
        processKey: `publish:${randomUUID()}`,
        state: "pending_release",
        dataClass: "child_growth_record",
        purposeKey: "child_growth_publication",
      },
    });
    const revision = await prisma.nurturePublishProcessRevision.create({
      data: {
        workspaceId: scope.workspaceId,
        publishProcessId: process.id,
        revision: 1,
        contentDigest: "sha256:content",
        organizerInputRevision: "organizer:1",
      },
    });
    await prisma.nurturePublishProcess.update({
      where: { id: process.id },
      data: {
        state: "released",
        currentRevisionId: revision.id,
        frozenRevisionId: revision.id,
      },
    });
    const grant = await prisma.nurtureChildLinkGrant.create({
      data: {
        workspaceId: scope.workspaceId,
        childCareProcessId: scope.process.id,
        enrollmentId: scope.enrollment.id,
        grantedByParticipantId: scope.guardian.id,
        grantedToScopeType: "care_group",
        grantedToScopeId: scope.group.id,
        directions: ["org_to_family"],
        dataClasses: ["child_growth_record"],
        purposes: ["child_growth_publication"],
        status: "active",
      },
    });
    const target = await prisma.nurturePublishProcessTarget.create({
      data: {
        workspaceId: scope.workspaceId,
        publishProcessId: process.id,
        targetKey: `target:${randomUUID()}`,
        childCareProcessId: scope.process.id,
        enrollmentId: scope.enrollment.id,
        familyRefKey: `${scope.workspaceId}:${scope.process.id}`,
        grantId: grant.id,
      },
    });
    const receipt = await prisma.nurtureChildLinkReceipt.create({
      data: {
        workspaceId: scope.workspaceId,
        grantId: grant.id,
        childCareProcessId: scope.process.id,
        enrollmentId: scope.enrollment.id,
        direction: "org_to_family",
        dataClass: "child_growth_record",
        sourceType: "publication_release",
        sourceId: target.id,
        routingAttemptKey: `attempt:${randomUUID()}`,
        targetScopeType: "family",
        targetScopeId: scope.family.id,
        status: "delivered",
        deliveredAt: new Date("2026-08-04T03:00:00.000Z"),
      },
    });
    const release = await prisma.nurturePublicationRelease.create({
      data: {
        workspaceId: scope.workspaceId,
        publishProcessId: process.id,
        publishProcessTargetId: target.id,
        publishProcessRevisionId: revision.id,
        releasedByRoleAssignmentId: scope.caregiverRole.id,
        commandRequestIdHash: "e".repeat(64),
        receiptId: receipt.id,
      },
    });
    return { process, release };
  };

  const safetyProcessRef = (scope: SeedScope, participantId: string, processKey: string) =>
    issueBoardSealedRef(
      INTEGRITY_KEY,
      { workspace_id: scope.workspaceId, participant_id: participantId },
      PUBLISH_PROCESS_TARGET_KIND,
      processKey,
    );

  it("corrects with a sealed body, removes one target, redacts, and repeats from stored facts", async () => {
    const scope = await seedScope();
    const { process, release } = await seedReleased(scope);
    const mine = safetyProcessRef(scope, scope.caregiver.id, process.processKey);

    // Correction: an event that hides nothing and carries the sealed body.
    const corrected = await prepareAndExecute({
      scope,
      actorId: scope.caregiver.id,
      surface: "board",
      capabilityKey: "correct_publication",
      targetOptionRef: mine,
      operationInput: { reason: "content_error", correctionText: "昨天的活动是周三,不是周四" },
    });
    expect(corrected.executed?.json).toMatchObject({
      status: "committed",
      business_outcome: "applied",
    });
    expect(corrected.executed?.json.committed_result.events).toHaveLength(1);
    expect(corrected.executed?.json.committed_result.events[0]).toMatchObject({
      kind: "correction",
      reason: "content_error",
    });
    const correctionRow = await prisma.nurturePublicationVisibilityEvent.findFirstOrThrow({
      where: { workspaceId: scope.workspaceId, kind: "correction" },
    });
    // The lineage names the command, the actor and carries the SEALED body.
    expect(correctionRow.commandExecutionId).not.toBeNull();
    expect(correctionRow.bodyProtectionPayload).not.toBeNull();
    expect(JSON.stringify(correctionRow.bodyProtectionPayload)).not.toContain("周三");
    // The whole response, not selected fields: no raw owner identifier of
    // any concept this action touched may reach the wire.
    for (const raw of [
      release.id,
      release.receiptId,
      process.id,
      process.processKey,
      correctionRow.id,
      scope.group.id,
    ]) {
      expect(JSON.stringify(corrected.executed?.json)).not.toContain(raw);
    }
    expect(
      (
        await prisma.nurturePublicationRelease.findUniqueOrThrow({ where: { id: release.id } })
      ).visibility,
    ).toBe("visible");

    // Target removal.
    const removed = await prepareAndExecute({
      scope,
      actorId: scope.caregiver.id,
      surface: "board",
      capabilityKey: "remove_publication_target_visibility",
      targetOptionRef: mine,
      operationInput: {
        reason: "family_request",
        publicationRef: issuePublicationRef(
          INTEGRITY_KEY,
          { workspace_id: scope.workspaceId, participant_id: scope.caregiver.id },
          release.id,
        ),
      },
    });
    expect(removed.executed?.json).toMatchObject({
      status: "committed",
      business_outcome: "applied",
    });
    const removedAt = removed.executed?.json.committed_result.events[0].occurredAt;
    for (const raw of [release.id, release.receiptId, process.id, process.processKey]) {
      expect(JSON.stringify(removed.executed?.json)).not.toContain(raw);
    }
    expect(
      (
        await prisma.nurturePublicationRelease.findUniqueOrThrow({ where: { id: release.id } })
      ).visibility,
    ).toBe("removed");

    // A colleague repeats the removal: the answer is the STORED event — its
    // own kind and its own instant, not a fresh redaction-shaped guess.
    const repeat = await prepareAndExecute({
      scope,
      actorId: scope.caregiverB.id,
      surface: "board",
      capabilityKey: "remove_publication_target_visibility",
      targetOptionRef: safetyProcessRef(scope, scope.caregiverB.id, process.processKey),
      operationInput: {
        reason: "wrong_target",
        publicationRef: issuePublicationRef(
          INTEGRITY_KEY,
          { workspace_id: scope.workspaceId, participant_id: scope.caregiverB.id },
          release.id,
        ),
      },
    });
    expect(repeat.executed?.json).toMatchObject({
      status: "committed",
      business_outcome: "already_satisfied",
    });
    expect(repeat.executed?.json.committed_result.events[0]).toMatchObject({
      kind: "target_removal",
      reason: "family_request",
      occurredAt: removedAt,
    });

    // Redaction covers the removed release; the terminal repeat answers from
    // the stored redaction.
    const redacted = await prepareAndExecute({
      scope,
      actorId: scope.caregiver.id,
      surface: "board",
      capabilityKey: "redact_publication",
      targetOptionRef: mine,
      operationInput: { reason: "policy_requirement" },
    });
    expect(redacted.executed?.json).toMatchObject({
      status: "committed",
      business_outcome: "applied",
    });
    expect(
      (
        await prisma.nurturePublicationRelease.findUniqueOrThrow({ where: { id: release.id } })
      ).visibility,
    ).toBe("redacted");
    const redactionAt = redacted.executed?.json.committed_result.events[0].occurredAt;

    const redactRepeat = await prepareAndExecute({
      scope,
      actorId: scope.caregiverB.id,
      surface: "board",
      capabilityKey: "redact_publication",
      targetOptionRef: safetyProcessRef(scope, scope.caregiverB.id, process.processKey),
      operationInput: { reason: "family_request" },
    });
    expect(redactRepeat.executed?.json).toMatchObject({
      status: "committed",
      business_outcome: "already_satisfied",
    });
    expect(redactRepeat.executed?.json.committed_result.events[0]).toMatchObject({
      kind: "redaction",
      reason: "policy_requirement",
      occurredAt: redactionAt,
    });

    // The full lineage survives: correction + removal + redaction, all naming
    // their commands; the release and its Receipt are untouched.
    const lineage = await prisma.nurturePublicationVisibilityEvent.findMany({
      where: { workspaceId: scope.workspaceId, publicationReleaseId: release.id },
      orderBy: { occurredAt: "asc" },
    });
    expect(lineage.map((event) => event.kind)).toEqual([
      "correction",
      "target_removal",
      "redaction",
    ]);
    for (const event of lineage) {
      expect(event.commandExecutionId).not.toBeNull();
    }
    expect(
      (await prisma.nurturePublicationRelease.findUniqueOrThrow({ where: { id: release.id } }))
        .receiptId,
    ).not.toBeNull();
  });

  it("refuses a guardian and a process with no committed publication", async () => {
    const scope = await seedScope();
    const { process } = await seedReleased(scope);
    await expect(
      prepareAction({
        scope,
        actorId: scope.guardian.id,
        surface: "board",
        capabilityKey: "redact_publication",
        targetOptionRef: safetyProcessRef(scope, scope.guardian.id, process.processKey),
        operationInput: { reason: "family_request" },
      }).then((response) => response.json),
    ).resolves.toMatchObject({ status: "denied", reason_code: "target_unavailable" });

    // The second half the name promises: a process the class CAN see, but
    // with no committed publication to act on.
    const unreleased = await prisma.nurturePublishProcess.create({
      data: {
        workspaceId: scope.workspaceId,
        careGroupId: scope.group.id,
        processKey: `publish:${randomUUID()}`,
        state: "draft",
        dataClass: "child_growth_record",
        purposeKey: "child_growth_publication",
      },
    });
    await expect(
      prepareAction({
        scope,
        actorId: scope.caregiver.id,
        surface: "board",
        capabilityKey: "redact_publication",
        targetOptionRef: safetyProcessRef(scope, scope.caregiver.id, unreleased.processKey),
        operationInput: { reason: "family_request" },
      }).then((response) => response.json),
    ).resolves.toMatchObject({
      status: "denied",
      reason_code: "no_committed_publication",
    });
  });
});

describe("G3-D release fan-out on the formal ingress", () => {
  const policyDataForInstitution = (
    scope: SeedScope,
    overrides: Partial<{
      policyVersion: number;
      policyHead: number;
      effectiveFrom: Date;
    }> = {},
  ) => ({
    workspaceId: scope.workspaceId,
    institutionId: scope.institution.id,
    policyRef: "nurture.institution-publication-policy@1.0.0",
    policyVersion: 1,
    policyHead: 1,
    timeZone: "Asia/Shanghai",
    defaultReleaseLocalTime: "17:00",
    retryCutoffLocalTime: "19:00",
    organizeIdleSeconds: 600,
    organizeFallbackLeadSeconds: 1800,
    automaticQuiescenceSeconds: 60,
    captureActivityLeaseSeconds: 60,
    automaticOrganizeEnabled: true,
    effectiveFrom: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  });

  const seedQueuedRelease = async (scope: SeedScope, targetCount = 1) => {
    const resolvedAt = new Date();
    const scheduledAt = new Date(resolvedAt.getTime() + 60 * 60 * 1000);
    const notAfter = new Date(resolvedAt.getTime() + 3 * 60 * 60 * 1000);
    const policy = await prisma.nurtureInstitutionPublicationPolicy.create({
      data: policyDataForInstitution(scope, {
        effectiveFrom: new Date(resolvedAt.getTime() - 60 * 60 * 1000),
      }),
    });
    const process = await prisma.nurturePublishProcess.create({
      data: {
        workspaceId: scope.workspaceId,
        careGroupId: scope.group.id,
        processKey: `publish:${randomUUID()}`,
        state: "pending_release",
        dataClass: "child_growth_record",
        purposeKey: "child_growth_publication",
        authorizingRoleAssignmentId: scope.caregiverRole.id,
        scheduledAt,
        notAfter,
        scheduleTimeZone: "Asia/Shanghai",
        schedulePolicyRef: "nurture.institution-publication-policy@1.0.0",
        schedulePolicyHead: 1,
        schedulePolicyVersion: 1,
        scheduleResolvedAt: resolvedAt,
      },
    });
    const revision = await prisma.nurturePublishProcessRevision.create({
      data: {
        workspaceId: scope.workspaceId,
        publishProcessId: process.id,
        revision: 1,
        contentDigest: "sha256:content",
        organizerInputRevision: "organizer:1",
      },
    });
    await prisma.nurturePublishProcess.update({
      where: { id: process.id },
      data: { currentRevisionId: revision.id },
    });
    const targets = [];
    for (let index = 0; index < targetCount; index += 1) {
      const grant = await prisma.nurtureChildLinkGrant.create({
        data: {
          workspaceId: scope.workspaceId,
          childCareProcessId: scope.process.id,
          enrollmentId: scope.enrollment.id,
          grantedByParticipantId: scope.guardian.id,
          grantedToScopeType: "care_group",
          grantedToScopeId: scope.group.id,
          directions: ["org_to_family"],
          dataClasses: ["child_growth_record"],
          purposes: ["child_growth_publication"],
          status: "active",
        },
      });
      targets.push({
        grant,
        target: await prisma.nurturePublishProcessTarget.create({
          data: {
            workspaceId: scope.workspaceId,
            publishProcessId: process.id,
            targetKey: `target:${randomUUID()}`,
            childCareProcessId: scope.process.id,
            enrollmentId: scope.enrollment.id,
            familyRefKey: `${scope.workspaceId}:${scope.process.id}:${index}`,
            grantId: grant.id,
          },
        }),
      });
    }
    return {
      process,
      revision,
      targets,
      policy,
      schedule: { resolvedAt, scheduledAt, notAfter },
    };
  };

  const releaseRef = (scope: SeedScope, processKey: string) =>
    issueBoardSealedRef(
      INTEGRITY_KEY,
      { workspace_id: scope.workspaceId, participant_id: scope.caregiver.id },
      PUBLISH_PROCESS_TARGET_KIND,
      processKey,
    );

  it("reschedules through the formal ingress against the persisted T-007 policy", async () => {
    const scope = await seedScope();
    const { process, schedule } = await seedQueuedRelease(scope);
    const requestedScheduledAt = new Date(
      schedule.resolvedAt.getTime() + 2 * 60 * 60 * 1000,
    );

    const prepared = await prepareAction({
      scope,
      actorId: scope.caregiver.id,
      surface: "board",
      capabilityKey: "reschedule_publish_process",
      targetOptionRef: releaseRef(scope, process.processKey),
      operationInput: { scheduledAt: requestedScheduledAt.toISOString() },
    });
    expect(prepared.json).toMatchObject({
      status: "ready_to_confirm",
      preview: {
        effect: "reschedule_publish_process",
        scheduledAt: requestedScheduledAt.toISOString(),
        notAfter: schedule.notAfter.toISOString(),
      },
    });
    const executed = await executePrepared({
      scope,
      actorId: scope.caregiver.id,
      surface: "board",
      capabilityKey: "reschedule_publish_process",
      prepared,
      operationInput: { scheduledAt: requestedScheduledAt.toISOString() },
    });
    expect(executed.json).toMatchObject({
      status: "committed",
      business_outcome: "applied",
      committed_result: {
        scheduledAt: requestedScheduledAt.toISOString(),
        notAfter: schedule.notAfter.toISOString(),
        timeZone: "Asia/Shanghai",
        policyHead: 1,
        policyVersion: 1,
        resolvedAt: schedule.resolvedAt.toISOString(),
      },
    });
    const stored = await prisma.nurturePublishProcess.findUniqueOrThrow({
      where: { id: process.id },
    });
    expect(stored.scheduledAt?.toISOString()).toBe(requestedScheduledAt.toISOString());
    expect(stored.notAfter?.toISOString()).toBe(schedule.notAfter.toISOString());
    expect(stored.schedulePolicyHead).toBe(1);
    expect(stored.schedulePolicyVersion).toBe(1);
    expect(stored.scheduleResolvedAt?.toISOString()).toBe(
      schedule.resolvedAt.toISOString(),
    );
  });

  it("blocks reschedule when the exact T-007 policy changes after confirmation", async () => {
    const scope = await seedScope();
    const { process, policy, schedule } = await seedQueuedRelease(scope);
    const requestedScheduledAt = new Date(
      schedule.resolvedAt.getTime() + 2 * 60 * 60 * 1000,
    );
    const prepared = await prepareAction({
      scope,
      actorId: scope.caregiver.id,
      surface: "board",
      capabilityKey: "reschedule_publish_process",
      targetOptionRef: releaseRef(scope, process.processKey),
      operationInput: { scheduledAt: requestedScheduledAt.toISOString() },
    });
    expect(prepared.json.status).toBe("ready_to_confirm");

    const changedAt = new Date(Date.now() - 1);
    await prisma.nurtureInstitutionPublicationPolicy.update({
      where: { id: policy.id },
      data: { supersededAt: changedAt },
    });
    await prisma.nurtureInstitutionPublicationPolicy.create({
      data: policyDataForInstitution(scope, {
        policyVersion: 2,
        policyHead: 2,
        effectiveFrom: changedAt,
      }),
    });

    const executed = await executePrepared({
      scope,
      actorId: scope.caregiver.id,
      surface: "board",
      capabilityKey: "reschedule_publish_process",
      prepared,
      operationInput: { scheduledAt: requestedScheduledAt.toISOString() },
    });
    expect(executed.json).toMatchObject({
      status: "not_committed",
      reason_code: "publication_policy_drift",
    });
    expect(
      (
        await prisma.nurturePublishProcess.findUniqueOrThrow({
          where: { id: process.id },
        })
      ).scheduledAt?.toISOString(),
    ).toBe(schedule.scheduledAt.toISOString());
  });

  it("commits the target atomically and reconciles the repeat from stored rows", async () => {
    const scope = await seedScope();
    const { process, targets } = await seedQueuedRelease(scope);

    const prepared = await prepareAction({
      scope,
      actorId: scope.caregiver.id,
      surface: "board",
      capabilityKey: "release_publish_process",
      targetOptionRef: releaseRef(scope, process.processKey),
    });
    expect(prepared.json.status).toBe("ready_to_confirm");
    expect(prepared.json.preview).toEqual({
      effect: "release_publish_process",
      target_count: 1,
      already_committed_count: 0,
      release_revision: 1,
    });

    const executed = await executePrepared({
      scope,
      actorId: scope.caregiver.id,
      surface: "board",
      capabilityKey: "release_publish_process",
      prepared,
    });
    expect(executed.json).toMatchObject({
      status: "committed",
      execution_disposition: "executed",
      business_outcome: "applied",
    });
    expect(executed.json.committed_result).toMatchObject({
      processState: "released",
      frozenRevision: 1,
      summary: { total: 1, committed: 1, rejected: 0, outcomeUnknown: 0 },
      missedSendAttention: false,
    });
    expect(executed.json.committed_result.results[0].outcome).toBe("committed");

    // The three per-target facts landed together, and the execution names the
    // attempt as its parent — the "one runner command per target" identity.
    const release = await prisma.nurturePublicationRelease.findFirstOrThrow({
      where: { workspaceId: scope.workspaceId, publishProcessId: process.id },
    });
    expect(release.receiptId).not.toBeNull();
    const execution = await prisma.nurtureCommandExecution.findFirstOrThrow({
      where: {
        workspaceId: scope.workspaceId,
        commandKey: "release_publish_process",
      },
    });
    expect(execution.parentCommandRequestIdHash).toBe(
      publicationReleaseAttemptIdentity(prepared.json.command_request_id),
    );
    const stored = await prisma.nurturePublishProcess.findUniqueOrThrow({
      where: { id: process.id },
    });
    expect(stored.state).toBe("released");
    expect(stored.frozenRevisionId).not.toBeNull();

    // No raw owner identifier reaches the wire.
    const serialized = JSON.stringify(executed.json);
    for (const raw of [
      process.id,
      process.processKey,
      release.id,
      release.receiptId,
      targets[0]!.grant.id,
      targets[0]!.target.id,
    ]) {
      expect(serialized).not.toContain(raw);
    }

    // The consumed confirmation is not replayable...
    const replayed = await executePrepared({
      scope,
      actorId: scope.caregiver.id,
      surface: "board",
      capabilityKey: "release_publish_process",
      prepared,
      invocationSuffix: ":replay",
    });
    expect(replayed.json).toMatchObject({
      status: "not_committed",
      reason_code: "confirmation_replayed",
    });

    // ...reconciliation is a fresh prepare, answered from stored rows.
    const reprepared = await prepareAction({
      scope,
      actorId: scope.caregiver.id,
      surface: "board",
      capabilityKey: "release_publish_process",
      targetOptionRef: releaseRef(scope, process.processKey),
    });
    expect(reprepared.json.preview).toMatchObject({ already_committed_count: 1 });
    const reconciled = await executePrepared({
      scope,
      actorId: scope.caregiver.id,
      surface: "board",
      capabilityKey: "release_publish_process",
      prepared: reprepared,
    });
    expect(reconciled.json.status).toBe("committed");
    expect(reconciled.json.committed_result.results[0].outcome).toBe("already_committed");
    expect(reconciled.json.committed_result.results[0].publicationRef).toBe(
      executed.json.committed_result.results[0].publicationRef,
    );
    // Still exactly one release row: the repeat wrote nothing.
    expect(
      await prisma.nurturePublicationRelease.count({
        where: { workspaceId: scope.workspaceId, publishProcessId: process.id },
      }),
    ).toBe(1);
  });

  it("keeps a mid-attempt grant revocation to its own target", async () => {
    const scope = await seedScope();
    const { process, targets } = await seedQueuedRelease(scope, 2);

    const prepared = await prepareAction({
      scope,
      actorId: scope.caregiver.id,
      surface: "board",
      capabilityKey: "release_publish_process",
      targetOptionRef: releaseRef(scope, process.processKey),
    });
    expect(prepared.json.preview).toMatchObject({ target_count: 2 });

    // The family withdraws consent between prepare and execute: their target
    // must stop, and no other family's rolls back with it.
    await prisma.nurtureChildLinkGrant.update({
      where: { id: targets[1]!.grant.id },
      data: {
        status: "revoked",
        revokedAt: new Date(),
        revokedByParticipantId: scope.guardian.id,
      },
    });

    const executed = await executePrepared({
      scope,
      actorId: scope.caregiver.id,
      surface: "board",
      capabilityKey: "release_publish_process",
      prepared,
    });
    expect(executed.json.status).toBe("committed");
    expect(executed.json.committed_result.summary).toEqual({
      total: 2,
      committed: 1,
      rejected: 1,
      outcomeUnknown: 0,
    });
    const outcomes = executed.json.committed_result.results.map(
      (result: { outcome: string }) => result.outcome,
    );
    expect(outcomes.sort()).toEqual(["committed", "rejected"]);
    expect(
      await prisma.nurturePublicationRelease.count({
        where: { workspaceId: scope.workspaceId, publishProcessId: process.id },
      }),
    ).toBe(1);
  });

  it("refuses stale_confirmation when a save lands between prepare and execute", async () => {
    const scope = await seedScope();
    const { process } = await seedQueuedRelease(scope);
    const prepared = await prepareAction({
      scope,
      actorId: scope.caregiver.id,
      surface: "board",
      capabilityKey: "release_publish_process",
      targetOptionRef: releaseRef(scope, process.processKey),
    });
    expect(prepared.json.status).toBe("ready_to_confirm");

    // A colleague saves revision 2 after the teacher confirmed revision 1.
    const second = await prisma.nurturePublishProcessRevision.create({
      data: {
        workspaceId: scope.workspaceId,
        publishProcessId: process.id,
        revision: 2,
        contentDigest: "sha256:content-2",
        organizerInputRevision: "organizer:2",
      },
    });
    await prisma.nurturePublishProcess.update({
      where: { id: process.id },
      data: { currentRevisionId: second.id },
    });

    const executed = await executePrepared({
      scope,
      actorId: scope.caregiver.id,
      surface: "board",
      capabilityKey: "release_publish_process",
      prepared,
    });
    expect(executed.json).toMatchObject({
      status: "not_committed",
      reason_code: "stale_confirmation",
      recovery: "reprepare",
    });
    expect(
      await prisma.nurturePublicationRelease.count({
        where: { workspaceId: scope.workspaceId, publishProcessId: process.id },
      }),
    ).toBe(0);
  });

  it("blocks release when the exact T-007 policy changes after confirmation", async () => {
    const scope = await seedScope();
    const { process, policy } = await seedQueuedRelease(scope);
    const prepared = await prepareAction({
      scope,
      actorId: scope.caregiver.id,
      surface: "board",
      capabilityKey: "release_publish_process",
      targetOptionRef: releaseRef(scope, process.processKey),
    });
    expect(prepared.json.status).toBe("ready_to_confirm");

    const changedAt = new Date(Date.now() - 1);
    await prisma.nurtureInstitutionPublicationPolicy.update({
      where: { id: policy.id },
      data: { supersededAt: changedAt },
    });
    await prisma.nurtureInstitutionPublicationPolicy.create({
      data: policyDataForInstitution(scope, {
        policyVersion: 2,
        policyHead: 2,
        effectiveFrom: changedAt,
      }),
    });
    const executed = await executePrepared({
      scope,
      actorId: scope.caregiver.id,
      surface: "board",
      capabilityKey: "release_publish_process",
      prepared,
    });
    expect(executed.json).toMatchObject({
      status: "not_committed",
      reason_code: "publication_policy_drift",
    });
    expect(
      await prisma.nurturePublicationRelease.count({
        where: { workspaceId: scope.workspaceId, publishProcessId: process.id },
      }),
    ).toBe(0);
  });
});

describe("G3-B1 manual organize through the formal Harness ingress", () => {
  const sealer = createAesGcmProtectedContentPort({
    keyRef: "nurture-protected-content-v1",
    keyMaterial: CONTENT_KEY,
  });

  const seedOrganizeScope = async (options: { markers?: string[] } = {}) => {
    const scope = await seedScope();
    await prisma.nurtureCareInstitution.update({
      where: { id: scope.institution.id },
      data: {
        policyConfigPayload: {
          contentSafetyPolicyRef: "syn-content-safety-1",
          contentSafetyPolicyHead: 2,
        },
      },
    });
    await prisma.nurtureInstitutionPublicationPolicy.create({
      data: {
        workspaceId: scope.workspaceId,
        institutionId: scope.institution.id,
        policyRef: "nurture.institution-publication-policy@1.0.0",
        policyVersion: 1,
        policyHead: 5,
        timeZone: "Asia/Shanghai",
        defaultReleaseLocalTime: "17:00",
        retryCutoffLocalTime: "19:00",
        organizeIdleSeconds: 600,
        organizeFallbackLeadSeconds: 1800,
        automaticQuiescenceSeconds: 60,
        captureActivityLeaseSeconds: 60,
        automaticOrganizeEnabled: true,
        effectiveFrom: new Date("2026-01-01T00:00:00.000Z"),
      },
    });
    await prisma.nurtureChildLinkGrant.create({
      data: {
        workspaceId: scope.workspaceId,
        childCareProcessId: scope.process.id,
        enrollmentId: scope.enrollment.id,
        grantedByParticipantId: scope.guardian.id,
        grantedToScopeType: "care_group",
        grantedToScopeId: scope.group.id,
        directions: ["org_to_family"],
        dataClasses: ["daily_care_log"],
        purposes: ["family_daily_care_update"],
        status: "active",
      },
    });
    const batch = await prisma.nurtureCareCaptureBatch.create({
      data: {
        workspaceId: scope.workspaceId,
        careGroupId: scope.group.id,
        state: "collecting",
      },
    });
    await prisma.nurtureCareCapture.create({
      data: {
        workspaceId: scope.workspaceId,
        careGroupId: scope.group.id,
        captureBatchId: batch.id,
        capturedByRoleAssignmentId: scope.caregiverRole.id,
        kind: "text",
        sourceSequence: 1,
        stable: true,
        bodyProtectionPayload: sealer.seal("户外活动结束后回教室。") as never,
        safetyMarkersPayload: (options.markers ?? []) as never,
        occurredAt: new Date("2026-08-04T09:00:00.000Z"),
      },
    });
    return { scope, batch };
  };

  const organizePrepare = async (
    scope: Awaited<ReturnType<typeof seedScope>>,
    targetOptionRef?: string,
  ) =>
    prepareAction({
      scope,
      actorId: scope.caregiver.id,
      surface: "board",
      capabilityKey: "organize_care_capture_batch",
      targetOptionRef: targetOptionRef as never,
    });

  it("organizes the batch into a daily-care draft with its class targets", async () => {
    const { scope, batch } = await seedOrganizeScope();

    // The class channel is an owner-issued option, never a raw group id.
    const choices = await organizePrepare(scope);
    expect(choices.json.status).toBe("needs_input");
    expect(choices.json.choices).toHaveLength(1);
    expect(choices.json.choices[0].display_label).toBe("Class A");
    const targetOptionRef = choices.json.choices[0].target_option_ref as string;
    expect(targetOptionRef).not.toContain(scope.group.id);

    const prepared = await organizePrepare(scope, targetOptionRef);
    expect(prepared.json.status).toBe("ready_to_confirm");
    expect(prepared.json.preview).toMatchObject({
      included_capture_count: 1,
      deferred_capture_count: 0,
    });

    const executed = await executePrepared({
      scope,
      actorId: scope.caregiver.id,
      surface: "board",
      capabilityKey: "organize_care_capture_batch",
      prepared,
    });
    expect(executed.json, JSON.stringify(executed.json)).toMatchObject({
      status: "committed",
      business_outcome: "applied",
    });
    expect(executed.json.committed_result).toMatchObject({
      outcome: "organized",
      includedCaptureCount: 1,
      deferredCaptureCount: 0,
    });
    expect(executed.json.committed_result.processRef).toBeTruthy();

    const storedBatch = await prisma.nurtureCareCaptureBatch.findUniqueOrThrow({
      where: { id: batch.id },
    });
    expect(storedBatch.state).toBe("organized");
    expect(storedBatch.resolvedTrigger).toBe("manual");
    expect(storedBatch.triggerRequestId).toBe(prepared.json.command_request_id);
    expect(storedBatch.policyRef).toBe("nurture.institution-publication-policy@1.0.0");
    expect(storedBatch.policyHead).toBe(5);
    expect(storedBatch.timeZone).toBe("Asia/Shanghai");
    expect(storedBatch.quiescenceSeconds).toBe(60);
    expect(storedBatch.observedUserActivityAt).toEqual(storedBatch.cutAt);

    const process = await prisma.nurturePublishProcess.findFirstOrThrow({
      where: { workspaceId: scope.workspaceId, captureBatchId: batch.id },
      include: { currentRevision: true, targets: true },
    });
    expect(process.state).toBe("draft");
    expect(process.dataClass).toBe("daily_care_log");
    expect(process.currentRevision?.revision).toBe(1);
    expect(process.currentRevision?.titleProtectionPayload).toBeTruthy();
    expect(process.targets).toHaveLength(1);
    expect(process.authorizingRoleAssignmentId).toBe(scope.caregiverRole.id);
    expect(process.scheduledAt).toBeNull();

    // My-Chat owns timer/retry, while this scenario-side service owns the
    // admission decision and atomic schedule write. This is the real
    // provider-backed schedule path, not a hand-seeded pending row.
    const admission = await new PrismaPublishQueueAdmissionService(prisma).admitDueProcess({
      workspace_id: scope.workspaceId,
      process_key: process.processKey,
      now: new Date(process.createdAt.getTime() + 31_000),
    });
    expect(admission).toMatchObject({
      status: "queued",
      schedule: {
        policyRef: "nurture.institution-publication-policy@1.0.0",
        policyHead: 5,
        policyVersion: 1,
        timeZone: "Asia/Shanghai",
      },
    });
    const queued = await prisma.nurturePublishProcess.findUniqueOrThrow({
      where: { id: process.id },
    });
    expect(queued.state).toBe("pending_release");
    expect(queued.scheduledAt).not.toBeNull();
    expect(queued.notAfter).not.toBeNull();
    expect(queued.notAfter!.getTime()).toBeGreaterThan(queued.scheduledAt!.getTime());
    expect(queued.scheduleResolvedAt?.toISOString()).toBe(
      new Date(process.createdAt.getTime() + 31_000).toISOString(),
    );

    // Continue the same persisted provider/consumer journey through the
    // formal reschedule and release actions.
    const requestedScheduledAt = new Date(
      Math.min(
        queued.notAfter!.getTime() - 1_000,
        Math.max(Date.now() + 60_000, queued.scheduledAt!.getTime() + 15 * 60_000),
      ),
    );
    const processTargetRef = issueBoardSealedRef(
      INTEGRITY_KEY,
      { workspace_id: scope.workspaceId, participant_id: scope.caregiver.id },
      PUBLISH_PROCESS_TARGET_KIND,
      process.processKey,
    );
    const reschedulePrepared = await prepareAction({
      scope,
      actorId: scope.caregiver.id,
      surface: "board",
      capabilityKey: "reschedule_publish_process",
      targetOptionRef: processTargetRef,
      operationInput: { scheduledAt: requestedScheduledAt.toISOString() },
    });
    expect(reschedulePrepared.json.status).toBe("ready_to_confirm");
    const rescheduled = await executePrepared({
      scope,
      actorId: scope.caregiver.id,
      surface: "board",
      capabilityKey: "reschedule_publish_process",
      prepared: reschedulePrepared,
      operationInput: { scheduledAt: requestedScheduledAt.toISOString() },
    });
    expect(rescheduled.json).toMatchObject({
      status: "committed",
      business_outcome: "applied",
      committed_result: {
        scheduledAt: requestedScheduledAt.toISOString(),
        policyHead: 5,
        policyVersion: 1,
      },
    });

    const releasePrepared = await prepareAction({
      scope,
      actorId: scope.caregiver.id,
      surface: "board",
      capabilityKey: "release_publish_process",
      targetOptionRef: processTargetRef,
    });
    expect(releasePrepared.json.status).toBe("ready_to_confirm");
    const released = await executePrepared({
      scope,
      actorId: scope.caregiver.id,
      surface: "board",
      capabilityKey: "release_publish_process",
      prepared: releasePrepared,
    });
    expect(released.json).toMatchObject({
      status: "committed",
      business_outcome: "applied",
      committed_result: {
        processState: "released",
        summary: { total: 1, committed: 1 },
      },
    });
    const publicationRelease = await prisma.nurturePublicationRelease.findFirstOrThrow({
      where: { workspaceId: scope.workspaceId, publishProcessId: process.id },
      include: { receipt: true },
    });
    expect(publicationRelease.receipt).toMatchObject({
      sourceType: "publication_release",
      status: "delivered",
      direction: "org_to_family",
    });

    // Close the real journey on the family projection, not merely on the
    // release row. The summary is the protected owner title; an internal
    // process key must never become family-visible copy.
    const familyActivity = await post(HARNESS_QUERY_PATH, {
      workspace_id: scope.workspaceId,
      actor_participant_id: scope.guardian.id,
      surface: "board",
      capability_key: "query_guardian_enrollment_activity",
      capability_version: "1.0.0",
      target_option_ref: issueTargetOptionRef(INTEGRITY_KEY, {
        workspace_id: scope.workspaceId,
        participant_id: scope.guardian.id,
        enrollment_id: scope.enrollment.id,
      }),
    });
    expect(familyActivity.json).toMatchObject({
      status: "ok",
      output: {
        items: [
          {
            kind: "daily_care",
            sourceLabel: "publication_release",
          },
        ],
      },
    });
    expect(familyActivity.json.output.items[0].summary).toBeTruthy();
    const familyWire = JSON.stringify(familyActivity.json);
    for (const raw of [
      process.id,
      process.processKey,
      publicationRelease.id,
      publicationRelease.receiptId,
      scope.enrollment.id,
    ]) {
      expect(familyWire).not.toContain(raw);
    }
    const assessment = await prisma.nurtureContentSafetyAssessment.findFirstOrThrow({
      where: { workspaceId: scope.workspaceId, publishProcessId: process.id },
    });
    expect(assessment.route).toBe("ordinary");
    recordJointEvidence(JOINT_EVIDENCE_KEYS.t007T006Publication);

    // No raw owner identifier on the wire.
    const serialized = JSON.stringify(executed.json);
    for (const raw of [batch.id, process.id, process.processKey, scope.group.id]) {
      expect(serialized).not.toContain(raw);
    }
  });

  it("keeps organize default-off when the T-007 publication policy is absent", async () => {
    const { scope } = await seedOrganizeScope();
    const choices = await organizePrepare(scope);
    expect(choices.json.status).toBe("needs_input");
    await prisma.nurtureInstitutionPublicationPolicy.deleteMany({
      where: { workspaceId: scope.workspaceId, institutionId: scope.institution.id },
    });

    const prepared = await organizePrepare(
      scope,
      choices.json.choices[0].target_option_ref as string,
    );
    expect(prepared.json).toMatchObject({
      status: "denied",
      reason_code: "policy_unavailable",
    });
    expect(
      await prisma.nurturePublishProcess.count({ where: { workspaceId: scope.workspaceId } }),
    ).toBe(0);
  });

  it("rebases an unqueued draft onto the current T-007 policy before schedule freeze", async () => {
    const { scope, batch } = await seedOrganizeScope();
    const choices = await organizePrepare(scope);
    const prepared = await organizePrepare(
      scope,
      choices.json.choices[0].target_option_ref as string,
    );
    const executed = await executePrepared({
      scope,
      actorId: scope.caregiver.id,
      surface: "board",
      capabilityKey: "organize_care_capture_batch",
      prepared,
    });
    expect(executed.json.status).toBe("committed");

    const process = await prisma.nurturePublishProcess.findFirstOrThrow({
      where: { workspaceId: scope.workspaceId, captureBatchId: batch.id },
    });
    const policyChangedAt = new Date(process.createdAt.getTime() + 10_000);
    await prisma.nurtureInstitutionPublicationPolicy.updateMany({
      where: {
        workspaceId: scope.workspaceId,
        institutionId: scope.institution.id,
        policyVersion: 1,
      },
      data: { supersededAt: policyChangedAt },
    });
    await prisma.nurtureInstitutionPublicationPolicy.create({
      data: {
        workspaceId: scope.workspaceId,
        institutionId: scope.institution.id,
        policyRef: "nurture.institution-publication-policy@1.0.0",
        policyVersion: 2,
        policyHead: 6,
        timeZone: "Asia/Shanghai",
        defaultReleaseLocalTime: "18:00",
        retryCutoffLocalTime: "20:00",
        organizeIdleSeconds: 600,
        organizeFallbackLeadSeconds: 1800,
        automaticQuiescenceSeconds: 60,
        captureActivityLeaseSeconds: 60,
        automaticOrganizeEnabled: true,
        effectiveFrom: policyChangedAt,
      },
    });

    const admission = await new PrismaPublishQueueAdmissionService(prisma).admitDueProcess({
      workspace_id: scope.workspaceId,
      process_key: process.processKey,
      now: new Date(process.createdAt.getTime() + 31_000),
    });
    expect(admission).toMatchObject({
      status: "queued",
      schedule: {
        policyRef: "nurture.institution-publication-policy@1.0.0",
        policyHead: 6,
        policyVersion: 2,
        timeZone: "Asia/Shanghai",
      },
    });
    const queued = await prisma.nurturePublishProcess.findUniqueOrThrow({
      where: { id: process.id },
    });
    expect(queued.state).toBe("pending_release");
    expect(queued.schedulePolicyHead).toBe(6);
    expect(queued.schedulePolicyVersion).toBe(2);
  });

  it("routes restricted content to direct interaction with the owner-issued T-005 entry", async () => {
    const { scope, batch } = await seedOrganizeScope({ markers: ["health_symptom"] });
    const choices = await organizePrepare(scope);
    const prepared = await organizePrepare(
      scope,
      choices.json.choices[0].target_option_ref as string,
    );
    const executed = await executePrepared({
      scope,
      actorId: scope.caregiver.id,
      surface: "board",
      capabilityKey: "organize_care_capture_batch",
      prepared,
    });
    expect(executed.json.status).toBe("committed");
    const result = executed.json.committed_result;
    expect(result.outcome).toBe("direct_interaction_required");
    expect(result.processRef).toBeUndefined();
    // The D-15 entry: exact capability ref plus an owner-issued option the
    // T-005 prepare resolves — current eligibility, not a role name.
    expect(result.directInteractionAction).toMatchObject({
      status: "available",
      capabilityKey: "initiate_caregiver_direct_message",
      capabilityVersion: "1.0.0",
    });
    expect(result.directInteractionAction.targetOptions).toHaveLength(1);
    expect(JSON.stringify(result)).not.toContain(scope.enrollment.id);

    // Consume the exact T-006-produced option through the real T-005 provider,
    // not through a synthetic option or the ordinary family-question lane.
    const directMessageInput = {
      body: "想进一步确认今天的情况，请家里方便时回复。",
    };
    const directPrepared = await prepareAction({
      scope,
      actorId: scope.caregiver.id,
      surface: "board",
      capabilityKey: result.directInteractionAction.capabilityKey,
      targetOptionRef: result.directInteractionAction.targetOptions[0].targetOptionRef,
      operationInput: directMessageInput,
    });
    expect(directPrepared.json.status).toBe("ready_to_confirm");
    const directExecuted = await executePrepared({
      scope,
      actorId: scope.caregiver.id,
      surface: "board",
      capabilityKey: "initiate_caregiver_direct_message",
      prepared: directPrepared,
      operationInput: directMessageInput,
    });
    expect(directExecuted.json).toMatchObject({
      status: "committed",
      business_outcome: "applied",
    });

    // No publication candidate exists, and the batch still organized.
    expect(
      await prisma.nurturePublishProcess.count({
        where: { workspaceId: scope.workspaceId, captureBatchId: batch.id },
      }),
    ).toBe(0);
    expect(
      (await prisma.nurtureCareCaptureBatch.findUniqueOrThrow({ where: { id: batch.id } }))
        .state,
    ).toBe("organized");
    // The most safety-relevant decision of all is still addressable.
    const assessment = await prisma.nurtureContentSafetyAssessment.findFirstOrThrow({
      where: { workspaceId: scope.workspaceId, careGroupId: scope.group.id },
    });
    expect(assessment.route).toBe("direct_interaction_required");
    expect(assessment.publishProcessId).toBeNull();
    recordJointEvidence(JOINT_EVIDENCE_KEYS.t005T006DirectInteraction);
  });

  it("refuses stale_confirmation when a capture lands between prepare and execute", async () => {
    const { scope, batch } = await seedOrganizeScope();
    const choices = await organizePrepare(scope);
    const prepared = await organizePrepare(
      scope,
      choices.json.choices[0].target_option_ref as string,
    );
    expect(prepared.json.status).toBe("ready_to_confirm");

    // Intake bumps the batch head: the cut the teacher confirmed is stale.
    await prisma.nurtureCareCaptureBatch.update({
      where: { id: batch.id },
      data: { aggregateVersion: { increment: 1 } },
    });

    const executed = await executePrepared({
      scope,
      actorId: scope.caregiver.id,
      surface: "board",
      capabilityKey: "organize_care_capture_batch",
      prepared,
    });
    expect(executed.json).toMatchObject({
      status: "not_committed",
      reason_code: "stale_confirmation",
      recovery: "reprepare",
    });
    expect(
      (await prisma.nurtureCareCaptureBatch.findUniqueOrThrow({ where: { id: batch.id } }))
        .state,
    ).toBe("collecting");
  });

  it("refuses a guardian the organize channel entirely", async () => {
    const { scope } = await seedOrganizeScope();
    const refused = await prepareAction({
      scope,
      actorId: scope.guardian.id,
      surface: "board",
      capabilityKey: "organize_care_capture_batch",
      targetOptionRef: undefined as never,
    });
    expect(refused.json).toMatchObject({ status: "denied", reason_code: "not_authorized" });
  });
});
