import { Prisma } from "@prisma/client";
import {
  canonicalJson,
  expectedReceiptCoordinatesFromEnvelopeV1,
  parseAdmissionReceiptV1,
  receiptMatchesExpectedCoordinatesV1,
} from "@the-nurture/scenario/family-growth";
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
  /** Lease version returned by `claimDue`; settlement is CAS-bound to it. */
  attemptCount: number;
  releaseEventId: string;
  sourceScenarioKey: string;
  sourceReleaseRef: string;
  familyId: string;
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
  /** The full raw wire receipt, canonicalized for audit and replay identity. */
  receiptPayload: unknown;
};

export type FamilyGrowthReceiptRecordResultV1 =
  | "settled"
  | "replayed"
  | "stale"
  | "not_settled"
  | "receipt_coordinate_mismatch"
  | "receipt_conflict";

export type FamilyGrowthTransportFailureRecordResultV1 = "recorded" | "stale";

const asClonedJson = (value: unknown): Prisma.InputJsonValue =>
  JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;

const asCanonicalJson = (value: unknown): Prisma.InputJsonValue =>
  JSON.parse(canonicalJson(value)) as Prisma.InputJsonValue;

type StoredFamilyGrowthReceipt = Readonly<{
  status: string;
  admissionRef: string | null;
  materialRef: string | null;
  suppressionRef: string | null;
  reasonCode: string | null;
  processedAt: Date;
  receiptPayload: Prisma.JsonValue;
}>;

/**
 * The frozen wire contract answers an exact replay of an applied release with
 * `status: "duplicate"` (same companion refs, same original processed_at), so
 * that one asymmetric status pair is replay-equivalent; every other field must
 * match exactly.
 */
const replayStatusMatches = (stored: string, incoming: string): boolean =>
  stored === incoming || (stored === "applied" && incoming === "duplicate");

const replayPayloadMatches = (
  stored: Prisma.JsonValue,
  incoming: Prisma.InputJsonValue,
): boolean => {
  if (canonicalJson(stored) === canonicalJson(incoming)) return true;
  return (
    stored !== null
    && typeof stored === "object"
    && !Array.isArray(stored)
    && (stored as Record<string, unknown>).status === "applied"
    && canonicalJson({ ...(stored as Record<string, unknown>), status: "duplicate" })
      === canonicalJson(incoming)
  );
};

const receiptReplayMatches = (
  stored: StoredFamilyGrowthReceipt,
  input: FamilyGrowthReceiptRecordInputV1,
  receiptPayload: Prisma.InputJsonValue,
): boolean =>
  replayStatusMatches(stored.status, input.status)
  && stored.admissionRef === (input.admissionRef ?? null)
  && stored.materialRef === (input.materialRef ?? null)
  && stored.suppressionRef === (input.suppressionRef ?? null)
  && stored.reasonCode === (input.reasonCode ?? null)
  && stored.processedAt.getTime() === input.processedAt.getTime()
  && replayPayloadMatches(stored.receiptPayload, receiptPayload);

const parsedReceiptMatchesInput = (
  receipt: ReturnType<typeof parseAdmissionReceiptV1>,
  input: FamilyGrowthReceiptRecordInputV1,
): boolean =>
  receipt.receipt_id === input.receiptId
  && receipt.status === input.status
  && Date.parse(receipt.processed_at) === input.processedAt.getTime()
  && receipt.admission_ref === input.admissionRef
  && receipt.material_ref === input.materialRef
  && receipt.suppression_ref === input.suppressionRef
  && receipt.reason_code === input.reasonCode;

const receiptCoordinatesMatchInput = (
  receipt: ReturnType<typeof parseAdmissionReceiptV1>,
  input: FamilyGrowthReceiptRecordInputV1,
): boolean =>
  receipt.release_event_id === input.releaseEventId
  && receipt.source_scenario_key === input.sourceScenarioKey
  && receipt.source_release_ref === input.sourceReleaseRef
  && receipt.family_id === input.familyId;

class FamilyGrowthReceiptConflictRollback extends Error {}

/**
 * Append one outbox row inside the caller's open transaction. Standalone so
 * the release and safety owners can call it with their own `tx` without
 * constructing the port.
 */
export const appendFamilyGrowthOutboxEventWithin = async (
  tx: Prisma.TransactionClient,
  input: FamilyGrowthOutboxAppendInputV1,
): Promise<void> => {
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
      envelopePayload: asClonedJson(input.envelope),
    },
  });
};

export class PrismaFamilyGrowthOutboxPort {
  constructor(private readonly prisma: NurturePrismaClient) {}

  /** Append one outbox row inside the caller's open transaction. */
  async appendWithin(
    tx: Prisma.TransactionClient,
    input: FamilyGrowthOutboxAppendInputV1,
  ): Promise<void> {
    await appendFamilyGrowthOutboxEventWithin(tx, input);
  }

  /**
   * Claim due rows for delivery. A row is due when it is `pending`,
   * `outcome_unknown` with its backoff instant reached, or `delivering`
   * with a stale claim (`staleClaimBefore`, addendum §3: a worker that died
   * mid-delivery must not strand its rows). Claiming is per-row
   * conditional, so a row another worker took in between is simply skipped
   * rather than double-delivered.
   */
  async claimDue(input: {
    now: Date;
    limit: number;
    staleClaimBefore?: Date;
    /** Optional shard/test scope; the production worker claims globally. */
    workspaceId?: string;
  }): Promise<FamilyGrowthOutboxClaimedRowV1[]> {
    const staleClaim = input.staleClaimBefore
      ? [
          {
            deliveryState: "delivering" as const,
            lastAttemptAt: { lte: input.staleClaimBefore },
          },
        ]
      : [];
    const candidates = await this.prisma.nurtureFamilyGrowthOutboxEvent.findMany({
      where: {
        ...(input.workspaceId ? { workspaceId: input.workspaceId } : {}),
        OR: [
          { deliveryState: "pending" },
          {
            deliveryState: "outcome_unknown",
            OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: input.now } }],
          },
          ...staleClaim,
        ],
      },
      orderBy: { createdAt: "asc" },
      take: input.limit,
      select: { id: true, deliveryState: true },
    });
    const claimed: FamilyGrowthOutboxClaimedRowV1[] = [];
    for (const candidate of candidates) {
      const result = await this.prisma.nurtureFamilyGrowthOutboxEvent.updateMany({
        where:
          candidate.deliveryState === "delivering"
            ? {
                // A stale reclaim must re-check the staleness it saw: a row
                // another worker just re-claimed has a fresh lastAttemptAt
                // and is skipped, not double-delivered.
                id: candidate.id,
                deliveryState: "delivering",
                lastAttemptAt: { lte: input.staleClaimBefore },
              }
            : candidate.deliveryState === "pending"
              ? {
                  id: candidate.id,
                  deliveryState: "pending",
                }
              : {
                  // Re-check due time as well as state. A different worker may
                  // have moved this row back to outcome_unknown with a future
                  // backoff after the candidate read.
                  id: candidate.id,
                  deliveryState: "outcome_unknown",
                  OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: input.now } }],
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
   * Idempotent on the receipt identity — an exact replay against a matching
   * terminal row returns `replayed` and mutates nothing.
   */
  async recordReceipt(
    input: FamilyGrowthReceiptRecordInputV1,
  ): Promise<FamilyGrowthReceiptRecordResultV1> {
    const terminalState =
      input.status === "rejected" || input.status === "conflict" ? "failed" : "delivered";
    let parsedReceipt: ReturnType<typeof parseAdmissionReceiptV1>;
    try {
      parsedReceipt = parseAdmissionReceiptV1(input.receiptPayload);
    } catch {
      return "receipt_conflict";
    }
    if (!receiptCoordinatesMatchInput(parsedReceipt, input)) {
      return "receipt_coordinate_mismatch";
    }
    if (!parsedReceiptMatchesInput(parsedReceipt, input)) {
      return "receipt_conflict";
    }
    const receiptPayload = asCanonicalJson(input.receiptPayload);
    try {
      return await this.prisma.$transaction(async (tx) => {
        const storedOutbox = await tx.nurtureFamilyGrowthOutboxEvent.findUnique({
          where: { id: input.outboxEventId },
          select: {
            id: true,
            workspaceId: true,
            kind: true,
            payloadDigest: true,
            envelopePayload: true,
          },
        });
        if (!storedOutbox || storedOutbox.workspaceId !== input.workspaceId) {
          return "receipt_coordinate_mismatch";
        }
        const expectedReceipt = expectedReceiptCoordinatesFromEnvelopeV1({
          eventId: storedOutbox.id,
          kind: storedOutbox.kind,
          payloadDigest: storedOutbox.payloadDigest,
          envelope: storedOutbox.envelopePayload,
        });
        if (
          !expectedReceipt
          || !receiptMatchesExpectedCoordinatesV1(parsedReceipt, expectedReceipt)
        ) {
          return "receipt_coordinate_mismatch";
        }

        const receiptIdentity = {
          workspaceId: input.workspaceId,
          outboxEventId: input.outboxEventId,
          receiptId: input.receiptId,
        };
        const existing = await tx.nurtureFamilyGrowthAdmissionReceipt.findUnique({
          where: { workspaceId_outboxEventId_receiptId: receiptIdentity },
          select: {
            status: true,
            admissionRef: true,
            materialRef: true,
            suppressionRef: true,
            reasonCode: true,
            processedAt: true,
            receiptPayload: true,
          },
        });
        if (existing && !receiptReplayMatches(existing, input, receiptPayload)) {
          return "receipt_conflict";
        }

        const settlement = await tx.nurtureFamilyGrowthOutboxEvent.updateMany({
          where: {
            id: input.outboxEventId,
            workspaceId: input.workspaceId,
            deliveryState: "delivering",
            attemptCount: input.attemptCount,
          },
          data: {
            deliveryState: terminalState,
            deliveredAt: input.processedAt,
            nextAttemptAt: null,
          },
        });
        if (settlement.count !== 1) {
          const [currentOutbox, currentReceipt] = await Promise.all([
            tx.nurtureFamilyGrowthOutboxEvent.findUnique({
              where: { id: input.outboxEventId },
              select: {
                workspaceId: true,
                deliveryState: true,
                attemptCount: true,
              },
            }),
            existing
              ? Promise.resolve(existing)
              : tx.nurtureFamilyGrowthAdmissionReceipt.findUnique({
                  where: { workspaceId_outboxEventId_receiptId: receiptIdentity },
                  select: {
                    status: true,
                    admissionRef: true,
                    materialRef: true,
                    suppressionRef: true,
                    reasonCode: true,
                    processedAt: true,
                    receiptPayload: true,
                  },
                }),
          ]);
          if (
            currentOutbox?.workspaceId === input.workspaceId
            && currentOutbox.deliveryState === terminalState
            && currentReceipt
            && receiptReplayMatches(currentReceipt, input, receiptPayload)
          ) {
            return "replayed";
          }
          if (
            currentOutbox?.workspaceId === input.workspaceId
            && currentOutbox.attemptCount > input.attemptCount
          ) {
            return "stale";
          }
          if (currentReceipt) return "receipt_conflict";
          return "not_settled";
        }
        if (existing) return "settled";

        // `skipDuplicates` (ON CONFLICT DO NOTHING) keeps the transaction
        // usable after a replay. Its count is authoritative: a duplicate is
        // admitted only when every stored receipt field is an exact replay.
        const inserted = await tx.nurtureFamilyGrowthAdmissionReceipt.createMany({
          data: [
            {
              ...receiptIdentity,
              status: input.status,
              ...(input.admissionRef !== undefined ? { admissionRef: input.admissionRef } : {}),
              ...(input.materialRef !== undefined ? { materialRef: input.materialRef } : {}),
              ...(input.suppressionRef !== undefined
                ? { suppressionRef: input.suppressionRef }
                : {}),
              ...(input.reasonCode !== undefined ? { reasonCode: input.reasonCode } : {}),
              processedAt: input.processedAt,
              receiptPayload,
            },
          ],
          skipDuplicates: true,
        });
        if (inserted.count === 1) return "settled";

        const duplicate = await tx.nurtureFamilyGrowthAdmissionReceipt.findUnique({
          where: { workspaceId_outboxEventId_receiptId: receiptIdentity },
          select: {
            status: true,
            admissionRef: true,
            materialRef: true,
            suppressionRef: true,
            reasonCode: true,
            processedAt: true,
            receiptPayload: true,
          },
        });
        if (!duplicate || !receiptReplayMatches(duplicate, input, receiptPayload)) {
          // Roll back the CAS above as well: conflicting evidence cannot
          // change the row's prior delivery state.
          throw new FamilyGrowthReceiptConflictRollback();
        }
        return "settled";
      });
    } catch (error) {
      if (error instanceof FamilyGrowthReceiptConflictRollback) {
        return "receipt_conflict";
      }
      throw error;
    }
  }

  /**
   * No receipt arrived (timeout / 5xx / network): the row becomes
   * `outcome_unknown` and stays retriable at `nextAttemptAt` with the same
   * event id and payload digest. Never assume success or failure here.
   */
  async recordTransportFailure(input: {
    workspaceId: string;
    outboxEventId: string;
    attemptCount: number;
    nextAttemptAt: Date;
  }): Promise<FamilyGrowthTransportFailureRecordResultV1> {
    const result = await this.prisma.nurtureFamilyGrowthOutboxEvent.updateMany({
      where: {
        id: input.outboxEventId,
        workspaceId: input.workspaceId,
        deliveryState: "delivering",
        attemptCount: input.attemptCount,
      },
      data: { deliveryState: "outcome_unknown", nextAttemptAt: input.nextAttemptAt },
    });
    return result.count === 1 ? "recorded" : "stale";
  }
}
