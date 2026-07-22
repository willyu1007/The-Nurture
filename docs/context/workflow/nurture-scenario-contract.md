# Nurture Scenario Contract

## Decision

The Nurture is a My-Chat scenario module. My-Chat owns the account identity and scenario shell; The Nurture owns the care ecology graph.

My-Chat users are the single login principals across scenarios. A My-Chat user can join many scenarios such as Nurture or Education. Inside Nurture, the same My-Chat user is mapped to Nurture-owned participants, roles, relationships, workflows, and data.

The Nurture basic product unit is not family or classroom. The basic unit is a child's care process: parents join the child's care process, teachers incorporate the child's care process into their daily care workflow, and institution managers govern how these processes are organized and executed.

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

## Declared Workflows

P0 workflows:

- `pregnancy_stage_management`
- `family_strategy`
- `care_plan`
- `activity_comparison`
- `execution_review`

N1 institution owner-read workflows:

- `class_family_inbox` / `open_class_family_inbox` / `capture_family_input`
- `teacher_attention_board` / `open_today_attention_board`

The N1 institution workflows resolve the current Nurture participant, role, and care-group scope on every read. Their direct surface handlers return display-safe items and opaque refs only. Existing owner-read workflow handlers remain explicit-empty. The activation-only `capture_family_input` Step may emit one refs-only `user_attention` draft only when the host loads the vNext manifest with `workflow_handoff_materialization_v1` enabled.

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
   Nurture private boundary. The evidence contains only schema/version,
   Workspace/scenario, operation/purpose, typed Child/Family anchor refs, one
   non-reversible current-owner evidence hash, issue/expiry time, key id, and
   signature. It contains no raw platform id, binding id, membership id, PII,
   role, Grant, or dossier field.
4. Recheck the current Child binding, Family binding, exact pair membership,
   and required adult Family membership before every Host route, delivery,
   retry, and open. Cached evidence never fills an owner outage or extends
   authorization.
5. Return only closed `current|unavailable` routing outcomes to ordinary
   callers. Wrong kind/head/pair, revoke, archive/delete, merge ambiguity,
   signature/key failure, expiry, or owner outage is unavailable and MUST NOT
   trigger an alternate-id, PII-match, or legacy fallback.

The exact reusable Base envelope/type names and concrete My-Chat HTTP or port
shape are C30-I1/I2 implementation deliverables. They are not left to a later
product decision: C-3 cannot freeze or qualify a candidate until the owner
contracts, My-Chat runtime/APIs, Nurture anchor/association adapters, and joint
conformance are implemented, immutable, and pinned under
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

The lookup wire contract is versioned `ScenarioIdentityOperationStatusLookupV1`.
Its closed transport identity is caller `my-chat-identity-recovery`, issuer
`my-chat.identity-recovery`, audience `nurture.identity-recovery.v1`, operation
`scenario_identity_operation_status_lookup_v1`, and endpoint
`POST /private/v1/identity-operations/status:lookup`. It uses an isolated
credential/signing-key/verifier/revocation domain and a fresh single-use nonce.
The request is strict canonical JSON with exactly these fields and no unknown,
duplicate, missing, or null-substituted member:

```text
schema = "scenario_identity_operation_status_lookup_request_v1"
caller, issuer, audience, operation
hostIdentityOperationId, workspaceId, scenarioKey = "nurture"
childAnchorRef = { kind: "nurture_child_binding_anchor_v1", anchorId }
familyAnchorRef = { kind: "nurture_family_binding_anchor_v1", anchorId }
associationExpectationHash, localCommandId, localCommandHash
principalProvenanceHash, hostIdentityEvidenceHash
deadlineEvidenceHash, attemptLedgerHash
issuedAt, expiresAt, nonce, keyId, signature
```

The signature covers the canonical request excluding `signature`, including
the exact HTTP method and path. My-Chat validates the raw platform Child/Family
pair, `FamilyChildMembership`, and both binding heads internally immediately
before signing. None of those raw ids, binding ids, head values, membership
refs, or protected identity fields crosses this endpoint. Their exact frozen
tuple contributes only to the non-reversible keyed canonical
`hostIdentityEvidenceHash`; Nurture treats that digest as opaque evidence and
resolves status only from the Nurture-owned typed anchor refs, association
expectation hash, local command identity, locally recorded attempt/deadline
evidence, and the shared writer fence.

Only after transport and frozen-field validation may the endpoint return strict
canonical JSON with common fields
`schema="scenario_identity_operation_status_lookup_result_v1"`,
`hostIdentityOperationId`, `workspaceId`, `localCommandId`, `status`, and
`checkedAt`, `requestNonceHash`, `keyId`, and `signature`, plus exactly one
status-specific shape:

- `committed`: `commandExecutionRef` and `localCommitEvidenceHash`;
- `confirmed_no_effect`: `noEffectFenceEvidenceHash`;
- `unknown`: `reasonCode`, allowlisted to
  `lock_timeout|possible_inflight|owner_unavailable|compatible_evidence_ambiguous`.

Each result variant forbids the other variants' fields, all unknown fields, and
all business/protected bodies. The Nurture recovery-service signature covers
the canonical result excluding `signature`, the exact method/path, and the
originating request nonce hash; My-Chat verifies it through the isolated
response-verifier/revocation set. Authentication, codec, nonce, signature, or
frozen-binding failure returns one generic transport denial/unavailable
response outside this result union and before the writer fence or status
resolver. `confirmed_no_effect` additionally requires every issued attempt
terminal, deadline plus skew elapsed, the exact writer fence, and absence of the
CommandExecution plus both associations under that fence. Lock timeout,
possible in-flight work, owner/store outage, or compatible ambiguity remains
`unknown`. The endpoint performs no business command, Participant/policy read,
presenter, protected read, binding mutation, association cleanup, or new
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

Nurture family-care communication is Nurture-owned when the conversation is created through a Nurture care workflow. My-Chat MAY render the thread, deliver notifications, and hold display-safe shell references, but the message body, care item extraction, status, acknowledgment, reply, and follow-up facts remain Nurture canonical.

## Handoffs

Handoff payloads are refs-only.

The canonical vNext manifest declares `capture_family_input` and one `user_attention` handoff with `workflow_step_complete_v1` materialization. Its source contract is exactly one `family_care_message`, `child_link_receipt`, and `family_care_item`, with no artifact refs. This declaration is not a global enablement: `nurtureScenarioModule`, `createNurtureScenarioModule`, and the local dev host use the derived pre-activation manifest. Only `createNurtureActivationScenarioModule` exposes vNext and its constructor requires a materializing host runtime, the claimed-Step bridge, and the production family-input source port.

The transient driver is validated before command identity lookup or mutation. Nurture persists only a canonical `host.workflow/workflow_step` ref bound to the `nurture` consumer; claim token and Step version are neither hashed nor stored. Same-Step reclaim may rotate that evidence, but another Step cannot replay the seed. Snapshot contents are bounded refs-only values over the Nurture-owned message, receipt, and item; downstream content still requires current owner reread.

The live handler receives two explicit ports. A host-injected bridge derives `ScenarioCommandDriverContext` from the already claimed Step and maps returned immutable snapshots to host drafts. A scenario-owned command-source adapter parses one opaque persisted Run requirement and resolves stable invocation, command, and handoff request IDs. Before participant lookup, the host must map the Run's canonical Actor to an active My-Chat user through current workspace membership; the queue cannot supply this identity. The IDs do not come from claim/version evidence: same-Step reclaim reuses the Execution, while another Step presenting the same command ID is rejected by persisted original-Step provenance before a second business effect. The handler emits no host-standard event and exposes only an opaque Nurture CommandExecution ref as Step output; message, receipt, and item remain owner-readable context refs inside the handoff draft.

The `user_attention` owner endpoint is service-authenticated and returns only current My-Chat recipient IDs plus fixed generic display text. Before send and again on open, My-Chat rereads the current Child binding, Family binding, exact `FamilyChildMembership`, and exact adult Family membership; Nurture resolves both current workspace associations and rereads message, receipt, item, Grant, Enrollment, thread membership, CareGroup, Institution, Participant, and exact recipient RoleAssignment. My-Chat owns the Handoff Ledger, notification idempotency, Outbox, and deep-link shell. Opening a deep link first authenticates the exact recipient/workspace/Notification and eligible Ledger row, then repeats both owner reads; stale notification content is never treated as authorization. Child-binding, Family-binding, pair-membership, adult-membership, or association loss follows the exact revocation scope above and returns generic unavailable without cross-child existence leakage.

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
- Institution inbox/attention surfaces call Nurture owner-read handlers and receive only safe labels, generic badges, aggregate versions, and opaque item refs; My-Chat must not branch on Nurture business lifecycle values.
- Institution owner reads re-resolve current participant/role/care-group scope and recheck enrollment, thread membership, the item-linked grant, source lifecycle, and redaction before every display.
- The default/dev scenario module remains pre-activation. The canonical vNext manifest may be loaded only through `createNurtureActivationScenarioModule` and only when the My-Chat development composition advertises `workflow_handoff_materialization_v1` and provides the claimed requirement, Actor-to-user, bridge, and materializing runtime ports.
- `NURTURE_INTERNAL_SERVICE_TOKEN` is configured on both sides of the owner-read boundary; absence disables activation owner reads and never falls back to an unauthenticated route.
- Shared mobile/chat/dashboard surfaces do not become the canonical source for Nurture family-care messages or care items.
- Health safety policies are tested before pregnancy or care-plan workflows are enabled.
- DB namespace, migrations, indexes, rollback/export, and seed-data boundaries are reviewed before cloud apply.
