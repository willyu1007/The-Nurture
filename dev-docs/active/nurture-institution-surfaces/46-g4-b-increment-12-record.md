# G4-B Increment 12 — Attendance Checkpoint Owner

## Verdict

- Date: 2026-08-09
- Task: T-007
- Implements: 0D-1's canonical class/date checkpoint handoff to 0D-5
- Contract: `nurture.daily-attendance-closeout@1.0.0`
- Migration: `20260809210000_g4b_attendance_checkpoint_policy`
- Verdict: **I1 PASS; one of G-03's two owner-fact gaps closed**
- Non-effects: no shared/persistent database apply, production caller,
  capability registration, contract rotation, deployment, activation or
  traffic.

## Owner boundary

`NurtureAttendanceCloseoutPolicy` is the 0D-1 owner's immutable exact-class
policy history. A row carries one explicit checkpoint local time, revision,
effective window and Admin audit refs. It does not belong to the 0D-5 policy,
and the support-signal table gains no deadline column.

The final instant reuses the existing Institution local-day owner's timezone.
The first reviewed design duplicated that timezone in the new table; the
architecture review removed it before commit because two timezone owners could
assign different boundaries to the same class/date. The shared wall-clock
utility was extracted once, preserving the publication-schedule API while
avoiding a second conversion algorithm.

The attendance owner selects the policy effective when the local day began.
A policy first effective later that day does not retroactively create an
already-past checkpoint. Missing, malformed, expired, non-monotonic or
overlapping policy histories return `unavailable`; none falls back to local-day
end, UTC, publication release time or the 0D-5 `checkpoint_ref`.

For an unsubmitted class/day with one valid policy, the owner returns the
formal `unsubmitted` state and resolved `checkpoint_deadline_at`. A stored
submission remains resolved and produces no attendance-overdue source. The
source ref is actor-bound and includes the owner policy revision without
exposing raw ids.

## Authority/source blocker audit

The sixth port remains deliberately unavailable. Repository-wide review found
no currently readable canonical authority/source blocker fact:

- `grant_revoked`, `family_withdrawn` and `source_redacted` make the underlying
  communication unreadable or terminal;
- `user_cancelled_before_delivery` is a terminal actor cancellation; and
- the only readable literal `blocked` receipt path with
  `item_action|workflow_step` is already owned by
  `work_item_or_workflow_blocked`.

Mapping any of those into `authority_or_source_blocked`, or persisting a new
signal-only blocker, would create the second state the user explicitly ruled
out. The unavailable arm therefore remains the correct implementation until a
different owner introduces a readable canonical fact for its own business
reason.

## Qualification

- Prisma format, validation, client generation and DB context refresh: PASS.
- Root and DB package TypeScript checks: PASS.
- Attendance checkpoint plus existing schedule units: 27/27 PASS.
- Full unit lane: 828/828 across 73 files.
- Exact-owner production-DB suite: 12/12 PASS.
- Full production-DB lane: 360/360 across 37 files.
- Clean disposable deploy: 27/27 migrations; final status up to date.
- PostgreSQL constraints, overlapping-owner refusal, shared-timezone resolution
  and no-retroactive-deadline fixtures: PASS.
- Exact disposable target destroyed with zero sessions and confirmed absent.

Evidence:
[`artifacts/db/0d5-attendance-checkpoint`](./artifacts/db/0d5-attendance-checkpoint/04-post-verify.md).

## Exit

The attendance owner now supplies the exact checkpoint instant 0D-5 requires,
without a signal-local deadline or timezone. G-03 remains partial only because
the separate readable authority/source blocker fact does not exist. This
increment does not weaken the six-owner fail-closed composition to hide that
gap.
