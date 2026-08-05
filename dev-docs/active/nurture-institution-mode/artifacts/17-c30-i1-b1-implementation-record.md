# C30-I1-B1 Owner-Binding Reservation Implementation Record

## Result

- Date: 2026-08-05
- Governance: `REUSE_TASK / M-002 > F-002 > T-002`
- Authorization: I1-B1 only
- Result: `I1_B1_IMPLEMENTED / LOCALLY_VERIFIED`
- Cumulative state: `C30_I1_IN_PROGRESS / I1_A_ACCEPTED / I1_B1_COMPLETE`
- Next state: `I1_B2_SEPARATE_AUTHORIZATION_REQUIRED`
- Downstream: `I1_C_BLOCKED / C30_I2_NO_GO / C30_I3_NO_GO / C30_I4_NO_GO`

The Base-only I1-B1 source is complete. This checkpoint does not accept the
cumulative I1-B gate and does not authorize B2, B3, B4 or any consumer/runtime
adoption.

## Exact source checkpoint

| Repository | Branch | Commit | Worktree state |
| --- | --- | --- | --- |
| My-Workflow-Base | `codex/T-002-c30-i0-base` | `6a4378970246dc724b43a30b1f9b4c6fdfde494b` | Clean after commit |

Commit subject:

```text
feat(contracts): add owner reservation contract
```

The existing I1-A source lock remains `bd69d1988e0d066dad586f16d839c6ff7f67e2c9`.
It intentionally does not claim this source population. I1-B4 owns the final
cumulative source-lock refresh after B1 through B3 stabilize.

## Implemented surface

I1-B1 adds only:

- `ScenarioOwnerBindingRefV1`;
- `ScenarioOwnerBindingReservationRequestV1`;
- `ScenarioOwnerBindingReservationResultV1`;
- the closed `reserved|exact_replay` disposition;
- strict structural assertions for all three bodies;
- an exchange assertion that rejects request/result `identity_operation_id` or
  `binding_slot` drift;
- matching JSON Schemas, typed/JSON fixtures, negative conformance cases and
  package exports.

The reservation request contains only a stable operation id, registered slot,
opaque keyed canonical-object evidence hash and canonical request hash. The result
contains only the typed Scenario owner endpoint, disposition, non-negative
reservation version and opaque evidence hash.

## Exposure and semantic boundary

- No raw canonical object ref, platform binding ref/head, membership ref/id, PII,
  role, policy, Grant, protected body, credential, key or signature field is
  accepted by the reservation bodies.
- `owner_ref` remains a neutral `CanonicalRef`; Base hard-codes no Scenario
  namespace, object type, Child/Family kind or owner policy.
- The codec proves body shape and request/result parity only. Key custody,
  canonical hash construction, missing-slot eligibility, atomic reservation,
  exact-replay persistence and changed-payload conflict handling remain owner
  runtime responsibilities for later gates.

## Verification evidence

| Check | Result | Notes |
| --- | --- | --- |
| Contract source typecheck | PASS | `pnpm exec tsc --noEmit -p templates/host-runtime/packages/workflow-contracts/tsconfig.json` |
| Source-mapped fixture typecheck | PASS | In-memory TypeScript program mapped `@host/workflow-contracts` to current source; five fixture files passed without generating `dist`. |
| Schema package | PASS | `check-federation-schemas.mjs` compiled all 15 Schemas and executed both reservation fixtures twice. |
| Strict Schema negatives | PASS | Strict Ajv execution rejected raw canonical/binding fields, embedded signature, null hash, owner role and negative version samples. |
| Runtime codec | PASS | In-memory transpile/execute accepted reserved/exact-replay and rejected unknown fields, invalid versions and exchange identity/slot drift. No tracked or generated output was written. |
| Canonical-ref lint | PASS | No findings. |
| Consumer boundary | PASS | `check-consumer-boundaries.mjs` passed. |
| Contract/doc alignment | PASS | `check-contract-doc-alignment.mjs` passed. |
| Semantic lint wrapper | PASS | `check-semantic-lint.mjs` passed. The bare root `pnpm semantic-lint` remains an existing argument-requiring entrypoint and was not changed in B1. |
| Diff/secret boundary | PASS | Staged diff check and credential-pattern scan passed. |
| Nurture continuity | PASS | Context checksum `8bc3dc50abd1d285b60d45a4dfedd4d1877a04895bd5a226a0eac374f5b65cbc`; strict Context/project-state/governance validation and 413-file document/anchor lint pass. |

The standard built-package conformance test was not run because the repository
instruction forbids an unrequested build. The new test is syntax-checked and its
Schema/codec cases were executed through no-output harnesses. Full package build,
normal conformance execution, deterministic rerun and cumulative source-lock
verification remain mandatory in I1-B4.

## Unchanged surfaces

- no Base runtime template, Scenario starter, legacy federation contract,
  dependency, package version, generated `dist` or source lock;
- no My-Chat or Nurture product source, manifest/module, Prisma/schema/migration,
  database, route, signer, registry or capability;
- no deployment, activation, T-007/T-008, Pilot or traffic.

## Rollback and next gate

Rollback B1 by reverting Base commit
`6a4378970246dc724b43a30b1f9b4c6fdfde494b`. No database, runtime, consumer or
source-lock compensation exists.

The only eligible next implementation decision is a separate authorization for
`I1-B2`: the Host-internal atomic pair request/result and cross-object parity tests.

Post-B1 checkpoint: the user later authorized I1-B2, now recorded in
`18-c30-i1-b2-implementation-record.md`. This does not change the B1 result.
