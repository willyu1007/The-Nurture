# Connection Check — 0E-4 Quality Repair

- Date: 2026-08-10
- SSOT mode: `repo-prisma`
- Direction: code to database through the existing versioned 0E-4 migration
- Dialect / endpoint: PostgreSQL at `localhost:5433`
- Qualification targets:
  - full qualification: `nurture_g4d_i5_quality_20260810_1218`
  - shared-classifier follow-up: `nurture_g4d_i5_quality_followup_20260810_1237`
  - final full regression: `nurture_g4d_i5_quality_full_20260810_1240`
- Approval: the user previously explicitly approved disposable DB operations
  for T-007 and now requested repair of every review finding
- Durable/shared target effect: none
- Secrets recorded: none

The configured `nurture` database is used only to derive the local endpoint.
Qualification replaces only the URL pathname inside child processes; the URL
is never printed. The exact target must be absent before creation and destroyed
after verification. All three exact targets satisfied that lifecycle.
