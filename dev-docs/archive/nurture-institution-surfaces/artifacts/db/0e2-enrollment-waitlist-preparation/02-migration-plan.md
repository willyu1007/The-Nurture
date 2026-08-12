# Migration Plan — 0E-2 Waitlist and Trial Preparation

1. Confirm the exact diff and qualification database names are absent; create
   only those local disposable targets.
2. Generate/review the migration against the diff shadow, then destroy it.
3. Apply the complete versioned history to the empty qualification target with
   `prisma migrate deploy`; never use `db push`.
4. Run inquiry regression plus the waitlist/preparation production-DB cases,
   including policy pinning, privacy, explicit expiry, cancellation and true
   concurrent acceptance.
5. Run the complete production-DB lane and all non-build structural gates.
6. Prove migration status current, datasource-to-Prisma SSOT zero drift and
   refresh the generated DB context.
7. Confirm zero sessions, drop only the exact qualification database and
   confirm it is absent.

Rollback is deletion of only the empty disposable targets. This plan does not
authorize a durable/shared apply, public capability, deployment, activation or
traffic.
