import { randomUUID, timingSafeEqual } from "node:crypto";
import Fastify, { type FastifyInstance } from "fastify";
import type { DomainContextRef, WorkflowCommandMeta } from "@my-chat/workflow-contracts";
import {
  NurtureCaptureExtractionStatus,
  NurtureCaptureInputModality,
  NurtureCaptureSourceSurface,
  NurtureCaptureType,
} from "@the-nurture/db";
import { WorkflowApprovalStatus } from "./db/dev-host-client.js";
import type { NurtureApp } from "./app.js";

const DEFAULT_WORKSPACE = "ws-dev";

/** Fastify HTTP surface mirroring the runtime's route checklist (subset for the first slice). */
const authorized = (header: string | undefined, token: string | undefined): boolean => {
  if (!header || !token || !header.startsWith("Bearer ")) return false;
  const supplied = Buffer.from(header.slice("Bearer ".length), "utf8");
  const expected = Buffer.from(token, "utf8");
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
};

export const buildServer = (
  app: NurtureApp,
  options: { internalServiceToken?: string } = {},
): FastifyInstance => {
  const fastify = Fastify({ logger: false });

  fastify.get("/health", async () => ({ ok: true }));

  fastify.post<{
    Body: {
      workspace_id?: string;
      source_context_refs?: DomainContextRef[];
      actor_user_id?: string;
    };
  }>("/internal/nurture/activation/user-attention/resolve", async (req, reply) => {
    if (!options.internalServiceToken) {
      return reply.code(503).send({ error: "activation_owner_disabled" });
    }
    if (!authorized(req.headers.authorization, options.internalServiceToken)) {
      return reply.code(401).send({ error: "service_auth_required" });
    }
    if (
      !req.body?.workspace_id ||
      !Array.isArray(req.body.source_context_refs)
    ) {
      return reply.code(400).send({ error: "invalid_owner_read_request" });
    }
    return reply.send(
      await app.resolveUserAttention({
        workspace_id: req.body.workspace_id,
        source_context_refs: req.body.source_context_refs,
        ...(req.body.actor_user_id ? { actor_user_id: req.body.actor_user_id } : {}),
      }),
    );
  });

  // POST /api/workflow/runs — start a run (persists run + seeds steps).
  fastify.post<{
    Body: {
      workspace_id?: string;
      actor_id?: string;
      idempotency_key?: string;
      capability_key: string;
      entrypoint_key: string;
      requirement_values?: Record<string, unknown>;
    };
  }>("/api/workflow/runs", async (req, reply) => {
    const body = req.body;
    const workspaceId = body.workspace_id ?? DEFAULT_WORKSPACE;
    const meta: WorkflowCommandMeta = {
      workspace_id: workspaceId,
      actor_id: body.actor_id,
      idempotency_key: body.idempotency_key ?? randomUUID(),
      correlation_id: randomUUID(),
      client_surface: "web_run_workbench",
    };
    const result = await app.command.start_run({
      scenario_key: "nurture",
      capability_key: body.capability_key,
      entrypoint_key: body.entrypoint_key,
      requirement_values: body.requirement_values ?? {},
      meta,
    });
    return reply.code(201).send(result);
  });

  // GET /api/workflow/runs/:run_id — run detail + steps + artifacts.
  fastify.get<{ Params: { run_id: string }; Querystring: { workspace_id?: string } }>(
    "/api/workflow/runs/:run_id",
    async (req, reply) => {
      const workspaceId = req.query.workspace_id ?? DEFAULT_WORKSPACE;
      const run = await app.query.get_run({ workspace_id: workspaceId, run_id: req.params.run_id });
      if (!run) return reply.code(404).send({ error: "run_not_found" });
      const steps = await app.devHostPrisma.workflowStep.findMany({ where: { runId: run.run_id }, orderBy: { stepOrder: "asc" } });
      // exposure-gated previews (ref-only for restricted/L0/L4 artifacts).
      const { artifacts } = await app.presenters.web_run_workbench({ workspace_id: workspaceId, run_id: run.run_id });
      // Authoritative "awaiting approval" signal for the UI: a pending approval
      // row (not just a manual_review_required step — collect_context can pause
      // for missing data without one).
      const pendingApproval = await app.devHostPrisma.workflowApproval.findFirst({
        where: { runId: run.run_id, workspaceId, status: WorkflowApprovalStatus.pending },
      });
      return reply.send({
        run,
        steps: steps.map((s) => ({ step_key: s.stepKey, step_order: s.stepOrder, status: s.status, aggregate_version: s.aggregateVersion })),
        artifacts,
        pending_approval: Boolean(pendingApproval),
      });
    },
  );

  // POST /api/workflow/actions — strong-confirmed actions (approve/reject/cancel).
  fastify.post<{ Body: { workspace_id?: string; run_id: string; action: string; reason_code?: string } }>(
    "/api/workflow/actions",
    async (req, reply) => {
      const result = await app.actions.execute({
        workspace_id: req.body.workspace_id ?? DEFAULT_WORKSPACE,
        run_id: req.body.run_id,
        action: req.body.action,
        reason_code: req.body.reason_code,
      });
      return reply.code(result.ok ? 200 : 409).send(result);
    },
  );

  // GET /api/workflow/runs/:run_id/artifacts
  fastify.get<{ Params: { run_id: string }; Querystring: { workspace_id?: string } }>(
    "/api/workflow/runs/:run_id/artifacts",
    async (req) => {
      const workspaceId = req.query.workspace_id ?? DEFAULT_WORKSPACE;
      const { artifacts } = await app.presenters.web_run_workbench({ workspace_id: workspaceId, run_id: req.params.run_id });
      return artifacts;
    },
  );

  // GET /api/workflow/artifacts/:artifact_id/preview — exposure-gated.
  fastify.get<{ Params: { artifact_id: string } }>("/api/workflow/artifacts/:artifact_id/preview", async (req, reply) => {
    const preview = await app.presenters.artifact_preview({ artifact_id: req.params.artifact_id });
    if (preview.unavailable_reason === "artifact_not_found") return reply.code(404).send({ error: "artifact_not_found" });
    return reply.send(preview);
  });

  // ---- scenario-owned internal API (web_domain_workbench) ----
  const repos = app.scenarioRepositories;
  const familyRefOf = (key: string) => ({ service: "my_chat", object_type: "family", object_id: key });

  // POST /internal/nurture/projects — create a family_rule_trial project, optionally bound to a run.
  fastify.post<{
    Body: {
      workspace_id?: string;
      family_ref_key: string;
      issue_type: string;
      template_key?: string;
      workflow_run_id?: string;
      primary_child_ref_key?: string;
    };
  }>("/internal/nurture/projects", async (req, reply) => {
    const ws = req.body.workspace_id ?? DEFAULT_WORKSPACE;
    const project = await repos.workflowProjects.create({
      workspaceId: ws,
      familyRefKey: req.body.family_ref_key,
      familyRef: familyRefOf(req.body.family_ref_key),
      primaryChildRefKey: req.body.primary_child_ref_key,
      templateKey: req.body.template_key ?? "family_rule_trial",
      issueType: req.body.issue_type as never,
      status: "confirmed",
      workflowRunId: req.body.workflow_run_id,
    });
    return reply.code(201).send({ project_id: project.id, workflow_run_id: project.workflowRunId, issue_type: project.issueType });
  });

  // GET /internal/nurture/projects — list (workbench project list page).
  fastify.get<{ Querystring: { workspace_id?: string; family_ref_key?: string } }>("/internal/nurture/projects", async (req) => {
    const ws = req.query.workspace_id ?? DEFAULT_WORKSPACE;
    const projects = req.query.family_ref_key
      ? await repos.workflowProjects.listByFamily(ws, req.query.family_ref_key)
      : await app.nurturePrisma.nurtureWorkflowProject.findMany({ where: { workspaceId: ws, deletedAt: null }, orderBy: { updatedAt: "desc" } });
    return projects.map((p) => ({
      project_id: p.id,
      issue_type: p.issueType,
      status: p.status,
      workflow_run_id: p.workflowRunId,
      family_ref_key: p.familyRefKey,
      title: p.title ?? null,
      updated_at: p.updatedAt,
    }));
  });

  // GET /internal/nurture/projects/:project_id — detail + timeline.
  fastify.get<{ Params: { project_id: string }; Querystring: { workspace_id?: string } }>("/internal/nurture/projects/:project_id", async (req, reply) => {
    const ws = req.query.workspace_id ?? DEFAULT_WORKSPACE;
    const project = await repos.workflowProjects.findById(req.params.project_id);
    // Workspace isolation: a project from another workspace must not be readable
    // by guessing its UUID (the sibling list/create/append routes all scope by ws).
    if (!project || project.workspaceId !== ws) return reply.code(404).send({ error: "project_not_found" });
    const [captures, checkpoints, reviews] = await Promise.all([
      repos.captures.listByProject(project.id),
      repos.checkpoints.listByProject(project.id),
      repos.reviews.listByProject(project.id),
    ]);
    return reply.send({
      project: { project_id: project.id, issue_type: project.issueType, status: project.status, workflow_run_id: project.workflowRunId },
      captures: captures.map((c) => ({ id: c.id, capture_type: c.captureType, captured_at: c.capturedAt })),
      checkpoints: checkpoints.map((c) => ({ id: c.id, scheduled_at: c.scheduledAt })),
      reviews: reviews.map((r) => ({ id: r.id, completed_at: r.completedAt })),
    });
  });

  // POST /internal/nurture/projects/:project_id/captures
  fastify.post<{ Params: { project_id: string }; Body: { workspace_id?: string; family_ref_key: string; capture_type?: string; raw_input_text?: string } }>(
    "/internal/nurture/projects/:project_id/captures",
    async (req, reply) => {
      const c = await repos.captures.append({
        workspaceId: req.body.workspace_id ?? DEFAULT_WORKSPACE,
        projectId: req.params.project_id,
        familyRefKey: req.body.family_ref_key,
        captureType: (req.body.capture_type as NurtureCaptureType) ?? NurtureCaptureType.rule_execution,
        sourceSurface: NurtureCaptureSourceSurface.web_workbench,
        inputModality: NurtureCaptureInputModality.form,
        extractionStatus: NurtureCaptureExtractionStatus.extracted,
        rawInputText: req.body.raw_input_text,
      });
      return reply.code(201).send({ capture_id: c.id });
    },
  );

  // POST /internal/nurture/projects/:project_id/checkpoints
  fastify.post<{ Params: { project_id: string }; Body: { workspace_id?: string; family_ref_key: string; checkpoint_payload?: unknown } }>(
    "/internal/nurture/projects/:project_id/checkpoints",
    async (req, reply) => {
      const c = await repos.checkpoints.create({
        workspaceId: req.body.workspace_id ?? DEFAULT_WORKSPACE,
        projectId: req.params.project_id,
        familyRefKey: req.body.family_ref_key,
        checkpointPayload: (req.body.checkpoint_payload ?? {}) as never,
      });
      return reply.code(201).send({ checkpoint_id: c.id });
    },
  );

  // POST /internal/nurture/projects/:project_id/reviews
  fastify.post<{ Params: { project_id: string }; Body: { workspace_id?: string; family_ref_key: string; review_summary_payload?: unknown; learning_output_payload?: unknown } }>(
    "/internal/nurture/projects/:project_id/reviews",
    async (req, reply) => {
      const r = await repos.reviews.create({
        workspaceId: req.body.workspace_id ?? DEFAULT_WORKSPACE,
        projectId: req.params.project_id,
        familyRefKey: req.body.family_ref_key,
        reviewSummaryPayload: (req.body.review_summary_payload ?? {}) as never,
        learningOutputPayload: (req.body.learning_output_payload ?? {}) as never,
      });
      return reply.code(201).send({ review_id: r.id });
    },
  );

  return fastify;
};
