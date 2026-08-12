# T-010 pitfalls

This file prevents repeated mistakes within this task.

## Do-not-repeat summary

- Never reinterpret an existing ChildLink Grant class as media or focus
  collaboration authority.
- Never select the first or newest enrollment when the signed target is absent
  or ambiguous.
- Never treat service authentication, identity association or pair binding as
  scenario sharing permission.
- Never return cleanup success before every registered Nurture-derived store
  confirms purge.

## Pitfall log

### 2026-08-12 — cleanup replay must serialize before purge

- Symptom: two concurrent requests could reuse one `cleanup_command_ref` with
  different fingerprints, both observe a missing receipt and purge different
  local scopes before only one immutable receipt committed.
- Root cause: the first C3 implementation used a non-atomic
  `ledger.find -> purge stores -> ledger.commit` sequence. Store idempotency
  protects exact retries but cannot protect different scopes under one key.
- What was tried: relying on the existing unique command-execution key was
  rejected because it arbitrates only the final receipt write, after the purge
  side effects have already happened. A provisional success receipt was also
  rejected because cleanup success cannot precede every store confirmation.
- Fix: the ledger now exposes one exclusive callback. PostgreSQL takes a
  workspace+cleanup-key advisory transaction lock, rereads/compares the stored
  fingerprint, invokes bounded local purge owners only for a new key and writes
  the immutable receipt after complete confirmation. Lock loss and mismatch do
  not invoke the callback. A purge owner can nevertheless finish before a
  later transaction failure; every registered owner must therefore remain
  local, exact-scope and idempotent for safe exact retry.
- Prevention: every future cleanup/release lifecycle owner MUST acquire its
  exact idempotency-key arbitration before the first irreversible or externally
  visible side effect; uniqueness at receipt commit time is insufficient.

### 2026-08-12 — mock-shaped identity fixtures do not qualify PostgreSQL

- Symptom: the first approved C4 run failed before owner behavior because
  anchor/association identifiers violated database UUID checks; after that
  repair, pair insertion lacked the required participant-binding and command-
  execution provenance.
- Root cause: the earlier contract tests exercised typed repository seams with
  arbitrary strings and did not instantiate the complete production FK graph.
- What was tried: weakening the qualification SQL or omitting the pair head
  was rejected because it would stop exercising the exact C2/C3 owner path.
- Fix: use real UUIDs where the schema requires them and seed the exact current
  participant binding plus immutable command execution before the committed
  pair operation. Cleanup deletes the pair before the command and the binding
  before the participant.
- Prevention: every production-shape DB fixture must be derived from migration
  checks and FK order, not from mock-friendly domain examples.

### 2026-08-12 — generic cleanup ledgers must not claim typed actors

- Symptom: cleanup purges ran, but receipt insertion failed the
  `ck_nurture_c30_command_typed_actor` CHECK and the transaction rolled back.
- Root cause: the cleanup ledger wrote `scenarioKey=nurture` and a family-
  sharing execution driver without the typed Participant/role fields required
  for Scenario business commands. Cleanup is actually a service-principal,
  bounded derived-store lifecycle operation.
- What was tried: inventing a Participant/role from the family pair was
  rejected because identity association is not cleanup authority.
- Fix: persist the immutable cleanup command as a generic service-principal
  ledger entry with `scenarioKey` and `executionDriver` null; the request
  fingerprint and local scope remain exact.
- Prevention: reuse of a command ledger must select one complete database
  invariant branch. Never set typed-actor discriminator fields without all
  provenance required by that branch.
