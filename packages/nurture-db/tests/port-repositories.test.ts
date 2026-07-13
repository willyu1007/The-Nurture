import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import type { CanonicalRef, DomainContextRef } from "@my-chat/workflow-contracts";
import { createPrismaClient } from "../src/client.js";
import { createNurtureRepositories } from "../src/index.js";

const prisma = createPrismaClient();
const repos = createNurtureRepositories(prisma);

afterAll(async () => {
  await prisma.$disconnect();
});

const familyRef = (workspaceId: string): DomainContextRef => ({
  namespace: "my_chat",
  object_type: "family",
  object_id: `${workspaceId}:family`,
  owner_scope: "workspace",
  canonical_ref: { service: "my_chat", object_type: "family", object_id: `${workspaceId}:family` },
});

describe("NurtureProfileRepository (port)", () => {
  it("upserts a projection and reads it back by canonical object ref", async () => {
    const workspaceId = randomUUID();
    const ref = familyRef(workspaceId);

    const created = await repos.profiles.upsertProjection({
      profile_id: `${workspaceId}:profile`,
      workspace_id: workspaceId,
      canonical_object_ref: ref,
      scenario_key: "nurture",
      projection_version: 1,
      safe_summary: "initial projection",
    });
    expect(created.projection_version).toBe(1);

    const fetched = await repos.profiles.getByCanonicalObjectRef({
      workspace_id: workspaceId,
      canonical_object_ref: ref,
    });
    expect(fetched).not.toBeNull();
    expect(fetched?.profile_id).toBe(`${workspaceId}:profile`);
    expect(fetched?.canonical_object_ref.object_id).toBe(ref.object_id);

    // Upsert again -> updates the same row (idempotent on the ref key).
    const updated = await repos.profiles.upsertProjection({
      profile_id: `${workspaceId}:profile`,
      workspace_id: workspaceId,
      canonical_object_ref: ref,
      scenario_key: "nurture",
      projection_version: 2,
      safe_summary: "updated projection",
    });
    expect(updated.projection_version).toBe(2);
    expect(updated.safe_summary).toBe("updated projection");
  });

  it("returns null when no projection exists for the ref", async () => {
    const workspaceId = randomUUID();
    const fetched = await repos.profiles.getByCanonicalObjectRef({
      workspace_id: workspaceId,
      canonical_object_ref: familyRef(workspaceId),
    });
    expect(fetched).toBeNull();
  });
});

describe("ActivityComparisonRepository (port)", () => {
  it("creates a draft and reads it back", async () => {
    const workspaceId = randomUUID();
    const comparisonId = randomUUID();
    const targetRefs: DomainContextRef[] = [familyRef(workspaceId)];
    const optionRefs: CanonicalRef[] = [{ kind: "downstream_object", id: "option-a", version: 1 }];

    const created = await repos.activityComparisons.createDraft({
      comparison_id: comparisonId,
      workspace_id: workspaceId,
      target_refs: targetRefs,
      option_refs: optionRefs,
      safe_summary: "compare A vs B",
    });
    expect(created.comparison_id).toBe(comparisonId);

    const fetched = await repos.activityComparisons.getDraft({
      workspace_id: workspaceId,
      comparison_id: comparisonId,
    });
    expect(fetched).not.toBeNull();
    expect(fetched?.option_refs[0]?.id).toBe("option-a");
    expect(fetched?.target_refs[0]?.object_id).toBe(targetRefs[0]?.object_id);
  });
});

describe("NurtureEvidenceRepository (port)", () => {
  it("appends an evidence ref and returns it", async () => {
    const workspaceId = randomUUID();
    const evidenceRef: CanonicalRef = { kind: "context_snapshot", id: randomUUID(), version: 1 };
    const targetRef: CanonicalRef = { kind: "workflow_run", id: randomUUID(), version: 1 };

    const returned = await repos.evidence.appendEvidenceRef({
      workspace_id: workspaceId,
      target_ref: targetRef,
      evidence_ref: evidenceRef,
      reason_code: "execution_review_outcome",
    });
    expect(returned.id).toBe(evidenceRef.id);

    const count = await prisma.nurtureEvidenceRef.count({ where: { workspaceId } });
    expect(count).toBe(1);
  });
});

describe("ActivityComparisonRepository weight/result persistence (port)", () => {
  it("round-trips weight override and computed result onto the draft", async () => {
    const workspaceId = randomUUID();
    const comparisonId = randomUUID();
    await repos.activityComparisons.createDraft({
      comparison_id: comparisonId,
      workspace_id: workspaceId,
      target_refs: [familyRef(workspaceId)],
      option_refs: [{ kind: "downstream_object", id: "opt-a", version: 1 }],
      safe_summary: "draft",
    });

    await repos.activityComparisons.saveWeightOverride({
      workspace_id: workspaceId,
      comparison_id: comparisonId,
      weight_override: { goals: 0.5, cost: 0.5 },
    });
    await repos.activityComparisons.saveComputedResult({
      workspace_id: workspaceId,
      comparison_id: comparisonId,
      computed_result: { ranking: ["opt-a"] },
    });

    const draft = await repos.activityComparisons.getDraft({ workspace_id: workspaceId, comparison_id: comparisonId });
    expect((draft?.weight_override_payload as { cost: number }).cost).toBe(0.5);
    expect((draft?.computed_result_payload as { ranking: string[] }).ranking[0]).toBe("opt-a");
  });
});

describe("NurtureWorkflowProjectRepository (port)", () => {
  const seedProject = async (workspaceId: string, runId: string) => {
    const row = await prisma.nurtureWorkflowProject.create({
      data: {
        workspaceId,
        familyRefKey: `${workspaceId}:family`,
        familyRef: { service: "my_chat", object_type: "family", object_id: `${workspaceId}:family` },
        templateKey: "family_rule_trial",
        issueType: "bedtime",
        status: "confirmed",
        workflowRunId: runId,
      },
    });
    return row.id;
  };

  it("reads by workflow run id and applies a versioned strategy update", async () => {
    const workspaceId = randomUUID();
    const runId = randomUUID();
    const projectId = await seedProject(workspaceId, runId);

    const fetched = await repos.projects.getByWorkflowRunId({ workspace_id: workspaceId, workflow_run_id: runId });
    expect(fetched?.project_id).toBe(projectId);
    expect(fetched?.aggregate_version).toBe(0);

    const updated = await repos.projects.updateStrategyPayloads({
      workspace_id: workspaceId,
      project_id: projectId,
      expected_version: 0,
      goal_payload: { goal: "fewer bedtime conflicts" },
      constraint_payload: { non_negotiable_boundaries: ["safety"] },
    });
    expect(updated.aggregate_version).toBe(1);
    expect((updated.goal_payload as { goal: string }).goal).toBe("fewer bedtime conflicts");
  });

  it("rejects a stale optimistic update", async () => {
    const workspaceId = randomUUID();
    const runId = randomUUID();
    const projectId = await seedProject(workspaceId, runId);

    await expect(
      repos.projects.updateReviewPayloads({
        workspace_id: workspaceId,
        project_id: projectId,
        expected_version: 99, // wrong version
        review_summary_payload: {},
        learning_output_payload: {},
        profile_update_proposal_payload: {},
      }),
    ).rejects.toThrow(/optimistic concurrency conflict/);
  });
});
