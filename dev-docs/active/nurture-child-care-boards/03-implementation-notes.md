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

## 2026-08-02 — G3-0 adoption-set amendment: media lifecycle identities

- 按用户决定,把 G3-C1 记录的缺口以增补方式补进 06 冻结件的 Capability
  Adoption Set:`detach_publish_process_media` 与 `discard_media_asset` 加入
  G3-D 一行,与 post-release safety 能力同批交付。
- 增补写成 06 文档里的显式 `Amendment 2026-08-02` 小节而不是静默改列表:
  记录缺口成因(adoption set 按事实模型枚举,漏掉了产品映射里"删除的三个阶段"
  这类动作)、两个 key 各自的 stage boundary,并明确声明 verdict、exact inputs、
  authority predicates、surface topology 与 DB SSOT delta 均未改变。
- 明确写下它们是**发布前**动作:与 G3-D 同批只是交付排期,因为共用逐目标
  release 事实与 safety-action 复核。`discard_media_asset` 恰恰是"一旦有
  release commit 就不再合法"的那个动作,不是 post-release 能力。
- `assert-g3-0-freeze.mjs` 新增 adoption-set 完整性普查:从冻结件里解析该章节的
  全部 capability 身份,要求每个要么已按 `1.0.0` 注册,要么显式列在未实现清单里
  (T-005 直接消费的 `initiate_caregiver_direct_message` 单列)。当前 19 个身份
  全部有归属。删掉任一跟踪项会让守卫失败——已实测。
- 这条普查正是原缺口缺少的那层兜底:此前"冻结件写了但没人跟踪"只能靠人读文档
  发现,现在是机械失败。
- 两个新 key 同时加入 `verify:g3-0-freeze` 的未实现清单与
  `phase-3-capture-to-draft.test.ts` 的"后续 checkpoint 拥有、当前必须缺席"断言,
  所以在 G3-D 真正实现之前它们不可能被提前注册。
- 本步骤没有注册任何能力、没有旋转 artifact,也没有修改 Prisma schema、
  migration、environment、capability activation、Candidate、部署或流量。

## 2026-08-02 — G3-D publish and release loop

- 新增 `publish-schedule.ts`：按 `nurture.institution-publication-policy@1.0.0`
  精确消费 T-007 契约。园区当地 17:00/19:00 用服务端时钟 + IANA timezone 解析成
  UTC instant,offset 应用两次以正确跨 DST。process 进入队列时冻结
  scheduledAt/notAfter/timezone/policyRef/policyHead/policyVersion。
- `scheduleAfterPolicyChange` 显式返回 `moved: false`:后续 policy 变化只标记
  `policyDrift`,永远不移动已冻结的窗口。过了当日 cutoff 才排队的内容取次日窗口
  ——那是首次解析,不是 D-09 禁止的"错过后静默顺延"。
- `evaluateSchedulerAttempt` 把每一条 drift 都做成独立 skip 原因:hold、未保存
  revision、授权老师角色失效、policy 漂移、快捷窗口未结束。超过 notAfter 优先返回
  `missed`,内容留队并提示 missed-send,不深夜发布也不顺延。
- 新增 `publication-release.ts`：一个共享 revision 扇出成逐目标
  `PublicationRelease`。每个目标独立 authority 检查、独立 Receipt、独立重试;
  一个家庭被拒不回滚已提交的家庭(有专门测试),被拒目标根本不会到达 commit port。
- 首个 commit 冻结共享 revision 并把 process 置为 released;零提交保持
  pending_release 且不标 released。已提交目标 exact replay 为
  `already_committed`,released 状态下重试绑定 `frozen_revision` 而不是更新的
  `current_revision`。
- `rejected`(授权/资格)与 `outcome_unknown`(结果未知)严格分开:
  `derivePartialReleaseFollowUp` 分别给出 retry 与 reconcile 列表,并声明
  `sharedRevisionEditable=false` / `requiresNewProcessForContentChange=true`。
  summary 的四个计数始终同时出现,不存在把 partial 说成"已发布"的形状。
- scheduler 受 `[scheduledAt, notAfter)` 约束;老师的"现在发送"是显式动作,
  不受 cutoff 约束(D-09 明确允许错过窗口后"现在发送"),但仍要过全部 eligibility。
- 新增 `publication-safety.ts`：`correct_publication`、
  `remove_publication_target_visibility`、`redact_publication` 全部 append-only,
  事件携带 `preservedReceiptRef` 与 `sourceReleaseRevision`;没有任何过期窗口
  (有一条"一年后仍可执行"的测试),序列化结果里没有 recall/unsend/delivered
  之类的字样。reason 是封闭 key 集,审计不留自由文本。
- 同文件实现 adoption-set 增补的两个 key:`detach_publish_process_media`
  只改当前草稿的组合,`discard_media_asset` 只在零 committed release 时合法。
- artifact additive 旋转到 `nurture.surface-contract@1.12.0` /
  `sha256:a9dcd5c89b0671fc89a0de618375c85b667742bf96ae27a9f66498eb8e3ca29f`,
  35 个 capability。`sharedCoreHash` 与全部既有 slice 哈希仍逐字节不变。
- `release_publish_process` 是唯一 `action_delivery_candidate` 的能力;
  其余全部 `none`——发布提交不等于投递。release 与 reschedule 带
  `t007_publication_policy@joint_conformance` gate,发布后安全能力**不带**该 gate,
  确保 provider 缺席时降低可见性的动作依然可用(有测试)。
- G3 adoption set 至此关闭。`verify:g3-0-freeze` 的未实现清单清空,并新增
  `g3d-adopted=7`;`phase-3-capture-to-draft.test.ts` 原本的"后续 checkpoint
  拥有、必须缺席"断言改成反方向的更强断言:注册表里不得出现任何冻结件未保留的
  T-006 能力身份。两个方向的检查现在同时存在。
- 本步骤仍未修改 Prisma schema、migration、environment、capability activation、
  Candidate、部署或流量。T-007 provider 与真实 schedule/release 资格化仍属 G3-E。

## 2026-08-02 — implementation quality pass over G3-A～G3-D

用户要求在 G3-E readiness review 之前先检查已完成实施的质量。发现并修复的问题:

- **公开 target ref 在模块之间不一致(真实缺陷)**。draft 卡片用
  `issueBoardSealedRef` 发 publish target ref,而 eligibility 与 release 用
  `issueBoardOpaqueRef` —— 两者 HMAC 命名空间不同,同一个目标得到两个不同的 ref,
  客户端无法把草稿上的目标与发布结果对应起来。现在统一为
  `issuePublishTargetRef`(display-only 用 opaque)。
- **publication ref 发出去就用不回来(真实缺陷)**。release 结果与 safety event
  发的是 opaque ref,而 `remove_publication_target_visibility` 解析的是 sealed ref
  —— 客户端拿到的 publicationRef 永远无法回传。现在统一为 `issuePublicationRef`
  (sealed,因为它确实被当作输入接受),并移到 `publish-process.ts` 以免 release
  lane 为了给 publication 命名而反向依赖 safety lane。
- **发布队列的 counts 是"本页计数"而非队列全量**。字段名与 schema 描述都在说
  队列级摘要,实现却在 `project` 里逐行累加,分页后语义错误。改为由 owner 端口
  提供 `state_counts` 队列级普查,测试也改成"页只有 1 条但 counts 是 9/2/4/7/1"。
- **scheduler 拒绝为 released+partial 重试**。release lane 允许 released 状态重试
  未提交目标,但 `evaluateSchedulerAttempt` 直接 `not_queued` 跳过,两者矛盾。
  新增 `has_uncommitted_targets`,released 且仍有未提交目标时允许 attempt。
- **零目标发布会产出违反合同的结果**。schema 要求 `results` 至少一条、
  `summary.total >= 1`,但 release 未校验空目标集。补上 `no_eligible_target` 守卫。
- **`admitToPendingRelease` 与 schedule resolver 没有接上**。B1 留的
  `resolved_schedule_available: boolean` 接缝在 G3-D 之后仍悬空。函数移入
  `publish-schedule.ts` 并直接消费 `ScheduleResolutionV1`,成功时返回冻结窗口;
  顺带删掉一个永远不会命中的 `needs_review` 死分支。
- **`organize_care_capture_batch` 的已注册 result 没有任何生产者**。
  `evaluateOrganizeTrigger` 返回 trigger 决策,与合同 result 形状不同。新增
  `projectOrganizeResult`。
- 清理:删除 `QUIESCENCE_BOUNDS` 死导出;统一 `evaluateMediaDiscard` 与
  `evaluateMediaDetach` 的签名;简化 assembler 里把 media 与文本混算的尺寸守卫。

补上的两层缺失兜底:

- **运行时 ↔ schema 一致性**。每个 checkpoint 都声称"typed module result",但从来
  没有任何检查把真实运行时输出喂给已注册的 result schema。新增
  `phase-3-typed-results.test.ts`:为**每个**已注册 T-006 capability 准备一个
  运行时生产者,用 Ajv 按 descriptor 的 `resultSchemaRef` 校验实际 payload
  (`status` 属于 invocation envelope,不进 payload)。没有生产者的 capability
  直接让普查失败,所以不可能再发布一个运行时无法满足的 result 形状。
  它已登记为 conformance case `typed-result-runtime-conformance`。
- **运行时 capability 常量 ↔ 注册表**。19 个 `*_CAPABILITY` 常量此前无人引用,
  没有任何检查保证它们与注册表的 key/version 一致。同一套件现在断言双向绑定:
  每个常量必须对应一个同版本 descriptor,每个 T-006 capability 必须有常量命名它。

这次新增的检查立刻抓到一个既有 schema 缺陷:`query-guardian-current-focus` 的
`focusCard` 用 `if/then` 声明 `required: [childRef, childSafeLabel]` 却没有在该
子 schema 里声明这两个属性,严格模式编译失败。原验证器只编译它实际校验的文档,
从未编译到这个指针,所以一直没暴露。已改为两个分支各自声明所约束的属性
(`then` 声明 + `else` 用 `false` 禁止)。

修复导致 artifact additive 旋转到 `nurture.surface-contract@1.13.0` /
`sha256:1919a289cabdd9018db83100867dd1985caf6510a7a900e8a1fc654521e26aef`;
capability 数量与 shared core 不变,全部既有 slice 哈希不变。

新增 `07-g3-e-implementation-readiness-review.md`,结论 `G3_E_NOT_READY`。

## 2026-08-02 — G3-E prerequisite B1: DB SSOT delta landed

`07-g3-e-implementation-readiness-review.md` 的第一顺位阻塞项。冻结文档列出的十个
additive fact model 与五个 extend-in-place delta 此前只存在于文档,`prisma/schema.prisma`
里一个都没有;domain 层的 legacy 映射器早已 fail-closed,但没有迁移可以调用它们。

落地内容:

- **Extend in place**。`NurtureMediaAssetStatus` 退役为
  `NurtureMediaAssetLifecycle{preparing,ready,unavailable,discarded,redacted}`,
  `NurtureMediaAttributionStatus` 退役为
  `NurtureChildAttributionState{candidate,confirmed,rejected,superseded}`;
  `NurtureMediaAssetRef` 增 `mediaRevision`(不可变原件的确切版本,永不原地更改),
  `NurtureChildMediaAttribution` 改为 append-only:`attributionRevision` +
  `supersededByAttributionId` 自引用 + `(workspace,asset,process,revision)` 唯一。
  `NurtureGrantDataClass += child_growth_record`、
  `NurtureChildLinkReceiptSourceType += publication_release`。
- **十个 additive model**。`NurtureFocusGoalChildScope` 是"child focus 必须显式"
  的存储形态:family-scope 目标存零行,读侧没有任何可以被误读为 child 绑定的东西。
  其余九个覆盖采集批次、PublishProcess 及其 revision/target/edit hold、
  ContentSafetyAssessment、per-target release 与 post-release visibility event。
- **约束而非约定**。业务不变量全部落到唯一索引上:批次 trigger 身份重放不会切出
  第二个批次;watermark 所依据的 `sourceSequence` 在批次内唯一;一个 PublishProcess
  只有一个 edit hold;一个 target 只能提交一次 release(`publishProcessTargetId`
  唯一,换一个 command 身份也不放行);revision 号一次性,已发布的 revision 不会
  被新草稿覆盖。

**迁移不猜**。`prisma migrate dev` 是交互式的,改用
`prisma migrate diff --from-migrations --to-schema-datamodel --shadow-database-url`
生成再手改:生成器给出的 `DROP COLUMN status` + `ADD COLUMN lifecycle NOT NULL`
会把 legacy `hidden`/`deleted` 静默塞进某个值。替换为「加可空列 → 回填无歧义值 →
普查剩余 NULL → 有则 `RAISE EXCEPTION` 中止」,两条 gate 分别对应
`mapLegacyMediaAssetStatus`(`hidden`/`deleted` 需要 committed release 证据才能
判 `redacted` 还是 `discarded`)与 `mapLegacyAttributionStatus`
(`corrected` 需要 supersession 链,`hidden`/`deleted` 需要显式 resolution 证据)。

gate 是被证伪过的,不是声明:在一次性 scratch 库 `nurture_gate` 上插入一行 legacy
`hidden` media 后重放迁移,得到
`ERROR: g3 media lifecycle migration gate: 1 legacy hidden/deleted media rows lack
release evidence; resolve the pre-migration census before applying`,迁移整体回滚。
scratch 库随后销毁。

**副作用一处**:`NurtureGrantDataClass` 的 domain 联合类型(`institution-context.ts`)
不在 Prisma 生成物里,增枚举后两侧不再可赋值,typecheck 直接抓到并补齐。

DB 覆盖为新增的 `g3-publish-process-schema.integration.test.ts`,断言的是**活库**
事实而不是 schema 文本:`pg_enum` 里新枚举标签逐字冻结、两个 legacy 类型确实消失
(不是与新枚举并存)、T-005 既有 data class 的标签与顺序未被扰动,以及上面每一条
唯一约束的拒绝(按 Prisma `P2002` 的列清单断言,不匹配消息串)。

顺带被这套测试抓到的既有约束交互:T-005 的 `ck_nurture_receipt_route_lifecycle`
同样管辖新的 `publication_release` source type —— 一条 delivered 的发布 Receipt
必须带齐 grant/enrollment/data class/target scope/delivered_at,少一项即被拒。
B2 的 `commitTargetRelease` 必须按这个形状写 Receipt,测试里已同时留下正反两例。

## 2026-08-02 — G3-E prerequisite B2-1: G3-A owner repositories

复核清单第二项(十四个端口零实现)的第一段:G3-A lane 的五个端口落地在
`packages/nurture-db/src/repositories/`。

- `board-read-support.ts` —— 共享的 owner 侧读支撑。核心是 **census**:
  `(行数, 最新 updatedAt)`。任何插入/更新/软删都会让二者之一移动,所以由它算出的
  head 恰好在底层集合变化时失效,而不需要把行本身读出来。另有
  `activeRoleWindow`:role assignment 只在 `status=active` **且**处于自身
  `startsAt/endsAt` 窗口内才算权限——只看 status 列会把已到期的角色当成现行授权。
- `guardian-board.read.ts` —— Guardian scope/current focus/enrollment activity。
  child focus 只由显式的 `NurtureFocusGoalChildScope` 行产生,`goalPayload` 里
  提到某个孩子不会被提升为 child scope(DB 测试用一个带 child 提示的 payload
  正面证伪)。enrollment activity 只列出 `visibility=visible` 的 per-target
  release;daily care 的 `release_id` 用的是让它到达家庭的路由事实,而不是伪造
  一个 publication。
- `caregiver-board.read.ts` —— 只有 **CareGroup 作用域**的 caregiver 角色能读到
  看板;institution 作用域不被放宽,兄弟班也不行。owner 的 attention 优先级
  (`normal/attention/time_sensitive`)与看板的(`routine/attention/urgent`)是两套
  词汇,用 `satisfies` 约束的显式映射表转换——新增 owner 值会编译失败,而不是
  静默显示成最不紧急的一档。`publication_policy_resolved` 只在 institution
  确实固化了 T-007 policy ref 时为真,缺失即未解析,不存在默认窗口。
- `board-mutation.transaction.ts` —— 两个 prepare 期 eligibility 读端口,加上
  canonical-owner 写事务。写的是 owner 行本身:focus goal 的 update 把
  `expected_focus_goal_version` 放进 **filter**,并发写只会匹配到零行而抛错,
  不会静默胜出;daily care 按 kind 选择 owner 的对应 payload 列,未知 kind 直接
  拒绝而不是落一条所有列都空的日志。

drift head 的口径:`grant_head` 与 `source_head` 是分开的,DB 测试证明撤销一个
Grant 会移动 grant head 而 source head 保持不变——即"仅凭授权变化就能让打开的
分页失效",不需要借助无关的源变化。

**一处已知限制**:`NurtureFamily` 与 `NurtureChildCareProcess` 是一对一,所以
有两个孩子的 Guardian 会 reach 到两个 family,而 G3-A 的看板契约只有一个 family
scope。实现绑定到创建时间最早的那个 family,并且**只**取该 family 的 enrollment
(混合会把一个 family 的标签盖在另一个 family 的活动上)。这条已记入 07 复核。

## 2026-08-02 — B1 落地时暴露的既有约束交互

`ck_nurture_grant_scope` 要求撤销 Grant 时同时写 `revoked_at` 与
`revoked_by_participant_id`;`ck_nurture_receipt_route_lifecycle` 要求 delivered
Receipt 带齐 grant/enrollment/data class/target scope/`delivered_at`。两条都不是
T-006 新增的,但 T-006 的 release 与 drift 路径都要穿过它们,已在 DB 测试里各留
一条正例。

## 2026-08-02 — G3-E prerequisite B2-2 与 B3:发布队列 lane 与采集读端口

`publish-lane.read.ts` 一次实现四个端口(队列、edit hold、draft、cancel),因为它们
读的是同一个 `NurturePublishProcess` 聚合,拆开只会重复三遍"actor 是否还够得着
这个班"的判定。

- **class-shared work**。权限按精确源 CareGroup 判,而不是"谁建的卡"。同班同事
  持有 edit hold 不会削弱读者对该卡的权限——测试同时断言 `current_hold` 指向同事
  且读者自己的 `role_scope_matches_source` 仍为真。
- **队列普查是队列级的**。`state_counts` 用 `groupBy` 对整个 CareGroup 统计,与
  当前页无关;测试用 `take: 1` 的页配 4 条队列证明二者不同。这是质量复核里修掉的
  那个缺陷在 owner 侧的对应实现。
- **protected content 边界保持默认关闭**。队列标题来自已保存 revision 的
  `titleProtectionPayload`。构造函数里的 `ProtectedContentWritePort` 是可选的:
  没有密钥时标题为空串,而不是把密文塞进公开结果。
- **过期的 hold 就是没有 hold**,并且读取它不会隐式续期(测试读后回查 `expiresAt`
  仍在过去)。
- **`known_source_refs` 只来自 owner 自己记下的那份**(当前 revision 的
  `sourceRefsPayload`)。payload 形状不对时返回空数组而不是"部分已知集合"——
  部分集合会让一个本应被拒的 ref 意外通过。
- **精确 command 重放**由 owner 按 `organizerInputRevision` 找回那次写下的
  revision,而不是再写一条。

B3(采集 lane 没有声明读端口)一并关闭:在 `care-capture-batch.ts` 里声明
`CaptureBatchReadPort` / `CaptureOrganizeSourceV1`,并加 `resolveOrganizeTrigger`
把"通过 owner 端口取源 → 交给 `evaluateOrganizeTrigger`"这条边界写死;policy 仍是
调用方输入,它来自 T-007 而不是采集 owner。`care-capture.read.ts` 的实现是纯读:
不开批次、不推进批次、不碰 activity lease,测试在读之后回查 `state` /
`watermarkSourceSequence` / `cutAt` 全部未动。owner 只报告它对每条 capture 是否
真的握有持久 head(`stable`),稳定前缀的切分留在 domain evaluator。

## 2026-08-02 — G3-E prerequisite B2-3:媒体与内容安全端口

三个端口(`ContentSafetySourceReadPort`、`MediaAttributionReadPort`、
`MediaLifecycleReadPort`)合在 `media-safety.read.ts`,它们读的是同一批媒体聚合。

**落地时撞到一个冻结件的缺口,已按 amendment 流程补上。**
`ContentSafetySourceReadPort` 要求 owner 返回它"从确切来源推导出的确定性 marker",
但冻结的事实集里没有地方放这个事实:`NurtureCareCapture` / `NurtureMediaAssetRef`
存的是受保护内容与生命周期,`NurtureContentSafetyAssessment` 存的是路由**结果**
而不是每个来源的输入。读时现推意味着在 owner 仓储里解封正文、并把规则词汇搬出
domain,两者都不能接受。于是新增

- `NurtureCareCapture.safety_markers_payload`
- `NurtureMediaAssetRef.safety_markers_payload`

两列**故意可空**:`NULL` 是"从未推导过",与"推导过、没有命中"是两个不同的事实。
端口对前者整体 fail closed,所以任何历史行都不会被静默当作 ordinary 内容。
迁移 `20260802130000_g3_content_safety_markers` 纯加法;冻结件加了
`Amendment 2026-08-02 — content safety marker facts`;守卫新增
`safety_markers=nullable`(同时断言两张表都有该列且保持可空——把列改成 NOT NULL
会让"未推导"这个事实消失)。

**同时修掉一处 fail-open**。`evaluateContentSafetyRoute` 里 `hardRuleTier` 返回
undefined 的 marker 被 `continue` 丢掉了。这意味着更新版 policy 的规则键在旧构建里
会被当成"没有规则",路由静默停在 `ordinary`——正是 `raise` 这套设计要防的降级。
改为:未识别 marker 抬到 `review_required`(不确定是可纠正的),risk code 记
`unrecognised_marker` 这个有界词汇,未知键本身绝不进入 risk code 列表。

端口本身的几条:

- **一个读不到的来源让整次推导失败**,而不是只对其余来源出具结论——那等于对
  没人评估过的内容发了判定。请求的 source id 只要有一个不属于本 CareGroup 或
  查无此行,直接返回 `null`。
- **institution 没有固化安全 policy 就没有路由**,不存在默认门槛。
- **归属只能落在本班孩子**;兄弟班的孩子无论在照片里多显眼都不是归属目标。
  owner 的 `face_reference/history_match/system` 与 domain 的
  `manual/organizer_candidate/automatic_face_match` 是两套词汇,用 `satisfies`
  约束的显式映射转换——`face_reference` 绝不能显示成老师的手动决定。
- **全局 discard 能看见所有还在引用该资产的未发布草稿**(按 current revision 的
  `mediaCompositionPayload` 统计),已发布的卡不算"会丢内容的草稿"。payload 形状
  不对时算零引用而不是部分集合。

## 2026-08-02 — G3-E prerequisite B2-4:per-target 原子发布与 post-release safety

B2 的最后两个端口。`commitTargetRelease` 是整个 T-006 里唯一"三件事必须同时落地"
的位置:目标的 `PublicationRelease`、它的逻辑 Receipt、以及不可变的
`CommandExecution`。半落地比失败更糟——家庭手里会有一条没有回执的发布,或者一条
背后什么都没有的审计行——所以三次写共用一个事务。

**per-target 的命令身份**。一次发布尝试要覆盖一个 process 的全部目标,但
`CommandExecution` 在 `(workspace, commandRequestIdHash)` 上唯一,第二个目标会直接
撞上第一个。所以提交身份是 per (attempt, target):
`publicationReleaseCommandIdentity(commandRequestId, targetKey)`;attempt 级的身份
走 `parentCommandRequestIdHash`——那一列本来就是记这个的。domain 断言的"一次尝试
的所有目标共享同一 command 身份"仍然成立,成立在 `command_request_id` 这一层。

两个身份函数是导出的,不是内部细节:测试要用它去**真的**制造一次冲突来证明回滚,
如果测试自己复制一遍哈希字面量,实现改了字面量之后冲突就不再发生,那条原子性断言
会静默变成空断言。

**原子性是被证伪过的**。测试先占住该目标将要认领的确切提交身份,让事务内的审计
写在另外两条已经发出之后失败,然后断言 release / receipt 计数都回到 0,且 process
仍是 `pending_release`、`frozenRevisionId` 仍为 null。

**精确重放**返回原次提交的 refs 且不写任何东西(前后三张表计数完全相同);换一个
command 打同一个已发布目标则是 `already_released`。捕获到的唯一约束冲突映射成
`already_released`,其余异常一律 `outcome_unknown`——调用方必须去对账,而不是假定
已经回滚。

**又撞到两条既有 CHECK**,都不是 T-006 新增的:
`ck_nurture_command_execution_handoff_v2` / `_n1` 要求 `output_refs` 与
`target_refs` 是 canonical ref **数组**、`handoff_request_snapshots_payload` 必须
是数组且为空时 driver ref 为 null。发布不参与任何 Workflow handoff,所以快照列表
留空、无 driver ref;两个 ref 列写成 canonical ref 数组。

**顺带修掉一处跨 lane 的读法分歧**:`mediaCompositionPayload` 被 media lane 与
release lane 各读了一遍,一边期望 `{mediaAssetIds:[...]}`、一边期望
`{media:[{mediaAssetId,mediaRevision}]}`——正是质量复核里"同一概念两个不可互换
实现"那一类。统一为 `board-read-support.ts` 里的单一 `readMediaComposition`,
形状带 revision(release lane 确实需要它),两边共用。

其余判定:目标资格按**当前** Grant 判(撤销一个 Grant 只挡它自己的目标);
schedule 只有在 owner 记全了 T-007 合同固定的每一个字段时才算已解析,半记录的
schedule 不是窗口;已提交的目标在 `loadReleaseFacts` 里带 `already_committed`,
重试因此去对账而不是重复提交;post-release safety 没有有效期窗口,被 redact 的
publication 仍然可寻址,Receipt 与审计从不删除。

## 2026-08-02 — owner 层实施质量复核:14 项修复与两层跨界检验

B1～B2-4 全部通过闸门,但闸门覆盖不到的地方有 6 处会产生错误行为的缺陷、4 处伪造
或死掉的事实、4 处结构问题。按顺序修完:

**会产生错误行为**

1. **一次被否决的归属会让该媒体永久不可发布**。`rejected` 时我省略了
   `child_care_process_id`,而规则对"clearly_visible 但无 id"的判定是
   `unknown_visible_child`,直接挡掉所有目标。但 `rejected` 的语义是老师说了
   "这不是那个孩子"——它根本不是可见儿童义务。改为直接从 `visible_children` 里
   剔除。顺带把 `clearly_visible` 的口径写清楚:owner 只为它识别出的孩子建行,
   没人归属的人脸根本没有行,所以现存的每一行都是清晰可见的孩子。
2. **`data_class` 把所有非成长记录折叠成 `daily_care_log`**。改为在查询层就只取
   两个可发布 data class,其余的既不进队列也不进普查——**排除**而不是贴上一个
   它没有的类别,后者正是 fallback 分支会干的事。
   *(2026-08-02 更正:这一改只落在 publish 队列 lane。guardian 活动 lane 里同一
   个兜底还在,把非成长记录的发布显示成 `media`,由独立复核发现后才补上。上面那句
   "改为"读起来像一次全局修复,实际只是一处。)*
3. **media 类型的 capture 被当成 `teacher_text`**。安全策略按 fact kind 路由。
   改为 `satisfies` 约束的显式全映射。
4. **两条 lane 的行序与声明的语义序不符**。这条最深:声明的 order 首项
   (`child_label_asc` / `state_rank_asc`)根本不是 cursor 能续页的键。给
   `BoardSortKeyV1` 加了可选的 `rank` 首项,两个 lane 的 sortKey 带上它,owner
   按声明序出行并把"严格晚于此位置"写成展开的字典序比较(方向混合,无法用单个
   行比较表达)。发布队列的 state rank 直接用枚举声明序——Postgres 的枚举排序就是
   我们要的优先级。
5. **全局 discard 统计了无关的 release**。改为只统计"自身冻结 composition 里
   含这个资产"的 release;否则班级发布过任何东西就再也 discard 不掉任何资产。
6. **队列对 released / cancelled 照样发 `save_publish_process_draft`**。改为按
   process state 判定——否则是 **owner 自己**在制造它已经没有的资格。

**伪造或死掉的事实**:删掉 `exposure_allows_child_ids` 那段化简后恒等于
`[目标自己的孩子]`、却写得像实现了一条规则的死计算;发布队列的 source head 从
"本页形状"改为 scope 级普查(随页大小变化的 head 不是 source head);删掉
`nonEmpty` 空操作与无人使用的 `EMPTY_CENSUS`。

**结构**:四份 `resolveCaregiverReach` 合并为一份共享实现(以后修一处只会修到
一份);scope 普查改用数据库 `aggregate`,不再为算普查把全班日志拉进内存;
`has_unsaved_revision` 恒为 `false` 并写明 owner 只持有已保存的 revision,
用 `currentRevisionId === null` 回答的是另一个问题;schedule 未解析时不再返回
`null`(会被归类成 `target_unavailable`),改为 `schedule: null` 加上 release lane
新的 `schedule_unavailable` 拒绝码——只有 scheduler 依赖窗口,老师显式发送不受影响。

### 两层跨界检验

现有测试大多在一侧闭环:domain 套件拿手写事实喂规则,owner 套件拿手写期望对仓储。
两者都抓不到"owner 的答序和它 binding 宣称的 order 不是一回事",也抓不到"每条
owner 事实单看都合理、合起来让规则得出错误结论"。新增
`g3-owner-domain-boundary.integration.test.ts`:

- **答序 ↔ 声明序**:比较器**从 binding 发布的 order 字符串解析出来**,不是手写的。
  手写比较器在常量改掉之后仍然会通过,那正是这层检查要抓的漂移。三条分页 lane
  各验一遍,caregiver lane 还验了续页不重不漏。
- **owner 事实 ↔ 消费它的规则**:把真实的 `ReleaseFactsV1` 喂给
  `derivePublishEligibility`,验证被否决的归属不再挡、他班孩子的合影仍然挡、
  未确认候选与 media revision 漂移仍然挡、撤销的 Grant 只挡它自己的目标。

第一层检查立刻抓到一处新漂移:三个仓储把 `before` 的形状**内联重写**成
`{occurred_at,id}`,而接口用的是 `BoardSortKeyV1`——所以接口新加的 `rank` 项在
仓储侧被静默丢掉了。已改为共用接口类型。

## 2026-08-02 — G3-E prerequisite B4-1:query lane 接入 formal ingress

B4 是"24 个 T-006 key 都不可达 formal ingress"。它拆成两段:**只有引擎真能服务的
key 才准入**——在 transport 放行一个引擎接不住的 key,就是冻结件禁止的占位。
本单元是 query lane 的 6 个 key,端到端打通;18 个写 key 留给 B4-2。

**准入改为 per-capability 精确版本。** 原实现是 `capabilityKeys === QUERY_SET ?
"1.1.0" : "1.0.0"`——**按 lane** 定版本。T-005 的三个 query 在 `1.1.0`,T-006 的
六个在 `1.0.0`,同一条 lane 上按 lane 定版本必然把其中一批放行在它从未注册过的
版本上,这与"exact key/version 准入,不接受范围与回退"直接冲突。改为
`key → 唯一准入版本` 的映射,35 个 capability 各自一行。

**守卫改为从注册表推导普查**,而不是钉死一份字面量清单:

- 每个被路由的 key 必须在注册表里、且**版本逐字相同**;
- query lane 的 key 必须是注册的 query,action lane 的必须不是;
- 注册但尚未路由的 key 必须**逐个列出**——少列(悄悄掉了路由)与多列(已路由却
  仍写着未路由)都会失败。18 个写 key 现在是显式的未路由清单,不是沉默。

两个方向都被证伪过:删掉一个已路由 query key,守卫报出它出现在"未路由"集合;
把 `query_caregiver_child_today` 的准入版本改成 `1.1.0`,守卫报出与注册表不符。

**引擎接的是真实 owner 端口**,不是桩:六个 query 分别走
`PrismaGuardianBoardReadPort` / `PrismaCaregiverBoardReadPort` /
`PrismaPublishLaneReadPort`。合同身份与模块顺序从制品本身读:新增
`loadSurfaceContractPin()` 与 `loadBoardSurfaceRegistration()`——ingress 不持有
任何可能与制品漂移的字面量副本。

顺带修掉一处既有的 fall-through:原来 query 分发把"不是前两个 key"的一切都当作
`query_family_care_item` 处理。加进新 key 之后,那会让一个 board query 走进 item
detail 分支返回无关结果。现在每个 key 各自显式匹配。

## 2026-08-02 — G3-E prerequisite B4-2:两个可路由的写 key,以及剩下 16 个的真实阻塞

**先解决了一个设计问题**:12 个 T-006 写 capability 的 `confirmationPolicy` 是
`direct_commit`,看上去像"不需要 prepare"。但冻结的 `ExecuteActionInvocationV1`
**required 里就有 `confirmationRef`**,而且整个 envelope 没有 `typedInput`。所以
`direct_commit` 描述的是**确认的 UX 强度**(不需要额外的用户确认步骤、没有强门),
不是"跳过 prepare"。全部 18 个写 key 都走 prepare → execute,与 T-005 同形,合同
一个字都不用改。

**本单元路由了两个**:`update_guardian_current_focus` 与
`record_caregiver_daily_care`。它们是 18 个里唯二已经具备完整写链路的——
prepare 函数、`NurtureCommandSpec`、以及 owner 侧事务都在 G3-A 与 B2-1 里落过。
顺带把 `PrismaBoardMutationTransaction` 接进 `PrismaNurtureCommandTransaction` 的
`boardMutations`——此前它虽然实现了却没有被命令事务持有,spec 的
`checkPreconditions` 会直接返回 `board_mutation_port_unavailable`。

DB e2e 走真实 ingress + 真实 PostgreSQL:焦点更新落在 focus goal 的 owner 行上
(`aggregateVersion` +1),并留下 `businessOutcome=applied` 的不可变审计行;日常
照护记录落在 owner 的 per-kind 列;同一个 target ref 换成没有 caregiver 角色的
Guardian 就不再解析。board query 侧也在同一条 ingress 上验了:envelope 绑定的是
从制品 pin 读出的合同身份,家庭焦点不会变成 child focus,响应里不含任何原始 id。

守卫相应放宽了一处**过紧**的断言:T-005 的 8 个 action key 原来是与已路由集合
**相等**,那样任何新写 key 都无法路由。改为**包含**——那 8 个永远不许离开
ingress,但 action lane 预期会随 T-006 增长。同时把 OpenAPI 的两个 action enum 与
query enum 都绑到已路由映射上:公布的 enum 与实际准入漂移,等于对调用方说谎。

### 剩下 16 个写 key 的真实阻塞

它们**不是**"只差路由"。这 16 个 domain 函数(edit hold、draft、cancel、
attribution、publication safety、release/reschedule)都是**纯决策函数**——返回
decision,不写任何东西。要经 execute 提交,每个都还缺两层:

1. **owner 侧写事务**。B2 建的是读端口,写只有两条:board mutation 与 per-target
   release。没有"获取 edit hold""保存草稿""确认归属""redact publication"的
   owner 写。
2. **`NurtureCommandSpec`**。execute 通过 `NurtureCommandRunner` 提交并留下
   `CommandExecution`;这 16 个没有 spec,也就没有可提交的命令。

在 transport 放行一个引擎接不住的 key,就是冻结件禁止的占位,所以它们仍在守卫的
显式"未路由"清单里(现在 16 个)。这层缺口在原始复核里被算进了 B2/B4,实际上是
独立的一段工作,已记入 07 作为 B8。

## 2026-08-02 — 独立复核抓到的三条:公开结果泄露原始 id,以及一条被静默删除的约束

三个只读子智能体（设计侦察 / 对抗复核 / owner write 枚举）并行审阅了 B1～B4。
最重的三条都由**对抗复核**发现——我自己没找到,我上一轮加的跨界检查也没覆盖。

**A2 — 每个 board action ref 明文携带它本该藏住的 id。** `issueBoardTargetRef`
返回 `${version}.${kind}.${id}.${tag}`,而 `caregiver-board.read.ts` 把
`childCareProcessId` 喂给 action grant。于是同一张卡上同时出现 `childRef`
(opaque,存在的理由就是藏这个 id)和 `targetOptionRef`(明文含同一个 id)。
`board-projection.ts` 自己的注释写着"原始 child 标识符绝不进入公开 typed result"。

修法不是给它打补丁,而是**删掉明文那一对**,全部收敛到已有的 sealed 发放器——
"一个概念一个发放器"是上一轮已经立过的规则,这里是它的第二次应验。sealed 解析要
对着 owner 当前的候选集重算,顺带得到一个明文 ref 根本表达不了的性质:**actor 失去
资格后,已签发的 ref 自动停止解析**。

一条既有单测把泄露格式**当成契约钉死了**
(`expect.stringMatching(/^1\.focus_goal\.goal-1\./)`)。它不是没覆盖到,它是把缺陷
写进了期望值。

**A3 — cursor 是签名的,不是密封的。** 载荷只是 base64url,**不需要密钥就能解**。
实测解出 `{ rank: 'Li Ming', id: 'ccp-…RAW-UUID' }`。`pageInfo.nextCursor` 是公开
结果的一部分。发布队列 lane 同理:`processRef` 是 sealed 的,而 cursor 里带着明文
`process_key`。

而且**是我把它变严重的**:上一轮为修排序缺陷,我往 sort key 里加了
`rank = child_safe_label`——把孩子的名字加进了一个明文可解的载荷。

改为 AES-256-GCM 密封,密钥由 integrity key 与 actor scope 派生,所以一个 participant
的 cursor 连解密都不可能发生在另一个 participant 身上。GCM 边解密边认证,篡改的
cursor 在解密处就抛错,而不是先解出一个调用方还得去怀疑的 binding。

**A1 — 我在 B1 静默删掉了一条 T-005 的 CHECK。** `DROP COLUMN "status"` 会连带删除
所有引用该列的约束,`ck_nurture_media_attribution_confirmation` 就此消失,没有任何
东西按 `state` 重建它。丢掉的保证是:`confirmed` 的归属必须带齐 confirming role、
时间戳与 exposure policy,且 confidence ∈ [0,1]。

活库普查:迁移史声明过 14 条 CHECK,缺 3 条——两条是有意被取代的(n1 → handoff_v1
→ v2),**第三条是这次的回归**。而且当时库里 71 条 confirmed 归属**全部违规**,
全是我的测试写进去的:测试自己也在依赖这个洞。

重建迁移用 `NOT VALID` + `VALIDATE`,所以约束缺席期间写下的任何行会让迁移**响亮
失败**,而不是被既往不咎。

**补上防住这一类的检查。** 既有守卫 `assert-n1-schema-contract.mjs` 仍断言这条约束
存在并且通过——因为它 grep 的是冻结的基线 SQL 文本,不是活库。新增
`schema-constraint-survival.integration.test.ts`:迁移史里声明过的每条 CHECK 都必须
在**数据库里**活着,除非在一张显式的"已被取代"表里注明继任者;而且**已被取代的
条目若其实还活着,同样失败**——过期豁免正是下一次真回归被忽略的方式。

用制造这次回归的同样手法证伪过:手工 `DROP CONSTRAINT`,检查立刻报出
`declared in a migration but absent from the database`。

## 2026-08-02 — 复核第二批:分页截断、按行的授权、发布中途的同意撤销

**A5 — 家庭活动分页从第二页起静默截断。** 先复现:25 条只送出 20 条,而 `hasMore`
报 false——**事实不可达,API 却声称列表已完整**。原因是取 `lte before` 再在内存里
丢掉游标行,`take + 1` 的前瞻额度被那一行吃掉了。改为把"严格晚于此位置"下推到 SQL
(与另外两条 lane 同一种写法),前瞻额度才名副其实。三条分页 lane 现在形状一致。

**A4 — guardian 的按行权限是伪造的,撤销授权等于无效。** 原实现一次构造一个
`authority` 对象给所有行,五个字段里四个硬编码 `true`,第五个 `grant_visible` 回答的
是"这个 process 还有没有任一 active grant"。于是家庭撤销 G1、G2 仍在,**G1 投递过的
事实全部继续可见**——同意撤销要等到最后一个授权也没了才生效。日常照护查询更只看
`grantId` 非空,从不看状态。

改为按行度量,取自**该行自己的** Grant/Enrollment/child 关联,并且 `purpose_allowed`
要求该 Grant 现在仍然承认这条事实的 data class 与 purpose——授权被收窄之后不再覆盖
它已经投递过的东西。

顺带纠正一处口径:焦点与家庭章程是**家庭自己的记录**,从来没有经过任何 Grant。原来
拿"家庭有没有机构授权"去 gate 它们,会在家庭离开机构的那一刻把它自己的目标藏起来。
现在写明这条路径上没有 Grant 可言。

**A7 — 发布扇出中途撤销的同意拦不住后面的目标。** `commitTargetRelease` 的事务里
只重读了 process 与 revision,不重查 Grant/Enrollment/data class/purpose。三十个目标
的扇出跨越真实时间,中途撤销的家庭仍会收到发布**以及一条 delivered Receipt**。
现在事务内重查,并给出各自的拒绝码(`grant_not_allowed` / `enrollment_inactive`)。

**A8 — 上一轮我声称"改为排除"的修复只落在一条 lane。** guardian 活动 lane 里同一个
一刀切兜底还在,把非成长记录的发布显示成 `media`。现在改成显式全映射,并在查询层
排除不可发布的 data class。03-notes 里那句读起来像全局修复的话已就地更正——**文档
声称的修复只做了一半,比没做更糟**。

## 2026-08-02 — C/D 两类逐条核实,以及十张新表的 CHECK

复核给出的 22 条 C/D 断言逐条核实:**2 条不成立、2 条部分成立**,其余成立。不照单
全收本身就是必要的一步。

**不成立**:`uq_nurture_care_capture_batch_trigger` 在可空列上"失效"——`trigger_request_id`
只有在触发落定时才写,NULL 行是触发前的 collecting 批次,唯一约束恰好约束了它该约束
的(owner-write 枚举那个智能体独立得出同样结论)。
**部分成立**:`caregiverRowAuthority` 恒真只发生在 8 个调用点中的 2 个,且那 2 处的
查询本就按该 group 过滤,是冗余而非错答;`snapshot_ref` 确实是死字段,但"游标状态
没被校验"不成立——`drift_head` 与 `snapshot_version` 都在比。

### 功能性的几条

- **C9 一次发布的执行结果永远读不回来**。`readResult` 用
  `business_actor_ref === actor_participant_id` 把门,而 release 写进去的是
  role assignment id。改写 participant id;是哪个角色授权的,release 行上本来就有。
- **A6 prepare 成功、execute 拒绝**。eligibility 端口按 `scopeType: "care_group"`
  过滤,而 `loadCaregiverDailyCareFacts` 不过滤、取 `roles[0]`。持有较早的机构级角色
  加较新的班级角色的老师因此被自己 prepare 出来的目标拒绝。改为两侧同一套解析,并按
  enrollment 所属班级挑那一个角色。
- **A12 `current_focus` 的答序与声明序不符**。owner 是 cycle-major,两个活跃周期下
  优先级读作 1,2,1,2。该 lane 只有一页,所以在内存里按声明序做全序排序。
- **D3 `query()` 没有 default 分支**,任何未匹配的 key 落到发布队列——与我刚修掉的
  `query_family_care_item` 落空同类。补显式拒绝。
- **D5 `expected_draft_revision < 1` 让首次保存无解**。没有已保存 revision 的 process
  报 `current_revision: 0`,却被拒绝提交 0。既有单测把这个死胡同当成了契约。
- **D8 两个计数作用域不同**:给老师看的 `referencing_draft_count` 是 workspace 全域,
  决定他被不被挡的 `committed_release_count` 是班级域。统一为班级域。
- **A9 剩余的一半**:队列把 `save_publish_process_draft` 标为 `available`,而该能力既无
  owner 写也未路由,点了就是 400。**看板不该承诺系统做不到的事**——这正是冻结件在
  ingress 侧禁止的占位,只是从读侧来。暂不发放任何 action,B8 落地时恢复。

### D7:十张新表补 CHECK

T-005 每张事实表都有 CHECK,T-006 十张**一条没有**。新增
`20260802150000_g3_fact_check_constraints`,只写读端口本就假设的不变量:
released 必有冻结 revision;已解析的发送窗口是**五个字段全有或全无**且
`not_after > scheduled_at`;cut/organized 的批次必有 `cut_at` 与水位;
`policy_head >= 1`;`revision >= 1`;edit hold 不会一出生就过期;
release 的 command hash 必须是 64 位十六进制。

**它立刻抓到一批测试在造不可能的状态**,而且抓法很有教益:
`state: "released"` 无法在创建时给出——因为那时 revision 还不存在。真实流程里
`released` 只能由**冻结 revision 的那一次更新**达成,正是 `commitTargetRelease`
的写法。测试被迫改成同一形状。另有测试用 `sha256:command-1` 当 command hash、
用固定过去时刻当 hold 到期时间——都是与生产形状不符的数据,此前没有任何东西会说。

那条"半记录的 schedule"测试也随之改写:该状态现在**不可能存在**,所以测试证明
数据库拒绝它,端口的守卫降为约束之后的纵深防御。

### 小修

家庭章程的公开标题不再是它的生命周期列(家庭曾看到标题写着 `"active"`);
`priority ?? 99` 改为具名的 `UNRANKED_FOCUS_PRIORITY` 并说明为何未排序的目标排最后;
全局 discard 路径不再伪造 `process_state: "draft"`;`cutAt` 不再冒充
`fallback_due_at`(owner 根本没有"每日兜底点已到"这个事实);
`commandScope` 改回 lane 标签;discard 那条**注释**说的拒绝规则实际不存在——假的是
注释,已改。

## 2026-08-02 — B 类:守卫本身守不住它声称的东西

复核里最刺眼的一批。**冻结不是执行**这条前车之鉴,这次应验在守卫自己身上。

**B3 — 我那道 fail-closed 迁移门的守卫可以被一行绕过。** 它要求迁移文本包含三个
字符串,而三个**全在 `RAISE EXCEPTION` 的消息里**。把 `IF ambiguous > 0 THEN` 改成
`IF false THEN`——门彻底关掉——守卫照样绿。改为解析每个 `DO $$` 块,要求:census 写进
一个声明过的变量、条件**读的就是那个变量**、并且确实 `RAISE`。用同样的手法证伪过:
`IF false` 立刻报 `gate 0 aborts on a non-zero ambiguous, not on a constant`。

**B2 — "envelope 绝不被持久化成统一 child-state 行"只是三个模型名的黑名单。** 叫
`NurtureChildBoardSnapshot` 就能过。白名单式的表普查永远无法反对多出来的表,于是
冻结件最锋利的结构性主张,建立在猜别人会怎么命名上。改为**钉死整个持久化表集合**
(60 张):新增一张持久化表从此是一次要对着这条主张接受审阅的显式声明。已证伪。

**B1 — 冻结守卫对两条核心不变量零断言。** "每个 typed module result 绑定
contract/capability version/actor/scope/snapshot/order/sourceHeads[]"和"cursor 身份
绑定这七项"——守卫读了十一个文件,两条都不在其中。从冻结 schema 里删掉 `snapshot`
与 `sourceHeads`,制品旋转一下、semver 下限满足,守卫全绿。现在两条都对着冻结件与
运行时类型钉死,并顺带钉住"cursor 是密封的而不只是签名的"。两条都证伪过。

**B6 — ingress 路由表用行正则解析,读不懂的行被静默跳过。** 加一个
`...PUBLISH_WRITE_VERSIONS` 展开,普查看不见,而公布的 enum 又是拿这份普查比的——
正好是这条断言声称要防的事。改为**遇到读不懂的行就报错**:准入必须保持字面量的
key→version 映射。已证伪。

**B4 — 一条守卫在为已经不存在的约束背书。** `assert-n1-schema-contract.mjs` 断言
`ck_nurture_media_attribution_confirmation` 存在并通过,因为它 grep 的是**冻结的基线
SQL 文本**。那是一条合法的历史钉,问题在于标签读起来像"这些约束存在"。改为如实
命名(`N1 baseline migration no longer declares check ...`),并写明当前存在性由活库
检查负责。同一份清单里还有 `ck_nurture_command_execution_n1`——它已被 handoff 链
合法取代,守卫却仍在断言它。

共同的形状:**守卫检查的是"文本里有没有这句话",而不是"这条规则还成不成立"**。
四条里有三条可以用一次编辑绕过,而且绕过之后所有闸门仍是绿的。

## 2026-08-02 — B7/B8 与三处清理

**B7 — 冻结的输入 digest 只被断言"出现在这份文档里"。** 它是历史(当前制品早已旋转
过去),所以这份守卫里没有任何活制品可以拿来比。能比的是:**真正用凭据证明它的那个
守卫是否还钉着同一个值**——`assert-g2-exit-contract.mjs` 让 `sharedCoreHash` 与每个
T-005 slice hash 自该 digest 起逐字不变。现在两个守卫互相钉住。

**B8 — adoption set 用的是下限而不是精确值。** `reservedKeys.length >= 18` 意味着
注册第 36 个能力也能通过——对一个声称"已封闭"的集合而言恰好相反。改为精确等于 19。

**冻结件自身已经陈旧,而且守卫在断言它的反面。** 06 的 posture 行写着 24 个能力
"frozen but not implemented or registered",而 `assert-g3-0-freeze.mjs` 断言全部 24 个
**已注册**;DB SSOT 行钉着"50 tables",上下文早已是 60。冻结内容本身不动,只把这两行
标注为已被取代,并写明当时值与现值。

**清理三处**:`stillUnimplementedCapabilities = []` 的空循环保留但写明它是一条**声明**
(往里加一个 key 等于主张它被刻意不注册),而不是一个可以随手放东西的地方;
`BoardCursorStateV1.snapshot_ref` 被携带、被校验、被返回,却**从没有任何调用方比较过**
——它读起来像一道并不存在的检查,已删除(`snapshot_version` 与 `drift_head` 才是真在
比的两项);`uq_nurture_publication_release_command` 被单列的
`publish_process_target_id @unique` 完全蕴含,永远不可能是先触发的那条约束,却让人以为
command hash 在数据库层承担了一部分保证——已随迁移删除,重放检查本就显式写在
`commitTargetRelease` 里。

## 2026-08-02 — D1/D2/A14:envelope 的单一快照,与一个答非所问的"今天"

**D1 — envelope 的"一个快照下的一个派生结果"是三次读拼出来的。**
`presentGuardianFamilyBoard` 解析一次 scope,它调用的两个模块查询**各自又解析一次**
——三次,三个不同时刻。envelope 的 `snapshotVersion` 来自第一次,每个模块的
`binding.snapshot.snapshotVersion` 来自它自己那次。第一次与第三次之间撤销一个 Grant,
envelope 与它的模块就会对同一个 scope 各执一词。caregiver envelope 是两次。

这不是性能问题,是契约问题。改为 envelope 解析一次并把
`{facts, snapshot_at}` 作为可选的预解析上下文传下去;模块被单独调用时仍自己解析,
所以它们保持可独立使用。读放大顺带从 3× 降到 1×。

**A14 — 一个叫 `child_today` 的模块返回了一整年。** 那条日常照护查询**既没有日期界
也没有 take**。入园一年、每天 3 条的孩子约 1000 行,再按 `DAILY_CARE_KINDS` 每行最多
展开成 5 个条目,乘以每页最多 20 个孩子。这不是慢,是**模块返回了它名字之外的东西**。

改为按快照日取。"今天"暂按 **UTC 日**界定并写明理由:机构本地日需要 T-007 的时区,
现在猜一个不如把这条依赖记成 G3-E 的输入。

**D2 — N+1**:原来每个 enrollment 两条查询,页大小 20 就是 40 次往返。改为每种事实
对整页发一条 `IN (...)`,再在内存里按孩子分组。与 A14 是同一处改动。

两条检查都用制造该缺陷的手法证伪过:让模块自己再解析一次,单一快照检查立刻报
`expected [...] to have a length of 1 but got 2`;而"只含当天"那条种了三天的日志。

## 2026-08-02 — 自查:D1 只修了一半,而我的测试是空的

复核清单清空后对本轮实施做自查,抓到两件事,第二件比第一件重要。

**D1 只修了一半。** envelope 现在共享一次 scope **读取**,但两条分页 lane 的
`let snapshotAt = now.toISOString()` 仍然各自盖自己的**时刻戳**——正是我声称修掉的
那件事。facts 来自 envelope、instant 来自模块自己,envelope 依旧不是一个时刻下的结果。
已改为 `resolved_scope?.snapshot_at ?? now`,续页仍由游标里的时刻覆盖。

**而我为它写的测试是空的。** 它只数了 `loadGuardianScope` 的调用次数,数对了;
但"模块会不会自己盖时刻"它看不见。更糟的是:即使改成断言时刻一致,**在固定时钟下
仍然通不过证伪**——模块自己算出来的 `now` 与 envelope 的恰好相同,缺陷不可见。

换成**每次读都前进的时钟**之后,证伪立刻成功(`expected 2 to be 1`)。这条比缺陷本身
更值得记:**固定时钟会让"谁在什么时刻读的"这类问题在测试里彻底消失**。

顺带清掉 child-today 里 `logs`/`attention` 的变量遮蔽——批量结果与每个孩子的分桶
同名,能跑但读起来像同一个东西。

## 2026-08-02 — 六条前置缺口:核实与实施

逐条核实后 **五条成立、第六条被描述错了**。

**1 硬阻塞成立。** `createPublishCandidate` 在 `direct_interaction_required` 分支
**创建 process 之前就 return**,而 `publish_process_id` 是 NOT NULL 加必填 FK——
**最需要留痕的那条路由,恰恰是唯一存不下来的**。改为可空,并加
`care_group_id` + `organizer_input_revision` 作为不依赖 process 的锚点(两者始终有值,
所以无论走哪条路由,评估行都可寻址)。

**2 比描述更糟。** 不只是"一列两义":`publish-process.ts:318` 写入 assembler 的
organizer revision,而 `publish-lane.read.ts:338` 按 **command_request_id** 查这一列找
重放——**这个查找永远找不到它要找的东西**,`replayed_revision` 事实上是死的。新增
独立的 `command_request_id_hash` 列与唯一约束。

**3、4 成立**:VisibilityEvent 补 `command_execution_id` 与唯一约束(两个最接近的同类
都有);PublishProcess 补 `schedule_policy_version` 与 `schedule_resolved_at`——此前拿
`aggregate_version` 与 `updated_at` 顶替,而 reschedule 正好会动这两个。

**5 按建议不做**:release 的可见性迁移是单调的,事件表加了唯一约束之后重放已是无操作。

**6 被描述错了。** 九个 `must_equal` head 逐个对到 facts 类型上,实际是三类:
**owner 确实没暴露**的只有 `publish_edit_hold`、`capture_batch`、detach 的
`draft_revision`(已补 `hold_version` / `batch_version` / `draft_revision`);
`media_asset_revision` 等 owner 早已暴露,缺的是 prepare 层,那就是 B8 本身;
`focus_cycle` / `focus_goal` / `enrollment_lifecycle` 的闭环已经存在。
不是"系统性的一整片",是三处字段。

**迁移仍然不猜。** 两列 NOT NULL 从每行已指向的 process 回填,推不出来的行让迁移中止。
gate 在一次性库里对 19 行测试残留正确触发,随后重建库重放整条链。

**守卫抓到了我自己。** 新 amendment 里的反引号列名被"能力键"抓取器当成了 capability
key,精确计数(B8 那条改动)立刻报 `expected 19, received 29`。根因是抓取器读整节散文。
改为**切到第一个 `### Amendment` 之前**:采纳声明是正文,附录不参与;附录若新增身份,
会像 media lifecycle 那次一样并回正文列表,而反向普查(每个已注册的 T-006 能力都必须
被预留)从另一侧兜住。

## 2026-08-03 — B8 Unit 0:写命令工厂、按能力的描述表,与第一条端到端写能力

B8 的 16 个写能力有一段共同的形状。**先把这段形状变成一个东西,再用它落一个能力**,
这一格不做剩下的 15 个。

**`createBoardWriteSpec`**(`packages/nurture-scenario/src/harness/board-write-spec.ts`)。
它承载五件复制 16 遍必然出错的事:port 为空时的具名拒绝码;事务内重读 owner 并把
prepare 冻结的 head 与 owner 当下的 head **整套**比较;事务内重新解析 typed input;
`already_satisfied` 必须给出至少一个可证明的既存 ref;committed result 的 schema
版本由工厂盖章。已路由的两个 board mutation 改走它,行为不变——除了 `apply` 里的
漂移从匿名 `Error`(映射成通用的 `command_execution_failed`)变成带
`stale_confirmation` 的确定性回滚。

有一条不是靠断言、而是靠**结构**保住的:`authorize` 既做判定,又**产出 write 允许
使用的那些值**,`apply` 只拿得到这个产物。所以"apply 用了一个 authorize 从没看过的
字段"不是一条需要有人记得写的检查,而是编译不过。

**head 比较必须比键集**。只比交集看起来更宽容,实际上是"owner 不再报的 head 就不比
了"——那正是漂移。工厂两个方向都失败关闭,并用"只比交集"这一手法证伪过。

**`buildHarnessCommand` 改成按能力的描述表**。原来是 200 行 if 链,16 个能力都要改
它。现在每个 key 一个 `{prepare, build}`,整张表 `satisfies
Record<HarnessCapabilityKey, ...>`。于是"在 transport 放行一个引擎接不住的 key"——
冻结件禁止的占位——**不再是运行时兜底,而是编译错误**。落地时它立刻抓到了我自己:
先写描述表再改准入表,`cancel_publish_process` 报 "does not exist in type Record<…>"。
顺带修掉一处真实的洞:原 prepare 的 `switch` 没有 default,一个未被前面 if 拦下的 key
会让 `prepare` 返回 `undefined`。

**`cancel_publish_process` 端到端**。owner 写事务 + spec + prepare + ingress 路由 +
真 PostgreSQL 上的 DB e2e。三层防护各司其职:prepare 冻结 `aggregateVersion` →
事务内重读并比对 → owner 的 `updateMany` 把版本和"可取消的三个状态"都放进 WHERE,
所以被别人动过的 process 匹配零行,而不是被覆盖。

### 一个绕不过去的事实:取消需要一个"什么时候"

冻结的 result schema 要求 `cancelledAt`,而 `already_satisfied` 分支必须同样满足它。
`nurture_publish_process` 没有这一列。`updated_at` 是最顺手的替代品,也是错的——任何
别的写都会推动它,于是重放会报出一个取消**并未发生**的时刻。这正是 05 里那条
"`? :` 的 else 落在具体业务值上就是断言"的同一种错误,只是换了个形状。

所以加了 `cancelled_at`(可空,只有 cancelled 行有这个事实),迁移带一条按行普查的
`RAISE EXCEPTION`,再加一条 CHECK 长期维持。**没有 evidence 就中止,不猜**:历史
cancelled 行没有任何地方能推出取消时刻,所以它们不是"回填",是"中止"。

这条 CHECK 落地当场抓到两个既有测试 fixture 直接 seed 了没有取消时刻的 cancelled
process——它们在造一个写通道永远产生不出来的状态。

领域侧对应地新增 `evaluatePublishProcessCancel`:一条规则,prepare(走查询端口)与
execute(走命令事务端口)**调用同一个函数**。为此把两侧的"照护者写授权"四个字段收敛
成一个声明(`NurtureCaregiverWriteAuthority`,在 domain 侧),`CaregiverFactAuthorityV1`
继承它。这不是注释级的约定,是类型级的:两侧无法各自养一份同名规则。

`isPublishProcessState` 让 owner 行里一个领域不认识的状态**没有任何合法迁移**,
而不是被当成五个之一。

### 这一格没有做的

其余 15 个写能力、B4 余下路由、B5 consumer action。以及一处已知的整洁性机会:
`publish_process` 的 sealed ref 目前由五个模块各自用共享的 kind 常量签发,虽然值一定
一致(kind 是同一个导出常量),但"一个概念一个发放器"这条规则还没有在这里落实。

## 2026-08-03 — B8 Lane A:编辑 lane 四条写能力,以及上一格只修了一半的重放

按规划的三条 lane,先走编辑 lane。四条能力(edit hold ×3、save draft)同属一个
owner 聚合、复用同一个读端口,领域决策函数在 G3-B1 已有,缺的是 owner 写、prepare、
spec 与路由。全部走 Unit 0 的 `createBoardWriteSpec`,没有为它们新开一套形状。

### 先修上一格的半成品

`NurturePublishProcessRevision.command_request_id_hash` 在
`20260802170000` 落了库、加了唯一约束,**但没有任何代码在用**——读端口仍按
`organizer_input_revision` 查重放。上一格的记录写的是"新增独立的列与唯一约束",读起来
像修好了,实际只落了一半。这正是 05 里"文档声称的修复只做了一半,比没做更糟"的复现。

更值得记的是那条测试:它传 `command_request_id: "organizer:1"`,而 fixture 的
`organizerInputRevision` 恰好也是 `"organizer:1"`。于是它一直是绿的——**它证明的是两个
不同含义的列碰巧装着同一个字符串**,不是重放。改成先断言"用装配谱系当命令 id 必须查
不到",再写入真正的命令哈希去查,缺陷才可见。

### 一个必须先堵的洞:absence 与"刚建的 hold"不能同值

`publish_edit_hold must_equal` 在没有 hold 时也要冻结一个值,自然编码是 0。但
`aggregate_version` 默认就是 0,于是"没有 hold"和"一秒前刚建的 hold"报同一个数——
一个按"没有 hold"准备的 acquire 会通过头部检查,**覆盖掉同班另一位老师刚拿到的 hold**。
那正是这个头存在的理由。

改法是让 0 对真实行不可达:`aggregate_version` 默认改 1,加
`ck_nurture_publish_edit_hold_version_floor`。"0 表示不存在"从一条约定变成数据库保证。
迁移带按行普查的 `RAISE EXCEPTION`(此前没有任何 owner 写,所以是纯前向保证,普查把这
句话写成可执行的而不是假设)。

### 第二个洞:两个时钟

owner 按 `at` 过滤过期、而 `currentHeads` / `authorize` / `apply` 各自再读一次钟,就会
出现"owner 认为还在、规则认为已过期"。改为 **owner 回报它读取的那一刻**(`read_at`),
过期由规则在那一刻判定,新 hold 的窗口也从那一刻起算。全链路一个瞬间。

这条用"会走的时钟"证伪:同一行 hold、同一条命令,只把 `read_at` 推过到期时刻,结论就
从 `held_by_other` 变成 `ready`——两者可区分,断言才不是空的。

### 落地细节

- **hold 写**:`expected_hold_version === 0` 走 `create`(`publish_process_id` 唯一,
  所以中途被别人拿走会插入失败而不是静默替换);否则走按
  `holder_participant_id + aggregate_version` 过滤的 `updateMany`。release 是删除协调行,
  从不改 process 状态。
- **draft 写**:追加 revision,`organizer_input_revision` **从当前 revision 前推**——
  装配谱系是 organize 产生的,编辑不改写它;`source_refs_payload` 同样前推,所以删掉一段
  不会永久失去再引用该来源的能力。标题与正文只以信封形态到达 owner,明文留在命令层。
- **无 revision 的可编辑 process**:owner 直接失败。每张卡片都由采集 lane 带着 revision 1
  产生,这条路径产品上不可达;在这里发明一个 `organizer_input_revision` 等于给一列写上
  一个从未运行过的装配输入。
- **命令标识进内核**:`NurtureCommandExecutionContext` 增补 `command_request_id`。owner
  侧的行级幂等键需要它,运行器本来就持有,从 payload 再推一次等于第二个来源。

### 这一格没有做的

organize(与几乎所有东西重叠,按规划排在编辑 lane 之后)、归属 lane 5 条、发布后安全
lane 5 条。`held_by_other` 目前映射成 `denied + reason_code`,持有者姓名与到期时间留在
队列投影里——refusal 信封没有承载它们的形状,在这里发明一个就是把同事姓名塞进一个
本不该有它的结构。

## 2026-08-03 — 铺开前的勘察,以及它在已落地代码里找到的两处

在承诺剩余 11 条能力的 lane 边界之前,先做了一次只读勘察(五个能力簇 + 一次 owner 侧
缺口审计 + 一次综合)。它推翻了我上一份报告里的两处分组假设,并在**已经落地**的代码里
找到两个缺陷。先修这两个,再动 lane。

### 一、`sameHeads({}, {})` 恒真

工厂的头部比较对两个空 map 返回 true。于是**一条漏写 head 的写能力会无条件通过头部
比较**——正是"检查守不住它声称的东西"那一类,而且就在我自己上一格写的代码里。

改法分两层:

- 定义里显式声明 `head_keys`,工厂断言 `expectedHeads` / `currentHeads` 产出的键集
  **恰好**等于它。只在运行时出现的 head 从未被评审过;声明了却不产出的 head 会静默
  掉出比较。两个方向都失败关闭。
- `phase-2-contract.test.ts` 新增一条跨界检查:每个工厂构建的 spec,冻结的 head 数
  必须**不少于**注册表为该能力声明的 `must_equal` 数;head 集为空必须在一张具名豁免
  表里说明理由,而**过期的豁免同样失败**——过期豁免正是下一次真遗漏被忽略的方式。
  spec 是**反射**找到的(`/^create.*Spec$/`),所以新增一条忘记声明 head 的 spec
  不能靠"没被加进普查名单"藏起来。

顺带发现:加上声明断言之后,`sameHeads` 原来的并集逻辑变成**不可达**——两侧键集已被
保证相等。死掉的防御代码和守不住的检查是同一种问题,所以收敛成一条:按 `head_keys`
逐个比值。

`cancel_publish_process` 注册表声明零个 `must_equal`,而我给了它一个 `publish_process`
头。这是**严格更强**(把状态迁移变成 CAS),就地写了注释说明,而不是让它看起来像巧合。

### 二、归属查找取的是被取代的那一版

`media-attribution.ts` 四处 `.find()` 都按孩子取**第一条**,而
`media-safety.read.ts` 按 `attributionRevision` **升序**返回全部修订。所以规则读到的
永远是最旧的那一版。今天不可见——没有任何写入者;一旦归属 lane 落地,confirm/reject
会在一个已被取代的版本上重新提交。

两侧各自闭环:owner 套件断言"返回两条修订",域套件喂手写事实。**交界处没人看**。

修在读端口——顺序是端口自己的契约,在每条规则里各自 reduce 会制造第二处可能不一致的
地方。并按已有范例(`g3-owner-domain-boundary`)加一条把真实 owner 输出喂进域侧
`find` 的检查。用制造该缺陷的手法证伪过:把 reduce 改成"保留第一条"立即失败。

原来那条 owner 测试把"返回全部历史"钉成了契约。它不是没覆盖,是把两侧的分歧写进了
期望值——与 draft 重放那条同形。

## 2026-08-03 — 复核两条 HIGH 的修复:过期 hold 与草稿 LWW

### 过期 hold 卡死编辑 lane(finding 1)

领域层把过期编码为"不存在"(head 冻结 0),但过期的**行**还占着 `publish_process_id`
唯一槽位,而且没有任何路径清理它——TTL 一到,第一次 acquire 就永远撞唯一约束。

修法:version-0 的 grant 路径先按 **owner 自己的 read_at** 清扫已死的行再插入;
清扫按过期时刻过滤,所以中途被同事拿走的**活** hold 不受影响、插入照旧碰撞——
那正是保留值 0 要暴露的竞争。release 按 absence head 准备时,对"行还在但已死"的
状态走**真实写入**清掉它,而不是用 `already_satisfied` 宣称一次从未发生的删除;
清扫按过期而非按持有者限定,因为清一条已失效的行不释放任何人的活协调。

四条证伪:去掉清扫(原缺陷)、清扫不按过期过滤(偷走活 hold)、release 清扫分支
不按过期过滤、release 退回 already_satisfied——全部 CAUGHT。fixture 里过期不能
靠把 `expires_at` 弯到 `created_at` 之前伪造(窗口 CHECK 会拒),要把整个窗口
平移进过去——真实的过期就是时间流逝。

### 草稿保存的静默 last-write-wins(finding 2,按用户决定走 schema 增补 + 旋转)

prepare 声明了 `expected_draft_revision` 却从不读它,冻结的是 owner 自己的
`current_revision`——漂移检查变成服务器和自己比。根因在**合同**:冻结的 save 输入
只有 `title`/`segments`,客户端的观察基线没有传输通道。

- 冻结源 schema 增补必填 `expectedDraftRevision`(integer ≥ 0,0 表示尚无已存修订),
  制品 additive 旋转 `1.13.0 → 1.14.0`,capability 保持 `1.0.0`(从未激活、无消费者)。
- 领域侧单一来源:基线只住在 typed input 里。评估器从 `input.expectedDraftRevision`
  读,prepare 冻结**客户端的值**,ingress 的 build 要求重提交的值与确认冻结的相等。
- 内容摘要只盖 `title`/`segments`(`SavePublishProcessDraftContentV1`)——基线是 head,
  不是内容。

**两条被钉死的旧测试**都是把缺陷写进期望值的实例:单测断言"冻结 owner 的头、
不冻结调用方记得的",合同守卫把 `expectedDraftRevision` 列进"禁止进 typed input"。
后者混淆了两类东西——服务端签发的传输元数据(仍然全部禁止)与**只有客户端知道的
业务事实**。守卫改为分立:save 的输入**必须**含它,其余 key 仍禁止。

证伪:prepare 换回冻结 owner 头(原缺陷)、parser 把必填改成默认——都 CAUGHT。
e2e 加了 kill shot:按 revision 1 组稿的缓冲在 revision 2 之后到达,**prepare 即拒**
`draft_revision_conflict`,零写入。

## 2026-08-03 — 卫生批:线上的原始 id、普查加固、null TTL

复核 finding 3/8/9 的收尾。

**线上的原始 id(finding 3)。** 每个 committed 响应的 `output_refs[].object_id`
与 `execution_ref` 都带着原始 owner 行 id 出线——与刻意密封的 `committed_result`
同一个信封。没有任何调用方消费它们(服务端内部用的是存储的 execution),所以在
transport 边界统一密封:`object_id` 换成 `committed_result` 对同一概念用的同一把
keyed display handle。密封是确定性的,重放响应仍与原响应逐字节相等(既有的重放
相等性 e2e 直接验证了这一点)。e2e 的 no-raw-id 扫描从 `committed_result` 扩到
**整个序列化响应**——把密封拆掉,扫描立即失败。

**普查加固(finding 8 + 9a)。** phase-2 的 head 一致性普查原来吞掉构造异常、
下限 5 而实有 7、只比数量不比名字。改为:
- 构造失败即失败(`createBoardWriteSpec` 本身是工厂的工厂,具名排除并写明理由);
- 反射发现对照**具名的精确清单**双向核对——藏不进普查,也消失不了;
- 数量比较换成**身份遍历**:每个注册表 `must_equal` head 经映射表对到 spec 冻结的
  head 名,映射缺失即失败;
- 反向遍历:每个声明 `must_equal` 的注册能力,要么有 spec,要么在具名债务表里,
  要么在"前工厂时代手写 spec"表里(T-005 四条)——三张表都有各自的过期检查。

加固过程本身抓到两条:发现循环把 `createBoardWriteSpec` 当能力工厂构造(异常此前
会被吞掉);我自己把两个没有 `must_equal` 的 key 塞进了债务表,过期检查当场拒绝。

**null TTL(finding 9c)。** `value ?? DEFAULT` 把 `ttlSeconds: null` 吸收成默认值。
只有真正的缺席才取默认;null 是调用方说了话——只是说的不是这里接受的东西。

**封闭形状(finding 9b)。** daily-care 的 committed-result 守卫从六个子串的 grep
改成 `toEqual` 的封闭形状断言——多出一个未声明的键(例如原始 enrollmentId)现在
会失败,此前会静默通过。

四条证伪全 CAUGHT:拆掉密封、`??` 回退、映射表删一条、production 结果加一个未声明键。

## 2026-08-04 — B8 归属 lane:三条写能力,与随行的复核发现 5/6/7

confirm / reject / supersede 三条归属能力端到端,全部走 Unit 0 工厂;复核判定必须
**随** lane 落地的三条发现在同一单元内关闭。

### 形状

- **决策即追加**。每个决定按 (asset, child) 追加一个新修订;confirmed 历史永不改写。
  per-revision 唯一约束就是 CAS,owner 侧再补一道"expected 必须恰等于当前最大修订"
  ——唯一约束挡得住重复,挡不住**跳空**(current 1、expected 5 → 插入 rev 6),这一道
  挡住它。
- **head**:`child_media_attribution` = 该孩子当前修订,0 保留给"尚无归属"
  (`ck_nurture_media_attribution_revision_floor` 把下界钉进库里,hold version 0 的
  同一课);`media_asset_revision` = 不可变原始媒体修订;supersede 额外冻结
  `target_child_attribution`(注册表之外的更强 head,与 cancel 同理)。
- **来源是 owner 的裁决**:confirmed 追加一律记 manual;rejected/superseded 从**行自己
  存储的来源**继承——不经过领域侧有损的展示映射(face_reference/history_match/system
  → 三合二)往返。
- **supersede 原子两行**:from 孩子的 superseded 修订 + to 孩子的 confirmed 行,
  同一瞬间,`superseded_by_attribution_id` 指向被纠正成的那一行;底下的 confirmed
  历史原样留存。
- **execute 侧的 childRef 绑定**:sealed ref 对同一 actor 是确定性的,transport 用
  确认里冻结的 id 重新签发并要求与重提交的 ref 相等——重提交一个不同的孩子直接
  `invalid_operation_input`,而不是被确认静默纠正回去。

### 随行的三条复核发现

- **5(发布资格读取器)**:ac2bb6e 的 current-fact 归约此前只落在姊妹文件——又一个
  半程修复。现在共享同一个归约器,且终态 `superseded` 与 `rejected` 一样不再构成
  义务。跨界测试:真实 owner 行(rev1 superseded → rev2 rejected + 另一孩子
  confirmed)喂进 `derivePublishEligibility`,结论必须是可发布。fixture 第一版把
  被纠正掉的孩子也设成发布**目标**,曝光检查正确地拦了它——"不在照片里的孩子不该是
  受众"本身就是规则在工作。
- **6(supersede 的 to-child)**:此前只挡"已 confirmed",终态 rejected/superseded
  的孩子能被纠正成 confirmed。补 `isLegalAttributionTransition(replaced.status,
  "confirmed")`。**证伪先抓到我自己**:第一轮撤掉守卫测试仍绿——守卫没有覆盖;
  补了测试再证伪才 CAUGHT。
- **7(decided_at 与 ref 基底)**:幂等复述从**存储的**决定时刻作答——confirmed 用
  `confirmed_at`,rejected/superseded 用追加行的 `created_at`(追加即决定);candidate
  没有决定时刻,复述一个 owner 无法作证的决定直接拒
  (`attribution_evidence_unavailable`,cancel 先例)。`attributionRef` 的基底从
  "前驱行 id + 后继修订"(一个永不存在的组合)改为 (asset, child, revision)——
  提交回执与后续读取按构造一致。

### 这一格没有做的

finding 4(revision-0 草稿保存的仓储契约)按复核裁定属于 organize/采集 lane,
而 organize 本身被合同决定阻塞;它作为已记录债务随那条 lane 关闭。未路由清单
8 条:媒体生命周期 2、发布后安全 3、以及三条 B8 不可路由(release/reschedule/organize)。

## 2026-08-04 — B8 媒体生命周期对:detach 与 discard

产品"删除"的前两个阶段,各接各的 owner 聚合,同走 Unit 0 工厂。未路由 8 → 6。

- **detach 是一次编辑,不是生命周期变更**。追加下一个 revision,composition 少一项,
  其余(标题、正文、来源、装配谱系、内容摘要)逐字节前推;asset 行不动。head 与
  save 同源(`draft_revision`),重放走同一个 `command_request_id_hash` 列。
  committed `mediaRef` 用资格投影同一个 `deriveMediaRef`,盖在 owner 实际移除的那个
  **组合内修订**上——提交回执与读取按构造一致(finding 7 的纪律)。
- **discard 是全局的发布前删除**。`media_asset_revision` head 做 CAS(原始被替换过
  就冲突),终态集合(`discarded`/`redacted`)在 WHERE 里;**爆炸半径在写事务内测量**
  ——老师在 strong_confirmation 里确认的数字就是提交记录的数字,prepare 的 preview
  也报同一口径。owner 写里再补一道"窗口在事务内已关"检查:读与写之间提交的 release
  同样拒绝。
- **证伪抓到一处缺覆盖**:去掉 discard 的 media-revision CAS,测试仍绿——没有任何
  测试用错误的 expected revision 打过。补"原始已替换成 rev 2、按 rev 1 冻结的确认
  必须冲突"后再证伪,CAUGHT。这是"证伪验收覆盖"的第二次应验。

## 2026-08-04 — B8 发布后安全三条:工厂 finalize 钩子与"谱系命名它的命令"

correct / remove / redact 端到端。**B8 的可路由集合至此清零**——未路由 3 条全部是
结构性阻塞(release 需多命令 ingress 形状、reschedule 等 T-007、organize 待合同决定)。

### 时序问题的解法:finalize

谱系行携带 `command_execution_id`——指向 CommandExecution 的外键,而 `apply` 运行时
那一行还不存在。解法沿 G2 redaction cascade 的既有先例:工厂新增可选 `finalize`,
映射到内核的 `afterExecutionCreated`(execution 已建、事务未提交)。**行 id 在 apply
里预生成**并经 `finalization_payload` 传递,所以 `output_refs` 能命名 finalize 尚未
写入的行;`already_satisfied` 无写入,finalize 相应跳过。

- **可见性迁移在 apply**:单调,FROM 集合写进 WHERE——谱系已经走过的迁移匹配零行、
  响亮失败,而不是被悄悄倒回。
- **谱系行在 finalize**:带 execution id、actor role、以及 correct 的**密封正文**——
  复核指出 `correctionText` 此前"校验后被静默丢弃",现在以信封形态进
  `body_protection_payload`,命令载荷里只有 keyed digest。
- **head 集合为空是声明,不是遗漏**:注册表就是 `compatible_append`,三条进
  `HEADLESS_BOARD_WRITES` 具名豁免——事件表 (release, command, kind) 唯一约束与
  单调 WHERE 就是并发契约。

### 幂等复述从存储事件作答

复核 finding:remove 的重复此前拿求值器时钟当 `occurredAt`,甚至把 removal 报成
redaction。现在查询与写入两侧的 facts 都带**存储谱系**,重复回答的是使它不可见的
那个事件——它自己的 kind、自己的 reason、自己的时刻;owner 无法作证时拒绝
(`visibility_evidence_unavailable`)。receipt 缺失同理拒绝——空串哨兵哈希出的
"看起来有效"的 preservedReceiptRef 不再可能。

### 证伪又抓到一处缺覆盖

remove 的 stored-answer 分支第一轮证伪 MISSED——单测只钉了 redact 的。补 remove 的
两个方向(存储事件作答 + 无证据拒绝)后再证伪,CAUGHT。四条全部 CAUGHT:finalize
未映射(谱系行静默缺失)、correction 正文再次丢弃、发明 kind/时刻、单调 FROM 守卫
删除。

## 2026-08-04 — B5:D-15 受限内容路由的 T-005 消费侧动作

`createPublishCandidate` 的 `direct_interaction_required` 决定新增 `action` 字段——
就绪评审 B5 所指的"可用的那一半"。此前只有安全阻断的一半(路由 + 内部源引用,
无任何动作);Exit Gate 明确拒绝在 safe-unavailable 占位上签字的交接。

### 动作只从现时 owner 事实铸造

- **依赖必填**:`PublishProcessDependencies` 新增
  `direct_message_eligibility`(T-005 既有 `CaregiverDirectMessageEligibilityReadPort`,
  即 G2-C prepare 用的同一个端口)。设为可选会让动作永久 unavailable——正是被
  拒绝的占位形态。
- **交集铸造**:选项只为「候选目标集 ∩ 现时资格集」里的 enrollment 铸造,用
  T-005 同一把 `issueTargetOptionRef`(workspace、actor、enrollment 三绑定)。角色名、
  模块挂载、缓存的正面结果都铸不出任何东西。跨界测试把 T-006 发出的 ref 喂进
  T-005 的 `resolveTargetOptionRef`,解析回的正是 concerned enrollment。
- **动作上下文只有 capability ref + option ref + 展示标签**:JSON 断言原始
  Enrollment/Grant/Family id 与受限正文都不出现。capability ref 复用
  `INITIATE_CAREGIVER_DIRECT_MESSAGE_CAPABILITY` 常量(`@1.0.0` 精确)。
- **安全阻断走冻结分类**:`not_authorized`(参与者非活跃/零目标)、
  `target_unavailable`(目标集不完整/交集为空)、`dependency_no_go`(资格 owner
  抛错,fail closed)。路由决定本身不受影响——动作不可用时受限内容照旧不进
  批量发布。
- **资格读取只属于受限分支**:ordinary 路径零调用。

### 证伪:throwing port 探测不到被吞掉的越界调用

四条证伪三条一次命中(交集守卫、fail-closed 原因码、actor 绑定),第四条
MISSED:把资格读取挪到路由判定之前,25 个测试仍绿——resolver 按设计吞掉端口
异常转 `dependency_no_go`,所以「被调用即抛」的 fixture 根本探测不到经由
resolver 的调用。改成**计数端口**(`calls() === 0` 断言)后再证伪,CAUGHT。
"证伪验收覆盖"的第三次应验,且这次教训更具体:**守卫技术要匹配泄漏通道——
异常会被沿途的 catch 吞掉,计数不会**。

## 2026-08-04 — 对抗性复核修复:两个最新单元的 4 条 confirmed

17-agent 工作流复核媒体对 + 安全三条(4 条视角 lens → 独立对抗验证)。confirmed
去重后 6 条,本单元修 4 条,discard 头旋转与两条覆盖债列为后续单元。

- **[high] 批量安全动作越过内核 32-ref 上限**:correct/redact 按 release 逐个命名
  output_refs,33 目标班级的 redaction 在 `validateRefs` 抛错——且它在确定性回滚
  分类**之外**,回滚被报成永远无法 reconcile 的 `outcome_unknown`。双侧修复:
  applied 效果与 already_satisfied 一致只命名聚合(`publish_process_ref`,事件在
  `committed_result`);内核把 `validateRefs` 挪进分类 try(规格缺陷 = 确定回滚)。
- **读道回执空串哨兵(三条 lens 独立发现)**:写道已拒绝的 `""` 在读道仍被哈希成
  "共享的看起来有效"的 preservedReceiptRef,且 prepare 会承诺 execute 必拒的动作。
  `receipt_id` 改 optional、owner 读省略键,`loadSafetyContext` 与写道同码同范围
  拒绝;`ProvenCommittedPublicationFactV1` 让未证实回执在 `buildEvent` 类型上不可
  表示。
- **detach 绕过两条编辑保持规则**:save 强制的 `held_by_other` 与 pending_release
  的 `edit_hold_required`,detach 三条路径(读包装、prepare、execute 规格)全都不看。
  三处补齐,过期判定用 owner 的 `read_at` 单时钟;媒体事实新增 `read_at` +
  `current_hold`(读端口 include editHold)。
- **remove 的 build 忽略重提交的 publicationRef**:冻结目标被静默采用,请求说 B、
  提交 A。补 `boundPublicationId`(从冻结 id 重铸密封 ref、要求相等),与 media/
  child 绑定同型。

全部修复逐条证伪(逆向编辑回退),全部 CAUGHT。全量门禁绿(unit 558、db 205、
e2e 40)。

## 2026-08-04 — release_publish_process:多命令 ingress 形状落地

结构性阻塞三条中的第一条解除。ingress 现准入 **24 action + 9 query**;显式未路由
恰为 organize(待合同决定)与 reschedule(等 T-007)两条。

### 形状:传输层 fan-out,不是内核命令

`commitTargetRelease` 自持 `$transaction` 并逐目标写入
PublicationRelease + Receipt + CommandExecution(attempt 身份作父)——单内核事务会把
三十家庭发送变成跨家庭 all-or-nothing,正是 D-09 禁止的耦合。因此传输层新增
描述符变体 `fanout`(与 `build` 互斥的联合类型):

- **prepare**(`prepareReleasePublishProcess`):与提交循环共享
  `resolveReleaseAttemptContext` 门禁(单一来源,prepare 拒绝的 execute 必以同码
  拒绝);确认冻结注册表的 `draft_revision must_equal` 头 = 本次要发布的 revision;
  preview 报 target_count / already_committed_count / release_revision。冻结合同的
  输入是 emptyInput,非空 operation_input 直接 needs_input。
- **execute**(`executeReleaseFanout`):镜像 `withHarnessConfirmation` 的分类语义
  (expired/replayed/revoked/actor 漂移),但在服务层做 CAS 消费——没有单一命令事务
  可以容纳它;完整性标签由冻结值重建验证。域函数新增
  `expected_release_revision`:两步之间有同事保存 → 全 attempt 层面
  `stale_confirmation`(证伪:守卫撤除时单测与 e2e 均红)。
- **回答**:`committed_result` 用已冻结的 `releaseResult` schema(processState/
  frozenRevision/results/summary/missedSendAttention);execution_ref 与
  output_refs 只命名 attempt(`publicationReleaseAttemptIdentity`,即每条逐目标
  execution 的 parent hash)——逐 release 命名会在整班进程上越过 32-ref 上限,
  正是本日复核修掉的缺陷类。committed>0 → committed;全部确定性拒绝且零提交 →
  `no_target_committed`(无任何写入,诚实 not_committed);有 outcome_unknown →
  整体 outcome_unknown。
- **重放语义是声明的差异**:消费掉的确认不可重放(conflict),对账 = 重新 prepare
  + 新 attempt——`already_committed` 由行存在性识别,不靠命令身份。e2e 钉住:重放
  拒绝、re-prepare 报 already_committed_count=1、对账 execute 返回与首次相同的
  sealed publicationRef、release 行数仍为 1。
- **部分提交**:两目标、prepare 后撤销一家 Grant → committed 1 + rejected 1,
  另一家不回滚(e2e)。

### 证伪

stale_confirmation 守卫(单测 CAUGHT)、确认 CAS 消费撤除(e2e 重放测试 CAUGHT)。

## 2026-08-04 — 1.15.0 旋转:organize 合同决定 + discard 爆炸半径头

冻结修订(见 06 文档 Amendment 2026-08-04)与复核 finding「discard 唯一冻结头
永不漂移」同一次 additive 旋转关闭:

- **organize 通道**:targetPolicy `exact_bound` → `owner_option_required`——空输入
  + exact_bound 让两个班的老师没有任何说"整理哪个班"的通道;目标选项是
  owner-issued 班级选择器。
- **organize outcome 扩展**:枚举增 `needs_review` 与 `direct_interaction_required`,
  结果新增可选 `directInteractionAction`——B5 落地的 D-15 动作正是经此面世
  (available 携带精确 capability ref + targetOptionRefs;unavailable 走冻结分类)。
- **discard 爆炸半径头**:`referencing_draft_count must_equal`。`media_asset_revision`
  被 schema 声明为不可变,单独作头是构造上不可能失败的检查;确认里的
  `affected_draft_count` 现在是冻结头——prepare 与 execute 之间任何草稿增删该
  资产都是 `stale_confirmation` 而不是静默不同的提交。e2e 钉住(prepare 预览 1、
  同事清空 composition、execute 拒绝、资产 lifecycle 不动),证伪(撤头)CAUGHT;
  phase-2 head-conformance 普查在映射更新前就先咬住了新头——双层防线各自工作。

制品 `1.14.0` → `1.15.0`(sha256:a5e8e226…),shared core 与其余 slice 逐字节不变。

## 2026-08-04 — organize_care_capture_batch 端到端:最后一条 T-006 自有能力路由

ingress 现准入 **25 action + 9 query**;显式未路由仅剩 `reschedule_publish_process`
(等 T-007 provider)。B4 的 T-006 侧至此完整。

### 手动"整理"路由

- **owner 选项通道**(1.15.0 修订的落地):prepare 无 target 时给出 owner-issued
  班级选项(`issueBoardSealedRef` kind `care_group`);两个班的老师由此说"整理哪个班"。
- **单命令、单事务**:新 owner 槽 `careCapture`(`PrismaCareCaptureTransaction`)——
  批次 collecting→organized(CAS on `aggregateVersion`,即 `capture_batch` 冻结头)、
  PublishProcess + revision 1 + targets、安全评估行,一起落或一起不落;
  `processKey = careGroupId~commandRequestId`,批次存 `triggerRequestId`,同一
  trigger 身份不可能第二次切批。
- **手动路由绕过 idle/quiescence 门,但绝不绕过**:T-007 策略解析(institution
  payload 的 `publicationPolicyRef` 精确匹配 + head + timeZone,数字参数取冻结
  pilot 默认;未解析 → `policy_unavailable` fail closed)、stable-prefix watermark、
  安全路由(存储 markers → `evaluateContentSafetyRoute`;NULL markers = 未读源,
  fail closed)。
- **同步/异步分界**:authorize 同步判定全部拒绝路径(actor、批次、策略、装配、
  目标集);apply 只补一个异步件——B5 的 T-005 资格读取。受限路由的
  `directInteractionAction` 由此在 organize 结果面世(e2e 钉住 available + 精确
  capability ref + 1 个 option、原始 enrollment id 不出现)。
- **精确班级角色查询**(而非 `resolveCaregiverReach` 的"第一个班"):G3-E 已知的
  双班盲点在这条新 lane 不再复制。
- **评估行双锚**:`direct_interaction_required` 不建 process,评估以 CareGroup 为锚
  记录(`publishProcessId` NULL)——最该留痕的决定不再无处可记。

### finding 4 关闭

revision-0 草稿保存的仓储契约问题按复核裁定属于本 lane:organize 在切批事务内
直接创建 revision 1(含 title/body envelope、composition、`sourceRefsPayload`、
`commandRequestIdHash`),"存在 process 而无 revision"的状态在这条路径上不可构造,
`expectedDraftRevision >= 1` 的保存契约由构造保证。

### 证伪

受限路由与候选创建的分离(把 direct 路由也建 process)→ e2e CAUGHT;
capture_batch 头(prepare 后新采集到达)→ `stale_confirmation` e2e 钉住;
phase-2 普查在三张名单更新前先行咬住(工厂数、头映射、debt 名单)。

## 2026-08-05 — G3-E 自备:双班照护者盲点清除

G3-E 就绪评审点名的已知缺陷:`resolveCaregiverReach` 返回"第一个班",两个班的
老师的第二个班在全部能力 lane 里不可达。修复分三类,共 17 处调用点迁移:

- **键/资产列表**(release/safety/editable 键、可归属媒体)→
  `resolveCaregiverReaches`:并集覆盖该参与者当前全部班级,第二个班的 sealed ref
  从此可解析。
- **行范围事实与写**(cancel/hold/draft、release facts、commitTargetRelease、
  safety write facts、attribution 四方法、media lifecycle、publish-lane
  loadProcess)→ 先取行、再 `resolveCaregiverReachFor(行自己的班)`:授权问题问
  的是"这个参与者现在是否持有**这一班**",不再是"随便哪个班先来"。附带的语义
  收紧:同级班照护者现在连事实都读不到(null / target_unavailable),不再拿到
  `matches_source: false` 的 authority——四个负例断言随之更新,拒绝形状与
  sealed-ref 的存在性隐藏纪律一致。
- **看板范围**(teacher board scope / child today)保持单班 posture:三条看板
  query 是 `exact_bound`,板级班选择器是另一次合同修订(与 organize 同型),
  记录为后续决定;`resolveCaregiverReach` 保留但注释限定"仅看板 posture 使用,
  能力 lane 禁用"。teacher publish queue 改为按**被请求的班**精确解析
  (此前第二个班直接 unauthorized)。

正面证明:双班老师两个班的键都在列表、第二班的行以第二班的 authority 加载
(`matches_source: true`);证伪(单点回退到 first-group)CAUGHT。

## 2026-08-05 — G3-E 自备:多子女 guardian 家庭选择器

`query_guardian_family_board` 的注册合同本就是 `unique_eligible_default`——唯一时
默认、多个时经 owner 选项选择;实现却无条件绑最早创建的 family。无需旋转,按合同
补齐实现:

- **owner 读**:`resolveReachableFamilies` 枚举该 guardian 当前全部可达 family;
  `loadGuardianScope` 接受可选 `bind_family_id`(必须可达,否则 unauthorized);
  `eligible_enrollments` 跨全部 family 枚举并携带各自的 `family_id`——选项集跨
  family,看板绑定始终单 family。
- **presenter 重绑**:enrollment 选项 ref 解析到另一个可达 family 的 enrollment
  时,整个看板(标签、focus、activity)重绑到那个 family——绝不混排两个家庭;
  focus/activity 模块读经 `bind_family_id` 跟随看板绑定,不再各自回落到
  "最早 family"。
- 默认行为不变:无选项时绑唯一/最早 family。
- DB 测试:双子女 guardian 默认绑最早、两家 enrollment 都在选项集、按第二家
  重绑标签正确、不可达 family 拒绝;证伪(owner 忽略 bind)CAUGHT。

## 2026-08-05 — G3-E 自备:owner-integration 证据层

合成资格化按设计不主张真实 owner 路径;新增 `verify:owner-integration`
(`scripts/surface-contract/run-owner-integration.mjs`)作为缺失的证据层:

- **普查先行**:从传输层读出 formal ingress 准入的全部 key(25 action + 9
  query),任何一个在端到端套件里连名字都没出现即失败——先于任何测试运行。
  普查揭示 3 条 query 无真实路径证据(guardian enrollment activity /
  caregiver child today / teacher publish queue),已补 e2e(owner 选项选择、
  原始 id 线上扫描)。
- **证据本体**:真实 scenario-service HTTP + 一次性 PostgreSQL 的两套 e2e
  (harness 49 + binding-owner 6)。
- **主张边界**:明确打印 joint-conformance=NOT-RUN——T-007 provider 与 T-005
  G2-C 联合运行仍是外部门控的独立资格化,这一层不冒充。
- 证伪:把一条 query 字面量拆开(census 抓不到)→ 失败,CAUGHT。

## 2026-08-05 — G3 closure implementation candidate (DB qualification pending)

本轮候选实现把“等待 T-007 provider”从外部门控变为仓库内、default-off 的 exact
owner path，但尚未执行任何数据库写入，也尚未宣称 G3-E 通过：

- Prisma SSOT 新增 `NurtureInstitutionPublicationPolicy` 与迁移；策略按 exact
  Workspace + Institution、effective window 和唯一 current row 读取，缺失、歧义、
  非法 IANA timezone、contract drift 或相对历史最大值回退 version/head 全部 fail
  closed。
- capture、queue、board、schedule/reschedule/release 统一消费 typed provider，删除
  publication-policy loose JSON fallback；content-safety JSON 是另一个 owner concern，
  未被混入本次替换。
- idle/daily-fallback resolver 不再接收 caller policy；host timer 只提交 trigger kind
  与 identity，timezone/head/threshold 全部来自 capture owner read 同次返回的 exact
  T-007 provider fact。缺失 policy 时 trigger 以 `policy_unavailable` fail closed。
- organize apply 不再把所有批次硬编码为 `manual`；事务输入携带已判定的 trigger evidence，
  owner 原子保存实际 trigger、policy ref/head、timezone、quiescence、观察到的 user-activity
  head 与 stable watermark。已经切出的批次因此不会被后续 policy 换版重解释。
- schedule 读取统一要求七个冻结字段，并修复了把 process `aggregateVersion` / `updatedAt`
  冒充 policy version / resolved-at 的跨层错误。
- organize 只创建带 exact authorizing-role 的 `draft`；新增 scenario-side
  Serializable queue-admission owner transaction，在 30 秒快捷调整结束后重读 role、hold
  与 T-007 policy，再原子写入 `pending_release` 和七字段 schedule。My-Chat 仍只拥有
  timer/retry，不拥有该业务判断。
- `reschedule_publish_process` 已进入 formal runtime/OpenAPI，准入普查从
  25 action + 9 query / unrouted 1 变为 26 action + 9 query / unrouted 0。
- 新增 T-007 provider 负向 DB 测试；正式 scenario-service 联合旅程现在使用同一事实链：
  formal organize → provider-backed admission → formal reschedule → formal release，未再由
  测试手工填充 schedule。另一条联合旅程把 T-006 产生的 direct-interaction option
  交给真实 T-005 `initiate_caregiver_direct_message` prepare + execute。
- 另有冻结边界用例：draft 尚未入队时将 owner policy 从 version 1/head 5 换到
  version 2/head 6，admission 必须按新 policy 解析并一次性固化七字段；入队后的
  reschedule/release 则在同样换版时以 `publication_policy_drift` fail closed。
- 两条联合旅程只有在最终持久化断言通过后才分别记录
  `joint:t007_t006_publication` 与 `joint:t005_t006_direct_interaction` runtime evidence；
  owner-integration census 缺任一 marker 都失败，单能力的孤立成功不再能冒充联合证明。
- T-007/T-006 旅程现继续读取 guardian enrollment activity：要求真实
  `PublicationRelease` 的 delivered Receipt 出现于家庭投影，并从 protected revision
  解封安全标题。审计发现并删除了把内部 `PublishProcess.processKey` 当家庭摘要返回的
  泄漏；联合 marker 只有在 Receipt、家庭投影和 raw-id 扫描全部通过后才记录。
- owner-integration runner 在任何数据库套件前先执行 live workflow/source pin 与
  preserved T-005 G2 Exit 守卫。当前浮动 sibling checkout 不等于冻结 owner；正式
  资格化必须在相邻的 exact detached worktree 拓扑运行，使 verifier 读取的 source 与
  package-manager link 实际加载的 source 是同一份。
- release 对缺失、过期、错误 CareGroup/role 或失效 Participant 的 authorizing role
  全部 fail closed；迁移在任何 DDL 前执行 partial-schedule census，并用显式事务避免
  gate 或后续 DDL 失败留下半迁移状态。

已完成 repo-only qualification；数据库阶段仍等待明确授权。授权后的下一步是将
`20260805090000_t007_publication_policy_provider` 应用到 disposable local PostgreSQL，
在 exact detached owner 拓扑运行 provider DB、scenario-service owner/joint suites、
population/final false-empty census 与完整 gates。任何一项失败都不签发 handoff。
