import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import {
  NurtureCaptureExtractionStatus,
  NurtureCaptureInputModality,
  NurtureCaptureSourceSurface,
  NurtureCaptureType,
  createNurtureRepositories,
  createScenarioRepositories,
} from "../src/index.js";
import { createPrismaClient } from "../src/client.js";

// Owner-boundary equivalents for legacy-host e2e semantics (T-014 Wave 1):
// workspace isolation of project reads (p4-audit-fixes), project timeline
// persistence (two-issue-types / first-slice), and profile projection
// upsert/read-back (first-slice). These live at the repository layer that
// survives the harness deletion.
const prisma = createPrismaClient();
const ports = createNurtureRepositories(prisma);
const scenario = createScenarioRepositories(prisma);

afterAll(async () => {
  await prisma.$disconnect();
});

const createProject = (workspaceId: string, workflowRunId?: string) =>
  scenario.workflowProjects.create({
    workspaceId,
    familyRefKey: `${workspaceId}:family`,
    familyRef: { service: "my_chat", object_type: "family", object_id: `${workspaceId}:family` },
    templateKey: "family_rule_trial",
    issueType: "bedtime",
    status: "confirmed",
    workflowRunId,
  });

describe("workflow project workspace isolation", () => {
  it("getById returns the project only inside the owning workspace", async () => {
    const wsA = `ws-${randomUUID()}`;
    const wsB = `ws-${randomUUID()}`;
    const row = await createProject(wsA);

    const owned = await ports.projects.getById({ workspace_id: wsA, project_id: row.id });
    expect(owned?.project_id).toBe(row.id);

    // another workspace must not read the project by guessing its UUID
    const foreign = await ports.projects.getById({ workspace_id: wsB, project_id: row.id });
    expect(foreign).toBeNull();
  });

  it("getByWorkflowRunId scopes by workspace the same way", async () => {
    const wsA = `ws-${randomUUID()}`;
    const runId = randomUUID();
    await createProject(wsA, runId);

    const owned = await ports.projects.getByWorkflowRunId({ workspace_id: wsA, workflow_run_id: runId });
    expect(owned?.workflow_run_id).toBe(runId);

    const foreign = await ports.projects.getByWorkflowRunId({ workspace_id: `ws-${randomUUID()}`, workflow_run_id: runId });
    expect(foreign).toBeNull();
  });
});

describe("project timeline persistence", () => {
  it("persists and lists capture / checkpoint / review for a project", async () => {
    const ws = `ws-${randomUUID()}`;
    const project = await createProject(ws);
    const familyRefKey = `${ws}:family`;

    await scenario.captures.append({
      workspaceId: ws,
      projectId: project.id,
      familyRefKey,
      captureType: NurtureCaptureType.rule_execution,
      sourceSurface: NurtureCaptureSourceSurface.web_workbench,
      inputModality: NurtureCaptureInputModality.form,
      extractionStatus: NurtureCaptureExtractionStatus.extracted,
      rawInputText: "Followed the rule tonight.",
    });
    await scenario.checkpoints.create({
      workspaceId: ws,
      projectId: project.id,
      familyRefKey,
      checkpointPayload: { day: 7, signal: "improving" },
    });
    await scenario.reviews.create({
      workspaceId: ws,
      projectId: project.id,
      familyRefKey,
      reviewSummaryPayload: { outcome: "kept" },
    });

    const [captures, checkpoints, reviews] = await Promise.all([
      scenario.captures.listByProject(project.id),
      scenario.checkpoints.listByProject(project.id),
      scenario.reviews.listByProject(project.id),
    ]);
    expect(captures).toHaveLength(1);
    expect(captures[0]?.captureType).toBe(NurtureCaptureType.rule_execution);
    expect(checkpoints).toHaveLength(1);
    expect(reviews).toHaveLength(1);
  });
});

describe("profile projection upsert/read-back", () => {
  it("creates the projection, reads it back by canonical ref, and applies version bumps in place", async () => {
    const ws = `ws-${randomUUID()}`;
    const ref = { schema_version: 1 as const, namespace: "my_chat", object_type: "family", object_id: `${ws}:family` };
    const base = {
      profile_id: `profile-${ws}`,
      workspace_id: ws,
      canonical_object_ref: ref,
      scenario_key: "nurture",
    };

    await ports.profiles.upsertProjection({ ...base, projection_version: 1, safe_summary: "Initial strategy summary." });
    const created = await ports.profiles.getByCanonicalObjectRef({ workspace_id: ws, canonical_object_ref: ref });
    expect(created?.projection_version).toBe(1);

    // record_review-style re-apply: same ref updates the row instead of duplicating it
    await ports.profiles.upsertProjection({ ...base, projection_version: 2, safe_summary: "Reviewed summary." });
    const updated = await ports.profiles.getByCanonicalObjectRef({ workspace_id: ws, canonical_object_ref: ref });
    expect(updated?.projection_version).toBe(2);
    expect(updated?.safe_summary).toBe("Reviewed summary.");

    const rows = await prisma.nurtureProfileProjection.findMany({
      where: { workspaceId: ws, refObjectId: ref.object_id },
    });
    expect(rows).toHaveLength(1);
  });
});
