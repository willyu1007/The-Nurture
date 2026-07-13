import type {
  CanonicalRef,
  WorkflowActionHandler,
  WorkflowActionRegistry,
  WorkflowCommandResponse,
  WorkflowRunRef,
  WorkflowStepHandlerInput,
} from "@my-chat/workflow-contracts";

const runRef = (input: WorkflowStepHandlerInput, status: string): WorkflowRunRef => ({
  run_id: input.run_id,
  scenario_key: input.scenario_key,
  capability_key: input.capability_key,
  entrypoint_key: input.entrypoint_key,
  workflow_version_id: input.workflow_version_id,
  status,
  aggregate_version: input.expected_step_version ?? 1,
});

const canonicalRunRef = (input: WorkflowStepHandlerInput): CanonicalRef => ({
  kind: "workflow_run",
  id: input.run_id,
  version: input.expected_step_version,
});

const actionResponse = (
  input: WorkflowStepHandlerInput & { action: string; expected_version: number },
  status: string,
): WorkflowCommandResponse<WorkflowRunRef> => ({
  ok: true,
  data: runRef(input, status),
  canonical_refs: [canonicalRunRef(input)],
  aggregate_versions: { [input.run_id]: input.expected_version },
  action_availability: [
    {
      action: input.action,
      available: false,
      reason_code: "action_already_recorded",
      target_type: "workflow_run",
      target_id: input.run_id,
      expected_version: input.expected_version,
    },
  ],
  outbox_event_ids: [`${input.meta.idempotency_key}:${input.action}`],
});

// Scenario-specific action handlers. The host validator (WF-MAN-011) requires
// every manifest `action_availability.scenario_actions` key to resolve to a
// handler registered here under that exact key. Shared actions (approve,
// reject, confirm, retry, cancel, ...) are handled generically by the host
// runtime and are not part of this scenario action registry.
export const adjustActivityWeightsAction: WorkflowActionHandler = async (input) =>
  actionResponse(input, "intervention_recorded");
export const updateCareConstraintsAction: WorkflowActionHandler = async (input) =>
  actionResponse(input, "intervention_recorded");
export const markHealthSafetyEscalatedAction: WorkflowActionHandler = async (input) =>
  actionResponse(input, "safety_escalated");
export const attachNurtureProfileSnapshotAction: WorkflowActionHandler = async (input) =>
  actionResponse(input, "profile_attached");

export const nurtureActions: WorkflowActionRegistry = {
  adjust_activity_weights: adjustActivityWeightsAction,
  update_care_constraints: updateCareConstraintsAction,
  mark_health_safety_escalated: markHealthSafetyEscalatedAction,
  attach_nurture_profile_snapshot: attachNurtureProfileSnapshotAction,
};
