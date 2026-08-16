# Legacy workflow test host

This Fastify application is a local-only legacy test harness for My-Chat
workflow-runtime contracts. It is not the Nurture backend: normal local
development runs `pnpm dev`, which starts the production-intended NestJS
scenario service.

Persistence is deliberately split:

- `DATABASE_URL` and the root Prisma client access only Nurture business facts.
- `DEV_HOST_DATABASE_URL` and `apps/backend/prisma` access only six `workflow_*` dev-host tables.

The dev-host schema is never a production deployment target and must not be copied into the root Prisma schema. Real host runtime ownership remains in My-Chat.

The executable is intentionally local-only: it binds to `127.0.0.1` and refuses to start unless `APP_ENV` is `dev` or `test`. It has no production authentication boundary and must never be exposed through a shared ingress or deployed as a service.

Run it only through the explicit `pnpm dev:legacy-host` command. Its focused
suite is `pnpm test:legacy-host`; its private database commands use the
`legacy-host:db:*` namespace.

The harness listens on `DEV_HOST_PORT` with a default of `3001`. It deliberately
does not consume `PORT`; that key belongs exclusively to the formal NestJS
scenario service on `8000`. The Base-assigned local backend/frontend endpoints
remain `3200/3201` and may proxy to the appropriate local process.

## Removal gate

Delete this package once every unique workflow journey has equivalent
My-Chat-runtime or scenario-service owner-boundary coverage, CI and local
bootstrap no longer depend on its Prisma client/database, and the persistence
and port topology gates pass after removal. Until then it remains bounded test
infrastructure, not a compatibility runtime.
