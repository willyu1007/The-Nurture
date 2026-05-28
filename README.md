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
- Initialization archive: `docs/project/overview/START-HERE.md`

## Baseline

- Stack: TypeScript, pnpm, Next.js, NestJS, Postgres, Prisma, BullMQ/Redis-compatible workers.
- P0 workflows: pregnancy stage management, family strategy, short-term care planning, activity comparison, execution review.
- Local DB MAY be independent Postgres.
- Cloud DB SHOULD merge into My-Chat Postgres through a dedicated schema or `nurture_*` table group after the recorded migration gates pass.

## Verify

```bash
pnpm typecheck
pnpm --filter @the-nurture/scenario typecheck
node .ai/skills/features/context-awareness/scripts/ctl-context.mjs verify --repo-root . --strict
node .ai/scripts/lint-skills.mjs --strict
```
