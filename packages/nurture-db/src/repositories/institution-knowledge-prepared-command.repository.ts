import {
  Prisma,
  type NurtureInstitutionKnowledgePreparedCommand,
  type PrismaClient,
} from "@prisma/client";
import type {
  NurtureInstitutionKnowledgeActionKey,
  NurtureInstitutionKnowledgePreparedCommandLedgerV1,
  NurtureInstitutionKnowledgePreparedCommandRecordV1,
} from "@the-nurture/scenario";

type PreparedCommandRow = NurtureInstitutionKnowledgePreparedCommand;

const toRecord = (
  row: PreparedCommandRow,
): NurtureInstitutionKnowledgePreparedCommandRecordV1 => ({
  command_request_id: row.commandRequestId,
  workspace_id: row.workspaceId,
  participant_ref: row.participantId,
  institution_ref: row.institutionId,
  role_assignment_ref: row.roleAssignmentId,
  client_surface: row.clientSurface as "web_run_workbench",
  client_command_id_hash: row.clientCommandIdHash,
  prepare_fingerprint: row.prepareFingerprint,
  origin_invocation_request_id_hash: row.originInvocationRequestIdHash,
  confirmation_ref_hash: row.confirmationRefHash,
  capability_key: row.capabilityKey as NurtureInstitutionKnowledgeActionKey,
  snapshot_codec_version: row.snapshotCodecVersion,
  frozen_snapshot_ciphertext: row.frozenSnapshotCiphertext,
  status: row.status,
  prepared_at: row.preparedAt.toISOString(),
  expires_at: row.expiresAt.toISOString(),
  ...(row.consumedAt ? { consumed_at: row.consumedAt.toISOString() } : {}),
  aggregate_version: row.aggregateVersion,
});

/** PostgreSQL-backed dedup and atomic confirmation consumption owner. */
export class PrismaNurtureInstitutionKnowledgePreparedCommandLedger
implements NurtureInstitutionKnowledgePreparedCommandLedgerV1 {
  constructor(private readonly prisma: PrismaClient) {}

  async getOrCreate(
    input: NurtureInstitutionKnowledgePreparedCommandRecordV1,
  ): ReturnType<NurtureInstitutionKnowledgePreparedCommandLedgerV1["getOrCreate"]> {
    try {
      const created = await this.prisma.nurtureInstitutionKnowledgePreparedCommand.create({
        data: {
          commandRequestId: input.command_request_id,
          workspaceId: input.workspace_id,
          participantId: input.participant_ref,
          institutionId: input.institution_ref,
          roleAssignmentId: input.role_assignment_ref,
          clientSurface: input.client_surface,
          clientCommandIdHash: input.client_command_id_hash,
          prepareFingerprint: input.prepare_fingerprint,
          originInvocationRequestIdHash: input.origin_invocation_request_id_hash,
          confirmationRefHash: input.confirmation_ref_hash,
          capabilityKey: input.capability_key,
          snapshotCodecVersion: input.snapshot_codec_version,
          frozenSnapshotCiphertext: input.frozen_snapshot_ciphertext,
          status: input.status,
          preparedAt: new Date(input.prepared_at),
          expiresAt: new Date(input.expires_at),
          ...(input.consumed_at ? { consumedAt: new Date(input.consumed_at) } : {}),
          aggregateVersion: input.aggregate_version,
        },
      });
      return { status: "created", record: toRecord(created) };
    } catch (error) {
      if (!isUniqueConflict(error)) throw error;
      const existing = await this.prisma.nurtureInstitutionKnowledgePreparedCommand.findUnique({
        where: {
          workspaceId_participantId_clientSurface_clientCommandIdHash: {
            workspaceId: input.workspace_id,
            participantId: input.participant_ref,
            clientSurface: input.client_surface,
            clientCommandIdHash: input.client_command_id_hash,
          },
        },
      });
      if (!existing) throw error;
      return { status: "existing", record: toRecord(existing) };
    }
  }

  consumeExact(
    input: Parameters<NurtureInstitutionKnowledgePreparedCommandLedgerV1["consumeExact"]>[0],
  ): ReturnType<NurtureInstitutionKnowledgePreparedCommandLedgerV1["consumeExact"]> {
    return this.prisma.$transaction(async (transaction) => {
      const locked = await transaction.$queryRaw<Array<{ command_request_id: string }>>(
        Prisma.sql`SELECT "command_request_id"
          FROM "nurture_institution_knowledge_prepared_command"
          WHERE "command_request_id" = ${input.command_request_id}
            AND "workspace_id" = ${input.workspace_id}
          FOR UPDATE`,
      );
      if (locked.length === 0) return { status: "not_found" as const };

      const row = await transaction.nurtureInstitutionKnowledgePreparedCommand.findUnique({
        where: { commandRequestId: input.command_request_id },
      });
      if (!row || row.workspaceId !== input.workspace_id) {
        return { status: "not_found" as const };
      }
      if (
        row.participantId !== input.participant_ref
        || row.confirmationRefHash !== input.confirmation_ref_hash
      ) return { status: "conflict" as const };
      if (row.status === "consumed") {
        return { status: "replayed" as const, record: toRecord(row) };
      }

      const consumedAt = new Date(input.consumed_at);
      if (row.status === "expired" || row.expiresAt <= consumedAt) {
        if (row.status === "prepared") {
          await transaction.nurtureInstitutionKnowledgePreparedCommand.updateMany({
            where: {
              commandRequestId: row.commandRequestId,
              status: "prepared",
              aggregateVersion: row.aggregateVersion,
            },
            data: { status: "expired", aggregateVersion: { increment: 1 } },
          });
        }
        return { status: "expired" as const };
      }

      const updated = await transaction.nurtureInstitutionKnowledgePreparedCommand.updateMany({
        where: {
          commandRequestId: row.commandRequestId,
          workspaceId: input.workspace_id,
          participantId: input.participant_ref,
          confirmationRefHash: input.confirmation_ref_hash,
          status: "prepared",
          aggregateVersion: row.aggregateVersion,
          expiresAt: { gt: consumedAt },
        },
        data: {
          status: "consumed",
          consumedAt,
          aggregateVersion: { increment: 1 },
        },
      });
      if (updated.count !== 1) return { status: "conflict" as const };
      const consumed = await transaction.nurtureInstitutionKnowledgePreparedCommand.findUniqueOrThrow({
        where: { commandRequestId: row.commandRequestId },
      });
      return { status: "consumed" as const, record: toRecord(consumed) };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted });
  }
}

function isUniqueConflict(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}
