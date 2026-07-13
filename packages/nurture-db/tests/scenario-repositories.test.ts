import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { createPrismaClient } from "../src/client.js";
import {
  createScenarioRepositories,
  NurtureCaptureExtractionStatus,
  NurtureCaptureInputModality,
  NurtureCaptureSourceSurface,
  NurtureCaptureType,
  NurtureIssueType,
  NurtureMetricObservationStatus,
  NurtureMetricSourceType,
  NurtureMetricSubjectType,
  NurtureMetricValueKind,
  NurtureProjectStatus,
  NurtureSnapshotSourceType,
  NurtureSnapshotStatus,
  NurtureSnapshotType,
} from "../src/index.js";

const prisma = createPrismaClient();
const repos = createScenarioRepositories(prisma);

afterAll(async () => {
  await prisma.$disconnect();
});

const familyRefJson = (workspaceId: string) => ({
  service: "my_chat",
  object_type: "family",
  object_id: `${workspaceId}:family`,
});

describe("profile snapshot repositories", () => {
  it("creates and lists a family profile snapshot", async () => {
    const workspaceId = randomUUID();
    const familyRefKey = `${workspaceId}:family`;
    const created = await repos.familyProfileSnapshots.create({
      workspaceId,
      familyRefKey,
      familyRef: familyRefJson(workspaceId),
      semanticSummary: "stable two-parent household",
    });
    expect(await repos.familyProfileSnapshots.findById(created.id)).not.toBeNull();
    const list = await repos.familyProfileSnapshots.listByFamily(workspaceId, familyRefKey);
    expect(list).toHaveLength(1);
  });

  it("creates and lists a child profile snapshot", async () => {
    const workspaceId = randomUUID();
    const childRefKey = `${workspaceId}:child`;
    await repos.childProfileSnapshots.create({
      workspaceId,
      familyRefKey: `${workspaceId}:family`,
      childRefKey,
      childRef: { service: "my_chat", object_type: "child", object_id: childRefKey },
      developmentStageKey: "early_childhood",
    });
    const list = await repos.childProfileSnapshots.listByChild(workspaceId, childRefKey);
    expect(list).toHaveLength(1);
  });
});

describe("charter + item repositories", () => {
  it("creates a charter with an item", async () => {
    const workspaceId = randomUUID();
    const familyRefKey = `${workspaceId}:family`;
    const charter = await repos.familyCharters.create({
      workspaceId,
      familyRefKey,
      familyRef: familyRefJson(workspaceId),
      status: "active",
    });
    await repos.familyCharters.addItem({
      workspaceId,
      charterId: charter.id,
      familyRefKey,
      itemKey: "no_screens_after_8pm",
      itemPayload: { kind: "non_negotiable" },
    });
    const withItems = await repos.familyCharters.getWithItems(charter.id);
    expect(withItems?.items).toHaveLength(1);
  });
});

describe("focus cycle + goal repositories", () => {
  it("creates a focus cycle with a goal", async () => {
    const workspaceId = randomUUID();
    const familyRefKey = `${workspaceId}:family`;
    const cycle = await repos.focusCycles.create({
      workspaceId,
      familyRefKey,
      familyRef: familyRefJson(workspaceId),
      status: "active",
    });
    await repos.focusCycles.addGoal({
      workspaceId,
      focusCycleId: cycle.id,
      familyRefKey,
      goalKey: "reduce_bedtime_conflict",
      priority: 1,
    });
    const withGoals = await repos.focusCycles.getWithGoals(cycle.id);
    expect(withGoals?.goals).toHaveLength(1);
  });
});

describe("family quantification snapshot repository", () => {
  it("creates and lists a calibration snapshot", async () => {
    const workspaceId = randomUUID();
    const familyRefKey = `${workspaceId}:family`;
    await repos.quantificationSnapshots.create({
      workspaceId,
      familyRefKey,
      familyRef: familyRefJson(workspaceId),
      snapshotType: NurtureSnapshotType.planning,
      sourceType: NurtureSnapshotSourceType.metric_rollup,
      status: NurtureSnapshotStatus.active,
      parentBandwidthPayload: { score: "medium" },
    });
    const list = await repos.quantificationSnapshots.listByFamily(workspaceId, familyRefKey);
    expect(list).toHaveLength(1);
  });
});

describe("metric definition + observation repositories", () => {
  it("defines a metric and records observations", async () => {
    const workspaceId = randomUUID();
    const familyRefKey = `${workspaceId}:family`;
    await repos.metrics.defineMetric({
      workspaceId,
      metricCode: "bedtime_conflict_count",
      displayName: "Bedtime conflict count",
      valueKind: NurtureMetricValueKind.count,
      subjectType: NurtureMetricSubjectType.family,
    });
    const recordConflict = (numericValue: number, observedAt: Date) =>
      repos.metrics.recordObservation({
        workspaceId,
        familyRefKey,
        metricCode: "bedtime_conflict_count",
        subjectType: NurtureMetricSubjectType.family,
        subjectRefKey: familyRefKey,
        valueKind: NurtureMetricValueKind.count,
        numericValue,
        observedAt,
        sourceType: NurtureMetricSourceType.capture,
        status: NurtureMetricObservationStatus.active,
      });

    // Two observations for the metric (distinct observedAt) + one for a second
    // metric, so both the desc ordering and the metricCode filter are exercised.
    await recordConflict(2, new Date("2026-06-20T20:00:00Z"));
    await recordConflict(1, new Date("2026-06-22T20:00:00Z"));
    await repos.metrics.recordObservation({
      workspaceId,
      familyRefKey,
      metricCode: "bedtime_duration_minutes",
      subjectType: NurtureMetricSubjectType.family,
      subjectRefKey: familyRefKey,
      valueKind: NurtureMetricValueKind.duration,
      numericValue: 30,
      observedAt: new Date("2026-06-21T20:00:00Z"),
      sourceType: NurtureMetricSourceType.capture,
      status: NurtureMetricObservationStatus.active,
    });

    // metricCode filter excludes the other metric.
    const conflicts = await repos.metrics.listObservations(workspaceId, familyRefKey, "bedtime_conflict_count");
    expect(conflicts).toHaveLength(2);
    // observedAt desc: latest (value 1, Jun 22) first.
    expect(Number(conflicts[0]?.numericValue)).toBe(1);
    expect(Number(conflicts[1]?.numericValue)).toBe(2);

    // Unfiltered returns all three for the family.
    const all = await repos.metrics.listObservations(workspaceId, familyRefKey);
    expect(all).toHaveLength(3);
  });
});

describe("workflow project + capture + checkpoint + review repositories", () => {
  it("runs a family_rule_trial project through its lifecycle", async () => {
    const workspaceId = randomUUID();
    const familyRefKey = `${workspaceId}:family`;

    const project = await repos.workflowProjects.create({
      workspaceId,
      familyRefKey,
      familyRef: familyRefJson(workspaceId),
      templateKey: "family_rule_trial",
      issueType: NurtureIssueType.bedtime,
      status: NurtureProjectStatus.draft,
      title: "Bedtime rule trial",
      goalPayload: { goal: "fewer bedtime conflicts" },
    });
    expect(project.status).toBe(NurtureProjectStatus.draft);

    const confirmed = await repos.workflowProjects.updateStatus(project.id, NurtureProjectStatus.confirmed);
    expect(confirmed.status).toBe(NurtureProjectStatus.confirmed);
    expect(confirmed.aggregateVersion).toBe(1);

    await repos.captures.append({
      workspaceId,
      projectId: project.id,
      familyRefKey,
      captureType: NurtureCaptureType.rule_execution,
      sourceSurface: NurtureCaptureSourceSurface.web_workbench,
      inputModality: NurtureCaptureInputModality.form,
      extractionStatus: NurtureCaptureExtractionStatus.extracted,
      rawInputText: "Followed the rule tonight without conflict.",
    });
    expect(await repos.captures.listByProject(project.id)).toHaveLength(1);

    await repos.checkpoints.create({
      workspaceId,
      projectId: project.id,
      familyRefKey,
      checkpointPayload: { day: 7, signal: "improving" },
    });
    expect(await repos.checkpoints.listByProject(project.id)).toHaveLength(1);

    await repos.reviews.create({
      workspaceId,
      projectId: project.id,
      familyRefKey,
      reviewSummaryPayload: { outcome: "conflict reduced" },
      learningOutputPayload: { keep: "consistent bedtime cue" },
    });
    expect(await repos.reviews.listByProject(project.id)).toHaveLength(1);
  });
});

describe("family policy repository", () => {
  it("creates and lists a family policy", async () => {
    const workspaceId = randomUUID();
    const familyRefKey = `${workspaceId}:family`;
    const policy = await repos.familyPolicies.create({
      workspaceId,
      familyRefKey,
      familyRef: familyRefJson(workspaceId),
      status: "active",
      policyPayload: { rule: "no screens after 8pm" },
    });
    expect(await repos.familyPolicies.findById(policy.id)).not.toBeNull();
    expect(await repos.familyPolicies.listByFamily(workspaceId, familyRefKey)).toHaveLength(1);
  });
});
