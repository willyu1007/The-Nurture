import { createHash } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import {
  NURTURE_FAMILY_SHARING_CATEGORIES,
  NURTURE_FAMILY_SHARING_DIRECTION_BY_CATEGORY,
  NURTURE_FAMILY_SHARING_ELIGIBILITY_INTERFACE,
  NURTURE_FAMILY_SHARING_ELIGIBILITY_INTERFACE_DIGEST,
  NURTURE_FAMILY_SHARING_ELIGIBILITY_INTERFACE_SCHEMA_V1,
  NURTURE_FAMILY_SHARING_ELIGIBILITY_PURPOSE,
  resolveNurtureFamilySharingEligibility,
  type NurtureFamilySharingAuthorityCategoryFactsV1,
  type NurtureFamilySharingEligibilityRequestV1,
} from "../../src/harness/family-sharing-eligibility.js";

const request = (): NurtureFamilySharingEligibilityRequestV1 => ({
  workspace_id: "workspace-1",
  my_chat_user_id: "user-1",
  host_request_id: "request-1",
  parent_context_ref: "parent-context.opaque-1",
  purpose: NURTURE_FAMILY_SHARING_ELIGIBILITY_PURPOSE,
  interface_contract: NURTURE_FAMILY_SHARING_ELIGIBILITY_INTERFACE,
});

const facts = (
  overrides: Partial<NurtureFamilySharingAuthorityCategoryFactsV1> = {},
): NurtureFamilySharingAuthorityCategoryFactsV1 => ({
  category_key: "daily_activity",
  direction: "nurture_to_family",
  role_authorized: true,
  grant_authorized: true,
  release_authorized: true,
  receiving_authorized: true,
  source_lifecycle: "active",
  destination_lifecycle: "active",
  ...overrides,
});

const allFacts = (): NurtureFamilySharingAuthorityCategoryFactsV1[] =>
  NURTURE_FAMILY_SHARING_CATEGORIES.map((categoryKey) =>
    facts({
      category_key: categoryKey,
      direction: NURTURE_FAMILY_SHARING_DIRECTION_BY_CATEGORY[categoryKey],
    }),
  );

describe("Nurture family-sharing eligibility", () => {
  it("pins the exact interface digest", () => {
    const digest = createHash("sha256")
      .update(
        JSON.stringify(
          NURTURE_FAMILY_SHARING_ELIGIBILITY_INTERFACE_SCHEMA_V1,
        ),
        "utf8",
      )
      .digest("hex");

    expect(NURTURE_FAMILY_SHARING_ELIGIBILITY_INTERFACE).toEqual({
      key: "nurture.family-sharing-eligibility",
      version: "1.0.0",
      digest: `sha256:${digest}`,
    });
    expect(NURTURE_FAMILY_SHARING_ELIGIBILITY_INTERFACE_DIGEST).toBe(
      `sha256:${digest}`,
    );
  });

  it("derives the exact ordered category set from a current owner snapshot", async () => {
    const loadCurrentFamilySharingAuthority = vi.fn(async () => ({
      authority_version: "authority-v7",
      categories: allFacts().reverse(),
    }));

    const result = await resolveNurtureFamilySharingEligibility(
      {
        authority: { loadCurrentFamilySharingAuthority },
        now: () => new Date("2026-08-11T08:09:10.000Z"),
      },
      request(),
    );

    expect(loadCurrentFamilySharingAuthority).toHaveBeenCalledWith({
      workspace_id: "workspace-1",
      my_chat_user_id: "user-1",
      host_request_id: "request-1",
      parent_context_ref: "parent-context.opaque-1",
      purpose: NURTURE_FAMILY_SHARING_ELIGIBILITY_PURPOSE,
    });
    expect(result).toEqual({
      status: "resolved",
      contract: NURTURE_FAMILY_SHARING_ELIGIBILITY_INTERFACE,
      purpose: NURTURE_FAMILY_SHARING_ELIGIBILITY_PURPOSE,
      authority_version: "authority-v7",
      evaluated_at: "2026-08-11T08:09:10.000Z",
      categories: NURTURE_FAMILY_SHARING_CATEGORIES.map((categoryKey) => ({
        category_key: categoryKey,
        direction: NURTURE_FAMILY_SHARING_DIRECTION_BY_CATEGORY[categoryKey],
        eligibility: "eligible",
        source_lifecycle: "active",
        destination_lifecycle: "active",
      })),
    });
  });

  it.each([
    ["role", { role_authorized: false }],
    ["grant", { grant_authorized: false }],
    ["release", { release_authorized: false }],
    ["receiving", { receiving_authorized: false }],
    ["source lifecycle", { source_lifecycle: "inactive" as const }],
    [
      "destination lifecycle",
      { destination_lifecycle: "inactive" as const },
    ],
  ])("resolves a current negative %s fact as ineligible", async (_, denial) => {
    const categories = allFacts();
    categories[1] = facts({
      category_key: "media",
      direction: "family_to_nurture",
      ...denial,
    });

    const result = await resolveNurtureFamilySharingEligibility(
      {
        authority: {
          loadCurrentFamilySharingAuthority: async () => ({
            authority_version: "authority-v8",
            categories,
          }),
        },
        now: () => new Date("2026-08-11T08:09:10.000Z"),
      },
      request(),
    );

    expect(result.status).toBe("resolved");
    if (result.status === "resolved") {
      expect(result.categories[1]?.eligibility).toBe("ineligible");
    }
  });

  it("rereads owner authority on every request", async () => {
    const loadCurrentFamilySharingAuthority = vi.fn(async () => ({
      authority_version: "authority-current",
      categories: allFacts(),
    }));
    const dependencies = {
      authority: { loadCurrentFamilySharingAuthority },
      now: () => new Date("2026-08-11T08:09:10.000Z"),
    };

    await resolveNurtureFamilySharingEligibility(dependencies, request());
    await resolveNurtureFamilySharingEligibility(dependencies, request());

    expect(loadCurrentFamilySharingAuthority).toHaveBeenCalledTimes(2);
  });

  it.each([
    ["missing", allFacts().slice(0, 2)],
    ["duplicate", [allFacts()[0], allFacts()[0], allFacts()[2]]],
    [
      "wrong direction",
      [
        facts({ direction: "family_to_nurture" }),
        allFacts()[1],
        allFacts()[2],
      ],
    ],
  ])("fails closed for a %s category snapshot", async (_, categories) => {
    await expect(
      resolveNurtureFamilySharingEligibility(
        {
          authority: {
            loadCurrentFamilySharingAuthority: async () => ({
              authority_version: "authority-v9",
              categories,
            }),
          },
        },
        request(),
      ),
    ).resolves.toEqual({ status: "unavailable" });
  });

  it("rejects an unpinned request before reading owner authority", async () => {
    const loadCurrentFamilySharingAuthority = vi.fn(async () => ({
      authority_version: "authority-v10",
      categories: allFacts(),
    }));

    const invalidRequest = {
      ...request(),
      interface_contract: {
        ...NURTURE_FAMILY_SHARING_ELIGIBILITY_INTERFACE,
        digest: `sha256:${"a".repeat(64)}`,
      },
    };
    await expect(
      resolveNurtureFamilySharingEligibility(
        { authority: { loadCurrentFamilySharingAuthority } },
        invalidRequest,
      ),
    ).resolves.toEqual({ status: "unavailable" });
    expect(loadCurrentFamilySharingAuthority).not.toHaveBeenCalled();
  });

  it("collapses owner errors and invalid clocks to unavailable", async () => {
    await expect(
      resolveNurtureFamilySharingEligibility(
        {
          authority: {
            loadCurrentFamilySharingAuthority: async () => {
              throw new Error("owner details must not cross the boundary");
            },
          },
        },
        request(),
      ),
    ).resolves.toEqual({ status: "unavailable" });

    await expect(
      resolveNurtureFamilySharingEligibility(
        {
          authority: {
            loadCurrentFamilySharingAuthority: async () => ({
              authority_version: "authority-v11",
              categories: allFacts(),
            }),
          },
          now: () => new Date(Number.NaN),
        },
        request(),
      ),
    ).resolves.toEqual({ status: "unavailable" });
  });

  it("does not expose internal authority evidence or raw identity fields", async () => {
    const result = await resolveNurtureFamilySharingEligibility(
      {
        authority: {
          loadCurrentFamilySharingAuthority: async () => ({
            authority_version: "authority-safe",
            categories: allFacts(),
          }),
        },
        now: () => new Date("2026-08-11T08:09:10.000Z"),
      },
      request(),
    );
    const serialized = JSON.stringify(result);

    expect(serialized).not.toContain("workspace-1");
    expect(serialized).not.toContain("user-1");
    expect(serialized).not.toContain("parent-context.opaque-1");
    expect(serialized).not.toContain("grant_authorized");
    expect(serialized).not.toContain("role_authorized");
  });
});
