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

## 2026-08-12 I4-C2 gates

| Check | Result |
| --- | --- |
| `pnpm --filter @the-nurture/scenario typecheck` | PASS; exact C2 domain input/output port compiles and manifest parity remains current. |
| Initial `pnpm --filter @the-nurture/db typecheck` | FAIL before verification completion: the generated Prisma client was stale for already-landed T-007 prepared-command models, and two new nullable-date narrowings required correction. No source workaround was accepted. |
| `pnpm db:generate` | TOOLING FAIL before Prisma execution: the Windows local-env wrapper returned `spawnSync pnpm.cmd EINVAL`; no database connection or write occurred. |
| `pnpm exec prisma generate --schema prisma/schema.prisma` | PASS; generated the local client directly from the repo SSOT without connecting to or writing a database. |
| `pnpm --filter @the-nurture/db typecheck` (after generation/fix) | PASS, zero diagnostics. |
| `pnpm exec vitest run -c vitest.db.config.ts packages/nurture-db/tests/family-sharing-current-authority.repository.test.ts` | PASS, 1 file / 16 tests. This is a DB-lane repository behavior and parameterized-query contract suite; it does not claim that the SQL has executed against the unapplied C1 schema or that a real database can contain duplicate active rows. Fresh PostgreSQL schema execution/cardinality qualification remains C4. |
| `pnpm verify:test-routing` | Initial concurrent census was 174 with an unadmitted T-007 vehicle. Final ownership review removed that file; PASS is 173 files (`unit=96`, `production-db=47`, `dev-host=11`, `scenario-service=16`, `x5-joint=3`). |
| `pnpm test:unit` | PASS, 96 files / 1027 tests. |
| First combined `pnpm typecheck` after full unit | FAIL: two T-010 test-source typing issues were identified and fixed; the same run also reported concurrent T-007 test diagnostics and a stale linked My-Chat Prisma client for `nurtureProspectiveContact`. These non-T-010 diagnostics are not represented as a C2 failure or silently repaired here. |
| Focused tests plus scenario/db package typechecks after fixes | PASS: 16/16 focused tests; both package typechecks and manifest parity passed. A direct repository-root `tsc --noEmit` then contained only the concurrent T-007/linked-My-Chat diagnostics above and no T-010 diagnostic. |
| Final repository-root typecheck after combined review | PASS: T-007 joint-test diagnostics were corrected and `pnpm install --offline --frozen-lockfile` restored the already-locked local `@my-chat/llm`/`@my-chat/rag` links; `pnpm typecheck` finishes with zero diagnostics and no lockfile change. |
| `pnpm verify:family-sharing-invariants` | PASS: 8 CHECKs, 2 partial uniques, 4 target uniques and 8 composite FKs remain pinned. |
| `pnpm verify:persistence-boundaries` | PASS; Prisma remains isolated to the DB package. |
| T-010 strict docs lint / project governance lint / `git diff --check` | PASS: 8/8 task Markdown files, governance mapping and whitespace validation. |
| Combined exact-runtime pin | PASS after T-007/T-010 source settlement and ownership review: Nurture self-pin `3276062e…` over 291 files; My-Chat `ec9f298` and Base `536638a` remain exact; verifier and 7 verifier tests pass. |

Current verdict:
`I4_C2_READER_IMPLEMENTED_CONTRACT_QUALIFIED / DB_SQL_EXECUTION_PENDING_C4 /
NO_APPLY / NO_ACTIVATION`.

## 2026-08-12 I4-C3 gates

| Check | Result |
| --- | --- |
| `pnpm --filter @the-nurture/scenario-service exec vitest run -c vitest.config.ts tests/family-sharing-private-controller.e2e.test.ts` | PASS, 1 file / 11 tests: default-off, bearer authentication, detached signature, service subject, exact audience, revoked trust, expiry, nonce replay, strict extra-field refusal, authority drift/revoke, resolver outage, signed no-store output, cleanup replay, truthful zero-purge attestation, local-only purge scope and partial-failure refusal. |
| `pnpm exec vitest run -c vitest.db.config.ts packages/nurture-db/tests/family-sharing-exact-local-pair.repository.test.ts` | PASS, 1 file / 6 tests: exact internal resolution plus missing/ambiguous/malformed/stale/mismatched/outage fail-closed behavior and parameterized-query shape. This is not real PostgreSQL execution. |
| `pnpm --filter @the-nurture/scenario typecheck` / `pnpm --filter @the-nurture/db typecheck` | PASS, zero diagnostics. |
| `pnpm exec tsc --noEmit -p apps/scenario-service/tsconfig.build.json` | PASS, production source composition compiles. |
| `pnpm exec tsc --noEmit -p apps/scenario-service/tsconfig.json --rootDir ../..` | PASS, source plus scenario-service tests compile. The package `typecheck` command without the override still exposes its baseline `TS6059` because `vitest.config.ts` imports the repository-root resolver outside the app `rootDir`; C3 did not broaden shared TypeScript configuration. |
| `pnpm verify:test-routing` | PASS after mechanical census rotation: 175 files (`unit=96`, `production-db=48`, `dev-host=11`, `scenario-service=17`, `x5-joint=3`). |
| Final repository-root static and unit gates | PASS: `pnpm typecheck` has zero diagnostics after the exact-pair SQL mock was typed with its real statement argument; `pnpm test:unit` passes 96 files / 1027 tests. Family-sharing invariants, persistence boundaries, formal ingress and port topology also pass. |
| Exact source evidence | Nurture self-pin `c701ed9f210896bb203a2cb68616740218cc5465c1785eb0387c8e3c3d54162e` matches the current 297-file source population. Base contract/workbench and My-Chat shared-contract/wave4 pins match. The complete verifier intentionally rejects only the changed, uncommitted My-Chat `x5_joint_api` population, so no old My-Chat revision is falsely rebound to new source. |
| Database/schema/manifest/activation | No Prisma schema or migration change, no manifest rotation, no database apply, no durable target execution and no runtime activation. |

Current verdict:
`I4_C3_TRANSPORT_AND_CLEANUP_IMPLEMENTED_CONTRACT_QUALIFIED /
DB_SQL_NONCE_LEDGER_AND_JOINT_EXECUTION_PENDING_C4 / NO_APPLY / NO_ACTIVATION`.

## 2026-08-12 I4-C4 environment-free gates

| Check | Result |
| --- | --- |
| C1 schema/migration vs C2/C3 implementation review | PASS, no mismatch found and no schema/migration widening performed. The C1 authority/policy tables, composite FKs, direction/purpose/revoke/expiry checks and partial uniques cover the current reader/vehicle inputs. |
| Placeholder-only `pnpm exec prisma validate --schema prisma/schema.prisma` | PASS. The placeholder URL was not contacted; Prisma only validated the schema. |
| `pnpm verify:family-sharing-invariants` | PASS: 8 CHECKs, 2 partial uniques, 4 target uniques and 8 composite FKs. |
| `node dev-docs/active/nurture-family-sharing-eligibility/artifacts/qualification/run-t010-c4-qualification.mjs --check-only` | PASS. Required schema/migration/test/CLI files and frozen C1 migration invariants are present. No URL was read and no connection occurred. |
| Focused C2/exact-pair/C4 environment-free DB lane | PASS, 3 files / 28 tests: C2 16, exact-pair 6, C4 safety/lock contract 6. |
| C3 scenario-service regression | PASS, 1 file / 11 tests after cleanup-ledger exclusive-execution change. |
| Scenario production build / DB production build / scenario-service production-source typecheck | PASS, zero diagnostics; scenario manifest parity remains current. |
| DB package typecheck and scenario-service source+test typecheck with repository root override | PASS, zero T-010 diagnostics. |
| Full scenario package typecheck attempt | Shared-worktree FAIL outside T-010: concurrent T-007 enrollment-journey tests currently disagree on `host_correlation_id` / `command_request_id`. Scenario production build passes; T-010 files have no diagnostic. |
| Test census | Root integration merged the combined 178-file census: unit 97, production DB 49, dev host 11, scenario service 17 and x5 joint 4. The ordinary no-target DB population floor is now 209; the approved-target C4 file defines 12 tests. |
| Database/activation | NOT RUN: no `NURTURE_T010_C4_DATABASE_URL`, explicit approval or known disposable target was available. No Docker/database probe, migration apply, deployment, activation or traffic occurred. |

### Approved disposable execution command

The operator MUST supply a newly created empty database whose name matches
`t010_i4c4_test_*` or `t010_i4c4_disposable_*`. The URL is intentionally not
shown or stored in this repository.

```powershell
$env:NURTURE_T010_C4_DATABASE_URL = '<approved disposable PostgreSQL URL>'
$env:NURTURE_T010_C4_DISPOSABLE_APPROVED = 'I_APPROVE_T010_C4_DISPOSABLE_WRITES'
node dev-docs/active/nurture-family-sharing-eligibility/artifacts/qualification/run-t010-c4-qualification.mjs
```

Expected success: full migration deployment, 12/12 focused production-shape
tests and a zero-residual-data assertion. Until that command runs against an
approved target, none of those execution claims are complete.

Current verdict:
`I4_C4_PRODUCTION_SHAPE_VEHICLE_READY / EXECUTION_PENDING /
NO_DATABASE_CONTACT / NO_APPLY / NO_ACTIVATION`.

Root integration additionally rotated only the settled Nurture exact-runtime
self-pin to `5a59039b...` over 298 files. The complete workflow verifier still
rejects the uncommitted My-Chat `x5_joint_api` source drift, so no external
revision or false cross-repository qualification is claimed.

## 2026-08-12 baseline quality-audit rerun

| Check | Result |
| --- | --- |
| private controller regression | PASS — 12 tests |
| corrupt cleanup-ledger receipt substitution | PASS — owner returns only generic unavailable |
| C4 qualification runner `--check-only` | PASS |
| routing census | PASS — 178 files: 97 unit / 50 production DB / 11 dev host / 17 scenario service / 3 x5 |

The cleanup domain owner now independently validates the complete immutable
receipt returned by its ledger: exact command/fingerprint/categories,
deterministic receipt ref, canonical completion time, and one ordered receipt
for every registered local store. A repository cannot substitute a malformed
success result. This adds no schema, target access, apply or activation.
