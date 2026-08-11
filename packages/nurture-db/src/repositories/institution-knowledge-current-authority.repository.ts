import { Prisma, type PrismaClient } from "@prisma/client";
import type {
  NurtureInstitutionKnowledgeCurrentTargetReaderV1,
  NurtureInstitutionKnowledgeCurrentTargetV1,
  NurtureInstitutionKnowledgeInstitutionAdminRoleReaderV1,
  NurtureInstitutionKnowledgeTargetSelectionV1,
  NurtureParticipantAuthorityReader,
} from "@the-nurture/scenario";

type PrismaReader = PrismaClient | Prisma.TransactionClient;

const INSTITUTION_KNOWLEDGE_FORMAL_OPERATIONS = new Set([
  "query_institution_knowledge",
  "prepare_institution_knowledge_command",
  "execute_prepared_institution_knowledge_command",
]);

/**
 * Participant-level admission for the formal Institution Knowledge ingress.
 * Exact institution scope is resolved separately from the authenticated target
 * option; this reader only proves that a current local Participant has at least
 * one current Institution Admin assignment in an active institution.
 */
export class PrismaNurtureInstitutionKnowledgeParticipantAuthorityReader
implements NurtureParticipantAuthorityReader {
  private readonly now: () => Date;

  constructor(
    private readonly prisma: PrismaReader,
    now: () => Date = () => new Date(),
  ) {
    this.now = now;
  }

  async authorizeCurrent(
    input: Parameters<NurtureParticipantAuthorityReader["authorizeCurrent"]>[0],
  ): ReturnType<NurtureParticipantAuthorityReader["authorizeCurrent"]> {
    if (
      input.principal_origin !== "interactive_session"
      || !INSTITUTION_KNOWLEDGE_FORMAL_OPERATIONS.has(input.operation_key)
      || input.participant_ref.namespace !== "nurture"
      || input.participant_ref.object_type !== "participant"
      || input.workspace_ref.namespace !== "my_chat"
      || input.workspace_ref.object_type !== "workspace"
    ) {
      return deniedParticipantAuthority("institution_knowledge_participant_operation_denied");
    }

    const at = this.now();
    const rows = await this.prisma.$queryRaw<Array<{ authority_revision: number }>>(
      Prisma.sql`SELECT participant."aggregate_version" AS "authority_revision"
        FROM "nurture_participant" participant
        WHERE participant."id" = ${input.participant_ref.object_id}
          AND participant."workspace_id" = ${input.workspace_ref.object_id}
          AND participant."status" = 'active'
          AND participant."deleted_at" IS NULL
          AND EXISTS (
            SELECT 1
            FROM "nurture_care_role_assignment" role_assignment
            INNER JOIN "nurture_care_institution" institution
              ON institution."id" = role_assignment."scope_id"
              AND institution."workspace_id" = role_assignment."workspace_id"
              AND institution."status" = 'active'
              AND institution."deleted_at" IS NULL
            WHERE role_assignment."workspace_id" = participant."workspace_id"
              AND role_assignment."participant_id" = participant."id"
              AND role_assignment."role" = 'institution_admin'
              AND role_assignment."scope_type" = 'institution'
              AND role_assignment."status" = 'active'
              AND role_assignment."deleted_at" IS NULL
              AND (role_assignment."starts_at" IS NULL
                OR role_assignment."starts_at" <= (${at}::timestamptz AT TIME ZONE 'UTC'))
              AND (role_assignment."ends_at" IS NULL
                OR role_assignment."ends_at" > (${at}::timestamptz AT TIME ZONE 'UTC'))
          )
        LIMIT 1`,
    );
    const row = rows[0];
    if (!row || !Number.isSafeInteger(row.authority_revision) || row.authority_revision < 0) {
      return deniedParticipantAuthority("institution_knowledge_participant_authority_missing");
    }
    return {
      authority_version: 1,
      authorized: true,
      authority_revision: row.authority_revision,
      reason_code: "institution_knowledge_participant_authorized",
    };
  }
}

export class PrismaNurtureInstitutionKnowledgeCurrentTargetReader
implements NurtureInstitutionKnowledgeCurrentTargetReaderV1 {
  constructor(private readonly prisma: PrismaReader) {}

  async resolveCurrent(
    input: Parameters<NurtureInstitutionKnowledgeCurrentTargetReaderV1["resolveCurrent"]>[0],
  ): ReturnType<NurtureInstitutionKnowledgeCurrentTargetReaderV1["resolveCurrent"]> {
    const target = await this.readTarget(input.workspace_id, input.selection);
    if (!target) return { status: "not_found" };
    if (
      input.selection.target_version !== undefined
      && input.selection.target_version !== target.target_revision
    ) return { status: "stale" };
    return { status: "resolved", target };
  }

  private async readTarget(
    workspaceId: string,
    selection: NurtureInstitutionKnowledgeTargetSelectionV1,
  ): Promise<NurtureInstitutionKnowledgeCurrentTargetV1 | null> {
    switch (selection.target_kind) {
      case "institution": {
        const row = await this.prisma.nurtureCareInstitution.findFirst({
          where: {
            id: selection.target_ref,
            workspaceId,
            status: "active",
            deletedAt: null,
          },
          select: { id: true, aggregateVersion: true },
        });
        return row ? {
          institution_ref: row.id,
          institution_revision: row.aggregateVersion,
          target_revision: row.aggregateVersion,
        } : null;
      }
      case "item": {
        const row = await this.prisma.nurtureInstitutionKnowledgeItem.findFirst({
          where: {
            id: selection.target_ref,
            workspaceId,
            institution: { workspaceId, status: "active", deletedAt: null },
          },
          select: {
            itemHead: true,
            institution: { select: { id: true, aggregateVersion: true } },
          },
        });
        return row ? {
          institution_ref: row.institution.id,
          institution_revision: row.institution.aggregateVersion,
          target_revision: row.itemHead,
        } : null;
      }
      case "revision": {
        const row = await this.prisma.nurtureInstitutionKnowledgeRevision.findFirst({
          where: {
            id: selection.target_ref,
            workspaceId,
            institution: { workspaceId, status: "active", deletedAt: null },
          },
          select: {
            revisionNumber: true,
            institution: { select: { id: true, aggregateVersion: true } },
          },
        });
        return row ? {
          institution_ref: row.institution.id,
          institution_revision: row.institution.aggregateVersion,
          target_revision: row.revisionNumber,
        } : null;
      }
    }
  }
}

export class PrismaNurtureInstitutionKnowledgeInstitutionAdminRoleReader
implements NurtureInstitutionKnowledgeInstitutionAdminRoleReaderV1 {
  constructor(private readonly prisma: PrismaReader) {}

  async readCurrent(
    input: Parameters<NurtureInstitutionKnowledgeInstitutionAdminRoleReaderV1["readCurrent"]>[0],
  ): ReturnType<NurtureInstitutionKnowledgeInstitutionAdminRoleReaderV1["readCurrent"]> {
    if (input.limit !== 1) return [];
    const at = new Date(input.at);
    return this.prisma.$queryRaw<Array<{
      role_assignment_ref: string;
      role_assignment_revision: number;
      institution_ref: string;
      institution_revision: number;
    }>>(Prisma.sql`SELECT
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
        AND role_assignment."id" = ${input.role_assignment_ref}
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
      LIMIT 1`);
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
