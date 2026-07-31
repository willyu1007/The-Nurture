import { timingSafeEqual } from "node:crypto";
import type { FastifyInstance } from "fastify";
import {
  NurtureScenarioBindingError,
  type ScenarioBindingOwnerAuthorizer,
} from "@the-nurture/scenario/binding-owner";

const MAX_IDENTIFIER_LENGTH = 512;

const ERROR_STATUS: Record<string, number> = {
  invalid_binding_request: 400,
  invalid_owner_ref: 400,
  anchor_not_found: 409,
  anchor_not_current: 409,
  authorization_replay_conflict: 409,
  authorization_receipt_inactive: 409,
  owner_authorization_denied: 403,
  owner_authorization_unavailable: 503,
};

export function registerScenarioBindingOwnerRoute(
  fastify: FastifyInstance,
  options: {
    authorizer?: ScenarioBindingOwnerAuthorizer;
    internalServiceToken?: string;
  },
): void {
  fastify.post<{
    Body: {
      workspace_id?: string;
      acting_user_id?: string;
      idempotency_key?: string;
      subject_type?: string;
      subject_id?: string;
      scenario_key?: string;
      acting_actor_id?: string;
      represented_organization_id?: string;
      purpose?: string;
      correlation_id?: string;
      trace_id?: string;
    };
  }>("/internal/nurture/scenario-binding/authorize", async (req, reply) => {
    if (!options.authorizer || !options.internalServiceToken) {
      return reply.code(503).send({ error: "binding_owner_disabled" });
    }
    if (!bearerAuthorized(req.headers.authorization, options.internalServiceToken)) {
      return reply.code(401).send({ error: "service_auth_required" });
    }
    const body = req.body ?? {};
    if (
      !isBoundedText(body.workspace_id) ||
      !isBoundedText(body.acting_user_id) ||
      !isBoundedText(body.idempotency_key) ||
      (body.subject_type !== "child" && body.subject_type !== "family") ||
      !isBoundedText(body.subject_id) ||
      body.scenario_key !== "nurture" ||
      !isBoundedText(body.acting_actor_id) ||
      (body.represented_organization_id !== undefined &&
        !isBoundedText(body.represented_organization_id)) ||
      body.purpose !== "scenario_binding_write"
    ) {
      return reply.code(400).send({ error: "invalid_binding_request" });
    }
    try {
      const receipt = await options.authorizer.authorize({
        workspaceId: body.workspace_id,
        actingUserId: body.acting_user_id,
        idempotencyKey: body.idempotency_key,
        subjectType: body.subject_type,
        subjectId: body.subject_id,
        scenarioKey: "nurture",
        actingActorId: body.acting_actor_id,
        ...(body.represented_organization_id
          ? { representedOrganizationId: body.represented_organization_id }
          : {}),
        purpose: "scenario_binding_write",
        ...(body.correlation_id ? { correlationId: body.correlation_id } : {}),
        ...(body.trace_id ? { traceId: body.trace_id } : {}),
      });
      return reply.send({
        status: "authorized",
        authorization_ref: receipt.authorizationRef,
        workspace_id: receipt.workspaceId,
        subject_type: receipt.subjectType,
        subject_id: receipt.subjectId,
        scenario_key: receipt.scenarioKey,
        owner_ref: receipt.ownerRef,
        owner_version: receipt.ownerVersion,
        authorized_actor_id: receipt.authorizedActorId,
        ...(receipt.representedOrganizationId
          ? { represented_organization_id: receipt.representedOrganizationId }
          : {}),
        purpose: receipt.purpose,
        verified_at: receipt.verifiedAt.toISOString(),
        expires_at: receipt.expiresAt.toISOString(),
      });
    } catch (error) {
      if (error instanceof NurtureScenarioBindingError) {
        return reply
          .code(ERROR_STATUS[error.code] ?? 500)
          .send({ error: error.code });
      }
      return reply.code(500).send({ error: "owner_authorization_unavailable" });
    }
  });
}

function bearerAuthorized(
  header: string | undefined,
  token: string,
): boolean {
  if (!header || !header.startsWith("Bearer ")) return false;
  const supplied = Buffer.from(header.slice("Bearer ".length), "utf8");
  const expected = Buffer.from(token, "utf8");
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

function isBoundedText(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= MAX_IDENTIFIER_LENGTH
  );
}
