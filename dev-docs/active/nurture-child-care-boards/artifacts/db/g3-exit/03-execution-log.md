# G3 Exit Execution Log

Status: `PASS` — executed 2026-08-05 and destroyed after verification.

## Exact topology and preparation

- My-Workflow-Base: `06303e9f404e4ccc0ba3054b763675efe81b5b15`
- My-Chat: `a0195662228a2fc6323b9ea0cd327d3608d8cc17`
- The-Nurture: `03740871de5582b30af9eff5111c84398a61f490`
- Base/My-Chat workflow-contract parity: 11 files,
  `8dd53be4ba392c6eb254c462066d9c7e65b239bc79142911de4ef58faf3da34d`
- Nurture runtime population: 168 files,
  `b44f4fad985bf760b0bf1a6c4abac8badd7e91ea7999d829bb1fabcd2dfbf8c0`

Frozen installs ran with lifecycle scripts disabled. The pinned My-Chat workflow
contracts and Nurture scenario/DB/scenario-service packages were built explicitly.
Prisma clients for Nurture, My-Chat and the Nurture dev-host schema were generated
with qualification-only, non-connecting configuration. No development server ran.

## Migration execution

The named `postgres:16-alpine` container was created on loopback port `55437` with
tmpfs storage. `prisma migrate deploy` replayed all 16 versioned Nurture migrations
from an empty `nurture_g3_requal` database. The final migration status was up to date.
The production boundary contained 61 tables and 90 enums, and Prisma schema-to-DB
diff reported no difference.

## Qualification execution

- aggregate typecheck and scenario-service DB typecheck: PASS;
- repair-target DB suite: 2 files / 64 tests;
- isolated concurrent first-freeze regression: 3/3;
- root unit suite: 52 files / 579 tests;
- scenario-service unit suite: 8 files / 52 tests;
- production DB suite: 21 files / 225 tests;
- formal owner integration: 2 files / 55 tests, including Harness 49 and binding
  owner 6;
- runtime ingress census: 26 committed actions, 9 successful queries, 0
  unexercised;
- joint markers: `joint:t007_t006_publication=passed` and
  `joint:t005_t006_direct_interaction=passed`;
- owner-integration evidence: 37 keys, SHA-256
  `e02ee06300c3c232ca938314f38cec156fdc24a75fff11bf94fe4ad67e929910`;
- surface conformance: 11 files / 110 tests, tooling 5/5;
- formal ingress: 7 routes, 26 actions, 9 queries, 35 registered, 0 unrouted.

No credential or connection string is retained in this record.
