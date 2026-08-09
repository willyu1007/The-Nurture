# Migration Plan — 0E-1 Enrollment Journey Inquiry

After a new exact disposable PostgreSQL target is explicitly approved:

1. Confirm that exact database name is absent, create it empty and force the
   child process URL to that exact pathname.
2. Confirm the expected local endpoint and zero user tables without recording
   credentials.
3. Run the complete versioned migration history with `prisma migrate deploy`;
   do not use `db push`.
4. Run `g4d-enrollment-journey-inquiry.integration.test.ts`, then the complete
   production-DB lane.
5. Probe exact replay, single workflow-Run binding, head conflicts, cross-scope
   and wrong-actor writes, age-fact XOR, exact canonical/protected envelopes,
   native-source uniqueness, correction lineage, milestone/lifecycle/cumulative
   transition validity, command-shaped one-head/one-transition linkage and
   update/delete rejection.
6. Verify migration status and datasource-to-Prisma diff, then refresh/check
   the DB context contract.
7. Confirm zero sessions, drop only the exact disposable target and confirm it
   is absent.

Rollback for the empty disposable qualification target is deletion of only
that exact database. This plan authorizes no durable/shared apply, capability
registration, deployment, activation or traffic.
