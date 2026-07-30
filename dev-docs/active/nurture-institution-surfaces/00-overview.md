# Overview — 机构端双 Surface

## Status

- State: planned
- Task: T-007
- Milestone / Feature: M-002 / F-003
- Updated: 2026-07-30
- Next step: 深入讨论已锁定顶层范围的 D-07 `EnrollmentJourneyWorkflowV1`，依次
  固定意向字段/沟通边界、满班候补规则、试入园授权与记录、复盘、activation 顺序和
  适应期闭环；在此之前不冻结精确状态机或 schema。

## Goal

落地角色化 Institution surfaces 的 Nurture 侧产品能力。当前仅提供
`institution_admin` 的 mobile read-only board 与 `InstitutionAdminWorkbench`：
mobile 提供安全聚合、支持信号和只读 Workflow 关键内容/进度投影；Web 提供人员与
关系、日常运营、家长触达、数字资源、知识/RAG 和园区管理 Workflow 操作。同一用户
拥有多个角色时必须显式选择角色上下文，不存在合并权限的超级 Surface。

每日出勤在老师的 caregiver 移动端完成：AI 只在每日提交时根据当天业务证据生成
推理，当前班级老师确认、调整并提交后才形成正式出勤事实。园区 Admin 可查看汇总、
催办、退回或跨日重新打开，但不能代替老师确认。

Admin mobile 以班级为顶层入口，每个班级按自己的当日有效日程组织照片、文字与活动
记录，并提供“今日沟通与关注”和“家园共育”。园区业务沟通从发送前即明确
`institution_admin` 的监督读取权，无需老师主动升级；家庭私密 AI 对话、未发送草稿
和非园区私人聊天仍不可见。后置 AI 只能在相同 owner-read 范围内生成可解释的介入
候选，不自动采取行动。

班级卡只提供当前活动、正式出勤提交状态、最新一张合格班级照片、最新文字、来源
时间和待处理数量；不生成 AI “代表照片”或 freshness/绩效分数。班级详情展开完整
日程活动、沟通、家园反馈和必要的目的限定 child-level 信息。Admin Web 可记录和
查看完整照片/文字，并可调整活动/孩子关联或设置可选封面，但不得覆盖老师原始内容、
伪造作者或抹去自动匹配及后续修订历史。

Support Signal 只表示“园区可能需要提供支持”。第一版由确定性业务状态和园区显式
配置的绝对数量/时间窗口规则生成，用户只看到“需要处理 / 建议关注”两级，不形成
班级、老师或孩子评分。Mobile 只读展示并下钻来源；阈值配置和实际处理位于 Admin
Web。内容语义介入仍是后置、default-off 的 AI candidate。

首个实现的园区 Workflow 只选择 `EnrollmentJourneyWorkflowV1`，覆盖意向咨询、
意向沟通、可选到访、班级满员候补、试入园准备/过程/复盘、正式入园确认、身份与
授权/Enrollment 激活、入园适应期和完成。`capacity_waitlist` 只表示目标班级满员；
等待家长、老师、系统或未来日期是当前等待状态，不是候补业务阶段。Workflow 在正式
Enrollment 激活后继续到适应期闭环，但详细状态机与 schema 留待后续共创。

## Scope In

- 角色化 Surface policy：同一用户显式切换角色；Lead 仅为 Admin 确定的内部分工
  标识，不授予权限，也不代表园区负责人。
- `institution_admin` mobile read-only board：园区级事项、班级列表、班级独立一日
  活动、今日沟通与关注、家园共育、跨班级异常摘要和
  `InstitutionWorkflowProjection`。
- 班级日程与活动投影：园区默认模板、班级覆盖、当日临时安排和有效期；照片/文字/
  活动记录先按明确关联，再按班级日程/时间，最后才由 AI 辅助落位，无法确定时留在
  本班待归位。
- 班级卡/详情：卡片展示当前/下一活动、正式出勤提交状态、确定性选出的最新合格
  照片、最新文字、source timestamp 和待处理数量；详情展示完整 actor-safe 一日
  活动、沟通、家园反馈、出勤与目的限定的孩子级下钻。
- 园区业务沟通 Admin 只读投影：精确绑定 Institution/Enrollment/CareGroup、
  Grant/data class/purpose、source lifecycle 和 redaction；包含 family-to-org、
  org-to-family 和家长直达园区的正文/附件/更正状态。
- 后置 `InstitutionAttentionCandidate`：在同一授权沟通范围内突出可能需要园区介入
  的内容并引用来源，不形成老师/家长/孩子评分或自动 action。
- `InstitutionSupportSignalProjectionV1`：从确定性业务 deadline/blocker 与园区
  配置的绝对负荷阈值生成“需要处理 / 建议关注”两级只读投影；不做跨班比较、历史
  基线异常检测或自动 Workflow。
- `EnrollmentJourneyWorkflowV1` 顶层旅程：单一首发 Workflow，覆盖意向到适应期
  闭环；园区 Admin 对整体负责，Guardian/Caregiver/system 仅在各自步骤成为当前
  waiting party，不因此进入 Admin Web。
- `InstitutionAdminWorkbench`：人员与关系、日常运营、家长触达、数字资源、知识/RAG、
  roster/invite、parent confirmation、grant lifecycle 和 `InstitutionWorkflow` 操作。
- Admin Web 完整活动记录：园区可新增照片/文字、查看完整原图和正文、设置可选活动
  封面，并对活动/孩子关联进行可审计修订；原始内容、作者、capture/source time、
  自动匹配结果与 revision history 保留。
- 每日班级出勤闭环：AI submission-time inference、当前班级老师确认、同日可审计
  修订，以及跨日由 Admin 重新打开后再由老师修订。
- 园区可编辑和发布的知识库，包括儿童沟通/发展、日常照护、园区制度、活动资源、
  家长沟通与基础医疗/急救知识；知识可关联权威来源。
- role-safe RAG：仅使用当前有效、已发布、actor-safe 的材料，回答区分并引用园区
  材料或权威来源，医疗冲突不静默混合。
- 机构 actor、role、group、enrollment、child scope 与 aggregate policy。
- 去排名、去诊断、隐私安全的聚合规则。
- institution presenters、queries、commands、fixtures 和审计证据。
- 对尚未锁定的机构产品细节建立显式 open-question / decision log。

## Scope Out

- 完整 CRM、ERP、排班、计费、人事或市场化机构后台。
- 招生销售漏斗、家庭价值/转化概率/孩子适配评分或通用 prospect marketing automation；
  入园 Workflow 只保存完成该旅程所需的最少 provisional 信息和业务 touchpoints。
- Caregiver、Guardian 或其他非 Admin 角色的 Web 操作台；Lead designation 当前不
  形成独立 Surface。后续 Web 按真实角色分别定义，不创建空壳或共享 Admin Web。
- 教师、儿童、家庭、班级或机构排名。
- 家庭 AI 私密对话、未发送草稿、My-Chat 私人聊天或其他 Institution Enrollment
  沟通的机构读取/汇总。园区业务沟通的精确只读投影不属于该私域。
- AI 自动确认正式出勤、Admin 代替班级老师确认出勤，或把“有记录的孩子数”直接
  当作出勤人数。
- 使用生成式/审美模型挑选“最佳代表照片”，或要求老师必须为每个活动挑封面。
- Admin 原地改写老师照片/文字、伪造原始作者/时间，或用关联调整删除自动匹配与
  历史 revision。
- 将支持信号变成班级/老师绩效分、红黄绿排名、同伴比较或隐藏 AI risk score。
- 仅因“没有活动记录”生成支持信号，或由信号自动回复、通知他人、创建 WorkItem/
  Workflow。
- 将所有等待都塞进 `capacity_waitlist`，或在班级未满时用候补阶段代替
  `waiting_on_guardian | caregiver | system | scheduled_for_future | blocked`。
- 在家长授权前创建/推断 My-Chat child/family identity，或在缺少试入园同意、
  binding/Grant 时向家庭发布试入园照片与记录。
- 诊断、处方、替代急救/医疗人员的回答，或把园区材料伪装成权威医疗结论。
- My-Chat 的通用知识存储、向量检索、模型 gateway、RAG runtime、Web/native shell、
  admin runtime、账号、通知和商店分发。

## Dependencies and Gates

- T-004 公共 surface、visibility 和 aggregate contract。
- T-005 family-care communication 与 owner-reread。
- T-006 care facts、publication 和 role projections。
- T-002 institution/group/enrollment/grant、opaque identity binding 与 qualification gates。
- T-003 机构 surface 仅为框架级输入，未决定内容不得被实现者默认为产品承诺。

## Acceptance Criteria

- [ ] 每个 mobile/Web Surface 都绑定一个显式角色上下文；多角色用户不会获得合并
  权限，Lead 不产生额外 capability。
- [ ] `institution_admin` mobile board 为 read-only，且只显示 policy-approved
  class/detail projections、aggregate 与支持信号。
- [ ] Admin mobile 首页以班级为顶层入口；每个班级使用自己的有效日程，不把全园
  班级强行落到一条统一活动时间线。
- [ ] 班级活动只展示 actor-safe 的照片/文字/记录证据；无记录不等于活动未开展，
  自动归位不确定时留在本班待归位。
- [ ] 班级卡使用“最新照片”而非主观“代表照片”：可选显式封面优先，否则按当前
  活动、当日最近活动的稳定规则选择；待复核、归属不明、已撤回/删除/失权内容排除。
- [ ] 班级卡不展示沟通正文或 AI 出勤推测，只展示正式出勤提交状态、活动摘要、
  source timestamp 和待处理数量；完整内容在班级详情/Web 读取。
- [ ] Admin 可只读查看明确属于该 Institution 的园区业务沟通正文、附件与更正状态，
  无需老师升级；家庭私密 AI、草稿、私人聊天和其他 Institution 仍不可见。
- [ ] 后置 AI attention 只在同一 owner-read 范围内产生带 source refs 的候选；
  redaction/correction/revoke 会同步失效候选，且 AI 不自动回复、建 Workflow 或评分。
- [ ] Support Signal 只分“需要处理 / 建议关注”；确定性信号来自 canonical
  deadline/blocker，负荷信号只使用园区配置的绝对阈值，不做跨班/跨老师比较。
- [ ] 未配置负荷阈值时该类信号保持 disabled；来源解决、撤回、纠正、撤权或失效后
  派生信号自动消失，不形成长期绩效历史。
- [ ] Admin mobile 最多突出三个跨班级信号并只读下钻；阈值配置、source action 与
  显式创建 WorkItem/Workflow 位于 Admin Web，信号本身不自动产生业务动作。
- [ ] 首个实现只包含 `EnrollmentJourneyWorkflowV1`；Grant change、出勤修订、知识
  编辑、CareInteraction、PublishProcess 和 support signal 不伪装成第二个 Workflow。
- [ ] 顶层阶段覆盖意向 → 沟通/可选到访 → 满班候补（可选）→ 试入园 → 复盘 →
  正式确认 → identity/Grant/Enrollment activation → 适应期 → 完成。
- [ ] `capacity_waitlist` 只由目标班级容量不足进入；其他等待保持为 waiting state，
  并显示当前等待方和下一次复核/预计时间。
- [ ] 意向期只保留最少本地 provisional record；试入园前需要明确 Guardian 同意，
  family-facing 试入园内容还需 current binding/Grant。
- [ ] Enrollment 可在 Workflow 完成前激活；Workflow 只有在配置的适应期闭环后完成，
  且不输出孩子适应评分。
- [ ] Admin mobile board 可查看当前 actor-safe Workflow 关键内容、阶段、里程碑、阻塞和
  下一步，但不暴露 raw Run/Step 或提供隐藏写操作。
- [ ] 当前只有 `institution_admin` 可以进入 `InstitutionAdminWorkbench`；非 Admin
  角色不能进入或借用其 capability。
- [ ] Admin Web 的 roster/invite/confirmation/grant、日常运营、家长触达、数字资源和
  知识操作均有明确 authority、状态和审计。
- [ ] Admin Web 可记录/查看完整照片和文字，并可设置封面、调整活动/孩子关联；
  所有修改追加 revision，老师原始内容/作者/时间与自动匹配 provenance 不被覆盖。
- [ ] AI 只在每日提交时生成带证据的出勤推理；当前班级老师明确提交后才产生正式
  出勤，同日修订和跨日 reopen 均保留审计，Admin 不能代确认。
- [ ] 出勤事实、记录覆盖率和 AI 推理候选在 contract 与 UI 中保持不同语义。
- [ ] 园区 Admin 可编辑/发布包括医疗类在内的知识；RAG 回答逐项标明园区或权威
  来源、版本和引用片段，来源冲突时不静默拼接。
- [ ] Web 与 mobile 消费同一 `InstitutionWorkflow` 事实与 versioned projection；
  Admin Web 是主要 Workflow 操作面，Admin mobile 不复制或拥有 Workflow。
- [ ] aggregate 无法反推出家庭私密正文或未授权 child-level facts。
- [ ] 产品中不存在教师/孩子/家庭的排名、评分或诊断性结论。
- [ ] institution presenter 可被 My-Chat 消费且不暴露内部 persistence。
- [ ] 所有仍开放的产品问题有 owner、决策门和默认安全行为。

## Next Step

继续 D-07 深入共创，按顺序固定：

1. 意向阶段最少信息和沟通 touchpoint；
2. `capacity_waitlist` 名额/顺序/复核规则；
3. 试入园 consent、临时数据和 caregiver 记录；
4. 试入园复盘与人类决定边界；
5. guardian confirmation、binding、Grant、Enrollment 的精确顺序；
6. 适应期长度、反馈和完成条件。
