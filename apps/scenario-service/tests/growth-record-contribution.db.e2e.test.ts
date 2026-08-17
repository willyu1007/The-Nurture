import type { AddressInfo } from "node:net";
import { randomUUID } from "node:crypto";
import { afterAll, afterEach, describe, expect, it } from "vitest";
import {
  NurtureMetricObservationStatus,
  NurtureMetricSourceType,
  NurtureMetricSubjectType,
  NurtureMetricValueKind,
  createPrismaClient,
} from "@the-nurture/db";
import { createScenarioServiceApplication } from "../src/application.js";
import {
  GROWTH_RECORD_CONTRIBUTION_PATH,
  createGrowthRecordContributionConfig,
} from "../src/growth-record-contribution.controller.js";

// Migrated from the legacy host's growth-record contribution e2e (T-014
// Wave 2): the display-safe resolver now runs in scenario-service on the real
// disposable PostgreSQL, with unchanged fences and payload shape.

const TOKEN = "growth-record-contribution-token-32b";

const prisma = createPrismaClient();

describe("growth-record contribution resolver (scenario-service)", () => {
  let close: (() => Promise<void>) | undefined;

  afterEach(async () => {
    await close?.();
    close = undefined;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  const boot = async (token: string | undefined) => {
    const { app } = await createScenarioServiceApplication({
      growthRecordContribution: createGrowthRecordContributionConfig({ token, prisma }),
    });
    await app.listen(0, "127.0.0.1");
    close = () => app.close();
    const address = app.getHttpServer().address() as AddressInfo;
    return `http://127.0.0.1:${address.port}`;
  };

  const post = (baseUrl: string, payload: unknown, authorization?: string) =>
    fetch(`${baseUrl}${GROWTH_RECORD_CONTRIBUTION_PATH}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(authorization ? { authorization } : {}),
      },
      body: JSON.stringify(payload),
    });

  it("stays disabled without a configured (or long-enough) service token", async () => {
    for (const token of [undefined, "short-token"]) {
      const baseUrl = await boot(token);
      const response = await post(baseUrl, validRequest(randomUUID()), `Bearer ${token}`);
      expect(response.status).toBe(503);
      expect(await response.json()).toEqual({ error: "contribution_resolve_disabled" });
      await close?.();
      close = undefined;
    }
  });

  it("rejects an invalid bearer token", async () => {
    const baseUrl = await boot(TOKEN);
    const response = await post(baseUrl, validRequest(randomUUID()), "Bearer invalid-growth-record-token");
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "service_auth_required" });
  });

  it("rejects malformed bodies and stops invalid Nurture contribution refs", async () => {
    const baseUrl = await boot(TOKEN);
    const authorization = `Bearer ${TOKEN}`;

    const malformed = await post(
      baseUrl,
      { workspace_id: "workspace-1", source_context_refs: "not-an-array" },
      authorization,
    );
    expect(malformed.status).toBe(400);
    expect(await malformed.json()).toEqual({ error: "invalid_contribution_request" });

    const invalidRef = await post(
      baseUrl,
      {
        workspace_id: "workspace-1",
        source_context_refs: [canonicalRef("nurture", "metric_definition", randomUUID())],
      },
      authorization,
    );
    expect(invalidRef.status).toBe(200);
    expect(await invalidRef.json()).toEqual({
      status: "stopped",
      reason_code: "invalid_contribution_ref",
    });
  });

  it("stops missing and non-shareable observations", async () => {
    const baseUrl = await boot(TOKEN);
    const workspaceId = `workspace-${randomUUID()}`;
    const unconfirmed = await observation({ workspaceId, userConfirmed: false });
    const missingChild = await observation({ workspaceId, childRefKey: null });
    const missingActor = await observation({ workspaceId, parentActorId: null });
    const corrected = await observation({
      workspaceId,
      status: NurtureMetricObservationStatus.corrected,
    });

    const expectStopped = async (observationId: string, reasonCode: string) => {
      const response = await post(baseUrl, validRequest(observationId, workspaceId), `Bearer ${TOKEN}`);
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ status: "stopped", reason_code: reasonCode });
    };

    await expectStopped(randomUUID(), "contribution_not_found");
    await expectStopped(unconfirmed.id, "not_shareable");
    await expectStopped(missingChild.id, "not_shareable");
    await expectStopped(missingActor.id, "not_shareable");
    await expectStopped(corrected.id, "not_shareable");
  });

  it("resolves only the display-safe observation contribution", async () => {
    const baseUrl = await boot(TOKEN);
    const workspaceId = `workspace-${randomUUID()}`;
    const observedAt = new Date("2026-08-01T01:02:03.456Z");
    const row = await observation({
      workspaceId,
      metricCode: "bedtime-conflict_count",
      semanticSummary: "  Calm bedtime routines are becoming more consistent.  ",
      observedAt,
      numericValue: 42,
    });
    const response = await post(baseUrl, validRequest(row.id, workspaceId), `Bearer ${TOKEN}`);

    expect(response.status).toBe(200);
    const body = (await response.json()) as Record<string, unknown>;
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

    const withoutSummary = await observation({ workspaceId, semanticSummary: "   " });
    const withoutSummaryResponse = await post(
      baseUrl,
      validRequest(withoutSummary.id, workspaceId),
      `Bearer ${TOKEN}`,
    );
    const withoutSummaryContribution = (
      (await withoutSummaryResponse.json()) as { contribution: Record<string, unknown> }
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
    return prisma.nurtureMetricObservation.create({
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
