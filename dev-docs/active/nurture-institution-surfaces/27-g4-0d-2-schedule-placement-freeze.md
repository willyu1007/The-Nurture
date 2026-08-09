# G4-0D-2 Class Schedule & Activity Placement — Freeze Record

## Status

- Date: 2026-08-09
- Task: T-007
- Unit: 0D-2, parallel to 0D-1 ([`25-g4-0d-scope-freeze.md`](./25-g4-0d-scope-freeze.md))
- Contract identity: `nurture.class-schedule-placement@1.0.0`
- Consumes: class scope (0C-3) unchanged
- Verdict: `G4_0D_2_FREEZE_PASS`
- Releases: G4-B (class-first board), G4-C (activity records in Web), 0D-3
- Open points: **closed** 2026-08-09 — §4 by shipping levels 1-3-5 and leaving
  assisted placement disabled until `unplaced` is measured
- Schema delta: **`DELTA`** — planned below, not applied
- Non-effects: no code, schema apply, migration, capability, manifest, secret,
  deployment, activation or traffic.

## 1. Owner, consumer and exact source

| Role | Party | Exact ref |
| --- | --- | --- |
| Canonical owner of schedule and placement | Nurture Institution + Care/Content domains | this record |
| Placed sources | Nurture Content domain | `NurtureCareCapture` (photo and text), `NurtureDailyCareLog` |
| Authority | 0C chain | [`13`](./13-g4-0c-3-class-child-scope-freeze.md) and its inputs |
| Consumers | G4-B, G4-C, 0D-3 | — |
| Product source | `02-architecture.md` "Class schedule and activity placement", "Latest-photo selection" | — |

As with 0D-1, the surface contract at `1.18.0` carries no schedule or placement
capability among its 34.

## 2. Type boundaries

| Type | Class | Rule |
| --- | --- | --- |
| `EffectiveScheduleProjection` | derived projection, **versioned** | Exactly one per class/date. Resolved, never authored directly. |
| `ActivityPlacement` | canonical | Which activity a source sits in, with the precedence level that decided it. |
| `unplaced` | **a placement state, not an absence** | A source that could not be placed stays in its own class as `unplaced`, visible and awaiting resolution. |
| `LatestPhotoSelection` | derived projection | Computed inside one frozen class-day snapshot. |

Two invariants:

- **Missing records never mean "no activity".** No record, a delayed upload and
  an unplaced source are three different facts, and none of them is evidence
  that an activity did not happen. A presenter that renders any of them as
  "activity not held" reopens this unit. This is the rule most likely to be
  violated by a well-meaning empty state.
- **`unplaced` stays in the exact class.** An uncertain source is never moved to
  another class, promoted to the institution, or dropped. Uncertainty resolves
  by staying put and being visible.

## 3. Frozen shape

```text
EffectiveScheduleProjectionV1
  careGroupRef       opaque
  localDate          the class's own date, in the institution timezone
  scheduleVersion    monotonic per class/date
  resolvedFrom       "day_override" | "class_standing" | "institution_default"
  slots[]            { slotRef, label, startsAt, endsAt, activityRef? }
  contractVersion    "1.0.0"
```

```text
ActivityPlacementV1
  sourceRef          the capture or log placed
  careGroupRef       opaque; always the source's own class
  activityRef        absent when state is "unplaced"
  state              "placed" | "unplaced"
  decidedBy          "source_binding" | "day_override" | "schedule_window"
                   | "assisted" | "admin"
  placementHead      monotonic; every change increments
  contractVersion    "1.0.0"
```

`resolvedFrom` and `decidedBy` are on the record deliberately: a placement that
cannot say which rule produced it cannot be reviewed, and 0D-3's revision chain
needs the previous level to record a meaningful before/after.

**Fields a caller MUST NOT synthesize:** `scheduleVersion`, `placementHead`,
`decidedBy`. All are issued by Nurture.

## 4. Predicate

### Schedule resolution, exactly one winner

A class/date uses **one** versioned effective schedule, resolved in this fixed
order, each level failing to the next only when it is absent:

1. the day's override;
2. the class's standing override;
3. the institution default template.

No merging across levels. A day override that covers part of the day does not
compose with the standing override for the rest — it wins entirely. Composition
would make "which schedule was in force" unanswerable, which is the question
placement and review both depend on.

### Placement precedence, five levels

A photo, text or activity fact places **only within its own class scope**, in
this order:

1. the activity the source is already bound to;
2. the day's override;
3. the class's effective schedule and its time window;
4. assisted semantic judgement over the content — **frozen in the union but
   not enabled in the first increment**, see below;
5. otherwise `unplaced`, in this class.

**Open point CLOSED 2026-08-09: level 4 is not enabled in the first
increment.** Levels 1, 2, 3 and 5 ship; `decidedBy` keeps `"assisted"` in its
union so enabling level 4 later is a gate, not a shape change.

Three reasons, and the first reframes what was originally posed as a risk
trade-off.

**A wrong placement is a presentation error, not a disclosure.** Placement
decides which activity a source sits in; it does not change who may see the
source — that is attribution and publication. This is a materially smaller risk
than 0D-4's child attribution, where a wrong answer misroutes a child's photo
to another family, and it should not be weighed with the same caution.

**The backlog level 4 would relieve is assumed, not measured.** Level 3 matches
the class's effective schedule against a source's capture time, which should
absorb most photos in any class that has a schedule. What it cannot place is
what was captured outside every window, and classes with no schedule at all —
and level 4 cannot place the second group either, because with no schedule
there is no activity to place into. Shipping 1-3-5 turns the `unplaced` rate
into an observed number, after which enabling level 4 is a decision with
evidence rather than an estimate.

**Levels 1-3 are deterministic and level 4 is not.** A wrong deterministic
placement can be explained from the rule and the inputs; a wrong semantic
judgement can only be found by a person looking. Introducing an error source
that only human review can catch, before there is any production use or review
capacity, spends a real cost against a hypothetical gain.

It also keeps 0D internally consistent: 0D-1 holds that an AI inference never
writes a canonical fact without a teacher confirming it. Level 4 producing a
canonical placement directly would give two adjacent units in one branch two
different postures toward AI.

### Latest photo, inside one snapshot

Resolved within a single frozen class-day snapshot, in this order:

1. the current activity's explicit `coverMediaRef`, if its source, authority and
   lifecycle are all still valid;
2. the newest qualifying photo in the current activity;
3. the newest qualifying photo in this class's most recent activity that has
   one, today;
4. no image — the card falls back to the newest text, or to an empty state.

"Qualifying" means it passes the reader's own 0C chain. A photo the reader
could not open directly is never selected as a cover, which is 0C-5 §5's
no-bypass rule restated for a single-item selection.

### Capabilities

| Capability | Actor | Level reached |
| --- | --- | --- |
| `query_class_effective_schedule` | `institution_admin`, class caregiver | 0C-3 class scope |
| `query_class_activity_timeline` | `institution_admin`, class caregiver | 0C-3 class scope |
| `adjust_activity_placement` | `institution_admin` | 0C-3 class scope |

`adjust_activity_placement` is **owned by this unit** — its actor, its
precedence effect and its concurrency rule are frozen here. Its write **takes
0D-3's form**: appended as a `ContentRevision` with `subjectKind: "placement"`,
never applied in place. Admin may move a source between activities of the same
class; moving it to another class, or changing its author, capture time or
body, is outside every capability here.

**This unit emits no ordering** beyond the schedule's own start times, which
are stable class attributes rather than state. Nothing here derives an order
from counts, recency of activity, backlog or signal level.

## 5. Lifecycle, versioning and concurrency

**Schedule.** `scheduleVersion` increments when the resolved projection changes
for that class/date. A submitted attendance snapshot, a published board or a
0D-3 revision that cited a version keeps citing it; the version is what makes
"the schedule in force when this was decided" answerable after the fact.

**Placement.** `placementHead` increments on every change, including a move to
`unplaced`. `adjust_activity_placement` carries `expectedPlacementHead` and
rejects on mismatch rather than merging.

**Idempotency.** Placement adjustment carries a request id and is exact-replay
safe.

**Concurrency.** Automatic placement at intake and an Admin adjustment can race.
Frozen rule: **the Admin adjustment wins and automatic placement never
overwrites a level-`admin` decision.** A later automatic pass over the same
source is a no-op. Without this, an Admin correction would be silently reverted
by the next intake, and the revision chain would show a change nobody made.

**Schedule change does not re-place.** Sources already placed keep their
placement when the schedule version moves. Re-placing them would rewrite
history to match a schedule that was not in force when the source arrived.

## 6. Default-safe behavior

| Condition | Result |
| --- | --- |
| No effective schedule resolves for the class/date | every source is `unplaced`; never guessed into a slot |
| Source outside every time window | `unplaced` |
| Class scope unresolved | inherit 0C-3's deny |
| Owner unavailable | deny `unavailable`; never a partial timeline presented as complete |
| `expectedPlacementHead` mismatch | deny `conflict` |
| Admin attempts a cross-class move | deny `not_authorized` |
| Cover media fails the reader's chain | fall through to the next selection level |
| Contract version mismatch | deny `contract_mismatch` |

The empty state is the one to get right: a class with no schedule and no
records shows *no schedule and no records*, not "no activities today".

## 7. Fixtures and gates

1. a day override wins entirely over a standing override — no composition;
2. with no override at either level, the institution default resolves, and the
   projection says so in `resolvedFrom`;
3. with no schedule at any level, sources are `unplaced`, not placed by
   proximity;
4. a source already bound to an activity ignores every later level;
5. a source outside all windows is `unplaced` in its own class, never moved to
   another class;
6. no placement in the first increment carries `decidedBy: "assisted"`, so
   enabling level 4 is a visible change rather than a drift;
7. an Admin adjustment survives a subsequent automatic placement pass;
8. a schedule version change does not re-place already-placed sources;
9. `expectedPlacementHead` mismatch denies rather than merging;
10. a cover whose media fails the reader's chain falls through instead of being
    returned;
11. a class with no records renders as no records, and no presenter path emits
    "activity not held";
12. an unplaced backlog is visible in its own class and countable only through
    0C-5 §5's aggregate rule;
13. no response carries an ordering derived from counts, recency or backlog.

Synthetic fixtures under I0. Real owner paths stay behind I3, joint conformance
behind I4.

## 8. Schema delta

**`DELTA` — planned, not applied.** No schedule or placement model exists.
`NurtureActivityOption` is a T-002 generic shape (`canonicalObjectRef` plus a
JSON binding) and is **not** a class schedule; using it would conflate two
unrelated owners.

| Planned | Purpose |
| --- | --- |
| `NurtureClassScheduleTemplate` | institution default and class standing overrides |
| `NurtureClassScheduleDayOverride` | the day's override |
| `NurtureActivityPlacement` | source → activity, with state, `decidedBy` and head |

`EffectiveScheduleProjection` and `LatestPhotoSelection` are **derived and get
no table**; persisting a resolution would let it drift from the inputs that
produced it.

`NurtureCareCapture` gains no placement column: placement is its own row so a
source can be re-placed without touching the teacher's original capture, which
is what 0D-3 requires.

Migration authoring belongs to the G4-B/G4-C implementation gates. G4-0
executes no apply.

## Exit

`G4_0D_2_FREEZE_PASS` releases G4-B's class-first board, G4-C's Web activity
records, and 0D-3, which turns this unit's Admin adjustments into an
append-only chain. It does not open implementation, schema apply, capability
rotation, activation, deployment or traffic. The unit's single open point
closed on the day it was raised, so 0D-2 carries none into 0D Exit.
