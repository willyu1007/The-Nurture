# Post-verify — G4-D I3 enrollment-journey owner qualification

| Check | Result |
| --- | --- |
| Prisma SSOT validation | PASS — repo-prisma, 39 migrations |
| Empty deploy | PASS — 39/39 on the exact disposable target |
| I3 targeted PostgreSQL suite | PASS — 3/3 in final form: prepare/verify/transactional-consume + exact replay; dedup, reuse-conflict and DR-E7-01 expiry scrub; prospective-contact binding with Host-owner version-drift denial |
| Transactional consume (record 63/86) | PASS — consumeExact executed inside the advisory-locked Serializable command transaction via `transaction.enrollmentPreparedCommands` |
| Full production DB lane | PASS — 403/403 across 46 files |
| Datasource-to-datamodel drift | NONE — empty diff |
| Unit lane | PASS — 1027/1027 across 96 files |
| Typecheck / prisma validate | PASS — 0 errors |
| Test routing census | PASS — 172 files, exact counts |
| Formal ingress census | PASS — routes=7, registered=65, unrouted=32 |
| C30-I3 default-off census | PASS — 9 trusted handlers, all activation counters zero |
| G3-0 freeze census | PASS — new tables declared against the no-board-row claim |
| Generated manifest | CURRENT |
| Workflow-contract pin | PASS — self-pin `6767f609…` (290 files) |
| Defects repaired before any durable apply | 1 — `DR-I3-01` workflow_run_ref namespace (fixed in composition; caught only on real PostgreSQL) |
| Disposable cleanup | PASS — container destroyed, survivors `0` |
| Shared/persistent DB effect | NONE |
| Public capability / route / traffic | NONE — everything stays default-off |
