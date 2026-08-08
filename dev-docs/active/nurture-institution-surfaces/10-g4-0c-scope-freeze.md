# G4-0C Authority & Surface — Scope Freeze

## Status

- Date: 2026-08-08
- Task: T-007
- Stage: G4-0C Authority & Surface Contracts
- State: **SCOPE ACCEPTED — no freeze record issued, no implementation opened**
- Decision: full 0C, chosen 2026-08-08 over the `0C-min` fast lane
  ([`09-0c-min-fast-lane-proposal.md`](./09-0c-min-fast-lane-proposal.md))

This document fixes what 0C covers, in what order, and what each unit must
produce. It is the scope contract for the freeze work, not the freeze itself.
No unit here grants implementation, schema apply, activation, deployment or
traffic.

## Why full 0C

`0C-min` would have taken four of 0C's seven items and unblocked only its own
read module. G4-B needs class/child scope and G4-D needs Grant policy, so
neither would have moved. With the shared foundation as the priority, the
narrow lane bought earlier evidence on one module at the price of a second
requalification round and a predicate likely to need a breaking reshape when
0C extended it.

## Inputs (current, verified 2026-08-08)

| Input | Identity | State |
| --- | --- | --- |
| Surface contract | `nurture.surface-contract@1.17.0` / `sha256:d22851d9…` at scope-freeze time; **rotated additively to `1.18.0` / `sha256:be84bb23…` by 0C-4** (34 capabilities / 6 surfaces, `sharedCoreHash` unchanged) | `PRESENT_PINNED` |
| My-Workflow-Base | `4350086993d837baa8030564f4e19593dedd96b0` | `PRESENT_PINNED` |
| My-Chat | `51ad97f721bf74cced3ec75d24f3066c4ef6ab1c` | `PRESENT_PINNED` |
| Base/My-Chat parity | `98f6c24115e02e4abf0e3c9d855849f1c7993974e2ed9bcc72c868c642433d2f` (21 files) | `PRESENT_PINNED` |
| Nurture self-pin | `c18ef2e070de91a401aa374e09e5b0f914bc8f497382e9c0bc48901e0f1b2e38` (204 files) | `PRESENT_PINNED` |
| T-002 owner path | `21-c30-landing-requalification-record.md` — `verify:owner-integration` at `1.17.0`, 25 actions / 8 queries / 0 unexercised, both joint journeys PASS | `PRESENT_PINNED` (restored 2026-08-08) |
| T-005 G2-B Admin owner-read | `nurture.institution-business-communication-owner-read@1.0.0` / `sha256:dd1b63fe…`, implemented, ingress-exposed, default-off | `DEFINED_UNQUALIFIED` → 0C-4 consumer qualification |
| T-006 board/publication | exact care facts, attribution, Board and `PublishProcess` | `DEFINED_UNQUALIFIED` |

0C cites the requalification record for the owner path. It must not cite
T-002's G1 Joint Conformance record, which is exact history at its own
topology.

## Units and order

Seven scope items decompose into six ordered units. Each produces one freeze
record satisfying all eight requirements of the `01-plan.md` freeze-record
contract.

| Unit | Covers | Depends on | Releases |
| --- | --- | --- | --- |
| **0C-1 Active role & actor context** | explicit active-role selection, no merged super-authority, Lead as assignment metadata only, host-authenticated principal → Nurture actor resolution | — | every later unit |
| **0C-2 Institution scope** | `current_institution_admin`, `exact_institution_scope`, cross-institution denial, the `institution_workbench` / `institution_board` authority rules the visibility matrix already asserts | 0C-1 | 0C-4, G4-A |
| **0C-3 Class & child scope** | class-level scope, child-level drill-down predicate, purpose limitation, the rule that admin authority never implies full child-fact read | 0C-2 | G4-B, G4-C |
| **0C-4 Surface envelope & communication owner-read** | `institution_workbench` envelope, per-content-kind availability, empty-state vocabulary, and promotion of the T-005 G2-B owner-read into a public read capability with `actions: []` preserved | 0C-2 | the workbench's first module |
| **0C-5 Grant policy & aggregate privacy** | `GrantRequest` versus `Grant` separation (`grant_request_is_not_grant`), data-class/direction/purpose predicates, safe aggregation rules, de-ranking and no-scoring invariants | 0C-2, 0C-3 | G4-A, G4-D |
| **0C-6 Roster & invite, first increment** | single explicit roster/invite command shape, parent confirmation, enrollment/grant lifecycle touchpoints; bulk stays deferred per 0A | 0C-1, 0C-5 | G4-C |

Critical path: `0C-1 → 0C-2 → {0C-3, 0C-4}` then `0C-5 → 0C-6`. 0C-3 and 0C-4
are parallel after 0C-2.

## Predicate shape, fixed now

Every authority decision in 0C resolves in this fixed order, and a unit that
has not yet frozen a level denies at that level rather than skipping it:

```text
active role → institution scope → class/child scope → Grant/data-class/purpose
```

Fixing the order now is what the rejected `0C-min` could not guarantee: a later
unit fills a level in, it never reshapes the chain. Any change to the order
itself reopens 0C rather than amending a unit.

## Explicitly deferred

- Bulk roster/invite — 0A defers it; the first increment is single explicit
  commands only.
- Family-share projection without an approved schema — frozen Institution-only
  per 0A.
- AI attention — absent/default-off per 0A, owned by 0D.
- Attendance, class schedule and support signal — 0D.
- `InstitutionWorkflow` registry, carrier and projection — 0E.
- Knowledge and RAG — 0F.

## Exit

0C Exit requires all six units to hold an exact freeze record with owner, pin,
version, default and negative fixtures, plus a rolling branch release through
0G. Reaching that Exit opens G4-A implementation and supplies the common
authority base to G4-B/C/D/E. The Exit is not Owner Readiness, Joint
Conformance, a Beta Profile Handoff, Candidate Freeze, activation or traffic
authority, and 0C alone neither starts nor completes T-007.

## Non-effects of this document

Accepting this scope changes no code, schema, manifest, capability, database,
secret or configuration. The only thing authorized here is authoring 0C-1.
