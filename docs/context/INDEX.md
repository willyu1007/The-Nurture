# Context Index

`docs/context/` is the curated context layer. Prefer it over ad-hoc scans when the topic is covered.

Canonical registry:

- `docs/context/registry.json`

Key artifacts:

- API contract: `docs/context/api/openapi.yaml`
- API index: `docs/context/api/api-index.json`
- DB contract: `docs/context/db/schema.json`
- Environment contract: `docs/context/env/contract.json`
- Glossary: `docs/context/glossary.json`
- Architecture rules: `docs/context/architecture-principles.md`
- Workflow product design: `docs/context/product/workflow-product-design-contract.md`
- Nurture workflow contract: `docs/context/workflow/nurture-scenario-contract.md`

Rules:

- Registered artifact changes require `node .ai/skills/features/context-awareness/scripts/ctl-context.mjs touch`.
- Verify with `node .ai/skills/features/context-awareness/scripts/ctl-context.mjs verify --strict`.
- Do not hand-edit generated artifacts such as `docs/context/db/schema.json`.
