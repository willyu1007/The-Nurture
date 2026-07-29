# X4-A Database Execution Log

## Approved target

- Environment: local disposable development PostgreSQL 16.
- Database: `nurture_x4_validation_e7d4590` on `localhost:5433`.
- Strategy: versioned `prisma migrate deploy`.
- Destructive operations: none.
- Existing database `nurture`: not targeted.
- Credentials: loaded from the local environment and never printed or copied into this evidence.

## Execution sequence

1. Confirmed the target name did not already exist.
2. Created the new database from `template0`.
3. Ran `prisma migrate status`; all three repository migrations were pending on the empty target.
4. Ran `prisma migrate deploy` with the target URL overridden only in the child process.
5. Applied, in order:
   - `20260713082500_nurture_production_baseline`
   - `20260713150000_nurture_institution_n1_core`
   - `20260715070000_nurture_handoff_replay_seed_x4`
6. Re-ran migration status: database schema up to date.

## Verification execution

```text
pnpm db:assert-boundary
pnpm test:db:ci
pnpm verify:db-population
pnpm typecheck
node .ai/scripts/ctl-db-ssot.mjs sync-to-context
node .ai/skills/features/context-awareness/scripts/ctl-context.mjs verify --repo-root . --strict
node .ai/tests/run.mjs --suite database
```

The DB test was run again after adding negative constraint probes. No command logged a credential or full connection URL.

## 2026-07-28 — Wave 4 P2 local execution log

No migration execution occurred.

Local source-only commands:

```text
pnpm exec prisma format
pnpm exec prisma validate
pnpm exec prisma generate
```

All passed under Node 24 with a non-routable placeholder database URL.
`prisma migrate dev`, `prisma migrate deploy`, `prisma db push`, SQL clients,
row-count queries, backup commands, and data cleanup commands were not run.
No credential or real connection string was logged.

## 2026-07-28 — Wave 4 P2 native CI disposable execution

Native run `30366195095` created a fresh PostgreSQL 16 service scoped to one
GitHub runner, ran `pnpm db:generate`, `pnpm db:validate`, and
`pnpm db:deploy`, asserted the generated production ownership contract, then
ran the 35-test production DB population. The P2 migration applied
successfully in order and all checks passed. GitHub stopped and destroyed the
service after the job; no reusable target, backup, credential, or data artifact
was retained.
