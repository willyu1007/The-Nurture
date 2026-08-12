# G4-B Increment 3 — The Admin Class List

## Verdict

- Date: 2026-08-09
- Task: T-007
- Branch: G4-B, under [`33`](./33-g4-b-i1-branch-freeze.md)
- Implements: `02-architecture.md` D-05's class list, 0C-5 §6 fixture 14, and
  0D-1 §4's Admin read
- Schema: **none**
- Non-effects: read-only. No write path exists in this increment — the domain
  module has no writing function and its port declares no writing method. No
  capability registration, no contract rotation, no deployment, no activation,
  no traffic.

## Scope, and the name

The architecture specifies `InstitutionClassCardProjectionV1` with schedule
version, current and next activity, a temporary-override indicator, latest
photo and latest text. **Half of those need 0D-2's tables, which are planned
and unapplied.**

So this increment ships a **class list**, not a class card, and does not claim
the card's contract name. Shipping the card shape with empty placeholders would
fix a contract before anything could fill it, and a later increment would have
to either live with the gaps or break the version. What is here — order,
attendance state, pending counts — is complete on its own terms.

## Fixture 14, finally observable

0C-5 §6 fixture 14 has been owed since G4-A increment 4
([`24`](./24-g4-a-increment-4-record.md)), which could not satisfy it because
observing an ordering requires a list and none existed.

The order is derived from **stable class attributes** — `ageBandKey`, then
`name` — and never from state. Two details that only appear when you implement
it:

- **A class with no age band needs a defined position.** Sorting `null` by
  whatever the database returned would make the order depend on storage. It
  sorts after every banded class, deterministically.
- **The order must be total.** Two classes sharing a band and a name would
  otherwise sort unstably between reads, so ties fall to the ref. A "fixed
  order" that is only a partial order still moves.

The ordering lives in the domain and **not** in a database `ORDER BY`. A
second ordering in SQL could disagree with the first — including by collation,
which differs from the domain's own comparison — and 0C-5 §6's guarantee is
that one rule decides.

The DB-lane test submits attendance and adds work items between two reads, and
asserts the sequence is identical.

## The unsubmitted arm has nowhere to put a number

`02-architecture.md` D-05: an unsubmitted day shows "awaiting the teacher's
confirmation" and returns **no Admin-facing AI inference count**. The
inference built in increment 2 is for the teacher who confirms it; an Admin
shown a predicted figure would be reading a guess as a fact.

`NurtureClassAttendanceSummary` is a discriminated union whose `unsubmitted`
arm has no count field at all — the same technique the aggregate result uses,
where the refusal carries no `value`. The rule is held by the shape rather
than remembered by a reader.

An unsubmitted class is also answered **without reading a single member fact**:
the population is not even fetched, so a class nobody has closed out cannot
leak who is in it. A test asserts the port was not called.

## The confirmed count is an aggregate; the pending counts are not

`confirmed_present_count` compresses several members' facts into one number, so
it runs through `resolveAggregate` and returns `unavailable` rather than a
figure over the readable members. 0D-1 §4 says so, and this is the first
consumer with a class list to say it about.

The pending counts are **not** member-fact aggregates. They count work items —
items awaiting response, new feedback, attention items — and 0C-5 §6 records
plainly why they stay: they measure the Admin's own outstanding work at this
entry point, not the class's or the teacher's performance. What they must never
do is drive an ordering, which is the line between an entry point and a
ranking.

Only `present` counts as present. `excused_absent` and `not_expected` are not
attendance in the sense a count means, and folding either in would overstate
the class.

## Falsification

| Reverted | Result |
| --- | --- |
| list composed in repository order instead of the fixed one | 1 unit, 1 db red |
| ordering drops its ref tiebreak | 1 unit red |
| unsubmitted day carries a count | 1 unit, 2 db red |
| aggregate degraded to a filtered count | 1 unit, 1 db red |
| `excused_absent` counted as present | 1 db red |

All five failed on the first attempt, which is the first increment in this
branch where that happened.

## An unexplained test failure, recorded rather than dismissed

The first full `pnpm test:db` after the falsification loop reported
`1 failed | 327 passed (328)`. Six consecutive re-runs since have been green,
and the total count was unchanged, so it was not a collection problem.

The most likely cause is build-cache or filesystem timing immediately after the
falsification loop's repeated write-and-restore cycle. **That is a hypothesis,
not a diagnosis** — the failing test's identity was not captured before the
re-runs went green. The failure is recorded here because an intermittent
failure nobody wrote down is worse than a known one, and because whoever sees
this next should not have to rediscover that it happened before.

## What is owed

**The class card's remaining fields** — schedule version, current and next
activity, override indicator, latest photo, latest text, source watermark —
all wait on 0D-2's schema. That is the next increment's work, and it is what
turns this list into the card the architecture specifies.

**The class-day detail projection** (`InstitutionClassDayDetailProjectionV1`)
is untouched: timeline, communication owner-read, family feedback and the
purpose-gated child drill-down.

**0C-5 §6 fixture 16** — work-item lists ordered by explicit deadline with a
fixed-order fallback — still waits on the signal list, which is 0D-5's.

## Verification

Typecheck clean; unit 770 passed across 69 files, 10 in the class list suite;
production-db 328 passed across 33 files, 6 in the class list lane. Census unit
68 → 69, production-db 32 → 33.

## Exit

The Admin now has a list of their classes with each one's attendance state and
their own outstanding work against it, in an order that does not move. The card
it becomes needs 0D-2 applied first.
