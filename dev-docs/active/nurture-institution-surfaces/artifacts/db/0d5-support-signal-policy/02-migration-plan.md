# Migration Plan — 0D-5 Support-signal Policy

## Strategy

Use the authored versioned Prisma migration. Do not use `prisma db push`.

## Apply gate

Before any apply, obtain explicit approval naming the target environment and
database, confirm that the additive migration is acceptable, and record
snapshot/backup posture. No target has been selected in this increment.

## Rollout

1. Re-run Prisma validation and review the SQL at the approved revision.
2. Apply with `prisma migrate dev` only to an explicitly approved disposable
   development database, or `prisma migrate deploy` to an explicitly approved
   non-development target.
3. Run migration status, DB integration tests and the database public suite.
4. Refresh `docs/context/db/schema.json` from the Prisma SSOT.

## Rollback expectation

No application caller or policy row exists at I1. Before activation, rollback
is removal of the new table and enum through a separately reviewed migration.
After policy rows or callers exist, prefer a forward disabling revision; do
not drop audit history ad hoc.

## Non-effects

This plan does not authorize shared/persistent apply, capability rotation,
activation, deployment or traffic.
