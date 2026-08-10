# Connection Check — G4-E I1 Qualification

- Date: 2026-08-10
- SSOT mode: `repo-prisma`
- Direction: code to database through the existing versioned migrations
- Approved environment: local disposable PostgreSQL only
- Client endpoint: `localhost:5433`
- PostgreSQL server identity: container address `172.21.0.2`, internal port
  `5432`, reached only through the approved local port mapping
- Configured default database: `nurture` (identity check only; never mutated)
- Exact disposable target:
  `nurture_t007_g4e_i1_qualification_20260810_01`
- Pre-write target database count: `0`
- Pre-write target session count: `0`
- Durable/shared target effect: none authorized
- Secrets recorded: none

The user explicitly approved operations on the exact disposable target. Any
endpoint, database name or lifecycle mismatch is a stop condition. The target
must be created from absence, qualified, destroyed and confirmed absent.
