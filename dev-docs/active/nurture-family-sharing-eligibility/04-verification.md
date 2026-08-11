# T-010 verification

## Automated checks

### I4-C0

- `node .ai/scripts/lint-docs.mjs --strict --path dev-docs/active/nurture-family-sharing-eligibility`
  - Passed 6/6 Markdown files with zero errors or warnings.
- `node .ai/scripts/ctl-project-governance.mjs lint --strict --project main`
  - Passed; T-010 identity, status and `M-004 > F-005 > R-001` mapping are
    consistent.
- `git diff --check`
  - Passed with no whitespace errors.
- Repository-wide `node .ai/scripts/lint-docs.mjs --strict`
  - Checked 600 Markdown files. T-010 contributes no warning; the only warning
    is a pre-existing vague-reference finding in T-009's frozen
    `family-growth-transport-addendum.md`, which this task leaves untouched.

### Later implementation gates

- Prisma format/validate and reviewed migration SQL.
- `node .ai/scripts/ctl-db-ssot.mjs sync-to-context`.
- `node .ai/tests/run.mjs --suite database`.
- Targeted scenario, db and scenario-service typecheck/test lanes.
- Fresh-database migration plus family-sharing authority integration suite.
- Exact-pin My-Chat/Nurture joint conformance.

## Manual smoke checks

- Passed: Nurture main was clean before I4-C0; T-002/T-007 use separate existing
  worktrees.
- Passed: the I4-C0 diff contains only project-governance files and the new
  task bundle. `prisma/schema.prisma`, existing migrations, packages and apps
  are unchanged.
- Passed: no `NurtureGrantDataClass`, production controller/provider,
  environment key or positive fixture was added.

## Rollout and backout

- Rollout: no runtime rollout in I4-C0. Later runtime remains uncomposed until
  database and joint gates pass.
- Backout: documentation/project mapping can be reverted without data impact.
  Once canonical authority or cleanup receipts exist, schema history must be
  preserved and defects forward-fixed.
