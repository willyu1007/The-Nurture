import { timingSafeEqual } from "node:crypto";
import type { FastifyInstance } from "fastify";
import {
  NurtureScenarioBindingError,
  NurtureScenarioBindingOwnerVerifier,
  type NurtureBindingSubjectType,
  type NurtureScenarioOwnerAuthorizationReceipt,
} from "@the-nurture/scenario";
import {
  HmacNurtureBindingEvidenceHasher,
  PrismaNurtureScenarioBindingAuthorizationRepository,
  type NurturePrismaClient,
  type TransactionalNurtureBindingAuthorityReader,
} from "@the-nurture/db";

const AUTHORITY_TTL_MS = 5 * 60_000;
const MAX_IDENTIFIER_LENGTH = 512;

export type ScenarioBindingAuthorizeInput = {
  workspaceId: string;
  actingUserId: string;
  idempotencyKey: string;
  subjectType: NurtureBindingSubjectType;
  subjectId: string;
  scenarioKey: "nurture";
  actingActorId: string;
  representedOrganizationId?: string;
  purpose: "scenario_binding_write";
  correlationId?: string;
  traceId?: string;
};

export type ScenarioBindingOwnerAuthorizer = {
  authorize(
    input: ScenarioBindingAuthorizeInput,
  ): Promise<NurtureScenarioOwnerAuthorizationReceipt>;
};

/**
 * Production authority reader: the acting platform user must map to an
 * active Nurture participant holding a current active guardian care role in
 * the same workspace. The role row is locked FOR UPDATE inside the receipt
 * transaction so a concurrent revocation cannot overtake issuance, and the
 * role's id/version become the authorization-source evidence.
 */
export function createGuardianRoleAuthorityReader(
  now: () => Date = () => new Date(),
): TransactionalNurtureBindingAuthorityReader {
  return {
    verifyCurrent: async (transaction, input) => {
      const participants = await transaction.$queryRaw<
        { id: string }[]
      >`
        SELECT "id"
        FROM "nurture_participant"
        WHERE "workspace_id" = ${input.workspaceId}
          AND "my_chat_user_id" = ${input.actingUserId}
          AND "status" = 'active'
        ORDER BY "id"
        LIMIT 1
      `;
      const participant = participants[0];
      if (!participant) {
        throw new NurtureScenarioBindingError(
          "owner_authorization_denied",
          "The acting user has no active Nurture participant in this workspace.",
        );
      }
      const roles = await transaction.$queryRaw<
        { id: string; aggregateVersion: number }[]
      >`
        SELECT "id", "aggregate_version" AS "aggregateVersion"
        FROM "nurture_care_role_assignment"
        WHERE "workspace_id" = ${input.workspaceId}
          AND "participant_id" = ${participant.id}
          AND "role" = 'guardian'
          AND "status" = 'active'
        ORDER BY "id"
        LIMIT 1
        FOR UPDATE
      `;
      const role = roles[0];
      if (!role) {
        throw new NurtureScenarioBindingError(
          "owner_authorization_denied",
          "The acting participant holds no current guardian care role in this workspace.",
        );
      }
      const verifiedAt = now();
      return {
        authorizationSourceRef: `nurture-care-role:${role.id}`,
        authorizationSourceVersion: role.aggregateVersion,
        verifiedAt,
        expiresAt: new Date(verifiedAt.getTime() + AUTHORITY_TTL_MS),
      };
    },
  };
}

/**
 * Composes anchor reservation and atomic authorization issuance for the
 * internal owner endpoint. The reservation key is the exact platform subject
 * identity, so the same subject deterministically reuses one anchor; the key
 * is hashed before persistence and never stored raw.
 */
export function createScenarioBindingOwnerAuthorizer(input: {
  nurturePrisma: NurturePrismaClient;
  evidenceKey: string;
  now?: () => Date;
}): ScenarioBindingOwnerAuthorizer {
  const clock = input.now ?? (() => new Date());
  const hasher = new HmacNurtureBindingEvidenceHasher(input.evidenceKey);
  return {
    async authorize(request) {
      // One frozen instant per request: the verifier validates the reader's
      // verifiedAt against its own captured now, so both must share it.
      const at = clock();
      const frozenNow = () => at;
      const verifier = new NurtureScenarioBindingOwnerVerifier(
        new PrismaNurtureScenarioBindingAuthorizationRepository(
          input.nurturePrisma,
          createGuardianRoleAuthorityReader(frozenNow),
        ),
        hasher,
        frozenNow,
      );
      const reserved = await verifier.reserveAnchor(
        request.subjectType,
        [request.workspaceId, request.subjectType, request.subjectId].join(
          "\u0000",
        ),
      );
      return verifier.verify({
        workspaceId: request.workspaceId,
        actingUserId: request.actingUserId,
        idempotencyKey: request.idempotencyKey,
        subjectType: request.subjectType,
        subjectId: request.subjectId,
        scenarioKey: request.scenarioKey,
        ownerRef: reserved.ownerRef,
        ownerVersion: reserved.ownerVersion,
        actingActorId: request.actingActorId,
        ...(request.representedOrganizationId
          ? { representedOrganizationId: request.representedOrganizationId }
          : {}),
        purpose: request.purpose,
        ...(request.correlationId
          ? { correlationId: request.correlationId }
          : {}),
        ...(request.traceId ? { traceId: request.traceId } : {}),
      });
    },
  };
}

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
