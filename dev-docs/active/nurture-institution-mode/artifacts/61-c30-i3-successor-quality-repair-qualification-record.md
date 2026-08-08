# C30-I3 Successor Quality-repair Qualification Record

## Decision

- Date: 2026-08-06
- Task: `M-002 > F-002 > T-002 nurture-institution-mode`
- Reopened sources: artifacts 59 and 60
- Repair source: `48530bec7219b88b3e1f580a57eb6879e083da36`
- Successor lock commit: `7db31291b2686290b5ecde8e803abd664f2ffcfd`
- Successor aggregate:
  `623da6fdb447531d84bafafe90865f32b4886827c2c13b7eb2d425f3c39c95d5`
- State: `C30_I3_SCENARIO_OWNER_ADOPTION_REACCEPTED_DEFAULT_OFF /
  I4_SCOPE_REVIEW_ELIGIBLE`

The post-implementation quality review reopened the first I3 acceptance and
identified four defects. This successor closes all four and also repairs the
PostgreSQL enum-migration transaction defect found by fresh-database execution.
Artifacts 59 and 60 remain historical records; this artifact and the successor
lock are current acceptance evidence.

## Closed findings

| Finding | Severity | Repair and proof |
| --- | --- | --- |
| I3-QR1 KMS calls inside DB transactions made commit/erasure ambiguity unsafe | P0 | Commit now persists `provisioning`, calls an idempotent KMS data-key provision operation outside the transaction, then rereads authority and finalizes `active`. Erasure commits `erasing` before an idempotent external destroy, then clears all material in a final transaction. Ambiguous provision creates no second key; ambiguous destroy is never represented as `active`, and pending erasure converges even after business-authority loss. |
| I3-QR2 pair registration replay, committed replay and status recovery skipped current authority | P1 | Every path now locks the current Participant and owner anchors, invokes the transaction-aware authority reader from stored immutable identity, compares the admission source/version, and validates committed binding/association/object lifecycle before returning evidence. Local suspension and missing platform-authority reader deny all three paths. |
| I3-QR3 principal binding revision was used as Participant/object version and several refs were hard-coded to `v1` | P1 | The Participant binding reader joins the current Participant and emits its aggregate version independently from `binding_revision`. Pair commit persists the exact Participant/Process/Family versions and reuses them in result, Execution, outbox and replay; action no-effect outbox uses the current Participant version. A `Participant v7 / binding v1 / Process v5 / Family v6` fixture passes end to end. |
| I3-QR4 protected read accepted caller-authored carrier binding | P1 | The read command no longer carries a binding hash. A production-default-deny owner port verifies the current foreground context and derives the read-output binding from server-held surface/key state plus the exact request identity and decrypted carrier bytes. The repository then rereads DB authority/lifecycle after decrypt and binding before returning plaintext. Caller-invented foreground hashes and mid-read revocation fail closed. |
| I3-QR5 new enum values were used in their creation transaction | Migration blocker | `provisioning|erasing` are added by the standalone `20260806225000` migration and consumed only by the later `20260806230000` migration. A second fresh 21/21 apply and both schema diffs pass. |

## Durable KMS coordination and restore safety

- The durable row is the coordination authority. `provisioning` has no
  ciphertext, wrapped key, handle or committed timestamp. The KMS
  `provisioning_key` is deterministic and idempotent; replay returns the same
  caller-owned DEK bytes and wrapped-key identity.
- `active` exists only after a second current-authority transaction stores the
  ciphertext and wrapped-key metadata. A lost/ambiguous finalize response is
  recovered by rereading the row; no catch path destroys a possibly committed
  key.
- `erasing` remains carrier-free and retains only the material required to retry
  idempotent destroy. Finalization clears ciphertext, nonce, tag, wrapped DEK,
  KMS domain/version/handle/hash and wrapping algorithm. A restored pre-terminal
  row still references a destroyed external handle.
- KMS provision, unwrap, destroy, integrity verification and foreground binding
  all run outside database transactions. The final read transaction rejects
  lifecycle/version/authority changes that occurred during decrypt/binding.

## Schema and isolated database

- Coordination-state migration:
  `20260806225000_c30_i3_protected_coordination_states/migration.sql`, SHA-256
  `56980226ee91b88eb4ca0f0e3b5496e1247e7944b87f309127fd92f7d0d95ff7`.
- Quality-repair migration:
  `20260806230000_c30_i3_quality_repair/migration.sql`, SHA-256
  `5cf7e332a5c798731769ebf0f986a5181511df20a498384847577b77e6860534`.
- Exact target: disposable `nurture-c30-i3-quality-repair`, PostgreSQL
  16/pgvector on `127.0.0.1:55440`; a separate shadow database existed only in
  that container.
- Fresh apply passed 21/21 migrations. Migration-to-SSOT and target-to-SSOT
  reported `No difference detected.` Prisma validate/generate and generated DB
  context refresh pass.
- Before teardown all eight `nurture_c30_*` tables and
  `nurture_scenario_invocation_nonce` were proved at zero rows. The exact
  container was destroyed and 55440 has no listener.

## Verification

| Check | Result |
| --- | --- |
| Root TypeScript | PASS |
| Scenario package | PASS — 58 files / 635 tests |
| Complete PostgreSQL suite | PASS — 24 files / 259 tests |
| Focused pair/action/protected suites | PASS — 3 files / 34 tests |
| Scenario service | PASS — 8 files / 52 tests |
| Scenario/DB production build | PASS |
| Prisma validate/generate, fresh deploy and both diffs | PASS |
| Default-off census | PASS — `448d37e1…3c3e`, every positive population zero |
| Exact upstream, routing and persistence boundaries | PASS |
| Documentation/context/governance | PASS — 91 task Markdown files, links and anchors have zero errors/warnings; strict context and governance lint pass |
| Successor lock, repeated | PASS — `623da6fd…95d5` |
| Pair profile | PASS — `6afeedef…b1d0` |
| Protected-owner profile | PASS — `adecec17…3487` |

## Effect boundary

Only synthetic data entered the exact disposable target. No existing database,
Base/My-Chat source, production action/protected declaration, route, secret,
capability, Workspace activation, deployment, I4 implementation, C31-C35,
T-008, Pilot or traffic operation changed. Reacceptance preserves the prior
default-off outcome and opens only the already-eligible, separately authorized
C30-I4 scope review.
