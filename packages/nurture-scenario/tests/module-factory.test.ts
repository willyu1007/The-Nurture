import { describe, expect, it } from "vitest";
import type {
  WorkflowHostValidationSnapshot,
  WorkflowRuntimePort,
  WorkflowRuntimePortMaterializationV1,
} from "@my-chat/workflow-contracts";
import { standardWorkflowEvents } from "@my-chat/workflow-contracts";
import { loadWorkflowRegistry, validateWorkflowModule } from "@my-chat/workflow-runtime";
import {
  createNurtureActivationScenarioModule,
  createNurtureScenarioModule,
} from "../src/module.js";
import { defaultNurtureDeps, defaultPresenterDeps } from "../src/deps.js";

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
  downstream_owners: ["my_chat.forum", "my_chat.knowledge_base", "my_chat.notification"],
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
};

// A no-op runtime port standing in for the host's Postgres implementation.
const fakeRuntimePort: WorkflowRuntimePort = {
  claim_step: async (i) => ({
    run_id: i.run_id,
    step_id: i.step_id,
    step_key: "x",
    claim_token: "t",
    aggregate_version: i.expected_version + 1,
    expires_at: new Date(0).toISOString(),
  }),
  complete_step: async (i) => ({
    ok: true,
    data: { run_id: i.run_id, step_id: i.step_id, status: i.status ?? "completed", aggregate_version: i.expected_version + 1, output_refs: i.output_refs },
    canonical_refs: [],
    aggregate_versions: {},
    action_availability: [],
    outbox_event_ids: [],
  }),
  fail_step: async (i) => ({
    ok: true,
    data: { run_id: i.run_id, step_id: i.step_id, status: "failed", aggregate_version: i.expected_version + 1, output_refs: [] },
    canonical_refs: [],
    aggregate_versions: {},
    action_availability: [],
    outbox_event_ids: [],
  }),
};

describe("createNurtureScenarioModule(deps)", () => {
  const module = createNurtureScenarioModule({
    handlerDeps: defaultNurtureDeps,
    presenterDeps: defaultPresenterDeps,
    workerRuntime: fakeRuntimePort,
  });

  it("injects the host runtime port as worker_runtime", () => {
    expect(module.adapters.worker_runtime).toBe(fakeRuntimePort);
  });

  it("passes the real My-Chat validator and registers", () => {
    const report = validateWorkflowModule({ module, host_snapshot: hostSnapshot, activation_target: module.manifest.launch_phase });
    expect(report.findings.filter((f) => f.severity === "fatal")).toEqual([]);
    expect(report.passed).toBe(true);

    const registry = loadWorkflowRegistry({ modules: [module], host_snapshot: hostSnapshot });
    expect(registry.scenarios.get("nurture")).toBeDefined();
  });
});

describe("createNurtureActivationScenarioModule(deps)", () => {
  it("requires and advertises the vNext materialization composition", () => {
    const activationRuntime = fakeRuntimePort as WorkflowRuntimePortMaterializationV1;
    const module = createNurtureActivationScenarioModule({
      handlerDeps: {
        ...defaultNurtureDeps,
        scenarioCommandBridge: {
          createDriverContext: () => ({
            driverRef: {
              namespace: "host.workflow",
              object_type: "workflow_step",
              object_id: "step-1",
              owner_scope: "workspace",
            },
            contractHash: "a".repeat(64),
            capabilityKey: "class_family_inbox",
            entrypointKey: "capture_family_input",
            claimToken: "claim",
            expectedStepVersion: 1,
          }),
          createHandoffDrafts: () => [],
        },
        familyInputWorkflow: { resolveCommand: async () => null },
      },
      presenterDeps: defaultPresenterDeps,
      workerRuntime: activationRuntime,
    });
    const activationHost: WorkflowHostValidationSnapshot = {
      ...hostSnapshot,
      downstream_owners: [...hostSnapshot.downstream_owners, "user_attention"],
      host_capabilities: ["workflow_handoff_materialization_v1"],
    };
    const report = validateWorkflowModule({
      module,
      host_snapshot: activationHost,
      activation_target: module.manifest.launch_phase,
    });
    expect(report.findings.filter((finding) => finding.severity === "fatal")).toEqual([]);
    expect(module.manifest.handoffs).toContainEqual(
      expect.objectContaining({
        handoff_key: "user_attention",
        materialization_mode: "workflow_step_complete_v1",
      }),
    );
    expect(
      module.manifest.capabilities
        .find((capability) => capability.capability_key === "class_family_inbox")
        ?.entrypoints.map((entrypoint) => entrypoint.entrypoint_key),
    ).toContain("capture_family_input");
  });

  it("fails validation when the host capability is absent", () => {
    const module = createNurtureActivationScenarioModule({
      handlerDeps: {
        ...defaultNurtureDeps,
        scenarioCommandBridge: {
          createDriverContext: () => {
            throw new Error("unused");
          },
          createHandoffDrafts: () => [],
        },
        familyInputWorkflow: { resolveCommand: async () => null },
      },
      presenterDeps: defaultPresenterDeps,
      workerRuntime: fakeRuntimePort as WorkflowRuntimePortMaterializationV1,
    });
    const report = validateWorkflowModule({
      module,
      host_snapshot: {
        ...hostSnapshot,
        downstream_owners: [...hostSnapshot.downstream_owners, "user_attention"],
      },
      activation_target: module.manifest.launch_phase,
    });
    expect(report.findings).toContainEqual(
      expect.objectContaining({ rule_id: "WF-MAN-046", severity: "fatal" }),
    );
  });
});
