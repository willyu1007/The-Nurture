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

## What is owed

**Idempotency is not built.** 0D-1 §5 requires `submit`, `revise` and `reopen`
to carry a request id and be exact-replay safe, which is the command kernel's
job and not this increment's. Fixture 9 of 0D-1 — replaying a submit request id
returns the first result and creates no second submission — is therefore not
satisfied. The unique index makes a replayed submit fail rather than duplicate,
which is safe but is a conflict where the freeze requires the original result.

**Preview and the inference boundary** (0D-1 §2) are increment 2. Entries are
supplied by the caller until then, and `NurtureAttendanceInferenceRun` exists
with no writer.

**Admin read aggregates** over a class (0D-1 §4) are unbuilt; they run through
0C-5 §5 and G4-A increment 4's rule when they are.

## Verification

Typecheck clean; unit 750 passed across 67 files, 12 in the attendance decision
suite; production-db 313 passed across 31 files, 9 in the attendance lane.
Census unit 66 → 67, production-db 30 → 31.

## Exit

Increment 1 completes 0D-1's write path minus idempotency. Increment 2 takes
preview and the inference type boundary, which is what makes the watermark
columns meaningful and gives `NurtureAttendanceInferenceRun` its writer.
