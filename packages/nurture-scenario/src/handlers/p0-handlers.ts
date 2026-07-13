import type {
  CanonicalRef,
  ContextBindingDraft,
  DomainContextRef,
  OutboxEventDraft,
  WorkflowArtifactDraft,
  WorkflowHandlerRegistry,
  WorkflowSignalPayload,
  WorkflowStepHandler,
  WorkflowStepHandlerInput,
  WorkflowStepHandlerResult,
} from "@my-chat/workflow-contracts";
import { defaultNurtureDeps, type NurtureHandlerDeps } from "../deps.js";
import { classifySafetyIntent } from "../domain/safety-classifier.js";
import { type ActivityOption, type ComparisonCriterion, rankActivities } from "../domain/comparison-scoring.js";
import { deriveCarePlan, type IssueType } from "../domain/plan-derivation.js";
import { evaluatePregnancyStage as derivePregnancyStage } from "../domain/pregnancy-stage.js";

// ---------------------------------------------------------------------------
// input-only ref/event/artifact builders (no deps)
// ---------------------------------------------------------------------------

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

const eventDraft = (
  input: WorkflowStepHandlerInput,
  eventType: string,
  extra: Partial<WorkflowSignalPayload> = {},
): OutboxEventDraft => ({
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
    ...extra,
  },
});

const artifactDraft = (
  input: WorkflowStepHandlerInput,
  artifactType: string,
  safeTitle: string,
  safeSummary: string,
  sourceRefs: CanonicalRef[] = [],
): WorkflowArtifactDraft => ({
  artifact_type: artifactType,
  exposure_level: "L1", // handlers draft refs-only L1; L3 detail is presenter-only (D-P2-8)
  source_refs: [workflowRunRef(input), ...sourceRefs],
  safe_title: safeTitle,
  safe_summary: safeSummary,
});

const familyDomainRef = (objectId: string): DomainContextRef => ({
  namespace: "my_chat",
  consumer_scenario_key: "nurture",
  object_type: "family",
  object_id: objectId,
  owner_scope: "workspace",
  canonical_ref: { service: "my_chat", object_type: "family", object_id: objectId },
});

const manualReview = (
  input: WorkflowStepHandlerInput,
  reasonCode: string,
  events: OutboxEventDraft[] = [],
): WorkflowStepHandlerResult => ({
  status: "manual_review_required",
  output_refs: [workflowRunRef(input)],
  reason_code: reasonCode,
  event_drafts: [eventDraft(input, "workflow.step.manual_review_required", { reason_code: reasonCode }), ...events],
});

// ---------------------------------------------------------------------------
// handler factories (deps injected; pure domain modules do the computation)
// ---------------------------------------------------------------------------

export const makeCollectContext = (deps: NurtureHandlerDeps): WorkflowStepHandler => async (input) => {
  const ws = input.meta.workspace_id;
  const ctx = await deps.runContext.getStartRequirements({ workspace_id: ws, run_id: input.run_id });
  if (!ctx || ctx.context_refs.length === 0) {
    return manualReview(input, "start_requirements_missing", [
      eventDraft(input, "workflow.context.rebind_required", { reason_code: "start_requirements_missing" }),
    ]);
  }

  const contextRefs: DomainContextRef[] = [];
  const snapshotRefs: CanonicalRef[] = [];
  for (const ref of ctx.context_refs) {
    const snap = await deps.canonicalResolver.resolveObject({ workspace_id: ws, object_type: ref.object_type, object_id: ref.object_id });
    if (!snap) {
      if (ref.object_type === "family") {
        // family is canonical_required: cannot bind without it.
        return manualReview(input, "canonical_ref_unresolved", [
          eventDraft(input, "workflow.context.rebind_required", { reason_code: "canonical_ref_unresolved", target_type: ref.object_type }),
        ]);
      }
      continue; // optional refs are skipped, not fatal
    }
    contextRefs.push(ref);
    snapshotRefs.push({ kind: "context_snapshot", id: snap.snapshot_id, version: snap.version });
  }

  const events: OutboxEventDraft[] = [eventDraft(input, "workflow.context.bound"), eventDraft(input, "workflow.step.completed")];

  // nurture profile projection is keyed per family (D-P2-7).
  const familyRef = ctx.context_refs.find((r) => r.object_type === "family");
  if (familyRef) {
    const projection = await deps.repositories.profiles.getByCanonicalObjectRef({ workspace_id: ws, canonical_object_ref: familyRef });
    if (projection) {
      snapshotRefs.push({ kind: "context_snapshot", id: `${input.run_id}:nurture_profile`, version: projection.projection_version });
      events.push(eventDraft(input, "nurture.profile.snapshot_attached"));
    }
  }

  const binding: ContextBindingDraft = { target_ref: workflowRunRef(input), context_refs: contextRefs, snapshot_refs: snapshotRefs };
  return {
    status: "completed",
    output_refs: [workflowRunRef(input), ...snapshotRefs],
    context_bindings: [binding],
    event_drafts: events,
  };
};

export const makeEvaluatePregnancyStage = (deps: NurtureHandlerDeps): WorkflowStepHandler => async (input) => {
  const ws = input.meta.workspace_id;
  const ctx = await deps.runContext.getStartRequirements({ workspace_id: ws, run_id: input.run_id });
  const motherRef = ctx?.context_refs.find((r) => r.object_type === "expectant_mother");
  const snap = motherRef
    ? await deps.canonicalResolver.resolveObject({ workspace_id: ws, object_type: motherRef.object_type, object_id: motherRef.object_id })
    : null;
  const weeks = typeof snap?.safe_fields.gestational_age_weeks === "number" ? (snap.safe_fields.gestational_age_weeks as number) : undefined;
  const stage = derivePregnancyStage({ gestational_age_weeks: weeks });

  return {
    status: "completed", // pregnancy stage NEVER escalates (the safety gate owns escalation)
    output_refs: [workflowRunRef(input), artifactRef(input, "pregnancy_stage_summary")],
    artifact_drafts: [
      artifactDraft(input, "pregnancy_stage_summary", "Pregnancy stage preparation", `Stage: ${stage.bucket}. Non-medical preparation prompts only.`),
    ],
    event_drafts: [eventDraft(input, "workflow.step.completed"), eventDraft(input, "workflow.artifact.created")],
  };
};

export const makeCalibrateFamilyStrategy = (deps: NurtureHandlerDeps): WorkflowStepHandler => async (input) => {
  const ws = input.meta.workspace_id;
  const project = await deps.repositories.projects.getByWorkflowRunId({ workspace_id: ws, workflow_run_id: input.run_id });
  if (!project) return manualReview(input, "project_not_found");

  const familyRef = familyDomainRef(project.family_ref_key);
  const snap = await deps.canonicalResolver.resolveObject({ workspace_id: ws, object_type: "family", object_id: project.family_ref_key });
  const charter = (snap?.safe_fields.charter ?? {}) as { non_negotiables?: string[]; negotiables?: string[] };

  const goalPayload = { template_key: project.template_key, issue_type: project.issue_type, objective: `Reduce ${project.issue_type} conflict via a short rule trial.` };
  const constraintPayload = {
    non_negotiable_boundaries: charter.non_negotiables ?? ["safety"],
    negotiable_levers: charter.negotiables ?? [],
    safety_floor: "non-diagnostic, non-punitive",
  };

  try {
    await deps.repositories.projects.updateStrategyPayloads({
      workspace_id: ws,
      project_id: project.project_id,
      expected_version: project.aggregate_version,
      goal_payload: goalPayload,
      constraint_payload: constraintPayload,
    });
  } catch {
    return manualReview(input, "version_conflict", [eventDraft(input, "workflow.step.retry_requested")]);
  }

  await deps.repositories.evidence.appendEvidenceRef({
    workspace_id: ws,
    target_ref: workflowRunRef(input),
    evidence_ref: { kind: "context_snapshot", id: `${input.run_id}:family_strategy_basis`, version: project.aggregate_version },
    reason_code: "family_strategy_decision_basis",
  });

  return {
    status: "completed", // approval is the separate request_approval step (D-P2-3)
    output_refs: [workflowRunRef(input), artifactRef(input, "family_strategy_summary"), familyRefToCanonical(familyRef)],
    artifact_drafts: [
      artifactDraft(input, "family_strategy_summary", "Family strategy", "Reviewable strategy from charter boundaries and family calibration."),
    ],
    event_drafts: [eventDraft(input, "workflow.step.completed"), eventDraft(input, "workflow.artifact.created")],
  };
};

export const makeGenerateCarePlan = (deps: NurtureHandlerDeps): WorkflowStepHandler => async (input) => {
  const ws = input.meta.workspace_id;
  const project = await deps.repositories.projects.getByWorkflowRunId({ workspace_id: ws, workflow_run_id: input.run_id });
  if (!project) return manualReview(input, "project_not_bound");

  const snap = await deps.canonicalResolver.resolveObject({ workspace_id: ws, object_type: "family", object_id: project.family_ref_key });
  const sf = snap?.safe_fields ?? {};
  const plan = deriveCarePlan({
    issue_type: (project.issue_type as IssueType) ?? "custom",
    requested_window_days: typeof sf.trial_window_days === "number" ? (sf.trial_window_days as number) : undefined,
    parent_bandwidth: typeof sf.parent_bandwidth === "number" ? (sf.parent_bandwidth as number) : undefined,
    overload_risk: typeof sf.overload_risk === "number" ? (sf.overload_risk as number) : undefined,
    safety_boundary_hint: "none",
  });

  try {
    await deps.repositories.projects.updatePlanPayloads({
      workspace_id: ws,
      project_id: project.project_id,
      expected_version: project.aggregate_version,
      baseline_payload: plan.baseline_payload,
      plan_payload: plan.plan_payload,
      measurement_plan_payload: plan.measurement_plan_payload,
      capture_prompt_payload: plan.capture_prompt_payload,
      status: "active",
    });
  } catch {
    return manualReview(input, "version_conflict", [eventDraft(input, "workflow.step.retry_requested")]);
  }

  return {
    status: "completed",
    output_refs: [workflowRunRef(input), artifactRef(input, "care_plan_summary")],
    artifact_drafts: [
      artifactDraft(
        input,
        "care_plan_summary",
        "Short-term care plan",
        `${plan.plan_payload.trial_window_days}-day ${project.issue_type} rule trial (${plan.plan_payload.rules.length} rule(s)).`,
      ),
    ],
    event_drafts: [eventDraft(input, "workflow.step.completed"), eventDraft(input, "workflow.artifact.created")],
  };
};

export const makeCompareActivities = (deps: NurtureHandlerDeps): WorkflowStepHandler => async (input) => {
  const ws = input.meta.workspace_id;
  const comparisonId = `${input.run_id}:activity_comparison`;
  const draft = await deps.repositories.activityComparisons.getDraft({ workspace_id: ws, comparison_id: comparisonId });
  if (!draft) return { status: "retry_requested", output_refs: [workflowRunRef(input)], reason_code: "comparison_draft_missing", event_drafts: [eventDraft(input, "workflow.step.retry_requested")] };

  const options: ActivityOption[] = [];
  for (const ref of draft.option_refs) {
    const snap = await deps.canonicalResolver.resolveObject({ workspace_id: ws, object_type: "activity_option", object_id: ref.id });
    const sf = (snap?.safe_fields ?? {}) as { scores?: Partial<Record<ComparisonCriterion, number>>; hard_constraint_violation?: boolean };
    options.push({ option_ref_id: ref.id, scores: sf.scores ?? {}, hard_constraint_violation: sf.hard_constraint_violation });
  }

  const result = rankActivities(options, draft.weight_override_payload as Record<ComparisonCriterion, number> | undefined);
  await deps.repositories.activityComparisons.saveComputedResult({ workspace_id: ws, comparison_id: comparisonId, computed_result: result });
  const evidenceRef = await deps.repositories.evidence.appendEvidenceRef({
    workspace_id: ws,
    target_ref: workflowRunRef(input),
    evidence_ref: artifactRef(input, "activity_comparison_summary"),
    reason_code: "activity_comparison_inputs",
  });

  return {
    status: "completed",
    output_refs: [workflowRunRef(input), artifactRef(input, "activity_comparison_summary")],
    artifact_drafts: [
      artifactDraft(
        input,
        "activity_comparison_summary",
        "Activity comparison",
        result.top_option_ref_id ? `Top option: ${result.top_option_ref_id} (weighted by goals/constraints/cost/burden/evidence).` : "No eligible option.",
        [evidenceRef],
      ),
    ],
    event_drafts: [
      eventDraft(input, "workflow.step.completed"),
      eventDraft(input, "workflow.artifact.created"),
      eventDraft(input, "nurture.activity_comparison.artifact_generated"),
      eventDraft(input, "workflow.evidence.recorded"),
    ],
  };
};

export const makeRecordReview = (deps: NurtureHandlerDeps): WorkflowStepHandler => async (input) => {
  const ws = input.meta.workspace_id;
  const project = await deps.repositories.projects.getByWorkflowRunId({ workspace_id: ws, workflow_run_id: input.run_id });
  if (!project) return manualReview(input, "project_not_found");

  const familyRef = familyDomainRef(project.family_ref_key);
  const projection = await deps.repositories.profiles.getByCanonicalObjectRef({ workspace_id: ws, canonical_object_ref: familyRef });
  const nextVersion = (projection?.projection_version ?? 0) + 1;

  const reviewSummary = { template_key: project.template_key, issue_type: project.issue_type, outcome: "kept", calibration_note: "Trends only; no parent rating or child score." };
  const learningOutput = { keep: [`consistent ${project.issue_type} cue`], drop: [], confidence: "moderate" };

  // Auto-apply the scenario-local profile projection (D-C); charter stays a proposal.
  try {
    await deps.repositories.profiles.upsertProjection({
      profile_id: projection?.profile_id ?? `${ws}:family-profile`,
      workspace_id: ws,
      canonical_object_ref: familyRef,
      scenario_key: "nurture",
      projection_version: nextVersion,
      safe_summary: `Latest rule-trial learning for ${project.issue_type}.`,
    });
  } catch {
    return manualReview(input, "projection_version_conflict", [eventDraft(input, "workflow.step.retry_requested")]);
  }

  try {
    await deps.repositories.projects.updateReviewPayloads({
      workspace_id: ws,
      project_id: project.project_id,
      expected_version: project.aggregate_version,
      review_summary_payload: reviewSummary,
      learning_output_payload: learningOutput,
      profile_update_proposal_payload: { applied: true, projection_version: nextVersion },
      charter_update_proposal_payload: { proposed: false },
    });
  } catch {
    return manualReview(input, "version_conflict", [eventDraft(input, "workflow.step.retry_requested")]);
  }

  const evidenceRef = await deps.repositories.evidence.appendEvidenceRef({
    workspace_id: ws,
    target_ref: workflowRunRef(input),
    evidence_ref: artifactRef(input, "execution_review_summary"),
    reason_code: "execution_review_outcome",
  });

  return {
    status: "completed",
    output_refs: [workflowRunRef(input), artifactRef(input, "execution_review_summary")],
    artifact_drafts: [
      artifactDraft(input, "execution_review_summary", "Execution review", "Outcome review with learning output; profile projection updated by family ref.", [evidenceRef]),
    ],
    event_drafts: [
      eventDraft(input, "workflow.step.completed"),
      eventDraft(input, "workflow.artifact.created"),
      eventDraft(input, "workflow.evidence.recorded"),
      eventDraft(input, "nurture.profile.snapshot_attached"),
    ],
  };
};

export const makeApplyMedicalSafetyGate = (deps: NurtureHandlerDeps): WorkflowStepHandler => async (input) => {
  const ws = input.meta.workspace_id;
  const material = await deps.canonicalResolver.resolveRunMaterial({ workspace_id: ws, run_id: input.run_id });
  const classification = classifySafetyIntent({
    normalized_intent_summary: material.normalized_intent_summary,
    health_or_safety_material: material.health_or_safety_material,
    safety_boundary_acknowledged: material.safety_boundary_acknowledged,
  });

  const sourceRefs: CanonicalRef[] = [];
  if (classification.requires_escalation) {
    const evidenceRef = await deps.repositories.evidence.appendEvidenceRef({
      workspace_id: ws,
      target_ref: workflowRunRef(input),
      evidence_ref: { kind: "context_snapshot", id: `${input.run_id}:health_safety_escalation`, version: input.expected_step_version },
      reason_code: "health_safety_escalation_reason",
    });
    sourceRefs.push(evidenceRef);
  }

  const draft = artifactDraft(
    input,
    "health_state_summary",
    "Health-state safety boundary",
    "Non-diagnostic, non-prescriptive, non-emergency-replacement. Escalate diagnostic / medication / emergency decisions to qualified care.",
    sourceRefs,
  );

  if (classification.requires_escalation) {
    return {
      status: "manual_review_required",
      output_refs: [workflowRunRef(input), artifactRef(input, "health_state_summary")],
      reason_code: classification.reason_code,
      artifact_drafts: [draft],
      event_drafts: [
        eventDraft(input, "workflow.artifact.created"),
        eventDraft(input, "workflow.step.manual_review_required", { reason_code: classification.reason_code }),
        // scenario_internal: MUST NOT reach chat/forum/knowledge consumers (manifest forbidden_events).
        eventDraft(input, "nurture.health_state.safety_escalated", { reason_code: classification.reason_code }),
      ],
    };
  }

  return {
    status: "completed",
    output_refs: [workflowRunRef(input), artifactRef(input, "health_state_summary")],
    artifact_drafts: [draft],
    event_drafts: [eventDraft(input, "workflow.step.completed"), eventDraft(input, "workflow.artifact.created")],
  };
};

// write_artifact finalizes the prior domain step's draft (no new draft here).
export const makeWriteArtifact = (_deps: NurtureHandlerDeps): WorkflowStepHandler => async (input) => ({
  status: "completed",
  output_refs: [workflowRunRef(input)],
  event_drafts: [eventDraft(input, "workflow.step.completed")],
});

export const makeRequestApproval = (_deps: NurtureHandlerDeps): WorkflowStepHandler => async (input) => ({
  status: "manual_review_required",
  output_refs: [workflowRunRef(input)],
  reason_code: "guardian_approval_required",
  event_drafts: [eventDraft(input, "workflow.approval.requested"), eventDraft(input, "workflow.step.manual_review_required", { reason_code: "guardian_approval_required" })],
});

export const makeRequestHandoff = (_deps: NurtureHandlerDeps): WorkflowStepHandler => async (input) => ({
  status: "completed",
  output_refs: [workflowRunRef(input), { kind: "workflow_handoff", id: `${input.run_id}:handoff`, version: input.expected_step_version }],
  event_drafts: [eventDraft(input, "workflow.handoff.requested")],
});

const familyRefToCanonical = (ref: DomainContextRef): CanonicalRef => ({
  kind: "domain_context_ref",
  id: `${ref.namespace}.${ref.object_type}.${ref.object_id}`,
  // A domain object ref carries no workflow-aggregate version (the step version
  // would be semantically wrong here); only emit version if the ref resolved one.
  ...(ref.version !== undefined ? { version: ref.version } : {}),
});

// ---------------------------------------------------------------------------
// registry factory + default-deps bare exports (keep journey/conformance green)
// ---------------------------------------------------------------------------

export const createNurtureHandlers = (deps: NurtureHandlerDeps): WorkflowHandlerRegistry => ({
  "nurture.collect_context": makeCollectContext(deps),
  "nurture.evaluate_pregnancy_stage": makeEvaluatePregnancyStage(deps),
  "nurture.calibrate_family_strategy": makeCalibrateFamilyStrategy(deps),
  "nurture.generate_care_plan": makeGenerateCarePlan(deps),
  "nurture.compare_activities": makeCompareActivities(deps),
  "nurture.record_review": makeRecordReview(deps),
  "nurture.write_artifact": makeWriteArtifact(deps),
  "nurture.request_approval": makeRequestApproval(deps),
  "nurture.request_handoff": makeRequestHandoff(deps),
  "nurture.apply_medical_safety_gate": makeApplyMedicalSafetyGate(deps),
});

// Bare exports bound to default (synthetic) deps — used by the journey fixture
// and any importer that doesn't wire a host. The P3 host calls createNurtureHandlers(realDeps).
export const collectContext = makeCollectContext(defaultNurtureDeps);
export const evaluatePregnancyStage = makeEvaluatePregnancyStage(defaultNurtureDeps);
export const calibrateFamilyStrategy = makeCalibrateFamilyStrategy(defaultNurtureDeps);
export const generateCarePlan = makeGenerateCarePlan(defaultNurtureDeps);
export const compareActivities = makeCompareActivities(defaultNurtureDeps);
export const recordReview = makeRecordReview(defaultNurtureDeps);
export const writeArtifact = makeWriteArtifact(defaultNurtureDeps);
export const requestApproval = makeRequestApproval(defaultNurtureDeps);
export const requestHandoff = makeRequestHandoff(defaultNurtureDeps);
export const applyMedicalSafetyGate = makeApplyMedicalSafetyGate(defaultNurtureDeps);

export const nurtureHandlers: WorkflowHandlerRegistry = createNurtureHandlers(defaultNurtureDeps);
