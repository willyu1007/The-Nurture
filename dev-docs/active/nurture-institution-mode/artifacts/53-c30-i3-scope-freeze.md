# C30-I3 Scenario-Owner Adoption Scope Freeze

## Purpose and decision

- Date: 2026-08-06
- Governance decision: `REUSE_TASK`
- Mapping: `M-002 > F-002 > T-002 nurture-institution-mode`
- Entry Base source: `15ff031ed16897920c13fe24c9849531d98607ad`
- Entry Base metadata lock: `4350086993d837baa8030564f4e19593dedd96b0`
- Entry Base aggregate:
  `d17f23585bb90ab607eb0fc80af629d8ab13ceb4508118de28162e4fd8846383`
- Entry My-Chat runtime: `658b897360734dfa916ce25abda7a8db5fb3f27d`
- Entry My-Chat replacement lock: `6725dc68fb8c23da2ff39651b6d825a159a8a8b1`
- Entry My-Chat aggregate:
  `8172e370dfb5db0876709c6f7a01999314ac266bf71ba166854f9effa510a5ad`
- Entry My-Chat reacceptance/archive:
  `cd7bbc2623dff8621c2c7155b04d1bf759e8404a`
- Pre-freeze Nurture source: `eec87b955ee8dbc854ebddb2c57887f8aff00feb`
- State: `C30_I3_SCOPE_FROZEN / I3_A_SEPARATE_AUTHORIZATION_REQUIRED`
- Downstream: `C30_I4_NO_GO / C31_C35_NO_GO / C40_C45_NO_GO /
  T008_NO_GO / DEPLOYMENT_NO_GO / ACTIVATION_NO_GO / PILOT_NO_GO`

The user's C30-I3 authorization permits this review and governance freeze only.
It does not authorize I3 implementation, package or application source changes,
manifest/module mutation, Prisma generation, schema/migration work, database
access, KMS/secret configuration, capability registration or activation,
deployment, T-008, I4, C31 or Pilot work. This freeze changes only Nurture
task/project/context documentation.

This document is the implementation entry contract for Nurture adoption of the
accepted neutral Base contracts and the accepted default-off My-Chat Host
runtime. It is not an implementation or readiness claim.

## Scope-resolution decision

C30 is the shared Scenario-owner baseline, not the first Guardian/Caregiver
product slice. Therefore C30-I3 MUST NOT invent a placeholder action, relabel a
legacy Workflow Run action, or prematurely register C31's
`submit_family_care_question` merely to populate the complete four-capability
graph.

The production Nurture manifest at the I3 exit uses the Base-permitted
dependency-complete prefix:

1. `trusted_scenario_invocation_v1`;
2. `scenario_subject_presentation_v1`.

Its presentation declarations use `action_offer_policy=none` and
`action_keys=[]`. Its production `domain_action_contracts` and
`protected_interaction_contracts` arrays remain empty, and the action/protected
capabilities and their manifest source rows remain absent. This is a complete,
valid prefix, not a partial or mixed capability graph.

I3 still implements and verifies the Nurture-owned generic action execution and
protected-content primitives required by the C30-I3 program output. Those
primitives are exercised only through closed, test-only conformance fixtures in
I3. They do not create a production action, route, surface, handler declaration,
capability or activation row. C31-I3 may extend the same canonical manifest to
the complete four-capability graph only when it adds the first real reviewed
Guardian query/presenter/action/protected declaration. It must not fork the I3
runtime.

This separation is exact:

- the production manifest contains only source rows required by its two-capability
  prefix, because stale/unreferenced source rows are invalid;
- the immutable I3 downstream lock independently binds all four Base profiles and
  all seven accepted My-Chat profiles as implementation inputs;
- test fixtures are not release declarations and cannot be loaded by the
  production module;
- legacy v1/v2 fields remain compatibility data in the one canonical manifest,
  but no legacy/vNext alias or fallback may satisfy a C30 declaration.

## Exact immutable inputs

The accepted Base named profiles are:

| Profile | Hash |
| --- | --- |
| `platform_child_family_identity_source_v1` | `81d9fb9db244b8e56bc85e8770eb13915ca87b6053bb3411420b569d59d8fed4` |
| `scenario_interface_source_v1` | `37f0cdae3ad8807073dd250a51f4de990dcccf40952c127b2340161db2e28eaf` |
| `scenario_domain_action_source_v1` | `b7c35259d03a84778cc909075a08d6b147a43a38a12cddeb875c94f01591e48d` |
| `scenario_protected_interaction_source_v1` | `78eadaf4448b61ab3629026fefe4befbb2522eccbc7e459366d1032885d90efb` |

The accepted My-Chat profiles are:

| Profile | Hash |
| --- | --- |
| Trusted invocation runtime | `a69a9de4a53d5b7a2026fc547604795ae7bb4a6ec990da680b0f66dd4cd83be7` |
| Canonical pair runtime/schema | `e611afb340fdd41455c59e2817166297bac0397a76a4d1b47c2fcdced5440cff` |
| Presentation runtime | `aa0746037561dac8ea12cb813e0412509a02a39d4ec629493f0e18679084db69` |
| Action runtime | `01c512c2de3a4714d05a876e02a1cd59880db1b6348b270902385854bfb73c33` |
| Protected runtime | `333f3ff028db7f881d03dd59a0f74eec486437c2d7e7efab27bc87f356efe507` |
| Adoption registry | `ae60f2165a6ff7d2b172b2cb4fc4611f8c4aeef2033d924f4b5d3939a055d5d0` |
| Qualification tests | `c1688aa5cad46548ba8373ff309d280b4fab1ce76e73895513838298d0835736` |

The old Nurture G1 integration pin remains immutable historical evidence for the
previous My-Chat `a019566…` / Base `06303e9…` topology. I3 must create a separate
C30 adoption lock and must not overwrite, broaden or reinterpret the G1 pin.

## Current Nurture gap census

| Area | Reviewed state at `eec87b9…` | Frozen I3 disposition |
| --- | --- | --- |
| Manifest source | `scenario.manifest.yaml` is canonical in principle, while `src/registry.ts` independently hand-copies its population. | Keep one editable YAML source and mechanically generate the typed artifact; byte/semantic parity and clean regeneration are gates. |
| Module exports | Separate pre-activation/activation constructors and a compatibility `nurtureScenarioModule` alias expose multiple derived modules. | Export one canonical default-off module population. Remove dual derived manifests and compatibility fallback; activation remains Host-owned and absent. |
| Dependency pins | The v2 integration pin still proves the historical G1 source/profile population. Root scripts can resolve mutable sibling paths after verification. | Add a distinct C30 downstream lock over exact Base/My-Chat revisions, hashes, profile populations and Nurture generated artifacts. Mutable paths may be build inputs only after exact verification, never release evidence. |
| Private ingress | The formal owner surface predates I1-A/I2 detached invocation signing, response signing and Scenario-private nonce semantics. | Add an isolated verifier/response signer and Scenario-private atomic nonce store. No bearer/service-token or session-only fallback may enter the C30 routes. |
| Participant identity | `NurtureParticipant.myChatUserId` is an unversioned legacy string binding; identity, actor provenance and authorization are not separated. | Add typed/versioned canonical account/actor/Workspace binding to a local Participant. Preserve historical values without reinterpreting them; verified identity is still not Nurture permission. |
| Child/Family binding | Typed child/family anchors and workspace associations exist, but the old owner flow authorizes and persists subjects separately from raw request identities. | Rework to the exact signed pair reservation/evidence/status protocol and one atomic local association transaction. Never derive, mint or equate a platform ID with a local ID. |
| Business execution | `CommandExecution.businessActorRef` is a polymorphic string and the current runner predates I1-D direct/claimed provenance. | Add typed/versioned actor and invocation provenance; converge on one canonical runner and preserve historical rows as historical. |
| Subject/presentation | Existing scenario presenters and institution surfaces were built for earlier contracts and are not I1-C declarations. | Implement one owner-resolved `NurtureChildCareProcess` subject provider and safe, action-free baseline presentation. Do not relabel existing presenters as adoption. |
| Domain actions | Legacy `action_availability.scenario_actions`, including `capture_family_input`, are Workflow Run compatibility surfaces. | Implement the generic I1-D owner runtime with no production action registration in C30. C31 owns the first real product declaration. |
| Protected content | `protected-content.ts` uses an application key to produce an AES-GCM JSON envelope stored through legacy fields. | Add authoritative `NurtureProtectedContent` storage with a per-content DEK wrapped by an isolated KMS port, lifecycle/retention/tombstone/crypto-erasure controls and no static-key authority. Keep legacy storage outside the C30 path; no fallback. |
| Package ownership | Some Nurture DB test/dev dependencies reference My-Chat packages; production Scenario code still has historical host-facing seams. | Production packages import only accepted neutral contracts and Nurture ports. My-Chat ORM, DB, queue, worker, runtime and package paths remain outside production ownership; joint-only composition waits for I4. |
| Activation | No accepted Nurture C30 registration or capability/Workspace activation exists. | Keep all positive activation/admission populations absent/off and external traffic zero throughout I3. |

Existing code is donor material only. Passing legacy tests or schema presence is
not proof of I3 adoption.

## Frozen ownership and trust boundary

My-Chat continues to own canonical account/actor/Workspace identity, platform
Child/Family identity and authority, Scenario binding pairs, public interactive
and durable Workflow ingress, outbound request signing, response verification,
generic Host rendering/orchestration, transient protected carrier and capability
activation.

Nurture owns:

- private request verification, response signing and its own received-nonce
  consumption;
- local Participant binding plus current Nurture role/business authorization;
- body/PII/authority-free typed platform anchors and workspace-local
  associations;
- local Child, `NurtureChildCareProcess`, child-scoped Family and all care facts;
- owner provider/presenter/command/Execution/status/recovery semantics;
- protected ciphertext, wrapped-DEK metadata, integrity, retention, tombstone and
  cryptographic erasure;
- canonical Nurture manifest, generated module artifacts and downstream locks.

A valid My-Chat principal, platform relationship, binding pair, Workspace route,
subject ref or capability declaration is input to routing/policy only. Each
Nurture read, prepare, submit, replay, recovery and protected read MUST reread
current local role/scope/policy/lifecycle authority and the required current
platform evidence. No identity or binding alone grants fact access.

## Frozen private-ingress and Participant behavior

1. Verify exact caller, issuer, audience, key/trust/revocation state, signature,
   method, route, body hash, issued/expiry time and bounded clock skew before
   parsing delegated operation input.
2. Atomically consume one nonce in a Nurture-private store. Unknown, expired,
   reused or concurrently consumed nonce fails before any owner read or effect.
3. Accept only manifest-declared operation/ingress combinations. Clients cannot
   select `scenario_key`, principal origin, endpoint, driver or handler.
4. Bind the verified canonical account/actor/Workspace provenance to one current
   local Participant through a typed/versioned association. Account, Actor,
   represented organization and Workspace remain distinct fields.
5. Resolve current Nurture role and business scope separately. Suspended,
   ambiguous, cross-Workspace or unbound Participants fail closed.
6. Bind the signed response to the exact request/correlation/nonce/operation and
   return only contract-defined safe results. No service-token fallback,
   unsigned response or alternate dev-host path is accepted.

The durable principal always represents the original current human Run actor;
worker/service identity never becomes the business actor.

## Frozen pair-anchor and local-association behavior

The Nurture pair flow consumes the exact I1-B/I2-C protocol:

1. A currently authorized parent/steward initiates or resumes the Host-owned
   Child/Family pair operation. Nurture never creates or infers a platform pair.
2. Nurture reserves only random, typed, scenario-global child/family owner
   anchors. Anchors contain no Workspace, PII, dossier, local role or authority.
3. Current signed pair evidence binds both platform refs, both owner refs, exact
   binding heads, current stewardship/family relation and an expiry bounded by
   the accepted contract.
4. One Nurture transaction exact-replays or creates the Participant binding,
   local Child, `NurtureChildCareProcess`, child-scoped Family, initial local role,
   both workspace associations, one `CommandExecution`, refs-only audit and
   refs-only outbox. Unique/version/idempotency/authority failure rolls back all
   local writes.
5. Response loss uses only the exact writer-fenced status operation. It returns
   the accepted three-state result from a coherent current snapshot and never
   guesses from a partial anchor or retries a new effect.
6. Revoked/merged/replaced platform evidence, local association conflict,
   partial pair, wrong pair, stale head, wrong actor/Workspace or ambiguous local
   state fails closed. Recovery and normal write paths cannot race into two
   current local associations.

Existing `NurtureChild.id` is never promoted to, hashed into or equated with a
platform `child_id`. Existing local-only children remain provisional/historical
unless a separately authorized real parent-owned pair operation establishes the
new association.

## Frozen subject and presentation behavior

- Shared contracts continue to say `subject`; Nurture resolves one exact
  workspace-local `NurtureChildCareProcess` only after current pair evidence and
  local authority succeed.
- List and resolve return owner-issued opaque refs only. They expose no raw
  platform ID, anchor, local primary key, PII, protected body or authority token.
- The C30 baseline presentation is read-only, role-neutral and action-free. It
  uses only the accepted I1-C closed semantic blocks and deterministic safe copy.
- Every list/resolve/present call rereads current Participant, Workspace, local
  role/scope, pair evidence, association and process lifecycle. A ref is never a
  permission cache.
- Page/section/item bounds, owner cursors, display-safe navigation and semantic
  block validation follow the exact Base contracts. Generic Host code does not
  learn Nurture business IDs or protected facts.
- Guardian authority, family question, caregiver work, Institution workbench,
  Enrollment, Grant, Message, Item and Attention product presentations remain
  C31-C34. Existing presenter implementations are not relabelled.

I3-D must freeze the exact provider/presentation/surface keys in the generated
registry before runtime wiring. Those keys are Nurture-local, stable and
collision-checked; this scope deliberately freezes their semantics without
inventing C31 product keys.

## Frozen action runtime and typed evidence

I3 implements one canonical owner runner for the exact I1-D transport and
execution contracts:

- prepare is read-only and returns availability/confirmation/assurance plus
  owner-issued opaque refs; it creates no protected or business effect;
- submit re-verifies the private envelope, current Participant, surface/action
  entitlement, target, expected version, binding evidence and business policy;
- direct identity includes Workspace, `scenario_key`, action and submit context;
- claimed identity includes Workspace, `scenario_key`, action and the original
  Step; claim renewal never changes the original Step identity;
- one transaction writes the business effect, canonical `CommandExecution`,
  typed actor/invocation provenance, body-free result, refs-only audit and
  refs-only outbox;
- exact replay returns the committed result; changed input, stale authority,
  ambiguous status or conflicting identity returns a closed result with no new
  effect;
- rejected/compensated attempts do not masquerade as committed Executions, and
  no second runner or legacy action fallback exists.

The production registry has zero C30 domain actions. I3 action conformance uses
an isolated neutral fixture unavailable to the production module. The fixture
must prove both direct and claimed paths, replay/recovery/fault behavior and zero
claim-token persistence without introducing a Nurture product intent.

## Frozen protected-content lifecycle

`NurtureProtectedContent` is the sole authoritative C30 owner store. Its exact
schema is additive and separates:

- opaque content identity/version and owning action/aggregate refs;
- ciphertext, nonce/IV, authentication tag and algorithm/version;
- wrapped per-content DEK plus KMS key-domain/version metadata, never key bytes;
- lifecycle, retention horizon, tombstone/erasure reason and timestamps;
- integrity and typed creator/last-transition provenance;
- no plaintext, safe summary, raw platform ID, claim token, credential or
  reusable display lease.

Plaintext enters only through the dedicated I1-E carrier after current authority
and context validation. It is encrypted before the business commit and is never
written to CommandExecution input/result, audit, outbox, log/trace/metric,
analytics, search/vector, cache, notification, route state, fixture snapshot or
evidence. A protected read performs fresh pair/local/business authorization,
decrypts through the KMS port, returns a foreground-only bounded lease and emits
`Cache-Control: no-store` behavior at the owner boundary. Expiry, revoke,
redaction, retention or crypto-erasure makes later reads carrier-free and cannot
revive after backup/restore or replay.

I3 implements the KMS port, key-domain policy and deterministic isolated test
adapter. It does not provision or receive a production KMS key or secret. Real
secret custody and production-shaped isolated KMS qualification remain later
explicit gates.

The current static-key JSON envelope and its columns remain legacy data only.
I3 performs no automatic decrypt-and-reencrypt migration, no fallback read and
no destructive removal. A later product slice must explicitly migrate or retire
each legacy producer/consumer before claiming that product path.

## Canonical manifest, module and source convergence

1. `packages/nurture-scenario/scenario.manifest.yaml` remains the only editable
   manifest source.
2. Typed registry/module artifacts are deterministic generated outputs with a
   checked generator identity and clean-regeneration test. Hand-copied values are
   forbidden.
3. Exactly one production module is exported. It contains the canonical
   default-off declaration and no preactivation/activation dual population,
   vNext alias or hidden fallback.
4. Production uses the exact two-capability prefix and matching two source rows.
   Test-only complete-graph fixtures live outside the exported production module.
5. A new C30 adoption lock binds exact Base/My-Chat revisions, upstream profile
   hashes, Nurture source populations, Prisma schema/migrations where applicable,
   manifest/generator/generated-module hashes and qualification tests. Unknown,
   missing, reordered, extra, symlinked or dirty inputs fail.
6. Sibling paths may be used only after exact commit/hash verification. No
   `file:`, `link:`, branch, tag or mutable checkout identity is release evidence.
7. Generated DB/context projections refresh only from the canonical Prisma SSOT
   after an authorized schema unit. Generated descriptors never become a second
   source of truth.
8. Every C30 capability and Workspace/admission/positive-route population remains
   absent/off. Merely loading the module cannot activate a capability.

## Donor disposition

The T-029 candidate is not directly merged. Its frozen disposition remains:

| Donor area | I3 disposition |
| --- | --- |
| N01 private owner API | `REWORK`: exact I1-A/I2 signed private envelope, nonce, direct/claimed context and response signing. |
| N02 command transaction | `REWORK`: one effect + canonical Execution + typed provenance + refs-only audit/outbox transaction. |
| N03 raw platform refs | `REWORK`: typed anchors, exact pair evidence and workspace-local associations only. |
| N04 actor metadata | `REWORK`: typed account/actor/Workspace/organization provenance separate from authorization. |
| N05 runner | `REWORK`: one canonical runner; no rejected/compensated Execution fiction. |
| N06 outbox | `REWORK`: closed refs-only codec, stable identity, bounded lease/retry and privacy census. |
| N07 manifest | `REWORK`: one canonical/generated population, dependency-complete prefix, no placeholders or dual manifests. |
| N08 exports | `REWORK`: export only accepted public contracts/runtime; no donor-only aliases. |
| N09 mutable Host links | `REJECT`: production/release evidence cannot depend on My-Chat DB/worker/runtime paths. |
| N10 joint tests | `DEFER`: exact two-database composition belongs to I4. |
| N11 migration | `REJECT/REPLACE`: write a new additive migration after fresh schema diff; never apply the old candidate migration. |
| N12 context | `REGENERATE`: derive DB/API/workflow context only after accepted canonical source changes. |

## Impact boundary

Authorized I3 implementation may affect only:

- `packages/nurture-scenario`: exact neutral-contract consumption, canonical
  generator/module, provider/presenter/action/protected owner ports and tests;
- `apps/scenario-service`: the one production private verifier/response signer,
  nonce boundary and exact operation controllers;
- Nurture domain/repository packages: Participant binding, pair anchors/local
  associations, subject resolution, canonical Execution/actor provenance,
  protected content and retention/erasure;
- `prisma/schema.prisma`, one or more newly generated additive migrations and
  generated DB context only in the schema-owning units;
- configuration contract entries for typed trust/KMS references without secret
  values, plus tests and task evidence;
- existing legacy code only where necessary to prevent alias/fallback or route
  collision with the new owner path.

It may not modify Base or My-Chat source, import the My-Chat ORM/runtime/worker,
create a Host route/queue/ledger, add C31 business semantics, change T-005/T-006
accepted product facts without an explicit owning-slice migration, or touch an
existing database.

## Ordered implementation units

| Unit | Scope | Exit |
| --- | --- | --- |
| `C30-I3-A` adoption preflight and canonical manifest foundation | Verify exact Base/My-Chat handoffs; add the distinct downstream lock; replace hand-copied/dual manifest-module population with one YAML-generated default-off two-capability prefix. | Exact source/profile verification, canonical/generated parity, dependency-prefix, no-alias, clean-regeneration, package typecheck/lint/unit and absent/off static census pass. No runtime route, DB or capability activation. |
| `C30-I3-B` private trust and Participant binding | Add detached request verifier, response signer, Scenario-private nonce repository and typed canonical principal-to-Participant binding; wire only synthetic/default-deny operation targets. | Caller/issuer/audience/key/signature/route/body/time/nonce/replay negatives and interactive/durable principal cases pass; authorization remains separate; no service-token fallback. |
| `C30-I3-C` pair anchors and atomic local association | Perform the narrow additive Prisma migration; implement exact anchor reservation, current pair evidence, atomic local bootstrap/association transaction and writer-fenced status recovery. | Fresh disposable PostgreSQL proves all four binding-resolution branches, exact replay, response loss, concurrent revoke/merge/relation change, zero half-pair, refs-only audit/outbox and unchanged existing databases. |
| `C30-I3-D` subject provider and baseline presentation | Implement exact list/resolve/present operations over owner-resolved `NurtureChildCareProcess`; freeze stable provider/presentation/surface keys and safe action-free semantics. | Current pair/local-role rereads, bounds, pagination, opaque refs, safe-copy, cross-Workspace/stale/revoke/error negatives and semantic rendering pass; production manifest remains the exact two-capability prefix. |
| `C30-I3-E` canonical action owner runtime | Add one prepare/submit/status runner, typed actor/invocation provenance and direct/claimed transactional/recovery behavior; expose it only to an isolated neutral conformance fixture. | Direct/claimed prepare-submit-replay-conflict-response-loss/fault matrices pass; no claim token/body leak, second runner, product action, production handler declaration or positive route exists. |
| `C30-I3-F` protected owner lifecycle | Add authoritative protected-content schema/repository, KMS port/test adapter, per-content wrapped DEK, current read, retention/tombstone/crypto-erasure and recursive no-copy controls. | Fresh/upgrade disposable DB, encryption/integrity/key-failure/read/revoke/expiry/erase/restore and destination-census tests pass; legacy envelope has no C30 fallback; no real KMS secret is configured. |
| `C30-I3-G` cumulative convergence and default-off qualification | Seal exact manifest/module/schema/migration/route/registry/profile/test populations, refresh generated context and run cumulative clean qualification. | One immutable Nurture downstream lock; exact two-capability production prefix plus isolated full-graph fixture; typecheck/lint/unit/conformance/schema/fresh-DB/no-copy/determinism/portability/default-off checks pass. Opens I4 scope review only. |

Each unit is separately reviewable and revertible. Authorization of this scope
freeze does not authorize I3-A. Authorization of one unit does not authorize the
next unless the user later grants an explicit broader I3 implementation mandate.
Any build, Prisma generation, disposable PostgreSQL or external KMS operation
must remain within the later authorization and exact target declared for that
unit. No existing database is ever a qualification target.

## Cumulative acceptance

C30-I3 closes only when all of the following are true:

1. Exact accepted Base and repaired My-Chat revisions, locks and named profiles
   are verified before any local dependency use and sealed with deterministic
   Nurture source populations.
2. One canonical YAML produces one typed production module; regeneration is
   clean, v1 compatibility remains explicit, and no dual/legacy/vNext alias or
   activation constructor bypass exists.
3. Production declares exactly the valid trusted+presentation dependency prefix,
   with action-free Nurture subject presentation. Action/protected runtime uses
   test-only fixtures and cannot enter production registration.
4. Private request/response authentication, atomic nonce handling and current
   human Participant binding fail closed for every trust/replay/scope negative.
5. Platform Child/Family remain My-Chat canonical objects; Nurture stores only
   typed opaque anchors and atomic workspace-local associations and proves exact
   pair recovery without half-pairs or inferred identity.
6. Every subject/read/prepare/submit/status/protected operation rereads current
   pair evidence plus Nurture Participant, role, scope, policy and lifecycle.
7. One canonical Execution path preserves typed actor provenance, direct
   scenario-bound and claimed original-Step identities, exact replay, body-free
   results and refs-only audit/outbox.
8. Protected plaintext exists only in the accepted carrier and transient owner
   memory; authoritative persistence is ciphertext with per-content KMS-wrapped
   DEK, retention/tombstone/crypto-erasure and no legacy fallback.
9. Fresh and supported-upgrade disposable PostgreSQL, schema/context parity,
   typecheck, lint, unit/conformance, concurrency/fault, no-copy, determinism and
   source-portability populations pass against the same committed candidate.
10. Every C30 capability/Workspace/admission/positive route remains absent/off,
    no Base/My-Chat repository is changed, no existing database is touched and
    external traffic remains zero.

The only successful state is
`C30_I3_SCENARIO_OWNER_ADOPTION_ACCEPTED_DEFAULT_OFF`. It opens only a separate
C30-I4 scope review. It does not authorize I4 execution, C31-C35, T-008,
deployment, activation, Pilot or traffic.

## Rollback and NO-GO

- Each source unit lands as a bounded checkpoint; source-changing units precede
  one metadata-only final lock. A lock never points at a dirty worktree.
- Schema changes are additive. Rollback disables/removes the unactivated C30
  registration and reverts code to the last accepted checkpoint; destructive
  production down-migration or rewriting business facts is not the default.
- A mixed Base/My-Chat revision, stale profile, mutable dependency, hand-edited
  generated artifact, duplicate module, undeclared route or legacy fallback
  invalidates the unit.
- Half-pair, guessed recovery, untyped actor, identity-as-permission, raw
  platform/anchor leakage, Prisma in business services or Host runtime/ORM
  ownership inside Nurture is `NO-GO`.
- Plaintext/static key/body-derived copy in any durable/generic destination,
  unwrapped DEK, ambiguous KMS state or revival after erasure is `NO-GO`.
- Any production action/protected declaration before its C31 product contract,
  placeholder action, `capture_family_input` alias or hidden capability
  activation is `NO-GO`.
- Failure never authorizes I4, C31, deployment, activation or a workaround route.
  Return to the smallest failed I3 unit and reseal a new candidate only after the
  repair passes.

## Outputs and next gate

This review freezes:

- the exact Base/My-Chat inputs and historical G1 separation;
- the two-capability production-prefix decision and C31 product boundary;
- Nurture trust, identity, binding, authority, action and protected ownership;
- donor disposition and bounded impact;
- seven ordered implementation units;
- cumulative acceptance, rollback and NO-GO rules.

No implementation output was produced. The only eligible next decision is a
separate authorization for `C30-I3-A`, or an explicit broader authorization for
the ordered I3-A..G implementation. C30-I4 and every operational gate remain
closed.
