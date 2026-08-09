# G4-B Increment 6 — The Admin Class Card

## Verdict

- Date: 2026-08-09
- Task: T-007
- Branch: G4-B, under [`33`](./33-g4-b-i1-branch-freeze.md)
- Implements: `02-architecture.md` D-05's `InstitutionClassCardProjectionV1`,
  consuming 0D-1, 0D-2 and 0C-5 §5
- Schema: **none**
- Non-effects: read-only. No capability registration, no contract rotation, no
  deployment, no activation, no traffic.

## What was built

The class list from [`36`](./36-g4-b-increment-3-record.md) is now the card the
architecture specifies. That record shipped a list precisely because schedule,
placement and photo selection did not exist; increments 4 and 5 built them, and
this composes them.

Added to each entry: the effective schedule's version and which layer produced
it, a temporary-override indicator, the current and next activity, the latest
photo, and when the latest text was captured. Ordering, attendance and pending
counts are unchanged.

## Three fields that are deliberately narrower than they look

**`latest_text` carries a timestamp and nothing else.** The architecture names
a "latest text excerpt", but the only stored text a class capture holds is
`bodyProtectionPayload` — protected content, whose release is an authority
decision a card projection does not make. The port returns `number | null`, so
there is no field a body could travel in.

That shape is also why one falsification could not fail: pushing the protected
payload through the repository changed nothing observable, because the
projection has nowhere to put it. **The invariant is held by the type, not by a
guard** — which is stronger, and means it cannot be falsified without changing
the type. A DB-lane test asserts the sealed string appears nowhere in the
serialized card, as runtime evidence beside the structural one.

**Photo candidates qualify at CLASS level.** The asset belongs to this class and
its lifecycle is live. Child-level attribution is a different question and does
not gate a class photo — a picture of the room is not a picture of a child.

**`schedule` is `null` when the class has none.** No invented default day, and
no partially-filled object. 0D-2 §6's empty state, carried through.

## "Next activity" is not "the slot after the current one"

The next activity is the earliest slot starting after now. The two definitions
differ whenever the day has a gap: at 11:40, between a morning that ended at
11:00 and an afternoon starting at 14:00, there is a next activity and no
current one. Implementing the field as `slots[currentIndex + 1]` returns
nothing in exactly that case — which is when an Admin most wants to know what
is coming.

## Resolution is injected, not reached for

The repository reads schedule layers and hands them out; the caller supplies
`resolveEffectiveSchedule`. Two consequences worth stating:

- The layers come from `PrismaClassSchedulePlacementRepository` rather than a
  second query over the same three tables — two readers would be two chances to
  disagree about which layer is in force.
- The data layer imports no domain runtime value, which is the rule
  [`37`](./37-g4-b-increment-4-record.md) arrived at after a runtime import
  pulled a sibling repository into this package's compilation.

## `at_minute` is a parameter, not the clock

The projection is a pure function of its inputs, so a test can place "now"
anywhere in the day without freezing time. The gap case above is a test only
because of this.

## Falsification

| Reverted | Result |
| --- | --- |
| next activity taken as the slot after the current one | 1 unit red |
| a day override not flagged as temporary | 1 unit, 1 db red |
| photo selection ignores the current activity | 1 unit, 1 db red |
| an unscheduled class given a default schedule | 1 unit, 1 db red |
| the protected body pushed through the repository | **no change — the type has nowhere to put it** |

## What is owed

**The class-day detail projection** (`InstitutionClassDayDetailProjectionV1`) is
untouched: the full activity timeline, the communication owner-read, family
feedback, and the purpose-gated child drill-down.

**A `latest text excerpt` needs an actor-safe summary** that a capture does not
carry today. **Closed 2026-08-09**: `02-architecture.md` D-05 now reads "latest
text presence 和 source timestamp", which is what the projection returns. An
excerpt would need a summary the capture does not hold, and naming a field the
implementation cannot honour is how a spec starts describing a different system
than the one that runs.

**The automatic placement pass is still unwired to intake**, unchanged from
[`37`](./37-g4-b-increment-4-record.md).

**0D-2's unscheduled-class photo consequence**, recorded in
[`38`](./38-g4-b-increment-5-record.md) and made visible by this card, is
**resolved 2026-08-09** by 0D-2 §4's level 4 — see
[`40`](./40-g4-b-increment-7-record.md).

## Verification

Typecheck reports zero errors from this repository. Unit 801 passed across 70
files, 19 in the class card suite; production-db 343 passed across 34 files, 9
in the class card lane. No census change — no test file was added.

## Exit

G4-B's B1 read surface is complete at card level. What remains of the branch is
the detail projection behind it.
