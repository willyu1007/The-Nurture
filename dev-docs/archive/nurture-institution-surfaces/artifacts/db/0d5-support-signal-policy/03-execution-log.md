# Execution Log — 0D-5 Support-signal Policy

## Approved target

- Date: 2026-08-09
- Database: `nurture_t007_0d5_20260809_1132_a71c9e4d`
- Endpoint: local PostgreSQL at `localhost:5433`
- Initial state: newly created and empty
- Approval scope: disposable qualification only
- Secrets recorded: none

## Apply

The target URL was derived in a child process from the repository's local
environment and forcibly rewritten to the exact approved database name. The
command executed was equivalent to:

```sh
pnpm exec prisma migrate deploy --schema prisma/schema.prisma
```

Result: PASS. Prisma applied all 26 migrations from an empty database,
including
`20260809180000_g4b_institution_support_signal_policy`. No `db push`, shared
database apply or schema baseline shortcut was used.

## Qualification

- `prisma migrate status`: 26 migrations found; schema up to date.
- A real policy row was loaded through
  `PrismaInstitutionSupportSignalRepository.loadEffectivePolicies`.
- PostgreSQL rejected revision `0`, a threshold category without a threshold,
  an invalid effective window and a duplicate partial-unique policy revision.
- The final full production-DB lane passed 353/353 across 37 files.
- Exact-owner integration passed current role, opaque-ref, full-population,
  no-redaction-to-blocker and over-limit fail-closed cases.

## Destruction

After qualification, the maintenance connection verified the exact target
existed, found zero live target sessions, dropped only that database and then
verified `exists_after=false`. The disposable data is intentionally
unrecoverable. No shared or persistent database was modified by this apply.
