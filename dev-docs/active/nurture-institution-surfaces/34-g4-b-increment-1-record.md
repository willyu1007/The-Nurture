# G4-B Increment 1 — The Attendance Write Path

## Verdict

- Date: 2026-08-09
- Task: T-007
- Branch: G4-B, under [`33`](./33-g4-b-i1-branch-freeze.md)
- Implements: 0D-1 ([`26`](./26-g4-0d-1-attendance-closeout-freeze.md)) §3, §4, §5
- Schema: **applied to the disposable database only**
- Non-effects: no shared or persistent database apply, no capability
  registration or enablement, no contract rotation, no deployment, no
  activation, no traffic. Still no production caller.

## What was built

The three tables 0D-1 planned, a pure decision function, a write port and its
Prisma implementation, and the `submit` / `revise` / `reopen` commands.

**`unsubmitted` is the absence of a row, not a stored value.** The enum carries
only `submitted` and `reopened`, because a member no row can hold is dead
surface an implementer builds handling for — 0G finding 2's lesson applied at
the storage layer. It also makes `expectedSubmissionHead: 0` mean exactly what
0D-1 says: "I believe this day is still unsubmitted."

The decision is pure and the repository holds no rule. Authority and current
state are read from stored rows, the decision runs between the read and the
write, and `apply` writes conditionally on the head it read.

## The concurrency rule has two independent enforcements

This is the increment's substantive finding.

0D-1 closed its open point in the application layer: `submit` carries
`expectedSubmissionHead: 0`. The storage layer enforces the same rule again
through the unique index on `(workspace, care_group, local_date)`.

They are not redundant, because they close **different windows**:

| Race | Closed by |
| --- | --- |
| Two submits whose reads are ordered — the second reads the first's row | the application precondition |
| Two submits that both read "no row" before either writes | the unique index |
| Two revisions that both read head 1 | `apply`'s conditional update |

Falsification made the split visible. Removing the application precondition
turned **three unit tests red and no DB test** — the index still decided the
race. Removing `apply`'s head condition turned **no test red at first**,
because every existing DB test was single-threaded through that path; the
submit race is decided by the index, not by the conditional update. That gap
was real and is now covered by a concurrent-revision test, which fails without
the condition.

So the increment ships defence in depth that was *demonstrated* rather than
assumed, and one test that exists because falsification found nothing watching
a window.

## Authority reads the day being closed, not today

0D-1 §4 requires the caregiver's assignment to have covered that class **on
that date**. The repository tests `startsAt`/`endsAt` against the day being
closed out, so a teacher whose assignment began today cannot close out
yesterday. Falsifying it — swapping the day for `new Date()` — turns that test
red.

Admin and caregiver reach the class differently and deliberately: a caregiver
by `care_group` scope on the class itself, an Admin through
`institution` scope, which is what 0C-2 established and all a reopen needs.

## Two layers of refusal, kept apart

`decideAttendanceCommand` returns `layer: "authority"` with a
`NurturePolicyReasonCode`, or `layer: "concurrency"` with `conflict`. They are
never the same field.

That follows the 0G 0D audit's corrected finding 1: `conflict` is a command
execution status the kernel already owns, and squeezing it into the authority
union would be a second spelling of something that exists. Input shape is a
third layer and is absent here — an empty entry list is a schema fault for the
admission step, not a decision this function makes.

## Storage-level constraints

Three checks, in the same posture as `ck_nurture_grant_scope`:

- a `reopened` row must name who reopened it and when, exactly as a revoked
  grant must name its revoker;
- `submission_head >= 1`, so a stored row can never be mistaken for the
  `unsubmitted` a caller asserts with `0`;
- the watermark's two columns are both present or both absent, since half a
  watermark cannot say where a preview cut.

## Falsification

| Reverted | Result |
| --- | --- |
| `submit` drops its `expected_head` precondition | 3 unit red, 0 db — the index still decides the race |
| `reopen` does not increment the head | 2 unit, 2 db red |
| Admin admitted to `submit` | 3 unit, 1 db red |
| assignment tested against now instead of the closed day | 1 db red |
| `apply` drops its conditional head | **0 red at first** — gap closed by a concurrent-revision test, then 1 db red |
| `canonicalize` stops sorting entries | 1 db red |
| `canonicalize` drops `expected_head` | **0 red at first** — gap closed by a payload-mismatch test, then 1 db red |
| `canonicalize` drops `role_assignment_ref` | 1 db red |
| `nextAttendanceHead` stops incrementing | 4 unit, 5 db red |
| `apply` re-decides after the precondition | **0 red, correctly** — the branch was unreachable and was removed rather than covered |

## Idempotency, added 2026-08-09

The first version of this increment shipped without it and recorded the gap.
It is now built, and the shape of the fix mattered more than its size.

**The three commands are `NurtureCommandSpec`s and there is no second write
path.** The pre-kernel service and its repository were deleted rather than kept
alongside — a direct writer beside a kernel writer is a route without
idempotency beside one with it, which is the dual track these increments keep
removing.

`checkPreconditions` and `apply` run inside one Serializable transaction under
one advisory lock, so 0D-1 fixture 9 now holds: a replayed request id returns
the first execution's result and writes nothing further. The kernel keeps two
things separate that are easy to conflate, and the test asserts both —
`disposition: "replayed"` describes **this** call, while
`business_outcome: "applied"` reports what the **original** execution did.
`already_satisfied` means something else again: a precondition that found the
work already done.

**Command identity covers every field a caller can vary.** `canonicalize`
sorts entries by child ref, so a client retrying with a reordered list gets the
replay rather than a second write; and it includes `expected_head`,
`local_date` and `role_assignment_ref`, so the same request id carrying a
different command is refused `idempotency_conflict` rather than silently
answered with the first command's result.

**One dead branch was found and removed.** `apply` originally re-read
authority and re-ran the decision, commented as "only a fresh read can say it
still holds at write time". That claim was wrong: both halves run in the same
transaction under the same lock, so nothing can move between them. Falsifying
the re-decision turned no test red — correctly, because the state that branch
guarded against is unreachable. The branch gave way to `nextAttendanceHead`,
shared by the decision and the write so neither can drift about what "next"
means, and the extra authority round-trip is gone.

## What is owed

**Preview and the inference boundary** (0D-1 §2) are increment 2. Entries are
supplied by the caller until then, and `NurtureAttendanceInferenceRun` exists
with no writer.

**Admin read aggregates** over a class (0D-1 §4) are unbuilt; they run through
0C-5 §5 and G4-A increment 4's rule when they are.

## Verification

Typecheck clean; unit 750 passed across 67 files, 12 in the attendance decision
suite; production-db 317 passed across 31 files, 13 in the attendance lane.
Census unit 66 → 67, production-db 30 → 31.

## Exit

Increment 1 completes 0D-1's write path, idempotency included. Increment 2 takes
preview and the inference type boundary, which is what makes the watermark
columns meaningful and gives `NurtureAttendanceInferenceRun` its writer.
