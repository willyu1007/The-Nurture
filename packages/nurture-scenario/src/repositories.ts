import type { CanonicalRef, DomainContextRef } from "@my-chat/workflow-contracts";
import type { NurtureCommandRepository } from "./domain/commands/command-kernel.js";
import type { NurtureInteractionContextRepository } from "./domain/interactions/interaction-context.js";

export type NurtureProfileProjection = {
  profile_id: string;
  workspace_id: string;
  canonical_object_ref: DomainContextRef;
  scenario_key: "nurture";
  projection_version: number;
  safe_summary: string;
};

export type ActivityComparisonDraft = {
  comparison_id: string;
  workspace_id: string;
  target_refs: DomainContextRef[];
  option_refs: CanonicalRef[];
  safe_summary: string;
  /** Persisted re-weighting from the adjust_activity_weights intervention. */
  weight_override_payload?: unknown;
  /** Last deterministic ranking produced by compare_activities. */
  computed_result_payload?: unknown;
};

/**
 * Scenario-local family_rule_trial project (read/update by handlers via the
 * port; handlers never see Prisma). Payloads are opaque to the business layer.
 */
export type NurtureWorkflowProject = {
  project_id: string;
  workspace_id: string;
  workflow_run_id?: string;
  template_key: string;
  issue_type: string;
  status: string;
  family_ref_key: string;
  child_ref_key?: string;
  family_charter_id?: string;
  quantification_snapshot_id?: string;
  focus_cycle_id?: string;
  goal_payload?: unknown;
  constraint_payload?: unknown;
  baseline_payload?: unknown;
  plan_payload?: unknown;
  measurement_plan_payload?: unknown;
  capture_prompt_payload?: unknown;
  review_summary_payload?: unknown;
  learning_output_payload?: unknown;
  profile_update_proposal_payload?: unknown;
  charter_update_proposal_payload?: unknown;
  orchestration_state_payload?: unknown;
  next_checkpoint_at?: string;
  review_due_at?: string;
  escalated_at?: string;
  risk_level?: string;
  aggregate_version: number;
};

export type NurtureProfileRepository = {
  getByCanonicalObjectRef(input: { workspace_id: string; canonical_object_ref: DomainContextRef }): Promise<NurtureProfileProjection | null>;
  upsertProjection(input: NurtureProfileProjection): Promise<NurtureProfileProjection>;
};

export type ActivityComparisonRepository = {
  createDraft(input: ActivityComparisonDraft): Promise<ActivityComparisonDraft>;
  getDraft(input: { workspace_id: string; comparison_id: string }): Promise<ActivityComparisonDraft | null>;
  /** adjust_activity_weights intervention: persist the normalized weight override. */
  saveWeightOverride(input: { workspace_id: string; comparison_id: string; weight_override: unknown }): Promise<ActivityComparisonDraft>;
  /** compare_activities: persist the computed ranking for replay/audit. */
  saveComputedResult(input: { workspace_id: string; comparison_id: string; computed_result: unknown }): Promise<ActivityComparisonDraft>;
};

export type NurtureEvidenceRepository = {
  appendEvidenceRef(input: { workspace_id: string; target_ref: CanonicalRef; evidence_ref: CanonicalRef; reason_code: string }): Promise<CanonicalRef>;
};

/**
 * family_rule_trial project port. Updates take expected_version for optimistic
 * concurrency (throws on mismatch) and bump aggregate_version.
 */
export type NurtureWorkflowProjectRepository = {
  getByWorkflowRunId(input: { workspace_id: string; workflow_run_id: string }): Promise<NurtureWorkflowProject | null>;
  getById(input: { workspace_id: string; project_id: string }): Promise<NurtureWorkflowProject | null>;
  updateStrategyPayloads(input: {
    workspace_id: string;
    project_id: string;
    expected_version: number;
    goal_payload: unknown;
    constraint_payload: unknown;
  }): Promise<NurtureWorkflowProject>;
  updatePlanPayloads(input: {
    workspace_id: string;
    project_id: string;
    expected_version: number;
    baseline_payload: unknown;
    plan_payload: unknown;
    measurement_plan_payload: unknown;
    capture_prompt_payload: unknown;
    orchestration_state_payload?: unknown;
    next_checkpoint_at?: string;
    review_due_at?: string;
    status?: string;
  }): Promise<NurtureWorkflowProject>;
  updateReviewPayloads(input: {
    workspace_id: string;
    project_id: string;
    expected_version: number;
    review_summary_payload: unknown;
    learning_output_payload: unknown;
    profile_update_proposal_payload: unknown;
    charter_update_proposal_payload?: unknown;
  }): Promise<NurtureWorkflowProject>;
};

export type NurtureRepositories = {
  commands: NurtureCommandRepository;
  interactions: NurtureInteractionContextRepository;
  profiles: NurtureProfileRepository;
  activityComparisons: ActivityComparisonRepository;
  evidence: NurtureEvidenceRepository;
  projects: NurtureWorkflowProjectRepository;
};

export const repositoryTokens = {
  commands: "nurture.repositories.commands",
  interactions: "nurture.repositories.interactions",
  profiles: "nurture.repositories.profiles",
  activityComparisons: "nurture.repositories.activity_comparisons",
  evidence: "nurture.repositories.evidence",
  projects: "nurture.repositories.projects",
} as const;

export const createRepositoryPorts = (repositories: NurtureRepositories): NurtureRepositories => repositories;
