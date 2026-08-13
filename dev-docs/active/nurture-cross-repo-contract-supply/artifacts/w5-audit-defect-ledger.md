# W5 Audit-Defect Ledger (2026-08-13 Codex gpt-5.6-sol audit)

Source: independent read-only audit of The-Nurture. Findings originate in
F-004 (family-growth provider, archived T-009) and F-005 (family-sharing,
archived T-010) code; they execute here because W1's callback
implementation lands on the same delivery/receipt surface. Archived
records are not rewritten; fixes are forward-only.

## P1

- [x] N1 Release-commit staleness: binding and canonical target resolved
  before the release transaction; no in-transaction reread of local
  association/authorization heads. Files:
  `packages/nurture-scenario/src/harness/publication-release.ts:640`,
  `packages/nurture-db/src/repositories/family-growth-binding.read.ts:41`,
  `packages/nurture-scenario/src/domain/family-growth/emission.ts:20`,
  `packages/nurture-db/src/repositories/publication-release.transaction.ts:627`.
  Fix: carry the complete target/anchor/association/authorization provenance
  and Guardian/Participant heads plus mapping expiry; bind them to the loaded
  target; reread and `FOR SHARE` lock every source row inside the serializable
  transaction; classify drift as terminal; cover cross-pairing and a
  two-connection revoke-after-lock race.
- [x] N2 Stale delivery worker can overwrite newer outbox outcomes: no
  CAS on `attemptCount`. Files:
  `packages/nurture-db/src/repositories/family-growth-outbox.transaction.ts:29,137,180`,
  `apps/scenario-service/src/family-growth-delivery.worker.ts:118`.
  Fix: lease-version CAS (`WHERE state='delivering' AND attempt_count=?`);
  stale completion is a no-op; test stale-success and stale-failure.
- [x] N3 Provider-outbox FKs lack tenant/lineage scope: no
  `workspace_id` in FKs; visibility event not bound to the outbox row's
  release. Files: `prisma/schema.prisma:4061,4088`,
  `prisma/migrations/20260807080000_t009_family_growth_provider_outbox/migration.sql:74`.
  Fix: composite target uniques/FKs (workspace_id-scoped); additive
  migration + disposable qualification; cross-workspace insert tests. The
  qualification vehicle now covers empty replay, populated previous-head
  upgrade and a separate expected fail-closed abort, with an exact-URL digest
  plus literal-database-name approval. Loopback/private-address checks are
  defense-in-depth only. The approved `t011_n3_disposable_20260813b` run passed
  A/B1/B2 with final emptiness before the containers were destroyed; no durable
  apply is authorized.
- [x] N5 Receipts not bound to all claimed coordinates:
  `source_scenario_key` / `source_release_ref` / `family_id` unchecked at
  settlement. Files:
  `packages/nurture-scenario/src/domain/family-growth/delivery.ts:60,70`,
  `packages/nurture-scenario/src/domain/family-growth/receipt.ts:109`,
  `apps/scenario-service/src/family-growth-delivery.worker.ts:109`.
  Fix: pass expected coordinates into the decision; mismatch stays
  `outcome_unknown`; wrong-family/wrong-source tests.
- [x] N6 Conflicting receipt replay mutates state without appending its
  evidence (`createMany skipDuplicates`). Files:
  `packages/nurture-db/src/repositories/family-growth-outbox.transaction.ts:177,187,206`.
  Fix: inspect insert count; on duplicate compare canonical payload;
  re-settle only exact replay; differing content is a conflict.
- [ ] N7 Family-sharing invariant validator overstates coverage (CHECKs
  not bound to owning table; FK targets/actions unverified) and is not in
  CI. File: `scripts/assert-family-sharing-invariants.mjs:47,99,142`.
  Fix: compare normalized full statements or inspect `pg_constraint` on a
  disposable target; wire into CI.

Closed during the audit session: N4 guard/pin disagreement — fixed by
`a78e7dd` + `9dc78df` (guard heads + lock rotation + record 26 addendum).

## P2

- [x] N8 Binding reader orders historical associations by `updatedAt`
  instead of selecting the current row
  (`packages/nurture-db/src/repositories/family-growth-binding.read.ts:41,54`).
- [ ] N9 Formal-ingress guard censuses seven legacy routes only; the
  family-sharing signed endpoint and teacher-release v3's four endpoints
  are unguarded (`scripts/assert-formal-ingress-contract.mjs:13,424`).
- [ ] N10 Two JCS implementations accept different non-JCS inputs; lone
  surrogates accepted against RFC 8785
  (`packages/nurture-scenario/src/domain/family-growth/jcs.ts:19`,
  `packages/nurture-scenario/src/c30/canonical-json.ts:22`).
- [ ] N11 Corrupt cleanup-ledger timestamps throw instead of parsing
  fail-closed
  (`packages/nurture-db/src/repositories/family-sharing-cleanup-ledger.repository.ts:201,240`).

## Rules

- Every fix ships with its negative test; N3 additionally needs an
  additive migration plus disposable-target qualification before any
  durable apply decision.
- Default-off posture is unchanged throughout; no fix activates anything.
- Sequencing: N2/N5/N6/N8 land before or with the W1 callback
  implementation (same settlement surface); N1/N3 may proceed in
  parallel; N7/N9/N10/N11 are independent.
