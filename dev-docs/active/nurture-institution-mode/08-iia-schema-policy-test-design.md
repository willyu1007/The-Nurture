# IIA Schema / Policy / Test Design

## Status

- **Phase:** IIA design entry
- **Updated:** 2026-07-12
- **Scope:** design-only; do not edit `prisma/schema.prisma`, `scenario.manifest.yaml`, handlers, policies, presenters, or tests in this phase.
- **Input:** `06-ib-nurture-schema-spec.md` and `07-ib-decision-convergence.md` are locked for IB-D0 through IB-D7.
- **Next implementation gate:** schema implementation must use the repo DB SSOT workflow from `prisma/schema.prisma`, then refresh `docs/context/db/schema.json`.

## 1. IIA Target

IIA turns the locked IB contract into an implementation sequence for the first institution ecology slice:

1. Add Nurture-owned care ecology persistence.
2. Add resolvers and policies for participant, role assignment, child scope, grant, and surface role behavior.
3. Add scenario capabilities for `class_family_inbox`, `teacher_attention_board`, `caregiver_daily_care`, and `child_media_attribution`.
4. Add tests proving class-of-10 teacher workflow, family privacy, grant-gated flow, revoke runtime fence, message redaction, and My-Chat opaque delivery boundary.

IIA must preserve these locked rules:

- `NurtureChildCareProcess.id` is the independent child scope.
- `NurtureParticipant` is unique per `(workspaceId, myChatUserId)`.
- Parents, teachers, and institution administrators share role-agnostic My-Chat main-chat ingress; My-Chat selects Nurture while Nurture resolves role/scope/target/business direction/output.
- Dashboard/board surfaces may switch among validated `NurtureCareRoleAssignment` rows.
- One active `NurtureFamily` exists per `NurtureChildCareProcess` in MVP.
- Main-chat scenario responses and explicit Nurture dashboards use generic realtime render paths; host persistence is limited to opaque optional activation bookkeeping.

## 2. Implementation Slices

| Slice | Name | Purpose | Exit criteria |
| --- | --- | --- | --- |
| IIA-0 | Contract preflight | Confirm manifest/context refs, repository ports, and resolver input DTOs before schema migration. | No live capability enabled; design maps to current module boundaries. |
| IIA-1 | Prisma schema | Add care ecology models/enums and indexes from IB; keep existing P0 family workflow tables intact. | `prisma validate`, migration preview, and refreshed DB context pass. |
| IIA-2 | Repositories/resolvers/policies | Implement typed repository ports, actor resolution, target-scope resolution, grant checks, and fail-closed policy decisions. | Policy unit tests cover positive and negative cases. |
| IIA-3 | Capabilities/handlers/presenters | Wire first institution capabilities and presenters behind manifest entries. | Module validator and registry load pass; no capability leaks Nurture facts into My-Chat host state. |
| IIA-4 | Journey tests | Prove the class-of-10 family-to-org workflow and negative safety/privacy paths. | End-to-end scenario tests pass, including revoke/redaction/stale notification cases. |

### 2.1 IIA-0 Contract Decisions

#### IIA-0-C1 Capability Slice

**Status:** LOCKED on 2026-07-08.

**Decision:** First-slice manifest contract includes four separate capability keys:

- `class_family_inbox`
- `teacher_attention_board`
- `caregiver_daily_care`
- `child_media_attribution`

Teacher mobile is a surface composition, not a canonical business capability. It may render these capabilities together as one teacher work surface, but it must not own their business facts, policies, or lifecycles.

Implementation sequencing:

1. Start with `class_family_inbox` + `teacher_attention_board` as the `family_to_org` teacher workload closure.
2. Add `caregiver_daily_care` after inbox/attention can resolve child scope, caregiver scope, grant behavior, and presenter shape.
3. Add `child_media_attribution` after the core teacher work surface can validate caregiver/admin scope and exposure policy.

Rationale:

- `class_family_inbox` validates the real pain: one class has many child-private family threads, while the teacher needs one class workflow.
- `teacher_attention_board` validates child-scoped projection over family-care items, care constraints, daily care logs, and policy-derived attention.
- `caregiver_daily_care` writes new care facts and can feed both `teacher_attention_board` and `org_to_family` sharing.
- `child_media_attribution` is first-slice institution value, but it is not required to prove the minimum `family_to_org` communication loop.
- Keeping capability keys separate avoids one oversized `teacher_mobile_workbench` capability with mixed source-of-truth, policy, and lifecycle semantics.

#### IIA-0-C2 Surface Contract

**Status:** LOCKED on 2026-07-08.

**Decision:** My-Chat surfaces pass entry context, conversation continuity refs, current payload, generic display state, and Nurture-issued opaque scenario tokens only. Nurture is the sole resolver of participant, role assignment, work scope, child scope, grant state, policy decision, current object state, and output.

Ownership split:

- My-Chat owns chat conversation continuity: `hostConversationRef`, `hostTurnId`, message display, host transcript, shell navigation, and whether the user opens an old conversation.
- Nurture owns scenario interaction context: `nurtureInteractionContextId`, pending intent, candidate role/scope refs, clarification state, pending draft/action refs, TTL, and staleness state.
- Nurture owns business memory/facts: family-care threads/messages/items, daily care logs, care constraints, grants, role assignments, child care process state, attention items, and media attribution facts.

Main-chat routing rules:

- Parents, teachers, and institution administrators all enter through the My-Chat main mobile chat. My-Chat MAY process the current turn to decide whether it belongs to Nurture, but the route decision only selects `scenario=nurture`; it does not resolve the Nurture actor role, work scope, child target, business intent, grant, or propagation direction.
- My-Chat SHOULD reuse an explicit Nurture entry, existing conversation-to-scenario binding, or returned Nurture `scenarioToken` before invoking generic intent routing again. Route reuse is a host conversation optimization, not Nurture authorization.
- After Nurture is selected, the existing Surface Contract envelope applies. Nurture independently resolves whether the actor is currently acting as guardian, caregiver, or institution administrator and whether the requested effect is `internal_fact`, `family_to_org`, or `org_to_family`.
- The system invocation direction (`My-Chat -> Nurture -> My-Chat scenario response`) and the Nurture business distribution direction (`family_to_org` / `org_to_family`) are independent concepts and MUST NOT be inferred from each other.

Surface rules:

- `mobile_chat` may pass `workspaceId` if injected by the host adapter, `myChatUserId`, `surface=mobile_chat`, current input payload, `hostConversationRef`, `hostTurnId`, `previousTurnRef`, and `clientLocalContext`.
- `mobile_chat` must not pass trusted role, trusted `selectedRoleAssignmentId`, trusted `childCareProcessId`, host-authored `targetRef`, host-authored `workScopeHint`, or host-side family/institution/class authorization decisions.
- `mobile_dashboard` / `teacher_board` may pass generic display state such as filters, sort, pagination, selected tab, and a Nurture-issued `scenarioToken` from a previously rendered work surface. My-Chat must not synthesize `roleAssignmentId`, `careGroupId`, `childCareProcessId`, `targetRef`, `dataClass`, or `direction`.
- `notification_deeplink` may pass host delivery bookkeeping such as `deliveryId`, `dedupeKey`, and provider delivery status, plus a Nurture-issued `scenarioToken` if one was embedded in the notification. My-Chat must not interpret or pass Nurture target ids as business refs.
- `web_workbench` / `admin_board` may pass generic display state and Nurture-issued `scenarioToken`. Institution admin work scope is resolved by Nurture; institution admin is not ambient access to all child facts.

Multi-turn behavior:

- Same-conversation turns may reuse a short-lived `NurtureInteractionContext` to recover pending intent, candidate targets, and clarification state.
- `NurtureInteractionContext` is an interaction cache, not an authorization result. It must expire and may become stale when role, grant, object, message, item, or child scope state changes.
- If the user opens an old My-Chat conversation, My-Chat may pass `hostConversationRef` and a Nurture-issued continuation token if it still has one; Nurture may try to restore pending context, but must classify it as current, stale, revoked/closed/redacted, ambiguous, or unsafe before continuing.
- If the user starts a new conversation later, My-Chat does not need to pass old chat context. Nurture may recover candidates from enabled Nurture source adapters, such as nonterminal family-care items, current attention items, and active family threads, then ask clarification when multiple targets are plausible.
- Every render, action, and write must re-resolve participant, role assignment, child scope, grant state, policy, and current object state. Conversation refs and interaction context can restore intent, but cannot skip resolver or policy.

#### IIA-0-C3 Workflow-Mediated Family Conversation Contract

**Status:** LOCKED on 2026-07-10.

**Decision:** Different Nurture roles do not communicate through a direct role-to-role chat channel. Family and institution inputs enter Nurture workflows, and Nurture distributes audience-specific messages from workflow facts. The family experience remains conversation-shaped and child-private; the teacher experience remains workflow-shaped and class-aggregated.

Product surfaces:

- Family surface: one child-private conversation timeline that can include free-text/attachment family input, receipts, clarification requests, caregiver-confirmed responses, care outcomes, and daily-care summaries. Multiple authorized guardians/caregivers may participate, but the surface is organized around one `childCareProcessId`, not an unrestricted cross-role room.
- Teacher surface: `class_family_inbox`, attention board, and child-scoped work details. Teachers acknowledge, accept, request clarification, record outcomes, close items, and record daily care through workflow actions; teachers are not required to monitor or reply inside ten direct chat rooms.
- My-Chat main chat: provides one role-agnostic adult entry point, decides whether to invoke Nurture, carries the Surface Contract envelope, and renders the structured Nurture scenario response. My-Chat does not infer a Nurture role or propagation direction.
- My-Chat scenario dashboard/board: is already bound to Nurture and renders generic Nurture presenter output for the validated role/work scope. It requires no Nurture-specific host business handling and no handoff merely to display committed content.
- My-Chat activation surfaces: notification, push, unread/badge, notification center, and deep link consume optional opaque activation handoffs. My-Chat does not become the communication source of truth.

Canonical and projection rules:

- Family-authored input is persisted as `NurtureFamilyCareMessage` and becomes workflow input; it is not directly delivered into a teacher chat inbox.
- `NurtureFamilyCareItem`, `NurtureFamilyCareItemEvent`, and `NurtureDailyCareLog` remain the source of truth for teacher work state and care outcomes.
- A family-facing workflow response is persisted as a canonical `NurtureFamilyCareMessage` linked to its source item/event/log. The message is the communication record, but it must not become the source of truth for item/log state.
- The family timeline is a presenter projection over canonical messages plus safe receipt/outcome state. It may look like a one-to-one/group conversation, but every cross-role message is mediated by Nurture workflow and policy.

Authorship and trust rules:

- Family-authored content is attributed to the actual guardian participant.
- Content shown as authored by a named caregiver MUST come from a caregiver-confirmed workflow action. AI may draft, but it cannot publish under a caregiver identity without confirmation.
- Deterministic system/institution status messages MUST be labeled as system/institution output and MUST NOT impersonate a caregiver.
- Routine items use structured actions plus an optional short caregiver note. `family_care_question` may allow a fuller caregiver-confirmed response. Clarification requests should use structured fields/options with an optional short explanation.
- Every family-facing workflow message MUST be traceable to its source family input, item/event, daily-care log, or explicit human confirmation action.

Write and delivery boundary:

- A teacher command does not directly append arbitrary text to a family thread. It first validates and commits the Nurture business transition.
- The Nurture transaction MUST atomically persist the business mutation, item/log event, family-facing canonical message/visibility, and Nurture idempotency/receipt facts required for retry and audit. When the target Nurture surface is readable at commit, the logical receipt may be `delivered` immediately.
- Main-chat feedback returns through the structured scenario response, and dashboard/board visibility returns through Nurture presenters; neither uses a handoff as the normal result path.
- Optional My-Chat-owned activation delivery occurs after the Nurture transaction through an idempotent handoff with opaque refs. A push/notification/deep-link failure must not erase or downgrade the committed Nurture work fact, family conversation record, visibility, or logical receipt.
- Cross-role distribution and every later deep-link render MUST re-check current grant/runtime fence, role/scope, message lifecycle, and exposure policy. A blocked future delivery leaves an auditable Nurture receipt/event rather than silently disappearing.

Verification implications:

- Tests MUST prove that family input creates workflow work instead of a direct teacher chat delivery; teacher actions create traceable family-facing messages; system text cannot impersonate a caregiver; and one class work surface can serve ten child-private family timelines.
- Tests MUST prove Nurture work/message persistence is independent from My-Chat notification success, and retry/replay cannot duplicate a workflow action or family-facing message.

#### IIA-0-R1 Resolver Output Consumers

**Status:** LOCKED on 2026-07-08.

**Decision:** Resolver output is a Nurture-internal context contract. My-Chat must not consume `participantId`, `roleAssignmentId`, `childCareProcessId`, `policySeed`, or other resolved Nurture refs for business decisions. My-Chat receives only the final scenario response produced by Nurture presenters.

Primary consumers:

- Capability handler / scenario orchestrator: routes `resolved`, `needs_clarification`, and `blocked` resolver results into the next Nurture step.
- Policy engine: consumes resolved actor/scope/object refs plus `policySeed` to produce structured allow/deny/redaction decisions.
- Query/projection services: constrain reads to the resolved child, family, care group, institution, thread, item, log, or media scope.
- Command / workflow action services: use resolved context as a write candidate, then require policy and write preconditions before mutating state or triggering workflow.
- Presenter: combines resolved context, policy decision, query/command result, and safe UI state into the response returned to the My-Chat shell.
- Interaction context manager: stores short-lived pending intent, candidates, clarification state, or draft/action refs for multi-turn Nurture interactions.

Boundary rules:

- Resolver output does not directly authorize writes. Writes must pass policy and command-specific preconditions.
- Resolver output is not a host API contract. My-Chat can pass opaque refs and receive rendered scenario responses, but it must not branch on Nurture internal ids or policy seeds.
- Resolver output normalizes untrusted My-Chat hints once for Nurture internals, so downstream Nurture modules do not repeat host-hint parsing.
- `needs_clarification` and `blocked` are first-class outputs, not errors. They are consumed by presenters and interaction context management to produce safe next states.

#### IIA-0-R2 Resolver Context Shape

**Status:** semantic contract locked on 2026-07-09; persistence carrier locked on 2026-07-12.

**Decision:** Resolver output is organized into three context layers: `actor`, `workScope`, and `target`. `childCareProcessId` is required for child-specific action/write contexts, but it is not required for every resolved teacher or institution collection work surface.

Context layers:

- `actor`: the current My-Chat user as a Nurture participant, plus the resolved or selected `roleAssignmentId`, `roleKind`, role assignment status, and role scope.
- `workScope`: the current Nurture work surface scope, such as `child_process`, `family`, `care_group`, or `institution`.
- `target`: the optional concrete object being acted on or displayed, such as a thread, message, item, daily care log, media asset, media attribution, grant, enrollment, or child care process.

Scope rules:

- `resolved` means actor and work scope are resolved. It does not always mean a child target is selected.
- Teacher board and class inbox entry may resolve to `care_group` work scope first. The downstream query must constrain child rows through active enrollment, role scope, and policy.
- Institution admin surfaces may resolve to `institution` or `care_group` work scope first. Institution admin is still not ambient access to all child details.
- Child-specific writes, replies, shares, daily logs, receipts, workflow events, and media attribution confirmation require a concrete `childCareProcessId` before command execution.
- Target object resolution must include current lifecycle state such as `active`, `closed`, `redacted`, `stale`, or `unavailable`.

Result states:

- `resolved`: actor and work scope are usable by Nurture internals; target may be absent for collection surfaces.
- `needs_clarification`: resolver found multiple plausible roles, child scopes, targets, or memory matches; presenter should ask a safe clarification and interaction context may store candidates.
- `blocked`: resolver cannot produce a usable context because participant, role, scope, object, grant/runtime fence, or lifecycle state fails closed.

#### IIA-0-R3 Resolver Input Envelope

**Status:** LOCKED on 2026-07-09.

**Decision:** Resolver input is a host invocation envelope, not a Nurture business-context envelope. My-Chat provides authenticated caller identity, surface, conversation continuity refs, current payload, generic display state, Nurture-issued opaque scenario tokens, and idempotency keys. My-Chat does not provide target, work scope, role assignment, grant, data class, direction, or policy facts.

Trusted host facts:

- `myChatUserId`: the authenticated My-Chat user.
- `workspaceId`: optional host-adapter fact when available; mobile client code should not be required to know it.
- `scenarioKey`, `surface`, `hostRequestId`, `submittedAt`, `locale`, `timeZone`: request and shell facts. These facts guide routing and presentation but do not grant Nurture scope.

Allowed host-provided inputs:

- `conversation`: `hostConversationRef`, `hostTurnId`, and `previousTurnRef` for chat continuity only.
- `event`: one of `chat_message`, `surface_open`, `scenario_token_event`, `form_submit`, or `notification_open`.
- `payload`: current text, structured payload, form data, and host attachment refs.
- `scenarioToken`: opaque token generated by Nurture. MVP supports only `clarify`, `submit_action`, and `open_notification`.
- `displayState`: generic shell state such as selected tab, filters, sort, pagination, and client-local context.
- `idempotency`: `hostRequestId`, `clientMutationId`, and `attemptKey` for duplicate suppression.

Forbidden host-provided business inputs:

- `targetRef`
- `workScopeHint`
- `selectedRoleAssignmentId`
- `childCareProcessId`
- `familyId`
- `careGroupId`
- `institutionId`
- `grantId`
- `dataClass`
- `direction`
- `policyDecision`
- `canView` / `canWrite`

Scenario token rules:

- Scenario tokens are issued by Nurture and are opaque to My-Chat.
- My-Chat may store and return the token but must not inspect, modify, or branch on the token contents.
- MVP tokens are opaque Nurture DB handles, not signed business payloads.
- MVP supports `clarify`, `submit_action`, and `open_notification` only. `select_scope` is folded into `clarify`; `continue` uses `hostConversationRef` + `NurtureInteractionContext`; `resume_draft` is post-MVP.
- The token record may reference candidate role, work scope, target, pending action, delivery, or clarification refs, but those refs become usable only after Nurture resolves and validates them.
- Tokens must store purpose, issuer/audience, expiry, state, and enough replay/idempotency metadata for Nurture to reject stale or mismatched usage.
- Token resolution never bypasses participant, role, work scope, child scope, grant/runtime fence, policy, or object lifecycle checks.

#### IIA-0-R4 Ambiguity Handling

**Status:** LOCKED on 2026-07-09.

**Decision:** Resolver ambiguity handling uses typed candidates and deterministic precedence. Resolver may auto-resolve only when the candidate is unique, current, reachable, and safe for the requested invocation. Ambiguous role, work scope, target, intent, or memory matches return `needs_clarification`; revoked, forbidden, redacted, stale-unsafe, or scope-invalid cases return `blocked`.

Ambiguity types:

- `role`: the same My-Chat user has multiple active Nurture roles.
- `work_scope`: the participant can access multiple children, families, care groups, or institutions.
- `target`: the current input may refer to multiple threads, messages, items, logs, media assets, attributions, grants, or enrollments.
- `intent`: the current payload maps to multiple business intents, such as one-day care note versus long-term care constraint.
- `memory`: business memory retrieval returns multiple plausible recent contexts.

Candidate precedence:

1. Valid `scenarioToken` that belongs to the current user, surface, purpose, and invocation.
2. Active `NurtureInteractionContext` for the same conversation and non-stale pending intent.
3. Explicit payload semantics, such as child nickname, class label, date, item keyword, or structured form field.
4. Surface defaults, such as only one accessible child, one teacher care group, or one admin institution.
5. Nurture business memory through enabled source adapters, such as a nonterminal family-care item, current attention item, or active family thread.

Auto-resolution rules:

- Actor must resolve to one active participant.
- Role and work scope must be legal for the surface and invocation.
- Child-specific action/write must resolve one `childCareProcessId`.
- Target, when present, must be unique, reachable, current, and lifecycle-compatible.
- Grant/runtime fence and policy precheck must not have a known blocker.
- There must not be multiple plausible candidates in the same deterministic match class.

Clarification rules:

- Return `needs_clarification` when multiple safe candidates remain or when intent is under-specified.
- Do not expose internal ids in clarification prompts or options.
- Store candidate refs only in Nurture-owned interaction context or Nurture-issued tokens.
- My-Chat may ask the user only by rendering the structured interaction request produced by Nurture.

Blocked rules:

- Return `blocked` when no active participant exists, token ownership/purpose/surface fails, role is revoked, scope is unreachable, target is redacted/unavailable, enrollment/grant/runtime fence blocks the action, or continuing would require expanding permissions.
- Do not downgrade forbidden, revoked, or redacted states into clarification.

#### IIA-0-R5 Structured Clarification Interaction

**Status:** LOCKED on 2026-07-09.

**Decision:** `needs_clarification` must return a structured My-Chat interaction request, not a long prose answer. Nurture owns the business question, candidate generation, safe labels, validation rules, option tokens, and continuation token. My-Chat renders generic choice/form/input primitives and returns opaque option tokens or form values.

Clarification response shape:

```text
type: needs_clarification

scenarioToken:
  token
  purpose: clarify
  expiresAt

interaction:
  kind: single_choice | multi_choice | confirm_cancel | form | text_input | date_time | attachment_picker
  title?
  description?        # optional and short
  options?:
    optionToken
    label
    description?
  fields?:
    fieldKey
    label
    type: text | textarea | number | date | time | select | multi_select | boolean
    required?
    options?:
      optionToken
      label

safeState:
  reasonCode
  canSkip?
```

Interaction rules:

- My-Chat renders the structure but must not generate business candidates or interpret option tokens.
- Options and fields must use safe short labels, such as child display name, class display name, or human-readable item summary.
- Options must not include `childCareProcessId`, `roleAssignmentId`, `itemId`, or other Nurture business ids.
- User responses return `scenarioToken` plus `optionToken`, field values, attachments, or free text.
- Nurture resolves the response, rechecks participant, role, scope, grant/runtime fence, policy, object lifecycle, and command preconditions, then continues or returns another structured clarification/blocked state.

#### IIA-0-R6 Scenario Token MVP TTL and Staleness

**Status:** LOCKED on 2026-07-09.

**Decision:** Scenario token MVP is an opaque Nurture DB handle with limited purposes: `clarify`, `submit_action`, and `open_notification`. Token TTL/staleness must be robust enough for resolver safety, but MVP must avoid building a general-purpose token platform.

MVP token record:

```text
id
workspaceId
participantId
purpose: clarify | submit_action | open_notification
surface
tokenHash
tokenHashVersion: 1
hostConversationRefHash?
payloadSchemaVersion
statePayload
status: active | consumed | revoked
expiresAt
consumedAt?
revokedAt?
version
createdAt
updatedAt
```

- One row is the complete Nurture-local carrier for one issued token; MVP adds no separate scenario-token table.
- Raw token, raw host conversation id, and raw My-Chat invocation/command ids are not persisted. Token and optional conversation bindings use namespaced hashes.
- `statePayload` is validated by `purpose + payloadSchemaVersion`; it is not arbitrary cross-purpose JSON.

MVP classification:

- `current`: token exists, is active, unexpired, and matches user, purpose, surface, and optional conversation constraints.
- `expired`: persisted status may still be `active`, but token is past `expiresAt`; no status-migration job is required.
- `recoverable`: token cannot be used directly, but Nurture can safely regenerate candidates or a new clarification from current business facts.
- `blocked`: token is missing, consumed, revoked, mismatched, replayed, or points to a now-forbidden/revoked/redacted/closed context.

Persisted lifecycle versus resolver classification:

- Persist only `active`, `consumed`, and `revoked`. Expiry is derived from required `expiresAt`; `current`, `expired`, `recoverable`, and `blocked` are resolver response classes, not database states.
- Valid `clarify` and `submit_action` use optimistic `version` to consume an active context. If clarification continues, Nurture creates a new context/token rather than mutating the consumed candidate set into a new interaction.
- `open_notification` is reusable and is not consumed by a read; it remains bounded by expiry, revoke, participant binding, and current owner checks.
- A multi-turn `submit_action` derives its stable B2 `commandRequestId` from internal context id + purpose. A consumed token with an exact committed Execution may return replay safely; direct single-turn commands continue to reuse `invocationRequestId` where appropriate.

Purpose payload rules:

- `clarify`: pending intent, complete candidate paths, and hashed option-token mappings to candidate refs.
- `submit_action`: command key, target refs, expected versions, prepared action schema/hash, and immutable content/attachment refs.
- `open_notification`: Nurture locator refs for the current source/Receipt/Item/Message.
- No purpose payload stores bodies, target-account/device lists, cached authorization decisions, model output copies, or host retry/attempt state.

Purpose rules:

- `clarify`: short TTL; may return a new structured clarification when expired or recoverable.
- `submit_action`: short TTL; one-time or idempotency-bound. Expired, consumed, or changed-state submissions should usually return `blocked` or require reopening the action.
- `open_notification`: longer TTL; token is a locator only. Opening always rechecks delivery/object state and may return current content, updated/unavailable state, structured clarification, or `blocked`.

Responsibility split:

- My-Workflow-Base MAY define a reusable opaque continuation field, generic structured-interaction request/response shape, workspace/actor/purpose/TTL/replay/revalidation invariants, and cross-scenario conformance tests. It MUST NOT own a central token service, shared token table, scenario candidate payload, or authorization decision.
- My-Chat renders generic choice, form, confirm, text/date/attachment input, and unavailable/retry primitives, then returns `scenarioToken`, `optionToken`, and field values unchanged. It MUST NOT inspect token purpose, decode candidates, derive target refs, or branch on scenario policy.
- Nurture owns `NurtureInteractionContext` persistence, purpose-specific TTL/consume/recovery policy, candidate/action/notification refs, participant/scope/target bindings, current-state revalidation, command binding, and safe presenter output.
- Ordinary new chat turns use resolver/business-memory recovery. Ordinary Nurture dashboard reads use the explicit scenario surface and presenter. A token is issued only when clarification, a prepared action, or a notification target must survive a request boundary; it is not a general Nurture object-access token.
- Education may later bind the same protocol to student/assignment/grade actions and ERP to organization/document/approval actions, but those scenarios own different tables, payloads, authorization, TTL values, and recovery rules.
- MVP implements the contract locally in Nurture. Hash/TTL/consume/revoke mechanics MAY move to a shared scenario SDK only after a second scenario proves the same behavior. Extraction never moves scenario persistence or business policy into My-Chat/My-Workflow-Base.

MVP staleness implementation:

- Do not implement full object version vectors in MVP.
- Resolve the token record, load referenced Nurture objects, and query current participant, role, scope, grant/runtime fence, target lifecycle, policy, and command preconditions.
- Use current-state checks to decide `current`, `recoverable`, or `blocked`.
- `recoverable` should be conservative in MVP and mainly used for `clarify` and safe notification recovery. `submit_action` should fail closed unless a command-specific idempotency rule explicitly allows retry.

Post-MVP:

- Signed payload tokens.
- Full object version vectors.
- General `continue`, `select_scope`, and `resume_draft` token purposes.
- Long-lived draft recovery and cross-device continuation.
- Detailed stale reason taxonomy beyond MVP resolver/presenter needs.

#### IIA-0-R7 Business Memory Retrieval

**Status:** LOCKED on 2026-07-10.

**Decision:** Implement business memory retrieval as a thin reusable scenario-resolver kernel plus Nurture-owned source and policy adapters. Business memory retrieval is a bounded query over current Nurture canonical facts; it is not My-Chat transcript memory, a generic AI/vector memory platform, an authorization result, or a command trigger.

Architecture and reuse:

- The host-neutral kernel owns candidate merge/deduplication, deterministic ordering, ambiguity decisions, and the generic `resolved` / `needs_clarification` / `blocked` result flow.
- Nurture adapters own canonical-fact queries, participant/role/scope/enrollment/grant/lifecycle filtering, policy prechecks, Nurture intent compatibility, and safe clarification presentation.
- My-Chat continues to provide only the host invocation envelope and render the final scenario response. My-Chat must not run source adapters or interpret candidate refs.
- The generic contract is implemented locally in Nurture first. Extraction into My-Workflow-Base or a shared scenario SDK requires a second scenario to prove the same contract; R7 does not add a premature cross-repository runtime dependency.
- `NurtureInteractionContext` remains the higher-precedence source for short-lived same-conversation continuity. Business memory primarily supports new conversations, expired interaction context, and explicit continuation language.

Retrieval source registry:

| Source class | MVP objects | Resolver role |
| --- | --- | --- |
| Eligibility facts | `NurtureParticipant`, role assignment, child care process, enrollment, grant, thread participant | Filter only; never create or rank memory candidates. |
| Work candidates | `NurtureFamilyCareItem`, `NurtureTeacherAttentionItem`, `NurtureFamilyCareThread` | Produce complete role/scope/target/intent resolution-path candidates. |
| Retrieval evidence | message metadata, item/attention/thread safe summaries, category, data class, date, current payload semantics | Explain or match a candidate; do not become an independent target by default. |

MVP source adapters:

- `family_care_item`: query nonterminal `open`, `acknowledged`, `replied`, or `followed_up` items that remain current and reachable.
- `teacher_attention_item`: query current `active` attention items. If an attention item has an actionable backing source, normalize and deduplicate to that backing target rather than returning both objects as separate work candidates.
- `family_care_thread`: query an active thread only for communication-compatible intent such as view, continue, or reply. `NurtureFamilyCareMessage` does not receive a standalone MVP source adapter; message metadata or safe summaries may locate a thread/item, and a message becomes a target only when the current invocation explicitly identifies that message.
- `NurtureDailyCareLog` and `NurtureChildMediaAttribution` adapters are registered when their corresponding capability increment is implemented. Stable care constraints/profile facts remain eligibility/context evidence unless a capability defines an explicit actionable object.

Reusable internal candidate contract:

```text
ResolutionCandidate
  candidateKey
  actorBindingRef
  scopeRef
    kind
    id
  targetRef?
    objectType
    objectId
    lifecycleState
  intentKey
  sourceKey
  stateClass: actionable | active_context | recent_context
  matchClass: exact_entities | exact_topic_or_date | explicit_continuation | weak_recent_context
  evidenceCodes[]
  occurredAt?
  dedupeKey
```

Candidate rules:

- One candidate MUST describe one complete actor-binding -> scope -> optional child/target -> intent path. Resolver MUST NOT independently rank fragments and later combine a role from one candidate with a target from another.
- The reusable kernel must not hardcode `childCareProcessId`, `careGroupId`, or Nurture object types. Nurture adapters specialize `actorBindingRef`, `scopeRef`, and `targetRef` with Nurture refs.
- Candidates are transient Nurture-internal values. `candidateKey` and business refs must not leave Nurture; clarification uses opaque option tokens backed by interaction context/scenario token state.
- Safe labels are loaded by the Nurture presenter after policy checks. Candidate evidence must not become a shortcut for exposing raw message content or sensitive facts.

Deterministic ranking and ambiguity:

1. Nurture adapters MUST hard-filter current participant, role assignment, reachable scope, child process, enrollment, grant/runtime fence, target lifecycle, and policy precheck before candidates enter the kernel.
2. Candidate intent and capability MUST be compatible with the current invocation.
3. Rank `matchClass` as `exact_entities` -> `exact_topic_or_date` -> `explicit_continuation` -> `weak_recent_context`.
4. Within the same match class, rank `stateClass` as `actionable` -> `active_context` -> `recent_context`.
5. Source-specific lifecycle state and `occurredAt` may order otherwise equivalent candidates for presentation.
6. Stable ids MAY make presentation order repeatable, but MUST NOT turn a semantic tie into an auto-resolved candidate.
7. `weak_recent_context` MUST NOT auto-resolve. Recency alone, urgency, priority, or due time MUST NOT select a role/child/target unless the current invocation explicitly asks for that dimension.
8. Resolver may auto-resolve only one unique, current, reachable, safe, intent-compatible candidate. Multiple plausible candidates return structured `needs_clarification`.

Cost and complexity gates:

- MVP MUST NOT add a business-memory table, vector database, embedding pipeline, generic rule DSL, Redis dependency, or candidate cache.
- Retrieval MUST reuse current canonical tables and indexed fields through bounded source queries. Source queries MAY run in parallel.
- Retrieval MUST NOT add a dedicated model call. If current-input intent interpretation already exists, source adapters MAY reuse its typed output; deterministic selection cannot depend on a model confidence score.
- Candidates are not persisted except for the minimum refs already required by `NurtureInteractionContext` or scenario-token clarification state.
- Per-source, aggregate-candidate, and rendered-option limits are configurable runtime limits, not schema invariants. If plausible candidates exceed the safe rendered-option limit, Nurture asks for a discriminating child/date/topic field instead of silently truncating candidates.

Verification implications:

- Kernel tests MUST be table-driven and cover merge/deduplication, ranking, semantic ties, `weak_recent_context`, stable ordering, and limit-driven narrowing.
- Adapter tests MUST prove eligibility facts only filter, revoked/unreachable/redacted sources never become candidates, attention backing targets deduplicate, messages remain evidence by default, and no extra model/storage dependency is required.

#### IIA-0 Cross-Cutting Model Execution and Cost Posture

**Status:** LOCKED on 2026-07-11.

Current product priority is usability and reliability. Cost is an architectural dimension to observe and preserve optimization options for, not an MVP command gate.

- IIA MUST NOT introduce fixed per-turn model-call, token, or monetary limits that reject normal Nurture work or reduce correctness merely to meet a cost quota.
- Runtime deadlines, cancellation, recursion/loop protection, and overload controls MAY bound execution for reliability. Those controls are not product cost budgets.
- My-Chat owns generic conversation continuity and transport refs. Nurture owns scenario context assembly, child-scoped business memory, derived summaries, pending interaction state, and model-purpose decisions.
- Nurture context packs and derived memory MUST be purpose/scope/version aware. Authorization and Execute-time preconditions MUST NOT rely on a cached context pack.
- Infrastructure retry, command replay, handoff retry, and physical recipient/device fan-out MUST NOT accidentally repeat completed model work. A repeated invocation is valid only when the semantic work unit or its relevant input/context/model/prompt version changed.
- One source action MAY legitimately require multiple model rounds or multiple child-specific semantic artifacts. Architecture MUST trace those invocations to the turn, command/run, purpose, context refs/versions, model/prompt version, latency, and token usage so later optimization is evidence-driven.
- Scenario output SHOULD be structured for My-Chat rendering. A separate model call MUST NOT be required merely to convert the same accepted scenario result into chat, mobile, form, or notification transport shapes.
- Model choice, context compression, cache policy, and invocation reuse MUST remain replaceable runtime policies. MVP does not require a generic cache, vector, or memory platform before measured usage justifies one.

This decision does not expand R7. Resolver recovery remains deterministic and has no dedicated model call, cache dependency, vector pipeline, or generic memory store. The cost-aware model/runtime concern begins only after resolver output enters scenario context assembly and capability processing.

#### IIA-0-R8 Command Write Preconditions

**Status:** LOCKED on 2026-07-12 after B1, B2, and B3 closure.

Command write preconditions are the authoritative submit-time checks after resolver and policy prechecks. R8 separates internal business-fact writes from cross-role distribution, uses a prepare/execute flow, and requires current-state checks inside the Nurture transaction. B1-B3 below close the durable handoff, command execution, routing/clarification, lifecycle, and recovery blockers.

Command effect classes:

| Effect class | Meaning | Example |
| --- | --- | --- |
| `internal_fact` | Writes Nurture-owned work/care facts without automatically exposing them to another role. | Record daily care; confirm internal media attribution. |
| `cross_role_distribution` | Distributes an existing Nurture fact across role workflows. | Route family input to institution; share daily care to family. |
| `composite_workflow_action` | Atomically changes a Nurture workflow fact and creates the required canonical message/distribution intent. | Acknowledge an item; request clarification; answer a family question. |

The effect class describes writes, not authorization. Each command must declare explicit source-access and distribution grant dependencies. For example, acknowledging a family-derived item is an internal item transition but still depends on the current `family_to_org` grant/runtime fence.

Prepare/execute boundary:

```text
Prepare
  resolver -> payload validation -> policy precheck
  -> immutable action payload/hash -> submit_action token

Execute
  token/idempotency validation -> resolver + policy
  -> begin Nurture transaction
  -> reload actor/scope/enrollment/grant/target/version
  -> common guards -> command-specific transition guards
  -> persist mutation + event + canonical message/visibility + logical receipt
  -> commit -> structured scenario response
             + optional opaque/idempotent My-Chat activation handoff
```

`ready` is an internal transaction-time precondition result and must never be cached as authorization. Business preconditions, persisted business outcome, and response replay disposition are separate contracts:

```text
PreconditionDecision:
  ready | invalid | blocked | conflict

CommandBusinessOutcome:
  applied | already_satisfied

CommandResponseDisposition:
  executed | replayed
```

- `replayed` means the same idempotency identity and payload already committed; it is a response disposition, not a persisted business outcome.
- `already_satisfied` means another valid command already produced the requested business state.
- `conflict` means current object/version state requires refresh or a new prepare/confirmation flow.
- `needs_clarification` is not a command outcome. Actor/scope/target ambiguity returns to resolver; a long-running family clarification is a separate durable business workflow.

Original robustness blockers (contractually closed by B1-B3; implementation gates remain below):

1. **R8-B1 durable host activation handoff:** Committed Nurture content is returned through scenario response/presenter paths and does not depend on a handoff for visibility. When a command also requests a My-Chat-owned notification, unread/badge, or deep link, a crash after Nurture commit but before My-Chat outbox acceptance can still lose that activation request. B1 requires an at-least-once, idempotent host activation handoff; cross-database exactly-once is not an MVP goal.
2. **R8-B2 durable command idempotency and concurrency:** Grant-receipt uniqueness covers only distribution. Internal item/log/media commands require a shared Nurture command-execution record or equivalent durable uniqueness, payload-hash mismatch rejection, result replay, and enforced `aggregateVersion`/conditional update behavior.
3. **R8-B3 durable routing and family clarification state:** Family input needs a visible routing lifecycle distinct from canonical message lifecycle. Teacher clarification may span hours/days and cannot live in `NurtureInteractionContext`; item status/event or a dedicated clarification object must represent pending/answered/expired/cancelled state and correlation.

R8-B1 current host evidence:

- My-Chat `workflow-contracts` already defines `HandoffRequestInput`, `HandoffReceiptInput`, `WorkflowHandoffResult`, `workflow.handoff.requested`, `workflow.handoff.receipt_recorded`, and refs-only/no-body event payloads.
- My-Chat `workflow-runtime` already exposes `WorkflowHandoffService`, `HandoffLedgerRepository`, public handoff route metadata, the internal receipt route, and `WorkflowRuntimePort.complete_step(...event_drafts)` for same-host-transaction workflow event persistence.
- My-Chat does not yet contain a concrete handoff-ledger repository implementation, and `@my-chat/outbox` does not yet register `workflow.handoff.*` event types. The current runtime is a contract/service shell, not a complete durable B1 path.
- The current Nurture `create_handoff` adapter returns a synthetic requested result, and `createNurtureScenarioModule` injects only `WorkflowRuntimePort`. B1 therefore requires a host-owned durable handoff port/implementation before institution delivery can be production-ready.

R8-B1-A logical delivery ownership is locked, with the initial-pending rule corrected by B1-B:

- Nurture MUST use `NurtureChildLinkReceipt` as the durable logical distribution lifecycle; MVP does not add a separate `NurtureDistributionIntent` table or a Nurture-owned generic handoff/outbox runtime.
- The source business fact/message/visibility and its logical receipt(s) MUST commit in one Nurture transaction. If the target Nurture surface is readable at commit, the receipt MAY be created/finalized directly as `delivered`.
- `pending` is reserved for incomplete Nurture-owned release work such as confirmation, review, scheduled publication, redaction, or target resolution; it MUST NOT wait on My-Chat activation acceptance or physical delivery.
- A receipt represents one logical target scope such as a family or care group. My-Chat owns account/device/channel fan-out and physical delivery receipts.
- Nurture receipt states remain business-facing (`pending`, `delivered`, `read`, `acknowledged`, `blocked`, `failed`, `revoked_after_delivery`) and MUST NOT mirror My-Chat handoff acceptance, queue, retry, or notification-channel states.
- My-Chat Handoff Ledger and Notification may retain canonical receipt refs and transport correlation, but they do not decide whether the Nurture distribution should exist.
- My-Chat activation failure does not change the Nurture receipt state.

R8-B1-B unified ingress/result/activation boundary is locked:

- My-Chat main chat is the role-agnostic entry for all adult Nurture participants. My-Chat selects the scenario; Nurture resolves actor role, work scope, target, business intent, and propagation direction.
- A read/clarification turn returns a structured Nurture scenario response. A confirmed write uses the durable Prepare/Execute command path, then returns command/result refs plus scenario response.
- Nurture dashboard/board content is read through generic scenario presenter contracts and does not require `workflow.handoff.*`.
- Handoff is reserved for optional host activation capabilities such as notification, push, unread/badge, notification center, and deep link. Business distribution direction and activation-handoff direction are independent.
- B1-C must define the typed activation draft and host transaction that materializes My-Chat Handoff Ledger + outbox without allowing a scenario handler to author `workflow.handoff.*` directly.

R8-B1-C1 activation source authority is locked:

- An activation handoff MUST reference the existing canonical source owner. A normal Nurture message, item, care log, notice, or logical receipt MUST use a Nurture `DomainContextRef`; it MUST NOT be copied into a Workflow Artifact merely to satisfy a handoff input type.
- A Workflow Artifact remains appropriate when the artifact itself has independent workflow meaning and lifecycle, such as a generated report/summary that needs preview, approval, exposure-level control, publication, or knowledge handoff.
- A handoff MAY reference both an actual Workflow Artifact and Nurture context refs. For example, a weekly-care-summary artifact identifies what the user should inspect while a `NurtureChildLinkReceipt` context ref identifies the logical target/release relationship.
- My-Chat persists only the host handoff and opaque refs. Its activation consumer MUST reread Nurture for current source lifecycle, authorization/runtime fence, target account resolution, display-safe activation content, and deep-link presentation.
- My-Workflow-Base `HandoffManifest` currently declares only `source_artifact_types`. The reusable contract SHOULD add optional `source_context_ref_types` entries (`namespace` + `object_type`) and validate draft refs against the declared artifact/context source types.
- Nurture institution activation initially needs context-source declarations for `child_link_receipt`, `family_care_message`, and `family_care_item`; later care-log/notice source types must be added only with their capability increments.
- B1-C2 must converge the generic snapshot/draft key and replay contract before B1-C3 locks host transaction materialization.

R8-B1-C2 generic handoff snapshot and replay contract is locked:

```ts
type ScenarioHandoffRequestSnapshot = {
  requestId: string;
  handoffKey: string;
  requestedPurpose: string;
  sourceContextRefs?: DomainContextRef[];
  sourceArtifactRefs?: CanonicalRef[];
  expiresAt?: string;
};

type WorkflowHandoffDraft = {
  draft_key: string;
  handoff_key: string;
  requested_purpose: string;
  source_context_refs?: DomainContextRef[];
  source_refs?: CanonicalRef[];
  expected_versions?: Record<string, number>;
  expires_at?: string;
};
```

Snapshot ownership and persistence:

- `ScenarioHandoffRequestSnapshot` is a shared contract shape, not a shared database table. Each scenario MUST persist its snapshot(s) in the same scenario-owner transaction as the command result that requested the handoff.
- Nurture stores the bounded snapshot list in required `handoffRequestSnapshotsPayload` JSON on the same immutable `NurtureCommandExecution` row, with required `handoffSnapshotSchemaVersion=1`. MVP does not add normalized child rows or a standalone activation/handoff table because snapshots have no independent lifecycle/query authority; My-Chat Handoff Ledger owns operational lookup after materialization.
- A committed command result MUST preserve both a non-empty snapshot list and an explicit empty list. Replay MUST NOT recalculate whether a handoff should exist from current policy, model output, cache, or current UI state.
- The snapshot contains refs/versions and routing intent only. It MUST NOT contain source body, target-account lists, devices, channels, generated notification copy, current authorization decisions, or host retry state.
- The array is command-spec bounded, request IDs are unique within the array, and storage order is canonical by request ID. Generated request IDs are persisted outputs and not array-position identities.

Durable-driver blocking invariant:

- Persistence in the Nurture database makes a replay seed durable but does not notify or wake My-Chat. Every command that may commit a non-empty snapshot array MUST be invoked only after My-Chat durably creates and claims the driving Workflow Step.
- My-Chat Workflow Runtime supplies a service-authenticated transient driver context; end-user payloads cannot author any field:

```ts
type ScenarioCommandDriverContext = {
  driverRef: DomainContextRef; // my-chat/workflow_step
  contractHash: string;
  capabilityKey: string;
  entrypointKey: string;
  claimToken: string;
  expectedStepVersion: number;
};
```

- Nurture validates the service principal, workspace/scenario, workflow-step ref shape, and capability/entrypoint compatibility before the transaction. It trusts the authenticated host runtime's claim attestation and does not make a synchronous owner-read callback into My-Chat or interpret host lease/retry states.
- Execution persists only `handoffDriverRef` as non-authorizing provenance. Claim token/version are transient and MUST NOT enter the Nurture database, command hash, snapshot JSON, logs, traces, metrics, or presenter output. Contract/capability binding remains canonical on the My-Chat Run/Step.
- Requested activation with no driver returns uncommitted `invalid(reason=missing_durable_handoff_driver)`; wrong service/ref/type/binding returns `invalid(reason=invalid_durable_handoff_driver)`. No business mutation, snapshot, Execution, or command-identity consumption occurs; My-Chat creates/repairs and claims the Step, then retries with the same command identity.
- Nurture MUST NOT silently replace requested activation with `[]`. A deliberate command with no activation intent may use the direct fast path and commits explicit `[]`.
- If Nurture commits and the response is lost, the already-existing Step remains the durable recovery owner. It replays the same command identity, receives the exact stored JSON, and retries host `complete_step` materialization. No polling/scanner, Nurture transport outbox, Redis recovery record, or central Saga is introduced.

Exclusive recovery ownership:

- Trusted replay may return non-empty snapshots only when the current internal caller presents the exact `driverRef` stored on Execution. User-facing replay never receives activation snapshots.
- The same Step may be reclaimed with a new claim token and Step version after lease expiry; Step identity remains unchanged. My-Chat `complete_step` performs final claim/lease/version validation.
- Another Step cannot take over, read, or materialize the Execution snapshots. One original Step may still own multiple bounded child commands emitted by its registered handler.
- Admin reconciliation operates the original Step. If that canonical Step is missing/corrupt, recovery is manual host-data repair; MVP does not define replacement-Step transfer.
- Once a Handoff is materialized, technical retry uses its Handoff Ledger identity. A user/business resend creates a new command, Step, request ID, and snapshot rather than reusing the original Execution.
- Claim expiry after Nurture commit reclaims the same Step and B2-replays. Cancellation never deletes the Step; if the business commit won the race, original-Step reconciliation preserves the Nurture result and current cancel/expiry/grant/source gates determine stopped versus completed host activation.

Manifest and host enrichment:

- The reusable `HandoffManifest` SHOULD add a stable `handoff_key`. A scenario snapshot stores `handoffKey` + `requestedPurpose`; it does not copy `handoff_type`, `downstream_owner`, or `policy_key` into the scenario database.
- My-Chat MUST resolve `handoff_type`, `downstream_owner`, `policy_key`, allowed source types, and receipt requirement from the workflow run's pinned `contractHash + handoffKey`. Current manifest drift MUST NOT reinterpret a committed snapshot.
- `WorkflowHandoffDraft.draft_key` is the persisted scenario `requestId`, scoped by My-Chat uniqueness to `(workspaceId, scenarioKey, draftKey)`. Host materialization computes a canonical draft hash over the resolved declaration, purpose, source refs/versions, and expiry; trace/correlation/worker-attempt fields are excluded.

Replay and resend semantics:

- Infrastructure retry and command replay MUST return the same `requestId` and same snapshot fields. Same key + same canonical hash reuses the existing handoff; same key + different hash is `idempotency_conflict`.
- A user-visible explicit resend/remind action is a new scenario command and MUST create a new `requestId`. Host queue/provider retry reuses the existing request/handoff and MUST NOT create a new scenario snapshot.
- Current source lifecycle, authorization, policy, target membership, and expiry are rechecked before downstream effect. Those checks MAY block a historical request but MUST NOT invent a request absent from the committed snapshot.
- For a command targeting multiple independent logical scopes, each receipt/target uses a separate snapshot/request ID. Ordering changes during replay MUST NOT change identity; IDs are persisted, not derived from array position.

Generic-pipeline boundary:

- The same snapshot/draft/ledger/receipt pipeline MAY route from any scenario to a My-Chat host capability or another registered scenario. Cross-scenario consumers reread the canonical source owner, execute their own policy, persist their own canonical result, and return a receipt; they do not receive bodyful outbox payloads or direct database access.
- Nurture-specific objects (`NurtureChildLinkReceipt`, child process, grants, family/care-group direction) remain outside the shared contract. Nurture narrows the generic snapshot to `handoffKey=user_attention` and `requestedPurpose=user_attention` for the first institution activation path.
- This is a thin cross-owner handoff contract, not a generic business Saga engine. It does not own scenario transactions, business compensation, role resolution, content generation, memory/context, or scenario authorization.

Verification implications:

- Tests MUST cover same-command replay, explicit empty snapshots, bounded/versioned JSON validation, request-ID uniqueness/stable ordering, persist+claim ordering, missing/forged/wrong-service/wrong-type/binding-mismatch rejection before commit, claim-secret non-persistence/logging, exact original-Step replay, same-Step re-claim with changed token/version, wrong-Step denial, cancellation/claim-expiry races, direct-empty versus host-first-non-empty paths, same-key/hash duplicate, same-key/different-hash conflict, manifest drift under pinned contract hash, explicit resend with a new request ID, per-target stable IDs independent of array order, expiry, current-policy blocking, and refs-only payloads.
- B1-C3 below locks My-Chat `complete_step` materialization, transaction atomicity, partial duplicate handling, bounded batch behavior, and returned canonical handoff refs.

R8-B1-C3 host transaction materialization is locked:

```ts
type WorkflowStepHandlerResult = {
  output_refs: CanonicalRef[];
  context_bindings?: ContextBindingDraft[];
  artifact_drafts?: WorkflowArtifactDraft[];
  handoff_drafts?: WorkflowHandoffDraft[];
  event_drafts?: OutboxEventDraft[];
};

type MaterializedHandoff = {
  draft_key: string;
  handoff_ref: CanonicalRef;
  disposition: "created" | "existing";
};
```

`WorkflowRuntimePort.complete_step` MUST accept `claim_token`, `expected_version`, and optional `handoff_drafts`; its durable result MUST return deterministic `materialized_handoffs` in addition to step output refs.

Implementation readiness gate:

- Current My-Chat `WorkflowRuntimePort.complete_step` does not yet accept `handoff_drafts` or return `materialized_handoffs`, and the current worker does not pass them. The Handoff Ledger repository is currently an interface shell without discovered concrete Postgres persistence; Nurture's current adapter completion is synthetic.
- Until My-Workflow-Base contract updates, My-Chat ledger/materializer/outbox persistence, and crash/replay tests land, Nurture manifest/command specs MUST NOT enable any path that emits a non-empty handoff snapshot array. Empty-snapshot business paths remain independently implementable.

Pre-transaction validation:

- My-Chat MUST load the workflow run's pinned manifest by `contractHash`, validate each `handoff_key`, purpose, allowed artifact/context source type, ref/version shape, expiry shape, and bounded draft count, then compute the canonical Draft hash.
- Static validation and hash normalization MUST occur before the host DB transaction. My-Chat MUST NOT perform a remote Nurture read inside the host transaction; current Nurture lifecycle/grant/target/presenter checks occur at downstream consumption.
- Scenario-provided `output_refs` MUST NOT contain `workflow_handoff` refs. Only the host Handoff Ledger materializer may create/append canonical handoff refs.

Host transaction:

```text
complete_step transaction
  -> exact completion-command replay lookup
  -> lock workflow step
  -> validate claim token / lease / expected version
  -> persist context bindings and artifact drafts
  -> resolve each handoff declaration from contractHash + handoffKey
  -> create or reuse Handoff Ledger records
  -> append workflow.handoff.requested outbox for newly created handoffs
  -> append canonical handoff refs to persisted step outputs
  -> mark step completed
  -> append workflow.step.completed outbox
  -> persist completion result/mapping
  -> commit
```

- Step completion, newly created Handoff Ledger records, standard step/handoff outbox events, output refs, and completion replay result MUST commit atomically in one My-Chat Postgres transaction. Queue/provider dispatch begins only after commit.
- `workflow.handoff.*` events MUST be produced by the Handoff Ledger Service; `workflow.step.*` events MUST be produced by the Workflow Step Ledger/Runtime. Scenario `event_drafts` are limited to registered scenario-internal events.
- The current Nurture handler-generated `workflow.handoff.requested` and `workflow.step.*` drafts remain scaffold behavior and must be removed when the host materializer is implemented.

Idempotency and lease ordering:

- `complete_step` has its own stable completion idempotency key and canonical completion-payload hash, independent from each handoff Draft key/hash.
- If an earlier identical `complete_step` transaction committed but its response was lost, same key + same hash MUST return the persisted Step result, materialized handoff mapping, and outbox IDs even if the original lease has since expired.
- Therefore exact committed replay lookup occurs before first-time lease validation. If no replay exists, first-time completion MUST require the current claim token/lease and expected aggregate version. Same completion key + different hash is conflict.
- If no transaction committed and the lease expires, a new claim/attempt may complete the step. Scenario command replay returns the same handoff request IDs, so per-draft idempotency still reuses any handoffs created by another valid reconciliation path.

Mixed duplicate/new and conflict semantics:

- Within one bounded batch, same Draft key + same hash reuses the existing handoff and emits no new `workflow.handoff.requested`; a new key creates a handoff and one standard event.
- A batch may contain both `existing` and `created` results. The persisted/returned mapping MUST include every Draft, deterministically ordered by `draft_key`; `outbox_event_ids` include only events newly created by the transaction.
- Any same-key/different-hash conflict aborts the current host transaction, including its new handoffs and step completion. Handoffs committed by earlier transactions remain unchanged.
- Invalid manifest/source/ref shape and oversized batches MUST fail before the transaction. Workflow planning/Prepare MUST split operations into declared child/bounded-chunk steps before Nurture commits an unsupported number of snapshots.

Boundaries and dependency:

- The transaction provides atomicity only inside My-Chat. It does not make the preceding Nurture transaction part of a distributed transaction; B2 command replay closes the Nurture-commit-to-host-completion crash window.
- My-Chat still needs a concrete transaction-aware Handoff Ledger repository/service, registered `workflow.handoff.*` outbox types, completion replay persistence, and worker wiring. No queue, provider, Nurture API, or other remote call is allowed inside the transaction.

Verification implications:

- Tests MUST cover all-created, all-existing, mixed existing/new, one conflicting Draft, invalid declaration/source type, oversized preflight rejection, transaction rollback, response-loss exact replay after lease expiry, stale first-time claim rejection, deterministic mapping order, host-only standard events, and post-commit-only dispatch.
- B1-D must next converge failure classes, dead-letter/reconciliation ownership, cancellation after Nurture commit, stale/expired activation behavior, and manual replay boundaries.

R8-B1-D1 minimal Handoff failure taxonomy is locked:

```ts
type WorkflowHandoffStatus =
  | "requested"
  | "completed"
  | "stopped"
  | "failed";

type HandoffMaterializationDisposition =
  | "created"
  | "existing";
```

Status semantics:

| Status | Meaning | Automatic action |
| --- | --- | --- |
| `requested` | The logical request remains valid; waiting, in-flight processing, and automatic retry are attempt details. | Continue bounded automatic retry where applicable. |
| `completed` | The downstream logical effect completed. Channel-level partial outcomes do not change this if the required logical activation exists. | None. |
| `stopped` | Cancellation, expiry, source lifecycle, policy, authorization, or target state means the effect must not continue. | No retry; a changed business intent requires a new scenario command/request ID. |
| `failed` | Technical retries are exhausted and the request requires operator review. | No automatic retry; controlled technical replay may return it to `requested`. |

Boundary rules:

- Detailed network timeouts, provider errors, invalid device tokens, worker lease expiry, queue unavailability, attempt counts, retry backoff, and dead-letter transitions belong to outbox/downstream attempt records and evidence. They MUST NOT expand the canonical Handoff status enum while automatic recovery remains possible.
- `created` / `existing` is a materialization disposition, not a Handoff lifecycle status. The existing base `duplicate` result status SHOULD be removed in favor of this disposition.
- Downstream `accepted` MAY remain a receipt/event indicating that a consumer obtained processing responsibility, but MVP Handoff canonical state remains `requested` until `completed`, `stopped`, or `failed`.
- Existing `rejected` and `invalidated` outcomes converge to canonical `stopped` plus a safe reason code because both are terminal, non-automatic-retry outcomes. Detailed historical receipt/evidence events MAY preserve whether the downstream rejected the request or the source/request was later invalidated.
- Manifest/hash/ref contract defects and idempotency conflicts occur before Handoff creation or host transaction commit. They move the Workflow Step to `manual_review_required`; they are not Handoff `failed` records.

Reason-code groups stay small and extensible:

```text
stopped:
  workflow_cancelled
  activation_expired
  source_redacted
  grant_revoked
  policy_blocked
  target_unavailable

failed:
  dispatch_exhausted
  owner_unavailable_exhausted
  downstream_timeout_exhausted
  provider_exhausted
```

- A reason code selects diagnostics/runbook behavior inside the already-decided treatment class; it MUST NOT create a new lifecycle branch by itself.
- If My-Chat notification center/unread state is successfully created but one optional push/device channel is unavailable, the logical Handoff MAY be `completed`; channel failure remains attempt telemetry.
- Cancellation/in-flight races resolve to `stopped` if the downstream effect has not occurred or `completed` if it already occurred. MVP does not add `cancel_pending`, `cancelled_after_accept`, or similar Handoff statuses.
- Nurture business receipts may retain richer domain-specific states such as `revoked_after_delivery`; those states MUST NOT be copied into the generic Handoff lifecycle.

Verification implications:

- Tests MUST prove transient attempt failures leave Handoff `requested`, successful logical activation reaches `completed`, business/policy/lifecycle stops reach `stopped`, exhausted technical failures reach `failed`, technical replay is the only `failed -> requested` path, and contract defects fail the Step before Handoff creation.
- B1-D2 must lock Step reconciliation, same-Handoff technical replay, and new-business resend as three distinct recovery commands.

R8-B1-D2 recovery-command boundaries are locked:

| Recovery command | Trigger | Identity reused | Allowed effect |
| --- | --- | --- | --- |
| Step reconciliation | Nurture may have committed but the My-Chat Step lacks a committed completion result. | Original scenario command idempotency identity and persisted snapshot request IDs. | Re-read/replay the exact scenario command result, then retry host `complete_step`; do not invent snapshots. |
| Handoff technical replay | A Handoff exists in `failed` due to a replayable exhausted technical reason. | Existing Handoff ID and scenario request ID. | Recheck current source/expiry/policy, transition `failed -> requested` with expected version, and emit a new aggregate-version requested event/attempt. |
| Business resend/remind | A user or scenario explicitly requests a new reminder, or corrected content needs a new activation. | None; create a new scenario command, snapshot request ID, and Handoff. | Perform the new business intent under current Nurture policy. |

- Step reconciliation MUST invoke Nurture with the original command idempotency identity. If Nurture committed, B2 returns the same `NurtureCommandExecution` result and snapshots; if it did not commit, the normal command rules determine whether execution may proceed.
- Reconciliation MUST use the original persisted `handoffDriverRef`; a new claim token/version for that same Step is allowed, but a different Step ref cannot retrieve the snapshots or substitute a new Draft.
- A Step whose retry budget is exhausted after a possible external Nurture commit MUST enter `manual_review_required`, not a state that asserts no side effect occurred. The operator may trigger reconciliation but may not construct a replacement activation Draft manually.
- Handoff technical replay is allowed only for safe replayable `failed` reasons, uses optimistic aggregate version, preserves source refs/purpose/request ID, and re-runs current downstream gates. It MUST NOT modify expiry, target, policy, or payload.
- `stopped` and `completed` Handoffs cannot be technically replayed. A changed business intent after stop/completion requires a new scenario command/request ID.
- Before replaying an ambiguous downstream timeout where the effect may have completed but its receipt was lost, My-Chat MUST query/reconcile downstream by Handoff idempotency identity before reissuing the effect.

R8-B1-D3 cancellation, expiry, and in-flight races are locked:

- Cancellation before Nurture commit prevents the business command and creates no snapshot/Handoff.
- Cancellation after Nurture commit cannot erase the Nurture result. Host Step reconciliation still records the committed result. The handoff declaration MUST define `cancel_behavior`; institution `user_attention` uses `invalidate_if_pending`.
- If cancellation/expiry is observed before Handoff downstream dispatch, host materialization/reconciliation preserves an auditable Handoff as `stopped` with a safe reason and emits no requested effect dispatch.
- A `requested` Handoff may transition to `stopped` using expected version before downstream claim/effect. The consumer MUST reread current Handoff state and Nurture gate immediately before its irreversible logical/provider effect.
- Once an effect is in flight, cancellation is best effort. The terminal result is `stopped` if the effect did not occur or `completed` if it already occurred; MVP adds no intermediate cancellation statuses and cannot promise to retract a sent push.
- Generic workflow cancellation does not redact/revoke Nurture content. Content withdrawal requires a Nurture business command; later deep-link opens always re-resolve current Nurture lifecycle and authorization.
- Expired Handoffs are `stopped` and cannot be Admin-replayed by extending expiry. A new reminder requires a new scenario command/request ID.
- Source version drift is resolved by the canonical owner into current, safely superseded, redacted, revoked, or unavailable. The declared handoff policy decides whether the latest authorized representation is usable; My-Chat does not infer this from version numbers alone.

R8-B1-D4 dead-letter, Admin, and observability boundaries are locked:

- My-Chat Outbox owns dispatch retry/dead-letter. The downstream owner owns provider/task attempt retry/dead-letter. My-Chat Handoff Ledger owns the aggregate `requested/completed/stopped/failed` result and safe reason code.
- Nurture owns no transport DLQ and MUST NOT poll My-Chat queues. It exposes idempotent CommandExecution result/source reread needed by host reconciliation.
- Retry exhaustion transitions the Handoff to `failed` in a durable owner transaction with the dead-letter/evidence ref. Automatic retries then stop.
- My-Chat Admin MAY inspect safe refs/reason codes, trigger Step reconciliation, technically replay a replayable `failed` Handoff, invalidate a still-pending request, and mark an exhausted request as no longer retryable.
- Admin MUST NOT edit source refs, purpose, target, policy, expiry, or payload; bypass grants; resurrect redacted/revoked/expired sources; convert an old Handoff into a new business reminder; or expose Nurture body content by default.
- Minimum operational signals are Handoff age by status, completion latency, attempts by downstream, dead-letter count, stopped/failed reason count, reconciliation/replay count, and receipt timeout count. Metrics/logs carry IDs and reason codes, not Nurture bodies.
- My-Chat Admin correlation follows run -> step -> completion key -> draft/request key -> Handoff -> outbox/attempt/receipt -> canonical source refs. Cross-database inspection uses owner APIs, not direct joins.

Verification implications:

- Tests MUST cover the three recovery commands, possible-post-commit Step exhaustion, downstream effect/receipt ambiguity, replayable versus non-replayable failure, cancel before/after Nurture commit, cancellation before claim and in-flight, expiry, source supersession/redaction, dead-letter ownership, Admin allow/deny actions, refs-only observability, and no Nurture transport polling.
- B1 is contractually closed after D1-D4. R8 convergence proceeds to B2 durable command idempotency/concurrency, which supplies the concrete Nurture command replay record required by B1.

R8-B2-A1 Nurture-wide command-kernel scope is locked:

- `NurtureCommandExecution` is a Nurture-wide authoritative-write primitive, not an institution-only record. It covers family long-term strategy/value cultivation, short-term care planning, family-rule trials/checkpoints/reviews, activity comparison/evidence, execution review/profile updates, and institution ecology messages/items/logs/media/grants/redaction/resend commands whenever those operations mutate Nurture canonical state.
- The inclusion rule is behavioral: if retrying an operation could duplicate, repeat, overwrite, or inconsistently advance Nurture canonical data, the operation MUST execute through the Nurture command kernel.
- Pure resolver/query/presenter work, dashboard reads, unconfirmed Prepare/clarification, LLM-only drafting, and host-only Workflow Artifact/Step/Handoff/Outbox writes do not create `NurtureCommandExecution`.
- The model and repository contracts MUST remain scope-neutral. `careGroupId`, `enrollmentId`, `institutionId`, and `childCareProcessId` cannot be globally required columns; family/project-scoped long-term commands may not have institution or child scope. Commands use a stable `commandScope`, actor refs, optional primary scope, optional child process, and typed target refs.

Representative command scopes include:

```text
family_strategy.calibrate
care_plan.generate
family_rule_trial.record_checkpoint
execution_review.record
family_care_message.publish
daily_care_log.record
media_attribution.confirm
child_link_grant.revoke
```

- B2 remains scenario-owned. My-Chat Workflow Step idempotency protects host runtime state but cannot prove whether an independent Nurture transaction committed. My-Workflow-Base MAY later reuse the semantic pattern, but B2 does not create a central cross-scenario command-execution table.
- IIA implementation MUST build one shared Nurture command schema/repository/runner, adopt it first for institution commands, and migrate at least one existing family-core write command (for example `family_strategy.calibrate` or `family_rule_trial.record_checkpoint`) in the same verification increment to prove the kernel is not institution-specific.
- IIA does not require a one-shot refactor of every existing handler. Remaining family/short-term commands may migrate capability by capability, but all production write-enabled Nurture authoritative commands MUST use the shared kernel before GA; two permanent idempotency mechanisms are forbidden.
- B2-A2 must converge `NurtureCommandExecution` persistence semantics, which outcomes consume an idempotency identity, and the relationship between stored business outcome and replay response disposition.

R8-B2-A2 committed execution and response semantics are locked:

```ts
type NurtureCommandBusinessOutcome =
  | "applied"
  | "already_satisfied";

type NurtureCommandResponseDisposition =
  | "executed"
  | "replayed";

type NurtureCommandResponse = {
  disposition: NurtureCommandResponseDisposition;
  businessOutcome: NurtureCommandBusinessOutcome;
  executionRef: DomainContextRef;
  outputRefs: DomainContextRef[];
};
```

Persistence semantics:

- A visible `NurtureCommandExecution` row means the logical command completed and committed in Nurture. It is an immutable command receipt/result, not an attempt log or queue state.
- The Execution MUST commit in the same Nurture transaction as every mutation, event, receipt, output ref, and handoff-request snapshot. Rollback leaves no visible Execution and no business effect.
- Persisted business outcome is only `applied` or command-spec-authorized `already_satisfied`. `processing`, `retrying`, `invalid`, `blocked`, `conflict`, and internal error are not committed Execution outcomes.
- `already_satisfied` means a different valid command already established a state that this specific command contract declares convergent. The shared runner MUST NOT infer it from equal-looking payloads. Append commands such as daily-care recording do not deduplicate different command identities merely because content matches.
- `invalid`, `blocked`, `conflict`, and rolled-back/internal-error attempts do not consume the idempotency identity. Security-denied/evidence logging and rate limiting are separate concerns; a repaired precondition may be retried after a new Prepare.

Response and replay semantics:

- `executed` / `replayed` describes how the current response was obtained and is never persisted as a mutation of the original Execution. The database preserves the original `businessOutcome`.
- A same-key/same-payload replay performs no business mutation and returns the immutable original result. A replay of an original `already_satisfied` result returns `disposition=replayed` and `businessOutcome=already_satisfied`.
- The earlier `already_applied` combined value is superseded. Replay disposition and business outcome MUST remain separate in services, presenters, tests, and API contracts.
- A committed Execution is immutable: host handoff state, provider retry, corrected content, revoke/redaction, or explicit resend MUST NOT rewrite its output refs/result/snapshots. Later business changes create new commands/executions.

Replay authorization:

- The Execution proves that the logical write must not run again; it does not grant permanent visibility to the stored output.
- A user-facing replay MUST verify caller identity compatibility and current presentation visibility before returning output details. If access was revoked, it returns only a safe processed/unavailable response without body or inaccessible target disclosure.
- A trusted internal Step-reconciliation purpose MAY retrieve the immutable result/snapshots needed to finish B1 under service policy, but it cannot create new business effects or expand the original result.

Verification implications:

- Tests MUST cover executed/applied, replayed/applied, executed/already-satisfied, replayed/already-satisfied, append-command non-convergence, rollback with no Execution, blocked/conflict retry without consumed identity, immutable stored result, user replay after revocation, and trusted reconciliation replay.
- B2-B must converge the generic scenario-command responsibility boundary, idempotency scope/key ownership, canonical payload-hash contents/versioning, same-key/different-hash conflict, and sensitive key storage.

R8-B2-B1 generic Scenario Command Pipeline boundary is locked:

```ts
type ScenarioCommandEnvelope<T> = {
  scenarioKey: string;
  workspaceId: string;
  invocationRequestId: string;
  commandRequestId: string;
  commandScope: string;
  commandContractVersion: number;
  actorRef: string;
  payload: T;
};

type ScenarioCommandResponse<R> = {
  disposition: "executed" | "replayed";
  businessOutcome: "applied" | "already_satisfied";
  result: R;
};
```

Shared contract versus local persistence:

- My-Workflow-Base MAY define the generic envelope, logical identity/hash semantics, response dimensions, repository/service conformance shape, and shared test contract. It MUST NOT own a central cross-scenario command-execution table or scenario business transaction.
- My-Chat owns scenario selection/routing, authenticated host identity, stable idempotency-key transport, retry/correlation, and Workflow Step orchestration. It does not resolve scenario role/scope/target, canonicalize scenario business payloads, decide state transitions/`already_satisfied`, or store scenario CommandExecution as business truth.
- Each scenario persists its own `<Scenario>CommandExecution` in the same database transaction as its canonical mutation. Nurture implements `NurtureCommandExecution`; another scenario implements its own local execution record under the same behavioral contract.
- Central persistence is forbidden because it would separate the execution receipt from the scenario mutation and recreate the cross-database atomicity gap B2 is intended to close.

Identity and host mapping:

- The logical generic uniqueness namespace is `(scenarioKey, workspaceId, commandRequestId)`. In a scenario-local database/table the scenario key is implicit, so Nurture may enforce `(workspaceId, commandRequestIdHash)`.
- Existing `WorkflowCommandMeta.idempotency_key` is the generic host transport field from which a stable `invocationRequestId` can be mapped. When one invocation maps to one scenario command, the `commandRequestId` SHOULD reuse that value unchanged/opaque.
- If one invocation intentionally fans into multiple independently committed scenario commands, orchestration MUST derive stable child request IDs from the parent identity plus a declared child scope/command key. Multiple effects committed in one atomic command MUST NOT be mistaken for independent commands merely because they affect multiple rows or targets.
- My-Chat must not regenerate the scenario request ID on worker retry. A user-visible new business action/resend gets a new scenario command identity.

Hash responsibility split:

- The shared layer provides a versioned canonicalization/hash interface and same-key/same-hash versus same-key/different-hash behavior. It does not define one universal business DTO.
- Each scenario command contract supplies its schema-validated canonical DTO, effect-bearing fields, target refs/expected versions, set-versus-ordered-array semantics, and command-specific convergence rules.
- This shared contract is not a command router, business rules DSL, authorization engine, LLM orchestration layer, or central audit product.

Cross-scenario behavior:

- A handoff from Scenario A to Scenario B does not reuse Scenario A's execution row. Scenario B derives/receives a stable downstream command request identity and commits its own local CommandExecution with its own canonical mutation, then returns the handoff receipt.
- Shared conformance tests MUST prove host pass-through/retry stability while scenario tests prove local transaction atomicity and command-specific hash/state semantics.
- B2-B2a below locks invocation/command/process/effect identity and the concrete `commandRequestId` lifecycle. B2-B2b then locks Nurture uniqueness/hash storage and canonical payload-hash field inclusion/exclusion/versioning; B2-C is the next concurrency/result-storage decision.

R8-B2-B2a invocation/command identity lifecycle is locked:

```ts
type ScenarioCommandIdentity = {
  invocationRequestId: string;
  commandRequestId: string;
  commandKey: string;
  originInvocationRequestId: string;
  parentCommandRequestId?: string;
};
```

Four identity layers:

| Identity | Meaning | Owner/lifetime |
| --- | --- | --- |
| `invocationRequestId` | One stable inbound invocation, including its transport/worker retries | Entry owner creates it; My-Chat interaction/client IDs, API idempotency keys, Workflow Step keys, and stable job/event IDs map here |
| `commandRequestId` | One independently atomic and replayable scenario state change | Scenario binds/interprets it; persists through Prepare/clarification until first committed result |
| process/aggregate ref | The long-lived domain object or workflow being changed | Scenario domain, for example `NurtureChildCareProcess`; never replaced by a command ID |
| effect key/ref | A child row, receipt, task, artifact, or other command effect | Owning domain uses it for effect-level uniqueness; it is not a second command unless it has an independent commit/retry boundary |

Lifecycle and derivation:

- The current entry owner MUST supply a stable `invocationRequestId`. My-Chat maps message/form/action client identity into it and preserves it on infrastructure retry; it does not decide whether a Nurture command exists.
- Nurture binds a `commandRequestId` only after it identifies a potential command. A read-only answer or unresolved non-command interaction has no command execution identity.
- One invocation + one atomic command SHOULD use `commandRequestId = invocationRequestId`. This is semantic reuse, not a claim that invocation and command mean the same thing.
- If one invocation produces several independently committed/retried commands, Nurture/orchestration derives each child ID deterministically from the parent invocation/command identity plus a stable declared `commandKey`/target key. Independent commands cannot share an ID.
- If one command transaction writes many recipients, rows, receipts, handoff snapshots, or tasks, those are effects under one command identity. They keep their own domain/effect keys but do not receive child command IDs solely because their count is greater than one.
- Prepare/clarification MAY bind a command ID before Execution exists. The Nurture `scenarioToken` carries that ID across later invocations; those invocations get new invocation IDs while the pending command ID remains stable.
- A command identity ends at its first committed `NurtureCommandExecution`. Later approval, correction, redaction, resend, reminder, repeated append, or other new state transition MUST use a new command ID, even when it belongs to the same process/aggregate.
- An abandoned/expired Prepare consumes no Execution identity. A concurrent final confirmation race uses the same command ID: the first committed canonical hash wins; exact repeat replays and a different finalized command conflicts.

Cross-scenario validation:

- Education assignment publication may create many recipient rows in one transaction and therefore remains one publish command with many effects. Per-image submission uploads can be independent commands because each image has its own retry/commit boundary. Grading and feedback release are later commands over the same assignment/submission process.
- ERP payment `submit`, `approve`, and `confirm` are separate commands, actors, authorization checks, and expected-version transitions over one `PaymentDoc` process. Voucher posting may atomically create multiple downstream work items as effects; acting on each work item later creates a new command.
- These cases prove that target/effect count does not determine command count. Atomic commit and independent replay are the decision rule.

Nurture application:

- A direct one-child daily-care write normally reuses its invocation ID as command ID.
- A class input committed per child or bounded chunk derives stable child/chunk command IDs; a genuinely atomic class command retains one command ID.
- A family-care message plus its receipt/event/handoff snapshots remains one command when committed together. Explicit resend/remind is a later command.
- Nurture execution persistence MUST retain the command identity and its origin lineage in non-sensitive normalized/hash form; B2-B2b will lock exact columns, hash namespace/version, and canonical payload fields.

Required tests:

- one invocation/no command, one invocation/one command with value reuse, one invocation/many same-transaction effects, one invocation/multiple independently committed child commands, and multiple invocations/one pending command before commit;
- new command after prior commit on the same process, deterministic child-ID retry, exact final-confirmation replay, and same pending ID with different finalized command conflict;
- Education-style atomic recipient fan-out and ERP-style multi-transition process conformance fixtures in the shared contract suite, without importing either domain vocabulary into the generic runtime.

R8-B2-B2b key/hash/storage contract is locked:

```ts
type NurtureCommandExecutionIdentityFields = {
  workspaceId: string;
  commandRequestIdHash: string;
  originInvocationRequestIdHash: string;
  parentCommandRequestIdHash?: string;
  requestIdentityHashVersion: 1;
  commandKey: string;
  commandContractVersion: number;
  payloadHash: string;
  payloadCanonicalizationVersion: 1;
};
```

ID validation and storage:

- Raw `invocationRequestId` and `commandRequestId` values MUST be opaque bounded ASCII identifiers accepted by the shared contract, using the production shape `^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$`. Human prose, request bodies, email/phone/name values, or other PII-bearing strings are forbidden as IDs.
- Nurture MUST NOT persist raw invocation/command IDs in `NurtureCommandExecution`, audit metadata, logs, or outbox payloads. It stores lowercase 64-character SHA-256 hex values and safe execution/correlation refs only.
- Version 1 command identity hashing is `sha256(utf8("nurture.command-request.v1\0" + workspaceId + "\0" + normalizedCommandRequestId))`, where `\0` denotes one NUL separator byte. Invocation lineage uses a separate `nurture.invocation-request.v1` namespace; parent command hashes reuse the command namespace.
- Nurture enforces `UNIQUE(workspaceId, commandRequestIdHash)`. `commandKey`, target, process/aggregate ref, actor, and payload hash MUST NOT be added to that uniqueness key; reusing one ID for a different business command is a conflict, not a second valid row.
- Namespaced SHA-256 is sufficient only while IDs remain opaque/high-entropy system identities under the validation rule. If a future integration must accept arbitrary/low-entropy external keys, it must introduce a new keyed-HMAC identity-hash version rather than weakening v1 or persisting raw values.

Canonical payload fingerprint:

- A command specification first schema-validates and normalizes its semantic request DTO, including explicit null/omission policy, decimal/date representation, set sorting/deduplication, ordered-array preservation, and immutable ref/version/checksum shape. The shared layer then applies versioned canonical JSON serialization and SHA-256.
- Version 1 payload hashing is domain-separated as `sha256(utf8("nurture.command-payload.v1\0" + canonicalJson))`, with the same single NUL separator convention.
- Every Execution stores `commandContractVersion` and `payloadCanonicalizationVersion`. Replaying an existing ID uses its stored versions; canonicalizers required by an execution inside the supported replay-retention window cannot be removed.

The semantic fingerprint MUST include:

- `commandKey`/scope and `commandContractVersion`;
- authenticated actor ref plus effective Nurture role/scope refs used to submit the command;
- resolved target/process refs and every expected aggregate/object version that constrains the write;
- normalized effect-bearing business payload, including semantic set/order distinctions;
- immutable attachment/content refs plus version/checksum; finalized AI-generated content itself or an immutable content ref + version/hash when it becomes business data;
- requested distribution/activation intent when it changes committed receipts/handoff snapshots/effects;
- client/business `occurredAt` only when the command contract treats that time as canonical business input.

The semantic fingerprint MUST exclude:

- invocation/command IDs, parent IDs, conversation/turn/correlation/causation/trace IDs;
- worker attempt, retry count, lease, deadline, queue, network, and transport fields;
- client surface, render/display state, locale-only presentation fields, and My-Chat shell metadata;
- server-generated execution/event/outbox/artifact IDs, `createdAt`, processing time, and delivery/provider results;
- model provider, model/prompt/cache/token/cost telemetry when it does not alter the finalized business payload;
- current dynamic authorization, grant status, target lifecycle state, or other database state read during Execute. These remain deterministic preconditions and replay-visibility checks, not request identity.

Lookup, replay, and conflict behavior:

| Existing execution | Incoming payload | Result |
| --- | --- | --- |
| none | valid | Run current preconditions and attempt one transaction; identity is consumed only if Execution + effects commit |
| same key hash | same canonical payload hash | Return immutable Execution with `disposition=replayed`; do not rerun mutation/model/remote work |
| same key hash | different canonical payload hash, command/version, actor/scope, target, or expected version | Return `idempotency_conflict`; disclose no inaccessible target/body details |
| different key hash | same payload | Treat as a new command; command spec alone may return committed `already_satisfied` |
| no committed Execution after invalid/blocked/conflict/error | corrected request using same ID | ID remains unconsumed and may execute; first successful commit establishes the immutable hash |
| concurrent different requests using one ID | both initially see none | Unique constraint/transaction winner commits; loser reloads and returns replay only on exact hash, otherwise conflict |

Required B2-B2b tests:

- ID shape/length rejection, raw-ID non-persistence/log redaction, workspace-separated hashes, namespace/version separation, and unique-key conflict across command keys/targets;
- canonical object-key stability, explicit null/omission behavior, decimal/date normalization, unordered-set equivalence, ordered-array difference, attachment/content version changes, and finalized AI-content changes;
- exclusion stability for trace/retry/surface/model telemetry and generated timestamps/IDs;
- same-key/same-hash replay, same-key/different-hash conflict, same-payload/new-key behavior, unconsumed failed attempt correction, and concurrent first-commit-wins;
- replay across a supported command/canonicalizer deployment version and a gate preventing removal of still-retained canonicalizers.

R8-B2-C simplified MVP execution/concurrency/result contract is locked:

```ts
type NurtureCommandExecution = {
  id: string;
  workspaceId: string;
  commandRequestIdHash: string;
  originInvocationRequestIdHash: string;
  parentCommandRequestIdHash?: string;
  requestIdentityHashVersion: 1;
  commandKey: string;
  commandContractVersion: number;
  payloadHash: string;
  payloadCanonicalizationVersion: 1;
  businessActorRef: string;
  businessOutcome: "applied" | "already_satisfied";
  outputRefs: DomainContextRef[];
  handoffSnapshotSchemaVersion: 1;
  handoffRequestSnapshotsPayload: ScenarioHandoffRequestSnapshot[];
  handoffDriverRef?: DomainContextRef;
  committedAt: string;
};

type NurtureCommandSpec<Input, Result> = {
  commandKey: string;
  contractVersion: number;
  canonicalize(input: Input): unknown;
  checkPreconditions(tx: NurtureTransaction, input: Input): Promise<CommandDecision>;
  apply(tx: NurtureTransaction, input: Input): Promise<Result>;
  toOutputRefs(result: Result): DomainContextRef[];
};
```

MVP ownership and scope:

- IIA implements one Nurture-owned database Execution table/repository/runner plus command specifications. It does not build a standalone idempotency service or a central/shared execution database.
- `businessActorRef` is the domain actor whose action is being executed and is part of the canonical payload. The My-Chat worker/service principal comes from authenticated service context and technical audit; it is not a second persisted business actor field and does not change command identity during retry/reconciliation.
- Execution stores immutable outcome, bounded refs-only `outputRefs`, required versioned handoff snapshot JSON, and conditional driver provenance. It stores no message/attachment body, full scenario response, current visibility decision, provider response, model output copy, or mutable host state. Existing canonical Nurture objects remain content/business truth; the Execution JSON is only activation replay truth.
- IIA does not delete Execution rows. Partitioning, archival, compact tombstone jobs, and configurable retention are deferred until volume evidence and product/legal retention rules exist. Deletion MUST NOT be introduced later without preserving duplicate-prevention semantics.

Execution algorithm:

1. Authenticate the caller/service context, validate workspace access and ID shape, schema-validate the command, normalize its semantic DTO, and compute identity/payload hashes outside the transaction. Model calls, attachment upload, remote owner reads, and other remote work have already produced immutable refs and cannot run in the transaction.
2. Perform an authorized fast lookup by `(workspaceId, commandRequestIdHash)`. If Execution exists, compare the stored command/version/payload hash and return exact replay or safe `idempotency_conflict`; user output still passes current visibility/presenter checks.
3. If missing, begin one short Nurture Postgres transaction and call `pg_try_advisory_xact_lock` with a deterministic signed 64-bit key derived from the already namespaced workspace + command hash. Failure returns internal retryable `command_busy`; it writes no Execution/effect and retries later with the same command identity using bounded backoff.
4. After acquiring the lock, re-read Execution inside the transaction. A waiter/retry that now finds the winner returns replay/conflict without executing the command specification.
5. Re-read and validate current business actor, role/scope, target, grant dependencies, lifecycle states, and expected versions. These checks are deterministic and transaction-local.
6. Run command-specific conditional updates/inserts. State-machine mutations use expected aggregate/object version plus expected lifecycle state. Append effects use stable effect IDs/keys and do not invent a shared aggregate lock when the command contract does not require one.
7. For multi-object invariants, read/lock rows in stable `(objectType, objectId)` order. Class/batch work remains per child or bounded chunk so transactions and `outputRefs` remain bounded.
8. Validate the bounded/versioned handoff snapshot array. Non-empty requires the prevalidated service-authenticated Workflow Step driver; missing/invalid driver rolls back with no Execution/effect. Persist business effects, local receipts/events, snapshot JSON/driver provenance, and final immutable Execution in the same transaction. Execution is written only after a successful command result is available, but the command advisory lock serializes same-ID contenders until commit/rollback.
9. Commit, then dispatch remote host/provider work. A response lost after commit is recovered by fast replay. A rollback leaves no Execution and no business effect.

Concurrency semantics:

- Same command identity: command advisory serialization + double Execution lookup yields one committed result. Exact duplicates replay; different canonical payloads conflict.
- Different command identities on one target: command locks do not serialize them. Expected-version/state predicates select the winner; the loser may commit `already_satisfied` only when its command specification explicitly declares the observed state convergent, otherwise it returns an uncommitted business conflict.
- Advisory-key collision can only serialize unrelated commands temporarily; it cannot merge identities because replay still uses the full 256-bit persisted hash and workspace uniqueness.
- Lock acquisition, database serialization, deadlock, and transient connection failures are retryable technical outcomes handled by bounded caller/worker retry with the same command identity. IIA does not add a generic automatic transaction-retry state machine.
- Lock order is command identity first, then command-spec target rows in stable order. Remote calls and unbounded batch loops are forbidden while locks are held.

Replay and result behavior:

- Fast replay is allowed only after basic caller/service authentication and workspace boundary checks; it must not become an execution-existence oracle for unauthorized callers.
- User-facing replay resolves stored output refs through current Nurture authorization, redaction, grant, and presenter rules. Inaccessible/redacted output returns safe processed/unavailable state without body or target disclosure.
- Trusted Workflow Step/B1 reconciliation may read immutable output refs and handoff-request snapshots under an explicit service purpose. It cannot mutate the Execution, replace `businessActorRef`, or expand effects.
- `outputRefs` are contract-validated, bodyless, immutable as an Execution result, and bounded by each command specification. Later corrections/redactions append new domain actions and do not rewrite the old Execution.

Required B2-C tests:

- fast exact replay and same-key/different-hash conflict without advisory-lock acquisition;
- two same-key concurrent transactions with one applied Execution and one replay, plus different-payload contender conflict;
- advisory-lock busy -> no write -> bounded same-ID retry; rollback releases lock and leaves no Execution/effect;
- two different command IDs racing one expected target version, including explicit convergent `already_satisfied` and non-convergent conflict cases;
- stable multi-object lock order, bounded child/chunk batch behavior, response-lost-after-commit replay, and no remote/model call inside the transaction;
- technical service-principal retry preserving `businessActorRef`, unauthorized replay non-disclosure, replay after grant/access/redaction change, and trusted reconciliation refs-only access;
- schema/serialization tests proving Execution is immutable, bodyless, unique by workspace + command hash, and retained without an IIA deletion path.

B2 closure:

- B2-A1/A2, B2-B1, B2-B2a/B2-B2b, and B2-C now define one implementable Nurture-wide command kernel with a thin reusable behavioral contract.
- Deferred items are not IIA blockers: HMAC identity version, partition/archive/tombstone jobs, multi-database implementations, Redis/distributed locks, generic reservation/attempt/processing tables, generic rules/lock DSLs, and a universal transaction retry engine.
- Historical sequencing note: B3 durable family-input routing/clarification was the next blocker at this point and is now closed by B3-A/B/C1/C2a-e plus D-054/D-057 refinements.

R8-B3-A durable routing/clarification ownership is locked:

- IIA MUST NOT add `NurtureFamilyCareRouting`, `NurtureFamilyCareClarification`, or a generic routing/clarification platform. Their proposed state duplicates existing Receipt and Item/Event authorities.
- `NurtureFamilyCareMessage` owns canonical content/lifecycle only. `NurtureChildLinkReceipt(direction=family_to_org)` is the durable visible routing lifecycle from that source to one logical institution/care-group target. `NurtureFamilyCareItem` is the resulting teacher-work aggregate; `NurtureFamilyCareItemEvent` is its append-only action and clarification history.
- `NurtureInteractionContext` and `scenarioToken(purpose=clarify)` continue to own only short resolver ambiguity before or during the current interaction. They cannot represent a family response awaited for hours/days.

Receipt refinement:

```ts
type FamilyToOrgReceiptRouteFields = {
  sourceType: "family_care_message";
  sourceId: string;
  routingAttemptKey: string;
  direction: "family_to_org";
  grantId?: string;
  dataClass?: string;
  targetScopeType?: "care_group" | "enrollment" | "institution";
  targetScopeId?: string;
};
```

- The source family-message command persists the canonical message plus a stable logical receipt in the same B2 transaction. If current grant/data-class/target resolution and item creation are complete in that command, the receipt may start as `delivered`; otherwise it starts `pending`.
- `pending` may temporarily omit grant/data-class/target fields because B1 already defines unresolved target/release work as pending. This supersedes the IB table's unconditional required flags for those fields.
- `delivered`, `read`, and `acknowledged` require complete route fields, current matching grant/enrollment/scope, and a teacher target surface that can read the resulting item. My-Chat activation is irrelevant to this transition.
- `blocked`/`failed` preserve safely resolved route fields and a safe reason code but may remain partial. They cannot expose an inaccessible institution/care-group target to the family presenter.
- Receipt identity is `UNIQUE(workspaceId, direction, sourceType, sourceId, routingAttemptKey)`. Nullable grant/data-class/target fields are not identity. Infrastructure retry reuses the key; a deliberate independent target route derives a new stable key.

Long-running teacher clarification:

- Add `waiting_for_family` to `NurtureFamilyCareItem.status` and an optimistic `version` required by B2.
- A caregiver-confirmed `request_clarification` command atomically transitions `open|acknowledged -> waiting_for_family`, appends `clarification_requested`, writes the family-facing message and `org_to_family` receipt, and returns optional activation snapshot refs.
- The clarification-request event stores the related family-facing message ref. AI/system draft text cannot be attributed to a named caregiver until that action is confirmed.
- A later family-authored response message identifies the item through a valid scenario token or resolver/business-memory recovery. Its B2 command atomically writes the message and `family_to_org` receipt, transitions `waiting_for_family -> open`, appends `clarification_received`, and correlates to the request event.
- `clarification_expired` and `clarification_cancelled` close the active wait cycle and normally return the item to `open` for teacher decision; they do not silently close the underlying item. The item itself may separately expire/close under its command policy.
- Multiple rounds are represented by repeated correlated ItemEvents. `linkedReplyMessageId` is only a latest-reply convenience ref; events are the history. A dedicated clarification aggregate is deferred until simultaneous questions, partial field answers, per-guardian answers, independent SLA/assignment, or clarification-specific reporting is proven necessary.

Required B3-A tests:

- message and pending/delivered receipt atomicity, stable receipt routing key replay, pending nullable route fields, and delivered/read/acknowledged completeness constraints;
- blocked/failed partial-route non-disclosure, grant revoke fences, and My-Chat activation failure independence;
- request clarification atomic item/event/message/receipt transition, family response correlation from same/new conversation, repeated clarification rounds, expiry/cancel returning teacher attention, and concurrent stale item-version rejection;
- no new Routing/Clarification model or duplicate lifecycle in schema/runtime contracts.

B3-A leaves pending-receipt driving/recovery to B3-B below, which closes it through direct atomic delivery or host-first durable Run/Step and explicitly rejects a Nurture transport outbox/global pending scanner.

R8-B3-B host-first durable driver and recovery contract is locked:

- IIA MUST NOT add `listPendingScenarioWork`, a cross-scenario polling registry, a Nurture transport outbox/worker, or reuse host activation Handoff as Nurture-internal routing. Current My-Workflow-Base/My-Chat already own durable Workflow Run/Step, claim/lease, retry, and worker dispatch; B3 reuses that runtime.
- A simple family input whose participant/child/data-class/target/grant and bounded classification are already resolved MAY execute one B2 command that atomically commits `NurtureFamilyCareMessage` + `NurtureFamilyCareItem` + `NurtureChildLinkReceipt(status=delivered)` + events/Execution without a Workflow Run only when activation intent is absent and the Execution stores explicit `handoffRequestSnapshotsPayload=[]`.
- If that otherwise-synchronous route requests notification, unread/badge, notification-center, deep-link, or any other durable host activation, My-Chat MUST create the lightweight durable Run/Step before invoking Nurture. Business routing remains synchronous, but the host Step is required to eliminate orphan replay seeds.
- Any route that requires asynchronous AI/attachment work, institution review, delayed release, or another independently retryable step MUST be host-first: the My-Chat Workflow Run and driving Step are durably created before a Nurture command may commit a pending receipt.

Host ingress and canonical ownership:

- My-Chat persists the host `ChatMessage` with its client-message idempotency identity as generic conversation continuity. For a Nurture-bound family input, Nurture resolver receives the authenticated invocation/body plus an opaque versioned host message ref.
- Resolver may return read-only output, structured short clarification, blocked, a simple immediate command, or a generic workflow-start instruction naming only the registered Nurture capability/entrypoint and opaque scenario refs. My-Chat does not infer family role, child, data class, grant, target, or route topology.
- When workflow start is selected, My-Chat atomically creates the Run/Steps under the pinned manifest/contract before capture. The worker queue carries host/Nurture refs and workflow identity only, never the family message body.
- The capture handler uses an authorized owner adapter to read the current host message ref, then a B2 command writes the Nurture canonical child-scoped message and receipt. After capture, route/classification steps read Nurture refs; My-Chat ChatMessage remains host conversation input, not Nurture business truth or policy/query state.
- My-Chat redaction/unavailability before first capture causes safe retry/blocked/manual recovery according to current source state. Nurture redaction/lifecycle owns the copied canonical message after capture; later host lifecycle changes do not silently rewrite it.

Pending-driver contract:

```ts
type NurtureReceiptPendingDriver = {
  pendingReason:
    | "workflow_processing"
    | "awaiting_confirmation"
    | "scheduled_release";
  driverType:
    | "workflow_step"
    | "item_action"
    | "scheduled_step";
  driverRef: DomainContextRef;
  nextActionAt?: string;
};
```

- `status=pending` requires a contract-valid driver mapping: workflow processing -> already-existing host Workflow Step; awaiting confirmation -> current Nurture Item/action ref; scheduled release -> durable delayed/scheduled host Step plus `nextActionAt`.
- Driver refs are opaque provenance/continuation refs, not authorization. Every resume reloads current participant/role/scope/enrollment/grant/target/source lifecycle and B2 command preconditions.
- Receipt retains driver provenance after terminal transition for correlation, but no driver is considered active once status is delivered/read/acknowledged/blocked/failed/revoked-after-delivery.
- Receipt MUST NOT store worker id, claim token, lease, queue job id, attempt count, retry timestamp, DLQ state, or provider status. Those remain host Workflow Step/worker evidence.
- `waiting_for_family` is Item state driven by a future family action, not a continuously pending worker. Manual-review items are visible teacher work and may already have a delivered receipt; they do not remain logically undelivered merely because a human has not acted.

Crash/recovery matrix:

| Failure point | Durable recovery |
| --- | --- |
| before Run creation | No Nurture pending receipt exists; My-Chat `clientMessageId` replay restarts resolver/start safely |
| after Run creation, before capture | Existing host Step remains claimable/retryable |
| after Nurture capture commit, before host Step completion | Same Step command identity replays B2 capture result, then completes Step |
| during route/classification before Nurture commit | Host Step retries with same stable command identity; no partial Nurture route effect |
| after route commit, before host Step completion | B2 route result replay completes the host Step without duplicate Item/Receipt transition |
| optional notification failure | B1 host activation recovery only; delivered Receipt and Item remain valid |

Shared-base and implementation gaps:

- No new pending-work API is required. My-Workflow-Base only needs a conformance invariant that pending scenario business state has an already-durable driver or a canonical user/action wait object.
- My-Chat must expose an authorized owner-read adapter for a versioned host ChatMessage ref and wire Nurture resolver workflow-start output to existing `start_run`/pinned Step topology. This is host integration work, not Nurture business-state ownership.
- Workflow Step reconciliation already defined by B1/B2 handles the cross-database completion gap. A command that creates an asynchronous pending receipt outside a registered durable Run/Step must fail validation.

Required B3-B tests:

- simple atomic direct-delivery path creates no Run/pending state; async path proves host Run/Step exists before pending Receipt commit;
- queue payload/body inspection proves refs-only transport while capture owner-read copies the host message into Nurture canonical storage;
- each crash-matrix point converges through Step retry + B2 replay without duplicate message/item/receipt or orphan pending state;
- pending driver type/reason/ref/nextAction completeness, current-state revalidation, and prohibition of queue/lease/attempt/DLQ fields in Receipt;
- waiting-for-family consumes no worker lease, manual-review item remains delivered/visible, and optional activation failure remains independent;
- contract/schema scans prove no Nurture outbox/worker, Handoff misuse, `listPendingScenarioWork`, or generic polling platform.

B3-C1 below locks status ownership inside Nurture. B3-C2a-d lock revoke/redaction/cancel/clarification transitions for pending receipts and waiting items; B3-C2e then closes technical exhaustion and Admin recovery.

R8-B3-C1 lifecycle-status ownership boundary is locked:

| Layer | Status owner | Contract examples |
| --- | --- | --- |
| Host technical execution | My-Chat Workflow Runtime | Workflow Run/Step claim, waiting, retry, completion, failure, manual review |
| Host activation | My-Chat Handoff | `requested`, `completed`, `stopped`, `failed` under B1 |
| Reusable command protocol | Scenario Command Contract | response `executed/replayed`; committed outcome `applied/already_satisfied` under B2 |
| Logical care distribution | Nurture | `NurtureChildLinkReceiptStatus` + Nurture reason codes |
| Teacher/family work | Nurture | `NurtureFamilyCareItemStatus` + ItemEvent types |
| Short resolver continuation | Nurture | InteractionContext/scenario-token purpose and staleness states |

Shared-base limits:

- My-Workflow-Base MAY define behavioral invariants: nonterminal scenario business work has a durable driver or canonical user/action continuation; host Step terminality does not directly mutate scenario business state; cross-database recovery is idempotent; transport is refs-only; and scenario owner rereads current authorization/lifecycle before action.
- My-Workflow-Base MUST NOT define generic `delivered`, `read`, `acknowledged`, `waiting_for_family`, `revoked_after_delivery`, `expired`, `cancelled`, `blocked`, or scenario reason-code semantics. Similar words in another scenario do not imply the same business meaning.
- The base MUST NOT define a universal business `DriverType` enum. Nurture may locally use `workflow_step`, `item_action`, and `scheduled_step` because those values describe its own continuation policy; another scenario may choose different driver categories while still using opaque `DomainContextRef` values.
- IIA does not add a normalized cross-scenario lifecycle class for analytics or host branching. If later observability needs one, it must be a scenario-declared projection and cannot become business authority.

Consumption boundary:

- My-Chat MUST NOT branch on Nurture business values, for example `if receipt.status == blocked`. It may branch only on its own Run/Step/Handoff state or on generic structured UI/action payloads produced by Nurture.
- Nurture presenter maps current Receipt/Item/Event state into safe scenario responses, options, forms, badges, or unavailable states. My-Chat renders those primitives without interpreting the underlying status.
- My-Chat Admin may inspect host technical state and opaque Nurture refs. Nurture Admin presenter/actions decide which business recovery commands are available; host Admin cannot edit Nurture status directly.

Conformance tests:

- shared tests verify durable-driver presence, refs-only payloads, retry/replay stability, no host direct scenario mutation, and owner revalidation;
- Nurture tests alone verify Receipt/Item/Event enums, reason codes, transition legality, presenter mapping, revoke/redaction behavior, and manual recovery commands;
- schema/manifest scans fail if Nurture business statuses are added to My-Workflow-Base/My-Chat generic runtime contracts or if host code branches on them.

B3-C2a-d define the Nurture-specific transition matrix for revoke, source redaction, pre-delivery cancel, post-delivery withdrawal, and clarification expiry/cancel. B3-C2e will complete technical exhaustion and Admin recovery. None of these decisions alter the shared pipeline state machine.

R8-B3-C2a-d Nurture revoke/redaction/cancel/clarification transitions are locked:

Grant revoke:

| Current Nurture state | Revoke result |
| --- | --- |
| Receipt `pending` | `blocked(reason=grant_revoked)` |
| Receipt `delivered/read/acknowledged` | `revoked_after_delivery(reason=grant_revoked)`; retain historical timestamps |
| Receipt `blocked/failed/revoked_after_delivery` | Idempotently unchanged |
| Active grant-dependent Item | `suppressed(reason=grant_revoked)` + suppression event |
| Item `waiting_for_family` | Append correlated `clarification_cancelled(grant_revoked)`, then suppress |
| Item already `closed/expired/suppressed` | Keep historical workflow status; current grant fence still denies content/action access |

- Grant revoke stops future access, actions, pending routing, stale token/deep-link submission, context reuse, and activation. It does not change `NurtureFamilyCareMessage.status` to redacted or claim to recall human memory.
- The revoke command atomically revokes the grant and updates bounded active dependent receipts/items for the child scope. If historical projections converge later, all owner reads/actions still fail closed immediately against the current grant.
- Institution/My-Chat Admin cannot reactivate a revoked family grant. A future relationship creates a new grant identity.

Source redaction:

- Redaction makes source Message body/attachments unavailable, records redaction actor/reason/time, and preserves an audit shell.
- Pending receipts become `blocked(source_redacted)`; delivered/read/acknowledged receipts become `revoked_after_delivery(source_redacted)` without erasing historical timestamps.
- Active source-derived Items become `suppressed(source_redacted)`. `detail` and direct attachment refs become unavailable; `summary` becomes a fixed safe placeholder or is otherwise withheld by the owner presenter. Closed/expired Items retain workflow history but expose only an unavailable shell.
- Source-derived AI classifications/candidates/context projections are invalidated. My-Chat stops pending activation and old deep links reread unavailable owner state; already-sent provider copies cannot be claimed as physically recalled.
- Redaction does not mechanically delete a separately confirmed canonical care fact with its own authority/lifecycle. Unconfirmed source-derived candidates are invalidated; confirmed facts require their own correction/revoke/retention command and lose access to the redacted source body.

Cancel, withdraw, correction, and resend:

```text
cancel_route     = pre-delivery route cancellation
withdraw_item    = post-delivery stop-future-work action
redact_message   = source readability removal
correct_message  = append-only correction
```

- `cancel_route` transitions `pending -> blocked(user_cancelled_before_delivery)` using expected Receipt version. It suppresses any not-yet-visible Item, commits before asking the host to stop its Step, and does not redact the family Message.
- Once Receipt is delivered/read/acknowledged, cancellation cannot rewrite it as unserved. `withdraw_item` closes current Item work with `ItemEvent(reason=family_withdrawn)` while Receipt remains historical. Content removal uses redaction instead.
- Correction appends a new Message and ItemEvent/Item relationship; it never overwrites the original body. A deliberate resend/re-route is a new B2 command and new `routingAttemptKey`; technical retry retains the old key and blocked receipts do not reopen.
- Cancel-versus-route races use Receipt version/state: cancel winner blocks route; delivery winner makes `cancel_route` conflict and presenter offers withdraw/redact/correct actions.
- Caregivers may cancel their own clarification request (`waiting_for_family -> open` + correlated event) but cannot cancel/redact the family-authored source. My-Chat Admin cannot directly execute any of these Nurture transitions.

Clarification deadline/cancel:

```ts
type ActiveItemClarification = {
  activeClarificationRequestEventId: string;
  waitingForFamilySince: string;
  waitingForFamilyUntil?: string;
  clarificationExpiryDriverRef?: DomainContextRef;
};
```

- Token TTL affects only continuation entry and never changes Item business state. Nurture may recover the current wait through Item/business memory and issue a new safe token.
- A clarification business deadline is optional and distinct from Item `expiresAt`. If present, My-Chat creates the delayed Step before the request command commits the wait and opaque expiry driver ref.
- Expiry command requires matching `waiting_for_family`, active request event, and Item version. If the Item remains valid it appends `clarification_expired`, clears active wait fields, and returns Item to `open`/teacher attention. If Item business validity also ended, it appends the event and transitions Item to `expired`.
- Teacher cancellation appends `clarification_cancelled`, clears the active cycle, and returns a still-valid Item to `open`. The already-delivered clarification Message/Receipt remain historical.
- Family-response versus expiry/cancel is first-commit-wins through active event + version. A later scheduled command returns committed `already_satisfied`.
- Late family response is not discarded or interpreted as consent. It is stored as a family Message and routed under current grant/policy; it may append correlated `clarification_received` with `late=true`, keep/reopen teacher attention where valid, but cannot revive an expired Item or bypass revoke/redaction.

Required B3-C2a-d tests:

- revoke matrix, immediate read/write fence, bounded suppression convergence, waiting clarification cancellation, retained delivery timestamps, and new-grant-not-reactivation;
- redaction body/attachment/derived-display removal, receipt revocation, deep-link/cache invalidation, and independent confirmed-fact boundary;
- pre-delivery cancel versus route race, post-delivery withdrawal, correction append-only lineage, technical retry versus user resend key identity, and no host direct transition;
- token expiry non-effect, optional deadline host-first driver, response/expiry/cancel race, Item versus clarification expiry distinction, late response handling, and no inferred consent.

R8-B3-C2e technical exhaustion and Admin recovery are locked:

| Condition | Host state | Nurture Receipt result |
| --- | --- | --- |
| Automatic technical retry continues | Step retry/attempt state | Keep `pending(workflow_processing)`; same driver/command/routing identity |
| Host retry budget exhausted | Step `manual_review_required` with evidence ref | Keep `pending`; host exhaustion alone cannot assert business failure |
| Re-evaluation finds grant/source/scope/policy termination | Host may remain manual review until reconciliation completes | `blocked` with the existing specific business reason |
| Re-evaluation finds route already committed | Step reconciliation/B2 replay | Keep delivered/read/acknowledged; never overwrite with failure |
| Re-evaluation finds recovery still possible | Admin or trusted reconciliation may retry | Keep `pending` and original identity while it remains the same technical attempt |
| Owner-authorized recovery is exhausted while business prerequisites remain valid | Exhausted/manual-review evidence retained by host | `failed(technical_recovery_exhausted)` |

Owner commands and guards:

- `reevaluate_route` reloads the current Receipt, source, grant, scope, target, Item, policy, and host evidence ref. It may converge to an existing state, return a safe recovery action, or perform a Nurture-owned blocked transition; My-Chat cannot decide the result.
- `fail_route` is the only MVP command that commits Receipt `failed`. It requires trusted service/Admin purpose, immutable exhausted/manual-review evidence ref, expected Receipt version, current `pending` state, and execute-time owner policy. The host evidence proves technical exhaustion but does not authorize the business transition.
- If delivery committed before `fail_route`, current-state/version guards plus B2 replay return `already_satisfied` or conflict. The command cannot rewrite delivered history.
- `failed` is terminal and never transitions back to pending. A deliberate recovery uses `reissue_route`: My-Chat creates a new durable Run/Step first, then Nurture uses a new command identity, `routingAttemptKey`, and Receipt with `retryOfReceiptId` pointing to the failed row.
- Technical retry before failure is not reissue: it preserves the original Step, command identity, routing key, and Receipt. This prevents duplicate items/messages while preserving a complete failure/recovery history.

Admin and presentation boundary:

- My-Chat Admin may inspect host attempts/evidence and opaque Nurture refs, reconcile or retry the current Step, and invoke Nurture-presented `reevaluate_route`, `reissue_route`, or existing `cancel_route` actions.
- My-Chat Admin cannot directly set `failed/blocked/delivered`, edit grant/dataClass/target/source refs, bypass revoke/redaction/current policy, or claim a logical delivery occurred.
- Nurture presenters map pending/manual-review/failed state into safe delayed, under-review, failed, or recovery-action UI without exposing inaccessible targets or raw host error details.
- MVP adds only `technical_recovery_exhausted` as a Receipt failed reason. Detailed provider/worker/DB errors and attempt evidence remain under the host Step; deterministic business termination continues to use existing `blocked` reasons.

Required B3-C2e tests:

- retry/exhaustion does not mirror Step state into Receipt, and optional activation failure remains irrelevant;
- manual review plus `reevaluate_route` covers blocker, already-delivered, still-recoverable, and irrecoverable branches;
- `fail_route` authorization/evidence/version guards and delivery-versus-failure race converge without history rewrite;
- failed terminality, pre-failure same-key retry, post-failure new Run/command/routing key/Receipt, and valid `retryOfReceiptId` lineage;
- Admin allow/deny actions, safe presenter output, minimal failed reason taxonomy, and host-only technical details.

R8 closure:

- B1, B2, and B3-A/B/C1/C2a-e are locked; no R8 blocker remains.
- The earlier `grantRequirement?` refinement is already resolved by the command-level `grantDependencies[]` contract and execute-time rechecks.
- AI classification/drafting, attachment upload, owner reads, and other remote work are already outside the B2-C DB transaction; Execute consumes immutable refs/hash and current local policy only.
- IIA-0 may now proceed to a contract-closure scan and design-to-implementation mapping without adding another routing, attempt, recovery, or generic business-lifecycle aggregate.

Implementation constraints retained after closure:

- Commit class/batch operations per child or bounded chunk so one child failure does not roll back unrelated child scopes.
- Ensure safe user states do not disclose inaccessible target existence; My-Chat receives only presenter output.

Typical-scenario compatibility:

| Scenario | Current assessment | Required condition |
| --- | --- | --- |
| Family sends a care-day note | Covered by B3-A/B contract; IIA implementation pending | Distinguish message accepted by Nurture from routed/delivered to teacher workflow. |
| Two teachers acknowledge concurrently | Covered by B2 contract; IIA implementation pending | Durable idempotency plus aggregate-version/conditional transition. |
| Teacher requests family clarification | Covered by B3-A/B/C2a-d contract; IIA implementation pending | Durable clarification correlation, waiting, expiry/cancel, and late-response behavior. |
| Record daily care without sharing | Compatible | Internal record and `org_to_family` share remain separate commands. |
| Confirm media without family exposure | Compatible | Internal confirmation and publish/exposure remain separate commands. |
| Grant revoked before submit/retry | Compatible by contract | Execute/retry rechecks source and distribution grant dependencies. |
| Mobile offline duplicate submit | Covered by B2 contract; IIA implementation pending | Same key/same payload replays result; same key/different payload blocks. |
| Crash after Nurture commit | Covered by B1/B2/B3-B contracts; IIA implementation pending | Scenario response/presenter can recover committed content; route Step and optional host activation must reconcile idempotently. |
| Correct already-shared care fact | Extensible | Append corrected fact/message/receipt; do not overwrite historical communication. |

## 3. Schema Design

### 3.1 Model Groups

| Group | Models | Required invariant |
| --- | --- | --- |
| Command reliability | `NurtureCommandExecution` | Every authoritative Nurture write uses one shared scenario-owned command kernel; host workflow idempotency does not replace Nurture transaction replay. |
| Interaction continuation | `NurtureInteractionContext` | Scenario tokens remain short-lived Nurture-local handles; persisted lifecycle is separate from resolver staleness/recovery outcomes and never authorizes by itself. |
| Core identity | `NurtureParticipant`, `NurtureChild`, `NurtureChildCareProcess`, `NurtureFamily` | Login identity is `myChatUserId`; care facts resolve to `childCareProcessId`; one active family per child care process. |
| Institution topology | `NurtureCareInstitution`, `NurtureCareGroup`, `NurtureEnrollment`, `NurtureCareRoleAssignment` | Teacher/admin access comes from role assignment + scope, not My-Chat account role. |
| Grant and receipt | `NurtureChildLinkGrant`, `NurtureChildLinkReceipt` | Delivered/read/acknowledged cross-role state requires active matching grant, direction, data class, enrollment, and scope; pending/blocked/failed may preserve partial resolution under B3-A. |
| Family care communication | `NurtureFamilyCareThread`, `NurtureFamilyCareThreadParticipant`, `NurtureFamilyCareMessage`, `NurtureFamilyCareItem`, `NurtureFamilyCareItemEvent` | Raw message body and item workflow state are Nurture canonical; My-Chat receives only realtime projection or opaque delivery refs. |
| Care facts and projections | `NurtureDailyCareLog`, `NurtureTeacherAttentionItem` | Daily care and attention items are child-scoped. `careGroupId` is a teacher workflow dimension only. |
| Media attribution | `NurtureMediaAssetRef`, `NurtureChildMediaAttribution` | Recognition creates candidates only; family-visible child album views require teacher confirmation and exposure policy. |

### 3.2 Enum Groups

IIA should add stable enums instead of stringly typed policy values where the values are already locked:

- Role/scope: `NurtureCareRole`, `NurtureCareScopeType`, `NurtureCareRoleAssignmentStatus`.
- Lifecycle: `NurtureParticipantStatus`, `NurtureChildStatus`, `NurtureChildCareProcessStatus`, `NurtureFamilyStatus`, `NurtureEnrollmentStatus`.
- Grant: `NurtureChildLinkGrantStatus`, `NurtureGrantDirection`, `NurtureGrantDataClass`, `NurtureGrantReceiptStatus`.
- Communication: `NurtureFamilyCareThreadStatus`, `NurtureFamilyCareMessageStatus`, `NurtureFamilyCareItemStatus`, `NurtureFamilyCareItemPriority`.
- Interaction continuation: `NurtureInteractionPurpose`, `NurtureInteractionContextStatus` (`active|consumed|revoked`).
- Care and media: `NurtureDailyCareLogStatus`, `NurtureTeacherAttentionItemStatus`, `NurtureMediaAssetStatus`, `NurtureMediaAttributionStatus`.

Use a mapping layer for institution-local labels. Do not let institution vocabulary create new grant/policy `dataClass` values in MVP.

### 3.3 Required Constraints

IIA implementation must enforce these constraints in repository logic and, where Prisma/Postgres can express them safely, in DB indexes:

- Active participant mapping: one active `NurtureParticipant` per `(workspaceId, myChatUserId)`.
- Active family mapping: one active `NurtureFamily` per `(workspaceId, childCareProcessId)`.
- Active role assignment candidate: one active `(workspaceId, participantId, role, scopeType, scopeId)`.
- Active enrollment candidate: one active `(workspaceId, childCareProcessId, institutionId, careGroupId)`.
- Family thread candidate: one active private `NurtureFamilyCareThread` per `(workspaceId, childCareProcessId, familyId, enrollmentId)`.
- Child-specific facts: message/item/log/attention/media attribution writes must include `childCareProcessId`.
- Grant receipt/routing idempotency: one receipt per `(workspaceId, direction, sourceType, sourceId, routingAttemptKey)`; nullable grant/data-class/target fields are resolved state, not identity.
- Interaction token identity: one context per `(workspaceId, tokenHash)`; raw token is absent, expiry derives from `expiresAt`, and participant/conversation lookup indexes include status + expiry.

If Prisma cannot express a partial active uniqueness requirement directly, IIA should document the DB migration SQL or enforce the invariant in repository transactions with an explicit test.

### 3.4 Existing P0 Table Coexistence

Current Prisma already contains P0 family workflow tables such as profile snapshots, family charter, context material, workflow project/capture/review, and workflow ledger tables. IIA should add institution ecology models alongside them. Do not rewrite P0 tables as part of IIA unless a migration plan is explicitly approved.

## 4. Resolver and Policy Design

### 4.1 Resolver Inputs

All policy checks should normalize through one actor-context resolver. The resolver input is limited to host invocation facts, current payload, generic display state, and Nurture-issued opaque tokens:

```text
host:
  myChatUserId
  workspaceId?
  scenarioKey
  surface
  hostRequestId
  submittedAt?
  locale?
  timeZone?

conversation?:
  hostConversationRef?
  hostTurnId?
  previousTurnRef?

event:
  kind: chat_message | surface_open | scenario_token_event | form_submit | notification_open

payload?:
  text?
  structuredPayload?
  formData?
  attachmentRefs?

scenarioToken?:
  token
  purpose: clarify | submit_action | open_notification

displayState?:
  selectedViewKey?
  filters?
  sort?
  pagination?
  clientLocalContext?

idempotency?:
  hostRequestId?
  clientMutationId?
  attemptKey?
```

Resolver inputs must not include host-authored `targetRef`, `workScopeHint`, `selectedRoleAssignmentId`, `childCareProcessId`, `careGroupId`, `institutionId`, `grantId`, `dataClass`, `direction`, or policy decisions. If a rendered Nurture UI needs to resume a target/action/scope, Nurture must issue a `scenarioToken` and resolve it on the next call.

Resolver result shape:

```text
status: resolved | needs_clarification | blocked

actor:
  participantId
  myChatUserId

role:
  roleAssignmentId?
  roleKind?
  scopeType?
  scopeId?

workScope:
  kind: child_process | family | care_group | institution
  childCareProcessId?
  familyId?
  careGroupId?
  institutionId?
  enrollmentId?

target?:
  objectType
  objectId
  childCareProcessId?
  lifecycleState

continuity:
  nurtureInteractionContextId?
  pendingIntent?
  clarificationState?

clarification?:
  scenarioToken?
  interactionKind?
  reasonCode?
  optionCount?
  fieldCount?

policySeed:
  dataClass?
  direction?
  actionKey
  decisionReasonCode?
```

Resolver output consumers:

- The output is consumed by Nurture capability handlers, policy, query/projection services, command/workflow action services, presenters, and interaction context management.
- The output is not consumed directly by My-Chat and is not a write authorization result.
- Every render, action, and write uses resolver output as normalized context, then applies policy and object-current-state checks before returning data or mutating state.
- Child-specific writes must have `childCareProcessId` either in `workScope` or `target`; collection surfaces may resolve to `care_group` or `institution` first and let policy-scoped queries fetch child rows.

### 4.2 Surface Rules

- `mobile_chat`: My-Chat must not select or pass a trusted Nurture role. Nurture resolves role/scope from target context, short-lived interaction context, or Nurture business memory; asks clarification when ambiguous; or returns a safe scenario-level response.
- `mobile_dashboard`, `teacher_board`, `admin_board`, `web_workbench`: the surface may pass generic display state and a Nurture-issued `scenarioToken`. Nurture resolves any role assignment, work scope, target object, and policy state from the token plus current business facts.
- `notification_deeplink`: My-Chat may pass host delivery bookkeeping and a Nurture-issued `scenarioToken`; Nurture must re-resolve participant, role assignment, object status, grant state, message redaction, and item status before rendering or mutating.

### 4.3 Policy Predicates

| Policy | Allow when | Fail-closed reasons |
| --- | --- | --- |
| `nurture.can_view_child_care_process` | Active participant has guardian/caregiver/admin role whose scope reaches the child process and exposure policy allows it. | `participant_missing`, `role_missing`, `scope_mismatch`, `child_not_visible`. |
| `nurture.can_write_family_care_message` | Active thread participant has valid backing role assignment; thread is active; child process is visible; message lifecycle allows write. | `thread_inactive`, `role_revoked`, `message_redacted`, `child_not_visible`. |
| `nurture.can_receive_family_context` | Caregiver scope matches enrollment/care group; grant is active with `family_to_org` and matching `dataClass`. | `grant_missing`, `grant_revoked`, `data_class_mismatch`, `enrollment_inactive`. |
| `nurture.can_share_to_family` | Caregiver/admin scope is valid; grant is active with `org_to_family` and matching `dataClass`; family thread is visible. | `grant_missing`, `grant_revoked`, `family_thread_missing`, `data_class_mismatch`. |
| `nurture.caregiver_scope` | Caregiver/lead caregiver targets an active enrollment or care group assignment they hold. | `care_group_mismatch`, `enrollment_inactive`, `role_missing`. |
| `nurture.can_confirm_media_attribution` | Caregiver/admin is scoped to asset institution/care group; candidate child is enrolled or explicitly authorized. | `asset_scope_mismatch`, `child_not_enrolled`, `exposure_policy_missing`. |

Policies should return structured decisions, not booleans only, so handlers can write receipts, item events, audit shells, and safe UI states.

## 5. Capability Design

Teacher mobile is the primary execution surface for first-slice institution ecology. It composes the capabilities below, but each capability remains independently declared, authorized, tested, and evolved.

Implementation order is not the same as capability membership. IIA includes all four first-slice capabilities in the manifest contract, while implementation starts with the `class_family_inbox` + `teacher_attention_board` closure.

### 5.1 `class_family_inbox`

Entrypoint: `open_class_family_inbox`.

Reads:

- Active caregiver role assignment scoped to `care_group` or `enrollment`.
- Active enrollments in the care group.
- `NurtureFamilyCareItem` rows for those child scopes.

Writes:

- `NurtureFamilyCareItemEvent` for acknowledge, assign, snooze, follow-up, close, suppress.
- Reply action writes a new `NurtureFamilyCareMessage` only into the target child's private family thread.

Tests must prove that one teacher sees one inbox for ten child-private threads without cross-family message visibility.

### 5.2 `teacher_attention_board`

Entrypoint: `open_today_attention_board`.

Reads a materialized, rebuildable `NurtureTeacherAttentionItem` projection grouped by `careGroupId`, but every row must include `childCareProcessId`.

Tests must prove that source changes in messages, care constraints, daily care logs, grant state, or redaction update/hide the projection without changing source facts.

### 5.3 `caregiver_daily_care`

Entrypoint: `record_daily_care_log`.

Writes operational care observations such as meal, nap, mood, activity, hygiene, and non-diagnostic health observations. Health-related entries must remain operational and must not produce diagnosis, treatment, medication dosage advice, or emergency replacement guidance.

Tests must prove caregiver scope, child scope, grant-gated family sharing, and health-safety refusal/escalation behavior.

### 5.4 `child_media_attribution`

Entrypoint: `classify_child_media_assets`.

Writes candidate `NurtureChildMediaAttribution` rows from reference images and class assets. Family-visible views require teacher/admin confirmation plus exposure policy checks.

Tests must prove candidate-only recognition, confirmation gate, rejected/corrected attribution lifecycle, revoke/exit exposure stop, and no direct host/public publication.

## 6. Test Contract

The IIA Test Contract defines what implementation must prove before a capability is considered correct. It is not only a list of test files. It is the executable acceptance boundary for the locked IB semantics.

### 6.1 Required Semantics

Implementation tests must prove these semantics:

- My-Chat mobile chat does not select a Nurture role. Nurture resolves role, scope, and output from participant state and target context.
- Dashboard, teacher board, admin board, and web workbench may return a Nurture-issued `scenarioToken`, but My-Chat must not author `selectedRoleAssignmentId`, `targetRef`, or work scope refs. Nurture resolves and validates ownership, status, and scope before use.
- Ambiguous role, work scope, target, intent, or memory matches return `needs_clarification` with typed candidates unless the case is forbidden, revoked, redacted, stale-unsafe, or scope-invalid.
- `needs_clarification` returns a structured My-Chat interaction request with opaque `scenarioToken` and option tokens, not long prose or Nurture business ids.
- Scenario token MVP supports only `clarify`, `submit_action`, and `open_notification`; token use never authorizes by itself and always rechecks current Nurture state.
- A `NurtureChildCareProcess` has exactly one active `NurtureFamily` in MVP.
- Child-specific facts cannot be written without `childCareProcessId`.
- A teacher sees one class inbox over ten child-private family threads, without cross-family message visibility.
- A teacher workflow action can distribute a family-facing message only to the target child's private family timeline; it cannot write to another family or bypass item/event/log traceability.
- `NurtureChildLinkGrant` revoke blocks future delivery, pending outbox, retry/replay, cached context pack reuse, stale notification actions, and opened-before-revoke submit.
- `NurtureFamilyCareMessage` lifecycle remains `sent` / `redacted` / `failed`; projection suppression does not mutate message status.
- My-Chat does not persist Nurture render envelopes. Old notifications and deep links must re-resolve through Nurture.
- Media recognition creates candidate attribution only; child/family-visible views require confirmation and exposure policy.

### 6.2 Test Layers

| Layer | Test file target | Required cases |
| --- | --- | --- |
| Schema/repository | `packages/nurture-scenario/tests/institution/schema-invariants.test.ts` | active participant uniqueness, one active family per child process, child-scoped fact writes require `childCareProcessId`, active role assignment uniqueness, grant receipt idempotency. |
| Resolver/policy | `packages/nurture-scenario/tests/institution/policies.test.ts` | mobile chat role-agnostic ingress, scenario token classification, source-adapter eligibility filtering, candidate merge/dedupe/ranking/ties/limits, ambiguity -> structured clarification, caregiver scope, guardian access, admin exposure limits, fail-closed reason codes. |
| Family inbox | `packages/nurture-scenario/tests/institution/class-family-inbox.test.ts` | class-of-10 private timelines, item extraction, acknowledge/clarify/answer/outcome/close actions, workflow-mediated message distribution only to the target child family, authorship/trace refs, notification-failure independence. |
| Grant/runtime fence | `packages/nurture-scenario/tests/institution/grant-runtime-fence.test.ts` | revoke blocks new delivery, pending outbox, retry/replay, cached context pack, stale notification, opened-before-revoke submit. |
| Message lifecycle | `packages/nurture-scenario/tests/institution/message-lifecycle.test.ts` | `sent` / `redacted` / `failed`, no message-level `hidden` / `deleted`, redacted body/attachments unavailable, projection suppression separate. |
| Daily care | `packages/nurture-scenario/tests/institution/daily-care.test.ts` | caregiver quick record, group/batch record with child scopes, org-to-family sharing through grant, health boundary. |
| Media | `packages/nurture-scenario/tests/institution/media-attribution.test.ts` | candidate attribution, confirmation, rejection/correction, family exposure policy, revoke/exit exposure stop. |
| Manifest/conformance | existing conformance tests plus institution additions | capability keys, resolver refs, policy keys, artifact types, handoffs, event payload policy. |
| Journey | `packages/nurture-scenario/tests/institution/institution-class-of-10.journey.test.ts` | guardian timeline input -> family-care message -> item -> class inbox -> teacher workflow action -> traceable family-facing message/receipt -> revoke negative path. |

### 6.3 Required Fixture Shape

The canonical IIA fixture should include:

- One `workspaceId`.
- One institution.
- One care group.
- Ten `NurtureChildCareProcess` records.
- Ten active `NurtureFamily` records, one per child care process.
- Ten active `NurtureEnrollment` records into the same care group.
- Ten private `NurtureFamilyCareThread` records.
- Two caregiver role assignments and one lead caregiver role assignment for the care group.
- Multiple guardian participants; at least one My-Chat user who is both guardian and caregiver in different scopes.
- Active and revoked `NurtureChildLinkGrant` records covering `family_to_org` and `org_to_family`.
- Family-care messages that extract into `care_day_note`, `care_constraint_update`, `family_care_question`, and `family_follow_up_request` items.
- At least one redacted message, one suppressed projection, one stale notification/deep link ref, and one candidate media attribution.

### 6.4 Structured Decision Requirements

Policy and resolver tests must assert structured decisions, not only boolean results.

Expected decision shape:

```text
allowed
reasonCode
resolvedRefs
auditPayload
safeUserState
```

Required fail-closed reason codes:

- `participant_missing`
- `role_missing`
- `role_revoked`
- `scope_mismatch`
- `care_group_mismatch`
- `child_not_visible`
- `thread_inactive`
- `family_thread_missing`
- `grant_missing`
- `grant_revoked`
- `data_class_mismatch`
- `enrollment_inactive`
- `message_redacted`
- `stale_deeplink`
- `token_expired`
- `token_replayed`
- `token_mismatch`
- `token_revoked`
- `asset_scope_mismatch`
- `child_not_enrolled`
- `exposure_policy_missing`
- `health_safety_boundary`

### 6.5 Non-Pass Conditions

These outcomes are explicit failures even if the happy path appears to work:

- A teacher can render another family's private message body from class inbox data.
- A family input is delivered into a direct teacher chat inbox instead of entering the Nurture item/workflow pipeline.
- A teacher must monitor ten direct family chat rooms, or a teacher command appends arbitrary text to a family timeline without a source action/item/event/log.
- AI/system/institution-generated copy is displayed as if a named caregiver personally authored or confirmed it.
- My-Chat notification failure erases, rolls back, or becomes the source of truth for a committed Nurture work fact or family-facing canonical message.
- A child-specific care fact can be created with only `careGroupId`, `familyId`, or `participantId`, without `childCareProcessId`.
- My-Chat host state stores or reuses long-lived `safeSummary`, `safeBody`, `urgency`, `requiresAction`, or other Nurture render-envelope fields as canonical state.
- A revoked grant only hides UI while outbox, retry, replay, cached context, or submit actions still use revoked context.
- A redacted message remains readable through raw body, direct attachment URL, cached presenter output, or stale notification copy.
- `NurtureTeacherAttentionItem` becomes a class-owned fact without `childCareProcessId`.
- Media recognition directly publishes to family-visible albums without teacher/admin confirmation and exposure policy.
- Dashboard role switching accepts a host-authored `selectedRoleAssignmentId`, or trusts a scenario token without rechecking participant ownership, role status, and scope.
- Mobile chat chooses the broadest available role instead of asking clarification or returning safe scenario-level output when target context is ambiguous.
- Resolver auto-selects one child, class, role, or item when multiple plausible candidates remain in the same deterministic match class.
- Resolver uses recency, urgency, priority, due time, model confidence, or stable id alone to eliminate a business ambiguity.
- Retrieval silently truncates plausible candidates and auto-selects from the retained top subset instead of asking for a discriminating child/date/topic field.
- Clarification is returned as long prose that My-Chat must interpret instead of a structured interaction request.
- Clarification options expose Nurture business ids or require My-Chat to understand child, role, item, grant, or policy semantics.
- Scenario token is treated as authorization and skips resolver, policy, grant/runtime fence, object lifecycle, or command precondition checks.
- MVP token implementation introduces signed business payloads, full object version vectors, or post-MVP token purposes before the DB-handle MVP is proven.
- Expired or consumed `submit_action` token can still mutate state without reopening/revalidating the action.

## 7. Implementation Verification Commands

These commands are expected after code/schema work begins:

```bash
pnpm typecheck
pnpm test
pnpm test:db
node .ai/scripts/ctl-db-ssot.mjs sync-to-context
node .ai/skills/features/context-awareness/scripts/ctl-context.mjs touch
node .ai/skills/features/context-awareness/scripts/ctl-context.mjs verify --repo-root . --strict
node .ai/scripts/ctl-project-governance.mjs sync --apply --project main
node .ai/scripts/ctl-project-governance.mjs lint --check --project main
```

IIA implementation should run DB mutation commands only after the schema diff/migration plan is reviewed.

## 8. Acceptance Criteria

- A fresh reader can derive the first institution schema migration from `06-ib-nurture-schema-spec.md` plus this IIA design.
- Every first-slice child-specific model has a required `childCareProcessId`.
- Policies return structured fail-closed decisions and do not rely on My-Chat account roles.
- My-Chat mobile chat remains scenario ingress; Nurture owns role/scope/output resolution.
- Dashboard role switching uses Nurture-issued `scenarioToken` and revalidates ownership, status, and scope.
- Ambiguous resolver cases return structured clarification or blocked states; My-Chat renders generic choice/form/input primitives only.
- Scenario token MVP is an opaque Nurture DB handle with only `clarify`, `submit_action`, and `open_notification` purposes.
- One class with ten children has ten child-private family timelines and one teacher class inbox; family inputs and teacher actions are connected only through Nurture workflow-mediated distribution.
- Named caregiver messages require caregiver-confirmed actions and source trace refs; system/institution messages remain explicitly attributed.
- Nurture work/message persistence remains valid when My-Chat notification delivery fails or retries.
- Grant revoke stops future delivery and active work context without deleting historical actions.
- Redaction and projection suppression remain separate.
- Media recognition creates candidates only; teacher/admin confirmation and exposure policy control child/family views.
- My-Chat host delivery persists only opaque delivery bookkeeping.
