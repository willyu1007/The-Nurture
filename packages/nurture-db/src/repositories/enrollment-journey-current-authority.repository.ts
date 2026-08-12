import { Prisma, type PrismaClient } from "@prisma/client";
import {
  assertCanonicalRef,
  type CanonicalRef,
} from "@my-chat/workflow-contracts";
import type {
  NurtureEnrollmentJourneyAdminRoleReaderV1,
  NurtureEnrollmentJourneyAdminRoleV1,
  NurtureEnrollmentJourneyCurrentTargetReaderV1,
  NurtureEnrollmentJourneyCurrentTargetV1,
  NurtureEnrollmentJourneyTargetSelectionV1,
  NurtureParticipantAuthorityReader,
} from "@the-nurture/scenario";

type PrismaReader = PrismaClient | Prisma.TransactionClient;

const ENROLLMENT_JOURNEY_FORMAL_OPERATIONS = new Set([
  "query_enrollment_journey",
  "prepare_enrollment_journey_command",
  "execute_prepared_enrollment_journey_command",
]);

export class PrismaNurtureEnrollmentJourneyParticipantAuthorityReader
implements NurtureParticipantAuthorityReader {
  constructor(private readonly prisma: PrismaReader) {}

  async authorizeCurrent(
    input: Parameters<NurtureParticipantAuthorityReader["authorizeCurrent"]>[0],
  ): ReturnType<NurtureParticipantAuthorityReader["authorizeCurrent"]> {
    if (
      input.principal_origin !== "interactive_session"
      || !ENROLLMENT_JOURNEY_FORMAL_OPERATIONS.has(input.operation_key)
      || input.participant_ref.namespace !== "nurture"
      || input.participant_ref.object_type !== "participant"
      || input.workspace_ref.namespace !== "my_chat"
      || input.workspace_ref.object_type !== "workspace"
    ) {
      return deniedParticipantAuthority("enrollment_journey_participant_operation_denied");
    }

    const rows = await this.prisma.$queryRaw<Array<{ authority_revision: number }>>(
      Prisma.sql`SELECT participant."aggregate_version" AS "authority_revision"
        FROM "nurture_participant" participant
        WHERE participant."id" = ${input.participant_ref.object_id}
          AND participant."workspace_id" = ${input.workspace_ref.object_id}
          AND participant."status" = 'active'
          AND participant."deleted_at" IS NULL
        LIMIT 1`,
    );
    const row = rows[0];
    if (!row || !Number.isSafeInteger(row.authority_revision) || row.authority_revision < 0) {
      return deniedParticipantAuthority("enrollment_journey_participant_authority_missing");
    }
    return {
      authority_version: 1,
      authorized: true,
      authority_revision: row.authority_revision,
      reason_code: "enrollment_journey_participant_authorized",
    };
  }
}

export class PrismaNurtureEnrollmentJourneyCurrentTargetReader
implements NurtureEnrollmentJourneyCurrentTargetReaderV1 {
  constructor(private readonly prisma: PrismaReader) {}

  async resolveCurrent(
    input: Parameters<NurtureEnrollmentJourneyCurrentTargetReaderV1["resolveCurrent"]>[0],
  ): ReturnType<NurtureEnrollmentJourneyCurrentTargetReaderV1["resolveCurrent"]> {
    const target = await this.readTarget(input.workspace_id, input.selection);
    if (!target) return { status: "not_found" };
    return { status: "resolved", target };
  }

  private async readTarget(
    workspaceId: string,
    selection: NurtureEnrollmentJourneyTargetSelectionV1,
  ): Promise<NurtureEnrollmentJourneyCurrentTargetV1 | null> {
    switch (selection.target_kind) {
      case "care_group": {
        const row = await this.prisma.nurtureCareGroup.findFirst({
          where: {
            id: selection.target_ref,
            workspaceId,
            status: "active",
            deletedAt: null,
            institution: { workspaceId, status: "active", deletedAt: null },
          },
          select: {
            aggregateVersion: true,
            institution: { select: { id: true, aggregateVersion: true } },
          },
        });
        return row ? {
          institution_ref: row.institution.id,
          institution_revision: row.institution.aggregateVersion,
          target_revision: row.aggregateVersion,
        } : null;
      }
      case "journey": {
        const row = await this.prisma.nurtureInstitutionWorkflow.findFirst({
          where: {
            id: selection.target_ref,
            workspaceId,
            institution: { workspaceId, status: "active", deletedAt: null },
          },
          select: {
            workflowHead: true,
            institution: { select: { id: true, aggregateVersion: true } },
            inquiry: { select: { hostContactRef: true } },
          },
        });
        const hostContactRef = parseHostContactRef(row?.inquiry?.hostContactRef);
        return row ? {
          institution_ref: row.institution.id,
          institution_revision: row.institution.aggregateVersion,
          target_revision: row.workflowHead,
          ...(hostContactRef ? { host_contact_ref: hostContactRef } : {}),
        } : null;
      }
      case "prospective_contact": {
        // The contact row lives in My-Chat; its currency is re-verified by the
        // Host owner at binding time. The local read pins the institution the
        // option claims.
        const row = await this.prisma.nurtureCareInstitution.findFirst({
          where: {
            id: selection.institution_ref,
            workspaceId,
            status: "active",
            deletedAt: null,
          },
          select: { id: true, aggregateVersion: true },
        });
        return row ? {
          institution_ref: row.id,
          institution_revision: row.aggregateVersion,
          target_revision: selection.contact_version,
        } : null;
      }
    }
  }
}

function parseHostContactRef(value: unknown): CanonicalRef | null {
  try {
    assertCanonicalRef(value);
  } catch {
    return null;
  }
  return value.namespace === "my_chat"
    && value.object_type === "nurture_prospective_contact"
    ? value
    : null;
}

export class PrismaNurtureEnrollmentJourneyAdminRoleReader
implements NurtureEnrollmentJourneyAdminRoleReaderV1 {
  constructor(private readonly prisma: PrismaReader) {}

  async readCurrent(
    input: Parameters<NurtureEnrollmentJourneyAdminRoleReaderV1["readCurrent"]>[0],
  ): ReturnType<NurtureEnrollmentJourneyAdminRoleReaderV1["readCurrent"]> {
    if (input.limit !== 2) return [];
    const at = new Date(input.at);
    return this.prisma.$queryRaw<NurtureEnrollmentJourneyAdminRoleV1[]>(
      Prisma.sql`SELECT
        role_assignment."id" AS "role_assignment_ref",
        role_assignment."aggregate_version" AS "role_assignment_revision",
        institution."id" AS "institution_ref",
        institution."aggregate_version" AS "institution_revision"
      FROM "nurture_care_role_assignment" role_assignment
      INNER JOIN "nurture_participant" participant
        ON participant."id" = role_assignment."participant_id"
        AND participant."workspace_id" = role_assignment."workspace_id"
        AND participant."status" = 'active'
        AND participant."deleted_at" IS NULL
      INNER JOIN "nurture_care_institution" institution
        ON institution."id" = role_assignment."scope_id"
        AND institution."workspace_id" = role_assignment."workspace_id"
        AND institution."status" = 'active'
        AND institution."deleted_at" IS NULL
      WHERE role_assignment."workspace_id" = ${input.workspace_id}
        AND role_assignment."participant_id" = ${input.participant_ref}
        AND role_assignment."role" = 'institution_admin'
        AND role_assignment."scope_type" = 'institution'
        AND role_assignment."scope_id" = ${input.institution_ref}
        AND role_assignment."status" = 'active'
        AND role_assignment."deleted_at" IS NULL
        AND (role_assignment."starts_at" IS NULL
          OR role_assignment."starts_at" <= (${at}::timestamptz AT TIME ZONE 'UTC'))
        AND (role_assignment."ends_at" IS NULL
          OR role_assignment."ends_at" > (${at}::timestamptz AT TIME ZONE 'UTC'))
      ORDER BY role_assignment."id"
      LIMIT 2`,
    );
  }
}

function deniedParticipantAuthority(reason_code: string) {
  return {
    authority_version: 1 as const,
    authorized: false,
    authority_revision: 0,
    reason_code,
  };
}
