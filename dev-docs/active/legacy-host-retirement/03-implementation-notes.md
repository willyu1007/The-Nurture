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
