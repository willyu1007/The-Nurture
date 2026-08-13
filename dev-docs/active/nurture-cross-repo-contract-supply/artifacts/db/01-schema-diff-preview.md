# T-011 W5 N3 schema diff preview

- Date: 2026-08-13
- Task: T-011 nurture-cross-repo-contract-supply, W5 ledger item N3
- Mode: reviewed and disposable-qualified. The migration passed the guarded
  three-phase disposable run on 2026-08-13 (from-empty replay, populated
  upgrade, pass-by-abort with SQLSTATE 23503 cause proof) on
  `t011_n3_disposable_20260813e`; the target was returned to empty and the
  container destroyed. No durable database is written and no existing data
  is backfilled; durable apply remains a separate, unauthorized decision.

## Additive diff

Composite FK target uniques:

- `uq_nurture_publication_release_workspace_id` on
  `nurture_publication_release(workspace_id, id)`.
- `uq_nurture_visibility_event_workspace_release_id` on
  `nurture_publication_visibility_event(workspace_id,
  publication_release_id, id)`.
- `uq_nurture_family_growth_outbox_workspace_id` on
  `nurture_family_growth_outbox_event(workspace_id, id)`.
- `uq_nurture_family_growth_outbox_workspace_visibility` on the outbox source
  tuple required for Prisma's one-to-one visibility relation. The existing
  global `visibility_event_id` unique remains in place.

Composite foreign keys:

- `fk_nurture_fg_outbox_workspace_release`: outbox
  `(workspace_id, publication_release_id)` → publication release
  `(workspace_id, id)`.
- `fk_nurture_fg_outbox_workspace_release_visibility`: outbox
  `(workspace_id, publication_release_id, visibility_event_id)` → visibility
  event `(workspace_id, publication_release_id, id)`. This binds a lifecycle
  event to the outbox row's exact release, not merely to an existing event ID.
- `fk_nurture_fg_receipt_workspace_outbox`: admission receipt
  `(workspace_id, outbox_event_id)` → outbox `(workspace_id, id)`.

## Safety review

- The migration contains only `CREATE UNIQUE INDEX` and `ADD CONSTRAINT`.
- It contains no `DROP`, column/type alteration, row update, insert, delete, or
  backfill.
- Existing single-column foreign keys remain. The new composite foreign keys
  are additional strictly stronger guards.
- Each target unique contains an existing globally unique `id`; consequently
  it cannot discover duplicate existing rows. Existing cross-scope rows, if
  any, would cause the new FK validation to fail rather than being rewritten.
- Default-off posture, runtime configuration, routes, and delivery activation
  are unchanged.

## Review evidence

- Static drift guard: `node scripts/assert-family-growth-outbox-invariants.mjs`.
- Disposable-only qualification vehicle:
  `artifacts/qualification/run-t011-n3-qualification.mjs`.
- Disposable qualification passed on `t011_n3_disposable_20260813b`; no
  durable/environment apply is performed in this increment.
