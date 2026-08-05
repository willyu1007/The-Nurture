# C30-I1 Scope Freeze

## Decision

- Date: 2026-08-05
- Governance decision: `REUSE_TASK`
- Mapping: `M-002 > F-002 > T-002 nurture-institution-mode`
- Overall state: `C30_I1_IN_PROGRESS / I1_A_ACCEPTED / I1_B_ACCEPTED / I1_C_ACCEPTED`
- Downstream state: `C30_I2_NO_GO / C30_I3_NO_GO / C30_I4_NO_GO`

The existing task and roadmap remain the planning SSOT. No new task or parallel
roadmap is created. This freeze decomposes the already accepted C30-I1 Base gate
into reviewable contract increments without weakening its final cumulative exit.

## Cumulative C30-I1 exit

C30-I1 is complete only when one additive My-Workflow-Base release contains the
neutral trusted-principal/private-ingress, canonical-object scenario-binding,
subject-presentation, domain-action and protected-interaction contracts; strict
TypeScript codecs and JSON Schemas; legacy/vNext fixtures; atomic dependency rules;
and separately hashable neutral source identities. It contains no platform
Child/Family business semantics, runtime, database, Nurture registry value,
activation row or traffic authority.

## Ordered implementation slices

| Slice | Scope | Entry | Exit |
| --- | --- | --- | --- |
| `C30-I1-A` trusted invocation contract spine | Human principal, registered ingress context and exact private invocation envelope; strict structural codecs/Schemas/negative fixtures. | `C30-I0` complete. | **Accepted** at Base source `ce7118c…` plus exact source lock `bd69d19…`; no Host/scenario adoption. |
| `C30-I1-B` canonical-object binding envelope | Neutral typed owner refs, reservation, pair-binding request/result/recovery and current-owner evidence without platform Child/Family policy. | I1-A accepted. | **Accepted:** B1-B3 source `edbcd74…` plus B4 lock `9a15865…`; exact source hash and cumulative qualification are recorded in artifacts 17-20. |
| `C30-I1-C` subject presentation | Subject-context discovery/resolve, semantic presentation, navigation/action offers and safe owner text. | I1-B accepted. | **Reaccepted:** successor source `ae0c357…`, lock `3c30337…` and hash `fc35c6b…e5cf3`; artifacts 26-27 record repair and qualification. No consumer adoption. |
| `C30-I1-D` domain action | Prepare/submit, direct-empty versus claimed-Step driver, result/recovery and canonical effect-identity inputs. | I1-C accepted. | Ready/not started; scope review/freeze still requires separate authorization. |
| `C30-I1-E` protected interaction | Prepared/committed/read/tombstone body-free control contracts; protected bytes remain outside generic Host payloads. | I1-D accepted. | Protected wire, no-copy boundaries and negative fixtures pass. |
| `C30-I1-F` dependency/source convergence | Atomic manifest dependencies, legacy/vNext exclusion, schema/codec parity, four separate C30 source identities and source lock. | I1-A through I1-E accepted. | Full Base conformance passes and one immutable C30-I1 handoff is issued. |

Later slices consume earlier exports and MUST NOT recreate them. A green I1-A is not
C30-I1 completion and cannot open C30-I2.

## Frozen next slice: C30-I1-A

### Contract surface

The following exact reusable wire names are frozen for the first Base slice:

```text
ScenarioHumanPrincipalV1
  principal_version = 1
  principal_kind = human_user
  account_ref = my_chat/user CanonicalRef
  actor_ref = my_chat/actor CanonicalRef
  workspace_ref = my_chat/workspace CanonicalRef
  principal_origin = interactive_session | durable_run_actor

ScenarioIngressSurfaceV1
  ingress_version = 1
  ingress_category = product_surface | host_transition | workflow_runtime
  ingress_key = scenario-registered bounded key

ScenarioPrivateInvocationV1
  invocation_version = 1
  contract_version = 1
  contract_hash = lowercase SHA-256
  issuer
  assertion_audience
  caller_binding.caller_subject
  principal = ScenarioHumanPrincipalV1
  route = scenario_key + endpoint_key + method(POST) + ingress
  request = request_id + correlation_id + optional trace_id
            + issued_at + expires_at + nonce
  operation = operation_key + input_schema_version + input
```

The detached signature and service credential are deliberately outside the signed
JSON body. The operation `input` is opaque to the envelope codec and MUST pass its
separately registered strict codec before a verified context can exist.

### Validation contract

- Every envelope-owned object rejects unknown or missing fields; operation input is
  the sole delegated object.
- Principal refs are exact version-1 `my_chat/user`, `my_chat/actor` and
  `my_chat/workspace` canonical refs. Actor is provenance, never business authority.
- Identifiers are bounded machine keys/opaque values; contract hash is exact
  lowercase SHA-256; timestamps are canonical UTC instants.
- `expires_at` must be after `issued_at` and no more than 60 seconds later. Runtime
  current-time/skew, signature, key, caller-authenticator, nonce-store and registry
  checks remain I2/I3 responsibilities.
- Base does not hard-code Nurture scenario, endpoint, ingress keys, caller subjects,
  issuer or audience. Registry compatibility is tested with neutral fixtures.
- No `Participant`, role, Child, Family, Subject, Institution, CareGroup, Enrollment,
  Grant, policy, target, PII, credential, signature or business authorization field
  may enter the principal, caller, route or request context. The delegated operation
  input remains separately governed and may not be interpreted by the envelope
  codec.

### Expected Base impact

| Area | Planned impact |
| --- | --- |
| `templates/host-runtime/packages/workflow-contracts/src/types/` | Add invocation types and strict structural assertions; export from the package index. |
| `templates/host-runtime/packages/workflow-contracts/schemas/` | Add three version-1 JSON Schemas matching the TypeScript codecs. |
| `conformance/fixtures/` and `conformance/tests/` | Add neutral positive, legacy-compatible and closed negative fixtures; prove schema/codec parity. Ajv dependency metadata is recorded in `conformance/package.json` and the root pnpm lock. |
| Source lock | Regenerate only after the accepted source/test population is final. |

No current federation type, legacy manifest, runtime template, scenario starter,
package version or umbrella capability is removed in I1-A. Their convergence and
replacement are owned by later I1 slices, especially I1-F.

### Execution controls

- Blast radius: only the planned Base workflow-contract type/schema/conformance
  paths, conformance dependency manifest/root pnpm lock and final contract-source
  lock may change.
- Idempotency: codec/schema tests and source-lock generation MUST be deterministic;
  repeated verification may change no tracked file after the lock is current.
- Rollback: revert the exact source-lock commit, then the separately attributable
  Base I1-A source commit. No Host or scenario consumer adopted I1-A, so rollback
  requires no database, runtime or environment compensation.

## I1-A acceptance

1. TypeScript compiles without `any` and without importing Host/scenario runtime.
2. JSON Schema and TypeScript assertions accept the same neutral positive fixture.
3. Negatives cover unknown/missing fields, wrong canonical-ref shapes, invalid
   origin/category/method/hash/time window, unsafe identifiers and forbidden
   authority/body fields.
4. Legacy contract fixtures remain valid and unchanged; I1-A creates no fallback
   path or activation implication.
5. Contract-source lock, canonical-ref lint, consumer-boundary checks and complete
   Base conformance pass after separately authorized build prerequisites.
6. The resulting source/lock commit chain is exact and separately attributable to
   T-002; C30-I2 stays NO-GO until all I1-A through I1-F exits pass.

### Acceptance record — 2026-08-05

- Base implementation commit:
  `ce7118c85e10bd607f7c73ddc42f44ba6732e15e`; source-lock commit:
  `bd69d1988e0d066dad586f16d839c6ff7f67e2c9`. The second metadata-only commit is
  required by the existing Base lock verifier because the lock must name an already
  existing exact commit containing the current TypeScript source. Rollback is the
  reverse two-commit sequence; no consumer or database compensation exists.
- Added the three frozen types, structural assertions, three JSON Schemas, neutral
  JSON/TypeScript fixtures and schema/codec parity tests. Ajv executes all 12 Base
  schemas; the four new/ref schemas additionally compile in strict mode.
- The runtime assertion enforces canonical UTC instants and the ordered 60-second
  lifetime. JSON Schema enforces each instant structurally; cross-field time ordering
  is deliberately exercised as a runtime-codec semantic negative because standard
  JSON Schema has no portable cross-property time-difference keyword.
- `pnpm verify:workflow-contracts` passes: contracts/runtime/scenario/conformance
  typechecks, required contracts build, 28 runtime tests, 10 scenario tests, 21 Node
  conformance tests, canonical-ref lint, consumer boundaries, schema execution and
  exact source-lock verification. Source hash:
  `8621c6cc6e81e99450f42d7b0879da9e029f90a350c11bb4a0d64f341c370b0c`.
- I1-A introduced no My-Chat or Nurture product source, runtime, schema, migration,
  database, capability, deployment, activation, T-007/T-008, Pilot or traffic
  change. I1-B is eligible for a separate scope review only; it is not authorized or
  started. C30-I2/I3/I4 remain NO-GO.

## Explicit non-goals

- My-Chat signer/authenticator/nonce store, routes, APIs, schema or migrations.
- Nurture verifier, Participant binding, anchors/associations, schema or manifest.
- Subject presentation, domain action and protected interaction implementation in
  this first slice.
- Capability declaration/activation, Workspace allowlist, database work, secrets,
  deployment, T-007/T-008, Pilot or traffic.

## Execution handoff

```text
Goal: Implement only C30-I1-A trusted invocation contracts in My-Workflow-Base.
Constraints: Additive and neutral; no any; no runtime/database/Nurture values;
             preserve legacy contracts; do not start I1-B or C30-I2.
Relevant paths: workflow-contract types/schemas, conformance fixtures/tests,
                package export index, final workflow contract source lock.
Acceptance criteria: Section "I1-A acceptance" passes on an exact Base source
                     commit followed by its exact source-lock commit.
```
