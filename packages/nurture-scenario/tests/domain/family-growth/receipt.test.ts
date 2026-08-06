import { describe, expect, it } from "vitest";
import {
  FamilyGrowthReceiptError,
  parseAdmissionReceiptV1,
  receiptConsequenceV1,
  transportFailureConsequenceV1,
} from "../../../src/domain/family-growth/receipt.js";

const baseReceipt = (overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
  contract_key: "family_growth_material_admission_receipt",
  contract_version: "1.0.0",
  receipt_id: "rcpt-1",
  release_event_id: "evt-1",
  source_scenario_key: "nurture",
  source_release_ref: "pub-rel-1",
  family_id: "mc-family-1",
  status: "applied",
  processed_at: "2026-08-07T06:01:00.000Z",
  consumer_contract_version: "1.0.0",
  admission_ref: "adm-1",
  material_ref: "mat-1",
  ...overrides,
});

describe("parseAdmissionReceiptV1", () => {
  it("accepts every status with its required companion refs", () => {
    expect(parseAdmissionReceiptV1(baseReceipt()).status).toBe("applied");
    expect(
      parseAdmissionReceiptV1(baseReceipt({ status: "duplicate" })).status,
    ).toBe("duplicate");
    expect(
      parseAdmissionReceiptV1(
        baseReceipt({
          status: "pending_guardian_confirmation",
          material_ref: undefined,
        }),
      ).status,
    ).toBe("pending_guardian_confirmation");
    expect(
      parseAdmissionReceiptV1(
        baseReceipt({
          status: "tombstoned",
          admission_ref: undefined,
          material_ref: undefined,
          suppression_ref: "sup-1",
        }),
      ).status,
    ).toBe("tombstoned");
    for (const status of ["rejected", "conflict"] as const) {
      expect(
        parseAdmissionReceiptV1(
          baseReceipt({
            status,
            admission_ref: undefined,
            material_ref: undefined,
            reason_code: "policy_prerequisite_failed",
          }),
        ).status,
      ).toBe(status);
    }
  });

  it("rejects missing companion refs per status", () => {
    expect(() =>
      parseAdmissionReceiptV1(baseReceipt({ material_ref: undefined })),
    ).toThrow(FamilyGrowthReceiptError);
    expect(() =>
      parseAdmissionReceiptV1(
        baseReceipt({ status: "pending_guardian_confirmation" }),
      ),
    ).toThrow(/material_ref not allowed/);
    expect(() =>
      parseAdmissionReceiptV1(
        baseReceipt({ status: "tombstoned", admission_ref: undefined, material_ref: undefined }),
      ),
    ).toThrow(/suppression_ref/);
    expect(() =>
      parseAdmissionReceiptV1(
        baseReceipt({ status: "rejected", admission_ref: undefined, material_ref: undefined }),
      ),
    ).toThrow(/reason_code/);
  });

  it("rejects wrong contract identity and unknown statuses", () => {
    expect(() =>
      parseAdmissionReceiptV1(baseReceipt({ contract_key: "growth_record_receipt" })),
    ).toThrow(/contract_key/);
    expect(() =>
      parseAdmissionReceiptV1(baseReceipt({ consumer_contract_version: "2.0.0" })),
    ).toThrow(/consumer_contract_version/);
    expect(() => parseAdmissionReceiptV1(baseReceipt({ status: "outcome_unknown" }))).toThrow(
      /status/,
    );
  });
});

describe("delivery consequences", () => {
  it("maps applied/pending/duplicate/tombstoned to delivered and terminal", () => {
    for (const [receipt, queueState] of [
      [baseReceipt(), "applied"],
      [baseReceipt({ status: "duplicate" }), "duplicate"],
      [
        baseReceipt({ status: "pending_guardian_confirmation", material_ref: undefined }),
        "pending_guardian_confirmation",
      ],
      [
        baseReceipt({
          status: "tombstoned",
          admission_ref: undefined,
          material_ref: undefined,
          suppression_ref: "sup-1",
        }),
        "tombstoned",
      ],
    ] as const) {
      const consequence = receiptConsequenceV1(parseAdmissionReceiptV1(receipt));
      expect(consequence.delivery).toBe("delivered");
      expect(consequence.retriable).toBe(false);
      expect(consequence.queueState).toBe(queueState);
    }
  });

  it("maps rejected/conflict to failed, terminal, with the reason kept", () => {
    const consequence = receiptConsequenceV1(
      parseAdmissionReceiptV1(
        baseReceipt({
          status: "conflict",
          admission_ref: undefined,
          material_ref: undefined,
          reason_code: "digest_mismatch",
        }),
      ),
    );
    expect(consequence.delivery).toBe("failed");
    expect(consequence.retriable).toBe(false);
    expect(consequence.refs.reasonCode).toBe("digest_mismatch");
  });

  it("keeps outcome_unknown as the retriable transport state, not a receipt", () => {
    const failure = transportFailureConsequenceV1();
    expect(failure.delivery).toBe("outcome_unknown");
    expect(failure.retriable).toBe(true);
    expect(failure.queueState).toBe("outcome_unknown");
  });
});
