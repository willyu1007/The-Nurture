# C30-I3-F Protected Owner Lifecycle Record

## Decision

- Date: 2026-08-06
- Task: `M-002 > F-002 > T-002 nurture-institution-mode`
- Scope source: artifact 53
- Prerequisite: artifact 58
- Runtime source: `13285fd11bab736418af139677f802b79ae464dd`
- Lock-tool source: `ac049b49f73c27efdccf362f76290915c2ee40df`
- State: `C30_I3_F_ACCEPTED / I3_G_AUTHORIZED_NEXT`

I3-F is accepted. Nurture now owns the authoritative lifecycle for protected
scenario content through a default-deny KMS port, one independently wrapped DEK
per content object and a body-free durable control plane. The generic primitive
is qualified only by neutral tests: the production manifest still declares no
protected interaction or action, and no production route or handler was added.

## Owner and cryptographic boundary

- Every commit, foreground read and erase rereads the current typed Participant,
  separate business authority, process/role, local pair association and injected
  canonical pair evidence. A binding or routing identifier is never permission.
- Plaintext is encrypted with a random per-content AES-256-GCM DEK. Only the
  KMS-wrapped DEK and ciphertext are durable; the KMS implementation is an
  injected port whose production default denies every operation.
- The lifecycle stores no plaintext, display lease or unwrapped key. Retention,
  explicit tombstone and crypto-erasure clear ciphertext, nonce, tag, wrapped
  DEK and KMS handle while retaining only body-free audit identity and state.

## Lifecycle, restoration and no-copy

- Exact replay is stable; changed plaintext under the same immutable identity is
  an integrity denial. GCM tampering, pair revocation, expired retention and
  erased state all fail closed.
- KMS destruction precedes database key-material clearing. If the database
  mutation rolls back, the external handle is already destroyed; restoring a
  database snapshot therefore cannot unwrap the former DEK.
- The recursive destination census covers generic payloads, audit/outbox,
  execution, presentation, locator, action and legacy protected-content paths.
  Protected plaintext, DEK and KMS key material do not enter those carriers.
- The pre-C30 protected-content helper is pinned in the source profile and is not
  imported as a fallback by the C30 owner path.

## Schema and isolated database

- Migration:
  `20260806140000_c30_i3_protected_owner_lifecycle/migration.sql`.
- Migration SHA-256:
  `fd371d8fcd36c350a436926fe09271998a7979629fab73a1cfd738dea78123c8`.
- Prisma migration-to-SSOT and exact target-to-SSOT diffs are empty. The
  generated DB context was refreshed and strict context verification passes.
- The exact disposable `nurture-c30-i3` target on `127.0.0.1:55440` has 19/19
  migrations. It remains alive only for I3-G fresh-database qualification and
  must be destroyed at I3 closure. No existing database was contacted or changed.

## Verification

| Check | Result |
| --- | --- |
| Scenario and DB typecheck | PASS |
| Focused Scenario protected suite | PASS — 1 file / 5 tests |
| Focused PostgreSQL protected suite | PASS — 1 file / 8 tests |
| Complete Scenario suite | PASS — 57 files / 632 tests |
| Complete DB suite | PASS — 24 files / 253 tests |
| Scenario/DB production build | PASS |
| Prisma validate/generate and both schema diffs | PASS |
| Strict context and exact upstream handoffs | PASS |
| Cumulative adoption lock | PASS — `b251bb461c6fbd26745ae17f7c1b067e287c9d7ca4f099366ec282e26ae148a8` |
| Protected-owner profile | PASS — `5e48ea103eab3b974348d9a285ff8b2f6f4e7501b8eeefd1594431e13cf73c15` |

## Effect boundary and next gate

Only synthetic neutral ciphertext was written to the exact disposable target.
No product protected declaration, plaintext carrier, production action,
claim-token persistence, existing database, route/handler, secret/environment
value, capability, deployment, activation, I4, C31, T-008, Pilot or traffic
operation occurred. I3-G cumulative convergence and qualification is next under
the user's ordered authorization.
