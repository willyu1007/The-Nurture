import { createHash, randomUUID } from "node:crypto";
import {
  Prisma,
  type NurtureCommandExecution,
  type NurtureWorkflowRunSettlement,
  type PrismaClient,
} from "@prisma/client";
import type {
  NurtureWorkflowRunSettlementBindingV1,
  NurtureWorkflowRunSettlementRecordV1,
  NurtureWorkflowRunSettlementRepositoryV1,
  NurtureWorkflowRunSettlementTransactionV1,
} from "@the-nurture/scenario";
import { nurtureCommandAdvisoryKey } from "./nurture-command-advisory-key.js";

type TransactionClient = Prisma.TransactionClient;
type SettlementClient = Pick<
  PrismaClient | TransactionClient,
  "nurtureWorkflowRunSettlement" | "nurtureCommandExecution"
>;

const HASH = /^[0-9a-f]{64}$/u;
const ID = /^[A-Za-z0-9][A-Za-z0-9._:~-]{0,199}$/u;

/**
 * Production owner for registration, historical status and writer-fenced
 * no-effect reconciliation. It never reads current participant/authority or
 * a prepared-command TTL: exact Host reservation + Nurture command identity
 * are the complete lookup key.
 */
export class PrismaNurtureWorkflowRunSettlementRepository
implements NurtureWorkflowRunSettlementRepositoryV1 {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly now: () => Date = () => new Date(),
    private readonly createId: () => string = randomUUID,
  ) {}

  async register(input: NurtureWorkflowRunSettlementBindingV1) {
    assertBinding(input);
    try {
      return await this.prisma.$transaction(
        async (transaction) => {
          if (!(await acquireWriterFence(transaction, input))) {
            return { disposition: "busy" as const };
          }
          const existing = await findByLogicalOperation(transaction, input);
          if (existing) {
            return exactBinding(existing, input)
              ? {
                  disposition: "replayed" as const,
                  record: await materialize(transaction, existing),
                }
              : { disposition: "conflict" as const };
          }
          const execution = await findExecution(transaction, input);
          if (execution) return { disposition: "conflict" as const };
          const preparedAt = this.now();
          const row = await transaction.nurtureWorkflowRunSettlement.create({
            data: {
              id: this.createId(),
              workspaceId: input.workspace_id,
              logicalOperationIdHash: input.logical_operation_id_hash,
              reservationRefHash: input.reservation_ref_hash,
              reservationEvidenceHash: input.reservation_evidence_sha256,
              runObjectId: input.run_object_id,
              bindingFingerprintSha256: input.binding_fingerprint_sha256,
              commandRequestIdHash: input.command_request_id_hash,
              commandKey: input.command_key,
              state: "prepared",
              preparedAt,
            },
          });
          return {
            disposition: "created" as const,
            record: toRecord(row),
          };
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (error) {
      if (!isUniqueOrSerializationConflict(error)) throw error;
      const existing = await findByLogicalOperation(this.prisma, input);
      return existing && exactBinding(existing, input)
        ? {
            disposition: "replayed" as const,
            record: await materialize(this.prisma, existing),
          }
        : { disposition: "conflict" as const };
    }
  }

  async read(
    input: NurtureWorkflowRunSettlementBindingV1,
  ): Promise<NurtureWorkflowRunSettlementRecordV1 | null> {
    assertBinding(input);
    const row = await findByLogicalOperation(this.prisma, input);
    return row && exactBinding(row, input)
      ? materialize(this.prisma, row)
      : null;
  }

  async confirmNoEffect(input: NurtureWorkflowRunSettlementBindingV1) {
    assertBinding(input);
    try {
      return await this.prisma.$transaction(
        async (transaction) => {
          if (!(await acquireWriterFence(transaction, input))) {
            return { disposition: "busy" as const };
          }
          const current = await findByLogicalOperation(transaction, input);
          if (!current) return { disposition: "not_found" as const };
          if (!exactBinding(current, input)) {
            return { disposition: "conflict" as const };
          }
          if (current.state !== "prepared") {
            return {
              disposition: "replayed" as const,
              record: await materialize(transaction, current),
            };
          }

          const execution = await findExecution(transaction, input);
          const receiptRef = this.createId();
          const settledAt = this.now();
          const target = execution ? "committed" as const : "confirmed_no_effect" as const;
          const evidenceHash = settlementEvidenceHash({
            row: current,
            target,
            receipt_ref: receiptRef,
            command_execution_id: execution?.id,
            settled_at: settledAt,
          });
          const update = await transaction.nurtureWorkflowRunSettlement.updateMany({
            where: {
              id: current.id,
              state: "prepared",
              aggregateVersion: current.aggregateVersion,
            },
            data: {
              state: target,
              commandExecutionId: execution?.id,
              settlementReceiptRef: receiptRef,
              settlementEvidenceHash: evidenceHash,
              aggregateVersion: { increment: 1 },
              ...(execution
                ? { committedAt: settledAt }
                : { confirmedNoEffectAt: settledAt }),
            },
          });
          if (update.count !== 1) return { disposition: "conflict" as const };
          const settled = await transaction.nurtureWorkflowRunSettlement.findUniqueOrThrow({
            where: { id: current.id },
          });
          return {
            disposition: "settled" as const,
            record: await materialize(transaction, settled),
          };
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (error) {
      if (isUniqueOrSerializationConflict(error)) {
        return { disposition: "conflict" as const };
      }
      throw error;
    }
  }
}

/**
 * Transaction-scoped adapter for the command kernel. The surrounding command
 * repository already holds the exact writer fence; this method must be called
 * after creating `NurtureCommandExecution` and before the transaction returns.
 */
export class PrismaNurtureWorkflowRunSettlementTransaction
implements NurtureWorkflowRunSettlementTransactionV1 {
  constructor(
    private readonly transaction: TransactionClient,
    private readonly now: () => Date = () => new Date(),
    private readonly createId: () => string = randomUUID,
  ) {}

  async markCommitted(
    input: NurtureWorkflowRunSettlementBindingV1 & { command_execution_id: string },
  ): Promise<NurtureWorkflowRunSettlementRecordV1> {
    assertBinding(input);
    if (!ID.test(input.command_execution_id)) throw new Error("invalid command execution id");
    const current = await findByLogicalOperation(this.transaction, input);
    if (!current || !exactBinding(current, input)) {
      throw new Error("workflow Run settlement binding unavailable");
    }
    if (current.state === "committed") {
      const record = await materialize(this.transaction, current);
      if (record.command_execution_id !== input.command_execution_id) {
        throw new Error("workflow Run settlement execution conflict");
      }
      return record;
    }
    if (current.state !== "prepared") {
      throw new Error("workflow Run settlement already confirmed no-effect");
    }
    const execution = await this.transaction.nurtureCommandExecution.findFirst({
      where: {
        id: input.command_execution_id,
        workspaceId: input.workspace_id,
        commandRequestIdHash: input.command_request_id_hash,
        commandKey: input.command_key,
      },
    });
    if (!execution) throw new Error("workflow Run settlement execution unavailable");
    const receiptRef = this.createId();
    const committedAt = this.now();
    const evidenceHash = settlementEvidenceHash({
      row: current,
      target: "committed",
      receipt_ref: receiptRef,
      command_execution_id: execution.id,
      settled_at: committedAt,
    });
    const update = await this.transaction.nurtureWorkflowRunSettlement.updateMany({
      where: {
        id: current.id,
        state: "prepared",
        aggregateVersion: current.aggregateVersion,
      },
      data: {
        state: "committed",
        commandExecutionId: execution.id,
        settlementReceiptRef: receiptRef,
        settlementEvidenceHash: evidenceHash,
        aggregateVersion: { increment: 1 },
        committedAt,
      },
    });
    if (update.count !== 1) throw new Error("workflow Run settlement write conflict");
    const settled = await this.transaction.nurtureWorkflowRunSettlement.findUniqueOrThrow({
      where: { id: current.id },
    });
    return materialize(this.transaction, settled);
  }
}

async function acquireWriterFence(
  transaction: TransactionClient,
  input: NurtureWorkflowRunSettlementBindingV1,
): Promise<boolean> {
  const rows = await transaction.$queryRaw<Array<{ acquired: boolean }>>(
    Prisma.sql`SELECT pg_try_advisory_xact_lock(${nurtureCommandAdvisoryKey(
      input.workspace_id,
      input.command_request_id_hash,
    )}) AS acquired`,
  );
  return rows[0]?.acquired === true;
}

async function findByLogicalOperation(
  client: SettlementClient,
  input: NurtureWorkflowRunSettlementBindingV1,
) {
  return client.nurtureWorkflowRunSettlement.findUnique({
    where: {
      workspaceId_logicalOperationIdHash: {
        workspaceId: input.workspace_id,
        logicalOperationIdHash: input.logical_operation_id_hash,
      },
    },
  });
}

async function findExecution(
  client: SettlementClient,
  input: NurtureWorkflowRunSettlementBindingV1,
): Promise<NurtureCommandExecution | null> {
  return client.nurtureCommandExecution.findUnique({
    where: {
      workspaceId_commandRequestIdHash: {
        workspaceId: input.workspace_id,
        commandRequestIdHash: input.command_request_id_hash,
      },
    },
  });
}

async function materialize(
  client: SettlementClient,
  row: NurtureWorkflowRunSettlement,
): Promise<NurtureWorkflowRunSettlementRecordV1> {
  if (row.state === "prepared" || row.state === "confirmed_no_effect") {
    const execution = await findExecution(client, toBinding(row));
    if (execution) {
      throw new Error("workflow Run settlement execution/state drift");
    }
  } else {
    const execution = row.commandExecutionId
      ? await client.nurtureCommandExecution.findFirst({
          where: {
            id: row.commandExecutionId,
            workspaceId: row.workspaceId,
            commandRequestIdHash: row.commandRequestIdHash,
            commandKey: row.commandKey,
          },
        })
      : null;
    if (!execution) throw new Error("workflow Run settlement commit evidence unavailable");
  }
  assertRowState(row);
  return toRecord(row);
}

function toBinding(row: NurtureWorkflowRunSettlement): NurtureWorkflowRunSettlementBindingV1 {
  return {
    workspace_id: row.workspaceId,
    logical_operation_id_hash: row.logicalOperationIdHash,
    reservation_ref_hash: row.reservationRefHash,
    reservation_evidence_sha256: row.reservationEvidenceHash,
    run_object_id: row.runObjectId,
    binding_fingerprint_sha256: row.bindingFingerprintSha256,
    command_request_id_hash: row.commandRequestIdHash,
    command_key: row.commandKey as NurtureWorkflowRunSettlementBindingV1["command_key"],
  };
}

function toRecord(row: NurtureWorkflowRunSettlement): NurtureWorkflowRunSettlementRecordV1 {
  return {
    ...toBinding(row),
    settlement_id: row.id,
    state: row.state,
    ...(row.commandExecutionId ? { command_execution_id: row.commandExecutionId } : {}),
    ...(row.settlementReceiptRef ? { settlement_receipt_ref: row.settlementReceiptRef } : {}),
    ...(row.settlementEvidenceHash
      ? { settlement_evidence_sha256: row.settlementEvidenceHash }
      : {}),
    aggregate_version: row.aggregateVersion,
    prepared_at: row.preparedAt.toISOString(),
    ...(row.committedAt ? { committed_at: row.committedAt.toISOString() } : {}),
    ...(row.confirmedNoEffectAt
      ? { confirmed_no_effect_at: row.confirmedNoEffectAt.toISOString() }
      : {}),
  };
}

function exactBinding(
  row: NurtureWorkflowRunSettlement,
  input: NurtureWorkflowRunSettlementBindingV1,
): boolean {
  return row.workspaceId === input.workspace_id &&
    row.logicalOperationIdHash === input.logical_operation_id_hash &&
    row.reservationRefHash === input.reservation_ref_hash &&
    row.reservationEvidenceHash === input.reservation_evidence_sha256 &&
    row.runObjectId === input.run_object_id &&
    row.bindingFingerprintSha256 === input.binding_fingerprint_sha256 &&
    row.commandRequestIdHash === input.command_request_id_hash &&
    row.commandKey === input.command_key;
}

function assertBinding(input: NurtureWorkflowRunSettlementBindingV1): void {
  if (!ID.test(input.workspace_id) || !ID.test(input.run_object_id)) {
    throw new Error("invalid workflow Run settlement identity");
  }
  for (const hash of [
    input.logical_operation_id_hash,
    input.reservation_ref_hash,
    input.reservation_evidence_sha256,
    input.binding_fingerprint_sha256,
    input.command_request_id_hash,
  ]) {
    if (!HASH.test(hash)) throw new Error("invalid workflow Run settlement hash");
  }
  if (input.command_key !== "nurture.start_enrollment_inquiry") {
    throw new Error("invalid workflow Run settlement command");
  }
}

function assertRowState(row: NurtureWorkflowRunSettlement): void {
  const prepared = row.state === "prepared" &&
    row.commandExecutionId === null && row.settlementReceiptRef === null &&
    row.settlementEvidenceHash === null && row.committedAt === null &&
    row.confirmedNoEffectAt === null;
  const committed = row.state === "committed" &&
    ID.test(row.commandExecutionId ?? "") && ID.test(row.settlementReceiptRef ?? "") &&
    HASH.test(row.settlementEvidenceHash ?? "") && row.committedAt !== null &&
    row.confirmedNoEffectAt === null;
  const noEffect = row.state === "confirmed_no_effect" &&
    row.commandExecutionId === null && ID.test(row.settlementReceiptRef ?? "") &&
    HASH.test(row.settlementEvidenceHash ?? "") && row.committedAt === null &&
    row.confirmedNoEffectAt !== null;
  if (!(prepared || committed || noEffect) || row.aggregateVersion < 1) {
    throw new Error("workflow Run settlement state evidence invalid");
  }
}

function settlementEvidenceHash(input: {
  row: NurtureWorkflowRunSettlement;
  target: "committed" | "confirmed_no_effect";
  receipt_ref: string;
  command_execution_id?: string;
  settled_at: Date;
}): string {
  return createHash("sha256").update([
    "nurture.workflow-run-settlement-receipt.v1",
    input.row.workspaceId,
    input.row.logicalOperationIdHash,
    input.row.reservationRefHash,
    input.row.reservationEvidenceHash,
    input.row.runObjectId,
    input.row.bindingFingerprintSha256,
    input.row.commandRequestIdHash,
    input.row.commandKey,
    input.target,
    input.receipt_ref,
    input.command_execution_id ?? "",
    String(input.row.aggregateVersion + 1),
    input.settled_at.toISOString(),
  ].join("\0"), "utf8").digest("hex");
}

function isUniqueOrSerializationConflict(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return error.code === "P2002" || error.code === "P2034";
  }
  return typeof error === "object" && error !== null &&
    "code" in error && (error.code === "40001" || error.code === "40P01");
}
