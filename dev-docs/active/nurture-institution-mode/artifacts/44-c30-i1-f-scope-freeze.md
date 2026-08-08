# C30-I1-F Dependency and Source Convergence Scope Freeze

## Decision

- Date: 2026-08-06
- Governance decision: `REUSE_TASK`
- Mapping: `M-002 > F-002 > T-002 nurture-institution-mode`
- Entry: C30-I1-A through I1-E accepted; current Base source
  `48fd3d65b34a1dd7a6b1e85713fca81f7c9da171`, metadata lock
  `9abde2b994f6528fc5afb26125eb029ed6027237` and source hash
  `be6fd80042a2998688dbeeaa6b4161ef80482d51eac413cfc0a53eaf2491fb7d`
- State: `I1_F_SCOPE_FROZEN / IMPLEMENTATION_NOT_AUTHORIZED`
- Downstream: `I1_F1_SEPARATE_AUTHORIZATION_REQUIRED / C30_I2_NO_GO /
  CONSUMER_ADOPTION_NO_GO / ACTIVATION_NO_GO`

This decision freezes only the final neutral My-Workflow-Base convergence slice.
It changes no Base source and authorizes no implementation, consumer adoption,
runtime, database, capability enablement, deployment, activation, T-008, Pilot or
traffic work.

Five decisions are normative:

1. I1-F introduces one optional `scenario_contracts` manifest area. A manifest
   without the area remains legacy and behaviorally unchanged. Once the area is
   present, its declaration is closed and every declared capability is complete;
   partial declaration is fatal.
2. The four reusable Host capabilities are exactly
   `trusted_scenario_invocation_v1`, `scenario_subject_presentation_v1`,
   `scenario_domain_action_execution_v1` and
   `scenario_protected_interaction_v1`. Their dependency sets are exact and
   cannot be weakened, reordered into a different semantic graph or replaced by
   an umbrella capability.
3. The C30 profile uses four separately named source identities:
   `platform_child_family_identity_source_v1`,
   `scenario_interface_source_v1`, `scenario_domain_action_source_v1` and
   `scenario_protected_interaction_source_v1`. The existing
   `contract.source_hash`, a historical Workflow hash or one generic
   `contract_hash` cannot substitute for any of them.
4. I1-F converges only manifest types, strict runtime assertions, JSON Schema,
   Base module-validation rules, neutral fixtures, deterministic named-source
   profiles and the final Base source lock. It consumes the accepted I1-A..E
   wires without changing their public names, fields, validation or exposure.
5. A Base named-source profile is only the immutable Base contribution to a
   source identity. It is not My-Chat adoption, Nurture adoption, a completed
   `platform_child_family_identity_source_v1`, joint conformance, capability
   readiness or activation evidence. Those claims remain C30-I2/I3/I4.

## Review finding and current gap

The current Base source is internally consistent for the accepted standalone
wires, but it cannot satisfy the cumulative C30-I1 exit:

| Current object | Finding | Required I1-F correction |
| --- | --- | --- |
| `ScenarioManifestV2.contract.source_hash` | One umbrella hash cannot distinguish identity, interface, action and protected sources. | Add named source dependencies; retain the existing release hash with its narrower meaning. |
| `ManifestCapability` | The type describes legacy Workflow entrypoints and has no dependency graph. | Add a separate scenario-contract capability graph; do not reinterpret legacy product/Run capability entries. |
| `ScenarioManifestV2` / JSON Schema | No trusted ingress, subject provider/presentation, action or protected declaration area exists. | Add one optional, closed `scenario_contracts` area with exact cross-references. |
| `assertScenarioManifestV2` | The assertion validates current v2 structure only and cannot reject partial C30 adoption or duplicate legacy/vNext paths. | Add structural, DAG, source, reference and legacy-exclusion assertions. |
| `validateWorkflowModule` | The validator checks the historical module registries and umbrella Host capabilities only. | Add fatal Host-support and no-alias rules without implementing a Host or Scenario runtime. |
| `WorkflowHostValidationSnapshot` | The snapshot cannot represent the four C30 Host capability supports. | Extend only the closed reusable Host capability vocabulary and validation snapshot. |
| `workflow-contract-source-lock.json` | The lock seals one TypeScript population and has no named C30 profiles. | Preserve the aggregate lock and add deterministic named Base-source profiles under one exact source revision. |
| Current Nurture manifest/module | The current path is legacy v1 with a handwritten pre-activation projection and historical handlers. | Keep that path untouched; treat the path only as an I2/I3 no-alias negative, never an I1-F consumer. |

The review found no accepted I1-A..E wire defect requiring reopening. The gap is
convergence and declaration integrity, not another action/protected-content
contract redesign.

## Frozen manifest envelope

The future additive Base shape is:

```ts
type ScenarioContractSourceDependencyV1 = {
  source_identity: string;
  source_hash: string;
};

type ScenarioCapabilityDependencyV1 = {
  capability_key: string;
  requires_capabilities: string[];
  requires_sources: string[];
};

type ScenarioTrustedInvocationIngressManifestV1 = {
  ingress_category:
    | "product_surface"
    | "host_transition"
    | "workflow_runtime";
  ingress_key: string;
  principal_origins: Array<"interactive_session" | "durable_run_actor">;
};

type ScenarioTrustedInvocationOperationManifestV1 = {
  endpoint_key: string;
  method: "POST";
  operation_key: string;
  input_schema_key: string;
  input_schema_version: number;
  handler_key: string;
  ingress: ScenarioTrustedInvocationIngressManifestV1[];
};

type ScenarioTrustedInvocationManifestV1 = {
  trusted_invocation_version: 1;
  invocation_contract: "scenario-private-invocation-v1";
  operations: ScenarioTrustedInvocationOperationManifestV1[];
};

type ScenarioSubjectContextProviderManifestV1 = {
  provider_key: string;
  provider_version: 1;
  list_operation_key: "list_subject_contexts";
  resolve_operation_key: "resolve_subject_context";
  handler_key: string;
};

type ScenarioSemanticPresentationManifestV1 = {
  presentation_key: string;
  presentation_version: 1;
  provider_key: string;
  operation_key: "present_subject_context";
  handler_key: string;
  safe_reason_codes: string[];
};

type ScenarioProductSurfaceManifestV1 = {
  product_surface_key: string;
  presentation_key: string;
  view_modes: Array<"current" | "recent" | "history">;
  route_classes: string[];
  action_offer_policy: "none" | "declared_actions";
  action_keys: string[];
};

type ScenarioContractManifestV1 = {
  scenario_contracts_version: 1;
  source_dependencies: ScenarioContractSourceDependencyV1[];
  capability_dependencies: ScenarioCapabilityDependencyV1[];
  trusted_invocation: ScenarioTrustedInvocationManifestV1;
  subject_context_providers: ScenarioSubjectContextProviderManifestV1[];
  semantic_presentations: ScenarioSemanticPresentationManifestV1[];
  product_surfaces: ScenarioProductSurfaceManifestV1[];
  domain_action_contracts: ScenarioDomainActionContractV1[];
  protected_interaction_contracts: ScenarioProtectedInteractionContractV1[];
};

type ScenarioManifestV2 = ExistingScenarioManifestV2 & {
  scenario_contracts?: ScenarioContractManifestV1;
};
```

The area reuses the accepted I1-D
`ScenarioDomainActionContractV1` and I1-E
`ScenarioProtectedInteractionContractV1` directly. It MUST NOT define a second
action/protected wire, driver, effect identity, carrier, prepare, submit, Step,
read, result or recovery object.

The manifest declaration contains no credential, signer key, audience secret,
nonce store, HTTP implementation, principal, Participant, role, owner target,
protected body, ciphertext, KMS value, database record, renderer component,
cache policy implementation, activation row or traffic state.

## Capability dependency graph

The C30 capability graph is exact:

| Capability | `requires_capabilities` | `requires_sources` | Declaration obligation |
| --- | --- | --- | --- |
| `trusted_scenario_invocation_v1` | `[]` | `scenario_interface_source_v1` | `trusted_invocation.operations` is non-empty and every ingress/operation tuple is unique and closed. |
| `scenario_subject_presentation_v1` | `trusted_scenario_invocation_v1` | `platform_child_family_identity_source_v1`, `scenario_interface_source_v1` | Provider, presentation and product-surface arrays are non-empty and fully cross-referenced. Actions MAY remain empty before action capability adoption. |
| `scenario_domain_action_execution_v1` | `trusted_scenario_invocation_v1`, `scenario_subject_presentation_v1` | `scenario_domain_action_source_v1` | `domain_action_contracts` is non-empty; every action is bound to declared ingress, surface, handler and command metadata. |
| `scenario_protected_interaction_v1` | `trusted_scenario_invocation_v1`, `scenario_subject_presentation_v1`, `scenario_domain_action_execution_v1` | `scenario_protected_interaction_source_v1` | `protected_interaction_contracts` is non-empty and every protected declaration resolves one exact domain action. |

The array order above is canonical for the C30 fixture and manifest hash. All
dependency arrays reject duplicates, undeclared references, self-dependency and
cycles. A later additive Base contract may define another capability, but it
cannot change these four keys or their required sets in place.

`scenario_contracts` MAY represent a dependency-complete prefix for isolated
adoption tests: trusted only; trusted + presentation; trusted + presentation +
action; or the complete four-capability graph. It MUST NOT represent provider-only,
presenter-only, direct-only, claimed-only, protected-write-only, read-only,
privacy-guard-only or any other partial capability.

## Source identity contract

Every source dependency is closed to exactly `source_identity + source_hash`.

- `source_identity` matches a bounded snake-case versioned-source grammar and is
  unique in the manifest.
- `source_hash` is an exact lowercase SHA-256. Branch, tag, filesystem path,
  `file:`, `link:`, mutable package directory or symbolic revision is invalid.
- Every declared source must be referenced by a declared capability and every
  required source must be present. Unreferenced stale source rows are fatal.
- The C30 complete fixture contains exactly the four names below; missing,
  renamed, umbrella or substituted rows fail.
- Hash equality is not used to merge semantic roles. Each identity remains a
  separately keyed, separately recomputable record.

| Identity | Frozen Base profile | Meaning that remains downstream |
| --- | --- | --- |
| `platform_child_family_identity_source_v1` | I1-A invocation + I1-B binding contracts, their strict validators/Schemas and the common manifest/source-dependency rules. | I2/I3/I4 must additionally bind the completed My-Chat owner schema/runtime/APIs, Nurture anchors/associations and joint recovery/revoke/merge/privacy evidence. |
| `scenario_interface_source_v1` | I1-A ingress + I1-C provider/presentation contracts, validators/Schemas and the common manifest/module-validation rules. | My-Chat exact adoption, Nurture provider/presenter adoption and renderer/joint identities remain separate. |
| `scenario_domain_action_source_v1` | I1-D action contracts, validators/Schemas, static-driver and manifest/module-validation rules. | My-Chat direct/claimed orchestration, Nurture transaction/handler adoption and joint fault/replay evidence remain I2/I3/I4. |
| `scenario_protected_interaction_source_v1` | I1-E carrier/control contracts, validators/Schemas, no-copy and manifest/module-validation rules. | Protected runtime/store/KMS/retention and cross-destination leakage evidence remain I2/I3/I4. |

The named profiles include normalized contract TypeScript, their exported JSON
Schemas, the manifest declaration types/Schema, runtime assertion and Base module
validator. They exclude tests, documentation, package version, generated build
output, Scenario starter values, My-Chat/Nurture source and environment state.
Conformance tests are evidence for the profile bytes, not part of the identity.

The existing aggregate `workflow-contract-source-lock.json` remains the exact Base
source lock. I1-F4 extends its checked metadata with deterministic named Base
profiles and one exact committed source revision; it does not delete or relabel
the current aggregate `source_hash`. The lock verifier must compare committed
bytes for every named TypeScript/Schema path and reject missing, extra, reordered,
symlinked, path-dependent or import-alias-dependent populations.

## Declaration and cross-reference rules

When `scenario_contracts` is present, the runtime assertion, JSON Schema where
structurally expressible, and module validator enforce all of the following:

1. Every object rejects unknown and missing fields. Keys, versions, arrays and
   hashes are bounded; duplicates are fatal.
2. Trusted operation `(endpoint_key, method, operation_key)` tuples are unique.
   Each ingress tuple is unique and its principal origins are compatible with its
   category: product/transition are interactive; runtime is durable.
3. Provider and presentation keys are unique. Every presentation resolves one
   provider. Every product surface resolves one presentation and one registered
   `product_surface` ingress key.
4. `action_offer_policy=none` requires `action_keys=[]`.
   `declared_actions` requires a non-empty unique set, the action capability and
   one exact `domain_action_contracts` row per key.
5. Every action row has the manifest `scenario_key`, a unique action key, declared
   input schema/version, declared entitled ingress keys, a unique handler key and
   one accepted I1-D driver. Driver selection cannot vary by surface or result.
6. Every protected row has the manifest `scenario_key`, resolves one exact action,
   keeps I1-E `prepare_domain_action|read_protected_detail`, and cannot introduce
   a third driver, generic commit/erase operation or body field.
7. Every declared capability has its exact dependency/source set. No declaration
   exists without its capability and no capability exists without its complete
   declaration population.
8. Host validation is fatal when an exact declared Host capability is absent.
   This proves contract support only; it never enables a capability or creates an
   activation row.
9. Product/Scenario-specific semantic restrictions, real implementation backing,
   localized safe copy, renderer coverage, database/KMS, current owner policy and
   runtime failure behavior remain I2/I3/I4 evidence. Base uses neutral fixtures.

JSON Schema and the TypeScript runtime assertion MUST accept and reject the same
structural fixture population. DAG cycles, cross-array references, legacy
collisions and Host-snapshot support are contextual rules that JSON Schema cannot
portably express; they remain explicit runtime/module-validation tests rather than
false Schema-parity claims.

## Legacy and vNext exclusion

Legacy compatibility is additive, not fallback:

- manifest v1 and manifest v2 without `scenario_contracts` compile and retain
  their existing behavior and warnings;
- introducing `scenario_contracts` does not silently reinterpret
  `capabilities`, `scenario_data`, `surface_mapping`, `internal_api` or
  `action_availability`;
- a vNext action key cannot also appear in
  `action_availability.scenario_actions`;
- a vNext operation/action/provider/presenter handler key cannot also appear in a
  legacy Workflow step, `internal_api` route or `surface_mapping` implementation
  value;
- the same operation cannot have both a vNext declaration and a legacy
  entrypoint/route alias;
- any vNext validation failure is fatal for that module. Base emits no alternate
  registry choice and consumers MUST NOT fall back to optional actor/workspace,
  broad `client_surface`, legacy internal handlers, Workflow dashboard presenters,
  synthetic refs, `capture_family_input`, `plain_text_dev` or another
  authenticator.

The current Nurture YAML/TypeScript v1 duplication and
`nurturePreActivationScenarioManifest` filtering remain historical negative
evidence. I1-F neither edits them nor declares them compatible with the new area.
Canonical/projection generation and real registry parity are I3 work after exact
Base/My-Chat adoption.

## Donor and current-source disposition

| Candidate | Disposition | Reason |
| --- | --- | --- |
| Accepted I1-A..E types/assertions/Schemas | `REUSE EXACT` | I1-F consumes them and adds only manifest/source composition; public wire semantics stay frozen. |
| Current Base manifest/release/module validator | `REWORK / I1-F` | Preserve strict unknown-field, deterministic hash and fatal-validation mechanisms; add the frozen optional area and exact graph. |
| Existing aggregate source-lock tooling | `REWORK / I1-F4` | Preserve exact revision/committed-byte/alias portability; add named profiles without relabeling the umbrella hash. |
| T-029 B02/B05/B07 | `REWORK MECHANISMS ONLY` | Strict dependencies, Schema execution and source-lock ideas are useful; product allowlists, umbrella source and mixed DAG changes are rejected. |
| Base Scenario starter manifest | `DEFER` | Artifact 13 B11 keeps starter regeneration after C30-I1; a neutral fixture is sufficient for I1-F. |
| Current My-Chat/Nurture consumers and manifests | `NEGATIVE DONOR / I2-I3` | They do not contain the accepted C30 contracts or one canonical vNext path and are not modified here. |
| Notification continuity, activation/admission and protected AI sources | `DEFER / OUT OF SCOPE` | They belong to later C34/C35 or separately authorized work and are not a fifth I1-F source. |

Zero T-029, My-Chat or Nurture file is approved for direct merge.

## Planned Base impact

| Area | Frozen future impact |
| --- | --- |
| `templates/host-runtime/packages/workflow-contracts/src/types/manifest.ts` | Add the frozen optional area and declaration types; reuse I1-D/I1-E contracts. |
| `.../src/types/scenario-release.ts` | Add strict structure, capability/source DAG, cross-reference and collision assertions. |
| `.../src/types/validation.ts` | Extend only the reusable Host capability vocabulary/snapshot needed for fatal support checks. |
| `.../schemas/scenario-manifest-v2.schema.json` plus one closed v1 fragment Schema if needed | Add exact structural parity for `scenario_contracts`; preserve manifests that omit it. |
| `templates/host-runtime/packages/workflow-runtime/src/validation/validate-module.ts` and tests | Add fatal Host-support, declaration/reference and legacy/vNext collision rules; no runtime dispatch. |
| `conformance/fixtures/` and `conformance/tests/` | Add legacy-unchanged, four dependency-complete prefixes, complete C30 graph and exhaustive partial/mixed/alias/source/Schema-codec negatives using neutral Scenario values. |
| Source-profile/lock scripts and `workflow-contract-source-lock.json` | Compute/check the four named Base profiles, aggregate hash, exact source revision and committed bytes deterministically. |

I1-F MUST NOT modify the Scenario starter manifest, Base runtime dispatch,
My-Chat/Nurture source or package dependency, package version, Prisma schema or
migration, database, environment, credential, KMS, renderer, route implementation,
provider, registry state, deployment, capability flag, Workspace allowlist,
activation row or traffic state.

## Ordered implementation units

| Unit | Scope | Entry | Exit |
| --- | --- | --- | --- |
| `I1-F1` dependency/source primitives | Manifest source rows, capability dependency rows, optional closed envelope, syntax/uniqueness/DAG assertions and structural Schema parity. | This freeze plus separate F1 authorization. | Legacy omission remains unchanged; complete prefixes and missing/unknown/duplicate/cycle/source negatives pass. No provider/action/protected manifest registry yet. |
| `I1-F2` trusted ingress and presentation convergence | Trusted operation/ingress, provider, presentation and product-surface declarations; Host support and legacy collision rules. | F1 accepted. | Trusted-only and presentation-complete fixtures pass; partial presentation, Host gap and legacy alias cases are fatal. |
| `I1-F3` action and protected convergence | Reuse exact I1-D/I1-E static contracts in manifest arrays; close action/surface/handler/driver/protected references and complete four-capability graph. | F2 accepted. | Complete C30 fixture passes; every partial action/protected/source/driver/no-copy/legacy collision fails. No consumer runtime. |
| `I1-F4` cumulative qualification and immutable I1 handoff | Named source profiles, exact source-lock seal, full Base verification, deterministic build/manifests, scope audit and one immutable C30-I1 Base handoff. Adds no public wire. | F1-F3 accepted. | One exact source plus metadata-only lock satisfies the cumulative I1-A..F Base exit; only a separate C30-I2 scope/authorization becomes eligible. |

No unit starts automatically. Each unit requires separate explicit authorization
unless a later authorization expressly covers the complete ordered I1-F chain.
F4 acceptance does not authorize C30-I2 implementation, My-Chat/Nurture adoption,
database work, capability activation, deployment or Pilot.

## Cumulative acceptance matrix

I1-F acceptance requires all of the following:

1. Accepted I1-A..E public wire names, fields, drivers, exposure and validation
   remain byte/semantic compatible except for the intended manifest composition.
2. TypeScript compiles without `any`, product runtime, database, renderer, crypto
   provider or Nurture registry values.
3. Legacy v1/v2 fixtures remain unchanged; every dependency-complete vNext prefix
   validates; every partial, duplicate, unknown, cyclic or mixed declaration fails.
4. JSON Schema and runtime assertion parity covers every structural positive and
   negative branch; contextual-only checks are explicitly classified and tested.
5. The exact four capability dependency sets and four C30 source identities are
   present in the complete fixture; an umbrella hash/key cannot replace them.
6. Provider/presentation/surface/action/protected references are bidirectionally
   closed. Missing declaration, dangling reference, undeclared handler or
   implementation-key collision is fatal.
7. `scenario_domain_action_execution_v1` retains the accepted Base-neutral driver
   names and scenario-bound effect identity. Protected interaction reuses the
   same action path and contains no body or third driver in generic declarations.
8. Host support validation proves only contract availability and stays default-off;
   it changes no activation metadata or runtime state.
9. Named Base source profiles are deterministic, path/import-alias portable,
   committed-byte checked and distinct from both the aggregate Base lock and
   downstream adoption identities.
10. Full Base conformance, repeated deterministic outputs, metadata-only final
    source lock and scope audit pass. The immutable handoff states
    `C30_I1_BASE_CONTRACTS_ACCEPTED / C30_I2_SEPARATE_AUTHORIZATION_REQUIRED`.

## Rollback and invalidation

Future source units must be committed separately. Rollback reverses the
metadata-only F4 lock first, then F3, F2 and F1. No database, runtime, consumer,
capability or environment compensation exists because I1-F performs none.

Any change to the top-level area name, exact capability/source names, dependency
sets, complete-prefix rule, legacy exclusion, source-profile meaning, Schema/codec
parity classification, accepted I1-A..E reuse, implementation decomposition or
downstream boundary invalidates this freeze and requires renewed review before
source work continues.

## Verification and effect boundary

- Review inputs: accepted I1-A..E source/lock and freeze/qualification artifacts,
  C-3-0b/c/d/e architecture/schema/test/readiness decisions, T-029 donor
  disposition, workflow context, current Base manifest/types/Schema/runtime
  validator/source-lock, current Nurture manifest/module and the exact clean
  three-repository topology.
- Required documentation checks: strict task/repository Markdown and anchor lint,
  governance sync/lint/query, strict Context verification and `git diff --check`.
- This review uses no build, Prisma generate, database connection/apply, one-time
  PostgreSQL, network provider, KMS, deployment, capability activation, T-008,
  Pilot or traffic action.

## Next gate

The only eligible next action is separate authorization for `C30-I1-F1`
dependency/source primitives. I1-F2..F4, C30-I2, all consumers and every
database/activation/deployment/Pilot action remain closed unless a later
authorization expressly opens their exact scope.

```text
Goal: Implement only C30-I1-F1 neutral dependency/source primitives in Base.
Constraints: Optional closed scenario_contracts envelope; exact source/capability
             rows and DAG validation; preserve legacy and accepted I1-A..E;
             no provider/action/protected registry convergence or consumer work.
Acceptance: TypeScript/Schema structural parity, complete-prefix positives and
            missing/unknown/duplicate/cycle/source negatives pass locally.
```
