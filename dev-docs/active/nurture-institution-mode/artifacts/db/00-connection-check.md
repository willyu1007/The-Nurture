# X4-A Database Connection Check

## Scope

- Direction: repository Prisma/migration history to PostgreSQL.
- DB SSOT mode: `repo-prisma`.
- Schema source: `prisma/schema.prisma`.
- Migration strategy: versioned Prisma migrations; `db push` is not permitted for this node.
- Evidence date: 2026-07-15.

## Redacted configuration result

The local environment resolves a PostgreSQL target at `localhost:5433/nurture`. Credentials were not printed or copied into this evidence.

No network connection, migration status query, DDL, or test write was performed during X4-A preview. The configured `nurture` database is treated as an existing local production-shaped target and must not be migrated implicitly.

## Approval state

- Preferred first target: a new disposable local development database, separate from `nurture`.
- Connection check against that disposable target: pending explicit approval and target creation.
- Existing `localhost:5433/nurture` apply: not approved by this preview.
- Destructive data changes: not requested and not permitted.
- Backup/snapshot: not applicable to the preferred disposable first target; required or explicitly waived before any later apply to an existing database.
