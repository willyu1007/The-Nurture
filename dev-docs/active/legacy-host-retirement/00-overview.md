# T-012 Legacy host retirement

## Status

- State: in-progress
- Updated: 2026-08-16
- Current phase: entrypoint correction

## Goal

Make the production-intended NestJS scenario service the sole normal Nurture
development runtime. Retain the Fastify workflow harness only as an explicitly
named legacy test tool until its focused evidence has a replacement.

## Scope

- Change the root `dev` entrypoint to `@the-nurture/scenario-service`.
- Rename maintained harness scripts, CI labels and package metadata to one
  explicit legacy vocabulary.
- Correct live developer guidance that still recommends the harness.
- Preserve the separate legacy database and focused tests until the documented
  deletion gate is satisfied.

## Non-goals

- No scenario contract, API body, business rule or Prisma schema change.
- No deployment, migration, gate activation or traffic authorization.
- No My-Chat runtime copy and no dynamic plugin/remote-UI machinery.
- No deletion of historical archived task evidence.

## Acceptance criteria

- [ ] Root `pnpm dev` selects the scenario service.
- [ ] The Fastify application is accessible only through explicitly legacy
      scripts and is never described as a normal backend.
- [ ] CI/test routing and maintained docs use one vocabulary without aliases.
- [ ] The legacy harness retains focused boundary tests and has an exact
      removal gate.
- [ ] Typecheck, lint, relevant suites, ownership/persistence gates,
      governance and documentation lint pass.
- [ ] No unrelated feature or schema changes are included.

## Ownership decision

My-Chat owns the user-facing shell, canonical identity and shared workflow
runtime. The-Nurture owns its scenario service, scenario logic and local data.
The legacy Fastify app is neither a second product backend nor a deployable
host; it is temporary local test infrastructure.
