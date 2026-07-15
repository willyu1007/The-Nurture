import { randomUUID } from "node:crypto";
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
import { buildServer } from "../../../apps/backend/src/server.js";
import type { NurtureApp } from "../../../apps/backend/src/app.js";
import {
  createPrismaClient as createMyChatPrismaClient,
  PrismaAdminWorkflowRecoveryRepository,
  PrismaNotificationRepository,
  PrismaOutboxRepository,
  PrismaWorkflowHandoffRepository,
  PrismaWorkflowRuntimePort,
} from "../../../../My-Chat/packages/db/src/index.js";
import {
  createWorkflowHandoffDraftsFromScenarioSnapshots,
} from "../../../../My-Chat/packages/workflow-runtime/src/index.js";
import {
  createNurtureUserAttentionHttpSource,
  createNurtureUserAttentionOwner,
  resolveNurtureAttentionOpen,
} from "../../../../My-Chat/apps/workers/src/nurture-user-attention-owner.js";
import {
  createWorkflowHandoffOwnerHandler,
} from "../../../../My-Chat/apps/workers/src/workflow-handoff-owner.js";

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
  let ownerServer: ReturnType<typeof buildServer>;

  beforeAll(async () => {
    process.env.DATABASE_URL = MY_CHAT_DATABASE_URL;
    myChat = createMyChatPrismaClient();
    const owner = new NurtureUserAttentionService(
      new PrismaUserAttentionRepository(nurture),
    );
    ownerServer = buildServer(
      {
        resolveUserAttention: (input) => owner.resolve(input),
      } as NurtureApp,
      { internalServiceToken: SERVICE_TOKEN },
    );
    ownerBaseUrl = await ownerServer.listen({ host: "127.0.0.1", port: 0 });
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
    const runtime = new PrismaWorkflowRuntimePort(myChat, {
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
          kind: "domain_context_ref" as const,
          id: `nurture:command_execution:${replay.execution_ref.object_id}`,
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

    const handoffId = completion.data.materialized_handoffs[0]!.handoff_ref.id;
    const handoff = await ledger.get({
      workspace_id: workspaceId,
      handoff_id: handoffId,
    });
    expect(handoff).toMatchObject({ status: "completed", aggregate_version: 2 });
    await expect(
      myChat.notification.count({ where: { workspaceId } }),
    ).resolves.toBe(1);
    await expect(
      resolveNurtureAttentionOpen({
        ledger,
        source,
        workspace_id: workspaceId,
        handoff_id: handoffId,
        actor_user_id: fixture.caregiver.myChatUserId,
      }),
    ).resolves.toEqual({
      status: "ready",
      route_key: "teacher_attention_board",
      handoff_id: handoffId,
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
      resolveNurtureAttentionOpen({
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
) {
  const suffix = randomUUID();
  const runId = `x5-joint-run-${suffix}`;
  const stepId = `x5-joint-step-${suffix}`;
  const otherStepId = `x5-joint-step-other-${suffix}`;
  await prisma.workflowRun.create({
    data: {
      id: runId,
      workspaceId,
      scenarioKey: "nurture",
      contractHash: CONTRACT_HASH,
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
): NurtureCommandHandoffActivation {
  return {
    request_id: "x5-user-attention-request",
    driver_context: {
      driverRef: {
        namespace: "host.workflow",
        object_type: "workflow_step",
        object_id: stepId,
        owner_scope: "workspace",
      },
      contractHash: CONTRACT_HASH,
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
