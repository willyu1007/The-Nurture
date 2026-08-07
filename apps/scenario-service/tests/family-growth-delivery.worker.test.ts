import { describe, expect, it } from "vitest";
import type {
  FamilyGrowthOutboxClaimedRowV1,
  FamilyGrowthReceiptRecordInputV1,
} from "@the-nurture/db";
import {
  FamilyGrowthDeliveryWorker,
  type FamilyGrowthTransport,
} from "../src/family-growth-delivery.worker.js";

const NOW = new Date("2026-08-07T12:00:00.000Z");

const row = (overrides: Partial<FamilyGrowthOutboxClaimedRowV1> = {}): FamilyGrowthOutboxClaimedRowV1 => ({
  eventId: "evt-1",
  workspaceId: "ws-1",
  kind: "released",
  payloadDigest: "a".repeat(64),
  envelope: { event_id: "evt-1" },
  attemptCount: 1,
  ...overrides,
});

const receiptBody = (overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
  contract_key: "family_growth_material_admission_receipt",
  contract_version: "1.0.0",
  receipt_id: "rcpt-1",
  release_event_id: "evt-1",
  source_scenario_key: "nurture",
  source_release_ref: "pub-rel-1",
  family_id: "mc-family-1",
  status: "applied",
  processed_at: "2026-08-07T12:00:01.000Z",
  consumer_contract_version: "1.0.0",
  admission_ref: "adm-1",
  material_ref: "mat-1",
  ...overrides,
});

type Fake = {
  worker: FamilyGrowthDeliveryWorker;
  receipts: FamilyGrowthReceiptRecordInputV1[];
  failures: Array<{ outboxEventId: string; nextAttemptAt: Date }>;
  claims: Array<{ now: Date; limit: number; staleClaimBefore?: Date }>;
  logs: Array<{ event: string; fields: Record<string, unknown> }>;
};

const build = (rows: FamilyGrowthOutboxClaimedRowV1[], transport: FamilyGrowthTransport): Fake => {
  const receipts: FamilyGrowthReceiptRecordInputV1[] = [];
  const failures: Array<{ outboxEventId: string; nextAttemptAt: Date }> = [];
  const claims: Array<{ now: Date; limit: number; staleClaimBefore?: Date }> = [];
  const logs: Array<{ event: string; fields: Record<string, unknown> }> = [];
  const worker = new FamilyGrowthDeliveryWorker({
    outbox: {
      claimDue: async (input) => {
        claims.push(input);
        return rows;
      },
      recordReceipt: async (input) => {
        receipts.push(input);
      },
      recordTransportFailure: async (input) => {
        failures.push(input);
      },
    },
    transport,
    log: (event, fields) => logs.push({ event, fields }),
    now: () => NOW,
    jitterUnit: () => 0.5,
  });
  return { worker, receipts, failures, claims, logs };
};

describe("FamilyGrowthDeliveryWorker.tick", () => {
  it("claims with the stale-delivering lease and settles a valid receipt", async () => {
    const fake = build([row()], async () => ({
      kind: "response",
      status: 200,
      body: receiptBody(),
    }));
    const outcome = await fake.worker.tick();
    expect(outcome).toEqual({ claimed: 1, settled: 1, retried: 0 });
    expect(fake.claims[0]?.staleClaimBefore?.getTime()).toBe(NOW.getTime() - 600_000);
    expect(fake.receipts).toHaveLength(1);
    expect(fake.receipts[0]).toMatchObject({
      workspaceId: "ws-1",
      outboxEventId: "evt-1",
      receiptId: "rcpt-1",
      status: "applied",
      admissionRef: "adm-1",
      materialRef: "mat-1",
    });
    expect(fake.logs[0]?.event).toBe("family_growth_delivery_settled");
  });

  it("records rejected receipts as settled failures without retry", async () => {
    const fake = build([row()], async () => ({
      kind: "response",
      status: 200,
      body: receiptBody({
        status: "rejected",
        admission_ref: undefined,
        material_ref: undefined,
        reason_code: "policy_prerequisite_failed",
      }),
    }));
    const outcome = await fake.worker.tick();
    expect(outcome.settled).toBe(1);
    expect(fake.receipts[0]).toMatchObject({
      status: "rejected",
      reasonCode: "policy_prerequisite_failed",
    });
    expect(fake.failures).toHaveLength(0);
  });

  it("maps transport failures to outcome_unknown with frozen backoff", async () => {
    const fake = build([row()], async () => ({ kind: "transport_error" }));
    const outcome = await fake.worker.tick();
    expect(outcome).toEqual({ claimed: 1, settled: 0, retried: 1 });
    expect(fake.receipts).toHaveLength(0);
    expect(fake.failures[0]).toEqual({
      outboxEventId: "evt-1",
      nextAttemptAt: new Date(NOW.getTime() + 30_000),
    });
    expect(fake.logs[0]?.event).toBe("family_growth_delivery_retry");
  });

  it("raises the attention event from the eighth attempt", async () => {
    const fake = build([row({ attemptCount: 8 })], async () => ({
      kind: "response",
      status: 503,
      body: null,
    }));
    await fake.worker.tick();
    expect(fake.logs[0]?.event).toBe("family_growth_delivery_attention");
    // Attempt 8 backs off at the one-hour cap.
    expect(fake.failures[0]?.nextAttemptAt).toEqual(new Date(NOW.getTime() + 3_600_000));
  });

  it("a receipt naming another event never settles this row", async () => {
    const fake = build([row()], async () => ({
      kind: "response",
      status: 200,
      body: receiptBody({ release_event_id: "evt-other" }),
    }));
    const outcome = await fake.worker.tick();
    expect(outcome.retried).toBe(1);
    expect(fake.receipts).toHaveLength(0);
  });
});
