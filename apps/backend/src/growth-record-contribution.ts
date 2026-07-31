import { timingSafeEqual } from "node:crypto";
import type { FastifyInstance } from "fastify";
import {
  assertCanonicalRef,
  type CanonicalRef,
} from "@my-chat/workflow-contracts";
import {
  NurtureMetricObservationStatus,
  type NurturePrismaClient,
} from "@the-nurture/db";

export const GROWTH_RECORD_CONTRIBUTION_PATH =
  "/internal/nurture/growth-record/contribution/resolve";

const MIN_SERVICE_TOKEN_LENGTH = 16;
const MAX_WORKSPACE_ID_LENGTH = 512;
const MAX_SOURCE_CONTEXT_REFS = 32;
const TITLE_PREFIX = "Care observation: ";
const TITLE_MAX_LENGTH = 200;
const SUMMARY_MAX_LENGTH = 2_000;

type ContributionRequest = {
  contributionRef: CanonicalRef;
};

export function registerGrowthRecordContributionRoute(
  fastify: FastifyInstance,
  options: {
    nurturePrisma: NurturePrismaClient;
    internalServiceToken?: string;
  },
): void {
  fastify.post(GROWTH_RECORD_CONTRIBUTION_PATH, async (req, reply) => {
    if (!serviceTokenConfigured(options.internalServiceToken)) {
      return reply.code(503).send({ error: "contribution_resolve_disabled" });
    }
    if (!bearerAuthorized(req.headers.authorization, options.internalServiceToken)) {
      return reply.code(401).send({ error: "service_auth_required" });
    }

    let request: ContributionRequest;
    try {
      request = parseContributionRequest(req.body);
    } catch (error) {
      if (error instanceof ContributionRefError) {
        return reply.send({ status: "stopped", reason_code: "invalid_contribution_ref" });
      }
      return reply.code(400).send({ error: "invalid_contribution_request" });
    }

    try {
      const observation = await options.nurturePrisma.nurtureMetricObservation.findUnique({
        where: { id: request.contributionRef.object_id },
        select: {
          id: true,
          metricCode: true,
          semanticSummary: true,
          observedAt: true,
          parentActorId: true,
          childRefKey: true,
          userConfirmed: true,
          status: true,
        },
      });
      if (!observation) {
        return reply.send({ status: "stopped", reason_code: "contribution_not_found" });
      }
      if (
        observation.status !== NurtureMetricObservationStatus.active ||
        !observation.userConfirmed ||
        !observation.childRefKey ||
        !observation.parentActorId
      ) {
        return reply.send({ status: "stopped", reason_code: "not_shareable" });
      }

      const semanticSummary = summary(observation.semanticSummary);
      return reply.send({
        status: "resolved",
        contribution: {
          entry_type: "observation",
          data_class: "observation_trend",
          declared_audience: "family",
          title: observationTitle(observation.metricCode),
          ...(semanticSummary ? { summary: semanticSummary } : {}),
          occurred_at: observation.observedAt.toISOString(),
          contributor_actor_id: observation.parentActorId,
          owner_ref: `nurture:metric_observation:${observation.id}`,
        },
      });
    } catch {
      return reply.code(500).send({ error: "contribution_resolve_unavailable" });
    }
  });
}

function parseContributionRequest(value: unknown): ContributionRequest {
  if (!isRecord(value) || !hasOnlyKeys(value, ["workspace_id", "source_context_refs"])) {
    throw new Error("invalid contribution request");
  }
  const workspaceId = value.workspace_id;
  if (
    typeof workspaceId !== "string" ||
    workspaceId.length === 0 ||
    workspaceId.length > MAX_WORKSPACE_ID_LENGTH
  ) {
    throw new Error("invalid workspace id");
  }
  if (
    !Array.isArray(value.source_context_refs) ||
    value.source_context_refs.length === 0 ||
    value.source_context_refs.length > MAX_SOURCE_CONTEXT_REFS
  ) {
    throw new Error("invalid source context refs");
  }

  const refs = value.source_context_refs.map((ref, index) => {
    assertCanonicalRef(ref, `source_context_refs.${index}`);
    return ref;
  });
  const nurtureRefs = refs.filter(
    (ref) => ref.namespace === "nurture",
  );
  if (
    nurtureRefs.length === 0 ||
    nurtureRefs.some((ref) => ref.object_type !== "metric_observation")
  ) {
    throw new ContributionRefError();
  }
  return { contributionRef: nurtureRefs[0]! };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOnlyKeys(record: Record<string, unknown>, keys: readonly string[]): boolean {
  const allowed = new Set(keys);
  return Object.keys(record).every((key) => allowed.has(key));
}

function serviceTokenConfigured(token: string | undefined): token is string {
  return Boolean(token && token.length >= MIN_SERVICE_TOKEN_LENGTH);
}

function bearerAuthorized(header: string | undefined, token: string): boolean {
  if (!header || !header.startsWith("Bearer ")) return false;
  const supplied = Buffer.from(header.slice("Bearer ".length), "utf8");
  const expected = Buffer.from(token, "utf8");
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

function observationTitle(metricCode: string): string {
  return `${TITLE_PREFIX}${metricCode.replace(/[_-]/g, " ").trim()}`.slice(
    0,
    TITLE_MAX_LENGTH,
  );
}

function summary(value: string | null): string | undefined {
  const trimmed = value?.trim().slice(0, SUMMARY_MAX_LENGTH);
  return trimmed || undefined;
}

class ContributionRefError extends Error {}
