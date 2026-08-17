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
  Post,
  ServiceUnavailableException,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import { NurtureUserAttentionService } from "@the-nurture/scenario";
import { PrismaUserAttentionRepository, createPrismaClient } from "@the-nurture/db";
import type { BindingOwnerServiceAuth } from "./binding-owner-service-auth.js";

/**
 * The user-attention activation owner routes, migrated verbatim from the
 * legacy Fastify harness (T-014 Wave 2). Wire semantics are unchanged:
 * 503 `activation_owner_disabled` until service auth and DATABASE_URL are
 * both present, 401 `service_auth_required` on a bad bearer, 400 on a
 * malformed body, and the owner outcome payload otherwise. Serving the
 * route grants nothing by itself; activation remains default-off.
 */

export const USER_ATTENTION_RESOLVE_PATH =
  "/internal/nurture/activation/user-attention/resolve";
export const USER_ATTENTION_ACKNOWLEDGE_PATH =
  "/internal/nurture/activation/user-attention/acknowledge";

export const USER_ATTENTION_OWNER_CONFIG = Symbol("USER_ATTENTION_OWNER_CONFIG");

type ResolveInput = Parameters<NurtureUserAttentionService["resolve"]>[0];
type AcknowledgeInput = Parameters<NurtureUserAttentionService["acknowledge"]>[0];

export type UserAttentionOwnerService = Pick<
  NurtureUserAttentionService,
  "resolve" | "acknowledge"
>;

export type UserAttentionOwnerConfig = Readonly<{
  serviceAuth: BindingOwnerServiceAuth;
  /** null = disabled (no DATABASE_URL to compose the owner against). */
  service: UserAttentionOwnerService | null;
}>;

export function createUserAttentionOwnerConfig(input: {
  env?: NodeJS.ProcessEnv;
  serviceAuth: BindingOwnerServiceAuth;
  service?: UserAttentionOwnerService;
}): UserAttentionOwnerConfig {
  const env = input.env ?? process.env;
  const service =
    input.service ??
    (input.serviceAuth.configured && env.DATABASE_URL
      ? new NurtureUserAttentionService(
          new PrismaUserAttentionRepository(createPrismaClient(env.DATABASE_URL)),
        )
      : null);
  return Object.freeze({ serviceAuth: input.serviceAuth, service });
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

@Injectable()
export class UserAttentionOwnerServiceAuthGuard implements CanActivate {
  constructor(
    @Inject(USER_ATTENTION_OWNER_CONFIG)
    private readonly config: UserAttentionOwnerConfig,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    // Disabled-first, matching the harness: a missing service token or an
    // uncomposed owner 503s before any credential is inspected.
    if (!this.config.serviceAuth.configured || !this.config.service) {
      throw new ServiceUnavailableException({ error: "activation_owner_disabled" });
    }
    const request = context.switchToHttp().getRequest<IncomingMessage>();
    if (!this.config.serviceAuth.bearerAuthorized(request.headers.authorization)) {
      throw new UnauthorizedException({ error: "service_auth_required" });
    }
    return true;
  }
}

@Controller()
@UseGuards(UserAttentionOwnerServiceAuthGuard)
export class UserAttentionOwnerController {
  constructor(
    @Inject(USER_ATTENTION_OWNER_CONFIG)
    private readonly config: UserAttentionOwnerConfig,
  ) {}

  @Post(USER_ATTENTION_RESOLVE_PATH)
  @HttpCode(HttpStatus.OK)
  async resolve(@Body() body: unknown) {
    const record = isRecord(body) ? body : undefined;
    const workspaceId = record?.workspace_id;
    if (
      typeof workspaceId !== "string" ||
      workspaceId.length === 0 ||
      !Array.isArray(record?.source_context_refs)
    ) {
      throw new BadRequestException({ error: "invalid_owner_read_request" });
    }
    const actorUserId = record.actor_user_id;
    return this.service().resolve({
      workspace_id: workspaceId,
      source_context_refs:
        record.source_context_refs as ResolveInput["source_context_refs"],
      ...(typeof actorUserId === "string" && actorUserId.length > 0
        ? { actor_user_id: actorUserId }
        : {}),
    });
  }

  @Post(USER_ATTENTION_ACKNOWLEDGE_PATH)
  @HttpCode(HttpStatus.OK)
  async acknowledge(@Body() body: unknown) {
    const record = isRecord(body) ? body : undefined;
    const workspaceId = record?.workspace_id;
    const actorUserId = record?.actor_user_id;
    const expectedItemVersion = record?.expected_item_version;
    const idempotencyKey = record?.idempotency_key;
    if (
      typeof workspaceId !== "string" ||
      workspaceId.length === 0 ||
      !Array.isArray(record?.source_context_refs) ||
      typeof actorUserId !== "string" ||
      actorUserId.length === 0 ||
      typeof expectedItemVersion !== "number" ||
      !Number.isSafeInteger(expectedItemVersion) ||
      expectedItemVersion < 1 ||
      typeof idempotencyKey !== "string" ||
      idempotencyKey.length === 0 ||
      idempotencyKey.length > 200
    ) {
      throw new BadRequestException({ error: "invalid_owner_action_request" });
    }
    return this.service().acknowledge({
      workspace_id: workspaceId,
      source_context_refs:
        record.source_context_refs as AcknowledgeInput["source_context_refs"],
      actor_user_id: actorUserId,
      expected_item_version: expectedItemVersion,
      idempotency_key: idempotencyKey,
    });
  }

  private service(): UserAttentionOwnerService {
    if (!this.config.service) {
      throw new ServiceUnavailableException({ error: "activation_owner_disabled" });
    }
    return this.config.service;
  }
}
