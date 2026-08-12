# G4-B Increment 5 — Latest-photo Selection

## Verdict

- Date: 2026-08-09
- Task: T-007
- Branch: G4-B, under [`33`](./33-g4-b-i1-branch-freeze.md)
- Implements: 0D-2 ([`27`](./27-g4-0d-2-schedule-placement-freeze.md)) §4's
  latest-photo ordering, levels 2-4
- Schema: **none**
- Non-effects: read-only, and derived — the selection is computed per read and
  stored nowhere. No capability registration, no contract rotation, no
  deployment, no activation, no traffic.

## What was built

The last rule 0D-2 froze. It is deterministic throughout: no aesthetic
judgement, no generative model, no cropping or face framing, and no asking a
teacher to pick. The card gets whichever photo the ordering names, or none.

**Qualification is the caller's filter, not this function's.** "Qualifying"
means passing the reader's own 0C chain, which is reader-specific — a selection
function that took unfiltered candidates would have to be trusted with
authority it does not own. 0D-2 §4 restates 0C-5 §5's no-bypass rule for
exactly this case, and passing only pre-filtered candidates is how it holds.

## Level 1 has no writer, deliberately

The explicit cover is set from the Admin workbench, which is **G4-C's** surface,
and 0D-2 §8 planned no table for it. The parameter exists so adding that
capability later is a gate rather than a shape change.

A cover is honoured **only if it is among the candidates**. That single
condition enforces "if its source, authority and lifecycle are all still valid"
without a second check that could disagree with the first — and a cover whose
media no longer qualifies falls through to the next level rather than blocking
the card.

## "Most recent activity", not "most recent photo"

Level 3 walks the schedule's slots in **schedule order**, latest first, and
takes the newest photo in the first slot that has one.

That is not the same as taking the newest photo overall, and the difference is
real: a photo uploaded late still belongs to the activity it was captured in.
Ordering by capture time would let a delayed morning upload present itself as
the afternoon's picture. The test builds exactly that case.

Ties on capture instant break on `media_ref`, so two photos sharing a timestamp
cannot alternate between reads.

## A consequence recorded rather than papered over

A class with **no schedule** places every source as `unplaced`, and an unplaced
photo belongs to no activity — so levels 2 and 3 cannot reach it. Such a class
shows **no photo even when it has one**.

That follows from 0D-2 as written. Whether it is the intended product behaviour
is a question for the freeze rather than a gap to fill here with an undeclared
fallback: adding "otherwise, the newest photo anywhere" would be a fourth
ordering rule that 0D-2 does not contain, and inventing it silently is how a
frozen ordering stops meaning anything.

**Recommendation:** 0D-2 §4 should either state that an unscheduled class shows
no card photo, or add an explicit unplaced fallback with its own level number.

**Resolved 2026-08-09** by 0D-2 §4's amendment, the second option: an explicit
level 4. See [`40`](./40-g4-b-increment-7-record.md).

## Falsification

| Reverted | Result |
| --- | --- |
| level 3 walks activities oldest-first | 2 unit red |
| a cover is honoured without still qualifying | 1 unit red |
| unplaced photos participate in selection | 1 unit red |
| capture-time ties left unordered | 1 unit red |

All four failed on the first attempt.

## What is owed

**The class card itself.** [`36`](./36-g4-b-increment-3-record.md) shipped a
class list because schedule, placement and photo selection did not exist. All
three now do, so the list can become the card `02-architecture.md` D-05
specifies: schedule version, current and next activity, override indicator,
latest photo, latest text and source timestamp.

**No DB-lane test.** This increment adds no query — it orders candidates a
caller has already read and filtered. Its DB coverage arrives with the card,
which is what will read them.

**The automatic pass is still unwired to intake**, unchanged from
[`37`](./37-g4-b-increment-4-record.md).

## Verification

Typecheck reports zero errors from this repository. Unit 792 passed across 70
files, 22 in the schedule/placement suite; production-db 340 passed across 34
files, unchanged. No census change — no test file was added.

## Exit

0D-2's rules are now all executed: resolution, placement, and selection. What
remains of the branch is the card that consumes them.
