# Nurture Scenario Contract

Status: G4 exit and C30 current-pin requalification complete; surface identity is `nurture.surface-contract@1.20.0`; W2 parent context, W3.1 parent communication, W4 read-only director and W6 teacher class-stream contract supply are qualified default-off (W6 with disposable-DB-qualified real owner ports). G5-A Candidate `nurture.service-candidate@1.0.0` is frozen and untouched by later mainline supply; C31+, deployment, activation and traffic require their own gates.

## Product Terminology Compatibility

Current product semantics are defined by
`docs/context/product/workflow-product-design-contract.md`:

- product `Workflow` means an institution-management `InstitutionWorkflow`;
- family-care submit/acknowledge/reply are `ActionExecution`;
- notification/Handoff/Outbox materialization is `ActionDelivery`;
- family-care Message/CareItem/Event/Receipt facts form a `CareInteraction`;
- caregiver draft/review/publish is a `PublishProcess`.

This file also records existing platform/runtime compatibility names such as
`workflow-contracts`, Workflow Run/Step, and `workflow_step_complete_v1`. Those names
describe current implementation seams and My-Chat runtime ownership; they MUST NOT be
used to broaden product Workflow scope. No new family-care action may be classified as
Workflow merely because it is asynchronous, cross-owner, retried, or delivered through
Handoff/Outbox. Existing family-care claimed-Step activation remains a compatibility gap
and MUST stay default-off until the owner contract is reconciled with the product semantics.

The C30-I1-D Base contract uses the neutral static drivers
`scenario_direct_empty_v1|workflow_claimed_step_v1`. Both server-only effect
identity input branches explicitly bind `scenario_key`; the direct branch binds
Workspace/scenario/action/submit context and the claimed branch binds
Workspace/scenario/action/original Step. I1-D defines standalone wire/codec/schema
conformance. Its historical standalone source is
`3580a9be74bd6ebe81d00c9fe99ccdf98d147664`, sealed by
metadata lock `1cb56910f32ab5e13f9d378af3b3043dfc94b180` at source hash
`5c5f2c5380773ccb651925199d403f267edb60bfbb0512bb0779218d074a99ef`.
Artifact 35 closes the artifact-34 findings by adding private resolved-submit,
stored rebind-seal and claimed-Step execution composition assertions plus closed
prepare branches and legitimate fail-closed outcomes. The public wires and neutral
driver names remain unchanged. I1-F now registers this exact static action contract
in the closed neutral Base manifest graph, but no My-Chat/Nurture consumer,
execution runtime or activation exists.

The C30-I1-E scope frozen in artifact 36 was implemented by artifacts 37-41 and
is currently accepted by successor artifact 43. The neutral split is one dedicated
`ScenarioProtectedPlainTextCarrierV1` plus body-free static, prepare,
prepared/committed and read/tombstone controls. Carrier bytes never enter I1-A
`operation.input`, I1-D `action_input`/result/Step, I1-C semantic output or a
durable Host DTO; a keyed request/response binding joins the separately transported
carrier to the body-free control. Submit and commit continue to use the accepted
I1-D direct/claimed path, and no generic commit/erase operation is introduced.
Foreground reads require exact current context and a no-store lease of at most 60
seconds; non-ready results are carrier-free. Historical Base source
`5433124506ca8d48a536a283796765209b93d808` is sealed by metadata-only lock
`3a08d1f117aad0ba8440df75f5e68dad392e8e45` at source hash
`7ba9458f0e1a91f6fda1a47e5682064020017c41731b1016f8bdad962664c126`.
Artifacts 42-43 close bounded no-copy, current-time and Schema/runtime parity
repairs at successor Base source `48fd3d65b34a1dd7a6b1e85713fca81f7c9da171`,
metadata-only lock `9abde2b994f6528fc5afb26125eb029ed6027237` and source
hash `be6fd80042a2998688dbeeaa6b4161ef80482d51eac413cfc0a53eaf2491fb7d`.
The cited artifact-41 source/lock is historical.
I1-F now registers the exact protected static contract and
`scenario_protected_interaction_source_v1` profile in the closed neutral Base
manifest graph. No My-Chat/Nurture consumer, protected route/store/KMS, capability
or activation exists.

Artifact 44 froze I1-F dependency/source convergence. Artifacts 45-48 implement
and accept one optional, closed Base `scenario_contracts`
area with the exact capabilities `trusted_scenario_invocation_v1`,
`scenario_subject_presentation_v1`, `scenario_domain_action_execution_v1` and
`scenario_protected_interaction_v1`, their exact dependency graph, and the exact
source identities `platform_child_family_identity_source_v1`,
`scenario_interface_source_v1`, `scenario_domain_action_source_v1` and
`scenario_protected_interaction_source_v1`. The freeze covers structural Schema/runtime
parity, contextual DAG/reference/Host checks, legacy/vNext no-alias rules, named
Base source profiles and ordered F1-F4 gates. Artifact 50 reaccepts exact
successor source `15ff031ed16897920c13fe24c9849531d98607ad`, sealed by
metadata-only lock `4350086993d837baa8030564f4e19593dedd96b0` at aggregate
source hash `d17f23585bb90ab607eb0fc80af629d8ab13ceb4508118de28162e4fd8846383`.
The earlier artifact-48 source/lock/hash remains historical.
The named identity/interface/action/protected profile hashes are respectively
`81d9fb9d…fed4`, `37f0cdae…eaf`, `b7c35259…e48d` and
`78eadaf4…efb`. This is `C30_I1_BASE_CONTRACTS_ACCEPTED`, not
My-Chat/Nurture adoption or a completed downstream source identity. Artifact 51
freezes My-Chat adoption as ordered I2-A..G units; artifact 52 accepts the
repaired default-off implementation at My-Chat runtime `658b897…`, replacement
lock `6725dc6…`, aggregate `8172e370…10a5ad` and archive `cd7bbc2…`.

The accepted C30-I2 Host boundary is exact Base adoption, interactive/durable human
principal translation, detached private signing and one-time nonce verification,
one atomic canonical Child/Family pair owner, semantic provider/presentation
registry, direct/claimed action orchestration, protected transient carrier/read
guards and cumulative default-off convergence. My-Chat used repository-local
T-035; its archived local `T-002 content-events` remains unrelated.

Artifact 53 freezes C30-I3 as ordered I3-A..G. Its production manifest exit is
the Base-permitted dependency-complete trusted+presentation prefix with an
action-free `NurtureChildCareProcess` baseline presentation. Generic action and
protected owner primitives are implemented only behind isolated conformance
fixtures during I3; the first real Guardian action/protected declaration remains
C31. I3 additionally owns detached request verification/response signing,
private nonce consumption, typed Participant and actor provenance, exact pair
anchors/local associations, one canonical runner and authoritative encrypted
protected-content/KMS/retention/crypto-erasure lifecycle. The old G1 pin remains
historical and separate from the new C30 downstream lock.

All four C30 capabilities remain absent/off at Host activation level. Nurture I3
implementation requires separate authorization; joint adoption remains I4;
product composition, Notification, invitation, admission, activation, T-008 and
Pilot remain later gates.

## Decision

The Nurture is a My-Chat scenario module. My-Chat owns the account identity and scenario shell; The Nurture owns the care ecology graph.

The Wave 4 P7 plus NestJS M3 owner path is pinned to My-Chat
`a0195662228a2fc6323b9ea0cd327d3608d8cc17` and My-Workflow-Base
`06303e9f404e4ccc0ba3054b763675efe81b5b15`. M4 governance, M5 handoff and G1
Joint Conformance are complete. T-005 G2 Exit binds that unchanged owner/source
population and shared core to exact `nurture.surface-contract@1.8.0` /
`sha256:4fe91e1314c89d09c4081001a61b93ff68392000f7725e8e21a8e7209341d47a`
through the formal service-authenticated NestJS ingress and disposable PostgreSQL.
T-006 G3-A through G3-D additively rotated the artifact to
`nurture.surface-contract@1.13.0` /
`sha256:1919a289cabdd9018db83100867dd1985caf6510a7a900e8a1fc654521e26aef`,
adding the board, capture-to-draft, manual media-attribution and
publish/release capabilities while leaving the shared core and every T-005
capability slice byte-identical, so the G2 Exit evidence still holds. No
biometric matcher capability exists, and no real policy-backed schedule or
release is claimed: the T-007 provider and G3-E joint qualification are open.
The Nurture provider is qualified but default-off. T-006/T-007 real-consumer
adoption, T-008 Candidate/native/device qualification, persistent migration apply,
secret configuration, deployment, activation and traffic remain separately required.

My-Chat users are the single login principals across scenarios. A My-Chat user can join many scenarios such as Nurture or Education. Inside Nurture, the same My-Chat user is mapped to Nurture-owned participants, roles, relationships, InstitutionWorkflows, and data.

The Nurture basic product unit is not family or classroom. The basic unit is a child's care process: parents join the child's care process, teachers incorporate the child's care process into their daily care work, and institution managers govern how these processes are organized and executed.

## Ownership

The Nurture owns:

- Scenario manifest, capabilities, handlers, actions, presenters, adapters, policies, repository ports.
- Scenario-local canonical care ecology objects: child care process, participant, role assignment, family, guardian, care institution, care group, enrollment, caregiver assignment, consent/grant, care communication, daily care, attention board, and media attribution facts.
- Pregnancy, care-plan, family-strategy, activity-comparison, execution-review, and health-safety artifacts.
- Institution ecology artifacts: family-care messages, family-care items, daily care logs, teacher attention summaries, caregiver observations, cohort plans, child media attribution summaries, and child album views.
- Scenario-specific web console and internal APIs.

My-Chat owns:

- Canonical account identity: user account, authentication, session, and global user id.
- Protected child/family identity: stable `my_chat.child` / `child_id` and
  `my_chat.family` / `family_id`, stewardship, creation authorization, and
  scenario-binding lifecycle.
- Scenario shell and host runtime: shared workflow runtime, routes, workers, outbox, ledgers, handoffs, and evidence.
- Mobile/web shell, notification, deep link, forum, knowledge base, dashboard, and admin consumers.
- User-facing entry and rendering surfaces that call back into Nurture-owned APIs for Nurture business facts.

Do not copy My-Workflow-Base host runtime into this repo. Integration should register `nurtureScenarioModule` with the My-Chat host and replace local compatibility types with host `workflow-contracts`.

Do not put My-Chat account auth, session, or global user semantics into Nurture. Do not put Nurture-specific family, child, institution, caregiver, enrollment, consent, or care communication semantics into My-Chat as canonical business facts.

## Runtime-declared Scenario Entrypoints (legacy workflow API)

Historical P0 runtime entrypoint groups:

- `pregnancy_stage_management`
- `family_strategy`
- `care_plan`
- `activity_comparison`
- `execution_review`

N1 institution owner-read capability groups:

- `class_family_inbox` / `open_class_family_inbox` / `capture_family_input`
- `teacher_attention_board` / `open_today_attention_board`

The current N1 institution owner-read capabilities resolve the current Nurture
participant, role, and care-group scope on every read. Their direct surface
handlers return display-safe items and opaque refs only. Existing legacy runtime
handlers remain explicit-empty. T-007 D-04 plans a separate protected
Institution Admin business-communication projection; the projection is not declared by the
current manifest/module/source and remains default-off until its new interface,
carrier, owner-read policy and qualification are pinned. The activation-only
`capture_family_input` Step is an existing compatibility seam, not a product
Workflow. The compatibility seam may emit one refs-only `user_attention` draft only when the host
loads the vNext manifest with `workflow_handoff_materialization_v1` enabled, and
the compatibility seam remains default-off pending semantic/owner-contract reconciliation.

## Object And Profile Rules

Host-owned canonical refs required at the integration boundary. My-Chat resolves
these refs; the raw Child/Family values do not become Nurture payload or
persistence fields:

- `my_chat.user`
- `my_chat.child` (`child_id`) when a Nurture child is globally bound
- `my_chat.family` (`family_id`) when a Nurture family is globally bound
- `my_chat.workspace` or shell entry ref when needed for routing
- `my_chat.thread_surface` or equivalent render/deep-link ref when a Nurture-owned thread is shown inside My-Chat mobile/web
- `my_chat.notification_target` when Nurture needs host notification/deep-link delivery

Scenario-local canonical refs owned by Nurture:

- `nurture.participant`
- `nurture.child`
- `nurture.child_care_process`
- `nurture.family`
- `nurture.guardian_role`
- `nurture.care_institution`
- `nurture.care_group`
- `nurture.caregiver_role`
- `nurture.institution_admin_role`
- `nurture.enrollment`
- `nurture.child_link_grant`
- `nurture.family_care_thread`
- `nurture.family_care_message`
- `nurture.family_care_item`
- `nurture.nurture_profile`
- `nurture.activity_option`
- `nurture.health_state_summary`

Nurture scenario participants that correspond to login users MUST reference `my_chat.user`. Nurture role and relationship semantics MUST be resolved from Nurture data, not inferred from My-Chat account state.

Nurture children are not My-Chat users. A child care process is Nurture-owned and may have multiple guardian participants, caregiver participants, and institution-manager participants attached through Nurture role assignments.

## My-Chat Child/Family Identity And Nurture Binding Contract

### Meaning and representation

`my_chat.child` / `child_id` and `my_chat.family` / `family_id` are protected,
opaque platform identities. They are not login principals, PII match keys,
Nurture profiles, legal-household assertions, or authorization grants.

Nurture keeps platform identity, scenario binding, and local care facts
separate:

- `NurtureChild.id` identifies one workspace-local care profile.
- `NurtureChildCareProcess.id` is the workspace-local Nurture subject used by
  presenters, policies, and commands.
- `NurtureFamily.id` identifies one child-scoped, workspace-local care unit; one
  platform Family may therefore map to different local Family rows for
  different children.
- `NurtureChildBindingAnchor` and `NurtureFamilyBindingAnchor` are typed,
  scenario-global, body-free binding endpoints. My-Chat scenario-binding
  `ownerRef` values point to these anchors, never directly to a workspace-local
  Child, ChildCareProcess, or Family.
- Workspace-local association rows connect an exact Child anchor to one local
  Child and connect an exact `(Family anchor, Child anchor)` pair to one local
  child-scoped Family/ChildCareProcess.

This two-owner chain is the one normative opaque binding required by the
repository boundary:

```text
My-Chat child_id/family_id
  -> My-Chat scenario binding with typed ownerRef
  -> Nurture typed anchor
  -> Nurture workspace-local association
  -> Nurture local Child/ChildCareProcess/child-scoped Family
```

Nurture therefore consumes `my_chat.child` and `my_chat.family` through pinned
My-Chat owner contracts and signed current-owner evidence without copying their
raw ids. The chain is routing and policy input only. Neither a platform id, a
scenario binding, an anchor, nor a local association grants Nurture authority.

Anchors use random opaque identifiers. They contain no display name, birth
fact, contact, dossier, workspace, role, grant, consent, lifecycle decision, or
query authority. An anchor may appear only as a My-Chat scenario-binding
`ownerRef`, in Nurture anchor/association persistence, in the short-lived
private signed owner evidence defined below, or inside the separately
authenticated reconciliation boundary. Anchors are never exposed to clients or
included in UI, Chat, Notification, Handoff, Outbox/provider payloads, logs,
traces, metrics, analytics, search, vectors, or shared/business caches. Product
resolution first verifies the exact Workspace and current Host owner evidence,
then performs one exact compound workspace/anchor association lookup and
immediately reads the local Nurture relationship graph before returning any
result. Repositories do not provide ordinary cross-workspace anchor list,
count, or existence APIs. The reconciliation port may return only body-free,
audited outcomes and cannot render or mutate business facts.

The existing `NurtureChildCareProcess.childId` continues to point to
`NurtureChild.id`. A local Nurture model MUST NOT store a raw `child_id` or
`family_id` property or reinterpret either local id as a platform id.

### My-Chat owner API minimum contract

The separately pinned `platform_child_family_identity_source_v1` MUST contain
one completed, versioned My-Chat owner API family with all of these closed
responsibilities:

1. Resolve or create a parent/steward-authorized platform Child/Family pair and
   reread the exact `FamilyChildMembership` plus both scenario-binding heads.
2. Commit or exact-replay every missing Child/Family scenario binding in one
   My-Chat transaction against expected heads and typed Nurture owner refs.
3. Issue short-lived, signed, audience-bound current binding evidence to the
   Nurture private boundary. The transport is the accepted I1-A
   `ScenarioPrivateInvocationV1`; its operation input is the I1-B
   `ScenarioCurrentOwnerBindingPairEvidenceV1`. The composed body contains only
   the trusted principal/Workspace/scenario/operation/purpose context, typed
   Child/Family anchor refs and non-reversible current-owner/pair hashes. Key
   metadata and signature remain detached transport metadata. Neither layer
   contains a raw platform id, binding id/head, membership id, PII, role, Grant,
   policy decision or dossier field.
4. Recheck the current Child binding, Family binding, exact pair membership,
   and required adult Family membership before every Host route, delivery,
   retry, and open. Cached evidence never fills an owner outage or extends
   authorization.
5. Return only closed `current|unavailable` routing outcomes to ordinary
   callers. Wrong kind/head/pair, revoke, archive/delete, merge ambiguity,
   signature/key failure, expiry, or owner outage is unavailable and MUST NOT
   trigger an alternate-id, PII-match, or legacy fallback.

The exact reusable Base wire names, exposure classes, fields and structural
rules are frozen in
`dev-docs/active/nurture-institution-mode/artifacts/16-c30-i1-b-scope-freeze.md`.
Concrete My-Chat HTTP/port, registry and runtime semantics remain C30-I2
implementation deliverables. C-3 cannot freeze or qualify a candidate until the
Base contracts, My-Chat runtime/APIs, Nurture anchor/association adapters, and
joint conformance are implemented, immutable, and pinned under
`platform_child_family_identity_source_v1`.

### Parent-owned creation and recoverable binding

Parent-first platform identity and institution-invited Nurture onboarding use
the same idempotent, non-Workflow identity operation. Pilot first-local-
relationship establishment starts only after exact Host invitation acceptance;
an invitation-free Nurture entry requires a separate future product decision.

1. My-Chat authenticates the adult and resolves the current Actor, Workspace
   membership, stewardship, and represented organization where applicable.
2. The adult explicitly creates or selects one current platform Child and
   Family under My-Chat policy; the exact `FamilyChildMembership` must be
   current.
3. The coordinator rereads both scenario-binding heads. Nurture reuses every
   correctly typed existing anchor and idempotently reserves an empty typed
   anchor only for a missing binding under current My-Chat bind authorization.
4. One My-Chat transaction rereads the platform pair, existing binding heads,
   and reserved-anchor versions and creates or exact-replays every missing
   binding in the selected Child+Family combination.
5. One Nurture transaction rereads signed current binding-pair and workspace
   evidence, then creates or resolves the Participant, local Child,
   ChildCareProcess, child-scoped Family, first Guardian RoleAssignment, and
   both workspace association rows. It creates no Enrollment, Grant, Thread, or
   protected work.
6. Enrollment confirmation and Grant confirmation remain later, separate owner
   transactions. No protected surface or cross-role delivery is available until
   the exact binding pair, workspace associations, and all relevant Nurture
   predicates are current.

Binding resolution is exhaustive: both current bindings may be reused; a
current Family binding may be reused while a new Child binding is added; a
current Child binding may be reused while a new Family binding is added; or
both bindings may be created. A pre-existing binding with a wrong kind,
conflicting `ownerRef`, ambiguous head, or mismatched selected
`FamilyChildMembership` is not a reusable one-sided state and is quarantined.
The My-Chat transaction must either commit the complete set of bindings missing
for that operation or none of them.

The Host keeps one deterministic, body-free identity-operation record bound to
actor, Workspace, scenario, platform Child+Family pair, invitation/entry intent,
expected binding heads, anchor refs, and canonical input hash. Its business
state is `prepared|bindings_committed|local_committed|closed_no_effect`; a
separate `quarantineState=clear|outcome_unknown` prevents ambiguity from being
misreported as failure. Exact retry uses the same operation. Binding success
followed by local response loss calls a narrowly authenticated Nurture status
lookup that shares the local writer fence and returns
`committed|confirmed_no_effect|unknown`; `unknown` blocks a replacement
operation, Enrollment, Grant, delivery, and cleanup until resolved.

The status wire is the I1-B
`ScenarioIdentityOperationStatusLookupRequestV1` /
`ScenarioIdentityOperationStatusLookupResultV1` pair. The request is the
registered `operation.input` of an I1-A `ScenarioPrivateInvocationV1`; I1-A is
the sole source of caller, issuer, audience, Workspace/scenario route,
operation, issued/expiry time and nonce. Credential, key and signature metadata
remain detached and MUST NOT be repeated inside the I1-B body.

Immediately before issuing the I1-A invocation, My-Chat validates the raw
platform Child/Family pair, `FamilyChildMembership` and both binding heads
internally. None of those raw ids, binding refs/heads, membership refs or
protected identity fields crosses the private boundary. The private request
carries only the exact typed owner-ref pair, association expectation,
operation/command identities and non-reversible principal/Host/deadline/attempt
evidence hashes frozen by the I1-B contract.

After transport and frozen-field validation, the strict result body returns
only the matching operation/command identities, canonical check time,
originating request nonce hash and one closed status variant:

- `committed`: typed Scenario execution ref plus commit evidence hash;
- `confirmed_no_effect`: writer-fence evidence hash;
- `unknown`: `lock_timeout|possible_inflight|owner_unavailable|compatible_evidence_ambiguous`.

Each variant forbids fields owned by another variant and every business or
protected body. Response authentication/signing uses the isolated I2/I3
response transport and detached signature metadata. Authentication, codec,
nonce, signature or frozen-binding failure returns one generic transport
denial/unavailable response outside the result union and before the writer
fence or status resolver. `confirmed_no_effect` additionally requires every
issued attempt terminal, deadline plus skew elapsed, the exact writer fence,
and absence of the `CommandExecution` plus both associations under that fence.
Lock timeout, possible inflight work, owner/store outage or compatible ambiguity
remains `unknown`. The endpoint performs no business command, Participant/policy
read, presenter, protected read, binding mutation, association cleanup or new
operation creation.

A binding whose anchor has no workspace association is an invisible
`bound_empty` endpoint, not a second identity. Later authorized operations must
reuse it; uniqueness plus per-actor/workspace unresolved-operation quota and
rate limits prevent repeated reservation. After the deadline and fenced
`confirmed_no_effect`, the operation may become `closed_no_effect`: an unbound
reservation with no association or live operation may be retired, while a
bound-empty anchor remains the reusable canonical endpoint. Unbinding or
superseding a bound-empty endpoint requires a separate audited owner action that
rereads the exact unchanged binding version and proves zero associations; it is
never automatic compensation. Changed payload, duplicate local mapping,
multiple candidate, stale stewardship/membership/binding, wrong workspace, or
owner/verifier outage fails closed. There is no cross-database transaction, ORM
import, direct database join, or compensating deletion.

### Institution intake and authorization

In the Pilot profile, an Institution, teacher, or caregiver may create only the
Nurture `RosterEntry` and Enrollment Invitation intent/shell. It cannot reserve
anchors, create or select platform Child/Family identities, create a local
Nurture Child/Process/Family, or promote roster prefill into any profile.
Roster/intent rows contain no platform id, anchor, stewardship, membership, or
scenario-binding candidate. Any future parent-authorized institutional
`ChildCreationAuthorization` path is a separately versioned, non-Pilot feature.
Its current T-028 contract is create-only: My-Chat may create one platform Child
inside an existing parent-owned Family after an opaque request and exact
parent/steward authorization, but the institution receives no Family
membership, stewardship, scenario binding, Nurture anchor/association, local
Child/Profile, Enrollment, Role, or Grant. Nurture adopts no positive runtime
path until that owner source is independently implemented and qualified.

Platform stewardship, Family membership, Child/Family binding, and anchor
association are necessary routing facts but never sufficient Nurture authority.
Every protected render, command, delivery, and notification/deep-link open must
independently owner-read:

- the current My-Chat Child binding, Family binding, exact
  `FamilyChildMembership`, and required adult Family membership; and
- the exact workspace association plus current Nurture Participant,
  RoleAssignment, ChildCareProcess, child-scoped Family, Enrollment, Grant,
  purpose, policy/consent, source lifecycle, and destination lifecycle required
  by that operation.

For every anchor reservation or association write, the exact Nurture authority
reader receives the same database transaction used by the binding owner
repository. That transaction locks or database-CAS-validates the current
authority source after the exact anchor row is locked and before the
authorization receipt and association result are committed. The authority
read, anchor lifecycle transition, authorization receipt insert or exact
replay, and association mutation therefore share one atomic owner transaction.
Default wiring denies when no production reader is provided. An exact command
replay must reread and validate the current authority in a fresh transaction;
an earlier receipt or result cannot mask revoke, expiry, scope drift, owner
outage, or another current denial.

A co-Guardian invitation is one versioned two-owner saga. The inviting adult
must be both a current Nurture Guardian and a current My-Chat Family member with
Host permission to invite that exact recipient. My-Chat acceptance first
creates or exact-replays the recipient's Workspace and Family memberships; only
then may Nurture reread the current membership evidence and atomically consume
its intent/create the Guardian RoleAssignment. Each owner commit has its own
stable operation identity and recovery. If the Host membership commits but the
Nurture role does not, membership alone grants no Nurture access and the same
Nurture operation may resume; if the Nurture response is lost, exact replay
returns the same role. Cancellation before Host acceptance terminalizes both
pending shells where possible. Cancellation, expiry, role self-exit, or later
membership/role revoke never compensates or rewrites an already committed fact
owned by the other side. Either fact alone grants nothing; the Pilot read
predicate requires both current.

### Lifecycle, reconciliation, and portability

My-Chat binding revoke/supersession, Child/Family archive or deletion, Child
merge/redirect, membership drift, anchor-version drift, ambiguity, or Host
resolver outage fences Host routing, aggregation, cache/deep-link open, and new
Nurture action/delivery fail-closed. It does not rewrite or delete Nurture local
ids, roles, grants, content, or audit. Closing one workspace association or
Enrollment affects only that workspace and never mutates the global binding.
Merge/split never automatically rewrites anchors or local ids; a target already
bound to a different anchor is quarantined for separately authorized owner
reconciliation. Technical operators may stop routing and request that owner
action, but cannot edit either identity or dossier.

Revocation scope is exact. A Child binding fence affects only that Child's
scenario routes; a Family binding fence affects that Family across its children;
loss of one `FamilyChildMembership` affects only that Child+Family pair; and one
adult's Family-membership loss affects only that adult. Each path still rereads
the exact workspace associations and Nurture authority, so none of these Host
facts rewrites local business history or grants sibling-child access.

The same platform Child/Family identity may be reused in multiple scenarios and
may later map to separately authorized workspace-local Nurture dossiers. This
permits exact routing, not cross-workspace authorization or dossier portability.
Nurture role, Enrollment, Grant, content, history, display profile, and policy
do not carry over. Cross-workspace scenario-data transfer remains outside the
Pilot and requires a future explicit consented protocol; PII, roster, name,
birth fact, contact, or media matching is never a substitute for a current
binding.

The same `child_id` may route separately to Nurture and Education. Each scenario
must owner-read its own exact binding, local relationship, and permission facts;
neither scenario imports the other's ORM or infers authorization from the
shared key.

### Verification checklist

- Parent-first, existing-local, and product-new paths recover one exact platform
  pair, anchor pair, and workspace-local aggregate across retry and response
  loss.
- Institution intake without a participating parent creates only Roster/intent
  facts and cannot make an active or bound Nurture child.
- Anchor-only, Child-binding-only, Family-binding-only, stewardship-only,
  membership-only, `child_id`-only, and `family_id`-only reads are denied.
- Missing, wrong, stale, revoked, superseded, ambiguous, or duplicate binding or
  workspace mapping fails closed without an existence/count side channel.
- One Family with multiple children cannot use family membership or a Family
  anchor to cross child scope; each child needs its own current local role,
  mapping, Enrollment, Grant, and purpose predicates.
- Global binding revoke and local workspace exit have independent effects and
  never perform an implicit cross-owner mutation.
- Merge conflicts quarantine rather than auto-following or merging dossiers.
- Leakage scans prove stable platform ids and anchors absent from client,
  delivery, provider, telemetry, analytics, search, and qualification or
  operational evidence bodies. The private signed current-owner envelope is
  the sole evidence exception and carries only the allowlisted typed anchor
  refs described above.
- One `child_id` can route separately to Nurture and Education without a
  cross-database join, dossier transfer, or cross-scenario permission leak.

Nurture family-care communication is a Nurture-owned `CareInteraction` when an authorized `ActionExecution` creates its business facts. My-Chat MAY render role-safe projections, deliver notifications, and hold display-safe shell references, but the message body, care item extraction, status, acknowledgment, reply, and continuation facts remain Nurture canonical.

The current family-care business subject is the exact original
`Enrollment + CareGroup`, not an individual Caregiver claimant. Acknowledge
records CareGroup receipt plus individual executor audit. Reply is a
CareGroup-owned append collection: any currently eligible Caregiver in that
exact CareGroup MAY append an independently idempotent reply, and another
valid reply is not a concurrency conflict. The first reply changes response
to `responded` and resolves waiting-for-reply attention; later replies do not
close the Item or resolve attention again. Individual Participant and
RoleAssignment remain internal audit and optional secondary attribution.

## Provider-qualified Institution Business Communication Read (T-005 G2-B / T-007 D-04)

`InstitutionBusinessCommunicationProjectionV1` is a protected, noncanonical,
request-composed owner-read projection for a current `institution_admin`. It is
not a Message copy, room, thread, transcript, or My-Chat-owned business fact.

Each request must reread the exact Institution, Enrollment, CareGroup, original
Grant, data class, direction, purpose, pre-send Admin-supervision disclosure,
and current source Message/CareItem/correction/withdrawal/redaction lifecycle.
An opaque ref, Institution membership, Admin label, `child_id`, `family_id`, or
scenario binding is never sufficient authority. Within that exact scope the
projection may return the current business-message body, attachments,
author/direction and change state.

Guardian private AI, unsent composers, My-Chat private chats, and another
Institution Enrollment are excluded. Protected content must not be copied into
a My-Chat transcript, notification, aggregate cache, or second Nurture
canonical fact.

This read is separate from action authority. Admin-only actors cannot
acknowledge, reply, correct, withdraw, or redact. A multi-role user must switch
to the relevant caregiver/author role and pass the original exact action
policy. A later `InstitutionAttentionCandidate` may only cite sources within
the same authorized projection and may not auto-act, diagnose, assign blame, or
score a child, teacher, class, or Institution.

The Nurture provider now exposes the default-off protected interface
`nurture.institution-business-communication-owner-read@1.0.0` with exact digest
`sha256:dd1b63fe6c7975bafb4170aff3dccc92463dfaf3e5ea7e5bd3c80f1298d6c921`.
Its private service-authenticated no-store carrier and request-time owner policy
are provider-qualified against correction, withdrawal, redaction, role loss,
Grant loss, disclosure loss and scope drift. It is not part of the shared
surface registry and grants no actions. T-007 still owns consumer composition
and adoption; the environment gate remains `false`, so this provider result is
not activation or traffic evidence.

## Planned Enrollment Journey Workflow (T-007 D-07)

`EnrollmentJourneyWorkflowV1` is the only product `InstitutionWorkflow` planned
for the first T-007 implementation increment. It covers minimum-data inquiry,
intent conversation, optional visit, optional full-class capacity waitlist,
trial preparation/start, ordinary trial care/review, formalization, and
completion. Grant changes, attendance closeout, knowledge editing, support
signals, `CareInteraction`, `PublishProcess`, and ordinary Enrollment
offboarding are not additional Workflows.

Business stage and waiting state are orthogonal. `capacity_waitlist` means only
that the exact target class currently has no capacity. Waiting on a Guardian,
Caregiver, owner system, agreed future date, or resolvable blocker does not
enter or reorder the waitlist. A support signal may create an explicit
WorkItem, but it cannot start `EnrollmentJourneyWorkflowV1` unless a separately
authorized enrollment command satisfies that Workflow's own eligibility.

The planned Enrollment mapping reuses the existing `NurtureEnrollmentStatus`
instead of adding a `trial` status:

- trial preparation may hold `status=pending` and cannot produce real care;
- trial start atomically establishes
  `status=active, participationPhase=trial` with current reservation, Grant,
  and exact CareGroup assignment;
- formalization keeps `status=active` and changes only
  `participationPhase: trial -> formal`;
- trial exit changes `status: active -> ended` while retaining historical
  phase/provenance.

`participationPhase` is a canonical discriminator for statistics and
transitions, but it grants no authority. Every protected trial or formal read,
command, publication, and delivery still rereads current owner binding,
workspace association, Participant/role, Enrollment status, Grant, exact
CareGroup, purpose, and source lifecycle. Formal Enrollment totals require
`status=active && participationPhase=formal`; trial attendance still contributes
to real daily care and safety headcount.

An accepted trial offer closes its waitlist entry and reserves one exact class
capacity unit. If the Guardian withdraws before trial-start commit,
`cancel_trial_preparation` closes the accepted-offer/preparation shell and
releases that reservation in one idempotent Nurture transaction; it does not
require Enrollment/Grant/CareGroup to exist and does not create, revoke, or
delete My-Chat Child/Family/bindings. After trial-start commit, the downscope
path is `end trial`. Neither path restores the previous waitlist rank.

Formalization is a two-owner sequence, not a distributed transaction. After
the Guardian accepts the current formal proposal, My-Chat rereads current
Child/Family membership and both scenario-binding heads and issues short-lived,
purpose-bound evidence. Nurture then validates current expected versions and
atomically changes participation phase, retains the active occupancy already
created by trial start, updates the existing Grant, and records idempotency/audit evidence.
Owner outage, binding drift, evidence expiry, version conflict, or local
failure leaves the canonical relationship
`status=active, participationPhase=trial` with the same occupied seat and may expose only a
technical `waiting_on_system` state.

V1 stores exactly one immutable formal proposal per workflow and keeps
`proposalHead=1` only as an optimistic-concurrency field. Guardian acceptance
must occur no earlier than proposal issue and before proposal expiry. The local
commit must occur at or after the proposed formal start, but a timely accepted
proposal remains eligible after its acceptance window closes when fresh current-
owner evidence and every local expected head still pass. There is no proposal
revision command, greatest-revision query, or parallel mutable proposal state.

Trial is the adaptation period. If more observation is needed, Admin extends
trial before formalization. A confirmed Nurture formalization commit is the
last business milestone and idempotently completes the Workflow; no
post-formalization settling stage, feedback form, timer, or extra human
completion gate exists. Later formal offboarding is ordinary Enrollment/Grant/
CareGroup lifecycle maintenance and does not reopen this Workflow or create a
second Workflow by default.

The Nurture surface-contract source publishes the I2-A public wire boundary for
this Workflow as three queries and 21 independently described commands at
`nurture.surface-contract@1.19.0` / `sha256:6f67d49ca303ad627b6644857a16dde7626cc944bf8c065f09629039025f738e`.
Public inputs contain business decisions and owner-issued option refs only;
Workspace/role assignments, private Workflow refs, owner snapshots/evidence,
expected heads and derived lifecycle state remain private prepared bindings.
Guardian output keeps waitlist rank, category and local entry identity absent;
Institution mobile remains action-free.

I2-B binds those DTOs to the existing private I1 query/command ports through a
server-only prepared-binding interface. Validation happens before binding
resolution; exact Workspace/active role, private refs, owner snapshots and
evidence, protected carriers and expected heads never come from public input.
Actions require and queries prohibit the opaque confirmation ref. The action
adapter forwards it to the command executor; a real I3 executor must verify and
consume the exact input/target/head binding inside the business transaction.
Institution/Guardian role and surface matrices are enforced before execution,
query/command lanes are separate, and presenters omit private Nurture refs,
reseal Admin targets and retain the family no-rank/no-category boundary. Exact
canonical Workflow Run or local scope drift fails unavailable.

Trusted Workspace/actor/request identity is validated before binding
resolution. Canonical unavailable dependencies and their nested ports are
immutable. An Admin waitlist journey option seals the private Workflow target
plus exact waitlist-entry ref/head; those private fields never enter the public
result.

The scenario module declares only fail-closed internal query/command adapter
keys and the manifest marks their chat/mobile/Web composition disabled. Every
descriptor still depends on the unqualified
`t007_enrollment_journey_runtime` owner-integration gate. I2-B supplies no
scenario-service formal ingress, real owner adapter, database operation,
activation or traffic. Authenticated My-Chat prospective-contact/native-source/
current-owner integration and joint positive/negative qualification remain
I3/I4 work; I3 remains blocked by the unresolved G-09 external pin adoption.

## Handoffs

Handoff payloads are refs-only.

The canonical vNext manifest currently declares `capture_family_input` and one `user_attention` handoff with legacy `workflow_step_complete_v1` materialization. Its source contract is exactly one `family_care_message`, `child_link_receipt`, and `family_care_item`, with no artifact refs. This declaration documents the current compatibility implementation; it does not classify family communication as product Workflow and is not a global enablement. `nurtureScenarioModule` and `createNurtureScenarioModule` use the derived pre-activation manifest. `createNurtureActivationScenarioModule` remains default-off and MUST NOT activate until the claimed-Step seam is replaced or explicitly reconciled with the `ActionExecution`/`ActionDelivery` contract.

The transient driver is validated before command identity lookup or mutation. Nurture persists only the shared canonical ref `{ schema_version: 1, namespace: "my_chat", object_type: "workflow_step", object_id }`; claim token and Step version are neither hashed nor stored. Same-Step reclaim may rotate that evidence, but another Step cannot replay the seed. Snapshot contents are bounded refs-only values over the Nurture-owned message, receipt, and item; downstream content still requires current owner reread.

The live handler receives two explicit ports. A host-injected bridge derives `ScenarioCommandDriverContext` from the already claimed Step and maps returned immutable snapshots to host drafts. A scenario-owned command-source adapter parses one opaque persisted Run requirement and resolves stable invocation, command, and handoff request IDs. Before participant lookup, the host must map the Run's canonical Actor to an active My-Chat user through current workspace membership; the queue cannot supply this identity. The IDs do not come from claim/version evidence: same-Step reclaim reuses the Execution, while another Step presenting the same command ID is rejected by persisted original-Step provenance before a second business effect. The handler emits no host-standard event and exposes only an opaque Nurture CommandExecution ref as Step output; message, receipt, and item remain owner-readable context refs inside the handoff draft.

The `user_attention` owner endpoint is service-authenticated and returns only current My-Chat recipient IDs plus fixed generic display text. Before send and again on open, My-Chat rereads the current Child binding, Family binding, exact `FamilyChildMembership`, and exact adult Family membership; Nurture resolves both current workspace associations and rereads message, receipt, item, Grant, Enrollment, thread membership, CareGroup, Institution, Participant, and exact recipient RoleAssignment. My-Chat owns the Handoff Ledger, notification idempotency, Outbox, and deep-link shell. Opening a deep link first authenticates the exact recipient/workspace/Notification and eligible Ledger row, then repeats both owner reads; stale notification content is never treated as authorization. Child-binding, Family-binding, pair-membership, adult-membership, or association loss follows the exact revocation scope above and returns generic unavailable without cross-child existence leakage.

The `scenario_binding_write` owner endpoint (`POST /internal/nurture/scenario-binding/authorize`) is service-authenticated with the same bearer token and issues the private binding-owner receipt to the Host resolver. Deterministic anchor reservation, active Participant/Guardian row locks, current authority validation, receipt insert or exact replay, and commit share one Nurture owner transaction; denial rolls back a newly attempted reservation, and concurrent suspension or revocation cannot overtake issuance. The role id and aggregate version become authorization-source evidence with a five-minute expiry. Reservation is deterministic per exact platform subject (workspace, subject type, subject id), the reservation key and all request identities are persisted only as HMAC evidence hashes, exact replay returns the identical receipt, and the anchor value never leaves the private server-to-server carrier. `NURTURE_BINDING_EVIDENCE_KEY` (at least 32 characters) enables the endpoint; absence keeps it disabled with `binding_owner_disabled` and never degrades to an unauthenticated or unhashed path.

The Q4 `nurture.teacher-release-owner@3.0.0` private interface composes the
teacher publish queue, fixed-process target review and release prepare/confirm
operations behind four service-authenticated `POST` routes under
`/internal/nurture/teacher-release-owner/v3/`. Its canonical descriptor and
closed wire schema are pinned by digest
`sha256:b17970ed6ad8b1db36737348c54c14cae00a02bf4074b902fcc9c5d81cf5ae73`.
Every operation starts only from current My-Chat user + Workspace identity and
reruns the Nurture resolver; no caller-supplied Participant, role assignment,
role, Institution, CareGroup, Enrollment, Grant, Child, Family or policy claim
is accepted. Only a current `caregiver|lead_caregiver` exact CareGroup scope is
composed into `query_teacher_publish_queue@1.0.0` and
`release_publish_process@1.0.0`. Responses are no-store, strictly projected,
and omit raw owner identifiers, generic execution refs and owner policy reason
codes. Target review is a human-readable rendering of the complete target set
already stored on the process, not a subset selector. It issues a five-minute,
actor-bound snapshot that `prepare` must present and `confirm` revalidates
before any target effect. `NURTURE_TEACHER_RELEASE_OWNER_ENABLED` remains false by default;
publication and joint qualification do not authorize deployment activation or
traffic.

- `public_draft` -> `my_chat.forum`
- `knowledge_candidate` -> `my_chat.knowledge_base`
- `notification` -> `my_chat.notification`
- `family_care_item` -> `my_chat.notification` for teacher/guardian delivery surfaces only; Nurture remains canonical for the care item.
- `family_care_reply` -> `my_chat.notification` for delivery receipt only; Nurture remains canonical for the message and thread.

Downstream services reread Nurture-owned artifacts through Nurture APIs exposed via the My-Chat scenario shell, then apply their own delivery/display policies.

Cross-surface delivery does not transfer ownership. A My-Chat deep link points back to a Nurture-owned business object.

## Health Boundary

Health-state support is limited to basic, non-diagnostic, non-prescriptive guidance.

Escalate or block requests for emergency triage, diagnosis, medication decisions, treatment decisions, or replacement of qualified medical care.

## Database Strategy

`prisma/schema.prisma` is the Nurture schema SSOT.

Nurture MAY use an independent database or a dedicated `nurture_*` schema/table group behind the My-Chat scenario shell. Nurture-owned care ecology facts are canonical in the Nurture persistence boundary. My-Chat stores its canonical account, protected platform Child/Family identity, stewardship/membership, scenario-binding, shell/runtime, and delivery facts plus only display-safe shared-surface projections; it does not store or reinterpret Nurture roles, Enrollment, Grant, care content, or policy results.

## Integration Gates

- A separately normalized `platform_child_family_identity_source_v1` pins the completed My-Chat Child/Family owner contract, schema/migrations, runtime/APIs, binding lifecycle, Nurture typed anchors/workspace associations, and joint pair/revoke/merge/recovery/privacy conformance. A schema-only target or changed live checkout revision is not adoption evidence.
- Institution Pilot intake creates only RosterEntry and invitation intent/shell. Parent-owned Child+Family identity, typed-anchor/binding resolution, local associations, Enrollment, and Grant must close in the documented order before protected work.
- Host `workflow-contracts` replaces local compatibility types.
- Host module validator accepts `packages/nurture-scenario/scenario.manifest.yaml`.
- My-Chat canonical account/user resolver keys exist.
- Nurture resolver keys exist for child care process, participant, family, institution, care group, enrollment, child link grant, family-care thread, message, and item.
- Shared surfaces consume only standard workflow refs and safe artifact previews.
- Current N1 institution inbox/attention surfaces call Nurture owner-read
  handlers and receive only safe labels, generic badges, aggregate versions,
  and opaque item refs; My-Chat must not branch on Nurture business lifecycle
  values.
- The T-007 D-04 protected Admin business-communication provider interface is
  qualified at exact version/digest but remains disabled until T-007 consumer
  composition adopts that pin and joint tests confirm private carrier,
  lifecycle invalidation, no-copy controls and action-authority separation.
- The T-007 D-07 `EnrollmentJourneyWorkflowV1` remains absent/default-off until
  the existing Enrollment status plus `participationPhase` mapping,
  trial-start/preparation-cancel/formalization/exit transactions, waitlist and
  reservation contracts, My-Chat current-owner evidence, projection/event/
  replay schemas, fixtures, and cross-owner conformance are adopted. No caller
  may infer or assemble this Workflow from the planned stage labels.
- Institution owner reads re-resolve current participant/role/care-group scope and recheck enrollment, thread membership, the item-linked grant, source lifecycle, and redaction before every display.
- The default/dev scenario module remains pre-activation. The canonical vNext manifest may be loaded only through `createNurtureActivationScenarioModule` and only when the My-Chat development composition advertises `workflow_handoff_materialization_v1` and provides the claimed requirement, Actor-to-user, bridge, and materializing runtime ports.
- `NURTURE_INTERNAL_SERVICE_TOKEN` is configured on both sides of the owner-read boundary; absence disables activation owner reads and never falls back to an unauthenticated route.
- My-Chat adopts the exact Q6 teacher-release-owner interface pin through its
  strict server adapter. Joint qualification covers the real resolver,
  repository, queue, prepare/confirm, replay, ambiguity, cursor drift, stale
  confirmation, authority loss between operations, default-off behavior,
  service auth and transport failure. Dashboard API/Mobile activation remains
  a separate My-Chat implementation and release decision.
- Shared mobile/chat/dashboard surfaces do not become the canonical source for Nurture family-care messages or care items.
- Health safety policies are tested before pregnancy or care-plan workflows are enabled.
- DB namespace, migrations, indexes, rollback/export, and seed-data boundaries are reviewed before cloud apply.
