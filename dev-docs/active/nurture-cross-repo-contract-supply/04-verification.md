# Verification

## 2026-08-13 — W2 second adoption-review repair

- `node --import tsx packages/nurture-scenario/contracts/parent-context-presenter/v1/validate-contract.mjs`
  — passed at
  `sha256:3ac0906c6b514c861d266c3b4e470e5dcacb6cccdd61887e7b7a03e4c194c196`;
  five operation schema pairs, the discriminated notice exchange, 16 valid
  fixtures, eight required-invalid fixtures, 11 consistency probes and 10
  strict authority/foreign-field probes passed.
- Focused real-route parent-context suite — final rerun passed 1/1 file and
  12/12 tests through `Test.createTestingModule` and in-memory HTTP injection
  against the mounted Nest/Express adapter. It includes the full five-field
  confirmation tuple, `list + not_committed`, unpublished
  `private_care_note`, generic private/no-store 500 behavior and application
  ASYNC-12 rejection.
- The first focused attempt executed zero tests because startup schema
  compilation referenced a non-hoisted helper; the helper was changed to a
  function declaration. TCP and Unix-domain listener reruns were then blocked
  uniformly by sandbox `listen EPERM`; no route assertions ran in those two
  attempts. The final in-memory HTTP transport requires no listener and is the
  passing route evidence above.
- `pnpm exec tsc --noEmit -p tsconfig.json --rootDir ../..` from
  `apps/scenario-service` — passed after runtime validation, async-boundary,
  test-module, filter-DI and in-memory HTTP changes; no build was invoked.
- `node scripts/assert-formal-ingress-contract.mjs` — passed; 19 controller
  routes remain pinned, including all five parent-context routes, and the
  census now asserts startup response-schema compilation, exact runtime pin,
  complete owner/async binding, notice matrix and application ASYNC-12 gate.
- `pnpm --filter @the-nurture/scenario typecheck` — passed; the generated
  Scenario manifest is current and package TypeScript is clean.
- `pnpm test:unit` — passed, 97/97 files and 1083/1083 tests.
- `pnpm verify:test-routing` — passed; 182 files routed as unit 97,
  production-db 51, dev-host 11, scenario-service 18 and x5-joint 5.
- `node .ai/scripts/lint-docs.mjs --strict --path
  dev-docs/active/nurture-cross-repo-contract-supply` — passed, 15/15 Markdown
  files with zero errors and warnings. `git diff --check` also passed.
- Per explicit scope, no build, commit, push, database apply, deployment,
  activation or traffic operation was performed.

## 2026-08-13 — W2 adoption-review repair

- `node scripts/assert-formal-ingress-contract.mjs` — passed; the AST census
  pins 19 controller routes, including all five parent-context routes, the
  service-bearer guard, controller-scoped private-response filter, default-off
  runtime gate and filter-provider registration.
- `node --import tsx packages/nurture-scenario/contracts/parent-context-presenter/v1/validate-contract.mjs`
  — passed at
  `sha256:e19642198f5022f0e68e5908e6d17098abee6a12942f47a247e7e5a8db633fd6`;
  five operations, 16 valid fixtures, eight required-invalid fixtures, eight
  operation-consistency probes and 10 strict authority/foreign-field probes
  passed.
- Focused parent-context ingress conformance — 1/1 file and 10/10 tests passed.
  The suite uses the real Nest module/controller/guard/private-filter graph in
  process and covers all routes, auth and contract negatives, Q6 resolution,
  six masking classes, bound notice confirmation, replay and ASYNC-12 late
  result rejection.
- `pnpm --filter @the-nurture/scenario typecheck` — passed; generated Scenario
  manifest current and TypeScript clean.
- `pnpm exec tsc --noEmit -p tsconfig.json --rootDir ../..` from
  `apps/scenario-service` — passed for service source and non-DB tests without
  invoking a build.
- `pnpm test:unit` — 97/97 files and 1083/1083 tests passed.
- `pnpm verify:test-routing` — passed; 182 files routed as unit 97,
  production-db 51, dev-host 11, scenario-service 18 and x5-joint 5.
- Environment-contract validation/generation and
  `node .ai/tests/run.mjs --suite environment` — passed for the new optional,
  non-secret, default-false presenter gate.
- Strict task-document lint — passed, 15/15 Markdown files with zero errors or
  warnings. `git diff --check` passed, and the changed-file census contains no
  pin JSON.
- Per explicit scope, no `pnpm lint`, build, commit, push, database apply,
  deployment, activation or traffic operation was performed.

## 2026-08-13 — W2 parent-context presenter v1 initial authoring (pre-review)

- `node --import tsx packages/nurture-scenario/contracts/parent-context-presenter/v1/validate-contract.mjs`
  — passed. The repository's strict RFC 8785 implementation computed
  `sha256:121ae526c1628c0ed040c77b064c192498f4be6cf307533efdcab40987127d64`;
  all five request/response schema pairs compiled; 16 fixtures passed; every
  operation had positive and negative coverage; all six required negative
  scenarios, notice list/prepare/confirm and late-completion coverage were
  present; 10 caller-authority/foreign-response rejection probes passed.
- No Vitest file was added: the requested small standalone validator is the
  conformance vehicle, so no focused Vitest command was applicable and the
  repository's exact unit-test routing census remained unchanged.
- `pnpm --filter @the-nurture/scenario typecheck` — passed; generated Scenario
  manifest current and TypeScript clean.
- `pnpm test:unit` — 97/97 files and 1083/1083 tests passed.
- `pnpm verify:test-routing` — passed; 181 files routed as unit 97,
  production-db 51, dev-host 11, scenario-service 17 and x5-joint 5.
- `node .ai/scripts/lint-docs.mjs --strict --path
  dev-docs/active/nurture-cross-repo-contract-supply` — passed after W2
  authoring; 10/10 Markdown files with zero errors and warnings.
- `git diff --check` — passed. The changed-file census contains no existing
  `*pin*.json`, Surface source, route/controller, runtime composition, schema or
  migration file.
- Per explicit scope, no `pnpm lint`, build, commit, push, database apply,
  deployment, activation or traffic operation was performed.

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
