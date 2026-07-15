import type {
  CanonicalRef,
  DomainContextRef,
  ScenarioCommandDriverContext,
  ScenarioHandoffRequestSnapshot,
  WorkflowExposureLevel,
  WorkflowHandoffDraft,
  WorkflowStepHandlerInput,
} from "@my-chat/workflow-contracts";
import type {
  ActivityComparisonDraft,
  NurtureRepositories,
  NurtureWorkflowProject,
} from "./repositories.js";
import type { FamilyInputRoutePayload } from "./domain/institution/family-care-transaction.js";
import {
  createInMemoryInteractionContextRepository,
  createInMemoryInstitutionContextRepository,
  createInMemoryFamilyCareQueryRepository,
  createInMemoryNurtureCommandRepository,
} from "./domain/testing/in-memory-institution-ports.js";
import type { NurtureInstitutionWorkflowTelemetry } from "./observability/institution-workflow-telemetry.js";

// ---------------------------------------------------------------------------
// Injected ports. Handlers/policies/presenters are pure functions that close
// over these via factories (createNurtureHandlers(deps), ...). The business
// layer never imports Prisma; the P3 host wires nurture-db + a real resolver.
// ---------------------------------------------------------------------------

export type CanonicalSnapshot = {
  canonical_ref: { service: string; object_type: string; object_id: string };
  snapshot_id: string;
  version: number;
  object_type: string;
  /** Synthetic in dev; e.g. development_stage_key, gestational_age_weeks, charter split. */
  safe_fields: Record<string, unknown>;
};

export type RunMaterial = {
  normalized_intent_summary?: string;
  issue_type?: string;
  health_or_safety_material?: string[];
  safety_boundary_acknowledged?: boolean;
};

export type ResolvedArtifactFacts = {
  artifact_type: string;
  exposure_level: WorkflowExposureLevel;
  owning_run_id?: string;
  owning_project_id?: string;
};

/** Canonical resolver — NOT in @my-chat/workflow-contracts; a scenario-local port for P2 (revisit in P3). */
export type CanonicalObjectResolver = {
  resolveObject(input: { workspace_id: string; object_type: string; object_id: string }): Promise<CanonicalSnapshot | null>;
  resolveRunMaterial(input: { workspace_id: string; run_id: string }): Promise<RunMaterial>;
  resolveArtifact(input: { workspace_id: string; artifact_id: string }): Promise<ResolvedArtifactFacts | null>;
  resolveApprovalState(input: { workspace_id: string; run_id?: string; project_id?: string }): Promise<{ guardian_approved: boolean } | null>;
};

export type NurtureRunStartContext = {
  context_refs: DomainContextRef[];
  issue_type?: string;
  trial_window_days?: number;
  preferred_rule_style?: string;
  safety_boundary_acknowledged?: boolean;
};

/** Per-run start-requirement values (WorkflowStepHandlerInput carries no payload). */
export type NurtureRunContextPort = {
  getStartRequirements(input: { workspace_id: string; run_id: string }): Promise<NurtureRunStartContext | null>;
};

export type NurtureScenarioCommandBridgePort = {
  createDriverContext(input: WorkflowStepHandlerInput): ScenarioCommandDriverContext;
  createHandoffDrafts(
    snapshots: readonly ScenarioHandoffRequestSnapshot[],
  ): WorkflowHandoffDraft[];
};

export type NurtureFamilyInputWorkflowCommand = {
  invocation_request_id: string;
  command_request_id: string;
  handoff_request_id: string;
  handoff_expires_at?: string;
  payload: FamilyInputRoutePayload;
};

export type NurtureFamilyInputWorkflowPort = {
  resolveCommand(input: {
    workspace_id: string;
    run_id: string;
    step_id: string;
    actor_id?: string;
    correlation_id: string;
  }): Promise<NurtureFamilyInputWorkflowCommand | null>;
};

/**
 * Host-owned read of one persisted Run input. The host treats the value as an
 * opaque scenario payload; parsing and actor binding stay inside Nurture.
 */
export type NurtureFamilyInputWorkflowSeedReader = {
  readSeed(input: {
    workspace_id: string;
    run_id: string;
    step_id: string;
  }): Promise<unknown | null>;
};

/** Host-owned conversion from canonical Actor identity to current My-Chat user identity. */
export type NurtureMyChatActorIdentityReader = {
  resolveMyChatUserId(input: {
    workspace_id: string;
    actor_id: string;
  }): Promise<string | null>;
};

export type NurtureHandlerDeps = {
  repositories: NurtureRepositories;
  canonicalResolver: CanonicalObjectResolver;
  runContext: NurtureRunContextPort;
  /** Host-owned transient bridge; never implemented by scenario business code. */
  scenarioCommandBridge?: NurtureScenarioCommandBridgePort;
  /** Scenario-owned resolver for the refs-only workflow command seed. */
  familyInputWorkflow?: NurtureFamilyInputWorkflowPort;
  /** Backend-neutral numeric telemetry; never receives bodies, ids, or claim evidence. */
  institutionWorkflowTelemetry?: NurtureInstitutionWorkflowTelemetry;
};

// ---------------------------------------------------------------------------
// defaultNurtureDeps — synthetic in-memory deps. Used so the bare handler
// exports + nurtureScenarioModule + journey/conformance tests stay green with
// no host wiring. The P3 host replaces these with nurture-db + a real resolver.
// ---------------------------------------------------------------------------

const familyDomainRef = (workspaceId: string): DomainContextRef => ({
  namespace: "my_chat",
  object_type: "family",
  object_id: `${workspaceId}:family`,
  owner_scope: "workspace",
  canonical_ref: { service: "my_chat", object_type: "family", object_id: `${workspaceId}:family` },
});

const synthDraft = (workspaceId: string, comparisonId: string): ActivityComparisonDraft => ({
  comparison_id: comparisonId,
  workspace_id: workspaceId,
  target_refs: [familyDomainRef(workspaceId)],
  option_refs: [
    { kind: "downstream_object", id: "option-a", version: 1 } as CanonicalRef,
    { kind: "downstream_object", id: "option-b", version: 1 } as CanonicalRef,
  ],
  safe_summary: "synthetic activity comparison draft (default deps)",
});

const synthProject = (
  workspaceId: string,
  projectId: string,
  version: number,
  extra: Partial<NurtureWorkflowProject>,
): NurtureWorkflowProject => ({
  project_id: projectId,
  workspace_id: workspaceId,
  template_key: "family_rule_trial",
  issue_type: "bedtime",
  status: "active",
  family_ref_key: `${workspaceId}:family`,
  aggregate_version: version + 1,
  ...extra,
});

export const defaultNurtureDeps: NurtureHandlerDeps = {
  repositories: {
    commands: createInMemoryNurtureCommandRepository(),
    interactions: createInMemoryInteractionContextRepository(),
    institution: createInMemoryInstitutionContextRepository(),
    familyCareQuery: createInMemoryFamilyCareQueryRepository(),
    profiles: {
      getByCanonicalObjectRef: async () => null,
      upsertProjection: async (input) => input,
    },
    activityComparisons: {
      createDraft: async (input) => input,
      getDraft: async ({ workspace_id, comparison_id }) => synthDraft(workspace_id, comparison_id),
      saveWeightOverride: async ({ workspace_id, comparison_id, weight_override }) => ({
        ...synthDraft(workspace_id, comparison_id),
        weight_override_payload: weight_override,
      }),
      saveComputedResult: async ({ workspace_id, comparison_id, computed_result }) => ({
        ...synthDraft(workspace_id, comparison_id),
        computed_result_payload: computed_result,
      }),
    },
    evidence: {
      appendEvidenceRef: async ({ evidence_ref }) => evidence_ref,
    },
    projects: {
      getByWorkflowRunId: async () => null,
      getById: async () => null,
      updateStrategyPayloads: async ({ workspace_id, project_id, expected_version, goal_payload, constraint_payload }) =>
        synthProject(workspace_id, project_id, expected_version, { goal_payload, constraint_payload }),
      updatePlanPayloads: async ({ workspace_id, project_id, expected_version, ...rest }) =>
        synthProject(workspace_id, project_id, expected_version, rest),
      updateReviewPayloads: async ({ workspace_id, project_id, expected_version, ...rest }) =>
        synthProject(workspace_id, project_id, expected_version, rest),
    },
  },
  canonicalResolver: {
    resolveObject: async ({ object_type, object_id }) => ({
      canonical_ref: { service: "my_chat", object_type, object_id },
      snapshot_id: `${object_id}:snapshot`,
      version: 1,
      object_type,
      safe_fields: {},
    }),
    resolveRunMaterial: async () => ({}),
    resolveArtifact: async () => null,
    resolveApprovalState: async () => null,
  },
  runContext: {
    getStartRequirements: async ({ workspace_id }) => ({
      context_refs: [familyDomainRef(workspace_id)],
      issue_type: "bedtime",
      trial_window_days: 14,
      safety_boundary_acknowledged: true,
    }),
  },
};

// ---------------------------------------------------------------------------
// Presenter deps. Presenters consume ONLY pre-redacted safe_* fields + refs
// (never evidence bodies / raw input / health detail). The host (P3) wires a
// port that reads persisted artifacts; defaultPresenterDeps is synthetic.
// ---------------------------------------------------------------------------

export type ArtifactPreviewFacts = {
  artifact_id: string;
  run_id: string;
  artifact_type: string;
  exposure_level: WorkflowExposureLevel;
  safe_title?: string;
  safe_summary?: string;
  safe_preview?: string;
  aggregate_version: number;
};

export type NurtureArtifactPort = {
  getPreview(input: { artifact_id: string }): Promise<ArtifactPreviewFacts | null>;
  listRunPreviews(input: { workspace_id: string; run_id: string }): Promise<ArtifactPreviewFacts[]>;
};

export type NurturePresenterDeps = { artifacts: NurtureArtifactPort };

const synthPreview = (artifactId: string, runId: string): ArtifactPreviewFacts => ({
  artifact_id: artifactId,
  run_id: runId,
  artifact_type: "activity_comparison_summary",
  exposure_level: "L1",
  safe_title: "Activity comparison",
  safe_summary: "Synthetic preview (default deps).",
  safe_preview: "Summary-only; private evidence stays ref-only.",
  aggregate_version: 1,
});

export const defaultPresenterDeps: NurturePresenterDeps = {
  artifacts: {
    getPreview: async ({ artifact_id }) => synthPreview(artifact_id, artifact_id.split(":")[0] ?? artifact_id),
    listRunPreviews: async ({ run_id }) => [synthPreview(`${run_id}:activity_comparison_summary`, run_id)],
  },
};
