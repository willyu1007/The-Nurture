import type {
  CanonicalRef,
  ChatDashboardSummary,
  ChatWorkflowRecommendation,
  WorkflowActionCommand,
  WorkflowActionResult,
  WorkflowAdminSummary,
  WorkflowCommandMeta,
  WorkflowCommandResponse,
  WorkflowDashboardCard,
  WorkflowEvidenceView,
  WorkflowHandoffResult,
  WorkflowMobileSummary,
  WorkflowRunRef,
  WorkflowRunWorkbench,
  WorkflowScenarioModule,
  WorkflowStepLease,
} from "@my-chat/workflow-contracts";

const runRef = (
  meta: WorkflowCommandMeta,
  capabilityKey: string,
  entrypointKey: string,
  status: string,
  aggregateVersion = 1,
): WorkflowRunRef => ({
  run_id: `${meta.workspace_id}:${capabilityKey}:${entrypointKey}`,
  scenario_key: "nurture",
  capability_key: capabilityKey,
  entrypoint_key: entrypointKey,
  workflow_version_id: `nurture-${capabilityKey}-v1`,
  status,
  aggregate_version: aggregateVersion,
});

const canonicalRunRef = (run: WorkflowRunRef): CanonicalRef => ({
  kind: "workflow_run",
  id: run.run_id,
  version: run.aggregate_version,
});

const availability = (run: WorkflowRunRef, action: string, available = true) => ({
  action,
  available,
  reason_code: available ? "available" : "not_available_in_scaffold",
  target_type: "workflow_run",
  target_id: run.run_id,
  expected_version: run.aggregate_version,
});

const commandResponse = (
  meta: WorkflowCommandMeta,
  run: WorkflowRunRef,
  action: string,
): WorkflowCommandResponse<WorkflowRunRef> => ({
  ok: true,
  data: run,
  canonical_refs: [canonicalRunRef(run)],
  aggregate_versions: { [run.run_id]: run.aggregate_version },
  action_availability: [availability(run, action)],
  outbox_event_ids: [`${meta.idempotency_key}:${action}`],
});

const dashboardCard = (run: WorkflowRunRef, title = "The Nurture workflow"): WorkflowDashboardCard => ({
  run_id: run.run_id,
  scenario_key: run.scenario_key,
  capability_key: run.capability_key,
  entrypoint_key: run.entrypoint_key,
  title,
  status: run.status,
  requires_attention: run.status === "manual_review_required",
  action_availability: [availability(run, "confirm"), availability(run, "cancel")],
  aggregate_version: run.aggregate_version,
});

const recommendations = (purpose: string, maxResults: number): ChatWorkflowRecommendation[] =>
  [
    {
      scenario_key: "nurture",
      capability_key: "activity_comparison",
      entrypoint_key: "compare_activity_options",
      safe_title: "Compare activity options",
      safe_summary: `Nurture recommendation for ${purpose}.`,
      start_requirements: [
        {
          requirement_key: "target_family_context",
          schema_version: 1,
          required: true,
          safe_label: "Family context",
          safe_help: "Requires a My-Chat family, parent, child, or expectant mother object reference.",
        },
      ],
    },
    {
      scenario_key: "nurture",
      capability_key: "care_plan",
      entrypoint_key: "generate_short_term_plan",
      safe_title: "Generate short-term care plan",
      safe_summary: "Create a reviewable care plan with safety-boundary prompts.",
      start_requirements: [
        {
          requirement_key: "safety_boundary_acknowledgement",
          schema_version: 1,
          required: true,
          safe_label: "Safety boundary acknowledgement",
        },
      ],
    },
  ].slice(0, maxResults);

export const nurtureAdapters: WorkflowScenarioModule["adapters"] = {
  chat_workflow_control: {
    async recommend(input) {
      return recommendations(input.purpose, input.max_results ?? 2);
    },
    async start_run(input) {
      const run = runRef(input.meta, input.capability_key, input.entrypoint_key, "created");
      return commandResponse(input.meta, run, "start_run");
    },
    async execute_strong_confirmed_action(input) {
      const run = runRef(input.meta, "shared_action", input.action, input.reason_code, input.expected_version + 1);
      return commandResponse(input.meta, run, input.action);
    },
    async summarize_dashboard(input): Promise<ChatDashboardSummary> {
      const meta: WorkflowCommandMeta = {
        workspace_id: input.workspace_id,
        actor_id: input.actor_id,
        idempotency_key: `dashboard:${input.workspace_id}:${input.limit ?? 5}`,
        correlation_id: `dashboard:${input.workspace_id}`,
        client_surface: "chat_dashboard_summary",
      };
      const run = runRef(meta, "activity_comparison", "compare_activity_options", "ready_for_review");
      return {
        safe_title: "The Nurture",
        safe_summary: "Active parenting workflows ready for review.",
        run_refs: [canonicalRunRef(run)],
        action_availability: [availability(run, "confirm")],
      };
    },
  },
  web_run_workbench: {
    async get_run_detail(input): Promise<WorkflowRunWorkbench> {
      const meta: WorkflowCommandMeta = {
        workspace_id: input.workspace_id,
        actor_id: input.actor_id,
        idempotency_key: `workbench:${input.run_id}`,
        correlation_id: `workbench:${input.run_id}`,
        client_surface: "web_run_workbench",
      };
      const run = { ...runRef(meta, "activity_comparison", "compare_activity_options", "ready_for_review"), run_id: input.run_id };
      return {
        run,
        artifacts: [
          {
            artifact_id: `${input.run_id}:activity_comparison_summary`,
            run_id: input.run_id,
            artifact_type: "activity_comparison_summary",
            exposure_level: "L1",
            safe_title: "Activity comparison summary",
            safe_summary: "Scaffold preview for activity comparison output.",
            aggregate_version: run.aggregate_version,
          },
        ],
        action_availability: [availability(run, "confirm"), availability(run, "create_handoff")],
      };
    },
    async execute_action(input: WorkflowActionCommand): Promise<WorkflowActionResult> {
      return {
        target: input.target_ref,
        affected_refs: [input.target_ref],
        action_availability: [
          {
            action: input.action,
            available: false,
            reason_code: input.reason_code,
            target_type: input.target_ref.kind,
            target_id: input.target_ref.id,
            expected_version: input.expected_version,
          },
        ],
      };
    },
    async get_artifact_preview(input) {
      return {
        artifact_id: input.artifact_id ?? `${input.workspace_id}:artifact`,
        run_id: `${input.workspace_id}:run`,
        artifact_type: "activity_comparison_summary",
        exposure_level: input.requested_level,
        safe_title: "Nurture artifact preview",
        safe_summary: `Preview requested by ${input.actor_id ?? "workspace user"}.`,
        safe_preview: "Summary-only scaffold preview. Private evidence remains ref-only.",
        aggregate_version: 1,
      };
    },
    async create_handoff(input): Promise<WorkflowHandoffResult> {
      const sourceRef = input.source_refs[0];
      return {
        handoff_id: `${input.handoff_type}:${sourceRef?.id ?? "unknown"}:${input.requested_purpose}`,
        handoff_type: input.handoff_type,
        status: "requested",
        source_refs: input.source_refs,
        downstream_refs: [],
        aggregate_version: 1,
      };
    },
  },
  mobile_dashboard: {
    async list_cards(input): Promise<WorkflowDashboardCard[]> {
      const meta: WorkflowCommandMeta = {
        workspace_id: input.workspace_id,
        actor_id: input.actor_id,
        idempotency_key: `mobile:list:${input.status ?? "all"}:${input.limit ?? 10}`,
        correlation_id: `mobile:${input.workspace_id}`,
        client_surface: "mobile_dashboard",
      };
      return [dashboardCard(runRef(meta, "care_plan", "generate_short_term_plan", input.status ?? "active"), "Nurture care plan")];
    },
    async get_run_summary(input): Promise<WorkflowMobileSummary> {
      const meta: WorkflowCommandMeta = {
        workspace_id: input.workspace_id,
        actor_id: input.actor_id,
        idempotency_key: `mobile:summary:${input.run_id}`,
        correlation_id: `mobile:${input.run_id}`,
        client_surface: "mobile_dashboard",
      };
      const run = { ...runRef(meta, "care_plan", "generate_short_term_plan", "active"), run_id: input.run_id };
      return {
        run,
        cards: [dashboardCard(run, "Nurture mobile summary")],
        action_availability: [availability(run, "confirm")],
      };
    },
    async execute_action(input: WorkflowActionCommand): Promise<WorkflowActionResult> {
      return {
        target: input.target_ref,
        affected_refs: [input.target_ref],
        action_availability: [
          {
            action: input.action,
            available: false,
            reason_code: input.client_surface,
            target_type: input.target_ref.kind,
            target_id: input.target_ref.id,
            expected_version: input.expected_version,
          },
        ],
      };
    },
  },
  admin_operator: {
    async validate_module(input): Promise<WorkflowAdminSummary> {
      return {
        scenario_key: input.scenario_key,
        status: input.activation_target === "dev" ? "valid_for_dev" : "requires_host_validation",
        findings: [],
      };
    },
    async publish_version(input): Promise<WorkflowAdminSummary> {
      return {
        scenario_key: input.scenario_key,
        capability_key: input.capability_key,
        status: input.dry_run ? "dry_run_passed" : "publish_requested",
        findings: [{ manifest_version: input.manifest_version, contract_hash: input.contract_hash, change_summary: input.change_summary }],
      };
    },
    async disable_capability(input): Promise<WorkflowAdminSummary> {
      return {
        scenario_key: input.scenario_key,
        capability_key: input.capability_key,
        status: `disabled:${input.reason_code}`,
      };
    },
    async get_evidence(input): Promise<WorkflowEvidenceView> {
      return {
        evidence_refs: [input.target_ref],
        safe_summary: `Evidence refs only for ${input.workspace_id}; actor ${input.actor_id ?? "system"}.`,
      };
    },
  },
  worker_runtime: {
    async claim_step(input): Promise<WorkflowStepLease> {
      return {
        run_id: input.run_id,
        step_id: input.step_id,
        step_key: `${input.worker_id}:${input.meta.client_surface}`,
        claim_token: `${input.run_id}:${input.step_id}:${input.expected_version}`,
        aggregate_version: input.expected_version,
        expires_at: new Date(0).toISOString(),
      };
    },
    async complete_step(input) {
      const run = runRef(input.meta, "worker_runtime", input.step_id, input.status ?? "completed", input.expected_version + 1);
      return {
        ok: true,
        data: {
          run_id: input.run_id,
          step_id: input.step_id,
          status: input.status ?? "completed",
          aggregate_version: input.expected_version + 1,
          output_refs: input.output_refs,
        },
        canonical_refs: [canonicalRunRef(run), ...input.output_refs],
        aggregate_versions: { [input.run_id]: input.expected_version + 1 },
        action_availability: [availability(run, "retry", false)],
        outbox_event_ids: input.event_drafts?.map((event) => `${event.event_type}:${event.aggregate_id}`) ?? [],
      };
    },
    async fail_step(input) {
      const run = runRef(input.meta, "worker_runtime", input.step_id, input.retryable ? "retry_requested" : "failed", input.expected_version + 1);
      return {
        ok: true,
        data: {
          run_id: input.run_id,
          step_id: input.step_id,
          status: input.retryable ? "retry_requested" : "failed",
          aggregate_version: input.expected_version + 1,
          output_refs: [],
        },
        canonical_refs: [canonicalRunRef(run)],
        aggregate_versions: { [input.run_id]: input.expected_version + 1 },
        action_availability: [availability(run, "retry", input.retryable)],
        outbox_event_ids: [`${input.meta.idempotency_key}:fail_step`],
      };
    },
  },
};
