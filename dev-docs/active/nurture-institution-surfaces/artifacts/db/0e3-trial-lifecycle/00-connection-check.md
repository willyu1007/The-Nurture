# Connection Check — 0E-3 Trial Lifecycle

- Date: 2026-08-10
- SSOT mode: `repo-prisma`
- Direction: code to database through a versioned Prisma migration
- Dialect / endpoint: PostgreSQL at `localhost:5433`
- Diff target: `nurture_g4d_i4_diff_20260810`
- Qualification target: `nurture_g4d_i4_trial_20260810`
- Approval: prior explicit user approval for the recommended disposable DB
  operations, followed by the instruction to continue the recorded plan
- Durable/shared target effect: none
- Secrets recorded: none

The configured `nurture` database was used only to derive the local endpoint;
it was never migrated or queried for qualification data. Target URLs were
constructed inside child processes and were not printed. Both exact disposable
targets were dropped successfully without `FORCE`, then confirmed absent.
