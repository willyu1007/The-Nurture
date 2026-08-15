# Disposable migration and behavior execution

- Existing 43 migrations replayed successfully from empty.
- Post-replay SSOT diff found the three redundant legacy foreign keys.
- `20260815190000_align_family_growth_fk_ssot` applied successfully.
- Final migration status: 44 migrations found, database up to date.
- Final migration-set digest:
  `3c1a72764501237cb9a50775db6919dedd9122cff46f99a528f75c55e2bb3fca`.
- Final database-to-datamodel diff: `No difference detected` (exit 0).
- W3/W11 focused PostgreSQL lane: 2 files / 7 tests passed, covering current
  reads, prepare, confirm, exact replay, cross-actor replay denial, authority
  revocation rollback, redaction and delivery receipts.
- Complete PostgreSQL lane: 59 files / 502 tests passed.
