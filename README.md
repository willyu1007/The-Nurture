# The Nurture

The Nurture is a My-Chat scenario module for pregnancy, motherhood, childcare, family strategy, activity comparison, and review-driven parenting workflows.

## Non-Negotiables

- The Nurture is not an independent product shell.
- My-Chat owns canonical objects, auth, shared workflow runtime, dashboard/chat/mobile/forum/knowledge/notification/admin surfaces, ledgers, workers, and outbox.
- The Nurture owns scenario workflows, local projections, policies, artifacts, and scenario-specific console/API surfaces.
- Nurture profiles MUST attach to My-Chat canonical objects; do not create duplicate child/family/person identity ownership.
- Health guidance MUST stay non-diagnostic, non-prescriptive, and non-emergency-replacement.
- Persisted schema changes start in `prisma/schema.prisma`.

## Core Contracts

- Workflow boundary: `docs/context/workflow/nurture-scenario-contract.md`
- Scenario module: `packages/nurture-scenario/scenario.manifest.yaml`
- DB contract: `docs/context/db/schema.json`
- Cross-repo contract pin: `docs/project/integrations/my-chat-workflow-contract.json`
- Initialization archive: `docs/project/overview/START-HERE.md`

## Baseline

- Implemented production baseline: TypeScript scenario module, Nurture repository package, Postgres/Prisma schema, migration, and deterministic unit/DB tests.
- P0 workflows: pregnancy stage management, family strategy, short-term care planning, activity comparison, execution review.
- Root Prisma assets are Nurture production-only; they never create My-Chat workflow runtime tables.
- Workflow run/step IDs in Nurture rows are opaque external references.
- The backend workflow dev host uses `apps/backend/prisma`, a generated private client, and the separate `nurture_dev_host` database.
- The Next.js workbench is a scenario development console; it does not own account/auth or shared My-Chat surfaces.

## Local setup

The `@willyu1007/web-workbench` dependency is served by GitHub Packages. Put a `read:packages` token in the user-level npm config; never commit it to this repository.

```bash
pnpm install
pnpm db:up
export DATABASE_URL='postgresql://nurture:nurture@127.0.0.1:5433/nurture?schema=public'
export DEV_HOST_DATABASE_URL='postgresql://nurture:nurture@127.0.0.1:5433/nurture_dev_host?schema=public'
pnpm db:generate:all
pnpm db:deploy
pnpm dev-host:db:deploy
```

## Verify

```bash
pnpm install
pnpm db:generate:all
pnpm typecheck
pnpm verify:test-routing
pnpm test:unit
pnpm test:db
pnpm test:dev-host
pnpm db:assert-boundary
pnpm dev-host:db:assert-boundary
pnpm --filter @the-nurture/frontend lint
pnpm --filter @the-nurture/frontend build
pnpm verify:workflow-contract-pin
node .ai/skills/features/context-awareness/scripts/ctl-context.mjs verify --repo-root . --strict
node .ai/scripts/lint-skills.mjs --strict
```
