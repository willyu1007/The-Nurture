import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { createNurtureApp } from "../src/app.js";
import { buildServer } from "../src/server.js";

// B3: two issue_types drive the SAME family_strategy flow over HTTP (project
// created via the internal API, not seeded), proving the slice is not a
// single-instance hardcode. Plus the project timeline (capture/checkpoint/review).
describe("two issue_types share the family_strategy flow", () => {
  const app = createNurtureApp();
  const server = buildServer(app);

  afterAll(async () => {
    await server.close();
    await app.disconnect();
  });

  const runIssueType = async (issueType: string) => {
    const ws = `ws-${randomUUID()}`;
    const familyId = `${ws}:family`;

    const start = await server.inject({
      method: "POST",
      url: "/api/workflow/runs",
      payload: {
        workspace_id: ws,
        capability_key: "family_strategy",
        entrypoint_key: "calibrate_family_strategy",
        requirement_values: {
          context_refs: [
            { namespace: "my_chat", object_type: "family", object_id: familyId, owner_scope: "workspace", canonical_ref: { service: "my_chat", object_type: "family", object_id: familyId } },
          ],
          issue_type: issueType,
        },
      },
    });
    const runId = (start.json() as { data: { run_id: string } }).data.run_id;

    // create the project over the internal API, bound to the run
    const proj = await server.inject({
      method: "POST",
      url: "/internal/nurture/projects",
      payload: { workspace_id: ws, family_ref_key: familyId, issue_type: issueType, workflow_run_id: runId },
    });
    expect(proj.statusCode).toBe(201);
    const projectId = (proj.json() as { project_id: string }).project_id;

    await app.dispatcher.drain(runId);
    await server.inject({ method: "POST", url: "/api/workflow/actions", payload: { workspace_id: ws, run_id: runId, action: "approve" } });
    await app.dispatcher.drain(runId);

    const detail = (await server.inject({ method: "GET", url: `/api/workflow/runs/${runId}?workspace_id=${ws}` })).json() as {
      run: { status: string };
      steps: { step_key: string; status: string }[];
      artifacts: { artifact_type: string }[];
    };
    return { ws, familyId, runId, projectId, detail };
  };

  it("runs both issue_types through identical steps to a persisted artifact", async () => {
    const bedtime = await runIssueType("bedtime");
    const screen = await runIssueType("screen");

    for (const r of [bedtime, screen]) {
      expect(r.detail.run.status).toBe("completed");
      expect(r.detail.steps.every((s) => s.status === "completed")).toBe(true);
      expect(r.detail.artifacts.map((a) => a.artifact_type)).toContain("family_strategy_summary");
    }
    // identical step sequence — shared schema/flow, not a per-issue_type hardcode
    const seq = (r: typeof bedtime) => r.detail.steps.map((s) => s.step_key);
    expect(seq(bedtime)).toEqual(seq(screen));
    expect(seq(bedtime)).toEqual(["collect_context", "calibrate_family_strategy", "request_approval", "write_artifact"]);
  });

  it("records the project timeline (capture / checkpoint / review)", async () => {
    const { ws, familyId, projectId } = await runIssueType("homework");

    await server.inject({ method: "POST", url: `/internal/nurture/projects/${projectId}/captures`, payload: { workspace_id: ws, family_ref_key: familyId, raw_input_text: "Followed the rule tonight." } });
    await server.inject({ method: "POST", url: `/internal/nurture/projects/${projectId}/checkpoints`, payload: { workspace_id: ws, family_ref_key: familyId, checkpoint_payload: { day: 7, signal: "improving" } } });
    await server.inject({ method: "POST", url: `/internal/nurture/projects/${projectId}/reviews`, payload: { workspace_id: ws, family_ref_key: familyId, review_summary_payload: { outcome: "kept" } } });

    const timeline = (await server.inject({ method: "GET", url: `/internal/nurture/projects/${projectId}?workspace_id=${ws}` })).json() as {
      captures: unknown[];
      checkpoints: unknown[];
      reviews: unknown[];
    };
    expect(timeline.captures).toHaveLength(1);
    expect(timeline.checkpoints).toHaveLength(1);
    expect(timeline.reviews).toHaveLength(1);
  });
});
