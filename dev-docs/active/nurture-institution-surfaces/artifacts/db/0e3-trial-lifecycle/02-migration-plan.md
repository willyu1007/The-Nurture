# Migration Plan — 0E-3 Trial Lifecycle

1. Create only named local disposable databases; never use the configured
   default or a shared target.
2. Replay all existing migrations into the diff target and review the generated
   Prisma delta.
3. Author the versioned migration with phase backfill plus exact workflow,
   Enrollment, Grant and reservation invariants.
4. Recreate the empty qualification target and apply the complete migration
   history with `prisma migrate deploy`; never use `db push`.
5. Run targeted stale-owner, explicit-clock, start, review, extension, proposal,
   end and replay cases; then run the complete production DB lane.
6. Verify current migration status, zero datasource drift and regenerate the DB
   context contract.
7. Drop only the two exact disposable targets and confirm absence.

Rollback is deletion of those empty disposable databases. This plan does not
authorize a durable migration, public capability, deployment or activation.
