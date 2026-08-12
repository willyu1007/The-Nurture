# Migration plan

1. Apply the full migration history to the approved disposable PostgreSQL 16
   target with `prisma migrate deploy`.
2. Verify migration status and the trial policy table/constraints.
3. Run the focused derivation/formal-command matrix, full DB lane and empty-DB
   migration replay.
4. Refresh `docs/context/db/schema.json` from `prisma/schema.prisma`.

Approval basis: the user explicitly authorized all relevant implementation
operations. This run is limited to a disposable local database; no durable
development, staging or production database is touched.

Rollback: remove the disposable container. The repository migration is
additive and can be reverted before any durable deployment by removing the
unreleased migration/model together; no down migration is applied to shared
state.
