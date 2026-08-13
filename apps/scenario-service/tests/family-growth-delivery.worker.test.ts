import { describe, expect, it } from "vitest";
import type {
  FamilyGrowthOutboxClaimedRowV1,
  FamilyGrowthReceiptRecordInputV1,
} from "@the-nurture/db";
import { assembleReleaseEventV1 } from "@the-nurture/scenario/family-growth";
import {
  FamilyGrowthDeliveryWorker,
  type FamilyGrowthTransport,
} from "../src/family-growth-delivery.worker.js";

const NOW = new Date("2026-08-07T12:00:00.000Z");

const envelope = () =>
  assembleReleaseEventV1({
    eventId: "evt-1",
    occurredAt: "2026-08-07T11:59:00.000Z",
    source: {
      publication_release_ref: "pub-rel-1",
      publish_process_ref: "pub-proc-1",
      publish_revision_ref: "pub-rev-1",
      publish_revision: 1,
      content_digest: "a".repeat(64),
      receipt_ref: "source-receipt-1",
      source_target_ref: "target-1",
      committed_at: "2026-08-07T11:58:00.000Z",
    },
    target: { child_id: "mc-child-1", family_id: "mc-family-1" },
    admission: { mode: "direct_family_release", policy_ref: "policy-1", policy_version: 1 },
    material: {
      occurredAt: "2026-08-07T11:00:00.000Z",
      displaySnapshot: { title: "Growth", source_label: "Class A" },
      attribution: {
        source_contributor_ref: "contributor-1",
        source_organization_ref: "organization-1",
        contributed_at: "2026-08-07T11:00:00.000Z",
      },
      media: [
        {
          source_asset_ref: "asset-1",
          source_media_revision: 1,
          content_digest: "b".repeat(64),
          family_rendition_ref: "rendition-1",
          mime_type: "image/jpeg",
          access_mode: "authorized_short_lived_url",
        },
      ],
    },
    retentionMode: "family_retained",
  });

const row = (
  overrides: Partial<FamilyGrowthOutboxClaimedRowV1> = {},
): FamilyGrowthOutboxClaimedRowV1 => {
  const storedEnvelope = envelope();
  return {
    eventId: "evt-1",
    workspaceId: "ws-1",
    kind: "released",
    payloadDigest: storedEnvelope.payload_digest,
    envelope: storedEnvelope,
    attemptCount: 1,
    ...overrides,
  };
};

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
  failures: Array<{
    workspaceId: string;
    outboxEventId: string;
    attemptCount: number;
    nextAttemptAt: Date;
  }>;
  claims: Array<{ now: Date; limit: number; staleClaimBefore?: Date }>;
  logs: Array<{ event: string; fields: Record<string, unknown> }>;
};

const build = (
  rows: FamilyGrowthOutboxClaimedRowV1[],
  transport: FamilyGrowthTransport,
  writeResults: {
    receipt?:
      | "settled"
      | "replayed"
      | "stale"
      | "not_settled"
      | "receipt_coordinate_mismatch"
      | "receipt_conflict";
    failure?: "recorded" | "stale";
  } = {},
): Fake => {
  const receipts: FamilyGrowthReceiptRecordInputV1[] = [];
  const failures: Fake["failures"] = [];
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
        return writeResults.receipt ?? "settled";
      },
      recordTransportFailure: async (input) => {
        failures.push(input);
        return writeResults.failure ?? "recorded";
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
      attemptCount: 1,
      releaseEventId: "evt-1",
      sourceScenarioKey: "nurture",
      sourceReleaseRef: "pub-rel-1",
      familyId: "mc-family-1",
      receiptId: "rcpt-1",
      status: "applied",
      admissionRef: "adm-1",
      materialRef: "mat-1",
    });
    expect(fake.logs[0]?.event).toBe("family_growth_delivery_settled");
  });

  it("passes the canonicalizable raw receipt body through for replay identity", async () => {
    const body = receiptBody({ consumer_extension: { trace: "raw-1" } });
    const fake = build([row()], async () => ({ kind: "response", status: 200, body }));
    await fake.worker.tick();
    expect(fake.receipts[0]?.receiptPayload).toEqual(body);
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
      workspaceId: "ws-1",
      outboxEventId: "evt-1",
      attemptCount: 1,
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

  it("does not send an invalid stored envelope", async () => {
    let sent = false;
    const fake = build(
      [row({ envelope: { event_id: "evt-1" } })],
      async () => {
        sent = true;
        return { kind: "transport_error" };
      },
    );
    expect(await fake.worker.tick()).toEqual({ claimed: 1, settled: 0, retried: 1 });
    expect(sent).toBe(false);
  });

  it("ignores a stale worker success after a newer lease is claimed", async () => {
    const fake = build(
      [row({ attemptCount: 1 })],
      async () => ({ kind: "response", status: 200, body: receiptBody() }),
      { receipt: "stale" },
    );
    expect(await fake.worker.tick()).toEqual({ claimed: 1, settled: 0, retried: 0 });
    expect(fake.receipts[0]?.attemptCount).toBe(1);
    expect(fake.logs).toEqual([]);
  });

  it("ignores a stale worker failure after a newer lease is claimed", async () => {
    const fake = build(
      [row({ attemptCount: 1 })],
      async () => ({ kind: "transport_error" }),
      { failure: "stale" },
    );
    expect(await fake.worker.tick()).toEqual({ claimed: 1, settled: 0, retried: 0 });
    expect(fake.failures[0]?.attemptCount).toBe(1);
    expect(fake.logs).toEqual([]);
  });

  it("emits a warn log and increment-style signal for a receipt conflict", async () => {
    const fake = build(
      [row()],
      async () => ({ kind: "response", status: 200, body: receiptBody() }),
      { receipt: "receipt_conflict" },
    );
    expect(await fake.worker.tick()).toEqual({ claimed: 1, settled: 0, retried: 0 });
    expect(fake.logs).toEqual([
      {
        event: "family_growth_delivery_receipt_conflict",
        fields: {
          level: "warn",
          eventId: "evt-1",
          kind: "released",
          attemptCount: 1,
          signal: "family_growth_delivery_receipt_conflicts_total",
          signalIncrement: 1,
        },
      },
    ]);
  });
});
