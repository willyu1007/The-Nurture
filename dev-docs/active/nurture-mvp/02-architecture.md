# Architecture — G0 persistence and ownership boundary

## Context and current state

The preserved MVP implemented Nurture business persistence and a My-Chat-like workflow dev host in one Prisma schema and database. G0 keeps the dev harness but removes that production-boundary violation.

## Proposed design

### Nurture production boundary

- Root `prisma/schema.prisma`, root migrations, the default `@prisma/client`, and `packages/nurture-db` contain only Nurture-owned business facts and projections.
- Workflow identifiers stored in Nurture business rows are opaque external references, not relational links to dev-host tables.
- The production catalog assertion compares the deployed PostgreSQL tables/enums with generated `docs/context/db/schema.json` and rejects any non-`nurture_*` table or `Workflow*` runtime enum.

### Backend-private dev-host boundary

- `apps/backend/prisma/` owns the workflow dev-host schema and migrations.
- Its generated Prisma client lives under `apps/backend/src/generated/dev-host-prisma/` and is not published as a shared package.
- `apps/backend` receives separate Nurture and dev-host database URLs and injects the correct client into each repository or runtime port.
- `createNurtureApp` exposes `nurturePrisma` and `devHostPrisma` explicitly; the former feeds Nurture repositories/internal APIs and the latter feeds ledger/runtime/action/dispatcher/artifact ports.
- `DEV_HOST_DATABASE_URL` is scoped to the `dev` environment contract and is absent from staging/production secret refs.
- Repository commands load configuration in precedence order: process environment, `.env.local`, then `.env`; CI/runtime injection therefore remains authoritative.
- The unauthenticated dev host binds only to `127.0.0.1` and refuses startup when `APP_ENV` is not `dev` or `test`; local Postgres is likewise published only on loopback.

### Contracts

- `DATABASE_URL` selects the Nurture production database.
- `DEV_HOST_DATABASE_URL` selects the backend-private workflow dev-host database.
- No cross-database foreign key, Prisma relation, or atomic transaction is permitted.
- My-Chat owns canonical identity, auth, workflow runtime, outbox, ledgers, workers, and host surfaces; the local dev host is test infrastructure only.
- The Base workflow contract and the exact `web-workbench` build inputs are independently content-pinned at the recorded Base revision.

## Data migration

- Back up the old mixed local database and prove a restore into a temporary database.
- Rebuild both target databases from their independent migration streams.
- Run production, dev-host, and combined fault checks.
- Delete the temporary restore database and backup only after merge and fresh-worktree verification.

## Non-functional considerations

- Secrets and claim tokens must not be committed or logged.
- Production CI must prove there are no `workflow_*` tables.
- Dev-host CI must prove the expected workflow tables exist and no `nurture_*` tables exist.
- G0 changes no external API and enables no non-empty activation.
- The dev-host lease/claim behavior is not X2 production runtime evidence; crash recovery, same-Step reclaim, claim-token completion, and replay remain My-Chat-owned gates.
