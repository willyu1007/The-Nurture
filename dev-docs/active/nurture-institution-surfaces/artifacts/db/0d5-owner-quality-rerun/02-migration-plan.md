# Migration Plan — 0D-5 Owner Quality Rerun

1. Create the exact empty disposable database.
2. Rewrite `DATABASE_URL` inside the child process to that exact pathname and
   validate local host/port.
3. Run `prisma migrate deploy` for the existing 26-migration history.
4. Run the targeted exact-owner suite and full production-DB lane.
5. Confirm `prisma migrate status` is current and no target sessions remain.
6. Drop only the exact database and confirm absence.

Expected destructive operation: final deletion of the disposable database.
No rollback or backup is required because the target begins empty and contains
test fixtures only.
