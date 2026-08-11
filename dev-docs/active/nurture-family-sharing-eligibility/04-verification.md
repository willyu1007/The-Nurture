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

## 2026-08-12 I4-C1 gates

| Check | Result |
| --- | --- |
| `prisma format` / `prisma validate` (placeholder URL, no connection) | PASS |
| Migration SQL review artifact | `artifacts/db/t010-family-sharing-authority/01-schema-diff-preview.md` + `02-migration-plan.md`; additive-only, no DROP/ALTER-TYPE/backfill |
| DB context sync | `pnpm db:context` regenerated `docs/context/db/schema.json`; registry checksum `1c18d236…` |
| Typecheck / unit | 0 errors; unit suite PASS (no new test files, routing census unchanged 169) |
| `verify:persistence-boundaries` | PASS (no `workflow_` leakage; nurture-prefixed tables only) |
| `verify:workflow-contract-pin` | PASS after self-pin rotation to `003cbe81…` (281 files) |
| Non-change assertions | `NurtureGrantDataClass`/`NurtureGrantDirection` byte-identical; frozen digest `0cc3ccc8…` untouched |
| Database writes | NONE — apply remains behind the C4 approved-disposable gate and a separate durable approval |

Current verdict: `I4_C1_DRAFTED_REVIEW_PENDING / NO_APPLY`.

## 2026-08-12 I4-C1 post-review gates

| Check | Result |
| --- | --- |
| Independent review (Codex gpt-5.6-sol, full diff) | 6 findings; 5 addressed in this rework, 1 fixed My-Chat-side (decision-identity verification in the currentness port) |
| `prisma format` / `prisma validate` (composite-FK schema) | PASS |
| `pnpm verify:family-sharing-invariants` | PASS — 8 CHECKs, 2 partial uniques, 4 target uniques, 8 composite FKs pinned |
| DB context re-sync | checksum `0a9d51f1…` |
| Typecheck / unit / persistence-boundaries / test-routing | PASS (see command log) |
| Database writes | NONE — preview-only unchanged |

Current verdict: `I4_C1_REVIEWED_REWORKED / NO_APPLY / I4_C2_NEXT`.
