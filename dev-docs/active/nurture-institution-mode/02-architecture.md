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

Parents, teachers, and institution administrators all use the My-Chat main mobile chat. My-Chat may process a turn to decide whether to invoke Nurture and may reuse an explicit scenario entry, conversation binding, or Nurture-issued token. That host route decision selects only the scenario. Nurture still resolves participant role, work scope, target, policy, and whether the business effect is internal, `family_to_org`, or `org_to_family`.

The system invocation direction (`My-Chat -> Nurture -> My-Chat response`) is independent from the Nurture business distribution direction. A teacher message entering from My-Chat is not a special reverse path; it is the same role-agnostic scenario invocation as a guardian or institution-admin message.

`NurtureInteractionContext` may store short-lived pending intent, candidates, clarification state, and draft/action refs. It is consumed inside Nurture and is not a host authorization result.

IIA-0-R2 locks the resolver context shape into three layers:

- `actor`: the resolved Nurture participant and role assignment candidate/selection.
- `workScope`: the current work surface scope, such as `child_process`, `family`, `care_group`, or `institution`.
- `target`: an optional concrete object such as a thread, item, log, media asset, grant, enrollment, or child care process.

`childCareProcessId` is mandatory before child-specific command execution, but it is not mandatory for every collection work surface. Teacher board and class inbox can resolve to `care_group` first; institution views can resolve to `institution` or `care_group` first. Downstream queries still must constrain child rows through active enrollment, role scope, and policy.

IIA-0-R3 locks the resolver input envelope. My-Chat can provide authenticated user identity, surface, conversation refs, current payload, generic display state, idempotency, and Nurture-issued opaque scenario tokens. My-Chat must not author Nurture business refs such as `targetRef`, `workScopeHint`, `selectedRoleAssignmentId`, `childCareProcessId`, `careGroupId`, `institutionId`, `grantId`, `dataClass`, or policy decisions.

When a rendered Nurture surface needs to resume a target, scope, pending action, draft, or notification, Nurture must issue an opaque `scenarioToken`. My-Chat stores and returns that token without interpreting it. Token resolution still re-checks participant, role, scope, grant/runtime fence, policy, and object lifecycle.

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

The host cannot author a Nurture care-group id or role assignment. Multiple reachable scopes return Nurture-owned structured clarification; missing/revoked access returns one generic unavailable state. Every read revalidates the current participant, role, group/institution scope, enrollment, thread membership, item-linked grant, source message, and redaction state. Grant revoke or source redaction therefore removes the old item on the next owner read without requiring My-Chat to interpret a Nurture lifecycle value.

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
