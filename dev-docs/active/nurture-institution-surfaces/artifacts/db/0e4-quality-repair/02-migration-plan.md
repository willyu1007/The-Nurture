# Migration Plan — 0E-4 Quality Repair

1. Create only `nurture_g4d_i5_quality_20260810_1218` after proving it is
   absent; never use the configured default or a shared database.
2. Apply all versioned migrations from empty with `prisma migrate deploy`.
3. Run the targeted 0E-4 DB file, including pre-start refusal, timely
   acceptance after proposal expiry, and competing-command serialization.
4. Run the complete production DB lane.
5. Verify migration status and an empty datasource-to-Prisma diff.
6. Refresh the generated DB context contract.
7. Drop only the exact disposable target and confirm absence.
8. If final review broadens the serialization fix to sibling enrollment
   owners, replay all migrations and the targeted file on a second explicitly
   named disposable target, then destroy it under the same rules.

Rollback is destruction of that exact disposable database. This plan does not
authorize durable migration, capability registration, deployment, activation,
or traffic.
