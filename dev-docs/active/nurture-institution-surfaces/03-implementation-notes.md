# Implementation Notes — 机构端双 Surface

## 2026-07-29 — Task package created

- 创建 T-007 规划包。
- 将 institution mobile read-only board 与 Web workbench 作为一个机构权限/聚合
  领域任务；当时仍为 Surface 概称，后续由 2026-07-30 决策细化为 Admin mobile 与
  `InstitutionAdminWorkbench`。
- 明确 T-003 对机构端仍是框架级设计，未决细节通过 decision log 处理。
- 当前无代码、schema、aggregate 或 presenter 变更。

## 2026-07-29 — InstitutionWorkflow and board projection semantics locked

- 当前产品 Workflow 收敛为园区管理 `InstitutionWorkflow`。
- 当时以通用 institution Web 概称主要操作面，mobile 只读投影 Workflow 关键内容、
  阶段、里程碑、阻塞和下一步；2026-07-30 进一步锁定为 `institution_admin`
  Surface，不适用于其他角色。
- 同角色可获得更完整 projection，但不替代 Workspace/scope/assignment/visibility。
- family-care ActionExecution、ActionDelivery 与 caregiver PublishProcess 明确排除在
  Workflow 之外。
- 当前仅更新规划文档，无代码、schema、aggregate、runtime 或 presenter 变更。

## 2026-07-30 — Role-bound surfaces, attendance and knowledge/RAG decisions locked

- D-01：当前园区管理角色固定为 `institution_admin`；Lead 只是 Admin 指定的内部
  分工标识，不产生额外权限，也不表示园区负责人。
- D-02：mobile/Web 都绑定显式 active role，多角色用户必须切换角色；当前仅定义
  `InstitutionAdminWorkbench`，不为其他角色创建共享或空壳 Web。
- D-03：Admin Web 收敛为人员与关系、日常运营、家长触达、数字资源、知识/RAG 和
  园区责任队列。普通 action/WorkItem 与多阶段 `InstitutionWorkflow` 保持分离。
- `institution_admin` mobile board 继续只读；老师每日出勤提交位于 caregiver
  mobile Surface，因此不构成 Admin mobile 的隐藏写操作。
- AI 仅在每天提交时从当天稳定证据生成出勤推理；有效的当前班级老师确认后才写入
  正式出勤。Admin 可催办、退回和跨日 reopen，不能代确认。
- 同日由有效班级老师直接修订；跨日由 Admin reopen 后仍由有效班级老师修订，全部
  保留提交人、修订人和输入 revision 审计。
- 园区 Admin 可以编辑和发布包括医疗类在内的知识，并可关联权威来源。RAG 回答必须
  区分、引用园区材料或权威来源；医疗来源冲突不得由 AI 静默混合。
- Nurture 保留场景知识语义、metadata、policy、presenter 和 safety routing；
  My-Chat 保留通用知识/向量检索/RAG/model gateway 和 host shell。
- 本轮只更新 T-007 规划与语义文档；没有代码、schema、runtime、provider、模型或
  capability activation 变更。

## 2026-07-30 — D-04 class-first Admin mobile and communication visibility locked

- Admin mobile 从园区统一时间线改为班级顶层入口；园区层只保留园区级事项、班级列表
  和跨班级异常。
- 每个班级使用独立的有效日程、一日活动、今日沟通与关注和家园共育；日程允许园区
  默认、班级覆盖和当日临时安排。
- 照片/文字/活动记录先按显式 activity ref，再按当日安排和班级日程/时间自动落位，
  AI 仅后置处理歧义；无法确定时留在本班待归位。
- “无记录”不等于“活动未开展”，班级卡不得把记录覆盖转写为活动完成或老师绩效。
- 园区业务沟通从发送前即披露 Institution Admin 监督读取用途，Admin 无需老师升级
  即可只读查看当前授权正文、附件与变更状态。
- Admin read 不包含家庭私密 AI、草稿、私人聊天或其他 Institution，也不授予
  CareGroup acknowledge/reply/correct/redact。
- 后置 AI attention 只在相同 owner-read 范围内突出带引用的介入候选，不自动行动、
  归责、诊断或评分。
- 该决定要求 T-004 visibility matrix、T-005 owner-read presenter 和注册 context
  contract 增加一个 versioned、default-off 的 Institution Admin protected read；
  当前 manifest/module/source 尚未实现或启用。

## 2026-07-30 — D-05 class card/detail and complete Web records locked

- 将模糊的“代表照片”改为可解释的“最新照片”：有效显式封面优先，否则使用当前
  活动最新合格照片，再 fallback 到本班今日最近活动；不调用审美/生成式 AI。
- 待复核、candidate-only、归属不明、已撤回/删除/失权的照片不进入卡片；source
  失效或重新归属后按新 snapshot 重算。照片不 crop、不美化、不生成人脸特写。
- 班级卡只显示当前/下一活动、正式出勤提交状态、最新照片/文字、source timestamp
  和待处理数量。沟通正文、AI 出勤推测、孩子名单、匹配 confidence 与绩效/freshness
  分数留出卡片。
- 班级详情提供完整 actor-safe 一日活动、沟通、家园反馈与正式出勤状态；孩子级
  下钻仅服务于明确沟通/出勤/证据核对 purpose。
- Admin Web 可新增园区来源照片/文字、查看完整原图/正文、设置封面并调整活动/孩子
  关联。老师原始内容、作者和时间不可原地覆盖；调整追加 revision 并保留自动匹配、
  操作者、原因和完整变更历史。
- Web 只是 Nurture query/action 的操作面，不成为照片/文字的第二 canonical owner；
  当前仍是文档决策，未修改代码、schema、manifest 或 module。
- 本轮文档变更保留在现有共享 dirty worktree，尚未 commit；不得描述为已实现或
  landed contract。

## 2026-07-30 — D-06 support-signal semantics locked

- Support Signal 固定为“园区可能需要提供支持”的非 canonical 投影，不是异常定责、
  绩效分或 `InstitutionWorkflow`。
- 第一版包含 canonical deadline/blocker 驱动的确定性状态，以及园区显式配置的
  absolute count/time-window 负荷规则；未配置的负荷规则保持 disabled。
- 用户只看到“需要处理 / 建议关注”两级。前者仅对应明确 overdue/blocker，后者用于
  绝对负荷阈值和未来 AI attention；AI 不决定级别。
- Mobile 首页最多突出三个跨班信号，班级卡只显示 body-free count/safe reason，并
  通过 exact owner-read 下钻；Mobile 不提供 dismiss/ack/escalate 写操作。
- Admin Web 提供 policy 配置、来源查看和既有 source action；WorkItem/Workflow 必须
  独立显式创建，signal 不自动升级或通知他人。
- source 解决、纠正、撤回、redaction、revoke 或失效后投影自动消失；不保留老师/
  班级长期“标红”历史。AI 内容介入继续 default-off。
- 当前仍为未提交文档决策；没有代码、schema、manifest、module 或 runtime activation
  变更。

## 2026-07-30 — D-07 enrollment-journey top-level scope locked

- 首个实现的 `InstitutionWorkflow` 只选择
  `EnrollmentJourneyWorkflowV1`；不并行实现 Grant-change 或通用 Workflow builder。
- 顶层旅程覆盖意向、沟通、可选到访、可选满班候补、试入园准备/过程/复盘、正式
  确认、identity/Grant/Enrollment activation、适应期和完成。
- 将此前泛化的“等待期”纠正为 `capacity_waitlist`：只在目标班级满员时进入。等待
  Guardian、caregiver、system、未来日期或 blocker 是独立 waiting/blocking state，
  不进入候补顺序或容量统计。
- 意向期只保留最少 local provisional data；实际试入园前必须有 Guardian consent，
  family-facing 试入园照片/文字还要求 current My-Chat binding 和 Grant。
- Admin 对整体 journey accountable；Guardian、trial CareGroup caregiver 和 system
  owner 在各自步骤成为 waiting party。Caregiver 继续使用 role-bound mobile，不新增
  caregiver Web；Lead/coordinator 不增加权限。
- 正式 Enrollment 激活是 milestone；Workflow 在配置的 settling period 闭环后才完成，
  不产生孩子适应或家庭价值评分。
- 本轮只锁顶层产品范围，精确阶段 enum、transition、commands、候补顺序、trial
  consent、activation transaction 和 settling completion 明确保留后续深入讨论。
- 当前仍为共享 dirty worktree 中的未提交文档决策；没有代码、schema、manifest、
  module 或 runtime activation 变更。

## Open Items

- aggregate 的隐私阈值与时间窗口。
- workbench 首轮是否只支持单条操作。
- D-07 意向最少字段/touchpoint、capacity waitlist 排序/优先/复核、trial consent/
  provisional data/caregiver evidence、复盘人类决定、Guardian confirmation/binding/
  Grant/Enrollment 顺序、settling completion 和 projection 的精确 schema。
- attendance evidence/inference/submission/fact 的精确 schema、source watermark 与
  并发修订 contract。
- 园区知识 revision/publish lifecycle、来源冲突复核动作、citation DTO 和 RAG owner
  contract。
- `InstitutionBusinessCommunicationProjectionV1`、parent-direct-to-institution
  Message、渠道 disclosure、Grant purpose 和 owner-read endpoint。
- 后置 `InstitutionAttentionCandidate` 的 policy/model/prompt、privacy/retention、
  correction/redaction/revoke invalidation 和 activation gate。
- `InstitutionSupportSignalProjectionV1`、policy config、stable source identity、
  deadline/category allowlist 和 Web command 的精确 schema。
