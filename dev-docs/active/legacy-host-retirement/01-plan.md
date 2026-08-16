# T-012 execution plan

## Phase 1 — Correct the normal entrypoint

- [x] Point root `dev` at the scenario service.
- [x] Add one explicit `dev:legacy-host` escape hatch.
- [x] Independently verify script resolution and scenario-service quality.
- [x] Commit the phase with `Task: T-012`.

## Phase 2 — Converge maintained semantics

- [x] Rename root harness test/database/verification scripts to a single
      `legacy-host` namespace; keep no compatibility aliases.
- [x] Rename the workspace package identity from generic `backend` to explicit
      legacy-host wording if repository references remain bounded.
- [x] Update CI and maintained source/documentation references.
- [x] Leave archived task evidence unchanged.
- [x] Independently verify routing, type safety and boundary checks.
- [x] Commit the phase with `Task: T-012`.

## Phase 3 — Quality closure and deletion gate

- [ ] Run focused service and legacy suites, aggregate typecheck/lint and
      persistence/port/test-routing gates.
- [ ] Scan for ambiguous normal-runtime instructions, duplicate aliases,
      stale package filters and unneeded artifacts.
- [ ] Document exact deletion prerequisites for the legacy harness.
- [ ] Record evidence and close the task without claiming deployment.

## Rollback

Every source/configuration phase is reversible by its independent commit. No
database or environment mutation is part of this task.
