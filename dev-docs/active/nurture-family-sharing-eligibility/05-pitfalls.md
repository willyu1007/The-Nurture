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
