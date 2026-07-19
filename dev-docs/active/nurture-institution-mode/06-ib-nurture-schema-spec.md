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

Pilot-0-C1 class/readiness refinement:

- `NurtureCareGroup` is the only class/group aggregate; no parallel `Class`, onboarding-class state machine, or Host-owned class projection may become authoritative.
- Institution workbench creates/updates and non-destructively pauses/resumes/archives the CareGroup through explicit versioned `CommandExecution` transitions. Institution board remains a read-only safe aggregate/navigation surface. `deleted` is not a Pilot user action.
- CareGroup lifecycle and readiness are separate. Family Enrollment Invitation requires current `active` Institution and CareGroup, at least one active care-group-scoped Lead Caregiver, complete required policy, and enabled Pilot gates. Missing staff/policy/gate produces a current unavailable/readiness result rather than another persisted group status or cached authorization boolean.
- Paused/archived CareGroup, missing current Lead, expired/revoked staff scope, or institution/policy disable blocks new family invitations and current protected work according to owner policy while retaining historical group, enrollment, role, message, and audit facts.
- Pilot activates exactly one Lead Caregiver for the synthetic group and excludes backup/multi-caregiver concurrency. The reusable schema may hold multiple caregiver assignments later, but every assignment remains separately scoped and revalidated.

### 3.6.1 `NurtureInstitutionRosterEntry` (Pilot-0-C2a design target)

Represents the minimum institution-local intake record used when an invited family has no existing Nurture child profile. This design is locked for later implementation but is not present in the current Prisma schema or migration stream.

| Field family | Required | Notes |
| --- | --- | --- |
| Workspace/Institution/CareGroup scope | yes | The entry is usable only inside one exact institution/group boundary. |
| Institution-local display label | yes | An operational invitation label, not a verified or global child identity. |
| Optional age band or birth prefill | no | Must retain institution provenance and remain visibly unverified until Guardian confirmation/edit. |
| Lifecycle/version/audit | yes | Supports institution-local correction, invitation correlation, closure, and idempotent command evidence without deleting history. |
| Opaque Host invitation reference | no | Correlates the My-Chat-owned Enrollment Invitation; raw contact/auth data remains in My-Chat. |
| Linked child-care-process reference | no | May be written only as part of, or as an idempotent replay of, Guardian-confirmed Enrollment. |

Key constraints:

- A RosterEntry is not `NurtureChild`, `NurtureChildCareProcess`, `NurtureFamily`, a Guardian RoleAssignment, `NurtureEnrollment`, or `NurtureChildLinkGrant`; it grants no family, teacher, message, care-fact, or protected-body access.
- Institution Admin may create/correct the entry from the Institution workbench before the group is invitation-ready, but Enrollment Invitation send still requires the full current C-1 readiness predicate.
- Institution-provided name/age/birth data is prefill only. Guardian must explicitly confirm or edit the minimum profile; Nurture must not globally or fuzzily match children by name, birth date, institution input, or raw contact data.
- When no profile exists, minimum `NurtureChild` / `NurtureChildCareProcess` / `NurtureFamily` creation and the first confirmed Guardian RoleAssignment must commit atomically; the flow cannot leave an authority-free child profile. C-2b still owns the exact invitation, confirmation, and later Co-Guardian authority rules.
- Pilot existing-profile selection is restricted to child processes currently owner-resolved for the authenticated Guardian in the same workspace. Cross-workspace/cross-stage portability requires the separate C-2f contract.
- If the invitation is never accepted, expires, or is declined, the institution-local entry/audit may remain, but no invitation-derived Participant/Guardian role, child process, Family, Enrollment, Grant, thread, Message, Receipt, or care fact may be created.
- Pilot-0 excludes institution-only full child operations for non-participating families. Any future service for such families requires its own authority, privacy, retention, and migration design and cannot silently upgrade a RosterEntry into a longitudinal child profile.

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

Pilot-0-C1 staff-onboarding refinement:

- Staff Invitation is My-Chat identity delivery/acceptance plus Nurture-owned invitation intent; the intent may describe the expected Institution/CareGroup safely but is never a RoleAssignment or access credential.
- Accepted canonical My-Chat identity binds or reuses exactly one workspace `NurtureParticipant`. Participant existence and Host membership grant no Nurture business role.
- Institution Admin separately and strongly confirms a care-group-scoped `caregiver` RoleAssignment. Lead Caregiver designation is a distinct versioned transition and cannot be inferred from invitation copy, the first accepted teacher, or general Institution membership.
- Teacher-board/Chat caregiver access requires current Host membership plus current Participant and active RoleAssignment for the exact care group. Wrong group, expired/suspended/revoked role, group/institution pause/archive, or policy change fails closed on every read/action.
- Revoking or expiring a staff role does not delete the Participant, accepted invitation history, authored Message/Event/Execution facts, or other separately authorized role scopes. Re-invitation reuses the canonical Participant and requires a new/current RoleAssignment; no prior role silently reactivates.

Pilot-0-C2b-1 first-Guardian refinement:

- An active Institution Enrollment Invitation and exact My-Chat recipient authentication are prerequisites for the Pilot entry path, but neither fact is a Guardian RoleAssignment or proof of a family relationship.
- The prospective Guardian must strongly confirm the relationship declaration, minimum child profile, longitudinal-profile/privacy meaning, and visibility consequence. Institution prefill stays unverified and editable.
- One Nurture `CommandExecution` transaction binds or reuses `NurtureParticipant` and creates the new `NurtureChild`, `NurtureChildCareProcess`, `NurtureFamily`, and first active Guardian RoleAssignment. Unique/version/idempotency failures roll back all rows; an authority-free child/family aggregate is forbidden.
- Existing child processes are selectable only through current owner resolution for an already active Guardian in the same workspace. A non-Guardian Enrollment Invitation recipient cannot claim an existing child and must first complete the separate current-Guardian-initiated Co-Guardian flow.
- No `primary_guardian` role or implicit higher authority is introduced. Family-confirmed `father`, `mother`, or `other_guardian` relationship/display metadata may be retained on the role/profile contract but must not change policy permissions.
- The Pilot records a product assertion and audit result, not legal guardian verification. Identity documents, civil-status evidence, institution attestation, and offline review are outside this command and require a separate sensitive-data contract before real use.

Pilot-0-C2b-2 Co-Guardian Invitation refinement:

- Any current Guardian in the exact Family/ChildCareProcess may initiate a Co-Guardian invitation under current family policy. The role model adds no primary/family-admin hierarchy. Institution Admin, Caregiver, and Technical Operator cannot initiate, accept, or substitute a recipient.
- My-Chat owns raw contact, provider delivery, recipient authentication, invitation acceptance, and workspace membership. A future Nurture invitation-intent record owns only opaque Host invitation ref, inviter/family/process binding, suggested relationship metadata, expiry/version/canonical payload hash, lifecycle/audit, and current-policy evidence; the current Prisma schema does not yet implement this intent.
- My-Chat Host acceptance proves exact recipient identity/membership but is not the business invitation lifecycle. The current Nurture intent is the sole Guardian-creation eligibility fence; Host/provider accepted or delivered state cannot override Nurture expiry/revoke/cancel/policy denial.
- Invitation issue creates no recipient `NurtureParticipant`, Guardian RoleAssignment, historical visibility, Grant ownership, Enrollment, roster link, or new Child/Process/Family. Suggested `father|mother|other_guardian` metadata is untrusted until the recipient confirms/edits it and never changes permission.
- Acceptance requires exact My-Chat recipient identity and rechecks current inviter Guardian authority, Family/ChildCareProcess lifecycle, invitation state/expiry/version, workspace, recipient uniqueness, and the Pilot cohort gate. One Nurture `CommandExecution` transaction binds/reuses recipient Participant and creates one active Guardian RoleAssignment plus result/audit refs.
- Exact issue/accept replay returns original refs; changed family/process/recipient/relationship payload conflicts. Inviter role loss, family/process disablement, wrong recipient/workspace, revoked/expired/consumed invitation, or topology drift fails before role creation.
- The exact inviter may cancel a pending invitation. Pending cancellation cannot remove an accepted Guardian relationship; accepted relationship exit/revoke remains C-2b-4.
- Pilot policy permits one Co-Guardian acceptance for Family-1 and none for Family-2/Family-3, producing the exact `2 + 1 + 1` topology. This is a cohort gate, not a unique constraint, Schema cardinality, or product maximum; later multi-Guardian policy remains separate.

Pilot-0-C2b-3 Guardian rights/history refinement:

- All current Guardian RoleAssignments in the same Family/ChildCareProcess have equal base family role authority; first/second order and relationship/display labels do not change permission.
- After atomic role commit, a current Guardian may owner-reread eligible committed family history, including facts created before that Guardian joined. Every query still checks current Family/role, applicable Enrollment, original Grant where cross-role content is involved, redaction, retention, and policy. No pre-commit access or copied per-Guardian history projection exists.
- Either current same-family Guardian may author a new eligible family-care question under the current active Grant and read currently allowed family-visible Message/Receipt/reply facts. Exact authorship remains immutable, and each Guardian may redact only their own Message.
- Co-Guardian acceptance does not change `grantedByParticipantId`. Only the existing Grant owner may replace/revoke that Grant; a second Guardian cannot inherit, transfer, or revive ownership through role membership.
- Family-originated committed facts use current family-side authorization. Caregiver/institution-originated protected bodies remain cross-role data and require the original Grant/current fences; role membership cannot bypass revoke/replacement/expiry or turn an allowed tombstone into a body.
- Unsubmitted drafts, Chat drafts, action forms, and `NurtureInteractionContext` are actor/surface-local and never become Co-Guardian history. Acceptance creates no Message/Receipt copy, history backfill row, old notification, or duplicate owner projection.
- General child-profile mutation remains outside this checkpoint; C-2b-3 grants safe profile/history read plus already locked family-care actions, not arbitrary shared profile editing.
- Relationship exit/revoke and post-exit visibility remain C-2b-4.

Pilot-0-C2b-4 accepted-relationship exit/revoke refinement:

- A current Guardian may strongly confirm exit of their own relationship. One Guardian cannot revoke another accepted Guardian role, including a role established from their invitation. Institution Admin, Caregiver, and Technical Operator have no direct removal authority.
- Self-exit requires current My-Chat identity/workspace, current Participant/Guardian role, exact Family/ChildCareProcess, expected role version, current policy, and at least one other current Guardian. Last-Guardian exit fails before any write; family closure or authority transfer belongs to a later dedicated contract.
- One Nurture `CommandExecution` transaction changes the exiting RoleAssignment to terminal `revoked`, terminalizes pending Co-Guardian invitation intents issued by that actor, revokes active `NurtureChildLinkGrant` rows whose `grantedByParticipantId` is that actor, and applies existing dependent Receipt/Item/Attention/body fences. Failure rolls back all mutations.
- Active Grants owned by another eligible current Guardian are not revoked by the actor's self-exit. Grant ownership is neither transferred nor inherited.
- Post-commit owner reads/actions deny the exiting actor immediately, including author-side body access that requires a current same-family role. Participant, relationship history, authorship refs, Message/Receipt/Execution facts, and audit shells remain; no fact or author is reassigned to the remaining Guardian.
- My-Chat account disablement or workspace-membership loss blocks authenticated use but does not silently rewrite Nurture RoleAssignment/Grant state. Restoring Host membership does not revive a terminal Nurture role.
- Rejoin requires a new Co-Guardian invitation, a new active RoleAssignment, and any later independently confirmed Grant. Old role and Grant identities remain terminal.
- Pilot performs one second-Guardian self-exit only after the main two-Guardian journeys. The main journey topology remains `2 + 1 + 1`; the later offboarding probe verifies stale notification/history denial and is not a reusable cardinality rule.
- Forced removal, custody/legal dispute, evidence capture, or safety adjudication is outside Pilot. Such work requires a separate high-sensitivity authority/privacy/retention contract and cannot become an Operator, Institution, or direct-database action.

Pilot-0-C2c-1 Institution Enrollment Invitation issue refinement:

- Only a current Institution Admin for the exact Institution may issue from the Institution workbench. Caregiver, Guardian, Technical Operator, service identity, board card, and raw client role/scope claims cannot initiate.
- Issue rechecks active Institution/CareGroup, current exact-group Lead Caregiver, completed required policy, workspace/capability/Pilot gates, current unlinked `NurtureInstitutionRosterEntry`, and absence of an effective pending Enrollment Invitation for that entry.
- A future Nurture Enrollment Invitation intent binds workspace, Institution, CareGroup, RosterEntry, issuing Admin, opaque exact-recipient Host invitation binding, required `expiresAt`, version, canonical payload hash, lifecycle/audit, and opaque Host invitation ref. The current Prisma schema does not yet implement this intent or its effective-pending uniqueness.
- My-Chat owns raw recipient contact, provider delivery, recipient authentication, workspace membership, and Host acceptance. Nurture intent state remains the sole business onboarding fence; stale Host delivered/accepted/provider state cannot override Nurture cancel, expiry, readiness, lifecycle, or policy denial.
- Issue creates no recipient Participant/Guardian RoleAssignment, Child/ChildCareProcess/Family, Enrollment, Grant, roster link, family thread, Message/Receipt, or teacher-visible child fact.
- Display output is limited to safe Institution name, CareGroup name, institution-local child label, invitation purpose, expiry, and privacy/confirmation explanation. Institution-provided child name/age/birth prefill remains visibly unverified and cannot become canonical profile data on issue.
- Exact replay returns the original intent/ref. Changed Institution, CareGroup, RosterEntry, recipient binding, expiry, or canonical payload conflicts. A replacement/reissue must terminalize the prior pending intent under C-2c-3 rather than overlap.
- Pilot creates exactly three distinct Enrollment Invitation intents, one per synthetic RosterEntry. Family-1 second-Guardian onboarding uses the separate Co-Guardian invitation intent and cannot reuse or reinterpret Enrollment Invitation state.
- C-2c-1 requires an explicit expiry but defers the numeric Pilot duration, cancel, reissue, and concurrent lifecycle to C-2c-3.

Pilot-0-C2c-2 acceptance and child branch refinement:

- Exact-recipient My-Chat Host acceptance is required identity/membership evidence but does not consume the Nurture Enrollment Invitation intent, select a child, create business authority, or bypass current intent/readiness/policy checks.
- If the authenticated participant already has one or more current same-workspace Guardian scopes, Nurture owner resolution returns only safe eligible ChildCareProcess candidates. The Guardian must explicitly select through a Nurture-issued opaque option even for a single candidate; raw child ids, Institution prefill, name/birth/contact match, and Host payload cannot select.
- If no eligible Guardian scope exists, the recipient uses the C-2b-1 command to atomically bind/reuse Participant and create Child/ChildCareProcess/Family/first Guardian RoleAssignment. That command has its own stable identity/replay result and does not consume or complete the Enrollment Invitation.
- A non-Guardian who knows an existing profile exists must obtain Co-Guardian Invitation from a current Guardian. Enrollment Invitation cannot claim, merge, or duplicate-link an existing profile through fuzzy/global matching. Automatic duplicate detection/merge is outside Pilot.
- Existing-child selection remains only in a bounded `NurtureInteractionContext` tied to invitation/participant/purpose/surface/expiry and opaque candidate refs. No selected child id is persisted on the RosterEntry or Enrollment Invitation intent before C-2d confirmation; expired context requires fresh owner resolution.
- Before C-2d commit there is no RosterEntry-to-child link, Enrollment, Grant, family thread, teacher-visible child fact, invitation consumption, or cross-role access.
- A newly created family-owned profile survives later invitation expiry/cancel because it is an independently confirmed longitudinal fact. Institution linkage remains absent, and a later attempt must re-resolve current owner/profile state.
- Pilot first onboarding for all three families uses the new-profile branch. Existing-profile selection is a required boundary test using an already authorized synthetic process; it does not add a fourth child/family or count as final Enrollment evidence.

Pilot-0-C2c-3 invitation lifecycle refinement:

- Stored lifecycle is `pending`, `consumed`, `cancelled`, or `superseded`. `expired` is a current derived classification whenever `now >= expiresAt`; no sweep/status migration is required for authority loss.
- Pilot `expiresAt` is exactly `issuedAt + 7×24 hours`. Expiry never extends in place. A reissue receives a new identity and new seven-day window.
- Any current Institution Admin for the exact Institution may cancel a pending intent; the exact recipient may decline. Both store a terminal `cancelled` state with distinct allowlisted audit reason, actor, version, and time. Caregiver/Operator/other recipient cannot cancel or decline.
- Reissue/correction never edits an existing binding. One Nurture command terminalizes the old pending intent as `superseded` and creates a new intent with new invitation/request/Host ref/expiry/hash plus immutable `supersedesInvitationId` lineage; the effective-pending uniqueness remains true.
- My-Chat provider retry/resend of the same Host invitation is technical delivery and retains the original Nurture intent. A business reissue never reuses old Host acceptance, request, replay key, or intent identity.
- Readiness/lifecycle/policy loss derives a current blocked result without another invitation state. An unexpired pending intent may resume after readiness recovery; current checks still run on every attempt.
- Cancel/decline/expiry/supersede invalidates or blocks related `NurtureInteractionContext` use. Independently committed Participant/Child/Process/Family/Guardian facts remain and receive no Institution link.
- Every lifecycle transition requires expected version and stable command identity. Cancel versus C-2d consume, supersede versus acceptance, and duplicate issue use first-commit-wins; exact replay returns the terminal/current result and losing stale writes cannot reopen.
- `consumed` may be written only in the C-2d transaction that commits Enrollment and consumes the exact current pending intent. Host acceptance, child selection, profile creation, provider delivery, or context use cannot write consumed.
- Terminal intents, opaque Host refs, CommandExecutions, actor/reason/time, and supersede lineage are retained for audit. No old intent is deleted or changed back to pending.
- Pilot runs three normal invitation paths plus one cancel/reissue race and one expiry/stale-open probe without adding a child/family.

Pilot-0-C2c-4 confirmation-ready result refinement:

- A successful child branch returns typed presenter result `ready_for_enrollment_confirmation`; the result is not an Enrollment or authorization result. Allowlisted display is Institution, CareGroup, Guardian-confirmed child display, invitation expiry, privacy consequence, and an explicit statement that Enrollment does not create a Grant.
- Nurture issues a `submit_action` `NurtureInteractionContext` bound to exact invitation, participant, selected or newly created ChildCareProcess, Institution/CareGroup/RosterEntry, `confirm_family_enrollment`, source surface, expected versions, and canonical action hash. The client supplies only the opaque scenario token and confirmation input, never raw target ids.
- Effective context expiry is `min(contextCreatedAt + 5 minutes, invitation.expiresAt)`. The context cannot extend the invitation. Expired/consumed/revoked context or invitation/binding/version drift requires fresh owner resolution through C-2c-2.
- The context is short-lived continuation state, not a persisted RosterEntry-child link or proposed Enrollment. Existing-child selection stays inside the context; a new family profile remains its own durable family fact without Institution association.
- Guardian Chat, family board, and family workbench may render the result and invoke the same `confirm_family_enrollment` action. No cross-surface/device/account unfinished draft or context transfer is supported.
- Every render and submit rechecks pending/not-expired invitation, exact recipient/current Guardian, unlinked RosterEntry, Institution/CareGroup/Lead/policy/Pilot readiness, absence of conflicting Enrollment, and expected versions.
- C-2c-4 writes no Enrollment, RosterEntry-child link, Grant, family thread, teacher-visible child fact, notification, or Workflow Handoff. Only C-2d strong confirmation may commit those permitted Enrollment-bound facts and consume the invitation.
- Replay of the same read/result is deterministic and side-effect free. Terminal invitation or readiness loss returns only a safe unavailable/refresh result; stale cached confirmation cannot continue.

Pilot-0-C2d-1 atomic Enrollment refinement:

- `confirm_family_enrollment` requires the exact current invitation recipient to remain a current Guardian and strongly confirm the resolved ChildCareProcess, Institution, CareGroup, and roster association plus the explicit no-implicit-Grant consequence. Client input is limited to the opaque current submit context and confirmation response.
- Before writing, Nurture reloads the pending/not-expired invitation, exact recipient/Participant/Guardian, ChildCareProcess/Family, unlinked RosterEntry, Institution/CareGroup/Lead/policy/Pilot readiness, absence of conflicting Enrollment, context status/expiry/bindings, and all expected versions.
- One Nurture database transaction consumes the submit InteractionContext, creates or resolves the stable CommandExecution, creates the exact `NurtureEnrollment`, sets the RosterEntry's canonical `linkedChildCareProcessId`, moves the exact invitation from pending to consumed with `consumedAt` and Enrollment correlation, and records immutable audit/result refs.
- The transaction is all-or-nothing. Constraint, lifecycle, version, readiness, binding, or authority failure leaves no partial Enrollment, roster link, invitation/context consumption, Execution result, or audit success. Exact committed replay returns the original refs; changed command/context payload conflicts.
- The Enrollment initial status/`joinedAt` semantics, effective uniqueness and later transitions remain C-2d-2. Private thread creation timing remains C-2d-3. Presenter/recovery/Handoff policy remains C-2d-4; no effect may be inferred before those decisions.
- Enrollment confirmation neither creates a `NurtureChildLinkGrant` nor authorizes teacher access to family content. Grant remains a separate C-2e strong-confirmation command.

Pilot-0-C2d-2 Enrollment lifecycle and concurrency refinement:

- Pilot `confirm_family_enrollment` creates `status=active` and sets `joinedAt` from the authoritative database transaction timestamp generated inside the same atomic transaction. Client/Host/Institution-provided status or time, backdating, future scheduling, and in-place `joinedAt` changes are forbidden. A future scheduled-start feature requires a separate contract.
- Pilot creates no `pending` Enrollment. For fail-closed uniqueness, any pre-existing `pending`, `active`, or `paused` Enrollment is current-conflicting for the same `(workspaceId, childCareProcessId, institutionId)` across all CareGroups.
- A ChildCareProcess may hold independent current Enrollments at different Institutions. Each Enrollment, CareGroup, roster association, policy scope, and later Grant remains separate; cross-Institution presence grants no shared access.
- Same-Institution current Enrollment in another CareGroup returns `enrollment_conflict`; confirmation cannot silently end, move, replace, or relink the prior Enrollment. Transfer remains C-2f.
- Exact stable-command replay returns the original Enrollment and consumed invitation result. A new command for an already-current same Institution/CareGroup returns safe `already_enrolled` without a new business effect; a different CareGroup, already-linked RosterEntry, or competing invitation returns a deterministic conflict.
- One RosterEntry links successfully once. Concurrent confirmations, invitations, and roster-link writes use database uniqueness plus expected versions and first-commit-wins. A losing invitation remains unconsumed, its RosterEntry remains unlinked, and no context/Execution success or partial business effect commits.
- `paused` remains current-conflicting. `ended` and `withdrawn` are terminal and never return to active. Re-entry after a terminal Enrollment requires a new RosterEntry, Enrollment Invitation, and Enrollment identity.
- Pilot does not transition to or from `deleted`; the status cannot bypass terminal history, uniqueness, audit, or C-2f transition policy. C-2f owns pause/resume/exit/withdraw/transfer and cross-stage actors and commands.

Pilot-0-C2d-3 private Thread timing refinement:

- Enrollment confirmation creates no `NurtureFamilyCareThread` or ThreadParticipant. Exact-scope Institution Admin/Caregiver roster presenters may show only current care-group membership, a Guardian-confirmed safe child label, Enrollment status, and `joinedAt`; family/Guardian/contact/profile details, Grant/thread/message existence, protected bodies, and other Institution facts are forbidden.
- The first C-2e command that commits the exact active `NurtureChildLinkGrant` also creates `status=active`, `visibilityScope=enrollment_private` Thread bound to exact `(workspaceId, childCareProcessId, familyId, enrollmentId, careGroupId)`. Grant, Thread, CommandExecution, and required audit/result refs are all-or-nothing.
- One active enrollment-private Thread identity exists per `(workspaceId, childCareProcessId, familyId, enrollmentId)`. A different Institution Enrollment has a different Enrollment and Thread. Exact Grant replay and Grant replacement return/reuse the existing Thread rather than copying history or creating a second container.
- Thread creation cannot be deferred to first Message/Item. First protected input requires an already current Enrollment, active original Grant, and existing resolved Thread, avoiding a second thread-creation/retry path.
- Thread and ThreadParticipant rows are routing/projection state, never authority snapshots. Every presenter/action resolves current participant/role, exact Enrollment/CareGroup, original/current Grant, thread lifecycle, policy, source lifecycle, and redaction before exposing content or accepting a write.
- Grant revoke/expiry/replacement retains Thread identity and audit. Replacement reuses the container, but no new/later Grant revives protected bodies or effects invalidated under a terminal original Grant. Ineligible reads/actions fail immediately regardless of Thread status.
- Ended/withdrawn Enrollment cannot migrate or reuse the Thread for a later Enrollment. Re-entry creates a new Enrollment-scoped Thread only with its new first active Grant. Thread close/archive actors and exact transition timing remain C-2f.

Pilot-0-C2d-4 Enrollment result, recovery, and Handoff refinement:

- Successful confirmation stores stable Enrollment/RosterEntry/invitation refs in CommandExecution and returns presenter type `enrollment_confirmed`. Stored result refs are replay/recovery locators, not cached authorization or lifecycle values.
- Current presenter allowlist is Guardian-confirmed safe child label, Institution, CareGroup, current Enrollment status, and `joinedAt`, plus explicit statements that no Grant exists and private family-care communication remains unavailable. Raw ids, invitation/Host refs, family/contact/profile fields, Thread/Grant refs or internal lifecycle details, and protected content are forbidden.
- `review_family_care_grant` is a non-authorizing presenter route affordance only. Opening Grant review reruns owner resolution and may later expose the existing `confirm_child_link_grant` durable action; no route payload, result, or old submit context grants authority or aliases that action key.
- Exact stable-command replay and response-loss recovery return the original CommandExecution/Enrollment refs and one business effect. Every render owner-rereads current recipient/Guardian/workspace/Enrollment state, so later pause/end/withdraw or authority loss cannot be masked by cached confirmation output.
- After the exact invitation is consumed, passing its former `expiresAt` does not undo Enrollment or turn the committed result into an expired failure. The invitation-to-Enrollment correlation supports safe recovery only for the exact currently authorized owner; wrong/stale actors receive unavailable/tombstone without existence leakage.
- Presenter, client, provider, or network failure after commit never deletes, compensates, or reopens Enrollment, roster linkage, invitation, or context. An uncommitted transactional failure retains the C-2d-1 all-or-nothing outcome.
- Pilot `confirm_family_enrollment` always stores `handoffRequestSnapshotsPayload=[]`; no durable driver is required, and no activation seed, Workflow Handoff, My-Chat Outbox event, notification, or deep link is created. Institution board/workbench discovers roster changes through current owner reread.
- A future Enrollment-success notification requires a separate versioned refs-only action/Handoff, durable claimed-Step provenance, and independent acceptance. Delivery success can never become an Enrollment commit condition.

Pilot-0-C2e-0 ThreadParticipant authority refinement:

- Business permission is derived on every presenter/action from current My-Chat identity/workspace membership plus Nurture Participant/RoleAssignment, exact Enrollment/CareGroup, exact current or original Grant, Thread/source lifecycle, policy, and redaction.
- `NurtureFamilyCareThread` is the required exact business aggregate. A missing, mismatched, inactive, or terminal Thread fails the operation through domain lifecycle validation rather than actor-membership projection.
- `NurtureFamilyCareThreadParticipant` is optional routing, read-cursor, subscription, and display-preference projection. Its absence cannot deny an otherwise current Guardian/Caregiver; an active, stale, forged, or cross-scope row cannot grant or preserve access; hidden/inactive projection may affect listing only.
- The first active-Grant transaction need not create ThreadParticipant rows. Projection creation/update may run only after current owner authorization and cannot become an authorization cache or mandatory fan-out dependency.
- C-2e implementation MUST remove `thread_membership_active` as a Guardian/Caregiver hard gate while retaining exact Thread existence/scope/lifecycle checks. Schema fields may remain additive, but no stored participant status may become a second permission source.

Pilot-0-C2e-1 Grant review and confirming-Guardian refinement:

- Any current My-Chat-authenticated, exact-Family Guardian whose role reaches the selected ChildCareProcess may review and first-confirm the fixed Pilot Grant. Enrollment invitation recipient, Enrollment confirmer, join order, and relationship label do not create primary authority.
- The first committed confirmer becomes exact `grantedByParticipantId` and sole replace/revoke owner. Other current same-family Guardians may use and inspect the active Grant but cannot co-own, replace, revoke, or receive ownership through replay, `already_satisfied`, or membership changes.
- Product-level strong confirmation requires current owner resolution and an explicit generic `authorization_gate`. Natural-language agreement, LLM intent, navigation, preview, page open, or Enrollment confirmation is not a Grant confirmation; Pilot adds no password/OTP/biometric requirement beyond applicable Host session policy.
- Every confirming surface MUST display safe child label, Institution/CareGroup, the exact bidirectional family-question workflow, eligible family/caregiver use, bounded duration, confirming-owner/non-transfer consequence, revoke/retention effect, and excluded direct-chat/broadcast/media/daily-care/health/emergency/other-data uses. Raw ids, internal enums/policy/hash, client-defined target/profile/expiry, and unverified Institution child data are forbidden.
- Nurture issues a five-minute `submit_action` InteractionContext bound to exact workspace, Participant/Guardian role, Family/ChildCareProcess, active Enrollment/Institution/CareGroup, `confirm_child_link_grant`, fixed canonical profile/hash, expected versions, and presenting surface. The client returns only opaque context plus explicit confirmation; context cannot cross actor/account/surface/device or survive expiry/revoke/drift.
- Review and context issue create no Grant, Thread, CommandExecution, protected-content, Handoff, notification, or cross-role visibility fact. Existing exact active Grant renders current state; a new/racing command may resolve `already_satisfied` without changing owner. C-2e-2 owns transaction, identity, time, expiry, and concurrency enforcement.

Pilot-0-C2e-2 atomic Grant/Thread refinement:

- Active Grant business identity is `(workspaceId, childCareProcessId, enrollmentId, grantedToScopeType, grantedToScopeId, canonical purposes)`. Pilot uses `grantedToScopeType=care_group`, the current Enrollment CareGroup id, and canonical singleton purposes `[family_care_workflow]`.
- Add a raw PostgreSQL partial unique index over the identity columns where `status='active' AND deleted_at IS NULL`. Prisma schema cannot express the predicate. Server code canonicalizes purpose arrays and rejects duplicate/unknown values before persistence.
- `directions` and `dataClasses` are mandatory canonical business-profile fields but not active identity columns. Same-definition compares child/process/Enrollment/target plus canonical directions/data classes/purposes and excludes newly recomputed lifecycle timestamps. Any profile difference or deliberate expiry-policy change while an active identity exists returns `grant_replacement_required` for C-2e-4; a derived per-attempt timestamp cannot manufacture a difference.
- Add the missing Restrict foreign key/relation from `grantedByParticipantId` to `NurtureParticipant.id`. Migration preflight must report duplicate active identities and orphan owner ids; migration cannot select an owner, merge rows, delete history, or auto-correct ambiguous data.
- One Serializable command transaction performs exact CommandExecution replay lookup, locks and reloads the submit context and current owner/business facts, obtains database `transaction_timestamp()`, classifies all matching Grant and exact Thread rows without `findFirst`, conditionally consumes the context, creates the Grant, creates or reuses the exact active Enrollment-private Thread, and persists CommandExecution/audit/result refs. No external provider/service call may occur inside the transaction.
- Applied confirmation commits consumed context, one new active Grant, one new or existing exact Thread, and `CommandExecution(applied)` together. A new or racing same-definition request consumes its own context and records `CommandExecution(already_satisfied)` pointing to the winning Grant/Thread without changing owner or expiry. Exact command replay returns the original Execution without a second consume/effect.
- `effectiveFrom` is database transaction time. `expiresAt=min(effectiveFrom + 30 days, exact Pilot allowlist expiry)`. Authorization uses `status=active`, `effectiveFrom <= dbNow`, `expiresAt > dbNow`, `revokedAt IS NULL`, and `deletedAt IS NULL`; expiry is the half-open interval `[effectiveFrom, expiresAt)` and does not depend on a worker.
- An allowlist closure or computed expiry at/before `effectiveFrom` blocks success with no partial writes. A fresh eligible confirmation may mark a time-elapsed active row `expired` with version increment and create a new Grant identity in the same transaction, reusing the exact Enrollment Thread. The command never reactivates the old row or revives old content. Active-owner ineligibility blocks confirmation pending C-2e-4 and cannot auto-revoke or transfer ownership.
- Thread classification is exhaustive. No historical Thread creates one atomically; one exact active Enrollment-private Thread is reused for fresh/replacement Grant identities; a terminal, mismatched, duplicate, or cross-Institution Thread while Enrollment is active returns an integrity conflict for manual reconciliation. First Message never creates the Thread, and C-2e-2 creates no ThreadParticipant row.
- Known serialization failure, deadlock, and exact Grant/Thread partial-unique collision receive bounded whole-transaction retry. Every attempt rereads authoritative state; a losing race becomes `already_satisfied`. Rolled-back attempts leave the submit context active until a retry commits or the context expires. Exhaustion returns retryable `command_busy`; unknown unique/integrity failures remain technical errors.

Pilot-0-C2e-3 Grant result, recovery, and explicit-empty refinement:

- CommandExecution is the immutable committed receipt. `disposition=executed|replayed` remains response-only, `businessOutcome=applied|already_satisfied` remains persisted, and `outputRefs` contain exactly one versioned Grant ref plus the exact versioned Enrollment-private Thread ref. Execution/output refs never grant visibility and never enter client payloads, URLs, route state, Host transcript, notifications, analytics, or query dimensions.
- User presentation is a current owner-read type `family_care_grant_current`, not a cached `grant_confirmed` receipt. Safe source-result values are `activated`, `already_active`, and `processed_but_unavailable`; current actor relation is `owner`, `family_user`, or `none`. The presenter exposes only safe child label, Institution/CareGroup, fixed scope summary, actual `effectiveFrom`/`expiresAt`, and current actions. Owner identity is expressed as “you” or “another current Guardian”, never raw Participant/account identity.
- A new `already_satisfied` Execution records the requesting Guardian as business actor but points to the winning Grant/Thread. Current presentation may say that authorization already exists and that the actor can use it, but cannot say that the actor confirmed, owns, jointly approved, or may administer it.
- Exact response-loss retry finds and compares the immutable Execution before checking the already-consumed or later-expired submit context. A compatible original caller needs no second confirmation. User output still reruns current Host/Nurture identity, Guardian/Family, Enrollment/CareGroup, Grant, policy, and lifecycle visibility; wrong/stale callers receive generic unavailable without Execution/Grant existence disclosure.
- If the source cannot recover the original command identity, recovery uses the ordinary current Grant presenter. It cannot mint another command identity to probe completion, issue an `open_result` token, or carry Execution/Grant/Thread refs across surfaces. Exact replay preserves the original outcome; presenter state may truthfully change after expiry/revoke/replacement/authority loss.
- Deterministic actor/scope/Enrollment/CareGroup/policy/allowlist/version drift makes the old submit context unusable and commits no Execution/business success. Retryable transaction, contention, owner-service, or transport failure leaves the context active only while its original TTL remains. Presenter/network failure after commit never compensates or deletes Grant/Thread/Execution.
- `confirm_child_link_grant` stores `handoffRequestSnapshotsPayload=[]` and `handoffDriverRef=NULL` for both `applied` and `already_satisfied`. The command requires no durable Workflow Step and creates no Workflow Handoff, My-Chat Outbox, notification, deep link, teacher visibility, Message, Receipt, Item, Attention, or ThreadParticipant. Nurture-local audit/event rows remain local facts and cannot be interpreted as host activation.
- Active owner presentation may offer separate submit-question/replace/revoke actions; active `family_user` presentation may offer separate submit-question/current-state actions only. Starting a question requires a new draft, preview, context, confirmation, and command and cannot be folded into Grant confirmation.

Pilot-0-C2e-4a Grant replacement refinement:

- Replacement is a new authorization identity and separate `replace_child_link_grant -> nurture.family_care.replace_grant` command, never in-place profile/expiry mutation, renewal, reactivation, ownership transfer, or Enrollment/CareGroup topology change.
- Only the exact old Grant `grantedByParticipantId` may prepare/submit while remaining a current exact-Family Guardian and while old Grant, Family/ChildCareProcess, Enrollment/current CareGroup, policy, allowlist, and expected old Grant version are current. Another Guardian and every Institution/Caregiver/Operator/service actor fail closed.
- A five-minute `submit_action` strong-authorization context binds exact actor/role/process/Enrollment/current CareGroup/old Grant id+version/new canonical profile/surface. Review shows old/new safe definitions and expiries, exact delta, unchanged owner, immediate old-Grant termination, old-work stop, retention, and no revival. Client returns only opaque context plus explicit confirmation.
- Add nullable unique `supersedesGrantId` on the new Grant as a Restrict self-FK, plus nullable `replacedAt` and `replacedByParticipantId` on the old Grant; replacement actor is a Restrict FK to Participant. For `status=replaced`, old-row replacement audit fields are required. A new Grant with `supersedesGrantId` must share workspace/process/Enrollment/owner with its active predecessor and the predecessor must transition to `replaced` in the same command transaction.
- Do not add a stored `replacementGrantId` on the old row. The unique new-to-old relation provides the inverse successor query and avoids two persisted lineage directions. Migration preflight reports broken/duplicate/cyclic/cross-scope lineage and cannot auto-link history.
- One Serializable transaction performs exact replay; locks/reloads context/current owner facts/old Grant/exact Thread; obtains database transaction time; validates the canonical new definition; consumes context; writes old `active -> replaced`, `replacedAt`, replacement actor, and version increment; creates one same-owner active successor with `effectiveFrom=old.replacedAt`; reuses the exact Enrollment-private Thread; applies old-Grant fences; and persists Execution.
- The active partial unique index plus old-first/new-second writes inside one transaction yield no committed overlap or gap. Old/new mutation, dependent fence, and Execution are all-or-nothing. No remote service runs inside the transaction.
- Exact same-definition resolves `already_satisfied` without new row, lineage, owner change, or expiry extension. Revoked/expired/replaced/deleted/missing old Grant cannot replace. Owner ineligibility defers to C-2e-4c; Enrollment/CareGroup movement defers to C-2f.
- Replace/revoke or two-replacement races use expected old version and first-commit-wins. Losers return current conflict/review guidance; unknown lineage/active-identity defects remain integrity conflicts and cannot become `already_satisfied`.
- Every existing Message/Receipt/Item/Attention keeps its original `grantId`. Old-Grant work fails current authorization immediately and converges under C-2e-4d; successor Grant applies only to future questions. Thread reuse retains one Enrollment container but grants no old-body/action authority.
- Replacement Execution outputs exactly terminal old Grant ref, active successor Grant ref, and reused Thread ref. It stores `handoffRequestSnapshotsPayload=[]` and null driver and creates no Step/Handoff/Outbox/notification/deep link/protected business object.

Pilot-0-C2e-4b owner-initiated revoke refinement:

- Voluntary revoke remains the separate `revoke_child_link_grant -> nurture.family_care.revoke_grant` command. Only the exact active Grant `grantedByParticipantId` may prepare/submit while remaining a current exact-Family Guardian. Another Guardian, Institution, Caregiver, Operator, service identity, raw-id caller, or owner-ineligible actor cannot revoke.
- Chat, family board, and family workbench use one five-minute strong-authorization `submit_action` context bound to exact actor/role/process/Enrollment/current CareGroup/Grant id+version/action/surface. Review states immediate authorization and old-work stop, retained audit, inability to recall already seen information, irreversibility, and the need for a fresh future authorization. Client input is opaque context plus explicit confirmation only.
- Pilot does not accept a client reason string. The transaction persists server-owned `revokeReason=user_revoked`, database `revokedAt`, and the resolved exact `revokedByParticipantId`; downstream fences use `grant_revoked`. User presentation does not expose internal reason codes or raw refs.
- One Serializable transaction performs exact replay; locks/reloads context/current owner facts/Grant/exact Thread and the dependent boundary; obtains database time; validates expected version; consumes context; writes `active -> revoked`, revoke audit fields, and version increment; invokes the same-transaction dependent fence; and persists Execution. C-2e-4d owns the exhaustive dependent set, loop-to-closure mechanics, and bounded cascade evidence, but partial or asynchronous cascade commit is forbidden.
- Exact replay returns the immutable original Execution. A new command from the still-eligible exact owner against the same already revoked Grant resolves `already_satisfied` and cannot rewrite `revokedAt`, actor, reason, or version. Replaced, expired, deleted, missing, or scope-mismatched Grant is not revoke success; owner ineligibility defers to C-2e-4c.
- Revoke/revoke and revoke/replace races use expected Grant version and first-commit-wins. A question/revoke race is serialized: a question committed first is fenced by the revoke transaction, while a revoke committed first blocks the question before business writes. Response loss uses exact replay and never repeats the transition or fence.
- Revoked Grant is irreversible and cannot be edited, replaced, reactivated, or reused. Revocation creates no permanent family-wide veto: any current exact-Family Guardian may later run the full first-Grant review/confirmation and own a new active future-only Grant. The new Grant and reused Thread cannot revive any object bound to the revoked `grantId`.
- Revoke Execution outputs exactly terminal Grant ref and exact Enrollment-private Thread ref, never an incomplete list of dependent refs. It stores `handoffRequestSnapshotsPayload=[]` and null driver and creates no Step/Handoff/Outbox/notification/deep link/Message/Receipt/Item/Attention/protected body. Existing downstream delivery is stopped by current owner reread plus the atomic local fence; an already displayed OS notification cannot be physically recalled and every open rechecks current authorization.

Pilot-0-C2e-4c Grant-owner loss refinement:

- Add nullable `grantedByRoleAssignmentId` as a Restrict FK from Grant to the exact Guardian RoleAssignment used at confirmation. The rollout is additive for legacy compatibility, but every new Grant and every Pilot-active non-deleted Grant must carry the field before activation. The role's participant must equal `grantedByParticipantId` and its Guardian scope must reach the exact Family/ChildCareProcess.
- Backfill may use only exact CommandExecution/audit evidence that identifies one compatible RoleAssignment and proves actor, participant, scope, and effective-time consistency. Missing, conflicting, or multiple candidates are quarantined by migration/activation preflight for manual reconciliation; current-role, created-time, label, or join-order heuristics cannot choose a row.
- Grant owner eligibility rechecks the exact stored role id, matching participant, `role=guardian`, exact scope reach, `status=active`, effective window, versioned current policy, and non-deletion. A later RoleAssignment for the same Participant is a different authority identity and can never revive the old Grant.
- My-Chat account disablement, workspace-membership loss, or Host owner-service unavailability denies the affected canonical user's Host ingress, presenter, action, and stale open. Nurture does not copy or mutate Host account/membership state, and Host loss alone does not terminalize RoleAssignment/Grant, transfer ownership, or create a family-wide revoke. Host restoration permits access only after full current Host and Nurture reread; it cannot reactivate a terminal Nurture row.
- Exact Nurture RoleAssignment `suspended` or otherwise temporarily ineffective blocks the Grant and every original-Grant read/action/delivery while leaving the Grant row nonterminal. C-2e-4c grants no actor suspension/resume authority. Only an independently authorized transition of the same exact role row back to active may restore eligibility after complete reread; a peer cannot bypass suspension with a new Grant.
- Exact role `revoked`, `expired`, `deleted`, or effective-end elapsed is terminal owner loss. The Grant and old work fail closed immediately from the authoritative predicate without waiting for a status rewrite. No current Guardian inherits or receives the owner identity.
- C-2b-4 self-exit commits exact RoleAssignment revoke, pending actor-issued invitation cancellation, actor-owned active Grant `revoked` with server reason `owner_self_exit`, complete dependent fence, and one CommandExecution atomically. The exiting actor is the Grant revoke actor; Grants owned by another current Guardian remain unchanged.
- A terminal exact role observed outside self-exit converges through an idempotent Nurture-local owner action using server reason `owner_role_ended`, database time, no inferred actor, complete same-transaction fence, and immutable Execution/audit evidence. Owner reads block before convergence; My-Chat Step/Handoff/Outbox or a cross-database transaction is not the safety boundary.
- When another current exact-Family Guardian exists, full first-Grant review/confirmation may recover from terminal owner loss. One Serializable transaction locks the context, terminal exact owner role, old Grant, new Guardian role, exact Thread, and dependent boundary; terminalizes/fences an unreconciled old active row if needed; creates an independent active future-only Grant bound to the new participant and role; reuses the Thread only as container; and persists Execution.
- Owner-loss recovery is neither replacement nor transfer: the new Grant has no `supersedesGrantId`, does not reuse old owner/audit/profile state, and cannot revive old Message/Receipt/Item/Attention. Confirmation outputs exactly the new active Grant and Thread refs; old terminalization is Nurture-local audit evidence. Temporary Host loss or exact-role suspension cannot enter this recovery path.
- Self-exit/action, role-end/action, reconciler/fresh-confirm, and Host restore/action races use exact role and Grant versions plus a deterministic role-before-Grant-before-Thread/dependent lock order. Exact replay is immutable; every presenter still owner-rereads current facts. Last-Guardian terminal recovery, forced removal, custody dispute, authority reassignment, and Host-driven deletion remain outside Pilot.
- Every owner-loss, reconciliation, and recovery Execution stores `handoffRequestSnapshotsPayload=[]` and null driver and creates no Step/Handoff/Outbox/notification/deep link/protected body. C-2e-4d owns the exhaustive dependent closure and bounded evidence.

Pilot-0-C2e-4d dependent cascade closure refinement:

- Irreversible cascade applies only to permanent Grant revoke/replacement/expiry/terminal-owner-loss and exact Guardian-source or Caregiver-reply redaction. Host account/workspace loss, exact-role suspension, owner-service outage, and temporary policy/Institution/CareGroup unavailability remain current fail-closed predicates and cannot write permanent suppression. C-2f classifies Enrollment/topology terminality before invoking the kernel.
- Add typed `NurtureInteractionContextDependency` rows for every Grant/Message/Item/Receipt ref used by protected `submit_action`, `open_notification`, or clarification candidates. JSON `statePayload` is not dependency authority. A protected context without complete dependency rows fails activation/preflight and cannot execute.
- Permanent Grant invalidation revokes every active Grant-dependent context and replaces executable state with a non-body tombstone; terminalizes linked Receipts; suppresses actionable Items plus active clarification; scrubs body-derived Item/Attention/Thread projections; and retains protected Message, CommandExecution, authorship, times, and body-free audit under current author/receiver policy.
- Receipt transitions are exact: `pending -> blocked(reason)` and clear pending/driver/retry controls; `delivered|read|acknowledged -> revoked_after_delivery(reason)` while retaining occurred-at times; existing `failed|blocked|revoked_after_delivery` stays terminal. Retry descendants are included through their direct Grant dependency and no delivery retry remains schedulable.
- Item `open|acknowledged|waiting_for_family|replied|followed_up -> suppressed`. Active clarification receives exactly one `clarification_cancelled` before one suppression event; active clarification ids/times/driver refs and executable assignment state clear. Summary becomes a generic tombstone, detail and body-derived/safety projection payloads clear, and old Grant/Message/event refs remain audit-only.
- Every Attention sourced from an affected Item loses title/summary-derived content. `active -> suppressed`; resolved/expired/suppressed status remains terminal while projection content is scrubbed and versioned. Thread stays available for the Enrollment, but `summaryPayload` is cleared or owner-recomputed without invalid content; `latestMessageAt` may remain chronological audit.
- Guardian-source redaction clears source body/attachment/protection, terminalizes source Receipt, revokes contexts bound to that source Message, suppresses dependent Item/active Attention, and scrubs Thread projection. An independently authored Caregiver reply is not redacted, but source presentation is a tombstone. Caregiver-reply redaction clears only reply body/Receipt/context/projection; source question/Receipt and replied Item/resolved Attention are neither suppressed nor reopened, and no second reply becomes available.
- The kernel locks Grant before Message and every root before dependents, validates root/version/cause, pre-counts against a versioned Pilot hard cap, and processes deterministic primary-key keyset batches inside one Serializable transaction. `SKIP LOCKED`, intermediate commit, async repair, and root-first-then-eventual-dependent commit are forbidden. Every dependent writer locks/revalidates the root so no post-count insert can escape.
- After every batch, root-specific `NOT EXISTS` checks prove no eligible context, Receipt, Item, clarification, Attention projection, or Thread projection remains. The transaction then writes one bounded `NurtureLifecycleCascadeAudit` and the owning Execution. Any row conflict, phantom, fault, cap overflow, or failed postcondition rolls back before root mutation; Pilot overflow enters manual reconciliation and never commits a prefix.
- `NurtureLifecycleCascadeAudit` is evidence, not authorization. It stores root type/id/version, cause, cascade schema version, per-type transition counts, canonical closure hash, completed database time, and CommandExecution ref under a unique root/version/cause identity. It stores no bodies, tokens, dependent-ref list, account/device targets, or Host technical state and is not added to prior exact business output refs.
- Invalidation Commands remain explicit-empty and never create a new Handoff/Outbox/Notification. Existing immutable replay seeds are retained and may materialize refs-only Host work only under original same-Step rules; every materializer consumer, provider send/retry, notification open, and presenter owner-rereads Nurture and returns stopped/skipped/tombstone. Technical Admin may inspect bounded cascade evidence and request owner reconciliation but cannot edit lifecycle or mark closure.
- C-2e is complete only when zero/one/exact-cap/over-cap, more-than-100, concurrent insert/action, every fault point, replay, both redaction branches, author/receiver body visibility, stale delivery/open, audit privacy, and no-output-expansion evidence pass. Current prefix-limited implementation is not compliant.

Pilot-0-C2f-0 Enrollment lifecycle and actor-boundary refinement:

- C-2f is split into C-2f-0 lifecycle/actor classification, C-2f-1 pause/resume, C-2f-2 same-Institution CareGroup transfer, C-2f-3 permanent withdrawal/end/re-entry, C-2f-4 next-stage/cross-Institution/cross-workspace boundary, and C-2f-5 result/recovery/presenter/Handoff semantics. Later checkpoints cannot weaken the C-2f-0 invariants.
- `active` and `paused` are current, uniqueness-conflicting Enrollment states. `pending` remains conflict-bearing for legacy/fail-closed reads but is not created by Pilot confirmation. `ended` and `withdrawn` are terminal and never reactivate. `deleted` is not an executable Pilot transition, retention shortcut, uniqueness escape, or audit erasure.
- Current exact-Family Guardian is the only family-side actor class that may request a family restriction or permanent family withdrawal. Exact-scope active Institution Admin is the only institution-side actor class that may request an institution restriction, end institution service, or propose transfer to another CareGroup in the same Institution. Exact command authority, confirmation copy, version binding, and multi-Guardian rules remain C-2f-1 through C-2f-3.
- Caregiver, Lead Caregiver, Technical Operator, service identity, AI/natural-language inference, raw-id caller, My-Chat account/workspace membership, and ambient Host/workspace admin are never Enrollment topology authority. Technical Admin may inspect evidence and request owner reconciliation only.
- Pause is reversible current denial. Enrollment-dependent cross-role reads, actions, delivery, notification open, and new Grant use fail closed while the relevant restriction remains, but pause cannot terminalize the Enrollment, Grant, Thread, Message, Receipt, Item, or Attention and cannot invoke the C-2e permanent cascade.
- Family and institution restrictions must remain independently attributable. The aggregate may present `status=paused`, but that status alone cannot authorize resume; neither side may release the other side's restriction. C-2f-1 owns the additive hold representation, one-or-more active-hold semantics, exact release actor, database time/version, and pause/resume races.
- Guardian withdrawal, Institution end, and completed same-Institution transfer are permanent old-Enrollment outcomes. They must terminalize/fence every old active Grant and dependent work through the C-2e closure contract; C-2f-2 and C-2f-3 own the exact reason/status mapping and atomic transaction.
- Transfer cannot update `careGroupId`, reuse the old Enrollment identity, or move old RosterEntry, Grant, Thread, Message, Receipt, Item, Attention, InteractionContext, or Handoff authority into the target CareGroup. A completed transfer ends the old Enrollment and creates a new Enrollment identity; any new Grant and Thread follow the normal fresh authorization path.
- Independent current Enrollments at different Institutions remain separately scoped. Pause, withdraw, end, transfer, Grant closure, or policy change in one Institution cannot mutate or authorize another Institution's Enrollment or content.
- Same-workspace Child/ChildCareProcess/Family continuity remains family-owned and current-owner-resolved. Cross-workspace fuzzy/global matching, raw database linking, global child identity claims, and automatic profile, Enrollment, Grant, Thread, content, or audit migration are forbidden. C-2f-4 may define a future explicit protocol but cannot infer portability from My-Chat adult identity or institution roster data.
- C-2f-0 defines no persistence migration, action key, result vocabulary, Handoff, notification, or provider effect. C-2f-1 through C-2f-5 below now lock their planning mechanics; implementation and traffic remain separately gated.

Pilot-0-C2f-1 Enrollment pause/resume refinement:

- Additive `NurtureEnrollmentPauseHold` is the authoritative restriction record. Required fields are `id`, `workspaceId`, `enrollmentId`, `side`, `status`, fixed `reasonCode`, exact placing Participant/RoleAssignment/CommandExecution refs, database `placedAt`, version, and timestamps. Release fields are nullable exact releasing Participant/RoleAssignment/CommandExecution refs plus database `releasedAt`; terminal close fields are reserved for C-2f-2/C-2f-3.
- Hold `side` is `family|institution`; lifecycle is `active|released|closed`. `released` means a current same-side actor intentionally removed the reversible restriction. `closed` is reserved for an Enrollment terminal transaction and cannot be presented as resume. Released/closed rows never reactivate; another pause creates a new identity.
- A partial unique constraint allows at most one active hold per `(workspaceId, enrollmentId, side)`. Scope/FK checks bind every actor, role, Execution, and Enrollment to the same workspace. Release actor/time/Execution fields are all-null or all-present, and valid only for `released`; C-2f-2/C-2f-3 must define equivalent closed invariants before using `closed`.
- Pilot fixed reasons are `family_requested` and `institution_service_paused`, constrained to their matching side. The hold stores no free text, health/safety narrative, custody dispute, content, Host identity data, provider state, or automatic expiry. A hold remains active until authorized release or later terminal close.
- Active holds are authorization authority. Enrollment `status` remains an atomically maintained aggregate for existing indexes/presenters: nonterminal with no active hold is `active`; one or two active holds is `paused`. Every hold transition increments Enrollment version even if aggregate status stays paused. Any status/hold mismatch blocks reads/actions and enters owner reconciliation; no path trusts status alone or auto-repairs during a user command.
- Any current exact-Family Guardian may place or release the shared family hold. Any current active exact-Institution-scope Institution Admin may place or release the shared institution hold. Placing actor is immutable audit, not hold owner; another same-side eligible actor may release. Cross-side release, Caregiver/Lead/Operator/service/AI/Host action, and raw-id selection are forbidden. If no eligible same-side actor remains, the hold stays fail-closed rather than granting Technical Admin release authority.
- Guardian surfaces use `suspend_family_enrollment -> nurture.family_care.suspend_enrollment` and `resume_family_enrollment -> nurture.family_care.resume_enrollment`. Institution keeps the locked `suspend_enrollment -> nurture.institution.suspend_enrollment` and `resume_enrollment -> nurture.institution.resume_enrollment`; no `pause_institution_enrollment` alias exists. Institution resume releases only the institution hold and may leave aggregate status paused.
- Pause and resume both use five-minute `submit_action` contexts bound to exact actor/role/Enrollment/side/action/surface/expected Enrollment and hold versions/canonical consequence hash. Chat AI may render the generic confirmation but cannot execute from language. Copy identifies the side, immediate bidirectional cross-role fence, retained history, non-recall, continuing Grant expiry, other-side independence, and conditional recovery. Client returns no ids/status/side/reason/time/audit data.
- One Serializable transaction performs replay; locks context and exact actor role, then Enrollment, then active holds; reloads current Institution/CareGroup/policy/allowlist and relevant upper-scope fences; obtains database time; validates expected versions; creates or releases the same-side hold; recomputes status; increments Enrollment version; consumes context; and persists audit/Execution. No remote/Host call occurs inside the transaction.
- Exact replay returns the original effect. A fresh same-side pause while its hold is active or resume while no same-side hold exists is `already_satisfied` without time/version/audit rewrite. Two actions prepared at one Enrollment version serialize first-commit-wins; the stale loser conflicts and must refresh/reconfirm, including different-side pause/pause. After refresh both holds may coexist. Releasing one while the other remains keeps status paused.
- Pause/resume versus end/withdraw/transfer uses Enrollment-first locking; a terminal winner permanently rejects pause/resume. Grant/capture/ack/reply and every Enrollment-dependent writer lock/revalidate Enrollment and holds: a writer before pause may commit and is then fenced, while a writer after pause rejects. Enrollment version change makes all old submit contexts permanently stale; resume cannot revive them.
- Pause blocks current cross-role body reads, capture, acknowledge, reply, Grant create/replace, delivery/retry, notification open, and new protected effects. It does not mutate Grant, Thread, Message, Receipt, Item, Attention, context lifecycle, or immutable technical seed; does not run C-2e cascade; does not freeze/extend Grant expiry; and does not bulk replay on resume. Existing objects become eligible only after all holds clear and every current role/Grant/policy/time/source check passes.
- Institution/CareGroup `paused`, Host loss, owner outage, and capability/allowlist disable remain distinct upper-scope current fences. They do not create/fan out Enrollment holds, and their recovery cannot release an Enrollment hold. Exact result refs/presenter recovery/Handoff/notification behavior remains C-2f-5.

Pilot-0-C2f-2 same-Institution CareGroup transfer refinement:

- Add `NurtureEnrollmentTransferIntent` rather than reusing Institution Enrollment Invitation. It binds workspace/Institution, exact source Enrollment id+version, source/target CareGroups, proposing Institution Admin Participant/RoleAssignment, fixed `care_group_transfer`, seven-day database expiry, canonical hash, `pending|consumed|cancelled|declined`, aggregate version, actor/time/Execution audit, and final target Enrollment ref. Expiry is derived and never extends in place.
- One effective pending intent exists per source Enrollment. Exact same-target replay returns the original; a new target conflicts while pending. Any current exact-Institution Admin may propose/cancel, and any current exact-Family Guardian may confirm/decline. Confirm/decline and cancel/confirm are first-commit-wins. New proposal after cancel/decline/expiry uses a new identity; no old row reopens.
- Surface/action mapping is exact: Institution workbench-only `propose_enrollment_transfer -> nurture.institution.propose_enrollment_transfer` and `cancel_enrollment_transfer -> nurture.institution.cancel_enrollment_transfer`; Guardian Chat/board/workbench `confirm_enrollment_transfer -> nurture.family_care.confirm_enrollment_transfer` and `decline_enrollment_transfer -> nurture.family_care.decline_enrollment_transfer`. Institution board is read-only. Direct `transfer_enrollment`, `initiate_enrollment`, `close_enrollment`, Caregiver/Lead/Operator/service/AI/raw-id action, and initial invitation reuse are forbidden.
- Proposal and confirmation require the source Enrollment to be `active` with no family/institution active hold. They lock and bind source version; any pause/resume or other Enrollment-version change makes the intent stale and requires a new proposal. Transfer never releases, consumes, closes, copies, or moves a pause hold.
- Source and target Groups must be different and belong to the exact same Institution. Institution and target Group must be active; target Lead/policy/Pilot gates and configured capacity must be current at proposal and confirmation. Source Group may be active, paused, or archived for transfer-out, but must exist, remain undeleted, and exactly match source Enrollment. Cross-Institution movement is C-2f-4, never this command.
- Add nullable Restrict `NurtureEnrollment.rosterEntryId`, unique per Enrollment/RosterEntry, and require exact evidence for every new/Pilot-active Enrollment before transfer. Current absent `NurtureInstitutionRosterEntry` implementation must add the relation. Legacy rows without exact invitation/Execution evidence fail activation/transfer preflight; no name/group/time heuristic backfills.
- Confirmation creates the target RosterEntry only inside the cutover transaction, using current family-owner-resolved safe child label and transfer provenance. Institution age/birth/family prefill is not copied. Source RosterEntry remains bound to source Group/Enrollment and becomes noncurrent `transferred`; target entry becomes current and links the same ChildCareProcess/new Enrollment. Cancel/decline/expiry creates no target roster row.
- Add unique nullable Restrict `predecessorEnrollmentId` from new Enrollment to old Enrollment plus nullable `continuityKind=care_group_transfer|fresh_reentry`, with an all-null/all-present check. No old-row successor field is stored. C-2f-3c supersedes the unimplemented `supersedesEnrollmentId` proposal before schema work, so transfer and re-entry use one lineage SSOT. Transfer lineage requires same workspace/ChildCareProcess/Institution, different CareGroup, a current source, `care_group_transfer`, exactly one direct successor, and no cycle/cross-scope link. Broken or ambiguous topology blocks transfer; no auto-link.
- Old Enrollment uses existing `ended`, not a new transferred status. Add server-owned terminal reason and terminal CommandExecution ref: transfer writes `status=ended`, `leftAt=T`, `terminalReason=care_group_transfer`. New Enrollment writes `status=active`, `joinedAt=T`, `predecessorEnrollmentId=old.id`, `continuityKind=care_group_transfer`, target Group/roster, and no hold. One database transaction time provides no observable overlap or gap.
- Guardian confirmation uses a five-minute context bound to exact actor/role/Family/process/intent/source version/source+target Groups/action/surface/consequence hash. Review states immediate old-group end, permanent old Grant/work closure, retained non-recallable history, target safe-roster visibility, no old content transfer, no implicit target Grant/Thread, and irreversibility. Client cannot supply ids, topology, status, reason, time, Grant, roster, lineage, or audit.
- One Serializable transaction resolves replay; locks context and Guardian role/Family/process, then source Enrollment before TransferIntent, Groups, holds, source roster, ordered Grant/Thread/cascade roots; rechecks readiness/capacity/uniqueness/policy; preflights C-2e hard cap; obtains database `T`; ends old Enrollment; terminalizes every old effective Grant with server cause `enrollment_transferred`; completes all C-2e dependents; archives old Thread/source roster; creates target roster/new Enrollment; consumes intent; and persists lineage/audit/Execution. C-2f-3b supersedes the earlier Intent-first prose and makes Enrollment the common topology root. No Host/remote call occurs inside.
- Grant closure from topology is server lifecycle invalidation, not peer voluntary revoke. The confirming Guardian need not own the old Grant and cannot acquire old owner rights. Any fault, stale row, duplicate successor, closure survivor, hard-cap overflow, or response before commit rolls back old/new Enrollment, grants/dependents, Thread/rosters, intent/context, lineage, audit, and Execution.
- Old Message/Receipt/Item/Attention/Thread/context/Handoff/notification/DailyCareLog/media/policy/Grant facts remain bound to old Enrollment/Group and follow current retention/body rules; none is copied or retargeted. Old Caregiver current reach ends. Target Caregiver receives only allowlisted roster visibility. A target Grant requires fresh review and its transaction creates a new target Enrollment Thread.
- Proposal/cancel/decline create no Enrollment/roster/Grant/Thread/protected work. Transfer result/presenter/recovery and proposal delivery/notification/Handoff remain C-2f-5; technical delivery can never be the business commit condition.

Pilot-0-C2f-3a permanent Enrollment action and authority refinement:

- Family withdrawal and Institution service end are separate terminal commands, not a generic lifecycle mutation. Guardian Chat/board/workbench use `withdraw_family_enrollment -> nurture.family_care.withdraw_enrollment`. Institution workbench retains `close_enrollment -> nurture.institution.close_enrollment`; Institution board remains read-only. `end_enrollment`, action aliases, and reuse of pause/resume/transfer/initial-enrollment commands are forbidden.
- Any current exact-Family Guardian may independently withdraw the shared Enrollment. Grant ownership, Enrollment Invitation receipt, join order, relationship label, a hidden `primary_guardian`, and unanimous/current Co-Guardian approval are not Enrollment authority. Another Guardian may be informed later under C-2f-5, but peer delivery/acknowledgment is never a commit condition.
- Any current exact-Institution-scope Institution Admin may independently end service. Guardian countersignature is not required. Caregiver, Lead, Technical Operator, service identity, Host/workspace admin, AI/natural-language inference, raw ids, and the opposite owner side cannot execute or impersonate either action.
- Server-owned mapping is exact: family withdrawal writes terminal `status=withdrawn` with `terminalReason=family_withdrawn`; Institution service end writes terminal `status=ended` with `terminalReason=institution_service_ended`; C-2f-2 transfer remains `status=ended` with `terminalReason=care_group_transfer`. Pilot accepts no free-text reason, sensitive dispute narrative, client status/time/actor, or custom audit field.
- Both actions require a five-minute strong-confirmation context bound to exact actor/RoleAssignment, Family or Institution scope, ChildCareProcess, Enrollment/current version, action, surface, and canonical consequence hash. Copy states immediate permanent relationship end, required old Grant/work closure, retained but non-recallable history, inability to retract already seen notification text, current-state stale opens, terminal non-resume, and fresh re-entry requirement. Natural language or navigation alone cannot confirm.
- Both `active` and `paused` are eligible terminal source classes. Active family/institution holds cannot veto or require cross-side release before a permanent exit. Terminal processing must move them to `closed` as server consequences, never `released` or actor-owned peer consent. C-2f-3b owns exact hold close fields, lock order, database time, Grant/Thread/dependent closure, faults, replay, and races.
- First terminal commit wins under Enrollment versioning. Another Guardian or Institution action prepared from the old version cannot create a second terminal effect or overwrite status/reason/actor. Exact replay and current terminal classification remain stable, but C-2f-3b owns their precise transaction/result representation.
- `ended|withdrawn` never resume or reactivate. C-2f-3c owns new RosterEntry/invitation/Enrollment identities, any explicit re-entry lineage, and retained-history rules. C-2f-5 owns exact output refs, presenter result, peer notification, deep link, Handoff, and delivery; none may determine terminal business commit.

Pilot-0-C2f-3b atomic terminal closure refinement:

- Add nullable terminal audit fields to Enrollment: closed server reason, exact terminal actor Participant and RoleAssignment Restrict FKs, unique owning CommandExecution Restrict FK, and existing database `leftAt`; terminal rows require a consistent all-present user-command audit and one aggregate-version increment. Transfer uses the confirming Guardian audit under the same shape. System-only future terminal paths must define a separate nullable-actor invariant rather than infer an actor.
- Extend `NurtureEnrollmentPauseHold(status=closed)` with `closedAt` and `closedByExecutionId`. Both are present only for `closed`; release actor/time/Execution remain null. Placement fields remain immutable. Every active family/institution hold closes at terminal database time under the Enrollment Execution, and no released/closed row reactivates.
- Topology-invalidated status-active Grants become `revoked` at database `T` with cause `enrollment_withdrawn`, `institution_service_ended`, or existing `enrollment_transferred`. `revokedByParticipantId` remains null even for Guardian withdrawal because Enrollment authority is not Grant-owner authority. The Enrollment Execution owns each bounded C-2e CascadeAudit. A status-active Grant whose half-open expiry already elapsed at `T` converges to `expired` and its expiry cascade instead of receiving a false topology revoke cause. All previously terminal Grants remain immutable.
- Extend TransferIntent lifecycle with system-only `invalidated`. Terminal Enrollment closure moves every exact-source pending intent to `invalidated`, records database time, `source_enrollment_terminal`, and owning Execution, and creates no cancel/decline actor fiction. Consumed/cancelled/declined/expired/invalidated intents remain unchanged and never reopen.
- Extend typed `NurtureInteractionContextDependency` with exact Enrollment Restrict dependency. Every topology submit/clarification context must carry it at creation; activation preflight rejects JSON-only Enrollment refs. The terminal command consumes its own context and revokes every other active context depending on the Enrollment, including pause/resume/transfer/Grant/work continuations.
- The exact linked RosterEntry becomes noncurrent history matching the terminal class (`withdrawn` or `ended`) without delete, unlink, profile copy, or child-identity rewrite. Transfer keeps its separate `transferred` history. The exact Enrollment Thread becomes `closed`, clears executable/body-derived summary projections, and preserves Message/authorship/chronology/audit facts. Missing, duplicate, mismatched, or cross-scope Pilot roster/Thread evidence is an integrity defect, never a guessed repair.
- Global local lock order is CommandExecution replay lookup; command context and current actor RoleAssignment; Enrollment; Institution/CareGroup scope; holds; pending TransferIntents; exact roster; every status-active Grant in primary-key order; exact Thread; then C-2e roots/dependents. Enrollment is the common topology root for pause/resume/propose/cancel/confirm/decline/withdraw/end and every Enrollment-dependent business writer. This order supersedes C-2f-2 Intent-first wording and prevents transfer/end deadlock.
- One Serializable transaction obtains database `T`, classifies all status-active Grants/roots, and preflights one aggregate versioned hard cap before any root mutation. It then consumes context; writes Enrollment terminal audit/status/time/version; closes holds; invalidates pending transfer intents; terminalizes every status-active Grant and completes every C-2e dependent cascade; closes Thread/roster; writes bounded audits and CommandExecution; and performs final root-specific zero-survivor assertions. No remote call, provider, My-Chat write, Handoff materialization, or async repair occurs inside.
- Final postconditions require terminal Enrollment audit consistency; zero active hold; zero pending TransferIntent; zero status-active Grant; zero executable Enrollment/Grant context, Receipt retry, actionable Item/clarification/Attention, or unsafe Thread projection; one noncurrent exact roster when Pilot evidence requires it; and no active Enrollment-private Thread. Any conflict, phantom, fault, hard-cap overflow, integrity defect, or survivor rolls back context and every business/audit mutation and triggers Pilot stop/manual reconciliation rather than prefix commit.
- Exact response-loss replay compares immutable Execution before consumed/expired context checks and returns one closure. A fresh currently entitled same-cause command may record `already_satisfied` against the terminal Enrollment without rewriting terminal actor/time/reason/version or claiming the later actor performed it. A different cause, terminal state, or target is current conflict, not success. Two Guardians, family versus Institution terminal action, pause/resume/transfer, Grant mutation, and every work writer are first-commit-wins under Enrollment/version/root locks; work committed first is included, while terminal commit first blocks later writes before their first business fact.
- Message, care log, media, authorship, retention, immutable execution/event, and body-free audit facts are not deleted or retargeted. Terminal owner reread immediately stops cross-role protected read/action/retry/open; same-side retained-history presentation remains C-2f-3c/C-2f-5. Guardian/Caregiver RoleAssignment, Institution/CareGroup lifecycle, other-Institution Enrollment, immutable Host seed, My-Chat Handoff/Outbox/Notification, and technical Admin state are not rewritten.
- C-2f-3b remains planning-only. C-2f-3c owns fresh re-entry identities/provenance/history. C-2f-5 owns exact CommandExecution output refs, presenter copy, peer notification, Handoff snapshot policy, delivery, and recovery; none can weaken or determine the local terminal commit.

Pilot-0-C2f-3c fresh re-entry and retained-history refinement:

- Fresh re-entry covers a return to the same Institution after terminal `family_withdrawn|institution_service_ended`. Cross-Institution, cross-workspace, and next-stage continuity remain C-2f-4. A target CareGroup may equal or differ from the historical Group but must be current, active, ready, staffed, policy-valid, capacity-valid, and Pilot-enabled.
- Institution workbench starts from one owner-resolved historical Enrollment and reuses `initiate_enrollment`; Institution board remains read-only. The flow requires a fresh unlinked RosterEntry and issues a fresh seven-day Enrollment Invitation. Guardian Chat, family board, and family workbench reuse `confirm_family_enrollment`; no `reactivate_enrollment`, `reopen_enrollment`, `reenroll`, raw-id, Caregiver, Lead, Operator, service, Host, or AI alias exists.
- Re-entry retains Child, ChildCareProcess, Family, Participant, and every independently current Guardian RoleAssignment. RosterEntry, Enrollment Invitation, submit context, CommandExecution, Enrollment, later Grant, and later Thread use new identities. The old RosterEntry, invitation, Enrollment, Execution, Grant, Thread, Message, Receipt, Item, Attention, context, notification, Handoff, and audit identities never reopen or migrate.
- `NurtureEnrollment.continuityKind` and unique Restrict `predecessorEnrollmentId` are the only Enrollment lineage source. Initial Enrollment stores both null. Transfer stores `care_group_transfer`; re-entry stores `fresh_reentry`. Every successor has one predecessor, every predecessor has at most one successor across both kinds, and no old-row mirror, second re-entry field, inferred latest row, cycle, branch, or cross-scope edge is allowed.
- Extend the Enrollment Invitation intent with nullable exact predecessor Enrollment/version and continuity kind, covered by canonical payload hash and all-null/all-present checks. A re-entry invitation binds `fresh_reentry`, the fresh RosterEntry, target Group, exact Host recipient, and terminal predecessor. At most one effective pending re-entry invitation exists per predecessor; correction or target change terminalizes/reissues under C-2c rather than overlapping or editing lineage.
- A valid predecessor is the unique same-workspace/ChildCareProcess/Institution terminal lineage leaf, has terminal reason `family_withdrawn|institution_service_ended`, has complete C-2f-3b zero-survivor closure, has no successor, and has no `pending|active|paused` same-Institution Enrollment. A transfer-ended source already has its transfer successor and cannot be selected. Deleted, missing, legacy-ambiguous, partially closed, guessed-by-time/name/contact, or cross-Institution evidence fails closed for manual reconciliation.
- The exact invited recipient must remain a current Guardian of the predecessor ChildCareProcess. Re-entry owner resolution returns only that exact longitudinal process for explicit confirmation; no alternate child or C-2b-1 new-profile branch is available. A recipient without current Guardian authority receives a safe unavailable result and must first follow the independently authorized Co-Guardian flow. Prior inviter, Enrollment confirmer, terminal actor, Grant owner, join order, and relationship label confer no special right.
- A generic first-enrollment invitation cannot bypass re-entry provenance. If owner resolution finds an eligible terminal same-Institution predecessor for the selected process but the invitation lacks the exact re-entry binding, confirmation returns current `state_not_actionable` without creating or consuming business facts; Institution must issue the exact re-entry-bound invitation.
- Re-entry confirmation uses exact replay lookup; locks context/current Guardian, predecessor Enrollment, Institution/target Group, invitation, fresh roster, and lineage uniqueness in deterministic order; rereads every predecessor/recipient/readiness/current-Enrollment condition; and obtains database `T`. One transaction consumes context, creates the active new Enrollment with `joinedAt=T > predecessor.leftAt`, writes `predecessorEnrollmentId` plus `fresh_reentry`, links the fresh roster, consumes the fresh invitation, and persists audit/Execution. The predecessor and every old dependent remain immutable; no Grant, Thread, protected work, remote call, Handoff, Outbox, notification, or deep link is created.
- Exact response-loss replay returns one new episode. Concurrent re-entry invitations, two Guardians, same/different target Groups, generic versus re-entry confirmation, and re-entry versus another successor use first-commit-wins through predecessor/successor uniqueness and expected versions. A losing invitation/context remains unconsumed or becomes current-conflicting as defined by its own lifecycle; no duplicate successor, partial roster link, or false `already_enrolled` success commits.
- Historical presenters keep old and new Enrollments as separate episodes. An entitled normal view may expose only safe child label, Institution, CareGroup, joined/left dates, terminal class, and historical/current classification; exact terminal Participant/RoleAssignment, raw ids, free-text reason, Grant/Thread existence, and protected refs remain absent. The terminal actor stays audit-only.
- Protected old history remains governed independently by current Family/role, original Grant, exact authorship, redaction, retention, and policy. Current Guardians may retain eligible family-side history; a current same-side Caregiver author may retain only allowed author-side history; old cross-role bodies remain unavailable/tombstoned. New Caregivers, new Grant, new Thread, route state, cached membership, stale notification, provider state, or Host recovery never expose or reactivate the old episode. No history copy, merge, notification backfill, delivery retry, or context replay occurs.
- C-2f-3c remains planning-only. C-2f-4 owns next-stage/cross-Institution/cross-workspace portability. C-2f-5 owns exact re-entry result refs/copy, historical route affordances, peer notification, deep link, Handoff snapshot policy, delivery, and recovery; none can determine the local re-entry commit or revive old authority.

Pilot-0-C2f-4-0 next-stage and cross-scope classification refinement:

- `NurtureChildCareProcess` is the longitudinal child-scope spine only within one workspace and only through current Family-owner resolution. A stage episode is a family-owned phase of that process. `NurtureEnrollment` remains one Institution-local relationship episode. Workspace is the hard privacy and local-identity boundary; none of these identities is global.
- Same-Institution active CareGroup movement remains C-2f-2 transfer, and return after terminal same-Institution closure remains C-2f-3c fresh re-entry. C-2f-4 does not widen `predecessorEnrollmentId` or `continuityKind` beyond same workspace/ChildCareProcess/Institution.
- Entry to a different Institution in the same workspace uses ordinary fresh RosterEntry, Enrollment Invitation, exact current-Guardian confirmation, CommandExecution, and Enrollment identities against the exact Child/ChildCareProcess selected through current Family ownership. It is not transfer, re-entry, or successor lineage.
- Current Enrollments at different Institutions may coexist. Confirmation at the new Institution cannot end, pause, withdraw, replace, or mutate an old Institution Enrollment. Leaving an old Institution is a separate C-2f-3 action with separate owner confirmation and transaction.
- The new Institution inherits no old Institution Grant, Thread, Message, Receipt, Item, Attention, context, roster, role, policy, notification, Handoff, audit visibility, or authority. Its current owner reads reveal only its own Enrollment and independently granted facts and cannot disclose that another Institution relationship exists.
- A next-stage change retains the exact Child and ChildCareProcess and cannot create, move, pause, end, withdraw, or reactivate an Enrollment. Institution observation, roster, age, birthday, and AI/model inference may at most support a future family-facing proposal; none is stage authority or an automatic transition.
- A journey that combines stage change and entry to another Institution is two independently authorized effects. Stage confirmation and new-Institution Enrollment may complete in either order under their own current rereads; neither is authorization, commit dependency, compensation, or rollback for the other, and no cross-domain/distributed transaction is introduced.
- Cross-workspace child/profile reuse, raw database linking, fuzzy or global match, and automatic Child/ChildCareProcess/Family/Enrollment/Grant/Thread/content/audit migration are Pilot `NO-GO`. The same My-Chat adult account, name, birth fact, contact, media, family relationship, or Institution roster cannot prove child identity across workspaces and must not disclose a possible match.
- Any future cross-workspace portability requires a separately versioned, explicitly consented export/import protocol with minimum allowlisted data, source owner reread, expiry/replay/audit/revocation rules, and new target-local Child/Process identities. That future protocol cannot carry authority or assert one global child identity and is not designed or implemented by Pilot-0-C2f-4-0.
- Existing `currentStageKey` remains an optional legacy/current projection and is not promoted to mutable historical authority by this checkpoint. C-2f-4-1 now locks the versioned stage fact, exact Guardian authority, transition/correction/history semantics, and projection derivation before schema or command implementation.
- C-2f-4-0 remains planning-only and adds no schema, action, handler, runtime, database, Handoff, notification, or traffic effect. C-2f-4-1/2/3 now lock stage lifecycle, remaining cross-Institution privacy/concurrency, and the future protocol boundary; C-2f-5 owns result/recovery/presenter/Handoff semantics.

Pilot-0-C2f-4-1 stage fact, authority, and lifecycle refinement:

- Additive `NurtureChildCareStageEpisode` is the sole canonical stage-history source. Required identity/scope fields are `id`, `workspaceId`, and `childCareProcessId`; catalog fields are positive `stageCatalogVersion`, stable coarse `stageKey`, and nullable allowlisted `detailStageKey`; lifecycle fields are `status=current|closed`, nullable unique Restrict `predecessorStageEpisodeId`, `transitionKind=initial|stage_changed|guardian_correction|set_after_clear`, database `startedAt`, nullable database `endedAt`, fixed nullable `terminalReason=stage_changed|guardian_corrected|guardian_cleared`, and aggregate version/timestamps.
- Every Episode stores the exact confirming Guardian `Participant`, current Guardian `RoleAssignment`, and owning `CommandExecution`. A closed row additionally binds `endedByExecutionId`; confirmation and close refs are Restrict and same-workspace. No Host account id, free text, medical claim, Institution actor, provider state, or technical queue state is stored.
- The stable coarse v1 vocabulary is `pregnancy|age_0_1|age_1_3|age_3_6|age_6_9|age_9_12|age_12_15|age_15_18`, matching the product design contract. Optional fine keys come from the same versioned allowlist and preserve at least pregnancy preparation/early/mid/late, postpartum-newborn transition, newborn, infant, toddler, preschool, school entry, primary school, early adolescence, middle school, and high school distinctions. No free-form, Institution-specific, classroom, or Enrollment-status stage key is accepted.
- Coarse/fine keys express a family-confirmed developmental context, not diagnosis, legal age proof, actual school attendance, or Institution membership. Fine-key/coarse-key compatibility is catalog-validated. Catalog revisions never reinterpret stored keys in place; a semantic change requires a new version and explicit current-Guardian confirmation.
- A partial unique constraint permits at most one `current` Episode per `(workspaceId, childCareProcessId)`. A nullable unique predecessor permits at most one direct successor; predecessor and successor must share workspace/process, form one acyclic linear chain, and use increasing database time. First set uses `initial` with null predecessor. After a cleared leaf, a later set uses `set_after_clear` and points to that leaf.
- Status/time/terminal checks are exact: current has null `endedAt|terminalReason|endedByExecutionId`; closed has all three present. A normal change closes the old current row with `stage_changed` and creates a `stage_changed` successor at the same database `T`. Guardian correction closes it with `guardian_corrected` and creates a `guardian_correction` successor at `T`. Clear closes it with `guardian_cleared` and creates no successor in that transaction. Closed rows never reopen.
- `NurtureChildCareProcess.currentStageKey` remains nullable but becomes a denormalized coarse-key projection only. It equals the sole current Episode `stageKey`, or null when no current Episode exists, and updates with the Episode transaction plus Process version. Authorization, history, and downstream provenance never trust the projection without the Episode. Any mismatch fails closed and enters owner reconciliation rather than command-time auto-repair.
- Migration/preflight cannot convert an existing non-null `currentStageKey`, profile snapshot, age/birthDate, pregnancy result, material, or Institution roster value into a confirmed Episode. A process without exact Guardian/Execution provenance stays quarantined for explicit current-Guardian reconfirmation; no time/name/key heuristic creates history. Existing null values remain valid unset state.
- Any current exact-Family Guardian may independently set, change, correct, or clear the shared stage. Grant ownership, invitation receipt, process creator, first/primary Guardian label, relationship label, or Co-Guardian unanimity adds no authority. Institution Admin, Caregiver, Lead, Technical Operator, service identity, Host admin, AI, age clock, birthDate, roster, Enrollment, and current projection are never write authority.
- Guardian Chat, family board, and family workbench use one exact `update_child_care_stage -> nurture.family_care.update_child_care_stage` mapping. There is no `advance_stage`, `auto_update_stage`, Institution-stage, pregnancy-handler, raw-id, or correction bypass alias. An unset process may remain unset; no default or inferred key is required.
- The command uses a five-minute `submit_action` context bound to exact actor/role/Family/ChildCareProcess, current Process and Episode ids/versions or explicit unset state, action/surface, operation `set|change|correct|clear`, target catalog/key pair when applicable, and canonical consequence hash. Review shows old/new or clear, preserves history, states no medical/Enrollment/Institution effect, and requires explicit confirmation. The client supplies no ids, versions, actor, time, transition class, lineage, audit, or free text.
- One Serializable transaction performs exact replay; locks context/current Guardian/Family/Process/current StageEpisode and predecessor uniqueness; rereads current family ownership and process lifecycle; validates catalog/expected versions; obtains database `T`; consumes context; closes the old row when required; creates at most one successor; updates projection and Process version; and persists audit/Execution. No Enrollment, Grant, Thread, artifact, remote call, Handoff, Outbox, notification, or deep link participates.
- Exact response-loss replay returns the original transition. A fresh command selecting the already current exact catalog/coarse/fine tuple is `already_satisfied` without new Episode/audit/version. Two Guardians or correction/change/clear races are first-commit-wins; the stale loser rereads and reconfirms. Pilot does not edit/backdate past Episode keys/start times, correct a noncurrent historical row, branch lineage, or synthesize elapsed stages. Historical correction beyond the current leaf remains future work.
- Existing context materials, plans, summaries, pregnancy guidance, and business artifacts retain their original stage snapshot/provenance and are not rewritten. New reasoning owner-rereads the current Episode and may mark older material stale under its own policy. `evaluate_pregnancy_stage` remains a deterministic non-medical guidance handler and cannot write or confirm StageEpisode.
- Stage confirmation creates no Enrollment, transfer, withdrawal, Grant, Thread, Institution visibility, Host seed, or delivery. C-2f-4-2 locks exact family/Institution views and multi-Institution concurrency; C-2f-4-3 now locks the future cross-workspace protocol boundary, and C-2f-5 owns exact result refs/copy, notification, Handoff, and recovery. C-2f-4-1 remains planning-only and adds no implemented schema/runtime/database/traffic effect.

Pilot-0-C2f-4-2 same-workspace multi-Institution visibility and concurrency refinement:

- The current exact-Family Guardian presenter may start from one owner-resolved ChildCareProcess and aggregate the family-owned current/historical StageEpisode timeline plus every current or historical Enrollment episode safe summary for that process. Safe summary fields are Guardian-confirmed child label, Institution, CareGroup, joined/left database times, current/historical classification, Enrollment status, and terminal class; raw ids, terminal actor, free text, Grant/Thread refs, protected refs, and internal audit stay absent.
- Family aggregation is navigation/presentation, not a new projection or authorization ledger. Each Message, Grant, Thread, Receipt, Item, daily-care/media fact, and historical body stays bound to its original Enrollment and current Family/role, original/current Grant, authorship, redaction, retention, and policy predicates. Aggregation cannot merge Threads, move content, create a cross-Institution Grant, or let one episode's authority open another.
- Institution Admin and Caregiver queries begin from the current exact Institution/CareGroup RoleAssignment and enforce `workspaceId + institutionId` plus authorized CareGroup scope in repository predicates before rows return. Loading all Enrollments by ChildCareProcess and filtering in controller/service/presenter memory is forbidden. Raw process ids, guessed scope, cached role, and ambient workspace membership cannot broaden the query.
- Exact Institution Admin may see its Institution's safe current/historical Enrollment and roster summaries plus separately allowed Grant coverage metadata. Caregiver/Lead sees only the current role's CareGroups, safe roster, and independently Grant-authorized work. Technical Operator sees bounded refs-only technical evidence and cannot obtain stage, protected bodies, or a cross-Institution relationship graph.
- Other-Institution existence is protected. Institution-local output, count, pagination total, sort key, conflict, duplicate classification, empty state, unavailable reason, route/deep-link token, stable Child/ChildCareProcess identity, audit relation, and timing must be noninterfering with whether another Institution Enrollment exists. Institution-scoped Nurture scenario tokens are opaque and cannot be compared or reused across Institutions.
- Enrollment confirmation and roster membership grant no StageEpisode, `currentStageKey`, coarse/fine key, or stage-history visibility. Pilot adds no `child_development_stage` or equivalent dataClass. Any future Institution stage use requires a separate explicitly reviewed system dataClass/Grant decision and cannot be inferred from the current family-care question Grant.
- Current Enrollment uniqueness remains exactly per `(workspaceId, childCareProcessId, institutionId)` across current-conflicting statuses. No global per-process current-Enrollment uniqueness is added. Different Institutions may confirm, pause, resume, transfer within themselves, withdraw/end, or change Grant/policy independently; one Institution transaction cannot lock as a business root, mutate, invalidate, authorize, or disclose another Institution Enrollment.
- Shared ChildCareProcess locking may serialize independent transactions briefly for current identity/family/process-lifecycle reread but cannot manufacture a cross-Institution business conflict. Enrollment commands bind exact family ownership, process lifecycle, invitation/roster, target Institution/CareGroup, Enrollment, and other consequence-relevant versions; an unrelated StageEpisode or `currentStageKey` projection version change cannot alter or invalidate an Enrollment effect. A real shared Family-owner or Process active/paused/archived/deleted change remains a legitimate fail-closed dependency for every Institution.
- Stage update plus Institution Enrollment may commit in either order. Institution onboarding neither snapshots nor displays stage, and stage commit changes no Enrollment. Institution A lifecycle/Grant/policy races with Institution B are independent; same-Institution topology commands retain their existing Enrollment-first order. Cross-Institution distributed locks, compensation, combined Execution, and all-or-nothing cutover are forbidden.
- Every family and Institution list/detail/action/deep-link open owner-rereads current role, scope, process lifecycle, exact Enrollment, Grant/policy, and source lifecycle. Cached roster/process/stage/other-Institution data is never authority. A stale or failed family aggregate segment renders generic unavailable for that episode without cached substitution, existence/reason leakage, or preventing independently current episodes from rendering.
- Cross-scope target ids, another Institution's opaque token, and changed/removed role return a generic unavailable/permission-safe outcome before lifecycle classification. Error codes, metrics, logs, and pagination cannot reveal another Institution's child match, Enrollment, stage, Group, Grant, or content. Technical reconciliation remains owner action and cannot edit business visibility.
- C-2f-4-2 remains planning-only and adds no schema, cross-Institution projection, dataClass, action, handler, route, database, Handoff, notification, or traffic effect. C-2f-4-3 now locks the future cross-workspace protocol boundary; C-2f-5 owns exact result/recovery/presenter route/Handoff/delivery semantics.

Pilot-0-C2f-4-3 future cross-workspace protocol boundary refinement:

- Pilot keeps all cross-workspace lookup, candidate search, fuzzy/global match, identity reuse, raw linking, profile import, portability token, and protocol route disabled. C-2f-4-3 defines a future-version boundary only and does not make portability executable.
- A future v1 is a copy-and-reconfirm protocol, not Child identity migration, workspace merge, identity federation, custody transfer, or proof that two records represent one global child. V1 is restricted to the same My-Chat adult authenticated in source and target workspaces. My-Chat proves the same canonical adult through trusted authentication and opaque Host bindings; Nurture must not persist a raw My-Chat account identity or infer sameness from names, contacts, birth facts, media, roster, or client assertions. Cross-adult transfer remains a separate future Co-Guardian/data-sharing protocol.
- Any current exact-source-Family Guardian may independently issue or revoke a pending export. First/primary Guardian, process creator, relationship label, invitation history, Grant owner, or Co-Guardian unanimity grants no extra authority. Institution Admin, Caregiver/Lead, Technical Operator, service identity, Host admin, AI, and raw-id callers cannot issue, approve, redirect, or consume portability.
- Target completion requires reauthentication of the bound same adult, current target-workspace eligibility, a five-minute strong-confirmation context, and explicit acknowledgement that a new local child profile will be created. One target-local transaction creates fresh `NurtureChild`, `NurtureChildCareProcess`, `NurtureFamily`, first active Guardian `RoleAssignment`, and target `CommandExecution`; source Child/Process/Family/RoleAssignment ids and authority never cross the boundary. Target relationship metadata is separately confirmed local input, not an exported source fact.
- V1 always creates a fresh target-local aggregate. The protocol cannot search for, rank, suggest, select, attach to, overwrite, reconcile, deduplicate, or merge an existing target Child/Process/Family. The confirmation copy states that users who already created the same child's target profile must stop; any later target-local reconciliation is a separately authorized protocol and Technical Operator cannot perform it.
- The complete v1 business-data allowlist is Guardian-confirmed `NurtureChild.displayName` plus optional `birthDate`. `displayName` is required for the fresh target profile. `birthDate` is excluded by default and requires explicit source field selection plus exact target review/confirmation. The versioned immutable export snapshot binds selected field names, values, the source Child aggregate version, and canonical payload hash; a current source value change, aggregate-version drift, or redaction before consumption makes the snapshot stale rather than silently exporting the old value.
- `profileBasicsPayload`, `careContextSummary`, `careContextPayload`, StageEpisode, `currentStageKey`, stage history, relationship labels, Guardian/Participant/account/contact data, Institution/CareGroup/Roster/Enrollment, predecessor lineage, Grant/Thread/Message/Receipt/Item/Attention, care log, media, pregnancy/health/material facts, notification/Handoff, audit bodies, raw ids, and technical state are forbidden payload. Target stage remains unset until a target-local Guardian independently confirms the target-local stage under C-2f-4-1.
- A future export Intent has immutable protocol version, source workspace/Family/Child/Process/issuing Guardian bindings, exact target workspace and opaque same-adult Host recipient binding, selected-field allowlist/hash plus source Child aggregate version, `issuedAt`, `expiresAt=issuedAt + 7×24 hours`, lifecycle/audit, and bounded protocol-scoped correlation. Persisted lifecycle is `pending|consumed|revoked|superseded`; `expired` is derived at database time. Expiry never extends in place, and any target/recipient/field/value/source-aggregate-version/expiry change supersedes the prior pending Intent and creates a new identity.
- Raw portability token is never persisted or logged. The opaque single-use token is target-workspace, exact-recipient, protocol-version, purpose, and expiry bound; it cannot be compared across workspaces, forwarded as bearer authority, or reused for another target. Target business records expose no source raw ids or stable global child key. Any protocol correlation remains bounded to the Nurture-owned portability ledger and unavailable to ordinary business presenters, Institution actors, and Technical Operator relationship queries.
- Issue owner-rereads source Host/Nurture identity, current Guardian RoleAssignment, exact Family/Child/Process lifecycle, selected values and Child aggregate version, policy, and target binding. Open and final confirmation additionally reread those source facts against the snapshot, pending/not-expired/not-revoked state, same-adult Host attestation, target workspace eligibility, target context/bindings, and current policy. Source actor loss, no remaining current source authority, source deletion/disable/redaction, selected-value or aggregate-version drift, recipient/target mismatch, expiry, or policy denial fails closed before target creation.
- Any current exact-source-Family Guardian may revoke one pending Intent. Revoke versus consumption has one authoritative Nurture-owned linearization point; the first committed decision wins. A revoke, expiry, source redaction, or policy denial before consumption creates no target facts. A later attempt returns generic unavailable without revealing which gate failed.
- Future consumption must be idempotent across response loss and partial technical failure. One protocol consumption identity may create at most one target aggregate; exact replay recovers the same target result, while changed target/payload/recipient conflicts. A Nurture-owned portability ledger—not My-Chat Workflow Step, Handoff Ledger, Outbox, notification, or provider receipt—owns the business snapshot, single-use decision, target result correlation, and reconciliation evidence.
- After target commit, the copied facts are target-local Guardian-owned facts with independent lifecycle. Source revoke, redaction, role loss, workspace closure, or deletion cannot distributed-delete, mutate, or make the target aggregate unavailable. Target Guardian separately manages correction/deletion under target policy. Both confirmation surfaces must clearly disclose the no-recall boundary before commit.
- My-Chat owns raw adult account/session authentication, source/target workspace access, opaque exact-recipient binding, and refs-only transport. Nurture owns source business authorization, minimum snapshot, lifecycle, consume/replay decision, target business creation, and safe audit. My-Chat cannot interpret or store portability bodies, choose fields, assert child identity, or force consumption; existing Workflow Handoff/Outbox cannot be the payload or commit authority.
- C-2f-4-3 remains planning-only. It adds no schema model, dataClass, action key, handler, route, protocol token, Host capability, Handoff declaration, runtime, database, notification, or traffic effect. C-2f-5 owns exact current-Pilot result/recovery/presenter/Handoff/delivery semantics and does not activate this future protocol.

Pilot-0-C2f-5 lifecycle result, recovery, presenter, and Host-effect refinement:

- `NurtureCommandExecution.businessOutcome` is the immutable persisted business classification and is exactly `applied|already_satisfied`. Response-only `disposition=executed|replayed` reports whether this invocation committed or recovered the Execution. Current owner presenters independently return `changed|already_current|processed_but_unavailable`; the last class means the historical effect may be proven but the current actor can no longer see the business object. A replay or later duplicate cannot claim that its caller performed, owned, approved, or jointly consented to the original effect.
- Every command uses a versioned exact `outputRefs` codec. Refs are immutable server-side recovery evidence, not presentation authority or client navigation. They never enter a client response payload, URL, route state, Host Chat transcript, Notification, Workflow Handoff, analytics event, metric/tag/query dimension, or search/filter parameter. No `open_result` token or equivalent ref-to-result locator exists.
- Exact output refs are fixed as follows:

| Command outcome | Exact versioned `outputRefs` |
| --- | --- |
| Pause applied | Enrollment plus new active Hold. |
| Resume applied | Enrollment plus released Hold. |
| Duplicate pause | Enrollment plus existing active Hold. |
| Duplicate resume with no referencable Hold | Enrollment only. |
| Transfer propose/cancel/decline | Source Enrollment plus TransferIntent. |
| Transfer confirm | Consumed TransferIntent, source and target Enrollments, and source and target RosterEntries. |
| Family withdrawal / Institution service end | Terminal Enrollment plus exact historical RosterEntry. |
| Fresh re-entry confirmation | New Enrollment, new RosterEntry, and consumed Enrollment Invitation, reusing C-2d-4. |
| Stage set/change/correct | ChildCareProcess plus resulting current StageEpisode. |
| Stage clear | ChildCareProcess plus closed StageEpisode. |
| Stage already unset | ChildCareProcess only. |
| Cross-workspace portability | No current Pilot command or result. |

- `outputRefs` cannot fan out Grant, Thread, Hold lists, Message, Receipt, Item, Attention, cascade-dependent refs, or LifecycleCascadeAudit. Consequence evidence remains reachable only from the owning Execution/audit under technical authorization.
- Four owner presenters are canonical. `enrollment_lifecycle_current` renders pause/resume/withdraw/end current state and safe episode history; `enrollment_transfer_current` renders proposal/review/cancel/decline/completed state; `enrollment_confirmed` renders initial and fresh re-entry confirmation under C-2d-4; `child_care_stage_current` renders current stage and family-authorized history. Chat renders a generic action-result card, Family board current/recent facts, Family workbench complete authorized history and complex actions, Institution board read-only current aggregates, Institution workbench Institution-topology commands/history, Notification generic safe copy only, and Technical Admin refs/counts/status evidence only.
- Cross-surface continuation carries only `route_class` and `view_mode=current|recent|history`. It carries no business id, output ref, raw filter, prior action state, context body, or cached result. Every destination authenticates and owner-rereads current state.
- Stable `commandRequestId` lookup occurs before a consumed/expired-context rejection. Compatible replay validates immutable Execution identity, canonical input hash, caller binding, and original durable-Step provenance, returns the original `businessOutcome` and `outputRefs` with `disposition=replayed`, then invokes the current owner presenter. Wrong input/caller/Step conflicts. Same-Step reclaim may finish once. If the caller lost the command id, the only recovery is the ordinary current presenter; it cannot create a probe command, infer the old outcome, or mint an `open_result` token.
- A deterministic denial before business commit writes no Execution. A retryable local transaction/owner outage may retry only while the original five-minute context remains valid. Presenter/network/worker/Step/Handoff/Outbox/provider failure after the Nurture transaction commits cannot compensate, delete, reopen, rewrite, or hide the business fact. Response-loss recovery completes the original Step; wrong-Step replay remains denied.
- Existing manifest `handoff_key=user_attention`, purpose `user_attention`, and sources `family_care_message|child_link_receipt|family_care_item` remain exact and unchanged. Enrollment lifecycle cannot widen, reinterpret, or reuse that contract.
- A separately versioned future additive planning contract may declare `handoff_key=guardian_relationship_attention`, purposes `review_enrollment_transfer|enrollment_relationship_changed`, and source context types `enrollment|enrollment_transfer_intent|guardian_role_assignment`. It is not part of the current manifest or capability and cannot be advertised before its Base/My-Chat/Nurture additive implementation and conformance review.
- The exact future Host-effect matrix is:

| Business effect | `handoffRequestSnapshotsPayload` policy |
| --- | --- |
| Family/Institution pause or resume | `[]`. |
| Transfer proposal | One stable draft per current exact-Family Guardian RoleAssignment for `review_enrollment_transfer`. |
| Transfer cancel, decline, or confirm | `[]`; any prior proposal open renders current state. |
| Family withdrawal | One stable draft for each other current exact-Family Guardian RoleAssignment, excluding the actor. |
| Institution service end | One stable draft for every current exact-Family Guardian RoleAssignment. |
| Initial or fresh re-entry invitation | Existing Host Enrollment Invitation path, not this Handoff. |
| Fresh re-entry confirmation | `[]`, preserving C-2d-4. |
| Stage set/change/correct/clear | `[]`, preserving C-2f-4-1. |
| Cross-workspace portability | No current command or Handoff. |

- Recipients are exact RoleAssignments resolved and snapshotted in the business commit. Later-added Guardians never receive an old notification; a target that loses current role is stopped by owner reread. No eligible target produces explicit `[]`. One versioned stable request/draft key exists per target RoleAssignment, and exact replay returns the same snapshots. Transfer-review Handoff expiry cannot outlive its TransferIntent. Relationship-termination attention uses a fixed seven-day expiry capped by the Pilot allowlist expiry.
- Any command path capable of a non-empty snapshot is Host-first: the original My-Chat Step must be durably persisted and currently claimed before the first Nurture commit. Missing trusted original-Step provenance fails before the business commit; Nurture cannot invent a replay seed afterward. Same-Step replay preserves exact snapshots; wrong-Step, recipient/source/expiry mutation, Admin-created drafts, and raw claim-token persistence/logging are forbidden. My-Chat later atomically materializes Handoff/Outbox; a materialization or provider failure cannot roll back Nurture facts.
- Provider payload is limited to generic durable copy such as `有一项托育关系更新待查看` plus My-Chat `notification_id`; it contains no child/Institution name, body, target, action state, business ref, or Nurture context. An open first validates exact My-Chat user/workspace/Notification before any Nurture call, then eligible Handoff state, current Nurture owner resolver, a destination-bound `open_notification` token, and destination owner reread. Wrong user/workspace/id returns generic unavailable without a Nurture call. Host read/unread and provider delivery remain technical state, not Nurture lifecycle.
- C-2f-5 completes C-2f planning only. The four presenter names and additive Handoff key/purposes/source types are design contracts, not implemented declarations. No manifest, registry, contract package, source, Prisma schema, migration, route, capability, database, environment, provider, or traffic changes in this checkpoint. C-3 owns Guardian/Caregiver operational IIB implementation readiness and C-4 owns Institution IIB/closure evidence.

Pilot-0-C3-0a Account–Subject reachability refinement:

- My-Chat's user-facing business scenario catalog converges on education/nurture, but platform services such as Chat, Workflow, Notification, Forum/Knowledge, and Technical Admin remain reusable and subject-neutral. This is a product-scope constraint, not a requirement that every infrastructure record acquire a child reference.
- Shared reusable contracts use `subject`; Nurture maps a `single_subject` context to one exact owner-resolved `NurtureChildCareProcess`. Product copy may say child, but Base/My-Chat cannot import, persist, or reinterpret Nurture Child/Process identity. This decision creates no global child table or rename/migration of the current Nurture model.
- Every activated business presenter/action starts from an authenticated My-Chat account/workspace, resolves the unique Nurture Participant, then proves a current relationship path to a subject context. A client raw subject, Participant, RoleAssignment, Family, ChildCareProcess, CareGroup, Enrollment, or Institution id is never a relationship proof.
- Guardian reachability is current Participant -> exact Guardian RoleAssignment -> exact Family -> ChildCareProcess. Caregiver reachability is current Participant -> Caregiver/Lead RoleAssignment -> exact CareGroup -> current eligible Enrollment -> ChildCareProcess collection. Institution Admin reachability is current Participant -> Institution Admin RoleAssignment -> exact Institution -> scoped CareGroups/current eligible Enrollments -> collection. Technical Operator has no subject context and cannot call the business provider.
- Subject scope is a closed planning vocabulary: `unresolved|single_subject|subject_collection`. `unresolved` permits only owner-returned safe candidates/clarification and no target action; `single_subject` binds one exact owner-resolved process; `subject_collection` is a current role-scoped query result and grants no batch write, shared Grant, or cross-subject authority.
- A prospective invitation is not an established Account–Subject relationship. It exposes only the invitation's existing minimum allowlist and can create/select/bind a subject only through the separately locked onboarding transaction. Invitation acceptance, roster prefill, same adult, name, birth fact, or contact cannot grant broad subject discovery.
- Each future activated education/nurture scenario must expose a versioned owner provider for listing reachable subject contexts and resolving/rechecking an opaque context. Exact field, manifest, and method names remain C-3-0c/Base design. The provider response may include only workspace/scenario-bound opaque context, scope kind, display-safe owner copy, route class, and freshness/version evidence; it contains no raw domain id, protected profile, relationship authority, or cross-scenario correlation key.
- Pilot uses live provider resolution. My-Chat creates no canonical Subject or account-subject authorization table. A future refs-only `SubjectAccessIndex` may be considered only as owner-event-fed discovery/navigation projection with current owner reread, revoke convergence, privacy review, and no authorization use; C-3-0a does not design or implement that projection.
- Every render, selection, detail, history, action preparation, submit, result, Notification open, and retry rereads the exact relationship path plus subject/scope lifecycle and policy. A cached Host entry cannot fill an owner outage or current denial. Lost/suspended/expired/deleted role, Family/Process/CareGroup/Enrollment drift, policy denial, or mismatched opaque context fails closed without subject/existence leakage.
- Subject context is not a My-Chat user, child login, custody claim, global identity, workspace bridge, cross-scenario link, portability token, or authority transfer. Cross-workspace/cross-scenario same-child inference and merging remain forbidden; any later link protocol is separately versioned and consented.
- C-3-0a is planning-only. It adds no schema, relationship table, Host projection, contract package, manifest field, provider, route, handler, UI, runtime, database, capability, environment, or traffic effect. C-3-0b owns authenticated ingress/trusted principal; C-3-0c owns exact presentation/provider wire contracts.

Pilot-0-C3-0b-0 trusted-principal refinement:

- My-Chat is the sole public business ingress. A private Nurture invocation requires both an authenticated allowed My-Chat workload and a Host-established adult principal; service identity proves transport only and can never populate a Nurture business actor, Participant, role, or Subject.
- The adult-principal semantic allowlist is contract version, opaque account ref, human actor ref, one exact My-Chat-validated workspace ref, registered scenario/surface provenance, request/correlation evidence, and interactive-session or durable-Run-actor origin. Exact type/field names remain C-3-0b-2. Account ref selects the Participant lookup; actor ref is Host provenance only and cannot choose or create a Participant.
- Participant, RoleAssignment, role kind, Subject/scope membership, Family, ChildCareProcess, Institution, CareGroup, Enrollment, Grant, policy decision, target availability, and command authority are owner-derived Nurture facts and are forbidden from the trusted Host principal.
- A client may select a workspace, invoke an action key, and echo an owner-issued opaque target/token, expected version, confirmation, form input, or idempotency value only as validated untrusted input. My-Chat must establish the exact workspace and server route/surface before the call; Nurture cannot infer workspace from Participant history, cached subjects, notification, conversation, or token.
- Exact Host Invitation authentication/acceptance establishes any required membership before ordinary subject-aware ingress. Invitation intent or acceptance remains prospective and does not create Participant role or Subject authority. C-0 bootstrap stays an exact provisioning exception, and Technical Operator remains outside business subject ingress.
- Workflow replay later resolves the durable Run actor back to the current canonical user and active workspace membership and carries its separate claimed-Step driver. Worker/service identity is not the business actor. Notification open remains an authenticated recipient path rather than provider/deep-link authority; C-3-0b-3 owns exact variants.
- Bearer/session credentials, service credentials, claim tokens, scenario tokens, raw invitation secrets, and provider credentials cannot enter Nurture facts, CommandExecution payloads, logs, analytics, traces, metrics dimensions, Handoff/Outbox, or Host business projections.
- Current optional `actor_id` workflow types and workspace-optional Nurture envelope remain compatible legacy/pre-activation scaffold. No activated subject-aware path may rely on either behavior; adoption must be additive, versioned, capability-gated, and conformance-tested rather than globally reinterpreting legacy inputs.
- C-3-0b-0 is planning-only. C-3-0b-1 owns public route/session/workspace establishment, C-3-0b-2 owns the private service/principal envelope, C-3-0b-3 owns ingress variants, and C-3-0b-4 owns input/denial/audit/adoption evidence. No contract, manifest, source, schema, migration, route, runtime, secret, environment, capability, provider, database, or traffic changed.

Pilot-0-C3-0b-1 public context/session/workspace refinement:

- Host context mode is exactly `platform_general|workspace_business|invitation_acceptance` as planning vocabulary; exact shared type/field names remain later contract work. `platform_general` is not a Nurture ingress and may use Host account/public policy without producing a trusted scenario principal. `workspace_business` is the only ordinary subject-aware ingress. `invitation_acceptance` is an account-authenticated exact-recipient Host identity transition before target membership.
- A general Chat thread may use a personal workspace internally for persistence, but storage partition is not business context. General mode may use only Host-allowed global/public sources and account-level preferences; it cannot query workspace-private Knowledge, Nurture owner services, Subject history, Notification, recent business context, or another thread's workspace facts.
- Child/education/nurture text in general mode may receive generic non-personalized guidance. Any request for private family/child/teacher/Institution/workflow facts offers an explicit transition. The transition is explicit even with one eligible workspace, creates or enters a workspace-scoped conversation, and carries only the current user-confirmed trigger intent by default. Prior general messages, attachments, searches, inferred summaries, and tokens do not move automatically.
- Business workspace sources are closed: a server-owned resource binding for an existing thread/Notification/Run/business route; an explicit shell selection; or a sole active membership only after entry through an explicitly business-scoped route. Resource binding wins and mismatch fails. General Chat, personal default, recent workspace, cached Subject, token, owner inference, and another tab's mutable selection are not sources.
- Ordinary gate order is current Host authentication/user/human actor, exact workspace establishment, active workspace/membership, environment capability, scenario registration, workspace allowlist/Pilot cohort, server-derived surface, C-3-0b-2 principal, then Nurture current owner resolution. Failure before principal creation makes no Nurture call.
- Every read, prepare, submit, retry, Notification open, and result request requires current Host session validation. Scenario/interaction tokens, prepared actions, and Chat conversation cannot extend session. Reauthentication rebuilds current context and may show current owner state but never automatically submits an old action. Membership/account/workspace loss stops before Nurture; resource-bound workspace isolates multi-tab changes.
- Invitation preview requires account authentication but not target membership, verifies exact current recipient/invitation/purpose/expiry, and reveals only minimum safe context. Explicit acceptance atomically consumes/reuses the Host invitation and establishes membership with stable exact replay. Wrong account, expired/revoked/drifted invitation, and concurrent mismatch return generic unavailable.
- Host acceptance and Nurture onboarding are independent commits. Acceptance may offer a continuation but cannot auto-call a business command, create a Participant/role/Subject, or share a distributed transaction. Nurture capability/cohort denial blocks the continuation without rolling back Host membership. The isolated Pilot workspace bounds generic Host ACL exposure; broader rollout requires a separate workspace-content entitlement review.
- Stable public states are `sign_in_required|account_context_not_ready|workspace_selection_required|workspace_unavailable|scenario_unavailable|access_changed|unavailable`. Internal membership, capability/allowlist/cohort, Participant/role/Subject/Grant/policy, invitation, and owner failure details do not cross the safe boundary beyond the applicable class.
- Current My-Chat personal-workspace fallback and absence of a real adult Workspace Invitation model/acceptance route are explicit readiness gaps. Existing Agent Invitation is unrelated and cannot satisfy this contract. C-3-0b-1 changes no source/schema/route and claims no working public IIB.
- C-3-0b-1 is planning-only. C-3-0b-2 owns the exact private service/principal envelope and its strict wire codec/non-fallback activation, C-3-0b-3 owns Notification/worker/prospective/operator path mechanics, and C-3-0b-4 owns client echo allowlists, public denial mapping, audit retention, cross-repo adoption, and closure evidence. No contract, invitation model, manifest, source, schema, migration, route, runtime, secret, environment, capability, provider, database, or traffic changed.

Pilot-0-C3-0b-2 private caller/principal refinement:

- Every subject-aware private invocation requires two independent proofs: a caller authenticator produces one `nurture.private-api.v1` My-Chat workload subject, and an ES256 detached signature covers the exact UTF-8 `ScenarioPrivateInvocationV1` body for `nurture.scenario-invocation.v1`. The signed `caller_binding` must equal the authenticated subject; either proof alone, any mismatch, or any verifier outage fails before Participant lookup.
- The initial caller subjects are `my-chat-api` with `interactive_session` and `my-chat-workflow-worker` with `durable_run_actor`. Browser/mobile, provider, arbitrary worker, Technical Operator, C-0 provisioner, and Nurture itself are not ordinary human-principal callers. C-3-0b-3 owns their exact path classifications.
- `ScenarioHumanPrincipalV1` has exact keys and semantics: `principal_version=1`, `principal_kind=human_user`, one `{namespace=my_chat, object_type=user}` account ref, one `{namespace=my_chat, object_type=actor}` human-actor ref, one `{namespace=my_chat, object_type=workspace}` workspace ref, and `principal_origin=interactive_session|durable_run_actor`. User and Workspace select the exact active Participant lookup; Actor is Host provenance only.
- The principal contains no email/contact/display PII, membership id/role, Participant/RoleAssignment, Nurture role, Subject/Family/Child/Process, Institution/CareGroup/Enrollment, Grant/policy/action/target, surface, payload, session, invitation, scenario, service, or claim credential. Ordinary zero/duplicate/mismatched Participant fails closed without alternate-workspace, email/contact, history, cache, invitation, token, or client fallback; C-3-0b-3 owns the sole exact-invitation prospective exception.
- My-Chat signs only after rereading active User, human Actor ownership, Workspace/membership, environment capability, scenario registration, workspace allowlist/Pilot cohort, and server-derived route/surface. Durable invocation recovers Actor from the persisted Run and current membership rather than queue payload. Host Invitation acceptance itself is not an invocation; any post-accept continuation builds a fresh interactive principal.
- `ScenarioPrivateInvocationV1` is an additive exact envelope over contract version/hash, issuer, assertion audience, caller binding, human principal, scenario/endpoint/method/registered ingress surface, request/correlation/optional trace evidence, `issued_at`, `expires_at`, single-use nonce, operation key, and operation input. The detached signature covers the final raw body; actual endpoint/method/scenario and every repeated workspace/account/actor/scenario value must match.
- Envelope lifetime is at most 60 seconds with no more than 30 seconds clock-skew tolerance. Worker envelopes are minted immediately before the private call, never at enqueue time. Expired assertions are not refreshed; retry rereads current Host facts and signs a new envelope.
- Nonce is transport-attempt evidence and is atomically consumed as an issuer/audience/caller-bound hash in a shared replay store before owner resolution. Replay storage contains only nonce hash and expiry and fails closed when unavailable. Logical `request_id` may remain stable across response-loss retry; inner `command_request_id` remains stable for CommandExecution. Retry uses a new nonce/signature, and payload drift under the same command id remains an idempotency conflict.
- Same-Step reclaim keeps the original Step ref and command identity while current claim evidence and private nonce may rotate. Another Step cannot obtain replay ownership even with an otherwise valid caller/principal/envelope. Claim token may cross only as signed transient operation input and never becomes principal, request, nonce, command identity, persisted evidence, log, or metric.
- Service caller and invocation signing use separate credential/key domains. Pilot pins ES256, exact algorithm, `kid`, type, issuer, environment-specific audience, trusted key source, and revoked-key set; `none`, request-selected algorithm, wildcard audience, key URL, embedded key, critical/unknown header, unknown-`kid` try-all verification, and cross-environment keys are rejected.
- Normal rotation prepublishes the next public key, waits for verifier propagation, changes the signer, accepts previous/current keys for at least a 15-minute operational overlap, and retires the previous key only after no envelope can remain live. Emergency compromise revokes the exact key/caller immediately and fails closed without compensating committed Nurture facts.
- A temporary isolated-Pilot static caller authenticator may use a separate high-entropy secret with exact environment/audience/subject mapping and current/next rotation, but cannot reuse `NURTURE_INTERNAL_SERVICE_TOKEN`, cannot run beside a fallback authenticator in one environment, and does not change the signed principal path. The existing token remains activation owner-read-only.
- Private ingress ordering is body/network guard, caller authentication, detached-signature verification, strict envelope codec, freshness/audience/caller/route/contract checks, atomic nonce consumption, operation codec, normalized verified context, Participant binding, then Nurture owner resolution. Exact-key, bounded ID/time/body/depth/collection/ref codecs reject unknown or duplicated authority fields before domain code.
- Only the private verifier factory may construct `VerifiedScenarioInvocationV1`. Domain services receive normalized workspace, User, Actor provenance, origin, safe route/request evidence, and operation input; they never receive HTTP objects, credentials, JWS, nonce, raw envelope, or broad metadata. Activated C3 domain commands use the resolved Participant as business actor and never substitute Host Actor. Existing `NurtureCommandExecution.business_actor_ref` is polymorphic across legacy family-core My-Chat/system refs and institution Participant ids, so C-3-0b-2 does not silently reinterpret historical rows; C-3-0d must define an additive typed/versioned actor field or explicit migration before activated C3 writes rely on persisted actor semantics.
- Credentials, signatures, nonce values, raw envelope/principal, key material, session/invitation/scenario/claim tokens, and raw transport payload are absent from facts, CommandExecution, logs, traces, metrics, Handoff/Outbox, Notification, and errors. Safe provenance may include contract hash, origin, surface/caller keys, request hashes, and separately named/hashed Host account/actor refs; none participates in authorization.
- Additive Base adoption introduces `ScenarioPrivateInvocationV1`, `ScenarioHumanPrincipalV1`, a separately versioned ingress-surface type, strict conformance, and capability `trusted_scenario_invocation_v1`. Legacy optional `actor_id`, broad `client_surface`, workspace-optional/default/inferred behavior, old internal handlers, and legacy fixtures continue only pre-activation. One activated operation/environment has one vNext verifier/authenticator and never falls back after a private validation failure.
- Current repositories have no shared private-envelope contract, signed ingress, nonce store, key rotation/verifier, capability, or activated route; current internal surface accepts optional Host actor metadata, current `business_actor_ref` contains mixed legacy/institution meanings, and the static service token protects only one owner-read endpoint. These are implementation gaps, not C-3-0b-2 runtime evidence.
- C-3-0b-2 is planning-only. C-3-0b-3 now owns exact interactive, Notification, durable replay, invitation-continuation, provisioning, and Technical Operator variants. C-3-0b-4 owns client echo allowlists, public denial mapping, audit retention, Base -> My-Chat -> Nurture adoption evidence, and authenticated-ingress planning closure. No contract, manifest, source, schema, migration, route, runtime, secret, environment, capability, provider, database, or traffic changed.

Pilot-0-C3-0b-3 ingress-variant schema refinement:

- `ScenarioIngressSurfaceV1` is an additive discriminated ingress context rather than a broad client label. Its closed Pilot categories are `product_surface`, `host_transition`, and `workflow_runtime`. Nurture registers product keys `nurture_chat|family_board|family_workbench|teacher_board|institution_board|institution_workbench`, transition keys `notification_open|invitation_continuation`, and runtime key `workflow_worker`.
- Base owns the reusable structure/category validators, the Nurture manifest owns exact key/operation registration, and My-Chat owns the server route registry. Device labels, `web_run_workbench`, `technical_admin`, legacy `client_surface`, and current event kinds cannot populate or alias trusted ingress.
- The ordinary matrix permits `my-chat-api + interactive_session` only for product/transition ingress and `my-chat-workflow-worker + durable_run_actor` only for `workflow_worker` plus an explicitly durable-enabled operation. Every other caller/origin/ingress/operation cross-product fails before Participant or business resolution.
- Product ingress requires one current Workspace+User Participant and always re-resolves role, Subject/work scope, target, Grant, policy, lifecycle, and action availability. Surface remains presentation/eligibility/audit provenance, does not choose role or enter canonical effect identity, and an Institution-only participant cannot gain Nurture Chat authority.
- Notification open is a read-only Host transition after exact session/recipient/workspace/Notification validation. Server-side Notification/Handoff evidence locates the owner request; Nurture owner-rereads and returns a current destination plus a newly issued destination-bound locator; the destination performs a fresh product-surface invocation. Provider/deep-link identity, cached destination, and Host read state grant no business authority or effect.
- Durable ingress reconstructs the represented User/Actor/workspace from persisted Run evidence, rereads current membership/gates, and separately validates the claimed original Step. `workflow_worker` never borrows an initiating UI surface. Response-loss replay preserves Step and `command_request_id` while claim/nonce/signature rotate; wrong-Step or cross-ingress replay is denied.
- `invitation_continuation` begins only after independent exact-recipient Host acceptance/membership commit. It reuses the signed interactive human principal but dispatches to the sole exact-invitation-bound prospective application service before ordinary Participant lookup. Only a registered onboarding transaction may atomically create/reuse the exact Workspace+User Participant, expose the minimum prospective allowlist, and return exact replay; there is no generic zero-Participant find-or-create fallback. A new ordinary invocation is required after commit.
- C-0 provisioning and Technical Operator recovery remain outside `ScenarioPrivateInvocationV1`/`ScenarioIngressSurfaceV1`. Provisioning uses a separate assertion/spec, caller, audience, endpoint, verifier, gate, fixed one-time operation, and permanent closure. Technical operations remain Host-owned; `request_owner_reevaluation` alone may use a separate owner-recovery request with opaque refs/current evidence and operator audit. Neither provisioner nor operator resolves as Participant or becomes business actor.
- Activated variants keep one route/verifier/handler path and cannot fall back across product, Notification, durable, invitation, provisioning, owner-recovery, legacy handler, optional `actor_id`, inferred/default workspace, broad `client_surface`, dev-host route, owner-read token, or alternate authenticator. Safe ingress provenance may be retained separately but cannot authorize.
- Current schema/source has no discriminated ingress registry, special private contracts, complete Notification path, Host adult invitation continuation, or typed actor persistence. C-3-0d still owns additive typed/versioned actor semantics for ordinary Participant, provisioning authority, and owner-recovery service without reinterpreting historical `business_actor_ref` rows.
- C-3-0b-3 is planning-only. C-3-0b-4 owns exact client echo fields, public denial mapping, audit retention/access, Base -> My-Chat -> Nurture adoption evidence, negative closure, and planning exit. No contract, manifest, source, schema, migration, route, runtime, secret, environment, capability, provider, database, or traffic changed.

Pilot-0-C3-0b-4 client, denial, audit, and adoption schema refinement:

- `ScenarioClientEchoV1` is an additive strict discriminated union, not a free-form object. Pilot variants are `chat_text` with bounded text and optional `client_message_id`; `view_query` with `current|recent|history`, owner-issued cursor, bounded page size, and an exact registered query schema; `clarification_answer` with scenario token and registered answer; `action_prepare` with registered action key, opaque owner target, optional expected version, and exact registered input; and `action_submit` with submit token, exact confirmation, and `client_mutation_id`. Optional display hints are `mobile|web`, normalized locale, and IANA timezone. Attachments are excluded from Pilot.
- Unknown fields, broad `Record<string, unknown>` values, and client-supplied identity, workspace establishment, Participant/role/Subject/scope, target authority, Grant/policy/lifecycle, ingress/caller/origin, signature metadata, request evidence, durable refs, claim token, `command_request_id`, or strong-auth assertion fail strict decoding. A signature proves only that My-Chat transmitted the exact echo; it never upgrades client trust.
- Host-only context includes canonical User/Actor/Workspace, current session/membership/gates, scenario/endpoint/registered ingress, caller/origin, contract/time/nonce/signature evidence, safe request evidence, Conversation/Notification/Handoff/Invitation/Run/Step/driver refs, transient claim evidence, server-established request/driver identity inputs, and any verified authentication-assurance assertion. `client_mutation_id` may participate in Host request deduplication but is not a command identity; client confirmation is not authentication assurance or business authorization.
- Nurture alone resolves Participant/RoleAssignment/role, Subject/Family/Process, Institution/CareGroup/Enrollment, Grant/direction/data class, current target/policy/lifecycle/action availability, safe owner candidates, and the current relationship path. Nurture also validates the canonical business-effect identity, canonical payload hash, and replay disposition under the registered operation/driver contract. Host context and historical audit cannot supply or override those facts. C-3-0d must lock the exact direct-empty and claimed-Step identity derivations before implementation.
- Public routing preserves the existing My-Chat context states and Nurture safe result reasons instead of creating a third competing enum. Invalid echo is HTTP 400; missing authentication 401; account/workspace selection conflict 409; guessed, mismatched, existence-sensitive, or known workspace/scenario unavailable resources 404; lost current access to an already established resource 403; throttling 429; and private-verification or owner outage 503. Current Nurture denial, clarification, or changed target remains HTTP 200 with a typed owner result. Reusing one command identity with changed payload is HTTP 409 `request_conflict`.
- Public errors expose only closed safe state/reason/rule/retry fields plus an opaque My-Chat `support_ref` when support correlation is warranted. The support ref is not a request, correlation, trace, CommandExecution, nonce, Step, Handoff, or internal error id. Internal verifier stages, stacks, raw provider/database errors, signatures, key ids, claims, body fragments, and owner existence details stay private.
- My-Chat Host audit may retain exact canonical User/Actor/Workspace, route, and gate outcomes. Nurture audit retains workspace, caller/origin/ingress/operation, hashed Host provenance, Participant business actor where applicable, CommandExecution/outcomes/versions/refs, and a closed decision class. Logs, traces, and metrics contain only low-cardinality technical dimensions and no identifiers, bodies, secrets, protected facts, or raw provider/database errors.
- Pilot retention is purpose-specific: nonce hashes at most five minutes; traces seven days; logs fourteen days; deidentified aggregate metrics and ordinary ingress security audit ninety days; and provisioning, operator, or owner-recovery audit 365 days. Nurture business facts and protected family content follow the separate business retention/redaction policy. C-3-0b-4 closes ingress/security audit retention only; content, attachment/KMS, redaction aftermath, and data-subject/legal retention remain P1/C-3-0e.
- Audit access is workspace-scoped, time-bounded, purpose-required, least-privilege, and itself audited. Provisioning and owner-recovery audit failure is fail-closed. A business mutation records its CommandExecution in the same Nurture transaction and never depends on a remote audit sink; read/denial audit may be asynchronous only with alerting and a bounded observable gap.
- Base adds only reusable types, validators, legacy/vNext fixtures, and additive capability declarations. My-Chat adopts the exact Base revision/hash, public parser, route registry, Host context/signing, denial/support mapping, Host audit, and a default-off capability. Nurture adopts the same revision/hash, verifier/nonce/registry/dispatch, safe-denial and audit contracts, plus the separately isolated special verifiers. Joint evidence pins registry/hash compatibility and covers negative injection, leakage, replay, onboarding, and operator paths.
- Activation stays allowlist- and capability-gated with no legacy fallback. Rollback disables the vNext ingress without rewriting committed facts or re-enabling ambiguous legacy semantics. Current optional workspace/actor metadata, broad surfaces, free-form structured/form/display data, legacy event kinds, free-form error details, static owner-read auth, and missing conformance/audit/special endpoints remain implementation blockers.
- C-3-0b-4 and C-3-0b are planning-complete only. The ingress adoption described here does not satisfy complete-IIB adoption; C-3-0c owns subject-aware presentation, C-3-0d owns typed action/driver and persisted actor semantics, and C-3-0e owns protected data, offline behavior, complete cross-repo adoption, and final evidence. No contract package, manifest, source, schema, migration, route, runtime, audit sink, secret, environment, capability, provider, database, or traffic changed.

Pilot-0-C3-0c-0 presentation pipeline and ownership schema refinement:

- The planning-only pipeline is verified My-Chat invocation -> current Nurture subject/owner resolution -> display-safe semantic presentation -> My-Chat generic surface adapter/renderer. Exact shared type and method names are deferred to C-3-0c-1/2.
- Base may own reusable provider/presentation containers, closed generic result classes, structural bounds, capability declarations, and conformance fixtures. Base contains no Nurture domain name, ref type, role, lifecycle, safe reason, action key, persistence rule, renderer, runtime, or database behavior.
- Nurture owns current subject-provider resolution, Account–Subject relationship checks, role/scope/target/lifecycle/Grant/policy reread, safe business disclosure, semantic presentation state, and action availability. Nurture may later emit safe text or localization key/parameters only after C-3-0c-2 chooses one exact representation.
- My-Chat owns authenticated shell and generic Chat/card/list/detail/workbench rendering, route/navigation chrome, accessibility, device adaptation, and renderer registration. My-Chat receives no authority to map internal owner codes, raw refs, or guessed roles into scenario presentation; renderer compatibility is structural only.
- Nurture Chat combines AI conversation with the same generic structured UI system used elsewhere. AI input from Nurture is limited to the current display-safe semantic response; the model cannot receive hidden candidates, raw owner objects, protected facts, internal denial detail, or action-policy metadata and cannot synthesize a business block/action absent from the semantic response.
- Surface adapters consume one current owner presentation path. Surface eligibility may select an owner-permitted subset, and the renderer may change layout, but no adapter creates a separate fact, lifecycle, token, action key, safe reason, command, or authorization result. Cross-surface navigation invokes a fresh owner read.
- Presentation is non-authoritative and non-durable by default. Before C-3-0c-3/e classification, Host stores no presentation tree, candidate collection, raw Subject/domain ref, relationship path, role/Grant/policy result, protected content, owner token, action availability, or inferred business state. A separately versioned opaque workspace/scenario-bound context/ref may cross requests only under its owner contract.
- Every render, refresh, selection, navigation, prepare, submit, retry, result recovery, and Notification destination revalidates Host session/workspace gates and the current Nurture relationship/policy/lifecycle seam. Owner/provider outage, stale context, renderer incompatibility, or changed authorization fails closed without cached-presentation fallback.
- Current Workflow presenters, artifact drafts, broad surfaces, synthetic summaries, and `institution-surfaces` are implementation gaps/scaffolding rather than evidence of the new pipeline. No shared subject provider, semantic-presentation contract, renderer conformance, or field persistence classification exists.
- C-3-0c-0 is planning-only. C-3-0c-1 owns exact subject-provider wire, C-3-0c-2 owns semantic blocks/actions/copy, C-3-0c-3 owns renderer and presentation persistence classes, C-3-0c-4 owns conformance/adoption evidence, C-3-0d owns action execution, and C-3-0e owns protected/offline policy. No contract package, manifest, source, schema, migration, route, UI, renderer, runtime, cache, secret, environment, capability, provider, database, or traffic changed.

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
| `grantedByRoleAssignmentId` | string | no | Additive Restrict FK to the exact granting role; required for every new and Pilot-active Grant before activation. |
| `grantedToScopeType` | enum | yes | `institution`, `care_group`, `enrollment`. |
| `grantedToScopeId` | string | yes | Scope target. |
| `directions` | string[] | yes | `family_to_org`, `org_to_family`. |
| `dataClasses` | string[] | yes | Allowed data classes. |
| `purposes` | string[] | yes | Product/legal purpose tags. |
| `status` | enum | yes | `pending`, `active`, `revoked`, `expired`, `replaced`, `deleted`. |
| `effectiveFrom` | datetime | no | Start. |
| `expiresAt` | datetime | no | Optional expiry. |
| `supersedesGrantId` | string | no | Unique Restrict self-FK from a replacement Grant to its immediate predecessor; the inverse relation finds the successor. |
| `replacedAt` | datetime | no | Database transaction time at which this Grant became `replaced`; required for replaced rows. |
| `replacedByParticipantId` | string | no | Restrict Participant FK for the replacement actor; required for replaced rows. |
| `revokedAt` | datetime | no | Database revoke timestamp; required for revoked rows. |
| `revokedByParticipantId` | string | no | Restrict Participant FK for the resolved revoke actor; required for voluntary-revoke rows. |
| `revokeReason` | string | no | Server-owned lifecycle code; Pilot voluntary revoke uses `user_revoked`, never client free text. |
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

Pilot-0-B3-3c lifecycle refinement:

- One capture transaction writes the family-authored sent Message, family-to-org delivered Receipt, `open(v0)` Item, `created` ItemEvent, active TeacherAttention projection, thread update, and CommandExecution/result. Partial fact sets are forbidden.
- A separate explicitly confirmed caregiver command is required for `open(v0) -> acknowledged(v1)`. The command appends `acknowledged`, records actor/time, and moves the source Receipt `delivered(v0) -> acknowledged(v1)` while Attention remains active. No caregiver Message or org-to-family Receipt is created by acknowledgment.
- Caregiver-confirmed reply is allowed only for `acknowledged(v1) -> replied(v2)`. The same transaction writes one linked caregiver reply Message, `replied` ItemEvent, org-to-family delivered Receipt, thread update, and resolves Attention. Direct reply from `open` or `waiting_for_family` is invalid in the Pilot profile.
- `replied` is terminal for the first Pilot. `waiting_for_family`, `followed_up`, `closed`, `expired`, and `reopened` remain reusable schema vocabulary but are excluded from the success path; `suppressed` remains available for B3-3d privacy/runtime fences. A second reply, in-place edit, clarification, follow-up, or close command is not available. Correction starts a new question/command identity.
- For the Pilot, Receipt `delivered` means the currently authorized logical target Nurture surface can owner-read the content. Device/provider/Handoff/Outbox state and Host notification read do not change Receipt state. Item/detail/notification open performs no implicit Nurture `read`; only explicit acknowledge changes the source Receipt.

Pilot-0-B3-3d replay, authorization-fence, and redaction refinement:

- `NurtureCommandExecution.commandRequestId` and a canonical input hash form one immutable idempotency identity. Exact replay returns the original output refs; the same id with different input is rejected. Nurture response loss cannot create another Message, Receipt, ItemEvent, Item/Attention version, or replay seed.
- A non-empty replay seed remains owned by the original durable claimed My-Chat Step. Same-Step reclaim may recover the result; another Step cannot acquire or consume the seed, and materialization remains at most once.
- Every capture follow-up, read, presenter, notification eligibility check, retry, and stale open validates the Item's original `grantId` plus current role, family, enrollment, care group, and policy. Revoke, expiry, replacement, owner-role loss, and scope/policy drift use the same fail-closed fence. A replacement Grant never revives an old Item.
- Grant invalidation moves linked `pending` Receipts to `blocked(grant_revoked)` and already logical-visible Receipts to `revoked_after_delivery(grant_revoked)`. Dependent nonterminal/replied Items become `suppressed(grant_revoked)` and active Attention becomes suppressed. A resolved Attention remains an audit shell with no protected body or action. Messages, Executions, and ItemEvents remain immutable audit facts.
- Retention of an audit shell does not imply receiver body access. A Message author with a still-current same-side role/family relationship may owner-read their own unredacted Message; a former cross-role receiver may read only an allowed tombstone. Loss of the author's role/family eligibility also ends author-side access.
- Redaction is exact-author-only, expected-version, and irreversible. Redacting the Guardian source Message removes protected content, terminalizes its Receipt as `revoked_after_delivery(source_redacted)`, suppresses the dependent Item and active Attention, and blocks caregiver acknowledge/reply. A previously committed caregiver reply is a separate author fact and is not automatically redacted.
- Redacting the caregiver reply removes only that reply content and terminalizes its reply Receipt as `revoked_after_delivery(source_redacted)`. The source question/Receipt, terminal `replied` Item, resolved Attention, Execution, and events remain in their audit state; redaction never reopens work or enables a second reply.
- Immediate Pilot routing has no user-visible pending stage or `cancel_route` action. A cancel attempt after logical delivery returns `route_already_visible` without mutation. Post-submit withdrawal is either author redaction or Grant-owner revoke; the three operations remain distinct.
- Revoke/redaction cascades MUST process every dependent row in one atomic transaction. A fixed `take` batch may be used only with a loop-to-closure or explicit overflow rollback; partial completion is invalid.

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

#### 7.3.1 `NurtureInteractionContextDependency`

Typed lifecycle dependencies make revocation/redaction discovery complete without parsing JSON.

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | string | yes | Dependency row id. |
| `workspaceId` | string | yes | Must match context and referenced object workspace. |
| `contextId` | string | yes | Restrict FK to `NurtureInteractionContext`. |
| `grantId` | string | no | Restrict FK to one Grant dependency. |
| `messageId` | string | no | Restrict FK to one Message dependency. |
| `itemId` | string | no | Restrict FK to one Item dependency. |
| `receiptId` | string | no | Restrict FK to one Receipt dependency. |
| `createdAt` | datetime | yes | Database creation time. |

Constraints:

- Raw CHECK requires exactly one of `grantId|messageId|itemId|receiptId` to be non-null.
- Unique indexes prevent duplicate `(contextId, typedRef)` rows; indexes on `(workspaceId, eachTypedRef, contextId)` support root cascade.
- Context issuance and all dependency rows commit together. Multi-candidate clarification writes multiple rows; any missing typed dependency invalidates the context for protected use.
- Dependency rows contain refs only and never bodies, tokens, authorization decisions, or Host retry state.

#### 7.3.2 `NurtureLifecycleCascadeAudit`

Bounded local evidence proves closure without expanding CommandExecution output refs.

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | string | yes | Audit id. |
| `workspaceId` | string | yes | Scenario partition. |
| `rootType` | enum | yes | Versioned `child_link_grant|family_care_message`. |
| `rootId` | string | yes | Internal root ref; never a client route. |
| `rootVersion` | integer | yes | Version whose cascade was closed. |
| `cause` | enum/string | yes | Server-owned terminal/redaction reason. |
| `cascadeSchemaVersion` | integer | yes | Determines dependency registry and transition matrix. |
| `affectedCountsPayload` | json | yes | Canonical bounded counts by object/transition; no ref lists. |
| `closureHash` | string | yes | Canonical hash of root/version/cause/schema/counts/postconditions. |
| `commandExecutionId` | string | yes | Restrict FK to the immutable owning `NurtureCommandExecution`. |
| `completedAt` | datetime | yes | Database transaction time. |

Constraints:

- Unique: `(workspaceId, rootType, rootId, rootVersion, cause)`.
- Index: `(workspaceId, commandExecutionId)`; one composite command may own multiple root cascade audits.
- Audit, root mutation, dependent closure, and owning Execution commit in one transaction.
- Audit never grants access and stores no body, attachment, token, per-dependent ref, target-account/device list, or Host technical lifecycle.

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

1. The exact invited adult authenticates through My-Chat; invitation identity and Institution intent grant no Guardian authority.
2. The prospective Guardian strongly confirms relationship, minimum profile, longitudinal-profile/privacy meaning, and family visibility.
3. One idempotent Nurture transaction binds/reuses `NurtureParticipant` and creates `NurtureChild`, `NurtureChildCareProcess`, `NurtureFamily`, the first active Guardian RoleAssignment, and `CommandExecution` audit evidence.
4. Any failure rolls back the complete transaction. Exact replay returns the same refs; changed relationship/profile payload conflicts rather than creating a second child/family/role.
5. An existing process may be selected only by a current same-workspace Guardian. A non-Guardian follows Co-Guardian Invitation first and cannot use Institution prefill or matching as authority.
6. Family-side workflow becomes reachable only after current policy rechecks; Enrollment and Grant remain later separate confirmations.

### 8.2 Institution enrolls child

1. Institution Admin creates a minimal institution-local `NurtureInstitutionRosterEntry`; sending its Enrollment Invitation remains blocked until C-1 readiness passes.
2. My-Chat delivers the invitation and authenticates the invited Guardian without exposing raw contact/auth data to Nurture.
3. The prospective Guardian explicitly selects a currently authorized same-workspace child process or atomically creates/confirms the minimum `NurtureChild` / `NurtureChildCareProcess` / `NurtureFamily` profile plus initial Guardian relationship. Institution prefill never establishes canonical identity.
4. Guardian separately confirms `NurtureEnrollment` linking the child care process to the exact institution/group; the detailed C-2c/C-2d transaction and thread timing remain open.
5. Guardian separately reviews and confirms `NurtureChildLinkGrant`; Enrollment never implies Grant.
6. Only then may grant-allowed items appear in teacher board/class inbox. An unaccepted/expired/declined invitation leaves only the institution-local roster/audit state.

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
