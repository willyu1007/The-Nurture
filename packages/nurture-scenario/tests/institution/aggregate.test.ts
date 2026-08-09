import { describe, expect, it, vi } from "vitest";
import {
  NurtureInstitutionAuthorityChain,
  createInMemoryInstitutionContextRepository,
  resolveAggregate,
  type NurtureActorBinding,
  type NurtureAggregateMember,
  type NurturePolicyFacts,
} from "../../src/index.js";

/**
 * G4-A increment 4 — 0C-5 §5, full coverage or nothing.
 *
 * The rule reads simply and fails in ways that look reasonable, so most of
 * these assert what must NOT happen: no filtered count, no membership delta
 * across refusals, and no member fact consulted on a refusal at all.
 */

const member = (
  member_ref: string,
  overrides: Partial<NurtureAggregateMember> = {},
): NurtureAggregateMember => ({
  member_ref,
  grant_state: "active",
  grant_terms: [
    {
      directions: ["family_to_org"],
      data_classes: ["daily_care_log"],
      purposes: ["care_coordination"],
    },
  ],
  ...overrides,
});

const ask = {
  direction: "family_to_org",
  data_class: "daily_care_log",
  purpose_key: "care_coordination",
} as const;

describe("0C-5 aggregate privacy (G4-A increment 4)", () => {
  it("returns the value when every member of a non-empty population is readable", () => {
    const result = resolveAggregate([member("a"), member("b")], ask, () => 3);
    expect(result).toEqual({ status: "available", value: 6 });
  });

  it("returns 0 for a genuinely empty population, distinguishable from unavailable", () => {
    const empty = resolveAggregate([], ask, () => 1);
    expect(empty).toEqual({ status: "available", value: 0 });
    // The distinction an Admin needs: "there is nothing" carries a number,
    // "I cannot tell you" carries none. A bare integer cannot conflate them
    // because the refusal has no value field at all.
    const refused = resolveAggregate([member("a", { grant_state: "missing" })], ask, () => 1);
    expect(refused).not.toHaveProperty("value");
    expect(refused).toMatchObject({ status: "unavailable" });
  });

  it("refuses when any single member is unreadable, never a filtered count", () => {
    // Four readable members contributing 1 each. A filtered count would say 4
    // — a confident wrong number with no signal that it is wrong.
    const members = [
      member("a"),
      member("b"),
      member("c"),
      member("d"),
      member("e", { grant_state: "revoked", grant_terms: [] }),
    ];
    expect(resolveAggregate(members, ask, () => 1)).toMatchObject({ status: "unavailable" });
  });

  /**
   * 0C-5 §5's "no aggregate bypass", as a runtime fact rather than a comment:
   * on a refusal the member facts are never read, so no partial figure can
   * exist to leak and no later edit can compute one and discard it.
   */
  it("never consults a member fact when the population is refused", () => {
    const countFor = vi.fn(() => 1);
    resolveAggregate([member("a"), member("b", { grant_state: "missing" })], ask, countFor);
    expect(countFor).not.toHaveBeenCalled();

    countFor.mockClear();
    resolveAggregate([member("a"), member("b")], ask, countFor);
    expect(countFor).toHaveBeenCalledTimes(2);
  });

  /**
   * Fixture 13. The differential-observation leak the rule closes: repeating a
   * refused aggregate after a grant changes must yield NO observable delta,
   * or an Admin watching the response learns that one member transitioned.
   */
  it("yields an identical response as unreadable membership changes", () => {
    const oneDenied = resolveAggregate(
      [member("a"), member("b"), member("c", { grant_state: "missing" })],
      ask,
      () => 1,
    );
    const twoDenied = resolveAggregate(
      [member("a"), member("b", { grant_state: "revoked" }), member("c", { grant_state: "missing" })],
      ask,
      () => 1,
    );
    // Not merely both "unavailable" — byte-identical, including the reason
    // code, so no field carries the count of who was denied.
    expect(oneDenied).toEqual(twoDenied);
  });

  it("refuses on the same axes the direct read refuses on", () => {
    // "No aggregate bypass" restated: a member whose grant lacks the data
    // class is unreadable here exactly as on a direct read.
    const wrongClass = member("a", {
      grant_terms: [
        {
          directions: ["family_to_org"],
          data_classes: ["child_growth_record"],
          purposes: ["care_coordination"],
        },
      ],
    });
    expect(resolveAggregate([wrongClass], ask, () => 1)).toMatchObject({ status: "unavailable" });

    const wrongPurpose = member("a", {
      grant_terms: [
        {
          directions: ["family_to_org"],
          data_classes: ["daily_care_log"],
          purposes: ["safety_response"],
        },
      ],
    });
    expect(resolveAggregate([wrongPurpose], ask, () => 1)).toMatchObject({
      status: "unavailable",
    });
  });

  it("carries no score, band, rank, trend or magnitude field under any name", () => {
    // 0C-5 §6 is an invariant, not a default: a later unit cannot enable
    // scoring by configuration, so the response shape has nowhere to put one.
    expect(Object.keys(resolveAggregate([member("a")], ask, () => 7)).sort()).toEqual([
      "status",
      "value",
    ]);
    expect(Object.keys(resolveAggregate([member("a", { grant_state: "missing" })], ask, () => 7)).sort()).toEqual([
      "reason_code",
      "status",
    ]);
  });
});

describe("aggregate through the chain (G4-A increment 4)", () => {
  const binding: NurtureActorBinding = {
    actor_binding_ref: "assignment-1",
    participant_id: "participant-1",
    role_assignment_id: "assignment-1",
    role_kind: "institution_admin",
    scope_type: "institution",
    scope_id: "institution-1",
    work_scope: { kind: "institution", institution_id: "institution-1" },
  };

  const facts = (overrides: Partial<NurturePolicyFacts> = {}): NurturePolicyFacts => ({
    participant_state: "active",
    role_state: "active",
    role_kind: "institution_admin",
    scope_reaches_child: true,
    institution_scope_current: true,
    target_scope_state: "absent",
    child_in_named_class: false,
    actor_scope_type: "institution",
    actor_scope_ref: "institution-1",
    care_group_matches: true,
    child_visible: true,
    thread_state: "missing",
    thread_membership_active: false,
    message_state: "missing",
    enrollment_state: "active",
    grant_state: "active",
    grant_terms: [],
    family_thread_visible: false,
    asset_scope_matches: false,
    child_enrolled: true,
    exposure_policy_present: false,
    ...overrides,
  });

  const chainWith = (
    population: NurtureAggregateMember[],
    policyFacts: NurturePolicyFacts = facts(),
  ) =>
    new NurtureInstitutionAuthorityChain(
      createInMemoryInstitutionContextRepository({
        listActiveActorBindings: async () => [binding],
        loadPolicyFacts: async () => policyFacts,
        loadAggregatePopulation: async () => population,
      }),
    );

  const request = {
    workspace_id: "workspace-1",
    participant_ref: "participant-1",
    care_group_ref: "group-1",
    at: "2026-08-09T00:00:00.000Z",
    ...ask,
  };

  it("aggregates a fully readable class", async () => {
    await expect(chainWith([member("a"), member("b")]).aggregate(request, () => 2)).resolves.toEqual(
      { status: "available", value: 4 },
    );
  });

  /**
   * The chain runs first and to the class level. An Admin who cannot reach the
   * class gets the SCOPE denial, so the aggregate never becomes a way to probe
   * scope — and the population is never read at all.
   */
  it("denies at the scope level before any population is read", async () => {
    const loadAggregatePopulation = vi.fn(async () => [member("a")]);
    const chain = new NurtureInstitutionAuthorityChain(
      createInMemoryInstitutionContextRepository({
        listActiveActorBindings: async () => [binding],
        loadPolicyFacts: async () => facts({ institution_scope_current: false }),
        loadAggregatePopulation,
      }),
    );
    await expect(chain.aggregate(request, () => 1)).resolves.toMatchObject({
      status: "denied",
      reason_code: "not_authorized",
    });
    expect(loadAggregatePopulation).not.toHaveBeenCalled();
  });

  it("reports the owner being unavailable rather than counting what it has", async () => {
    const chain = new NurtureInstitutionAuthorityChain(
      createInMemoryInstitutionContextRepository({
        listActiveActorBindings: async () => [binding],
        loadPolicyFacts: async () => facts(),
        loadAggregatePopulation: async () => {
          throw new Error("owner unavailable");
        },
      }),
    );
    await expect(chain.aggregate(request, () => 1)).resolves.toMatchObject({
      status: "unavailable",
      reason_code: "policy_unavailable",
    });
  });
});
