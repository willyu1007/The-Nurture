import type {
  NurtureFamilySharingAuthorityCategoryFactsV1,
  NurtureFamilySharingCategory,
  NurtureFamilySharingDirection,
} from "../../harness/family-sharing-eligibility.js";

export type NurtureFamilySharingPolicyAxisV1 = "release" | "receiving";

/**
 * Expiry is temporal (`expires_at`), never a stored status: writers revoke or
 * supersede, and readers treat a past-expiry `active` row as not current.
 */
export type NurtureFamilySharingRecordStatusV1 =
  | "active"
  | "revoked"
  | "superseded";

/** The exact workspace-local pair plus the selected current enrollment. */
export type NurtureFamilySharingPairScopeV1 = Readonly<{
  workspace_id: string;
  child_care_process_id: string;
  family_id: string;
  enrollment_id: string;
}>;

export type NurtureFamilySharingAuthorityRecordV1 = Readonly<{
  scope: NurtureFamilySharingPairScopeV1;
  category: NurtureFamilySharingCategory;
  direction: NurtureFamilySharingDirection;
  purpose: "family_nurture_sharing_authorization";
  status: NurtureFamilySharingRecordStatusV1;
  effective_from: string;
  expires_at: string | null;
  revoked_at: string | null;
  authorizing_role: string;
  authorizing_role_assignment_ref: string;
  authority_version: number;
}>;

export type NurtureFamilySharingPolicyRecordV1 = Readonly<{
  scope: NurtureFamilySharingPairScopeV1;
  category: NurtureFamilySharingCategory;
  direction: NurtureFamilySharingDirection;
  axis: NurtureFamilySharingPolicyAxisV1;
  purpose: "family_nurture_sharing_authorization";
  status: NurtureFamilySharingRecordStatusV1;
  effective_from: string;
  expires_at: string | null;
  revoked_at: string | null;
  authorizing_role: string;
  authorizing_role_assignment_ref: string;
  policy_version: number;
}>;

/**
 * Persistence-level read port for the C2 current-authority reader. Fail-closed
 * cardinality (D-I4C-02/03): implementations return `null` when zero — or, in
 * a defect state, more than one — current row matches; repository ordering
 * never chooses a winner. "Current" means status `active` AND
 * `effective_from <= evaluated_at` AND `expires_at` absent or strictly after
 * `evaluated_at` — a future-effective active row is not yet current. The
 * partial unique indexes guarantee at most one `active` slot per scope;
 * whether a temporally current row exists is this reader's decision, and a
 * granting writer retires the occupied slot (supersede/revoke, expired or
 * not) atomically before inserting. Results are never cached
 * (`cache: "forbidden"` in the frozen interface).
 */
export type NurtureFamilySharingAuthorityRecordReadPort = Readonly<{
  loadCurrentAuthority(input: {
    scope: NurtureFamilySharingPairScopeV1;
    category: NurtureFamilySharingCategory;
    evaluated_at: string;
  }): Promise<NurtureFamilySharingAuthorityRecordV1 | null>;
  loadCurrentPolicyPair(input: {
    scope: NurtureFamilySharingPairScopeV1;
    category: NurtureFamilySharingCategory;
    evaluated_at: string;
  }): Promise<
    Readonly<{
      release: NurtureFamilySharingPolicyRecordV1 | null;
      receiving: NurtureFamilySharingPolicyRecordV1 | null;
    }>
  >;
}>;

export const NURTURE_FAMILY_SHARING_AUTHORITY_READ_AUDIENCE =
  "nurture.family-sharing-eligibility" as const;

export const NURTURE_FAMILY_SHARING_AUTHORITY_READ_OPERATION =
  "read_current_authority" as const;

/**
 * C2 receives this object only after the private transport has authenticated
 * the calling service. The repository still checks every literal and version
 * so a structurally malformed or accidentally unverified context cannot reach
 * the database read.
 */
export type NurtureFamilySharingVerifiedServicePrincipalV1 = Readonly<{
  verification: "verified_service_principal";
  service_ref: string;
  trust_source_ref: string;
  trust_source_version: number;
  audience: typeof NURTURE_FAMILY_SHARING_AUTHORITY_READ_AUDIENCE;
  operation: typeof NURTURE_FAMILY_SHARING_AUTHORITY_READ_OPERATION;
}>;

/**
 * Signed My-Chat evidence is reduced to the minimum verified pair head needed
 * by Nurture. The local repository never receives raw platform Child, Family
 * or membership identifiers and never treats the evidence as local authority.
 */
export type NurtureFamilySharingVerifiedCurrentPairEvidenceV1 = Readonly<{
  verification: "verified_current_pair_evidence";
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

/** Exact local objects resolved from the typed Nurture binding anchors. */
export type NurtureFamilySharingResolvedLocalPairV1 = Readonly<{
  workspace_id: string;
  child_ref: string;
  child_care_process_ref: string;
  family_ref: string;
  child_association_ref: string;
  family_association_ref: string;
}>;

/** The signed target selector must name one exact local enrollment head. */
export type NurtureFamilySharingExactTargetSelectorV1 = Readonly<{
  verification: "verified_exact_target_selector";
  pair_evidence_ref: string;
  pair_evidence_version: number;
  target_kind: "enrollment";
  enrollment_ref: string;
  enrollment_revision: number;
}>;

export type NurtureFamilySharingCurrentAuthorityReadInputV1 = Readonly<{
  principal: NurtureFamilySharingVerifiedServicePrincipalV1;
  pair_evidence: NurtureFamilySharingVerifiedCurrentPairEvidenceV1;
  local_pair: NurtureFamilySharingResolvedLocalPairV1;
  target: NurtureFamilySharingExactTargetSelectorV1;
  purpose: "family_nurture_sharing_authorization";
  evaluated_at: string;
}>;

export type NurtureFamilySharingCurrentAuthorityReadResultV1 =
  | Readonly<{
      status: "resolved";
      authority_version: string;
      categories: readonly NurtureFamilySharingAuthorityCategoryFactsV1[];
    }>
  | Readonly<{ status: "unavailable" }>;

/**
 * Coherent C2 owner read. Implementations issue one current PostgreSQL
 * statement and return no diagnostic reason across this privacy boundary.
 */
export type NurtureFamilySharingCurrentAuthorityReadPortV1 = Readonly<{
  loadCurrent(
    input: NurtureFamilySharingCurrentAuthorityReadInputV1,
  ): Promise<NurtureFamilySharingCurrentAuthorityReadResultV1>;
}>;
