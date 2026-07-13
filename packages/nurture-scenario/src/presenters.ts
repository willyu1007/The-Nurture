import type {
  ChatDashboardSummary,
  ScenarioManifest,
  WorkflowActionAvailability,
  WorkflowArtifactPreview,
  WorkflowDashboardCard,
  WorkflowMobileSummary,
  WorkflowPresenters,
  WorkflowRunRef,
  WorkflowRunWorkbench,
} from "@my-chat/workflow-contracts";
import { type ArtifactPreviewFacts, defaultPresenterDeps, type NurturePresenterDeps } from "./deps.js";
import { buildExposureResolver } from "./domain/exposure.js";
import { nurtureScenarioManifest } from "./registry.js";

const runRef = (runId: string, status = "active"): WorkflowRunRef => ({
  run_id: runId,
  scenario_key: "nurture",
  capability_key: "activity_comparison",
  entrypoint_key: "compare_activity_options",
  workflow_version_id: "nurture-activity-comparison-v1",
  status,
  aggregate_version: 1,
});

const availability = (runId: string, action: string): WorkflowActionAvailability => ({
  action,
  available: true,
  reason_code: "available",
  target_type: "workflow_run",
  target_id: runId,
  expected_version: 1,
});

const card = (runId: string, title: string): WorkflowDashboardCard => ({
  run_id: runId,
  scenario_key: "nurture",
  capability_key: "activity_comparison",
  entrypoint_key: "compare_activity_options",
  title,
  status: "active",
  requires_attention: false,
  action_availability: [availability(runId, "confirm")],
  aggregate_version: 1,
});

export const createNurturePresenters = (
  manifest: ScenarioManifest,
  deps: NurturePresenterDeps,
): WorkflowPresenters => {
  const exposure = buildExposureResolver(manifest.artifact_policy.exposure_levels);

  // Map pre-redacted facts -> a WorkflowArtifactPreview, applying exposure.
  // Visibility is gated on the artifact's OWN persisted exposure_level (L0/L4
  // buckets are empty in the manifest => never visible), mirroring the policy
  // layer's "L0/L4 are never exposable" rule. The level is NOT a fixed surface
  // floor — gating on a constant L1 would be a no-op since L1 lists every type.
  // allowPreview=false (chat/citation surfaces) drops safe_preview even when visible.
  const toPreview = (
    facts: ArtifactPreviewFacts,
    allowPreview: boolean,
  ): WorkflowArtifactPreview => {
    const vis = exposure.isVisible(facts.artifact_type, facts.exposure_level);
    const base = {
      artifact_id: facts.artifact_id,
      run_id: facts.run_id,
      artifact_type: facts.artifact_type,
      exposure_level: facts.exposure_level,
      aggregate_version: facts.aggregate_version,
    };
    if (!vis.visible) {
      return { ...base, unavailable_reason: vis.reason }; // ref-only: no safe_* leaks
    }
    return {
      ...base,
      safe_title: facts.safe_title,
      safe_summary: facts.safe_summary,
      safe_preview: allowPreview ? facts.safe_preview : undefined,
    };
  };

  return {
    async chat_dashboard_summary(input): Promise<ChatDashboardSummary> {
      const dashRun = runRef(`${input.workspace_id}:nurture:dashboard`);
      return {
        safe_title: "The Nurture",
        safe_summary: `Nurture workflows for ${input.actor_id ?? "workspace"}.`,
        run_refs: [{ kind: "workflow_run", id: dashRun.run_id, version: dashRun.aggregate_version }],
        action_availability: [availability(dashRun.run_id, "confirm")],
      };
    },
    async dashboard_card(input): Promise<WorkflowDashboardCard> {
      return card(input.run_id, `Nurture run for ${input.actor_id ?? "workspace user"}`);
    },
    async artifact_preview(input): Promise<WorkflowArtifactPreview> {
      const facts = await deps.artifacts.getPreview({ artifact_id: input.artifact_id });
      if (!facts) {
        return {
          artifact_id: input.artifact_id,
          run_id: input.artifact_id.split(":")[0] ?? input.artifact_id,
          artifact_type: "unknown",
          exposure_level: "L0",
          aggregate_version: 0,
          unavailable_reason: "artifact_not_found",
        };
      }
      return toPreview(facts, true);
    },
    async mobile_summary(input): Promise<WorkflowMobileSummary> {
      const run = runRef(input.run_id);
      return {
        run,
        cards: [card(input.run_id, `Nurture mobile summary for ${input.workspace_id}`)],
        action_availability: [availability(input.run_id, "confirm")],
      };
    },
    async web_run_workbench(input): Promise<WorkflowRunWorkbench> {
      const run = runRef(input.run_id, "ready_for_review");
      const facts = await deps.artifacts.listRunPreviews({ workspace_id: input.workspace_id, run_id: input.run_id });
      return {
        run,
        artifacts: facts.map((f) => toPreview(f, true)),
        action_availability: [availability(input.run_id, "confirm"), availability(input.run_id, "create_handoff")],
      };
    },
  };
};

export const nurturePresenters: WorkflowPresenters = createNurturePresenters(nurtureScenarioManifest, defaultPresenterDeps);
