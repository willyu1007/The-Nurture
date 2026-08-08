# C30-I2 Generic Host Adoption Scope Freeze

## Purpose and decision

- Date: 2026-08-06
- Current governance decision: `REUSE_TASK`
- Current mapping: `M-002 > F-002 > T-002 nurture-institution-mode`
- Cross-repository implementation decision:
  `NEW_MY_CHAT_TASK_REQUIRED_BEFORE_SOURCE_CHANGE`
- Entry Base source: `15ff031ed16897920c13fe24c9849531d98607ad`
- Entry Base metadata lock: `4350086993d837baa8030564f4e19593dedd96b0`
- Entry Base aggregate source hash:
  `d17f23585bb90ab607eb0fc80af629d8ab13ceb4508118de28162e4fd8846383`
- Reviewed My-Chat source: `dc4a77b257f952e2c0f0aede9521e16ac274de9d`
- Pre-freeze Nurture governance source:
  `a706895602956a4baf0aa5cddd5510289c271972`
- State: `C30_I2_SCOPE_FROZEN / I2_A_SEPARATE_AUTHORIZATION_REQUIRED`
- Downstream: `C30_I3_NO_GO / C30_I4_NO_GO / C31_C35_NO_GO /
  T008_NO_GO / ACTIVATION_NO_GO / PILOT_NO_GO`

The user's C30-I2 authorization satisfies the previously required authorization
for this scope review and freeze. It does not collapse the seven implementation
units below into one unreviewable change and does not authorize implementation or
product source, schema, database, runtime, capability, deployment, activation or
traffic mutation. Only Nurture task/project/context documentation changes in this
freeze.

This document is the implementation entry contract for My-Chat generic Host
adoption of the accepted C30-I1 Base contracts. It is not a claim that My-Chat
already implements those contracts.

## When to use

Use this freeze before any My-Chat change that claims C30-I2 contract adoption,
trusted Scenario ingress, canonical Child/Family pair binding, semantic Scenario
presentation, generic Scenario action execution, protected interaction handling
or manifest capability support.

Do not use it to authorize Nurture consumer adoption, product-specific Guardian
or Caregiver composition, invitation continuation, Notification, admission,
deployment, Workspace activation or Pilot work. Those remain C30-I3/I4,
C31-C35 or later gates.

## Governance routing and task-ID collision

The current review remains part of Nurture `T-002`, the cross-repository C30
program owner. My-Chat also has a repository-local `T-002`, but that identifier
belongs to archived task `content-events`. It is unrelated to C30.

Before I2-A changes My-Chat source, the My-Chat project orchestrator MUST create
and register a new local task using an unused My-Chat task ID and the appropriate
current platform feature mapping. That task MUST cross-reference Nurture T-002 as
the upstream program record. Until then:

- no My-Chat C30 implementation commit may carry `Task: T-002`;
- branch text containing `T-002` is not sufficient task authority;
- My-Chat governance `resume --task T-002` is invalid for this C30 work;
- the new My-Chat task ID and mapping are intentionally not fabricated here.

This resolves the collision without rewriting either repository's historical
task identity.

## Inputs

The frozen implementation input is the exact Base source and lock above, with:

- 66 exported JSON Schemas;
- 441 Node conformance tests at the accepted Base checkpoint;
- aggregate source hash
  `d17f23585bb90ab607eb0fc80af629d8ab13ceb4508118de28162e4fd8846383`;
- named Base profiles:
  - `platform_child_family_identity_source_v1` =
    `81d9fb9db244b8e56bc85e8770eb13915ca87b6053bb3411420b569d59d8fed4`;
  - `scenario_interface_source_v1` =
    `37f0cdae3ad8807073dd250a51f4de990dcccf40952c127b2340161db2e28eaf`;
  - `scenario_domain_action_source_v1` =
    `b7c35259d03a84778cc909075a08d6b147a43a38a12cddeb875c94f01591e48d`;
  - `scenario_protected_interaction_source_v1` =
    `78eadaf4448b61ab3629026fefe4befbb2522eccbc7e459366d1032885d90efb`.

The four profiles identify only Base contribution bytes. C30-I2 must add exact
My-Chat adoption/runtime evidence; it MUST NOT overwrite the Base profile hashes
or claim that copying them alone completes a downstream source identity.

## Current My-Chat gap census

My-Chat is materially behind the accepted Base handoff:

| Area | Reviewed state at `dc4a77b…` | C30-I2 disposition |
| --- | --- | --- |
| `packages/workflow-contracts` | Old C30-I0 population; lock schema v1, local source `042b880…`, upstream Base `eb19433…`, aggregate hash `caebe85d…b2e`; no I1-A..F modules or exported Schemas. | Replace through exact, reproducible Base adoption; no semantic fork or handwritten partial port. |
| API authentication | Interactive Logto session resolves User/Actor/active Workspace. | Reuse for public interactive ingress, then construct the exact I1-A principal server-side. It cannot authenticate private Scenario invocation by itself. |
| Private invocation | No accepted detached signer/verifier, audience/caller binding or nonce ledger. | Add isolated server-to-server outbound signing and inbound verification/one-time nonce handling for declared Host-private operations; fail closed. |
| Child/Family binding | Canonical Child/Family, stewardship/membership and separate Child/Family Scenario binding tables exist. Service/repository writes each subject independently. | Rework into one atomic pair operation with exact heads, relation/current-authority reread, exact replay and writer-fenced recovery. Existing separate writes are donor mechanics only. |
| Workflow registry | Historical module descriptor/loader and module validator only. | Rework to consume the accepted `scenario_contracts` declaration and exact Host capabilities without a legacy fallback. |
| Action bridge | Historical claimed-Step bridge exists and correctly avoids persisting a claim token. | Rework around exact I1-D prepare/submit, direct/claimed drivers, effect identity and same-Step recovery; do not reinterpret the old bridge as compliance. |
| Presentation/protected runtime | No I1-C registry/renderer and no I1-E dedicated carrier/read path. | Implement generic, Scenario-neutral Host components with body-free durable state and closed no-store behavior. |
| Activation | No accepted C30 capability adoption. | Keep every C30 capability absent/off. Positive activation remains C35/Pilot work. |

Schema presence and old tests are useful inputs, not C30-I2 acceptance evidence.
The prior schema-only `db22de6` target remains insufficient.

## Frozen ownership boundary

My-Chat owns:

- authenticated User/Actor/Workspace principal resolution;
- outbound private-invocation signing and response verification, plus trust/key
  selection, inbound Host-private verification and one-time nonce enforcement;
- canonical `my_chat.child` and `my_chat.family`, stewardship, family membership,
  family-child membership and Scenario binding lifecycle;
- one atomic Child/Family pair-binding owner API and its refs-only audit/outbox;
- Host subject-provider/presentation registry, generic renderer/navigation,
  direct/claimed action orchestration and protected composer/read delivery;
- shared Workflow Run/Step, claim lifecycle and Host capability validation;
- default-deny capability registration and exact adoption evidence.

My-Chat does not own or persist Nurture participants, roles, grants, local Child,
ChildCareProcess, child-scoped Family, business messages/items, protected body,
ciphertext, Scenario command result or Scenario permission. A platform identity,
Workspace membership, family membership, binding or current owner evidence is
routing/policy input and is never sufficient Nurture authorization.

Nurture remains the owner of anchor reservation, local associations, current
business authority, Scenario command transaction, protected store/KMS/retention
and business presentation content. Those implementations are C30-I3, not I2.

## Frozen trusted-ingress behavior

### Public interactive path

1. Authenticate the User and resolve the current Actor and active Workspace from
   the normal My-Chat session.
2. Resolve the declared product/transition ingress from the accepted manifest;
   the client cannot supply or override `scenario_key`, endpoint, method,
   `ingress_key`, principal origin, issuer or audience.
3. Construct `ScenarioHumanPrincipalV1` with
   `principal_origin=interactive_session` and exact canonical account/actor/
   Workspace refs.
4. Build and sign the outbound private invocation only on the server-side
   boundary. Nurture's production verification/nonce consumption remains I3.

### Durable Workflow path

1. Reread the original Run actor/Workspace and the currently claimed Step.
2. Construct the same human principal with
   `principal_origin=durable_run_actor`; worker/service identity never becomes
   the human principal.
3. Bind the invocation to the exact declared Workflow ingress and the original
   Step. A renewed claim may authorize runtime work but cannot mint a different
   business effect identity.

### Private signer, verifier and response transport

The Host outbound signer and inbound verifier MUST bind the exact canonical I1-A
object, detached signature metadata, service credential/caller subject, issuer,
assertion audience, key identity and algorithm. For an operation received by
My-Chat, verification order is closed: authenticate transport caller, select
trusted issuer/audience/key, verify the detached signature over canonical bytes,
validate route/contract/time, atomically consume the nonce, then dispatch the
declared Host-private operation. For an operation issued by My-Chat, the Host
generates an unpredictable, non-reused nonce and production verification/
consumption belongs to the receiving Nurture I3 boundary.

Host-received nonce state is keyed tightly enough to prevent cross-issuer,
cross-audience, cross-caller and cross-request replay. It expires after the
invocation window and is never accepted twice. Signature, nonce, clock, route or
contract uncertainty fails closed without falling back to ordinary API auth,
legacy internal routes or an unsigned in-process call.

Private responses use a separate detached transport signature. Response metadata
binds the originating request identity/nonce hash, route/operation, response body
hash, response status, issuer, audience, caller/service subject, key/algorithm and
its own bounded validity window. Those fields are transport metadata, not new
fields in an I1-B/I1-C/I1-D/I1-E result body. My-Chat verifies the response before
interpreting the result; Nurture's production response signer remains I3 and the
exact two-sided proof remains I4. I2-B uses a synthetic Scenario signer to qualify
the Host verifier without adopting Nurture source.

## Frozen canonical pair-binding behavior

The pair owner API operates on exactly one Child binding and one Family binding
for the same Workspace, Scenario and current family-child relation:

1. Validate the initiating adult's current platform authority, represented
   organization if any, and parent/steward creation authorization.
2. Resolve or create canonical Child/Family only through existing platform
   authority rules; never infer or match them from PII.
3. Obtain two Nurture reservation results through signed private operations.
4. In one My-Chat transaction, reread and fence Child, Family, current
   family-child relation, adult authority, both expected binding heads and the
   exact canonical request hash using database time.
5. Commit both missing/reused bindings and one operation ledger atomically;
   append only refs/body-free audit and outbox records in the same transaction.
6. Return exact `committed|exact_replay` pair result. A half-pair must never be a
   successful or externally visible state.

My-Chat keeps one deterministic, body-free identity-operation record bound to the
actor, Workspace, Scenario, canonical pair, entry/continuation intent, expected
heads, reserved owner refs and canonical input hash. Its business state is
`prepared|bindings_committed|local_committed|closed_no_effect`; a separate
`clear|outcome_unknown` quarantine state prevents ambiguity from being reported
as failure or replayed under a replacement operation.

After Host bindings commit, a following Nurture local command may reach the
Nurture writer and lose its response. The I2 recovery client uses the I1-B status
lookup only for timeout/transport-unknown outcomes. Ordinary validation,
authorization, conflict or domain errors MUST NOT trigger a lookup. The client
accepts only:

- `committed` with exact committed evidence;
- `confirmed_no_effect` after a writer fence proves absence;
- `unknown` as a nonterminal quarantined state.

It never guesses from a current row, retries with a new operation identity,
recreates a missing half, or treats `unknown` as safe to repeat.
The production status resolver and response signer remain I3; I2-C qualifies the
Host client against a synthetic exact resolver, and I4 proves the joint path.

Before every Host route, delivery, retry, result open and protected read, My-Chat
rereads current binding heads, family-child relation and the initiating adult's
current family membership/authority. Current pair evidence is short-lived,
body-free and valid no longer than its enclosing I1-A invocation. Raw platform
Child/Family IDs do not enter Nurture payloads, clients, logs, delivery, search or
generic evidence.

## Frozen presentation behavior

The Host registry consumes exact manifest declarations for list, resolve and
present operations. It maps public product/transition ingress to one declared
Scenario provider and semantic presenter, then renders only accepted I1-C blocks,
safe text/reasons, navigation offers and prepare-only action offers.

- List/resolve/present always run through fresh signed private invocations.
- Subject selection is opaque and does not expose raw platform identities or
  Nurture owner refs.
- Renderers do not infer permissions, roles, routes or actions from display data.
- Navigation resolves only declared route classes and revalidates current context.
- An action offer opens prepare; it never submits or creates an effect.
- Unknown blocks, URLs/addresses in safe copy, duplicate item keys, expired
  context, missing provider/presenter or declaration drift fail closed.

This is generic Host infrastructure only. Guardian/Caregiver product composition
and Nurture-specific copy remain C31-C33 and C30-I3.

## Frozen action behavior

The Host implements exactly the two Base-neutral drivers:

- `scenario_direct_empty_v1` for a direct effect with no Host Workflow Step;
- `workflow_claimed_step_v1` for an already claimed original Step.

Both follow prepare → explicit confirmation/required assurance → submit. Prepare
has zero business effect. The Host does not persist submit tokens, claim tokens,
protected bodies or Scenario results in generic payloads.

Direct effect identity binds Workspace, `scenario_key`, action and submit context.
Claimed effect identity binds Workspace, `scenario_key`, action and the original
Step. The claimed path binds before execute, looks up only the same Step after an
ambiguous response, and completes/releases that Step from the exact Scenario
result. A renewed claim or retry cannot change effect identity. There is no third
driver, implicit direct fallback, synthetic Step or generic business writer.

## Frozen protected-interaction behavior

The dedicated `ScenarioProtectedPlainTextCarrierV1` travels separately from the
body-free I1-A/I1-C/I1-D control object and is joined only by the keyed carrier
binding. My-Chat may hold plaintext only in bounded request/foreground display
memory while transporting it to/from the Nurture owner.

My-Chat MUST NOT place plaintext or ciphertext in generic DTOs, Run/Step,
idempotency ledgers, action results, outbox, audit, logs, traces, metrics,
analytics, crash reports, clipboard, screenshots, search, notification, deep
links, offline state, browser storage or mobile persistence. Read output requires
a current foreground request and a `no_store` display lease of at most 60
seconds. Backgrounding, lease expiry, offline transition, navigation away,
context change or owner failure clears the carrier and closes the view.

Nurture owns protected persistence, encryption/KMS, integrity, tombstone and
retention. C30-I2 implements the Host transport/composer/read guard only.

## Manifest, capability and source convergence

My-Chat MUST consume the exact accepted `scenario_contracts` graph and validator:

`trusted_scenario_invocation_v1` →
`scenario_subject_presentation_v1` →
`scenario_domain_action_execution_v1` →
`scenario_protected_interaction_v1`.

The My-Chat registry accepts only dependency-complete prefixes, exact named
sources and declared operations/providers/presenters/actions/protected rows. It
must not register vNext and legacy aliases for the same route, handler, action or
surface and must not fall back after vNext validation fails.

C30-I2 compiles and qualifies support but keeps all four capabilities absent or
disabled for every Workspace. It creates no positive activation, allowlist,
admission, invitation or traffic state. `ScenarioWorkspaceActivation` and C35
positive activation controls are not C30-I2 deliverables.

## Database and migration boundary

Only I2-C may change My-Chat persisted identity/binding structures. Before that
unit changes Prisma, it must use the repository `sync-db-schema-from-code`
workflow, produce an exact diff preview, projection review and rollback plan, and
receive the unit's explicit implementation/target authorization.

Any database verification must use a fresh disposable PostgreSQL instance on an
explicitly authorized port. It must never target an existing local, staging or
production database. No migration apply, Prisma generation or build is authorized
by this scope-freeze turn.

The migration must be a narrow C30 identity/binding migration after domain/API
shape is frozen. It cannot mix T-028 cleanup, C34 inbox/Notification, C35
activation/admission, protected AI, product facts or unrelated schema repair.

## Donor disposition

| Donor | Disposition | Constraint |
| --- | --- | --- |
| Accepted Base I1-A..F source/Schemas/validator | `ADOPT EXACT` | Normalize only package import alias/path; no semantic fork, field rename, narrowed validator or partial Schema population. |
| Current My-Chat contract package/lock tooling | `REWORK` | Preserve workspace packaging mechanics; upgrade to exact Base source/profile semantics and bind both upstream Base and committed My-Chat source. Do not change package version/publication in C30. |
| Existing Logto/API auth context | `REUSE` | Public interactive input only; never a private invocation verifier or Scenario permission. |
| Existing Child/Family/stewardship/membership models | `REUSE` | Remain canonical platform owner facts; add only what atomic pair/recovery requires. |
| Existing separate binding service/repository/routes | `REWORK` | Extract transaction, outbox, idempotency and authorization mechanisms; no final separate-write API or half-pair repair. |
| Existing Nurture owner resolver | `REWORK` | Replace ordinary per-subject resolution with exact signed reservation/pair/current evidence operations. |
| Existing workflow registry/validator | `REWORK` | Preserve immutable descriptor/validation mechanics; adopt exact graph and no-alias rules. |
| Existing claimed-Step port/bridge | `REWORK` | Preserve lease/claim and no-token-persistence mechanisms; bind exact I1-D same-Step semantics. |
| T-029 mixed candidate changes | `ZERO DIRECT MERGE` | Donor disposition in artifact 13 remains controlling. |
| T-028 cleanup, C34 Notification/inbox, C35 activation/admission, protected AI | `DEFER / EXCLUDE` | Separate owners and gates; cannot enter C30-I2 commits or migration. |

## Planned My-Chat impact

The exact file list is frozen per unit after the new My-Chat task is registered,
but impact is bounded to these areas:

- `packages/workflow-contracts`: exact Base contracts, Schemas, validators and
  downstream source lock/profile checks;
- `packages/workflow-runtime`: trusted invocation registry, presentation/action
  orchestration and exact manifest validation;
- `packages/domain/child-identity` and `packages/db`: atomic pair domain/repository,
  operation ledger, current evidence/status lookup and narrow migration;
- `apps/api`: public interactive ingress, private signer/verifier/nonce boundary,
  pair-owner/private operation controllers and fail-closed wiring;
- generic Web/Mobile shell adapters only where semantic rendering or protected
  no-store lifecycle needs a Host implementation;
- tests, conformance, generated DB/context projections and task evidence for the
  same bounded population.

No Nurture or Base source is modified by C30-I2 implementation. Cross-repository
joint tests and Nurture manifest/module adoption remain I3/I4.

## Ordered implementation units

| Unit | Scope | Exit |
| --- | --- | --- |
| `C30-I2-A` adoption preflight and exact Base import | Register the new My-Chat local task; adopt exact I1-A..F TypeScript/Schemas/validator; upgrade downstream lock/profile checks without removing legacy source semantics. | My-Chat package parity, Schema population, type/lint/unit/source checks and immutable upstream/local pins pass. No runtime handler, DB or capability. |
| `C30-I2-B` trusted ingress, signer and nonce | Add public session/Workspace translation, durable Run-actor translation, detached outbound signer/inbound verifier, response verifier, trust/key policy and Host-private atomic nonce store. | Positive interactive/durable and synthetic response calls plus wrong caller/issuer/audience/key/signature/route/clock/nonce/replay/body-hash negatives pass; all dispatch targets remain synthetic/default-off. |
| `C30-I2-C` canonical pair owner | Freeze domain/API, perform narrow Prisma migration, implement reservation client, atomic pair writer, current evidence and three-state recovery. | Fresh disposable PostgreSQL proves atomicity, exact replay, four binding-resolution branches, response loss, writer fences, concurrent revoke/merge/relation change, refs-only outbox/audit and zero half-pair. |
| `C30-I2-D` subject/presentation registry | Implement exact provider/presenter/surface registry, safe renderer and navigation/action-offer adapters. | Contract/Semantic/route/error/accessibility tests pass with fresh owner reread, no raw IDs/owner refs and no action effect. |
| `C30-I2-E` generic domain actions | Implement prepare/submit, assurance, direct empty and claimed original-Step orchestration plus same-Step recovery. | Zero-effect prepare, stable effect identity, exact replay/conflict/unknown, no claim-token persistence and direct/claimed fault matrices pass. |
| `C30-I2-F` protected Host runtime | Implement isolated composer/carrier transport, foreground read and leakage/cache/offline lifecycle guards. | Recursive destination census and foreground/background/offline/expiry/context-change tests prove no protected copy outside bounded carrier memory. |
| `C30-I2-G` manifest/default-off convergence and cumulative qualification | Wire the exact registry declarations, eliminate legacy aliases, compute downstream identities, run cumulative clean-build/test/schema/DB/no-copy/default-off qualification and pin the handoff. | Exact Base/My-Chat revisions and hashes, deterministic artifacts, all unit evidence and absent/off capability census pass; no Nurture consumer or activation. |

Each unit is a separately reviewable and revertible checkpoint. Authorization of
one unit does not authorize the next. I2-C additionally requires the database
target authorization described above.

## Cumulative acceptance

C30-I2 may close only when all of the following are true:

1. My-Chat contract source, Schemas and validator are byte/semantic-parity with
   the exact Base handoff and are sealed by immutable upstream/local revisions.
2. Interactive and durable principals are human and current. Host outbound
   signing, inbound private verification and response verification pass exact
   synthetic conformance for caller, issuer/audience/key/time/route/body hash;
   every Host-received nonce is consumed once with no fallback. Production
   Nurture request verification/nonce consumption and response signing remain I3.
3. canonical Child/Family creation/resolve and Scenario pair binding are
   authority-backed, transaction-atomic, exact-replayable and writer-fenced.
4. Current pair evidence is short-lived/body-free, and every protected route,
   delivery, retry and open rereads current platform authority and relation.
5. Semantic provider/presenter/renderer/navigation behavior is declared, bounded,
   safe and permission-neutral.
6. Direct and claimed actions preserve prepare/submit separation, explicit
   assurance, `scenario_key` effect identity and original-Step recovery.
7. Protected content exists only in the dedicated transient carrier and Nurture
   owner; Host durable/cache/offline/leakage destinations remain empty.
8. Manifest dependency/source declarations, runtime registry and downstream
   source evidence converge with no legacy/vNext alias or fallback.
9. Typecheck, lint, unit/conformance, Schema, disposable PostgreSQL,
   concurrency/fault, no-copy and deterministic qualification populations pass.
10. Every C30 capability and Workspace activation/admission row remains
    absent/off; external traffic count remains zero.

The only successful state is
`C30_I2_GENERIC_HOST_ADOPTION_ACCEPTED_DEFAULT_OFF`. It opens C30-I3 scope review
only; it does not open I3 implementation, I4, C31-C35, T-008, deployment,
activation or Pilot.

## Troubleshooting and fail-closed rules

- If Base source/lock/profile bytes drift, stop and return to I2-A. Do not patch a
  downstream validator around the difference.
- If task resolution returns My-Chat `T-002 content-events`, stop and register the
  new My-Chat task; do not commit with the collided trailer.
- If one binding commits without the other, reject the migration/runtime design;
  do not add a compensating repair route.
- If a response is ambiguous, use only the exact writer-fenced status protocol;
  never retry from a guessed row state.
- If protected content appears in any generic object or durable destination,
  reject the unit and purge only disposable test state; do not qualify a partial
  exception.
- If a vNext declaration fails, keep the capability unavailable. Legacy fallback
  is a defect, not a continuity feature.

## Outputs and next gate

This scope review outputs:

- the current My-Chat gap census;
- exact ownership/security/runtime boundaries;
- donor dispositions and bounded impact;
- seven ordered implementation units;
- cumulative acceptance and rollback/NO-GO rules.

No implementation output was produced. The only eligible next decision is a
separate authorization for `C30-I2-A`. Until that authorization, Base and My-Chat
remain on the entry revisions recorded above; Nurture advances only through this
scope-freeze governance commit. C30-I3+ remains closed.
