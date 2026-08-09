# G4-B Increment 7 — 0D-2 §4 Level 4, and D-05's Text Field

## Verdict

- Date: 2026-08-09
- Task: T-007
- Branch: G4-B, under [`33`](./33-g4-b-i1-branch-freeze.md)
- Implements: 0D-2 ([`27`](./27-g4-0d-2-schedule-placement-freeze.md)) §4 as
  amended today; amends `02-architecture.md` D-05
- Schema: **none**
- Non-effects: read-only. No capability registration, no contract rotation, no
  deployment, no activation, no traffic.

## Why this increment exists

Two open points were carried, not closed, by increments 5 and 6. Both were
recorded rather than papered over, and both are decided here.

## Point 1 — a class with no schedule showed no photo

[`38`](./38-g4-b-increment-5-record.md) recorded the consequence: a class with
no schedule places every source as `unplaced`, an unplaced photo belongs to no
activity, and 0D-2 §4's levels 2 and 3 walk activities. Such a class showed
**no photo even when it had one**, and [`39`](./39-g4-b-increment-6-record.md)
made that visible on the card.

Stated in product terms the gap is worse than it looks in code terms: "see your
class's photos" had acquired an undeclared dependency on "configure a schedule
first". Nothing in the surface tells an Admin so, and nothing in the freeze made
that claim.

**Decision: 0D-2 §4 gains an explicit level 4** — the class's newest qualifying
photo today, **placed or not**. Additive: the existing levels are unmoved and a
scheduled class whose activities hold photos never reaches the new level. A
fixture asserts exactly that non-effect, because "additive" is a claim about
behaviour, not about diff shape.

`selected_by: "class_latest"` distinguishes it, so a consumer can tell a photo
that belongs to an activity from one that does not, rather than having to guess
from the absence of an activity ref.

### The loader had to change too, and that is the real defect

Implementing the level in the domain alone would have left it **unreachable in
the DB lane**. `loadPhotoCandidates` queried the placement rows first and
returned early when there were none — so a photo was invisible until something
placed it, and an unscheduled class has nothing to place against. The automatic
pass is also still unwired to intake, so in practice nothing places anything.

The loader is now driven by the **captures** for the class and day, with
placement joined on where it exists. "Placed or not" is level 4's premise; it
has to hold in the loader or the level is decoration.

This is the same defect class as the level itself, one layer down: a query
whose join order silently narrowed what the surface could see.

## Point 2 — D-05's "latest text excerpt"

[`39`](./39-g4-b-increment-6-record.md) shipped a timestamp and no body, because
the only stored text a class capture holds is `bodyProtectionPayload` —
protected content whose release is an authority decision a card projection does
not make. The port returns `number | null`, so there is nowhere for a body to
travel.

Two ways to close it: give the capture an actor-safe summary, or correct the
architecture to what the projection actually returns.

**Decision: correct the architecture.** D-05 now reads "latest text presence 和
source timestamp". An excerpt is a **new protected-content release path** with
its own authority question — who may see how much of a teacher's note — and
inventing one to satisfy a field name is how a release rule gets decided by
documentation. If an excerpt is wanted later it comes with that question
answered, not as a wording repair.

The narrower consequence, stated so the surface is not oversold: the card tells
an Admin **that** there is a note and **when** it was taken, never what it says.

## Falsification

| Reverted | Result |
| --- | --- |
| level 4 removed | 1 unit, 1 db red |
| level 4 takes the first candidate instead of the newest | 1 db red |
| the loader back to placement-driven with its early return | 1 db red |

The second and third are the ones that matter: they are what distinguish a level
that works from a level that is present in the code.

## What is owed

**The class-day detail projection** (`InstitutionClassDayDetailProjectionV1`),
unchanged from [`39`](./39-g4-b-increment-6-record.md).

**The automatic placement pass is still unwired to intake**, unchanged from
[`37`](./37-g4-b-increment-4-record.md). Level 4 reduces the visible harm of
that gap — an unplaced photo now reaches the card — but does not close it.

**Level 4 of the placement precedence** (assisted semantic judgement) remains
frozen and disabled. It shares a number with 0D-2 §4's new photo level and
nothing else; they are different orderings in different sections.

## Verification

Typecheck reports zero errors from this repository. Unit 803 passed across 70
files; production-db 344 passed across 34 files. No test file was added, so the
census is unchanged.

`verify:test-routing`, `verify:surface-conformance`, `verify:g2-exit-contract`,
`verify:g3-0-freeze` and `verify:c30-i3-owner-adoption` pass.

**`verify:workflow-contract-pin` is red, and not on this branch's account.** The
self-pin is re-frozen over the touched `packages/nurture-scenario` and
`packages/nurture-db` paths and matches. The gate stops earlier, on My-Chat:
its head has moved to `66d8c087`, and inside the pinned `x5_joint_api` set that
range lands a new `family-growth/family-material` domain, media access and GC
repositories, and a `prisma/schema.prisma` reshuffle — roughly 2,400 lines.

Advancing the pin over that change is an **adoption**, not a refresh, and the
work belongs to another task. Commit `65de105` advanced this pin once before,
after auditing the diff down to a single comment byte; the equivalent audit here
would be a review of T-009's family-growth increment, and recording that review
under T-007 would say this branch qualified code it never read. Left red, with
the reason stated, for whoever owns the adoption.

## Exit

Both points [`38`](./38-g4-b-increment-5-record.md) and
[`39`](./39-g4-b-increment-6-record.md) left open are decided, implemented and
falsified. The freeze and the architecture now describe what runs.
