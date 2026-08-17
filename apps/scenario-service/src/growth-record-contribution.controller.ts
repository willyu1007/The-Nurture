import type { IncomingMessage } from "node:http";
import {
  BadRequestException,
  Body,
  type CanActivate,
  Controller,
  type ExecutionContext,
  HttpCode,
  HttpStatus,
  Inject,
  Injectable,
  InternalServerErrorException,
  Post,
  ServiceUnavailableException,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import {
  NurtureMetricObservationStatus,
  createPrismaClient,
  type NurturePrismaClient,
} from "@the-nurture/db";
import {
  createBindingOwnerServiceAuth,
  type BindingOwnerServiceAuth,
} from "./binding-owner-service-auth.js";

/**
 * The growth-record contribution resolver, migrated verbatim from the legacy
 * Fastify harness (T-014 Wave 2). My-Chat resolves one Nurture
 * metric-observation contribution to a display-safe entry; raw metric values
 * never leave this boundary. Wire semantics are unchanged: 503
 * `contribution_resolve_disabled` until a >=16-char service token and
 * DATABASE_URL are present, 401 `service_auth_required`, 400
 * `invalid_contribution_request`, and 200 stopped/resolved otherwise.
 */

export const GROWTH_RECORD_CONTRIBUTION_PATH =
  "/internal/nurture/growth-record/contribution/resolve";

export const GROWTH_RECORD_CONTRIBUTION_CONFIG = Symbol(
  "GROWTH_RECORD_CONTRIBUTION_CONFIG",
);

const MIN_SERVICE_TOKEN_LENGTH = 16;
const MAX_WORKSPACE_ID_LENGTH = 512;
const MAX_SOURCE_CONTEXT_REFS = 32;
const TITLE_PREFIX = "Care observation: ";
const TITLE_MAX_LENGTH = 200;
const SUMMARY_MAX_LENGTH = 2_000;

export type GrowthRecordContributionConfig = Readonly<{
  serviceAuth: BindingOwnerServiceAuth;
  /** null = disabled (token missing/too short, or no DATABASE_URL). */
  prisma: NurturePrismaClient | null;
}>;

/**
 * A token shorter than 16 chars counts as unconfigured (harness parity), so
 * the shared NURTURE_INTERNAL_SERVICE_TOKEN is re-screened here rather than
 * reusing the app-wide serviceAuth verbatim.
 */
export function createGrowthRecordContributionConfig(input: {
  env?: NodeJS.ProcessEnv;
  token?: string;
  prisma?: NurturePrismaClient;
}): GrowthRecordContributionConfig {
  const env = input.env ?? process.env;
  const token = input.token ?? env.NURTURE_INTERNAL_SERVICE_TOKEN;
  const configured = Boolean(token && token.length >= MIN_SERVICE_TOKEN_LENGTH);
  const serviceAuth = createBindingOwnerServiceAuth(configured ? token : undefined);
  const prisma = configured
    ? (input.prisma ?? (env.DATABASE_URL ? createPrismaClient(env.DATABASE_URL) : null))
    : null;
  return Object.freeze({ serviceAuth, prisma });
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

// Structural parity with @my-chat/workflow-contracts assertCanonicalRef; the
// accepted wire shape for this Nurture-owned endpoint is frozen here.
const refKeys = new Set(["schema_version", "namespace", "object_type", "object_id", "version"]);
const namePattern = /^[a-z][a-z0-9._-]*$/u;

const isCanonicalRefShape = (
  value: unknown,
): value is { namespace: string; object_type: string; object_id: string } => {
  if (!isRecord(value)) return false;
  if (!Object.keys(value).every((key) => refKeys.has(key))) return false;
  if (value.schema_version !== 1) return false;
  if (typeof value.namespace !== "string" || !namePattern.test(value.namespace)) return false;
  if (typeof value.object_type !== "string" || !namePattern.test(value.object_type)) return false;
  if (
    typeof value.object_id !== "string" ||
    value.object_id.length === 0 ||
    value.object_id.length > 256
  ) {
    return false;
  }
  if (
    value.version !== undefined &&
    (typeof value.version !== "number" ||
      !Number.isSafeInteger(value.version) ||
      value.version < 0)
  ) {
    return false;
  }
  return true;
};

class ContributionRefError extends Error {}

/** Throws Error on a malformed request (400) and ContributionRefError when the
 * refs are well-formed but carry no usable nurture contribution ref (stopped). */
const parseContributionRef = (value: unknown): { object_id: string } => {
  if (!isRecord(value) || !Object.keys(value).every((key) => key === "workspace_id" || key === "source_context_refs")) {
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
  const refs = value.source_context_refs;
  if (!Array.isArray(refs) || refs.length === 0 || refs.length > MAX_SOURCE_CONTEXT_REFS) {
    throw new Error("invalid source context refs");
  }
  for (const ref of refs) {
    if (!isCanonicalRefShape(ref)) throw new Error("invalid canonical ref");
  }
  const nurtureRefs = (refs as { namespace: string; object_type: string; object_id: string }[]).filter(
    (ref) => ref.namespace === "nurture",
  );
  if (
    nurtureRefs.length === 0 ||
    nurtureRefs.some((ref) => ref.object_type !== "metric_observation")
  ) {
    throw new ContributionRefError();
  }
  return { object_id: nurtureRefs[0]!.object_id };
};

const observationTitle = (metricCode: string): string =>
  `${TITLE_PREFIX}${metricCode.replace(/[_-]/g, " ").trim()}`.slice(0, TITLE_MAX_LENGTH);

const summarize = (value: string | null): string | undefined => {
  const trimmed = value?.trim().slice(0, SUMMARY_MAX_LENGTH);
  return trimmed || undefined;
};

@Injectable()
export class GrowthRecordContributionAuthGuard implements CanActivate {
  constructor(
    @Inject(GROWTH_RECORD_CONTRIBUTION_CONFIG)
    private readonly config: GrowthRecordContributionConfig,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    if (!this.config.serviceAuth.configured || !this.config.prisma) {
      throw new ServiceUnavailableException({ error: "contribution_resolve_disabled" });
    }
    const request = context.switchToHttp().getRequest<IncomingMessage>();
    if (!this.config.serviceAuth.bearerAuthorized(request.headers.authorization)) {
      throw new UnauthorizedException({ error: "service_auth_required" });
    }
    return true;
  }
}

@Controller()
@UseGuards(GrowthRecordContributionAuthGuard)
export class GrowthRecordContributionController {
  constructor(
    @Inject(GROWTH_RECORD_CONTRIBUTION_CONFIG)
    private readonly config: GrowthRecordContributionConfig,
  ) {}

  @Post(GROWTH_RECORD_CONTRIBUTION_PATH)
  @HttpCode(HttpStatus.OK)
  async resolve(@Body() body: unknown) {
    let contributionId: string;
    try {
      contributionId = parseContributionRef(body).object_id;
    } catch (error) {
      if (error instanceof ContributionRefError) {
        return { status: "stopped", reason_code: "invalid_contribution_ref" };
      }
      throw new BadRequestException({ error: "invalid_contribution_request" });
    }

    const prisma = this.config.prisma;
    if (!prisma) {
      throw new ServiceUnavailableException({ error: "contribution_resolve_disabled" });
    }
    try {
      const observation = await prisma.nurtureMetricObservation.findUnique({
        where: { id: contributionId },
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
        return { status: "stopped", reason_code: "contribution_not_found" };
      }
      if (
        observation.status !== NurtureMetricObservationStatus.active ||
        !observation.userConfirmed ||
        !observation.childRefKey ||
        !observation.parentActorId
      ) {
        return { status: "stopped", reason_code: "not_shareable" };
      }

      const semanticSummary = summarize(observation.semanticSummary);
      return {
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
      };
    } catch {
      throw new InternalServerErrorException({ error: "contribution_resolve_unavailable" });
    }
  }
}
