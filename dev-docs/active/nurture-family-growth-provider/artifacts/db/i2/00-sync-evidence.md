# T-009 I2 DB Sync Evidence (local dev)

One consolidated record for the `sync-db-schema-from-code` run of 2026-08-07
(target: local `nurture-postgres` dev database at `127.0.0.1:5433`,
migration strategy: versioned; user authorization: the 2026-08-07 "从 I2+I4
继续" instruction covering the additive I2 schema increment).

## Connection check

- `nurture-postgres` (postgres:16-alpine) running; `prisma migrate status`
  reachable through `run-with-local-env`.

## Pre-existing failure repaired first

`prisma migrate status` reported `20260805090000_t007_publication_policy_provider`
as FAILED — three attempts from 2026-08-06, every one at
`applied_steps_count = 0` (verified in `_prisma_migrations`; none of the
migration's objects existed). Root cause: the migration's data gate found
627 `nurture_publish_process` rows carrying a partial seven-field schedule —
local test debris from pre-T-007 suites; the G3 requalification never hit
this because it ran on a fresh database.

Repair (local dev data only):

1. `UPDATE nurture_publish_process SET <seven schedule fields> = NULL WHERE
   num_nonnulls(<seven fields>) NOT IN (0, 7);` → 627 rows to the legal
   all-NULL state (the migration's own invariant; no policy version was
   invented, matching the gate's intent).
2. Preceding checks confirmed zero `released`-without-frozen-revision rows
   and zero full-but-invalid schedules — the partial rows were the only
   blocker.
3. `prisma migrate resolve --rolled-back` for each failed attempt row, then
   `pnpm db:deploy` → migration 16/16 applied cleanly.

## Diff preview and plan

- New enums: `NurtureFamilyGrowthEventKind`, `NurtureFamilyGrowthDeliveryState`,
  `NurtureFamilyGrowthReceiptStatus`.
- New tables: `nurture_family_growth_outbox_event`,
  `nurture_family_growth_admission_receipt`.
- New column: `nurture_media_asset_ref.content_digest` CHAR(64) NULL.
- Hand-authored (beyond Prisma's diff): partial unique
  `uq_nurture_family_growth_outbox_release_once` (one `released` event per
  release), `ck_..._outbox_kind_source` (released ↔ no visibility event),
  digest-format CHECKs on outbox payload digest and media content digest,
  `ck_..._receipt_companions` (per-status companion refs mirroring the
  frozen receipt schema).
- Destructive operations: none; fully additive. Rollback: drop the two
  tables, three enums, one column, one constraint.

## Execution log

1. `prisma migrate diff --from-schema-datasource … --to-schema-datamodel …`
   → base SQL for `20260807080000_t009_family_growth_provider_outbox`.
2. Hand-appended the constraints above; `pnpm db:deploy` → 17/17 applied.
3. `prisma migrate diff` re-run → "empty migration" (zero drift).
4. `pnpm db:generate` regenerated the client.

## Post-verify

- `pnpm db:validate` valid; `prisma migrate status` up to date.
- `pnpm db:context` refreshed `docs/context/db/schema.json`.
- `pnpm db:assert-boundary` → tables 63 / enums 93 (from 61 / 90).
- `pnpm test:db` → 23 files / 238 tests green, including the new
  `t009-family-growth-outbox` and `t009-family-growth-binding` suites.
