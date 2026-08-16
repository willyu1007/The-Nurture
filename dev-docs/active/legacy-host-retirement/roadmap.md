# T-012 Legacy Host Retirement — Roadmap

## Goal

- Make the production-intended Nurture scenario service the obvious default local runtime while retaining the Fastify workflow harness only as an explicitly named, bounded legacy test tool with a concrete deletion gate.

## Planning-mode context and merge policy

- Runtime mode signal: Default
- User confirmation when signal is unknown: not-needed
- Host plan artifact path(s): (none)
- Requirements baseline: current user instruction, repository ownership contract, and inspected runtime/package documentation
- Merge method: set-union
- Conflict precedence: latest user-confirmed > repository contracts > model inference
- Repository SSOT output: `dev-docs/active/legacy-host-retirement/roadmap.md`
- Mode fallback used: non-Plan default applied: no

## Input sources and usage

| Source | Path/reference | Used for | Trust level | Notes |
| --- | --- | --- | --- | --- |
| User-confirmed instructions | current task | close all architecture gaps in the recommended order | highest | This is phase four of the agreed dual-repository improvement sequence. |
| Repository ownership contract | `AGENTS.md` | My-Chat host and Nurture scenario boundaries | high | The legacy harness must not appear production-intended. |
| Runtime documentation and scripts | root package, `apps/backend`, `apps/scenario-service` | current entrypoint and naming inventory | high | The root `dev` script currently selects the Fastify harness. |
| Model inference | N/A | smallest reversible naming and documentation changes | lowest | No new runtime or plugin system is introduced. |

## Non-goals

- Delete the legacy harness before its focused workflow-runtime tests have a replacement.
- Change scenario contracts, business logic, database schemas, deployment state, capability gates, or traffic.
- Move My-Chat host-runtime code into The-Nurture.

## Open questions and assumptions

### Open questions

- None. The repository identifies the NestJS scenario service as production-intended and the Fastify app as local/test-only.

### Assumptions

- The legacy harness remains temporarily necessary for its isolated workflow-runtime test population; removing semantic ambiguity does not require deleting that evidence in this phase (risk: low).

## Merge decisions and conflict log

| ID | Topic | Conflicting inputs | Chosen decision | Precedence reason | Follow-up |
| --- | --- | --- | --- | --- | --- |
| C1 | Default local runtime | root `dev` selects Fastify; architecture docs identify NestJS as production-intended | Select the scenario service for root `dev` | Repository ownership contract | Verify script and docs agree. |
| C2 | Harness lifetime | cleanup goal vs focused legacy test coverage | Retain only an explicit legacy command and deletion gate | Smallest safe model | Remove once replacement criteria are met. |

## Scope and impact

- Affected areas/modules: root scripts, legacy harness package identity, CI/test routing names, maintained local-run documentation, frontend connection hint.
- External interfaces/APIs: none.
- Data/storage impact: none; both Prisma streams and migrations remain unchanged.
- Backward compatibility: the old implicit `pnpm dev` behavior is intentionally removed; explicit legacy commands remain available.

## Consistency baseline for dual artifacts

- [x] Goal matches the agreed dual-repository architecture review.
- [x] Boundaries preserve My-Chat host ownership and Nurture scenario ownership.
- [x] Phase ordering follows the recommended implementation sequence.
- [x] Acceptance requires no ambiguous or duplicate runtime entrypoint.
- Intentional divergences: none.

## Project structure change preview (may be empty)

### Existing areas likely to change

- Modify:
  - root package scripts and CI routing
  - `apps/backend/` package metadata and documentation
  - `apps/scenario-service/` documentation
  - maintained frontend/local-development guidance
- Delete:
  - obsolete script aliases and stale instructions only
- Move/Rename:
  - no directory move; package/script identity becomes explicitly legacy

### New additions

- New module(s): (none)
- New interface(s)/API(s): (none)
- New file(s): task documentation only

## Phases

1. **Entrypoint correction**
   - Deliverable: root `pnpm dev` launches the production-intended scenario service; the harness is reachable only through an explicit legacy command.
   - Acceptance criteria: static inspection and focused startup-script checks show one normal entrypoint.
2. **Semantic convergence**
   - Deliverable: scripts, CI labels, package metadata and maintained documentation consistently call the Fastify app a legacy harness.
   - Acceptance criteria: no maintained source or configuration recommends the legacy package as the normal backend.
3. **Quality and deletion gate**
   - Deliverable: focused and repository gates pass, unnecessary aliases are removed, and the harness README defines exact retirement conditions.
   - Acceptance criteria: typecheck, lint, test routing and persistence/port boundary checks pass with no behavior or schema drift.

## Step-by-step plan (phased)

### Phase 0 — Discovery

- Objective: inventory current runtime, test, CI and documentation references.
- Deliverables: bounded reference list and retained-test rationale.
- Verification: all maintained references are classified as normal runtime, legacy harness, or historical evidence.
- Rollback: N/A.

### Phase 1 — Entrypoint correction

- Objective: make the scenario service the sole default development runtime.
- Deliverables: root script switch and explicit legacy harness command.
- Verification: package script inspection plus scenario-service typecheck/tests.
- Rollback: revert the phase commit.

### Phase 2 — Semantic convergence

- Objective: remove ambiguous `backend`/`dev-host` command and guidance semantics from maintained surfaces.
- Deliverables: one legacy naming family across package scripts, CI and live documentation.
- Verification: repository scans and existing test-routing checks.
- Rollback: revert the phase commit; no persisted data changes exist.

### Phase 3 — Quality and closure

- Objective: prove boundaries and document the final deletion condition.
- Deliverables: verification evidence, cleanup record and independent commit.
- Verification: typecheck, lint, relevant unit/service/harness suites, persistence boundary, port topology, governance and docs lint.
- Rollback: revert source/config commit; runtime gates and databases are unchanged.

## Verification and acceptance criteria

- Build/typecheck: `pnpm typecheck` and package-specific TypeScript checks; no production build is required for this configuration-only change.
- Automated tests: scenario-service suite, legacy harness suite, test routing, persistence boundary and port topology.
- Manual checks: inspect resolved package scripts and confirm all default-off capability semantics are unchanged.
- Acceptance criteria:
  - `pnpm dev` targets `@the-nurture/scenario-service`.
  - No root alias presents the Fastify harness as the normal backend.
  - Legacy tests and database tools are explicitly namespaced and still pass.
  - Maintained docs identify My-Chat as host owner and the NestJS service as Nurture ingress.
  - The harness has a precise removal gate rather than an indefinite compatibility promise.

## Risks and mitigations

| Risk | Likelihood | Impact | Mitigation | Detection | Rollback |
| --- | ---: | ---: | --- | --- | --- |
| Developers rely on old implicit harness startup | medium | low | explicit `dev:legacy-host` command and migration note | script/docs scan | revert commit |
| Rename misses CI or test census references | medium | medium | exhaustive maintained-reference scan and test-routing gate | CI/local verification | restore exact reference |
| Harness deletion happens prematurely | low | high | retain focused suite and publish deletion conditions | test population and README review | keep legacy package |

## Optional detailed documentation layout (convention)

```text
dev-docs/active/legacy-host-retirement/
  roadmap.md
  00-overview.md
  01-plan.md
  02-architecture.md
  03-implementation-notes.md
  04-verification.md
  05-pitfalls.md
```

## To-dos

- [x] Confirm planning-mode signal handling and input precedence.
- [x] Confirm scope, non-goals and phase order from inspected repository evidence.
- [x] Confirm verification and rollback strategy.
- [ ] Complete the detailed task bundle and implementation.
