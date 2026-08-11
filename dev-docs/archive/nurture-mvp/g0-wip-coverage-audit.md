# G0 preservation coverage audit

## Scope

- Unpublished T-002 base commit: `6c5264f806e94f08080c01b2e9025ca43214ce39`.
- Full pre-G0 worktree preservation commit: `9c54ef27a7685d4d0f6cfea9c6f310704c4133f7`.
- Formal reconstruction base: `origin/main` at `e76dbb72ad68fbd0bae29a350b66b230890c9dbb`.
- Formal branch: `codex/g0-nurture-baseline`.

The audit compares paths and blob identities. A path is not treated as accepted merely because it exists in both trees.

## Results

| Population | Result |
| --- | ---: |
| Unpublished T-002 commit paths | 11 |
| T-002 paths present in formal branch | 11 |
| Preserved WIP paths | 201 |
| Exact file blobs | 71 |
| Exact deletions | 78 |
| Intentionally transformed at the same path | 46 |
| Replaced by new canonical paths/history | 6 |
| Lost or unexplained paths | 0 |
| Formal paths added beyond the WIP population | 26 |

## Six explicit replacements

| Preserved path | Formal replacement | Reason |
| --- | --- | --- |
| `.env.example` | `env/.env.example` generated from `env/contract.yaml` | The repository uses repo-env-contract SSOT and forbids a hand-maintained root example. |
| `prisma/migrations/20260623135937_init/migration.sql` | `prisma/migrations/20260713082500_nurture_production_baseline/migration.sql` plus `apps/backend/prisma/migrations/20260713084000_workflow_dev_host_baseline/migration.sql` | The mixed initial migration was split by ownership and rebuilt from empty schemas. |
| `prisma/migrations/20260623135959_workflow_run_partial_unique/migration.sql` | backend dev-host baseline migration | The Workflow runtime constraint belongs only to the backend-private database. |
| `prisma/migrations/20260623140248_scalar_list_defaults/migration.sql` | Nurture production baseline migration | The corrected list defaults were folded into the clean production baseline. |
| `prisma/migrations/20260623215613_profile_projection_drop_profileid_unique/migration.sql` | Nurture production baseline migration | The final projection constraint is represented directly in the clean baseline. |
| `prisma/migrations/20260624001059_activity_comparison_weight_result/migration.sql` | Nurture production baseline migration | The final activity comparison fields are represented directly in the clean baseline. |

## Intentionally transformed same-path files

These 46 files preserve the WIP feature intent but differ at blob level because G0 added ownership isolation, progressive verification evidence, generated governance/context state, or portable dependency/CI behavior.

```text
.ai/project/main/dashboard.md
.ai/project/main/feature-map.md
.ai/project/main/registry.yaml
.ai/tests/run-maintainer.mjs
.ai/tests/run.mjs
.github/workflows/ci.yml
.gitignore
.npmrc
README.md
apps/backend/src/actions/action-service.ts
apps/backend/src/app.ts
apps/backend/src/deps/mock-deps.ts
apps/backend/src/dispatcher.ts
apps/backend/src/ledger/pg-workflow-ledger.repository.ts
apps/backend/src/runtime/pg-workflow-runtime.port.ts
apps/backend/src/server.ts
apps/backend/tests/approval-pause-resume.e2e.test.ts
apps/backend/tests/nurture-family-rule-trial-first-slice.e2e.test.ts
apps/backend/tests/p3-audit-fixes.e2e.test.ts
apps/backend/tests/p4-audit-fixes.e2e.test.ts
apps/backend/tests/safety-escalation.e2e.test.ts
apps/backend/tests/thin-vertical.e2e.test.ts
apps/backend/tests/two-issue-types.e2e.test.ts
dev-docs/active/nurture-institution-mode/.ai-task.yaml
dev-docs/active/nurture-institution-mode/00-overview.md
dev-docs/active/nurture-institution-mode/03-implementation-notes.md
dev-docs/active/nurture-institution-mode/04-verification.md
dev-docs/active/nurture-mvp/.ai-task.yaml
dev-docs/active/nurture-mvp/00-overview.md
dev-docs/active/nurture-mvp/01-plan.md
dev-docs/active/nurture-mvp/02-architecture.md
dev-docs/active/nurture-mvp/03-implementation-notes.md
dev-docs/active/nurture-mvp/04-verification.md
dev-docs/active/nurture-mvp/05-pitfalls.md
dev-docs/active/nurture-mvp/roadmap.md
docker-compose.yml
docs/context/INDEX.md
docs/context/db/schema.json
docs/context/registry.json
package.json
packages/nurture-db/src/index.ts
pnpm-lock.yaml
prisma/migrations/migration_lock.toml
prisma/schema.prisma
vitest.config.ts
vitest.db.config.ts
```

The backend/test transformations are the required single-client to dual-client rewrite. The root Prisma/config transformations are the required production/dev-host split. Governance/dev-doc transformations record the formal five-increment history instead of presenting the WIP snapshot as one atomic change.

## Additional formal guardrail paths

The 26 additional paths are not feature expansion; they make the reconstructed scope independently verifiable or express the new ownership boundary.

```text
apps/backend/README.md
apps/backend/prisma/migrations/20260713084000_workflow_dev_host_baseline/migration.sql
apps/backend/prisma/migrations/migration_lock.toml
apps/backend/prisma/schema.prisma
apps/backend/src/db/dev-host-client.ts
apps/frontend/README.md
dev-docs/active/nurture-institution-mode/05-pitfalls.md
docs/context/env/contract.json
docs/env.md
docs/project/integrations/my-chat-workflow-contract.json
env/.env.example
env/contract.yaml
env/secrets/dev.ref.yaml
env/secrets/prod.ref.yaml
env/secrets/staging.ref.yaml
ops/local-postgres/init/01-create-dev-host.sql
packages/nurture-scenario/README.md
prisma/migrations/20260713082500_nurture_production_baseline/migration.sql
scripts/assert-dev-host-db-boundary.mjs
scripts/assert-persistence-boundaries.mjs
scripts/assert-production-db-boundary.mjs
scripts/assert-test-routing.mjs
scripts/assert-vitest-population.mjs
scripts/verify-workflow-contract-pin.mjs
scripts/verify-workflow-contract-pin.test.mjs
vitest.dev-host.config.ts
```

## Reproduction

```bash
git diff-tree --no-commit-id --name-only -r 9c54ef27a7685d4d0f6cfea9c6f310704c4133f7 | sort -u
git diff --name-only origin/main
git ls-files --others --exclude-standard
git rev-parse 9c54ef27a7685d4d0f6cfea9c6f310704c4133f7:<path>
git hash-object <path>
```

## Conclusion

The formal branch accounts for all 11 unpublished T-002 paths and all 201 preserved WIP paths. Six paths were deliberately replaced by env/migration SSOT artifacts; no preserved path is lost or unexplained.
