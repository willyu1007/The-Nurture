# C30-I3-C Pair Anchors and Local Association Record

## Decision

- Date: 2026-08-06
- Task: `M-002 > F-002 > T-002 nurture-institution-mode`
- Scope source: artifact 53
- Prerequisites: artifacts 54 and 55
- Source: `bf3fee8d47f292e0a991a7e0ce65f864db36ad4b`
- State: `C30_I3_C_ACCEPTED / I3_D_AUTHORIZED_NEXT`

I3-C is accepted. Nurture now persists its own Scenario-private nonces and typed
Participant bindings, and owns one writer-fenced canonical-pair association
transaction. Host canonical identity remains opaque input; the transaction
creates only Nurture-local facts and never reads the My-Chat database.

## Schema and migration preview

- DB SSOT mode: `repo-prisma`; source is `prisma/schema.prisma`.
- Migration:
  `20260806120000_c30_i3_pair_owner_foundation/migration.sql`.
- Migration SHA-256:
  `42e022decea0c4c63307611c8afcec156cd5b22fc5bcfd2f76b25821ebd04dd3`.
- Before apply, Prisma's migrations-to-datamodel preview showed only the two new
  lifecycle enums, five C30 tables, typed `CommandExecution` columns, indexes
  and foreign keys. The maintained SQL adds lifecycle/hash/state/all-or-none
  checks. The final migrations-to-SSOT and database-to-SSOT diffs are empty.
- Generated DB context was refreshed; strict context verification passes.

The intended 55439 port was already owned by the unrelated existing container
`codex-q4b5-mychat-pg`. It was not read, stopped or changed. The exact I3 target
was therefore changed before creation to:

| Property | Exact value |
| --- | --- |
| Container | `nurture-c30-i3` |
| Endpoint | `127.0.0.1:55440` |
| Database / role | `nurture_c30_i3` / `nurture` |
| Image | `pgvector/pgvector:pg16` |
| Initial state | container absent, port free, public table count 0 |
| Applied population | 17/17 migrations |

The disposable container remains alive only for ordered I3-F schema work and
I3-G cumulative fresh-database qualification. Its exit condition is mandatory
destruction and a free 55440 port before I3 closes. No existing database was
connected to or modified.

## Atomic owner behavior

- A refs-only pre-dispatch row records one eligible writer fence. It is not a
  business effect and is required to prove later `confirmed_no_effect` safely.
- Dispatch uses a Serializable transaction and locks the Participant, both
  anchors and the operation before rereading the injected current local
  authority source. The production default authority adapter always denies.
- One successful transaction creates or exact-validates the typed principal
  binding, local Child, `NurtureChildCareProcess`, child-scoped Family, guardian
  role, both current associations, typed `CommandExecution`, refs-only audit and
  refs-only outbox, then marks the operation committed.
- Same operation/same hash exact-replays. Changed input, stale owner versions,
  authority drift, revoke-before-lock, local conflicts and serialization losers
  fail closed; partial writes roll back.
- After the stored deadline, a locked eligible attempt may transition once to
  `confirmed_no_effect`. Its same-transaction audit/outbox and writer fence make
  a later commit impossible. Before the deadline or during dispatch the result
  is `unknown`.

## Verification

| Check | Result |
| --- | --- |
| Prisma format / validate / generate | PASS |
| Migration preview and migrations-to-SSOT diff | PASS — no remaining diff |
| Empty target migration apply | PASS — 17/17 |
| Target database-to-SSOT diff | PASS — no difference |
| Scenario and DB typecheck | PASS |
| Focused C30 database suite | PASS — 1 file / 10 tests |
| Full Nurture database suite | PASS — 22 files / 234 tests |
| Complete scenario suite | PASS — 54 files / 612 tests |
| Scenario/DB production build | PASS |
| Upstream locks and strict DB context | PASS |
| Cumulative adoption lock | PASS — `c94ac5ed28a26011b37b556271becf575d7693909a7ba91a2543b0a8dfe0158e` |
| Pair/local profile | PASS — `99916dcb6c284afde4d9293551e5c0239a6152f0957b1bfd3815263c46d164cc` |

The complete DB suite initially failed during module collection because the
repository's historical package subpath exports require built Scenario/DB
artifacts. Running the documented `build:binding-owner-runtime` prerequisite
resolved the routing condition; the rerun passed all 234 tests.

## Effect boundary and next gate

The target contains only synthetic test data and remains disposable. No route,
capability, secret/KMS, deployment, activation, I4, C31, T-008, Pilot or traffic
operation occurred. I3-D is next under the user's ordered authorization.
