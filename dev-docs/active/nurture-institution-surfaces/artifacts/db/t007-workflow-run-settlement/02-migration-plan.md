# T-007 Workflow Run settlement migration plan

Status: `AUTHORING_COMPLETE / APPLY_REQUIRES_EXPLICIT_APPROVAL`

1. Provision an approved disposable Nurture PostgreSQL target.
2. Preview the migration against that target and verify that the delta is
   additive: one enum, one table, indexes, one foreign key and one CHECK.
3. Apply only after explicit approval.
4. Run the focused settlement repository suite against real PostgreSQL,
   including concurrent command/no-effect fence races and terminal replay.
5. Run the full production DB lane, Prisma drift check and schema-context
   assertion.
6. Destroy the disposable target and record the destroy census.

Rollback before activation is the reverse additive removal on the disposable
target. There is no production rollback plan in this increment because no
production apply, route, DI binding, feature flag or traffic is authorized.
