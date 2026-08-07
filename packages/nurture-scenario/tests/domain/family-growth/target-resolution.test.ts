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
    status: "associated",
    ownerRef: "nurture_child_binding_anchor_v1:child-anchor-1",
  },
  familyAnchor: {
    anchorId: "family-anchor-1",
    status: "associated",
    ownerRef: "nurture_family_binding_anchor_v1:family-anchor-1",
  },
  childAssociation: { status: "active", currentKey: "current" },
  familyAssociation: { status: "active", currentKey: "current" },
  childAuthorization: { status: "active", expiresAt: new Date("2026-08-08T00:00:00.000Z") },
  familyAuthorization: { status: "active", expiresAt: new Date("2026-08-08T00:00:00.000Z") },
});

const exchangeOk: FamilyGrowthCanonicalExchangePort = {
  exchange: async () => ({ status: "exchanged", childId: "mc-child-1", familyId: "mc-family-1" }),
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
  it("resolves a fully healthy chain and reports anchor evidence only", async () => {
    const result = await resolveFamilyGrowthTargetV1(ports(healthySnapshot()), input, NOW);
    expect(result).toEqual({
      status: "resolved",
      target: { child_id: "mc-child-1", family_id: "mc-family-1" },
      evidence: { childAnchorId: "child-anchor-1", familyAnchorId: "family-anchor-1" },
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
      { ...healthySnapshot(), childAssociation: { status: "revoked", currentKey: null } },
      "child_association_not_current",
    );
    await expectDeny(
      { ...healthySnapshot(), childAssociation: { status: "quarantined", currentKey: null } },
      "child_association_not_current",
    );
    // An active-status row that lost its current marker is not current either.
    await expectDeny(
      { ...healthySnapshot(), childAssociation: { status: "active", currentKey: null } },
      "child_association_not_current",
    );
    await expectDeny(
      { ...healthySnapshot(), familyAssociation: { status: "revoked", currentKey: null } },
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
        familyAuthorization: { status: "revoked", expiresAt: new Date("2026-08-08T00:00:00.000Z") },
      },
      "authorization_revoked",
    );
    await expectDeny(
      {
        ...healthySnapshot(),
        childAuthorization: { status: "active", expiresAt: new Date("2026-08-07T07:59:59.000Z") },
      },
      "authorization_expired",
    );
    // Expiring exactly now is already expired: fail closed on the boundary.
    await expectDeny(
      { ...healthySnapshot(), familyAuthorization: { status: "active", expiresAt: NOW } },
      "authorization_expired",
    );
  });

  it("denies when the owner exchange is unavailable or incomplete", async () => {
    await expectDeny(healthySnapshot(), "canonical_exchange_unavailable", {
      exchange: async () => ({ status: "unavailable" }),
    });
    await expectDeny(healthySnapshot(), "canonical_identity_incomplete", {
      exchange: async () => ({ status: "exchanged", childId: "mc-child-1", familyId: "" }),
    });
  });

  it("never calls the owner exchange for a locally denied chain", async () => {
    let called = false;
    const exchange: FamilyGrowthCanonicalExchangePort = {
      exchange: async () => {
        called = true;
        return { status: "exchanged", childId: "x", familyId: "y" };
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
