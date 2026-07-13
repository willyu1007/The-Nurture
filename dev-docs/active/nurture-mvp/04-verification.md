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

### 2026-07-13 — merge and post-merge closure

- PR #1: MERGED as `9e79d5eb89993b7ab9bec115fa1180faa549e21f`; all seven required PR checks passed.
- main push CI run `29216655767`: PASS; all seven jobs passed from the merge commit.
- fresh detached worktree from `origin/main`: PASS for frozen install, dual Prisma generation/validation, typecheck, 86 unit, 15 production DB, 14 dev-host E2E, both catalog boundaries, both schema diffs, frontend lint/build, workflow pins/tests, environment/context/skill/governance checks, compose/YAML parsing, and clean residue assertion.
- cleanup: PASS; restore-smoke database, backup file, preservation/formal branches, remote feature branch, and temporary worktrees removed; `nurture` and `nurture_dev_host` retained.

### 2026-07-13 — closure hardening

- `pnpm test:local-env-runner`: PASS; 2/2 precedence/error tests.
- `pnpm verify:workflow-contract-pin`: PASS; Base/My-Chat contract parity plus 58-file Base `web_workbench` source pin.
- `pnpm test:workflow-contract-pin`: PASS; 4/4 including source drift rejection.
- `pnpm typecheck`, `pnpm lint`, and `pnpm build`: PASS.
- clean-client root build simulation: PASS; removed the ignored dev-host generated client, then `pnpm build` regenerated both clients and completed full typecheck/frontend build without relying on prior workspace residue.
- clean-Base source preparation: PASS; removed the ignored Base `dist/`, then root `pnpm lint` verified the revision/source pin, rebuilt `web-workbench`, and completed frontend lint without prior Base artifacts.
- `pnpm test:dev-host:ci && pnpm verify:dev-host-population`: PASS; 16/16, floor raised to 16.
- `docker compose config`: PASS; PostgreSQL publish address is `127.0.0.1`.
- complete closure matrix: PASS; frozen install, dual Prisma generation/validation, typecheck, 86/86 unit, 15/15 production DB, 16/16 dev-host, both catalog boundaries, both schema diffs, root lint/build, contract/source pins, env/context/skill/governance gates, compose/YAML parsing, and whitespace check.
- positive startup smoke: PASS; `/health` returned `{"ok":true}` and `lsof` showed only `TCP 127.0.0.1:3101`.
- negative startup smoke: PASS; `APP_ENV=production` exited non-zero with the dev-host guard before opening a listener.
- governance sync: PASS; T-001/M-001/F-001 are `done`, T-002 remains `planned`, derived views/changelog regenerated, and the task remains active pending explicit archive approval.

## G0 closure populations

- Unit: at least 86 tests.
- Nurture production DB: at least 15 tests.
- Backend dev-host E2E: at least 16 tests after closure hardening.
- Existing tests must not be silently excluded.

## Rollout and backout

- Rollout: merge one five-commit PR only after all gates pass; capability remains disabled.
- Backout: revert the affected formal commit; do not rewrite the preservation snapshot.
