# Backend dev host

This Fastify application is a local/test harness for the My-Chat workflow runtime contracts. It wires the Nurture scenario and production repositories to a backend-private workflow ledger so the MVP journeys can run end to end before real My-Chat adoption.

Persistence is deliberately split:

- `DATABASE_URL` and the root Prisma client access only Nurture business facts.
- `DEV_HOST_DATABASE_URL` and `apps/backend/prisma` access only six `workflow_*` dev-host tables.

The dev-host schema is never a production deployment target and must not be copied into the root Prisma schema. Real host runtime ownership remains in My-Chat.
