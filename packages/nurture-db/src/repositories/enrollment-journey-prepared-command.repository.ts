import {
  Prisma,
  type NurtureEnrollmentJourneyPreparedCommand,
  type PrismaClient,
} from "@prisma/client";
import type {
  NurtureEnrollmentJourneyLedgeredCommandKey,
  NurtureEnrollmentJourneyPreparedCommandLedgerV1,
  NurtureEnrollmentJourneyPreparedCommandRecordV1,
} from "@the-nurture/scenario";

type PreparedCommandRow = NurtureEnrollmentJourneyPreparedCommand;
type LedgerClient = PrismaClient | Prisma.TransactionClient;

const toRecord = (
  row: PreparedCommandRow,
): NurtureEnrollmentJourneyPreparedCommandRecordV1 => ({
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
  capability_key: row.capabilityKey as NurtureEnrollmentJourneyLedgeredCommandKey,
  snapshot_codec_version: row.snapshotCodecVersion,
  frozen_snapshot_ciphertext: row.frozenSnapshotCiphertext,
  status: row.status,
  prepared_at: row.preparedAt.toISOString(),
  expires_at: row.expiresAt.toISOString(),
  ...(row.consumedAt ? { consumed_at: row.consumedAt.toISOString() } : {}),
  aggregate_version: row.aggregateVersion,
});

/**
 * PostgreSQL-backed dedup, read-only verify and atomic confirmation
 * consumption. The class accepts a transaction-scoped client so the command
 * executor can run `consumeExact` inside the same transaction as the I1
 * effect (record 63/86); over a root client each mutation wraps its own
 * ReadCommitted transaction, matching the E7 ledger.
 */
export class PrismaNurtureEnrollmentJourneyPreparedCommandLedger
implements NurtureEnrollmentJourneyPreparedCommandLedgerV1 {
  constructor(private readonly prisma: LedgerClient) {}

  async getOrCreate(
    input: NurtureEnrollmentJourneyPreparedCommandRecordV1,
  ): ReturnType<NurtureEnrollmentJourneyPreparedCommandLedgerV1["getOrCreate"]> {
    try {
      const created = await this.runInTransaction(async (transaction) => {
        const preparedAt = new Date(input.prepared_at);
        const currentScope = await transaction.$queryRaw<Array<{ role_assignment_id: string }>>(
          Prisma.sql`SELECT role_assignment."id" AS "role_assignment_id"
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
            WHERE role_assignment."id" = ${input.role_assignment_ref}
              AND role_assignment."workspace_id" = ${input.workspace_id}
              AND role_assignment."participant_id" = ${input.participant_ref}
              AND role_assignment."role" = 'institution_admin'
              AND role_assignment."scope_type" = 'institution'
              AND role_assignment."scope_id" = ${input.institution_ref}
              AND role_assignment."status" = 'active'
              AND role_assignment."deleted_at" IS NULL
              AND (role_assignment."starts_at" IS NULL
                OR role_assignment."starts_at" <= (${preparedAt}::timestamptz AT TIME ZONE 'UTC'))
              AND (role_assignment."ends_at" IS NULL
                OR role_assignment."ends_at" > (${preparedAt}::timestamptz AT TIME ZONE 'UTC'))
            FOR SHARE OF role_assignment, participant, institution`,
        );
        if (currentScope.length !== 1) {
          throw new PreparedCommandScopeError();
        }
        return transaction.nurtureEnrollmentJourneyPreparedCommand.create({
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
            preparedAt,
            expiresAt: new Date(input.expires_at),
            ...(input.consumed_at ? { consumedAt: new Date(input.consumed_at) } : {}),
            aggregateVersion: input.aggregate_version,
          },
        });
      });
      return { status: "created", record: toRecord(created) };
    } catch (error) {
      if (!isUniqueConflict(error)) throw error;
      const existing = await this.prisma.nurtureEnrollmentJourneyPreparedCommand.findUnique({
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

  async readExact(
    input: Parameters<NurtureEnrollmentJourneyPreparedCommandLedgerV1["readExact"]>[0],
  ): ReturnType<NurtureEnrollmentJourneyPreparedCommandLedgerV1["readExact"]> {
    const row = await this.prisma.nurtureEnrollmentJourneyPreparedCommand.findUnique({
      where: { commandRequestId: input.command_request_id },
    });
    if (
      !row
      || row.workspaceId !== input.workspace_id
      || row.participantId !== input.participant_ref
    ) return { status: "not_found" };
    return { status: "found", record: toRecord(row) };
  }

  async readHistoricalExact(
    input: Parameters<
      NurtureEnrollmentJourneyPreparedCommandLedgerV1["readHistoricalExact"]
    >[0],
  ): ReturnType<
    NurtureEnrollmentJourneyPreparedCommandLedgerV1["readHistoricalExact"]
  > {
    const row = await this.prisma.nurtureEnrollmentJourneyPreparedCommand.findUnique({
      where: { commandRequestId: input.command_request_id },
    });
    if (!row || row.workspaceId !== input.workspace_id) {
      return { status: "not_found" };
    }
    return { status: "found", record: toRecord(row) };
  }

  consumeExact(
    input: Parameters<NurtureEnrollmentJourneyPreparedCommandLedgerV1["consumeExact"]>[0],
  ): ReturnType<NurtureEnrollmentJourneyPreparedCommandLedgerV1["consumeExact"]> {
    return this.runInTransaction(async (transaction) => {
      const locked = await transaction.$queryRaw<Array<{ command_request_id: string }>>(
        Prisma.sql`SELECT "command_request_id"
          FROM "nurture_enrollment_journey_prepared_command"
          WHERE "command_request_id" = ${input.command_request_id}
            AND "workspace_id" = ${input.workspace_id}
          FOR UPDATE`,
      );
      if (locked.length === 0) return { status: "not_found" as const };

      const row = await transaction.nurtureEnrollmentJourneyPreparedCommand.findUnique({
        where: { commandRequestId: input.command_request_id },
      });
      if (!row || row.workspaceId !== input.workspace_id) {
        return { status: "not_found" as const };
      }
      if (
        row.participantId !== input.participant_ref
        || row.confirmationRefHash !== input.confirmation_ref_hash
      ) return { status: "conflict" as const };
      const consumedAt = new Date(input.consumed_at);
      if (row.status === "expired" || row.expiresAt <= consumedAt) {
        if (row.status !== "expired") {
          await transaction.nurtureEnrollmentJourneyPreparedCommand.updateMany({
            where: {
              commandRequestId: row.commandRequestId,
              status: row.status,
              aggregateVersion: row.aggregateVersion,
            },
            data: {
              status: "expired",
              snapshotCodecVersion: 0,
              frozenSnapshotCiphertext: "",
              aggregateVersion: { increment: 1 },
            },
          });
        }
        return { status: "expired" as const };
      }
      if (row.status === "consumed") {
        return { status: "replayed" as const, record: toRecord(row) };
      }

      const updated = await transaction.nurtureEnrollmentJourneyPreparedCommand.updateMany({
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
      const consumed = await transaction.nurtureEnrollmentJourneyPreparedCommand.findUniqueOrThrow({
        where: { commandRequestId: row.commandRequestId },
      });
      return { status: "consumed" as const, record: toRecord(consumed) };
    });
  }

  private runInTransaction<Result>(
    work: (transaction: Prisma.TransactionClient) => Promise<Result>,
  ): Promise<Result> {
    const client = this.prisma;
    if ("$transaction" in client && typeof client.$transaction === "function") {
      return client.$transaction(work, {
        isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
      });
    }
    return work(client);
  }
}

class PreparedCommandScopeError extends Error {
  constructor() {
    super("prepared command scope is not current");
    this.name = "PreparedCommandScopeError";
  }
}

function isUniqueConflict(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}
