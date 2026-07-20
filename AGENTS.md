# AI Assistant Instructions

The Nurture is a My-Chat scenario module. Preserve My-Chat ownership boundaries and My-Workflow-Base contracts.

## Global Strategy

- Do not treat The Nurture as an independent product shell.
- Do not copy or fork My-Chat host runtime code into this repo unless explicitly requested.
- Scenario-local data may exist, but identity belongs to My-Chat canonical objects.
- My-Chat owns shared `child_id` and `family_id`. Nurture owns the local child
  profile and care process that bind to those opaque IDs; an existing local
  `NurtureChild.id` is not a platform `child_id`.
- A parent/steward creates the My-Chat child or explicitly authorizes another
  actor to create it. Without that authority, Nurture may keep only a local
  provisional child and MUST NOT mint or infer a global child identity.
- A `child_id`, family association, or My-Chat scenario binding is routing and
  policy input, never sufficient permission to read Nurture facts.
- Health guidance must be non-diagnostic, non-prescriptive, and non-emergency-replacement.
- Prefer `docs/context/` contracts before source scanning for API, DB, workflow, glossary, or architecture context.
- Initialization history belongs under `docs/project/overview/`; do not add new planning there.

## Task Routing

- Project governance: `.ai/project/AGENTS.md`
- Complex task docs: `dev-docs/AGENTS.md`
- Context contracts: `docs/context/AGENTS.md`
- Skill maintenance: `.ai/AGENTS.md`
- Historical initialization decisions: `docs/project/overview/START-HERE.md`

## Workflow Contract Rules

Before changing workflow integration, read:

- `docs/context/workflow/nurture-scenario-contract.md`
- `packages/nurture-scenario/scenario.manifest.yaml`
- `packages/nurture-scenario/src/module.ts`

The Nurture owns scenario manifest, handlers, actions, presenters, adapters, policies, repository ports, local projections, and scenario artifacts.

My-Chat owns canonical object identity, auth, shared workflow runtime, routes, workers, outbox, ledgers, dashboard/chat/mobile/forum/knowledge/notification/admin consumers.

Nurture consumes `my_chat.child` through pinned owner contracts/APIs and
stores only an opaque binding to its local child. It MUST NOT import the
My-Chat ORM, query the My-Chat database, derive `child_id` from PII, or use the
same ID as an authorization grant.

## Work Rules

- For non-trivial post-initialization work, apply `dev-docs/AGENTS.md` Decision Gate.
- Keep host-runtime concerns out of scenario packages.
- Use ESM for scripts (`.mjs`, `import`/`export`).
- Do not edit `.codex/skills/` or `.claude/skills/` directly; edit `.ai/skills/` and regenerate wrappers.
- Never create/copy/clone this repository into a subdirectory of itself.

<!-- DB-SSOT:START -->
## Database SSOT and schema synchronization

**Mode: repo-prisma** (SSOT = `prisma/schema.prisma`)

- SSOT selection file: `docs/project/db-ssot.json`
- DB context contract (generated, LLM-first): `docs/context/db/schema.json`
- If you need to change persisted fields / tables: use skill `sync-db-schema-from-code`.
- If you need to mirror an external DB: do NOT; this mode assumes migrations originate in the repo.

Rules:
- Business layer MUST NOT import Prisma (repositories return domain entities).
- Database workflows in this repo require `features.contextAwareness=true`.
- Refresh generated DB context via `node .ai/scripts/ctl-db-ssot.mjs sync-to-context`.
<!-- DB-SSOT:END -->
