# G4-0E-3 Trial Lifecycle — Freeze Record

## Status

- Date: 2026-08-09
- Task: T-007
- Contract identity: `nurture.enrollment-trial-lifecycle@1.0.0`
- Consumes: 0E-1/0E-2, 0C authority/Grant and existing T-006/0D care facts
- Verdict: `G4_0E_3_FREEZE_PASS`
- Schema delta: **planned, not applied**

## 1. Owner and state mapping

Nurture Enrollment owns the relationship and trial transaction. Trial reuses
the normal Enrollment, Grant, exact CareGroup, roster, attendance, care, media,
board and PublishProcess paths. No trial-specific child or fact pipeline exists.

The existing status enum is unchanged. A new nullable canonical discriminator
is added:

```text
NurtureEnrollmentParticipationPhase = trial | formal
```

Frozen combinations for new/current relationships:

| Relationship | Status | Phase |
| --- | --- | --- |
| preparation | `pending` | `null` |
| actual trial | `active` | `trial` |
| formal | `active` | `formal` |
| ended trial history | `ended` | `trial` |

Existing active rows predate trial and are backfilled `formal`. Legacy terminal
rows may remain nullable; nullable/terminal rows grant no current authority.
No code may count formal Enrollment from `status=active` alone: it requires
`status=active && participationPhase=formal`.

## 2. Commands and predicates

```text
prepare_trial_relationship
start_trial
mark_trial_review_reached
extend_trial
propose_formal_enrollment
end_trial
```

Trial preparation requires Guardian-authorized current My-Chat Child/Family,
both current binding heads, Nurture workspace associations, a pending
Enrollment tied to the reserved exact CareGroup and the required pending Grant.
`participationPhase` is never authority.

`start_trial` revalidates all of those facts, the held unexpired reservation,
exact class capacity/versions and current Grant terms. One local transaction
sets Enrollment to active/trial, activates the required Grant, confirms exact
CareGroup occupancy, converts the workflow from `trial_start_pending` to
`trial_in_progress`, records `trial_started` and advances all heads. No care
fact may be written before this commit.

Review uses existing source refs under their existing current owner policies.
There is no special caregiver score, suitability assessment or enrollment
recommendation. Only current Admin may extend, propose formal or end; Guardian
acceptance belongs to 0E-4 and cannot be replaced by an Admin proposal.

## 3. Time, lifecycle and local atomicity

- `reviewAt` becoming due creates a visible due condition only. It never
  extends, formalizes, ends or releases capacity.
- `trialEndsAt` blocks new planned trial care after the instant. Existing
  historical facts remain. Continuing requires explicit `extend_trial` before
  new care is scheduled.
- extension updates the same held reservation's end/review times under expected
  heads, keeps `reviewAt <= trialEndsAt`, retains one seat and appends reason,
  actor and before/after audit.
- `end_trial` is one Nurture downscope transaction: active/trial Enrollment to
  ended/trial, relevant trial Grant closed/revoked, exact CareGroup occupancy
  ended, reservation released, workflow closed without formalization and
  `trial_ended` recorded. It does not depend on My-Chat owner availability.
- the transaction may create only a body-free committed result for a later
  Admin next-waitlist task. Delivery failure never reopens access or the seat.
- trial end never restores an old waitlist entry. A future wait requires a new
  0E-2 qualification.

All commands reuse the existing command ledger with exact replay and expected
Enrollment/Grant/reservation/workflow heads. A conflict writes no partial fact.

## 4. Default-safe behavior

| Condition | Result |
| --- | --- |
| Missing/stale Host binding or local association | stay `trial_preparation`; no real care |
| Missing pending Enrollment/Grant/exact CareGroup | stay `trial_preparation` |
| Reservation absent/released/wrong class | deny start |
| Owner/DB conflict during start | no active/partial relationship |
| Review due | task/signal condition only |
| Trial expired without extension | no new planned care; seat remains until explicit end/extension decision |
| AI/caregiver review unavailable | Admin reads available ordinary facts; no score or automatic outcome |
| My-Chat unavailable during end | local downscope still executes |

## 5. Fixtures and gates

1. schema adds phase, never `trial` status;
2. active legacy rows backfill formal and formal counts use status+phase;
3. pending/null produces no real care authority;
4. trial start requires current Host pair evidence, associations, pending Enrollment/Grant and exact reservation/class;
5. start commits Enrollment/Grant/reservation/workflow together or none;
6. trial uses normal attendance/care/media/PublishProcess paths;
7. trial attendance counts for daily safety but not formal Enrollment totals;
8. review/ends clocks never mutate facts by themselves;
9. explicit extension preserves one seat and requires valid review/end order;
10. only Admin may extend/propose/end; AI and caregiver cannot decide suitability;
11. end trial works during My-Chat outage and removes future access atomically;
12. end never deletes identity, association or historical care facts;
13. end never restores old waitlist rank and creates no automatic offer;
14. replay/conflict cannot double-start, double-release or produce partial facts.

## 6. DB delta

- add nullable `participationPhase` to `NurtureEnrollment` with the enum above;
- backfill current active pre-trial rows to `formal` and add checks/indexes for
  current formal/trial queries;
- reuse 0E-2 reservation, existing Enrollment/Grant/CareGroup and 0E-1
  transition/command ledger; no TrialChild, trial attendance or trial media
  table;
- exact migration and repository transaction are I1 and may be qualified only
  on an explicitly approved disposable PostgreSQL target.

## Exit

`G4_0E_3_FREEZE_PASS` releases 0E-4. It neither starts a real trial nor applies
the phase migration.

