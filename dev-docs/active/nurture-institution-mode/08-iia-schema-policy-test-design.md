# IIA Schema / Policy / Test Design

## Status

- **Phase:** IIA design entry
- **Updated:** 2026-07-16
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
- Guardian and caregiver roles may use role-agnostic Nurture Chat; guardian also uses family board/workbench, caregiver uses teacher board, and institution admin uses institution board/workbench rather than Nurture Chat. My-Chat selects only Nurture and Nurture resolves surface entitlement, role/scope/target/business direction/output.
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

Main-chat routing rules, refined by Pilot-0-B3-0:

- Guardian and caregiver Nurture work MAY enter through My-Chat Chat. My-Chat MAY process the current turn to decide whether it belongs to Nurture, but the route decision only selects `scenario=nurture`; it does not resolve the Nurture actor role, work scope, child target, business intent, grant, or propagation direction.
- Institution-admin Nurture work MUST enter through the institution board or institution domain web workbench. General My-Chat Chat remains available to the account but MUST NOT expose Nurture institution-management actions.
- My-Chat SHOULD reuse an explicit Nurture entry, existing conversation-to-scenario binding, or returned Nurture `scenarioToken` before invoking generic intent routing again. Route reuse is a host conversation optimization, not Nurture authorization.
- After Nurture is selected, the existing Surface Contract envelope applies. Nurture independently resolves whether the actor is currently acting as guardian, caregiver, or institution administrator and whether the requested effect is `internal_fact`, `family_to_org`, or `org_to_family`.
- The system invocation direction (`My-Chat -> Nurture -> My-Chat scenario response`) and the Nurture business distribution direction (`family_to_org` / `org_to_family`) are independent concepts and MUST NOT be inferred from each other.

Surface rules:

- `mobile_chat` may pass `workspaceId` if injected by the host adapter, `myChatUserId`, `surface=mobile_chat`, current input payload, `hostConversationRef`, `hostTurnId`, `previousTurnRef`, and `clientLocalContext`. Nurture MUST limit role candidates to current Chat-entitled guardian/caregiver assignments.
- `mobile_chat` must not pass trusted role, trusted `selectedRoleAssignmentId`, trusted `childCareProcessId`, host-authored `targetRef`, host-authored `workScopeHint`, or host-side family/institution/class authorization decisions.
- Family, teacher, and institution boards may pass generic display state such as filters, sort, pagination, selected tab, and a Nurture-issued `scenarioToken` from a previously rendered work surface. Nurture MUST restrict role/scope candidates to the board's product entitlement; My-Chat must not synthesize `roleAssignmentId`, `careGroupId`, `childCareProcessId`, `targetRef`, `dataClass`, or `direction`.
- `notification_deeplink` may pass host delivery bookkeeping such as `deliveryId`, `dedupeKey`, and provider delivery status, plus a Nurture-issued `scenarioToken` if one was embedded in the notification. My-Chat must not interpret or pass Nurture target ids as business refs.
- The family domain web workbench is guardian-entitled and the institution domain web workbench is institution-admin-entitled; neither accepts a host-authored Nurture role/scope. The first internal experiment exposes no caregiver domain web workbench. Institution admin is not ambient access to family content or all child facts.
- Host `web_run_workbench` and technical Admin are not Nurture domain workbenches and MUST NOT gain business access through surface naming or routing.

Pilot-0-B3-1a Guardian action refinement:

- Guardian Chat MUST remain the generic My-Chat AI/interaction harness. Nurture returns generic interaction envelopes and MUST NOT add a Guardian-specific Chat shell or second Chat business lifecycle.
- Guardian Chat initially relies only on implemented core primitives: `timeline_inline`, `action_option_deck`, `editable_preview`, `authorization_gate`, `bottom_sheet`, `full_screen_flow`, and envelope `resultSummary`. Incomplete generic primitives are not Pilot prerequisites.
- Question submission, grant confirm/replacement, revoke, and author redaction are reachable from Chat, family board, and family workbench. Presentation differs, but every durable effect uses the same Nurture command specification, current resolver/policy checks, and CommandExecution kernel.
- `confirm_family_enrollment` is also reachable from all three Guardian surfaces with strong confirmation. It accepts the current proposed child/family enrollment under Guardian authority and does not implicitly create a grant.
- Natural language, selected surface, dashboard projection, and client state are not authorization. Every confirmation reloads current actor, role, child/family scope, grant, object lifecycle, and expected version before execution.
- Family board is current/recent work scope; family workbench is complete authorized history and complex grant review. Neither owns a parallel message, receipt, grant, or action state.
- Revoke cannot require web-workbench access. Submitted questions cannot be edited in place or hard-deleted; correction/resend uses a new command, while redaction changes current visibility under the existing retention/audit contract.
- `cancel_route` is action-available only for a current cancellable pending Receipt. An immediate-only Pilot route may expose no cancellation affordance.
- The Pilot's designated primary/secondary guardian script does not create a `primary_guardian` role or client-side permission rule; action availability always comes from current Nurture facts and policy.

Pilot-0-B3-1b Caregiver action refinement:

- Caregiver Chat remains the generic My-Chat AI/interaction harness, while the teacher board is the complete Nurture work surface. Both MUST close acknowledge/reply without a caregiver domain-workbench fallback.
- Chat timeline and activation payloads remain display-safe. Protected family-question bodies are loaded by opaque ref from Nurture into a transient detail surface after current owner reread and MUST NOT be persisted as My-Chat Chat messages, interaction history, projections, or logs.
- Item open is read-only and does not imply Nurture acknowledgment. Host notification read/unread remains separate. `nurture.family_care.acknowledge_item` requires an explicit current caregiver confirmation and command precondition recheck.
- AI MAY produce an explicitly unconfirmed, non-diagnostic, non-prescriptive response draft from currently authorized Nurture context. Only a caregiver-confirmed `nurture.family_care.reply_item` action may create a named caregiver-authored family-facing message.
- Teacher board MUST include complete authorized open/acknowledged/replied/blocked-or-revoked/redacted-or-suppressed history with child, care-group, status, and time filters because no Caregiver domain workbench exists. Redacted/suppressed rows expose only display-safe state or tombstone metadata, never protected bodies.
- Caregiver-authored replies are immutable after commit. Redaction follows current author/policy checks; in-place edit, automatic reopen, second reply, and correction remain outside Pilot-0 and require a later explicit command contract.
- Direct family Chat, bulk actions, clarification loops, daily-care outcomes, grant/enrollment/topology administration, cross-care-group work, reassignment, and duty handoff are unavailable in the first internal experiment.
- Final acknowledge/reply/redaction commands MUST fail closed after revoke, source redaction, enrollment/role change, item-version conflict, or policy change. A draft or alternate surface is not authorization.

Pilot-0-B3-1c Institution action refinement:

- The institution board MUST remain read-only in the first internal experiment. It exposes only safe topology/readiness/backlog aggregates, unavailable-state categories, and navigation; projection cards do not execute durable Nurture writes.
- The institution domain web workbench is the only Institution surface for authoritative institution/care-group lifecycle, invitation initiation, staff-role, enrollment, lead-caregiver, policy, and scoped business-disablement commands. Every write uses the shared `CommandExecution` kernel with idempotency, expected version, current institution-admin role/scope, target lifecycle, and policy revalidation.
- Adult invitation is coordinated across ownership boundaries: Institution may initiate; My-Chat owns canonical account invitation/authentication/acceptance; Nurture maps the accepted user into participant/role facts. Institution MUST NOT bind raw `myChatUserId` values or accept for another user.
- Institution may initiate enrollment topology but MUST NOT establish/revoke Guardian relationships or create/replace/revoke grants. Family authority confirms the child/family linkage and applicable grant.
- Institution coverage views MAY expose safe enrollment/grant metadata such as scope, direction, system `dataClass`, version, and status. They MUST NOT expose family question/reply bodies, consent/revoke narrative, child-specific care facts, or named caregiver-authored content.
- Suspend/close/disable transitions preserve canonical and audit facts; recovery is a separate revalidated command, not a blind toggle. No Institution surface hard-deletes topology or controls My-Chat capability, allowlist, Workflow Run/Step/Handoff/Outbox, notification, or technical recovery.
- Operational aggregates MUST NOT become child ranking, cross-group comparison, public caregiver scoring, or competitive institution ranking. The synthetic direct-Prisma fixture remains test preparation and cannot substitute for authenticated owner commands.

Pilot-0-B3-1d-0 action-key layering refinement:

- The canonical cross-surface product identity is `(scenario_key, action_key)`. Nurture action keys use stable `snake_case`; the same business intent keeps one key across Chat, role boards, and domain workbenches.
- Nurture `command_key` is the immutable dotted `CommandExecution` contract. Existing keys `nurture.family_care.capture_and_route`, `nurture.family_care.revoke_grant`, `nurture.family_care.acknowledge_item`, `nurture.family_care.reply_item`, `nurture.family_care.redact_message`, and `nurture.family_care.cancel_route` keep their persisted names and MUST NOT be renamed or duplicated to match UI labels.
- Workflow `entrypoint_key` starts a workflow definition; `handler_key` binds implementation. Neither value is the product action identity, and direct entity actions MUST NOT create synthetic Runs solely to fit an entrypoint API.
- Product action key, surface, opaque target ref, expected version, and confirmation state remain untrusted until Nurture re-resolves actor, entitlement, role/scope, grant, policy, lifecycle, and current version.
- Read/search/navigation/selection/AI-draft/preview/detail-open interactions are non-durable and MUST NOT create a `CommandExecution` or fake durable action.
- The existing manifest `action_availability.scenario_actions` contract is Workflow Run/Step-shaped. Message/Grant/Item/Enrollment actions MUST NOT be added there or reinterpret the four legacy scenario-action handlers. Cross-surface domain actions require an additive contract/registry.
- My-Chat Admin recovery actions remain Host-owned and MUST NOT become Nurture action or command keys. B3-1d-1 separately decides their operator entitlement and safe exposure.

Pilot-0-B3-1d-1 technical-operator refinement:

- The technical operator MUST be a named internal My-Chat platform-operations account with exact Pilot-workspace scope. Generic workspace-admin or Nurture institution-admin status alone is insufficient and MUST NOT expose Technical Admin recovery.
- Technical Admin MAY expose safe Run/Step/Handoff/Outbox/notification/audit IDs, states, versions, counts, timestamps, and reason/correlation evidence. It MUST NOT expose protected Nurture bodies, consent narrative, claim/service tokens, or user-bearing raw provider errors.
- The Host operation `reconcile_outcome_unknown_step` maps to the existing Step reconciliation endpoint and preserves the original Step, command identity, driver ref, and snapshot request identities. It cannot construct a substitute Step, Draft, or Handoff.
- Existing `replay_failed` is available only for a replayable failed Handoff; existing `stop_pending` is available only before downstream logical effect. Both require exact workspace, expected version, idempotency, current Handoff state, and owner reread.
- Planned `request_owner_reevaluation` carries host evidence plus opaque refs to Nurture. The Nurture owner service rechecks source/grant/scope/policy/Receipt/Item and decides any deterministic transition; the operator cannot choose business blocked/failed/delivered/cancelled/reissued state.
- The operator MAY execute disable-only emergency shutdown under the approved two-key runbook. Re-enable, workspace addition, or cohort expansion requires a new Go/No-Go and is never an operator convenience action.
- The operator MUST NOT directly invoke Guardian/Caregiver/Institution commands, edit technical or business records, mint provenance, alter refs/payload/purpose/target/expiry, or repair databases/queues outside a separately authorized incident process.
- Every operator write MUST persist actor, workspace, target, operation, expected version, idempotency, correlation/causation/trace, safe reason, before/after version, and Outbox evidence without Nurture bodies or secrets.

Pilot-0-B3-1d-2 exact domain-action refinement:

- Guardian mappings are `confirm_family_enrollment -> nurture.family_care.confirm_enrollment`, `confirm_child_link_grant -> nurture.family_care.confirm_grant`, and `replace_child_link_grant -> nurture.family_care.replace_grant`; existing `revoke_child_link_grant -> nurture.family_care.revoke_grant` remains unchanged.
- Enrollment confirmation, initial grant confirmation, replacement, and revoke MUST use separate command identities, expected versions, policy checks, and audit events. A changed grant contract requires replacement; a revoked grant is never reactivated.
- Institution mappings use matching explicit action and `nurture.institution.*` command verbs: `create_care_institution`, `update_care_institution`, `create_care_group`, `update_care_group`, `suspend_care_group`, `resume_care_group`, `close_care_group`, `assign_staff_role`, `revoke_staff_role`, `designate_lead_caregiver`, `initiate_enrollment`, `suspend_enrollment`, `resume_enrollment`, `close_enrollment`, `update_institution_policy`, and `update_care_group_policy`.
- Generic `upsert_*` and `change_*_state` actions are forbidden. Resume applies only to current suspended state after revalidation; close is terminal in Pilot-0.
- `initiate_participant_invitation` maps to planned Host command `my_chat.workspace_invitation.create`. My-Chat owns delivery/authentication/acceptance; only after acceptance may an owner callback execute planned `nurture.institution.bind_accepted_participant` with a canonical user ref. The callback is not a surface action and grants no role implicitly.
- Scoped Pilot business disable/recovery uses `suspend_care_group` / `resume_care_group`; no scenario-local Pilot enablement aggregate is added. Environment capability and workspace allowlist remain My-Chat technical gates.
- The new keys are reserved design contracts, not implemented claims. Direct fixture provisioning MAY prepare the internal synthetic institution/group before traffic but MUST NOT substitute for authenticated owner commands once user-operable onboarding begins.

Pilot-0-B3-1d-3 availability and adoption refinement:

- Domain-action `safe_reason_code` is limited to `available`, `not_implemented`, `capability_disabled`, `surface_not_entitled`, `actor_not_entitled`, `scope_unavailable`, `target_unavailable`, `state_not_actionable`, `target_changed`, `enrollment_inactive`, `grant_missing`, `grant_revoked`, `policy_blocked`, `operator_not_authorized`, `technical_state_not_recoverable`, `owner_unavailable`, and `temporarily_unavailable`.
- Nurture owns `safe_label` and optional `safe_help`; My-Chat renders the generic availability/confirmation state without interpreting scenario semantics. Availability is not authorization and every command reruns current resolution/preconditions.
- `confirmation_class` is independent and limited to `explicit` or `strong_authorization`. Confirmation requirements MUST NOT be encoded as reason codes or inferred from surface/action labels.
- Internal participant/role failures map to `actor_not_entitled`; family/child/group/thread reachability maps to `scope_unavailable`; missing/redacted targets map to `target_unavailable`; lifecycle conflicts map to `state_not_actionable`; version conflicts map to `target_changed`; data-class/direction mismatch maps to `policy_blocked`; contention maps to `temporarily_unavailable`.
- `not_implemented` is readiness/dev-only for known actions absent from the active registry. A `domain_action_contracts` declaration without a valid handler is fatal and MUST NOT fall back to runtime `not_implemented`.
- Base adds optional additive `domain_action_contracts` plus separate availability/command/handler contracts. Validators reject duplicate/reserved keys, missing handlers, invalid target/surface/confirmation declarations, and Run-action handler reuse while preserving legacy fixtures.
- My-Chat adopts the exact Base revision and generic routing/renderer/registry with capability off. Nurture adopts only after authenticated handlers, current owner presenters, commands, and wrong-surface/role/scope/version/grant/admin/raw-id/owner-outage/privacy negative tests pass.
- Adoption order is Base -> My-Chat -> Nurture. No simultaneous switch, legacy reinterpretation, or traffic/capability enablement is allowed during contract adoption.

Pilot-0-B3-2a cross-surface transition refinement:

- A transition carries intent/navigation only: generic destination `route_class`, Nurture-issued opaque continuation, and necessary display expiry/bookkeeping. URLs, notification payloads, logs, analytics, and client route state MUST NOT carry raw Nurture object/role/scope ids or token material.
- If the current entitled surface can close the action, navigation SHOULD NOT be required. Guardian complex history/enrollment/grant work targets `family_workbench`; Caregiver full detail/history targets `teacher_board`; Institution writes target `institution_workbench`; technical recovery remains `technical_admin`.
- Transition open is read-only and MUST NOT acknowledge, confirm, submit, cancel, revoke, redact, reissue, retry, or execute a command. The destination owner-rereads current participant, surface entitlement, role, scope, target, grant, policy, lifecycle, expected version, and action availability.
- My-Chat treats route class as generic shell navigation and MUST NOT decode the opaque continuation or synthesize Nurture targets. Changed token binding/entitlement/target/policy returns current safe unavailable/result state and actions, never cached controls or protected detail.
- A command already completed on the source surface is reread at the destination through current Execution/business facts. Navigation neither reruns the command nor enters command identity.
- Transition telemetry is limited to route classes, source/destination surface, safe outcome, latency, and opaque correlation. Transition creates no Nurture business fact and carries no bodies, raw ids, or token values.

Pilot-0-B3-2b opaque-token refinement:

- The Pilot purpose set remains exactly `clarify|submit_action|open_notification`. Generic navigation without one of these purposes carries only route class plus the B3-2d allowlisted `current|recent|history` display mode; `open_notification` MUST NOT become a general object-browser token or business target/filter/cursor carrier.
- Every token binds workspace, current participant, purpose, and the surface where it is consumed/opened. Chat clarification also binds the hashed host conversation. A token issued for one surface MUST NOT be accepted as a cross-surface credential; an intended destination token is issued for that destination.
- Pilot TTL is fixed at five minutes for `clarify`, five minutes for `submit_action`, and seven days for `open_notification`. TTL expiry affects continuation only and MUST NOT transition Message, Receipt, Item, clarification deadline, Grant, Enrollment, or any other business fact.
- A structurally valid clarify answer consumes its context once. Invalid/mismatched input does not consume it; stale current facts return safe blocked/recovery and any further clarification uses a new context/token rather than extending the old row.
- `submit_action` binds action key, opaque target refs, expected versions, prepared schema/hash, immutable refs, and a stable command request id derived from context id + purpose. Token consumption, `CommandExecution`, and the business effect MUST commit atomically. Exact response-loss replay returns the committed Execution; deterministic stale/denied state revokes the context; retryable technical failure leaves the unchanged token active only within TTL.
- `open_notification` stores locator refs only, is reusable/read-only until expiry/revoke, and every open owner-rereads current participant/role/scope/grant/policy/target lifecycle. Open MUST NOT mark a Nurture Receipt read/acknowledged or execute any command.
- Refresh never mutates `expiresAt` or reactivates a consumed/revoked/expired context. Clarification regenerates current candidates, submit reopens/re-presents the action, and notification recovery returns through a current owner view before issuing any new token.
- Scenario tokens never satisfy `strong_authorization`. Internal mismatch/replay/revoke/expiry codes remain server-side and map through the accepted safe availability vocabulary. Pilot-0-B3-2c fixes notification transport/open behavior below.

Pilot-0-B3-2c notification/deep-link refinement:

- Provider payload and deep link carry only a server-side recipient-bound My-Chat `notification_id`, generic notification-open route, and generic copy that remains safe after revoke/redaction. They MUST NOT carry scenario token, Handoff id, Nurture ref/id, protected body, target/action state, or cached authorization.
- Nurture Notification list DTO exposes only Notification id/type/read state, generic safe copy, and generic deep link. Internal Handoff target id/type and metadata remain server-side and MUST NOT be returned as a client navigation target.
- The generic route is `morethan://notifications/{notification_id}/open`. Authentication and exact Notification `userId + workspaceId` validation happen before Ledger/Nurture access. Wrong user/workspace/id returns the same generic unavailable result and MUST NOT call Nurture.
- After recipient validation, My-Chat marks only the Host Notification read state. Owner-ready, stale, unavailable, or transient owner-outage landing all count as a Host open; none changes Nurture Receipt/Item/Message or creates `CommandExecution`.
- My-Chat rereads an eligible `requested|completed` Handoff, then calls a dedicated Nurture open resolver with the authenticated actor. `stopped|failed` Handoff cannot open or be resurrected. The requested state remains eligible only for the crash window where Notification committed before Handoff completion was recorded.
- Ready open issues a destination-bound `scenarioToken(purpose=open_notification)` after current owner checks. Raw token exists only in the response/client navigation channel; provider payload, URL, durable My-Chat Notification/metadata, logs, analytics, and telemetry MUST NOT store the value. The destination owner-rereads again before protected render/action availability.
- Delivery eligibility and open visibility are different owner operations. Delivery requires current reason to notify; open may route an already acknowledged/replied/closed item to current authorized detail/history. Open MUST NOT reuse delivery's `item.status=open` predicate as a universal visibility rule.
- Owner state is rechecked before Notification creation, before every provider send/retry, and on every open. Pre-send revoke/redaction/cancel or terminal target state yields delivery `skipped`; transient owner failure sends nothing and enters bounded retry; post-send state change cannot recall the OS notification but wins at open.
- Current visible lifecycle change returns current detail/history and current actions, never stale controls. Source redaction/withdrawal/suppression may expose only an owner-approved tombstone. Grant/role/enrollment/scope removal, stopped/failed Handoff, or disabled capability returns no protected token/detail.
- The generic Host response classes are exactly `ready|unavailable|retryable`. Nurture supplies safe label/help/retry; My-Chat MUST NOT interpret grant, redaction, lifecycle, or policy reason semantics. Internal `handoff_unavailable` does not become client domain state.
- Notification list copy may be rendered from the generic durable Host record without a per-row owner call. Opening, retrying, destination rendering, or executing an action always uses current owner state. Repeat/multi-device opens are read-only and may issue separate TTL-bound tokens after current checks.

Pilot-0-B3-2d draft/result/history continuity refinement:

- Pilot continuity guarantees committed Nurture facts/results and current authorized history across surfaces; unfinished bodyful drafts do not cross surface, device, account, participant, or guardian boundaries.
- Unsubmitted text/form/AI draft belongs to the creating actor and surface. Same-surface `clarify|submit_action` may use the existing 5-minute context, but a non-empty draft leaving the surface requires explicit stay/discard. Refresh/process loss/cross-device recovery is not guaranteed.
- My-Chat Chat transcript is Host conversation history and MUST NOT reconstruct, resubmit, or authorize a Nurture draft. User-authored Chat text may remain under Host policy; caregiver AI drafts derived from protected family content remain ephemeral and MUST NOT persist in Chat history.
- Existing My-Chat `PublicDraft`, Workflow artifact draft, and Nurture forum-publication Handoff remain external-publication mechanisms. They MUST NOT store family-care question/reply, grant/enrollment, or Institution-command interaction drafts.
- Committed continuity is Nurture business facts plus refs-only `CommandExecution`. Source result summaries are display-only; response loss returns exact Execution replay; destination surfaces owner-query current facts and MUST NOT rerun the command or introduce `open_result`/generic object tokens.
- Non-notification transition carries only generic `route_class` and optional `view_mode=current|recent|history`. Business target ids, output refs, rows, filters, search text, pagination cursors, bodies, expected versions, action availability, and scroll state remain owner/surface-local.
- Guardian family board owns current/recent and family workbench owns complete authorized family/grant/enrollment history. Teacher board owns complete authorized caregiver history. Institution board owns safe current aggregates and institution workbench owns authorized topology/configuration command history. Chat, Notification inbox, and Technical Admin are not Nurture business-history stores.
- Unsubmitted drafts are never visible to another guardian/device. Committed Message/Receipt/reply/outcome visibility follows current family relationship/grant/policy. Every page/filter/detail/action rereads current owner state; redacted/suppressed history exposes only permitted tombstones.
- Round-trip tests MUST cover Guardian Chat -> board/workbench, second guardian visibility, Caregiver Chat -> teacher board, Institution board -> workbench -> board, response loss, concurrent/current-state change, revoke/redaction between surfaces, wrong actor/workspace/surface, reload, and cross-device access without duplicate effects or draft leakage.

Pilot-0-B3-3a first business input/data-envelope refinement:

- The first Pilot accepts only `family_care_question`. The trusted Nurture Pilot adapter fixes `category=question`, `urgency=today_attention`, `route_mode=immediate`, `requires_ack=true`, `requires_reply=true`, and `attachment_refs=[]` before the existing command runner.
- User-facing submission carries only trimmed plain-text question content plus a current Nurture-issued context/confirmation. Participant, role, child process, family, enrollment, care group, thread, grant, target, protected-content ref, source surface, data class, category, urgency, route mode, summary, and acknowledgment/reply flags are owner-derived or trusted-adapter fields, never raw client authority.
- Guardian question and caregiver-confirmed reply text are each 1–2000 Unicode characters after trim. Both remain behind protected content refs. Rich text, attachment, media, URL-bearing storage credential, and batch input are excluded.
- List/attention copy uses deterministic generic safe summary such as `Family question requires caregiver reply`; the summary is not an extract, classification, or AI summary of the protected body. Authorized detail always owner-rereads the protected body.
- Health observation, diagnosis, medication, emergency request, daily-care log, care-constraint change, follow-up workflow, and any other data class are unsupported in the Pilot profile. Recognized or uncertain out-of-profile input fails before the first business write with safe non-diagnostic/non-prescriptive routing; Nurture never silently remaps the input to `family_care_question`.
- AI may help produce an editable user draft, but cannot select/override the fixed classification, create a caregiver-confirmed authorship, bypass confirmation, or expand the envelope. The authoritative command values are deterministic.
- The generic schema/command kernel remains broader. Implementation MUST add one strict additive Pilot profile validator at the Nurture boundary and reject every value outside the profile before persistence; the validator MUST NOT fork the canonical Message/Receipt/Item/Execution lifecycle.
- Tests MUST cover exact allowed values, both 1/2000 boundaries, empty/overlong/control-only input, every fixed-field override, non-empty attachment, unsupported data class/category/urgency/route mode/source surface, raw-id/ref injection, unsafe content category, AI-draft-without-confirmation, and exact command replay.

Pilot-0-B3-3b Grant/family-authority/target-scope refinement:

- The complete Pilot question round trip uses one active Grant, not separate directional Grants. The exact fields are current workspace/child process/enrollment, `grantedToScopeType=care_group`, the enrollment's current care-group id, `directions=[family_to_org,org_to_family]`, `dataClasses=[family_care_question]`, and `purposes=[family_care_workflow]`.
- Effective time begins at confirmation. `expiresAt` is required and equals the earlier of 30 days after effectiveness or the exact Pilot workspace allowlist expiry. Expiry never auto-renews or reactivates a row.
- `org_to_family` authorizes only `nurture.family_care.reply_item` for an item created under the same Grant. The direction cannot authorize proactive institution messages, broadcast, daily-care sharing, clarification loops, or another data class.
- Capture persists the original `grantId`; acknowledge and reply must reload and validate that exact Grant. Revoke, expiry, replacement, target/enrollment drift, owner-role loss, or data-class/direction mismatch blocks the old item. A current replacement Grant applies only to new questions.
- At most one active Grant exists for `(workspace, child process, enrollment, care group, family_care_workflow)`. Identical confirmation returns `already_satisfied`. Any scope/direction/data-class/purpose/expiry change uses expected version and one transaction to mark the old Grant `replaced` and create a new active identity. No terminal identity returns to active.
- One designated Guardian performs first confirmation in the test script, but `primary_guardian` is not a role. Any current Guardian in the same active family may author a new question and owner-read committed family-visible question/Receipt/reply facts under the Grant. Only `grantedByParticipantId` may replace/revoke; message redaction remains exact-author only.
- Institution administrator, caregiver, and technical operator cannot create, confirm, replace, revoke, transfer, or directly edit a family Grant. Loss of the Grant owner's current Guardian eligibility blocks new cross-role use and requires a separately confirmed new Grant rather than implicit ownership transfer.
- Implementation MUST remove ambiguous active matching: overlapping active rows are rejected transactionally, repository resolution never relies on `findFirst` ordering among overlaps, and reply cannot switch from the item's original Grant to another current matching row.
- Tests MUST cover exact duplicate, overlapping create race, expected-version replacement race, all changed-definition dimensions, wrong direction/class/purpose/scope/enrollment, expiry/allowlist bound, original-Grant revoke/replace before acknowledge/reply, replacement non-revival, owner versus second-Guardian administration, same-family view, cross-family denial, owner-role loss, and non-family-role denial.

Pilot-0-B3-3c Message/Receipt/Item/Attention lifecycle refinement:

- The success path is exactly `open(v0) -> acknowledged(v1) -> replied(v2)`, implemented by three independently confirmed atomic Nurture commands. CommandExecution, output refs, business facts, and applicable handoff replay seed commit together; any conflict rolls the whole command back.
- Capture atomically writes one `family_authored/family_message/sent` Message, one complete family-to-org `delivered(v0)` Receipt, one `open(v0)` question Item, one `created` ItemEvent, one `active(v0)` TeacherAttention projection, the thread timestamp/version, and Execution. Immediate-only Pilot routing never exposes `pending` or cancel.
- Acknowledge requires current `open(v0)`, exact item version, exact original Grant, current caregiver/care-group/enrollment/thread/policy, and explicit confirmation. The command writes actor/time, `acknowledged(v1)`, an `acknowledged` event, and source Receipt `delivered(v0) -> acknowledged(v1)`. Attention stays active. No Message, reply Receipt, or implicit notification is created.
- Reply requires current `acknowledged(v1)`, exact version/original Grant, current caregiver scope, and explicit caregiver confirmation. The transaction writes one `caregiver_confirmed/caregiver_reply/sent` protected Message linked to Item/event, one org-to-family `delivered(v0)` Receipt targeted to the family, `replied(v2)`, the `replied` event, thread update, and Attention `active(v0) -> resolved(v1)`. The source Receipt remains acknowledged.
- Reply from `open`, `waiting_for_family`, or any other state is blocked. The current general implementation acceptance of `open|acknowledged|waiting_for_family` must narrow at both precondition and persistence predicates for the Pilot.
- `replied` is terminal-for-Pilot. No `closed`, `followed_up`, `waiting_for_family`, clarification, reopen, second reply, in-place edit, or continue-chat action follows. A correction/supplement creates a new `family_care_question`, command identity, Message, Receipt, Item, and Attention path. `suppressed` remains available only for B3-3d safety behavior.
- Receipt `delivered` means the current authorized logical target Nurture surface can owner-read the source after commit. Provider/device delivery, My-Chat Handoff/Outbox state, OS notification display, and Host read/unread are separate. Teacher/family Item/detail/notification open remains read-only and never writes Nurture `read`; only explicit acknowledge changes the source Receipt.
- Family presenters compose `sent -> caregiver acknowledged -> replied` from current Message/Receipt/Item facts. They do not expose internal status tuples or infer caregiver response from Host notification state. Both current same-family Guardians may owner-read the committed reply under B3-3b.
- Tests MUST assert every atomic fact set/version/event/ref, rollback at each write conflict, no attention resolution on acknowledge, no reply from open/waiting, no second reply/close/follow-up, source Receipt remains acknowledged after reply, reply Receipt remains delivered after open, Host/provider failure independence, and current owner-read family visibility without copied lifecycle state.

Pilot-0-B3-3d replay, revoke, redaction, and failure/privacy refinement:

- Each command uses a stable `commandRequestId` and canonical payload hash. Exact identity/input replay returns the original `CommandExecution` and output refs; identity reuse with different input fails before a business write. Response loss at capture, acknowledge, or reply cannot create a second Message, Receipt, ItemEvent, version, Attention, or output set. A genuinely new question uses a new identity, body ref, and route attempt.
- If Nurture committed but the worker lost the response, only the original durable claimed My-Chat Step may reclaim and replay the seed. Same-Step reclaim may finish one materialization; wrong-Step replay is denied and cannot create a second Handoff.
- Every execute, retry, presenter read, notification eligibility check, and notification open validates the original `grantId` and current role/family/enrollment/care-group/policy. Before capture, invalid Grant creates no fact. After capture and before acknowledge, invalidation suppresses the Item/active Attention and blocks acknowledge/reply. After acknowledge and before reply, the acknowledgment audit remains but the Item is suppressed and reply is blocked. After reply, the Item becomes a suppressed audit state without restoring workflow actions.
- A linked `pending` Receipt becomes `blocked(grant_revoked)`; `delivered|read|acknowledged` becomes `revoked_after_delivery(grant_revoked)`. Messages, Executions, and ItemEvents remain retained. Resolved Attention remains a resolved audit shell with no protected body/action; active Attention becomes suppressed. Expiry, replacement, Grant-owner role loss, enrollment/care-group drift, and policy disable use equivalent fail-closed behavior.
- Audit-shell retention is not receiver authorization. The original author may owner-read an unredacted Message only while the same-side role/family relationship remains current. A cross-role receiver loses protected-body access after Grant invalidation and sees only an allowed tombstone. Same-family Guardians may retain family-side access to the family submission; the caregiver cannot. A caregiver may retain author-side audit of their own reply; the family receiver cannot. Author-role loss removes author-side access as well.
- Guardian source redaction requires exact authorship and expected version, removes the body/protected ref, terminalizes the source Receipt as `revoked_after_delivery(source_redacted)`, suppresses the dependent Item and active Attention, and blocks caregiver read/acknowledge/reply. A previously committed caregiver reply remains a distinct unredacted author fact, but the question renders as a tombstone.
- Caregiver reply redaction removes the reply body/ref, terminalizes the reply Receipt as `revoked_after_delivery(source_redacted)`, and renders a family-side tombstone. The source question/source Receipt, terminal replied Item, resolved Attention, Execution, and events retain audit state. Reply redaction does not suppress or reopen the source Item and cannot permit another reply. No redacted Message can be unredacted.
- Immediate routing exposes no Pilot `cancel_route`. Calling cancel after logical delivery returns `route_already_visible` with no mutation. Post-submit withdrawal is represented by author redaction or Grant-owner revoke; cancel, redaction, and revoke remain separate operations and audit reasons.
- A precommit Nurture failure writes no business fact and retries the same command identity. Postcommit response loss replays the original Execution. Step/Handoff/Outbox failure leaves Nurture facts intact for same-Step recovery. Provider failure leaves Receipt state unchanged and uses Outbox retry/dead-letter. Owner API outage sends no notification and serves no cached body. Stale version/action performs no write and requests refresh. Wrong actor/workspace/family/child returns generic unavailable without existence disclosure. Capability/allowlist shutdown blocks new writes/activation but retains committed facts.
- Technical Admin may inspect refs-only evidence, reconcile an outcome-unknown original Step, replay/stop eligible Handoffs, request owner reevaluation, and disable the gate. Admin cannot edit Receipt/Item/Message, undo redaction, restore/replace Grant authority, synthesize provenance, or mark acknowledge/reply.
- Notification delivery is rechecked before each send. A pending notification after revoke/redaction is skipped; an OS notification already displayed cannot be retracted, but every open owner-rereads and returns only current content, allowed tombstone, or generic unavailable/retryable state. Host read/unread never changes Nurture lifecycle, and stale tokens/buttons/cache cannot revive access or actions.
- Tests MUST separate same-side author from cross-role receiver visibility after revoke, assert reply redaction leaves the source Item replied, cover exact/different-payload replay and wrong-Step denial, and jointly exercise owner outage, provider retry/dead-letter, stale notification, and kill switch. Current revoke/redaction repositories use `take: 100`; implementation MUST loop within the same transaction until closure or fail the transaction on overflow so no partially fenced fact set can commit.

Pilot-0-B3-4 representative-journey coverage refinement:

- Coverage uses four evidence layers rather than every possible E2E permutation. Contract/conformance tests exhaust all allowed and denied action/surface cells; Nurture domain/DB tests prove transaction, version, Grant, Receipt, Item, Attention, revoke, and redaction rules; two-database joint tests prove claimed-Step replay, Handoff/Outbox, notification owner reread, technical failures, and persistence privacy; rendered-surface tests prove Chat, role board/workbench, notification, and Technical Admin behavior.
- The three synthetic child scopes retain three independent families and seven logical accounts. Four independent question journeys are required: Family-1 primary Guardian submits through Chat, the lead Caregiver acknowledges in Caregiver Chat and replies on teacher board, and the second Guardian opens Family board/workbench history; Family-2 submits on Family board, the Caregiver acknowledges on teacher board and replies in Caregiver Chat, and the Guardian reads in Family workbench; Family-3 submits in Family workbench, the Caregiver acknowledges/replies on teacher board, and the Guardian opens the family result from Notification; Family-1 second Guardian submits a separate question and the Caregiver acknowledges/replies in Chat before that Guardian performs source-redaction validation. These journeys cover every Guardian write surface and all four `Chat|teacher_board` acknowledge/reply pairings without adding a fourth child.
- Every question uses an independent command identity and one canonical Nurture fact path. Surface transitions and opens never execute a command; drafts remain source-surface-local; committed results owner-reread across authorized surfaces; cross-family actors receive no target/existence/content signal.
- The Institution strand is distinct: institution board shows safe readiness/coverage/backlog aggregates and routes writes to the workbench; My-Chat invitation acceptance precedes Nurture participant/role binding; enrollment initiation remains separate from Guardian confirmation and Grant; board reread never exposes family bodies. Business cohort disable/recovery is separate from the My-Chat kill switch and cannot revive revoked/redacted/terminal facts.
- The Technical Operator strand remains refs-only: reconcile the original outcome-unknown Step, replay/stop eligible Handoffs, observe provider retry/dead-letter, request owner reevaluation, and perform disable-only shutdown. Operator tests deny body reads, Receipt/Item mutation, Grant restoration, redaction reversal, and business acknowledge/reply.
- The negative matrix covers wrong workspace/family/child/role/care-group/surface and raw-ref injection; exact/different-payload replay, wrong-Step, stale/concurrent versions, reply-before-ack, and second reply; Grant invalidation before capture, before acknowledge, before reply, and after reply plus expiry/replacement/role/enrollment/group/policy drift; source/reply redaction; draft/reload/cross-device/stale-token continuity; provider/owner/runtime failure; kill switch; and zero protected/claim/internal material in My-Chat persistence, Handoff, Outbox, Notification, logs, and telemetry.
- Every action/surface matrix cell maps to deterministic allow/deny evidence, while only representative boundary combinations require full joint/surface E2E. High-risk joint journeys run successfully three consecutive times with one business effect and at most one Handoff per question. CI may seed synthetic topology for kernel tests, but direct Prisma writes do not satisfy final authenticated onboarding evidence; Pilot-0-C owns that closure.
- B3-4 exit also requires author/receiver post-revoke tests, atomic revoke/redaction cascades beyond the current `take: 100` limit, all four caregiver surface pairings, second-Guardian same-family/cross-family boundaries, Institution/Operator body denial, and automated contract/DB/joint/surface evidence plus a final manual rendered journey record. Capability and workspace allowlist remain disabled throughout readiness decisions.

Pilot-0-C0 authenticated ingress and first-Institution bootstrap refinement:

- My-Chat authenticated shell is the only public Guardian/Caregiver/Institution/Notification ingress. Clients do not call Nurture owner or command routes directly. My-Chat authenticates the canonical user/workspace, validates the generic surface/route, carries idempotency and Nurture-issued opaque context, and renders typed owner/action results without interpreting business role/scope/state.
- Nurture owner/action services are private service-to-service boundaries. Every read/action re-resolves Nurture participant, eligible role, work/child scope, target, original Grant, policy, lifecycle, expected version, and presenter/action state. Raw client ids, claimed roles, work scopes, Grant fields, availability results, or business state are rejected. The current dev-host workflow/project API is not a Pilot artifact or public fallback.
- The internal experiment has no self-service Institution signup and no ambient workspace-admin bootstrap. One versioned Pilot provisioning specification binds the exact allowlisted workspace, scenario, synthetic Institution definition, initial Institution Admin My-Chat identity, and expiry. Pilot-0-D owns how the specification is issued, held, deployed, revoked, and audited.
- The provisioning specification is control-plane input, not a B3-2 `clarify|submit_action|open_notification` scenario token, URL/deep-link value, client payload, or reusable role credential. The initial Admin must authenticate and accept the matching My-Chat invitation before Nurture bootstrap can execute.
- One idempotent Nurture transaction creates or returns the exact Institution, Participant, first Institution Admin role assignment, and audit/Execution result. Exact replay returns the original refs; another user/workspace/scenario/institution definition, payload hash drift, expiry, second consumption, or already-closed bootstrap fails before a second effect.
- After success, bootstrap is permanently closed. Ordinary adult invitation, accepted-user participant binding, and staff-role assignment use the C-1/B3-1d-2 flow and cannot invoke bootstrap. Technical Operator may observe safe technical outcome evidence but cannot author/change the provisioning specification, select another business identity, invoke/reopen bootstrap, or directly edit created business facts.
- Contract/DB/joint/surface tests MUST cover unauthenticated acceptance, wrong user/workspace/scenario, expired/reused/drifted specification, concurrent exact consumption, exact response-loss replay, ordinary workspace admin, Institution Admin self-claim, Technical Operator mutation/reopen, raw-client role/scope injection, direct Nurture route access, dev-host exposure, and one exact successful fact/audit set with no protected body or secret in Host persistence/telemetry.

Pilot-0-C1 CareGroup and staff-onboarding refinement:

- C-1a uses existing `NurtureCareGroup` as the sole class aggregate. Institution workbench executes explicit create/update/pause/resume/archive commands with expected version and current Institution Admin policy; Institution board only rereads safe status/readiness/navigation. Pilot exposes no hard-delete or generic state-upsert action.
- C-1a family-invitation readiness is derived on every display/action from active Institution and CareGroup, at least one active care-group-scoped Lead Caregiver, required policy completion, and environment/workspace business gates. Readiness is not another CareGroup lifecycle/status row, Host projection, or cached authorization result. Pilot has one Lead Caregiver and no backup/multi-caregiver action concurrency.
- C-1b Institution Admin initiates a Staff Invitation from the workbench. My-Chat owns recipient contact delivery, authentication, invitation acceptance, and workspace membership. Nurture may retain an opaque Host invitation ref and safe intended Institution/CareGroup display context, but no raw contact/identity selector or protected family data.
- C-1c accepted canonical identity binds or reuses one workspace `NurtureParticipant` without a business role. Institution Admin then performs a separate strongly confirmed `assign_staff_role` command for exact `caregiver + care_group` scope and a distinct Lead designation. Invitation issue/acceptance, Host membership, Participant binding, Caregiver assignment, and Lead designation each have independent idempotency/audit/version evidence.
- C-1d Teacher-board/Chat access requires current Host membership, Participant, exact active RoleAssignment, active Institution/CareGroup, and current policy. Invitation intent, Participant presence, general workspace membership, Institution Admin status, or a role in another group grants no caregiver access. Suspend/revoke/expiry/Host loss/group pause/archive/scope drift fails closed immediately.
- C-1d offboarding retains Participant, invitation/acceptance, authorship, Messages, Events, Executions, and other independently valid scopes. Reinviting the same canonical user reuses the Participant but requires a new/current RoleAssignment and never reactivates a terminal role. Pilot forbids Institution Admin/Caregiver overlap and activates no backup teacher.
- C-1e Enrollment Invitation send remains unavailable until current derived readiness passes. A CareGroup may exist and be configured before staffing, but no family onboarding or protected family-care work can bypass missing Lead/policy readiness. Group pause/archive blocks new invitations; any treatment of existing Enrollment work remains governed by current revoke/policy/runtime-fence rules rather than deletion.
- Tests MUST cover group-name/version concurrency, wrong Institution Admin scope, board-write denial, direct/generic state mutation denial, no-delete, missing/expired/revoked Lead, policy/gate/group/institution inactive cases, Staff Invitation exact replay/drift/expiry/revoke, accepted-user Participant uniqueness, assignment-before-acceptance denial, wrong-group role, distinct Lead designation, Host membership loss, role suspend/revoke/reinvite, another-role preservation, Admin/Caregiver overlap denial, and Enrollment Invitation readiness transition without protected data leakage.

Pilot-0-C2a no-existing-profile and roster-entry refinement:

- `NurtureInstitutionRosterEntry` is a future Nurture-owned, Institution/CareGroup-local intake aggregate for an expected child whose Guardian may not yet use My-Chat/Nurture. It is not currently implemented and MUST NOT be simulated by overloading `NurtureChild`, `NurtureEnrollment`, a Host invitation, or an arbitrary JSON field.
- Institution workbench may create/correct a minimal roster entry with an institution-local label and optional institution-provenance age/birth prefill. Invitation send still rechecks C-1 readiness. Raw recipient contact, account/auth state, and delivery acceptance remain My-Chat-owned.
- The entry establishes no canonical child identity, Participant, Guardian role, Family, Enrollment, Grant, thread, Message, Receipt, care fact, or teacher/family content authority. Institution prefill must be shown as unverified and Guardian-editable.
- After authentication, a prospective Guardian either selects a current owner-resolved same-workspace child process or atomically creates/confirms the minimum child/process/family profile plus initial Guardian relationship. An authority-free new child profile is forbidden. Name/birth/contact fuzzy matching, global child search, institution auto-link, and cross-workspace reuse are forbidden in the Pilot.
- Roster-to-child linkage is written only with Guardian-confirmed Enrollment or its exact replay, never merely because a candidate was displayed or selected.
- Enrollment and Grant are later, separate strongly confirmed commands. An ignored, declined, expired, wrong-recipient, wrong-workspace, or revoked invitation cannot create or activate them and cannot make the roster entry operational for protected child work.
- Pilot journey admission requires every participating Guardian to finish authenticated signup plus minimum child/process/profile confirmation before J1-J4. Institution-only full child operations for non-participating families are excluded and require a separate future contract.
- Tests MUST cover create/correct replay and version conflict, wrong Institution/Admin/Group, send-before-readiness, raw-contact leakage, unverified-prefill display, Guardian edit, same-workspace authorized selection, atomic new profile/initial-Guardian creation and rollback, candidate-selection-without-roster-link, fuzzy/global/cross-workspace denial, ignored/declined/expired/wrong-recipient invitation, no authority-bearing side effects before confirmation, separate Enrollment/Grant confirmation, and retained local audit without protected child facts.

Pilot-0-C2b-1 first-Guardian refinement:

- My-Chat MUST authenticate the exact current Enrollment Invitation recipient. Nurture MUST reject unauthenticated, wrong-recipient, wrong-workspace, expired/revoked invitation, and raw identity/role/scope claims before first business write. Invitation acceptance remains evidence for entry, not relationship authority.
- The prospective Guardian MUST strongly confirm a relationship declaration, the edited minimum child profile, longitudinal-profile/privacy meaning, and the fact that later current Guardians may see family-visible facts. The confirmation is a product assertion, not legal verification.
- Participant binding/reuse, new Child/ChildCareProcess/Family, first Guardian RoleAssignment, and CommandExecution/result refs MUST commit in one Nurture transaction. Exact command replay returns original refs; payload drift conflicts; partial or authority-free creation is forbidden.
- Existing-profile selection MUST owner-resolve through a current same-workspace Guardian role. Institution prefill, name/birth/contact match, raw object id, Enrollment Invitation recipient status, and a claimed relationship label cannot grant selection.
- `primary_guardian` MUST NOT be added. `father|mother|other_guardian` relationship/display metadata MUST NOT alter Guardian policy, Grant ownership, author rights, or Co-Guardian rights.
- Pilot topology uses Family-1 first-Guardian establishment followed by one later Co-Guardian Invitation; Family-2 and Family-3 retain one Guardian each. Production legal/evidence verification remains a separately approved sensitive-data capability.
- Tests MUST cover exact replay/payload drift, transaction rollback at every row boundary, participant reuse, duplicate active Guardian uniqueness, wrong/expired/revoked invitation, wrong actor/workspace, confirmation omission, Institution assertion denial, existing-child non-Guardian denial, current-Guardian selection, no-primary equality, relationship-label permission equality, no implicit Enrollment/Grant, and presenter copy that does not claim legal verification.

Pilot-0-C2b-2 Co-Guardian Invitation refinement:

- Issue MUST require a currently authorized Guardian for the exact Family/ChildCareProcess. Nurture owns invitation intent/scope/policy; My-Chat owns raw contact/delivery/auth/acceptance. Institution/Caregiver/Operator issue or proxy acceptance fails closed.
- Host acceptance is exact-recipient identity/membership evidence only. Nurture intent state is the sole business-acceptance fence; stale Host delivered/accepted/provider state MUST NOT override Nurture cancel/revoke/expiry/current-policy denial.
- Issue persists no recipient Participant/role/history/Grant authority or new child/family facts. The Nurture intent carries only bounded safe metadata and opaque Host correlation; relationship label remains recipient-confirmed display metadata, not authorization.
- Acceptance MUST authenticate the exact recipient and rerun inviter-role, family/process lifecycle, invitation state/expiry/version, workspace, recipient uniqueness, and Pilot topology predicates. Inviter revoke after issue, concurrent cancellation/acceptance, duplicate recipient role, and cohort drift use first-commit-wins/current-state denial.
- Participant bind/reuse, second Guardian RoleAssignment, invitation consumption, and `CommandExecution` result/audit MUST commit atomically. Exact response-loss replay returns original refs; changed payload conflicts and cannot create a second role.
- Exact inviter MAY cancel a pending invitation. Cancellation after committed acceptance cannot revoke the role; C-2b-4 owns relationship exit/revoke.
- Pilot configuration permits exactly one Co-Guardian acceptance for Family-1 and none for Family-2/Family-3. Tests MUST prove this exact topology without adding a global two-Guardian constraint or implying a reusable product maximum.
- Tests MUST cover any-current-Guardian issue, no-primary behavior, wrong-family/process/scope, Institution/Caregiver/Operator denial, raw-contact persistence probe, exact/different-payload issue replay, wrong/expired/revoked/consumed recipient acceptance, stale Host accepted/provider state against Nurture denial, inviter revoke, cancel/accept race, Participant reuse, duplicate role, atomic rollback, no pre-accept history/Grant access, no implicit Enrollment/new child, exact `2 + 1 + 1` Pilot gate, and absence of a Schema cardinality cap.

Pilot-0-C2b-3 Guardian rights/history refinement:

- Before second-role commit, every family profile/history/action query MUST deny without leaking existence. After commit, both current Guardians resolve the same base family action set; join order and relationship label MUST NOT affect policy.
- Current owner queries MAY return eligible committed facts created before Co-Guardian acceptance, but MUST recheck current role/Family, Enrollment, original Grant for cross-role bodies, redaction, retention, and policy. Queries MUST NOT clone rows, create a per-Guardian history projection, or emit historical notifications.
- Both current Guardians MAY author new eligible questions under the active Grant and read currently allowed same-family committed facts. Exact author alone may redact a Message. Grant replace/revoke remains limited to the persisted `grantedByParticipantId`; acceptance cannot transfer ownership.
- Family-originated body access and cross-role reply access MUST use their distinct B3-3d fences. Grant revoke/replacement/expiry removes receiver-side caregiver/institution bodies even for a current Co-Guardian; same-family membership cannot revive a redacted source or reply.
- Drafts and active interaction contexts remain actor/surface-bound. The second Guardian MUST NOT read the first Guardian's unsubmitted Chat/form/AI draft, scenario token, or `NurtureInteractionContext`.
- Tests MUST cover pre-accept denial/post-accept current access, pre-join committed family history, original-Grant caregiver reply visibility, Grant revoke/replacement after join, family-source and caregiver-reply redaction, own-versus-other author redaction, Grant-owner versus Co-Guardian administration, equal label/order permission, cross-family denial, no draft/context sharing, no row duplication/backfill notification, and no arbitrary profile-edit authority.

Pilot-0-C2b-4 Guardian self-exit refinement:

- Only the exact current Guardian may request their own exit. Strong confirmation binds actor, Family/ChildCareProcess, exact RoleAssignment, expected version, consequence summary, and stable command identity. Peer Guardian, original inviter, Institution, Caregiver, Operator, raw-id, and service-principal removal attempts MUST fail closed.
- Policy MUST deny exit when the actor is the last current Guardian. The command cannot create an authority-free child/family aggregate and cannot infer transfer to another account.
- Role revoke, cancellation of pending invitation intents issued by the actor, revocation of active Grants owned by the actor, dependent Receipt/Item/Attention/body cascades, and `CommandExecution` result/audit MUST commit atomically. Grants owned by another current Guardian remain unchanged.
- After commit, every owner read/action and stale Notification/deep-link open MUST deny the exiting actor. Author/audit refs and business facts remain, but current-role loss removes body access; remaining Guardians receive no reassigned authorship or Grant ownership.
- Host account/workspace loss MUST deny access without mutating Nurture role/Grant state. Host restoration cannot reactivate a terminal role. Rejoin requires a new invitation/RoleAssignment; old Grant/role identities stay terminal.
- Pilot runs the Family-1 second-Guardian self-exit probe after J1-J4 or other required dual-Guardian evidence, preserving the main `2 + 1 + 1` topology during representative journeys.
- Tests MUST cover exact replay/payload drift, last-Guardian denial, self versus peer/inviter/Institution/Caregiver/Operator, stale role version, concurrent self-exit/action, actor-owned versus other-owned Grant, cascade completeness beyond current batch limits, atomic rollback, post-exit own/history/draft/action denial, stale notification, Host loss/restore, new-invitation rejoin with terminal old identities, retained audit/no reassignment, and absence of forced-dispute/admin DB paths.

Pilot-0-C2c-1 Enrollment Invitation issue refinement:

- Issue MUST resolve a current Institution Admin from authenticated My-Chat identity and rerun C-1 invitation readiness plus exact current unlinked RosterEntry policy. Client role/scope/ids, Institution board writes, Caregiver/Guardian/Operator, missing Lead/policy, inactive topology, and disabled Pilot gates fail before first business write.
- Nurture invitation intent MUST bind exact workspace/Institution/CareGroup/RosterEntry/issuer/opaque Host recipient binding/expiry/version/payload hash and enforce at most one effective pending intent per RosterEntry. Exact replay returns original refs; changed dimensions conflict.
- My-Chat raw contact/provider/auth/membership/Host acceptance state MUST remain outside Nurture. Host accepted/delivered state is identity/delivery evidence only and MUST NOT override current Nurture intent denial.
- Issue MUST have zero Participant/Guardian/Child/Process/Family/Enrollment/Grant/roster-link/thread/Message/Receipt/teacher-child effects. Presenter output MUST expose only allowlisted safe invitation display and mark Institution prefill unverified.
- Three Pilot RosterEntries MUST receive three distinct Enrollment Invitation intents. The Family-1 Co-Guardian Invitation MUST use a distinct type/identity/policy path and cannot consume or mutate the Enrollment Invitation intent.
- Tests MUST cover exact replay/payload drift, concurrent duplicate issue, one-effective-pending uniqueness, wrong Institution/Admin/Group/RosterEntry/workspace/recipient binding, linked/stale RosterEntry, readiness and gate loss, raw-contact/persistence/log probes, stale Host accepted state, display allowlist/unverified provenance, zero business side effects, three-intent topology, and cross-kind Co-Guardian confusion denial.

Pilot-0-C2c-2 acceptance/child-branch refinement:

- Host acceptance MUST bind the exact recipient but MUST NOT consume the Nurture intent or authorize a child. Nurture reruns current intent, recipient/workspace, Institution/CareGroup readiness, RosterEntry, Pilot gate, and policy before returning any branch.
- Current same-workspace Guardians MUST receive owner-resolved safe candidates and explicitly choose a Nurture opaque option even when exactly one candidate exists. Raw id, Host-selected child, Institution prefill, name/birth/contact fuzzy/global match, wrong-family candidate, and stale option MUST fail without existence leakage.
- A recipient with no eligible Guardian role MUST use the independent C-2b-1 atomic profile/first-Guardian command. Exact replay returns the same profile refs; Enrollment invitation/intent remains pending and unchanged.
- A non-Guardian cannot select another Guardian's existing process. The flow MUST direct to Co-Guardian Invitation without merging, copying, or auto-linking profiles.
- Pending existing-child selection MUST live only in bounded `NurtureInteractionContext`; context expiry/revoke/participant or invitation drift requires fresh owner resolution. No RosterEntry/invitation long-lived child ref may appear before C-2d.
- Before C-2d, owner and DB tests MUST prove no Roster link/Enrollment/Grant/thread/teacher fact/invitation consumption. A separately committed new family profile remains after invite cancel/expiry but exposes no Institution data.
- Tests MUST cover wrong recipient/workspace, stale/revoked invitation/readiness, zero/one/multiple candidate branches, mandatory single-candidate confirmation, opaque option replay/drift, existing non-Guardian denial, Co-Guardian redirect, independent new-profile replay/response loss, abandonment after profile creation, InteractionContext expiry, no pre-Enrollment linkage, all three Pilot new-profile journeys, and an existing-profile boundary without a fourth child.

Pilot-0-C2c-3 invitation lifecycle refinement:

- Tests and policies MUST treat `pending|consumed|cancelled|superseded` as stored states and expiry as `now >= expiresAt`; an expired pending row MUST fail without a sweeper. Pilot TTL is exactly 168 hours with boundary tests immediately before/at/after expiry.
- Current exact-Institution Admin cancellation and exact-recipient decline MUST use separate actor/reason evidence but the same terminal no-continuation guarantee. Wrong Institution/Admin, Caregiver, Operator, other recipient, stale version, and terminal intent attempts fail closed.
- Reissue MUST atomically supersede the old pending intent and create one new intent with new identities/expiry/hash/Host binding and immutable lineage. Correction cannot mutate recipient/CareGroup/RosterEntry or extend expiry in place.
- Provider retry of the same Host invitation MUST retain the same business intent; business reissue MUST not reuse Host acceptance or replay identity. Stale provider/client state against cancel/decline/expire/supersede/consume MUST fail.
- Readiness loss MUST derive blocked while keeping the stored lifecycle unchanged; recovery before expiry MAY resume after full current revalidation. Expiry or another terminal lifecycle still wins.
- Invitation-bound InteractionContext MUST become unusable after cancel/decline/expire/supersede or binding drift. Independently committed family profiles remain with no Institution linkage.
- Expected-version first-commit-wins tests MUST cover cancel versus C-2d consume, decline versus consume, supersede versus accept/context use, concurrent reissue, and duplicate issue. Only C-2d may write consumed; exact replay returns original outcome.
- Tests MUST cover 168-hour boundaries, no-sweeper expiry, actor-specific cancel/decline, exact replay/payload drift, immutable reissue lineage, provider retry separation, readiness block/recovery, context invalidation, retained audit/no deletion, three ordinary paths, one cancel/reissue race, and one expiry/stale-open probe without cohort growth.

Pilot-0-C2c-4 confirmation-ready result refinement:

- The accepted child branch MUST return `ready_for_enrollment_confirmation`, not enrolled/success wording. Presenter tests MUST allow only Institution/CareGroup, Guardian-confirmed child display, invitation expiry, privacy consequence, and explicit no-implicit-Grant text; raw ids, Host bindings, policy internals, and unverified profile fields are forbidden.
- Nurture MUST issue a five-minute `submit_action` context bounded earlier by invitation expiry and bound to exact invitation/participant/ChildCareProcess/Institution/CareGroup/RosterEntry/surface/action/expected versions/canonical hash. Raw-id replacement, cross-workspace/participant/surface/action reuse, payload drift, and context extension MUST fail.
- Chat, family board, and family workbench MUST converge on `confirm_family_enrollment`; all three rerun pending/not-expired invitation, exact recipient/current Guardian, roster, readiness/policy, conflicting Enrollment, and expected-version checks on render and submit.
- Existing-child selection MUST remain context-only; independent new-profile facts MAY remain durable but MUST have no Institution link. Context expiry/consume/revoke, terminal invitation, readiness loss, or version/binding drift returns safe unavailable/refresh and requires fresh owner resolution.
- C-2c-4 owner/DB/outbox tests MUST prove zero Enrollment, RosterEntry-child link, Grant, thread, teacher-visible child fact, notification, Workflow Handoff, and invitation consumption. C-2d is the only strong-confirmation commit boundary.
- Tests MUST cover same-result replay, stale cached confirmation, all terminal invitation states, readiness loss/recovery, the five-minute/invitation-expiry minimum boundary, wrong surface/device/account reuse, no cross-surface draft transfer, and all three Guardian entry surfaces without cohort growth.

Pilot-0-C2d-1 atomic Enrollment refinement:

- `confirm_family_enrollment` MUST require strong confirmation by the exact invitation recipient who remains a current Guardian. Tests MUST reject another Guardian, inviter/Admin/Caregiver/Operator/service identity, client-authored ids/scope/role, wrong surface/account/workspace, and a copied or altered context.
- The command MUST reload every invitation/context/recipient/Guardian/ChildCareProcess/Family/RosterEntry/Institution/CareGroup/Lead/policy/Pilot/conflicting-Enrollment/version precondition before the first write. A stale cached authorization result cannot substitute.
- Context consumption, stable CommandExecution, exact Enrollment creation, canonical roster link, exact invitation consumption with Enrollment correlation, and audit/result refs MUST commit in one Nurture transaction. Fault injection after every write boundary MUST roll back all effects.
- Exact committed replay and response loss MUST return the same Execution/Enrollment/roster/invitation result. Payload/context/hash drift and concurrent stale confirmation MUST conflict without a second Enrollment or overwrite.
- Tests MUST prove zero implicit Grant, family-content teacher access, or client/provider authority. Initial status/time/lifecycle/uniqueness assertions wait for C-2d-2; thread assertions wait for C-2d-3; presenter/Handoff assertions wait for C-2d-4.

Pilot-0-C2d-2 Enrollment lifecycle and concurrency refinement:

- Confirmation MUST create `active` with a database-issued transaction `joinedAt`. Tests MUST reject pending/client status, client/Host/Institution timestamp, backdated/future time, in-place time edit, and any scheduled-start implication.
- Effective uniqueness MUST treat pending/active/paused as current-conflicting for one workspace/ChildCareProcess/Institution across CareGroups. Tests MUST allow separately scoped current Enrollments at different Institutions and prove no access or Grant sharing.
- Same-Institution same-group new command MUST return safe `already_enrolled`; exact stable replay MUST return the original Execution/result. Same-Institution different-group, occupied RosterEntry, changed invitation/context, and stale version MUST return deterministic conflict without mutation.
- Concurrent same/different invitation and roster-link tests MUST prove first-commit-wins through database uniqueness and expected versions. Losing invitation remains pending/unconsumed, losing RosterEntry remains unlinked, and no context/Execution success or partial effect survives.
- Paused MUST still block another same-Institution Enrollment. Ended/withdrawn MUST reject reactivation; re-entry MUST use new roster/invitation/Enrollment identities. Deleted MUST be unavailable as a Pilot transition or uniqueness/audit bypass.
- C-2d-2 tests MUST NOT infer pause/resume/end/withdraw/transfer actor authority; C-2f owns those commands. Thread creation remains C-2d-3 and result/Handoff remains C-2d-4.

Pilot-0-C2d-3 private Thread timing refinement:

- Enrollment commit tests MUST prove zero Thread/ThreadParticipant. Institution/Caregiver owner presenters before Grant MUST expose only allowlisted roster membership, Guardian-confirmed safe child label, Enrollment status, and joinedAt; family/profile/contact/Grant/thread/message/body existence MUST remain absent.
- First active-Grant confirmation MUST atomically create the exact active enrollment-private Thread plus Grant/Execution/audit refs. Fault injection and races MUST leave neither Grant-only nor Thread-only state, and uniqueness MUST prevent a second active Thread for the same workspace/process/family/Enrollment.
- Different Institution Enrollment MUST resolve a different Thread. Exact Grant replay and replacement MUST reuse the same Thread id with no history copy; first Message MUST reject missing Thread rather than lazily create one.
- Exact Thread existence/scope/lifecycle MUST fail closed when unavailable. ThreadParticipant rows are not authorization: missing projection MUST allow an otherwise fully current actor, while active/stale/forged/cross-scope projection MUST fail to grant or preserve access when role, Enrollment/CareGroup, original/current Grant, policy, source lifecycle, or redaction denies. Raw thread/participant ids and another Institution's Thread MUST not leak existence or content.
- Revoke/expiry/replacement MUST retain the Thread/audit identity while current owner reads/actions fail closed as required. A replacement or later Grant MUST NOT revive content invalidated by the original Grant.
- Ended/withdrawn Enrollment and re-entry tests MUST prove the old Thread is not migrated or reused and the new Thread appears only with the new Enrollment's first active Grant. C-2f still owns close/archive transitions; C-2d-4 owns result/Handoff.

Pilot-0-C2d-4 Enrollment result, recovery, and Handoff refinement:

- Success MUST return `enrollment_confirmed` backed by stable CommandExecution refs. Presenter tests MUST allow only safe child label, Institution, CareGroup, current status, joinedAt, and no-Grant/no-private-communication copy; raw/internal/Host/family/contact/profile fields, Thread/Grant refs or internal lifecycle fields, and protected content MUST be absent.
- `review_family_care_grant` MUST remain a route affordance with no command/token authority. Tests MUST prove fresh owner resolution before the existing `confirm_child_link_grant` action and reject route/action aliasing, old context reuse, raw ids, and client-authored availability.
- Exact replay and response loss MUST return one Execution/business effect while owner-rereading current Enrollment. Later lifecycle/role/workspace changes MUST produce current result or safe unavailable/tombstone rather than cached active confirmation.
- Consumed-invitation recovery before/at/after the former expiry MUST preserve the committed Enrollment result for the exact currently authorized owner and MUST deny wrong recipient/Guardian/workspace without existence leakage. Expiry remains authoritative only for unconsumed continuation.
- Faults after business commit in presenter/client/network/provider MUST leave Enrollment/roster/invitation/context unchanged and MUST NOT compensate, delete, reopen, or duplicate. Pre-commit fault injection retains C-2d-1 atomic rollback behavior.
- CommandExecution MUST contain schema-valid explicit `handoffRequestSnapshotsPayload=[]`. DB/outbox/worker tests MUST prove zero activation seed, Handoff, Outbox event, notification, and deep link for Enrollment confirmation; Institution surfaces discover the update only through owner reread.
- Contract tests MUST reject a future Enrollment notification added implicitly to the same Pilot command. Any later versioned action/Handoff requires durable claimed-Step provenance and separate acceptance, and delivery cannot affect Enrollment success.

Pilot-0-C2e-0 ThreadParticipant authority refinement:

- Guardian and Caregiver tests MUST derive permission from current Host/Nurture identity, Participant/RoleAssignment, exact Enrollment/CareGroup, exact current or original Grant, exact Thread/source lifecycle, policy, and redaction. Stored participant projection MUST NOT be an independent allow or deny predicate.
- Positive evidence MUST cover a valid actor with an exact active Thread and no ThreadParticipant row. Both family input and caregiver Item action remain eligible when every authoritative predicate passes.
- Negative evidence MUST cover an active participant row after role revoke/suspend, Grant revoke/expiry/replacement, Enrollment/CareGroup drift, policy disablement, source redaction, and Thread terminalization; every case fails closed through the authoritative predicate.
- Forged participant/role/scope rows, raw ids, another Institution's row, and cached active projection MUST NOT reveal existence or create authority. Hidden/inactive projection may alter list presentation but cannot change business eligibility.
- First-Grant fault and concurrency tests MUST NOT require participant fan-out. Optional read/subscription/display projection may be written only after owner authorization, and projection write failure cannot leave Grant/Thread business authorization partially represented.

Pilot-0-C2e-1 Grant review and confirming-Guardian refinement:

- Actor tests MUST allow either current exact-family Guardian to review and first-confirm while rejecting Enrollment-recipient-only or join-order hierarchy. Institution Admin, Caregiver, Operator, service identity, non-Guardian family member, wrong Family/Child/workspace actor, and stale/revoked/suspended role MUST fail without existence leakage or effects.
- The first committed confirmation MUST establish the exact confirmer as sole owner. Another Guardian may use/inspect current scope but cannot replace/revoke; exact replay and a new `already_satisfied` command MUST preserve the first owner. C-2e-2 supplies database first-commit evidence.
- Presenter tests across Chat, family board, and family workbench MUST expose the same mandatory safe facts: child label, Institution/CareGroup, bidirectional question-workflow scope, current eligible users, bounded duration, owner/non-transfer consequence, revoke/retention behavior, and exclusions. Tests MUST reject missing mandatory consequence copy and raw ids/internal enum/policy/hash/unverified child data.
- Confirmation tests MUST require an authenticated current session, fresh Nurture owner resolution, and explicit `authorization_gate`. Natural-language/LLM agreement, page open, navigation, preview, Enrollment confirmation, default-selected control, and client-authored confirmation state MUST NOT execute the command. No extra Pilot password/OTP/biometric flow is inferred.
- `submit_action` tests MUST prove five-minute exact workspace/participant/role/family/process/Enrollment/Institution/CareGroup/action/profile-hash/version/surface binding; opaque-context-plus-explicit-confirmation-only input; and denial for account/Guardian/surface/device copy, expiry, consume/revoke, payload/target/profile/expiry injection, or any binding/policy/allowlist drift.
- Pre-submit tests MUST prove zero Grant/Thread/Execution/protected-content/Handoff/notification/cross-role effect. Existing exact active state suppresses a create affordance; a racing confirmation returns safe current/`already_satisfied` semantics without owner transfer. Atomic write/time/expiry/uniqueness assertions remain C-2e-2.

Pilot-0-C2e-2 atomic Grant/Thread test refinement:

- Schema/migration tests prove the raw active Grant partial unique index, canonical singleton Pilot purpose, array normalization/no duplicates, missing-owner Restrict FK repair, and existing active Thread partial uniqueness. Preflight fixtures cover duplicate active Grant identity, orphan owner, pending/deleted/future-active rows, and refusal to auto-merge or auto-select an owner.
- Transaction fault injection stops after every planned write: context consume, elapsed-row terminalization, Grant insert, Thread insert/reuse resolution, CommandExecution, audit/result refs. Every injected failure rolls back all writes and leaves no partial authority. No external service/provider call and no Prisma type crosses the scenario domain boundary.
- Replay tests prove exact command/response-loss replay returns one original Execution and business effect. Two Guardians with distinct command ids and contexts race the same business identity: one commits `applied`, the other rereads after a known retry and commits `already_satisfied`; owner and expiry remain the winner's values.
- Known serialization, deadlock, Grant partial-unique, and Thread partial-unique races receive bounded whole-transaction retry with fresh reads. Retry exhaustion returns `command_busy`. Unknown unique/integrity errors remain technical and cannot be converted to `already_satisfied`.
- Time tests use database transaction time and cover `effectiveFrom`, both sides of `[effectiveFrom, expiresAt)`, the exact 30-day boundary, earlier allowlist expiry, allowlist closing during submit, no rolling extension on same-definition, elapsed active-row terminalization plus fresh identity, and no expiry-worker dependency.
- State-matrix tests cover exact replay; exact active same-definition; terminal history only; active definition mismatch; target/Enrollment drift; multiple matching active rows; pending/deleted/future-active/missing lifecycle timestamps; role/policy/Enrollment/allowlist invalidation; active owner ineligibility; no historical Thread; exact active Thread reuse; and terminal/mismatched/cross-Institution Thread reconciliation.
- Applied and `already_satisfied` results reference the exact Grant/Thread. C-2e-2 creates no ThreadParticipant, Message, Receipt, Item, Attention, Handoff, Outbox, notification, or deep link. Result presentation/recovery and explicit-empty Handoff remain C-2e-3; replace/revoke/owner loss remain C-2e-4.

Pilot-0-C2e-3 Grant result/recovery test refinement:

- Command tests cover all four response combinations: `executed/applied`, `replayed/applied`, `executed/already_satisfied`, and `replayed/already_satisfied`. Each Execution stores exactly the versioned Grant/Thread refs, and a second Guardian's convergent Execution preserves that actor for audit without changing or impersonating the Grant owner.
- Presenter tests use `family_care_grant_current` and cover `activated|already_active|processed_but_unavailable` crossed with `owner|family_user|none`. Active safe output includes only child label, Institution/CareGroup, scope, effective/expiry times, and current actions. Raw account/Participant/role/Grant/Thread/Execution ids, policy/hash, and internal reasons are rejected from client/route/transcript/notification/analytics output.
- Response-loss tests prove Execution lookup precedes consumed/expired context classification, exact retry needs no second confirmation, and replay returns one business effect. Exact replay after Grant expiry/revoke/replacement or caller authority loss retains immutable Execution but renders only the currently entitled state or generic unavailable.
- Missing-command-identity tests route to ordinary current-state presentation and prove no probe command, `open_result` token, raw output ref, automatic resubmission, or second confirmation is created. Wrong caller/workspace/surface cannot distinguish missing Execution from inaccessible Execution.
- Context/failure tests prove deterministic drift invalidates the context without Execution/business success; retryable contention/transaction/transport/owner-read failure leaves the original context usable only within TTL; presenter failure after commit never compensates Grant/Thread/Execution.
- Schema/command tests require `handoffRequestSnapshotsPayload=[]` and null driver for applied, already-satisfied, and exact replay. Grant confirmation creates no Step/Handoff/Outbox/notification/deep link/teacher-visible state/Message/Receipt/Item/Attention/ThreadParticipant and makes no remote provider call.
- Surface tests prove owner versus family-user action availability and require question creation to start a separate draft/preview/context/confirmation/command. Grant result rendering cannot create protected content or auto-navigate into a hidden action.

Pilot-0-C2e-4a Grant replacement test refinement:

- Actor/presenter tests allow only the exact current owner Guardian and deny another Guardian, inviter/Enrollment confirmer, Institution Admin, Caregiver, Operator, service actor, wrong family/process/workspace, stale role, and owner-ineligible actor. All three Guardian surfaces show the same old/new delta, expiry, old-work-stop, retention, unchanged-owner, and no-revival consequences.
- Context tests enforce five-minute exact actor/role/process/Enrollment/current CareGroup/old Grant version/new canonical profile/surface binding, opaque-context-plus-explicit-confirmation input, and rejection of copied context, raw ids, client expiry/profile/owner injection, or any policy/allowlist/version drift.
- Schema/migration tests cover nullable unique Restrict `supersedesGrantId`, old `replacedAt`/`replacedByParticipantId`, no mirrored old-row replacement id, same workspace/process/Enrollment/owner lineage, one direct successor, and preflight rejection of duplicate/broken/cyclic/cross-scope history without auto-repair.
- Transaction fault injection covers context consume, old status/audit/version update, successor insert, Thread reuse, every old-work fence, and Execution. Every fault rolls back old/new/lineage/fence/Execution; committed success has one database time for old `replacedAt` and new `effectiveFrom` and no active overlap/gap.
- Outcome tests cover exact replay; exact same-definition `already_satisfied` without renewal; valid replacement; terminal/deleted/missing old Grant; owner ineligibility; topology drift; replace-versus-revoke; two different replacement commands; known unique/serialization retry; unknown lineage/integrity failure; and response loss.
- Old-object tests prove every Message/Receipt/Item/Attention retains old `grantId`, fails current cross-role access/action immediately, and cannot be revived by successor Grant or reused Thread. C-2e-4d supplies complete cascade-to-closure assertions.
- Execution tests require exactly terminal-old/new-active/Thread output refs, explicit empty snapshots, null driver, no Step/Handoff/Outbox/notification/deep link/protected object, and no remote call in the transaction.

Pilot-0-C2e-4b owner-initiated revoke test refinement:

- Actor/surface tests allow only the exact active Grant owner who remains a current exact-Family Guardian and deny another Guardian, Institution Admin, Caregiver, Operator, service actor, raw-id caller, wrong family/process/workspace, stale role, and owner-ineligible actor. Chat may present confirmation but natural language, LLM intent, navigation, and default controls cannot execute.
- All three Guardian surfaces show the same immediate-stop, retained-audit, already-seen-information, irreversible, and fresh-authorization consequences. Five-minute context tests enforce exact actor/role/process/Enrollment/current CareGroup/Grant version/action/surface binding, explicit confirmation, and denial of copied/expired/consumed/drifted context or client actor/reason/time/version injection.
- Persistence tests require database transaction time, exact resolved revoke actor, fixed `user_revoked` Grant reason, downstream `grant_revoked`, and one version increment. Arbitrary reason text or client audit fields are rejected and internal codes/raw refs do not reach presenter, route, transcript, notification, or analytics payloads.
- Transaction fault injection covers context consume, Grant transition/audit/version, every dependent-fence stage, and Execution. Every fault rolls back the whole unit; C-2e-4d adds loop-to-closure/overflow and bounded-summary coverage. Tests explicitly reject the current `take: 100` partial commit and incomplete dependent-ref output pattern.
- Outcome tests cover exact applied replay; new eligible same-Grant revoke as `already_satisfied` without audit rewrite; replaced/expired/deleted/missing/scope-drift states; current-owner loss; revoke/revoke, revoke/replace, and question/revoke races; known serialization retry; response loss; and unknown integrity failure.
- Fresh-authorization tests prove the revoked row is never edited/reactivated/replaced, any current equal Guardian may later complete a full new confirmation and become the new Grant owner, and the new Grant/reused Thread applies only to future work and never revives revoked-Grant Message/Receipt/Item/Attention.
- Execution tests require exactly terminal Grant/Thread refs, explicit empty snapshots, null driver, no per-dependent output refs, and no Step/Handoff/Outbox/notification/deep link/protected object or remote call. Owner-reread tests skip unsent delivery after revoke and render only a permitted tombstone/unavailable state when an already displayed notification is opened.

Pilot-0-C2e-4c Grant-owner loss test refinement:

- Schema/migration tests cover additive Restrict `grantedByRoleAssignmentId`, new/Pilot-active non-null enforcement, participant/Guardian/scope/time consistency, and exact audit-backed backfill. Missing, duplicate, conflicting, wrong-participant, wrong-scope, or time-incompatible candidates must block activation/manual-reconcile without heuristic selection.
- Resolver tests require the exact stored role id, participant, Guardian type, scope reach, active status, effective window, policy, and non-deletion. Rejoin through a new RoleAssignment for the same Participant, a forged current row, a current peer role, or a cached role result cannot satisfy old-Grant owner eligibility.
- Host tests prove account disablement, workspace-membership loss, and owner-service failure deny the affected user's ingress/presenter/action/stale open without writing Nurture RoleAssignment/Grant or globally revoking another actor's access. Host restore requires complete reread and cannot restore a terminal Nurture role or Grant.
- Suspension tests prove the exact suspended/temporarily ineffective role blocks every original-Grant read/action/delivery with no Grant terminalization, transfer, or peer fresh-confirm bypass. Only an independently authorized resume of the same exact role row may restore eligibility; C-2e-4c exposes no suspend/resume action.
- Terminal tests cover revoked, expired, deleted, and effective-end exact roles. Authorization blocks before reconciliation, a new role row never revives old work, no peer inherits owner, and last-Guardian/forced-removal/custody/authority-reassignment cases remain unavailable outside Pilot.
- Self-exit fault injection proves exact role revoke, pending actor-issued invitation cancellation, actor-owned active Grant `owner_self_exit` revoke, every dependent fence, and one Execution are atomic. Grants owned by another Guardian, retained authorship/audit, and the no-last-Guardian rule remain unchanged.
- Nurture-local reconciliation tests prove stable owner-loss identity, `owner_role_ended`, database time, nullable non-inferred actor, exact replay, immediate pre-reconcile fence, complete transaction rollback, and no dependence on My-Chat Step/Handoff/Outbox. Reconciler and fresh confirmation races converge without double terminalization.
- Fresh-confirm tests require another current exact-Family Guardian and full review/context/confirmation. The transaction may terminalize an unreconciled old active Grant, then creates a new independent Grant bound to the new participant/role, reuses Thread only as container, emits exactly new Grant/Thread refs, stores no `supersedesGrantId`, and never revives old work. Host loss or role suspension cannot enter this path.
- Concurrency tests cover self-exit versus question/revoke/replace, terminal role end versus action, reconciler versus fresh confirmation, Host loss/restore versus action, role-version drift, Grant-version drift, and deterministic role-before-Grant-before-Thread/dependent lock ordering. Exact replay retains immutable receipt while presenters return current safe state.
- All owner-loss/recovery outcomes require explicit empty snapshots, null driver, no Step/Handoff/Outbox/notification/deep link/protected object, and no remote call inside the Nurture transaction. C-2e-4d supplies exhaustive loop-to-closure and bounded cascade evidence.

Pilot-0-C2e-4d dependent cascade closure test refinement:

- Classification tests cross permanent Grant revoke/replacement/expiry/terminal-owner-loss and source/reply redaction against temporary Host loss, exact-role suspension, owner outage, and policy/Institution/CareGroup unavailability. Only permanent cases may mutate cascade state; every case must fail closed immediately while temporary recovery preserves resumable business lifecycle.
- Schema/migration tests cover typed `NurtureInteractionContextDependency`, exactly-one raw CHECK, Restrict FKs, workspace/type uniqueness/indexes, multi-candidate rows, atomic context issuance, and activation denial for protected contexts whose JSON refs lack complete typed dependencies. JSON scanning cannot be a fallback.
- Grant cascade matrices cover active/consumed/revoked contexts; every Receipt status and retry control; every Item status; active/no clarification; every Attention status; Thread summary; Message/audit retention; and body-derived payload scrubbing. Status, version, reason, time retention, tombstone, and forbidden-field assertions are exact.
- Redaction matrices independently cover Guardian source before/after acknowledge/reply and Caregiver reply after delivery. Source redaction suppresses its workflow but retains an independent reply body under its author's current policy; reply redaction affects only reply-side facts and cannot suppress/reopen the source Item, alter source Receipt, or enable another reply.
- Transaction tests use root-first and Grant-before-Message lock order, deterministic primary-key keyset batches, one Serializable transaction, no `SKIP LOCKED`, no intermediate commit, and root revalidation by every dependent writer. Concurrent insert/action versus cascade must either precede and be included or follow terminal root and fail before write.
- Cardinality tests cover zero, one, batch-minus-one, exact batch, batch-plus-one, more than 100, exact hard cap, and hard-cap-plus-one rows for every dependent type and mixed totals. Cap overflow fails before root mutation; no row, audit, Execution, output, or prefix effect commits.
- Fault injection after root lock, count, every batch/type transition, clarification event, projection scrub, closure query, audit, and Execution proves whole-transaction rollback. Final root-specific `NOT EXISTS` assertions reject any eligible survivor or phantom and exact replay creates no second transition/event/audit.
- `NurtureLifecycleCascadeAudit` tests require unique root/version/cause identity, canonical schema/count payload, deterministic closure hash, database completion time, indexed Restrict owning-Execution FK with one Execution allowed to own multiple root audits, and no body/token/dependent refs/account-device targets/Host state. Existing exact CommandExecution output refs remain byte-for-byte semantically bounded.
- Persistence/privacy tests search Message, Item, Attention, Thread summary, context state, Receipt metadata/driver, events, audit payload, logs, traces, metrics, replay seed, Handoff/Outbox, Notification, and Admin evidence for body, body-derived summary, attachments, token, raw account/device, or hidden target leakage after each cascade branch.
- Joint Host tests prove immutable old seeds remain same-Step-only and refs-only; post-invalidation materialization/consumer/provider retry stops on owner reread; unsent Notification is skipped; already shown OS Notification opens to current tombstone/unavailable; owner outage sends nothing; Admin only sees bounded evidence and cannot edit/close business facts.
- C-2e completion requires all prior C-2e-0 through C-2e-4d matrices plus removal of `take: 100`, sliced dependent refs, JSON-only discovery, and incomplete projection handling. No product implementation result is claimed until schema, kernel, repositories, surfaces, joint tests, and migration evidence exist.

Pilot-0-C2f-0 Enrollment lifecycle and actor-boundary test refinement:

- Status tests MUST classify `active|paused` as current and uniqueness-conflicting, legacy `pending` as conflict-bearing but not Pilot-creatable, `ended|withdrawn` as terminal/non-reactivatable, and `deleted` as unavailable for Pilot commands, uniqueness bypass, retention erasure, or re-entry.
- Actor tests MUST separate current exact-Family Guardian family-side restriction/withdrawal eligibility from exact-scope active Institution Admin institution-side restriction/end/transfer-proposal eligibility. Caregiver, Lead Caregiver, Technical Operator, service identity, natural-language/AI inference, raw ids, Host membership, and ambient administration MUST have zero topology authority.
- Pause classification tests MUST deny Enrollment-dependent cross-role reads/actions/delivery/new Grant while preserving nonterminal Enrollment/Grant/Thread/content/audit facts and producing no permanent C-2e cascade mutation. Recovery tests wait for C-2f-1 but MUST preserve the invariant that one side cannot release the other side's restriction.
- Multi-side tests MUST prove aggregate `paused` is not resume authority and that independently attributable family/institution restrictions can coexist. C-2f-1 MUST cover cross-side release denial, stale versions, concurrent pause/resume, and terminal-transition races before any action is implemented.
- Terminal classification tests MUST require old-Enrollment Grant/dependent closure for withdrawal, Institution end, and completed transfer while rejecting terminal reactivation. Exact status/reason/transaction behavior remains C-2f-2/C-2f-3 and cannot be inferred from C-2f-0 alone.
- Transfer boundary tests MUST reject in-place `careGroupId` edit, old Enrollment reuse, and movement/revival of RosterEntry, Grant, Thread, Message, Receipt, Item, Attention, context, or Handoff authority. The target relationship requires a new Enrollment and later fresh Grant/Thread authorization.
- Cross-Institution tests MUST prove pause/end/withdraw/transfer/policy/Grant effects in one Institution neither mutate nor grant access in another current Institution relationship. Cross-workspace tests MUST reject fuzzy/global/raw-link matching and every automatic profile/Enrollment/Grant/Thread/content/audit migration despite a shared My-Chat adult identity.
- C-2f-0 documentation evidence MUST NOT claim a schema migration, action key, transaction, result, Handoff, notification, provider, or runtime implementation. C-2f-1 through C-2f-5 own those executable details.

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
- My-Chat may hold and return the token in bounded surface/client interaction state but must not inspect, modify, or branch on the token contents. Notification delivery never durably stores raw token material.
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

R8-B1-B ingress/result/activation ownership remains locked, with surface entitlement refined by Pilot-0-B3-0:

- My-Chat Chat is a role-agnostic Nurture entry only for Chat-entitled guardian/caregiver roles. Institution-admin Nurture work enters through institution board/workbench. My-Chat selects the scenario; Nurture resolves surface entitlement, actor role, work scope, target, business intent, and propagation direction.
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
- My-Chat Technical Admin may inspect safe host evidence and opaque Nurture refs, then request owner reevaluation. Nurture owner recovery decides business convergence; the technical operator cannot directly execute business cancel/failure/reissue or edit Nurture status.

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

- Pilot-0-B3-1d-1 refinement: My-Chat Technical Admin may inspect safe attempts/evidence and opaque refs, reconcile the original outcome-unknown Step, replay/stop an eligible Handoff, and request `reevaluate_route` through owner recovery. The earlier direct Admin permission for `reissue_route` or `cancel_route` is superseded; a currently entitled business actor or Nurture owner recovery service decides business cancel/failure/resend under current policy.
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
