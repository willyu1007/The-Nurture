# Plan — 儿童照护双看板

## Phase 0 — Fact and Projection Inventory

- 盘点 T-002 中 focus、attention、daily care、media 和 publication 相关事实。
- 区分园所内部 raw capture、家庭发布候选、published care fact/visibility 与
  ActionDelivery；不得用一个状态表复制所有 owner 的生命周期。
- 按业务含义分别盘点 focus、daily care、attention、media、publication 与
  CareInteraction 的 owner、lifecycle、authority 和 mutation capability；看板模块
  只在 presenter 层组合这些事实。
- 将 T-003 两个 board surface 的模块映射到共享事实与角色投影。
- 列出缺失字段、权限来源和待解锁 gate。

## Phase 1 — Shared Care Read Model

- 建立 child-scope-first 的 care timeline / current focus / daily care 查询。
- 建立共享的 board projection pipeline，复用 canonical facts、模块语义、
  provenance、snapshot 和排序规则，但不持久化第二份统一 child state。
- daily care 与 attention 等事实保持独立 lifecycle；同一看板卡片可以组合展示，
  但每项修改必须路由到原 canonical owner。
- 分别定义 guardian 与 caregiver 的查询策略、policy filter 和 public presenter；
  不建立先加载全部角色数据、再在 presenter 隐藏字段的跨角色超级 DTO。
- 对与当前角色相关的园区管理请求/结果，消费最小
  `InstitutionWorkflowProjection`；不读取 raw Run/Step 或园区内部备注。
- 固定空态、过期、撤回、更正和权限不足状态。

验收：

- 同一事实的两种投影保持一致 provenance。
- 任意 aggregate 均不能绕过 row/fact-level policy。

## Phase 2 — Caregiver Capture and Work Queue

- 定义快速记录、photo/media attribution、attention 和待办/待确认项目。
- 只有内部采集被明确选为家庭发布候选时才创建/进入 `PublishProcess`；普通班级记录
  可以保留在园所内部而不产生家庭发布。
- 支持草稿保存和后续继续，不把草稿直接发布给家庭。
- 原始拍摄/记录先进入当前 CareGroup 待整理批次；单张采集、上传完成或 media ready
  不创建 family-publication candidate，也不启动 30 秒。
- 整理由本班老师点击“整理”，或命中园区可配置的静默期/每日兜底时点触发；Pilot
  默认 10 分钟静默期与 `default send window - 30 分钟`（17:00 对应 16:30）。
  正常 idle trigger 已自然满足一分钟 gate；兜底先标记 due，连续一分钟无用户操作
  后立即切批，不再等待完整 10 分钟。
- 一分钟 capture-quiescence gate 默认可在 30 秒～3 分钟内配置；任一本班老师的采集/
  增删/选择/编辑或有效 capture-activity lease 重置它。后台上传、缩略图、heartbeat
  和 provider 进度不重置、不阻塞；自动整理启用时 gate 不可设为 0。
- 手动“整理”绕过 quiescence gate。所有 trigger 按 stable source watermark 切批，
  未完成上传、未保存及之后的新拍摄进入下一批。
- 普通、高置信整理结果提交为 draft 后提供 30 秒快捷调整；用户触碰编辑即暂停推进，
  超时只进入 pending-release queue，且候选不能在自身 deadline 前发布。
- pending-release 内容在实际发布前持续可编辑，不要求逐条二次审批；正在编辑或存在
  未保存 revision 时跳过当前发布批次。
- 支持低打扰内联微调：展示偏好可以本地更新，业务草稿/归属/focus/publication 调整
  调用对应 canonical owner 的 versioned capability；不得直接 patch read snapshot
  或 derived cache。
- My-Chat 负责受保护的本地媒体缓存、缩略图、离线上传队列、进度和重试；Nurture
  不读取本地文件路径，只在稳定 media ref 后管理业务 lifecycle 与 attribution。
- 自动整理使用老师原文、My-Chat 语音转写和版本化模板组装标题/标签/元数据；
  photo-only 不强制生成正文，也不因 copy provider 不可用而阻塞。
- AI copy 只在本班老师显式请求“帮我整理一句/润色”，或独立日/周总结能力中产生
  suggestion；老师选择采用后才进入当前 draftRevision，不自动覆盖原文。
- Nurture `ContentSafetyPolicy` 结合硬规则与可选 classifier signals，最终派生
  ordinary / review-required / direct-interaction-required；classifier 不拥有 route。
- ordinary 进入 D-10，灰区进入 needs_review。磕碰/健康/用药、明显情绪行为事件、
  身体隐私/裸露/如厕影像、证件/联系方式等 direct-interaction 内容不进入批量发布；
  只有 T-005 提供当前可用的专用 caregiver-initiated capability 时，本班老师才通过
  owner-issued action 显式启动 CareInteraction；现有普通 family-question action
  不能作为降级路径。
- T-007 园区策略只能提高 tier/阈值；老师可提高 tier 或修改灰区后重判，不能降低硬
  门禁。provider failure/低置信/冲突不默认 ordinary。
- D-14 专用 `ClassScopedFaceMatch` 可在默认关闭的隐私门禁、当前班级范围和高置信
  profile 全部满足时自动确认孩子归属；该例外不扩张到文案或安全路由。
- 同一内容面向多个孩子/家庭时，teacher board 保留一个共享编辑的
  `PublishProcess` 卡片；target 使用 Nurture owner-issued opaque ref，不接受客户端
  或 AI 自行拼装 raw child/family ID。
- Nurture 持久化当前 PublishProcess draft/revision；My-Chat 使用按
  account/Workspace/scenario 隔离的受保护本地 working buffer，约 1 秒 debounce 调用
  versioned autosave capability。
- 在线编辑先取得单一短期 edit hold；其他本班老师可查看但暂不同时编辑。hold 暂停
  scheduler，却不形成个人 owner、业务 authority 或新的 lifecycle。
- pending_release 内容只允许在线取得 hold 后编辑；离线只准备尚未进入服务端待发送
  队列的新草稿/media。
- stable media ref 进入 Nurture 后，分别维护 media asset lifecycle 与 child
  attribution；publish eligibility 始终派生，不增加统一 media-publication 状态。
- 支持从单张卡片 detach、未发布 asset 全局 discarded、发布后逐目标 visibility
  removal 或全局 redaction；物理 storage cleanup 由无引用和 retention policy 驱动。
- 群像媒体要求所有清晰可见孩子的 confirmed attribution 与目标 audience exposure
  policy；否则进入 needs_review，等待人工纠正、整图移除、目标调整或拆分。首轮产品
  不修改原图、不 crop、不 blur。
- 自动匹配只使用 current exact CareGroup/current Enrollment 中当前允许用途的孩子
  头像 reference set，不使用全园/跨班/离园历史库或跨照片 history match；高置信结果
  自动 confirmed，低置信、相似/遮挡、未知和冲突才要求老师处理。
- reference template 按 CareGroup/purpose 加密隔离，照片临时 embedding 匹配后删除；
  consent/PIPIA/retention/withdrawal/processor contract/正式隐私评审未齐时禁用 matcher
  并回退人工归属。

## Phase 3 — Two-stage Publish

- 以 `PublishProcess` 管理一个 caregiver 可见、共享编辑的 family-publication
  content unit；同一 source CareGroup、source refs 与 shared content revision 可以
  关联多个 owner-issued target candidate。
- 实际跨边界 effect 拆为逐目标 `PublicationRelease`：每条独立绑定精确
  ChildCareProcess、Enrollment、child-scoped Family、原 Grant、data class/purpose，
  并拥有独立 publication ref、Receipt、authority check、idempotency 和 retry。
- 多目标发送不是跨家庭事务：一个目标失败不回滚其他合法目标，并返回明确逐目标结果。
  若目标需要不同正文或媒体组合，则拆成不同 `PublishProcess`。
- `PublishProcess` 使用 draft / needs_review / pending_release / released / cancelled
  五状态；只有异常内容进入 needs_review，普通内容从 draft 进入 pending_release。
- scheduledAt 是属性，sending/failed 属于 execution/逐目标结果，delivered 属于
  ActionDelivery；这些都不扩张 `PublishProcess` 主状态机。
- 首个 `PublicationRelease` commit 将共享 revision 冻结并使 process 进入 released。
  部分成功由逐目标结果和派生 summary 表达；零目标提交则保持 pending_release。
- released+partial 的剩余目标只允许基于冻结 revision reconcile/retry；共享正文、媒体
  组合或目标语义需要变化时创建新的 `PublishProcess`/replacement，不回写原 revision。
- cancelled 只允许在任何 release commit 前发生；角色授权由 D-07 冻结。
- 所有 T-006 内容操作只授权给当前 exact CareGroup 的合格 caregiver；同班老师共同
  处理 draft、needs_review、pending_release 与低频发布后安全动作，不形成 creator-only
  ownership。
- Lead designation 留在园区日常运营管理，不进入 T-006 capability eligibility。
  Institution Admin、园区成员或 system operator 也不能代替 exact CareGroup caregiver。
- CareGroup 是家庭侧业务发送方；每次创建、编辑、确认、发送和安全处置仍记录真实
  executor 与 RoleAssignment episode。
- 每次 autosave 携带 expectedDraftRevision 并返回新 revision；冲突时 refresh/rebase，
  不允许 last-write-wins。发布只绑定已保存 revision，local buffer、saving 或 failed
  状态均不可被 scheduler 采用。
- pending_release 默认解析为园区当地 17:00 的 scheduledAt 与 19:00 的 notAfter；
  园区 schedule policy 由 T-007 管理，T-006 保存解析结果、timezone 和 policy head。
- “现在发送”是本班老师的 explicit action，不再弹二次确认；needs_review、active
  edit hold、saving/failed 或未提交 revision 均不可立即发送。
- scheduler 在 scheduledAt 后、notAfter 前按 exact saved revision 和 authorizing
  caregiver RoleAssignment 执行；role/policy/target/media drift 跳过，不能静默替换
  授权老师。
- transient failure 在 notAfter 前使用相同 command identity 重试；
  outcome-unknown 先 reconcile，partial failure 只重试对应目标。超过 notAfter 留队并
  呈现 missed-send attention，不顺延或深夜静默发布。
- 常规修改机会集中在实际发布前。发布后不创建 5 分钟/24 小时复查窗口或老师待办；
  correction、target visibility removal、replacement 与 redaction 作为低频、无固定
  过期时间的安全 capability 保留。
- 不把相机/上传、AI provider execution、T-005 `CareInteraction`、My-Chat
  `ActionDelivery` 或园区 `InstitutionWorkflow` 的状态合并进该过程。
- 通过 T-004 Harness 冻结 capability-specific heads；在发布事务中重新读取
  authority，并原子提交 domain effect、Receipt 与 CommandExecution。相同 command
  exact replay，payload/head drift 明确 conflict/stale。
- 将已发布事实投影到 guardian board 和必要的 conversation item。

## Phase 4 — Qualification

- 跑同一孩子的 caregiver capture → review → family board receipt 旅程。
- 验证看板内联微调提交到正确 canonical owner，并在重新读取后反映；直接修改
  snapshot/cache 不得形成业务事实。
- 验证拍照/上传不启动倒计时；manual、10 分钟 idle 与发送前 30 分钟兜底 trigger 按
  stable source watermark 切批，相同 trigger 不重复建卡。
- 验证 manual 绕过一分钟 gate；正常 10 分钟 idle 不重复等待；兜底 due 后只等待
  一分钟无用户操作。任一本班老师的 capture/edit lease 重置 gate，后台上传/机器进度
  不重置，未稳定上传和后续拍摄进入下一批。
- 验证 30 秒只在普通、高置信整理 draft 提交后启动；超时只入队、编辑暂停推进、
  deadline 前不可发布、发布前持续可改，以及发布后无强制复查工作。
- 验证自动 photo-first organizer 只使用原文、转写和版本化模板；photo-only 无正文、
  copy provider failure 或 malformed output 都不阻塞确定性路径。
- 验证日常整理不会静默调用生成式 copy；只有老师显式请求或独立总结能力可调用，
  suggestion 必须选择采用后才进入 exact draftRevision，拒绝不改变原文。
- 验证 AI copy 的每条 claim 绑定 source refs，不新增事实/情绪/原因/频率/引语/发展
  结论，不改变不确定性，并且不保存 chain-of-thought。
- 验证 ContentSafetyPolicy 硬规则优先于 classifier；园区只能收紧，老师可提高 tier
  或纠正灰区，但 classifier/园区/老师都不能降低 product hard fence。
- 验证 ordinary 进入普通 draft，review-required 进入 needs_review，direct-interaction
  保留内部来源且只提供 T-005 owner-issued action；T-006 不自动创建 CareInteraction。
- 验证 T-005 专用 caregiver-initiated capability 不存在、不可用或不满足当前门禁时，
  T-006 显示安全阻塞且不复用普通 family-question action、不降级到批量发布。
- 验证 candidate/edit/release current-reread source/content/policy/target/risk heads；
  provider failure/低置信/冲突 fail closed，policy drift 阻止既有 draft/pending 发布
  而不新增 PublishProcess state。
- 验证 My-Chat 本地缓存 logout/撤权清理、owner-reread denial 和离线重试不会绕过
  Nurture media/publication authority。
- 验证错误 child scope、撤销 grant、并发发布、重复提交和媒体归属。
- 验证一个共享内容 revision fan-out 到多个目标时逐目标授权/Receipt，部分成功不回滚，
  且重试只补偿失败或 outcome-unknown 目标。
- 验证目标特有正文或媒体组合必须拆分内容单元，不能隐藏在共享 revision 中。
- 验证普通/异常候选的五状态合法转换、首个 release 后 revision 冻结、零提交保持
  pending_release，以及 release 后不能退回草稿或整体取消。
- 验证 released+partial 只对未提交目标按冻结 revision retry/reconcile；任何正文、
  媒体组合或目标语义变化都创建新 process/replacement。
- 验证 timer、scheduledAt、CommandExecution、逐目标结果和 ActionDelivery 不污染
  `PublishProcess` lifecycle。
- 验证同班另一位当前合格 caregiver 可以继续编辑、确认、发送或取消共享 process，
  而跨 CareGroup、仅 Lead、仅 Institution Admin 或仅园区成员身份均被拒绝。
- 验证 CareGroup family-facing sender 与 creator/editor/reviewer/executor 个人审计
  同时保留，且个人审计不变成独占权限。
- 验证约 1 秒自动保存、saving/saved/failed UI、离开前 flush/discard 选择和本地缓冲
  logout/撤权清理。
- 验证单一 edit hold 的取得、heartbeat、完成/离开/超时释放；另一位老师只读等待，
  scheduler 在 hold 有效时跳过。
- 验证 expectedDraftRevision conflict 不静默覆盖，只发布已保存 revision；连接中断后
  local unsaved buffer 不冒充服务端暂停或业务事实。
- 验证 pending_release 离线编辑被拒绝，而离线新草稿/media 可在恢复连接后按当前
  owner 和 revision 重新提交。
- 验证 17:00/19:00 按 institution timezone 解析、server clock 执行，园区默认策略
  变化不静默移动已排期 process。
- 验证“现在发送”无需二次弹窗但必须通过 saved revision、无 active hold、current
  role/policy/target/media 等全部门禁。
- 验证 scheduler 延迟可在 notAfter 前 exact retry，超过窗口留队；permanent rejection
  不盲目重试，outcome-unknown 必须先 reconcile。
- 验证 media preparing/ready/unavailable/discarded/redacted 与 attribution
  candidate/confirmed/rejected/superseded 独立转换，published 不污染两者。
- 验证 ready 不等于 publishable；exact media revision、全体可见孩子 attribution/
  exposure、Grant、scope 和 redaction 任一不满足都阻止 release。
- 验证 detach 只影响当前 process；全局 discarded 仅限无 committed release，发布后
  target removal/redaction 不删除 Receipt/audit，storage GC 遵循引用与 retention。
- 验证 `ClassScopedFaceMatch` 只使用当前班级有效头像 opaque refs；质量/top-1/margin
  均过线时自动 confirmed，低置信、相似/遮挡、未知或冲突进入 needs_review，且人工
  纠正 supersede 自动结果。
- 验证群像中的未知、未确认或不允许跨家庭展示孩子阻止自动入队，只能通过纠正归属、
  整图移除、目标调整或拆分解决；发布引用始终是未改动的 exact original-media revision。
- 验证禁用/撤回/离班/Enrollment 结束立即停止匹配并失效 reference template；临时
  embedding 删除、班级隔离和 provider no-training/no-secondary-use 均有证据。
- 验证没有 ranking、诊断或私域泄漏。

## Exit Gate

双看板黑盒旅程通过；宿主相机、原生列表性能和设备交互留给 My-Chat companion。
