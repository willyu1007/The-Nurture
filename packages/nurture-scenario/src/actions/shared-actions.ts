import type {
  CanonicalRef,
  WorkflowActionHandler,
  WorkflowActionRegistry,
  WorkflowCommandResponse,
  WorkflowRunRef,
  WorkflowStepHandlerInput,
} from "../types.js";

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

export const confirmAction: WorkflowActionHandler = async (input) => actionResponse(input, "confirmed");
export const rejectAction: WorkflowActionHandler = async (input) => actionResponse(input, "rejected");
export const retryAction: WorkflowActionHandler = async (input) => actionResponse(input, "retry_requested");
export const cancelAction: WorkflowActionHandler = async (input) => actionResponse(input, "cancelled");
export const createHandoffAction: WorkflowActionHandler = async (input) => actionResponse(input, "handoff_requested");

export const nurtureActions: WorkflowActionRegistry = {
  "nurture.confirm": confirmAction,
  "nurture.reject": rejectAction,
  "nurture.retry": retryAction,
  "nurture.cancel": cancelAction,
  "nurture.create_handoff": createHandoffAction,
};
