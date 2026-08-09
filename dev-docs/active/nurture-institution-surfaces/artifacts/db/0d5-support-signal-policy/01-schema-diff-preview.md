# Schema Diff Preview — 0D-5 Support-signal Policy

Reviewed migration:
`prisma/migrations/20260809180000_g4b_institution_support_signal_policy/migration.sql`.

## Additive delta

- Add enum `NurtureInstitutionSupportSignalCategory` with the seven frozen
  0D-5 categories.
- Add one table, `nurture_institution_support_signal_policy`, for immutable,
  effective-dated policy revisions.
- Add partial unique indexes for Institution-default and class-override
  revision heads, ordinary effective-read indexes, validation checks and three
  restrictive foreign keys.
- Add no signal, dismissal, acknowledgement, resolution or history table.

## Destructive review

- Dropped/renamed tables: none
- Dropped/renamed columns: none
- Existing-column type changes: none
- Data rewrite/backfill: none
- New non-null field on an existing table: none

`pnpm exec prisma format --schema prisma/schema.prisma` and
`pnpm exec prisma validate --schema prisma/schema.prisma` pass. The migration
was subsequently applied only to the approved disposable database and is
recorded in [`03-execution-log.md`](./03-execution-log.md).
