# Schema diff preview

- SSOT mode: `repo-prisma`
- Dialect: PostgreSQL
- New owner: `NurtureEnrollmentTrialGrantPolicy`
- Scope: one immutable exact-Institution policy row supplies the Nurture-owned
  trial Grant terms used by current-owner derivation.
- Destructive operations: NONE
- Existing table/column rewrites: NONE
- New constraints: exact v1 contract, bounded effective window, positive
  revision, fixed bidirectional order, bounded data-class/purpose arrays, one
  unsuperseded row per Institution, and update/delete immutability fences.
- Prisma migration-history-to-schema diff after adding
  `20260812200000_t007_trial_grant_policy`: `-- This is an empty migration.`
