import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { createNurtureApp } from "../src/app.js";
import { buildServer } from "../src/server.js";

// Regressions for the P3 audit fixes.
describe("P3 audit fixes", () => {
  const app = createNurtureApp();
  const server = buildServer(app);

  afterAll(async () => {
    await server.close();
    await app.disconnect();
  });

  it("a retry_requested step (missing comparison draft) halts instead of hanging the run", async () => {
    const ws = `ws-${randomUUID()}`;
    const familyId = `${ws}:family`;
    const start = await server.inject({
      method: "POST",
      url: "/api/workflow/runs",
      payload: {
        workspace_id: ws,
        capability_key: "activity_comparison",
        entrypoint_key: "compare_activity_options",
        requirement_values: {
          context_refs: [{ namespace: "my_chat", object_type: "family", object_id: familyId, owner_scope: "workspace", canonical_ref: { service: "my_chat", object_type: "family", object_id: familyId } }],
        },
      },
    });
    const runId = (start.json() as { data: { run_id: string } }).data.run_id;

    // no activity-comparison draft was seeded -> compare_activities returns
    // retry_requested. drain MUST terminate (not hang) and the step ends failed.
    await app.dispatcher.drain(runId);

    const steps = await app.devHostPrisma.workflowStep.findMany({ where: { runId } });
    const compare = steps.find((s) => s.stepKey === "compare_activities");
    expect(compare?.status).toBe("failed");
    expect(compare?.reasonCode).toBe("retry_exhausted");
    // downstream steps never ran
    expect(steps.find((s) => s.stepKey === "write_artifact")?.status).toBe("pending");
  });

  it("artifact preview route is exposure-gated (L4 artifact renders ref-only via the presenter)", async () => {
    const ws = `ws-${randomUUID()}`;
    // a run row to satisfy the artifact FK
    const start = await server.inject({
      method: "POST",
      url: "/api/workflow/runs",
      payload: { workspace_id: ws, capability_key: "pregnancy_stage_management", entrypoint_key: "create_pregnancy_stage_plan", requirement_values: {} },
    });
    const runId = (start.json() as { data: { run_id: string } }).data.run_id;

    // seed an artifact persisted at L4 (never-exposable) with safe fields present
    const artifact = await app.devHostPrisma.workflowArtifact.create({
      data: { runId, workspaceId: ws, artifactType: "health_state_summary", exposureLevel: "L4", safeTitle: "SECRET_TITLE", safeSummary: "SECRET_BODY", status: "created", aggregateVersion: 1 },
    });

    const res = await server.inject({ method: "GET", url: `/api/workflow/artifacts/${artifact.id}/preview` });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { unavailable_reason?: string; safe_title?: string; safe_summary?: string };
    expect(body.unavailable_reason).toBe("exposure_level_restricted");
    expect(body.safe_title).toBeUndefined();
    expect(body.safe_summary).toBeUndefined();
  });

  it("cancel revokes an already-approved approval (run no longer reports guardian-approved)", async () => {
    const ws = `ws-${randomUUID()}`;
    const familyId = `${ws}:family`;
    const start = await server.inject({
      method: "POST",
      url: "/api/workflow/runs",
      payload: {
        workspace_id: ws,
        capability_key: "family_strategy",
        entrypoint_key: "calibrate_family_strategy",
        requirement_values: { context_refs: [{ namespace: "my_chat", object_type: "family", object_id: familyId, owner_scope: "workspace", canonical_ref: { service: "my_chat", object_type: "family", object_id: familyId } }], issue_type: "bedtime" },
      },
    });
    const runId = (start.json() as { data: { run_id: string } }).data.run_id;
    await app.scenarioRepositories.workflowProjects.create({
      workspaceId: ws, familyRefKey: familyId, familyRef: { service: "my_chat", object_type: "family", object_id: familyId }, templateKey: "family_rule_trial", issueType: "bedtime", status: "confirmed", workflowRunId: runId,
    });
    await app.dispatcher.drain(runId);
    await server.inject({ method: "POST", url: "/api/workflow/actions", payload: { workspace_id: ws, run_id: runId, action: "approve" } });
    // now cancel — the prior approval must be revoked
    await server.inject({ method: "POST", url: "/api/workflow/actions", payload: { workspace_id: ws, run_id: runId, action: "cancel" } });

    const approvals = await app.devHostPrisma.workflowApproval.findMany({ where: { runId, workspaceId: ws } });
    expect(approvals.every((a) => a.status !== "approved")).toBe(true);
  });
});
