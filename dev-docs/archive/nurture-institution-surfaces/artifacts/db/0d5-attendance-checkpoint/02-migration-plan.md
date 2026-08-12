# Migration Plan — 0D-1 Attendance Checkpoint

1. Confirm the exact target database is absent, then create it empty.
2. Force the child-process `DATABASE_URL` pathname to that exact database and
   validate local host/port.
3. Run `prisma migrate deploy` for the complete 27-migration history.
4. Probe the new real row and database constraints.
5. Run the exact-owner integration suite, then the full production-DB lane.
6. Confirm migration status, drop only the exact target and confirm absence.

The migration is additive. Rollback in this empty disposable target is target
deletion. No down migration or backup is needed; a durable rollout remains
unauthorized.
