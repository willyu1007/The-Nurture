# Overview — 儿童照护双看板

## Status

- State: in-progress
- Task: T-006
- Milestone / Feature: M-002 / F-003
- Updated: 2026-08-04
- Next step: G3-E readiness review 的 B1/B2/B3 已关闭，B4 部分完成。**B8 Unit 0
  与 Lane A 已落地**：写命令工厂 `createBoardWriteSpec`、按能力的 ingress 描述表、
  `cancel_publish_process`，以及编辑 lane 的四条写能力（edit hold 取得/续期/释放、
  草稿自动保存），全部含 owner 写事务、prepare、spec、路由与真 PostgreSQL 的
  DB e2e。formal ingress 现在准入 15 个 action 与 9 个 query，显式未路由的写 key
  从 16 降到 11。
  2026-08-03 的对抗复核判定该范围架构成立但两条 HIGH 必修——两条均已修复
  （过期 hold 卡死、草稿 LWW 经输入 schema 增补 + 制品旋转至 `1.14.0`），随后的
  卫生批密封了线上的原始 id 并加固了 head 普查。**归属 lane 三条已于 2026-08-04
  落地**（复核发现 5/6/7 同单元关闭），ingress 现准入 18 action + 9 query。
  **B8 可路由集合已于 2026-08-04 清零**：媒体生命周期 2 条与发布后安全 3 条
  （工厂 `finalize` 钩子解决 `command_execution_id` 外键时序，幂等复述从存储
  事件作答）全部落地。ingress 现准入 23 action + 9 query；显式未路由恰为三条
  结构性阻塞（release 需多命令 ingress 形状、reschedule 等 T-007、organize 待
  CareGroup 绑定与 outcome 枚举的合同决定）。**release 已于 2026-08-04 以传输层
  fan-out attempt 形状路由**；**organize 已于同日端到端落地**（1.15.0 修订给出
  owner 班级选项通道与含 D-15 动作的路由结果；25 action + 9 query，未路由仅剩
  reschedule）。**B5 已于 2026-08-04 落地**：
  `direct_interaction_required` 决定携带 owner-issued T-005 动作（现时资格 ∩
  候选目标集铸造 `targetOptionRef`，安全阻断走冻结分类）。余下：B6/B7 的外部
  联合运行。详见
  [G3-E readiness review](07-g3-e-implementation-readiness-review.md)。

## Goal

落地 Guardian family board 与 Caregiver teacher board 的 Nurture 侧产品能力。两个
surface 使用同一组可追溯照护事实，但按角色、授权和当前工作上下文提供不同投影：
家庭看到长期连续性，照护者看到当前工作与待确认事项。看板可显示与当前角色相关的
`InstitutionWorkflowProjection` 片段，但不拥有 Workflow 事实或 runtime。

两个看板都是可操作的领域投影窗口，而不是只读报表。它们共享 canonical facts、
模块语义与投影管线，但使用角色独立的查询策略和 presenter。用户可以在看板内低打扰地
微调草稿、归属、关注点、发布时间等业务内容；操作必须调用对应事实所有者的 versioned
capability，不能直接改写 read snapshot、缓存或复制出来的 child state。提交后由看板
重新读取并投影结果。

`PublishProcess` 是 caregiver-side 的跨边界发布领域过程：当一条园所内部采集内容被
选为家庭发布候选时开始，管理 AI suggestion、草稿微调、child/target attribution、
review、发送时机与发布前取消；在 Nurture 原子提交家庭可见发布事实和 Receipt，或在
发布前取消时结束。它不管理相机/上传 transport、T-005 `CareInteraction`、通知投递
或 `InstitutionWorkflow`。终端 UI 只显示草稿、待确认、待发送、已发布等生活化状态，
不暴露 `PublishProcess` 术语。

Caregiver teacher board 的家庭事项以精确 CareGroup 为共同工作单元：
acknowledge 表示班级已收到，不创建个人认领；同班任一当前合格照护者可在重新授权
检查后追加一条或多条回复。班级是家庭侧主要业务发送主体，个人身份用于操作审计
与可选次级署名；第一条回复解除待回复提醒，但不关闭事项。

Stage G3 复用 T-006，不创建新任务。G3-A～C 可以在 G3-0 合同冻结后依赖感知地
并行；G3-D 消费 B 的 saved revision 与 C 的 publish eligibility；G3-E 汇合
T-004/T-002、T-005 G2-C、T-007 发布策略子合同与 formal NestJS ingress，形成
Nurture-side Beta Profile Handoff。

2026-07-30 Stage G3 overall audit 结论为 `PASS`：从共享看板、capture/draft、
content/media safety、publish/release 到 integration handoff 的目标链完整；事实/
projection/process/delivery/Workflow ownership 不混层；T-005/T-006 与 T-006/T-007
无整任务循环依赖；optional enhancement 不成为隐藏 hard dependency。剩余 exact
keys/schemas/source heads/DB delta/fixtures 属于 G3-0 implementation contract freeze，
不再重开顶层产品边界。

2026-08-02 G3-0 已冻结 exact `1.8.0` surface/T-005 direct-action 输入、T-007
`nurture.institution-publication-policy@1.0.0`、两层 board query 拓扑、T-002
事实复用与单次 DB SSOT delta，并建立 `T006-AC-001`～`T006-AC-010` 机械映射。
首个 profile 排除 exact `1.8.0` 当前明确拒绝的 Caregiver Workflow projection；
Guardian 侧保持 optional/absent-empty。详细记录见
[G3-0 freeze](06-g3-0-fact-contract-schema-freeze.md)。

2026-08-02 G3-A 已交付：共享 source-head projection pipeline、Guardian/Caregiver
两条角色独立读路径、两个 envelope presenter、两个 canonical owner 内联 mutation，
以及首批合成 board conformance fixtures。surface artifact 从 `1.8.0` additive 旋转
到 `1.9.0`：shared core 与全部 T-005 capability slice 哈希逐字节不变，因此 T-005
G2 Exit 证据按 `compatibility-policy.json` 的 `additiveNewSlice` 规则继续成立。
`teacher_publish_queue` 依赖 G3-B 事实，模块缺席并以 dependency NO-GO 呈现，
Caregiver teacher board 因此为 `limited`；Guardian optional Workflow projection
缺席不产生 NO-GO、不降级 state。

2026-08-02 G3-B1 已交付：CareGroup 采集批次与三个整理 trigger（manual /
10 分钟 idle / 发送前 30 分钟兜底）、一分钟防打断 gate、stable source watermark
切批、确定性内容组装、五状态 `PublishProcess` 的 draft 通道、30 秒快捷调整
posture、autosave 与 edit hold，以及 `query_teacher_publish_queue`。
确定性主路径不含任何生成式 provider；G3-B2 AI copy 保持 absent。
`teacher_publish_queue` 模块已就位，caregiver board 的 dependency NO-GO 改为
真实缺席的 `t007_publication_policy`，policy 解析后即转为 `ready`。

2026-08-02 G3-C1 已交付：Nurture 版本化 `ContentSafetyPolicy`（硬规则先于
classifier，园区只能收紧，老师只能抬 tier，provider 失效不落回 ordinary）、
media asset 与 child attribution 两条独立封闭轴、一次性 legacy 迁移的 fail-closed
映射、三个手工归属能力，以及实时派生的发布资格与群像 exposure 门禁。
G3-C2 `ClassScopedFaceMatch` 保持 default-off 且能力身份完全未注册。

2026-08-02 G3-D 已交付：按 T-007 精确契约解析并冻结的发送窗口、scheduler
attempt 门禁、逐目标 `PublicationRelease` 扇出（首个 commit 冻结共享 revision、
零提交保持 pending_release、partial 逐目标可解释）、rejected 与 outcome-unknown
分离的重试/reconcile，以及无过期窗口、append-only、保留 Receipt 的发布后
correction/target removal/redaction 与两个 media lifecycle 能力。
G3 adoption set 至此关闭（35 个 capability）；真实 policy-backed schedule/release
与 provider/consumer 联合资格化仍属 G3-E。

## Scope In

- Stage G3 五组交付：G3-A shared board foundation、G3-B capture-to-draft、
  G3-C content/media safety、G3-D publish/release、G3-E integration
  qualification。
- family charter / focus、current focus、daily care、attention 与成长记录的角色化投影。
- focus、daily care、attention、media、publication 与 CareInteraction 按领域事实含义
  分离，在 presenter 层组合成角色化内容和模块。
- 共享的 board projection pipeline、角色独立 presenter 与可操作的内联微调能力。
- caregiver 的 class/work queue、快速记录、photo-first capture 与待发布内容。
- 园所内部采集成为家庭发布候选后，由 `PublishProcess` 管理到原子 publish 或
  pre-publish cancel 的两阶段发布。
- 一个 caregiver 可见、共享编辑的 `PublishProcess` 内容卡片可以覆盖多个家庭目标；
  实际发布拆为逐目标 `PublicationRelease`，分别授权、提交、回执和重试。
- `PublishProcess` 使用 draft / needs_review / pending_release / released / cancelled
  五个业务状态；逐目标发布结果、调度、执行和投递状态不塞入主状态机。
- T-006 的 teacher-board actor 只有当前精确 CareGroup 范围内的合格 caregiver
  （产品简称“本班老师”）；Lead 留在园区日常运营管理，不参与 T-006 发布授权。
- Nurture 拥有服务端 PublishProcess draft/revision 与短期 edit hold；My-Chat 提供
  约 1 秒自动保存的受保护本地编辑缓冲，pending-release 只允许在线编辑。
- pending-release 默认使用园区当地时间 17:00，允许本班老师“现在发送”或改时；
  自动补发默认截止 19:00，超时留队而不静默顺延。
- media asset、child attribution 与 PublicationRelease 保持三轴分离；媒体支持卡片
  detach、发布前 discarded、发布后 target removal/redaction，不做无审计硬删除。
- 拍摄/录入先进入待整理采集批次；本班老师手动“整理”，或命中园区可配置的
  10 分钟静默期/默认发送前 30 分钟兜底时点后，才按 source watermark 切出整理输入。
- 自动 trigger 使用一分钟无用户操作 gate 防打断；本班老师活动重置，后台机器进度
  不重置，手动“整理”绕过。
- 普通、高置信整理结果提交后才启动 30 秒快捷调整；超时后进入直到实际发布前持续
  可编辑的 pending-release queue。
- My-Chat 侧按账号/Workspace 隔离的受保护本地媒体缓存、缩略图与离线上传队列；
  Nurture 只消费稳定 media ref 并拥有业务 attribution/publication。
- 不修改原图或生成 crop/blur 变体；在单独隐私启用门禁下，专用 matcher 只将照片与
  当前 exact CareGroup 的有效孩子头像匹配，高置信自动确认，异常才要求老师处理。
- 角色安全的 `InstitutionWorkflowProjection` 外部切片，例如待处理授权申请或结果；
  不暴露园区内部步骤。
- provenance、authority、receipt、correction 与 owner-reread。
- 自动整理默认使用老师原文、语音转写和确定性模板，不生成自由文案；AI copy 仅在
  老师明确请求或独立日/周总结场景中作为可采用/修改/拒绝的 suggestion。
- Nurture `ContentSafetyPolicy` 最终派生 ordinary、review-required 或
  direct-interaction-required；磕碰/健康/用药/明显情绪行为事件和身体隐私等退出
  批量发布，由老师显式进入 T-005 家庭沟通。
- 专用班级内人脸 matcher 是唯一允许按 D-14 高置信规则自动确认归属的首轮 AI 例外。
- G3-C1 的人工归属、群像 exposure 与 `needs_review` fallback 是必需主路径；
  `ClassScopedFaceMatch` 在 G3-C2 实现，可与 G3-D 并行，首个 beta profile
  未声明 required 时保持 optional/default-off，不阻塞 G3 Exit。
- G3-B1 的老师原文、带 provenance 转写、版本化模板和 photo-only 确定性组装是必需
  主路径；G3-B2 的显式 AI copy 是可选增强，不阻塞 G3 Exit。
- guardian/caregiver presenter、queries、commands、fixtures 与黑盒旅程。

## Scope Out

- 儿童、教师、家庭或机构排名、打分、竞争性指标。
- 医疗诊断、处方或自动风险结论。
- 默认把 class draft 或其他孩子信息展示给家庭。
- My-Chat 原生 UI、相机、相册、上传、推送与设备权限实现。

## Dependencies and Gates

- T-004 的 surface、visibility、presenter 和 fixture 基座。
- T-005 的家庭—照护者通信、回执与纠正语义。
- T-005 Stage G2-C 还需提供专门、可授权的 caregiver-initiated
  direct-interaction capability，
  才能承接 T-006 的 `direct_interaction_required` 路由；现有会拒绝健康/用药等输入的
  普通 family-question action 不能被 T-006 静默复用。
- G3-E 必须完成 T-006 与 G2-C 的真实联合资格验证；该依赖不阻塞 G3-A～D。除非后续
  另有顶层决策缩减整个 beta profile，否则不能用 safe-unavailable 占位签发 T-006
  Beta Profile Handoff。
- T-007 拥有园区发布策略子合同：institution timezone、默认发送时点、重试截止、
  organize trigger/quiescence 配置与 `policyHead`。该精确子合同是 G3-D/E 硬依赖，
  但不要求 T-007 整体先完成。
- T-007 `InstitutionWorkflowProjection` 仅是 G3-A 按 beta profile 选择的只读展示
  依赖；无适用 Workflow 时合法空态/隐藏模块不阻塞双看板或发布主路径。
- T-002 的 child scope、grant、daily care、attention、media attribution 与 owner-reread 门禁。

## Acceptance Criteria

- [ ] 两个看板读取同一事实来源，不各自复制业务真相。
- [ ] 看板响应不是新的事实源或跨角色超级 DTO；同一事实通过共享模块语义与
  provenance 投影到角色独立的 public content。
- [ ] 看板允许原地微调，但每项业务修改都通过对应 canonical owner 的 versioned
  capability 提交；不得直接 patch snapshot、缓存或 derived projection。
- [ ] 展示偏好、发布前草稿调整和发布后 correction/redaction 等不同修改类型具有
  明确 owner、持久化与审计边界。
- [ ] guardian 只看到自己被授权 child scope 的家庭投影。
- [ ] caregiver 只看到授权班级/孩子的工作投影，且不会泄漏其他家庭私密内容。
- [ ] teacher board 不把 acknowledge actor 显示为独占负责人；同一精确 CareGroup
  内其他当前合格照护者仍可回复，跨班级或仅同园区不可操作。
- [ ] 同班不同老师的独立回复可以并发提交并稳定排序；board 不把第一条回复投影成
  terminal/unique reply，也不重复创建待回复 Attention。
- [ ] `PublishProcess` 只使用 draft、needs_review、pending_release、released 与
  cancelled 五个业务状态；低置信/归属不明/D-15 可修正灰区进入 needs_review，普通
  内容不增加逐条审核；direct-interaction-required 不伪装成第六个状态。
- [ ] 30 秒倒计时、scheduledAt、CommandExecution、逐目标失败和 ActionDelivery
  不成为 `PublishProcess` 状态；产品标签映射清晰且 owner 仍可解释。
- [ ] 单次拍照、记录、上传完成或 media ready 不创建家庭发布候选、不启动 30 秒；
  老师可以在待整理批次中高频移出素材而不触发全局 discard。
- [ ] 整理只由本班老师手动点击，或园区可配置的静默期/每日兜底时点触发；Pilot 默认
  10 分钟静默期与 `default send window - 30 分钟` 兜底（17:00 对应 16:30），均使用
  服务端时间并保存 policy head。
- [ ] 一分钟 quiescence 只是自动 trigger 的防打断 gate：正常 10 分钟 idle 已满足；
  兜底 due 后一分钟无用户操作即切批；手动“整理”绕过，不形成独立 trigger。
- [ ] 任一本班老师的采集/增删/选择/编辑或有效 capture-activity lease 重置 gate；
  后台上传/缩略图/heartbeat/provider 进度不重置、不阻塞。默认可在 30 秒～3 分钟配置，
  自动整理启用时不可设为 0。
- [ ] trigger 按 stable source watermark 原子切批；进行中的上传及之后的新拍摄进入
  下一批，相同 trigger exact replay，不能重复创建 PublishProcess。
- [ ] 30 秒快捷调整超时只进入待发送队列，不发布、不产生 Receipt，也不形成 AI
  发布授权；用户开始编辑时暂停推进，scheduler 不得早于该候选的 deadline 发布。
- [ ] pending-release 内容在实际 release commit 前始终可编辑；正在编辑或存在未保存
  revision 的内容不得被定时任务发布。
- [ ] 发布后不设置老师复查窗口或持续修改义务；低频 correction、target visibility
  removal、replacement 与 redaction 能力长期存在并保留审计。
- [ ] 原始班级采集不因存在而自动创建家庭发布或跨边界；只有成为明确的家庭发布候选后
  才进入 `PublishProcess`。
- [ ] `PublishProcess` 不吸收 device upload、AI provider execution、CareInteraction、
  ActionDelivery 或 InstitutionWorkflow 的状态和所有权。
- [ ] 一个共享内容 revision 只需编辑一次，但每个目标 family 的
  `PublicationRelease` 独立绑定 ChildCareProcess、Enrollment、child-scoped Family、
  Grant 与 Receipt；不得用一个跨家庭事务冒充整体成功。
- [ ] 多目标发布返回明确的逐目标结果；一个目标失败不回滚其他合法发布，重试只作用于
  失败或 outcome-unknown 目标且不得重复发布。
- [ ] 首个逐目标 release commit 将 process 转为 released 并冻结共享 revision；部分
  成功通过逐目标结果/派生 summary 表达，零目标提交则保持 pending_release。
- [ ] process 已进入 released 后，未提交目标只能基于冻结的 exact revision
  reconcile/retry；若需要改变共享正文、媒体组合或目标语义，必须创建新的
  `PublishProcess`/replacement，不得回写原 revision。
- [ ] cancelled 仅允许发生在任何 release commit 之前；released 后的 correction、
  target visibility removal、replacement 与 redaction 不倒退主状态。
- [ ] 任一本班老师可以查看和共同处理同一 CareGroup 的 PublishProcess，包括创建、
  发布前调整、异常确认、立即发送和发布前取消；不按创建者形成个人所有权或独占认领。
- [ ] Lead designation、Institution Admin、园区成员身份或 system operator 均不成为
  T-006 内容读取/发布 authority；具备这些身份的人只有同时拥有 exact CareGroup
  caregiver RoleAssignment 时，才以普通本班老师身份操作。
- [ ] CareGroup 是家庭侧业务发送方；creator、editor、reviewer 与 release executor
  分别留存个人审计，但不改变共同责任或扩张班级范围。
- [ ] 草稿使用约 1 秒 debounce 自动保存并明确显示 saving/saved/failed；仅 Nurture
  已提交的 draftRevision 可以进入发布，My-Chat 本地缓冲不能成为发布事实。
- [ ] 一个 process 同时只有一个短期 edit hold；它暂停 scheduler 和其他编辑者，但
  不是个人 owner、authority 或 PublishProcess lifecycle，离开/完成/过期后释放。
- [ ] 每次保存携带 expectedDraftRevision；并发变化明确 conflict/rebase，禁止
  last-write-wins 静默覆盖。
- [ ] pending_release 编辑前必须在线取得 edit hold；离线只允许准备新的本地草稿/
  media，不能声称暂停或修改已经等待发送的服务端 revision。
- [ ] pending_release 本身表达已获得定时发送意图，不要求逐条二次审批；needs_review
  不可发送，“现在发送”的明确点击不再增加确认弹窗。
- [ ] 园区默认发送时段由 T-007 运营管理，T-006 保存解析后的 scheduledAt/notAfter、
  timezone 与 policy head；默认 17:00/19:00 是 Pilot 参数，设备时间不参与判定。
- [ ] 定时执行前重新读取 exact saved revision、edit hold、authorizing caregiver
  RoleAssignment、CareGroup、Enrollment、Grant、targets、media 和 policy；任一漂移
  跳过而非发布旧内容，也不静默换一位老师授权。
- [ ] 自动重试仅发生在 notAfter 前；outcome-unknown 先以原 command identity
  reconcile，逐目标失败只补偿对应目标。超过 notAfter 保持可见待处理状态。
- [ ] media asset 使用 preparing/ready/unavailable/discarded/redacted 业务生命周期；
  child attribution 使用 candidate/confirmed/rejected/superseded，published 不成为
  asset 或 attribution 状态。
- [ ] 发布资格从 exact ready media revision、confirmed attributions、所有可见孩子的
  exposure policy、当前 Grant/scope 和非 redacted 状态实时派生；ready 本身不授权。
- [ ] 从卡片删除默认只 detach 当前 PublishProcess；没有任何 committed release 时可
  显式全局 discarded，存储物理清理由无引用与 retention policy 决定。
- [ ] 发布后“删除”映射为 target visibility removal 或 redaction，后续读取停止展示
  但保留 actor、原 release/Receipt 与审计，不宣称召回已查看内容或通知。
- [ ] 群像照片中所有清晰可见孩子必须 confirmed 且 exposure policy 允许目标 audience；
  未确认/不允许时进入 needs_review，只能纠正归属、移除整张原图、调整目标或拆分
  process；首轮产品不 crop、不 blur。
- [ ] 若不同目标需要不同正文或媒体组合，必须拆成不同 `PublishProcess`，不得在同一
  共享 revision 下隐藏目标特有内容。
- [ ] 发布成功只表示 Nurture 已提交家庭可见事实与 Receipt，不冒充 notification、
  provider 或 device delivery。
- [ ] My-Chat 本地缓存只优化离线/上传体验，不成为授权或 canonical media 状态；
  owner-reread 失败、logout 或相关撤权后不能继续展示受保护缓存内容。
- [ ] domain effect、Receipt 与 CommandExecution 原子提交；重试 exact replay，
  board cache、ActionDelivery 与 AI provider 状态均不能替代 owner-reread。
- [ ] 若 beta profile 包含 G3-C2，`ClassScopedFaceMatch` 只使用当前 exact
  CareGroup、current Enrollment 和当前
  允许用途的头像 reference set；禁止全园/跨班/历史图库匹配及 raw child/family ID、
  姓名进入 matcher。
- [ ] G3-C2 同时满足版本化质量、top-1 与 margin 门槛的结果可以自动 confirmed，不要求老师
  逐张确认；低置信、相似/遮挡、未知或冲突只进入 needs_review，且人工纠正 supersede
  自动结果。
- [ ] G3-C2 原图保持不变；reference template 按班级/用途隔离并加密，照片临时 embedding
  匹配后删除，provider 不得训练、二次使用或写入普通日志。
- [ ] G3-C2 人脸 matcher 默认关闭；专门告知/单独同意与监护人同意、PIPIA、retention、
  撤回、processor contract 和法律/隐私评审任一门禁不满足时回退人工归属。
- [ ] 若实现 G3-B2，可选 AI copy 必须可采用、可修改、可拒绝，且不产生排名或诊断；不得借 D-14
  自动归属例外扩张正文、敏感判断或发布授权。
- [ ] 自动 photo-first 路径不依赖生成式文案：老师文字保持原文，语音使用有 provenance
  的转写，活动/时间/媒体数等通过版本化模板组装；photo-only 可以没有自由正文。
- [ ] 若实现 G3-B2，AI copy 只在老师显式点击“帮我整理一句/润色”或独立日/周总结能力中出现；日常
  自动整理不能静默调用。老师选择采用后才写入当前 draftRevision。
- [ ] G3-B2 生成式文案不得新增事实、情绪、原因、频率、引语或发展结论，不把不确定改成
  确定，也不覆盖老师原文；provider 失败不阻塞原文/转写/模板/photo-only 路径。
- [ ] Nurture 版本化 ContentSafetyPolicy 是最终 route owner；硬规则优先，classifier
  只提供 signals。园区只能收紧，老师可以提高 tier 或修正灰区，不能降低硬门禁。
- [ ] ordinary 可进入 D-10；可纠正的评价性/上下文不明内容进入 needs_review；磕碰/
  事故、健康症状、用药/医疗资料、明显情绪行为冲突、身体隐私/裸露/如厕影像以及
  证件/联系方式进入 direct-interaction-required，不进入自动批量发布。
- [ ] direct-interaction-required 只提供 owner-issued T-005 navigation/action；本班
  老师明确选择 child/family target 后才创建 CareInteraction，T-006 不自动建对话或
  复制敏感 body。
- [ ] 只有 T-005 返回当前 actor/target 可用的专用 caregiver-initiated capability 时，
  T-006 才显示可执行 direct-interaction action；能力尚未交付或不满足门禁时保持内部
  来源并显示安全阻塞，不降级为普通批量发布或现有 family-question action。
- [ ] Stage G2-C 未冻结 exact effect/response/Receipt contract、未进入当前 T-004
  digest 或未通过 qualification 时，T-006 不猜测 capability key/schema，不发布
  占位 action；G3-E 未完成真实 provider/consumer 联合资格验证时不得签发 T-006
  Beta Profile Handoff。
- [ ] G3-C1 人工归属与 exposure 路径完整可用；G3-C2 自动人脸匹配未进入首个 beta
  profile 时可保持 absent/default-off，但不得削弱人工 fallback 或发布资格检查。
- [ ] G3-B1 确定性内容组装在无生成式 provider 时完整可用；G3-B2 AI copy 未实现或
  不可用不阻塞 G3 Exit，若实现则采用后重新经过 ContentSafetyPolicy。
- [ ] T-007 发布策略子合同通过 exact owner contract 解析并固化
  `scheduledAt/notAfter/timezone/policyHead`；后续策略变化不静默移动既有 process。
- [ ] `InstitutionWorkflowProjection` 不可用或无适用 Workflow 时只产生合法空态，
  不阻塞家庭看板、采集、草稿或发布。
- [ ] risk 在 candidate、edit 和 release 时 current-reread；provider 失败/低置信/
  规则冲突不能默认 ordinary，policy drift 立即使既有 draft/pending 失去发布资格，
  但不增加 PublishProcess 状态。
- [ ] My-Chat 可通过公共 view-model 实现看板，无需访问 Nurture persistence。
- [ ] two-stage publish 使用 `PublishProcess`，不因多状态或异步投递被归类为 Workflow。
- [ ] Workflow 信息只通过当前授权的 projection 展示；board 不拥有 Run/Step，也不以
  “相同角色”替代 Workspace/scope/visibility 检查。

## Next Step

G3-A、G3-B1、G3-C1、G3-D 的 domain 与合同层已全部落地，artifact additive 旋转至
`nurture.surface-contract@1.13.0` / `sha256:1919a289…`，shared core 与全部 T-005
slice 保持逐字不变。2026-08-02 的实施质量复核修掉 7 处缺陷，并补上"运行时输出 ↔
已注册 result schema"与"运行时 capability 常量 ↔ 注册表"两层机械检查；同日的
`07-g3-e-implementation-readiness-review.md` 判定 `G3_E_NOT_READY`，记录 B1～B7
七项阻塞。

当前推进的是这份复核给出的准备清单。**B1（DB SSOT delta 与一次性迁移）已完成**：
十个 additive model、五处 extend-in-place delta 落库，迁移带两条 fail-closed 的
legacy 普查 gate（已在一次性 scratch 库上被证伪过），活库枚举身份与全部唯一约束
由 `g3-publish-process-schema.integration.test.ts` 断言。下一步是 B2 owner
repository（十四个端口与 per-target 原子 release），随后 B3 采集读端口、B4 formal
ingress 路由、B5 T-005 direct-interaction consumer action。B6/B7 依赖 T-007
provider 与 T-005 G2-C 联合运行，无法提前拉入。capability activation、部署与流量
仍保持关闭。G3-C2 face match 与 G3-B2 AI copy 是可选增强，不进入首个关键路径。
