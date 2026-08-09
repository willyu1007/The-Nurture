import { describe, expect, it, vi } from "vitest";
import {
  NurtureInstitutionClassListService,
  orderClassList,
  type NurtureAggregateMember,
  type NurtureInstitutionClassListRepository,
} from "../../src/index.js";

/**
 * G4-B increment 3 — the Admin class list.
 *
 * 0C-5 §6 fixture 14 has been owed since G4-A increment 4, which could not
 * satisfy it because observing an ordering needs a list and none existed. This
 * is that list.
 */

const grantTerms = [
  {
    directions: ["family_to_org" as const],
    data_classes: ["daily_care_log" as const],
    purposes: ["care_coordination"],
  },
];

const member = (
  member_ref: string,
  overrides: Partial<NurtureAggregateMember> = {},
): NurtureAggregateMember => ({
  member_ref,
  grant_state: "active",
  grant_terms: grantTerms,
  ...overrides,
});

const ask = {
  direction: "family_to_org" as const,
  data_class: "daily_care_log" as const,
  purpose_key: "care_coordination",
};

const repository = (
  overrides: Partial<NurtureInstitutionClassListRepository> = {},
): NurtureInstitutionClassListRepository => ({
  listClasses: async () => [
    { care_group_ref: "b", age_band_key: "toddler", name: "Bee", safe_class_label: "Bee" },
    { care_group_ref: "a", age_band_key: "infant", name: "Ant", safe_class_label: "Ant" },
  ],
  loadClassAttendance: async () => ({ state: "unsubmitted" }),
  loadAttendanceReadPopulation: async () => [],
  loadPendingCounts: async () => ({
    awaiting_response: 0,
    new_family_feedback: 0,
    institution_action_needed: 0,
  }),
  ...overrides,
});

const compose = (overrides: Partial<NurtureInstitutionClassListRepository> = {}) =>
  new NurtureInstitutionClassListService(repository(overrides)).compose({
    workspace_id: "workspace-1",
    institution_ref: "institution-1",
    local_date: "2026-08-09",
    ask,
  });

describe("class list ordering — 0C-5 §6 fixture 14 (G4-B increment 3)", () => {
  it("orders by stable class attributes, age band then name", () => {
    const ordered = orderClassList([
      { care_group_ref: "c", age_band_key: "toddler", name: "Zebra" },
      { care_group_ref: "a", age_band_key: "infant", name: "Ant" },
      { care_group_ref: "b", age_band_key: "toddler", name: "Bee" },
    ]);
    expect(ordered.map((entry) => entry.care_group_ref)).toEqual(["a", "b", "c"]);
  });

  it("places a class with no age band deterministically, not by input order", () => {
    const withNulls = [
      { care_group_ref: "none", age_band_key: null, name: "Unbanded" },
      { care_group_ref: "a", age_band_key: "infant", name: "Ant" },
    ];
    expect(orderClassList(withNulls).map((e) => e.care_group_ref)).toEqual(["a", "none"]);
    expect(orderClassList([...withNulls].reverse()).map((e) => e.care_group_ref)).toEqual([
      "a",
      "none",
    ]);
  });

  it("is a total order, so equal band and name still sort stably", () => {
    const twins = [
      { care_group_ref: "z", age_band_key: "infant", name: "Same" },
      { care_group_ref: "a", age_band_key: "infant", name: "Same" },
    ];
    expect(orderClassList(twins).map((e) => e.care_group_ref)).toEqual(["a", "z"]);
    expect(orderClassList([...twins].reverse()).map((e) => e.care_group_ref)).toEqual(["a", "z"]);
  });

  /**
   * Fixture 14 itself: the order is identical before and after a state change
   * that alters counts and attendance. If it moved, the list would assert a
   * ranking, which is what 0C-5 §6 closed the question to prevent.
   */
  it("does not move when counts and attendance change", async () => {
    const quiet = await compose();
    const busy = await compose({
      loadPendingCounts: async ({ care_group_ref }) =>
        care_group_ref === "b"
          ? { awaiting_response: 40, new_family_feedback: 12, institution_action_needed: 9 }
          : { awaiting_response: 0, new_family_feedback: 0, institution_action_needed: 0 },
      loadClassAttendance: async ({ care_group_ref }) =>
        care_group_ref === "b"
          ? { state: "submitted", entries: [{ member_ref: "child-1", present: true }] }
          : { state: "unsubmitted" },
      loadAttendanceReadPopulation: async () => [member("child-1")],
    });
    expect(busy.entries.map((e) => e.care_group_ref)).toEqual(
      quiet.entries.map((e) => e.care_group_ref),
    );
    expect(busy.entries.map((e) => e.care_group_ref)).toEqual(["a", "b"]);
  });
});

describe("class list attendance and counts (G4-B increment 3)", () => {
  /**
   * `02-architecture.md` D-05: an unsubmitted day shows "awaiting the
   * teacher's confirmation" and returns no Admin-facing inference count. The
   * union has no arm to put one in, which is how the rule is held rather than
   * remembered.
   */
  it("returns no count at all for an unsubmitted day", async () => {
    const list = await compose();
    for (const entry of list.entries) {
      expect(entry.attendance).toEqual({ state: "unsubmitted" });
      expect(entry.attendance).not.toHaveProperty("confirmed_present_count");
    }
  });

  it("reads no member fact when the day is unsubmitted", async () => {
    const loadAttendanceReadPopulation = vi.fn(async () => [member("child-1")]);
    await compose({ loadAttendanceReadPopulation });
    // Nothing to aggregate means nothing to read: the population is not even
    // fetched, so an unsubmitted class cannot leak who is in it.
    expect(loadAttendanceReadPopulation).not.toHaveBeenCalled();
  });

  it("counts confirmed presence when every member is readable", async () => {
    const list = await compose({
      loadClassAttendance: async () => ({
        state: "submitted",
        entries: [
          { member_ref: "child-1", present: true },
          { member_ref: "child-2", present: false },
          { member_ref: "child-3", present: true },
        ],
      }),
      loadAttendanceReadPopulation: async () => [
        member("child-1"),
        member("child-2"),
        member("child-3"),
      ],
    });
    expect(list.entries[0]!.attendance).toEqual({ state: "submitted", confirmed_present_count: 2 });
  });

  /**
   * 0D-1 §4 and 0C-5 §5: a submission count over a class whose members are not
   * all readable returns `unavailable`, never a figure over the readable ones.
   */
  it("refuses the count when any member is unreadable, rather than under-reporting", async () => {
    const list = await compose({
      loadClassAttendance: async () => ({
        state: "submitted",
        entries: [
          { member_ref: "child-1", present: true },
          { member_ref: "child-2", present: true },
        ],
      }),
      loadAttendanceReadPopulation: async () => [
        member("child-1"),
        member("child-2", { grant_state: "missing", grant_terms: [] }),
      ],
    });
    // A filtered count would say 1 — a confident wrong number.
    expect(list.entries[0]!.attendance).toMatchObject({ state: "unavailable" });
    expect(list.entries[0]!.attendance).not.toHaveProperty("confirmed_present_count");
  });

  it("keeps the pending counts, which measure the Admin's own work", async () => {
    const list = await compose({
      loadPendingCounts: async () => ({
        awaiting_response: 3,
        new_family_feedback: 1,
        institution_action_needed: 2,
      }),
    });
    expect(list.entries[0]!.pending).toEqual({
      awaiting_response: 3,
      new_family_feedback: 1,
      institution_action_needed: 2,
    });
  });

  it("carries no score, band, rank, freshness or teacher figure under any name", async () => {
    const list = await compose();
    expect(Object.keys(list.entries[0]!).sort()).toEqual([
      "attendance",
      "care_group_ref",
      "contract_version",
      "pending",
      "safe_class_label",
    ]);
    expect(Object.keys(list.entries[0]!.pending).sort()).toEqual([
      "awaiting_response",
      "institution_action_needed",
      "new_family_feedback",
    ]);
  });
});
