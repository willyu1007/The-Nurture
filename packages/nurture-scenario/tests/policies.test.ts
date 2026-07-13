import { describe, expect, it } from "vitest";
import type { WorkflowExposureLevel } from "@my-chat/workflow-contracts";
import type { NurtureHandlerDeps, NurtureWorkflowProject } from "../src/index.js";
import { createNurturePolicies } from "../src/index.js";

const WS = "ws-1";

type ArtifactFacts = { artifact_type: string; exposure_level: WorkflowExposureLevel; owning_project_id?: string };
type ProjState = { status?: string; escalated_at?: string };

type Cfg = {
  artifact?: ArtifactFacts | null;
  guardianApproved?: boolean | null;
  projectsById?: Record<string, ProjState | null>;
};

const mkProject = (id: string, st: ProjState): NurtureWorkflowProject => ({
  project_id: id,
  workspace_id: WS,
  template_key: "family_rule_trial",
  issue_type: "bedtime",
  family_ref_key: `${WS}:family`,
  status: st.status ?? "active",
  escalated_at: st.escalated_at,
  aggregate_version: 1,
});

const buildDeps = (cfg: Cfg): NurtureHandlerDeps => {
  const projectsById = cfg.projectsById ?? { p1: { status: "active" } };
  const stub = async () => {
    throw new Error("not used by policies");
  };
  const lookById = async ({ project_id }: { project_id: string }) => {
    const st = projectsById[project_id];
    return st ? mkProject(project_id, st) : null;
  };
  return {
    repositories: {
      profiles: { getByCanonicalObjectRef: async () => null, upsertProjection: stub as never },
      activityComparisons: { createDraft: stub as never, getDraft: async () => null, saveWeightOverride: stub as never, saveComputedResult: stub as never },
      evidence: { appendEvidenceRef: stub as never },
      projects: {
        getById: lookById as never,
        getByWorkflowRunId: async () => null,
        updateStrategyPayloads: stub as never,
        updatePlanPayloads: stub as never,
        updateReviewPayloads: stub as never,
      },
    },
    canonicalResolver: {
      resolveObject: async () => null,
      resolveRunMaterial: async () => ({}),
      resolveArtifact: async () =>
        cfg.artifact
          ? { artifact_type: cfg.artifact.artifact_type, exposure_level: cfg.artifact.exposure_level, owning_project_id: cfg.artifact.owning_project_id ?? "p1" }
          : null,
      resolveApprovalState: async () => (cfg.guardianApproved == null ? null : { guardian_approved: cfg.guardianApproved }),
    },
    runContext: { getStartRequirements: async () => null },
  };
};

const bag = (over: Record<string, unknown> = {}) => ({ workspace_id: WS, source: { artifact_id: "a1" }, ...over });

describe("public_draft handoff gate (fail-closed, port-derived)", () => {
  it("allows an eligible L2 artifact with guardian approval and no escalation", async () => {
    const p = createNurturePolicies(buildDeps({ artifact: { artifact_type: "family_strategy_summary", exposure_level: "L2" }, guardianApproved: true }));
    expect(await p["nurture.can_create_public_draft_handoff"](bag())).toBe(true);
  });

  it("rejects when guardian approval is unresolved (does NOT trust the bag)", async () => {
    const p = createNurturePolicies(buildDeps({ artifact: { artifact_type: "family_strategy_summary", exposure_level: "L2" }, guardianApproved: null }));
    expect(await p["nurture.can_create_public_draft_handoff"]({ ...bag(), guardian_approval: true })).toBe(false);
  });

  it("rejects an ineligible artifact type", async () => {
    const p = createNurturePolicies(buildDeps({ artifact: { artifact_type: "pregnancy_stage_summary", exposure_level: "L1" }, guardianApproved: true }));
    expect(await p["nurture.can_create_public_draft_handoff"](bag())).toBe(false);
  });

  it("rejects a non-externalizable exposure level (L3)", async () => {
    const p = createNurturePolicies(buildDeps({ artifact: { artifact_type: "family_strategy_summary", exposure_level: "L3" }, guardianApproved: true }));
    expect(await p["nurture.can_create_public_draft_handoff"](bag())).toBe(false);
  });

  it("rejects when the artifact is unresolvable (fail closed)", async () => {
    const p = createNurturePolicies(buildDeps({ artifact: null, guardianApproved: true }));
    expect(await p["nurture.can_create_public_draft_handoff"](bag())).toBe(false);
  });

  it("binds escalation to the artifact's OWNING project, not a caller-named sibling (no cross-project bypass)", async () => {
    // artifact is owned by escalated project A; caller names clean project B.
    const p = createNurturePolicies(
      buildDeps({
        artifact: { artifact_type: "family_strategy_summary", exposure_level: "L2", owning_project_id: "A" },
        guardianApproved: true,
        projectsById: { A: { status: "escalated" }, B: { status: "active" } },
      }),
    );
    expect(await p["nurture.can_create_public_draft_handoff"]({ ...bag(), project_id: "B" })).toBe(false);
  });
});

describe("knowledge_candidate handoff gate", () => {
  it("allows an eligible L2 artifact with guardian approval", async () => {
    const p = createNurturePolicies(buildDeps({ artifact: { artifact_type: "activity_comparison_summary", exposure_level: "L2" }, guardianApproved: true }));
    expect(await p["nurture.can_create_knowledge_candidate_handoff"](bag())).toBe(true);
  });

  it("requires guardian approval (RAG indexing leaves the boundary)", async () => {
    const p = createNurturePolicies(buildDeps({ artifact: { artifact_type: "activity_comparison_summary", exposure_level: "L2" }, guardianApproved: false }));
    expect(await p["nurture.can_create_knowledge_candidate_handoff"](bag())).toBe(false);
  });

  it("rejects an ineligible artifact type for the indexing bucket", async () => {
    const p = createNurturePolicies(buildDeps({ artifact: { artifact_type: "care_plan_summary", exposure_level: "L1" }, guardianApproved: true }));
    expect(await p["nurture.can_create_knowledge_candidate_handoff"](bag())).toBe(false);
  });
});

describe("notification handoff gate", () => {
  it("allows an eligible internal-level artifact without guardian approval", async () => {
    const p = createNurturePolicies(buildDeps({ artifact: { artifact_type: "care_plan_summary", exposure_level: "L3" }, guardianApproved: null }));
    expect(await p["nurture.can_create_notification_handoff"](bag())).toBe(true);
  });

  it("rejects under active escalation", async () => {
    const p = createNurturePolicies(buildDeps({ artifact: { artifact_type: "care_plan_summary", exposure_level: "L3" }, projectsById: { p1: { status: "escalated" } } }));
    expect(await p["nurture.can_create_notification_handoff"](bag())).toBe(false);
  });
});

describe("can_expose_artifact / medical_safety_boundary", () => {
  it("exposes L1/L2/L3 when not escalated", async () => {
    const p = createNurturePolicies(buildDeps({ artifact: { artifact_type: "care_plan_summary", exposure_level: "L3" } }));
    expect(await p["nurture.can_expose_artifact"](bag())).toBe(true);
  });

  it("never exposes L4", async () => {
    const p = createNurturePolicies(buildDeps({ artifact: { artifact_type: "care_plan_summary", exposure_level: "L4" } }));
    expect(await p["nurture.can_expose_artifact"](bag())).toBe(false);
  });

  it("blocks exposure under active escalation (bound to the owning project)", async () => {
    const p = createNurturePolicies(buildDeps({ artifact: { artifact_type: "care_plan_summary", exposure_level: "L3" }, projectsById: { p1: { status: "escalated" } } }));
    expect(await p["nurture.can_expose_artifact"](bag())).toBe(false);
  });

  it("medical_safety_boundary: true for a confirmed non-escalated project, false when unknown", async () => {
    const ok = createNurturePolicies(buildDeps({ projectsById: { p1: { status: "active" } } }));
    expect(await ok["nurture.medical_safety_boundary"]({ workspace_id: WS, project_id: "p1" })).toBe(true);
    const unknown = createNurturePolicies(buildDeps({ projectsById: {} }));
    expect(await unknown["nurture.medical_safety_boundary"]({ workspace_id: WS, project_id: "nope" })).toBe(false);
  });
});
