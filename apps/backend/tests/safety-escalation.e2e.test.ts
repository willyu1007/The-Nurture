import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { createNurtureApp } from "../src/app.js";
import { buildServer } from "../src/server.js";

const SAFETY_EVENT = "nurture.health_state.safety_escalated";

// B4: a care_plan run whose run material trips the medical-safety classifier
// HALTS at apply_medical_safety_gate (manual_review_required, no write_artifact)
// and emits the scenario-internal escalation event — which the manifest forbids
// to every shared consumer (routing-containment invariant).
describe("safety escalation regression: care_plan run", () => {
  const app = createNurtureApp();
  const server = buildServer(app);

  afterAll(async () => {
    await server.close();
    await app.disconnect();
  });

  const startCarePlan = async (ws: string, runMaterial?: Record<string, unknown>) => {
    const familyId = `${ws}:family`;
    const start = await server.inject({
      method: "POST",
      url: "/api/workflow/runs",
      payload: {
        workspace_id: ws,
        capability_key: "care_plan",
        entrypoint_key: "generate_short_term_plan",
        requirement_values: {
          context_refs: [
            { namespace: "my_chat", object_type: "family", object_id: familyId, owner_scope: "workspace", canonical_ref: { service: "my_chat", object_type: "family", object_id: familyId } },
          ],
          issue_type: "bedtime",
          safety_boundary_acknowledged: true,
          ...(runMaterial ? { run_material: runMaterial } : {}),
        },
      },
    });
    const runId = (start.json() as { data: { run_id: string } }).data.run_id;
    await server.inject({ method: "POST", url: "/internal/nurture/projects", payload: { workspace_id: ws, family_ref_key: familyId, issue_type: "bedtime", workflow_run_id: runId } });
    await app.dispatcher.drain(runId);
    const detail = (await server.inject({ method: "GET", url: `/api/workflow/runs/${runId}?workspace_id=${ws}` })).json() as {
      run: { status: string };
      steps: { step_key: string; status: string }[];
      artifacts: { artifact_type: string }[];
    };
    return { ws, runId, detail };
  };

  it("halts at the safety gate on a diagnosis-intent material and emits the scenario-internal event", async () => {
    const ws = `ws-${randomUUID()}`;
    const { detail } = await startCarePlan(ws, { normalized_intent_summary: "他是不是得了自闭症" });

    // run is paused (not completed); write_artifact never ran
    expect(detail.run.status).toBe("running");
    expect(detail.steps.find((s) => s.step_key === "apply_medical_safety_gate")?.status).toBe("manual_review_required");
    expect(detail.steps.find((s) => s.step_key === "write_artifact")?.status).toBe("pending");

    const events = await app.devHostPrisma.workflowOutboxEvent.findMany({ where: { workspaceId: ws } });
    const types = new Set(events.map((e) => e.eventType));
    expect(types.has(SAFETY_EVENT)).toBe(true); // escalation emitted
  });

  it("a benign care_plan run completes with no escalation", async () => {
    const ws = `ws-${randomUUID()}`;
    const { detail } = await startCarePlan(ws); // no run_material -> benign

    expect(detail.run.status).toBe("completed");
    expect(detail.steps.every((s) => s.status === "completed")).toBe(true);
    const events = await app.devHostPrisma.workflowOutboxEvent.findMany({ where: { workspaceId: ws } });
    expect(events.some((e) => e.eventType === SAFETY_EVENT)).toBe(false);
  });

  it("routing invariant: no shared consumer may receive the escalation event", () => {
    const consumers = app.registry.scenarios.get("nurture")!.manifest.event_registry.consumers;
    for (const shared of ["my_chat.chat", "my_chat.forum", "my_chat.knowledge_base", "my_chat.notification"]) {
      const c = consumers[shared];
      expect(c).toBeDefined();
      expect(c?.allowed_events ?? []).not.toContain(SAFETY_EVENT);
      expect(c?.forbidden_events ?? []).toContain(SAFETY_EVENT);
    }
  });
});
