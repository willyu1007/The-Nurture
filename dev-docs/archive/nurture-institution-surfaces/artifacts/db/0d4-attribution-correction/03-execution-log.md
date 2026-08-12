# Execution Log — 0D-4 Attribution Correction

## Apply

The maintenance connection confirmed that
`nurture_t007_attribution_correction_20260809_2211_4d7e145c` was absent. It
created only that exact database, confirmed zero user tables and ran
`prisma migrate deploy --schema prisma/schema.prisma`. All 29 migrations were
applied, including `20260810010000_g4c_attribution_correction_candidate`.
Credentials are not recorded.

## Qualification and repairs

The first targeted run found that two new DB adapters imported fresh runtime
exports through the checked-in `dist/harness` subpath. TypeScript saw current
source declarations, but Vitest loaded stale JavaScript: the intake constructor
and then the new zoned-instant function were absent. The adapters and shared
local-day helper now import the scenario package's source-backed root entry.
The attribution owner also gained a permanent exact-role fact assertion.

The first whole-schema diff then reported six rename-only changes for foreign
keys created by earlier hand-written migrations. Their physical constraints
were correct. Prisma relation `map` attributes now bind those exact names;
the final datasource-to-datamodel diff reports `No difference detected`.

- G-05 plus 0D-4 exact-owner suites: 7/7 PASS across 2 files.
- Full unit lane: 842/842 PASS across 76 files.
- Full production-DB lane: 377/377 PASS across 40 files.
- One parallel verification run observed a transient connection failure in an
  existing G2-A test. Isolated diagnosis produced three consecutive 6/6 passes,
  followed by another complete 377/377 DB pass; no reproducible code defect or
  behavior change was justified.
- Final `prisma migrate status`: schema up to date, 29 migrations found.
- Prisma validation, generated DB context, persistence boundary, formal
  ingress, port topology, test routing and the database feature suite passed.

## Destruction

The maintenance connection observed zero target sessions, dropped only the
exact disposable database and confirmed its database count was `0` afterward.
The final state is absent.
