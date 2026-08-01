# Architecture — 家庭与照护者对话能力

## Domain Model

- `FamilyPrivateConversation`：家庭拥有的私密上下文，不是共享线程。
- `BoundarySendIntent`：由有权 guardian 明确创建的跨边界发送意图。
- `FamilyCareMessage`：Nurture-owned、面向明确 audience 的 canonical 消息事实，保留 protected body、provenance、author 与 direction。
- `CareItem`：相关跨边界 capability 被确认执行后，承载一次问题、观察或跟进闭环的结构化照护事项；普通 Chat turn、安全查询和未确认 action suggestion 不创建 CareItem。
- `CareReplyV1`：由一个 `messageKind=caregiver_reply` 的 canonical Message、对应
  ItemEvent、Receipt 和 author audit 组成的 typed projection；不新增第二份 reply
  canonical table。
- `DeliveryReceipt` / `ReadReceipt` / `Acknowledgement`：状态事实，不以 UI 本地状态代替；`Acknowledgement` 表示精确 CareGroup 已收到，不等于个人 assignment。
- `Correction` / `Withdrawal` / `Redaction`：追加式变更，不静默改写历史。
- `GuardianCareProjection` / `CaregiverWorkProjection`：从同一组当前可读领域事实生成的角色化投影，不是复制的业务真相。
- `FamilyCareThread`：如复用现有模型，只能作为单一 Enrollment 下的路由、索引或历史技术容器；不得表示跨角色共享聊天室、成员关系或权限。

上述 public contract names 已固定。discovery 只决定现有 persistence/domain type 的
复用或迁移落点，不得借内部命名改变 public schema 或重复建立 canonical aggregate。

当前 landed fact/schema/source 与目标模型的逐项映射见
`06-t002-fact-schema-gap.md`。其中 legacy single-status Item、personal assignment、
single linked reply、ThreadParticipant authorization 和 raw command DTO 都是迁移输入，
不是新 T-005 activation contract。

## Stage G2 Architecture Boundary

Stage G2 复用 T-005，并分为三个可独立验证但共同组成 task Exit 的 checkpoint：

```text
G2-A Core CareInteraction Loop
  Guardian protected submit
    -> exact Enrollment/CareGroup/original Grant
    -> CareGroup acknowledge
    -> one-or-more caregiver replies
    -> Guardian/Caregiver role-safe projections

G2-B Lifecycle and Owner-read Completion
  correction + family withdrawal + author/system redaction
    -> delivery invalidation
    -> Institution Admin exact owner-read source projection

G2-C Caregiver Direct Interaction Bridge
  T-006 owner-issued navigation/action
    -> exact caregiver + child/family target + org-to-family authority
    -> empty protected composer
    -> dedicated CareInteraction capability
```

G2-A 的每个 action 各自 transaction-atomic；整个多用户闭环不是长事务、saga 或
Workflow。G2-A PASS 不等于 T-005 Exit。G2-B/C 与最终 formal-ingress qualification
全部通过后，才形成 Nurture-side Beta Profile Handoff；My-Chat native delivery/device
evidence 仍由 T-008 companion 负责。

### Legacy compatibility and single-writer cutover

新 G2 row 的唯一 writer 是 exact T-004 contract 下的三轴 Harness path。legacy
single `status`、`assignedToRoleAssignmentId`、`linkedReplyMessageId`、raw command
DTO、ThreadParticipant authority、whole-Item reply CAS 和 claimed-Step handler：

- 不得写入或改变新 G2 row；
- 不得参与 authority、concurrency、replay 或 reply identity；
- 如旧 consumer 暂时需要显示，只能从三轴 CareItem、canonical reply Messages 和
  Receipts 单向派生 read-only compatibility projection；
- 不得将 legacy read projection 回写为 canonical state，也不得做双向 dual-write；
- 旧行只迁移可由 complete graph 与现有 facts 机械证明的状态；claimant、Grant、
  reply owner、lifecycle 或 single-slot 含义不明确时进入 inventory/quarantine。

该 cutover 允许 additive schema/migration 和 disposable PostgreSQL replay，但不授权
persistent environment apply。legacy path 继续 default-off；它的存在不能阻塞 G2-A
纯新路径实现，也不能成为 G2 qualification evidence。

## Three Interaction Paths

### Ordinary Chat

- My-Chat 处理普通对话；没有业务动作意图时不进入 Nurture write path。
- 当回答需要 Nurture facts 时，只能通过当前 actor/role/scope 下的安全 query capability 读取 policy-filtered context。
- 查询总结、建议动作卡和未确认草稿均不创建 Message、CareItem、Receipt 或跨边界投影。

### Chat-assisted Action

- Chat 可以把自然语言整理成 capability 与 typed input 候选，但候选不是执行授权。
- My-Chat 必须调用与看板相同的 Nurture Capability Harness；目标不唯一时进入澄清或看板选择，LLM 不静默选择 Enrollment。
- preview 后只有明确 confirmation 才允许执行；执行端重新校验 actor、target、Grant、version、policy 与 idempotency。

### Board-direct Action

- 看板通过结构化交互直接给出 capability 与 typed input，可以跳过自然语言 semantic selection。
- 看板不能绕过同一 Harness 的 prepare/confirmation/authority/execution/result contract。
- 对同一 capability 与 canonical input，Chat 和看板必须得到相同业务 effect、receipt、replay 和错误类别；只有 presenter 不同。

## Unified Capability Harness Boundary

- Harness 是 Chat 与看板共享的 Nurture 业务调用边界，不是第三套产品 surface，也不是共享聊天室。
- Harness 复用 T-004 的 capability identity 与通用 invocation contract；T-005 负责 family-care queries/actions、输入、领域 effects、receipts 和角色化结果。
- Harness 不拥有 LLM provider、Chat transcript、native/web component、导航或设备交互。
- Harness 采用通用 envelope + capability-specific typed schemas；不按 surface 复制 API，也不接受无类型的任意 JSON command。
- `surface_origin=chat|board` 只用于 presenter selection、审计与观测；同一 capability + canonical input + current authority 必须得到相同 canonical effect、receipt、replay 和 error class。
- 通用 wire fields、contract identity、result/error union 和 concurrency head schema 由
  T-004 exact contract ref 拥有。本文中的泛型结构是 T-005 required semantics；
  T-005 只冻结 family-care capability input/output/policy，不发布第二套 generic Harness。

### Capability Registry and Query Lane

exact capability keys/version、query invariants，以及 guardian timeline、caregiver work、
role-specific detail 的 typed outputs 见
[09-capability-query-contract.md](09-capability-query-contract.md)。该文件复用 T-004
generic query envelope，不发布第二套 snapshot/cursor contract。

### Action Lane

- `prepareAction`：接收 capability identity/version 与 typed input，解析当前 actor/scope/target/Grant，规范化输入，并返回 clarification、denial/unavailable 或 semantic preview + 短期 `confirmationRef`。
- preview 是 prepare 的输出，不是新的 canonical business fact；未确认 prepare 不创建 Message、CareItem、Receipt 或 `CommandExecution`。
- `executeAction`：接收 `confirmationRef` 与稳定 request identity，重新 owner-read 并校验 current authority、target、policy、capability-specific concurrency precondition、canonical input integrity 和 idempotency，然后执行 capability-specific command。
- confirmation 是用户通过 My-Chat UI 提交给 execute 的显式证据，不由 LLM 自行生成，也不建立 approval Workflow。
- CareItem 在第一条 reply 后保持 active/appendable；班级可继续追加回复，家长继续
  提问则创建新的 Item。

### PrepareAction Contract

`prepareAction` 不做 capability discovery/router。Chat 的 semantic selection 已在调用前产生 exact capability candidate；看板直接提供 exact capability。Prepare 只判断该动作在当前 owner state 下是否具备进入确认的条件。

输入分层：

- trusted context：My-Chat 私有认证接口提供的 current principal、Workspace、capability identity/version、invocation identity 与 surface context。
- user input：capability-specific typed fields，以及用户明确选择的 opaque target option ref。
- server-resolved facts：Nurture 当前 Participant/role、ChildCareProcess、Enrollment/CareGroup、原始 Grant、direction/data class/purpose、policy、capability-specific concurrency heads 与内部 route fields；这些字段不能由客户端或 LLM 声明。

多 Enrollment 时，prepare 返回当前 actor-safe 的 `needs_input` choices；只有恰好一个 current eligible target 且 capability policy 明确允许时才确定性绑定。LLM 不选择或补写 Enrollment/Grant。

输出是封闭 union：

- `ready_to_confirm`：canonical normalized preview、safe target label、expected effect、必要 warning、opaque `confirmationRef` 和 `expiresAt`。
- `needs_input`：缺失/不合法字段与 actor-safe allowed choices，不包含未授权 target 或内部 refs。
- `denied`：当前业务条件明确不允许，返回 actor-safe reason class。
- `unavailable`：owner/policy/dependency 无法可靠确认，fail closed 且只返回安全 retryability。

`confirmationRef`：

- 复用短期 submit-action context 语义，TTL 固定五分钟；不可延长、不可原地复活，过期后必须重新 prepare。
- opaque/body-free，绑定 actor、Workspace、capability/version、canonical input
  integrity、精确 target/原始 Grant、expected authority/entity/policy heads、
  issued/expires time、nonce 与允许 consume 的当前 surface context。低熵 protected
  body 使用 secret-keyed tag，不保存可枚举的 bare body hash。
- Chat ref 可额外绑定 hashed host conversation；任何 ref 都不包含 raw body、PII、可客户端修改的 Grant/role 或通用对象访问能力。
- 不跨 actor、account、device 或 surface 搬运。`surface_origin` 本身仍不是业务 authority，也不改变 canonical effect/replay identity。
- 对一个新 business effect 只能消费一次；execute 已提交后的响应丢失由相同 command request 的 CommandExecution replay 恢复，而不是重新使用 ref 创建第二个 effect。

Prepare 不建立持久化 business draft/domain effect，不复制正文到 `PublicDraft` 或
`ActionDelivery` payload，也不创建 Message、CareItem、Receipt 或 CommandExecution。
它 MAY 在 `NurtureInteractionContext` 中保存 body-free token hash、target/heads、
keyed input integrity、expiry 和 stable command identity；该 protocol row 不得出现在
timeline、history 或“待发送”投影中。
执行时客户端在同一 surface 重新提交 typed input；Nurture 重新 canonicalize 并与 ref
绑定 integrity 比较，然后 owner-reread current state。

### Acknowledge and Reply Input / Concurrency Contract

capability-specific operation input 与通用 target/concurrency contract 分离：

```text
AcknowledgeFamilyCareItemInputV1
  {}

ReplyFamilyCareItemInputV1
  body: ProtectedPlainText<trimmed, 1..2000>
```

- surface/invocation envelope 提供 owner-issued opaque CareItem target ref；它不是业务
  input，也不授权读取或执行。
- raw CareItem/Enrollment/CareGroup/Grant ids、concurrency heads、actor/role、state、
  receipt/event 类型与 command identity 均不得由客户端或 LLM 提交。
- prepare 从当前 owner state 解析精确 Item 与 capability-specific precondition，
  并把它连同 actor/scope、canonical input integrity 和 expiry 冻结进
  `confirmationRef`；protected body 必须使用 secret-keyed tag。
- acknowledge precondition 包含精确 acknowledgement head，并声明
  `acknowledged` convergent postcondition。并发第二次 acknowledge 只有在当前变化
  恰好是该 postcondition、且 lifecycle/authority/target/retention heads 仍有效时，
  才返回 already-satisfied；其他 version drift 仍 stale/denied。
- reply precondition 只绑定 replyable lifecycle、原始 Grant/Enrollment/CareGroup、
  当前 role/policy/retention heads。另一条合法 reply 是兼容 append，不导致 stale。
- execute 不得放宽被冻结的 authority/lifecycle precondition；Item closed/suppressed、
  source/Grant 失效或角色/班级漂移必须 stale/denied，不能采用最新状态继续。
- acknowledge 没有用户正文或个人认领字段；reply 只接收 exact protected body。
  CareGroup scope、当前 reply eligibility 与真实回复作者由服务端重新解析。
- capability precondition 与 stable business command identity 正交：前者保护当前动作
  的必要状态/authority，后者支持相同业务提交的 transport retry 与 exact replay。
- 不新增第二个重复携带 version 的 action token；target ref 选择 Item，
  `confirmationRef` 承担确认和 concurrency precondition。

### ExecuteAction Contract

请求身份分层：

- `invocationRequestId` 属于 My-Chat 当前接口调用/attempt，用于调用链、审计与技术关联，不是业务 effect identity。
- stable business `commandRequestId` 由 Nurture prepare context 生成并绑定在 opaque `confirmationRef` 中；My-Chat/LLM 不拼接或替换。
- 同一次用户确认的 transport retry 复用相同 business identity；用户有意再次执行相同内容必须重新 prepare 并获得新的 identity。

对单事务 action，以下步骤共享一个 Nurture transaction/fence：

`validate/lock confirmation → canonical input integrity match → current owner/authority/heads reread → command identity lock → confirmation consumption → domain effect/receipt → CommandExecution commit`

同一 command identity 的并发 execute 只有一个 winner。相同 identity + exact
command/scope/precondition/payload hash 返回原 Execution；相同 identity 的 payload
drift 返回 idempotency conflict，不能创建第二个 effect。不同 command identity
的合法 reply 是不同追加 effect，可以并发提交。

外部结果是封闭 union，并把调用判定与不可变业务结果分离：

```text
ExecuteActionResultV1<Output>
  committed
    executionDisposition: executed | replayed
    commandExecutionRef
    committedResult
      resultSchemaVersion
      businessOutcome: applied | already_satisfied
      output: Output
      invalidationScopes[]

  not_committed
    decision: invalid | denied | stale | conflict | retryable
    reasonCode
    recovery: none | refresh | reprepare | retry_same_command
    currentState?: RoleSafeCurrentStateV1

  outcome_unknown
    commandStatusRef
    recovery: reconcile_same_command
```

`reasonCode` 必须来自 capability schema 的 allowlist。V1 最小固定映射为：

| reasonCode | decision | recovery |
| --- | --- | --- |
| `invalid_input` | `invalid` | `none` |
| `confirmation_invalid` | `invalid` | `none` |
| `confirmation_expired` | `invalid` | `reprepare` |
| `authority_denied` | `denied` | `none` |
| `target_stale` | `stale` | `reprepare` |
| `head_stale` | `stale` | `refresh` |
| `idempotency_conflict` | `conflict` | `none` |
| `dependency_unavailable` | `retryable` | `retry_same_command` |
| `technical_retryable` | `retryable` | `retry_same_command` |

`retryable` 只在服务端已确认 no-effect 时使用；无法确认时必须返回
`outcome_unknown`。denied/stale reason 不能暴露隐藏对象、其他 Enrollment 或具体
Grant/role 内情。

- `committedResult` 是 CommandExecution 绑定并持久化的不可变、body-free 业务结果。
  `commandExecutionRef` 同时是 result authority，不新增第二个 result row/ref。
  exact replay 只把外层 `executionDisposition` 置为 `replayed`，内部 output/receipt
  refs、result schema/version 与原始 business outcome 保持一致。
- `committedResult` 不包含当前 reply count、最新 CareItem projection、当前 authority、
  Handoff/notification/delivery/read 状态；这些可变事实必须通过 `readResult` 在当前
  owner policy 下重新读取。
- `not_committed` 不伪装为业务成功。只有 current actor 仍有权读取该 Item 时，
  `stale` 才可携带最小 role-safe current state；authority/association loss 返回通用
  `denied`，不得借错误结果暴露目标是否存在或当前状态。
- `outcome_unknown` 当前不能证明 committed 或 no-effect。调用方不得换 command
  identity、重新 prepare 或创建替代 effect，只能按原 identity status/reconcile。

`disposition` 与 `businessOutcome` 正交：

- `executed + applied`：本次提交了新 effect。
- `executed + already_satisfied`：新命令确认领域状态已满足，没有重复 effect。
- `replayed + applied|already_satisfied`：返回此前同一命令已提交的原结果。

capability-specific committed output：

```text
SubmitFamilyCareQuestionOutputV1
  careItemRef
  sourceMessageRef
  createdEventRef
  sourceReceiptRef
  attentionRef
  acknowledgementState: pending
  responseState: awaiting_reply
  lifecycle: active

AcknowledgeFamilyCareItemOutputV1
  careItemRef
  acknowledgementEventRef
  sourceReceiptRef
  acknowledgementState: acknowledged
  acknowledgedAt

ReplyFamilyCareItemOutputV1
  careItemRef
  replyMessageRef
  replyEventRef
  replyReceiptRef
  replyOrderKey
  responseEffect: first_response | additional_response
  attentionEffect: resolved | unchanged
```

- 第一个有效 acknowledge command 返回 `executed + applied`。若另一个老师已经
  完成班级确认，且 lifecycle、authority、target、retention 等其他 fence 仍有效，
  当前 command 返回 `executed + already_satisfied`，引用现有 acknowledgement
  fact，不创建第二条 event，也不把当前 actor 伪记为实际确认者。
- reply 是追加内容动作。每个不同 command 都返回 `applied` 并创建独立 canonical
  reply Message/Event/Receipt；`CareReplyV1` 只是该事实组合的 typed projection。
  第一条是 `first_response + resolved`，后续是
  `additional_response + unchanged`。同一 command retry 才返回
  `replayed + applied` 与同一 reply Message/Event/Receipt/`replyOrderKey`。
- reply preview 不承诺当前回复一定是第一条，只说明“发送一条班级回复；如果当前仍
  在等待回复，将同时解除提醒”，从而允许兼容的并发 reply 在不重新确认的情况下提交。

最小 current-state hint：

```text
RoleSafeCurrentStateV1
  lifecycle: active | closed | suppressed
  acknowledgementState: pending | acknowledged
  responseState: awaiting_reply | responded
  actionAvailability: available | already_satisfied | unavailable
```

该 hint 不包含 protected body、内部 version/Grant/policy 细节、其他 Institution
信息或具体权限丧失原因。它是一次 actor-safe 诊断提示，不是 canonical result；
My-Chat 需要最新展示时仍调用 `readResult`。

重试规则：

- deterministic invalid/denied/stale/conflict：confirmation 失效；需要修正或重新 prepare，不重试原 effect。
- 明确未提交的 retryable technical failure：ref 在剩余 TTL 内保持可用，只能用原 command identity/input 重试。
- commit 后 response loss：相同 identity/input exact replay 原 result。
- outcome unknown：隔离原 identity，直到 status/reconcile 得到 committed 或 confirmed-no-effect；不能用新 identity 绕过。

`committed` 只证明 Nurture business transaction。Host Handoff/Outbox、provider send、device display/read 与 Nurture acknowledge/reply 都是独立事实；inline safe result 也不替代 `readResult` 的当前 owner projection。

### Low-interruption Result UX

结果交互默认原位、低打扰：

- `applied`、`already_satisfied` 与 `replayed` 都在当前 card/form/composer 原位收敛，
  不追加通用 modal；replay 不需要向用户暴露“幂等重放”等技术说明。
- acknowledge 对操作者统一表达“班级已确认收到”；不得在 already-satisfied 时显示
  错误，也不得声称当前操作者完成了首次确认。
- reply 统一表达“回复已发送”；第一条可附加“待回复提醒已解除”，后续可附加
  “已追加到该事项”。
- token 单纯过期且 fresh prepare 的 content/target/effect 完全一致时，允许同一手势
  内透明 reprepare；不弹出“凭证过期”等技术提示。
- stale 且仍可读时使用“事项状态已更新，请刷新后再操作”；denied 使用不泄漏事实的
  “当前无法执行此操作”；outcome unknown 使用“正在确认提交结果，请勿重复操作”
  并冻结替代提交。
- 只有 content、target、可见 effect、authority-visible consequence 或 action
  availability 实质变化时，才中止执行并要求 refresh/reprepare/rereview。

### Increment 1 Capability Boundary

- `submit`：创建 family-authored Message、open CareItem、family-to-org logical Receipt、初始 Event/Attention projection 与 CommandExecution。
- `acknowledge`：在 exact acknowledgement head、declared acknowledged convergence
  与 original-Grant fence 下追加 acknowledge Event、更新 Item/Receipt 与
  CommandExecution。
- `reply`：允许同一精确 CareGroup 的当前合格照护者在 replyable lifecycle 下追加
  caregiver Message、org-to-family Receipt、reply Event 与 CommandExecution；
  回复者不必等于 acknowledge actor，也不受已有合法 reply 数量限制。
- 第一条 reply 原子地将 response `awaiting_reply → responded` 并解除待回复 Attention；
  后续 reply 保持 responded/Attention-resolved，只追加独立回复事实。
- CareItem 不因第一条 reply 关闭；Increment 1 不提供显式 close action。closed/
  suppressed、原始 Grant/Enrollment/source 失效与 retention fence 仍会阻止新回复。
- 三者均为 `ActionExecution` 原子 command，不创建产品 Workflow Run/Step。
- correction、family request withdrawal 与 redaction 是第二增量；Grant revoke/
  cross-boundary suppression 是独立授权动作。第二增量不阻塞 G2-A Core
  CareInteraction Loop checkpoint，但未实现前不能宣称 T-005 final exit。

### CareGroup Responsibility and Individual Audit

- CareItem 的工作 scope 固定为 submit 时绑定的原始 `Enrollment + CareGroup`；
  它不是个人任务，也不因某位照护者 acknowledge 而改变 scope。
- acknowledge transaction MUST 记录实际操作者 Participant/RoleAssignment 作为不可变审计，
  但不得设置 reply authority、个人 assignment、owner transfer 或隐式 SLA。
- reply 每次执行都重新读取原始 Grant、Enrollment、CareGroup、当前 caregiver
  RoleAssignment 与 policy。班级中任一当前 `caregiver | lead_caregiver` 均可回复。
  `institution_admin`、ThreadParticipant row、同园区或同角色标签本身不授予
  operational caregiver authority；Admin 只有另持合格 caregiver role 时才可执行。
- 家庭侧 reply 的主要业务发送主体是 CareGroup；每条 reply 仍保留真实执行
  Participant/RoleAssignment 作为内部审计与可选次级署名，不得丢失真实作者证据。
- 多个合格照护者并发 reply 时，各自不同的 command identity 创建独立 reply
  Message/Event/Receipt；immutable `replyOrderKey` 决定稳定展示顺序。
- 未来如需个人分工，必须引入独立、显式的 `CareItemAssignment` / assign/transfer
  契约；不得重新把 acknowledge 解释为独占认领。

逻辑状态与回复集合分离：

```text
CareItemProgressV1
  acknowledgementState: pending | acknowledged
  responseState: awaiting_reply | responded
  lifecycle: active | closed | suppressed
  replyCount
  firstRepliedAt?
  lastRepliedAt?

CareReplyV1
  replyMessageRef
  careItemRef
  careGroupRef
  contentState: visible | redacted
  body?: ProtectedPlainText // only after current owner-read when visible
  authoredByParticipantRef
  authoredByRoleAssignmentRef
  createdAt
  replyOrderKey
  commandExecutionRef
  receiptRef
```

`CareReplyV1` 由 canonical reply Message + Event + Receipt 组合，不是单独表，也不
暴露内部 protected-content ref。`body` 只能由 current authorized query/presenter
hydration 返回；committed action output 保持 body-free。
`replyCount` 与 first/last timestamps MAY 由 canonical reply facts 派生，不要求
作为可变计数器单独成为事实源。`replyOrderKey` 是 server-issued immutable order
key，由 canonical `(replyMessage.createdAt, replyMessage.id)` tuple 编码，在 replay
中保持不变。回复集合不存在 unique reply slot，也不使用 whole-Item version 来分配
连续序号。

### Increment 2 Change Contract

correction、withdrawal、redaction 的 target、authority、typed output、cascade 与
delivery invalidation 见
[07-increment-2-change-contract.md](07-increment-2-change-contract.md)。该文件是
normative contract；本架构只保留 capability registry 和跨增量不变量。

### CareItem Lifecycle and Context Continuation

第一增量不使用含义模糊的 `followUpOfItemRef`。继续交流通过新的 `submit` 创建新 Message、CareItem、Receipt 与 CommandExecution，并可选携带 `contextContinuationOfItemRef`。

`contextContinuationOfItemRef` 的含义严格限定为交流上下文：

- body-free，只引用一个源 Item；用于 role-safe timeline 分组、返回“继续此前事项”的标签，以及为当前 actor 生成可授权的上下文总结。
- 源 Item 与新 Item 必须属于同一 `ChildCareProcess`、同一 Institution Enrollment；
  第一增量要求源 Item response 已为 `responded` 且当前可读。
- 创建关系时，当前 actor 必须有权读取源 Item；展示或总结时仍对源 Item重新执行 current visibility/owner policy，不能凭关系穿透权限。
- 新 Item 绑定执行时的当前 Grant、当前 authority source、当前 expected heads 和新的 business command identity；不得继承或复用源 Item 的 Grant、owner、SLA、command identity 或 confirmation。
- 关系不改变任一 Item 的状态、优先级、顺序、SLA、receipt 或可执行动作，不作为 authorization、routing、idempotency 或 lifecycle input。
- 如果源 Item 后续因授权或可见性变化而不可读，presenter 隐藏/抑制续接关系；新 Item 仍只按自身 facts 与当前权限读取，不级联失效。

真正的事项依赖必须使用独立、语义明确的未来 `CareItemDependency` 模型，例如
`predecessorItemRef` 或 `triggeredByItemRef`。该模型才可表达前置条件、触发、
状态传播或 SLA 语义，且不进入 Increment 1；它不属于 `InstitutionWorkflow`。

### Submit Input and Confirmation UX

`SubmitFamilyCareQuestionInputV1`、protected ingress、target option、server-derived
fields 和一次手势 confirmation 见
[08-increment-1-submit-ux-contract.md](08-increment-1-submit-ux-contract.md)。该文件
是 normative contract。

### Action Execution and Delivery

- family-care action 进入现有 Nurture CommandExecution kernel，复用 canonicalization、
  locking、idempotency、exact replay 与 output refs。
- 当前 `familyInputRouteSpec` / acknowledge/reply/redaction specs 的 raw ids、
  caller-supplied authority/classification、whole-Item reply CAS、ThreadParticipant/
  institution-admin checks 和 single reply slot 只作 T-002 migration evidence，不能
  直接注册为 T-005 public Harness capability。
- My-Chat 在 Nurture committed/replayed result 后，按稳定 result/receipt ref 幂等
  materialize Handoff、Outbox、notification 与 deep link；该技术阶段称为
  `ActionDelivery`，不是产品 Workflow。
- response loss 使用原 command identity exact replay；`outcome_unknown` 先 reconcile，
  未解析前不得创建替代 delivery/effect。
- Harness 不复制 CommandExecution、worker、outbox 或 handoff runtime，也不为
  CareInteraction 创建 Workflow Run/Step。
- T-004 拥有 Harness 的通用 invocation envelope/compatibility contract；T-005
  拥有 family-care capability specs、policies、commands、effects、receipts、
  delivery result binding 与 presenters。
- T-002 当前 claimed-Step / `workflow_step_complete_v1` 路径是 compatibility seam。
  在其被替换或显式重新分类前，真实 activation 保持 NO-GO；不得把该旧路径写回
  T-005 产品契约。

## Cross-boundary Action Flow

`guardian private context → previewed → confirmed → family-to-org Message + CareItem + Receipt → caregiver work projection → acknowledged → one-or-more CareGroup reply Messages + Receipts → guardian projection`

例外路径：

- authority changed：fail closed，旧 intent 失效。
- duplicate retry：返回同一幂等结果。
- withdrawal/redaction/correction：保留原事实引用和审计原因。

## No Shared Cross-role Room

- Guardian Chat 是家庭私密的 child-centered AI/feedback surface；Caregiver Chat 是当前授权 work/item 的交互投影。
- 两个角色不会加入同一个 room，也没有共享 participant roster、presence、typing、direct-message 或统一未读状态。
- 同一 CareItem 的两侧正文、动作和状态可以不同；provenance、原始 Grant、Message/Event/Receipt 链负责连接，不靠共享 transcript 连接。
- My-Chat Chat transcript 只是宿主会话历史，不是 Nurture draft、结果、业务历史或授权来源。
- caregiver 受保护正文通过 opaque ref 临时 owner-reread；不得复制进 My-Chat Chat history。
- 多 Institution Enrollment 之间各自隔离；同一孩子不存在跨机构共享房间或可推断其他机构关系的会话列表。

## G2-C Caregiver Direct Interaction Bridge

T-006 `ContentSafetyPolicy` 的 `direct_interaction_required` 不等于禁止家庭知情，也
不能降级为普通 `PublishProcess`。它要求 T-005 提供一个独立、versioned、
caregiver-initiated capability。该 capability 不复用
`submit_family_care_question`，因为后者是 family-to-org question、要求
ack/reply，并在业务写入前拒绝健康/用药/紧急输入。

G2-C 的固定边界为：

- initiator 必须是 exact Enrollment/CareGroup 的 current operational
  `caregiver | lead_caregiver`；Institution Admin、同园区关系、ThreadParticipant
  或 T-006 risk result 本身不授权；
- target 必须由 Nurture owner-issued action/option 明确到 exact child/family；
  execute 重新验证 org-to-family Grant、data class、purpose、current relationship、
  source/policy heads 和 contract ref；
- T-006 action 只携带 body-free source/navigation context。T-005 打开空 protected
  composer，不复制内部 observation/media/health source，不让 AI 自动生成待发送正文；
- 首版只接受 caregiver 人工填写的 protected plain text，不接受自动附件搬运；
  事实性事件/健康沟通必须保持非诊断、非处方、非处置建议。紧急情况使用线下紧急
  protocol，Nurture message 不能成为唯一或替代路径；
- G2-C 必须明确自己的 canonical effect、original-scope relation、family-side
  projection/response expectation、logical Receipt、correction/redaction 和
  ActionDelivery invalidation。不得把 G2-A family-authored CareItem 状态机反向套用；
- capability 未冻结进 T-004 exact digest、owner/policy unavailable、contract mismatch
  或 qualification 未通过时，T-006 只显示安全阻塞并保留内部 source。

exact public capability key、typed input/output 与是否创建独立 CareItem/response
obligation 在 Phase 0 冻结；在该决定完成前不得注册 handler、写 migration、启用
T-006 action 或把 T-005 标为 done。

G2-C provider qualification 不以 T-006 整体完成为前置。T-005 使用 exact T-004
digest、owner-issued synthetic consumer fixture 和 provider-side positive/negative
suite 证明 capability 可独立交付；T-006 在 Stage G3-E 再绑定真实 safety-route
consumer 并运行 joint qualification。两份 evidence 使用同一 contract identity，
但各自属于 T-005 与 T-006 handoff，不能相互冒充。

## T-007 D-04 — Institution Admin Business Communication Read

`InstitutionBusinessCommunicationProjectionV1` 是受保护、非 canonical、按请求组合的
owner-read 投影，不是新的 Message、room、thread 或 transcript。它只面向当前
`institution_admin`，并且每次读取必须同时通过：

- 精确 Institution、Enrollment、CareGroup 与 original Grant；
- 该消息的 data class、direction、purpose 和发送前已披露的 Admin 监督范围；
- 当前 Message/CareItem/correction/withdrawal/redaction lifecycle；
- 当前 actor 与 source fact 的可见性策略。

通过后，presenter 可以返回该园区业务沟通的当前正文、附件、作者/方向和变更状态。
Guardian private AI、未发送 composer、My-Chat private chat 与其他 Institution
Enrollment 始终排除。投影不复制受保护正文到 My-Chat 或园区本地共享历史。

该读取不授予任何业务动作。Admin 不能据此 acknowledge、reply、correct、withdraw
或 redact；多角色用户必须显式切换到相应 caregiver/author role，并重新通过该动作
原有 exact authority。后续 AI attention candidate 也只能在同一读取范围内引用来源，
不能自动执行、诊断、归责或评分。

这是对 presenter/owner-read 的 additive、security-sensitive interface change。
G2-B provider 已通过 formal private ingress 实现 exact
`nurture.institution-business-communication-owner-read@1.0.0` / digest、
service-auth no-store carrier、request-time source policy 与完整负向测试；它不进入
shared manifest/surface registry，也不授予 action。独立环境 gate 仍默认 `false`，
只有 T-007 consumer composition/adoption 与 joint qualification 完成后才可启用。

## Authorization

- 发送前与持久化事务内均需校验 authority source。
- 所有业务写入只能经统一 Harness 进入 deterministic command execution；Chat 和看板不得拥有旁路写入。
- 所有跨边界写入和读取绑定精确 Institution Enrollment、原始 Grant、direction、data class 与 purpose。
- family-care Item 的 original Grant 必须允许该闭环所需的
  `family_to_org + org_to_family` directions；reply 不得另找一个 replacement/current
  Grant 来接管旧 Item。
- route/binding 只负责定位，不授予事实读取权限。
- caregiver 访问必须同时满足 actor、role、grant、child scope 与事实可见性策略。
- owner-reread 是持久化与 replay 的强约束，不是可选展示逻辑。
- thread、room、host unread 或 Chat participant 状态均不得参与授权判定。
- caregiver action 只接受 exact CareGroup 的 current `caregiver | lead_caregiver`
  RoleAssignment；Institution Admin 需要另一个 operational caregiver role，不能凭
  Admin 身份代班级回复。

## Presenter Boundary

presenter 可输出：

- 当前 actor-safe message body / structured item / role projection。
- delivery/read/ack 状态。
- correction / withdrawal / redaction 的可解释状态。
- 可执行动作及拒绝原因。

presenter 不得输出：

- 未发送的家庭私密草稿。
- private anchor、repository key、Prisma ID 或 authority 内部快照。
- 另一角色的完整 transcript、room membership、其他 Institution Enrollment 的存在或内容。
- 未通过 T-007 D-04 exact owner-read 的园区业务沟通正文；Admin 投影是逐条业务事实
  的受保护读取，不是对另一角色 transcript 的访问。

## My-Chat Integration

My-Chat 将公共 queries、commands 和 role-safe view-model 分别映射为 Guardian Chat、Caregiver Chat 与相应看板体验。普通 Chat 由 My-Chat 承载；需要 Nurture facts 或动作时通过版本化 Harness contract 调用。My-Chat 不创建共享业务 room，也不把宿主 Chat history 反写为 Nurture canonical 状态。Nurture 不拥有导航、消息总线、推送或设备通知。
