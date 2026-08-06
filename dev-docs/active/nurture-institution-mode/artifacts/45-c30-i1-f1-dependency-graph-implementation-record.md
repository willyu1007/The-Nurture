# C30-I1-F1 Dependency Graph Implementation Record

## Result

- Date: 2026-08-06
- Governance: `REUSE_TASK / M-002 > F-002 > T-002`
- Authorization: all C30-I1-F operations through closure, ordered F1 → F4
- Result: `I1_F1_COMPLETE / DEPENDENCY_GRAPH_ACCEPTED`
- Exact Base source: `0ce22b6664de1e2e31ce828f2cf4e1776e46d42e`
- Parent: I1-E successor metadata lock
  `9abde2b994f6528fc5afb26125eb029ed6027237`

F1 adds one optional, closed `scenario_contracts` envelope without changing
manifest v2 omission behavior. The envelope defines the exact four capability
keys, exact four source identities, dependency rows and source rows frozen by
artifact 44.

## Implemented boundary

- dependency rows form only a canonical dependency-complete prefix;
- required capability and source sets are exact, ordered and acyclic;
- missing, stale, duplicate, unknown, umbrella and reordered source rows fail;
- source hashes are lowercase SHA-256 values;
- JSON Schema and runtime assertion close all structural fields;
- no provider, presenter, action, protected consumer or Host dispatch exists.

## Verification

| Check | Result |
| --- | --- |
| Contracts/runtime/Scenario/conformance typecheck | PASS |
| Runtime / Scenario tests | PASS 28/28 and 10/10 |
| F1 focused tests | PASS 17/17 |
| Cumulative Node conformance | PASS 391/391 |
| Federation Schema package | PASS 66 Schemas |
| Existing boundary/semantic/no-copy checks | PASS |

The pre-F4 full aggregate correctly rejected the changed source against the
historical I1-E source lock. Independent checks passed; the source lock was not
weakened or refreshed early.

## Boundary and rollback

Only neutral Base manifest types, Schema, runtime assertion, fixtures and tests
changed. My-Chat/Nurture product source, database, capability, activation,
deployment, T-008, Pilot and traffic remained untouched. Rollback F1 by reverting
`0ce22b6…` after reverting its successors.
