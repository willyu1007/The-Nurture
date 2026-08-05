# C30-I1-D Domain Action Scope Freeze

## Decision

- Date: 2026-08-05
- Governance decision: `REUSE_TASK`
- Mapping: `M-002 > F-002 > T-002 nurture-institution-mode`
- Entry: C30-I1-A/I1-B/I1-C accepted; current Base source
  `ae0c35709f0798abb7b0a2a365805b76ba9f5cd4` plus source lock
  `3c30337eabe012eb936e91eec5c9d421463e67c7`
- State: `I1_D_SCOPE_FROZEN / IMPLEMENTATION_NOT_AUTHORIZED`
- Downstream: `I1_E_BLOCKED / I1_F_BLOCKED / C30_I2_NO_GO / ACTIVATION_NO_GO`

This review freezes only the neutral My-Workflow-Base domain-action contract
surface. It authorizes no Base source, My-Chat or Nurture consumer, manifest,
runtime, schema, database, capability, deployment, activation or traffic change.

Three review decisions are normative:

1. The Base-neutral driver names are exactly
   `scenario_direct_empty_v1|workflow_claimed_step_v1`. The earlier planning label
   `nurture_direct_empty_v1` is superseded as a shared-contract spelling without
   changing direct-empty product semantics.
2. Both canonical effect-identity input branches explicitly include
   `scenario_key`. Direct identity therefore binds Workspace, scenario, action and
   submit context; claimed identity binds Workspace, scenario, action and the
   original Workflow Step.
3. I1-D defines standalone wire types, strict codecs, JSON Schemas and neutral
   conformance only. Manifest dependency/capability convergence, legacy/vNext
   atomic exclusion and the separately named `scenario_domain_action_source_v1`
   identity remain C30-I1-F scope.

## Purpose and ownership

I1-D closes the reusable action wire between an I1-C prepare-only action offer and
one exact owner execution/recovery path. It does not implement an action.

- Base owns neutral data types, structural and contextual assertions, JSON Schemas,
  neutral fixtures and conformance.
- My-Chat later owns authenticated dispatch, Host-established authentication
  assurance, content-free Step persistence, claim lifecycle, scheduling,
  `complete_step`, Handoff/Outbox materialization and public progress.
- Nurture later owns Participant/role/subject/target/policy resolution, submit
  context issuance, canonical payload hashing, business-effect identity,
  CommandExecution, transaction atomicity, snapshots and current presenters.
- The client owns only bounded echo fields. It never authors an Actor, action
  contract, driver, command/effect identity, Step, claim, execution or result ref.

Family-care `ActionExecution` remains product action semantics. A
`workflow_claimed_step_v1` driver is a My-Chat runtime compatibility seam and does
not reclassify the product action as an InstitutionWorkflow.

## Exposure zones

Every I1-D value belongs to exactly one exposure zone:

| Zone | Allowed values | Forbidden values |
| --- | --- | --- |
| Client echo | action key/prepare locator/input during prepare; submit token, exact confirmation and client mutation id during submit | principal, Participant, role, owner scope, driver, command/effect identity, Step, claim, assurance, Execution, output/snapshot refs |
| Host-to-Scenario private invocation | verified I1-A principal/route/request plus the exact I1-D operation input and optional Host-established assurance evidence | credential, signature, session, raw authentication secret, arbitrary metadata or product authority supplied by the client |
| Host worker private driver | exact original Step ref, contract assertion hash, transient claim token and expected Step version | action input/body, submit token, owner target/version, InteractionContext ref, snapshot, Handoff draft or inferred business state |
| Server-only result/recovery | effect-identity inputs, canonical payload hash, Execution/output refs, exact snapshots and binding evidence | client URL/route state, Chat transcript, Notification/provider payload, analytics, metrics or durable public shell |

Structural validity never moves a value to another zone. Later adapters MUST use
separate DTOs rather than projecting a broad internal object by field omission.

## Frozen contract declaration

```ts
type ScenarioDomainActionDriverV1 =
  | "scenario_direct_empty_v1"
  | "workflow_claimed_step_v1";

type ScenarioDomainActionContractV1 = {
  action_contract_version: 1;
  scenario_key: string;
  action_key: string;
  input_schema_key: string;
  input_schema_version: number;
  target_ref_class: string;
  confirmation_class: "explicit" | "strong_authorization";
  entitled_ingress_keys: string[];
  handler_key: string;
  command_contract: {
    command_key: string;
    command_contract_version: number;
  };
  driver: ScenarioDomainActionDriverV1;
};
```

The entry is the complete static identity of one `(scenario_key, action_key)`
contract. Driver MUST NOT vary by surface, recipient count, current snapshot count,
`applied|already_satisfied`, `executed|replayed`, owner/provider availability,
latency or retry path.

`entitled_ingress_keys` are registered I1-A ingress keys, not UI routes or role
names. The array is non-empty, unique and lexicographically ordered. I1-D validates
the standalone entry only. I1-F later validates manifest references, capability
dependencies, handler registration and atomic legacy/vNext behavior.

The Base type has no capability/source dependency field, Participant/role, raw
target id, database model, runtime queue or activation value. Base source/defaults
and neutral fixtures contain no Nurture product or registry value and MUST use
invented scenario/action/command/ingress names. Later Scenario-owned registry
entries may populate the generic keys only after their own adoption gate.

## Frozen prepare wire

The I1-C `ScenarioActionTargetRefV1` remains a prepare-only locator. I1-D consumes
the accepted export and does not redefine its syntax or authority.

```ts
type PrepareScenarioDomainActionInputV1 = {
  prepare_version: 1;
  action_key: string;
  target_ref: ScenarioActionTargetRefV1;
  expected_version?: string;
  action_input: Record<string, unknown>;
};

type ScenarioDomainActionConfirmationPromptV1 = {
  confirmation_class: "explicit" | "strong_authorization";
  prompt: ScenarioSafeTextV1;
};

type PrepareScenarioDomainActionResultV1 =
  | {
      status: "prepared";
      submit_token: string;
      confirmation: ScenarioDomainActionConfirmationPromptV1;
      issued_at: string;
      expires_at: string;
    }
  | { status: "context_changed"; safe_reason: ScenarioSafeReasonV1 }
  | { status: "unavailable"; safe_reason: ScenarioSafeReasonV1 };
```

The outer prepare codec owns the exact fields and requires `action_input` to be a
JSON object. The registered action codec identified by the contract owns every
nested input field and MUST reject unknown, malformed or forbidden fields before a
submit context is issued. Base does not guess a Scenario input schema.

A successful prepare repeats current Host principal/Workspace/ingress gates and
current Scenario owner resolution, then issues one owner-side `submit_action`
context with a maximum five-minute lifetime. It creates no CommandExecution,
business mutation, Step, Handoff, Outbox, Notification, provider effect or durable
public result. The result intentionally does not echo action input, target, expected
version, owner scope or command/driver identity.

Protected draft/body storage, encryption, retention and offline behavior remain
I1-E. I1-D fixtures MUST use body-free neutral inputs.

## Frozen submit echo and Host assurance

Client echo and Host-established assurance are separate structures:

```ts
type ScenarioDomainActionSubmitEchoV1 = {
  submit_version: 1;
  submit_token: string;
  confirmation: "confirmed";
  client_mutation_id: string;
};

type ScenarioAuthenticationAssuranceEvidenceV1 = {
  assurance_evidence_version: 1;
  assurance_class: string;
  principal_binding_hash: string;
  ceremony_evidence_hash: string;
  verified_at: string;
  expires_at: string;
};

type SubmitScenarioDomainActionInputV1 = {
  submit_request_version: 1;
  client_echo: ScenarioDomainActionSubmitEchoV1;
  authentication_assurance?: ScenarioAuthenticationAssuranceEvidenceV1;
};
```

The client echo contains exactly the four displayed fields, including the version
field.
Action, target, expected version, input, principal, Participant, role, owner scope,
driver, command/effect identity, Step, draft, snapshot, claim and assurance are
forbidden inside `client_echo`.

My-Chat constructs the outer private request only after verifying the client echo.
For an `explicit` contract, `authentication_assurance` MUST be absent. For a
`strong_authorization` contract, `authentication_assurance` MUST be present,
current, bound to the exact I1-A principal and no later than the submit-context
expiry. The assurance is body-free hash/time evidence of a registered
authentication ceremony and contains no credential, session, factor detail, device
biometric result or authorization conclusion.
Nurture must still repeat current owner authorization and explicit confirmation.

`client_mutation_id` is Host request deduplication only and is excluded from
business effect identity and canonical payload hash.

## Frozen Workflow Step reference and assertion

```ts
type ScenarioDomainActionWorkflowStepRefV1 = {
  schema_version: 1;
  namespace: "my_chat";
  object_type: "workflow_step";
  object_id: string;
};

type ScenarioDomainActionClaimedStepAssertionV1 = {
  step_assertion_version: 1;
  workflow_step_ref: ScenarioDomainActionWorkflowStepRefV1;
  workspace_ref: CanonicalRef;
  principal_provenance_hash: string;
  scenario_key: string;
  action_key: string;
  handler_key: string;
  action_contract_hash: string;
  driver: "workflow_claimed_step_v1";
  client_mutation_id: string;
  request_correlation_hash: string;
};
```

The assertion is content-free and describes the exact Host-persisted original Step
in `awaiting_scenario_binding`. It contains no submit token, target/version,
action input/body, InteractionContext ref, claim token, Handoff draft, snapshot,
business ref or inferred Scenario state. The Workspace ref MUST be exact
`my_chat/workspace`; the Step ref has no mutable aggregate version.

The Step is non-claimable until exact Scenario binding succeeds. Persisting the
assertion or Step alone creates no Scenario fact and grants no action authority.

## Frozen claimed-Step binding and body-free recovery

```ts
type BindScenarioDomainActionStepInputV1 = {
  step_binding_version: 1;
  submit: SubmitScenarioDomainActionInputV1;
  step_assertion: ScenarioDomainActionClaimedStepAssertionV1;
};

type BindScenarioDomainActionStepResultV1 =
  | {
      status: "bound" | "exact_replay";
      workflow_step_ref: ScenarioDomainActionWorkflowStepRefV1;
      binding_evidence_hash: string;
      context_expires_at: string;
    }
  | { status: "request_conflict"; safe_reason: ScenarioSafeReasonV1 }
  | { status: "unavailable"; safe_reason: ScenarioSafeReasonV1 };

type LookupScenarioDomainActionStepBindingInputV1 = {
  binding_lookup_version: 1;
  workflow_step_ref: ScenarioDomainActionWorkflowStepRefV1;
};

type LookupScenarioDomainActionStepBindingResultV1 =
  | {
      status: "bound";
      workflow_step_ref: ScenarioDomainActionWorkflowStepRefV1;
      binding_evidence_hash: string;
      context_expires_at: string;
    }
  | { status: "not_bound" }
  | { status: "unavailable"; safe_reason: ScenarioSafeReasonV1 };

type ScenarioDomainActionClaimedStepDriverV1 = {
  claimed_driver_version: 1;
  workflow_step_ref: ScenarioDomainActionWorkflowStepRefV1;
  action_contract_hash: string;
  claim_token: string;
  expected_step_version: number;
};
```

Binding validates the active submit context, exact confirmation/assurance and the
Host Step assertion. It stores an immutable binding to one original Step but MUST
NOT consume the submit context, commit a business effect, create an Execution or
snapshot, or extend the original expiry. Exact rebind is idempotent; any different
Step, contract, principal, Workspace, scenario, action or payload conflicts.

The lookup is body-free and token-free. It exists only to recover a binding whose
response was lost before My-Chat published the Step as claimable. `not_bound` is not
proof of no business effect and cannot authorize a replacement Step.

The claimed driver is transient worker evidence. `claim_token` and
`expected_step_version` may rotate on same-Step reclaim and MUST NOT enter Scenario
persistence, effect/payload hashes, logs, traces, metrics, Handoff, Outbox,
Notification, crash evidence or Admin views.

## Frozen canonical effect-identity inputs

```ts
type ScenarioDomainActionEffectIdentityInputV1 =
  | {
      effect_identity_version: 1;
      driver: "scenario_direct_empty_v1";
      workspace_ref: CanonicalRef;
      scenario_key: string;
      action_key: string;
      submit_context_ref: CanonicalRef;
    }
  | {
      effect_identity_version: 1;
      driver: "workflow_claimed_step_v1";
      workspace_ref: CanonicalRef;
      scenario_key: string;
      action_key: string;
      original_workflow_step_ref: ScenarioDomainActionWorkflowStepRefV1;
    };

type ScenarioDomainActionExecutionBindingV1 = {
  execution_binding_version: 1;
  effect_identity: ScenarioDomainActionEffectIdentityInputV1;
  canonical_payload_hash: string;
};
```

These are server-only identity inputs, not client command ids or an authorization
grant. Base validates structure and cross-branch exclusions but does not compute an
effect id or canonical payload hash. Nurture later owns the domain-separated hash
implementation.

The owner derivation is normatively equivalent to:

```text
direct inputs  = workspace_ref + scenario_key + action_key + submit_context_ref
claimed inputs = workspace_ref + scenario_key + action_key + original_workflow_step_ref
```

The canonical payload hash MUST cover command key/version, typed owner business
actor, owner scope/target/expected versions, canonical registered input, submit
context, static driver and original Step for claimed execution. It MUST exclude
surface, `client_mutation_id`, transport nonce, request/correlation/trace ids,
authentication-assurance hashes, claim token, expected Step version, lease,
attempt, provider state and current presenter state.

Changed immutable payload or Actor/Workspace/scenario/action/target/context/Step
under the same effect identity is `request_conflict`. Mutable attempt evidence may
change only where explicitly excluded.

## Frozen private execution result

```ts
type ScenarioDomainActionBusinessOutcomeV1 =
  | "applied"
  | "already_satisfied";

type ScenarioDomainActionExecutionDispositionV1 =
  | "executed"
  | "replayed";

type ScenarioDomainActionExecutionResultV1 =
  | {
      status: "committed";
      disposition: ScenarioDomainActionExecutionDispositionV1;
      business_outcome: ScenarioDomainActionBusinessOutcomeV1;
      execution_ref: CanonicalRef;
      output_refs: CanonicalRef[];
      handoff_request_snapshots: ScenarioHandoffRequestSnapshot[];
    }
  | {
      status: "not_committed";
      decision: "invalid_request" | "request_conflict" | "rate_limited";
      safe_reason: ScenarioSafeReasonV1;
    }
  | { status: "outcome_unknown"; safe_reason: ScenarioSafeReasonV1 };
```

This result is server-only. `execution_ref`, `output_refs` and snapshot refs never
enter client payloads, URLs, route state, Chat, Notification/provider payloads,
analytics or query dimensions.

For `scenario_direct_empty_v1`, a committed result MUST contain
`handoff_request_snapshots=[]`; there is no Step, Handoff driver, Handoff, Outbox or
Notification. For `workflow_claimed_step_v1`, snapshots remain bound to the exact
original Step even when the array is empty. A different new Step that independently
commits `already_satisfied` MUST store `[]` and cannot copy or rematerialize the
original Step seed.

`disposition` describes this invocation and never changes persisted
`business_outcome`. Exact replay returns byte-equivalent output refs and snapshots.
A retry cannot claim to be the original performer, approver, owner or joint
consenter.

## Frozen public progress and current-result shell

```ts
type ScenarioDomainActionCurrentResultV1 =
  | { state: "changed" }
  | { state: "already_current" }
  | {
      state: "processed_but_unavailable";
      safe_reason: ScenarioSafeReasonV1;
    };

type SubmitScenarioDomainActionResultV1 =
  | { status: "accepted" }
  | {
      status: "completed";
      current_result: ScenarioDomainActionCurrentResultV1;
    }
  | { status: "context_changed"; safe_reason: ScenarioSafeReasonV1 }
  | { status: "unavailable"; safe_reason: ScenarioSafeReasonV1 };
```

The public shell contains no driver, command/effect identity, Execution, output,
Step, claim or snapshot ref. A direct contract may return `completed` only after its
owner transaction commits. A claimed contract returns `accepted` only after exact
binding and durable Host scheduling, then later owner-rehydrates `completed`.
Latency cannot change one action between public modes.

The shell does not cache business objects. A current I1-C presenter supplies the
actual owner-safe view. Losing direct replay identity permits only ordinary current
presentation. Claimed recovery uses the original Host Step. I1-D defines no generic
`open_result`, probe command or replacement-Step protocol.

## Bounds and validation

| Value | Frozen bound |
| --- | --- |
| Machine keys | 1-128 characters; accepted Base machine-key grammar |
| `entitled_ingress_keys` | 1-16 unique, lexicographically ordered keys |
| Registered `action_input` | JSON object; at most 32 KiB UTF-8 before the stricter registered action bound |
| Prepare/submit/assurance tokens and hashes | Existing strict opaque-token or lowercase SHA-256 grammar as applicable |
| `client_mutation_id` | 1-128 bounded opaque characters; Host dedupe only |
| Submit-context and assurance lifetime | greater than zero and at most five minutes |
| `output_refs` | at most 32 server-only canonical refs |
| `handoff_request_snapshots` | at most 32 refs-only snapshots; direct requires exactly zero |
| Private execution result | at most 64 KiB UTF-8 |
| Public submit result | at most 8 KiB UTF-8 |

All objects are closed. All timestamps are canonical UTC instants. Assertions own
cross-field lifetime, contract/driver/result compatibility, ordered uniqueness and
serialized-size checks that JSON Schema cannot express portably.

Schema/codec parity and contextual negatives MUST cover:

- unknown/missing fields, wrong discriminators, invalid keys/hashes/refs/times,
  array overflow/duplicates/order and output-size overflow;
- prepare target/action/schema mismatch, delegated input codec failure, stale or
  cross-principal/Workspace/scenario/ingress target and extra client authority;
- assurance inside client echo, assurance missing for strong, assurance present for
  explicit, wrong principal binding, expiry and assurance-as-authorization;
- client driver/command/effect/Step/claim/snapshot fields and every broad metadata
  or extension object;
- recipient/outcome/surface/failure-based driver switching, any third driver and
  claimed-to-direct downgrade when snapshots are empty;
- claim before bind, nonexistent/unpublished/wrong Step, changed contract or
  payload, exact-rebind drift and binding that consumes/extends the context;
- direct non-empty snapshots/Step/Handoff fields, claimed wrong-Step replay,
  different-Step seed transfer and changed-payload exact-replay conflict;
- public leakage of execution/output/snapshot/Step/driver/internal reason and
  private leakage of token/body/target/claim into persisted Step evidence;
- attempt-only evidence incorrectly entering effect identity or payload hash;
- invitation, provisioning, portability or Technical Operator protocols disguised
  as an ordinary domain action or third driver.

## Donor and current-source disposition

| Candidate | Disposition | Reason |
| --- | --- | --- |
| I1-C `ScenarioActionTargetRefV1`, safe copy/reason and action confirmation literals | `REUSE` | Accepted prepare-only primitives; I1-D consumes rather than forks them. |
| Existing `ScenarioHandoffRequestSnapshot` | `REUSE_WITH_I1_D_BOUNDS` | Refs-only result seed; direct is exact empty and claimed is original-Step-bound. |
| Base `WorkflowActionAvailability` | `NEGATIVE_DONOR` | Raw Run-level targets and execution semantics cannot become domain-action wire. |
| Base `ScenarioCommandDriverContext` | `REWORK` | Useful transient-claim boundary, but legacy capability/entrypoint fields and broad driver semantics are not the frozen action contract. |
| Existing federation command envelope/receipt | `NEGATIVE_DONOR` | Client command/idempotency and required Run/Step semantics conflict with prepare context and static direct/claimed identity. |
| T-029 B01/B05 | `REWORK` | Closed codec/replay mechanisms are reusable ideas only; product policy and umbrella source semantics are excluded. |
| My-Chat/Nurture current runtime and Prisma shapes | `NEGATIVE_DONOR_FOR_I1_D` | Runtime/storage/typed actor/transaction adoption begins only in I2/I3 after Base acceptance. |

Zero donor file is approved for direct merge.

## Planned Base impact

| Area | Frozen future impact |
| --- | --- |
| `templates/host-runtime/packages/workflow-contracts/src/types/` | Add neutral domain-action types and strict structural/contextual assertions; consume accepted I1-A/I1-C exports. |
| `templates/host-runtime/packages/workflow-contracts/schemas/` | Add matching closed version-1 Schemas for contract, prepare/submit, assurance, Step binding/recovery, identity and result families. |
| `conformance/fixtures/` and `conformance/tests/` | Add neutral positive/negative, parity, static-driver, exposure, changed-payload, wrong-Step and recovery populations. |
| Package export index | Export only the frozen neutral public/private wire types and assertions; no runtime implementation. |
| Contract source lock | Refresh only in I1-D5 after the accepted D1-D4 source/test population is final. |

I1-D MUST NOT modify Base workflow runtime templates, Scenario starter runtime,
manifest types/Schemas/validators, dependency/source identities or capabilities.
Those manifest/source convergence changes remain I1-F. It also changes no My-Chat
or Nurture source, schema, migration, database or registry value.

## Ordered implementation units

| Unit | Scope | Entry | Exit |
| --- | --- | --- | --- |
| `I1-D1` contract and common primitives | Neutral driver, action contract, exact Step ref/assertion primitives, keys/bounds and exposure-class tests. | This freeze accepted. | Standalone contract Schema/codec and static-driver negatives pass; no prepare/submit wire. |
| `I1-D2` prepare, submit and assurance | Prepare input/result, strict client echo, Host-private assurance wrapper, expiry and delegated-codec boundaries. | D1 accepted. | Prepare/submit Schema/codec parity and authority/leakage negatives pass; no execution result or Step binding. |
| `I1-D3` identity and result | Both effect-identity branches, execution binding/hash evidence, private execution result and public progress/current shell. | D2 accepted. | Result layering, direct-empty, payload-drift and public-exposure negatives pass. |
| `I1-D4` claimed-Step binding and recovery | Bind/rebind, body-free lookup, transient claimed driver and cross-wire contextual validation. | D3 accepted. | Wrong-Step/driver, crash-window, expiry, same-Step replay and different-Step seed-transfer negatives pass. |
| `I1-D5` cumulative qualification | Full Base verification, deterministic build/manifest, exact source-lock seal and scope audit; adds no wire. | D1-D4 accepted. | Cumulative I1-D is accepted at one exact source plus metadata-only source lock. |

No unit starts automatically. Each source unit requires later explicit
authorization. I1-D5 acceptance opens only a separate I1-E scope-review decision;
it does not open implementation, I1-F, C30-I2 or activation.

## Cumulative acceptance matrix

I1-D acceptance requires all of the following:

1. TypeScript compiles without `any`, Host runtime or Scenario product imports.
2. Every public/private union is closed and JSON Schema/runtime assertion behavior
   aligns for neutral fixtures.
3. The accepted I1-C action offer remains prepare-only; no submit or command
   authority is added to presentation.
4. The static driver is invariant across surfaces, recipients, business outcomes,
   replay and failures; only the two neutral driver values exist.
5. Prepare is zero-effect, submit echo is exact, and Host assurance is separate,
   body-free and non-authoritative.
6. Direct execution has no Step/Handoff path and persists explicit empty snapshots.
7. Claimed execution uses content-free non-claimable Step -> immutable binding ->
   claim; only the original Step can replay a non-empty seed.
8. Both effect-identity branches include `scenario_key`; client/attempt evidence is
   excluded and changed immutable payload conflicts.
9. Persisted business outcome, invocation disposition, current owner state and Host
   progress remain four distinct vocabularies with no execution/ref leakage.
10. Legacy fixtures remain unchanged; no manifest, capability, dependency/source
    convergence, runtime, database, consumer adoption or fallback is inferred.
11. Full Base qualification, repeated deterministic outputs and exact source lock
    pass in I1-D5. C30-I2 remains NO-GO until I1-A through I1-F all pass.

## Rollback and invalidation

Each future unit MUST be committed separately. Rollback reverses the metadata-only
I1-D5 source lock first, then D4, D3, D2 and D1 as needed. No database, runtime or
consumer compensation exists because this freeze authorizes Base contract source
only after a later gate and authorizes no adoption.

Any change to a wire field, exposure zone, driver name/meaning, direct/claimed
effect-identity inputs, submit-context lifetime, public/private result vocabulary,
Step-binding recovery ownership, Base impact list or the I1-F deferral invalidates
this freeze and requires renewed scope review before source work continues.

## Verification and effect boundary

- Review inputs: accepted I1-A/I1-B/I1-C exports and source lock, C-3-0d
  architecture/schema/test/readiness decisions, T-029 disposition, product
  terminology contract and current Base contract population.
- Expected documentation checks: strict task-doc/anchor lint, governance sync/lint,
  strict Context verification and `git diff --check`.
- No build, Prisma generate, database connection/apply, one-time PostgreSQL,
  deployment, capability, activation, T-008, Pilot or traffic action belongs to
  this documentation-only freeze.

## Next gate

The only eligible next action is a separately authorized `I1-D1` Base contract
implementation. I1-D2 through I1-D5, I1-E/I1-F, all consumers and C30-I2 remain
unauthorized until their own gates are satisfied.

```text
Goal: Implement only C30-I1-D1 neutral domain-action contract/common primitives.
Constraints: Use scenario_direct_empty_v1|workflow_claimed_step_v1; include
             scenario_key in both effect-identity input branches; no any;
             no manifest/runtime/database/consumer/source-convergence change;
             do not start I1-D2 or I1-E.
Relevant paths: workflow-contract domain-action types/assertions/Schemas,
                neutral conformance fixtures/tests and package export index.
Acceptance: D1 row plus cumulative invariants that already apply to D1 pass;
            the existing source lock remains intentionally stale until I1-D5.
```
