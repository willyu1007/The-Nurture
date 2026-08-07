import type { FamilyGrowthAdmissionReceiptV1 } from "./envelope.js";
import type { FamilyGrowthDeliveryConsequenceV1 } from "./receipt.js";
import { parseAdmissionReceiptV1, receiptConsequenceV1 } from "./receipt.js";

/**
 * T-009 I3b delivery engine, pure half. Parameters are FROZEN by
 * `family_growth_transport@1.0.0` §3 — change the addendum first, then this.
 */
export const FAMILY_GROWTH_BACKOFF_BASE_MS = 30_000;
export const FAMILY_GROWTH_BACKOFF_FACTOR = 2;
export const FAMILY_GROWTH_BACKOFF_CAP_MS = 3_600_000;
export const FAMILY_GROWTH_BACKOFF_JITTER_RATIO = 0.2;
export const FAMILY_GROWTH_ATTENTION_ATTEMPTS = 8;
export const FAMILY_GROWTH_DELIVERING_LEASE_MS = 600_000;
export const FAMILY_GROWTH_REQUEST_TIMEOUT_MS = 30_000;

/**
 * Exponential backoff with ±20% jitter. `attemptCount` is the attempts made
 * so far (≥1 — the claim increments before delivery); `jitterUnit` is an
 * injected value in [0, 1) so the engine stays deterministic under test.
 */
export const familyGrowthBackoffDelayMs = (
  attemptCount: number,
  jitterUnit: number,
): number => {
  const exponent = Math.max(0, attemptCount - 1);
  const base = Math.min(
    FAMILY_GROWTH_BACKOFF_BASE_MS * FAMILY_GROWTH_BACKOFF_FACTOR ** exponent,
    FAMILY_GROWTH_BACKOFF_CAP_MS,
  );
  const spread = (jitterUnit * 2 - 1) * FAMILY_GROWTH_BACKOFF_JITTER_RATIO;
  return Math.round(base * (1 + spread));
};

/** What the wire attempt produced, before interpretation. */
export type FamilyGrowthTransportResultV1 =
  | { kind: "response"; status: number; body: unknown }
  | { kind: "transport_error" };

export type FamilyGrowthDeliveryDecisionV1 =
  | {
      kind: "settle";
      receipt: FamilyGrowthAdmissionReceiptV1;
      consequence: FamilyGrowthDeliveryConsequenceV1;
    }
  | {
      kind: "retry";
      nextAttemptAt: Date;
      /** True from the 8th attempt (~4h): raise the ops signal (addendum §3). */
      operatorAttention: boolean;
    };

/**
 * The frozen settlement rule: ONLY a valid 200 receipt whose
 * `release_event_id` names this exact event settles it. Timeouts, 5xx, 4xx
 * without a receipt, unparsable receipts and mismatched receipts are all
 * `outcome_unknown` — retriable with the same event id and digest, never
 * assumed delivered or failed.
 */
export const decideFamilyGrowthDelivery = (input: {
  eventId: string;
  attemptCount: number;
  now: Date;
  jitterUnit: number;
  result: FamilyGrowthTransportResultV1;
}): FamilyGrowthDeliveryDecisionV1 => {
  if (input.result.kind === "response" && input.result.status === 200) {
    try {
      const receipt = parseAdmissionReceiptV1(input.result.body);
      if (receipt.release_event_id === input.eventId) {
        return { kind: "settle", receipt, consequence: receiptConsequenceV1(receipt) };
      }
    } catch {
      // fall through to retry: a malformed receipt settles nothing.
    }
  }
  return {
    kind: "retry",
    nextAttemptAt: new Date(
      input.now.getTime() + familyGrowthBackoffDelayMs(input.attemptCount, input.jitterUnit),
    ),
    operatorAttention: input.attemptCount >= FAMILY_GROWTH_ATTENTION_ATTEMPTS,
  };
};
