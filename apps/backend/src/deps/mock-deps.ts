import type { DomainContextRef, WorkflowExposureLevel } from "@my-chat/workflow-contracts";
import type {
  ArtifactPreviewFacts,
  CanonicalObjectResolver,
  CanonicalSnapshot,
  NurtureArtifactPort,
  NurtureRunContextPort,
  NurtureRunStartContext,
  RunMaterial,
} from "@the-nurture/scenario";
import type { DevHostPrismaClient } from "../db/dev-host-client.js";

/**
 * Dev mock for the My-Chat canonical object resolver. Returns synthetic
 * snapshots (family carries a charter; expectant_mother carries gestational
 * weeks; activity_option carries comparison scores) and reads safety material
 * off the run's requirement payload (so the safety regression is data-driven).
 */
export class MockCanonicalObjectResolver implements CanonicalObjectResolver {
  constructor(private readonly prisma: DevHostPrismaClient) {}

  async resolveObject(input: { workspace_id: string; object_type: string; object_id: string }): Promise<CanonicalSnapshot | null> {
    const safe_fields: Record<string, unknown> =
      input.object_type === "family"
        ? { charter: { non_negotiables: ["safety", "no_punishment"], negotiables: ["timing"] }, parent_bandwidth: 0.7, overload_risk: 0.2 }
        : input.object_type === "expectant_mother"
          ? { gestational_age_weeks: 20 }
          : input.object_type === "activity_option"
            ? { scores: { goals: 0.6, constraints: 1, cost: 0.4, burden: 0.4, evidence: 0.6 } }
            : {};
    return {
      canonical_ref: { service: "my_chat", object_type: input.object_type, object_id: input.object_id },
      snapshot_id: `${input.object_id}:snapshot`,
      version: 1,
      object_type: input.object_type,
      safe_fields,
    };
  }

  async resolveRunMaterial(input: { workspace_id: string; run_id: string }): Promise<RunMaterial> {
    const run = await this.prisma.workflowRun.findFirst({ where: { id: input.run_id, workspaceId: input.workspace_id } });
    const rv = (run?.requirementValuesPayload ?? {}) as { run_material?: RunMaterial; safety_boundary_acknowledged?: boolean };
    return rv.run_material ?? { safety_boundary_acknowledged: rv.safety_boundary_acknowledged };
  }

  async resolveArtifact(): Promise<null> {
    return null; // handoff/expose policies are exercised in a later increment
  }

  async resolveApprovalState(input: { workspace_id: string; run_id?: string; project_id?: string }): Promise<{ guardian_approved: boolean } | null> {
    if (!input.run_id) return null;
    // A cancelled/rejected run is never "approved" even if an approval row lingers.
    const run = await this.prisma.workflowRun.findFirst({ where: { id: input.run_id, workspaceId: input.workspace_id } });
    if (!run || run.status === "cancelled") return { guardian_approved: false };
    const approval = await this.prisma.workflowApproval.findFirst({ where: { runId: input.run_id, workspaceId: input.workspace_id, status: "approved" } });
    return { guardian_approved: Boolean(approval) };
  }
}

export class PgRunContextPort implements NurtureRunContextPort {
  constructor(private readonly prisma: DevHostPrismaClient) {}

  async getStartRequirements(input: { workspace_id: string; run_id: string }): Promise<NurtureRunStartContext | null> {
    const run = await this.prisma.workflowRun.findFirst({ where: { id: input.run_id, workspaceId: input.workspace_id } });
    if (!run) return null;
    const rv = (run.requirementValuesPayload ?? {}) as {
      context_refs?: DomainContextRef[];
      issue_type?: string;
      trial_window_days?: number;
      safety_boundary_acknowledged?: boolean;
    };
    return {
      context_refs: rv.context_refs ?? [],
      issue_type: rv.issue_type,
      trial_window_days: rv.trial_window_days,
      safety_boundary_acknowledged: rv.safety_boundary_acknowledged,
    };
  }
}

export class PgArtifactPreviewPort implements NurtureArtifactPort {
  constructor(private readonly prisma: DevHostPrismaClient) {}

  private map = (a: {
    id: string;
    runId: string;
    artifactType: string;
    exposureLevel: string;
    safeTitle: string | null;
    safeSummary: string | null;
    safePreview: string | null;
    aggregateVersion: number;
  }): ArtifactPreviewFacts => ({
    artifact_id: a.id,
    run_id: a.runId,
    artifact_type: a.artifactType,
    exposure_level: a.exposureLevel as WorkflowExposureLevel,
    safe_title: a.safeTitle ?? undefined,
    safe_summary: a.safeSummary ?? undefined,
    safe_preview: a.safePreview ?? undefined,
    aggregate_version: a.aggregateVersion,
  });

  async getPreview(input: { artifact_id: string }): Promise<ArtifactPreviewFacts | null> {
    const a = await this.prisma.workflowArtifact.findFirst({ where: { id: input.artifact_id, deletedAt: null } });
    return a ? this.map(a) : null;
  }

  async listRunPreviews(input: { workspace_id: string; run_id: string }): Promise<ArtifactPreviewFacts[]> {
    const rows = await this.prisma.workflowArtifact.findMany({
      where: { runId: input.run_id, workspaceId: input.workspace_id, deletedAt: null },
      orderBy: { createdAt: "asc" },
    });
    return rows.map((a) => this.map(a));
  }
}
