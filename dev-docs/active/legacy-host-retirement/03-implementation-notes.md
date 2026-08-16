# T-012 implementation notes

## 2026-08-16 — Discovery

- Root `pnpm dev` currently builds local binding/runtime packages and launches
  `@the-nurture/backend`, the Fastify harness.
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
