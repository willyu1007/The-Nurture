# G4-B Increment 2 — Preview and the Inference Boundary

## Verdict

- Date: 2026-08-09
- Task: T-007
- Branch: G4-B, under [`33`](./33-g4-b-i1-branch-freeze.md)
- Implements: 0D-1 ([`26`](./26-g4-0d-1-attendance-closeout-freeze.md)) §2, and
  the watermark §5 froze
- Schema: **none** — increment 1's tables are unchanged and no new one is added
- Non-effects: no shared or persistent database apply, no capability
  registration, no contract rotation, no deployment, no activation, no traffic.
  Still no production caller.

## What was built

The other half of 0D-1's five-way separation. Increment 1 built the write path
and took entries from the caller; this builds what a teacher is actually shown
before confirming.

- `AttendanceEvidence` — a derived projection over three owners that already
  hold the rows. **No table**, because a stored copy drifts from its sources.
- `AttendanceInference` — a non-canonical suggestion with three discrete states
  and no probability, behind a provider port.
- The watermark — anchored to a batch T-006 already cut, which is what makes
  increment 1's two columns mean something.
- `NurtureAttendanceInferenceRun` finally has its writer.

## The deterministic provider cannot say `likely_absent`, and that is the point

Evidence of presence is evidence. **Absence of evidence is not evidence of
absence** — a child may have been present and unphotographed, which is 0D-2's
"missing records never mean no activity" applied to a person. So the
deterministic provider answers `insufficient_evidence` and a teacher decides.

`likely_absent` stays in the union because a later provider with a real absence
signal — a leave record, a guardian notification — could justify it. Nothing in
this one can, and the union documents the difference rather than pretending the
state is unreachable.

**`insufficient_evidence` maps to no suggested entry at all.** Not to a
default, because a pre-filled answer is what gets confirmed without being read.
That is the single most load-bearing line in the increment.

## The invariant, held by having no path

0D-1's hardest rule is that an inference can never produce an
`AttendanceFact`. The preview service holds it structurally: its repository
port has exactly two methods, and neither writes a submission or an entry. A
DB-lane test asserts the same thing as a query — after composing a preview, the
submission and entry counts are both zero.

A provider outage leaves the preview usable with evidence and no inference
(0D-1 §6). Denying a teacher the ability to close out their day because a
suggestion service is down would make the suggestion load-bearing, which is
exactly what it is not. No audit row is written for a run that produced
nothing, since one would misreport what the teacher was shown.

## The finding: two filters where only one was tested

Falsification turned up the same shape twice, in different queries.

Confirmed attributions are selected by **both** `state: "confirmed"` and a
`confirmedAt` day window. Cut batches are selected by **both** a state list and
a `cutAt` window. In each case the date condition alone excluded everything the
tests exercised, so removing the state condition changed nothing and both
falsifications came back green.

Neither was a defect — but neither state filter had any coverage, and both
matter for a case the tests had not built:

- A **superseded** attribution keeps its `confirmedAt`. It *was* confirmed
  once, and 0D-4 supersedes rather than overwrites — so without the state
  filter a withdrawn attribution still counts as presence.
- A batch **cut and then cancelled** keeps its `cutAt`, and its sequence would
  win the ordering and anchor the watermark to work that was withdrawn.

Both cases are now tests, and both falsifications now fail. The general lesson:
when a query stacks two conditions, a test that only exercises one is a test
that would pass with the other deleted.

## Falsification

| Reverted | Result |
| --- | --- |
| no evidence infers `likely_absent` | 2 unit, 3 db red |
| `insufficient_evidence` gets a default entry | 4 unit, 1 db red |
| provider failure propagates instead of degrading | 1 unit red |
| population narrowed to members with evidence | 4 db red |
| candidate/superseded attributions count as evidence | **0 red at first**, then 1 db red |
| cancelled batches anchor the watermark | **0 red at first**, then 1 db red |

## What is owed

**No surface calls any of this.** Preview composes, but nothing renders it, and
the capability that would is unregistered — that is I2's.

**Admin read aggregates** over a class (0D-1 §4) remain unbuilt, and run
through 0C-5 §5 and G4-A increment 4's rule when they are.

**Evidence is presence-only.** The three sources say a child was seen; none of
them says a child was away. A real `likely_absent` needs an absence source that
does not exist yet, and 0D-1 does not name one.

## Verification

Typecheck clean; unit 760 passed across 68 files, 10 in the preview suite;
production-db 322 passed across 32 files, 5 in the preview lane. Census unit
67 → 68, production-db 31 → 32.

## Exit

Increment 2 completes 0D-1's five-way separation: all five types now exist,
each in its own class, and the two that must never write a fact cannot reach
one. What remains of 0D-1 is the Admin read side, which belongs with G4-B's
board rather than with the closeout.
