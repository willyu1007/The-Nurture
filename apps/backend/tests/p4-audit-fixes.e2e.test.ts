import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { createNurtureApp } from "../src/app.js";
import { buildServer } from "../src/server.js";

// P4 closeout audit fix (SEC-1): GET /internal/nurture/projects/:id must be
// workspace-isolated — a project's UUID must not leak its detail/timeline to
// another workspace. Previously findById ignored workspaceId.
describe("p4 audit fixes: project-detail workspace isolation", () => {
  const app = createNurtureApp();
  const server = buildServer(app);

  afterAll(async () => {
    await server.close();
    await app.disconnect();
  });

  it("returns the detail in the owning workspace and 404 in another", async () => {
    const wsA = `ws-${randomUUID()}`;
    const familyId = `${wsA}:family`;
    const create = await server.inject({
      method: "POST",
      url: "/internal/nurture/projects",
      payload: { workspace_id: wsA, family_ref_key: familyId, issue_type: "bedtime" },
    });
    expect(create.statusCode).toBe(201);
    const projectId = (create.json() as { project_id: string }).project_id;

    // owning workspace -> 200
    const owned = await server.inject({ method: "GET", url: `/internal/nurture/projects/${projectId}?workspace_id=${wsA}` });
    expect(owned.statusCode).toBe(200);
    expect((owned.json() as { project: { project_id: string } }).project.project_id).toBe(projectId);

    // different workspace -> 404 (no cross-workspace leak via UUID)
    const wsB = `ws-${randomUUID()}`;
    const leaked = await server.inject({ method: "GET", url: `/internal/nurture/projects/${projectId}?workspace_id=${wsB}` });
    expect(leaked.statusCode).toBe(404);
  });
});
