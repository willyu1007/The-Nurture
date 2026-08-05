# G3 Exit Migration Plan

1. Start only `the-nurture-g3-exit-9e024de` on loopback port `55437` with tmpfs storage.
2. Build the pinned My-Chat workflow contracts and Nurture owner/runtime packages in
   the exact detached topology.
3. Generate the exact Nurture Prisma client without contacting another database.
4. Apply the complete versioned Nurture migration stream to the empty
   `nurture_g3_exit` database using `prisma migrate deploy`.
5. Verify migration status, production catalog boundary and schema drift.
6. Run production DB, provider, formal scenario-service owner/joint and G2-preservation
   census suites against the same disposable database.
7. Run final default-off/static gates and record the runtime evidence census.
8. Destroy the named container/tmpfs and prove port `55437` and the container name are absent.

Rollback for this local-only run is destruction of the disposable container. No
existing database is a rollback target and no backup is required for empty tmpfs data.
