# 83 — G4-E E7 disposable database qualification record

- Date: 2026-08-11
- Task: T-007 nurture-institution-surfaces (Stage G4-E)
- Checkpoint: Nurture `223daa7`
- Verdict: `G4_E_E7_DB_QUALIFICATION_PASS`
- Database effect: approved local disposable targets only; destroyed with
  final database/session counts `0/0`

## Scope

E7 qualifies the prepared-command persistence slice frozen by artifacts
[`81`](./81-g4-e-e7-owner-composition-record.md) and
[`82`](./82-g4-e-e7-formal-ingress-contract-audit.md): the additive migration
`20260811180000_t007_institution_knowledge_prepared_command`, the Prisma
repository owners and the single formal-owner composition, on an approved
disposable PostgreSQL target. It authorizes no durable apply, no route, no
capability activation and no traffic.

## Evidence

`artifacts/db/t007-formal-ingress-owners/00-connection-check.md` through
`04-post-verify.md`. From an empty target: 36/36 migrations applied and
current; the targeted formal-owners suite passed 4/4, covering current
authority with wrong-role and revoked-role denial, exact-prepare dedup with
client-command reuse rejection, unconsumed-expiry snapshot scrub with no
client-command revival under fresh authority, mismatched-confirmation
conflict with the exact consume still succeeding, and concurrent
consume/replay convergence on one persisted row; the full production DB lane
passed 395/395 across 44 files; datasource-to-datamodel drift is none; the
boundary, routing, persistence, port-topology and formal-ingress gates are
green; the destroy census is `0/0`.

## Findings repaired before any durable apply

1. `DR-E7-01` — the migration CHECK contradicted the frozen expiry scrub:
   scrubbing to codec `0` with an empty ciphertext violated the unconditional
   snapshot bounds, so the scrub transaction failed and surfaced as
   `prepared_command_ledger_unavailable`. Repaired at `b0adb64` by requiring
   exactly the scrubbed form at status `expired`. The in-memory harness
   cannot express CHECK constraints; only real-PostgreSQL qualification could
   catch this.
2. `DR-E7-02` — the model relations lacked the sibling-convention `map:`
   constraint names, so the drift gate reported rename-only foreign-key
   differences. Repaired at `223daa7`; metadata only, context checksum
   unchanged.

## Boundaries

This record is persistence qualification only. It is not E8 joint
conformance, not owner activation, not a durable database apply and not
traffic authority. `live_qualified=false` remains a separate activation gate.
The next open step in the register is E8 joint conformance.
