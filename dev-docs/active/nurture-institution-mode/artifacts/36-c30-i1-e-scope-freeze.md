# C30-I1-E Protected Interaction Scope Freeze

## Decision

- Date: 2026-08-06
- Governance decision: `REUSE_TASK`
- Mapping: `M-002 > F-002 > T-002 nurture-institution-mode`
- Entry: C30-I1-A/I1-B/I1-C/I1-D accepted; current Base source
  `3580a9be74bd6ebe81d00c9fe99ccdf98d147664`, metadata lock
  `1cb56910f32ab5e13f9d378af3b3043dfc94b180` and source hash
  `5c5f2c5380773ccb651925199d403f267edb60bfbb0512bb0779218d074a99ef`
- State: `I1_E_SCOPE_FROZEN / IMPLEMENTATION_NOT_AUTHORIZED`
- Downstream: `I1_E1_SEPARATE_AUTHORIZATION_REQUIRED / I1_F_BLOCKED /
  C30_I2_NO_GO / ACTIVATION_NO_GO`

This decision freezes only the future neutral My-Workflow-Base
protected-interaction contract surface. It changes no Base source and authorizes no
implementation unit, My-Chat or Nurture adoption, manifest/source convergence,
runtime, database, KMS, capability, deployment, activation, Pilot or traffic work.

Four decisions are normative:

1. Protected plaintext uses a dedicated `ScenarioProtectedPlainTextCarrierV1`.
   It MUST NOT be a field of `ScenarioPrivateInvocationV1.operation.input`, an
   I1-D `action_input`, an I1-C semantic block, an ordinary Host result, or a
   durable Host DTO. The signed I1-A operation input remains body-free and carries
   only a keyed binding to the separately transported carrier.
2. Prepare and read each have a body-free control wire plus a separately validated
   carrier slot. The concrete HTTP framing, signer/KMS provider, capture-disabled
   route and client renderer belong to I2/I3; Base freezes the logical separation
   and contextual binding without implementing transport or crypto.
3. Submit remains the accepted I1-D `SubmitScenarioDomainActionInputV1`. Commit of
   the same prepared object is composed with the existing direct/claimed
   CommandExecution path. I1-E introduces neither a third driver nor a generic
   `commit_protected_content` or `erase_protected_content` operation.
4. Manifest capability dependencies, atomic legacy/vNext exclusion,
   `scenario_protected_interaction_source_v1` and convergence with the other C30
   source identities remain I1-F. I1-E is standalone wire/codec/Schema/neutral
   conformance only.

## Purpose and ownership

I1-E closes the reusable protected-data seam around the accepted I1-D action
contract without moving business content into shared Host state.

- Base later owns neutral carrier/control types, strict structural and contextual
  assertions, closed JSON Schemas, neutral fixtures and no-copy conformance.
- My-Chat later owns the distinct protected composer/renderer, capture-disabled
  carrier route, signed carrier binding, request/foreground memory controls,
  no-store/cache/offline guards and Host leakage scanner.
- Nurture later owns canonical normalization validation/acceptance, current business
  authorization, encrypted prepared/committed storage, integrity/KMS policy,
  Message attachment, read/redaction/retention/tombstone semantics and owner
  leakage scanner.
- The client supplies only manually authored carrier plaintext and the accepted
  I1-D confirmation echo. It never authors content kind, protected ref/version,
  integrity evidence, lifecycle state, read authority, driver or effect identity.

The Base v1 profile is neutral short human-authored plain text. Scenario-specific
meaning such as `family_care_question`, Guardian, Caregiver, Child, Family, Grant,
Message or retention policy does not enter Base source or fixtures.

## Exposure zones

Every I1-E value belongs to exactly one zone:

| Zone | Allowed values | Forbidden values |
| --- | --- | --- |
| Protected composer process | One current-surface `ScenarioProtectedPlainTextCarrierV1` before prepare | Chat message/revision, `PublicDraft`, artifact draft, autosave, URL/history, local/session/IndexedDB/Service Worker, crash or telemetry copy |
| Protected route carrier slot | The exact normalized carrier for one current prepare input or ready read result | I1-A `operation.input`, generic request/result logging, ordinary controller DTO, queue, Step, Handoff, Outbox or retry payload |
| I1-A body-free operation input | Static action/read controls, opaque locator/version and keyed carrier binding | Plaintext, ciphertext, body-derived summary/detail, wrapped key, KMS metadata or attachment bytes |
| Scenario-private lifecycle control | Prepared/committed ref, version, content kind, keyed integrity evidence and bounded times | Business body, client authority, storage ciphertext/key material, Message/Item copy or generic Host persistence |
| Foreground protected read | One `ready` control result plus exactly one separately bound carrier, at most 60 seconds | Cached/stale/offline body, non-ready carrier, AI/provider input or background/reopen recovery |
| Body-free shell/audit | Generic operation/outcome, safe generic copy and low-cardinality evidence under the owning system's policy | Carrier, protected ref in durable Host shell, content/version/integrity correlation usable as a content index, body fragment or derived narration |

Structural validity never moves a value between zones. Later adapters MUST accept
separate control and carrier parameters; they MUST NOT build a broad object and
attempt to remove sensitive properties before persistence or logging.

## Frozen static contract

```ts
type ScenarioProtectedInteractionContractV1 = {
  protected_interaction_contract_version: 1;
  scenario_key: string;
  action_key: string;
  protected_field_key: string;
  content_kind: string;
  prepare_operation_key: "prepare_domain_action";
  read_operation_key: "read_protected_detail";
  content_profile: {
    media_type: "text/plain; charset=utf-8";
    normalization: "trim_outer_whitespace_and_crlf_to_lf_v1";
    min_characters: 1;
    max_characters: 2000;
    attachments: "none";
  };
};
```

The declaration is a standalone static join to one accepted I1-D action contract.
`scenario_key` and `action_key` MUST match that contract. Content kind and field key
are registered server values, not client input. The v1 profile accepts only already
normalized plain text with an empty attachment list; richer text, media or a wider
profile requires a new reviewed contract version rather than a permissive extension.

I1-E does not add capability, dependency, source-identity, handler, surface,
retention, KMS, database or activation fields to this declaration. I1-F and later
consumer adoption own those facts.

## Frozen dedicated carrier and binding

```ts
type ScenarioProtectedContentRefV1 = string;

type ScenarioProtectedPlainTextCarrierV1 = {
  protected_carrier_version: 1;
  protected_field_key: string;
  media_type: "text/plain; charset=utf-8";
  plain_text: string;
  attachment_refs: [];
};

type ScenarioProtectedCarrierBindingV1 = {
  carrier_binding_version: 1;
  carrier_scope: "prepare_input" | "read_output";
  protected_field_key: string;
  keyed_binding_hash: string;
};
```

The carrier is the sole Base wire permitted to contain protected plaintext. It is a
dedicated adapter parameter, not a generic operation input/result property. Its
codec validates but never normalizes or rewrites input. A caller must supply the
already normalized bytes so the adult-reviewed value, signed transport binding and
owner integrity evidence all refer to one exact byte sequence.

The exact v1 normalization order is: replace every CRLF pair with LF, reject any
remaining lone CR, apply ECMAScript `String.prototype.trim()` once, then validate
the resulting Unicode code-point and UTF-8 bounds. Empty output is invalid. No NFC,
NFD, case folding, whitespace collapsing, punctuation rewrite or locale transform is
permitted.

`keyed_binding_hash` is exactly 64 lowercase hexadecimal characters representing
32-byte evidence produced by a trusted carrier
binding verifier. For prepare it binds the exact I1-A request identity,
Workspace/scenario/action/field/direction and normalized carrier bytes; for read it
binds the exact response/request identity, field/direction and returned bytes. A
bare digest of human text is forbidden. Key id, credential, signature and algorithm
provider metadata stay in detached transport configuration and never enter this
body.

Base structural validation can prove syntax only. A contextual assertion MUST
receive independently verified binding evidence and compare it to the closed
control. It MUST NOT infer that a shape-valid hash is keyed or trusted.

## Frozen prepare control and result

```ts
type PrepareScenarioProtectedInteractionInputV1 = {
  protected_prepare_version: 1;
  action_prepare: PrepareScenarioDomainActionInputV1;
  carrier_binding: ScenarioProtectedCarrierBindingV1 & {
    carrier_scope: "prepare_input";
  };
};

type ScenarioPreparedProtectedContentControlV1 = {
  protected_content_control_version: 1;
  state: "prepared";
  protected_content_ref: ScenarioProtectedContentRefV1;
  protected_content_version: string;
  content_kind: string;
  keyed_integrity_hash: string;
  issued_at: string;
  expires_at: string;
};

type PrepareScenarioProtectedInteractionResultV1 =
  | {
      protected_prepare_result_version: 1;
      status: "prepared";
      action_result: Extract<
        PrepareScenarioDomainActionResultV1,
        { status: "prepared" }
      >;
      prepared_content: ScenarioPreparedProtectedContentControlV1;
    }
  | {
      protected_prepare_result_version: 1;
      status: "context_changed";
      action_result: Extract<
        PrepareScenarioDomainActionResultV1,
        { status: "context_changed" }
      >;
    }
  | {
      protected_prepare_result_version: 1;
      status: "unavailable";
      action_result: Extract<
        PrepareScenarioDomainActionResultV1,
        { status: "unavailable" }
      >;
    };
```

`ScenarioProtectedContentRefV1` is a 32-512 character opaque base64url owner
locator. It carries no canonical object identity or bearer authority. The prepare
input is the exact body-free I1-A operation input; the carrier is supplied only in
the separate protected slot. `action_prepare.action_input` may contain registered
body-free control fields but MUST contain no carrier, body, body fragment,
ciphertext, key material, protected ref or client-authored content kind.

Prepared success requires all of the following contextual joins:

- the static protected contract and I1-D action contract share scenario/action;
- field, media profile, normalization and empty attachments match;
- the independently verified input carrier binding equals
  `input.carrier_binding`; it is not inferred from its shape;
- the owner independently derives `prepared_content.keyed_integrity_hash` over the
  same exact accepted bytes and owner content context; transport binding and owner
  integrity evidence are distinct keyed proofs and are never compared as equal;
- action and prepared-content issue/expiry times are identical and the lifetime is
  greater than zero and at most five minutes;
- content kind is server-derived from the static contract;
- `context_changed|unavailable` carries no prepared control and no output carrier.

Preparation may create one encrypted owner object and the existing I1-D submit
context atomically, but it creates no CommandExecution, Message, Item, Receipt,
Step, Handoff, Outbox, Notification, provider effect or committed business fact.
That owner behavior is an I3 adoption obligation, not a Base implementation claim.

## Frozen commit composition

```ts
type ScenarioCommittedProtectedContentControlV1 = {
  protected_content_control_version: 1;
  state: "committed";
  protected_content_ref: ScenarioProtectedContentRefV1;
  prepared_content_version: string;
  committed_content_version: string;
  content_kind: string;
  keyed_integrity_hash: string;
  committed_at: string;
};
```

There is no public commit request. The accepted I1-D submit token, driver,
effect-identity and execution result remain unchanged and body-free. A contextual
commit assertion joins the stored prepared control, resolved submit context,
I1-D execution binding/result and committed control:

- `protected_content_ref`, content kind and keyed integrity evidence are unchanged;
- `prepared_content_version` equals the stored prepared version and the committed
  version is a new bounded opaque version;
- a committed control is legal only for `ScenarioDomainActionExecutionResultV1`
  status `committed` under the same scenario/action/effect identity;
- direct and claimed paths retain their accepted I1-D atomicity and original-Step
  rules; neither Step nor execution result gains carrier/body/ref fields;
- failed, not-committed, unknown or rolled-back execution cannot assert committed
  content; response recovery never resends the carrier.

The exact unique attachment to one Scenario-owned business object and transaction
truth remain I3/joint-adoption checks. Base proves only the reusable control
composition and same-object invariants.

## Frozen read locator, control and carrier pairing

```ts
type ScenarioProtectedContentReadLocatorV1 = {
  protected_read_locator_version: 1;
  protected_content_ref: ScenarioProtectedContentRefV1;
  content_kind: string;
  issued_at: string;
  expires_at: string;
};

type ReadScenarioProtectedDetailInputV1 = {
  protected_read_version: 1;
  protected_content_ref: ScenarioProtectedContentRefV1;
  known_content_version?: string;
};

type ScenarioProtectedDisplayLeaseV1 = {
  display_lease_version: 1;
  cache_policy: "no_store";
  issued_at: string;
  expires_at: string;
};

type ReadScenarioProtectedDetailResultV1 =
  | {
      protected_read_result_version: 1;
      status: "ready";
      protected_content_version: string;
      content_kind: string;
      carrier_binding: ScenarioProtectedCarrierBindingV1 & {
        carrier_scope: "read_output";
      };
      display_lease: ScenarioProtectedDisplayLeaseV1;
    }
  | {
      protected_read_result_version: 1;
      status: "tombstone";
      safe_reason: ScenarioSafeReasonV1;
    }
  | {
      protected_read_result_version: 1;
      status: "context_changed";
      safe_reason: ScenarioSafeReasonV1;
    }
  | {
      protected_read_result_version: 1;
      status: "unavailable";
      safe_reason: ScenarioSafeReasonV1;
    };
```

The short-lived read locator is issued only after a current Scenario owner read and
may enter the foreground protected renderer control slot. It is not an I1-C
semantic block/action target, URL, deep-link payload, canonical ref, durable Host
shell or bearer credential. Later consumers must reread current authority on every
read regardless of locator validity.

The generic result remains body-free. `ready` MUST pair with exactly one separately
returned `ScenarioProtectedPlainTextCarrierV1`; the verified `read_output` binding,
field and exact carrier bytes must match. Its display lease is greater than zero
and at most 60 seconds. Every non-ready branch MUST have no carrier. `tombstone`
is a current view outcome, not proof of a storage row, crypto-erasure reason, global
deletion or authorization to erase. Existence-sensitive denial and owner/provider
failure remain closed unavailable behavior with no stale body.

Before forming `ready`, the owner must independently verify decrypted bytes against
the stored keyed integrity evidence. That verification is contextual owner/runtime
truth, not a client-visible field or something the Base structural codec can infer.

No generic tombstone/erase input is added. Author redaction remains a registered
I1-D domain action, while retention/source erasure remains Scenario owner policy.

## Bounds and validation

| Value | Frozen bound |
| --- | --- |
| Machine keys | 1-128 characters; accepted Base machine-key grammar |
| Protected content ref | 32-512 base64url characters; opaque locator only |
| Opaque versions | 1-200 accepted opaque characters |
| Plain text | 1-2000 Unicode code points after the declared normalization; no CR or NUL; serialized UTF-8 at most 8 KiB |
| Attachments | Exact empty tuple/array; no attachment ref or bytes |
| Binding/integrity evidence | Exactly 64 lowercase hexadecimal characters plus a required independently verified keyed context |
| Prepared/read-locator lifetime | Greater than zero and at most five minutes |
| Foreground display lease | Greater than zero and at most 60 seconds |
| Body-free control result | At most 8 KiB UTF-8 |
| Dedicated carrier | At most 12 KiB serialized UTF-8; request/render memory only |

All objects are closed and all timestamps are canonical UTC instants. Runtime
assertions own current-time, cross-object, keyed-evidence and serialized-size checks
that JSON Schema cannot express portably. Runtime assertions do not normalize,
encrypt, sign, store, authorize or clear client memory.

Schema/codec parity and contextual negatives MUST cover:

- unknown/missing/null/mixed-branch fields, wrong discriminators, invalid
  key/ref/version/hash/time syntax and size overflow;
- leading/trailing whitespace, CR/CRLF after the validation boundary, NUL,
  over-2000 text, rich text/HTML/media, non-empty attachments and implicit Unicode
  rewriting;
- bare content hash, unverified keyed hash, wrong request/direction/field/action/
  scenario binding and cross-principal/Workspace/surface/replay carrier swap;
- carrier/body/ciphertext/wrapped-key/KMS/summary/detail fields in I1-A input,
  I1-D action input/result/Step/snapshot, I1-C semantic output, canonical refs,
  Handoff/Outbox/Notification, Chat, `PublicDraft`, artifact, audit or telemetry;
- prepared-success mismatched result branch, times, content kind, ref/version or
  carrier; non-success with a prepared control or carrier;
- edit-in-place, old prepared-context revival, new carrier with old integrity,
  submit body resend, commit on rollback/not-committed/unknown and different-object
  substitution;
- ready without exactly one carrier, non-ready with a carrier, lease over 60
  seconds, stale/cache/offline fallback, locator as bearer authority and current
  denial leaking body or existence detail;
- `plain_text_dev`, synthetic protected refs, ordinary Chat promotion, AI input,
  broad metadata/extensions, a third action driver, a generic erase command or
  legacy fallback.

Neutral no-copy fixtures MUST use high-entropy sentinels and scan exact text,
normalized variants, fragments, base64/escaped forms and forbidden body-like keys
across every generic Base fixture. Semantic summaries, database/storage copies,
logs, browser state and transport capture require later My-Chat/Nurture/joint
leakage suites; Base MUST NOT overclaim that structural scans prove those runtimes.

## Donor and current-source disposition

| Candidate | Disposition | Reason |
| --- | --- | --- |
| I1-A private invocation and keyed request identity | `REUSE_BODY_FREE_CONTROL_ONLY` | Trusted route/request context is reused; protected carrier bytes never enter delegated generic input. |
| I1-C safe reason and opaque locator grammar | `REUSE` | Closed generic safe output and locator validation are consumed without treating presentation as protected read authority. |
| I1-D action contract, prepare/submit and direct/claimed execution | `REUSE` | Protected prepare composes with, and commit remains inside, the accepted action path; no fork or third driver. |
| Existing Base semantic blocks, Handoff snapshots and Run/runtime payloads | `NEGATIVE_DONOR` | None is a protected carrier or durable body location. |
| T-029 B01/B05/B07 codec, fixture and source-lock mechanisms | `REWORK` | Strict closure/parity mechanisms are reusable ideas only; candidate policy/source files are not mergeable. |
| T-029 B09/M08 protected-AI/generation paths | `DEFER / NEGATIVE_DONOR` | Protected AI is outside Pilot and outside I1-E. |
| Current Nurture synthetic `protected_content_ref`, JSON protection payload and `plain_text_dev|protected` scaffold | `NEGATIVE_DONOR` | Synthetic refs/storage labels cannot satisfy the owner aggregate or protected carrier contract. |
| Current My-Chat Chat/`PublicDraft`/generic interaction DTOs | `NEGATIVE_DONOR` | They are explicit no-copy destinations, not protected transport or recovery paths. |

Zero T-029, My-Chat or Nurture file is approved for direct merge.

## Planned Base impact

| Area | Frozen future impact |
| --- | --- |
| `templates/host-runtime/packages/workflow-contracts/src/types/` | Add `scenario-protected-interaction.ts` and strict validation/contextual assertions; consume accepted I1-A/I1-C/I1-D exports. |
| `templates/host-runtime/packages/workflow-contracts/schemas/` | Add closed v1 Schemas for static contract, carrier, binding, prepare input/result, prepared/committed controls, read locator/input/result and display lease. |
| `conformance/fixtures/` and `conformance/tests/` | Add neutral carrier/control positives, Schema/codec parity, cross-seam lifecycle, lease and recursive no-copy negatives. |
| Package/schema export indexes | Export only frozen neutral types/assertions/Schemas; no runtime, crypto or Scenario values. |
| Contract source lock | Refresh only in I1-E5 after E1-E4 source/test population is committed and accepted. |

I1-E MUST NOT modify Base runtime/Scenario starter/manifest types or Schemas,
dependency/source identities, package version, provider or capability defaults. It
also changes no My-Chat/Nurture source, schema, migration, database, environment,
secret, KMS, registry, deployment, allowlist or traffic state.

## Ordered implementation units

| Unit | Scope | Entry | Exit |
| --- | --- | --- | --- |
| `I1-E1` contract, carrier and exposure primitives | Static contract, protected ref, dedicated plain-text carrier, keyed binding, bounds and zone tests. | This freeze plus separate E1 authorization. | Carrier/control separation, normalization/bounds and generic-payload exclusion pass; no prepare/read lifecycle yet. |
| `I1-E2` protected prepare | Body-free prepare input/result, prepared control and I1-A/I1-D/carrier contextual joins. | E1 accepted. | Prepared/mixed/failure/expiry/swap/no-copy parity passes; no commit/read wire. |
| `I1-E3` commit composition | Committed control and same-object composition with I1-D direct/claimed execution/recovery. | E2 accepted. | Rollback/unknown/wrong-object/body-resend/different-Step negatives pass; no public commit operation. |
| `I1-E4` protected read and tombstone | Read locator/input/body-free result/display lease, ready-carrier pairing and cumulative generic-destination scans. | E3 accepted. | Ready/non-ready, current-context, no-store/lease, cache/offline and recursive no-copy negatives pass. |
| `I1-E5` cumulative qualification | Full Base verification, deterministic build/manifest, exact source-lock seal and scope audit; adds no wire. | E1-E4 accepted. | Cumulative I1-E accepted at one exact source plus metadata-only lock; only I1-F scope review becomes eligible. |

No unit starts automatically. Each implementation unit requires separate explicit
authorization unless a later user authorization expressly covers the complete
ordered I1-E chain. E5 acceptance still does not open I1-F implementation or C30-I2.

## Cumulative acceptance matrix

I1-E acceptance requires all of the following:

1. TypeScript compiles without `any`, Host runtime, Scenario product or crypto
   provider imports.
2. Carrier and every control/result union are closed; JSON Schema and runtime
   assertion behavior align for neutral positive and adversarial fixtures.
3. Protected plaintext appears only in the dedicated carrier type. I1-A input,
   I1-D input/result/recovery, I1-C output and all generic/durable Host fixtures
   remain body/ciphertext/ref-copy free.
4. The carrier is already normalized, bounded plain text with exact empty
   attachments; codecs never silently transform authored meaning.
5. Keyed input/output bindings are request/direction/field/scenario/action scoped;
   shape-valid or bare hashes are not accepted as trusted evidence.
6. Prepare is zero-business-effect, uses the same five-minute I1-D context, returns
   only a body-free prepared control and cannot leave a valid carrier on failure.
7. Commit changes the same prepared object only inside the accepted I1-D
   direct/claimed transaction; recovery never resends/copies the body.
8. Read locator is not authority; `ready|tombstone|context_changed|unavailable` is
   closed, ready has exactly one carrier and at most a 60-second no-store lease,
   and non-ready has no carrier.
9. No generic commit/erase operation, protected AI, Chat promotion, offline/cache
   fallback, synthetic ref, `plain_text_dev`, capability or legacy fallback enters
   I1-E.
10. T-029 remains zero-direct-merge, Base fixtures remain product-neutral and
    current I1-A..D public names/semantics remain unchanged.
11. Full Base qualification, deterministic outputs and exact source lock pass in
    E5. Manifest/dependency/source-identity convergence remains I1-F and C30-I2
    remains NO-GO.

## Rollback and invalidation

Future source units must be committed separately. Rollback reverses the
metadata-only E5 source lock first, then E4, E3, E2 and E1. No database, runtime,
carrier cleanup or consumer compensation exists at this freeze because no
implementation or adoption is authorized.

Any change to carrier/control separation, frozen type/field/status names, content
profile, exposure zones, prepared/read lifetimes, same-object commit rule, no-copy
destinations, I1-D reuse, no-generic-erase rule, implementation decomposition or
I1-F deferral invalidates this freeze and requires renewed review before source
work continues.

## Verification and effect boundary

- Review inputs: accepted I1-A..D exports/source lock, C-3-0e
  architecture/schema/test/readiness decisions, artifact 15/28, T-029 donor
  disposition, workflow context contract and the current three-repository topology.
- Required documentation checks: strict task/repository Markdown and anchor lint,
  governance sync/lint/query, strict Context verification and `git diff --check`.
- This review uses no build, Prisma generate, database connection/apply, one-time
  PostgreSQL, network provider, KMS, deployment, capability, activation, T-008,
  Pilot or traffic action.

## Next gate

The only eligible next action is separate authorization for `C30-I1-E1` contract,
carrier and exposure primitives. I1-E2..E5, I1-F, C30-I2, all consumers and every
activation/deployment/Pilot action remain closed unless a later authorization
expressly opens their exact scope.

```text
Goal: Implement only C30-I1-E1 neutral contract/carrier/exposure primitives.
Constraints: Preserve accepted I1-A..D source semantics; protected bytes exist
             only in the dedicated carrier; no prepare/read lifecycle or I1-F.
Acceptance: closed types/codecs/Schemas, normalization/bounds, keyed-binding
            structure and generic-payload no-copy negatives pass locally.
```
