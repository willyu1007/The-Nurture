# Plan — 家庭与照护者对话能力

## Phase 0 — Conversation Contract Discovery

- 已完成 T-002 landed family-care fact/schema/source 盘点，详见
  `06-t002-fact-schema-gap.md`；后续实现以 Prisma/source 为事实，不把 T-002
  implementation-open 设计当成现状。
- 将 T-003 的 guardian/caregiver chat 交互映射为领域状态与命令。
- 将 ordinary chat、Chat-assisted action 与 board-direct action 映射为不同 contract path。
- 对齐 T-004 通用 capability contract，确定 T-005 只扩展哪些 family-care query/action 语义。
- 盘点现有 `NurtureFamilyCareThread` 的必要职责，移除任何共享房间、成员关系或权限语义。
- 标记需要上游 contract pin 或 gate 解锁的部分。
- 采用 T-004 exact `InterfaceContractRefV1`、`CapabilityDescriptorV1`、
  `SurfaceEnvelopeV1` 和 generic invocation/result/error schemas；T-005 只定义
  family-care capability-specific extensions。

## Phase 1 — Entry Paths and Unified Harness

- 定义 family-private AI room 与草稿所有权。
- 定义 ordinary chat 的无副作用边界，以及需要 Nurture facts 时的安全 query path。
- 让 Chat-assisted action 与 board-direct action 收敛到同一 capability/input/confirmation/execution contract。
- 定义通用 envelope + 强类型 capability 的 Harness contract family：`query`、`prepareAction`、`executeAction`、`readResult`。
- 冻结 T-005 V1 capability registry：stable capability key 与独立 SemVer，query、
  Increment 1、Increment 2 author action、internal system action 分组；key 不携带版本
  后缀。
- 将 preview 定义为 `prepareAction` 输出，将 confirmation 定义为 `executeAction` 输入证据；两者共同构成一次 `ActionExecution`，不是临时 Workflow。
- `prepareAction` 分离 My-Chat authenticated trusted context、capability-specific user input 与 Nurture server-resolved authority/route facts。
- prepare 返回 `ready_to_confirm | needs_input | denied | unavailable`；ready 生成语义 preview 与五分钟 opaque `confirmationRef`。
- 不持久化 prepared business draft、正文或 Message；允许一个非业务事实、body-free
  `InteractionContext` 保存 token hash、target/heads、keyed input integrity、expiry
  和 stable command identity。execute 重交 typed input，ref 不包含 raw body/PII。
- capability-specific typed input 只包含业务字段：acknowledge input 为空对象，
  reply input 只含受保护正文；CareItem target 和 expected version 不进入业务 schema。
- prepare 将精确 target、capability-specific concurrency precondition、actor/scope、
  canonical input integrity 与 expiry 绑定进 `confirmationRef`。
- acknowledge 使用精确 acknowledgement head + declared acknowledged convergence；
  reply 使用 replyable lifecycle/authority heads + compatible append，新增合法回复
  不构成 stale。precondition 与 stable command identity 仍分别负责状态安全和
  transport retry/exact replay。
- ref 不延长、不复活、不跨 actor/surface/device/account；对新 effect 单次消费，过期或任何绑定漂移必须重新 prepare。
- My-Chat 生成 per-call invocation identity；Nurture 在 prepare context 中生成并绑定 stable business command identity。
- 对原子 action，在同一 Nurture transaction 内完成 confirmation consumption、current owner/authority reread、effect、receipt 与 CommandExecution。
- `executeAction` 结果使用 `committed | not_committed | outcome_unknown`；success 内继续区分 disposition `executed | replayed` 与 business outcome `applied | already_satisfied`。
- 将 `executionDisposition` 放在调用外壳，将 business outcome、capability-specific
  body-free output、receipt refs 与 invalidation scopes 放在不可变
  `committedResult`；`commandExecutionRef` 是该结果的持久化 authority，不新增平行
  result row/ref。replay 不重新计算历史业务结果。
- acknowledge 输出稳定 CareItem/acknowledgement-event/Receipt refs 与 acknowledged
  状态；班级已确认且其他 fence 仍有效时收敛为 `already_satisfied`，不重复记确认事实。
- reply 输出稳定 reply Message/Event/Receipt refs、`replyOrderKey`、
  `first_response | additional_response` 与 Attention `resolved | unchanged`；
  `CareReplyV1` 是 typed projection，不是第二个 canonical reply table。
- not-committed 结果携带明确 `recovery=none|refresh|reprepare|retry_same_command`；
  current-state hint 只在 current actor 仍有读取权限时返回最小 role-safe 三轴状态。
- confirmation UX 只要求一次结构化、effect-labeled 用户手势；技术 prepare/execute 不等于两个可见步骤。
- submit/reply 在 Chat action card 或 board form 中先显示准确内容、目标和效果，再通过一个 CTA commit；不追加通用确认弹窗。
- acknowledge 使用一次“确认收到” direct gesture；自然语言文本不构成 confirmation。
- 低打扰作为跨 surface 交互原则：成功、already-satisfied、replay 和语义未变的
  transparent reprepare 原位反馈；不显示 Harness/CommandExecution 技术状态，不用
  toast/modal 打断已收敛结果。只有可见语义或安全后果实质变化才强制 rereview。
- 原子写入委托现有 CommandExecution kernel；My-Chat 的 Handoff/Outbox/notification/retry 归入 `ActionDelivery`，不得改变动作分类。
- 第一增量实现 `submit → acknowledge → reply` 三个 `ActionExecution`；不创建 Workflow Run/Step 或通用 Workflow dispatcher。
- CareItem 拆分 acknowledgement、response 与 lifecycle 三轴；第一条 reply 将
  response 置为 responded 并解除待回复 Attention，但不关闭 Item。
- CareItem 由提交时绑定的精确 `Enrollment + CareGroup` 共同承接；`acknowledge`
  记录班级已收到和实际操作者审计，不创建个人 claim/assignment。
- reply 不要求由 acknowledge actor 完成；任一当前属于同一精确 CareGroup 的
  `caregiver | lead_caregiver` 且通过原始 Grant/Enrollment/policy reread 后都可以
  追加一条或多条回复。`institution_admin`、ThreadParticipant 或同园区关系本身不授权。
- 不同 command 的并发 reply 均可成功；每条回复拥有独立 Message/Event/Receipt/
  CommandExecution 与真实操作者审计，班级是家庭侧主要业务发送主体。
- 继续交流必须通过新的 `submit` 创建新 CareItem；可选 `contextContinuationOfItemRef` 仅表达交流上下文，不使用通用 `followUpOf`。
- 将 `submit_family_care_question` 的逻辑 operation input 固定为规范化后的 1–2000 字符受保护纯文本正文与可选 `contextContinuationOfItemRef`。
- 将 owner-issued `targetOptionRef` 保持在 prepare target context；它不是 raw Enrollment ID，也不是 operation input。唯一合法目标可按 policy 确定性绑定。
- 由 Nurture 固定推导 family-care data class、question category、today-attention
  urgency、family-to-org direction、ack/reply 要求、空附件、author、original
  bidirectional Grant、route、safe summary 与 command identity。
- 普通 Chat 只形成意图并打开空的受保护 composer；不自动搬运 Chat 正文，不把 protected body 交给 LLM，不启用 AI protected draft。
- public operation input 中的 `body` 与内部 protected-content write ref 分层：
  client/LLM 不提交 `protected_content_ref`；execute 通过 no-store protected ingress
  在业务 transaction 内加密、持久化并绑定 Message。
- 在写入前拒绝附件、富文本、批量输入、用户自选 category/urgency，以及医疗、用药或紧急事项；不静默改写或改路由。
- 为每次发送固定 Institution Enrollment、原始 Grant、authority source、target scope、idempotency key 和 receipt。

验收：

- 普通聊天、总结和未确认建议不创建 Message、CareItem 或 Receipt。
- Chat 与看板对同一 capability 的 canonical effect 与拒绝结果一致。
- generic envelope 不弱化 capability-specific typed schema、policy、version 和 handler/command binding。
- acknowledge typed input 必须为空，reply typed input 只允许 protected body；
  raw CareItem id/version、Grant、CareGroup 或 actor 字段均被拒绝。
- 两个 reply prepare 面向同一 replyable Item 时可分别提交；另一条兼容回复不使
  confirmation stale。只有 lifecycle/authority/target 等可执行条件变化才拒绝。
- `surface_origin` 不参与 authority 或业务幂等身份。
- Grant、role、policy、data class/direction/purpose、内部 target/route fields 不接受客户端或 LLM 填写。
- 多 Enrollment 返回 safe `needs_input` choices；只有一个当前 eligible target 时才允许 capability policy 定义的确定性默认。
- prepare 结果和 token 均不是 canonical business fact，不支持跨设备/跨 surface 恢复。
- body-free InteractionContext 是 confirmation protocol state，不是 prepared business
  draft；它不得被 timeline/presenter 当成待发送 Message。
- same command identity + same canonical payload 必须 exact replay；payload drift 必须 idempotency conflict。
- deterministic invalid/denied/stale/conflict 不提交；明确 no-commit 的技术失败可在 TTL 内以原 identity 重试；outcome unknown 禁止替代命令。
- committed 只代表 Nurture 业务事务，不代表 Host/provider delivery、device read 或 Nurture acknowledge。
- 仅目标不唯一或可见内容/目标/effect 漂移时增加用户步骤；token 单纯过期且可见语义完全不变时允许在同一提交手势内透明 reprepare。
- 若 transparent reprepare 发现任何可见变化，必须中止 execute、重新展示并等待新的结构化手势。
- 未确认、过期授权和 target 改变均不发送。
- 多 Enrollment 时不得由 LLM 静默选择目标，也不得向其他机构生成投影。
- 重试不产生重复消息或重复事项。
- 上下文续接只允许引用同一 ChildCareProcess、同一 Enrollment、当前可读且
  response 已 `responded` 的源 Item；关系不继承 Grant、authority、owner、SLA、
  状态或幂等身份。
- 新续接 Item 从 current eligibility 选择 Grant，并将其固化为自己的 original
  Grant，同时使用新的 business command identity；源 Item 后续不可读时隐藏关系，
  但不改变新 Item 的可用性。
- operation input 不接受 raw Participant/Child/Enrollment/CareGroup/Grant refs、safe summary、分类、route、receipt 或 command identity。
- 正文规范化只允许 trim 与换行等机械规范化；用户确认前展示的 exact normalized text 必须与 protected content effect 一致，不做 LLM 语义改写。
- 目标 option ref 只能来自当前 prepare 的 actor-safe choices，且必须在 execute 时重新解析并验证 current authority。
- 非支持内容在 prepare 阶段返回明确的 unavailable/alternate-process 结果，且医疗表达保持非诊断、非处方、非紧急替代。

## Phase 2 — Canonical Facts and Role Projections

- 定义 capability execution 产生的 canonical message、structured care item、event、receipt 与媒体引用；不是所有 Chat turn 都产生这些事实。
- 迁移 CareItem 到 acknowledgement/response/lifecycle 三轴和独立 heads；旧
  `status`、`assignedToRoleAssignmentId`、`linkedReplyMessageId` 仅作 legacy row
  迁移，不参与新 action authority。
- caregiver reply 继续使用 canonical Message + ItemEvent + Receipt；不创建重复
  `CareReply` table。增加可稳定重建的 `replyOrderKey` 和 typed author/role audit。
- 增加 typed original Enrollment/CareGroup/Grant complete-graph constraint、
  context-continuation relation、InteractionContext dependencies、immutable
  committed-result payload 和 cascade audit。
- 将 submit/confirmation 和第二增量变更动作分别落到
  `08-increment-1-submit-ux-contract.md` 与
  `07-increment-2-change-contract.md`，实现与 qualification 必须引用其 normative
  input/output/effect。
- 将 capability registry、guardian timeline、caregiver work 与 role-specific detail
  output 固定在 `09-capability-query-contract.md`，复用 T-004 generic query
  envelope/cursor。
- 将 `contextContinuationOfItemRef` 作为 body-free、role-safe 的可选显示/总结关系；不把它解释为业务前驱、执行触发器或授权证据。
- 从同一照护事项生成 guardian timeline projection 与 caregiver work projection，不创建共享聊天室或共享 transcript。
- 若保留 Enrollment-private thread，仅用于路由、索引和历史组织；它不是产品身份、room membership 或授权事实。
- 支持 delivery、read、acknowledge 的可查询状态。
- presenter 输出适合 Guardian Chat、Caregiver Chat 及对应看板消费的稳定 role-safe view-model。
- 真正的事项 successor/dependency、跨事项触发与 SLA 继承后续以 `CareItemDependency` 独立设计，不进入 Increment 1，也不占用 Workflow 术语。

## Phase 3 — Correction and Revocation

- 作为第二增量，在 submit/acknowledge/reply 原子闭环 checkpoint 之后开始。
- `correct_family_care_message` 只允许确切 Message 作者追加 1–2000 字符受保护纯文本
  correction version；原文和历史版本不可变，presenter 默认展示最新有效解释并允许
  展开历史。
- correction 使用严格 correction-head precondition；并发 correction 不自动合并。
  同班其他老师可以追加新的班级 reply，但不能修改或更正同事的作者事实。
- 家长问题只在 response 为 `awaiting_reply` 时允许同 Item correction；responded
  后的新增/修正请求必须创建新 Item，并可使用 context continuation。
- `withdraw_family_care_request` 只允许确切家长问题作者关闭 CareItem 为
  `closed(family_withdrawn)`，解除 active Attention 并阻止后续 ack/reply；问题、
  已有回复、Receipt 和 delivery/read 历史保持可见且可审计。
- caregiver reply 不提供 withdrawal；Grant revoke 是独立授权管理动作，也不复用
  withdrawal 的产品文案或领域状态。
- `redact_family_care_message` 只允许 exact sender Participant 在 current same-side
  relationship 仍可达时，通过一次显式、effect-labeled 手势不可逆移除正文/附件及其
  correction versions；Message tombstone、Receipt、Event、Execution 与 server-owned
  redaction reason 保留。
- author redaction typed input 为空，不接受客户端 reason。历史 sender
  RoleAssignment 只作审计，不要求同一 role row 仍 current；policy/safety/admin
  redaction 使用独立 system capability。
- source question redaction 原子抑制依赖 Item 与 active Attention、阻止未来
  acknowledge/reply；已有 caregiver replies 作为独立作者事实保留。
- reply redaction 只影响该 reply/correction chain 与对应 Receipt；原问题、其他
  replies 和 Item appendability 保持，不自动把 response 改回 awaiting 或重开原
  Attention。班级仍可追加 replacement reply。
- correction 是新的跨边界内容并产生独立 Receipt/ActionDelivery。withdrawal/
  redaction 使尚未 materialize/send 的相关通知候选跳过；已发 push 不声明召回，
  deep-link open 必须 owner-reread 当前状态。
- 三个 capability 均复用 prepare/execute、CommandExecution、immutable result、
  exact replay 与低打扰原位反馈，不创建 Workflow Run/Step。
- 对 author authority、授权撤销、跨机构隔离、并发 head、cascade、response loss、
  notification invalidation 和 replay 建立测试。

## T-007 D-04 — Institution Admin Read-only Projection Addendum

- 在 T-005 presenter family 中新增
  `InstitutionBusinessCommunicationProjectionV1`，它是非 canonical、按请求组合的
  owner-read 结果，不是 Message 副本、共享 room 或共享 transcript。
- 每次读取都重新验证 current `institution_admin`、精确 Institution / Enrollment /
  CareGroup、original Grant、data class、direction、purpose、发送前监督披露与源
  Message/CareItem lifecycle；opaque ref、同园区关系或 Admin 标签本身不授权。
- 允许投影当前可见的园区业务沟通正文、附件、作者/方向、correction、
  withdrawal/redaction tombstone 与当前状态；不允许 Guardian private AI、未发送
  composer、My-Chat private chat 或其他 Institution Enrollment。
- Admin projection 只读。acknowledge/reply 仍要求 exact CareGroup current
  `caregiver | lead_caregiver`；correction/withdrawal/redaction 仍使用各自
  exact-author 或独立 system-policy capability。
- 后续 `InstitutionAttentionCandidate` 只能在同一 owner-read 范围内引用原始材料并
  突出可能需要介入的事项；不自动执行、诊断、归责或评分，也不属于当前增量。
- 当前 manifest/module/source 尚无该 protected presenter 接口；在新版本 interface、
  digest、carrier、owner-read 与负向测试齐备前保持 default-off。

## Increment 1 Checkpoint

- `submit → acknowledge → reply` 三个 action 全部使用同一 Harness/CommandExecution contract。
- 验证 acknowledge actor 只进入审计，不进入 reply authority；同班其他当前合格照护者可回复。
- 验证跨 CareGroup、过期角色、非照护者和园区管理员不能利用“园区/同角色”获得回复权限。
- 验证两名同班照护者并发 reply 时两条独立 command 均提交，并按 immutable
  `replyOrderKey` 排序；同一 command retry 只 exact replay 一条回复。
- 第一条 reply 解除待回复 Attention，后续回复不重复完成 Attention；CareItem
  保持 active/appendable，Increment 1 不增加显式 close action。
- 家长继续提问仍创建新 Item；老师对原 Item 的多条补充回复不构成跨角色聊天室，
  且上下文关系不影响授权、状态或 `CareItemDependency`。
- happy path、duplicate click、concurrent execute、response loss、stale Grant/version 与 outcome-unknown safety 通过。
- correction/withdrawal/redaction 仍明确显示为第二增量未实现，不宣称 T-005 final exit。

## Phase 4 — Black-box Qualification

- 使用 T-004 fixture 跑 guardian projection → caregiver work projection → guardian receipt/reply projection 闭环。
- 验证家庭私域泄漏、越权 child scope、重复发送和旧 pin 失败。
- 验证 ordinary chat 无副作用，以及 Chat/board 相同 capability 的等价业务结果。
- 验证 Query lane 不产生 CommandExecution，原子 Action lane exact retry 复用既有 execution/replay 语义。
- 验证 prepare 四分支、五分钟 TTL、单次新 effect、input integrity mismatch、
  target/authority/head drift 与跨主体/跨 surface 拒绝。
- 验证 prepare/expire/reprepare 全程不产生 prepared-draft 业务记录或受保护正文副本。
- 验证 executed/replayed 与 applied/already-satisfied 正交组合，且 committed 不冒充 delivery/read/ack。
- 验证 replay 仅改变调用外壳判定，`committedResult` 的 output/receipt refs
  保持稳定；当前回复数量与 delivery 状态只能通过 `readResult` 获取。
- 验证 `commandExecutionRef` 与 persisted result schema/payload 是唯一 committed-result
  authority，不出现第二个 result row/ref 或 replay-time result recomputation。
- 验证并发 acknowledge 收敛为 already-satisfied 且不重复 event/个人归属；并发
  reply 按独立 command 全部 applied，并正确区分 first/additional response。
- 验证 stale current-state 的 role-safe disclosure fence，以及 authority loss 下的
  generic denied/no-current-state。
- 验证 response loss exact replay、payload drift conflict、concurrent winner、retryable no-commit 与 outcome-unknown quarantine。
- 验证 Chat card/board form 的单 CTA commit、ack direct gesture、无通用二次弹窗和自然语言确认拒绝。
- 验证 success/already-satisfied/replay 使用原位低打扰反馈，只有实质可见变化或
  安全边界变化才中断并要求 refresh/reprepare/rereview。
- 验证 token expiry unchanged-view transparent reprepare 与 changed-view forced rereview。
- 验证同一 active/appendable Item 可接收多个独立 reply、新 Item 从 current
  eligibility 选择并固化自己的 original Grant/新 command identity，以及上下文续接
  关系不产生 authority/state/SLA/dependency 继承。
- 验证 reply Message/Event/Receipt 的 `replyOrderKey` 在并发、response loss 和 exact
  replay 下稳定，且不依赖 whole-Item version CAS 或 mutable reply counter。
- 验证源 Item 不再可读时 presenter 隐藏关联，但新 Item 仍按自身权限正常读取和执行。
- 验证纯文本 1–2000 字符边界、trim/换行规范化、空白正文、超长正文、富文本与附件拒绝。
- 验证 target option ref 与 operation input 分离，raw Enrollment/Grant/internal route fields 被拒绝。
- 验证 client/LLM-supplied `protected_content_ref` 被拒绝；protected ingress 在 execute
  transaction 内生成 internal content binding，prepare 仅保存 keyed integrity tag。
- 验证 ordinary Chat 到 protected composer 只传递 intent，不复制正文或调用 protected-body LLM。
- 验证固定 server-derived classification/ack/reply/empty-attachment 语义与 body-free safe summary。
- 验证医疗、用药与紧急内容在写入前安全失败且不产生业务事实。
- 验证 ActionExecution、ActionDelivery 与 InstitutionWorkflow 不被错误混用；family-care action 不创建产品 Workflow Run/Step。
- 验证 legacy `capture_family_input`/claimed-Step、ThreadParticipant、
  institution-admin-only role、single reply slot 和 raw command DTO 均不能进入新
  T-005 activation path。
- 验证 capability registry 的 exact key/version、user/system discovery boundary、
  typed input/output refs 与 T-004 contract digest 双向一致。
- 验证不存在共享 room membership、共享 transcript 或 My-Chat Chat-history authority。
- 验证 correction append-only history、exact-author boundary、correction-head race 与
  responded-family-question new-Item rule。
- 验证 withdrawal 只关闭家庭 CareItem 工作、保留内容/Receipt/历史、阻止未来动作，
  且 caregiver reply 与 Grant revoke 不暴露同名 capability。
- 验证 source/reply redaction 的不同 cascade、correction-chain erasure、tombstone、
  exact-author/system-policy separation 与 reply-redaction no-reopen。
- 验证 correction 新 Receipt/ActionDelivery、withdrawal/redaction pending candidate
  invalidation，以及已发 push open 时 current owner-reread。
- 固化 consumer adoption 示例与 contract evidence。

## Exit Gate

所有正向与负向旅程通过；T-002 仍未满足的部署/流量门禁不得被本任务结果替代。
