import { describe, expect, it } from "vitest";
import type { WorkflowHostValidationSnapshot } from "@my-chat/workflow-contracts";
import { standardWorkflowEvents } from "@my-chat/workflow-contracts";
import { loadWorkflowRegistry, validateWorkflowModule } from "@my-chat/workflow-runtime";
import { nurtureScenarioModule } from "../src/module.js";

// A dev-phase host snapshot that declares everything the real My-Chat module
// validator (validateWorkflowModule) requires for the nurture scenario.
// This is the same validator the host runs at registration time; passing it
// proves the module is acceptable to the real host without any local shims.
const hostSnapshot: WorkflowHostValidationSnapshot = {
  scenario_records: {
    // status must equal manifest.scenario_record.required_status ("draft").
    // current_manifest_hash is intentionally omitted so WF-MAN-003 cannot
    // fail on a stale pinned hash (the validator computes it from the module).
    nurture: { status: "draft" },
  },
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

describe("nurture scenario module conformance", () => {
  it("passes the real My-Chat module validator", () => {
    const report = validateWorkflowModule({
      module: nurtureScenarioModule,
      host_snapshot: hostSnapshot,
      activation_target: nurtureScenarioModule.manifest.launch_phase,
    });

    expect(report.findings.filter((f) => f.severity === "fatal")).toEqual([]);
    expect(report.passed).toBe(true);
    expect(report.scenario_key).toBe("nurture");
  });

  it("registers into a host workflow registry", () => {
    const registry = loadWorkflowRegistry({
      modules: [nurtureScenarioModule],
      host_snapshot: hostSnapshot,
    });

    const scenario = registry.scenarios.get("nurture");
    expect(scenario).toBeDefined();
    expect(scenario?.contract_hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("keeps the health-safety escalation event off every shared consumer (routing invariant)", () => {
    const SCENARIO_INTERNAL = "nurture.health_state.safety_escalated";
    const { consumers, scenario_internal_events } = nurtureScenarioModule.manifest.event_registry;
    // It must be declared scenario-internal, and never delivered to a shared consumer.
    expect(scenario_internal_events).toContain(SCENARIO_INTERNAL);
    for (const shared of ["my_chat.chat", "my_chat.forum", "my_chat.knowledge_base", "my_chat.notification"]) {
      const c = consumers[shared];
      expect(c, `${shared} consumer must exist`).toBeDefined();
      expect(c?.allowed_events ?? []).not.toContain(SCENARIO_INTERNAL);
      expect(c?.forbidden_events ?? []).toContain(SCENARIO_INTERNAL);
    }
  });
});
