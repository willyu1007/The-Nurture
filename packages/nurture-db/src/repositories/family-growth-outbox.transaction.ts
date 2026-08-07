import { Prisma } from "@prisma/client";
import type { NurturePrismaClient } from "../client.js";

/**
 * T-009 I2: the provider outbox and receipt store behind N5/N7.
 *
 * `appendWithin` runs inside the CALLER's transaction — the same one that
 * commits the release or lifecycle fact — so a fact without its outbox row
 * and an outbox row without its fact are both impossible. No network or
 * object-storage call belongs anywhere near that transaction; the delivery
 * worker claims committed rows afterwards (I3).
 */

export type FamilyGrowthOutboxKindV1 = "released" | "correction" | "target_removal" | "redaction";

export type FamilyGrowthOutboxAppendInputV1 = {
  workspaceId: string;
  /** The envelope `event_id`; becomes the row PK and the consumer replay key. */
  eventId: string;
  kind: FamilyGrowthOutboxKindV1;
  publicationReleaseId: string;
  /** Lifecycle kinds only; `released` must not carry one (DB CHECK). */
  visibilityEventId?: string;
  payloadDigest: string;
  /** The fully assembled, already-validated envelope. */
  envelope: unknown;
};

export type FamilyGrowthOutboxClaimedRowV1 = {
  eventId: string;
  workspaceId: string;
  kind: FamilyGrowthOutboxKindV1;
  payloadDigest: string;
  envelope: unknown;
  attemptCount: number;
};

export type FamilyGrowthReceiptRecordInputV1 = {
  workspaceId: string;
  outboxEventId: string;
  receiptId: string;
  status:
    | "applied"
    | "pending_guardian_confirmation"
    | "duplicate"
    | "tombstoned"
    | "rejected"
    | "conflict";
  admissionRef?: string;
  materialRef?: string;
  suppressionRef?: string;
  reasonCode?: string;
  processedAt: Date;
  /** The full wire receipt, kept for audit. */
  receiptPayload: unknown;
};

const asJson = (value: unknown): Prisma.InputJsonValue =>
  JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;

export class PrismaFamilyGrowthOutboxPort {
  constructor(private readonly prisma: NurturePrismaClient) {}

  /** Append one outbox row inside the caller's open transaction. */
  async appendWithin(
    tx: Prisma.TransactionClient,
    input: FamilyGrowthOutboxAppendInputV1,
  ): Promise<void> {
    await tx.nurtureFamilyGrowthOutboxEvent.create({
      data: {
        id: input.eventId,
        workspaceId: input.workspaceId,
        kind: input.kind,
        publicationReleaseId: input.publicationReleaseId,
        ...(input.visibilityEventId !== undefined
          ? { visibilityEventId: input.visibilityEventId }
          : {}),
        payloadDigest: input.payloadDigest,
        envelopePayload: asJson(input.envelope),
      },
    });
  }

  /**
   * Claim due rows for delivery. A row is due when it is `pending`, or
   * `outcome_unknown` with its backoff instant reached. Claiming is
   * per-row conditional, so a row another worker took in between is simply
   * skipped rather than double-delivered.
   */
  async claimDue(input: { now: Date; limit: number }): Promise<FamilyGrowthOutboxClaimedRowV1[]> {
    const candidates = await this.prisma.nurtureFamilyGrowthOutboxEvent.findMany({
      where: {
        OR: [
          { deliveryState: "pending" },
          {
            deliveryState: "outcome_unknown",
            OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: input.now } }],
          },
        ],
      },
      orderBy: { createdAt: "asc" },
      take: input.limit,
      select: { id: true },
    });
    const claimed: FamilyGrowthOutboxClaimedRowV1[] = [];
    for (const candidate of candidates) {
      const result = await this.prisma.nurtureFamilyGrowthOutboxEvent.updateMany({
        where: {
          id: candidate.id,
          deliveryState: { in: ["pending", "outcome_unknown"] },
        },
        data: {
          deliveryState: "delivering",
          attemptCount: { increment: 1 },
          lastAttemptAt: input.now,
        },
      });
      if (result.count !== 1) continue;
      const row = await this.prisma.nurtureFamilyGrowthOutboxEvent.findUniqueOrThrow({
        where: { id: candidate.id },
      });
      claimed.push({
        eventId: row.id,
        workspaceId: row.workspaceId,
        kind: row.kind,
        payloadDigest: row.payloadDigest,
        envelope: row.envelopePayload,
        attemptCount: row.attemptCount,
      });
    }
    return claimed;
  }

  /**
   * Record a consumed admission receipt and settle the outbox row:
   * `rejected`/`conflict` land as `failed`, everything else as `delivered`.
   * Idempotent on the receipt identity — an exact replay of the same receipt
   * re-settles the row and appends nothing.
   */
  async recordReceipt(input: FamilyGrowthReceiptRecordInputV1): Promise<void> {
    const terminalState =
      input.status === "rejected" || input.status === "conflict" ? "failed" : "delivered";
    await this.prisma.$transaction(async (tx) => {
      // `skipDuplicates` (ON CONFLICT DO NOTHING) is the replay path: a
      // caught unique violation would abort the surrounding Postgres
      // transaction (25P02), so the no-op must happen inside the INSERT.
      await tx.nurtureFamilyGrowthAdmissionReceipt.createMany({
        data: [
          {
            workspaceId: input.workspaceId,
            outboxEventId: input.outboxEventId,
            receiptId: input.receiptId,
            status: input.status,
            ...(input.admissionRef !== undefined ? { admissionRef: input.admissionRef } : {}),
            ...(input.materialRef !== undefined ? { materialRef: input.materialRef } : {}),
            ...(input.suppressionRef !== undefined
              ? { suppressionRef: input.suppressionRef }
              : {}),
            ...(input.reasonCode !== undefined ? { reasonCode: input.reasonCode } : {}),
            processedAt: input.processedAt,
            receiptPayload: asJson(input.receiptPayload),
          },
        ],
        skipDuplicates: true,
      });
      await tx.nurtureFamilyGrowthOutboxEvent.update({
        where: { id: input.outboxEventId },
        data: {
          deliveryState: terminalState,
          deliveredAt: input.processedAt,
          nextAttemptAt: null,
        },
      });
    });
  }

  /**
   * No receipt arrived (timeout / 5xx / network): the row becomes
   * `outcome_unknown` and stays retriable at `nextAttemptAt` with the same
   * event id and payload digest. Never assume success or failure here.
   */
  async recordTransportFailure(input: {
    outboxEventId: string;
    nextAttemptAt: Date;
  }): Promise<void> {
    await this.prisma.nurtureFamilyGrowthOutboxEvent.update({
      where: { id: input.outboxEventId },
      data: { deliveryState: "outcome_unknown", nextAttemptAt: input.nextAttemptAt },
    });
  }
}
