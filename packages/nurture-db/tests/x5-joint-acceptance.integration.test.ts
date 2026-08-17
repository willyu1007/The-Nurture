import { randomUUID } from "node:crypto";
import { createServer } from "node:net";
import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type {
  HandoffManifest,
  WorkflowCommandMeta,
} from "@my-chat/workflow-contracts";
import {
  NurtureCommandRunner,
  NurtureUserAttentionService,
  familyCareRef,
  familyInputRouteSpec,
  revokeFamilyCareGrantSpec,
  type FamilyInputRoutePayload,
  type NurtureCommandHandoffActivation,
} from "@the-nurture/scenario";
import {
  createNurtureRepositories,
  createPrismaClient as createNurturePrismaClient,
  PrismaUserAttentionRepository,
} from "../src/index.js";
import { createScenarioServiceApplication } from "../../../apps/scenario-service/src/application.js";
import { createBindingOwnerServiceAuth } from "../../../apps/scenario-service/src/binding-owner-service-auth.js";
import { createGrowthRecordContributionConfig } from "../../../apps/scenario-service/src/growth-record-contribution.controller.js";
import {
  createPrismaClient as createMyChatPrismaClient,
  PrismaAdminWorkflowRecoveryRepository,
  PrismaNotificationRepository,
  PrismaOutboxRepository,
  PrismaWorkflowHandoffRepository,
  PrismaWorkflowRuntimePort,
} from "@my-chat/db";
import {
  createWorkflowHandoffDraftsFromScenarioSnapshots,
} from "@my-chat/workflow-runtime";
// NOTE(T-002): the Nurture owner endpoint adopted the typed Dashboard
// contract on 2026-08-08 (record 19; joint lane green at My-Chat df7a273).
// The My-Chat fixture additionally seeds the caregiver recipient as an
// active workspace member because the T-042 hardening notifies only active
// members of the exact workspace.
import {
  createNurtureUserAttentionHttpSource,
  resolveNurtureDashboardItem,
} from "@my-chat/scenario-integrations";
import {
  createNurtureUserAttentionOwner,
} from "@my-chat/workers/nurture-user-attention-owner";
import {
  createWorkflowHandoffOwnerHandler,
} from "@my-chat/workers/workflow-handoff-owner";

const NURTURE_DATABASE_URL = process.env.X5_NURTURE_DATABASE_URL;
const MY_CHAT_DATABASE_URL = process.env.X5_MY_CHAT_DATABASE_URL;
if (!NURTURE_DATABASE_URL || !MY_CHAT_DATABASE_URL) {
  throw new Error(
    "X5_NURTURE_DATABASE_URL and X5_MY_CHAT_DATABASE_URL are required for the joint acceptance suite.",
  );
}

const CONTRACT_HASH = "b".repeat(64);
const CLAIM_SIGNING_KEY = "x5-joint-acceptance-signing-key-32-bytes-minimum";
const SERVICE_TOKEN = "x5-joint-owner-service-token-32-bytes";

describe("X5 Nurture/My-Chat two-database acceptance", () => {
  const previousDatabaseUrl = process.env.DATABASE_URL;
  const nurture = createNurturePrismaClient(NURTURE_DATABASE_URL);
  let myChat: ReturnType<typeof createMyChatPrismaClient>;
  let ownerBaseUrl: string;
  let ownerServer: { close(): Promise<void> };

  beforeAll(async () => {
    process.env.DATABASE_URL = MY_CHAT_DATABASE_URL;
    myChat = createMyChatPrismaClient();
    const owner = new NurtureUserAttentionService(
      new PrismaUserAttentionRepository(nurture),
    );
    // T-014 Wave 2: the owner endpoint now lives in the scenario-service; the
    // joint lane drives My-Chat's HTTP source against that real ingress.
    const { app } = await createScenarioServiceApplication({
      userAttentionOwner: {
        serviceAuth: createBindingOwnerServiceAuth(SERVICE_TOKEN),
        service: owner,
      },
      growthRecordContribution: createGrowthRecordContributionConfig({ env: {} }),
    });
    await app.listen(0, "127.0.0.1");
    ownerServer = app;
    const address = app.getHttpServer().address() as AddressInfo;
    ownerBaseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterAll(async () => {
    await ownerServer.close();
    await Promise.all([nurture.$disconnect(), myChat.$disconnect()]);
    if (previousDatabaseUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = previousDatabaseUrl;
    }
  });

  it("recovers a committed Nurture result on the same Step, materializes once, and fails closed after revoke", async () => {
    const workspaceId = `x5-joint-${randomUUID()}`;
    const fixture = await seedNurtureFixture(nurture, workspaceId);
    const repositories = createNurtureRepositories(nurture);
    const runner = new NurtureCommandRunner(repositories.commands);
    const host = await seedMyChatFixture(myChat, workspaceId);
    const runtime = createPinnedRuntime(myChat);

    const firstLease = await runtime.claim_step({
      run_id: host.runId,
      step_id: host.stepId,
      expected_version: 1,
      worker_id: "x5-worker-initial",
      meta: commandMeta(host),
    });
    const routePayload = familyInputPayload(fixture);
    const first = await runner.execute({
      workspace_id: workspaceId,
      invocation_request_id: `invocation:${host.stepId}`,
      command_request_id: `command:${host.stepId}`,
      business_actor_ref: fixture.guardian.id,
      child_care_process_id: fixture.process.id,
      handoff_activation: activation(
        host.stepId,
        firstLease.claim_token,
        firstLease.aggregate_version,
      ),
      payload: routePayload,
      spec: familyInputRouteSpec,
    });
    if (first.status !== "ok") {
      throw new Error(`first Nurture command did not commit: ${JSON.stringify(first)}`);
    }
    expect(first).toMatchObject({
      status: "ok",
      disposition: "executed",
      handoff_request_snapshots: [
        {
          handoffKey: "user_attention",
          requestedPurpose: "user_attention",
        },
      ],
    });

    const unknown = await runtime.fail_step({
      run_id: host.runId,
      step_id: host.stepId,
      expected_version: firstLease.aggregate_version,
      reason_code: "workflow_handler_outcome_unknown",
      retryable: true,
      meta: commandMeta(host),
    });
    expect(unknown.data).toMatchObject({
      status: "manual_review_required",
      aggregate_version: 3,
    });

    const otherLease = await runtime.claim_step({
      run_id: host.runId,
      step_id: host.otherStepId,
      expected_version: 1,
      worker_id: "x5-worker-other",
      meta: commandMeta({ ...host, stepId: host.otherStepId }),
    });
    await expect(
      runner.execute({
        workspace_id: workspaceId,
        invocation_request_id: `invocation:${host.stepId}`,
        command_request_id: `command:${host.stepId}`,
        business_actor_ref: fixture.guardian.id,
        child_care_process_id: fixture.process.id,
        handoff_activation: activation(
          host.otherStepId,
          otherLease.claim_token,
          otherLease.aggregate_version,
        ),
        payload: routePayload,
        spec: familyInputRouteSpec,
      }),
    ).resolves.toMatchObject({
      status: "not_committed",
      reason_code: "invalid_durable_handoff_driver",
    });

    const admin = new PrismaAdminWorkflowRecoveryRepository(myChat);
    const reconciliation = await admin.reconcileWorkflowStep({
      workspaceId,
      actorId: "admin-actor",
      runId: host.runId,
      stepId: host.stepId,
      expectedVersion: unknown.data.aggregate_version,
      idempotencyKey: `reconcile:${host.stepId}`,
      correlationId: `correlation:${host.stepId}`,
    });
    expect(reconciliation).toMatchObject({
      targetKind: "workflow_step",
      targetId: host.stepId,
      status: "retry_requested",
      aggregateVersion: 4,
    });

    const reclaimed = await runtime.claim_step({
      run_id: host.runId,
      step_id: host.stepId,
      expected_version: reconciliation.aggregateVersion,
      worker_id: "x5-worker-reconciled",
      meta: commandMeta(host),
    });
    const replay = await runner.execute({
      workspace_id: workspaceId,
      invocation_request_id: `invocation:${host.stepId}`,
      command_request_id: `command:${host.stepId}`,
      business_actor_ref: fixture.guardian.id,
      child_care_process_id: fixture.process.id,
      handoff_activation: activation(
        host.stepId,
        reclaimed.claim_token,
        reclaimed.aggregate_version,
      ),
      payload: routePayload,
      spec: familyInputRouteSpec,
    });
    expect(replay).toMatchObject({ status: "ok", disposition: "replayed" });
    if (replay.status !== "ok") throw new Error("Nurture replay was unavailable");
    expect(replay.handoff_request_snapshots).toEqual(
      first.handoff_request_snapshots,
    );
    await expect(
      nurture.nurtureFamilyCareMessage.count({ where: { workspaceId } }),
    ).resolves.toBe(1);

    const completeInput = {
      completion_contract_version: 1 as const,
      run_id: host.runId,
      step_id: host.stepId,
      expected_version: reclaimed.aggregate_version,
      claim_token: reclaimed.claim_token,
      status: "completed" as const,
      output_refs: [
        {
          schema_version: 1 as const,
          namespace: "nurture",
          object_type: "command_execution",
          object_id: replay.execution_ref.object_id,
          version: replay.execution_ref.version,
        },
      ],
      handoff_drafts: createWorkflowHandoffDraftsFromScenarioSnapshots(
        replay.handoff_request_snapshots,
      ),
      meta: commandMeta(host),
    };
    const completion = await runtime.complete_step(completeInput);
    const completionReplay = await runtime.complete_step(completeInput);
    expect(completionReplay).toEqual(completion);
    expect(completion.data.materialized_handoffs).toHaveLength(1);

    const ledger = new PrismaWorkflowHandoffRepository(myChat);
    const notificationRepository = new PrismaNotificationRepository(myChat);
    const source = createNurtureUserAttentionHttpSource({
      baseUrl: ownerBaseUrl,
      serviceToken: SERVICE_TOKEN,
    });
    const handler = createWorkflowHandoffOwnerHandler({
      ledger,
      owners: [
        createNurtureUserAttentionOwner({ source, notificationRepository }),
      ],
    });
    const outbox = new PrismaOutboxRepository(myChat);
    const claimed = await outbox.claimPending({
      limit: 1_000,
      workerId: "x5-owner-worker",
      processingLeaseMs: 60_000,
    });
    const requested = claimed.find(
      (event) =>
        event.eventType === "workflow.handoff.requested" &&
        event.workspaceId === workspaceId,
    );
    expect(requested).toBeDefined();
    await handler.handle(requested!);
    await handler.handle(requested!);

    const handoffId = completion.data.materialized_handoffs[0]!.handoff_ref.object_id;
    const handoff = await ledger.get({
      workspace_id: workspaceId,
      handoff_id: handoffId,
    });
    expect(handoff).toMatchObject({ status: "completed", aggregate_version: 2 });
    await expect(
      myChat.notification.count({ where: { workspaceId } }),
    ).resolves.toBe(1);
    await expect(
      resolveNurtureDashboardItem({
        ledger,
        source,
        workspace_id: workspaceId,
        handoff_id: handoffId,
        actor_user_id: fixture.caregiver.myChatUserId,
      }),
    ).resolves.toMatchObject({
      status: "ready",
      handoff_id: handoffId,
      item: { presentation_type: "nurture_attention_v1" },
    });

    const revoked = await runner.execute({
      workspace_id: workspaceId,
      invocation_request_id: `invocation:revoke:${fixture.grant.id}`,
      command_request_id: `command:revoke:${fixture.grant.id}`,
      business_actor_ref: fixture.guardian.id,
      child_care_process_id: fixture.process.id,
      payload: {
        participant_id: fixture.guardian.id,
        role_assignment_id: fixture.guardianRole.id,
        grant_id: fixture.grant.id,
        expected_version: 0,
        reason_code: "user_revoked",
      },
      spec: revokeFamilyCareGrantSpec,
    });
    expect(revoked).toMatchObject({ status: "ok" });
    await expect(
      resolveNurtureDashboardItem({
        ledger,
        source,
        workspace_id: workspaceId,
        handoff_id: handoffId,
        actor_user_id: fixture.caregiver.myChatUserId,
      }),
    ).resolves.toEqual({
      status: "unavailable",
      reason_code: "grant_revoked",
    });

    const execution = await nurture.nurtureCommandExecution.findFirstOrThrow({
      where: { workspaceId, commandKey: familyInputRouteSpec.command_key },
    });
    const persistedNurture = JSON.stringify(execution);
    expect(persistedNurture).not.toContain(firstLease.claim_token);
    expect(persistedNurture).not.toContain(reclaimed.claim_token);
    expect(persistedNurture).not.toContain("claimToken");
    expect(persistedNurture).not.toContain("expectedStepVersion");

    const persistedHost = JSON.stringify({
      handoff: await myChat.workflowHandoff.findUniqueOrThrow({
        where: { id: handoffId },
      }),
      outbox: await myChat.outboxEvent.findMany({
        where: { workspaceId, aggregateType: "workflow_handoff" },
      }),
      notifications: await myChat.notification.findMany({
        where: { workspaceId },
      }),
    });
    expect(persistedHost).not.toContain(routePayload.safe_summary);
    expect(persistedHost).not.toContain("protected_message_content");
    expect(persistedHost).not.toContain(firstLease.claim_token);
    expect(persistedHost).not.toContain(reclaimed.claim_token);
  });

  it("fails closed while the user-attention owner is unreachable and recovers on the next dispatch", async () => {
    const workspaceId = `x5-owner-down-${randomUUID()}`;
    const { fixture, host, runtime, lease, executed } =
      await seedAndExecuteFamilyInput({ nurture, myChat, workspaceId });
    const completion = await runtime.complete_step(
      completionInput(host, executed, lease),
    );
    expect(completion.data.materialized_handoffs).toHaveLength(1);
    const handoffId =
      completion.data.materialized_handoffs[0]!.handoff_ref.object_id;

    const outbox = new PrismaOutboxRepository(myChat);
    const claimed = await outbox.claimPending({
      limit: 1_000,
      workerId: "x5-owner-down-worker",
      processingLeaseMs: 60_000,
    });
    const requested = claimed.find(
      (event) =>
        event.eventType === "workflow.handoff.requested" &&
        event.workspaceId === workspaceId,
    );
    expect(requested).toBeDefined();

    const ledger = new PrismaWorkflowHandoffRepository(myChat);
    const notificationRepository = new PrismaNotificationRepository(myChat);
    const unreachableSource = createNurtureUserAttentionHttpSource({
      baseUrl: await closedPortBaseUrl(),
      serviceToken: SERVICE_TOKEN,
      timeoutMs: 1_000,
    });
    const unreachableHandler = createWorkflowHandoffOwnerHandler({
      ledger,
      owners: [
        createNurtureUserAttentionOwner({
          source: unreachableSource,
          notificationRepository,
        }),
      ],
    });
    await expect(unreachableHandler.handle(requested!)).rejects.toThrow();
    await expect(
      ledger.get({ workspace_id: workspaceId, handoff_id: handoffId }),
    ).resolves.toMatchObject({ status: "requested", aggregate_version: 1 });
    await expect(
      myChat.notification.count({ where: { workspaceId } }),
    ).resolves.toBe(0);
    await expect(
      resolveNurtureDashboardItem({
        ledger,
        source: unreachableSource,
        workspace_id: workspaceId,
        handoff_id: handoffId,
        actor_user_id: fixture.caregiver.myChatUserId,
      }),
    ).resolves.toEqual({
      status: "unavailable",
      reason_code: "handoff_unavailable",
    });

    const liveSource = createNurtureUserAttentionHttpSource({
      baseUrl: ownerBaseUrl,
      serviceToken: SERVICE_TOKEN,
    });
    const liveHandler = createWorkflowHandoffOwnerHandler({
      ledger,
      owners: [
        createNurtureUserAttentionOwner({
          source: liveSource,
          notificationRepository,
        }),
      ],
    });
    await liveHandler.handle(requested!);
    await expect(
      ledger.get({ workspace_id: workspaceId, handoff_id: handoffId }),
    ).resolves.toMatchObject({ status: "completed", aggregate_version: 2 });
    await expect(
      myChat.notification.count({ where: { workspaceId } }),
    ).resolves.toBe(1);
    await expect(
      resolveNurtureDashboardItem({
        ledger,
        source: liveSource,
        workspace_id: workspaceId,
        handoff_id: handoffId,
        actor_user_id: fixture.caregiver.myChatUserId,
      }),
    ).resolves.toMatchObject({
      status: "ready",
      handoff_id: handoffId,
      item: { presentation_type: "nurture_attention_v1" },
    });
  });

  it("fails closed at materialization when the run contract hash is not pinned", async () => {
    const workspaceId = `x5-contract-mismatch-${randomUUID()}`;
    const mismatchedContractHash = "c".repeat(64);
    const { host, runtime, lease, executed } = await seedAndExecuteFamilyInput({
      nurture,
      myChat,
      workspaceId,
      contractHash: mismatchedContractHash,
    });

    const completion = await runtime.complete_step(
      completionInput(host, executed, lease),
    );
    expect(completion.data).toMatchObject({
      status: "manual_review_required",
      materialized_handoffs: [],
    });
    const replayed = await runtime.complete_step(
      completionInput(host, executed, lease),
    );
    expect(replayed).toEqual(completion);

    const stepEvent = await myChat.outboxEvent.findFirstOrThrow({
      where: { workspaceId, aggregateType: "workflow_step" },
    });
    expect(stepEvent.payload).toMatchObject({
      reason_code: "workflow_handoff_contract_unavailable",
    });
    await expect(
      myChat.outboxEvent.count({
        where: { workspaceId, eventType: "workflow.handoff.requested" },
      }),
    ).resolves.toBe(0);
    await expect(
      myChat.workflowHandoff.count({ where: { workspaceId } }),
    ).resolves.toBe(0);
    await expect(
      myChat.notification.count({ where: { workspaceId } }),
    ).resolves.toBe(0);
    await expect(
      nurture.nurtureFamilyCareMessage.count({ where: { workspaceId } }),
    ).resolves.toBe(1);
  });

  it("rejects stale claim confirmations and stale step heads without corrupting the step", async () => {
    const workspaceId = `x5-stale-${randomUUID()}`;
    const { host, runtime, lease, executed } = await seedAndExecuteFamilyInput({
      nurture,
      myChat,
      workspaceId,
    });

    const unknown = await runtime.fail_step({
      run_id: host.runId,
      step_id: host.stepId,
      expected_version: lease.aggregate_version,
      reason_code: "workflow_handler_outcome_unknown",
      retryable: true,
      meta: commandMeta(host),
    });
    const admin = new PrismaAdminWorkflowRecoveryRepository(myChat);
    const reconciliation = await admin.reconcileWorkflowStep({
      workspaceId,
      actorId: "admin-actor",
      runId: host.runId,
      stepId: host.stepId,
      expectedVersion: unknown.data.aggregate_version,
      idempotencyKey: `reconcile:${host.stepId}`,
      correlationId: `correlation:${host.stepId}`,
    });

    await expect(
      runtime.claim_step({
        run_id: host.runId,
        step_id: host.stepId,
        expected_version: lease.aggregate_version,
        worker_id: "x5-worker-stale-head",
        meta: commandMeta(host),
      }),
    ).rejects.toMatchObject({ code: "workflow_step_version_conflict" });

    const reclaimed = await runtime.claim_step({
      run_id: host.runId,
      step_id: host.stepId,
      expected_version: reconciliation.aggregateVersion,
      worker_id: "x5-worker-current",
      meta: commandMeta(host),
    });

    await expect(
      runtime.complete_step({
        ...completionInput(host, executed, lease),
        expected_version: reclaimed.aggregate_version,
      }),
    ).rejects.toMatchObject({ code: "workflow_step_claim_invalid" });
    await expect(
      runtime.complete_step(completionInput(host, executed, lease)),
    ).rejects.toMatchObject({ code: "workflow_step_version_conflict" });

    await expect(
      myChat.workflowStep.findUniqueOrThrow({ where: { id: host.stepId } }),
    ).resolves.toMatchObject({
      status: "claimed",
      aggregateVersion: reclaimed.aggregate_version,
    });
    await expect(
      myChat.outboxEvent.count({
        where: { workspaceId, eventType: "workflow.handoff.requested" },
      }),
    ).resolves.toBe(0);

    const completion = await runtime.complete_step(
      completionInput(host, executed, reclaimed),
    );
    expect(completion.data).toMatchObject({ status: "completed" });
    expect(completion.data.materialized_handoffs).toHaveLength(1);
  });
});

type NurtureClient = ReturnType<typeof createNurturePrismaClient>;

async function seedNurtureFixture(
  prisma: NurtureClient,
  workspaceId: string,
) {
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
    data: { workspaceId, displayName: "Child", status: "active" },
  });
  const process = await prisma.nurtureChildCareProcess.create({
    data: { workspaceId, childId: child.id, status: "active" },
  });
  const family = await prisma.nurtureFamily.create({
    data: {
      workspaceId,
      childCareProcessId: process.id,
      displayName: "Family",
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
      participationPhase: "formal",
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
}

async function seedMyChatFixture(
  prisma: ReturnType<typeof createMyChatPrismaClient>,
  workspaceId: string,
  contractHash: string = CONTRACT_HASH,
) {
  const suffix = randomUUID();
  const runId = `x5-joint-run-${suffix}`;
  const stepId = `x5-joint-step-${suffix}`;
  const otherStepId = `x5-joint-step-other-${suffix}`;
  // The T-042 hardening only notifies active members of the exact workspace,
  // so the caregiver recipient the Nurture owner resolves must exist here.
  await prisma.workspace.create({
    data: { id: workspaceId, name: `x5 joint ${suffix}`, type: "organization" },
  });
  await prisma.user.create({ data: { id: `caregiver:${workspaceId}` } });
  await prisma.membership.create({
    data: {
      userId: `caregiver:${workspaceId}`,
      workspaceId,
      role: "member",
    },
  });
  await prisma.workflowRun.create({
    data: {
      id: runId,
      workspaceId,
      scenarioKey: "nurture",
      contractHash,
      capabilityKey: "class_family_inbox",
      entrypointKey: "capture_family_input",
      registryWorkflowVersionId: "nurture-class-family-inbox-v2",
      status: "running",
    },
  });
  await prisma.workflowStep.createMany({
    data: [
      {
        id: stepId,
        runId,
        stepKey: "capture_family_input",
        stepOrder: 0,
        status: "pending",
        maxAttempts: 1,
        aggregateVersion: 1,
      },
      {
        id: otherStepId,
        runId,
        stepKey: "capture_family_input_other",
        stepOrder: 1,
        status: "pending",
        maxAttempts: 1,
        aggregateVersion: 1,
      },
    ],
  });
  return { workspaceId, runId, stepId, otherStepId };
}

function familyInputPayload(
  fixture: Awaited<ReturnType<typeof seedNurtureFixture>>,
): FamilyInputRoutePayload {
  return {
    participant_id: fixture.guardian.id,
    role_assignment_id: fixture.guardianRole.id,
    child_care_process_id: fixture.process.id,
    family_id: fixture.family.id,
    enrollment_id: fixture.enrollment.id,
    care_group_id: fixture.group.id,
    thread_id: fixture.thread.id,
    data_class: "family_care_question",
    category: "question",
    urgency: "today_attention",
    safe_summary: "X5 private pickup plan",
    protected_content_ref: familyCareRef(
      "protected_message_content",
      `content:${fixture.workspaceId}`,
      1,
    ),
    attachment_refs: [],
    source_surface: "mobile",
    routing_attempt_key: `route:${fixture.workspaceId}`,
    route_mode: "immediate",
    requires_ack: true,
    requires_reply: true,
  };
}

function activation(
  stepId: string,
  claimToken: string,
  expectedStepVersion: number,
  contractHash: string = CONTRACT_HASH,
): NurtureCommandHandoffActivation {
  return {
    request_id: "x5-user-attention-request",
    driver_context: {
      driverRef: {
        schema_version: 1,
        namespace: "my_chat",
        object_type: "workflow_step",
        object_id: stepId,
      },
      contractHash,
      capabilityKey: "class_family_inbox",
      entrypointKey: "capture_family_input",
      claimToken,
      expectedStepVersion,
    },
  };
}

function commandMeta(input: {
  workspaceId: string;
  runId: string;
  stepId: string;
}): WorkflowCommandMeta {
  return {
    workspace_id: input.workspaceId,
    idempotency_key: `${input.runId}:${input.stepId}`,
    correlation_id: `correlation:${input.stepId}`,
    client_surface: "worker_runtime",
  };
}

function createPinnedRuntime(
  client: ReturnType<typeof createMyChatPrismaClient>,
): PrismaWorkflowRuntimePort {
  return new PrismaWorkflowRuntimePort(client, {
    claimSigningKey: CLAIM_SIGNING_KEY,
    leaseDurationMs: 60_000,
    resolvePinnedHandoffContract: ({ scenario_key, contract_hash }) =>
      scenario_key === "nurture" && contract_hash === CONTRACT_HASH
        ? {
            scenario_key: "nurture",
            contract_hash: CONTRACT_HASH,
            handoffs: [handoffDeclaration()],
          }
        : undefined,
  });
}

type JointLease = Awaited<ReturnType<PrismaWorkflowRuntimePort["claim_step"]>>;

async function seedAndExecuteFamilyInput(input: {
  nurture: NurtureClient;
  myChat: ReturnType<typeof createMyChatPrismaClient>;
  workspaceId: string;
  contractHash?: string;
}) {
  const contractHash = input.contractHash ?? CONTRACT_HASH;
  const fixture = await seedNurtureFixture(input.nurture, input.workspaceId);
  const host = await seedMyChatFixture(
    input.myChat,
    input.workspaceId,
    contractHash,
  );
  const runtime = createPinnedRuntime(input.myChat);
  const runner = new NurtureCommandRunner(
    createNurtureRepositories(input.nurture).commands,
  );
  const lease = await runtime.claim_step({
    run_id: host.runId,
    step_id: host.stepId,
    expected_version: 1,
    worker_id: `x5-worker-${input.workspaceId}`,
    meta: commandMeta(host),
  });
  const result = await runner.execute({
    workspace_id: input.workspaceId,
    invocation_request_id: `invocation:${host.stepId}`,
    command_request_id: `command:${host.stepId}`,
    business_actor_ref: fixture.guardian.id,
    child_care_process_id: fixture.process.id,
    handoff_activation: activation(
      host.stepId,
      lease.claim_token,
      lease.aggregate_version,
      contractHash,
    ),
    payload: familyInputPayload(fixture),
    spec: familyInputRouteSpec,
  });
  if (result.status !== "ok") {
    throw new Error(
      `Nurture command did not commit: ${JSON.stringify(result)}`,
    );
  }
  return { fixture, host, runtime, runner, lease, executed: result };
}

type ExecutedFamilyInput = Awaited<
  ReturnType<typeof seedAndExecuteFamilyInput>
>["executed"];

function completionInput(
  host: { workspaceId: string; runId: string; stepId: string },
  executed: ExecutedFamilyInput,
  lease: JointLease,
) {
  return {
    completion_contract_version: 1 as const,
    run_id: host.runId,
    step_id: host.stepId,
    expected_version: lease.aggregate_version,
    claim_token: lease.claim_token,
    status: "completed" as const,
    output_refs: [
      {
        schema_version: 1 as const,
        namespace: "nurture",
        object_type: "command_execution",
        object_id: executed.execution_ref.object_id,
        version: executed.execution_ref.version,
      },
    ],
    handoff_drafts: createWorkflowHandoffDraftsFromScenarioSnapshots(
      executed.handoff_request_snapshots,
    ),
    meta: commandMeta(host),
  };
}

async function closedPortBaseUrl(): Promise<string> {
  const probe = createServer();
  await new Promise<void>((resolve, reject) => {
    probe.once("error", reject);
    probe.listen(0, "127.0.0.1", resolve);
  });
  const { port } = probe.address() as AddressInfo;
  await new Promise<void>((resolve, reject) => {
    probe.close((error) => (error ? reject(error) : resolve()));
  });
  return `http://127.0.0.1:${port}`;
}

function handoffDeclaration(): HandoffManifest {
  return {
    handoff_key: "user_attention",
    handoff_type: "notification",
    source_artifact_types: [],
    source_context_ref_types: [
      { namespace: "nurture", object_type: "family_care_message" },
      { namespace: "nurture", object_type: "child_link_receipt" },
      { namespace: "nurture", object_type: "family_care_item" },
    ],
    requested_purposes: ["user_attention"],
    downstream_owner: "user_attention",
    policy_key: "nurture.can_request_user_attention",
    receipt_required: true,
    materialization_mode: "workflow_step_complete_v1",
  };
}
