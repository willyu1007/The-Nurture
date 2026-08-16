# The Nurture

The Nurture is a My-Chat scenario module for pregnancy, motherhood, childcare, family strategy, activity comparison, and review-driven parenting workflows.

## Non-Negotiables

- The Nurture is not an independent product shell.
- My-Chat owns canonical objects, auth, shared workflow runtime, dashboard/chat/mobile/forum/knowledge/notification/admin surfaces, ledgers, workers, and the shared workflow outbox. The Nurture owns its scenario-local provider outbox for outbound cross-owner contract events (for example `family_growth_material_release`); these are different objects.
- The Nurture owns scenario workflows, local projections, policies, artifacts, and scenario-specific console/API surfaces.
- Nurture profiles MUST attach to My-Chat canonical objects; do not create duplicate child/family/person identity ownership.
- My-Chat `child_id` is the opaque shared subject key. Nurture binds it to a
  local `NurtureChild`; the local `NurtureChild.id` and care-process `childId`
  are not platform child IDs, and the binding never grants scenario access.
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
- The legacy workflow test host uses `apps/backend/prisma`, a generated private client, and the separate `nurture_dev_host` database. It is not the normal Nurture backend.
- The Next.js workbench is a scenario development console; it does not own account/auth or shared My-Chat surfaces.

## Local setup

Local development consumes My-Chat and My-Workflow-Base from sibling checkouts. Their exact revisions, workflow contract hashes, and the Base `web-workbench` source hash are pinned in `docs/project/integrations/my-chat-workflow-contract.json`; no GitHub Packages token is required.

```bash
pnpm verify:workflow-contract-pin
pnpm install
test -f .env.local || cp env/.env.example .env.local
# Replace both <secret:...> placeholders with the local database URLs.
pnpm db:up
pnpm db:generate
pnpm db:deploy
pnpm dev
```

`pnpm lint` and `pnpm build` re-verify the sibling revisions/source hashes and build the pinned `web-workbench` automatically; they do not depend on a pre-existing Base `dist/` directory.

## Verify

```bash
pnpm install
pnpm test:local-env-runner
pnpm db:generate:all
pnpm db:validate
pnpm build
pnpm lint
pnpm verify:test-routing
pnpm test:unit
pnpm test:db
pnpm db:assert-boundary
pnpm verify:workflow-contract-pin
node .ai/skills/features/context-awareness/scripts/ctl-context.mjs verify --repo-root . --strict
node .ai/scripts/lint-skills.mjs --strict
```

Repository commands load configuration in this order: the existing process environment, `.env.local`, then `.env`. Runtime/CI injection therefore remains authoritative while Prisma and Vitest also follow the generated local-env convention.

`db:generate:all` is a full-repository verification helper; normal scenario
service development needs only `db:generate`.

The Fastify harness is retained only for focused legacy workflow-runtime
evidence. It is never required to start the normal scenario service. Run its
isolated lane explicitly when changing that boundary:

```bash
pnpm legacy-host:db:validate
pnpm legacy-host:db:deploy
pnpm test:legacy-host
pnpm legacy-host:db:assert-boundary
```
