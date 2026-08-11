# T-010 I4-C1 migration plan

- Migration: `prisma/migrations/20260812090000_t010_family_sharing_authority/`
- Status: authored and reviewed only. Do not execute this plan until the user
  explicitly approves database writes for a named target.

## Approval boundary

1. No apply of any kind happens at C1 — not local, not disposable, not
   durable. The migration header carries the standard preview-only marker.
2. The first apply target is the I4-C4 approved disposable database
   (create-from-empty, qualify, destroy), following the E7/record-83
   discipline; the `ck_*` CHECK forms and both partial unique indexes must be
   exercised on real PostgreSQL there (`DR-E7-01` lesson: a CHECK that
   contradicts a repository state transition only surfaces on a real target).
3. Any durable or per-environment apply stays behind its own separate
   approval, after cross-repository joint conformance.

## Write/rollback shape

- Forward: `CREATE TYPE` ×4, `CREATE TABLE` ×2, named FK/`CHECK` constraints,
  two b-tree indexes per table, two partial unique indexes. Additive only —
  no existing row, column or enum is touched.
- Rollback (disposable targets are destroyed instead; listed for
  completeness): drop the two tables, then the four enum types.

## C4 qualification checklist (forward reference)

- Full migration set applies from empty including this migration.
- Partial-unique behavior: second `active` row per scope (or per axis) is
  rejected; supersede-then-insert in one transaction succeeds.
- CHECK behavior: direction-by-category violations, purpose drift, revoked
  status without `revoked_at` (and inverse), `expires_at <= effective_from`
  all reject.
- Repository reader returns `null`/fail-closed on zero current rows and never
  orders to pick a winner.
