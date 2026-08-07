import type { FamilyGrowthCanonicalTargetV1 } from "./envelope.js";

/**
 * Canonical target resolution (T-009 I4, requirement N1).
 *
 * Resolves one local publish target (workspace + child care process) to the
 * canonical My-Chat `child_id` + `family_id` through the authorized binding
 * chain. Every uncertain state fails closed: a missing, revoked, quarantined,
 * expired or ambiguous link denies the release rather than guessing.
 *
 * Two boundaries hold by construction:
 * - Resolution NEVER derives identity from PII (names, birth dates, contact
 *   data, school numbers, legacy Education data). The only inputs are the
 *   typed anchor associations and the owner exchange.
 * - The resolved canonical IDs are used at envelope-assembly time only. They
 *   are never persisted into Nurture business tables and never substitute
 *   for the release-authority checks the G3-D transaction performs.
 */

export type FamilyGrowthAnchorSnapshotV1 = {
  anchorId: string;
  /** `NurtureBindingAnchorStatus`; resolution requires `associated`. */
  status: string;
  /** Typed owner ref (`formatNurtureBindingOwnerRef`) for the owner exchange. */
  ownerRef: string;
};

export type FamilyGrowthAssociationSnapshotV1 = {
  /** `NurtureBindingAnchorAssociationStatus`; resolution requires `active`. */
  status: string;
  /** Non-null "current" marks the current row; revocation clears it. */
  currentKey: string | null;
};

export type FamilyGrowthAuthorizationSnapshotV1 = {
  /** `NurtureScenarioBindingAuthorizationStatus`. */
  status: string;
  expiresAt: Date;
};

export type FamilyGrowthBindingSnapshotV1 = {
  workspaceId: string;
  /** Local family the association binds; cross-checked against the target. */
  localFamilyId: string;
  childCareProcessId: string;
  childAnchor: FamilyGrowthAnchorSnapshotV1;
  familyAnchor: FamilyGrowthAnchorSnapshotV1;
  childAssociation: FamilyGrowthAssociationSnapshotV1;
  familyAssociation: FamilyGrowthAssociationSnapshotV1;
  /** Latest authorization per anchor; null when none was ever issued. */
  childAuthorization: FamilyGrowthAuthorizationSnapshotV1 | null;
  familyAuthorization: FamilyGrowthAuthorizationSnapshotV1 | null;
};

export type FamilyGrowthBindingReadPort = {
  /**
   * Load the current family-anchor association chain for one care process.
   * Returns null when no current association exists. Implementations must
   * key on the `currentKey = "current"` row only — historical or revoked
   * rows are not a binding.
   */
  loadCurrentBinding(input: {
    workspaceId: string;
    childCareProcessId: string;
  }): Promise<FamilyGrowthBindingSnapshotV1 | null>;
};

export type FamilyGrowthCanonicalExchangeResultV1 =
  | { status: "exchanged"; childId: string; familyId: string }
  | { status: "unavailable" };

export type FamilyGrowthCanonicalExchangePort = {
  /**
   * The owner reread: My-Chat verifies its own current binding for the typed
   * anchor refs and returns the canonical pair. Anything but a complete
   * success is `unavailable` — the port never partially resolves.
   */
  exchange(input: {
    workspaceId: string;
    childOwnerRef: string;
    familyOwnerRef: string;
  }): Promise<FamilyGrowthCanonicalExchangeResultV1>;
};

export type FamilyGrowthTargetDenyReasonV1 =
  | "binding_missing"
  | "workspace_mismatch"
  | "target_mismatch"
  | "child_association_not_current"
  | "family_association_not_current"
  | "child_anchor_not_associated"
  | "family_anchor_not_associated"
  | "authorization_missing"
  | "authorization_revoked"
  | "authorization_expired"
  | "canonical_exchange_unavailable"
  | "canonical_identity_incomplete";

export type FamilyGrowthTargetResolutionV1 =
  | {
      status: "resolved";
      target: FamilyGrowthCanonicalTargetV1;
      /** Evidence for audit logs; carries anchor ids only, never canonical IDs. */
      evidence: { childAnchorId: string; familyAnchorId: string };
    }
  | { status: "denied"; reason: FamilyGrowthTargetDenyReasonV1 };

export type FamilyGrowthTargetInputV1 = {
  workspaceId: string;
  childCareProcessId: string;
  /** The publish target's local family; a mismatch denies (wrong-family guard). */
  localFamilyId: string;
};

const associationCurrent = (association: FamilyGrowthAssociationSnapshotV1): boolean =>
  association.status === "active" && association.currentKey === "current";

const authorizationDeny = (
  authorization: FamilyGrowthAuthorizationSnapshotV1 | null,
  now: Date,
): FamilyGrowthTargetDenyReasonV1 | null => {
  if (!authorization) return "authorization_missing";
  if (authorization.status !== "active") return "authorization_revoked";
  if (authorization.expiresAt.getTime() <= now.getTime()) return "authorization_expired";
  return null;
};

export const resolveFamilyGrowthTargetV1 = async (
  ports: {
    binding: FamilyGrowthBindingReadPort;
    canonicalExchange: FamilyGrowthCanonicalExchangePort;
  },
  input: FamilyGrowthTargetInputV1,
  now: Date,
): Promise<FamilyGrowthTargetResolutionV1> => {
  const binding = await ports.binding.loadCurrentBinding({
    workspaceId: input.workspaceId,
    childCareProcessId: input.childCareProcessId,
  });
  if (!binding) return { status: "denied", reason: "binding_missing" };
  if (binding.workspaceId !== input.workspaceId) {
    return { status: "denied", reason: "workspace_mismatch" };
  }
  if (
    binding.localFamilyId !== input.localFamilyId ||
    binding.childCareProcessId !== input.childCareProcessId
  ) {
    return { status: "denied", reason: "target_mismatch" };
  }
  if (!associationCurrent(binding.childAssociation)) {
    return { status: "denied", reason: "child_association_not_current" };
  }
  if (!associationCurrent(binding.familyAssociation)) {
    return { status: "denied", reason: "family_association_not_current" };
  }
  if (binding.childAnchor.status !== "associated") {
    return { status: "denied", reason: "child_anchor_not_associated" };
  }
  if (binding.familyAnchor.status !== "associated") {
    return { status: "denied", reason: "family_anchor_not_associated" };
  }
  for (const authorization of [binding.childAuthorization, binding.familyAuthorization]) {
    const deny = authorizationDeny(authorization, now);
    if (deny) return { status: "denied", reason: deny };
  }

  const exchange = await ports.canonicalExchange.exchange({
    workspaceId: input.workspaceId,
    childOwnerRef: binding.childAnchor.ownerRef,
    familyOwnerRef: binding.familyAnchor.ownerRef,
  });
  if (exchange.status !== "exchanged") {
    return { status: "denied", reason: "canonical_exchange_unavailable" };
  }
  if (!exchange.childId || !exchange.familyId) {
    return { status: "denied", reason: "canonical_identity_incomplete" };
  }

  return {
    status: "resolved",
    target: { child_id: exchange.childId, family_id: exchange.familyId },
    evidence: {
      childAnchorId: binding.childAnchor.anchorId,
      familyAnchorId: binding.familyAnchor.anchorId,
    },
  };
};
