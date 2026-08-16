# T-012 verification

## Planned gates

| Area | Command/evidence | Status |
| --- | --- | --- |
| Entrypoint | root/package workspace script resolution assertion | PASS — normal entry resolves only to `@the-nurture/scenario-service`; legacy escape hatch resolves only to `@the-nurture/backend` |
| Type safety | `pnpm --filter @the-nurture/scenario-service typecheck` | PASS |
| Lint | `pnpm lint` | pending |
| Scenario ingress | `pnpm test:scenario-service` | PASS — 27 files / 209 tests |
| Legacy evidence | renamed legacy-host suite | pending |
| Test ownership | `pnpm verify:test-routing` | pending |
| Persistence | `pnpm verify:persistence-boundaries` | pending |
| Ports | `pnpm verify:port-topology` | pending |
| Governance | project sync/lint | pending |
| Documentation | `node .ai/scripts/lint-docs.mjs` | pending |

## Exit evidence

Not yet recorded. No deployment, database migration, gate change or traffic is
authorized by this task.

## Phase 1 evidence

The script assertion, scenario-service typecheck and complete scenario-service
suite passed after the entrypoint correction. No default-off flag, port,
contract or persistence file changed.
