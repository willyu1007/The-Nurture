# Execution Log — 0D-3 Content Revision

## Apply

Two connection-check attempts stopped before any write because the PostgreSQL
CLI does not accept Prisma's `schema` URL parameter and because the selected
`psql -c` mode did not interpolate the proposed variable. The corrected guard
removed `schema` only from the CLI URL, used the already validated literal
database name and left the Prisma URL intact.

The maintenance connection confirmed that
`nurture_t007_content_revision_20260809_2115_b0aaf918` did not exist. It then
created that exact database, confirmed zero user tables and ran
`prisma migrate deploy --schema prisma/schema.prisma`. All 28 migrations were
applied, including `20260809230000_g4c_content_revision_downscope`.
Credentials are not recorded.

## Qualification

- Post-review rerun recreated the same exact empty disposable target, applied
  all 28 migrations, then qualified the corrected repository paths again.
- 0D-3 plus replaced 0D-2 write-path regression: 22/22 PASS across 2 files.
- Full `vitest.db.config.ts` lane: 370/370 PASS across 38 files.
- PostgreSQL rejected an invalid subject lane, blank reason, non-SHA-256
  request hash and a non-contiguous successor even when writes bypassed the
  command service.
- PostgreSQL rejected updates and deletes of an existing revision.
- Concurrent writers produced one revision and one placement-head advance.
- The revision adapter accepted only the single effective schedule's slots;
  lower-precedence layers were not merged into the owner result.
- A stale automatic write could not overwrite a concurrent Admin placement.
- Exact replay returned the original committed result; changed-payload reuse
  returned an idempotency conflict.
- Final `prisma migrate status`: schema up to date, 28 migrations found.

## Destruction

After each qualification cycle, the maintenance connection observed zero
target sessions, dropped only the exact disposable database and confirmed its
database count was `0` afterward. The final state is absent.
