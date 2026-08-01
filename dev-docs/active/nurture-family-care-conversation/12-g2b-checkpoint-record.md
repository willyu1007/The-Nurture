# G2-B Checkpoint Record — Lifecycle and Owner-read Completion

## Outcome

- Task: T-005
- Slice: Stage G2-B checkpoint (`01-plan.md` G2-B checklist; Increment 2
  normative contract in `07-increment-2-change-contract.md`)
- Executed: 2026-08-01 on disposable PostgreSQL instances
- Result: `G2B_CHECKPOINT_PASS / G2C_PENDING / T005_EXIT_NOT_CLAIMED`
- Scope of claim: Nurture provider implementation and formal private ingress.
  T-007 consumer composition/adoption, shared discovery publication, G2-C and
  final real-owner-path G2 Exit Qualification remain pending.

No persistent database was changed. No secret, committed environment enablement,
activation or traffic was introduced. Every temporary PostgreSQL cluster was
stopped and moved to the local Trash after verification.

## Bound Contracts

- Generic invocation/result identity: T-004 exact
  `nurture.surface-contract@1.7.0` / `sha256:b7691a814c2e3cc1f6cc0a906d1ea18bdb2104c1f8ee2adcd1db57336f03b641`.
- Increment 2 effects: `07-increment-2-change-contract.md`.
- Closed query/presenter family: `09-capability-query-contract.md`.
- Frozen schema/cascade/result invariants: `10-g2-schema-freeze.md` D4–D7.
- Protected Admin provider interface:
  `nurture.institution-business-communication-owner-read@1.0.0` /
  `sha256:dd1b63fe6c7975bafb4170aff3dccc92463dfaf3e5ea7e5bd3c80f1298d6c921`.
- Owner pins inherited from W0/G1: My-Chat `a019566`, My-Workflow-Base
  `06303e9`; the live sibling worktrees later moved, so current-worktree pin
  verification is not used as new adoption evidence.

## Checklist Mapping

| G2-B checklist item | Mechanical evidence |
| --- | --- |
| correction uses unified Harness, Execution, typed immutable result, exact replay and Receipt | formal HTTP test prepares two heads, commits one, exact-replays the persisted result and rejects the other as `stale_confirmation`; DB proves encrypted append-only correction, original Message preservation, Receipt and Execution FK |
| withdrawal closes only exact family work, preserves history and converges | exact source author closes `active → closed(family_withdrawn)`, resolves Attention, blocks pending Receipt and future reply; new command returns `already_satisfied` with typed result; a pre-existing caregiver reply stays readable/persisted |
| exact-author and system-policy redaction are separate | Admin/coworker negatives; exact caregiver author may erase own reply even after original Grant loss; only current `system_operator` can use the policy capability and its reason is server-owned |
| source cascade reaches closure | disposable DB fixture creates 105 active corrections and 105 pending receipts; one transaction erases every correction payload, suppresses Item/Attention, terminalizes every Receipt and writes `CascadeAudit(complete)` bound to the same Execution |
| reply cascade stays local | first of two caregiver replies becomes a tombstone; sibling reply, active Item, responded axis and resolved Attention remain unchanged |
| latest correction/tombstone owner-reread | guardian/detail presenters return latest correction; source/reply redaction returns body-free tombstones; `readResult` reconstructs current state from committed refs |
| Institution Admin exact disclosed owner-read | positive route requires exact interface pin, current exact Institution Admin, Institution/Enrollment/CareGroup, current original Grant, direction/data class/purpose and pre-send disclosure; negative suite covers pin drift, missing disclosure, role loss, Institution scope drift and Grant loss |
| Admin read/action separation and no-copy carrier | output contains only opaque display refs, current protected body/tombstone, empty attachments and `actions: []`; internal IDs are absent; Admin-only action prepares deny; HTTP response is service-authenticated `private, no-store` |
| provider remains default-off | typed env contract default is `false`; missing/false gate returns generic 503 before owner read; no `env/values/*` enablement or shared surface discovery change |
| G2-A semantics do not regress | full 266 unit, 86 production-DB, 49 scenario-service, 17 scenario-service-DB and 26 dev-host tests pass; surface contract remains exact 1.7.0 digest |

## Acceptance-to-Check Mapping (continued; IDs are stable)

| AC ID | Item | Check type |
| --- | --- | --- |
| T005-AC-036 | correction requires exact author, current same-side reach, active original Grant/lifecycle and strict correction head | integration + negative |
| T005-AC-037 | correction is encrypted append-only history with latest-current presenter and independent Receipt/Execution | DB integration |
| T005-AC-038 | responded family source cannot be corrected in place; continuation requires a new Item | negative |
| T005-AC-039 | withdrawal only closes exact family CareItem and preserves source/reply/Receipt history | DB integration |
| T005-AC-040 | withdrawal blocks future actions/pending delivery and converges with immutable typed result | integration + replay |
| T005-AC-041 | author redaction requires exact author/current same-side reach but not an active original Grant | negative + DB integration |
| T005-AC-042 | policy redaction uses separate system capability and server-owned reason | authority matrix |
| T005-AC-043 | source redaction erases correction chain and loops past one page to atomic closure | 105+105 cascade fixture |
| T005-AC-044 | reply redaction is local and never reopens response/Attention or erases sibling replies | DB integration |
| T005-AC-045 | current owner reread produces latest correction, withdrawal state or redaction tombstone with no cached body | HTTP projection tests |
| T005-AC-046 | Admin owner-read requires exact current disclosed Institution business scope and exact interface pin | positive/negative HTTP + DB |
| T005-AC-047 | Admin projection is noncanonical/no-copy and grants no actions | response census + action negatives |
| T005-AC-048 | protected Admin carrier is service-authenticated, no-store and independently default-off | controller/config/OpenAPI/env tests |
| T005-AC-049 | G2-B preserves G2-A original Grant, CareGroup responsibility, append replies and role-safe query behavior | full regression |

## Verification Summary

- `pnpm test:unit`: 29 files / 266 tests PASS.
- `pnpm test:db`: 13 files / 86 tests PASS on disposable production schema.
- `pnpm --filter @the-nurture/scenario-service test`: 8 files / 49 tests PASS.
- `pnpm test:scenario-service:db`: final 2 files / 17 tests PASS; G2-B
  lifecycle/Admin file has 11/11.
- `pnpm test:dev-host`: 11 files / 26 tests PASS.
- scenario, DB, scenario-service and scenario-service DB tsconfigs PASS.
- formal ingress PASS at seven routes; OpenAPI/API index/context/env/governance
  checks PASS; scenario-service built artifact smoke PASS.
- surface conformance PASS with unchanged `nurture.surface-contract@1.7.0`
  digest and 25/25 slices.
- Root aggregate `pnpm typecheck` and live `verify:workflow-contract-pin` are
  externally blocked by sibling worktree drift: My-Chat currently has an
  unrelated `AuditAction` compile mismatch and Base is at `8649e0e` rather than
  the frozen `06303e9`. Package-local checks and W0 pinned evidence are the
  authoritative evidence for this checkpoint; no sibling source was changed.

## Boundary and Next

G2-B is complete but T-005 stays `in-progress`. Next is G2-C provider
qualification for the frozen Message-only caregiver direct interaction. That
work must rotate/pin the shared capability interface as already planned, keep
the new Admin provider gate false, and then proceed to the final G2 Exit suite
against a real pinned owner path. T-007 independently owns Admin consumer
composition and joint adoption.
