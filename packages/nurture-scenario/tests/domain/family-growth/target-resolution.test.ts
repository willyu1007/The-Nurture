import { describe, expect, it } from "vitest";
import {
  resolveFamilyGrowthTargetV1,
  type FamilyGrowthBindingSnapshotV1,
  type FamilyGrowthCanonicalExchangePort,
  type FamilyGrowthTargetInputV1,
} from "../../../src/domain/family-growth/target-resolution.js";

const NOW = new Date("2026-08-07T08:00:00.000Z");

const input: FamilyGrowthTargetInputV1 = {
  workspaceId: "ws-1",
  childCareProcessId: "process-1",
  localFamilyId: "family-1",
};

const healthySnapshot = (): FamilyGrowthBindingSnapshotV1 => ({
  workspaceId: "ws-1",
  localFamilyId: "family-1",
  childCareProcessId: "process-1",
  childAnchor: {
    anchorId: "child-anchor-1",
    aggregateVersion: 3,
    status: "associated",
    ownerRef: "nurture_child_binding_anchor_v1:child-anchor-1",
  },
  familyAnchor: {
    anchorId: "family-anchor-1",
    aggregateVersion: 4,
    status: "associated",
    ownerRef: "nurture_family_binding_anchor_v1:family-anchor-1",
  },
  childAssociation: {
    associationId: "child-association-1",
    aggregateVersion: 5,
    status: "active",
    currentKey: "current",
  },
  familyAssociation: {
    associationId: "family-association-1",
    aggregateVersion: 6,
    status: "active",
    currentKey: "current",
  },
  childAuthorization: {
    authorizationId: "child-authorization-1",
    aggregateVersion: 7,
    status: "active",
    ownerRef: "nurture_child_binding_anchor_v1:child-anchor-1",
    ownerVersion: 3,
    purpose: "scenario_binding_write",
    authorizationSourceRef: "nurture-care-role:guardian-role-1",
    authorizationSourceVersion: 9,
    expiresAt: new Date("2026-08-08T00:00:00.000Z"),
    guardianRole: {
      roleAssignmentId: "guardian-role-1",
      participantId: "guardian-1",
      aggregateVersion: 9,
      status: "active",
      role: "guardian",
      startsAt: new Date("2026-01-01T00:00:00.000Z"),
      endsAt: null,
      deletedAt: null,
    },
    participant: {
      participantId: "guardian-1",
      aggregateVersion: 10,
      status: "active",
      deletedAt: null,
    },
  },
  familyAuthorization: {
    authorizationId: "family-authorization-1",
    aggregateVersion: 8,
    status: "active",
    ownerRef: "nurture_family_binding_anchor_v1:family-anchor-1",
    ownerVersion: 4,
    purpose: "scenario_binding_write",
    authorizationSourceRef: "nurture-care-role:guardian-role-1",
    authorizationSourceVersion: 9,
    expiresAt: new Date("2026-08-08T00:00:00.000Z"),
    guardianRole: {
      roleAssignmentId: "guardian-role-1",
      participantId: "guardian-1",
      aggregateVersion: 9,
      status: "active",
      role: "guardian",
      startsAt: new Date("2026-01-01T00:00:00.000Z"),
      endsAt: null,
      deletedAt: null,
    },
    participant: {
      participantId: "guardian-1",
      aggregateVersion: 10,
      status: "active",
      deletedAt: null,
    },
  },
});

const exchangeOk: FamilyGrowthCanonicalExchangePort = {
  exchange: async () => ({
    status: "exchanged",
    childId: "mc-child-1",
    familyId: "mc-family-1",
    ownerEvidenceExpiresAt: "2026-08-07T09:00:00.000Z",
  }),
};

const ports = (
  snapshot: FamilyGrowthBindingSnapshotV1 | null,
  exchange: FamilyGrowthCanonicalExchangePort = exchangeOk,
) => ({
  binding: { loadCurrentBinding: async () => snapshot },
  canonicalExchange: exchange,
});

const expectDeny = async (
  snapshot: FamilyGrowthBindingSnapshotV1 | null,
  reason: string,
  exchange?: FamilyGrowthCanonicalExchangePort,
) => {
  const result = await resolveFamilyGrowthTargetV1(ports(snapshot, exchange), input, NOW);
  expect(result).toEqual({ status: "denied", reason });
};

describe("resolveFamilyGrowthTargetV1", () => {
  it("resolves a fully healthy chain and reports exact local heads", async () => {
    const result = await resolveFamilyGrowthTargetV1(ports(healthySnapshot()), input, NOW);
    expect(result).toEqual({
      status: "resolved",
      target: { child_id: "mc-child-1", family_id: "mc-family-1" },
      evidence: {
        canonicalTarget: { child_id: "mc-child-1", family_id: "mc-family-1" },
        workspaceId: "ws-1",
        localFamilyId: "family-1",
        childCareProcessId: "process-1",
        childAnchor: { anchorId: "child-anchor-1", aggregateVersion: 3 },
        familyAnchor: { anchorId: "family-anchor-1", aggregateVersion: 4 },
        childAssociation: { associationId: "child-association-1", aggregateVersion: 5 },
        familyAssociation: { associationId: "family-association-1", aggregateVersion: 6 },
        childAuthorization: {
          authorizationId: "child-authorization-1",
          aggregateVersion: 7,
          expiresAt: "2026-08-08T00:00:00.000Z",
          ownerRef: "nurture_child_binding_anchor_v1:child-anchor-1",
          ownerVersion: 3,
          purpose: "scenario_binding_write",
          authorizationSourceRef: "nurture-care-role:guardian-role-1",
          authorizationSourceVersion: 9,
          guardianRole: {
            roleAssignmentId: "guardian-role-1",
            participantId: "guardian-1",
            aggregateVersion: 9,
            status: "active",
            role: "guardian",
            startsAt: "2026-01-01T00:00:00.000Z",
            endsAt: null,
          },
          participant: {
            participantId: "guardian-1",
            aggregateVersion: 10,
            status: "active",
          },
        },
        familyAuthorization: {
          authorizationId: "family-authorization-1",
          aggregateVersion: 8,
          expiresAt: "2026-08-08T00:00:00.000Z",
          ownerRef: "nurture_family_binding_anchor_v1:family-anchor-1",
          ownerVersion: 4,
          purpose: "scenario_binding_write",
          authorizationSourceRef: "nurture-care-role:guardian-role-1",
          authorizationSourceVersion: 9,
          guardianRole: {
            roleAssignmentId: "guardian-role-1",
            participantId: "guardian-1",
            aggregateVersion: 9,
            status: "active",
            role: "guardian",
            startsAt: "2026-01-01T00:00:00.000Z",
            endsAt: null,
          },
          participant: {
            participantId: "guardian-1",
            aggregateVersion: 10,
            status: "active",
          },
        },
        canonicalOwnerEvidenceExpiresAt: "2026-08-07T09:00:00.000Z",
      },
    });
  });

  it("denies when no binding exists", async () => {
    await expectDeny(null, "binding_missing");
  });

  it("denies a workspace mismatch before anything else", async () => {
    await expectDeny({ ...healthySnapshot(), workspaceId: "ws-2" }, "workspace_mismatch");
  });

  it("denies when the binding belongs to a different local family or process", async () => {
    await expectDeny({ ...healthySnapshot(), localFamilyId: "family-2" }, "target_mismatch");
    await expectDeny(
      { ...healthySnapshot(), childCareProcessId: "process-2" },
      "target_mismatch",
    );
  });

  it("denies non-current associations, child before family", async () => {
    await expectDeny(
      {
        ...healthySnapshot(),
        childAssociation: {
          ...healthySnapshot().childAssociation,
          status: "revoked",
          currentKey: null,
        },
      },
      "child_association_not_current",
    );
    await expectDeny(
      {
        ...healthySnapshot(),
        childAssociation: {
          ...healthySnapshot().childAssociation,
          status: "quarantined",
          currentKey: null,
        },
      },
      "child_association_not_current",
    );
    // An active-status row that lost its current marker is not current either.
    await expectDeny(
      {
        ...healthySnapshot(),
        childAssociation: { ...healthySnapshot().childAssociation, currentKey: null },
      },
      "child_association_not_current",
    );
    await expectDeny(
      {
        ...healthySnapshot(),
        familyAssociation: {
          ...healthySnapshot().familyAssociation,
          status: "revoked",
          currentKey: null,
        },
      },
      "family_association_not_current",
    );
  });

  it("denies anchors that are not in the associated state", async () => {
    for (const status of ["reserved", "bound_empty", "revoked", "quarantined", "retired"]) {
      await expectDeny(
        { ...healthySnapshot(), childAnchor: { ...healthySnapshot().childAnchor, status } },
        "child_anchor_not_associated",
      );
    }
    await expectDeny(
      { ...healthySnapshot(), familyAnchor: { ...healthySnapshot().familyAnchor, status: "revoked" } },
      "family_anchor_not_associated",
    );
  });

  it("denies missing, revoked and expired authorizations", async () => {
    await expectDeny({ ...healthySnapshot(), childAuthorization: null }, "authorization_missing");
    await expectDeny(
      {
        ...healthySnapshot(),
        familyAuthorization: { ...healthySnapshot().familyAuthorization!, status: "revoked" },
      },
      "authorization_revoked",
    );
    await expectDeny(
      {
        ...healthySnapshot(),
        childAuthorization: {
          ...healthySnapshot().childAuthorization!,
          expiresAt: new Date("2026-08-07T07:59:59.000Z"),
        },
      },
      "authorization_expired",
    );
    // Expiring exactly now is already expired: fail closed on the boundary.
    await expectDeny(
      {
        ...healthySnapshot(),
        familyAuthorization: { ...healthySnapshot().familyAuthorization!, expiresAt: NOW },
      },
      "authorization_expired",
    );
  });

  it("denies owner/provenance and current Guardian authority drift before exchange", async () => {
    await expectDeny(
      {
        ...healthySnapshot(),
        childAuthorization: {
          ...healthySnapshot().childAuthorization!,
          ownerVersion: 99,
        },
      },
      "authorization_provenance_invalid",
    );
    await expectDeny(
      {
        ...healthySnapshot(),
        familyAuthorization: {
          ...healthySnapshot().familyAuthorization!,
          participant: {
            ...healthySnapshot().familyAuthorization!.participant!,
            status: "suspended",
          },
        },
      },
      "authorization_provenance_invalid",
    );
  });

  it("denies when the owner exchange is unavailable or incomplete", async () => {
    await expectDeny(healthySnapshot(), "canonical_exchange_unavailable", {
      exchange: async () => ({ status: "unavailable" }),
    });
    await expectDeny(healthySnapshot(), "canonical_identity_incomplete", {
      exchange: async () => ({
        status: "exchanged",
        childId: "mc-child-1",
        familyId: "",
        ownerEvidenceExpiresAt: "2026-08-07T09:00:00.000Z",
      }),
    });
    await expectDeny(healthySnapshot(), "owner_evidence_expired", {
      exchange: async () => ({
        status: "exchanged",
        childId: "mc-child-1",
        familyId: "mc-family-1",
      }) as Awaited<ReturnType<FamilyGrowthCanonicalExchangePort["exchange"]>>,
    });
    await expectDeny(healthySnapshot(), "owner_evidence_expired", {
      exchange: async () => ({
        status: "exchanged",
        childId: "mc-child-1",
        familyId: "mc-family-1",
        ownerEvidenceExpiresAt: NOW.toISOString(),
      }),
    });
  });

  it("carries a canonical owner-evidence expiry into the commit heads", async () => {
    const result = await resolveFamilyGrowthTargetV1(
      ports(healthySnapshot(), {
        exchange: async () => ({
          status: "exchanged",
          childId: "mc-child-1",
          familyId: "mc-family-1",
          ownerEvidenceExpiresAt: "2026-08-07T09:00:00.000Z",
        }),
      }),
      input,
      NOW,
    );
    expect(result.status).toBe("resolved");
    if (result.status !== "resolved") return;
    expect(result.evidence.canonicalOwnerEvidenceExpiresAt).toBe(
      "2026-08-07T09:00:00.000Z",
    );
  });

  it("never calls the owner exchange for a locally denied chain", async () => {
    let called = false;
    const exchange: FamilyGrowthCanonicalExchangePort = {
      exchange: async () => {
        called = true;
        return {
          status: "exchanged",
          childId: "x",
          familyId: "y",
          ownerEvidenceExpiresAt: "2026-08-07T09:00:00.000Z",
        };
      },
    };
    await expectDeny(
      { ...healthySnapshot(), childAuthorization: null },
      "authorization_missing",
      exchange,
    );
    expect(called).toBe(false);
  });
});
