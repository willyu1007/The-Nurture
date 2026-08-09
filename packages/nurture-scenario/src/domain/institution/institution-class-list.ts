import { resolveAggregate, type NurtureAggregateResult } from "./institution-aggregate.js";
import {
  selectLatestPhoto,
  type NurtureClassPhotoCandidate,
  type NurtureEffectiveSchedule,
  type NurtureLatestPhotoSelection,
} from "./class-schedule-placement.js";
import type { NurtureAggregateMember, NurturePolicyReasonCode } from "./institution-context.js";

/**
 * G4-B increment 3 — the Admin class list, read-only.
 *
 * `02-architecture.md` D-05: the class card is an entry point to current state,
 * not a KPI panel. This builds the list and the two facts a card can carry
 * today; the activity, schedule and photo fields wait for 0D-2's tables, which
 * are planned and unapplied. Shipping them as empty placeholders would fix a
 * shape before anything can fill it.
 *
 * Everything here is a read. No function in this module writes, and the port
 * it depends on has no write method.
 */

/**
 * The ordering 0C-5 §6 froze, and the first place fixture 14 can be observed.
 *
 * Derived from **stable class attributes** — `ageBandKey`, then `name` — and
 * never from state. An Admin opens this many times a day, so position is
 * spatial memory: the marker does triage, the position does location. A list
 * that re-sorts as counts move destroys that and reads as a ranking.
 */
export type NurtureClassListOrderKey = {
  care_group_ref: string;
  age_band_key: string | null;
  name: string;
};

export const orderClassList = <T extends NurtureClassListOrderKey>(classes: T[]): T[] =>
  [...classes].sort((left, right) => {
    // A class with no age band sorts after those that have one, deterministically
    // rather than by whatever the database returned.
    const band = (left.age_band_key ?? "￿").localeCompare(right.age_band_key ?? "￿");
    if (band !== 0) return band;
    const byName = left.name.localeCompare(right.name);
    // Ties fall to the ref so the order is total. Two classes with the same
    // band and name would otherwise sort unstably between reads.
    return byName !== 0 ? byName : left.care_group_ref.localeCompare(right.care_group_ref);
  });

/**
 * The attendance fact a card may show.
 *
 * A discriminated union rather than a state plus optional counts, because the
 * `unsubmitted` arm must have **nowhere** to put a number. `02-architecture.md`
 * D-05 is explicit: an unsubmitted day shows "awaiting the teacher's
 * confirmation" and returns no Admin-facing AI inference count. The inference
 * built in increment 2 is for the teacher who confirms it, and an Admin seeing
 * a predicted figure would be reading a guess as a fact.
 */
export type NurtureClassAttendanceSummary =
  | { state: "unsubmitted" }
  | { state: "submitted" | "reopened"; confirmed_present_count: number }
  | { state: "unavailable"; reason_code: NurturePolicyReasonCode };

/**
 * Counts of the Admin's own outstanding work at this entry point.
 *
 * 0C-5 §6 records the tension plainly: these let an Admin compare classes by
 * reading them, and they stay because they measure what the Admin still has to
 * do rather than how a class or a teacher performed. What they must never do
 * is drive an ordering — that is what turns an entry point into a ranking.
 */
export type NurtureClassPendingCounts = {
  awaiting_response: number;
  new_family_feedback: number;
  institution_action_needed: number;
};

/**
 * The schedule facts a card shows. Absent when the class has no layer at any
 * level — an empty state, never an invented default day.
 */
export type NurtureClassScheduleSummary = {
  schedule_version: number;
  resolved_from: NurtureEffectiveSchedule["resolved_from"];
  /** 0D-2 §3's indicator: today's schedule is a one-day override. */
  has_temporary_override: boolean;
  current_activity?: { activity_ref: string; label: string };
  next_activity?: { activity_ref: string; label: string };
};

/**
 * `InstitutionClassCardProjectionV1` — `02-architecture.md` D-05.
 *
 * The card is an entry point to current state, not a KPI panel. What it must
 * never carry, and has no field for: communication bodies, child rosters,
 * automatic-match confidence, raw biometrics, teacher-level statistics, and any
 * freshness or performance score. Source timestamps are the business record's
 * own capture time, never compressed into a freshness figure.
 */
export type NurtureInstitutionClassCard = {
  contract_version: "1.0.0";
  care_group_ref: string;
  safe_class_label: string;
  schedule: NurtureClassScheduleSummary | null;
  attendance: NurtureClassAttendanceSummary;
  latest_photo?: NurtureLatestPhotoSelection;
  /**
   * Presence and time only.
   *
   * `02-architecture.md` names a "latest text excerpt", but the only stored
   * text a class capture carries is `bodyProtectionPayload` — protected
   * content, whose release is an authority decision this projection does not
   * make. Emitting a timestamp without a body is the honest half; the excerpt
   * waits for an actor-safe summary that a capture does not yet have.
   */
  latest_text?: { source_timestamp_ms: number };
  pending: NurtureClassPendingCounts;
  projection_version: 1;
};

/** Kept as the list-level alias so existing consumers do not break. */
export type NurtureInstitutionClassListEntry = NurtureInstitutionClassCard;

export type NurtureInstitutionClassList = {
  contract_version: "1.0.0";
  institution_ref: string;
  local_date: string;
  entries: NurtureInstitutionClassCard[];
};

/**
 * Which slot is running and which is next, at a given minute of the class's
 * own day.
 *
 * "Next" is the earliest slot that starts after now, which is not always the
 * one after the current slot — a gap in the day means there is a next activity
 * while no current one.
 */
const activityWindowAt = (
  schedule: NurtureEffectiveSchedule | null,
  at_minute: number,
): { current?: { activity_ref: string; label: string }; next?: { activity_ref: string; label: string } } => {
  if (!schedule) return {};
  const current = schedule.slots.find(
    (slot) => at_minute >= slot.starts_at_minute && at_minute < slot.ends_at_minute,
  );
  const next = [...schedule.slots]
    .filter((slot) => slot.starts_at_minute > at_minute)
    .sort((left, right) => left.starts_at_minute - right.starts_at_minute)[0];
  return {
    ...(current ? { current: { activity_ref: current.slot_ref, label: current.label } } : {}),
    ...(next ? { next: { activity_ref: next.slot_ref, label: next.label } } : {}),
  };
};

/**
 * The read port. Every method is a read; there is no write to omit.
 */
export type NurtureInstitutionClassListRepository = {
  listClasses(input: {
    workspace_id: string;
    institution_ref: string;
  }): Promise<Array<NurtureClassListOrderKey & { safe_class_label: string }>>;
  loadClassAttendance(input: {
    workspace_id: string;
    care_group_ref: string;
    local_date: string;
  }): Promise<
    | { state: "unsubmitted" }
    | { state: "submitted" | "reopened"; entries: Array<{ member_ref: string; present: boolean }> }
  >;
  /** The population and its grant terms, exactly as the aggregate rule needs. */
  loadAttendanceReadPopulation(input: {
    workspace_id: string;
    institution_ref: string;
    care_group_ref: string;
    local_date: string;
  }): Promise<NurtureAggregateMember[]>;
  loadPendingCounts(input: {
    workspace_id: string;
    care_group_ref: string;
    local_date: string;
  }): Promise<NurtureClassPendingCounts>;
  /** The class's effective schedule for the day, or null when it has none. */
  loadClassSchedule(input: {
    workspace_id: string;
    institution_ref: string;
    care_group_ref: string;
    local_date: string;
  }): Promise<NurtureEffectiveSchedule | null>;
  /**
   * Photos that already pass the reader's chain at CLASS level — the asset
   * belongs to this class and its lifecycle is live. Child-level attribution
   * is a different question and does not gate a class photo.
   */
  loadPhotoCandidates(input: {
    workspace_id: string;
    care_group_ref: string;
    local_date: string;
  }): Promise<NurtureClassPhotoCandidate[]>;
  /** When the class's newest text record was captured, or null if none. */
  loadLatestTextAt(input: {
    workspace_id: string;
    care_group_ref: string;
    local_date: string;
  }): Promise<number | null>;
};

/**
 * Composes the list an Admin sees.
 *
 * The confirmed-present count is an aggregate in 0C-5 §5's sense — it
 * compresses several members' facts into one number — so it runs through
 * `resolveAggregate` and returns `unavailable` rather than a figure over the
 * readable members. 0D-1 §4 says so directly, and this is the first consumer
 * that has a class list to say it about.
 */
export class NurtureInstitutionClassListService {
  constructor(private readonly repository: NurtureInstitutionClassListRepository) {}

  async compose(input: {
    workspace_id: string;
    institution_ref: string;
    local_date: string;
    /**
     * Minutes from the class's local midnight. Passed in rather than read from
     * the clock so the whole projection is a pure function of its inputs and a
     * test can place "now" anywhere in the day.
     */
    at_minute: number;
    ask: Parameters<typeof resolveAggregate>[1];
  }): Promise<NurtureInstitutionClassList> {
    const classes = await this.repository.listClasses({
      workspace_id: input.workspace_id,
      institution_ref: input.institution_ref,
    });

    const entries = await Promise.all(
      orderClassList(classes).map(async (klass) => {
        const scope = {
          workspace_id: input.workspace_id,
          care_group_ref: klass.care_group_ref,
          local_date: input.local_date,
        };
        const [attendance, pending, schedule, candidates, latestTextAt] = await Promise.all([
          this.attendanceFor(input, klass.care_group_ref),
          this.repository.loadPendingCounts(scope),
          this.repository.loadClassSchedule({
            ...scope,
            institution_ref: input.institution_ref,
          }),
          this.repository.loadPhotoCandidates(scope),
          this.repository.loadLatestTextAt(scope),
        ]);
        const window = activityWindowAt(schedule, input.at_minute);
        const photo = selectLatestPhoto({
          schedule,
          candidates,
          ...(window.current ? { current_activity_ref: window.current.activity_ref } : {}),
        });
        return {
          contract_version: "1.0.0" as const,
          care_group_ref: klass.care_group_ref,
          safe_class_label: klass.safe_class_label,
          schedule: schedule
            ? {
                schedule_version: schedule.schedule_version,
                resolved_from: schedule.resolved_from,
                has_temporary_override: schedule.resolved_from === "day_override",
                ...(window.current ? { current_activity: window.current } : {}),
                ...(window.next ? { next_activity: window.next } : {}),
              }
            : null,
          attendance,
          ...(photo ? { latest_photo: photo } : {}),
          ...(latestTextAt !== null ? { latest_text: { source_timestamp_ms: latestTextAt } } : {}),
          pending,
          projection_version: 1 as const,
        };
      }),
    );

    return {
      contract_version: "1.0.0",
      institution_ref: input.institution_ref,
      local_date: input.local_date,
      // Ordered once, above. Composing per class must not reorder — the whole
      // point is that the sequence does not depend on what was found.
      entries,
    };
  }

  private async attendanceFor(
    input: { workspace_id: string; institution_ref: string; local_date: string; ask: Parameters<typeof resolveAggregate>[1] },
    care_group_ref: string,
  ): Promise<NurtureClassAttendanceSummary> {
    const stored = await this.repository.loadClassAttendance({
      workspace_id: input.workspace_id,
      care_group_ref,
      local_date: input.local_date,
    });
    // An unsubmitted day is answered without reading a single member fact.
    // There is nothing to aggregate and nothing to refuse — and no arm of the
    // union where a predicted count could be placed.
    if (stored.state === "unsubmitted") return { state: "unsubmitted" };

    const population = await this.repository.loadAttendanceReadPopulation({
      workspace_id: input.workspace_id,
      institution_ref: input.institution_ref,
      care_group_ref,
      local_date: input.local_date,
    });
    const present = new Set(
      stored.entries.filter((entry) => entry.present).map((entry) => entry.member_ref),
    );
    const aggregate: NurtureAggregateResult = resolveAggregate(population, input.ask, (member) =>
      present.has(member.member_ref) ? 1 : 0,
    );
    return aggregate.status === "available"
      ? { state: stored.state, confirmed_present_count: aggregate.value }
      : { state: "unavailable", reason_code: aggregate.reason_code };
  }
}
