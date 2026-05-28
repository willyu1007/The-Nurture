import type { DomainContextRef, WorkflowCommandMeta, WorkflowStepHandlerInput } from "../../src/types.js";

export const familyContextRef: DomainContextRef = {
  namespace: "my_chat",
  consumer_scenario_key: "nurture",
  object_type: "family",
  object_id: "family-demo",
  version: 1,
  owner_scope: "workspace",
  canonical_ref: {
    service: "my_chat",
    object_type: "family",
    object_id: "family-demo",
  },
};

export const nurtureCommandMeta: WorkflowCommandMeta = {
  workspace_id: "workspace-demo",
  actor_id: "actor-demo",
  idempotency_key: "nurture-demo-idempotency",
  correlation_id: "nurture-demo-correlation",
  client_surface: "web_run_workbench",
};

export const activityComparisonStepInput: WorkflowStepHandlerInput = {
  run_id: "run-demo",
  step_id: "step-compare-activities",
  step_key: "compare_activities",
  expected_step_version: 1,
  scenario_key: "nurture",
  capability_key: "activity_comparison",
  entrypoint_key: "compare_activity_options",
  workflow_version_id: "nurture-activity-comparison-v1",
  contract_hash: "local-stage-c-scaffold",
  meta: nurtureCommandMeta,
};
