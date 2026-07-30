# Plan — 机构端双 Surface

## Phase 0 — Product Questions and Data Inventory

- 盘点 T-002 institution/group/enrollment/grant 的实际能力。
- 将 T-003 机构端框架拆成“已决定 / 待共创 / 明确不做”。
- 为每个 aggregate 和 workbench action 指定数据来源与授权规则。
- [x] 固定角色化 Surface：多角色用户显式切换上下文，Lead 不增加权限，当前 Web
  只实现 `InstitutionAdminWorkbench`。
- [x] 固定每日出勤产品闭环：AI 在每日提交时推理，当前班级老师确认后形成正式事实。
- [x] 固定园区知识/RAG 顶层边界：园区 Admin 可编辑发布、可关联权威来源，AI 回答
  保留来源身份与逐项引用。
- [x] 固定 D-04 Admin mobile：班级为顶层入口，班级独立日程/活动投影，园区业务
  沟通默认对 Admin 只读可见，AI attention 后置且不自动执行。
- [x] 固定 D-05 班级卡片/详情字段、确定性“最新照片”、Admin Web 完整照片/文字
  记录、可审计关联修订与 child-level 边界。
- [x] 固定 D-06 support signal：确定性状态 + 园区可配置绝对负荷阈值、两级展示、
  mobile 只读下钻、Web 配置/处理与 AI 内容介入后置。
- [x] 固定 D-07 顶层范围：首个实现只做 `EnrollmentJourneyWorkflowV1`，覆盖意向、
  试入园适应/复盘到正式激活和完成；满班候补与普通 waiting state 分离。
- [x] 固定 D-07A 意向阶段：最少 provisional child data、Host-owned contact ref、
  native/external touchpoint 分流、AI 摘要与 Admin 显式推进边界。
- [x] 固定 D-07B 满班候补：明确 qualification time、policy category + FIFO、
  family/Admin 可见性、复核/过期和 Admin time-limited offer。
- [x] 固定 D-07C 试入园：真实照护前完成 My-Chat identity/binding 与 pending
  Enrollment/Grant/CareGroup，再由 trial-start 进入普通照护链路；实现映射使用现有
  Enrollment `status` 加 canonical `participationPhase=trial|formal`。
- [x] 固定 D-07D 复盘：trial 占用真实名额，Admin 在 starts/ends/review 时点只做
  延长、提出正式入园或结束；无 AI 适配判断、自动转换或旧候补名次恢复。
- [x] 固定 D-07E formalization/exit：My-Chat 重验 current identity/binding，Nurture
  本地事务原子转换 participation phase/reservation/Grant/CareGroup；失败保持 active
  trial，退出不删除平台身份或历史。
- [x] 固定 D-07F completion：trial 本身就是适应期；需要更多观察时延长 trial，
  正式激活成功后 Workflow 幂等完成，不增加 post-activation settling stage。
- [x] 固定 D-07G：trial-start 前撤回通过 `cancel_trial_preparation` 释放 reservation；
  Workflow 完成后的正式离园是普通 Enrollment maintenance，不重新打开 Journey。
- [x] 为所有剩余 contract/schema 项指定 owner、enablement gate 和默认安全行为。

## Phase 1 — Role, Institution Policy and Aggregates

- 将当前园区管理者固定为 `institution_admin`；Lead 只作为 Admin 指定的内部分工
  metadata，不建立独立 authority role。
- 定义显式 active-role context、institution/group、child scope、assignment 和 grant policy。
- 建立不含家庭私密 AI/草稿/私人聊天正文的 aggregate model；园区业务沟通通过
  精确 owner-read projection 展示，不作为无来源 aggregate 拼接。
- 将 canonical 出勤、业务记录覆盖率和 AI 推理候选拆成不同事实/投影。
- 为 Admin 日常运营概览提供班级提交状态、记录覆盖、异常和 source freshness，
  不把聚合信号变成老师绩效。
- 定义 versioned Institution support-signal policy：确定性 deadline/blocker 复用
  canonical 业务配置；负荷规则只接受园区显式配置的绝对 count/window，未配置即
  disabled，不采用同伴比较或历史异常基线。
- 设定小样本、撤权、纠正与删除情况下的隐私安全行为。

## Phase 2 — Role-bound Mobile Surfaces

- 为 `institution_admin` 提供“园区级事项 + 班级列表 + 跨班级异常摘要”的只读首页。
- 为每个班级提供独立的有效日程、一日活动时间线、今日沟通与关注、家园共育和
  Workflow projection；不同班级不强制对齐活动。
- 班级卡固定为当前/下一活动、正式出勤提交状态、最新合格照片、最新文字、
  source timestamp、待回应/新反馈/待处理数量；不展示沟通正文、AI 出勤推测或
  freshness/绩效分数。
- “最新照片”先取有效显式封面，否则取当前活动最新合格记录，再 fallback 到本班
  今日最近活动；待复核、归属不明、已撤回/删除/失权内容不参与，来源失效时重算。
- 班级详情展示完整 actor-safe 一日活动、沟通、家园反馈、出勤状态和目的限定的
  child-level drill-down；完整不等于可读取家庭私域或其他 Enrollment。
- 为活动照片/文字/记录实现明确关联 → 当日临时安排 → 班级日程/时间 → AI 辅助的
  落位顺序；不确定内容停留在本班待归位。
- 提供园区业务沟通的 Admin read-only owner projection；家长发送前可见
  Institution Admin 的监督读取语义，不依赖老师升级。
- 将内容介入判断作为后置 AI capability：只生成带引用的候选和原因，不自动回复、
  建 Workflow、通知他人或形成评分。
- 首页最多展示三个跨班级 support signals；班级卡只显示数量/安全原因，点击按
  exact owner-read 下钻 source。signal 本身不携带 protected body 或 child roster。
- Support signal 只使用 `action_required | attention_suggested` 两级产品语义，分别
  呈现“需要处理 / 建议关注”；排序依据明确 deadline、业务状态和发生时间。
- 为 Admin mobile 提供只读 `InstitutionWorkflowProjection`：安全摘要、当前阶段、关键里程碑、
  blocker、下一步和责任角色。
- 为当前班级老师的 caregiver mobile Surface 提供每日出勤推理预览、调整、提交和
  可审计修订；该 capability 不属于 Admin mobile board。
- 实现显式角色切换、加载、空态、数据不足、权限不足和过期状态。
- 保证 Admin mobile 不存在编辑事实的 command；老师提交必须验证当日有效的班级
  assignment。

## Phase 3 — InstitutionAdminWorkbench

- 仅为当前 active role=`institution_admin` 提供 Web 工作台；其他角色 fail closed，
  不共享菜单、路由或 capability。
- 提供人员与关系管理：学生、老师、班级、roster/invite、parent confirmation 和
  grant lifecycle。
- 提供日常运营：班级出勤提交状态、记录覆盖率、异常 WorkItem、催办、退回和跨日
  reopen；Admin 不直接确认或修改出勤。
- 提供家长触达和数字资源的整理、查看与使用入口。
- 提供完整照片/文字活动记录：Admin 可新增园区来源记录、查看完整原图/正文、设置
  可选封面、调整活动落位并执行 downscope hide；调整写入 append-only revision，
  保留老师原文、原作者/时间、自动匹配结果和全部变更历史。Admin 对 child
  attribution 只能提出修正候选，由当前 exact CareGroup caregiver 确认。
- 提供需园区处理的责任队列：普通 WorkItem 与 `InstitutionWorkflow`
  queue/detail/steps/forms/audit 明确区分。
- 提供 support-signal policy 配置、来源查看和对应 source action 入口；由 Admin
  显式决定是否建立 WorkItem，或启动当前 registry 已注册且 eligible 的 Workflow；
  普通 signal 不能启动 `EnrollmentJourneyWorkflowV1`，也不自动升级。
- 所有跨 child/family 作用域操作要求显式 authority 与幂等。
- 首个 Workflow 列表只注册 `EnrollmentJourneyWorkflowV1`；Admin Web 队列区分
  需要园区处理、等待家庭、等待 caregiver、等待系统、满班候补、已阻塞和试入园跟进。
- 意向阶段使用最少、本地 provisional record；不得在 Guardian authority 前 mint/
  infer My-Chat child/family identity，也不得把 marketing/CRM score 带入 Workflow。
- inquiry 默认字段只包含称呼、出生月份或年龄段、期望入园时间、目标班型/年龄段、
  照护时间需求、来源渠道、Host contact ref、安全标签和 last/next touchpoint；
  后续 trial/formal purpose 未到达前不要求法定姓名或完整出生日期。
- My-Chat invitation/contact owner 持有 raw phone/WeChat/email/account identity；
  Nurture Workflow/presenter 只接受 opaque contact ref，不提供 raw-contact fallback。
- native 园区业务沟通通过 canonical Message/source owner-read；external phone/WeChat
  只允许 Admin structured summary，不复制 transcript。summary correction append-only。
- AI 只可从当前授权且可引用的 native source 生成 summary candidate；Admin 明确
  确认并推进 `inquiry → intent_conversation`，模型/新咨询/next-follow-up 不自动推进。
- `capacity_waitlist` 只在目标班级满员时使用，保留目标班级/年龄段、期望日期/
  窗口、qualifiedAt、capacity/policy revision、priority basis、continued interest
  和 next review。
- 家庭明确接受候补且目标班级/最少信息已确认后才写 `waitlistQualifiedAt`；不使用
  inquiry/visit time 预占顺序。
- 候补政策使用少量 versioned priority categories，category 内 FIFO；无 category
  配置时为单一 FIFO。Admin override append-only 记录 reason/before/after，AI 不排序。
- 家庭 projection 只显示候补状态、目标班级和 review/contact time；精确名次/其他
  家庭数量/类别只在 exact Admin Web policy 下显示。
- `nextReviewAt` 必填。no-response 先进入 `waiting_on_guardian`，按配置 reminder/
  deadline 后才过期；一次未回复不删除。
- canonical capacity 出现只产生 Admin task；Admin 按当前 queue/policy 发出
  time-limited offer，Guardian accept 后才推进，offer 本身不创建 Enrollment/Grant。
- Guardian 接受 trial 后，必须先创建/选择并授权 current My-Chat Child/Family，
  完成 scenario binding、Nurture association、pending Enrollment/Grant 和
  exact CareGroup assignment；未完成时保持 `trial_preparation`，不得进入真实照护。
- trial-start commit 原子写入 `status=active, participationPhase=trial` 并确认
  reservation/Grant/CareGroup；不向现有 `NurtureEnrollmentStatus` 增加 `trial`。
- `participationPhase=trial` 只作为既有 Enrollment/roster 的 canonical 区分，不新建
  TrialChild、trial consent aggregate、媒体/出勤/retention pipeline 或 caregiver
  Surface；Guardian 接受作为普通 owner action/evidence 保留。
- 试入园 caregiver 使用普通 role-bound mobile；名册、出勤、照护记录、照片自动
  关联、board、family publication 和 PublishProcess 均复用既有 current-policy 链路。
- phase 不授予权限；request-time policy 继续要求 `status=active`、current binding、Grant、
  exact CareGroup assignment 和 active role。
- 试入园当天计入实际照护/安全人数与出勤，不计入 formal Enrollment 数；转正式
  更新同一 Enrollment lifecycle，孩子与历史 care facts 不复制/迁移。
- Guardian 接受 trial offer 后关闭原 waitlist entry，并为 exact class 创建有
  `trialStartsAt`、`trialEndsAt`、`reviewAt` 的 capacity reservation；`reviewAt`
  不晚于 `trialEndsAt`，同一名额不并行分配。
- Guardian 在 trial-start 前撤回时，Admin 通过幂等
  `cancel_trial_preparation` 关闭 accepted-offer/preparation shell 并释放 reservation；
  该命令不要求 Enrollment/Grant/CareGroup 已存在，也不触碰 My-Chat identity/binding。
- `reviewAt` 到期创建 Admin WorkItem/support signal，不自动改变 Enrollment、Grant、
  CareGroup 或 capacity。超过 `trialEndsAt` 后若继续试入园，必须先显式延长。
- 复盘默认汇总已有 attendance、care facts、普通 caregiver observations 与家庭沟通；
  不要求老师填写 trial 专用评估表。AI 只产出 source-cited draft，不做 suitability/
  enrollment recommendation 或评分。
- Admin 复盘结果限定为：`extend trial`（更新 ends/review 并继续占位）、
  `propose formal enrollment`（等待 Guardian 明确接受且期间继续占位）、`end trial`
  （结束并释放名额）。每个 action 记录 actor/time/source refs/reason 和前后状态。
- 接受 trial 后旧 waitlist entry 已关闭；结束后若家庭希望继续等待，重新按 D-07B
  qualification 产生新的 `waitlistQualifiedAt`。特殊顺序只通过 append-only Admin
  override，不自动恢复旧名次。
- formal activation 只在 Guardian 明确接受后开始；My-Chat owner 必须重验 current
  Child/Family membership、scenario binding 并签发当前 evidence，Nurture 不缓存
  evidence 填补 outage。
- Nurture 以一个 expected-version/idempotent local transaction 保持 Enrollment
  `status=active`、将 `participationPhase: trial → formal`、reservation 转 active
  occupancy，并更新正式 Grant/CareGroup。任一步失败时 canonical lifecycle 保持
  `active trial + reserved`，Workflow 显示
  `formalization_pending | waiting_on_system`。
- end trial 是 Nurture 本地降权事务，不依赖 My-Chat owner 可用性：Enrollment
  `status: active → ended`（历史 phase=`trial`）、CareGroup assignment 结束、
  trial-purpose Grant 关闭、reservation 释放。成功后只创建下一候补 Admin task。
- end trial 不删除 My-Chat Child/Family/membership/scenario binding，也不删除
  Nurture association 或 care history；未来 caregiver access/publication 停止，历史
  继续使用统一 retention/redaction/revoke。
- `trial_start_pending | formalization_pending | exit_pending | waiting_on_system`
  是 Workflow/waiting state，
  不是 Enrollment lifecycle。mobile/Web 只在 Nurture local commit 后改变显示。
- trial 本身承担适应期；需要继续观察时使用 D-07D 显式延期。formal Enrollment
  是最后一个业务里程碑，Workflow 在确认激活成功后幂等 complete；delivery/replay
  延迟只形成 system waiting，不增加 post-activation business stage。
- Workflow 完成后的正式离园只执行 ordinary Enrollment/Grant/CareGroup lifecycle
  downscope，不重新打开 Enrollment Journey，也不默认注册第二个 Workflow。

## Phase 4 — Institution Knowledge and RAG

- 提供园区 Admin 使用的结构化知识编辑、来源关联、版本、发布、撤回与可视化能力。
- 覆盖儿童沟通/发展、照护/安全、活动资源、家长沟通、园区制度和基础医疗/急救知识。
- 为材料保留 `institution-authored`、`authority-linked` 等 provenance；园区材料
  不因被 AI 引用而变成权威材料。
- 在线 RAG 只读取 actor-safe、已发布、当前有效的 revision；编辑预览可显式使用
  draft，但不得进入其他产品场景。
- 回答以可点击引用标明来源类型、标题、revision、日期与片段；复制/触达仍保留引用
  和 AI 辅助标识。
- 医疗事实优先引用权威来源，园区流程优先引用园区材料；发生实质冲突时停止静默
  混合并进入内容复核。
- Nurture 只拥有场景知识语义、metadata、policy、presenter 和 scenario artifact；
  通用知识/RAG runtime、模型 gateway 与 host shell 留在 My-Chat。

## Phase 5 — Privacy and Black-box Qualification

- 验证 aggregate 不泄漏家庭正文或单个孩子敏感事实。
- 验证 family-private AI/草稿/私人聊天与 institution business communication 的
  类型和授权边界不会混淆。
- 验证班级日程隔离、临时安排优先级、活动证据自动落位和待归位 fallback。
- 验证班级卡最新照片的 cover/current-activity/today fallback、稳定排序及
  correction/redaction/revoke/reassignment invalidation。
- 验证卡片不泄漏沟通正文/AI 出勤推测，详情 child-level 下钻始终要求 exact
  purpose/scope/Grant。
- 验证 Admin Web 完整照片/文字新增、读取、活动落位、downscope hide 和封面设置；
  验证 Admin-only child-attribution correction 只生成候选/WorkItem，exact CareGroup
  caregiver 才能确认；证明
  老师原始内容/作者/时间、自动匹配 provenance 与 revision history 不被覆盖。
- 验证 Admin business-communication read 同时要求 exact Institution/Enrollment/
  CareGroup、original Grant/data class/purpose、source lifecycle 和 current role。
- 验证 Admin read 不授予 acknowledge/reply/correction/redaction；跨 Institution、
  revoke、redaction、correction 和 source drift 均 owner-reread。
- 后置 AI attention 验证 source citation、最小化候选、无绩效/诊断标签、无自动 action，
  以及 source correction/redaction/revoke 后的派生失效。
- 验证确定性 support signal 的 deadline/blocker 来源、绝对负荷阈值配置、未配置
  disabled、稳定去重、两级映射和 deadline/state/time 排序。
- 验证 signal 来源解决、撤回、纠正、撤权或失效后自动消失，且不会自动创建 action、
  WorkItem、Workflow、notification 或长期绩效记录；普通 signal 不能启动
  `EnrollmentJourneyWorkflowV1`。
- 验证 mobile 首页最多三个跨班信号、班级卡 body-free count/reason、exact source
  drill-down，以及跨 Institution/class/child leakage 拒绝。
- 验证撤销 grant、错误机构、错误 group 和并发操作。
- 验证多角色用户必须切换 active role，Lead 无额外权限，非 Admin 无法进入 Admin Web。
- 验证 AI 出勤推理永远不能成为正式出勤，Admin 不能代老师确认；验证同日修订与跨日
  reopen 后老师修订的完整审计。
- 验证 RAG 不读取草稿、过期材料或未授权 child facts；验证引用、来源冲突、拒答和
  医疗升级边界。
- 验证同一 Workflow 在 mobile/Web 的 projection version、状态与里程碑一致，
  同角色仍需通过 Workspace/scope/assignment/visibility。
- 验证第一增量只能发现/启动 `EnrollmentJourneyWorkflowV1`，其他普通 Action、
  WorkItem、Grant change、CareInteraction、PublishProcess 和 support signal 不注册
  为 Workflow。
- 验证意向 → 可选到访/满班候补 → trial preparation/start → 试入园适应 → 复盘
  → 正式确认/formalization → complete 的顶层分支与恢复；精确 schema 在 contract
  freeze register 通过前保持 NO-GO。
- D-07A minimum-data tests for nickname/preferred label, birth month or age band, expected
  entry, target class type, care schedule, source channel and last/next touchpoint, including
  legal-name/full-birth-date absence by default.
- Contact-owner tests proving raw phone/WeChat/email/account identity never enters Nurture
  Workflow/projection and an unavailable Host contact contract fails closed.
- Native/external touchpoint tests proving native Message refs owner-read current content while
  external channels retain only Admin-authored structured summaries with append-only correction.
- AI/transition tests proving only cited authorized native source creates a reviewable summary
  candidate and only explicit Admin confirmation advances inquiry; no intent/fit/conversion score.
- 验证 capacity waitlist 只能由容量不足进入，普通 external/system/future-date wait
  不污染候补顺序或候补指标。
- D-07B qualification tests proving explicit family acceptance + target class + minimum data
  creates `waitlistQualifiedAt`, while inquiry/visit time never reserves order.
- Ordering tests for versioned priority category plus within-category FIFO, no-category pure FIFO,
  AI exclusion and append-only Admin override reason/before/after history.
- Projection privacy tests proving family view has status/class/review/contact time but no exact
  rank/other-family count/category inference; exact Admin policy is required for full ordering.
- Review/expiry tests for mandatory `nextReviewAt`, waiting-on-Guardian after no response,
  configured reminders/deadline and no single-attempt deletion.
- Capacity/offer tests proving vacancy produces only an Admin task, offer is time-limited,
  Guardian acceptance advances explicitly, and decline/expiry selects the next eligible entry
  without auto Enrollment/Grant.
- D-07C pre-trial tests proving actual care cannot begin until Guardian-authorized My-Chat
  Child/Family, current binding/association, pending Enrollment/Grant and exact CareGroup
  assignment are all current, followed by an atomic trial-start commit.
- Shared-path tests proving trial children use the normal roster, attendance, care-fact, media
  attribution, board and PublishProcess policies without a TrialChild or parallel caregiver flow.
- State-mapping tests proving trial preparation uses `status=pending`, actual trial/formal care
  uses `status=active`, `participationPhase=trial|formal` is canonical but grants nothing, and
  formal counts require `status=active && participationPhase=formal`.
- Continuity/counting tests proving trial attendance contributes to same-day care/safety
  headcount, stays out of formal Enrollment totals, and formalization updates the same
  relationship without copying child/media/care facts.
- D-07D capacity tests proving accepted trial closes the waitlist entry, reserves one exact class
  seat for the bounded trial and prevents parallel commitment of that seat.
- Preparation-cancellation tests proving Guardian withdrawal before trial-start closes the
  accepted-offer shell and releases the reservation without requiring Enrollment/Grant/CareGroup
  or mutating My-Chat identity/binding; after trial-start the end-trial path is required.
- Review-clock tests for required `trialStartsAt`, `trialEndsAt` and `reviewAt <= trialEndsAt`;
  due review creates an Admin task/signal but never auto-extends, activates, ends or releases.
- Expiry tests proving no new planned trial care is authorized after `trialEndsAt` without an
  explicit extension and the reservation is not silently double-allocated.
- Review-evidence tests proving existing attendance/care/observation/communication sources are
  reused, caregivers have no special scoring report and AI produces only cited drafts without a
  suitability or enrollment recommendation.
- Outcome tests proving only Admin can extend, propose formal enrollment or end; Guardian
  acceptance is required for active transition and all decisions retain actor/time/source/reason.
- Re-waitlist tests proving trial end never restores an old rank; a new D-07B qualification time
  is required unless an explicit append-only Admin override records the exception.
- D-07E activation tests proving Guardian acceptance and current My-Chat Child/Family
  membership/binding evidence are reread before the Nurture transaction; stale/cached/
  unavailable evidence never activates.
- Local-atomicity tests proving Enrollment remains `status=active` while
  `participationPhase: trial→formal`, reservation→active occupancy and formal Grant/CareGroup
  updates commit together under expected version/idempotency.
- Activation-failure tests proving owner outage, binding drift, conflict or local failure keeps
  canonical `active trial + reserved`, exposes only Workflow waiting state and exact-replays safely.
- Projection tests proving mobile/Web cannot display active/ended before the Nurture commit and
  cannot diverge across surfaces after retry.
- Exit tests proving one local downscope transaction marks ended, closes CareGroup/trial Grant,
  releases reservation and creates only an Admin waitlist task, including during owner outage.
- Identity/history tests proving exit never deletes My-Chat Child/Family/membership/binding,
  Nurture association or care facts; future access/publication stops while historical lifecycle
  follows T-006.
- 验证 activation-success → Workflow completion 的幂等边界，以及 delivery/replay
  失败只产生 system waiting、不重新引入业务适应期。
- Post-completion offboarding tests proving formal
  `status: active→ended` is ordinary Enrollment maintenance and does not reopen the Journey or
  create a second Workflow by default.
- 跑 guardian/caregiver 事实 → institution aggregate/workbench 的完整旅程。

## Exit Gate

角色化 presenter、Admin Web contracts、每日出勤闭环、园区知识/RAG policy 与最小
commands 可由 My-Chat consumer 使用；`02-architecture.md` freeze register 的每个
contract/schema gate 均通过并保留默认安全行为，通用 runtime、应用壳与分发留在
My-Chat companion。
