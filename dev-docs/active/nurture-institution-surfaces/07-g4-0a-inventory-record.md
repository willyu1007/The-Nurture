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

> **Superseded on 2026-08-08.** The identities in this table are the ones the
> original PASS bound. All three have since rotated. See
> [Pin Rebind (2026-08-08)](#pin-rebind-2026-08-08) for the current inputs and
> for the one row whose state changed as a result. This table is retained as
> history and MUST NOT be cited as current.

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

## Pin Rebind (2026-08-08)

### Why

T-009 rotated the owner pins once (D-T009-04) and rotated the surface contract
twice (`1.16.0` cession batch, `1.17.0` teacher-queue overlay). Every identity
the 2026-08-01 PASS bound as `PRESENT_PINNED` is therefore superseded. 0A
cannot detect this on its own, and a 0C freeze record citing the stale table
would bind inputs that no longer exist.

This rebind is documentation/governance only. It re-states exact inputs and
re-evaluates their inventory state; it runs no qualification, produces no
implementation and grants no authority.

### Current Exact Inputs

| Input | Exact identity | State | Evidence |
| --- | --- | --- | --- |
| Public Surface baseline | `nurture.surface-contract@1.17.0` / `sha256:d22851d98a55299fb4a90f4ff461f6dbeb7ed3f075669ffb19cccb93018acdf8`; shared core `sha256:7bd8a82d4ad6e2ee6a5cdf02f50792049fe7bdfa546992058cb860c1baac4c6d`; 33 capabilities / 6 surfaces | `PRESENT_PINNED` | T-009 `06-i6-batch-requalification-record.md`; deterministic rebuild with zero `generated/` drift |
| Nurture self-pin | `c0f97aec808a5eed825938bb611c762e4386c5ee02b29ae90718bcd7c4abd096` (185 files) | `PRESENT_PINNED` | same record, `verify-workflow-contract-pin` gate |
| My-Chat | `df7a273bff65b965da45e2e9604cee3b6b8fc20b`; source pins `x5_joint_api` `30878ba3…` (190 files), `wave4_binding_host` `947b4857…` (20 files) | `PRESENT_PINNED` | same record |
| My-Workflow-Base | `8a3ea9028d414813994a57ef3501ecad3dd7c434`; contract parity `8dd53be4ba392c6eb254c462066d9c7e65b239bc79142911de4ef58faf3da34d` (11 files, both sides) | `PRESENT_PINNED` | same record |
| T-002 owner/source path | M5 `16-owner-integration-handoff-m5.md` + G1 `18-g1-joint-conformance-record.md`, produced at My-Chat `a019566` / Base `06303e9` / Nurture self-pin `b2c53eb7…` | **`DEFINED_UNQUALIFIED`** (was `PRESENT_PINNED`) | see below |

### The one state change

The T-002 owner path is the only row that does more than change numbers, and
it must not be silently rebound.

T-002's M5 handoff and G1 Joint Conformance record were produced at their own
exact topology. The ledger's drift rule for that row reads: *owner/source/
ingress/pin drift invalidates owner and joint evidence.* All three of those
pins have since rotated, so the evidence no longer binds the current topology.

T-009's closing requalification does **not** cover the gap. Its gate table runs
`test-routing`, `g3-0-freeze`, `g2-exit-contract`, `formal-ingress`,
`port-topology`, `persistence-boundaries`, `n1-schema` and
`x4-handoff-replay`, plus the unit/db/scenario-service/dev-host lanes and an
x5 lane carrying x5 joint acceptance and T-009's own I7b cases. Neither
`verify:owner-integration` nor the T-002 G1 joint-conformance fixtures appear
in it. T-009 qualified its own lanes at the new pins; it did not re-establish
the T-002 owner path there.

Consequences for 0C, whichever scope is chosen:

- 0C MUST NOT cite the T-002 G1 record as `PRESENT_PINNED` evidence at current
  pins.
- Any 0C branch that needs real Admin/Caregiver trusted-context, binding or
  Grant authority must re-establish the owner path at current pins as part of
  its own I3 Owner Integration Readiness, rather than inheriting it.
- The T-002 G1 PASS itself is unchanged and is not revoked. It remains exact
  and valid at its own topology; this row records only that the current
  topology has moved away from it.

### What this rebind does not do

It does not mark T-007 in-progress, re-open D-01～D-07G, issue a branch Freeze
PASS, satisfy 0C～0F, authorize schema apply, activation, deployment or
traffic, or re-adjudicate the 2026-08-01 `G4_0A_INVENTORY_PASS` — that verdict
stands on its routing and ownership findings, which the rotation did not
disturb.

## Next Gate

0B freezes the publication-policy provider contract required by T-006, and is
closed. 0C is the next T-007 common branch freeze; a narrower `0C-min` fast
lane is proposed in
[`09-0c-min-fast-lane-proposal.md`](./09-0c-min-fast-lane-proposal.md) and
awaits a separate decision. Neither may claim implementation or qualification
from this inventory record, and both now consume the rebound inputs above.
