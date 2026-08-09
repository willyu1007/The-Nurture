# G4-0D-1 Daily Attendance Closeout — Freeze Record

## Status

- Date: 2026-08-09
- Task: T-007
- Unit: 0D-1, first of 0D ([`25-g4-0d-scope-freeze.md`](./25-g4-0d-scope-freeze.md))
- Contract identity: `nurture.daily-attendance-closeout@1.0.0`
- Consumes: the 0C chain unchanged — `ActiveRoleContextV1` (0C-1) through class
  scope (0C-3)
- Verdict: `G4_0D_1_FREEZE_PASS`
- Releases: G4-B (caregiver submit/revise, Admin oversight), 0D-5
  (`attendance_submission_overdue`)
- Open points: **one**, §5 concurrent submission by two current caregivers
- Schema delta: **`DELTA`** — planned below, not applied
- Non-effects: no code, schema apply, migration, capability, manifest, secret,
  deployment, activation or traffic.

## 1. Owner, consumer and exact source

| Role | Party | Exact ref |
| --- | --- | --- |
| Canonical owner of attendance facts | Nurture Care domain | this record; no prior owner exists |
| Evidence sources | Nurture Care / Content domains | `NurtureDailyCareLog`, `NurtureCareCapture`, `NurtureChildMediaAttribution` (confirmed only) |
| Authority | 0C chain | records [`11`](./11-g4-0c-1-active-role-freeze.md), [`12`](./12-g4-0c-2-institution-scope-freeze.md), [`13`](./13-g4-0c-3-class-child-scope-freeze.md) |
| Consumers | G4-B, 0D-5 | — |
| Product source | `02-architecture.md` "Daily Attendance Closeout"; the owner ledger row for `attendance facts` | — |

The surface contract at `1.18.0` carries **no** attendance capability among its
34. Every capability in §4 is new and requires an additive rotation, which is
not performed here.

## 2. Type boundaries

The separation is the unit's core, because every failure mode is a collapse
between two of these five.

| Type | Class | Rule |
| --- | --- | --- |
| `AttendanceEvidence` | derived projection | Read-only over rows that already exist. It creates no fact and is never stored as one. |
| `AttendanceInference` | **AI candidate** | Non-canonical. Discrete semantics only — `likely_present`, `likely_absent`, `insufficient_evidence` — never a probability, score or percentage. |
| `DailyAttendanceSubmission` | canonical | The class/date snapshot a current class caregiver explicitly confirmed and submitted. |
| `AttendanceFact` | canonical | Produced **only** by a valid submission. |
| `ActivityCoverageProjection` | derived projection | How many children have business records. **Never equal to an attendance count**, and never presented as one. |

Three invariants:

- **An inference can never write an `AttendanceFact`,** directly or by being
  auto-accepted. It may retain its input revision, evidence refs, model/policy
  version and generation time for audit.
- **Coverage is not attendance.** A child with no record today is not absent;
  the projection answers "who has records", which is a different question with
  a different denominator. A presenter that renders coverage where attendance
  is expected reopens this unit.
- **No pseudo-precision.** `insufficient_evidence` is a first-class outcome, not
  a low-confidence guess. An inference that must answer will answer wrongly.

## 3. Frozen shape

```text
DailyAttendanceSubmissionV1
  careGroupRef      opaque
  localDate         the class's own date, resolved in the institution timezone
  watermark         { sourceKind, sourceSequence }  -- stable prefix, see §5
  submittedBy       roleAssignmentRef, a current class caregiver
  entries[]         { childProcessRef, state, adjustedFromInference }
  state             "unsubmitted" | "submitted" | "reopened"
  submissionHead    monotonic; every revision increments
  contractVersion   "1.0.0"
```

```text
AttendanceEntryState = present | absent | excused_absent | not_expected
```

`not_expected` exists so a child with no enrolment on that date is distinct
from one marked absent. A four-member closed enum, and adding a member is an
amendment with its own fixtures.

**Fields a caller MUST NOT synthesize:** `watermark`, `submissionHead`,
`submittedBy`. All three are issued by Nurture from stored state; a caller that
supplies them is rejected rather than trusted. This is 0C-1 §3's rule applied
to this unit's own writes.

The submission carries no child name, birth date, family reference or care
summary — `childProcessRef` only.

## 4. Capability and predicate

| Capability | Actor | Level reached |
| --- | --- | --- |
| `preview_daily_attendance` | current class caregiver | 0C-3 class scope |
| `submit_daily_attendance` | current class caregiver | 0C-3 class scope |
| `revise_daily_attendance` | current class caregiver | 0C-3 class scope |
| `query_class_attendance_state` | `institution_admin` | 0C-3 class scope |
| `reopen_daily_attendance` | `institution_admin` | 0C-3 class scope |

Every one resolves through the 0C chain in its fixed order. This unit adds no
level and defines no local authority path.

**Submission authority.** The actor must hold a CareGroup caregiver assignment
that is current for that class **on that date**, not merely current now. Any
teacher meeting that test may accept, adjust and submit in bulk; the submitter
and each per-entry adjustment are retained for audit.

**Admin may not submit, and may not become able to.** An `institution_admin`
may read the aggregate, chase, return and reopen. Confirming attendance and
rewriting an `AttendanceFact` are outside every Admin capability. A user
holding both roles must switch to the caregiver role and pass the same
same-date assignment test — 0C-1's no-merged-super-authority rule, which is why
the switch is a role selection rather than a permission union.

**Admin reads of the class aggregate are aggregates** in the sense of 0C-5 §5
and obey full-coverage-or-nothing. A submission state count over a class whose
members are not all readable returns `unavailable`, never a figure over the
readable ones.

**This unit emits no ordering** — of classes, children or entries. Per the
scope freeze, the board has nothing to inherit an ordering from.

## 5. Lifecycle, versioning and concurrency

**Watermark.** A preview reads a stable prefix of the day's evidence and
records where it cut. The mechanism is not invented here: `NurtureCareCapture`
already carries `stable` with "only a stable prefix is cut", and
`NurtureCareCaptureBatch` already records `watermarkSourceSequence` and
`cutAt`. 0D-1 reuses that shape rather than defining a second watermark whose
drift against the first would be undetectable.

**Same-day revision** is by a current class caregiver, directly, incrementing
`submissionHead`.

**Cross-day** the class caregiver can no longer revise directly. An Admin
`reopen` moves the submission to `reopened`, and only then may a current class
caregiver revise. Reopen never itself changes an entry.

**Idempotency.** `submit` and `reopen` carry a request id and are exact-replay
safe: the same identity returns the same result and creates no second
submission. `revise` carries `expectedSubmissionHead` and rejects on mismatch
rather than merging.

**Source drift after the watermark.** Evidence arriving after the cut does not
retroactively change a submitted fact and does not silently re-open one. Late
evidence becomes visible to the next preview, and 0D-5 may surface the gap. A
design that auto-adjusts a submitted fact from late evidence reopens this unit,
because the teacher's confirmation would become revocable by a background
process.

**Open point.** Two current caregivers submitting the same (class, date)
concurrently. Two candidate rules — last-writer-wins on `submissionHead`, or
first-writer-wins with the second rejected as a conflict — differ in whether a
teacher can silently overwrite a colleague's confirmation. **This must close
before 0D Exit.** 0D-5's `attendance_submission_overdue` does not depend on the
answer.

## 6. Default-safe behavior

| Condition | Result |
| --- | --- |
| No valid submission | `unsubmitted` — never auto-settled, never inferred |
| Inference unavailable | preview still opens with evidence and no inference; the teacher confirms without it |
| Evidence owner unavailable | deny `unavailable`; never a preview over a partial read |
| Class scope unresolved | inherit 0C-3's deny |
| Admin attempts to submit or edit an entry | deny `not_authorized` |
| Cross-day revision without reopen | deny `not_authorized` |
| `expectedSubmissionHead` mismatch | deny `conflict`; never a merge |
| Contract version mismatch | deny `contract_mismatch` |

`unsubmitted` is the load-bearing default. It is the state an absent teacher
produces, and it must stay visibly different from "everyone present" — a
closeout that settles itself removes the only signal that nobody checked.

## 7. Fixtures and gates

1. no submission leaves the day `unsubmitted`, and no elapsed time changes it;
2. an inference alone never produces an `AttendanceFact`;
3. a teacher whose assignment is current now but was not current on that date
   is denied;
4. an Admin is denied submit, entry edit and fact rewrite, with one code;
5. a dual-role user is denied under the admin role and admitted under the
   caregiver role with the same request;
6. same-day revision by a current class caregiver succeeds and increments the
   head;
7. cross-day revision denies without a reopen and succeeds after one;
8. a reopen changes no entry by itself;
9. replaying a submit request id returns the first result and creates no second
   submission;
10. evidence arriving after the watermark does not alter a submitted fact;
11. `insufficient_evidence` survives to the teacher rather than being resolved
    into a guess;
12. a coverage projection is never rendered as an attendance count;
13. an Admin class aggregate over a partially readable population returns
    `unavailable`, not a count over the readable members;
14. no response carries a score, band, rank, percentile or ordering.

Synthetic fixtures under I0. Real owner paths stay behind I3, joint conformance
behind I4.

## 8. Schema delta

**`DELTA` — planned, not applied.** Unlike 0C-1 through 0C-5, no existing model
carries these facts: the schema has no attendance table of any kind.

| Planned | Purpose |
| --- | --- |
| `NurtureDailyAttendanceSubmission` | class/date snapshot, watermark, head, submitter, state |
| `NurtureAttendanceEntry` | per-child entry with state and its adjusted-from-inference marker |
| `NurtureAttendanceInferenceRun` | audit of a non-canonical run: inputs, evidence refs, policy version, generated-at |

`AttendanceEvidence` and `ActivityCoverageProjection` are **derived and get no
table** — persisting either would create a second copy of facts that already
have owners, which is the drift 0A's inventory exists to prevent.

Migration authoring belongs to G4-B's implementation gate. G4-0 executes no
apply.

## Exit

`G4_0D_1_FREEZE_PASS` releases G4-B's attendance work and supplies 0D-5's
`attendance_submission_overdue` its checkpoint. It does not open implementation,
schema apply, capability rotation, activation, deployment or traffic, and it
does not complete 0D. The §5 open point must close before 0D Exit.
