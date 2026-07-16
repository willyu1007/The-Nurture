# IB Decision Convergence — Nurture Schema SPEC

## Status

- **Phase:** IB decision convergence
- **Updated:** 2026-07-16
- **Scope:** schema/defaults plus Pilot-0 surface-entitlement refinement; no Prisma migration, live manifest, or runtime code change
- **Input:** child-scope alignment plus `06-ib-nurture-schema-spec.md` section 11 open decisions

This document records the child-scope baseline and converts the seven IB schema open decisions into implementation defaults. These defaults are strong enough for IIA schema/policy design, while keeping production rollout gates explicit where legal/security input is still required.

## Decision Summary

| ID | Topic | IB default | Still gated before production |
| --- | --- | --- | --- |
| IB-D0 | Child care process scope | **LOCKED:** `NurtureChildCareProcess.id` is the independent child scope; parent/teacher views reorganize one or more child scopes. | Keep organization-level config distinct from child-specific care facts. |
| IB-D1 | Participant identity and surface role resolution | **LOCKED, REFINED BY PILOT-0-B3-0/B3-1a/B3-1b:** One `NurtureParticipant` per `(workspaceId, myChatUserId)` remains canonical. Guardian and Caregiver use generic AI Chat plus their accepted board/workbench action surfaces; institution admin uses institution board/workbench and not Nurture Chat; technical operator stays outside Nurture business surfaces. Nurture resolves role/scope/target/business direction/output on every surface. | Institution/operator action matrices and exact manifest/adapter identifiers remain open. |
| IB-D2 | Family cardinality | **LOCKED:** One active `NurtureFamily` per `NurtureChildCareProcess` for MVP; multiple parents use guardian role assignments. | Separate-family privacy model for complex custody/blended-family cases. |
| IB-D3 | Teacher attention board | **LOCKED:** Materialize `NurtureTeacherAttentionItem` as a rebuildable child-scoped projection for teacher mobile UX. | Keep group-level operational notices in a separate future object. |
| IB-D4 | Grant revoke retention/runtime | **LOCKED:** Revoke is a runtime fence: stop future delivery immediately, exit active work surfaces/context, and keep historical records limited/auditable. | Numeric retention windows, deletion jobs, and legal copy. |
| IB-D5 | Classification vocabulary | **LOCKED:** `dataClass` is the system grant/policy contract; `category` is workflow/display taxonomy; institution vocabulary is a mapping layer. | Configurable local labels/templates/routing after MVP. |
| IB-D6 | Message protection | **LOCKED:** Message canonical status is `sent` / `redacted` / `failed`; no message-level `hidden` or `deleted`; My-Chat receives safe projections only. | Production encryption/KMS, attachment security, and physical retention implementation. |
| IB-D7 | My-Chat shell metadata | **LOCKED:** Main-chat scenario response and explicit Nurture dashboard use realtime generic render paths; My-Chat persists only minimal opaque bookkeeping for optional host activation such as notification/unread/deep link. | Exact host activation schema once My-Chat contract is reviewed. |

## IB-D0 — `NurtureChildCareProcess` as the Child Scope

**Convergence status:** LOCKED on 2026-07-06.

**Default:** `NurtureChildCareProcess.id` is the independent child scope for care facts.

Rules:

- Any child-specific action, query, write, event, message, item, log, grant, receipt, or media attribution must resolve to one `NurtureChildCareProcess`.
- Parent views are reorganizations over child care process scopes the parent can access through guardian role assignments.
- Teacher views are reorganizations over child care process scopes the teacher can access through care group or enrollment assignments.
- Care group and institution views are aggregation surfaces. They do not own child-specific care facts outside `childCareProcessId`.
- Organization-level configuration can exist without `childCareProcessId`: institution profile, care group rhythm, teacher role assignments, class-level policy templates, and general activity plans.
- Once organization-level configuration is applied to, recorded for, delivered to, or exposed about a specific child, the resulting record must include `childCareProcessId`.

Rationale:

- This preserves the product grammar: Nurture is child-centered, while families and institutions are different ways to participate in and reorganize child care process data.
- It prevents teacher/class workflows from becoming a second data ownership model. A class inbox is a grouped view over many child scopes, not a class-owned replacement for those child scopes.

Implementation implication:

- Schema review should reject child-specific care facts that only have `careGroupId`, `familyId`, `participantId`, or `parentId` without `childCareProcessId`.

## IB-D1 — `NurtureParticipant` Identity and Surface Role Resolution

**Convergence status:** LOCKED on 2026-07-08; B3-1 surface/action/key/operator/reason/adoption refinements complete on 2026-07-16.

**Default:** `NurtureParticipant` is unique per `(workspaceId, myChatUserId)`. Guardian Nurture work may use Chat, family board, and family domain web workbench. Caregiver Nurture work may use Chat and teacher board. Institution-admin Nurture work may use institution board and institution domain web workbench, not Chat. Technical operations use the host technical Admin surface. My-Chat never chooses a trusted Nurture role; Nurture resolves the participant's eligible role, scope, target, policy, and output.

Rules:

- A My-Chat user has one Nurture participant identity inside a workspace.
- The same participant may hold multiple `NurtureCareRoleAssignment` rows, such as `guardian` for one child and `caregiver` for a care group.
- Role-specific labels, staff titles, classroom display names, and family-facing labels belong on `NurtureCareRoleAssignment`, not on separate participant identities.
- For Chat-entitled guardian/caregiver roles, My-Chat Chat ingress may use an explicit scenario entry, an existing conversation-to-scenario binding, a returned Nurture `scenarioToken`, or generic host routing to decide whether to invoke Nurture. A bound Nurture conversation does not require a new scenario-routing decision on every turn.
- An institution administrator may use general My-Chat Chat, but Nurture institution-management capability is unavailable there and must enter through the institution board or institution domain web workbench.
- After selecting Nurture, My-Chat passes authenticated user identity, surface, conversation/message refs, current payload, generic display state, and any Nurture-issued opaque token. It does not pass trusted role, work scope, child target, grant, or Nurture business intent.
- Nurture chat handling resolves the active participant, candidate role assignments, target child/thread/item/group, grant/runtime fence, and policy before returning a response or creating any business object.
- A pure mobile chat clarification turn may be handled with participant-level context only. Any persisted child-specific action, message, item, log, receipt, or workflow event must resolve to a concrete `roleAssignmentId` and `childCareProcessId` before write.
- Family, teacher, and institution boards are explicit role work surfaces and may expose only validated Nurture role/scope selections compatible with that surface. A switch does not create a second participant identity or broaden authorization.
- The family domain web workbench is guardian-entitled; the institution domain web workbench is institution-admin-entitled. The first internal experiment has no caregiver domain web workbench fallback.
- The institution board is read-only for safe aggregates and navigation in the first internal experiment. Institution-owned topology/configuration writes occur only in the institution domain web workbench through the Nurture `CommandExecution` kernel.
- Institution administrators may initiate adult invitations and enrollment setup but cannot bind raw My-Chat user ids, accept an invitation for another user, establish/revoke Guardian relationships, or create/replace/revoke family grants. My-Chat owns account acceptance; family authority owns Guardian/grant confirmation.
- Institution administrators have no ambient access to family question/reply bodies or child-specific care facts and cannot perform caregiver actions, technical-runtime recovery, hard deletion, or ranking/scoring actions.
- A Nurture product action is identified by `(scenario_key, action_key)` across entitled surfaces, while `command_key`, Workflow `entrypoint_key`, implementation `handler_key`, and Host Admin recovery remain separate identities. None of these caller-facing values replaces current role/scope/policy resolution.
- Existing family-care `command_key` values remain immutable for replay. The current Run/Step-shaped manifest `scenario_actions` registry cannot be repurposed for Nurture entity actions; an additive domain-action contract is required before surface implementation.
- The technical operator is a distinct internal My-Chat platform-operations account scoped to the exact Pilot workspace, not a Nurture participant. Generic workspace admin and Nurture institution-admin status do not imply the entitlement.
- Technical Admin may expose safe evidence, exact original-Step reconciliation, eligible Handoff replay/stop, owner-reevaluation request, and disable-only emergency operations. It cannot expose Nurture bodies, execute Nurture business-role actions, edit canonical state, or re-enable/expand the Pilot.
- Guardian enrollment confirmation, initial grant confirmation, grant replacement, and revoke remain separate actions/commands. Institution initiation alone never binds a family or creates consent; grant replacement creates new identity and never revives a revoked grant.
- Institution topology uses explicit create/update/suspend/resume/close actions rather than generic upsert/change-state. Adult invitation remains My-Chat identity-owned until accepted, after which an owner callback binds the canonical user into Nurture before separate role assignment.
- Pilot business disable/recovery reuses care-group suspend/resume and does not create a second Nurture enablement aggregate; My-Chat capability/workspace allowlist remain separate technical gates.
- Domain-action availability exposes only the locked safe reason vocabulary plus scenario-owned `safe_label`/`safe_help`; internal command/database/provider errors are not client reason codes. Confirmation is a separate `explicit` or `strong_authorization` class and never cached authorization.
- Cross-surface entity actions require optional additive Base `domain_action_contracts` and a separate handler registry. Missing handlers or invalid target/surface/confirmation declarations are fatal; current Run-level `scenario_actions` and legacy manifests retain their existing semantics.
- Contract adoption remains Base -> My-Chat -> Nurture with capability disabled. Nurture advertises an action only after authenticated handler, current owner presenter, command path, and negative tests exist.
- `web_domain_workbench` is a Nurture business surface and must not be conflated with the host `web_run_workbench` or technical Admin surface.
- Notification and deep link are transitions into an entitled surface, not independent role surfaces or authorization sources.
- If multiple roles/scopes are possible and the target does not disambiguate them, Nurture should ask for clarification or return safe scenario-level output rather than defaulting to the broadest role.
- Audit trails should reference both `participantId` and `roleAssignmentId` when the actor's role matters.

Rationale:

- My-Chat already owns account identity. Duplicating participant identities would make auth resolution, audit, and revocation harder.
- A single participant with multiple roles cleanly handles the case where one adult participates in more than one Nurture relationship.
- Keeping Chat role-agnostic among Chat-entitled roles preserves My-Chat's scenario shell boundary. Nurture owns entitlement and role semantics and decides output through its resolver.
- Role boards and domain workbenches serve different work shapes without creating parallel business lifecycles: family views are child/family scoped, teacher views aggregate care-group work, and institution views govern topology/policy without ambient family-content access.
- Excluding institution Nurture actions from Chat and caregiver actions from a domain web workbench keeps the first internal experiment aligned with the intended product modules instead of treating every host surface as universally available.

Escalation path:

- If a future legal/privacy requirement demands separate visible personas, introduce a persona/profile layer under role assignment. Do not fork login identity.

## IB-D2 — `NurtureFamily` Cardinality

**Convergence status:** LOCKED on 2026-07-08.

**Default:** MVP enforces one active `NurtureFamily` per `NurtureChildCareProcess`.

Rules:

- Multiple parents/guardians are represented as multiple `NurtureCareRoleAssignment(role=guardian)` rows scoped to the child care process or family.
- The family-private thread uses that active family as its family-side scope.
- `NurtureFamily` is a child-scoped family-side care unit, not a global household account and not a My-Chat group.
- Siblings may each have their own child care process and active family unit in MVP; the same guardians can be assigned to multiple child care processes.
- Additional family units are deferred until the product explicitly supports separate guardian privacy boundaries.

Rationale:

- The current product problem is not custody segmentation; it is connecting parents, teachers, and institution managers around a child care process.
- One active family keeps the MVP schema and policy tests tractable while still supporting multiple parents.
- This keeps family-side communication aligned with the independent child scope: each child-private thread belongs to one child care process and one active family-side care unit.

Escalation path:

- If two guardian groups must not see each other's messages, allow multiple active `NurtureFamily` rows per child care process and create family-specific threads/grants. This is a future privacy feature, not an IB default.

## IB-D3 — `NurtureTeacherAttentionItem` Materialization

**Convergence status:** LOCKED on 2026-07-06.

**Default:** Materialize `NurtureTeacherAttentionItem` as a rebuildable child-scoped projection.

Rules:

- `NurtureTeacherAttentionItem` is not the source of truth for family messages, care constraints, daily logs, or institution policy.
- Every `NurtureTeacherAttentionItem` must include `childCareProcessId`; `careGroupId` is a teacher grouping/query dimension, not the owner scope.
- Every attention item must carry `sourceType` and `sourceId` when derived from another canonical object.
- The projection may store ordering, priority, snooze/resolution state, effective date, expiry, and mobile display summary.
- If the projection becomes inconsistent, it should be rebuildable from source objects plus item events.
- Group-level operational notices, such as whole-class activity reminders, do not belong in `NurtureTeacherAttentionItem`; model them separately later as `CareGroupOperationItem` / `CareGroupNotice` or equivalent.

Rationale:

- Teacher mobile UX needs stable ordering, daily grouping, and fast class-level reads.
- A fully derived board would force every mobile open to recompute across messages, constraints, daily logs, and policy.
- IB-D0 requires child-specific care facts to resolve to `childCareProcessId`. Teacher board rows are class-view projections over child scopes, not class-owned facts.

Implementation implication:

- Add reconciliation tests: source item update should refresh/suppress the attention projection without changing the source object.
- Schema review should reject `NurtureTeacherAttentionItem` rows without `childCareProcessId`.

## IB-D4 — `NurtureChildLinkGrant` Revoke and Retention

**Convergence status:** LOCKED on 2026-07-06.

**Default:** Revoke is a runtime fence, not a historical eraser.

Rules:

### 1. Future delivery gate

- New `family_to_org` and `org_to_family` deliveries fail closed as soon as grant status becomes `revoked`, `expired`, or `replaced`.
- Retry/replay must re-check the current grant state. A workflow cannot rely only on the grant state captured when the run was created.
- Any send/share/notify/deep-link delivery step must check `grantId` plus the current grant version/status at execution time.

### 2. Runtime supervision fence

- Grant revoke emits a Nurture domain event, for example `NurtureChildLinkGrantRevoked`, carrying `grantId`, `childCareProcessId`, `enrollmentId`, `revokedAt`, and the current grant aggregate version.
- Workflow runtime consumers must treat that event as a fence for in-flight runs, pending outbox events, scheduled retries, and cached context packs that depend on the grant.
- Pending cross-role deliveries become `blocked` with reason `grant_revoked`.
- Running steps that are internal institution care records may continue only if they no longer require cross-role delivery or revoked family context. Running steps that deliver, summarize, or reuse revoked-grant context must stop or be re-planned without that context.
- Opened-but-not-submitted UI actions must re-resolve the grant at submit time. Draft replies, shares, and AI summaries created before revoke cannot be sent after revoke unless another active grant permits it.

### 3. Active surface and context exit

- Active projections created from revoked grants are suppressed from teacher inbox/attention board unless another active grant or explicit institution-owned operational basis exists.
- Revoked-grant records are excluded from future AI context packs, new summaries, recommendations, and model runtime hints by default.
- Cached context packs that include revoked-grant context must be marked stale/invalid and rebuilt before further use.
- Family-visible future media views are withdrawn unless another active grant or exposure policy permits them.

### 4. Historical audit

- Existing messages, items, logs, media attributions, workflow runs, and receipts are not physically deleted by grant revoke alone.
- Previously delivered records remain auditable with grant status visible in metadata.
- Already shared `org_to_family` daily care records remain in the family's historical view unless product/legal policy requires redaction.
- Media attribution remains internally auditable, even when family-visible exposure is withdrawn.
- Receipts remain retained as audit objects with `revoked_after_delivery`, `blocked`, or equivalent status/reason.

Rationale:

- Revoke should stop future data flow and runtime reuse, not rewrite history in a way that breaks care auditability.
- Teachers and families need traceability for what was already delivered and acted on.
- Future workflows are runtime-supervised, so revoke must be enforced at workflow claim, retry, delivery, outbox, context-pack, and UI-submit boundaries.

Production gate:

- Numeric retention windows, deletion jobs, and legal copy remain rollout gates.
- The schema must store `retentionPolicyPayload` and enough timestamps/statuses to apply those rules later.
- IIA implementation must add tests for in-flight workflow cancellation/suppression, pending outbox blocking, context-pack invalidation, and retry/replay grant re-checks.

## IB-D5 — Data Class and Category Vocabulary

**Convergence status:** LOCKED on 2026-07-07.

**Default:** `dataClass` is the system grant/policy contract, `category` is workflow/display taxonomy, and institution vocabulary is a mapping layer.

Rules:

- MVP grant/policy checks must use stable system `dataClass` keys:
  - `daily_care_log`
  - `care_day_note`
  - `care_constraint_update`
  - `family_care_question`
  - `family_follow_up_request`
- `category` is a workflow/display taxonomy used by inbox, attention board, routing, sorting, templates, and teacher UX.
- Institution-specific labels, templates, and routing rules may map to system `dataClass` and `category`; they do not create new cross-role data classes in MVP.
- `pickup_or_schedule` and `other` may exist as workflow categories, but they must not become grant-controlled data classes without explicit policy review.
- Grants, receipts, runtime policy checks, revoke fences, AI context filters, and delivery decisions must use `dataClass`, not institution-local labels.
- Institution vocabulary may change how an item is named, displayed, templated, or routed; it must not silently expand what crosses the family/institution boundary.

Rationale:

- Consent and policy need stable keys. Local institution vocabulary is useful, but it should not silently expand what crosses the family/institution boundary.
- This keeps institution adoption flexible without letting local naming mutate authorization semantics.

Implementation implication:

- Use system `dataClass` keys for policy tests. If Prisma enums are too rigid for later vocabulary evolution, use strings plus domain validation while keeping the system key registry explicit.
- Add mapping tests: institution local label/template/routing key -> system `dataClass` + workflow `category`.
- Reject grants, receipts, and runtime decisions that reference institution-local vocabulary as if it were a system `dataClass`.
- Keep a single registry/validator for system data classes so AI extraction, manual forms, and workflow actions classify to the same keys.

## IB-D6 — Message Encryption, Redaction, and Attachment Handling

**Convergence status:** LOCKED on 2026-07-07.

**Default:** Nurture owns canonical message body; message lifecycle is `sent` / `redacted` / `failed`; My-Chat only receives safe projections.

Rules:

- `NurtureFamilyCareMessage.body` is canonical inside Nurture for care communication.
- Cross-role communication is workflow-mediated: family input enters a Nurture workflow; caregiver/institution/system output is distributed from an allowed item event, care fact, or confirmed action rather than a direct chat send.
- A named caregiver attribution requires a caregiver-confirmed action. System/institution-generated copy must remain explicitly attributed and cannot impersonate a caregiver.
- Family-facing messages should retain source item/event/log refs so the communication timeline remains auditable without becoming the workflow-state source of truth.
- My-Chat notification/render payloads must not store raw body, attachment URLs, care constraints, or item workflow state.
- Attachments are stored as `attachmentsPayload` refs; raw binary storage is outside these tables and must enforce access control.
- Message-level `hidden` is not allowed. Surface suppression belongs to `NurtureFamilyCareItem`, `NurtureTeacherAttentionItem`, notification policy, presenter filters, or other projections.
- Message-level `deleted` is not allowed. User delete, policy delete, retention action, safety removal, and admin action become `redacted` with explicit reason and audit metadata. Physical deletion is a retention/legal job, not the business status.
- Redaction is not summarization. Classification, `safeSummary`, and `NurtureFamilyCareItem.summary` are derived projections from a message; they do not change the message status.
- Redaction must be represented from day one: message status can become `redacted`, and redaction metadata should identify when/why/by whom at audit level.
- Production must provide encryption at rest for the database and protected attachment storage. Application-level field encryption can be introduced when key management is ready, but production rollout should not proceed without a documented security posture.

Rationale:

- The family-care thread is sensitive. Keeping raw content out of My-Chat preserves scenario ownership and narrows exposure.
- Redaction must not erase audit trails needed to understand care workflow history.
- Keeping canonical status to `sent` / `redacted` / `failed` avoids ambiguous "hidden" semantics and keeps display policy out of the message fact.

Implementation implication:

- Schema implementation should add redaction fields such as `redactedAt`, `redactedByParticipantId`, `redactionReason`, and `redactionPayload`.
- Schema implementation should include body protection metadata such as `bodyStorageMode` and `bodyProtectionPayload`, while keeping secrets outside the table.
- Schema implementation should include explicit authorship kind and optional source item/event/log refs so a caregiver-confirmed or system-generated family message is attributable and traceable.
- Projection tests must verify that suppressed/closed/expired items do not mutate message status.
- Redaction tests must verify that raw body and direct attachment access are unavailable while audit shell and derived safe summaries remain governed by policy.

## IB-D7 — My-Chat Shell Metadata Envelope

**Convergence status:** LOCKED on 2026-07-07.

**Default:** My-Chat handles Nurture rendering in realtime and does not persist Nurture render envelopes. When host delivery requires persistence, My-Chat may store only minimal opaque delivery bookkeeping.

Rules:

- Default render path is realtime:
  - My-Chat shell receives a request or opens a surface.
  - My-Chat calls Nurture render/action APIs.
  - Nurture resolves participant, role assignment, child scope, grant/runtime fence, message lifecycle, and current object state.
  - My-Chat renders the returned display payload without making it canonical host state.
- Main-chat feedback is returned as a structured Nurture scenario response. A scenario-specific dashboard/board reads Nurture presenter output through the generic My-Chat scenario surface; neither path requires a handoff merely to display committed Nurture content.
- My-Chat handoff/delivery persistence is reserved for host-owned activation capabilities such as notification, push, unread/badge, notification center, or deep link. Activation failure must not change whether committed Nurture content is visible or delivered in the Nurture business sense.
- My-Chat must not persist Nurture render envelopes such as `safeTitle`, `safeSummary`, `urgency`, `requiresAction`, or `visibilityHint` as queryable state.
- If notification, push, retry, badge, or notification-center delivery requires persistence, My-Chat may store a minimal opaque delivery record.
- Persisted host delivery bookkeeping may include only routing/dedupe/status/expiry fields:
  - `deliveryId`
  - `targetMyChatUserId`
  - `scenarioKey`
  - `scenarioObjectType`
  - `scenarioObjectId`
  - `deepLinkTarget`
  - `dedupeKey`
  - `deliveryStatus`
  - `generatedAt`
  - `expiresAt`
  - `notificationPolicyKey`
  - `deliveryChannel`
  - `attemptCount`
  - `lastAttemptAt`
- `scenarioObjectType` / `scenarioObjectId` are opaque references. My-Chat must not interpret them as Nurture business facts or query dimensions.
- Visible copy such as `safeTitle` / `safeBody` may exist only as ephemeral delivery payload, provider payload, or TTL-bound notification copy. It is non-authoritative and not reusable as Nurture state.
- Every deep-link open or action submit must re-resolve against Nurture.

Forbidden persisted host fields:

- Raw family-care message body.
- Long-lived `safeSummary` / `safeBody` as Nurture truth.
- Attachment direct URLs or storage credentials.
- `childCareProcessId` as a My-Chat queryable business scope.
- `dataClass` / `category` as host policy facts.
- Grant policy internals.
- Family-care item workflow status.
- Message redaction internals.
- Child care constraints or care profile facts.
- Child care constraints as reusable account facts.
- Caregiver scope derivation.
- Media attribution truth/exposure decisions.

Rationale:

- My-Chat should route, render, deliver, and retry; Nurture should remain the source for role checks, business state, sensitive facts, authorization, and current status.
- Persisting render envelopes would slowly turn My-Chat into a second Nurture projection store. Minimal opaque delivery bookkeeping keeps host operations reliable without copying Nurture semantics.

Implementation implication:

- Treat host delivery records as non-authoritative. Every deep-link open must re-resolve current state from Nurture.
- Add tests that old notifications fail closed or show unavailable after grant revoke, message redaction, role revocation, or item closure.
- Exact persisted field names are deferred to My-Chat host notification/delivery contract review, but the allowed field family is locked to opaque routing/dedupe/status/expiry.

## Implementation Readiness

These seven decisions close the schema-level blockers for IIA design. Before production rollout, two areas still require explicit signoff:

1. `IB-D4`: numeric retention windows, deletion jobs, and legal copy.
2. `IB-D6`: production encryption/KMS/attachment security posture.

IIA schema/policy tests should cover:

- Every child-specific care fact requiring `childCareProcessId`, even when queried through parent or teacher views.
- One My-Chat user with multiple Nurture roles.
- Two parents on one active family.
- Teacher attention projection rebuild/suppression with required `childCareProcessId`.
- Grant revoke blocking new delivery and suppressing active projections.
- Institution-local labels mapping to stable system data classes.
- Redaction preserving audit while removing raw display content.
- My-Chat notification/deep-link envelope containing only display-safe fields.
