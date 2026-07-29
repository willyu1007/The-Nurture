# Overview — 儿童照护双看板

## Status

- State: planned
- Task: T-006
- Milestone / Feature: M-002 / F-003
- Updated: 2026-07-29
- Next step: D-01/D-02 已锁定可操作共享投影与 `PublishProcess` 的产品用途；
  下一步确定它的精确发布单位、状态机、自动保存和人工/定时发布授权。

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

## Scope In

- family charter / focus、current focus、daily care、attention 与成长记录的角色化投影。
- 共享的 board projection pipeline、角色独立 presenter 与可操作的内联微调能力。
- caregiver 的 class/work queue、快速记录、photo-first capture 与待发布内容。
- 园所内部采集成为家庭发布候选后，由 `PublishProcess` 管理到原子 publish 或
  pre-publish cancel 的两阶段发布。
- 角色安全的 `InstitutionWorkflowProjection` 外部切片，例如待处理授权申请或结果；
  不暴露园区内部步骤。
- provenance、authority、receipt、correction 与 owner-reread。
- AI 仅作为整理和建议 provider，保留人工确认边界。
- guardian/caregiver presenter、queries、commands、fixtures 与黑盒旅程。

## Scope Out

- 儿童、教师、家庭或机构排名、打分、竞争性指标。
- 医疗诊断、处方或自动风险结论。
- 默认把 class draft 或其他孩子信息展示给家庭。
- My-Chat 原生 UI、相机、相册、上传、推送与设备权限实现。

## Dependencies and Gates

- T-004 的 surface、visibility、presenter 和 fixture 基座。
- T-005 的家庭—照护者通信、回执与纠正语义。
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
- [ ] 任一发布都经历可验证的 draft/review/publish 状态并保留 provenance 与 receipt。
- [ ] 原始班级采集不因存在而自动创建家庭发布或跨边界；只有成为明确的家庭发布候选后
  才进入 `PublishProcess`。
- [ ] `PublishProcess` 不吸收 device upload、AI provider execution、CareInteraction、
  ActionDelivery 或 InstitutionWorkflow 的状态和所有权。
- [ ] 发布成功只表示 Nurture 已提交家庭可见事实与 Receipt，不冒充 notification、
  provider 或 device delivery。
- [ ] AI 整理结果必须可审阅、可修改、可拒绝，且不产生排名或诊断。
- [ ] My-Chat 可通过公共 view-model 实现看板，无需访问 Nurture persistence。
- [ ] two-stage publish 使用 `PublishProcess`，不因多状态或异步投递被归类为 Workflow。
- [ ] Workflow 信息只通过当前授权的 projection 展示；board 不拥有 Run/Step，也不以
  “相同角色”替代 Workspace/scope/visibility 检查。

## Next Step

D-01 已锁定“共享 canonical facts / 模块语义 / 投影管线，分离角色查询与 presenter，
不新增统一持久化 child-state”的边界，同时确认看板可通过正式 capability 提供低打扰
微调。D-02 已锁定 `PublishProcess` 只管理园所内部内容成为家庭发布候选后的 review /
release boundary，不管理采集 transport、家庭沟通、通知投递或园区 Workflow。下一步
对齐 D-03：精确发布单位、状态机、草稿自动保存、人工/定时发布授权和发布后变更衔接。
