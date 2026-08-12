# Migration Plan — 0D-5 Support-signal Policy

## Strategy

Use the authored versioned Prisma migration. Do not use `prisma db push`.

## Apply gate

Before any apply, obtain explicit approval naming the target environment and
database, confirm that the additive migration is acceptable, and record
snapshot/backup posture. This gate passed for the new empty disposable database
`nurture_t007_0d5_20260809_1132_a71c9e4d`; it remains closed for every shared or
persistent database.

## Rollout

1. Re-run Prisma validation and review the SQL at the approved revision. PASS.
2. Apply the authored migration chain with `prisma migrate deploy`; do not use
   `prisma db push`. PASS on the approved disposable target.
3. Run migration status, real-row/constraint probes and the full production-DB
   suite. PASS.
4. Refresh `docs/context/db/schema.json` from the Prisma SSOT. PASS; checksums
   were current.
5. Destroy the exact disposable database and verify it is absent. PASS.

## Rollback expectation

No application caller or policy row exists at I1. Before activation, rollback
is removal of the new table and enum through a separately reviewed migration.
After policy rows or callers exist, prefer a forward disabling revision; do
not drop audit history ad hoc.

## Non-effects

Execution of this plan did not authorize or perform shared/persistent apply,
capability rotation, activation, deployment or traffic.
