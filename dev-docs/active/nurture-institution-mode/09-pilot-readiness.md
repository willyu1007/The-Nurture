# Pilot Readiness — Institution Ecology

## Status and authorization

- **Review date:** 2026-07-16
- **Current checkpoint:** Pilot-0-B in progress; decisions through B3-1d-0 locked
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
| B3-1 action availability by surface | **IN PROGRESS — THROUGH B3-1d-0 LOCKED** | Guardian, Caregiver, and Institution matrices plus action-key layering are locked; operator permissions, remaining exact mappings, and unavailable reasons remain open. |
| B3-2 cross-surface continuity | OPEN | Transition, opaque token, notification/deep-link, and owner-reread rules. |
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
| B3-1d Technical/operator and action-key mapping | **IN PROGRESS — B3-1d-0 LOCKED** | Key layering and six existing family-care mappings are locked; operator permissions, remaining domain actions, and unavailable reasons remain open. |

#### Pilot-0-B3-1a — Guardian action matrix (LOCKED)

| Guardian action | Generic AI Chat | Family board | Family domain web workbench |
| --- | --- | --- | --- |
| Ask for current state or explanation | AI response over current owner-reread | Display current state | Display current state |
| View current question, receipt, or caregiver reply | Display safe summary and offer an entitled target surface | Current/recent list and detail | Complete authorized history and detail |
| Select a child or item | Generic `action_option_deck` when ambiguous | Select within current board scope | Select within authorized workbench scope |
| Create a question draft | AI-assisted draft | Short question input | Full question editor |
| Submit `family_care_question` | `editable_preview` plus `authorization_gate` | Confirm child/destination, then execute | Full preview, then execute |
| View grant state and scope | Safe summary plus navigation | Current grant summary | Complete grant/version/replacement record |
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
| B3-1d-1 technical-operator permission matrix | OPEN | Exact evidence, recovery, owner-reevaluation, kill-switch, and prohibited actions. |
| B3-1d-2 remaining exact domain-action mapping | OPEN | Guardian grant creation/replacement and Institution topology/onboarding command mappings. |
| B3-1d-3 unavailable reasons and implementation gate | OPEN | Stable safe reason vocabulary, additive contract adoption, and negative coverage. |

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
| Pilot-0-B — cohort, role, surface, and data lock | **In progress — through B3-1d-0 locked** | B1 locks the synthetic cohort; B2 locks seven logical accounts; B3-0 locks role/surface entitlement; B3-1a/B3-1b/B3-1c lock role action matrices; B3-1d-0 locks key layering. B3-1d-1 through B3-1d-3, B3-2 transitions, B3-3 business/data envelope, and B3-4 journey coverage remain open. |
| Pilot-0-C — IIB and onboarding closure contract | **Proposed** | Minimum guardian/teacher/admin journeys and authenticated action boundaries accepted. |
| Pilot-0-D — topology, operations, success/stop/rollback contract | **Proposed** | Isolated pilot topology, two-key allowlist, five-day window, ownership, recovery, stop, and rollback terms accepted. |
| Pilot-0-E — final Go/No-Go | **Pending** | Blocker owners and implementation nodes assigned; Pilot-0 evidence reviewed. Only then may the user separately authorize Pilot-1. |

Pilot-0 is not complete while Pilot-0-B through Pilot-0-E remain unresolved. The current decision is deliberately **NO-GO for external traffic** and **GO for readiness decisions only**.
