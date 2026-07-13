import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { createNurtureApp } from "../src/app.js";
import { buildServer } from "../src/server.js";

// Thin vertical: prove the machinery (start_run -> seed steps -> dispatcher ->
// worker claim/complete -> artifact + outbox persisted) end-to-end over HTTP
// against live Postgres. Uses pregnancy_stage (no project dependency, no
// approval pause; the safety gate passes benign material).
describe("thin vertical: pregnancy_stage run end-to-end", () => {
  const app = createNurtureApp();
  const server = buildServer(app);
  const ws = `ws-${randomUUID()}`;

  afterAll(async () => {
    await server.close();
    await app.disconnect();
  });

  it("starts a run, advances all steps, persists the artifact + outbox", async () => {
    const familyId = `${ws}:family`;
    const motherId = `${ws}:mom`;

    const start = await server.inject({
      method: "POST",
      url: "/api/workflow/runs",
      payload: {
        workspace_id: ws,
        capability_key: "pregnancy_stage_management",
        entrypoint_key: "create_pregnancy_stage_plan",
        requirement_values: {
          context_refs: [
            { namespace: "my_chat", object_type: "family", object_id: familyId, owner_scope: "workspace", canonical_ref: { service: "my_chat", object_type: "family", object_id: familyId } },
            { namespace: "my_chat", object_type: "expectant_mother", object_id: motherId, owner_scope: "workspace" },
          ],
          safety_boundary_acknowledged: true,
        },
      },
    });
    expect(start.statusCode).toBe(201);
    const runId = (start.json() as { data: { run_id: string } }).data.run_id;
    expect(runId).toBeTruthy();

    // drive the dispatcher to quiescence
    await app.dispatcher.drain(runId);

    const detail = await server.inject({ method: "GET", url: `/api/workflow/runs/${runId}?workspace_id=${ws}` });
    expect(detail.statusCode).toBe(200);
    const body = detail.json() as {
      run: { status: string };
      steps: { step_key: string; status: string }[];
      artifacts: { artifact_type: string }[];
    };

    expect(body.run.status).toBe("completed");
    expect(body.steps).toHaveLength(4);
    expect(body.steps.every((s) => s.status === "completed")).toBe(true);

    const artifactTypes = body.artifacts.map((a) => a.artifact_type);
    expect(artifactTypes).toContain("pregnancy_stage_summary");
    expect(artifactTypes).toContain("health_state_summary"); // safety gate always emits

    const events = await app.devHostPrisma.workflowOutboxEvent.findMany({ where: { workspaceId: ws } });
    const eventTypes = new Set(events.map((e) => e.eventType));
    expect(eventTypes.has("workflow.run.created")).toBe(true);
    expect(eventTypes.has("workflow.context.bound")).toBe(true);
    expect(eventTypes.has("workflow.artifact.created")).toBe(true);
    // benign material must not escalate
    expect(eventTypes.has("nurture.health_state.safety_escalated")).toBe(false);
  });

  it("get_run returns 404 for an unknown run", async () => {
    const res = await server.inject({ method: "GET", url: `/api/workflow/runs/${randomUUID()}?workspace_id=${ws}` });
    expect(res.statusCode).toBe(404);
  });
});
