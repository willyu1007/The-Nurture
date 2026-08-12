# T-007 formal ingress owner migration plan

## Approval boundary

Do not execute this plan until the user explicitly approves database writes.

## Target

Use a uniquely named, disposable local PostgreSQL database. Do not target a
shared development, staging, or production database. Do not reuse credentials
from an unrelated repository.

## Execution

1. Create and verify the empty disposable database.
2. Set `DATABASE_URL` for that process only.
3. Run `pnpm exec prisma migrate deploy --schema prisma/schema.prisma`.
4. Run `pnpm exec prisma migrate status --schema prisma/schema.prisma`.
5. Run the focused Prisma repository integration tests for current authority,
   dedup, expiry, atomic consume, confirmation conflict, and exact replay.
6. Inspect the table constraints/indexes and confirm no unexpected schema diff.
7. Record sanitized commands, exit codes, migration state, and assertions in
   `03-execution-log.md` and `04-post-verify.md`.
8. Destroy the disposable database after evidence capture.

## Abort conditions

- The resolved database is not newly created and disposable.
- The migration contains a destructive statement or touches an existing row.
- Prisma reports drift or an unapplied migration outside this repository plan.
- Any secret, raw confirmation, PermissionContext, or host credential would be
  written to evidence.

Because the target is a fresh disposable database, backup is not required.
Rollback is database destruction; the checked-in migration itself remains
forward-only and additive.
