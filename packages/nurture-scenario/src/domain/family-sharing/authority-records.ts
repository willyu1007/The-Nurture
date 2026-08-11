import type {
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
 * never chooses a winner. "Current" means status `active` and `expires_at`
 * absent or after `evaluated_at`. Results are never cached (`cache:
 * "forbidden"` in the frozen interface).
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
