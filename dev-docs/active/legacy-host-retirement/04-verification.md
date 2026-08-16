# T-012 verification

## Planned gates

| Area | Command/evidence | Status |
| --- | --- | --- |
| Entrypoint | root/package workspace script resolution assertion | PASS — normal entry resolves only to `@the-nurture/scenario-service`; legacy escape hatch resolves only to `@the-nurture/legacy-host` |
| Type safety | root and affected workspace typechecks | PASS |
| Lint | root pin-aware lint plus frontend ESLint + Stylelint | PASS |
| Scenario ingress | `pnpm test:scenario-service` | PASS — 27 files / 209 tests |
| Legacy evidence | `pnpm test:legacy-host` on fresh disposable PostgreSQL | PASS — 11 files / 27 tests |
| Test ownership | `pnpm verify:test-routing` | PASS — 211 files: 105 unit / 60 production DB / 11 legacy host / 30 scenario service / 5 x5 joint |
| Persistence | source gate plus both empty-database boundaries | PASS — Nurture 44 migrations, 105 tables / 127 enums; legacy 1 migration, 6 tables / 2 enums |
| Ports | `pnpm verify:port-topology` | PASS — scenario 8000 / legacy host 3001 / workbench endpoint 3200 / frontend 3201 |
| Production DB | fresh 44-migration target + `pnpm test:db` | PASS — 60 files / 506 tests |
| Scenario-service DB | same fresh Nurture target + `pnpm test:scenario-service:db` | PASS — 3 files / 68 tests |
| Cross-owner x5 | fresh exact Nurture/My-Chat pair + `pnpm test:x5` | PASS — 5 files / 37 tests |
| Governance | project sync/lint | PASS |
| Documentation | `node .ai/scripts/lint-docs.mjs` | PASS — 718 files, zero warnings/errors |

## Exit evidence

T-012 is source-complete and independently revertible through commits
`3b38d67`, `e46fcea`, `b53a9b3`, `ce38d32`, `55cff47` and `b18342e`. The final
disposable database contained only synthetic test data and was destroyed. No
deployment, durable migration, gate change or traffic is authorized by this task.

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
- `pnpm reseal:pins lock`: PASS — owner-adoption lock minted at exact Nurture
  source `b53a9b3`; `pnpm verify:c30-i3-owner-adoption` passes with source hash
  `7ec001bda63187555f31e4b98b253f9b5a31de414b64ad05f5e916e088fbb040`.

## Post-CI source re-adoption evidence

- My-Chat post-correction source: exact revision `c11b8d199b1514a09c51eb1ae0c52ec478f8acbf`.
- `pnpm verify:workflow-contract-pin`, `pnpm verify:g2-exit-contract` and clean-
  worktree `pnpm verify:c30-i3-upstream`: PASS.
- Reseal and workflow-pin test scripts: 10/10 PASS; all changed scripts also pass
  Node syntax checks and `git diff --check`.
- Exact-revision commit: `55cff47`; independent owner-lock commit: `b18342e`.
- `pnpm verify:c30-i3-owner-adoption`: PASS with final source hash
  `20e91f71c7f9d040ea89552f0bf447adbc5c62595da46abf664bb437fc754179`.
- `RESEAL_MY_CHAT_ROOT=<clean-worktree> pnpm reseal:pins plan`: PASS — every pin,
  lock and literal is current.
