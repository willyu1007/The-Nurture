import { Prisma, type NurtureWorkflowProject as PrismaProjectRow, type PrismaClient } from "@prisma/client";
import type { CanonicalRef, DomainContextRef } from "@my-chat/workflow-contracts";
import type {
  ActivityComparisonDraft,
  ActivityComparisonRepository,
  NurtureEvidenceRepository,
  NurtureProfileProjection,
  NurtureProfileRepository,
  NurtureRepositories,
  NurtureWorkflowProject,
  NurtureWorkflowProjectRepository,
} from "@the-nurture/scenario";

const jsonOrUndefined = (value: Prisma.JsonValue | null): unknown => (value === null ? undefined : value);

// ---- mappers: Prisma row -> scenario domain entity (no Prisma types leak) ----

const toProjection = (row: {
  profileId: string;
  workspaceId: string;
  canonicalObjectRef: Prisma.JsonValue;
  projectionVersion: number;
  safeSummary: string;
}): NurtureProfileProjection => ({
  profile_id: row.profileId,
  workspace_id: row.workspaceId,
  canonical_object_ref: row.canonicalObjectRef as unknown as DomainContextRef,
  scenario_key: "nurture",
  projection_version: row.projectionVersion,
  safe_summary: row.safeSummary,
});

const toDraft = (row: {
  comparisonId: string;
  workspaceId: string;
  targetRefs: Prisma.JsonValue;
  optionRefs: Prisma.JsonValue;
  safeSummary: string;
  weightOverridePayload: Prisma.JsonValue | null;
  computedResultPayload: Prisma.JsonValue | null;
}): ActivityComparisonDraft => ({
  comparison_id: row.comparisonId,
  workspace_id: row.workspaceId,
  target_refs: row.targetRefs as unknown as DomainContextRef[],
  option_refs: row.optionRefs as unknown as CanonicalRef[],
  safe_summary: row.safeSummary,
  weight_override_payload: jsonOrUndefined(row.weightOverridePayload),
  computed_result_payload: jsonOrUndefined(row.computedResultPayload),
});

const toProject = (row: PrismaProjectRow): NurtureWorkflowProject => ({
  project_id: row.id,
  workspace_id: row.workspaceId,
  workflow_run_id: row.workflowRunId ?? undefined,
  template_key: row.templateKey,
  issue_type: row.issueType,
  status: row.status,
  family_ref_key: row.familyRefKey,
  child_ref_key: row.primaryChildRefKey ?? undefined,
  family_charter_id: row.familyCharterId ?? undefined,
  quantification_snapshot_id: row.quantificationSnapshotId ?? undefined,
  focus_cycle_id: row.focusCycleId ?? undefined,
  goal_payload: jsonOrUndefined(row.goalPayload),
  constraint_payload: jsonOrUndefined(row.constraintPayload),
  baseline_payload: jsonOrUndefined(row.baselinePayload),
  plan_payload: jsonOrUndefined(row.planPayload),
  measurement_plan_payload: jsonOrUndefined(row.measurementPlanPayload),
  capture_prompt_payload: jsonOrUndefined(row.capturePromptPayload),
  review_summary_payload: jsonOrUndefined(row.reviewSummaryPayload),
  learning_output_payload: jsonOrUndefined(row.learningOutputPayload),
  profile_update_proposal_payload: jsonOrUndefined(row.profileUpdateProposalPayload),
  charter_update_proposal_payload: jsonOrUndefined(row.charterUpdateProposalPayload),
  orchestration_state_payload: jsonOrUndefined(row.orchestrationStatePayload),
  next_checkpoint_at: row.nextCheckpointAt?.toISOString(),
  review_due_at: row.reviewDueAt?.toISOString(),
  escalated_at: row.escalatedAt?.toISOString(),
  risk_level: row.riskLevel ?? undefined,
  aggregate_version: row.aggregateVersion,
});

const asJson = (value: unknown): Prisma.InputJsonValue =>
  value as unknown as Prisma.InputJsonValue;

// ---- NurtureProfileRepository ----

export class PrismaProfileRepository implements NurtureProfileRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async getByCanonicalObjectRef(input: {
    workspace_id: string;
    canonical_object_ref: DomainContextRef;
  }): Promise<NurtureProfileProjection | null> {
    const ref = input.canonical_object_ref;
    const row = await this.prisma.nurtureProfileProjection.findUnique({
      where: {
        workspaceId_refNamespace_refObjectType_refObjectId: {
          workspaceId: input.workspace_id,
          refNamespace: ref.namespace,
          refObjectType: ref.object_type,
          refObjectId: ref.object_id,
        },
      },
    });
    return row ? toProjection(row) : null;
  }

  async upsertProjection(input: NurtureProfileProjection): Promise<NurtureProfileProjection> {
    const ref = input.canonical_object_ref;
    const row = await this.prisma.nurtureProfileProjection.upsert({
      where: {
        workspaceId_refNamespace_refObjectType_refObjectId: {
          workspaceId: input.workspace_id,
          refNamespace: ref.namespace,
          refObjectType: ref.object_type,
          refObjectId: ref.object_id,
        },
      },
      create: {
        profileId: input.profile_id,
        workspaceId: input.workspace_id,
        refNamespace: ref.namespace,
        refObjectType: ref.object_type,
        refObjectId: ref.object_id,
        canonicalObjectRef: asJson(ref),
        scenarioKey: input.scenario_key ?? "nurture",
        projectionVersion: input.projection_version,
        safeSummary: input.safe_summary,
      },
      update: {
        profileId: input.profile_id,
        canonicalObjectRef: asJson(ref),
        projectionVersion: input.projection_version,
        safeSummary: input.safe_summary,
      },
    });
    return toProjection(row);
  }
}

// ---- ActivityComparisonRepository ----

export class PrismaActivityComparisonRepository implements ActivityComparisonRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async createDraft(input: ActivityComparisonDraft): Promise<ActivityComparisonDraft> {
    const row = await this.prisma.nurtureActivityComparisonDraft.create({
      data: {
        comparisonId: input.comparison_id,
        workspaceId: input.workspace_id,
        targetRefs: asJson(input.target_refs),
        optionRefs: asJson(input.option_refs),
        safeSummary: input.safe_summary,
        ...(input.weight_override_payload !== undefined ? { weightOverridePayload: asJson(input.weight_override_payload) } : {}),
        ...(input.computed_result_payload !== undefined ? { computedResultPayload: asJson(input.computed_result_payload) } : {}),
      },
    });
    return toDraft(row);
  }

  async getDraft(input: {
    workspace_id: string;
    comparison_id: string;
  }): Promise<ActivityComparisonDraft | null> {
    const row = await this.prisma.nurtureActivityComparisonDraft.findUnique({
      where: {
        workspaceId_comparisonId: {
          workspaceId: input.workspace_id,
          comparisonId: input.comparison_id,
        },
      },
    });
    return row ? toDraft(row) : null;
  }

  async saveWeightOverride(input: {
    workspace_id: string;
    comparison_id: string;
    weight_override: unknown;
  }): Promise<ActivityComparisonDraft> {
    const row = await this.prisma.nurtureActivityComparisonDraft.update({
      where: { workspaceId_comparisonId: { workspaceId: input.workspace_id, comparisonId: input.comparison_id } },
      data: { weightOverridePayload: asJson(input.weight_override) },
    });
    return toDraft(row);
  }

  async saveComputedResult(input: {
    workspace_id: string;
    comparison_id: string;
    computed_result: unknown;
  }): Promise<ActivityComparisonDraft> {
    const row = await this.prisma.nurtureActivityComparisonDraft.update({
      where: { workspaceId_comparisonId: { workspaceId: input.workspace_id, comparisonId: input.comparison_id } },
      data: { computedResultPayload: asJson(input.computed_result) },
    });
    return toDraft(row);
  }
}

// ---- NurtureWorkflowProjectRepository (family_rule_trial project) ----

export class PrismaWorkflowProjectRepository implements NurtureWorkflowProjectRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async getByWorkflowRunId(input: {
    workspace_id: string;
    workflow_run_id: string;
  }): Promise<NurtureWorkflowProject | null> {
    const row = await this.prisma.nurtureWorkflowProject.findFirst({
      where: { workspaceId: input.workspace_id, workflowRunId: input.workflow_run_id, deletedAt: null },
    });
    return row ? toProject(row) : null;
  }

  async getById(input: { workspace_id: string; project_id: string }): Promise<NurtureWorkflowProject | null> {
    const row = await this.prisma.nurtureWorkflowProject.findFirst({
      where: { id: input.project_id, workspaceId: input.workspace_id, deletedAt: null },
    });
    return row ? toProject(row) : null;
  }

  /** Optimistic update: matches on (id, workspace, expected version), bumps version, throws on conflict. */
  private async applyVersioned(
    input: { workspace_id: string; project_id: string; expected_version: number },
    data: Prisma.NurtureWorkflowProjectUpdateManyMutationInput,
  ): Promise<NurtureWorkflowProject> {
    const res = await this.prisma.nurtureWorkflowProject.updateMany({
      // deletedAt:null so a soft-deleted project cannot be silently mutated
      // (reads already filter it; keep the write path consistent).
      where: { id: input.project_id, workspaceId: input.workspace_id, aggregateVersion: input.expected_version, deletedAt: null },
      data: { ...data, aggregateVersion: { increment: 1 } },
    });
    if (res.count === 0) {
      throw new Error(
        `optimistic concurrency conflict: project ${input.project_id} is not at version ${input.expected_version}`,
      );
    }
    const row = await this.prisma.nurtureWorkflowProject.findFirst({
      where: { id: input.project_id, workspaceId: input.workspace_id, deletedAt: null },
    });
    if (!row) throw new Error(`project ${input.project_id} not found after update`);
    return toProject(row);
  }

  updateStrategyPayloads(input: {
    workspace_id: string;
    project_id: string;
    expected_version: number;
    goal_payload: unknown;
    constraint_payload: unknown;
  }): Promise<NurtureWorkflowProject> {
    return this.applyVersioned(input, {
      goalPayload: asJson(input.goal_payload),
      constraintPayload: asJson(input.constraint_payload),
    });
  }

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
  }): Promise<NurtureWorkflowProject> {
    return this.applyVersioned(input, {
      baselinePayload: asJson(input.baseline_payload),
      planPayload: asJson(input.plan_payload),
      measurementPlanPayload: asJson(input.measurement_plan_payload),
      capturePromptPayload: asJson(input.capture_prompt_payload),
      ...(input.orchestration_state_payload !== undefined ? { orchestrationStatePayload: asJson(input.orchestration_state_payload) } : {}),
      ...(input.next_checkpoint_at ? { nextCheckpointAt: new Date(input.next_checkpoint_at) } : {}),
      ...(input.review_due_at ? { reviewDueAt: new Date(input.review_due_at) } : {}),
      ...(input.status ? { status: input.status as Prisma.NurtureWorkflowProjectUpdateManyMutationInput["status"] } : {}),
    });
  }

  updateReviewPayloads(input: {
    workspace_id: string;
    project_id: string;
    expected_version: number;
    review_summary_payload: unknown;
    learning_output_payload: unknown;
    profile_update_proposal_payload: unknown;
    charter_update_proposal_payload?: unknown;
  }): Promise<NurtureWorkflowProject> {
    return this.applyVersioned(input, {
      reviewSummaryPayload: asJson(input.review_summary_payload),
      learningOutputPayload: asJson(input.learning_output_payload),
      profileUpdateProposalPayload: asJson(input.profile_update_proposal_payload),
      ...(input.charter_update_proposal_payload !== undefined ? { charterUpdateProposalPayload: asJson(input.charter_update_proposal_payload) } : {}),
    });
  }
}

// ---- NurtureEvidenceRepository (append-only ref log) ----

export class PrismaEvidenceRepository implements NurtureEvidenceRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async appendEvidenceRef(input: {
    workspace_id: string;
    target_ref: CanonicalRef;
    evidence_ref: CanonicalRef;
    reason_code: string;
  }): Promise<CanonicalRef> {
    await this.prisma.nurtureEvidenceRef.create({
      data: {
        workspaceId: input.workspace_id,
        targetRef: asJson(input.target_ref),
        evidenceRef: asJson(input.evidence_ref),
        reasonCode: input.reason_code,
      },
    });
    return input.evidence_ref;
  }
}

/** Wire the Prisma-backed implementations into the scenario repository ports. */
export const createNurtureRepositories = (prisma: PrismaClient): NurtureRepositories => ({
  profiles: new PrismaProfileRepository(prisma),
  activityComparisons: new PrismaActivityComparisonRepository(prisma),
  evidence: new PrismaEvidenceRepository(prisma),
  projects: new PrismaWorkflowProjectRepository(prisma),
});
