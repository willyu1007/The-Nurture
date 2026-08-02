# Architecture — 儿童照护双看板

## Core Principle

看板是 Nurture facts 的角色化 projection，不是新的事实所有者。Guardian board 和 Caregiver board 不各自维护一份“孩子状态”。

## Stage G3 Architecture Boundary

Stage G3 的依赖结构为：

`G3-0 exact facts/contracts/schema`

`→ G3-A role-safe shared board foundation`

`→ G3-B capture-to-saved-draft`

`→ G3-C content/media publish eligibility`

`→ G3-D per-target release + Guardian reread`

`→ G3-E real cross-task qualification + Beta Profile Handoff`

G3-A/B/C 可在 shared refs/heads 冻结后并行。G3-D 不直接读取 capture transport、
provider state 或 derived board cache，只消费 G3-B 的 exact saved revision 与
G3-C 的 current eligibility。G3-E 才把 provider/consumer、owner path 和正式 ingress
合并为一个 qualification subject。

### Required and optional lanes

- Required：G3-B1 deterministic assembler、G3-C1 manual attribution/exposure、
  G3-D publication/release、G2-C direct-interaction integration 和 publication-policy
  owner contract。
- Optional：G3-B2 explicit AI copy、G3-C2 `ClassScopedFaceMatch`、按 beta profile
  选择的 `InstitutionWorkflowProjection` board module。
- optional capability absent/default-off 必须是明确 profile 选择，不能伪装为
  `PASS_WITH_LIMITATIONS`，也不能削弱 deterministic/manual main path。

### Cross-task ownership without cycles

- T-005 owns G2-C provider effect/Receipt/protected composer；T-005 provider
  qualification 可使用 exact synthetic consumer fixture，不等待 T-006 completion。
- T-006 owns safety-route consumer action and G3-E joint journey；它等待 exact G2-C
  provider，但不反向成为 T-005 Exit 的整任务依赖。
- T-007 owns publication-policy configuration and version head；T-006 resolves and
  persists schedule values for each process。T-007 full task/Workflow completion is
  not a G3 prerequisite。
- T-008 owns later beta-profile freeze and Candidate evidence；G3 只交付 qualified
  T-006 handoff。

## D-01 — Operable Shared Projection Pipeline

双看板共享 canonical facts、board 模块语义、provenance、snapshot 与排序规则，但
不新增一个持久化的统一 child-state aggregate，也不向两个角色暴露包含全部字段的
super DTO。每个请求先解析当前 actor、Workspace、child/CareGroup scope、Grant 与
fact visibility，再只读取该角色可用的事实，最后由 Guardian 或 Caregiver presenter
形成 T-004 `SurfaceEnvelopeV1` 下的角色独立 content。

请求期组合出的 board snapshot 是 derived read result：它可以缓存或按性能证据增加
可重建索引，但不是授权输入、事实写入目标或历史真相。删除、过期或失效后必须能够从
canonical facts 重建。不得先加载跨角色完整事实，再依赖 presenter 隐藏敏感字段。

“snapshot 不可直接修改”不表示看板只读。看板是可操作的领域投影窗口，用户可以原地
完成低打扰微调，但写入路径按 effect 分类：

- 排序、折叠、筛选和默认日期等展示偏好写入 surface/host preference，不改变业务事实。
- AI suggestion、草稿正文、备注和发布时间等发布前调整写入 `PublishProcess` draft。
- child attribution、media attribution、focus 和其他业务调整调用对应 Nurture
  canonical owner 的 versioned capability，并保留 actor、version 与 provenance。
- 已跨家庭边界发布的内容不得静默覆盖，使用 correction、target visibility removal、
  replacement 或 redaction 的明确能力。

所有业务修改提交后通过 invalidation + owner-reread 重新生成 board projection。
客户端 MAY 提供原地或 optimistic 反馈，但未提交 snapshot 不能成为其他查询、权限、
Receipt 或 ActionDelivery 的事实来源。

## D-02 — PublishProcess Purpose and Ownership Boundary

`PublishProcess` 是 caregiver-side 的内容发布领域过程，不是用户需要理解的功能名。
它解决“一条园所内部内容如何在明确归属、人工可控和重新授权后成为家庭可见事实”：

```text
internal capture
  -> selected as family-publication candidate
  -> suggestion / attribution / draft adjustment / review / release timing
  -> atomic Nurture publication + Receipt, or pre-publication cancellation
```

过程从内部采集被明确选为家庭发布候选时开始。拍照、录入或上传成功本身不会自动创建
家庭发布，也不会使内容对 Guardian 可见。可编辑阶段在首个逐目标家庭发布事实与
Receipt 原子提交，或在发布前取消时结束；未提交目标继续基于已冻结 revision
reconcile/retry。发布后的 correction/replacement/redaction 通过明确的后续事实和
capability 衔接，不原地改写既有发布。

`PublishProcess` 主要由 Caregiver teacher board 操作，并绑定当前精确 CareGroup、
child/target attribution、source provenance 与发布所需 authority。自动 organizer
默认使用确定性 content assembly；可选 AI copy 只能产生 suggestion。Guardian 是发布
结果的授权消费者；My-Chat scheduler/worker 只能执行已经获得业务授权的技术调用，不能
成为虚假的内容作者或业务审批人。精确的
T-006 操作权限由 D-07 固定为当前 exact CareGroup caregiver；Lead 不进入该发布
过程。

它明确不拥有：

- 相机、相册、语音转写、上传、缓存或设备权限；
- T-005 Message/CareItem/acknowledge/reply `CareInteraction`；
- My-Chat notification、Handoff、Outbox、deep link 或 device `ActionDelivery`；
- 园区管理 `InstitutionWorkflow` Run/Step；
- AI provider job 的技术执行状态。

终端产品只显示草稿、待确认、待发送、已发布、已取消等生活化状态，不展示
`PublishProcess` 术语。published 只表示 Nurture 发布事务已经提交，不表示通知或设备
投递完成。

## D-03 — Domain Facts Stay Separate, Presenter Content Composes

“领域分离”不是把 UI 内容机械分成几种卡片，而是让不同业务含义继续拥有独立的
canonical fact、lifecycle、authority 与 mutation capability：

- focus/charter 表达长期方向；
- daily care 表达已发生的照护事实；
- attention 表达当前需要处理或关注的工作；
- media asset/attribution 表达媒体可用性、孩子归属与业务授权；
- publication 表达哪些内容已跨边界向哪个家庭释放；
- CareInteraction 表达家庭问题、班级确认与回复。

Guardian 或 Caregiver presenter MAY 把多个事实组合到同一语义卡片或模块，但组合结果
不成为新的万能 board-item truth。修改午睡记录不关闭 Attention，移除照片不删除
DailyCareLog，Grant revoke 不物理删除历史，发布事实也不自动成为 CareInteraction。
每个 action 必须回到对应 canonical owner。

## D-05 — Shared Content Work Unit, Target-specific Releases

teacher board 延续 HTML 构想中的“一个内容卡片、显示多个家庭目标”，但该 UI 汇总不
是跨家庭 authority 或 publication truth。发布使用两级模型：

```text
PublishProcess
  (one caregiver-visible card + exact source CareGroup + shared content revision)
  ├─ PublicationRelease -> target A
  ├─ PublicationRelease -> target B
  └─ PublicationRelease -> target C
```

`PublishProcess` 是 caregiver 共享编辑单位：绑定精确 source CareGroup、source refs、
共享正文/媒体 revision 与多个 Nurture owner-issued opaque target candidate。老师对
相同内容只编辑一次；客户端和 AI 不得传入或推断 raw child/family ID。

`PublicationRelease` 是逐目标跨边界业务 effect。每条 release 独立绑定当前精确
ChildCareProcess、Enrollment、child-scoped Family、原始 Grant、data class/purpose、
publication ref、authority evidence 与 Receipt。提交时逐目标 owner-reread 并分别
原子提交，不存在跨家庭全有或全无事务。

- 一个目标失败不回滚其他已合法提交目标；调用结果明确返回逐目标
  committed / rejected / outcome-unknown，不用“发布给 N 个家庭”的汇总冒充成功。
- 重试只作用于失败或 outcome-unknown 目标，并以原 command identity reconcile，
  不得重复已提交 release。
- 如果目标需要不同正文或 media 组合，必须拆成不同 `PublishProcess`；不得在共享
  revision 下隐藏 target-specific content。
- My-Chat 只在已提交 family-level release 后通过 `ActionDelivery` 向该家庭当前
  guardians fan-out；guardian/device fan-out 不改变 Nurture 发布单位。
- 发布后移除可见目标只影响对应 release；新增目标创建新的 release effect。process
  级“已发布给 N 个家庭”只是 owner-reread 后的展示汇总，不是 authority 或 Receipt。
- UI 批次和发送时间只提供调度/分组，不把多个目标合并为单一业务提交。

## D-06 — Minimal PublishProcess State Machine

`PublishProcess` 主状态只表达共享内容 work unit 的业务阶段，不复制 target release、
worker、provider 或 delivery 生命周期：

```text
draft ──────────────────> pending_release ──> released
  │                              ↑
  └──> needs_review ─────────────┘
  │          │                   │
  └──────────┴───────────────────> cancelled
```

- `draft`：family-publication candidate 已创建，整理结果和 30 秒快捷调整在此
  发生；内容可编辑。
- `needs_review`：只用于低置信、child/target attribution 不明确，或 D-15
  `review_required` 等可通过纠正解决的异常通道；可编辑，但 scheduler 不得发布。
  人工解决并确认后进入 `pending_release`。D-15 `direct_interaction_required` 不以
  needs_review 冒充可发布内容，也不新增 process state。
- `pending_release`：待发送队列；可以“现在发送”或等待 `scheduledAt`，实际 commit
  前持续可编辑。编辑保存增加 revision，但不需要退回 `draft`。
- `released`：至少一个逐目标 `PublicationRelease` 已与 Receipt 原子提交；共享内容
  revision 从此冻结。未提交目标只能基于该 exact revision reconcile/retry。
- `cancelled`：仅在任何目标尚未 commit 前允许；已经 released 的 process 不得整体
  取消或回退。

合法转换为 `draft -> needs_review | pending_release | cancelled`、
`needs_review -> pending_release | cancelled`、`pending_release -> released |
cancelled`。普通、高置信内容不强制经过 `needs_review`。如果一次 release command
没有任何目标 commit，process 保持 `pending_release`；若至少一个成功则进入
`released`，并由逐目标结果派生 full/partial summary。`PublicationRelease` 只在成功
提交时成立，rejected/outcome-unknown 属于 target command result，不伪造 release fact。

以下均不是 `PublishProcess` 主状态：

- 30 秒快捷窗口是 UI timer/interaction posture；
- 定时发送是 `scheduledAt` 和 eligibility；
- sending/retrying 是 `CommandExecution`；
- rejected/outcome-unknown 是逐目标结果；
- delivered/read 是 My-Chat `ActionDelivery`；
- correction、target visibility removal、replacement 与 redaction 是发布后追加事实。

产品映射为“草稿 / 待确认 / 待发送 / 已发布 / 已取消”。部分成功显示为
“已发布给 2/3 个家庭 · 1 个未发送”等逐目标 summary，不新增 `partially_released`
主状态，也不把失败目标隐藏在“已发布”标签下。

## D-07 — Exact CareGroup Caregiver, No Lead Gate

T-006 的正式业务 actor 是当前精确 CareGroup 范围内的合格 `caregiver`
RoleAssignment，产品文案简称“本班老师”。`exact` 表示 actor 的 current
RoleAssignment 必须直接绑定当前 process 的 source CareGroup；同 Institution、
相同职称、园区成员或其他 CareGroup 身份均不能替代。

同一 CareGroup 采用共同责任：

- 任一本班老师可以查看并创建 `PublishProcess`；
- 任一本班老师可以在 release commit 前修改正文、媒体、child/target attribution、
  scheduledAt，处理 `needs_review`，立即发送或取消；
- 同班其他老师可以继续处理另一位老师创建的 process，不产生 creator-only owner、
  personal claim 或 exclusive reviewer；
- 发布后的 correction、replacement、target visibility removal 与 redaction 也由
  当前本班老师通过对应 versioned capability 执行；降低可见性的安全动作不等待园区
  管理角色；
- 每次 action 仍 current-reread Participant、exact RoleAssignment、CareGroup、
  Enrollment、Grant、process revision 与 policy；role loss 或 scope drift 立即拒绝，
  但保留既有作者和执行审计。

CareGroup 是 Guardian 侧看到的业务发送主体；个人 creator、editor、reviewer、
release executor 与 safety-action executor 分别记录为审计/可选次级署名，不改变共同
责任。

Lead designation 属于园区日常运营管理，不属于 T-006 capability、review gate 或
visibility scope。Institution Admin、Lead、general Institution member 与 system
operator 都不能凭该身份读取、编辑、确认或发布班级内容；某人只有另行持有当前 exact
CareGroup caregiver RoleAssignment 时，才能以普通本班老师身份参与 T-006。若异常
需要园区级运营处理，使用 T-007 workbench/WorkItem 边界，不在 `PublishProcess` 内
增加 Lead 审批。T-007 Admin Web 可以调整 activity placement、设置封面、添加园区
说明，以及执行只缩小可见性/暂停发布资格的 safety action；Admin-only 不得确认、
新增或替换 canonical child attribution，也不得据此使内容满足 publish eligibility。
Admin 发现归属错误时只创建 correction candidate/WorkItem，由当前 exact CareGroup
caregiver 通过本节 capability 确认；多角色用户必须切换到 caregiver role。

organizer、AI provider、scheduler 和 worker 也不是 caregiver。它们只能在 D-08/D-09
冻结的 revision 与发布授权条件下执行技术动作，不能静默选择另一位老师、继承失效角色
或成为内容作者。

## D-08 — Autosave, Edit Hold and Strict Revision

Nurture owns 服务端 `PublishProcess` draft、当前 `draftRevision` 和 versioned save
capability。My-Chat owns 输入过程中的受保护 local working buffer、saving/saved/failed
反馈和离线新草稿体验。local buffer 按 account/Workspace/scenario 隔离并执行 TTL、
logout、account-switch 与相关撤权清理；它不是 canonical draft、authority 或可发布
revision。

默认约 1 秒 debounce 自动保存，具体时长是可调 UX 参数，不是 correctness constant。
每次 save 使用 typed business input、owner-issued process ref、edit-session ref 与
`expectedDraftRevision`：

- exact head 匹配时提交新 draftRevision，并返回 saved 状态；
- exact command replay 返回相同 revision；
- revision drift 明确 conflict，客户端 refresh 后让用户重放/重新应用修改；
- 禁止 last-write-wins、直接 patch board snapshot 或用 local timestamp 选择赢家；
- 离开编辑前尝试 flush；失败时明确提供 stay/retry 或 discard-local-and-leave，不能
  把未保存内容显示成已保存。

在线编辑必须先从 Nurture 取得单一、短期、可续期的 edit hold。同一 process 同时只
允许一个有效编辑者；另一位本班老师可以继续查看，并看到 display-safe 的“同事正在
调整”，但暂不同时编辑。hold 在完成、明确离开或 TTL 到期后释放，并具有以下边界：

- hold 只做并发协调和 scheduler pause，不产生 creator/claim/owner、业务 authority、
  PublishProcess state 或跨 CareGroup reach；
- 取得和续期仍 current-reread exact caregiver RoleAssignment 与 process scope；
- scheduler 发现 current hold 时跳过该 process，不发布旧 revision；
- hold 过期后 local unsaved buffer 不能继续阻止服务端动作；重连时必须 owner-reread，
  若 process/revision 已前移则进入 conflict/correction 路径；
- 共享责任不受影响：hold 释放后任一本班老师均可取得新的编辑机会。

只有 Nurture 已提交并由发布命令明确绑定的 exact draftRevision 可以 release。
`saving`、`failed`、local-only 或 hold 中的内容均不能被 scheduler 推断为已保存。

`pending_release` 编辑必须在线取得 hold，因为离线设备无法可靠暂停服务端定时发送。
离线 MAY 准备尚未进入待发送队列的新草稿和 media；恢复连接后重新读取当前
owner/policy/target 并创建或保存服务端 draft。离线不得修改、取消或声称暂停既有
pending_release process。

## D-09 — Manual and Scheduled Release

进入 `pending_release` 表示普通内容已具备定时发送意图，不再要求本班老师逐条二次
审批。`needs_review` 不能发送；AI、timer、scheduler 或 worker 都不能自行把它转成可
发送内容。

默认策略沿用 HTML 产品构想：

- 园区当地时间 17:00 是默认 scheduledAt；
- 19:00 是默认 notAfter，即允许同日自动补发两小时；
- 两个时间均为 Pilot/运营参数，不是 correctness constant；
- 园区 timezone 和 default schedule policy 由 T-007 日常运营管理，T-006 在 process
  进入 pending_release 时保存解析后的 UTC instant、timezone、policy head 与
  authorizing caregiver RoleAssignment；
- 后续园区默认策略变化只作用于新进入队列的内容，不静默移动已有 scheduledAt。

本班老师 MAY 调整单张 process 的 scheduledAt、发布前取消或点击“现在发送”。“现在
发送”本身是 explicit confirmation，不再增加确认弹窗；它必须先完成 autosave，并通过
与定时发送相同的 owner-reread 和逐目标发布路径。若在 30 秒快捷调整期点击，服务端可
原子完成保存、进入 pending_release 和立即发布，但不能跳过任何中间 eligibility。

pending_release 的成功编辑保存会把发送意图重绑定到新 exact draftRevision、当前目标/
时间和该 editor 的 RoleAssignment，同时继续明确显示“仍将于 HH:mm 发送”；不要求
额外审批。active edit hold、saving/failed、revision conflict 或 needs_review 都会阻止
立即和定时发送。

scheduler 使用服务端时钟，在 `scheduledAt <= now < notAfter` 时尝试执行。每次 attempt
重新读取：

- process state、exact saved draftRevision、release intent 与 current edit hold；
- authorizing caregiver 的 current exact CareGroup RoleAssignment，不静默选择另一位
  老师代替失效身份；
- source CareGroup、target ChildCareProcess/Enrollment/Family、original Grant、
  data class/purpose、media readiness、policy 与 lifecycle；
- D-05 的逐目标 command identity、已有 PublicationRelease 和 reconcile 结果。

临时技术失败只在 notAfter 前使用相同 command identity 自动重试。outcome-unknown 必须
先 readResult/reconcile；已经 committed 的目标 exact replay，partial failure 只重试
失败目标。authority/policy/target/media rejection 不盲目自动重试，等待当前本班老师
处理。

到达 notAfter 仍未提交的目标不在深夜发布、不静默顺延到第二天，也不丢弃；process
保留 pending 或 released+partial 的真实状态，并投影“未按时发送”attention。若尚无
任何 release，老师可以继续编辑后重新排期、现在发送或取消。若已经部分发布，process
保持 released，共享 revision 不再可编辑；剩余目标只能在外部 eligibility 恢复后基于
该 exact revision retry/reconcile。若需要改变正文、媒体组合或目标语义，必须创建新的
`PublishProcess`/replacement，不得借“未按时发送”回写已冻结 revision。

Nurture published 仍只表示业务 release+Receipt 已提交。My-Chat notification quiet
hours、provider retry 和 device delivery 属于 ActionDelivery，不反向改变 scheduledAt、
notAfter 或 PublicationRelease。

## D-10 — Capture Batch, Organize Trigger and Quick-adjust Window

**Decision status: locked.**

拍照、文字/语音记录、上传完成或单个媒体 ready 都不会立即创建 family-publication
candidate，也不会启动 30 秒倒计时。它们先进入当前 CareGroup 的待整理采集批次；老师
可以继续拍摄，并高频执行“移出本批次/不参与整理”，这只是改变整理输入，不等于全局
discard 媒体。

整理只由以下明确 trigger 启动：

1. 本班老师点击原型已有的“整理”，明确表达“现在整理”，绕过自动 trigger 的
   quiescence gate 并立即按 stable source watermark 切出当前批次；
2. 当前批次达到园区 `OrganizeTriggerPolicy` 的静默期，Pilot 默认自最后一次稳定采集/
   增删操作起 10 分钟；该 trigger 已自然满足一分钟 quiescence gate，不再额外等待；
3. 到达园区 default send window 减去 `autoOrganizeLeadTime` 的每日兜底时点；Pilot
   默认 lead time 为 30 分钟，因此默认 17:00 发送解析为当地 16:30。此时先标记 batch
   due；若仍有用户采集/编辑活动，等一分钟 quiescence gate 通过后立即切批，不再等待
   完整 10 分钟。

园区 MAY 在 T-007 日常运营管理中调整静默期和兜底时点，关闭某个自动 trigger，或切为
全手动；T-006 只保存实际命中的 trigger、institution timezone、policy head、source
watermark 和 organizer input revision。策略变化只作用于后续批次，不能重解释已经切出
的批次。自动 trigger 使用服务端时间和稳定 Nurture source head，不依赖设备后台 timer。

一分钟 `captureQuiescenceGate` 是自动 trigger 的防打断闸门，不是第四种整理 trigger：

- Pilot 默认 60 秒；园区 MAY 在 30 秒～3 分钟内配置，但只要启用了自动整理就不能设为
  0。切为全手动后该 gate 不参与决策；
- 当前 exact CareGroup 中任一本班老师新增照片/文字/语音、移出/恢复/选择素材、编辑
  采集内容，或持有 My-Chat 发出的短期可续期 capture-activity lease，都会重新计时；
- 10 分钟 idle trigger 与一分钟 gate 读取同一个班级级 user-activity head，但阈值和
  职责独立；有效 capture-activity lease 同时暂停 idle 成熟并阻止 gate 通过；
- capture-activity lease 只表达“当前有人操作”，用于延迟自动切批；它不是业务
  authority、个人 claim、PublishProcess state 或 source fact，设备退出/失联后按短 TTL
  自动失效；
- 用户选择/添加媒体是操作；其后的后台上传百分比、缩略图生成、同步 heartbeat、
  provider job 和其他机器进度不是用户操作，不推进 user-activity head，也不阻塞切批；
- 手动“整理”不等待 gate。即使另一位本班老师仍在采集，也只切 stable watermark；
  其未稳定内容及 watermark 后的新内容自然进入下一批。

trigger 原子切出“截至 source watermark 的稳定素材”；仍在上传/保存的内容和 watermark
之后的新拍摄进入下一批，不能反复重置或污染已经启动的倒计时。相同 trigger identity
exact replay，不得重复创建 PublishProcess。若切出的批次为空，则不产生 organizer job
或发布候选。自动切批证据记录 resolved trigger、quiescence 参数/观察 head、policy head
与 source watermark，但不持久化原始设备操作流。

organizer 基于冻结输入进行聚类、原图筛选、D-15 确定性内容组装与 D-14 班级内孩子
匹配；自动路径不要求生成式文案。只有整理结果已经提交为普通、高置信 `draft` 后，
才启动默认 30 秒快捷调整：

- 允许调整正文、child attribution、可见目标、媒体与发送时间，或取消候选；
- 用户触碰候选或取得 edit hold 后暂停自动推进，不能在编辑过程中超时入队；
- 超时只进入 pending-release queue，不发布、不产生 Receipt，也不授予 organizer/
  matcher 发布权；
- 低置信、归属不明确、不满足 D-14 自动匹配门禁或 D-15 `review_required` 的内容不
  启动自动推进，进入 `needs_review`；`direct_interaction_required` 不创建自动发布
  candidate，只提供显式 T-005 路由；
- scheduler 不得在该候选自己的 quick-adjust deadline 之前发布；即使 scheduledAt 已到，
  也要等窗口结束且全部 current gates 通过。

30 秒 quick-adjust、10 分钟 idle trigger、1 分钟 quiescence gate 和发送前 30 分钟
`autoOrganizeLeadTime` 都是不同职责的 Pilot/园区策略参数，不是 correctness constant。
调整参数不能改变 authority、confirmation、idempotency、发布事务或 source-watermark
语义。产品文案必须写“30 秒后进入待发送”，不能沿用 HTML 中容易误解为跨边界动作的
“30 秒后发布”。

## D-11 — Pre-publication Adjustment, Low-frequency Post-publication Safety

常规调整机会集中在实际 release commit 之前。30 秒窗口结束后，candidate 在
pending-release queue 中持续可编辑，直到“现在发送”或定时发布事务真正提交。老师不需
逐条二次审批；当内容正在编辑或存在未保存 revision 时，当前批次跳过该 candidate，
保存后重新进入后续发布机会。

发布后不提供 5 分钟或 24 小时快捷修改窗口，不创建老师复查队列，也不暗示持续内容
运营义务。真实环境允许普通、高置信发布存在少量可纠正错误；该假设用于减少逐条审核
负担，不能成为跨家庭授权或敏感内容自动发布依据。

低频安全 capability 长期有效且不受快捷窗口限制：

- 普通文字偏差 MAY 追加 publication correction；
- 错误可见目标使用 target visibility removal；新增目标创建新的发布 effect；
- 错误媒体/归属使用 replacement；
- 不应继续展示的内容使用 redaction/tombstone。

这些 action 保留 actor、原因、原发布版本、Receipt/Execution 与审计。已经被家庭读取
或已经发出的通知不能宣称召回；后续读取必须 owner-reread 当前可见状态。错误率、
发布前调整率和 redaction/removal 率只用于产品/attribution 改进，不得生成教师评分或
排名。这里的 publication correction 属于 T-006 发布事实，不是 T-005
`correct_family_care_message`；前者按 D-07 的 exact-CareGroup 共同责任授权，后者继续
遵守 T-005 的 exact-author Message correction 合同。

## D-12 — Media Lifecycle, Attribution and Deletion

从稳定、不可猜且版本化的 media ref 开始，Nurture 将媒体本身、孩子归属和家庭发布
保持为三个 canonical 轴，不能用一个 status 复制彼此生命周期：

```text
MediaAsset
  preparing -> ready <-> unavailable
       └───────────────> discarded | redacted

ChildMediaAttribution
  candidate -> confirmed | rejected
  confirmed -> superseded

PublicationRelease
  remains the D-05 target-specific publication fact
```

media asset 业务语义：

- `preparing`：stable ref 已登记，但 owner 检查或必要元数据尚未满足
  Nurture 使用条件；不镜像上传百分比。
- `ready`：exact media revision 当前可用于草稿；它不表示归属已确认、可发布或已授权。
- `unavailable`：owner 当前无法提供或处理，可恢复；期间不得发布。
- `discarded`：任何目标均未 committed 时的发布前全局删除；不可再归属或发布。
- `redacted`：已有发布或需全局停止展示后的终止状态；后续 owner-read 不再返回媒体。

child attribution 独立使用 `candidate / confirmed / rejected / superseded`。通用
organizer/LLM 建议最多创建 candidate；D-14 专用、版本化且通过启用门禁的班级内人脸
匹配可以把高置信结果自动提交为 confirmed，并记录 `automatic_face_match` confirmation
source 与证据版本。本班老师仍可通过 versioned capability 人工确认、拒绝或纠正；修改
已确认归属时旧 attribution superseded 并追加新版本，不静默覆盖历史。

publish eligibility 是当前派生结果，不持久化为另一个 `publishable` 状态。每个
PublicationRelease 至少要求：

- exact immutable original-media revision 当前 ready；
- release 目标孩子拥有 confirmed attribution；
- 所有清晰可见孩子均已 confirmed，且 current exposure policy 允许该 target audience；
- current CareGroup、Enrollment、original Grant、data class/purpose 与 policy 允许；
- asset/attribution/publication 未 discarded、redacted、removed 或 superseded。

群像照片保留 HTML 的一张卡片、多家庭体验，但只要存在身份未知、candidate-only 或不
允许该 audience 看到的清晰可见孩子，就进入 `needs_review`，不得自动入队。老师只能
通过人工纠正归属、从候选移除整张原图、移除不允许的目标，或为允许范围拆分
PublishProcess 解决；首轮产品不 crop、不 blur，也不生成其他视觉变体。一次 confirmed
attribution/policy 可被后续 process 复用，但每个 release 仍 current-reread exact
original-media revision、当前归属和曝光政策。

产品“删除”按阶段映射：

1. 从当前卡片删除默认只 detach 该 PublishProcess 的 media reference，不影响 asset、
   其他草稿或已发布内容。
2. 发布前全局删除使用 explicit discard capability，且只能在没有任何 committed
   PublicationRelease 时发生。若存在其他未发布引用，UI 明确显示影响范围；discard
   后这些引用 owner-reread 为 unavailable。
3. 发布后对某家庭删除使用 target visibility removal；对所有当前/未来读取停止展示
   使用 redaction。两者保留 actor、reason、原 media revision、PublicationRelease、
   Receipt 与 CommandExecution。

discard/redaction 是业务可见性的终止，不等于立即物理擦除。storage owner 在没有合法
引用且 retention/privacy policy 允许后异步清理 bytes；Nurture 保留 body-free
tombstone/audit。已经查看、下载或发出的通知不能宣称召回。

当前 T-002 `MediaAssetRef.active/hidden/deleted` 与 attribution
`candidate/confirmed/rejected/corrected/hidden/deleted` 可作为来源基础，但不能直接
冒充上述合同；contract implementation 必须明确映射或通过 DB SSOT 流程扩展，当前
决策不授权 schema 变更。

## D-13 — My-Chat Protected Local Media Cache

My-Chat owns 设备选择、受保护本地缓存、缩略图、离线上传队列、上传进度、重试和
native permission。缓存按 account/Workspace/scenario 隔离，使用平台受保护存储，并有
容量、TTL、失败重试与 logout/account-switch 清理策略。相关撤权或 owner-reread denial
后，My-Chat 不能继续把缓存内容渲染为当前可见事实。

Nurture 不接收设备本地路径，不镜像上传百分比。它从稳定、不可猜的 media ref 开始
拥有业务 asset lifecycle、child attribution、publish eligibility、visibility 与
redaction。My-Chat cache 只支持性能和离线体验，不能成为 Nurture authority、
canonical media status 或跨设备同步真相。

## D-14 — Class-scoped Automatic Face Match, Original Media Unchanged

“不处理照片”在产品合同中表示不修改原图、不 crop、不 blur、不美化，也不生成供发布
使用的视觉变体；人脸检测、特征提取和匹配本身仍属于对照片和生物识别信息的计算处理，
不能以“原图未改”规避隐私门禁。

自动归属使用专用、版本化 `ClassScopedFaceMatch`，不是通用 LLM：

- 每次只解析 source watermark 对应的 exact original-media revision；
- reference set 只包含当前 exact CareGroup、current Enrollment 且当前允许用于该目的的
  孩子头像版本；不得扩到全园、跨班、离园历史库或跨照片 `history_match`；
- reference owner 通过 owner-issued opaque ref 和 revision 提供当前可用头像，并负责
  撤回/换头像/失效信号；matcher 不接收 raw child/family ID、姓名或家庭关系；
- 高置信结果同时满足版本化质量阈值、top-1 阈值与 top-1/top-2 margin 时，Nurture
  MAY 自动追加 confirmed attribution，记录 `face_reference`、
  `automatic_face_match`、avatar revision、reference-set revision、matcher revision、
  threshold profile 和最小化 evidence summary；不要求老师逐张点确认；
- 低置信、多人遮挡、双胞胎/相似面孔、头像质量不足、未知人脸或结果冲突只创建
  candidate 并进入 `needs_review`。老师只需处理异常：人工选择孩子、拒绝归属或移除
  整张照片；
- 老师纠正自动结果时必须 supersede 原 attribution；纠正进入 matcher 质量评估，但
  不得自动扩成跨照片历史图库、教师评分或新的 reference image。

precision 优先于 recall。阈值不写死在 UI 或模型代码中，而是使用版本化 profile，并以
Pilot 代表性数据校准；没有达到高置信门槛宁可进入异常区，也不能猜测具体孩子。群像
只有在所有清晰可见孩子均获得当前 confirmed attribution、且每个目标 audience 的曝光
政策都允许时，才可自动进入 D-10 快捷调整；否则使用 D-12 的整图移除/目标调整路径，
不得通过图像变换规避政策。

生物特征数据执行最小化和隔离：

- reference embeddings 加密保存并绑定 exact CareGroup、purpose、consent/policy head
  与最短 retention；不得形成跨班或全园可搜索模板库；
- 本次照片产生的临时 embeddings 在匹配与必要审计摘要完成后删除；日志、Receipt 和
  telemetry 不保存原始人脸、可逆模板或完整候选分数列表；
- provider/processor 不得训练模型、二次使用、跨目的关联或把受保护内容写入普通日志；
- 撤回授权、退出 CareGroup、Enrollment 结束或头像 owner 失效会立即停止后续匹配，
  删除/失效对应 reference template，并使未发布结果重新 current-reread。

该 capability 默认关闭。正式启用前必须完成专门目的与必要性论证、显著告知、单独同意
及未满十四周岁监护人同意、个人信息保护影响评估、最短保存期、加密/访问审计、便捷撤回
和 processor data contract，并经过正式法律/隐私评审。任一门禁不满足时不得调用
matcher，回退为人工选择孩子；园区运营开关属于 T-007，但不能覆盖逐孩子/逐目的的当前
授权。该边界依据现行《人脸识别技术应用安全管理办法》和《个人信息保护法》形成产品
安全基线，不构成对具体部署的法律结论。

正式实现/部署评审至少回看以下一手规则，并记录当时有效版本：

- [《人脸识别技术应用安全管理办法》](https://www.cac.gov.cn/2025-03/21/c_1744174262156096.htm)
  （国家互联网信息办公室、公安部，2025-06-01 起施行）；
- [《中华人民共和国个人信息保护法》](https://www.samr.gov.cn/zw/zfxxgk/fdzdgknr/bgt/art/2023/art_f374e8245320413181742e6d1baf4366.html)
  第 28～31、55～56 条所涉敏感个人信息、未满十四周岁个人信息和影响评估要求。

## D-15 — Deterministic Content Assembly, Optional AI Copy

**Decision status: locked.**

日常自动整理不以生成式文案为前提。`ContentAssembler` 首先使用可解释、确定性的来源
组装：

- 老师已经输入的文字保持原文，不自动改写语气或含义；
- My-Chat 提供的语音转写作为来源文字使用，转写与老师后续修改保留 provenance；
- 活动名称、发生时间、原图数量、已确认孩子/目标等只通过版本化模板生成标题、标签和
  元数据，例如“户外活动 · 3 张照片”；
- photo-only 内容允许没有自由正文；不能为了让卡片显得完整而虚构“很开心”“表现很棒”
  等观察；
- organizer 可以聚类、选择 original media、关联活动与目标，但不会因为没有 AI
  文案而阻塞 D-10 普通内容路径。

自由文本 generation 只在以下显式边界出现：

1. 当前本班老师主动点击“帮我整理一句/润色”，生成结果作为编辑器内 suggestion，
   老师选择采用后才写入 PublishProcess draft；
2. 日/周等多来源总结场景 MAY 使用生成式摘要，但必须作为独立、可追溯的总结内容单元
   设计，不能借日常照片自动整理静默启用；其自动/确认边界留给对应总结决策。

生成式 copy 必须绑定 exact organizer input revision、source refs、provider/model/
prompt-policy revision，并遵守：

- 不新增来源中没有的事件、动作、引语、情绪、原因、频率或发展结论；
- 不把“不确定/可能”改成确定，不把老师的直接观察改写成性格、动机或能力评价；
- 直接引语、数值、时间和否定条件保持可追溯；无法支持的句子删除而不是补全；
- 不自动覆盖老师原文；采用、修改和拒绝均发生在当前 edit hold/draftRevision 边界；
- provider failure、malformed output 或低置信只关闭该可选建议，不阻塞原文、转写、
  模板和 photo-only 发布路径；
- 不保存 chain-of-thought；只保留最小 source mapping、output、版本和操作审计。

D-15 内容安全适用于原文、转写、模板、照片和可选 AI copy，不能因为未使用生成式
文案就跳过。最终 route 由 Nurture-owned、版本化 `ContentSafetyPolicy` 从 exact source
heads 派生；AI/classifier 只能提供结构化 risk signals 和 confidence，不能自行决定
发布或跨领域动作。D-14 高置信自动确认只适用于孩子归属，不能扩张为正文生成或安全
分级 authority。

安全路由使用三个派生 tier，不增加 `PublishProcess` 主状态：

| Tier | 典型内容 | 路由 |
| --- | --- | --- |
| `ordinary` | 中性活动、原图、普通饮食/午睡/日常照护事实 | 可创建普通 draft，进入 D-10 |
| `review_required` | 评价性措辞、含义/上下文不足、可能敏感但可通过纠正解决 | 创建/保持 `needs_review`，本班老师修正文案、目标或来源后重新判定 |
| `direct_interaction_required` | 磕碰/事故、健康症状、用药/医疗资料、明显情绪或行为冲突、身体隐私/裸露/如厕影像、证件/联系方式等 | 不进入自动批量发布；保留园所内部来源，并提供显式进入 T-005 家庭沟通的 capability |

`direct_interaction_required` 不是“禁止告知家庭”。它表示该事项可能需要解释、回应和
回执，必须由本班老师明确选择精确 child/family target 后进入 T-005 `CareInteraction`。
T-006 只能展示 owner-issued navigation/action；不能自动创建对话、复制敏感 body 或把
T-005 状态吸收进 `PublishProcess`。

该路由也不表示 T-005 现有普通 family-question action 已经具备承接能力。该 action
当前会在业务写入前拒绝健康、用药等输入，且不是 caregiver-initiated process。只有
T-005 Stage G2-C 后续发布专门、版本化、对当前 actor/target 可用的
direct-interaction
capability 时，T-006 presenter 才输出可执行 action；否则只保留内部来源、显示安全
阻塞/下一步，不得复用普通 action、复制正文或降级为批量 PublishProcess。

T-006 只消费 G2-C exact public contract，不拥有其 canonical effect、family-side
response expectation、Receipt 或 change lifecycle，也不发布占位 capability key。
G2-C 未冻结进当前 T-004 digest 或 qualification/current owner path 不可用时，
`direct_interaction_required` 保持安全不可执行；ordinary/review-required board work
可以继续。

最终判定责任：

- Nurture 产品基线拥有硬规则、tier 语义和 policy evaluator；canonical fact kind、
  media/exposure policy、target 和 purpose 的确定性规则先于模型信号；
- T-007 园区运营策略 MAY 将更多内容提升为 review/direct interaction 或提高阈值，但
  不能降低 Nurture 硬门禁，也不能覆盖逐孩子 Grant/consent/exposure；
- 本班老师 MAY 主动提高 tier，并可通过修改灰区内容重新判定；不得把命中硬规则的
  direct-interaction 内容降为 ordinary；
- classifier/provider 不可用、输出 malformed、低置信或规则冲突时不得默认 ordinary；
  可纠正不确定性进入 review，命中硬规则仍进入 direct interaction；
- 创建 candidate、编辑保存和每次 release attempt 都 current-reread exact source、
  content revision、policy head、targets 和 risk result。已进入 draft/pending 的内容
  若因编辑或 policy drift 变成 restricted，立即失去 publish eligibility；不新增状态，
  不自动发布或自动创建 T-005；
- 审计保留 policy/rule/model revision、risk codes、source heads、route 与真实 actor，
  不在普通 telemetry 中复制敏感正文、图片或模型 chain-of-thought。

## D-17–D-22 — Correctness and Integration Spine

- 所有业务修改使用 T-004 versioned Harness；business input 与 target、authority、
  concurrency heads、command identity 分离。
- draft edit 使用声明的 draft/revision head；publish 绑定当前保存 revision、target、
  Grant/policy/lifecycle heads。活动编辑或 revision drift 不能被 scheduler 静默采用。
- 发布事务重新读取 current owner/policy，并原子提交 domain effect、Receipt、
  authority evidence 与 CommandExecution；事务外 Receipt 无效。
- 相同 command identity + exact canonical payload 返回 exact replay；payload/head drift
  明确 conflict/stale。response loss 使用原 identity readResult/reconcile。
- UI batch、scheduler、notification 或 provider 不得把多个 authority scope 伪装成一个
  不可解释的业务成功；按 D-05 从共享 `PublishProcess` fan-out 为逐目标
  `PublicationRelease`，分别返回结果。
- Nurture logical Receipt 与 My-Chat ActionDelivery 分离；published 不等于 notification、
  provider 或 device delivery。
- envelope/cursor 绑定 exact contract ref、actor/scope、snapshot、source heads 与稳定
  order；状态前移、撤权、更正或 redaction 后 refresh/rebase，不拼接不同版本。
- server cache 与 My-Chat local cache 都是可重建优化，不能授权；敏感 read、edit、
  publish、delivery/open 均以 current owner-reread 为准。

## Decision Register Closure

T-006 顶层决策登记在 D-01～D-03、D-05～D-15 与 D-17～D-22。D-04 和 D-16 在本任务
中未被分配，是编号间隙而非缺失的开放决策。后续 Stage G3-0 的
fact/schema/adapter 盘点
属于实现设计；只有当其需要改变上述业务边界时，才重新进入顶层决策对齐。

2026-07-30 后的 Stage G3 结构没有重开这些产品决策，只把交付重新分为
G3-A～E，并把 deterministic/manual required lanes 与 AI/face-match optional lanes、
G2-C/T-007 exact subsets 和 final qualification 边界显式化。

Stage G3 overall architecture audit 为 `PASS`：从 canonical facts 到两类角色投影、
从 internal capture 到逐目标家庭可见事实、从 provider/owner subset 到 final
handoff 均有唯一 owner 和明确 contract boundary。具体 Board Envelope/module query
topology 属于 G3-0 contract design；只要继续满足共享 pipeline、角色独立 schema、
module-level provenance/snapshot/invalidation 和 owner capability mutation，就不构成
新的顶层架构决策。

## Logical Components

- Care fact repositories：focus、daily care、attention、media attribution、publication。
- Policy layer：actor + role + grant + child scope + fact visibility，以及版本化
  `ContentSafetyPolicy` route evaluator。
- Shared projection pipeline：角色安全的 fact selection、provenance、snapshot、
  semantic module composition 与 invalidation。
- `PublishProcess`：从 family-publication candidate 到原子 publish 或 pre-publish
  cancel 的照护内容领域过程；它不是采集 transport、CareInteraction、ActionDelivery
  或园区管理 Workflow。
- Deterministic content assembler：使用老师原文、转写和版本化模板组装标题/标签/元数据，
  不依赖生成式 provider。
- Optional copy provider：只响应老师显式请求或独立总结能力，产生可采用/修改/拒绝的
  suggestion。
- `ClassScopedFaceMatch` port：专用、版本化、默认关闭，只在 D-14 启用门禁和班级范围
  内产生候选或高置信自动归属。
- Guardian presenter：家庭连续性、当前关注、已发布照护记录。
- Caregiver presenter：班级共同工作队列、待确认、快速记录和发布状态；
  acknowledge actor 是审计信息，不是个人 assignment 或 reply authority。

## Publish Invariants

- 草稿仅当前 exact CareGroup 的合格 caregiver 可见；创建者不拥有独占权限。
- 发布前必须重新校验 authority、child scope、目标 family、provenance 和
  ContentSafetyPolicy route。
- 发布与 receipt/authority evidence 必须事务一致。
- 重复请求返回同一 publication，不产生重复家庭事实。
- correction 不覆盖来源；历史仍可解释。

## AI Boundary

- provider 输入必须是当前 actor/系统用途当前有权访问的数据。
- 自动 photo-first organizer 默认只走确定性 content assembly，不为了填充卡片调用
  生成式 copy provider。
- 可选 LLM copy 输出标记为 suggestion，必须由发起老师选择采用；正文或敏感判断不能
  自动成为发布 authority。唯一允许自动确认的首轮例外仍是通过 D-14 全部门禁的高置信
  班级内人脸归属。
- 禁止自动诊断、处方、紧急判断、教师/儿童/家庭排名。
- provider failure 不影响人工记录和发布主路径。

## Media Boundary

- Nurture 拥有媒体业务 attribution 和授权引用。
- My-Chat 拥有设备选择、受保护本地缓存、缩略图、离线上传队列、上传 transport、
  进度/重试和 native permission。
- presenter 只输出宿主可消费的安全引用和状态，不暴露存储内部路径。

## Read Consistency

guardian 与 caregiver 投影需要共享 source revision / fact version。撤回、更正或 grant 变化后，两侧都必须在规定的一致性窗口内反映。

共享 source revision 不要求两侧返回相同字段。它只证明两个角色化结果来自可解释的
canonical fact heads。任何微调完成后，旧 snapshot/cursor 必须失效或 rebase；不能
通过原地修改 derived response 假装 canonical commit 已完成。

## Workflow Projection Boundary

- 当前产品 Workflow 只指园区管理 `InstitutionWorkflow`；board 不是 Workflow owner。
- Guardian/Caregiver board MAY 显示与当前角色直接相关的
  `InstitutionWorkflowProjection` 外部切片，例如 GrantRequest 待确认或结果。
- G3-0 对当前 exact `nurture.surface-contract@1.8.0` 的兼容结论更具体：Guardian
  family board 可以把该模块保持 optional/absent-empty；Caregiver teacher board 的
  visibility matrix 当前明确拒绝该 data class，因此首个 G3 profile 排除它。未来
  Caregiver 侧采用必须先旋转 surface/visibility contract 并重跑 affected
  conformance，不能由 presenter 暗中注入。
- 同角色可获得更完整投影，但仍必须验证 Workspace、Institution、scope、assignment、
  Grant/fact visibility 与 purpose。
- family-care Item 的 action scope 是原始精确 `Enrollment + CareGroup`；同班当前
  合格照护者可追加多条回复，board 不创建或推断个人 claimant。
- teacher board 将回复呈现为 CareGroup-owned append stream；每条回复保留真实
  executor audit/可选署名，第一条回复解除 Attention，后续回复不重复完成事项。
- projection 只包含安全摘要、阶段、里程碑、下一步和当前可执行 capability；不得输出
  raw Run/Step、claim token、园区内部备注或未授权主体。
- board action 调用版本化 capability；不得直接修改 projection 或 runtime state。

G3-0 的 exact query topology、source-head/cursor binding、T-005/T-007 dependency
contract 与 DB SSOT delta 见
[06-g3-0-fact-contract-schema-freeze.md](06-g3-0-fact-contract-schema-freeze.md)。
