import type {
  ChatDashboardSummary,
  WorkflowArtifactPreview,
  WorkflowDashboardCard,
  WorkflowMobileSummary,
  WorkflowPresenters,
  WorkflowRunRef,
  WorkflowRunWorkbench,
} from "./types.js";

const run = (runId: string, status = "active"): WorkflowRunRef => ({
  run_id: runId,
  scenario_key: "nurture",
  capability_key: "activity_comparison",
  entrypoint_key: "compare_activity_options",
  workflow_version_id: "nurture-activity-comparison-v1",
  status,
  aggregate_version: 1,
});

const card = (runId: string, title: string): WorkflowDashboardCard => {
  const runRef = run(runId);
  return {
    run_id: runRef.run_id,
    scenario_key: runRef.scenario_key,
    capability_key: runRef.capability_key,
    entrypoint_key: runRef.entrypoint_key,
    title,
    status: runRef.status,
    requires_attention: false,
    action_availability: [
      {
        action: "confirm",
        available: true,
        reason_code: "available",
        target_type: "workflow_run",
        target_id: runRef.run_id,
        expected_version: runRef.aggregate_version,
      },
    ],
    aggregate_version: runRef.aggregate_version,
  };
};

const preview = (artifactId: string, actorId?: string): WorkflowArtifactPreview => ({
  artifact_id: artifactId,
  run_id: artifactId.split(":")[0] ?? artifactId,
  artifact_type: "activity_comparison_summary",
  exposure_level: "L1",
  safe_title: "Nurture artifact",
  safe_summary: `Safe summary for ${actorId ?? "requesting actor"}.`,
  safe_preview: "Presenter output excludes raw private notes, health detail, and downstream payload bodies.",
  aggregate_version: 1,
});

export const nurturePresenters: WorkflowPresenters = {
  async chat_dashboard_summary(input): Promise<ChatDashboardSummary> {
    const dashboardRun = run(`${input.workspace_id}:nurture:dashboard`);
    return {
      safe_title: "The Nurture",
      safe_summary: `Nurture workflows for ${input.actor_id ?? "workspace"}.`,
      run_refs: [{ kind: "workflow_run", id: dashboardRun.run_id, version: dashboardRun.aggregate_version }],
      action_availability: card(dashboardRun.run_id, "Nurture dashboard").action_availability,
    };
  },
  async dashboard_card(input): Promise<WorkflowDashboardCard> {
    return card(input.run_id, `Nurture run for ${input.actor_id ?? "workspace user"}`);
  },
  async artifact_preview(input): Promise<WorkflowArtifactPreview> {
    return preview(input.artifact_id, input.actor_id);
  },
  async mobile_summary(input): Promise<WorkflowMobileSummary> {
    const mobileRun = run(input.run_id);
    return {
      run: mobileRun,
      cards: [card(input.run_id, `Nurture mobile summary for ${input.workspace_id}`)],
      action_availability: card(input.run_id, input.actor_id ?? "Nurture").action_availability,
    };
  },
  async web_run_workbench(input): Promise<WorkflowRunWorkbench> {
    const workbenchRun = run(input.run_id);
    return {
      run: workbenchRun,
      artifacts: [preview(`${input.run_id}:activity_comparison_summary`, input.actor_id)],
      action_availability: card(input.run_id, `Nurture workbench for ${input.workspace_id}`).action_availability,
    };
  },
};
