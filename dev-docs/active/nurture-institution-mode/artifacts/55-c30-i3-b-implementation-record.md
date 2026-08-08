# C30-I3-B Private Trust and Participant Binding Record

## Decision

- Date: 2026-08-06
- Task: `M-002 > F-002 > T-002 nurture-institution-mode`
- Scope source: artifact 53
- I3-A prerequisite: artifact 54
- Source: `b8974bf76b7503221df7c6ee2bdea1eae135a8fd`
- State: `C30_I3_B_ACCEPTED / I3_C_AUTHORIZED_NEXT`

I3-B is accepted. Nurture now owns a detached private-request verifier, a
request-bound response signer, an atomic bounded nonce port/implementation and
a typed Participant principal-binding resolver. The implementation consumes
only the accepted Base contracts; it does not import My-Chat runtime, ORM,
database, workers or routes.

## Trust and replay boundary

- The verifier requires an explicit service credential subject and exact one-row
  trust selection across issuer, audience, caller, credential, key and algorithm.
  Missing, duplicate, revoked or non-current trust fails closed.
- Ed25519 metadata and signature are checked before the detached body digest,
  strict Base invocation contract, exact declared route/operation/ingress,
  current time window and atomic nonce consumption.
- The nonce scope binds issuer, audience, caller, credential and nonce. Replay,
  concurrent consumption and bounded-store exhaustion fail before owner work.
- The response signer reverses the verified issuer/audience direction and binds
  request ID, nonce digest, route, operation, status, response digest and expiry.
  It cannot sign through a service-token or unsigned fallback.
- Canonical JSON rejects undefined, non-finite and non-plain values and produces
  deterministic UTF-8 bytes for detached signing.

## Participant boundary

- Account, Actor, Workspace, local Participant and optional represented
  organization are distinct typed canonical refs with an explicit binding
  revision and lifecycle.
- Zero or multiple current bindings, inactive binding, cross-principal refs and
  malformed namespaces fail closed.
- An exact identity binding is not permission. Every operation requires a
  separate current Nurture business-authority decision and captures its revision.
- Interactive and durable origins preserve the same human identity boundary;
  no worker/service identity is promoted to business actor.

## Verification

| Check | Result |
| --- | --- |
| Scenario typecheck and generated-manifest parity | PASS |
| Focused trust/Participant suite | PASS — 2 files / 33 tests |
| Complete scenario suite | PASS — 54 files / 612 tests |
| Production dependency scan | PASS — no My-Chat runtime or Prisma import in C30 source |
| Exact cumulative lock | PASS — `24080cc596f59a535e0980e49e160f62778b8b65a5caf70abc9ac6b2c5e53d18` |
| Private trust profile | PASS — `8a3e86aa9a0b8cbb7eb9533bb96125a2dc00a27d2901bd22c03bdee909b2e2a8` |
| Diff hygiene | PASS |

The repository has no general backend ESLint configuration; invoking ESLint
directly on these files therefore exits before linting. Strict TypeScript and
the complete test population are the applicable checks. This tooling absence
is not reported as a source failure.

## Effect boundary and next gate

No controller/route was registered, no schema or migration changed, and no
Prisma generation, database, secret/KMS, capability, deployment, activation,
I4, C31, T-008, Pilot or traffic action occurred. Production capabilities stay
disabled. The user's ordered authorization opens I3-C next.
