import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { createNurtureApp } from "../src/app.js";
import { buildServer } from "../src/server.js";

// B5 — the P3 acceptance journey harness. One family_rule_trial project flows
// through three sequential runs (calibrate strategy -> care plan -> execution
// review), with a checkpoint/capture in between, ending in a profile-projection
// update + a handoff request. Re-binds the project to each run (a trial spans
// runs; the project's workflow_run_id moves with the active phase).
describe("nurture-family-rule-trial-first-slice", () => {
  const app = createNurtureApp();
  const server = buildServer(app);
  const ws = `ws-${randomUUID()}`;
  const familyId = `${ws}:family`;

  afterAll(async () => {
    await server.close();
    await app.disconnect();
  });

  const bindRun = (projectId: string, runId: string) =>
    app.nurturePrisma.nurtureWorkflowProject.update({ where: { id: projectId }, data: { workflowRunId: runId } });

  const startRun = async (capability: string, entrypoint: string, extra: Record<string, unknown> = {}) => {
    const res = await server.inject({
      method: "POST",
      url: "/api/workflow/runs",
      payload: {
        workspace_id: ws,
        capability_key: capability,
        entrypoint_key: entrypoint,
        requirement_values: {
          context_refs: [{ namespace: "my_chat", object_type: "family", object_id: familyId, owner_scope: "workspace", canonical_ref: { service: "my_chat", object_type: "family", object_id: familyId } }],
          issue_type: "bedtime",
          safety_boundary_acknowledged: true,
          ...extra,
        },
      },
    });
    return (res.json() as { data: { run_id: string } }).data.run_id;
  };

  const runStatus = async (runId: string) =>
    ((await server.inject({ method: "GET", url: `/api/workflow/runs/${runId}?workspace_id=${ws}` })).json() as { run: { status: string } }).run.status;

  it("drives a project through strategy -> care plan -> review end-to-end", async () => {
    // project
    const projectRes = await server.inject({ method: "POST", url: "/internal/nurture/projects", payload: { workspace_id: ws, family_ref_key: familyId, issue_type: "bedtime" } });
    const projectId = (projectRes.json() as { project_id: string }).project_id;

    // PHASE 1 — calibrate family strategy (approval pause/resume)
    const calibrateRun = await startRun("family_strategy", "calibrate_family_strategy");
    await bindRun(projectId, calibrateRun);
    await app.dispatcher.drain(calibrateRun);
    await server.inject({ method: "POST", url: "/api/workflow/actions", payload: { workspace_id: ws, run_id: calibrateRun, action: "approve" } });
    await app.dispatcher.drain(calibrateRun);
    expect(await runStatus(calibrateRun)).toBe("completed");

    // PHASE 2 — generate care plan (benign safety gate)
    const carePlanRun = await startRun("care_plan", "generate_short_term_plan");
    await bindRun(projectId, carePlanRun);
    await app.dispatcher.drain(carePlanRun);
    expect(await runStatus(carePlanRun)).toBe("completed");

    // checkpoint + capture during the trial
    await server.inject({ method: "POST", url: `/internal/nurture/projects/${projectId}/captures`, payload: { workspace_id: ws, family_ref_key: familyId, raw_input_text: "Bedtime went smoothly." } });
    await server.inject({ method: "POST", url: `/internal/nurture/projects/${projectId}/checkpoints`, payload: { workspace_id: ws, family_ref_key: familyId, checkpoint_payload: { day: 7 } } });

    // PHASE 3 — execution review (profile projection update + handoff)
    const reviewRun = await startRun("execution_review", "record_execution_review");
    await bindRun(projectId, reviewRun);
    await app.dispatcher.drain(reviewRun);
    expect(await runStatus(reviewRun)).toBe("completed");

    // artifacts across the three runs
    const artifactTypes = (await app.devHostPrisma.workflowArtifact.findMany({ where: { workspaceId: ws } })).map((a) => a.artifactType);
    expect(artifactTypes).toContain("family_strategy_summary");
    expect(artifactTypes).toContain("care_plan_summary");
    expect(artifactTypes).toContain("execution_review_summary");

    // record_review auto-applied the scenario-local profile projection (keyed by family)
    const profileRow = await app.nurturePrisma.nurtureProfileProjection.findFirst({ where: { workspaceId: ws, refObjectType: "family", refObjectId: familyId } });
    expect(profileRow).not.toBeNull();
    expect(profileRow?.projectionVersion).toBeGreaterThanOrEqual(1);

    // handoff requested on the review run
    const events = await app.devHostPrisma.workflowOutboxEvent.findMany({ where: { workspaceId: ws } });
    expect(events.some((e) => e.eventType === "workflow.handoff.requested")).toBe(true);

    // project timeline persisted
    const timeline = (await server.inject({ method: "GET", url: `/internal/nurture/projects/${projectId}?workspace_id=${ws}` })).json() as { captures: unknown[]; checkpoints: unknown[] };
    expect(timeline.captures).toHaveLength(1);
    expect(timeline.checkpoints).toHaveLength(1);
  });
});
