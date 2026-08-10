# Migration Plan — G4-E I1 Qualification

1. Reconfirm the exact approved target is absent with zero sessions.
2. Create only
   `nurture_t007_g4e_i1_qualification_20260810_01` on `localhost:5433`.
3. Rewrite only the child-process `DATABASE_URL` pathname to that target and
   verify the parsed target identity without printing credentials.
4. Apply all 35 versioned migrations from empty with `prisma migrate deploy`;
   never use `db push` or mutate the configured default database.
5. Run the G4-E lifecycle/candidate PostgreSQL qualification and the complete
   production DB lane.
6. Require current migration status and an empty datasource-to-SSOT diff;
   refresh and strictly verify the generated DB context contract.
7. Confirm no remaining target sessions, drop only the exact disposable
   target, and confirm database and session counts return to zero.

Rollback is destruction of that exact disposable database. This qualification
does not authorize a shared/persistent migration, public capability, traffic,
deployment or owner-contract adoption.
