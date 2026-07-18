# Architecture — Institution Ecology（机构生态 · 小孩养育过程）

> 本文记录 T-002 机构生态的当前架构基准。立场基准见 `docs/context/product/workflow-product-design-contract.md`。
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

Pilot-0-B3-1a locks the Guardian action boundary over those three surfaces. Chat remains the generic My-Chat AI panel and renders only generic interaction envelopes; the family board owns current/recent work views; the family domain web workbench owns complete authorized history and complex grant review. Submit-question, grant confirm/replacement, revoke, and author redaction remain reachable from every Guardian surface, but each action converges on the same Nurture command/policy regardless of presentation. Chat intent, board cards, and workbench forms never become business authorization or parallel lifecycle owners. Submitted questions are immutable; correction/resend is a new command, and hard deletion is not a surface action.

Pilot-0-B3-1b locks the Caregiver action boundary across generic AI Chat and the teacher board, with no caregiver domain-workbench fallback. Both surfaces close acknowledge/reply through the same Nurture commands. Chat may open a transient protected-detail view by opaque ref after current owner reread, but protected family bodies never become persisted Chat messages or activation content. Opening an item remains read-only; acknowledge is an explicit business action distinct from host notification read state. AI may draft but cannot publish under a caregiver identity without confirmation. The teacher board owns complete authorized current/history views because no other Caregiver work surface exists. Direct family Chat, bulk actions, clarification loops, daily-care outcomes, reassignment, and multi-caregiver handoff are excluded from the first internal experiment.

Pilot-0-B3-1c locks the Institution action boundary. The institution board is read-only and exposes safe topology/readiness aggregates plus navigation; it does not execute durable commands from projections. The institution domain web workbench owns strongly confirmed Nurture topology/configuration commands for institution/care-group lifecycle, adult-invitation initiation, staff roles, enrollment lifecycle, lead-caregiver designation, policy, and scoped business disablement. Every authoritative write uses `CommandExecution` and current role/scope/version/policy checks. My-Chat still owns account invitation/authentication and technical capability/runtime controls; Guardian relationships/grants remain family authority. Institution administrators receive no ambient family-body or child-care-fact access, cannot act as caregivers, hard-delete audit facts, or create ranking/competitive scoring. Current direct-Prisma synthetic provisioning is test preparation, not this control-plane authority.

Pilot-0-B3-1d-0 separates product and execution identities. A cross-surface Nurture product action is identified by `(scenario_key, action_key)` with a stable snake-case action key; the Nurture `command_key` identifies an immutable dotted `CommandExecution` contract; `entrypoint_key` starts a Workflow; `handler_key` is implementation binding; My-Chat technical recovery actions remain Host-owned. Action/surface/ref/confirmation values are untrusted until current owner revalidation. Six existing family-care mappings retain their persisted command keys. The current manifest `scenario_actions` registry is Run/Step-shaped and cannot be reinterpreted as Message/Grant/Item/Enrollment action transport; cross-surface domain actions require an additive contract rather than a second business lifecycle.

Pilot-0-B3-1d-1 limits technical recovery to a named internal My-Chat operator with exact Pilot-workspace scope; generic workspace admin or Nurture institution-admin status does not confer the entitlement. Technical Admin may show refs/counts/status/version/reason evidence, reconcile the original outcome-unknown Step, replay or stop an eligible Handoff, request Nurture owner reevaluation, and execute disable-only emergency shutdown. The operator cannot inspect protected Nurture content, alter technical/business records, mint provenance, directly invoke Guardian/Caregiver/Institution commands, or authorize route cancel/failure/reissue. Owner reevaluation preserves Nurture policy authority, while re-enable/cohort expansion remains a separate Go/No-Go decision.

Pilot-0-B3-1d-2 gives every remaining durable Guardian/Institution transition an explicit product and command key. Family enrollment confirmation is separate from grant confirmation; grant replacement creates a new identity and never revives a revoked grant. Institution topology avoids generic upsert/change-state commands in favor of create/update/suspend/resume/close transitions. The Pilot business-disable lifecycle reuses care-group suspend/resume rather than creating another enablement aggregate. Adult invitation is the cross-owner exception: My-Chat creates and accepts the canonical workspace invitation, then an owner callback binds the accepted canonical user into Nurture before a separate staff-role command. No Institution surface binds raw user ids or accepts on another user's behalf.

Pilot-0-B3-1d-3 closes action availability with scenario-owned safe reason codes and independent `explicit`/`strong_authorization` confirmation classes. Internal command errors map to safe categories; My-Chat renders Nurture `safe_label`/`safe_help` without interpreting domain semantics. Base must add optional `domain_action_contracts` and separate availability/command/handler types without changing Run-level `scenario_actions`. Missing handlers or invalid target/surface/confirmation declarations are fatal, while legacy manifests remain valid. Adoption is Base then My-Chat then Nurture, capability-off throughout contract adoption; advertised Nurture actions require real handlers and negative coverage before activation.

Pilot-0-B3-2a makes cross-surface continuity navigation-only. An action closes in the current entitled surface when possible; richer Guardian history/grant work routes to the family workbench, Caregiver full work routes to the teacher board, and Institution writes route from the read-only board to the institution workbench. My-Chat carries only a generic route class plus Nurture-issued opaque continuation/display bookkeeping, never raw Nurture ids. Target open is read-only and repeats current owner resolution before protected detail/action display. Navigation does not acknowledge, confirm, submit, create another command, copy lifecycle state, or become a Nurture fact.

Pilot-0-B3-2b makes the existing IIA-0-R6 token protocol exact for the Pilot profile. A token binds workspace, current Nurture participant, purpose, and the surface where it may be consumed/opened; Chat clarification additionally binds the hashed host conversation. `clarify` and `submit_action` expire after five minutes, while read-only `open_notification` expires after seven days. `clarify` is consumed once after a structurally valid answer and may produce a new context after current-state recovery. `submit_action` consumption, the stable context-derived command identity, `CommandExecution`, and the business effect share one Nurture transaction; exact response-loss replay returns the committed Execution, deterministic stale/denied state revokes the token, and retryable technical failure leaves it active only within TTL. `open_notification` is a reusable locator, never a read/ack/business action, and every open owner-rereads current state. Tokens are never extended/reactivated in place and are never general object-access or strong-authorization credentials. Generic navigation without one of the three purposes carries only route class plus the B3-2d allowlisted display view mode, never a business target/filter/cursor.

Pilot-0-B3-2c makes notification delivery an authenticated indirection rather than a continuation carrier. Provider payloads and deep links carry only a recipient-bound My-Chat `notification_id`, a generic notification-open route, and content-safe generic copy; Handoff ids, scenario tokens, Nurture refs, protected bodies, and cached business state remain server-side or absent. After sign-in, My-Chat validates exact notification recipient/workspace, marks only the Host notification as read, rereads the eligible Handoff, and asks a separate Nurture open resolver for current visibility. A successful owner read issues a destination-bound `open_notification` token into response/client navigation memory, never the provider payload, URL, My-Chat persistence, logs, or analytics; the destination owner-rereads again before protected render. Delivery eligibility and open visibility are separate owner operations: owner reread occurs before notification creation, before every provider send/retry, and on every open. Pre-send revoke/redaction/cancel skips delivery; post-send changes cannot retract the OS notification but always win on open. Previously notified actors may still reach current authorized acknowledged/replied/closed history, while revoke, removed entitlement, redaction, withdrawal, stopped/failed Handoff, disabled capability, or unavailable owner produces only current safe unavailable/retryable UI and never restores cached controls.

Pilot-0-B3-2d closes continuity without adding a draft platform. Unsubmitted text, form state, and AI drafts remain actor- and surface-local; same-surface `clarify`/`submit_action` may use their existing five-minute contexts, but no draft body, target cursor, or prepared action moves to another surface/device/account. Leaving a non-empty draft requires explicit stay-or-discard UX. My-Chat Chat transcript is Host conversation history, not a Nurture draft/result source; caregiver drafts derived from protected content remain ephemeral. The existing My-Chat `PublicDraft`/Workflow artifact draft path remains reserved for external publication and MUST NOT become a family-care action draft. Committed continuity comes only from Nurture business facts plus refs-only `CommandExecution`: the source may render a non-authoritative safe result, response loss replays the same Execution, and the destination queries current owner presenters without another command or generic result token. History rows, target filters, pagination/search cursors, and business ids never ride the transition; only generic `route_class` plus `view_mode=current|recent|history` may follow. Family/teacher/institution surfaces query their role-correct current history, while Chat, Notification inbox, and Technical Admin remain non-canonical views. Drafts are not shared across guardians/devices, but committed facts may become visible to other currently authorized participants under Nurture policy.

Pilot-0-B3-3a fixes the first business input as one protected plain-text `family_care_question`; it does not narrow the reusable domain vocabulary. The trusted Nurture Pilot adapter derives `data_class=family_care_question`, `category=question`, `urgency=today_attention`, `route_mode=immediate`, `requires_ack=true`, `requires_reply=true`, and `attachment_refs=[]` before the existing command kernel. Guardian/caregiver body text is trimmed plain text of 1–2000 Unicode characters and remains behind a protected content ref. The displayed list summary is deterministic and generic rather than extracted from the body. Raw domain ids, route flags, grant values, urgency, safe summary, protected refs, and source-surface claims are not user-authored fields. Unsupported health/medication/emergency, media, daily-care, constraint, follow-up, rich-text, attachment, and batch inputs fail before the first business write and are never silently remapped. AI may help draft text but cannot select the business class, expand the envelope, or publish a caregiver identity. The generic command/schema may continue supporting broader classes and modes; a strict additive Pilot profile gate is required before traffic.

Pilot-0-B3-3b binds the complete question round trip to one Nurture-owned active Grant rather than separate directional grants. The exact profile binds workspace, child process, current enrollment, and current care group; uses `grantedToScopeType=care_group`; fixes `directions=[family_to_org,org_to_family]`, `dataClasses=[family_care_question]`, and `purposes=[family_care_workflow]`; and requires expiry at the earlier of 30 days after effectiveness or the Pilot allowlist expiry. `org_to_family` authorizes only a caregiver-confirmed reply to the Grant-bound source item, not proactive outbound content. One binding may have at most one current active Grant. An exact duplicate returns `already_satisfied`; any scope/direction/data-class/purpose/expiry change atomically replaces the old identity, and revoked/expired/replaced identities never reactivate. Capture, acknowledge, and reply must use the exact original `grantId`; a replacement Grant authorizes only new questions and cannot revive an old item. The scripted primary Guardian owns grant administration without becoming a new role. Any current same-family Guardian may author a new question and owner-read committed family facts under the active Grant, but only the granting participant may replace/revoke it and each message author may redact only their own message. Institution admin, caregiver, and technical operator have no family-Grant authority. Loss of the granting participant's current Guardian eligibility blocks new cross-role use without implicit ownership transfer.

Pilot-0-B3-3c makes the happy path three atomic Nurture commands: capture creates one family-authored sent Message, logically delivered family-to-org Receipt, open Item, created ItemEvent, active Attention projection, thread update, and Execution; explicit acknowledge alone transitions `open(v0) -> acknowledged(v1)`, appends the event, and moves the source Receipt from delivered to acknowledged while Attention stays active; caregiver-confirmed reply alone transitions `acknowledged(v1) -> replied(v2)`, creates the linked caregiver Message and org-to-family delivered Receipt, appends the reply event, updates the thread, and resolves Attention. Reply from open/waiting states is forbidden. `replied` is terminal for the Pilot; no close, follow-up, clarification, reopen, second reply, or in-place edit follows, and a correction is a new question. `delivered` means Nurture's current logical target surface can owner-read the content, not provider delivery, device read, acknowledgment, Handoff, or Outbox completion. Item/detail/notification open remains read-only and creates no implicit Nurture `read`; Host notification read state is independent. Message content, Receipt distribution, Item work state, Attention projection, and My-Chat delivery therefore remain separate owners without mirrored state.

Pilot-0-B3-3d makes exact `CommandExecution` replay the only recovery for command response loss and keeps business authorization independent from technical delivery. A stable `commandRequestId` plus canonical payload hash returns the original Execution/output refs for an exact retry and rejects payload drift; after Nurture commit, only the original claimed My-Chat Step may reclaim and consume the replay seed, so response loss cannot create a second Message, Receipt, Event, version, Attention, or Handoff. Every read, action, retry, notification, and stale open rechecks the Item's original `grantId` plus current role, family, enrollment, care group, and policy. Grant revoke, expiry, replacement, owner-role loss, or scope drift suppresses active work and cross-role body access without rewriting the retained audit facts or letting a new Grant revive the old Item. Author-side access to a retained body is separately policy-gated: a current same-side author may still read their own Message, while a former cross-role receiver sees only an allowed content-free tombstone. Redaction is author-only, expected-version, and irreversible: Guardian source redaction suppresses the dependent Item and active Attention, while caregiver reply redaction tombstones only the reply distribution and never reopens or suppresses the already-replied source Item. The immediate route exposes no Pilot cancel action; a delivered cancel attempt returns `route_already_visible`, and withdrawal is represented only by author redaction or Grant-owner revoke. Nurture commit failure, Step/Handoff/Outbox recovery, provider failure, owner-API outage, stale action, kill switch, and operator reconciliation preserve their separate owners; technical recovery can inspect and reconcile refs-only evidence but cannot restore Grant authority or edit Nurture business state.

Pilot-0-B3-4 closes representative coverage through a layered proof model instead of a Cartesian E2E explosion. Contract/conformance tests exhaust every allowed and denied action/surface cell; Nurture DB tests own transaction, version, Grant, Receipt, Item, Attention, revoke, and redaction invariants; two-database joint tests own claimed-Step replay, Handoff/Outbox, notification owner reread, technical failure, and privacy probes; rendered surface tests own Chat, role-board/workbench, notification, and Technical Admin behavior. Four independent `family_care_question` round trips across the three synthetic child/family scopes cover Guardian Chat/family-board/family-workbench submission and all four Caregiver `Chat|teacher_board` acknowledge/reply pairings; the dual-Guardian family runs two questions so the child count does not grow. A separate Institution strand proves read-only board to authoritative workbench setup/disablement without protected-body access, while a Technical Operator strand proves refs-only recovery without business authority. CI may seed topology for kernel tests, but direct Prisma writes do not count as final authenticated onboarding evidence; Pilot-0-C owns that product closure. Pilot-0-B completes only as a readiness contract and does not activate implementation or traffic.

Pilot-0-C0 makes My-Chat's authenticated shell the only public IIB ingress. Clients never call raw Nurture business routes; My-Chat supplies authenticated user/workspace/surface, idempotency, and opaque Nurture context to a generic private owner/action bridge, while Nurture alone resolves participant, role, work scope, target, Grant, policy, version, presenter state, and action availability. The current Nurture dev-host is excluded from the Pilot artifact. The first synthetic Institution uses a one-time, allowlisted bootstrap rather than self-service signup or a database fixture: a versioned Pilot provisioning specification binds the exact workspace, scenario, synthetic institution, initial Institution Admin My-Chat identity, and expiry; only authenticated My-Chat invitation acceptance permits one idempotent Nurture transaction to establish the Institution, Participant, first admin role, and audit result. Exact replay returns the original result, while user/workspace/payload drift, expiry, or reuse fails closed. The provisioning artifact is not a B3-2 scenario token and never reaches a client. Technical Admin may observe refs-only outcome evidence but cannot choose another admin, mutate the specification, or reopen bootstrap. Pilot-0-D will decide issuance, custody, deployment, and rollback of the provisioning artifact.

Pilot-0-C1 uses `NurtureCareGroup` as the only class/group aggregate. Institution Admin creates/updates and non-destructively pauses/resumes/archives a CareGroup from the Institution workbench; the board remains read-only. Enrollment-invitation eligibility is a current derived readiness decision over active Institution/Group, current Lead Caregiver assignment, completed required policy, and Pilot gates rather than a second class lifecycle or cached boolean. Staff onboarding is three separate owner transitions: Institution Admin initiates a My-Chat Staff Invitation, accepted canonical identity binds or reuses one `NurtureParticipant` with no business role, and a later strongly confirmed Nurture command creates a care-group-scoped `caregiver` RoleAssignment before a distinct Lead designation. Invitation intent is not role authority, and neither Participant existence nor Host membership grants Teacher-board access. Role suspension/revoke, Host membership loss, group pause/archive, expiry, or scope drift blocks access immediately without deleting Participant, authorship, or audit facts. The Pilot activates exactly one Lead Caregiver and no backup/multi-caregiver concurrency, while the reusable model may support multiple separately scoped assignments later.

Pilot-0-C2a separates institution-local intake from the family-authorized longitudinal child record. An Institution Admin may create a minimal `NurtureInstitutionRosterEntry` for an expected child in one Institution/CareGroup and use the entry to initiate an Enrollment Invitation after C-1 readiness passes. The entry is a Nurture-owned, institution-local intake/audit object, not a `NurtureChild`, `NurtureChildCareProcess`, Guardian relationship, Enrollment, Grant, global child identity, or cross-institution matching key. Institution-provided display name and optional age/birth prefill retain institution provenance and remain unverified until the invited adult authenticates as a prospective Guardian and explicitly confirms or edits them. A prospective Guardian without an existing product profile creates the minimum child/process/family record and initial Guardian relationship in one family-authorized transaction; a current Guardian with an eligible same-workspace record selects it from owner-resolved candidates. Global/fuzzy name-and-birth matching is forbidden. Roster-to-child linkage, Enrollment, and Grant remain separate strongly confirmed transitions; the roster link is written only with confirmed Enrollment. An ignored/expired/declined invitation creates none of those authority-bearing facts. Cross-workspace longitudinal portability remains a later C-2f contract rather than an implied property of the roster entry.

Pilot-0-C2b-1 makes first-Guardian establishment a family-authorized, audited transition rather than an Institution assertion. My-Chat must authenticate the exact active Enrollment Invitation recipient, but recipient identity and Institution intent do not establish a Guardian relationship. The prospective Guardian strongly confirms the relationship declaration, minimum longitudinal profile, privacy meaning, and family visibility consequence. One Nurture `CommandExecution` transaction binds or reuses the workspace `NurtureParticipant` and creates `NurtureChild`, `NurtureChildCareProcess`, `NurtureFamily`, and the first active Guardian RoleAssignment; any failure rolls back the whole effect. An existing child process can be selected only by a participant who already holds current Guardian authority over that process/family. A non-Guardian recipient must first use the later current-Guardian-initiated Co-Guardian path and cannot claim the record from Institution prefill, raw ids, or matching. The first role is not `primary_guardian`; `father`, `mother`, or `other_guardian` are family-confirmed relationship/display metadata and confer no different permission. Pilot evidence is an internal product assertion/audit contract, not legal guardian verification; any production evidence or document check is a separate high-sensitivity feature.

Pilot-0-C2b-2 makes Co-Guardian onboarding a current-family-owner transition. Any current Guardian may initiate an exact Family/ChildCareProcess invitation without becoming a primary or family administrator; Institution Admin, Caregiver, and Technical Operator cannot initiate or accept on another adult's behalf. My-Chat owns raw recipient contact, delivery, authentication, workspace membership, and exact-recipient Host acceptance. Nurture owns the sole business invitation intent, inviter/family/process binding, suggested relationship metadata, expiry/version/payload hash, current-policy checks, and only an opaque Host invitation ref. Host acceptance proves recipient identity/membership only and cannot grant Guardian authority or override a revoked/expired Nurture intent. Issue creates no recipient Participant, role, history access, Grant authority, Enrollment, or new child object. On business acceptance, Nurture rechecks inviter authority, family/process lifecycle, invitation state, exact recipient/workspace, and the Pilot cohort gate before one `CommandExecution` transaction binds/reuses Participant and creates the second active Guardian RoleAssignment. Exact replay is stable and drift conflicts. The inviter may cancel only a pending Nurture intent; provider cancellation is delivery bookkeeping and cannot replace the Nurture state fence. Cancellation cannot revoke an accepted relationship. Pilot policy permits exactly one Family-1 Co-Guardian acceptance and none for Family-2/Family-3, solely to preserve the accepted experiment topology; the reusable Schema and product model have no two-Guardian maximum.

Pilot-0-C2b-3 authorizes current family membership without merging authorship or consent ownership. After the second Guardian RoleAssignment commits, both current Guardians have equal base family rights and may owner-reread eligible committed family facts, including pre-membership history, under current Family/role/Enrollment/original-Grant/redaction/retention/policy checks. No access exists before role commit, and reread never copies Message/Receipt/history rows or reconstructs another actor's draft or `NurtureInteractionContext`. Either current Guardian may submit a new eligible family question under the active Grant and read current family-visible facts; each author may redact only their own Message. Existing `grantedByParticipantId` remains the sole replace/revoke authority for that Grant, and joining never transfers or revives Grant ownership. Family-originated facts may remain family-side readable when current family policy allows, while caregiver/institution-originated bodies continue to require the original current Grant and become unavailable/tombstoned after its fence closes. Acceptance cannot revive redacted/revoked/expired content, backfill historical notifications, alter authorship, or grant other-family/institution-internal access. C-2b-4 owns what happens when a Guardian relationship later ends.

Pilot-0-C2b-4 allows strongly confirmed self-exit but no peer or administrative removal of an accepted Guardian relationship. Exit is denied if the actor is the last current Guardian because ordinary offboarding cannot leave an authority-free Child/Family. When another current Guardian remains, one versioned Nurture `CommandExecution` transaction terminalizes the actor's Guardian RoleAssignment as revoked, cancels pending Co-Guardian invitation intents issued by that actor, revokes active Grants owned by that actor, and applies the established Receipt/Item/Attention/protected-body cascades; a Grant owned by another current Guardian remains independently valid. The exiting actor immediately loses family profile/history/action access, including author-side body access that requires current same-family eligibility, while Participant, authorship refs, business facts, audit shells, and Execution evidence remain immutable. Stale notifications/deep links fail on owner reread. Host account/workspace loss also blocks access but does not mutate Nurture relationship state. Rejoin requires a new invitation and new RoleAssignment; terminal roles and old Grants never reactivate. Forced removal, legal/custody dispute, evidence collection, or safety adjudication is outside Pilot and cannot be implemented as Operator/Institution database authority.

Pilot-0-C2c-1 separates Institution Enrollment Invitation issue from family identity and enrollment effects. Only a current exact-scope Institution Admin may issue from the workbench after rechecking active Institution/CareGroup, current Lead Caregiver, completed required policy, workspace/capability/Pilot gates, and an unlinked current `NurtureInstitutionRosterEntry`. The versioned Nurture invitation intent binds Institution, CareGroup, RosterEntry, issuing Admin, opaque exact-recipient Host invitation binding, required expiry, and canonical payload hash; exactly one effective pending intent may exist per RosterEntry. My-Chat owns raw contact, delivery, authentication, workspace membership, and Host acceptance, while Nurture intent state is the sole business-continuation fence. Host delivered/accepted state cannot bypass Nurture cancel/expiry/readiness/policy denial. Issue returns only allowlisted Institution/Group/local-label/purpose/expiry/privacy display content, treats Institution prefill as unverified, and creates no Participant, Guardian role, Child/Process/Family, Enrollment, Grant, thread, Message, or teacher-visible child fact. Exact replay returns the original intent; binding or payload drift conflicts. Pilot issues one distinct Enrollment Invitation for each of three RosterEntries, and Family-1's later Co-Guardian path remains a separate invitation kind.

Pilot-0-C2c-2 makes authenticated acceptance resumable without prematurely consuming the Nurture intent or linking Institution data. My-Chat Host acceptance proves the exact recipient only; Nurture reruns invitation/recipient/workspace/readiness/RosterEntry/current-policy checks. A recipient with current same-workspace Guardian roles receives Nurture owner-resolved candidates and must explicitly select through opaque option tokens even when one candidate exists; raw ids and Institution prefill never select or match a child. A recipient without an eligible Guardian role uses the atomic C-2b-1 Participant/Child/Process/Family/first-Guardian command. A non-Guardian who knows another current profile exists must use Co-Guardian Invitation rather than claim or fuzzy-match it; no automatic merge occurs. Existing-child selection is held only in a short-lived `NurtureInteractionContext` and creates no Roster link, Enrollment, Grant, thread, or teacher visibility. New family profile creation is a separate durable family fact and remains if the Institution invitation later expires/cancels, but does not create Institution linkage. The Nurture Enrollment Invitation remains pending and is consumed only by the later C-2d atomic Enrollment commit; context expiry requires fresh owner resolution. Pilot's three first Guardians take the new-profile branch, while existing-profile selection is required boundary evidence without adding a fourth child/family.

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

Pilot-0-C2f-0 defines Enrollment topology lifecycle before command-specific mechanics. `active` and `paused` remain current and uniqueness-conflicting; `ended` and `withdrawn` are terminal identities that never reactivate; `pending` remains legacy conflict-only because Pilot confirmation creates no pending row; and `deleted` is not an executable Pilot lifecycle or retention shortcut. Guardian is the only family-side Enrollment restriction/withdrawal actor class, while exact-scope Institution Admin is the only institution-side restriction/end/transfer-proposal actor class. Caregiver, Lead Caregiver, Technical Operator, service identity, AI interpretation, raw ids, My-Chat membership, and ambient workspace administration cannot change Enrollment topology. Pause is reversible current denial: Enrollment-dependent cross-role reads, actions, and delivery fail closed, but no permanent Grant/dependent cascade may run. Family and institution restrictions remain separately attributable, and neither side may clear the other side's restriction; C-2f-1 owns the additive hold model, exact action keys, confirmation, and release concurrency. Withdrawal, institution end, and completed transfer are permanent old-Enrollment transitions and therefore must close old Grants/work through the C-2e kernel; C-2f-2 and C-2f-3 own their atomic transaction details. Transfer never edits the old `careGroupId`: it ends the old Enrollment and creates a new identity with no old Grant, Thread, or content authority. Different-Institution Enrollments stay independent. Same-workspace longitudinal child/process facts may continue only through current family ownership, while cross-workspace matching, global child identity, and automatic Child/Grant/Thread/content migration are forbidden pending C-2f-4. C-2f-5 owns result, recovery, presenter, and Handoff semantics.

Pilot-0-C2f-1 models pause as side-owned, versioned restriction evidence rather than a mutable global boolean or personal veto. Additive `NurtureEnrollmentPauseHold` rows allow at most one active `family` and one active `institution` hold per Enrollment; `released` records an authorized same-side resume, while reserved `closed` lets C-2f-2/C-2f-3 terminalize a remaining hold without falsely claiming recovery. Each row carries safe fixed reason, exact place/release actor and RoleAssignment, database times, versions, and CommandExecution refs, with no free text or auto-expiry. Active holds are authorization authority; `Enrollment.status` is an atomically maintained aggregate and every read fails closed on hold/status inconsistency. Any current exact-Family Guardian may place/release the shared family hold, and any current exact-scope Institution Admin may place/release the shared institution hold; actor audit creates no hidden primary or orphan-prone personal veto, and cross-side release is always denied. Guardian uses `suspend_family_enrollment` / `resume_family_enrollment`; Institution reuses `suspend_enrollment` / `resume_enrollment`, with resume defined only as release of the institution hold. Five-minute current-state confirmation discloses side, blocked cross-role access, retained facts, non-recall, continuing Grant expiry, other-side independence, and conditional recovery. One Serializable transaction locks context, actor role, Enrollment, then holds; validates expected versions; creates/releases the side hold; recomputes status; increments Enrollment version even if still paused; and commits audit/Execution. Exact replay is stable; same-side duplicates are `already_satisfied`; stale concurrent cross-side confirmations conflict and must be reviewed again. Pause mutates no Grant/Thread/Message/Receipt/Item/Attention lifecycle, extends no clock, and triggers no cascade or bulk replay. Existing business objects may become usable only after resume plus complete current owner reread. Institution/CareGroup lifecycle pause remains a separate upper-scope fence and never fans out hold rows.

Pilot-0-C2f-2 makes same-Institution CareGroup transfer a two-owner intent plus one atomic Nurture cutover. Exact Institution Admin uses workbench-only `propose_enrollment_transfer` / `cancel_enrollment_transfer`; any current exact-Family Guardian uses `confirm_enrollment_transfer` / `decline_enrollment_transfer` from all Guardian surfaces. No direct `transfer_enrollment`, initial `initiate_enrollment`, terminal `close_enrollment`, Enrollment Invitation, raw recipient, Caregiver, Operator, or AI path may substitute. `NurtureEnrollmentTransferIntent` binds source Enrollment/version and source/target Groups under one Institution, proposing actor, seven-day expiry, fixed safe reason/hash, lifecycle/audit, and at most one effective pending identity. Proposal/confirmation require an active source Enrollment with zero pause holds; any later hold/version change makes the intent stale. Source Group may be active/paused/archived for transfer-out, while target Group and Institution must be active and target staffing/policy/gates/capacity current. Additive `Enrollment.rosterEntryId` binds one exact roster identity, and the new Enrollment alone stores unique Restrict `supersedesEnrollmentId`; no old-row successor mirror exists. Confirmation creates the target RosterEntry only after Guardian authorization. One Serializable transaction resolves context/current actor, locks source Enrollment before TransferIntent, then Groups/holds/source roster/ordered Grants/Thread roots, preflights cascade capacity, obtains one database time, writes old `ended + leftAt + care_group_transfer`, terminalizes old Grants and dependents, archives old Thread/source roster, creates target roster plus new active Enrollment with `joinedAt=leftAt`, consumes intent, and commits lineage/audit/Execution. C-2f-3b supersedes the earlier Intent-first prose so pause/transfer/end/withdraw use one Enrollment-first topology order. Any fault, race, integrity defect, or cascade overflow rolls back the complete cutover. Old roster/Grant/Thread/Message/Receipt/Item/Attention/context/Handoff/notification/policy and care facts stay bound to the old topology; target caregivers receive only safe current roster visibility until a fresh target Grant creates a new Thread. Exact delivery/result semantics remain C-2f-5.

Pilot-0-C2f-3a separates permanent family withdrawal from Institution service end instead of exposing a generic terminal mutation. Guardian Chat, family board, and family workbench converge on `withdraw_family_enrollment -> nurture.family_care.withdraw_enrollment`; Institution workbench retains `close_enrollment -> nurture.institution.close_enrollment`, while Institution board is read-only. Any current exact-Family Guardian may independently withdraw the shared Enrollment; Grant ownership, invitation receipt, join order, a hidden primary role, and unanimous Co-Guardian approval confer no Enrollment authority. Any current exact-scope Institution Admin may end service independently; neither owner side countersigns the other's terminal decision. Both actions require a five-minute current-state strong confirmation and accept no client reason, actor, status, or audit fields. Family withdrawal maps only to terminal `withdrawn + family_withdrawn`, Institution service end to terminal `ended + institution_service_ended`, and completed transfer remains `ended + care_group_transfer`. Current `active|paused` may enter either permanent-exit path. An active hold cannot veto termination and is later closed by the terminal system effect, never presented as a same-side release. Caregiver, Lead, Operator, service identity, Host admin, AI inference, raw ids, generic `end_enrollment`, and action aliases remain forbidden. A committed terminal Enrollment never resumes; C-2f-3b owns exact hold/Grant/Thread/dependent closure and C-2f-3c owns fresh re-entry identity/history. Result, peer notification, delivery, and Handoff remain C-2f-5 and never gate the business commit.

Pilot-0-C2f-3b makes terminal exit one Enrollment-rooted Serializable closure rather than an Enrollment status write followed by eventual repair. Additive Enrollment terminal fields bind fixed reason, exact actor Participant/RoleAssignment, unique owning CommandExecution, database `leftAt`, and aggregate version. Hold `closed` requires `closedAt` plus `closedByExecutionId`, keeps release fields null, and preserves original placement audit. Topology-invalidated Grants become `revoked` under `enrollment_withdrawn|institution_service_ended|enrollment_transferred`, keep `revokedByParticipantId=NULL` because the terminal actor is not necessarily Grant owner, and link bounded CascadeAudit to the Enrollment Execution; elapsed status-active Grants converge as expiry instead of false revocation. TransferIntent adds system `invalidated(source_enrollment_terminal)`, every topology context carries a typed Enrollment dependency, Thread closes with executable/body-derived projection removed, and roster becomes matching noncurrent history without delete/unlink. The global order is exact replay, context/actor, Enrollment, Institution/CareGroup, Hold, TransferIntent, roster, Grants by primary key, Thread, then C-2e roots/dependents; this Enrollment-first order supersedes C-2f-2 Intent-first wording and governs every topology command. The transaction preflights the aggregate hard cap before root mutation, obtains one database time, consumes the command context, writes all terminal facts/cascades/audits/Execution, then asserts no active Hold, pending TransferIntent, status-active Grant, executable context/retry/Item/clarification/Attention, active Thread, or current roster remains. Fault, phantom, overflow, integrity defect, or survivor rolls back all and triggers Pilot stop/manual reconciliation. Exact replay returns the original receipt; a fresh same-cause duplicate may be `already_satisfied` without actor/time/reason rewrite, while different causes and concurrent topology/work actions are first-commit-wins. Messages, care facts, authorship, and body-free audit remain retained; RoleAssignments, Institution/Group, other-Institution Enrollment, immutable Host seeds, and technical ledgers are not rewritten. No remote call occurs inside the transaction, and C-2f-5 output/Handoff/notification cannot determine commit.

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
  display_name
  birth_info?
  profile_basics?

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

## 4. `family_to_org`：班级家庭沟通中枢

`family_to_org` 的第一版不应被定义成“家长把家庭画像分享给机构”。它应定义为：

> 家长作为某个小孩养育过程的参与者，把需要机构照护者处理的事项投递到老师班级工作流中。

老师端产品形态：

- 家长侧保留单个小孩的私密会话时间线，以一对一/小群式呈现维持连续沟通和信任。
- 老师侧聚合成 `ClassFamilyInbox`：一个班级的家庭沟通事项统一进入班级 inbox。
- inbox 支持 `今日需关注`、`未确认`、`需回复`、`待跟进`、`已处理`。
- 老师点开事项后进入 child-scoped work detail，而不是家庭聊天房间；结构化动作、确认答复和结果记录由 workflow 转换成只面向该小孩家庭的消息，不跨家庭可见。

AI 只做低风险辅助：

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

IIA-0-C1 locks the first-slice capability contract. The four capability keys below stay separate. Implementation starts with `class_family_inbox` + `teacher_attention_board`, then adds `caregiver_daily_care`, then `child_media_attribution`.

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
audit, proposed isolated delivery topology, two-key workspace gate, minimum IIB
closure, and success/stop/rollback contract live in `09-pilot-readiness.md`.
Those recommendations are not an activation authorization; the current dev
host remains pre-activation and is not a deployable pilot service.
