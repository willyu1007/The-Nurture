import { resolveAggregate, type NurtureAggregateResult } from "./institution-aggregate.js";
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

export type NurtureInstitutionClassListEntry = {
  contract_version: "1.0.0";
  care_group_ref: string;
  safe_class_label: string;
  attendance: NurtureClassAttendanceSummary;
  pending: NurtureClassPendingCounts;
};

export type NurtureInstitutionClassList = {
  contract_version: "1.0.0";
  institution_ref: string;
  local_date: string;
  entries: NurtureInstitutionClassListEntry[];
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
    ask: Parameters<typeof resolveAggregate>[1];
  }): Promise<NurtureInstitutionClassList> {
    const classes = await this.repository.listClasses({
      workspace_id: input.workspace_id,
      institution_ref: input.institution_ref,
    });

    const entries = await Promise.all(
      orderClassList(classes).map(async (klass) => {
        const [attendance, pending] = await Promise.all([
          this.attendanceFor(input, klass.care_group_ref),
          this.repository.loadPendingCounts({
            workspace_id: input.workspace_id,
            care_group_ref: klass.care_group_ref,
            local_date: input.local_date,
          }),
        ]);
        return {
          contract_version: "1.0.0" as const,
          care_group_ref: klass.care_group_ref,
          safe_class_label: klass.safe_class_label,
          attendance,
          pending,
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
