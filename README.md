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
- The backend workflow dev host is a separate G0 increment and must use an independent database/migration stream.

## Verify

```bash
pnpm install
pnpm db:generate
pnpm typecheck
pnpm test:unit
DATABASE_URL=<nurture-postgres-url> pnpm db:deploy
DATABASE_URL=<nurture-postgres-url> pnpm db:assert-boundary
DATABASE_URL=<nurture-postgres-url> pnpm test:db
pnpm verify:workflow-contract-pin
node .ai/skills/features/context-awareness/scripts/ctl-context.mjs verify --repo-root . --strict
node .ai/scripts/lint-skills.mjs --strict
```
