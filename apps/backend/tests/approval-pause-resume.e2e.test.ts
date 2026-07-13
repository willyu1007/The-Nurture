import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { createNurtureApp } from "../src/app.js";
import { buildServer } from "../src/server.js";

// B2: family_strategy run pauses at request_approval (manual_review_required),
// no write_artifact runs; POST /actions approve resolves it and the dispatcher
// resumes the run to completion.
describe("approval pause/resume: family_strategy run", () => {
  const app = createNurtureApp();
  const server = buildServer(app);
  const ws = `ws-${randomUUID()}`;

  afterAll(async () => {
    await server.close();
    await app.disconnect();
  });

  it("pauses at request_approval and resumes on approve", async () => {
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
          issue_type: "bedtime",
        },
      },
    });
    expect(start.statusCode).toBe(201);
    const runId = (start.json() as { data: { run_id: string } }).data.run_id;

    // calibrate_family_strategy reads the project by workflow_run_id — seed it
    // (B3's internal API will do this over HTTP; here we seed via the repo).
    await app.scenarioRepositories.workflowProjects.create({
      workspaceId: ws,
      familyRefKey: familyId,
      familyRef: { service: "my_chat", object_type: "family", object_id: familyId },
      templateKey: "family_rule_trial",
      issueType: "bedtime",
      status: "confirmed",
      workflowRunId: runId,
    });

    // advance until the run pauses at the approval gate
    await app.dispatcher.drain(runId);

    const paused = await server.inject({ method: "GET", url: `/api/workflow/runs/${runId}?workspace_id=${ws}` });
    const pausedBody = paused.json() as { run: { status: string }; steps: { step_key: string; status: string }[]; artifacts: { artifact_type: string }[] };
    expect(pausedBody.run.status).toBe("running"); // NOT completed
    const approvalStep = pausedBody.steps.find((s) => s.step_key === "request_approval");
    expect(approvalStep?.status).toBe("manual_review_required");
    expect(pausedBody.steps.find((s) => s.step_key === "write_artifact")?.status).toBe("pending");
    // calibrate produced the strategy artifact; the final write_artifact has not run
    expect(pausedBody.artifacts.map((a) => a.artifact_type)).toContain("family_strategy_summary");

    const approvalRow = await app.devHostPrisma.workflowApproval.findFirst({ where: { runId, workspaceId: ws } });
    expect(approvalRow?.status).toBe("pending");

    // approve -> resolves the approval + completes the approval step
    const approve = await server.inject({
      method: "POST",
      url: "/api/workflow/actions",
      payload: { workspace_id: ws, run_id: runId, action: "approve" },
    });
    expect(approve.statusCode).toBe(200);
    expect((approve.json() as { ok: boolean }).ok).toBe(true);

    // resume to completion
    await app.dispatcher.drain(runId);

    const done = await server.inject({ method: "GET", url: `/api/workflow/runs/${runId}?workspace_id=${ws}` });
    const doneBody = done.json() as { run: { status: string }; steps: { status: string }[] };
    expect(doneBody.run.status).toBe("completed");
    expect(doneBody.steps.every((s) => s.status === "completed")).toBe(true);

    const finalApproval = await app.devHostPrisma.workflowApproval.findFirst({ where: { runId, workspaceId: ws } });
    expect(finalApproval?.status).toBe("approved");
  });

  it("rejects an approve when there is no pending approval", async () => {
    const res = await server.inject({
      method: "POST",
      url: "/api/workflow/actions",
      payload: { workspace_id: ws, run_id: randomUUID(), action: "approve" },
    });
    expect(res.statusCode).toBe(409);
    expect((res.json() as { reason: string }).reason).toBe("no_pending_approval");
  });
});
