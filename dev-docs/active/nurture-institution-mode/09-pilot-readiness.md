# Pilot Readiness — Institution Ecology

## Status and authorization

- **Review date:** 2026-07-21
- **Current checkpoint:** Pilot-0-C/C4 is `DECISION COMPLETE / IMPLEMENTATION OPEN / EXTERNAL TRAFFIC NO-GO`; Pilot-0-D is `PILOT0_D_DESIGN_LOCKED / C3_C4_D_IMPLEMENTATION_PENDING / EXTERNAL_TRAFFIC_NO_GO`. Product/operations, release-governance, and security/reliability reviews plus cumulative repair returned `DR-P0=0 / DR-P1=0 / DR-P2=0` for D-0..D-7. Six `TR-P0` and three `TR-P1` traffic-readiness blockers remain open; the separate `TR-P1-3a-native-external-delivery` row is an accepted exclusion for the responsive-Web internal scope, not implementation closure. No complete candidate exists and `QR-*` is not applicable. Every implementation/adoption/candidate/deployment/activation node still requires separate authorization.
- **Decision:** **GO for Pilot-0 readiness continuation; NO-GO for external pilot traffic**
- **Authorization boundary:** the review changes only task/governance evidence. The review does not authorize a database apply, artifact publication, secret configuration, capability or manifest-composition change, external traffic, Pilot-1 through Pilot-4, staging, production, or GA.

The concise C status/identity contract is in
`10-pilot0-c-current-decision-index.md`; the normative D topology/operations
contract is `11-pilot0-d-topology-operations-contract.md`. This file is the
detailed decision ledger. `DR-*` means design-review defects, `TR-*` means
traffic-readiness blockers, and `QR-*` means immutable-candidate qualification
findings. Unqualified `P0/P1/P2` is not a current status vocabulary.

Pilot-0 answers whether the reviewed X5 implementation can be turned into a bounded pilot safely and what must be built first. X5 proved the contract, persistence, replay, privacy, and failure semantics in deterministic and isolated joint tests. X5 did not produce a deployable, authenticated, user-operable institution product surface.

## Immutable review baseline

| Repository | Reviewed revision | Relevant evidence |
| --- | --- | --- |
| My-Workflow-Base | `acba4e792c85131c19e63e08a5f671133c481c57` | vNext additive handoff/driver/capability contract and conformance harness. |
| My-Chat | `a1b5e64c84c9865e34abb7068be10352cf42c949` | X2-X5 Step/Handoff/Outbox/owner delivery, CI and image-build gates; staging/prod capability false. |
| The-Nurture | `058c792dc86c0f41797632ebabc6f9a04fec6c18` | N1/X4/X5 business kernel, pre-activation default, activation-only factory, owner reread, CI/governance baseline. |
| Shared contract | `0bd8925ec8da88e0b7d0aa76b33bef94c471ff52499651c7b0c2a5da381501aa` | Base/My-Chat path-content hash for the reviewed handoff baseline only; the hash is not C-3 presentation adoption evidence. |
| Nurture activation source | `e976c235962c827367d1c13dcc603a0d315fdac118daf03f00a3df85e153d193` | Exact 25-file X5 activation-critical source population. |

These rows remain the immutable historical X5 workflow baseline. The current live My-Chat checkout is `db22de6`, so the default live-checkout pin verifier now rejects the revision mismatch by design even though `packages/workflow-contracts` did not change. The exact `a1b5e64` pin must be verified in an isolated detached worktree; no revision relabel or pin bump is allowed. `db22de6` is not identity adoption evidence.

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

### TR-P0 — blocks any external pilot traffic

1. **`TR-P0-1-production-activation-composition` — no production activation composition.** `createNurtureActivationScenarioModule` exists, but no runnable My-Chat composition loads the Nurture scenario package, supplies the host seed/Actor readers, opens the separate Nurture repository, and advertises the capability. The Nurture backend is explicitly a dev-host harness and constructs `createNurtureScenarioModule`, which is pre-activation.
2. **`TR-P0-2-institution-workflow-operable` — the IIB workflow is not operable.** The Nurture frontend contains only family-project workbench pages. The manifest declares institution inbox/attention routes, but the current Fastify server does not mount them. My-Chat mobile can only display a generic “available in teacher attention board” card. Caregiver acknowledge/reply and guardian receipt/reply are not exposed through live handlers/routes or UI.
3. **`TR-P0-3-controlled-onboarding` — no controlled onboarding path.** Institution, group, participant, role, child process, enrollment, thread, and grant creation occur through direct Prisma fixture writes in tests. A real pilot cannot rely on manual database edits as an identity, authorization, or audit mechanism.
4. **`TR-P0-4-workspace-activation-gate` — no workspace-level activation gate.** My-Chat has one environment-global `WORKFLOW_HANDOFF_MATERIALIZATION_V1_ENABLED` switch. A value of `true` enables the owner consumer and host capability for the entire environment. Pilot-2 requires the second, positive-only exact `ScenarioWorkspaceActivation` row/store/current-resolver predicate; the global flag alone is insufficient and a cached allowlist is forbidden.
5. **`TR-P0-5-deployable-nurture-topology` — no deployable Nurture artifact/topology.** `ops/packaging` has no service definitions, `ops/deploy/config.json` has no registered services, and the deploy script is a placeholder. The current backend also exposes dev-host workflow/project routes without production authentication and must not be deployed as-is.
6. **`TR-P0-6-operational-recovery-instantiated` — operational recovery is not instantiated.** Contracts cover telemetry and X5 covers Admin recovery semantics, but the proposed pilot still lacks deployed metric/log sinks, dashboards, alerts, backup/restore evidence, credential-rotation procedure, named incident owners, and an executable kill-switch runbook.

### TR-P1 — exact disposition required before Pilot-0-E

1. **`TR-P1-1-retention-access-policy` — open.** The retention/legal wording for Grant revoke and the encryption/KMS/attachment posture remain production gates. The first pilot avoids attachments but still needs an approved and implemented retention/access policy for question content. E requires `closed`.
2. **`TR-P1-2-product-operations-telemetry` — open.** User-value evidence is not yet instrumented. Existing telemetry measures technical command/owner behavior, not teacher triage time, Guardian completion, or operator manual intervention. E requires `closed`.
3. **`TR-P1-3a-native-external-delivery` — accepted scope exclusion.** The locked internal D scope excludes native distribution, OS push, SMS/email, external recipients and external provider delivery. E may accept only exact disposition `accepted_scope_exclusion`, backed by candidate/registry/network absence evidence; the disposition is not implementation closure or a capability claim.
4. **`TR-P1-3b-responsive-web-notification` — open.** The required responsive-Web in-app Notification/authenticated deep-link artifact and routing binding do not exist. E requires `closed`. A later native/external scope requires a new candidate and delivery decision.

The canonical current census is therefore six open `TR-P0`, three open
`TR-P1`, and one accepted-scope `TR-P1`. The stable ids above, rather than the
historical list positions or a phrase such as “activation-critical,” define
`pilot0_traffic_readiness_census_v1` and the Pilot-0-E gate.

## Recommended first-pilot slice

### Pilot-0-B1 — internal experiment cohort (LOCKED, REVISED)

The owner refinement supersedes the earlier proposed 2 then 5–8 real-cohort shape. The first experiment MUST remain internal and use one allowlisted test workspace:

1. Create one synthetic institution, one synthetic care group, three synthetic child care processes, and three distinct synthetic families. Each child care process has exactly one independent family in the internal experiment.
2. One family has two guardian participants; the other two families have one guardian participant each. The experiment therefore uses four distinct guardian identities and four distinct My-Chat test accounts.
3. The two-guardian family MAY label its internal personas “father” and “mother”, but the domain contract remains two `guardian` role assignments and MUST NOT hard-code one family structure as a product requirement.
4. One designated primary guardian in each family creates the grant and submits the question. The second guardian in the two-guardian family validates same-family receipt/reply visibility. Every guardian MUST be denied access to the other two families.
5. All child, family, institution, and message data are synthetic. One internal tester MAY operate multiple personas, but every account, session, command actor, and audit record remains distinct.
6. The cohort validates structure, isolation, multi-guardian visibility, correct reply routing, per-family revoke, notification, deep link, and owner reread. The evidence does not claim real caregiver-efficiency or institution-value outcomes.
7. Pilot-4 remains this exact internal three-child cohort. Any later real-user cohort size or expansion policy remains uncommitted until the internal experiment passes and a separate post-Pilot scope review is authorized.

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
| Create a question draft | Open an empty protected composer; manual input only | Open an empty protected composer; manual input only | Open an empty protected composer; manual input only |
| Submit `family_care_question` | Process-local protected preview plus explicit confirmation | Process-local protected preview plus child/destination confirmation | Process-local protected preview plus complete consequence confirmation |
| View grant state and scope | Safe summary plus navigation | Current grant summary | Complete authorized Grant history and owner-safe current/replacement state |
| Invite a Co-Guardian | Open the My-Chat invitation panel | Open the My-Chat invitation panel | Open the My-Chat invitation panel with complete consequence review |
| Exit the actor's own Guardian relationship | Generic strong authorization flow | Strong confirmation | Complete offboarding/last-Guardian/Grant/history consequence review |
| Confirm family enrollment | Generic strong authorization flow | Strong confirmation | Complete enrollment/link review and confirmation |
| Suspend the family side of an Enrollment | Generic `authorization_gate` | Strong confirmation from current Enrollment | Complete side/consequence review and confirmation |
| Release the family-side suspension | Generic `authorization_gate` | Strong confirmation from current Enrollment | Complete current-hold/other-side review and confirmation |
| Confirm or decline a CareGroup transfer | Generic `authorization_gate` | Strong confirmation from current transfer proposal | Complete old/new Group and closure review |
| Permanently withdraw the family Enrollment | Generic `authorization_gate` | Strong confirmation from current Enrollment | Complete permanent-end/history/re-entry consequence review |
| Create or confirm a grant | Generic strong authorization flow | Strong authorization flow | Complete authorization flow |
| Replace an owned grant when Nurture offers a current-policy delta | Generic strong authorization flow | Strong confirmation with exact delta | Complete old/new authorization and old-work consequence review |
| Revoke a grant | Generic `authorization_gate` | Strong confirmation | Strong confirmation with full consequence detail |
| Update the family-owned child-care stage | Owner-guided stage selection plus strong authorization | Owner-guided selection and strong confirmation | Longitudinal history, exact change/correction review, and strong confirmation |
| Redact the guardian's own submitted question | Generic `authorization_gate` for a resolved message | Confirm from question detail | Confirm from authorized history detail |
| Cancel a pending route | Not declared in Pilot-0 | Not declared in Pilot-0 | Not declared in Pilot-0 |
| Search complete history | Navigate to the workbench | Not available beyond current/recent scope | Complete owner-paginated history; arbitrary text search and compound business filters are deferred from Pilot-0 |
| Edit an already-submitted question | Not allowed | Not allowed | Not allowed |
| Hard-delete Message/Receipt/Execution facts | Not allowed | Not allowed | Not allowed |
| Continue chatting on an already-replied item | Out of Pilot-0 | Out of Pilot-0 | Out of Pilot-0 |
| View another family | Not allowed | Not allowed | Not allowed |

The Guardian matrix has the following mandatory semantics:

1. Chat is the generic My-Chat AI panel, not a Guardian-specific Nurture page. Nurture MUST use the C-3-0c semantic presentation through generic My-Chat interaction UI and MUST NOT register a second Chat business state machine or bespoke family-chat shell.
2. Body-free Guardian Chat explanation/navigation may reuse the implemented `timeline_inline`, `action_option_deck`, `authorization_gate`, `bottom_sheet`, `full_screen_flow`, and envelope `resultSummary` primitives. C-3-0e/C-3-1 separately require the new protected composer; legacy `editable_preview`, `form_collector`, `step_wizard`, `suggestion_chips`, and ordinary Chat input cannot carry the family question body.
3. Natural-language input in ordinary Chat is intent only. A protected family-question or caregiver-reply body begins only after the user opens the registered protected composer and enters the body there. Cross-role submission, grant creation/replacement, revoke, and redaction require an explicit current-state confirmation before a Nurture command executes.
4. Chat returns a safe result summary after command completion. Family board/workbench views reread current Nurture-owned state; no surface copies the business lifecycle into My-Chat Chat or projection storage.
5. Core established-Guardian rights are reachable from all three entitled surfaces: submit a question, open the dedicated Co-Guardian invitation panel, exit the actor's own non-last relationship, confirm/suspend/resume/transfer-review/withdraw an eligible Enrollment, create/confirm or exact-owner administer a Grant, update Stage, and redact the actor's own question. Each surface may use a different layout, but every durable effect MUST converge on its one canonical Nurture operation/command and policy; invitation operations remain in their dedicated Host-coordinated lane rather than the ordinary action driver registry.
6. Revoke MUST NOT require access to the web workbench. The confirmation MUST disclose affected child scope, data class/direction, future-access consequence, retention behavior, and reversibility before commit.
7. `cancel_route` is not declared in Pilot-0 because B3-3d locked immediate logical delivery with no user-visible pending cancellation window. No surface may retain a conditional legacy cancel affordance.
8. A submitted question is immutable. Correction, resend, or another question creates a new command identity; redaction affects visibility but does not rewrite or hard-delete audit facts.
9. The dual-guardian experiment adds no `primary_guardian` role. The designated primary guardian performs scripted grant/submission actions, while actual action availability is derived from current role, family reachability, grant ownership, policy, and object state. The second guardian validates same-family owner-read.
10. Surface identity is untrusted context for eligibility, audit, and presentation only. My-Chat MUST NOT treat `chat`, `family_board`, or `family_workbench` as business authorization or as part of the canonical command identity.
11. Institution initiation does not bind a family to an enrollment. `confirm_family_enrollment` is a distinct Guardian-authorized action reachable from all three Guardian surfaces; the command rechecks the current proposed enrollment and child/family scope and does not implicitly create a grant.
12. `withdraw_family_enrollment` is reachable from all three Guardian surfaces and permanently ends the shared Enrollment after current strong confirmation. Any current exact-Family Guardian is independently eligible; Grant ownership, invitation receipt, join order, a primary label, or another Guardian's countersignature cannot add or remove that authority.
13. `update_child_care_stage` is reachable from all three Guardian surfaces and converges on one StageEpisode command. The action requires current strong confirmation and cannot become an Institution action, automatic age transition, pregnancy-handler side effect, or Enrollment mutation.

The B3-1a product contract is ahead of current implementation. My-Chat has a broad typed mobile interaction envelope, core render hosts, and a public-draft vertical slice, but no C-3-0c semantic-presentation delivery/renderer/action registry. Nurture does not yet expose the Guardian board/workbench actions or map the accepted action set into manifest/API command keys. Those gaps must close before Pilot traffic; B3-1a does not authorize runtime or manifest changes.

#### Pilot-0-B3-1b — Caregiver action matrix (LOCKED)

| Caregiver action | Generic AI Chat | Teacher board |
| --- | --- | --- |
| Query current attention state | AI response over current owner-reread safe summaries | Aggregated counts, state, and grouping |
| View actionable-item candidates | Display a bounded candidate set | Complete owner-paginated authorized list; arbitrary compound filter/sort controls are deferred from Pilot-0 |
| Select a child or item | Generic `action_option_deck` | Select within current authorized care-group scope |
| View protected family-question body | Resolve an opaque ref, perform transient owner-reread detail, and do not persist the body in Chat history | Current item detail after owner reread |
| View current grant/enrollment eligibility | Safe available/blocked summary | Item detail with current available/blocked reason |
| Acknowledge receipt | Structured explicit confirmation, then execute | Explicit confirmation from current item detail, then execute |
| Create a reply draft | Open an empty protected composer; manual input only, AI assist OFF | Open an empty protected composer; manual input only, AI assist OFF |
| Submit caregiver reply | Open the protected composer and confirm manually; AI assist OFF | Open the protected composer and confirm manually; AI assist OFF |
| View sent reply and current state | Safe summary plus navigation | Complete authorized item/message detail |
| Redact the caregiver's own reply | Explicit irreversible confirmation | Explicit confirmation from message detail |
| Browse historical items | Bounded safe results and route-only navigation to board | Owner-paginated authorized current/recent/history within the fixed Pilot window |
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
4. The later C-3-0e/C-3-3 decision supersedes the earlier AI-draft shorthand: Pilot protected AI is absent/off. The model sees only body-free owner narration; the caregiver manually types into an empty protected composer, and no AI-produced text may enter the protected reply lifecycle.
5. Caregiver reply submission from Chat and teacher board MUST converge on `nurture.family_care.reply_item`. The command rechecks caregiver role, care-group reachability, enrollment, exact Thread lifecycle, grant `org_to_family`, source/item lifecycle, expected version, and current policy; optional ThreadParticipant projection is not authority.
6. The teacher board MUST cover both current work and complete authorized owner-paginated history because the Caregiver role has no domain workbench. “Complete” means all currently authorized shells inside the fixed 365-day Pilot source-entry window, not indefinite content retention; each Message body still has its independent 30-day window. History includes open, acknowledged, replied, blocked/revoked, and redacted/suppressed items. Pilot-0 uses current/recent/history modes, owner pagination, item detail, and owner-issued navigation offers; arbitrary text search and compound child/care-group/status/time filters require a later additive owner query-control contract. Redacted/suppressed entries expose only current display-safe state or tombstone metadata, never the protected body.
7. A caregiver reply is immutable after commit. The caregiver may redact the caregiver-authored reply through current policy, but Pilot-0 provides no in-place edit, automatic reopen, second reply, or correction command. A future correction flow requires an explicit new command contract.
8. Direct family Chat is forbidden. Family input creates a workflow item; caregiver actions commit a Nurture business transition and a traceable family-facing message. Chat presentation MUST NOT bypass the workflow-mediated communication contract.
9. Bulk actions, clarification loops, daily-care outcomes, multi-caregiver concurrency, caregiver reassignment, and duty handoff remain outside the first internal experiment.
10. Revoke, redaction, enrollment/role changes, item-version conflict, and policy change between draft and submit MUST fail closed on the final command recheck. A blocked draft does not justify alternate-surface submission or policy bypass.

The B3-1b product contract is ahead of current implementation. Nurture has domain command specifications and database transactions for acknowledge, reply, and author redaction, plus read-only inbox/attention presenters. It does not yet expose authenticated live action handlers, transient protected-detail delivery for generic Chat, the manual protected composer, or the complete teacher-board history/action UI. My-Chat likewise lacks the general scenario-produced interaction/action registry needed by Caregiver Chat. Protected AI remains intentionally absent/off rather than an implementation gap. Those required gaps must close before Pilot traffic; B3-1b authorizes no runtime or manifest change.

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
| Change My-Chat capability, Workspace activation row, Run/Step/Handoff/Outbox | Not allowed | Not allowed |
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
8. Nurture business disablement is separate from the My-Chat technical kill switch. Institution surfaces cannot change the environment capability, exact Workspace activation row, Workflow runtime state, Handoff Ledger, Outbox, notification delivery, or Admin reconciliation state.
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
| `submit_family_care_question` | Scenario domain action; C-3-0d driver `workflow_claimed_step_v1`. Historical `capture_family_input` remains a separate compatibility entrypoint. | `nurture.family_care.capture_and_route` | Command transaction scaffold exists; the authenticated protected domain-action handler does not. C-3-1 forbids alias/fallback to the historical entrypoint. |
| `revoke_child_link_grant` | Scenario domain action; C-3-0d driver `nurture_direct_empty_v1` | `nurture.family_care.revoke_grant` | Command spec/transaction exist; authenticated surface action does not. |
| `acknowledge_family_care_item` | Scenario domain action; C-3-0d driver `nurture_direct_empty_v1` | `nurture.family_care.acknowledge_item` | Command spec/transaction exist; authenticated surface action does not. |
| `reply_family_care_item` | Scenario domain action; C-3-0d driver `workflow_claimed_step_v1` | `nurture.family_care.reply_item` | Command spec/transaction exist; authenticated surface action and reply Handoff wiring do not. |
| `redact_family_care_message` | Scenario domain action; C-3-0d driver `nurture_direct_empty_v1` | `nurture.family_care.redact_message` | Command spec/transaction exist; authenticated surface action does not. |
| `cancel_family_care_route` | Not declared in Pilot | `nurture.family_care.cancel_route` | Command scaffold exists, but B3-3d locks no Pilot cancel and C-3-0d forbids activation. |

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

The current contract gap is explicit: My-Chat and Base have Run-level action contracts, while My-Chat does not yet provide a general scenario-produced domain-action delivery/execution registry for generic Chat and role boards. Nurture has no authenticated domain-action handlers for the mappings above and no manifest/API shape for the accepted cross-surface domain actions. The original B3 phrase `Direct domain action` meant only “not a legacy Workflow Run action”; C-3-0d supersedes that ambiguous phrase for driver semantics and makes caregiver reply claimed-Step. B3-1d-0 itself changes no manifest, runtime, schema, environment, capability, or activation.

**Pilot-0-B3-1d-1 — technical-operator permission matrix (LOCKED)**

| Technical-operator operation | Pilot permission | Exact boundary |
| --- | --- | --- |
| Read Run/Step/Handoff/Outbox/notification/audit evidence | Allowed | IDs, safe status/reason, versions, counts, timestamps, and correlation only; no Nurture body or claim material. |
| `reconcile_outcome_unknown_step` | Allowed | Operator-facing Host key maps to the existing Step `/reconcile` operation; only the exact outcome-unknown original Step may replay its original command/snapshots. |
| `replay_failed` | Allowed | Existing My-Chat Handoff action; only a replayable `failed` Handoff with expected version, idempotency, and current owner reread. |
| `stop_pending` | Allowed | Existing My-Chat Handoff action; only a still-pending/requested technical activation before downstream logical effect. The Host action does not cancel or redact Nurture facts. |
| `request_owner_reevaluation` | Allowed as a request-only Host action | Planned operation invokes Nurture owner recovery with opaque refs/current host evidence; the operator cannot select or author the business result. |
| Execute emergency Pilot disable | Allowed under the approved runbook | Disable-only responsibility: remove/disable the exact Workspace activation row first, then disable the environment capability. Re-entry requires a new stage authorization and fresh row; expansion requires separate scope review. |
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

Current implementation is partial. My-Chat already implements safe Handoff evidence, `replay_failed`, `stop_pending`, and exact Step reconciliation with expected version/idempotency checks, but the API relies on generic Admin ACL rather than a named Pilot-operator entitlement and the Admin UI exposes no recovery controls. `request_owner_reevaluation`, the positive-only exact Workspace activation store/current resolver, and the dual-gate emergency-disable composition are not implemented. B3-1d-1 authorizes no source, schema, manifest, environment, capability, or activation change.

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
| `exit_guardian_relationship` | `nurture.family_care.exit_guardian_relationship` | The exact current Guardian exits only their own accepted relationship; the last-current-Guardian fence and complete owned-Grant cascade apply. |
| `update_child_care_stage` | `nurture.family_care.update_child_care_stage` | Any current exact-Family Guardian independently sets, changes, corrects, or clears the family-owned StageEpisode after current strong confirmation; no Enrollment or Institution effect. |
| `confirm_child_link_grant` | `nurture.family_care.confirm_grant` | Creates/confirms the first current grant from an explicit reviewed authorization under current enrollment. |
| `replace_child_link_grant` | `nurture.family_care.replace_grant` | Creates a new grant identity/version under current policy; never reactivates a revoked grant. |

The existing `revoke_child_link_grant` mapping remains `nurture.family_care.revoke_grant`. A same-definition current grant MAY return `already_satisfied`; a changed scope/direction/data-class contract requires `replace_child_link_grant`. Stage update, Enrollment confirmation, Guardian self-exit, grant confirmation, grant replacement, and grant revoke remain separate commands, expected-version boundaries, and audit events. C-3-2 separately locks first/Co-Guardian invitation operation names in the dedicated invitation/prospective registry rather than this ordinary action table.

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

1. Institution-workbench `initiate_participant_invitation` starts the planned Host identity orchestration around `my_chat.workspace_invitation.create`; the Host shell command is not a Nurture `CommandExecution` and cannot bind a raw My-Chat user id. C-4-1 supersedes the earlier one-command shorthand by requiring the separate purpose-bound Nurture Staff Invitation intent/Execution before the Host shell becomes deliverable.
2. My-Chat owns invitation delivery, authentication, acceptance, expiry, and canonical account/workspace membership. Acceptance is not an Institution-admin surface action.
3. After My-Chat records acceptance, an authenticated owner callback invokes planned `nurture.institution.bind_accepted_participant` with a canonical accepted-user ref and invitation correlation. The callback is not advertised as a user `action_key` and cannot accept on the user's behalf.
4. Staff-role assignment remains a separate institution-admin command after participant binding. Identity acceptance never grants a Nurture role implicitly.

The lifecycle mapping has no generic `upsert_*` or `change_*_state` action. Create/update/suspend/resume/close remain separate keys with separate allowed-state, expected-version, authorization, and audit rules. `resume_*` applies only after current revalidation; an Enrollment resume releases only the caller's authorized side hold and may leave aggregate state paused. `close_*` is terminal in Pilot-0. The scoped Pilot business-disable action uses `suspend_care_group`, and recovery uses `resume_care_group`; no second Nurture Pilot-enablement aggregate or reversible client toggle is introduced. My-Chat environment capability and exact Workspace activation row remain separate technical gates.

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
2. The reusable contract MAY carry only a generic destination `route_class`, a Nurture-issued opaque continuation token, and necessary display expiry/bookkeeping. C-3-4 later narrows ordinary Pilot Guardian/Caregiver navigation to `route_class + current|recent|history` with `continuation_ref` absent; only authenticated Notification open receives its separately typed foreground locator. URLs, notification payloads, client route state, analytics, and logs MUST NOT contain raw child, family, grant, message, receipt, item, enrollment, role-assignment, institution, or care-group ids.
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
| My-Chat durable Notification | Exact workspace/recipient, Notification id/type/read state, generic safe copy/open route, delivery/correlation evidence, and the C-3-4 server-only typed Handoff source link | Generic target/metadata duplication of Handoff id, raw scenario token, Nurture ref/id/body/status/action/policy cache |
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
| `resolve_delivery` | Should the current recipient receive or retry the Notification now? | C-3-4 refines this into commit-cohort delivery plan plus exact-recipient `create|send` checks. Current revoke/redaction/cancel/terminal target stops provider work; transient owner failure sends nothing and retries within Host policy. |
| `resolve_open` | What may the authenticated prior recipient see now? | May route acknowledged/replied/closed work to current authorized detail/history; never restores the earlier delivery predicate, preview, status, or action controls. |

Owner reread occurs before Notification creation, before every provider send/retry, and on every authenticated open. A pre-send deterministic stop marks technical delivery `skipped` and never calls the provider. A post-send revoke/redaction/withdrawal cannot recall an OS notification, so open-time and destination owner reads are the privacy fence. Provider `sent|failed|skipped` remains My-Chat technical state and never changes Nurture business status.

Stale-open behavior is closed:

| Current condition | Safe result |
| --- | --- |
| Actor/role/scope/grant/target current | `ready`; return current destination route and a fresh open token. |
| Item acknowledged/replied/closed but still historically visible | `ready`; show current authorized detail/history and current actions, never stale buttons. |
| Source redacted/withdrawn/suppressed | Owner-approved tombstone or `unavailable`; no protected body/detail token. |
| Grant/source/body access removed while the exact historical recipient episode still owns a safe shell | C-3-4 may return `ready` only to an owner-approved body-free tombstone/history; no protected body or stale action. |
| Historical role episode ended, a new role/rejoin exists, or subject reach is removed | `unavailable`; no target detail, token, inheritance, or existence-bearing fallback. |
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
| Unsubmitted manual protected draft; future separately gated AI draft | Creating actor + current surface | Does not cross surface/device/account/participant; no automatic recovery. Pilot protected AI is absent/off. |
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
4. Pilot-0 creates no caregiver AI draft from protected family content because `scenario_protected_ai_draft_v1` is absent/off. Any future separately enabled draft must remain ephemeral, explicitly unconfirmed, and absent from Chat history, notification, route state, analytics, and other surfaces. Only a current caregiver-confirmed Nurture command publishes a named reply.
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

History rows, owner pagination cursors, scroll position, old expected versions, and action state are surface-local. Pilot-0 carries no arbitrary business filter/search control; any future separately contracted filter/search state would also remain surface-local and owner-validated. Every target query/page/detail/action rereads current Nurture access. Redacted/suppressed rows expose only owner-approved tombstone state. My-Chat Chat transcript, Notification inbox, and Technical Admin never become a parallel Nurture history projection.

The minimum round-trip matrix is mandatory:

| Journey | Required result |
| --- | --- |
| Guardian Chat submit -> family board/workbench | One committed Message/Receipt appears through owner query; no second command. |
| Family board -> family workbench history | Only route + `history`; destination queries current complete authorized history. |
| Second guardian/cross-device open | No unsubmitted draft; only currently policy-visible committed facts. |
| Caregiver Chat acknowledge/reply -> teacher board | Current committed state appears; acknowledge/reply is not repeated. |
| Caregiver Chat manual protected draft -> teacher board | Draft does not transfer; user stays to finish or discards and restarts. |
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

Caregiver reply uses the symmetric content boundary: trimmed 1–2000-character protected plain text, no attachment, and deterministic generic display copy. The later C-3-0e decision supersedes the earlier AI-draft allowance for Pilot-0: `scenario_protected_ai_draft_v1` is OFF, so the caregiver manually composes in the protected composer. A named reply is persisted only through a current caregiver-confirmed command with `authorship_kind=caregiver_confirmed`; AI cannot read, draft, publish, classify, route, select a Grant/target, or expand the envelope.

The Pilot profile is additive over the reusable domain kernel:

1. Existing general enums, schema, and command support for other data classes, categories, urgencies, attachments, sources, and pending workflow mode remain intact for future separately reviewed capabilities.
2. Before Pilot traffic, one strict Nurture-owned Pilot profile validator MUST run before the existing command runner and before protected/business persistence. The validator rejects every non-profile field or attempted client override and does not create parallel Message, Receipt, Item, or Execution types.
3. Protected body ingestion enforces the 1–2000-character boundary because the current domain command receives an opaque protected-content ref rather than inline text. The command boundary independently enforces all fixed refs-only/profile fields.
4. List/attention/notification copy remains generic. Authorized detail obtains the current protected body through owner reread after role, scope, grant, lifecycle, and policy checks.
5. Required negative evidence includes empty/overlong/control-only text, fixed-field override, non-empty attachment, unsupported class/category/urgency/route/source, raw-id/ref injection, health/emergency input, protected-AI/body injection while the capability is off, wrong actor/workspace/child/family, and exact replay without a second effect.

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

Every execute, retry, presenter read, notification eligibility check, provider retry, and open revalidates the Item's exact original `grantId` plus current participant role, family, enrollment, care group, and policy. Permanent original-Grant invalidation, terminal Enrollment transfer/withdrawal/end, source redaction, and retention erasure invoke the established complete fence. Caregiver-role suspension, Enrollment Hold, temporary Institution/CareGroup/policy denial, capability disablement, and owner outage are current fail-closed fences and do not by themselves persistently suppress Item/Receipt/Attention. A terminal Caregiver claim role blocks body/action and requires staffing review without silently transferring or rewriting the acknowledged work. Reconciliation is not authorization, and a new Grant or role never revives old authority.

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
| Capability or exact Workspace activation row disabled | Block new writes/activation while retaining committed facts. |

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
9. Capability remains false and active Workspace rows remain `[]`; B3-4 closes readiness decisions only and authorizes no implementation, database, artifact, secret, provider, or traffic change.

Pilot-0-B is complete. The later Pilot-0-C section governs IIB/onboarding closure and started with C-0.

The remaining delivery and operations rows are recommendations until their later Pilot checkpoint is explicitly accepted.

| Dimension | Recommended lock |
| --- | --- |
| Environment | A new isolated `pilot` environment, separate from current dev, staging, and production. No shared database. |
| Cohort | **LOCKED by revised Pilot-0-B1:** Pilot-4 uses exactly one allowlisted internal test Workspace, one synthetic Institution/CareGroup, three synthetic child scopes, and three independent families. Only a separately reviewed post-Pilot real-user scope/size remains open. |
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
| Observation window | One uninterrupted 120-hour wall-clock window after Pilot-3 seals evidence, fully disables, and a new Pilot-4 authorization creates a new exact activation row. No extension or resumed clock. |

## Recommended delivery contract

The pilot topology should preserve runtime and data ownership rather than promote the dev host:

1. My-Chat API/workers remain the host for account auth, Workflow Run/Step/Handoff/Outbox, notification, deep link, and Admin technical recovery.
2. My-Chat API/workers consume the immutable exact-revision Host-facing Scenario contract/manifest and private-call adapter, retaining host-owned principal/admission/Step/Handoff/Outbox ports. They never construct a Nurture repository or receive a Nurture database credential. The private Nurture production owner service loads Nurture handlers/repositories against its own DB and accepts only the exact signed/mTLS invocation; it never acquires queue, lease, attempt, or Handoff Ledger ownership.
3. A production Nurture owner API plus Nurture retention/erasure worker run on the separate private Nurture ECS with signed caller envelopes and workload-bound mTLS. The current dev-host workflow/project API and static bearer fallback are not part of the artifact.
4. My-Chat authenticated shell routes invoke Nurture-owned presenters/actions. Raw Nurture business routes are not exposed directly to clients.
5. Activation requires both the environment capability and one exact candidate/deployment/profile-bound Workspace activation row plus current C-3/C-4/E/owner predicates. Removing either technical gate stops new work fail-closed without affecting ordinary My-Chat Q&A.
6. My-Chat and Nurture ECS/RDS boundaries, migrations, backup/restore evidence, Alibaba Secrets Manager/KMS refs, artifact provenance, signed callers and mTLS identities remain separate Pilot-1 deliverables.

The locked ECS/Compose topology makes private Alibaba ACR publication of the E-approved exact OCI bytes a Pilot-1 prerequisite. ACR is not required for Pilot-0 documentation and is not configured here. The current tag-based My-Chat images are not candidate inputs, and Nurture still needs its production artifact definition.

## Pilot-0-C — IIB and onboarding closure contract

| Checkpoint | State | Decision boundary |
| --- | --- | --- |
| C-0 authenticated ingress and first-Institution bootstrap | **LOCKED** | Public/private IIB ownership, first-admin bootstrap authority, provisioning identity/idempotency/closure, and forbidden ambient-admin/dev-host/DB-edit alternatives. |
| C-1 CareGroup and institution-staff onboarding lifecycle | **LOCKED / COMPLETE** | C-1a-e lock the sole class aggregate, derived readiness, Staff Invitation/acceptance, Participant binding, separate Caregiver/Lead roles, offboarding, and family-invitation gate. |
| C-2 child/family/enrollment/Grant onboarding | **LOCKED / COMPLETE** | C-2f-5 closes C-2 with immutable business outcome versus replay disposition, exact server-only output refs, current owner presenters, same-Execution/same-Step response-loss recovery, route-only continuity, preserved explicit-empty paths, and minimal future Guardian relationship attention without widening `user_attention`. |
| C-3 Guardian/Caregiver operational IIB | **DECISION COMPLETE / IMPLEMENTATION OPEN** | C-3-0a-e and C-3-1/2/3/4 lock the shared baseline, Guardian/Caregiver business surfaces, and continuity; C-3-5 locks cumulative implementation, candidate evidence, default-off activation-control, rollback, qualification, and C-4 boundary. No actual adoption, qualified candidate, non-empty persistent allowlist, capability enablement, or traffic is claimed. |
| C-4 Institution IIB, safe states, and closure evidence | **DECISION COMPLETE / IMPLEMENTATION OPEN** | C-4-0..5 plus the late platform identity reconciliation are locked and three independent final rereviews plus the clarity repair returned `DR-P0=0 / DR-P1=0 / DR-P2=0`. Implementation remains separately unauthorized; the later Pilot-0-D contract is design-locked and waits on C-3/C-4/D implementation/candidate inputs. |

### Pilot-0-C0 — authenticated ingress and first-Institution bootstrap (LOCKED)

The Pilot exposes one public application boundary:

1. Guardian/Caregiver generic Chat, family/teacher/institution boards, family/institution workbenches, Notification, and deep links enter through authenticated My-Chat shell routes.
2. Clients never call raw Nurture owner, presenter, resolver, or command routes. My-Chat authenticates the canonical user/workspace, validates generic route/surface context, carries idempotency and Nurture-issued opaque context, and renders typed generic presenter/action envelopes.
3. Nurture private owner/action services alone resolve participant, eligible role, work/child scope, target, Grant, policy, lifecycle, expected version, display state, and action availability on every read and action. My-Chat never supplies a trusted role, scope, target, Grant, availability decision, or business lifecycle value.
4. The current Nurture dev-host workflow/project routes are not part of the Pilot artifact, are not exposed through My-Chat, and cannot serve as an operational fallback.

The first synthetic Institution cannot use the ordinary Institution-admin flow because no Institution Admin exists yet. The Pilot therefore uses one explicit bootstrap exception rather than ambient privilege:

1. A versioned provisioning specification binds the exact allowlisted workspace, Nurture scenario, Institution definition, initial Institution Admin My-Chat identity, and expiry. Before Pilot-0-D, C-4 evidence may use only a disposable synthetic specification for its isolated evidence Workspace; Pilot-0-D separately owns the real Pilot specification.
2. The provisioning specification is control-plane input. It is not a B3-2 scenario interaction token, client credential, URL/deep-link value, user-selected role, or reusable authorization result. The pre-D synthetic specification is generated, signed, stored, custodied, revoked, and destroyed only by `c4_bootstrap_evidence_controller` under issuer `my-chat.c4-bootstrap-evidence` and audience `my-chat.c4-bootstrap-evidence.v1`; it cannot create or stand in for real Pilot authority. Pilot-0-D will lock issuance, custody, deployment, revocation, and rollback only for the real Pilot specification. The two specification classes, stores, targets, issuers, audiences, and credentials cannot alias or substitute for each other.
3. The initial Admin must authenticate as the exact My-Chat user and accept the matching My-Chat invitation before Nurture bootstrap may execute.
4. One idempotent Nurture transaction creates the exact Institution, Participant, first Institution Admin role assignment, and auditable `CommandExecution`/result refs. Exact response-loss replay returns the original result; a second business effect is forbidden.
5. Wrong/changed user, workspace, scenario, Institution definition, canonical payload hash, or expiry fails before a business write. Exact response-loss recovery may return the original committed result through the bound technical recovery lane; reuse for a new/different effect or concurrent non-identical consumption fails closed.
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
| Family-invitation readiness | Current derived result requiring active Institution/CareGroup, exactly one current eligible operational Caregiver, exactly one Lead designation bound to that exact role episode, complete required policy, and enabled environment/workspace/business gates. |

Zero/multiple Caregivers, zero/multiple Leads, wrong Lead binding, missing teacher coverage, or missing policy produces a current unavailable/readiness reason rather than a second persisted class status, Host-owned readiness flag, or cached authorization result. A group may exist before staffing, but family Enrollment Invitation send and protected family-care work remain blocked until readiness passes. Group pause/archive blocks new invitations and cannot delete historical roles, enrollments, messages, or audits. The Pilot action layer also permits only one current human operational Caregiver across its Workspace cohort; reusable schema support for multiple scoped assignments is not activated.

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
2. The RosterEntry contains only an institution-local display label, optional age-band/birth prefill with institution provenance, and local lifecycle/version/audit. It stores no Host invitation ref or correlation; the separate Nurture invitation intent owns only the opaque Host binding/ref. Raw contact/auth data remains My-Chat-owned.
3. The RosterEntry is not a canonical child, child care process, family, Guardian relation, Enrollment, Grant, thread, Message, Receipt, care fact, global identity, or cross-institution matching key. The entry grants no protected read/write authority and cannot feed teacher operational work by itself.
4. My-Chat invitation acceptance authenticates the exact invited adult as a prospective Guardian. The adult then explicitly creates or selects one current platform Child/Family pair; the locked operation reuses valid typed anchors, reserves only missing endpoints, commits all missing bindings in one Host transaction, and creates or resolves the local Child/ChildCareProcess/child-scoped Family, first Guardian, and associations in one Nurture transaction. An already current local association may be selected only through exact owner resolution. C-2b locks the family relationship mechanics; C-4-5 locks recovery and supersedes any direct local-profile creation shorthand.
5. Institution prefill is never verified identity and cannot seed either owner. Fuzzy matching by name, birth date, contact, media, roster, or institution input; raw-id child selection; Institution creation/selection of a platform Child/Family; direct local-profile creation; and automatic dossier linking are forbidden. Exact reuse of a current My-Chat identity through its current binding is allowed and is not fuzzy matching.
6. No active local child/family aggregate is product-visible before the current platform Child+Family binding pair and both exact workspace associations exist. The first Guardian relationship still does not imply Enrollment or data sharing. Existing-local selection creates no new Guardian authority. Roster-to-child linkage is written only with Guardian-confirmed Enrollment or exact replay, and Enrollment never implies Grant.
7. If the invitation terminates before the independent identity/local-relationship saga commits, only the institution-local RosterEntry and invitation-intent audit may remain. If platform identity/bindings or the Nurture local relationship already committed independently, those owner facts remain, but there is still no Roster link, Enrollment, Grant, family-care thread, Message, Receipt, teacher visibility, or Institution authority. Termination never compensates committed identity or family facts.
8. All three Pilot families must complete authenticated signup and minimum child/process confirmation before J1-J4. Institution-only full child operations for non-participating families are outside Pilot-0 and require a separate authority/privacy/retention design; a RosterEntry cannot be silently promoted into that feature.

C-2a locks a design contract only. `NurtureInstitutionRosterEntry` does not yet exist in Prisma, migrations, repositories, routes, presenters, or My-Chat invitation IIB. The exact owner order, Roster/Intent separation, binding/association recovery, and platform-identity-reuse versus scenario-data-portability boundary are locked here and in C-2b-f/C-4-5; implementation remains separately unauthorized.

C-2a evidence must cover RosterEntry create/correct idempotency and versioning; wrong Admin/Institution/Group; send-before-readiness; no raw contact or platform/anchor leakage; unverified prefill display without identity seeding; the three JI3 parent-owned journeys/scopes, with all four binding-resolution branches covered separately by domain/conformance tests; exact binding-pair/workspace-association recovery; candidate-selection-without-roster-link; fuzzy/raw-id/cross-workspace dossier denial; ignored/declined/expired/revoked/wrong-recipient invitation; zero protected-work side effects before explicit confirmation; separate Enrollment and Grant transitions; and retained institution-local audit without an Institution-created identity claim.

#### C-2b-1 — first-Guardian establishment (LOCKED)

Institution onboarding identifies an intended enrollment recipient but does not establish the family relationship:

1. My-Chat authenticates the exact recipient bound to a current Enrollment Invitation. Invitation issue/acceptance, account ownership, workspace membership, and Institution intent are entry evidence only; none is a Guardian role or legal-family proof.
2. The invited adult acts as a prospective Guardian and strongly confirms the relationship declaration, a freshly entered Nurture-local care label/constraints, longitudinal-profile/privacy meaning, and the consequence that future current Guardians may see family-visible facts. Institution prefill and platform display fields are neither copied nor defaulted into the local record.
3. The adult first creates or selects the current My-Chat Child/Family pair. The versioned identity operation rereads both binding heads and follows exactly one branch: reuse both; reuse Family and add Child; reuse Child and add Family; or add both. Nurture reserves typed empty anchors only for missing bindings, and one My-Chat transaction commits or exact-replays every missing binding. A conflicting existing kind/ownerRef/head/pair is quarantined. One Nurture `CommandExecution` transaction then binds/reuses the workspace Participant and creates or resolves the local Child, ChildCareProcess, child-scoped Family, first active Guardian RoleAssignment, both workspace associations, and audit/result refs. The durable Host operation tracks `prepared|bindings_committed|local_committed|closed_no_effect` plus separate `clear|outcome_unknown`; exact status recovery, not a new operation, resolves response loss.
4. A product-visible local child/family aggregate cannot exist without its first current Guardian, current binding pair, and current workspace associations. Conversely, those facts create no Enrollment or Grant, do not link the RosterEntry, and expose no protected institution/family workflow content.
5. An existing child process may be selected only when Nurture owner resolution proves the authenticated participant already has a current same-workspace Guardian role. A non-Guardian recipient cannot claim an existing record using Institution prefill, name/birth/contact matching, raw ids, or invitation status; the adult must first complete C-2b-2 through a current Guardian.
6. The model has no `primary_guardian`. The first Guardian is merely the first established relationship and receives no permanent hierarchy or implicit Grant ownership. `father`, `mother`, and `other_guardian` are family-confirmed relationship/display metadata only and cannot change permission.
7. Pilot execution uses the C-2b-1 path once for each of the three families. Family-1 then adds one second Guardian through C-2b-2; Family-2 and Family-3 remain single-Guardian families.
8. Strong confirmation produces product assertion and audit evidence only. Pilot-0 does not claim legal Guardian verification. Identity-document capture, civil-status evidence, Institution attestation, or offline adjudication requires a separately authorized sensitive-data feature before any production reliance.

C-2b-1 evidence must cover all four legal binding-resolution branches plus conflicting-existing quarantine; exact response-loss replay and payload drift across reservation, binding, Participant/Child/Process/Family/Role/association/Execution boundaries; empty-bound reuse/invisibility; deterministic operation deadline, unresolved-operation quota, `outcome_unknown`, writer-fenced `confirmed_no_effect`, never-bound reservation retirement, and no automatic bound-anchor compensation. `ScenarioIdentityOperationStatusLookupV1` pins caller `my-chat-identity-recovery`, issuer `my-chat.identity-recovery`, audience `nurture.identity-recovery.v1`, operation `scenario_identity_operation_status_lookup_v1`, endpoint `POST /private/v1/identity-operations/status:lookup`, isolated request/response credential and verifier domains, and fresh nonce. Its strict `scenario_identity_operation_status_lookup_request_v1` permits only the opaque Host operation id, Workspace/scenario, Nurture-owned typed Child/Family anchor refs, association-expectation hash, local command id/hash, principal/Host-identity/deadline/attempt digests, time window, nonce, key id, and signature. My-Chat validates the raw Child/Family pair, exact `FamilyChildMembership`, and binding heads internally; only the non-reversible keyed Host-identity digest crosses the endpoint, never raw platform/binding ids. The strict body-free result common fields bind operation/workspace/local-command/status/checked-time plus originating request-nonce hash, response key id, and Nurture-recovery signature, and permit exactly one variant: `committed(commandExecutionRef, localCommitEvidenceHash)`, `confirmed_no_effect(noEffectFenceEvidenceHash)`, or `unknown(lock_timeout|possible_inflight|owner_unavailable|compatible_evidence_ambiguous)`. Tests reject unknown/missing/duplicate/null/cross-variant fields, produce zero resolver/fence calls on transport or frozen-field denial, reject swapped/unsigned/revoked-signer results, require terminal-attempt/deadline/fence/Execution-and-association absence proof for no-effect, retain outage/inflight/ambiguity as unknown, and prove zero business/protected/mutation action. Evidence also covers wrong pair denial; every association Workspace/Child/Process/Family graph constraint; Participant reuse and duplicate-role/mapping uniqueness; unauthenticated/wrong-recipient/workspace/expired/revoked invitation; omitted or stale confirmation; Institution direct assertion and uninvited self-claim denial; existing-child non-Guardian denial; current-Guardian selection; relationship-label permission equality; absence of `primary_guardian`; no implicit Roster link/Enrollment/Grant/content access; and UI/audit wording that never claims legal verification.

#### C-2b-2 — Co-Guardian Invitation issue and acceptance (LOCKED)

Co-Guardian Invitation extends an existing family relationship without introducing a primary-Guardian hierarchy:

1. The inviter must be both a current Guardian for the exact Nurture Family/ChildCareProcess and a current My-Chat Family member with Host permission to invite that exact recipient. Institution Admin, Caregiver, and Technical Operator cannot initiate, choose a substitute recipient, accept on another adult's behalf, or gain family authority from the workflow.
2. My-Chat owns raw recipient contact, delivery provider state, authentication, exact-recipient Host acceptance, Workspace membership, and Family membership. Nurture owns the sole business invitation intent bound to inviter, Family, ChildCareProcess, suggested relationship metadata, expiry/version/canonical payload hash, lifecycle/audit, and an opaque Host invitation ref. Host acceptance creates or exact-replays the recipient's Workspace and exact Family memberships first but grants no Nurture role and cannot override Nurture cancel/revoke/expiry/policy denial. The intent is design-only and not yet in Prisma.
3. Issue creates no recipient Participant, Guardian role, family-history access, Grant ownership, Enrollment, roster link, or child/family aggregate. The recipient must confirm or edit the suggested relationship label; label choice never changes Guardian permission.
4. Acceptance rechecks the inviter's current Guardian and Host Family-invite authority, Family/ChildCareProcess lifecycle, invitation state/expiry/version, exact recipient, current Workspace/Family memberships, existing active role, current policy, and the Pilot cohort gate. Stale authority or topology fails before a role write.
5. One Nurture `CommandExecution` transaction binds or reuses the recipient Participant, creates the second active Guardian RoleAssignment, consumes the invitation, and stores result/audit refs. Exact response-loss replay returns original refs; family/process/recipient/label/payload drift conflicts.
6. Host membership and Nurture role use distinct stable operation ids and exact replay. Host-membership commit followed by Nurture denial/response loss resumes only the same role operation; membership alone grants no Nurture product access. The exact inviter may cancel before Host acceptance. After either owner commits, cancellation never compensates that owner's fact; later membership revoke and Guardian self-exit remain independent. Inviter role or Host invite-authority loss makes later acceptance unusable; C-2b-4 owns Nurture relationship exit/revoke.
7. Invitation acceptance does not transfer Grant ownership, create Enrollment/Grant, create another child profile, or decide retrospective history rights. C-2b-3 owns the accepted Guardian's action and history matrix.
8. Pilot policy allows exactly one Co-Guardian acceptance for Family-1 and none for Family-2/Family-3, yielding the accepted `2 + 1 + 1` topology. The cohort gate is not a unique constraint, Schema cardinality, or product limit; the reusable model may support more Guardians after a separate product-policy decision.

C-2b-2 evidence must cover current Guardian plus Host Family-invite authority and no-primary behavior; exact/different-payload issue replay; wrong family/process/workspace/recipient; Institution/Caregiver/Operator denial; zero raw contact in Nurture; no pre-accept Participant/role/history/Grant effects; inviter revoke; expiry/revoke/consume; membership-commit/role-fail, role-commit/response-loss, cancel before/after each owner commit, membership revoke, self-exit, and either-fact-alone denial; stale Host accepted/provider state against Nurture denial; cancel/accept race; exact-recipient acceptance; Participant reuse; duplicate-role and local transaction rollback; no implicit Enrollment/Grant/new child; exact Family-1 two-Guardian and Family-2/3 one-Guardian topology; and proof that no global two-Guardian constraint was added.

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
3. Multiple eligible candidates require explicit clarification. Zero eligible candidates enters the platform/local identity-establishment path; no candidate count or forbidden object is leaked beyond safe branch output.
4. A recipient without an eligible Guardian relationship uses the locked C-2b-1 identity operation: explicitly create/select the platform Child/Family pair; reuse both valid bindings, reuse one/add the other, or add both; reserve only missing anchors; commit/exact-replay every missing My-Chat binding; and atomically create the workspace-local Child/ChildCareProcess/Family, first Guardian, associations, and audit refs. The durable identity operation and its terminal/unknown recovery are separate from Enrollment confirmation.
5. A non-Guardian who knows another current profile exists cannot claim that profile through the Enrollment Invitation. A current Guardian must first issue Co-Guardian Invitation; Nurture performs no global/fuzzy name/birth/contact matching, automatic merge, or raw-id link.
6. Institution prefill remains visibly unverified context only. Platform and Nurture forms receive no copied/defaulted/prepopulated value from it; the adult must enter any local care label or constraint afresh. Prefill cannot select, match, create either owner's identity/profile value, or establish a RosterEntry link.
7. Existing-child choice is stored only in a short-lived `NurtureInteractionContext` bound to invitation/participant/purpose/surface/expiry and opaque candidate refs. Context expiry/revoke/state drift requires fresh owner resolution and selection.
8. Before C-2d Enrollment commit, neither branch writes RosterEntry-to-child link, Enrollment, Grant, family thread, teacher-visible child fact, or invitation consumption. Selection is not durable Institution linkage.
9. If an independently committed workspace-local relationship is followed by abandonment, invitation cancel, or expiry, the platform identity/bindings, anchors, local Child/Process/Family, associations, Participant, and first Guardian remain under their owners. No Institution relationship exists, and a later attempt re-resolves both owners.
10. The Nurture Enrollment Invitation intent stays pending and resumable by the same exact recipient until C-2d consumes the intent or C-2c-3 terminalizes the intent. Host acceptance never substitutes for that lifecycle.
11. The three Pilot families cover distinct executable JI3 journeys/scopes without a fourth child/family. Family-1 accepts with an existing platform Child/Family and no Nurture association. Family-2 also accepts with an existing platform pair and no local association, establishes the local relationship, proves response-loss/exact recovery, then starts a fresh still-pending continuation and explicitly selects the now-current local association. Family-3 creates the platform pair after invitation acceptance. Family-1 later adds the separate Co-Guardian. Separate domain/conformance tests cover all four binding-resolution branches; no journey is satisfied by fixture injection, invitation-free same-workspace Nurture onboarding, or a direct profile write.

C-2c-2 evidence must cover wrong recipient/workspace and stale intent/readiness; Host acceptance without business consumption; zero/one/multiple owner-resolved local candidates; mandatory single-candidate confirmation; opaque option exact use/replay/drift; raw-id/Host/Institution/fuzzy selection denial; existing-profile non-Guardian denial and Co-Guardian redirect; the three JI3 platform/local journeys/scopes plus separate conformance of all four binding-resolution branches; empty-anchor, partial-pair, response-loss, exact replay, changed payload, wrong-pair, binding outage/revoke, and association-conflict behavior; abandonment/cancel/expiry after independently confirmed facts; InteractionContext expiry/revoke/drift; and no pre-C-2d link/Enrollment/Grant/thread/teacher effect.

#### C-2c-3 — expiry, cancel, reissue, and concurrency (LOCKED)

Enrollment Invitation authority is bounded by Nurture time/state rather than provider delivery:

1. Stored lifecycle is `pending|consumed|cancelled|superseded`. `expired` is derived on every read/action when `now >= expiresAt`; authority never depends on an expiry worker updating the row.
2. Pilot expiry is exactly 7×24 hours from issue. No in-place extension exists; reissue creates a new intent and a new seven-day window.
3. Any current Institution Admin for the exact Institution may cancel a pending intent. The exact recipient may decline. Both write terminal `cancelled` with distinct allowlisted reason, actor, version, and time; neither action deletes the intent.
4. Recipient/CareGroup/RosterEntry/expiry/payload correction uses reissue. The old pending intent becomes `superseded`, and a new invitation/request/Host ref/expiry/hash is created with immutable supersede lineage. Old intent/Host acceptance never reactivates.
5. My-Chat provider retry or resend of the same Host invitation is a technical delivery retry on the original intent. Business reissue is a new Nurture identity and cannot reuse old acceptance or replay keys.
6. Institution/CareGroup/Lead/policy/Pilot readiness loss derives a current blocked result without inventing a persisted blocked state. If readiness returns before expiry and the intent remains pending, the exact recipient may continue after full revalidation.
7. Cancel, recipient decline, expiry, supersede, or binding drift makes related `NurtureInteractionContext` unusable. Independently committed platform/local relationship facts remain without Institution linkage.
8. Every transition requires expected version and stable command identity. Cancel/decline versus C-2d consume, supersede versus acceptance/context use, concurrent reissue, and duplicate issue use first-commit-wins; losing stale operations cannot reopen or overwrite the winner.
9. Only the C-2d transaction that commits the exact Enrollment may move the exact current pending intent to `consumed`. Host acceptance, child selection, platform/local relationship establishment, provider delivery, and context use cannot consume.
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

#### C-2f — Enrollment topology lifecycle and longitudinal boundary (LOCKED / COMPLETE)

| Sub-checkpoint | State | Decision boundary |
| --- | --- | --- |
| C-2f-0 lifecycle vocabulary and actor authority | **LOCKED** | Current/terminal/deleted classes, family/institution actor separation, reversible versus permanent closure, new-identity transfer, independent Institutions, and forbidden automatic migration. |
| C-2f-1 temporary Enrollment pause/resume | **LOCKED** | Side-owned family/institution holds, exact compatible keys, shared same-side authority, cross-side denial, strong confirmation, current fences, atomic aggregate, replay, and races. |
| C-2f-2 same-Institution CareGroup transfer | **LOCKED** | Institution proposal/family confirmation, intent lifecycle, target-on-confirm roster, one-way old/new Enrollment lineage, atomic Grant/work closure, and no authority carryover. |
| C-2f-3 permanent leave/end and re-entry | **LOCKED / COMPLETE** | C-2f-3a-c lock terminal actions/actors/statuses, atomic closure, fresh relationship identities, unified lineage, current-owner confirmation, retained-history separation, and no old authority revival. |
| C-2f-4-0 portability boundary/classification | **LOCKED** | Same-workspace longitudinal process, family-owned stage, Institution-local Enrollment, independent different-Institution onboarding, no lineage/carryover, Enrollment-independent stage change, and cross-workspace `NO-GO`. |
| C-2f-4-1 stage fact/authority/lifecycle | **LOCKED** | Versioned linear StageEpisode, exact equal-Guardian action/confirmation, stable vocabulary, transition/correction/clear/replay/races, projection-only `currentStageKey`, and no inferred or Enrollment effect. |
| C-2f-4-2 same-workspace multi-Institution visibility/concurrency | **LOCKED** | Current-Guardian safe longitudinal view, repository-scoped Institution isolation, no cross-Institution/id/stage leakage, no stage dataClass, independent concurrency, exact dependencies, and stale-segment safety. |
| C-2f-4-3 future cross-workspace protocol boundary | **LOCKED / SUPERSEDED IN PART BY C-4-5** | Exact current My-Chat Child/Family identity reuse is allowed; Pilot still forbids cross-workspace Nurture dossier presentation/transfer, local authority or content carryover, and PII matching. Any future scenario-data transfer is a separate consented protocol over fresh target-local associations. |
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
9. Workspace-local Child/ChildCareProcess/Family continuity remains Nurture-owned and current-owner-resolved. My-Chat may reuse its exact current platform Child/Family identity across workspaces and scenarios, but fuzzy/PII matching, client/raw linking, cross-workspace Nurture discovery, or automatic profile/Enrollment/Grant/Thread/content/audit migration remains forbidden.
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
| Cross-workspace candidate | Exact My-Chat identity reuse may route to an independently authorized local association; no fuzzy match, dossier discovery/link, migration, or authority conclusion. |
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
4. Source and target Groups differ inside one Institution. Institution and target Group must be active with exactly one eligible operational Caregiver plus its exact bound Lead, current policy/gates/capacity. The reusable C-2f model may represent a paused/archived source for future transfer-out, but the later C-4 activated Pilot evaluator requires the source Group active at proposal, Guardian review/open, confirm, and decline; paused/archived transfer-out is not implemented or activatable in Pilot. Cross-Institution movement is C-2f-4.
5. Add exact nullable Restrict `Enrollment.rosterEntryId`, required for new/Pilot-active transfer eligibility after exact-evidence preflight. Confirmation alone creates target RosterEntry from current family-safe label; source roster becomes canonical historical `status=closed + terminalReason=enrollment_transferred`. This C-4-2 normalization supersedes the earlier `transferred`-status shorthand. Cancel/decline/expiry/fault creates no target row and institution prefill is not copied.
6. New Enrollment alone stores unique Restrict `predecessorEnrollmentId` plus `continuityKind=care_group_transfer`. Same workspace/process/Institution, different Group, one successor across every continuity kind, and acyclic lineage are mandatory; no old-row successor mirror or heuristic legacy link exists. C-2f-3c supersedes the unimplemented `supersedesEnrollmentId` proposal so transfer and re-entry share one lineage SSOT.
7. Guardian five-minute confirmation states the old Group ends immediately, old Grant/work permanently closes, history is retained but non-recallable, target gains safe roster visibility only, no old content moves, no target Grant/Thread is implicit, and transfer is irreversible. Client supplies only opaque context and confirmation.
8. One Serializable transaction resolves context/current Guardian, locks source Enrollment before TransferIntent, then Groups/holds/source roster/Grant/Thread/cascade roots, rechecks readiness/uniqueness/capacity/policy, preflights hard cap, and obtains database `T`. Old Enrollment becomes `ended`, `leftAt=T`, reason `care_group_transfer`; every old effective Grant terminates under `enrollment_transferred` and C-2e closure; old Thread closes and source RosterEntry writes canonical `closed + enrollment_transferred`; target roster and new active Enrollment with `joinedAt=T`/lineage commit; intent consumes; audit/Execution commits. C-2f-3b supersedes the earlier Intent-first order so every topology command uses Enrollment as its common root.
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
| Source Group paused/archived, target ready | Proposal/review/open/confirm/decline deny with no mutation; only cancel/cleanup of an existing Intent remains available. |
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
5. The exact RosterEntry becomes noncurrent canonical `status=closed` with reason `enrollment_withdrawn` or `institution_service_ended`; transfer uses `enrollment_transferred`. These names are typed terminal reason/history classes rather than separate Roster statuses. The exact Thread becomes `closed`, loses executable and body-derived summary projection, and retains Message/authorship/chronology/audit history. Nothing is deleted, unlinked, copied, or retargeted.
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
8. Re-entry owner resolution exposes only the predecessor ChildCareProcess for explicit Guardian confirmation. The recipient cannot choose another child or use the C-2b-1 platform/local identity-establishment branch. A noncurrent Guardian receives a safe unavailable result and must complete an independently current Co-Guardian path before a new exact re-entry invitation.
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

1. `NurtureChildCareProcess` is the longitudinal child-scope spine only inside one workspace and only through current Family-owner resolution. A stage episode is a family-owned phase of that process. Enrollment is one Institution-local relationship episode. Workspace remains the hard Nurture privacy and dossier boundary; none of these local objects replaces the My-Chat platform Child/Family identity or grants access to another local association.
2. Active CareGroup movement inside one Institution remains C-2f-2 transfer. Return after terminal closure to the same Institution remains C-2f-3c fresh re-entry. `predecessorEnrollmentId + continuityKind` stays constrained to the same workspace/process/Institution and cannot become a cross-Institution movement ledger.
3. Entry to another Institution in the same workspace uses the ordinary fresh RosterEntry, seven-day Enrollment Invitation, exact current-Guardian confirmation, context, CommandExecution, and Enrollment flow against the exact Child/ChildCareProcess selected through current Family ownership. Different-Institution entry is neither transfer nor re-entry and cannot reuse old relationship identities.
4. Current Enrollments at separate Institutions may coexist. A new Institution confirmation never auto-ends, pauses, withdraws, replaces, or edits another Institution Enrollment. Leaving the old Institution is a separate owner-confirmed C-2f-3 command and transaction.
5. No old Institution Grant, Thread, Message, Receipt, Item, Attention, context, roster, role, policy, notification, Handoff, protected history, audit visibility, or authority carries to the new Institution. The new Institution cannot learn from its own onboarding or presenters that another Institution relationship exists.
6. A next-stage change keeps the same Child and ChildCareProcess and cannot create, move, pause, end, withdraw, or reactivate Enrollment. Institution observations, roster attributes, age, birthday, and AI inference may at most support a future Guardian-facing proposal and cannot commit the stage.
7. Stage change plus entry to another Institution is a composition of two separately authorized effects. They may commit in either order under current owner reread; neither effect authorizes, compensates, rolls back, or transactionally gates the other. No distributed move transaction is introduced.
8. Exact reuse of a current My-Chat Child/Family identity is allowed; it still requires a fresh exact target-workspace anchor association and full target-local authority. Client/raw linking, PII or dossier matching, cross-workspace association discovery, and automatic Child/Process/Family/Enrollment/Grant/Thread/content/audit migration are Pilot `NO-GO`. Adult identity, name, birth fact, contact, media, family relation, or roster cannot trigger possible-match disclosure.
9. A future cross-workspace scenario-data transfer, if separately authorized, must be versioned, explicitly consented, minimum-allowlisted, source-owner-reread, expiring, replay-safe, revocable, and audited. It reuses the current platform identity while creating or resolving fresh target-local associations and carries no role, Enrollment, Grant, content, history, or policy authority. C-2f-4-0 neither designs nor implements that transfer.
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
| Exact current platform Child/Family in another workspace | Identity may be reused through a fresh target-local association; no local dossier discovery, merge, disclosure, or authority carryover. |
| Same adult or similar child facts without an exact binding | No match, association, disclosure, or migration in Pilot. |
| Future cross-workspace scenario-data portability | Separate protocol and authorization; reuse platform identity, create/resolve target-local association, and carry zero authority by default. |

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

**C-2f-4-3 — Cross-workspace identity reuse and future scenario-data portability (LOCKED / C-4-5 RECONCILED)**

1. Pilot permits only exact reuse of a current My-Chat Child/Family identity through current typed scenario bindings and fresh exact target-workspace Nurture associations. It exposes no cross-workspace Nurture lookup, candidate search, count, existence signal, dossier route, or association directory.
2. The target workspace creates or resolves its own Child/ChildCareProcess/child-scoped Family/Guardian facts through the parent-owned binding saga. Source-workspace RoleAssignment, Enrollment, Grant, Thread, content, history, stage, media, policy, audit visibility, and authority do not transfer or become target defaults.
3. Shared platform identity is exact routing evidence only. Same adult, name, birth fact, contact, roster, relationship label, or media is never proof and cannot trigger matching, disclosure, binding, merge, or possible-match output. A current target binding is still insufficient without the exact target association and full target-local owner-read predicates.
4. Cross-workspace presentation, profile import/export, copied profile basics, dossier merge, and scenario-data portability remain Pilot `NO-GO`. The earlier copy-and-reconfirm design—including copying `displayName` or `birthDate` from another Nurture workspace—is withdrawn. Platform identity fields are read only from the current My-Chat owner API; Nurture receives no raw ids or birth fact.
5. A future scenario-data transfer, if separately authorized, is a distinct versioned consent protocol over the already current platform identity and fresh target-local association. It must be minimum-allowlisted, source- and target-owner-reread, expiring, replay-safe, revocable before consume, audited, and zero-authority by default. It cannot use Workflow Handoff/Outbox/provider payloads as a body ledger or commit authority.
6. My-Chat global binding revoke fences every workspace route without rewriting local facts. Closing one target association, Enrollment, or workspace relationship affects only that target. Merge/split does not auto-follow, rewrite, or merge anchors/dossiers; an already-different target anchor is quarantined for owner reconciliation. Technical Operator cannot edit either side.
7. C-2f-4-3 remains planning-only and introduces no current protocol route, token, capability, schema implementation, database, Handoff, or traffic. The late C-4-5 reconciliation and `platform_child_family_identity_source_v1` qualification are authoritative for implementation.

The boundary matrix is:

| Case | Required outcome |
| --- | --- |
| Exact current platform identity, fresh target workspace | May run the parent-owned anchor/binding/local-association saga; no source dossier or authority transfer. |
| Existing current target association | Explicit owner-resolved reuse; no duplicate local aggregate. |
| Same adult or similar facts without exact binding | Generic unavailable; no matching, candidate, count, or write. |
| Another adult or forwarded token | Denied; ordinary Co-Guardian onboarding is separate. |
| Source workspace has richer profile/history | Not visible and not copied into the target. |
| Global binding revoked | All workspace routing fenced; local facts retained. |
| One workspace association/Enrollment closes | Only that workspace closes; global binding and other local facts are unchanged. |
| Merge target has a different anchor | Quarantine; no automatic rebind or dossier merge. |
| Future scenario-data transfer | Separate consented protocol; current Pilot has no route or token. |
| Existing Workflow Handoff/Outbox | Refs-only and never portability body or business authority. |

C-2f-4-3 evidence must cover exact identity reuse with fresh target-local association, existing-local reuse, no cross-workspace list/count/existence leakage, PII/fuzzy/raw-id denial, zero local authority/content carryover, target predicate reread, global-revoke versus local-close independence, merge-conflict quarantine, absent transfer routes/tokens, Handoff/Outbox denial, and planning-only status.

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
11. Transfer proposal snapshots one cohort-level draft containing the exact current-Family Guardian RoleAssignment set. Family withdrawal uses one cohort draft containing only other current Guardians and excludes the actor. Institution service end uses one cohort draft containing all current Guardians. Pause/resume, transfer cancel/decline/confirm, fresh re-entry confirmation, every stage mutation, and portability create no lifecycle Handoff; initial/re-entry invitation retains the existing Host Enrollment Invitation path.
12. Recipient membership is captured in the owner-owned cohort at business commit. Later-added Guardians do not receive an old event; lost/suspended/exited recipients stop on current owner reread. No eligible recipient produces explicit `[]`; a nonempty cohort produces exactly one stable draft and at most one Handoff for the business effect. My-Chat derives at most one logical Notification candidate per exact `(Handoff, recipient RoleAssignment, continuity key)`. Exact replay returns the identical snapshot/cohort, transfer review expires no later than its Intent, and termination attention expires after seven days or the earlier Pilot allowlist cutoff.
13. A non-empty-capable path is Host-first and requires a durably persisted, currently claimed original My-Chat Step before the first Nurture commit. Missing trusted provenance fails before commit. Same-Step reclaim may materialize once; wrong-Step, recipient/source/expiry mutation, after-the-fact replay-seed invention, raw claim-token persistence/logging, and Admin-created drafts are forbidden. Delivery failure never rolls back business facts.
14. Provider copy is generic, for example `有一项托育关系更新待查看`, and carries only My-Chat `notification_id`. Provider copy contains no child/Institution name, body, target, relationship/action state, business ref, or Nurture context. Opening validates exact My-Chat user/workspace/Notification before a Nurture call, then eligible Handoff, current Nurture owner resolver, destination-bound `open_notification`, and destination reread. Wrong user/workspace/id is generic unavailable with no Nurture call. Host read/unread and provider delivery never become Nurture lifecycle.

The current Host-effect matrix is:

| Lifecycle event | Current/future effect boundary |
| --- | --- |
| Family/Institution pause or resume | Explicit `[]`. |
| Transfer proposal | One future additive cohort-level relationship-attention draft containing the exact commit-time Guardian RoleAssignment set. |
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

C-2f-5 evidence must cover every result vocabulary combination, exact output-ref codec, ref non-disclosure, four presenters on every entitled surface, route-only navigation, stable Execution lookup ordering, response loss at each post-commit seam, same-Step/wrong-Step behavior, lost-command-id fallback, precommit denial, pinned legacy `user_attention`, absent/default-off future additive contract, exact Host-effect/recipient/expiry matrix, original-Step provenance, notification privacy/open ordering, current owner reread, and planning-only scope. C-2f is complete as a decision contract; no manifest, registry, contract package, source, schema, migration, route, runtime, capability, database, environment, provider, or traffic changed. At this historical boundary the following C-3 section entered design work while C-4 remained open; the later C-3/C-4 sections in this document supersede that next-step status and now close Pilot-0-C design only.

### Pilot-0-C3 — Guardian/Caregiver operational IIB (DESIGN COMPLETE / IMPLEMENTATION OPEN)

Status terms in this section are deliberately two-dimensional. `LOCKED` means a decision is no longer open; `LOCKED / COMPLETE` means the named decision set is complete, not that code or operations exist. Only `DESIGN COMPLETE / IMPLEMENTATION OPEN`, `DEFAULT-OFF ADOPTED`, and `C3_QUALIFIED_DEFAULT_OFF` describe implementation progress. The later C-4 section closes Pilot-0-C design and the later D section locks Pilot-0-D design; overall Pilot-0 remains in progress until separately authorized implementation/candidate assembly and Pilot-0-E.

The C-3 documentation authority is:

| Document | C-3 authority |
| --- | --- |
| `09-pilot-readiness.md` | Decision, product-scope, phase, dependency, and qualification SSOT. |
| `02-architecture.md` | Architecture projection of this SSOT; the projection cannot introduce different behavior. |
| `06-ib-nurture-schema-spec.md` | Persistence/schema projection of this SSOT; the projection cannot redefine product or trust semantics. |
| `08-iia-schema-policy-test-design.md` | Verification projection of this SSOT; tests must prove, not reinterpret, the decision. |
| `00-overview.md`, `01-plan.md`, `roadmap.md` | Status and navigation summaries only. |

If a projection conflicts with this decision SSOT, implementation stops until the documents are reconciled. The main path is `C30 shared baseline -> C31 Guardian communication -> C32 Guardian authority -> C33 Caregiver operations -> C34 continuity -> C35 convergence/qualification -> C4 Institution IIB`; later nodes consume immutable earlier evidence and never recreate an earlier semantic source.

| Checkpoint | State | Decision boundary |
| --- | --- | --- |
| C-3-0 shared subject-aware IIB baseline | **DESIGN COMPLETE / IMPLEMENTATION OPEN** | Account–Subject reachability, authenticated ingress, presentation, action execution/recovery, protected-data lifecycle, draft/AI/cache/offline policy, and complete adoption evidence are locked. Contracts/runtime/schema/KMS/surfaces remain unimplemented and default-off. |
| C-3-1 Guardian family-communication IIB | **DESIGN COMPLETE / IMPLEMENTATION OPEN** | Item-root question entry, orthogonal lifecycle/visibility, protected manual compose, claimed-Step submit, authorized current/recent/history, two-Guardian rules, exact-author source redaction, and default-off three-repository adoption are locked. |
| C-3-2 Guardian relationship/authority IIB | **DESIGN COMPLETE / IMPLEMENTATION OPEN** | First/Co-Guardian onboarding, accepted relationship/self-exit, Enrollment, hold, transfer, withdrawal, Grant, and StageEpisode presentation/strong-confirmation paths are locked across entitled Guardian surfaces without collapsing their owner lifecycles. |
| C-3-3 Caregiver operational IIB | **DESIGN COMPLETE / IMPLEMENTATION OPEN** | One Item-root Chat/teacher-board work projection, Attention index, transient protected detail, explicit acknowledge/exact claim, same-role claimed reply on the original Grant, typed commit-time Guardian audience, action-origin-aware `user_attention`, history, and exact staff-episode reply redaction are locked; C33-I0..I7 remain unimplemented/default-off. |
| C-3-4 cross-surface/result/notification continuity | **DESIGN COMPLETE / IMPLEMENTATION OPEN** | Route/view-only transitions, draft stay/discard, original Execution/Step recovery, typed recipient Notification materialization, pre-provider owner reread, lease/retry, Notification-id deep link, authenticated two-stage open, stale/privacy/offline semantics, and C34-I0..I8 default-off evidence are locked. |
| C-3-5 Guardian/Caregiver evidence and exit | **DESIGN COMPLETE / IMPLEMENTATION OPEN** | Cumulative default-off adoption, immutable component-candidate/evidence envelope, separate Guardian-authority and J1-J4 rendered coverage, fault/privacy/KMS/rollback evidence, final false/empty gates, and `C3_QUALIFIED_DEFAULT_OFF / C4_PENDING` exit without claiming Pilot or Institution C-4 closure. |

#### Pilot-0-C3-0 — shared subject-aware IIB baseline

| Sub-checkpoint | State | Decision boundary |
| --- | --- | --- |
| C-3-0a Account–Subject reachability | **LOCKED** | Product-scope versus platform-capability separation, account-to-owner relationship path, generic subject scope, opaque Host discovery, prospective boundary, and identity-isolation rules. |
| C-3-0b authenticated ingress and trusted principal | **LOCKED / COMPLETE** | C-3-0b-0 through C-3-0b-4 lock public/private trust, exact ingress, client/Host/owner fields, denial, audit retention/access, additive adoption, and negative planning closure. |
| C-3-0c subject-aware presentation contract | **LOCKED / COMPLETE** | C-3-0c-0 through C-3-0c-4 lock pipeline/ownership, provider/presentation wire, renderer/persistence/freshness/accessibility, atomic capability, named adoption identities, three-repo order, legacy/no-fallback behavior, and four-layer conformance. Completion is planning-only; actual adoption remains unsatisfied under the now-locked C-3-0e evidence contract. |
| C-3-0d action execution and recovery | **LOCKED / COMPLETE** | Atomic capability, prepare/submit, static driver matrix, pre-claim Step binding, canonical identity, typed actor, atomicity, result/replay/reconciliation, adoption, and negative evidence. |
| C-3-0e protected data, offline, complete-IIB adoption, and evidence | **LOCKED / COMPLETE** | Atomic protected-interaction gate, five content classes, encrypted owner storage/read/erasure, protected composer, process-local drafts, separately gated AI, no cache/offline fallback, Pilot retention, named adoption evidence, and planning-versus-implementation exit are fixed. |

**C-3-0a — Account–Subject reachability (LOCKED)**

1. My-Chat's activated user-facing business scenario catalog converges on education and nurture. Reusable Chat, Workflow, Notification, Forum/Knowledge, delivery, and Technical Admin remain subject-neutral infrastructure and do not acquire synthetic child references. Product-scope convergence does not collapse repositories, scenario ownership, or canonical stores.
2. Product experience remains child-centered, while reusable Base contracts use generic `subject`. My-Chat owns the protected platform Child/Family identity and scenario-binding ledger; Nurture still maps an activated `subject` context to one exact workspace-local `NurtureChildCareProcess`. Platform identity, binding endpoint, local subject, and adult actor remain distinct. Neither My-Chat nor Base imports or reinterprets the Nurture domain type, and C-3-0a creates no child login.
3. Every activated business presenter/action begins with an authenticated My-Chat account/workspace and must let the scenario owner prove a current Account–Subject relationship path before returning a subject presentation or action context. A client-supplied account, Participant, role, subject, Family, ChildCareProcess, CareGroup, Enrollment, Institution, or relationship type is not proof.
4. My-Chat owns current platform stewardship/membership, exact Child+Family binding pair, and `FamilyChildMembership`; Nurture owns the workspace-local care relationship graph. Guardian path requires both Host owner-read and Participant -> current exact Guardian RoleAssignment -> exact child-scoped Family -> ChildCareProcess plus current anchor associations. C-3 Caregiver path additionally requires the current bound subject, then Participant -> one exact current operational `caregiver + scopeType=care_group` RoleAssignment -> exact CareGroup -> current eligible Enrollment -> ChildCareProcess collection; Lead is separate and Institution/Enrollment-scoped roles deny. Neither owner path is sufficient alone. Institution Admin collection reachability remains a C-4 contract-negative shape and is absent from C-3 routes/presenters. Technical Operator has no business subject relationship.
5. Shared subject scope is exactly `unresolved|single_subject|subject_collection`. `unresolved` permits only bounded owner-returned safe candidates and clarification; `single_subject` binds one exact owner-resolved process; `subject_collection` is a current role-scoped aggregation, not batch mutation, shared Grant, cross-subject consent, or another collection's discovery authority.
6. A prospective invitation is not an established Account–Subject relationship. The prospective context exposes only the invitation's separately locked minimum allowlist. Invitation acceptance, same adult, institution roster prefill, display name, birth fact, contact, or opaque Host binding cannot reveal other subjects or authorize current subject actions before the owning onboarding transaction commits.
7. Every future activated education/nurture scenario must expose a versioned scenario-owner subject provider that can list current reachable contexts and resolve/recheck one opaque context. Exact manifest field names, wire DTOs, provider methods, and persistence classes remain C-3-0c/Base work and cannot be inferred by implementation before that lock.
8. My-Chat may organize cross-scenario entry by its current protected `child_id`, but each Nurture tile, detail, action, delivery, retry, and open carries only opaque scenario routing and must reread both the Host identity/binding owner and the Nurture local owner. My-Chat creates no second canonical Subject or account-subject authorization table for Nurture, and a platform Child/Family row or binding cannot cache Nurture authority. Any refs-only access index remains revocable, non-authoritative, and subject to separate privacy/lifecycle review.
9. Every render, selection, detail/history read, action preparation, submit, result, Notification open, retry, and recovery rereads the relationship path and current subject/scope lifecycle/policy. A cached Host entry cannot authorize, fill an owner outage, preserve lost membership, reveal a removed subject, or bypass a current denial.
10. Subject context is not the platform identity, custody proof, raw business reference, workspace bridge, portability token, role delegation, authority transfer, or account impersonation. Exact current platform binding is permitted routing evidence and is not same-child inference; PII/fuzzy search, unbound matching, cross-workspace dossier discovery, role/Grant carryover, merging, and automatic migration remain forbidden. Cross-workspace platform identity reuse still creates or resolves a separately authorized local association.

The authoritative reachability examples are:

| Actor context | Required owner path | Returned scope | Explicit denial |
| --- | --- | --- | --- |
| Current Guardian | Account -> current platform Family membership/Child+Family binding pair -> current local associations -> Participant -> Guardian RoleAssignment -> child-scoped Family -> Process | One or more `single_subject` options or a Family-scoped collection for navigation. | Another child, stale/exited membership or role, guessed id, account-history inference. |
| Current Caregiver/Lead | Account -> current platform Child/Family bindings and local association -> Participant -> exact CareGroup role -> current eligible Enrollments | CareGroup `subject_collection`. | Outside-group child, roster-only/binding-only access, direct family relationship, bulk authority. |
| Current Institution Admin | Account -> Participant -> exact Institution role -> scoped Groups/Enrollments | Institution/Group `subject_collection` with separately locked safe fields. | Family body, stage, another Institution, Guardian/Caregiver action, global child discovery. |
| Prospective invited adult | Account -> exact current invitation only | Minimum prospective invitation context plus the exact separately authorized onboarding action, not an established subject. | Existing subject directory, protected profile/history, or any ordinary subject action before onboarding commit. |
| Technical Operator | Exact Host operator entitlement only | No business subject context. | Subject listing, relationship search, protected content, or business command. |

The scope behavior is:

| Scope kind | Allowed behavior | Forbidden behavior |
| --- | --- | --- |
| `unresolved` | Show bounded display-safe owner candidates and ask clarification. | Business action, raw id entry, candidate persistence, cross-scope search. |
| `single_subject` | Render/action against one exact owner-reread subject path. | Treat opaque context as stable identity or skip relationship/policy reread. |
| `subject_collection` | Render current role-scoped aggregates and select one owner-returned member. | Batch write, shared consent/Grant, membership caching as authority, inference of excluded members. |

C-3-0a evidence must cover product-catalog versus infrastructure classification, generic-contract non-leakage, every dual-owner account/role reachability path, zero/one/multiple Guardian subjects, two-Guardian same-Family access with independent platform membership and Nurture role, the three-child Caregiver collection, Institution safe collections, prospective invitation minimums, Technical Operator absence, every scope kind, client raw-id/relationship injection, stale/revoked binding or local owner path at every read/action seam, exact platform correlation without cross-workspace dossier visibility, one Family/multiple-child cross-child denial, and planning-only scope. No contract package, manifest, schema, provider, route, handler, UI, runtime, database, environment, capability, or traffic changed. C-3-0b continues in the following section with C-3-0b-0 locked and C-3-0b-1 next.

**C-3-0b — authenticated ingress and trusted principal (LOCKED / COMPLETE)**

| Sub-checkpoint | State | Decision boundary |
| --- | --- | --- |
| C-3-0b-0 trust model | **LOCKED** | Sole My-Chat public ingress, independent workload/adult proofs, Host trust terminus, Nurture business authority, invitation separation, and legacy compatibility. |
| C-3-0b-1 public ingress, session, and workspace establishment | **LOCKED** | General/business/invitation context modes, explicit general-to-business transition, workspace source precedence, session/membership/gate order, separate acceptance/continuation, safe public states, and current gaps. |
| C-3-0b-2 private service caller and principal envelope | **LOCKED** | Independent caller credential and signed request, exact human principal, request/contract binding, 60-second freshness, nonce-versus-command replay, audience/subject/key rotation, strict codec, normalized boundary, and additive no-fallback activation. |
| C-3-0b-3 ingress path variants | **LOCKED** | Registered product/transition/runtime ingress; exact caller-origin matrix; two-stage Notification; Step-bound durable replay; invitation-bound prospective Participant exception; separate C-0 and owner-recovery channels. |
| C-3-0b-4 client allowlist, denial, audit, and adoption evidence | **LOCKED / COMPLETE** | Exact echo/Host/owner classes, layered public outcomes, body-free owner-split audit and retention/access, three-repo compatibility/adoption, negative matrix, and planning exit. |

**C-3-0b-0 — trust model (LOCKED)**

1. My-Chat is the only public business ingress for Chat, role boards, domain workbenches, Notification/deep-link opens, and user-facing onboarding. Browser/mobile clients never call Nurture presenter, subject provider, resolver, policy, command, recovery, dev-host, or internal service routes directly.
2. Every private business invocation requires two independent proofs: an allowed My-Chat workload authenticates the service-to-service caller, and a Host-established adult principal identifies the represented canonical account/human actor in one exact workspace. A valid service caller without a valid adult principal cannot resolve a Participant or invoke a business action.
3. My-Chat trust terminates at contract version, opaque account ref, human actor ref, exact validated workspace ref, registered scenario/surface provenance, request/correlation evidence, and interactive-session or durable-Run-actor origin. Exact DTO/field names remain C-3-0b-2. The principal carries no Participant, RoleAssignment, business role, Subject, Family, ChildCareProcess, Institution, CareGroup, Enrollment, Grant, policy decision, target availability, or command authority.
4. On ordinary subject-aware paths, Nurture binds Participant from exact workspace plus canonical account ref and resolves current RoleAssignment, subject/work scope, target, lifecycle, Grant, policy, and action availability. Host actor ref is provenance only and cannot choose/create a Participant. Zero or duplicate/mismatched Participant fails closed without email/contact, history, alternate-workspace, or client-selection fallback; C-3-0b-3 owns the sole exact-invitation prospective exception.
5. A client may request a workspace, but selection is not proof. My-Chat must establish one exact current workspace before private invocation. Nurture cannot infer, default, or substitute workspace from Participant history, a cached Subject entry, conversation, Notification/Handoff, invitation, token, URL, or raw business object.
6. Scenario and surface provenance are established by the registered server route/composition. A client cannot author or switch them through a body/header field. A valid surface proves entry context only; that surface neither grants a Nurture role nor overrides the B3 action/surface matrix or current owner policy.
7. Action key, owner-issued opaque target/token, expected version, explicit confirmation, form/Chat input, and idempotency may cross as codec-validated but untrusted echoes. Structured client account/actor/role/scope/Subject/relationship/Grant/policy/availability fields are rejected; natural-language claims are ordinary intent text and never authority.
8. Host Invitation authentication/acceptance is a separate My-Chat identity transition and does not require the prospective recipient to already possess target-workspace membership. My-Chat authenticates the exact recipient, consumes the current invitation, and establishes the applicable Host membership before ordinary subject-aware ingress. Acceptance still creates no Nurture role or Subject authority; only the separately locked onboarding transaction may do so.
9. Workflow replay later recovers the represented adult from the durable Run actor plus current workspace membership and separately validates the claimed original Step. Worker/service identity is never the business actor. Notification/provider identity, Technical Operator, workspace admin, and C-0 provisioning service likewise cannot impersonate Guardian/Caregiver/Institution authority; their exact restricted paths remain C-3-0b-3.
10. Bearer/session credentials, internal service credentials, claim tokens, scenario tokens, raw invitation secrets, and provider credentials are transient and never enter Nurture facts, `CommandExecution`, logs, analytics, traces, metrics dimensions, Handoff/Outbox, Notification metadata, Host business projections, or user-visible errors.
11. Existing optional `actor_id` workflow fields and workspace-optional Nurture host envelope remain legacy/pre-activation scaffold. Activated subject-aware ingress requires an additive versioned contract and capability/validator gate. Legacy fixtures retain behavior; no field is globally tightened, silently reinterpreted, or used as a fallback authorization path.

The trust-layer matrix is:

| Layer | May prove | Cannot prove |
| --- | --- | --- |
| Public client | Bearer possession, requested workspace/route, opaque echoes, explicit input/confirmation. | Canonical account/actor, active membership, server surface, Nurture role/Subject/authority. |
| My-Chat authentication/shell | Canonical account, human actor, exact current workspace, registered scenario/surface, request provenance. | Participant, Guardian/Caregiver/Institution role, Subject membership, Grant/policy/action authority. |
| My-Chat service caller | Allowed private workload, audience/call provenance. | Represented adult or any business actor/decision by itself. |
| Nurture owner services | Participant binding, current role/scope/Subject/target/lifecycle/Grant/policy/action. | Host session validity, raw identity-provider state, service credential issuance, client authentication. |

The path classification is:

| Path | Adult-principal source | Locked trust rule | Exact mechanics owner |
| --- | --- | --- | --- |
| Chat, Family/Teacher/Institution board, domain workbench | Current interactive My-Chat session and exact workspace | Same principal model across surfaces; surface changes presentation/eligibility context, never role identity. | C-3-0b-1/b-3 |
| Host Invitation acceptance | Authenticated exact recipient plus current Host invitation | Separate pre-membership identity transition; no ordinary Subject access or Nurture role effect. | C-3-0b-1/b-3 |
| Notification/deep-link open | Current session plus exact Host recipient/workspace/Notification validation | Provider/deep link is routing evidence only; destination owner-rereads. | C-3-0b-3 |
| Durable worker/replay | Original durable Run actor re-resolved to current user/membership | Worker identity cannot substitute; original claimed Step remains separate driver provenance. | C-3-0b-2/b-3 |
| Technical Admin / C-0 bootstrap | Exact restricted Host operator or provisioning evidence | Never a reusable business principal; current C-0/B3-1d restrictions remain authoritative. | C-3-0b-3 |

C-3-0b-0 evidence must cover public-route isolation, dual-proof cross-product negatives, principal semantic allowlist, exact account-versus-actor binding, one-workspace establishment/no owner inference, server-derived surface/no surface authority, client echo versus authority injection, invitation pre-membership separation, worker/operator/service non-impersonation, credential non-persistence, legacy fixtures, additive vNext activation gate, and planning-only scope. Current My-Chat canonical authentication already resolves user/default human actor/current membership, but shared workflow inputs still allow optional actor/client workspace and the current Nurture envelope can omit/infer workspace; those facts are implementation gaps, not accepted Pilot ingress. No contract package, manifest, source, schema, migration, route, runtime, secret, environment, capability, provider, database, or traffic changed. C-3-0b continues with C-3-0b-1/2 locked in the following sections and C-3-0b-3 next.

**C-3-0b-1 — public ingress, session, and workspace establishment (LOCKED)**

1. My-Chat exposes exactly three Host context modes as planning vocabulary: `platform_general`, `workspace_business`, and `invitation_acceptance`. These are context classifications rather than Nurture roles, Workflow surfaces, persistence enums, or final shared wire names.
2. `platform_general` supports daily generic AI Q&A and Host-allowed global/public knowledge without an established business workspace. The mode may be anonymous or account-authenticated under My-Chat product policy, but never creates a trusted Nurture principal or calls a Nurture owner/provider/resolver. Child, teacher, Institution, or nurture language alone does not change that mode.
3. A general Chat thread may be physically stored under a personal workspace. That storage partition is not business context even when its id equals a workspace in which the account has Nurture relationships. General mode cannot read workspace-private Knowledge, Subject/recent-business history, Notification/Handoff, another workspace conversation, or Nurture data.
4. General mode may answer education/nurture questions only with generic non-personalized guidance. A request for private family/child/teacher/Institution/workflow facts produces an explicit proposal to enter a business workspace. The transition remains explicit even when exactly one eligible workspace exists; a sole membership resolves ambiguity but not user intent or privacy consent.
5. An accepted transition creates or enters a workspace-scoped conversation instead of relabeling the general thread. By default only the current user-confirmed trigger intent crosses. Prior messages, attachments, searches, generated summaries, inferred profile/context, scenario tokens, and tool results remain in the general conversation unless separately selected, display-reviewed, and allowed by later presentation/privacy contracts.
6. `workspace_business` is the only ordinary subject-aware ingress. An exact workspace may come from: a server-owned resource binding for an existing Chat thread, Notification, Workflow Run, or business route; an explicit shell selection; or a sole current membership only after entry through an explicitly business-scoped route. Resource binding wins. Header/body/shell mismatch, general-Chat personal default, recent workspace, cached Subject, owner inference, token, and another tab's mutable selection fail closed.
7. Ordinary business gate order is current My-Chat authentication and active canonical user/human actor; exact workspace establishment; active workspace and membership; environment capability; scenario registration; workspace allowlist/Pilot cohort; server-derived surface; C-3-0b-2 principal creation; then Nurture Participant/role/Subject/policy resolution. A failure before principal creation makes no Nurture call and exposes no owner existence evidence.
8. Every business read, prepare, submit, retry, Notification open, and result request revalidates the Host session. Chat/conversation state, expected version, prepared action, scenario/interaction token, Notification, and deep link cannot extend or substitute the session. Reauthentication rebuilds exact account/actor/workspace and current owner presentation but never automatically submits, revives, or moves an old action.
9. Account/human-actor/workspace/membership loss stops before Nurture. Multi-tab activity follows the workspace bound to each server resource rather than one globally mutable recent workspace. Switching another tab cannot retarget an existing conversation, action, Notification, or result request.
10. `invitation_acceptance` is an account-authenticated Host identity route and does not require pre-existing membership in the target workspace. Before sign-in, an invitation open reveals only generic sign-in guidance. After sign-in, My-Chat verifies the exact current recipient-bound invitation, purpose, target workspace/scenario binding, expiry, revocation/consumption state, and safe version before returning minimum safe invitation copy.
11. Invitation open never consumes. Explicit acceptance uses one Host transaction to consume/reuse the exact invitation and establish membership with first-commit-wins concurrency and stable exact replay. Wrong account, expired/revoked/consumed/drifted invitation, copied link, or concurrent non-identical request returns generic unavailable without a Nurture call or target detail.
12. Host acceptance and Nurture onboarding are separate commits. Acceptance may offer an immediate navigation/continuation, but cannot auto-run a Nurture command, create Participant/role/Subject authority, or share a distributed transaction. A capability/cohort/owner denial or Nurture outage blocks only the continuation and cannot roll back or rewrite Host membership. Response loss recovers each owner effect through its own idempotency evidence.
13. Because Host membership may expose generic workspace capabilities outside Nurture, Pilot relies on the isolated synthetic workspace and controlled non-Nurture content. Any non-isolated rollout requires a separate My-Chat workspace-content entitlement review; the C-3-0b-1 planning decision does not silently declare broad workspace ACL safe.
14. Public product states are `sign_in_required|account_context_not_ready|workspace_selection_required|workspace_unavailable|scenario_unavailable|access_changed|unavailable`. Internal account/membership role, workspace existence beyond the current request, capability/allowlist/cohort reason, invitation lifecycle, Participant/role/Subject/Grant/policy state, token, raw id, stack, and service failure details stay behind the safe boundary.

The public context matrix is:

| Context mode | Host identity/workspace | Allowed behavior | Explicit denial |
| --- | --- | --- | --- |
| `platform_general` | Host product policy; no established business workspace | Generic Q&A, public/global knowledge, account-level preferences/history allowed by My-Chat. | Nurture call, workspace-private Knowledge, Subject/business history, implicit personal/sole-workspace upgrade. |
| `workspace_business` | Current adult plus exact resource/shell/business-route workspace and active membership | Registered business surface, principal construction, then current owner resolution. | Workspace guess/default, cross-resource mismatch, membership-as-role, cached owner facts. |
| `invitation_acceptance` | Authenticated exact recipient plus current Host invitation; target membership not prerequisite | Minimum preview and explicit idempotent Host acceptance/membership. | Ordinary Subject access, Nurture role/action, auto-onboarding, distributed Host/Nurture commit. |

The workspace source matrix is:

| Source | Accepted when | Precedence/boundary |
| --- | --- | --- |
| `resource_bound` | Existing server-owned thread, Notification, Run, or business resource | Highest; client/shell mismatch fails. |
| `shell_selected` | Explicit business entry or confirmed general-to-business transition | Selection is revalidated against current active membership. |
| `sole_membership` | User already chose an explicitly business-scoped route and only one current workspace remains | Never upgrades `platform_general`; no personal default semantics. |
| `invitation_target` | Exact invitation preview/acceptance only | Becomes ordinary business workspace only after Host acceptance/membership and a separate continuation. |

The ordinary public gate order is:

`authenticate account -> validate active human actor -> establish exact workspace -> validate active workspace/membership -> environment capability -> scenario registration -> workspace allowlist/Pilot cohort -> derive server surface -> build trusted principal -> call Nurture owner`

Safe public mapping is:

| State | User-facing class |
| --- | --- |
| No current account session | `sign_in_required` |
| Canonical account/human actor not ready | `account_context_not_ready` |
| Business entry has several possible workspaces and no exact binding | `workspace_selection_required` |
| Requested/bound workspace or current membership is unavailable | `workspace_unavailable` |
| Environment/scenario/workspace/cohort gate is closed | `scenario_unavailable` |
| Previously visible Host/owner access changed | `access_changed` |
| No safe distinction is allowed | `unavailable` |

Current implementation is not evidence of C-3-0b-1 closure. My-Chat currently treats an omitted active workspace as the earliest active personal workspace, and its API command context assumes an active workspace. The repository has no adult Workspace Invitation aggregate/acceptance route; existing `AgentInvitation` serves agent participation and cannot be reinterpreted. No general-versus-business Chat mode, explicit privacy transition, minimal intent handoff, or complete subject-aware public gate exists.

C-3-0b-1 evidence must cover all three context modes, storage-versus-business workspace equality, generic questions about children, explicit transition with zero/one/multiple eligible workspaces, minimal intent carryover, resource/shell/tab mismatch, every gate seam with zero premature owner calls, session expiry/reauth/no auto-submit, membership loss, invitation preview/accept/replay/race/response loss, independent Host/Nurture failure, safe public states, isolated Pilot workspace, current gap detection, and planning-only scope. No contract package, invitation model, manifest, source, schema, migration, route, UI, runtime, secret, environment, capability, provider, database, or traffic changed. C-3-0b continues with C-3-0b-2 locked in the following section and C-3-0b-3 next.

**C-3-0b-2 — private service caller and principal envelope (LOCKED)**

1. Every ordinary private subject-aware call requires two independent proofs. One service credential authenticates an allowlisted My-Chat workload for `nurture.private-api.v1`; a separate ES256 detached signature covers the exact UTF-8 `ScenarioPrivateInvocationV1` body for `nurture.scenario-invocation.v1`. A valid credential without a valid signed principal, or a valid signed body without an allowed caller, cannot reach Participant lookup.
2. The signed `caller_binding.caller_subject` must equal the caller authenticator result. Initial subjects are `my-chat-api` paired only with `interactive_session`, and `my-chat-workflow-worker` paired only with `durable_run_actor`. Browser/mobile, provider, arbitrary worker, Technical Operator, C-0 provisioner, and Nurture itself are outside the ordinary matrix; C-3-0b-3 must classify exact special paths rather than widen the caller.
3. Shared wire type `ScenarioHumanPrincipalV1` is version `1`, kind `human_user`, and contains exactly one `my_chat/user` account ref, one `my_chat/actor` human-actor ref, one `my_chat/workspace` workspace ref, and `interactive_session|durable_run_actor` origin. Nurture product language may call the represented principal an adult, but no age/role claim enters the reusable contract.
4. My-Chat may sign only after current User, human Actor ownership, Workspace, membership, environment capability, scenario registration, workspace allowlist/Pilot cohort, and server-derived route/surface checks pass. Durable origin recovers Actor from the persisted Run and current membership, never the queue payload. Host Invitation acceptance creates no principal; a separately gated post-accept continuation constructs a fresh interactive principal.
5. On ordinary subject-aware paths, Nurture binds Participant only from Workspace plus User. Actor is provenance and cannot select/create Participant, role, Subject, scope, target, or action. Zero, duplicate, inactive, or mismatched Participant fails closed without Actor, `business_actor_ref`, email/contact, history, alternate workspace, cache, invitation, token, or client fallback. C-3-0b-3 alone defines the exact-invitation prospective transaction that may bind/create a missing Participant without becoming an ordinary fallback.
6. Principal fields never include PII, membership id/role, Participant/RoleAssignment, Nurture role, Subject/Family/Child/Process, Institution/CareGroup/Enrollment, Grant/policy/action/availability, target, surface, payload, session, invitation, scenario, service, or claim credential. Activated C3 domain commands use the resolved Participant as business actor and never Host Actor. Existing `NurtureCommandExecution.business_actor_ref` is already polymorphic: legacy family-core writes My-Chat/system refs while institution commands require Participant id. C-3-0b-2 does not reinterpret historical rows; C-3-0d adds versioned `nurture_participant` evidence plus a Restrict Participant FK and keeps Host provenance separately named.
7. `ScenarioPrivateInvocationV1` has exact top-level contract version/hash, issuer, assertion audience, caller binding, human principal, route, request, and operation payload. Route binds `scenario_key=nurture`, `endpoint_key=scenario_private_invoke_v1`, `method=POST`, and a separately versioned registered ingress surface. Request binds logical request/correlation/optional trace ids, issue/expiry times, and nonce. Operation binds a registered operation key and its own untrusted input codec.
8. The detached signature covers the final raw request body. Nurture compares the actual endpoint/method/scenario and rejects any altered body, payload, contract, caller, User/Actor/Workspace, surface, operation, request evidence, time, or nonce. Parse-and-reserialize verification, client-supplied route authority, repeated authority mismatch, and request-controlled key source are forbidden.
9. `expires_at-issued_at` is at most 60 seconds; verifier clock-skew tolerance is at most 30 seconds. Worker envelopes are signed immediately before the call rather than at enqueue time. Expired envelopes cannot be extended or refreshed; every retry rereads current Host facts and creates a new signed attempt.
10. Nonce is single-attempt transport evidence. Nurture atomically consumes an issuer/audience/caller-bound nonce hash in a multi-replica shared store before Participant/resolver calls; only hash and expiry persist, duplicate nonce performs zero owner calls, and store failure is fail-closed. A logical `request_id` may remain stable across response-loss recovery, while nonce and signature change.
11. Inner `command_request_id` remains the stable Nurture business idempotency identity. A fresh legal envelope plus the same command id/payload recovers one CommandExecution; changed payload conflicts. Read retry owner-rereads current facts rather than caching a previous body. Transport replay and business replay are therefore intentionally different layers.
12. Same-Step reclaim keeps the original persisted Step ref and command identity while current claim and nonce may rotate. Wrong-Step provenance fails even when caller, principal, signature, nonce, and command id are otherwise valid. Claim token may cross only as signed transient operation input and never becomes principal, request, nonce, command identity, persistence, log, trace, metric, Handoff, or Outbox data.
13. Service caller and invocation signature use separate credentials/key domains. Pilot pins ES256, exact type/algorithm/`kid`, issuer, environment-specific audience, trusted public-key source, and revoked set. `alg=none`, request-selected/alternate algorithms, wildcard/missing audience, `jku`/`x5u`/embedded key, URL `kid`, critical/unknown header, unknown-key try-all, and cross-environment verification are rejected.
14. Normal key rotation prepublishes next public key, waits for verifier propagation, changes the signer, accepts previous/current keys during at least a 15-minute operational overlap, and retires previous only after no signed envelope remains live. The overlap is deployment safety, not a longer assertion lifetime. Emergency compromise immediately revokes the exact key/caller and fails closed without compensating committed Nurture facts; old business evidence remains recoverable with a fresh legal envelope.
15. A temporary **disposable C-3 evidence** static caller authenticator may exist only with a separate high-entropy secret, exact evidence environment/audience/subject mapping, network source restriction, and current/next rotation. One environment selects exactly one caller authenticator and never falls back. The allowance cannot target `complete_pilot_v1` or the `pilot` environment. Current `NURTURE_INTERNAL_SERVICE_TOKEN` remains legacy activation owner-read-only and cannot authenticate ordinary scenario invocation; the D-locked complete Pilot requires workload-bound mTLS plus the signed invocation envelope and rejects static bearer authentication.
16. Private validation order is body/network guard, service caller, detached signature, exact envelope codec, time/audience/caller/route/contract cross-check, atomic nonce, operation codec, normalized verified context, Participant binding, then Nurture role/Subject/target/policy resolution. Unknown/null/duplicate keys, unsafe ids, noncanonical times, oversized body/depth/strings/arrays/refs, prototype pollution, unregistered surface/operation, and repeated authority mismatch fail before domain code.
17. Only a private verifier factory may construct `VerifiedScenarioInvocationV1`. The application layer receives normalized caller, User/Actor/Workspace/origin, safe route/request evidence, operation and input; domain services never receive HTTP request/response, service/session credential, JWS, nonce, key material, raw envelope, or broad Host metadata. Repositories remain behind Participant/owner application services.
18. Credentials, signature, nonce value, raw envelope/principal/payload, key material, session/invitation/scenario/claim tokens, PII, and owner candidates are absent from facts, CommandExecution, logs, traces, metrics, Handoff/Outbox, Notification, analytics, and error bodies. Safe provenance may include contract hash, origin, surface/caller key, request hashes, and separately named/hashed account/actor refs; no provenance field can authorize.
19. Additive Base contract work introduces `ScenarioPrivateInvocationV1`, `ScenarioHumanPrincipalV1`, a separately versioned ingress-surface type, strict conformance, and capability `trusted_scenario_invocation_v1`. Legacy optional `actor_id`, broad `client_surface`, workspace-optional/default/inferred behavior, old internal handlers, and legacy fixtures remain pre-activation only. An activated operation/environment has one vNext verifier/authenticator and never falls back after any validation failure.
20. C-3-0b-2 owns private envelope strict codec and no-fallback activation semantics. C-3-0b-4 still owns exact client echo versus Host-only fields, public denial mapping, audit retention/access, Base -> My-Chat -> Nurture adoption evidence, negative closure matrix, and planning exit; no competing private codec is created.

The locked private-call trust matrix is:

| Evidence | Exact proof | Cannot prove |
| --- | --- | --- |
| Service caller | Allowed My-Chat workload, environment, private API audience. | Human User/Actor, Workspace membership, Participant, role, Subject, action. |
| Signed envelope | My-Chat-established User/Actor/Workspace/origin and exact request body/route freshness. | Nurture Participant/role/Subject/Grant/policy without owner reread. |
| Single-use nonce | One accepted transport attempt. | Business idempotency, authorship, Step ownership, authorization extension. |
| `command_request_id` | One exact Nurture business command/replay identity. | Transport freshness, current caller, current membership, wrong-Step ownership. |
| Original Step ref | Durable replay owner for non-empty handoff seed. | Human identity, role, policy, or claim-token persistence. |

The normalized verification pipeline is:

`body guard -> service caller -> ES256 exact-body signature -> strict envelope/cross-field checks -> shared nonce -> operation codec -> verified Host context -> Participant -> current Nurture authority`

Current implementation is not C-3-0b-2 evidence. Base/My-Chat expose optional `WorkflowCommandMeta.actor_id` and broad `client_surface`; Nurture internal surfaces can derive `my_chat_user_id` from optional Host metadata; only one owner-read route uses the static internal token; there is no shared signed envelope, caller/origin mapping, strict principal codec, shared nonce store, key rotation/revocation path, verifier-only normalized type, or `trusted_scenario_invocation_v1` capability. `business_actor_ref` is also a real semantic dual-use: legacy family-core writes `my_chat:user:*` or system refs while institution family-care commands require Participant id. These are implementation blockers, not accepted Pilot behavior.

C-3-0b-2 evidence must cover the full dual-proof cross-product, exact principal allowlist, Host construction gates, Workspace+User Participant binding, raw-body/request/contract binding, 60-second time boundaries, concurrent nonce consumption and outage, response-loss versus business replay, same/wrong-Step, algorithm/header/audience/key negatives, normal/emergency rotation, environment isolation, optional Pilot authenticator with no fallback, strict codec limits, verifier-only construction, persistence/log exclusions, legacy compatibility, vNext fatal gates, current-gap detection, and planning-only scope. No contract package, manifest, source, schema, migration, route, UI, runtime, secret, environment, capability, provider, database, or traffic changed. C-3-0b-3 ingress path variants are next.

**C-3-0b-3 — ingress path variants (LOCKED)**

C-3-0b-3 uses one versioned discriminated ingress context for the signed human-principal boundary. `ScenarioIngressSurfaceV1` is a reusable Base structure with exact `ingress_version=1`, a closed category, and one scenario-registered key. The Nurture Pilot registry is:

| Ingress category | Registered keys | Meaning |
| --- | --- | --- |
| `product_surface` | `nurture_chat`, `family_board`, `family_workbench`, `teacher_board` | Current C-3 Guardian/Caregiver product presentation/action context. `institution_board|institution_workbench` are reserved C-4 keys and MUST be absent from the C-3 manifest, route registry, presenter registry, and candidate. |
| `host_transition` | `notification_open`, `invitation_continuation` | A bounded My-Chat transition that is not a role surface or continuing authority. |
| `workflow_runtime` | `workflow_worker` | Durable runtime entry with no user-interface entitlement. |

Base owns the category structure and validator semantics, the Nurture manifest owns exact registered keys plus allowed operation combinations, and My-Chat owns the server route-to-ingress registry. Device labels such as `mobile|web|desktop`, generic `web_run_workbench`, broad/legacy `client_surface`, and `technical_admin` are not Nurture product surfaces. Chat has one `nurture_chat` key and remains role-agnostic among currently entitled roles; Institution capability is not exposed through Chat. Surface proves only registered entry context for eligibility, presentation, and safe audit. The surface cannot choose Participant/role/Subject/scope/target/policy and is not part of canonical business command identity.

The signed caller/origin/ingress matrix is closed:

| Path | Caller and principal | Ingress | Participant behavior |
| --- | --- | --- | --- |
| Chat/board/workbench | `my-chat-api + interactive_session` | Exact registered `product_surface` | Exactly one current Workspace+User Participant is required. |
| Notification/deep-link open | `my-chat-api + interactive_session` after exact recipient/workspace/Notification validation | `host_transition/notification_open` | Current Participant/role/target is reread; open is read-only. |
| Durable worker/replay | `my-chat-workflow-worker + durable_run_actor` reconstructed from persisted Run | `workflow_runtime/workflow_worker` | Exactly one current Participant plus the separately claimed original Step is required. |
| Post-accept onboarding | `my-chat-api + interactive_session` after independent Host acceptance/membership commit | `host_transition/invitation_continuation` | Sole exact-invitation-bound exception that may atomically create/reuse a missing Participant. |
| Execution-status recovery | Dedicated `my-chat-execution-recovery` workload; no ordinary human-principal envelope | Separate `scenario_execution_status_lookup_v1` endpoint/operation outside the ordinary ingress categories | Uses frozen original admission/request/command/optional Run+Step provenance only; performs no Participant, role, subject, policy, presenter, or business-command resolution. |
| C-0 bootstrap | Separate provisioner caller/assertion/audience/endpoint | Outside `ScenarioPrivateInvocationV1` and `ScenarioIngressSurfaceV1` | Fixed one-time transaction may create the first Participant; no ordinary principal. |
| Technical Operator | My-Chat Technical Admin; separate owner-recovery caller only when needed | Outside `ScenarioPrivateInvocationV1` and Nurture role surfaces | Operator never resolves as Participant or business actor. |

Interactive product behavior is exact:

1. `platform_general` produces no Nurture product-surface call. Explicit transition into one exact `workspace_business` context precedes `nurture_chat`, including when only one workspace is eligible.
2. My-Chat authenticates the current session/User/human Actor, establishes the exact workspace/membership and all gates, and derives the product key from a registered server route before signing.
3. Nurture still resolves Participant, eligible role, Subject/work scope, target, Grant, policy, lifecycle, and action availability. A valid product key cannot grant a role or convert Institution Admin into Chat authority.
4. Chat/board/workbench adapters converge on the same registered owner presenter/command. They MUST NOT duplicate the domain state machine or alter command identity because presentation differs.
5. Client device/tab/page labels remain untrusted echo and are deferred to C-3-0b-4. They cannot replace or select the signed ingress context.

Notification open is a two-stage current-owner path:

1. Provider payload and deep link carry only the recipient-bound Host Notification id and generic open route. They never authenticate a person, choose a workspace, or contain a Nurture token/ref/body.
2. My-Chat authenticates the session, validates exact recipient + workspace + Notification, marks only the Host Notification read under the already locked B3-2c semantics, and then creates the fresh `notification_open` signed invocation from server-side Notification/Handoff evidence.
3. The Nurture notification resolver rereads the current Participant, role, reachable scope, Grant, policy, source/target lifecycle, and visibility. The request does not author the destination product surface.
4. A ready result returns a current generic destination route plus a newly issued destination-bound `open_notification` locator. The subsequent destination request is a new product-surface invocation and owner read.
5. Repeat/multi-device opens, session loss, revoke, redaction, withdrawal, stale Handoff, owner outage, and target closure never restore old content or execute acknowledge/reply/submit implicitly.

Durable workflow behavior is exact:

1. The worker rereads the persisted Run actor, resolves the current canonical User/human Actor/workspace membership and Pilot gates, and signs immediately before each attempt. Queue payload identity cannot create the principal.
2. `workflow_worker` is the only runtime ingress. A prior UI surface may remain safe initiating provenance but cannot be asserted as the current surface or authority.
3. An operation must be explicitly registered for durable ingress. Product-surface-only domain actions cannot be made durable by relabeling the request, and a direct domain action does not gain a synthetic Workflow Run.
4. The claimed original Step, Run, expected version, driver ref, and claim token remain a separate driver context. Claim token is signed transient input only and is absent from Principal, command identity, persistence, Handoff, Outbox, logs, traces, and metrics.
5. Response loss uses the same original Step and stable `command_request_id` with a fresh claim/nonce/signature. Wrong Step/Run, cross-origin, cross-ingress, and cross-operation replay fails even when the business id and payload otherwise match.

Post-accept onboarding behavior is exact:

1. Host invitation preview/acceptance remains entirely in My-Chat. Acceptance commits/replays workspace membership independently and creates no Nurture role, Subject access, or automatic business effect.
2. A user-confirmed continuation creates a fresh interactive principal plus exact server-bound Host invitation correlation and current operation-specific confirmation. Client contact, role, raw Participant/Subject ids, or invitation wording cannot select authority.
3. `invitation_continuation` dispatches to a prospective-onboarding application service before ordinary Participant resolution. Only explicitly registered invitation transactions may bind/reuse the exact Workspace+User Participant and perform the previously locked staff/family onboarding effect.
4. `invitation_continuation` is the sole signed-human exception to ordinary zero-Participant denial. The exception is transaction-specific, never a generic find-or-create fallback, and exposes only the already locked prospective invitation allowlist before commit.
5. Exact replay returns the original CommandExecution/result; payload, recipient, workspace, invitation, lifecycle, or confirmation drift conflicts or fails closed. Host acceptance and Nurture transaction never share a distributed transaction.
6. After commit, navigation creates a new ordinary product-surface invocation. Invitation correlation/continuation cannot authorize later reads or actions.

C-0 and Technical Operator remain isolated:

1. C-0 bootstrap uses a separately versioned provisioning assertion/spec, workload caller, audience, endpoint, verifier, gate, and fixed operation. The exact accepted initial Admin and Host membership are bound evidence rather than a caller credential or ordinary principal. The transaction is idempotent, closes permanently, and cannot be authored/reopened by Institution Admin or Technical Operator. Before D, only `c4_bootstrap_evidence_controller` may generate/sign/store/custody/revoke/destroy the disposable synthetic evidence specification in its isolated issuer/audience/store/target domain. Pilot-0-D retains issuance, custody, deployment, revocation, and rollback only for the real Pilot specification; neither domain may authorize or substitute for the other.
2. Technical Run/Step/Handoff/Outbox/Notification operations remain My-Chat-owned. Only `request_owner_reevaluation` may cross to a separately versioned owner-recovery endpoint with opaque refs, current Host evidence, expected version/idempotency, and operator audit provenance.
3. Provisioner and Technical Operator never construct `ScenarioHumanPrincipalV1`, register a Nurture role surface, resolve as Participant, or use the ordinary private endpoint. An owner-authorized deterministic recovery transition is attributed to the owner-recovery service; the operator remains initiating audit evidence only.
4. Both special boundaries require independent capability/allowlist and no fallback. They cannot accept arbitrary business payloads, expose protected content, or reuse `NURTURE_INTERNAL_SERVICE_TOKEN` as new authority.

Cross-path invariants are mandatory:

1. Every operation declares exact allowed caller, principal origin, ingress category/key, and handler class. Any unregistered combination fails before Participant/business resolution.
2. `my-chat-api` cannot assert `durable_run_actor`; `my-chat-workflow-worker` cannot assert `interactive_session` or a product/transition surface.
3. Notification, invitation continuation, durable replay, provisioning, and owner recovery cannot fall back or upgrade into one another after validation, owner, policy, or availability failure.
4. A business replay keeps the original ingress class and operation provenance. Surface remains outside canonical effect identity, but current surface/token/Step binding remains a replay precondition where declared.
5. Every attempt rereads current Host and Nurture facts. No prior session, Notification, locator, UI presentation, workflow attempt, provisioning spec outcome, or operator request becomes continuing authorization.
6. The implementation dependency direction is public route -> Host auth/controller -> ingress orchestration/signer -> Nurture verifier/controller -> variant application service -> domain resolver/policy/command -> repository. Routes/controllers contain no Nurture business resolution, and domain services receive no HTTP/JWS/credential object.
7. Activated variants cannot fall back to optional `actor_id`, default/inferred workspace, broad `client_surface`, legacy event dispatch, dev-host route, owner-read token, legacy handler, or another authenticator.

Current implementation is not C-3-0b-3 evidence. Base/My-Chat/Nurture have no discriminated ingress type/registry or variant validator; existing `WorkflowSurface`/`client_surface`, optional Host identity, `NurtureHostInvocationEnvelope.event.kind`, `worker_runtime`, generic workbench labels, and static owner-read token remain legacy/scaffold semantics. Notification does not implement the complete two-stage signed owner path, post-accept onboarding has no exact Host invitation route/contract, and separate provisioning/owner-recovery private boundaries do not exist. `NurtureCommandExecution.business_actor_ref` remains polymorphic; C-3-0d now locks the future typed/versioned persisted actor semantics without claiming implementation.

C-3-0b-3 evidence must cover exact ingress registry/type validation, every caller/origin/ingress/operation cross-product, the four registered C-3 product surfaces, explicit absence of both reserved C-4 Institution surfaces, general-to-Chat transition, Institution-through-Chat denial, two-stage Notification reread, provider/deep-link non-authority, worker no-UI-surface behavior, same/wrong-Step replay, invitation acceptance/continuation separation, zero-Participant ordinary denial versus the sole prospective exception, the isolated execution-status recovery caller/endpoint, onboarding replay/drift/non-disclosure, C-0/operator endpoint isolation, owner-recovery audit-only operator semantics, cross-path replay denial, layering, legacy compatibility, current-gap detection, and planning-only scope. No contract package, manifest, source, schema, migration, route, UI, runtime, secret, environment, capability, provider, database, or traffic changed. C-3-0b-4 is next.

**C-3-0b-4 — client allowlist, denial, audit, and adoption evidence (LOCKED / COMPLETE)**

C-3-0b-4 closes authenticated-ingress planning by separating three field classes. A signature proves that My-Chat transmitted the exact private body; the signature does not upgrade untrusted client data into identity, role, scope, or policy authority.

| Field class | Allowed meaning | Examples |
| --- | --- | --- |
| Client echo | Strictly codec-validated intent/query/confirmation input that never proves authority. | Chat text, `client_message_id`, bounded view mode/cursor/page/query, scenario/option token, action key, owner-issued opaque target, expected version, operation input, confirmation, `client_mutation_id`, presentation hints. |
| Host-established | Current My-Chat identity, route, request, durable, or authentication-assurance evidence built after Host checks and unavailable for client override. | User/Actor/Workspace, session/membership/gates, scenario/endpoint/ingress, caller/origin, contract/time/nonce/signature, request evidence, conversation/Notification/Handoff/Invitation/Run/Step/driver refs, claim token, server-established request/driver identity inputs, authentication-assurance evidence. |
| Nurture-owner-only | Current domain facts and canonical business-effect semantics resolved or validated by Nurture and forbidden as Host authority. | Participant/RoleAssignment/role, Subject/Family/Process, Institution/CareGroup/Enrollment, Grant/direction/data class, target availability, policy, lifecycle, action availability, owner candidates/relationship path, canonical effect identity/hash/replay disposition under the registered operation/driver contract. |

The additive `ScenarioClientEchoV1` contract is a strict discriminated union:

1. `chat_text` carries bounded ordinary Chat intent text and optional bounded `client_message_id`. This variant is governed by My-Chat transcript/provider policy and MUST NOT carry, prepare, or automatically become a Nurture protected business body.
2. `view_query` carries only `current|recent|history`, an owner-issued opaque cursor, bounded page size, and an operation-registered exact query schema.
3. `clarification_answer` carries one scenario token and an operation-registered option/answer schema.
4. `action_prepare` carries a registered action key, owner-issued opaque target, optional expected version, and an operation-registered exact input schema.
5. `action_submit` carries an owner-issued `submit_action` context/token, exact explicit confirmation, and bounded `client_mutation_id`. A client cannot author `command_request_id`. My-Chat may establish registered request/driver inputs, while Nurture validates the canonical effect identity/hash/replay under the operation/driver contract. C-3-0d defines the distinct direct-empty and claimed-Step derivations; neither is implemented or activatable by C-3-0b.
6. Optional presentation hints are limited to `mobile|web`, normalized locale, and IANA time zone. They cannot affect database time, expiry, policy, role, destination, or business result.
7. Unknown/duplicate/null authority fields, unregistered schema/version, unbounded object/array/string/depth, raw Nurture ids, structured role/scope/policy/availability fields, and forbidden attachments fail before private invocation. Pilot-0 has no attachment echo.
8. A natural-language role/object claim remains intent text. A structured authority claim is rejected rather than ignored or copied into broad metadata.
9. Notification/Invitation ids may be public My-Chat route inputs, but exact recipient/resource validation converts them to server-side Host evidence; the raw client value is not forwarded as Nurture echo.
10. Client confirmation never satisfies Host authentication assurance or Nurture strong authorization. A separately bound Host assertion may prove only the required recent-authentication ceremony and remains outside client echo. Nurture strong authorization still requires current owner facts, policy, the owner-issued submit context, exact action, and explicit confirmation.

Activated vNext MUST NOT expose free-form `structured_payload`, `form_data`, `display_state`, `details`, filters, sort, local context, or metadata. Reusable Base types may parameterize registered operation schemas, but every activated operation resolves one exact schema/version and rejects extra fields. Legacy broad objects remain pre-activation fixtures only.

Public denial has two existing semantic owners and no third competing reason vocabulary:

1. My-Chat owns pre-owner Host ingress states from C-3-0b-1: `sign_in_required|account_context_not_ready|workspace_selection_required|workspace_unavailable|scenario_unavailable|access_changed|unavailable`.
2. Nurture owns current entitled presenter/action safe reasons from B3-1d-3. My-Chat renders scenario-owned safe labels/help and never translates internal Participant/Grant/policy codes independently.
3. Protocol-only public codes such as `invalid_request`, `request_conflict`, and `rate_limited` describe malformed/replayed transport input rather than business availability.

The HTTP/result mapping is exact:

| Boundary result | HTTP/result behavior | Nurture owner call |
| --- | --- | --- |
| Malformed/unknown/forbidden echo | `400 invalid_request` with closed safe field/rule information. | None. |
| Missing/expired Host auth | `401 sign_in_required`. | None. |
| Account/Actor not ready or workspace selection required | `409 account_context_not_ready|workspace_selection_required`. | None. |
| Guessed/mismatched resource, workspace, Notification, or recipient | `404 unavailable`, existence-indistinguishable. | None. |
| Known current workspace or scenario unavailable | `404 workspace_unavailable|scenario_unavailable`. | None. |
| Current membership/resource access lost | `403 access_changed`; guessed-resource paths still use generic `404`. | None. |
| Rate limit | `429 unavailable` plus bounded retry guidance. | None. |
| Private caller/signature/nonce/contract/verifier defect | `503 unavailable`, internal alert, no verifier stage detail. | No owner/application call. |
| Current Nurture role/scope/target/Grant/policy/lifecycle denial | HTTP `200` typed owner result with permitted `unavailable|access_changed` and safe reason. | Current owner resolution occurred. |
| Current clarification or state/version change | HTTP `200` typed `needs_clarification` or current `target_changed` presentation. | Current owner resolution occurred. |
| Same command identity with changed canonical payload | `409 request_conflict`; no hash/internal identity detail. | No second business write. |
| Temporary owner/database outage | `503 unavailable` with bounded retry guidance. | Attempted and failed closed. |

Domain unavailability is a current owner presentation, not an HTTP transport error. Internal `participant_missing|role_missing|child_not_visible|target_not_found|signature_invalid|nonce_replayed` codes never cross directly. A specific domain reason such as `grant_revoked` or `enrollment_inactive` may be shown only after Nurture proves the current actor is entitled to that disclosure. Notification wrong-recipient/missing/revoked/guessed states remain indistinguishable. Public errors contain no stack, raw exception, verifier stage, caller, signature, nonce, contract hash, workspace existence, owner candidate, credential, token, or business body.

Activated public failure output replaces free-form `details` with closed optional safe field/rule codes, a retry class, and a My-Chat-generated opaque `support_ref`. `support_ref` maps to restricted Host audit but is not an internal request/correlation/trace id and contains no encoded identity.

Audit is owner-split and body-free:

| Store | Allowed evidence | Forbidden evidence |
| --- | --- | --- |
| My-Chat Host ingress audit | Exact canonical User/Actor/Workspace, public route, scenario/ingress/operation, Host gate outcome, support/request correlation, environment/version/time. | Nurture role/Subject/Grant/policy, business body, token/credential/signature/nonce. |
| Nurture security/business audit | Workspace, caller/origin/ingress/operation, hashed Host User/Actor/request provenance, resolved Participant business actor where applicable, CommandExecution/outcome/versions/output refs, closed decision class/time/contract version. | Raw principal, Host account data, Chat/form/body, credential/signature/nonce/token/claim, owner candidates, raw exception. |
| Logs/traces/metrics | Low-cardinality operation/caller/ingress/outcome/retry/failure-stage/latency/version and aggregate LLM/cache dimensions. | Workspace/User/Actor/Participant/target ids, protected refs/content, tokens/secrets, provider/database raw errors. |

Pilot retention defaults are:

| Evidence | Retention |
| --- | ---: |
| Nonce hash | Maximum 5 minutes, covering assertion lifetime, skew, and bounded cleanup delay. |
| Traces | 7 days. |
| Ordinary application logs | 14 days. |
| De-identified aggregate metrics | 90 days. |
| Ordinary ingress security audit | 90 days. |
| Provisioning, Technical Operator, and owner-recovery audit | 365 days. |
| CommandExecution, Message/Event, and other business facts | Scenario business-retention policy; never deleted merely because ingress-audit TTL elapsed. |

C-3-0b-4 closes only authentication/ingress audit retention. Family question/reply bodies, redaction aftermath, attachment/KMS posture, and data-subject/legal retention remain the existing P1 and C-3-0e protected-data gate. Security/operational audit MUST NOT duplicate protected bodies, preventing the ingress TTL from becoming a hidden second content-retention policy.

Provisioning and owner-recovery writes fail closed when their required durable audit cannot commit. Ordinary business mutations use the same-transaction `CommandExecution` as authoritative business audit and do not depend on a cross-database audit service. Read/transport-denial operational audit may be asynchronous, but sink loss alerts and records a bounded gap rather than remaining silent. Audit access is workspace-scoped, time-bounded, purpose-required, least-privileged, and itself audited. Business users receive only current authorized business history; Technical Operator remains refs/status/reason/version-only and cannot read protected content or raw security details.

Adoption remains additive and ordered:

1. My-Workflow-Base adds the reusable principal/private invocation/ingress/client-echo/public-failure foundations, exact validator rules, and legacy/vNext/negative conformance fixtures. Base contains no Nurture role, schema, runtime, database, or audit store.
2. My-Chat adopts an exact Base revision/hash, implements public echo parsing, server route/ingress registry, Host-only context construction, signer/caller mapping, public denial/support mapping, Host audit, and a default-off capability. My-Chat does not accept legacy `actor_id`, inferred/default workspace, broad `client_surface`, free-form details, or alternate handler after vNext activation failure.
3. Nurture adopts the same revision/hash, implements exact verifier/nonce/operation registry, normalized context, ordinary/prospective dispatch, safe owner denial, audit boundaries, and isolated provisioning/owner-recovery verifiers. Activated routes do not fall back to legacy envelope/event/owner-read-token/dev-host handlers.
4. Joint adoption requires identical contract/route/surface/operation/caller/origin registries; client/Host/owner injection negatives; public denial noninterference; secret/PII/body leakage probes; replay/Step/onboarding/provisioning/operator matrices; and exact revision/source pins before any dev capability.
5. Capability and workspace allowlist remain default-off. Rollback removes the workspace allowlist first and disables the capability without invoking a legacy path or rewriting committed business facts/audit.

C-3-0b-4 adoption evidence is ingress-only. The now-locked C-3-0e specifies complete subject-provider/presentation/domain-action/protected-body/draft/cache/offline adoption and final C-3-0 evidence. Closing C-3-0b therefore proves a coherent authenticated-ingress design, not an implemented or user-operable Guardian/Caregiver IIB.

Current implementation is not C-3-0b-4 evidence. Nurture still accepts optional workspace, broad `surface`, free-form structured/form/display objects, and legacy event kinds. My-Chat validates `client_surface=mobile|web` as a normal request field while workflow contracts retain optional `actor_id` and broad surfaces. Current API errors permit free-form details/internal reason drift. No shared `ScenarioClientEchoV1`, public denial mapper, support-ref mapping, ingress audit schema/access/retention enforcement, exact adoption fixture, or special private boundary exists.

C-3-0b-4 evidence must cover every echo variant and bound, all forbidden/unknown/structured authority fields, signing-without-trust-upgrade, client-versus-Host field substitution, Host-versus-owner authority injection, command-id derivation, strong-auth separation, Notification/Invitation route conversion, every HTTP/public/owner mapping, existence noninterference, safe reason disclosure thresholds, support-ref opacity, owner-split audit fields, every retention cutoff, audit access/audit-of-audit, sink failure, zero protected-body duplication, Base -> My-Chat -> Nurture revision/hash/registry adoption, legacy/vNext compatibility, no fallback, rollback, current-gap detection, and planning-only scope. No contract package, manifest, source, schema, migration, route, UI, runtime, audit sink, secret, environment, capability, provider, database, or traffic changed. C-3-0b is complete; C-3-0c is next.

**C-3-0c — subject-aware presentation contract (LOCKED / COMPLETE)**

| Sub-checkpoint | State | Decision boundary |
| --- | --- | --- |
| C-3-0c-0 presentation pipeline and ownership | **LOCKED** | Nurture semantic presentation, My-Chat generic rendering, Chat AI/structured-UI boundary, surface convergence, current reread, and no unclassified Host persistence. |
| C-3-0c-1 subject-provider wire contract | **LOCKED** | Separate list/resolve, a new opaque ref, collection-as-context, closed results/privacy fields, freshness/version semantics, and exact bounds. |
| C-3-0c-2 semantic blocks and actions | **LOCKED** | Read-only result, owner-resolved plain text, six flat blocks, separate navigation/action offers, entitled unavailable disclosure, AI projection, exact bounds, and forbidden fields. |
| C-3-0c-3 renderer and persistence classes | **LOCKED** | Exact product-surface renderer mapping, four persistence classes, no presentation cache, bounded foreground freshness, accessibility, stale behavior, and Pilot query-control scope. |
| C-3-0c-4 conformance and adoption evidence | **LOCKED / COMPLETE** | Atomic capability, additive Base contracts, exact named source/module/renderer identities, ordered three-repo adoption, legacy/no-fallback rules, negative fixtures, and presentation planning exit. |

**C-3-0c-0 — presentation pipeline and ownership (LOCKED)**

1. The planning pipeline is `verified My-Chat invocation -> current Nurture subject/owner resolution -> display-safe semantic presentation -> My-Chat generic surface adapter/renderer`. Presentation contract names remain C-3-0c-1/2; the presentation pipeline does not create a Host business resolver or a Nurture product shell.
2. My-Workflow-Base owns only reusable presentation/provider structures, generic validation rules, bounds, capability declarations, and conformance fixtures. Base cannot name Nurture Participant, ChildCareProcess, Family, CareGroup, Enrollment, Grant, Message, Receipt, Item, Attention, or scenario-specific safe reasons/actions.
3. Nurture owns subject-provider behavior, current Account–Subject relationship resolution, role/scope/target/lifecycle/Grant/policy checks, semantic presentation state, scenario-safe business labels/reasons, and action availability. Exact safe-copy representation as text versus key/parameters remains C-3-0c-2, but My-Chat cannot independently reinterpret an internal code into a more specific business disclosure.
4. My-Chat owns the authenticated shell, generic Chat panel, card/list/detail/workbench components, layout, navigation chrome, accessibility behavior, device adaptation, and renderer registry. A renderer selects only a compatible generic visual treatment; the renderer cannot query Nurture tables, infer role/Subject/lifecycle, add/remove a business action, broaden copy, change a safe reason, or create a parallel business state machine.
5. Nurture Chat is the common AI conversation surface already locked by B3. The AI may decide whether to invoke Nurture and may narrate only the current display-safe semantic presentation plus generic Host state. The AI cannot infer protected facts, synthesize candidates, invent action availability, treat natural-language agreement as confirmation, or convert hidden owner data into prose. Structured UI panels remain generic My-Chat components driven by the same semantic presentation used by entitled board/workbench views.
6. Chat, board, and workbench adapters converge on one current Nurture semantic presenter/owner path. Surface eligibility may yield a permitted subset or different layout, but surface-specific code cannot duplicate facts, tokens, lifecycle, safe reasons, commands, or authorization. Moving between surfaces performs current owner reread and never copies a stale rendered tree as business truth.
7. Presentation is not authorization, command input, relationship proof, durable replay evidence, or an offline entitlement. Every initial render, refresh, navigation, prepare, submit, retry, result recovery, and Notification destination rereads the applicable Host session/workspace gates and current Nurture subject/role/scope/policy/lifecycle facts.
8. C-3-0c-3 classifies semantic presentation as ephemeral, permits only a content-free durable Host shell, and forbids protected/owner/action copies from generic Host persistence; the now-locked C-3-0e defines narrower protected/draft/offline handling. An opaque Workspace/scenario-bound context/ref may cross requests only under its owner contract. No unclassified field enters Chat history, dashboard cache, search index, analytics, Notification, Handoff, or offline storage.
9. Nurture/provider outage, stale opaque context, revoked relationship, changed scope, or renderer incompatibility cannot fall back to a cached presentation or a more permissive surface. My-Chat returns the already locked generic Host/owner unavailable or changed state and preserves no hidden business detail.
10. C-3-0c-0 does not lock provider DTO names/methods, context TTL, candidate fields, scope encoding, semantic block/action enums, copy localization format, renderer mapping, persistence/TTL, protected-detail transport, offline behavior, action driver, or implementation order. Those decisions remain C-3-0c-1 through C-3-0e.

Current implementation is not C-3-0c-0 evidence. Existing Workflow presenters/artifact drafts and Nurture `institution-surfaces` provide legacy/synthetic summaries around broad surfaces; no shared subject provider, semantic-presentation contract, generic renderer conformance, field persistence classification, or activated owner-to-renderer pipeline exists. These components remain pre-activation scaffolding and cannot be relabeled as the locked pipeline.

C-3-0c-0 evidence must cover exact ownership/layering, one owner presenter across every entitled surface, Chat narration from display-safe output only, zero renderer business interpretation, action/candidate non-invention, current reread at every seam, cross-surface convergence, renderer mismatch/outage behavior, forbidden Host persistence destinations, current-gap detection, and planning-only scope. No contract package, manifest, source, schema, migration, route, UI, renderer, runtime, cache, secret, environment, capability, provider, database, or traffic changed. The C-3-0c-1 section locks the provider wire.

**C-3-0c-1 — subject-provider wire contract (LOCKED)**

1. Discovery and current revalidation are distinct operations. `list_subject_contexts` discovers current reachable contexts. `resolve_subject_context` revalidates one Nurture-issued context. There is no generic `get_subject`; My-Chat cannot rank, filter, merge, infer, or auto-select from label, count, history, surface, raw ref, or cache.
2. The wire introduces `ScenarioSubjectContextRefV1 = string`. The bounded opaque ref is not `DomainContextRef` and exposes no `namespace`, `object_type`, `object_id`, or `canonical_ref`. Nurture binds Workspace, scenario, provider, current verified principal/Participant, owner locator, scope kind, context version, issue time, and expiry internally.
3. The ref cannot cross User, Workspace, scenario, or provider boundaries. My-Chat cannot compare refs or versions to infer that two options represent the same Subject. Surface is not bound into the ref; an entitled cross-surface transition repeats current Host gates and Nurture resolve rather than inheriting permission from the origin surface.
4. Provider inputs are exact:

   ```ts
   type ListScenarioSubjectContextsInputV1 = {
     provider_version: 1;
     cursor?: string;
     page_size?: number;
   };

   type ResolveScenarioSubjectContextInputV1 = {
     provider_version: 1;
     subject_context_ref: ScenarioSubjectContextRefV1;
     known_context_version?: string;
   };
   ```

   Workspace/account/Actor/Participant/role, raw Subject/Child/Family/CareGroup/Institution id, scope/relationship/Grant/policy, surface/route/caller, action/confirmation, and command id are forbidden input. Verified Host context supplies Host facts; Nurture resolves owner facts.
5. A context option is privacy-minimal:

   ```ts
   type ScenarioSubjectContextOptionV1 = {
     subject_context_ref: ScenarioSubjectContextRefV1;
     scope_kind: "single_subject" | "subject_collection";
     route_class: "subject_detail" | "subject_collection";
     safe_label: ScenarioSafeLabelV1;
     safe_disambiguation?: ScenarioSafeLabelV1;
     context_version: string;
     issued_at: string;
     expires_at: string;
   };
   ```

   C-3-0c-2 defines `ScenarioSafeLabelV1`; C-3-0c-1 locks only the semantic slots. Nurture produces minimal same-name disambiguation; My-Chat cannot assemble or broaden the copy.
6. Raw/canonical domain refs, birth/stage/profile/health/media/avatar data, Guardian/Caregiver lists, Enrollment/Grant/relationship paths, role/policy/action availability, collection members/counts, protected bodies, and stable cross-workspace/scenario correlation keys are forbidden.
7. List and resolve use closed result unions:

   ```ts
   type ListScenarioSubjectContextsResultV1 =
     | { status: "resolved"; context: ScenarioSubjectContextOptionV1 }
     | {
         status: "needs_selection";
         scope_kind: "unresolved";
         candidates: ScenarioSubjectContextOptionV1[];
         next_cursor?: string;
       }
     | { status: "unavailable"; safe_reason: ScenarioSafeReasonV1 };

   type ResolveScenarioSubjectContextResultV1 =
     | {
         status: "resolved";
         context: ScenarioSubjectContextOptionV1;
         resolved_at: string;
       }
     | { status: "context_changed"; safe_reason: ScenarioSafeReasonV1 }
     | { status: "unavailable"; safe_reason: ScenarioSafeReasonV1 };
   ```

   C-3-0c-2 defines `ScenarioSafeReasonV1` and the entitled safe-reason vocabulary.
8. One safely determinable context returns `resolved`; multiple contexts return owner-curated `needs_selection`; zero returns safe `unavailable`. A reachable collection is one `subject_collection` context and the provider never expands members or exact counts. A known established context whose owner meaning changed may return `context_changed`.
9. Guessed, forged, cross-principal, cross-workspace, cross-scenario, revoked, expired, or otherwise existence-sensitive refs collapse to indistinguishable `unavailable`. Provider/database outage remains the C-3-0b generic HTTP `503` path and never falls back to cached candidates or presentation.
10. A subject context ref expires within 30 minutes. A list cursor expires within 5 minutes. Page size defaults to 10 and cannot exceed 20. Successful resolve may issue a fresh ref but cannot extend the old ref in place. `context_version` is opaque same-ref owner staleness evidence, cannot be correlated across options/refs, and is not a mutation expected version.
11. A subject context ref is a locator only. The ref is not relationship proof, bearer authorization, action authority, direct CommandExecution authorization, durable replay evidence, cross-surface permission, or offline entitlement. Every action prepare/submit re-resolves current owner facts and obtains the separate C-3-0d owner action context.
12. C-3-0c-1 is planning-only. Current code has no shared provider type, list/resolve implementation, opaque-ref codec/store, TTL enforcement, or joint conformance. Existing Workflow `DomainContextRef`, presenters, artifact drafts, and `institution-surfaces` cannot satisfy the new provider contract. No contract package, manifest, source, schema, migration, route, UI, renderer, runtime, cache, secret, environment, capability, provider, database, or traffic changed.

C-3-0c-1 evidence must cover strict codecs/bounds, `DomainContextRef` non-reuse, all result variants, collection non-expansion, same-name safe disambiguation, ref/cursor expiry, fresh issuance without extension, current-version drift, every principal/workspace/scenario/provider substitution, indistinguishable unavailable states, exact privacy allowlist, zero Host selection/correlation, no authority transfer, outage without cache, forbidden persistence destinations, current-gap detection, and planning-only scope. The C-3-0c-2 section locks semantic presentation.

**C-3-0c-2 — semantic blocks and actions (LOCKED)**

1. `present_subject_context` is a read-only operation after C-3-0c-1 resolve. The exact input is a v1 presentation version, C-3-0c-1 subject ref, manifest-registered `presentation_key`, and optional already codec-validated `current|recent|history` query with owner cursor, bounded page size, and owner-issued `presentation_item_ref`. The client cannot add surface, role, raw target, action authority, business id, command id, or submit evidence. Registered route/operation or the Nurture intent registry selects the allowed presentation key; Nurture revalidates current owner scope. The item ref opens only a fresh owner-read detail and cannot become an action target.
2. The presentation result is closed:

   ```ts
   type ScenarioPresentationResultV1 =
     | { status: "ready"; presentation: ScenarioSemanticPresentationV1 }
     | { status: "empty"; presentation: ScenarioSemanticPresentationV1 }
     | { status: "context_changed"; safe_reason: ScenarioSafeReasonV1 }
     | { status: "unavailable"; safe_reason: ScenarioSafeReasonV1 };
   ```

   `partial|not_modified|error|needs_selection` aliases are forbidden. C-3-0c-1 owns selection. Provider/database outage remains generic HTTP `503`; no cached or partial presentation is returned. Presentation status cannot redefine C-2f-5/C-3-0d business outcome, replay disposition, command result, or recovery.
3. Safe copy is owner-resolved plain text:

   ```ts
   type ScenarioSafeTextV1 = {
     kind: "plain_text";
     value: string;
     locale: string;
   };

   type ScenarioSafeLabelV1 = ScenarioSafeTextV1;

   type ScenarioSafeReasonV1 = {
     reason_code: string;
     message: ScenarioSafeTextV1;
     help?: ScenarioSafeTextV1;
     retry_class: "none" | "refresh" | "retry_later" | "contact_support";
   };
   ```

   Nurture resolves normalized BCP-47 copy and fallback before returning the value. My-Chat renders the value verbatim and does not host a Nurture localization dictionary or translate reason/action codes. Markdown, HTML, URL, control characters, unresolved parameters, internal reason/exception text, and provider/database details are forbidden.
4. `reason_code` belongs to the exact scenario registry. B3 meanings remain closed. `not_implemented` is readiness/dev-only and cannot reach Pilot users. Provider/database outage cannot be recoded as an HTTP-200 `owner_unavailable`; that reason may describe only an entitled owner-owned subresource after Nurture successfully evaluated disclosure. An available offer has no user-facing unavailable reason; the B3 `available` classification remains registry/telemetry evidence.
5. A semantic presentation carries v1 schema/key, subject ref, opaque current context version, generation time, blocks, navigation offers, and action offers. My-Chat cannot interpret the presentation key or context version as business state/authority. `ready` may contain an empty collection only when the overall view remains meaningful; a true safe empty view uses `empty` with owner-produced empty-state blocks/actions.
6. `ScenarioSemanticBlockV1` is exactly the flat closed union `summary|notice|fact_group|metric_group|item_collection|timeline`. Every block has a response-local key, generic `neutral|informational|positive|warning|critical` tone, safe text, and `narration: allowed|display_only`. Summary/notice carry optional title plus required body. Fact/metric groups carry optional title plus keyed safe label/value/tone rows. Item collections carry optional title plus keyed title/summary/badges/optional timestamp/optional `presentation_item_ref` items and optional next cursor. Timelines carry optional title plus keyed title/summary/badges/required timestamp/optional item-ref entries and optional next cursor. Blocks do not nest or carry arbitrary records/extensions.
7. Block/fact/metric/item/entry keys are response-local renderer keys, not analytics, correlation, business identity, or cross-response stability. Metric output may show entitled operational aggregates but never ranking, score, comparative trend, or cross-scope Anti-Metrics. `presentation_item_ref` is bound to current principal, Workspace, scenario, subject, presentation, item, and version; the ref opens only current owner-read detail, expires within five minutes, and is not action/submit/cross-surface/offline authority. Raw/canonical ids, command/audit refs, protected bodies, forms/drafts, attachments/media bytes, and renderer-specific primitives are forbidden.
8. Navigation is separate from durable action:

   ```ts
   type ScenarioNavigationOfferV1 = {
     route_class: string;
     label: ScenarioSafeTextV1;
     view_mode?: "current" | "recent" | "history";
     continuation_ref?: string;
     priority: "primary" | "secondary" | "tertiary";
     narration: "allowed" | "display_only";
   };
   ```

   Route class is registered and the optional continuation ref is owner-issued/opaque. Navigation has no URL, raw target, action key, confirmation, command, or implicit durable effect; opening repeats current Host and owner gates.

   The field remains reusable contract vocabulary, not a Pilot requirement. C-3-4 fixes `continuation_ref` as absent for ordinary Guardian/Caregiver surface transitions; the destination queries current owner state from route plus view mode. Authenticated Notification open uses its separate `open_notification` token contract and does not populate this field.
9. Domain action offers are a closed union:

   ```ts
   type ScenarioActionOfferV1 =
     | {
         availability: "available";
         action_key: string;
         label: ScenarioSafeTextV1;
         help?: ScenarioSafeTextV1;
         target_ref: string;
         expected_version?: string;
         confirmation_class: "explicit" | "strong_authorization";
         priority: "primary" | "secondary" | "tertiary";
         tone: "neutral" | "informational" | "positive" | "warning" | "critical";
         narration: "allowed" | "display_only";
       }
     | {
         availability: "unavailable";
         action_key: string;
         label: ScenarioSafeTextV1;
         safe_reason: ScenarioSafeReasonV1;
         priority: "primary" | "secondary" | "tertiary";
         tone: "neutral" | "informational" | "positive" | "warning" | "critical";
         narration: "allowed" | "display_only";
       };
   ```

10. An available action requires an active `domain_action_contracts` entry and real authenticated handler. The target ref binds current principal, Workspace, scenario, subject, action, owner target, and version but is sufficient only to request C-3-0d preparation. Expected version is opaque to My-Chat. An unavailable action has no target/version and may appear only when current Nurture disclosure permits the adult to know the action and target exist; existence-sensitive or non-entitled actions are omitted.
11. My-Chat cannot infer priority, tone, confirmation, availability, or disclosure from `action_key`. Presentation cannot contain Run-level raw `target_type|target_id`, `command_key`, `handler_key`, `serverAction`, client params, arbitrary extensions, raw target id, submit/claim token, or CommandExecution identity/result. An action offer is not relationship proof, policy result, command identity, submit authority, cross-surface permission, or offline entitlement. Every prepare/submit owner-rereads.
12. Pilot bounds are 64 KiB UTF-8 serialized output, 20 blocks, 20 fact/metric/item/timeline entries per block/page, 8 navigation offers, 8 action offers, label 80 characters, title 120, summary/body 500, and help 240. Presentation cursors, item refs, continuation refs, and action target refs expire within five minutes. Unknown fields, recursive blocks, arbitrary extension payloads, and over-bound output are fatal codec/result-construction failures.
13. AI receives a generated narration projection rather than the wire object. The projection includes only `narration=allowed` safe text and removes every ref, version, reason/action code, cursor, target, hidden action, and display-only field. AI may explain the current owner text but cannot add a block, fact, safe reason, action, confirmation, or submit behavior absent from the structured owner result.
14. Existing implementation is not evidence. Base `WorkflowActionAvailability` remains Run-level and raw-target-shaped; My-Chat mobile `InteractionEnvelope` permits broad `serverAction|params|extensions`; Nurture `institution-surfaces` builds id-shaped pseudo-opaque refs and ad-hoc safe strings. No shared `present_subject_context`, semantic block codec, safe-copy codec, entitled action disclosure, or narration projector exists. Existing scaffolds cannot be relabeled or activated as C-3-0c-2.

C-3-0c-2 evidence must cover operation/result codecs, every safe-copy/reason rule, all six block kinds, Anti-Metrics, navigation/action separation, active-handler requirements, unavailable disclosure versus omission, five-minute target expiry, every size/count/text bound, raw-id/URL/HTML/extension/Run-action rejection, code-to-copy non-interpretation, AI projection stripping/non-invention, current-gap detection, and planning-only scope. No contract package, manifest, source, schema, migration, route, UI, renderer, runtime, cache, secret, environment, capability, provider, database, or traffic changed. The C-3-0c-3 section locks renderer and persistence behavior.

**C-3-0c-3 — renderer and persistence classes (LOCKED)**

The four registered C-3 Nurture product surfaces map to three My-Chat generic renderer families. A renderer family is Host layout capability rather than a Nurture wire field, business role, authorization result, or component name. My-Chat's neutral renderer conformance suite also exercises an Institution-compatible read-only role-board fixture and domain-workbench fixture so the generic Host families remain reusable, but those fixtures are not Nurture product keys, routes, presenters, actions, or C-4 evidence.

| Nurture product surface | Generic renderer family | Pilot presentation responsibility |
| --- | --- | --- |
| `nurture_chat` | Chat semantic panel | Current explanation, bounded list/timeline, navigation, and action-prepare entry for currently entitled Guardian/Caregiver roles; never complete history. |
| `family_board` | Role board | Current/recent family work, current detail, and owner-offered actions. |
| `teacher_board` | Role board | Current work plus complete owner-paginated authorized history, detail, and owner-offered actions; no caregiver workbench fallback. |
| `family_workbench` | Domain workbench | Complete owner-paginated authorized family history plus complex Grant/Enrollment action-prepare entry. |

Renderer behavior is exact:

1. My-Chat owns the renderer registry, layout, navigation chrome, responsive adaptation, accessibility, focus, and generic loading/error shell. Nurture owns the registered product-surface eligibility, presentation key, block/order/copy/tone, navigation offers, action offers, and every disclosure decision. No renderer identifier, component prop, CSS/layout primitive, business filter, or device-specific component enters the semantic wire.
2. A compatible renderer preserves the owner block order, entry/row order, safe copy, tone, badges, timestamps, navigation priority, action priority, and unavailable disclosure. The renderer may reflow the same structure for device size but cannot sort, merge, omit, relabel, translate, summarize, infer, or synthesize semantic fields/actions. Timestamp formatting uses the owner-disclosed value and locale without inferring lifecycle.
3. Unknown schema/version/block/field, over-bound output, missing renderer capability, or a disallowed surface/action combination rejects the complete presentation. My-Chat shows a generic incompatible/unavailable shell and emits body-free evidence; My-Chat cannot partially render, silently drop an action, use another surface profile, or fall back to the broad legacy `InteractionEnvelope`, Workflow dashboard presenter, or synthetic Nurture surface.
4. `nurture_chat` may render every C-3-0c-2 block kind in a bounded semantic panel, but remains current/recent rather than canonical history. Role boards and workbenches use the same block meanings with list/detail/workbench layout. The neutral read-only role-board fixture accepts only read-safe blocks/navigation and rejects every action offer; C-4 must later register the real `institution_board` surface before Nurture may use that profile. Available action controls on the four C-3 surfaces request C-3-0d preparation only; no C-3-0c renderer submits a command.
5. Pilot-0 complete history means a current Nurture-owned, cursor-paginated result that can reach every currently authorized row. `current|recent|history`, item detail, owner cursor, and owner-issued navigation offers remain the only C-3-0c-2 query controls. Arbitrary text search, renderer-authored sort, and compound child/care-group/status/time filters are not Pilot-0 gates and require a later separately versioned owner query-control contract. My-Chat cannot encode business filters into route state, continuation refs, presentation keys, analytics, or local collection filtering.

The presentation persistence model has four closed classes:

| Persistence class | Allowed material | Storage rule |
| --- | --- | --- |
| `owner_canonical` | Nurture Message, Receipt, Item, Grant, Enrollment, topology, lifecycle, CommandExecution, and business history. | Durable only in the Nurture owner boundary under existing business retention. |
| `ephemeral_presentation` | Subject/presentation results, safe copy, blocks, navigation/actions, opaque versions/refs/cursors, AI narration projection, selected item, scroll/expanded state, and render tree. | Current foreground/request memory only; never a Host durable projection. |
| `durable_host_shell` | Host conversation/turn/page identity, canonical Workspace, scenario, registered product surface/presentation key, registered route class, `current|recent|history`, renderer-contract version, Host timestamps, and generic `rehydrate_required` state. | Strict My-Chat allowlist; carries no Nurture content, target, result, policy, or authority. |
| `forbidden_host_copy` | Protected body/media, unsubmitted or AI business draft, owner/business raw id, relationship path, role/Grant/policy result, owner token/credential, action target/version, cursor, candidate set, and inferred business state. | Absent from Chat history, board/workbench cache, search, analytics, Notification, Handoff/Outbox, logs/traces/metrics, crash evidence, and offline storage. C-3-0d/e may later define narrower transient channels but cannot reinterpret `forbidden_host_copy` as generic Host persistence. |

Persistence and Chat behavior are exact:

1. Every C-3-0c-1/2 owner response defaults to `ephemeral_presentation`. Display-safe does not mean durable, searchable, offline-safe, or safe after revoke/redaction. My-Chat cannot persist the semantic response, AI narration projection, renderer tree, safe reason, action availability, item list, or owner labels as a Chat message or dashboard projection.
2. General platform Chat remains governed by My-Chat conversation retention. For a Nurture semantic presentation, Pilot-0 may durably anchor only a Host-generated content-free placeholder such as a rehydration marker. Reopening the turn obtains a fresh subject/presentation result; the old owner copy or AI narration is never replayed. User-authored Nurture draft/body handling remains C-3-0e and cannot be inferred from ordinary transcript retention.
3. `ScenarioSubjectContextRefV1` may cross requests only in a protected server-side transient context for at most its 30-minute owner TTL. Five-minute presentation item/cursor/continuation/action-target refs remain response/foreground memory only. Neither ref class enters permanent Chat history, route URL, navigation history, client persistence, analytics, logs, Notification, or offline storage.
4. My-Chat may record body-free, low-cardinality renderer evidence such as product-surface key, schema/version, compatible/incompatible outcome, refresh reason class, latency, and counts already allowed by the common observability boundary. Evidence contains no presentation key when the key would create a high-cardinality business dimension, safe text, block/item key, ref/version/cursor, role/Grant/policy result, or target existence.

Freshness and stale behavior are fail-closed:

1. Pilot-0 uses a maximum 60-second foreground presentation freshness lease, bounded further by any shorter owner ref expiry. The lease is display freshness only and never authorization. Known revoke/redaction/policy/lifecycle invalidation clears the view immediately; the 60-second lease is the fallback bound when no invalidation signal arrives.
2. App background/lock, sign-out, Workspace/account/thread/product-surface change, process loss, and renderer-version change clear every `ephemeral_presentation` value. Foreground resume, tab/page focus, manual refresh, navigation, pagination, item-detail open, action prepare, action result, retry, and Notification destination perform a fresh Host gate plus Nurture owner read.
3. When freshness expires or invalidation arrives, My-Chat removes owner business content and disables navigation/action controls before fetching. Refresh cannot keep stale content visible behind a spinner. Owner/provider/database failure shows only the generic retry/unavailable shell; no stale-while-revalidate, cached presentation, legacy presenter, more permissive surface, or offline fallback is permitted.
4. Optimistic UI is limited to Host-owned loading/submission progress. My-Chat cannot optimistically change a Nurture lifecycle, count, badge, action availability, safe reason, Receipt, Item, Grant, Enrollment, Attention, or topology value. C-3-0d command completion and owner reread determine the next semantic result.

Accessibility is part of generic renderer compatibility rather than owner semantics:

1. My-Chat applies the owner-provided normalized locale and text direction, preserves semantic reading order, exposes summary/notice/fact/metric/list/timeline structure, and announces label with value. Tone, color, icon, order, and position cannot be the sole meaning.
2. Every interactive control has a safe accessible name, role, state, focus order, keyboard path, suitable touch target, font scaling, and reduced-motion behavior. An unavailable action exposes only the owner-approved safe reason; an omitted action leaves no visual or assistive-technology trace.
3. Refresh, context-changed, unavailable, and completed Host transitions move focus to the generic status container and use a generic polite announcement. My-Chat cannot infer urgent/assertive announcement behavior from Nurture `critical` tone, invent emergency semantics, or read hidden/display-only text to assistive technology.
4. Locale, accessibility, responsive-layout, focus-loss, screen-reader, keyboard, reduced-motion, and stale-refresh behavior are renderer conformance requirements. Accessibility failure rejects activation evidence; the failure cannot be waived because the semantic wire is valid.

Current implementation is not C-3-0c-3 evidence. My-Chat Chat interactions are transient React state, but the broad envelope contains `serverAction|params|extensions`; persisted Chat messages are not separated from Nurture rehydration placeholders; the Workflow dashboard branches on raw Run action/target/reason values; role boards and domain workbenches are absent; renderer accessibility is partial; and there is no surface compatibility registry, freshness lease, invalidation clearing, persistence allowlist, or leakage scanner. Nurture has no activated semantic presenter and its existing synthetic surfaces cannot satisfy the mapping. These are implementation gaps, not accepted fallback paths.

C-3-0c-3 evidence must cover all four registered C-3 product-surface mappings, every block across their compatible renderer families, neutral Host fixture coverage for all three renderer families including read-only role-board action rejection, explicit absence of both reserved C-4 Institution keys, order/copy/tone preservation, complete-pagination behavior, arbitrary-filter/search deferral, all four persistence classes and destinations, Chat placeholder rehydration, ref expiry/storage, 60-second freshness boundaries, invalidation/background/focus/outage behavior, no stale/legacy/offline fallback, no optimistic business state, accessibility/device/locale/focus matrices, current-gap detection, and planning-only scope. Neutral Host fixtures do not count as Nurture C-4 product evidence. No contract package, manifest, source, schema, migration, route, UI, renderer, runtime, cache, secret, environment, capability, provider, database, or traffic changed. The following C-3-0c-4 section locks conformance and adoption evidence.

**C-3-0c-4 — conformance and adoption evidence (LOCKED / COMPLETE)**

C-3-0c adoption is one atomic read-presentation capability rather than independently enableable provider, presenter, renderer, or persistence slices:

1. The shared Host capability key is `scenario_subject_presentation_v1`.
2. The capability requires `trusted_scenario_invocation_v1` and represents the complete C-3-0c-1 subject-provider wire, C-3-0c-2 semantic-presentation wire, and C-3-0c-3 renderer/freshness/persistence compatibility.
3. The capability does not authorize a domain command. Before C-3-0d provides its separate active domain-action contract/capability, any activated presentation MUST emit `actions=[]`; a non-empty action offer is a fatal incompatibility.
4. Provider-only, presentation-only, renderer-only, persistence-guard-only, or trusted-ingress-missing enablement is forbidden. Test-only direct invocation may exercise individual units but cannot become an activated product path.

Base manifest adoption is additive and versioned:

1. A new optional presentation area declares subject-context provider key/version plus exact `list_subject_contexts|resolve_subject_context` operations; presentation key/version and provider reference; registered product surfaces, `current|recent|history`, route classes, safe-reason codes, action-key references, and per-surface action-offer policy.
2. Renderer family/component/layout, Nurture role/Subject/object identity, scenario copy, business schema, runtime, cache, database, and persistence implementation remain absent from the Base wire.
3. A legacy manifest with no presentation declaration remains valid and behaviorally unchanged. Absence alone creates no global warning or false readiness claim.
4. Once any vNext presentation declaration exists, missing, duplicate, unknown, malformed, or cross-mismatched provider/presentation/surface/operation/view/route/reason/action declarations are fatal. Missing Host surface support, `trusted_scenario_invocation_v1`, or `scenario_subject_presentation_v1` is fatal.
5. A C-3 manifest declaration of `institution_board|institution_workbench`, or any action offer on the neutral read-only role-board fixture, is fatal. C-4 may add the real Institution keys only through its later versioned manifest/route/presenter contract. Other C-3 surface action references are valid only after the exact C-3-0d `domain_action_contracts` entry, handler, and capability exist.
6. The same activated operation cannot appear in both vNext and legacy registries. Validation or runtime failure rejects the complete request/presentation and never falls back to `surface_mapping`, `internal_api`, broad `InteractionEnvelope`, Workflow dashboard presenter, synthetic Nurture surface, alternate provider, or more permissive renderer.

Five independently named identities prevent semantic overloading:

| Identity | Required proof |
| --- | --- |
| Historical workflow contract hash | The current `0bd8925e...01aa` path-content and `a97a5b14...e981` logical-source values prove only the reviewed X0-X5 handoff baseline. They cannot be relabeled as C-3 support. |
| `platform_child_family_identity_source_v1` | Completed My-Chat Child/Family owner contract, schema/migrations, runtime/APIs, binding lifecycle, Nurture typed anchors/workspace associations, and joint recovery/revoke/merge/privacy conformance. The schema-only `db22de6` revision is observed design input, not adoption evidence. |
| `scenario_interface_source_v1` | Normalized shared C-3 ingress/provider/presentation contract, codec, manifest, and validator source. Base and My-Chat MUST match exactly; Nurture pins the exact Base/My-Chat revisions and hash. |
| Scenario module contract hash | Nurture canonical manifest plus the real provider, presenter, operation, safe-reason, route, and applicable action registries. My-Chat accepts the exact published module identity. |
| Host renderer conformance revision | My-Chat product-surface compatibility registry, generic renderer, freshness/invalidation behavior, persistence allowlist/leakage scanner, accessibility, and negative suite. |

The C-3-0c slice-adoption evidence pairs these identities and uses explicit names. It also records the exact current Child+Family binding and workspace-association predicate used by each subject provider. The slice evidence is not a direct activation record: the cumulative C-3-5 candidate -> evidence index -> qualification event -> typed activation-row chain is the only activation authority. A generic `contract_hash` field cannot substitute one identity for another. Historical Workflow Run/Step/module evidence remains immutable under its recorded revision/hash and is never recomputed or reinterpreted when new additive source lands.

Adoption order and ownership are exact:

1. **My-Workflow-Base:** add reusable provider/presentation types, strict input/output codecs, optional manifest structures, host-capability declarations, validator fatal rules, exact bounds, normalized source-set hashing, and legacy/vNext/negative conformance fixtures. Base contains no Nurture key, runtime, database, cache, renderer component, or scenario policy.
2. **My-Chat:** explicitly adopt the exact Base revision/source set; implement manifest loading, server route/surface compatibility registry, generic renderer, ephemeral state clearing, persistence allowlist, leakage scanner, accessibility, and a default-off capability. Legacy scenarios remain unchanged.
3. **The-Nurture:** pin the exact Base and My-Chat revision/source set; implement current owner provider/presenter/ref codecs, safe copy/reasons, AI projection, and manifest/implementation registries. Every declared key has one real implementation and no activated legacy twin.
4. **Joint:** verify exact source, Scenario module, and Host renderer identities; mixed-revision/registry denial; end-to-end current owner reads; privacy/fault/stale/accessibility evidence; and default-off capability/empty workspace allowlist before any enablement request.
5. A local pnpm `file:` link is development convenience only. The link is not immutable adoption evidence; CI MUST checkout or materialize the exact pinned revision and prove the installed dependency contents.

Nurture maintains one canonical vNext manifest. A pre-activation module MAY use a mechanical projection driven by an explicit disabled-capability list. The projection MUST NOT be independently edited, change retained operation semantics/order/handler binding, add an alternate registry, or silently re-enable a legacy path. Conformance compares canonical and projected manifests and permits only the expected removal of gated declarations. Rollback removes the workspace allowlist first and disables the capability without invoking legacy behavior or rewriting Nurture facts, CommandExecution, audit, or history.

Required evidence is four-layered:

| Layer | Required evidence |
| --- | --- |
| Base | Legacy/vNext compile, strict provider/presentation codecs and all bounds, unknown-field/manifest fatal matrix, source-hash portability, and neutrality scan. |
| My-Chat | Four registered C-3 surfaces x six blocks plus neutral fixtures for all three renderer families, renderer compatibility/order/copy/tone, read-only role-board action rejection, content-free Chat rehydration, 60-second freshness/invalidation, accessibility, all persistence-destination leakage scans, capability-off, legacy unchanged, and no fallback. Neutral fixture coverage cannot claim Nurture C-4 routes or presenters. |
| Nurture | Every list/resolve/present result, wrong principal/Workspace/scenario/provider/ref/version, expiry/revoke/redaction/policy/lifecycle/outage, collection non-expansion, privacy allowlist, safe copy/reasons, route/action disclosure, AI projection, and real registry backing. |
| Joint | Exact revisions and named identities, mixed-version/registry/renderer drift, public -> signed private -> provider -> presenter -> renderer path, current reread across surfaces, stale/ref/revoke/outage behavior, zero cache/legacy/offline fallback, and rollback. |

Current implementation is not C-3-0c-4 adoption evidence. Base and My-Chat expose only the existing X0-X5 handoff-era workflow contract and validator; no `scenario_interface_source_v1`, trusted-invocation type, subject-provider/presentation manifest area, or presentation capability exists. My-Chat has broad interaction/dashboard paths and no complete surface registry, role boards/workbenches, renderer conformance revision, freshness/persistence guard, or leakage scanner. Nurture still has legacy `surface_mapping`/`internal_api`, a manually coded compatibility projection, a local `file:` My-Chat dependency, synthetic `institution-surfaces`, and no activated provider/presenter. The equal current handoff hash does not alter the readiness finding.

C-3-0c-4 evidence must cover atomic capability/dependency behavior, additive manifest and every fatal reference rule, all four named identity semantics, exact Base -> My-Chat -> Nurture order, immutable dependency materialization, canonical/projection equivalence, legacy compatibility, no fallback, four-layer negative/fault/privacy/accessibility coverage, current-gap detection, default-off rollback, and planning-only scope. No contract package, manifest, source, schema, migration, route, UI, renderer, runtime, cache, secret, environment, capability, provider, database, or traffic changed.

C-3-0c is therefore complete as a design and implementation-evidence specification only. C-3-0c completion does not claim implementation, adoption, enablement, or user-operable IIB. The following C-3-0d decision closes action execution/recovery planning, and the now-locked C-3-0e defines protected data/draft/cache/offline policy plus complete-IIB adoption evidence without claiming adoption.

**C-3-0d — action execution and recovery (LOCKED / COMPLETE)**

C-3-0d uses one static contract from an action offer through current result recovery. The reusable `ScenarioDomainActionContractV1` binds one `(scenario_key, action_key)` to an exact input schema/version, prepare target class, `explicit|strong_authorization`, entitled product surfaces, authenticated handler, Nurture command contract, and exactly one execution driver. The shared capability is `scenario_domain_action_execution_v1` and requires both `trusted_scenario_invocation_v1` and `scenario_subject_presentation_v1`. Capability activation covers prepare, submit, direct and claimed dispatch, result recovery, persistence protection, and conformance as one unit; a partial or legacy fallback path cannot advertise an action.

The only ordinary Nurture domain-action drivers are:

| Driver | Exact meaning |
| --- | --- |
| `nurture_direct_empty_v1` | No Workflow Run/Step. Nurture atomically consumes the owner context, commits the business effect and typed Execution, and persists explicit `[]` with null driver. |
| `workflow_claimed_step_v1` | My-Chat persists and binds the original content-free Step before claim; only that claimed Step may drive the Nurture transaction and later materialize Handoff/Outbox. |

Driver is part of the action contract, not a surface or runtime result. The same action MUST retain the same driver across Chat/board/workbench, zero/one/many recipients, `applied|already_satisfied`, `executed|replayed`, provider outage, and latency. A path capable of any non-empty snapshot remains claimed when its current snapshot array is empty. No recipient-based, outcome-based, surface-based, or failure-based downgrade to direct is permitted.

The action lifecycle is exact:

1. `prepare_domain_action` accepts only the registered action, owner-issued prepare target, optional opaque expected version, and exact operation input. My-Chat rechecks User/Actor/Workspace/surface/capability; Nurture rebinds Participant and rereads current role, Subject, target, Enrollment/Grant/policy/lifecycle/version.
2. Nurture issues one five-minute `submit_action` InteractionContext with exact confirmation class and owner consequence copy. Preparation creates no Execution, business fact, Workflow Step, Handoff, Outbox, Notification, or provider effect. Draft and protected-body storage remain C-3-0e.
3. `submit_domain_action` client echo contains only the owner-issued submit token, `confirmation=confirmed`, and bounded `client_mutation_id`. The client cannot repeat or override action, target, version, input, Participant, role, driver, command identity, Step, snapshot, or claim evidence.
4. For strong actions, My-Chat supplies separately verified recent-authentication assurance. The assurance proves only the ceremony. Nurture still derives strong authorization from current owner facts, exact context, policy, consequence hash, and explicit confirmation.
5. Direct submit completes the Nurture transaction synchronously. Claimed submit first completes durable Step binding and scheduling, then consistently returns a Host-owned accepted/processing state; current completion is rehydrated later rather than selected by timing.

Claimed action submission uses a Host-first pre-claim fence:

```text
My-Chat persists content-free Step as awaiting_scenario_binding
  -> Nurture validates submit token and immutably binds that Step
  -> My-Chat makes only the bound Step claimable
  -> worker claims Step and calls Nurture with transient driver evidence
  -> Nurture atomically consumes context + effect + Execution + snapshots
  -> My-Chat complete_step atomically commits Step + Handoff + Outbox
```

The Step may durably contain only current Host identity/provenance, Workspace, scenario/action/handler/contract, technical state/version, and safe request correlation. The Step MUST NOT contain the raw submit token, owner target/version, Nurture InteractionContext id, action body, protected draft, business ref, claim token, Handoff draft, snapshot, or inferred Nurture state. Nurture binding records the exact original Step but consumes no context, commits no business fact, and does not extend the original five-minute TTL.

A Step persisted but never bound remains non-claimable and is safely stopped after context expiry. If binding commits but My-Chat loses the response before publishing the Step, reconciliation queries the bodyless exact Step binding and resumes the same Step without a raw token. First business execution after expiry commits nothing and requires a new context and Step. If the Nurture transaction committed before expiry, Execution lookup precedes consumed/expired rejection and same-Step reclaim may finish after expiry. Another Step cannot bind the context, acquire the seed, or finish the original effect.

The exact Pilot driver matrix is:

| Action group | Driver / status | Host-effect rule |
| --- | --- | --- |
| `submit_family_care_question` | `workflow_claimed_step_v1` | Existing `user_attention` toward teacher work. |
| `reply_family_care_item` | `workflow_claimed_step_v1` | Existing `user_attention`; the reply message is current owner source for family delivery. |
| `propose_enrollment_transfer` | `workflow_claimed_step_v1`, inactive pending additive adoption | Future `guardian_relationship_attention` for every current exact-Family Guardian RoleAssignment. |
| `withdraw_family_enrollment` | `workflow_claimed_step_v1`, inactive pending additive adoption | Future relationship attention for other current Guardians, excluding the actor. |
| `close_enrollment` | `workflow_claimed_step_v1`, inactive pending additive adoption | Future relationship attention for every current Guardian. |
| `acknowledge_family_care_item`, `redact_family_care_message` | `nurture_direct_empty_v1` | Current owner reread only; no new Host activation. |
| Enrollment confirm/pause/resume, transfer cancel/decline/confirm, stage mutation | `nurture_direct_empty_v1` | Preserve the explicit-empty C-2d/C-2f matrix. |
| Grant confirm/replace/revoke | `nurture_direct_empty_v1` | Preserve explicit empty/null-driver and current authorization fences. |
| `exit_guardian_relationship` | `nurture_direct_empty_v1` | Exact-self accepted-role exit; explicit empty even though relationship attention has a Guardian-role source class. |
| Ordinary Institution/CareGroup/staff/policy mutation without a Host delivery effect | `nurture_direct_empty_v1` | Institution surfaces reread owner state; no synthetic notification. |
| `cancel_family_care_route` | Not declared | B3-3d no-Pilot-cancel remains authoritative. |
| `initiate_enrollment` | Inactive pending C-1/C-4 classification | C-1/C-4 must jointly close the Nurture business commit and existing Host Enrollment Invitation delivery/recovery; C-3-0d assigns no Handoff shortcut. |
| Host adult/Guardian invitation continuation, C-0 bootstrap, Technical Operator, portability | Outside ordinary domain-action driver registry | Retain separately owned identity/onboarding, provisioning, operations, or future protocol. |

The earlier B3-1d table phrase `Direct domain action` distinguished domain-object commands from legacy Workflow Run actions; the phrase did not settle the C-3-0d effect driver. C-3-0d supersedes that ambiguous label. In particular, `reply_family_care_item` is claimed-Step because a committed caregiver reply can generate a family `user_attention` snapshot. The change repairs terminology without renaming a command key or reinterpreting a legacy Run action.

Nurture derives effect identity and never accepts a client command id:

```text
direct  = H("nurture.domain-action.direct.v1",
            workspace_id, action_key, interaction_context_id)

claimed = H("nurture.domain-action.claimed-step.v1",
            workspace_id, scenario_key, original_step_id, action_key)
```

The canonical payload hash includes the command key/version, typed Participant actor, exact owner scope/target/expected versions, canonical input, InteractionContext, driver, and original Step for claimed execution. Surface, client mutation, transport nonce, correlation/trace, claim token, expected Step version, lease, attempt, and presenter state are excluded. Claim and Step version may rotate only as transient same-Step reclaim evidence.

Activated C3 writes require additive typed actor evidence: `businessActorSchemaVersion=1`, `businessActorKind=nurture_participant`, and Restrict FK `businessActorParticipantId`. Existing polymorphic `business_actor_ref` bytes and historical meaning remain untouched; no global migration may infer whether a legacy value is a My-Chat ref, system ref, or Participant. My-Chat User/Actor/Workspace provenance is retained only in separately named bounded audit evidence. Provisioning, owner recovery, service, and Technical Operator paths cannot impersonate the ordinary Participant actor.

Transaction boundaries are strict. Direct execution atomically performs replay lookup, context/actor/owner-root locks, current preconditions, database time, context consume, business mutation, Execution/audit/output refs, and explicit-empty persistence. Claimed execution additionally validates immutable Step binding and the current claim before the first business write and persists snapshots in the same transaction. `NurtureInteractionContext` consumption cannot remain a separate pre-command commit. Remote Host or provider calls are forbidden inside either transaction. A consumed context without its Execution is an integrity defect, not a retryable success.

Result/recovery semantics remain layered:

| Layer | Closed vocabulary |
| --- | --- |
| Persisted business result | `applied|already_satisfied` |
| Internal invocation disposition | `executed|replayed` |
| Current owner presentation | `changed|already_current|processed_but_unavailable` |
| Host command progress | direct `completed`; claimed `accepted` then current `completed` |

Exact original-context/Step replay returns the original Execution, output refs, and byte-equivalent snapshots, then reruns current presentation. A different newly authorized Step that observes `already_satisfied` may persist a separate Execution but MUST store `[]`; the new Step cannot copy or rematerialize the original Step seed. Zero eligible recipients also stores `[]` without changing the claimed driver. A replay or duplicate cannot describe the current caller as the original performer, approver, owner, or joint consenter.

Recovery covers each cross-database seam without compensation:

| Failure window | Required result |
| --- | --- |
| Step persisted before binding | Same mutation/token may bind the same Step; expiry stops the empty Step. |
| Binding response lost | Exact Step-binding lookup resumes the same Step without raw token. |
| Nurture committed before worker response | Same-Step reclaim returns the original Execution/snapshots. |
| `complete_step` committed before response | Existing Step/Handoff/Outbox is returned idempotently. |
| Direct response lost | Token/context lookup finds Execution before consumed/expired rejection. |
| Wrong Step or changed immutable input | Conflict, zero second effect, zero seed transfer. |
| Presenter/Handoff/Outbox/Notification/provider fails | Nurture fact remains committed; only the owning technical path retries/stops. |
| Context consumed without Execution | Integrity incident/manual technical review; no guessed repair. |

C-3-0d adoption introduces `scenario_domain_action_source_v1` over the shared action types, strict codecs, manifest declarations, driver/result contracts, and validators. The source set remains distinct from `scenario_interface_source_v1`, the Scenario module contract hash, Host renderer conformance revision, and historical workflow hashes. Adoption order remains Base -> My-Chat -> Nurture -> joint conformance. Base contains only reusable contracts/validators/fixtures; My-Chat implements trusted direct dispatch, pre-claim Step binding/reconciliation, claimed worker wiring, capability, and leakage guards; Nurture implements current preparation/authorization, identity/hash, typed actor, transactions, snapshots, and presenters. Joint evidence rejects mixed revisions, action/driver/handler drift, partial capability, cross-path replay, privacy leakage, alternate registries, and legacy fallback.

Current implementation is not C-3-0d adoption evidence. Base/My-Chat have no shared domain-action contract, action source identity, pre-claim binding state, or atomic capability. Nurture has no authenticated cross-surface action handlers for the locked matrix, no additive typed actor FK, no immutable InteractionContext-to-Step binding, and no single transaction that consumes every action context with the corresponding business effect/Execution/snapshots. The current family-input X4 claimed handler and legacy Run actions are narrow historical implementations and cannot satisfy or substitute for the C-3-0d contract.

C-3-0d evidence must cover strict prepare/submit codecs; all capability dependencies; direct/claimed static driver behavior; content-free Step persistence; bind/crash/expiry windows; typed actor migration; effect identity/hash; atomic fault injection; exact action matrix; zero-recipient and already-satisfied seed rules; same/wrong-Step recovery; result vocabulary; Base/My-Chat/Nurture identities and registries; legacy compatibility/no fallback; current-gap detection; and planning-only scope. No contract package, source hash, manifest declaration, handler, typed actor field/FK, InteractionContext binding, Step state, schema, migration, route, runtime, capability, database, secret, provider, environment, allowlist, or traffic changed.

C-3-0d is complete as a design and implementation-evidence specification only. C-3-0d completion does not authorize implementation, database change, capability enablement, Pilot-1, or traffic. The next C-3-0e section closes the remaining protected-content, draft, cache/offline, and complete-adoption design gate.

**C-3-0e — protected interaction data plane and complete-adoption evidence (LOCKED / COMPLETE)**

C-3-0e treats protected interaction as one complete data-plane gate rather than an encrypted column or transport flag. The reusable Host capability is `scenario_protected_interaction_v1`; the capability requires `trusted_scenario_invocation_v1`, `scenario_subject_presentation_v1`, and `scenario_domain_action_execution_v1`. The capability covers protected input, Nurture owner storage, owner reread, redaction/retention, process-local draft isolation, Host leakage/cache/offline guards, and joint conformance as one activation unit. Protected write without current read/erase/leakage evidence, protected read without current authorization, partial surface support, `plain_text_dev`, copying a composer-accepted protected body into ordinary Chat, `PublicDraft`, artifact draft, Step/Handoff/Outbox carriage, or legacy fallback is fatal.

Pilot protected content is limited to the locked B3 plain-text bodies: one trimmed 1–2000-character `family_care_question` or caregiver reply, UTF-8 plain text only, with `attachment_refs=[]`. CRLF is normalized to LF and outer whitespace is trimmed; rich text, HTML, media, attachments, batch input, medication, emergency, diagnostic, or prescriptive content remains unavailable. No implicit Unicode rewrite may change authored meaning. A keyed integrity digest covers the exact accepted normalized bytes; a bare hash of short human text is forbidden because a bare digest permits dictionary recovery.

The policy uses five non-overlapping content classes:

| Class | Exact boundary |
| --- | --- |
| `local_unsubmitted_draft` | Plaintext exists only in the creating adult's current foreground UI process and exact surface. No server object or recovery promise exists. |
| `prepared_protected_content` | Nurture has encrypted the finalized input and bound the object to one Workspace, Participant/RoleAssignment, surface, action, target, and InteractionContext. The object expires after five minutes and is not an editable or committed business fact. |
| `committed_protected_content` | The same prepared object is atomically attached to exactly one committed owner Message during CommandExecution; plaintext/ciphertext is not copied into Message, Item, Receipt, Attention, Execution, Handoff, Outbox, Notification, or Host shell. |
| `ephemeral_protected_view` | Plaintext returned by current owner reread exists only in request/render memory for the foreground view, at most 60 seconds, and clears on known invalidation, background, lock, logout, principal/workspace/subject/surface change, or lease expiry. |
| `body_free_shell_audit` | IDs, typed refs, versions, state, timestamps, safe generic copy, cryptographic metadata, and audit evidence only. The class never contains body text or a body-derived summary/detail. |

Nurture owns one additive `NurtureProtectedContent` aggregate. Its authoritative shape includes content kind, `prepared|committed|erased` state, bounded erase reason, Workspace and typed Participant/RoleAssignment ownership, exact surface/action/context binding, optional unique committed Message FK, version/expiry/timestamps, ciphertext, authenticated-encryption metadata, wrapped per-content key, KMS key identifier/version, and keyed integrity evidence. Each content object uses an independent data-encryption key and AES-256-GCM; an approved environment/workspace-scoped KMS key wraps that data key. Plaintext never enters the application database, replicas, backups, logs, traces, metrics, APM, crash evidence, queues, search, analytics, or general Host persistence.

Activated writes add a typed Restrict `protectedContentId` association to the owner Message, keep `NurtureFamilyCareMessage.body=null`, and use the encrypted storage mode. Existing `bodyProtectionPayload`, synthetic `protected_content_ref`, and `plain_text_dev|protected` scaffold values remain historical compatibility evidence only and cannot authorize or satisfy C-3 activation. `NurtureFamilyCareItem.detail`, deterministic summary, Receipt, Attention, InteractionContext state, CommandExecution payload/output, and owner-safe presentation must remain body-free. Any body-derived text in those locations is a leakage defect, even if labelled summary or metadata.

`prepare_domain_action` may atomically create the transient encrypted prepared object with its five-minute `submit_action` InteractionContext. The allowance refines only the C-3-0d input-transport boundary: preparation still creates no canonical Message/Item/Receipt, CommandExecution, Workflow Step, Handoff, Outbox, Notification, provider effect, or committed business fact. The InteractionContext stores only a typed protected-content ref, version, content kind, and keyed integrity binding. Editing after prepare revokes or abandons the old prepared object and requires a new protected object/context. CommandExecution consumes the context, commits the same content object, creates the Message/effect/Execution/snapshots, and preserves all C-3-0d direct/claimed atomicity and replay rules. A rolled-back command cannot leave committed content; an abandoned prepared object becomes unreadable on expiry.

Protected authoring is visibly distinct from ordinary Chat:

```text
My-Chat AI conversation or role surface
  -> open registered protected composer
  -> type/review in process-local editor
  -> prepare_domain_action through the protected route
  -> explicit submit_domain_action
  -> persist only a generic content-free completion/rehydration marker in Host UI
```

The protected composer MUST NOT call ordinary Chat message creation, create `ContentItem`/`ContentRevision`, reuse `PublicDraft` or Workflow artifact drafts, seed itself from a retained transcript, or write the body into a Chat turn. General platform Chat remains under My-Chat conversation retention and is not a Nurture business draft, authorization source, recovery source, or submission source. Nurture Chat MUST show a clear pre-entry warning and direct an intent-only conversation to an empty protected composer before asking the user for private child/family detail. A generic Chat turn may navigate or explain using display-safe semantic output, but the turn cannot silently promote, copy, summarize, or reconstruct its text into a Nurture body.

The zero-copy/no-Chat-persistence guarantee begins only when the registered protected composer accepts a business body. A user can still type or paste private material into ordinary Chat; that user-authored turn follows My-Chat's ordinary transcript/provider and deletion/privacy policy and is not retrospectively relabeled as protected content. The system MUST NOT claim that such a mistaken Chat turn was never retained, MUST NOT automatically transfer the turn, and MUST NOT expose the turn to Nurture as a body. The user may manually retype or paste content into a newly opened protected composer, while the source Chat turn remains governed by the Host policy.

Draft behavior is closed:

- The editor belongs only to the creating Participant and current surface/process. There is no cross-surface, cross-device, cross-account, cross-Participant, reload, or crash recovery.
- No autosave or body storage is permitted in server state, Chat history, `PublicDraft`, local/session storage, IndexedDB, Service Worker, URL/history, search, analytics, clipboard automation, Notification, crash report, or telemetry.
- Deliberate navigation with a non-empty draft requires `stay|discard_and_navigate`. Discard clears local memory and best-effort revokes prepared content; owner expiry remains the fail-closed cleanup if that request is lost.
- Background, device lock, logout, Workspace/Participant/subject/surface change, or capability disablement clears the local editor and protected view. Best-effort memory clearing is required, but the product does not claim DRM against user transcription, accessibility tools, browser selection, clipboard use, or operating-system screenshots.
- Direct actions clear the draft only after `completed`. Claimed actions clear the draft only after durable binding returns the stable Host `accepted` state. An unknown response recovers through the C-3-0d result shell and original Step rather than resubmitting the body. A deterministic denial may retain the local draft only while the same foreground context remains; its prepared context is no longer submit authority.

Protected-body AI is a separate optional capability, `scenario_protected_ai_draft_v1`, which depends on `scenario_protected_interaction_v1` and is OFF for Pilot-0. The base protected capability never grants a model or provider access. With the optional capability absent, AI Chat may narrate only C-3-0c display-safe semantic output and the adult composes protected text manually. Any later enablement requires an explicit `AI assist` gesture, approved no-training/zero-retention/region-compatible provider, minimum current body plus current instruction only, no Chat history/memory/RAG/search, zero durable prompt/output/cache/evaluation copy, content-free token/latency/error metrics, current authorization before the call and before submit, adult confirmation, and a manual-edit fallback with no business effect. Health output remains non-diagnostic, non-prescriptive, and non-emergency-replacement.

Current protected detail is available only through the registered `read_protected_detail` operation and an owner-issued opaque `ScenarioProtectedContentRefV1`. The ref is a locator, never bearer authority. Nurture rereads the verified principal, Participant/role, exact Subject/Thread/Message, Enrollment/CareGroup, Grant/direction/data class, source/redaction, lifecycle, and policy on every read. The closed result is `ready|tombstone|context_changed|unavailable`; existence-sensitive denial stays indistinguishable, and owner/provider outage returns unavailable/HTTP `503` without a stale body. A ready response is `Cache-Control: no-store`, never CDN/gateway/service-worker cached, and carries only the exact plaintext plus bounded display-lease metadata. Notification/deep-link continues to carry generic copy and refs only, then performs the existing two-stage current owner reread.

Pilot has no protected offline, export, download, print, explicit share/copy action, server/Redis decrypted-body cache, LLM cache, or stale-view fallback. Scenario routes and responses must be excluded from browser/PWA caches; decrypted plaintext exists only in bounded request/foreground memory and is cleared before refresh or invalidation. Operational logging, HTTP request capture, APM body capture, error serialization, tracing events, metrics labels, replay tools, dead-letter evidence, and support/admin interfaces must use an explicit body-free allowlist. Technical Operator and My-Chat Admin may inspect content-free health/evidence and invoke owner actions only; neither may read or edit the body.

Pilot retention is exact:

| Data | Retention/erasure |
| --- | --- |
| Local draft | Current foreground process only. |
| Prepared content/context | Five-minute authority; expired content becomes unreadable and cleanup removes the wrapped key no later than 15 minutes after expiry. |
| Committed protected body | 30 days from Message creation for the internal three-child Pilot, unless author redaction, source deletion, or policy requires earlier erasure. |
| Body-free business/audit facts | 365 days for Pilot evidence; Message/Item/Receipt/Execution/history remains as a body-free tombstone after content erasure. |
| AI prompt/output | Zero durable retention. |
| Encrypted backups | At most 30 days; restore must replay the erasure/redaction ledger before the database can serve protected reads. |

Erasure removes the wrapped per-content key and records a body-free reason/tombstone; shared workspace KMS keys are not destroyed per message. Grant revoke immediately stops newly unauthorized cross-role reads but is not automatic global deletion of an author's otherwise retained canonical history. Author redaction, source deletion, or retention expiry crypto-erases the body and invalidates every active view/ref. Backup ciphertext may age out under the 30-day window but cannot become readable after restore because erasure fences replay before serving traffic. Legal hold, real-participant retention, attachment/KMS policy, or a longer external-pilot history requires a separately approved policy revision; the internal Pilot default cannot silently expand.

C-3-0e adds a separately named `scenario_protected_interaction_source_v1` identity. The C-3-0e slice-adoption evidence binds seven independently named facts: historical workflow hash, `platform_child_family_identity_source_v1`, `scenario_interface_source_v1`, `scenario_domain_action_source_v1`, `scenario_protected_interaction_source_v1`, Nurture Scenario module/storage-crypto revision, and My-Chat renderer/protected-runtime conformance revision. The slice evidence also records the retention-policy revision, exact Base/My-Chat/Nurture commits, environment KMS configuration class, and explicit Workspace-allowlist state. This is slice evidence only; C-3-5's candidate -> evidence index -> qualification/current-state resolver -> typed activation-row chain is the sole cumulative activation authority. A generic `contract_hash`, mutable `file:` dependency, synthetic ref, or declared capability is not adoption evidence.

Implementation order remains additive and non-simultaneous:

1. **My-Workflow-Base:** add neutral protected field/ref/read/result/capability/source types, strict codecs/validators, dependency/fatal rules, and legacy/vNext/negative conformance; no database, encryption provider, scenario key, UI, runtime, or retention decision.
2. **My-Chat:** adopt the exact source; add the body-capture-disabled private route, protected composer and renderer, no-store/invalidation/client-storage guards, result recovery, capability dependencies, content-free audit/telemetry, leakage scanner, and optional AI gate off by default. Ordinary Chat and `PublicDraft` stay separate.
3. **The-Nurture:** pin exact revisions; add the protected-content schema/migration, repository/service, KMS envelope provider, prepare/read/redact/expiry/retention paths, typed Message relation, owner policies, restore-erasure fence, and canonical manifest/registries. Activated paths reject legacy plaintext/synthetic-ref authority.
4. **Joint:** prove exact identities and registry parity; real public -> signed private -> owner store/read -> action/Step -> owner reread paths; all fault/redaction/retention/backup/KMS-rotation cases; all Host/database/log/cache/offline leakage scans; rollback; and no legacy fallback across every entitled Guardian/Caregiver surface.

Capability activation requires the real KMS provider/key class, retention and cleanup worker, backup/restore erasure replay, all required surface handlers/renderers, leakage suites, exact source pins, empty-by-default Workspace allowlist, and both prerequisite capabilities. Rollback removes the allowlist first, disables protected interaction and dependent action/presentation gates, clears client memory, and rejects new prepare/read/action calls. Rollback does not rewrite committed Nurture business facts; retained protected content follows its original redaction/retention policy and remains owner-controlled.

Current code is not C-3-0e adoption evidence. Nurture stores `body=null` plus a synthetic `protected_content_ref`, has no protected-content aggregate or encryption/KMS service, and still exposes `plain_text_dev|protected` scaffold states; `NurtureFamilyCareItem.detail` remains a potential plaintext-copy seam. My-Chat ordinary Chat persists `ContentRevision.body`, has an independent durable `PublicDraft`, and lacks the protected composer, private no-capture route, client/cache controls, protected read renderer, and leakage scanner. Base/My-Chat have none of the C-3 source identities/capabilities. These gaps keep all activation and traffic NO-GO.

C-3-0e evidence must cover normalization/bounds; per-content envelope encryption and keyed integrity; prepared/commit/rollback/expiry races; typed Message linkage; every forbidden duplicate field/destination; current read and tombstone outcomes; revoke/redaction/retention/backup restore/KMS rotation; draft stay/discard/background/crash; Chat/PublicDraft separation; capability-off AI; no-store/browser/PWA/server/observability/Admin leakage; exact retention boundaries; named cross-repo identities; partial/mixed/legacy denial; rollback; and current-gap detection. No contract package, source hash, manifest, source, schema, migration, KMS key, route, UI, renderer, runtime, cache, capability, provider, database, environment, allowlist, or traffic changed by the C-3-0e decision.

C-3-0 is now complete only as a shared-baseline design and implementation-evidence specification. Its status is `DESIGN COMPLETE / IMPLEMENTATION OPEN`, not adopted or enabled. Actual complete Base -> My-Chat -> Nurture implementation and evidence must be delivered through C-3-1 through C-3-5 and their explicit implementation nodes before C-3-0 or C-3 can claim operational completion. The following locked C-3-1 design is the first concrete Guardian consumer; C-4 Institution IIB, topology/operations, final Go/No-Go, Pilot-1, and every traffic change remain separately unauthorized.

#### Pilot-0-C3-1 — Guardian family-communication IIB (DESIGN COMPLETE / IMPLEMENTATION OPEN)

| Sub-checkpoint | State | Decision boundary |
| --- | --- | --- |
| C-3-1-0 entry, ownership, and surface boundary | **LOCKED** | One Item-root question entry, Nurture-owned projection, exact action ownership, and one presenter across Guardian Chat, Family board, and Family workbench. |
| C-3-1a presenter, state, and query semantics | **LOCKED** | Orthogonal progress/lifecycle/question/reply visibility, current/recent/history definitions, body-free list/detail, cursor/ref bounds, and surface layouts. |
| C-3-1b protected compose, submit, and result recovery | **LOCKED** | Empty manual protected composer, five-minute prepared content, explicit claimed-Step submission, stable accepted state, owner-reread completion, and every response-loss window. |
| C-3-1c Guardian authority, episodes, and retention | **LOCKED** | Equal current Guardians, exact authorship, original-Grant fences, historical episode separation, 30-day per-Message body retention, and fixed 365-day entry history. |
| C-3-1d redaction, revoke, failure, and race semantics | **LOCKED** | Exact-author direct-empty redaction, distinct question/reply cascades, non-destructive progress, temporary versus terminal invalidation, deterministic races, and fail-closed integrity. |
| C-3-1e adoption, conformance, and exit | **LOCKED / COMPLETE** | Manifest SSOT, ordered Base -> My-Chat -> Nurture default-off adoption, isolated joint evidence, legacy no-alias/no-fallback, and C-3-5-only activation-control qualification. |

**C-3-1-0 — entry, ownership, and surface boundary (LOCKED)**

1. The Guardian product unit is one child-scoped `family_care_question` work entry, not a direct chat, group chat, mutable conversation, or generic Workflow Run. One entry begins with one Guardian source Message and one `NurtureFamilyCareItem`; the entry may later observe one acknowledge and one caregiver reply. A correction, supplement, or follow-up is a new question, Item, protected object, command identity, and routing attempt.
2. The existing `NurtureFamilyCareItem` is the internal composition root. Nurture may expose a scenario-local, non-persisted `GuardianFamilyCommunicationEntryV1` presenter projection composed from exact Message, Receipt, Item, ItemEvent, Attention, optional reply Message/Receipt, and original Grant facts. The projection is not a new table, Base shared type, Host canonical object, Handoff payload, or cross-repository business identity.
3. `NurtureFamilyCareThread` remains the exact ChildCareProcess/Family/Enrollment communication container, neither product UI nor authorization. Optional `ThreadParticipant` remains a projection and cannot grant or deny submit, read, history, or redaction. Every operation re-resolves the current Participant/role/Family/ChildCareProcess/Enrollment/Thread/Grant/policy path from owner facts.
4. C-3-1 owns only Guardian `submit_family_care_question` using `workflow_claimed_step_v1` and Guardian-source `redact_family_care_message` using `nurture_direct_empty_v1`. C-3-1 observes but does not implement caregiver acknowledge/reply/reply-redaction, which remain C-3-3. Enrollment, Grant, transfer, withdrawal, and stage writes remain C-3-2; Notification, deep link, and cross-surface continuation remain C-3-4.
5. Guardian Chat, Family board, and Family workbench use one Nurture subject resolver, presenter, action registry, protected prepare/read path, and current policy. Surface adapters may change layout and bounded view scope only; they cannot create separate state, commands, authorization, copy dictionaries, cached projections, or recovery paths.
6. Guardian Chat is generic My-Chat AI Chat plus a semantic panel, not a Nurture-specific chat shell. The AI may explain only owner-produced display-safe presentation and may open the protected composer. The AI cannot see, draft, summarize, translate, transfer, or submit protected body text in Pilot-0.
7. The C-3-0e decision supersedes earlier B3 shorthand such as `AI-assisted draft`, `editable_preview` body fields, or AI-produced family/caregiver draft text. `scenario_protected_ai_draft_v1` remains OFF. A business body accepted by the protected composer never enters the legacy `InteractionEnvelope`, ordinary Chat message/`ContentRevision`, `PublicDraft`, Workflow artifact draft, semantic block, or Host result summary. User-authored ordinary Chat text remains outside that protected-body guarantee and can never be automatically promoted into the protected lifecycle.

**C-3-1a — presenter, state, and query semantics (LOCKED)**

The scenario-local presentation key is `guardian_family_communication_v1`, using only the C-3-0c `current|recent|history` query, owner-issued opaque cursor, and owner-issued `presentation_item_ref`. The client cannot supply business status, author, Family, Child, Enrollment, Institution, Grant, date filter, sort, search text, raw id, or visibility instruction.

One entry has orthogonal state axes rather than one overloaded enum:

| Axis | Closed values | Derivation and meaning |
| --- | --- | --- |
| `progress` | `sent|acknowledged|replied` | Highest completely committed business stage reconstructed from source Message/Receipt, Item, required events, and the unique reply facts. `suppressed` never erases prior progress. |
| `entry_lifecycle` | `active|terminal|suppressed` | Whether the entry remains actionable, completed, or permanently fenced for receiver-side work/privacy; lifecycle does not redefine progress. |
| `question_visibility` | `available|tombstone|unavailable` | Current family-side question body result after authorship, relationship, redaction, retention, and disclosure checks. |
| `reply_visibility` | `not_created|available|tombstone|unavailable` | Current caregiver-reply result, independent of question visibility. |
| outer presentation/detail | `ready|context_changed|unavailable` | Current owner resolution and integrity outcome. Outage, wrong scope, incompatible facts, or forbidden disclosure never becomes a business state. |

The views are exact:

| View | Scope and ordering | Surface use |
| --- | --- | --- |
| `current` | Selected ChildCareProcess's current relationship episode; entries still in `sent|acknowledged`, excluding permanently suppressed/terminal entries; newest business activity first. | Chat at most 5 body-free entries; Family board one owner page; workbench may open the same current view. |
| `recent` | Same selected ChildCareProcess, entries that became `replied|suppressed` or otherwise terminal within the last 30 days; newest business activity first; mutually exclusive with `current`. | Chat at most 5 body-free entries; Family board one owner page; workbench may open the same recent view. |
| `history` | Every retained, currently authorized body-free entry shell for the selected ChildCareProcess within the fixed 365-day product window, separated by Institution/Enrollment episode; old and new relationship episodes never flatten or confer authority on each other. | Family workbench only, owner-paginated to completion. Chat/board offer navigation rather than carrying complete history. |

Board/workbench pages use the C-3-0c maximum of 20 entries. Chat has no cursor and returns at most 5. Owner keyset cursors use owner-defined stable business ordering plus Item identity, expire within five minutes, and bind exact principal, Workspace, scenario, subject, presentation, view, and query version. Arbitrary text search, offset pagination, client sort/filter, local filtering, and compound business queries remain outside Pilot-0.

Collections and ordinary detail are body-free. They may contain only generic safe title/copy, entitled child and episode labels, safe author relation (`self|other_guardian|caregiver`), timestamps, progress/lifecycle, visibility badges, action/navigation offers, and a five-minute item ref. They contain no body, body-derived summary, raw author or business id, original Grant id, Receipt/Item tuple, internal reason, protected ref, or hidden action state. Question and reply plaintext are independently fetched only through `read_protected_detail` after a fresh owner reread; each may independently return available, tombstone, or unavailable.

The presenter must validate a complete, unique fact graph. `replied` requires the unique linked caregiver Message, reply Receipt, reply event, terminal Item evidence, and resolved Attention evidence; other stages require their corresponding exact facts. Missing, duplicate, contradictory, or cross-Grant facts return generic unavailable and integrity-review evidence. The presenter never guesses from `Item.status`, repairs data on read, selects `findFirst`, or exposes a partial entry.

**C-3-1b — protected compose, submit, and result recovery (LOCKED)**

1. A current Nurture action offer opens a new registered protected composer with an empty editor and explicit copy that text entered in this composer does not enter Chat history. Pilot-0 provides no automatic or one-click movement of sent or unsent ordinary Chat text into the composer. A user may manually retype or paste using normal operating-system behavior; My-Chat does not retain or reconstruct the source for that transfer, while any original Chat turn continues under ordinary My-Chat transcript/privacy policy.
2. Plaintext exists first only as `local_unsubmitted_draft` in the creating Guardian's exact foreground process/surface. My-Chat sends plaintext only to the body-capture-disabled protected route. The client cannot repeat or choose action, Participant, RoleAssignment, Family, ChildCareProcess, Enrollment, CareGroup, Thread, Grant, destination, category, urgency, route, data class, summary, attachment, or authorization fact.
3. Nurture owner-rereads the exact current path and applies the fixed `family_care_question` profile: normalized 1–2000-character plain text, no attachments, no health/medication/emergency/rich content, owner-derived routing fields, and a constant generic body-free summary. Nurture atomically creates one encrypted five-minute prepared object and one `submit_action` InteractionContext. Prepare creates no Message, Receipt, Item, Event, Attention, Execution, Workflow Step, Handoff, Outbox, Notification, or committed fact, and the response never echoes the body.
4. The explicit confirmation view may display the plaintext only from current process memory beside owner-produced safe child, destination, and consequence copy. The confirmation class is `explicit`, not strong authorization. The submit echo contains only the opaque token, `confirmed`, and bounded `client_mutation_id`.
5. My-Chat persists a content-free Step as `awaiting_scenario_binding`; Nurture validates and immutably binds that exact original Step; only then may My-Chat make the Step claimable and return the stable Host `accepted/processing` result. C-3-0e draft clearing occurs only after the stable accepted result. A Run/Step, Handoff, Outbox, Notification, log, or Host shell never stores the body, protected ref, Nurture target, context id, summary, or business status.
6. The claimed worker transaction atomically consumes the context, commits the same protected object, creates the family Message, source Receipt, open Item, created Event, active Attention, typed Execution, and stable handoff snapshots. My-Chat `complete_step` atomically completes the Step and materializes Handoff/Outbox. Guardian product `sent` appears only after current Nurture owner reread proves the committed fact graph; Step/Handoff/provider status cannot infer the business result.
7. Prepare response loss leaves the same foreground local draft editable; an unreachable prepared object is not a business fact, expires after five minutes, and loses its wrapped key by the 15-minute cleanup bound. The user performs a fresh prepare rather than discovering or resuming the orphan.
8. Submit/binding response loss recovers the same body-free Step by the same bounded client mutation; recovery never creates a second Step, resends the body, or transfers ownership. If the first business execution did not commit before context expiry, the final state is generic `not submitted` and the user must re-enter a fresh protected composer. If Nurture committed in time, original Execution lookup and same-Step reclaim may complete after expiry.
9. Deterministic denial revokes prepared submit authority. The local draft may remain only in the unchanged foreground process for correction and fresh preparation. Owner/KMS/runtime outage returns no cached body or false result; stale/wrong Step, context, principal, Workspace, subject, surface, target, version, or Grant fails closed without a second effect.

**C-3-1c — Guardian authority, episodes, and retention (LOCKED)**

1. Every current exact-Family Guardian has equal product authority to submit an independent question and read the committed family-side question under current family policy. The two-Guardian family has no primary role, shared draft, co-edit, joint submit, peer approval, or ability to redact the other Guardian's Message. A Grant owner/creator label changes Grant management only, not question authorship or family-side reading.
2. Drafts are creator/process/surface-local. A second Guardian, device, account, or surface cannot recover, continue, approve, replay, or submit another Guardian's draft or prepared context. After commit, both current same-family Guardians may observe the same canonical entry, subject to the per-body C-3-1c authorization rules.
3. Every entry permanently binds its exact original Grant and relationship episode. Caregiver action and every cross-role read require that original Grant and its original scope to remain valid. Replacement, new Enrollment, new Thread, new role row, or new Grant never adopts the entry, revives old work, restores a caregiver reply body, or creates a new action.
4. After original Grant invalidation, both current same-family Guardians may still read an unredacted, unexpired family-authored question under current family policy. They lose receiver-side access to the caregiver reply and see only an allowed tombstone. An author whose current relationship can no longer reach that Family/ChildCareProcess loses author-side access. A later independently authorized new Guardian relationship may restore current family-side access to retained facts and the exact Participant's author-redaction right, but never restores the terminal old RoleAssignment, old Grant owner, or old original-Grant receiver-side authority.
5. Guardian source-redaction authority uses exact persisted `senderParticipantId`, current authenticated Participant, and a current Guardian relationship that still reaches the same Family/ChildCareProcess. Redaction does not require the historical sender RoleAssignment row, original Grant, or Enrollment to remain active, cannot transfer to another Guardian, and cannot restore any old content/action.
6. Historical entries are separated by Institution and Enrollment episode. Each row/detail rereads the entry's original scope and current same-family eligibility; a current relationship is necessary but cannot rewrite old Grant or cross-role authority. Cross-workspace content remains absent under C-2f-4-3.
7. Each protected Message body expires 30 days from that Message's own `createdAt`. A question and later reply therefore may independently be available or tombstoned. Redaction or policy may erase earlier. Reply creation never extends question-body retention, and question timing never shortens the reply's own 30-day body period.
8. The Guardian product entry-history window is a fixed 365 days from the source Message/Item creation time. At the boundary the entry disappears from Guardian product history even if a later reply or technical event occurred. Later-created underlying audit facts follow their own approved retention, but they do not extend product history. The fixed boundary avoids silently converting a bounded Pilot history into rolling indefinite retention.
9. Temporary Enrollment hold, current-role suspension, policy pause, or owner outage is an exact dependent read/action fence, not a persistent cascade. Cross-role body/action/delivery access for the affected episode fails closed while invalid and may return after the same non-terminal facts become eligible again; the family-owned ChildCareProcess, Stage, body-free episode shell, and otherwise authorized family-side history do not disappear merely because an Enrollment hold exists. Terminal Enrollment/Grant invalidation, source redaction, and retention erasure follow their permanent rules and cannot be reversed by recovery.

**C-3-1d — redaction, revoke, failure, and race semantics (LOCKED)**

1. Guardian source redaction is the existing `redact_family_care_message` action with `confirmation_class=explicit`, `nurture_direct_empty_v1`, exact author/Message, expected version, current family reachability, and explicit irreversible-consequence copy. Redaction creates no Workflow Step, Handoff, Outbox, Notification, replacement content, hard delete, or unredact route.
2. Source redaction crypto-erases the question, terminalizes the source Receipt with the locked source-redacted reason, suppresses the Item and active Attention, blocks later caregiver acknowledge/reply, and invalidates every protected view/ref. The presenter retains the highest completely committed `sent|acknowledged|replied` progress and shows a question tombstone. An already committed caregiver reply is not automatically redacted and remains independently subject to its current original-Grant/receiver policy.
3. Caregiver reply redaction remains C-3-3. Guardian presentation observes the result as a reply tombstone while source question, terminal `replied` Item, resolved Attention, and business progress remain. Reply redaction cannot suppress/reopen the source Item, make acknowledge/reply available, or permit a second reply.
4. Original Grant revoke/expiry/replacement, Grant-owner terminal role loss, terminal Enrollment/transfer, or permanent scope drift performs the locked full dependent closure. The Item may become `suppressed`, but prior progress remains visible as an authorized body-free fact. Family-side question and cross-role reply visibility follow C-3-1c; a new Grant never revives either receiver authority or action.
5. Redaction, revoke, and retention erasure share idempotent crypto/cascade primitives but retain separate CommandExecution meanings. No `take:100`, best-effort batch, async partial closure, or read-time repair may commit a partially fenced graph. The transaction must loop to verified closure within a bound or fail in full.
6. Exact compatible Execution replay is checked first. Database time, expected versions, Serializable isolation, a deterministic root/Grant/Message/Item/reply/Receipt/Event/Attention/protected-content lock order, and final uniqueness/integrity assertions govern races. Same identity with changed input conflicts; a response-loss retry returns the original effect.
7. Redaction versus acknowledge/reply is first-commit-wins. Redaction first blocks the later action with zero writes. Acknowledge/reply first preserves that highest progress and the subsequent redaction applies the corresponding cascade. Redaction and revoke may each commit their distinct idempotent audit effect, but the shared closure must end complete. Retention erasure first does not remove the author's ability to record redaction during the remaining 365-day entry shell; key deletion is idempotent.
8. Wrong actor/Workspace/Family/Child/role/surface, cross-family item ref, stale ref/version, malformed/duplicate fact graph, KMS/owner/provider outage, or disabled capability returns generic unavailable/context-changed/retryable state as applicable, without existence disclosure, partial body, stale cache, fallback, or mutation. Collection queries omit non-entitled cross-domain rows rather than returning revealing tombstones.

**C-3-1e — adoption, conformance, and exit (LOCKED / COMPLETE)**

C-3-1 is the first concrete C-3-0 consumer, but no partial Guardian-only environment may become persistent or operable. Adoption is ordered and additive:

| Gate | Owner and exact output | Exit condition |
| --- | --- | --- |
| `C31-I0` baseline consumption/isolation | All three repositories | **Requires `C30-I4`.** Nurture readiness docs are committed; the exact C30 source/runtime/schema/security evidence refs are pinned; Base starts clean; My-Chat implementation uses an isolated worktree/branch rather than the current unrelated cloud-deployment worktree. |
| `C31-I1` Guardian contract fixtures | My-Workflow-Base | Consumes `C30-I1` without recreating its interface/domain-action/protected-interaction sources. Adds only neutral Guardian-consumer conformance fixtures or missing additive codec cases; no second source identity, runtime, database, Nurture key, UI, or retention policy. |
| `C31-I2` Guardian Host composition | My-Chat | Consumes `C30-I2`; adds the three Guardian surface compositions, Guardian result recovery, and the exact protected no-capture journey over the already adopted signer/renderer/action/protected runtime. Capabilities remain absent/off and allowlist empty; no parallel generic runtime is introduced. |
| `C31-I3` Guardian owner slice | The-Nurture | Consumes `C30-I3`; adds Guardian query/presenter/actions, exact fact relations, prepare/read/redact/expiry paths, and Step binding over the already adopted typed actor, protected schema/KMS/retention, and canonical manifest machinery. |
| `C31-I4` isolated joint conformance | Three repositories | Requires `C31-I0..I3` and reuses `C30-I4` evidence. Test-harness-only composition proves public Host -> signed private -> owner resolve/present/read -> protected prepare -> claimed submit -> owner reread plus every Guardian denial/fault/privacy case. No persistent environment allowlist is written. |
| `C31-I5` default-off adoption record | Three repositories | Requires `C31-I4`. The consumed C30 identities plus Guardian-specific manifest/runtime/schema evidence, retention revision, exact commits, leakage results, and rollback evidence are pinned; legacy behavior remains unchanged. Status may become `DEFAULT-OFF ADOPTED / C-3-5 VERIFICATION PENDING`, never operational complete. |

`scenario.manifest.yaml` is the sole canonical scenario manifest. A generated typed artifact may feed module composition and cannot be hand-edited. Code handler/provider/presenter registries remain implementations, while conformance is bidirectional and fatal for manifest-without-implementation, active implementation-without-manifest, or surface/action/driver/source drift. A pre-activation manifest is mechanically projected from disabled capabilities, never maintained by a key-specific hand filter. My-Chat consumes the exact manifest/shared types and does not copy a Nurture business registry.

The historical `capture_family_input` Workflow entrypoint and its Run requirement are compatibility-only. They cannot be renamed, aliased, wrapped, or used as fallback for `submit_family_care_question`; cannot carry client Participant/role/Child/Family/Enrollment/Thread/Grant, `safe_summary`, synthetic protected ref, attachments, or wider data classes into the new action path; and cannot satisfy any C-3 source identity or evidence. Existing `internal_api`, synthetic presenter, `plain_text_dev|protected`, `ThreadParticipant` authorization, hand-maintained preactivation filters, or mutable `file:|link:` dependency likewise cannot be relabelled as adoption.

Persistent activation-control implementation and component qualification are deferred to C-3-5 after C-3-2 Guardian relationship, C-3-3 Caregiver operations, and C-3-4 continuity are implemented and jointly proven. C-3-1 through C-3-4 may merge only default-off code and use isolated test-harness composition. C-3-5 still ends false/empty; a non-empty persistent environment capability/Workspace allowlist is Pilot-2-only. The deferral avoids an operable Guardian write path without the caregiver, notification, stale-open, and complete fault/privacy gates.

C-3-1 conformance must cover source/manifest/registry parity and mixed-revision denial; every principal/workspace/surface/subject/Family/child/role negative; zero/one/multiple subject and dual-Guardian cases; current/recent/history pagination and episode separation; every orthogonal state combination and malformed graph; empty protected composer and Chat/PublicDraft separation; prepare/commit/rollback/expiry/KMS/retention/redaction; claimed submit, pre-claim binding, same/wrong-Step and response loss; original Grant at every read/action/reopen boundary; body leakage scans across Host persistence, database duplicates, Step/Handoff/Outbox/Notification, logs/APM/cache/PWA/browser/crash evidence; source versus reply tombstones; default-off rollback and no legacy fallback. A fixture-created caregiver reply may prove Guardian projection only and cannot claim C-3-3 or a complete round trip.

Current implementation fails the C-3-1 gate: Base/My-Chat lack all C-3 sources/capabilities and My-Chat lacks the protected/semantic Guardian runtime; Nurture lacks Guardian query/presenter, protected aggregate/KMS, typed source/reply constraints, strict original-Grant selection, acknowledge-only reply, typed actor, complete closure, and manifest generation/parity. Existing broad input profiles, `findFirst` Grant selection, hard `ThreadParticipant` authorization, synthetic protected refs, Item plaintext seam, hand-filtered activation, and `take:100` cascades are blockers, not compatibility evidence.

C-3-1 is complete only as a design and implementation-evidence specification. No contract package, source hash, manifest declaration, generated artifact, handler, schema, migration, KMS key, route, UI, renderer, runtime, cache, capability, allowlist, database, provider, environment, or traffic changed. The following C-3-2 section closes Guardian relationship/authority design; C-3-3/4/5 and C-4 retain their named boundaries.

#### Pilot-0-C3-2 — Guardian relationship and authority IIB (DESIGN COMPLETE / IMPLEMENTATION OPEN)

C-3-2 closes the complete Guardian relationship product boundary rather than treating Enrollment, Grant, and Stage as unrelated buttons. The boundary includes first-Guardian and Co-Guardian onboarding, accepted relationship visibility and self-exit, but keeps Host-coordinated invitation transitions separate from ordinary subject-domain actions. Institution Enrollment Invitation issue/cancel and transfer proposal/cancel remain C-4 Institution work; Notification/deep-link delivery remains C-3-4; persistent activation-control implementation and final default-off qualification remain C-3-5, while actual non-empty activation remains Pilot-2.

| Sub-checkpoint | State | Decision boundary |
| --- | --- | --- |
| C-3-2-0 scope, roots, and surfaces | **LOCKED** | One non-persisted multi-root Guardian authority presentation, exact current/recent/history semantics, multi-Institution episode separation, and three-surface behavior. |
| C-3-2a relationship onboarding and self-exit | **LOCKED** | First/Co-Guardian invitation continuation, exact recipient/inviter boundaries, accepted relationship visibility, rejoin, and self-exit. |
| C-3-2b Enrollment authority | **LOCKED** | Confirmation/decline, family hold/release, transfer review/confirm/decline, withdrawal, re-entry, and exact drivers. |
| C-3-2c Grant authority | **LOCKED** | Fixed-profile review, first-committer ownership, owner-only replacement/revoke, role-bound authority, and no old-work revival. |
| C-3-2d family-owned StageEpisode | **LOCKED** | Set/change/correct/clear selection, strong confirmation, longitudinal history, and same-workspace multi-Institution privacy. |
| C-3-2e authorization, recovery, and attention | **LOCKED** | Current strong authorization, direct/claimed/invitation separation, typed results, two-Guardian races, and default-off relationship-attention seed rules. |
| C-3-2f adoption, conformance, and exit | **LOCKED / COMPLETE** | Ordered Base -> My-Chat -> Nurture adoption, invitation and Handoff lanes, implementation blockers, isolated evidence, and planning-only exit. |

**C-3-2-0 — scope, owner roots, and product surfaces (LOCKED)**

The scenario-local presentation key is `guardian_relationship_authority_v1`. The key names a non-persisted Nurture owner projection over the selected `NurtureChildCareProcess`, not a Base business type, My-Chat relationship object, database table, authority cache, or new aggregate lifecycle. The projection composes, without flattening, the independent canonical roots represented by `guardian_relationship_current`, `enrollment_confirmed`, `enrollment_lifecycle_current`, `enrollment_transfer_current`, `family_care_grant_current`, and `child_care_stage_current`.

1. Guardian RoleAssignment, Enrollment episode, family/Institution Hold, TransferIntent, Grant, and StageEpisode each retain their exact owner, identity, version, lifecycle, audit, and transaction rules. The outer presentation has only the C-3-0c `ready|empty|context_changed|unavailable` meanings. A combined `relationship_status`, health score, synthetic readiness enum, persisted summary, or My-Chat reconstruction is forbidden.
2. The subject remains the family-owned ChildCareProcess. One process may have multiple current Enrollments in different same-workspace Institutions; therefore there is no subject-wide current Enrollment, CareGroup, Grant, Thread, or transfer target. Every Institution relationship is segmented by exact Enrollment episode and every action target binds one exact root/episode.
3. A current exact-Family Guardian may see safe child/family context, their own confirmed relationship label, whether another current Guardian exists, and `grant_management=self|another_guardian|none`. The projection contains no peer name/contact/account, Guardian list, raw role/Participant/business id, invitation recipient contact, internal reason, protected body/ref, technical state, or cross-Institution existence signal.
4. `current` shows the current Guardian relationship, family-owned current Stage, and each entitled current Enrollment episode with its side holds, pending transfer review, current Grant, and available current actions. `recent` shows body-free relationship/Enrollment/Grant/Stage changes from the previous 30 days, newest owner business time first, without becoming a retention rule. `history` shows every currently authorized canonical fact still retained by its owning domain, owner-paginated and separated by Role/Enrollment/Grant/Stage episode. C-3-1's fixed 365-day communication-entry window does not truncate relationship or Stage history.
5. Chat renders at most five owner-prioritized current/action-needed summaries and navigates to exact detail when more exist. Family board renders one current/recent owner page. Family workbench renders complete retained authorized history and complex review. Pages remain bounded by C-3-0c; arbitrary search, client filter/sort, local aggregation, and complete Chat/board history remain outside Pilot-0. Cross-surface navigation preserves only registered route class plus `current|recent|history`; item/action/context/output refs never cross surfaces.
6. The root overview does not advertise every action for every Institution at once. An owner-issued `presentation_item_ref` opens one fresh episode/root detail; that detail performs a new owner reread and may emit the separate action target. The item ref never becomes the action target, and the maximum action-offer bound cannot be bypassed by a multi-Institution subject.
7. Chat is the generic My-Chat AI semantic panel. AI may explain narration-allowed safe relationship facts or help navigate, but cannot choose a child, Institution episode, relationship label, Grant definition, Stage, action, or confirmation. Family board/workbench use the same Nurture provider, action, policy, driver, and result contracts rather than maintaining surface-specific semantics.
8. A temporary family/Institution Enrollment hold fences the exact episode's cross-role actions, protected-body reads, and dependent delivery; the hold does not hide the family-owned ChildCareProcess, current Stage, body-free episode shell, or otherwise authorized family-authored history. A terminal Enrollment preserves its safe historical shell while its original Grant and cross-role work remain permanently fenced.

**C-3-2a — relationship onboarding, current authority, and self-exit (LOCKED)**

Relationship onboarding uses a dedicated Host invitation boundary because raw recipient contact, provider delivery, Host acceptance, and prospective zero-Participant continuation cannot enter ordinary subject-domain action contracts. These exact scenario operations and commands are registered only in the invitation/prospective application-service lane:

| Invitation operation | Nurture command | Confirmation | Exact meaning |
| --- | --- | --- | --- |
| `establish_first_guardian_relationship` | `nurture.family_care.establish_first_guardian_relationship` | `strong_authorization` | Exact accepted recipient explicitly creates/selects the qualified platform Child/Family pair; after typed-anchor/binding resolution reuses existing endpoints and atomically adds only missing bindings, Nurture establishes or exact-replays the workspace-local Child/Process/child-scoped Family, first Guardian, and both associations before Enrollment confirmation. |
| `issue_co_guardian_invitation` | `nurture.family_care.issue_co_guardian_invitation` | `strong_authorization` | An inviter who is both a current exact-Family Guardian and an authorized My-Chat Family member requests one exact-recipient Host Family invitation and creates the bound Nurture intent. |
| `accept_co_guardian_invitation` | `nurture.family_care.accept_co_guardian_invitation` | `strong_authorization` | After exact Host acceptance creates/exact-replays Workspace and Family membership, the authenticated recipient confirms relationship metadata and Nurture atomically creates one new current Guardian role. |
| `cancel_co_guardian_invitation` | `nurture.family_care.cancel_co_guardian_invitation` | `explicit` | Exact current inviter terminalizes only their still-pending Nurture intent. |
| `decline_enrollment_invitation` | `nurture.family_care.decline_enrollment_invitation` | `explicit` | After exact Host acceptance/authentication but before Enrollment consumption, the recipient terminalizes the still-pending Nurture Enrollment invitation. The action creates no Institution/Enrollment linkage and does not revoke an independently committed Child/Process/Family/Guardian profile. |

These keys are not `domain_action_contracts` entries and do not use `nurture_direct_empty_v1`, `workflow_claimed_step_v1`, or Workflow Handoff. They use the separately verified C-3-0b `invitation_continuation` path and one Host invitation orchestration. Institution-side `initiate_enrollment` and cancellation remain C-4.

1. Co-Guardian issue is reachable from Guardian Chat, Family board, and Family workbench by opening one My-Chat-owned invitation panel. Ordinary Chat history, semantic blocks, PublicDraft, Nurture rows, logs, and analytics never receive raw contact. Nurture receives only the opaque exact-recipient Host invitation binding and owner-confirmed relationship metadata.
2. My-Chat first creates a non-deliverable exact-recipient invitation shell. The Nurture command then validates the inviter or prospective recipient and atomically creates its intent/effect, `CommandExecution`, and opaque Host binding. Only after the Nurture response or exact replay may My-Chat activate delivery. A Nurture rollback stops the unused Host shell; response or activation loss resumes the same identities. Provider failure never creates authority or rolls back a Nurture fact.
3. Host acceptance proves canonical adult identity and creates/exact-replays the exact Workspace and Family memberships; those facts alone grant no Nurture access. The exact Nurture intent, inviter's current dual-owner authority, recipient, expiry, Family/Process lifecycle, policy, cohort gate, and strong confirmation are rechecked before a Participant/Role write. There is no generic Participant find-or-create fallback, fuzzy child matching, raw-id claim, or invitation-kind substitution.
4. First-Guardian establishment is the locked recoverable owner sequence, not one cross-database transaction: the adult explicitly creates/selects the current platform Child/Family pair; the coordinator reuses valid typed anchors and reserves only missing ones; My-Chat atomically creates or exact-replays every missing binding; then one Nurture transaction rereads signed current pair/workspace evidence and binds/reuses the Participant while creating or resolving the local Child, ChildCareProcess, child-scoped Family, first current Guardian RoleAssignment, and both workspace associations. The Host operation carries the locked terminal/unknown recovery state. Co-Guardian acceptance uses a separate stable membership operation followed by the stable Nurture role operation; a one-sided commit grants nothing and is never compensated by the other owner. Neither flow creates Enrollment, Grant, Thread, Message, history copies, or retrospective notifications.
5. Accepted Guardians are equal for family authority. Join order and `father|mother|other_guardian` are display metadata only. Pre-accept, the recipient has no existence/history/action access; post-accept, current owner reads may return eligible retained facts from before acceptance without copying them.
6. A Participant who later rejoins through a new invitation/new RoleAssignment regains current family-side access to retained, unredacted facts and may again redact Messages they exactly authored while current family reach exists. Rejoin never restores the terminal old RoleAssignment, old Grant ownership, old original-Grant cross-role body/action authority, old drafts/contexts, or historical notifications. This current-family rule supersedes any reading of C-3-1 that a new relationship can never expose an old family episode.
7. Accepted-role offboarding is the ordinary action `exit_guardian_relationship -> nurture.family_care.exit_guardian_relationship`, with `strong_authorization`, all three Guardian surfaces, and `nurture_direct_empty_v1`. The action binds the actor's exact current RoleAssignment/version and cannot target a peer.
8. Self-exit fails before write for the last current Guardian. Otherwise one transaction revokes the actor's exact RoleAssignment, cancels their pending Co-Guardian intents, revokes/fences actor-owned Grants and dependents, preserves other-owner Grants, and commits one Execution with explicit `[]`. The transaction creates no relationship-attention snapshot, notification, Handoff, ownership transfer, or forced-removal precedent.
9. Self-exit versus another self-exit, Co-Guardian accept, invitation cancel, Grant action, or family-care action is serialized from the Family/Process/current-role root. Two Guardians cannot both pass the last-Guardian fence. A stale loser must reread and reauthorize; no peer, Institution, Technical Operator, service, or database repair path may remove an accepted role.
10. Enrollment-invitation decline may occur before or after workspace-local relationship establishment, provided the exact invitation remains pending and no Enrollment transaction has consumed it. Decline terminalizes only that invitation, creates no Institution link, Roster link, Enrollment, Grant, or Thread, and never deletes or rolls back committed platform identity/bindings, anchors/associations, local Child/Process/Family, Participant, or Guardian RoleAssignment. Evidence MUST include `local relationship committed -> invitation declined -> owner facts retained -> Enrollment absent` plus response-loss and concurrent Enrollment-consume first-commit-wins.

**C-3-2b — Enrollment, hold, transfer, withdrawal, and re-entry (LOCKED)**

The ordinary action matrix is exact and identical on Guardian Chat, Family board, and Family workbench:

| Action | Command | Driver | Authority and result boundary |
| --- | --- | --- | --- |
| `confirm_family_enrollment` | `nurture.family_care.confirm_enrollment` | `nurture_direct_empty_v1` | Exact current invitation recipient only; atomic Enrollment/Roster link/invitation consume; no Grant. |
| `suspend_family_enrollment` | `nurture.family_care.suspend_enrollment` | `nurture_direct_empty_v1` | Any current exact-Family Guardian places the shared family-side Hold. |
| `resume_family_enrollment` | `nurture.family_care.resume_enrollment` | `nurture_direct_empty_v1` | Any current exact-Family Guardian releases only the family-side Hold. |
| `confirm_enrollment_transfer` | `nurture.family_care.confirm_enrollment_transfer` | `nurture_direct_empty_v1` | Any current exact-Family Guardian confirms one current same-Institution transfer proposal. |
| `decline_enrollment_transfer` | `nurture.family_care.decline_enrollment_transfer` | `nurture_direct_empty_v1` | Any current exact-Family Guardian terminally declines one current proposal. |
| `withdraw_family_enrollment` | `nurture.family_care.withdraw_enrollment` | `workflow_claimed_step_v1` | Any current exact-Family Guardian ends the shared Enrollment and may seed other-Guardian relationship attention. |

Every listed action uses `strong_authorization`, one five-minute submit context, exact episode/root versions, and complete consequence review. Pilot adds no password, OTP, biometric, or legal-verification ceremony beyond the current applicable My-Chat recent-authentication policy; the Host assertion never replaces Nurture current authority or explicit confirmation. Natural-language agreement, AI classification, item open, invitation receipt, join order, Grant ownership, or a second Guardian's response cannot execute or countersign an action.

1. Confirmation and fresh re-entry confirmation require the exact active invitation recipient to remain a current Guardian of the selected ChildCareProcess. Another current Guardian cannot take over without a new exact invitation addressed to them. The transaction creates no Grant/Thread/Handoff and stores explicit `[]`.
2. Family Hold is shared topology state, not the placing Guardian's personal lock. Either current exact-Family Guardian may place or release the Hold. An Institution Hold is independent and cannot be released by a Guardian; releasing Family Hold may leave the aggregate paused. Holds do not extend Grant, invitation, or policy clocks.
3. Guardian transfer confirmation/decline operates only on the exact current Institution proposal. Confirm atomically ends the old episode, closes old Grant/work, and creates the target safe roster/Enrollment episode; a fresh Grant and Thread authority are required for later work. Proposal/cancel remains C-4. Decline/confirm creates no new attention; an already-open proposal attention simply owner-rereads current state.
4. Withdrawal is terminal `withdrawn + family_withdrawn`, whether the episode is active or paused. The transaction closes holds, pending TransferIntents, roster/current Grant/Thread/dependents, preserves safe history, and cannot resume. Fresh re-entry requires a new invitation, Roster/Enrollment/Grant/Thread identities, and never reopens old work.
5. Withdrawal remains claimed-Step even when there is one Guardian and snapshots are `[]`, when all peer recipients become ineligible, or when the business outcome is `already_satisfied`. The actor is excluded; only other current exact-Family Guardian RoleAssignments captured at commit may receive future relationship attention.

**C-3-2c — Grant review and exact-owner administration (LOCKED)**

1. `family_care_grant_current` is the sole current Grant presenter. The presenter shows the safe child, exact Institution/CareGroup/Enrollment episode, fixed bidirectional `family_care_question` profile, duration, allowed users, owner relation, excluded uses, retention/revoke effects, and current action availability. The presenter exposes no raw owner, Grant/Thread ref, body, internal enum/hash, or editable policy payload.
2. `confirm_child_link_grant -> nurture.family_care.confirm_grant` is available on all three Guardian surfaces, uses `strong_authorization` and `nurture_direct_empty_v1`, and accepts no free-form profile. Any current exact-Family Guardian may perform the complete fixed-profile review. The first valid commit becomes the sole exact owner bound by both Participant and RoleAssignment; a racing or later same-definition confirmer sees family-user `already_active`, never joint ownership.
3. Another current Guardian may use and inspect the current active Grant, submit eligible questions, and later create a complete fresh future-only Grant after terminal owner loss. They cannot replace, revoke, transfer, extend, renew, or inherit the existing Grant while its exact owner role remains temporarily or currently eligible.
4. `replace_child_link_grant -> nurture.family_care.replace_grant` and `revoke_child_link_grant -> nurture.family_care.revoke_grant` remain all-surface, strong, direct-empty actions for the exact stored Participant plus exact stored RoleAssignment owner only. Replacement choices are current Nurture-policy-produced fixed deltas; the user cannot freely edit directions, data classes, purposes, scope, target, expiry, owner, or topology.
5. Replacement creates one successor identity under the locked single lineage, same owner, exact Enrollment-private Thread container, and complete old-Grant fence. Revoke is irreversible with server-owned reason and complete fence. Neither operation revives, adopts, or reauthorizes old Message/Receipt/Item/Attention/body; reused Thread is not authority.
6. Exact-role suspension temporarily fences the Grant and old work without peer takeover. Terminal exact-role loss permanently fences the Grant; a later new RoleAssignment, even for the same Participant, does not revive the old Grant. A new complete first-Grant confirmation after terminal loss creates an independent future-only Grant with no ownership transfer or old-work revival.

**C-3-2d — family-owned StageEpisode selection and longitudinal view (LOCKED)**

1. `child_care_stage_current` remains the canonical current/history presenter and `update_child_care_stage -> nurture.family_care.update_child_care_stage` remains the single action/command pair. Any current exact-Family Guardian may independently set, change, correct, or clear the current StageEpisode using `strong_authorization` and `nurture_direct_empty_v1`.
2. Stage is family-owned longitudinal context, independent of Enrollment, CareGroup, Grant, Institution, roster, age clock, birthday, AI, pregnancy evaluation, and protected family-care workflow. A process with zero, one, or several Institution Enrollments uses the same StageEpisode chain, while Institution/Caregiver surfaces receive no stage visibility under the Pilot data classes.
3. Stage selection uses only existing C-3-0c read and C-3-0d action primitives. The current Stage detail offers owner-issued navigation for the currently valid operation. Owner-paginated catalog/detail reads use `presentation_item_ref`; after an exact option is selected, a fresh owner read emits one `update_child_care_stage` action target bound to the operation, catalog version, exact coarse/fine tuple, Process/current-Episode versions, and actor/surface. The item ref itself never becomes action authority. `clear` may be offered directly from the current detail.
4. The client never sends a raw StageEpisode id, arbitrary stage label, Institution stage, birth-derived value, or free-form catalog key. My-Chat renders the owner safe choices and does not maintain a Nurture catalog. Set is available only when unset; change/correct/clear only when a current leaf exists; correction applies only to that current leaf. Every preparation and submit rereads the catalog and current lineage.
5. First commit wins for two Guardians and every set/change/correct/clear combination. A stale loser receives current state and must explicitly choose/reconfirm; there is no silent retarget, common approval, overwrite, backdate, historical edit, branch, or inferred elapsed-stage synthesis. Exact replay and exact same-stage `already_satisfied` create no second Episode/version/audit.
6. Family workbench history displays every retained canonical StageEpisode in its database-time lineage. Enrollment episodes appear in separate sections and do not supply Stage authority or receive Stage disclosure. Old artifacts retain original stage provenance; current Stage mutation neither rewrites them nor changes another Institution's topology.

**C-3-2e — authorization, replay, relationship attention, and races (LOCKED)**

All ordinary C-3-2 actions use C-3-0d preparation, submit, identity, typed actor, atomic transaction, and result recovery. Client echo after preparation is only the owner token, exact confirmation, and bounded mutation id. Current Host membership/recent-auth evidence, Participant/RoleAssignment, Family/Process, exact root/episode, policy, lifecycle, expected versions, and consequence hash are rechecked at submit. Selection, review, AI narration, item open, notification read, and cached presentation create no Execution.

| Path | Allowed technical shape | Forbidden substitution |
| --- | --- | --- |
| Ordinary direct relationship action | Context/effect/typed Execution/explicit `[]` in one Nurture transaction. | Workflow Run, Handoff, invitation acceptance, or surface-specific command. |
| Family withdrawal | Pre-bound, claimed original Step; Nurture effect/Execution/stable snapshots; My-Chat atomic Step/Handoff/Outbox completion. | Direct downgrade, another Step, `user_attention`, recipient-dependent driver, or after-the-fact seed. |
| Host invitation operation | Exact Host invitation shell plus Nurture invitation/prospective application service and CommandExecution. | Generic domain-action driver, Handoff, ordinary Participant fallback, or provider acceptance as authority. |

The additive `guardian_relationship_attention` declaration remains separate from existing `user_attention`. Its only purposes are `review_enrollment_transfer|enrollment_relationship_changed`; its only sources are `enrollment|enrollment_transfer_intent|guardian_role_assignment`. C-3-2 implements and proves only the family-withdrawal producer/owner source path: one stable cohort-level draft contains the exact other-current-Guardian RoleAssignment set with actor excluded, membership captured at commit, seven-day-or-earlier allowlist expiry, generic provider-safe copy, and explicit `[]` when no eligible peer exists. A nonempty effect creates at most one Handoff; My-Chat fans it out into per-recipient candidates under the same Handoff. Transfer-proposal and Institution-close producers remain C-4. C-3-4 owns Notification creation, provider send, route, and two-stage open; C-3-2 cannot claim those journeys from snapshot materialization alone.

Execution replay lookup precedes context expiry. Direct response loss returns the original Execution and reruns current presenters. Claimed response loss uses only the same original Step with a fresh claim. Wrong Step, path, actor, surface, Workspace, subject, episode, role, expected version, or payload conflicts without a second write or seed transfer. A lost command identity falls back only to ordinary current presentation and cannot probe or attribute the prior actor.

The minimum two-Guardian race matrix includes Co-Guardian accept/cancel/inviter exit; both Guardians attempting self-exit; Enrollment hold/release/withdraw; transfer confirm/decline; first Grant confirm, replace/revoke, owner loss, and question/revoke; Stage change/correct/clear; and response loss at every post-commit seam. Family/Process/current-role locks protect relationship cardinality; Enrollment remains the topology root for episode work; Grant locks role -> Enrollment -> Grant -> Thread/dependents; Stage locks Process/current Episode without treating unrelated Enrollment version change as a conflict. Every stale loser refreshes and reconfirms.

**C-3-2f — adoption, conformance, and exit (LOCKED / COMPLETE)**

Implementation is additive, ordered, default-off, and isolated:

| Gate | Owner and exact output | Exit condition |
| --- | --- | --- |
| `C32-I0` prerequisite isolation | All three repositories | **Requires `C31-I5`.** The C30 baseline and C31 Guardian communication adoption are pinned rather than reimplemented; Nurture decisions are committed; Base is clean; My-Chat uses an isolated worktree. |
| `C32-I1` reusable contracts | My-Workflow-Base | Existing neutral interface/domain-action sources gain only required strict codecs/validators/fixtures; invitation and relationship Handoff remain neutral contracts, with no Nurture key/runtime/database/UI. |
| `C32-I2` Host/runtime adoption | My-Chat | Exact Base pins; signed ingress; three Guardian surfaces; generic presentation/action/result and recent-auth flow; dedicated Host invitation subsystem; direct/claimed orchestration; all capabilities absent/off and allowlist empty. |
| `C32-I3` owner schema/kernel | The-Nurture | Migration preflight; complete relationship/Enrollment/Hold/Transfer/Grant/Stage/typed-actor/context schema; repositories/commands/presenters/handlers; database time/locks/constraints; canonical manifest generation/parity; capabilities off. |
| `C32-I4` relationship attention | My-Chat and Nurture | Distinct default-off declaration, validator, owner resolver/consumer, withdrawal same-Step and zero-recipient evidence; no Notification UI/live provider enablement. |
| `C32-I5` invitation lane | My-Chat and Nurture | Exact Host shell/prospective continuation, Nurture intent/role commands, issue/accept/cancel/decline/recovery/race evidence, and no generic-action/C-0/operator fallback. |
| `C32-I6` isolated joint evidence | Three repositories | Every exact identity/revision is pinned; all surfaces/actions/races/privacy/fault/legacy negatives pass in test-harness-only composition. Status may become `DEFAULT-OFF ADOPTED / C-3-5 VERIFICATION PENDING`, never operational complete. |

Evidence identities stay distinct: historical Workflow contract hash, `platform_child_family_identity_source_v1`, `scenario_interface_source_v1`, `scenario_domain_action_source_v1`, Scenario module contract hash, Host renderer conformance revision, Nurture relationship schema/command revision, and relationship-attention contract/owner-consumer revision. A generic hash cannot replace them. `scenario.manifest.yaml` remains canonical, generates its typed artifact/projection, and must match provider/presenter/action/handler/invitation/Handoff registries bidirectionally. Legacy `capture_family_input`, Run actions, `internal_api`, synthetic presenters/refs, static owner token, hand-filtered activation, Handoff-id deep links, and mutable `file:|link:` dependencies cannot alias or satisfy C-3-2.

Current implementation fails C-3-2. Base/My-Chat lack every C-3 shared source/capability and the Host invitation contract. Nurture lacks RosterEntry and both invitation intents, PauseHold, TransferIntent, StageEpisode/lineage, complete Enrollment episode/terminal constraints, role-bound/replacement Grant constraints, typed business actor/context/Step binding, Guardian relationship presenters, and nearly every action handler. Existing Grant selection uses application time and non-exhaustive `findFirst` behavior; ThreadParticipant remains a hard authorization seam; current revoke accepts client-shaped reason/input and cascades are bounded by `take:100`. My-Chat's current `user_attention` consumer, static bearer owner read, stored Handoff-id notification target, and deep link are legacy X4 evidence and violate the new relationship/C-3-4 boundaries.

C-3-2 conformance must cover every established action across Chat/board/workbench; exact invitation operations and prospective zero-Participant rules; equal current Guardians and exact Grant owner; rejoin family-side versus old cross-role authority; multiple same-workspace Institutions without interference; current/recent/history and safe field allowlists; every strong-confirmation/natural-language negative; direct/claimed/invitation path separation; context/replay/response-loss/wrong-Step behavior; complete relationship/Enrollment/Grant/Stage transactions and races; relationship-attention recipients/expiry/zero-recipient behavior; manifest/generated/implementation parity; mixed revisions; all known legacy aliases/leaks; capability-off rollback; and empty persistent allowlists.

C-3-2 is complete only as a design and implementation-evidence specification. No shared contract, source hash, manifest declaration, invitation subsystem, handler, schema, migration, route, UI, renderer, runtime, Handoff consumer, capability, allowlist, database, provider, environment, or traffic changed. C-3-3 Caregiver operational IIB is next; C-3-4 owns continuity/Notification open, C-3-5 owns default-off activation-control qualification and complete Guardian/Caregiver evidence, and C-4 owns Institution producers/surfaces.

#### Pilot-0-C3-3 — Caregiver operational IIB (DESIGN COMPLETE / IMPLEMENTATION OPEN)

| Sub-checkpoint | State | Decision boundary |
| --- | --- | --- |
| C-3-3-0 work root, role, and surfaces | **LOCKED** | One Item-root non-persisted owner projection, exact single-Caregiver Pilot scope, two entitled surfaces, and no Attention/Host second lifecycle. |
| C-3-3a collection, detail, and protected read | **LOCKED** | Current/recent/history semantics, cross-child CareGroup collection, body-free integrity, transient protected detail, and AI/cache exclusion. |
| C-3-3b explicit acknowledge and exact work claim | **LOCKED** | Direct-empty acknowledge, exact Participant plus RoleAssignment claim, Receipt/Event/Attention invariants, and no implicit read or handoff. |
| C-3-3c manual protected reply and family seed | **LOCKED** | Acknowledged-only same-claimant reply, claimed original Step, original Grant, terminal reply graph, and direction-aware `user_attention`. |
| C-3-3d redaction, retention, role loss, and races | **LOCKED** | Exact original staff-episode author redaction, independent body axes, temporary versus terminal fences, closed UX, and deterministic concurrency. |
| C-3-3e adoption, conformance, and exit | **LOCKED / COMPLETE** | Ordered default-off three-repository adoption, distinct evidence identities, legacy negatives, isolated joint proof, and C-3-5-only qualification before any Pilot-2 activation. |

**C-3-3-0 — one caregiver work root, exact role, and two surfaces (LOCKED)**

The scenario-local presentation key is `caregiver_family_care_work_v1`. The key produces a non-persisted `CaregiverFamilyCareWorkEntryV1` owner projection rooted in one exact `NurtureFamilyCareItem`. The complete fact graph is the source Guardian Message, family-to-organization Receipt, Item and required ItemEvents, unique family-care TeacherAttention projection, original Grant, optional caregiver reply Message, and optional organization-to-family Receipt. The projection is not a new table, Base business type, Host canonical object, Handoff payload, or second business lifecycle.

`NurtureTeacherAttentionItem` remains a child-scoped operational index/projection. For `sourceType=family_care_item`, the projection has exactly one typed source Item and mechanically follows the Item graph; the Attention row cannot authorize a body read or action, own work status, or accept an action target. The `current` presentation renders an Attention summary block and an Item inbox block from one owner snapshot. `recent|history` render Item-root work shells. A fresh `presentation_item_ref` opens detail inside the same presentation and only that detail may issue an Item-bound action target. Separate legacy `open_class_family_inbox` and `open_today_attention_board` Workflow/internal-API responses cannot become canonical presenter keys or fallback paths.

1. Caregiver product surfaces are exactly generic `nurture_chat` and `teacher_board`. There is no Caregiver workbench, direct family Chat, Nurture-owned product shell, bulk surface, or Institution-admin fallback.
2. The owner context is one exact active care-group-scoped `caregiver` RoleAssignment. Lead designation is an independent C-1 staffing fact and never substitutes for the operational role. Institution Admin, Technical Operator, general Workspace admin, service identity, Institution-scoped role, another CareGroup role, raw id, or `ThreadParticipant` row grants no collection, detail, body, or action access.
3. A caregiver serving more than one CareGroup receives a separate subject-collection context for each group; neither My-Chat nor Nurture Chat flattens groups. The selected group may aggregate its three Pilot child scopes, but every row/action remains bound to one exact Item/ChildCareProcess/Enrollment episode.
4. Pilot requires exactly one eligible current operational Caregiver RoleAssignment in the selected group. Zero or multiple eligible roles fail the protected read/action cohort gate and produce only refs-only readiness evidence; the repository does not add a global one-Caregiver constraint because a future version may define multi-Caregiver claim/handoff.
5. `class_family_inbox` and `teacher_attention_board` remain locked product capability/view meanings inside the teacher-board experience, but do not create separate action roots or state machines. The single presentation may use different semantic blocks and layouts while one Nurture owner query/policy remains authoritative.

**C-3-3a — collection, detail, protected read, and cross-child operation (LOCKED)**

The views are exact:

| View | Scope and ordering | Surface use |
| --- | --- | --- |
| `current` | Exact CareGroup Items still `open|acknowledged`, their unique active Attention, and any currently entitled body-free temporarily fenced shell. Owner attention priority, oldest pending activity, then Item identity provide stable ordering. | Chat returns at most five owner-prioritized candidates and no cursor. Teacher board returns one owner page plus Attention counts. |
| `recent` | Entries that became `replied|suppressed` or otherwise terminal within the last 30 days, newest business activity first and mutually exclusive with current. | Chat may show at most five safe results; teacher board returns one owner page. |
| `history` | Every retained, currently authorized body-free caregiver-work shell within the C-3-1 fixed 365-day source-entry window, separated by Enrollment episode. | Teacher board only, owner-paginated to completion. Chat offers route-only navigation. |

Teacher-board pages use the C-3-0c maximum of 20. Owner keyset cursors expire within five minutes and bind principal, Workspace, role, CareGroup subject collection, presentation, view, query version, and stable ordering. Pilot supports no text search, client date/child/status filter, compound query, multi-select, offset pagination, client sorting, or local filtering. The older B3 phrase “search historical items” means browse owner-paginated history only. “Today” is derived by Nurture from database time plus the approved Workspace time zone; client `on_date` cannot select business work.

Collections and ordinary detail are body-free. They may contain only the Nurture-safe child label, generic family-question work copy, current progress/availability/tombstone badge, owner timestamp, safe action/navigation offers, and opaque item ref. Guardian identity/contact, family composition, Stage, body/body-derived summary, raw child/Item/Attention/Message/Receipt/Grant/role id, original Grant, internal versions/reasons, another Institution, and hidden action state are forbidden. My-Chat cannot reorder or rank children or caregivers.

The Item/Attention mapping is mechanical:

```text
Item open          <-> Attention active
Item acknowledged  <-> Attention active
Item replied        <-> Attention resolved
source redaction, terminal original-Grant fence,
or pre-reply source-body retention erasure
                   <-> Item/active Attention suppressed
caregiver-reply redaction or reply-body retention erasure
                   <-> Item replied + Attention resolved
```

Presenter reads validate one complete unique graph rather than trusting `Item.status` or an Attention row. Missing, duplicate, cross-Grant, cross-episode, or contradictory Message/Receipt/Event/Attention/reply facts make the complete response generically unavailable and emit body-free integrity evidence; the presenter never returns `partial`, selects `findFirst`, silently omits a corrupted entitled row, or repairs state on read. Unauthorized rows are removed by repository predicates before materialization and cannot leak through counts, tombstones, timing, or errors.

Question plaintext is fetched only through C-3-0e `read_protected_detail` with a fresh `ScenarioProtectedContentRefV1`. Each read rechecks the authenticated Host principal/Workspace, exact Participant/current original Caregiver role where applicable, CareGroup, Enrollment, Thread, Item, original Grant/direction/data class/purpose, source Message/redaction/retention, Institution/CareGroup/policy/capability, and current versions. A ready body is `Cache-Control: no-store`, remains in foreground memory for at most 60 seconds, and is cleared on background, lock, logout, Workspace/surface/item change, invalidation, or renderer mismatch.

Protected detail open is read-only. The read creates no Receipt read, Item acknowledge, CommandExecution, action context, Handoff, or Notification state. The body cannot enter Chat transcript or AI context, semantic presentation, Item/Attention copy, route/URL, browser/PWA/offline/cache/search, clipboard automation/export/print, logs/APM/crash/analytics, Step/Handoff/Outbox/Notification, or another surface. `scenario_protected_ai_draft_v1` remains absent/off: AI may narrate only the body-free owner projection and open a structured detail or empty composer; AI cannot read, summarize, translate, draft, or publish the question/reply body.

**C-3-3b — explicit acknowledge creates the exact Pilot work claim (LOCKED)**

| Product action | Command | Confirmation | Driver |
| --- | --- | --- | --- |
| `acknowledge_family_care_item` | `nurture.family_care.acknowledge_item` | `explicit` | `nurture_direct_empty_v1` |

The earlier B3 phrase “lightweight strong confirmation” means a structured explicit confirmation, not C-3-0d `strong_authorization` or a per-item recent-authentication step-up. The confirmation shows the safe child/Group, “confirm received”, that the family may see an acknowledged state, and that a separate reply is still required. The confirmation does not copy the question, expose the Guardian, or accept natural-language agreement, item open, Notification read, or a default control as confirmation.

Only the exact complete `open(v0)` graph with current source body, original Grant, expected Item version, one eligible Caregiver, active Enrollment/Thread/Group/Institution, and current policy may prepare/commit. One Serializable Nurture transaction atomically:

- changes Item `open(v0) -> acknowledged(v1)`;
- changes the exact source Receipt `delivered(v0) -> acknowledged(v1)`;
- appends one exact `acknowledged` ItemEvent;
- stores database-time `ackedAt`, exact `ackedByParticipantId`, and exact `ackedByRoleAssignmentId`, with `assignedToRoleAssignmentId` bound to the same Pilot work claim;
- leaves the unique Attention row and its `active` state/version unchanged;
- stores typed CommandExecution and explicit `handoffRequestSnapshotsPayload=[]`.

Acknowledge creates no caregiver Message, reply Receipt, protected content, Workflow Step, Handoff, Outbox, Notification, or implicit read. Exact Execution replay returns the original outcome/actor; a later caller or stale button cannot become the acknowledger or produce a second event/version. A newly observed acknowledged Item simply presents current state without advertising acknowledge.

The claim is Pilot-profile work ownership, not a reusable staff assignment protocol. The same exact Participant plus RoleAssignment must later submit the reply, including when moving between Chat and teacher board. Temporary exact-role suspension, Host loss, Enrollment hold, or reversible policy/topology fence leaves Item `acknowledged`, source Receipt acknowledged, and Attention active; every prepared context is invalidated and the same role must fresh-prepare after recovery. Terminal claimant-role loss also leaves those business facts intact but permanently stops the Pilot journey with body-free staffing-review evidence. A new role, Institution Admin, or Operator cannot take over; reassignment/handoff requires a future separately reviewed command. An unclaimed open Item may be acknowledged by a later sole eligible current Caregiver after previous staff offboarding.

**C-3-3c — manual protected reply, original claimed Step, and family seed (LOCKED)**

| Product action | Command | Confirmation | Driver |
| --- | --- | --- | --- |
| `reply_family_care_item` | `nurture.family_care.reply_item` | `explicit` | `workflow_claimed_step_v1` |

Reply is offered only for one complete `acknowledged(v1)` graph to the exact current Participant plus RoleAssignment that owns the acknowledge claim. `open`, `waiting_for_family`, `replied`, `suppressed`, source tombstone/retention erasure, another role, zero/multiple eligible roles, or any stale version is not replyable.

Both surfaces open an empty C-3-0e protected composer: manual normalized 1–2000-character UTF-8 plain text, `attachment_refs=[]`, no AI, and no prefill from the question, Chat transcript, Item summary, prior response, `PublicDraft`, or artifact. The question view and reply draft are separate process-local buffers. The draft does not survive reload/device/surface/account changes; leaving follows explicit `stay|discard_and_navigate`, while C-3-4 owns the actual cross-surface navigation UX.

Prepare owner-derives the exact Item/action/profile, constant generic copy, original Grant, expected versions, and claimant; prepare creates one five-minute encrypted prepared object and submit context but no business fact, Execution, Step, Handoff, or notification. Submit persists a content-free non-claimable Step, immutably binds the Step in Nurture, and only then makes that Step claimable. The local draft clears only after stable Host `accepted/processing`; response uncertainty recovers that same Step/result without resending plaintext.

The original claimed worker transaction atomically consumes the context, commits the same protected object, creates exactly one `caregiver_confirmed/caregiver_reply/sent` Message, changes Item `acknowledged(v1) -> replied(v2)`, appends one replied Event, creates one organization-to-family delivered Receipt, leaves the source Receipt acknowledged, resolves Attention, advances the Thread, stores typed Execution, freezes typed Guardian RoleAssignment audience rows, and persists the byte-equivalent Handoff snapshots. Reply Message, Receipt, Item, Event, audience, and snapshots bind the Item's original Grant; a current/replacement/new matching Grant can never be selected or revive work.

The producer reuses existing `handoff_key=user_attention`, purpose `user_attention`, and the same three source types. For a reply, the source graph is exactly the caregiver reply Message, organization-to-family reply Receipt, and source Item. If no Guardian RoleAssignment is eligible at commit, the claimed action still stores explicit `[]`. Otherwise the action stores one stable logical reply draft and typed Nurture audience rows for the exact Guardian RoleAssignments current at reply commit. The audience is business replay seed, not a My-Chat Notification queue; the seed carries no account/contact/provider/body. Owner resolution at materialize/send/open intersects that commit-time cohort with current eligibility; a later-joining Guardian is never backfilled and a departed Guardian is never delivered. Family-1's two current Guardians therefore receive separate Host deliveries from one logical Handoff without duplicating the business draft/Handoff.

The owner resolver is both producer-origin-aware and direction-aware. My-Chat derives a versioned internal producer origin from the exact persisted Step contract, such as legacy Workflow entrypoint versus `scenario_domain_action_v1:submit_family_care_question|reply_family_care_item`; client/snapshot input cannot assert the origin. The resolver validates that origin against one disjoint exact graph variant instead of guessing from direction/source tuples or aliasing reply to `capture_family_input`. Family-to-organization question sources use their commit-time/current exact Caregiver intersection and teacher-board destination; organization-to-family reply sources use the commit-time/current Guardian intersection and family destination. The resolver cannot use `ThreadParticipant`, Institution Admin membership, current-only relationship lookup without the commit-time bound, or a loose union of both directions. `complete_step` validates/materializes only local refs, hashes, origin, and idempotency in the local transaction; `complete_step` makes no remote owner call. C-3-3 owns the reply seed and an isolated owner-derived recipient delivery plan only; C-3-4 owns Notification creation, provider send/retry rereads, route, deep link, and two-stage open.

`replied` is terminal for Pilot. There is no second reply, edit, correction, clarification, `waiting_for_family`, close, reopen, continued Chat, assignment, or handoff. Exact same-Step replay returns the original Execution and snapshots; wrong/new Step, changed body/context/actor/surface/item/version, or a new reply attempt gets no seed or second effect.

**C-3-3d — reply redaction, body retention, role loss, failures, and races (LOCKED)**

| Product action | Command | Confirmation | Driver |
| --- | --- | --- | --- |
| `redact_family_care_message` | `nurture.family_care.redact_message` | `explicit` | `nurture_direct_empty_v1` |

Caregiver reply redaction is available only when the exact linked reply has `senderParticipantId` equal to the current Participant and `senderRoleAssignmentId` equal to the same still-current original operational Caregiver RoleAssignment reaching the original CareGroup. Redaction also requires expected Message version, retained author shell, current policy, and explicit irreversible copy. Historical RoleAssignment id is an authorship constraint, not client input. Unlike a Guardian's longitudinal family rejoin, staff offboarding/reinvite creates a new role episode and never restores old reply body or redaction authority.

Redaction does not require the original Grant or Enrollment to remain active because redaction is exact author withdrawal, but the action cannot broaden staff scope. The direct transaction crypto-erases only the reply protected content, terminalizes the reply Receipt as `revoked_after_delivery(source_redacted)`, revokes bound reply contexts, stores Execution/audit, and leaves the source question/Receipt, terminal replied Item, replied Event, and resolved Attention unchanged. The transaction creates no Handoff/Outbox/Notification, does not retract an already displayed OS notification, does not suppress/reopen the Item, and never permits another reply or unredact.

Each question and reply body independently expires 30 days from its own Message `createdAt`. Reply expiry produces the same body tombstone with a distinct `retention_expired` audit meaning and does not change replied progress/Attention. If the question body expires before reply, the source becomes permanently unavailable: the highest `sent|acknowledged` progress remains, Item and active Attention are atomically suppressed by the retention/closure worker, and later acknowledge/reply is impossible. Source redaction after a committed reply tombstones the question but retains replied progress and evaluates the reply independently.

Original Grant invalidation removes Caregiver receiver-side question access and Guardian receiver-side reply access, but an exact still-current original Caregiver author may retain their unredacted reply during its own body window under current policy. Replacement/new Grant restores no body or action. Temporary role/Enrollment/policy/owner outage is a reversible read/action fence and never invokes a permanent cascade. Terminal claimant-role loss blocks body/reply/redaction without rewriting the acknowledged Item/active Attention; terminal loss raises owner-safe staffing-review evidence for later Institution operations but grants no takeover.

Every surface uses only `ready|empty|context_changed|unavailable`; owner/database/KMS outage remains generic retryable transport unavailability. Loading/invalidation clears old bodies/actions before fetch. `empty` is valid only after the exact Caregiver/CareGroup owner query proves zero rows. Version drift disables the stale action and fresh-rereads detail. Redacted/retention/revoked rows contain only an entitled tombstone. Wrong principal/Workspace/role/group/item/ref and unauthorized existence are indistinguishable. Offline, cache, legacy internal API, synthetic opaque ref, wider surface, or stale-while-revalidate fallback is forbidden.

The minimum race matrix is acknowledge/acknowledge; acknowledge versus source redaction/revoke/retention/hold/role loss; reply/reply; reply versus source redaction, original-Grant invalidation, claimant suspension/termination, Enrollment/Group/policy change, and context expiry; reply commit versus reply redaction; reply redaction versus retention; zero/one/multiple Caregiver topology; same/wrong Step; and response loss at every post-commit seam. Database time, Serializable isolation, exact versions, deterministic role -> Grant -> Message -> Item -> Receipt -> Event -> Attention -> protected-content locks, unique constraints, and final graph assertions enforce first-commit-wins. Stale losers reread; they never retarget, downgrade the driver, copy a seed, or manufacture attribution.

**C-3-3e — default-off adoption, evidence, and exit (LOCKED / COMPLETE)**

Implementation is additive, ordered, isolated, and default-off:

| Gate | Owner and exact output | Exit condition |
| --- | --- | --- |
| `C33-I0` prerequisite isolation | All three repositories | **Requires `C32-I6`.** The C30/C31/C32 outputs are pinned rather than reimplemented; Nurture decisions are committed; Base is clean; My-Chat uses an isolated worktree. |
| `C33-I1` reusable sources/origin | My-Workflow-Base | Reuse the neutral interface/domain-action/protected-interaction sources and add required strict codecs/validators/fixtures plus a versioned neutral domain-action Step/Handoff producer origin; legacy v1 stays unchanged and Base gains no Nurture key/runtime/database/UI/policy. |
| `C33-I2` Host surfaces/runtime | My-Chat | Exact Base adoption; generic Caregiver Chat panel; teacher-board current/recent/history/detail; protected no-capture read/composer; direct/claimed recovery; action-origin Handoff; persistence/leakage guards; capabilities off and allowlist empty. |
| `C33-I3` owner schema/kernel | The-Nurture | Typed actor/context/Step binding, protected content/KMS, complete Item/Message/Receipt/Event/Attention graph, exact acknowledge claim, typed audience cohort, original-Grant acknowledge/reply/redaction transactions, retention/cascade closure, and capabilities off. |
| `C33-I4` owner presenter | The-Nurture | `caregiver_family_care_work_v1`, exact CareGroup subject collection, current/recent/history/detail/action offers, Attention-as-index behavior, canonical manifest generation/parity, and every role/scope negative. |
| `C33-I5` reply attention seam | My-Chat and Nurture | Existing `user_attention` gains exact action-origin and organization-to-family graph branches, commit-time/current cohort intersection, same-Step/zero-recipient/materialization evidence, and a body-free delivery-plan sink with no live Notification/provider/open behavior. |
| `C33-I6` isolated joint harness | Three repositories | Both surfaces, three child scopes, J1-J4 action pairing, all races/fault/privacy/leakage/legacy negatives, and zero persistent capability/allowlist pass in test-harness-only composition. |
| `C33-I7` evidence pin | Three repositories | Exact commits, named source hashes, Scenario module, Host renderer/protected runtime, Nurture schema-command/attention graph, action-origin/user-attention, crypto and retention identities are pinned. Status may become `DEFAULT-OFF ADOPTED / C-3-4 AND C-3-5 PENDING`, never operational complete. |

Evidence identities remain separate: historical Workflow path/logical-source hashes; `platform_child_family_identity_source_v1`; `scenario_interface_source_v1`; `scenario_domain_action_source_v1`; `scenario_protected_interaction_source_v1`; the four required Host capabilities while `scenario_protected_ai_draft_v1` remains absent/off; Scenario module contract hash; Host Caregiver renderer/composer/protected-runtime revision; `nurture_caregiver_family_care_schema_command_v1`; `nurture_family_care_attention_graph_v1`; `nurture_user_attention_action_origin_v2`; My-Chat `user_attention` owner-consumer revision; protected-content storage/crypto revision; retention-policy revision; KMS configuration class; and exact three-repository commits. One generic contract hash, a local `file:` dependency, or an existing X4/X5 user-attention revision cannot replace them.

Current implementation fails C-3-3. Base/My-Chat have no C-3 shared sources/capabilities, Caregiver semantic renderer, teacher-board product surface, protected composer/read path, recent result shell, or persistence leakage gate. Nurture currently allows Institution Admin/overbroad scopes into Caregiver collections, accepts client `on_date`, emits synthetic refs containing raw ids, may persist body-derived Item/Attention copy, and treats `ThreadParticipant` as authority. Its query lacks current/recent/history graph integrity and owner cursors; reply accepts `open|waiting_for_family`, can select a current `findFirst` Grant rather than the original Grant, has no original-Step Handoff declaration, and lacks exact acknowledge RoleAssignment claim. Redaction accepts client-shaped reason/input and existing dependent cascades can stop at `take:100`. The current `user_attention` resolver understands only the family-to-organization open-Item branch and legacy Handoff-id Notification/deep-link route. Protected aggregate/KMS/retention and typed unique Message/Item/Attention relationships are absent. Legacy Workflow entrypoints/internal APIs and hand-coded registry projection are compatibility scaffolds, not C-3-3 conformance.

C-3-3 conformance must cover both surfaces; exact single-Caregiver group scope and zero/multiple-role drift; three child scopes without cross-group leakage; current/recent/history/detail bounds; empty versus denied/outage; owner database time; complete graph corruption; every protected read/clear/leakage destination; explicit acknowledge without implicit read/Handoff; exact claimant and no takeover; acknowledged-only manual reply; original Grant; claimed binding/same-wrong Step/response loss; reply commit-time Guardian cohort, late-join exclusion, departed-recipient denial, and zero recipient; reply redaction/retention/source-redaction independence; every race and closed UX state; manifest/generated/implementation parity; mixed revisions; capability-off rollback; no legacy fallback; and empty persistent allowlists.

C-3-3 is complete only as a design and implementation-evidence specification. No shared contract, source hash, generated artifact, manifest declaration, handler, schema, migration, KMS key, route, UI, renderer, runtime, Handoff/Notification consumer, capability, allowlist, database, provider, environment, or traffic changed. The following C-3-4 section closes continuity/Notification-open design; C-3-5 owns default-off activation-control qualification and complete Guardian/Caregiver evidence; C-4 owns Institution staffing/topology surfaces and relationship-attention producers.

#### Pilot-0-C3-4 — cross-surface, result, and Notification continuity (DESIGN COMPLETE / IMPLEMENTATION OPEN)

C-3-4 completes the continuity design without creating a second business state machine. Ordinary navigation reuses the locked subject-presentation contract, committed-result recovery reuses the locked domain-action/Execution contract, and protected draft handling reuses the locked protected-interaction contract. The only new shared source is `scenario_notification_continuity_source_v1`, and the only new atomic Host capability is `scenario_notification_continuity_v1`. Notification continuity covers recipient-bound materialization, provider delivery, authenticated open, and destination owner reread as one default-off unit.

| Sub-checkpoint | State | Decision boundary |
| --- | --- | --- |
| C-3-4-0 contract, ownership, and route matrix | **LOCKED** | Reused versus new contracts, exact product route/view pairs, owner separation, and no continuation dual track. |
| C-3-4a draft and ordinary cross-surface behavior | **LOCKED** | `stay|discard_and_navigate`, process-local protected state, route/view-only movement, and no implicit action. |
| C-3-4b committed-result and response-loss recovery | **LOCKED** | Direct/claimed recovery, content-free Host progress, destination owner reread, and no result carrier. |
| C-3-4c recipient binding and Notification materialization | **LOCKED** | Commit cohort/current eligibility, typed Notification-to-Handoff source link, fanout idempotency, and Handoff completion. |
| C-3-4d provider delivery and retry | **LOCKED** | Pre-attempt owner reread, lease/reclaim/backoff/dead-letter, provider uncertainty, and technical/business-state separation. |
| C-3-4e authenticated open, stale/offline, and retention | **LOCKED** | Notification-id indirection, workspace switch, two-stage owner read, destination token, current visibility, leakage, and expiry. |
| C-3-4f default-off adoption, conformance, and exit | **LOCKED / COMPLETE** | Base -> My-Chat -> Nurture adoption, legacy segregation, isolated evidence, blockers, and C-3-5/C-4 boundaries. |

**C-3-4-0 — contract, ownership, and route matrix (LOCKED)**

The source/capability split is exact:

1. `scenario_interface_source_v1` continues to own `ScenarioNavigationOfferV1`, registered product surfaces, `route_class`, and `current|recent|history`. `scenario_domain_action_source_v1` continues to own direct/claimed result recovery. `scenario_protected_interaction_source_v1` continues to own local drafts and protected views. Their hashes do not change merely to claim C-3-4.
2. `scenario_notification_continuity_source_v1` adds neutral strict types/codecs for `ScenarioNotificationContinuityContractV1`, server-only recipient binding, delivery plan/check results, authenticated open, destination navigation, and a signed service owner-read invocation. Base contains no Notification database, provider, URL, Nurture route value, business reason, or retry policy.
3. `scenario_notification_continuity_v1` requires `workflow_handoff_materialization_v1`, `trusted_scenario_invocation_v1`, and `scenario_subject_presentation_v1`. A binding declares any additional destination capability dependency. Nurture `user_attention` requires the protected destination gate when a protected body may be opened; `guardian_relationship_attention` remains body-free. C-3-5 qualifies the complete atomic C-3 profile while false/empty; only Pilot-2 may later activate the approved complete set.
4. The additive manifest area `notification_continuity` binds a unique `continuity_key`, existing Handoff key/purpose, exact delivery-plan/delivery-check/open operation keys, owner resolver keys, recipient-binding schema, and allowlisted route/view/product-surface tuples. `user_attention` and `guardian_relationship_attention` remain separate declarations. Unknown, duplicate, partial, mixed-hash, unimplemented, or undeclared tuples are fatal.
5. Background delivery owner reads use a new signed, exact-body, nonce-protected service invocation restricted to delivery plan/check. The service invocation carries no `ScenarioHumanPrincipalV1`, creates no Participant business actor, and has no command/presentation/open authority. Interactive open continues to use `my-chat-api + interactive_session + host_transition/notification_open`. The legacy static bearer is not a vNext authenticator or fallback.

The product route registry is distinct from the C-3-0c subject-context class `subject_detail|subject_collection`. C-3-4 registers `nurture_chat|family_board|family_workbench|teacher_board` as product route classes; `teacher_attention_board` is a legacy capability/view name, not a product route. Institution routes and producers remain C-4.

| Intent/source | Exact destination |
| --- | --- |
| Guardian action executable in Chat/board/workbench | Remain in that surface. |
| Guardian Chat -> fuller current/recent list | `family_board/current|recent`. |
| Guardian complex Grant/Enrollment/Stage review | `family_workbench/current`. |
| Guardian complete retained history | `family_workbench/history`. |
| Newly submitted/sent family question, if the user chooses to navigate before terminal reply/suppression | `family_board/current`; a replied/suppressed terminal entry uses `family_board/recent`. |
| Caregiver action executable in Chat | Remain in `nurture_chat`. |
| Caregiver queue/detail/history | `teacher_board/current|recent|history`. |
| Caregiver teacher-board acknowledge -> Chat reply | `nurture_chat/current`; Chat owner-rereads the claimant's acknowledged candidates and asks the user to select again if more than one is current. |
| Caregiver acknowledge followed by board view | `teacher_board/current`; reply followed by board view is `teacher_board/recent`. |
| `user_attention` family question | `teacher_board/current`. |
| `user_attention` caregiver reply | `family_board/recent`, with a current owner offer to `family_workbench/history` if needed. |
| `guardian_relationship_attention/review_enrollment_transfer` | `family_workbench/current`; producer remains C-4. |
| `guardian_relationship_attention/enrollment_relationship_changed` | `family_workbench/history`; C-3-2 withdrawal is the only C-3 producer. |

The table fixes the normal initial landing. The open resolver may choose only another allowlisted view for the same role route when current lifecycle has advanced—for example, a replied family question may enter `teacher_board/recent` instead of restoring current work. The resolver cannot change role surface, infer a new target, or restore an old action.

Notification never lands directly in Chat because Chat conversation binding and role selection are not Notification authority. Host invitation preview/acceptance remains a separate invitation lane even if a generic Host Notification shell is reused. Pilot ordinary Guardian/Caregiver navigation carries exactly `route_class + view_mode`; `continuation_ref` is absent. Presentation item/cursor/action refs, InteractionContext, token, Execution/output refs, Step/Handoff ids, scroll/filter/search state, business ids, and bodies do not cross surfaces.

**C-3-4a — protected draft and ordinary cross-surface behavior (LOCKED)**

1. A controllable departure from a non-empty protected composer, including a drawer/back action, navigation offer, surface switch, or Notification tap, first presents exactly `stay|discard_and_navigate` before a Notification is marked read or any owner open call occurs.
2. `stay` cancels navigation and preserves only the current foreground process-local draft. A tapped Notification remains unread and can be reopened from the inbox.
3. `discard_and_navigate` clears draft plaintext and every protected view before routing, then best-effort revokes prepared content/context. Lost cleanup is fenced by the existing five-minute authority and wrapped-key cleanup no later than fifteen minutes after expiry.
4. Background, device lock, logout, account/Workspace/Participant/subject change, external or uncontrolled surface replacement, capability disable, renderer mismatch, reload, crash, or process loss is non-negotiable invalidation: local draft/view memory clears and there is no recovery promise. A user-controlled surface navigation remains governed by C-3-4a-1 and cannot bypass `stay|discard_and_navigate`.
5. Ordinary Chat transcript/draft, `PublicDraft`, Workflow artifact draft, Notification, URL/history, local/session storage, IndexedDB/PWA cache, analytics, and another device/surface cannot store or reconstruct the protected draft. Pilot protected AI remains absent/off.
6. Navigation remains read-only. The destination authenticates and rereads current owner facts before rendering, and never acknowledges, confirms, submits, cancels, revokes, redacts, retries, or repeats a command merely because the user moved surfaces.

**C-3-4b — committed-result and response-loss recovery (LOCKED)**

Committed continuity follows the original owner evidence:

1. A direct action clears protected input only after canonical Host progress `completed`; response loss finds the same `CommandExecution` before consumed/expired rejection. A claimed action clears after the original content-free Step reaches stable Host `accepted`; “processing” is display copy, not a second persisted progress state. The original Step then reaches `completed` through same-Step replay/materialization.
2. Binding-response loss resumes the same non-claimable/bound Step without plaintext or a raw submit token. Nurture-response loss reclaims the same Step and returns the original Execution/snapshots. `complete_step` response loss returns the existing Step/Handoff/Outbox. Wrong/new Step or changed immutable input cannot recover or copy the effect/seed.
3. A durable Host rehydration shell may store only Host provenance, scenario/action/driver contract, technical progress/version, source product surface, registered presentation/route/view intent, renderer revision, and `rehydrate_required`. The shell stores no Nurture target/ref/version/body/summary, InteractionContext, output ref, snapshot, Handoff draft, business result, or inferred owner state.
4. Source UI may show content-free “accepted; checking current result”. Only a current Nurture presenter can show `changed|already_current|processed_but_unavailable`. Handoff, Notification, provider, or queue state never proves a business result.
5. Another surface carries no `open_result` token, Execution/output ref, Step/Handoff id, command identity, or result copy. The destination loads `current|recent|history` through the role-correct owner presenter. If permission or owner availability changed after commit, the destination shows a generic accepted/current-unavailable shell, not stale result content or a second command.
6. After process loss, a user who no longer has the exact command recovery evidence receives only ordinary current presentation. The product does not expose whether an inaccessible old command existed.

**C-3-4c — recipient binding and Notification materialization (LOCKED)**

The recipient chain is `immutable commit cohort -> current Nurture exact eligibility -> current My-Chat User/Workspace membership -> current capability/cohort gate`. ThreadParticipant, ambient Institution Admin membership, Lead designation without the operational Caregiver role, device ownership, Handoff, Notification, provider state, and a newly issued RoleAssignment are never authority.

1. `resolve_notification_delivery_plan_v1` validates the exact action-origin/direction/source graph and returns the complete immutable commit cohort as a bounded unique set of owner-issued opaque recipient bindings, Host account refs, generic localized copy, and one non-sliding open horizon. Delivery plan returns no selected route/view, business body, provider/device data, or mutable current-only audience. Pilot fanout is at most two candidates; current route/view is selected only by `resolve_notification_open_v1` inside the binding's manifest allowlist.
2. My-Chat first persists a body-free `WorkflowNotificationMaterializationCandidate` plan for every commit-cohort member. Each row binds Handoff, Workspace, continuity key, recipient User, opaque recipient-binding ref/hash, open horizon, canonical plan/intent hash, and `materialization_status=pending|materialized|skipped`; a materialized row points to its typed Notification source link, while a skipped row stores only a closed technical reason class. The complete ordered candidate-set hash is immutable. Same unique identity with changed candidates, binding, copy, horizon, contract, or allowlist hash is an integrity conflict, not a new plan.
3. Before a `pending` candidate is materialized, My-Chat performs exact-recipient `resolve_notification_delivery_check_v1(checkpoint=create)` plus current Host membership/gates. Zero/multiple Participant or account paths and permanent departure/new-role/terminal source fences become terminal `skipped`. A known temporary same-role Hold/suspension or transient owner/transport failure remains `pending` with bounded retry until recovery or the original horizon; horizon expiry settles `skipped`. Late joiners never enter the immutable plan.
4. My-Chat adds a typed, server-only `WorkflowNotificationHandoffSource` (or equivalently named) relation with required Notification, Workspace, recipient User, Workflow Handoff, continuity key, opaque recipient-binding ref/hash, open-horizon time, continuity contract version/hash, source/manifest-allowlist hash, generic-copy hash, canonical intent hash, and timestamp. `notificationId` is unique, Workspace/recipient must equal the linked Notification, and workspace-bound foreign keys plus unique `(workspaceId, workflowHandoffId, recipientUserId, continuityKey)` make the relation the sole vNext send/open authority. The link stores no selected route/view; open chooses a current allowlisted pair.
5. Add My-Chat-owned `source_binding_kind=legacy_target_v0|workflow_handoff_continuity_v1` (or an exactly equivalent closed discriminator) to Notification. Existing rows are explicitly backfilled/created as `legacy_target_v0`; vNext rows require `workflow_handoff_continuity_v1`, an empty generic target, and one matching typed source link. Link presence, null target, Notification type, or handler success cannot be used as a heuristic discriminator. The two kinds never dual-read or fallback.
6. One My-Chat local transaction creates the generic Notification, typed source link, initial delivery work, refs-only Outbox, and changes the exact candidate `pending -> materialized`. Another local transaction terminalizes a deterministic candidate `pending -> skipped`. One logical Handoff may create two recipient Notifications for the two-Guardian family; the Handoff never creates two Nurture seeds or Handoffs.
7. Settlement is exact. A command-time cohort of zero stores Nurture snapshots `[]` and creates no Handoff. For an existing non-empty Handoff, any `pending` candidate keeps the Handoff `requested`; all `skipped` with zero materialized Notifications yields `stopped`; at least one `materialized` and all remaining candidates terminal yields `completed` with explicit link/count/skipped evidence; contract/plan/hash integrity failure yields `failed`. A partially materialized plan cannot complete while a temporary candidate remains pending.
8. Response-loss recovery rereads the immutable candidate plan and existing typed links. Only a truly pending candidate may retry. A terminal `skipped` candidate never creates a Notification or receives a later push after role recovery; recovery can only reopen an already materialized Notification for the same exact role within the original horizon. `completed` means logical materialization settled, not provider delivery.
9. A `requested` Handoff may be opened only through an already committed exact-recipient typed Notification link while other candidates or the Handoff receipt remain pending. Arbitrary requested Handoff ids are not openable. `stopped|failed` never revive.
10. No cross-database transaction is attempted. Owner eligibility may change between the remote owner read and local Notification commit, so a generic row may exist after a concurrent revoke. Provider-send, open, and destination rereads are the privacy fences; the product does not claim the impossible guarantee that no generic row can be created after every cross-database race.

The client list/write DTO for a Nurture vNext Notification is strictly Notification id/type, `unread|read|archived`, generic title/body, generic deep link, read time, and created/updated time as needed. The DTO excludes Workspace/User/Actor, target type/id, Handoff, metadata, aggregate version, owner reason, source ref, and business state.

**C-3-4d — provider delivery and retry (LOCKED)**

1. Before each irreversible provider attempt, My-Chat rereads the typed source link and `requested|completed` Handoff, rechecks current membership/gates, and invokes `resolve_notification_delivery_check_v1(checkpoint=send)` for the exact bound recipient. Permanent/current-terminal stop becomes technical `skipped`; a known temporary same-role fence or owner/transport outage sends nothing and remains `retry_wait` until recovery or the original horizon. Once delivery becomes `skipped`, later recovery never backfills the push.
2. Delivery uses additive lease expiry, same-delivery reclaim, attempt count, `nextAttemptAt`, bounded versioned backoff, terminal provider classification, and dead-letter evidence. Retry never exceeds the earliest Handoff/source/open-horizon/allowlist expiry. Policy values are Host-owned, tested, and pinned; Base does not prescribe a provider or backoff.
3. Active device registrations are transport destinations, not authority. Each target is attempted/retried independently through an opaque registration ref; no raw push token is copied into jobs, attempts, logs, traces, metrics, errors, support exports, or Nurture. Devices registered after the initial fanout are not retroactively pushed; the server inbox remains canonical.
4. Provider payload contains only `notification_id`, `morethan://notifications/{notification_id}/open`, generic safe title/body, and provider-required technical fields. The payload contains no Handoff/target/reason/route/scenario token, Nurture ref/id/status/action, child/family/Institution/Group/role, body-derived copy, or source direction.
5. A stable per-Notification/per-device provider request key is reused after response uncertainty when supported. If the provider cannot provide exactly-once semantics, duplicate generic arrival signals are admissible; they cannot create another logical Notification, Handoff, Receipt, Item, Message, Execution, or business effect.
6. Provider response `provider_outcome=sent|retryable_failed|terminal_failed|unknown`, technical delivery `WorkflowNotificationDelivery.delivery_status=pending|leased|retry_wait|sent|skipped|dead_letter`, candidate `materialization_status`, Host Notification read state, Handoff lifecycle, and Nurture Receipt/Item/Message lifecycle remain separate. The shared literal `skipped` is namespaced by its owning field and MUST NOT be mapped from candidate materialization to provider delivery or vice versa; none of these state machines is translated into another.

**C-3-4e — authenticated open, current visibility, offline, and retention (LOCKED)**

The reusable Host endpoint is `POST /workflow-notifications/{notification_id}/open`; the external route is exactly `morethan://notifications/{notification_id}/open`. Opening proceeds as follows:

1. If a protected draft is non-empty, C-3-4a resolves stay/discard before the endpoint. An unauthenticated tap stores only the Notification id in the Host sign-in continuation and makes zero Nurture calls.
2. My-Chat authenticates User/Actor and performs an exact global `Notification id + recipient User` lookup. The Notification's own Workspace binding wins over personal/current/recent workspace defaults. If the same user must switch Workspace, My-Chat requires an explicit Host switch and repeats exact membership/gate validation; Workspace never enters the external deep link/client route and Nurture never enumerates Workspace candidates.
3. Wrong user, Workspace, id, guessed/legacy source, or missing typed link returns indistinguishable generic unavailable and makes zero Ledger/Nurture calls. After exact validation, one local transaction idempotently marks only the Host Notification read and loads its typed source link. Ready, stale, unavailable, and later owner-outage outcomes all count as Host open; manual unread remains separate and changes no Nurture fact.
4. My-Chat rereads the exact Handoff. Only `requested|completed` under C-3-4c may continue. My-Chat then signs a fresh `my-chat-api + interactive_session + host_transition/notification_open` invocation; raw client Notification id is Host evidence, not Nurture echo.
5. `resolve_notification_open_v1` rebinds the current Participant and exact historical audience RoleAssignment, then rereads current subject reach, surface, Enrollment/Grant/policy, source lifecycle, shell visibility, protected visibility, and action availability. The open resolver is a separate operation/predicate from delivery and may route acknowledged/replied/closed work to current detail/history without restoring an old delivery predicate or button.
6. Ready issues one new Nurture `open_notification` InteractionContext in an owner transaction. The hash-only token state has typed source/dependency refs, versions, exact Participant, destination product surface, purpose, and expiry; the context contains no body/preview/policy decision, Notification/device/provider state, or mutable JSON authority. Expiry is the earliest of issue plus seven days, the original non-sliding Notification/Handoff/source horizon, and the Pilot gate expiry.
7. Public output is only `ready {route_class, view_mode, scenario_token, expires_at}` or generic `unavailable` or `retryable`. Raw token is returned once, stripped of context id/internal reason, and retained only in current foreground navigation memory. The already validated Notification id may remain beside the token as Host-only foreground orchestration evidence; Notification id is never forwarded as Nurture echo. The token never enters URL/history, local/session/IndexedDB/PWA/cache, Chat, Notification, provider, analytics, logs/APM/crash/support, or native-to-web transfer.
8. The destination coordinator revalidates the foreground Notification id, typed source link, Handoff, session, Workspace, and gates; classifies only the raw token through a new strict notification-destination echo; establishes a fresh product-surface invocation; and performs a second Nurture owner presenter/protected read. The seven-day token is a locator, not protected/action authority; destination item/action refs still expire within five minutes and protected views within sixty seconds. Open creates no Receipt read, Item acknowledge, Message, Execution, command, or implicit action.
9. Repeat and same-account multi-device opens issue independent current tokens. A new open never extends an old context or transfers ownership. Process loss, cross-native/web movement, or cleared/expired token returns through the Notification id and the complete open sequence.

Visibility is layered rather than inferred from one status:

| Current condition | Safe open result |
| --- | --- |
| Exact historical recipient role episode remains current/reachable and complete current facts permit detail | Ready to the locked route/view, followed by fresh owner detail/action checks. |
| Item acknowledged/replied/closed but shell/history remains authorized | Ready to current/recent/history; no stale action or earlier body copy. |
| Grant/source/body retention/redaction/withdrawal removed protected/action access but the same recipient episode retains owner-safe shell access | Ready only to an owner-approved body-free tombstone/history. |
| Historical role episode ended, a new RoleAssignment/rejoin exists, Participant/account mapping is ambiguous, or subject reach is gone | Unavailable; ordinary role history may be queried separately, but the old Notification is not inherited. |
| Same exact role is temporarily suspended/held and later restored | Unavailable while fenced; a fresh open may work after recovery only before the original horizon. No skipped push is backfilled. |
| Handoff stopped/failed, continuity capability/gate disabled, token expired, or open horizon ended | Unavailable; no route token or legacy fallback. |
| Owner/database/KMS/private-verifier unavailable | Retryable generic shell; old body/action is cleared and no stale-while-revalidate path exists. |
| Offline | Generic OS signal or current in-memory Host shell only; no durable offline inbox, mark-read, owner open, route token, protected view, or action. |

Source/Grant/role/policy invalidation racing token issuance may leave only a locator; destination reread wins and returns current tombstone/unavailable. A provider notification already displayed by the operating system cannot be recalled, so copy remains safe after every lifecycle change.

The original Nurture Notification open horizon is non-sliding and at most seven days. After that, users use ordinary role surfaces for current authorized history. A generic Nurture Host Notification is archived or removed no later than ninety days and cannot become a parallel business-history store. Provider/ordinary operational attempt detail follows the locked fourteen-day log class; de-identified metrics may remain ninety days. Handoff/business/security evidence retains its owning policy and never stores protected content merely to support Notification history.

**C-3-4f — default-off adoption, conformance, and exit (LOCKED / COMPLETE)**

Implementation is additive, ordered, isolated, and default-off:

| Gate | Owner and exact output | Exit condition |
| --- | --- | --- |
| `C34-I0` prerequisites/isolation | All three repositories | **Requires `C33-I7`.** C30/C31/C32/C33 default-off outputs and docs are committed and pinned rather than recreated; Base is clean; My-Chat uses an isolated worktree because its main worktree contains unrelated deployment changes. |
| `C34-I1` neutral source/capability | My-Workflow-Base | `scenario_notification_continuity_source_v1`, capability/dependencies, manifest/codecs/validators, owner-read service envelope, legacy/vNext/negative fixtures, and portable hash; no runtime/database/provider/Nurture route. |
| `C34-I2` route/draft/result shell | My-Chat | Exact route/view registry, protected draft guard, content-free direct/claimed rehydration shell, destination current presenter wiring, and no result/continuation carrier. |
| `C34-I3` typed Notification kernel and owner-read client | My-Chat | Immutable per-candidate plan/outcome ledger, typed Handoff source link with canonical intent hash/horizon, closed source-kind discriminator, recipient-safe DTO, Notification-id deep link/open route, local materialization/reconciliation transaction, and the exact-body signed non-human owner-read caller/signer with independent credentials/key domain, nonce, retry, rotation, and no fallback. |
| `C34-I4` owner operations/token | The-Nurture | Separate delivery plan/check/open resolvers, signed service verifier, interactive verifier reuse, typed commit cohort/origin graphs, destination map, open context/dependencies, retention cleanup, and no legacy fallback. |
| `C34-I5` provider reliability | My-Chat | Pre-attempt owner check, per-target lease/reclaim, bounded backoff/dead-letter, stable provider request identity, sanitized payload/attempt evidence, and provider response-loss handling. |
| `C34-I6` privacy/noninterference | My-Chat and Nurture | DTO/outbox/queue/provider/deep-link/log/APM/cache/PWA/crash/support/token/device-secret inventory proves zero forbidden fields and no Host-open mutation of Nurture business state. |
| `C34-I7` isolated joint harness | Three repositories | Two isolated databases prove both `user_attention` directions plus C-3-2 withdrawal `guardian_relationship_attention`, every route/draft/result/open/fault/race case, and only contract-negative fixtures for C-4 producers. |
| `C34-I8` evidence pin/default-off | Three repositories | Exact source hashes/commits/schema/runtime/route/resolver/provider/privacy/retention identities, candidate-plan/source-kind revisions, owner-read caller/signer/authenticator/key-domain/nonce revisions, empty openable-legacy-row preflight, capability false, allowlist empty, rollback, and no mutable local dependency are recorded. Status may become `DEFAULT-OFF ADOPTED / C-3-5 VERIFICATION PENDING`. |

Evidence identities remain separate: historical Workflow hashes; `platform_child_family_identity_source_v1`; `scenario_interface_source_v1`; `scenario_domain_action_source_v1`; `scenario_protected_interaction_source_v1`; new `scenario_notification_continuity_source_v1`; canonical/generated manifest hash; Scenario module; Host renderer/protected/result runtime; candidate-plan and typed source-link schema/repositories; Notification source-kind/DTO/open route; delivery lease/retry/provider adapter; route registry; owner-read caller/signer/authenticator/key-domain/nonce revision; service/interactive verifier; Nurture delivery/open resolver; InteractionContext/dependency/token codec; privacy/retention policy; exact commits; capability false; allowlist empty; legacy-row census; and C-4 producer-absent evidence. One generic contract hash or mutable `file:|link:` dependency cannot replace them.

Current implementation fails C-3-4. Base has only the handoff-era capability and no notification-continuity source/manifest. My-Chat exposes Workspace/User/Actor/target/Handoff through Notification DTOs, persists Handoff-id target/deep-link/metadata, opens by Handoff id, sends target/reason to the provider, and has no candidate outcome ledger, typed source link/canonical intent, source-kind discriminator, route registry, draft guard, result shell, signed owner-read caller, pre-send owner read, lease reclaim/backoff/dead-letter, or two-stage token open. Nurture has one static-bearer resolver with optional actor, one family-to-organization/open-Item predicate, broad Admin/Lead/ThreadParticipant/current-only recipients, no action-origin/reply/relationship branch, no signed service owner-read boundary, and no destination-bound typed open context. These are blockers, not legacy compatibility evidence.

Legacy manifests continue to compile and persisted legacy rows may run only through their explicit legacy discriminator before vNext activation. A vNext declaration is all-or-fatal. Missing/mismatched source hash, capability, dependency, route, verifier, resolver, typed link, schema, or handler fails closed without falling back to the old static bearer, `/workflow-handoffs/:handoff_id/...`, Handoff-id deep link, generic target, `capture_family_input`, or a legacy presenter.

C-3-4 conformance must cover every route/view pairing and absent ordinary continuation; draft stay/discard/background/reload/account/device/surface cases; direct/claimed failure at prepare/bind/execute/complete boundaries; same/wrong-Step and one business effect; zero/one/two recipient fanout, partial create/replay, late join/depart/new role/suspend/resume/ambiguous mappings; create/send/open fences for Grant, Enrollment, role, source redaction/retention, Item lifecycle, policy, capability, and allowlist; requested/completed/stopped/failed Handoff; provider lease/reclaim/backoff/dead-letter/response loss/duplicate generic push/zero-one-many devices; exact recipient/workspace/resource binding; sign-in/workspace switch; read/unread/repeat/multi-device; destination second reread; token expiry/leakage; offline; legacy/mixed-revision/no-fallback; and kill-switch rollback. Wrong recipient/workspace/id must prove zero Handoff/Nurture calls, and open must prove zero Receipt/Item/Message/Execution mutation.

C-3-4 is complete only as a design and implementation-evidence specification. No contract/source, manifest, schema, migration, route, UI, renderer, runtime, typed link, resolver, token codec, provider policy, capability, allowlist, database, secret, environment, or traffic changed. C-3-5 is next and owns complete Guardian authority plus rendered J1-J4 evidence, persistent activation-control implementation with final false/empty state, component-candidate pins, rollback rehearsal, and C-3 qualification. C-4 owns Institution surfaces, staffing/topology, Enrollment/staff invitation, transfer proposal/cancel, service close, and their relationship-attention producers; Pilot-0-D/E retain Pilot Go/No-Go.

#### Pilot-0-C3-5 — default-off qualification, complete evidence, and C-3 exit (DESIGN COMPLETE / IMPLEMENTATION OPEN)

C-3-5 closes how the C-3-0 through C-3-4 implementations may become one immutable, default-off Guardian/Caregiver component candidate. The checkpoint does not add another shared business contract, activate a Workspace, publish a Pilot artifact, or make a Pilot Go decision. The phrases “persistent activation” and “persistent allowlist” are narrowed here to **persistent activation-control implementation plus default-deny evidence**. A non-empty environment/Workspace activation remains exclusively Pilot-2 after Pilot-0-D/E and Pilot-1 receive separate authorization.

| Sub-checkpoint | State | Decision boundary |
| --- | --- | --- |
| C-3-5-0 scope, state vocabulary, and C-4 boundary | **LOCKED** | Component qualification only, exact status names, no Pilot/C-4 overclaim, and current implementation blockers. |
| C-3-5a cumulative adoption and implementation graph | **LOCKED** | Define and consume every C30/C31/C32/C33/C34 implementation node once, converge three repositories before the dependency freeze, and reject partial/mixed/legacy paths. |
| C-3-5b immutable component candidate and evidence envelope | **LOCKED** | Non-circular component-candidate and qualification-envelope identities, artifact provenance, append-only body-free evidence, invalidation, and supersession. |
| C-3-5c positive-only persistent activation control | **LOCKED** | Exact environment bundle plus typed Workspace/release-candidate/deployment row, seam-specific rereads, disable-only operator boundary, final false/empty state, and Pilot-2 separation. |
| C-3-5d complete automated/rendered/manual evidence | **LOCKED** | Separate C-3-2 authority strand, J1-J4, three child scopes, every action/surface cell, one exact candidate, safe manual evidence, and C-4 fixture boundary. |
| C-3-5e fault, privacy, KMS, and rollback evidence | **LOCKED** | Three-run high-risk matrix, zero-copy inventory, cross-database races, post-commit Step closure, and non-destructive kill switch. |
| C-3-5f qualification, invalidation, and exit | **LOCKED / COMPLETE** | `C3_QUALIFIED_DEFAULT_OFF / C4_PENDING / EXTERNAL_TRAFFIC_NO_GO`, exact requalification triggers, and handoff to C-4/Pilot-0-D/E. |

**C-3-5-0 — scope, status, and C-4 boundary (LOCKED)**

1. The current repositories contain no C-3 shared sources/capabilities, complete Host/scenario surfaces, protected KMS path, typed Notification candidate/link kernel, signed delivery owner-read path, Workspace activation row, or component-candidate evidence. My-Chat has only the environment-global X4 Handoff flag and no exact Workspace allowlist. Current status is therefore `DESIGN COMPLETE / IMPLEMENTATION OPEN`, not an assembling candidate.
2. A C-3-1 through C-3-4 implementation may first reach `DEFAULT-OFF ADOPTED / C-3-5 VERIFICATION PENDING` only after its exact implementation nodes and evidence pass with persistent gates false/empty. C-3 reaches `C3_QUALIFIED_DEFAULT_OFF / C4_PENDING / EXTERNAL_TRAFFIC_NO_GO` only after every C35-I0..I10 gate passes on one candidate.
3. `qualified_default_off` means the Guardian/Caregiver slice is implemented and reproducibly verified while inaccessible to persistent users; the status does not mean `activated`, `pilot ready`, `Pilot-1 eligible`, `operational complete`, `Go`, or approved for external traffic.
4. C-4 remains the owner of Institution board/workbench, Institution/CareGroup/staff provisioning surfaces, staff invitation/acceptance and role assignment UX, Institution-side Enrollment initiation, transfer proposal/cancel, service-close, Institution cohort-disable action, and their relationship-attention producers. Those capabilities remain absent or contract-negative in a C-3 component candidate.
5. C-3 may qualify before C-4 only for an established synthetic topology. C-4 prerequisite facts may be seeded by an isolated versioned fixture for setup, but fixture/Prisma setup is never Institution product evidence. Guardian/Caregiver business steps in the evidence journeys must use the real authenticated C-3 owner paths.
6. The C-3-2 family-withdrawal `guardian_relationship_attention` producer/consumer/open path is real C-3 evidence. A transfer-review fixture may prove the Guardian consumer contract but cannot prove the C-4 producer or Institution journey.
7. Terminal loss of the exact caregiver claimant intentionally leaves the acknowledged Item plus active Attention as body-free staffing-review evidence; C-3 provides no takeover or reassignment. C-4-4 now locks the separate Institution-authorized operational closure, while the immutable C-3 component itself continues to prove only the fail-closed blocked state and MUST NOT auto-reassign, suppress, close, or expose the protected body.

**C-3-5a — cumulative adoption and implementation graph (LOCKED)**

C-3-5 consumes the earlier implementation nodes by immutable reference rather than copying or weakening their exits:

The implementation DAG is strict: `C30-I0..I4 -> C31-I0..I5 -> C32-I0..I6 -> C33-I0..I7 -> C34-I0..I8 -> C35-I0..I10`. Nodes within a repository may land in one ordered release series, but their inputs, outputs, tests, commits, and evidence remain separately attributable. A later node may add a new slice; the later node cannot recreate or fork an earlier shared contract/runtime/owner baseline. `C35-I1` is the one additive Base convergence revision that consumes the earlier source increments and adds admission/status/qualification governance contracts; C35-I1 is not a duplicate C30/C31 implementation.

The previously design-complete C-3-0 baseline has the following machine-gateable implementation ledger; these nodes implement C-3-0b/c/d/e rather than creating a fifth semantic track:

| Gate | Owner | Exact output and exit |
| --- | --- | --- |
| `C30-I0` baseline isolation | Three repositories | Decision docs are committed, Base starts clean, My-Chat uses an isolated worktree, tracked gates remain false/empty, and no mutable local dependency is accepted as evidence. |
| `C30-I1` neutral shared contracts | My-Workflow-Base | Additive trusted-principal/ingress, canonical-object scenario-binding envelope, subject-presentation, domain-action, and protected-interaction contracts, strict codecs, validators, fixtures, atomic dependency rules, and separately named neutral source identities pass legacy plus vNext conformance without platform Child/Family semantics, runtime, database, or Nurture values. |
| `C30-I2` generic Host adoption | My-Chat | Public/private ingress, principal signer/nonce verification evidence, completed platform Child/Family identity and binding owner APIs, subject provider/presentation registry, renderer/navigation, direct/claimed action orchestration, protected composer/read runtime, leakage/cache/offline controls, and atomic default-off capabilities adopt the exact Base revision with no legacy fallback. The schema-only `db22de6` target cannot satisfy this gate. |
| `C30-I3` scenario-owner adoption | The-Nurture | Canonical/generated manifest parity, principal verifier and Participant binding, non-authoritative platform binding anchors/local associations, subject provider, presenters, authenticated action preparation/handlers, typed actor evidence, encrypted protected-content/KMS/retention lifecycle, and owner rereads adopt the same revisions without Host-runtime or platform-identity ownership. |
| `C30-I4` baseline joint conformance | Three repositories | Exact source/commit/schema/registry/security identities, mixed/legacy/partial-capability negatives, two-database trust/action/protected-data faults, privacy scans, rollback, and current-gap detection pass while environment capability and active Workspace rows remain false/empty. |

| Gate | Owner | Exact output and exit |
| --- | --- | --- |
| `C35-I0` implementation isolation/preflight | Three repositories | **Requires `C34-I8`.** Approved decision docs are committed; every C30/C31/C32/C33/C34 output is referenced by immutable evidence; Base is clean; My-Chat uses an isolated worktree while its main worktree has unrelated deployment changes; planned source, schema, migration, artifact, evidence-store, and disposable-environment owners are recorded; tracked gates remain false/empty. |
| `C35-I1` Base convergence | My-Workflow-Base | Consumes all earlier neutral source increments into one additive package revision and adds `scenario_activation_admission_source_v1` admission/status-lookup, `c3_evidence_run_authorization_v1`, and qualification-envelope/event/current-state contracts, strict codecs, validators, and legacy-negative fixtures. Historical and six new named source hashes remain separate; there is no source fork, runtime, database, provider, Nurture value, or mutable local dependency. |
| `C35-I2` Host convergence | My-Chat | Exact Base adoption plus public/private ingress, completed platform Child/Family identity repositories/APIs/scoped privacy and pair-binding recovery, renderer/navigation, direct/claimed orchestration, protected runtime, invitation continuation, typed Notification/provider/open, Technical Admin restrictions, positive-only activation control, admission persistence/issuer, attempt quarantine, and Step/direct no-effect closure. Schema/migrations and identity/binding/route/capability/action/renderer/provider/admission registries have separate identities; every C-3 route remains default-off. |
| `C35-I3` owner convergence | The-Nurture | Exact Base and My-Chat revisions plus canonical/generated manifest parity, body-free platform anchors/local association, typed actor/relationship/communication/attention/protected schemas, commands/presenters/resolvers, signed verifiers, admission verifier and exact execution-status lookup, KMS/retention, and lifecycle cascades. No platform identity authority, raw cross-workspace lookup, mutable `file:|link:` dependency, dev-host runtime table, Host queue, lease, Handoff Ledger, or legacy fallback enters the owner package/database. |
| `C35-I4` final dependency freeze | Three repositories | Every C30/C31/C32/C33/C34 node and C35-I1..I3 output is implemented, default-off, committed, and referenced by exact code/schema/test identity. The one frozen ledger is created only after all C-3 code, activation-control schema, migrations, registries, and test plans converge; any later tuple change invalidates I4 and downstream evidence. |
| `C35-I5` component artifact assembly | Three repositories | A locally buildable, immutable C-3 component candidate binds My-Chat API/worker/web/admin/mobile artifacts, the exact Nurture scenario package and owner API artifact, dependency locks, SBOM/provenance, and Base source package from the I4 freeze. ACR/public registry publication is not required or authorized here. |
| `C35-I6` disposable migration/crypto proof | My-Chat and Nurture | Separate clean databases prove fresh apply, supported old-baseline upgrade, SSOT/schema parity, migration checksums, ownership boundaries, disposable backup/restore/forward repair, and the same-path isolated KMS integration. Dev-host schema is excluded. Pilot-topology backup/restore and real secret custody remain Pilot-1/3. |
| `C35-I7` automated joint evidence | Three repositories | Exact candidate, two production-shaped databases, real signing/nonce and isolated KMS paths, deterministic provider fault adapter, no owner/auth/persistence mock at the joint seams, and the complete conformance/domain/joint/privacy matrix pass. |
| `C35-I8` rendered and manual evidence | My-Chat and Nurture | C-3-2 authority strand plus J1-J4 run through authenticated rendered surfaces on the exact API/worker/web/mobile/scenario artifacts; at least one safe recorded golden journey and required differentiated checkpoints pass. |
| `C35-I9` three-run and rollback proof | Three repositories | High-risk replay/scope/revoke-redaction/provider/open/kill-switch suites pass three consecutive fresh namespaces with no retry, code/config/candidate change, or residual active gate. |
| `C35-I10` prequalification seal, controller commit, and resolver exit | Three repositories | First seal a body/secret-free prequalification record from completed I0–I9 evidence, the evidence-index digest, final false/empty census, known limitations, and C-4 negative inventory. The controller CAS-appends the deterministic predecessor-free `verifying` genesis, signs the qualification envelope, then CAS-appends the `qualified_default_off|rejected` child. I10 success exits only after the current-state resolver returns `qualified_default_off`. Crash after genesis resumes idempotently from the same pre-seal or terminates that candidate as `rejected`; no step modifies a candidate-pinned source commit. |

Missing implementation, handler, migration, route, KMS path, signer, registry entry, negative test, artifact, or evidence is a candidate rejection. A manual registry filter, legacy alias, mixed source revision, mutable dependency, test-only release bypass, provider mock presented as an adapter, or capability fallback cannot satisfy any gate.

**C-3-5b — immutable component candidate and evidence envelope (LOCKED)**

1. The machine-readable build artifact is `c3_component_candidate_manifest_v1`, not a final Pilot manifest. `component_candidate_id` is the namespaced canonical hash of its complete ordered build/configuration tuple; branch names, tags, “CI green”, one contract hash, mutable URLs, execution results, qualification state, or an evidence-index digest cannot identify the candidate.
2. The candidate tuple binds exact three-repository source commits and lock hashes; historical plus `platform_child_family_identity_source_v1`, `scenario_interface_source_v1`, `scenario_domain_action_source_v1`, `scenario_protected_interaction_source_v1`, `scenario_notification_continuity_source_v1`, and `scenario_activation_admission_source_v1` hashes; Base package digest; canonical/generated manifest and Scenario module hashes; My-Chat and Nurture executable artifact/SBOM/provenance digests; both database schema and ordered migration checksums; platform identity/binding/anchor and route/surface/action/handler/renderer/provider/admission registries; admission persistence/issuer/verifier/execution-status revisions; evidence-run authorization contract/controller/store/issuer/audience/trust/revocation/verifier/current-resolver revisions; candidate-plan/source-link/source-kind revisions; KMS configuration class/key-domain revision without key material; signing caller/issuer/audience/trust-set/key/nonce/rotation revisions; qualification-envelope/event contract, controller trust-set, content-addressed store, and current-state resolver revisions; retention/privacy/leakage policy; activation-profile/gate schema revision; and topology/fixture/test-code and test-plan revisions. The tuple does **not** bind an evidence-run authorization instance, evidence result, evidence index, qualification event/envelope id, lifecycle, or later approval.
3. Every test, screenshot manifest, manual checkpoint, fault trace, and gate/rollback result records the same `component_candidate_id`. The append-only body/secret-free evidence index is built after those results and binds the candidate id. A prequalification seal binds completed C35-I0–I9, the evidence-index digest, final false/empty census, known limitations, and C-4 negative inventory; the seal is input evidence, not a qualification result. After verifying the pre-seal, the dedicated controller signs `c3_component_qualification_v1` with a separate `qualification_envelope_id = hash(component_candidate_id + evidence_index_digest + final_gate_census_digest + qualification_result)`. Evidence artifacts and the qualification envelope live in the approved content-addressed evidence store and never write back into or alter a candidate-pinned source commit.
4. My-Chat's isolated release-governance boundary owns the qualification envelope/event store and current-state resolver. Only the dedicated `c3_qualification_controller` may sign both `c3_component_qualification_v1` and `c3_component_qualification_event_v1`; the envelope and event have distinct schema/audience labels but use that controller's isolated credential/key/trust/revocation domain. That domain is distinct from scenario invocation, Notification owner-read, `evidence_release_controller`, and `pilot_release_controller`. Technical Operator, repository CI, Guardian, Caregiver, Institution Admin, scenario services, and release-row writers cannot self-qualify, invalidate, or supersede a candidate. They may submit body-free evidence or an invalidation request, but the controller alone verifies the complete prequalification seal and emits the signed envelope/event.
5. The event chain is partitioned by `(qualification_profile, component_candidate_id)`. Each event contains exact schema/version, deterministic idempotency id, candidate/profile id, qualification-envelope id where applicable, result `verifying|qualified_default_off|rejected|invalidated|superseded`, predecessor event id/hash, evidence-index and final-gate-census digests, body-free reason class, database time, issuer/audience/key id, and signature. `verifying` is the only legal genesis and has `predecessor=NULL`; its deterministic id binds candidate/profile/pre-seal digest. After that first CAS commit, the controller signs the envelope and performs a second CAS append of `qualified_default_off|rejected` against the exact verifying head. A crash after genesis leaves the resolver unqualified; exact retry with the same pre-seal reuses the genesis and resumes the second append, while changed evidence/pre-seal conflicts and the controller may only append `rejected`. Every CAS transaction compares the unique current head; exact same request/event id replays the existing event, while a different event against a stale predecessor conflicts and creates no second head. The resolver verifies envelope and event signatures, trusted/revoked key state, issuer/audience, candidate/envelope/digest equality, the unique predecessor chain, and current head before returning state. Missing store, verifier outage, unknown/revoked signer, duplicate/divergent head, broken chain, stale envelope, or ambiguous latest state returns `unqualified` and denies activation.
6. The allowed chain is exact: empty -> predecessor-free `verifying`; `verifying -> qualified_default_off|rejected`; `qualified_default_off -> invalidated|superseded`; `rejected -> superseded`; `invalidated -> superseded`; and `superseded` is terminal. No second genesis and no event may restore the same candidate to `verifying|qualified_default_off`. The candidate manifest itself has no mutable lifecycle. Discovering an unresolved `QR-P0/QR-P1` requires rejection or invalidation of that exact candidate; a Technical Operator immediately disables/removes any row but cannot author the qualification event. Only a fix or other build/configuration tuple change creates a new `component_candidate_id` and reruns every affected dependency edge. Pilot-2 complete-Pilot activation must consume both the resolver's current `qualified_default_off` C-3 component and the separate current `qualified_default_off` C-4 composite nested inside the complete candidate, plus the current E Go decision and exact Pilot-1 deployment; an event id, nested id, or cached status is never sufficient authority.
7. The evidence index and qualification envelope may contain digests, test ids, sanitized counts, safe technical states, timings, ownership, and artifact references, but contain no protected body/media, body-derived copy, raw token/ref/device secret, claim material, credential/signature/nonce, child/family identity, or unmasked screenshot/video.
8. C-4 completion cannot mutate the C-3 component candidate into a final Pilot candidate. The exact C-4 composite plus the implemented D-locked topology/profile/recipe produce a new immutable complete Pilot candidate and re-run every source-population, route, migration, artifact, topology, and cross-slice edge affected by their changes. D topology evidence enters only the later body/secret-free evidence seal, never candidate identity. Pilot-0-E emits a separate signed Go/No-Go decision that references the candidate and seal; the E decision is never an input to the candidate identity under review.

**C-3-5c — positive-only persistent activation control (LOCKED)**

My-Chat owns a generic technical `ScenarioWorkspaceActivation` model or exactly equivalent positive-only store. The model is not a Nurture business fact, membership, role, consent, Grant, or authorization cache. The row binds at least exact Workspace, scenario, activation-profile key/version, `candidate_kind`, `release_candidate_id`, nested `c3_component_candidate_id`, nullable stage-typed `c4_composite_candidate_id`, `deployment_binding_id`, stage-appropriate evidence-run or qualification/Go authority refs, active interval, status/version, release authority/audit refs, disable actor/reason/time, and created/updated database time. Database/codec constraints require C3 rows to keep `c4_composite_candidate_id=NULL`, while C4-composite, D complete-evidence, and complete-Pilot rows bind the exact nonnull composite id; absence, extra value, or mismatch denies. An absent, disabled, expired, duplicate, mismatched, invalidated, or unreadable row denies.

The candidate binding and current-authority predicate are stage-aware and closed. For `candidate_kind=c3_component_v1`, the row sets `release_candidate_id` to the exact component candidate under verification, uses only activation profile `nurture_guardian_caregiver_pilot_v1`, and requires one current signed evidence-run authority strictly bound to the environment, component candidate, disposable deployment, synthetic Workspace, and expiry. This kind MUST NOT query or cite a qualification result or Pilot-0-E decision that does not yet exist. For `candidate_kind=c4_composite_v1`, the row uses only the C-4 evidence profile `nurture_institution_composite_evidence_v1`; use of the C-3-only profile is a fatal partial-activation mismatch. Pilot-0-D additively defines `candidate_kind=complete_pilot_evidence_v1` with only profile `nurture_institution_complete_pilot_evidence_v1`, the exact complete candidate, current C-3/C-4 qualification, current D evidence authorization, and current disposable D deployment binding; E, Pilot-1/stage authority, persistent Pilot, provider recipient, and external traffic are forbidden. For `candidate_kind=complete_pilot_v1`, the row MUST use exact activation profile `nurture_institution_complete_pilot_v1`, locked by Pilot-0-D and bound into the D complete candidate; C-4 does not name or pre-author that profile, and neither evidence profile may substitute for it. A `complete_pilot_v1` row binds the complete Pilot candidate created by C-4 plus the D recipe, the exact nested C-3 component and C-4 composite candidate ids, the exact current Pilot-0-E signed Go decision, and the Pilot-1 deployment identity covering deployed artifacts/configuration and real KMS/signing references; admission MUST independently query the current C-3 qualification resolver, current C-4 qualification resolver, and E-decision resolver. Nested ids prove composition but cannot authorize Pilot activation by themselves. Wrong/mixed candidate kind, profile, authority type, stage, environment, candidate, deployment, Workspace, or expiry denies. Either qualification invalidation/ambiguity/outage, Go invalidation, or deployment drift denies the complete-Pilot row and forces disable; evidence-authority invalidation/expiry denies the disposable row. A current runtime can never substitute another candidate/configuration.

`scenario_activation_admission_source_v1` defines the body/secret-free `c3_evidence_run_authorization_v1` contract. Only the isolated `evidence_release_controller` signs the authorization with issuer `my-chat.evidence-release`, audience `my-chat.c3-evidence-activation.v1`, and a key/trust/revocation domain distinct from scenario invocation, qualification, Notification, Pilot release, and Technical Operator. The envelope binds schema/version, authorization id/version, exact disposable-evidence environment id/class, scenario/profile, `candidate_kind=c3_component_v1`, component candidate, disposable deployment, one synthetic Workspace, `not_before|expires_at`, the closed `activate_exact_evidence_scope|deactivate_exact_evidence_scope` operation set, issuer/audience/key id, and signature. The envelope can never name Pilot/staging/production, `complete_pilot_v1`, a second Workspace/candidate/deployment, or external traffic.

My-Chat owns the append-only authorization record plus signature verifier and currentness resolver. The resolver requires the exact stored envelope/version, trusted non-revoked signer, current controller credential lineage, interval, unsuperseded/unrevoked status, exact row/environment/candidate/deployment/Workspace match, and supported contract/runtime revision; ambiguity, verifier/store outage, unknown/revoked signer, expiry, mismatch, or duplicate current head denies. The signed envelope is not a bearer token and raw controller credential/signature transport material is never persisted outside the approved evidence record. The component candidate pins the contract/controller/store/issuer/audience/trust/revocation/verifier/resolver revisions but not the authorization instance. Teardown invokes the same production command path, revokes the authorization, destroys the controller credential, proves the resolver inactive, and leaves every environment switch false plus active rows `[]`.

The exact C-3 profile is `nurture_guardian_caregiver_pilot_v1`. The profile enumerates the complete required source/capability/manifest/route/handler bundle and cannot partially enable Guardian-only, Caregiver-only, protected-write-only, or Notification-only behavior. The profile is a Host activation profile rather than a new Base business capability or a replacement for the named source hashes.

C-4 later adds the evidence-only Host profile `nurture_institution_composite_evidence_v1`. It content-addresses the exact immutable C-3 profile plus all C-4 fragment/source/surface/action/invitation/Handoff/runtime bindings and is legal only for disposable `c4_composite_v1` evidence. Pilot-0-D adds the separate disposable `nurture_institution_complete_pilot_evidence_v1` profile for `complete_pilot_evidence_v1`; candidate kind `complete_pilot_v1` uses distinct exact activation profile `nurture_institution_complete_pilot_v1`, owned and locked by Pilot-0-D as part of the complete candidate. No profile mutates, aliases, substitutes for, or falls back to another kind.

Normal business ingress, owner reads/actions, replay that may execute business work, Notification delivery, and interactive open require the conjunction of:

`exact environment bundle true AND one current Workspace/scenario/profile/release-candidate/deployment row AND the candidate-kind-specific current authority predicate passes AND running complete artifact/configuration/registry hashes match AND current Host membership/gates AND signed current Nurture cohort/owner policy passes`

Every seam rereads only its own authority. Public scenario entry, business Chat transition, presentation, prepare/submit, invitation continuation, workflow claim/reclaim and scenario execution, Notification delivery/open, and destination reread require the full current conjunction. The Host admission transaction reads the current gate and persists/issues one short-lived body-free `ScenarioActivationAdmissionV1` assertion bound to the exact row version, release/deployment identities, runtime hashes, original actor/Workspace, request/command hashes, required original Step hash for claimed driver or explicit absent-Step discriminator for direct driver, issue/expiry, and random `admission_id`. That issuance is the technical admission linearization point. The admission assertion is not a transport nonce, claim, role, owner policy result, or reusable capability.

Every owner-call attempt still follows C-3-0b unchanged: a fresh `ScenarioPrivateInvocationV1` signature and transport nonce bind the same admission assertion; Nurture consumes the transport nonce hash in the shared replay store before any Participant/resolver/owner call. Duplicate transport nonce yields zero owner calls, precommit rollback never restores the nonce, and retry uses a fresh nonce/signature. Only after transport verification does the Nurture `CommandExecution + business effect` transaction validate the exact admission/request/command/Step binding, acquire the deterministic command fence, persist the admission hash as safe provenance, and commit at most one business effect; that transaction is the owner commit linearization point. A business attempt must start before admission expiry and finish or roll back within the bounded owner-transaction deadline. An accepted attempt may finish after assertion expiry within that bound; expiry alone never proves whether the effect committed.

`scenario_activation_admission_source_v1` also defines the strict, body-free `ScenarioExecutionStatusLookupV1` request/result and a recovery-only private invocation. This operation is not an ordinary `ScenarioPrivateInvocationV1` and does not use a human-principal ingress category. The closed transport identity is caller `my-chat-execution-recovery`, issuer `my-chat.recovery`, audience `nurture.execution-recovery.v1`, operation `scenario_execution_status_lookup_v1`, and endpoint `POST /private/v1/execution-status:lookup`. The operation uses a dedicated service credential/signing key domain and exact verifier registry/revocation set, all separate from ordinary API/worker invocation, Notification owner-read, provisioning, owner recovery, and activation controllers. The operation reuses only the C-3-0b fresh single-use nonce mechanism; active activation row/capability is deliberately not a prerequisite for this one lookup operation.

The signed lookup binds the exact frozen original Workspace, admission assertion/hash, request id, command id/hash, original principal-provenance hash, and optional original Run/Step/driver binding. Claimed recovery MUST match the original durable Run actor and Step; direct recovery MUST match the original direct request ownership evidence. The expired assertion is provenance rather than current authorization. The transport verifier first validates exact caller/credential/signature/issuer/audience/endpoint/method/codec, single-use nonce, and cryptographically frozen binding. Any unknown/revoked signer, malformed request, replayed nonce, or admission/request/command/Run/Step/principal-provenance mismatch returns one generic transport deny/unavailable response with zero status-resolution, command-fence, or application-service call; My-Chat retains its local work as `outcome_unknown/quarantined`. Only an authenticated, exact-bound lookup may acquire the same deterministic command fence used by the writer and return `committed|confirmed_no_effect|unknown`. `committed` returns only the original body-free Execution/result/replay seed. `confirmed_no_effect` is legal only after admission expiry plus clock-skew/owner-transaction deadline, after every issued attempt is terminal, and after the fence proves no exact CommandExecution. For that valid lookup only, lock timeout, owner/store outage, a possibly in-flight attempt, or internally ambiguous compatible evidence returns protocol `unknown`; a one-time absent read can never prove no effect.

The recovery operation MUST NOT resolve Participant, current role/subject/Grant/policy, execute or prepare a scenario command, create/rebind a Step, mint a normal admission, recompute an audience, create a materialization candidate/Notification, enqueue/send/open, call a presenter/protected read, or disclose content. The recovery service identity is never the business actor. For direct results, the lookup returns its body-free classification to My-Chat; My-Chat may display the original direct result only after a current public session, membership, exact Workspace, and original request-ownership check, otherwise My-Chat returns generic `processed_but_unavailable`. Claimed recovery remains bound to the original Run actor/Step and proceeds only through the local effect-decreasing lane. Candidate evidence pins the recovery caller, issuer, audience, endpoint, credential/signing-key, verifier/trust-set/revocation, nonce-store, request codec, and result-codec revisions.

Before expiry, active-gate response-loss retry may use a fresh nonce/signature with the same admission and business identity. After expiry, an uncommitted effect may be retried only after `confirmed_no_effect`, a fresh full current gate check, and a new admission; the old admission cannot create new work or rebind a later Execution. An already committed effect is recoverable after admission expiry whether the gate is active or disabled: exact same-Step claimed recovery and exact direct-request recovery use the status lookup, never rerun the command, and do not treat the old admission as current authority. Because the stores are independent, disablement that commits before Host admission prevents the call/fact, while a transport attempt already in flight from an earlier admission may still fail closed or commit at most once afterward. Wall-clock row deletion and Nurture commit are never claimed atomic or totally ordered.

Normal `complete_step` remains a local My-Chat transaction that validates the current technical row/release/deployment/runtime match plus original claimed Step/draft provenance and performs no remote owner-policy call. Step/Handoff provenance freezes the admission hash, admitted candidate kind, release candidate, nested C-3 component, deployment binding, activation-profile/row version, source hashes, and compatible recovery-runtime revision without content or authority. While execution status is `unknown`, claimed work remains `manual_review_required/outcome_unknown` and direct-empty progress remains `outcome_unknown`; neither path sends, opens, retries business, or guesses success/failure. After exact `committed|confirmed_no_effect` classification, the disabled lane may issue a short-lived technical recovery claim only for the same original Step and frozen runtime. The recovery claim bypasses the absent activation row solely to call local `complete_step|fail_step`; the recovery claim cannot invoke Nurture business, change command/admission/draft, create a new Step, or become a normal retry. After `committed`, that Step may locally materialize/settle against frozen provenance even when the row is absent or admission expired. After `confirmed_no_effect`, an active current gate and remaining retry budget may instead issue a new admission for the same original Step/command; a new Step or rebinding is forbidden. If the gate is disabled, the technical recovery claim terminalizes the Step through `fail_step(retryable=false, reason_code=scenario_disabled_no_effect)` with no Handoff/Outbox, while the exact direct-empty request terminalizes `unavailable(no_effect)` with no Step/Handoff. A disabled direct-empty request whose Execution committed may return only the original body-free result or `processed_but_unavailable`; the request never reruns business. A current runtime that cannot interpret the frozen revision quarantines the Step/request/Handoff and raises an incident until the exact compatible recovery path is restored; the runtime never reinterprets the evidence under a newer candidate. Technical Admin inspection/stop uses the same narrow lane. Cache may accelerate a denial but cannot authorize; an outage of a store required by a particular seam fails that seam closed. The existing environment-global Handoff flag and the generic capability setting whose absent override is effectively enabled are insufficient C-3 gates.

The `pilot_release_controller` under one exact current stage authorization is the sole authority that may create that authorization's fresh Pilot row or disable it. It cannot extend, retarget, or re-enable an existing row; any changed interval/target or resumed stage requires a new authorization and fresh row. A Technical Operator may inspect safe gate evidence and remove/disable the exact Workspace row or environment bundle, but cannot enable either control. Institution Admin, Caregiver, Guardian, Nurture service callers, and Workflow workers have no gate mutation authority.

C-3-5 may implement and test the persistent schema/evaluators. A temporary `true + one synthetic Workspace` exercise is permissible only in a separately approved disposable evidence environment/database, with no external traffic and complete cleanup proof. That exercise uses an independently scoped `evidence_release_controller` through the same production activation command, validation, transaction, and audit path—never direct database writes, a test bypass, or Pilot release authority. The evidence credential is bound to one environment, C-3 component candidate, disposable deployment, synthetic Workspace, and short time window, then revoked/destroyed; the authority cannot target any Pilot environment or survive qualification. C-3-5 qualification always ends with the tracked environment bundle false, active Workspace rows `[]`, no release/evidence bypass, and no running external environment. Pilot-1 may deploy the later E-approved complete artifact/topology with real secret references while remaining false/empty and must emit the exact deployment binding. Only separately authorized Pilot-2 sets the environment bundle true while the allowlist is empty and adds the one exact time-bounded complete-Pilot-candidate/deployment-bound Workspace row last.

**C-3-5d — complete automated, rendered, and manual evidence (LOCKED)**

Evidence is layered and traceable by deterministic test id, owner, candidate, artifact, configuration, and sanitized result:

| Layer | Mandatory proof |
| --- | --- |
| `L0 candidate integrity` | Clean commits, locks, source/manifest/registry/schema/artifact hashes, SBOM/provenance, no mutable dependency, C-4 routes/producers absent, and gates false/empty. |
| `L1 contract/conformance` | Every allowed and denied action/surface/ingress/driver/capability cell; strict codecs; generated parity; mixed/legacy/no-fallback negatives. |
| `L2 owner domain/database` | Every command/presenter/policy/transaction, exact roles/episodes/Grants, cascades, KMS/retention, concurrency, and no partial effects. |
| `L3 two-database joint` | Signed ingress, direct/claimed replay, Step/Handoff/candidate/link/Outbox/provider/open seams, cross-database races, Admin recovery, and noninterference. |
| `L4 rendered authenticated E2E` | Generic Chat and structured UI, family/teacher board, family workbench, mobile Notification/deep link, web reauthentication, loading/empty/error/permission/current-refresh/accessibility, and distinct browser/device personas. |
| `L5 safe manual evidence` | At least one complete exact-candidate golden J1 plus the required J2/J3/J4 differentiated checkpoints. Protected regions are excluded or masked at capture time, no unmasked intermediate is ever written, observer attestation records the controls, and temporary recording/tool caches are included in the privacy scan. |
| `L6 privacy/fault repeat` | Complete B3 negative/fault/privacy matrix and high-risk suites pass three consecutive fresh namespaces without test retry or candidate/config change. |
| `L7 rollback/closure` | Gate removal, in-flight convergence, final false/empty census, no external traffic, evidence seal, and C-4 limitations. |

J1-J4 close communication and all four Caregiver Chat/teacher-board acknowledge/reply pairings, but they do not by themselves close Guardian relationship/authority. C-3-5 therefore adds a separate C-3-2 strand covering first/Co-Guardian invitation and acceptance boundaries, current relationship/self-exit, Enrollment confirmation and family-side holds/transfer consumer/withdrawal, Grant confirm/replace/revoke, Stage set/change/correct/clear, current/recent/history across all three Guardian surfaces, strong-confirmation/denial, and family-withdrawal relationship Notification/open. Every action/surface cell is exhaustive at conformance; rendered evidence covers each surface root and each prepare/confirmation/result/unavailable class without creating a Cartesian full E2E for every cell.

The exact rendered J1-J4 topology remains F1/C1 with G1 Grant owner plus G2, F2/C2 with G3, F3/C3 with G4, and one Caregiver T1 across the three eligible scopes. J1 and J4 use distinct questions, commands, Steps, contexts, and run namespaces. J1 proves `G1 nurture_chat/current -> T1 nurture_chat/current acknowledge -> T1 teacher_board/current reply -> G2 Notification -> family_board/recent -> user navigation -> family_workbench/history`, plus same-family/cross-family visibility. Its single reply Handoff MUST materialize distinct G1 and G2 candidate/Notification rows; the rendered path selects G2 to open, and a later G1 provider delivery/open MUST prove no second business seed, Execution, Step, or Handoff. J2 proves `G3 family_board/current -> T1 teacher_board/current acknowledge -> nurture_chat/current fresh claimant-item selection/reply -> G3 family_workbench/history -> T1 nurture_chat/recent exact Caregiver reply redaction`. J3 proves `G4 family_workbench/current -> T1 teacher_board/current acknowledge + reply -> G4 Notification -> family_board/recent`, with post-commit response loss and provider recovery. J4 proves `G2 nurture_chat/current -> T1 nurture_chat/current acknowledge/reply -> G1 family_board/recent owner reread -> G2 nurture_chat/recent exact-author source redaction`.

Mobile evidence covers generic Chat, family/teacher boards, Notification/deep link; web evidence covers family workbench and real public auth/session. Both use the same API, worker, outbox, provider adapter, Nurture owner API, databases, and candidate. Native-to-web carries only the Notification id. After web reauthentication and global exact-recipient Notification lookup, the server derives the target Workspace from the binding. If the same user's current Workspace differs, the UI requires an explicit Workspace switch/confirmation; the server then re-establishes membership/gates, loads the typed link and Handoff server-side, and performs current owner rereads. Workspace, Handoff, and scenario token never enter the client route or transfer payload.

Synthetic topology setup is labeled setup-only. Institution, CareGroup, exact staff RoleAssignment, canonical My-Chat accounts/sessions, and the correlated invitation prerequisites may be created by the isolated versioned harness only where C-4-owned topology is required. The invitation prerequisite MUST consist of a pending My-Chat Host invitation shell correlated to a pending Nurture EnrollmentInvitation intent and an unlinked RosterEntry; the prerequisite MUST NOT pre-create accepted Host membership for the invitee, Participant, Guardian RoleAssignment, accepted Enrollment, Grant, or Thread. Host invitation acceptance plus first-Guardian/Enrollment establishment then runs through the real authenticated C-3 prospective/Guardian path. A pending transfer proposal may be fixture-created only to prove the C-3 Guardian consumer negative/continuity boundary. Qualifying Grant and Thread state must be produced through real authenticated C-3 Guardian authority/actions; direct Grant/Thread/accepted-Enrollment setup is permitted only in isolated domain/negative tests and cannot qualify a rendered or joint journey. Institution board/workbench and all C-4 producers stay absent/negative; the Institution Admin account may exist only as topology. Technical Operator evidence remains refs-only recovery/disable and proves zero body/business mutation.

**C-3-5e — fault, privacy, KMS, and rollback evidence (LOCKED)**

1. The high-risk repeat set covers response loss/same-Step reclaim, wrong-Step and cross-scope denial, Grant revoke/replace/expiry, source/reply redaction and retention, exact RoleAssignment episode loss/new episode/rejoin, candidate pending/materialized/skipped settlement, owner/provider outage, dead-letter/Admin recovery, stale/open/destination invalidation, KMS outage/rotation/erasure, and both kill-switch orders. Every set passes three consecutive clean namespaces with one business effect, at most one Handoff, no terminal-skipped backfill, no unauthorized open, and no retry hiding a failure.
2. KMS evidence uses the same envelope/keyed-integrity/rotation/erase application path with an isolated integration provider, not a code-path mock. The path proves prepared/committed/read/erase, outage, wrong key/version, retention cleanup, disposable backup/restore erasure replay, and zero raw key/DEK in persistence/evidence. Real cloud KMS credentials and topology remain Pilot-1.
3. Static and runtime scans cover both databases, Step/Handoff/candidate/link/Outbox, queue/provider/deep link/DTO, Chat/transcript/artifact/search/cache/PWA, logs/traces/metrics/APM/crash/support, screenshots/video, and backup/restore evidence. Protected body/media, body-derived copy, raw owner ref/token/device secret, claim/credential/signature/nonce, and forbidden identity/policy detail remain absent.
4. Kill-switch ordering is defined by admission, not wall-clock commit comparison across databases. Disablement committed before the Host admission linearization point yields no owner call or business fact. A transport attempt already in flight from an earlier admission may fail closed or commit the Nurture effect at most once; disablement never authorizes a fresh attempt to create a previously uncommitted effect. Admission-issued-before-send, nonce-consumed-before-transaction, and rolled-back transaction states remain `outcome_unknown/quarantined` until the bounded deadlines pass and `ScenarioExecutionStatusLookupV1` acquires the writer fence. `unknown` remains quarantined. `confirmed_no_effect` fails the original claimed Step as `scenario_disabled_no_effect` with no Handoff/Outbox, or closes the exact direct-empty request as `unavailable(no_effect)` with no Step/Handoff. `committed` direct-empty recovery returns only the original body-free result/`processed_but_unavailable`; `committed` claimed recovery enters the original Step/Execution effect-decreasing lane and handles five persisted cases: (a) replay proves `snapshots=[]`—complete the original Step with no Handoff; (b) replay proves a non-empty immutable seed but no Handoff/plan—atomically complete the Step and create one body-free `stopped` Handoff with zero plan/candidate/Outbox/owner-audience call; (c) Handoff exists but no plan—stop the Handoff with zero candidate creation; (d) a plan exists with zero materialized candidates—terminalize its pending candidates `skipped` and stop the Handoff; (e) one or more candidates materialized—terminalize all remaining pending candidates `skipped` and complete the Handoff under C-3-4 settlement. Provider/send/open/destination remain disabled in every case, and recovery never recomputes the audience or backfills.
5. Removing the Workspace row immediately blocks new ingress, preparation, claims, materialization delivery, send, open, and destination content/action. Disabling the environment bundle is the second kill. The reverse order or a failure between operations is also safe because either missing key denies. Foreground protected views/tokens clear; already displayed generic OS push cannot be recalled but opens unavailable.
6. Rollback never deletes or rewrites Nurture Message/Receipt/Item/Grant/Enrollment/Execution facts. Requested/failed technical work is settled or stopped through the original owner-safe Admin path. Re-enable never backfills skipped candidates/pushes, revives tokens/views, or restores an old role episode; a new complete Go/No-Go and the later authorized gate sequence are required.

**C-3-5f — qualification, invalidation, and C-3 exit (LOCKED / COMPLETE)**

C-3 qualification starts only after C35-I0–I9 and the I10 prequalification seal are complete. The controller CAS-appends the verifying genesis, signs the envelope, and CAS-appends the qualified/rejected child; C35-I10 and C-3 qualification success exit only after the current resolver returns `qualified_default_off`. The prerequisite set includes all prior C30-I0..I4 and C31/C32/C33/C34 implementation evidence, exact component-candidate/pre-seal/envelope integrity, zero open `QR-P0/QR-P1`, complete C-3-2 authority and J1-J4 rendered evidence, B3 negative/fault/privacy closure, three consecutive high-risk passes, safe manual evidence, rollback proof, every environment activation-bundle switch false, active Workspace rows `[]`, and no external traffic. A failure rejects or invalidates qualification; waiver, manual DB repair, cached qualification label, rerun-only-the-failure, or partial-surface enablement is not qualification.

The only allowed successful status is:

`C3_QUALIFIED_DEFAULT_OFF / C4_PENDING / EXTERNAL_TRAFFIC_NO_GO`

That status closes the Guardian/Caregiver component implementation gate only and, viewed at the C-3 boundary, leaves C-4 implementation pending. The subsequent C-4 section closes the Institution design contract without claiming adoption or qualification. Pilot-0-D now separately locks the approved environment/topology, artifact/secret custody, dual-gate operational responsibility, observation, stop, and rollback terms, but authorizes no implementation. Pilot-0-E reviews the later immutable complete candidate plus D evidence and may at most recommend separate Pilot-1 authorization. Pilot-1 publishes/deploys the exact approved bytes and configures real secret/KMS/signing references while false/empty; Pilot-2 alone may enable the one Workspace. Staging, production, GA, external traffic, and cohort expansion remain independently unauthorized.

C-3-5 is complete here only as a design and implementation-evidence specification. No Base source/package, My-Chat or Nurture source, candidate manifest, schema, migration, KMS key, route, UI, renderer, runtime, artifact, evidence run, gate row, capability, allowlist, database, provider, secret, environment, or traffic changed. The current repositories remain readiness `NO-GO` for C-3 qualification and all enablement. At this C-3 exit, C-4 Institution IIB design discussion was entered with no C-4 decision yet locked; the subsequent C-4-0..5 sections now supersede that historical next-step status while keeping C-4 implementation unauthorized.

### Pilot-0-C4 — Institution operational IIB and closure evidence (DESIGN COMPLETE / IMPLEMENTATION OPEN)

| Sub-checkpoint | State | Decision boundary |
| --- | --- | --- |
| C-4-0 Institution scope, ownership, surface, and composition baseline | **LOCKED** | Exact Institution Admin reachability, two product surfaces, owner split, immutable C-3 component boundary, independent C-4 extension/composite candidate, and isolated pre-E activation/bootstrap evidence authorities. |
| C-4-1 Institution/CareGroup topology, policy, staff, and Lead lifecycle | **LOCKED / COMPLETE** | Authenticated topology writes, policy revision/binding, Staff Invitation coordination, accepted Participant binding, exact Caregiver role episode, independent Lead designation, readiness, offboarding, and group closure. |
| C-4-2 roster and Enrollment Invitation IIB | **LOCKED / COMPLETE** | Institution-local roster lifecycle, recipient shell/owner-intent coordination, invitation cancel/reissue/expiry, and transfer to the C-3 prospective/Guardian path. |
| C-4-3 Institution Enrollment operations and relationship-attention producers | **LOCKED / COMPLETE** | Institution hold/release, transfer proposal/cancel, service close, fresh re-entry initiation, claimed-Step producers, audience, and current Guardian consumption. |
| C-4-4 terminal-claimant staffing review, safe states, and continuity | **LOCKED / COMPLETE** | Body-free review, no takeover, explicit unfulfilled closure, family status delivery, business-disable behavior, privacy, rendering, and fault/race coverage. |
| C-4-5 cumulative adoption, evidence, qualification, and exit | **LOCKED / COMPLETE** | Strict C40–C45 implementation DAG, immutable candidate/evidence graph, joint/rendered journeys, rollback, qualification, and Pilot-0-D handoff. |

**C-4-0 — Institution scope, ownership, surface, and composition baseline (LOCKED)**

C-4 closes the Institution-facing part of the same child-centered Nurture ecology. The C-4 slice does not create a separate Institution product, a second child graph, an Institution-owned family workflow, or another My-Chat identity model. C-4 consumes the locked C0–C3 business and technical contracts without reinterpreting them.

The exact actor path is:

`authenticated MyChatUser -> workspace membership -> NurtureParticipant -> one current institution_admin RoleAssignment with scopeType=institution -> exact active NurtureCareInstitution`

The resolver MUST reject a generic My-Chat workspace admin, Caregiver or Lead designation, `system_operator`, Technical Admin, service identity, Institution/Enrollment/CareGroup role-scope substitution, client role/scope claims, raw Institution ids, and ambiguous or multiple current Institution-admin paths. A current Institution-admin path authorizes only the exact Institution and its currently reachable topology. Every collection query MUST begin from that owner-qualified Institution predicate before counting, paging, or loading children, Enrollments, roles, invitations, or work; loading a workspace-wide set and filtering afterward is forbidden.

C-4 registers exactly two additional Nurture product surfaces:

| Product surface | Host renderer family | Pilot view modes | Exact boundary |
| --- | --- | --- | --- |
| `institution_board` | generic role board | `current` | Read-only safe aggregate/readiness/navigation. A durable action offer is a validator/runtime fatal. |
| `institution_workbench` | generic domain workbench | `current|history` | Current owner detail, owner-paginated history, prepare/confirm entry, and the only Institution product surface allowed to execute C-4 writes. |

There is no Institution Chat surface in Pilot-0. `nurture_chat` remains Guardian/Caregiver only; `teacher_board` remains Caregiver only. The historical `class_family_inbox|teacher_attention_board` capability and `institution-surfaces.ts` owner-read implementation are Caregiver workflow compatibility paths, not `institution_board|institution_workbench`, and MUST NOT satisfy any C-4 route, presenter, action, or evidence row. The C-3 neutral role-board/workbench fixtures prove Host renderer reuse only and are not C-4 Nurture product evidence.

The Institution presentation contract is one Nurture-owned `institution_operations_v1` composition. The board may expose bounded group-level topology/readiness, invitation/staff/Enrollment/Grant-coverage categories, family-care backlog totals, and body-free staffing-review counts. These small-cohort values MUST NOT be described as anonymous or privacy-preserving aggregates and MUST NOT add per-child workflow breakdowns, trends, proportions, ranking, comparative scoring, protected summaries, policy reasons, or other-Institution signals. The workbench may expose exact Institution/CareGroup configuration, accepted-participant and role history, institution-local roster labels, Enrollment lifecycle, Grant-safe metadata already allowed by B3-1c, and body-free operational cases. Neither surface may expose family question/reply bodies, drafts, Message summaries derived from protected content, Guardian contact/profile/family details, Grant narrative/revoke text, another Institution relationship, raw canonical ids, Host invitation contact, claim/credential material, or My-Chat runtime facts.

Ownership remains exact:

| Owner | C-4 responsibilities | Forbidden ownership |
| --- | --- | --- |
| My-Workflow-Base | Neutral additive extension-composition and Host identity-invitation coordination contracts, validators, fixtures, and conformance. | Institution, child, role, roster, Enrollment, Grant, content, policy, or lifecycle semantics. |
| My-Chat | Authentication/session/membership; server route-to-surface registry; generic board/workbench renderer; signed ingress; action orchestration; Host invitation shell/contact/delivery/acceptance/membership; claimed Step/Handoff/Outbox/Notification runtime; extension composition; evidence/qualification storage and current resolvers; Technical Admin. | Nurture Institution projection, business role, policy, roster, Enrollment, Grant, protected body, staffing-review decision, or lifecycle mutation. |
| The-Nurture | Institution-admin resolver; Institution/CareGroup/roster/Enrollment/RoleAssignment/Lead/policy/invitation-intent/staffing facts; owner presenters/actions; `CommandExecution`; commit-time audiences; owner reread; business recovery. | My-Chat account/contact/session, Host invitation acceptance, technical queue/lease/attempt, Handoff Ledger, Outbox, provider, deployment, or activation authority. |

The owner split also narrows the earlier Minimum IIB shorthand: Institution paths produce and govern topology, staff, roster, Institution invitation intents, Institution-side Enrollment transitions, and body-free operational closure. Guardian/Caregiver C-3 paths remain the only owners of family relationship, longitudinal child selection/creation, Enrollment family confirmation, Grant, Thread, protected question/reply, Caregiver claim/reply, and current family presentation. My-Chat coordinates identity, surfaces, delivery, and technical recovery without becoming either business owner.

C-4 MUST NOT mutate the qualified C-3 component into an Institution-capable artifact. C-3 qualification requires the Institution surfaces and producers to be absent, and the C-3 candidate pins its Base/My-Chat/Nurture source, manifest, route, schema/migration, runtime, and evidence identities. C-4 therefore uses an explicit additive extension seam:

1. The C-3 manifest fragment, component artifact, source hashes, migration ledger, candidate id, qualification envelope/events, and current-state result remain immutable.
2. A separately versioned `nurture.institution.iib.v1` extension fragment declares only the two C-4 surfaces, C-4 presenters/actions/producers, new source types, and exact dependencies on public C-3 contracts. The extension cannot replace, alias, or fall back to a C-3 route/handler.
3. Base owns a neutral `scenario_extension_composition_source_v1` contract. Composition rejects unknown fragment type, duplicate/colliding surface/action/handler/source keys, missing dependency, changed C-3 hash, partial fragment, invalid order, handler mismatch, or a fragment that re-declares a legacy/C-3 operation.
4. C-4 schema work is an additive migration ledger applied after the exact C-3 ledger. Existing migration files and the C-3 candidate are never edited. The C-4 composite records both ledgers and their order; `prisma/schema.prisma` remains the current repository SSOT without pretending that its later projection changes an old candidate.
5. Packaging/composition MUST consume the exact content-addressed C-3 component artifact or an equivalently isolated pinned build input. Rebuilding unpinned C-3 source from the C-4 working tree cannot satisfy the nested component identity.

The candidate and authority chain is strictly forward-only:

`c3_component_candidate_id -> c4_institution_extension_candidate_id -> c4_composite_candidate_id -> Pilot-0-D complete_pilot_candidate_id -> Pilot-0-E signed decision -> Pilot-1 deployment_binding_id -> Pilot-2 activation row`

The C-4 extension candidate binds only C-4 Base/My-Chat/Nurture sources, fragment, handlers, schema/migration ledger, tests, locks, SBOM, and provenance. The C-4 composite candidate additionally binds the exact nested C-3 component candidate plus the deterministic composition recipe and composed artifact hashes. Neither identity contains a C-3/C-4 qualification result, qualification envelope/event, evidence-run authorization instance, Pilot-0-D topology/operations, Pilot-0-E decision, Pilot deployment, active row, mutable environment value, or evidence produced after candidate assembly.

C-4 evidence runs before Pilot-0-E use `candidate_kind=c4_composite_v1`, profile `nurture_institution_composite_evidence_v1`, and a separately keyed `c4_evidence_run_authorization_v1`. Only `c4_evidence_release_controller` may sign that authorization, with issuer `my-chat.c4-evidence-release`, audience `my-chat.c4-evidence-activation.v1`, and a credential/key/trust/revocation domain isolated from C-3 evidence, C-4 qualification, C0 bootstrap evidence, scenario invocation, Notification, Pilot release, and Technical Operator. The signed envelope binds exact schema/version, authorization id/version, candidate kind and composite id, disposable environment id/class, deployment, synthetic Workspace, scenario/profile, not-before/expiry, operation set `activate_exact_evidence_scope|deactivate_exact_evidence_scope`, issuer/audience/key id, and signature. The append-only My-Chat authority record and current resolver require that exact envelope/version, trusted non-revoked signer, current credential lineage, interval, unsuperseded/unrevoked unique head, and exact environment/candidate/deployment/Workspace/runtime match. The evidence row additionally requires the current C-3 qualification resolver to accept the nested component; that current result is an authorization predicate and never candidate identity. The row cannot target Pilot, staging, production, external traffic, or `complete_pilot_v1`. Pilot-0-E cannot authorize or sign C-4 evidence because E occurs after the complete candidate from C-4 plus D exists.

JI1 uses a second, strictly narrower pre-D authority rather than borrowing the future Pilot provisioning authority. Only `c4_bootstrap_evidence_controller` signs `c4_bootstrap_evidence_authorization_v1`, with issuer `my-chat.c4-bootstrap-evidence`, audience `my-chat.c4-bootstrap-evidence.v1`, and its own key/trust/revocation domain and append-only My-Chat store/current resolver. One signed single-business-effect record binds exact schema/version, authorization id/version, C-4 composite candidate, disposable environment id/class and deployment, synthetic Workspace, authenticated initial-Admin principal binding, disposable C0 provisioning-spec schema/version and canonical payload hash, exact production bootstrap handler revision, Institution bootstrap payload hash, not-before/expiry, sole operation `bootstrap_exact_synthetic_institution`, issuer/audience/key id, and signature. The controller alone generates, signs, stores, custodies, revokes, and destroys that synthetic specification. Its target, store, issuer, audience, and credential cannot alias the real Pilot specification owned later by D.

My-Chat additionally owns one durable body-free `C4BootstrapEvidenceOperationV1` per authorization version. In one Host transaction, a current `active` authorization creates or exact-replays the deterministic operation/request identity and moves to `claimed`; it does not mark success or consume authority before the owner commit. The operation freezes authorization, composite/environment/deployment/Workspace/Admin, accepted-invitation and current-membership evidence, spec schema/hash, handler revision, payload/command hash, idempotency identity, attempt budget/owner-transaction deadline, and status `claimed|committed|closed_no_effect`. Separate fields `quarantineState=clear|outcome_unknown`, typed `quarantineReason=status_unavailable|lock_timeout|possible_inflight|evidence_ambiguous`, quarantine version/time, and attempt ledger make ambiguity explicit; quarantine is not another terminal status. Only the exact claimed operation may call the C0 handler.

Each permitted initial or bounded-retry call carries a fresh short-lived signed `C4BootstrapEvidenceClaimV1` from caller `my-chat-c4-bootstrap-evidence`, issuer `my-chat.c4-bootstrap-evidence`, audience `nurture.c4-bootstrap-evidence-claim.v1`, with an isolated route/verifier and fresh nonce. Before signing and again immediately before dispatch, My-Chat rereads the exact unsuperseded/unrevoked/unexpired claimed authorization, accepted-invitation identity binding, current exact Admin session/principal reauthentication evidence, and current Workspace membership/version. The claim binds those current versions plus stored operation/version, authorization/version, request/command/spec/handler/principal/payload hashes, retry ordinal, issue/expiry, and owner deadline. Revocation or identity/membership drift before dispatch forbids the owner call and allows only exact status recovery; an already dispatched valid attempt may fail closed or commit once within its bounded deadline, but cannot authorize a fresh retry after drift. Nurture validates the claim and exact C0 fixed-operation assertion before the command fence; a claim is not persisted as business authority and cannot call another handler or request. Nurture's deterministic `CommandExecution` fence makes the same request return the original result and forbids a second business effect.

Response-loss resolution uses only private `C4BootstrapExecutionStatusLookupV1`: caller `my-chat-c4-bootstrap-recovery`, issuer `my-chat.c4-bootstrap-recovery`, audience `nurture.c4-bootstrap-recovery.v1`, fixed endpoint/operation, isolated credential/verifier/revocation domain, fresh nonce, and the frozen operation/request/spec/handler/principal bindings. It performs no Participant creation or business command and returns only `committed|confirmed_no_effect|unknown` plus body-free original Execution/result refs when committed. The lookup uses the same deterministic command fence as the C0 writer. `confirmed_no_effect` is legal only after every issued attempt is terminal, the latest claim expiry plus clock skew and bounded owner-transaction deadline have elapsed, the lookup acquires that writer fence, and the fence-protected query proves the exact `CommandExecution` absent. Lock timeout, owner/store outage, an attempt that may still be in flight, compatible-evidence ambiguity, or one/fresh absent read returns `unknown`; absence without the fence never proves no effect. No accepted writer may commit after the fence-protected no-effect classification.

`committed` atomically moves the Host operation to committed, clears quarantine, and consumes the authorization; exact later replay may retrieve that original result but cannot execute new work. `confirmed_no_effect` clears quarantine and may issue a fresh claim only for the same operation/request while authorization, identity, membership, deadline policy, and budget are current; otherwise one Host transaction moves the operation to `closed_no_effect` and revokes/consumes the unusable authorization. `unknown` keeps status claimed and sets `quarantineState=outcome_unknown`; no new claim, operation, effect, evidence seal, or teardown destruction is allowed until an exact later lookup resolves committed or confirmed no-effect. Expiry/revocation while claimed permits only exact status retrieval of a possibly committed result, never a fresh effect. JI1 success requires status `committed` with `quarantineState=clear`; a negative fault run may exercise unknown only if it later converges, while unresolved unknown fails the evidence run and blocks C44/C45. Crash before call, claim-before-send, owner commit before response, status outage/ambiguity, wrong binding, and concurrent replay therefore converge without a distributed transaction. Teardown consumes or revokes the authorization as applicable, requires every operation in `committed|closed_no_effect` with `quarantineState=clear`, destroys the synthetic specification and controller credential, and proves both normal and recovery resolvers inactive. The bootstrap authority cannot name Pilot-0-D, Pilot/staging/production, an external recipient, a second Workspace/Admin/Institution, activation operations, or external traffic; Pilot-0-D remains the sole owner of real Pilot provisioning-spec issuance, custody, deployment, revocation, and rollback.

C-4 qualification uses a separate `c4_qualification_controller`, profile, append-only event chain, envelope, and current-state resolver. The C-3 qualification controller cannot sign C-4 results, and a C-4 result cannot rewrite or supersede a C-3 event. A later complete-Pilot activation predicate must independently resolve current C-3 qualification, current C-4 qualification, the Pilot-0-E decision, and the exact Pilot-1 deployment rather than treating a nested id as current authority.

The exact C-4 evidence Host activation profile is `nurture_institution_composite_evidence_v1`, distinct from qualification profile `pilot0_c4_institution_iib_v1`. The Host profile enumerates the exact immutable `nurture_guardian_caregiver_pilot_v1` bundle plus every C-4 fragment, named source set, surface/action/handler, identity-invitation path, three Handoff bindings, owner resolver/consumer, admission/recovery revision, and required capability. It is used only by disposable `candidate_kind=c4_composite_v1`; partial C-3-only, Institution-only, invitation-only, producer-only, Notification-only, complete-Pilot, or fallback composition is invalid. The profile revision and normalized content hash enter the C-4 extension/composite candidate, while profile activation rows and mutable values do not. Pilot-0-D separately locks exact complete-Pilot activation profile `nurture_institution_complete_pilot_v1`; C-4 evidence does not name, activate, or authorize it.

The following boundaries are fixed for later C-4 checkpoints:

- first-Institution creation remains the single C0 bootstrap exception; ordinary `create_care_institution` is contract-reserved but product-inactive in Pilot-0 and cannot become a second bootstrap;
- Host identity invitation coordination remains a separate signed lane, not `nurture_direct_empty_v1`, `workflow_claimed_step_v1`, a third generic action driver, or Workflow Handoff used as identity payload/authority;
- Institution transfer proposal and service close remain claimed-Step relationship-attention producers; ordinary topology/policy/hold/cancel mutations remain direct-empty unless a later locked C-4 rule names an unavoidable Host effect;
- terminal claimant loss requires an Institution-authorized, body-free, no-takeover closure path before C-4 qualification; a new Caregiver role episode never inherits an old claim;
- all C-4 evidence ends with every environment switch false, active Workspace rows `[]`, activation/bootstrap evidence authorities consumed or revoked, both resolvers inactive, disposable credentials destroyed, and no external traffic.

C-4-0 evidence must prove exact Admin reachability and ambiguity denial; repository-predicate-before-count behavior; board write rejection; workbench-only action preparation; explicit absence of Institution Chat and legacy/C-3 fallback; surface/view/renderer compatibility; owner-field privacy allowlists; immutable C-3 artifact/source/migration identity; extension collision/partial/hash/order negatives; candidate-identity non-circularity; activation-evidence versus bootstrap-evidence controller/store/issuer/audience/trust isolation; exact C-4 evidence profile; synthetic-spec versus D real-spec separation; deterministic bootstrap operation/status recovery with one business effect; teardown and D/Pilot target denial; and no contract/source/schema/manifest/runtime/environment/capability/allowlist/traffic change during planning.

C-4-0 is complete only as a design and implementation-evidence specification. The decision authorizes no Base/My-Chat/Nurture source, package, manifest, schema, migration, route, presenter, action, evidence controller, candidate, database, environment, capability, allowlist, provider, secret, or traffic change. C-4-1 is the next decision checkpoint.

**C-4-1 — Institution/CareGroup topology, policy, staff, and Lead lifecycle (LOCKED / COMPLETE)**

| Sub-checkpoint | State | Decision boundary |
| --- | --- | --- |
| C-4-1a Institution/CareGroup topology actions | **LOCKED** | Exact active Pilot action subset, typed payloads, lifecycle/version/locking, reversible pause, terminal archive, and no hidden cascade. |
| C-4-1b policy revision and readiness | **LOCKED** | Versioned allowlisted Pilot policy revision/binding, derived readiness, no arbitrary JSON authority, and no second business-enable state. |
| C-4-1c Staff Invitation coordination | **LOCKED** | Non-deliverable Host shell, Nurture intent, delivery activation, acceptance callback, cancel/reissue/expiry, and response-loss recovery. |
| C-4-1d Caregiver role, Lead designation, offboarding, and re-invite | **LOCKED / COMPLETE** | Exact role episode, Lead SSOT/binding/uniqueness, no overlap/override, terminal revoke, derived staffing review, and new-role-only rejoin. |

The active Pilot topology/policy domain actions are closed and workbench-only:

| `action_key` | `command_key` | Driver | Pilot effect |
| --- | --- | --- | --- |
| `update_care_institution` | `nurture.institution.update_care_institution` | `nurture_direct_empty_v1` | Update only the allowlisted Institution display profile; no status, parent, legal identity, billing, registration, or arbitrary JSON patch. |
| `create_care_group` | `nurture.institution.create_care_group` | `nurture_direct_empty_v1` | Create one Institution-owned group with typed name, optional age-band key, and bounded capacity. |
| `update_care_group` | `nurture.institution.update_care_group` | `nurture_direct_empty_v1` | Update typed group profile fields only; Institution parent and lifecycle do not move through update. |
| `suspend_care_group` | `nurture.institution.suspend_care_group` | `nurture_direct_empty_v1` | `active -> paused` reversible business fence with no cascade or time extension. |
| `resume_care_group` | `nurture.institution.resume_care_group` | `nurture_direct_empty_v1` | `paused -> active` after current owner/topology/policy/Host-gate reread; readiness is still independently derived. |
| `close_care_group` | `nurture.institution.close_care_group` | `nurture_direct_empty_v1` | Terminal `active|paused -> archived` only after the complete zero-dependent precondition. |
| `update_institution_policy` | `nurture.institution.update_institution_policy` | `nurture_direct_empty_v1` | Create/select one immutable versioned allowlisted Institution Pilot policy revision. |
| `update_care_group_policy` | `nurture.institution.update_care_group_policy` | `nurture_direct_empty_v1` | Bind the exact group to one current compatible Institution policy revision; Pilot has no free-form override. |
| `assign_staff_role` | `nurture.institution.assign_staff_role` | `nurture_direct_empty_v1` | From one consumed Staff Invitation, create only one exact `caregiver + scopeType=care_group` role episode. |
| `designate_lead_caregiver` | `nurture.institution.designate_lead_caregiver` | `nurture_direct_empty_v1` | Create/replace one Lead designation bound to one exact current same-group Caregiver role episode. |
| `revoke_staff_role` | `nurture.institution.revoke_staff_role` | `nurture_direct_empty_v1` | Terminalize only the exact operational Caregiver role and any Lead designation bound to that episode. |

`create_care_institution`, Institution-admin role mutation, `system_operator`, generic role/scope assignment, generic suspend/resume-role, permission-override editing, `upsert_*`, `change_*_state`, self-service Institution registration, and board-card writes are product-inactive and absent from the C-4 Pilot fragment. C0 remains the only first-Institution/first-Admin create path. A planned but undeclared key cannot return runtime `not_implemented` from a real Pilot surface.

Every action uses the exact C-4-0 Institution Admin path, an owner-issued opaque target, expected aggregate and dependency versions, database time, typed canonical payload, strong authorization, `CommandExecution`, and current policy. Client Institution/CareGroup/Participant/Role ids, status, actor, timestamps, reason, policy JSON, permissions, or dependency counts are forbidden. Exact replay returns the original result; a changed payload conflicts; stale version refreshes; owner/store ambiguity denies.

Topology lifecycle is explicit:

1. `update_care_institution` changes only the Pilot display name and an allowlisted public-display profile version. `legalName`, billing/registration, organization hierarchy, profile/philosophy arbitrary payload, Institution pause/archive/delete, and creation of a second Institution remain outside Pilot.
2. `create_care_group` and `update_care_group` accept only bounded `name`, optional allowlisted `ageBandKey`, and optional bounded `capacity`. `rhythmConfigPayload`, policy, parent Institution, lifecycle, readiness, staff, and enrollment effects do not enter a generic update payload.
3. `suspend_care_group` is a reversible current fence. The command writes no Enrollment/Grant/Thread/Message/Item/Attention/role/invitation/provider mutation, extends no TTL, and cannot be represented as a My-Chat capability or allowlist change. New invitation issue/delivery, C-3 business reads/actions, and business delivery/open deny while paused.
4. The Pilot actor path always requires an active Institution. Under an exact paused CareGroup, effect-decreasing actions remain available where their own preconditions hold: cancel/supersede invitation, revoke staff role, cancel transfer, close Enrollment, and close group. Pilot transfer proposal, Guardian review/open, and confirm/decline require the source Group to remain active; the broader pre-Pilot C-2f transfer-out allowance for paused/archived source Groups is not activated by the Pilot profile. Institution pause is not a C-4 product transition and grants no cleanup exception; an inactive Institution denies the ordinary Admin resolver instead of silently widening the actor predicate.
5. `resume_care_group` only restores group lifecycle. The command rechecks active Institution, exact Admin, compatible policy, and Host technical gates, but never overrides a false environment/workspace gate. Missing Lead or other readiness remains a derived unavailable result rather than blocking topology activation or creating a second status.
6. `close_care_group` maps to terminal `archived`, never `deleted`. The command requires zero current Enrollment; zero active/unlinked RosterEntry; zero pending/effective Staff or Enrollment Invitation; zero pending TransferIntent; zero active Caregiver or Lead RoleAssignment; and zero unresolved current family-care/attention work. The action does not end/revoke/delete/notify any dependent in bulk. Admin must use each dependent owner's explicit lifecycle first.
7. Lock order is `CommandExecution/context -> Admin RoleAssignment -> Institution -> CareGroup -> policy binding -> dependent census`. The transaction repeats the complete predicate under lock and rolls back on count/hash mismatch, concurrent insert, overflow, or store failure.

Pilot policy is a typed revision/binding rather than authority-bearing JSON:

1. `NurtureInstitutionPolicyRevision` is an immutable Institution-scoped revision identified by profile key/version, validated canonical payload hash, actor RoleAssignment, database time, status, and predecessor. The only Pilot profile is the exact locked Guardian/Caregiver communication profile; protected AI remains false and no broader data class, direction, retention, health, media, ranking, or cross-Institution rule can be client-authored.
2. `NurtureCareGroupPolicyBinding` binds one CareGroup to one compatible current Institution revision with its own aggregate version/audit. Pilot has no group free-form override. Rebinding requires strong confirmation and cannot reinterpret old facts or extend a Grant/retention/TTL.
3. Existing `policyConfigPayload`, `rhythmConfigPayload`, and `permissionsPayload` remain legacy/non-authoritative for activated C-4. A non-empty RoleAssignment permission override or an unrecognized active policy payload is an activation-preflight fatal, not extra permission.
4. Family-invitation and protected-work readiness is recomputed from active Institution, active CareGroup, exactly one current eligible operational Caregiver role, exactly one valid Lead designation bound to that same role, compatible current policy binding, and current environment/workspace/business gates. Zero or multiple eligible Caregivers, zero or multiple Lead rows, or a Lead bound to a different/noncurrent episode fails closed. Readiness is never persisted as a second CareGroup status or cached authorization.
5. Board readiness exposes safe categories only. Workbench explains allowlisted missing setup steps to the current Admin without exposing child/family content or internal policy-engine reasons.

Staff Invitation uses the separate `scenario_identity_invitation_coordination_v1` lane. `initiate_participant_invitation` remains the locked product key for Staff Invitation issue but is registered as `action_kind=identity_invitation`, not inside ordinary `domain_action_contracts`. C-4 additionally locks `cancel_staff_invitation` and `reissue_staff_invitation` in the same coordination registry. Their Nurture owner commands are `nurture.institution.initiate_staff_invitation`, `nurture.institution.cancel_staff_invitation`, and `nurture.institution.reissue_staff_invitation`. The private acceptance callback remains `nurture.institution.bind_accepted_participant` and is not a product action or business actor.

The coordination sequence is exact:

1. My-Chat authenticates the Admin/workspace/surface and stores a non-deliverable Host invitation shell in `pending_owner_binding`. Raw recipient contact and provider copy remain Host-only. The shell exposes to Nurture only a signed opaque shell ref, a purpose-specific opaque recipient-binding ref, workspace/scenario, bounded expiry request, and request hash.
2. Nurture verifies C-4 signed ingress, resolves the Admin/Institution/CareGroup/current policy, and atomically creates one `NurtureStaffInvitationIntent` plus `CommandExecution`. The intent is fixed to `caregiver`, exact CareGroup, exact Host shell/recipient binding, issuer Participant+RoleAssignment, seven-day database expiry, canonical hash, version, and audit. The intent grants no Participant, role, Lead, caregiver surface, or protected access.
3. My-Chat receives or replay-recovers the exact owner binding, atomically changes the same shell to `deliverable`, and writes its Host invitation/Outbox effect. Only then may provider delivery start. Provider retry keeps the same shell and Nurture intent.
4. The Host shell declares exactly one membership disposition: `new_workspace_member` or `existing_current_member`. The first branch uses exact-recipient acceptance to commit authentication/workspace membership. The second requires current-membership reread, exact-recipient reauthentication, and explicit acknowledgement of this new staff-invitation purpose; an `already_member` response alone neither accepts the shell nor consumes the intent. Both branches emit the same signed private `invitation_continuation`, which rechecks shell/intent/binding/expiry/current Institution/Group, binds or reuses one workspace `NurtureParticipant`, and atomically consumes the Staff Invitation intent. The callback is not a Participant, cannot become the business actor, and grants no role or Lead.
5. The Admin subsequently strong-confirms `assign_staff_role` against the consumed intent, exact accepted Participant, intended CareGroup, current policy, and versions. Role/scope/recipient drift requires a new invitation; the consumed intent cannot be repurposed.

`NurtureStaffInvitationIntent` lifecycle is `pending|consumed|cancelled|superseded`; effective expiry is derived when database time reaches `expiresAt`. One effective pending intent exists per exact `(workspace, Institution, CareGroup, recipient-binding, caregiver purpose)`. Cancel and reissue use expected version and first-commit-wins. Reissue terminalizes the old intent, creates a new identity/shell/binding/seven-day window, and records one-way `supersedesInvitationId`. Terminal intents never reopen. A Host provider resend is not a business reissue.

The invitation saga is recoverable without Workflow Step or Handoff:

- response loss after Nurture commit replays the same shell/request/command and returns the original intent binding;
- response loss after shell activation recovers from My-Chat's same shell/Outbox identity;
- changed shell, recipient binding, Institution, Group, role purpose, expiry, or payload conflicts;
- Nurture denial terminalizes the non-deliverable shell without provider work;
- cancel versus consume and reissue versus acceptance are first-commit-wins; accepted Host membership is not rolled back when the Nurture intent loses, but no Participant role or business authority is granted;
- Host acceptance after Nurture expiry/cancel/supersede may retain ordinary workspace membership while the Nurture callback denies safely;
- store/owner/provider outage never converts a shell or intent into authorization.

Caregiver and Lead authority uses exact role episodes:

1. `assign_staff_role` creates only `role=caregiver`, `scopeType=care_group`, exact group, `permissionsPayload=null`, unique `sourceStaffInvitationIntentId`, granting Admin role, start time, and aggregate version. That Restrict FK is unique across Caregiver role identities: one consumed intent creates at most one Caregiver role episode, exact replay returns that identity, changed target/payload conflicts, and terminalizing the role never clears or reuses the intent. Under the Pilot profile, the transaction locks the target CareGroup, accepted Participant, and complete Workspace/scenario Pilot operational-role census and requires zero other current eligible human Caregiver anywhere in that Pilot cohort, including the same Participant in another Group or another Participant in any Group. The reusable schema needs no global unique constraint, but the activated action-layer predicate and lock order make the one-human rule executable and stronger than duplicate Participant/Group prevention. Pilot forbids Admin/Caregiver overlap and all active `system_operator` roles.
2. Lead is a separate `NurtureCareRoleAssignment` with `role=lead_caregiver`, `scopeType=care_group`, and required `leadForCaregiverRoleAssignmentId`, a same-table Restrict FK to a different exact current Caregiver row whose Participant and CareGroup are identical. A row self-loop is invalid. Lead alone grants no teacher read/action. Policy JSON, CareGroup field, invitation label, first-staff inference, or Host role is not another Lead SSOT.
3. Exactly one active Lead designation may exist per CareGroup. Zero is not ready; more than one is an integrity failure. `designate_lead_caregiver` locks the Group, target Caregiver role, and current Lead; same exact target may return `already_satisfied`, while replacement terminalizes the old Lead row and creates a new identity atomically.
4. `revoke_staff_role` targets only an exact operational Caregiver role in Pilot. The command terminalizes that role and every Lead designation bound to the exact role episode in one transaction. Participant, Host membership, invitation/acceptance history, authorship, Execution, other independently valid scope, and audit remain.
5. Terminal role identities never reactivate. Database time treats elapsed `endsAt` as terminal for every current predicate without waiting for a sweep; before assigning/re-inviting, the same transaction locks the Group/role/Lead census and persists terminalization of any status-active but elapsed Caregiver row plus its bound Lead before testing the zero-current-Caregiver invariant. Exact/concurrent normalization is idempotent and audited. Re-inviting the same canonical user follows a new Staff Invitation intent/acceptance and creates a new Caregiver role episode plus new Lead designation; the existing Participant may be reused. The new episode cannot read, reply, redact, inherit, or complete an Item claimed by the old episode.
6. Role terminalization is never blocked by acknowledged work. C-3 current predicates deny the old role immediately; the canonical Item/Attention graph derives body-free staffing-review cases for C-4-4. No auto-reassignment, claim transfer, new-role takeover, hidden reply, or operator edit is permitted.
7. Temporary Host loss, policy outage, group pause, or a nonterminal suspended role is a reversible current fence and not Staff Invitation cancel, role revoke, Lead replacement, or staffing closure.

C-4-1 evidence must cover every action allow/deny cell; board write denial; typed-payload/JSON/permission/system-operator negatives; create/update/version/lock races; group suspend/resume with zero cascade and no Host-gate bypass; Pilot active-source-only transfer denial while paused/archived; group close with each nonzero dependency and concurrent insert; policy revision/binding drift; readiness zero/one/multiple Caregiver and zero/one/multiple Lead; two-Admin/two-invitation assignment races proving one Group Caregiver; exact invitation shell/intent/delivery/accept/callback/role sequence; all response-loss/cancel/reissue/expiry/drift races; raw-contact non-disclosure; acceptance without role; role without consumed invite; Lead without exact Caregiver; elapsed-`endsAt` normalization versus re-invite/assign races; same-user re-invite/new role episode; Admin/Caregiver overlap; offboarding with old claimed work; preservation of Participant/authorship/other scope; legacy fixture/fallback denial; and final default-off/no-traffic planning scope.

C-4-1 is complete only as a design and implementation-evidence specification. No contract/package, source, manifest fragment, schema, migration, policy revision, invitation shell/intent, route, presenter, action, runtime, candidate, database, environment, capability, allowlist, provider, secret, or traffic changed. C-4-2 roster and Enrollment Invitation IIB is next.

**C-4-2 — roster and Enrollment Invitation IIB (LOCKED / COMPLETE)**

| Sub-checkpoint | State | Decision boundary |
| --- | --- | --- |
| C-4-2a Institution-local roster lifecycle | **LOCKED** | Minimal unverified intake, exact scope, correction/closure, one-time Enrollment linkage, and no child/profile authority. |
| C-4-2b Enrollment Invitation issue coordination | **LOCKED** | Non-deliverable Host shell, Nurture owner intent, delivery activation, exact recipient, and no Workflow driver/Handoff. |
| C-4-2c accept, decline, cancel, reissue, and expiry | **LOCKED** | Host acceptance is identity evidence only; first-commit-wins intent lifecycle and C-3 prospective continuation remain separate. |
| C-4-2d family confirmation boundary and re-entry | **LOCKED / COMPLETE** | Family-owned profile/Guardian decision, atomic Enrollment link/consume, no implicit Grant, and fresh terminal re-entry identities. |

The ordinary Institution roster actions are exact and workbench-only:

| `action_key` | `command_key` | Driver | Pilot effect |
| --- | --- | --- | --- |
| `create_institution_roster_entry` | `nurture.institution.create_roster_entry` | `nurture_direct_empty_v1` | Create one institution-local, unverified, unlinked intake record in an exact active CareGroup. |
| `correct_institution_roster_entry` | `nurture.institution.correct_roster_entry` | `nurture_direct_empty_v1` | Correct only allowlisted unverified intake fields while the entry remains unlinked. |
| `close_institution_roster_entry` | `nurture.institution.close_roster_entry` | `nurture_direct_empty_v1` | Terminalize only an unlinked entry with no effective Enrollment Invitation. |

`NurtureInstitutionRosterEntry` uses canonical `status=active|linked|closed` plus nullable typed `terminalReason`. `active` means institution-local intake only and is not an Enrollment-ready or authority state. `linked` may be written only by the C-3 `confirm_family_enrollment` transaction that creates the exact Enrollment, consumes its exact invitation, and writes the canonical ChildCareProcess link. `closed` is terminal and requires exactly one server-owned reason: `manual_unlinked_close|unverified_intake_retention_expired|enrollment_withdrawn|institution_service_ended|enrollment_transferred`. Manual/retention close requires no process/Enrollment link; the three Enrollment reasons require the retained exact process/Enrollment binding and may be written only by the owning Enrollment terminal transaction. This later normalization supersedes C-2f's historical shorthand that called those three reason/history classes Roster statuses `withdrawn|ended|transferred`; no such second status enum is implemented. No delete, reopen, merge, generic status mutation, move between Institution/Group, or duplicate-child resolution action exists in Pilot.

The RosterEntry stores exact workspace/Institution/CareGroup, a bounded nullable institution-local display label, optional allowlisted age-band or birth prefill with explicit Institution/unverified provenance, lifecycle/version, creator/corrector Execution refs, the nullable canonical ChildCareProcess link written only at Enrollment confirmation, and server-owned personal-data expiry/erasure evidence. Status-aware constraints require the unverified label while an active intake is usable, permit only a Guardian-confirmed safe label after link, and require label/prefill null after erasure/de-identification; physical nullability is therefore intentional and cannot mean an unknown active identity. The row stores no raw contact, My-Chat user/account/Child/Family id, stewardship, Family membership, scenario binding, Nurture anchor/association candidate, Host acceptance, invitation lifecycle, family/Guardian identity, verified legal/birth data, health/media/care narrative, Grant, Thread, or protected content. Invitation correlation belongs to `NurtureEnrollmentInvitationIntent`; a singular Host invitation ref on the RosterEntry is forbidden because cancel/reissue creates a lineage rather than replacing one mutable pointer.

Unverified roster PII has an exact Pilot retention contract. Its absolute `intakePersonalDataExpiresAt` is database `createdAt + 30 days` and cannot be extended by correction, resend, cancel, decline, expiry, or reissue; every invitation expiry must be no later than that boundary. Manual unlinked close erases label/age/birth prefill in the same transaction. Cancel, decline, or invitation expiry with no effective successor sets `purgeAt=min(intakePersonalDataExpiresAt, terminalIntentAt + 7 days)`; a valid reissue before purge may continue only inside the unchanged absolute boundary. At `purgeAt`, the retention worker locks the entry/intent lineage, verifies it remains unlinked with no effective invitation, writes `closed + unverified_intake_retention_expired`, nulls every unverified label/age/birth field, and retains only a body-free refs/status/time/reason/Execution audit shell. A new attempt after erasure requires a new RosterEntry and never reconstructs old fields.

Family confirmation before that boundary atomically replaces the unverified display label with the Guardian-confirmed safe roster label and clears every Institution age/birth prefill; it never promotes those fields into the child profile. The linked/historical safe label is visible only under current owner policy within the fixed 365-day Pilot relationship-history window, after which the label is de-identified while the body-free audit shell follows business-audit retention. The erasure ledger is replayed before restored backups may serve; backups age out within 30 days and cannot revive erased prefill. Workbench/current/history, exports, caches, search, logs, support/admin evidence, and fixtures must obey the same tombstone/de-identification boundary.

Roster create/correct may occur before full invitation readiness, but issue requires the current C-4-1 readiness predicate. Correct is unavailable after linkage and cannot silently update a Guardian-owned child profile. Close requires the entry to remain unlinked, zero effective pending invitation, zero Enrollment, and no active confirmation context; a pending invitation must first be cancelled or superseded. A linked entry closes only through the owning Enrollment terminal transaction defined by C-2f/C-4-3. Institution label uniqueness is a local usability check at most and never identity, deduplication, existence disclosure, or authorization. Name, date, age, raw contact, or similarity matching across RosterEntries or child profiles is forbidden.

Enrollment Invitation uses `scenario_identity_invitation_coordination_v1`, not an ordinary domain-action driver. The Institution operations are `initiate_enrollment`, `cancel_enrollment_invitation`, and `reissue_enrollment_invitation`; their Nurture owner commands are respectively `nurture.institution.initiate_enrollment`, `nurture.institution.cancel_enrollment_invitation`, and `nurture.institution.reissue_enrollment_invitation`. These keys live in the extension's identity-invitation coordination registry, not `domain_action_contracts`, and use neither `nurture_direct_empty_v1`, `workflow_claimed_step_v1`, Workflow Run/Step, Handoff, nor Outbox as business authority. Recipient-side `decline_enrollment_invitation` remains the already locked C-3 prospective operation and cannot be invoked by an Institution actor.

The issue sequence is exact:

1. My-Chat authenticates the exact Institution Admin/workbench and creates one non-deliverable `pending_owner_binding` Host shell. Raw recipient contact, delivery address, provider content, authentication, membership, and acceptance remain Host-only.
2. Nurture verifies signed ingress and the opaque purpose-specific recipient binding, then rechecks active Institution/Group, exact Admin, one current exact-group Lead backed by its Caregiver role, policy, gates, active unlinked RosterEntry, capacity, and absence of an effective pending intent.
3. One Nurture transaction creates `NurtureEnrollmentInvitationIntent` plus `CommandExecution`. The intent binds exact workspace/Institution/Group/RosterEntry, issuing Participant+Admin role, opaque Host shell/recipient refs, seven-day database expiry, canonical payload hash, version, audit, and optional same-Institution terminal predecessor Enrollment required only for fresh re-entry.
4. My-Chat receives or exact-replay-recovers that owner binding, atomically makes the same shell deliverable and creates its Host invitation/Outbox. Provider retry retains the same shell and intent; owner denial terminalizes the unused non-deliverable shell without provider work.
5. Exact-recipient Host acceptance independently establishes authentication/workspace membership. The signed `invitation_continuation` then enters the C-3 prospective/Guardian application service without consuming the Enrollment intent, creating Enrollment/Grant/Thread, or treating Host membership as family authority.

`NurtureEnrollmentInvitationIntent` lifecycle remains `pending|consumed|cancelled|superseded`; effective expiry is derived at database time `now >= expiresAt`, and Pilot expiry is exactly seven 24-hour periods from issue. Exactly one effective pending intent may exist for one RosterEntry. Exact issue replay returns the original shell/intent; changed Institution, Group, RosterEntry, recipient binding, expiry, re-entry predecessor, or canonical payload conflicts.

Any current exact-Institution Admin may cancel a pending intent; the exact authenticated recipient may decline through C-3. Both produce terminal `cancelled` with distinct allowlisted actor/reason evidence. Reissue never edits or extends a pending intent: one command terminalizes the current intent as `superseded`, creates a fresh RosterEntry-bound intent/shell/recipient binding/seven-day window, and records one-way `supersedesInvitationId`. Provider resend is technical retry and not business reissue. Cancel, decline, reissue, expiry, and Enrollment consume are expected-version first-commit-wins; a losing stale path cannot reopen or consume a terminal intent. Host membership already committed before a Nurture denial remains ordinary Host membership and grants no Nurture role or scope.

After Host acceptance, the qualified C-3 identity path owns all family decisions. The exact recipient explicitly creates or selects one current platform Child/Family pair. The shared durable operation reuses both valid bindings, reuses one while adding the other, or adds both; Nurture reserves only missing typed anchors, one My-Chat transaction commits/exact-replays every missing binding, and one Nurture transaction creates or resolves the workspace-local Child/ChildCareProcess/child-scoped Family, first Guardian, and both associations. Conflicting existing or operation-partial evidence quarantines; `outcome_unknown` status recovery reuses the same operation. An existing current Guardian explicitly selects only an owner-resolved same-workspace association. No Institution actor, Roster value, or prefill can perform, seed, or default this operation, and an incomplete operation remains invisible and unavailable. Neither branch consumes the Enrollment intent. The recipient may then decline and retain independently confirmed platform/local family facts, or strongly confirm `confirm_family_enrollment`. Only that separate C-3 transaction may consume the exact pending intent, create the active Enrollment, link the RosterEntry, and consume the submit context atomically. It creates no Grant or Thread; the family later confirms the separate C-2e Grant.

Ordinary first entry has no predecessor. Re-entry after a terminal same-Institution Enrollment requires a fresh RosterEntry, shell, invitation intent, context, Enrollment, later Grant, and later Thread; the intent binds the exact current terminal lineage leaf and continuity kind. A transfer-ended row with a current successor is not an eligible predecessor. Entry to a different Institution is ordinary fresh entry with no predecessor linkage. Generic invitation discovery cannot reinterpret history as re-entry, and no old roster, Enrollment, Grant, Thread, Message, Receipt, Item, Attention, notification, context, claim, or role authority moves into the fresh episode.

C-4-2 evidence must cover every roster action/surface allow/deny cell; active/linked/closed transitions and typed terminal reasons; correction-after-link and close-with-pending-intent denial; concurrent correction/close/issue/Enrollment-link/retention-worker races; local-label non-authority; raw-contact/platform-id/anchor/profile-field absence; exact 30-day absolute unverified horizon, terminal-intent seven-day purge, manual-close immediate erasure, reissue no-extension, linked confirmation prefill clearing/safe-label replacement, 365-day label de-identification, backup/restore erasure replay/no revival, and tombstone-only presenters; exact shell -> intent -> deliverable -> acceptance -> qualified C-3 parent-owned identity continuation; empty-anchor, partial binding pair, local response loss, changed payload, binding revoke/outage, wrong pair, association conflict, and exact replay; seven-day expiry; cancel/decline/reissue/consume first-commit-wins; provider resend versus business reissue; Host membership retained after owner denial; no Step/Handoff/business authority leak; all three JI3 journeys/scopes plus separate conformance of all four binding-resolution branches; independently confirmed facts retained after decline; no implicit Grant; exact three-Roster/three-invitation Pilot topology; and fresh re-entry/different-Institution/predecessor negatives.

C-4-2 is complete only as a design and implementation-evidence specification. No Base/My-Chat/Nurture contract, package, source, fragment, schema, migration, RosterEntry, invitation shell/intent, route, presenter, action, runtime, candidate, database, environment, capability, allowlist, provider, secret, or traffic changed. C-4-3 Institution Enrollment operations and relationship-attention producers is next.

**C-4-3 — Institution Enrollment operations and relationship-attention producers (LOCKED / COMPLETE)**

| Sub-checkpoint | State | Decision boundary |
| --- | --- | --- |
| C-4-3a Institution hold and release | **LOCKED** | Institution-side Hold only, shared same-side authority, direct-empty result, and no cascade or opposite-side release. |
| C-4-3b same-Institution transfer proposal/cancel | **LOCKED** | Claimed proposal, body-free Guardian review audience, direct-empty cancel, and C-3 confirm/decline ownership. |
| C-4-3c Institution service close | **LOCKED** | Independent terminal authority, atomic C-2f closure, all-current-Guardian relationship update, and no countersignature/compensation. |
| C-4-3d fresh re-entry and Notification consumption | **LOCKED / COMPLETE** | C-4-2 invitation reuse, exact terminal predecessor, current recipient-role owner reread, safe destinations, expiry, replay, and no backfill. |

The Institution Enrollment matrix is exact and workbench-only:

| `action_key` | `command_key` | Driver | Host effect |
| --- | --- | --- | --- |
| `suspend_enrollment` | `nurture.institution.suspend_enrollment` | `nurture_direct_empty_v1` | Place only the shared institution-side `NurtureEnrollmentPauseHold`; explicit `[]`. |
| `resume_enrollment` | `nurture.institution.resume_enrollment` | `nurture_direct_empty_v1` | Release only the institution-side Hold; explicit `[]`, and aggregate may remain paused. |
| `propose_enrollment_transfer` | `nurture.institution.propose_enrollment_transfer` | `workflow_claimed_step_v1` | Commit one TransferIntent and one cohort-level `review_enrollment_transfer` draft containing the exact commit-time Guardian RoleAssignment set. |
| `cancel_enrollment_transfer` | `nurture.institution.cancel_enrollment_transfer` | `nurture_direct_empty_v1` | Terminalize only the pending proposal; explicit `[]`. |
| `close_enrollment` | `nurture.institution.close_enrollment` | `workflow_claimed_step_v1` | Commit terminal Institution service end and one cohort-level `enrollment_relationship_changed` draft containing the exact commit-time Guardian RoleAssignment set. |

No Institution board, Institution Chat, Caregiver/Lead/Operator/service/AI/raw-id path, generic `change_enrollment_status`, `pause_institution_enrollment`, direct `transfer_enrollment`, `end_enrollment`, Guardian countersignature, or alias is registered. `initiate_enrollment` remains the C-4-2 identity-invitation operation for first entry and exact same-Institution re-entry; the operation is not a lifecycle-domain driver and never reactivates a terminal row.

Institution hold/release uses the existing C-2f `NurtureEnrollmentPauseHold` contract. Any current exact-Institution Admin may place or release the one shared institution-side Hold after five-minute strong confirmation; placement actor is audit, not personal ownership. Neither command may release the family-side Hold, terminalize or mutate Grant/Thread/content/work, extend clocks, create a notification, or override an upper Host/Group/Institution gate. Enrollment status is recomputed from both side-owned holds in the same Serializable transaction. Exact replay and fresh already-satisfied outcomes never rewrite actor/time; stale same-side/cross-side/terminal races require current reread.

Transfer proposal uses the C-2f `NurtureEnrollmentTransferIntent` unchanged: exact active source Enrollment/version, no active Hold, different ready target Group in the same Institution, proposing Admin role, seven-day derived expiry, one effective pending, canonical hash, and no target RosterEntry/Enrollment/Grant/Thread at proposal. The claimed Step must be durably persisted, bound, and currently claimed before the first Nurture commit. The same Nurture transaction persists the Intent, `CommandExecution`, and immutable `guardian_relationship_attention` replay seed. The transaction captures every current exact-Family Guardian RoleAssignment in one typed owner-owned cohort and emits exactly one stable draft for purpose `review_enrollment_transfer`; zero eligible recipients stores explicit `[]`, never changes the driver, and creates no later backfill. My-Chat materializes at most one Handoff, then derives stable per-recipient Notification candidates under that Handoff.

`cancel_enrollment_transfer` requires current exact-Institution Admin, expected source/intent versions, and strong confirmation, but has no new Host effect. Cancel versus Guardian confirm/decline, pause, close, withdrawal, new work, capacity/readiness drift, or another proposal is first-commit-wins under Enrollment-first locking. C-3 Guardians alone confirm or decline. Confirmation atomically ends the source, creates the target Roster/Enrollment lineage, and closes old Grant/work; decline/cancel leave source topology unchanged. Neither outcome creates another Handoff. Any already delivered proposal Notification owner-rereads the current Intent and renders completed/declined/cancelled/expired/stale safely rather than becoming action authority.

`close_enrollment` is independent Institution service-end authority. The action applies to active or paused Enrollment, requires five-minute strong confirmation, maps only to `ended + institution_service_ended`, needs no Guardian countersignature, and cannot impersonate withdrawal or transfer. The C-2f Enrollment-rooted Serializable transaction closes Holds, pending TransferIntent, exact Roster, active Grant, Thread, contexts, Receipt/Item/Attention dependents, and body-derived projections under the bounded zero-survivor cascade while preserving RoleAssignments, child/family facts, Message/authorship, retained history, other Institution relationships, and all My-Chat technical ledgers. Fault, overflow, phantom, survivor, or race rolls back the whole business unit.

Institution service close also requires the original durable claimed Step before commit. The closure transaction captures every current exact-Family Guardian RoleAssignment in one typed owner-owned cohort and stores exactly one stable `guardian_relationship_attention` draft for purpose `enrollment_relationship_changed`; zero current Guardians stores explicit `[]` and still uses the same Step. My-Chat materializes at most one Handoff and creates at most one logical Notification candidate per exact `(Handoff, recipient RoleAssignment, continuity key)`. Notification/Handoff/provider success is never a terminal commit condition and cannot compensate the committed closure. A later Guardian role is not backfilled, and a later same-user role episode cannot consume a candidate addressed to the old role.

The additive relationship-attention contract remains separate from `user_attention`:

| Purpose | Allowed source | Destination | Current owner reread |
| --- | --- | --- | --- |
| `review_enrollment_transfer` | `enrollment_transfer_intent` plus exact source `enrollment` | `family_workbench/current` | Exact current recipient Guardian role, Family/Process, current source Enrollment/holds, and current pending/not-expired Intent. |
| `enrollment_relationship_changed` | terminal `enrollment` | `family_workbench/history` | Exact current recipient Guardian role and Family/Process plus retained exact terminal Enrollment history; active Enrollment or Grant is not required. |

The cohort-level draft key binds workspace, scenario, purpose, source identity/version, and the canonical hash of the exact commit-time recipient RoleAssignment set. No individual recipient episode creates another draft or Handoff; it enters only the My-Chat candidate/link identity beneath the one Handoff. Recipient membership is frozen at the Nurture commit; exact same-Step replay is byte-equivalent, another Step cannot obtain the seed, partial candidate materialization is idempotent, and late join never backfills. Transfer review expires no later than its Intent. Relationship-change attention expires at seven days or an earlier allowlist cutoff. Provider copy is the fixed generic body-free message `有一项托育关系更新待查看`; no child/Institution/Group/Guardian name, state, reason, business ref, or protected data leaves owner storage.

My-Chat carries Notification id only. Create/send verifies the frozen opaque recipient binding and current owner delivery check; open first authenticates the exact historical My-Chat recipient/workspace/Notification, then verifies the typed Handoff source and current exact recipient RoleAssignment episode before Nurture owner reread. Transfer review opens only the current workbench review; relationship change opens only safe retained history. Recipient exit/suspension/new role episode, source mismatch, policy/owner outage, stale/expired notification, wrong user/workspace, or resolver ambiguity yields generic unavailable with no body/action leak. Provider/read/unread state never becomes Enrollment or TransferIntent authority.

Fresh same-Institution re-entry reuses only C-4-2 `initiate_enrollment` from one owner-resolved terminal lineage leaf. The new invitation is addressed to the exact current Guardian selected for the predecessor process; C-3 confirmation creates fresh Roster/Enrollment and explicit `[]`, followed by a separate fresh Grant. Different-Institution entry remains ordinary fresh entry with no continuity edge. Neither the service-close notification nor historical workbench route can create, select, or authorize re-entry.

C-4-3 evidence must cover all action/surface/actor/alias cells; every Hold combination and cross-side denial; proposal zero-Hold/readiness/capacity/version rules; durable claimed-Step-before-commit; exact Guardian cohort and draft-key stability; cancel/confirm/decline/pause/close/new-work races; transfer atomic cutover/no carryover; service-close active/paused and complete zero-survivor cascade; zero/two/changed Guardian audiences; response loss/same-Step reclaim/wrong-Step denial; duplicate/partial materialization; terminal-history resolver without active Enrollment/Grant; old-role/new-role recipient denial; stale/expiry/current-open behavior; provider and owner outages; generic-copy/privacy scans; no late backfill; re-entry exact predecessor; and final default-off/no-traffic planning scope.

C-4-3 is complete only as a design and implementation-evidence specification. No Base/My-Chat/Nurture contract, package, source, fragment, schema, migration, Hold/Intent/Enrollment/Handoff/Notification row, route, presenter, action, runtime, candidate, database, environment, capability, allowlist, provider, secret, or traffic changed. C-4-4 terminal-claimant staffing review, safe states, and continuity is next.

**C-4-4 — terminal-claimant staffing review, safe states, and continuity (LOCKED / COMPLETE)**

| Sub-checkpoint | State | Decision boundary |
| --- | --- | --- |
| C-4-4a derived staffing-blocked case | **LOCKED** | Exact terminal claimant episode, acknowledged unreplied Item, active Attention, body-free derivation, and no second aggregate. |
| C-4-4b Institution closure action | **LOCKED** | Strong workbench-only unfulfilled close, claimed Step, no takeover/reply, exact local transition, and precedence/races. |
| C-4-4c family status attention | **LOCKED** | Separate body-free Handoff key/purpose, commit-time Guardian cohort, generic delivery, current owner recent view, and no C-3 contract widening. |
| C-4-4d safe rendering, disablement, fault, and privacy | **LOCKED / COMPLETE** | Board/workbench/family/teacher states, protected-field exclusion, business-versus-technical disable, recovery, accessibility, and leakage evidence. |

A staffing-blocked case is a derived owner query, not a new business aggregate or reassignable queue. The exact domain predicate is one C-3 family-care Item with `status=acknowledged`, no linked reply, an active linked Teacher Attention, `ackedByParticipantId`, `ackedByRoleAssignmentId`, and `assignedToRoleAssignmentId` all bound to the same exact operational Caregiver role episode, while that exact role is authoritatively terminal. Database time at query/commit treats elapsed `endsAt` as terminal without waiting for an asynchronous status sweep; a same-row nonterminal suspension is not terminal. Temporary Host loss, Enrollment Hold, Group pause, policy/owner outage, or technical disable alone never creates a case. Once the terminal-claimant predicate exists, Group pause or either/both Enrollment Holds do not erase or hide that body-free owner fact, although active Institution, current Admin, owner/policy availability, and technical gates still control presentation/action. An open unclaimed Item is not blocked and may later be acknowledged by the sole current eligible Caregiver. A replied, closed, expired, suppressed, redacted, permanently Grant/Enrollment-fenced, or structurally inconsistent Item is not actionable staffing review.

No `NurtureStaffingReviewCase`, shadow work owner, assignment history, takeover token, or derived-body cache is added. Institution queries begin from the exact owner-qualified Institution and select the Item/Attention/terminal-role conjunction before counting or paging. The derived identity is the opaque exact Item aggregate version plus claimant-role terminal version and Attention version; if any component changes, a prepared action becomes stale. Multiple claimant ids, missing typed role binding, role not in the exact Group, nonterminal role, or incomplete Item graph fails closed for reconciliation rather than creating a case.

The one Pilot action is:

| `action_key` | `command_key` | Driver | Exact effect |
| --- | --- | --- | --- |
| `close_staffing_blocked_family_care_item` | `nurture.institution.close_staffing_blocked_family_care_item` | `workflow_claimed_step_v1` | Close one exact acknowledged/unreplied staffing-blocked Item as operationally unfulfilled, resolve its active Attention, and seed generic status attention for the eligible commit-time family cohort. |

Only a current exact-Institution Admin may prepare the action from `institution_workbench/current`. The five-minute strong-confirmation copy states that the original request cannot be completed by another staff member, no reply or care outcome will be fabricated, eligible current Guardians may later receive only a generic status update, delivery is not the business commit condition, and the old claimant/history remains immutable. The Admin has no notification toggle and cannot select recipients; the owner eligibility predicate alone produces one cohort-level draft containing every eligible role or explicit `[]`. Board, Institution Chat, Caregiver/Lead/Operator/service/AI/raw-id, bulk close, generic Item close, reassignment, reopen, reply-on-behalf, or claimant-edit paths are absent.

The original durable My-Chat Step must be persisted, bound, and currently claimed before the first Nurture write. One Serializable transaction resolves exact replay; locks context/Admin and terminal claimant roles, Enrollment and Holds, Institution/CareGroup, Grant, source Message, Item, Receipt, Event boundary, Attention, and protected projection in the established global order; rechecks the derived predicate, policy, versions, and current family cohort; obtains database time; writes the C-4 extension graph `Item acknowledged -> closed`, typed `terminalReason=claimant_role_ended_unfulfilled`, `closedAt`, one `closed` ItemEvent owned by the Institution Execution, `Attention active -> resolved` with `resolutionReason=claimant_role_ended_unfulfilled` and exact `resolvedByExecutionId`, `CommandExecution`, and the immutable status-attention replay seed. At this commit the linked reply remains null and source Receipt remains `acknowledged`; no caregiver reply Message, org-to-family Receipt, authorship, care fact, Grant mutation, Thread advance, claim transfer, or new assignee is created. Historical claimant/assignment refs remain immutable audit and never authorize reads. The C-4 extension validator/adapter recognizes this complete graph as the only new no-reply resolved variant; the adapter does not alter the immutable C-3 `replied <-> resolved` variant.

`closed` is an operational terminal result and must not be represented as `suppressed`: suppression remains privacy/authorization invalidation and cannot be reused to hide an unfulfilled business outcome. The new typed terminal reason is server-owned and cannot enter client input, generic Notification copy, Guardian-facing staff explanation, or cross-Institution analytics. If staffing close commits first and a privacy root later wins, Item status/reason/time/Execution and the body-free closed Event remain immutable while the source Receipt/body/context/current projection converge under the existing redaction/Grant/Enrollment/retention cascade; the already resolved Attention stays body-free and non-actionable. If a privacy/topology root wins first, that cascade removes the staffing action and creates no staffing-status Handoff. This privacy-after-close branch is an explicit C-4 extension invariant, not an assumption that every C-3 closed presentation graph already existed.

The race/precedence rules are exact:

1. Terminal role versus reply uses role/Item versions and first-commit-wins. Reply committed while the exact role was current yields `replied` and no staffing case; role terminalization first permanently denies reply and derives the case.
2. Staffing close versus source redaction, Grant invalidation, Enrollment terminal closure, Item expiry, or another close is first-commit-wins. A permanent privacy/topology root that commits first uses its existing cascade and the staffing action returns current non-actionable without a new seed. Staffing close first remains closed; later privacy work only applies its own visibility/projection rules.
3. Temporary fence recovery never creates or closes a staffing case. Terminal role identities never reactivate, and a same-user new role episode cannot take over, read the old protected question as receiver, reply, redact, complete, or consume the old claim.
4. Exact response-loss replay returns the original closure and byte-identical seed. A new command against the already exact closed result may return safe `already_satisfied` without attributing closure to the later actor or creating a second Handoff. Wrong-Step or changed versions/payload conflicts.

Family status delivery uses a third, separately versioned C-4 contract rather than widening either pinned C-3 Handoff:

| Contract field | Locked value |
| --- | --- |
| `handoff_key` | `family_care_status_attention` |
| purpose | `family_care_operational_closure` |
| source context type | `family_care_item` |
| destination | `family_board/recent` |
| recipient | One typed owner-owned cohort in the sole draft contains every current exact-Family Guardian RoleAssignment captured at close commit. |
| expiry | Seven days or earlier allowlist cutoff. |

The C-4 fragment owns the producer, complete-graph validator/adapter, source resolver, delivery check, and continuity binding. The adapter maps the new typed closed graph into the immutable C-3 family's already versioned unknown-safe terminal DTO shape (`progress=acknowledged`, `entryLifecycle=terminal`, generic closed state) without editing the C-3 presenter contract or candidate. C-4 does not edit the C-3 `user_attention` or `guardian_relationship_attention` declarations, source lists, purpose lists, consumers, routes, or candidate hashes. Zero eligible current Guardians stores explicit `[]`; the path remains claimed. A nonempty commit freezes one stable cohort-level draft and creates at most one Handoff; exact replay is byte-equivalent. My-Chat derives per-recipient candidates under that Handoff with stable `(Handoff, recipient RoleAssignment, continuity key)` identities. Late join is never backfilled, and a later same-user Guardian role cannot inherit an old Notification.

Provider copy is fixed generic text such as `一项托育沟通事项状态已更新，请查看`, with Notification id only and no child/Institution/Group name, staff identity/change, unfulfilled reason, question/reply body, urgency, category, business ref, or action. The staffing close may commit under the narrow cleanup exception while Group/Hold fences are active, but status-attention candidate creation and every provider send/retry have a stricter delivery predicate: exact current recipient role and Family/Process reach; active Institution and CareGroup; nonterminal active Enrollment with zero family/institution Hold; exact current/effective original Grant; retained and unredacted source; exact status-attention source/Handoff; current policy, expiry, and technical gates. Grant revoke, expiry, replacement, or owner-role terminal loss; Enrollment terminal/non-active/Hold; Institution/Group non-active; source redaction/retention expiry; binding drift; or gate loss before send terminally marks that namespaced materialization/delivery candidate `skipped` and never emits OS push. After an already sent generic push, interactive open separately rechecks the same active/no-Hold/effective-Grant fences plus recipient/Family reach and owner presentation rules: while paused/held it is unavailable; after recovery and still within the original horizon it may perform a fresh owner read, but a terminal Grant/Enrollment/redaction/retention change may return only a family-owned closed shell, current tombstone, or unavailable, never protected content or an action. The family board may show the Guardian's own currently authorized original question shell/body under its independent owner policy plus `已确认但未完成，事项已结束`; the presentation never shows claimant identity, staffing event, Institution audit reason, or a fabricated reply.

Surface rendering is closed:

- `institution_board/current` shows only bounded per-Group staffing-blocked counts and readiness/navigation, exposes no action or per-child breakdown, and does not claim anonymity for the small cohort.
- `institution_workbench/current` shows an owner-paginated body-free case with opaque ref, institution-local roster label, safe Group label, received-age bucket `today|1-3d|4-7d|over7d`, fixed state/consequence, and the one close action. History shows the same safe shell plus closed time class. The workbench excludes question/reply/summary/detail, Guardian/family/contact, claimant identity, raw role/item/message/grant/enrollment refs, urgency/safety flags, policy reasons, and runtime/claim/provider data.
- Caregiver Chat/teacher board never offers takeover. A newly staffed role may see at most an allowed body-free terminal group-history shell after owner reread, never the old protected body, claim, action, draft, or Notification.
- Family board/recent is the sole status-notification destination. Family workbench history remains ordinary user navigation, and generic Chat may explain the safe terminal state only after the normal family presenter reread; no status Notification opens Chat or carries content.

Business and technical disablement remain distinct. With the Institution still active, CareGroup pause is a reversible business fence and either/both Enrollment Holds may remain active, but the effect-decreasing staffing close remains available to the exact Admin when every other closure precondition passes; close does not resume the Group or release Holds. These temporary fences alone never derive the case, and once the exact claimant is terminal the fences do not erase the derived case. Owner/policy outage or a false environment/workspace/capability/admission gate blocks new presentation/action/claim/materialization/send/open and does not auto-close the Item. If Nurture committed before technical disable, the Item closure remains canonical while the original Step/Handoff enters the locked disabled-recovery path and no new delivery/backfill occurs. Re-enable requires current gates and never revives the old role, action, skipped candidate, or notification.

All three surfaces must provide bounded loading, empty, current-changed, unavailable, permission-denied, retryable owner-outage, and processed-but-unavailable states without stale protected content. Workbench strong confirmation is keyboard/screen-reader reachable, copy remains non-diagnostic and non-accusatory, destructive intent is explicit, locale/font scaling is verified, and back/navigation clears ephemeral action refs. Logs, metrics, traces, screenshots, support/admin views, DTOs, Step/Handoff/Outbox/Notification/provider payloads, cache/PWA/search, and evidence bundles contain only body-free reason class and opaque bounded refs.

C-4-4 evidence must cover exact derived predicate and every excluded temporary/permanent state; no second aggregate; predicate-before-count; all surface/action/actor aliases; old/new/same-user role episodes; terminal-role/reply and privacy/topology/expiry/close races; one transaction Item/Event/Attention/Execution/seed; no Message/reply/claim transfer; typed closed versus suppressed semantics; claimed-Step binding/same-wrong Step/response loss/partial materialization; zero/one/two Guardian cohort and no backfill; distinct contract/manifest/source/route collision negatives; family recent/current tombstone states; board/workbench/teacher privacy; loading/error/accessibility; the full active/paused Group × family/institution/both Holds × Grant current/revoked/expired/replaced/owner-role-terminal delivery/open matrix; close-allowed versus send-skipped separation; both technical kill orders; owner/provider/dead-letter recovery; privacy scans across every persistence/transport/render/evidence destination; and final false/empty/no-traffic planning scope.

C-4-4 is complete only as a design and implementation-evidence specification. No Base/My-Chat/Nurture contract, package, source, fragment, schema, migration, Item/Event/Attention/Step/Handoff/Notification row, route, presenter, action, runtime, candidate, database, environment, capability, allowlist, provider, secret, or traffic changed. C-4-5 cumulative adoption, evidence, qualification, and exit is next.

**C-4-5 — cumulative adoption, evidence, qualification, and exit (LOCKED / COMPLETE)**

C-4 implementation may start only after explicit implementation authorization and a current C-3 resolver result of `C3_QUALIFIED_DEFAULT_OFF` for one exact immutable `c3_component_candidate_id`. A design-complete document, repository branch, source commit, old X5 test result, fixture, locally rebuilt C-3 package, or cached qualification label is not the prerequisite. A nested C-3 invalidation or supersession blocks C-4 evidence and complete-Pilot composition immediately; a replacement C-3 candidate creates a new C-4 composite identity and reruns every affected C-4 edge.

#### Late cross-repository child/family identity reconciliation

My-Chat revision `db22de66c2e58fec5e24be0150458b36c02e9682` introduced a schema-only target for platform `Child`, `Family`, stewardship, membership, creation authorization, and scenario binding while leaving its migration unapplied and runtime/consumer cutover open. C-3/C-4 adopts the ownership direction, not that incomplete revision as implementation evidence. The prior C-3 shorthand that My-Chat has no canonical Child/Family identity or stable cross-scenario correlation is superseded. The replacement boundary is exact:

1. My-Chat owns the minimum protected platform Child/Family identity, lifecycle, stewardship/membership, and scenario-binding ledger. The platform child is not a login account; platform family is a collaboration identity, not a legal-household or care dossier claim.
2. Nurture owns each workspace-local `NurtureChild` scenario profile, `NurtureChildCareProcess`, child-scoped `NurtureFamily`, Participant/RoleAssignment, Enrollment, Grant, Thread/content, stage/care/media facts, and every scenario policy or lifecycle result. Platform stewardship, membership, creation authorization, or binding is never sufficient Nurture read/write authority.
3. Nurture adds one scenario-global, body-free `NurtureChildBindingAnchor` and `NurtureFamilyBindingAnchor` endpoint. A My-Chat `ChildScenarioBinding.ownerRef` or `FamilyScenarioBinding.ownerRef` points only to the matching typed anchor, never directly to a workspace-local `NurtureChild`, `NurtureChildCareProcess`, or child-scoped `NurtureFamily`. Anchors use random opaque ids, contain no name, birth fact, contact, dossier, workspace, role, Grant, consent, lifecycle decision, or product-query authority, and cannot be listed, searched, filtered, or supplied by a client. They are reserved only under current My-Chat steward/bind authorization and may appear only in the My-Chat binding, Nurture anchor/association persistence, the short-lived private signed current-owner envelope, or the separately authenticated reconciliation boundary. They never enter UI, Chat, Notification, Handoff, Outbox/provider, log/trace/metric, analytics, search, vector, shared/business cache, or qualification/operational evidence body.
4. Nurture stores workspace associations separately. One current child association is unique for both `(workspaceId, childAnchorId)` and `(workspaceId, nurtureChildId)`; current family associations are unique for `(workspaceId, familyAnchorId, childAnchorId)`, `(workspaceId, nurtureFamilyId)`, and `(workspaceId, childCareProcessId)`. Composite FK/check/deferrable constraints require every linked row to share the Workspace, the Process `childId` to equal the Child association's local Child, the local Family to point to that exact Process, and every current Family association to depend on the same current Child association. Thus one Family anchor may support multiple children without permitting family-anchor-only expansion. Product resolution validates Workspace plus Host evidence, performs one exact compound association lookup, then immediately reads local role/scope and all Nurture predicates; it has no ordinary `listByAnchor`, cross-workspace count, or existence API. The separately authenticated reconciliation port is body-free, audited, and cannot render or mutate business facts.
5. Pilot evidence uses one Workspace and exactly one child per platform Family, but neither limit becomes a permanent My-Chat or Nurture uniqueness rule. One global platform Child/Family and its scenario anchor may later serve separately authorized workspace-local Nurture dossiers without making those dossiers mutually visible. Cross-workspace Nurture presentation, dossier/content/history movement, role/Enrollment/Grant carryover, profile merge, or authority carryover remains Pilot `NO-GO`; the earlier future copy-and-reconfirm identity design is withdrawn from activation and must later be redesigned as reuse of the current platform identity plus a separate explicitly consented scenario-data transfer, if any.
6. My-Chat `Child.displayName` and encrypted birth date remain platform identity facts and are not persisted or synchronized into Nurture. `NurtureChild.displayName` is an independently Guardian-entered workspace-local care label with no platform source version; a platform rename cannot silently rewrite it. `NurtureChild.birthDate` is `NULL` for activated bound rows, and Nurture receives only an explicitly policy-allowed derived age/stage value. Platform archive/delete/restore changes current Host routing eligibility but does not delete the local label or Nurture history; cache/search/export residual scans enforce that no platform identity field was copied. Existing Nurture identity-like values never seed or auto-match a platform Child/Family and fail activation preflight until explicitly reconciled. Institution `RosterEntry` prefill remains a separately retained provisional label and never defaults either owner's form.
7. Parent-first platform identity and Institution-invited Nurture onboarding compose through one recoverable non-Workflow identity saga. A parent may create the platform Child/Family before any Nurture invitation, but Pilot creation of the first same-workspace Nurture relationship begins only after exact Host invitation acceptance establishes or reuses the adult account/actor/workspace membership. The adult explicitly creates or selects one current platform Child plus Family combination under current stewardship/membership and exact `FamilyChildMembership`. The durable Host operation rereads both binding heads and chooses one legal branch: reuse both; reuse Family/add Child; reuse Child/add Family; or add both. Nurture reserves only missing typed anchors, and one My-Chat transaction commits/exact-replays all missing bindings. Wrong kind/ownerRef, ambiguous head, mismatched pair, or a partial commit from this operation quarantines it. One Nurture transaction rereads signed current binding/workspace evidence and creates or resolves the local Child/Process/Family, first Guardian, and both associations while creating no Enrollment, Grant, Thread, or protected work. The operation tracks `prepared|bindings_committed|local_committed|closed_no_effect` plus `clear|outcome_unknown`; a writer-fenced Nurture lookup returns `committed|confirmed_no_effect|unknown`, and unknown blocks replacement work. Empty bound anchors remain unique/invisible/reusable and quota-bounded; only never-bound zero-association reservations retire normally, while bound-empty supersession requires separate owner proof. Only after `local_committed` may Enrollment and later Grant run. Cancellation/decline/expiry preserves committed owner facts. A future invitation-free Nurture relationship entry requires its own product/surface/authority decision and is not implied here.
8. An Institution with no participating parent may create only the locked RosterEntry plus Enrollment Invitation intent/shell. Institution Admin, Caregiver, staff membership, roster label, contact, birth fact, media, or organization authority cannot mint/select/merge a platform Child/Family. The optional parent-authorized institutional `ChildCreationAuthorization` path remains outside the Pilot profile.
9. Co-Guardian onboarding is a versioned two-owner saga: the inviter must hold both current Nurture Guardian and Host Family-invite authority; exact Host acceptance creates/exact-replays recipient Workspace and Family membership before the stable Nurture operation may create the Guardian RoleAssignment. Each owner recovers independently, either fact alone grants nothing, and cancel/expiry/self-exit/revoke never compensates the other owner's committed fact. Binding revoke/supersession, Child/Family archive/delete, Child merge redirect, anchor/owner-version drift, ambiguity, or Host resolver outage stops routing, aggregation, cache/deep-link open, and new Nurture action/delivery fail-closed without rewriting local facts. Child-binding loss fences only that Child; Family-binding loss fences that Family across its children; `FamilyChildMembership` loss fences only the exact pair; and one adult's Family-membership loss fences only that adult. A merge whose target resolves to another anchor is quarantined. Pilot performs no automatic anchor/profile merge or rebind; Technical Operator may stop routing and request a separately authorized future owner command but cannot edit either identity or dossier.
10. C-3 adoption adds the sixth public source identity `platform_child_family_identity_source_v1`, covering the exact generic binding-envelope dependency, completed My-Chat Child/Family owner contract, schema/migrations, runtime/APIs and lifecycle, the Nurture typed-anchor/workspace-association schema and adapters, and joint pair-binding/revoke/merge/recovery/privacy conformance. `c3_component_candidate_id`, the C-3 evidence profile, and every C-4 composite pin its exact normalized hash. C-4's existing `scenario_identity_invitation_coordination_source_v1` and `my_chat_identity_invitation_runtime_source_v1` populations additionally pin the Institution-invited Roster-only-to-parent-bound saga; no fourteenth C-4 source id is invented for a public C-3 dependency.

The live My-Chat checkout at `db22de6` therefore invalidates the old assumption that the locked `a1b5e64` workflow revision alone is a sufficient future C-3/C-4 dependency, but it does not authorize a pin bump. `db22de6` has no complete identity runtime, scoped cardinality, Nurture adoption, applied migration, or qualification evidence. C-3 must be implemented and requalified against the completed identity contract before C40 starts; Pilot-0-D must pin that qualified C-3 dependency and cannot absorb the schema-only commit by revision relabeling.

The implementation DAG is strictly serial:

| Node | Owner and implementation content | Exit gate |
| --- | --- | --- |
| `C40` shared additive contracts | My-Workflow-Base: neutral extension-composition and identity-invitation coordination contracts, additive manifest/host-capability types, codecs/validators, legacy/vNext/negative fixtures, source normalization, and conformance only. C40 may start only after the exact public `platform_child_family_identity_source_v1` is already present in the current qualified C-3 component. | Base remains scenario/runtime/database/UI and platform-identity neutral; legacy behavior unchanged; every partial/collision/unknown/no-capability fixture is fatal; exact revision/hash published; no schema-only identity revision is treated as adoption. |
| `C41` Host adoption and isolated control stores | My-Chat: exact C40 adoption over the completed qualified C-3 identity owner APIs; fragment loader/composer; Institution board/workbench route/render support; Roster-only invitation shell orchestration; provisional-to-parent-owned anchor/binding/local-association continuation and exact pair recovery; status/relationship Notification bindings; isolated C-4 activation-evidence, single-business-effect bootstrap-evidence authorization plus durable bootstrap operation/recovery, and qualification stores/controllers/resolvers; every capability default false. | Contract hash matches Base; public identity source hash matches the nested C-3 component; legacy/C-3 component unchanged; no active Workspace row; persistence/privacy/authority/cross-controller/partial-pair/response-loss negatives and controller recovery pass. |
| `C42` Nurture Institution domain | The-Nurture: exact C41 dependency; additive C-4 migration ledger; typed Institution/Admin/Group/policy/staff/Lead/roster/invitation/Enrollment/staffing fields, repositories, resolver/policy/runner, presenters/actions, direct-empty and identity-invitation paths. Roster/intent never mint or persist platform identities/anchors and cannot create a local profile before the qualified parent-owned C-3 continuation completes. | Domain/DB/migration/replay/race/privacy tests pass; C-3 identity/anchor migration, source, and artifact are immutable; non-empty producers remain disabled; no My-Chat technical or platform-identity table/state enters Nurture. |
| `C43` extension composition and durable producers | Three repositories: `nurture.institution.iib.v1` fragment, deterministic composition over the exact C-3 component, claimed transfer/service-close/staffing producers, the existing C-3 `user_attention` plus separate relationship/status Handoff bindings, owner sources/consumers, invitation joint recovery, route/current-owner checks, source pins, and default-off composite assembly. | Composite conformance, per-owner atomicity plus cross-database idempotent recovery/fault conformance, same/wrong-Step, duplicate/partial materialization, invitation response-loss, current owner send/open, mixed-version/hash/route negatives pass; one immutable C-4 extension and composite candidate freeze. |
| `C44` joint/rendered/fault/privacy evidence | Disposable exact-candidate environment under current `c4_evidence_run_authorization_v1`; JI1 additionally claims and closes one current `c4_bootstrap_evidence_authorization_v1` through the durable exact-operation/status-recovery protocol. Real authenticated Institution/family/Caregiver surfaces, real C0 handler and invitation continuation, exact three-child/four-Guardian/one-human-Caregiver topology, joint journeys, accessibility, privacy scans, fault matrix, KMS/restore path where inherited from C-3, and rollback. | Required layer L0–L7 evidence passes; high-risk set passes three consecutive fresh namespaces without test retry/candidate/config change; JI1 bootstrap is `committed` with `quarantineState=clear`; every negative bootstrap operation is in `committed|closed_no_effect` with `quarantineState=clear`; both evidence authorities inactive/revoked; every switch false, active Workspace rows `[]`, credentials destroyed, environment torn down, no external traffic. |
| `C45` pre-seal, qualification, and C-4 exit | Three repositories: evidence index/final census/limitations seal, qualification genesis/envelope/event, current resolver, source/adoption ledger, final independent review, and Pilot-0-D design handoff. | Zero open `QR-P0/QR-P1`; one exact composite candidate; current nested C-3 and C-4 resolvers both accept; success emits only the locked default-off status. |

No node may be skipped, combined with a later node, declared complete from design evidence, or run against mutable source. C40 must land before C41; C41 before C42; C42 before C43; C43 freezes candidates before C44; C44 evidence seals before C45. A code/config/schema/manifest/lockfile/toolchain/dependency/input change after candidate freeze produces a new extension/composite candidate and reruns C43–C45 plus every earlier gate affected by the change. A failed test rerun alone, manual database repair, evidence row edit, waiver, or evidence copied from C-3/legacy/X5 cannot qualify.

Candidate identity remains non-circular:

1. `c4_institution_extension_candidate_id` binds exact Base/My-Chat/Nurture C-4 source revisions and normalized source-set hashes; extension fragment/handlers; additive migration ledger and checksums; route/renderer/owner-source registries; test/lock/toolchain/SBOM/provenance; and default-off build configuration. The identity contains no C-3 source rebuild or mutable evidence/result/authority data.
2. `c4_composite_candidate_id` binds the exact current qualified `c3_component_candidate_id`, exact C-4 extension candidate, deterministic composition recipe/tool revision, dependency order, composed manifest/artifact/schema/migration/source hashes, and collision/compatibility result. The nested component is content-addressed and not rebuilt from the C-4 working tree.
3. Evidence authorization instance, deployment/runtime instance, synthetic Workspace, evidence index, qualification envelope/event/result, Pilot-0-D topology/operations, Pilot-0-E decision, Pilot-1 deployment binding, Pilot-2 active row, mutable environment value, provider state, and evidence created after assembly are excluded from both candidate identities.
4. Every evidence row nevertheless binds the exact composite candidate, disposable deployment, environment, Workspace, test/fixture version, dependency/result digests, database migration checksums, controller authorization, and time. A row cannot move across candidate kinds or revisions.

C-4 adoption sources are separately named and pinned. The exact source-set registry is:

| Source-set id | Owned population |
| --- | --- |
| `scenario_extension_composition_source_v1` | Neutral Base extension-composition contract, codec, validator, normalization, and conformance fixtures. |
| `scenario_identity_invitation_coordination_source_v1` | Neutral Base/Host invitation-shell, owner-binding, continuation, existing-member/new-member branch contracts, and an exact dependency on the public `platform_child_family_identity_source_v1`; it carries no platform id or Nurture dossier body. |
| `nurture_institution_domain_source_v1` | Nurture Institution/CareGroup/policy/staff/Roster-only provisional/Enrollment/staffing commands, policies, transactions, presenters, adapters, and owner resolvers; no Institution-created platform or local Child/Family path. |
| `nurture_institution_schema_source_v1` | Nurture additive C-4 Prisma projection, ordered migration ledger, constraints, indexes, and DB context hash. |
| `nurture_institution_manifest_source_v1` | C-4 extension fragment, action/handler/source/purpose/destination declarations, module export, and generated manifest hash. |
| `my_chat_institution_surface_source_v1` | My-Chat Institution board/workbench route registry, generic renderer bindings, action orchestration, and authenticated surface tests. |
| `my_chat_identity_invitation_runtime_source_v1` | My-Chat Staff/Enrollment shell persistence, Roster-only invitation, exact-recipient acceptance, parent-owned Child+Family pair continuation, anchor/binding/local-association partial-failure recovery, owner-binding activation, replay, and cancellation runtime. |
| `my_chat_institution_workflow_runtime_source_v1` | Claimed-Step composition, materializer/Outbox/Notification/Admin recovery, activation admission, disabled-recovery revisions, and exact `nurture_institution_composite_evidence_v1` profile registry/content used by C-4. |
| `user_attention_binding_source_v1` | Exact pinned existing `user_attention` contract/materializer/owner resolver/consumer binding, unchanged from C-3. |
| `guardian_relationship_attention_binding_source_v1` | Exact pinned `guardian_relationship_attention` contract, transfer/service-close producers, owner resolver, routes, and consumer binding. |
| `family_care_status_attention_binding_source_v1` | New `family_care_status_attention` contract, complete-graph adapter, producer, owner resolver, route, materializer, delivery, and open binding. |
| `c4_evidence_authority_source_v1` | C-4 activation-evidence and bootstrap-evidence authorization schemas, disposable synthetic-spec ownership, durable bootstrap operation, isolated status-recovery lane, controllers, stores, issuers/audiences, trust/revocation, verifiers/resolvers, and teardown commands. |
| `c4_qualification_authority_source_v1` | C-4 qualification envelope/event schemas, controller, store, signer/trust/revocation, CAS chain, and current resolver. |

The composite also pins the exact public C-3 source-set ids and hashes already listed by `c3_component_candidate_manifest_v1`; the composite never relabels those sets as C-4 inputs. Every source-set registry row has a separate normalized hash in the extension/composite manifests. Relabeling the historical handoff hash, omitting or merging a row into one undifferentiated `contract_hash`, accepting local `file:` resolution, or allowing generated/manifest/runtime drift is fatal.

The required evidence layers are:

| Layer | Required proof |
| --- | --- |
| `L0 integrity` | Exact revisions/hashes, reproducible extension/composite artifacts, migration order/checksums, lock/SBOM/provenance, no C-3 mutation, secret/license/vulnerability gates, and no local-link ambiguity. |
| `L1 contract` | Base neutrality; legacy unchanged; strict extension/manifest/action/surface/invitation/Handoff/route/capability conformance; every positive and negative cell. |
| `L2 owner domain/DB` | Exact Institution predicates, typed lifecycle/schema constraints, CommandExecution/replay, all transactions/races/faults, privacy allowlists, and no technical-state ownership drift. |
| `L3 two-database joint` | Host invitation sagas, claimed Step/Handoff/materialization/Outbox, owner reread, response loss, duplicate/partial work, provider/dead-letter/Admin recovery, and no distributed compensation. |
| `L4 rendered authenticated` | Real public auth/session and generic Host renderers for Institution board/workbench plus C-3 family/Caregiver surfaces, Notification/deep link, current refresh, loading/empty/error/permission, accessibility, and locale/font scaling. |
| `L5 safe manual` | Reviewer-observed end-to-end checkpoints with capture-time protected-region exclusion/masking, observer attestation, no unmasked intermediate write, and sanitized artifact/tool-cache scans. |
| `L6 repeat fault/privacy` | High-risk lifecycle, identity, role-episode, invitation, Step/Handoff, provider/open, disable/rollback, KMS/retention/restore, and leakage set passes three fresh namespaces with no test retry. |
| `L7 rollback/closure` | Gate removal, in-flight convergence, activation/bootstrap evidence authority consumption/revoke, both resolver-inactive proofs, disposable credential/environment destruction, final false/empty census, limitations, and no external traffic. |

The qualifying rendered/joint journeys are exact:

| Journey | Required path and closure |
| --- | --- |
| `JI1 topology` | `c4_bootstrap_evidence_controller` issues the exact synthetic spec/authorization -> My-Chat identity-invitation service issues the matching Host invitation -> exact initial Admin authenticates, accepts it, and commits Workspace membership -> current accepted-invitation/membership evidence is reread -> current bootstrap authorization atomically claims deterministic `C4BootstrapEvidenceOperationV1` -> fresh exact-bound claim assertion calls the real production C0 handler and exact idempotent command -> direct response or exact recovery lookup converges to committed and consumes authority -> Institution workbench creates Group/policy -> board current readiness -> workbench current/history; board write and Institution Chat deny. Bootstrap authority never substitutes for invitation acceptance. |
| `JI2 staff` | Admin Host Staff Invitation shell -> Nurture intent -> delivery -> recipient accept/membership -> Participant -> exact Caregiver role -> exact-role-bound Lead -> ready; acceptance-without-role and Lead-without-Caregiver deny. |
| `JI3 three families` | Three local RosterEntries -> three Host/Nurture Enrollment Invitations -> exact recipient acceptance -> real C-3 platform/anchor/local-association saga -> family confirmation -> three active Enrollments -> separate family Grant/Thread. Family-1 and Family-2 create their platform Child/Family pairs through real parent-owned My-Chat paths before invitation but have no local association at acceptance. Family-1 establishes its local relationship once. Family-2 establishes it after acceptance, proves response-loss/exact recovery, discards or expires only the short-lived continuation context while keeping the Enrollment invitation pending, then starts a fresh continuation and explicitly selects the now-current local association. Family-3 creates its platform pair after invitation acceptance. The cohort ends with exactly three platform Child/Family pairs, three typed anchor pairs, three workspace-local child/family associations, and three child scopes. Family-1 then adds one My-Chat Family member and one Nurture Co-Guardian through independent transitions, yielding exact Guardian `2+1+1`. |
| `JI4 holds` | Institution hold -> family current denial -> independent family hold -> Institution release leaves paused -> family release restores only after all current gates; zero cascade/clock change/notification. |
| `JI5 transfer` | In the Family-1/C1 path, the source Group remains active. Admin revokes T1's source-group Caregiver+Lead episode, creates/configures the temporary target Group, and uses a fresh existing-member Staff Invitation acknowledgement to create T1's target-group Caregiver+Lead episode before proposing transfer; target readiness is exact and the Pilot never uses paused/archived-source transfer-out. Admin claimed proposal -> two Guardian Notifications/current owner review -> one exact Guardian confirms atomic old/new cutover -> old work closed, no carryover -> separate fresh target Grant; a distinct fresh branch proves Admin cancel and stale Notification. At no instant are two Caregiver role episodes or Lead rows active for T1, and there is no backup human Caregiver. |
| `JI6 service close/re-entry` | In the Family-2/C2 namespace, Admin claimed service close -> its one current Guardian receives generic relationship change -> family history owner reread -> exact fresh re-entry invitation -> C-3 confirmation -> fresh Enrollment and later Grant/Thread with old history/authority isolated. |
| `JI7 claimant offboarding` | In the Family-3/C3 namespace, family question -> Caregiver acknowledge -> exact role revoke -> old body/action denied -> Institution body-free staffing case -> claimed operational close -> its one eligible current Guardian may receive generic family status -> same user follows the explicit `existing_current_member` reauthentication/acknowledgement branch, receives a fresh Staff Invitation intent/new role, and still cannot take over the old claim. Zero/two-recipient status cohorts remain separate contract tests. |
| `JI8 disable/rollback` | CareGroup business pause versus environment/workspace technical disable across direct, invitation, claimed business commit, materialization, provider, and open seams -> canonical facts preserved -> pending work settled/stopped/skipped -> re-enable does not backfill or revive authority -> final false/empty teardown. |

JI1–JI8 use the same versioned fixture contract and exact composite candidate, but every journey starts from a fresh isolated namespace and one shared **blank fixture**, not from precreated platform Child/Family or Nurture business facts and not from one mutable sequential database. The blank fixture contains only the disposable candidate/environment/deployment, isolated authenticated adult account identities, browser/session slots, the synthetic Workspace target, and current evidence-controller prerequisites; it contains no platform Child/Family/stewardship/family-membership/scenario binding, anchor/association, Institution, Participant, Nurture role, CareGroup, roster, local Family/Child, Enrollment, Grant, Thread, Message, or Item. JI1 executes the real invitation/bootstrap/topology prefix. JI2 executes that namespace-local JI1 setup anew with fresh authorization/operation/Execution identities, then performs staff onboarding. JI3 creates the preconditions for its three family journeys/scopes through real parent-owned application paths inside that fresh namespace—never DB seed—then runs the three Institution invitations and exact continuation; domain/conformance evidence separately exercises all four binding-resolution branches. JI4–JI8 each execute the real authenticated namespace-local JI1 -> JI2 -> JI3 setup prefix anew before their named delta; this is fresh setup execution, never exact business replay. JI5 cutover and cancel/stale-Notification branches each use a separate fresh namespace and independently execute the prefix. Setup-prefix evidence is part of that journey, cannot be injected through DB writes, and is separately correlated even when helper automation drives the same public/private paths.

After the prefix, the qualifying cohort is one Institution, one active CareGroup, exactly three platform Child/Family pairs and anchor pairs, three workspace-local child scopes/child-scoped families, four Guardians distributed `2+1+1`, one human operational Caregiver T1 with one current group-scoped role and a separately bound Lead row, one Institution Admin, and Technical Operator as refs-only. Family-1 has two current My-Chat Family memberships and two separately current Nurture Guardian roles; the other families have one of each. JI5 alone creates a temporary target Group and moves T1 through non-overlapping source-role termination then target-role creation; JI7 alone revokes/re-invites the same user. No backup human Caregiver, simultaneous multi-Caregiver work, simultaneous multi-group role episode, reassignment, bulk action, Institution Chat, ranking, protected AI, cross-workspace dossier portability, external family, real provider recipient, or production data enters qualification.

Every journey must prove the user-visible success path and its highest-risk denial. Contract/domain tests remain exhaustive and rendered evidence is representative rather than a Cartesian UI matrix, but no surface root, prepare/confirmation/result/unavailable class, Institution action, invitation kind, claimed producer, recipient destination, or business/technical disable class may lack at least one rendered or joint proof. Synthetic direct DB setup is limited to isolated negative/domain tests; JI qualifying facts must arise through the real authenticated application paths in the stated order. JI1 additionally proves exact Host invitation issue/authentication/acceptance/membership/current-evidence reread; bootstrap authorization issue/current resolution/claim; crash before owner call, claim-before-send, commit-before-response-loss, exact committed-result recovery, confirmed-no-effect bounded same-operation retry, unknown quarantine, wrong-request/principal/spec/handler/Workspace denial; new-effect replay denial; exact committed replay without a second effect; consume/revoke/destroy; and rejection of Pilot-target or Pilot-0-D authority substitutions.

C-4 qualification uses profile `pilot0_c4_institution_iib_v1`. Only `c4_qualification_controller`, with issuer `my-chat.c4-qualification`, may sign both envelope schema `c4_composite_qualification_v1` for audience `my-chat.c4-qualification-envelope.v1` and event schema `c4_composite_qualification_event_v1` for audience `my-chat.c4-qualification-event.v1`. Its credential/key/trust/revocation domain, append-only My-Chat store, verifier, and current resolver are isolated from C-3 qualification, both C-4 evidence controllers, scenario invocation, Pilot release, Notification, and Technical Operator. Completed C40–C44 evidence first produces a body/secret-free prequalification seal over the composite candidate, nested current C-3 result, evidence-index digest, L0–L7 result digests, three-run identities, final false/empty census, rollback proof, known limitations, and Pilot-0-D/E/Pilot-1/2 negative inventory. The seal is immutable and is not qualification. The signed envelope binds exact schema/version, deterministic `qualification_envelope_id`, profile, composite candidate, exact nested C-3 component and current qualification digest, pre-seal/evidence-index/L0–L7/final-census/rollback/limitations digests, result `qualified_default_off|rejected`, database issue time, issuer/audience/key id, and signature; no event id, mutable head, deployment, D/E, activation row, environment value, or protected data enters the envelope.

The event chain is partitioned only by `(qualification_profile, c4_composite_candidate_id)`. Every signed event contains exact schema/version, deterministic idempotency id, profile and composite candidate, qualification-envelope id where applicable, result `verifying|qualified_default_off|rejected|invalidated|superseded`, predecessor id/hash, evidence-index/L0–L7/final-census digests, body-free reason class, database time, issuer, audience, key id, and signature. The sole controller CAS-appends the deterministic predecessor-free signed `verifying` genesis, signs the exact envelope, and CAS-appends one `qualified_default_off|rejected` child against the unique current head. The current resolver validates exact candidate/envelope/digests, issuer/audience/schema, trusted non-revoked key and signatures, unique predecessor/head chain, current nested C-3 qualification, final false/empty census, and current event before C45 success exits. Crash after genesis reuses the same deterministic event and resumes the terminal append; changed seal/evidence conflicts and may only reject. Allowed later transitions are `qualified_default_off -> invalidated|superseded`, `rejected|invalidated -> superseded`, with `superseded` terminal. No event restores the same candidate to verifying/qualified. Store/verifier/key outage, revoked signer, broken/duplicate head, stale envelope, nested C-3 invalidation, or ambiguity returns unqualified immediately.

The high-risk repeat set includes every invitation response-loss/accept/cancel/reissue/expiry race; roster link and duplicate successor; empty/wrong-kind anchor, Child-only or Family-only binding, binding-only/membership-only, duplicate/wrong-workspace association, Child/Family membership drift, one Family with multiple children, global binding revoke versus local relationship close, merge redirect/conflict quarantine, and source/hash drift; Hold/transfer/service-close faults; claimant-role/reply/privacy/topology races; same/wrong-Step and zero/partial/duplicate Handoff materialization; owner/provider/dead-letter/open; old/new role episodes; stale Notification/deep link; contract/hash/manifest/route/migration drift; environment/workspace gate loss at every admission/commit boundary; KMS/retention/restore behavior inherited from protected C-3; stable-id/anchor leakage and cross-workspace existence/count scans; and rollback in both disable orders. Each of three fresh namespaces must show one identity/local aggregate per exact operation, one business effect, at most one Handoff per claimed effect, no unauthorized content, no terminal-skip backfill, and no hidden retry.

Rollback removes the synthetic Workspace activation row and disables the environment bundle, in either order, then settles the exact in-flight state through the locked outcome-unknown/current-owner recovery. Rollback never deletes or rewrites Institution, Group, policy, role, roster, invitation, Enrollment, Grant, Message, Receipt, Item, Attention, Execution, or audit facts. Already displayed generic OS push cannot be recalled but opens unavailable/current. Re-enable requires a new authorized run/current qualification and never replays a cancelled invitation, skipped candidate, expired context, old role, old claim, or notification. Qualification ends only after both the C-4 activation-evidence and bootstrap-evidence authorizations are consumed/revoked as applicable, both disposable controller credentials and the environment are destroyed, both current resolvers deny, all switches are false, active Workspace rows are `[]`, and no external traffic occurred.

The only allowed successful C-4 implementation status is:

`C4_QUALIFIED_DEFAULT_OFF / PILOT0_D_DESIGN_LOCKED /
COMPLETE_PILOT_CANDIDATE_PENDING / EXTERNAL_TRAFFIC_NO_GO`

The status proves the Institution extension/composite implementation against one immutable, currently qualified C-3 component while default-off. Pilot-0-D topology/operations is separately design-locked, but its implementation and complete candidate remain pending. The status is not candidate assembly, Pilot-0-E Go, Pilot-1 deployment, Pilot-2 activation, staging, production, GA, cohort expansion, ACR publication, cloud secret/KMS custody, provider enablement, or external traffic authorization. Pilot-0-E later reviews the resulting immutable complete candidate and D evidence seal. Pilot-1..4 remain separately authorized.

Pilot-0-C4 and Pilot-0-C are `DECISION COMPLETE / IMPLEMENTATION OPEN / EXTERNAL TRAFFIC NO-GO` after product, domain/privacy, and cross-repository final rereviews plus the clarity repair returned `DR-P0=0 / DR-P1=0 / DR-P2=0`. No C40–C45 node, C-3/C4 candidate, qualification store/event/result, contract package/product source/manifest/fragment/schema/migration, route/UI/presenter/action, controller/key/secret, artifact/ACR image, runtime/database/environment/capability/allowlist/provider, active row, or traffic was created or changed. The Nurture context contract and its scenario source hash changed as design governance only. C-4 implementation remains separately unauthorized.

## Pilot-0-D locked topology and operations contract

`11-pilot0-d-topology-operations-contract.md` is the normative D-0..D-7
decision source. The cumulative decision is:

`PILOT0_D_DESIGN_LOCKED / C3_C4_D_IMPLEMENTATION_PENDING /
EXTERNAL_TRAFFIC_NO_GO`

The non-circular stage order is:

```text
D design lock
  -> separate C3/C4/D implementation authorization
  -> current C3 and C4 qualification
  -> immutable undeployed complete candidate
  -> authorized disposable D evidence run + pre-deployment seal
  -> Pilot-0-E signed release decision
  -> separately authorized Pilot-1 deployment binding, default off
  -> separately authorized Pilot-2 rehearsal activation row
  -> Pilot-3 fault/recovery/kill-switch rehearsal, fully disabled
  -> new Pilot-4 stage authorization and new activation row
  -> uninterrupted 120-hour observation
  -> continue/stop recommendation
```

The complete candidate binds exact C-3/C-4 identities,
`pilot_topology_operations_source_v1`, source/lock/schema/migration/registry
closure, immutable OCI/SBOM/provenance, the complete-Pilot activation profile,
canonical behavior-affecting non-secret configuration values, and normalized
topology/secret-class/operations policies. The candidate excludes qualification
state, live D-evidence authorization/environment/results and seal, E, live cloud/secret
resources, ACR tags/URLs, deployment binding, Workspace/activation, traffic and
observation results. A separate short-lived D evidence authority runs the exact
candidate on a disposable dual-ECS/dual-RDS, zero-external-traffic topology,
using only `candidateKind=complete_pilot_evidence_v1`, profile
`nurture_institution_complete_pilot_evidence_v1`, current C-3/C-4
qualification, current D authorization, and a separately signed/current
`pilot0_d_disposable_deployment_binding_v1`. It seals terminal
false/empty/teardown evidence and cannot target the persistent Pilot environment
or use E/Pilot-1/stage/C-3/C-4 evidence authority. E reviews that
content-addressed undeployed candidate, exact detached candidate signature and
exact current pre-deployment seal; Pilot-1 later publishes the same OCI bytes to private
Alibaba ACR and creates the real deployment binding without rebuilding.

Here and throughout D, zero external traffic means
`externalProductTrafficCount=0` under the D-0.5 definition: any admitted
product/owner/business/Notification/open effect with a represented human actor/
recipient outside the seven internal accounts or technical caller/destination
outside the candidate allowlist increments the counter, as does any excluded
provider/recipient dispatch attempt. Any authenticated request reaching Host
Nurture route/admission from a non-experiment source session/Workspace/account
also increments even if denied before owner call. An exact allowlisted Host-to-
owner call for an internal actor is internal product traffic; an internal
injected-target probe denied before owner call is audited internal negative
traffic and remains subject to the privacy/no-effect gate. Edge-denied scans, health probes, and
allowlisted cloud/service/evidence traffic are excluded only when they cannot
enter a Nurture owner path and remain independently audited.
The value is derived from append-only source/high-water-mark and event-set
digests for the exact environment/candidate/deployment/Workspace/interval;
missing source, gap, ambiguity, or unclassifiable traffic is `unknown` and
fails rather than becoming zero.

The locked environment is one dedicated Alibaba Cloud Hangzhou `pilot` VPC
with separate My-Chat and private Nurture ECS/Compose hosts, separate My-Chat
and Nurture RDS/credentials/migration/backup streams, My-Chat-only Redis, public
ingress only through My-Chat, and Alibaba Secrets Manager/KMS. The deployable
Nurture boundary is a production owner API plus retention/erasure worker; its
current dev-host, frontend shell and Kubernetes placeholder are excluded.
Authenticated responsive Web Chat/boards/workbenches plus in-app Notification
and Web deep link cover the internal sample. Native mobile distribution, real
OS push/SMS/email, external recipients/provider delivery, protected AI,
attachments and real child/family data remain outside the candidate.

Activation requires both an environment release capability and exactly one
current candidate/deployment/profile/E-decision/stage-authorization-bound
Workspace row, plus live C-3/C-4 qualification and owner policy. Host admission
and every owner-call attempt reread all current resolvers; no parallel D DTO is
introduced. The persisted short-lived Base `ScenarioActivationAdmissionV1`
complete-Pilot variant binds release heads and original actor/request/command/
Step provenance only. Each fresh signed `ScenarioPrivateInvocationV1` binds
caller/route/operation, the admission hash, attempt time, nonce, and owner
deadline; Nurture verifies/consumes the envelope before validating the exact
admission locally, never making a remote Host read from its transaction. Later
materialize/delivery/retry/open/reconciliation effects reread current state.
Technical Operator is disable/stop/refs-only-reconcile only. The independent
hard stop jointly closes ordinary ingress, business private calls, new claims,
workers, send/open and capability while preserving only isolated frozen
recovery. Pilot-3's row is never restored; Pilot-4 requires a new signed stage
authorization and row.

Stage entry is evidence-bound: Pilot-2 requires current
`pilot2_rehearsal_readiness_seal_v1`; Pilot-4 requires current
`pilot3_terminal_rehearsal_seal_v1` plus
`pilot4_observation_baseline_seal_v1`. A distinct stage-evidence signer and
append-only current resolver prevent ordinary documents from acting as
authority. Pilot-4 emits signed daily segment seals and an independently
reviewed terminal `pilot4_observation_result_v1`; neither result authorizes a
new scope. The Pilot-2 provisioning lineage accepts only its exact original
same-spec/same-operation chain: issued plus prepared/claimed/outcome-unknown,
writer-fenced within-budget return-to-prepared, and the final
`owner_committed + consumed + quarantine clear` successor. Intermediate states
remain bootstrap-only; `closed_no_effect` or identity/budget drift invalidates
the stage. Pilot-3 uses a separate signed fault-plan authorization. Only a
complete ordered matrix followed by `gates_closed -> final_binding_bound ->
plan consumed_success -> Pilot-2 stage authority consumed -> terminal seal`
may complete. The lineage resolver accepts only the exact next effect-decreasing
successor from a valid partial prefix. A consumed plan can prove only the bound
stage-authority consumption, and the consumed stage head can prove only the
terminal seal; completed historical heads are verification-only. Exact retry
retrieves an existing successor and resumes only the next missing transition.
Revoke/expiry/abort/order gaps/unexpected drift/incomplete execution is
non-passing and blocks Pilot-4. Its terminal seal binds the controlled
rehearsed-deployment to final-deployment rotation; the final binding
partitions the terminal seal and must be the exact Pilot-4 binding. The Pilot-4
baseline proves the full current four-Guardian/Admin/Caregiver/Lead/three-
Enrollment/eligible-Grant+Thread/Institution+Group/surface topology without SQL,
reset, hidden repair, or Technical-Operator business role.

The real first-Institution bootstrap uses
`pilot0_institution_provisioning_spec_v1` and a dedicated one-effect controller,
store/current resolver, claim, operation and status-recovery path. It binds the
exact Workspace, initial Admin, Host invitation, candidate and deployment; the
claimed operation rereads and binds current Host membership, stage and gate
state. It cannot alias C-4 evidence bootstrap or any
product/Technical Admin authority. Response loss returns the original outcome,
unknown quarantines replacement work, and successful bootstrap closes
permanently.
`confirmed_no_effect` is a fenced classification of stale `claimed`, never a
reopened `closed_no_effect`; one Host transaction either returns the same
operation to `prepared` within budget or closes it. Nurture commit writes only
Nurture facts, while a later result/status-proved Host transaction records
`owner_committed`, consumes the spec, and clears `outcome_unknown` atomically.
The first live row derives `bootstrapAdmissionMode=bootstrap_only` while the
operation/spec is issued, prepared, claimed, outcome-unknown, closed-no-effect,
unreadable, or otherwise not successfully closed. Only the exact bootstrap
claim/status lanes remain available; ordinary Nurture ingress/read/action,
Workflow/materialization, delivery and open are denied. Exact same-spec/
same-operation `owner_committed + spec consumed + quarantine clear` alone
derives `ordinary_ready`, so C-0 commit-before-response-loss cannot expose an
ordinary route before Host terminal closure.

My-Chat and Nurture databases independently provide encrypted PITR at
`RPO <= 15 minutes / RTO <= 4 hours`. Restore enters disabled isolated targets;
Nurture verifies and replays its independently stored append-only body-free
privacy ledger, including retention tombstones, before protected reads; an
unavailable/behind/forked head denies reads. RTO ends only after migration,
empty-row owner convergence, ledger/KMS/trust/integrity checks, ambiguity
quarantine and restore seal—not at RDS availability. There is
no distributed rollback or down migration. Protected bodies retain the locked
30-day maximum, body-free business/release/audit evidence the applicable
365-day maximum, and Pilot backups at most 30 days.

The D design decision itself creates no candidate, artifact/ACR publication,
database or migration, cloud resource, secret/key, capability, activation row,
traffic, qualification, or E/Pilot-1 authority.

## Minimum IIB closure before real traffic

1. Authenticated Institution control plane for Institution/CareGroup topology, policy, staff/roster/invitation intent, Institution-side Enrollment transitions, and scoped business disablement. Guardian/Caregiver C-3 paths separately own longitudinal child/family relationship, family Enrollment confirmation, Grant/Thread, protected communication, and revoke; My-Chat separately owns account/invitation acceptance, shell, and technical runtime. Every Nurture authoritative write uses the CommandExecution kernel without transferring those owner boundaries.
2. Guardian UX for explicit grant review, question submission, sent/blocked/replied receipt state, reply display, and revoke with clear consequence/retention text.
3. Current internal Pilot: responsive Web Chat/teacher-board UX for class inbox, attention board, item detail, acknowledge, reply, current-scope re-resolution, empty/error/permission states, and no direct cross-family chat. C-3 may qualify a native-capable artifact, but this complete-Pilot profile does not distribute or activate native clients/providers; native mobile remains an accepted internal-scope exclusion, not implementation completion.
4. Owner-reread on every open and action; workspace, role, care group, enrollment, grant, exact Thread/receipt lifecycle, redaction, and current policy remain fail-closed, while optional ThreadParticipant projection neither grants nor denies business permission.
5. Authenticated My-Chat shell routing and negative tests for cross-workspace, cross-child, stale notification, revoked grant, and disabled cohort.
6. Manual journey evidence for onboarding → question → attention → acknowledge/reply → family receipt → revoke, on the exact pilot artifact and topology.

## Success and stop contract

### Success criteria

Pilot-4 may recommend continuation only after one uninterrupted 120-hour window
under the same candidate, deployment binding, profile/row, behavior config,
schema/migrations, trust set, surface registry and owner policy, and only when
all of the following hold:

The active interval is exactly `[T0,T0+120h)` and both gates close at Tend. PASS
requires five contiguous signed 24-hour `pass` seals. Every
non-PASS window has exactly one signed/current
`pilot4_terminal_stop_evidence_v1`; a zero-length interval is valid at a segment
boundary/Tend. `no_pass` is either 0–4 prior pass seals plus a failed full or
partial segment, or five pass seals plus terminal census/review failure.
`stopped` is 0–4 pass seals plus preventive/manual/authority withdrawal with no
observed criterion failure; `no_pass` wins if both apply. Daily and stop evidence
cannot overlap, substitute, or form duplicate heads. Every result requires a
terminal false/rows-`[]` census and independent review. The isolated evidence
lane may finish the terminal daily seal (any failed full-segment seal or the
fifth passing seal), mandatory terminal-stop evidence, and result for at most
two hours after close using historical-at-segment authority proofs; it cannot
serve any product route or effect.

- `externalProductTrafficCount=0` for the entire window and terminal sealing
  grace, with every excluded edge/control/service event independently audited
  and proven unable to enter the Nurture business path;
- the three primary Guardians each submit two eligible questions, while Family-1's second Guardian submits one additional question: exactly seven planned question paths cover all three child scopes, reuse the four B3 representative journey pairings, and all return current receipt/reply without operator/database intervention; any successfully admitted extra Nurture question or unplanned business effect immediately makes the current window `no_pass` and starts fail-closed gate shutdown before new admission; the admitted at-most-once outcome may settle only through frozen recovery after closure, and terminal-stop evidence is required; a pre-admission rejection with zero owner call/effect may be a recorded negative probe but cannot alter, replace, or fill the planned sample;
- the second Guardian proves same-family historical/reply visibility and denial for both other families;
- Guardian Chat, family board and family workbench each originate at least one question; all four Caregiver `Chat|teacher_board` acknowledge/reply pairings occur at least once; every question is explicitly acknowledged and receives exactly one reply;
- after C-0 bootstrap establishes the Institution and first Admin, that current Institution Admin completes CareGroup/staff/roster/enrollment onboarding through the real workbench before the window and owner-reads the body-free Institution board once per 24-hour segment;
- every accepted write has one CommandExecution/business effect, one original-Step replay owner, at most one Handoff, and at most one logical Notification per exact `(Handoff, recipient, continuity key)`;
- scripted Grant revoke/redaction and stale deep-link opens fail closed on current owner reread without changing the locked cohort gate or owner-policy identity; the disabled-cohort/kill-switch case is sealed in Pilot-3 and is not repeated inside the active 120-hour window;
- every admitted technical submit/acknowledge/reply action reaches committed/replayable success or safe unavailability within 60 seconds—the human Caregiver's whole round trip is not subject to that 60-second deadline; in-app Notification is available or terminally classified within five minutes;
- every retry/dead-letter/`outcome_unknown`/manual-review case is visible to its named owner and terminally resolved through an allowlisted action or explicitly stopped;
- the observation record contains latency, retry/replay, context-ref count, LLM-call/cache count, manual intervention, and product-completion evidence without business bodies or claim material in telemetry;
- backup restore, credential/key rotation, owner/KMS/outbox/dispatcher outage, stale-open and capability kill-switch rehearsals passed in Pilot-3 before the window; and
- happy paths use no Technical Operator, SQL, direct database repair, direct Nurture route or hidden surface.

### Immediate stop criteria

Any one of these stops new pilot writes immediately and triggers the kill switch:

- cross-workspace, cross-child, cross-family, or unauthorized-role disclosure;
- revoked/redacted protected content remains readable, or a C-4-cancelled invitation/transfer remains actionable/readable contrary to current owner state;
- duplicate Nurture business effect, wrong-Step replay acceptance, duplicate Handoff, or non-idempotent delivery;
- claim token, protected body, attachment, or forbidden identity/driver material appears in logs, Outbox, Handoff, notification, or My-Chat persistence;
- the exact Workspace activation row/current resolver cannot isolate the Pilot cohort or the capability cannot be disabled without changing committed Nurture facts;
- unrecoverable database integrity/drift, missing backup, loss of audit evidence, or an owner outage that does not fail closed;
- any health content is treated as diagnosis, prescription, emergency replacement, or medication advice.

These are `POPS-SEV0`. A `POPS-SEV1` owner/KMS/qualification, DLQ/
`outcome_unknown`, backup/telemetry/audit, or gate/config-drift incident fails
closed, pauses the affected journey, and prevents PASS. Product friction or a
latency miss without privacy/integrity/authority/evidence loss is `POPS-SEV2`
and requires daily owner review. A gate shutdown, restore, candidate/deployment/
profile/config/schema/trust change, unresolved SEV0/1, or incomplete daily
evidence terminates the current clock; a repaired run starts a fresh 120 hours
under a new stage authorization/row as required.

## Evidence gates by Pilot stage

### Required before Pilot-2

- Dual-technical-gate kill switch demonstrated: normally remove the exact Workspace activation row first and close the environment capability second; if the row/Admin store is unavailable, the independent infrastructure hard-stop jointly closes capability, every ordinary Nurture ingress, business private route, new claim/worker path, and Notification send/open seam while retaining only isolated frozen status recovery. Either technical predicate alone prevents new work.
- Existing Nurture message/item/receipt/Execution facts remain intact and auditable; rollback never rewrites or deletes them.
- Requested/failed Handoffs are stopped or reconciled through My-Chat owner actions; Admin never edits Nurture facts.
- Notification/deep-link opens after rollback return unavailable through current Ledger + Nurture reread.
- Both databases have tested default-off isolated restore and forward-migration procedures at `RPO <= 15 minutes / RTO <= 4 hours`; restored My-Chat rows are noncurrent through environment/deployment mismatch and converge to `[]` through the audited owner command, never SQL; Nurture privacy-ledger replay precedes reads and no distributed rollback is required.
- Signed private-caller/mTLS, KMS and every independent controller credential rotation/revocation are demonstrated without static bearer fallback or secret persistence/logging.

These results are sealed as `pilot2_rehearsal_readiness_seal_v1` while
capability is false, active rows are `[]`, and
`externalProductTrafficCount=0`.

### Required before Pilot-4 observation

- Pilot-3 executes the separately authorized fault/restore/rotation/kill-switch plan on the exact deployed topology, then follows only `gates_closed -> final_binding_bound -> plan consumed_success -> Pilot-2 stage authority consumed -> terminal seal`. The row/capability closure precedes the binding transition; the final seal follows both consumptions. Each valid partial prefix authorizes only append/retrieval of the next successor; consumed plan/stage heads can prove only stage consumption/sealing respectively and never reopen effects. Revoke/expiry/abort/order gap/unexpected drift/incomplete execution is non-passing. The seal binds the historical issued heads, every exact terminal successor, rehearsed/final deployment bindings, transition digest, and no unresolved outcome; consumed heads remain verifiable but never executable.
- An owner-path baseline census, with no SQL, DB reset, or reseed, emits `pilot4_observation_baseline_seal_v1` over the unchanged three-child/three-family/seven-account cohort; all four current Guardian Host memberships/Nurture roles; one current Institution Admin; one current Caregiver with the sole Lead designation and no backup/overlap; three active Enrollments; current eligible Grant/Thread state for all seven paths; active/ready exact Institution/CareGroup; all required responsive-Web/in-app-open surfaces; Technical Operator with no Nurture Participant/business role; current final deployment/policy/trust; and an empty unresolved Step/Handoff/Outbox/Notification/`outcome_unknown` set.
- Pilot-4 uses a new signed authorization bound to both seals and creates a new row. Re-enable never backfills cancelled/skipped/expired/old-role/old-claim/revoked/redacted work.

## Pilot-0 checkpoints

| Checkpoint | State | Exit evidence |
| --- | --- | --- |
| Pilot-0-A — baseline and actual-capability audit | **Complete** | Exact revisions/hashes reverified; executable capability, runtime composition, IIB, provisioning, delivery, security, and observability gaps classified. |
| Pilot-0-B — cohort, role, surface, and data lock | **Complete** | B1/B2 and B3-0 through B3-4 are locked: internal topology/accounts, surface/action/continuity/business semantics, four representative journeys, layered fault/privacy coverage, and explicit exit evidence. |
| Pilot-0-C — IIB and onboarding closure contract | **DECISION COMPLETE / IMPLEMENTATION OPEN / EXTERNAL TRAFFIC NO-GO** | C-4-0..5 and the late identity reconciliation are locked across C-2/C-3/C-4; `DR-P0=0 / DR-P1=0 / DR-P2=0`, while six `TR-P0` and three `TR-P1` remain open and `TR-P1-3a` is an accepted scope exclusion. Future implementation additionally requires a current qualified C-3 containing exact `platform_child_family_identity_source_v1` and separate authorization. No adoption, candidate, qualification, schema/runtime change, gate row, capability, allowlist, or traffic is claimed. |
| Pilot-0-D — topology, operations, success/stop/rollback contract | **DESIGN LOCKED / IMPLEMENTATION UNAUTHORIZED** | D-0..D-7 lock the undeployed-candidate/E/deployment DAG, dedicated dual-ECS/dual-RDS topology, responsive-Web scope, OCI/ACR/KMS custody, dual gates, RACI, incident/recovery/retention, fresh-row 120-hour sample and all-or-nothing PASS at `DR-P0=0 / DR-P1=0 / DR-P2=0`. |
| Pilot-0-E — final Go/No-Go | **Blocked on C-3/C-4/D implementation and candidate assembly** | Requires current C-3/C-4 qualification, one immutable complete candidate, D evidence seal, `QR-P0=0 / QR-P1=0`, and the exact `pilot0_traffic_readiness_census_v1`: `TR-P0-1..6` plus `TR-P1-1|2|3b` are `closed`, and only `TR-P1-3a` is `accepted_scope_exclusion`. Missing/unknown/waived/duplicate rows block E. E deploys or activates nothing; Pilot-1 remains separately authorized. |

Pilot-0 is not complete while Pilot-0-E and the implementation/candidate inputs
remain unresolved. Pilot-0-C/D implementation is still unbuilt and separately
unauthorized. The current decision is deliberately **NO-GO for external
traffic** and **GO for readiness decisions only**.
