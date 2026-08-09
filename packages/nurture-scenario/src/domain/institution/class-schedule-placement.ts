/**
 * G4-B increment 4 — class schedule resolution and activity placement, frozen
 * by 0D-2 (27-g4-0d-2-schedule-placement-freeze.md).
 *
 * Both rules are pure. The repository reads layers and sources and writes the
 * outcome; which layer wins and where a source lands is decided here, so the
 * whole state space is reachable from unit tests.
 */

export type NurtureScheduleSlot = {
  slot_ref: string;
  label: string;
  /** Minutes from local midnight, so a slot compares without a timezone. */
  starts_at_minute: number;
  ends_at_minute: number;
};

export type NurtureScheduleLayer = {
  resolved_from: "day_override" | "class_standing" | "institution_default";
  slots: NurtureScheduleSlot[];
  /**
   * The layer's own last-modified instant, in epoch milliseconds. The
   * effective schedule's version is the max of these across every layer that
   * could resolve — see `resolveEffectiveSchedule`.
   */
  updated_at_ms: number;
};

export type NurtureEffectiveSchedule = {
  contract_version: "1.0.0";
  care_group_ref: string;
  local_date: string;
  schedule_version: number;
  resolved_from: NurtureScheduleLayer["resolved_from"];
  slots: NurtureScheduleSlot[];
};

/**
 * 0D-2 §4. Exactly one winner, in fixed order, **with no merging**.
 *
 * A day override covering part of the day does not compose with the standing
 * override for the rest — it wins entirely. Composition would make "which
 * schedule was in force" unanswerable, and that is the question placement and
 * review both depend on.
 *
 * `schedule_version` is the **max `updated_at_ms` across every candidate
 * layer**, not the winner's alone. Taking the winner's would move backwards
 * when a newer high-precedence layer is removed and an older low-precedence
 * one takes over, and 0D-2 §5 requires the version to increment. Because layer
 * removal is a soft delete, removing a layer also advances its `updated_at`,
 * so the max only ever moves forward.
 */
export const resolveEffectiveSchedule = (input: {
  care_group_ref: string;
  local_date: string;
  layers: NurtureScheduleLayer[];
}): NurtureEffectiveSchedule | null => {
  const precedence: NurtureScheduleLayer["resolved_from"][] = [
    "day_override",
    "class_standing",
    "institution_default",
  ];
  // A layer that exists but carries no slots cannot win — that is how a
  // withdrawn layer steps aside while still counting toward the version below.
  const winner = precedence
    .map((level) =>
      input.layers.find((layer) => layer.resolved_from === level && layer.slots.length > 0),
    )
    .find((layer): layer is NurtureScheduleLayer => layer !== undefined);
  // No layer with slots at any level. 0D-2 §6: every source is `unplaced`,
  // never guessed into a slot.
  if (!winner || input.layers.length === 0) return null;

  return {
    contract_version: "1.0.0",
    care_group_ref: input.care_group_ref,
    local_date: input.local_date,
    schedule_version: Math.max(...input.layers.map((layer) => layer.updated_at_ms)),
    resolved_from: winner.resolved_from,
    slots: winner.slots,
  };
};

export type NurtureActivityPlacementDecidedBy =
  | "source_binding"
  | "day_override"
  | "schedule_window"
  | "assisted"
  | "admin";

/** Automatic intake may never synthesize the Admin precedence level. */
export type NurtureAutomaticActivityPlacementDecidedBy = Exclude<
  NurtureActivityPlacementDecidedBy,
  "admin"
>;

export type NurtureActivityPlacementResult =
  | { state: "placed"; activity_ref: string; decided_by: NurtureAutomaticActivityPlacementDecidedBy }
  | { state: "unplaced"; decided_by: NurtureAutomaticActivityPlacementDecidedBy };

export type NurturePlacementSource = {
  source_kind: string;
  source_id: string;
  /** Minutes from local midnight. */
  occurred_at_minute: number;
  /** Level 1: an activity the source already carries. */
  bound_activity_ref?: string;
};

/**
 * 0D-2 §4's five levels, minus the fourth.
 *
 * Level 4 — assisted semantic judgement — is **frozen in the union and not
 * enabled** (0D-2 §4, open point closed 2026-08-09). A wrong placement is a
 * presentation error rather than a disclosure, the backlog it would relieve is
 * assumed rather than measured, and levels 1-3 are deterministic where it is
 * not. Nothing in this function can emit `assisted`, and a fixture asserts so,
 * which is what makes enabling it later a visible change rather than a drift.
 */
export const decideActivityPlacement = (input: {
  source: NurturePlacementSource;
  schedule: NurtureEffectiveSchedule | null;
}): NurtureActivityPlacementResult => {
  // Level 1: the activity the source is already bound to. It ignores every
  // later level — a source that says where it belongs is not re-examined.
  if (input.source.bound_activity_ref) {
    return {
      state: "placed",
      activity_ref: input.source.bound_activity_ref,
      decided_by: "source_binding",
    };
  }

  // Levels 2 and 3 are the same test against different layers, because the
  // resolver already picked which layer is in force. `decided_by` records
  // which one it was, so a review can tell a day-specific placement from a
  // standing one without re-resolving.
  if (input.schedule) {
    const slot = input.schedule.slots.find(
      (candidate) =>
        input.source.occurred_at_minute >= candidate.starts_at_minute &&
        input.source.occurred_at_minute < candidate.ends_at_minute,
    );
    if (slot) {
      return {
        state: "placed",
        activity_ref: slot.slot_ref,
        decided_by:
          input.schedule.resolved_from === "day_override" ? "day_override" : "schedule_window",
      };
    }
  }

  // Level 5. Not an absence — a state, in the source's own class, visible and
  // awaiting resolution. Level 4 would sit above this and is disabled.
  return { state: "unplaced", decided_by: "schedule_window" };
};

export type NurtureStoredPlacement = {
  state: "placed" | "unplaced";
  activity_ref?: string;
  decided_by: NurtureActivityPlacementDecidedBy;
  placement_head: number;
};

/**
 * Whether an automatic pass may consider this source at all — 0D-2 §5's two
 * protections, and the **only** place either is enforced.
 *
 * **A `decided_by: "admin"` placement is never revisited.** Without that the
 * next intake would silently revert a human correction, and the revision chain
 * would show a change nobody made. It holds whether the Admin placed the
 * source or deliberately left it unplaced.
 *
 * **An already-placed source is not re-placed when the schedule moves.** That
 * would rewrite history to match a schedule which was not in force when the
 * source arrived. What a new schedule may absorb is the `unplaced` backlog.
 */
export const isEligibleForAutomaticPass = (current: NurtureStoredPlacement | null): boolean =>
  current === null || (current.state === "unplaced" && current.decided_by !== "admin");

/**
 * Whether the automatic decision actually differs from what is stored.
 *
 * Narrowly about change, and deliberately **not** about authority: repeating
 * the admin test here would be a second copy of a rule
 * `isEligibleForAutomaticPass` already owns, and one that nothing could reach
 * — every caller filters through eligibility first. Falsification found it
 * that way: removing the duplicate turned a unit test red and no DB test,
 * because the real call chain never got there.
 *
 * A re-run that decides the same thing is a **no-op**, not an error. Intake
 * re-running is normal, and writing anyway would increment the head and
 * manufacture a revision for a decision that did not move.
 */
export const shouldApplyAutomaticPlacement = (
  current: NurtureStoredPlacement | null,
  next: NurtureActivityPlacementResult,
): boolean => {
  if (!current) return true;
  const sameSlot =
    current.state === next.state &&
    (current.activity_ref ?? null) === (next.state === "placed" ? next.activity_ref : null);
  return !sameSlot;
};


/**
 * The storage port. Every method is IO — no rule lives behind it, and nothing
 * here decides anything.
 */
export type NurtureClassSchedulePlacementRepository = {
  /**
   * Every layer that could resolve for this class/date, **including
   * soft-deleted ones**. A removed layer contributes no slots but does
   * contribute its timestamp, which is what keeps the version moving forward
   * when a layer is withdrawn rather than jumping back to an older one's.
   */
  loadScheduleLayers(input: {
    workspace_id: string;
    institution_ref: string;
    care_group_ref: string;
    local_date: string;
  }): Promise<NurtureScheduleLayer[]>;
  loadPlacement(input: {
    workspace_id: string;
    source_kind: string;
    source_id: string;
    care_group_ref: string;
    local_date: string;
  }): Promise<NurtureStoredPlacement | null>;
  /** False when a concurrent or out-of-scope placement already owns the source. */
  writePlacement(input: {
    workspace_id: string;
    source_kind: string;
    source_id: string;
    care_group_ref: string;
    local_date: string;
    state: "placed" | "unplaced";
    activity_ref: string | null;
    decided_by: NurtureAutomaticActivityPlacementDecidedBy;
  }): Promise<boolean>;
};

/**
 * Resolution and the automatic pass, composed.
 *
 * The orchestration lives here rather than in the repository so the repository
 * imports nothing at runtime — a data layer that pulls in the domain's values
 * also pulls in its whole module graph, which is how a typecheck of this
 * package started compiling a sibling repository's files.
 */
export class NurtureClassScheduleService {
  constructor(private readonly repository: NurtureClassSchedulePlacementRepository) {}

  async effectiveSchedule(input: {
    workspace_id: string;
    institution_ref: string;
    care_group_ref: string;
    local_date: string;
  }): Promise<NurtureEffectiveSchedule | null> {
    // Handed over whole. Which layer wins and what the version is are both the
    // resolver's decisions — computing either here would be a second copy that
    // could disagree, and an earlier draft of this service did exactly that.
    return resolveEffectiveSchedule({
      care_group_ref: input.care_group_ref,
      local_date: input.local_date,
      layers: await this.repository.loadScheduleLayers(input),
    });
  }

  /**
   * Runs at intake and after a schedule change, and is a no-op wherever 0D-2
   * says it must be: over an Admin decision, over an already-placed source,
   * and over a decision that did not move.
   */
  async runAutomaticPass(input: {
    workspace_id: string;
    institution_ref: string;
    care_group_ref: string;
    local_date: string;
    sources: NurturePlacementSource[];
  }): Promise<{ applied: number; skipped: number }> {
    const schedule = await this.effectiveSchedule(input);
    let applied = 0;
    let skipped = 0;
    for (const source of input.sources) {
      const current = await this.repository.loadPlacement({
        workspace_id: input.workspace_id,
        source_kind: source.source_kind,
        source_id: source.source_id,
        care_group_ref: input.care_group_ref,
        local_date: input.local_date,
      });
      if (!isEligibleForAutomaticPass(current)) {
        skipped += 1;
        continue;
      }
      const decision = decideActivityPlacement({ source, schedule });
      if (!shouldApplyAutomaticPlacement(current, decision)) {
        skipped += 1;
        continue;
      }
      const written = await this.repository.writePlacement({
        workspace_id: input.workspace_id,
        source_kind: source.source_kind,
        source_id: source.source_id,
        care_group_ref: input.care_group_ref,
        local_date: input.local_date,
        state: decision.state,
        activity_ref: decision.state === "placed" ? decision.activity_ref : null,
        decided_by: decision.decided_by,
      });
      if (written) applied += 1;
      else skipped += 1;
    }
    return { applied, skipped };
  }
}

/**
 * A photo that has ALREADY passed the reader's own 0C chain.
 *
 * The filter is the caller's, deliberately: "qualifying" is reader-specific,
 * and a selection function that took unfiltered candidates would have to be
 * trusted to apply authority it does not own. 0D-2 §4 restates 0C-5 §5's
 * no-bypass rule for exactly this — a photo the reader could not open directly
 * is never selected as a cover.
 */
export type NurtureClassPhotoCandidate = {
  media_ref: string;
  /** The activity it was placed into, or absent when it is `unplaced`. */
  activity_ref?: string;
  captured_at_ms: number;
};

export type NurtureLatestPhotoSelection = {
  media_ref: string;
  captured_at_ms: number;
  /**
   * `class_latest` is level 4 and carries no activity — a consumer can tell a
   * photo that belongs to an activity from one that does not.
   */
  selected_by:
    | "explicit_cover"
    | "current_activity"
    | "most_recent_activity"
    | "class_latest";
};

const newestOf = (
  candidates: NurtureClassPhotoCandidate[],
): NurtureClassPhotoCandidate | undefined =>
  candidates.reduce<NurtureClassPhotoCandidate | undefined>(
    (newest, candidate) =>
      // Ties break on media_ref so the selection is deterministic: two photos
      // sharing a capture instant must not alternate between reads.
      !newest ||
      candidate.captured_at_ms > newest.captured_at_ms ||
      (candidate.captured_at_ms === newest.captured_at_ms &&
        candidate.media_ref.localeCompare(newest.media_ref) > 0)
        ? candidate
        : newest,
    undefined,
  );

/**
 * 0D-2 §4's latest-photo selection, resolved inside one class-day snapshot.
 *
 * Deterministic throughout: no aesthetic judgement, no generative model, no
 * cropping or face framing, and no asking a teacher to pick. The card gets
 * whichever photo the ordering names, or none.
 *
 * **Level 1 has no writer yet.** The explicit cover is set from the Admin
 * workbench, which is G4-C's surface, and 0D-2 planned no table for it. The
 * parameter exists so adding that capability is a gate rather than a shape
 * change — and a cover is honoured only if it is among the candidates, which
 * is how "its source, authority and lifecycle are all still valid" is enforced
 * without a second check that could disagree.
 */
export const selectLatestPhoto = (input: {
  schedule: NurtureEffectiveSchedule | null;
  current_activity_ref?: string;
  candidates: NurtureClassPhotoCandidate[];
  cover_media_ref?: string;
}): NurtureLatestPhotoSelection | null => {
  // Level 1.
  if (input.cover_media_ref) {
    const cover = input.candidates.find(
      (candidate) => candidate.media_ref === input.cover_media_ref,
    );
    if (cover) {
      return {
        media_ref: cover.media_ref,
        captured_at_ms: cover.captured_at_ms,
        selected_by: "explicit_cover",
      };
    }
    // A cover whose media no longer qualifies falls through rather than
    // blocking the card — 0D-2 §6.
  }

  // Level 2.
  if (input.current_activity_ref) {
    const inCurrent = newestOf(
      input.candidates.filter(
        (candidate) => candidate.activity_ref === input.current_activity_ref,
      ),
    );
    if (inCurrent) {
      return {
        media_ref: inCurrent.media_ref,
        captured_at_ms: inCurrent.captured_at_ms,
        selected_by: "current_activity",
      };
    }
  }

  // Level 3 — the class's most recent ACTIVITY that has a photo, walked in
  // schedule order rather than by capture time. A late upload does not make
  // its activity the most recent one, and 0D-2 says "most recent activity",
  // not "most recent photo".
  if (input.schedule) {
    const byLatestFirst = [...input.schedule.slots].sort(
      (left, right) => right.starts_at_minute - left.starts_at_minute,
    );
    for (const candidateSlot of byLatestFirst) {
      const inSlot = newestOf(
        input.candidates.filter((candidate) => candidate.activity_ref === candidateSlot.slot_ref),
      );
      if (inSlot) {
        return {
          media_ref: inSlot.media_ref,
          captured_at_ms: inSlot.captured_at_ms,
          selected_by: "most_recent_activity",
        };
      }
    }
  }

  // Level 4 — the class's newest qualifying photo, placed or not.
  //
  // Added by 0D-2 §4's amendment of 2026-08-09, after implementing levels 1-3
  // showed that a class with **no schedule** places every source as
  // `unplaced`, and an unplaced photo belongs to no activity — so such a class
  // showed nothing even when it had photos, and "see your class photos" had
  // acquired an undeclared dependency on "configure a schedule first".
  //
  // Deterministic like every level above it, and deliberately BELOW them: a
  // scheduled class whose activities hold photos never reaches here.
  const anyPhoto = newestOf(input.candidates);
  if (anyPhoto) {
    return {
      media_ref: anyPhoto.media_ref,
      captured_at_ms: anyPhoto.captured_at_ms,
      selected_by: "class_latest",
    };
  }

  // Level 5 — no image. The card falls back to its newest text or to an empty
  // state, which is the card's decision and not this function's.
  return null;
};
