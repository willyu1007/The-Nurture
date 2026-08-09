# G4-D Increment 1 — Workflow Registry, State Guard & Projection

## Verdict

- Date: 2026-08-09
- Task: T-007
- Input: `G4_0E_EXIT_PASS` ([`55`](./55-g4-0e-exit-record.md)) and I1 branch
  freeze ([`56`](./56-g4-d-i1-branch-freeze.md))
- Verdict: `G4_D_INCREMENT_1_PASS`
- Scope: 0E-1 pure registry/state/projection only
- Effects: source, tests and task docs. No schema, migration, database, manifest,
  owner adapter, caller, capability, activation, deployment or traffic.

## What landed

`enrollment-journey-workflow.ts` exports one closed local domain registry:

```text
[EnrollmentJourneyWorkflowV1]
```

It also exports the exact 0E-1 business stage, waiting, pending transition,
lifecycle, terminal outcome and milestone vocabularies. The guard rejects
unknown contract/type/vocabulary values, malformed or body-bearing refs,
noncanonical milestone histories, wrong pending-stage/waiting combinations and
partial terminal/formalization states.

The first projection is intentionally read-only and action-free. It accepts a
private Nurture snapshot plus a My-Chat-owned opaque workflow Run
`CanonicalRef`, then returns fixed safe title/summary/blocker/next-action text,
derived state, exact axes, milestone/head/version/times and an empty capability
list. It does not project the private Nurture workflow ref, inquiry/contact
facts, protected body, Child/Family identity, claim, lease or Step internals.

## Quality repairs made before release

1. Replaced an initial Nurture private-ref substitution in `workflowRunRef`
   with the exact My-Chat canonical Run ref.
2. Reused Base `assertCanonicalRef`, rejects unknown keys and copies only the
   allowlisted canonical-ref fields, preventing an extra body/contact field
   from crossing through object spread.
3. Added runtime vocabulary admission rather than trusting TypeScript/coming
   Prisma enums to make source drift impossible.
4. Required stage milestones, formalization+completion atomicity and
   preparation/trial terminal evidence.
5. Restricted every pending transition to its exact stage plus
   `waiting_on_system`; terminal business state permits only `ready` or a
   technical Host replay wait.
6. Kept `capacity_waitlist` solely in the stage union and returned no command
   capability on either current Admin projection surface.

## Verification

| Check | Result |
| --- | --- |
| Targeted test | 15/15 PASS |
| Full unit lane | 857/857 across 77 files PASS |
| Scenario typecheck / manifest check | PASS |
| Persistence boundary / port topology | PASS |
| C30-I3 local source lock | `17c0b97` / `50361da1…` PASS |
| Nurture exact runtime self-pin | `c5b57c06…` over 236 files PASS |
| Project governance lint / `git diff --check` | PASS |
| Canonical manifest/module absence | PASS |

No DB lane was run or needed: this increment changes no Prisma schema,
migration or repository.

## Remaining boundary

The registry is not a Host registration. There is no private carrier,
inquiry/touchpoint persistence, command/repository, migration or owner bridge.
Those are G4-D increment 2 and later. My-Chat pin drift remains G-09 and blocks
an I3 adoption claim, not this local pure increment.
