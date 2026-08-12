# Execution log — G4-D I3 disposable qualification

Sanitized commands with outcomes; connection strings, signing material and
credentials are intentionally absent.

## Formal round (disposable `nurture_i3`, postgres:16-alpine @127.0.0.1:55452)

1. `docker run … postgres:16-alpine` → healthy (pg_isready). Exit 0.
2. `prisma migrate deploy` from empty → 39/39 migrations applied. Exit 0.
3. `prisma migrate status` → "Database schema is up to date!". Exit 0.
4. Targeted suite
   `vitest run -c vitest.db.config.ts packages/nurture-db/tests/t007-enrollment-journey-formal-owners.integration.test.ts`
   → first runs surfaced fixture-shape gaps and one real defect:
   - `DR-I3-01` (production): minted `workflow_run_ref` used the `nurture`
     namespace; `ck_nurture_institution_workflow_identity` requires
     `my_chat`/`workflow_run`. Fixed in the composition; only the disposable
     observed the violation.
   - Fixture completeness (test-only): active inquiry requires the
     `inquiry_started` milestone; workflow seeding requires the exact
     transition row, so the targeted suite anchors authority through the
     `prospective_contact` option instead of seeding a synthetic workflow.
   Final form: 3/3 PASS.
5. Full production-db lane `vitest run -c vitest.db.config.ts`
   → 403/403 across 46 files. Exit 0.
6. Drift check `prisma migrate diff --from-url <disposable>
   --to-schema-datamodel prisma/schema.prisma --script`
   → "-- This is an empty migration." Exit 0.
7. `docker rm -f nurture-i3-db` → destroyed; container census 0.

## Supporting lanes at the same checkpoint

- `pnpm test:unit` → 1027/1027 (96 files; includes the new
  enrollment prepared-command owner suite 8/8 and formal-ingress suite 5/5).
- `pnpm typecheck` → 0 errors.
- `prisma format` / `prisma validate` → PASS.
- `pnpm verify:test-routing` → files=172 unit=96 production-db=46 dev-host=11
  scenario-service=16 x5-joint=3.
- `pnpm verify:formal-ingress-contract` → [ok] routes=7 registered=65
  unrouted=32 (unchanged; the trusted lane adds no HTTP route).
- `node scripts/verify-c30-i3-default-off.mjs` → census re-recorded with
  trusted_invocation_handlers=9 (three enrollment operations added; all
  default-off counters zero).
- `node scripts/assert-g3-0-freeze.mjs` → [ok] (persisted-table census now
  declares `NurtureEnrollmentJourneyPreparedCommand` and the two reviewed
  T-010 tables the C1 commit had not declared).
- `node scripts/generate-nurture-scenario-manifest.mjs --check` → current.
- `pnpm verify:workflow-contract-pin` → [ok] after self-pin rotation to
  `6767f609…` (290 files); My-Chat revision stays `ec9f298…`.
- `pnpm db:context` → schema context refreshed, checksum `69c5eac7…`.
