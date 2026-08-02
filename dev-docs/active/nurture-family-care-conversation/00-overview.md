# Overview — 家庭与照护者对话能力

## Status

- State: done
- Task: T-005
- Milestone / Feature: M-002 / F-003
- Updated: 2026-08-02
- Next step: **G2 Exit 已通过；向 T-006 G3-E 交接 exact provider**
  (`14-g2-exit-qualification-and-beta-handoff.md`：`G2_EXIT_PASS`)。exact
  `nurture.surface-contract@1.8.0` /
  `sha256:4fe91e1314c89d09c4081001a61b93ff68392000f7725e8e21a8e7209341d47a`
  已绑定 G1 三类输入、真实 pinned owner path、formal NestJS ingress、clean rebuild、
  single-writer/cutover 与 disposable PostgreSQL 资格化。Nurture provider 保持
  default-off；T-006 G3-E 仍须完成真实 consumer adoption，T-007 仍须采用 Admin
  owner-read，T-008 仍拥有 Candidate/native/device/deployment 资格化。任务可归档，
  但归档移动须另获批准。

## Goal

落地 Guardian Nurture Chat 与 Caregiver Nurture Chat 的 Nurture 侧产品能力：Guardian Chat 保持家庭私密、以孩子为中心的总结与反馈；Caregiver Chat 呈现当前授权的照护事项与工作动作。普通聊天、Chat-assisted action 与 board-direct action 是三种不同交互；后两者必须收敛到同一 Nurture Capability Harness。跨家庭—机构边界的闭环由 Nurture-owned Message、CareItem、Receipt 和追加式变更事实连接，两个角色消费不同投影，不建立跨角色共享聊天室或共享 transcript。My-Chat 负责呈现和宿主交互，本任务负责业务语义与可消费契约。

本任务同时承载 Stage G2：G2-A 完成 family-to-CareGroup
`submit → acknowledge → one-or-more reply` 核心闭环；G2-B 完成
correction/withdrawal/redaction 与 Institution Admin source-side owner-read；G2-C
完成 T-006 `direct_interaction_required` 所需的 caregiver-initiated protected
bridge。只有 A/B/C 与 G2 Exit Qualification 全部通过，T-005 才可完成。

## Terminology Boundary

- 本任务的家庭—照护沟通称为 `CareInteraction`，不是产品 Workflow。
- `submit`、`acknowledge`、`reply` 是 Harness 下的 `ActionExecution`。
- Handoff、Outbox、notification、deep link、retry 与 reconcile 是 My-Chat
  `ActionDelivery`，不是 Workflow。
- 当前产品 Workflow 只指 T-007 园区管理 `InstitutionWorkflow`；本任务不创建
  Workflow Run/Step、Workflow queue 或 `WorkflowDependency`。
- 现有 `workflow_step_complete_v1` / claimed-Step 文字是 T-002 runtime compatibility
  seam，保持 default-off，不能成为 T-005 新契约或 activation 依据。

## Scope In

- guardian 的 family-private AI conversation。
- caregiver 在授权 child scope 内的照护事项、acknowledge/reply 与 current-work 投影。
- 三类交互路径：
  - ordinary chat：默认无业务写入；需要事实时只消费当前授权的安全 query。
  - Chat-assisted action：自然语言只形成 capability/input 候选，确认后经统一 Harness 执行。
  - board-direct action：结构化界面直接提供 capability/input，但使用同一 Harness。
- Chat 与看板共享 capability identity、input schema、authority、confirmation、idempotency、execution 与 result/receipt 语义。
- Capability Harness 是一个通用 envelope + 强类型 capability 的逻辑契约族：
  - Query lane：`query` 与 `readResult`，无业务写入。
  - Action lane：`prepareAction` 与 `executeAction`，统一确认和确定性执行。
- preview 是 `prepareAction` 的语义输出，confirm 是用户提交给 `executeAction` 的确认；二者仍是一个 `ActionExecution`，不是 approval Workflow。
- `prepareAction` 不持久化 business draft、正文或待发送 Message。Nurture MAY
  持久化一个 body-free、短期 `InteractionContext`（token hash、target/heads、
  keyed input integrity、expiry 和 stable command identity），并返回 5 分钟、
  不可延长/复活、对新 effect 单次使用的 opaque `confirmationRef`。
- execute 重新提交 typed input 并校验 canonical input integrity；低熵 protected
  body 使用 secret-keyed tag，不保存 bare body hash。ref 不携带原始正文或 PII，
  且不得跨 actor、surface/device 或 account 使用。
- capability-specific typed input 只包含业务字段；target 与 concurrency
  preconditions 属于 generic prepare context，所需 heads 在 prepare 时冻结进
  `confirmationRef`。
- concurrency precondition 按 capability 定义：acknowledge 使用精确
  acknowledgement head，并声明“已 acknowledged”convergent postcondition；reply
  绑定 replyable lifecycle/authority heads，不把其他合法 reply 视为冲突。
  CommandExecution identity 仍独立处理重复请求。
- My-Chat 拥有每次接口调用的 invocation identity；Nurture 在 prepare 时生成并绑定稳定 business command identity。
- `executeAction` 顶层结果为 `committed | not_committed | outcome_unknown`，并分别表达 `executed | replayed` 与 `applied | already_satisfied`。
- `committed` 使用可变调用判定外壳包裹不可变 `committedResult`；replay 只改变
  `executionDisposition`，必须返回同一个 typed output/receipt refs。
  `commandExecutionRef` 同时是 committed-result authority，不另建重复 result row。
  当前回复数量、
  notification/delivery 与当前权限状态不进入不可变结果，由 `readResult` 重新读取。
- `acknowledge` 是可收敛状态动作：另一名老师已完成确认且其他执行条件仍有效时，
  返回 `executed + already_satisfied`，不创建第二条 acknowledgement event，也不把
  当前操作者记为实际确认者。
- `reply` 是追加内容动作：不同 command 的回复均为 `applied`；第一条返回
  `first_response + attention resolved`，后续返回
  `additional_response + attention unchanged`。只有同一 command retry 才是 replay。
- stale/current-state 只返回当前 actor 仍有权读取的最小 role-safe 状态；authority
  丧失时返回通用 denied 且不暴露当前事项状态。
- 交互遵循低打扰原则：成功、already-satisfied 与 replay 原位收敛，不增加弹窗或
  技术提示；仅内容、目标、可见效果、权限后果或可执行状态实质变化时中断并要求刷新/
  重新确认。
- 第一增量只交付 `submit → acknowledge → reply` 三个原子动作；第二增量增加
  message correction、family request withdrawal 与 message redaction。Grant revoke
  仍是独立授权动作，不与 withdrawal/redaction 合并。
- correction 作用于 Message 内容：仅确切作者可以追加更正版本，不原地覆盖旧正文；
  同班其他老师可以追加新 reply，但不能把同事文字标记为已更正。家长问题只在
  `awaiting_reply` 时允许同 Item 更正，已 responded 后必须创建续接新 Item。
- withdrawal 作用于家庭发起的 CareItem 工作：仅确切问题作者可以提交
  `withdraw_family_care_request`，将 Item 关闭为 `family_withdrawn`、解除当前
  Attention 并阻止后续 ack/reply，但保留问题、已有回复、Receipt 与历史。
- caregiver reply 不提供 withdrawal；内容需要调整时使用 correction，需要不可逆
  移除时使用 redaction。
- redaction 作用于 Message 可见内容：确切作者在显式确认后不可逆移除正文、附件与
  关联 correction versions，保留 tombstone/audit。policy/safety/admin redaction
  使用独立系统权限，不能伪装成作者动作。
- source question redaction 抑制依赖 Item/active Attention 并阻止未来动作；已提交
  caregiver replies 仍是独立作者事实。reply redaction 只移除该 reply，不影响问题、
  其他回复或 Item appendability，也不自动重开原 waiting Attention。
- correction 产生新的跨边界 Receipt/ActionDelivery；withdrawal/redaction 使未发送
  的相关通知候选失效。已经送达设备的通知不能召回，打开时必须 owner-reread 当前
  withdrawal/redaction 状态。
- CareItem 使用正交状态：acknowledgement `pending | acknowledged`、response
  `awaiting_reply | responded`、lifecycle `active | closed | suppressed`。
- 第一条 reply 将 response 置为 `responded` 并解除待回复 Attention；CareItem
  保持 active，班级可继续追加任意数量的 reply。
- CareItem 的工作责任绑定提交时确定的精确 `Enrollment + CareGroup`，由班级共同承接，
  不在 `acknowledge` 时独占分配给某个照护者。
- `acknowledge` 只表示班级已收到；操作者 Participant/RoleAssignment 只作为审计证据，
  不成为 reply authority 或个人 assignment。
- 同一精确 CareGroup 内任一当前 `caregiver | lead_caregiver` 都可以追加 reply；
  `institution_admin` 只有另持一个有效 operational caregiver role 时才可执行。不同
  老师或不同 command 的并发回复均可成功，每条回复保持独立 Message identity、
  真实操作者审计与 Receipt。
- 用户需要继续交流时创建新的 CareItem，并可选携带仅用于展示/总结的 `contextContinuationOfItemRef`；不使用含义模糊的通用 `followUpOf`。
- 上下文续接关系不表示事项依赖，不继承原 Item 的 Grant、authority、owner、SLA 或状态；真正的事项 successor/trigger 需在未来以 `CareItemDependency` 独立表达。
- Increment 1 `submit` 的逻辑 operation input 只包含 1–2000 字符受保护纯文本正文和可选 `contextContinuationOfItemRef`。
- 多目标选择使用 Nurture owner-issued `targetOptionRef`，属于 prepare target context，不进入 operation input；唯一合法目标可按 capability policy 确定性绑定。
- `dataClass=family_care_question`、`category=question`、`urgency=today_attention`、
  `direction=family_to_org`、ack/reply 要求、空附件、作者、同时允许
  `family_to_org + org_to_family` 的 original Grant、route、safe summary 与 command
  identity 均由 Nurture 推导。
- 普通 Chat 只能识别发送意图并打开空的受保护 composer；正文不得从普通 Chat 自动复制、由 LLM 改写或持久化到 Chat transcript。
- 第一增量不支持附件、富文本、批量发送、用户自选分类/优先级，以及医疗、用药或紧急事项写入。
- 独立 G2-C caregiver direct-interaction bridge：只允许 exact CareGroup current
  caregiver 选择 owner-issued child/family target 后打开空 protected composer；
  不自动复制 T-006 sensitive source、AI 文案或附件。事实性健康/事件沟通保持
  非诊断、非处方，紧急流程不得由 Nurture 消息替代。
- UX confirmation 以“一次结构化、效果明确的用户手势”为原则，不把技术 prepare/execute 映射成两次可见操作。
- `submit` / `reply` 使用 reviewable commit：准确内容、目标和效果先可见，再以一次 CTA 提交；不强制二次弹窗。
- `acknowledge` 使用 direct commit：一次“确认收到”手势即可；自然语言本身永远不构成 confirmation。
- 原子动作复用现有 CommandExecution kernel；异步、跨 owner、Handoff 或通知不改变其 `ActionExecution` 分类。
- 同一 Nurture-owned `CareInteraction` 的 guardian timeline projection 与 caregiver work projection。
- family-care message、structured care item、receipt 与附件/媒体引用语义。
- 如复用现有 family-care thread，其仅作为按 Enrollment 隔离的路由/历史技术容器，不是产品共享房间、成员关系或授权来源。
- client-local protected composer → explicit preview → authorized send →
  delivery/read/acknowledge 的状态链；未确认 composer 不成为 Nurture business fact。
- withdraw、redaction、correction 与 owner-reread / replay。
- 每次跨边界发送绑定精确 Institution Enrollment 和原始 Grant，且不得跨机构串联。
- 角色化 presenter、commands、errors 与合成 fixture。
- legacy 单状态、个人 assignment、single reply slot、ThreadParticipant authority、
  raw DTO 和 claimed-Step 只作 migration/read compatibility；新 G2 rows 由三轴
  Harness 单写入，禁止 dual-write，歧义旧行 quarantine。
- 面向当前 `institution_admin` 的园区业务沟通只读投影：仅覆盖发送前已披露 Admin
  监督的 `family_to_org | org_to_family` 业务消息，逐请求重读精确 Institution、
  Enrollment、CareGroup、original Grant、data class、direction、purpose 与源事实
  lifecycle 后，返回当前正文、附件及 correction/withdrawal/redaction 状态。
- 非诊断、非处方、非紧急替代的健康表达边界。

## Scope Out

- My-Chat 聊天 UI、消息路由、推送、通知、账号和设备能力。
- 跨角色共享聊天室、直接 guardian-caregiver DM、共享 transcript、room membership、presence 或 typing 状态。
- 将 My-Chat Chat history、未读状态或本地会话成员关系作为 Nurture canonical 事实或权限。
- Chat 或看板绕过 Capability Harness 直接写入家园沟通事实，或各自维护一套发送/回执逻辑。
- 把普通聊天、查询总结或未确认的 action suggestion 自动转换为 CareItem。
- 默认把家庭 AI 对话同步给机构或照护者。
- 将 Institution Admin 只读投影扩张到 Guardian 私密 AI、未发送草稿、My-Chat
  private chat、其他 Institution Enrollment，或把该投影复制成园区共享 transcript。
- 让 Institution Admin 只读投影隐含 acknowledge、reply、correct、withdraw、
  redact 或 caregiver 身份；这些 action 继续使用各自 exact-author / exact-CareGroup
  authority。
- 医疗诊断、处方建议、紧急服务替代。
- 仅凭 child/family binding 自动建立通信权限。

## Dependencies and Gates

- T-004 公共 surface 和 presenter 契约。
- T-002 的 participant/grant、owner-reread、receipt、authority reread、idempotency 与 host pin。
- T-003 对两类 chat surface 的产品交互输入。
- 本任务的 T-002 landed fact/schema/source 对齐清单：
  [06-t002-fact-schema-gap.md](06-t002-fact-schema-gap.md)。
- 第一增量 protected submit/confirmation：
  [08-increment-1-submit-ux-contract.md](08-increment-1-submit-ux-contract.md)。
- 第二增量变更动作：
  [07-increment-2-change-contract.md](07-increment-2-change-contract.md)。
- capability registry 与 query outputs：
  [09-capability-query-contract.md](09-capability-query-contract.md)。

## Acceptance Criteria

- [x] 家庭 AI 房间内容默认仅家庭可见，跨边界必须有明确 preview 和 send 动作。
- [x] guardian/caregiver 不进入共享聊天室；同一照护事项只生成各自当前可见的角色投影。
- [x] Institution Admin 仅能通过独立、非 canonical、按请求组合的园区业务沟通
  owner-read 投影查看已披露监督的当前正文、附件与 lifecycle；投影不复制 Message，
  不建立共享 transcript，也不暴露家庭私密上下文。
- [x] Institution Admin 的 read authority 与 action authority 分离；仅持 Admin
  身份不能 acknowledge/reply/correct/withdraw/redact。多角色用户必须切换到相应
  caregiver/author role，并重新通过原 action 的 exact authority。
- [x] ordinary chat、Chat-assisted action 与 board-direct action 有可测试的不同结果；普通聊天不产生业务写入。
- [x] Chat-assisted action 与 board-direct action 对同一 capability 产生相同 canonical effect、receipt 和错误语义。
- [x] Harness 使用统一逻辑 envelope，但每个 capability 保持独立的版本化 typed input/result、policy、command/handler 和 presenter binding。
- [x] T-005 V1 capability registry 使用 stable key + 独立 `1.0.0` version；query、
  Increment 1、Increment 2 author action 与 internal system action 的 discovery 边界
  均为封闭且可机械验证。
- [x] Query lane 不进入 CommandExecution；Action lane 的写入复用现有 CommandExecution，且 family-care action 不创建产品 Workflow Run/Step。
- [x] `surface_origin` 只能影响 presenter、审计或观测，不能改变 authority、canonical effect 或 replay identity。
- [x] `prepareAction` 只接受 authenticated trusted context、capability-specific typed input 与用户可选 opaque target ref；Grant、role、policy 和内部 route fields 均由 Nurture 解析。
- [x] acknowledge typed input 为空对象，reply typed input 只含受保护正文；CareItem
  target/version、actor/scope 与 command identity 不进入 capability business schema。
- [x] acknowledge 的 acknowledgement head 在 prepare 时冻结，并显式声明
  acknowledged convergence；reply 则冻结 replyable lifecycle/authority
  precondition。另一条合法班级回复不得使当前 reply stale。
- [x] acknowledge 只有在 current state 恰好已达到同一个 acknowledged postcondition、
  且其余 authority/lifecycle heads 仍有效时才能收敛为 already-satisfied；其他
  version drift 仍 stale/denied。
- [x] prepare 只返回 `ready_to_confirm | needs_input | denied | unavailable`，未确认时
  不创建 business draft、正文、Message、CareItem、Receipt 或 CommandExecution；
  允许的 body-free `InteractionContext` 只承担短期协议绑定，不进入产品投影。
- [x] `confirmationRef` 五分钟过期、不延长、不原地复活；过期、input/target/authority/version 漂移均重新 prepare。
- [x] ref 对新 effect 单次消费，但 execute 成功后的相同 command request 仍可通过 CommandExecution exact replay 返回原结果。
- [x] confirmation consumption、owner-reread、domain effect 与 CommandExecution 对原子动作在同一 Nurture transaction 内完成。
- [x] 相同 command identity + 相同 canonical payload 返回 exact replay；相同 identity + payload drift 返回 idempotency conflict。
- [x] `committed` 只表示 Nurture 业务事务已提交，不等于 notification/provider delivery、设备展示或 Nurture acknowledge。
- [x] `outcome_unknown` 禁止新 prepare/替代 command，必须用原 command identity status/reconcile 至 committed 或 confirmed-no-effect。
- [x] committed 的 typed result 保持不可变；replay 返回同一
  `commandExecutionRef`、output/receipt refs，
  不把 mutable current state、reply count 或 delivery/notification 状态混入历史结果。
- [x] `commandExecutionRef` 是 immutable committed-result authority；持久化
  result schema version、body-free typed output 和 invalidation scopes，不要求第二个
  result table/ref。
- [x] 第二个有效 acknowledge command 在班级已确认、事项仍可执行时返回
  `already_satisfied`，不制造 stale、重复 event 或虚假个人确认归属。
- [x] 不同 command 的合法 reply 始终追加新的 canonical reply Message；第一条/后续
  回复通过 `CareReplyV1` projection 的
  `responseEffect` 与 `attentionEffect` 表达，不用 `already_satisfied` 去重。
- [x] stale 仅在当前 actor 仍可读取时返回最小 role-safe current state；Grant、
  Enrollment、CareGroup 或角色权限丧失时不得借错误响应泄漏状态。
- [x] success、already-satisfied、replay 与语义不变的 transparent reprepare 均原位、
  低打扰反馈；只有实质可见变化或安全边界变化才增加用户步骤。
- [x] Increment 1 的 submit/acknowledge/reply 与第二增量
  correction/withdrawal/redaction 已分别通过 G2-A/G2-B checkpoint；checkpoint 本身
  不等于 T-005 final Exit。
- [x] G2-A/B/C checkpoint 与 real owner-path/single-writer cutover Exit 均已通过；
  T-005 final Exit 只声明 Nurture provider，不替代 T-006/T-007 consumer adoption。
- [x] correction 是 exact-author、append-only 的 Message 内容版本；严格绑定当前
  correction head，不能原地改写历史或由同班其他老师修改作者事实。
- [x] submit/acknowledge/reply/correction/withdrawal/redaction 的 committed output
  都有封闭的 V1 shape；内部 protected-content ref 不进入 public output。
- [x] 家长问题在 awaiting-reply 阶段可同 Item 更正；responded 后的新信息必须通过
  新 CareItem/context continuation 表达。
- [x] withdrawal 只关闭家庭发起的 CareItem 工作，不删除 Message/Reply/Receipt；
  caregiver reply 不暴露 withdrawal capability，Grant revoke 也不复用该语义。
- [x] source redaction 原子移除问题及其 correction 内容、抑制依赖 work/Attention；
  reply redaction 只移除该 reply/correction 内容，不级联删除其他作者事实，也不重开
  原 Attention。
- [x] redaction cascade 必须在一个事务/fence 内更新到闭包或整笔失败；固定分页
  `take` 上限后部分提交不能通过 qualification。
- [x] 用户 redaction 只允许确切作者；policy/safety/admin redaction 具有独立 capability、
  server-owned reason 与审计身份。
- [x] correction/withdrawal/redaction 的 pending ActionDelivery 候选可被当前状态跳过；
  已发 push 不声明召回，deep link open 必须重新读取 Nurture 当前投影。
- [x] 第一条 reply 只把 response 置为 responded 并解除待回复 Attention，不关闭
  CareItem；同班合格照护者可继续追加回复。
- [x] `acknowledge` 不创建个人 claim/assignment；确认者身份只用于审计，家庭侧默认显示“班级已确认收到”。
- [x] reply authority 在执行时基于原始 `Enrollment + CareGroup + Grant` 与当前照护资格重新解析，不要求回复者等于确认者。
- [x] reply 只允许同一精确 CareGroup 的 current caregiver/lead-caregiver；
  Institution Admin 身份、ThreadParticipant row 或“同园区”本身不授予 reply。
- [x] 两名合格照护者并发 reply 时，两条不同 command 均可提交；server-issued
  immutable `replyOrderKey` 决定展示次序，同一 command retry 返回同一顺序键。
- [x] 新 Item 可选引用同一 ChildCareProcess、同一 Enrollment、response 已为
  responded 且当前可读的 Item 作为 `contextContinuationOfItemRef`。
- [x] `contextContinuationOfItemRef` 只影响角色安全的展示与总结，不授予读取权限，不继承 Grant/authority/owner/SLA，也不驱动状态或 `CareItemDependency`。
- [x] 新 Item 从执行时的 current eligibility 选择 Grant，将其固化为该 Item 的
  immutable original Grant，并使用新的 business command identity；源 Item 变为
  不可读时只隐藏关联，不影响新 Item 本身。
- [x] `submit` operation input 只接受规范化后 1–2000 字符纯文本正文与可选上下文续接引用；不接受 raw target、Grant、分类、优先级、route 或 command identity。
- [x] 多 Enrollment 时只接受当前 prepare 返回的 owner-issued `targetOptionRef`；LLM/客户端不得提交 raw Enrollment ID 或静默选择。
- [x] 受保护正文不进入普通 Chat、LLM、confirmationRef、日志、receipt 或 body-free presenter；提交前用户看到的 exact text 与最终写入语义一致。
- [x] public typed input 的 `body` 与内部 content write ref/command DTO 分层：client/LLM
  不能提交 `protected_content_ref`，execute 在 Nurture protected ingress 内原子加密并
  绑定 Message；prepare 只保存 keyed integrity tag。
- [x] 附件、富文本、AI protected draft、用户自选 urgency/category、医疗/用药/紧急输入在 Increment 1 写入前明确拒绝，不静默降级或改路由。
- [x] 每个业务 effect 默认只要求一次结构化用户手势；Harness、confirmationRef、Grant 和 CareItem 内部术语不暴露给用户。
- [x] Chat action card 或 board form 本身可作为 submit/reply 的 review surface；用户无需再经过通用确认弹窗。
- [x] acknowledge 是一次 effect-labeled gesture；过期/状态漂移只能刷新当前状态，不能执行旧动作。
- [x] token 过期但可见内容/目标/效果未变时可透明重新 prepare；任一可见语义变化必须重新展示并要求新的手势。
- [x] LLM 不能绕过 Harness 的目标解析、授权、确认、版本和幂等校验。
- [x] G2-C 使用独立 versioned caregiver-initiated capability；T-006 只传
  body-free owner-issued action/navigation context，不复制 source body，不复用普通
  family-question，也不降级为 PublishProcess。
- [x] G2-C 已冻结并资格化 exact effect/response/Receipt contract；owner unavailable、
  contract mismatch 或资格化未通过时，只返回安全阻塞且不创建 CareInteraction。
- [x] 新 G2 Item/Message 只有三轴 Harness writer；legacy handler 对新 rows
  default-off，旧 consumer 只能读取单向 derived compatibility projection，歧义旧行
  不猜测迁移。
- [x] caregiver 只能在有效 child scope 和授权来源下查看/发送。
- [x] 每个跨边界 Message、CareItem 和 Receipt 均可追溯到精确 Enrollment 与原始 Grant，且不会泄漏其他机构关系。
- [x] delivery/read/acknowledge/withdraw/redaction/correction 状态可审计且可重放。
- [x] owner-reread 在授权变化、重试和并发条件下仍然正确。
- [x] presenter 不泄漏 private anchor、内部表结构、未发送的家庭正文或另一角色不应看到的 transcript。
- [x] My-Chat Chat history 不成为 Nurture 业务事实、receipt 或授权来源。
- [x] My-Chat 可仅依赖公共契约呈现两个 chat surface。
- [x] `ActionDelivery` 的异步性、retry 或 Handoff 不把 CareInteraction 重新分类为 Workflow。

## Next Step

Stage G2 的 G2-A、G2-B、G2-C 与最终 Exit 均已通过。实现复用唯一
transaction/CommandExecution、Message/Receipt/Event/Attention 骨架；legacy paths
对新 rows 只读兼容、单向派生、禁止 dual-write。下一步由 T-006 G3-0 冻结其 exact
consumer inputs，并在 G3-E 采用本任务的 `1.8.0` provider；不得重开 G2、建立兼容
双轨或把 provider handoff 解释为 activation。
