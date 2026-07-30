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
- [x] 固定 D-07 顶层范围：首个实现只做 `EnrollmentJourneyWorkflowV1`，覆盖意向到
  适应期闭环；满班候补与普通 waiting state 分离。
- [ ] 深化 D-07 意向、候补、试入园、复盘、activation 和适应期的精确状态机、数据、
  authority、commands 与 projection schema。

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
  可选封面、调整活动与孩子关联；调整写入 append-only revision，保留老师原文、
  原作者/时间、自动匹配结果和全部变更历史。
- 提供需园区处理的责任队列：普通 WorkItem 与 `InstitutionWorkflow`
  queue/detail/steps/forms/audit 明确区分。
- 提供 support-signal policy 配置、来源查看和对应 source action 入口；由 Admin
  显式决定是否建立 WorkItem/Workflow，signal 不自动升级。
- 所有跨 child/family 作用域操作要求显式 authority 与幂等。
- 首个 Workflow 列表只注册 `EnrollmentJourneyWorkflowV1`；Admin Web 队列区分
  需要园区处理、等待家庭、等待 caregiver、等待系统、满班候补、已阻塞和适应期跟进。
- 意向阶段使用最少、本地 provisional record；不得在 Guardian authority 前 mint/
  infer My-Chat child/family identity，也不得把 marketing/CRM score 带入 Workflow。
- `capacity_waitlist` 只在目标班级满员时使用，保留目标班级/年龄段、期望日期、
  enteredAt、capacity basis 和 next review；具体排序/优先政策留给后续决策。
- 试入园前要求明确 Guardian consent；试入园 caregiver 记录通过既有 role-bound
  mobile/action 产生，Admin Workflow 只引用，不复制或要求 caregiver Web。
- 正式 Enrollment 激活是旅程 milestone，不是 Workflow 自动完成；适应期闭环后才
  complete。

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
- 验证 Admin Web 完整照片/文字新增、读取、活动/孩子关联修订和封面设置；证明
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
  WorkItem、Workflow、notification 或长期绩效记录。
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
- 验证意向 → 可选到访/满班候补 → 试入园 → 复盘 → 正式确认 → activation →
  settling → complete 的顶层分支与恢复；精确枚举在 D-07 深化前保持 NO-GO。
- 验证 capacity waitlist 只能由容量不足进入，普通 external/system/future-date wait
  不污染候补顺序或候补指标。
- 验证 provisional-only、Guardian trial consent、binding/Grant family publication
  gate、caregiver exact trial scope 和 settling-period completion boundary。
- 跑 guardian/caregiver 事实 → institution aggregate/workbench 的完整旅程。

## Exit Gate

角色化 presenter、Admin Web contracts、每日出勤闭环、园区知识/RAG policy 与最小
commands 可由 My-Chat consumer 使用；未决产品问题不得被隐式实现，通用 runtime、
应用壳与分发留在 My-Chat companion。
