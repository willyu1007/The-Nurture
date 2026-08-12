import { createHash } from "node:crypto";
import {
  nurtureCanonicalJsonBytes,
  nurtureSha256Hex,
} from "../../c30/canonical-json.js";
import {
  NURTURE_FAMILY_SHARING_CATEGORIES,
  NURTURE_FAMILY_SHARING_DIRECTION_BY_CATEGORY,
  NURTURE_FAMILY_SHARING_ELIGIBILITY_INTERFACE,
  NURTURE_FAMILY_SHARING_ELIGIBILITY_PURPOSE,
  type NurtureFamilySharingAuthorityCategoryFactsV1,
  type NurtureFamilySharingEligibilityResultV1,
} from "../../harness/family-sharing-eligibility.js";
import {
  type NurtureFamilySharingCurrentAuthorityReadInputV1,
  type NurtureFamilySharingCurrentAuthorityReadPortV1,
  type NurtureFamilySharingExactTargetSelectorV1,
  type NurtureFamilySharingResolvedLocalPairV1,
  type NurtureFamilySharingVerifiedCurrentPairEvidenceV1,
  type NurtureFamilySharingVerifiedServicePrincipalV1,
} from "./authority-records.js";

export const NURTURE_FAMILY_SHARING_PRIVATE_PATH =
  "/internal/nurture/family-sharing/invoke" as const;
export const NURTURE_FAMILY_SHARING_PRIVATE_ENDPOINT =
  "nurture.family_sharing.private" as const;
export const NURTURE_FAMILY_SHARING_PRIVATE_INGRESS =
  "my-chat.family-nurture-authorization" as const;
export const NURTURE_FAMILY_SHARING_ELIGIBILITY_OPERATION =
  "read_family_sharing_eligibility" as const;
export const NURTURE_FAMILY_SHARING_CLEANUP_OPERATION =
  "cleanup_family_sharing_withdrawal" as const;
export const NURTURE_FAMILY_SHARING_PRIVATE_INPUT_SCHEMA_VERSION = 1 as const;
export const NURTURE_FAMILY_SHARING_CLEANUP_CONTRACT = {
  key: "nurture.family-sharing-withdrawal-cleanup",
  version: "1.0.0",
  digest:
    "sha256:9dcbf4e0ed3eb20dc915e4006691aaaa5d0be43c53fd687166bdfce85ed9aeda",
} as const;

export type NurtureFamilySharingWirePairEvidenceV1 = Readonly<{
  evidence_ref: string;
  evidence_version: number;
  verified_at: string;
  expires_at: string;
  child_anchor_ref: string;
  child_owner_version: number;
  family_anchor_ref: string;
  family_owner_version: number;
  my_chat_family_lifecycle: "active" | "inactive";
}>;

export type NurtureFamilySharingWireTargetV1 = Readonly<{
  pair_evidence_ref: string;
  pair_evidence_version: number;
  target_kind: "enrollment";
  enrollment_ref: string;
  enrollment_revision: number;
}>;

export type NurtureFamilySharingEligibilityPrivateInputV1 = Readonly<{
  interface_contract: typeof NURTURE_FAMILY_SHARING_ELIGIBILITY_INTERFACE;
  purpose: typeof NURTURE_FAMILY_SHARING_ELIGIBILITY_PURPOSE;
  pair_evidence: NurtureFamilySharingWirePairEvidenceV1;
  target: NurtureFamilySharingWireTargetV1;
}>;

export type NurtureFamilySharingCleanupPrivateInputV1 = Readonly<{
  cleanup_contract: typeof NURTURE_FAMILY_SHARING_CLEANUP_CONTRACT;
  cleanup_command_ref: string;
  purpose: typeof NURTURE_FAMILY_SHARING_ELIGIBILITY_PURPOSE;
  categories: readonly ("media" | "focus_collaboration")[];
  pair_evidence: NurtureFamilySharingWirePairEvidenceV1;
  target: NurtureFamilySharingWireTargetV1;
}>;

export type NurtureFamilySharingExactLocalPairResolverV1 = Readonly<{
  resolveExact(input: {
    workspace_id: string;
    pair_evidence: NurtureFamilySharingVerifiedCurrentPairEvidenceV1;
    target: NurtureFamilySharingExactTargetSelectorV1;
    evaluated_at: string;
  }): Promise<
    | Readonly<{
        status: "resolved";
        local_pair: NurtureFamilySharingResolvedLocalPairV1;
      }>
    | Readonly<{ status: "unavailable" }>
  >;
}>;

export type NurtureFamilySharingResolvedCleanupRequestV1 = Readonly<{
  wire: NurtureFamilySharingCleanupPrivateInputV1;
  local_pair: NurtureFamilySharingResolvedLocalPairV1;
}>;

export type NurtureFamilySharingCleanupScopeV1 = Readonly<{
  workspace_id: string;
  child_care_process_ref: string;
  family_ref: string;
  enrollment_ref: string;
  purpose: typeof NURTURE_FAMILY_SHARING_ELIGIBILITY_PURPOSE;
  categories: readonly ("media" | "focus_collaboration")[];
}>;

export type NurtureFamilySharingCleanupStoreReceiptV1 = Readonly<{
  store_ref: string;
  store_version: number;
  disposition: "purged" | "already_absent";
}>;

export type NurtureFamilySharingDerivedStoreCleanupOwnerV1 = Readonly<{
  store_ref: string;
  purge(
    input: NurtureFamilySharingCleanupScopeV1,
  ): Promise<NurtureFamilySharingCleanupStoreReceiptV1>;
}>;

export type NurtureFamilySharingCleanupReceiptV1 = Readonly<{
  receipt_version: 1;
  cleanup_receipt_ref: string;
  cleanup_command_ref: string;
  request_fingerprint: string;
  categories: readonly ("media" | "focus_collaboration")[];
  store_receipts: readonly NurtureFamilySharingCleanupStoreReceiptV1[];
  completed_at: string;
}>;

export type NurtureFamilySharingCleanupLedgerCommitV1 =
  | Readonly<{
      status: "committed" | "replayed";
      receipt: NurtureFamilySharingCleanupReceiptV1;
    }>
  | Readonly<{ status: "conflict" | "unavailable" }>;

export type NurtureFamilySharingCleanupLedgerV1 = Readonly<{
  /**
   * Serializes one workspace + cleanup-command key before `operation` runs.
   * A lock loser, exact-key fingerprint mismatch or stored-receipt defect
   * MUST return without invoking the callback. The callback is restricted to
   * bounded Nurture-local, idempotent purge owners; it MUST NOT call remote
   * services. A callback may complete before a later transaction failure, so
   * response-loss/rollback retry safety still depends on purge idempotency.
   */
  executeExclusive(input: {
    workspace_id: string;
    cleanup_command_ref: string;
    request_fingerprint: string;
    child_care_process_ref: string;
    invocation_request_ref: string;
    service_ref: string;
    operation(): Promise<
      | Readonly<{
          status: "ready";
          receipt: NurtureFamilySharingCleanupReceiptV1;
        }>
      | Readonly<{ status: "unavailable" }>
    >;
  }): Promise<NurtureFamilySharingCleanupLedgerCommitV1>;
}>;

export type NurtureFamilySharingCleanupResultV1 =
  | Readonly<{
      status: "cleaned";
      disposition: "executed" | "replayed";
      cleanup_receipt_ref: string;
      cleanup_command_ref: string;
      categories: readonly ("media" | "focus_collaboration")[];
      purged_store_count: number;
      completed_at: string;
    }>
  | Readonly<{ status: "unavailable" }>;

export class NurtureFamilySharingCleanupOwner {
  private readonly stores: readonly NurtureFamilySharingDerivedStoreCleanupOwnerV1[];

  constructor(
    private readonly ledger: NurtureFamilySharingCleanupLedgerV1,
    stores: readonly NurtureFamilySharingDerivedStoreCleanupOwnerV1[],
    private readonly now: () => Date = () => new Date(),
  ) {
    const ordered = [...stores].sort((left, right) =>
      left.store_ref.localeCompare(right.store_ref),
    );
    if (
      ordered.length === 0 ||
      ordered.some(
        (store, index) =>
          !isOpaque(store.store_ref) ||
          (index > 0 && store.store_ref === ordered[index - 1]?.store_ref),
      )
    ) {
      throw new Error("A unique explicit cleanup owner registry is required.");
    }
    this.stores = Object.freeze(ordered);
  }

  async cleanup(input: {
    invocation_request_ref: string;
    service_ref: string;
    request: NurtureFamilySharingResolvedCleanupRequestV1;
  }): Promise<NurtureFamilySharingCleanupResultV1> {
    const parsed = input.request.wire;
    const localPair = input.request.local_pair;
    if (
      !parseCleanupInput(parsed) ||
      !parseLocalPair(localPair) ||
      !isOpaque(input.invocation_request_ref) ||
      !isOpaque(input.service_ref)
    ) {
      return { status: "unavailable" };
    }
    const fingerprint = cleanupFingerprint(parsed, localPair);
    try {
      const completed = await this.ledger.executeExclusive({
        workspace_id: localPair.workspace_id,
        cleanup_command_ref: parsed.cleanup_command_ref,
        request_fingerprint: fingerprint,
        child_care_process_ref: localPair.child_care_process_ref,
        invocation_request_ref: input.invocation_request_ref,
        service_ref: input.service_ref,
        operation: async () => {
          const scope = cleanupScope(parsed, localPair);
          const storeReceipts: NurtureFamilySharingCleanupStoreReceiptV1[] = [];
          for (const store of this.stores) {
            const storeReceipt = await store.purge(scope);
            if (
              storeReceipt.store_ref !== store.store_ref ||
              !positiveVersion(storeReceipt.store_version) ||
              (storeReceipt.disposition !== "purged" &&
                storeReceipt.disposition !== "already_absent")
            ) return { status: "unavailable" };
            storeReceipts.push(storeReceipt);
          }
          const completedAt = this.now();
          if (!validDate(completedAt)) return { status: "unavailable" };
          return {
            status: "ready",
            receipt: {
              receipt_version: 1,
              cleanup_receipt_ref: `cleanup.v1.${nurtureSha256Hex(
                nurtureCanonicalJsonBytes({
                  cleanup_command_ref: parsed.cleanup_command_ref,
                  request_fingerprint: fingerprint,
                }),
              )}`,
              cleanup_command_ref: parsed.cleanup_command_ref,
              request_fingerprint: fingerprint,
              categories: parsed.categories,
              store_receipts: storeReceipts,
              completed_at: completedAt.toISOString(),
            },
          };
        },
      });
      if (
        (completed.status === "committed" || completed.status === "replayed") &&
        validCleanupReceipt(
          completed.receipt,
          parsed,
          fingerprint,
          this.stores,
        )
      ) {
        return cleanupResult(
          completed.receipt,
          completed.status === "committed" ? "executed" : "replayed",
        );
      }
      return { status: "unavailable" };
    } catch {
      return { status: "unavailable" };
    }
  }
}

/**
 * Explicit owner for the current production truth: no Nurture-derived
 * family-input media/focus store is registered. It is not a wildcard purge
 * and must be replaced/augmented before any derived store can activate.
 */
export const NURTURE_NO_DERIVED_FAMILY_SHARING_STORE_OWNER:
NurtureFamilySharingDerivedStoreCleanupOwnerV1 = {
  store_ref: "nurture.family-sharing.no-derived-store-v1",
  purge: async (): Promise<NurtureFamilySharingCleanupStoreReceiptV1> => ({
    store_ref: "nurture.family-sharing.no-derived-store-v1",
    store_version: 1,
    disposition: "already_absent",
  }),
};

export function parseEligibilityPrivateInput(
  value: unknown,
): NurtureFamilySharingEligibilityPrivateInputV1 | null {
  if (
    !isRecord(value) ||
    !exactKeys(value, [
      "interface_contract",
      "pair_evidence",
      "purpose",
      "target",
    ]) ||
    !exactContract(
      value.interface_contract,
      NURTURE_FAMILY_SHARING_ELIGIBILITY_INTERFACE,
    ) ||
    value.purpose !== NURTURE_FAMILY_SHARING_ELIGIBILITY_PURPOSE
  ) return null;
  const pairEvidence = parsePairEvidence(value.pair_evidence);
  const target = parseTarget(value.target, pairEvidence);
  if (!pairEvidence || !target) return null;
  return {
    interface_contract: NURTURE_FAMILY_SHARING_ELIGIBILITY_INTERFACE,
    purpose: NURTURE_FAMILY_SHARING_ELIGIBILITY_PURPOSE,
    pair_evidence: pairEvidence,
    target,
  };
}

export function parseCleanupInput(
  value: unknown,
): NurtureFamilySharingCleanupPrivateInputV1 | null {
  if (
    !isRecord(value) ||
    !exactKeys(value, [
      "categories",
      "cleanup_command_ref",
      "cleanup_contract",
      "pair_evidence",
      "purpose",
      "target",
    ]) ||
    !exactContract(value.cleanup_contract, NURTURE_FAMILY_SHARING_CLEANUP_CONTRACT) ||
    !isOpaque(value.cleanup_command_ref) ||
    value.purpose !== NURTURE_FAMILY_SHARING_ELIGIBILITY_PURPOSE ||
    !Array.isArray(value.categories) ||
    value.categories.length === 0 ||
    value.categories.length > 2 ||
    value.categories.some(
      (category) => category !== "media" && category !== "focus_collaboration",
    ) ||
    new Set(value.categories).size !== value.categories.length
  ) return null;
  const pairEvidence = parsePairEvidence(value.pair_evidence);
  const target = parseTarget(value.target, pairEvidence);
  if (!pairEvidence || !target) return null;
  const categories = [...value.categories].sort() as (
    | "media"
    | "focus_collaboration"
  )[];
  return {
    cleanup_contract: NURTURE_FAMILY_SHARING_CLEANUP_CONTRACT,
    cleanup_command_ref: value.cleanup_command_ref,
    purpose: NURTURE_FAMILY_SHARING_ELIGIBILITY_PURPOSE,
    categories,
    pair_evidence: pairEvidence,
    target,
  };
}

export function toCurrentAuthorityInput(input: {
  service_principal: NurtureFamilySharingVerifiedServicePrincipalV1;
  request: NurtureFamilySharingEligibilityPrivateInputV1;
  local_pair: NurtureFamilySharingResolvedLocalPairV1;
  evaluated_at: string;
}): NurtureFamilySharingCurrentAuthorityReadInputV1 {
  return {
    principal: input.service_principal,
    pair_evidence: verifiedPairEvidence(input.request.pair_evidence),
    local_pair: input.local_pair,
    target: verifiedTarget(input.request.target),
    purpose: NURTURE_FAMILY_SHARING_ELIGIBILITY_PURPOSE,
    evaluated_at: input.evaluated_at,
  };
}

export async function readFamilySharingEligibility(input: {
  authority: NurtureFamilySharingCurrentAuthorityReadPortV1;
  service_principal: NurtureFamilySharingVerifiedServicePrincipalV1;
  request: NurtureFamilySharingEligibilityPrivateInputV1;
  local_pair: NurtureFamilySharingResolvedLocalPairV1;
  evaluated_at: string;
}): Promise<NurtureFamilySharingEligibilityResultV1> {
  try {
    const current = await input.authority.loadCurrent(toCurrentAuthorityInput(input));
    if (current.status !== "resolved" || !validFacts(current.categories)) {
      return { status: "unavailable" };
    }
    return {
      status: "resolved",
      contract: NURTURE_FAMILY_SHARING_ELIGIBILITY_INTERFACE,
      purpose: NURTURE_FAMILY_SHARING_ELIGIBILITY_PURPOSE,
      authority_version: current.authority_version,
      evaluated_at: input.evaluated_at,
      categories: current.categories.map((facts) => ({
        category_key: facts.category_key,
        direction: facts.direction,
        eligibility:
          facts.role_authorized &&
          facts.grant_authorized &&
          facts.release_authorized &&
          facts.receiving_authorized &&
          facts.source_lifecycle === "active" &&
          facts.destination_lifecycle === "active"
            ? "eligible"
            : "ineligible",
        source_lifecycle: facts.source_lifecycle,
        destination_lifecycle: facts.destination_lifecycle,
      })),
    };
  } catch {
    return { status: "unavailable" };
  }
}

function parsePairEvidence(
  value: unknown,
): NurtureFamilySharingWirePairEvidenceV1 | null {
  if (
    !isRecord(value) ||
    !exactKeys(value, [
      "child_anchor_ref",
      "child_owner_version",
      "evidence_ref",
      "evidence_version",
      "expires_at",
      "family_anchor_ref",
      "family_owner_version",
      "my_chat_family_lifecycle",
      "verified_at",
    ]) ||
    !isOpaque(value.evidence_ref) ||
    !positiveVersion(value.evidence_version) ||
    !canonicalInstant(value.verified_at) ||
    !canonicalInstant(value.expires_at) ||
    !isOpaque(value.child_anchor_ref) ||
    !positiveVersion(value.child_owner_version) ||
    !isOpaque(value.family_anchor_ref) ||
    !positiveVersion(value.family_owner_version) ||
    (value.my_chat_family_lifecycle !== "active" &&
      value.my_chat_family_lifecycle !== "inactive")
  ) return null;
  return value as NurtureFamilySharingWirePairEvidenceV1;
}

function parseLocalPair(value: unknown): NurtureFamilySharingResolvedLocalPairV1 | null {
  if (
    !isRecord(value) ||
    !exactKeys(value, [
      "child_association_ref",
      "child_care_process_ref",
      "child_ref",
      "family_association_ref",
      "family_ref",
      "workspace_id",
    ]) ||
    Object.values(value).some((item) => !isOpaque(item))
  ) return null;
  return value as NurtureFamilySharingResolvedLocalPairV1;
}

function parseTarget(
  value: unknown,
  pairEvidence: NurtureFamilySharingWirePairEvidenceV1 | null,
): NurtureFamilySharingWireTargetV1 | null {
  if (
    !pairEvidence ||
    !isRecord(value) ||
    !exactKeys(value, [
      "enrollment_ref",
      "enrollment_revision",
      "pair_evidence_ref",
      "pair_evidence_version",
      "target_kind",
    ]) ||
    value.pair_evidence_ref !== pairEvidence.evidence_ref ||
    value.pair_evidence_version !== pairEvidence.evidence_version ||
    value.target_kind !== "enrollment" ||
    !isOpaque(value.enrollment_ref) ||
    !nonNegativeVersion(value.enrollment_revision)
  ) return null;
  return value as NurtureFamilySharingWireTargetV1;
}

function verifiedPairEvidence(
  value: NurtureFamilySharingWirePairEvidenceV1,
): NurtureFamilySharingVerifiedCurrentPairEvidenceV1 {
  return { verification: "verified_current_pair_evidence", ...value };
}

function verifiedTarget(
  value: NurtureFamilySharingWireTargetV1,
): NurtureFamilySharingExactTargetSelectorV1 {
  return { verification: "verified_exact_target_selector", ...value };
}

function cleanupScope(
  request: NurtureFamilySharingCleanupPrivateInputV1,
  localPair: NurtureFamilySharingResolvedLocalPairV1,
): NurtureFamilySharingCleanupScopeV1 {
  return {
    workspace_id: localPair.workspace_id,
    child_care_process_ref: localPair.child_care_process_ref,
    family_ref: localPair.family_ref,
    enrollment_ref: request.target.enrollment_ref,
    purpose: request.purpose,
    categories: request.categories,
  };
}

function cleanupFingerprint(
  request: NurtureFamilySharingCleanupPrivateInputV1,
  localPair: NurtureFamilySharingResolvedLocalPairV1,
): string {
  return nurtureSha256Hex(
    nurtureCanonicalJsonBytes({
      cleanup_contract: request.cleanup_contract,
      cleanup_command_ref: request.cleanup_command_ref,
      purpose: request.purpose,
      categories: request.categories,
      pair_evidence: request.pair_evidence,
      local_pair: localPair,
      target: request.target,
    }),
  );
}

function cleanupResult(
  receipt: NurtureFamilySharingCleanupReceiptV1,
  disposition: "executed" | "replayed",
): NurtureFamilySharingCleanupResultV1 {
  return {
    status: "cleaned",
    disposition,
    cleanup_receipt_ref: receipt.cleanup_receipt_ref,
    cleanup_command_ref: receipt.cleanup_command_ref,
    categories: receipt.categories,
    purged_store_count: receipt.store_receipts.filter(
      (item) => item.disposition === "purged",
    ).length,
    completed_at: receipt.completed_at,
  };
}

function validCleanupReceipt(
  value: unknown,
  request: NurtureFamilySharingCleanupPrivateInputV1,
  fingerprint: string,
  stores: readonly NurtureFamilySharingDerivedStoreCleanupOwnerV1[],
): value is NurtureFamilySharingCleanupReceiptV1 {
  if (
    !isRecord(value) ||
    !exactKeys(value, [
      "categories",
      "cleanup_command_ref",
      "cleanup_receipt_ref",
      "completed_at",
      "receipt_version",
      "request_fingerprint",
      "store_receipts",
    ]) ||
    value.receipt_version !== 1 ||
    value.cleanup_command_ref !== request.cleanup_command_ref ||
    value.request_fingerprint !== fingerprint ||
    value.cleanup_receipt_ref !== `cleanup.v1.${nurtureSha256Hex(
      nurtureCanonicalJsonBytes({
        cleanup_command_ref: request.cleanup_command_ref,
        request_fingerprint: fingerprint,
      }),
    )}` ||
    !canonicalInstant(value.completed_at) ||
    !Array.isArray(value.categories) ||
    JSON.stringify(value.categories) !== JSON.stringify(request.categories) ||
    !Array.isArray(value.store_receipts) ||
    value.store_receipts.length !== stores.length
  ) return false;

  return value.store_receipts.every((receipt, index) => {
    const store = stores[index];
    return store !== undefined && isRecord(receipt) &&
      exactKeys(receipt, ["disposition", "store_ref", "store_version"]) &&
      receipt.store_ref === store.store_ref &&
      positiveVersion(receipt.store_version) &&
      (receipt.disposition === "purged" ||
        receipt.disposition === "already_absent");
  });
}

function validFacts(
  facts: readonly NurtureFamilySharingAuthorityCategoryFactsV1[],
): boolean {
  return (
    facts.length === NURTURE_FAMILY_SHARING_CATEGORIES.length &&
    facts.every((item, index) => {
      const category = NURTURE_FAMILY_SHARING_CATEGORIES[index];
      return (
        category !== undefined &&
        item.category_key === category &&
        item.direction === NURTURE_FAMILY_SHARING_DIRECTION_BY_CATEGORY[category]
      );
    })
  );
}

function exactContract(value: unknown, expected: object): boolean {
  return isRecord(value) && JSON.stringify(value) === JSON.stringify(expected);
}

function exactKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  return (
    keys.every((key) => key in value) &&
    Object.keys(value).every((key) => keys.includes(key))
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isOpaque(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9][A-Za-z0-9._:~-]{0,199}$/u.test(value);
}

function positiveVersion(value: unknown): value is number {
  return Number.isSafeInteger(value) && Number(value) > 0;
}

function nonNegativeVersion(value: unknown): value is number {
  return Number.isSafeInteger(value) && Number(value) >= 0;
}

function canonicalInstant(value: unknown): Date | null {
  if (typeof value !== "string") return null;
  const parsed = new Date(value);
  return validDate(parsed) && parsed.toISOString() === value ? parsed : null;
}

function validDate(value: Date): boolean {
  return Number.isFinite(value.getTime());
}

export function familySharingCleanupContractDigest(): string {
  return `sha256:${createHash("sha256")
    .update(
      JSON.stringify({
        key: NURTURE_FAMILY_SHARING_CLEANUP_CONTRACT.key,
        version: NURTURE_FAMILY_SHARING_CLEANUP_CONTRACT.version,
        categories: ["focus_collaboration", "media"],
        owner: "nurture",
        purpose: NURTURE_FAMILY_SHARING_ELIGIBILITY_PURPOSE,
        response_fields: [
          "categories",
          "cleanup_command_ref",
          "cleanup_receipt_ref",
          "completed_at",
          "disposition",
          "purged_store_count",
          "status",
        ],
      }),
      "utf8",
    )
    .digest("hex")}`;
}

if (
  familySharingCleanupContractDigest() !==
  NURTURE_FAMILY_SHARING_CLEANUP_CONTRACT.digest
) {
  throw new Error("Family-sharing cleanup contract changed without digest rotation.");
}
