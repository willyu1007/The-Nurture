# X4-C2 Isolated Migration Plan

1. Create only the two named empty Nurture databases in the approved disposable
   container.
2. Apply `prisma/migrations` only to `nurture_x4_validation`.
3. Apply `apps/backend/prisma/migrations` only to
   `nurture_dev_host_x4_validation`.
4. Verify migration status, datasource-to-schema drift, Prisma validity, and
   exact production/dev-host catalog boundaries.
5. Run the locked JSON population suites and privacy probes.
6. Complete My-Chat's separate database journey, then remove the container and
   anonymous data.

Failure policy: stop, repair the owning schema/code, recreate only the
disposable targets if necessary, and rerun the affected gate. Product rollback
is capability disablement, not deletion of Nurture business facts.
