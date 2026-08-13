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
  aggregateVersion: number;
  /** `NurtureBindingAnchorStatus`; resolution requires `associated`. */
  status: string;
  /** Typed owner ref (`formatNurtureBindingOwnerRef`) for the owner exchange. */
  ownerRef: string;
};

export type FamilyGrowthAssociationSnapshotV1 = {
  associationId: string;
  aggregateVersion: number;
  /** `NurtureBindingAnchorAssociationStatus`; resolution requires `active`. */
  status: string;
  /** Non-null "current" marks the current row; revocation clears it. */
  currentKey: string | null;
};

export type FamilyGrowthAuthorizationSnapshotV1 = {
  authorizationId: string;
  aggregateVersion: number;
  /** `NurtureScenarioBindingAuthorizationStatus`. */
  status: string;
  ownerRef: string;
  ownerVersion: number;
  purpose: string;
  authorizationSourceRef: string;
  authorizationSourceVersion: number;
  expiresAt: Date;
  /** Exact local Guardian authority head behind the stored authorization. */
  guardianRole: {
    roleAssignmentId: string;
    participantId: string;
    aggregateVersion: number;
    status: string;
    role: string;
    startsAt: Date | null;
    endsAt: Date | null;
    deletedAt: Date | null;
  } | null;
  /** Participant head whose current state makes the Guardian role usable. */
  participant: {
    participantId: string;
    aggregateVersion: number;
    status: string;
    deletedAt: Date | null;
  } | null;
};

export type FamilyGrowthPreparedAuthorizationHeadV1 = {
  authorizationId: string;
  aggregateVersion: number;
  expiresAt: string;
  ownerRef: string;
  ownerVersion: number;
  purpose: string;
  authorizationSourceRef: string;
  authorizationSourceVersion: number;
  guardianRole: {
    roleAssignmentId: string;
    participantId: string;
    aggregateVersion: number;
    status: string;
    role: string;
    startsAt: string | null;
    endsAt: string | null;
  };
  participant: {
    participantId: string;
    aggregateVersion: number;
    status: string;
  };
};

/**
 * Exact local heads that justified a canonical target resolution. They are
 * internal commit evidence, never part of the provider wire envelope.
 */
export type FamilyGrowthResolvedLocalBindingHeadsV1 = {
  /** Canonical tuple returned by the same owner exchange as these heads. */
  canonicalTarget: FamilyGrowthCanonicalTargetV1;
  workspaceId: string;
  localFamilyId: string;
  childCareProcessId: string;
  childAnchor: { anchorId: string; aggregateVersion: number };
  familyAnchor: { anchorId: string; aggregateVersion: number };
  childAssociation: { associationId: string; aggregateVersion: number };
  familyAssociation: { associationId: string; aggregateVersion: number };
  childAuthorization: FamilyGrowthPreparedAuthorizationHeadV1;
  familyAuthorization: FamilyGrowthPreparedAuthorizationHeadV1;
  /** Required short-lived expiry returned by the canonical owner exchange. */
  canonicalOwnerEvidenceExpiresAt: string;
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
  | {
      status: "exchanged";
      childId: string;
      familyId: string;
      ownerEvidenceExpiresAt: string;
    }
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
  | "authorization_provenance_invalid"
  | "owner_evidence_expired"
  | "canonical_exchange_unavailable"
  | "canonical_identity_incomplete";

export type FamilyGrowthTargetResolutionV1 =
  | {
      status: "resolved";
      target: FamilyGrowthCanonicalTargetV1;
      /** Commit evidence binding the local heads to the canonical target. */
      evidence: FamilyGrowthResolvedLocalBindingHeadsV1;
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
  anchor: FamilyGrowthAnchorSnapshotV1,
  now: Date,
): FamilyGrowthTargetDenyReasonV1 | null => {
  if (!authorization) return "authorization_missing";
  if (authorization.status !== "active") return "authorization_revoked";
  if (authorization.expiresAt.getTime() <= now.getTime()) return "authorization_expired";
  const role = authorization.guardianRole;
  const participant = authorization.participant;
  if (
    authorization.ownerRef !== anchor.ownerRef
    || authorization.ownerVersion !== anchor.aggregateVersion
    || authorization.purpose !== "scenario_binding_write"
    || !role
    || !participant
    || authorization.authorizationSourceRef !== `nurture-care-role:${role.roleAssignmentId}`
    || authorization.authorizationSourceVersion !== role.aggregateVersion
    || role.participantId !== participant.participantId
    || role.role !== "guardian"
    || role.status !== "active"
    || role.deletedAt !== null
    || (role.startsAt !== null && role.startsAt > now)
    || (role.endsAt !== null && role.endsAt <= now)
    || participant.status !== "active"
    || participant.deletedAt !== null
  ) {
    return "authorization_provenance_invalid";
  }
  return null;
};

const preparedAuthorizationHead = (
  authorization: FamilyGrowthAuthorizationSnapshotV1,
): FamilyGrowthPreparedAuthorizationHeadV1 => {
  const role = authorization.guardianRole;
  const participant = authorization.participant;
  if (!role || !participant) {
    throw new Error("A resolved family-growth authorization must carry current provenance.");
  }
  return {
    authorizationId: authorization.authorizationId,
    aggregateVersion: authorization.aggregateVersion,
    expiresAt: authorization.expiresAt.toISOString(),
    ownerRef: authorization.ownerRef,
    ownerVersion: authorization.ownerVersion,
    purpose: authorization.purpose,
    authorizationSourceRef: authorization.authorizationSourceRef,
    authorizationSourceVersion: authorization.authorizationSourceVersion,
    guardianRole: {
      roleAssignmentId: role.roleAssignmentId,
      participantId: role.participantId,
      aggregateVersion: role.aggregateVersion,
      status: role.status,
      role: role.role,
      startsAt: role.startsAt?.toISOString() ?? null,
      endsAt: role.endsAt?.toISOString() ?? null,
    },
    participant: {
      participantId: participant.participantId,
      aggregateVersion: participant.aggregateVersion,
      status: participant.status,
    },
  };
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
  const childAuthorizationDeny = authorizationDeny(
    binding.childAuthorization,
    binding.childAnchor,
    now,
  );
  if (childAuthorizationDeny) return { status: "denied", reason: childAuthorizationDeny };
  const familyAuthorizationDeny = authorizationDeny(
    binding.familyAuthorization,
    binding.familyAnchor,
    now,
  );
  if (familyAuthorizationDeny) return { status: "denied", reason: familyAuthorizationDeny };

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
  const ownerEvidenceExpiresAt = new Date(exchange.ownerEvidenceExpiresAt);
  if (
    !Number.isFinite(ownerEvidenceExpiresAt.getTime())
    || ownerEvidenceExpiresAt <= now
  ) {
    return { status: "denied", reason: "owner_evidence_expired" };
  }

  const childAuthorization = binding.childAuthorization;
  const familyAuthorization = binding.familyAuthorization;
  if (!childAuthorization || !familyAuthorization) {
    return { status: "denied", reason: "authorization_missing" };
  }

  return {
    status: "resolved",
    target: { child_id: exchange.childId, family_id: exchange.familyId },
    evidence: {
      canonicalTarget: { child_id: exchange.childId, family_id: exchange.familyId },
      workspaceId: binding.workspaceId,
      localFamilyId: binding.localFamilyId,
      childCareProcessId: binding.childCareProcessId,
      childAnchor: {
        anchorId: binding.childAnchor.anchorId,
        aggregateVersion: binding.childAnchor.aggregateVersion,
      },
      familyAnchor: {
        anchorId: binding.familyAnchor.anchorId,
        aggregateVersion: binding.familyAnchor.aggregateVersion,
      },
      childAssociation: {
        associationId: binding.childAssociation.associationId,
        aggregateVersion: binding.childAssociation.aggregateVersion,
      },
      familyAssociation: {
        associationId: binding.familyAssociation.associationId,
        aggregateVersion: binding.familyAssociation.aggregateVersion,
      },
      childAuthorization: preparedAuthorizationHead(childAuthorization),
      familyAuthorization: preparedAuthorizationHead(familyAuthorization),
      canonicalOwnerEvidenceExpiresAt: ownerEvidenceExpiresAt.toISOString(),
    },
  };
};
