# IB Schema SPEC — Nurture Care Ecology Canonical

## Status

- **Phase:** IB schema SPEC draft
- **Updated:** 2026-07-16
- **Scope:** design-only; no Prisma migration or live manifest change in this phase
- **Owner boundary:** My-Chat owns account identity and scenario shell; Nurture owns the care ecology graph and care facts

This SPEC defines the Nurture-owned canonical schema needed before institution ecology can be wired into live capabilities. It is intentionally written at domain/schema-contract level. When this moves into persisted implementation, update `prisma/schema.prisma` through the repo DB SSOT workflow and refresh `docs/context/db/schema.json`.

## 1. Non-negotiable Invariants

1. **Child scope first:** `NurtureChildCareProcess.id` is the independent child scope for care facts. Any child-specific action, query, write, event, message, item, log, grant, or media attribution must resolve to one child care process.
2. **Views are reorganizations:** teacher, parent, institution, and care group surfaces are reorganizations over one or more child care process scopes. `careGroupId`, `familyId`, `participantId`, and parent/teacher filters are query and workflow dimensions, not replacement data scopes for care facts.
3. **Child-centered:** `NurtureChildCareProcess` is the center. Families join it; teachers include one or more such scopes in class workflows; institution managers govern how these scopes are organized.
4. **User boundary:** parents, teachers, and institution managers are My-Chat users; children are not My-Chat users.
5. **Participant mapping:** Nurture references My-Chat users through `myChatUserId`, but Nurture role, scope, and relationship semantics come from Nurture tables.
6. **Surface role boundary:** Guardian Nurture work is entitled to Chat, the family board, and the family domain web workbench; caregiver Nurture work is entitled to Chat and the teacher board; institution-admin Nurture work is entitled to the institution board and institution domain web workbench, not Chat; technical operations remain in host Admin. My-Chat never selects a trusted Nurture role. Nurture resolves participant, surface entitlement, role, scope, target, business direction, and output. Surface changes do not create another participant identity or authorization source.
7. **No ambient cross-family read:** caregivers can only access a child care process through active role assignment, enrollment, grant, and policy.
8. **Nurture-owned communication facts:** family-care message body, classification, item status, acknowledgments, replies, follow-ups, and receipts are canonical in Nurture when created through Nurture care communication.
9. **Grant-gated cross-role flow:** `family_to_org` and `org_to_family` require an active Nurture-owned `NurtureChildLinkGrant` with matching direction and data class.
10. **Fail closed:** missing role, missing enrollment, expired/revoked grant, data class mismatch, or group-scope mismatch blocks delivery and writes an audit/receipt failure where applicable.
11. **Health safety:** health-related fields are operational observations only. They must not represent diagnosis, prescription, emergency triage, medication dosage advice, or replacement for offline care protocols.

## 2. Naming and Persistence Conventions

- Prisma model names should stay PascalCase; domain fields should stay camelCase; DB table/column mapping should stay snake_case via `@@map`/`@map`.
- All persistent models should include `id`, `workspaceId`, `status` where meaningful, `aggregateVersion`, `createdAt`, `updatedAt`, and `deletedAt` for soft-deleteable objects.
- `workspaceId` is a scenario shell/runtime partition reference supplied by My-Chat. It does not make My-Chat the owner of Nurture role or care facts.
- My-Chat IDs are external references, not cross-database ownership. Prefer `myChatUserId` and display-safe `myChatUserRefPayload` when a surface needs denormalized metadata.
- Child/family/institution objects may carry display-safe profile payloads, but authorization must be resolved from role assignments, enrollments, grants, and policies, not from cached payloads.
- Organization-level configuration, such as institution profile, care group rhythm, and teacher assignment, may exist without `childCareProcessId`. Once a record describes an individual child's care, communication, observation, media exposure, or delivery state, it must include `childCareProcessId`.

## 3. Core Ecology Objects

### 3.1 `NurtureParticipant`

Represents a My-Chat user after entering the Nurture scenario.

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | string | yes | Nurture participant id. |
| `workspaceId` | string | yes | My-Chat scenario/workspace partition. |
| `myChatUserId` | string | yes | External account identity reference. |
| `displayName` | string | no | Display-safe snapshot; source remains My-Chat/user profile surface. |
| `avatarRefPayload` | json | no | Display-safe avatar ref, if needed by Nurture surfaces. |
| `status` | enum | yes | `active`, `inactive`, `suspended`, `merged`, `deleted`. |
| `profilePayload` | json | no | Scenario-local preferences only, not global account identity. |

Key constraints:

- Unique active mapping: `(workspaceId, myChatUserId)`.
- Index for auth resolution: `(workspaceId, myChatUserId, status)`.

Locked constraint:

- Use one active `NurtureParticipant` per My-Chat user per workspace. Role-specific personas, labels, staff titles, classroom names, family-facing names, and selected work scopes belong on `NurtureCareRoleAssignment`, not separate participant identities.
- My-Chat mobile chat ingress must not create or select role-specific participants. It selects the scenario and passes the generic Surface Contract envelope; Nurture resolves role/scope/target/business direction/output.

### 3.2 `NurtureChild`

Represents the child as a Nurture business subject, not a My-Chat user.

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | string | yes | Child id. |
| `workspaceId` | string | yes | Scenario partition. |
| `displayName` | string | yes | Display name for authorized care participants. |
| `birthDate` | date | no | Optional; only if product needs age-band/rhythm support. |
| `profileBasicsPayload` | json | no | Stable basics such as allergies/preferences must be treated as care constraints, not medical diagnosis. |
| `status` | enum | yes | `active`, `archived`, `merged`, `deleted`. |

Key constraints:

- No `myChatUserId`.
- Index: `(workspaceId, status, updatedAt)`.

### 3.3 `NurtureChildCareProcess`

The central aggregate tying family, institution, enrollment, communication, and care facts around one child.

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | string | yes | Child care process id. |
| `workspaceId` | string | yes | Scenario partition. |
| `childId` | string | yes | FK to `NurtureChild`. |
| `primaryFamilyId` | string | no | Convenience link; permissions still resolve by role assignments. |
| `status` | enum | yes | `active`, `paused`, `archived`, `deleted`. |
| `currentStageKey` | string | no | Optional care/development stage key. |
| `careContextSummary` | text | no | Display-safe summary for authorized participants. |
| `careContextPayload` | json | no | Structured care context used by Nurture policies/workflows. |

Key constraints:

- Index: `(workspaceId, childId, status)`.
- Index: `(workspaceId, status, updatedAt)`.
- Implementation may choose one active process per child initially; leave room for archival/history.

Scope rule:

- `NurtureChildCareProcess.id` is the required child scope for care facts. Parent and teacher views reorganize records by `familyId`, `participantId`, `careGroupId`, or `enrollmentId`, but those dimensions do not replace `childCareProcessId` for child-specific data.

### 3.4 `NurtureFamily`

Represents the family-side care unit for a child care process. Parents/guardians are participants assigned to it; the family object itself is not a My-Chat user.

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | string | yes | Family unit id. |
| `workspaceId` | string | yes | Scenario partition. |
| `childCareProcessId` | string | yes | FK to `NurtureChildCareProcess`. |
| `displayName` | string | no | Display-safe family label. |
| `status` | enum | yes | `active`, `archived`, `deleted`. |
| `familyProfilePayload` | json | no | Scenario-local family facts; not globally visible to teachers. |

Key constraints:

- Index: `(workspaceId, childCareProcessId, status)`.
- MVP must use one active family per child care process. Keep archival/history cardinality flexible, but multiple active families require a future separate-family privacy model.

### 3.5 `NurtureCareInstitution`

Represents a Nurture care institution as a business object.

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | string | yes | Institution id. |
| `workspaceId` | string | yes | Scenario partition. |
| `displayName` | string | yes | Institution-facing name. |
| `legalName` | string | no | Optional legal/profile field. |
| `profilePayload` | json | no | Institution profile and brand-facing metadata. |
| `policyConfigPayload` | json | no | Care workflow defaults, not global My-Chat policy. |
| `philosophyPayload` | json | no | Teaching/care philosophy that can be mapped to execution tasks. |
| `status` | enum | yes | `active`, `paused`, `archived`, `deleted`. |
| `createdByParticipantId` | string | no | Audit reference. |

Key constraints:

- Index: `(workspaceId, status, updatedAt)`.
- Managers are represented by `NurtureCareRoleAssignment` with `role=institution_admin`.

### 3.6 `NurtureCareGroup`

Represents a class/group/cohort inside an institution.

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | string | yes | Care group id. |
| `workspaceId` | string | yes | Scenario partition. |
| `institutionId` | string | yes | FK to `NurtureCareInstitution`. |
| `name` | string | yes | Group/class name. |
| `ageBandKey` | string | no | Optional grouping key. |
| `capacity` | int | no | Optional operational capacity. |
| `rhythmConfigPayload` | json | no | Daily rhythm, meal/nap/activity windows. |
| `status` | enum | yes | `active`, `paused`, `archived`, `deleted`. |

Key constraints:

- Index: `(workspaceId, institutionId, status)`.
- Name uniqueness is institution-local when active: `(workspaceId, institutionId, name)` for active groups.

### 3.7 `NurtureEnrollment`

Connects one child care process to an institution/group.

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | string | yes | Enrollment id. |
| `workspaceId` | string | yes | Scenario partition. |
| `childCareProcessId` | string | yes | FK to child care process. |
| `institutionId` | string | yes | FK to institution. |
| `careGroupId` | string | yes | FK to group. |
| `status` | enum | yes | `pending`, `active`, `paused`, `ended`, `withdrawn`, `deleted`. |
| `joinedAt` | datetime | no | Start timestamp. |
| `leftAt` | datetime | no | End timestamp. |
| `enrollmentRefPayload` | json | no | Optional imported admin ref. |

Key constraints:

- Index: `(workspaceId, childCareProcessId, status)`.
- Index: `(workspaceId, careGroupId, status)`.
- MVP should block more than one active enrollment for the same child care process in the same institution unless explicitly supported.

### 3.8 `NurtureCareRoleAssignment`

Defines what a participant can do, and within which care scope.

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | string | yes | Role assignment id. |
| `workspaceId` | string | yes | Scenario partition. |
| `participantId` | string | yes | FK to `NurtureParticipant`. |
| `role` | enum | yes | `guardian`, `caregiver`, `lead_caregiver`, `institution_admin`, `system_operator`. |
| `scopeType` | enum | yes | `child_care_process`, `family`, `institution`, `care_group`, `enrollment`. |
| `scopeId` | string | yes | ID matching `scopeType`. |
| `displayLabel` | string | no | Role/persona label for UI. |
| `permissionsPayload` | json | no | Optional fine-grained permission overrides. |
| `status` | enum | yes | `active`, `suspended`, `revoked`, `expired`, `deleted`. |
| `startsAt` | datetime | no | Effective start. |
| `endsAt` | datetime | no | Effective end. |
| `grantedByParticipantId` | string | no | Audit reference. |

Key constraints:

- Index: `(workspaceId, participantId, status)`.
- Index: `(workspaceId, role, scopeType, scopeId, status)`.
- Unique active assignment candidate: `(workspaceId, participantId, role, scopeType, scopeId)` where active.

Policy derivation:

- Guardian access requires an active `guardian` assignment scoped to `child_care_process` or `family`.
- Teacher access requires active `caregiver` or `lead_caregiver` assignment scoped to the relevant `care_group` or `enrollment`.
- Institution admin access requires active `institution_admin` assignment scoped to the institution and must still respect child data exposure policies.

## 4. Grant and Receipt Objects

### 4.1 `NurtureChildLinkGrant`

Controls explicit information flow for a child care process between family and institution workflows.

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | string | yes | Grant id. |
| `workspaceId` | string | yes | Scenario partition. |
| `childCareProcessId` | string | yes | FK to child care process. |
| `enrollmentId` | string | yes | FK to current or historical enrollment. |
| `grantedByParticipantId` | string | yes | Usually guardian; may be institution admin only for org policy defaults that still need family confirmation. |
| `grantedToScopeType` | enum | yes | `institution`, `care_group`, `enrollment`. |
| `grantedToScopeId` | string | yes | Scope target. |
| `directions` | string[] | yes | `family_to_org`, `org_to_family`. |
| `dataClasses` | string[] | yes | Allowed data classes. |
| `purposes` | string[] | yes | Product/legal purpose tags. |
| `status` | enum | yes | `pending`, `active`, `revoked`, `expired`, `replaced`, `deleted`. |
| `effectiveFrom` | datetime | no | Start. |
| `expiresAt` | datetime | no | Optional expiry. |
| `revokedAt` | datetime | no | Revoke timestamp. |
| `revokedByParticipantId` | string | no | Audit reference for revoke actor. |
| `revokeReason` | string | no | Display-safe reason. |
| `retentionPolicyPayload` | json | no | What happens to historical messages/items/receipts after revoke. |
| `policySnapshotPayload` | json | no | Snapshot of consent copy/policy version. |

MVP data classes:

| Data class | Direction | Purpose |
| --- | --- | --- |
| `daily_care_log` | `org_to_family` | Teacher daily care summary back to family. |
| `care_day_note` | `family_to_org` | Same-day reminders such as sleep, water, pickup, comfort. |
| `care_constraint_update` | `family_to_org` | Stable/semi-stable care constraints such as allergy, diet, comfort preference. |
| `family_care_question` | `family_to_org` | Family question requiring caregiver reply. |
| `family_follow_up_request` | `family_to_org` | Family asks caregiver to observe/follow up on a specific concern. |

Key constraints:

- Index: `(workspaceId, childCareProcessId, status)`.
- Index: `(workspaceId, enrollmentId, status)`.
- Index: `(workspaceId, grantedToScopeType, grantedToScopeId, status)`.
- Grant resolution must check direction, data class, enrollment, scope, status, and time window.

Pilot-0-B3-3b profile refinement:

- The first Pilot uses one Grant identity for the complete question round trip: exact child process and current enrollment; target `care_group` with the enrollment's current group; directions `family_to_org` and `org_to_family`; only `family_care_question`; purpose `family_care_workflow`; expiry at the earlier of 30 days after effectiveness or the workspace allowlist expiry.
- The `org_to_family` direction is valid only for a caregiver-confirmed reply causally linked to the original Grant-bound question item. The profile grants no proactive institution message, broadcast, daily-care share, or other data class.
- At most one active Grant may exist for the exact workspace/child/enrollment/care-group/purpose binding. Exact re-confirmation is idempotent; a changed definition creates a replacement identity and atomically moves the old Grant to `replaced`.
- Capture, acknowledge, and reply use the exact original `grantId`. A replacement cannot satisfy an old item's direction check or revive its lifecycle.
- The granting participant must be a current same-family Guardian. Pilot institution, caregiver, and technical roles cannot grant. Only the granting participant may replace/revoke; another current same-family Guardian may author a new question and read committed family-visible facts but cannot administer the Grant or redact another author's message.
- Pilot Grant expiry is mandatory, with no auto-renew or reactivation. Loss of the granting participant's current Guardian eligibility blocks new cross-role use and does not transfer ownership.

Runtime revoke requirements:

- Revoke must emit a Nurture domain event, for example `NurtureChildLinkGrantRevoked`, with `grantId`, `childCareProcessId`, `enrollmentId`, `revokedAt`, and grant aggregate version.
- Runtime records that depend on a grant should persist `grantId` and the grant aggregate version observed at creation/claim/delivery time.
- Workflow claim, retry, replay, delivery, notification, deep-link, context-pack build, and UI submit paths must re-check the current grant state.
- Pending cross-role deliveries after revoke must fail closed and write a blocked receipt/event rather than silently disappearing.

### 4.2 `NurtureChildLinkReceipt`

Nurture-owned logical cross-role delivery lifecycle record. The receipt is created or finalized in the same Nurture transaction that makes the source business fact/message available to the target Nurture surface. It does not wait for My-Chat transport acceptance or successful device delivery.

`NurtureChildLinkReceiptStatus`, its reason codes, and its transition matrix are Nurture-specific business policy. They MUST NOT be promoted into My-Workflow-Base or interpreted by My-Chat Workflow Step/Handoff state machines.

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | string | yes | Receipt id. |
| `workspaceId` | string | yes | Scenario partition. |
| `grantId` | string | no | May be null for unresolved pending routes or blocked/failed attempts before a matching grant exists; required before logical delivery. |
| `childCareProcessId` | string | yes | Scope. |
| `enrollmentId` | string | no | Scope, if relevant. |
| `direction` | enum | yes | `family_to_org`, `org_to_family`. |
| `dataClass` | string | no | Attempted data class; may be null only while routing remains unresolved/pending or when a blocked/failed attempt could not safely resolve it. |
| `sourceType` | enum | yes | `family_care_message`, `family_care_item`, `daily_care_log`, `media_attribution`, `system_summary`. |
| `sourceId` | string | yes | Source object id. |
| `routingAttemptKey` | string | yes | Stable logical routing identity; infrastructure retries reuse it. It is resolved independently of nullable grant/data-class/target fields. |
| `retryOfReceiptId` | string | no | Same-workspace self-reference to a terminal failed Receipt when this row is an explicit new recovery attempt; infrastructure retry never creates this link or a new row. |
| `targetScopeType` | enum | no | `family`, `participant`, `care_group`, `enrollment`, `institution`; may be null only under the pending/blocked/failed rules below. |
| `targetScopeId` | string | no | Target id; required with `targetScopeType` before logical delivery. |
| `status` | enum | yes | `pending`, `delivered`, `read`, `acknowledged`, `failed`, `blocked`, `revoked_after_delivery`. |
| `reasonCode` | string | no | Nurture-specific reason such as `grant_missing`, `grant_revoked`, `source_redacted`, `user_cancelled_before_delivery`, `data_class_mismatch`, `scope_mismatch`, `runtime_fence`, etc. |
| `pendingReason` | enum/string | no | `workflow_processing`, `awaiting_confirmation`, `scheduled_release`; required with matching driver while status is `pending`. |
| `driverType` | enum | no | `workflow_step`, `item_action`, `scheduled_step`; identifies the durable mechanism that can resume pending business work. |
| `driverRef` | json/ref | no | Opaque typed `DomainContextRef` to the already-existing host Step or Nurture action/item driver; bodyless and non-authorizing. |
| `nextActionAt` | datetime | no | Due time for a scheduled driver only; not a transport retry timestamp. |
| `version` | integer | yes | Optimistic-concurrency version for B2 receipt transitions. |
| `deliveredAt` | datetime | no | Delivery timestamp. |
| `readAt` | datetime | no | Read timestamp. |
| `acknowledgedAt` | datetime | no | Ack timestamp. |
| `metadataPayload` | json | no | Display-safe details only. |

Key constraints:

- Unique: `(workspaceId, direction, sourceType, sourceId, routingAttemptKey)`.
- Index: `(workspaceId, grantId, status)`.
- Index: `(workspaceId, retryOfReceiptId)`.
- Index: `(workspaceId, childCareProcessId, direction, dataClass, createdAt)`.
- Index: `(workspaceId, targetScopeType, targetScopeId, status, createdAt)`.

Lifecycle and ownership semantics:

- `pending` means a Nurture-owned release step is still incomplete, for example caregiver confirmation, institution review, scheduled release, required redaction, or unresolved target scope. It intentionally does not represent My-Chat handoff acceptance, outbox state, queue retry, or device-delivery state.
- `pending` MAY temporarily omit `grantId`, `dataClass`, and target scope while Nurture resolves the logical route. `delivered`, `read`, and `acknowledged` MUST have a resolved matching grant, data class, target scope type/id, enrollment where required, and current policy/runtime-fence approval.
- Every `pending` receipt MUST have a valid `pendingReason`, `driverType`, and already-existing `driverRef`. `scheduled_release` also requires `nextActionAt`. Commands MUST NOT create orphan pending receipts and rely on later global scanning to discover them.
- Driver fields are provenance only and remain bodyless. Receipt status never mirrors Step lease/attempt/queue/DLQ state; terminal receipt states may retain the driver refs for audit but they are no longer active drivers.
- `blocked` and `failed` preserve every safely resolved field plus a reason code, but may remain partially unresolved. Nullable route fields MUST NOT participate in receipt uniqueness; `routingAttemptKey` is the stable identity.
- If the family/teacher target surface can read the content immediately after the Nurture transaction commits, that transaction MAY create/finalize the receipt directly as `delivered`; it does not need an intermediate `pending` state.
- `delivered` means the authorized logical target workflow/surface can read the content. It does not mean every account/device received a push notification.
- `read` means at least one authorized participant in the logical target scope read the content; `acknowledged` requires an explicit Nurture business action.
- My-Chat notification, badge, deep-link, queue, Workflow Step retry exhaustion, or device failures do not directly change the Nurture receipt state. Automatic routing retry leaves a Receipt `pending`; host exhaustion enters manual review. `failed` means Nurture has re-evaluated current business state and owner-authorized recovery has determined that the logical release cannot complete.
- MVP commits `failed` only as `failed(technical_recovery_exhausted)` through a Nurture command with current Receipt/version/policy checks and an immutable exhausted/manual-review evidence ref. Grant/source/scope/policy termination uses `blocked`, not `failed`; host technical details remain in host evidence.
- `failed` is terminal. Technical retry before failure reuses the same command and `routingAttemptKey`. A deliberate retry after failure creates a new host Run/Step, command identity, routing attempt, and Receipt with `retryOfReceiptId` pointing to the failed row; it never reopens or rewrites the old Receipt.
- A receipt is created per logical target scope such as one family or one care group, not per My-Chat account, device, or notification channel. My-Chat owns physical fan-out and channel receipts.
- My-Chat handoff/notification state may correlate to this receipt by canonical ref, but must not become the authority for whether the Nurture business distribution should exist.
- One source action targeting multiple independent families/scopes creates independent receipts so delivery may partially succeed or fail without merging authorization or outcomes.
- Grant revoke transitions pending receipts to `blocked(grant_revoked)` and delivered/read/acknowledged receipts to `revoked_after_delivery(grant_revoked)`. It does not redact the source message or erase historical delivery/read/ack timestamps.
- Source redaction transitions pending receipts to `blocked(source_redacted)` and delivered/read/acknowledged receipts to `revoked_after_delivery(source_redacted)`. A post-delivery processing withdrawal without redaction leaves the receipt's delivery status unchanged.
- A pre-delivery user cancel transitions pending to `blocked(user_cancelled_before_delivery)`. A later deliberate resend creates a new command and `routingAttemptKey`; blocked receipts do not reopen.

## 5. Family-Care Communication Objects

### 5.1 `NurtureFamilyCareThread`

Private thread for one child care process and its authorized family/institution participants. Teacher-side aggregation happens through items, not by merging family-private threads.

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | string | yes | Thread id. |
| `workspaceId` | string | yes | Scenario partition. |
| `childCareProcessId` | string | yes | FK. |
| `familyId` | string | yes | FK. |
| `enrollmentId` | string | no | Present when tied to a current institution relationship. |
| `careGroupId` | string | no | Denormalized for class inbox query. |
| `visibilityScope` | enum | yes | `family_private`, `enrollment_private`, `institution_case`. |
| `status` | enum | yes | `active`, `closed`, `archived`, `deleted`. |
| `latestMessageAt` | datetime | no | Query optimization. |
| `summaryPayload` | json | no | Display-safe thread summary, not an auth source. |

Key constraints:

- Index: `(workspaceId, childCareProcessId, status)`.
- Index: `(workspaceId, careGroupId, status, latestMessageAt)`.
- Unique active thread candidate: `(workspaceId, childCareProcessId, familyId, enrollmentId, visibilityScope)`.

### 5.2 `NurtureFamilyCareThreadParticipant`

Materializes who can see and write inside a thread.

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | string | yes | Thread participant id. |
| `workspaceId` | string | yes | Scenario partition. |
| `threadId` | string | yes | FK. |
| `participantId` | string | yes | FK. |
| `roleAssignmentId` | string | yes | FK to active/relevant role assignment. |
| `participantKind` | enum | yes | `guardian`, `caregiver`, `lead_caregiver`, `institution_admin`, `system`. |
| `visibilityStatus` | enum | yes | `active`, `muted`, `left`, `removed`, `blocked`. |
| `lastReadMessageId` | string | no | Read state. |
| `lastReadAt` | datetime | no | Read timestamp. |

Key constraints:

- Index: `(workspaceId, participantId, visibilityStatus)`.
- Index: `(workspaceId, threadId, visibilityStatus)`.
- Thread writes must re-check the backing role assignment and policy, not only this row.

### 5.3 `NurtureFamilyCareMessage`

Canonical message record for Nurture family-care communication.

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | string | yes | Message id. |
| `workspaceId` | string | yes | Scenario partition. |
| `threadId` | string | yes | FK. |
| `childCareProcessId` | string | yes | Denormalized scope. |
| `senderParticipantId` | string | yes | Actual human author or explicit system/institution participant. |
| `senderRoleAssignmentId` | string | yes | FK/snapshot of the authoring or system role. |
| `messageKind` | enum | yes | `family_message`, `caregiver_reply`, `system_notice`, `care_summary`, `redaction_notice`; `caregiver_reply` means a caregiver-confirmed workflow response, not a direct chat send. |
| `authorshipKind` | enum | yes | `family_authored`, `caregiver_confirmed`, `institution_generated`, `system_generated`. |
| `sourceItemId` | string | no | Workflow item that produced or contextualized the message. |
| `sourceItemEventId` | string | no | Confirmed workflow action/event that produced the family-facing response. |
| `sourceDailyCareLogId` | string | no | Daily-care fact behind a distributed care summary. |
| `body` | text | no | Canonical body when status/storage mode allows direct plaintext persistence. Redacted messages must not expose raw body. |
| `bodyFormat` | enum | yes | `plain_text`, `rich_text`. |
| `bodyStorageMode` | enum | yes | `plain_text_dev`, `protected`, `encrypted`, `redacted`. |
| `bodyProtectionPayload` | json | no | Encryption/storage metadata such as key id/version/algorithm; no secrets. |
| `attachmentsPayload` | json | no | Storage refs/metadata; no host-owned chat dependency. |
| `sourceSurface` | enum | yes | `mobile`, `web`, `system_import`, `workflow`. |
| `grantId` | string | no | The grant used for cross-role delivery, if applicable. |
| `status` | enum | yes | `sent`, `redacted`, `failed`. |
| `redactedAt` | datetime | no | Redaction timestamp. |
| `redactedByParticipantId` | string | no | Actor who initiated redaction, if any. |
| `redactionReason` | string | no | `user_delete`, `policy_delete`, `safety`, `retention`, `admin_action`, etc. |
| `redactionPayload` | json | no | Display-safe redaction metadata/audit context. |
| `safetyFlagsPayload` | json | no | Non-diagnostic safety/routing flags. |

Key constraints:

- Index: `(workspaceId, threadId, createdAt)`.
- Index: `(workspaceId, childCareProcessId, createdAt)`.
- Index: `(workspaceId, senderParticipantId, createdAt)`.
- Index: `(workspaceId, sourceItemId, createdAt)` when `sourceItemId` is present.

Lifecycle rules:

- Cross-role messages are workflow-mediated. Family input may create work items; caregiver/institution/system output must originate from an allowed workflow action, care fact, or deterministic system transition.
- `NurtureFamilyCareMessage` is the canonical communication record, but `NurtureFamilyCareItem`, item event, or daily-care log remains the source of truth for workflow/care state.
- A named caregiver attribution requires `authorshipKind=caregiver_confirmed` and a matching participant/role/action trace. AI-drafted content cannot be published under a caregiver identity before confirmation.
- `NurtureFamilyCareMessage` canonical status is intentionally small: `sent`, `redacted`, `failed`.
- `hidden` is not a message status. Surface suppression belongs to `NurtureFamilyCareItem`, `NurtureTeacherAttentionItem`, notification policy, or presenter/query filters.
- `deleted` is not a message status. User delete, policy delete, safety removal, admin action, and retention action enter `redacted` with `redactionReason` and audit metadata. Physical deletion is governed by retention/legal jobs outside the business lifecycle.
- Redaction is not summarization. `NurtureFamilyCareItem.summary`, `safeSummary`, and AI classification are derived projections; they do not change a message from `sent` to `redacted`.
- When `status=redacted`, raw body and direct attachment access must be unavailable to normal readers. The audit shell remains for traceability.
- My-Chat shell may receive display-safe projection fields for realtime rendering, but must not persist them as host canonical state. Host persistence is limited to opaque delivery bookkeeping defined in section 10.

### 5.4 `NurtureFamilyCareItem`

Task-like item extracted from a message or created manually for class-level teacher workflow.

`NurtureFamilyCareItemStatus` and `NurtureFamilyCareItemEventType` are Nurture-owned workflow vocabulary. Other scenarios may reuse the durable-command/driver pattern but do not share these enums or transitions.

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | string | yes | Item id. |
| `workspaceId` | string | yes | Scenario partition. |
| `sourceMessageId` | string | no | FK to message when extracted. |
| `threadId` | string | yes | Source/target private thread. |
| `childCareProcessId` | string | yes | Scope. |
| `familyId` | string | yes | Scope. |
| `enrollmentId` | string | no | Institution relationship. |
| `careGroupId` | string | yes | Class inbox scope. |
| `dataClass` | enum/string | yes | System grant/policy key such as `care_day_note`, `care_constraint_update`, `family_care_question`, `family_follow_up_request`; institution-local labels must map into this key. |
| `category` | enum/string | yes | Workflow/display taxonomy such as `today_attention`, `constraint`, `question`, `follow_up`, `schedule`, `admin`, `other`. |
| `summary` | string | yes | Teacher-facing short summary. |
| `detail` | text | no | Optional detail; still scoped to authorized roles. |
| `urgency` | enum | yes | `normal`, `today_attention`, `time_sensitive`, `urgent_non_emergency`. |
| `requiresAck` | boolean | yes | Teacher must acknowledge. |
| `requiresReply` | boolean | yes | Teacher should reply to family. |
| `status` | enum | yes | `open`, `acknowledged`, `waiting_for_family`, `replied`, `followed_up`, `closed`, `expired`, `suppressed`. |
| `version` | integer | yes | Optimistic-concurrency version for B2 conditional transitions. |
| `activeClarificationRequestEventId` | string | no | Current clarification-request event while status is `waiting_for_family`. |
| `waitingForFamilySince` | datetime | no | Current clarification wait start. |
| `waitingForFamilyUntil` | datetime | no | Optional business clarification deadline; distinct from token TTL and item expiry. |
| `clarificationExpiryDriverRef` | json/ref | no | Optional opaque host delayed-Step ref created before a deadline-backed wait is committed. |
| `assignedToRoleAssignmentId` | string | no | Caregiver/lead caregiver assignment. |
| `dueAt` | datetime | no | Optional due time. |
| `expiresAt` | datetime | no | Item expiry. |
| `ackedByParticipantId` | string | no | Audit. |
| `ackedAt` | datetime | no | Audit. |
| `closedAt` | datetime | no | Audit. |
| `suppressedAt` | datetime | no | Visibility/work suppression timestamp. |
| `suppressionReason` | string | no | Nurture reason such as `grant_revoked` or `source_redacted`. |
| `linkedReplyMessageId` | string | no | Latest reply convenience ref; append-only events remain the multi-round clarification/reply history. |
| `classificationSource` | enum | yes | `manual`, `rule`, `ai`, `system`. |
| `classificationConfidence` | decimal | no | Optional. |
| `grantId` | string | no | Grant used for family_to_org flow. |
| `safetyFlagsPayload` | json | no | Non-diagnostic routing/safety flags. |

Key constraints:

- Index: `(workspaceId, careGroupId, status, urgency, dueAt)`.
- Index: `(workspaceId, childCareProcessId, status, createdAt)`.
- Index: `(workspaceId, threadId, status, createdAt)`.
- Index: `(workspaceId, assignedToRoleAssignmentId, status, dueAt)`.

State rules:

- `open` -> `acknowledged` when a caregiver confirms they saw it.
- `open|acknowledged` -> `waiting_for_family` when a caregiver-confirmed workflow action requests clarification from the family.
- `waiting_for_family` -> `open` when a correlated family response arrives, or when the clarification is cancelled/expires and teacher attention is required again.
- Token expiry does not change Item state. Clarification deadline expiry returns the Item to `open` when the Item remains valid; Item business expiry transitions it to `expired` instead.
- Grant revoke suppresses active dependent Items without redacting the source Message. Source redaction suppresses active Items and makes copied/derived summary/detail/attachment display unavailable; confirmed independent care facts retain their own lifecycle.
- Pre-delivery route cancellation may suppress a not-yet-visible Item. Post-delivery family withdrawal closes the Item with `reason=family_withdrawn` and leaves delivery history unchanged.
- `open|acknowledged` -> `replied` when a caregiver reply is written to the private thread.
- `open|acknowledged|replied` -> `followed_up` when a concrete follow-up record exists.
- Any nonterminal state -> `closed` when no further action is needed.
- Time-sensitive items may become `expired`; expired items must remain auditable.
- AI classification may create a draft item, but sending/replying/closing remains human-confirmed for MVP.

Vocabulary rules:

- `dataClass` is the grant/policy/runtime taxonomy. It must be a system key accepted by the Nurture data-class registry.
- `category` is the workflow/display taxonomy. It may support institution-local labels, templates, and routing, but those must map back to system `dataClass`.
- Grants, receipts, revoke fences, and AI context filters must never use institution-local labels as authorization keys.

### 5.5 `NurtureFamilyCareItemEvent`

Append-only audit trail for item state changes.

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | string | yes | Event id. |
| `workspaceId` | string | yes | Scenario partition. |
| `itemId` | string | yes | FK. |
| `actorParticipantId` | string | no | Null for system events. |
| `actorRoleAssignmentId` | string | no | Role snapshot. |
| `eventType` | enum | yes | `created`, `classified`, `assigned`, `acknowledged`, `clarification_requested`, `clarification_received`, `clarification_expired`, `clarification_cancelled`, `corrected`, `replied`, `followed_up`, `closed`, `expired`, `suppressed`, `reopened`. |
| `fromStatus` | string | no | Previous item status. |
| `toStatus` | string | no | New item status. |
| `relatedMessageId` | string | no | Family-facing clarification request or family-authored response message. |
| `correlationEventId` | string | no | Prior clarification-request event when a response/expiry/cancel event closes that wait cycle. |
| `eventPayload` | json | no | Display-safe audit details. |

Key constraints:

- Index: `(workspaceId, itemId, createdAt)`.
- Index: `(workspaceId, actorParticipantId, createdAt)`.

Clarification event rules:

- The active request event id, wait timestamps, and optional expiry driver live on Item only for current-state reads; ItemEvents remain the append-only history.
- The first `clarification_received`, `clarification_expired`, or `clarification_cancelled` command that matches the active request event/version ends the wait cycle. Later scheduled commands return `already_satisfied`.
- A family response arriving after expiry/cancel is still stored and may append `clarification_received` with `eventPayload.late=true`; it cannot revive an expired Item or bypass current grant/policy.

## 6. First-Slice Care Facts

These objects support the first institution capabilities without over-expanding into a full SIS/LMS.

### 6.1 `NurtureDailyCareLog`

Teacher-recorded care log that can flow back to family through `org_to_family`.

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | string | yes | Log id. |
| `workspaceId` | string | yes | Scenario partition. |
| `childCareProcessId` | string | yes | Scope. |
| `enrollmentId` | string | yes | Scope. |
| `careGroupId` | string | yes | Scope. |
| `recordedByRoleAssignmentId` | string | yes | Teacher/caregiver role. |
| `logDate` | date | yes | Care day. |
| `mealPayload` | json | no | Operational care record. |
| `napPayload` | json | no | Operational care record. |
| `activityPayload` | json | no | Activity participation/notes. |
| `moodPayload` | json | no | Non-diagnostic observation. |
| `healthObservationPayload` | json | no | Operational observation only; no diagnosis/prescription. |
| `summary` | text | no | Family-facing or teacher-facing summary depending status. |
| `status` | enum | yes | `draft`, `recorded`, `shared`, `suppressed`, `corrected`, `deleted`. |
| `sourceItemId` | string | no | Optional link to family request. |
| `grantId` | string | no | Grant used for org_to_family sharing. |

Key constraints:

- Index: `(workspaceId, careGroupId, logDate, status)`.
- Index: `(workspaceId, childCareProcessId, logDate, status)`.

### 6.2 `NurtureTeacherAttentionItem`

Materialized child-scoped teacher board projection. It can be derived from family-care items, care constraints, daily care logs, child-applied institution policy, or manual child-specific notes.

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | string | yes | Attention item id. |
| `workspaceId` | string | yes | Scenario partition. |
| `careGroupId` | string | yes | Teacher board grouping/query dimension. |
| `childCareProcessId` | string | yes | Required child scope. |
| `sourceType` | enum | yes | `family_care_item`, `care_constraint`, `daily_care_log`, `child_applied_institution_policy`, `manual_child_note`. |
| `sourceId` | string | no | Source object id. |
| `title` | string | yes | Short board title. |
| `summary` | string | no | Display-safe summary. |
| `priority` | enum | yes | `normal`, `attention`, `time_sensitive`. |
| `status` | enum | yes | `active`, `resolved`, `expired`, `suppressed`. |
| `effectiveDate` | date | no | Day scope. |
| `expiresAt` | datetime | no | Expiry. |

Key constraints:

- Index: `(workspaceId, careGroupId, effectiveDate, status, priority)`.
- Index: `(workspaceId, childCareProcessId, status, effectiveDate)`.

Implementation choice:

- IB-D3 is locked: materialize this as a rebuildable child-scoped projection for teacher mobile UX.
- `NurtureTeacherAttentionItem` is not a class-owned fact. `careGroupId` groups child-scoped items for teacher workflow; `childCareProcessId` remains required.
- Group-level operational notices, such as "15:00 whole-class activity", should not be stored here. Model those separately later as `CareGroupOperationItem` / `CareGroupNotice` or equivalent.

### 6.3 `NurtureMediaAssetRef`

Reference to a class/institution media asset. Storage may be external, but attribution and exposure policy are Nurture facts.

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | string | yes | Media asset ref id. |
| `workspaceId` | string | yes | Scenario partition. |
| `institutionId` | string | yes | Asset owner scope. |
| `careGroupId` | string | no | Class/group source. |
| `uploadedByRoleAssignmentId` | string | no | Teacher/admin upload audit. |
| `sourceKind` | enum | yes | `class_album`, `class_group_message`, `activity_album`, `admin_upload`. |
| `storageRefPayload` | json | yes | Storage/provider ref, not raw binary. |
| `safeTitle` | string | no | Display-safe metadata. |
| `capturedAt` | datetime | no | Photo/video capture time if known. |
| `status` | enum | yes | `active`, `hidden`, `deleted`. |

Key constraints:

- Index: `(workspaceId, institutionId, status, createdAt)`.
- Index: `(workspaceId, careGroupId, status, createdAt)`.

### 6.4 `NurtureChildMediaAttribution`

Candidate/confirmed attribution from media asset to child care process.

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | string | yes | Attribution id. |
| `workspaceId` | string | yes | Scenario partition. |
| `mediaAssetRefId` | string | yes | FK. |
| `childCareProcessId` | string | yes | Candidate/confirmed child scope. |
| `source` | enum | yes | `face_reference`, `manual`, `history_match`, `system`. |
| `confidence` | decimal | no | Candidate score. |
| `status` | enum | yes | `candidate`, `confirmed`, `rejected`, `corrected`, `hidden`, `deleted`. |
| `confirmedByRoleAssignmentId` | string | no | Teacher/admin confirmation. |
| `confirmedAt` | datetime | no | Confirmation timestamp. |
| `exposurePolicyPayload` | json | no | Family visibility policy snapshot. |

Key constraints:

- Index: `(workspaceId, mediaAssetRefId, status)`.
- Index: `(workspaceId, childCareProcessId, status, createdAt)`.

Rule:

- Recognition creates only `candidate`. Family-visible child album views require `confirmed` plus exposure policy/grant checks.

## 7. Resolver and Policy Contracts

### 7.1 Participant Resolution

Input from My-Chat shell:

```text
workspaceId
myChatUserId
surface
capabilityKey
hostConversationRef?
currentPayload?
genericDisplayState?
scenarioToken?
invocationRequestId
```

Resolution:

1. Load active `NurtureParticipant` by `(workspaceId, myChatUserId)`.
2. Load active `NurtureCareRoleAssignment` rows for participant.
3. Never accept a host-authored role assignment, child/care-group/institution scope, target ref, grant, data class, direction, or policy decision. My-Chat display state is non-authorizing.
4. If a valid Nurture-issued `scenarioToken` is present, resolve its local interaction context and still recheck participant, role, scope, grant, target lifecycle, and policy.
5. Resolve target scope from Nurture facts: child care process, family, institution, care group, enrollment, thread, item, or safe collection surface; return structured clarification when multiple valid paths remain.
6. Apply policy by role + scope + enrollment + grant.
7. Business writes must resolve to a concrete `roleAssignmentId` and `childCareProcessId` when the write is child-specific. Pure chat clarification turns may remain participant-level and must not create child-specific business facts.
8. Return Nurture participant/role context to handlers; do not delegate role meaning back to My-Chat.

### 7.2 Policy Predicates

| Policy | Required checks |
| --- | --- |
| `nurture.can_view_child_care_process` | Active participant role scoped to the child care process, family, enrollment, care group, or institution with allowed child exposure. |
| `nurture.can_write_family_care_message` | Active thread participant, valid backing role assignment, thread status active, and target child care process visible. |
| `nurture.can_receive_family_context` | Active caregiver scope, matching enrollment/care group, active grant with `family_to_org` and data class. |
| `nurture.can_share_to_family` | Active caregiver/admin scope, active grant with `org_to_family` and data class, family thread visibility. |
| `nurture.caregiver_scope` | Caregiver action must target an active enrollment or care group assignment the participant holds. |
| `nurture.can_confirm_media_attribution` | Caregiver/admin role scoped to asset institution/care group; candidate child must be enrolled or explicitly authorized. |

### 7.3 `NurtureInteractionContext`

Nurture-local short-lived continuation state behind one issued `scenarioToken`. It is not a chat session, authorization record, long-running family clarification workflow, business memory, or command execution receipt.

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | string | yes | Internal context id; never used by My-Chat as a business ref. |
| `workspaceId` | string | yes | Scenario partition. |
| `participantId` | string | yes | Current Nurture participant binding; authenticated My-Chat identity must resolve to this participant on every use. |
| `purpose` | enum | yes | `clarify`, `submit_action`, `open_notification`. |
| `surface` | string/enum | yes | Allowed issuing/return surface binding. |
| `tokenHash` | string | yes | Namespaced SHA-256 hash of the high-entropy opaque token; raw token is never persisted. |
| `tokenHashVersion` | integer | yes | Hash namespace/version; MVP `1`. |
| `hostConversationRefHash` | string | no | Optional namespaced hash for same-conversation binding; no raw host conversation id. |
| `payloadSchemaVersion` | integer | yes | Purpose-specific payload schema version. |
| `statePayload` | json | yes | Nurture-validated refs/hash payload; no cached authorization decision or bodyful transport content. |
| `status` | enum | yes | Persisted state only: `active`, `consumed`, `revoked`. |
| `expiresAt` | datetime | yes | Expiry is derived from this time and does not require an `expired` status transition. |
| `consumedAt` | datetime | no | Set on valid one-time clarify/submit consumption. |
| `revokedAt` | datetime | no | Set when the owner invalidates future use. |
| `version` | integer | yes | Optimistic-concurrency version. |
| `createdAt` | datetime | yes | Audit timestamp. |
| `updatedAt` | datetime | yes | Last state update. |

Purpose payload rules:

- `clarify`: pending intent, complete candidate-path refs, and `optionTokenHash -> candidateRef` mappings. A valid response consumes the row; another clarification issues a new row/token.
- `submit_action`: command key, target refs, expected versions, prepared action schema/hash, and immutable content/attachment refs. Valid execution consumes the row in the command transaction; exact response-loss retry resolves the same B2 Execution.
- `open_notification`: Nurture source/Receipt/Item/Message locator refs only. Reads do not consume the row; every open rechecks current lifecycle/access until expiry or revoke.
- `statePayload` MUST NOT store message/attachment bodies, target-account/device lists, role/grant/policy decisions, model output copies, or host retry state.

Classification and command identity:

- Persist only `active|consumed|revoked`. `current|expired|recoverable|blocked` are resolver outcomes derived from status, `expiresAt`, bindings, referenced object state, and current policy.
- A multi-turn `submit_action` derives a stable internal `commandRequestId` from context id + purpose; `NurtureCommandExecution` stores only its normal hash. Direct single-turn commands may continue to reuse the host invocation request identity.
- `scenarioToken` never skips resolver, policy, grant/runtime fence, lifecycle, expected-version, or command precondition checks.

Key constraints:

- Unique: `(workspaceId, tokenHash)`.
- Index: `(workspaceId, participantId, status, expiresAt)`.
- Index: `(workspaceId, hostConversationRefHash, status, expiresAt)`.
- Numeric TTL and physical purge windows are purpose/product policy, not schema enums. Expired rows cannot be used even before purge.

### 7.4 IIA Command handoff replay-seed extension

`NurtureCommandExecution` remains the Nurture-owned database authority for committed command replay. IIA adds these immutable result fields:

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `handoffSnapshotSchemaVersion` | integer | yes | MVP `1`; determines the parser for the stored array. |
| `handoffRequestSnapshotsPayload` | json array | yes | Bounded, refs-only `ScenarioHandoffRequestSnapshot[]`; explicit `[]` means no host activation. |
| `handoffDriverRef` | json/ref | conditional | Required iff the snapshot array is non-empty; opaque ref to the pre-existing and claimed My-Chat `workflow_step`, which becomes the exclusive replay owner. |

Rules:

- The JSON array, command effects, receipts/events, output refs, and final Execution commit in one Nurture database transaction and are immutable afterward.
- Each command spec validates schema version, bounded count, unique request IDs, stable request-ID ordering, allowed handoff key/purpose, and refs-only payload. No message body, account/device/channel list, generated notification copy, authorization decision, provider response, or retry state is allowed.
- A non-empty array requires My-Chat to persist and claim the `workflow_step` before invoking Nurture. The authenticated runtime carries driver ref, pinned contract/capability/entrypoint binding, claim token, and expected Step version. Missing driver fails with `missing_durable_handoff_driver`; wrong service/ref/binding fails with `invalid_durable_handoff_driver`, both before the Nurture transaction and without consuming command identity.
- Nurture persists only `handoffDriverRef`. Claim token/version are transient, excluded from semantic command hashing, and forbidden in Nurture storage/logs/presenters. Nurture does not synchronously owner-read My-Chat or interpret host lease/retry status; My-Chat validates them in `complete_step`.
- Non-empty snapshot replay requires the exact persisted Step ref under trusted reconciliation purpose. The same Step may be reclaimed with a new token/version; another Step cannot take over. Admin recovery uses the original Step, Handoff technical replay uses the materialized Ledger, and business resend creates new identities.
- A direct command without a durable host Step may commit only an explicit empty array. No scenario-side scanner, transport outbox, or cache may be used to discover non-empty snapshots later.
- My-Chat Handoff Ledger becomes the operational authority after materialization; the stored Nurture array remains the immutable replay seed and never receives host status updates.

## 8. Lifecycle Flows

### 8.1 Parent joins a child care process

1. My-Chat user enters Nurture shell.
2. Nurture creates or finds `NurtureParticipant`.
3. Nurture creates `NurtureChild`, `NurtureChildCareProcess`, and `NurtureFamily` if missing.
4. Nurture creates `NurtureCareRoleAssignment(role=guardian, scopeType=child_care_process|family)`.
5. Family-side workflow can now create private family-care threads.

### 8.2 Institution enrolls child

1. Institution admin/caregiver has active institution/care group role.
2. Nurture creates `NurtureEnrollment` linking child care process to institution/group.
3. Nurture creates or updates `NurtureFamilyCareThread` for enrollment-private communication.
4. Family and institution negotiate/confirm `NurtureChildLinkGrant`.
5. Teacher board/class inbox can now show grant-allowed items.

### 8.3 `family_to_org` message to class inbox

1. Guardian writes `NurtureFamilyCareMessage` in child-private thread.
2. Classifier creates draft/confirmed `NurtureFamilyCareItem` with data class and status `open`.
3. Grant resolver checks `family_to_org` + data class + enrollment/care group.
4. If allowed, item appears in `class_family_inbox`; receipt is `delivered`.
5. Teacher handles the item through structured workflow actions such as acknowledge, request clarification, record outcome, answer question, or close; the teacher does not enter a direct family chat room.
6. A workflow action may atomically create an item event and a traceable family-facing `NurtureFamilyCareMessage` for the same child-private thread. My-Chat notification delivery remains a later opaque/idempotent handoff.

### 8.4 `org_to_family` daily care log

1. Caregiver records `NurtureDailyCareLog`.
2. Sharing action checks `org_to_family` + `daily_care_log` grant.
3. If allowed, Nurture writes a receipt and a traceable family-facing canonical message/summary linked to the daily-care log.
4. My-Chat may deliver notification/deep link, but Nurture remains owner of log and receipt.

### 8.5 Grant revoke

1. Guardian or authorized participant revokes `NurtureChildLinkGrant`.
2. Future delivery attempts fail closed.
3. Existing messages/items/logs remain according to `retentionPolicyPayload` and are marked with grant status where surfaced.
4. Receipts record `revoked_after_delivery` or blocked attempts as applicable.

## 9. Class-of-10 Acceptance Scenario

This SPEC is sufficient only if it can represent this baseline:

- One institution with one active care group.
- Ten `NurtureChildCareProcess` records, each with one `NurtureChild`, one `NurtureFamily`, and one active `NurtureEnrollment`.
- Each child has two guardian participants and the class has two caregiver participants plus one institution admin.
- Each family has a private `NurtureFamilyCareThread`.
- A caregiver sees one `class_family_inbox` by `careGroupId`, populated by `NurtureFamilyCareItem` rows from all ten private threads.
- A caregiver reply from the inbox writes only to the source child's private thread.
- A guardian can never see another child's thread, item, media attribution, or daily log.
- Revoking one child's grant stops new `family_to_org` and `org_to_family` deliveries for that child only, not the rest of the class.

## 10. My-Chat Shell Integration Boundary

Default integration is realtime. My-Chat calls Nurture render/action APIs and does not persist Nurture render envelopes as host canonical state.

Allowed host persistence only when delivery requires bookkeeping:

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

`scenarioObjectType` and `scenarioObjectId` are opaque host delivery refs. My-Chat must re-resolve every deep-link open or action submit through Nurture before displaying or mutating data.

Ephemeral delivery payload:

- `safeTitle` / `safeBody` may be used as provider push payload or TTL-bound notification copy when required by the host delivery channel.
- Ephemeral visible copy is non-authoritative, not queryable as Nurture state, and must not survive grant revoke/redaction semantics as current truth.

Not allowed in My-Chat canonical state:

- Family-care message canonical body.
- Long-lived `safeSummary` / `safeBody` as Nurture truth.
- Family-care item workflow state.
- Grant policy semantics.
- `dataClass` / `category` as host policy facts.
- `childCareProcessId` as a host-queryable business scope.
- Message redaction internals.
- Caregiver scope derivation.
- Child profile/care constraints as reusable account facts.
- Media attribution truth or family-visible exposure decisions.

## 11. Converged Decisions Before Prisma Implementation

Detailed rationale and implementation implications are in `07-ib-decision-convergence.md`.

| ID | Decision | IB default |
| --- | --- | --- |
| IB-D0 | Child care process scope | **LOCKED:** `NurtureChildCareProcess.id` is the independent child scope; parent/teacher views reorganize one or more child scopes. |
| IB-D1 | `NurtureParticipant` identity and surface role resolution | **LOCKED, REFINED BY PILOT-0-B3-0:** One participant per `(workspaceId, myChatUserId)`; Chat is role-agnostic only among Chat-entitled guardian/caregiver roles; guardian also has family board/workbench, caregiver has teacher board, institution admin has institution board/workbench, and technical operator remains outside Nurture business surfaces. |
| IB-D2 | `NurtureFamily` cardinality | **LOCKED:** One active family per child care process for MVP; multiple parents use guardian role assignments. |
| IB-D3 | Teacher attention board | **LOCKED:** Materialize `NurtureTeacherAttentionItem` as a rebuildable child-scoped projection for teacher mobile UX. |
| IB-D4 | Grant revoke retention/runtime | **LOCKED:** Revoke is a runtime fence: stop future flow immediately, exit active work surfaces/context, and keep historical records limited/auditable. |
| IB-D5 | Data class/category vocabulary | **LOCKED:** `dataClass` is the system grant/policy contract; `category` is workflow/display taxonomy; institution vocabulary maps into those keys. |
| IB-D6 | Message protection | **LOCKED:** Message canonical status is `sent` / `redacted` / `failed`; no message-level `hidden` or `deleted`; My-Chat receives safe projections only. |
| IB-D7 | My-Chat shell metadata | **LOCKED:** Default realtime handling; My-Chat does not persist Nurture render envelope and only persists minimal opaque host delivery bookkeeping when delivery requires it. |

Remaining production gates:

- Numeric retention windows, deletion jobs, and legal copy for `NurtureChildLinkGrant` revoke.
- Production encryption/KMS and attachment storage security posture.

## 12. Implementation Gate

Before moving this SPEC into schema/code:

1. Review this doc against `02-architecture.md` and `docs/context/workflow/nurture-scenario-contract.md`.
2. Apply the IB defaults from `07-ib-decision-convergence.md` or explicitly record superseding decisions.
3. Update `prisma/schema.prisma` through the repo-prisma SSOT workflow.
4. Run `node .ai/scripts/ctl-db-ssot.mjs sync-to-context`.
5. Add resolver/policy tests for class-of-10, grant mismatch, revoke, caregiver scope, and private thread reply routing.
