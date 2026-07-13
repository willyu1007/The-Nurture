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
