import type { FamilyGrowthAdmissionReceiptV1, FamilyGrowthReceiptStatusV1 } from "./envelope.js";
import { FAMILY_GROWTH_CONTRACT_VERSION, FAMILY_GROWTH_RECEIPT_CONTRACT_KEY } from "./envelope.js";

/**
 * Admission-receipt interpretation (N7). A receipt is My-Chat's processing
 * result and nothing else: it never grants Nurture read/write authority, and
 * `outcome_unknown` is a provider-side DELIVERY state (timeout/transport
 * failure), never a receipt status — a delivery that timed out has no
 * receipt to interpret.
 */

export type FamilyGrowthDeliveryConsequenceV1 = {
  /** Delivery bookkeeping for the outbox row. */
  delivery: "delivered" | "failed";
  /** Whether the same event id + digest may be retried automatically. */
  retriable: false;
  /** Teacher publish-queue display state (requirements §四 vocabulary). */
  queueState:
    | "applied"
    | "pending_guardian_confirmation"
    | "duplicate"
    | "tombstoned"
    | "rejected"
    | "conflict";
  /** Refs to persist on the provider receipt row. */
  refs: {
    admissionRef?: string;
    materialRef?: string;
    suppressionRef?: string;
    reasonCode?: string;
  };
};

export type FamilyGrowthExpectedReceiptCoordinatesV1 = Readonly<{
  releaseEventId: string;
  sourceScenarioKey: string;
  sourceReleaseRef: string;
  familyId: string;
}>;

export class FamilyGrowthReceiptError extends Error {
  readonly path: string;
  constructor(path: string, message: string) {
    super(`family growth admission receipt: ${path} ${message}`);
    this.name = "FamilyGrowthReceiptError";
    this.path = path;
  }
}

const RECEIPT_STATUSES: readonly FamilyGrowthReceiptStatusV1[] = [
  "applied",
  "pending_guardian_confirmation",
  "duplicate",
  "tombstoned",
  "rejected",
  "conflict",
];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const requireRef = (record: Record<string, unknown>, key: string): string => {
  const value = record[key];
  if (typeof value !== "string" || value.length < 1 || value.length > 256) {
    throw new FamilyGrowthReceiptError(key, "must be an opaque ref");
  }
  return value;
};

const optionalRef = (record: Record<string, unknown>, key: string): string | undefined => {
  if (record[key] === undefined) return undefined;
  return requireRef(record, key);
};

/**
 * Parse and validate a wire receipt, enforcing the schema's per-status
 * companion requirements:
 * - `applied` / `duplicate` → `admission_ref` + `material_ref`;
 * - `pending_guardian_confirmation` → `admission_ref`, no `material_ref`;
 * - `tombstoned` → `suppression_ref`;
 * - `rejected` / `conflict` → `reason_code`.
 */
export const parseAdmissionReceiptV1 = (value: unknown): FamilyGrowthAdmissionReceiptV1 => {
  if (!isRecord(value)) throw new FamilyGrowthReceiptError("receipt", "must be an object");
  if (value.contract_key !== FAMILY_GROWTH_RECEIPT_CONTRACT_KEY) {
    throw new FamilyGrowthReceiptError("contract_key", "unexpected contract");
  }
  if (value.contract_version !== FAMILY_GROWTH_CONTRACT_VERSION) {
    throw new FamilyGrowthReceiptError("contract_version", "unexpected version");
  }
  if (value.consumer_contract_version !== FAMILY_GROWTH_CONTRACT_VERSION) {
    throw new FamilyGrowthReceiptError("consumer_contract_version", "unexpected version");
  }
  const status = value.status;
  if (typeof status !== "string" || !RECEIPT_STATUSES.includes(status as never)) {
    throw new FamilyGrowthReceiptError("status", "unknown status");
  }
  if (
    typeof value.processed_at !== "string" ||
    Number.isNaN(Date.parse(value.processed_at))
  ) {
    throw new FamilyGrowthReceiptError("processed_at", "must be a date-time");
  }
  const sourceScenarioKey = value.source_scenario_key;
  if (typeof sourceScenarioKey !== "string" || !/^[a-z][a-z0-9_]{0,63}$/.test(sourceScenarioKey)) {
    throw new FamilyGrowthReceiptError("source_scenario_key", "must be a stable key");
  }

  const admissionRef = optionalRef(value, "admission_ref");
  const materialRef = optionalRef(value, "material_ref");
  const suppressionRef = optionalRef(value, "suppression_ref");
  const reasonCode = optionalRef(value, "reason_code");
  const receipt: FamilyGrowthAdmissionReceiptV1 = {
    contract_key: FAMILY_GROWTH_RECEIPT_CONTRACT_KEY,
    contract_version: FAMILY_GROWTH_CONTRACT_VERSION,
    receipt_id: requireRef(value, "receipt_id"),
    release_event_id: requireRef(value, "release_event_id"),
    source_scenario_key: sourceScenarioKey,
    source_release_ref: requireRef(value, "source_release_ref"),
    family_id: requireRef(value, "family_id"),
    status: status as FamilyGrowthReceiptStatusV1,
    processed_at: value.processed_at,
    consumer_contract_version: FAMILY_GROWTH_CONTRACT_VERSION,
    ...(admissionRef !== undefined ? { admission_ref: admissionRef } : {}),
    ...(materialRef !== undefined ? { material_ref: materialRef } : {}),
    ...(suppressionRef !== undefined ? { suppression_ref: suppressionRef } : {}),
    ...(reasonCode !== undefined ? { reason_code: reasonCode } : {}),
  };

  switch (receipt.status) {
    case "applied":
    case "duplicate":
      if (!receipt.admission_ref || !receipt.material_ref) {
        throw new FamilyGrowthReceiptError(
          "admission_ref/material_ref",
          `required for ${receipt.status}`,
        );
      }
      break;
    case "pending_guardian_confirmation":
      if (!receipt.admission_ref) {
        throw new FamilyGrowthReceiptError("admission_ref", "required for pending confirmation");
      }
      if (receipt.material_ref) {
        throw new FamilyGrowthReceiptError("material_ref", "not allowed while pending");
      }
      break;
    case "tombstoned":
      if (!receipt.suppression_ref) {
        throw new FamilyGrowthReceiptError("suppression_ref", "required for tombstoned");
      }
      break;
    case "rejected":
    case "conflict":
      if (!receipt.reason_code) {
        throw new FamilyGrowthReceiptError("reason_code", `required for ${receipt.status}`);
      }
      break;
  }

  return receipt;
};

/** A receipt is evidence only for the exact envelope coordinates it echoes. */
export const receiptMatchesExpectedCoordinatesV1 = (
  receipt: FamilyGrowthAdmissionReceiptV1,
  expected: FamilyGrowthExpectedReceiptCoordinatesV1,
): boolean =>
  receipt.release_event_id === expected.releaseEventId
  && receipt.source_scenario_key === expected.sourceScenarioKey
  && receipt.source_release_ref === expected.sourceReleaseRef
  && receipt.family_id === expected.familyId;

/**
 * Map a validated receipt to its provider-side consequence. Every receipt is
 * terminal for its event id: the six statuses all mean My-Chat processed the
 * event. Only transport failures (no receipt at all) are retriable, via
 * `transportFailureConsequenceV1`.
 */
export const receiptConsequenceV1 = (
  receipt: FamilyGrowthAdmissionReceiptV1,
): FamilyGrowthDeliveryConsequenceV1 => ({
  delivery: receipt.status === "rejected" || receipt.status === "conflict" ? "failed" : "delivered",
  retriable: false,
  queueState: receipt.status,
  refs: {
    ...(receipt.admission_ref ? { admissionRef: receipt.admission_ref } : {}),
    ...(receipt.material_ref ? { materialRef: receipt.material_ref } : {}),
    ...(receipt.suppression_ref ? { suppressionRef: receipt.suppression_ref } : {}),
    ...(receipt.reason_code ? { reasonCode: receipt.reason_code } : {}),
  },
});

export type FamilyGrowthTransportFailureV1 = {
  delivery: "outcome_unknown";
  /** Same event id + payload digest, exponential backoff (addendum §2). */
  retriable: true;
  queueState: "outcome_unknown";
};

/** Timeout / 5xx / network failure: no receipt exists; retry the same event. */
export const transportFailureConsequenceV1 = (): FamilyGrowthTransportFailureV1 => ({
  delivery: "outcome_unknown",
  retriable: true,
  queueState: "outcome_unknown",
});
