# C30-I3-E Canonical Action Owner Runtime Record

## Decision

- Date: 2026-08-06
- Task: `M-002 > F-002 > T-002 nurture-institution-mode`
- Scope source: artifact 53
- Prerequisite: artifact 57
- Runtime source: `9a59c5158c08cda79c302943784571a69b66c161`
- Lock-tool source: `25e7a78a9c7e02cab00520ff6baa29a71f84f55a`
- State: `C30_I3_E_ACCEPTED / I3_F_AUTHORIZED_NEXT`

I3-E is accepted. Nurture now owns one canonical Base-neutral action runner and
one transactional persistence path for both accepted execution drivers. The
neutral definitions and effect writer exist only in conformance tests. The
production manifest still declares no domain action or protected interaction,
and no production route or handler was added.

## Owner action boundary

- Prepare validates the exact Base action contract and input before resolving a
  current typed Participant, separate Nurture authority and current target. Its
  opaque submit context creates no business or protected effect.
- Submit and status fail closed on invalid or stale invocation evidence and
  reread Participant, authority and target. Direct identity explicitly binds
  Workspace, `scenario_key`, action and submit context. Claimed identity binds
  the original Workflow Step; the claim token never enters the execution
  command or repository.
- The repository repeats current Participant/binding and injected
  transaction-aware business-authority checks before initial admission,
  execution, committed replay and recovery. Its production defaults deny both
  authority and effect.

## Atomicity, replay and recovery

- The additive operation row binds immutable identity, canonical payload,
  target, actor, authority, trusted invocation and writer-fence digests.
- One Serializable commit transaction locks the effect identity, revalidates
  current authority, invokes the injected effect writer and stores the typed
  `CommandExecution`, body-free result, refs-only audit/outbox and terminal
  operation state together.
- Concurrent exact submits produce one effect and return executed/replayed.
  Reusing the identity with changed immutable input conflicts before any second
  effect. Revoked current authority denies even a previously committed replay.
- A fault inside the effect writer rolls back the effect and Execution. After
  the database-time deadline, recovery atomically records
  `confirmed_no_effect`; the writer fence prevents a later commit.

## Schema and isolated database

- Migration:
  `20260806130000_c30_i3_canonical_action_runtime/migration.sql`.
- Migration SHA-256:
  `e72636eb43da2a3763a0286e57b5bc8395700b58828de193d579db03d1b4eb0f`.
- Prisma migration-to-SSOT and exact target-to-SSOT diffs are empty. The
  generated DB context was refreshed and strict context verification passes.
- The exact disposable `nurture-c30-i3` target on `127.0.0.1:55440` now has
  18/18 migrations. It remains alive only for I3-F/G and must be destroyed by
  I3-G. No existing database was connected to or changed.

## Verification

| Check | Result |
| --- | --- |
| Scenario and DB typecheck | PASS |
| Focused Scenario action suite | PASS — 1 file / 7 tests |
| Focused PostgreSQL action suite | PASS — 1 file / 6 tests |
| Complete Scenario suite | PASS — 56 files / 627 tests |
| Complete DB suite | PASS — 23 files / 245 tests |
| Scenario/DB production build | PASS |
| Prisma validate/generate and both schema diffs | PASS |
| Strict context and exact upstream handoffs | PASS |
| Cumulative adoption lock | PASS — `7de367134701e22a592d0706a397641d796cdd7321682e1bb5ad14e8ea38c085` |
| Canonical-action profile | PASS — `9af217ee20eaaabf70c7e0726269910874195151e17395d2b8467d8387b91008` |

The full Scenario run also exposed and repaired a nondeterministic older
signature-tamper fixture: changing an unpadded Base64URL last character can
alter only unused bits, so the test now changes the first significant
character. Runtime signature verification was not bypassed.

## Effect boundary and next gate

Only synthetic neutral rows were written to the exact disposable target. No
product action, protected body, claim token, production route/handler,
capability, secret, existing database, deployment, activation, I4, C31, T-008,
Pilot or traffic operation occurred. I3-F is next under the user's ordered
authorization.
