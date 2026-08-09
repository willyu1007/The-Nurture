# G4-0E Workflow & Enrollment Journey — Scope Freeze

## Status

- Date: 2026-08-09
- Task: T-007
- Stage: G4-0E Workflow & Enrollment Contracts
- State: **SCOPE ACCEPTED — unit freezes follow; no implementation or activation effect**
- Inputs: 0A inventory ([`07`](./07-g4-0a-inventory-record.md)), 0C Exit
  ([`19`](./19-g4-0c-exit-record.md)), and the D-07A…G decisions in
  `02-architecture.md`

This record fixes the decomposition and ownership of 0E. It authorizes only
the four freeze records below. It does not register a Workflow, apply a schema,
adopt a changed My-Chat checkout, or create a caller.

## Current facts

| Input | Current truth |
| --- | --- |
| Product Workflow | Only an institution-management `InstitutionWorkflow`; ordinary Grant, attendance, communication, support-signal and publish actions are not Workflows |
| First registry | Exactly `EnrollmentJourneyWorkflowV1` |
| Existing workflow persistence | `NurtureWorkflowProject/Capture/Checkpoint/Review` belong to the legacy `family_rule_trial` runtime path and are not reusable as Enrollment Journey facts |
| Existing Enrollment | `NurtureEnrollmentStatus=pending|active|paused|ended|withdrawn|deleted`; no `trial` member and no `participationPhase` column |
| Existing class capacity | `NurtureCareGroup.capacity`; no waitlist, offer or trial-reservation row exists |
| Existing identity evidence contract | Base/My-Chat `ScenarioCurrentOwnerBindingPairEvidenceV1`; raw `child_id`/`family_id` never enter Nurture |
| Runtime ownership | My-Workflow-Base supplies contract/template definitions; My-Chat owns persisted Run/Step/worker/ledger/outbox runtime |
| Manifest/module | No `EnrollmentJourneyWorkflowV1` declaration; it remains absent/default-off |

The pinned Base revision `4350086993d837baa8030564f4e19593dedd96b0`
matches the current Base checkout. The Nurture integration file pins My-Chat
`567b96cd5ddf2a0534fee21dd87f677439f40b78`; the observed checkout is
`05e83314dea393313604e93ca033afaed341eeae`, so G-09 remains red. No 0E record
adopts the observed head.

## Units and order

| Unit | Owns | Depends on | Releases |
| --- | --- | --- | --- |
| **0E-1 Workflow and inquiry** | the one-item registry; Nurture private business carrier; durable business-stage/waiting/milestone vocabulary; role-safe projection; command result/replay boundary; minimum-data inquiry and touchpoint types | 0C-1/0C-2, Base generic contracts | 0E-2, G4-D increment 1 |
| **0E-2 Waitlist and trial preparation** | capacity-only qualification, versioned category/FIFO policy, review, offer, accepted-offer reservation and `cancel_trial_preparation` | 0E-1, exact class owner | 0E-3 |
| **0E-3 Trial lifecycle** | `participationPhase`, trial-start, normal-care continuity, review/extend/end and local downscope | 0E-1, 0E-2, 0C/0D care facts | 0E-4 |
| **0E-4 Formalization and completion** | Guardian acceptance reference, current-owner evidence, one Nurture transaction, local completion, Host replay and later ordinary offboarding boundary | 0E-1…3, pinned Base/My-Chat evidence contracts | G4-D |

Inquiry is part of 0E-1 because it creates the one Enrollment Journey. It is
not a separate CRM Workflow. Offer acceptance and reservation are owned only by
0E-2; trial start/end only by 0E-3; formalization only by 0E-4. The 0E-1 state
kernel consumes their committed transitions but does not reimplement their
predicates or writes.

## Cross-cutting invariants

1. **Business stage, waiting state and pending transition are separate axes.**
   `capacity_waitlist` is a business stage only. `waiting_on_guardian`,
   `waiting_on_caregiver`, `waiting_on_system`, `scheduled_future` and
   `blocked` never enter or reorder the waitlist.
2. **Nurture owns business facts, not generic runtime.** Nurture stores no Host
   claim token, lease, worker Step, shared outbox or generic Run ledger.
3. **There is one command identity.** Every Nurture mutation reuses
   `NurtureCommandExecution`; no unit adds a second idempotency ledger.
4. **There is one exact class-capacity writer.** Waitlist offer acceptance,
   trial extension/end and formalization all lock the same class-capacity and
   reservation facts. Counts or cached projections never authorize a seat.
5. **Identity is never authority.** Current Host binding-pair evidence is an
   input to the Nurture owner transaction; Enrollment, Grant, exact CareGroup,
   role, purpose and source predicates still run locally.
6. **No timer mutates a business fact by itself.** Review, offer and trial
   deadlines create a due condition or explicit driver attempt only. They do
   not qualify, accept, expire, release, extend, end or formalize automatically.
7. **Projection is derived.** Mobile/Web consume the same versioned projection
   and cannot assemble Workflow state from Enrollment, offer or Run labels.

## Explicitly deferred or forbidden

- a generic Workflow builder, a second InstitutionWorkflow, CRM scoring,
  conversion probability or child/family fit scoring;
- raw phone/WeChat/email/account fields, external transcripts, legal name or
  full birth date in the inquiry default;
- `TrialChild`, trial-specific attendance/media/retention/caregiver pipelines;
- a `trial` member in `NurtureEnrollmentStatus`;
- automatic waitlist ordering, offer sending, reservation release, trial
  extension/end, formalization or post-formalization settling;
- capability/manifest registration before G4-D reaches its later contract and
  owner gates.

## Exit

0E Exit requires all four unit records, a 0G cross-contract audit and a branch
release. It opens G4-D I1 implementation and nothing above it: no shared or
persistent database apply, I2 capability rotation, I3 owner claim, I4 joint
conformance, activation, deployment or traffic.

