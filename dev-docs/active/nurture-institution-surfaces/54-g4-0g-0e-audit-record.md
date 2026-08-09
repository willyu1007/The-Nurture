# G4-0G Cross-contract Audit — G4-0E Branch

## Verdict

- Date: 2026-08-09
- Task: T-007
- Scope: records [`49`](./49-g4-0e-scope-freeze.md)…[`53`](./53-g4-0e-4-formalization-completion-freeze.md)
- Verdict: `G4_0G_0E_AUDIT_PASS`
- Findings: three design collisions found and resolved in the issued records;
  none deferred
- Effects: documentation only.

## Findings resolved

### 1. Inquiry could have become a second Workflow

The pre-implementation register gives inquiry product rules but only four 0E
contract rows. Creating a fifth inquiry Workflow or CRM carrier would violate
the one-item registry. Record 49 assigns inquiry to 0E-1 as the first stage and
one-to-one provisional subject of the same Journey. It cannot be discovered or
started independently as another workflow type.

### 2. Formal Enrollment could have introduced a settling state

The product journey names `formal_enrollment`, while D-07F says the commit is
the last milestone and completion is immediate. Treating both as durable
stages creates an observable post-activation interval. Record 50 resolves the
collision by making `formal_enrollment_committed` a milestone added in the same
transaction that enters durable stage `completed`.

### 3. Generic replay/outbox ownership was ambiguous

Nurture needs recoverable business writes, but My-Chat owns shared
Run/Step/ledger/outbox. Records 50 and 53 now use the existing Nurture command
ledger plus immutable business transitions for local response loss and a
body-free committed result for Host replay. They explicitly add no Nurture
shared workflow outbox. The scenario-local family-growth provider outbox is not
reused.

## Cross-contract invariants confirmed

1. The registry contains exactly one Workflow and no ordinary action/signal.
2. The legacy family-rule-trial models are neither reused nor renamed into the
   Enrollment Journey.
3. Business stage, waiting state and pending transition are separate; only
   exact full-class capacity creates `capacity_waitlist`.
4. 0E-2 alone creates/releases the preparation reservation; 0E-3 alone
   starts/extends/ends trial; 0E-4 alone formalizes.
5. All four mutation families reuse one command ledger and expected-head rule.
6. No clock mutates lifecycle by itself.
7. The phase mapping adds no `trial` status and creates no parallel care path.
8. Current Host identity evidence is necessary where frozen and never
   sufficient authority.
9. Projection is stored nowhere, exposes no raw identity/contact/private body,
   and Admin mobile has no commands.
10. Formalization and Nurture business completion are atomic; Host replay is a
    later generic-runtime consequence.

## Source qualification note

Base is at the pinned revision. My-Chat checkout drift remains G-09. This is
not an unresolved 0E product/schema choice and therefore does not prevent a
freeze pass, but it prevents any later I3 claim based on the unadopted checkout.

## Exit

All four records satisfy the eight-part freeze-record contract and their
capability/fact ownership does not overlap. 0E Exit is reachable.

