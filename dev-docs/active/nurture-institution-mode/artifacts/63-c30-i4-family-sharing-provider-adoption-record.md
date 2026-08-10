# C30-I4 Family-sharing Provider Adoption Record

## Accepted handoff

- Date: 2026-08-11
- Task: `M-002 > F-002 > T-002 nurture-institution-mode`
- Scope: artifact 62, `C30-I4-A/B` only
- Nurture provider source:
  `be3d58ddfdd6a8a4784295f118cfba45615a6b6f`
- My-Chat T-039 adoption:
  `6295b4fbba776f37edf2f447fa1eebe8b7d2054b`
- Contract: `nurture.family-sharing-eligibility@1.0.0`
- Contract digest:
  `sha256:0cc3ccc8df55b1c6060c5b39af02fb1026c260dae53727f5fdeff72f2b08f5d8`
- Cumulative Nurture source hash:
  `752bc3d6cccb5119c3df675d7ef00097b2c67d7bdf812b2b147ec472b1cddc8a`
- State: `C30_I4_A_B_ACCEPTED_DEFAULT_OFF / I4_C_SEPARATE_REVIEW_REQUIRED`

## Result

Nurture now owns a closed private provider contract and HTTP-free service over
a current-authority port. Every resolved result contains exactly the three
frozen categories; positive eligibility requires role, Grant, release,
receiving eligibility and both endpoint lifecycles. Malformed requests,
contract mismatch, duplicate/missing facts, invalid clocks and owner exceptions
return only `status=unavailable`.

My-Chat pins the exact key/version/digest, maps its private current context to
the provider request and validates every response against the T-039 consumer
contract. There is no cache, range, latest alias, fallback or raw Child/Family
id. The Nurture provider never receives My-Chat consent and the My-Chat adapter
never receives owner-internal authority evidence.

## Quality repairs included

- Expanded the digest-bound Schema to cover category result fields, eligibility
  and lifecycle enums, positive lifecycle requirements and exact admission
  prohibitions.
- Added a dedicated deterministic source-lock profile for provider source and
  tests, avoiding an export-only lock gap.
- Removed the retired `packages/domain/growth-record` path from the My-Chat
  source pin instead of recreating an obsolete compatibility directory.
- Recomputed the exact current `x5_joint_api`, `wave4_binding_host` and Nurture
  scenario hashes after their committed source changes.
- Preserved the existing Nurture Grant vocabulary; no generic Grant/data class
  is falsely treated as media or focus-sharing authority.

## Verification

| Population | Result |
| --- | --- |
| Focused provider | PASS — 1 file / 15 tests |
| Scenario package typecheck and manifest parity | PASS |
| Nurture full Vitest | PASS — 87 files / 966 tests |
| My-Chat frozen contract/adoption | PASS — 2 files / 13 tests |
| My-Chat full typecheck/unit/ESLint | PASS — 145 files / 1003 tests; 21 files / 127 environment-gated tests skipped |
| Cross-repository workflow/source pin | PASS |
| Cumulative owner source lock | PASS — 8 profiles / `752bc3d6…ddc8a` |
| Default-off census | PASS — `448d37e1…3c3e` |

The standalone scenario package has no applicable root ESLint configuration;
direct ESLint invocation therefore fails before linting. Typecheck, manifest
parity, tests and deterministic source checks cover this isolated unit. The
repository's configured root `lint` also performs a pinned-contract build, so
no additional build was invoked solely for this source slice.

## Effect boundary and next gate

No schema, migration, database, repository adapter, private/public HTTP route,
NestJS registration, manifest, generated manifest, action offer, protected
declaration, feature flag, capability, environment, deployment, Pilot or traffic
state changed.

`C30-I4-C` remains a separate review. It must define a real owner adapter and
honest persisted authority semantics for media/focus before implementation.
Independently, My-Chat T-039 can now implement canonical consent/withdrawal,
receipt, outbox and the frozen query/prepare/confirm API while keeping production
composition default-off.
