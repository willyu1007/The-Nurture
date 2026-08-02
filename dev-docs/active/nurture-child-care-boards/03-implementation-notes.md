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

## 2026-08-02 — G3-A step 1: shared read pipeline and role-safe envelopes

- 新增 `packages/nurture-scenario/src/harness/board-projection.ts`：G3-A 共享
  source-head 管线。它拥有 opaque ref、source head 投影、snapshot 身份、cursor
  身份、行级 authority 谓词、owner-eligibility action 构造器与分页扫描，不持有事实、
  不写入、也不组合跨角色 DTO。
- 新增 `guardian-board-queries.ts`（`query_guardian_current_focus@1.0.0`、
  `query_guardian_enrollment_activity@1.0.0`）与 `caregiver-board-queries.ts`
  （`query_caregiver_child_today@1.0.0`）。两条读路径各自只读本角色可见事实，
  presenter 之后不需要隐藏任何字段。
- 新增 `board-envelopes.ts`：`query_guardian_family_board@1.0.0` 与
  `query_caregiver_teacher_board@1.0.0`。envelope 只输出 module 顺序、counts、
  opaque item refs、current-eligibility actions 与 dependency NO-GO，不复制模块
  payload，也不成为写权威。
- module 顺序不在 presenter 内重新声明：调用方传入已 admit surface 的
  `orderedContentKinds`，测试断言 envelope 顺序等于 `surface-registry.json`
  的精确值，避免出现第二份顺序声明。
- Caregiver envelope 直接调用现有 `query_caregiver_family_care_work@1.1.0`
  （`queryCaregiverFamilyCareWork`），没有 T-006 兼容副本；module 的 actionRefs
  直接来自该 T-005 结果，不重新派生或放宽。
- `teacher_publish_queue` 依赖 G3-B 尚未落地的 publication 事实：module 缺席，
  并以 `t006_publish_process` dependency NO-GO 解释，surface state 为 `limited`。
  Guardian 侧 optional Workflow projection 缺席时不产生 NO-GO、不降级 state，
  避免 optional 成为隐式 gate。
- Caregiver presenter 没有任何可以输出 `institution_workflow_projection` 的分支，
  并额外做了一次显式过滤；测试对序列化结果做负向断言。
- 行级授权是机械的：Guardian 需要 current guardian authority + exact child 关联 +
  Enrollment/Grant 可见性 + purpose 五项全真；Caregiver 需要 current
  `caregiver | lead_caregiver` 且 RoleAssignment 自身 scope 恰为源 CareGroup。
  Institution 级 Lead、Admin、成员或同 Institution 的其他班级角色全部被拒。
- 公开 typed 输入不接受原始标识符：Guardian enrollment activity 只认
  owner-issued `issueTargetOptionRef`；Caregiver 的 CareGroup 由 actor 当前
  RoleAssignment 解析，根本不进入输入。测试同时断言 raw id、他人 ref 与未授权
  target 被拒。
- cursor 身份绑定 contract digest、capability key/version、query key、actor、
  scope ref、order 与 page size，并携带 snapshot ref/version/instant 与 drift head；
  drift head 由 source/authority/correction/redaction/Grant 五个 scope 级 head 派生
  （不含逐页 source heads，否则第二页会被误判为漂移）。任一漂移返回
  `refresh_required`，不拼接两个版本。
- 分页遍历循环至闭合：`scanBoardPage` 在 fact-level policy 丢行后继续扫描直到填满
  或源关闭，continuation key 是"最后真正消费的行"，不是最后一批的末尾；固定 `take`
  会静默返回短页。
- action ref 只有一个构造器 `projectOwnerActions`，输入必须是 owner eligibility
  grant。没有 grant 就没有 action，角色名、模块存在性与缓存结果都无法制造。
- `NurtureFocusGoal` 的 child scope 仍是 06 冻结的 DB delta。本单元通过 port 契约
  的 `child_scope_explicit` 表达它并机械拒绝猜测（payload 带 child 线索但无显式
  scope 事实的行只进 family focus），没有修改 `prisma/schema.prisma`：该模型的写入方
  要到 owner repository 落地时才存在，现在加列会得到一个没有写入方的 schema 列。
- 本步骤没有修改 surface contract source/artifact、Prisma schema、migration、
  environment、capability activation、Candidate、部署或流量。capability 注册与
  conformance fixtures 属于后续步骤。

## 2026-08-02 — G3-A step 2: canonical-owner inline board mutations

- 新增 `src/domain/institution/board-mutation-transaction.ts`：
  `NurtureBoardMutationTransaction` 声明 focus goal 与 daily care 两个 canonical
  owner 的事务写端口，并接入 `NurtureCommandTransaction.boardMutations?`
  （与既有 `familyCare?` 同形）。
- 新增 `src/harness/board-mutations.ts`：`update_guardian_current_focus@1.0.0`
  与 `record_caregiver_daily_care@1.0.0`。每个能力提供 typed input parse、
  owner eligibility、owner-issued target ref 解析、current-head 绑定的 Harness
  confirmation，以及带 `checkPreconditions` / `apply` 的 `NurtureCommandSpec`。
- 看板不是写权威：两个 spec 都在事务内重新读取 canonical owner，head 漂移返回
  `conflict/stale_confirmation`，事务内漂移直接抛错，不会用 board snapshot、
  cache 或客户端 optimistic state 覆盖事实。
- 公开 typed input 是封闭业务字段（`{label, priority}` / `{kind, summary}`），
  不含 target、heads、actor、grant、policy 等 invocation metadata；target 只接受
  owner 签发的 `issueFocusGoalTargetRef` / `issueChildCareProcessTargetRef`。
  测试断言 raw id、他人 ref、跨 kind ref 与未授权 target 全部 `not_authorized`。
- `record_caregiver_daily_care` 的授权谓词与读路径一致：current
  `caregiver | lead_caregiver` + RoleAssignment scope 恰为源 CareGroup +
  enrollment active。Institution Admin、Institution 级 scope 与其他班级都被拒。
- `update_guardian_current_focus` 不会把 family-scope goal 写成 child-scoped：
  `scopeSource` 从 owner 的 `child_scope_explicit` 事实派生，正文写入不改变 scope。
- `record_caregiver_daily_care` 的 committed result 只表示园所内部班级事实，
  不含 receipt/publication/visibility/delivery 字段；测试对序列化结果做负向断言。
  发布资格是 G3-C/G3-D 的独立轴。
- owner repository（Prisma 侧 `boardMutations` 实现）与 formal ingress 的 action
  key 注册属于 owner-integration 阶段，两个 descriptor 因此携带
  `t002_owner_integration` dependency gate；port 缺席时 `checkPreconditions`
  返回 `board_mutation_port_unavailable`，fail closed，不产生半成品效果。
- 本步骤仍未修改 surface contract source/artifact、Prisma schema、migration、
  environment、capability activation、Candidate、部署或流量。

## 2026-08-02 — G3-A step 3: additive contract rotation to 1.9.0

- `capability-registry.json` 的 contract 版本升到 `1.9.0`，新增 7 个 `1.0.0`
  descriptor：`query_guardian_family_board`、`query_guardian_current_focus`、
  `query_guardian_enrollment_activity`、`query_caregiver_teacher_board`、
  `query_caregiver_child_today`、`update_guardian_current_focus`、
  `record_caregiver_daily_care`。生成件为
  `sha256:d769e496692553dd6358eb434f992df09841d3703f968bdf2562b37b9c8ee68c`。
- 旋转是严格 additive：`sharedCoreHash` 与 11 个 T-005 capability slice 哈希、
  6 个 surface slice 哈希全部逐字节不变。按 `compatibility-policy.json` 的
  `additiveNewSlice: preserve_existing_slice_evidence`，T-005 G2 Exit 证据继续成立。
- 新增合同 schema：`board-types.schema.json`（source head、module binding、
  board action ref、paged input 等共享 def）加 7 个 capability schema，全部登记进
  `schema-registry.json`；两个 envelope 的 result 直接 `$ref` 冻结的
  `surface-envelope.schema.json`，不复制第二份 envelope 定义。
- `port-registry.json` 新增 `board_projection_repository`
  （`contract_boundary`）与 `board_mutation_repository`（`owner_integration`），
  以及 7 条 eligibility policy。写侧 repository 的 gate 如实标为 owner_integration。
- 首批合成 board conformance fixtures：扩展
  `journey-expected-view.schema.json`（可选 `boardModules` /
  `absentModuleKinds` / `dependencyNoGos`），并给 gj-2 guardian board 与 gj-5
  caregiver board 两个既有 view 补上模块拓扑。gj-5 的 `surfaceState` 由 `ready`
  改为 `limited`，因为 `teacher_publish_queue` 依赖尚未落地——这正是旋转应当
  暴露出来的真实状态。
- 新增 `phase-3-boards.test.ts` 与 conformance case
  `board-module-topology-and-role-safety`，覆盖 7 个新 capability slice 与两个
  board surface slice。它不只静态校验 fixture：还用真实 presenter 在同一批合成
  事实上重跑，逐项比对模块顺序、required 位、state 与 dependency NO-GO。
- `domainClass` 是 shared-core 枚举，扩展它会触发
  `changedSharedCore: invalidate_all_surface_contract_evidence` 并作废 T-005 的
  归档资格。两个 board mutation 因此使用既有的 care-domain 写入类
  `care_interaction`；它是粗粒度合同轴，不表示 T-005 `CareInteraction` 生命周期，
  隔离由独立 command scope（`board_focus` / `board_daily_care`）、独立 head
  binding 和独立 transaction port 保证，并有 committed-result 负向断言兜底。
- board query 的 `pageSize` 上限从 100 收敛到 20、默认 10，与
  `query-invocation.schema.json` 冻结的 `maximum: 20` 一致；否则领域层会接受一个
  ingress 永远不会放行的页大小。
- `assert-g2-exit-contract.mjs` 与 `assert-g3-0-freeze.mjs` 原本把"当前 artifact"
  钉死在 `1.8.0`，任何 checkpoint 旋转都会让归档任务的守卫失败。两者改为：
  把被资格化的身份当作历史证据（要求归档记录仍然引用它、当前版本不得回退），
  并改为证明旋转确实是 additive（shared core 不变 + 逐个 capability slice 哈希
  不变 + T-005 population 仍在）。守卫因此比原来更强，而不是被放宽。
- `assert-g3-0-freeze.mjs` 的 placeholder 普查也从"全部 proposed key 必须缺席"
  改为"G3-A 已实现的 7 个 key 必须注册在 `1.0.0`，G3-B～G3-D 的 15 个 key 必须
  仍然缺席"，让"只注册已实现 key"这条冻结声明真正有机械兜底。
- 本步骤仍未修改 Prisma schema、migration、environment、capability activation、
  Candidate、部署或流量。

## 2026-08-02 — G3-B1 step 1: capture batch, deterministic assembly and draft lane

- 新增 `care-capture-batch.ts`：D-10 的采集批次与整理 trigger。拍照/记录/上传完成/
  media ready 都不创建家庭发布候选、不启动 30 秒；只有 manual、10 分钟 idle 或
  `default send window - 30 分钟` 兜底三个 trigger 会切批。模块是纯函数,不写入、
  不自带时钟。
- 一分钟 quiescence gate 只作为自动 trigger 的防打断闸门实现:manual 直接绕过;
  idle 由 policy 校验保证 `idle >= gate`,成熟后不再二次等待;兜底 due 后只等这一
  分钟。gate 在自动整理开启时不可为 0,可配置区间 30~180 秒;切为全手动后不参与决策。
- user-activity head 与 machine-progress head 分开存放,`evaluateOrganizeTrigger`
  只读前者。上传百分比、缩略图、心跳与 provider job 因此在类型层面就无法重置 gate,
  并有对应负向测试。
- watermark 取"连续稳定前缀"这个真正的低水位:遇到第一条未稳定采集即停,其后所有
  内容(包括已经稳定的)一起进入下一批。否则一条仍在上传的素材会被跨过并搁浅。
  角色已失效的采集同样被排除。
- trigger evidence 记录 resolved trigger、trigger identity、policy ref/head、
  timezone、gate 参数、观察到的 user-activity head、lease 状态与 watermark,
  不持久化原始设备操作流(有序列化负向断言)。相同 trigger identity exact replay。
- 新增 `content-assembler.ts`：D-15 确定性组装,**没有任何 provider port**。
  老师原文逐字保留(含否定与不确定表述),转写必须带 revision 才能进入正文并保留
  provenance,photo-only 不生成正文。标题/标签只由版本化模板从结构化事实
  (活动名、原图数量、发生日期)组装,不描述情绪或评价。
- 新增 `publish-process.ts`：D-06 五状态机(draft/needs_review/pending_release/
  released/cancelled)与合法转换表;scheduled/sending/failed/delivered/
  partially_released 在类型层面不存在。一次 organize cut 至多产生一个候选,
  process key 由 `careGroup~triggerRequestId` 派生,exact replay 不会建第二张卡。
- 安全路由通过 `ContentSafetyRoutePort` 注入,G3-B1 不实现策略本身:
  `ordinary` → draft 并启动 30 秒;`review_required` → needs_review 且**不**启动
  快捷窗口(否则超时会把异常内容推进队列);`direct_interaction_required` → 完全不
  创建发布候选,只保留内部来源。provider 缺失或抛错一律 fail closed,绝不默认 ordinary。
- 30 秒是交互 posture 不是第六个状态:`evaluateQuickAdjust` 在用户触碰或持有
  edit hold 时暂停,`admitToPendingRelease` 在自身 deadline 之前拒绝入队。
  入队还需要 T-007 解析后的 schedule,provider 缺席时返回 `dependency_no_go`
  fail closed——真正的 schedule 解析与 release 属于 G3-D。
- 新增 `publish-process-editing.ts`：autosave 与 edit hold。`expectedDraftRevision`
  精确匹配才进版本;相同 command identity + 相同 canonical payload 返回原 revision;
  payload 漂移或 revision 漂移一律 conflict,没有 last-write-wins 分支。
  hold 短期可续、不是 authority/owner/state,过期即释放,同班其他老师随后可取得。
  `pending_release` 编辑必须在线持有 hold(离线无法可靠暂停服务端发送)。
- 发现并修掉一个真实泄漏:publish target ref 一开始用 `issueBoardTargetRef`,
  它会把 id 内嵌进 ref,而 publish target 的复合键包含 child/Enrollment/Grant。
  新增 `issueBoardSealedRef` / `resolveBoardSealedRef`——纯 HMAC、不可逆,按 owner
  当前候选集枚举解析,顺带得到"失去访问权的 ref 直接解析不出来"的性质。
  publish process 与 publish target 都改用它。
- `reschedule_publish_process` 需要 T-007 解析后的 schedule 才能验证时间窗,
  provider 缺席时它只能永远 fail closed,那样注册就是占位。该 key 留到
  schedule 解析落地的 checkpoint。
- 本步骤没有修改 surface contract source/artifact、Prisma schema、migration、
  environment、capability activation、Candidate、部署或流量。

## 2026-08-02 — G3-B1 step 2: publish queue, envelope wiring and rotation to 1.10.0

- 新增 `teacher-publish-queue.ts`：`query_teacher_publish_queue@1.0.0`。counts 是
  读取时派生的展示汇总,`targetSummary` 始终同时携带 total 与 released,
  released+partial 因此无法被压成一句"已发布"。`scheduledAt` 只有在真的解析出
  园区发送窗口后才出现。
- caregiver envelope 接上第三个模块,`teacher_publish_queue` 不再缺席。
  dependency NO-GO 从 `t006_teacher_board_projection`(已交付)换成
  `t007_publication_policy`(provider 仍缺席),surface state 仍是 `limited`,
  但理由从"模块没实现"变成了真实的"没有发送窗口"。policy 解析后自动变 `ready`。
- surface artifact additive 旋转到 `nurture.surface-contract@1.10.0` /
  `sha256:40fb7446de386d30cb0418a545128e7b6d15748efcfda6ef4df1944555e62ef4`,
  新增 7 个 `1.0.0` key。`sharedCoreHash` 与全部既有 capability/surface slice
  哈希仍逐字节不变。
- 6 个写能力用 `publish_process` domainClass 与 `publish_process_transition`
  executionClass——这是 T-004 冻结枚举里为发布过程准备的那一格,G3-A 的两个 board
  mutation 当时只能落在 care-domain 那一格。head binding 各自绑定真实依赖:
  save 绑 `draft_revision`,organize 绑 `capture_batch` 与 `content_safety_route`,
  cancel 走 `lifecycle_authority` 的 `cancellable_publish_process`。
- `reschedule_publish_process` 仍未注册:它要验证的时间窗来自 T-007 解析结果,
  provider 缺席时只能永远 fail closed,注册就等于占位。`verify:g3-0-freeze`
  现在把它和 G3-C/G3-D 的 7 个 key 一起列在"必须仍然缺席"里。
- 新增 conformance case `capture-to-draft-deterministic-main-path` 与
  `phase-3-capture-to-draft.test.ts`,覆盖 6 个新写能力 slice。它同时跑真实领域
  路径:采集 → manual 整理切批 → 确定性组装 → draft 候选,断言未稳定上传被推到
  下一批、老师原文逐字保留、photo-only 也能走完,并断言整条路径序列化结果里没有
  任何 suggestion 痕迹。
- phase-2 的 typed-input 检查原先假设每个 capability schema 都在 `/$defs/input`。
  edit hold 的三个能力共用一个文件、指针分别是 `acquireInput`/`renewInput`/
  `releaseInput`,检查因此漏掉了它们。改为按 schema-registry 的 `jsonPointer`
  解析,现在无论文件怎么组织都检查到精确定义。
- phase-3-boards 的 write-action 断言原先只认 `action_execution`;改为接受两种写
  execution class 并显式排除 query,断言意图不变但覆盖了发布过程能力。
- 本步骤仍未修改 Prisma schema、migration、environment、capability activation、
  Candidate、部署或流量。

## 2026-08-02 — G3-C1 manual content and media safety path

- 新增 `content-safety-policy.ts`：Nurture 拥有的版本化 `ContentSafetyPolicy`。
  确定性硬规则先跑,institution overlay、classifier 与老师三层都只能经由 `raise`
  参与,类型上不存在任何下调分支。D-15 的六类 direct-interaction 与四类
  review 灰区落成稳定 marker key。
- classifier 不拥有 route:`null` 表示根本没有 classifier(确定性路径合法地保持
  ordinary);出现但 `unavailable`/`malformed`/`low_confidence`/低于置信下限,
  表示"该到的意见没到",按可纠正不确定性抬到 `review_required`,绝不落回 ordinary。
- 老师可以抬 tier;`isTeacherCorrectable` 明确区分"灰区可改文案后重判"与
  "命中硬规则不可下调"。审计只留 policy/rule/provider/model/prompt revision、
  marker 与 source head,序列化结果里没有 body 与任何 chain-of-thought(有负向断言)。
- 新增 `media-attribution.ts`：media asset 与 child attribution 两条独立轴。
  `preparing/ready/unavailable/discarded/redacted` 与
  `candidate/confirmed/rejected/superseded` 各自封闭,`published` 不出现在任何一条上。
  confirmed 只能被 supersede,不能被 reject —— 否则会抹掉已确认历史。
- 一次性 legacy 迁移映射按冻结件 fail closed:`active` 无歧义;
  `hidden`/`deleted` 必须带 release 证据才映射到 `redacted`/`discarded`,
  否则 `ambiguous` 卡住迁移门禁而不是猜。attribution 的 `corrected` 必须有
  supersession link,`hidden`/`deleted` 必须有显式 `resolved_as` + evidence。
- 三个手工能力 `confirm/reject/supersede_child_media_attribution` 全部只接受
  owner 签发的 sealed ref:media asset 与 child 各一个,raw id 与他人 ref 都解析
  不出来。supersede 追加两条记录(原条 superseded + 新条 confirmed),纠正结果
  一律记为 `manual`,不继承被纠正的 `automatic_face_match` 来源。
- 新增 `publish-eligibility.ts`：发布资格永远派生,类型里没有可持久化的
  `publishable`。群像门禁按 D-12 实现——任一清晰可见孩子未知或未确认、或目标
  audience 的 exposure policy 不允许,就进 `needs_review`,并且只提供四条解法:
  纠正归属、整图移出候选、移除目标、拆分 process。不 crop、不 blur、不生成变体,
  发布始终绑定 exact original revision(有序列化负向断言)。
- 逐目标派生:一个家庭因 Grant 失效被挡住不会取消其他合法目标,
  `targets[]` 各自带 blocking reasons。
- 产品"删除"按阶段拆开:`evaluateMediaDetach` 只影响当前 draft 的组合;
  `evaluateMediaDiscard` 只在零 committed release 时合法,并返回受影响草稿数。
  发布后的 target removal / redaction 属于 G3-D。
- **冻结件缺口**:G3-C1 的 adoption set 只保留了三个 attribution key,
  没有为 media detach / global discard 预留能力身份。两者的领域规则已实现并测试,
  但没有注册未被冻结件保留的 key。需要在 G3-D 或一次 freeze 增补里补上这两个身份。
- surface artifact additive 旋转到 `nurture.surface-contract@1.11.0` /
  `sha256:7da487390ae4278347e64959ae4795b856eeee38a92d3230e4e209a7fc403f8e`;
  `sharedCoreHash` 与全部既有 slice 哈希仍逐字节不变。
- attribution 三件套用 `care_interaction` domainClass:它是 media owner 持有的
  照护事实,被发布资格消费,但不是 publish process 状态。与 G3-B1 的六个
  `publish_process` transition 保持区分。
- `verify:g3-0-freeze` 新增一条 C2 负向普查:capability registry 里不得存在任何
  含 `face_match` / `biometric` 的能力身份。conformance 侧
  `phase-3-media-safety.test.ts` 另外断言 manifest 里没有
  `ClassScopedFaceMatch` / `face_reference` / `embedding` 字样。
- 本步骤仍未修改 Prisma schema、migration、environment、capability activation、
  Candidate、部署或流量。media/attribution 的 DB delta 与 owner repository 一起落。
