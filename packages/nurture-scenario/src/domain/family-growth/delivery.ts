import type {
  FamilyGrowthAdmissionReceiptV1,
  FamilyGrowthLifecycleEventV1,
  FamilyGrowthLifecycleKindV1,
  FamilyGrowthReleaseEventV1,
} from "./envelope.js";
import { validateLifecycleEventV1, validateReleaseEventV1 } from "./envelope.js";
import { lifecyclePayloadDigestV1, releasePayloadDigestV1 } from "./jcs.js";
import type {
  FamilyGrowthDeliveryConsequenceV1,
  FamilyGrowthExpectedReceiptCoordinatesV1,
} from "./receipt.js";
import {
  parseAdmissionReceiptV1,
  receiptConsequenceV1,
  receiptMatchesExpectedCoordinatesV1,
} from "./receipt.js";

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
      /** Full response body; unknown fields remain part of receipt identity. */
      rawReceiptPayload: unknown;
      consequence: FamilyGrowthDeliveryConsequenceV1;
    }
  | {
      kind: "retry";
      nextAttemptAt: Date;
      /** True from the 8th attempt (~4h): raise the ops signal (addendum §3). */
      operatorAttention: boolean;
    };

export type FamilyGrowthDeliveryEnvelopeKindV1 = "released" | FamilyGrowthLifecycleKindV1;

/**
 * Revalidate the durable envelope before transport and bind its receipt
 * coordinates to the claimed row. A corrupt or mismatched row is not sent.
 */
export const expectedReceiptCoordinatesFromEnvelopeV1 = (input: {
  eventId: string;
  kind: FamilyGrowthDeliveryEnvelopeKindV1;
  payloadDigest: string;
  envelope: unknown;
}): FamilyGrowthExpectedReceiptCoordinatesV1 | null => {
  const violations = input.kind === "released"
    ? validateReleaseEventV1(input.envelope)
    : validateLifecycleEventV1(input.envelope);
  if (violations.length > 0) return null;

  if (input.kind === "released") {
    const envelope = input.envelope as FamilyGrowthReleaseEventV1;
    const { source, target, admission, material, retention } = envelope;
    if (
      envelope.event_id !== input.eventId
      || envelope.event_kind !== input.kind
      || envelope.payload_digest !== input.payloadDigest
      || releasePayloadDigestV1({ source, target, admission, material, retention })
        !== input.payloadDigest
    ) {
      return null;
    }
    return {
      releaseEventId: envelope.event_id,
      sourceScenarioKey: source.scenario_key,
      sourceReleaseRef: source.publication_release_ref,
      familyId: target.family_id,
    };
  }

  const envelope = input.envelope as FamilyGrowthLifecycleEventV1;
  const { source, target, correction } = envelope;
  if (
    envelope.event_id !== input.eventId
    || envelope.event_kind !== input.kind
    || envelope.payload_digest !== input.payloadDigest
    || lifecyclePayloadDigestV1({ source, target, correction }) !== input.payloadDigest
  ) {
    return null;
  }
  return {
    releaseEventId: envelope.event_id,
    sourceScenarioKey: source.scenario_key,
    sourceReleaseRef: source.publication_release_ref,
    familyId: target.family_id,
  };
};

/**
 * The frozen settlement rule: ONLY a valid 200 receipt whose
 * coordinates echo this exact stored envelope settles it. Timeouts, 5xx,
 * 4xx without a receipt, unparsable receipts and any coordinate mismatch are
 * all `outcome_unknown` — retriable with the same event id and digest, never
 * assumed delivered or failed.
 */
export const decideFamilyGrowthDelivery = (input: {
  expectedReceipt: FamilyGrowthExpectedReceiptCoordinatesV1 | null;
  attemptCount: number;
  now: Date;
  jitterUnit: number;
  result: FamilyGrowthTransportResultV1;
}): FamilyGrowthDeliveryDecisionV1 => {
  if (input.result.kind === "response" && input.result.status === 200) {
    try {
      const receipt = parseAdmissionReceiptV1(input.result.body);
      if (
        input.expectedReceipt
        && receiptMatchesExpectedCoordinatesV1(receipt, input.expectedReceipt)
      ) {
        return {
          kind: "settle",
          receipt,
          rawReceiptPayload: input.result.body,
          consequence: receiptConsequenceV1(receipt),
        };
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
