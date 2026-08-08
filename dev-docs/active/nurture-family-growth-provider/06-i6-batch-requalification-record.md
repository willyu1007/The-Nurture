# T-009 I6-Batch Requalification Record (surface contract 1.16.0)

## Verdict

- Task: T-009 (family growth provider), 1.16.0 batch (I6 cession + I6.2 queue
  vocabulary + I7b joint suite and lane wiring)
- Date: 2026-08-08
- Verdict: `REQUAL_PASS`
- Provider state: qualified, default-off
- Non-effects: no existing database access (fresh disposable databases only),
  no persistent qualification database, no deployment, no capability
  activation, no traffic authorization. The T-006 G3 Exit verdict and the
  T-005 G2 Exit provider are inherited unchanged, not re-adjudicated.

This record refreshes the evidence invalidated by the 1.16.0 batch (surface
digest rotation, owner-pin rotation, the two T-009 persisted tables and the
new x5 joint lane) on an exact detached topology with empty databases.

## Exact Bound Inputs

1. Surface contract: `nurture.surface-contract@1.16.0` /
   `sha256:4bc8eeefaedded811523395add3a6126c5efc4ac737609a51e3fc7df442f0ca5`,
   shared core
   `sha256:7bd8a82d4ad6e2ee6a5cdf02f50792049fe7bdfa546992058cb860c1baac4c6d`,
   33 capabilities / 6 surfaces.
2. Nurture checkpoint: `97b9afe` (main; self-pin
   `48502f6df25285e94279e3ecfed18b1d07c29358313bd92f1238dede2ddc6413`,
   185 files).
3. My-Chat: `df7a273bff65b965da45e2e9604cee3b6b8fc20b` (rotated once in this
   batch, D-T009-04).
4. My-Workflow-Base: `8a3ea9028d414813994a57ef3501ecad3dd7c434` (rotated once
   in this batch, D-T009-04).
5. Base/My-Chat workflow contract parity:
   `8dd53be4ba392c6eb254c462066d9c7e65b239bc79142911de4ef58faf3da34d`
   (11 files, both sides).
6. Transport: `family_growth_transport@1.0.0` (frozen addendum, mirrored in
   My-Chat), consumer contract
   `family_growth_material_release/lifecycle/admission_receipt@1.0.0`.

## Qualification Topology

Three adjacent exact detached worktrees under a disposable parent directory
(`The-Nurture` @ 97b9afe, `My-Chat` @ df7a273, `My-Workflow-Base` @ 8a3ea90),
so the `link:../My-Chat/...` package links, the pin verifier and every lane
loaded the same frozen sources. Frozen installs used
`pnpm install --ignore-scripts`; Prisma clients (Nurture, My-Chat, dev-host)
were generated explicitly and `@my-chat/workflow-contracts` plus the
scenario-service dist were built explicitly.

Two disposable tmpfs containers on otherwise-free loopback ports, destroyed
after the run (ports verified free, existing listeners at 5433/55439
untouched):

- `t009-requal-nurture-pg` (`postgres:16-alpine`, 127.0.0.1:55440) —
  `nurture_t009_requal`: all 18 migrations replayed from empty, `migrate
  status` current, schema-to-DB `migrate diff` empty; plus
  `nurture_dev_host_requal` for the dev-host lane.
- `t009-requal-mychat-pg` (`pgvector/pgvector:pg16`, 127.0.0.1:55441) —
  `mychat_t009_requal`: all 29 My-Chat migrations replayed from empty. (The
  My-Chat schema requires the `vector` extension; plain postgres:16 fails
  deploy — image choice is load-bearing.)

## Gate Evidence (all in the detached Nurture worktree)

| Gate | Result |
| --- | --- |
| `verify-workflow-contract-pin` (sibling worktrees at exact pins) | ok — Base contract 11 files parity `8dd53be4…`; My-Chat `x5_joint_api` 190 files `30878ba3…`, `wave4_binding_host` 20 files `947b4857…`; Nurture self 185 files `48502f6d…` |
| assert scripts: test-routing, g3-0-freeze, g2-exit-contract, formal-ingress, port-topology, persistence-boundaries, n1-schema, x4-handoff-replay | all ok (routing census 57/26/11/14 + x5-joint=2; retired `guardian_current_focus` pair tracked reserved-RETIRED) |
| `assert-g2-exit-db-census` + `assert-production-db-boundary` (fresh DB) | ok — census violations=0; 63 tables / 93 enums |
| Deterministic surface-contract rebuild | zero drift in `generated/`; `verify:surface-contract` ok at the digest above; tooling tests 5 pass / 0 fail |
| `tsc --noEmit` | clean |
| `pnpm test:unit` | 57 files / 615 tests |
| `pnpm test:db` (fresh empty DB) | 26 files / 256 tests |
| scenario-service `test` + `test:db` (dist) | 11/66 + 3/64 |
| `pnpm test:dev-host` (fresh empty DB) | 11/27 |
| x5 lane (`vitest.x5.config.ts`, both fresh DBs) | 2 files / 11 tests — x5 joint acceptance + the seven T-009 I7b joint N8 cases against the real My-Chat consumer |

Default-off posture re-proven: the G2 exit assert checks the protected gate
variables remain optional/secret/unactivated across dev/staging/prod value
files, and the census/boundary asserts ran against the empty replayed schema.

## Invalidation

Any surface digest, owner revision/source-pin hash, Nurture self-pin
population, DB schema/migration, transport addendum or default-off posture
drift invalidates the affected portion and requires requalification. I8
(teacher queue UI binding) remains open and is not covered by this record.
