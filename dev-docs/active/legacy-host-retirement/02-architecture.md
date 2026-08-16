# T-012 architecture

## Target runtime model

```text
normal local development
  -> root pnpm dev
  -> @the-nurture/scenario-service (NestJS)
  -> Nurture-owned API/service/repository ports

focused legacy verification only
  -> explicit legacy-host command or CI lane
  -> local-only Fastify harness
  -> private workflow test ledger
```

The scenario service is the only production-intended Nurture process. My-Chat
continues to own the shared workflow host, canonical identities, user-facing
routes and shell. A successful Nurture local process does not activate any
provider capability.

## Legacy harness constraints

- Bind only to loopback and refuse non-development/test environments.
- Keep its Prisma schema and database URL isolated from Nurture production
  persistence.
- Expose no shared ingress and make no deployment claim.
- Remain outside normal runtime instructions and commands.

## Removal gate

Delete the legacy harness only after all three conditions hold:

1. every focused workflow journey it uniquely tests has equivalent coverage
   in My-Chat-owned runtime tests or scenario-service owner-boundary tests;
2. CI, test routing and local database bootstrap have no dependency on its
   package, Prisma client or database;
3. persistence-boundary and port-topology gates prove its removal cannot move
   My-Chat workflow tables into Nurture production persistence.

Until then, the harness is retained as bounded test infrastructure, not as a
compatibility runtime track.
