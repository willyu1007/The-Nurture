# N1 Institution Schema Preview

## Target and safety posture

- DB SSOT mode: `repo-prisma`.
- Source: `prisma/schema.prisma`.
- Migration: `prisma/migrations/20260713150000_nurture_institution_n1_core/migration.sql`.
- Target database: not selected or mutated during this preview.
- Activation posture: N1 explicit-empty only. The database CHECK requires `handoffRequestSnapshotsPayload=[]` and `handoffDriverRef IS NULL`.

## Additive diff summary

- Adds 21 Nurture-owned tables and 44 Nurture enums.
- Adds the care ecology graph, grant/receipt, private family-care communication, first-slice care/media storage, `NurtureInteractionContext`, and immutable `NurtureCommandExecution`.
- Adds 7 partial unique indexes for active participant/process/family/group/enrollment/role/thread invariants.
- Adds 7 lifecycle CHECK constraints for grant, receipt, message redaction, item clarification state, interaction-token state, media confirmation, and N1 command snapshots.
- Adds only `nurture_*` tables. It does not create My-Chat Workflow Run/Step/Handoff/Outbox tables in the production Nurture database.
- Contains no `DROP` or `TRUNCATE` statement and does not alter existing P0 family workflow tables.

## Static verification

```bash
pnpm db:generate
pnpm db:validate
pnpm verify:n1-schema-contract
pnpm verify:persistence-boundaries
node .ai/scripts/ctl-db-ssot.mjs sync-to-context
node .ai/skills/features/context-awareness/scripts/ctl-context.mjs verify --repo-root . --strict
```

All checks passed on 2026-07-13. `docs/context/db/schema.json` now describes 43 total production tables and 71 total enums (existing P0 plus N1).

## Apply gate

The migration has not yet been applied to a database. Before `prisma migrate deploy`, confirm a disposable Nurture PostgreSQL target; after approval, run migration status, production boundary inspection, DB tests, and rollback/rebuild verification before treating N1-B as database-applied.
