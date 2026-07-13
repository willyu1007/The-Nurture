import type { CanonicalRef, DomainContextRef } from "@my-chat/workflow-contracts";
import { canonicalJsonV1, type NurtureCommandSpec } from "./command-kernel.js";

export type CalibrateFamilyStrategyCommandInput = {
  workspace_id: string;
  project_id: string;
  expected_version: number;
  goal_payload: unknown;
  constraint_payload: unknown;
  evidence_target_ref: CanonicalRef;
  evidence_ref: CanonicalRef;
};

export const workflowProjectRef = (projectId: string, version: number): DomainContextRef => ({
  namespace: "nurture",
  consumer_scenario_key: "nurture",
  object_type: "workflow_project",
  object_id: projectId,
  version,
  owner_scope: "workspace",
});

export const calibrateFamilyStrategyCommand: NurtureCommandSpec<CalibrateFamilyStrategyCommandInput> = {
  command_key: "family_strategy.calibrate",
  command_scope: "family_strategy",
  contract_version: 1,
  canonicalize: (input) => {
    const constraint = input.constraint_payload as Record<string, unknown>;
    const normalizeStringSet = (value: unknown) =>
      Array.isArray(value) && value.every((entry) => typeof entry === "string")
        ? [...new Set(value)].sort()
        : value;
    return {
      project_id: input.project_id,
      expected_version: input.expected_version,
      goal_payload: input.goal_payload,
      constraint_payload: {
        ...constraint,
        non_negotiable_boundaries: normalizeStringSet(constraint.non_negotiable_boundaries),
        negotiable_levers: normalizeStringSet(constraint.negotiable_levers),
      },
      evidence_target_ref: input.evidence_target_ref,
      evidence_ref: input.evidence_ref,
    };
  },
  async checkPreconditions(transaction, input) {
    const project = await transaction.getWorkflowProjectById({
      workspace_id: input.workspace_id,
      project_id: input.project_id,
    });
    if (!project) return { status: "blocked", reason_code: "project_not_found" };
    const alreadySatisfied =
      canonicalJsonV1(project.goal_payload ?? null) === canonicalJsonV1(input.goal_payload) &&
      canonicalJsonV1(project.constraint_payload ?? null) === canonicalJsonV1(input.constraint_payload);
    if (alreadySatisfied) {
      return {
        status: "already_satisfied",
        output_refs: [workflowProjectRef(project.project_id, project.aggregate_version)],
      };
    }
    if (project.aggregate_version !== input.expected_version) {
      return { status: "conflict", reason_code: "version_conflict" };
    }
    return { status: "ready" };
  },
  async apply(transaction, input) {
    const project = await transaction.updateWorkflowProjectStrategy({
      workspace_id: input.workspace_id,
      project_id: input.project_id,
      expected_version: input.expected_version,
      goal_payload: input.goal_payload,
      constraint_payload: input.constraint_payload,
    });
    await transaction.appendEvidenceRef({
      workspace_id: input.workspace_id,
      target_ref: input.evidence_target_ref,
      evidence_ref: input.evidence_ref,
      reason_code: "family_strategy_decision_basis",
    });
    return { output_refs: [workflowProjectRef(project.project_id, project.aggregate_version)] };
  },
};
