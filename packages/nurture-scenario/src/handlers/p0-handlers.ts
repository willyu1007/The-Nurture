import type {
  CanonicalRef,
  ContextBindingDraft,
  OutboxEventDraft,
  WorkflowArtifactDraft,
  WorkflowHandlerRegistry,
  WorkflowStepHandlerInput,
  WorkflowStepHandlerResult,
} from "../types.js";

const workflowRunRef = (input: WorkflowStepHandlerInput): CanonicalRef => ({
  kind: "workflow_run",
  id: input.run_id,
  version: input.expected_step_version,
});

const artifactRef = (input: WorkflowStepHandlerInput, artifactType: string): CanonicalRef => ({
  kind: "workflow_artifact",
  id: `${input.run_id}:${artifactType}`,
  version: input.expected_step_version,
});

const snapshotRef = (input: WorkflowStepHandlerInput, snapshotType: string): CanonicalRef => ({
  kind: "context_snapshot",
  id: `${input.run_id}:${input.step_key}:${snapshotType}`,
  version: input.expected_step_version,
});

const eventDraft = (input: WorkflowStepHandlerInput, eventType: string): OutboxEventDraft => ({
  event_type: eventType,
  aggregate_type: "workflow_run",
  aggregate_id: input.run_id,
  aggregate_version: input.expected_step_version ?? 1,
  payload: {
    body: "no_body",
    pii: "no_pii",
    signal_version: 1,
    run_id: input.run_id,
    step_id: input.step_id,
    scenario_key: input.scenario_key,
    capability_key: input.capability_key,
    entrypoint_key: input.entrypoint_key,
    workflow_version_id: input.workflow_version_id,
    client_surface: input.meta.client_surface,
  },
});

const artifactDraft = (
  input: WorkflowStepHandlerInput,
  artifactType: string,
  safeTitle: string,
  safeSummary: string,
): WorkflowArtifactDraft => ({
  artifact_type: artifactType,
  exposure_level: "L1",
  source_refs: [workflowRunRef(input)],
  safe_title: safeTitle,
  safe_summary: safeSummary,
});

const contextBinding = (input: WorkflowStepHandlerInput): ContextBindingDraft => ({
  target_ref: workflowRunRef(input),
  context_refs: [
    {
      namespace: "my_chat",
      consumer_scenario_key: "nurture",
      object_type: "family",
      object_id: `${input.meta.workspace_id}:family`,
      owner_scope: "workspace",
      canonical_ref: {
        service: "my_chat",
        object_type: "family",
        object_id: `${input.meta.workspace_id}:family`,
      },
    },
  ],
  snapshot_refs: [snapshotRef(input, "family_context")],
});

const completed = (
  input: WorkflowStepHandlerInput,
  artifactType: string,
  safeTitle: string,
  safeSummary: string,
): WorkflowStepHandlerResult => ({
  status: "completed",
  output_refs: [workflowRunRef(input), artifactRef(input, artifactType)],
  artifact_drafts: [artifactDraft(input, artifactType, safeTitle, safeSummary)],
  event_drafts: [eventDraft(input, "workflow.step.completed"), eventDraft(input, "workflow.artifact.created")],
});

export const collectContext = async (input: WorkflowStepHandlerInput): Promise<WorkflowStepHandlerResult> => ({
  status: "completed",
  output_refs: [workflowRunRef(input), snapshotRef(input, "family_context")],
  context_bindings: [contextBinding(input)],
  event_drafts: [eventDraft(input, "workflow.context.bound"), eventDraft(input, "workflow.step.completed")],
});

export const evaluatePregnancyStage = async (input: WorkflowStepHandlerInput): Promise<WorkflowStepHandlerResult> =>
  completed(
    input,
    "pregnancy_stage_summary",
    "Pregnancy stage summary",
    "Stage-aware preparation summary with non-medical safety prompts.",
  );

export const calibrateFamilyStrategy = async (input: WorkflowStepHandlerInput): Promise<WorkflowStepHandlerResult> =>
  completed(
    input,
    "family_strategy_summary",
    "Family strategy summary",
    "Long-term parenting strategy connected to My-Chat canonical family and child objects.",
  );

export const generateCarePlan = async (input: WorkflowStepHandlerInput): Promise<WorkflowStepHandlerResult> =>
  completed(
    input,
    "care_plan_summary",
    "Short-term care plan",
    "Care plan summary with family constraints, review cadence, and safety boundary notes.",
  );

export const compareActivities = async (input: WorkflowStepHandlerInput): Promise<WorkflowStepHandlerResult> =>
  completed(
    input,
    "activity_comparison_summary",
    "Activity comparison summary",
    "Activity options compared by goals, constraints, burden, evidence, and review signals.",
  );

export const recordReview = async (input: WorkflowStepHandlerInput): Promise<WorkflowStepHandlerResult> =>
  completed(
    input,
    "execution_review_summary",
    "Execution review summary",
    "Outcome review summary that can update Nurture profile projections by canonical object ref.",
  );

export const writeArtifact = async (input: WorkflowStepHandlerInput): Promise<WorkflowStepHandlerResult> =>
  completed(
    input,
    "execution_review_summary",
    "Workflow artifact",
    `Artifact write completed for ${input.capability_key}:${input.entrypoint_key}.`,
  );

export const requestApproval = async (input: WorkflowStepHandlerInput): Promise<WorkflowStepHandlerResult> => ({
  status: "manual_review_required",
  output_refs: [workflowRunRef(input)],
  reason_code: "guardian_approval_required",
  event_drafts: [eventDraft(input, "workflow.approval.requested")],
});

export const requestHandoff = async (input: WorkflowStepHandlerInput): Promise<WorkflowStepHandlerResult> => ({
  status: "completed",
  output_refs: [workflowRunRef(input), { kind: "workflow_handoff", id: `${input.run_id}:handoff`, version: input.expected_step_version }],
  event_drafts: [eventDraft(input, "workflow.handoff.requested")],
});

export const applyMedicalSafetyGate = async (input: WorkflowStepHandlerInput): Promise<WorkflowStepHandlerResult> => ({
  status: "completed",
  output_refs: [workflowRunRef(input), artifactRef(input, "health_state_summary")],
  artifact_drafts: [
    artifactDraft(
      input,
      "health_state_summary",
      "Health-state safety boundary",
      "Non-diagnostic health-state summary. Escalate urgent, diagnostic, medication, or treatment decisions to qualified care.",
    ),
  ],
  event_drafts: [eventDraft(input, "workflow.step.completed")],
});

export const nurtureHandlers: WorkflowHandlerRegistry = {
  "nurture.collect_context": collectContext,
  "nurture.evaluate_pregnancy_stage": evaluatePregnancyStage,
  "nurture.calibrate_family_strategy": calibrateFamilyStrategy,
  "nurture.generate_care_plan": generateCarePlan,
  "nurture.compare_activities": compareActivities,
  "nurture.record_review": recordReview,
  "nurture.write_artifact": writeArtifact,
  "nurture.request_approval": requestApproval,
  "nurture.request_handoff": requestHandoff,
  "nurture.apply_medical_safety_gate": applyMedicalSafetyGate,
};
