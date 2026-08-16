# T-012 Legacy host retirement

## Archive record

- State: archived
- Completed and archived: 2026-08-16
- Goal: make the NestJS scenario service the sole normal Nurture runtime while
  bounding the Fastify harness as temporary test infrastructure.

## Final outcome

- Root `pnpm dev` selects `@the-nurture/scenario-service`.
- The Fastify package, commands, CI lane, and maintained guidance use only the
  explicit `legacy-host` vocabulary; old aliases were removed.
- `DEV_HOST_*`, `nurture_dev_host`, and the generated-client path remain stable
  intentionally because they isolate test persistence and are not runtime roles.
- The final downstream source adoption pins My-Chat at
  `c11b8d199b1514a09c51eb1ae0c52ec478f8acbf`; owner-adoption source hash:
  `20e91f71c7f9d040ea89552f0bf447adbc5c62595da46abf664bb437fc754179`.

## Durable boundaries and deletion gate

My-Chat owns the user-facing shell, canonical identity, and shared workflow
runtime. The-Nurture owns its scenario service, logic, and local data. The
legacy host is not a deployable backend and may be deleted only when:

1. all journeys it uniquely tests have equivalent owner-boundary coverage;
2. CI/bootstrap no longer depends on its package, Prisma client, or database;
3. persistence and port gates pass after deletion.

Do not restore compatibility aliases, use an arbitrary developer database as
E2E evidence, or freeze a cross-repository pin before source-consumer CI passes.

## Completion commits

`3b38d67`, `e46fcea`, `b53a9b3`, `ce38d32`, `f0ac20d`, `55cff47`, `b18342e`,
and `95ea1ea`.

No contract body, schema, deployment, durable migration, gate, or traffic state
changed in T-012.
