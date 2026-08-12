# T-007 formal ingress owner execution log

All commands ran from the repository root; the final formal round ran at
commit `223daa7`. `DATABASE_URL` was set only for the executing process, with
the database pathname replaced by the exact disposable target. Credentials
are never recorded in evidence.

## Iteration round (devcheck target)

1. Absence proof on `localhost:5433`: zero `nurture_t007_g4e_e7%` databases
   and zero sessions.
2. `CREATE DATABASE nurture_t007_g4e_e7_devcheck_20260811` — exit 0.
3. `pnpm exec prisma migrate deploy --schema prisma/schema.prisma` — 36/36
   applied from empty.
4. Targeted `vitest run -c vitest.db.config.ts packages/nurture-db/tests/`
   `t007-institution-knowledge-formal-owners.integration.test.ts` — 3/4.
   The expiry case returned `unavailable /
   prepared_command_ledger_unavailable`. **Finding `DR-E7-01`**: the migration
   CHECK required `snapshot_codec_version >= 1` and a non-empty ciphertext
   unconditionally, contradicting the frozen repository expiry scrub
   (status `expired`, codec `0`, empty ciphertext); the scrub UPDATE violated
   the constraint inside the consume transaction. Repaired in the migration at
   commit `b0adb64` — the migration had never been applied to any durable
   target, so no applied checksum drifts.
5. Devcheck target recreated from empty with the repaired migration — 36/36;
   targeted suite 4/4.
6. `DROP DATABASE nurture_t007_g4e_e7_devcheck_20260811` — exit 0.

## Formal round (qualification target)

1. Absence proof at `2026-08-11T14:07:33Z`: zero `nurture_t007_g4e_e7%`
   databases and sessions; server identity `PostgreSQL 16.13`.
2. `CREATE DATABASE nurture_t007_g4e_e7_qualification_20260811_01` — exit 0.
3. `pnpm exec prisma migrate deploy --schema prisma/schema.prisma` — exit 0,
   36/36 applied; `_prisma_migrations` finished count `36`.
4. `pnpm exec prisma migrate status --schema prisma/schema.prisma` —
   "Database schema is up to date!".
5. Targeted formal-owners integration suite — 4/4: current authority with
   wrong-role denial and revocation reread; exact-prepare dedup with
   client-command reuse rejection; unconsumed-expiry snapshot scrub with no
   client-command revival under fresh authority; mismatched-confirmation
   conflict with the exact consume still succeeding; concurrent
   consume/replay convergence on one persisted row.
6. `pnpm test:db` — 44 files / 395 tests passed.
7. `pnpm db:assert-boundary` — `[ok] production DB boundary tables=99
   enums=121`.
8. `pnpm exec prisma migrate diff --from-schema-datasource
   prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma` — the
   first run reported three rename-only foreign-key differences.
   **Finding `DR-E7-02`**: the model relations lacked the sibling-convention
   `map:` attributes for the migration's short constraint names. Repaired in
   `prisma/schema.prisma` at commit `223daa7` (metadata only, no database
   shape change); the recheck returned "No difference detected.".
9. `pnpm db:context` — context refreshed; `docs/context/db/schema.json` is
   byte-identical, checksum `af51b1d7…` as recorded in
   `01-schema-diff-preview.md`.
10. Final rerun at `223daa7`: `pnpm test:db` 44 files / 395 tests; drift
    "No difference detected."; migration status current;
    `verify:test-routing` (`unit=94 production-db=44 dev-host=11
    scenario-service=16 x5-joint=2`), `verify:persistence-boundaries`,
    `verify:port-topology`, `verify:formal-ingress-contract` (`routes=7 …
    registered=65`) and `db:assert-boundary` all `[ok]`.
11. Pre-destroy session count `0`; `DROP DATABASE` without `FORCE` — exit 0;
    post-destroy database and session census `0/0` at `2026-08-11T14:11:04Z`.

## Supporting lanes at the same checkpoint

- `pnpm test:unit` — 94 files / 1014 tests.
- `pnpm --filter @the-nurture/scenario typecheck` and
  `pnpm --filter @the-nurture/db typecheck` — clean.
- `pnpm verify:g3-0-freeze` — green after commit `7f93e8d` declared
  `NurtureInstitutionKnowledgePreparedCommand` in the no-board-row census and
  repointed archived-task document references to `dev-docs/archive/`.
