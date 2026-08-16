# T-012 verification

## Planned gates

| Area | Command/evidence | Status |
| --- | --- | --- |
| Entrypoint | root/package workspace script resolution assertion | PASS — normal entry resolves only to `@the-nurture/scenario-service`; legacy escape hatch resolves only to `@the-nurture/legacy-host` |
| Type safety | `pnpm --filter @the-nurture/scenario-service typecheck` | PASS |
| Lint | focused frontend ESLint + Stylelint | PASS |
| Scenario ingress | `pnpm test:scenario-service` | PASS — 27 files / 209 tests |
| Legacy evidence | `pnpm test:legacy-host` on fresh disposable PostgreSQL | PASS — 11 files / 27 tests |
| Test ownership | `pnpm verify:test-routing` | PASS — 211 files: 105 unit / 60 production DB / 11 legacy host / 30 scenario service / 5 x5 joint |
| Persistence | source gate plus both empty-database boundaries | PASS — Nurture 44 migrations, 105 tables / 127 enums; legacy 1 migration, 6 tables / 2 enums |
| Ports | `pnpm verify:port-topology` | PASS — scenario 8000 / legacy host 3001 / workbench endpoint 3200 / frontend 3201 |
| Governance | project sync/lint | pending |
| Documentation | `node .ai/scripts/lint-docs.mjs` | pending |

## Exit evidence

Not yet recorded. No deployment, database migration, gate change or traffic is
authorized by this task.

## Phase 1 evidence

The script assertion, scenario-service typecheck and complete scenario-service
suite passed after the entrypoint correction. No default-off flag, port,
contract or persistence file changed.

## Phase 2 evidence

- `@the-nurture/legacy-host` typecheck and Prisma schema validation passed.
- The first legacy E2E run used the pre-existing local database configuration:
  five non-persistent files passed and six persistent files returned masked
  500 responses because those databases were not migration-current.
- Reverification used a uniquely named disposable PostgreSQL 16 container on a
  random loopback port. Both migration streams applied from empty, both
  catalog boundaries matched, and all 27 legacy tests passed. The trap removed
  the container and post-run inspection confirmed it no longer existed.
- Focused frontend lint, test routing, persistence source isolation, port
  topology and maintained-reference scans passed. No old public command alias,
  `@the-nurture/backend` filter or old Vitest/assertion filename remains.

## Phase 3 source-adoption evidence

- `pnpm test:reseal-pins`: PASS — 3 tests.
- `pnpm verify:workflow-contract-pin`: PASS at exact My-Chat `9d38538`,
  unchanged Base `536638a`, contract parity and both source profiles.
- `pnpm verify:g2-exit-contract`: PASS; gates stay default-off and legacy
  activation is absent.
- `RESEAL_MY_CHAT_ROOT=<clean-worktree> pnpm verify:c30-i3-upstream`: PASS.
- My-Chat scenario-host adoption lock check: PASS, unchanged source aggregate.
