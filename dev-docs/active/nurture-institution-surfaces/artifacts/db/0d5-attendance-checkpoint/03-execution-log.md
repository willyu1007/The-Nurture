# Execution Log — 0D-1 Attendance Checkpoint

## Apply

`prisma migrate deploy --schema prisma/schema.prisma` applied all 27 migrations
from an empty database, including
`20260809210000_g4b_attendance_checkpoint_policy`.

The child process forcibly replaced only the database pathname with
`nurture_t007_attendance_checkpoint_20260809_2045_f4c192a7` and validated the
local `localhost:5433` endpoint. Credentials are not recorded.

## Qualification

- Exact-owner integration: 12/12 PASS.
- Full `vitest.db.config.ts` lane: 360/360 PASS across 37 files.
- A real `17:30` policy reused the local-day owner's `Asia/Shanghai` timezone
  and resolved to the exact `09:30Z` class/date instant.
- PostgreSQL rejected revision `0`, local time `24:00`, a reversed effective
  window and an empty change reason.
- Two simultaneously effective revisions returned owner `unavailable` rather
  than choosing one.
- A policy first effective after the local day began did not retroactively
  create an earlier deadline.
- Final `prisma migrate status`: schema up to date, 27 migrations found.

## Destruction

The maintenance connection observed zero target sessions, dropped only the
exact disposable database and confirmed its database count was `0` afterward.
