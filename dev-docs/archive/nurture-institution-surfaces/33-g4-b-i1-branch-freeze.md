# G4-B I1 Branch Freeze

## Verdict

- Date: 2026-08-09
- Task: T-007
- Branch: G4-B Role-bound Mobile Operations
- Gate: I1 Branch Freeze
- Verdict: `G4_B_I1_BRANCH_FREEZE_PASS`
- Input: `G4_0D_EXIT_PASS` ([`32`](./32-g4-0d-exit-record.md))

Per `01-plan.md`, I1 opens this branch's exact schema, policy, repository and
service implementation plus **migration authoring**. It does not authorize
shared or persistent database apply, public contract release (I2), real owner
integration (I3), joint conformance (I4), activation or traffic. Qualification
runs only on a disposable PostgreSQL.

## Why this branch, and why now

0D froze five units and executed nothing. G4-A executed 0C's chain and found
three fail-open defects, two authority-channel splits and one predicate
widening that no record had noticed — every one of them only because the code
ran. G4-B is where the same scrutiny reaches 0D.

It is also the first branch that **writes**. G4-A's four increments read facts
and decided; attendance produces a canonical fact from a teacher's
confirmation, with a concurrency rule, an append-only head and a watermark. The
failure modes available to a write are not the ones G4-A exercised.

## Increment 1 scope — the attendance write path

Deliberately narrow, and chosen so the hardest frozen rules are the ones that
run first.

In scope:

1. **The schema delta 0D-1 planned**, authored as a migration and applied to
   the disposable database only: `NurtureDailyAttendanceSubmission`,
   `NurtureAttendanceEntry`, `NurtureAttendanceInferenceRun`.
2. **`submit` / `revise` / `reopen`**, with 0D-1 §5's concurrency rule — all
   three carry `expectedSubmissionHead`, `submit` supplies `0`, and `reopen`
   increments the head.
3. **Authority through 0C's chain**, unchanged: submission requires a caregiver
   assignment current for that class **on that date**, and an Admin is denied
   submit and entry edit regardless of what else they hold.
4. **`unsubmitted` as the default that never auto-settles**, and the
   cross-day rule that a class caregiver cannot revise without an Admin reopen.

Out of scope for increment 1, each needing its own:

- **Preview and the AI inference boundary** (0D-1 §2). The inference is a type
  boundary this increment does not build; entries are supplied by the caller
  until it exists.
- **Admin read aggregates** over a class (0D-1 §4), which run through 0C-5 §5
  and G4-A increment 4's rule.
- **The class-first board** (B1) and everything 0D-2 froze.
- **Capability registration.** Every 0D capability is unregistered, and
  registering them is an additive rotation belonging to I2.

## What increment 1 must prove, beyond passing

The four G4-A increments established a working method, and it applies here:

- Every new guard is **falsified** by reverting it, with the inverse edit
  verified to have landed at a unique anchor and at every equivalent exit
  before the test colour is read.
- Facts are computed by the repository from stored rows, and the predicate
  gates on **the same channel** the fact came from.
- No fact is emitted on two channels; where two call sites need one answer,
  they share one implementation.

**The specific thing worth executing here** is the concurrency rule. 0D-1
closed its open point by giving `submit` the precondition `revise` already had,
which is a claim about behaviour under two concurrent writers — and no freeze
record can demonstrate that. A DB-lane test with two submissions racing on one
(class, date) is the evidence.

## Non-effects

No shared or persistent database apply. No capability registration or
enablement. No contract rotation. `t007_institution_workbench` stays
unsatisfied and the workbench's only legal state remains `unavailable`. No
deployment, no activation, no traffic.

## Exit

Increment 1 completes when the schema is applied to a disposable database, the
three commands enforce 0D-1's authority and concurrency rules, and the
falsification pass shows each guard has a test that fails without it. A rule
that cannot be implemented as frozen amends 0D-1 rather than being quietly
widened.
