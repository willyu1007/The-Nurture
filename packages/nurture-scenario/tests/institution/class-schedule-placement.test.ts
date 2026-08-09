import { describe, expect, it } from "vitest";
import {
  decideActivityPlacement,
  isEligibleForAutomaticPass,
  resolveEffectiveSchedule,
  shouldApplyAutomaticPlacement,
  type NurtureScheduleLayer,
  type NurtureScheduleSlot,
  type NurtureStoredPlacement,
} from "../../src/index.js";

/**
 * G4-B increment 4 — 0D-2's resolution and placement rules.
 *
 * The rules that fail quietly are the ones asserted hardest: no merging across
 * schedule layers, no guessing into a slot when no schedule exists, and no
 * automatic pass overwriting a human decision.
 */

const slot = (
  slot_ref: string,
  starts_at_minute: number,
  ends_at_minute: number,
): NurtureScheduleSlot => ({ slot_ref, label: slot_ref, starts_at_minute, ends_at_minute });

const layer = (
  resolved_from: NurtureScheduleLayer["resolved_from"],
  slots: NurtureScheduleSlot[],
  updated_at_ms = 1000,
): NurtureScheduleLayer => ({ resolved_from, slots, updated_at_ms });

const resolve = (layers: NurtureScheduleLayer[]) =>
  resolveEffectiveSchedule({
    care_group_ref: "group-1",
    local_date: "2026-08-09",
    layers,
  });

describe("0D-2 schedule resolution (G4-B increment 4)", () => {
  it("lets the day override win entirely, with no merging", () => {
    // The override covers only the morning; the standing layer covers all day.
    // Composition would give the class an afternoon it did not schedule.
    const resolved = resolve([
      layer("day_override", [slot("morning", 540, 660)]),
      layer("class_standing", [slot("morning", 540, 660), slot("afternoon", 840, 960)]),
    ]);
    expect(resolved).toMatchObject({ resolved_from: "day_override" });
    expect(resolved!.slots.map((s) => s.slot_ref)).toEqual(["morning"]);
  });

  it("falls to the standing override, then to the institution default", () => {
    expect(
      resolve([
        layer("class_standing", [slot("standing", 540, 660)]),
        layer("institution_default", [slot("default", 600, 720)]),
      ]),
    ).toMatchObject({ resolved_from: "class_standing" });
    expect(resolve([layer("institution_default", [slot("default", 600, 720)])])).toMatchObject({
      resolved_from: "institution_default",
    });
  });

  it("resolves nothing when no layer exists at any level", () => {
    expect(resolve([])).toBeNull();
  });

  /**
   * 0D-2 §5 requires the version to increment when the resolution changes.
   * Taking the winner's own timestamp would move it BACKWARDS when a newer
   * high-precedence layer is removed and an older low-precedence one takes
   * over — so it is the max across every candidate layer.
   */
  it("takes the version from the newest candidate layer, not the winning one", () => {
    const withOverride = resolve([
      layer("day_override", [slot("a", 540, 660)], 500),
      layer("class_standing", [slot("b", 540, 660)], 900),
    ]);
    expect(withOverride).toMatchObject({ resolved_from: "day_override", schedule_version: 900 });

    // The override is soft-deleted, which advances its updatedAt. The standing
    // layer now wins and the version still moves forward.
    const afterRemoval = resolve([
      layer("day_override", [], 1200),
      layer("class_standing", [slot("b", 540, 660)], 900),
    ]);
    expect(afterRemoval!.schedule_version).toBeGreaterThan(withOverride!.schedule_version);
  });
});

describe("0D-2 placement precedence (G4-B increment 4)", () => {
  const schedule = (
    resolved_from: NurtureScheduleLayer["resolved_from"] = "class_standing",
    slots = [slot("morning", 540, 660), slot("afternoon", 840, 960)],
  ) => resolve([layer(resolved_from, slots)]);

  const place = (occurred_at_minute: number, extras: Record<string, unknown> = {}, sched = schedule()) =>
    decideActivityPlacement({
      source: { source_kind: "care_capture", source_id: "s1", occurred_at_minute, ...extras },
      schedule: sched,
    });

  it("level 1 — a bound activity ignores every later level", () => {
    // Outside every window, and the schedule would otherwise say unplaced.
    expect(place(1200, { bound_activity_ref: "bound" })).toEqual({
      state: "placed",
      activity_ref: "bound",
      decided_by: "source_binding",
    });
  });

  it("level 3 — places into the slot whose window contains the source", () => {
    expect(place(600)).toEqual({
      state: "placed",
      activity_ref: "morning",
      decided_by: "schedule_window",
    });
  });

  it("records a day-override placement distinctly from a standing one", () => {
    expect(place(600, {}, schedule("day_override"))).toMatchObject({
      decided_by: "day_override",
    });
  });

  it("treats the window as half-open, so a boundary lands in exactly one slot", () => {
    // 660 is morning's end and would be in both if the test were inclusive.
    expect(place(660)).toMatchObject({ state: "unplaced" });
    expect(place(659)).toMatchObject({ activity_ref: "morning" });
    expect(place(840)).toMatchObject({ activity_ref: "afternoon" });
  });

  it("level 5 — unplaced when outside every window, never a nearest guess", () => {
    expect(place(1200)).toMatchObject({ state: "unplaced" });
  });

  it("level 5 — unplaced when no schedule resolves at all", () => {
    expect(place(600, {}, null)).toMatchObject({ state: "unplaced" });
  });

  /**
   * 0D-2 §4's open point, closed as not-enabled. The union keeps `assisted` so
   * turning it on later is a gate rather than a shape change; nothing here may
   * emit it today.
   */
  it("never emits an assisted decision", () => {
    const decisions = [
      place(600),
      place(1200),
      place(600, { bound_activity_ref: "bound" }),
      place(600, {}, null),
      place(600, {}, schedule("day_override")),
    ];
    for (const decision of decisions) {
      expect(decision.decided_by).not.toBe("assisted");
    }
  });
});

describe("0D-2 placement concurrency (G4-B increment 4)", () => {
  const stored = (overrides: Partial<NurtureStoredPlacement> = {}): NurtureStoredPlacement => ({
    state: "placed",
    activity_ref: "morning",
    decided_by: "schedule_window",
    placement_head: 1,
    ...overrides,
  });

  /**
   * The frozen rule, enforced in exactly one place. Eligibility is what
   * protects an Admin decision — `shouldApplyAutomaticPlacement` is about
   * whether the decision changed, not about who made it.
   */
  it("never lets an automatic pass consider an Admin decision", () => {
    expect(isEligibleForAutomaticPass(stored({ decided_by: "admin" }))).toBe(false);
    // Including one the Admin deliberately left unplaced.
    expect(
      isEligibleForAutomaticPass(
        stored({ state: "unplaced", activity_ref: undefined, decided_by: "admin" }),
      ),
    ).toBe(false);
  });

  it("is a no-op when the automatic decision matches what is stored", () => {
    // Re-running intake is normal. Writing anyway would increment the head and
    // manufacture a revision for a decision that did not move.
    expect(
      shouldApplyAutomaticPlacement(stored(), {
        state: "placed",
        activity_ref: "morning",
        decided_by: "schedule_window",
      }),
    ).toBe(false);
  });

  it("applies when there is no placement yet or the decision changed", () => {
    expect(
      shouldApplyAutomaticPlacement(null, {
        state: "placed",
        activity_ref: "morning",
        decided_by: "schedule_window",
      }),
    ).toBe(true);
    expect(
      shouldApplyAutomaticPlacement(stored(), {
        state: "placed",
        activity_ref: "afternoon",
        decided_by: "schedule_window",
      }),
    ).toBe(true);
    expect(
      shouldApplyAutomaticPlacement(stored({ state: "unplaced", activity_ref: undefined }), {
        state: "placed",
        activity_ref: "morning",
        decided_by: "schedule_window",
      }),
    ).toBe(true);
  });

  /**
   * 0D-2 §5: a schedule version change does not re-place already-placed
   * sources. Doing so would rewrite history to match a schedule that was not
   * in force when the source arrived.
   */
  it("re-runs only over unplaced sources, never over placed ones", () => {
    expect(isEligibleForAutomaticPass(null)).toBe(true);
    expect(isEligibleForAutomaticPass(stored({ state: "unplaced", activity_ref: undefined }))).toBe(
      true,
    );
    expect(isEligibleForAutomaticPass(stored())).toBe(false);
  });
});
