# Verification — 机构端双 Surface

## Planning Baseline

| Date | Check | Result |
| --- | --- | --- |
| 2026-07-29 | Institution mobile fixed as read-only | PASS |
| 2026-07-29 | Family-private body excluded from aggregates | PASS |
| 2026-07-29 | Open product questions kept explicit | PASS |
| 2026-07-29 | InstitutionWorkflow limited to institution management | PASS |
| 2026-07-29 | Web operation and mobile read-only Workflow projection boundary locked | PASS |
| 2026-07-29 | Context strict verification plus project governance sync/lint after terminology consolidation | PASS |
| 2026-07-30 | Lead fixed as Admin-managed designation with no permission delta | PASS |
| 2026-07-30 | Mobile/Web fixed as active-role-bound; current Web limited to Institution Admin | PASS |
| 2026-07-30 | Admin mobile read-only separated from caregiver attendance submission | PASS |
| 2026-07-30 | Attendance inference separated from teacher-confirmed canonical facts and record coverage | PASS |
| 2026-07-30 | Same-day teacher correction and cross-day Admin-reopen/teacher-correction rule locked | PASS |
| 2026-07-30 | Institution-editable knowledge, source-aware citations and medical conflict handling locked | PASS |
| 2026-07-30 | Nurture scenario knowledge policy separated from My-Chat generic RAG runtime | PASS |
| 2026-07-30 | D-04 Admin mobile fixed as class-first with independent effective schedules | PASS |
| 2026-07-30 | Activity evidence placement and unplaced fallback separated from activity completion | PASS |
| 2026-07-30 | Institution business communication fixed as disclosed Admin read-only without teacher escalation | PASS |
| 2026-07-30 | Admin communication read kept separate from CareGroup reply authority and family-private AI | PASS |
| 2026-07-30 | AI intervention candidate deferred and limited to the same cited owner-read scope | PASS |
| 2026-07-30 | D-05 class card fixed to deterministic latest-photo/current-state summary, not subjective representative media or KPI | PASS |
| 2026-07-30 | Class detail and Admin Web fixed to complete actor-safe photo/text records with purpose-limited child drill-down | PASS |
| 2026-07-30 | Admin placement/child-association changes fixed as append-only revisions preserving teacher source and automatic-match provenance | PASS |
| 2026-07-30 | D-06 support signals limited to deterministic sources and Institution-configured absolute thresholds | PASS |
| 2026-07-30 | Two-tier support semantics separated from scoring, ranking, AI severity and Workflow automation | PASS |
| 2026-07-30 | Mobile read-only signal projection separated from Admin Web policy/source actions | PASS |
| 2026-07-30 | D-07 first implementation limited to one complete EnrollmentJourneyWorkflow | PASS |
| 2026-07-30 | Capacity waitlist limited to full-class capacity and separated from generic waiting/blocking state | PASS |
| 2026-07-30 | Journey fixed from inquiry through trial, activation and settling without freezing detailed state/schema | PASS |
| 2026-07-30 | Provisional identity, Guardian trial consent and binding/Grant publication gates retained | PASS |

## Documentation Verification

| Date | Command / Check | Result |
| --- | --- | --- |
| 2026-07-30 | `git diff --check` | PASS |
| 2026-07-30 | `node .ai/scripts/ctl-project-governance.mjs lint --check --project main` | PASS |
| 2026-07-30 | `node .ai/skills/features/context-awareness/scripts/ctl-context.mjs verify --strict` | PASS |
| 2026-07-30 | stale generic mobile/Web and non-editable-medical wording audit | PASS |
| 2026-07-30 | stale D-05 pending wording and latest-photo/Web-canonical-boundary audit | PASS |
| 2026-07-30 | stale D-06/open-threshold wording and signal/action-separation audit | PASS |
| 2026-07-30 | stale narrow-onboarding/generic-waitlist/D-07 activation wording audit | PASS |

## Planned Verification

- Institution/group/enrollment/grant policy tests.
- Aggregate privacy, small-sample and revoke/redaction tests.
- Presenter snapshots for mobile and Web.
- Class-first home/detail snapshots for different class schedules, temporary-day override and
  unplaced activity evidence.
- Negative tests proving missing photos/text do not produce an “activity did not happen” fact.
- Latest-photo selection tests for explicit cover, current-activity latest, today fallback,
  deterministic tie-break, no-photo fallback and new-snapshot recomputation.
- Negative latest-photo tests for review-required, candidate-only, uncertain attribution,
  withdrawn/redacted/revoked/invalid/reassigned source and cross-class media.
- Class-card schema/snapshot tests proving no communication body, child roster, AI attendance
  inference, biometric confidence/embedding, teacher metric or freshness score leaks.
- Class-detail tests for complete actor-safe activity media/text, communication, family feedback,
  attendance and exact-purpose child-level drill-down.
- Admin Web tests for institution-authored media/text creation, full authorized retrieval,
  cover selection, placement/child-association revisions and source lifecycle invalidation.
- Immutability/audit tests proving Admin cannot overwrite teacher body/media/author/source time
  and every adjustment retains original automatic/teacher provenance plus revision history.
- Institution Admin communication owner-read tests for exact Institution/Enrollment/CareGroup,
  original Grant/data class/purpose, disclosure, current source/correction/redaction and
  cross-Institution denial.
- Tests proving Admin body read does not authorize acknowledge/reply/correct/redact and never
  reveals family-private AI, drafts, My-Chat private chat or another Institution.
- Future AI attention tests for source citation, no score/diagnosis/automatic action and
  correction/redaction/revoke invalidation; capability remains absent/default-off until qualified.
- Support-signal source tests for attendance/response deadline, review backlog, authority/source
  blocker, WorkItem/Workflow blocker and configured absolute load threshold.
- Policy tests for exact Institution/class/category, version/effective period, absolute count/
  window, unconfigured-disabled behavior, Admin audit and no peer/historical baseline inputs.
- Tier tests proving only canonical overdue/blockers map to `action_required`; load thresholds
  and future AI candidates map to `attention_suggested`, and AI cannot choose/escalate tier.
- Stable derivation/dedupe/sort tests for source identity, policy revision, window, explicit
  deadline, business state and occurredAt without hidden score.
- Invalidation tests proving resolved/corrected/withdrawn/redacted/revoked/out-of-scope sources
  remove the projection and create no lasting teacher/class performance history.
- Mobile tests for at-most-three cross-class signals, body-free class counts/reasons, exact
  owner-read drill-down and absence of dismiss/ack/escalate commands.
- Web tests proving policy/source actions are explicit and signal creation never auto-creates
  reply, notification, WorkItem or Workflow.
- Workflow registry/discovery tests proving the first increment exposes only
  `EnrollmentJourneyWorkflowV1`; Grant change, attendance, knowledge, CareInteraction,
  PublishProcess and support signal remain Action/WorkItem/projection semantics.
- Journey branch tests for inquiry, intent touchpoints, optional visit, optional capacity
  waitlist, trial preparation/in-progress/review, offer, activation, settling and completion.
- Negative waitlist tests proving only class-capacity unavailability enters the stage; waiting on
  Guardian/caregiver/system/future date/blocker does not affect waitlist ordering or statistics.
- Provisional/identity tests proving inquiry cannot mint/infer My-Chat Child/Family identity and
  no local provisional relation grants protected Nurture access.
- Trial tests for Guardian consent, exact trial CareGroup caregiver scope, internal-only
  provisional data and current binding/Grant before family-facing media/text projection.
- Responsibility tests for Admin accountability, current waiting party, Lead/coordinator
  no-permission-delta and no caregiver Admin-Web access.
- Activation/settling tests proving Enrollment may become active before Workflow completion,
  completion requires the later configured settling gate, and no adaptation score is produced.
- Activation-negative tests keeping exact journey enums/transitions/commands/schema default-off
  until the six documented D-07 deep-dive decisions are closed.
- Roster/invite/confirmation/grant state-machine tests.
- Cross-institution, cross-group and wrong-child negative tests.
- Black-box six-role fixture segment through public contracts.
- Anti-ranking and non-diagnostic content review.
- Active-role switching and multi-role non-union tests.
- Non-Admin `InstitutionAdminWorkbench` route/capability negative tests; Lead permission-delta
  negative tests.
- Attendance tests for AI-only inference, teacher explicit submit, insufficient evidence,
  unsubmitted class, Admin non-substitution, same-day correction, cross-day reopen and concurrent
  teacher revision.
- Tests proving `ActivityCoverageProjection` cannot be consumed as canonical attendance.
- Knowledge tests for Admin editing/publishing, draft isolation, revision withdrawal, authority
  links, per-claim citations and copy/export provenance.
- RAG tests for wrong Institution/audience/role/purpose, unauthorized child facts, expired
  revision, no eligible source, medical source conflict, abstention and emergency boundary.
- Cross-surface projection-version/state/milestone consistency tests.
- Same-role negative tests for wrong Workspace/Institution/scope/assignment.
- Negative tests for raw Run/Step/token/internal-note leakage and mobile mutation.

## Required Evidence

测试必须说明 active role、actor、grant、child/group scope、attendance assignment/date、
knowledge revision、fixture version 与 source pin。不得用匿名化不足的真实数据验证
aggregate、出勤推理或 RAG。
