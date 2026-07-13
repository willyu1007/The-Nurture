# Verification — G0 baseline reconstruction

## Recorded checks

### 2026-07-13 — protection snapshot

- `git diff --check`: PASS before snapshot.
- `git commit -m "chore(wip): preserve pre-g0 worktree"`: PASS.
- `git status --short --branch --untracked-files=all`: PASS; preservation worktree clean.
- `git diff-tree --no-commit-id --name-only -r 9c54ef27... | wc -l`: PASS; 201 paths, matching the original inventory.
- `git cat-file -t 9c54ef27...`: PASS; commit object readable.

### 2026-07-13 — formal branch baseline

- `git rev-parse HEAD` and `git rev-parse origin/main`: PASS; both are `e76dbb72ad68fbd0bae29a350b66b230890c9dbb`.
- `git status --short --branch --untracked-files=all`: PASS; formal worktree clean.

### 2026-07-13 — UI/tooling retirement

- `node .ai/scripts/lint-skills.mjs --strict`: PASS; 54/54 retained skills, zero warnings or errors.
- `node .ai/tests/run.mjs --list`: PASS; six retained suites and no `ui` suite.
- `node .ai/tests/run-maintainer.mjs --list`: PASS; `environment` retained and no `ui` suite.
- `node .ai/tests/run.mjs --suite context-awareness`: PASS.
- `node .ai/skills/features/context-awareness/scripts/ctl-context.mjs verify --strict`: PASS.
- `node .ai/scripts/ctl-project-governance.mjs lint --check --project main`: PASS.
- retired-path/reference assertions: PASS after removing empty directories left by file deletion.
- `git diff --check`: PASS.

### 2026-07-13 — cross-repository workflow contract pin

- live repository status: PASS; My-Chat and My-Workflow-Base are clean at the pinned revisions.
- `node --test scripts/verify-workflow-contract-pin.test.mjs`: PASS; 4/4 tests, including path sensitivity, traversal rejection, and injected content drift rejection.
- `node scripts/verify-workflow-contract-pin.mjs`: PASS.
  - My-Workflow-Base: revision `095f7a163461c5bbb11fa6f2d8cbda42fe64ca1e`, 8 files, hash `7232ded12b035395d37c3a9970f4e0c2c4fa624dbba5f4fedd7bce2a6eefeb8d`.
  - My-Chat: revision `e53aa6100578bab62cad110c6020e87e19b17c80`, 8 files, matching hash `7232ded12b035395d37c3a9970f4e0c2c4fa624dbba5f4fedd7bce2a6eefeb8d`.
  - The-Nurture scenario contract: 3 files, independent hash `2d294a8450c4a4020f90b544f936142a6b437fdce8cbab023ab23ab6732feda3`.
- JSON parse for the pin and `package.json`: PASS.
- CI workflow YAML parse: PASS.
- project governance lint and strict context verification: PASS.
- `git diff --check`: PASS.

### 2026-07-13 — Nurture production baseline

- `pnpm install --frozen-lockfile`: PASS; 3 workspace importers, relative cross-repo paths, no backend/frontend dependency set.
- `pnpm db:generate` and `pnpm db:validate`: PASS.
- `pnpm typecheck`: PASS.
- `pnpm test:unit:ci && pnpm verify:unit-population`: PASS; 86/86, floor 86.
- migration preview audit: PASS; 22 tables, every table `nurture_*`, zero `Workflow*` runtime enum/table/FK statements.
- `pnpm db:deploy`: PASS against isolated `nurture_g0_verify` database.
- `pnpm db:assert-boundary`: PASS; deployed catalog exactly matches generated DB context with 22 tables and 27 enums.
- `pnpm test:db:ci && pnpm verify:db-population`: PASS; 15/15, floor 15.
- Prisma schema-to-deployed-database diff with `--exit-code`: PASS; no difference detected.
- PostgreSQL catalog query: PASS; 22 `nurture_*` tables and 0 `workflow_*` tables, excluding Prisma migration metadata.
- workflow contract pin verifier/tests: PASS; scenario contract hash updated to `2dfbe1b0b0dace8fd645c4c7f41517ad19b0aed5371725d23c70b241a6743c3c`.
- env contract validation, strict context verification, strict skill lint, project governance lint, CI YAML parse, and `git diff --check`: PASS.

### 2026-07-13 — backend-private workflow dev host

- dev-host migration preview audit: PASS; exactly 6 `workflow_*` tables, 2 `Workflow*` enums, and zero Nurture table/FK statements.
- pre-rebuild backup: PASS using PostgreSQL 16 tools inside `nurture-postgres`.
  - custom-format backup SHA-256: `dfc369f4ded1364eb54f9a8ace391ef1e3b16443762ad3aad94b8a2ba310a5f4`.
  - restore smoke census matched original: 29 tables, 150 projects, 186 runs, 744 steps, 225 artifacts.
- local rebuild: PASS; `nurture` and `nurture_dev_host` were recreated and independently migrated.
- `pnpm db:assert-boundary`: PASS; production catalog 22 `nurture_*`, 0 `workflow_*`.
- `pnpm dev-host:db:assert-boundary`: PASS; dev-host catalog 6 `workflow_*`, 0 `nurture_*`.
- `pnpm verify:persistence-boundaries`: PASS; source schemas, migrations, exports, adapters, and app API are isolated.
- `pnpm verify:test-routing`: PASS; 21 files classified as 12 unit, 2 production DB, and 7 dev-host E2E files.
- unit/production DB/dev-host populations: PASS; 86/86, 15/15, and 14/14.
- `pnpm --filter @the-nurture/frontend lint`: PASS.
- `pnpm --filter @the-nurture/frontend build`: PASS; five routes compiled/typechecked.
- backend process smoke: PASS; dual-DB process listened on `:3001`, `GET /health` returned `{"ok":true}`, and no listener remained after shutdown.
- `docker compose config`, CI YAML parse, generated-client ignore check, relative-lockfile check, and `git diff --check`: PASS.

### 2026-07-13 — preservation coverage audit

- unpublished T-002 base commit: PASS; 11/11 paths represented in the formal branch.
- 201-path WIP population: PASS; 71 exact file blobs, 78 exact deletions, 46 intentional same-path transformations, and 6 explicit SSOT/migration replacements.
- lost/unexplained paths: 0.
- detailed evidence: `g0-wip-coverage-audit.md`.

## Required gates for every formal increment

- `git diff --check`
- targeted functional/type/schema tests for the increment
- project governance lint and context verification when their sources change
- architecture review of the complete increment diff
- staged path audit before commit and residue audit after commit

## G0 closure populations

- Unit: at least 86 tests.
- Nurture production DB: at least 15 tests.
- Backend dev-host E2E: at least 14 tests.
- Existing tests must not be silently excluded.

## Rollout and backout

- Rollout: merge one five-commit PR only after all gates pass; capability remains disabled.
- Backout: revert the affected formal commit; do not rewrite the preservation snapshot.
