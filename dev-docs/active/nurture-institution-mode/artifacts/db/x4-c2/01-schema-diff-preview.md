# X4-C2 Schema Diff Preview

X4-C2 changes no Nurture production or dev-host Prisma model and creates no new
Nurture migration. The gate reapplies and verifies the existing streams:

- production: three Nurture-only migrations, 43 tables, 71 enums;
- dev-host: one backend-private Workflow migration, 6 tables, 2 enums.

The My-Chat notification idempotency migration is reviewed and applied only in
the separate `my_chat_x4_validation` database. It is never copied into either
Nurture migration stream.
