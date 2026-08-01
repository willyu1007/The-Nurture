# Implementation Notes — 家庭与照护者对话能力

## 2026-07-29 — Task package created

- 创建 T-005 规划包。
- 将 Guardian Chat 与 Caregiver Chat 合并为一个共享通信领域任务，避免两个 surface 各自复制事实和状态机。
- 当时以“家庭 AI 私域与 family-care shared thread 是两个不同边界”描述组织方式；其中 shared thread 的产品含义已被后续决策取代。
- 当前无代码或数据模型变更。

## 2026-07-29 — No shared cross-role chat; dual projections locked

- 用户确认不需要跨角色聊天室，采用“同一 Nurture `CareInteraction` 生成 guardian/caregiver 两套角色投影”的方案。
- Guardian Chat 保持 family-private、child-centered 总结与反馈；Caregiver Chat 只呈现其当前有权处理的事项、acknowledge/reply 与 receipt/correction 状态。
- 跨边界闭环由 Nurture-owned Message、CareItem、Event、Receipt、Correction/Withdrawal/Redaction 连接，不依赖共享 transcript、room membership 或直接角色 DM。
- My-Chat Chat history 不是 Nurture canonical store；caregiver 受保护正文继续使用 opaque ref + transient owner-reread，不写入宿主 Chat history。
- 所有跨边界事实绑定精确 Institution Enrollment 与原始 Grant，多机构之间不共享 room、列表或可推断关系。
- 现有 `NurtureFamilyCareThread` 如继续存在，只能承担 Enrollment-private 的路由/索引/历史技术职责；其产品组织粒度仍待下一项顶层讨论。
- 已同步 F-003 requirement/roadmap；当前仍为规划落稿，无代码或数据模型变更。

## 2026-07-29 — Three interaction paths and unified Harness locked

- 用户要求明确区分 ordinary chat、Chat-assisted action 与 board-direct action。
- ordinary chat 默认无业务副作用；需要 Nurture facts 时只调用当前授权的安全 query，不创建 CareItem/Message/Receipt。
- Chat-assisted action 可以使用 LLM 形成 capability/input 候选，但必须调用与看板相同的 Nurture Capability Harness，并经过确定性目标解析、preview、confirmation 和 execution。
- board-direct action 通过结构化 UI 直接给出 capability/input，可以跳过语义选择，但不能绕过 Harness 的 authority、confirmation、idempotency、execution 和 result/receipt。
- CareItem-first 只适用于确认后的跨边界照护事项，不是整个 Chat 的顶层模型；Chat/board 是入口，Harness 是统一业务边界，CareItem 是特定 capability 的领域结果。
- T-004 拥有通用 capability identity/invocation contract；T-005 拥有 family-care capability 语义与领域 effects。精确 Harness 阶段和 query/action contract 留作下一项讨论。
- 已同步 F-003 requirement/roadmap；当前仍为规划落稿，无代码或数据模型变更。

## 2026-07-29 — Harness contract family and runtime reuse locked [partially superseded]

- 用户确认采用一个通用 envelope + capability-specific typed schemas 的 Harness contract family，而不是 Chat/board 各自 API 或任意 JSON command。
- Harness 分为 Query lane（`query`、`readResult`）和 Action lane（`prepareAction`、`executeAction`）。
- Query lane 无业务副作用，不产生 `CommandExecution`；Action lane 的未确认 prepare 也不创建 Message、CareItem 或 Receipt。
- preview 是 prepare 的输出；confirmation 是用户通过 My-Chat UI 提交给 execute 的显式证据，不新增 durable process。
- `surface_origin` 只用于 presenter、审计与观测，不参与 authority、canonical effect 或 replay identity。
- 原子 action 复用现有 CommandExecution kernel；当时将多步骤、异步、跨 owner/handoff
  泛化为 Workflow 的表述，已被后续产品术语决策 supersede。
- T-004 拥有通用 invocation/compatibility contract，T-005 拥有 family-care typed capability specs 与领域 effects。
- 下一项讨论聚焦 `prepareAction` 的 trusted context、typed input、输出 union、`confirmationRef` 和 TTL；当前仍为规划落稿，无代码或数据模型变更。

## 2026-07-29 — PrepareAction ephemeral confirmation locked

- 用户当时确认 prepare 不持久化 prepared business draft，execute 在同一 surface
  重新提交 typed input 并校验 canonical input integrity；本轮审阅进一步固定：
  protected low-entropy body 使用 secret-keyed tag，允许 body-free protocol
  `InteractionContext`，但不允许 bare hash 或正文副本。
- prepare 不承担 capability discovery；它接收 exact capability/version，并分离 My-Chat authenticated trusted context、capability-specific user input 与 Nurture server-resolved authority/route facts。
- Grant、role、policy、data class/direction/purpose、expected heads 和内部 route fields 均不得由客户端或 LLM 填写。
- 输出锁定为 `ready_to_confirm | needs_input | denied | unavailable`；ready 返回 canonical semantic preview、safe target/effect/warning、opaque `confirmationRef` 与 expiry。
- `confirmationRef` TTL 为五分钟，不延长、不原地复活、不跨 actor/account/device/surface，对新 effect 单次使用；过期或 input/target/authority/version 漂移均重新 prepare。
- ref 不包含 raw body/PII，不是 object-access 或 authorization grant；Chat 可以额外绑定 hashed host conversation。
- prepare/expire/reprepare 不创建 Message、CareItem、Receipt、CommandExecution、ActionDelivery/PublicDraft 或正文副本。
- 成功 execute 后的响应丢失由相同 command request 的 CommandExecution exact replay 恢复，不通过第二次新 effect 消费。
- 该方案复用 T-002 已锁定的五分钟 `submit_action` context 与现有 CommandExecution 机制；当前仍为规划落稿，无代码或数据模型变更。

## 2026-07-29 — ExecuteAction correctness spine and per-action atomic MVP locked

- 用户确认保留完整正确性骨架，但第一增量缩小为 `submit → acknowledge → reply`
  三个各自原子的动作；后续 G2 决策明确整个多人闭环不是一个跨步骤事务或
  Workflow。
- My-Chat 拥有 per-call invocation identity；Nurture prepare 生成并绑定 stable business command identity，My-Chat/LLM 不自行拼接。
- 对原子 action，confirmation consumption、canonical input match、current authority/version reread、effect/receipt 与 CommandExecution 共享一个 Nurture transaction。
- same command identity + exact payload 返回 exact replay；payload drift 返回 idempotency conflict，并发只有一个 effect winner。
- execute 顶层结果锁定为 `committed | not_committed | outcome_unknown`；committed 内分别表达 `executed | replayed` 与 `applied | already_satisfied`。
- deterministic denial/stale/conflict 不提交；明确 no-commit 的 technical error 在 TTL 内重试；outcome unknown 必须用原 identity status/reconcile，禁止替代 command。
- committed 不表示 Host/provider delivery、device read 或 Nurture acknowledge；当前角色展示通过 `readResult` owner-reread。
- correction/redaction/当时尚未拆分的 post-send 撤回语义后移到第二增量；当前已由后续
  决策固定为 correction/withdrawal/redaction，Grant revoke 保持独立授权动作。
- 当前仍为规划落稿，无代码或数据模型变更。

## 2026-07-29 — Single-gesture confirmation UX locked

- 用户确认技术上的 prepare/execute 不应增加可见心智和操作链路；每个 business effect 默认只需要一次结构化、effect-labeled 用户手势。
- submit/reply 采用 reviewable commit：Chat action card 或 board form/composer 先展示准确内容、目标与效果，一个 CTA 提交，不增加通用二次确认弹窗。
- acknowledge 采用 direct commit：一次“确认收到”手势；仍复用相同 Harness、owner-reread 和 CommandExecution。
- 普通自然语言不能由 LLM 单独解释为 confirmation，最终 effect 必须来自绑定 exact confirmation context 的结构化 UI gesture。
- 多 Enrollment/字段歧义才要求额外选择；content/target/effect/可见后果漂移才要求重新审阅。
- 旧 token 不延长或复活；仅当 fresh prepare 与用户当前看到的 canonical 语义完全一致时，允许在同一 CTA 手势内透明 reprepare + execute。
- 下一项讨论 CareItem 在 reply 后 terminal 还是允许同一 Item 多轮 follow-up；当前仍为规划落稿，无代码或数据模型变更。

## 2026-07-29 — Terminal Item and context-only continuation locked

- 用户指出 `followUpOf` 无法区分交流上下文续接与事项 successor/dependency；决定不采用通用 `followUpOfItemRef`。
- [HISTORICAL — SUPERSEDED BY CAREGROUP MULTI-REPLY] Increment 1 曾固定为
  `open → acknowledged → replied` 且 replied terminal；当前已改为正交状态与
  append-only CareReply collection。
- 继续交流创建新的 Item，并可选使用 `contextContinuationOfItemRef` 指向同一 ChildCareProcess、同一 Enrollment、当前可读且已 replied 的源 Item。
- 该关系只用于 role-safe 展示和总结，不授予事实读取权限，不继承 Grant、authority、owner、SLA、状态、confirmation 或 command identity。
- 新 Item 必须使用当前 Grant 与新的 Nurture business command identity；若源 Item 后续不可读，只隐藏上下文关系，不使新 Item 失效。
- 真正的事项 successor/dependency/trigger 后续使用 `CareItemDependency` 独立模型，不进入 Increment 1。
- 下一项讨论 Increment 1 `submit` 的最小 typed input 与 Nurture server-derived fields；当前仍为规划落稿，无代码或数据模型变更。

## 2026-07-29 — Minimal protected submit input locked

- 用户确认快速交付版本只开放一个 `submit_family_care_question` 输入类型。
- 逻辑 operation input 只包含规范化后 1–2000 字符受保护纯文本正文和可选 `contextContinuationOfItemRef`。
- 多 Enrollment 目标选择使用 Nurture owner-issued `targetOptionRef`，保留在 prepare target context，不混入 operation input，也不接受 raw Enrollment/CareGroup ID。
- Nurture 固定推导 `family_care_question`、`question`、`today_attention`、`family_to_org`、requires-ack/reply、空附件，以及 author、Grant、route、body-free safe summary、expected heads 与 command identity。
- 普通 Chat 只形成 intent 并打开空的 protected composer；不复制 Chat 正文，不将 protected body 提交给 LLM，不在第一增量启用 AI protected draft。
- 正文只进行 trim/换行等机械规范化，用户提交前看到的 exact normalized text 与最终 protected content effect 一致。
- 附件、富文本、批量、用户自选 category/urgency/route，以及医疗、用药或紧急事项在业务写入前明确失败，不静默改写或降级。
- 该范围与 T-002 当前 Pilot protected-interaction 的 1–2000 字符纯文本、无附件基线一致；当前仍为规划落稿，无代码或数据模型变更。
- 下一项原计划对齐 claimed Workflow Step；该方向已被后续产品术语决策撤回。

## 2026-07-29 — Workflow semantics narrowed to institution management

- 用户明确 Workflow 在当前阶段只对应园区管理业务过程；异步、跨 owner、worker、
  Handoff 或通知不是 Workflow 分类条件。
- family-care Message/CareItem/Event/Receipt 闭环统一称为 `CareInteraction`。
- `submit`、`acknowledge`、`reply` 统一称为 `ActionExecution`，复用 Nurture
  CommandExecution；My-Chat Handoff/Outbox/notification/reconcile 称为
  `ActionDelivery`。
- `contextContinuationOfItemRef` 仍只表达交流上下文；未来事项依赖使用
  `CareItemDependency`，不再建议 `WorkflowDependency`。
- 当前 T-002 claimed-Step / `workflow_step_complete_v1` 路径被标记为 legacy
  compatibility seam，保持 default-off；不能作为 T-005 activation 或新增契约依据。
- 当前只更新文档语义，无代码、manifest、schema 或数据库变更。

## 2026-07-29 — CareGroup shared responsibility replaces exclusive claimant

- 用户指出实际照护更多以班级为单位，确认收到后独占绑定某位照护者与真实工作方式不符。
- Increment 1 固定为精确 `Enrollment + CareGroup` 共同承接；acknowledge actor 只用于
  审计，不形成 assignment 或 reply authority。
- [PARTIALLY SUPERSEDED BY MULTI-REPLY] reply 可由同一精确 CareGroup 内任一当前
  合格照护者提交；原始 Grant/Enrollment、当前角色和 policy reread 继续有效，
  “expected version 保证单一回复”不再有效。
- 家庭 acknowledgement projection 默认表达“班级已确认收到”；reply Message
  仍保留真实个人作者，不使用班级/系统伪造作者身份。
- T-002 中 same-claimant reply、terminal claimant staffing-blocked 与 no-takeover
  规则在产品层被 supersede；相关 schema/source/qualification 仍待单独修订，
  在此之前不得据旧证据激活。
- 当前只更新文档语义，无代码、manifest、schema 或数据库变更。

## Open Items

- T-004 exact contract artifact/digest 的最终 pin，以及 T-005 family-care schema refs
  在该 artifact set 中的落点。
- `06-t002-fact-schema-gap.md` 已完成 landed fact/schema/source 盘点；其 schema
  migration、legacy-row preflight 和 dual-read/rollback 方案仍待实施任务冻结。
- T-002 legacy claimed-Step seam 迁移到 `ActionExecution` / `ActionDelivery` 的独立上游契约任务；不阻塞 synthetic contract 规划，但阻塞真实 activation。
- 独立 `CareItemDependency` 模型的精确字段与语义；不阻塞 Increment 1。
- 撤回与 redaction 对已推送通知的宿主侧表现，需要在 My-Chat companion 中验证。
- AI 生成内容的 provenance 和人工确认字段最终命名。

## 2026-07-29 — Prepare-time version precondition locked

- 用户确认 capability-specific business input 与并发/幂等 metadata 分离。
- `AcknowledgeFamilyCareItemInputV1` 是空对象；`ReplyFamilyCareItemInputV1`
  只包含 1–2000 字符受保护纯文本正文。
- CareItem target 与 expected version 属于 generic prepare context，不接受客户端或
  LLM 自报；prepare 把精确 target/version、actor/scope、input hash 和 expiry
  绑定到 `confirmationRef`。
- execute 比较冻结版本，不能自动采用最新版本。version mismatch 返回 stale/current
  state；stable CommandExecution identity 独立负责 retry/replay。
- 当前不增加第二个重复携带 version 的 action token；无代码、schema、manifest
  或数据库变更。

## 2026-07-29 — CareGroup multi-reply append model locked

- 用户进一步明确班级是家庭事项的业务主体，班级内老师都代表班级执行；回复不应有
  单一 winner，同一 CareItem 允许多个老师追加多条回复。
- 本决策 supersede 先前“expected version 保证单一回复”“replied terminal”
  “第二条 reply stale”以及 reply 严格绑定整个 Item version 的部分。
- CareItem 拆分 acknowledgement、response 与 lifecycle 三轴。第一条 reply 将
  response 置为 responded 并解除待回复 Attention，但 Item 保持 active/appendable；
  后续 reply 不重复完成 Attention。
- canonical reply Message 成为追加式集合；`CareReplyV1` 是 Message/Event/Receipt
  的 typed projection。不同 command identity 的并发回复都可
  `committed + applied`；同一 identity 的 retry 才 exact replay。immutable
  `replyOrderKey` 决定稳定展示顺序。
- reply confirmation 绑定 replyable lifecycle、原始 Grant/Enrollment/CareGroup、
  当前 role/policy/retention heads；兼容的新 reply 不使其 stale。acknowledge 使用
  exact acknowledgement head，并只对 declared acknowledged postcondition 收敛。
- 家庭侧主要业务发送主体为 CareGroup；真实 Participant/RoleAssignment 作为内部
  审计与可选次级署名保留。Increment 1 不增加显式 close action。
- 家长继续提问仍创建新 Item；老师对原 Item 的多条补充回复不建立共享聊天室。
- 当前只更新规划文档，无代码、schema、manifest 或数据库变更。

## 2026-07-29 — Increment 1 result contract and low-interruption UX locked

- 用户确认 `acknowledge` / `reply` 的 committed output、stale/current-state 与 replay
  result schema，并补充交互原则应保持低打扰。
- 结果采用“调用判定外壳 + 不可变 committedResult + 可选 role-safe current-state
  hint”。outer `executionDisposition` 可以从 executed 变为 replayed；内部稳定
  `commandExecutionRef`、output/receipt refs 与 business outcome 不重新计算。
- mutable reply count、最新 CareItem projection、authority、delivery/notification/
  read 状态不进入 committedResult，统一通过 `readResult` owner-reread。
- acknowledge 是可收敛状态动作：另一老师已完成班级确认且其他 fence 仍有效时返回
  `executed + already_satisfied`，不创建重复 event，不伪造当前 actor 为首次确认者。
- reply 是追加内容动作：不同 command 均为 applied；第一条返回
  `first_response + attention resolved`，后续返回
  `additional_response + attention unchanged`。同一 command retry 才 replay 同一
  reply Message/Event/Receipt/`replyOrderKey`。
- stale current-state 只在当前 actor 仍有读取权限时返回最小三轴状态与 action
  availability；authority/association loss 使用 generic denied，禁止状态泄漏。
- 成功、already-satisfied、replay 与语义不变的 transparent reprepare 均原位反馈，
  不增加通用弹窗或技术提示。仅可见语义、安全后果或可执行状态实质变化时中断。
- Increment 1 的产品结果契约已收口；下一步是盘点 T-002 事实差距，并继续讨论第二
  增量 correction/withdrawal/redaction。
- 当前只更新规划文档，无代码、schema、manifest 或数据库变更。

## 2026-07-29 — Increment 2 correction/withdrawal/redaction semantics locked

- 用户确认三类动作不得合并为通用删除：correction 改变有效解释，withdrawal 停止
  CareItem 工作，redaction 不可逆移除 Message 可见内容。
- correction/redaction 都是 exact-author 内容权限。班级拥有追加 reply 权限，但一位
  老师不能修改、标记更正或删除另一位老师的具体作者文字；其替代路径是追加新 reply。
- correction 追加不可变 version，使用 strict correction-head concurrency；家长问题
  仅在 awaiting-reply 阶段允许同 Item 更正，responded 后创建续接新 Item。
- withdrawal 只开放给 family source author，目标为 CareItem，提交后
  `closed(family_withdrawn)`、解除 Attention、阻止未来动作，但保留全部内容和回执。
  caregiver reply 与 Grant revoke 不使用该 capability。
- author redaction 需要一次不可逆显式确认；policy/safety/admin redaction 使用独立
  system capability/reason。redaction 保留 tombstone/audit，不使用 deleted 或物理删除。
- source question redaction suppress Item/active Attention 并阻止动作；独立 caregiver
  replies 不自动删除。reply redaction 仅清理该 reply/correction chain，不重开原
  waiting Attention，CareItem 仍可追加 replacement reply。
- correction 产生新 Receipt/ActionDelivery。withdrawal/redaction 使 pending
  notification candidate 失效；已发 push 不能召回，open 必须 owner-reread 当前状态。
- 低打扰继续有效：三种结果原位更新；withdrawal/redaction 使用清楚的一次 effect
  confirmation，不追加通用双重弹窗。
- 本决策复用 T-002 的 append-only audit、exact-author redaction、tombstone 和原子
  cascade 原则，但 supersede 旧的 unique/terminal reply 与 no-second-reply 假设。
- 下一步盘点现有 schema 与本契约的 correction version、CareItem withdrawal、
  multi-reply redaction cascade 及 notification companion 差距。
- 当前只更新文档；无代码、manifest、schema 或数据库变更。

## 2026-07-29 — T-002 gap inventory and full T-004/T-005 contract review

- 以 Prisma SSOT、family-care command/query source、manifest/module/API registry 为
  landed evidence，完成 `06-t002-fact-schema-gap.md`；T-002 设计目标与已实现事实分开标注。
- 确认可复用：Enrollment/CareGroup/Grant、Message、Receipt、Event、Attention、
  InteractionContext/CommandExecution 概念和同事务 effect/receipt/execution 骨架。
- 确认必须替换语义：single-status CareItem、personal assignment、single linked
  reply、ThreadParticipant authorization、institution-admin-as-caregiver、raw command
  DTO、whole-Item reply CAS 和 terminal reply。
- 确认必须新增：三轴 Item/heads、typed continuation、protected ingress、
  correction fact、family withdrawal、typed committed-result payload、context
  dependencies、reply order 与 loop-to-closure cascade audit。
- 修复 prepare 文案歧义：不持久化的是 business draft/body/effect；允许保存 body-free
  short-lived InteractionContext。受保护正文使用 keyed integrity tag，不保存 bare hash。
- `commandExecutionRef` 被固定为 immutable result authority；移除平行 `resultRef`
  概念，typed body-free result payload/version 必须随 Execution 持久化。
- caregiver reply 的 canonical fact 固定为 Message + ItemEvent + Receipt；
  `CareReplyV1` 仅为 typed projection。顺序改为 immutable `replyOrderKey`，不引入
  mutable reply counter/whole-Item CAS。
- caregiver authority 明确为 exact CareGroup 的 current
  `caregiver | lead_caregiver`；Institution Admin、ThreadParticipant 或同园区本身不授权。
- exact author 明确为 sender Participant + current same-side relationship；历史
  RoleAssignment 保留审计但不要求同一 row 仍 current。author redaction input 为空，
  system redaction 使用独立 capability/reason。
- capability identity 固定为 stable key + 独立 SemVer；补齐 submit 与第二增量
  committed output，并把过长架构拆为第一增量 submit/UX、第二增量 change 两个
  normative contract；capability registry/query outputs 也独立成可直接生成 schema
  的合同。主架构保持跨增量不变量和引用。
- 当前仅修改任务合同和差距清单，无应用代码、manifest、schema 或数据库变更。

## 2026-07-30 — T-007 D-04 Institution Admin owner-read addendum

- 新增规划中的 `InstitutionBusinessCommunicationProjectionV1`：它按请求从当前
  Nurture-owned Message/CareItem/变更事实组合，不建立新的 canonical 数据或共享
  transcript。
- Admin 读取被限定为发送前已披露监督的园区业务沟通，并逐请求校验 current
  `institution_admin`、精确 Institution / Enrollment / CareGroup、original Grant、
  data class、direction、purpose 和 source lifecycle。
- 当前正文、附件、correction/withdrawal/redaction 状态可在上述边界内投影；家庭
  私密 AI、未发送草稿、My-Chat private chat 与其他 Enrollment 明确排除。
- read 与 action authority 明确分离。Admin-only 不获得 acknowledge/reply 或作者
  变更能力；多角色 actor 必须切换角色并通过原 action policy。
- 后续 AI 仅可在同一 owner-read 范围内生成带来源的 attention candidate，不自动
  action、诊断、归责或评分。
- 当前 manifest/module/source 未声明或实现此 protected interface，因此保持
  default-off；本次仅同步 T-004/T-005/T-007 与 context contracts。

## 2026-07-30 — Stage G2 structure and cross-task reinforcements accepted

- 用户确认 Stage G2 继续复用 T-005，不创建新任务；结构固定为 G2-A Core
  CareInteraction Loop、G2-B Lifecycle and Owner-read Completion、G2-C Caregiver
  Direct Interaction Bridge 和一个最终 Nurture-side qualified handoff。
- “Atomic Loop”表述被纠正：submit/acknowledge/reply 的每个 ActionExecution 各自
  transaction-atomic，整个多人闭环不是长事务、saga 或 Workflow。
- G2-A 是中间 checkpoint；correction/withdrawal/redaction、Admin owner-read 和
  dedicated caregiver direct interaction 未完成前，T-005 不得转为 done。
- 跨任务审计发现 T-006 已把 `direct_interaction_required` 路由绑定到一个尚不存在的
  T-005 caregiver-initiated capability。G2-C 现被纳入 T-005 final Exit：exact
  CareGroup caregiver 选择 owner-issued child/family target，进入 empty protected
  composer；T-006 不复制 sensitive source、不自动创建 interaction、不降级到普通
  family question 或 PublishProcess。
- G2-C 首版只允许 caregiver 人工填写受保护纯文本。事实性事件/健康信息保持
  非诊断、非处方；紧急处理继续走线下 protocol，Nurture message 不是替代路径。
  exact canonical effect、response expectation 和 Receipt 在 Phase 0 冻结前不注册
  capability。
- legacy cutover 固定为 single writer：新 G2 rows 只由三轴 Harness path 写入；
  single status、personal assignment、single reply slot、raw DTO、ThreadParticipant
  authority 与 claimed-Step 只读兼容/default-off。旧 consumer 只能从 canonical
  facts 单向派生，不 dual-write；歧义旧行 inventory/quarantine，不猜测。
- G2 Exit 必须经 formal NestJS ingress + real pinned owner path，在 disposable
  PostgreSQL 完成 transaction/concurrency/replay/cascade、cross-scope、privacy 和
  final false/empty qualification。该 PASS 不表示 My-Chat native/device 完成。
- 本轮只更新规划/架构/验证合同，无应用代码、schema、migration、database、
  environment、Candidate、activation 或 traffic 变更。

## 2026-07-30 — G2-C provider / G3-E consumer dependency clarified

- T-005 G2-C provider contract 与 qualification 独立完成，不等待 T-006 整体 task
  completion；provider evidence 使用 exact T-004 digest 与 synthetic owner-issued
  consumer fixture。
- T-006 Stage G3-E 必须在同一 contract identity 上完成真实 safety-route consumer
  joint qualification，之后才可签发 T-006 Beta Profile Handoff。
- 该边界避免 T-005 等 T-006、T-006 又等 G2-C 的循环依赖；两份 task handoff 仍各自
  保留 exact evidence，不相互替代。

## 2026-07-31 — Acceptance-to-check mapping accepted

- 用户确认验收条目机械化映射方案：G2 freeze 及各 checkpoint 冻结时为该阶段验收
  条目分配稳定 `T005-AC-###` ID，逐条映射到 conformance fixture、negative case、
  unit/integration test、lint/静态检查或 evidence census 之一；不可机械验证的条目
  显式降级为 `design_note`。
- 未映射条目不得勾选；资格化 PASS 依据是映射检查通过。映射按 stage 摊销，回链
  使用 T-004 conformance manifest 的 AC 引用字段。详见 `01-plan.md`
  Acceptance-to-Check Mapping 小节。本次只更新规划文档，无代码或 schema 变更。

## 2026-08-01 — G2-0 schema freeze locked

- G1 Joint Conformance PASS(T-002/T-004 联合记录
  `../nurture-institution-mode/18-g1-joint-conformance-record.md`)开放
  protected T-005 implementation 后,按 G2-10 第 1–2 步完成冻结,SSOT 为
  `10-g2-schema-freeze.md`。
- 采用 T-004 exact pin `nurture.surface-contract@1.7.0` / `b7691a81…` 与
  T-002 owner pins(My-Chat `a019566` / Base `06303e9`)。
- 三轴 schema delta 冻结(全部 additive):acknowledgement/response/lifecycle
  三轴 + 独立 heads、`writerContract` 判别列、`replyOrderKey` partial
  unique、`NurtureFamilyCareMessageCorrection` append-only 表、
  `NurtureFamilyCareCascadeAudit` loop-to-closure 表、CommandExecution
  immutable `committedResultPayload`、InteractionContext payload schema v2、
  行内 encrypted protected content(不建平行 content 表)、
  `direct_care_communication` data class。
- single-writer cutover matrix(C1–C8)与旧行 ambiguity inventory 判定表
  冻结:legacy `status` 对 G2 行降级为单向派生只读兼容列;
  assignment/linked-reply/ThreadParticipant/whole-Item CAS/raw DTO/
  claimed-Step 全部不进入新路径;歧义旧行 quarantine 不猜测。
- G2-C 载体经 owner 决策冻结为 **Message-only**:
  `initiate_caregiver_direct_message@1.0.0`,只创建 canonical Message +
  delivered/read Receipt + CommandExecution;不创建 CareItem/Attention,
  家庭侧无 ack/reply 义务,回应走新 submit;correction/redaction 适用,
  withdrawal 不适用。digest rotation 留待下一 pin action,rotation 前
  T-006 只显示安全阻塞。
- freeze 范畴验收条目获得稳定 ID `T005-AC-001..022` 并逐条映射机械检查。
- 本冻结为文档契约动作:无 schema apply、handler、digest、数据库、激活或
  流量效果;所有 consumer 保持 default-off。

## 2026-08-01 — G2 三轴 schema migration 落地(D1–D9)

- 按 `10-g2-schema-freeze.md` 实施 migration
  `20260801021044_g2_three_axis_care_interaction`(additive):八个新枚举、
  Item 三轴列 + heads + `writerContract` + `ackedByRoleAssignmentId` +
  `contextContinuationOfItemId`(self-FK)、Message 的 original-scope trace
  (enrollment/careGroup/direction)+ `replyOrderKey`、
  `NurtureFamilyCareMessageCorrection`(strict head unique)、
  `NurtureFamilyCareCascadeAudit`、CommandExecution
  `resultSchemaVersion`/`committedResultPayload`、
  `caregiver_direct_message`/`direct_care_communication`/`prepare_action`
  枚举扩值,以及冻结的五条 CHECK 约束与 reply-order partial unique index。
- migration 在 disposable PostgreSQL(127.0.0.1:5435,tmpfs)author/replay,
  运行后即销毁;无持久化 apply。prisma migrate dev 生成物中混入的 wave4
  手写约束名 vs Prisma 默认名的 RENAME 漂移已剔除,不属于 G2 范畴,留待
  独立决策。
- 领域层同步:`NurtureGrantDataClass`、`NurtureInteractionPurpose` 字面量
  union 扩值(institution-context.ts / interaction-context.ts);二者在
  self-pin 集内,`nurtureScenario.contractSha256` 用验证器自身算法重算为
  `07f1aeb0…`(54 files)。T-004 surface-contract digest 未受影响,
  `1.7.0`/`b7691a81…` 原样通过 conformance。
- 新增 production-db 集成测试 `g2-three-axis-schema.integration.test.ts`
  (8 cases):legacy 默认不可信、complete-graph/lifecycle-reason/
  protected-body/scope/reply-order CHECK、reply-order partial unique、
  correction strict head。test-routing census production-db 5→6,
  db-population floor 38→46;`docs/context/db/schema.json` 刷新
  (boundary 50 tables / 83 enums)。
- 下一步:G2-10 第 3 步余下部分——经 formal NestJS ingress 实现 Harness
  (query/prepareAction/executeAction/readResult)与 protected-content
  boundary(`ProtectedContentWritePort`)。
