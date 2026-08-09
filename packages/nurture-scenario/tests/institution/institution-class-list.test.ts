import { describe, expect, it, vi } from "vitest";
import {
  NurtureInstitutionClassListService,
  orderClassList,
  type NurtureAggregateMember,
  type NurtureInstitutionClassListRepository,
  type NurtureInstitutionSupportSignalV1,
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
  loadClassSchedule: async () => null,
  loadPhotoCandidates: async () => [],
  loadLatestTextAt: async () => null,
  ...overrides,
});

const supportSignalQuery = (signals: NurtureInstitutionSupportSignalV1[] = []) => ({
  compose: async () => ({
    status: "ok" as const,
    output: {
      contract_version: "1.0.0" as const,
      institution_ref: "institution-1",
      snapshot_at: "2026-08-09T12:00:00.000Z",
      signals,
      projection_version: 1 as const,
    },
  }),
});

const compose = (overrides: Partial<NurtureInstitutionClassListRepository> = {}) =>
  new NurtureInstitutionClassListService(
    repository(overrides),
    supportSignalQuery(),
  ).compose({
    workspace_id: "workspace-1",
    participant_ref: "admin-1",
    institution_ref: "institution-1",
    local_date: "2026-08-09",
    snapshot_at: "2026-08-09T12:00:00.000Z",
    // Mid-morning, so a schedule with a 09:00-11:00 slot has a current one.
    at_minute: 600,
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
    // The full card surface. A new field here is a deliberate decision, and
    // this assertion is what makes adding one visible in review.
    expect(Object.keys(list.entries[0]!).sort()).toEqual([
      "attendance",
      "care_group_ref",
      "contract_version",
      "pending",
      "projection_version",
      "safe_class_label",
      "schedule",
      "support_signals",
    ]);
    expect(Object.keys(list.entries[0]!.pending).sort()).toEqual([
      "awaiting_response",
      "institution_action_needed",
      "new_family_feedback",
    ]);
  });
});

/**
 * G4-B increment 6 — the card fields that needed 0D-2.
 */
describe("class card schedule, photo and text (G4-B increment 6)", () => {
  const daySlots = [
    { slot_ref: "morning", label: "Morning", starts_at_minute: 540, ends_at_minute: 660 },
    { slot_ref: "afternoon", label: "Afternoon", starts_at_minute: 840, ends_at_minute: 960 },
  ];
  const schedule = (
    resolved_from: "day_override" | "class_standing" | "institution_default" = "class_standing",
  ) => ({
    contract_version: "1.0.0" as const,
    care_group_ref: "a",
    local_date: "2026-08-09",
    schedule_version: 42,
    resolved_from,
    slots: daySlots,
  });

  it("reports the schedule version and which layer produced it", async () => {
    const list = await compose({ loadClassSchedule: async () => schedule() });
    expect(list.entries[0]!.schedule).toMatchObject({
      schedule_version: 42,
      resolved_from: "class_standing",
      has_temporary_override: false,
    });
  });

  it("flags a day override as temporary", async () => {
    const list = await compose({ loadClassSchedule: async () => schedule("day_override") });
    expect(list.entries[0]!.schedule).toMatchObject({ has_temporary_override: true });
  });

  it("names the current and next activity at the given minute", async () => {
    const list = await compose({ loadClassSchedule: async () => schedule() });
    expect(list.entries[0]!.schedule).toMatchObject({
      current_activity: { activity_ref: "morning", label: "Morning" },
      next_activity: { activity_ref: "afternoon", label: "Afternoon" },
    });
  });

  /**
   * A gap in the day means there is a next activity while no current one —
   * "next" is the earliest slot starting after now, not the one after the
   * current slot.
   */
  it("reports a next activity during a gap, with no current one", async () => {
    const service = new NurtureInstitutionClassListService(
      repository({ loadClassSchedule: async () => schedule() }),
      supportSignalQuery(),
    );
    const midday = await service.compose({
      workspace_id: "workspace-1",
      participant_ref: "admin-1",
      institution_ref: "institution-1",
      local_date: "2026-08-09",
      snapshot_at: "2026-08-09T12:00:00.000Z",
      at_minute: 700,
      ask,
    });
    expect(midday.entries[0]!.schedule).toMatchObject({
      next_activity: { activity_ref: "afternoon" },
    });
    expect(midday.entries[0]!.schedule).not.toHaveProperty("current_activity");
  });

  it("shows no schedule at all when the class has none", async () => {
    const list = await compose();
    expect(list.entries[0]!.schedule).toBeNull();
    // And no invented default day.
    expect(list.entries[0]!.schedule).not.toMatchObject({ resolved_from: expect.anything() });
  });

  it("selects the latest photo through 0D-2's ordering", async () => {
    const list = await compose({
      loadClassSchedule: async () => schedule(),
      loadPhotoCandidates: async () => [
        { media_ref: "morning-photo", activity_ref: "morning", captured_at_ms: 100 },
        { media_ref: "afternoon-photo", activity_ref: "afternoon", captured_at_ms: 900 },
      ],
    });
    // 600 minutes is inside the morning slot, so the current activity wins
    // over the newer afternoon photo.
    expect(list.entries[0]!.latest_photo).toMatchObject({
      media_ref: "morning-photo",
      selected_by: "current_activity",
    });
  });

  it("omits the photo entirely when nothing qualifies", async () => {
    const list = await compose({ loadClassSchedule: async () => schedule() });
    expect(list.entries[0]).not.toHaveProperty("latest_photo");
  });

  /**
   * The card carries when the newest text was captured and nothing else. A
   * capture's text is protected content, and releasing it is an authority
   * decision this projection does not make.
   */
  it("carries a text timestamp with no body", async () => {
    const list = await compose({ loadLatestTextAt: async () => 1234 });
    expect(list.entries[0]!.latest_text).toEqual({ source_timestamp_ms: 1234 });
    expect(Object.keys(list.entries[0]!.latest_text!)).toEqual(["source_timestamp_ms"]);
  });

  it("omits the text field when the class has none today", async () => {
    const list = await compose();
    expect(list.entries[0]).not.toHaveProperty("latest_text");
  });

  it("projects only the frozen body-free signal fields for its own class", async () => {
    const service = new NurtureInstitutionClassListService(
      repository(),
      supportSignalQuery([
        {
          category: "business_response_overdue",
          tier: "action_required",
          scopeRef: "a",
          sourceRef: "opaque-source-a",
          safeReason: "A business response is past its explicit deadline.",
          deadlineAt: "2026-08-09T11:00:00.000Z",
          occurredAt: "2026-08-09T08:00:00.000Z",
          policyRevision: 2,
          contractVersion: "1.0.0",
        },
        {
          category: "configured_load_threshold",
          tier: "attention_suggested",
          scopeRef: "b",
          sourceRef: "opaque-source-b",
          safeReason: "The configured pending-work threshold is reached.",
          currentCount: 4,
          occurredAt: "2026-08-09T09:00:00.000Z",
          policyRevision: 3,
          contractVersion: "1.0.0",
        },
      ]),
    );
    const list = await service.compose({
      workspace_id: "workspace-1",
      participant_ref: "admin-1",
      institution_ref: "institution-1",
      local_date: "2026-08-09",
      snapshot_at: "2026-08-09T12:00:00.000Z",
      at_minute: 600,
      ask,
    });
    const classA = list.entries.find((entry) => entry.care_group_ref === "a")!;
    expect(classA.support_signals).toEqual({
      status: "available",
      items: [
        {
          tier: "action_required",
          sourceRef: "opaque-source-a",
          safeReason: "A business response is past its explicit deadline.",
          deadlineAt: "2026-08-09T11:00:00.000Z",
          occurredAt: "2026-08-09T08:00:00.000Z",
        },
      ],
    });
    expect(JSON.stringify(classA.support_signals)).not.toMatch(
      /category|scopeRef|policyRevision|contractVersion|body|child/i,
    );
  });
});
