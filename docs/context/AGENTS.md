# Context Loading Rules

Use `docs/context/registry.json` first. Open only the artifacts needed for the task.

## Task Routing

- Workflow integration: `docs/context/workflow/nurture-scenario-contract.md`
- API work: `docs/context/api/api-index.json`, then `docs/context/api/openapi.yaml` only when schema detail is required.
- DB work: `docs/context/db/schema.json`; schema edits start in `prisma/schema.prisma`.
- Domain terms: `docs/context/glossary.json`
- Cross-cutting rules: `docs/context/architecture-principles.md`

## Rules

- Prefer registered context artifacts over source scanning for covered topics.
- Do not infer API contracts from source when `openapi.yaml` exists.
- Do not hand-edit generated context artifacts.
- After registered artifact changes, run `node .ai/skills/features/context-awareness/scripts/ctl-context.mjs touch` and `node .ai/skills/features/context-awareness/scripts/ctl-context.mjs verify --strict`.
