# G4-0A Exact Inventory Record

## Verdict

- Date: 2026-08-01
- Verdict: `G4_0A_INVENTORY_PASS`
- Task: T-007
- Effects: documentation/governance only

The accepted 0A ledger structure has been reconciled against current exact
artifacts. This PASS closes inventory/routing only; it is not a branch Freeze
PASS, Owner Readiness, Joint Conformance, Beta Profile Handoff, activation or
traffic authority.

## Exact Present Inputs

| Input | Exact identity | Evidence |
| --- | --- | --- |
| T-002 owner path | My-Chat `a0195662228a2fc6323b9ea0cd327d3608d8cc17`; Base `06303e9f404e4ccc0ba3054b763675efe81b5b15`; Nurture self-pin `b2c53eb7d35e315e5d319ab341d7ca31779c1bf848a0c24824a64ecdbb59a4a8` | T-002 M5 handoff + `18-g1-joint-conformance-record.md` |
| T-004 interface | `nurture.surface-contract@1.7.0` / `sha256:b7691a814c2e3cc1f6cc0a906d1ea18bdb2104c1f8ee2adcd1db57336f03b641` | T-004 Phase 4 handoff + G1 record |
| G1 qualification | formal NestJS ingress, disposable PostgreSQL, positive/negative matrix, leakage scan, final false/empty | T-002 `18-g1-joint-conformance-record.md` |

These inputs are `PRESENT_PINNED`. They do not make later T-005～T-007
capabilities present or qualified.

## Explicit Non-present Inputs

| Input | State | Routed owner |
| --- | --- | --- |
| T-005 G2-B lifecycle/Admin owner-read | `DEFINED_UNQUALIFIED` | T-005 then 0C/G4-C/F consumer qualification |
| T-005 G2-C caregiver direct interaction | `DEFINED_UNQUALIFIED` | T-005 provider; T-006 G3-E consumer |
| T-006 board/capture/publication implementation | `DEFINED_UNQUALIFIED` | T-006; publication policy from 0B |
| T-007 authority/daily/workflow/knowledge contracts | `GAP` | 0C/0D/0E/0F respectively |
| Branch-specific My-Chat contact/RAG source pins | `DEFINED_UNQUALIFIED` | 0E/0F |
| T-007 public capability implementation | `GAP` | G4-A～F after the relevant branch freezes |

## Inventory Closure

- Canonical fact owners and projection/candidate distinctions are complete in
  `06-g4-0-freeze-ledger.md`.
- Every schema delta routes to one branch; 0A does not invent exact schemas.
- Missing/mismatched/unavailable inputs fail closed with no legacy, inferred-id,
  cached-authority or weak-auth fallback.
- Final census: no code, migration apply, persistent database, manifest/
  capability, secret, Candidate, deployment, activation or traffic effect.

## Next Gate

0B freezes the publication-policy provider contract required by T-006. 0C is
the next T-007 common branch freeze. Neither may claim implementation or
qualification from this inventory record.
