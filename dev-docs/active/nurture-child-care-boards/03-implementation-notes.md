# Implementation Notes — 儿童照护双看板

## 2026-07-29 — Task package created

- 创建 T-006 规划包。
- 将 Guardian family board 与 Caregiver teacher board 归为“同一事实、不同投影”的一个任务。
- 锁定 two-stage publish、AI 人工确认和 anti-ranking 边界。
- 当前无代码、schema 或 presenter 变更。

## 2026-07-29 — Workflow terminology and projection boundary aligned

- two-stage publish 统一命名为 `PublishProcess`，不属于当前园区管理 Workflow。
- Guardian/Caregiver board 可以消费与当前角色相关的
  `InstitutionWorkflowProjection` 外部切片，但不拥有 Workflow Run/Step。
- “相同角色”不是充分权限；projection 仍由 Workspace/scope/visibility policy 过滤。
- 当前仅更新规划文档，无代码、schema 或 presenter 变更。

## 2026-07-29 — D-01 operable shared projection boundary locked

- 用户确认双看板共享 canonical facts、模块语义、provenance、snapshot 与投影管线，
  但不新增持久化统一 child-state，也不使用跨角色超级 DTO。
- Guardian 与 Caregiver 使用角色独立的查询策略、fact-level policy 与 public
  presenter；不得先读取完整跨角色事实再在最终响应隐藏字段。
- “read snapshot 非 canonical”不等于“看板只读”。看板是可操作的领域投影窗口，
  允许低打扰内联微调。
- 展示偏好由 surface/host preference 承担；草稿、AI suggestion 与发布时间调整进入
  `PublishProcess`；attribution、focus 等业务调整调用对应 canonical owner capability。
- 已跨边界发布的内容不允许静默覆盖，继续使用明确的 correction、withdrawal、
  redaction 或 replacement 语义。
- 修改完成后通过 invalidation 与 owner-reread 重新投影；客户端 optimistic state
  不能成为权限、Receipt、ActionDelivery 或其他查询的事实来源。
- 当前只更新 T-006 规划合同，无应用代码、schema、数据库或 presenter 变更。

## 2026-07-29 — D-02 PublishProcess purpose boundary locked

- 用户确认 `PublishProcess` 是 caregiver-side 的家庭内容发布领域过程，不是终端产品
  需要暴露的功能名称。
- 它从一条园所内部采集被明确选为家庭发布候选时开始，管理 AI suggestion、归属、
  草稿微调、review、发送时机与发布前取消。
- 拍照、录入或上传成功本身不创建家庭发布；普通班级内部记录可以不进入
  `PublishProcess`。
- 过程在 Nurture 原子提交家庭可见发布事实与 Receipt，或发布前取消时结束。
- 它不拥有 device/upload、AI provider job、T-005 CareInteraction、My-Chat
  ActionDelivery 或 InstitutionWorkflow 的状态。
- AI 只建议；Guardian 只消费授权结果；scheduler/worker 只执行已获业务授权的技术
  调用，不能成为内容作者或审批人。
- 发布后通过 correction/replacement/redaction 等明确 capability 追加事实，不静默
  覆盖已发布内容。
- 当前只更新 T-006 规划合同，无应用代码、schema、数据库或 presenter 变更。

## 2026-07-29 — D-03 domain fact separation locked

- 用户确认“领域分离”表示 focus、daily care、attention、media、publication 与
  CareInteraction 按业务含义保留独立 canonical facts、lifecycle、authority 和
  mutation capability，不只是 UI 内容类型分类。
- Guardian/Caregiver presenter 可以把多个事实组合进同一语义卡片或模块，但组合结果
  不成为新的万能 board item；每次修改仍回到原 canonical owner。
- 当前只更新 T-006 规划合同，无应用代码、schema、数据库或 presenter 变更。

## 2026-07-29 — D-10/D-11 pre-publication adjustment posture locked

- AI 整理后的普通、高置信候选提供默认 30 秒快捷调整窗口；用户开始编辑即暂停推进，
  超时只进入 pending-release queue，不发布、不产生 Receipt。
- 低置信、归属不明确或可修正敏感灰区不自动推进，进入人工处理区；后续 D-15 进一步
  将 direct-interaction-required 排除在批量发布之外。
- pending-release 内容在实际 publish 前持续可编辑，不要求逐条二次审批；正在编辑或
  存在未保存 revision 时跳过当前发布批次。
- 发布后不创建 5 分钟/24 小时快捷窗口、复查队列或老师持续运营义务。
- correction、target visibility removal、replacement 与 redaction 作为低频、长期有效
  的安全 capability 保留；已读内容或已发通知不声明召回。
- 少量可纠正错误是减少普通内容逐条审核负担的产品假设，不是跨家庭授权、敏感内容自动
  发布或教师评分的依据。
- 当前只更新 T-006 规划合同，无应用代码、schema、数据库或 presenter 变更。

## 2026-07-29 — D-05 publication unit and fan-out locked

- 用户确认 HTML 的一个内容卡片关联多个家庭目标体验保持不变；该卡片对应一个共享编辑
  的 `PublishProcess`，老师不需要按家庭重复编辑相同内容。
- 实际发布拆为逐目标 `PublicationRelease`，分别绑定精确 ChildCareProcess、
  Enrollment、child-scoped Family、原 Grant、authority evidence、publication ref 与
  Receipt；My-Chat guardian/device fan-out 属于后续 ActionDelivery。
- 多目标发布不是跨家庭事务。一个目标失败不回滚其他合法目标，响应返回逐目标结果；
  只对失败或 outcome-unknown 目标重试，已提交 release 必须 exact replay。
- target 使用 Nurture owner-issued opaque ref；客户端和 AI 不发送或推断 raw
  child/family ID。
- 需要不同正文或 media 组合的目标拆成不同 `PublishProcess`；process 级家庭数量
  只是展示汇总，不能替代逐目标 authority 或 Receipt。
- 当前只更新 T-006 规划合同，无应用代码、schema、数据库或 presenter 变更。

## 2026-07-29 — D-13 My-Chat local media cache boundary locked

- My-Chat owns 受保护本地缓存、缩略图、离线上传队列、上传进度/重试与 native
  permission，并按 account/Workspace/scenario 隔离，提供 TTL、容量和 logout 清理。
- Nurture 不接收本地路径或镜像上传进度；它从稳定 media ref 开始拥有业务 asset
  lifecycle、child attribution、publish eligibility、visibility 与 redaction。
- 本地缓存只优化离线与性能，不能授权；相关撤权或 owner-reread denial 后不得继续
  渲染为当前可见事实。
- 当前只更新 T-006 规划合同，无应用代码、schema、数据库或 presenter 变更。

## 2026-07-29 — D-06 minimal PublishProcess state machine locked

- 用户确认 `PublishProcess` 使用 draft / needs_review / pending_release / released /
  cancelled 五个业务状态。
- needs_review 只用于低置信、归属不明确或可修正敏感灰区，不给普通内容增加逐条人工
  审核；D-15 direct-interaction-required 不进入批量路径，pending_release 在实际
  commit 前持续可编辑。
- 首个逐目标 release commit 将共享 revision 冻结并使 process 进入 released。部分
  成功由逐目标结果和派生 summary 表达，不新增 partially_released 主状态；零目标
  commit 时保持 pending_release。
- cancelled 仅限任何目标尚未 commit 前；released 后的 correction、visibility
  removal、replacement/redaction 不回退 process lifecycle。
- 30 秒 timer、scheduledAt、CommandExecution、rejected/outcome-unknown 与
  ActionDelivery 均由各自 owner 表达，不进入 process 主状态机。
- 当前只更新 T-006 规划合同，无应用代码、schema、数据库或 presenter 变更。

## 2026-07-30 — D-07 exact CareGroup caregiver boundary locked

- 用户确认 Lead 作为园区日常运营管理概念保留，但不放入 T-006 的查看、review、发布
  或安全处置权限。
- T-006 只认当前 exact CareGroup 的合格 caregiver，产品简称“本班老师”。同班老师
  共同创建、编辑、处理 needs_review、立即发送、发布前取消和执行低频发布后安全动作，
  不产生 creator-only owner、personal claim 或 Lead 审核门槛。
- CareGroup 是家庭侧业务发送方；个人 creator/editor/reviewer/release executor 与
  safety executor 分别保留审计和可选次级署名。
- Institution Admin、Lead、园区成员或 system operator 不能替代 exact CareGroup
  caregiver；同一人只有另行持有该 caregiver RoleAssignment 时才能以本班老师身份
  操作。
- 需要园区级处理的异常转入 T-007 InstitutionWorkflow/workbench 边界，不扩张
  PublishProcess。
- 当前只更新 T-006 规划合同，无应用代码、schema、数据库或 presenter 变更。

## 2026-07-30 — D-08 autosave and edit coordination locked

- 用户确认 Nurture 拥有服务端 PublishProcess draft/revision；My-Chat 只提供受保护
  local working buffer 和离线新草稿体验，local buffer 不能授权或成为发布依据。
- 编辑默认约 1 秒 debounce 自动保存并显示 saving/saved/failed；离开前 flush，失败时
  明确 stay/retry 或 discard local changes。
- 每次保存绑定 expectedDraftRevision；head drift 明确 conflict/rebase，禁止
  last-write-wins 或直接 patch board snapshot。
- 同一 process 同时只有一个短期、可续期 edit hold。它暂停其他编辑者和 scheduler，
  但不是个人 owner、claim、authority 或 PublishProcess state；完成、离开或过期后
  释放。
- 只有 Nurture 已提交的 exact draftRevision 可以发布。pending_release 必须在线取得
  hold 后编辑；离线只允许准备尚未进入服务端待发送队列的新草稿/media。
- 当前只更新 T-006 规划合同，无应用代码、schema、数据库或 presenter 变更。

## 2026-07-30 — D-09 manual and scheduled release locked

- 用户确认 pending_release 即表示定时发送意图，不增加逐条二次审批；needs_review
  不可发送，“现在发送”的明确点击不再增加确认弹窗。
- 默认使用园区当地 17:00 scheduledAt 与 19:00 notAfter。T-007 管理园区默认策略，
  T-006 保存每个 process 的解析时间、timezone、policy head 和 authorizing caregiver。
- 编辑保存把发送意图重绑定到新 exact draftRevision 和当前 editor RoleAssignment；
  active hold、saving/failed、conflict 或任何 owner/policy/target/media drift 阻止发送。
- scheduler 使用服务端时钟并在 notAfter 前 exact retry；outcome-unknown 先 reconcile，
  partial failure 只重试对应目标，不能静默换老师或重复已提交 release。
- 超过 notAfter 不深夜发布、不顺延、不丢弃，继续留队并投影 missed-send attention。
- My-Chat quiet hours/provider/device delivery 仍属于 ActionDelivery，不改变 Nurture
  business release time。
- 当前只更新 T-006 规划合同，无应用代码、schema、数据库或 presenter 变更。

## 2026-07-30 — D-12 media lifecycle and deletion locked

- 用户确认 media asset、child attribution 与 PublicationRelease 保持三轴分离。
  asset 使用 preparing/ready/unavailable/discarded/redacted；attribution 使用
  candidate/confirmed/rejected/superseded。
- publish eligibility 从 exact ready revision、所有可见孩子 confirmed attribution、
  target exposure policy、Grant/scope/policy 与 non-redacted 状态派生；ready 不授权。
- 群像存在未知、未确认或不允许目标 audience 看到的孩子时进入 needs_review；后续
  D-14 已将解决方式收敛为人工纠正、整图移除、目标调整或拆分，首轮不 crop/blur。
- 产品删除分为当前卡片 detach、无 committed release 时的全局 discarded、发布后的
  target visibility removal/redaction。业务终止不硬删 Receipt/audit，storage bytes
  仅在无引用且 retention/privacy policy 允许后异步清理。
- 现有 T-002 media/attribution 状态只作为实现来源，后续必须明确映射或通过 DB SSOT
  扩展；当前未授权 schema 变更。
- 当前只更新 T-006 规划合同，无应用代码、schema、数据库或 presenter 变更。

## 2026-07-30 — D-10 capture, trigger and quiescence semantics locked

- 用户指出连续活动中老师会先多拍、再决定发哪些，并频繁移出素材；因此单张拍照、
  上传完成或 media ready 不得直接启动 30 秒，也不得立即创建家庭发布候选。
- 原始记录先进入当前 CareGroup 待整理批次。老师可以随时点原型中的“整理”；自动
  trigger 由园区策略定义，Pilot 默认“最后一次稳定采集/增删后静默 10 分钟”与当地
  `default send window - 30 分钟` 每日兜底（17:00 对应 16:30），任一均可关闭或
  调整，也可全手动。
- 用户确认增加独立的一分钟 capture-quiescence gate：它只判断“现在切批是否打断
  老师”，不是另一种 trigger。10 分钟 idle 已自然满足；兜底先标记 due，连续一分钟
  无用户操作后切批，不再等待完整 10 分钟。
- 任一本班老师的照片/文字/语音、增删/选择/编辑或有效 capture-activity lease 重置
  gate。后台上传百分比、缩略图、heartbeat/provider 进度不重置、不阻塞；未稳定内容
  根据 watermark 进入下一批。
- manual organize 明确表达立即整理，绕过 gate。gate 默认 60 秒，园区可在
  30 秒～3 分钟内配置；启用任何自动 trigger 时不可设为 0。
- trigger 使用服务端时间并按 stable source watermark 原子切批；仍在上传/保存及
  watermark 之后的新拍摄进入下一批，不重置或污染已经切出的 organizer input。
- organizer 结果只有提交为普通、高置信 draft 后才启动 30 秒；触碰/取得 edit hold
  暂停推进，超时只进入 pending_release，scheduler 不得早于该候选 deadline 发布。
- 产品倒计时文案改为“30 秒后进入待发送”；HTML 原“发布”只保留视觉参考，不作为
  跨边界语义。
- 当前只更新 T-006 规划合同，无应用代码、schema、数据库或 presenter 变更。

## 2026-07-30 — D-14 class-scoped automatic face match locked

- 用户确认首轮不修改照片、不 crop、不 blur、不生成发布用视觉变体；人脸检测/特征
  提取/匹配仍属于敏感个人信息处理，继续受独立启用门禁约束。
- 使用专用、版本化 `ClassScopedFaceMatch` 将 exact original-media revision 与当前
  exact CareGroup/current Enrollment 中当前允许该用途的孩子头像 reference set 匹配，
  不使用全园、跨班、离园历史库或跨照片 history match。
- 同时满足质量、top-1 与 top-1/top-2 margin profile 的高置信结果可以自动 confirmed，
  不要求老师逐张确认；低置信、遮挡、相似面孔、未知或冲突进入 needs_review，只让
  老师处理异常。
- matcher 只消费 owner-issued opaque refs/revisions，不接收 raw child/family IDs、
  姓名或家庭关系；自动结果记录 avatar/reference-set/matcher/threshold revisions 和
  最小化 evidence，人工纠正 supersede 原 attribution。
- reference embeddings 按 exact CareGroup/purpose 加密隔离，照片临时 embeddings
  匹配后删除；provider 不得训练、二次使用、跨目的关联或写入普通日志。
- capability 默认关闭；专门目的/必要性、显著告知、单独同意与监护人同意、PIPIA、
  retention、撤回、processor contract 和正式法律/隐私评审未齐时回退人工归属。
- 该决策明确覆盖 T-002/T-003 中“识别只能给 candidate、必须老师逐张确认”以及
  “可用 crop/blur 解决”的旧产品假设；后续实现若需状态/证据字段必须走 DB SSOT，
  当前未授权 schema 变更。
- 当前只更新 T-006 规划合同，无应用代码、schema、数据库或 presenter 变更。

## 2026-07-30 — D-15 content assembly and safety routing locked

- 用户确认日常自动整理不需要生成式 AI 文案。系统优先使用老师原文、My-Chat 语音转写
  和活动/时间/原图数量等版本化模板；photo-only 卡片允许没有自由正文。
- organizer 继续负责聚类、选择原图、关联活动/孩子/目标，但 copy provider failure
  不得阻塞确定性组装或 D-10 普通内容路径。
- AI copy 只在本班老师显式点击“帮我整理一句/润色”，或独立日/周总结能力中出现；
  结果是 suggestion，老师选择采用后才写入当前 PublishProcess draftRevision，不自动
  覆盖原文。
- 生成式 copy 必须绑定 exact source refs 与 provider/model/prompt-policy revision，
  不新增事实、情绪、原因、频率、引语或发展结论，不改变不确定性，不保存
  chain-of-thought。
- 用户确认内容安全仍覆盖原文、转写、模板、照片和可选 AI copy；Nurture 版本化
  ContentSafetyPolicy 是最终 route owner，硬规则优先，classifier 只产生 signals。
- 安全路由派生 ordinary / review-required / direct-interaction-required，不新增
  PublishProcess state。普通内容进入 D-10，可纠正灰区进入 needs_review。
- 磕碰/事故、健康症状、用药/医疗资料、明显情绪行为冲突、身体隐私/裸露/如厕影像、
  证件/联系方式等 direct-interaction 内容不进入自动批量发布；本班老师明确选择
  child/family target 后通过 owner-issued action 进入 T-005 CareInteraction。
- T-006 只提供安全 navigation/action，不自动创建 T-005 或复制敏感 body。园区只可
  收紧，老师可提高 tier/修正灰区，不能降低硬门禁；provider failure/低置信/冲突不
  默认 ordinary。
- candidate/edit/release 都 current-reread risk heads；policy drift 使既有
  draft/pending 失去 publish eligibility，但不增加 process 状态。
- 当前只更新 T-006 规划合同，无应用代码、schema、数据库或 presenter 变更。

## 2026-07-29 — D-17 through D-22 correctness spine locked

- 锁定 T-004 Harness、typed concurrency heads、current owner/policy reread、
  effect/Receipt/CommandExecution 原子提交与 exact replay/reconcile。
- published 与 My-Chat ActionDelivery 分离；notification/provider/device 状态不能冒充
  Nurture business commit。
- envelope/cursor 绑定 exact contract/snapshot/source heads；cache 只优化不授权，
  状态漂移后 refresh/rebase。
- D-05 已固定共享内容 work unit 与逐目标 release；correctness spine 按每条 release
  执行 owner-reread、原子提交、Receipt 和 exact replay/reconcile。
- 当前只更新 T-006 规划合同，无应用代码、schema、数据库或 presenter 变更。

## 2026-07-30 — T-006 top-level decision package closed

- 对六份 T-006 任务文档、F-003 semantic brief、T-004 Harness/术语合同、T-005
  CareInteraction/change contract、T-003 UX 输入与 T-002 owner/media 基线完成整包
  交叉复核。
- 五状态 `PublishProcess`、逐目标 release、整理触发、30 秒入队、发布前持续编辑、
  media/attribution/publication 三轴、安全路由、角色授权与 Receipt/ActionDelivery
  边界未发现互相冲突的顶层产品判断。
- 收紧 released+partial 语义：首个 release 后共享 revision 冻结，剩余目标只能按 exact
  revision retry/reconcile；正文、媒体组合或目标语义变化创建新
  `PublishProcess`/replacement。
- 明确 T-006 publication correction 与 T-005 exact-author Message correction 是不同
  canonical capability，避免“同班共同责任”越权修改 T-005 作者事实。
- 明确 direct-interaction 路由依赖 T-005 后续专用 caregiver-initiated capability；
  现有会拒绝健康/用药等输入的普通 family-question action 不可被静默复用。
- 决策编号 D-04、D-16 是未使用间隙，不是遗漏项；在 2026-07-30 顶层决策关闭时，
  任务仍为 `planned`，且尚未进入 Phase 0 inventory。该历史状态已由 2026-08-02
  G3-0 freeze 记录取代。
- 当前只更新规划/治理文档，无应用代码、schema、数据库或 presenter 变更。

## Current Implementation Follow-ups

- G3-A 按 G3-0 freeze 实现双层 envelope/module query、共享 source-head pipeline 与
  Guardian/Caregiver 独立 presenter；不得通过 presenter 私下注入合同未允许的模块。
- G3-A conformance 先以当前 exact `nurture.surface-contract@1.8.0` 为基线，仅在对应
  slice 实现并具备可重复证据后轮转合同。届时必须把 G3-0 verifier 从“能力尚未落地”
  census 更新为 landed-slice validation，不能长期保留必然失败的检查点守卫。
- G3-0 已冻结 DB delta；实际 Prisma schema/migration 分别随相关 G3-B/G3-C slice
  实施，并在改动前按 repo-prisma SSOT 流程重新执行 migration census。
- G3-D/G3-E 仍以 T-007 owner-issued publication-policy provider 和真实联合资格证据为
  准入门；不得用 pending owner 或 safe-unavailable 占位完成 Exit。
- G3-B2 explicit AI copy 与 G3-C2 face match 在首个 beta profile 中保持 optional、
  absent/default-off；只有完成对应合同轮转和隐私/法律 gate 后才能启用。

## 2026-07-30 — Stage G3 delivery structure accepted

- 用户确认 Stage G3 复用 T-006，并按 G3-A Shared Board Foundation、G3-B
  Capture-to-Draft、G3-C Content/Media Safety、G3-D Publish and Release、G3-E
  Integration Qualification 五组交付。
- G3-A～C 在 G3-0 contract/fact/schema freeze 后依赖感知并行；G3-D 消费 B 的
  saved revision 与 C 的 publish eligibility；G3-E 汇合真实 owner/provider/
  consumer/ingress evidence。
- T-005 G2-C provider qualification 不等待 T-006 整体，避免循环依赖；T-006 G3-E
  必须完成 direct-interaction 真实联合资格验证，不能以 safe-unavailable 占位完成。
- G3-C1 manual attribution/exposure/needs-review 是必需路径；G3-C2
  `ClassScopedFaceMatch` 在 C1 contract 稳定后实现，可与 G3-D 并行。首个 beta
  profile 未列 required 时 optional/default-off，不阻塞 Exit；真实启用仍需 biometric
  privacy/legal gates。
- G3-B1 deterministic teacher-text/transcript/template/photo-only assembly 是必需路径；
  G3-B2 explicit AI copy 是可选增强，不阻塞 Exit，采用后必须形成新 revision 并
  重新安全判定。
- T-007 publication-policy subset 是 G3-D/E 硬依赖，但 T-007 全任务不是前置；
  `InstitutionWorkflowProjection` 是按 profile 选择的只读模块，absence/empty 不
  阻塞核心双看板/发布旅程。
- 当前只更新规划/架构/验证合同，无应用代码、schema、migration、database、
  environment、Candidate、activation 或 traffic 变更。

## 2026-07-30 — Stage G3 overall audit accepted

- 用户要求整体确认 Stage G3；审查覆盖 goal closure、A～E 完整性、ownership、
  serial/parallel path、required/optional lanes、T-005/T-007/T-008 dependencies 与
  final Exit。
- 结论为 `PASS`，没有需要重新打开的顶层产品或架构决策。
- G3-0 只冻结 exact query/capability/module keys、Board Envelope/module payload、
  cursor/source heads、T-002 reuse/DB delta、T-005/T-007 contract versions 与 fixtures。
- G3-A 的共享 Envelope + typed modules 是当前一致方向；具体组合 query 与
  module-query topology 留给 G3-0，只要不创建 super DTO、第二事实源或 snapshot
  mutation authority。
- 当前只更新文档与治理状态，无代码、schema、migration、database、environment、
  Candidate、activation 或 traffic 变更。

## 2026-07-31 — Acceptance-to-check mapping accepted

- 用户确认验收条目机械化映射方案：G3-0 及 G3-A～E 各组冻结时为该组验收条目分配
  稳定 `T006-AC-###` ID，逐条映射到 conformance fixture、negative case、
  unit/integration test、lint/静态检查或 evidence census 之一；不可机械验证的条目
  显式降级为 `design_note`。
- 未映射条目不得勾选；各组资格化与 G3-E PASS 依据是映射检查通过。回链使用
  T-004 conformance manifest 的 AC 引用字段。详见 `01-plan.md`
  Acceptance-to-Check Mapping 小节。本次只更新规划文档，无代码或 schema 变更。

## 2026-08-02 — G3-0 fact/contract/schema freeze passed

- T-006 从 `planned` 切为 `in-progress`，编排继续复用 `M-002 > F-003 > T-006`；
  未创建重复 task 或 bundle。
- 新增 `06-g3-0-fact-contract-schema-freeze.md`，冻结 T-002 facts/authority reuse、
  Guardian/Caregiver 两层 envelope/module query topology、source heads/cursor、
  owner mutation 边界与单次 DB SSOT delta。
- T-003 的“今日一瞥/当前关注/成长线/今日班级/收件箱/班级流/整理队列”已逐项映射到
  当前 T-004 module 与 canonical facts；旧群聊、15 秒发布等已 supersede 语义未进入
  实现合同。
- exact dependency 固定为 `nurture.surface-contract@1.8.0` / `4fe91e…`、
  `initiate_caregiver_direct_message@1.0.0` 与
  `nurture.institution-publication-policy@1.0.0`。T-005 action 直接消费，不创建
  T-006 wrapper 或普通 family-question fallback。
- 发现 exact `1.8.0` 的 Caregiver visibility 与规划级 MAY 不一致：当前合同明确
  deny `institution_workflow_projection`。首个 profile 已固定 Caregiver excluded、
  Guardian optional/absent-empty；未来采用要求显式 contract rotation，消除双轨。
- T-002 media/attribution lifecycle 与 G3 语义不等价，冻结为 extend-in-place +
  evidence-backed migration；禁止新建 G3 平行媒体表或猜测 legacy hidden/deleted。
- 首个 profile 明确 B1/C1 required，B2 absent、C2 optional/default-off；T-007 provider
  qualification 与 G3-E 保持 gated。
- 新增 `scripts/assert-g3-0-freeze.mjs` 与 `pnpm verify:g3-0-freeze`，机械覆盖
  `T006-AC-001`～`T006-AC-010`。首轮比较器错误地把 JSON 键顺序当语义，已改为
  递归 canonicalize；重跑通过。
- 本阶段没有修改 Prisma schema、migration、surface registry/runtime、环境值、
  capability activation、Candidate、部署或流量。
