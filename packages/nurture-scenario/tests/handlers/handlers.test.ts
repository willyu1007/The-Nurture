import { describe, expect, it } from "vitest";
import type { DomainContextRef, WorkflowStepHandlerInput } from "@my-chat/workflow-contracts";
import type { ActivityComparisonDraft, NurtureProfileProjection, NurtureWorkflowProject } from "../../src/repositories.js";
import type { CanonicalSnapshot, NurtureHandlerDeps, RunMaterial } from "../../src/deps.js";
import {
  makeApplyMedicalSafetyGate,
  makeCalibrateFamilyStrategy,
  makeCollectContext,
  makeCompareActivities,
  makeEvaluatePregnancyStage,
  makeGenerateCarePlan,
  makeRecordReview,
  makeRequestApproval,
  makeRequestHandoff,
  makeWriteArtifact,
} from "../../src/handlers/p0-handlers.js";

const WS = "ws-1";
const RUN = "run-1";

const familyRef: DomainContextRef = {
  namespace: "my_chat",
  object_type: "family",
  object_id: `${WS}:family`,
  owner_scope: "workspace",
  canonical_ref: { service: "my_chat", object_type: "family", object_id: `${WS}:family` },
};

const stepInput = (over: Partial<WorkflowStepHandlerInput> = {}): WorkflowStepHandlerInput => ({
  run_id: RUN,
  step_id: "step-1",
  step_key: "x",
  expected_step_version: 1,
  scenario_key: "nurture",
  capability_key: "care_plan",
  entrypoint_key: "generate_short_term_plan",
  workflow_version_id: "v1",
  contract_hash: "test",
  meta: { workspace_id: WS, idempotency_key: "idem", correlation_id: "corr", client_surface: "web_run_workbench" },
  ...over,
});

const project = (issue_type = "bedtime"): NurtureWorkflowProject => ({
  project_id: "p1",
  workspace_id: WS,
  workflow_run_id: RUN,
  template_key: "family_rule_trial",
  issue_type,
  status: "confirmed",
  family_ref_key: `${WS}:family`,
  aggregate_version: 0,
});

type Cfg = {
  project?: NurtureWorkflowProject | null;
  draft?: ActivityComparisonDraft | null;
  profile?: NurtureProfileProjection | null;
  material?: RunMaterial;
  startContext?: { context_refs: DomainContextRef[]; issue_type?: string; safety_boundary_acknowledged?: boolean } | null;
  familySafeFields?: Record<string, unknown>;
  safeFieldsByType?: Record<string, Record<string, unknown>>;
  resolveFamilyNull?: boolean;
  rejectUpdates?: boolean;
  rejectProjection?: boolean;
};

const buildDeps = (cfg: Cfg = {}) => {
  const calls = {
    upsertProjection: [] as unknown[],
    updateStrategy: [] as unknown[],
    updatePlan: [] as unknown[],
    updateReview: [] as unknown[],
    evidence: [] as string[],
    saveComputed: [] as unknown[],
  };
  const snap = (object_type: string, object_id: string): CanonicalSnapshot => ({
    canonical_ref: { service: "my_chat", object_type, object_id },
    snapshot_id: `${object_id}:snap`,
    version: 1,
    object_type,
    safe_fields: cfg.safeFieldsByType?.[object_type] ?? (object_type === "family" ? (cfg.familySafeFields ?? {}) : {}),
  });
  const deps: NurtureHandlerDeps = {
    repositories: {
      profiles: {
        getByCanonicalObjectRef: async () => cfg.profile ?? null,
        upsertProjection: async (i) => {
          if (cfg.rejectProjection) throw new Error("projection conflict");
          calls.upsertProjection.push(i);
          return i;
        },
      },
      activityComparisons: {
        createDraft: async (i) => i,
        getDraft: async () => cfg.draft ?? null,
        saveWeightOverride: async (i) => ({ ...(cfg.draft as ActivityComparisonDraft), weight_override_payload: i.weight_override }),
        saveComputedResult: async (i) => {
          calls.saveComputed.push(i.computed_result);
          return { ...(cfg.draft as ActivityComparisonDraft), computed_result_payload: i.computed_result };
        },
      },
      evidence: {
        appendEvidenceRef: async (i) => {
          calls.evidence.push(i.reason_code);
          return i.evidence_ref;
        },
      },
      projects: {
        getByWorkflowRunId: async () => cfg.project ?? null,
        getById: async () => cfg.project ?? null,
        updateStrategyPayloads: async (i) => {
          if (cfg.rejectUpdates) throw new Error("version conflict");
          calls.updateStrategy.push(i);
          return { ...project(), ...i, aggregate_version: i.expected_version + 1 };
        },
        updatePlanPayloads: async (i) => {
          if (cfg.rejectUpdates) throw new Error("version conflict");
          calls.updatePlan.push(i);
          return { ...(cfg.project as NurtureWorkflowProject), aggregate_version: i.expected_version + 1 };
        },
        updateReviewPayloads: async (i) => {
          if (cfg.rejectUpdates) throw new Error("version conflict");
          calls.updateReview.push(i);
          return { ...(cfg.project as NurtureWorkflowProject), aggregate_version: i.expected_version + 1 };
        },
      },
    },
    canonicalResolver: {
      resolveObject: async ({ object_type, object_id }) => {
        if (object_type === "family" && cfg.resolveFamilyNull) return null;
        return snap(object_type, object_id);
      },
      resolveRunMaterial: async () => cfg.material ?? {},
      resolveArtifact: async () => null,
      resolveApprovalState: async () => null,
    },
    runContext: {
      getStartRequirements: async () =>
        cfg.startContext === undefined
          ? { context_refs: [familyRef], issue_type: "bedtime", safety_boundary_acknowledged: true }
          : cfg.startContext,
    },
  };
  return { deps, calls };
};

const hasEvent = (result: { event_drafts?: { event_type: string }[] }, type: string) =>
  (result.event_drafts ?? []).some((e) => e.event_type === type);

describe("collect_context", () => {
  it("binds family context and completes (no profile)", async () => {
    const { deps } = buildDeps();
    const r = await makeCollectContext(deps)(stepInput());
    expect(r.status).toBe("completed");
    expect(r.context_bindings?.[0]?.context_refs[0]?.object_type).toBe("family");
    expect(hasEvent(r, "workflow.context.bound")).toBe(true);
    expect(hasEvent(r, "nurture.profile.snapshot_attached")).toBe(false);
  });

  it("attaches the profile snapshot when a projection exists", async () => {
    const { deps } = buildDeps({
      profile: { profile_id: "pp", workspace_id: WS, canonical_object_ref: familyRef, scenario_key: "nurture", projection_version: 3, safe_summary: "s" },
    });
    const r = await makeCollectContext(deps)(stepInput());
    expect(hasEvent(r, "nurture.profile.snapshot_attached")).toBe(true);
  });

  it("requests rebind when the required family ref is unresolved", async () => {
    const { deps } = buildDeps({ resolveFamilyNull: true });
    const r = await makeCollectContext(deps)(stepInput());
    expect(r.status).toBe("manual_review_required");
    expect(r.reason_code).toBe("canonical_ref_unresolved");
    expect(hasEvent(r, "workflow.context.rebind_required")).toBe(true);
    expect(r.context_bindings).toBeUndefined();
  });
});

describe("generate_care_plan — two issue_types share one schema/flow", () => {
  it.each(["screen", "bedtime"])("drives issue_type=%s through the same handler", async (issue) => {
    const { deps, calls } = buildDeps({ project: project(issue) });
    const r = await makeGenerateCarePlan(deps)(stepInput());
    expect(r.status).toBe("completed");
    expect(r.artifact_drafts?.[0]?.artifact_type).toBe("care_plan_summary");
    // same code path persisted a plan for both issue types
    expect(calls.updatePlan).toHaveLength(1);
  });

  it("manual-reviews when no project is bound", async () => {
    const { deps } = buildDeps({ project: null });
    const r = await makeGenerateCarePlan(deps)(stepInput());
    expect(r.status).toBe("manual_review_required");
    expect(r.reason_code).toBe("project_not_bound");
  });
});

describe("calibrate_family_strategy", () => {
  it("completes (approval is a separate step) and persists strategy payloads", async () => {
    const { deps, calls } = buildDeps({ project: project(), familySafeFields: { charter: { non_negotiables: ["safety", "no_punishment"], negotiables: ["timing"] } } });
    const r = await makeCalibrateFamilyStrategy(deps)(stepInput());
    expect(r.status).toBe("completed");
    expect(r.artifact_drafts?.[0]?.artifact_type).toBe("family_strategy_summary");
    expect(calls.updateStrategy).toHaveLength(1);
    // the charter actually drives the persisted constraint payload (not the default fallback)
    const persisted = calls.updateStrategy[0] as { constraint_payload: { non_negotiable_boundaries: string[]; negotiable_levers: string[] } };
    expect(persisted.constraint_payload.non_negotiable_boundaries).toEqual(["safety", "no_punishment"]);
    expect(persisted.constraint_payload.negotiable_levers).toEqual(["timing"]);
  });

  it("manual-reviews on a version conflict (persist throws)", async () => {
    const { deps } = buildDeps({ project: project(), rejectUpdates: true });
    const r = await makeCalibrateFamilyStrategy(deps)(stepInput());
    expect(r.status).toBe("manual_review_required");
    expect(r.reason_code).toBe("version_conflict");
    expect(hasEvent(r, "workflow.step.retry_requested")).toBe(true);
  });

  it("manual-reviews when project is missing", async () => {
    const { deps } = buildDeps({ project: null });
    const r = await makeCalibrateFamilyStrategy(deps)(stepInput());
    expect(r.status).toBe("manual_review_required");
    expect(r.reason_code).toBe("project_not_found");
  });
});

describe("compare_activities", () => {
  const draft: ActivityComparisonDraft = {
    comparison_id: `${RUN}:activity_comparison`,
    workspace_id: WS,
    target_refs: [familyRef],
    option_refs: [
      { kind: "downstream_object", id: "opt-a", version: 1 },
      { kind: "downstream_object", id: "opt-b", version: 1 },
    ],
    safe_summary: "draft",
  };

  it("produces the comparison artifact and records the computed result", async () => {
    const { deps, calls } = buildDeps({ draft });
    const r = await makeCompareActivities(deps)(stepInput());
    expect(r.status).toBe("completed");
    expect(r.artifact_drafts?.[0]?.artifact_type).toBe("activity_comparison_summary");
    expect(hasEvent(r, "nurture.activity_comparison.artifact_generated")).toBe(true);
    expect(calls.saveComputed).toHaveLength(1);
  });

  it("retries when the draft is missing", async () => {
    const { deps } = buildDeps({ draft: null });
    const r = await makeCompareActivities(deps)(stepInput());
    expect(r.status).toBe("retry_requested");
    expect(r.reason_code).toBe("comparison_draft_missing");
  });
});

describe("record_review", () => {
  it("auto-applies the profile projection (version+1) and completes", async () => {
    const { deps, calls } = buildDeps({
      project: project(),
      profile: { profile_id: "pp", workspace_id: WS, canonical_object_ref: familyRef, scenario_key: "nurture", projection_version: 2, safe_summary: "s" },
    });
    const r = await makeRecordReview(deps)(stepInput());
    expect(r.status).toBe("completed");
    expect(r.artifact_drafts?.[0]?.artifact_type).toBe("execution_review_summary");
    expect(calls.upsertProjection).toHaveLength(1);
    expect((calls.upsertProjection[0] as NurtureProfileProjection).projection_version).toBe(3);
    expect(calls.updateReview).toHaveLength(1);
  });
});

describe("apply_medical_safety_gate", () => {
  it("escalates a high-risk intent with a scenario-internal event", async () => {
    const { deps, calls } = buildDeps({ material: { normalized_intent_summary: "他是不是得了自闭症" } });
    const r = await makeApplyMedicalSafetyGate(deps)(stepInput());
    expect(r.status).toBe("manual_review_required");
    expect(r.reason_code).toBe("SAFETY_DIAGNOSIS_INTENT");
    expect(hasEvent(r, "nurture.health_state.safety_escalated")).toBe(true);
    expect(r.artifact_drafts?.[0]?.artifact_type).toBe("health_state_summary"); // always emitted
    expect(calls.evidence).toContain("health_safety_escalation_reason");
  });

  it("completes a benign intent without escalation", async () => {
    const { deps } = buildDeps({ material: { normalized_intent_summary: "we want fewer bedtime arguments" } });
    const r = await makeApplyMedicalSafetyGate(deps)(stepInput());
    expect(r.status).toBe("completed");
    expect(hasEvent(r, "nurture.health_state.safety_escalated")).toBe(false);
    expect(r.artifact_drafts?.[0]?.artifact_type).toBe("health_state_summary");
  });

  it.each([
    "I want to kill myself",
    "I just want to die",
    "she cant breathe", // apostrophe-less emergency phrasing
  ])("escalates the safety-critical phrasing %j", async (text) => {
    const { deps } = buildDeps({ material: { normalized_intent_summary: text } });
    const r = await makeApplyMedicalSafetyGate(deps)(stepInput());
    expect(r.status).toBe("manual_review_required");
    expect(hasEvent(r, "nurture.health_state.safety_escalated")).toBe(true);
  });
});

describe("evaluate_pregnancy_stage", () => {
  it("derives the stage from the resolved mother snapshot and never escalates", async () => {
    const { deps } = buildDeps({
      startContext: { context_refs: [{ ...familyRef }, { namespace: "my_chat", object_type: "expectant_mother", object_id: `${WS}:mom`, owner_scope: "workspace" }] },
      safeFieldsByType: { expectant_mother: { gestational_age_weeks: 20 } },
    });
    const r = await makeEvaluatePregnancyStage(deps)(stepInput());
    expect(r.status).toBe("completed");
    expect(r.artifact_drafts?.[0]?.artifact_type).toBe("pregnancy_stage_summary");
    expect(r.artifact_drafts?.[0]?.safe_summary).toContain("second_trimester");
    expect(hasEvent(r, "nurture.health_state.safety_escalated")).toBe(false);
  });

  it("completes with unknown stage when no mother ref / weeks are present", async () => {
    const { deps } = buildDeps({ startContext: { context_refs: [familyRef] } });
    const r = await makeEvaluatePregnancyStage(deps)(stepInput());
    expect(r.status).toBe("completed");
    expect(r.artifact_drafts?.[0]?.safe_summary).toContain("unknown_stage");
  });
});

describe("generate_care_plan / record_review version conflicts", () => {
  it("generate_care_plan manual-reviews on persist conflict", async () => {
    const { deps } = buildDeps({ project: project(), rejectUpdates: true });
    const r = await makeGenerateCarePlan(deps)(stepInput());
    expect(r.status).toBe("manual_review_required");
    expect(r.reason_code).toBe("version_conflict");
  });

  it("record_review manual-reviews on a projection conflict", async () => {
    const { deps } = buildDeps({ project: project(), rejectProjection: true });
    const r = await makeRecordReview(deps)(stepInput());
    expect(r.status).toBe("manual_review_required");
    expect(r.reason_code).toBe("projection_version_conflict");
  });
});

describe("generic step handlers", () => {
  it("request_approval pauses for guardian approval", async () => {
    const { deps } = buildDeps();
    const r = await makeRequestApproval(deps)(stepInput());
    expect(r.status).toBe("manual_review_required");
    expect(r.reason_code).toBe("guardian_approval_required");
    expect(hasEvent(r, "workflow.approval.requested")).toBe(true);
  });

  it("request_handoff completes and requests a handoff", async () => {
    const { deps } = buildDeps();
    const r = await makeRequestHandoff(deps)(stepInput());
    expect(r.status).toBe("completed");
    expect(hasEvent(r, "workflow.handoff.requested")).toBe(true);
    expect(r.output_refs.some((ref) => ref.kind === "workflow_handoff")).toBe(true);
  });

  it("write_artifact completes", async () => {
    const { deps } = buildDeps();
    const r = await makeWriteArtifact(deps)(stepInput());
    expect(r.status).toBe("completed");
    expect(hasEvent(r, "workflow.step.completed")).toBe(true);
  });
});
