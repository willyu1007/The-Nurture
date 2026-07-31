import {
  NurtureScenarioBindingError,
  NurtureScenarioBindingOwnerVerifier,
  type ScenarioBindingOwnerAuthorizer,
} from "@the-nurture/scenario/binding-owner";
import { HmacNurtureBindingEvidenceHasher } from "./binding-evidence-hasher.js";
import type { NurturePrismaClient } from "./client.js";
import {
  PrismaNurtureScenarioBindingAuthorizationRepository,
  type TransactionalNurtureBindingAuthorityReader,
} from "./repositories/scenario-binding-owner.repository.js";

const AUTHORITY_TTL_MS = 5 * 60_000;

/**
 * Reads the current Nurture participant and Guardian authority inside the
 * receipt transaction. Both selected rows must be active and not soft-deleted;
 * the exact role row is locked until receipt issuance commits.
 */
export function createGuardianRoleAuthorityReader(
  now: () => Date = () => new Date(),
): TransactionalNurtureBindingAuthorityReader {
  return {
    verifyCurrent: async (transaction, input) => {
      const at = now();
      const participants = await transaction.$queryRaw<{ id: string }[]>`
        SELECT "id"
        FROM "nurture_participant"
        WHERE "workspace_id" = ${input.workspaceId}
          AND "my_chat_user_id" = ${input.actingUserId}
          AND "status" = 'active'
          AND "deleted_at" IS NULL
        ORDER BY "id"
        LIMIT 1
        FOR SHARE
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
          AND "deleted_at" IS NULL
          AND (
            "starts_at" IS NULL
            OR "starts_at" <= (${at}::timestamptz AT TIME ZONE 'UTC')
          )
          AND (
            "ends_at" IS NULL
            OR "ends_at" > (${at}::timestamptz AT TIME ZONE 'UTC')
          )
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

      return {
        authorizationSourceRef: `nurture-care-role:${role.id}`,
        authorizationSourceVersion: role.aggregateVersion,
        verifiedAt: at,
        expiresAt: new Date(at.getTime() + AUTHORITY_TTL_MS),
      };
    },
  };
}

/**
 * Composes deterministic anchor reservation with transaction-atomic current
 * authority verification and receipt issuance.
 */
export function createScenarioBindingOwnerAuthorizer(input: {
  nurturePrisma: NurturePrismaClient;
  evidenceKey: string;
  now?: () => Date;
  authorityReaderFactory?: (
    now: () => Date,
  ) => TransactionalNurtureBindingAuthorityReader;
}): ScenarioBindingOwnerAuthorizer {
  const clock = input.now ?? (() => new Date());
  const hasher = new HmacNurtureBindingEvidenceHasher(input.evidenceKey);
  const authorityReaderFactory =
    input.authorityReaderFactory ?? createGuardianRoleAuthorityReader;

  return {
    async authorize(request) {
      const at = clock();
      const frozenNow = () => at;
      const verifier = new NurtureScenarioBindingOwnerVerifier(
        new PrismaNurtureScenarioBindingAuthorizationRepository(
          input.nurturePrisma,
          authorityReaderFactory(frozenNow),
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
