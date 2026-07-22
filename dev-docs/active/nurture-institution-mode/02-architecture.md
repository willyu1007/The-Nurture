# Architecture — Institution Ecology（机构生态 · 小孩养育过程）

> 本文是 T-002 的架构投影。当前 Pilot-0-C 决策索引见 `10-pilot0-c-current-decision-index.md`，Pilot-0-D 拓扑/运营 SSOT 见 `11-pilot0-d-topology-operations-contract.md`；精确跨仓场景合同见 `docs/context/workflow/nurture-scenario-contract.md`。发生冲突时，仓级 `AGENTS.md`、context contract、对应阶段当前索引依次优先于本文。立场基准见 `docs/context/product/workflow-product-design-contract.md`。
> 本设计不引入独立产品壳；The Nurture 是 My-Chat 场景模块，但 Nurture 拥有托育生态图谱和业务事实。

## 0. 一句话

Nurture 的基本单位不是家庭，也不是班级，而是**小孩的养育过程**（`NurtureChildCareProcess`）。

家长加入某个小孩的养育过程；老师把某个小孩的养育过程并入自己的班级日常工作流；机构管理者治理这些养育过程如何被组织化执行。My-Chat 提供统一用户账号、场景入口、移动端外壳、通知和 deep link；Nurture 维护托育场景下的角色、关系、授权、沟通、照护记录、媒体归属和工作流事实。

## 0.1 作用域原则

单个 `NurtureChildCareProcess` 是独立 child scope。所有作用于具体孩子的动作、数据、查询和写入，最终都必须落到某个 `childCareProcessId`。

老师视角、家长视角、机构视角和班级视角都是对 `NurtureChildCareProcess` 数据的再组织：

```text
parent / guardian view
  -> accessible childCareProcessId[]

teacher / class view
  -> careGroupId
  -> enrollment[]
  -> childCareProcessId[]

institution view
  -> institutionId
  -> careGroupId[]
  -> enrollment[]
  -> childCareProcessId[]
```

`CareGroup` 和 `Institution` 可以拥有组织配置，例如班级节奏、老师分配、机构理念和活动模板。但一旦记录描述某个孩子的照护、沟通、观察、媒体曝光或授权流动，它必须带 `childCareProcessId`。换句话说，班级 inbox 是多个 child scopes 的聚合工作台，不是脱离孩子的事实源。

## 0.2 Pilot-0-D deployment projection

Pilot-0-D does not change the domain center or create a Nurture product shell.
It locks one dedicated Alibaba Cloud Hangzhou `pilot` environment with separate
My-Chat and private Nurture ECS/Compose hosts, separate owner RDS instances,
My-Chat-only Redis, public ingress only through My-Chat, and no Nurture dev-host
or Kubernetes scaffold. Responsive My-Chat Web surfaces plus recipient-bound
in-app Notification/deep link cover the internal experiment; native mobile,
external recipients/providers, protected AI, and real family data remain out.

An undeployed `complete_pilot_candidate_id` binds current C-3/C-4 component
identities, `pilot_topology_operations_source_v1`, exact OCI/SBOM/provenance,
canonical behavior-affecting non-secret configuration, and normalized
topology/operations policy, but excludes qualifications, live evidence
instances/seals, E, live resources, secrets, deployment, activation and
observations. A separate authority runs the candidate in a disposable,
zero-external-traffic dual-owner topology using only
`candidateKind=complete_pilot_evidence_v1`, profile
`nurture_institution_complete_pilot_evidence_v1`, its isolated current D
authorization and disposable-deployment-binding resolvers, and current C-3/C-4
qualification; it emits the exact current
`pilot0_d_predeployment_evidence_seal_v1`. The seal binds a canonical
`pilot0_traffic_readiness_census_v1`; E requires `TR-P0-1..6` and
`TR-P1-1|2|3b` closed and permits only `TR-P1-3a-native-external-delivery` as
`accepted_scope_exclusion`. Pilot-0-E reviews that immutable candidate,
detached candidate signature, census, and seal before Pilot-1 creates
`pilot_deployment_binding_v1`. Traffic then
requires both an enabled environment capability and one exact current
Workspace activation row plus current C-3/C-4/E/deployment/stage/owner predicates.
Either technical gate independently denies; Technical Operator is disable-only.

Host gate reads linearize before each owner-call attempt and create a persisted
bounded admission assertion; the Base admission binds the current release heads and
original actor/request/command/Step provenance, while each fresh
`ScenarioPrivateInvocationV1` alone carries caller/operation, attempt time,
single-use transport nonce and owner deadline. Nurture verifies and consumes the
invocation envelope before validating the exact admission locally, and never
performs a remote Host read from inside its business transaction. The real first
Institution uses a dedicated `pilot0_institution_provisioning_spec_v1`,
one-effect operation, and response-loss status path that cannot alias C-4
evidence bootstrap. Its first live row remains `bootstrap_only`—all ordinary
ingress/read/action/Workflow/delivery/open denied—until the exact Host lineage
is `owner_committed + spec consumed + quarantine clear`; response loss,
`closed_no_effect`, unknown, or resolver outage never opens ordinary traffic.
The same-spec/same-operation issued/`prepared`/`claimed` and writer-fenced
within-budget return-to-`prepared` states remain valid Pilot-2 lineage solely so
bootstrap claim/status recovery can converge; they never derive
`ordinary_ready`.

Restore is owner-separated into disabled isolated targets, with a verified
external Nurture privacy-ledger head/replay before protected reads, audited
owner-command convergence of restored activation rows to `[]`, and no
distributed rollback. Pilot-3 ends with both gates closed and terminal seal;
Pilot-3 requires a separately signed fault-plan authorization; only full matrix,
kill-switch and recovery followed by the exact `gates_closed ->
final_binding_bound -> plan consumed_success -> Pilot-2 stage authority
consumed -> terminal seal` lineage may succeed. The lineage resolver accepts
an exact partial prefix only to append/retrieve the next effect-decreasing
successor. A consumed plan proves only bound stage-authority consumption, and a
consumed stage head proves only terminal sealing; completed historical heads
remain verification-only. Revoke/expiry/abort/order gap/unexpected drift is
non-passing. Any
binding-changing rotation records the rehearsed-to-final binding transition.
Pilot-4 requires a full business/technical owner-path baseline seal, signed
authorization/new row, and one uninterrupted `[T0,T0+120h)` window. Tend closes
both gates; the terminal daily seal (any failed full-segment seal or the fifth
passing seal), every required non-PASS terminal-stop record, and terminal result
may finish only through the isolated two-hour sealing lane,
and early stop uses signed partial-segment evidence. Any admitted question or
Nurture business effect outside the exact seven makes the window `no_pass`; a
pre-admission zero-effect rejection may be a negative probe only.

Every D “zero external traffic” assertion uses
`externalProductTrafficCount=0`: the counter includes admitted product/owner/business/
Notification/open effects with a represented human actor/recipient outside the
seven internal accounts or technical caller/destination outside the candidate
service/network allowlist, plus every excluded provider/recipient dispatch
attempt. It also counts any authenticated Host Nurture route/admission request
from a non-experiment source session/Workspace/account even when denied before
owner call. An exact allowlisted Host-to-owner call for an allowlisted internal
actor remains internal product traffic; an internal raw-target negative probe
denied before owner call remains internal test traffic but must satisfy the
separate privacy/no-effect assertion.
Edge-denied scans, health probes, and allowlisted control/service/evidence
traffic are excluded only when audited and incapable of entering a Nurture
business owner path.
These are design obligations only: no
artifact, DB, secret, environment, gate, candidate, qualification or traffic is
created by Pilot-0-D closure.

## 1. 核心所有权边界

My-Chat 拥有登录主体和场景外壳；Nurture 拥有托育生态图谱。

| 层 | Owner | 说明 |
| --- | --- | --- |
| Account identity | My-Chat | 用户账号、登录、session、全局 `user_id`。 |
| Scenario shell | My-Chat | mobile/web shell、通知、deep link、共享 workflow runtime、展示消费面。 |
| Scenario participant | Nurture | My-Chat 用户进入 Nurture 后的本地参与者映射。 |
| Scenario role | Nurture | `guardian`、`caregiver`、`lead_caregiver`、`institution_admin` 等托育角色。 |
| Scenario relationship | Nurture | 小孩、家庭、机构、班级、入托、老师分配、授权、家园沟通。 |
| Care facts | Nurture | 家园消息、班级 inbox 事项、每日照护、观察、媒体归属、孩子相册视图。 |

约束：

- 家长、老师、机构管理者都是 My-Chat 独立用户；小孩不是 My-Chat 用户。
- 机构是 Nurture 业务对象；机构管理者是 My-Chat 用户在 Nurture 中的 `institution_admin` 角色。
- My-Chat 不解释老师属于哪个班、家长加入哪个孩子、机构如何排班；这些是 Nurture 场景关系。
- Nurture 不复制 My-Chat 的账号身份或认证语义；Nurture 只引用 `my_chat_user_id`。

### 1.1 Resolver output boundary

IIA-0-R1 locks resolver output as a Nurture-internal context contract. My-Chat passes entry context and opaque refs, then receives the final scenario response. My-Chat must not consume resolved Nurture ids or policy seeds to make business decisions.

Nurture consumes resolver output through this chain:

```text
My-Chat surface
  -> Nurture entry adapter
  -> Resolver
  -> Capability handler / scenario orchestrator
     -> Policy
     -> Query / projection or command / workflow action
     -> Presenter
  -> Scenario response back to My-Chat
```

Pilot-0-B3-0 refines surface entitlement without changing identity or resolver ownership. Guardian Nurture work may use Chat, the family board, or the family domain web workbench. Caregiver Nurture work may use Chat or the teacher board. Institution-admin Nurture work may use the institution board or institution domain web workbench and is not exposed through Chat. A technical operator uses only the host technical Admin surface and is not implicitly a Nurture participant. A general My-Chat account may still use My-Chat Chat; the restriction concerns which Nurture role capability is exposed there.

Pilot-0-B3-1a locks the Guardian action boundary over those three surfaces. Chat remains the generic My-Chat AI panel and renders only the C-3-0c semantic presentation through generic Host interaction UI; the family board owns current/recent work views; the family domain web workbench owns complete authorized history and complex grant review. Submit-question, grant confirm/replacement, revoke, and author redaction remain reachable from every Guardian surface, but each action converges on the same Nurture command/policy regardless of presentation. Chat intent, board cards, and workbench forms never become business authorization or parallel lifecycle owners. Submitted questions are immutable; correction/resend is a new command, and hard deletion is not a surface action.

Pilot-0-B3-1b locks the Caregiver action boundary across generic AI Chat and the teacher board, with no caregiver domain-workbench fallback. Both surfaces close acknowledge/reply through the same Nurture commands. Chat may open a transient protected-detail view by opaque ref after current owner reread, but protected family bodies never become persisted Chat messages or activation content. Opening an item remains read-only; acknowledge is an explicit business action distinct from host notification read state. The later C-3-0e decision supersedes the earlier AI-draft shorthand for Pilot-0: protected AI is off and a named caregiver manually composes in the protected composer. The teacher board owns complete authorized current/history views because no other Caregiver work surface exists. Direct family Chat, bulk actions, clarification loops, daily-care outcomes, reassignment, and multi-caregiver handoff are excluded from the first internal experiment.

Pilot-0-B3-1c locks the Institution action boundary. The institution board is read-only and exposes safe topology/readiness aggregates plus navigation; it does not execute durable commands from projections. The institution domain web workbench owns strongly confirmed Nurture topology/configuration commands for institution/care-group lifecycle, adult-invitation initiation, staff roles, enrollment lifecycle, lead-caregiver designation, policy, and scoped business disablement. Every authoritative write uses `CommandExecution` and current role/scope/version/policy checks. My-Chat still owns account invitation/authentication and technical capability/runtime controls; Guardian relationships/grants remain family authority. Institution administrators receive no ambient family-body or child-care-fact access, cannot act as caregivers, hard-delete audit facts, or create ranking/competitive scoring. Current direct-Prisma synthetic provisioning is test preparation, not this control-plane authority.

Pilot-0-B3-1d-0 separates product and execution identities. A cross-surface Nurture product action is identified by `(scenario_key, action_key)` with a stable snake-case action key; the Nurture `command_key` identifies an immutable dotted `CommandExecution` contract; `entrypoint_key` starts a Workflow; `handler_key` is implementation binding; My-Chat technical recovery actions remain Host-owned. Action/surface/ref/confirmation values are untrusted until current owner revalidation. Six existing family-care mappings retain their persisted command keys. The current manifest `scenario_actions` registry is Run/Step-shaped and cannot be reinterpreted as Message/Grant/Item/Enrollment action transport; cross-surface domain actions require an additive contract rather than a second business lifecycle.

Pilot-0-B3-1d-1 limits technical recovery to a named internal My-Chat operator with exact Pilot-workspace scope; generic workspace admin or Nurture institution-admin status does not confer the entitlement. Technical Admin may show refs/counts/status/version/reason evidence, reconcile the original outcome-unknown Step, replay or stop an eligible Handoff, request Nurture owner reevaluation, and execute disable-only emergency shutdown. The operator cannot inspect protected Nurture content, alter technical/business records, mint provenance, directly invoke Guardian/Caregiver/Institution commands, or authorize route cancel/failure/reissue. Owner reevaluation preserves Nurture policy authority, while re-enable/cohort expansion remains a separate Go/No-Go decision.

Pilot-0-B3-1d-2 gives every remaining durable Guardian/Institution transition an explicit product and command key. Family enrollment confirmation is separate from grant confirmation; grant replacement creates a new identity and never revives a revoked grant. Institution topology avoids generic upsert/change-state commands in favor of create/update/suspend/resume/close transitions. The Pilot business-disable lifecycle reuses care-group suspend/resume rather than creating another enablement aggregate. Adult invitation is the cross-owner exception: My-Chat creates and accepts the canonical workspace invitation, then an owner callback binds the accepted canonical user into Nurture before a separate staff-role command. No Institution surface binds raw user ids or accepts on another user's behalf.

Pilot-0-B3-1d-3 closes action availability with scenario-owned safe reason codes and independent `explicit`/`strong_authorization` confirmation classes. Internal command errors map to safe categories; My-Chat renders Nurture `safe_label`/`safe_help` without interpreting domain semantics. Base must add optional `domain_action_contracts` and separate availability/command/handler types without changing Run-level `scenario_actions`. Missing handlers or invalid target/surface/confirmation declarations are fatal, while legacy manifests remain valid. Adoption is Base then My-Chat then Nurture, capability-off throughout contract adoption; advertised Nurture actions require real handlers and negative coverage before activation.

Pilot-0-B3-2a makes cross-surface continuity navigation-only. An action closes in the current entitled surface when possible; richer Guardian history/grant work routes to the family workbench, Caregiver full work routes to the teacher board, and Institution writes route from the read-only board to the institution workbench. My-Chat carries only a generic route class plus Nurture-issued opaque continuation/display bookkeeping, never raw Nurture ids. Target open is read-only and repeats current owner resolution before protected detail/action display. Navigation does not acknowledge, confirm, submit, create another command, copy lifecycle state, or become a Nurture fact.

Pilot-0-B3-2b makes the existing IIA-0-R6 token protocol exact for the Pilot profile. A token binds workspace, current Nurture participant, purpose, and the allowed consume/open surface; Chat clarification additionally binds the hashed host conversation. `clarify` and `submit_action` expire after five minutes, while read-only `open_notification` expires after seven days. `clarify` is consumed once after a structurally valid answer and may produce a new context after current-state recovery. `submit_action` consumption, the stable context-derived command identity, `CommandExecution`, and the business effect share one Nurture transaction; exact response-loss replay returns the committed Execution, deterministic stale/denied state revokes the token, and retryable technical failure leaves the token active only within TTL. `open_notification` is a reusable locator, never a read/ack/business action, and every open owner-rereads current state. Tokens are never extended/reactivated in place and are never general object-access or strong-authorization credentials. Generic navigation without one of the three purposes carries only route class plus the B3-2d allowlisted display view mode, never a business target/filter/cursor.

Pilot-0-B3-2c makes notification delivery an authenticated indirection rather than a continuation carrier. Provider payloads and deep links carry only a recipient-bound My-Chat `notification_id`, a generic notification-open route, and content-safe generic copy; Handoff ids, scenario tokens, Nurture refs, protected bodies, and cached business state remain server-side or absent. After sign-in, My-Chat validates exact notification recipient/workspace, marks only the Host notification as read, rereads the eligible Handoff, and asks a separate Nurture open resolver for current visibility. A successful owner read issues a destination-bound `open_notification` token into response/client navigation memory, never the provider payload, URL, My-Chat persistence, logs, or analytics; the destination owner-rereads again before protected render. Delivery eligibility and open visibility are separate owner operations: owner reread occurs before notification creation, before every provider send/retry, and on every open. Pre-send revoke/redaction/cancel skips delivery; post-send changes cannot retract the OS notification but always win on open. Previously notified actors may still reach current authorized acknowledged/replied/closed history, while revoke, removed entitlement, redaction, withdrawal, stopped/failed Handoff, disabled capability, or unavailable owner produces only current safe unavailable/retryable UI and never restores cached controls.

Pilot-0-B3-2d closes continuity without adding a draft platform. Unsubmitted manual protected text and form state remain actor- and surface-local; any future separately gated AI draft has the same restriction, while Pilot protected AI is absent/off. Same-surface `clarify`/`submit_action` may use their existing five-minute contexts, but no draft body, target cursor, or prepared action moves to another surface/device/account. Leaving a non-empty draft requires explicit stay-or-discard UX. My-Chat Chat transcript is Host conversation history, not a Nurture draft/result source; protected caregiver drafts remain ephemeral. The existing My-Chat `PublicDraft`/Workflow artifact draft path remains reserved for external publication and MUST NOT become a family-care action draft. Committed continuity comes only from Nurture business facts plus refs-only `CommandExecution`: the source may render a non-authoritative safe result, response loss replays the same Execution, and the destination queries current owner presenters without another command or generic result token. History rows, target filters, pagination/search cursors, and business ids never ride the transition; only generic `route_class` plus `view_mode=current|recent|history` may follow. Family/teacher/institution surfaces query their role-correct current history, while Chat, Notification inbox, and Technical Admin remain non-canonical views. Drafts are not shared across guardians/devices, but committed facts may become visible to other currently authorized participants under Nurture policy.

Pilot-0-B3-3a fixes the first business input as one protected plain-text `family_care_question`; it does not narrow the reusable domain vocabulary. The trusted Nurture Pilot adapter derives `data_class=family_care_question`, `category=question`, `urgency=today_attention`, `route_mode=immediate`, `requires_ack=true`, `requires_reply=true`, and `attachment_refs=[]` before the existing command kernel. Guardian/caregiver body text is trimmed plain text of 1–2000 Unicode characters and remains behind a protected content ref. The displayed list summary is deterministic and generic rather than extracted from the body. Raw domain ids, route flags, grant values, urgency, safe summary, protected refs, and source-surface claims are not user-authored fields. Unsupported health/medication/emergency, media, daily-care, constraint, follow-up, rich-text, attachment, and batch inputs fail before the first business write and are never silently remapped. The later C-3-0e/C-3-3 contract supersedes the earlier AI-draft allowance: protected AI is absent/off, and both Guardian and Caregiver compose manually in an empty protected editor. The generic command/schema may continue supporting broader classes and modes; a strict additive Pilot profile gate is required before traffic.

Pilot-0-B3-3b binds the complete question round trip to one Nurture-owned active Grant rather than separate directional grants. The exact profile binds workspace, child process, current enrollment, and current care group; uses `grantedToScopeType=care_group`; fixes `directions=[family_to_org,org_to_family]`, `dataClasses=[family_care_question]`, and `purposes=[family_care_workflow]`; and requires expiry at the earlier of 30 days after effectiveness or the Pilot allowlist expiry. `org_to_family` authorizes only a caregiver-confirmed reply to the Grant-bound source item, not proactive outbound content. One binding may have at most one current active Grant. An exact duplicate returns `already_satisfied`; any scope/direction/data-class/purpose/expiry change atomically replaces the old identity, and revoked/expired/replaced identities never reactivate. Capture, acknowledge, and reply must use the exact original `grantId`; a replacement Grant authorizes only new questions and cannot revive an old item. The scripted primary Guardian owns grant administration without becoming a new role. Any current same-family Guardian may author a new question and owner-read committed family facts under the active Grant, but only the granting participant may replace/revoke it and each message author may redact only their own message. Institution admin, caregiver, and technical operator have no family-Grant authority. Loss of the granting participant's current Guardian eligibility blocks new cross-role use without implicit ownership transfer.

Pilot-0-B3-3c makes the happy path three atomic Nurture commands: capture creates one family-authored sent Message, logically delivered family-to-org Receipt, open Item, created ItemEvent, active Attention projection, thread update, and Execution; explicit acknowledge alone transitions `open(v0) -> acknowledged(v1)`, appends the event, and moves the source Receipt from delivered to acknowledged while Attention stays active; caregiver-confirmed reply alone transitions `acknowledged(v1) -> replied(v2)`, creates the linked caregiver Message and org-to-family delivered Receipt, appends the reply event, updates the thread, and resolves Attention. Reply from open/waiting states is forbidden. `replied` is terminal for the Pilot; no close, follow-up, clarification, reopen, second reply, or in-place edit follows, and a correction is a new question. `delivered` means Nurture's current logical target surface can owner-read the content, not provider delivery, device read, acknowledgment, Handoff, or Outbox completion. Item/detail/notification open remains read-only and creates no implicit Nurture `read`; Host notification read state is independent. Message content, Receipt distribution, Item work state, Attention projection, and My-Chat delivery therefore remain separate owners without mirrored state.

Pilot-0-B3-3d makes exact `CommandExecution` replay the only recovery for command response loss and keeps business authorization independent from technical delivery. A stable `commandRequestId` plus canonical payload hash returns the original Execution/output refs for an exact retry and rejects payload drift; after Nurture commit, only the original claimed My-Chat Step may reclaim and consume the replay seed, so response loss cannot create a second Message, Receipt, Event, version, Attention, or Handoff. Every read, action, retry, notification, and stale open rechecks the Item's original `grantId` plus current role, family, enrollment, care group, and policy. Grant revoke, expiry, replacement, owner-role loss, or scope drift suppresses active work and cross-role body access without rewriting the retained audit facts or letting a new Grant revive the old Item. Author-side access to a retained body is separately policy-gated: a current same-side author may still read their own Message, while a former cross-role receiver sees only an allowed content-free tombstone. Redaction is author-only, expected-version, and irreversible: Guardian source redaction suppresses the dependent Item and active Attention, while caregiver reply redaction tombstones only the reply distribution and never reopens or suppresses the already-replied source Item. The immediate route exposes no Pilot cancel action; a delivered cancel attempt returns `route_already_visible`, and withdrawal is represented only by author redaction or Grant-owner revoke. Nurture commit failure, Step/Handoff/Outbox recovery, provider failure, owner-API outage, stale action, kill switch, and operator reconciliation preserve their separate owners; technical recovery can inspect and reconcile refs-only evidence but cannot restore Grant authority or edit Nurture business state.

Pilot-0-B3-4 closes representative coverage through a layered proof model instead of a Cartesian E2E explosion. Contract/conformance tests exhaust every allowed and denied action/surface cell; Nurture DB tests own transaction, version, Grant, Receipt, Item, Attention, revoke, and redaction invariants; two-database joint tests own claimed-Step replay, Handoff/Outbox, notification owner reread, technical failure, and privacy probes; rendered surface tests own Chat, role-board/workbench, notification, and Technical Admin behavior. Four independent `family_care_question` round trips across the three synthetic child/family scopes cover Guardian Chat/family-board/family-workbench submission and all four Caregiver `Chat|teacher_board` acknowledge/reply pairings; the dual-Guardian family runs two questions so the child count does not grow. A separate Institution strand proves read-only board to authoritative workbench setup/disablement without protected-body access, while a Technical Operator strand proves refs-only recovery without business authority. CI may seed topology for kernel tests, but direct Prisma writes do not count as final authenticated onboarding evidence; Pilot-0-C owns that product closure. Pilot-0-B completes only as a readiness contract and does not activate implementation or traffic.

Pilot-0-C0 makes My-Chat's authenticated shell the only public IIB ingress. Clients never call raw Nurture business routes; My-Chat supplies authenticated user/workspace/surface, idempotency, and opaque Nurture context to a generic private owner/action bridge, while Nurture alone resolves participant, role, work scope, target, Grant, policy, version, presenter state, and action availability. The current Nurture dev-host is excluded from the Pilot artifact. The first synthetic Institution uses an exact single-business-effect bootstrap rather than self-service signup or a database fixture: a versioned provisioning specification binds the exact workspace, scenario, institution, initial Institution Admin My-Chat identity, and expiry; only authenticated acceptance of the matching My-Chat invitation plus current membership evidence permits one idempotent Nurture transaction to establish the Institution, Participant, first admin role, and audit result. Exact response-loss recovery returns the original result, while user/workspace/payload drift, expiry, or reuse for another effect fails closed. The artifact is not a B3-2 scenario token and never reaches a client. Before D, the isolated `c4_bootstrap_evidence_controller` alone generates/signs/stores/custodies/revokes/destroys the disposable synthetic evidence spec under its own issuer/audience/store/target; Pilot-0-D owns only the distinct real Pilot specification. Neither authority may alias or substitute for the other. Technical Admin may observe refs-only outcome evidence but cannot choose another admin, mutate either specification, or reopen bootstrap.

Pilot-0-C1 uses `NurtureCareGroup` as the only class/group aggregate. Institution Admin creates/updates and non-destructively pauses/resumes/archives a CareGroup from the Institution workbench; the board remains read-only. Enrollment-invitation eligibility is a current derived readiness decision over active Institution/Group, exactly one current eligible operational Caregiver, exactly one Lead designation bound to that exact role episode, completed required policy, and Pilot gates rather than a second class lifecycle or cached boolean. Zero/multiple Caregivers, zero/multiple Leads, or wrong binding fails closed. Staff onboarding is three separate owner transitions: Institution Admin initiates a My-Chat Staff Invitation, accepted canonical identity binds or reuses one `NurtureParticipant` with no business role, and a later strongly confirmed Nurture command creates a care-group-scoped `caregiver` RoleAssignment before a distinct Lead designation. Invitation intent is not role authority, and neither Participant existence nor Host membership grants Teacher-board access. Role suspension/revoke, Host membership loss, group pause/archive, expiry, or scope drift blocks access immediately without deleting Participant, authorship, or audit facts. The Pilot activates exactly one human operational Caregiver/Lead pair and no backup/multi-caregiver concurrency across its Workspace cohort, while the reusable model may support multiple separately scoped assignments later.

Pilot-0-C2a separates institution-local intake from both platform identity and the family-authorized local care record. An Institution Admin may create a minimal `NurtureInstitutionRosterEntry` for an expected child in one Institution/CareGroup and use it to initiate an Enrollment Invitation after C-1 readiness passes. The entry is a Nurture-owned intake/audit object, not a My-Chat Child/Family, scenario binding, Nurture anchor/association, `NurtureChild`, ChildCareProcess, Guardian relationship, Enrollment, Grant, or matching key. Its unverified label/prefill never seeds or defaults either owner. After acceptance, the adult explicitly creates or selects one current platform Child/Family pair; the qualified C-3 identity operation reuses valid binding anchors, reserves only missing endpoints, commits/exact-replays every missing My-Chat binding in one Host transaction, then creates or resolves the workspace-local Child/Process/child-scoped Family, first Guardian, and both associations in one Nurture transaction. A current Guardian may select only an exact owner-resolved current local association. Fuzzy/PII/raw-id matching is forbidden. Roster linkage, Enrollment, and Grant remain separate confirmations; invitation termination before the identity saga leaves only Roster/Intent audit, while termination after an independent local commit retains those owner facts but still creates no Institution linkage. Exact platform identity reuse is allowed, while cross-workspace Nurture dossier/authority portability remains disabled.

Pilot-0-C2b-1 makes first-Guardian establishment a family-authorized, audited transition rather than an Institution assertion. My-Chat authenticates the exact recipient, but recipient identity and Institution intent grant nothing. The adult strongly confirms the relationship, platform Child/Family selection or creation, freshly entered local care label/constraints, privacy meaning, and family visibility consequence. The durable operation reuses both valid bindings, reuses one while adding the other, or adds both; Nurture reserves only missing typed anchors, and My-Chat atomically creates/exact-replays all missing bindings after current stewardship/membership/`FamilyChildMembership` reread. One Nurture `CommandExecution` transaction then creates or resolves the workspace Participant, local Child, ChildCareProcess, child-scoped Family, first Guardian, and both workspace associations. A conflicting existing binding, partial commit from this operation, wrong pair, stale owner version, invalid association graph, or owner outage leaves no active local product path and enters exact recovery/quarantine as appropriate. Existing local selection requires the already current dual-owner path. The first role is not `primary_guardian`; relationship labels change no permission. This is an internal product assertion, not legal Guardian verification.

Pilot-0-C2b-2 makes Co-Guardian onboarding a current-family-owner transition. The inviter must be both a current Nurture Guardian and a current My-Chat Family member with Host permission to invite the exact recipient; Institution Admin, Caregiver, and Technical Operator cannot initiate or accept on another adult's behalf. My-Chat owns raw contact, delivery, authentication, exact-recipient acceptance, and idempotent Workspace/Family membership creation. Nurture owns the business intent, local inviter/family/process binding, role metadata, policy, and Guardian RoleAssignment. Host membership commits first; Nurture then rereads it and commits the role under a separate stable operation. Either fact alone grants no product access. Membership-commit/role-fail and role-response-loss resume the same operation; cancel/expiry/self-exit/revoke never compensates the other owner's committed fact. Pilot permits exactly one Family-1 Co-Guardian acceptance and none for Family-2/Family-3; the reusable model has no two-Guardian maximum.

Pilot-0-C2b-3 authorizes current family membership without merging authorship or consent ownership. After the second Guardian RoleAssignment commits, both current Guardians have equal base family rights and may owner-reread eligible committed family facts, including pre-membership history, under current Family/role/Enrollment/original-Grant/redaction/retention/policy checks. No access exists before role commit, and reread never copies Message/Receipt/history rows or reconstructs another actor's draft or `NurtureInteractionContext`. Either current Guardian may submit a new eligible family question under the active Grant and read current family-visible facts; each author may redact only their own Message. Existing `grantedByParticipantId` remains the sole replace/revoke authority for that Grant, and joining never transfers or revives Grant ownership. Family-originated facts may remain family-side readable when current family policy allows, while caregiver/institution-originated bodies continue to require the original current Grant and become unavailable/tombstoned after its fence closes. Acceptance cannot revive redacted/revoked/expired content, backfill historical notifications, alter authorship, or grant other-family/institution-internal access. C-2b-4 owns what happens when a Guardian relationship later ends.

Pilot-0-C2b-4 allows strongly confirmed self-exit but no peer or administrative removal of an accepted Guardian relationship. Exit is denied if the actor is the last current Guardian because ordinary offboarding cannot leave an authority-free Child/Family. When another current Guardian remains, one versioned Nurture `CommandExecution` transaction terminalizes the actor's Guardian RoleAssignment as revoked, cancels pending Co-Guardian invitation intents issued by that actor, revokes active Grants owned by that actor, and applies the established Receipt/Item/Attention/protected-body cascades; a Grant owned by another current Guardian remains independently valid. The exiting actor immediately loses family profile/history/action access, including author-side body access that requires current same-family eligibility, while Participant, authorship refs, business facts, audit shells, and Execution evidence remain immutable. Stale notifications/deep links fail on owner reread. Host account/workspace loss also blocks access but does not mutate Nurture relationship state. Rejoin requires a new invitation and new RoleAssignment; terminal roles and old Grants never reactivate. Forced removal, legal/custody dispute, evidence collection, or safety adjudication is outside Pilot and cannot be implemented as Operator/Institution database authority.

Pilot-0-C2c-1 separates Institution Enrollment Invitation issue from family identity and enrollment effects. Only a current exact-scope Institution Admin may issue from the workbench after rechecking active Institution/CareGroup, current Lead Caregiver, completed required policy, workspace/capability/Pilot gates, and an unlinked current `NurtureInstitutionRosterEntry`. The versioned Nurture invitation intent binds Institution, CareGroup, RosterEntry, issuing Admin, opaque exact-recipient Host invitation binding, required expiry, and canonical payload hash; exactly one effective pending intent may exist per RosterEntry. My-Chat owns raw contact, delivery, authentication, workspace membership, and Host acceptance, while Nurture intent state is the sole business-continuation fence. Host delivered/accepted state cannot bypass Nurture cancel/expiry/readiness/policy denial. Issue returns only allowlisted Institution/Group/local-label/purpose/expiry/privacy display content, treats Institution prefill as unverified, and creates no Participant, Guardian role, Child/Process/Family, Enrollment, Grant, thread, Message, or teacher-visible child fact. Exact replay returns the original intent; binding or payload drift conflicts. Pilot issues one distinct Enrollment Invitation for each of three RosterEntries, and Family-1's later Co-Guardian path remains a separate invitation kind.

Pilot-0-C2c-2 makes authenticated acceptance resumable without prematurely consuming the Nurture intent or linking Institution data. My-Chat Host acceptance proves the exact recipient only; Nurture reruns invitation/recipient/workspace/readiness/RosterEntry/current-policy checks. A recipient with a current qualified platform Child/Family pair and current same-workspace Nurture Guardian relationship receives owner-resolved local candidates and must explicitly select through opaque option tokens even when one candidate exists; raw ids and Institution prefill never select or match a child. A recipient without a current local association uses the C-2b-1 identity-establishment saga: explicit platform pair selection/creation; both-binding reuse, Family-reuse/new-Child, Child-reuse/new-Family, or both-new resolution; missing-anchor reservation; one Host binding transaction; then one Nurture Participant/local Child/Process/child-scoped Family/first-Guardian/association transaction. The durable operation and writer-fenced status lookup recover `outcome_unknown` without creating a replacement identity; conflicting existing bindings quarantine. A non-Guardian who knows another current local profile exists must use Co-Guardian Invitation rather than claim or fuzzy-match it. Existing-child selection is held only in a short-lived `NurtureInteractionContext` and creates no Roster link, Enrollment, Grant, thread, or teacher visibility. An independently committed local relationship remains if the Institution invitation later expires/cancels, but creates no Institution linkage. Pilot evidence uses three executable JI3 journeys/scopes without adding a fourth child/family: Family 1 accepts with an existing platform pair and no local association; Family 2 does the same, proves local response-loss/exact recovery, then starts a fresh still-pending continuation and selects that current association; Family 3 creates a new platform pair after acceptance. Separate domain/conformance evidence covers all four binding-resolution branches. The Pilot invents no invitation-free same-workspace Nurture onboarding path.

Pilot-0-C2c-3 gives the Nurture intent an explicit bounded lifecycle without depending on provider state or an expiry job. `pending|consumed|cancelled|superseded` are stored states; `expired` derives whenever `now >= expiresAt`, with Pilot `expiresAt = issuedAt + 7×24 hours` and no extension. Any current exact-Institution Admin may cancel pending intent; the exact recipient may decline, recorded as a distinct terminal reason. Reissue never edits or revives an intent: the old pending intent becomes superseded and a new invitation identity/request/Host ref/expiry/hash is created, with an immutable supersede chain. Provider retry of the same Host invitation remains technical delivery on the same intent. Readiness loss blocks acceptance/Enrollment through current rechecks but need not invent another state; an unexpired pending intent can continue after readiness recovery. Cancel/decline/expiry/supersede makes related InteractionContext unusable while independently committed family profiles remain. Expected version and first-commit-wins order cancel versus C-2d consume, supersede versus acceptance, and concurrent issue. Only the C-2d Enrollment transaction writes consumed. Terminal intent/audit/Host refs remain retained, and stale Host/provider/client state cannot reopen business authority.

Pilot-0-C2c-4 ends invitation preparation at a typed `ready_for_enrollment_confirmation` presenter result, not an Enrollment fact. Nurture shows only the allowlisted Institution/CareGroup, Guardian-confirmed child display, invitation expiry, privacy consequence, and an explicit statement that Enrollment does not create a Grant. Nurture also issues a five-minute `submit_action` InteractionContext whose effective expiry is the earlier of the context expiry and invitation expiry. The context binds the exact invitation, participant, selected or newly created ChildCareProcess, Institution/CareGroup/RosterEntry, `confirm_family_enrollment`, expected versions, surface, and canonical action hash; client-authored raw ids are never accepted. The short-lived continuation is not a canonical RosterEntry-child association. Guardian Chat, family board, and family workbench converge on the same action, while every render and submit revalidates current invitation/recipient/Guardian/readiness/roster/conflicting-Enrollment/version state. C-2c-4 creates no Enrollment, roster link, Grant, thread, teacher visibility, notification, or Workflow Handoff; C-2d remains the only strong-confirmation transaction. Expiry or drift requires fresh C-2c resolution, and committed family profiles remain independent of the invitation.

Pilot-0-C2d-1 makes `confirm_family_enrollment` one exact-recipient/current-Guardian strong-authorization command rather than a sequence of best-effort writes. The final authorization view identifies the resolved child, Institution, CareGroup, roster association, and the consequence that Enrollment does not create a Grant. The client returns only the opaque submit context and explicit confirmation. In one Nurture transaction, the command consumes the still-current InteractionContext, creates or resolves one stable CommandExecution, creates the exact Enrollment, links the previously unlinked RosterEntry to the ChildCareProcess, moves the exact pending invitation to consumed with Enrollment correlation, and records immutable audit/result refs. Any stale binding, version, lifecycle, readiness, recipient/Guardian, roster, or Enrollment conflict rolls back every write; exact response-loss replay returns the original Execution/result. C-2d-1 does not choose the Enrollment initial status/time and later lifecycle rules, private-thread creation timing, or optional result/Handoff policy; C-2d-2, C-2d-3, and C-2d-4 own those decisions. No Enrollment confirmation implies Grant consent or teacher access.

Pilot-0-C2d-2 makes confirmed Pilot Enrollment immediately `active` with `joinedAt` equal to the authoritative database transaction timestamp generated inside the atomic confirmation transaction; client, Institution prefill, backdated, future-scheduled, and in-place time changes are not accepted. Pilot creates no `pending` Enrollment, while any pre-existing `pending` row is conflict-bearing and fails closed alongside `active|paused`. One ChildCareProcess may have at most one current Enrollment per Institution across all CareGroups, but may have independent current Enrollments at different Institutions; every Institution relationship and later Grant remains separately scoped. A same-Institution different-group conflict requires the C-2f transfer path rather than automatic movement. Exact command replay returns the committed Enrollment; a new command against the same group resolves as `already_enrolled`, while a different-group or occupied-roster attempt returns a deterministic conflict without consuming the losing invitation. Concurrent invitations/confirmations/roster links use first-commit-wins. `ended|withdrawn` identities never reactivate, and a return requires a new RosterEntry, invitation, and Enrollment; `deleted` is not a Pilot transition or bypass. C-2f owns the actors and commands for pause, exit, transfer, and later-stage change.

Pilot-0-C2d-3 keeps Enrollment and protected communication activation separate. Enrollment confirmation creates no `NurtureFamilyCareThread`; current exact-scope Institution Admin/Caregiver presenters may expose only an allowlisted roster projection of care-group membership, Guardian-confirmed safe child label, Enrollment status, and `joinedAt`, never family/Guardian/contact/profile/Grant/thread/message content. The first C-2e transaction that creates the exact active Grant also creates the one `active` `enrollment_private` Thread for `(workspace, ChildCareProcess, Family, Enrollment)`; the transaction cannot leave only one of Grant or Thread. Thread creation is not deferred to the first Message. A different Institution Enrollment receives a different Thread, while exact replay and Grant replacement reuse the existing Thread. Thread and participant rows are routing/projection facts, never authorization: every read/write rechecks current role, exact Enrollment/CareGroup, original/current Grant, policy, object lifecycle, and protected-source state. Grant revoke/expiry retains the Thread identity and audit but immediately denies now-ineligible bodies/actions; replacement or later authorization cannot revive content fenced by a terminal original Grant. Enrollment termination never migrates the old Thread into a new Enrollment, and any close/archive transition remains a C-2f lifecycle decision.

Pilot-0-C2d-4 returns typed `enrollment_confirmed` after the C-2d transaction and stores only stable refs in CommandExecution. The presenter owner-rereads the current Enrollment and may show only Guardian-confirmed safe child label, Institution, CareGroup, current status, and `joinedAt`, plus explicit no-Grant/no-private-communication copy. A `review_family_care_grant` route affordance may open fresh Grant review, but is not a domain action, token, authorization, or alias; the only durable first-Grant action remains `confirm_child_link_grant`. Exact command/response-loss replay returns the original Execution and Enrollment refs without a second effect, while every render reflects current lifecycle/authority rather than cached `active` text. Once an invitation is consumed, later passage beyond its old `expiresAt` cannot turn the committed Enrollment into failure; the exact recipient may recover the current result only while owner authorization remains. Role/workspace/Enrollment loss returns safe unavailable/tombstone. Presenter, network, and client failure never compensates or deletes the committed business transaction. Pilot Enrollment stores `handoffRequestSnapshotsPayload=[]` and emits no activation seed, Handoff, Outbox, notification, or deep link; Institution views discover the roster update through owner reread. Any future enrollment-success activation is a separate versioned refs-only action/Handoff requiring a durable claimed-Step path and cannot change Enrollment success semantics.

Pilot-0-C2e-0 removes ThreadParticipant from the authorization graph. Current My-Chat identity/workspace membership plus Nurture Participant/RoleAssignment, exact Enrollment/CareGroup, exact current or original Grant, Thread and source lifecycle, policy, and redaction are re-resolved for each presenter and command. `NurtureFamilyCareThread` remains the required exact business aggregate: a missing, mismatched, or unavailable Thread fails closed. `NurtureFamilyCareThreadParticipant` is optional routing, read-cursor, subscription, or display-preference projection only. Its absence cannot deny otherwise current authority; an active, stale, forged, or cross-scope row cannot grant or preserve authority; hidden/inactive projection may affect listing but not business eligibility. First Grant therefore need not fan out participant rows, and a projection may be created or updated only after the current owner path authorizes the actor. C-2e implementation must remove stored `thread_membership_active` as a Guardian/Caregiver hard gate and prove both no-projection success and stale-projection denial without weakening exact Thread lifecycle checks.

Pilot-0-C2e-1 gives every current exact-Family Guardian equal eligibility to review and first-confirm the fixed Pilot Grant without tying authority to Enrollment invitation receipt or join order. The first committed confirmer becomes `grantedByParticipantId` and the sole replace/revoke owner; another current Guardian may use and inspect the active family Grant but cannot co-own, replace, revoke, or acquire ownership through `already_satisfied`. Product-level strong confirmation requires an authenticated current session, fresh Nurture owner resolution, and an explicit generic `authorization_gate`; natural-language agreement, navigation, preview, or LLM intent classification is not confirmation. Chat, family board, and family workbench may render different layouts but disclose the same safe child, Institution/CareGroup, bidirectional question-workflow scope, current users, bounded duration, owner/non-transfer consequence, revoke/retention effect, and excluded data/use cases. Nurture issues a five-minute `submit_action` context bound to exact actor/role, family/process, active Enrollment/Institution/CareGroup, fixed profile hash, expected versions, action, and presenting surface. The client returns only opaque context plus explicit confirmation. Review/context creation has no Grant, Thread, CommandExecution, protected-content, Handoff, or cross-role visibility effect. Exact active state suppresses a new-create affordance; a confirmation race may return `already_satisfied` without changing the first committer. C-2e-2 owns database atomicity, identity, time, expiry, and first-commit enforcement.

Pilot-0-C2e-2 makes first Grant confirmation one database-serialized aggregate operation. The active identity is `(workspaceId, childCareProcessId, enrollmentId, grantedToScopeType, grantedToScopeId, canonical purposes)`; Pilot targets the current exact CareGroup and uses the singleton canonical purpose `family_care_workflow`. A raw PostgreSQL partial unique index fences one non-deleted `active` identity. Server-canonical directions and data classes belong to the immutable business profile rather than the unique identity; a changed profile cannot silently overwrite or coexist and returns `grant_replacement_required`. In one Serializable transaction, the command resolves exact replay, locks/reloads submit context and owner facts, reads `transaction_timestamp()`, classifies every matching Grant and exact Thread without `findFirst`, conditionally consumes the context, creates the Grant, creates or reuses the one active Enrollment-private Thread, and records CommandExecution/audit/result refs. `effectiveFrom` equals database transaction time and `expiresAt` is the earlier of 30 days later and Pilot allowlist expiry; active authorization always checks `[effectiveFrom, expiresAt)` and current lifecycle, independent of an expiry worker. Same-definition compares stable business profile rather than newly derived timestamps, so a new or racing command returns `already_satisfied` and never extends expiry or transfers ownership. A deliberate expiry-policy change requires C-2e-4 replacement rather than confirmation-side timestamp drift. An elapsed active row may be terminalized to `expired` inside a fresh eligible confirmation transaction before a new Grant identity is created; owner ineligibility blocks pending C-2e-4 rather than auto-revoking. Exact command replay returns the original Execution. Known serialization/deadlock/exact Grant-or-Thread unique races retry the whole transaction with bounded attempts and fresh reads; an exhausted known race returns retryable `command_busy`, while unknown integrity failures remain technical. Thread history is reused only for the same Enrollment; missing history is created, exact active history is reused, and terminal/mismatched/cross-Institution Thread state fails closed for reconciliation.

Pilot-0-C2e-3 separates immutable command recovery from current Grant presentation. CommandExecution retains `disposition=executed|replayed`, `businessOutcome=applied|already_satisfied`, and exact versioned Grant/Enrollment-private-Thread output refs; the Execution ref and output refs remain server-side recovery locators, never client route, URL, transcript, analytics, or authorization state. User presentation is the owner-read `family_care_grant_current` view. The view maps the source result to `activated|already_active|processed_but_unavailable`, resolves the current actor relation as `owner|family_user|none`, and exposes only safe child/Institution/CareGroup, scope, actual effective/expiry time, and current actions. Another Guardian's `already_satisfied` result never says that actor confirmed or owns the Grant. Exact response-loss retry performs compatible Execution lookup before consumed/expired submit-context checks, so a committed command needs no second confirmation; every user response still reruns current identity, role, Family, Enrollment/CareGroup, Grant, policy, and lifecycle visibility. A lost command identity falls back to a current-state presenter and cannot manufacture a probe command or `open_result` token. Deterministic context drift invalidates the old context with no Execution/business success, while retryable transaction/transport failure leaves context usable only within its TTL. Both positive business outcomes store `handoffRequestSnapshotsPayload=[]` and no driver ref. Grant confirmation requires no durable Step and creates no Handoff, Outbox, notification, deep link, teacher visibility, Message, Receipt, Item, or Attention. A later family question is a separately reviewed command and the only point where content or activation may begin. Presenter/network failure never compensates the committed Grant; current-state read or exact replay recovers it.

Pilot-0-C2e-4a treats replacement as a new owner-confirmed authorization rather than mutation or rolling renewal. Only the exact active Grant owner with current Guardian/Family authority may prepare and submit `replace_child_link_grant`; another Guardian, Institution, Caregiver, Operator, service identity, or owner-ineligible actor cannot substitute. The five-minute strong-authorization review compares old/new profile and actual expiry, states that old authorization and old-Grant work stop immediately, and binds exact actor/role/process/Enrollment/current CareGroup/old Grant version/new canonical profile/surface. One Serializable transaction resolves replay, locks current facts/context/old Grant/Thread, uses database transaction time, consumes context, changes old `active -> replaced`, writes `replacedAt`/`replacedByParticipantId`, creates one new active same-owner Grant carrying unique nullable `supersedesGrantId`, reuses the exact Enrollment-private Thread, fences old-Grant dependents, and stores Execution with terminal-old/new-active/Thread refs. New `effectiveFrom` equals old `replacedAt`; the active partial unique index allows neither overlap nor gap. A self-relation inverse query finds the successor, so a second stored `replacementGrantId` is forbidden. Exact same-definition returns `already_satisfied` without timestamp/expiry change. Revoked/expired/replaced old Grants require their fresh-current path, owner ineligibility defers to C-2e-4c, and Enrollment/CareGroup transfer stays C-2f. Replace/revoke races are expected-version first-commit-wins. Old Messages/Receipts/Items/Attention remain bound to the old `grantId`; Thread reuse is container continuity only and can never reactivate old work. Replacement stores explicit empty snapshots/null driver and emits no host activation, notification, or protected content.

Pilot-0-C2e-4b makes voluntary revoke an exact-owner strong authorization, not another Guardian's family-wide administration action or an AI-inferred intent. Chat, family board, and family workbench map to the same `revoke_child_link_grant -> nurture.family_care.revoke_grant` action and five-minute context; review discloses immediate authorization/work stop, retained audit, limits on recalling already seen surfaces, irreversibility, and the fresh-authorization requirement. One Serializable transaction resolves exact replay; locks and owner-rereads context, current Guardian facts, Grant, Thread, and dependent boundary; obtains database time; validates expected version; consumes context; writes `active -> revoked` with `revokedAt`, exact actor, fixed server reason `user_revoked`, and version; invokes the same-transaction dependent fence; and commits Execution with only terminal Grant/Thread refs. C-2e-4d owns the exhaustive fence set and loop-to-closure algorithm, but no asynchronous or partially committed cascade is permitted. Exact replay returns the original outcome; a new still-eligible owner command against that revoked Grant is `already_satisfied` without audit rewrite. Replaced, expired, deleted, or missing Grant is not revoke success, while owner ineligibility defers to C-2e-4c. Revoke/revoke, revoke/replace, and question/revoke conflicts are expected-version or serialized first-commit-wins. Revocation cannot reactivate, replace, or restore the old Grant or old work, yet it does not give the former owner a permanent veto: any current Guardian may later perform the complete first-Grant review for a new future-only authorization. Revoke stores explicit empty snapshots/null driver and creates no Step, Handoff, Outbox, notification, deep link, or protected content.

Pilot-0-C2e-4c binds Grant ownership to an exact Guardian authority row, not only a Participant. Additive nullable `grantedByRoleAssignmentId` is a Restrict FK; every new or Pilot-active Grant must carry the exact role used at confirmation, and activation preflight quarantines missing or ambiguous legacy bindings rather than guessing. Current owner eligibility requires that exact role id, participant, Guardian type, Family/ChildCareProcess reach, effective window, status, and deletion state. A new RoleAssignment for the same Participant cannot revive an old Grant. Host account disablement or workspace-membership loss remains a My-Chat access fact: it denies the affected canonical user's ingress, presenter, action, and stale open but does not rewrite Nurture RoleAssignment/Grant or create a global cross-role revoke. A suspended exact Nurture role blocks the Grant and all original-Grant work while keeping the Grant row nonterminal; only reactivation of that same role row may restore eligibility after complete owner reread. Revoked, expired, deleted, or time-ended exact role is terminal owner loss and permanently invalidates the Grant without transfer. C-2b-4 self-exit performs role revoke, actor-owned Grant revoke with `owner_self_exit`, complete fence, and one Execution atomically. A terminal role observed outside that command blocks immediately through the authoritative predicate and converges through idempotent Nurture-local `owner_role_ended` reconciliation; no Host queue or cross-database transaction is an authorization boundary. If another current Guardian exists, a complete first-Grant confirmation may atomically terminalize an unreconciled owner-ineligible old Grant, fence it, and create an independent new future-only Grant bound to the new confirmer and role. The confirmation emits only new Grant/Thread refs, stores no `supersedesGrantId`, and never revives old objects. Temporary Host loss or exact-role suspension cannot be bypassed by a peer's new Grant. Owner-loss/recovery paths remain explicit-empty with no Step, Handoff, Outbox, notification, or protected-content creation.

Pilot-0-C2e-4d separates irreversible lifecycle convergence from reversible availability fences. Grant revoke/replacement/expiry/terminal-owner-loss and exact source/reply redaction invoke a versioned local cascade; Host access loss, exact-role suspension, owner-service outage, and temporary policy/Institution/CareGroup unavailability only deny current reads/actions/delivery. A typed `NurtureInteractionContextDependency` child table links each context to one or more exact Grant/Message/Item/Receipt rows through nullable typed Restrict FKs plus an exactly-one check, eliminating JSON scans and supporting multi-candidate clarification. The cascade locks Grant before Message and all roots before dependents, verifies root/version/cause, counts against a Pilot hard cap, then uses deterministic primary-key keyset batches inside one Serializable transaction with no `SKIP LOCKED` or intermediate commit. Every dependent writer locks/revalidates the root, and final `NOT EXISTS` checks prove closure before root, contexts, Receipt controls, Item/event state, Attention projections, Thread summary, bounded `NurtureLifecycleCascadeAudit`, and Execution commit together. Overflow fails before root mutation; no prefix may commit. Grant invalidation revokes active contexts; terminalizes Receipts; suppresses actionable Items, clarification, and Attention; removes body-derived secondary projections; and retains protected Messages/immutable audit under role-aware author/receiver access. Guardian-source redaction suppresses its dependent workflow without deleting an independently authored reply; caregiver-reply redaction removes only reply-side body/receipt/context/projection and never suppresses or reopens the source Item. Cascade audit contains root/version/cause/schema/counts/closure hash/time/Execution only, no bodies or dependent-ref lists; prior exact output-ref contracts remain unchanged. Existing immutable replay seeds are not rewritten. My-Chat may materialize refs-only technical work, but owner reread at materialization consumer, provider retry, and open yields stopped/skipped/tombstone without new invalidation Handoff. C-2e is complete as a planning contract.

Pilot-0-C2f-0 defines Enrollment topology lifecycle before command-specific mechanics. `active` and `paused` remain current and uniqueness-conflicting; `ended` and `withdrawn` are terminal identities that never reactivate; `pending` remains legacy conflict-only because Pilot confirmation creates no pending row; and `deleted` is not an executable Pilot lifecycle or retention shortcut. Guardian is the only family-side Enrollment restriction/withdrawal actor class, while exact-scope Institution Admin is the only institution-side restriction/end/transfer-proposal actor class. Caregiver, Lead Caregiver, Technical Operator, service identity, AI interpretation, raw ids, My-Chat membership, and ambient workspace administration cannot change Enrollment topology. Pause is reversible current denial; permanent outcomes close old Grants/work through C-2e. Transfer ends the old Enrollment and creates a new identity with no old Grant, Thread, or content authority. Different-Institution Enrollments stay independent. Exact My-Chat Child/Family identity may be reused, but each workspace keeps separately authorized Nurture Child/Process/Family associations and no role, Enrollment, Grant, Thread, content, or history migrates automatically. C-2f-5 owns result, recovery, presenter, and Handoff semantics.

Pilot-0-C2f-1 models pause as side-owned, versioned restriction evidence rather than a mutable global boolean or personal veto. Additive `NurtureEnrollmentPauseHold` rows allow at most one active `family` and one active `institution` hold per Enrollment; `released` records an authorized same-side resume, while reserved `closed` lets C-2f-2/C-2f-3 terminalize a remaining hold without falsely claiming recovery. Each row carries safe fixed reason, exact place/release actor and RoleAssignment, database times, versions, and CommandExecution refs, with no free text or auto-expiry. Active holds are authorization authority; `Enrollment.status` is an atomically maintained aggregate and every read fails closed on hold/status inconsistency. Any current exact-Family Guardian may place/release the shared family hold, and any current exact-scope Institution Admin may place/release the shared institution hold; actor audit creates no hidden primary or orphan-prone personal veto, and cross-side release is always denied. Guardian uses `suspend_family_enrollment` / `resume_family_enrollment`; Institution reuses `suspend_enrollment` / `resume_enrollment`, with resume defined only as release of the institution hold. Five-minute current-state confirmation discloses side, blocked cross-role access, retained facts, non-recall, continuing Grant expiry, other-side independence, and conditional recovery. One Serializable transaction locks context, actor role, Enrollment, then holds; validates expected versions; creates/releases the side hold; recomputes status; increments Enrollment version even if still paused; and commits audit/Execution. Exact replay is stable; same-side duplicates are `already_satisfied`; stale concurrent cross-side confirmations conflict and must be reviewed again. Pause mutates no Grant/Thread/Message/Receipt/Item/Attention lifecycle, extends no clock, and triggers no cascade or bulk replay. Existing business objects may become usable only after resume plus complete current owner reread. Institution/CareGroup lifecycle pause remains a separate upper-scope fence and never fans out hold rows.

Pilot-0-C2f-2 makes same-Institution CareGroup transfer a two-owner intent plus one atomic Nurture cutover. Exact Institution Admin uses workbench-only `propose_enrollment_transfer` / `cancel_enrollment_transfer`; any current exact-Family Guardian uses `confirm_enrollment_transfer` / `decline_enrollment_transfer` from all Guardian surfaces. No direct `transfer_enrollment`, initial `initiate_enrollment`, terminal `close_enrollment`, Enrollment Invitation, raw recipient, Caregiver, Operator, or AI path may substitute. `NurtureEnrollmentTransferIntent` binds source Enrollment/version and source/target Groups under one Institution, proposing actor, seven-day expiry, fixed safe reason/hash, lifecycle/audit, and at most one effective pending identity. Proposal/confirmation require an active source Enrollment with zero pause holds; any later hold/version change makes the intent stale. The reusable model can represent an existing paused/archived source for transfer-out, but the later C-4 activated Pilot evaluator explicitly narrows proposal, Guardian review/open, confirm, and decline to an active source Group; paused/archived transfer-out is not implemented or activatable in Pilot. Target Group and Institution must be active and target staffing/policy/gates/capacity current. Additive `Enrollment.rosterEntryId` binds one exact roster identity. The new Enrollment alone stores unique Restrict `predecessorEnrollmentId` plus `continuityKind=care_group_transfer`; no old-row successor mirror exists. C-2f-3c replaces the unimplemented `supersedesEnrollmentId` proposal with the generalized pair so transfer and re-entry cannot form competing lineage ledgers. Confirmation creates the target RosterEntry only after Guardian authorization. One Serializable transaction resolves context/current actor, locks source Enrollment before TransferIntent, then Groups/holds/source roster/ordered Grants/Thread roots, preflights cascade capacity, obtains one database time, writes old `ended + leftAt + care_group_transfer`, terminalizes old Grants and dependents, closes old Thread and source roster, creates target roster plus new active Enrollment with `joinedAt=leftAt`, consumes intent, and commits lineage/audit/Execution. C-4-2 later normalizes that source Roster fact to `status=closed + terminalReason=enrollment_transferred`; the older `transferred`-status shorthand is not a second lifecycle. C-2f-3b supersedes the earlier Intent-first prose so pause/transfer/end/withdraw use one Enrollment-first topology order. Any fault, race, integrity defect, or cascade overflow rolls back the complete cutover. Old roster/Grant/Thread/Message/Receipt/Item/Attention/context/Handoff/notification/policy and care facts stay bound to the old topology; target caregivers receive only safe current roster visibility until a fresh target Grant creates a new Thread. Exact delivery/result semantics remain C-2f-5.

Pilot-0-C2f-3a separates permanent family withdrawal from Institution service end instead of exposing a generic terminal mutation. Guardian Chat, family board, and family workbench converge on `withdraw_family_enrollment -> nurture.family_care.withdraw_enrollment`; Institution workbench retains `close_enrollment -> nurture.institution.close_enrollment`, while Institution board is read-only. Any current exact-Family Guardian may independently withdraw the shared Enrollment; Grant ownership, invitation receipt, join order, a hidden primary role, and unanimous Co-Guardian approval confer no Enrollment authority. Any current exact-scope Institution Admin may end service independently; neither owner side countersigns the other's terminal decision. Both actions require a five-minute current-state strong confirmation and accept no client reason, actor, status, or audit fields. Family withdrawal maps only to terminal `withdrawn + family_withdrawn`, Institution service end to terminal `ended + institution_service_ended`, and completed transfer remains `ended + care_group_transfer`. Current `active|paused` may enter either permanent-exit path. An active hold cannot veto termination and is later closed by the terminal system effect, never presented as a same-side release. Caregiver, Lead, Operator, service identity, Host admin, AI inference, raw ids, generic `end_enrollment`, and action aliases remain forbidden. A committed terminal Enrollment never resumes; C-2f-3b owns exact hold/Grant/Thread/dependent closure and C-2f-3c owns fresh re-entry identity/history. Result, peer notification, delivery, and Handoff remain C-2f-5 and never gate the business commit.

Pilot-0-C2f-3b makes terminal exit one Enrollment-rooted Serializable closure rather than an Enrollment status write followed by eventual repair. Additive Enrollment terminal fields bind fixed reason, exact actor Participant/RoleAssignment, unique owning CommandExecution, database `leftAt`, and aggregate version. Hold `closed` requires `closedAt` plus `closedByExecutionId`, keeps release fields null, and preserves original placement audit. Topology-invalidated Grants become `revoked` under `enrollment_withdrawn|institution_service_ended|enrollment_transferred`, keep `revokedByParticipantId=NULL` because the terminal actor is not necessarily Grant owner, and link bounded CascadeAudit to the Enrollment Execution; elapsed status-active Grants converge as expiry instead of false revocation. TransferIntent adds system `invalidated(source_enrollment_terminal)`, every topology context carries a typed Enrollment dependency, Thread closes with executable/body-derived projection removed, and Roster becomes canonical noncurrent `status=closed` with reason `enrollment_withdrawn|institution_service_ended|enrollment_transferred`, as normalized by C-4-2, without delete/unlink. The global order is exact replay, context/actor, Enrollment, Institution/CareGroup, Hold, TransferIntent, roster, Grants by primary key, Thread, then C-2e roots/dependents; this Enrollment-first order supersedes C-2f-2 Intent-first wording and governs every topology command. The transaction preflights the aggregate hard cap before root mutation, obtains one database time, consumes the command context, writes all terminal facts/cascades/audits/Execution, then asserts no active Hold, pending TransferIntent, status-active Grant, executable context/retry/Item/clarification/Attention, active Thread, or current roster remains. Fault, phantom, overflow, integrity defect, or survivor rolls back all and triggers Pilot stop/manual reconciliation. Exact replay returns the original receipt; a fresh same-cause duplicate may be `already_satisfied` without actor/time/reason rewrite, while different causes and concurrent topology/work actions are first-commit-wins. Messages, care facts, authorship, and body-free audit remain retained; RoleAssignments, Institution/Group, other-Institution Enrollment, immutable Host seeds, and technical ledgers are not rewritten. No remote call occurs inside the transaction, and C-2f-5 output/Handoff/notification cannot determine commit.

Pilot-0-C2f-3c treats same-Institution return as a new care episode rather than terminal Enrollment reactivation. An exact Institution Admin starts from the owner-resolved historical Enrollment in the workbench, prepares a fresh unlinked RosterEntry, and reuses `initiate_enrollment` to issue a new seven-day Enrollment Invitation bound to the terminal predecessor/version and target CareGroup. The exact invited recipient must remain a current Guardian of that predecessor's ChildCareProcess and reuses `confirm_family_enrollment` on Guardian Chat, board, or workbench; re-entry permits no C-2b-1 platform/local identity-establishment branch, alternate child, old invitation, automatic enrollment, Caregiver/Operator/AI action, or `reactivate|reopen|reenroll` alias. The qualified platform identity/binding pair, local Child, ChildCareProcess, child-scoped Family, associations, and current Guardian roles remain longitudinal, while RosterEntry, Invitation, context, Execution, Enrollment, later Grant, and later Thread identities are fresh. One unique one-way `predecessorEnrollmentId` plus `continuityKind=care_group_transfer|fresh_reentry` is the sole Enrollment lineage SSOT; initial Enrollment has both null, and the generalized pair supersedes the unimplemented transfer-only field. A re-entry predecessor must be the fully closed same-workspace/process/Institution terminal leaf with `family_withdrawn|institution_service_ended`, no successor, and no current same-Institution Enrollment; transfer sources, deleted/broken evidence, fuzzy/latest-time inference, and cross-Institution lineage fail closed. Target Group may equal or differ from the old Group but must be currently ready. Confirmation locks and rereads the predecessor before new invitation/roster facts, consumes the bounded context, writes one active new Enrollment with database `joinedAt > predecessor.leftAt`, lineage, roster link, invitation consumption, audit, and CommandExecution atomically, and mutates no old episode or Grant/Thread. Old and new histories render as separate episodes: normal views allow only safe Institution/Group/date/terminal-class summaries without exact terminal actor, while protected bodies continue the existing side-local author/family, original-Grant, role, redaction, retention, and policy rules. A new Enrollment or Grant never revives old cross-role bodies, actions, Thread, delivery, notification, or context. C-2f-4 owns cross-Institution/next-stage portability, and C-2f-5 owns exact result, notification, deep-link, Handoff, and recovery behavior.

Pilot-0-C2f-4-0 separates four scopes before defining new commands. `NurtureChildCareProcess` is the current-Family-resolved longitudinal spine only inside one workspace; a stage episode is a family-owned phase on that spine; an Enrollment is an Institution-local relationship episode; and workspace remains the hard Nurture privacy/authority boundary. Same-Institution return and CareGroup transfer keep the C-2f-3c/C-2f-2 lineage rules. Entry to another Institution is ordinary fresh roster/invitation/Guardian-confirmed onboarding against the exact family-selected Child/Process, may coexist with another Institution Enrollment, never auto-ends it, creates no cross-Institution predecessor edge, and carries no old Institution Grant, Thread, content, role, audit visibility, or authority. A next-stage change keeps Child/Process and cannot itself create, move, or terminate Enrollment. If stage and Institution both change, the stage effect and new Enrollment remain separately authorized/committed; neither is the other's consent, rollback, or distributed-transaction dependency. Exact current My-Chat Child/Family identity and typed binding reuse across workspaces is allowed; automatic local-association reuse, fuzzy/PII inference, raw linking, dossier discovery, and profile/Enrollment/Grant/Thread/content/audit movement are Pilot `NO-GO`. A future scenario-data portability protocol must be separately versioned and consented over the already current platform identity and cannot create or claim another global identity. C-2f-4-1/2/3 now lock exact stage fact/lifecycle, visibility/concurrency, and the future protocol boundary; C-2f-5 owns results/delivery.

Pilot-0-C2f-4-1 makes additive `NurtureChildCareStageEpisode` the family-owned stage SSOT and keeps `ChildCareProcess.currentStageKey` as a same-transaction coarse-key projection only. A versioned catalog carries the stable product-contract coarse key plus an optional allowlisted fine key. One current Episode and one unique same-process predecessor produce a linear chain; database-time start/end, exact Guardian/RoleAssignment/CommandExecution refs, and fixed transition/terminal classes preserve audit. Any current exact-Family Guardian may independently use `update_child_care_stage -> nurture.family_care.update_child_care_stage` from Chat, family board, or family workbench after five-minute current-state confirmation; no primary, unanimity, Institution, Caregiver, Operator, Host, AI, age, birthday, roster, or model path may substitute. Initial set creates the first current Episode, normal change atomically closes the current leaf and creates a successor, correction closes the erroneous current leaf with explicit correction evidence and creates a successor, and clear closes the leaf without forcing a replacement; a later set links to that closed leaf. Exact replay is immutable, same-stage duplicates are already satisfied, and stale Guardian concurrency refreshes/reconfirms. Past Episodes and start times are not edited or backdated in Pilot. Projection mismatch and unproven legacy `currentStageKey` fail closed for owner reconfirmation, never heuristic backfill. Fine pregnancy guidance remains a non-medical workflow result rather than canonical stage authority. Stage effects mutate no Enrollment/Grant/Thread/artifact and grant no Institution visibility; C-2f-4-2/3 now lock multi-Institution visibility/concurrency and the future protocol boundary, while C-2f-5 owns result/delivery.

Pilot-0-C2f-4-2 allows one current Guardian longitudinal read without creating a shared Institution projection. The family presenter starts from current exact-Family ownership and may aggregate the StageEpisode timeline plus safe Institution/Group/joined/left/current-or-historical/terminal-class summaries for every Enrollment episode on the exact ChildCareProcess. Protected Message/Grant/Thread/Receipt/Item/care facts remain nested under the original Enrollment and current Family/role/original-Grant/redaction/retention policy; aggregation never merges Threads or authority. Institution Admin and Caregiver reads instead start from the current exact Institution/CareGroup role and are filtered in the repository query before rows return. Each Institution sees only its own safe roster/current-or-history summaries and independently Grant-authorized content; other-Institution existence, count, name, status, stable raw Child/Process id, route token, error distinction, stage, and protected history are absent. Enrollment/roster grants no stage visibility and Pilot adds no `child_development_stage` dataClass. Current Enrollment uniqueness remains per workspace/process/Institution, so separate Institutions may commit independently; shared Process locking may serialize briefly but cannot manufacture cross-Institution conflict or mutation. Enrollment commands bind/reread only relevant family ownership, process lifecycle, invitation, roster, Institution, and Enrollment facts; an unrelated stage projection version cannot alter topology outcome. Every list/detail/action owner-rereads. A failed/stale family segment becomes safe unavailable without cached fill, while unaffected episodes remain independently current. C-2f-4-3 now locks the future cross-workspace protocol boundary and C-2f-5 owns exact results/routes/delivery.

Pilot-0-C2f-4-3 permits exact reuse of a current My-Chat Child/Family identity while keeping all cross-workspace Nurture dossier lookup, presentation, matching, merge, import/export, content/history movement, and authority carryover disabled. The target must establish a fresh exact workspace association and its own current Participant/Role/Process/Family/Enrollment/Grant predicates. Same adult, name, birth fact, contact, roster, or media never substitutes for the binding. The earlier copy-and-reconfirm design and its Nurture `displayName|birthDate` payload are withdrawn: platform identity fields come only from the My-Chat owner API, and any future scenario-data transfer is a separate versioned consent protocol over an already current platform identity. Global binding revoke fences every route without rewriting local facts; one workspace exit does not mutate the global binding; merge conflicts quarantine rather than auto-rebinding or merging dossiers. Existing Workflow Handoff/Outbox cannot carry portability bodies or become commit authority. C-2f-5 owns exact result, surface, recovery, and Host-effect semantics.

Pilot-0-C2f-5 closes current lifecycle result and delivery semantics without turning technical recovery into a second business authority. `NurtureCommandExecution.businessOutcome=applied|already_satisfied` is immutable business evidence, while response-only `disposition=executed|replayed` reports how the caller obtained that evidence. The user-visible result is always rebuilt by one of `enrollment_lifecycle_current`, `enrollment_transfer_current`, `enrollment_confirmed`, or `child_care_stage_current`, and classifies current owner-read state as `changed|already_current|processed_but_unavailable`; it never claims a later caller performed, owned, or jointly approved an earlier effect. Exact versioned output refs bind the direct command roots/results only and remain server-side: they never enter a client payload, URL, route state, Host Chat transcript, notification, Handoff, analytics, or query dimension. Stable command-id replay lookup precedes consumed/expired-context rejection, validates canonical hash/caller/original-Step provenance, and returns the original outcome/refs with `disposition=replayed` before current presentation. Losing the command id falls back to an ordinary current presenter, never a probe command or `open_result` token. A post-commit presenter, network, Step, Handoff, or provider failure cannot compensate, delete, or reopen the committed Nurture fact; same-Step reclaim may finish once and wrong-Step replay is denied.

Host attention remains deliberately sparse. Existing `user_attention` stays exactly bound to `family_care_message|child_link_receipt|family_care_item` and is never widened or reused for Enrollment lifecycle. A future additive `guardian_relationship_attention` contract may carry only purposes `review_enrollment_transfer|enrollment_relationship_changed` and source context types `enrollment|enrollment_transfer_intent|guardian_role_assignment`. Transfer proposal snapshots every current exact-Family Guardian RoleAssignment; family withdrawal snapshots only other current Guardians; Institution service end snapshots all current Guardians. Pause/resume, transfer cancel/decline/confirm, fresh re-entry confirmation, stage set/change/correct/clear, and current cross-workspace portability produce `[]`; initial/fresh re-entry invitations keep the existing Host Enrollment Invitation path. One stable cohort-level draft key binds workspace, scenario, purpose, source identity/version, and canonical commit-time recipient-set hash; the individual RoleAssignment episode enters only the My-Chat candidate/link identity beneath the resulting Handoff. Current recipient/source/expiry reread, refs-only body, generic provider copy, and destination-bound notification open prevent delivery from becoming business authority. A non-empty-capable command must be driven by a persisted and claimed original My-Chat Step before the first Nurture commit; absent trusted provenance fails before commit, zero eligible recipients produces explicit `[]`, and materialization remains capability-gated/default-off until separately implemented and validated.

Pilot-0-C3-0a adds Account–Subject reachability as the missing product spine without equating subject with account or centralizing a Child record in My-Chat. My-Chat's activated user-facing business catalog converges on education/nurture; reusable Chat, Workflow, Notification, Forum, Knowledge, Admin, and delivery infrastructure may remain subject-neutral. Product experiences remain child-centered, while reusable Base/My-Chat contracts use generic `subject` so a domain may map it to a child-development, learner, or other explicitly reviewed education/nurture process. The authenticated adult is an actor. Every business presenter and action must begin from the My-Chat account/workspace and let the scenario owner resolve a current relationship path before revealing a subject context or issuing an action context.

The Nurture reachability graph is exact and owner-local. Guardian resolves `MyChatUser -> Participant -> current Guardian RoleAssignment -> exact Family -> ChildCareProcess`; C-3 Caregiver resolves through one exact current operational `caregiver` RoleAssignment with `scopeType=care_group`, then the exact CareGroup and current eligible Enrollments to a subject collection. Lead designation is separate metadata, while Institution/Enrollment-scoped roles are invalid for the Pilot. Institution Admin collection reachability is reserved for C-4 and remains absent from the C-3 product candidate. A prospective invitation exposes only its separately allowlisted invitation context and cannot manufacture an established Subject relationship. Technical Operator has no Subject relationship. `unresolved` means the authenticated actor has not yet selected one of multiple owner-returned safe candidates; `single_subject` means one exact owner-resolved process; `subject_collection` means a role-scoped aggregation and never bulk action authority.

An activated business scenario declares a versioned subject provider capable of listing current reachable subject contexts and resolving/rechecking one opaque context. My-Chat owns the protected platform Child/Family identity and scenario-binding ledger; Nurture maps each result to one exact workspace-local ChildCareProcess subject. My-Chat may organize entry by its current platform Child identity, but creates no second Subject authority table or Nurture authorization cache. Every tile/detail/action/open rereads the Host binding/membership pair and the exact Nurture association, Participant/Role, topology, Enrollment, Grant, policy, and lifecycle. Subject handles never become raw ids, URL/analytics correlation, PII matching, portability authority, or a child login. A prospective invitation exposes only its minimum context and parent-owned onboarding action; no established dual-owner path means no ordinary subject presentation or action.

Pilot-0-C3-0b-0 separates transport trust from business authority. My-Chat remains the sole public business ingress. An internal Nurture call must independently prove an allowed My-Chat service caller and carry a Host-established adult principal. The service caller proves only which workload made the private call; the adult principal proves only the canonical account, human actor, one validated workspace, registered scenario/surface provenance, request/correlation evidence, and whether the principal originated from an interactive session or durable Run actor. Neither proof may contain or imply Participant, RoleAssignment, Guardian/Caregiver/Institution role, Subject, Family, CareGroup, Enrollment, Grant, policy result, target availability, or command authority. Nurture binds Participant from the account reference and owner-resolves all business facts; the Host actor reference remains provenance and cannot choose a Participant.

The activated subject-aware path requires one exact workspace established by My-Chat after current membership/entry checks. A client may request a workspace selection, but selection is not proof, and Nurture cannot infer or substitute workspace from Participant history, a cached Subject entry, notification, conversation, or token. Registered server routing establishes surface provenance, but a valid surface is context rather than business permission. Interactive tokens, expected versions, action keys, opaque targets, confirmation input, and idempotency values may be validated and echoed across the boundary without becoming trusted role/scope evidence. Bearer credentials, service credentials, claim tokens, and raw scenario tokens never enter Nurture facts, logs, analytics, or durable Host business state.

Invitation acceptance remains a separate My-Chat identity transition so a prospective adult is not required to possess target-workspace membership before accepting the exact invitation. My-Chat authenticates the recipient, consumes the Host invitation, and establishes the applicable membership before ordinary subject-aware ingress; Nurture then applies only the separately authorized prospective onboarding contract. Workflow replay must later recover the adult from the durable Run actor plus current workspace membership rather than treat the worker service as the business actor. Technical Operator and C-0 bootstrap remain distinct restricted paths. Exact public session/workspace behavior is C-3-0b-1, private principal/envelope names are C-3-0b-2, path variants are C-3-0b-3, and input/denial/audit conformance is C-3-0b-4.

Pilot-0-C3-0b-1 defines three Host context modes instead of forcing every My-Chat conversation into a business workspace. `platform_general` is account/public-policy-level daily AI use for generic questions and global/public knowledge; it may use a personal workspace internally as a storage partition, but that partition is not an established business workspace, cannot authorize workspace-private knowledge, and cannot build a Nurture principal. `workspace_business` is the only ordinary subject-aware mode and requires one exact workspace established from a server-owned resource, an explicit shell selection, or a sole membership only after the user has already entered an explicitly business-scoped route. `invitation_acceptance` is an account-authenticated exact-recipient Host transition whose target workspace is not ordinary business context until acceptance commits.

A general Chat request may receive generic non-personalized education/nurture guidance without Nurture. When a request needs private family, child, teacher, Institution, or workflow facts, My-Chat offers an explicit transition into a business workspace. The transition is explicit even when only one eligible workspace exists. It creates/enters a workspace-scoped conversation rather than relabeling the general thread, and by default carries only the current confirmed trigger intent, not prior messages, attachments, searches, or inferred context. Multiple workspaces require selection. My-Chat then applies current membership, environment capability, scenario registration, workspace allowlist/Pilot cohort, and server-derived surface gates before creating the C-3-0b-2 principal and calling Nurture.

Resource-bound workspace wins over shell selection for existing Chat threads, Notifications, Workflow Runs, and business routes; any mismatch fails closed. A new business route may use an explicit shell selection or an unambiguous sole active membership, but silent personal-workspace fallback is forbidden. Every request reauthenticates the Host session; opaque scenario tokens and prepared actions cannot extend that session. Reauthentication rebuilds the principal and current owner view but never auto-submits an old action. Membership loss stops before Nurture, and multi-tab use follows each resource's workspace rather than a globally mutable recent workspace.

Invitation preview/accept first authenticates the account, resolves the exact current recipient-bound Host invitation, shows only its minimum safe context, and requires explicit acceptance. One Host transaction consumes the invitation and establishes/reuses membership with exact replay. Nurture onboarding is a separately idempotent post-membership continuation and never shares a distributed transaction with Host acceptance. Host acceptance remains an identity lifecycle even when Nurture runtime gates later deny the continuation; it creates no Nurture role or Subject access. Pilot relies on its isolated synthetic workspace, while broader rollout must separately review generic My-Chat workspace ACL exposure. Current personal-workspace fallback and absence of a real adult Workspace Invitation aggregate/route are implementation gaps, not accepted evidence.

Pilot-0-C3-0b-2 requires two independently verifiable private-call proofs. A service credential authenticates one allowlisted My-Chat workload against `nurture.private-api.v1`; a separate ES256 detached signature covers the exact UTF-8 `ScenarioPrivateInvocationV1` body for `nurture.scenario-invocation.v1`. The signed caller binding must equal the authenticated workload subject. Possession of either proof alone cannot reach Participant lookup. The initial workload subjects are `my-chat-api` for `interactive_session` and `my-chat-workflow-worker` for `durable_run_actor`; browser/mobile, provider, arbitrary worker, Technical Operator, C-0 provisioner, and Nurture itself are excluded pending their separately classified paths. Existing `NURTURE_INTERNAL_SERVICE_TOKEN` remains scoped to activation owner-read and cannot be reinterpreted.

`ScenarioHumanPrincipalV1` is exact and bodyless: version `1`, kind `human_user`, `my_chat/user`, `my_chat/actor`, and `my_chat/workspace` refs, plus `interactive_session|durable_run_actor` origin. My-Chat may sign only after rereading the active User, human Actor ownership, Workspace, membership, scenario/cohort/capability, and server-derived route/surface gates. Ordinary subject-aware calls bind exactly one active Participant from Workspace plus User; Actor is provenance only. The principal contains no membership role, Participant, Nurture role, Subject, Family, Child, Institution, CareGroup, Enrollment, Grant, policy result, target, action, PII, session, invitation, scenario, or claim credential. The existing `NurtureCommandExecution.business_actor_ref` is not a safe Host-Actor destination and is already polymorphic: legacy family-core writes a My-Chat/system ref while institution family-care commands require a Participant id. C-3-0b-2 therefore does not reinterpret historical rows or the legacy column globally. Activated C3 commands use the freshly resolved Participant as domain business actor; the exact-invitation `invitation_continuation` exception is defined by C-3-0b-3, and C-3-0d must select an additive typed/versioned persisted actor representation or an explicit migration while separately named/hashed Host provenance remains audit-only.

The signed envelope also fixes contract hash, issuer, exact audience, caller binding, scenario, endpoint, method, registered ingress surface, operation, request/correlation evidence, payload, and a single-use nonce. `issued_at` to `expires_at` is at most 60 seconds with 30 seconds of clock-skew tolerance. Nurture verifies caller, detached signature, exact body, algorithm/key, time, audience, route, contract and cross-field equality, then atomically consumes a shared-store nonce hash before any owner call. Network retry keeps the logical request and inner `command_request_id` but mints a fresh nonce and envelope after current Host reread. Transport replay is rejected; CommandExecution exact replay remains valid. Worker retry additionally preserves the original Step ref while claim evidence may rotate, and wrong-Step provenance still fails independently.

Normal key rotation prepublishes the next public key, changes the My-Chat signer only after verifier propagation, accepts previous/current keys for at least a 15-minute operational overlap, and then retires the previous key after no envelope can remain live. Emergency revocation removes the affected `kid` or caller credential immediately and fails closed without rewriting committed Nurture facts. Dev, Pilot, staging, and production use different credential/key sets; request-controlled key URLs, embedded keys, wildcard audience, algorithm selection, unknown-header fallback, and try-all-key verification are forbidden. A temporary Pilot static caller credential may exist only as one environment-selected authenticator with a separate high-entropy secret, exact caller/audience mapping, current/next rotation, and no fallback; the signed principal path remains identical.

The private route applies body/network guards, caller authentication, detached-signature verification, strict envelope codec, time/audience/caller/route/contract checks, nonce consumption, and operation-specific codec before producing an opaque `VerifiedScenarioInvocationV1`. Only that normalized object may enter the Nurture application service; domain services never receive HTTP objects, service/session credentials, JWS, nonce, raw envelope, or broad Host metadata. Replay storage contains only nonce hash and expiry. CommandExecution may retain safe contract/origin/surface/caller and hashed Host provenance, but no credential, signature, nonce, raw principal, or raw transport payload. Additive Base/My-Chat/Nurture adoption is gated by `trusted_scenario_invocation_v1`; one activated operation cannot fall back to optional `actor_id`, inferred/default workspace, broad `client_surface`, legacy internal handler, or a second auth adapter. C-3-0b-3 owns exact ingress-path variants; C-3-0b-4 retains client echo allowlists, public denial mapping, audit retention, and adoption evidence.

Pilot-0-C3-0b-3 makes the ingress field a versioned discriminated context rather than a broad client label. C-3 product ingress registers exactly `nurture_chat`, `family_board`, `family_workbench`, and `teacher_board`; `institution_board|institution_workbench` are reserved for C-4 and remain absent from the C-3 manifest/routes/presenters/candidate. Host transitions register `notification_open` and `invitation_continuation`; workflow runtime registers only `workflow_worker`. Base owns the reusable shape and validator categories, the Nurture manifest owns exact keys and allowed operation combinations, and My-Chat owns the server route-to-ingress registry. Device (`mobile|web|desktop`), generic `web_run_workbench`, and Technical Admin are not Nurture business surfaces. Surface remains eligibility/presentation/audit context and never supplies a role or enters canonical business command identity. A dedicated `my-chat-execution-recovery` caller uses the separate `scenario_execution_status_lookup_v1` endpoint/operation outside the ordinary human-principal ingress categories.

The ordinary signed matrix is closed. `my-chat-api + interactive_session` may use registered product surfaces and the two Host transitions. `my-chat-workflow-worker + durable_run_actor` may use only `workflow_worker` and an explicitly durable-enabled operation. Notification open first validates the exact Host recipient/workspace/Notification, performs a read-only Nurture owner transition, receives a current destination plus a newly issued destination-bound locator, and then creates a fresh product-surface invocation; provider and deep-link data never become principal or target authority. Durable replay rereads the persisted Run actor and current membership, validates the separately claimed original Step, signs immediately before the call, and never borrows the initiating UI surface as authority. Cross-origin, cross-ingress, cross-operation, and cross-Step substitution fail before business resolution, including on exact business replay.

`invitation_continuation` begins only after the independent Host invitation acceptance/membership commit. It uses a fresh `interactive_session` principal plus exact server-bound invitation evidence, but dispatches to a prospective-onboarding application service before ordinary Participant resolution. That service is the sole signed-human path allowed to atomically create or reuse a missing Participant for an explicitly registered onboarding transaction; it exposes only the locked prospective allowlist before commit and cannot implement a general find-or-create fallback. After commit, a new ordinary product-surface invocation performs current Participant/role/Subject resolution. The rule scopes the C-3-0b-2 zero-Participant denial to ordinary subject-aware paths without weakening the exact Workspace+User binding rule.

C-0 provisioning and Technical Operator recovery remain separate private boundaries. Provisioning uses its own versioned assertion/spec, workload caller, audience, verifier, gate, fixed bootstrap operation, and permanent one-business-effect closure; the accepted initial Admin is bound evidence rather than a caller credential or ordinary business principal. Technical operations remain in My-Chat except the previously locked `request_owner_reevaluation`, which uses a separate owner-recovery request with opaque refs/current Host evidence and operator audit provenance. Neither path constructs `ScenarioHumanPrincipalV1`, registers a Nurture role surface, resolves the provisioner/operator as Participant, or falls back to the ordinary private endpoint. Before D, `c4_bootstrap_evidence_controller` alone owns the disposable synthetic evidence spec/authorization/operation domain; Pilot-0-D owns issuance/custody only for the distinct real Pilot spec. Typed persisted business-actor semantics remain C-3-0d.

The implementation dependency direction is public route -> Host authentication/controller -> ingress orchestration/signer -> Nurture private verifier/controller -> variant application service -> domain resolver/policy/command -> repository. Routes and controllers do not resolve Nurture roles or query business persistence. The verifier validates only transport/caller/signature/strict wire semantics. Variant application services select ordinary Participant resolution, prospective onboarding, bootstrap, or owner recovery, while domain services retain current business authorization. Current optional Host identity metadata, broad `client_surface`, `NurtureHostInvocationEnvelope.event.kind`, `worker_runtime`, generic workbench labels, owner-read token, and polymorphic `business_actor_ref` remain explicit pre-activation gaps rather than aliases for the accepted model. C-3-0b-4 owns client echo, safe denial, audit retention, adoption, and negative closure evidence.

Pilot-0-C3-0b-4 completes authenticated-ingress planning with three disjoint field classes. Additive `ScenarioClientEchoV1` is a strict discriminated union for bounded Chat text, view query, clarification answer, action preparation, and action submission; every nested query/answer/operation input resolves an exact registered schema/version and rejects unknown fields. User/Actor/Workspace, route/ingress/caller/origin, request/contract/time/nonce, Host resource/driver refs, server-established request/driver identity inputs, and authentication-assurance evidence are Host-established and unavailable for client override. Participant/role/Subject/scope/Grant/policy/lifecycle/availability and canonical business-effect identity/hash/replay semantics remain Nurture-validated under the registered operation/driver contract. A valid signature proves exact transport of a client echo but never proves the echo's authority. Client `client_mutation_id` cannot become an authored `command_request_id`; a Host authentication-assurance assertion proves only the bound authentication ceremony, while Nurture strong authorization still requires the current owner context, policy, owner-issued submit context, exact action, and explicit confirmation. C-3-0d must lock the distinct direct-empty and claimed-Step command-identity derivations before either path can activate.

Public denial keeps Host context state and Nurture owner presentation separate. Malformed or authority-bearing client input fails `400`; missing auth fails `401`; account/workspace selection conflicts fail `409`; guessed or mismatched recipient/resource/workspace returns existence-indistinguishable `404`; current access loss returns safe `403` only for an already established resource; rate limits use `429`; verifier/owner outages collapse to generic `503`. Current Nurture denial, clarification, or target change returns a typed HTTP-`200` owner result with only an entitled safe reason. Exact command identity plus changed payload is a protocol `409`, not a second business effect. Free-form error details are replaced by closed safe field/rule/retry data and an opaque My-Chat support ref; internal signature/nonce/Participant/policy/error details never cross.

Audit is owner-split and content-free. My-Chat may retain exact canonical Host User/Actor/Workspace and route/gate evidence in its restricted ingress audit. Nurture retains workspace, caller/origin/ingress/operation, hashed Host provenance, resolved Participant business actor where applicable, CommandExecution/outcome/versions/refs, and closed decision classes. Logs/traces/metrics receive only low-cardinality technical dimensions and never identity, business refs, content, token, credential, provider/database raw errors, or owner candidates. Pilot defaults are nonce hash <= 5 minutes, traces 7 days, logs 14 days, de-identified aggregate metrics and ordinary ingress audit 90 days, and provisioning/operator/owner-recovery audit 365 days. Business facts/content follow Nurture retention and later C-3-0e privacy policy; ingress audit cannot duplicate protected bodies. Audit access is workspace-scoped, time-bounded, purpose-required, least-privileged, and itself audited.

Adoption remains Base -> My-Chat -> Nurture with one exact revision/hash and compatible route/surface/operation/caller/origin registries. Base adds reusable types/validators/legacy-vNext-negative fixtures only. My-Chat adds public parsers, Host construction/signer, denial/support mapping and Host audit behind a default-off capability. Nurture adds verifier/nonce/dispatch/safe-denial/audit and the isolated special verifiers. Joint negative/leakage/replay/onboarding/operator evidence is mandatory before dev capability; failure never falls back to legacy fields, routes, tokens, handlers, or authenticators. Rollback disables workspace allowlist/capability without rewriting facts. C-3-0b-4 adoption is ingress-only; the now-locked C-3-0e specifies complete subject-provider/presentation/action/protected-data/offline adoption evidence without claiming implementation.

Pilot-0-C3-0c-0 locks the presentation dependency direction as verified My-Chat invocation -> Nurture current subject/owner resolution -> display-safe semantic presentation -> My-Chat generic surface adapter/renderer. Base owns reusable structure and conformance only. Nurture owns relationship resolution, business state, safe disclosure semantics, and action availability. My-Chat owns the authenticated shell, generic Chat/card/list/detail/workbench components, navigation chrome, accessibility, device adaptation, and renderer registry. Neither Base nor My-Chat may import Nurture domain identity or reconstruct a business presenter from raw refs/codes.

Nurture Chat remains an AI conversation plus generic structured UI. AI narration is constrained to current display-safe Nurture presentation and generic Host state; the model cannot synthesize a Subject candidate, role, hidden fact, safe reason, or action offer. Chat, board, and workbench adapters converge on the same owner presenter and may vary only eligible subset/layout. A renderer cannot create a parallel lifecycle, command, token, or policy path, and cross-surface navigation performs current owner reread.

Presentation never becomes relationship proof, authorization, command input, replay evidence, or offline entitlement. C-3-0c-3 classifies owner presentation as ephemeral, permits only a content-free durable Host shell, and forbids protected/owner/action material from generic Host persistence; the now-locked C-3-0e defines protected-detail/draft/offline handling. Opaque owner context may cross requests only under its versioned Workspace/scenario-bound contract. C-3-0c-1/2 define provider wire and semantic blocks/actions, C-3-0c-4 defines presentation conformance/adoption, C-3-0d defines driver semantics, and C-3-0e defines protected-detail behavior.

Pilot-0-C3-0c-1 separates discovery from current revalidation. `list_subject_contexts` returns the one safely determined context, an owner-curated bounded selection, or a safe unavailable result. `resolve_subject_context` accepts exactly one previously issued context ref and returns the current context, a safe context-change result, or an indistinguishable unavailable result. My-Chat cannot rank, filter, merge, infer, or auto-select contexts from labels, counts, raw refs, surface state, or cached results. A `subject_collection` is one reachable context; the provider never expands collection members or exact counts.

`ScenarioSubjectContextRefV1` is a new bounded opaque string and is not `DomainContextRef`. Nurture internally binds the ref to Workspace, scenario, provider, verified current principal/Participant, owner locator, scope kind, context version, issue time, and expiry. A successful resolve may issue a fresh ref but cannot extend an existing ref in place. The ref cannot cross User, Workspace, scenario, or provider boundaries, and My-Chat cannot compare refs or versions to infer whether two contexts represent the same Subject. Surface is intentionally absent from the binding so an entitled cross-surface transition can perform fresh Host gates and a fresh owner resolve rather than treating the previous surface as authority.

The wire exposes only opaque ref, `single_subject|subject_collection`, generic `subject_detail|subject_collection` route class, owner-produced safe label/disambiguation slots, opaque context version, and issue/expiry timestamps. C-3-0c-2 defines those label slots as Nurture-resolved BCP-47 plain text. Raw/canonical domain refs, child profile attributes, health/media data, Guardian/Caregiver membership, Enrollment/Grant/relationship path, role/policy/action availability, collection members/counts, protected bodies, and stable cross-workspace/scenario correlation keys are forbidden. List cursors expire within five minutes; subject refs expire within thirty minutes; default page size is ten and maximum page size is twenty.

A subject context ref is a locator only. It is not relationship proof, bearer authorization, action authority, direct CommandExecution authorization, durable replay evidence, cross-surface permission, or offline entitlement. Every resolve rereads current owner facts. Every action prepare/submit later performs another owner resolve and obtains the C-3-0d action context. Guessed, forged, cross-principal, cross-workspace, cross-scenario, revoked, or expired refs produce existence-indistinguishable unavailability; a known established context whose owner meaning changed may return `context_changed`. Provider/database outage remains the C-3-0b generic HTTP `503` path and cannot use cached contexts.

Pilot-0-C3-0c-2 adds one read-only `present_subject_context` operation after subject resolution. The operation accepts the C-3-0c-1 subject ref, a manifest-registered presentation key, and the already codec-validated `current|recent|history` view query with an owner cursor/bounded page size and optional owner-issued `presentation_item_ref`. Surface, role, raw target, action authority, and business ids are absent. The item ref opens only a current owner-read detail and cannot become an action target. The closed result is `ready|empty` with one semantic presentation or `context_changed|unavailable` with one safe reason. Presentation results never redefine CommandExecution outcome/replay/result semantics, and provider/database outage remains HTTP `503` rather than a partial or cached result.

Safe copy is Nurture-localized plain text, not a My-Chat localization key. Each `ScenarioSafeTextV1` carries `kind=plain_text`, a bounded value, and normalized BCP-47 locale. `ScenarioSafeReasonV1` carries a registered scenario reason code, owner text/help, and generic `none|refresh|retry_later|contact_support` retry class. My-Chat renders the text verbatim and cannot map a reason/action code to new copy. Markdown, HTML, URLs, control characters, unresolved localization parameters, and internal command/policy/provider/database text are forbidden. `not_implemented` remains readiness/dev-only; provider/database outage cannot be recoded as an HTTP-200 owner-unavailable presentation.

The reusable semantic vocabulary is exactly six flat block kinds: `summary`, `notice`, `fact_group`, `metric_group`, `item_collection`, and `timeline`. A block has a response-local key, generic tone, safe text, and `allowed|display_only` narration policy. Metric blocks support entitled operational aggregates but no ranking, scoring, comparative trend, or Anti-Metrics breach. Item/timeline entries contain only bounded safe text, response-local keys, safe badges/timestamps, and short-lived opaque owner locators. Blocks cannot nest or carry arbitrary records/extensions, forms, drafts, protected bodies, attachments, media bytes, command/audit refs, or renderer-specific primitives.

Navigation and domain action offers are different unions. Navigation carries only a registered route class, safe label, optional `current|recent|history` mode, short-lived opaque continuation ref, explicit priority, and narration policy; navigation contains no URL, action key, raw target, or durable effect. An available action carries a registered `(scenario_key, action_key)`, safe label/help, prepare-only opaque target ref, optional opaque expected version, exact `explicit|strong_authorization` class, explicit `primary|secondary|tertiary` priority, generic tone, and narration policy. An unavailable action carries no target/version and may appear only when the current adult may know the action and target exist; existence-sensitive actions are omitted.

An action offer authorizes only a fresh C-3-0d action preparation request. The offer is not a submit token, policy result, relationship proof, command identity, or offline/cross-surface permission. My-Chat cannot infer priority/tone/confirmation from an action key or accept `command_key`, `handler_key`, `serverAction`, client params, arbitrary extensions, raw target ids, or submit tokens in presentation. The `available` wire variant needs no user-facing reason; the B3 `available` classification remains registry/telemetry evidence. Every prepare/submit owner-rereads current facts.

Pilot bounds are 64 KiB serialized output, 20 blocks, 20 fact/metric/item/timeline entries per block/page, 8 navigation offers, 8 action offers, label 80 characters, title 120, summary/body 500, and help 240. Presentation cursors, item refs, continuation refs, and action target refs expire within five minutes. The generic AI projection includes only safe text marked `narration=allowed` and strips refs, versions, reason/action codes, cursors, and action targets. AI narration cannot add facts, safe reasons, actions, confirmation, or submit behavior. C-3-0d defines draft/prepare/submit/confirmation execution; C-3-0e defines protected bodies/media/offline behavior.

Pilot-0-C3-0c-3 maps the four registered C-3 surfaces—`nurture_chat`, family board/workbench, and teacher board—to My-Chat-owned Chat semantic panel, role-board, and domain-workbench renderer families without putting a renderer or layout primitive on the wire. My-Chat separately proves all three generic families with neutral Host fixtures, including a read-only role-board fixture that rejects actions; neutral fixture coverage is not a Nurture Institution route/presenter or C-4 evidence. The Host preserves owner order/copy/tone/offers and may only reflow structurally compatible content. Unknown schema/block/field, missing renderer support, over-bound output, a forbidden action/surface combination, or any C-3 declaration of the reserved Institution keys rejects the complete presentation. The Teacher board retains complete owner-paginated authorized history because no Caregiver workbench exists. Pilot complete history uses `current|recent|history`, owner cursors, item detail, and owner-issued navigation. Arbitrary text search, Host sort, and compound business filters are deferred to a separate versioned owner query-control contract rather than added to the renderer or encoded in route/presentation keys.

Presentation persistence is closed into `owner_canonical`, `ephemeral_presentation`, `durable_host_shell`, and `forbidden_host_copy`. Nurture business facts/history remain owner-durable. Every subject/presentation response, safe copy, block/offer, owner ref/version/cursor, AI projection, selection, and render tree is foreground/request memory only. My-Chat may durably retain only content-free shell identity such as Host conversation/turn/page, Workspace/scenario, registered product surface/presentation key/route/view mode, renderer version, timestamps, and a generic rehydration marker. Composer-accepted protected bodies/drafts, raw ids, relationship/role/Grant/policy results, tokens, action targets/versions, cursors, candidates, and inferred state are absent from every Host persistence, delivery, observability, crash, and offline path. General Chat user-authored retention continues under My-Chat policy and is not a Nurture business draft; a Nurture semantic turn stores only a content-free placeholder and owner-rereads on reopen. C-3-0e's zero-copy guarantee begins at the protected composer and never claims that private text mistakenly typed into ordinary Chat was unretained.

Pilot presentation freshness is fail-closed. A foreground presentation has at most a 60-second display lease, further bounded by shorter owner refs; known revoke/redaction/policy/lifecycle invalidation clears it immediately. Background/lock, sign-out, Workspace/account/thread/surface/process/renderer change clears all ephemeral content. Resume/focus, refresh, navigation, pagination, detail, action prepare/result, retry, and Notification destination repeat Host gates and owner reads. Expiry/invalidation removes content and disables controls before refresh; owner outage returns a generic retry shell with no stale-while-revalidate, cached/legacy/offline fallback, or optimistic Nurture business state.

Accessibility is structural Host responsibility. My-Chat applies owner locale/direction, preserves semantic reading order, exposes block/list/timeline roles, announces label with value, and never relies on tone/color/icon/position alone. Controls require accessible names/states, focus/keyboard order, suitable touch targets, font scaling, and reduced-motion behavior. Refresh/changed/unavailable/completed transitions focus and politely announce a generic status; `critical` tone cannot become Host-invented urgent or emergency semantics. Accessibility/device/locale/focus coverage is activation evidence, not optional polish.

Pilot-0-C3-0c-4 closes presentation planning with one atomic Host capability, `scenario_subject_presentation_v1`. The capability covers the complete C-3-0c-1/2 provider and semantic-presentation wire plus My-Chat renderer/freshness/persistence compatibility, and it depends on `trusted_scenario_invocation_v1`. The capability does not authorize domain command execution. Until the separate C-3-0d action capability and active `domain_action_contracts` exist, an activated presentation path MUST emit no action offers. Splitting provider, presentation, renderer, or persistence into independently activatable partial capabilities is forbidden because no partial combination satisfies the fail-closed pipeline.

Base adoption remains additive. A new optional, versioned manifest area declares subject-context providers, semantic-presentation contracts, registered product surfaces/view modes/route classes/safe reasons, action-key references, and per-surface action-offer policy. Base owns the reusable types, strict codecs, validator rules, bounds, and conformance fixtures only. Legacy manifests without the area remain valid and behaviorally unchanged. Once any vNext presentation declaration is present, missing or duplicate providers/presentations/surfaces/operations, unknown references, absent trusted-ingress or presentation capability, missing Host surface support, an Institution-board action policy, or a legacy/vNext conflict for the same activated operation is fatal. Failure never falls back to `surface_mapping`, `internal_api`, `InteractionEnvelope`, Workflow dashboard presenters, or synthetic Nurture surfaces.

Adoption evidence uses separately named identities rather than one overloaded `contract_hash`. The existing `0bd8925e...01aa` path-content hash and `a97a5b14...e981` logical source hash predate C-3 and remain historical handoff evidence only. Future implementation adds `scenario_interface_source_v1` over the shared C-3 ingress/provider/presentation contract, codec, manifest, and validator source. Base and My-Chat MUST have the exact same source-set hash; Nurture MUST pin the exact Base revision, My-Chat revision, and source-set hash without copying Base source. Nurture publishes a distinct Scenario module contract hash covering its manifest and real provider/presenter registries. My-Chat records a distinct Host renderer conformance revision covering its surface registry, renderer, freshness, persistence, leakage, and accessibility evidence. C-3-0c slice evidence pairs these identities; none may substitute for another. It is not a direct activation record: C-3-5's candidate, evidence index, qualification current-state resolver, and typed activation row form the cumulative authority chain.

The implementation order is Base -> My-Chat -> Nurture -> joint conformance. Base first publishes the reusable contract and legacy/vNext/negative fixtures with no scenario/runtime/database/UI logic. My-Chat then adopts the exact Base revision, implements loaders, compatibility registry, generic renderer, ephemeral/persistence guards, and the default-off capability. Nurture then adopts the exact My-Chat dependency revision/source set, implements current owner providers/presenters, and declares only registry keys backed by real implementations. Joint evidence checks the exact revisions, source set, Scenario module, Host renderer, and mixed-version denial before any workspace allowlist. A local pnpm `file:` link remains a development convenience and is not adoption evidence; CI MUST materialize or checkout the exact pinned revision.

Nurture retains one canonical vNext manifest. A pre-activation manifest MAY be a mechanical projection driven by an explicit disabled-capability list, but the projection cannot be independently edited, change retained-operation semantics, or register an alternate handler. Conformance compares the canonical manifest and projection and permits only the expected removal of gated declarations. Rollback removes the workspace allowlist and disables the capability without entering a legacy path or rewriting Nurture facts.

C-3-0c-4 completes the presentation design and implementation-evidence specification only. It does not claim the shared contracts, providers, presenters, renderers, hashes, fixtures, capability, or allowlist exist. The now-locked C-3-0e supplies the complete-adoption evidence contract after C-3-0d action/driver and C-3-0e protected body/draft/cache/offline decisions; actual adoption remains unsatisfied.

Pilot-0-C3-0d closes action execution and recovery around one static action contract. The reusable `ScenarioDomainActionContractV1` binds `(scenario_key, action_key)` to one exact input schema, target-ref class, confirmation class, surface set, authenticated handler, command contract, and driver. The driver is exactly `nurture_direct_empty_v1|workflow_claimed_step_v1` and is invariant across surface, recipient count, business outcome, replay disposition, and transient failure. The atomic Host capability is `scenario_domain_action_execution_v1`; it depends on both `trusted_scenario_invocation_v1` and `scenario_subject_presentation_v1`. A partial prepare-only, submit-only, direct-only, claimed-only, handler-only, or legacy fallback path cannot activate the Pilot action set.

Every action follows owner preparation before submission. `prepare_domain_action` accepts only the registered action key, owner-issued prepare target, optional opaque expected version, and exact operation input, then repeats Host and Nurture owner resolution and issues a five-minute `submit_action` context. Preparation creates no CommandExecution, Workflow Step, Handoff, Outbox, or business fact. `submit_domain_action` accepts only the owner-issued submit token, exact confirmation, and bounded `client_mutation_id`; the client cannot repeat or replace action, target, version, actor, driver, command identity, Step, or Handoff facts. Strong authentication assurance is Host-established ceremony evidence only. Nurture still makes the strong-authorization decision from current Participant, role, scope, target, lifecycle, policy, owner context, and explicit confirmation.

`nurture_direct_empty_v1` creates no Workflow Run or Step. Nurture atomically validates and consumes the InteractionContext, commits the business effect and typed CommandExecution, and persists `handoffRequestSnapshotsPayload=[]` with no driver. `workflow_claimed_step_v1` uses a Host-first pre-claim binding: My-Chat idempotently persists a content-free original Step in a non-claimable `awaiting_scenario_binding` state; Nurture verifies the still-active submit context and immutably binds that exact Step without consuming the context or committing the business effect; My-Chat then makes only that Step claimable. The claimed worker invocation atomically consumes the context and commits the Nurture effect, CommandExecution, and snapshots. My-Chat later uses its existing `complete_step` transaction to complete the Step and materialize Handoff plus Outbox. Raw submit tokens, claim tokens, owner targets/versions, and protected bodies never enter the Step, logs, traces, metrics, Handoff, or Outbox.

Binding does not extend the original five-minute context. A Step persisted but never bound remains non-claimable and is stopped after expiry. A bound Step lost before publication is recovered by exact Step-to-context binding lookup. First execution after expiry fails closed and requires new preparation; an effect committed before expiry remains recoverable after expiry because Execution lookup precedes consumed/expired-context rejection. Same-Step reclaim may rotate transient claim evidence and return the original Execution/snapshots. A different Step cannot bind the consumed context, obtain the original seed, or finish the original effect.

The fixed claimed-Step set is `submit_family_care_question`, `reply_family_care_item`, `propose_enrollment_transfer`, `withdraw_family_enrollment`, and `close_enrollment`. The latter three remain inactive until the additive `guardian_relationship_attention` contract is implemented and adopted. Every other current Pilot domain action with no durable Host effect is direct-empty, including acknowledge/redaction, Enrollment confirmation and non-notifying lifecycle transitions, Guardian self-exit, stage mutation, Grant confirmation/replacement/revoke, and ordinary Institution/CareGroup/staff/policy mutations. `cancel_family_care_route` remains absent from Pilot. `initiate_enrollment` remains inactive until C-1/C-4 jointly classify the Nurture commit and existing Host Enrollment Invitation delivery/recovery. Host participant/Guardian invitation, C-0 provisioning, Technical Operator recovery, and cross-workspace portability retain their separately owned protocols and cannot become a third generic domain-action driver.

Nurture derives canonical effect identity instead of accepting client `command_request_id`. Direct identity binds the Workspace, action, and InteractionContext under `nurture.domain-action.direct.v1`; claimed identity binds Workspace, scenario, original Step, and action under `nurture.domain-action.claimed-step.v1`. Canonical payload hashing covers command contract, typed Participant, owner target/scope/versions, canonical input, context, driver, and original Step where applicable. Claim/lease/version evidence, surface, client mutation, transport nonce, and tracing never become effect identity. Existing polymorphic `business_actor_ref` remains legacy historical evidence; activated C3 writes require an additive versioned Participant FK/kind, while My-Chat User/Actor remains separately named Host provenance.

Results preserve three owners: persisted `businessOutcome=applied|already_satisfied`, internal `disposition=executed|replayed`, and current presenter `changed|already_current|processed_but_unavailable`. Direct submit returns completed only after the Nurture transaction. Claimed submit consistently returns Host-owned accepted/processing after binding and durable scheduling, then rehydrates current completion; it does not race between synchronous and asynchronous public semantics. Exact original-Step replay returns byte-equivalent snapshots. A different newly authorized Step that observes `already_satisfied` creates no fresh replay seed and returns explicit `[]`. Presenter, worker, Handoff, Outbox, Notification, or provider failure never compensates or rewrites the committed Nurture fact.

C-3-0d adoption adds a separately named `scenario_domain_action_source_v1` source set rather than extending or relabeling the presentation or historical handoff hashes. Base owns reusable types/codecs/validators/fixtures, My-Chat owns trusted dispatch/Step binding/direct and claimed orchestration, Nurture owns current authorization/effect identity/typed actor/transactions/snapshots, and joint conformance owns cross-path replay, privacy, capability, and drift evidence. Capability and allowlist remain default-off. C-3-0d is planning-complete only; the subsequent C-3-0e contract closes protected interaction and complete-adoption planning without claiming implementation.

Pilot-0-C3-0e locks one atomic protected-interaction data plane. `scenario_protected_interaction_v1` requires trusted ingress, subject presentation, and domain-action execution and admits only B3's trimmed 1–2000-character plain-text family question/caregiver reply with no attachments. The five policy classes are process-local unsubmitted draft, five-minute owner-encrypted prepared content, committed protected content, at-most-60-second foreground protected view, and body-free shell/audit. A prepared object is not a business fact; CommandExecution atomically attaches that same object to exactly one Message. Plaintext/ciphertext never copies into Message body, Item detail, Receipt, Attention, Execution, InteractionContext payload, Step, Handoff, Outbox, Notification, Chat, `PublicDraft`, analytics, observability, crash, search, or offline state.

Nurture adds an authoritative `NurtureProtectedContent` aggregate with `prepared|committed|erased`, typed owner/context/Message binding, per-content AES-256-GCM key, approved KMS-wrapped DEK, keyed integrity evidence, and Restrict Message relation. Activated Message writes keep `body=null`; synthetic refs, JSON protection payloads, and `plain_text_dev|protected` scaffold states are not authority. `read_protected_detail` accepts only an owner-issued opaque locator and rereads current Participant/role/subject/thread/enrollment/grant/source/lifecycle/policy before returning `ready|tombstone|context_changed|unavailable`. Ready plaintext is no-store foreground memory for at most 60 seconds; owner outage and stale/offline paths return no body.

My-Chat must render a distinct protected composer that never calls ordinary Chat persistence or durable draft/artifact paths. Nurture Chat warns before soliciting private detail and opens an empty composer from an intent-only conversation. Text entered into ordinary Chat remains under My-Chat transcript/provider/deletion policy, is never automatically copied/summarized into the protected lifecycle, and is not covered by the composer's no-Chat-persistence claim. Drafts have only current Participant + surface + foreground-process scope; deliberate leave is `stay|discard_and_navigate`, while background/lock/logout/context change clears them. `scenario_protected_ai_draft_v1` is a separate dependent capability and is off for Pilot-0; generic AI may narrate display-safe presentation but cannot receive protected bodies. Pilot retention is five-minute prepared authority with wrapped-key cleanup by 15 minutes, 30-day committed body, 365-day body-free business/audit evidence, zero durable AI prompt/output, and at-most-30-day encrypted backup with erasure-ledger replay before reads. Redaction/expiry crypto-erases the per-content key; Grant revoke stops unauthorized access but is not automatic global deletion.

Complete adoption adds `scenario_protected_interaction_source_v1` beside interface/action source identities and separately pins Nurture storage-crypto plus My-Chat protected-runtime conformance revisions and the retention policy. Order remains Base contracts -> My-Chat Host/privacy adoption -> Nurture schema/KMS/owner services -> joint fault/privacy/restore evidence. C-3-0 is `DESIGN COMPLETE / IMPLEMENTATION OPEN`; current synthetic refs, plaintext-copy seams, missing enforceable separation between the protected composer and ordinary Chat/`PublicDraft`, absent contracts/KMS/composer/leakage scanner, and default-off capabilities keep traffic NO-GO. Actual adoption is delivered through C-3-1..5, beginning with Guardian family communication.

Pilot-0-C3-1 makes one `NurtureFamilyCareItem` the internal composition root for a Guardian family-communication entry. The entry is a non-persisted Nurture presenter projection, not a Base type, Host object, new table, mutable conversation, or Thread authorization rule. It composes exact source Message/Receipt, Item/Event/Attention, optional unique reply facts, and the original Grant. `progress=sent|acknowledged|replied`, `entry_lifecycle=active|terminal|suppressed`, and independent question/reply visibility remain orthogonal, so revoke or redaction cannot erase prior business progress or automatically delete another author's body. A malformed or contradictory fact graph fails closed instead of being guessed from Item status.

The three Guardian surfaces share `guardian_family_communication_v1`. Chat shows body-free explanation and at most five current/recent entries, Family board shows one 20-entry current/recent owner page, and Family workbench provides 20-entry keyset-paginated history separated by Institution/Enrollment episode. History is fixed to 365 days from the source entry; each question/reply body independently expires 30 days from its own Message creation. List/detail shells are body-free, while each body uses a separate current `read_protected_detail`. Both current same-family Guardians may read the family-authored question under current policy, but only the exact author may redact; original-Grant invalidation removes Guardian receiver access to a caregiver reply and never lets a new Grant adopt the old entry.

Compose always opens an empty process-local protected editor; no ordinary Chat text is automatically transferred and protected AI remains off. Preparation creates one encrypted five-minute object/context with no business effect. Explicit submit binds a content-free original My-Chat Step before claim; the worker atomically commits protected content plus Message/Receipt/Item/Event/Attention/Execution/snapshots, and only owner reread can produce `sent`. Response loss recovers the same Step/Execution without resending the body. Source redaction is direct-empty, exact author plus current family reach, irreversible, and applies the established source cascade while preserving the highest committed progress.

C-3 implementation is an explicit DAG: C30 solely owns the shared contract/Host/owner baseline; C31 consumes C30 and adds only Guardian communication composition; C32 consumes C31; C33 consumes C32; C34 consumes C33; C35 converges the prior increments and adds admission/qualification governance. C-3-1 therefore does not recreate C30 shared sources or generic runtimes. `scenario.manifest.yaml` is canonical and generates its typed artifact; code registries must match it bidirectionally. The historical `capture_family_input`, manual preactivation filters, synthetic protected refs, broad input profile, and `ThreadParticipant` hard gate cannot be aliases or fallback. C-3-1 through C-3-4 may use only isolated test-harness composition; C-3-5 owns positive-only activation-control implementation and default-off qualification, while non-empty environment/Workspace activation remains Pilot-2. The C-3-1 status is `DESIGN COMPLETE / IMPLEMENTATION OPEN`; the subsequent C-3-2 contract closes Guardian relationship/authority design.

Pilot-0-C3-2 uses `guardian_relationship_authority_v1` as one scenario-local, non-persisted ChildCareProcess-root composition. Nurture produces the composition from one current owner query boundary while retaining independent RoleAssignment, Enrollment/Hold/TransferIntent, Grant, and StageEpisode roots and versions. The composition reuses `guardian_relationship_current`, `enrollment_confirmed`, `enrollment_lifecycle_current`, `enrollment_transfer_current`, `family_care_grant_current`, and `child_care_stage_current`; neither My-Chat nor a new relationship table may merge those lifecycles. Multiple same-workspace Institutions remain separate Enrollment episodes. Overview item refs open a fresh exact episode/root detail, which alone may issue an action target, preventing a subject-wide current Enrollment/Grant and avoiding the eight-action bound.

First-Guardian and Co-Guardian onboarding remain a dedicated Host invitation/prospective application-service lane. My-Chat owns raw contact, shell/delivery/authentication, platform identity/binding, and Workspace/Family membership; Nurture owns invitation intent, current inviter/recipient/family checks, workspace associations, relationship command, and CommandExecution. A non-deliverable Host shell is bound before Nurture intent commit and activated only after exact success/replay. Co-Guardian Host membership commits before the separate Nurture role operation; either side alone grants nothing and neither side compensates the other's fact. This path never becomes a generic domain-action driver or Handoff. Accepted self-exit is separately exposed as `exit_guardian_relationship -> nurture.family_care.exit_guardian_relationship`, strong/direct-empty, last-Guardian-denied, and atomic across role, actor-issued pending invitations, actor-owned Grants, and dependents without mutating Host membership.

Ordinary C-3-2 actions remain static across Guardian Chat, Family board, and Family workbench. Enrollment confirmation/pause/resume, transfer confirm/decline, Grant confirm/replace/revoke, and Stage mutation are direct-empty; family withdrawal is always a pre-bound claimed Step because withdrawal may emit the separate default-off `guardian_relationship_attention` seed to other current Guardians. Self-exit remains direct-empty and cannot acquire attention merely because `guardian_role_assignment` is an allowed relationship-attention source. Institution transfer proposal/cancel and service close remain C-4 producers, while Notification/deep-link continuity remains C-3-4.

Stage choice does not require a second input/form protocol. `child_care_stage_current` first emits owner-issued navigation and item refs over the current valid operation/catalog. Selecting an item performs another owner read; the final detail issues one `update_child_care_stage` target already bound to operation, catalog tuple, Process/current-Episode versions, and actor/surface. The item ref never becomes action authority. All relationship actions use current Nurture owner checks plus applicable Host recent-auth policy and explicit confirmation; Pilot adds no new mandatory password/OTP/biometric factor.

C-3-2 history contains all currently authorized canonical relationship/Enrollment/Grant/Stage facts retained by their owners, separated by episode and owner-paginated. C-3-1's 365-day communication-entry window does not apply. A new Guardian RoleAssignment may restore current family-side retained access and the exact Participant's author-redaction right, but cannot restore an old RoleAssignment, old Grant ownership, or original-Grant receiver-side body/work authority. Enrollment holds fence the affected episode's cross-role work and do not hide the ChildCareProcess, Stage, body-free episode shell, or otherwise authorized family-side history.

C-3-2 adoption remains Base neutral contracts -> My-Chat generic surfaces/action/invitation runtime -> Nurture schema/kernel/presenters -> relationship-attention source/consumer -> isolated joint evidence. Historical workflow hashes, C-3 source identities, Scenario module, Host renderer, Nurture relationship schema/command revision, and relationship-attention consumer revision remain separately pinned. The current schemas, legacy action/owner/deep-link paths, static token, `findFirst` Grant selection, `ThreadParticipant` hard gate, and partial cascades do not satisfy the gate. C-3-2 is `DESIGN COMPLETE / IMPLEMENTATION OPEN`; C-3-3 Caregiver operations is next, C-3-5 owns default-off qualification, and non-empty activation remains Pilot-2-only.

Pilot-0-C3-3 uses `caregiver_family_care_work_v1` as one scenario-local, non-persisted Item-root owner projection across Caregiver Chat and teacher board. The source Message/Receipt, Item/Events, exact TeacherAttention projection, original Grant, optional reply Message/Receipt, and protected-content visibility form one complete fact graph. Attention is a queue index, Receipt is a distribution fact, and Thread is a container; none is a second action/permission root. The current presentation combines attention summary and inbox blocks, while recent/history stay inside the same presenter. Legacy class-inbox/attention Workflow/internal-API responses cannot alias the C-3 presenter.

The Pilot Caregiver subject is one exact care-group `caregiver` RoleAssignment plus separate Lead designation and exactly one eligible work actor. Acknowledge is explicit/direct-empty and atomically creates an exact Participant+RoleAssignment work claim while leaving Attention active. Reply is explicit/claimed-Step, only from acknowledged by the same exact claim, and uses an empty manual protected composer, the Item's original Grant, one terminal reply graph, one logical `user_attention` Handoff, and a typed commit-time Guardian audience cohort. Reply redaction is explicit/direct-empty and exact original-staff-episode author only; it erases only the reply side and never suppresses/reopens the source Item.

Temporary role/Hold/policy/owner failure is a current fence, not a persistent Item mutation. Terminal claimant-role loss retains the acknowledged Item and active Attention as staffing-review work but permits no new-role/Institution/Operator takeover. Permanent original-Grant/Enrollment/source/retention roots use the established complete cascade. Question and reply bodies retain independently for 30 days; the body-free Caregiver product history shares the fixed 365-day source-entry window. Protected bodies never enter Chat AI/history/cache or semantic presentation, and the Pilot AI capability remains absent/off.

C-3-3 adoption is Base neutral sources plus versioned domain-action Handoff origin -> My-Chat generic Caregiver surfaces/protected runtime/action-origin materializer -> Nurture typed graph/presenter/commands/audience cohort -> strict direction/origin-aware `user_attention` delivery-plan seam -> isolated joint evidence. `complete_step` performs local atomic materialization without a remote owner call. Notification/provider/deep-link/open remain C-3-4; positive-only activation-control implementation and default-off qualification remain C-3-5, while non-empty activation remains Pilot-2. Current overbroad Admin/scope queries, client date/raw refs/body summaries, `ThreadParticipant` hard gate, open/waiting reply, current-Grant lookup, absent reply Handoff, partial cascades, synthetic protected storage, and legacy Handoff-id routes fail C-3-3. The checkpoint is `DESIGN COMPLETE / IMPLEMENTATION OPEN`.

Pilot-0-C3-4 closes continuity without adding an umbrella business-continuity state. Ordinary navigation remains `ScenarioNavigationOfferV1` with exact `route_class + current|recent|history`; Pilot Guardian/Caregiver navigation carries no `continuation_ref`. Protected drafts remain foreground process-local and require `stay|discard_and_navigate`; committed results remain the original CommandExecution/Step plus destination owner presentation. The new `scenario_notification_continuity_source_v1` and atomic Host capability `scenario_notification_continuity_v1` cover only recipient-bound Notification materialization, provider delivery, authenticated open, and destination reread. The capability depends on Handoff materialization, trusted invocation, and subject presentation; each binding declares any protected destination dependency.

One Handoff may fan out to multiple recipient Notifications without duplicating its business seed. My-Chat first persists an immutable per-commit-candidate plan with `WorkflowNotificationMaterializationCandidate.materialization_status=pending|materialized|skipped`, then adds a typed workspace-bound `WorkflowNotificationHandoffSource` relation unique by Handoff, recipient, and continuity key. The source link freezes opaque recipient binding, non-sliding horizon, contract/source/manifest allowlist hashes, generic-copy hash, and canonical intent hash but no selected route/view; the current open resolver selects an allowlisted pair. A local transaction creates Notification, typed link, delivery work, Outbox, and the candidate materialized outcome. Provider work separately uses `WorkflowNotificationDelivery.delivery_status=pending|leased|retry_wait|sent|skipped|dead_letter`; the shared `skipped` literal is namespaced and never translated between the two state machines. Existing rows use an explicit legacy source-kind discriminator; vNext neither copies Handoff ids into generic targets/metadata nor guesses/falls back from link presence.

Candidate settlement distinguishes crash-missing from terminal skip. Any pending candidate keeps the Handoff requested. All skipped with no Notification stops the Handoff; at least one materialized with every other candidate terminal completes it; hash/plan drift fails it. Command-time empty cohort creates no Handoff. A temporary exact-role fence remains pending until recovery or horizon, while a terminally skipped candidate is never later backfilled. Cross-database revoke races may still leave a generic row, so every provider attempt and open is fenced by a new owner read.

Background delivery uses a signed non-human owner-read invocation that can only resolve a delivery plan or exact create/send check; it cannot create a Participant, invoke a command, present content, or impersonate the original actor. Interactive open uses the signed current human principal after My-Chat validates the exact recipient-bound Notification and Workspace, marks only Host read state, and rereads the typed link plus requested/completed Handoff. Nurture's separate open resolver may route current acknowledged/replied/closed history, issues a hash-only destination-bound `open_notification` locator, and never reuses the delivery predicate. The destination performs a fresh product-surface invocation and second owner read before any protected body or action.

The exact normal notification routes are family question -> `teacher_board/current`, caregiver reply -> `family_board/recent`, transfer review -> `family_workbench/current`, and relationship change -> `family_workbench/history`; current open may select another allowlisted view for the same role route after lifecycle advancement. Caregiver teacher-board acknowledge may navigate to `nurture_chat/current`, where Chat rereads the claimant's acknowledged candidates instead of carrying an Item ref. External carriage is only Notification id plus generic safe copy and `morethan://notifications/{notification_id}/open`. Provider delivery has lease expiry/reclaim, bounded backoff/dead-letter, stable per-target request identity, and no Nurture business-state mutation. Host Notification, per-device provider delivery, Handoff, Nurture Receipt/Item/Message, and CommandExecution remain independent states.

Open visibility first binds the exact historical recipient role episode, then independently resolves body-free shell, protected body, and action visibility. A new/rejoined role never inherits an old Notification; the same temporarily suspended role may reopen after recovery only within the original non-sliding seven-day horizon. Grant/source/redaction/retention change may yield an owner-approved body-free tombstone/history for the still-entitled original recipient, while role/subject-reach loss is unavailable. Offline has no durable scenario inbox/body/token/action. Generic Host rows age out by 90 days and never become scenario history. C-3-4 is `DESIGN COMPLETE / IMPLEMENTATION OPEN`; positive-only activation-control implementation, rendered evidence, and qualified-default-off rollback proof remain C-3-5, while non-empty activation remains Pilot-2.

Pilot-0-C3-5 adds no business continuity aggregate. It consumes the strict C30 -> C31 -> C32 -> C33 -> C34 DAG, then adds the neutral Base `scenario_activation_admission_source_v1` for strict admission, recovery-only execution-status, `c3_evidence_run_authorization_v1`, qualification envelope/event, and current-state resolver wire/validator/negative-fixture SSOT. My-Chat owns admission persistence/issuance/quarantine and the isolated evidence-authorization plus release-governance stores/controllers/resolvers; Nurture owns admission verification, command fencing, and exact status lookup. The implementation converges every default-off node before one final dependency freeze. The immutable `c3_component_candidate_manifest_v1` uses a namespaced `component_candidate_id` that separately binds historical/C3 source hashes including activation admission, exact three-repository source commits and locks, canonical/generated manifest, My-Chat and Nurture executable/SBOM/provenance digests, both schema/migration streams, route/surface/action/renderer/provider/admission registries, admission persistence/issuer/verifier/status revisions, evidence-run authorization contract/controller/store/trust/verifier/resolver revisions, protected/KMS/signing/retention revisions, Notification candidate/link/source-kind identities, qualification governance revisions, activation profile, and topology/test code and plan—but never an authorization instance, evidence results, evidence-index digest, qualification event/envelope id, lifecycle, or approval. Every result references that id; a later body/secret-free evidence index binds the id, and a separately signed `qualification_envelope_id` hashes the candidate id, evidence-index digest, final gate census, and result. Evidence artifacts do not modify any candidate-pinned source commit.

Only the dedicated `c3_qualification_controller` signs both the qualification envelope and append-only `c3_component_qualification_event_v1` records under distinct schema/audience labels in one isolated qualification trust domain. After I0–I9, a prequalification seal binds the evidence index, final false/empty census, limitations, and C-4 negative inventory without claiming a result. The controller CAS-appends the deterministic predecessor-free `verifying` genesis, signs the envelope, then CAS-appends its `qualified_default_off|rejected` child. A crash after genesis leaves the resolver unqualified; exact pre-seal retry resumes idempotently, while changed evidence conflicts and may only reject that candidate. Event chains are partitioned by qualification profile plus candidate, use one unique current head, deterministic idempotency, and exact predecessor CAS. Events form one signature-verified predecessor chain: empty -> `verifying`; `verifying -> qualified_default_off|rejected`; `qualified_default_off -> invalidated|superseded`; `rejected -> superseded`; `invalidated -> superseded`; `superseded` is terminal, and the same candidate can never return to `verifying|qualified_default_off`. The My-Chat current-state resolver fails closed on store/verifier outage, unknown/revoked signer, broken/divergent chain, stale envelope, or ambiguous head. Technical Operator can immediately disable rows and request invalidation but cannot sign an envelope or event. Complete-Pilot admission consumes the resolver's current state, not a cached status/event reference.

My-Chat owns the positive-only technical `ScenarioWorkspaceActivation` store. Its typed row binds Workspace/profile plus `candidate_kind`, `release_candidate_id`, nested C-3 component id, nullable stage-typed `c4CompositeCandidateId`, exact `deployment_binding_id`, and a candidate-kind-specific authority. Database/codec constraints require the C4 id null for `c3_component_v1` and exact nonnull for `c4_composite_v1|complete_pilot_evidence_v1|complete_pilot_v1`. A `c3_component_v1` disposable row uses only `nurture_guardian_caregiver_pilot_v1` and current `c3_evidence_run_authorization_v1`. A `c4_composite_v1` disposable row uses only `nurture_institution_composite_evidence_v1` and current `c4_evidence_run_authorization_v1`; the profile enumerates the immutable C-3 bundle plus the complete C-4 evidence fragment/source/surface/action/invitation/Handoff/runtime bundle. A `complete_pilot_evidence_v1` row uses only `nurture_institution_complete_pilot_evidence_v1`, the exact complete candidate, current C-3/C-4 qualification, current D evidence authorization, and current isolated disposable-deployment binding; E, Pilot-1/persistent deployment, stage authority, external recipients and every C-3/C-4 evidence authority are invalid for that kind. My-Chat's append-only authorization stores and fail-closed currentness resolvers verify their isolated signer/trust/revocation domains; outage, expiry, mismatch, ambiguity, drift, or revocation denies. A `complete_pilot_v1` row instead uses exact profile `nurture_institution_complete_pilot_v1`, locked by Pilot-0-D and bound into the D complete candidate; no evidence profile can substitute. That row binds the complete candidate referenced by E, exact nested C-3/C4 candidates, E signature/head, Pilot-1 deployment head, stage authorization head and prerequisite seals, and independently requires current C-3/C-4 qualification plus current E/deployment/stage resolvers. Wrong or mixed profile/authority kinds deny. Any qualification/authority invalidation, ambiguity, outage, or deployment drift denies and forces disable. Normal business ingress/read/action/replay and delivery/open also require environment bundle true, matching complete runtime/registry hashes, current Host gates, and signed current Nurture owner policy.

The Host gate-read plus persistence/issuance of a short-lived body-free `ScenarioActivationAdmissionV1` is the technical admission linearization point. The assertion binds a random admission id, exact release/deployment/row/runtime identity, actor/Workspace, request/command hashes, required original Step hash for claimed driver or an explicit absent-Step discriminator for direct driver, and expiry; it is not a transport nonce or reusable capability. C-3-0b remains unchanged: every owner-call attempt has a fresh signed private envelope and transport nonce, and Nurture consumes the nonce hash in the shared store before any Participant/resolver/owner call. A retry before expiry uses a fresh nonce/signature while preserving the exact admission and business identity. The Nurture `CommandExecution + business effect` transaction validates/persists the admission hash, holds the deterministic command fence, and is the owner commit point; transport nonce is never coupled to or rolled back with that transaction. A business attempt must start before admission expiry and terminate within the bounded owner-transaction deadline.

Expiry blocks an uncommitted old admission from starting more work but never blocks lookup of an already committed Execution. `ScenarioExecutionStatusLookupV1` uses the dedicated `my-chat-execution-recovery` caller, `my-chat.recovery` issuer, `nurture.execution-recovery.v1` audience, fixed private endpoint/operation, independent credential/signing/verifier registry, and a fresh single-use nonce. It is outside ordinary human-principal ingress and may bypass the active-row prerequisite only for this lookup. The request binds frozen original Workspace/admission/request/command/principal provenance and optional Run/Step/driver. Caller/credential/signature/nonce/codec/frozen-binding failure returns a generic transport denial with zero status-resolution, writer-fence, or application-service call; Host work remains locally quarantined. Only an authenticated exact-bound request obtains the writer's command fence and may return `committed|confirmed_no_effect|unknown`. It performs no Participant/policy/business command, Step mint/rebind, audience recompute, candidate/delivery/open, presenter/protected read, or content disclosure. `confirmed_no_effect` requires expiry plus skew/transaction deadline, terminal issued attempts, the fence, and absent exact Execution; for a valid request, outage/lock timeout/possible in-flight work or compatible-evidence ambiguity remains protocol `unknown`. A new business attempt after expiry requires confirmed no-effect, the full current gate, and a new admission. Committed response-loss recovery uses the original hash only as provenance whether active, disabled, or expired and never reruns business. Direct result display additionally requires a current My-Chat session/membership/Workspace and original request-owner check or degrades to `processed_but_unavailable`; claimed recovery remains on the original Run actor/Step. Disablement that commits before Host admission prevents the owner call/fact. A transport attempt already in flight from an earlier admission may fail closed or commit once; after disablement no fresh attempt may create a previously uncommitted effect, and wall-clock row deletion/Nurture commit are not presented as one atomic order.

Normal `complete_step` validates current local technical gate/release/deployment identity plus original claimed Step/draft provenance and atomically materializes without a remote owner call. Step/Handoff freeze the admission hash, admitted release, deployment, activation row/profile, source and compatible recovery-runtime revisions. Unknown admitted outcomes remain quarantined. Confirmed no-effect may re-admit the same original Step/command only while the full gate is active and retry budget remains; a new Step/rebinding is forbidden. Under disablement, committed/no-effect classification permits a short technical recovery claim for that same Step and frozen runtime only; the claim can call local `complete_step|fail_step` but never the scenario command. Confirmed-no-effect claimed work then fails body-free with no Handoff/Outbox and direct work closes unavailable with no Step/Handoff. Committed claimed work alone may retrieve its replay seed and effect-decrease local rows; committed direct-empty work returns only the original body-free result/processed-but-unavailable. Neither lane executes business, recomputes an audience, creates delivery candidates, sends, opens, or exposes content. An incompatible current runtime quarantines the old work rather than reinterpreting its seed. Absence, expiry, duplicate, mismatch, or a store outage required by the current seam denies new work. Technical Operator is disable-only. A separately approved disposable exercise uses a short-lived `evidence_release_controller` through the production activation command, scoped to one component/disposable deployment/synthetic Workspace/environment and destroyed after proof; it grants no Pilot authority. C-3-5 qualification ends with the environment activation bundle false and active Workspace rows empty; Pilot-2's distinct `pilot_release_controller` alone may later enable the environment bundle with an empty list and add the one exact complete-candidate/deployment row last.

C-3-5 evidence has separate Guardian relationship/authority and communication/Caregiver strands. The first covers invitation/relationship/self-exit, Enrollment/hold/transfer-consumer/withdrawal, Grant and Stage behavior across Guardian surfaces. The second renders the exact J1-J4 surface/view paths on three child/family scopes and all four Caregiver Chat/teacher-board acknowledge/reply pairings; post-reply redaction uses `recent`, not `current`. Both use one exact API/worker/web/mobile/Nurture candidate and canonical accounts/sessions. C-4 prerequisite fixtures may create Institution/CareGroup/staff-role plus a correlated pending My-Chat Host invitation shell, pending Nurture EnrollmentInvitation intent, and unlinked RosterEntry, but never accepted membership/Participant/Guardian/Enrollment/Grant/Thread for the qualifying path. The qualifying chain must execute real authenticated Host acceptance, platform/anchor/binding resolution, workspace-local first-Guardian relationship establishment, Enrollment confirmation with roster linkage, and then Grant/Thread creation; no accepted family or Institution relationship is fixture-seeded. A pending transfer proposal is consumer-only fixture evidence. Native-to-web carries only Notification id, derives the target Workspace server-side, requires an explicit same-user switch when different, and then reloads the typed link/Handoff. J1 materializes both G1 and G2 recipient rows from one Handoff, opens G2, and proves a later G1 delivery creates no second business seed/Handoff. Manual evidence masks/excludes protected regions at capture time and scans temporary tool caches. C-4 routes/producers stay absent or contract-negative.

Kill-switch architecture preserves the business/technical boundary. Removing the Workspace row first and environment bundle second blocks every new Host admission, send, open, and destination read. An already admitted cross-database transport attempt may still commit at most once. Before exact status proof, claimed and direct outcomes remain quarantined. Confirmed no-effect closes the claimed Step/direct request without Handoff; committed direct-empty returns the original result only. Committed claimed recovery then applies five cases: explicit-empty `snapshots=[]` completes with no Handoff; a non-empty seed with no Handoff/plan creates one body-free stopped Handoff while completing the Step with zero Outbox/candidate/audience call; an existing Handoff with no plan stops directly; a zero-materialized plan marks pending candidates skipped and stops; a partially materialized plan skips the remainder and completes under C-3-4 settlement. Delivery/open remain disabled in every state. Nurture facts are never compensated or rewritten, terminal skipped candidates never backfill, and a later re-enable requires a new Go/No-Go. C-3 can only exit as `C3_QUALIFIED_DEFAULT_OFF / C4_PENDING / EXTERNAL_TRAFFIC_NO_GO`; C-4 plus Pilot-0-D approved topology evidence create a new complete Pilot candidate, while Pilot-0-E only emits a separate signed decision that references it.

For Chat-entitled roles, My-Chat may process a turn to decide whether to invoke Nurture and may reuse an explicit scenario entry, conversation binding, or Nurture-issued token. That host route decision selects only the scenario. Nurture still resolves participant role, surface entitlement, work scope, target, policy, and whether the business effect is internal, `family_to_org`, or `org_to_family`.

The system invocation direction (`My-Chat -> Nurture -> My-Chat response`) is independent from the Nurture business distribution direction. A caregiver message entering from Chat is not a direct role-to-role reply path; it remains a Nurture scenario invocation that must resolve a current workflow item and commit a caregiver-confirmed action. Institution actions enter through the institution board/workbench rather than Nurture Chat.

`NurtureInteractionContext` may store short-lived pending intent, candidates, clarification state, and draft/action refs. It is consumed inside Nurture and is not a host authorization result.

IIA-0-R2 locks the resolver context shape into three layers:

- `actor`: the resolved Nurture participant and role assignment candidate/selection.
- `workScope`: the current work surface scope, such as `child_process`, `family`, `care_group`, or `institution`.
- `target`: an optional concrete object such as a thread, item, log, media asset, grant, enrollment, or child care process.

`childCareProcessId` is mandatory before child-specific command execution, but it is not mandatory for every collection work surface. Teacher board and class inbox can resolve to `care_group` first; institution views can resolve to `institution` or `care_group` first. Downstream queries still must constrain child rows through active enrollment, role scope, and policy.

IIA-0-R3 locks the resolver input envelope. My-Chat can provide authenticated user identity, surface, conversation refs, current payload, generic display state, idempotency, and Nurture-issued opaque scenario tokens. My-Chat must not author Nurture business refs such as `targetRef`, `workScopeHint`, `selectedRoleAssignmentId`, `childCareProcessId`, `careGroupId`, `institutionId`, `grantId`, `dataClass`, or policy decisions.

When a rendered Nurture surface needs to resume a target, scope, pending action, draft, or notification, Nurture must issue an opaque `scenarioToken`. My-Chat may hold and return the token only in the bounded surface/client continuation channel without interpreting the value; the notification path never durably stores raw token material. Token resolution still re-checks participant, role, scope, grant/runtime fence, policy, and object lifecycle.

IIA-0-R4 and R5 lock ambiguity handling. Resolver may auto-resolve only when one candidate is unique, current, reachable, and safe. Multiple safe role/work-scope/target/intent/memory candidates return `needs_clarification`; forbidden, revoked, redacted, stale-unsafe, or scope-invalid cases return `blocked`.

`needs_clarification` is delivered to My-Chat as a structured interaction request. Nurture owns the prompt, options, fields, validation rules, `scenarioToken`, and opaque option tokens. My-Chat renders generic primitives such as single choice, multi choice, confirm/cancel, form, text input, date/time, or attachment picker, then returns the selected tokens or form values.

IIA-0-R6 keeps scenario tokens deliberately small for MVP. A `scenarioToken` is an opaque Nurture DB handle, not a signed business payload or authorization credential. MVP supports only `clarify`, `submit_action`, and `open_notification`; each use reloads current Nurture state and re-runs resolver, policy, grant/runtime fence, lifecycle, and command preconditions. Full version vectors, draft recovery, broad continuation tokens, and signed payload tokens are post-MVP.

The token flow is reusable only at the protocol boundary. My-Workflow-Base may define the opaque continuation field, generic structured-interaction envelope, binding/TTL/replay/revalidation invariants, and conformance tests, but owns no token database or business payload. My-Chat only renders generic interaction primitives and returns the opaque token; it does not interpret token purpose, candidates, targets, or policy. Nurture owns `NurtureInteractionContext` persistence, purpose-specific payload and TTL, participant/scope/target binding, recovery classification, policy checks, command binding, and safe presenter output. A shared storage/runtime helper is deferred until a second scenario such as Education or ERP proves the same mechanics; scenario-local tables and payloads remain authoritative even after extraction.

The Nurture MVP uses one `NurtureInteractionContext` row per issued token rather than a separate token table. It stores only a high-entropy token hash, participant/purpose/surface bindings, optional hashed conversation binding, versioned purpose payload, `active|consumed|revoked`, expiry timestamps, and optimistic version. Expiry is derived from `expiresAt`; `current|expired|recoverable|blocked` are resolver outcomes, not persisted lifecycle states. A multi-turn `submit_action` derives its stable B2 command identity from the internal context id, while direct single-turn commands continue to use the invocation identity.

IIA-0-R7 implements business-context recovery as a thin reusable scenario-resolver kernel plus Nurture-owned adapters. The host-neutral kernel only merges/deduplicates candidates, applies categorical deterministic ordering, and chooses `resolved`, `needs_clarification`, or `blocked`. Nurture adapters query canonical facts and own actor/scope/grant/lifecycle/policy filtering, intent compatibility, and safe presentation. My-Chat never interprets candidate refs.

The first Nurture adapters are nonterminal family-care items, current teacher-attention items, and active family-care threads. Messages are retrieval evidence by default; attention items with actionable backing sources deduplicate to the backing target. Daily-care and media-attribution adapters arrive with their capability increments.

R7 deliberately adds no memory table, vector/embedding pipeline, generic rules platform, Redis dependency, candidate persistence, or retrieval-only model call. The generic contract is designed for reuse, but stays local to Nurture until another scenario proves the same contract and justifies extraction into My-Workflow-Base or a shared scenario SDK.

### 1.2 Model execution and cost posture

My-Chat owns generic conversation continuity, message ordering, surface metadata, and host transport refs. Nurture owns purpose-specific context assembly, child-scoped canonical facts, scenario-relevant memory/summary artifacts, pending interaction state, and model execution decisions. My-Workflow-Base defines only integration contracts and must not become a conversation-memory or scenario-context store.

The MVP prioritizes usability and reliability and therefore has no fixed model-call, token, or monetary quota that can reject normal work or lower correctness. Cost remains an explicit architecture dimension: model invocations must be traceable; context packs and derived memory must be scope/version aware; completed semantic work must be reusable across infrastructure retry and command replay; and delivery fan-out must not multiply model calls unless each target actually requires a distinct semantic artifact.

Reliability circuit breakers such as deadlines, cancellation, overload protection, and loop prevention remain required even without a cost budget. Authorization, resolver decisions, command preconditions, handoff, and receipt transitions remain deterministic and cannot be delegated to cached or generated context. The architecture preserves replaceable model routing, context compression, cache, and reuse policies without introducing a generic model/cache/vector/memory platform into IIA before usage evidence justifies it.

### 1.3 Command write boundary

IIA-0-R8 is locked. It separates Nurture internal facts, cross-role distribution, and composite workflow actions; resolver/policy may prepare an action, but only submit-time preconditions inside the Nurture transaction may authorize the mutation against current actor/scope/grant/target/version state.

R8 closed three former implementation blockers: a durable optional Nurture-to-My-Chat host activation handoff, durable idempotency/concurrency for all command classes, and durable family-input routing/clarification state. My-Chat notification/outbox remains post-commit and idempotent; it must not become the source of truth for Nurture command/message state.

R8-B1-A locks two correlated but non-mirrored authorities. `NurtureChildLinkReceipt` is the Nurture-owned logical distribution lifecycle and is committed with the source business fact/message/visibility. When the target Nurture surface is readable at commit, the receipt may be `delivered` immediately; `pending` is reserved for unfinished Nurture-owned release work and never mirrors host transport. Receipts are scoped to logical targets such as one family or care group, not accounts, devices, or channels. MVP does not add a separate Nurture distribution-intent table or Nurture-owned generic outbox/worker.

R8-B1-B locks the interaction boundary. Main chat is a role-agnostic My-Chat scenario invocation and returns a structured Nurture scenario response. Scenario dashboards/boards are explicitly bound to Nurture and read presenter output through generic host rendering. Neither requires a handoff. My-Chat Handoff Ledger/outbox is reserved for optional host activation capabilities such as notification, unread/badge, notification center, and deep link; activation failure cannot downgrade Nurture content visibility or receipt state.

R8-B1-C1 locks activation source authority. Existing Nurture canonical objects such as family-care messages/items and child-link receipts are referenced through Nurture `DomainContextRef` values; they are not duplicated into host Workflow Artifacts solely to satisfy handoff typing. Workflow Artifacts are used only when the artifact itself is a durable workflow product with independent preview/approval/exposure/publication lifecycle. A handoff may combine a real artifact ref with Nurture context refs. My-Chat stores opaque refs and rereads the canonical owner before activation.

R8-B1-C2 makes the replay mechanism reusable across scenarios. Nurture persists immutable `ScenarioHandoffRequestSnapshot` values in a required versioned JSON array on the same Nurture-database `NurtureCommandExecution` row as the command result; an explicit `[]` means no host activation was requested. The shared base defines the snapshot/draft contract but owns no central snapshot table. A stable manifest `handoffKey` plus the workflow run's pinned `contractHash` lets My-Chat derive handoff type, downstream owner, policy, allowed source types, and receipt requirements without copying host routing configuration into Nurture. Infrastructure retry reuses the same request ID; an explicit user resend is a new scenario command/request ID. The pipeline may route to host capabilities or another registered scenario, but remains refs-only and does not become a generic business Saga platform.

An immutable replay seed is durable but cannot wake My-Chat by itself. Therefore any command whose snapshot array is non-empty MUST be invoked only after My-Chat durably creates and claims the driving Workflow Step. The authenticated Workflow Runtime supplies the opaque Step ref, pinned contract/capability/entrypoint binding, current claim token, and expected Step version. Nurture persists only `handoffDriverRef` with the Execution as non-authorizing provenance; claim token/version are transient, excluded from command hash, and never persisted or logged by Nurture. Missing/invalid driver fails before the Nurture transaction and consumes no command identity; a direct no-Run fast path is valid only when the committed snapshot array is exactly `[]`.

The persisted Step ref is the exclusive recovery owner. A later retry may reclaim the same Step with a new claim token/version, but a different Step cannot read or materialize that Execution's non-empty snapshots. Admin reconciliation operates the original Step; MVP has no replacement/transfer protocol. Once a Handoff exists, technical replay operates the My-Chat Handoff Ledger instead; a new business resend creates a new command, Step, and snapshot identity. Nurture does not synchronously call back into My-Chat to owner-read the Step and does not interpret host lease/retry state. My-Chat validates claim/lease/version during atomic `complete_step`, preserving the boundary without a cyclic service call, polling scanner, Nurture transport outbox, Redis recovery state, or signed-driver-token platform.

X4-A implements this boundary inside the shared Nurture command kernel without advertising it through the scenario manifest. The transient shared driver ref is owner-shaped (`host.workflow/workflow_step`) and may omit a consumer; Nurture canonicalizes the persisted provenance to an exact five-field object with `consumer_scenario_key=nurture`, while dropping claim token and Step version. Stored snapshots are parsed as bounded refs-only contract values and replay additionally verifies request id, handoff key, purpose, expiry, and the exact original Step. The first allowed policy is `familyInputRouteSpec` in `immediate` mode and emits one `user_attention` snapshot over message, receipt, and item refs. Direct calls without activation continue to commit `[]`; pending-workflow routing cannot request this handoff.

This is a persistence foundation, not activation. No X4-A change adds `handoff_key` or source declarations to the manifest, passes driver context from a live workflow handler, creates a My-Chat Handoff, sends an event, or enables `workflow_handoff_materialization_v1`. Those remain ordered X4-B/X4-C work after the database-backed foundation passes.

X4-B/X4-C1 add the bridge without moving authority across repositories. My-Chat owns the concrete bridge implementation and injects only a two-operation port: claimed-Step input becomes a transient `ScenarioCommandDriverContext`, and returned scenario snapshots become whitelisted `WorkflowHandoffDraft` values. Nurture does not take a production dependency on My-Chat runtime code. A separate scenario-owned source port resolves the stable invocation, command, and handoff request identities plus the current family-input payload; those identities are independent of claim token, Step version, and reclaim attempt. The handler derives child scope from the Nurture payload and lets the command kernel re-resolve policy/current state, so the source port is not a second scope or authorization authority.

The handler emits no `workflow.step.*` or `workflow.handoff.*` scenario event draft because those are host-ledger products. Its Step output contains only an opaque CommandExecution evidence ref; message, receipt, and item refs remain in the handoff's owner-readable `source_context_refs` and are not encoded a second time into host Step output. The handler is present in the TypeScript registry for conformance testing but absent from `scenario.manifest.yaml`, and the default backend composition intentionally omits the business-source port. Therefore X4-C1 is fail-closed and unreachable from advertised runtime surfaces; manifest declarations, the real source adapter, owner-reread consumer wiring, and development capability enablement remain a separately reviewed X4-C2 activation change.

R8-B1-C3 locks the My-Chat atomic boundary. `complete_step` performs exact completion replay lookup, validates the current claim/lease/version for first-time completion, materializes context/artifact/handoff drafts, writes Handoff Ledger + standard handoff/step outbox events, persists canonical handoff refs and the `draft_key -> handoff_ref` mapping, and completes the step in one host Postgres transaction. Mixed existing/new drafts are supported; same-key/different-hash conflict rolls back the current transaction. Remote Nurture/policy/provider/queue calls are forbidden inside the transaction. Standard `workflow.step.*` and `workflow.handoff.*` events are host-ledger products, not scenario event drafts.

R8-B1-D1 deliberately keeps the generic Handoff lifecycle small: `requested`, `completed`, `stopped`, and `failed`. Automatic waiting/retry remains `requested` and lives in attempt/outbox state; cancellation/expiry/policy/source/target terminal stops use `stopped` plus a reason code; exhausted technical recovery uses `failed`. `created/existing` is materialization disposition, downstream acceptance is an optional receipt/event, and contract/hash defects remain Workflow Step manual-review failures rather than Handoff states.

R8-B1-D2-D4 separate recovery and operations without expanding the lifecycle. Step reconciliation replays the original scenario command result after a possible Nurture commit; Handoff technical replay reuses a replayable failed Handoff; a user resend is a new scenario command/request. Cancellation after Nurture commit preserves the business result and stops only pending activation where the manifest allows; in-flight cancellation is best effort and resolves to completed or stopped. My-Chat owns outbox/downstream dead-letter and Admin reconciliation, while Nurture exposes idempotent command/source reads and owns no transport polling or DLQ. Admin never edits business refs/policy/expiry or bypasses current gates.

R8-B2-A1 scopes the command kernel across all Nurture authoritative writes. Long-term family strategy/value cultivation, short-term care plans/trials/reviews, and institution ecology share one `NurtureCommandExecution` mechanism whenever retry could duplicate or inconsistently advance Nurture canonical data. The kernel is scope-neutral: family/project commands need not have institution or child scope, while child-specific commands still require `childCareProcessId` under their command contract. Host-only workflow/artifact/handoff writes remain under My-Chat idempotency. IIA implements the shared kernel through institution commands and at least one existing family-core command, then migrates the remaining write paths incrementally before GA.

R8-B2-A2 defines a visible `NurtureCommandExecution` as an immutable committed command result, never an attempt log. It stores only `applied` or command-specific `already_satisfied`; invalid/blocked/conflict/error attempts roll back and use separate evidence where needed. API responses independently report `executed` or `replayed`, replacing the earlier combined `already_applied` concept. Exact replay prevents a second write but user-facing result visibility is still checked against current access; trusted Step reconciliation may retrieve the original refs/snapshots without creating new effects.

R8-B2-B1 keeps My-Chat thin while making command reliability reusable. My-Workflow-Base may define a generic `ScenarioCommandEnvelope/Response` and key/hash conformance contract, but each scenario owns and transactionally persists its local CommandExecution. My-Chat only selects the scenario, carries authenticated identity and opaque stable request ID, retries/correlates, and orchestrates Workflow Steps; it does not canonicalize scenario payloads or decide target/state/convergence. Logical identity is namespaced by scenario + workspace + request ID. No central cross-scenario execution database is allowed.

R8-B2-B2a separates four related identities without forcing two independent ID systems. `invocationRequestId` identifies one stable caller invocation and is supplied by the current entry owner; a My-Chat message/form/action maps its interaction/client idempotency identity into this generic field. `commandRequestId` identifies one independently atomic, replayable scenario state change. In the common one-invocation/one-command case it reuses the invocation value; Nurture derives stable child command IDs only when one invocation is deliberately split into independently committed/retried commands. Multiple rows, recipients, receipts, artifacts, or tasks committed as effects of one transaction remain one command. Long-lived objects such as a child-care process, assignment, payment document, or work item remain domain process/aggregate refs, while effect keys deduplicate child rows/tasks; neither is a command ID. Prepare/clarification may carry one command identity across invocations until the first commit, but every later approval, correction, resend, or new transition is a new command.

R8-B2-B2b stores no raw invocation/command key in Nurture executions. A bounded opaque ASCII key is normalized and hashed with a versioned Nurture + workspace namespace using SHA-256; local uniqueness is `(workspaceId, commandRequestIdHash)` and deliberately excludes command/target/process so accidental cross-command key reuse conflicts. A separate versioned canonical payload hash covers effect-bearing command contract, actor/effective scope, target/expected versions, normalized business payload, immutable content/attachment refs, requested distribution/activation intent, and business-effective time. It excludes identity keys, conversation/trace/retry/surface data, generated IDs/timestamps, model telemetry, and current dynamic authorization/object state. Same key + same hash replays; same key + different hash conflicts; a new key remains a new command even when payload matches. Old canonicalizers remain available for the supported replay-retention window.

R8-B2-C closes the MVP execution algorithm without adding a command-processing platform. Nurture uses one immutable `NurtureCommandExecution` table and one thin runner. After authentication/schema validation/canonicalization, an existing execution is replayed on the fast path; a missing execution enters a short Postgres transaction, attempts a transaction-scoped advisory lock for the command identity, rechecks Execution, validates current actor/scope/grant/target state, applies command-specific optimistic version/state predicates, commits bounded business effects, refs-only output, and the versioned refs-only handoff snapshot JSON with the final Execution, then performs remote delivery after commit. `command_busy` is an internal retryable technical result using the same identity, not a persisted lifecycle state. The command lock prevents duplicate execution of one identity; aggregate expected-version/state predicates prevent different commands from overwriting each other. Execution stores no business body, full response, provider/model output, or mutable host state, is not deleted in IIA, and replays through current visibility/presenter rules. HMAC, partition/archive jobs, multi-database adapters, generic reservation/attempt tables, processing states, Redis locks, and an automatic transaction-retry engine are explicitly deferred.

R8-B3-A reuses existing business authorities rather than adding parallel Routing or Clarification aggregates. `NurtureFamilyCareMessage` owns family-authored content, `NurtureChildLinkReceipt(direction=family_to_org)` owns whether that source has entered an authorized institution workflow, `NurtureFamilyCareItem` owns teacher work state, and append-only item events own long-running clarification correlation. A pending receipt may temporarily lack grant/data-class/target resolution; it becomes delivered/read/acknowledged only after those fields are complete and current policy passes. Receipt identity uses a stable `routingAttemptKey`, not nullable business fields. Teacher clarification moves the item to `waiting_for_family`, emits a correlated request event and family-facing message/receipt, then a later family response returns the item to `open` with a correlated received event. Resolver ambiguity remains short-lived InteractionContext/token state. No `NurtureFamilyCareRouting` or `NurtureFamilyCareClarification` model is added in IIA.

R8-B3-B forbids orphan pending business state instead of adding a cross-scenario pending-work scanner. A simple resolved route may atomically commit message + item + delivered receipt in one Nurture command without a Run only when it requests no host activation and therefore persists an explicit empty handoff snapshot array. If it requests any durable host activation, My-Chat must first create the driving Workflow Run/Step even though Nurture business routing is otherwise synchronous. An asynchronous route likewise requires host-first Run/Step; only that already-existing Step may drive a Nurture capture command that commits the canonical family message and pending receipt. The host ChatMessage is the durable ingress ref until capture, while the copied Nurture message becomes the child-scoped business authority. Queue payloads remain refs-only. Every pending receipt retains a typed durable driver provenance (`workflow_step`, `item_action`, or `scheduled_step`); host Step owns lease/retry/attempt/DLQ, Receipt owns business status, and B2 replay closes step-completion crash windows. Waiting-for-family resumes through Item/action state and does not occupy a worker. My-Workflow-Base/My-Chat need no `listPendingScenarioWork` polling platform.

R8-B3-C1 keeps lifecycle vocabulary inside its owner. My-Chat owns only Workflow Run/Step and Handoff technical lifecycles; the reusable command contract owns execution/replay disposition and committed business outcome. Nurture alone defines `NurtureChildLinkReceiptStatus`, `NurtureFamilyCareItemStatus`, item-event types, reason codes, and revoke/expiry/cancel/recovery transitions. My-Workflow-Base may require durable continuation, refs-only transport, scenario-owned current-state checks, and idempotent recovery, but it must not define a generic business delivery/waiting/revocation state machine or driver enum. My-Chat cannot branch on Nurture status values; it calls Nurture presenters/actions and renders generic structured output.

R8-B3-C2a-d lock the first Nurture transition groups. Grant revoke immediately fences future access/work: pending receipts block, already-delivered receipts become `revoked_after_delivery`, active dependent items suppress, and source messages remain unredacted. Source redaction instead makes body/attachments and direct derived display unavailable, blocks/revokes receipts, sanitizes/suppresses source-derived items, but does not mechanically delete separately confirmed canonical care facts. Pre-delivery cancel blocks the pending receipt; post-delivery withdrawal closes future item work without rewriting delivery history; correction and resend are append/new-command paths. Clarification token expiry never changes business state. A business clarification deadline ends one correlated wait cycle and normally reopens the item, while the item's own expiry may terminate it; late family responses are still captured and surfaced safely.

R8-B3-C2e keeps host technical exhaustion separate from Nurture business failure. Workflow Step retry/manual-review state never directly mutates a Receipt. Automatic retry leaves a route `pending(workflow_processing)`; after retry exhaustion the host enters manual review while Nurture re-evaluates current grant/source/scope and route state. Current business blockers produce `blocked`, an already-completed route stays delivered, and only an owner-authorized `fail_route` may commit terminal `failed(technical_recovery_exhausted)`. A failed Receipt never reopens. A deliberate recovery creates a new host Run/Step, command identity, routing attempt, and Receipt linked by optional `retryOfReceiptId`; My-Chat Admin can reconcile or invoke Nurture recovery actions but cannot edit business state or bypass current gates.

The intended reusable shape is a thin command runner plus Nurture command specifications, not a generic rules DSL. AI/attachments/remote calls stay outside the DB transaction; class/batch writes preserve child-scope isolation.

### N1 explicit-empty implementation boundary（2026-07-13）

N1 implements institution writes through a scenario-owned `NurtureFamilyCareCommandTransaction` attached to the shared command transaction. The Prisma adapter executes precondition reads, optimistic transitions, business events, bounded projection convergence, and immutable `NurtureCommandExecution` creation inside one serializable transaction. Command actor/workspace/child scope come from the trusted command envelope and must match the scenario payload and current owner facts.

Owner reads use a separate bounded `NurtureFamilyCareQueryRepository`: every inbox/attention read rechecks active participant, role, group/institution, enrollment, the item-linked source grant, source-message lifecycle, and current grant target/direction/data class. A newly created grant cannot reactivate an item bound to a revoked grant. Grant revoke is distinct from source redaction: revoke fences access and suppresses active work without redacting the source message; redaction removes protected content/attachment access and sanitizes derived display fields.

N1-E deliberately does not declare the new institution resolver keys or live workflow handlers in `scenario.manifest.yaml`. Doing so before My-Chat registers the owner resolvers makes legacy module validation fatal and would advertise a surface before its DB-backed owner-read path is accepted. N1-F closes the DB-backed direct surface; non-empty `handoff_key` and context-source declarations remain an X4/N2 change behind `workflow_handoff_materialization_v1`.

### N1-F direct surface boundary（2026-07-14）

N1-F advertises only `class_family_inbox` and `teacher_attention_board`, after their Postgres owner-read journey passed. Each capability handler resolves the current participant and care-group role from `meta.actor_id`, runs the bounded owner query, emits a display-safe summary artifact, and explicitly returns `handoff_drafts=[]`. The paired scenario-internal read handlers return generic safe titles, labels, badges, aggregate versions, and opaque refs; they do not return child-process, thread, grant, protected-content, attachment, or policy-seed fields.

The host cannot author a Nurture care-group id or role assignment. Multiple reachable scopes return Nurture-owned structured clarification; missing/revoked access returns one generic unavailable state. Every read revalidates the current participant, role, group/institution scope, enrollment, exact Thread lifecycle, item-linked grant, source message, and redaction state; optional ThreadParticipant projection never substitutes for those checks. Grant revoke or source redaction therefore removes the old item on the next owner read without requiring My-Chat to interpret a Nurture lifecycle value.

Structured clarification is issued only on the direct scenario response path, whose contract can return the opaque scenario token and interaction request. The durable workflow Step result cannot carry that continuation envelope, so its handler disables token issuance and enters generic manual review on ambiguous scope. It must not persist an unreachable InteractionContext.

The manifest deliberately adds no institution context-ref type, `handoff_key`, context-source declaration, host capability requirement, or non-empty draft. Those remain X4/N2 work after My-Chat X3. The scenario source pin now includes the live TypeScript registry as well as the context contract, YAML manifest, and module so YAML/runtime drift is detectable.

## 2. 业务对象模型

Detailed IB schema contract: see `06-ib-nurture-schema-spec.md`. IB implementation defaults for the schema decisions are in `07-ib-decision-convergence.md`. IIA implementation sequencing for schema, policy, and tests is in `08-iia-schema-policy-test-design.md`. This section remains the architecture-level model and ownership baseline.

### 2.1 Nurture-owned canonical objects

```text
NurtureParticipant
  my_chat_user_id
  display_name
  status

NurtureChild
  local_care_display_label      # Guardian-entered; never platform-synchronized
  birth_info = null             # activated bound rows; derived age/stage only
  profile_basics?

NurtureChildBindingAnchor       # scenario-global, typed, body/PII/authority-free
  opaque_id
  version
  technical_state              # reserved | bound_empty | associated | retired

NurtureFamilyBindingAnchor      # scenario-global, typed, body/PII/authority-free
  opaque_id
  version
  technical_state

NurtureChildAnchorAssociation   # exact workspace-local mapping
  workspace_id
  child_anchor_id
  nurture_child_id

NurtureFamilyAnchorAssociation  # exact child-scoped family mapping
  workspace_id
  family_anchor_id
  child_anchor_id
  nurture_family_id
  child_care_process_id

HostIdentityBindingOperation    # My-Chat-owned body-free orchestration record
  prepared | bindings_committed | local_committed | closed_no_effect
  quarantine_state             # clear | outcome_unknown

NurtureChildCareProcess
  child_id
  status
  current_stage?
  care_context_summary?

NurtureCareRoleAssignment
  participant_id
  role                  # guardian | caregiver | lead_caregiver | institution_admin
  scope_type            # child_process | care_group | institution
  scope_id
  permissions

NurtureFamily
  child_care_process_id
  status

NurtureCareInstitution
  managed_by_participant_refs[]
  name
  profile
  policy_config

NurtureCareGroup
  institution_id
  name
  age_band?
  capacity?
  rhythm_config?

NurtureInstitutionRosterEntry
  institution_id
  care_group_id
  institution_local_display_name
  institution_prefill_with_provenance?
  linked_child_care_process_id?
  status
  # never stores platform Child/Family ids, anchors, bindings, or candidates

NurtureEnrollment
  child_care_process_id
  institution_id
  care_group_id
  status
  joined_at
  left_at?

NurtureChildLinkGrant
  child_care_process_id
  enrollment_id
  granted_by_participant_id
  granted_to_scope       # care_group | institution
  data_classes[]
  directions[]
  status                 # pending | active | revoked
  receipt_refs[]
```

### 2.2 Family-care communication

一个班 10 个小孩时，家长侧仍是每个小孩自己的私密会话时间线；老师侧必须看到一个班级级工作流中枢，而不是 10 个割裂群。家长侧是 conversation-shaped experience，老师侧是 workflow-shaped experience，二者通过 Nurture-mediated message distribution 连接。

```text
NurtureFamilyCareThread
  child_care_process_id
  enrollment_id
  participant_scope
  status

NurtureFamilyCareMessage
  thread_id
  sender_participant_id
  authorship_kind
  source_item_id?
  source_item_event_id?
  source_daily_care_log_id?
  body
  attachments[]
  visibility_scope
  source_surface
  created_at

NurtureFamilyCareItem
  source_message_id
  care_group_id
  child_care_process_id
  category
  summary
  urgency
  requires_ack
  requires_reply
  status                 # open | acknowledged | replied | followed_up | closed
  assigned_caregiver_ref?
  expires_at?
```

`NurtureFamilyCareMessage` 是 Nurture-owned canonical communication record。家庭输入进入 workflow；老师通过事项动作、结果记录或确认答复产生家庭侧消息，而不是直接进入聊天房间发送。`NurtureFamilyCareItem`、item event 和 daily-care log 仍是工作状态 source of truth。My-Chat 可以渲染时间线、发送通知和 deep link，但不拥有原文、处理状态或提取出的工作项。

## 3. `ChildLinkGrant` 重新定义

`ChildLinkGrant` 不再是 My-Chat-owned account-to-account 授权。它是 Nurture-owned consent object，用来控制同一个小孩的养育过程在不同角色工作流之间如何流动。

MVP 语义：

- `org_to_family`：老师/机构把每日照护摘要、观察或已确认媒体视图回流给家长。
- `family_to_org`：家长把当天提醒、照护约束、问题或跟进请求投递到老师班级工作流。
- grant 绑定 `child_care_process_id` 和 `enrollment_id`，并限定 `data_classes`、`directions`、`purpose`、有效期和撤销语义。
- grant 撤销后停止未来投递；已投递记录按保留策略标记来源 grant 已失效。
- grant 撤销也是 workflow runtime fence：in-flight run、pending outbox、scheduled retry、cached context pack、AI summary/model hint、UI draft submit 都必须重新校验当前 grant 状态。撤销不是抹掉历史动作，而是让未来工作流和当前工作面上下文立即退出 revoked-grant 依赖。

默认 MVP 数据类：

| data class | direction | 说明 |
| --- | --- | --- |
| `daily_care_log` | `org_to_family` | 老师每日照护摘要回流。 |
| `care_day_note` | `family_to_org` | 家长当天提醒，例如昨晚没睡好、今天请多喝水、接送变化。 |
| `care_constraint_update` | `family_to_org` | 家长更新稳定或半稳定照护约束，例如过敏、饮食禁忌、安抚偏好。 |
| `family_care_question` | `family_to_org` | 家长围绕当天照护提出问题，进入老师待回复队列。 |
| `family_follow_up_request` | `family_to_org` | 家长希望老师观察或反馈某个事项。 |

## 4. `family_to_org`：班级家庭沟通中枢（长期生态方向；C-3 采用受限子集）

`family_to_org` 的第一版不应被定义成“家长把家庭画像分享给机构”。它应定义为：

> 家长作为某个小孩养育过程的参与者，把需要机构照护者处理的事项投递到老师班级工作流中。

本节早期产品构想中的 `待跟进`、clarification、多轮 follow-up、正文自动分类/摘要/任务化和 AI 答复草稿均不属于 `nurture_guardian_caregiver_pilot_v1`，不得作为 C-3 manifest、action、resolver candidate 或 qualification evidence。C-3 的可执行子集只有：Guardian 在受保护 composer 手工提交；老师侧使用固定通用摘要；同一 Item 仅显式 acknowledge，再由 exact claimant 手工 protected reply；`replied` 为 Pilot 终态；protected AI 保持 OFF。

长期老师端产品形态：

- 家长侧保留单个小孩的私密会话时间线，以一对一/小群式呈现维持连续沟通和信任。
- 老师侧聚合成 `ClassFamilyInbox`：一个班级的家庭沟通事项统一进入班级 inbox。
- inbox 支持 `今日需关注`、`未确认`、`需回复`、`待跟进`、`已处理`。
- 老师点开事项后进入 child-scoped work detail，而不是家庭聊天房间；结构化动作、确认答复和结果记录由 workflow 转换成只面向该小孩家庭的消息，不跨家庭可见。

以下 AI 辅助是未来能力候选，必须使用新的 versioned capability/profile 重新评审，C-3 不实现也不验收：

- 自动分类：`care_day_note`、`care_constraint_update`、`pickup_or_schedule`、`care_question`、`follow_up_request`。
- 自动摘要：为老师看板生成短摘要。
- 任务化：判断是否需要确认、回复、稍后提醒或转交主班。
- 草稿：可生成答复草稿或记录草稿，但只有老师确认后的内容才能以老师身份进入家庭时间线；系统自动状态必须标记为机构/系统输出。

不做：

- 不共享家庭完整 care plan、家庭策略、长期画像或普通聊天历史。
- 不让老师环境式拉取家庭私域资料。
- 不自动代表老师回复家长。
- 不处理诊断、处方、用药剂量、急救替代；相关内容走线下制度或专门合规流程。

## 5. 机构与老师价值模型

机构生态必须先让机构和老师得到直接价值，否则只会变成家庭侧数据采集入口。

| 对象 | 主要价值 | 产品应提供 |
| --- | --- | --- |
| 机构管理者 | 理念传达、资产沉淀与再组织、运营质量管线 | 理念/课程原则到班组执行任务的映射，数字资产库与时间序列追踪，运营工作流、复盘和 AI 精确辅助。 |
| 老师/看护者 | 降低沟通和记录负担，更清楚每个孩子的照护诉求 | 班级 inbox、今日看板、快速记录、交接摘要、家长诉求摘要、照片归属确认。 |
| 小孩 | 在家庭与机构之间获得更一致的照护 | 日常照顾数据、个体约束、观察与计划连续性。 |
| 家长 | 加入同一个小孩的养育过程，并让机构照护者接住关键诉求 | 私密沟通、当天提醒、约束更新、回执、照护摘要回流、授权撤销。 |

机构侧三条收益主线：

1. **理念传达**：机构把教育/照护理念、课程原则、班组目标转成老师可执行的日程、提醒、观察重点和复盘问题。
2. **资产沉淀与再组织**：照片、视频、活动记录、成长观察、家长反馈、老师记录成为可按孩子、班组、主题、时间线、课程目标重新组织的数字资产。
3. **运营质量管线**：照护、教学、观察、沟通、异常处理形成可执行工作流，支持聚焦、提醒、证据记录、复盘和精确 AI 辅助。

## 6. 老师 mobile-first 工作流

老师的一线工作发生在教室、餐区、午睡区、操场和接送场景，最常见交互应是 My-Chat mobile shell 承载的 Nurture 工作流。

老师 mobile 首页优先提供：

1. **班级家庭沟通中枢**：聚合一个班所有小孩的家庭沟通事项，降低 10 个群来回切换的负担。
2. **今日看板**：按班组聚合展示 child-scoped attention items，例如过敏、健康观察、饮食偏好、家长当天提醒、重点情绪/午睡观察；`careGroupId` 是老师视角的组织维度，具体提醒仍落到 `childCareProcessId`。
3. **快速记录**：按孩子或小组快速记录吃饭、午睡、情绪、活动、健康观察，支持批量和稍后补充。
4. **班级群照片归属**：基于点名卡、头像、入园登记照等 reference images 生成候选孩子归属，老师确认后生成孩子相册视图。

My-Chat mobile 负责 shell、导航、通知、deep link 和展示容器；Nurture API 负责读取和写入业务事实。Teacher mobile 是 surface composition，不是 Nurture canonical business capability；`class_family_inbox`、`teacher_attention_board`、`caregiver_daily_care`、`child_media_attribution` 仍作为独立 capability keys 进入 manifest contract。

## 7. 儿童媒体归属：班级资产 + 孩子视图

照片自动归类不是“把照片搬到孩子账号下”，而是：

```text
班级相册 / 机构素材库 = 原始资产，属于 Nurture 机构/班级
孩子相册 = 基于孩子标签、授权、发布状态生成的个人视图
家庭可见相册 = 孩子相册中经老师确认/机构策略/家长授权后的曝光视图
```

识别输入：

- 点名卡照片、孩子头像、入园登记照等机构已有 reference images。
- 老师/家长已确认过的历史孩子照片。
- 班级群、班级相册、活动相册里的新照片。

规则：

1. 自动识别只给候选，不直接对家庭发布。
2. 原图保留在班级/机构资产库；孩子相册是派生视图。
3. 家庭只能看到自己孩子相关且已确认/允许曝光的素材。
4. 退园、撤销授权、误识别纠正必须能停止后续曝光并保留审计记录。
5. 不把班级群照片直接进入 forum/knowledge；对外分享另走脱敏和政策审核。

## 8. 能力与 handoff

首批机构侧能力：

IIA-0-C1 locks the first-slice capability contract. The four capability keys in the following table stay separate. Implementation starts with `class_family_inbox` + `teacher_attention_board`, then adds `caregiver_daily_care`, then `child_media_attribution`.

| capability_key | entrypoint | actor | artifact | 说明 |
| --- | --- | --- | --- | --- |
| `class_family_inbox` | `open_class_family_inbox` | caregiver | `family_care_inbox_summary` | 一个班级的家庭沟通事项聚合、分类、确认、答复、结果记录和跟进；不要求老师维护直接聊天。 |
| `teacher_attention_board` | `open_today_attention_board` | caregiver | `teacher_attention_board_summary` | 今日注意事项：过敏、健康观察、饮食偏好、家长当天诉求、重点提醒。 |
| `caregiver_daily_care` | `record_daily_care_log` | caregiver | `daily_care_log_summary` | 按孩子/组快速记喂养、午睡、情绪、活动、健康观察；可经 grant 回流家庭。 |
| `child_media_attribution` | `classify_child_media_assets` | caregiver | `child_media_attribution_summary` | 对班级群照片生成候选孩子归属，老师确认后进入孩子相册视图。 |
| `cohort_care_plan` | `generate_cohort_care_plan` | institution_admin / lead caregiver | `cohort_care_plan_summary` | 组级照护/活动计划；可后置到第二增量。 |
| `developmental_observation` | `record_developmental_observation` | caregiver | `developmental_observation_summary` | 非诊断里程碑观察；可后置到第二增量。 |

跨 surface delivery：

- `family_care_item` 可触发 My-Chat notification/deep link，但 Nurture 仍是 canonical owner。
- `daily_care_log_summary` 可经 `org_to_family` grant 回流给家长。
- `family_care_response` 由老师 workflow action 生成 Nurture canonical message，再由 My-Chat 以 opaque/idempotent delivery 通知目标用户。

## 9. Policies

- `nurture.can_view_child_care_process`：参与者必须有该 `child_care_process` 的有效角色。
- `nurture.can_write_family_care_message`：发送者必须是该 thread 的 guardian/caregiver/institution role。
- `nurture.can_receive_family_context`：`ChildLinkGrant` active，且含 `family_to_org` 与对应 data class。
- `nurture.can_share_to_family`：`ChildLinkGrant` active，且含 `org_to_family` 与对应 data class。
- `nurture.caregiver_scope`：看护者动作必须落在其被分配的 `CareGroup` 或 `Enrollment` 范围内。

## 10. 安全 / 曝光 / 反指标

- **医疗安全红线不变**：看护者可记运营性照护，不得输出诊断、处方、急救替代。
- **曝光默认私有**：家园沟通、看护者观察、儿童照片默认只在授权角色内可见。
- **跨角色流动显式授权**：family_to_org 和 org_to_family 都必须有 Nurture-owned grant/policy/receipt。
- **不做环境式互读**：老师不能随意读取家庭画像，家长不能看见机构里别的孩子。
- **反指标**：禁止机构排名、跨组儿童排名、对外竞争性看护者绩效评分；只做运营质量和流程复盘。

## 11. 分阶段与依赖

| 阶段 | 仓 | 产出 | 门禁/依赖 |
| --- | --- | --- | --- |
| IA 设计 & 登记 | The-Nurture | 本设计包 + M-002/F-002/T-002 登记 | 现在可做；不破坏 conformance。 |
| IA.1 边界重对齐 | The-Nurture | My-Chat account/shell 与 Nurture care ecology graph 边界；family_to_org 班级 inbox 设计 | 当前对齐并同步文档。 |
| IB Nurture care ecology canonical | The-Nurture | Nurture-owned participant/role/child care process/family/institution/group/enrollment/grant/thread/message/item schema SPEC | 不改 live manifest；先做 schema/contract 设计。 |
| IIA 场景契约 + 数据 + 逻辑 | The-Nurture | manifest 接线 + Nurture 数据模型 + 首批 capability + policies + presenters | 先按 `08-iia-schema-policy-test-design.md` 做 contract preflight；依赖 IB schema 和 My-Chat user/shell integration contract。 |
| IIB 操作台 + 同意 UX | The-Nurture | 机构/老师 mobile 工作台 + 家长同意/撤销/沟通 UX | 依赖 IIA。 |
| III 生态飞轮 | 双仓 | 机构运营价值 → 家长参与 → 家庭生态激活 + 归因 | 端到端演示；无排名无交易。 |

## 12. 风险

| 风险 | 影响 | 缓解 |
| --- | --- | --- |
| My-Chat account 与 Nurture participant 混淆 | 高 | My-Chat 只解释登录；Nurture 解释角色、关系和权限。 |
| 十个私密线程压垮老师 | 高 | 老师侧只看班级 inbox、今日看板和 child-scoped work detail；家庭时间线由 Nurture 从 workflow actions 分发，老师不进入 direct family chat。 |
| 家庭私域被老师环境式读取 | 高 | family_to_org 只投递明确 data class，不开放家庭画像检索。 |
| 儿童数据曝光半径过大 | 高 | 授权按 child process / enrollment / care group；所有跨角色流动留 receipt。 |
| 价值观漂移到排名/市场 | 中 | 硬反指标；运营质量复盘不等于公开排名或绩效竞争。 |
| 同意撤销与保留语义不清 | 中 | 上线前定 revoke 语义和保留窗口；fail-closed。 |

## 13. X4/N2 Development Activation Boundary

The canonical Nurture manifest now declares one activation-only entrypoint,
`class_family_inbox/capture_family_input`, and one `user_attention` Handoff.
The source contract is exact: one `family_care_message`, one
`child_link_receipt`, and one `family_care_item`, with no Workflow Artifact or
business body in the draft.

Activation is not the default module behavior. `nurturePreActivationScenarioModule`,
the compatibility `nurtureScenarioModule`, `createNurtureScenarioModule`, and
the local dev host all use the derived pre-activation manifest. Only
`createNurtureActivationScenarioModule` advertises vNext, and its type requires
the My-Chat materializing runtime, claimed-Step bridge, and Nurture production
family-input source.

The source adapter accepts one opaque claimed-Step requirement from My-Chat,
parses an exact version-1 schema, resolves the durable Run Actor through current
My-Chat membership, maps the resulting user to exactly one active Nurture
participant, and then invokes the existing Nurture command runner. The command
runner remains the authority for role, child scope, care group, enrollment,
grant, target, versions, and business effects.

The post-commit owner endpoint is service-authenticated and refs-only. It selects
no message body, attachment, child display name, or item detail. Every delivery
and deep-link open rereads message/receipt/item links plus current grant,
enrollment, thread, care group, institution, and recipient role assignments.
Unauthorized actors are rejected before redaction/revoke classification to
avoid lifecycle reason disclosure.

My-Chat owns Step/Handoff/Outbox/notification/delivery and mobile routing;
Nurture owns every business fact and policy result. There is no distributed
transaction. Response loss is recovered by the original Step's B2 replay seed;
same-Step reclaim may rotate claim evidence, while another Step cannot acquire
the seed. X5 remains responsible for the full combined failure matrix and pilot
decision.

Pilot-0 does not alter this runtime boundary. The cross-repository readiness
audit and detailed ledger live in `09-pilot-readiness.md`; the locked isolated
topology, dual technical gates, operations, observation and rollback source is
`11-pilot0-d-topology-operations-contract.md`. Those decisions are not an
implementation/activation authorization; the current dev host remains
pre-activation and is not a deployable pilot service.

## 14. Pilot-0-C4 Institution IIB extension boundary

C-4-0 makes Institution IIB an additive extension over an immutable C-3
component. The exact business actor is a current My-Chat member mapped to one
active Nurture Participant and one current `institution_admin` RoleAssignment
with `scopeType=institution` for the exact active Institution. Workspace admin,
Caregiver, Lead designation, Technical Admin, service identity, raw ids, and
client role/scope claims are not substitutes.

`institution_board` is a current, read-only generic role-board surface.
`institution_workbench` is a current/history generic domain-workbench surface
and the sole Institution write entry. There is no Institution Chat. Existing
class-inbox/teacher-attention internal APIs remain Caregiver compatibility
paths and cannot alias either Institution product surface. Nurture performs
predicate-first Institution-scoped queries and returns only safe aggregate,
topology, roster/Enrollment, Grant-coverage, and body-free operational data;
My-Chat renders without owning those facts.

The C-3 fragment, artifact, source hashes, migration ledger, candidate, and
qualification chain remain immutable. A separately versioned
`nurture.institution.iib.v1` fragment composes through the neutral Base-owned
`scenario_extension_composition_source_v1` seam. Collision, duplicate key,
partial fragment, dependency/hash/order drift, handler mismatch, legacy alias,
or C-3 operation redeclaration is fatal. C-4 migrations append after the exact
C-3 ledger and packaging consumes the pinned content-addressed C-3 component,
not an unpinned rebuild from a later working tree.

The authority graph is forward-only:

```text
C3 component candidate
  -> C4 Institution extension candidate
  -> C4 composite candidate
  -> Pilot-0-D complete Pilot candidate
  -> Pilot-0-E signed decision
  -> Pilot-1 deployment binding
  -> Pilot-2 activation row
```

C-4 pre-E evidence uses `candidate_kind=c4_composite_v1` and exact activation
profile `nurture_institution_composite_evidence_v1`. Only
`c4_evidence_release_controller` signs `c4_evidence_run_authorization_v1` with
issuer `my-chat.c4-evidence-release`, audience
`my-chat.c4-evidence-activation.v1`, and an isolated trust/store/resolver. JI1
also requires single-business-effect `c4_bootstrap_evidence_authorization_v1`, signed only by
`c4_bootstrap_evidence_controller` for issuer
`my-chat.c4-bootstrap-evidence` and audience
`my-chat.c4-bootstrap-evidence.v1`, bound to the exact disposable composite,
environment/deployment, synthetic Workspace, authenticated initial Admin,
canonical C0 spec/payload hashes, production handler revision, expiry, and only
`bootstrap_exact_synthetic_institution`. The controller alone owns the disposable
synthetic spec; the D-owned real Pilot spec has a different target, store,
issuer, audience, and credential and cannot substitute. My-Chat atomically
claims—not consumes—the authorization into one deterministic, body-free
`C4BootstrapEvidenceOperationV1`, which freezes accepted-invitation/membership,
spec, handler, request/command, principal, payload, attempt budget, and bounded
owner-deadline bindings. Status is `claimed|committed|closed_no_effect`; separate
versioned `quarantineState=clear|outcome_unknown`,
`quarantineReason=status_unavailable|lock_timeout|possible_inflight|evidence_ambiguous`,
quarantine version, and quarantine time record ambiguity without inventing a
terminal result. The exact
operation calls the C0 idempotent `CommandExecution` only with a fresh signed
`C4BootstrapEvidenceClaimV1`: caller `my-chat-c4-bootstrap-evidence`, issuer
`my-chat.c4-bootstrap-evidence`, audience
`nurture.c4-bootstrap-evidence-claim.v1`, exact stored-operation and frozen
binding hashes, isolated route/verifier, and fresh nonce. My-Chat rereads current
claimed authorization, exact invitation identity, Admin session/principal
reauthentication, and Workspace membership/version before signing and again
before dispatch; drift permits recovery only. A dedicated
`C4BootstrapExecutionStatusLookupV1` lane with caller
`my-chat-c4-bootstrap-recovery`, issuer `my-chat.c4-bootstrap-recovery`, and
audience `nurture.c4-bootstrap-recovery.v1` returns only
`committed|confirmed_no_effect|unknown`. It acquires the same deterministic
command fence as the C0 writer. Confirmed-no-effect requires every issued attempt
terminal, latest claim expiry plus skew and owner deadline elapsed, the writer
fence, and fence-protected absence of the exact CommandExecution. Lock timeout,
owner/store outage, possible in-flight work, compatible ambiguity, or one absent
read returns unknown; no accepted writer may commit after confirmed-no-effect.
Committed closes the operation, clears quarantine, and consumes authority;
confirmed-no-effect may retry only the same current/budgeted operation or closes
it no-effect; unknown remains claimed/outcome-unknown and blocks new claim,
evidence seal, and destruction until resolved. Expired/revoked claimed work
may retrieve an already committed result but cannot start an effect. It cannot
target Pilot-0-D, Pilot, staging, production, activation, or external traffic.
Current C-3 qualification is an admission predicate, not candidate identity.
C-4 has a separate qualification controller/event chain/resolver. Every evidence
run is disposable-only and ends with both evidence authorities revoked, all
bootstrap operations in `committed|closed_no_effect` with
`quarantineState=clear`, credentials/spec/environment destroyed, resolvers
inactive, environment switches false, and
active Workspace rows empty. Real Pilot provisioning remains D-owned.

Invitation coordination is a separate signed Host lane rather than a domain
action driver or Workflow Handoff identity protocol. First-Institution creation
remains C0-only. C-4 later owns exact topology/staff/invitation, Institution-side
Enrollment, relationship-attention producer, and terminal-claimant closure
decisions while C-3 keeps Guardian/Caregiver family authority and My-Chat keeps
identity/runtime/delivery ownership.

### C-4-1 topology, policy, and staff lifecycle

The Pilot activates only typed Institution display update; CareGroup
create/update/suspend/resume/close; immutable policy revision/group binding;
exact Caregiver assignment; Lead designation; and Caregiver-role revoke.
First-Institution create, Admin-role mutation, generic roles/scopes, arbitrary
JSON/permission override, and system-operator activation remain absent. Group
pause is a reversible current fence with zero cascade. Group close maps to
terminal `archived` and requires zero current Enrollment, roster, invitation,
transfer, staff/Lead, and unresolved work dependencies; it never performs a
hidden bulk closure.

Pilot policy is an immutable `NurtureInstitutionPolicyRevision` plus an exact
`NurtureCareGroupPolicyBinding`. Readiness is derived from active topology,
exactly one eligible operational Caregiver plus exactly one Lead bound to that
same role, compatible policy, and current Host/business gates. Existing free-form policy/rhythm/permission
payloads cannot authorize the C-4 profile.

Staff onboarding uses `scenario_identity_invitation_coordination_v1`:

```text
Host pending_owner_binding shell (contact Host-only)
  -> Nurture StaffInvitationIntent + CommandExecution
  -> same Host shell deliverable + Outbox/provider
  -> exact recipient Host acceptance + membership
  -> signed invitation_continuation
  -> Participant bind/reuse + intent consumed
  -> Admin strong assign exact caregiver role
  -> Admin strong designate exact Lead
```

The sequence is not a Workflow Step/Handoff or a third domain-action driver.
The seven-day intent uses `pending|consumed|cancelled|superseded` plus derived
expiry, exact shell/recipient binding, one effective pending constraint, and
one-way reissue lineage. Response loss reuses the same shell, command, and
intent. Host acceptance cannot grant Nurture authority, and a denied Nurture
continuation does not roll back ordinary Host membership.

The shell fixes `new_workspace_member|existing_current_member`. The existing-
member branch requires current membership reread, exact-recipient
reauthentication, and explicit staff-purpose acknowledgement; `already_member`
alone cannot consume the new intent. A unique Restrict
`sourceStaffInvitationIntentId` on the Caregiver role makes one consumed intent
single-use across role identities and remains occupied after revoke.

Lead is an independent exact-group `lead_caregiver` RoleAssignment whose
`leadForCaregiverRoleAssignmentId` same-table Restrict FK binds a different
current same-Participant/same-Group `caregiver` row, never itself. Lead alone
grants no teacher access. One active Lead is
allowed per group. Revoking the operational role terminalizes the bound Lead in
the same transaction; re-invite creates a new role episode and never transfers
an old Item claim. Pilot assignment locks the target Group, accepted Participant,
and complete Workspace/scenario Pilot role census and requires zero other
eligible human Caregiver across all Participants and Groups; the reusable schema
does not claim a global unique constraint. Elapsed
`endsAt` is terminal for predicates; assign/re-invite atomically persists
terminalization of an elapsed status-active Caregiver and its Lead before
testing uniqueness, so no sweep or stale row can create a false ready state.

### C-4-2 roster and Enrollment Invitation lifecycle

Roster intake and family identity remain separate. An Institution Admin may
create, correct, or close a minimal `NurtureInstitutionRosterEntry` from the
workbench through direct-empty commands. Its canonical
`status=active|linked|closed` plus typed terminal reason,
local unverified label/prefill, exact Institution/Group scope, and versioned
audit confer no child, Family, Guardian, Enrollment, Grant, Thread, teacher, or
protected-data authority. Only the C-3 family Enrollment transaction may move
an active entry to linked and write its canonical ChildCareProcess reference.
Manual unlinked close uses `manual_unlinked_close`; an unlinked automatic
retention close uses `unverified_intake_retention_expired`; Enrollment withdrawal,
service end, and transfer use `enrollment_withdrawn|institution_service_ended|enrollment_transferred`
on the same `closed` status. The older `withdrawn|ended|transferred` Roster
status shorthand is superseded.

Unverified label/age/birth PII expires absolutely at database `createdAt + 30
days`. Manual close erases it in the same transaction; cancel/decline/expiry
without an effective successor schedules purge at the earlier of that absolute
boundary or seven days after the terminal intent. Invitation reissue cannot
extend the absolute boundary. The retention worker locks the entry/lineage,
closes an unchanged unlinked entry with the typed retention reason, erases those
fields, and retains only a body-free audit shell. Family confirmation clears all
Institution age/birth prefill and replaces the label with a Guardian-confirmed
safe label; that label de-identifies after the fixed 365-day Pilot relationship
history window. The erasure ledger runs before restored backups serve, backups
age out within 30 days, and no presenter/cache/export may revive erased fields.

Enrollment Invitation reuses `scenario_identity_invitation_coordination_v1`:

```text
Host pending_owner_binding shell (raw contact Host-only)
  -> Nurture EnrollmentInvitationIntent + CommandExecution
  -> same Host shell deliverable + Outbox/provider
  -> exact recipient Host acceptance + membership
  -> signed invitation_continuation
  -> C-3 workspace-local first-Guardian relationship or existing-local selection
  -> C-3 exact family confirmation
  -> atomic intent consume + Enrollment create + Roster link
  -> later independent family Grant confirmation
```

Institution operations are `initiate_enrollment`,
`cancel_enrollment_invitation`, and `reissue_enrollment_invitation`; recipient
decline remains C-3. These are identity-invitation coordination operations, not
ordinary direct/claimed actions, a Workflow Step/Handoff protocol, or provider
authority. The seven-day intent uses `pending|consumed|cancelled|superseded`,
derived expiry, exact recipient/shell/Roster binding, one effective pending,
one-way reissue lineage, exact replay, and first-commit-wins lifecycle races.

Host acceptance never creates Participant/Guardian business authority or
consumes Enrollment intent. Workspace-local Family/first-Guardian establishment is an
independent durable family fact and survives later decline. Enrollment
confirmation alone consumes the intent and links the Roster, but creates no
Grant/Thread. Terminal same-Institution re-entry binds the exact terminal
predecessor leaf and uses fresh Roster/Invitation/Enrollment/Grant/Thread
identities; ordinary first or different-Institution entry has no predecessor.

### C-4-3 Institution Enrollment and relationship attention

Institution Enrollment operations reuse C-2f without another lifecycle. Exact
workbench Admins may place/release only the institution-side Hold, propose or
cancel same-Institution CareGroup transfer, end Institution service, or start
fresh re-entry through C-4-2 invitation coordination. Board stays read-only.
Hold/release and transfer cancel are direct-empty; they cannot release the
family Hold, cascade, notify, or override upper gates.

The activated Pilot profile narrows same-Institution transfer to an active
source Group for proposal, Guardian review/open, confirm, and decline. The
earlier reusable C-2f allowance for paused/archived transfer-out is not activated;
pause permits cancel/cleanup only and cannot silently gain a transfer exception.

Transfer proposal and `close_enrollment` are always
`workflow_claimed_step_v1` because the committed fact may produce Guardian
relationship attention. The durable original Step exists and is claimed before
Nurture's first write. Nurture atomically commits business effect, Execution,
and an immutable replay seed containing one cohort-level draft whose owner-owned
audience set freezes every current exact Guardian RoleAssignment; zero recipients
stores `[]`. My-Chat materializes at most one Handoff and fans it out into
stable per-recipient Notification candidates under that Handoff. Same-Step
reclaim may materialize once, wrong-Step replay fails, and late Guardians are
never backfilled.

The additive `guardian_relationship_attention` remains distinct from
`user_attention`. Transfer proposal uses `review_enrollment_transfer` and
opens `family_workbench/current` after current Intent/Enrollment/Guardian
reread. Institution service end uses `enrollment_relationship_changed` and
opens `family_workbench/history` after exact current recipient-role and retained
terminal Enrollment reread; active Enrollment or Grant is not required.
Generic Notification copy contains no relationship detail. Provider/open state
is not business authority, and delivery failure never compensates Nurture.

Service close maps only to `ended + institution_service_ended` and applies the
complete C-2f Enrollment-rooted zero-survivor cascade for active or paused
Enrollment without Guardian countersignature. Transfer confirmation remains a
C-3 Guardian action, performs the atomic old/new cutover, and emits no second
Handoff. Fresh re-entry remains a new invitation and new relationship episode,
never an action derived from a notification or historical route.

### C-4-4 staffing-blocked closure and family continuity

Terminal loss of the exact Caregiver claimant derives a staffing-blocked case
only when one Item remains acknowledged/unreplied with matching typed claimant
Participant/RoleAssignment/assignment and active Attention. The case is a
predicate over canonical C-3 facts, not a new aggregate or reassignable queue.
Database-time elapsed `endsAt` is authoritative terminal without an async sweep;
same-row nonterminal suspension is not. Temporary Host/owner outage, Enrollment
Hold, Group pause, or technical disable alone does not derive closure. Once the
terminal-claimant graph exists, Group pause and Holds do not erase it; active
Institution, current Admin, owner/policy availability, and technical gates still
govern presentation/action.

Exact Institution Admin uses one workbench-only strong action,
`close_staffing_blocked_family_care_item`, with an original claimed Step. One
transaction moves the Item to `closed` with typed reason
`claimant_role_ended_unfulfilled`, appends the closed event, resolves Attention,
with the same typed resolution reason and exact Execution, persists Execution
and status-attention seed, and leaves source Receipt acknowledged at commit. The
C-4 validator/adapter adds this exact no-reply resolved graph without changing
C-3's replied graph. No reply Message, family Receipt, claim transfer, reassignment,
care fact, Grant mutation, or Thread advance is created. `suppressed` remains a
privacy/authority state and is not an unfulfilled-business synonym.

C-4 adds separate `family_care_status_attention` purpose
`family_care_operational_closure`, source `family_care_item`, destination
`family_board/recent`. Commit captures one cohort-level draft containing every
current exact Guardian role or `[]`; My-Chat materializes at most one Handoff
and derives stable per-recipient candidates under it. Delivery/open is generic,
id-only, owner-reread, seven days or earlier, and never backfilled. The extension composes with C-3's
existing unknown-safe terminal DTO shape through the C-4 adapter without changing C-3
`user_attention`, `guardian_relationship_attention`, candidate, or hashes.
The staffing close itself remains legal under its narrow Group/Hold cleanup
exception, but candidate creation and each send/retry require active Institution
and CareGroup, active nonterminal Enrollment with zero family/institution Hold,
the exact current/effective original Grant, retained/unredacted source, exact
current recipient and Family reach, policy, expiry, Handoff/source binding, and
technical gates. Grant revoke/expiry/replacement/owner-role terminal loss,
Enrollment non-active/terminal/Hold, Institution/Group non-active, redaction,
retention expiry, or gate loss skips without OS push. An already sent generic
push is not recalled, but open separately rechecks the same fences; pause/Hold is
unavailable and later recovery permits only a fresh read inside the original
horizon, while permanent loss returns only a current closed shell, tombstone, or
unavailable state.

Institution board exposes body-free bounded counts only. Workbench exposes
opaque case, local roster/Group labels, fixed state, age bucket, and closure
action without body, Guardian, claimant, raw ref, policy, or runtime data. New
Caregiver roles cannot inherit body/claim/action; at most they may see an
allowed body-free terminal history shell. With active Institution, Group pause
and either/both Holds still permit the effect-decreasing Admin closure without
releasing a Hold, while owner/policy outage or technical gate loss blocks new work and
uses the existing post-commit disabled recovery without changing committed
Nurture facts or backfilling skipped delivery.

### C-4-5 implementation, evidence, and qualification

C-4 implementation requires prior explicit authorization and one current
`C3_QUALIFIED_DEFAULT_OFF` immutable component. Delivery is strictly
`C40 Base contracts -> C41 My-Chat adoption/control stores -> C42 Nurture
domain/migrations -> C43 composite/producers -> C44 joint/rendered evidence ->
C45 qualification`. No node is parallel, skipped, or satisfied by design text.

That C-3 component must include the separately hashed
`platform_child_family_identity_source_v1`. My-Chat owns the minimum protected
Child/Family identity, stewardship/membership, `FamilyChildMembership`, and
scenario-binding lifecycle. Nurture owns typed scenario-global body-free Child
and Family anchors plus exact workspace-local association rows; the binding
`ownerRef` points to an anchor, never a workspace-local Child/Process/Family.
The Child association is active-unique in both directions per workspace. The
Family association is active-unique by `(workspace, familyAnchor, childAnchor)`,
local Family, and local Process; composite integrity proves same Workspace,
Process-child equality, Family-process equality, and dependency on the same
current Child association. One platform Family may serve multiple children
without granting cross-child access. Product resolution verifies exact Workspace
plus current Host owner evidence, performs one compound association lookup, then
immediately reads the local role/scope and complete Nurture policy before
returning anything. No cross-workspace anchor list/count/existence path exists.

The recoverable order is platform Child+Family+current membership -> binding-head
resolution -> reuse valid anchors and reserve only missing endpoints -> one
My-Chat transaction for every missing binding -> one Nurture local
Child/Process/child-scoped Family/first-Guardian/association transaction ->
separate Enrollment -> separate Grant. Both-reuse, Family-reuse/new-Child,
Child-reuse/new-Family, and both-new are legal; conflicting existing bindings
quarantine. The durable Host operation tracks terminal business state separately
from `outcome_unknown`, and the Nurture lookup shares the local writer fence.
That recovery lookup is exactly operation
`scenario_identity_operation_status_lookup_v1` at
`POST /private/v1/identity-operations/status:lookup`, with caller
`my-chat-identity-recovery`, issuer `my-chat.identity-recovery`, audience
`nurture.identity-recovery.v1`, an isolated trust domain, and strict
`scenario_identity_operation_status_lookup_request_v1` and
`scenario_identity_operation_status_lookup_result_v1` codecs that
reject unknown, missing, duplicate, null-substituted, or cross-variant fields.
My-Chat validates the raw Child/Family pair, pair membership, and binding heads
internally; only a non-reversible keyed Host-identity evidence digest plus the opaque
Host operation id, Workspace, Nurture-owned typed anchor refs,
association-expectation hash, local command id/hash,
principal/deadline/attempt digests, fresh nonce, time window, key id, and
signature cross the boundary. The strict body-free result union is
`committed(commandExecutionRef, localCommitEvidenceHash)`,
`confirmed_no_effect(noEffectFenceEvidenceHash)`, or
`unknown(allowlisted technical reason)`; raw platform/binding ids and protected
identity/body fields never cross the endpoint. Common result fields also bind
the originating request-nonce hash, response key id, and isolated
Nurture-recovery signature so My-Chat cannot accept a swapped result.
Empty bound anchors are invisible, unique, quota-bounded reusable endpoints;
only never-bound zero-association reservations retire automatically. Association
constraints prove same Workspace, Process-child equality, Family-process
equality, and current Family-to-current Child dependency. Global revoke fences
routing but does not mutate local facts; local exit does not mutate global
binding; merge/split conflicts quarantine without automatic rebind or dossier
merge. Platform identity reuse is allowed, while cross-workspace Nurture dossier
and authority portability remains disabled.

My-Chat revision `db22de66c2e58fec5e24be0150458b36c02e9682` is only an
observed schema target: its migration/runtime/API/cutover and Nurture adoption
are incomplete. It does not replace the workflow pin or satisfy C-3/C-4
adoption. C40 begins only after the completed identity source has been jointly
qualified inside the current C-3 component.

The extension candidate binds only C-4 build inputs. The composite candidate
binds that extension, exact content-addressed C-3 component, deterministic
composition recipe, composed artifacts, and ordered migration/source hashes.
Evidence authorization, evidence results, qualification, D/E, deployment,
activation, and environment values remain outside identity. A change after
freeze creates a new candidate and reruns every affected edge.

Pre-E C-4 evidence uses the exact isolated activation-evidence and
single-business-effect bootstrap-evidence authorities plus durable bootstrap
operation/status recovery above with `candidate_kind=c4_composite_v1` and
profile `nurture_institution_composite_evidence_v1`;
current C-3 qualification is a fail-closed admission predicate. L0–L7 cover integrity, contracts, owner domain/DB,
two-database runtime, authenticated rendering, safe manual evidence, three-run
fault/privacy repetition, and rollback/closure. JI1–JI8 prove topology, staff,
three family enrollments, dual-side Holds, transfer, service-close/re-entry,
terminal-claimant closure, and business-versus-technical disable.

C-4 adoption separately hashes `scenario_extension_composition_source_v1`,
`scenario_identity_invitation_coordination_source_v1`,
`nurture_institution_domain_source_v1`, `nurture_institution_schema_source_v1`,
`nurture_institution_manifest_source_v1`,
`my_chat_institution_surface_source_v1`,
`my_chat_identity_invitation_runtime_source_v1`,
`my_chat_institution_workflow_runtime_source_v1`,
`user_attention_binding_source_v1`,
`guardian_relationship_attention_binding_source_v1`,
`family_care_status_attention_binding_source_v1`,
`c4_evidence_authority_source_v1`, and
`c4_qualification_authority_source_v1`, plus exact nested public C-3 sets.
The nested public sets include `platform_child_family_identity_source_v1`;
`scenario_identity_invitation_coordination_source_v1` and
`my_chat_identity_invitation_runtime_source_v1` additionally bind the
Roster-only-to-parent-bound continuation and its typed binding-resolution recovery, rather
than minting a fourteenth C-4 source id.
The workflow-runtime set owns the exact C-4 evidence-profile registry/content;
the evidence-authority set owns synthetic-spec custody, bootstrap operation and
recovery lane in addition to authorization/controller/resolver/teardown. The
future D complete-Pilot profile is absent from all C-4 source sets.

Only `c4_qualification_controller`, issuer `my-chat.c4-qualification`, signs
`c4_composite_qualification_v1` for audience
`my-chat.c4-qualification-envelope.v1` and
`c4_composite_qualification_event_v1` for audience
`my-chat.c4-qualification-event.v1`. The isolated event chain is partitioned by
`(pilot0_c4_institution_iib_v1,c4_composite_candidate_id)`, has one current head,
and each signed event binds exact schema/id/profile/candidate/envelope/result/
predecessor/digests/reason/database-time/issuer/audience/key fields. Completed
evidence first produces an immutable pre-seal; the controller then appends
deterministic `verifying`, signs the envelope, and
appends `qualified_default_off|rejected`. Resolver acceptance plus current C-3
qualification and final false/empty census is the only successful exit. The
success status is `C4_QUALIFIED_DEFAULT_OFF / PILOT0_D_DESIGN_LOCKED /
COMPLETE_PILOT_CANDIDATE_PENDING / EXTERNAL_TRAFFIC_NO_GO`; D implementation,
candidate assembly, Pilot-0-E, and every deployment/activation stage stay
separate.
