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

## 2026-08-01 — Harness kernel 与 protected-content boundary 落地

- 按 `10-g2-schema-freeze.md` D6/D8 与 G2-03 实现 Harness 内核层
  (`packages/nurture-scenario/src/harness/`):
  - `confirmation.ts`:payload-schema-v2 封闭 confirmation payload
    (capability key/version、stable command identity、target refs、
    expected heads、secret-keyed input integrity tag)、五分钟 TTL 常量、
    `issueHarnessConfirmation`(purpose=`prepare_action`)与
    `computeHarnessInputIntegrityTag`(HMAC-SHA256,低熵正文不存可枚举
    bare hash)。
  - `execute-confirmation.ts`:`withHarnessConfirmation` spec 组合器——在
    同一 command 事务内完成 confirmation 查找、绑定/schema/身份/完整性
    校验与 CAS 单次消费,然后委托原 capability spec;committed replay 由
    runner 在事务外短路,天然不再消费。拒绝分类:expired/replayed/
    integrity-mismatch → conflict,revoked/绑定漂移 → blocked,端口缺失
    → invalid(fail closed)。
  - `protected-content.ts`:封闭 `ProtectedContentEnvelopeV1` 与
    `ProtectedContentWritePort` 域接口;db 层
    `createAesGcmProtectedContentPort`(AES-256-GCM,iv 前缀进
    ciphertext,GCM tag 即 integrityTag,key material 注入、缺失即
    default-off)。
- 事务组合:`NurtureCommandTransaction` 新增 optional
  `interactionContexts` 子端口(与既有 `familyCare` 同模式);
  `PrismaNurtureCommandTransaction` 以事务客户端组装
  `PrismaInteractionContextRepository`(构造放宽为
  `PrismaClient | TransactionClient`)。`classify` 抽出纯函数
  `classifyInteractionContextRow` 供服务与事务消费共用。
- 测试:unit 新增 harness 套件(payload/integrity/envelope/组合器全分支,
  unit 265/265,文件 28→29);db 侧新增 AES port 套件与事务集成套件
  (单次消费、exact replay 不再消费、consumed 拒新 effect、integrity
  漂移零消费后可恢复、过期 reprepare、跨 actor 拒绝;production-db
  55/55,floor 46→55,文件 6→8)。`vitest.db.config.ts` 关闭文件并行:
  共享库上的 Serializable 命令事务在并行文件下会产生 SSI 假冲突。
- self-pin 重算(command-kernel/institution-core/nurture-db index 在 pin
  集):`nurtureScenario.contractSha256` → `2902efd5…`(54 files)。
  T-004 digest 不变(`1.7.0`/`b7691a81…` conformance 通过)。
- 下一步:NestJS Harness 路由(query/prepare/execute/readResult)+
  OpenAPI/api-index/ingress 守卫治理 + env 契约登记(integrity/content
  key),与 submit capability 纵切同单元。

## 2026-08-01 — submit_family_care_question 域层纵切落地(G2-A 第一个 action)

- 按 `08-increment-1-submit-ux-contract.md` 与冻结实现完整 prepare→execute
  纵切(`harness/submit-family-care-question.ts`):
  - 封闭 operation input parse(trim、1–2000、拒绝未知字段/内部 ref);
    keyed protected-body tag 进入 canonical payload,CommandExecution
    payloadHash 与 confirmation 均不含可枚举裸正文 hash。
  - `prepareSubmitFamilyCareQuestion`:safety gate(classifier restricted →
    `unavailable` + alternate process,先于任何业务事实)、guardian
    eligibility/complete-graph 解析、唯一 target 确定性绑定、多 Enrollment
    返回 owner-issued keyed `targetOptionRef`(伪造 tag 无效)、
    continuation 资格校验(同 process/enrollment + responded)、
    confirmationRef 签发(target/command identity/integrity 冻结)。
  - `createSubmitFamilyCareQuestionSpec`:execute 事务内重读 facts
    (guardian reach、enrollment/thread、bidirectional original Grant)、
    safety recheck、`ProtectedContentWritePort.seal` 后经新
    `applyG2Submit` 原子写入。
- 事务端口扩展(optional,单写入面):`loadG2SubmitFacts`/`applyG2Submit`
  ——encrypted Message(`harness_g2_v1`、original-scope trace、明文列恒
  NULL)+ 三轴 Item(legacy `status` 单向派生 `open`,cutover C1)+
  created Event + delivered Receipt + Teacher Attention + Thread bump;
  server 派生 body-free safe summary。读侧新增
  `PrismaSubmitEligibilityReadPort`(prepare 专用,只读)。
- 集成测试 6/6(production-db 61/61,floor 55→61,文件 8→9):happy path
  (密文可 unseal、明文零泄漏、三轴+派生 status、replay 同 refs)、多
  Enrollment needs_input/选择/伪造 ref 拒绝、safety-gated 零事实、无
  grant denied、integrity 漂移零消费后恢复、continuation 资格与关联。
- self-pin 重算 → `28f25d38…`(54 files);T-004 digest 不变。
- 下一步:NestJS Harness 路由 + OpenAPI/api-index/ingress 守卫 + env
  契约登记,把该 capability 挂上 formal ingress;acknowledge/reply 两个
  action 复用同一模式。

## 2026-08-01 — acknowledge/reply 域层纵切落地(G2-A 核心闭环补齐)

- `harness/family-care-item-actions.ts` 按 submit 模式补齐 G2-A 另两个
  action(`acknowledge_family_care_item@1.0.0`、
  `reply_family_care_item@1.0.0`):
  - target 使用 owner-issued keyed CareItem ref(伪造 tag 无效;execute
    仍重读 current authority)。
  - acknowledge:typed input 空对象;prepare 冻结 exact acknowledgement +
    lifecycle heads;execute 收敛语义——仅当 acknowledged postcondition
    已达成且 lifecycle/grant fence 仍有效时 `already_satisfied`(引用既有
    ack event refs,不造第二条 event、不伪造确认者);其余漂移
    stale/denied。班级共同承接:actor 只进 `ackedBy*` 审计,
    `assignedToRoleAssignmentId` 恒 NULL。
  - reply:typed input 仅受保护正文;prepare 只冻结 replyable lifecycle
    head——response 轴自由,其他合法班级回复永不使 confirmation stale
    (append-compatible)。execute 写 encrypted reply Message
    (`replyOrderKey = <db-clock micros>-<messageId>`,partial unique)+
    Event + org_to_family delivered Receipt;first-response transition 条件
    更新 response 轴并 resolve waiting Attention,additional reply 不重复
    处理;Item 保持 active/appendable;legacy `status` 按 C1 单向派生。
  - authority:仅 exact CareGroup current `caregiver|lead_caregiver`;
    Admin-only/跨组/伪造 ref 在 prepare 即 denied;original Grant 按
    item.grantId 重读,replacement Grant 不接管旧 Item。
- 事务端口扩展(optional):`loadG2ItemActionFacts` /
  `applyG2Acknowledge` / `applyG2Reply`;
  `PrismaFamilyCareCommandTransaction` 构造放宽为
  `PrismaClient | TransactionClient`,prepare 直接复用同一 facts 实现,
  避免读写两份漂移。
- 集成测试 6/6(production-db 67/67,floor 61→67,文件 9→10):class
  收敛 ack、非 caregiver/伪造 ref 拒绝、双 caregiver append(首条
  resolve Attention/次条 unchanged、replyOrderKey 有序、密文可 unseal)、
  同 command exact replay 不追加、lifecycle head 漂移 stale 零写入、
  response 轴移动不失效 ack confirmation。
- self-pin 重算 → `d11792bf…`(54 files);T-004 digest 不变。
- G2-A 三个 action 域层齐;下一单元:NestJS Harness 路由 + OpenAPI/
  api-index/ingress 守卫 + env 契约登记,把三个 capability 挂上 formal
  ingress。

## 2026-08-01 — Harness formal ingress 落地(prepare/execute 路由 + 治理)

- scenario-service 新增两条私有路由并挂上三个 G2-A capability:
  `POST /internal/nurture/harness/prepare-action`、
  `POST /internal/nurture/harness/execute-action`(service bearer 认证;
  `NURTURE_HARNESS_INTEGRITY_KEY`/`NURTURE_PROTECTED_CONTENT_KEY`/service
  token/DATABASE_URL 任缺即整路 503 `harness_disabled`,无部分降级)。
  query/readResult lane 留待 query/presenter 单元。
- engine 语义:prepare 按 capability 分发,响应剔除内部 raw id(target 只
  以 confirmation/option ref 往返);execute 只定位 confirmation 行并恢复
  payload(target/heads/command identity),全部状态语义(expired/consumed/
  revoked/binding drift)由事务内组合器裁决——修复了 ingress 层预拦
  consumed ref 会破坏"已提交命令 exact replay 恢复"的缺口;capability
  身份保留在 engine(spec 选择依据),command 身份下放组合器,使 consumed
  ref 复用一致映射为 `confirmation_replayed`/refresh。
- not_committed 响应带 machine-readable `recovery`
  (reprepare/refresh/retry_same_command/none)。
- 运行时解析:两包新增 `./harness` dist 条件子路径导出(主入口保持
  src-only 供 vitest);nurture-db 全部运行时 `@the-nurture/scenario` 导入
  改走子路径,修复编译产物在 Node 下解析 src 的启动失败。
  SafeExceptionFilter allowlist 登记三个 harness 错误码。
- 治理同步:OpenAPI 新增 2 路由 + 5 schema(quality strict PASS)、
  api-index 再生成、formal-ingress 守卫升级为
  `routes=4 owner-fields=8 harness-execute-fields=8`、env 契约登记两个
  optional secret key 并刷新生成物(validate PASS)、smoke 增加
  `harness=disabled` default-off 证据。
- 测试:进程内 e2e(disabled 503/auth 401/shell 400/unknown capability/
  engine 分发)+ 真实 PG HTTP 全链路(submit→ack→reply、exact replay、
  明文零泄漏、consumed→refresh);scenario-service 46/46 + db 8/8
  (routing 61 files:29/10/11/10/1)。
- self-pin 重算 → `e221e1cf…`(54→57 files,scenario-service src 新文件
  计入);T-004 digest 不变。

## 2026-08-01 — Query lane 与 role-safe presenters 落地(09 号契约)

- 域层 `harness/family-care-queries.ts` 实现三个 V1 query capability
  (`query_guardian_family_care_timeline` / `query_caregiver_family_care_work` /
  `query_family_care_item`,均 1.0.0)与 09 号冻结的输出 shape:
  guardian timeline(消息级条目,kind 含 redaction_tombstone)、caregiver
  work(childSafeLabel/safe summary/三轴/attention/actions availability)、
  role-specific item detail(provenance/progress+replyCount/messages/
  receipts/attention/continuation/actions)。
- Ref 纪律:可回传的 careItemRef/targetOptionRef 用 keyed target ref;
  display refs(itemRef/enrollmentRef/messageRef/receiptRef)为不可逆
  32-hex opaque token;raw id 永不出现在响应。分页用 keyed keyset cursor
  (actor 绑定、10 分钟 TTL、伪造/跨 actor/过期 → `refresh_required`)。
- Content owner-read:body 仅经 AES port unseal 内联;caregiver detail 的
  content 以 item original Grant 当前有效为 fence(revoke 后 state 可读、
  正文遮蔽);guardian 恒可读自家 body;redacted → tombstone 无 content。
- db 读端口 `PrismaFamilyCareHarnessQueryReadPort`:所有列表按当前 role
  reach 限定,仅投影 harness 管理行(`harness_g2_v1`/`legacy_migrated_v1`),
  raw 行不出 presenter。
- ingress 新增 `POST /internal/nurture/harness/query` 与
  `/internal/nurture/harness/read-result`(readResult 从 committed 命令的
  canonical output refs + 当前 owner state 重建投影);OpenAPI +2 路由
  +3 schema(quality strict PASS)、api-index 再生成、formal-ingress 守卫
  升级 `routes=6`、context registry touch。
- 测试:query-lane 域层集成 5/5(keyed cursor 分页/伪造/跨 actor/过期、
  role-reach 拒绝、revoke content fence、redaction tombstone);HTTP e2e
  扩至含 timeline/work/detail/readResult 断言(scenario-service db 8/8,
  ref 格式断言);production-db 72/72(floor 67→72,文件 10→11);unit
  265/265;dev-host 26/26;smoke 不变三重 disabled。
- self-pin 重算 → `197618fb…`(57 files);T-004 digest 不变。G2-A 域层
  + ingress + query 面齐;下一步是 G2-A checkpoint 资格化(AC 映射续编、
  等价/并发/泄漏 suite 汇总)或 Increment 2(correction/withdrawal/
  redaction)实现。

## 2026-08-01 — G2-A checkpoint 资格化(缺口套件 + 记录)

- 按 01-plan G2-A 清单补齐缺口测试(`g2a-checkpoint.integration.test.ts`
  6/6):
  - authority matrix:跨 CareGroup caregiver、endsAt 过期角色、guardian
    冒充 caregiver 对 ack/reply 全部 prepare 层 denied 零写入;
  - 真并发独立 reply(`Promise.all`,SSI 可重试收敛)→ 双 applied、
    `replyOrderKey` 严格有序、response 轴恰一次翻转、Attention 恰一次
    resolve;
  - duplicate click(同 confirmation/command 并发双 execute)→
    {executed, replayed} 收敛,恰一条 reply;
  - prepare 后 Grant 撤销 → execute `grant_unavailable` fail closed 零写入;
  - Chat/Board 等价:两 surface 全流程 canonical 效果字段级同构 + 拒绝
    类别一致;
  - workspace 级泄漏 census:七表 dump 对两侧明文、confirmation token、
    `protected_content_ref` 零命中。
- `11-g2a-checkpoint-record.md` 落地 checkpoint 记录:
  `G2A_CHECKPOINT_PASS / INCREMENT2_PENDING / G2C_PENDING /
  T005_EXIT_NOT_CLAIMED`;清单逐项映射到套件/提交链;AC 续编
  `T005-AC-023..035`。G2-A 明确不是 final Exit;Increment 2、G2-B
  owner-read、G2-C 与最终 Exit Qualification 保持未完成。
- 全套:production-db 78/78(floor 72→78,文件 11→12);unit 265/265;
  scenario-service 46/46 + db 8/8;dev-host 26/26;digest 不变;typecheck
  clean;self-pin 维持 `197618fb…`(pin 集未动)。

## 2026-08-01 — 实施质量自查修复(高危 legacy 隔离 + 中低项)

自查(opus-5)对 `f167079..f343eb1` 八个单元逐条复核,发现并修复:

- **高危:legacy 写入面未被机械隔离(违反冻结 C6/C8)。** legacy
  `acknowledgeFamilyCareItem` / `replyToFamilyCareItem` /
  `redactFamilyCareMessage` 的 where 子句没有 `writerContract` 过滤,
  legacy acknowledge 在 `status:"open" + version` 匹配时会写 G2 行——
  改 legacy status 与 ackedBy* 而三轴纹丝不动,行进入自相矛盾状态。现在
  三个 legacy 变更器都以 `writerContract: "legacy_v1"` 为前置(reply 另加
  显式 guard),并新增 `g2-legacy-cutover.integration.test.ts` 5/5 兑现
  `T005-AC-007`:三条 legacy 路径打 G2 行全部 not_committed 零写入、
  legacy 行仍可正常驱动、grant revoke 对 G2 行同步推进 lifecycle 轴。
- **grant revoke 级联**:原先只写 legacy status,G2 行的 lifecycle 轴会
  被落下;现在对 harness 行同时置 `lifecycleState=suppressed /
  lifecycleReason=grant_revoked / lifecycleHead+1`。同时把两处
  `take:100` 改为分页循环至闭包(超界整笔失败),消除冻结 D5 点名的
  "固定 take 上限后部分提交"原子性缺陷;affected refs 跨页累积后再截断。
- **中:`readResult` 曾接受调用方给的 raw item UUID**(与 09 契约
  "不接受 raw CareItem id"及自身 commit 声明冲突,且是 id 探测口)。
  改为按 stable business command identity 查已提交执行、校验
  `business_actor_ref` 属于调用者,再用该执行**自己存储的** output refs
  投影;OpenAPI 请求体同步改为 `command_request_id`。HTTP e2e 补跨 actor
  与未知 command 两条 denied。
- **中:分页可能提前终止(静默丢数据)。** 读端口过滤不可投影行后,域层
  用过滤后的行数判 `hasMore`。改为读端口按扫描源记录分页(扫 take+1、
  hasMore/cursor tail 均取自源记录),并新增"孤儿行被跳过但翻页不中断"
  的测试。
- **中:query lane「零 CommandExecution」此前只有构造保证、无断言。**
  补前后计数比对(含 execution/message/item/event/context/receipt 六表)。
- **低:** `crypto.randomUUID()` 全局用法改为 `node:crypto` 具名导入(4 处);
  acknowledge 收敛在证据 refs 缺失时改为 fail closed
  (`acknowledgement_evidence_unavailable`)而非提交空 refs 的
  already_satisfied;并发与 duplicate-click 测试加重试次数上限断言,
  防止"无限重试也能变绿"的掩盖。
- **契约轮转债务(记账,非缺陷):** 六个 capability 与 09 号 shared
  referenced types 仍未进 T-004 interface digest。当前 default-off、未
  发布 discovery,状态自洽;但这是 G2 Exit 前置,冻结文档此前只记了
  G2-C 的 rotation,现补记全量。
- 回归:production-db 85/85(floor 78→85,文件 12→13);unit 265/265;
  scenario-service 46/46 + db 8/8;dev-host 26/26;routing 64 files;
  digest 不变;typecheck clean;smoke 三重 disabled;self-pin →
  `05f449da…`。

## 2026-08-01 — Codex 独立评审发现的修复(gpt-5.6-sol)

对 `f167079..f343eb1` 的独立对抗式评审给出 10 条(5 高)。逐条裁定与处置:

- **高 #1 enrollment 作用域越权(采纳,最严重)。** guardian 的
  `scopeType=enrollment` 角色此前被放大为整个 child-care process:同一孩子
  在**另一机构**的问题/回复会进入 timeline 并被解密,submit 也会把另一机构
  的目标列为可选。已引入 `GuardianReach{processIds, enrollmentIds}`——只有
  process/family 作用域才覆盖整个 process,enrollment 作用域只达该
  enrollment;timeline/detail/submit-eligibility 三处统一按此判定。新增跨机构
  越权回归测试(修复前会泄漏)。
- **高 #2 grant 的 purpose/data-class 未强制(采纳)。** `purposes` 全链路
  从未校验;且 `currentGrant` 的 `activeMismatch` 兜底会把一个 data-class
  不匹配的 active grant 当作 active 返回,而 submit 只查 directions。已加
  `grantAuthorizesFamilyCare(grant, direction)` 统一谓词(status + direction
  + `family_care_question` + `family_care_workflow` purpose),submit/ack/
  reply/内容 fence 全部改用;grant 读取补 `purposes` 字段。
- **高 #3 raw id 与续接 ref(部分采纳)。** readResult 吃 raw id 已在上一轮
  自查修掉。**续接流程断裂**属实且已修:query 发出的是签名 care-item ref,
  而 submit prepare 此前当作裸 DB id 解析,照文档流程走必然失败(旧测试直接
  传 `sourceItem.id` 掩盖了它);现在统一走 keyed 解析,并补了「裸 id 被拒」
  断言。keyed ref 内含 id 这一点保留:它是**防伪造**设计,调用方本就持有
  自己 item 的身份;已在记录中修正措辞,不再声称「raw id 不出」。
- **高 #4 缺 `outcome_unknown`(采纳)。** 此前任何事务异常都报
  `not_committed`,在「COMMIT 后连接中断」时是不诚实的。现为三态,并做了
  Codex 未提的关键区分:**operation 内部抛错 = 确定回滚 → not_committed**
  (新增 `NurtureDeterministicRollback`),**事务外壳失败 = outcome_unknown**;
  驱动明确报告的写冲突(P2034/40001)也归为确定回滚。HTTP 侧新增
  `outcome_unknown` + `recovery: reconcile_same_command`;两个 workflow
  handler 补分支(同 command identity 重试→exact replay,不产生第二效果)。
- **高 #5 immutable committed result 未实现(采纳)。** D7 的两列此前只有
  schema 没有 writer,reply 算出的 `replyOrderKey`/`response_effect`/
  `attention_effect` 被丢弃,调用方无从得知首条/追加与 Attention 结果。现在
  spec 可返回 `result_schema_version` + `committed_result`,kernel 持久化并在
  replay 时原样返回,三个 capability 均已填充。
- **中 #6 replay 绕过 surface/conversation 绑定(不采纳,附理由)。**
  冻结契约明确要求 `surface_origin` **不得**进入 authority 或 replay
  identity(01-plan G2-03 / `T005-AC-032`),因此 surface 不在 payload hash
  内是按契约设计;actor 已在 hash 内,跨 actor 会 idempotency_conflict 而非
  replay。已记录该分歧与依据。
- **中 #7 cursor 未绑定快照(采纳)。** cursor 增加 `snapshot_at`,读端口按
  该时刻上界扫描,避免同一列表跨页拼出互相矛盾的状态。
- **中 #8 caregiver work 混合多个 CareGroup(采纳)。** 改为按**确切**
  CareGroup 查询(默认取确定性首个,可用 owner-issued ref 指定),输出补上
  契约要求的顶层 `careGroupRef`。
- **中 #9 续接可读性未校验(采纳)。** prepare 侧要求源 Item lifecycle
  active 且其 original Grant 当前有效;detail 侧的 `continuation_source_readable`
  由硬编码 `true` 改为按当前角色可达性实算。
- **低 #10 correction head 测试名过度声明(采纳)。** 唯一索引只保证
  (message, version) 唯一,不保证冻结的 `max+1`;测试更名为其真正证明的内容,
  并注明 max+1 由 Increment 2 的 correction 命令负责。
- 回归:production-db 86/86(floor 85→86,新增越权回归);unit 265/265
  (kernel 三态测试更新为诚实断言 + 新增确定性回滚用例);scenario-service
  46/46 + db 8/8;dev-host 26/26;digest 不变;typecheck clean;smoke 三重
  disabled;self-pin → `b2c53eb7…`。
- 未在本轮重跑:x5 联合套件(需 pinned My-Chat + pgvector 物化)。受影响的
  revoke 路径由 `family-care.integration` 与新 legacy-cutover 套件覆盖,
  CI 会跑 x5。

## 2026-08-01 — x5 联合套件在 pinned 物化上复跑

- 上一条记录里标注为 NOT RUN 的 x5 缺口已补:按 G1 先例做 pinned detached
  worktree(My-Chat `a019566` / Base `06303e9` / The-Nurture `eb97d08`,
  sibling working copy 全程未触碰),配 disposable pgvector PG(5437,tmpfs),
  `x5_my_chat` 用 pinned My-Chat 迁移、`x5_nurture`/`nurture_dev_host` 用
  Nurture 迁移。
- `pnpm test:x5` **4/4 通过**,覆盖本轮改动实际触及的两处:revoke 级联
  (闭包循环 + harness 行三轴同步)与 command kernel 三态结果。pin 验证在同
  一物化上重跑,self-pin `b2c53eb7…` 与已推值一致。
- 环境按纪律销毁:容器 `down -v`、三个 worktree `worktree remove --force`,
  sibling 仓库 status 干净。
- 本轮教训已归档到 `05-pitfalls.md`(冻结≠约束、作用域放大、测试自我掩盖、
  错误分类不能一刀切、schema 列无 writer、声明需有证据、固定 take 级联)。

## 2026-08-01 — G2-B lifecycle and owner-read completion

- 在既有 Harness kernel 上增加 transaction-local `afterExecutionCreated` hook：
  correction 与 cascade audit 的强 FK 必须指向本次 immutable
  `CommandExecution`，因此 domain effect、Execution create 与 finalizer 保持在
  同一 transaction；finalizer 失败整笔回滚，不引入事后补写窗口。
- 修复 exact replay：kernel 现在把已持久化的 `committedResultPayload` 原样返回；
  `already_satisfied` precondition 也可提供 schema/versioned body-free result，
  withdrawal/redaction/ack convergence 不再产生无 typed result 的 Execution。
- `correct_family_care_message` 使用 exact sender + current same-side role、active
  original Grant/lifecycle、strict Message/correction head；追加 encrypted correction、
  独立 Receipt/Event，原 Message 正文与历史不覆盖，presenter 默认显示最新有效解释。
- `withdraw_family_care_request` 使用 exact family source author；提交
  `closed(family_withdrawn)`、resolve active Attention、block pending related
  receipts，并使后续 ack/reply 在 current owner reread 时 `target_unavailable`；
  新 command 与 exact retry 都收敛到同一证据。
- author redaction 与 system-policy redaction 使用不同 capability/actor kind；author
  只需 exact author + current same-side reach，不借 original Grant 拒绝作者移除自身
  内容。source cascade 抹除 source correction chain、suppresses Item/Attention、
  terminalizes receipts；reply cascade 只影响该 reply/correction/receipt，不回退
  response、不重开 Attention。所有分页以 100 行扫描并循环至无残留；任一步冲突
  即 rollback，完成后写 `CascadeAudit(complete, CommandExecution FK)`。
- role-safe timeline/detail 增加 latest correction、correction notice、redaction
  tombstone 与 action refs；author/withdraw/correction/redaction refs 均 actor-bound，
  runtime execute 只从 consumed confirmation 重建 target/heads。
- 新增 provider-only
  `nurture.institution-business-communication-owner-read@1.0.0`，digest
  `sha256:dd1b63fe6c7975bafb4170aff3dccc92463dfaf3e5ea7e5bd3c80f1298d6c921`。
  每次读取重验 current exact Institution Admin、Institution/Enrollment/CareGroup、
  original current Grant、direction/data class/purpose、closed pre-send disclosure 与
  current correction/withdrawal/redaction lifecycle；输出只有 opaque display refs、
  当前 protected body/tombstone、空附件和 `actions: []`。carrier 使用 service bearer
  与 `private, no-store`，且独立 env gate 默认 `false`；T-007 consumer adoption 未做。
- 正式 API 增至七路由，OpenAPI/API index/ingress census 同步。环境开关通过
  `env/contract.yaml` SSOT、typed config、生成文档与 environment suite 管理；无
  secret、无 committed env value、无 activation/traffic。

## 2026-08-02 — G2-B checkpoint 质量修复与重新资格化

- G2-B 四个 action 的 `committed_result` 由内部 snake_case/debug projection 改为
  T-004 `additionalProperties=false` exact result：correction
  `{effect,messageRef,correctionRef,receiptRef}`、withdrawal
  `{effect,careItemRef,receiptRef}`、author redaction
  `{effect,messageRef,tombstoneRef}`、policy redaction
  `{effect,messageRef,tombstoneRef,auditEventRef}`。公开 refs 由 canonical ref 生成
  workspace-bound、purpose-separated、display-only HMAC identity；内部完整 refs 仍只
  留在 `output_refs`/owner reread。
- 删除了伪造的 `redaction_event_ref=message_ref`。author tombstone 使用同一 canonical
  Message 的独立 tombstone display ref；policy `auditEventRef` 指向实际
  `NurtureFamilyCareCascadeAudit`，因此所有公开结果字段都有真实持久化事实支撑。
- `policy_redact_family_care_message` 现在严格解析闭合
  `{policyDecisionRef}`。owner-issued ref 绑定 workspace、system Participant、Message
  和 Message/policy head；prepare、execute precondition 与 transaction apply 前都重验
  binding/current head/current `system_operator`。body-free confirmation 只保存数值
  `expected_heads.policy_decision` 与 keyed input integrity，不缓存 policy decision。
- command kernel 把 `afterExecutionCreated` 异常标记为
  `NurtureDeterministicRollback`；finalizer 与 effect/Execution 同事务，失败明确返回
  `not_committed/technical_error`。in-memory transaction adapter 同步改为成功后才发布
  staged Execution，使该回滚保证可被单测机械验证。
- guardian timeline 不再用 unordered `Map(sourceId → Receipt)` 折叠 original 与
  correction receipts。读取按 `(createdAt,id)` 排序；有 active correction 时严格按
  correction `receiptId` 外键选择其 Receipt，否则选择确定排序的原始 Receipt。
- withdrawal canonical reason 继续保存在 Item/Event；冻结 public schema 不新增字段，
  guardian timeline 改投影为 `kind=withdrawal_notice` 且 `state.lifecycle=closed`。
  redaction 仍优先显示 tombstone，避免泄漏已删除内容。
- 无 Prisma schema/migration、T-004 artifact/digest、环境值、activation 或 traffic
  变化；验证仅使用显式临时 PostgreSQL 数据库并在退出时删除。因 command kernel
  与 scenario-service runtime 属于 Nurture self-pin population，使用 verifier 自身
  path-content 算法重算 57-file self-pin 为 `f7d618bd…`；My-Chat/Base revision/pin 未改。

## 2026-08-02 — G2-C provider 实现与质量收口

- 新增独立 `initiate_caregiver_direct_message@1.0.0`：bounded eligibility read
  只发放 exact CareGroup caregiver 的 owner target option；confirmation 绑定
  Enrollment/CareGroup/role/Grant/thread/safety heads；serializable execute 重读全部
  facts 后只写 encrypted Message + logical Receipt + immutable CommandExecution。
- target option 由含 raw Enrollment id 的 signed locator 收敛为不可逆 HMAC handle；
  supplied invalid ref（包括唯一候选场景）不再退回隐式 default 或 clarification，
  而是 `not_authorized`。
- guardian timeline 从强制 CareItem 的 V1 shape 旋转到 Message-aware V2 union；
  direct/correction/redaction row 有 `messageRef`，没有伪造 `careItemRef/state`。
  original Grant 失效后正文与 direct readResult 都 fail closed。
- correction 的 org-to-family Receipt 改从 canonical Thread 取 family，不再依赖
  direct path 不存在的 Item。多 current family/thread 歧义也不再按 row order 猜测。
- 质量审计同时修复 query exact schema 旧漂移：caregiver work 的 `pageInfo`、item
  detail 的 `replyCount` 与 `not_applicable` 现在有唯一 result schema `@2`；三个 query
  capability 一起旋转到 `1.1.0`，不保留旧 runtime/schema 双轨。
- surface root 旋转为 `nurture.surface-contract@1.8.0` /
  `sha256:4fe91e1314c89d09c4081001a61b93ff68392000f7725e8e21a8e7209341d47a`。
  Prisma schema 已有 direct kind/data class 所需列，因此没有新 migration，也没有
  persistent DB apply、activation 或 traffic。
- self-pin population 不再只选旧入口依赖；它现在覆盖完整 scenario Harness 与 direct
  eligibility/query repositories，共 69 files，按 verifier 算法重算为
  `0e684436322a1865febad9e54dea241f16046b1813b765c876e238a415551e03`。
