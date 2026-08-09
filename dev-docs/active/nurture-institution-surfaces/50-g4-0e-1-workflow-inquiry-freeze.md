# G4-0E-1 InstitutionWorkflow & Inquiry — Freeze Record

## Status

- Date: 2026-08-09
- Task: T-007
- Contract identity: `nurture.enrollment-journey-workflow@1.0.0`
- Workflow type: exactly `EnrollmentJourneyWorkflowV1`
- Consumes: 0C-1/0C-2 and the Base generic contract pin from [`49`](./49-g4-0e-scope-freeze.md)
- Verdict: `G4_0E_1_FREEZE_PASS`
- Schema delta: **planned, not applied**
- Non-effects: no manifest registration, caller, schema apply, activation or traffic.

## 1. Owner, consumer and source

| Role | Owner/source |
| --- | --- |
| Business type, stage, inquiry facts, transition and projection | Nurture Workflow/Enrollment domains; this record |
| Institution authority | 0C chain, exact current `institution_admin` role |
| Generic Run/Step contract | My-Workflow-Base revision `4350086…`; My-Chat owns runtime persistence and workers |
| Raw contact/account | My-Chat invitation/contact owner; Nurture receives an opaque current contact ref only |
| Consumers | G4-B read-only mobile module; G4-C Web queue/actions; My-Chat generic runtime bridge |

Legacy `NurtureWorkflowProject` is excluded by type and table name. A migration,
repository or adapter that writes Enrollment Journey data there fails this
freeze.

## 2. Type boundaries and registry

The registry is a closed one-item tuple. Ordinary actions and facts do not
appear in it.

```text
InstitutionWorkflowRegistryV1 = [EnrollmentJourneyWorkflowV1]
```

`InstitutionWorkflowCarrierV1` is Nurture-private canonical business state. It
contains an opaque Nurture `workflowRef`, one My-Chat-owned
`CanonicalRef{namespace=my_chat, object_type=workflow_run}` issued through the
pinned generic runtime boundary, exact Institution, workflow type, provisional
subject, optional later `childCareProcessRef`, current business stage, waiting
state, pending transition, terminal outcome, head and timestamps. It contains
no raw Host identity, contact value, Run/Step lease or protected touchpoint body.

`InstitutionWorkflowProjectionV1` is a request-composed, noncanonical,
role-safe read. It is never stored. Host Run/Step state may contribute only
through a pinned adapter; it cannot override a committed Nurture business fact.

AI summary is a review candidate, never a touchpoint or stage transition.
External structured summaries are Admin-authored protected facts with
append-only correction; they are not transcripts.

## 3. Exact vocabulary and shapes

Durable business stages:

```text
inquiry | intent_conversation | visit_or_consultation | capacity_waitlist
| trial_preparation | trial_in_progress | trial_review
| formal_enrollment_confirmation | completed | closed
```

`formal_enrollment` is a committed milestone, not a separately durable
post-activation stage: the formalization transaction adds that milestone and
enters `completed` atomically.

Orthogonal waiting states:

```text
ready | waiting_on_guardian | waiting_on_caregiver | waiting_on_system
| scheduled_future | blocked
```

Orthogonal pending transitions:

```text
none | trial_start_pending | formalization_pending | exit_pending
```

Lifecycle and terminal outcome:

```text
lifecycle = active | completed | closed_without_formalization
terminalOutcome = none | formalized | inquiry_closed | waitlist_withdrawn
                | preparation_cancelled | trial_ended
```

The first version exposes these milestones only:

```text
inquiry_started | intent_confirmed | visit_recorded | waitlist_qualified
| trial_offer_accepted | trial_started | trial_review_reached | trial_extended
| formal_proposed | guardian_formal_acceptance_recorded
| preparation_cancelled | trial_ended | formal_enrollment_committed
| journey_completed
```

Projection fields are exact: My-Chat-owned opaque canonical `workflowRunRef`,
`workflowType`, fixed safe title/summary, derived presentation `state`,
lifecycle, stage, waiting state, pending transition, completed milestones,
fixed safe blocker/next action, responsible role, started/updated and optional
canonical due time, `workflowHead`, `projectionVersion=1`, and role-authorized
capability refs. Admin mobile capability refs are always empty. The Nurture
private `workflowRef` is not projected in place of the Host ref.

Minimum inquiry facts:

- preferred/nickname label;
- protected birth year-month **or** age-band key;
- expected entry date or bounded window;
- target class type/age band and optional exact class once selected;
- care-schedule need keys, source channel, Host opaque contact ref and safe
  contact label;
- safety-label keys, last touchpoint and next touchpoint.

Legal name, full date of birth, raw contact/account identity and deeper health
facts are absent by default. Callers may propose minimum facts and a request
identity; they MUST NOT supply `workflowRef`, stage, waiting state, milestone,
head, actor role/scope, contact currentness or server timestamps.

## 4. Capabilities and authority

0E-1 owns only:

```text
start_enrollment_inquiry
record_external_touchpoint
confirm_native_touchpoint_note
confirm_intent_conversation
record_or_skip_visit
close_inquiry
query_institution_workflow
```

Every Admin command resolves the exact current 0C-1/0C-2 chain. A dual-role
user acts only under the selected current `institution_admin` assignment.
Native touchpoint confirmation additionally owner-reads the cited current
business communication; external summaries require an Admin protected carrier
and never accept an attachment or transcript. AI may produce a cited candidate
but cannot call a stage command.

## 5. Lifecycle, idempotency and replay

- `start_enrollment_inquiry` creates one workflow, one provisional subject and
  one inquiry fact atomically at `head=1`, stage `inquiry`, milestone
  `inquiry_started`.
- `confirm_intent_conversation` requires at least one current, confirmed
  touchpoint and advances explicitly. A new inquiry, due date or AI candidate
  never advances it.
- visit is optional; recording or skipping it is explicit and does not imply
  capacity, trial or identity readiness.
- all writes carry one request identity plus `expectedWorkflowHead`; exact
  replay returns the same `NurtureCommandExecution` result, changed payload is
  conflict, and concurrent heads never merge.
- the Nurture command result is body-free and contains only command execution,
  workflow/transition refs, committed head/stage/waiting/milestone refs. My-Chat
  owns generic Step completion and replay after this boundary.
- no Nurture workflow outbox is added. Response loss recovers from the existing
  command ledger and committed transition.

## 6. Default-safe behavior

| Condition | Result |
| --- | --- |
| Unknown workflow type | absent/unsupported; never fallback to legacy WorkflowProject |
| Role/Institution unresolved | 0C deny |
| Host contact owner unavailable | inquiry command unavailable; never store raw fallback contact |
| Native source unreadable/redacted/revoked | no note and no stage advance |
| AI/source failure | no candidate/note/transition; manual Admin path remains |
| Contract mismatch | contract-admission denial before authority or write |
| Head conflict | command conflict; no merge |
| No applicable workflow on mobile | versioned legal empty projection |

## 7. Fixtures and gates

1. registry contains exactly one type and rejects every ordinary action as a Workflow;
2. manifest/module remain free of the type before I2;
3. stage, waiting state and pending transition vary independently;
4. `capacity_waitlist` cannot be constructed as a waiting state;
5. formalization milestone and `completed` commit together with no settling stage;
6. Admin mobile receives no capability refs or private inquiry/contact/body fields;
7. wrong/ambiguous role, Institution drift and head conflict fail closed;
8. raw phone/WeChat/email/account, legal name and full birth date are rejected;
9. external correction appends and preserves author/time/history;
10. AI summary, new inquiry and next-touchpoint date never advance a stage;
11. exact replay returns one command result and changed-payload replay conflicts;
12. Host replay failure never rolls back a committed Nurture business transition.

Synthetic registry/projection tests belong to the first G4-D increment. Real
contact, protected carrier and Host runtime adapters remain I3/I4 gates.

## 8. DB delta

Planned tables, not applied:

| Table | Purpose |
| --- | --- |
| `NurtureInstitutionWorkflow` | current private business carrier/head plus the opaque My-Chat workflow Run canonical ref |
| `NurtureEnrollmentInquiry` | minimum provisional subject/inquiry facts, no raw contact |
| `NurtureEnrollmentTouchpoint` | append-only native ref or protected external summary revision |
| `NurtureInstitutionWorkflowTransition` | immutable before/after business transition and audit |

`InstitutionWorkflowProjectionV1`, Host Run/Step and AI candidates get no
Nurture table. `NurtureCommandExecution` is reused for idempotency.

## Exit

`G4_0E_1_FREEZE_PASS` releases 0E-2 and the first synthetic G4-D increment. It
does not register or activate the Workflow.
