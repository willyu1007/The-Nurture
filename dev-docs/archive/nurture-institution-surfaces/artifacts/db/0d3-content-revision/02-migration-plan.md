# Migration Plan — 0D-3 Content Revision

1. Confirm the exact target database is absent, then create it empty.
2. Force the child-process `DATABASE_URL` pathname to that exact database and
   validate the local `localhost:5433` endpoint.
3. Run `prisma migrate deploy` for the complete migration history.
4. Probe the chain, lane, non-empty, hash and database-level immutability
   constraints.
5. Run the 0D-3 and 0D-2 production-DB suites, then the full DB lane.
6. Confirm migration status, drop only the exact target and confirm absence.

Strategy is versioned Prisma migration, not `db push`. Rollback in this empty
disposable target is deletion of that exact target. No durable rollout or
shared/persistent apply is authorized.
