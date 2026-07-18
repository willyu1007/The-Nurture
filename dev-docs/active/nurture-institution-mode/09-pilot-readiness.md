# Pilot Readiness — Institution Ecology

## Status and authorization

- **Review date:** 2026-07-18
- **Current checkpoint:** Pilot-0-C in progress; C-2f-5 completes C-2f planning with exact outcome/replay/presenter separation, server-side output refs, original-Execution/original-Step response-loss recovery, route-only continuity, unchanged legacy `user_attention`, and a minimal future Guardian relationship-attention boundary; C-3 Guardian/Caregiver operational IIB next
- **Decision:** **GO for Pilot-0 readiness continuation; NO-GO for external pilot traffic**
- **Authorization boundary:** the review changes only task/governance evidence. The review does not authorize a database apply, artifact publication, secret configuration, capability or manifest-composition change, external traffic, Pilot-1 through Pilot-4, staging, production, or GA.

Pilot-0 answers whether the reviewed X5 implementation can be turned into a bounded pilot safely and what must be built first. X5 proved the contract, persistence, replay, privacy, and failure semantics in deterministic and isolated joint tests. X5 did not produce a deployable, authenticated, user-operable institution product surface.

## Immutable review baseline

| Repository | Reviewed revision | Relevant evidence |
| --- | --- | --- |
| My-Workflow-Base | `acba4e792c85131c19e63e08a5f671133c481c57` | vNext additive handoff/driver/capability contract and conformance harness. |
| My-Chat | `a1b5e64c84c9865e34abb7068be10352cf42c949` | X2-X5 Step/Handoff/Outbox/owner delivery, CI and image-build gates; staging/prod capability false. |
| The-Nurture | `058c792dc86c0f41797632ebabc6f9a04fec6c18` | N1/X4/X5 business kernel, pre-activation default, activation-only factory, owner reread, CI/governance baseline. |
| Shared contract | `0bd8925ec8da88e0b7d0aa76b33bef94c471ff52499651c7b0c2a5da381501aa` | Base/My-Chat path-content contract hash. |
| Nurture activation source | `e976c235962c827367d1c13dcc603a0d315fdac118daf03f00a3df85e153d193` | Exact 25-file X5 activation-critical source population. |

The live pin verifier passes at these revisions. All worktrees were clean before the review branch was created.

## Readiness classification

| Layer | Current state | Pilot interpretation |
| --- | --- | --- |
| Shared contract and validation | Closed and version-pinned | Ready. Legacy remains compatible; vNext fails closed without host capability. |
| My-Chat Step/Handoff/Outbox kernel | Implemented and joint-tested | Ready as a technical kernel, subject to pilot topology and workspace gate. |
| Nurture family-input command/replay/owner read | Implemented and joint-tested for `family_care_question` | Ready as a domain kernel, not yet as a user-facing service composition. |
| Default runtime posture | Nurture dev host is pre-activation; My-Chat staging/prod false | Safe default. The dev host is intentionally not a pilot runtime. |
| Institution user experience | Read-only domain handlers exist; no institution frontend/action closure | Not ready for real users. |
| Provisioning and consent operations | Schema and policies exist; fixtures create topology directly in tests | Not ready. No authenticated onboarding/control path exists. |
| Deployment and operations | My-Chat images build; Nurture packaging/deploy remains an empty scaffold | Not ready for Pilot-1. |
| Observability | Metric/log contracts and injected sinks exist in tested paths | Partial. No deployed sink, dashboard, alert, or incident ownership is configured. |

## Implemented-capability inventory

The pilot scope must follow executable evidence, not the broader product roadmap.

| Product item | Schema/domain | Advertised handler | User surface/action | Joint X5 evidence | Pilot-0 disposition |
| --- | --- | --- | --- | --- | --- |
| `class_family_inbox/open_class_family_inbox` | Yes | Yes | No mounted production shell route or institution UI | Surface policy/query tests only | Target read surface after IIB closure. |
| `class_family_inbox/capture_family_input` | Yes | Activation-only | No production host composition or guardian input surface | Yes, for `family_care_question` | Only candidate write entrypoint for first pilot. |
| `teacher_attention_board/open_today_attention_board` | Yes | Yes | Notification open stops at a generic availability card; no board navigation/detail | Owner reread and stale-open tests | Target read surface after IIB closure. |
| Caregiver acknowledge/reply | Command specs and DB transactions exist | No workflow/internal API handler | No teacher action UI | Domain/DB tests, not a live product journey | Must be wired before real traffic. |
| Family receipt/response timeline | Message/receipt facts exist | No complete presenter/action API | No guardian receipt/reply UX | Domain/DB tests | Must be wired before real traffic. |
| Grant/revoke | Schema, policy and command exist | No authenticated guardian/admin control surface | No consent UX | Revoke is joint-tested fail-closed | Must be wired before real traffic. |
| `caregiver_daily_care` | Schema/design types only for the intended capability | Not advertised as an equivalent executable capability | None | No equivalent joint journey | Out of first pilot. |
| `child_media_attribution` | Persistence/repository foundations exist | Not advertised as an equivalent executable capability | None | No equivalent joint journey | Out of first pilot. |

The first pilot must therefore not claim all four roadmap capabilities. Its only eligible business data class is `family_care_question`, without attachments, using the reviewed immediate route with acknowledgment and reply required. `care_day_note`, `care_constraint_update`, `family_follow_up_request`, `daily_care_log`, health observations, and media attribution remain outside the first pilot until they receive equivalent handler, UX, privacy, and joint evidence.

## Blocking findings

### P0 — blocks any external pilot traffic

1. **No production activation composition.** `createNurtureActivationScenarioModule` exists, but no runnable My-Chat composition loads the Nurture scenario package, supplies the host seed/Actor readers, opens the separate Nurture repository, and advertises the capability. The Nurture backend is explicitly a dev-host harness and constructs `createNurtureScenarioModule`, which is pre-activation.
2. **The IIB workflow is not operable.** The Nurture frontend contains only family-project workbench pages. The manifest declares institution inbox/attention routes, but the current Fastify server does not mount them. My-Chat mobile can only display a generic “available in teacher attention board” card. Caregiver acknowledge/reply and guardian receipt/reply are not exposed through live handlers/routes or UI.
3. **No controlled onboarding path.** Institution, group, participant, role, child process, enrollment, thread, and grant creation occur through direct Prisma fixture writes in tests. A real pilot cannot rely on manual database edits as an identity, authorization, or audit mechanism.
4. **No workspace-level activation gate.** My-Chat has one environment-global `WORKFLOW_HANDOFF_MATERIALIZATION_V1_ENABLED` switch. A value of `true` enables the owner consumer and host capability for the entire environment. Pilot-2 requires a second, fail-closed workspace allowlist; the global flag alone is insufficient.
5. **No deployable Nurture artifact/topology.** `ops/packaging` has no service definitions, `ops/deploy/config.json` has no registered services, and the deploy script is a placeholder. The current backend also exposes dev-host workflow/project routes without production authentication and must not be deployed as-is.
6. **Operational recovery is not instantiated.** Contracts cover telemetry and X5 covers Admin recovery semantics, but the proposed pilot still lacks deployed metric/log sinks, dashboards, alerts, backup/restore evidence, credential-rotation procedure, named incident owners, and an executable kill-switch runbook.

### P1 — must be closed or explicitly accepted before Pilot-2

1. The retention/legal wording for grant revoke and the encryption/KMS/attachment posture remain production gates. The first pilot avoids attachments but still needs a written retention and access policy for question content.
2. User-value evidence is not yet instrumented. Existing telemetry measures technical command/owner behavior, not teacher triage time, guardian completion, or operator manual intervention.
3. Mobile distribution and deep-link routing for the approved pilot cohort need an explicit delivery channel; My-Chat container images do not package the mobile client.

## Recommended first-pilot slice

### Pilot-0-B1 — internal experiment cohort (LOCKED, REVISED)

The owner refinement supersedes the earlier proposed 2 then 5–8 real-cohort shape. The first experiment MUST remain internal and use one allowlisted test workspace:

1. Create one synthetic institution, one synthetic care group, three synthetic child care processes, and three distinct synthetic families. Each child care process has exactly one independent family in the internal experiment.
2. One family has two guardian participants; the other two families have one guardian participant each. The experiment therefore uses four distinct guardian identities and four distinct My-Chat test accounts.
3. The two-guardian family MAY label its internal personas “father” and “mother”, but the domain contract remains two `guardian` role assignments and MUST NOT hard-code one family structure as a product requirement.
4. One designated primary guardian in each family creates the grant and submits the question. The second guardian in the two-guardian family validates same-family receipt/reply visibility. Every guardian MUST be denied access to the other two families.
5. All child, family, institution, and message data are synthetic. One internal tester MAY operate multiple personas, but every account, session, command actor, and audit record remains distinct.
6. The cohort validates structure, isolation, multi-guardian visibility, correct reply routing, per-family revoke, notification, deep link, and owner reread. The evidence does not claim real caregiver-efficiency or institution-value outcomes.
7. The real Pilot-4 cohort size and expansion policy remain uncommitted until the internal experiment passes its stop gates and Pilot-4 receives separate authorization.

### Pilot-0-B2 — role/personnel matrix

- **B2-1 guardian matrix: LOCKED.** Four guardian accounts across three families: `2 + 1 + 1`.
- **B2-2 institution/caregiver/operator matrix: LOCKED.** The internal experiment uses one institution administrator, one lead caregiver, no backup caregiver, and one internal technical operator.

The B2-2 role boundary is exact:

1. The institution administrator and lead caregiver are separate My-Chat users and separate Nurture participants. Role overlap is not permitted in the internal experiment.
2. The institution administrator configures the synthetic institution, care group, participant invitations, and enrollment setup. The administrator MUST NOT grant on behalf of a guardian and has no default permission to read family question content.
3. The lead caregiver is the only caregiver work actor. The caregiver opens the class inbox/attention board and performs acknowledge/reply actions for all three child scopes under one care-group assignment.
4. No backup caregiver is included. Caregiver reassignment, duty handoff, and multi-caregiver concurrency are outside the first internal experiment.
5. The internal technical operator is a My-Chat host/admin identity, not an implicit Nurture business participant. The operator may inspect technical Run/Step/Handoff/Outbox/notification evidence and invoke allowlisted recovery, but MUST NOT read or edit Nurture business content or lifecycle state.
6. The matrix contains seven logical test accounts: four guardians, one institution administrator, one lead caregiver, and one technical operator. One internal human MAY operate multiple accounts, but account, session, actor, role, and audit evidence remain distinct.

### Pilot-0-B3 — surface, action, journey, and data lock

The earlier single B3 business/data decision is replaced by the following ordered checkpoints:

| Checkpoint | State | Decision boundary |
| --- | --- | --- |
| B3-0 role and surface entitlement | **LOCKED** | Which Nurture product surfaces each Pilot role may use. |
| B3-1 action availability by surface | **LOCKED** | Role matrices, key layering, operator permissions, exact mappings, safe unavailable reasons, and additive implementation gates are locked. |
| B3-2 cross-surface continuity | **LOCKED / COMPLETE** | B3-2a-d lock transition/destination, opaque tokens, notification/deep-link stale handling, and draft/result/history continuity. |
| B3-3 business path and data envelope | **LOCKED / COMPLETE** | B3-3a-d lock the input envelope, Grant/family authority/target scope, atomic business lifecycle, exact replay, revoke/redaction, and failure/privacy behavior. |
| B3-4 representative journey coverage | **LOCKED / COMPLETE** | Exhaustive action/surface conformance, four representative round trips across three child scopes, Institution/Operator strands, layered negative/fault/privacy evidence, and exit gates. |

#### Pilot-0-B3-0 — role and surface entitlement (LOCKED)

| Pilot role | Nurture Chat | Role board | Nurture domain web workbench | Technical Admin |
| --- | --- | --- | --- | --- |
| Guardian | Allowed | Family board | Family workbench | Not allowed |
| Lead caregiver / teacher | Allowed | Teacher board | Not allowed | Not allowed |
| Institution administrator | Not allowed | Institution board | Institution workbench | Not allowed |
| Technical operator | Not allowed | Not allowed | Not allowed | Allowed, technical evidence and allowlisted recovery only |

The B3-0 boundary is exact:

1. `NurtureParticipant` remains unique per `(workspaceId, myChatUserId)`. Surface entitlement neither creates another participant nor grants a role or work scope.
2. Guardian Nurture work may enter through Chat, the family board, or the family domain web workbench.
3. Caregiver Nurture work may enter through Chat or the teacher board. The first internal experiment MUST NOT require a caregiver domain web workbench fallback; every required caregiver action must eventually close in Chat or the teacher board after B3-1 is locked and implemented.
4. Institution Nurture work may enter through the institution board or institution domain web workbench. An institution administrator may still use general My-Chat Chat, but Nurture institution-management capability MUST NOT be exposed through Chat.
5. The technical operator uses the host technical Admin surface only and is not implicitly a Nurture participant. Technical Admin MUST NOT become a Nurture domain workbench or business-content reader.
6. A role board is a role-specific Nurture presenter/action surface independent of device shell. Family, teacher, and institution boards may reuse a generic My-Chat board host, but they do not share authorization or business projections.
7. `web_domain_workbench` means a Nurture business workbench. My-Chat `web_run_workbench` is a separate generic Workflow Run surface and MUST NOT grant Nurture business access.
8. Chat remains role-agnostic only among Chat-entitled Nurture roles. My-Chat selects the scenario, never a trusted Nurture role; Nurture still resolves participant, eligible role, scope, target, grant, policy, and current state on every render and action.
9. Notification and deep link are activation/transition mechanisms, not additional role surfaces or authorization sources.

B3-0 supersedes only the earlier statement that every adult Nurture role shares the Nurture main-chat ingress. My-Chat account ownership, one-participant identity, Nurture-owned role resolution, opaque host envelopes, current-state revalidation, and the B2 prohibition on institution-admin/caregiver role overlap remain unchanged.

The B3-0 readiness decision changes no manifest or runtime. B3-1 and later implementation must reconcile at least three known gaps: guardian family-input activation does not yet declare the family web workbench, teacher inbox/attention routes are currently labelled with `web_domain_workbench` even though the product entitlement is the teacher board, and generic Chat declarations do not yet encode the institution-role exclusion. These are implementation findings, not permission to edit or enable the manifest.

**Pilot-0-B3-1 — action availability by surface**

| Checkpoint | State | Decision boundary |
| --- | --- | --- |
| B3-1a Guardian action matrix | **LOCKED** | Guardian Chat, family board, and family workbench action availability. |
| B3-1b Caregiver action matrix | **LOCKED** | Caregiver Chat and teacher-board reads, acknowledge, reply, redaction, history, and prohibited actions. |
| B3-1c Institution action matrix | **LOCKED** | Institution-board/workbench topology, enrollment, disablement, and content-exposure boundaries. |
| B3-1d Technical/operator and action-key mapping | **LOCKED** | Key layering, operator permissions, exact action/command mappings, safe unavailable reasons, and additive implementation gates are locked. |

#### Pilot-0-B3-1a — Guardian action matrix (LOCKED)

| Guardian action | Generic AI Chat | Family board | Family domain web workbench |
| --- | --- | --- | --- |
| Ask for current state or explanation | AI response over current owner-reread | Display current state | Display current state |
| View current question, receipt, or caregiver reply | Display safe summary and offer an entitled target surface | Current/recent list and detail | Complete authorized history and detail |
| Select a child or item | Generic `action_option_deck` when ambiguous | Select within current board scope | Select within authorized workbench scope |
| Create a question draft | AI-assisted draft | Short question input | Full question editor |
| Submit `family_care_question` | `editable_preview` plus `authorization_gate` | Confirm child/destination, then execute | Full preview, then execute |
| View grant state and scope | Safe summary plus navigation | Current grant summary | Complete grant/version/replacement record |
| Confirm family enrollment | Generic strong authorization flow | Strong confirmation | Complete enrollment/link review and confirmation |
| Suspend the family side of an Enrollment | Generic `authorization_gate` | Strong confirmation from current Enrollment | Complete side/consequence review and confirmation |
| Release the family-side suspension | Generic `authorization_gate` | Strong confirmation from current Enrollment | Complete current-hold/other-side review and confirmation |
| Confirm or decline a CareGroup transfer | Generic `authorization_gate` | Strong confirmation from current transfer proposal | Complete old/new Group and closure review |
| Permanently withdraw the family Enrollment | Generic `authorization_gate` | Strong confirmation from current Enrollment | Complete permanent-end/history/re-entry consequence review |
| Create or confirm a grant | Generic strong authorization flow | Strong authorization flow | Complete authorization flow |
| Revoke a grant | Generic `authorization_gate` | Strong confirmation | Strong confirmation with full consequence detail |
| Redact the guardian's own submitted question | Generic `authorization_gate` for a resolved message | Confirm from question detail | Confirm from authorized history detail |
| Cancel a pending route | Conditional on current cancellable `pending` state | Same | Same |
| Search complete history | Navigate to the workbench | Not available beyond current/recent scope | Available |
| Edit an already-submitted question | Not allowed | Not allowed | Not allowed |
| Hard-delete Message/Receipt/Execution facts | Not allowed | Not allowed | Not allowed |
| Continue chatting on an already-replied item | Out of Pilot-0 | Out of Pilot-0 | Out of Pilot-0 |
| View another family | Not allowed | Not allowed | Not allowed |

The Guardian matrix has the following mandatory semantics:

1. Chat is the generic My-Chat AI panel, not a Guardian-specific Nurture page. Nurture MUST use generic interaction envelopes and MUST NOT register a second Chat business state machine or bespoke family-chat shell.
2. The first Guardian Chat slice depends only on the currently implemented core primitives: `timeline_inline`, `action_option_deck`, `editable_preview`, `authorization_gate`, `bottom_sheet`, `full_screen_flow`, and envelope `resultSummary`. `form_collector`, `step_wizard`, `suggestion_chips`, and other incomplete primitives are not Pilot prerequisites.
3. Natural-language input is intent and private draft material. Cross-role submission, grant creation/replacement, revoke, and redaction require an explicit current-state confirmation before a Nurture command executes.
4. Chat returns a safe result summary after command completion. Family board/workbench views reread current Nurture-owned state; no surface copies the business lifecycle into My-Chat Chat or projection storage.
5. Core Guardian rights are reachable from all three entitled surfaces: submit a question, create/confirm a grant, revoke a grant, and redact the actor's own question. Each surface may use a different presentation, but all three MUST converge on the same canonical Nurture command and policy.
6. Revoke MUST NOT require access to the web workbench. The confirmation MUST disclose affected child scope, data class/direction, future-access consequence, retention behavior, and reversibility before commit.
7. `cancel_route` is shown only when the current Receipt is both `pending` and cancellable. If B3-3 locks an immediate-only route with no user-visible pending window, Pilot UI MAY expose no cancel action.
8. A submitted question is immutable. Correction, resend, or another question creates a new command identity; redaction affects visibility but does not rewrite or hard-delete audit facts.
9. The dual-guardian experiment adds no `primary_guardian` role. The designated primary guardian performs scripted grant/submission actions, while actual action availability is derived from current role, family reachability, grant ownership, policy, and object state. The second guardian validates same-family owner-read.
10. Surface identity is untrusted context for eligibility, audit, and presentation only. My-Chat MUST NOT treat `chat`, `family_board`, or `family_workbench` as business authorization or as part of the canonical command identity.
11. Institution initiation does not bind a family to an enrollment. `confirm_family_enrollment` is a distinct Guardian-authorized action reachable from all three Guardian surfaces; the command rechecks the current proposed enrollment and child/family scope and does not implicitly create a grant.
12. `withdraw_family_enrollment` is reachable from all three Guardian surfaces and permanently ends the shared Enrollment after current strong confirmation. Any current exact-Family Guardian is independently eligible; Grant ownership, invitation receipt, join order, a primary label, or another Guardian's countersignature cannot add or remove that authority.
13. `update_child_care_stage` is reachable from all three Guardian surfaces and converges on one StageEpisode command. The action requires current strong confirmation and cannot become an Institution action, automatic age transition, pregnancy-handler side effect, or Enrollment mutation.

The B3-1a product contract is ahead of current implementation. My-Chat has a typed mobile interaction envelope, core render hosts, and a public-draft vertical slice, but no complete server-produced generic interaction delivery/action registry for arbitrary scenario actions. Nurture does not yet expose the Guardian board/workbench actions or map the accepted action set into manifest/API command keys. Those gaps must close before Pilot traffic; B3-1a does not authorize runtime or manifest changes.

#### Pilot-0-B3-1b — Caregiver action matrix (LOCKED)

| Caregiver action | Generic AI Chat | Teacher board |
| --- | --- | --- |
| Query current attention state | AI response over current owner-reread safe summaries | Aggregated counts, state, and grouping |
| View actionable-item candidates | Display a bounded candidate set | Complete authorized list with filter and sort |
| Select a child or item | Generic `action_option_deck` | Select within current authorized care-group scope |
| View protected family-question body | Resolve an opaque ref, perform transient owner-reread detail, and do not persist the body in Chat history | Current item detail after owner reread |
| View current grant/enrollment eligibility | Safe available/blocked summary | Item detail with current available/blocked reason |
| Acknowledge receipt | Lightweight strong confirmation, then execute | Confirm from current item detail, then execute |
| Create a reply draft | AI-assisted, explicitly labelled draft | Reply editor |
| Submit caregiver reply | `editable_preview` plus `authorization_gate` | Full preview and confirmation |
| View sent reply and current state | Safe summary plus navigation | Complete authorized item/message detail |
| Redact the caregiver's own reply | Generic `authorization_gate` | Confirm from message detail |
| Search historical items | Bounded query and navigation to board | Complete authorized current/closed/blocked history |
| Bulk acknowledge or bulk reply | Out of Pilot-0 | Out of Pilot-0 |
| Request clarification or continue a follow-up loop | Out of Pilot-0 | Out of Pilot-0 |
| Write daily-care outcomes | Out of Pilot-0 | Out of Pilot-0 |
| Enter a direct family Chat | Not allowed | Not allowed |
| Manage grants, enrollment, roles, or institution topology | Not allowed | Not allowed |
| Act outside the assigned care group | Not allowed | Not allowed |
| Reassign work or hand off duty to another caregiver | Out of Pilot-0 | Out of Pilot-0 |

The Caregiver matrix has the following mandatory semantics:

1. Caregiver Chat inherits the generic My-Chat AI/interaction-panel boundary. The teacher board is the complete Nurture work surface; no caregiver domain web workbench or Web fallback is required for acknowledge/reply closure.
2. Chat timeline content is display-safe. Protected family-question bodies are loaded from Nurture by opaque ref through a current owner read into a transient detail surface and MUST NOT be copied into persisted My-Chat Chat messages, interaction history, projections, logs, or activation payloads.
3. Opening an item is read-only. My-Chat notification read/unread is host display state. Nurture `acknowledge_item` is a separate explicit caregiver-confirmed business command and MUST NOT occur implicitly when Chat or board detail opens.
4. AI MAY help draft a caregiver response using the currently authorized Nurture context, but the draft MUST be labelled unconfirmed, remain outside the canonical family-facing message lifecycle, and never publish under a caregiver identity without the caregiver's explicit confirmation. Drafting remains non-diagnostic, non-prescriptive, and not an emergency-care replacement.
5. Caregiver reply submission from Chat and teacher board MUST converge on `nurture.family_care.reply_item`. The command rechecks caregiver role, care-group reachability, enrollment, exact Thread lifecycle, grant `org_to_family`, source/item lifecycle, expected version, and current policy; optional ThreadParticipant projection is not authority.
6. The teacher board MUST cover both current work and complete authorized history because the Caregiver role has no domain workbench. History includes open, acknowledged, replied, blocked/revoked, and redacted/suppressed items with child, care-group, status, and time filters; redacted/suppressed entries expose only current display-safe state or tombstone metadata, never the protected body.
7. A caregiver reply is immutable after commit. The caregiver may redact the caregiver-authored reply through current policy, but Pilot-0 provides no in-place edit, automatic reopen, second reply, or correction command. A future correction flow requires an explicit new command contract.
8. Direct family Chat is forbidden. Family input creates a workflow item; caregiver actions commit a Nurture business transition and a traceable family-facing message. Chat presentation MUST NOT bypass the workflow-mediated communication contract.
9. Bulk actions, clarification loops, daily-care outcomes, multi-caregiver concurrency, caregiver reassignment, and duty handoff remain outside the first internal experiment.
10. Revoke, redaction, enrollment/role changes, item-version conflict, and policy change between draft and submit MUST fail closed on the final command recheck. A blocked draft does not justify alternate-surface submission or policy bypass.

The B3-1b product contract is ahead of current implementation. Nurture has domain command specifications and database transactions for acknowledge, reply, and author redaction, plus read-only inbox/attention presenters. It does not yet expose authenticated live action handlers, transient protected-detail delivery for generic Chat, AI-assisted reply drafting, or the complete teacher-board history/action UI. My-Chat likewise lacks the general scenario-produced interaction/action registry needed by Caregiver Chat. Those gaps must close before Pilot traffic; B3-1b authorizes no runtime or manifest change.

#### Pilot-0-B3-1c — Institution action matrix (LOCKED)

| Institution-admin action | Institution board | Institution domain web workbench |
| --- | --- | --- |
| View institution and care-group status | Safe aggregate status, readiness warnings, and navigation | Complete authorized topology/configuration detail |
| View participant/invitation completion | Aggregate invited/pending/active/disabled counts | Authorized invitation and participant-mapping detail |
| View staff-role coverage | Aggregate role/coverage status | Authorized role-assignment detail and history |
| View enrollment readiness | Aggregate active/pending/suspended/closed counts | Per-enrollment topology and lifecycle detail |
| View grant coverage | Aggregate active/missing/revoked counts only | Per-enrollment safe metadata: scope, direction, data class, version, and status only |
| View family-care backlog | Safe aggregate counts and unavailable-state categories only | Safe aggregate operational view only; never family question/reply bodies |
| Create or update institution profile | Navigate to workbench; no durable command | Strong confirmation, then Nurture authoritative command |
| Create, update, suspend, or close a care group | Navigate to workbench; no durable command | Strong confirmation, then Nurture authoritative command |
| Initiate an adult invitation | Navigate to workbench; no durable command | Initiate the coordinated My-Chat identity invitation flow |
| Assign or revoke a staff role | Navigate to workbench; no durable command | Strong confirmation with current scope/version recheck |
| Initiate or change enrollment lifecycle | Navigate to workbench; no durable command | Strong confirmation with current child/family linkage recheck |
| Propose or cancel a CareGroup transfer | Navigate to workbench; no durable command | Strong confirmation over current source Enrollment and target readiness |
| Permanently end Institution service for an Enrollment | Navigate to workbench; no durable command | `close_enrollment` strong confirmation; no family countersignature |
| Designate the lead caregiver | Navigate to workbench; no durable command | Strong confirmation with current care-group role coverage recheck |
| Configure institution/care-group policy | Navigate to workbench; no durable command | Strong confirmation with current policy/version recheck |
| Disable the Pilot business cohort | Navigate to workbench; no durable command | Strong confirmation; stops eligible Nurture business use for the scoped cohort |
| Recover a disabled business cohort | Not available | Separate revalidated recovery command; never a reversible UI toggle |
| Create/revoke a Guardian grant or guardian relationship | Not allowed | Not allowed |
| Acknowledge/reply/redact a family-care item as caregiver | Not allowed | Not allowed |
| Change My-Chat capability, workspace allowlist, Run/Step/Handoff/Outbox | Not allowed | Not allowed |
| Hard-delete topology, role, enrollment, grant, or audit facts | Not allowed | Not allowed |
| Rank children, care groups, or caregivers | Not allowed | Not allowed |

The Institution matrix has the following mandatory semantics:

1. The institution board is a read-only Pilot surface for safe aggregates, readiness warnings, and navigation. The board MUST NOT execute a durable Nurture command from a dashboard card or projection.
2. The institution domain web workbench is the only Institution surface that executes authoritative topology/configuration writes in the first internal experiment. Every write MUST use the Nurture `CommandExecution` kernel with idempotency, expected version, current institution-admin role/scope, target lifecycle, and policy revalidation.
3. Adult onboarding is a two-owner flow. The institution administrator MAY initiate an invitation, but My-Chat owns account invitation, authentication, and user acceptance; Nurture maps the accepted canonical user to a participant and role assignment. The administrator MUST NOT bind a raw `myChatUserId`, accept an invitation for another user, or create a shadow identity.
4. The institution administrator MAY initiate an enrollment and maintain institution-owned topology, but MUST NOT assert or revoke a Guardian relationship or grant. The family side confirms the child/family link and creates or replaces the applicable grant under current Guardian authority.
5. Institution-admin scope does not confer ambient access to family question/reply bodies, child-specific care facts, or named caregiver-authored content. Backlog and coverage views expose only the minimum safe aggregate or topology metadata needed to detect incomplete setup and operational blockage.
6. Grant coverage MAY expose scope, direction, system `dataClass`, version, and current active/missing/revoked state for an authorized enrollment. The coverage view MUST NOT expose protected consent narrative, revoke reason text, message bodies, or a means to change the grant.
7. Topology lifecycle is non-destructive. Care groups, role assignments, enrollments, and Pilot business scope use suspend/close/disable semantics; no surface hard-deletes canonical or audit facts. Recovery is a separate command that reruns current eligibility and MUST NOT be represented as a blind toggle.
8. Nurture business disablement is separate from the My-Chat technical kill switch. Institution surfaces cannot change the environment capability, workspace allowlist, Workflow runtime state, Handoff Ledger, Outbox, notification delivery, or Admin reconciliation state.
9. Institution analytics remain within the product Anti-Metrics boundary: no child ranking, cross-group comparison, public caregiver-performance score, or competitive institution ranking. Operational aggregates exist to find incomplete setup and blocked workflows, not to score people.
10. The internal synthetic institution/group/account fixture is test preparation, not a production authority model. Pilot setup evidence MUST eventually use authenticated owner actions; direct Prisma fixture writes or operator edits cannot substitute for Institution/Guardian/My-Chat command boundaries.
11. `close_enrollment` is the Institution's permanent service-end action and executes only from the workbench after current strong confirmation. The action does not require Guardian countersignature, cannot represent family withdrawal or transfer, and cannot be executed by a Caregiver, Operator, service identity, or board card.

The first internal Institution path is deliberately small: inspect the one synthetic institution/group, initiate the required adult invitations, maintain the administrator/lead-caregiver assignments, inspect three enrollment-readiness and grant-coverage states, observe safe family-care backlog counts, disable the scoped cohort, and prove stale entries fail closed. Real institution registration, billing, organizational hierarchy, multiple care groups, substitute teachers, batch import, complex approvals, child/caregiver ranking, and self-service Pilot activation remain outside Pilot-0.

The B3-1c product contract is ahead of current implementation. Current topology and account setup are produced by direct Prisma fixtures in tests; there is no complete authenticated Institution board/workbench or user-operable onboarding/control plane that closes these actions through Nurture commands and the coordinated My-Chat identity flow. Those gaps must close before Pilot traffic; B3-1c authorizes no source, schema, manifest, environment, capability, or activation change.

#### Pilot-0-B3-1d — technical operator and exact action-key mapping

| Sub-checkpoint | State | Decision boundary |
| --- | --- | --- |
| B3-1d-0 key layers and compatibility boundary | **LOCKED** | Stable product `action_key`, Nurture `command_key`, implementation `handler_key`, Workflow `entrypoint_key`, and legacy Run-action separation. |
| B3-1d-1 technical-operator permission matrix | **LOCKED** | Exact evidence, recovery, owner-reevaluation, kill-switch, and prohibited actions. |
| B3-1d-2 remaining exact domain-action mapping | **LOCKED** | Guardian enrollment/grant and Institution topology/onboarding command mappings. |
| B3-1d-3 unavailable reasons and implementation gate | **LOCKED** | Stable safe reason vocabulary, additive contract adoption, and negative coverage. |

**Pilot-0-B3-1d-0 — key layers and compatibility boundary (LOCKED)**

The canonical product action identity is `(scenario_key, action_key)`. For Nurture, `scenario_key` is `nurture` and `action_key` uses stable `snake_case`. The same business intent uses the same action key across every entitled surface; UI labels, layout, and confirmation components are presentation, not separate action identities.

| Locked `action_key` | Workflow entrypoint/handler when applicable | Existing authoritative `command_key` | Current implementation fact |
| --- | --- | --- | --- |
| `submit_family_care_question` | `capture_family_input` / `nurture.capture_family_input` | `nurture.family_care.capture_and_route` | Activation-only handler and command exist; generic surface-action wiring does not. |
| `revoke_child_link_grant` | Direct domain action; handler not implemented | `nurture.family_care.revoke_grant` | Command spec/transaction exist; authenticated surface action does not. |
| `acknowledge_family_care_item` | Direct domain action; handler not implemented | `nurture.family_care.acknowledge_item` | Command spec/transaction exist; authenticated surface action does not. |
| `reply_family_care_item` | Direct domain action; handler not implemented | `nurture.family_care.reply_item` | Command spec/transaction exist; authenticated surface action does not. |
| `redact_family_care_message` | Direct domain action; handler not implemented | `nurture.family_care.redact_message` | Command spec/transaction exist; authenticated surface action does not. |
| `cancel_family_care_route` | Direct domain action; handler not implemented | `nurture.family_care.cancel_route` | Command spec/transaction exist; authenticated surface action does not. |

The key-layer boundary is exact:

1. `action_key` names a scenario product intent and MAY be returned by Chat/board/workbench presenters with an opaque target ref, expected version, confirmation class, and safe availability reason. The action key is not a command receipt or authorization result.
2. Every render and execution MUST re-resolve current actor, surface entitlement, role, work/child scope, target, grant, policy, lifecycle, and expected version. Client-supplied action keys, surfaces, refs, or confirmation state cannot bypass owner checks.
3. `command_key` identifies one immutable Nurture `CommandExecution` contract and uses a versioned dotted namespace. Existing committed/replayable command keys MUST NOT be renamed or aliased to a second implementation merely to match product labels.
4. One durable product action normally maps to one independently atomic command. An explicit orchestrator MAY derive stable child command identities only when one invocation intentionally commits multiple independent commands; multiple rows written by one transaction remain one command.
5. `entrypoint_key` starts a Workflow definition and `handler_key` binds an implementation. Neither is a user-facing action identity. A direct domain action does not require a synthetic Workflow Run solely to fit an entrypoint-shaped API.
6. Read, search, navigation, target selection, AI drafting, preview, and opening a detail are non-durable interactions and MUST NOT create `CommandExecution` rows or fake durable action keys.
7. The current manifest `action_availability.scenario_actions` is a legacy Workflow Run action registry: its handler contract requires Run/Step context and returns Run state. B3 domain-object actions MUST NOT be appended there or reinterpret its four existing keys as Message/Grant/Item/Enrollment actions.
8. Cross-surface domain-action advertisement requires an additive contract/registry that carries scenario/action identity, target-ref class, confirmation requirement, allowed surface class, and handler binding without transferring Nurture authorization to My-Chat. The exact additive schema is an implementation design task, not permission to mutate Base/My-Chat/Nurture contracts in Pilot-0.
9. My-Chat technical Admin recovery actions are Host-owned operations and MUST NOT appear in the Nurture scenario action registry or become Nurture `command_key` values. B3-1d-1 decides their exact operator exposure.
10. Unavailable reason codes describe current safe presentation only. They never become cached authorization, command identity, or permission for an alternate surface to execute the action.

The current contract gap is explicit: My-Chat and Base have Run-level action contracts, while My-Chat does not yet provide a general scenario-produced domain-action delivery/execution registry for generic Chat and role boards. Nurture has no authenticated direct action handlers for the five direct mappings above and no manifest/API shape for the accepted cross-surface domain actions. B3-1d-0 locks naming and compatibility only; the lock changes no manifest, runtime, schema, environment, capability, or activation.

**Pilot-0-B3-1d-1 — technical-operator permission matrix (LOCKED)**

| Technical-operator operation | Pilot permission | Exact boundary |
| --- | --- | --- |
| Read Run/Step/Handoff/Outbox/notification/audit evidence | Allowed | IDs, safe status/reason, versions, counts, timestamps, and correlation only; no Nurture body or claim material. |
| `reconcile_outcome_unknown_step` | Allowed | Operator-facing Host key maps to the existing Step `/reconcile` operation; only the exact outcome-unknown original Step may replay its original command/snapshots. |
| `replay_failed` | Allowed | Existing My-Chat Handoff action; only a replayable `failed` Handoff with expected version, idempotency, and current owner reread. |
| `stop_pending` | Allowed | Existing My-Chat Handoff action; only a still-pending/requested technical activation before downstream logical effect. The Host action does not cancel or redact Nurture facts. |
| `request_owner_reevaluation` | Allowed as a request-only Host action | Planned operation invokes Nurture owner recovery with opaque refs/current host evidence; the operator cannot select or author the business result. |
| Execute emergency Pilot disable | Allowed under the approved runbook | Disable-only responsibility: remove the exact workspace allowlist first, then disable the environment capability. Re-enable/expansion requires a new Go/No-Go decision. |
| Direct `cancel_route`, `reissue_route`, or `fail_route` | Not allowed | Current business actor or Nurture owner recovery service decides under current policy; the operator never impersonates that authority. |
| Grant/revoke/redaction/acknowledge/reply/topology actions | Not allowed | Operator is not a Guardian, Caregiver, Institution admin, or implicit Nurture participant. |
| Edit source refs, payload, purpose, target, expiry, Handoff status, Step claim, Outbox, or notification facts | Not allowed | No mutation bypass around the canonical owner repository/service. |
| Direct database/queue repair or mint replacement Step/Draft/Handoff | Not allowed | Missing/corrupt canonical evidence is an incident/data-repair escalation, not authority to create substitute provenance. |

The operator boundary is exact:

1. The internal technical operator MUST use a distinct My-Chat account with an internal platform-operations entitlement and exact Pilot-workspace scope. A generic workspace `admin` permission alone is insufficient, and Nurture `institution_admin` MUST NOT inherit technical Admin access.
2. Technical operations are available only through My-Chat Technical Admin. Chat, role boards, and Nurture domain workbenches do not expose operator actions.
3. Evidence views MUST remain refs/counts/status/reason/version-only. They MUST NOT expose protected Nurture content, grant narrative, message bodies, claim tokens, service tokens, Handoff payload bodies, or raw provider errors containing user data.
4. Step reconciliation preserves the original Step, scenario command idempotency identity, driver ref, and snapshot request identity. Same-Step reclaim may rotate transient claim evidence; another Step cannot recover or materialize the result.
5. `replay_failed` preserves Handoff identity, source refs, purpose, target, policy, and expiry, and reruns current owner gates. `stop_pending` can stop only a request without a completed downstream effect. Completed/stopped/expired Handoffs cannot be replayed or rewritten.
6. `request_owner_reevaluation` carries only trusted host evidence and opaque refs to Nurture. Nurture rereads current source/grant/scope/policy/Receipt/Item state and either returns a safe classification or performs an owner-authorized deterministic transition. The operator cannot choose `blocked`, `failed`, delivered, cancelled, or reissued state.
7. Emergency disable is intentionally asymmetric. The operator MAY stop new Pilot activation immediately under the two-key runbook, but MUST NOT re-enable a capability, add a workspace, broaden a cohort, or bypass a stopped gate without a new authorization decision.
8. Every operator write records operator actor, workspace, target, operation, expected version, idempotency key, correlation/causation/trace evidence, safe reason, before/after version, and resulting Outbox IDs. Telemetry contains no Nurture body or secret material.
9. The operator MUST NOT call Guardian/Caregiver/Institution commands through a service identity, reuse another participant's token, or convert technical recovery into a new business resend. A new business intent requires the currently entitled business actor or an explicitly owner-authorized service transition.
10. Direct database, queue, Handoff, Outbox, notification, or Nurture lifecycle editing is outside normal Pilot recovery. Incident repair follows a separately authorized data-repair process and never manufactures claimed-Step provenance.

B3-1d-1 narrows the earlier D-054 wording that allowed Admin to invoke Nurture `reissue_route` or `cancel_route`. Under the later B2/B3-0 separation, a technical operator may request owner reevaluation but cannot directly authorize business cancel, failure, or resend. If reevaluation determines an owner transition is valid, the Nurture owner recovery service executes under current policy with the technical operator retained only as initiating audit evidence.

Current implementation is partial. My-Chat already implements safe Handoff evidence, `replay_failed`, `stop_pending`, and exact Step reconciliation with expected version/idempotency checks, but the API relies on generic Admin ACL rather than a named Pilot-operator entitlement and the Admin UI exposes no recovery controls. `request_owner_reevaluation`, the workspace allowlist, and the two-key emergency-disable composition are not implemented. B3-1d-1 authorizes no source, schema, manifest, environment, capability, or activation change.

**Pilot-0-B3-1d-2 — remaining exact domain-action mapping (LOCKED)**

Guardian stage/enrollment/grant action contracts are distinct:

| Locked `action_key` | Planned authoritative `command_key` | Mandatory effect boundary |
| --- | --- | --- |
| `confirm_family_enrollment` | `nurture.family_care.confirm_enrollment` | Guardian confirms the current proposed child/family enrollment; no grant is created implicitly. |
| `suspend_family_enrollment` | `nurture.family_care.suspend_enrollment` | Creates only the family-side Enrollment hold after current strong confirmation. |
| `resume_family_enrollment` | `nurture.family_care.resume_enrollment` | Releases only the family-side hold; aggregate Enrollment may remain paused. |
| `confirm_enrollment_transfer` | `nurture.family_care.confirm_enrollment_transfer` | Guardian confirms one current same-Institution transfer intent and atomic old/new cutover. |
| `decline_enrollment_transfer` | `nurture.family_care.decline_enrollment_transfer` | Guardian terminalizes only the pending transfer intent; Enrollment remains unchanged. |
| `withdraw_family_enrollment` | `nurture.family_care.withdraw_enrollment` | Any current exact-Family Guardian independently confirms permanent family withdrawal; no Grant-owner/primary/unanimous authority. |
| `update_child_care_stage` | `nurture.family_care.update_child_care_stage` | Any current exact-Family Guardian independently sets, changes, corrects, or clears the family-owned StageEpisode after current strong confirmation; no Enrollment or Institution effect. |
| `confirm_child_link_grant` | `nurture.family_care.confirm_grant` | Creates/confirms the first current grant from an explicit reviewed authorization under current enrollment. |
| `replace_child_link_grant` | `nurture.family_care.replace_grant` | Creates a new grant identity/version under current policy; never reactivates a revoked grant. |

The existing `revoke_child_link_grant` mapping remains `nurture.family_care.revoke_grant`. A same-definition current grant MAY return `already_satisfied`; a changed scope/direction/data-class contract requires `replace_child_link_grant`. Stage update, Enrollment confirmation, grant confirmation, grant replacement, and grant revoke remain separate commands, expected-version boundaries, and audit events.

Institution topology/configuration mappings are explicit and non-polymorphic:

| Locked `action_key` | Planned authoritative `command_key` |
| --- | --- |
| `create_care_institution` | `nurture.institution.create_care_institution` |
| `update_care_institution` | `nurture.institution.update_care_institution` |
| `create_care_group` | `nurture.institution.create_care_group` |
| `update_care_group` | `nurture.institution.update_care_group` |
| `suspend_care_group` | `nurture.institution.suspend_care_group` |
| `resume_care_group` | `nurture.institution.resume_care_group` |
| `close_care_group` | `nurture.institution.close_care_group` |
| `assign_staff_role` | `nurture.institution.assign_staff_role` |
| `revoke_staff_role` | `nurture.institution.revoke_staff_role` |
| `designate_lead_caregiver` | `nurture.institution.designate_lead_caregiver` |
| `initiate_enrollment` | `nurture.institution.initiate_enrollment` |
| `suspend_enrollment` | `nurture.institution.suspend_enrollment` |
| `resume_enrollment` | `nurture.institution.resume_enrollment` |
| `propose_enrollment_transfer` | `nurture.institution.propose_enrollment_transfer` |
| `cancel_enrollment_transfer` | `nurture.institution.cancel_enrollment_transfer` |
| `close_enrollment` | `nurture.institution.close_enrollment` |
| `update_institution_policy` | `nurture.institution.update_institution_policy` |
| `update_care_group_policy` | `nurture.institution.update_care_group_policy` |

For Enrollment lifecycle, Institution `suspend_enrollment` creates only the institution-side hold and `resume_enrollment` releases only that hold; neither action changes the family hold. The locked keys are retained, and `pause_institution_enrollment` is forbidden as a semantic alias. Aggregate active is a resolved outcome, not the promise of either resume key.

CareGroup transfer uses only the new proposal/cancel and confirm/decline mappings. `initiate_enrollment` remains new-Enrollment onboarding and, under C-2f-3c, also begins same-Institution fresh re-entry only from an exact historical Enrollment with a fresh roster/invitation; the key never reactivates an old Enrollment. `close_enrollment` remains C-2f-3 terminal Institution service end, and no direct `transfer_enrollment`, `reactivate|reopen|reenroll`, or Enrollment Invitation alias may bypass Guardian confirmation.

Permanent exit uses only `withdraw_family_enrollment` for family-owned withdrawal and `close_enrollment` for Institution-owned service end. Neither action requires opposite-side countersignature; no generic `end_enrollment`, Grant-owner substitute, invented primary-Guardian key, or cross-action alias may be registered.

Invitation is the deliberate cross-owner exception:

1. Institution-workbench `initiate_participant_invitation` maps to the planned Host identity command `my_chat.workspace_invitation.create`; the Host command is not a Nurture `CommandExecution` and cannot bind a raw My-Chat user id.
2. My-Chat owns invitation delivery, authentication, acceptance, expiry, and canonical account/workspace membership. Acceptance is not an Institution-admin surface action.
3. After My-Chat records acceptance, an authenticated owner callback invokes planned `nurture.institution.bind_accepted_participant` with a canonical accepted-user ref and invitation correlation. The callback is not advertised as a user `action_key` and cannot accept on the user's behalf.
4. Staff-role assignment remains a separate institution-admin command after participant binding. Identity acceptance never grants a Nurture role implicitly.

The lifecycle mapping has no generic `upsert_*` or `change_*_state` action. Create/update/suspend/resume/close remain separate keys with separate allowed-state, expected-version, authorization, and audit rules. `resume_*` applies only after current revalidation; an Enrollment resume releases only the caller's authorized side hold and may leave aggregate state paused. `close_*` is terminal in Pilot-0. The scoped Pilot business-disable action uses `suspend_care_group`, and recovery uses `resume_care_group`; no second Nurture Pilot-enablement aggregate or reversible client toggle is introduced. My-Chat environment capability/workspace allowlist remain separate technical gates.

The synthetic institution/group MAY be pre-provisioned as internal test preparation, so `create_care_institution` and `create_care_group` need not be first-journey prerequisites. The accepted keys are still reserved contracts for the authenticated onboarding/control plane and MUST NOT be simulated by direct database edits once user-operable Pilot setup begins.

All B3-1d-2 additions are ahead of implementation. Nurture does not yet implement these enrollment/grant/topology command specs or authenticated domain-action handlers, and My-Chat has no adult workspace-invitation contract matching the reserved Host key. B3-1d-2 locks names and ownership only; the decision authorizes no source, schema, manifest, environment, capability, or activation change.

**Pilot-0-B3-1d-3 — safe unavailable reasons and implementation gate (LOCKED)**

Domain-action availability uses the following closed Pilot vocabulary:

| `safe_reason_code` | Safe meaning |
| --- | --- |
| `available` | The action is currently executable after its declared confirmation. |
| `not_implemented` | The product action is known in readiness/dev presentation but is not in the active domain-action registry. |
| `capability_disabled` | Environment/workspace capability gating prevents use. |
| `surface_not_entitled` | The current product surface does not expose the action for the resolved role. |
| `actor_not_entitled` | The current participant/role or operator entitlement is insufficient. |
| `scope_unavailable` | The current family/child/care-group/thread scope is not reachable. |
| `target_unavailable` | The target is missing, redacted, unavailable, or no longer visible. |
| `state_not_actionable` | The current object lifecycle does not permit the action. |
| `target_changed` | Expected version or target state changed after presentation. |
| `enrollment_inactive` | The required enrollment is not currently active/eligible. |
| `grant_missing` | The action requires a current grant that does not exist. |
| `grant_revoked` | The relevant grant has been revoked. |
| `policy_blocked` | Current policy, direction, or data-class rules block the action. |
| `operator_not_authorized` | The actor is not the named exact-workspace technical operator. |
| `technical_state_not_recoverable` | The current Step/Handoff state does not allow the requested Host recovery. |
| `owner_unavailable` | Current owner read/action service is unavailable and the path fails closed. |
| `temporarily_unavailable` | A bounded retryable condition such as command contention prevents execution now. |

The availability boundary is exact:

1. `safe_reason_code` is a presentation/telemetry classification, not authorization, command identity, business lifecycle, or a cached policy result. Every execution reruns owner resolution and command preconditions.
2. Nurture returns scenario-owned `safe_label` and optional `safe_help`. My-Chat renders those values and generic available/unavailable/confirmation primitives without interpreting grant, enrollment, item, or institution semantics.
3. `confirmation_class` is independent from availability and is exactly `explicit` or `strong_authorization`. A required confirmation never appears as an unavailable reason and cannot be inferred from surface or action name.
4. Internal command/precondition codes are not copied directly to clients. `participant_missing`/`role_missing` map to `actor_not_entitled`; care-group/thread/family reachability failures map to `scope_unavailable`; missing/redacted target failures map to `target_unavailable`; lifecycle conflicts map to `state_not_actionable`; version conflicts map to `target_changed`; `data_class_mismatch` maps to `policy_blocked`; command contention maps to `temporarily_unavailable`.
5. Existing safe `grant_missing`, `grant_revoked`, and `enrollment_inactive` may remain explicit because the entitled Nurture presenter owns that user-facing meaning. Raw database, provider, policy-engine, service-token, or technical exception text MUST NOT be returned.
6. Legacy Run-level action reasons such as `action_already_recorded` retain their existing contract. They do not enter or alias the domain-action vocabulary.
7. `not_implemented` is readiness/dev-only for a known action absent from the activation registry. An action declared active in `domain_action_contracts` without a valid handler is a validator fatal, not a runtime `not_implemented` response.

The additive implementation gate is ordered and fail-closed:

1. My-Workflow-Base first adds optional additive `domain_action_contracts` plus reusable domain-action availability/command/handler types and conformance fixtures. Existing `scenario_actions`, Run-action handler signatures, and legacy manifests remain unchanged.
2. Each declared contract carries `action_key`, allowed surface classes, target-ref classes, `confirmation_class`, and `handler_key`. The command envelope carries scenario/action identity, scenario-issued opaque target, expected version, idempotency/meta, and current client surface; B3-2 separately locks transition/token carriage.
3. Base validators are fatal for duplicate/reserved keys, missing handlers, target/surface/confirmation mismatches, attempts to reuse Run-action handlers, and declarations that cannot provide a current-state action result. Legacy fixtures continue to pass without `domain_action_contracts`.
4. My-Chat explicitly adopts the Base revision, implements generic action routing/rendering and a separate domain-action handler registry, records the exact contract hash, and keeps the capability disabled by default. My-Chat never resolves Nurture role/scope/target or translates command payloads.
5. Nurture adopts only after each advertised action has a real authenticated handler, command/owner path, current-state presenter, and negative tests. Missing implementation blocks manifest activation; planned keys remain undeclared until ready.
6. Adoption order is Base -> My-Chat -> Nurture. No three-repository simultaneous switch, no reinterpretation of old keys, and no capability enablement occurs during contract adoption.
7. Before external traffic, conformance/journey tests MUST cover wrong surface, actor/role, child/family/care-group scope, stale expected version, inactive enrollment, missing/revoked grant, policy change, ordinary workspace admin, raw-id injection, owner outage, duplicate command, legacy manifest compatibility, and absence of business bodies/secrets from action envelopes and telemetry.

B3-1d-3 is ahead of implementation. Base/My-Chat do not yet define the additive domain-action contract, and Nurture does not yet advertise or implement the accepted action surface. The decision closes B3-1 planning only; the decision authorizes no contract/source/schema/manifest/environment/capability/traffic change.

#### Pilot-0-B3-2 — cross-surface continuity

| Sub-checkpoint | State | Decision boundary |
| --- | --- | --- |
| B3-2a surface transition and destination selection | **LOCKED** | What a transition carries, when navigation occurs, destination precedence, and no implicit action. |
| B3-2b opaque token protocol | **LOCKED** | `clarify`, `submit_action`, and `open_notification` purpose, binding, Pilot TTL, consume, replay, and refresh. |
| B3-2c notification/deep-link stale handling | **LOCKED** | Recipient-bound delivery envelope, authenticated target open, delivery/open owner reread, and stale/withdrawn/revoked behavior. |
| B3-2d draft/result/history continuity | **LOCKED** | Surface-local drafts, canonical result replay/reread, role-correct history, and minimum negative/round-trip matrix. |

**Pilot-0-B3-2a — surface transition and destination selection (LOCKED)**

A cross-surface transition restores user intent and an eligible navigation destination only. The transition never transfers business authorization, command/lifecycle ownership, a cached availability decision, or a Nurture business fact.

Destination precedence is role-specific:

| Source intent | Preferred destination rule |
| --- | --- |
| Guardian action executable in current Chat/family board/family workbench | Complete in the current surface; do not force navigation. |
| Guardian complete history or complex enrollment/grant review | Navigate to `family_workbench`. |
| Caregiver action executable in Chat | Complete in Chat when the protected detail/action flow is available. |
| Caregiver current/detail/history work requiring the full role surface | Navigate to `teacher_board`; never route to a caregiver workbench. |
| Institution board write intent | Navigate to `institution_workbench`; the board remains read-only. |
| Institution read/aggregate navigation | Stay on `institution_board` unless authorized configuration detail is explicitly requested. |
| Technical recovery | Stay in `technical_admin`; never enter a Nurture role surface. |

The transition boundary is exact:

1. If the current entitled surface can complete an accepted action, the product SHOULD close the action there. Navigation is for a richer authorized view, not a mandatory detour or a substitute for missing action wiring.
2. My-Chat MAY carry only a generic destination `route_class`, a Nurture-issued opaque continuation token, and necessary display expiry/bookkeeping. URLs, notification payloads, client route state, analytics, and logs MUST NOT contain raw child, family, grant, message, receipt, item, enrollment, role-assignment, institution, or care-group ids.
3. A surface transition MUST NOT implicitly acknowledge, confirm, submit, cancel, revoke, redact, reissue, retry, or execute any durable action. Opening a target view is read-only until the user performs a separately presented/confirmed action.
4. The destination surface MUST perform a current Nurture owner read and re-resolve participant, surface entitlement, eligible role, work/child scope, target, grant, policy, lifecycle, expected version, and action availability before rendering protected detail or an executable control.
5. My-Chat does not decode the opaque token or synthesize a Nurture target from route params. A route class selects only a generic shell destination; Nurture decides the current target and whether the actor may see or act on the current target.
6. If a command completed in the source surface, the destination rereads the committed `CommandExecution`-referenced/current business result. Navigation MUST NOT create a second command identity or rerun the effect merely to populate another surface.
7. If token binding, entitlement, target, grant, policy, or lifecycle changed before open, Nurture returns the current safe unavailable/result view and newly available actions. The host MUST NOT restore an old button state, stale preview, or cached protected detail.
8. Transition and navigation telemetry MAY record route class, source surface, destination surface, outcome, latency, and opaque correlation id. The telemetry MUST NOT contain Nurture bodies, raw target ids, token material, or become a canonical Nurture fact.
9. Surface transition is absent from Nurture command identity and does not create a Message, Receipt, Item, Enrollment, Grant, role assignment, or `CommandExecution`. Any later durable action uses its own locked action/command contract.

B3-2a is ahead of implementation. My-Chat does not yet have the general scenario-produced domain-action/navigation registry locked by B3-1d-3, and the accepted family/teacher/institution target surfaces are not fully implemented. The decision locks navigation semantics only and authorizes no source, schema, manifest, route, environment, capability, or traffic change.

**Pilot-0-B3-2b — opaque token protocol (LOCKED)**

B3-2b specializes the already-locked IIA-0-R6 `NurtureInteractionContext` protocol for Pilot-0. The refinement adds no token type, token table, authorization service, session, draft platform, or business lifecycle.

| Purpose | Pilot use | TTL | Consume and replay |
| --- | --- | --- | --- |
| `clarify` | Short role, child/work scope, target, or intent ambiguity | 5 minutes | A structurally valid answer consumes once; another round or safe recovery creates a new context/token. |
| `submit_action` | Confirm and submit one prepared Nurture action | 5 minutes | Consumption, stable context-derived command identity, `CommandExecution`, and business effect commit atomically; exact committed replay returns the same Execution. |
| `open_notification` | Locate the current Nurture source/Receipt/Item/Message for a notification open | 7 days | Read-only opens do not consume; every open owner-rereads and may return current, changed, unavailable, clarification, or blocked state. |

The common binding is exact:

1. Every token MUST bind `workspaceId`, the current authenticated identity's resolved Nurture `participantId`, exact purpose, payload schema/version, expiry, and the surface where the token may be consumed or opened.
2. `surface` means consumer/return surface. Chat `clarify` additionally binds the namespaced hash of the same host conversation. `submit_action` binds the surface that presents/confirms the prepared action. `open_notification` binds the B3-2a-selected destination surface.
3. A token bound to a source surface MUST NOT become a cross-surface credential. When a purpose genuinely continues at a different destination, Nurture issues a destination-bound token; generic navigation without `clarify`, `submit_action`, or `open_notification` carries only route class plus the B3-2d allowlisted `current|recent|history` display mode, never a business target/filter/cursor.
4. My-Chat treats the token as opaque and MUST NOT use token material to derive role, scope, target, grant, action availability, or Nurture ids. B3-2c fixes raw-token carrier and stale landing behavior: notification provider/deep-link storage never contains token material, and token values remain forbidden from logs, analytics, error text, and business facts.

Purpose behavior is fail-closed:

1. `clarify` payload is limited to pending intent, complete candidate-path refs, and hashed option-token mappings. A missing/mismatched option or binding leaves the token unconsumed. A structurally valid answer consumes once; current participant/role/scope/grant/target/policy is then revalidated. Stale facts may return safe blocked/recovery, but the old token is not restored.
2. `submit_action` payload is limited to exact action key, opaque target refs, expected versions, prepared action schema/hash, and immutable content/attachment refs. The payload MUST NOT store a body, cached authorization, strong-authorization result, host retry state, or mutable client draft.
3. A successful or `already_satisfied` submit consumes the token in the same Nurture transaction as `CommandExecution` and the business effect. Response loss uses the stable `contextId + purpose` command identity and canonical hash to return the same committed result without a second write.
4. A deterministic expected-version, grant, policy, entitlement, target, or lifecycle denial revokes the prepared-action context and requires a current action reopen/reconfirm. A retryable owner/database contention with no committed Execution leaves the identical token active only until its original TTL; payload or command identity cannot change on retry.
5. A consumed submit without its corresponding committed Execution is an integrity defect, not a normal retry state. The integrity defect MUST fail closed and enter technical reconciliation rather than silently rerun a business effect.
6. `open_notification` is a locator only. Opening does not mark My-Chat notification state as a Nurture Receipt/Item state and MUST NOT acknowledge, confirm, submit, reply, or run any other command. Revocation, redaction, role removal, grant change, withdrawal, or target closure wins even before token expiry.
7. Token TTL controls continuation only. Token expiry MUST NOT transition or otherwise mutate a Message, Receipt, Item, clarification deadline, Grant, Enrollment, or command result. An expired notification may reach a generic authenticated shell, but the old locator cannot restore protected content.
8. Refresh never extends `expiresAt` or reactivates `consumed|revoked|expired`. Clarification regenerates current candidates; submit requires current owner read plus a newly presented/confirmed action; notification recovery returns through a current owner view. Any replacement is a new context/token and the replaceable prior active context SHOULD be revoked.
9. A scenario token never satisfies `strong_authorization`. Internal `token_mismatch|token_replayed|token_revoked|token_expired` remains server-side and maps through current safe presenter reasons such as `target_unavailable`, `state_not_actionable`, or `target_changed` without leaking internals.

The current interaction-context core already provides namespaced hash-only storage, participant/purpose/surface/conversation binding, optimistic consume/revoke, derived expiry, one-time clarification, and reusable notification reads. B3-2b remains ahead of full product implementation: purpose-level TTL enforcement, transactional submit consumption/Execution replay, consumer-surface contract tests, open-notification delivery wiring, safe reason mapping, and token leakage tests are still required. This readiness lock authorizes no source, schema, manifest, route, environment, capability, or traffic change.

**Pilot-0-B3-2c — notification/deep-link stale handling (LOCKED)**

Notification is a safe arrival signal and authenticated indirection, not a Nurture continuation, object reference, authorization source, business receipt, or extra role surface.

The delivery envelope is minimal:

| Carrier | Allowed | Forbidden |
| --- | --- | --- |
| My-Chat durable Notification | Exact workspace/recipient, Notification id/type/read state, internal Handoff target, generic safe copy/open route, delivery/correlation evidence | Raw scenario token, Nurture ref/id/body/status/action/policy cache |
| Provider payload | Recipient-bound `notification_id`, generic notification-open route, provider-required technical fields, generic safe title/body | Handoff id, scenario token, child/family/group/item/message/receipt/grant/enrollment ids or content |
| Deep link/client route | `morethan://notifications/{notification_id}/open` | Handoff id, scenario token, Nurture target, cached role/scope/action state |
| Open response/navigation memory | Generic `route_class`, newly issued destination-bound `open_notification` token, expiry/display bookkeeping | Token persistence, URL/query logging, business body, authorization decision |

For a Nurture Notification, the client list DTO exposes only Notification id/type/read state, generic safe copy, and generic deep link. Internal Handoff target id/type and metadata remain server-side; the generic workflow Notification DTO MUST NOT leak those fields into client navigation or analytics.

The authenticated open sequence is exact:

1. An unauthenticated tap enters generic My-Chat sign-in and preserves only the Notification id. My-Chat MUST NOT call Nurture before authentication.
2. My-Chat validates that the Notification exists for the exact authenticated `userId + workspaceId`. Wrong user, workspace, missing id, and tampered id return indistinguishable generic unavailable output and do not call Nurture.
3. After recipient validation, My-Chat marks only the Host Notification as read. Ready, stale/unavailable, and transient owner-outage landing all count as a Host open; manual unread remains available. Host read MUST NOT mark a Nurture Receipt read, acknowledge an Item, execute a reply, or create `CommandExecution`.
4. My-Chat rereads the internal Handoff. `requested|completed` may continue because Notification creation may commit before a response-loss completion update; `stopped|failed` is unavailable and cannot be resurrected.
5. My-Chat calls the Nurture open resolver with authenticated actor and refs from the server-side Handoff. The resolver reruns current participant, role, surface entitlement, work/child scope, enrollment, grant, policy, target lifecycle, and visibility.
6. A ready result returns only generic target `route_class` plus a newly issued B3-2b `scenarioToken(purpose=open_notification)`. Raw token exists only in the response/client navigation channel and MUST NOT enter provider payload, deep link, durable My-Chat Notification/metadata, logs, analytics, traces, or metrics.
7. The destination surface performs another owner read before protected detail, history, or actions. Client/process loss reopens the recipient-bound Notification and obtains a current token; no URL/local-history recovery of raw token is allowed.
8. Repeat and multi-device opens remain read-only. Each authenticated open rechecks owner state; a newly issued token does not transfer Notification ownership or revive another expired/revoked token.

Delivery eligibility and current open visibility MUST use separate owner operations:

| Owner operation | Question answered | Current-state effect |
| --- | --- | --- |
| `resolve_delivery` | Should the current recipient receive or retry the Notification now? | Current revoke/redaction/cancel/terminal target stops provider work; transient owner failure sends nothing and retries within Host policy. |
| `resolve_open` | What may the authenticated prior recipient see now? | May route acknowledged/replied/closed work to current authorized detail/history; never restores the earlier delivery predicate, preview, status, or action controls. |

Owner reread occurs before Notification creation, before every provider send/retry, and on every authenticated open. A pre-send deterministic stop marks technical delivery `skipped` and never calls the provider. A post-send revoke/redaction/withdrawal cannot recall an OS notification, so open-time and destination owner reads are the privacy fence. Provider `sent|failed|skipped` remains My-Chat technical state and never changes Nurture business status.

Stale-open behavior is closed:

| Current condition | Safe result |
| --- | --- |
| Actor/role/scope/grant/target current | `ready`; return current destination route and a fresh open token. |
| Item acknowledged/replied/closed but still historically visible | `ready`; show current authorized detail/history and current actions, never stale buttons. |
| Source redacted/withdrawn/suppressed | Owner-approved tombstone or `unavailable`; no protected body/detail token. |
| Grant revoked or role/enrollment/scope removed | `unavailable`; no target detail, token, or existence-bearing fallback. |
| Pre-send cancel/revoke/redaction | Delivery `skipped`; no provider call. |
| Post-send lifecycle/access change | Existing push remains generic; open resolves current safe result. |
| Owner API/database unavailable | `retryable`; show generic safe shell, expose no cached detail/control, and allow bounded retry. |
| Capability/workspace gate disabled | `unavailable`; no owner token or target navigation. |
| Wrong user/workspace/id | Same generic `unavailable`; no Nurture call or existence oracle. |

My-Chat understands only `ready|unavailable|retryable`, generic route, safe label/help, and retry availability. Nurture retains grant/redaction/lifecycle/policy meaning. Internal `handoff_unavailable` remains technical and MUST NOT become a client domain state or cached business reason.

The current X4/X5 implementation is only a scaffold. It places Handoff id in `morethan://nurture/attention/{handoff_id}`, returns Handoff target fields through the generic Notification DTO, opens directly by Handoff without exact Notification-recipient lookup, does not mark Host read as part of the landing flow, reuses the delivery `item.status=open` predicate for open visibility, issues no `open_notification` token, performs no target-surface navigation, and does not revalidate before every provider send/retry. The implementation also returns a generic availability card rather than current detail/history. B3-2c requires notification-id indirection, recipient-safe DTO, separate delivery/open owner contracts, token issuance, route navigation, generic-safe copy, pre-send reread, safe outcome mapping, and leakage/negative tests before Pilot traffic. The readiness lock changes no source, schema, manifest, route, provider, environment, capability, or traffic.

**Pilot-0-B3-2d — draft/result/history continuity (LOCKED)**

Pilot continuity preserves committed Nurture facts, current results, and current authorized history across surfaces. Pilot continuity does not create cross-surface persistence for unfinished business-body drafts.

The ownership and carrier matrix is exact:

| Continuity object | Owner | Cross-surface rule |
| --- | --- | --- |
| Unsubmitted text/form/AI draft | Creating actor + current surface | Does not cross surface/device/account/participant; no automatic recovery. |
| Same-surface clarification/prepared action | Nurture InteractionContext | Uses existing B3-2b 5-minute exact-surface context; consumed/expired context cannot move or revive. |
| My-Chat Chat transcript | My-Chat | Remains Host conversation history; cannot reconstruct, authorize, resubmit, or act as Nurture draft/result/history. |
| Committed command result | Nurture | `CommandExecution` replay plus current owner facts; source summary is non-authoritative display only. |
| Nurture business history | Nurture | Destination role surface queries current authorized history; rows never ride the transition. |
| Generic display intent | My-Chat shell | Only `route_class` plus allowlisted `view_mode=current|recent|history`. |
| Notification open | My-Chat + Nurture | Uses B3-2c Notification id indirection and B3-2b destination-bound open token. |

Draft behavior is closed:

1. Unsubmitted draft content is actor- and surface-local. Another guardian, caregiver, admin, device, or surface MUST NOT receive the draft.
2. Leaving a non-empty draft requires explicit `stay` or `discard_and_navigate`. Pilot provides no implicit save-and-continue, silent copy, background submit, or cross-device recovery.
3. My-Chat may retain the user's own Chat turn under Host transcript policy, but Nurture and destination surfaces MUST NOT infer a prepared business draft or consent from transcript text.
4. Caregiver AI draft based on protected family content is ephemeral, explicitly unconfirmed, and absent from Chat history, notification, route state, analytics, and other surfaces. Only a current caregiver-confirmed Nurture command publishes a named reply.
5. My-Chat `PublicDraft`, Workflow artifact drafts, and the existing Nurture -> forum public-draft Handoff remain separate external-publication contracts. Family-care question/reply, grant/enrollment, and Institution command drafts MUST NOT reuse those stores or lifecycles.
6. Institution board remains read-only and navigates before management-form input. Institution workbench starts a fresh current-state form; board never creates a hidden management draft.
7. Future cross-surface/cross-device draft resume requires a separately approved Nurture-owned draft aggregate, owner/version/TTL/redaction/confirmation rules, and additive contract/token purpose. `open_notification`, consumed `submit_action`, Host transcript, or PublicDraft cannot be repurposed.

Committed result continuity is owner-based:

1. Nurture business mutation, refs-only output refs, and `CommandExecution` are the authority. Source surface may render a display-safe result summary but the summary is not canonical state or a history row.
2. Exact response-loss retry returns the original Execution/result. Another surface MUST NOT generate a second command identity or rerun an effect to display completion.
3. Destination surface loads current facts through the Nurture presenter. Concurrent action, revoke, redaction, policy, or lifecycle change wins over source-time copy.
4. Pilot adds no `open_result` token. Outside B3-2c notification open, result navigation carries only route class/view mode; Nurture resolves current scope/business memory and asks clarification when multiple safe targets remain.
5. Execution/output refs remain Nurture owner-side values and MUST NOT enter URL, route state, Chat transcript, Notification, analytics, or My-Chat query dimensions.

History responsibility remains role-correct:

| Role surface | History responsibility |
| --- | --- |
| Guardian Chat | Current safe explanation/owner-reread result; not complete history. |
| Family board | Current/recent family work. |
| Family workbench | Complete authorized family Message/Receipt/outcome and complex grant/enrollment history. |
| Caregiver Chat | Current item explanation/transient detail/explicit action; not complete history. |
| Teacher board | Complete authorized current/history because Caregiver has no workbench. |
| Institution board | Current safe aggregate/readiness only. |
| Institution workbench | Authorized topology/configuration command history, never ambient family body history. |
| Technical Admin | Run/Step/Handoff/Outbox/Notification technical history only. |

History rows, business target filters, search text, pagination cursor, scroll position, old expected versions, and action state are surface-local. Every target query/page/filter/detail/action rereads current Nurture access. Redacted/suppressed rows expose only owner-approved tombstone state. My-Chat Chat transcript, Notification inbox, and Technical Admin never become a parallel Nurture history projection.

The minimum round-trip matrix is mandatory:

| Journey | Required result |
| --- | --- |
| Guardian Chat submit -> family board/workbench | One committed Message/Receipt appears through owner query; no second command. |
| Family board -> family workbench history | Only route + `history`; destination queries current complete authorized history. |
| Second guardian/cross-device open | No unsubmitted draft; only currently policy-visible committed facts. |
| Caregiver Chat acknowledge/reply -> teacher board | Current committed state appears; acknowledge/reply is not repeated. |
| Caregiver Chat AI draft -> teacher board | Draft does not transfer; user stays to finish or discards and restarts. |
| Institution board -> workbench -> board | Board creates no draft; workbench commits once; board rereads current aggregate. |
| Commit + response loss | Same Execution replays; every surface observes one business effect. |
| Revoke/redaction/concurrent change during navigation | Destination shows current unavailable/tombstone/state and no stale button. |
| Wrong actor/workspace/surface | No draft, result target, history, or existence leak. |
| Reload/process loss | Draft may be lost; deliberate navigation still requires explicit stay/discard, while committed result/history remains recoverable. |

Current foundations support the direction: Nurture CommandExecution already stores refs-only results and exact replay; InteractionContext forbids bodies and has no `resume_draft`. Product implementation remains incomplete: family/teacher/institution target surfaces, generic route/view-mode contract, destination history/result presenters, unsaved-draft UX, and the round-trip/negative matrix are absent. My-Chat PublicDraft exists for another lifecycle and must remain separate. B3-2d closes planning only and authorizes no source, schema, manifest, route, runtime, environment, capability, provider, or traffic change.

**Pilot-0-B3-3 — business path and data envelope**

| Checkpoint | State | Decision boundary |
| --- | --- | --- |
| B3-3a first input and data envelope | **LOCKED** | Exact first data class, fixed routing/classification fields, body envelope, exclusions, trusted derivation, and additive Pilot profile gate. |
| B3-3b grant, family authority, and target scope | **LOCKED** | One exact bidirectional Grant, active uniqueness, original-Grant lifecycle binding, owner/second-Guardian rights, care-group target, expiry, and revoke authority. |
| B3-3c Message/Receipt/Item lifecycle | **LOCKED** | Atomic capture, explicit acknowledgment, caregiver-confirmed reply, Receipt semantics, Attention projection, terminal-for-Pilot state, and family-visible outcomes. |
| B3-3d replay, revoke, redaction, and failure/privacy behavior | **LOCKED** | Exact replay, response loss, original-Grant fence, role-aware protected-body visibility, withdrawal/tombstones, notification independence, and fail-closed failure matrix. |

**Pilot-0-B3-3a — first input and data envelope (LOCKED)**

The first internal experiment accepts one business input only: a Guardian-authored protected plain-text `family_care_question` about the selected child's current care relationship. The reviewed workflow input requires caregiver acknowledgment and one caregiver-confirmed reply and is not a direct family-to-caregiver Chat message.

The authoritative Pilot profile is exact:

| Internal field | Pilot value / derivation |
| --- | --- |
| `data_class` | Fixed `family_care_question`. |
| `category` | Fixed `question`. |
| `urgency` | Fixed `today_attention`; no urgency selector or AI override. |
| `route_mode` | Fixed `immediate`; Pilot exposes no pending-route/cancel window. |
| `requires_ack` | Fixed `true`. |
| `requires_reply` | Fixed `true`. |
| `attachment_refs` | Fixed `[]`. |
| `safe_summary` | Deterministic generic copy, initially `Family question requires caregiver reply`; never derived from the protected body. |
| `source_surface` | Trusted Host/Nurture origin mapped from the actual entitled mobile/web surface; never client-authored authority. |
| participant/role/child/family/enrollment/care-group/thread/target/grant refs | Resolved from current Nurture context and policy; raw client ids are rejected. |
| `protected_content_ref` | Created only after protected owner storage; never accepted as a user-authored object selector. |

The user-facing Guardian submission carries only the current Nurture-issued context/confirmation plus question text. The text is trimmed plain text containing 1–2000 Unicode characters. Line breaks may be preserved; empty/control-only and overlong input is rejected. The source surface shows the resolved child and destination as safe display labels before explicit submission, but neither label nor prior selection bypasses current owner resolution.

The first profile excludes attachments, image/video/media, rich text, batch import, `daily_care_log`, `care_day_note`, `care_constraint_update`, `family_follow_up_request`, health observations, diagnosis, medication, and emergency requests. Recognized or uncertain out-of-profile input fails before the first business write and receives safe non-diagnostic/non-prescriptive routing; Nurture does not silently coerce the input into `family_care_question`, and My-Chat does not decide another Nurture business class.

Caregiver reply uses the symmetric content boundary: trimmed 1–2000-character protected plain text, no attachment, and deterministic generic display copy. AI may produce an editable draft, but a named reply is persisted only through a current caregiver-confirmed command with `authorship_kind=caregiver_confirmed`. AI cannot publish, set business classification, change routing flags, select a grant/target, or expand the envelope.

The Pilot profile is additive over the reusable domain kernel:

1. Existing general enums, schema, and command support for other data classes, categories, urgencies, attachments, sources, and pending workflow mode remain intact for future separately reviewed capabilities.
2. Before Pilot traffic, one strict Nurture-owned Pilot profile validator MUST run before the existing command runner and before protected/business persistence. The validator rejects every non-profile field or attempted client override and does not create parallel Message, Receipt, Item, or Execution types.
3. Protected body ingestion enforces the 1–2000-character boundary because the current domain command receives an opaque protected-content ref rather than inline text. The command boundary independently enforces all fixed refs-only/profile fields.
4. List/attention/notification copy remains generic. Authorized detail obtains the current protected body through owner reread after role, scope, grant, lifecycle, and policy checks.
5. Required negative evidence includes empty/overlong/control-only text, fixed-field override, non-empty attachment, unsupported class/category/urgency/route/source, raw-id/ref injection, health/emergency input, AI draft without confirmation, wrong actor/workspace/child/family, and exact replay without a second effect.

Current implementation already proves the wider `family_care_question` immediate path with `today_attention`, acknowledgment/reply flags, protected refs, Message/Receipt/Item/attention creation, and exact command replay. The authenticated user-facing adapter and narrow Pilot body/profile contract remain absent: generic payload validation still accepts broader classes/categories/urgencies, up to ten attachments, multiple source values, and `pending_workflow`, while body length is outside the refs-only command. B3-3a therefore closes planning only and records an implementation gate without changing source, schema, manifest, route, runtime, environment, capability, provider, or traffic.

**Pilot-0-B3-3b — Grant, family authority, and target scope (LOCKED)**

The complete first-Pilot question round trip uses one Nurture-owned active Grant. Separate `family_to_org` and `org_to_family` Grant identities are forbidden because partial replacement/revoke and repository selection would create two authorization tracks for one business conversation.

The exact Grant profile is:

| Grant field | Pilot value / rule |
| --- | --- |
| `workspaceId` | Exact allowlisted Pilot workspace. |
| `childCareProcessId` | Exact selected child process. |
| `enrollmentId` | Exact current active enrollment. |
| `grantedToScopeType` | Fixed `care_group`. |
| `grantedToScopeId` | Current care group referenced by the enrollment. |
| `directions` | Exactly `[family_to_org, org_to_family]`. |
| `dataClasses` | Exactly `[family_care_question]`. |
| `purposes` | Exactly `[family_care_workflow]`. |
| `grantedByParticipantId` | Current same-family Guardian who explicitly confirms the Grant. |
| `effectiveFrom` | Database `transaction_timestamp()` captured inside the successful confirmation transaction. |
| `expiresAt` | Required: earlier of `effectiveFrom + 30 days` or exact Pilot workspace allowlist expiry. |
| `status` | `active` after first successful confirmation; no automatic renewal/reactivation. |

The `care_group` target does not broaden the child scope. Every grant remains bound to the exact child and enrollment; the target only identifies the caregiver work scope allowed to receive that child's question. Institution-wide and enrollment-target Pilot variants are rejected. The `org_to_family` direction authorizes only one caregiver-confirmed reply causally linked to a source Item created under the same Grant. The direction does not authorize institution-initiated messages, broadcast, daily-care sharing, clarification loops, media, or another data class.

Active identity is deterministic:

1. At most one active Grant may exist for `(workspace, child process, enrollment, care group, family_care_workflow)`.
2. Reconfirming the exact same definition returns `already_satisfied` and creates no new row/effect.
3. Changing target, direction, data class, purpose, or expiry requires `replace_child_link_grant` with the current expected version. One transaction marks the old identity `replaced` and creates the new active Grant.
4. `revoked`, `expired`, and `replaced` identities never return to active. Expiry has no implicit renewal; a later authorization uses a new identity.
5. Overlapping active creation/replacement races fail deterministically. Repository resolution MUST NOT depend on `findFirst` ordering among multiple matching active rows.

One question is permanently bound to its original Grant:

```text
capture question -> acknowledge item -> caregiver reply
                     same original grantId
```

Capture stores the original `grantId`. Acknowledge and reply reload that exact row and recheck status, version, time window, enrollment, care-group target, both required directions, data class, purpose, Grant-owner eligibility, actor role/scope, and current policy. Revoke, expiry, replacement, owner-role loss, target/enrollment drift, or mismatch blocks the old item. A replacement Grant applies only to newly submitted questions and cannot take ownership of, resume, or deliver an old question.

Guardian authority is separate from family-visible business facts:

| Action | Grant owner | Another current same-family Guardian |
| --- | --- | --- |
| View current Grant scope/state | Allowed | Allowed. |
| View currently authorized committed question/Receipt/ack/reply | Allowed | Allowed. |
| Author a new question under the active family Grant | Allowed | Allowed; not required by the first scripted evidence. |
| Replace or revoke the Grant | Allowed with current expected version and confirmation | Not allowed. |
| Redact a submitted question | Own messages only | Own messages only. |
| Read or act on another family | Never | Never. |

The designated primary Guardian remains a Pilot script assignment, not a `primary_guardian` role. The second Guardian validates same-family committed visibility while retaining a distinct My-Chat identity, Nurture participant, session, authorship, and audit trail. Institution administrator, caregiver, and technical operator cannot confirm, replace, revoke, transfer, or directly edit a family Grant. If the granting participant loses current Guardian eligibility, new cross-role use fails closed; no role or operator inherits ownership, and a future current Guardian must complete a separately authorized new-Grant flow.

Current schema supports a bidirectional Grant and the revoke transaction already verifies that the actor owns the Grant. Product implementation remains incomplete: confirm/replace handlers and authenticated surfaces are absent; there is no enforced active-binding uniqueness; general `currentGrant` lookup can select among overlaps by `findFirst`; and caregiver reply currently may resolve another matching `org_to_family` Grant instead of the Item's original Grant. These gaps must be repaired with transactional concurrency/negative tests before Pilot traffic. B3-3b changes no source, schema, migration, manifest, runtime, environment, capability, provider, or traffic.

**Pilot-0-B3-3c — Message/Receipt/Item lifecycle (LOCKED)**

The first Pilot success path has exactly three Nurture command transactions:

```text
capture: open(v0)
  -> explicit acknowledge: acknowledged(v1)
  -> caregiver-confirmed reply: replied(v2, Pilot terminal)
```

Every transaction includes its `CommandExecution`, immutable output refs, business facts/events, and any permitted replay seed. A failed write, version conflict, policy/grant change, or transaction error rolls back the complete command effect.

Capture is atomic:

| Object | Committed state |
| --- | --- |
| Source Message | `family_authored`, `family_message`, `sent`, protected body, original Grant. |
| Source Receipt | `family_to_org`, complete route, `delivered(v0)`, target current care group. |
| FamilyCare Item | `open(v0)`, question/today-attention/ack-required/reply-required, original Grant. |
| ItemEvent | `created`, links the source Message and Item. |
| TeacherAttention | `active(v0)`, child-scoped and grouped by current care group. |
| Thread | `latestMessageAt` and aggregate version advance. |
| CommandExecution | One committed result plus activation seed only when permitted by the claimed-Step path. |

Pilot capture has no intermediate `pending` Receipt and no cancellable route window. Partial Message/Receipt/Item/Attention fact sets are invalid.

Acknowledge is a separate explicit business action:

1. The only happy-path transition is `open(v0) -> acknowledged(v1)` with current expected version, original Grant, caregiver role, care-group reachability, enrollment, exact Thread lifecycle, and policy; optional ThreadParticipant projection is not authority.
2. The transaction stores `ackedByParticipantId/ackedAt`, appends `acknowledged`, and moves the source Receipt `delivered(v0) -> acknowledged(v1)`.
3. TeacherAttention remains active because reply is still required.
4. Acknowledge creates no caregiver Message, org-to-family Receipt, reply, or implicit notification.
5. Family owner-read may present `caregiver acknowledged`, but acknowledgment is not a caregiver reply.

Reply is also separate and caregiver-confirmed:

1. The only happy-path transition is `acknowledged(v1) -> replied(v2)`. Reply from `open`, `waiting_for_family`, or any other state is blocked.
2. The transaction writes exactly one protected `caregiver_confirmed/caregiver_reply/sent` Message, links the Message to the source Item and `replied` event, and uses the original Grant.
3. The transaction creates one complete org-to-family `delivered(v0)` Receipt targeted to the current family, advances the thread, and moves TeacherAttention `active(v0) -> resolved(v1)`.
4. The source family-to-org Receipt remains acknowledged. The reply never overwrites the Guardian Message or source Receipt.
5. Both currently authorized same-family Guardians may owner-read the committed reply under B3-3b.

`replied` is terminal-for-Pilot. The first profile provides no second formal reply, in-place question/reply edit, clarification, `waiting_for_family`, follow-up, close, reopen, or continue-chat command. A correction or supplement creates a new `family_care_question` with a new command identity and complete capture lifecycle. General schema states remain available for future reviewed capabilities; `suppressed` remains reserved for B3-3d revoke/redaction/privacy behavior.

Receipt semantics are exact:

- `delivered` means the currently authorized logical Nurture target surface can owner-read the content after the Nurture transaction commits.
- `delivered` does not mean My-Chat Handoff/Outbox completion, provider/device delivery, notification display, user open, caregiver acknowledgment, or business reply.
- Teacher/family Item/detail/notification open is read-only in the Pilot and creates no implicit Nurture `read` transition. Host Notification read/unread remains Host-only.
- Only explicit acknowledge changes the source Receipt. Guardian open leaves the reply Receipt delivered because Pilot exposes no explicit family-read command.
- Family presenters compose the safe product states `sent -> caregiver acknowledged -> replied` from current Nurture Message/Receipt/Item facts rather than copying or exposing internal status tuples in My-Chat.

Current capture and acknowledge transactions largely match the decision. Current reply accepts `open|acknowledged|waiting_for_family`; the Pilot implementation must narrow both command preconditions and database update predicates to `acknowledged` only, apply the B3-3b original-Grant rule, and prevent clarification/second-reply/extra-close surface actions. B3-4 specifies notification coverage without changing the business transaction outcome. B3-3c changes no source, schema, migration, manifest, runtime, environment, capability, provider, or traffic.

**Pilot-0-B3-3d — replay, revoke, redaction, and failure/privacy behavior (LOCKED)**

Command replay is exact and immutable:

1. Every capture, acknowledge, and reply uses a stable `commandRequestId` plus canonical payload hash. The same identity and payload return the original `CommandExecution` and output refs; the same identity with different payload is rejected before a business write.
2. Capture/acknowledge/reply response loss never creates a second Message, Receipt, ItemEvent, Item/Attention version, or result set. A new question requires a new command identity, body ref, and routing attempt.
3. If Nurture committed but My-Chat lost the response, only the original durable claimed Step may reclaim and replay the stored seed. Another Step cannot take ownership. Exact replay materializes at most one Handoff.

The original Grant remains the runtime fence at every boundary:

| Invalidated point | Required Nurture result |
| --- | --- |
| Before capture commit | Reject with no Message, Receipt, Item, Attention, Execution effect, or replay seed. |
| After capture, before acknowledge | Source audit facts remain; Item and active Attention become suppressed; acknowledge/reply and cross-role body read are blocked. |
| After acknowledge, before reply | Acknowledgment audit remains; Item/active Attention are suppressed; reply is blocked. |
| After reply | Item becomes a suppressed audit state; completed reply history is not reopened and no new business action becomes available. |

Every execute, retry, presenter read, notification eligibility check, provider retry, and open revalidates the Item's exact original `grantId` plus current participant role, family, enrollment, care group, and policy. Grant `revoked`, `expired`, or `replaced`, Grant-owner role loss, enrollment/care-group drift, and policy disable all fail closed immediately; reconciliation is not the authorization boundary, and a new Grant never revives an old Item.

Linked Receipt and Attention behavior is exact:

- A `pending` Receipt becomes `blocked(grant_revoked)`. A `delivered`, `read`, or `acknowledged` Receipt becomes `revoked_after_delivery(grant_revoked)`.
- Active Attention becomes suppressed. Resolved Attention remains a resolved audit shell, but protected content and actions are unavailable.
- Messages, `CommandExecution`, ItemEvents, authorship, timestamps, and allowed audit metadata remain retained rather than rewritten.

Audit retention and protected-body authorization are separate:

| Actor after Grant invalidation | Protected-body result |
| --- | --- |
| Original Guardian author with current same-family Guardian eligibility | May owner-read their own unredacted family Message. |
| Other current Guardian in the same family | May owner-read the family-side family submission under current family policy. |
| Caregiver receiver of the family Message | Loses the cross-role body and sees only an allowed content-free tombstone. |
| Caregiver author of an existing reply with current same-side role | May retain author-side audit access to their own unredacted reply. |
| Guardian receiver of the caregiver reply | Loses the cross-role reply body and sees only an allowed tombstone. |
| Author whose role/family relationship is no longer current | Loses author-side protected-body access as well. |

Message redaction is exact-author-only, expected-version, and irreversible:

| Redacted Message | Required cascade |
| --- | --- |
| Guardian source question | Clear body/protected ref; source Receipt becomes `revoked_after_delivery(source_redacted)`; dependent Item and active Attention are suppressed; caregiver read/acknowledge/reply are blocked. A previously committed caregiver reply is not automatically redacted because the reply has another author, but the source question renders as a tombstone. |
| Caregiver reply | Clear reply body/protected ref; reply Receipt becomes `revoked_after_delivery(source_redacted)`; family sees a reply tombstone. Source question/source Receipt, terminal replied Item, resolved Attention, Execution, and events retain audit state. The Item is not suppressed or reopened, and no second reply becomes available. |

An allowed tombstone contains no body, body-derived summary, protected ref, attachment ref, hidden target selector, or internal redaction/denial reason. No replay, stale token/button/cache, replacement Grant, or technical recovery can unredact a Message.

Pilot immediate routing exposes no `cancel_route` action. Calling cancel after logical delivery returns `route_already_visible` without mutation. Post-submit withdrawal is represented only by exact-author redaction or Grant-owner revoke; cancel, redaction, and revoke remain separate commands and audit meanings.

Failure ownership remains independent:

| Failure | Required result |
| --- | --- |
| Nurture precommit failure | No business facts; retry the same command identity. |
| Nurture postcommit response loss | Replay the original Execution/output refs. |
| My-Chat Step/Handoff/Outbox failure | Nurture facts remain committed; original same-Step recovery continues. |
| Notification provider failure | Nurture Receipt remains unchanged; My-Chat Outbox retries or dead-letters. |
| Nurture owner API outage | No notification send and no cached protected body; return generic retryable state. |
| Stale version/action | No write; refresh current state. |
| Wrong actor/workspace/family/child | Generic unavailable; no existence or content disclosure. |
| Capability or workspace allowlist disabled | Block new writes/activation while retaining committed facts. |

Technical Admin may inspect refs/counts/status/version/reason evidence, reconcile the original outcome-unknown Step, replay/stop eligible Handoffs, request Nurture owner reevaluation, and disable the gate. The operator cannot edit Message/Receipt/Item, undo redaction, restore/replace a Grant, synthesize provenance, or mark acknowledge/reply.

Notification delivery rechecks owner eligibility before creation and every provider send/retry. A not-yet-sent notification after revoke/redaction is skipped. An OS notification already displayed cannot be retracted, but every open authenticates, owner-rereads, and returns only current content, an allowed tombstone, or generic unavailable/retryable state. Host read/unread never changes Nurture lifecycle.

Current core tests already cover exact replay, wrong-Step ownership, Grant revoke, redaction, and owner reread. Pre-Pilot implementation must still:

1. Replace the current revoke/redaction `take: 100` behavior with an atomic loop-to-closure or whole-transaction overflow failure; a partially fenced dependent fact set must never commit.
2. Enforce the B3-3b original-Grant and B3-3c acknowledge-only reply requirements.
3. Add separate author-side and receiver-side post-revoke body-visibility tests.
4. Assert caregiver-reply redaction does not suppress/reopen the source Item and remove `cancel_route` from the Pilot action registry.
5. Jointly validate provider retry/dead-letter, owner outage, stale notification, and two-key kill-switch behavior.

B3-3 is complete as a planning contract. B3-3d changes no source, schema, migration, manifest, route, runtime, environment, capability, provider, database, or traffic.

**Pilot-0-B3-4 — representative journey coverage (LOCKED / COMPLETE)**

B3-4 proves the accepted action, continuity, and business contracts without requiring every action, surface, and failure to form a full Cartesian E2E product. Evidence is layered:

| Evidence layer | Mandatory responsibility |
| --- | --- |
| Contract/conformance | Exercise every allowed and denied B3-1 action/surface cell; validate stable keys, confirmation class, target-ref class, handler presence, legacy compatibility, and fail-closed routing. |
| Nurture domain/DB | Prove atomic command effects, versions, original Grant, Receipt/Item/Attention lifecycle, revoke/redaction cascades, author/receiver visibility, and no partial dependent state. |
| Two-database joint E2E | Prove claimed-Step response-loss replay, same-Step ownership, wrong-Step denial, Handoff/Outbox recovery, notification owner reread, provider/owner failure, kill switch, and persistence privacy. |
| Rendered surface E2E/manual | Prove generic Chat interaction UI, family/teacher/institution board and workbench behavior, Notification/deep link, Technical Admin limits, safe empty/error/permission states, and current-state refresh. |

The complete action/surface matrix is exhaustive at the contract/adapter layer. Full business E2E uses four representative round trips across the existing three child/family scopes and seven logical accounts:

| Journey | Guardian entry | Caregiver acknowledge | Caregiver reply | Family result and special evidence |
| --- | --- | --- | --- | --- |
| J1 — multi-Guardian cross-surface | Family-1 designated Grant owner submits through generic Chat. | Caregiver Chat | Teacher board | Second Guardian opens the recipient-bound Notification into Family board and then Family workbench history; both Guardians see current same-family facts and neither sees another family. |
| J2 — board to Chat | Family-2 Guardian submits through Family board. | Teacher board | Caregiver Chat | Guardian owner-rereads the result in Family workbench; caregiver-reply redaction later leaves the source Item terminal/replied and actionless. |
| J3 — workbench to board | Family-3 Guardian submits through Family workbench. | Teacher board | Teacher board | Guardian opens current result from Notification to Family board; the joint path injects response loss/provider recovery while preserving one effect. |
| J4 — Chat same-surface | Family-1 second Guardian submits a separate question under the current family Grant. | Caregiver Chat | Caregiver Chat | Primary Guardian owner-rereads the committed result; the submitting second Guardian then performs exact-author source redaction to prove the distinct source/reply cascade and tombstone behavior. |

The four journeys provide all four Caregiver `Chat|teacher_board` acknowledge/reply pairings, exercise Guardian Chat/board/workbench submission, and validate the second Guardian without adding a fourth child. Each question has a new command identity, body ref, and routing attempt. Every surface observes one canonical Nurture fact path; navigation/open is read-only, drafts do not cross surfaces, and authorized committed facts are recovered by owner reread rather than command replay from another surface.

The Institution strand is separate from the family-care round trips:

1. Institution board displays safe missing/readiness, invitation, role, enrollment, Grant-coverage, and backlog aggregates and never executes a durable write.
2. Institution workbench initiates the My-Chat adult invitation; My-Chat owns acceptance, then Nurture binds the canonical user and separately assigns the current staff role.
3. Workbench initiates enrollment, while a Guardian independently confirms the family link and creates the Grant. Institution administration never substitutes for Guardian authority.
4. Board rereads current aggregates after setup and business activity without family question/reply bodies or protected consent narrative.
5. Institution workbench business-cohort disable blocks new eligible Nurture work while retaining facts. Recovery is a separate revalidated command and cannot revive a revoked Grant, redacted Message, or terminal Item. My-Chat technical kill switch remains independent.

Pilot-0-C owns the exact authenticated onboarding/UI/API closure. B3-4 locks the required eventual journey but does not treat direct fixture or Prisma setup as product evidence.

The Technical Operator strand remains entirely in Technical Admin:

- inspect refs/counts/status/version/reason evidence;
- reconcile the original outcome-unknown Step and prove same-Step recovery;
- replay/stop an eligible Handoff and observe Outbox/provider retry or dead-letter;
- request Nurture owner reevaluation and execute disable-only emergency shutdown;
- fail every attempt to read protected business content, edit Message/Receipt/Item, restore/replace a Grant, reverse redaction, synthesize provenance, or mark acknowledge/reply.

The complete negative/failure coverage matrix is mandatory:

| Category | Required cases |
| --- | --- |
| Identity/scope | Wrong workspace, family, child, role, care group, surface, and raw-id/ref injection; cross-family Guardian; Institution/Operator body denial. |
| Command/concurrency | Exact replay, same id/different payload, response loss, wrong-Step, stale version, concurrent acknowledge/reply, reply-before-ack, and second reply. |
| Grant fence | Invalidation before capture, after capture/before acknowledge, after acknowledge/before reply, and after reply; expiry, replacement, owner-role loss, enrollment/care-group drift, and policy disable. |
| Redaction | Guardian source redaction before caregiver action and after committed reply; caregiver-reply redaction; no unredact, Item reopen, or second reply. |
| Surface continuity | Draft stay/discard, reload/process loss, cross-device committed-only access, history navigation, stale button/token/cache, and concurrent change at destination. |
| Notification | Owner reread before create/send/retry/open; wrong recipient; provider retry/dead-letter; revoke/redaction after send; stale deep link; owner API outage; Host read remains non-business. |
| Runtime | Nurture precommit failure, postcommit response loss, Step/Handoff/Outbox crash, exact/partial duplicate, Admin reconciliation, and two-key kill switch. |
| Privacy | Zero body, claim token, forbidden protected ref, raw target, internal denial reason, or secret material in My-Chat persistence, Handoff, Outbox, Notification, logs, analytics, and telemetry. |

Equivalent failure semantics do not need repetition on every surface. Contract/adapter tests exhaust surface availability, domain tests exhaust business state points, and representative joint/surface paths cross the highest-risk boundaries.

B3-4 exit evidence is exact:

1. Every B3-1 allowed/denied action-surface cell maps to a deterministic test id and owner.
2. J1-J4 pass with three independent families, three child scopes, four Guardian identities, one institution admin, one lead caregiver, and one Technical Operator.
3. All four Caregiver acknowledge/reply surface pairings pass; second-Guardian same-family visibility and cross-family denial pass.
4. Institution and Technical Admin surfaces expose no protected family body or unauthorized business control.
5. High-risk joint replay/fault/privacy journeys pass three consecutive times with one business effect and at most one Handoff for each question.
6. The revoke/redaction `take: 100` partial-cascade risk is removed through atomic loop-to-closure or whole-transaction overflow rollback.
7. Automated contract, DB, joint, and surface evidence passes, followed by one recorded manual rendered journey on the exact candidate artifact/topology.
8. CI may seed synthetic topology for kernel validation; final Pilot-2 product evidence must use authenticated owner actions after Pilot-0-C closure.
9. Capability and workspace allowlist remain disabled; B3-4 closes readiness decisions only and authorizes no implementation, database, artifact, secret, provider, or traffic change.

Pilot-0-B is complete. Pilot-0-C IIB/onboarding closure is governed below and has started with C-0.

The remaining delivery and operations rows are recommendations until their later Pilot checkpoint is explicitly accepted.

| Dimension | Recommended lock |
| --- | --- |
| Environment | A new isolated `pilot` environment, separate from current dev, staging, and production. No shared database. |
| Cohort | **LOCKED by revised Pilot-0-B1:** one allowlisted internal test workspace; one synthetic institution/group; three synthetic child scopes and three independent families. Real Pilot-4 cohort sizing remains open. |
| Guardian matrix | **LOCKED by Pilot-0-B2-1:** one family has two guardians, the other two have one guardian each; four distinct My-Chat test accounts. |
| Staff/operator matrix | **LOCKED by Pilot-0-B2-2:** one separate institution administrator, one lead caregiver, no backup caregiver, and one non-business technical operator; seven logical accounts in total. |
| Surface entitlement | **LOCKED by Pilot-0-B3-0:** guardian uses Chat/family board/family web workbench; caregiver uses Chat/teacher board; institution admin uses institution board/institution web workbench; technical operator uses technical Admin only. |
| Guardian action availability | **LOCKED by Pilot-0-B3-1a:** core rights are reachable from all three Guardian surfaces through generic Chat interactions or dedicated board/workbench UX, while all writes converge on Nurture commands. |
| Caregiver action availability | **LOCKED by Pilot-0-B3-1b:** generic Chat and teacher board both close acknowledge/reply; protected bodies use transient owner-read detail; teacher board owns complete authorized work history; direct family Chat and bulk/multi-caregiver actions are excluded. |
| Institution action availability | **LOCKED by Pilot-0-B3-1c:** the institution board is read-only safe aggregate/navigation; the institution workbench owns strongly confirmed Nurture topology/configuration commands; Guardian authority, protected family content, caregiver actions, technical runtime controls, destructive deletion, and ranking remain unavailable. |
| Action-key layering | **LOCKED by Pilot-0-B3-1d-0:** product action, Nurture command, Workflow entrypoint, implementation handler, and Host Admin recovery remain separate; six existing family-care mappings are stable, and current Run-level `scenario_actions` is not repurposed for domain objects. |
| Technical-operator permissions | **LOCKED by Pilot-0-B3-1d-1:** a named, exact-workspace internal operator may inspect safe technical evidence, reconcile the original outcome-unknown Step, replay/stop eligible Handoffs, request owner reevaluation, and perform disable-only emergency shutdown; no Nurture business action or direct-state edit is permitted. |
| Remaining domain-action mapping | **LOCKED by Pilot-0-B3-1d-2:** Guardian enrollment/grant actions and Institution topology/configuration transitions use explicit stable keys; invitation is split across My-Chat identity acceptance and Nurture participant binding; care-group suspend/resume is the only Pilot business-disable lifecycle. |
| Unavailable reasons and adoption gate | **LOCKED by Pilot-0-B3-1d-3:** domain actions use the closed safe reason vocabulary and separate confirmation classes; missing handlers/declaration drift fail validation; Base, My-Chat, and Nurture adopt additively in order with legacy compatibility and capability off. |
| Surface transition | **LOCKED by Pilot-0-B3-2a:** complete an action in the current entitled surface when possible; otherwise carry only generic route class plus opaque Nurture continuation to the role-correct destination, perform current owner reread, and never execute an implicit command. |
| Opaque token protocol | **LOCKED by Pilot-0-B3-2b:** only clarify/submit/open-notification are valid; bind exact workspace/participant/purpose/consumer surface, use Pilot TTL 5m/5m/7d, consume clarify once and submit transactionally, keep notification open read-only/reusable, and replace rather than extend tokens. |
| Notification/deep-link stale handling | **LOCKED by Pilot-0-B3-2c:** provider/deep link use recipient-bound Notification id only; authenticate and validate ownership before owner reads; split delivery/open resolution; reread before create/send/open; issue destination token only after current open; Host read never acknowledges Nurture work. |
| Draft/result/history continuity | **LOCKED by Pilot-0-B3-2d:** drafts stay actor/surface-local with explicit stay/discard; committed results use Execution replay/current owner reread; history is queried at role-correct surfaces; only route class + current/recent/history follows navigation. B3-2 is complete. |
| Business path | Guardian private input → `family_care_question` → class inbox/teacher attention → caregiver acknowledge + reply → family receipt/reply → grant revoke/stale-open check. |
| Input/data envelope | **LOCKED by Pilot-0-B3-3a:** 1–2000-character protected plain-text question/reply only; fixed question/today-attention/immediate/ack/reply/empty-attachment profile; generic summary; owner-derived refs; no health/emergency/media/daily-care/constraint/follow-up/rich-text/batch input. |
| Grant/family authority/target | **LOCKED by Pilot-0-B3-3b:** one active exact child/enrollment/care-group Grant with both directions, question-only data class, bounded expiry, owner-only administration, same-family visibility, and original-`grantId` capture/ack/reply binding; replacement never revives an old item. |
| Business lifecycle | **LOCKED by Pilot-0-B3-3c:** atomic capture creates Message/Receipt/open Item/active Attention; explicit acknowledge updates Item/source Receipt while Attention stays active; caregiver-confirmed reply only from acknowledged creates reply Message/Receipt and resolves Attention; `replied` is terminal-for-Pilot and delivery/read/notification remain separate. |
| Replay/revoke/redaction/failure privacy | **LOCKED by Pilot-0-B3-3d:** exact immutable command replay and same-Step seed ownership; original-Grant fence on every boundary; role-aware author/receiver body visibility; distinct irreversible redaction cascades; no Pilot cancel; owner/provider/runtime failures remain independent and fail closed. B3-3 is complete. |
| Representative journey coverage | **LOCKED by Pilot-0-B3-4:** exhaustive action/surface conformance plus four representative round trips across three child scopes cover all Guardian input surfaces and Caregiver acknowledge/reply pairings; Institution/Operator strands and layered identity/replay/Grant/redaction/continuity/notification/runtime/privacy evidence close Pilot-0-B. |
| Operation model | Operator-assisted and allowlisted. No self-service institution signup and no traffic outside the named workspace. |
| Observation window | Five consecutive operating days after Pilot-3 rehearsal passes. Extend only by explicit Pilot-4 decision. |

## Recommended delivery contract

The pilot topology should preserve runtime and data ownership rather than promote the dev host:

1. My-Chat API/workers remain the host for account auth, Workflow Run/Step/Handoff/Outbox, notification, deep link, and Admin technical recovery.
2. The My-Chat worker build consumes an immutable, exact-revision Nurture scenario artifact and constructs `createNurtureActivationScenarioModule` with host-owned seed/Actor/claimed-Step ports and a separate Nurture database client. The Nurture package does not acquire queue, lease, attempt, or Handoff Ledger ownership.
3. An intentionally small Nurture owner API serves current-state owner reads over a private service network with scoped service authentication. The current dev-host workflow/project API is not part of the artifact.
4. My-Chat authenticated shell routes invoke Nurture-owned presenters/actions. Raw Nurture business routes are not exposed directly to clients.
5. Activation requires both the environment capability and an exact workspace allowlist. Removing either one stops new activation and owner delivery fail-closed.
6. My-Chat and Nurture databases, migrations, backup/restore evidence, secrets, artifact provenance, and service-to-service token scope remain separate Pilot-1 deliverables.

If the approved topology uses the current My-Chat container publication path, ACR credentials/publication become a Pilot-1 prerequisite. ACR is not required for Pilot-0 documentation and is not configured here. Nurture still needs its own real artifact definition regardless of registry provider.

## Pilot-0-C — IIB and onboarding closure contract

| Checkpoint | State | Decision boundary |
| --- | --- | --- |
| C-0 authenticated ingress and first-Institution bootstrap | **LOCKED** | Public/private IIB ownership, first-admin bootstrap authority, provisioning identity/idempotency/closure, and forbidden ambient-admin/dev-host/DB-edit alternatives. |
| C-1 CareGroup and institution-staff onboarding lifecycle | **LOCKED / COMPLETE** | C-1a-e lock the sole class aggregate, derived readiness, Staff Invitation/acceptance, Participant binding, separate Caregiver/Lead roles, offboarding, and family-invitation gate. |
| C-2 child/family/enrollment/Grant onboarding | **LOCKED / COMPLETE** | C-2f-5 closes C-2 with immutable business outcome versus replay disposition, exact server-only output refs, current owner presenters, same-Execution/same-Step response-loss recovery, route-only continuity, preserved explicit-empty paths, and minimal future Guardian relationship attention without widening `user_attention`. |
| C-3 Guardian/Caregiver operational IIB | OPEN | Authenticated presenters/actions and complete user-visible question, receipt, attention, acknowledge, reply, history, redaction, and revoke flows. |
| C-4 Institution IIB, safe states, and closure evidence | OPEN | Board/workbench closure, empty/loading/error/permission behavior, accessibility, route/auth negatives, and Pilot-0-C exit evidence. |

### Pilot-0-C0 — authenticated ingress and first-Institution bootstrap (LOCKED)

The Pilot exposes one public application boundary:

1. Guardian/Caregiver generic Chat, family/teacher/institution boards, family/institution workbenches, Notification, and deep links enter through authenticated My-Chat shell routes.
2. Clients never call raw Nurture owner, presenter, resolver, or command routes. My-Chat authenticates the canonical user/workspace, validates generic route/surface context, carries idempotency and Nurture-issued opaque context, and renders typed generic presenter/action envelopes.
3. Nurture private owner/action services alone resolve participant, eligible role, work/child scope, target, Grant, policy, lifecycle, expected version, display state, and action availability on every read and action. My-Chat never supplies a trusted role, scope, target, Grant, availability decision, or business lifecycle value.
4. The current Nurture dev-host workflow/project routes are not part of the Pilot artifact, are not exposed through My-Chat, and cannot serve as an operational fallback.

The first synthetic Institution cannot use the ordinary Institution-admin flow because no Institution Admin exists yet. The Pilot therefore uses one explicit bootstrap exception rather than ambient privilege:

1. A versioned Pilot provisioning specification binds the exact allowlisted workspace, Nurture scenario, synthetic Institution definition, initial Institution Admin My-Chat identity, and expiry.
2. The provisioning specification is control-plane input. The specification is not a B3-2 scenario interaction token, client credential, URL/deep-link value, user-selected role, or reusable authorization result. Pilot-0-D will lock issuance, custody, deployment, revocation, and rollback.
3. The initial Admin must authenticate as the exact My-Chat user and accept the matching My-Chat invitation before Nurture bootstrap may execute.
4. One idempotent Nurture transaction creates the exact Institution, Participant, first Institution Admin role assignment, and auditable `CommandExecution`/result refs. Exact response-loss replay returns the original result; a second business effect is forbidden.
5. Wrong/changed user, workspace, scenario, Institution definition, canonical payload hash, or expiry fails before a business write. Reuse after success or concurrent non-identical consumption also fails closed.
6. Successful bootstrap closes permanently. Later adult onboarding uses ordinary C-1 invitation, accepted-user binding, and separate staff-role commands. Neither an Institution Admin nor a Technical Operator can reopen bootstrap.
7. Technical Admin may observe refs/counts/status/version/reason evidence for the technical outcome. The operator cannot author or change the provisioning specification, choose another initial Admin, invoke bootstrap with a business payload, alter created facts, or turn the exception into general provisioning authority.

The following alternatives are forbidden:

- ordinary My-Chat workspace admin automatically becoming a Nurture Institution Admin;
- Technical Admin directly creating Nurture participants or role assignments;
- the initial user self-declaring an Institution, role, scope, or target;
- a client, URL, invitation code, or raw id selecting Nurture authority;
- direct Prisma/SQL fixture writes counting as final Pilot onboarding evidence;
- public/raw Nurture business endpoints or deployment of the current dev host.

C-0 evidence must cover one exact successful bootstrap fact/audit set, exact replay, concurrent consumption, wrong/expired/drifted/reused specification, unauthenticated/wrong-user/workspace/scenario attempts, ordinary workspace admin, self-claim, Technical Operator mutation/reopen, raw-client authority injection, direct-route/dev-host exposure, and absence of protected body/secret material from Host persistence and telemetry. This is a readiness contract, not an authorization to create the provisioning artifact or apply a database change.

### Pilot-0-C1 — CareGroup and institution-staff onboarding lifecycle (LOCKED / COMPLETE)

| Sub-checkpoint | State | Decision boundary |
| --- | --- | --- |
| C-1a CareGroup lifecycle and readiness | **LOCKED** | One class aggregate, workbench-only writes, read-only board, lifecycle/readiness separation, and no hard delete. |
| C-1b Staff Invitation and My-Chat acceptance | **LOCKED** | Institution initiation, Host-owned contact/auth/acceptance/membership, opaque Nurture correlation, and no role grant. |
| C-1c Participant, Caregiver role, and Lead designation | **LOCKED** | Accepted-user binding, separate strong role assignment, exact group scope, distinct Lead transition, and idempotent audit. |
| C-1d revoke/offboarding/reinvite | **LOCKED** | Immediate fail-closed access, retained identity/authorship/audit, other-scope preservation, and no silent role reactivation. |
| C-1e family-invitation readiness gate | **LOCKED** | Active topology, Lead coverage, required policy, Pilot gates, and no enrollment invitation before readiness. |

`NurtureCareGroup` is the only class/group business aggregate. Institution Admin uses the Institution workbench to create/update and non-destructively pause/resume/archive the CareGroup with expected-version `CommandExecution`; Institution board displays only safe status, readiness, and navigation. Pilot exposes no `Class` duplicate, generic state-upsert, card-triggered write, or hard-delete action.

CareGroup lifecycle and onboarding readiness remain separate:

| Dimension | Source of truth |
| --- | --- |
| CareGroup lifecycle | Existing `active`, `paused`, and `archived` Nurture state; `deleted` is not a Pilot user operation. |
| Family-invitation readiness | Current derived result requiring active Institution/CareGroup, active exact-group Lead Caregiver, complete required policy, and enabled environment/workspace/business gates. |

Missing teacher coverage or policy produces a current unavailable/readiness reason rather than a second persisted class status, Host-owned readiness flag, or cached authorization result. A group may exist before staffing, but family Enrollment Invitation send and protected family-care work remain blocked until readiness passes. Group pause/archive blocks new invitations and cannot delete historical roles, enrollments, messages, or audits.

Institution staff onboarding is a sequence of independent owner transitions:

1. Institution Admin initiates Staff Invitation from the workbench for a safe intended Institution/CareGroup context.
2. My-Chat owns recipient contact data, delivery, authentication, acceptance, and workspace membership. Nurture receives only accepted canonical identity plus an opaque Host invitation ref and allowlisted display context.
3. Acceptance binds or reuses exactly one workspace `NurtureParticipant`; no Nurture business role exists yet.
4. Institution Admin separately and strongly confirms an exact care-group-scoped `caregiver` RoleAssignment with current version/scope/policy.
5. Lead Caregiver designation is another explicit transition and is never inferred from first acceptance, invitation wording, Participant existence, or general membership.
6. Only current Host membership plus current Participant, exact active RoleAssignment, active Institution/CareGroup, and policy permits Caregiver Chat/teacher-board access.

Invitation intent is not authorization. Host invitation acceptance, Host membership, Participant binding, Caregiver assignment, and Lead designation have distinct identities, versions, audit outcomes, and retry semantics. Another group's role, general workspace admin, Institution Admin status, or a raw client role/scope value grants no caregiver reachability.

Role suspend/revoke/expiry, Host membership loss, CareGroup/Institution pause/archive, policy change, or scope drift blocks access immediately on every read/action. Offboarding retains Participant, invitation/acceptance history, authorship, Message/Event/Execution facts, and other independently active role scopes. Reinviting the same canonical user reuses the Participant but requires a new/current RoleAssignment; no terminal assignment silently reactivates.

The internal experiment activates exactly one Lead Caregiver, no backup caregiver, no Institution Admin/Caregiver overlap, and no multi-caregiver concurrency. The reusable schema may later support several separately scoped Caregiver assignments or a teacher serving several groups, but each scope remains independently granted and revoked.

C-1 evidence must cover workbench command/board-write boundaries, CareGroup version conflicts and lifecycle, missing/stale readiness, Staff Invitation exact replay/drift/expiry/revoke, acceptance-before-assignment, Participant uniqueness, assignment-before-acceptance denial, wrong-group scope, distinct Lead designation, Host membership loss, role suspend/revoke/reinvite, preservation of another valid scope, overlap denial, group pause/archive, and Enrollment Invitation unavailable-to-ready transition without family content leakage. The C-1 decision changes no source, schema, route, environment, capability, invitation provider, database, or traffic.

### Pilot-0-C2 — child/family/enrollment/Grant onboarding (LOCKED / COMPLETE)

| Sub-checkpoint | State | Decision boundary |
| --- | --- | --- |
| C-2a no-existing-profile entry and longitudinal child boundary | **LOCKED** | Minimal institution-local RosterEntry; Guardian-authenticated child-process creation/selection; no implicit Enrollment, Grant, matching, or institution-only full profile. |
| C-2b Family and Co-Guardian Invitation | **LOCKED / COMPLETE** | C-2b-1 through C-2b-4 lock establishment, invitation/acceptance, current rights/history, and self-exit-only offboarding without peer/admin removal. |
| C-2c Institution Enrollment Invitation | **LOCKED / COMPLETE** | C-2c-1 through C-2c-4 lock issue/binding, child branch, lifecycle/concurrency, and the confirmation-ready result/continuation boundary without a pre-confirmation business or Workflow Handoff effect. |
| C-2d child-process selection/creation, Enrollment, and thread timing | **LOCKED / COMPLETE** | C-2d-1 through C-2d-4 lock atomic confirmation, lifecycle/concurrency, first-Grant Thread timing, typed result/current recovery, route-only Grant review, and explicit-empty Handoff. |
| C-2e separate Grant authorization | **LOCKED / COMPLETE** | C-2e-0 through C-2e-4d lock one owner-read authority path, exact Grant/role identity, strong create/replace/revoke, immutable recovery, owner-loss handling, typed complete cascades, bounded evidence, and zero implicit Host activation. |
| C-2f leave/transfer/next-stage and cross-workspace boundary | **LOCKED / COMPLETE** | Existing lifecycle/stage/visibility/portability rules remain fixed; C-2f-5 adds exact result/replay/presenter semantics, server-only refs, same-Execution/same-Step recovery, route-only continuity, unchanged legacy `user_attention`, and the minimal additive relationship-attention matrix. |

#### C-2a — no-existing-profile entry and longitudinal child boundary (LOCKED)

The common acquisition path assumes the invited family may have no My-Chat account and no existing child profile. The Institution may prepare onboarding without claiming ownership of the longitudinal child record:

1. An Institution Admin creates a minimal `NurtureInstitutionRosterEntry` inside one exact Institution/CareGroup. The workbench may prepare/correct the entry before readiness; sending an Enrollment Invitation still requires the C-1 active-topology, Lead, policy, and Pilot gates.
2. The RosterEntry contains only an institution-local display label, optional age-band/birth prefill with institution provenance, local lifecycle/version/audit, and an optional opaque My-Chat invitation correlation. Raw contact/auth data remains My-Chat-owned.
3. The RosterEntry is not a canonical child, child care process, family, Guardian relation, Enrollment, Grant, thread, Message, Receipt, care fact, global identity, or cross-institution matching key. The entry grants no protected read/write authority and cannot feed teacher operational work by itself.
4. My-Chat invitation acceptance authenticates the exact invited adult as a prospective Guardian. If no profile exists, the adult explicitly confirms or edits the minimum profile and one family-authorized transaction atomically creates `NurtureChild`, `NurtureChildCareProcess`, `NurtureFamily`, and the first confirmed Guardian relationship. If a profile exists, only a current Guardian may select a Nurture owner-resolved same-workspace candidate. C-2b will lock the exact initial/Co-Guardian invitation and authority mechanics.
5. Institution prefill is never verified identity. Global/fuzzy matching by name, birth date, contact, or institution input; raw-id child selection; automatic cross-workspace linking; and Institution auto-creation of a longitudinal profile are forbidden.
6. New-profile creation cannot leave an authority-free child/family aggregate, but the initial Guardian relationship still does not imply Enrollment or data sharing. Existing-profile selection creates no new Guardian authority. Roster-to-child linkage is written only with Guardian-confirmed Enrollment or exact replay, and Enrollment never implies Grant.
7. If the invitation is ignored, declined, expired, revoked, addressed to another actor/workspace, or never completed, only the institution-local roster/invitation audit may remain. No invitation-derived Participant/Guardian role, child process, Family, Enrollment, Grant, family-care thread, Message, Receipt, or care fact becomes active.
8. All three Pilot families must complete authenticated signup and minimum child/process confirmation before J1-J4. Institution-only full child operations for non-participating families are outside Pilot-0 and require a separate authority/privacy/retention design; a RosterEntry cannot be silently promoted into that feature.

C-2a locks a design contract only. `NurtureInstitutionRosterEntry` does not yet exist in Prisma, migrations, repositories, routes, presenters, or My-Chat invitation IIB. Exact fields, commands, transaction ordering, and cross-workspace portability remain implementation/C-2b-f work and require later approval.

C-2a evidence must cover RosterEntry create/correct idempotency and versioning; wrong Admin/Institution/Group; send-before-readiness; no raw contact leakage; unverified prefill display and Guardian edit; same-workspace authorized selection; atomic new profile/initial-Guardian creation and rollback; candidate-selection-without-roster-link; global/fuzzy/raw-id/cross-workspace denial; ignored/declined/expired/revoked/wrong-recipient invitation; zero protected-work side effects before explicit confirmation; separate Enrollment and Grant transitions; and retained institution-local audit without a canonical child claim.

#### C-2b-1 — first-Guardian establishment (LOCKED)

Institution onboarding identifies an intended enrollment recipient but does not establish the family relationship:

1. My-Chat authenticates the exact recipient bound to a current Enrollment Invitation. Invitation issue/acceptance, account ownership, workspace membership, and Institution intent are entry evidence only; none is a Guardian role or legal-family proof.
2. The invited adult acts as a prospective Guardian and strongly confirms the relationship declaration, edited minimum child profile, longitudinal-profile/privacy meaning, and the consequence that future current Guardians may see family-visible facts.
3. A single Nurture `CommandExecution` transaction binds or reuses the workspace `NurtureParticipant` and creates the new `NurtureChild`, `NurtureChildCareProcess`, `NurtureFamily`, first active Guardian RoleAssignment, and audit/result refs. Any failure rolls back the whole effect. Exact replay returns the original refs; changed profile/relationship payload conflicts.
4. A new child/family aggregate cannot exist without its first current Guardian. Conversely, the first Guardian relationship does not create Enrollment or Grant, link the RosterEntry, or expose protected institution/family workflow content.
5. An existing child process may be selected only when Nurture owner resolution proves the authenticated participant already has a current same-workspace Guardian role. A non-Guardian recipient cannot claim an existing record using Institution prefill, name/birth/contact matching, raw ids, or invitation status; the adult must first complete C-2b-2 through a current Guardian.
6. The model has no `primary_guardian`. The first Guardian is merely the first established relationship and receives no permanent hierarchy or implicit Grant ownership. `father`, `mother`, and `other_guardian` are family-confirmed relationship/display metadata only and cannot change permission.
7. Pilot execution uses the C-2b-1 path once for each of the three families. Family-1 then adds one second Guardian through C-2b-2; Family-2 and Family-3 remain single-Guardian families.
8. Strong confirmation produces product assertion and audit evidence only. Pilot-0 does not claim legal Guardian verification. Identity-document capture, civil-status evidence, Institution attestation, or offline adjudication requires a separately authorized sensitive-data feature before any production reliance.

C-2b-1 evidence must cover exact response-loss replay and payload drift; rollback at every Participant/Child/Process/Family/Role/Execution boundary; Participant reuse and duplicate-role uniqueness; unauthenticated/wrong-recipient/workspace/expired/revoked invitation; omitted or stale confirmation; Institution direct assertion and uninvited self-claim denial; existing-child non-Guardian denial; current-Guardian selection; relationship-label permission equality; absence of `primary_guardian`; no implicit Roster link/Enrollment/Grant/content access; and UI/audit wording that never claims legal verification.

#### C-2b-2 — Co-Guardian Invitation issue and acceptance (LOCKED)

Co-Guardian Invitation extends an existing family relationship without introducing a primary-Guardian hierarchy:

1. Any current Guardian for the exact Family/ChildCareProcess may initiate under current policy. Institution Admin, Caregiver, and Technical Operator cannot initiate, choose a substitute recipient, accept on another adult's behalf, or gain family authority from the workflow.
2. My-Chat owns raw recipient contact, delivery provider state, authentication, exact-recipient Host acceptance, and workspace membership. Nurture owns the sole business invitation intent bound to inviter, Family, ChildCareProcess, suggested relationship metadata, expiry/version/canonical payload hash, lifecycle/audit, and an opaque Host invitation ref. Host acceptance proves recipient identity/membership only and cannot override Nurture cancel/revoke/expiry/policy denial. The intent is design-only and not yet in Prisma.
3. Issue creates no recipient Participant, Guardian role, family-history access, Grant ownership, Enrollment, roster link, or child/family aggregate. The recipient must confirm or edit the suggested relationship label; label choice never changes Guardian permission.
4. Acceptance rechecks the inviter's current Guardian authority, Family/ChildCareProcess lifecycle, invitation state/expiry/version, exact recipient/workspace, existing active role, current policy, and the Pilot cohort gate. Stale authority or topology fails before a role write.
5. One Nurture `CommandExecution` transaction binds or reuses the recipient Participant, creates the second active Guardian RoleAssignment, consumes the invitation, and stores result/audit refs. Exact response-loss replay returns original refs; family/process/recipient/label/payload drift conflicts.
6. The exact inviter may cancel a pending Nurture intent. Inviter role loss or family/process disablement makes later acceptance unusable. Host/provider cancellation is delivery bookkeeping rather than family authority. Cancellation after committed acceptance cannot revoke the Guardian role; C-2b-4 owns relationship exit/revoke.
7. Invitation acceptance does not transfer Grant ownership, create Enrollment/Grant, create another child profile, or decide retrospective history rights. C-2b-3 owns the accepted Guardian's action and history matrix.
8. Pilot policy allows exactly one Co-Guardian acceptance for Family-1 and none for Family-2/Family-3, yielding the accepted `2 + 1 + 1` topology. The cohort gate is not a unique constraint, Schema cardinality, or product limit; the reusable model may support more Guardians after a separate product-policy decision.

C-2b-2 evidence must cover any-current-Guardian issue and no-primary behavior; exact/different-payload issue replay; wrong family/process/workspace/recipient; Institution/Caregiver/Operator denial; zero raw contact in Nurture; no pre-accept Participant/role/history/Grant effects; inviter revoke; expiry/revoke/consume; stale Host accepted/provider state against Nurture denial; cancel/accept race; exact-recipient acceptance; Participant reuse; duplicate-role and transaction rollback; response-loss replay; no implicit Enrollment/Grant/new child; exact Family-1 two-Guardian and Family-2/3 one-Guardian topology; and proof that no global two-Guardian constraint was added.

#### C-2b-3 — current Guardian rights and historical visibility (LOCKED)

Co-Guardian acceptance establishes equal current family membership without collapsing actor-specific or consent-specific ownership:

1. The first and second current Guardians receive the same base family role permissions. Join order and `father|mother|other_guardian` relationship/display metadata create no hierarchy.
2. Before the second RoleAssignment transaction commits, the recipient has no family profile, history, action, or existence access. After commit, current owner queries may return eligible committed family facts created before or after acceptance.
3. Historical access is current-state authorization, not a snapshot grant. Every query rechecks current Family/Guardian role, applicable Enrollment, original Grant for cross-role bodies, redaction, retention, and policy. No per-Guardian Message/Receipt/history copies are created.
4. Both current Guardians may read safe child/family profile context, read currently authorized family timeline/Message/Receipt/caregiver-reply facts, and submit a new eligible family-care question under the active Grant.
5. Authorship remains exact. A Guardian may redact only their own Message and cannot edit, redact, or assume authorship of another Guardian's content.
6. Grant administration remains exact-owner authority. Co-Guardian acceptance does not change `grantedByParticipantId`; the second Guardian cannot replace/revoke the existing Grant or inherit/restore that Grant merely through family membership. C-2e will govern creation of any later separately confirmed Grant.
7. Family-originated committed facts may remain family-side readable under current same-family policy. Caregiver/institution-originated protected bodies remain cross-role facts and require the original current Grant; revoke/replacement/expiry yields the allowed unavailable/tombstone result even while both Guardian roles remain active.
8. Unsubmitted Chat/form/AI drafts, scenario tokens, and `NurtureInteractionContext` remain actor/surface-local. Acceptance does not copy drafts, restore expired context, create historical notifications, or replay old delivery.
9. Acceptance cannot revive redacted/revoked/expired facts, transfer authorship, expose another family/child or institution-internal content, or create general child-profile edit authority.
10. C-2b-4 owns current access loss and any retained author/audit visibility after a Guardian relationship exits or is revoked.

C-2b-3 evidence must cover no pre-accept existence/history leak; post-accept equal role resolution; eligible pre-join history; original-Grant caregiver reply visibility; Grant revoke/replacement/expiry after join; family-source and caregiver-reply redaction; exact-author redaction denial for the other Guardian; Grant-owner versus Co-Guardian administration; equal join-order/relationship-label permission; cross-family/child/institution denial; no draft/token/context sharing; no Message/Receipt/history duplication; no historical notification backfill; and no arbitrary profile editing.

#### C-2b-4 — accepted Guardian relationship exit/revoke (LOCKED)

Accepted Guardian relationships use self-exit rather than peer or administrative removal:

1. A current Guardian may strongly confirm exit of their own exact Family/ChildCareProcess role. The original inviter and another current Guardian cannot revoke the accepted relationship; equal family membership creates no subordinate role.
2. Institution Admin, Caregiver, Technical Operator, service identity, raw id, and direct database mutation have no relationship-removal authority.
3. Self-exit requires current authenticated My-Chat identity/workspace, current Nurture Participant/Guardian role, exact target, expected role version, current policy, stable command identity, and explicit consequence text.
4. Exit fails before any write when the actor is the last current Guardian. Ordinary offboarding cannot leave an authority-free Child/Family; family closure, authority transfer, legal/custody dispute, and forced removal require later separate contracts.
5. When another current Guardian remains, one Nurture `CommandExecution` transaction changes the actor's RoleAssignment to terminal `revoked`, cancels pending Co-Guardian invitation intents issued by that actor, revokes active Grants owned by that actor, applies established Receipt/Item/Attention/protected-body cascades, and stores result/audit refs. Any failure rolls back the whole effect.
6. A Grant owned by another eligible current Guardian remains independently valid. Self-exit does not transfer, inherit, rewrite, or reassign Grant ownership.
7. After commit, the exiting participant immediately loses family profile/history/action/draft access, including author-side body access that requires a current same-family role. Participant, role/invitation history, authorship refs, Message/Receipt/Execution facts, and audit shells remain immutable; the remaining Guardian does not become author of old facts.
8. Stale Notification/deep-link opens and cached surfaces fail on owner reread. No device/provider/read state can preserve business access.
9. My-Chat account disablement or workspace-membership loss blocks access but does not silently mutate the Nurture role or Grants. Restoring Host membership cannot reactivate a terminal RoleAssignment.
10. Rejoin requires a new current-Guardian-issued invitation and a new RoleAssignment. Old role/Grant identities never reactivate; any later Grant requires separate confirmation.
11. The Pilot runs Family-1 second-Guardian self-exit only after all required two-Guardian representative journeys. Thus `2 + 1 + 1` remains the main journey topology, while the final offboarding probe validates access loss without defining a Schema cardinality.
12. Forced removal, identity/custody dispute, legal evidence, or safety adjudication is excluded from Pilot and cannot be converted into Technical Admin or Institution direct-edit authority.

C-2b-4 evidence must cover exact replay/payload drift; last-Guardian denial; self versus peer/original-inviter/Institution/Caregiver/Operator/service/raw-id removal; stale version and concurrent action/exit; actor-owned versus other-owned Grants; complete atomic cascades beyond current batch limits; rollback; immediate own/history/draft/action denial; stale notification/deep link; retained authorship/audit without reassignment; Host loss/restore; new-invitation rejoin with terminal old role/Grant; main-journey-before-exit ordering; and absence of forced-dispute/direct-DB alternatives.

#### C-2c-1 — Institution Enrollment Invitation issue and binding (LOCKED)

Institution Enrollment Invitation prepares one family onboarding opportunity without creating family or enrollment authority:

1. Only a current Institution Admin for the exact Institution may issue from the Institution workbench. Institution board, Caregiver, Guardian, Technical Operator, service identity, and client-authored role/scope/ids cannot issue.
2. Issue rechecks active Institution/CareGroup, current exact-group Lead Caregiver, completed required policy, workspace/capability/Pilot gates, current unlinked RosterEntry, and absence of another effective pending Enrollment Invitation for that entry.
3. The versioned Nurture business intent binds workspace, Institution, CareGroup, `NurtureInstitutionRosterEntry`, issuing Admin, opaque exact-recipient Host invitation binding, required expiry, version, canonical payload hash, lifecycle/audit, and opaque Host invitation ref. The intent is design-only and not yet in Prisma.
4. My-Chat owns raw recipient contact, provider delivery, authentication, workspace membership, and exact-recipient Host acceptance. Nurture intent state is the sole business-continuation fence; Host delivered/accepted/provider state cannot bypass Nurture cancellation, expiry, readiness, lifecycle, or policy denial.
5. At most one effective pending Enrollment Invitation intent exists per RosterEntry. Reissue or recipient correction must first terminalize the old intent under C-2c-3; overlapping pending intents are forbidden.
6. Issue creates no recipient Participant/Guardian role, Child/ChildCareProcess/Family, Enrollment, Grant, RosterEntry-to-child link, family thread, Message/Receipt, or teacher-visible child fact.
7. Recipient display contains only allowlisted Institution name, CareGroup name, institution-local child label, invitation purpose, expiry, and privacy/confirmation explanation. Institution-provided name/age/birth prefill remains explicitly unverified and is not promoted into the longitudinal profile.
8. Exact issue replay returns the original intent/ref. Institution, CareGroup, RosterEntry, recipient binding, expiry, or canonical payload drift conflicts rather than producing another intent.
9. Pilot creates three distinct Enrollment Invitation intents for the three RosterEntries. Family-1 later uses a separate Co-Guardian Invitation for the second Guardian; invitation types, ids, replay keys, and policy paths cannot be reused across kinds.
10. C-2c-1 requires explicit `expiresAt`; C-2c-3 will lock the numeric Pilot duration and cancel/reissue/concurrency lifecycle.

C-2c-1 evidence must cover exact replay and every payload-drift dimension; concurrent duplicate issue and one-pending uniqueness; wrong Institution/Admin/Group/workspace/recipient/RosterEntry; linked/stale RosterEntry; missing Lead/policy/readiness/gate; raw-contact/provider/auth persistence and log probes; stale Host accepted state against Nurture denial; safe display/unverified provenance; zero Participant/role/child/family/Enrollment/Grant/link/thread/message/teacher effects; three exact Pilot intents; and cross-kind Co-Guardian confusion denial.

#### C-2c-2 — recipient acceptance and new/existing child branch (LOCKED)

Host acceptance establishes exact recipient identity but leaves child authority and Enrollment under Nurture control:

1. The exact recipient authenticates and accepts through My-Chat. Nurture then rechecks current invitation intent, recipient/workspace, Institution/CareGroup readiness, RosterEntry unlinked state, Pilot gates, and policy. Host acceptance alone neither consumes the Nurture intent nor selects/creates a child.
2. When the participant has current same-workspace Guardian authority for one or more ChildCareProcesses, Nurture owner resolution returns safe candidates. The Guardian must explicitly select a Nurture-issued opaque option even when only one candidate exists; raw ids and Host/Institution-selected child values are forbidden.
3. Multiple eligible candidates require explicit clarification. Zero eligible candidates enters the new-profile path; no candidate count or forbidden object is leaked beyond safe branch output.
4. A recipient without an eligible Guardian relationship uses the locked C-2b-1 command to bind/reuse Participant and atomically create Child, ChildCareProcess, Family, first Guardian role, and audit refs. New-profile command identity/replay is separate from Enrollment confirmation.
5. A non-Guardian who knows another current profile exists cannot claim that profile through the Enrollment Invitation. A current Guardian must first issue Co-Guardian Invitation; Nurture performs no global/fuzzy name/birth/contact matching, automatic merge, or raw-id link.
6. Institution prefill remains unverified and may assist display/editing only; prefill cannot auto-select, auto-create canonical values without Guardian confirmation, or establish a RosterEntry link.
7. Existing-child choice is stored only in a short-lived `NurtureInteractionContext` bound to invitation/participant/purpose/surface/expiry and opaque candidate refs. Context expiry/revoke/state drift requires fresh owner resolution and selection.
8. Before C-2d Enrollment commit, neither branch writes RosterEntry-to-child link, Enrollment, Grant, family thread, teacher-visible child fact, or invitation consumption. Selection is not durable Institution linkage.
9. If a newly created family profile is followed by abandonment, invitation cancel, or expiry, the independently confirmed family profile and first Guardian relationship remain. No Institution relationship exists, and a later attempt re-resolves current facts.
10. The Nurture Enrollment Invitation intent stays pending and resumable by the same exact recipient until C-2d consumes the intent or C-2c-3 terminalizes the intent. Host acceptance never substitutes for that lifecycle.
11. All three Pilot first Guardians use the new-profile branch. Existing-profile choice is mandatory boundary evidence using an already authorized synthetic process and does not add a fourth child/family or satisfy final Enrollment evidence.

C-2c-2 evidence must cover wrong recipient/workspace and stale intent/readiness; Host acceptance without business consumption; zero/one/multiple owner-resolved candidate branches; mandatory single-candidate confirmation; opaque option exact use/replay/drift; raw-id/Host/Institution/fuzzy/global selection denial; existing-profile non-Guardian denial and Co-Guardian redirect; independent new-profile replay/response loss; abandonment/cancel/expiry after profile creation; InteractionContext expiry/revoke/drift; no pre-C-2d link/Enrollment/Grant/thread/teacher effect; three new-profile Pilot paths; and existing-profile coverage without cohort growth.

#### C-2c-3 — expiry, cancel, reissue, and concurrency (LOCKED)

Enrollment Invitation authority is bounded by Nurture time/state rather than provider delivery:

1. Stored lifecycle is `pending|consumed|cancelled|superseded`. `expired` is derived on every read/action when `now >= expiresAt`; authority never depends on an expiry worker updating the row.
2. Pilot expiry is exactly 7×24 hours from issue. No in-place extension exists; reissue creates a new intent and a new seven-day window.
3. Any current Institution Admin for the exact Institution may cancel a pending intent. The exact recipient may decline. Both write terminal `cancelled` with distinct allowlisted reason, actor, version, and time; neither action deletes the intent.
4. Recipient/CareGroup/RosterEntry/expiry/payload correction uses reissue. The old pending intent becomes `superseded`, and a new invitation/request/Host ref/expiry/hash is created with immutable supersede lineage. Old intent/Host acceptance never reactivates.
5. My-Chat provider retry or resend of the same Host invitation is a technical delivery retry on the original intent. Business reissue is a new Nurture identity and cannot reuse old acceptance or replay keys.
6. Institution/CareGroup/Lead/policy/Pilot readiness loss derives a current blocked result without inventing a persisted blocked state. If readiness returns before expiry and the intent remains pending, the exact recipient may continue after full revalidation.
7. Cancel, recipient decline, expiry, supersede, or binding drift makes related `NurtureInteractionContext` unusable. Independently confirmed family profile/Guardian facts remain without Institution linkage.
8. Every transition requires expected version and stable command identity. Cancel/decline versus C-2d consume, supersede versus acceptance/context use, concurrent reissue, and duplicate issue use first-commit-wins; losing stale operations cannot reopen or overwrite the winner.
9. Only the C-2d transaction that commits the exact Enrollment may move the exact current pending intent to `consumed`. Host acceptance, child selection, new-profile creation, provider delivery, and context use cannot consume.
10. Terminal intents, opaque Host refs, CommandExecutions, actor/reason/time, and supersede chain remain immutable audit. No terminal intent returns to pending or is physically deleted by the business flow.
11. Pilot executes the three ordinary invitations plus one cancel/reissue race and one expiry/stale-open probe using the same three-family cohort.

C-2c-3 evidence must cover the 168-hour boundary before/at/after expiry and no-sweeper denial; current Admin cancel versus exact-recipient decline; wrong actor/scope and stale version; exact replay/payload drift; immutable reissue identity/lineage; provider retry versus business reissue; readiness block/recovery; context invalidation; family-profile preservation without Institution link; cancel/decline versus consume; supersede versus accept/context; concurrent reissue/issue uniqueness; C-2d-only consumed; stale Host/client/provider denial; retained terminal audit; and no cohort growth.

#### C-2c-4 — confirmation-ready result and continuation (LOCKED)

Invitation preparation ends at a safe, revalidated confirmation boundary rather than a premature Enrollment:

1. After the exact recipient completes C-2c-2 child selection or creation, Nurture returns typed result `ready_for_enrollment_confirmation`. Nurture never presents the child as enrolled.
2. Display is limited to Institution, CareGroup, Guardian-confirmed child display, invitation expiry, privacy consequence, and explicit text that Enrollment does not create a Grant. Raw ids, Host bindings, unverified institution prefill, and policy internals are absent.
3. Nurture issues a `submit_action` `NurtureInteractionContext` bound to the exact invitation, participant, selected or newly created ChildCareProcess, Institution/CareGroup/RosterEntry, `confirm_family_enrollment`, source surface, expected versions, and canonical action hash. Clients cannot author or replace target refs.
4. Effective expiry is the earlier of the existing five-minute submit-context TTL and invitation expiry. The context cannot extend the invitation; expiry, consumption, revoke, or binding/version drift requires fresh C-2c-2 resolution.
5. Existing-child choice exists only in the bounded context. A newly created Child/Process/Family/Guardian remains a durable family fact, but neither path creates a canonical RosterEntry-child association before C-2d.
6. Guardian Chat, family board, and family workbench all reach the same `confirm_family_enrollment` action. Unsubmitted state/context does not transfer across surface, device, account, or Guardian.
7. Every render and submit reloads pending/not-expired invitation, exact recipient/current Guardian, unlinked RosterEntry, active Institution/CareGroup/current Lead/completed policy/Pilot gates, absence of conflicting Enrollment, and expected versions.
8. C-2c-4 creates no Enrollment, RosterEntry-child link, Grant, family thread, teacher-visible child fact, notification, Workflow Handoff, or invitation consumption. C-2d strong confirmation is the sole allowed commit boundary.
9. Repeated result resolution is deterministic and side-effect free. A terminal invitation, readiness loss, stale context, or cached confirmation returns only safe unavailable/refresh guidance and cannot proceed.
10. Committed result continuity follows current owner reread; no Host transcript or client cache becomes an authorization or reconstructs an unfinished confirmation.

C-2c-4 evidence must cover presenter allowlist/wording; no raw or unverified fields; exact context bindings and five-minute/invitation-expiry minimum; all three Guardian surfaces converging on one action; wrong surface/device/account/participant/workspace/action reuse; render/submit current revalidation; context consume/revoke/expiry/version drift; cancel/decline/expire/supersede/readiness loss; deterministic replay; no cross-surface draft transfer; and zero Enrollment/link/Grant/thread/teacher/notification/Handoff/consumption effects before C-2d.

#### C-2d-1 — strong confirmation and atomic Enrollment core (LOCKED)

Enrollment confirmation is one Guardian-authorized Nurture command, not a chain of independently recoverable writes:

1. Only the exact Enrollment Invitation recipient may submit, and the participant must still hold a current Guardian role for the resolved ChildCareProcess/Family. Another Guardian, Institution Admin, Caregiver, Operator, service identity, or copied client state cannot consume the invitation.
2. Strong confirmation shows the Guardian-confirmed child, Institution, CareGroup, roster association consequence, and explicit statement that Enrollment creates no Grant. The client returns only the opaque current `submit_action` context plus explicit confirmation; raw ids, role, scope, status, and target refs are not accepted.
3. Before the first write, Nurture reloads the invitation as exact pending/not expired, recipient/Participant/Guardian, ChildCareProcess/Family, RosterEntry as current/unlinked, Institution/CareGroup/current Lead/completed policy/Pilot gates, absence of conflicting Enrollment, context state/expiry/bindings, and all expected versions.
4. One Nurture transaction consumes the submit InteractionContext, creates or resolves the stable CommandExecution, creates the exact Enrollment, writes the RosterEntry-to-ChildCareProcess link, moves the exact invitation to consumed with Enrollment correlation/time, and records immutable audit/result refs.
5. Any failure rolls back every effect. No partial Enrollment, roster link, consumed invitation/context, successful Execution, or success audit may survive. Exact committed replay and response loss return the same Execution and business refs; changed context/payload/hash conflicts.
6. First-write preconditions and database constraints are both required. Concurrent cancel/decline/supersede, another confirmation, roster linkage, readiness loss, role loss, or Enrollment conflict uses first-commit-wins and cannot overwrite the winner.
7. Enrollment confirmation creates no `NurtureChildLinkGrant` and grants no teacher access to family content. Grant remains the separate C-2e confirmation.
8. C-2d-1 intentionally does not choose initial Enrollment status or `joinedAt`, effective uniqueness, pause/end/withdraw semantics, thread creation timing, or result/Handoff behavior. C-2d-2, C-2d-3, and C-2d-4 own those decisions.

C-2d-1 evidence must cover exact recipient/current Guardian and every wrong actor/scope; strong-confirmation display/input allowlists; all current preconditions; fault injection after each transactional write; exact replay/response loss; payload/context/hash drift; cancel/decline/supersede/role/readiness/roster/Enrollment races; no partial facts; no duplicate effect; and zero implicit Grant or teacher family-content access. Lifecycle, thread, and presenter/Handoff assertions remain deferred to their named checkpoints.

#### C-2d-2 — Enrollment lifecycle, duplicate, and concurrency (LOCKED)

Pilot Enrollment has one immediate, deterministic creation shape and no implicit transfer semantics:

1. Successful confirmation creates `status=active`; `joinedAt` is the authoritative database transaction timestamp generated inside the same atomic transaction. Client, Host, or Institution status/time, backdating, future scheduling, and in-place time changes are rejected.
2. Pilot creates no `pending` Enrollment. Any pre-existing `pending`, `active`, or `paused` Enrollment counts as current-conflicting for the same workspace, ChildCareProcess, and Institution across every CareGroup.
3. One ChildCareProcess may have independent current Enrollments at different Institutions. Each Institution/CareGroup/roster/policy and later Grant stays separately scoped; one Institution never inherits another's authority.
4. A same-Institution current Enrollment in another CareGroup blocks confirmation with `enrollment_conflict`. The command does not auto-end, move, replace, or relink the earlier Enrollment; C-2f owns transfer.
5. Exact stable-command replay returns the original Execution/Enrollment/consumed-invitation result. A new command targeting an already-current same Institution/CareGroup returns safe `already_enrolled` and creates no effect.
6. Different-group conflict, occupied RosterEntry, or competing invitation leaves the loser unconsumed and unlinked. The losing submit context cannot commit consumed/success, and no partial Enrollment, Execution success, or audit success survives.
7. Database uniqueness, expected versions, and first-commit-wins govern concurrent invitation, confirmation, and roster-link writes. A stale loser cannot overwrite, merge, or reinterpret the winner.
8. `paused` remains current for uniqueness. `ended` and `withdrawn` are terminal and cannot reactivate. A later return requires a new RosterEntry, Enrollment Invitation, and Enrollment identity.
9. `deleted` is not an available Pilot transition and cannot bypass terminal history, uniqueness, or audit. Pilot never physically deletes an Enrollment through the onboarding flow.
10. C-2d-2 does not grant pause/resume/end/withdraw/transfer authority; those actors and commands remain C-2f. Thread timing remains C-2d-3 and result/Handoff remains C-2d-4.

C-2d-2 evidence must cover database-time active creation; every status/time injection; pending/active/paused uniqueness; same-group new command versus exact replay; same-Institution different-group conflict; cross-Institution coexistence with strict access/Grant separation; occupied-roster and competing-invitation races; first-commit-wins and no partial loser effects; terminal non-reactivation/new identities; deleted-state denial; and no premature C-2f/thread/Handoff authority.

#### C-2d-3 — private Thread creation timing and authority (LOCKED)

Enrollment establishes a care relationship, while Grant separately activates protected family-care communication:

1. C-2d Enrollment confirmation creates no `NurtureFamilyCareThread` or ThreadParticipant. No empty/pending Thread shell exists between Enrollment and Grant.
2. After Enrollment, current exact-scope Institution Admin/Caregiver roster views may expose only care-group membership, a Guardian-confirmed safe child label, Enrollment status, and `joinedAt`. Family/Guardian/contact/profile details, Grant/thread/message existence, protected bodies, and facts from another Institution remain hidden.
3. The first C-2e transaction that creates the exact active Grant also creates the one `active`, `enrollment_private` Thread bound to the exact workspace, ChildCareProcess, Family, Enrollment, and CareGroup. Grant/Thread/Execution/audit/result refs commit or roll back together.
4. One active enrollment-private Thread exists per workspace/ChildCareProcess/Family/Enrollment. Different Institution Enrollment creates a distinct Thread only after that Enrollment's own first Grant.
5. Exact Grant replay and Grant replacement reuse the existing Thread id. No history is copied, split, or merged, and a first Message cannot lazily create a missing Thread.
6. Thread and ThreadParticipant rows are routing/projection facts, not permission. Every read/write rechecks current participant/role, exact Enrollment/CareGroup, original/current Grant, thread/source lifecycle, policy, and redaction.
7. Grant revoke or expiry retains the Thread/audit identity but immediately blocks now-ineligible bodies/actions. Replacement or a later Grant cannot revive content invalidated under the terminal original Grant.
8. Ended/withdrawn Enrollment does not migrate or reuse its Thread. Re-entry creates a new Enrollment-scoped Thread only with the new first active Grant; C-2f owns close/archive actors and transition timing.
9. Notification, My-Chat conversation state, cached Thread membership, provider state, and raw Thread/participant ids cannot create or preserve communication authority.
10. Pilot rejects a Grant-only row, Thread-only row, duplicate Thread, missing-Thread first Message, cross-Institution Thread reuse, and all stale owner-projection paths.

C-2d-3 evidence must cover zero Thread at Enrollment; safe roster allowlist and negative fields before Grant; first-Grant atomic Grant/Thread/Execution/audit creation with fault injection; active uniqueness; cross-Institution separation; replay/replacement reuse; no lazy first-Message creation; Thread/participant non-authority; revoke/expiry and original-Grant fences; terminal Enrollment/re-entry separation; stale/raw/provider/notification denial; and no premature C-2d-4 Handoff behavior.

#### C-2d-4 — Enrollment result, recovery, and explicit-empty Handoff (LOCKED)

Enrollment success is a committed Nurture fact whose recovery never depends on presentation or delivery:

1. Successful confirmation returns typed `enrollment_confirmed`; CommandExecution stores stable Enrollment, RosterEntry, and consumed-invitation refs rather than cached authorization/display state.
2. Presenter output is limited to Guardian-confirmed safe child label, Institution, CareGroup, current Enrollment status, `joinedAt`, and explicit no-Grant/no-private-communication guidance. Raw ids, Host/invitation refs, family/contact/profile fields, Thread/Grant refs or internal lifecycle fields, and protected content are absent.
3. `review_family_care_grant` is only a generic route affordance, not a new domain action, command alias, token, or authorization. The destination reruns owner resolution before exposing the already locked `confirm_child_link_grant` action.
4. Exact stable-command replay and response loss return the original Execution/Enrollment refs and never create a second effect. Each render reloads current Enrollment/owner state, so a later lifecycle or authority change replaces stale success copy with current safe state.
5. Once the invitation is consumed, crossing its former `expiresAt` cannot undo Enrollment or misclassify the committed result as failed. The exact recipient may recover current state only while still authorized; wrong/stale actors receive unavailable/tombstone without existence leakage.
6. Presenter, client, provider, or network failure after commit does not compensate, delete, reopen, or duplicate Enrollment, roster linkage, invitation, or context. Pre-commit failure retains the C-2d-1 all-or-nothing rollback.
7. Pilot `confirm_family_enrollment` stores schema-valid `handoffRequestSnapshotsPayload=[]`. The command creates no activation seed, Handoff, Outbox event, notification, or deep link and requires no durable claimed-Step driver.
8. Institution board/workbench sees the committed roster update only through current owner reread. Provider/device/read state cannot hide or establish Enrollment success.
9. Future Enrollment-success notification must use a separate versioned refs-only action/Handoff with durable claimed-Step provenance and separate acceptance. Delivery outcome never changes Enrollment state.
10. No Host transcript, cached result, consumed invitation, route affordance, or technical recovery becomes business authorization or a second Enrollment source of truth.

C-2d-4 evidence must cover presenter allowlist and negative fields; route-versus-command separation; exact replay/response loss with current owner reread; later lifecycle/authority drift; consumed invitation before/at/after old expiry; wrong actor/workspace no-leak denial; post-commit presentation/provider faults without compensation; pre-commit rollback; exact empty snapshot schema; zero activation/Handoff/Outbox/notification/deep-link rows; Institution owner-reread visibility; and rejection of implicit future notification behavior.

#### C-2e-0 — ThreadParticipant authority boundary (LOCKED)

Grant-gated communication has one current owner-reread authorization path; stored thread membership cannot become a second permission ledger:

1. Every presenter/read/write revalidates current My-Chat identity/workspace membership, Nurture Participant/RoleAssignment and exact family/child/work scope, current Enrollment/CareGroup, exact current or original Grant, exact Thread and source lifecycle, current policy, and redaction.
2. `NurtureFamilyCareThread` is the required business aggregate and routing container. A missing, mismatched, inactive, terminal, or cross-Institution Thread blocks the operation through object lifecycle/scope validation; Thread status is not actor membership authority.
3. `NurtureFamilyCareThreadParticipant` is optional routing, read-cursor, subscription, and display-preference projection only. Its absence cannot deny an otherwise current Guardian or Caregiver.
4. An active, stale, forged, raw-id-selected, cached, wrong-role, wrong-scope, or cross-Institution ThreadParticipant row cannot grant or preserve authority. Hidden/inactive projection may affect list presentation but cannot change business eligibility.
5. The first active-Grant transaction need not create Guardian or Caregiver participant rows. Projection creation/update may occur only after the current owner path authorizes the actor and cannot become an authorization cache, mandatory fan-out, or retry prerequisite.
6. Guardian/Co-Guardian acceptance, Caregiver assignment/change, role suspension/revoke/expiry, Grant revoke/expiry/replacement, Enrollment/CareGroup change, and policy/redaction changes do not depend on participant-row synchronization for safety. The next owner reread enforces the authoritative facts immediately.
7. Current Guardian and Caregiver command preconditions that require `thread_membership_active` conflict with the C-2e-0 authority boundary and must be repaired before Pilot traffic. The implementation may retain projection fields additively but must remove stored membership as a hard allow/deny predicate.
8. C-2e-0 changes no first-Grant actor, confirmation copy/context, Grant ownership, atomic Grant/Thread identity, expiry/replacement/revoke, result/Handoff, or C-2f lifecycle decision. The C-2e-1 contract owns Grant review and confirming-Guardian authority.

C-2e-0 evidence must cover valid Guardian and Caregiver access with an exact active Thread and no participant row; stale active row after every role/Grant/Enrollment/CareGroup/policy/redaction denial; forged/wrong-scope/cross-Institution row; hidden/inactive projection without business-permission drift; missing/mismatched/terminal Thread denial; no participant fan-out dependency in first-Grant fault/replay tests; and removal of `thread_membership_active` as a hard command predicate without weakening current owner reread.

#### C-2e-1 — Grant review and confirming-Guardian authority (LOCKED)

Grant confirmation is a separate family authorization, not an extension of Enrollment confirmation or a hidden primary-Guardian role:

1. Any current My-Chat-authenticated Guardian whose Nurture role reaches the exact Family/ChildCareProcess may review and first-confirm. Enrollment invitation recipient, Enrollment confirmer, Guardian join order, and `father|mother|other_guardian` display metadata do not change eligibility.
2. The first committed confirmer becomes exact `grantedByParticipantId` and the sole replace/revoke owner. Another current same-family Guardian may inspect/use the active Grant and currently authorized family facts but cannot co-own, replace, revoke, transfer, inherit, or restore owner authority.
3. The authorization is a Pilot product data-flow confirmation, not legal-guardian verification, legal consent adjudication, or joint-custody resolution. Forced dispute/joint-consent policy remains outside Pilot and cannot become Institution/Operator authority.
4. Product-level strong confirmation requires the current authenticated Host session, a fresh Nurture owner resolution, and an explicit generic `authorization_gate` action such as “确认授权并开启家园问题沟通”. Natural-language agreement, LLM intent classification, navigation, preview, detail open, default-selected control, or prior Enrollment confirmation cannot execute `confirm_child_link_grant`. Pilot adds no password, OTP, biometric, or signature requirement beyond separately applicable Host session policy.
5. Guardian Chat, family board, and family workbench converge on the same `confirm_child_link_grant -> nurture.family_care.confirm_grant` action/command. Layout may differ, but each final confirmation discloses the same mandatory consequence set.

The mandatory review contract is:

| Review field | Safe required meaning |
| --- | --- |
| Child | Guardian-confirmed safe child label. |
| Destination | Current Institution and exact CareGroup. |
| Purpose/scope | Current child only; family-care question workflow only. |
| `family_to_org` | Current same-family Guardians may submit a question into the exact care-group workflow. |
| `org_to_family` | One current exact-group Caregiver may provide one caregiver-confirmed reply causally linked to that question; no institution-initiated conversation. |
| Current users | Current same-family Guardians may use current authorization; Caregivers act only through current item workflow and exact scope/policy. |
| Duration | Starts only after successful commit; expires no later than 30 days or the exact Pilot allowlist expiry. |
| Owner | The confirming Guardian becomes sole replace/revoke owner; other Guardians receive no management authority. |
| Owner loss | Guardian-eligibility loss stops the Grant and never transfers owner automatically. |
| Revoke/retention | Revoke stops eligible new/cross-role use, does not hard-delete audit facts, and a later Grant cannot revive old Item/content authority. |
| Exclusions | No direct family-caregiver Chat, broadcast, institution-wide access, media, daily care, health/emergency use, clarification loop, attachment, or another data class. |

6. Safe user-facing terms may replace internal enum labels, but no surface may omit owner, scope, directions, duration, revoke/retention, or exclusion consequences. Raw participant/child/enrollment/care-group/grant ids, internal enum/policy/hash, client-defined target/profile/expiry, and Institution-unverified child data are forbidden.
7. After a complete review, Nurture issues one five-minute `submit_action` `NurtureInteractionContext` bound to exact workspace, Participant/Guardian RoleAssignment, Family/ChildCareProcess, current active Enrollment/Institution/CareGroup, `confirm_child_link_grant`, fixed Pilot profile/canonical hash, expected versions, and presenting surface. The client returns only opaque context plus explicit confirmation.
8. Context is continuation, not authority. Account/Guardian/surface/device copying, expiry, consume/revoke, role/Enrollment/CareGroup/policy/allowlist/version drift, changed prepared profile, or client field injection requires fresh owner resolution and review; no old context may move across surfaces.
9. Review and context issue create no Grant, Thread, CommandExecution, protected content, teacher visibility, Handoff, Outbox, notification, or deep link. Cancel/abandon/expiry leaves no Grant authorization or cross-role business effect.
10. If an exact active Grant exists at render, the surface displays current state instead of a new-create affordance. The owner receives current management navigation; another Guardian receives safe “可使用但不可替换/撤销” guidance. Exact replay returns the original result; a new or racing same-definition command may return `already_satisfied` but cannot change the first committed owner.
11. A revoked, expired, or replaced Grant never reactivates. With no current active Grant, a future eligible Guardian requires a fresh review/context/confirmation and new identity; no new Grant revives old Item/content. C-2e-2 owns atomic creation, database identity, transaction time, expiry terminalization, and first-commit-wins enforcement.

C-2e-1 evidence must cover both current Guardians as eligible first confirmer; Enrollment-recipient/join-order/relationship-label equality; every wrong actor/family/child/workspace and stale role; first-owner versus other-Guardian use/manage presentation; all three surfaces and every mandatory/forbidden field; explicit gate versus natural-language/LLM/navigation/default-control denial; five-minute exact context binding and every copy/expiry/revoke/drift/injection path; zero pre-submit business/technical effects; existing active owner/non-owner rendering; exact replay versus new/racing `already_satisfied` without owner transfer; terminal Grant fresh-review-only behavior; and no legal-consent, password/OTP, or premature C-2e-2 atomicity claim.

#### C-2e-2 — Atomic Grant/Thread creation, time, and concurrency (LOCKED)

Grant confirmation has one authoritative database transaction and one active business identity:

1. Active Grant identity is `(workspaceId, childCareProcessId, enrollmentId, grantedToScopeType, grantedToScopeId, canonical purposes)`. Pilot requires `care_group`, the exact current Enrollment CareGroup, and canonical singleton purposes `[family_care_workflow]`.
2. A raw PostgreSQL partial unique index enforces one row for the identity where `status='active' AND deleted_at IS NULL`. Server code canonicalizes array order, rejects duplicate/unknown values, and never relies on Prisma to express the partial predicate.
3. `directions=[family_to_org,org_to_family]`, the fixed question data class, and purposes form the stable business profile. Same-definition comparison excludes newly recomputed lifecycle timestamps. Changed directions/data classes/purposes or a deliberate expiry-policy change requires C-2e-4 replacement and returns `grant_replacement_required`; a derived per-attempt timestamp cannot manufacture a difference, overwrite an active row, or create an overlapping definition.
4. `grantedByParticipantId` gains a Restrict foreign key to the exact Nurture Participant. Migration preflight reports duplicate active identities and orphan owners and stops. Migration cannot auto-pick an owner, merge rows, delete history, or silently repair ambiguous state.
5. One Serializable Nurture transaction performs exact CommandExecution replay lookup; locks/reloads the submit context, actor/role/Family/process/Enrollment/Institution/CareGroup/allowlist/policy facts and expected versions; obtains database `transaction_timestamp()`; classifies all related Grant/Thread rows without `findFirst`; conditionally consumes context; creates the Grant; creates or reuses the Thread; and persists CommandExecution plus audit/result refs. No external provider or service call occurs inside the transaction.
6. An applied command atomically commits the consumed context, one new active Grant, one new or existing exact active Enrollment-private Thread, and `CommandExecution(applied)`. Any fault before transaction completion commits none of those facts.
7. Exact command replay returns the original Execution/result and never consumes another context or reruns business writes. A new or racing same-definition command consumes its own valid context and records `CommandExecution(already_satisfied)` referencing the winning Grant/Thread; owner and expiry remain unchanged.
8. `effectiveFrom` is database transaction time. `expiresAt=min(effectiveFrom + 30 days, exact Pilot allowlist expiry)`. Effective authorization checks `status=active`, `effectiveFrom <= dbNow`, `expiresAt > dbNow`, `revokedAt IS NULL`, and `deletedAt IS NULL`; the interval is `[effectiveFrom, expiresAt)` and never depends on an expiry worker.
9. An allowlist closed at transaction time or computed `expiresAt <= effectiveFrom` produces no success writes. Same-definition never rolls expiry forward. A fresh eligible confirmation may mark an elapsed active row `expired` with version increment and create a new Grant identity in the same transaction, reusing the exact Enrollment Thread; the old Grant and old protected content never reactivate.
10. An active Grant whose owner is no longer eligible blocks first-confirm handling and defers to C-2e-4. C-2e-2 cannot auto-revoke, transfer, inherit, or replace owner authority.
11. Thread state is exhaustive: no historical Thread creates the exact Enrollment-private Thread atomically; one exact active Thread is reused across Grant expiry/replacement history; first Message never creates a Thread. A terminal, mismatched, duplicate, or cross-Institution Thread while the Enrollment is active returns an integrity conflict for manual reconciliation. C-2e-2 creates no ThreadParticipant row.
12. Known serialization failure, deadlock, and exact Grant/Thread partial-unique collision receive bounded whole-transaction retry with fresh authoritative reads. A loser converges to `already_satisfied`; rollback leaves the submit context active until a retry commits or the context TTL ends. Exhausted known contention returns retryable `command_busy`. Unknown unique or integrity failures remain technical and cannot be relabeled as success.

The deterministic state matrix is:

| Observed state | Required result |
| --- | --- |
| Same command already committed | Return original CommandExecution/result. |
| New command, exact active same-definition | Consume valid context; record `already_satisfied`; preserve owner/expiry. |
| Two valid commands race | First commit is `applied`; loser retries and becomes `already_satisfied`. |
| Terminal Grant history only | Fresh review may create a new Grant identity and reuse the exact Thread. |
| Stored `active` row elapsed by database time | Mark old row `expired`, then create a fresh Grant if every current gate passes. |
| Active identity with profile mismatch | `grant_replacement_required`; no confirmation-side mutation. |
| Enrollment/target drift or multiple matching active rows | `grant_integrity_conflict`; no success effect. |
| Pending/deleted/future-active/missing lifecycle data | `grant_state_conflict` or manual reconciliation; no guessing. |
| Role/policy/Enrollment/allowlist invalid | Specific blocked result; no success effect. |
| Active owner ineligible | Blocked pending C-2e-4 owner-loss rules. |

C-2e-2 evidence must cover the partial unique index and owner FK/preflight; array canonicalization; fault injection after every planned write; exact replay and response loss; two Guardians racing with distinct command ids; every known and unknown constraint outcome; all database-time/allowlist boundaries; expired-row terminalization; Thread create/reuse/mismatch; the complete state matrix; unchanged winner owner/expiry on `already_satisfied`; and zero ThreadParticipant/Message/Receipt/Item/Attention/Handoff/Outbox/notification/deep-link effects. C-2e-3 owns result presentation, recovery, and explicit-empty Handoff. C-2e-4 owns replace, revoke, owner loss, and dependent cascade.

#### C-2e-3 — Grant result, recovery, and explicit-empty Handoff (LOCKED)

Grant completion has separate immutable receipt and current user-presentation layers:

1. CommandExecution persists `businessOutcome=applied|already_satisfied`; response `disposition=executed|replayed` remains orthogonal and does not mutate the stored outcome. `outputRefs` contain exactly the versioned Grant ref and exact versioned Enrollment-private Thread ref.
2. Execution/output refs are server-side recovery locators, not authorization, navigation, history, or client state. Raw Grant/Thread/Execution refs cannot enter URLs, route state, Chat transcript, Notification, analytics, traces, metrics, or My-Chat query dimensions.
3. User-facing presentation type is `family_care_grant_current`. Safe source-result values are `activated`, `already_active`, and `processed_but_unavailable`; current actor relation is `owner`, `family_user`, or `none`.
4. An active entitled view may show Guardian-confirmed child label, current Institution/CareGroup, fixed question-workflow scope, actual `effectiveFrom`/`expiresAt`, and current action availability. Owner is described only as “you” or “another current Guardian”; raw identity and internal policy/lifecycle/hash details are forbidden.
5. A second Guardian's `already_satisfied` Execution records that Guardian as the requesting business actor and references the winner's Grant/Thread. Presentation may say the authorization already exists and is usable, but cannot say that the second actor confirmed, jointly approved, owns, inherited, or may administer the Grant.
6. Exact response-loss retry performs authenticated compatible Execution lookup and payload comparison before consumed/expired submit-context checks. A committed command needs no new context, review, or confirmation. The response still owner-rereads current identity, role, Family, Enrollment/CareGroup, Grant, policy, and lifecycle before exposing details/actions.
7. Exact replay preserves the original Execution/outcome while current presentation may become `processed_but_unavailable` after expiry/revoke/replacement/authority change. A wrong/stale actor receives generic unavailable without learning whether an Execution or Grant exists.
8. If the source loses the original command identity, recovery uses the ordinary current Grant presenter. The client/Host cannot mint another command identity to probe completion, create an `open_result` token, or transport raw output refs across surfaces.
9. Deterministic token/binding/role/scope/Enrollment/CareGroup/policy/allowlist/version drift makes the old context unusable and commits no Execution or business success. Retryable contention, transaction, owner-service, or transport failure leaves the context active only within the original TTL. Presenter failure after commit never compensates or deletes Grant/Thread/Execution.
10. For both positive outcomes, `handoffRequestSnapshotsPayload=[]` and `handoffDriverRef=NULL`. Grant confirmation requires no durable Workflow Step and creates no Workflow Handoff, My-Chat Outbox, Notification, deep link, teacher visibility, Message, Receipt, Item, Attention, or ThreadParticipant.
11. A Nurture-local activation audit/event may record the applied Grant inside the business transaction but is not host activation and emits no teacher/family push. Pilot does not notify another Guardian when a Grant becomes active; family surfaces discover current state through owner reread.
12. An active owner result may expose separately authorized submit-question, replace, and revoke affordances. An active `family_user` result may expose submit-question/current-state affordances but no management action. Question creation starts a separate actor/surface-local draft, preview, context, confirmation, and command; Grant confirmation cannot create protected content implicitly.

The result/recovery matrix is:

| Command result | Current presentation |
| --- | --- |
| `executed/applied`, Grant still active, actor owner | `activated` + `owner`; current manage/use actions. |
| `replayed/applied`, Grant still active, actor owner | Original receipt + current active owner view; no second confirmation/effect. |
| `executed/already_satisfied`, actor another Guardian | `already_active` + `family_user`; no owner/expiry change or management action. |
| `replayed/already_satisfied`, actor another Guardian | Original convergent receipt + current family-user view. |
| Original result committed, Grant or access later changed | Compatible original actor receives `processed_but_unavailable` or currently entitled safe state; immutable Execution remains. |
| Wrong actor/workspace/surface | Generic unavailable; no Execution/Grant existence signal. |
| Retryable failure before commit | No Execution/business effect; retry same identity/context within TTL. |
| Deterministic stale/blocked/conflict before commit | No Execution/business success; old context unusable and fresh owner resolution required. |

C-2e-3 evidence must cover all four disposition/outcome combinations; exact two-ref Execution output; owner/family-user/none presentation; mandatory and forbidden fields; response loss after context consume and after later context expiry; current Grant/authority change after commit; wrong-caller non-disclosure; lost-command fallback without probe/result token; deterministic versus retryable context behavior; presenter failure without compensation; explicit-empty/null-driver schema state; and absence of Step/Handoff/Outbox/Notification/deep-link/teacher visibility/protected business objects. C-2e-4 owns replace, revoke, owner loss, and dependent cascade.

#### C-2e-4 — Grant terminal transitions and dependent fences (LOCKED / COMPLETE)

| Sub-checkpoint | State | Decision boundary |
| --- | --- | --- |
| C-2e-4a replacement | **LOCKED** | Exact owner/strong delta confirmation, single self-lineage, atomic old/new transition, same owner/Thread, no old-work revival, and explicit-empty output. |
| C-2e-4b owner-initiated revoke | **LOCKED** | Exact owner/common strong confirmation, server audit/database time, atomic transition/fence, replay/races, equal-Guardian fresh authorization, and explicit-empty output. |
| C-2e-4c owner loss | **LOCKED** | Exact role binding, Host/suspension/terminal classification, self-exit/local convergence, no transfer or new-role revival, fresh future authorization, and explicit-empty output. |
| C-2e-4d cascade closure | **LOCKED** | Permanent/temporary classification, typed context dependencies, exact Grant/redaction matrices, root-first loop-to-closure/overflow, bounded audit, and stale Host delivery/open fences. |

#### C-2e-4a — Owner-confirmed Grant replacement (LOCKED)

Replacement is a new authorization identity and never an in-place edit, rolling renewal, reactivation, ownership transfer, or topology move:

1. Only the exact active Grant `grantedByParticipantId` may prepare and execute `replace_child_link_grant -> nurture.family_care.replace_grant` while remaining a current exact-Family Guardian. Another Guardian, Institution Admin, Caregiver, Operator, service identity, raw-id caller, or owner-ineligible actor cannot substitute.
2. Prepare and submit recheck current Host/Nurture identity, Participant/Guardian RoleAssignment, Family/ChildCareProcess, exact active old Grant, expected old version, current active Enrollment/CareGroup, policy, allowlist, and fixed Pilot profile rules. Enrollment/CareGroup transfer is C-2f, not replacement.
3. Every Guardian surface uses the same five-minute strong-authorization `submit_action` contract. Review shows safe old/new profile and actual expiry, exact delta, unchanged owner, immediate termination of old authorization, stop of old-Grant work, retention/audit effect, and no old-content revival. The client returns only opaque context plus explicit confirmation.
4. Schema adds nullable unique `supersedesGrantId` on the new Grant as a Restrict self-FK and nullable old-Grant `replacedAt`/`replacedByParticipantId`, with replacement actor as a Restrict Participant FK. A replaced old row requires replacement audit fields.
5. `supersedesGrantId` is the only stored lineage direction. The inverse relation locates the successor; no old-row `replacementGrantId` is stored. One old Grant has at most one direct successor, and migration preflight rejects broken, duplicate, cyclic, or cross-scope lineage without auto-linking history.
6. The new successor shares workspace, ChildCareProcess, Enrollment, and owner with the old Grant. The new canonical target must equal the current Enrollment CareGroup. Replacement may change the reviewed Grant profile/expiry policy but cannot migrate the care relationship.
7. One Serializable transaction performs exact replay, locks/reloads context/current owner facts/old Grant/exact Thread, obtains database transaction time, validates new profile, consumes context, changes old `active -> replaced` with version/audit, creates the same-owner active successor, reuses the exact Enrollment-private Thread, fences old-Grant dependent work, and commits CommandExecution.
8. `old.replacedAt == new.effectiveFrom == transaction_timestamp()`. Old-first/new-second writes plus the active partial unique index create no committed overlap or gap. Any fault rolls back context, old/new Grant, lineage, fences, and Execution.
9. Exact same-definition returns `already_satisfied` with no new row, lineage, expiry extension, or owner change. Revoked/expired/replaced/deleted/missing old Grant cannot replace. Owner ineligibility is C-2e-4c. Unknown lineage/active-identity defects are integrity conflicts, never inferred success.
10. Replace versus revoke and competing replacement commands use expected old version and first-commit-wins. The loser reloads current state and requires a fresh review; no command silently retargets to the winner's successor.
11. Every old Message/Receipt/Item/Attention remains permanently linked to the old `grantId`. Old work fails current cross-role read/action immediately and converges under C-2e-4d. The successor applies only to future questions; reused Thread is container continuity and grants no old-content authority.
12. Replacement Execution outputs exactly terminal old Grant ref, active successor Grant ref, and reused Thread ref. `handoffRequestSnapshotsPayload=[]` and `handoffDriverRef=NULL`; no Step, Handoff, Outbox, Notification, deep link, Message, Receipt, Item, Attention, or protected body is created by replacement.

The replacement state matrix is:

| Observed state | Required result |
| --- | --- |
| Exact replacement command committed | Replay original old/new/Thread result. |
| New command, requested definition equals current Grant | `already_satisfied`; no replacement or renewal. |
| Current owner + active expected-version old Grant + valid changed profile | Atomic replacement. |
| Another Guardian or non-family actor | Generic unavailable/actor denial; no existence leak. |
| Owner no longer eligible | Block pending C-2e-4c; no owner transfer. |
| Old Grant terminal/deleted/missing | Current/fresh-confirm guidance; no replacement. |
| Enrollment/CareGroup topology drift | Conflict and C-2f path; no implicit transfer. |
| Replace/revoke or two replacements race | First valid commit wins; loser refreshes and re-reviews. |
| Broken/duplicate/cyclic lineage or active overlap | Integrity conflict/manual reconciliation; no auto-repair. |

C-2e-4a evidence must cover exact owner versus every denied actor; all three surfaces and complete delta/consequence review; exact context binding/copy/drift/injection; lineage schema/preflight and no mirrored field; one database timestamp; transaction fault injection; no overlap/gap; exact replay/same-definition; every terminal/owner/topology state; replace/revoke and replace/replace races; original-Grant permanent binding; Thread non-authority; exact three refs; explicit-empty/null driver; and zero host activation/content/delivery effects. C-2e-4b owns voluntary revoke.

#### C-2e-4b — Owner-initiated Grant revoke (LOCKED)

Voluntary revoke terminates one exact Grant identity and is never inferred consent, peer-Guardian administration, silent owner-loss repair, or a permanent family-wide prohibition:

1. Only the exact active Grant `grantedByParticipantId` may prepare and execute `revoke_child_link_grant -> nurture.family_care.revoke_grant` while remaining a current exact-Family Guardian. Another Guardian, Institution Admin, Caregiver, Operator, service identity, raw-id caller, or owner-ineligible actor cannot substitute.
2. Chat, family board, and family workbench use the same product action and five-minute strong-authorization `submit_action` contract. Chat AI may identify intent and render the generic confirmation panel, but natural-language agreement, LLM classification, navigation, preview, or a default control cannot revoke.
3. Prepare and submit recheck current Host/Nurture identity, Participant/Guardian RoleAssignment, Family/ChildCareProcess, active Grant and expected version, current Enrollment/CareGroup, policy, allowlist, action, and surface. The client returns only opaque context plus explicit confirmation.
4. Review copy states that authorization and old-Grant work stop immediately; audit history remains; already seen content or an OS notification cannot be physically recalled; the transition is irreversible; and later cooperation requires a complete fresh Grant authorization. Raw ids, internal reason codes, or client-defined audit values are forbidden.
5. Pilot persists only server-owned `revokeReason=user_revoked`, database `revokedAt`, and the resolved exact `revokedByParticipantId`; downstream fences use `grant_revoked`. No client reason string, timestamp, actor id, status, or dependent ref is authoritative.
6. One Serializable transaction resolves exact replay; locks/reloads context/current owner facts/Grant/exact Thread and the dependent boundary; obtains database time; validates expected version; consumes context; writes `active -> revoked` plus audit/version; invokes the same-transaction dependent fence; and commits CommandExecution. Any fault rolls back context, Grant, fence, and Execution.
7. C-2e-4d owns the exhaustive dependent set, loop-to-closure or whole-transaction overflow behavior, and bounded cascade evidence. C-2e-4b still forbids an asynchronous cascade, a committed `take: 100` prefix, or any revoked Grant with partially fenced dependents.
8. Exact command replay returns the immutable original result. A new command from the still-eligible exact owner against the same revoked Grant is `already_satisfied` and does not change `revokedAt`, actor, reason, or version. Replaced, expired, deleted, missing, or scope-drifted Grant is not revoke success. Owner ineligibility enters C-2e-4c.
9. Revoke/revoke and revoke/replace races use expected Grant version and first-commit-wins. A question/revoke race is serialized: if question commits first, the revoke transaction fences the committed work; if revoke commits first, question authorization fails before business writes. No losing command silently retargets or reports false success.
10. Revoke is irreversible for the exact Grant: the row cannot be edited, replaced, reactivated, or reused. A revoked Grant, replacement Grant, replay, reused Thread, stale context, or technical recovery cannot revive its Message/Receipt/Item/Attention or protected cross-role access.
11. Revoke does not create a permanent owner veto over the Family. Under the equal-Guardian rule, any current exact-Family Guardian may later complete the full first-Grant review/confirmation and become owner of a new future-only Grant. The new authorization does not inherit the revoked Grant or reopen old work.
12. Revoke Execution outputs exactly the terminal Grant ref and exact Enrollment-private Thread ref, never a truncated dependent-ref list. `handoffRequestSnapshotsPayload=[]` and `handoffDriverRef=NULL`; revoke creates no Step, Handoff, Outbox, Notification, deep link, Message, Receipt, Item, Attention, or protected body. Unsent delivery stops through owner reread and the local fence; every open of an already displayed notification reauthenticates and renders only current safe state.

The voluntary-revoke state matrix is:

| Observed state | Required result |
| --- | --- |
| Exact revoke command committed | Replay original Grant/Thread result and current presentation. |
| New eligible owner command against the same revoked Grant | `already_satisfied`; no audit/version rewrite. |
| Exact current owner + active expected-version Grant | Atomic revoke, dependent fence, and Execution. |
| Another Guardian or non-family actor | Generic unavailable/actor denial; no existence leak. |
| Owner no longer eligible | C-2e-4c path; no synthetic voluntary revoke or transfer. |
| Grant replaced/expired/deleted/missing or scope drifted | Current/fresh guidance or conflict; never revoke success. |
| Revoke/revoke or revoke/replace race | First valid commit wins; loser refreshes and re-reviews. |
| Question commits before revoke | Revoke commits only with complete same-transaction fence of that work. |
| Revoke commits before question | Question has no business write or replay seed. |
| Fresh authorization after revoke | Full confirmation creates a new future-only Grant; old work remains terminal. |

C-2e-4b evidence must cover the exact owner and every denied actor; all three surfaces and AI non-authority; complete consequence copy; exact context binding/copy/drift/injection; server reason/actor/database time; transaction fault injection; no partial cascade; exact replay/new-command already-satisfied; all terminal and owner-loss states; revoke/revoke, revoke/replace, and question/revoke races; equal-Guardian fresh authorization without permanent veto; original-Grant permanent binding; exact two refs; explicit-empty/null driver; skipped unsent delivery; stale notification open; and zero new host activation/content/delivery effects. C-2e-4c owns owner-loss classification and C-2e-4d owns complete cascade mechanics/evidence.

#### C-2e-4c — Grant-owner loss and recovery (LOCKED)

Grant owner identity consists of the canonical Participant and the exact versioned Guardian RoleAssignment that supplied authority. Stable person identity never substitutes for the original authority row:

1. Add nullable `grantedByRoleAssignmentId` as a Restrict Grant FK. The rollout stays additive for legacy compatibility, but every new Grant and every Pilot-active non-deleted Grant must have the exact field before activation. The bound role's participant equals `grantedByParticipantId`, and the role must be Guardian scope reaching the exact Family/ChildCareProcess.
2. Backfill uses only exact CommandExecution/audit evidence proving one compatible role, actor, participant, scope, and effective time. Missing, conflicting, or multiple candidates enter preflight/manual reconciliation; current-role, created-time, relationship-label, invitation-recipient, or join-order heuristics cannot choose a role.
3. Every Grant read/action/delivery validates the exact stored role id, matching participant, `role=guardian`, Family/process reach, `status=active`, effective window, policy, and non-deletion. Rejoining as the same Participant with a new RoleAssignment cannot revive the old Grant, Thread work, or protected body.
4. My-Chat account disablement, workspace-membership loss, or Host owner-service failure denies the affected canonical user's Host ingress, presenter, action, and stale open. Host owns and retains that state; Nurture does not rewrite RoleAssignment/Grant, transfer ownership, or infer a family-wide revoke. Host restoration still performs full current Host/Nurture reread and cannot reactivate terminal Nurture facts.
5. Exact Nurture RoleAssignment `suspended` or otherwise temporarily ineffective blocks the Grant and all original-Grant work but leaves the Grant row nonterminal. C-2e-4c authorizes no suspend/resume actor. Only an independently authorized transition of that same exact role row back to active may restore eligibility; another Guardian cannot bypass temporary loss by creating a new Grant.
6. Exact role `revoked`, `expired`, `deleted`, or effective-end elapsed is terminal owner loss. The authoritative predicate blocks the Grant immediately before any reconciliation write. No peer Guardian, Institution, Operator, service, or Host state inherits or receives owner identity.
7. C-2b-4 self-exit is the primary Pilot terminal path. One Nurture transaction locks role before Grant/dependents, changes the exact RoleAssignment to terminal `revoked`, cancels pending Co-Guardian intents issued by that actor, revokes actor-owned active Grants with server reason `owner_self_exit` and the exiting actor, performs the complete fence, and stores one CommandExecution. Any fault rolls back the whole effect; other-owner Grants remain unchanged.
8. A terminal exact role observed outside self-exit fails closed immediately and later converges through idempotent Nurture-local owner action with server reason `owner_role_ended`, database time, no inferred actor, complete same-transaction fence, and immutable Execution/audit evidence. My-Chat Step/Handoff/Outbox, cached eligibility, or eventual status rewrite is not the authorization boundary.
9. If another current exact-Family Guardian exists, full first-Grant review/confirmation may recover future cooperation. One Serializable transaction locks context, terminal old role, old Grant, new Guardian role, exact Thread, and dependents; terminalizes/fences an unreconciled old active row if needed; creates an independent active Grant bound to the new participant and role; reuses Thread only as container; and commits Execution.
10. Recovery is not replacement or transfer. The new Grant has no `supersedesGrantId`, does not copy old owner/audit/profile state, applies only to future work, and cannot revive old Message/Receipt/Item/Attention. Confirmation Execution outputs exactly new active Grant/Thread refs; old terminalization remains Nurture-local audit evidence. Temporary Host loss or exact-role suspension cannot enter recovery.
11. Self-exit versus question/revoke/replace, terminal role versus action, reconciler versus fresh confirmation, and Host restore versus action use exact role/Grant versions, deterministic role-before-Grant-before-Thread/dependent lock order where local, and current reread at every boundary. Exact replay remains immutable while presentation follows current authorization.
12. Last-Guardian terminal recovery, peer/Institution/Operator forced removal, legal/custody dispute, authority reassignment, Host-driven role deletion, and cross-database atomic offboarding remain outside Pilot. Every owner-loss/recovery Execution stores `handoffRequestSnapshotsPayload=[]` and `handoffDriverRef=NULL` and creates no Step, Handoff, Outbox, Notification, deep link, or protected body.

The Grant-owner-loss matrix is:

| Observed state | Grant and recovery result |
| --- | --- |
| Host account/workspace unavailable | Deny that user's Host access; no Nurture mutation or global Grant revoke. |
| Host restored, exact role and Grant still current | Full reread may allow that user again; no terminal fact is revived. |
| Exact role suspended/temporarily ineffective | Grant remains nonterminal but unusable; no peer fresh-confirm bypass. |
| Same exact role independently resumed | Full reread may restore eligibility if every other Grant fence remains current. |
| Exact role revoked/expired/deleted/time-ended | Immediate permanent Grant fence; local terminal convergence; no transfer. |
| Same Participant receives a new role row | Old Grant remains unusable; new role grants no old authority. |
| Self-exit with another Guardian remaining | Atomic role/invitation/owned-Grant/fence/Execution transition. |
| Self-exit as last current Guardian | Denied before write; later authority recovery remains outside Pilot. |
| Another Guardian fully confirms after terminal loss | Independent future-only Grant; no replacement lineage or old-work revival. |
| Another Guardian attempts during Host loss/suspension | Denied; temporary state cannot be converted into ownership takeover. |
| Reconciler and fresh confirmation race | One serialized terminalization; new Grant only after exact terminal proof. |

C-2e-4c evidence must cover exact role schema/FK/backfill/preflight; Participant-versus-role identity; every Host loss/restore state; suspension and same-row resume; every terminal role cause; new-role non-revival; self-exit atomicity and last-Guardian denial; immediate pre-reconcile fence; idempotent local convergence; fresh equal-Guardian confirmation and no `supersedesGrantId`; exact new Grant/Thread refs; complete race/lock matrix; current replay/presentation; explicit-empty/null driver; and zero Host technical-state persistence or activation/delivery effects. C-2e-4d owns complete dependent closure and evidence.

#### C-2e-4d — Dependent cascade closure and stale delivery (LOCKED)

Cascade is irreversible business convergence, not a synonym for every temporary owner-read denial:

1. Permanent Grant revoke/replacement/expiry/terminal-owner-loss and exact Guardian-source/Caregiver-reply redaction invoke the versioned cascade kernel. Host account/workspace loss, exact-role suspension, owner-service outage, and temporary policy/Institution/CareGroup unavailability fail closed on current read/action/delivery without persistent suppression. C-2f decides when Enrollment/topology change is terminal before invoking the kernel.
2. Add `NurtureInteractionContextDependency`. Each row binds one context to exactly one nullable typed Restrict FK among Grant, Message, Item, or Receipt; a raw CHECK enforces one non-null ref. Multiple rows support multi-candidate clarification. Protected context creation and all dependency rows commit together; incomplete typed dependencies block Pilot activation/use. JSON state is never dependency authority.
3. Grant invalidation revokes every active Grant-dependent context and removes executable state; terminalizes all Grant Receipts and retry controls; suppresses every actionable Item and active clarification; scrubs body-derived Item/Attention/Thread projections; and retains protected Message, immutable Execution/events, authorship, timestamps, and approved body-free audit under current author/receiver rules.
4. Receipt transitions are exact: `pending -> blocked(reason)` and clears pending/driver/retry controls; `delivered|read|acknowledged -> revoked_after_delivery(reason)` and retains occurred-at timestamps; `failed|blocked|revoked_after_delivery` remains terminal. Retry descendants cannot retain schedulable delivery.
5. Item `open|acknowledged|waiting_for_family|replied|followed_up -> suppressed`. An active clarification writes one `clarification_cancelled` and one suppression event, then clears active ids/times/driver refs and executable assignment. Item summary becomes a generic tombstone; detail and body-derived/safety projections clear. Root/audit refs remain internal.
6. Every affected Attention loses body-derived title/summary. `active -> suppressed`; resolved/expired/suppressed status remains terminal with scrubbed projection and a versioned update. Enrollment Thread remains reusable, but invalid summary payload is cleared or safely owner-recomputed; chronology may remain.
7. Guardian-source redaction clears the source body/attachment/protection, terminalizes source Receipt, revokes contexts bound to that source Message, suppresses dependent Item/active Attention, and scrubs Thread projection. An independently authored Caregiver reply is not automatically redacted, while source presentation becomes a tombstone.
8. Caregiver-reply redaction clears only reply body/Receipt/context/projection. Source question/source Receipt and the replied Item/resolved Attention are not suppressed, reopened, or made replyable again. Redaction branches have distinct server causes and state matrices.
9. The kernel locks Grant before Message and roots before dependents, validates root/version/cause, pre-counts a versioned Pilot hard cap, and keyset-processes deterministic primary-key batches inside one Serializable transaction. `SKIP LOCKED`, async repair, and intermediate commit are forbidden. Every dependent writer locks/revalidates the root, preventing post-count escape.
10. Final root-specific `NOT EXISTS` assertions cover context, Receipt, Item, clarification, Attention projection, and Thread projection. Root, all dependents, one bounded audit, and owning Execution commit together. Any fault, conflict, phantom, cap overflow, or failed closure assertion rolls back before root mutation; no first-100 prefix may commit.
11. Add `NurtureLifecycleCascadeAudit` with unique root type/id/version/cause, cascade schema version, canonical per-transition counts, closure hash, database completion time, and owning Execution locator. The row is evidence only and stores no body, token, dependent-ref list, account/device target, or Host technical state. Existing exact CommandExecution output refs do not expand.
12. Invalidation Commands remain explicit-empty and create no new Handoff/Outbox/Notification. Old immutable same-Step replay seeds may materialize refs-only technical work, but materializer consumers, provider retries, opens, and presenters owner-reread current Nurture state and stop/skip/tombstone. Admin sees bounded evidence and can request owner reconciliation but cannot edit or mark business closure.

The closure matrix is:

| Root/case | Persistent closure result |
| --- | --- |
| Permanent Grant invalidation before capture | No new business effect; all bound active contexts revoke. |
| After capture/before acknowledge | Receipt terminal; Item/Attention suppress; secondary projections scrub. |
| After acknowledge/before reply | Ack audit retained; Item/Attention suppress; reply and receiver body blocked. |
| After reply | Item becomes suppressed audit state; reply history is not reopened; bodies follow author/receiver rules. |
| Guardian source redaction | Source body/Receipt/context/workflow close; independent reply retained; source tombstone. |
| Caregiver reply redaction | Reply side closes; source workflow stays terminal and cannot gain another reply. |
| Host loss/role suspension/temporary outage | Current fence only; zero irreversible cascade mutation. |
| Zero through exact hard-cap dependents | Full one-transaction closure plus bounded audit. |
| Above hard cap | Whole transaction fails before root mutation; manual owner reconciliation. |
| Concurrent dependent writer | Writer precedes and is included, or observes terminal root and fails before write. |
| Old seed/provider retry/stale open | Refs-only technical state may exist; no send/body/action after owner reread. |

C-2e-4d evidence must cover classification of every permanent and temporary cause; typed dependency schema/backfill/activation; every context/Receipt/Item/clarification/Attention/Thread/Message state; both redaction branches; zero/one/batch-boundary/more-than-100/hard-cap/overflow cardinality; root/dependent lock ordering; concurrent inserts/actions; fault injection at every batch and audit/Execution boundary; final zero-row assertions; exact replay; bounded audit hash/privacy; author/receiver body rules; immutable seed/materialization/provider/open behavior; Admin non-authority; explicit-empty/null driver; and removal of prefix-limited/sliced-ref implementation. C-2e-0 through C-2e-4d are now complete as the C-2e planning contract; C-2f is next.

#### C-2f — Enrollment topology lifecycle and longitudinal boundary (IN PROGRESS)

| Sub-checkpoint | State | Decision boundary |
| --- | --- | --- |
| C-2f-0 lifecycle vocabulary and actor authority | **LOCKED** | Current/terminal/deleted classes, family/institution actor separation, reversible versus permanent closure, new-identity transfer, independent Institutions, and forbidden automatic migration. |
| C-2f-1 temporary Enrollment pause/resume | **LOCKED** | Side-owned family/institution holds, exact compatible keys, shared same-side authority, cross-side denial, strong confirmation, current fences, atomic aggregate, replay, and races. |
| C-2f-2 same-Institution CareGroup transfer | **LOCKED** | Institution proposal/family confirmation, intent lifecycle, target-on-confirm roster, one-way old/new Enrollment lineage, atomic Grant/work closure, and no authority carryover. |
| C-2f-3 permanent leave/end and re-entry | **LOCKED / COMPLETE** | C-2f-3a-c lock terminal actions/actors/statuses, atomic closure, fresh relationship identities, unified lineage, current-owner confirmation, retained-history separation, and no old authority revival. |
| C-2f-4-0 portability boundary/classification | **LOCKED** | Same-workspace longitudinal process, family-owned stage, Institution-local Enrollment, independent different-Institution onboarding, no lineage/carryover, Enrollment-independent stage change, and cross-workspace `NO-GO`. |
| C-2f-4-1 stage fact/authority/lifecycle | **LOCKED** | Versioned linear StageEpisode, exact equal-Guardian action/confirmation, stable vocabulary, transition/correction/clear/replay/races, projection-only `currentStageKey`, and no inferred or Enrollment effect. |
| C-2f-4-2 same-workspace multi-Institution visibility/concurrency | **LOCKED** | Current-Guardian safe longitudinal view, repository-scoped Institution isolation, no cross-Institution/id/stage leakage, no stage dataClass, independent concurrency, exact dependencies, and stale-segment safety. |
| C-2f-4-3 future cross-workspace protocol boundary | **LOCKED** | Pilot remains `NO-GO`; future same-adult source/target Guardian confirmation, fresh target-local identity, minimum field allowlist, no match/merge/stage/authority/content carryover, bounded token lifecycle, replay/revoke/no-recall, and Host/Nurture ownership split. |
| C-2f-5 result, recovery, surfaces, and Handoff | **LOCKED / COMPLETE** | Immutable outcome versus replay disposition, exact server-only refs, four current owner presenters, same-Execution/same-Step response-loss recovery, route-only continuity, pinned legacy `user_attention`, minimal future Guardian relationship attention, and generic owner-reread notification. |

#### C-2f-0 — Lifecycle vocabulary and actor authority (LOCKED)

C-2f-0 classifies authority and irreversibility before any transition-specific command is designed:

1. `active` and `paused` are current, uniqueness-conflicting Enrollment states. Legacy `pending` remains conflict-bearing but Pilot creates none. `ended` and `withdrawn` are terminal and never reactivate. `deleted` is unavailable as a Pilot action, retention shortcut, uniqueness bypass, or audit erasure.
2. A current exact-Family Guardian is the only family-side actor class for a family restriction or withdrawal. An exact-scope active Institution Admin is the only institution-side actor class for an institution restriction, service end, or same-Institution transfer proposal. Later C-2f checkpoints own exact confirmation, multi-Guardian, action-key, and concurrency rules.
3. Caregiver, Lead Caregiver, Technical Operator, service identity, AI/natural-language interpretation, raw ids, Host membership, and ambient workspace administration have no Enrollment topology authority. Technical Admin remains evidence/reconciliation-only.
4. Pause is reversible current denial. Enrollment-dependent cross-role reads, actions, delivery, stale notification open, and new Grant use fail closed, but the pause itself cannot terminalize Enrollment, Grant, Thread, Message, Receipt, Item, or Attention and cannot invoke the permanent C-2e cascade.
5. Family and institution restrictions must be independently attributable. `status=paused` may be an aggregate presentation, never resume authority; neither side may clear the other side's restriction. The `C-2f-1 — Temporary Enrollment pause/resume` section locks the additive hold representation and exact release rules.
6. Guardian withdrawal, Institution end, and completed transfer are permanent outcomes for the old Enrollment and must close old active Grants/dependent work under C-2e. C-2f-2/C-2f-3 own exact reason/status mapping, transaction boundaries, and retained presentation.
7. Transfer cannot edit `careGroupId`, reuse the old Enrollment, or carry old RosterEntry, Grant, Thread, Message, Receipt, Item, Attention, context, or Handoff authority. Completion ends the old Enrollment and creates a new Enrollment identity; any target Grant/Thread requires its normal fresh path.
8. Current Enrollments at different Institutions remain independent. A lifecycle, policy, or Grant change in one Institution cannot mutate or authorize another Institution relationship.
9. Same-workspace longitudinal Child/ChildCareProcess/Family continuity remains family-owned and current-owner-resolved. Cross-workspace fuzzy/global matching, raw linking, global child identity claims, or automatic profile/Enrollment/Grant/Thread/content/audit migration is forbidden even when the adult My-Chat identity is the same.
10. C-2f-0 authorizes no schema migration, action, transaction, notification, Handoff, runtime, environment, capability, or traffic change. The following C-2f-1 through C-2f-5 sections now lock the remaining planning details without authorizing implementation.

The classification matrix is:

| Case | Classification and authority boundary |
| --- | --- |
| Active Enrollment | Current; normal owner reread still required. |
| Family restriction | Guardian-side current pause candidate; Institution cannot release the family restriction. |
| Institution restriction | Institution-Admin-side current pause candidate; Guardian cannot release the institution restriction. |
| Both restrictions | Remains paused until each independently authorized restriction is released. |
| Guardian withdrawal | Permanent old-Enrollment outcome; exact mechanics wait for C-2f-3. |
| Institution service end | Permanent old-Enrollment outcome; exact mechanics wait for C-2f-3. |
| Same-Institution transfer proposal | Institution Admin may propose; no topology mutation until C-2f-2 authorization completes. |
| Completed transfer | Old Enrollment terminal plus new Enrollment identity; no authority carryover. |
| Another Institution Enrollment | Independent lifecycle and authority scope. |
| Cross-workspace candidate | No automatic match, link, migration, or global identity conclusion. |
| Caregiver/Operator/AI/Host-only caller | No topology authority. |

C-2f-0 evidence must cover every state classification, both actor sides and every denied actor, concurrent dual restrictions, cross-side release denial, zero permanent cascade on pause, permanent old-Enrollment classification, terminal non-reactivation, in-place transfer denial, new-identity/no-carryover invariant, cross-Institution isolation, cross-workspace/global-match denial, and absence of any premature executable effect. C-2f-1 and C-2f-2 lock pause/resume and same-Institution transfer planning; C-2f-3a-c lock permanent exit, closure, and fresh re-entry; C-2f-4-0/1/2/3 lock portability classification, stage lifecycle, same-workspace visibility/concurrency, and the future cross-workspace protocol boundary; the locked C-2f-5 contract fixes result/recovery/presenter/Host-effect semantics.

#### C-2f-1 — Temporary Enrollment pause/resume (LOCKED)

Pause is a reversible relationship fence backed by side-owned evidence, not a Grant revoke, terminal Enrollment transition, upper-scope pause, personal veto, or global status toggle:

1. Additive `NurtureEnrollmentPauseHold` binds one exact Enrollment and side. Lifecycle is `active|released|closed`; `released` is authorized same-side resume and reserved `closed` is terminal closure for C-2f-2/C-2f-3. Released/closed rows never reactivate and Pilot has no auto-expiry.
2. One active hold is allowed per Enrollment/side. Every hold stores fixed side-compatible reason, exact place/release Participant, RoleAssignment, CommandExecution and database time, version, and no free text, protected narrative, Host/provider state, or client audit values.
3. Holds are restriction authority; Enrollment `status` is an atomic aggregate. Zero holds means active, either/both holds means paused, and every hold transition increments Enrollment version even if still paused. Any mismatch fails closed and requires owner reconciliation rather than status-only use or command-time auto-repair.
4. Any current exact-Family Guardian may place/release the shared family hold; any current active exact-scope Institution Admin may place/release the shared institution hold. Place actor is audit, not personal ownership. Neither side may release the other; Caregiver, Lead, Operator, service, AI, Host, and raw-id actors have no action.
5. Guardian surfaces use `suspend_family_enrollment -> nurture.family_care.suspend_enrollment` and `resume_family_enrollment -> nurture.family_care.resume_enrollment`. Institution reuses locked `suspend_enrollment -> nurture.institution.suspend_enrollment` and `resume_enrollment -> nurture.institution.resume_enrollment`; no institution pause alias exists. Resume releases only its own side and may leave aggregate paused.
6. Both directions use a five-minute `submit_action` context. Review identifies side, immediate bidirectional cross-role fence, retained history, non-recall, continuing Grant expiry, other-side independence, and conditional recovery. AI language, navigation, raw ids, status/side/reason/time, or copied context cannot execute.
7. One Serializable transaction resolves replay; locks context/role, Enrollment, then holds; rereads current scope/policy/upper fences; validates expected versions; uses database time; creates/releases the hold; recomputes status; increments Enrollment version; consumes context; and commits audit/Execution without remote call.
8. Exact replay is stable. Fresh duplicate pause/resume is already satisfied without rewriting audit. Same- or different-side actions prepared at one Enrollment version serialize first-commit-wins; stale losers must refresh and reconfirm changed consequences. Both holds may coexist only after current review. Releasing one while the other is active stays paused.
9. End/withdraw/transfer wins permanently under Enrollment-first locking. Every Grant/capture/ack/reply/delivery writer also locks/revalidates Enrollment and holds: work committed before pause is immediately fenced; work after pause rejects. Enrollment version makes old contexts permanently stale and resume never revives them.
10. During pause, current cross-role bodies, capture, ack/reply, Grant create/replace, retry/delivery, notification open, and new protected effects are unavailable. Grant/Thread/Message/Receipt/Item/Attention/context lifecycle and immutable seeds remain unchanged; Grant expiry continues; no cascade, clock extension, bulk replay, new Handoff, or automatic notification occurs.
11. After all holds clear, an object becomes usable only if current role, original/current Grant, policy, Institution/CareGroup, source lifecycle, time, redaction, and object state all pass. Resume is never authorization restoration by itself.
12. Institution/CareGroup pause, Host loss, owner outage, and capability/allowlist disable remain separate upper-scope fences. They create no Enrollment holds, and recovery cannot release a hold. C-2f-5 owns exact result refs, presenter recovery, notification, and Handoff semantics.

The pause/resume matrix is:

| Case | Required outcome |
| --- | --- |
| Family pause, no Institution hold | Create family hold; aggregate paused. |
| Institution pause, no family hold | Create institution hold; aggregate paused. |
| Second side pauses after refresh | Create second hold; aggregate remains paused and version advances. |
| Same-side duplicate pause | Already satisfied; no row/time/version/audit rewrite. |
| Same-side resume with active hold | Release only that side; recompute aggregate. |
| Same-side duplicate resume | Already satisfied; no mutation. |
| Resume while other side remains | Command succeeds for own side; aggregate remains paused. |
| Two confirmations from one version | First commits; stale loser refreshes and reconfirms. |
| Pause during valid work | Earlier commit remains audit fact but current access/action/delivery stops. |
| Resume after Grant/object expiry | No revival; current owner reread remains denied. |
| Terminal Enrollment race | Terminal state wins permanently; no pause/resume reactivation. |
| CareGroup/Institution/Host/capability recovery | Does not release either Enrollment hold. |

C-2f-1 evidence must cover additive schema/preflight, all actor/side/surface/action mappings, same-side shared release, cross-side/technical denial, exact consequence copy/context binding, status/hold mismatch, every hold combination, database time/transaction faults, exact replay/already-satisfied, stale same/cross-side races, terminal and dependent-writer races, Grant clock/non-revival, preserved business/technical facts, no cascade/bulk replay/alias, upper-scope separation, and the planning-only boundary. C-2f-2 locks transfer planning; C-2f-3a-c lock permanent exit, closure, and fresh re-entry; C-2f-4-0/1/2/3 lock portability classification, stage lifecycle, same-workspace visibility/concurrency, and the future cross-workspace protocol boundary; the locked C-2f-5 contract fixes result/recovery/presenter/Host-effect semantics.

#### C-2f-2 — Same-Institution CareGroup transfer (LOCKED)

Transfer is a family-confirmed topology replacement, not an Institution-only roster edit, initial Enrollment, terminal close, or reused invitation:

1. `NurtureEnrollmentTransferIntent` binds exact source Enrollment/version, same Institution source/target Groups, proposing Admin, fixed `care_group_transfer`, seven-day derived expiry, canonical hash, lifecycle/audit, and at most one effective pending identity. No raw contact, free text, protected data, or Host/provider state is stored.
2. Institution workbench uses `propose_enrollment_transfer` / `cancel_enrollment_transfer`; Institution board is read-only. Any current exact-Family Guardian uses `confirm_enrollment_transfer` / `decline_enrollment_transfer` on all Guardian surfaces. Caregiver, Operator, AI, raw ids, direct transfer, `initiate_enrollment`, `close_enrollment`, and Enrollment Invitation cannot substitute.
3. Proposal and confirmation require source Enrollment active and no active family/institution hold. Every intent binds source version; pause/resume or other version change makes the proposal stale. Transfer never consumes, releases, closes, or carries a hold.
4. Source and target Groups differ inside one Institution. Institution and target Group must be active with current Lead/policy/gates/capacity. Source Group may be active, paused, or archived for transfer-out but must exist, be undeleted, and match source Enrollment. Cross-Institution movement is C-2f-4.
5. Add exact nullable Restrict `Enrollment.rosterEntryId`, required for new/Pilot-active transfer eligibility after exact-evidence preflight. Confirmation alone creates target RosterEntry from current family-safe label; source roster becomes historical `transferred`. Cancel/decline/expiry/fault creates no target row and institution prefill is not copied.
6. New Enrollment alone stores unique Restrict `predecessorEnrollmentId` plus `continuityKind=care_group_transfer`. Same workspace/process/Institution, different Group, one successor across every continuity kind, and acyclic lineage are mandatory; no old-row successor mirror or heuristic legacy link exists. C-2f-3c supersedes the unimplemented `supersedesEnrollmentId` proposal so transfer and re-entry share one lineage SSOT.
7. Guardian five-minute confirmation states the old Group ends immediately, old Grant/work permanently closes, history is retained but non-recallable, target gains safe roster visibility only, no old content moves, no target Grant/Thread is implicit, and transfer is irreversible. Client supplies only opaque context and confirmation.
8. One Serializable transaction resolves context/current Guardian, locks source Enrollment before TransferIntent, then Groups/holds/source roster/Grant/Thread/cascade roots, rechecks readiness/uniqueness/capacity/policy, preflights hard cap, and obtains database `T`. Old Enrollment becomes `ended`, `leftAt=T`, reason `care_group_transfer`; every old effective Grant terminates under `enrollment_transferred` and C-2e closure; old Thread/roster archives; target roster and new active Enrollment with `joinedAt=T`/lineage commit; intent consumes; audit/Execution commits. C-2f-3b supersedes the earlier Intent-first order so every topology command uses Enrollment as its common root.
9. Topology Grant closure is server lifecycle invalidation, not another Guardian's voluntary revoke. Confirming actor need not own old Grant and gains no owner right. Any stale row, duplicate successor, survivor, fault, overflow, or response-before-commit rolls back the entire old/new unit.
10. Old protected and care facts remain bound to source Enrollment/Group. Old caregiver current reach ends; no Message, Receipt, Item, Attention, Thread, context, Handoff, notification, DailyCareLog, media, policy, Grant, or hold is copied/retargeted. Target caregiver sees only safe roster state until fresh Grant creates a new Thread.
11. Exact replay returns one cutover. Same-target duplicate proposal resolves current intent; different target conflicts. Confirm/decline, cancel/confirm, two Guardians, transfer/pause/end/withdraw, transfer/new work, readiness/capacity drift, and duplicate successor use first-commit-wins or current conflict without partial effect.
12. Proposal/cancel/decline create no Enrollment/roster/Grant/Thread/protected work. Proposal delivery, transfer result refs/presenters/recovery, notification, deep link, and Handoff remain C-2f-5; Host delivery never determines commit.

The transfer matrix is:

| Case | Required outcome |
| --- | --- |
| Valid proposal | One pending intent; no target roster or topology effect. |
| Same target exact replay | Original intent/result. |
| Different target while pending | Conflict; no mutation. |
| Hold active or source version drift | Proposal/confirmation unavailable; hold untouched. |
| Source Group paused/archived, target ready | Transfer-out may proceed after all other checks. |
| Cancel/decline/expiry | Intent unavailable; source Enrollment unchanged; no target row. |
| Valid Guardian confirmation | Atomic old ended/new active at one database time. |
| Old Grant owned by another Guardian | Server topology closure; no peer owner impersonation. |
| Closure hard-cap overflow/fault | Entire transfer rolls back before root mutation. |
| Response loss/exact replay | Same intent, old/new Enrollment, lineage, and Execution. |
| Target after commit | Safe roster only; fresh Grant/Thread required. |
| Old notification/open/work | Current owner reread yields historical/unavailable; no old action. |

C-2f-2 evidence must cover intent schema/lifecycle/expiry/privacy, every actor/surface/action alias, zero-hold/version binding, source/target readiness and capacity, exact roster relation/timing, unified one-way lineage/preflight, confirmation copy/context, database-time transaction/fault/overflow, complete C-2e closure, old/new visibility and persisted privacy, every race/replay/response-loss case, no carryover, no Host commit authority, and planning-only status. The following C-2f-3a-c sections lock terminal authority, atomic closure, and fresh re-entry; C-2f-4-0/1/2/3 lock portability classification, stage lifecycle, same-workspace visibility/concurrency, and the future cross-workspace protocol boundary; the locked C-2f-5 contract fixes result/recovery/presenter/Host-effect semantics.

#### C-2f-3 — Permanent leave/end and re-entry (LOCKED / COMPLETE)

| Sub-checkpoint | State | Decision boundary |
| --- | --- | --- |
| C-2f-3a terminal actions, actors, statuses, and reasons | **LOCKED** | Family withdrawal versus Institution service end, exact action/command mappings, equal independent Guardian authority, fixed terminal mapping, strong confirmation, and active/paused entry. |
| C-2f-3b atomic terminal closure | **LOCKED** | Hold closed evidence, database-time Enrollment transition, complete Grant/Thread/work closure, Enrollment-first lock order, replay, faults, and races. |
| C-2f-3c fresh re-entry and retained history | **LOCKED** | Same-Institution existing-action entry, fresh relationship identities, unified predecessor lineage, terminal-leaf/current-Guardian resolution, atomic confirmation, separate historical episodes, and no old authority revival. |

**C-2f-3a — Terminal actions, actors, statuses, and reasons (LOCKED)**

Permanent exit has two owner-specific actions rather than one generic terminal mutation:

1. Guardian Chat, family board, and family workbench use `withdraw_family_enrollment -> nurture.family_care.withdraw_enrollment`. Institution workbench uses the already reserved `close_enrollment -> nurture.institution.close_enrollment`; Institution board stays read-only. No `end_enrollment`, alias, initial-enrollment, pause/resume, transfer, or raw lifecycle action may substitute.
2. Any current exact-Family Guardian may independently withdraw the shared Enrollment. Grant owner, Enrollment Invitation recipient, first Guardian, join order, relationship label, a hidden primary role, or unanimous/current Co-Guardian approval has no special Enrollment authority. Another Guardian's notification or acknowledgment cannot gate commit.
3. Any current exact-scope Institution Admin may independently end service. Guardian countersignature is not required. The opposite owner side, Caregiver, Lead, Technical Operator, service identity, Host/workspace admin, AI/natural-language inference, raw ids, or ambient membership cannot execute either action.
4. Mapping is server-owned and closed: Guardian withdrawal produces terminal `withdrawn + family_withdrawn`; Institution end produces terminal `ended + institution_service_ended`; completed transfer remains terminal `ended + care_group_transfer`. The client cannot supply free text, sensitive dispute/health/fee narrative, status, reason, actor, time, or audit fields.
5. Both actions require a five-minute `submit_action` strong-confirmation context bound to exact actor/RoleAssignment, owner scope, ChildCareProcess, Enrollment/version, action, surface, and consequence hash. Copy states immediate permanent end, mandatory old Grant/work closure, retained non-recallable history, notification non-recall/current stale open, no resume, and fresh re-entry.
6. Both `active` and `paused` may enter a terminal path. An active family or Institution hold cannot veto permanent exit or force the opposite side to release first. Terminal processing closes holds as system consequences and never records `released`, peer consent, or a fabricated release actor.
7. First terminal commit wins under Enrollment versioning. Concurrent Guardians, family withdrawal versus Institution end, and terminal versus other lifecycle actions cannot create a second terminal effect or overwrite the winner's status/reason/actor. C-2f-3b owns exact locking, replay, closure, and fault mechanics.
8. Terminal Enrollment identities never resume or reactivate. C-2f-3c owns all fresh re-entry identities and retained-history rules. C-2f-5 owns exact result refs, presenter, peer notification, deep link, Handoff, and delivery; none is a terminal commit condition.

The C-2f-3a classification matrix is:

| Case | Required outcome |
| --- | --- |
| Current Guardian withdraws active Enrollment | Family terminal path: `withdrawn + family_withdrawn`. |
| Either current Guardian in the dual-Guardian family withdraws | Independently eligible after strong confirmation; no peer vote. |
| Grant owner or invitation recipient without current Guardian authority | Denied; historical role gives no topology authority. |
| Current Institution Admin closes active Enrollment | Institution terminal path: `ended + institution_service_ended`. |
| Opposite owner side asked to countersign | No countersign step; notification/ack is not commit authority. |
| Active family/institution hold exists | Terminal path remains eligible; hold later becomes system `closed`, never released. |
| Caregiver/Lead/Operator/Host/AI/raw-id caller | No terminal action or existence-bearing authority. |
| Two terminal confirmations use one source version | First commit wins; loser owner-rereads the terminal result. |
| Attempt to resume ended/withdrawn Enrollment | Permanently denied; fresh re-entry only. |

C-2f-3a evidence must cover every surface/action mapping, equal current-Guardian permutations, forbidden hidden hierarchy/unanimity/countersignature, exact Institution scope, all denied actors, fixed status/reason mapping, client-field/privacy injection, five-minute consequence binding, active/paused source classes, hold non-veto/non-release, terminal races, terminal non-resume, and the planning-only boundary. C-2f-3b locks atomic terminal closure, C-2f-3c locks fresh re-entry, C-2f-4-0/1/2/3 lock portability classification, stage lifecycle, same-workspace visibility/concurrency, and the future cross-workspace protocol boundary, and the locked C-2f-5 contract fixes result/recovery/presenter/Host-effect semantics.

**C-2f-3b — Atomic terminal closure (LOCKED)**

Permanent withdrawal, Institution service end, and completed transfer use one Enrollment-rooted local closure contract:

1. Enrollment terminal audit stores the server-fixed reason, exact actor Participant and RoleAssignment, unique owning CommandExecution, database `leftAt`, and aggregate version. Terminal status, reason, actor, time, and Execution are one immutable fact; a later caller cannot rewrite or claim the terminal fact.
2. Every active Enrollment Hold becomes `closed` at the same database time with `closedByExecutionId` pointing to the Enrollment Execution. Release fields stay null and placement audit stays immutable. Closure never fabricates peer consent, a side release, or a release actor.
3. Every effective status-active Grant becomes `revoked` under the exact server cause: `enrollment_withdrawn`, `institution_service_ended`, or `enrollment_transferred`. `revokedByParticipantId` is null because Enrollment authority is not Grant-owner authority; the Enrollment Execution owns each bounded CascadeAudit. A status-active Grant already elapsed at database `T` converges through expiry, and terminal Grant rows never rewrite.
4. Every exact-source pending TransferIntent becomes system `invalidated` with `source_enrollment_terminal`, database time, and owning Execution. Cancel/decline actors are not invented. Every topology InteractionContext has a typed Enrollment dependency; terminal closure consumes its own context and revokes every other active Enrollment-dependent context.
5. The exact RosterEntry becomes noncurrent `withdrawn` or `ended` history, while transfer remains `transferred`. The exact Thread becomes `closed`, loses executable and body-derived summary projection, and retains Message/authorship/chronology/audit history. Nothing is deleted, unlinked, copied, or retargeted.
6. The global local lock order is exact CommandExecution replay lookup; command context and current actor RoleAssignment; Enrollment; Institution/CareGroup; Holds; pending TransferIntents; exact roster; status-active Grants by primary key; exact Thread; then C-2e roots/dependents. Enrollment is the common topology root for pause, resume, transfer, withdrawal, end, and every Enrollment-dependent writer. The Enrollment-first order supersedes the earlier C-2f-2 Intent-first wording.
7. One Serializable transaction performs an aggregate versioned hard-cap preflight before root mutation, obtains one database time, writes every terminal fact and bounded audit, persists CommandExecution, and performs root-specific zero-survivor assertions. No remote call, provider result, My-Chat write, Handoff materialization, or asynchronous repair participates in commit.
8. Final postconditions require zero active Hold, pending TransferIntent, status-active Grant, executable Enrollment/Grant context, Receipt retry, actionable Item/clarification/Attention, active Enrollment-private Thread, current roster, or unsafe Thread projection. Any conflict, phantom, fault, overflow, integrity defect, or survivor rolls back the complete unit and triggers Pilot stop/manual reconciliation; prefix closure is forbidden.
9. Exact response-loss replay returns the original result before consumed/expired context checks. A fresh currently entitled same-cause command may return `already_satisfied` without changing terminal audit or falsely naming the later actor. A different terminal cause or target is a current conflict.
10. Concurrent Guardians, family withdrawal versus Institution end, pause/resume/transfer, Grant mutation, capture/ack/reply/redaction, retry, and dependent insertion are first-commit-wins under Enrollment/version/root locks. Work committed first is included in closure; terminal commit first blocks later work before its first business fact.
11. Message, care log, media, authorship, retention, immutable execution/event, and body-free audit facts remain retained. Guardian/Caregiver RoleAssignments, Institution/CareGroup state, other-Institution Enrollments, immutable Host seeds, and My-Chat technical ledgers are outside the mutation set.
12. C-2f-3b remains planning-only. C-2f-3c owns fresh re-entry identity, provenance, and retained-history presentation. C-2f-5 owns exact output refs, presenter copy, peer notification, deep link, Handoff, delivery, and recovery; none can weaken or determine the Nurture-local terminal commit.

The atomic-closure matrix is:

| Case | Required outcome |
| --- | --- |
| Active or paused Enrollment terminates | One terminal Enrollment fact and one complete bounded closure at database `T`. |
| One or two active Holds | Every active Hold is system `closed`; no release or peer actor fiction. |
| Effective versus already elapsed Grant | Effective Grant gets topology revoke cause; elapsed Grant converges as expiry; none remains status-active. |
| Pending versus terminal TransferIntent | Pending intent is system-invalidated; terminal intent remains immutable. |
| Exact replay after response loss | Original closure and receipt; no second audit or mutation. |
| Fresh same-cause duplicate | `already_satisfied` is allowed without audit rewrite or later-actor claim. |
| Different terminal cause or concurrent topology command | First commit wins; loser resolves current conflict. |
| Work commits before terminal lock | New fact is included in the same complete closure. |
| Terminal lock commits before work | Later writer fails before its first business fact. |
| Fault, hard-cap overflow, phantom, or survivor | Entire transaction rolls back; Pilot stops for manual reconciliation. |
| Historical business facts | Retained and still bound to original Enrollment; current cross-role use is denied. |
| Host/provider/Handoff failure | No effect on the already atomic Nurture business decision. |

C-2f-3b evidence must cover schema constraints and migration preflight, every root/dependent cardinality, elapsed/effective Grant classification, typed Enrollment context dependencies, Enrollment-first lock conformance, terminal and writer races, exact replay and fresh duplicate classification, injected faults at every boundary, final zero-survivor assertions, privacy/retention boundaries, no remote commit dependency, and planning-only status. C-2f-3c following locks fresh re-entry, C-2f-4-0/1/2/3 lock portability classification, stage lifecycle, same-workspace visibility/concurrency, and the future cross-workspace protocol boundary, and the locked C-2f-5 contract fixes result/recovery/presenter/Host-effect semantics.

**C-2f-3c — Fresh re-entry and retained history (LOCKED)**

Re-entry is a newly consented care episode over the longitudinal child profile, never recovery of a terminal Enrollment:

1. Pilot re-entry covers return to the same Institution after terminal `family_withdrawn|institution_service_ended`. The target may be the same or another CareGroup in that Institution. Cross-Institution, cross-workspace, and next-stage continuity remain C-2f-4.
2. Exact Institution Admin starts from an owner-resolved historical Enrollment in Institution workbench, prepares a fresh unlinked RosterEntry, and reuses `initiate_enrollment` to issue a new seven-day Enrollment Invitation. Institution board is read-only. No `reactivate_enrollment`, `reopen_enrollment`, `reenroll`, automatic return, raw-id, Caregiver, Lead, Operator, service, Host, or AI path exists.
3. The exact invited recipient must remain a current Guardian of the predecessor ChildCareProcess and reuses `confirm_family_enrollment` from Guardian Chat, family board, or family workbench. Prior invitation receipt, Enrollment confirmation, terminal action, Grant ownership, join order, or relationship label confers no priority. A different current Guardian may act only after receiving that new exact invitation.
4. Child, ChildCareProcess, Family, Participant, and independently current Guardian RoleAssignments remain longitudinal. RosterEntry, Enrollment Invitation, five-minute submit context, CommandExecution, Enrollment, later Grant, and later Thread use fresh identities. Old relationship, authorization, work, audit, and technical identities never reopen, migrate, or become the new episode.
5. New Enrollment stores the sole one-way lineage pair: unique Restrict `predecessorEnrollmentId` plus `continuityKind=care_group_transfer|fresh_reentry`. Initial Enrollment stores both null, transfer stores `care_group_transfer`, and re-entry stores `fresh_reentry`. C-2f-3c supersedes the unimplemented `supersedesEnrollmentId` proposal; no second `reenteredFromEnrollmentId`, old-row successor mirror, branch, cycle, or dual SSOT is allowed.
6. A valid predecessor is the unique same-workspace/ChildCareProcess/Institution terminal lineage leaf, has fixed reason `family_withdrawn|institution_service_ended`, has complete C-2f-3b zero-survivor closure, has no successor, and has no `pending|active|paused` same-Institution Enrollment. Transfer-ended source, deleted/broken/ambiguous evidence, guessed latest/name/contact match, and cross-Institution predecessor fail closed for manual reconciliation.
7. The new invitation binds predecessor/version, `fresh_reentry`, new roster, target Group, exact recipient, expiry, and canonical hash. At most one effective pending re-entry invitation exists per predecessor. Reissue or target correction terminalizes the old invitation under C-2c. A generic first-enrollment invitation that later resolves the same process and Institution cannot bypass provenance; confirmation returns safe `state_not_actionable` until an exact re-entry invitation exists.
8. Re-entry owner resolution exposes only the predecessor ChildCareProcess for explicit Guardian confirmation. The recipient cannot choose another child or use the C-2b-1 new-profile branch. A noncurrent Guardian receives a safe unavailable result and must complete an independently current Co-Guardian path before a new exact re-entry invitation.
9. Target Institution and Group, exact Lead, policy, gates, capacity, recipient, predecessor, invitation, roster, lineage uniqueness, and absence of another current Enrollment are reread at submit. Old Group may be historical/archived, but target Group and Institution must be active and ready. No old field, cached presenter, invitation acceptance, or historical notification supplies current authority.
10. One transaction resolves exact replay; locks context/current Guardian, predecessor Enrollment, Institution/target Group, invitation, fresh roster, and lineage uniqueness in deterministic order; obtains database `T`; consumes context; creates one active Enrollment with `joinedAt=T > predecessor.leftAt`, `predecessorEnrollmentId`, and `fresh_reentry`; links the roster; consumes the invitation; and writes audit/Execution. The transaction changes no old row and creates no Grant, Thread, protected work, remote call, Handoff, Outbox, notification, or deep link.
11. Exact response-loss replay returns one new episode. Two Admins, two Guardians, same/different target Groups, reissue/cancel/confirm, generic/re-entry confirmation, and concurrent successor/current-Enrollment creation are first-commit-wins. Database uniqueness and expected versions prevent duplicate successor, partial roster link, consumed losing invitation, or false `already_enrolled` success.
12. Old and new Enrollments render as separate episodes. A normal entitled history view may show safe child label, Institution, Group, joined/left dates, terminal class, and historical/current classification, but not exact terminal actor, raw ids, free text, Grant/Thread existence, or protected refs. Old protected history continues current Family/role, original Grant, exact authorship, redaction, retention, and policy rules: eligible Guardians may retain allowed family-side facts; an eligible same-side Caregiver author may retain only allowed author-side facts; old cross-role bodies stay tombstoned. New Caregiver, Grant, Thread, route, cache, notification, provider retry, replay, or Technical Admin recovery cannot revive, merge, backfill, or deliver old facts.

The fresh re-entry matrix is:

| Case | Required outcome |
| --- | --- |
| Same Institution and same ready Group | Fresh roster/invitation/Enrollment episode; old identity remains terminal. |
| Same Institution and another ready Group | Fresh re-entry, not transfer, because the predecessor is already terminal. |
| Family withdrawal or Institution service end | Both terminal leaf classes may re-enter through new mutual onboarding. |
| Transfer-ended source with a successor | Ineligible as predecessor; use the current lineage leaf. |
| Another Institution or workspace | No C-2f-3c lineage; defer to C-2f-4. |
| Exact invited current Guardian | May explicitly confirm the exact predecessor process. |
| Different current Guardian | Requires a new invitation addressed to that Guardian. |
| Non-Guardian or alternate/new child | Unavailable; no profile creation, merge, or existence leak. |
| Generic invitation discovers historical same-Institution process | `state_not_actionable`; issue exact re-entry-bound invitation. |
| Existing pending re-entry invitation | Reissue/cancel lifecycle; no overlapping predecessor intent. |
| Exact replay after response loss | Same new roster/invitation/Enrollment/lineage/Execution result. |
| Competing successors or target Groups | First commit wins; loser has no consumed/linked/partial effect. |
| New first Grant after re-entry | Creates a new Enrollment Thread; no old Thread/content revival. |
| Historical view | Separate safe episode summaries plus independently authorized side-local history. |
| Stale old notification/deep link | Owner reread yields historical/tombstone/unavailable; no old action or resend. |

C-2f-3c evidence must cover action/surface aliases, every fresh versus retained identity, unified lineage schema/migration preflight, invitation provenance and lifecycle, exact predecessor and Guardian resolution, same/different Group targets, generic-invitation bypass denial, transaction faults, replay/successor races, safe history allowlists, side-local protected-body rules, old notification/open/retry behavior, no old authority revival, no remote commit dependency, and planning-only status. C-2f-4-0/1/2/3 now lock next-stage/cross-scope classification, stage lifecycle, same-workspace visibility/concurrency, and the future cross-workspace protocol boundary; C-2f-5 retains exact result/notification/Handoff/delivery ownership.

**C-2f-4-0 — Next-stage and cross-scope boundary/classification (LOCKED)**

1. `NurtureChildCareProcess` is the longitudinal child-scope spine only inside one workspace and only through current Family-owner resolution. A stage episode is a family-owned phase of that process. Enrollment is one Institution-local relationship episode. Workspace remains the hard privacy and local-identity boundary; none of these objects establishes a global child identity.
2. Active CareGroup movement inside one Institution remains C-2f-2 transfer. Return after terminal closure to the same Institution remains C-2f-3c fresh re-entry. `predecessorEnrollmentId + continuityKind` stays constrained to the same workspace/process/Institution and cannot become a cross-Institution movement ledger.
3. Entry to another Institution in the same workspace uses the ordinary fresh RosterEntry, seven-day Enrollment Invitation, exact current-Guardian confirmation, context, CommandExecution, and Enrollment flow against the exact Child/ChildCareProcess selected through current Family ownership. Different-Institution entry is neither transfer nor re-entry and cannot reuse old relationship identities.
4. Current Enrollments at separate Institutions may coexist. A new Institution confirmation never auto-ends, pauses, withdraws, replaces, or edits another Institution Enrollment. Leaving the old Institution is a separate owner-confirmed C-2f-3 command and transaction.
5. No old Institution Grant, Thread, Message, Receipt, Item, Attention, context, roster, role, policy, notification, Handoff, protected history, audit visibility, or authority carries to the new Institution. The new Institution cannot learn from its own onboarding or presenters that another Institution relationship exists.
6. A next-stage change keeps the same Child and ChildCareProcess and cannot create, move, pause, end, withdraw, or reactivate Enrollment. Institution observations, roster attributes, age, birthday, and AI inference may at most support a future Guardian-facing proposal and cannot commit the stage.
7. Stage change plus entry to another Institution is a composition of two separately authorized effects. They may commit in either order under current owner reread; neither effect authorizes, compensates, rolls back, or transactionally gates the other. No distributed move transaction is introduced.
8. Cross-workspace reuse, raw linking, fuzzy/global matching, and automatic Child/Process/Family/Enrollment/Grant/Thread/content/audit migration are Pilot `NO-GO`. The same My-Chat adult, child name, birth fact, contact, photo/media, family relation, or Institution roster is not proof of the same child and cannot trigger possible-match disclosure.
9. A future cross-workspace protocol, if separately authorized, must be versioned, explicitly consented, minimum-allowlisted, source-owner-reread, expiring, replay-safe, revocable, and audited; the protocol creates new target-local Child/Process identities, carries no authority, and makes no global identity claim. C-2f-4-0 neither designs nor implements that protocol.
10. Existing mutable `currentStageKey` remains an optional legacy/current projection, not stage-history authority. C-2f-4-1 must decide the versioned stage fact, exact Guardian command, transition/correction/history rules, and projection derivation before implementation.
11. C-2f-4-0 is planning-only and creates no schema, migration, action, handler, runtime, database, Handoff, notification, capability, or traffic effect. C-2f-4-1/2/3 now lock stage lifecycle, remaining same-workspace Institution privacy/concurrency, and future-protocol boundary detail; C-2f-5 retains result/recovery/presenter/Handoff/delivery.

The portability classification matrix is:

| Journey | Required classification |
| --- | --- |
| Same Institution, current Enrollment, another CareGroup | C-2f-2 transfer; new Enrollment under same-Institution lineage. |
| Same Institution after terminal closure | C-2f-3c fresh re-entry; fresh relationship episode under same-Institution lineage. |
| Another Institution in the same workspace | Independent fresh onboarding against family-selected Child/Process; no lineage or carryover. |
| Next stage only | Same Child/Process; separate family-owned stage effect; no Enrollment mutation. |
| Next stage and another Institution | Two independent owner-confirmed effects; no distributed transaction. |
| Concurrent Institution relationships | Allowed and isolated; one cannot reveal or mutate the other. |
| Leaving an old Institution after joining another | Separate C-2f-3 action; never an implicit consequence of new enrollment. |
| Same adult or similar child facts in another workspace | No match, reuse, merge, link, disclosure, or migration in Pilot. |
| Future cross-workspace portability | Separate protocol and authorization; target-local identity and zero authority carryover. |

C-2f-4-0 evidence must cover every classification row, same-Institution route preservation, fresh different-Institution onboarding, concurrent Enrollment isolation, no auto-exit, no cross-Institution lineage, zero authority/content/existence carryover, stage/Enrollment independence, both combined-operation orders and partial outcomes, every cross-workspace matching input, no possible-match disclosure, future-protocol absence, and planning-only status. C-2f-4-1/2/3 now lock stage lifecycle, same-workspace visibility/concurrency, and the future cross-workspace protocol boundary; C-2f-5 retains exact result/notification/Handoff/delivery ownership.

**C-2f-4-1 — Stage fact, Guardian authority, and lifecycle (LOCKED)**

1. Additive `NurtureChildCareStageEpisode` is the only canonical stage-history source. The Episode carries workspace/ChildCareProcess, positive catalog version, stable coarse key, optional allowlisted fine key, current/closed lifecycle, nullable unique predecessor, transition class, database times, exact confirming Guardian/RoleAssignment/CommandExecution, close Execution/reason, and aggregate version. No Host, Institution, provider, free-text, or medical authority field is stored.
2. The stable coarse v1 vocabulary is `pregnancy|age_0_1|age_1_3|age_3_6|age_6_9|age_9_12|age_12_15|age_15_18`. Optional fine keys use the same versioned allowlist and preserve pregnancy preparation/early/mid/late, postpartum-newborn transition, newborn, infant, toddler, preschool, school entry, primary school, early adolescence, middle school, and high school distinctions. Free-form, Institution/classroom, Enrollment-state, and diagnostic keys are invalid.
3. Coarse/fine keys express family-confirmed developmental context, not diagnosis, birth/legal-age proof, actual school attendance, or Institution membership. Catalog compatibility is validated. A new catalog version never reinterprets old rows; changed meaning requires an explicit new Guardian-confirmed Episode.
4. At most one Episode is `current` per process. Each predecessor has at most one successor; every link stays in the same workspace/process and forms one acyclic database-time-ordered chain. First set uses `initial` with no predecessor. A set after explicit clear uses `set_after_clear` and links the cleared leaf.
5. Current Episode has null end fields. Closed Episode has database `endedAt`, exact `endedByExecutionId`, and fixed `terminalReason=stage_changed|guardian_corrected|guardian_cleared`. Normal change closes the current leaf and creates one `stage_changed` successor at one database `T`; correction closes the leaf with correction evidence and creates one `guardian_correction` successor; clear closes the leaf without forcing a replacement. Closed rows never reopen.
6. `NurtureChildCareProcess.currentStageKey` is only a nullable denormalized projection of the sole current Episode coarse key. Episode and Process projection/version update in the same transaction. Authorization, history, and provenance never trust the projection alone; missing/duplicate Episode, mismatch, or broken lineage fails closed for owner reconciliation.
7. Existing non-null `currentStageKey`, profile snapshots, age/birthDate, pregnancy results, context materials, and Institution roster facts cannot be migrated into a confirmed Episode without exact Guardian/Execution provenance. Legacy unproven values are quarantined for current-Guardian reconfirmation rather than guessed or backfilled. Null remains a valid unset state.
8. Any current exact-Family Guardian may independently set, change, correct, or clear stage. Grant ownership, invitation receipt, process creation, join order, primary/first label, relationship label, or Co-Guardian unanimity provides no extra authority. Institution Admin, Caregiver, Lead, Operator, service identity, Host admin, AI, age clock, birthday, roster, Enrollment, and projection are denied.
9. Guardian Chat, family board, and family workbench use exactly `update_child_care_stage -> nurture.family_care.update_child_care_stage`. No advance/automatic/Institution/pregnancy-handler/raw-id/correction-bypass alias exists. A process may remain unset.
10. A five-minute `submit_action` context binds exact actor/role/Family/Process, Process and current Episode ids/versions or explicit unset state, operation `set|change|correct|clear`, target catalog/coarse/fine tuple when applicable, action/surface, and canonical consequence hash. Review shows old/new or clear, retained audit/history, non-diagnostic meaning, and no Enrollment/Institution effect. Client submission contains only the opaque context and explicit confirmation.
11. One Serializable transaction resolves exact replay; locks context/current Guardian/Family/Process/current Episode and predecessor uniqueness; rereads owner/process/catalog state; validates expected versions; obtains database `T`; consumes context; closes and creates at most one successor as required; updates Process projection/version; and persists audit/Execution. No Enrollment, Grant, Thread, artifact, Host call, Handoff, Outbox, notification, or deep link participates.
12. Exact response-loss replay returns the original outcome. A fresh exact same-stage command is `already_satisfied` without new Episode/version/audit. Two Guardians and change/correct/clear combinations are first-commit-wins; stale losers reread and reconfirm. Pilot cannot backdate or edit old keys/start times, correct a noncurrent historical Episode, branch lineage, or synthesize elapsed stages.
13. Existing artifacts/materials keep their original stage snapshot and provenance; current reasoning may mark them stale only through the owning policy. `evaluate_pregnancy_stage` remains a deterministic non-medical guidance handler and cannot write or confirm StageEpisode.
14. Stage commit creates no Enrollment, transfer, withdrawal, Grant, Thread, Institution visibility, Host seed, or delivery. C-2f-4-2 locks family/Institution visibility and concurrent Enrollment reads; C-2f-4-3 now locks the future cross-workspace protocol boundary, and C-2f-5 owns exact result, presenter, notification, Handoff, and recovery. C-2f-4-1 remains planning-only.

The stage lifecycle matrix is:

| Case | Required outcome |
| --- | --- |
| No current stage and Guardian does nothing | Remains unset; no default or inferred Episode. |
| First explicit set | One `initial` current Episode and matching coarse projection. |
| Exact same catalog/coarse/fine value | `already_satisfied`; no new history or version. |
| Normal stage change | Old leaf closes as `stage_changed`; one successor becomes current at the same database time. |
| Current-stage correction | Old leaf closes as `guardian_corrected`; corrected successor is explicit and auditable. |
| Explicit clear | Current leaf closes as `guardian_cleared`; no current Episode and projection becomes null. |
| Set after clear | New `set_after_clear` successor links the cleared leaf. |
| Two Guardians from one version | First commit wins; stale loser rereads/reconfirms. |
| Age, birthday, roster, Institution, AI, pregnancy handler | Suggestion/guidance only; zero canonical write. |
| Projection mismatch or unproven legacy key | Fail closed and require owner reconciliation/reconfirmation. |
| Old artifact created under prior stage | Retains original provenance; no rewrite or retroactive relabel. |
| Enrollment or Institution view | No mutation or implicit disclosure from stage commit. |

C-2f-4-1 evidence must cover schema/catalog/lineage constraints, every coarse and fine-key class, equal Guardian and denied-actor permutations, exact surface/action/confirmation binding, unset/initial/change/correction/clear/set-after-clear, duplicate/replay/races, transaction faults, projection/preflight mismatch, no heuristic migration, no age/pregnancy/Institution inference, unchanged downstream artifacts, zero Enrollment/Host/visibility effect, and planning-only status. C-2f-4-2/3 now lock multi-Institution visibility/concurrency and the future cross-workspace protocol boundary; C-2f-5 retains exact result/notification/Handoff/delivery ownership.

**C-2f-4-2 — Same-workspace multi-Institution visibility and concurrency (LOCKED)**

1. A current exact-Family Guardian may start from one owner-resolved ChildCareProcess and aggregate the family-owned StageEpisode timeline plus every current or historical Enrollment episode safe summary. The allowlist is Guardian-confirmed child label, Institution, CareGroup, joined/left database times, current/historical classification, Enrollment status, and terminal class. Raw ids, terminal actor, free text, internal audit, Grant/Thread refs, protected refs, and technical state remain absent.
2. Family aggregation is navigation/presentation only. Every protected Message, Grant, Thread, Receipt, Item, care log, media fact, and historical body stays under its original Enrollment and current Family/role, original/current Grant, authorship, redaction, retention, and policy. The family view cannot merge Threads, move content, create shared Grants, or use one Institution episode to authorize another.
3. Institution Admin and Caregiver queries start from a current exact Institution/CareGroup RoleAssignment and include workspace, Institution, and allowed CareGroup predicates in the repository query before row materialization. Querying every Enrollment by ChildCareProcess and filtering later in controller, service, presenter, or client code is forbidden.
4. Exact Institution Admin may see only its Institution's safe current/historical roster and Enrollment summaries plus allowlisted Grant coverage metadata. Caregiver/Lead sees only currently assigned CareGroups, safe roster, and independently Grant-authorized work. Technical Operator sees bounded refs-only evidence and no stage, protected body, or cross-Institution relationship graph.
5. Other-Institution existence is protected. Institution-local rows, counts, pagination totals, sort keys, duplicate/conflict classification, empty/error/unavailable copy, timing class, logs/metrics, raw Child/Process ids, routes, and opaque tokens cannot vary in a way that reveals another Institution Enrollment, Group, stage, Grant, or content. Institution-scoped scenario tokens cannot be compared or replayed across Institutions.
6. Enrollment confirmation and roster membership expose no StageEpisode, `currentStageKey`, coarse/fine stage, history, or stage-derived label. Pilot registers no `child_development_stage` or equivalent dataClass, and the current `family_care_question` Grant grants no stage access. Future Institution stage use requires a separate explicit dataClass/Grant decision.
7. Current Enrollment uniqueness remains per `(workspaceId, childCareProcessId, institutionId)` across current-conflicting statuses. No global per-process current uniqueness exists. Different Institutions may independently onboard, pause/resume, transfer inside themselves, withdraw/end, and change Grant or policy. An Institution effect cannot mutate, invalidate, authorize, or disclose another Institution relationship.
8. Shared ChildCareProcess locks may serialize operations for current identity/family/process-lifecycle reread but cannot create a cross-Institution business conflict. Enrollment commands bind current Family ownership, Process lifecycle, target invitation/roster/Institution/Group/Enrollment, and consequence-relevant versions. An unrelated StageEpisode or `currentStageKey`-only version change cannot alter or invalidate Enrollment outcome. A real shared Family-owner or Process lifecycle change remains a valid fail-closed dependency.
9. Stage update and different-Institution Enrollment may commit in either order or concurrently. Onboarding takes no stage snapshot and exposes no stage. Institution A lifecycle/Grant/policy races with Institution B remain independent; no distributed lock, compensation, combined CommandExecution, or all-or-nothing cross-Institution transaction is allowed.
10. Every family and Institution list, detail, action, and deep-link open owner-rereads current role, scope, Process lifecycle, exact Enrollment, Grant/policy, and source lifecycle. Cached roster/process/stage/other-Institution data is never authority. A failed or stale family segment renders generic unavailable for that episode without cached substitution or preventing independently current episodes from rendering.
11. Another Institution raw id/token, removed role, and target mismatch map to generic unavailable or permission-safe output before sensitive lifecycle classification. Error bodies, metrics, logs, traces, and pagination cannot disclose another Institution or a child match. Technical reconciliation requests owner action and cannot edit visibility or business facts.
12. C-2f-4-2 creates no cross-Institution projection, dataClass, action, route, Handoff, notification, shared ledger, schema implementation, database, or traffic effect. C-2f-4-3 now locks the future cross-workspace protocol boundary; C-2f-5 owns exact result, recovery, presenter route, notification, Handoff, and delivery.

The visibility and concurrency matrix is:

| Case | Required outcome |
| --- | --- |
| Current Guardian family timeline | Safe StageEpisode plus safe Enrollment episode aggregation across the exact process. |
| Protected family history | Re-evaluated per original Enrollment/Grant/role; never merged. |
| Institution Admin own Institution | Safe own roster/current/history plus allowlisted Grant coverage only. |
| Caregiver own current CareGroups | Safe roster and independently granted work only. |
| Technical Operator | Refs-only evidence; no business body, stage, or relationship graph. |
| Another Institution exists or changes | Institution-local output and error surface remain noninterfering. |
| Enrollment/roster without Grant | No stage or protected-content visibility. |
| Two current different-Institution Enrollments | Allowed and independently lifecycle-managed. |
| Stage update races with Enrollment | Independent outcomes; no stage snapshot, topology conflict, or distributed rollback. |
| Institution A races with Institution B | Independent effects; shared lock may serialize but not couple outcomes. |
| Shared Family owner or Process lifecycle becomes invalid | Every affected scope fails closed without another-Institution disclosure. |
| One family timeline segment is stale/unavailable | Generic unavailable for that episode; no cache fill; other current episodes remain independent. |
| Cross-Institution id/token/error probe | Generic denial before sensitive lookup; no existence signal. |

C-2f-4-2 evidence must cover current-Guardian aggregation allowlists, protected-history per-episode authorization, repository query shape, every Institution/CareGroup/Operator actor scope, output/count/error/id/token noninterference, zero stage/dataClass visibility, per-Institution uniqueness, A/B onboarding/lifecycle/Grant/policy concurrency, exact semantic dependencies, stage/Enrollment composition, stale segment degradation, current owner reread, cross-scope denial, and planning-only status. C-2f-4-3 now locks the future cross-workspace protocol boundary; C-2f-5 retains exact result/notification/Handoff/delivery ownership.

**C-2f-4-3 — Future cross-workspace protocol boundary (LOCKED)**

1. Pilot keeps every cross-workspace child lookup, candidate search, fuzzy/global match, identity reuse, raw link, profile import, portability token, route, capability, and executable protocol path disabled. The C-2f-4-3 contract constrains a separately authorized future version and does not enable portability.
2. A future v1 is a copy-and-reconfirm flow, not child identity migration, workspace merge, identity federation, custody transfer, or proof of one global Child. Future v1 is restricted to the same My-Chat adult independently authenticated in the exact source and target workspaces. Cross-adult transfer is a separate future Co-Guardian/data-sharing protocol.
3. Any current exact-source-Family Guardian may independently issue or revoke a pending export. First/primary labels, creator, relationship, Grant ownership, invitation history, or unanimity add no authority. Institution Admin, Caregiver/Lead, Technical Operator, service/Host admin, AI, and raw-id callers are denied.
4. Target completion requires reauthentication of the bound same adult, current target-workspace eligibility, and a five-minute strong-confirmation context. One target transaction creates fresh local Child, ChildCareProcess, Family, first Guardian RoleAssignment, and CommandExecution. Source ids, relationship metadata, and authority never cross; target relationship metadata is separately confirmed local input.
5. V1 always creates a new target-local aggregate and cannot search, suggest, select, attach to, overwrite, deduplicate, reconcile, or merge an existing target profile. Confirmation states that a user who already created the same child's target profile must stop. Any future target-local reconciliation is separately authorized and never a Technical Operator edit.
6. The complete v1 allowlist is required Guardian-confirmed child `displayName` and optional `birthDate`. BirthDate is unselected by default and needs explicit source inclusion plus exact target review. The immutable versioned snapshot binds selected names, values, the source Child aggregate version, and canonical hash; current selected-value change, aggregate-version drift, or redaction before consume makes the snapshot stale.
7. `profileBasicsPayload`, `careContextSummary`, `careContextPayload`, StageEpisode/currentStageKey/history, relationship/Guardian/account/contact data, Institution/CareGroup/Roster/Enrollment/lineage, Grant/Thread/Message/Receipt/Item/Attention, care/media/pregnancy/health/material, notification/Handoff, audit body, raw id, and technical state are forbidden. Target stage starts unset until a target Guardian independently confirms the target-local stage.
8. A future Intent binds protocol version, source workspace/Family/Child/Process/Guardian, exact target workspace, opaque same-adult Host recipient, selected-field allowlist/hash plus source Child aggregate version, issue time, seven-day expiry, lifecycle, audit, and bounded protocol correlation. Persisted lifecycle is `pending|consumed|revoked|superseded`; expiry is database-time derived. Changed target/recipient/field/value/source-aggregate-version/expiry requires supersede plus a new identity.
9. Raw token is absent from persistence and logs. The opaque single-use token is target-workspace, recipient, protocol-version, purpose, and expiry bound and cannot be compared across workspaces, forwarded as bearer authority, or reused for another target. Target business rows expose no source raw id or stable global child key.
10. Issue, open, review, confirm, replay, and revoke owner-reread source Host/Nurture identity, current Guardian/Family/Child/Process, selected values and Child aggregate version/lifecycle, Intent/policy/expiry, same-adult Host attestation, target eligibility, and target confirmation context as applicable. Authority loss, disable/delete/redaction, selected-value or aggregate-version drift, mismatch, expiry, or policy denial fails before target creation with generic unavailable output.
11. Any current exact-source-Family Guardian may revoke a pending Intent. Revoke versus consume has one authoritative Nurture-owned linearization point; first commit wins. A pre-consume revoke/expiry/redaction/policy denial creates no target facts. A consumed result cannot later be rewritten as revoked.
12. Future consumption is idempotent across response loss and partial technical failure. One consumption identity creates at most one target aggregate; exact retry recovers the same target result and changed target/payload/recipient conflicts. A bounded Nurture portability ledger owns snapshot, consume/replay decision, target correlation, and reconciliation evidence.
13. After target commit, copied values are independent target-local Guardian-owned facts. Source revoke, redaction, role loss, workspace closure, or deletion cannot distributed-delete or mutate them. Target Guardian manages target correction/deletion under target policy, and both confirmation surfaces disclose the no-recall boundary before commit.
14. My-Chat owns raw adult account/session authentication, workspace access, opaque same-adult recipient binding, and refs-only transport. Nurture owns business authorization, allowlisted snapshot, lifecycle, consume/replay, target creation, and safe audit. Workflow Step, Handoff Ledger, Outbox, notification, provider payload, and Admin controls cannot carry portability bodies, assert child identity, or become commit authority. C-2f-4-3 remains planning-only; C-2f-5 owns current-Pilot results/surfaces/Handoff without activating portability.

The future-protocol boundary matrix is:

| Case | Required outcome |
| --- | --- |
| Current Pilot cross-workspace attempt | Generic unavailable; no lookup, candidate, token, route, or write. |
| Same adult authenticated in both workspaces | Necessary but insufficient; both Nurture scope checks and target confirmation still apply. |
| Another adult or forwarded token | Denied; cross-adult sharing is outside v1. |
| Current source Guardian issues | Seven-day immutable target-bound Intent in a future version only. |
| Another current source Guardian revokes pending | Allowed; equal Guardian authority, first commit wins against consume. |
| Target confirms | Fresh target-local aggregate only; no source authority or identity reuse. |
| Target profile already exists | User stops; no search, selection, merge, overwrite, or Operator repair. |
| Display name selected | Required Guardian-confirmed field may be copied. |
| Birth date selected | Optional explicit source selection and target review; otherwise absent. |
| Stage/history/Institution/protected body | Excluded and rejected. |
| Source field changes or redacts before consume | Snapshot stale; no target write. |
| Response lost after target commit | Exact replay recovers the same target result. |
| Source revokes after consume | Cannot recall or mutate target-local facts. |
| Invalid/wrong-workspace/expired token | Generic unavailable with no child or workspace match signal. |
| Existing Workflow Handoff/Outbox | Refs-only and never portability payload or business authority. |

C-2f-4-3 evidence must cover current Pilot absence, same-adult dual authentication without identity inference, equal source-Guardian issue/revoke, every denied actor, fresh target aggregate atomicity, no target matching/merge, exact field allowlist/defaults/review, forbidden payloads, seven-day Intent/five-minute context, opaque target binding, raw-token absence, every owner reread and stale gate, revoke/consume races, exact replay/fault recovery, post-import no-recall semantics, Host/Nurture ownership, Handoff/Outbox denial, privacy noninterference, and planning-only status. The locked C-2f-5 contract fixes current result/recovery/surface/Handoff behavior without activating portability.

**C-2f-5 — Lifecycle result, recovery, surfaces, and Host effect (LOCKED / COMPLETE)**

1. The persisted immutable business result is `businessOutcome=applied|already_satisfied`. The response-only transport classification is `disposition=executed|replayed`. The current owner presenter independently reports `changed|already_current|processed_but_unavailable`. These layers cannot be collapsed: a later duplicate/replay caller never becomes the performer, owner, approver, or joint consenter of the original effect.
2. Exact versioned `outputRefs` contain only direct command roots/results and remain server-side recovery evidence. They never enter client envelopes, URLs, route state, Host Chat history, Notification, Handoff, analytics, metrics/query dimensions, or search filters. There is no `open_result` token or result-by-ref route.
3. Pause output is Enrollment plus active Hold; resume is Enrollment plus released Hold; duplicate pause is Enrollment plus the existing active Hold; duplicate resume without a referencable Hold is Enrollment only. Transfer propose/cancel/decline is source Enrollment plus TransferIntent; confirm adds consumed Intent, both Enrollments, and both RosterEntries. Family withdrawal/Institution end is terminal Enrollment plus exact historical RosterEntry. Re-entry confirmation is new Enrollment/RosterEntry plus consumed Enrollment Invitation. Stage set/change/correct is Process plus resulting current Episode; clear is Process plus closed Episode; already-unset is Process only. Portability has no current command/result.
4. Grant/Thread/Hold lists, Message/Receipt/Item/Attention, cascade dependents, and audit refs are excluded from `outputRefs`. Technical evidence follows the owning Execution/audit and cannot become user visibility.
5. `enrollment_lifecycle_current`, `enrollment_transfer_current`, `enrollment_confirmed`, and `child_care_stage_current` are the canonical current owner presenters. Chat renders a generic result card; Family board renders current/recent; Family workbench renders complete authorized history/complex actions; Institution board is current aggregate read-only; Institution workbench owns Institution topology command/history; Notification is generic; Technical Admin is refs-only.
6. Cross-surface continuity carries only `route_class + view_mode=current|recent|history`. No business/output ref, prior action/result, raw filter, body, or context crosses surfaces. The destination authenticates and rereads current owner state.
7. Stable command-id Execution lookup occurs before consumed/expired-context rejection. Compatible replay validates original Execution, canonical hash, caller, and original durable-Step provenance, returns original outcome/refs with `disposition=replayed`, then invokes the current presenter. Changed input/caller/Step conflicts. A lost command id falls back only to the ordinary current presenter; the fallback cannot create a probe Execution or infer historical performance.
8. Deterministic precommit denial writes no Execution. Retryable local transaction or owner outage can retry only within the original five-minute context. Presenter/network/worker/Step/Handoff/Outbox/provider failure after business commit never compensates, deletes, reopens, rewrites, or conceals the Nurture fact. Same-Step reclaim may finish once; wrong-Step replay is denied.
9. Existing `handoff_key=user_attention`, purpose `user_attention`, and sources `family_care_message|child_link_receipt|family_care_item` are pinned and cannot be widened or reused for Enrollment lifecycle.
10. A future additive `guardian_relationship_attention` planning contract is limited to purposes `review_enrollment_transfer|enrollment_relationship_changed` and source types `enrollment|enrollment_transfer_intent|guardian_role_assignment`. The contract is absent from the current manifest/registry/capability and remains default-off until separately implemented/adopted/validated across Base, My-Chat, and Nurture.
11. Transfer proposal snapshots one draft per current exact-Family Guardian RoleAssignment. Family withdrawal targets only other current Guardians and excludes the actor. Institution service end targets all current Guardians. Pause/resume, transfer cancel/decline/confirm, fresh re-entry confirmation, every stage mutation, and portability create no lifecycle Handoff; initial/re-entry invitation retains the existing Host Enrollment Invitation path.
12. Recipient membership is captured at business commit. Later-added Guardians do not receive an old event; lost/suspended/exited recipients stop on current owner reread. No eligible recipient produces explicit `[]`. One stable key exists per target RoleAssignment, exact replay returns identical snapshots, transfer review expires no later than its Intent, and termination attention expires after seven days or the earlier Pilot allowlist cutoff.
13. A non-empty-capable path is Host-first and requires a durably persisted, currently claimed original My-Chat Step before the first Nurture commit. Missing trusted provenance fails before commit. Same-Step reclaim may materialize once; wrong-Step, recipient/source/expiry mutation, after-the-fact replay-seed invention, raw claim-token persistence/logging, and Admin-created drafts are forbidden. Delivery failure never rolls back business facts.
14. Provider copy is generic, for example `有一项托育关系更新待查看`, and carries only My-Chat `notification_id`. Provider copy contains no child/Institution name, body, target, relationship/action state, business ref, or Nurture context. Opening validates exact My-Chat user/workspace/Notification before a Nurture call, then eligible Handoff, current Nurture owner resolver, destination-bound `open_notification`, and destination reread. Wrong user/workspace/id is generic unavailable with no Nurture call. Host read/unread and provider delivery never become Nurture lifecycle.

The current Host-effect matrix is:

| Lifecycle event | Current/future effect boundary |
| --- | --- |
| Family/Institution pause or resume | Explicit `[]`. |
| Transfer proposal | Future additive relationship-attention draft per current exact Guardian RoleAssignment. |
| Transfer cancel/decline/confirm | Explicit `[]`; an existing proposal open renders current state. |
| Family withdrawal | Future additive relationship-attention draft to other current Guardians only. |
| Institution service end | Future additive relationship-attention draft to all current Guardians. |
| Initial/fresh re-entry invitation | Existing Host Enrollment Invitation path. |
| Fresh re-entry confirmation | Explicit `[]`, preserving C-2d-4. |
| Stage set/change/correct/clear | Explicit `[]`, preserving C-2f-4-1. |
| Cross-workspace portability | No current command/Handoff. |

The recovery matrix is:

| Case | Required outcome |
| --- | --- |
| First commit returns normally | `businessOutcome` plus `disposition=executed`, then current presenter. |
| Response lost after commit | Original Execution/same Step returns original refs/outcome with `disposition=replayed`; one business effect. |
| Same command id, changed input/caller | Conflict; no second effect or information disclosure. |
| Another Step attempts replay | Denied; no ownership transfer. |
| Original command id unavailable | Ordinary current presenter only; no probe or historical actor claim. |
| Current owner read denied after commit | `processed_but_unavailable`; no cached object/body. |
| Presenter/Handoff/provider fails | Business fact remains committed; technical path retries/stops independently. |
| Recipient role lost before open | Generic unavailable after current owner reread. |

C-2f-5 evidence must cover every result vocabulary combination, exact output-ref codec, ref non-disclosure, four presenters on every entitled surface, route-only navigation, stable Execution lookup ordering, response loss at each post-commit seam, same-Step/wrong-Step behavior, lost-command-id fallback, precommit denial, pinned legacy `user_attention`, absent/default-off future additive contract, exact Host-effect/recipient/expiry matrix, original-Step provenance, notification privacy/open ordering, current owner reread, and planning-only scope. C-2f is complete as a decision contract; no manifest, registry, contract package, source, schema, migration, route, runtime, capability, database, environment, provider, or traffic changed. C-3 Guardian/Caregiver operational IIB is next, and C-4 Institution IIB/closure evidence remains open.

## Minimum IIB closure before real traffic

1. Authenticated institution onboarding/control plane for institution, care group, participant mapping, role assignment, child process, enrollment, thread, grant, revoke, and cohort disablement; all authoritative writes use the Nurture CommandExecution kernel.
2. Guardian UX for explicit grant review, question submission, sent/blocked/replied receipt state, reply display, and revoke with clear consequence/retention text.
3. Teacher mobile/web UX for class inbox, attention board, item detail, acknowledge, reply, current-scope re-resolution, empty/error/permission states, and no direct cross-family chat.
4. Owner-reread on every open and action; workspace, role, care group, enrollment, grant, exact Thread/receipt lifecycle, redaction, and current policy remain fail-closed, while optional ThreadParticipant projection neither grants nor denies business permission.
5. Authenticated My-Chat shell routing and negative tests for cross-workspace, cross-child, stale notification, revoked grant, and disabled cohort.
6. Manual journey evidence for onboarding → question → attention → acknowledge/reply → family receipt → revoke, on the exact pilot artifact and topology.

## Success and stop contract

### Success criteria

Pilot-4 may recommend continuation only when all of the following hold for the complete observation window:

- every participating guardian can submit at least two eligible questions and see the current receipt/reply without operator database intervention;
- the caregiver can triage, acknowledge, and reply across at least two child scopes from the aggregated board without entering a direct family chat;
- every accepted write has one CommandExecution/business effect, one original-Step replay owner, at most one Handoff, and at most one logical notification delivery;
- revoke, redaction, disabled cohort, and stale deep-link opens fail closed on current owner reread;
- every retry/dead-letter/manual-review case is visible to the named operator and resolved through an allowlisted action or explicitly stopped;
- the observation record contains latency, retry/replay, context-ref count, LLM-call/cache count, manual intervention, and product-completion evidence without business bodies or claim material in telemetry;
- backup restore, credential rotation, owner outage, and capability kill-switch rehearsals pass on the approved topology.

### Immediate stop criteria

Any one of these stops new pilot writes immediately and triggers the kill switch:

- cross-workspace, cross-child, cross-family, or unauthorized-role disclosure;
- revoked/redacted/cancelled content remains readable after current owner reread;
- duplicate Nurture business effect, wrong-Step replay acceptance, duplicate Handoff, or non-idempotent delivery;
- claim token, protected body, attachment, or forbidden identity/driver material appears in logs, Outbox, Handoff, notification, or My-Chat persistence;
- the workspace allowlist cannot isolate the pilot cohort or the capability cannot be disabled without changing committed Nurture facts;
- unrecoverable database integrity/drift, missing backup, loss of audit evidence, or an owner outage that does not fail closed;
- any health content is treated as diagnosis, prescription, emergency replacement, or medication advice.

Product friction, latency, or provider failure that does not create a privacy/integrity breach pauses the affected journey and enters operator review; such a failure does not justify bypassing policy or editing business state directly.

## Rollback evidence required before Pilot-2

- Two-key kill switch demonstrated: remove workspace allowlist first, then disable environment capability; both prevent new activation.
- Existing Nurture message/item/receipt/Execution facts remain intact and auditable; rollback never rewrites or deletes them.
- Requested/failed Handoffs are stopped or reconciled through My-Chat owner actions; Admin never edits Nurture facts.
- Notification/deep-link opens after rollback return unavailable through current Ledger + Nurture reread.
- Both databases have tested backup/restore and forward-migration procedures; no distributed rollback is required.
- Service token rotation and revocation are demonstrated without persisting or logging the token.

## Pilot-0 checkpoints

| Checkpoint | State | Exit evidence |
| --- | --- | --- |
| Pilot-0-A — baseline and actual-capability audit | **Complete** | Exact revisions/hashes reverified; executable capability, runtime composition, IIB, provisioning, delivery, security, and observability gaps classified. |
| Pilot-0-B — cohort, role, surface, and data lock | **Complete** | B1/B2 and B3-0 through B3-4 are locked: internal topology/accounts, surface/action/continuity/business semantics, four representative journeys, layered fault/privacy coverage, and explicit exit evidence. |
| Pilot-0-C — IIB and onboarding closure contract | **In progress — C-2 complete** | C-2f-5 completes child/family/enrollment/Grant planning with exact result/recovery/presenter/Host-effect semantics and preserves all prior explicit-empty and ownership boundaries. C-3 Guardian/Caregiver operational IIB is next; C-4 Institution IIB/closure evidence remains open. |
| Pilot-0-D — topology, operations, success/stop/rollback contract | **Proposed** | Isolated pilot topology, two-key allowlist, five-day window, ownership, recovery, stop, and rollback terms accepted. |
| Pilot-0-E — final Go/No-Go | **Pending** | Blocker owners and implementation nodes assigned; Pilot-0 evidence reviewed. Only then may the user separately authorize Pilot-1. |

Pilot-0 is not complete while Pilot-0-C through Pilot-0-E remain unresolved. The current decision is deliberately **NO-GO for external traffic** and **GO for readiness decisions only**.
