# G4-0E-4 Formalization & Completion — Freeze Record

## Status

- Date: 2026-08-09
- Task: T-007
- Contract identity: `nurture.enrollment-formalization@1.0.0`
- Consumes: 0E-1…3 and pinned Base/My-Chat current-owner evidence contracts
- Verdict: `G4_0E_4_FREEZE_PASS`
- External qualification note: G-09 remains red; the observed My-Chat checkout is not adopted
- Schema delta: **planned, not applied**

## 1. Owners and boundary

Guardian acceptance of the current formal proposal is a human owner action.
My-Chat owns current Child/Family membership and both binding heads and issues
the short-lived purpose-bound `ScenarioCurrentOwnerBindingPairEvidenceV1` in
the accepted private invocation. Nurture owns Enrollment, Grant, CareGroup,
reservation, workflow business completion and command audit.

This is a two-owner sequence, not a distributed transaction. No raw platform
id, binding id/head, membership id or contact enters Nurture. Evidence does not
replace current local role/Enrollment/Grant/CareGroup/version checks.

The exact contract pin is `docs/project/integrations/my-chat-workflow-contract.json`:
Base and My-Chat contract SHA-256
`98f6c24115e02e4abf0e3c9d855849f1c7993974e2ed9bcc72c868c642433d2f`.
I3 cannot claim adoption while the current checkout differs from the pinned
My-Chat revision.

## 2. Frozen proposal, evidence and command

`EnrollmentFormalProposalV1` is one immutable proposal per workflow and carries
the same exact trial CareGroup and reservation, proposed formal start, Grant
purpose/duration changes, safe family summary, fixed proposal head `1`,
issued/expiry times and Admin actor/audit. V1 has no proposal revision command and does not
move the child to a different class during formalization; a class change needs
its own capacity/reservation operation before a future contract may allow it.

Guardian acceptance carries only an opaque acceptance ref, proposal head,
actor-safe time and the Host current-owner evidence. The Nurture command is:

```text
formalize_enrollment
  commandRequestId
  workflow/proposal/acceptance refs
  expected workflow/enrollment/grant/reservation/proposal heads
  private current-owner evidence
```

The caller cannot supply the actor role, local scope, before/after lifecycle,
owner-evidence hash, commit time, transition ref or result.

## 3. Local transaction and completion

After transport/signature/nonce/purpose/expiry verification and local current
authority reads, one serializable Nurture transaction:

1. locks the exact workflow, proposal, Enrollment, Grant, reservation and
   CareGroup capacity facts and verifies all expected heads;
2. keeps Enrollment `status=active` and changes phase `trial -> formal`;
3. retains the same exact active occupancy already created by trial start,
   without release/reacquire;
4. updates the existing Grant to the approved formal purpose/duration without
   widening beyond the accepted proposal/current policy;
5. records the acceptance ref, non-reversible owner-evidence hash, actor,
   before/after values, command execution and immutable transition;
6. adds `formal_enrollment_committed` and `journey_completed`, sets the Nurture
   business carrier to `completed/formalized`, and commits the head atomically.

There is no post-formalization settling stage or extra human completion gate.
My-Chat then exact-replays the body-free committed result into its generic
Run/Step ledger. Nurture does not add a shared workflow outbox. A Host replay or
delivery failure may show `waiting_on_system` for delivery while the committed
formal Enrollment and completed business carrier remain authoritative; it
cannot roll either back.

## 4. Failure and replay

| Condition | Result |
| --- | --- |
| Guardian has not accepted the current proposal | deny; Admin proposal/review/date cannot substitute |
| Evidence unavailable, invalid, expired, wrong purpose/audience or drifted | no local write; stay active/trial with the same occupied seat; `formalization_pending`/`waiting_on_system` only |
| Local role/Enrollment/Grant/CareGroup/head mismatch | no partial write; same canonical trial state |
| Changed-payload replay | conflict |
| Exact replay after response loss | same command result and completed head |
| Host Run/Step unavailable after local commit | formal facts stay committed; body-free replay retries |

Acceptance is valid only when `issuedAt <= acceptedAt < proposalExpiresAt`.
Formalization cannot commit before `proposedFormalStartAt`. Once acceptance is
timely, proposal expiry does not invalidate a later local retry with fresh
current-owner evidence and unchanged expected business heads.

Later formal offboarding is ordinary Enrollment/Grant/CareGroup maintenance.
It may change active/formal to ended under its own owner policy, but cannot
reopen this Journey or create a second Workflow by default.

## 5. Fixtures and gates

1. Admin proposal, review due or trial expiry never substitutes Guardian acceptance;
2. current-owner evidence is purpose/audience/nonce/expiry bound and contains no raw platform id;
3. cached/stale/unavailable evidence never formalizes;
4. same exact trial class/reservation is required;
5. phase, retained occupancy, Grant, transition and completion commit together;
6. any local conflict leaves active/trial plus the same occupied seat unchanged;
7. exact replay after response loss returns one result with no second transition;
8. changed replay conflicts;
9. projection cannot show formal/completed before local commit;
10. mobile/Web derive identical committed head after retry;
11. Host replay failure neither rolls back formalization nor invents settling;
12. ordinary later offboarding neither reopens Journey nor deletes identity/history.

Synthetic/local transaction tests belong to G4-D I1. Pinned My-Chat adapter,
private transport and current-owner negative qualification are I3/I4 and remain
blocked by G-09 until an adoption decision lands.

## 6. DB delta

Planned `NurtureEnrollmentFormalProposal` stores one immutable proposal per
workflow with fixed head `1`. The formalization audit reuses
`NurtureInstitutionWorkflowTransition` and `NurtureCommandExecution`; the
owner-evidence body is not persisted, only its non-reversible hash and detached
verification metadata allowlist. No Host Run/Step/outbox table is added.

## Exit

`G4_0E_4_FREEZE_PASS` completes the four 0E unit freezes. It does not qualify a
My-Chat owner adapter, register a capability or apply a migration.
