# Pilot Readiness — Institution Ecology

## Status and authorization

- **Review date:** 2026-07-16
- **Current checkpoint:** Pilot-0-B in progress; B3-2 cross-surface continuity complete through B3-2d
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
| B3-3 business path and data envelope | OPEN | Exact `family_care_question` fields, exclusions, grant directions, and lifecycle. |
| B3-4 representative journey coverage | OPEN | Adapter coverage and the minimum cross-surface E2E matrix. |

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
5. Caregiver reply submission from Chat and teacher board MUST converge on `nurture.family_care.reply_item`. The command rechecks caregiver role, care-group reachability, enrollment, thread membership, grant `org_to_family`, source/item lifecycle, expected version, and current policy.
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

Guardian enrollment/grant action contracts are distinct:

| Locked `action_key` | Planned authoritative `command_key` | Mandatory effect boundary |
| --- | --- | --- |
| `confirm_family_enrollment` | `nurture.family_care.confirm_enrollment` | Guardian confirms the current proposed child/family enrollment; no grant is created implicitly. |
| `confirm_child_link_grant` | `nurture.family_care.confirm_grant` | Creates/confirms the first current grant from an explicit reviewed authorization under current enrollment. |
| `replace_child_link_grant` | `nurture.family_care.replace_grant` | Creates a new grant identity/version under current policy; never reactivates a revoked grant. |

The existing `revoke_child_link_grant` mapping remains `nurture.family_care.revoke_grant`. A same-definition current grant MAY return `already_satisfied`; a changed scope/direction/data-class contract requires `replace_child_link_grant`. Enrollment confirmation, grant confirmation, grant replacement, and grant revoke remain separate commands, expected-version boundaries, and audit events.

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
| `close_enrollment` | `nurture.institution.close_enrollment` |
| `update_institution_policy` | `nurture.institution.update_institution_policy` |
| `update_care_group_policy` | `nurture.institution.update_care_group_policy` |

Invitation is the deliberate cross-owner exception:

1. Institution-workbench `initiate_participant_invitation` maps to the planned Host identity command `my_chat.workspace_invitation.create`; the Host command is not a Nurture `CommandExecution` and cannot bind a raw My-Chat user id.
2. My-Chat owns invitation delivery, authentication, acceptance, expiry, and canonical account/workspace membership. Acceptance is not an Institution-admin surface action.
3. After My-Chat records acceptance, an authenticated owner callback invokes planned `nurture.institution.bind_accepted_participant` with a canonical accepted-user ref and invitation correlation. The callback is not advertised as a user `action_key` and cannot accept on the user's behalf.
4. Staff-role assignment remains a separate institution-admin command after participant binding. Identity acceptance never grants a Nurture role implicitly.

The lifecycle mapping has no generic `upsert_*` or `change_*_state` action. Create/update/suspend/resume/close remain separate keys with separate allowed-state, expected-version, authorization, and audit rules. `resume_*` applies only to a currently suspended object after revalidation; `close_*` is terminal in Pilot-0. The scoped Pilot business-disable action uses `suspend_care_group`, and recovery uses `resume_care_group`; no second Nurture Pilot-enablement aggregate or reversible client toggle is introduced. My-Chat environment capability/workspace allowlist remain separate technical gates.

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

The remaining rows are recommendations until their Pilot-0-B decision is explicitly accepted.

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
| Data | Text question only, no attachment, no health observation, no media, no daily-care log, no batch import. `requires_ack=true`, `requires_reply=true`, immediate route. |
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

## Minimum IIB closure before real traffic

1. Authenticated institution onboarding/control plane for institution, care group, participant mapping, role assignment, child process, enrollment, thread, grant, revoke, and cohort disablement; all authoritative writes use the Nurture CommandExecution kernel.
2. Guardian UX for explicit grant review, question submission, sent/blocked/replied receipt state, reply display, and revoke with clear consequence/retention text.
3. Teacher mobile/web UX for class inbox, attention board, item detail, acknowledge, reply, current-scope re-resolution, empty/error/permission states, and no direct cross-family chat.
4. Owner-reread on every open and action; workspace, role, care group, enrollment, grant, thread membership, receipt, redaction, and current policy remain fail-closed.
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
| Pilot-0-B — cohort, role, surface, and data lock | **In progress — B3-2 complete** | B1/B2/B3-0/B3-1 and B3-2a-d are locked. B3-3 business/data envelope and B3-4 journey coverage remain open. |
| Pilot-0-C — IIB and onboarding closure contract | **Proposed** | Minimum guardian/teacher/admin journeys and authenticated action boundaries accepted. |
| Pilot-0-D — topology, operations, success/stop/rollback contract | **Proposed** | Isolated pilot topology, two-key allowlist, five-day window, ownership, recovery, stop, and rollback terms accepted. |
| Pilot-0-E — final Go/No-Go | **Pending** | Blocker owners and implementation nodes assigned; Pilot-0 evidence reviewed. Only then may the user separately authorize Pilot-1. |

Pilot-0 is not complete while Pilot-0-B through Pilot-0-E remain unresolved. The current decision is deliberately **NO-GO for external traffic** and **GO for readiness decisions only**.
