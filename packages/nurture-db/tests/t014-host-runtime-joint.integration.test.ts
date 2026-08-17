import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import type { WorkflowHostValidationSnapshot } from "@my-chat/workflow-contracts";
import { standardWorkflowEvents } from "@my-chat/workflow-contracts";
import {
  createRegistryHandoffContractResolver,
  loadWorkflowRegistry,
  WorkflowWorker,
  type WorkflowRegistry,
  type WorkflowWorkerPayload,
} from "@my-chat/workflow-runtime";
import {
  createPrismaClient as createMyChatPrismaClient,
  PrismaWorkflowRunBindingVerifier,
  PrismaWorkflowRuntimePort,
} from "@my-chat/db";
import {
  createNurtureScenarioModule,
  defaultNurtureDeps,
  defaultPresenterDeps,
} from "@the-nurture/scenario";
import {
  createNurtureRepositories,
  createPrismaClient as createNurturePrismaClient,
} from "../src/index.js";

// T-014 Wave 3 — owner-boundary equivalents for the legacy host's run/step
// journeys, proven on the REAL My-Chat workflow kernel (real schema, real
// PrismaWorkflowRuntimePort, real WorkflowWorker, real run-binding verifier)
// with the real Nurture module registered through the real host validator.
//
// What the real kernel proves today (P0 handlers draft no standard
// workflow.* events — host-owned events are kernel-emitted; a scenario draft
// of one is rejected as `workflow_handoff_standard_event_forgery`):
//   1. a request_approval step pauses VERBATIM: manual_review_required with
//      reasonCode null (the step row's reasonCode only ever carries kernel
//      defect codes), the run stays running, and the kernel emits its own
//      workflow.step.manual_review_required outbox event (the approval-pause
//      leg of the legacy approval-pause-resume e2e);
//   2. write_artifact completes cleanly: step status `succeeded` with the
//      kernel-emitted workflow.step.completed event — the step whose handler
//      once only drafted a standard event now proves the clean path;
//   3. a step whose handler emits artifact_drafts fail-closes with
//      `workflow_step_materialization_requires_future_kernel` while the
//      Nurture business write still lands on the Nurture database — pinning
//      exactly why the artifact legs of thin-vertical / first-slice cannot
//      leave the harness until My-Chat ships step materialization.
// Approve/reject resolution and run-completion scheduling are host actions
// owned by My-Chat's api/dispatcher and are out of scope here by design.

const NURTURE_DATABASE_URL = process.env.X5_NURTURE_DATABASE_URL;
const MY_CHAT_DATABASE_URL = process.env.X5_MY_CHAT_DATABASE_URL;
if (!NURTURE_DATABASE_URL || !MY_CHAT_DATABASE_URL) {
  throw new Error(
    "X5_NURTURE_DATABASE_URL and X5_MY_CHAT_DATABASE_URL are required for the T-014 joint suite.",
  );
}

const nurture = createNurturePrismaClient(NURTURE_DATABASE_URL);
const previousDatabaseUrl = process.env.DATABASE_URL;
process.env.DATABASE_URL = MY_CHAT_DATABASE_URL;
const myChat = createMyChatPrismaClient();
if (previousDatabaseUrl === undefined) delete process.env.DATABASE_URL;
else process.env.DATABASE_URL = previousDatabaseUrl;

const CLAIM_SIGNING_KEY = "t014-host-runtime-joint-signing-key-32b";

// Mirrors the scenario package conformance snapshot: everything the real
// validateWorkflowModule requires to register the nurture module at "dev".
const hostSnapshot: WorkflowHostValidationSnapshot = {
  scenario_records: { nurture: { status: "draft" } },
  domain_resolver_keys: [
    "my_chat.object.child",
    "my_chat.object.expectant_mother",
    "my_chat.object.family",
    "my_chat.object.parent",
    "nurture.profile",
    "nurture.activity_option",
    "nurture.health_state_summary",
  ],
  downstream_owners: [
    "my_chat.forum",
    "my_chat.knowledge_base",
    "my_chat.notification",
    "user_attention",
  ],
  standard_events: [...standardWorkflowEvents],
  platform_events: [],
  allowed_surfaces: [
    "chat_workflow_control",
    "chat_dashboard_summary",
    "chat_citation",
    "web_domain_workbench",
    "web_run_workbench",
    "mobile_dashboard",
    "forum_publication",
    "rag_knowledge",
    "notification_push",
    "admin_operator",
    "worker_runtime",
  ],
  projection_reviews: [],
  host_capabilities: [
    "scenario_federation_v1",
    "workflow_handoff_materialization_v1",
    "trusted_scenario_invocation_v1",
    "scenario_subject_presentation_v1",
  ],
};

// Same assembly as @my-chat/workers createWorkflowStepKernel, unrolled only
// because the module needs the runtime port before the registry exists; the
// handoff-contract resolver closes over the registry lazily instead.
let registry: WorkflowRegistry;
const runtimePort = new PrismaWorkflowRuntimePort(myChat, {
  claimSigningKey: CLAIM_SIGNING_KEY,
  leaseDurationMs: 60_000,
  resolvePinnedHandoffContract: (input) =>
    createRegistryHandoffContractResolver(registry)(input),
});
// Real Nurture repositories on the real Nurture database; canonical objects
// stay synthetic because canonical data is My-Chat-owned and out of scope.
const repositories = createNurtureRepositories(nurture);
const module = createNurtureScenarioModule({
  handlerDeps: { ...defaultNurtureDeps, repositories },
  presenterDeps: defaultPresenterDeps,
  workerRuntime: runtimePort,
});
registry = loadWorkflowRegistry({ modules: [module], host_snapshot: hostSnapshot });
const scenario = registry.scenarios.get("nurture");
if (!scenario) throw new Error("nurture scenario failed to register on the real host validator");
const worker = new WorkflowWorker(
  registry,
  runtimePort,
  new PrismaWorkflowRunBindingVerifier(myChat),
);

afterAll(async () => {
  await Promise.all([nurture.$disconnect(), myChat.$disconnect()]);
});

type SeededStep = {
  workspaceId: string;
  runId: string;
  stepId: string;
  payload: WorkflowWorkerPayload;
};

async function seedRunWithStep(input: {
  capabilityKey: string;
  entrypointKey: string;
  workflowVersionId: string;
  stepKey: string;
  stepOrder: number;
  handlerKey: string;
}): Promise<SeededStep> {
  const suffix = randomUUID();
  const workspaceId = `t014-joint-${suffix}`;
  const runId = `t014-run-${suffix}`;
  const stepId = `t014-step-${suffix}`;
  await myChat.workspace.create({
    data: { id: workspaceId, name: `t014 joint ${suffix}`, type: "organization" },
  });
  await myChat.workflowRun.create({
    data: {
      id: runId,
      workspaceId,
      scenarioKey: "nurture",
      contractHash: scenario!.contract_hash,
      capabilityKey: input.capabilityKey,
      entrypointKey: input.entrypointKey,
      registryWorkflowVersionId: input.workflowVersionId,
      status: "running",
    },
  });
  await myChat.workflowStep.create({
    data: {
      id: stepId,
      runId,
      stepKey: input.stepKey,
      stepOrder: input.stepOrder,
      status: "pending",
      maxAttempts: 3,
      aggregateVersion: 1,
    },
  });
  return {
    workspaceId,
    runId,
    stepId,
    payload: {
      workspace_id: workspaceId,
      run_id: runId,
      step_id: stepId,
      expected_step_version: 1,
      scenario_key: "nurture",
      capability_key: input.capabilityKey,
      entrypoint_key: input.entrypointKey,
      workflow_version_id: input.workflowVersionId,
      step_key: input.stepKey,
      handler_key: input.handlerKey,
      contract_hash: scenario!.contract_hash,
      worker_id: "t014-joint-worker",
      correlation_id: runId,
    },
  };
}

const stepRow = (stepId: string) =>
  myChat.workflowStep.findUniqueOrThrow({ where: { id: stepId } });

const outboxEventTypes = async (workspaceId: string): Promise<Set<string>> => {
  const events = await myChat.outboxEvent.findMany({ where: { workspaceId } });
  return new Set(events.map((event) => event.eventType));
};

describe("T-014 host-runtime joint equivalence (real My-Chat kernel)", () => {
  it("pauses a request_approval step as manual_review_required on the real kernel", async () => {
    const seed = await seedRunWithStep({
      capabilityKey: "family_strategy",
      entrypointKey: "calibrate_family_strategy",
      workflowVersionId: "nurture-family-strategy-v1",
      stepKey: "request_approval",
      stepOrder: 30,
      handlerKey: "nurture.request_approval",
    });
    await worker.run(seed.payload);

    const step = await stepRow(seed.stepId);
    expect(step.status).toBe("manual_review_required");
    // Verbatim pause: reasonCode only ever carries kernel defect codes, and
    // the cleaned handler trips none.
    expect(step.reasonCode).toBeNull();
    const run = await myChat.workflowRun.findUniqueOrThrow({ where: { id: seed.runId } });
    expect(run.status).toBe("running");

    const events = await outboxEventTypes(seed.workspaceId);
    expect(events.has("workflow.step.manual_review_required")).toBe(true);
  });

  it("completes a write_artifact step cleanly on the real kernel", async () => {
    const seed = await seedRunWithStep({
      capabilityKey: "family_strategy",
      entrypointKey: "calibrate_family_strategy",
      workflowVersionId: "nurture-family-strategy-v1",
      stepKey: "write_artifact",
      stepOrder: 40,
      handlerKey: "nurture.write_artifact",
    });
    await worker.run(seed.payload);

    const step = await stepRow(seed.stepId);
    expect(step.status).toBe("succeeded");
    expect(step.reasonCode).toBeNull();

    // Host events are kernel-emitted, never scenario-drafted: the kernel's
    // own completion event lands and no fail-closed review event exists.
    const events = await outboxEventTypes(seed.workspaceId);
    expect(events.has("workflow.step.completed")).toBe(true);
    expect(events.has("workflow.step.manual_review_required")).toBe(false);
  });

  it("fail-closes artifact materialization with the future-kernel defect while the Nurture business write lands", async () => {
    const seed = await seedRunWithStep({
      capabilityKey: "family_strategy",
      entrypointKey: "calibrate_family_strategy",
      workflowVersionId: "nurture-family-strategy-v1",
      stepKey: "calibrate_family_strategy",
      stepOrder: 20,
      handlerKey: "nurture.calibrate_family_strategy",
    });
    // The real Nurture project row the handler persists into, bound to the
    // real host run — both legs of the two-database journey are live.
    const project = await nurture.nurtureWorkflowProject.create({
      data: {
        workspaceId: seed.workspaceId,
        familyRefKey: `${seed.workspaceId}:family`,
        familyRef: { service: "my_chat", object_type: "family", object_id: `${seed.workspaceId}:family` },
        templateKey: "family_rule_trial",
        issueType: "bedtime",
        status: "confirmed",
        workflowRunId: seed.runId,
      },
    });

    await worker.run(seed.payload);

    // Nurture leg: the strategy payloads were persisted by the real handler.
    const updated = await nurture.nurtureWorkflowProject.findUniqueOrThrow({
      where: { id: project.id },
    });
    expect(updated.goalPayload).not.toBeNull();
    expect(updated.constraintPayload).not.toBeNull();

    // Host leg: the real kernel refuses step materialization today and
    // fail-closes to manual review with the exact future-kernel defect.
    const step = await stepRow(seed.stepId);
    expect(step.status).toBe("manual_review_required");
    expect(step.reasonCode).toBe("workflow_step_materialization_requires_future_kernel");

    const events = await outboxEventTypes(seed.workspaceId);
    expect(events.has("workflow.step.manual_review_required")).toBe(true);
  });
});
