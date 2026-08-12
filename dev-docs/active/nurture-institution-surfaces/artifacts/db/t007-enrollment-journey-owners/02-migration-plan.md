# Migration plan — 20260812100000_t007_enrollment_journey_prepared_command

## Approval boundary

Do not execute this migration against any durable or shared target until the
user explicitly approves database writes for that named target. This task
qualified it on an approved local disposable only (E7 protocol).

## Target

- Disposable local PostgreSQL container, loopback only, destroyed after.

## Execution (as performed)

1. Start `postgres:16-alpine` on 127.0.0.1:55452 with empty database.
2. `prisma migrate deploy` — full set from empty (39/39, includes this
   migration and the reviewed T-010 preview migration).
3. `prisma migrate status` — up to date.
4. Targeted formal-owners suite against the disposable.
5. Full production-db lane against the disposable.
6. `prisma migrate diff --from-url <disposable> --to-schema-datamodel` —
   empty (no drift).
7. Structural gates (routing, censuses, boundaries, pin).
8. Destroy the container; verify zero survivors.

## Abort conditions

- Any migration failure, CHECK violation attributable to the new table, suite
  failure or non-empty drift aborts; the disposable is destroyed either way.

## Backup / rollback

- Not applicable on disposables (destroy is the rollback). Durable targets
  get their own approved plan before any apply.
