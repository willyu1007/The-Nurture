# Migration Plan — 0D-4 Attribution Correction

1. Confirm the exact target database is absent, then create it empty.
2. Force the child-process `DATABASE_URL` pathname to that exact database and
   validate the local `localhost:5433` endpoint.
3. Run `prisma migrate deploy` for the complete migration history.
4. Run the G-05 capture-intake and 0D-4 candidate production-DB suites.
5. Probe exact replay, immutable candidate rows, same-Workspace ownership and
   absence of candidate lifecycle columns; verify canonical attribution is
   unchanged.
6. Run the full production-DB lane, Prisma migration status, DB context and
   persistence/test-routing checks.
7. Confirm zero target sessions, drop only the exact target and confirm absence.

Strategy is versioned Prisma migration, not `db push`. Rollback in this empty
disposable target is deletion of that exact target. No durable rollout or
shared/persistent apply is authorized.
