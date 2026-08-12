import { describe, expect, it, vi } from "vitest";
import {
  NURTURE_FAMILY_SHARING_AUTHORITY_READ_AUDIENCE,
  NURTURE_FAMILY_SHARING_AUTHORITY_READ_OPERATION,
  NURTURE_FAMILY_SHARING_CATEGORIES,
  NURTURE_FAMILY_SHARING_DIRECTION_BY_CATEGORY,
  NURTURE_FAMILY_SHARING_ELIGIBILITY_PURPOSE,
  type NurtureFamilySharingCurrentAuthorityReadInputV1,
} from "@the-nurture/scenario";
import { PrismaNurtureFamilySharingCurrentAuthorityRepository } from "../src/repositories/family-sharing-current-authority.repository.js";

const EVALUATED_AT = "2026-08-12T08:00:00.000Z";
const EFFECTIVE_FROM = new Date("2026-08-11T08:00:00.000Z");
const EXPIRES_AT = new Date("2026-08-13T08:00:00.000Z");
const UPDATED_AT = new Date("2026-08-12T07:00:00.000Z");

const input = (): NurtureFamilySharingCurrentAuthorityReadInputV1 => ({
  principal: {
    verification: "verified_service_principal",
    service_ref: "my-chat.family-authorization",
    trust_source_ref: "nurture.service-trust.my-chat",
    trust_source_version: 4,
    audience: NURTURE_FAMILY_SHARING_AUTHORITY_READ_AUDIENCE,
    operation: NURTURE_FAMILY_SHARING_AUTHORITY_READ_OPERATION,
  },
  pair_evidence: {
    verification: "verified_current_pair_evidence",
    evidence_ref: "my-chat.current-pair.evidence-7",
    evidence_version: 7,
    verified_at: "2026-08-12T07:59:00.000Z",
    expires_at: "2026-08-12T08:01:00.000Z",
    child_anchor_ref: "child-anchor-1",
    child_owner_version: 3,
    family_anchor_ref: "family-anchor-1",
    family_owner_version: 5,
    my_chat_family_lifecycle: "active",
  },
  local_pair: {
    workspace_id: "workspace-1",
    child_ref: "child-1",
    child_care_process_ref: "process-1",
    family_ref: "family-1",
    child_association_ref: "child-association-1",
    family_association_ref: "family-association-1",
  },
  target: {
    verification: "verified_exact_target_selector",
    pair_evidence_ref: "my-chat.current-pair.evidence-7",
    pair_evidence_version: 7,
    target_kind: "enrollment",
    enrollment_ref: "enrollment-1",
    enrollment_revision: 11,
  },
  purpose: NURTURE_FAMILY_SHARING_ELIGIBILITY_PURPOSE,
  evaluated_at: EVALUATED_AT,
});

type RawRow = ReturnType<typeof row>;

function row(
  category: (typeof NURTURE_FAMILY_SHARING_CATEGORIES)[number],
  axis: "release" | "receiving",
) {
  return {
    category,
    direction: NURTURE_FAMILY_SHARING_DIRECTION_BY_CATEGORY[category],
    axis,
    child_revision: 2,
    child_updated_at: UPDATED_AT,
    process_revision: 3,
    process_updated_at: UPDATED_AT,
    family_revision: 4,
    family_updated_at: UPDATED_AT,
    enrollment_revision: 11,
    enrollment_updated_at: UPDATED_AT,
    institution_revision: 6,
    institution_updated_at: UPDATED_AT,
    care_group_revision: 7,
    care_group_updated_at: UPDATED_AT,
    child_anchor_version: 3,
    family_anchor_version: 5,
    child_association_revision: 8,
    family_association_revision: 9,
    pair_current_owner_evidence_hash: "a".repeat(64),
    pair_commit_evidence_hash: "b".repeat(64),
    authority_id: `authority-${category}`,
    authority_status: "active",
    authority_effective_from: EFFECTIVE_FROM,
    authority_expires_at: EXPIRES_AT,
    authority_revoked_at: null,
    authority_role: "guardian",
    authority_role_assignment_id: `authority-role-${category}`,
    authority_version: 12,
    authority_updated_at: UPDATED_AT,
    authority_role_revision: 13,
    authority_participant_revision: 14,
    policy_id: `policy-${category}-${axis}`,
    policy_status: "active",
    policy_effective_from: EFFECTIVE_FROM,
    policy_expires_at: EXPIRES_AT,
    policy_revoked_at: null,
    policy_role: "guardian",
    policy_role_assignment_id: `policy-role-${category}-${axis}`,
    policy_version: axis === "release" ? 15 : 16,
    policy_updated_at: UPDATED_AT,
    policy_role_revision: axis === "release" ? 17 : 18,
    policy_participant_revision: 14,
  };
}

const rows = (): RawRow[] =>
  NURTURE_FAMILY_SHARING_CATEGORIES.flatMap((category) => [
    row(category, "release"),
    row(category, "receiving"),
  ]);

function repositoryReturning(result: RawRow[] | Error) {
  const queryRaw = vi.fn(async (_query: unknown) => {
    if (result instanceof Error) throw result;
    return result;
  });
  return {
    repository: new PrismaNurtureFamilySharingCurrentAuthorityRepository({
      $queryRaw: queryRaw,
    } as never),
    queryRaw,
  };
}

describe("T-010 I4-C2 family-sharing current-authority repository", () => {
  it("resolves the exact current pair and target with one parameterized PostgreSQL read", async () => {
    const { repository, queryRaw } = repositoryReturning(rows());

    const result = await repository.loadCurrent(input());

    expect(result).toEqual({
      status: "resolved",
      authority_version: expect.stringMatching(/^v1\.sha256:[a-f0-9]{64}$/u),
      categories: NURTURE_FAMILY_SHARING_CATEGORIES.map((category) => ({
        category_key: category,
        direction: NURTURE_FAMILY_SHARING_DIRECTION_BY_CATEGORY[category],
        role_authorized: true,
        grant_authorized: true,
        release_authorized: true,
        receiving_authorized: true,
        source_lifecycle: "active",
        destination_lifecycle: "active",
      })),
    });
    expect(queryRaw).toHaveBeenCalledTimes(1);
    const statement = queryRaw.mock.calls[0]?.[0] as unknown as {
      sql: string;
      values: unknown[];
    };
    expect(statement.sql).toContain("nurture_family_anchor_association");
    expect(statement.sql).toContain("nurture_family_sharing_authority");
    expect(statement.sql).toContain("nurture_family_sharing_policy");
    expect(statement.sql).toContain(
      'pair_operation."current_owner_evidence_hash" AS pair_current_owner_evidence_hash',
    );
    expect(statement.sql).toContain(
      'pair_operation."pair_commit_evidence_hash" AS pair_commit_evidence_hash',
    );
    expect(statement.values).toContain("enrollment-1");
    expect(statement.values).toContain(11);
  });

  it("derives the same authority version independent of database row order", async () => {
    const ordered = repositoryReturning(rows()).repository;
    const reversed = repositoryReturning(rows().reverse()).repository;
    const ownerEvidenceChanged = repositoryReturning(
      rows().map((candidate) => ({
        ...candidate,
        pair_current_owner_evidence_hash: "c".repeat(64),
      })),
    ).repository;
    const pairCommitChanged = repositoryReturning(
      rows().map((candidate) => ({
        ...candidate,
        pair_commit_evidence_hash: "d".repeat(64),
      })),
    ).repository;

    const first = await ordered.loadCurrent(input());
    const second = await reversed.loadCurrent(input());
    const third = await ownerEvidenceChanged.loadCurrent(input());
    const fourth = await pairCommitChanged.loadCurrent(input());

    expect(first.status).toBe("resolved");
    expect(second.status).toBe("resolved");
    expect(third.status).toBe("resolved");
    expect(fourth.status).toBe("resolved");
    if (
      first.status === "resolved" &&
      second.status === "resolved" &&
      third.status === "resolved" &&
      fourth.status === "resolved"
    ) {
      expect(first.authority_version).toBe(second.authority_version);
      expect(first.authority_version).not.toBe(third.authority_version);
      expect(first.authority_version).not.toBe(fourth.authority_version);
    }
  });

  it("uses verified My-Chat family lifecycle only on the My-Chat-owned endpoint", async () => {
    const repository = repositoryReturning(rows()).repository;
    const request = input();

    const result = await repository.loadCurrent({
      ...request,
      pair_evidence: {
        ...request.pair_evidence,
        my_chat_family_lifecycle: "inactive",
      },
    });

    expect(result).toMatchObject({
      status: "resolved",
      categories: [
        { category_key: "daily_activity", source_lifecycle: "active", destination_lifecycle: "inactive" },
        { category_key: "media", source_lifecycle: "inactive", destination_lifecycle: "active" },
        { category_key: "focus_collaboration", source_lifecycle: "inactive", destination_lifecycle: "active" },
      ],
    });
  });

  it.each(["release", "receiving"] as const)(
    "fails closed when the %s policy axis is missing",
    async (axis) => {
      const incomplete = rows().filter(
        (candidate) => !(candidate.category === "media" && candidate.axis === axis),
      );
      const repository = repositoryReturning(incomplete).repository;

      await expect(repository.loadCurrent(input())).resolves.toEqual({
        status: "unavailable",
      });
    },
  );

  it.each([
    ["authority missing", { authority_id: null }],
    ["authority revoked", { authority_status: "revoked", authority_revoked_at: UPDATED_AT }],
    ["authority expired", { authority_expires_at: EFFECTIVE_FROM }],
    ["authority role drift", { authority_role_revision: null }],
    ["policy revoked", { policy_status: "revoked", policy_revoked_at: UPDATED_AT }],
    ["policy role drift", { policy_participant_revision: null }],
  ])("fails closed for %s", async (_, defect) => {
    const defective = rows();
    Object.assign(defective[0]!, defect);
    if (
      "authority_id" in defect ||
      "authority_status" in defect ||
      "authority_expires_at" in defect ||
      "authority_role_revision" in defect
    ) {
      Object.assign(defective[1]!, defect);
    }
    const repository = repositoryReturning(defective).repository;

    await expect(repository.loadCurrent(input())).resolves.toEqual({
      status: "unavailable",
    });
  });

  it("fails closed instead of selecting from duplicate or ambiguous rows", async () => {
    const duplicate = rows();
    duplicate.push({ ...duplicate[0]! });
    const repository = repositoryReturning(duplicate).repository;

    await expect(repository.loadCurrent(input())).resolves.toEqual({
      status: "unavailable",
    });
  });

  it.each([
    ["expired pair evidence", { expires_at: EVALUATED_AT }],
    ["future-verified pair evidence", { verified_at: "2026-08-12T08:00:01.000Z" }],
  ])("rejects %s before querying PostgreSQL", async (_, evidencePatch) => {
    const { repository, queryRaw } = repositoryReturning(rows());
    const request = input();

    await expect(
      repository.loadCurrent({
        ...request,
        pair_evidence: { ...request.pair_evidence, ...evidencePatch },
      }),
    ).resolves.toEqual({ status: "unavailable" });
    expect(queryRaw).not.toHaveBeenCalled();
  });

  it("rejects unverified principals and non-exact targets before querying PostgreSQL", async () => {
    const { repository, queryRaw } = repositoryReturning(rows());
    const request = input();

    await expect(
      repository.loadCurrent({
        ...request,
        principal: { ...request.principal, verification: "unverified" as never },
      }),
    ).resolves.toEqual({ status: "unavailable" });
    await expect(
      repository.loadCurrent({
        ...request,
        target: { ...request.target, target_kind: "latest" as never },
      }),
    ).resolves.toEqual({ status: "unavailable" });
    await expect(
      repository.loadCurrent({
        ...request,
        target: { ...request.target, pair_evidence_version: 8 },
      }),
    ).resolves.toEqual({ status: "unavailable" });
    expect(queryRaw).not.toHaveBeenCalled();
  });

  it("collapses missing local rows and PostgreSQL outages to unavailable", async () => {
    await expect(repositoryReturning([]).repository.loadCurrent(input())).resolves.toEqual({
      status: "unavailable",
    });
    await expect(
      repositoryReturning(new Error("connection unavailable")).repository.loadCurrent(input()),
    ).resolves.toEqual({ status: "unavailable" });
  });
});
