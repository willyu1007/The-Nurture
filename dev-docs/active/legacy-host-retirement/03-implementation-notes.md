# T-012 implementation notes

## 2026-08-16 — Discovery

- Before phase 1, root `pnpm dev` built local binding/runtime packages and
  launched the then-named `@the-nurture/backend` Fastify harness.
- `apps/scenario-service` is already documented and packaged as the
  production-intended NestJS ingress.
- The harness has a separate Prisma schema, port and focused test population;
  immediate deletion would discard useful boundary evidence.
- Maintained ambiguity exists in root script names, CI output, workspace
  package identity and one frontend connection hint.

Decision: change the default first, then converge the remaining names without
preserving aliases. Keep the directory and focused evidence until the removal
gate in `02-architecture.md` is met.

## 2026-08-16 — Phase 1 entrypoint correction

- Root `pnpm dev` now loads the repository-local environment and delegates to
  `@the-nurture/scenario-service dev`; the package's existing `predev` remains
  the single runtime-dependency build owner.
- The previous Fastify command is available only as `pnpm dev:legacy-host`.
- No service configuration, provider gate, port, contract or database path
  changed.

## 2026-08-16 — Phase 2 semantic convergence

- The harness workspace is now `@the-nurture/legacy-host`; root commands,
  test artifacts and the CI lane use the same `legacy-host` namespace with no
  old aliases.
- The normal local setup generates and starts only the production Nurture
  schema/service. Full-repository verification still generates the isolated
  legacy client explicitly.
- The scenario-service and legacy-host READMEs now state their mutually
  exclusive roles and the exact harness deletion gate. The Next.js workbench
  identifies its fixture data source as legacy and points only to the explicit
  command.
- Stable isolation identifiers (`DEV_HOST_DATABASE_URL`, `DEV_HOST_PORT`, the
  `nurture_dev_host` database and generated-client directory) remain unchanged;
  renaming them would add configuration migration risk without reducing a
  runtime ownership ambiguity.

## 2026-08-16 — Phase 3 exact source adoption

- My-Chat T-044 is source-frozen at
  `9d385381fb6b2e9c7d4d44b3d9a3af55d1bf2f63`. A clean detached worktree is
  used for pin tooling so unrelated shared-worktree UI changes remain excluded.
- The first reseal stage rotates only the exact My-Chat revision, the Nurture
  scenario self hash and the three governed revision literals. My-Workflow-Base
  did not move and the My-Chat scenario-host adoption lock remained current.
- Workflow-contract pin, G2 exit, C30-I3 upstream and reseal-tool tests pass.
  The owner-adoption lock is intentionally minted only after this stage is a
  committed Nurture revision.
- After commit `b53a9b3`, the second reseal stage minted the owner-adoption lock
  against that exact source revision. The lock now binds My-Chat `9d38538`, the
  unchanged My-Chat runtime source revision/aggregate, and the updated Nurture
  manifest/cumulative source profiles without widening their file sets.

## 2026-08-16 — Final quality and cleanup

- Aggregate typecheck, root lint, 1144 unit tests, 209 scenario-service tests,
  all formal ingress validators and every affected static boundary gate pass.
- A second disposable pgvector/PostgreSQL 16 target replayed all 44 Nurture,
  one legacy-host and 47 My-Chat migrations from empty. Production DB,
  scenario-service DB, renamed legacy CI population and all five two-database
  joint files pass; the exact container was removed afterward.
- Maintained-source scans find no old public script alias, generic backend
  package filter, old Vitest/boundary filename, duplicate runtime instruction,
  dynamic plugin path or compatibility API-client export.
- No contract body, business rule, schema, provider gate, deployment, durable
  database or traffic state changed. T-012 has no remaining implementation
  issue; the bounded legacy harness is retained only until its documented
  deletion gate is satisfied.

## 2026-08-16 — Post-CI source re-adoption

- My-Chat's first remote run exposed a TypeScript workspace-source resolution
  defect in the new API-client entrypoints. My-Chat corrected it without changing
  public exports or scenario semantics and froze again at
  `c11b8d199b1514a09c51eb1ae0c52ec478f8acbf`.
- The-Nurture re-ran the same two-stage adoption protocol: exact pin/revision
  literals were committed first at `55cff47`, then the owner-adoption lock was
  minted from that committed source and committed independently at `b18342e`.
- Contract/source hashes and the My-Chat scenario-host adoption aggregate did not
  move because the packaging correction is outside those pinned populations.
  Only the exact repository revision and Nurture adoption profiles changed.
- The final plan reports every pin, lock and literal current. No runtime behavior,
  contract, schema, deployment, migration, gate or traffic state changed.
