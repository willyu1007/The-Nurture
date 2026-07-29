# X4-A Handoff Replay-Seed Migration Plan

## Rollout target and strategy

1. Create or select a disposable local PostgreSQL database separate from `localhost:5433/nurture`.
2. Confirm the redacted target identity and verify migration status.
3. Apply the full migration history with `prisma migrate deploy`.
4. Run production-boundary inspection and the DB/E2E suite, including the new non-empty replay-seed journey.
5. Verify the final constraint, explicit-empty compatibility, canonical driver persistence, same-Step reclaim, wrong-Step denial, and absence of claim secrets.
6. Refresh DB context only if the Prisma SSOT shape changed; X4-A currently changes a custom CHECK only, so generated model/table context is expected to remain unchanged.

`prisma db push` is not an acceptable substitute because it cannot represent the custom replay-state CHECK and would create a schema-history split.

## Approval checkpoint

Before any database write, obtain explicit approval for:

- target: disposable local development PostgreSQL database;
- allowed change: versioned migration apply only, with no destructive data operation;
- risk posture: disposable target, so no backup required;
- strategy: `prisma migrate deploy`, followed by DB/E2E verification.

Applying to the existing `localhost:5433/nurture` database requires a separate explicit decision plus backup/snapshot readiness or explicit risk acceptance.

## Failure and rollback posture

- Before application: delete/rework the uncommitted migration if review finds a defect.
- During disposable apply: discard and recreate the disposable database, then repair the migration.
- After a real environment contains non-empty seeds: do not restore the N1 explicit-empty constraint. Roll back activation by disabling the My-Chat capability/manifest path while preserving committed Nurture business facts and replay seeds; repair schema forward with a new migration.
- A failed constraint validation blocks the migration and X4-B/X4-C activation. It must not be bypassed with `db push` or manual constraint removal.

## Pending execution evidence

Approval was granted and this plan was executed against the disposable target. See `03-execution-log.md` and `04-post-verify.md`; the plan remains the historical pre-apply contract.

## 2026-07-28 — Wave 4 P2 migration plan

This plan is not authorized for execution yet.

1. Freeze the exact My-Chat and Nurture source revisions and migration
   checksum.
2. Select a new disposable target for fresh-apply and supported-baseline
   upgrade proof; do not reuse the earlier X4 approval.
3. Before any non-disposable target, record exact non-null `birth_date` row
   counts without exporting values and obtain the owner-approved retention,
   deletion, backup, and rollback decision.
4. Apply the full ordered migration history with `prisma migrate deploy`.
5. Verify all five P2 tables, enums, indexes, composite FKs, CHECK constraints,
   and schema-context parity.
6. Prove new non-null birth-date insert/update denial, preservation of
   historical rows plus unrelated historical-row updates during the
   trigger-protected phase, exact Child/Family replay, stale/revoked denial,
   active Family-to-current Child dependency, revoked-history replacement, and
   rollback-by-disable without cross-owner deletion.
7. Keep every consumer/default capability false and active Scenario rows empty
   after disposable proof.

Rollback is forward-only. Disable receipt consumption first, preserve
authorization and local scenario evidence, mark local anchors
revoked/quarantined through a separately reviewed owner command, and repair
schema with a later migration. Never delete My-Chat facts or use `db push`.
