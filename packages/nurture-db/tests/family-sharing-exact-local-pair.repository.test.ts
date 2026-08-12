import { describe, expect, it, vi } from "vitest";
import type {
  NurtureFamilySharingExactTargetSelectorV1,
  NurtureFamilySharingVerifiedCurrentPairEvidenceV1,
} from "@the-nurture/scenario";
import { PrismaNurtureFamilySharingExactLocalPairResolver } from "../src/repositories/family-sharing-exact-local-pair.repository.js";

const pairEvidence = (): NurtureFamilySharingVerifiedCurrentPairEvidenceV1 => ({
  verification: "verified_current_pair_evidence",
  evidence_ref: "pair-evidence-1",
  evidence_version: 7,
  verified_at: "2026-08-12T07:59:50.000Z",
  expires_at: "2026-08-12T08:01:00.000Z",
  child_anchor_ref: "child-anchor-1",
  child_owner_version: 4,
  family_anchor_ref: "family-anchor-1",
  family_owner_version: 5,
  my_chat_family_lifecycle: "active",
});

const target = (): NurtureFamilySharingExactTargetSelectorV1 => ({
  verification: "verified_exact_target_selector",
  pair_evidence_ref: "pair-evidence-1",
  pair_evidence_version: 7,
  target_kind: "enrollment",
  enrollment_ref: "enrollment-1",
  enrollment_revision: 8,
});

const localPair = () => ({
  workspace_id: "workspace-1",
  child_ref: "child-local-1",
  child_care_process_ref: "process-local-1",
  family_ref: "family-local-1",
  child_association_ref: "child-association-local-1",
  family_association_ref: "family-association-local-1",
});

function createResolver(rows: unknown[] | Error) {
  const queryRaw = vi.fn(async (_statement: unknown) => {
    if (rows instanceof Error) throw rows;
    return rows;
  });
  return {
    resolver: new PrismaNurtureFamilySharingExactLocalPairResolver({
      $queryRaw: queryRaw,
    } as never),
    queryRaw,
  };
}

function input() {
  return {
    workspace_id: "workspace-1",
    pair_evidence: pairEvidence(),
    target: target(),
    evaluated_at: "2026-08-12T08:00:00.000Z",
  };
}

describe("T-010 I4-C3 exact local-pair resolver", () => {
  it("resolves local refs only inside Nurture from exact signed anchors and target", async () => {
    const { resolver, queryRaw } = createResolver([localPair()]);

    await expect(resolver.resolveExact(input())).resolves.toEqual({
      status: "resolved",
      local_pair: localPair(),
    });
    expect(queryRaw).toHaveBeenCalledOnce();
    const statement = queryRaw.mock.calls[0]?.[0] as unknown as {
      sql: string;
      values: unknown[];
    };
    expect(statement.sql).toContain('family_association."child_anchor_id"');
    expect(statement.sql).toContain('family_association."family_anchor_id"');
    expect(statement.sql).toContain('pair_operation."state" = \'committed\'');
    expect(statement.sql).toContain('enrollment."aggregate_version"');
    expect(statement.sql).toContain("LIMIT 2");
    expect(statement.values).toEqual(expect.arrayContaining([
      "workspace-1",
      "child-anchor-1",
      4,
      "family-anchor-1",
      5,
      "enrollment-1",
      8,
    ]));
  });

  it.each([
    ["missing", []],
    ["ambiguous", [localPair(), { ...localPair(), family_ref: "family-local-2" }]],
    ["malformed", [{ ...localPair(), child_ref: "" }]],
  ])("fails closed for a %s local-pair result", async (_label, rows) => {
    const { resolver } = createResolver(rows as unknown[]);
    await expect(resolver.resolveExact(input())).resolves.toEqual({
      status: "unavailable",
    });
  });

  it("fails closed without querying for stale evidence or mismatched target binding", async () => {
    const { resolver, queryRaw } = createResolver([localPair()]);
    const request = input();
    await expect(resolver.resolveExact({
      ...request,
      pair_evidence: { ...request.pair_evidence, expires_at: request.evaluated_at },
    })).resolves.toEqual({ status: "unavailable" });
    await expect(resolver.resolveExact({
      ...request,
      target: { ...request.target, pair_evidence_version: 8 },
    })).resolves.toEqual({ status: "unavailable" });
    expect(queryRaw).not.toHaveBeenCalled();
  });

  it("collapses database outage to unavailable", async () => {
    const { resolver } = createResolver(new Error("database unavailable"));
    await expect(resolver.resolveExact(input())).resolves.toEqual({
      status: "unavailable",
    });
  });
});
