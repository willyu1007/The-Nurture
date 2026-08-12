# G4-B Increment 4 — Class Schedule and Activity Placement

## Verdict

- Date: 2026-08-09
- Task: T-007
- Branch: G4-B, under [`33`](./33-g4-b-i1-branch-freeze.md)
- Implements: 0D-2 ([`27`](./27-g4-0d-2-schedule-placement-freeze.md)) §3, §4
  (levels 1-3 and 5), §5
- Schema: **applied to the disposable database only**
- Non-effects: no shared or persistent database apply, no capability
  registration, no contract rotation, no deployment, no activation, no traffic.
  Still no production caller.

## What was built

0D-2's three planned tables, the three-level schedule resolution, the placement
precedence minus its disabled fourth level, and the concurrency rules.

The two derived projections 0D-2 names get **no table**: the effective schedule
and the latest-photo selection are resolved per read, because a stored
resolution drifts from the inputs that produced it.

## `scheduleVersion` without a table — the derivation

0D-2 §5 requires the version to **increment** when the resolution changes, and
§8 forbids persisting the projection. So the version has to be derived, and the
obvious derivation is wrong.

Taking the **winning layer's** timestamp moves the version **backwards**: when
a newer day override is withdrawn and an older standing layer takes over, the
version would jump back to the standing layer's older value. A caller
comparing versions would read that as the schedule reverting to something
earlier than what it had already seen.

The version is therefore the **maximum timestamp across every candidate layer**,
winner or not. That only works because layer removal is a **soft delete** —
withdrawing a layer touches its `updatedAt`, so the maximum moves forward on
removal exactly as it does on edit. A hard delete would break monotonicity, and
that is why the two schedule tables carry `deletedAt` and the partial unique
indexes exclude soft-deleted rows.

## Placement, and the level that is not there

Levels 1, 2, 3 and 5 ship. **Level 4 — assisted semantic judgement — is frozen
in the union and not enabled** (0D-2 §4, open point closed). A test asserts no
code path emits `assisted`, which is what makes turning it on later a visible
change rather than a drift.

Two details the freeze implies but does not state:

- **Windows are half-open.** A source at a slot's exact end minute belongs to
  neither slot rather than to both, so a boundary lands in exactly one place.
- **A day-override placement records itself distinctly** from a standing-schedule
  one, so review can tell which layer decided without re-resolving.

`unplaced` stays in the source's own class. An uncertain source is never moved,
promoted or dropped — uncertainty resolves by staying put and being visible.

## Two duplications I introduced and then removed

Both were found by falsification returning green, not by reading the code.

**The admin protection was enforced twice.** `shouldApplyAutomaticPlacement`
refused a `decided_by: "admin"` placement, and `isEligibleForAutomaticPass`
refused it first. Removing the former turned a unit test red and **no DB test**,
because the real call chain never reaches it — eligibility filters first. The
duplicate is gone: eligibility owns authority, and `shouldApply` owns only
"did the decision change".

**The version was computed twice.** After moving orchestration into a service,
that service pre-computed the max timestamp and overwrote each layer's value
before handing them to the resolver, which then took the max again. Falsifying
the resolver's computation turned no DB test red, because the service had
already flattened the input. The service now hands the layers over whole; the
resolver decides both which layer wins and what the version is.

The second one is worth noting: **the refactor that fixed one architectural
problem introduced the exact shape it was meant to prevent.** Falsification
caught it in the same session.

## Why the orchestration moved out of the repository

The first version had the repository import the domain's **runtime functions**.
That worked at runtime only after switching from the `/harness` subpath — whose
`import` condition resolves to `dist` — to the root entry, which resolves to
`src`.

But it had a second effect: importing the domain's values pulled its whole
module graph into this package's compilation, and `pnpm typecheck` began
compiling a **sibling repository's** files. With another session mid-edit
there, the typecheck reported errors in code this branch never touched.

Orchestration now lives in `NurtureClassScheduleService`, and the repository is
back to `import type` like every other one here. That is the correct layering
independently of the typecheck symptom — a data layer should not reach into the
domain's runtime — but the symptom is what surfaced it.

## Falsification

| Reverted | Result |
| --- | --- |
| schedule layers merged instead of one winning | 1 unit, 1 db red |
| version taken from the winning layer | 1 unit, 1 db red |
| a source outside every window guessed into the first slot | 2 unit, 2 db red |
| eligibility drops its admin protection | 1 unit, 1 db red |
| the service skips the eligibility check | 3 db red |
| an adjustment not scoped to the class | 1 db red |
| a withdrawn (empty) layer still wins | 1 db red |

Two of these went green on the first attempt and are the duplications above.
One needed a new DB case before it could fail: the admin protection only bites
when an Admin **unplaces** a source — a photo they believe is misfiled, pending
a teacher's word — and no test had built that.

## Storage-level constraints

- A `class_standing` layer must name its class and an `institution_default`
  must not, so "which scope does this layer serve" is answerable from the row.
- `placed` requires an activity and `unplaced` forbids one, so a placed row can
  never lack its slot and an unplaced row can never carry a stale one.
- Partial unique indexes give one live layer per scope while letting a
  soft-deleted row coexist with its replacement.

## What is owed

**Latest-photo selection** (0D-2 §4) is unbuilt. Placement was its missing
dependency and now exists, so the selection is the next piece — and the class
card cannot be completed without one.

**The class card's remaining fields.** [`36`](./36-g4-b-increment-3-record.md)
shipped a class list because schedule and placement did not exist. Both do now,
so that list can become the card the architecture specifies.

**No automatic pass is wired to intake.** The pass is implemented and tested
but nothing calls it when a capture arrives; that is a wiring step for whichever
increment owns intake.

## Verification

Typecheck reports zero errors from this repository. One error appears in
`../My-Chat/packages/db`, which has 21 uncommitted files under active edit by
another session — confirmed unrelated by stashing this branch's work and
re-running.

Unit 785 passed across 70 files, 15 in the schedule/placement suite;
production-db 340 passed across 34 files, 12 in the schedule/placement lane.
Census unit 69 → 70, production-db 33 → 34.

## Exit

0D-2's resolution and placement rules are executed and falsified. What remains
of 0D-2 is the latest-photo selection, which sits on top of placement rather
than beside it.
