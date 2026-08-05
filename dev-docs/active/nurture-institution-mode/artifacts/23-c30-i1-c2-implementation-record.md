# C30-I1-C2 Subject-Context Provider Implementation Record

## Result

- Date: 2026-08-05
- Governance: `REUSE_TASK / M-002 > F-002 > T-002`
- Result: `I1_C2_IMPLEMENTED / LOCALLY_VERIFIED`
- Base source: `600faee233490a4d3110b24594474dd7ff79eae5`
- Parent: `64533a66d2b95c9b31ff317920515962a0d3cb32`
- Next: `I1_C3_AUTHORIZED`
- Downstream: `I1_D_BLOCKED / C30_I2_NO_GO`

## Implemented contract

- exact `ListScenarioSubjectContextsInputV1` and
  `ResolveScenarioSubjectContextInputV1` bodies;
- `ScenarioSubjectContextOptionV1` with paired single/detail or
  collection/collection scope and route classes;
- closed list `resolved|needs_selection|unavailable` and resolve
  `resolved|context_changed|unavailable` results;
- page size 1-20, candidate count 2-20, unique opaque refs, canonical timestamps,
  at-most-30-minute option lifetime and resolved-time containment;
- five strict Schemas, neutral typed/JSON fixtures and provider conformance tests.

The inputs contain no caller, Workspace, surface, raw target, relationship, role,
policy, action or mutation version. A collection remains one context without
members/count. Candidate order is owner output; no Host ranking, merging, filtering
or auto-selection surface exists.

## Verification

| Check | Result |
| --- | --- |
| Full Base typecheck and contract build | PASS |
| Runtime / Scenario tests | 28/28 and 10/10 PASS |
| Schema package | 30 Schemas compile |
| Node tests | 160 PASS |
| Privacy, bounds, union and I1-A composition negatives | PASS |
| Source lock | Expected stale until I1-C4 |
| Diff/secret/boundary checks | PASS |
| Nurture governance/context/docs | Checksum `281f12a9…04ecb`; strict checks and 419-file lint PASS |

## Boundary, rollback and next

No provider runtime, Host selection logic, presenter, renderer, action, consumer,
database, capability or activation was added. Revert `600faee…` to roll back C2;
C1 remains independently usable. Proceed to I1-C3 semantic presentation only.
