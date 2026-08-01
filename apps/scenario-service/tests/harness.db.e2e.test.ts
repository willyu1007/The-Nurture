import type { AddressInfo } from "node:net";
import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { issueCareItemTargetRef } from "@the-nurture/scenario";
import { createPrismaClient } from "@the-nurture/db";
import { createScenarioServiceApplication } from "../src/application.js";
import { createBindingOwnerServiceAuth } from "../src/binding-owner-service-auth.js";
import { createHarnessRuntime } from "../src/harness-runtime.js";
import {
  HARNESS_EXECUTE_PATH,
  HARNESS_PREPARE_PATH,
  HARNESS_QUERY_PATH,
  HARNESS_READ_RESULT_PATH,
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
  const harnessRuntime = createHarnessRuntime({
    env: {
      DATABASE_URL: databaseUrl,
      NURTURE_HARNESS_INTEGRITY_KEY: INTEGRITY_KEY,
      NURTURE_PROTECTED_CONTENT_KEY: CONTENT_KEY,
    },
    serviceAuth,
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

const post = async (path: string, body: unknown): Promise<{ status: number; json: any }> => {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${TOKEN}`,
      "content-type": "application/json",
      connection: "close",
    },
    body: JSON.stringify(body),
  });
  return { status: response.status, json: await response.json() };
};

const seedScope = async () => {
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
      participantId: caregiver.id,
      role: "caregiver",
      scopeType: "care_group",
      scopeId: group.id,
      status: "active",
    },
  });
  await prisma.nurtureChildLinkGrant.create({
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
  return { workspaceId, guardian, caregiver };
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
