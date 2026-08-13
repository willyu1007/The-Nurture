# T-011 W5 N3 migration plan

- Migration:
  `prisma/migrations/20260813120000_t011_family_growth_outbox_scope/`
- Status: qualified on the approved loopback disposable database
  `t011_n3_disposable_20260813b`; no durable/environment apply is authorized.

## Approval boundary

1. This task authorizes no durable, staging, production, or shared-database
   apply. The completed qualification was disposable only.
2. The runner cannot prove that a loopback URL terminates at local Docker. The
   operator approval repeats the literal database name and binds the SHA-256
   digest of the exact target URL; URL loopback filtering plus the server-side
   private-address assertion are defense-in-depth only, including against
   tunnel mistakes. Prisma CLI reasserts database/schema/server identity with
   the exact connection string immediately before every migration invocation.
   The database must contain no relations, sequences, routines, domains,
   enums, or non-default extensions before phase A.
3. Any durable/environment apply requires a separate named-target approval
   after review of the disposable qualification evidence.

## Forward shape

- Create four additive composite unique indexes.
- Add three named composite foreign keys.
- Retain all original id-only unique/FK constraints.
- Perform no data backfill or row mutation.
- Execute inside an explicit PostgreSQL transaction so a populated-data FK
  validation failure leaves none of the new indexes or constraints installed.

## Lock behavior

- The four ordinary (non-`CONCURRENTLY`) unique-index builds scan their source
  tables and take the normal blocking locks required by PostgreSQL index
  creation. The three immediately validated foreign keys also scan populated
  rows and take relation locks while validation completes.
- This is acceptable for the currently bounded provider-outbox population: the
  table is not yet activated, the qualified deployment remains default-off,
  and the expected row count is small enough to keep one atomic migration more
  valuable than a multi-step invalid-index/validate-constraint rollout.
- Before any later durable apply, operators must census the real row counts and
  lock budget. If that assumption no longer holds, replace this preview with a
  separately reviewed staged migration; do not silently weaken validation.

## Disposable qualification checklist

- Phase A: replay the complete Prisma migration history from empty and run the
  positive control plus the three negative scope/lineage probes.
- Phase B1: migrate only through the previous head, seed coherent legacy rows
  that satisfy every existing CHECK, apply only T-011, and verify all new FKs
  are validated against the populated rows.
- Phase B2: reset to the previous head, seed one otherwise-valid cross-scope
  legacy row, execute the migration's exact failing `ADD CONSTRAINT` in a
  rollback-only transaction and capture SQLSTATE `23503`, then require T-011
  to abort. Record PASS only when both cause evidence and post-state absence
  prove no T-011 index/constraint survived.
- Confirm a correctly scoped outbox event and receipt are accepted.
- Reject an outbox row whose workspace differs from its release workspace.
- Reject a lifecycle outbox row whose visibility event belongs to another
  release in the same workspace.
- Reject a receipt whose workspace differs from its outbox workspace.
- Remove all synthetic business rows and prove the residual census is zero.
- Run only through the guarded runner with
  `NURTURE_T011_N3_DATABASE_URL` and
  `I_APPROVE_T011_N3_DISPOSABLE_WRITES=<database-name>:sha256(<exact URL bytes>)`
  as printed by the runner's safety error. A constant/shared approval phrase
  or a digest without the literal database name is invalid.

## Rollback posture

Disposable targets are destroyed rather than rolled back. If a future durable
apply needs reversal, it must be separately reviewed; the three composite FKs
and four supporting uniques are the only new objects. Removing them weakens
tenant/lineage protection and is not part of this task.
