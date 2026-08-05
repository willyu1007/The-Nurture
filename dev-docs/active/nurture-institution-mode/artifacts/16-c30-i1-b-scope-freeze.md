# C30-I1-B Canonical Binding Scope Freeze

## Decision

- Date: 2026-08-05
- Governance decision: `REUSE_TASK`
- Mapping: `M-002 > F-002 > T-002 nurture-institution-mode`
- Planning mode: Default-mode planning update against the existing roadmap SSOT
- Scope decision: `C30_I1_B_SCOPE_FROZEN`
- Current slice state: `I1_B_IN_PROGRESS / I1_B1_COMPLETE / I1_B2_UNAUTHORIZED`
- Cumulative state: `C30_I1_IN_PROGRESS / I1_A_ACCEPTED / I1_B1_COMPLETE`
- Downstream state: `I1_C_BLOCKED / C30_I2_NO_GO / C30_I3_NO_GO / C30_I4_NO_GO`

I1-B defines only the neutral canonical-object scenario-binding wire that later
owners may adopt. I1-B does not implement platform identity, scenario anchors,
database transactions, signing, runtime routes, activation, or product behavior.

## Inputs and precedence

The freeze merges these inputs in precedence order:

1. the user's instruction to review and freeze I1-B without starting later work;
2. the accepted I1-A Base contract at `ce7118c…` and source lock `bd69d19…`;
3. `docs/context/workflow/nurture-scenario-contract.md` and the current Pilot-0-C
   identity/binding decisions;
4. the T-029 donor disposition in
   `artifacts/13-c30-i0-b-t029-disposition.md`;
5. implementation inference limited to the smallest neutral contract surface.

There are no unresolved product decisions for I1-B. Concrete owner object kinds,
binding-slot values, Host endpoints, issuers, audiences, callers, credentials and
database representations remain later-owner decisions constrained by this wire.

## Conflict resolution with I1-A

Earlier planning embedded `caller`, `issuer`, `audience`, `operation`, timestamps,
nonce, key id and signature inside the identity-status request/result body. I1-A
supersedes that transport duplication:

- Scenario-private I1-B request payloads MUST be the registered
  `ScenarioPrivateInvocationV1.operation.input`.
- I1-A owns caller binding, issuer, audience, route/method, request identity,
  issued/expiry window and nonce.
- Service credentials, signing key metadata and signatures remain detached
  transport metadata outside the signed JSON body.
- I1-B bodies MUST NOT repeat or override any I1-A transport field.
- Response authentication/signing is an I2/I3 transport responsibility; I1-B
  freezes the strict response body only.

This resolution preserves the existing short-lived, signed, audience-bound owner
evidence requirement while preventing a second signing protocol.

## Exposure classes

| Class | Allowed wire | Forbidden exposure |
| --- | --- | --- |
| `host_owner_internal` | Canonical object refs, expected binding heads, typed scenario owner refs and committed binding refs needed for one atomic owner transaction. | MUST NOT cross the Scenario private boundary, appear in client/delivery/telemetry artifacts, or become Scenario persistence input. |
| `scenario_private` | Typed scenario owner refs, purpose, operation/command identities and non-reversible evidence hashes inside an I1-A invocation. | MUST NOT carry canonical object refs, platform binding refs/heads, membership refs, raw owner ids, PII, role, policy, Grant, dossier/body or embedded credential/signature fields. |

Base types and fixtures MUST preserve the distinction. A shared package export does
not make a `host_owner_internal` body safe for Scenario transport.

## Frozen primitives

### `ScenarioOwnerBindingRefV1`

```text
owner_binding_ref_version = 1
binding_slot              = registered bounded machine key
owner_ref                 = CanonicalRef
```

`owner_ref` identifies a scenario-owned, body-free binding endpoint. Base does not
hard-code its namespace or object type. A binding endpoint is routing and policy
input only; it grants no business read/write authority.

An owner-binding pair is exactly two `ScenarioOwnerBindingRefV1` values with
distinct `binding_slot` values, sorted lexicographically by `binding_slot`.

### Hash and identity fields

- Every `*_hash` is an exact lowercase SHA-256 value.
- Evidence hashes over protected owner facts MUST be produced by a non-reversible,
  owner-controlled keyed construction. Base validates shape, not key custody.
- `identity_operation_id`, `scenario_command_id` and request/result ids are bounded
  opaque values, not derived from canonical refs, PII, timestamps or attempt count.
- `canonical_input_hash` excludes I1-A request, trace, nonce and retry metadata so
  exact replay remains stable.

## Frozen wire families

### B1 — Scenario owner-endpoint reservation

Reservation is Scenario-private and exists only for a missing binding slot.

```text
ScenarioOwnerBindingReservationRequestV1
  reservation_request_version = 1
  identity_operation_id
  binding_slot
  canonical_object_evidence_hash
  canonical_request_hash

ScenarioOwnerBindingReservationResultV1
  reservation_result_version = 1
  identity_operation_id
  disposition = reserved | exact_replay
  owner_binding = ScenarioOwnerBindingRefV1
  reservation_version = non-negative integer
  reservation_evidence_hash
```

The request contains no canonical object ref. The Scenario treats
`canonical_object_evidence_hash` as opaque and uses the stable operation/request
identity only for exact reservation replay. Changed slot/hash is a conflict.

### B2 — Atomic canonical binding pair

The pair request/result is `host_owner_internal`.

```text
ScenarioCanonicalBindingExpectedHeadV1
  absent: state = absent
  bound:  state = bound
          binding_ref = CanonicalRef
          binding_version = non-negative integer
          owner_ref = CanonicalRef

ScenarioCanonicalBindingIntentV1
  binding_intent_version = 1
  binding_slot
  canonical_object_ref = CanonicalRef
  scenario_owner_ref = CanonicalRef
  expected_head = ScenarioCanonicalBindingExpectedHeadV1

ScenarioCanonicalBindingPairRequestV1
  pair_request_version = 1
  identity_operation_id
  workspace_ref = CanonicalRef
  scenario_key
  principal_provenance_hash
  continuation_context_hash
  pair_relation_evidence_hash
  canonical_input_hash
  bindings = exact ordered pair of ScenarioCanonicalBindingIntentV1

ScenarioCanonicalBindingResultItemV1
  binding_result_version = 1
  binding_slot
  canonical_object_ref = CanonicalRef
  scenario_owner_ref = CanonicalRef
  binding_ref = CanonicalRef
  binding_version = non-negative integer
  effect = created | reused

ScenarioCanonicalBindingPairResultV1
  pair_result_version = 1
  identity_operation_id
  canonical_input_hash
  disposition = committed | exact_replay
  bindings = exact ordered pair of ScenarioCanonicalBindingResultItemV1
  pair_commit_evidence_hash
```

The Host transaction MUST create all missing bindings or none. A bound expected head
must name the same `scenario_owner_ref` as the intent. Result slots and canonical/
owner refs must exactly match the request. `exact_replay` returns the original result;
changed payload, pair, principal, continuation context, expected head or owner ref is
a conflict, never a new operation.

### B3 — Current owner binding evidence

Current evidence is Scenario-private and is valid only within its enclosing I1-A
invocation.

```text
ScenarioCurrentOwnerBindingPairEvidenceV1
  binding_evidence_version = 1
  purpose_key
  owner_bindings = exact ordered pair of ScenarioOwnerBindingRefV1
  pair_relation_evidence_hash
  current_owner_evidence_hash
```

The enclosing I1-A principal workspace and route scenario are the sole Workspace and
Scenario bindings. The I1-A operation key is the invoked operation. The evidence
MUST NOT add nested workspace/scenario/operation, validity, nonce, key or signature
fields. The evidence expires with the I1-A invocation and cannot be cached to fill an
owner outage or reused for another purpose.

The Host computes `current_owner_evidence_hash` over the exact current canonical
objects, binding heads, pair relationship and required adult-owner relation. The
Scenario treats that digest as opaque and still rereads its own association and
business authority graph.

### B4 — Writer-fenced Scenario commit status lookup

The request is Scenario-private inside I1-A. The strict result body is signed by the
later isolated response transport without embedding key/signature fields.

```text
ScenarioIdentityOperationStatusLookupRequestV1
  status_lookup_request_version = 1
  identity_operation_id
  owner_bindings = exact ordered pair of ScenarioOwnerBindingRefV1
  association_expectation_hash
  scenario_command_id
  scenario_command_hash
  principal_provenance_hash
  host_identity_evidence_hash
  deadline_evidence_hash
  attempt_ledger_hash

ScenarioIdentityOperationStatusLookupResultV1
  common:
    status_lookup_result_version = 1
    identity_operation_id
    scenario_command_id
    checked_at = canonical UTC instant
    request_nonce_hash
    status
  committed:
    status = committed
    scenario_execution_ref = CanonicalRef
    scenario_commit_evidence_hash
  confirmed_no_effect:
    status = confirmed_no_effect
    no_effect_fence_evidence_hash
  unknown:
    status = unknown
    reason_code = lock_timeout | possible_inflight |
                  owner_unavailable | compatible_evidence_ambiguous
```

Each result variant forbids every field owned by the other variants. `unknown` is a
nonterminal quarantine result and MUST block replacement work. The Base codec validates
the closed union only. I2/I3 runtime must prove the writer fence, terminal attempts,
deadline/skew and absence predicates before returning `confirmed_no_effect`.

## Structural validation contract

Base TypeScript assertions and JSON Schemas MUST enforce:

- exact fields, required members, no null substitution and no unknown fields;
- exact pair cardinality, distinct slots and deterministic slot ordering;
- bounded machine keys/opaque ids, canonical refs, non-negative versions,
  lowercase hashes and canonical UTC instants;
- closed expected-head, disposition, effect, status and reason unions;
- request/result identity, slot, canonical-ref and owner-ref parity in runtime
  cross-object tests;
- bound expected-head owner equality with the requested scenario owner ref;
- Scenario-private schemas contain no canonical object, binding/head, membership,
  PII, role/policy/Grant/body, credential, key or signature fields;
- Host-internal canonical object refs cannot be passed to a Scenario-private codec.

Only operation-specific payload validation is delegated. No I1-B codec performs
signature, current-time, nonce-store, registry, owner-lifecycle, membership,
transaction, writer-fence, business-authority or database checks.

## Legal and illegal fixture matrix

Positive fixtures MUST cover:

1. reserve one owner endpoint and exact-replay the reservation;
2. reuse both bindings;
3. reuse slot A and create slot B;
4. create slot A and reuse slot B;
5. create both bindings in one result;
6. current owner evidence with exactly two typed owner refs;
7. `committed`, `confirmed_no_effect` and `unknown` status results.

Negative fixtures MUST cover:

- one/three pair members, duplicate or unsorted slots;
- wrong/missing canonical or owner refs, mismatched expected owner/head/version;
- partial pair result, request/result id/hash/ref drift and changed replay payload;
- raw canonical object/binding/membership refs or ids in Scenario-private bodies;
- role, stewardship, policy, Grant, dossier, PII or protected body fields;
- embedded caller/issuer/audience/route/time/nonce/key/signature fields;
- malformed hashes/ids/versions/timestamps, null substitution and unknown fields;
- mixed status-variant fields, unsupported reason codes and `unknown` treated as
  no-effect/terminal success.

## Expected Base impact

| Area | Planned impact |
| --- | --- |
| `templates/host-runtime/packages/workflow-contracts/src/types/` | Add binding primitives, request/result/evidence/status types and strict assertions; reuse `CanonicalRef` and I1-A invocation types. |
| `templates/host-runtime/packages/workflow-contracts/schemas/` | Add version-1 schemas for reservation, pair request/result, current evidence and status request/result. |
| `conformance/fixtures/` and `conformance/tests/` | Add neutral legal-branch, parity, exposure-boundary, replay and three-state recovery fixtures. |
| Package export/source lock | Export additive contracts; refresh the exact TypeScript source lock only after the source/test population stabilizes. |

No Base runtime template, scenario starter, legacy federation type, manifest,
package version, activation schema or umbrella capability is removed or promoted in
I1-B. Dependency/source convergence remains I1-F.

## Ordered implementation units

1. `I1-B1`: owner-binding ref plus reservation request/result.
2. `I1-B2`: Host-internal atomic pair request/result and cross-object parity tests.
3. `I1-B3`: Scenario-private current evidence and writer-fenced status bodies.
4. `I1-B4`: complete Schema/codec parity, exposure negatives, Base verification and
   exact source-lock seal.

Each unit is additive. No unit opens I1-C or C30-I2; I1-B exits only when all four
units pass together on one exact Base source/lock chain.

## Acceptance criteria

1. Types compile without `any`, Host/Scenario runtime imports or product-specific
   object/slot values.
2. JSON Schemas and TypeScript assertions accept the same neutral positives and
   reject the same structural negatives.
3. All four legal pair-resolution branches and reservation replay are represented.
4. Host-internal versus Scenario-private exposure tests prove raw canonical and
   binding identities cannot cross the private boundary.
5. Three-state recovery is closed, body-free and fail-closed; no Base result claims
   the runtime writer fence was actually acquired.
6. Existing I1-A and legacy fixtures remain valid and unchanged.
7. Full Base typecheck/build/conformance, canonical-ref lint, consumer boundaries,
   deterministic rerun and exact source-lock verification pass.
8. Exact T-002 Base source/lock commits are recorded; I1-C and C30-I2 remain
   unstarted/NO-GO.

## Explicit non-goals

- My-Chat Child/Family types, slot values, tables, migrations, repositories, APIs,
  binding transaction, membership policy, signer, key, nonce store or routes.
- Nurture Child/Family anchor types, reservation algorithm, associations,
  Participant/Guardian binding, `CommandExecution`, writer fence, database or route.
- Concrete issuer, audience, caller, endpoint, operation, capability or registry
  values.
- Subject discovery/presentation, domain action, protected interaction,
  Notification continuity, activation/admission or source convergence.
- Schema apply, PostgreSQL, deployment, capability activation, T-007/T-008, Pilot
  or traffic.

## Execution controls

- Blast radius: the planned Base type/schema/conformance/export/source-lock paths
  only; dependency metadata changes require a separate finding and approval.
- Idempotency: fixtures, codecs, schemas and source-lock generation MUST be
  deterministic and leave no tracked output after a repeated green run.
- Rollback: revert the exact source-lock commit and then the I1-B source commit.
  No consumer/runtime/database compensation exists because adoption is out of scope.
- Authorization gate: this freeze authorizes no implementation. A separate user
  instruction is required before `I1-B1` begins.

Post-freeze checkpoint: the user separately authorized I1-B1 on 2026-08-05. Its
exact Base source/verification record is
`17-c30-i1-b1-implementation-record.md`. This does not amend the frozen wire or
authorize I1-B2 through B4.

## Execution handoff

```text
Goal: Implement only C30-I1-B canonical-object binding envelope contracts in Base.
Constraints: Additive; neutral; no any; preserve I1-A/legacy; keep Host-internal
             canonical refs out of Scenario-private bodies; no runtime/database/
             product values; do not start I1-C or C30-I2.
Relevant paths: workflow-contract types/schemas, conformance fixtures/tests,
                package export index, final workflow contract source lock.
Acceptance criteria: Section "Acceptance criteria" passes on an exact Base source
                     commit followed by its exact source-lock commit.
```
