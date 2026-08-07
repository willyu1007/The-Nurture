import { describe, expect, it } from "vitest";
import {
  decideFamilyGrowthDelivery,
  familyGrowthBackoffDelayMs,
  FAMILY_GROWTH_ATTENTION_ATTEMPTS,
  FAMILY_GROWTH_BACKOFF_CAP_MS,
} from "../../../src/domain/family-growth/delivery.js";

const NOW = new Date("2026-08-07T10:00:00.000Z");

const receipt = (overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
  contract_key: "family_growth_material_admission_receipt",
  contract_version: "1.0.0",
  receipt_id: "rcpt-1",
  release_event_id: "evt-1",
  source_scenario_key: "nurture",
  source_release_ref: "pub-rel-1",
  family_id: "mc-family-1",
  status: "applied",
  processed_at: "2026-08-07T10:00:01.000Z",
  consumer_contract_version: "1.0.0",
  admission_ref: "adm-1",
  material_ref: "mat-1",
  ...overrides,
});

const decide = (
  result: Parameters<typeof decideFamilyGrowthDelivery>[0]["result"],
  attemptCount = 1,
) =>
  decideFamilyGrowthDelivery({
    eventId: "evt-1",
    attemptCount,
    now: NOW,
    jitterUnit: 0.5, // exactly zero jitter spread
    result,
  });

describe("familyGrowthBackoffDelayMs", () => {
  it("doubles from 30s and caps at one hour", () => {
    expect(familyGrowthBackoffDelayMs(1, 0.5)).toBe(30_000);
    expect(familyGrowthBackoffDelayMs(2, 0.5)).toBe(60_000);
    expect(familyGrowthBackoffDelayMs(5, 0.5)).toBe(480_000);
    expect(familyGrowthBackoffDelayMs(8, 0.5)).toBe(3_600_000);
    expect(familyGrowthBackoffDelayMs(50, 0.5)).toBe(FAMILY_GROWTH_BACKOFF_CAP_MS);
  });

  it("keeps jitter inside ±20%", () => {
    expect(familyGrowthBackoffDelayMs(1, 0)).toBe(24_000);
    expect(familyGrowthBackoffDelayMs(1, 0.999999)).toBeGreaterThanOrEqual(35_999);
    expect(familyGrowthBackoffDelayMs(1, 0.999999)).toBeLessThanOrEqual(36_000);
  });
});

describe("decideFamilyGrowthDelivery", () => {
  it("settles only on a valid 200 receipt naming this event", () => {
    const decision = decide({ kind: "response", status: 200, body: receipt() });
    expect(decision.kind).toBe("settle");
    if (decision.kind !== "settle") return;
    expect(decision.receipt.status).toBe("applied");
    expect(decision.consequence.delivery).toBe("delivered");
  });

  it("settles rejected receipts as failed without retry", () => {
    const decision = decide({
      kind: "response",
      status: 200,
      body: receipt({
        status: "rejected",
        admission_ref: undefined,
        material_ref: undefined,
        reason_code: "policy_prerequisite_failed",
      }),
    });
    expect(decision.kind).toBe("settle");
    if (decision.kind !== "settle") return;
    expect(decision.consequence.delivery).toBe("failed");
    expect(decision.consequence.retriable).toBe(false);
  });

  it("retries every non-settling outcome as outcome_unknown", () => {
    for (const result of [
      { kind: "transport_error" as const },
      { kind: "response" as const, status: 503, body: {} },
      { kind: "response" as const, status: 401, body: {} },
      { kind: "response" as const, status: 400, body: {} },
      { kind: "response" as const, status: 200, body: { garbage: true } },
      // A valid receipt for a DIFFERENT event never settles this one.
      { kind: "response" as const, status: 200, body: receipt({ release_event_id: "evt-9" }) },
    ]) {
      const decision = decide(result);
      expect(decision.kind).toBe("retry");
      if (decision.kind !== "retry") continue;
      expect(decision.nextAttemptAt.getTime()).toBe(NOW.getTime() + 30_000);
      expect(decision.operatorAttention).toBe(false);
    }
  });

  it("raises operator attention from the eighth attempt", () => {
    const before = decide({ kind: "transport_error" }, FAMILY_GROWTH_ATTENTION_ATTEMPTS - 1);
    const at = decide({ kind: "transport_error" }, FAMILY_GROWTH_ATTENTION_ATTEMPTS);
    expect(before.kind === "retry" && before.operatorAttention).toBe(false);
    expect(at.kind === "retry" && at.operatorAttention).toBe(true);
  });
});
