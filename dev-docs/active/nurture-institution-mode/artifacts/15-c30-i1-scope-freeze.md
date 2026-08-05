# C30-I1 Scope Freeze

## Decision

- Date: 2026-08-05
- Governance decision: `REUSE_TASK`
- Mapping: `M-002 > F-002 > T-002 nurture-institution-mode`
- Overall state: `C30_I1_SCOPE_FROZEN / I1_A_READY_NOT_STARTED`
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
| `C30-I1-A` trusted invocation contract spine | Human principal, registered ingress context and exact private invocation envelope; strict structural codecs/Schemas/negative fixtures. | `C30-I0` complete. | Accepted Base source and conformance commit; no Host/scenario adoption. |
| `C30-I1-B` canonical-object binding envelope | Neutral typed owner refs, pair-binding request/result/recovery and current-owner evidence without platform Child/Family policy. | I1-A accepted. | Binding wire/codecs/Schemas pass; owner semantics remain I2/I3. |
| `C30-I1-C` subject presentation | Subject-context discovery/resolve, semantic presentation, navigation/action offers and safe owner text. | I1-B accepted. | Presentation types/codecs/Schemas/bounds/fixtures pass. |
| `C30-I1-D` domain action | Prepare/submit, direct-empty versus claimed-Step driver, result/recovery and canonical effect-identity inputs. | I1-C accepted. | Action contracts and replay/changed-payload/wrong-driver negatives pass. |
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
| `conformance/fixtures/` and `conformance/tests/` | Add neutral positive, legacy-compatible and closed negative fixtures; prove schema/codec parity. |
| Source lock | Regenerate only after the accepted source/test population is final. |

No current federation type, legacy manifest, runtime template, scenario starter,
package version or umbrella capability is removed in I1-A. Their convergence and
replacement are owned by later I1 slices, especially I1-F.

### Execution controls

- Blast radius: only the planned Base workflow-contract type/schema/conformance
  paths and the final contract-source lock may change.
- Idempotency: codec/schema tests and source-lock generation MUST be deterministic;
  repeated verification may change no tracked file after the lock is current.
- Rollback: revert the single separately attributable Base I1-A commit. No Host or
  scenario consumer may adopt I1-A before its acceptance commit, so rollback
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
6. The resulting commit is exact and separately attributable to T-002; C30-I2 stays
   NO-GO until all I1-A through I1-F exits pass.

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
Acceptance criteria: Section "I1-A acceptance" passes on one exact Base commit.
```
