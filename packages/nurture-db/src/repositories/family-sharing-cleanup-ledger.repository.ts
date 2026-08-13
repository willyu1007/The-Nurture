import { createHash } from "node:crypto";
import { Prisma, type PrismaClient } from "@prisma/client";
import {
  nurtureSha256Hex,
  type NurtureFamilySharingCleanupLedgerCommitV1,
  type NurtureFamilySharingCleanupLedgerV1,
  type NurtureFamilySharingCleanupReceiptV1,
} from "@the-nurture/scenario";

const COMMAND_KEY = "cleanup_family_sharing_withdrawal";
const COMMAND_SCOPE = "family_sharing_cleanup";

/**
 * Reuses the canonical immutable command ledger without adding a C3 table.
 * A workspace+command advisory transaction lock is acquired before any purge
 * callback. Exact replay/mismatch/lock-loss never invokes a purge owner, and
 * only a fully-confirmed callback result is persisted. Purge owners remain
 * idempotent: their callback may finish before a later transaction failure,
 * in which case an exact retry must safely confirm the same local scope.
 */
export class PrismaNurtureFamilySharingCleanupLedger
implements NurtureFamilySharingCleanupLedgerV1 {
  constructor(private readonly prisma: PrismaClient) {}

  async find(input: {
    workspace_id: string;
    cleanup_command_ref: string;
  }): Promise<NurtureFamilySharingCleanupReceiptV1 | null> {
    return findReceipt(this.prisma, input);
  }

  async executeExclusive(input: {
    workspace_id: string;
    cleanup_command_ref: string;
    request_fingerprint: string;
    child_care_process_ref: string;
    invocation_request_ref: string;
    service_ref: string;
    operation(): Promise<
      | Readonly<{
          status: "ready";
          receipt: NurtureFamilySharingCleanupReceiptV1;
        }>
      | Readonly<{ status: "unavailable" }>
    >;
  }): Promise<NurtureFamilySharingCleanupLedgerCommitV1> {
    try {
      return await this.prisma.$transaction(async (transaction) => {
        const locks = await transaction.$queryRaw<Array<{ acquired: boolean }>>(
          Prisma.sql`SELECT pg_try_advisory_xact_lock(${advisoryKey(
            input.workspace_id,
            input.cleanup_command_ref,
          )}) AS acquired`,
        );
        if (locks[0]?.acquired !== true) return { status: "unavailable" };
        const existing = await findReceipt(transaction, {
          workspace_id: input.workspace_id,
          cleanup_command_ref: input.cleanup_command_ref,
        });
        if (existing) {
          return existing.request_fingerprint === input.request_fingerprint
            ? { status: "replayed", receipt: existing }
            : { status: "conflict" };
        }
        const prepared = await input.operation();
        if (prepared.status !== "ready") return { status: "unavailable" };
        const receipt = prepared.receipt;
        if (
          receipt.cleanup_command_ref !== input.cleanup_command_ref ||
          receipt.request_fingerprint !== input.request_fingerprint ||
          !parseReceipt(receipt)
        ) return { status: "unavailable" };
        await transaction.nurtureCommandExecution.create({
          data: executionData(input, receipt),
        });
        return { status: "committed", receipt };
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch {
      return { status: "unavailable" };
    }
  }
}

async function findReceipt(
  prisma: PrismaClient | Prisma.TransactionClient,
  input: { workspace_id: string; cleanup_command_ref: string },
): Promise<NurtureFamilySharingCleanupReceiptV1 | null> {
  const row = await prisma.nurtureCommandExecution.findUnique({
    where: {
      workspaceId_commandRequestIdHash: {
        workspaceId: input.workspace_id,
        commandRequestIdHash: hash(input.cleanup_command_ref),
      },
    },
    select: {
      commandKey: true,
      commandScope: true,
      commandContractVersion: true,
      payloadHash: true,
      resultSchemaVersion: true,
      committedResultPayload: true,
    },
  });
  if (!row) return null;
  if (
    row.commandKey !== COMMAND_KEY ||
    row.commandScope !== COMMAND_SCOPE ||
    row.commandContractVersion !== 1 ||
    row.resultSchemaVersion !== 1
  ) throw new Error("Cleanup command identity conflicts with another command.");
  const receipt = parseReceipt(row.committedResultPayload);
  if (!receipt || receipt.request_fingerprint !== row.payloadHash) {
    throw new Error("Stored cleanup receipt is invalid.");
  }
  return receipt;
}

function executionData(
  input: {
    workspace_id: string;
    cleanup_command_ref: string;
    request_fingerprint: string;
    child_care_process_ref: string;
    invocation_request_ref: string;
    service_ref: string;
  },
  receipt: NurtureFamilySharingCleanupReceiptV1,
): Prisma.NurtureCommandExecutionUncheckedCreateInput {
  return {
    workspaceId: input.workspace_id,
    commandRequestIdHash: hash(input.cleanup_command_ref),
    originInvocationRequestIdHash: hash(input.invocation_request_ref),
    requestIdentityHashVersion: 1,
    commandKey: COMMAND_KEY,
    commandScope: COMMAND_SCOPE,
    commandContractVersion: 1,
    payloadHash: input.request_fingerprint,
    payloadCanonicalizationVersion: 1,
    businessActorRef: input.service_ref,
    primaryScopeRef: {
      schema_version: 1,
      namespace: "nurture",
      object_type: "family_sharing_cleanup",
      object_id: receipt.cleanup_receipt_ref,
    },
    childCareProcessId: input.child_care_process_ref,
    targetRefs: [],
    businessOutcome: receipt.store_receipts.some(
      (item) => item.disposition === "purged",
    ) ? "applied" : "already_satisfied",
    outputRefs: [{
      schema_version: 1,
      namespace: "nurture",
      object_type: "family_sharing_cleanup_receipt",
      object_id: receipt.cleanup_receipt_ref,
      version: 1,
    }],
    handoffSnapshotSchemaVersion: 1,
    handoffRequestSnapshotsPayload: [],
    resultSchemaVersion: 1,
    committedResultPayload: receipt as Prisma.InputJsonValue,
  };
}

function advisoryKey(workspaceId: string, cleanupCommandRef: string): bigint {
  const digest = createHash("sha256")
    .update(`nurture.family-sharing-cleanup-lock.v1\0${workspaceId}\0${hash(cleanupCommandRef)}`, "utf8")
    .digest();
  return BigInt.asIntN(64, digest.readBigUInt64BE(0));
}

function parseReceipt(value: unknown): NurtureFamilySharingCleanupReceiptV1 | null {
  if (!isRecord(value)) return null;
  const completedAt = typeof value.completed_at === "string"
    ? new Date(value.completed_at)
    : null;
  const expected = [
    "categories",
    "cleanup_command_ref",
    "cleanup_receipt_ref",
    "completed_at",
    "receipt_version",
    "request_fingerprint",
    "store_receipts",
  ];
  if (
    Object.keys(value).sort().join("|") !== expected.sort().join("|") ||
    value.receipt_version !== 1 ||
    !opaque(value.cleanup_receipt_ref) ||
    !opaque(value.cleanup_command_ref) ||
    typeof value.request_fingerprint !== "string" ||
    !/^[a-f0-9]{64}$/u.test(value.request_fingerprint) ||
    !Array.isArray(value.categories) ||
    value.categories.length < 1 ||
    value.categories.length > 2 ||
    value.categories.some(
      (category) => category !== "media" && category !== "focus_collaboration",
    ) ||
    new Set(value.categories).size !== value.categories.length ||
    !Array.isArray(value.store_receipts) ||
    value.store_receipts.length < 1 ||
    !value.store_receipts.every(
      (receipt) =>
        isRecord(receipt) &&
        Object.keys(receipt).sort().join("|") ===
          ["disposition", "store_ref", "store_version"].join("|") &&
        opaque(receipt.store_ref) &&
        Number.isSafeInteger(receipt.store_version) &&
        Number(receipt.store_version) > 0 &&
        (receipt.disposition === "purged" ||
          receipt.disposition === "already_absent"),
    ) ||
    completedAt === null ||
    !Number.isFinite(completedAt.getTime()) ||
    completedAt.toISOString() !== value.completed_at
  ) return null;
  return value as unknown as NurtureFamilySharingCleanupReceiptV1;
}

function hash(value: string): string {
  return nurtureSha256Hex(Buffer.from(value, "utf8"));
}

function opaque(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9][A-Za-z0-9._:~-]{0,199}$/u.test(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
