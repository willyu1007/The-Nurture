import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import {
  NurtureMetricObservationStatus,
  NurtureMetricSourceType,
  NurtureMetricSubjectType,
  NurtureMetricValueKind,
} from "@the-nurture/db";
import { createNurtureApp } from "../src/app.js";
import { buildServer } from "../src/server.js";

const TOKEN = "growth-record-contribution-token-32b";
const contributionPath = "/internal/nurture/growth-record/contribution/resolve";

describe("growth-record contribution resolver", () => {
  const app = createNurtureApp();
  const server = buildServer(app, { internalServiceToken: TOKEN });
  const disabledServer = buildServer(app);
  const shortTokenServer = buildServer(app, { internalServiceToken: "short-token" });

  afterAll(async () => {
    await Promise.all([server.close(), disabledServer.close(), shortTokenServer.close()]);
    await app.disconnect();
  });

  it("stays disabled without a configured service token", async () => {
    const response = await disabledServer.inject({
      method: "POST",
      url: contributionPath,
      payload: validRequest(randomUUID()),
    });

    expect(response.statusCode).toBe(503);
    expect(response.json()).toEqual({ error: "contribution_resolve_disabled" });

    const shortTokenResponse = await shortTokenServer.inject({
      method: "POST",
      url: contributionPath,
      payload: validRequest(randomUUID()),
    });
    expect(shortTokenResponse.statusCode).toBe(503);
    expect(shortTokenResponse.json()).toEqual({ error: "contribution_resolve_disabled" });
  });

  it("rejects an invalid bearer token", async () => {
    const response = await server.inject({
      method: "POST",
      url: contributionPath,
      headers: { authorization: "Bearer invalid-growth-record-token" },
      payload: validRequest(randomUUID()),
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({ error: "service_auth_required" });
  });

  it("rejects malformed bodies and stops invalid Nurture contribution refs", async () => {
    const headers = { authorization: `Bearer ${TOKEN}` };
    const malformed = await server.inject({
      method: "POST",
      url: contributionPath,
      headers,
      payload: { workspace_id: "workspace-1", source_context_refs: "not-an-array" },
    });
    expect(malformed.statusCode).toBe(400);
    expect(malformed.json()).toEqual({ error: "invalid_contribution_request" });

    const invalidRef = await server.inject({
      method: "POST",
      url: contributionPath,
      headers,
      payload: {
        workspace_id: "workspace-1",
        source_context_refs: [
          canonicalRef("nurture", "metric_definition", randomUUID()),
        ],
      },
    });
    expect(invalidRef.statusCode).toBe(200);
    expect(invalidRef.json()).toEqual({
      status: "stopped",
      reason_code: "invalid_contribution_ref",
    });
  });

  it("stops missing and non-shareable observations", async () => {
    const workspaceId = `workspace-${randomUUID()}`;
    const unconfirmed = await observation({ workspaceId, userConfirmed: false });
    const missingChild = await observation({ workspaceId, childRefKey: null });
    const missingActor = await observation({ workspaceId, parentActorId: null });
    const corrected = await observation({
      workspaceId,
      status: NurtureMetricObservationStatus.corrected,
    });

    await expectStopped(workspaceId, randomUUID(), "contribution_not_found");
    await expectStopped(workspaceId, unconfirmed.id, "not_shareable");
    await expectStopped(workspaceId, missingChild.id, "not_shareable");
    await expectStopped(workspaceId, missingActor.id, "not_shareable");
    await expectStopped(workspaceId, corrected.id, "not_shareable");
  });

  it("resolves only the display-safe observation contribution", async () => {
    const workspaceId = `workspace-${randomUUID()}`;
    const observedAt = new Date("2026-08-01T01:02:03.456Z");
    const row = await observation({
      workspaceId,
      metricCode: "bedtime-conflict_count",
      semanticSummary: "  Calm bedtime routines are becoming more consistent.  ",
      observedAt,
      numericValue: 42,
    });
    const response = await server.inject({
      method: "POST",
      url: contributionPath,
      headers: { authorization: `Bearer ${TOKEN}` },
      payload: validRequest(row.id, workspaceId),
    });

    expect(response.statusCode).toBe(200);
    const body = response.json() as Record<string, unknown>;
    expect(Object.keys(body).sort()).toEqual(["contribution", "status"]);
    expect(body).toEqual({
      status: "resolved",
      contribution: {
        entry_type: "observation",
        data_class: "observation_trend",
        declared_audience: "family",
        title: "Care observation: bedtime conflict count",
        summary: "Calm bedtime routines are becoming more consistent.",
        occurred_at: observedAt.toISOString(),
        contributor_actor_id: "parent-actor-1",
        owner_ref: `nurture:metric_observation:${row.id}`,
      },
    });
    const contribution = body.contribution as Record<string, unknown>;
    expect(Object.keys(contribution).sort()).toEqual([
      "contributor_actor_id",
      "data_class",
      "declared_audience",
      "entry_type",
      "occurred_at",
      "owner_ref",
      "summary",
      "title",
    ]);
    for (const key of [
      "numericValue",
      "booleanValue",
      "enumValue",
      "textValue",
      "valuePayload",
      "scaleMin",
      "scaleMax",
    ]) {
      expect(contribution).not.toHaveProperty(key);
    }

    const withoutSummary = await observation({
      workspaceId,
      semanticSummary: "   ",
    });
    const withoutSummaryResponse = await server.inject({
      method: "POST",
      url: contributionPath,
      headers: { authorization: `Bearer ${TOKEN}` },
      payload: validRequest(withoutSummary.id, workspaceId),
    });
    const withoutSummaryContribution = (
      withoutSummaryResponse.json() as { contribution: Record<string, unknown> }
    ).contribution;
    expect(Object.keys(withoutSummaryContribution).sort()).toEqual([
      "contributor_actor_id",
      "data_class",
      "declared_audience",
      "entry_type",
      "occurred_at",
      "owner_ref",
      "title",
    ]);
  });

  async function expectStopped(
    workspaceId: string,
    observationId: string,
    reasonCode: string,
  ) {
    const response = await server.inject({
      method: "POST",
      url: contributionPath,
      headers: { authorization: `Bearer ${TOKEN}` },
      payload: validRequest(observationId, workspaceId),
    });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: "stopped", reason_code: reasonCode });
  }

  async function observation(input: {
    workspaceId: string;
    childRefKey?: string | null;
    parentActorId?: string | null;
    userConfirmed?: boolean;
    metricCode?: string;
    semanticSummary?: string | null;
    observedAt?: Date;
    numericValue?: number;
    status?: NurtureMetricObservationStatus;
  }) {
    return app.nurturePrisma.nurtureMetricObservation.create({
      data: {
        workspaceId: input.workspaceId,
        familyRefKey: `family:${input.workspaceId}`,
        childRefKey: input.childRefKey === undefined ? "platform-child-1" : input.childRefKey,
        parentActorId:
          input.parentActorId === undefined ? "parent-actor-1" : input.parentActorId,
        metricCode: input.metricCode ?? "daily_observation",
        subjectType: NurtureMetricSubjectType.child,
        subjectRefKey: "platform-child-1",
        valueKind: NurtureMetricValueKind.count,
        numericValue: input.numericValue ?? 1,
        observedAt: input.observedAt ?? new Date("2026-08-01T00:00:00.000Z"),
        sourceType: NurtureMetricSourceType.manual,
        userConfirmed: input.userConfirmed ?? true,
        semanticSummary: input.semanticSummary ?? "A safe summary.",
        status: input.status ?? NurtureMetricObservationStatus.active,
      },
    });
  }
});

function validRequest(observationId: string, workspaceId = "workspace-1") {
  return {
    workspace_id: workspaceId,
    source_context_refs: [
      canonicalRef("my_chat", "child", "platform-child-1"),
      canonicalRef("nurture", "metric_observation", observationId),
    ],
  };
}

function canonicalRef(namespace: string, objectType: string, objectId: string) {
  return {
    schema_version: 1 as const,
    namespace,
    object_type: objectType,
    object_id: objectId,
    version: 1,
  };
}
