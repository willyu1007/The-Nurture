export type WorkflowSurface =
  | "chat_workflow_control"
  | "chat_dashboard_summary"
  | "chat_citation"
  | "web_domain_workbench"
  | "web_run_workbench"
  | "mobile_dashboard"
  | "forum_publication"
  | "rag_knowledge"
  | "notification_push"
  | "admin_operator"
  | "worker_runtime"
  | "api";

export type WorkflowExposureLevel = "L0" | "L1" | "L2" | "L3" | "L4";
export type WorkflowActivationTarget = "dev" | "pilot" | "ga" | "disabled";
export type WorkflowScenarioStatus = "draft" | "pilot" | "active" | "disabled" | "archived";

export type CanonicalRef = {
  kind:
    | "scenario"
    | "capability"
    | "workflow_version"
    | "workflow_run"
    | "workflow_step"
    | "workflow_artifact"
    | "workflow_approval"
    | "workflow_handoff"
    | "domain_context_ref"
    | "context_snapshot"
    | "downstream_object";
  id: string;
  version?: number;
};

export type DomainContextRef = {
  namespace: string;
  consumer_scenario_key?: string;
  object_type: string;
  object_id: string;
  version?: number;
  owner_scope: "workspace" | "organization" | "platform" | "external";
  canonical_ref?: {
    service: string;
    object_type: string;
    object_id: string;
  };
};

export type WorkflowCommandMeta = {
  workspace_id: string;
  actor_id?: string;
  idempotency_key: string;
  correlation_id: string;
  trace_id?: string;
  client_surface: WorkflowSurface;
};

export type WorkflowActionAvailability = {
  action: string;
  available: boolean;
  reason_code: string;
  target_type: string;
  target_id: string;
  expected_version?: number;
};

export type WorkflowRunRef = {
  run_id: string;
  scenario_key: string;
  capability_key: string;
  entrypoint_key: string;
  workflow_version_id: string;
  status: string;
  aggregate_version: number;
};

export type WorkflowCommandResponse<T> = {
  ok: true;
  data: T;
  canonical_refs: CanonicalRef[];
  aggregate_versions: Record<string, number>;
  action_availability: WorkflowActionAvailability[];
  outbox_event_ids: string[];
};

export type WorkflowArtifactDraft = {
  artifact_type: string;
  exposure_level: WorkflowExposureLevel;
  source_refs: CanonicalRef[];
  storage_ref?: CanonicalRef;
  safe_title?: string;
  safe_summary?: string;
};

export type ContextBindingDraft = {
  target_ref: CanonicalRef;
  context_refs: DomainContextRef[];
  snapshot_refs: CanonicalRef[];
  expected_versions?: Record<string, number>;
};

export type WorkflowSignalPayload = {
  body: "no_body";
  pii: "no_pii";
  signal_version: 1;
  run_id?: string;
  step_id?: string;
  artifact_id?: string;
  scenario_key?: string;
  capability_key?: string;
  entrypoint_key?: string;
  workflow_version_id?: string;
  target_type?: string;
  target_id?: string;
  source_refs?: CanonicalRef[];
  reason_code?: string;
  client_surface?: string;
};

export type OutboxEventDraft = {
  event_type: string;
  aggregate_type: string;
  aggregate_id: string;
  aggregate_version: number;
  payload: WorkflowSignalPayload;
};

export type WorkflowStepHandlerInput = {
  run_id: string;
  step_id: string;
  step_key: string;
  claim_token?: string;
  expected_step_version?: number;
  scenario_key: string;
  capability_key: string;
  entrypoint_key: string;
  workflow_version_id: string;
  contract_hash: string;
  meta: WorkflowCommandMeta;
};

export type WorkflowStepHandlerResult = {
  status?: "completed" | "retry_requested" | "manual_review_required";
  output_refs: CanonicalRef[];
  artifact_drafts?: WorkflowArtifactDraft[];
  context_bindings?: ContextBindingDraft[];
  event_drafts?: OutboxEventDraft[];
  reason_code?: string;
};

export type WorkflowStepHandler = (input: WorkflowStepHandlerInput) => Promise<WorkflowStepHandlerResult>;
export type WorkflowActionHandler = (
  input: WorkflowStepHandlerInput & { action: string; expected_version: number },
) => Promise<WorkflowCommandResponse<WorkflowRunRef>>;

export type WorkflowHandlerRegistry = Record<string, WorkflowStepHandler>;
export type WorkflowActionRegistry = Record<string, WorkflowActionHandler>;

export type WorkflowStartRequirement = {
  requirement_key: string;
  schema_version: number;
  required: boolean;
  safe_label: string;
  safe_help?: string;
};

export type ChatWorkflowRecommendation = {
  scenario_key: string;
  capability_key: string;
  entrypoint_key: string;
  safe_title: string;
  safe_summary?: string;
  start_requirements: WorkflowStartRequirement[];
};

export type ChatDashboardSummary = {
  safe_title: string;
  safe_summary: string;
  run_refs: CanonicalRef[];
  action_availability: WorkflowActionAvailability[];
};

export type WorkflowArtifactPreview = {
  artifact_id: string;
  run_id: string;
  artifact_type: string;
  exposure_level: WorkflowExposureLevel;
  safe_title?: string;
  safe_summary?: string;
  safe_preview?: string;
  unavailable_reason?: string;
  aggregate_version: number;
};

export type WorkflowDashboardCard = {
  run_id: string;
  scenario_key: string;
  capability_key: string;
  entrypoint_key: string;
  title: string;
  status: string;
  requires_attention: boolean;
  action_availability: WorkflowActionAvailability[];
  aggregate_version: number;
};

export type WorkflowMobileSummary = {
  run: WorkflowRunRef;
  cards: WorkflowDashboardCard[];
  action_availability: WorkflowActionAvailability[];
};

export type WorkflowRunWorkbench = {
  run: WorkflowRunRef;
  artifacts: WorkflowArtifactPreview[];
  action_availability: WorkflowActionAvailability[];
};

export type WorkflowActionCommand = {
  workspace_id: string;
  actor_id?: string;
  action: string;
  target_ref: CanonicalRef;
  expected_version: number;
  reason_code: string;
  meta: WorkflowCommandMeta;
  client_surface: string;
  reason_text?: string;
};

export type WorkflowActionResult = {
  target: CanonicalRef;
  run?: WorkflowRunRef;
  affected_refs: CanonicalRef[];
  action_availability: WorkflowActionAvailability[];
};

export type WorkflowAdminSummary = {
  scenario_key?: string;
  capability_key?: string;
  status: string;
  findings?: unknown[];
};

export type WorkflowEvidenceView = {
  evidence_refs: CanonicalRef[];
  safe_summary: string;
};

export type WorkflowStepLease = {
  run_id: string;
  step_id: string;
  step_key: string;
  claim_token: string;
  aggregate_version: number;
  expires_at: string;
};

export type HandoffRequestInput = {
  workspace_id: string;
  actor_id?: string;
  handoff_type: string;
  source_artifact_ref: CanonicalRef;
  requested_purpose: string;
  meta: WorkflowCommandMeta;
};

export type WorkflowHandoffResult = {
  handoff_ref: CanonicalRef;
  receipt_required: boolean;
  downstream_owner: string;
};

export type ChatWorkflowAdapter = {
  recommend(input: {
    workspace_id: string;
    actor_id?: string;
    thread_id: string;
    message_id?: string;
    purpose: string;
    max_results?: number;
  }): Promise<ChatWorkflowRecommendation[]>;
  start_run(input: {
    workspace_id: string;
    actor_id?: string;
    scenario_key: string;
    capability_key: string;
    entrypoint_key: string;
    requirement_values: Record<string, unknown>;
    context_refs: DomainContextRef[];
    meta: WorkflowCommandMeta;
  }): Promise<WorkflowCommandResponse<WorkflowRunRef>>;
  execute_strong_confirmed_action(input: {
    workspace_id: string;
    actor_id?: string;
    action: "approve" | "reject" | "confirm";
    target_ref: CanonicalRef;
    expected_version: number;
    reason_code: string;
    meta: WorkflowCommandMeta;
  }): Promise<WorkflowCommandResponse<WorkflowRunRef>>;
  summarize_dashboard(input: { workspace_id: string; actor_id?: string; limit?: number }): Promise<ChatDashboardSummary>;
};

export type WorkflowRunWorkbenchAdapter = {
  get_run_detail(input: { workspace_id: string; actor_id?: string; run_id: string }): Promise<WorkflowRunWorkbench>;
  execute_action(input: WorkflowActionCommand): Promise<WorkflowActionResult>;
  get_artifact_preview(input: {
    workspace_id: string;
    actor_id?: string;
    artifact_id?: string;
    requested_level: WorkflowExposureLevel;
  }): Promise<WorkflowArtifactPreview>;
  create_handoff(input: HandoffRequestInput): Promise<WorkflowHandoffResult>;
};

export type WorkflowDashboardAdapter = {
  list_cards(input: { workspace_id: string; actor_id?: string; status?: string; limit?: number }): Promise<WorkflowDashboardCard[]>;
  get_run_summary(input: { workspace_id: string; actor_id?: string; run_id: string }): Promise<WorkflowMobileSummary>;
  execute_action(input: WorkflowActionCommand): Promise<WorkflowActionResult>;
};

export type WorkflowAdminAdapter = {
  validate_module(input: { scenario_key: string; activation_target: string }): Promise<WorkflowAdminSummary>;
  publish_version(input: {
    scenario_key: string;
    capability_key?: string;
    manifest_version: number;
    contract_hash: string;
    dry_run: boolean;
    change_summary: string;
  }): Promise<WorkflowAdminSummary>;
  disable_capability(input: {
    scenario_key: string;
    capability_key: string;
    reason_code: string;
  }): Promise<WorkflowAdminSummary>;
  get_evidence(input: { workspace_id: string; actor_id?: string; target_ref: CanonicalRef }): Promise<WorkflowEvidenceView>;
};

export type WorkflowRuntimePort = {
  claim_step(input: {
    run_id: string;
    step_id: string;
    expected_version: number;
    worker_id: string;
    meta: WorkflowCommandMeta;
  }): Promise<WorkflowStepLease>;
  complete_step(input: {
    run_id: string;
    step_id: string;
    expected_version: number;
    status?: "completed" | "retry_requested" | "manual_review_required";
    output_refs: CanonicalRef[];
    artifact_drafts?: WorkflowArtifactDraft[];
    context_bindings?: ContextBindingDraft[];
    event_drafts?: OutboxEventDraft[];
    meta: WorkflowCommandMeta;
  }): Promise<WorkflowCommandResponse<{ run_id: string; step_id: string; status: string; aggregate_version: number; output_refs: CanonicalRef[] }>>;
  fail_step(input: {
    run_id: string;
    step_id: string;
    expected_version: number;
    reason_code: string;
    retryable: boolean;
    meta: WorkflowCommandMeta;
  }): Promise<WorkflowCommandResponse<{ run_id: string; step_id: string; status: string; aggregate_version: number; output_refs: CanonicalRef[] }>>;
};

export type WorkflowSurfaceAdapters = {
  chat_workflow_control: ChatWorkflowAdapter;
  web_run_workbench: WorkflowRunWorkbenchAdapter;
  mobile_dashboard: WorkflowDashboardAdapter;
  admin_operator: WorkflowAdminAdapter;
  worker_runtime: WorkflowRuntimePort;
};

export type WorkflowPresenters = {
  chat_dashboard_summary(input: { workspace_id: string; actor_id?: string }): Promise<ChatDashboardSummary>;
  dashboard_card(input: { run_id: string; actor_id?: string }): Promise<WorkflowDashboardCard>;
  artifact_preview(input: { artifact_id: string; actor_id?: string }): Promise<WorkflowArtifactPreview>;
  mobile_summary(input: { workspace_id: string; actor_id?: string; run_id: string }): Promise<WorkflowMobileSummary>;
  web_run_workbench(input: { workspace_id: string; actor_id?: string; run_id: string }): Promise<WorkflowRunWorkbench>;
};

export type WorkflowPolicies = Record<string, (input: Record<string, unknown>) => Promise<boolean>>;

export type WorkflowInternalApiHandler = (input: {
  method: string;
  path: string;
  payload: unknown;
  meta: WorkflowCommandMeta;
}) => Promise<unknown>;

export type WorkflowInternalApiRegistry = Record<string, WorkflowInternalApiHandler>;

export type ManifestStep = {
  step_key: string;
  step_type: string;
  order: number;
  handler_key: string;
  retry_policy: "none" | "bounded_exponential" | string;
  timeout_ms?: number;
};

export type ManifestEntrypoint = {
  entrypoint_key: string;
  label: string;
  workflow_version: number;
  workflow_version_id?: string;
  input_schema_version: number;
  output_schema_version: number;
  allowed_step_types: string[];
  steps: ManifestStep[];
};

export type ManifestCapability = {
  capability_key: string;
  label: string;
  description: string;
  enablement_policy: string;
  entrypoints: ManifestEntrypoint[];
};

export type ScenarioManifest = {
  manifest_version: number;
  scenario_key: string;
  scenario_record: {
    display_name: string;
    required_status: WorkflowScenarioStatus;
    owner_team: string;
    policy_version: number;
  };
  owner: string;
  launch_phase: WorkflowActivationTarget;
  allowed_user_classes: string[];
  capabilities: ManifestCapability[];
  scenario_data: {
    context_ref_types: Array<{
      namespace: string;
      object_type: string;
      resolver_key: string;
      owner_scope: "workspace" | "organization" | "platform" | "external";
      canonical_required: boolean;
      scenario_local_allowed: boolean;
      snapshot_required: boolean;
    }>;
    run_start_requirements: Array<{
      requirement_key: string;
      schema_version: number;
      entrypoints: string[];
      surfaces: WorkflowSurface[];
      required: boolean;
    }>;
    step_interventions: Array<{
      intervention_type: string;
      schema_version: number;
      step_keys: string[];
      surface: "web_run_workbench";
      handler_key: string;
    }>;
  };
  artifact_policy: {
    artifact_types: string[];
    exposure_levels: Record<WorkflowExposureLevel, string[]>;
    handoff_eligible: Record<string, string[]>;
  };
  action_availability: {
    shared_actions: string[];
    scenario_actions: string[];
    expected_version_required: boolean;
  };
  handoffs: Array<{
    handoff_type: string;
    source_artifact_types: string[];
    requested_purposes: string[];
    downstream_owner: string;
    policy_key: string;
    receipt_required: boolean;
  }>;
  surface_mapping: Record<string, Record<string, unknown>>;
  internal_api: {
    routes: Array<{
      method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
      path: string;
      owner_surface: "web_domain_workbench" | "web_run_workbench" | "admin_operator";
      command_class: "scenario_internal" | "workflow_fact_write";
      writes_workflow_facts: boolean;
      handler_key: string;
    }>;
  };
  event_registry: {
    standard_workflow_events: string[];
    scenario_internal_events: string[];
    event_payload_policy: {
      signal_version: 1;
      body: "no_body";
      pii: "no_pii";
      status_in_payload: false;
      presenter_output_in_payload: false;
      idempotency_key: string;
    };
    producers: Record<string, { owner: string; write_boundary: "same_transaction" | "scenario_internal" | "downstream_owner" }>;
    consumers: Record<string, { allowed_events: string[]; forbidden_events?: string[] }>;
  };
  governance: {
    admin_actions: string[];
    rollback: string;
    projection_review_required: boolean;
    evidence_records: string[];
    outbox_events: string[];
  };
  verification: {
    deterministic_tests: string[];
    journey_harness: string;
  };
};

export type WorkflowScenarioModule = {
  manifest: ScenarioManifest;
  handlers: WorkflowHandlerRegistry;
  actions: WorkflowActionRegistry;
  adapters: WorkflowSurfaceAdapters;
  presenters: WorkflowPresenters;
  policies: WorkflowPolicies;
  internal_api_handlers: WorkflowInternalApiRegistry;
};
