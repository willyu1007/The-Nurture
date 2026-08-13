# Verification

## 2026-08-13 — W5 N9 adversarial review repair

- `node scripts/assert-formal-ingress-contract.mjs` — passed; AST census found
  all 14 routes across every scenario-service `.ts` file, exact six-controller
  static/dynamic module registration, the only service bootstrap call, both scoped
  private-filter registrations and both dynamic-module filter providers. Its
  alias, namespace and non-standard-filename negative self-checks passed.
- Focused trusted-invocation suite — 1/1 file, 24/24 tests passed, including the
  upstream-valid/local-expired 60-second request, zero nonce consumption on
  local expiry and exactly one nonce consumption on accepted invocation.
- Focused private exception-filter unit suite — 1/1 file, 3/3 tests passed.
- Focused teacher-release and family-sharing controller E2E suites were run
  after the final filter wiring. Nest application creation and filter DI
  completed, then the managed sandbox denied `127.0.0.1` binding with
  `listen EPERM`; 13 HTTP tests did not reach assertions, while the five
  non-listening tests passed. The existing 401/503 cases now assert both
  `Cache-Control` and `Pragma`, but no passing HTTP-E2E claim is recorded.
- `pnpm exec tsc --noEmit -p tsconfig.json --rootDir ../..` from
  `apps/scenario-service` — passed for service source and non-DB tests. The
  explicit root override avoids the package config's pre-existing shared
  Vitest-config `rootDir` mismatch without invoking a build.
- `pnpm --filter @the-nurture/scenario typecheck` — passed; generated manifest
  is current.
- `pnpm test:unit` — 97/97 files, 1083/1083 tests passed.
- `pnpm verify:test-routing` — passed; 181 files routed as unit 97,
  production-db 51, dev-host 11, scenario-service 17 and x5-joint 5.
- Strict task-document lint — passed, 9/9 Markdown files with zero errors or
  warnings; project-governance lint also passed.
- `git diff --check` — passed.
- Per explicit scope, no build, commit, push, deployment or activation was
  performed.

## 2026-08-13 — W5 N7/N9/N10/N11 closure

- `pnpm --filter @the-nurture/db typecheck` — passed.
- `pnpm --filter @the-nurture/scenario typecheck` — passed; generated manifest
  is current.
- Focused scenario suites (`family-growth/jcs`, `c30/trusted-invocation`) — 2/2
  files, 60/60 tests passed.
- An initial package-filtered JCS command used a package-relative path against
  the workspace-root Vitest include and found no files; it executed no test.
  The corrected repository-root command is the passing focused result above.
- Focused mocked DB production-shape suite
  (`t010-family-sharing-c4.production-shape`) — 1/1 file, 7/7 tests passed,
  including the corrupt cleanup-ledger timestamp row.
- Existing scenario-service family-sharing and teacher-release controller E2E
  suites were attempted directly. This managed sandbox denied loopback binding
  (`listen EPERM: operation not permitted 127.0.0.1`), so 13 HTTP tests did not
  reach assertions; 2 non-listening tests passed. No behavioral failure or
  passing HTTP-E2E claim is recorded.
- `pnpm test:unit` — 97/97 files, 1083/1083 tests passed.
- `pnpm verify:test-routing` — passed; 181 files routed as unit 97,
  production-db 51, dev-host 11, scenario-service 17, x5-joint 5.
- `node scripts/assert-family-sharing-invariants.mjs` — passed; parsed additive
  allowlist, 8 table-bound CHECKs, 2 partial uniques, 4 target uniques and 8
  complete composite FKs pinned.
- `node scripts/assert-family-growth-outbox-invariants.mjs` — passed.
- `node scripts/assert-formal-ingress-contract.mjs` — passed; 7 formal document
  routes and all 14 controller routes censused, including 4 teacher-release and
  1 signed family-sharing route.
- `git diff --check` — passed.
- Strict task-doc lint — passed, 8/8 Markdown files with zero errors/warnings.
- Per explicit scope, `pnpm lint`, build, commit, push, schema/migration work,
  pin rotation, durable apply, deployment and activation were not run.

## 2026-08-13 — W5 N3 disposable qualification

- Approved loopback disposable target:
  `t011_n3_disposable_20260813b`.
- Phase A passed: the full migration history replayed from an empty database,
  positive and negative tenant/lineage probes passed, and synthetic rows were
  removed.
- Phase B1 passed: the previous migration head replayed, coherent legacy rows
  were populated, the T-011 migration applied, all new constraints/indexes
  validated, and populated rows remained intact.
- Phase B2 passed by abort: the cross-scope legacy row caused the exact new FK
  to report SQLSTATE `23503`; the migration abort left all T-011 constraints
  and indexes absent while retaining the violating row.
- Final emptiness passed after cleanup. The disposable containers were
  destroyed; no durable/environment target was applied.

## 2026-08-13 — W5 N1/N3 final review repairs

- `node scripts/assert-family-growth-outbox-invariants.mjs` — passed; only the
  exact transaction wrappers plus `CREATE UNIQUE INDEX`, `ALTER TABLE ... ADD
  CONSTRAINT`, and `COMMENT ON` statement shapes are allowed. Guard self-checks
  reject `DO`, CTE mutation, and `ALTER TYPE` examples.
- Qualification runner `node --check` and `--check-only` — passed; the current
  vehicle requires literal database name plus exact URL digest approval,
  documents its non-proof trust boundary, reasserts identity through Prisma CLI
  on the exact migration URL, broadens emptiness census, and requires both B2
  SQLSTATE `23503` cause evidence and clean post-state absence.
- `pnpm --filter @the-nurture/db typecheck` — passed.
- `pnpm --filter @the-nurture/scenario typecheck` — passed; generated manifest
  current.
- Focused scenario suites (`target-resolution`, `publication-release`) — 2/2
  files, 37/37 tests passed.
- Focused mocked DB contract-shape suite — 1/1 file, 14/14 tests passed,
  including canonical-tuple/head mismatch coverage.
- Focused production-DB preparer suite — attempted; 13 tests could not start
  because the configured `localhost:5433` database was unavailable after the
  disposable teardown. No behavioral failure or passing real-DB claim is
  recorded for this rerun.
- `pnpm test:unit` — 97/97 files, 1055/1055 tests passed.
- `pnpm verify:test-routing` — passed; 181 files routed as unit 97,
  production-db 51, dev-host 11, scenario-service 17, x5-joint 5.
- Strict task-doc lint — passed, 8/8 Markdown files with zero errors/warnings.
- `git diff --check` — passed.
- No build, commit, push, durable database apply, deployment, or activation was
  performed.

## 2026-08-13 — W5 N1/N3 hardening

- `DATABASE_URL=postgresql://placeholder:placeholder@127.0.0.1:1/the_nurture_placeholder
  pnpm exec prisma validate --schema prisma/schema.prisma` — passed; schema
  valid, no connection/apply.
- `pnpm exec prisma generate --schema prisma/schema.prisma` — passed offline;
  Prisma Client 5.22.0 generated.
- `pnpm --filter @the-nurture/db typecheck` — passed.
- `pnpm --filter @the-nurture/scenario typecheck` — passed; generated manifest
  current.
- Focused scenario suites (`target-resolution`, `publication-release`) — 2/2
  files, 37/37 tests passed.
- Focused mocked DB contract-shape suite
  (`t011-family-growth-hardening.contract-shape`) — 1/1 file, 14/14 tests
  passed. This pins the one-statement head/provenance/expiry guard and exact
  `FOR SHARE` SQL without making a real-PostgreSQL execution claim. A genuine
  two-connection blocking test is authored in the production-DB lane but was
  intentionally not executed under this request.
- `pnpm test:unit` — 97/97 files, 1055/1055 tests passed.
- `pnpm verify:test-routing` — passed; 181 files routed as unit 97,
  production-db 51, dev-host 11, scenario-service 17, x5-joint 5.
- `node scripts/assert-family-growth-outbox-invariants.mjs` — passed; parsed
  statement/comment handling, additive statement-shape allowlisting, four
  uniques, three composite FKs and all three legacy FKs at the current
  aggregate migration head pinned. The command is also wired into CI.
- `node dev-docs/active/nurture-cross-repo-contract-supply/artifacts/qualification/run-t011-n3-qualification.mjs
  --check-only` — passed before the disposable execution recorded above.
- `node .ai/scripts/ctl-db-ssot.mjs sync-to-context` and strict context verify —
  passed.
- `git diff --check` — passed.
- `node --check` for the qualification runner and static guard, plus
  `git diff --check` — passed.
- Per explicit scope, `pnpm lint`, migration/runner database mode, durable
  database operations, build, commit and push were not run.

## 2026-08-13 — W5 scoped hardening (N2/N5/N6/N8)

- `pnpm --filter @the-nurture/db typecheck` — passed.
- `pnpm --filter @the-nurture/scenario typecheck` — passed; generated manifest
  check reported current.
- Focused scenario delivery suite — 8/8 passed.
- Focused scenario-service worker suite — 8/8 passed.
- Focused DB contract-shape hardening suite — 5/5 passed.
- `pnpm test:unit` — 97/97 files, 1052/1052 tests passed.
- `pnpm verify:test-routing` — passed; 181 files routed as unit 97,
  production-db 51, dev-host 11, scenario-service 17, x5-joint 5.
- `pnpm verify:persistence-boundaries` — passed.
- Per scope, `pnpm lint` and `verify:workflow-contract-pin` were not run.

## 2026-08-13 — W5 review repairs (NR1–NR5)

- `pnpm --filter @the-nurture/db typecheck` — passed.
- `pnpm --filter @the-nurture/scenario typecheck` — passed; generated manifest
  check reported current.
- Focused scenario delivery suite — 8/8 passed.
- Focused scenario-service worker suite — 10/10 passed.
- Focused DB contract-shape suite — 9/9 passed. This is mocked contract-shape
  coverage only, not real PostgreSQL evidence.
- Focused real-PostgreSQL T-009 outbox/emission suites — attempted but could not
  connect to configured `localhost:5433`; no passing real-DB claim is made.
- `pnpm test:unit` — 97/97 files, 1052/1052 tests passed.
- `pnpm verify:test-routing` — passed; 181 files routed as unit 97,
  production-db 51, dev-host 11, scenario-service 17, x5-joint 5.
- `git diff --check` — passed.
- Per explicit scope, `pnpm lint`, pin verification, schema/migration operations
  and build commands were not run.

## 2026-08-13 — W1 callback design draft v2

- `node .ai/scripts/lint-docs.mjs --strict --path
  dev-docs/active/nurture-cross-repo-contract-supply` — passed; 6/6 Markdown
  files, zero errors and zero warnings.
- No code, schema, migration, runtime or build verification was required for
  this documentation-only revision.
