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
