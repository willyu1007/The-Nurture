# Verification

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
