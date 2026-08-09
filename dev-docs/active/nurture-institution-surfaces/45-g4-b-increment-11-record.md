# G4-B Increment 11 — Concrete Signal Owners and Policy Qualification

## Verdict

- Date: 2026-08-09
- Task: T-007
- Branch: G4-B, under [`33`](./33-g4-b-i1-branch-freeze.md)
- Commit: `598926e`
- Effect level: **I1 only**
- Verdict: six-port production composition and disposable policy-migration
  qualification PASS; G-03 remains partial at two missing canonical owner facts

This increment replaces the abstract six-port composition gap with one concrete
Prisma composition path. It does not manufacture the two facts the current
owners cannot yet supply, so it does not claim I3 Owner Readiness.

## Exact owner bindings

`createPrismaInstitutionSupportSignalRepository` composes the policy SSOT with
one provider per deterministic category:

| Category | Concrete owner rows | Result today |
| --- | --- | --- |
| `attendance_submission_overdue` | `NurtureDailyAttendanceSubmission` plus Institution local-day policy | submitted/reopened source is resolved and absent; enabled unsubmitted source is `unavailable` because no owner checkpoint instant exists |
| `business_response_overdue` | exact authorized Institution business communication | active `awaiting_reply` item with its stored `dueAt` |
| `review_backlog_threshold` | unplaced `daily_care_log` placements, direct Grant and full class population | current authorized member counts; no unreadable placement affects count or occurrence time |
| `authority_or_source_blocked` | exact owner scope | `unavailable` while no readable canonical blocker fact exists; redaction is terminal absence, not a blocker |
| `work_item_or_workflow_blocked` | current terminal `NurtureChildLinkReceipt` | only literal stored `blocked` with `item_action|workflow_step`; no ordinary status translation |
| `configured_load_threshold` | active G2 family-care questions, direct Grant and full class population | current pending-work counts within the policy local day |

Every provider rechecks the exact Workspace, participant, selected active
`institution_admin` role assignment and Institution before reading facts. The
role is not replaced with “any Admin role”. Local-day windows come only from
the effective Institution publication policy; UTC is not a fallback.

Source refs are actor-bound HMAC handles. Raw message, receipt, item, placement
and child-process IDs do not become signal source refs. Threshold reads compare
the full active-enrollment census with the authorized aggregate population.

## Completeness and failure behavior

Absent or wholly disabled categories do not call their owner, preserving the
frozen “unconfigured load means disabled” rule. An enabled owner that cannot
prove its canonical fact returns `unavailable`; the combined deterministic
reader never exposes the other categories as a complete partial list.

Provider candidate reads and population size are bounded at 100 owner rows. An
over-limit class, message, placement, receipt, item or population read returns `unavailable`.
The value is an operational completeness guard, not a signal threshold and not
a reason to truncate.

The architecture review removed one invalid intermediate mapping:
`source_redacted` had briefly been treated as
`authority_or_source_blocked`. The frozen lifecycle says redacted sources
disappear from the next snapshot, so the final code refuses that translation.
No new deadline or blocker state was added.

## Policy migration qualification

The user approved exact disposable target
`nurture_t007_0d5_20260809_1132_a71c9e4d` on local PostgreSQL. A clean
`prisma migrate deploy` applied all 26 migrations, including
`20260809180000_g4b_institution_support_signal_policy`.

A real effective policy row loaded through the production repository.
PostgreSQL rejected revision `0`, a threshold category without a threshold, an
invalid effective interval and a duplicate partial-unique revision. The final
full production-DB lane passed 353/353. The database was then dropped by exact
name and verified absent. Detailed evidence is under
[`artifacts/db/0d5-support-signal-policy`](./artifacts/db/0d5-support-signal-policy/03-execution-log.md).

## Falsification

| Attempt | Required result | Evidence |
| --- | --- | --- |
| Treat a redacted communication as blocked | refused | authority/source owner returns `unavailable`; no blocker fact is emitted |
| Derive attendance deadline from local day | refused | enabled unsubmitted attendance returns `unavailable` |
| Translate an ordinary receipt status | absent | query admits only literal `blocked` and exact driver types |
| Present an over-limit scope as complete | refused | 101-class real-row fixture returns `unavailable` |
| Count unreadable backlog rows or use their timestamp | excluded | direct Grant filter controls both count and `occurred_at` |
| Read with a different role assignment held by the same actor | refused | all six providers return `unavailable` |
| Leak a raw owner row ID as `sourceRef` | refused | actor-bound 32-character opaque refs only |
| Apply policy migration to shared local DB | did not occur | child URL was rewritten to the exact disposable target; target destroyed after run |

## Verification

- Scenario and DB package typechecks: zero errors.
- Full unit lane: **826/826**, 73 files.
- Exact-owner integration: **5/5** on the disposable DB.
- Full production-DB lane: **353/353**, 37 files.
- Test routing: 137 files — unit 73, production DB 37, dev host 11,
  scenario service 14 and X5 joint 2.
- Persistence boundary, G2 Exit DB census, G3-0 freeze, C30 default-off,
  database tooling and whitespace checks pass.
- C30-I3 Nurture source lock passes at `598926e`, hash `138062fb…`; exact
  Nurture runtime self-pin is `ae8e201e…` over 224 files.
- External My-Chat remains intentionally unadopted: workflow pin expected
  `567b96c`, C30 upstream expected `51ad97f`, observed `9674886`.

## Remaining gate and non-effects

G-03 now waits only on canonical owner facts, not on port composition or policy
migration qualification. Attendance must expose its existing configured
checkpoint instant. Authority/source work must expose a currently readable
canonical blocker fact. Until then an enabled category remains unavailable;
the signal layer MUST NOT add a deadline, translate redaction, reinterpret an
ordinary status or claim an empty complete result.

No database was migrated anywhere durable, and no production caller,
capability, contract rotation, deployment, activation or traffic was added.
