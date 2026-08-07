import {
  decideFamilyGrowthDelivery,
  FAMILY_GROWTH_DELIVERING_LEASE_MS,
  FAMILY_GROWTH_REQUEST_TIMEOUT_MS,
  type FamilyGrowthTransportResultV1,
} from "@the-nurture/scenario/family-growth";
import type {
  FamilyGrowthOutboxClaimedRowV1,
  FamilyGrowthReceiptRecordInputV1,
} from "@the-nurture/db";
import type { FamilyGrowthDeliveryConfig } from "./family-growth-runtime.js";

/**
 * T-009 I3b delivery worker (wire half), bound by
 * `family_growth_transport@1.0.0` §1/§3. The engine decisions are pure and
 * live in the scenario domain; this file owns claiming, the HTTP transport
 * and consequence recording. Polling cadence is operational, not contract.
 */
export const FAMILY_GROWTH_DELIVERY_POLL_MS = 30_000;
export const FAMILY_GROWTH_DELIVERY_CLAIM_LIMIT = 20;

export const FAMILY_GROWTH_EVENTS_PATH = "/internal/scenario/family-growth/events";

export type FamilyGrowthDeliveryOutboxPort = {
  claimDue(input: {
    now: Date;
    limit: number;
    staleClaimBefore?: Date;
  }): Promise<FamilyGrowthOutboxClaimedRowV1[]>;
  recordReceipt(input: FamilyGrowthReceiptRecordInputV1): Promise<void>;
  recordTransportFailure(input: { outboxEventId: string; nextAttemptAt: Date }): Promise<void>;
};

export type FamilyGrowthDeliveryLog = (
  event: string,
  fields: Record<string, unknown>,
) => void;

export type FamilyGrowthTransport = (
  envelope: unknown,
) => Promise<FamilyGrowthTransportResultV1>;

/** One envelope per POST; the synchronous 200 body is the receipt (§3). */
export const createFamilyGrowthHttpTransport = (input: {
  config: FamilyGrowthDeliveryConfig;
  fetchFn?: typeof fetch;
  timeoutMs?: number;
}): FamilyGrowthTransport => {
  const fetchFn = input.fetchFn ?? fetch;
  const timeoutMs = input.timeoutMs ?? FAMILY_GROWTH_REQUEST_TIMEOUT_MS;
  const url = `${input.config.baseUrl}${FAMILY_GROWTH_EVENTS_PATH}`;
  return async (envelope) => {
    try {
      const response = await fetchFn(url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${input.config.token}`,
        },
        body: JSON.stringify(envelope),
        signal: AbortSignal.timeout(timeoutMs),
      });
      let body: unknown = null;
      try {
        body = await response.json();
      } catch {
        body = null;
      }
      return { kind: "response", status: response.status, body };
    } catch {
      return { kind: "transport_error" };
    }
  };
};

export class FamilyGrowthDeliveryWorker {
  private timer: NodeJS.Timeout | null = null;
  private ticking = false;

  constructor(
    private readonly deps: {
      outbox: FamilyGrowthDeliveryOutboxPort;
      transport: FamilyGrowthTransport;
      log: FamilyGrowthDeliveryLog;
      now?: () => Date;
      /** Injected jitter source in [0, 1); defaults to Math.random. */
      jitterUnit?: () => number;
    },
  ) {}

  /** One poll: claim due rows (stale claims included) and deliver each. */
  async tick(): Promise<{ claimed: number; settled: number; retried: number }> {
    const now = this.deps.now?.() ?? new Date();
    const rows = await this.deps.outbox.claimDue({
      now,
      limit: FAMILY_GROWTH_DELIVERY_CLAIM_LIMIT,
      staleClaimBefore: new Date(now.getTime() - FAMILY_GROWTH_DELIVERING_LEASE_MS),
    });
    let settled = 0;
    let retried = 0;
    for (const row of rows) {
      const outcome = await this.deliver(row);
      if (outcome === "settled") settled += 1;
      else retried += 1;
    }
    return { claimed: rows.length, settled, retried };
  }

  private async deliver(row: FamilyGrowthOutboxClaimedRowV1): Promise<"settled" | "retried"> {
    const result = await this.deps.transport(row.envelope);
    const decision = decideFamilyGrowthDelivery({
      eventId: row.eventId,
      attemptCount: row.attemptCount,
      now: this.deps.now?.() ?? new Date(),
      jitterUnit: this.deps.jitterUnit?.() ?? Math.random(),
      result,
    });
    if (decision.kind === "settle") {
      const { receipt, consequence } = decision;
      await this.deps.outbox.recordReceipt({
        workspaceId: row.workspaceId,
        outboxEventId: row.eventId,
        receiptId: receipt.receipt_id,
        status: receipt.status,
        ...(consequence.refs.admissionRef !== undefined
          ? { admissionRef: consequence.refs.admissionRef }
          : {}),
        ...(consequence.refs.materialRef !== undefined
          ? { materialRef: consequence.refs.materialRef }
          : {}),
        ...(consequence.refs.suppressionRef !== undefined
          ? { suppressionRef: consequence.refs.suppressionRef }
          : {}),
        ...(consequence.refs.reasonCode !== undefined
          ? { reasonCode: consequence.refs.reasonCode }
          : {}),
        processedAt: new Date(receipt.processed_at),
        receiptPayload: receipt,
      });
      this.deps.log("family_growth_delivery_settled", {
        eventId: row.eventId,
        kind: row.kind,
        status: receipt.status,
        delivery: consequence.delivery,
        attemptCount: row.attemptCount,
      });
      return "settled";
    }
    await this.deps.outbox.recordTransportFailure({
      outboxEventId: row.eventId,
      nextAttemptAt: decision.nextAttemptAt,
    });
    this.deps.log(
      decision.operatorAttention
        ? "family_growth_delivery_attention"
        : "family_growth_delivery_retry",
      {
        eventId: row.eventId,
        kind: row.kind,
        attemptCount: row.attemptCount,
        nextAttemptAt: decision.nextAttemptAt.toISOString(),
      },
    );
    return "retried";
  }

  start(pollMs: number = FAMILY_GROWTH_DELIVERY_POLL_MS): void {
    if (this.timer) return;
    this.timer = setInterval(() => {
      if (this.ticking) return;
      this.ticking = true;
      void this.tick()
        .catch((error: unknown) => {
          this.deps.log("family_growth_delivery_tick_failed", {
            message: error instanceof Error ? error.message : "unknown",
          });
        })
        .finally(() => {
          this.ticking = false;
        });
    }, pollMs);
    this.timer.unref?.();
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
