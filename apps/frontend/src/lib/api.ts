// Typed client for the dev host (apps/backend). Server components call BACKEND
// directly; client code uses relative paths proxied by next.config rewrites.
const BACKEND = process.env.NURTURE_BACKEND_URL ?? "http://localhost:3001";

export const DEFAULT_WORKSPACE = "ws-dev";

export type ProjectSummary = {
  project_id: string;
  issue_type: string;
  status: string;
  workflow_run_id: string | null;
  family_ref_key: string;
  title: string | null;
  updated_at: string;
};

export type ProjectTimeline = {
  project: { project_id: string; issue_type: string; status: string; workflow_run_id: string | null };
  captures: { id: string; capture_type: string; captured_at: string }[];
  checkpoints: { id: string; scheduled_at: string | null }[];
  reviews: { id: string; completed_at: string | null }[];
};

export type ArtifactPreview = {
  artifact_id: string;
  run_id: string;
  artifact_type: string;
  exposure_level: string;
  safe_title?: string;
  safe_summary?: string;
  unavailable_reason?: string;
};

export type RunDetail = {
  run: { run_id: string; status: string; capability_key: string; entrypoint_key: string };
  steps: { step_key: string; step_order: number; status: string }[];
  artifacts: ArtifactPreview[];
  /** Authoritative gate signal: a pending workflow_approval exists. */
  pending_approval?: boolean;
};

const get = async <T>(path: string): Promise<T> => {
  const res = await fetch(`${BACKEND}${path}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`${path} -> ${res.status}`);
  return res.json() as Promise<T>;
};

export const listProjects = (workspaceId = DEFAULT_WORKSPACE): Promise<ProjectSummary[]> =>
  get(`/internal/nurture/projects?workspace_id=${encodeURIComponent(workspaceId)}`);

export const getProjectTimeline = (projectId: string): Promise<ProjectTimeline> =>
  get(`/internal/nurture/projects/${encodeURIComponent(projectId)}`);

export const getRunDetail = (runId: string, workspaceId = DEFAULT_WORKSPACE): Promise<RunDetail> =>
  get(`/api/workflow/runs/${encodeURIComponent(runId)}?workspace_id=${encodeURIComponent(workspaceId)}`);

// ---- mutations (client-side) ----
// Client code uses RELATIVE paths so the browser hits the Next origin and the
// next.config rewrites proxy /api/* and /internal/* to the dev host. (Server
// components use BACKEND directly via `get`; the browser must not.)
const post = async <T>(path: string, body: unknown): Promise<T> => {
  const res = await fetch(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${path} -> ${res.status}`);
  return res.json() as Promise<T>;
};

export type CreateProjectInput = {
  family_ref_key: string;
  issue_type: string;
  primary_child_ref_key?: string;
  workflow_run_id?: string;
  workspace_id?: string;
};

/** Start a workflow run; returns the new run id (host wraps the result in `data`). */
export const startRun = async (
  capabilityKey: string,
  entrypointKey: string,
  requirementValues: Record<string, unknown> = {},
  workspaceId = DEFAULT_WORKSPACE,
): Promise<string> => {
  const r = await post<{ data: { run_id: string } }>("/api/workflow/runs", {
    workspace_id: workspaceId,
    capability_key: capabilityKey,
    entrypoint_key: entrypointKey,
    requirement_values: requirementValues,
  });
  return r.data.run_id;
};

/** Create a family_rule_trial project, optionally bound to a run. */
export const createProject = (input: CreateProjectInput): Promise<{ project_id: string; workflow_run_id: string | null; issue_type: string }> =>
  post("/internal/nurture/projects", { workspace_id: DEFAULT_WORKSPACE, ...input });

export type WorkflowActionResult = { ok: boolean; action: string; run_id: string; reason?: string };

/**
 * Host strong-confirmed action on a run. `approve` resolves the pending approval
 * + completes the gate step (dispatcher resumes); `reject` cancels the run.
 * (handoff is a scenario adapter action, not a host action — no UI button.)
 */
export const runAction = (
  runId: string,
  action: "approve" | "reject",
  reasonCode?: string,
  workspaceId = DEFAULT_WORKSPACE,
): Promise<WorkflowActionResult> =>
  post("/api/workflow/actions", { workspace_id: workspaceId, run_id: runId, action, reason_code: reasonCode });
