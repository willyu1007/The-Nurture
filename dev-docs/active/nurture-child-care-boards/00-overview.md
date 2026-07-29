# Overview — 儿童照护双看板

## Status

- State: planned
- Task: T-006
- Milestone / Feature: M-002 / F-003
- Updated: 2026-07-29
- Next step: 在 T-004 contract inventory 与 T-005 receipt 语义稳定后，确定双看板共享 read model、`PublishProcess` 状态机与角色安全 Workflow projection。

## Goal

落地 Guardian family board 与 Caregiver teacher board 的 Nurture 侧产品能力。两个
surface 使用同一组可追溯照护事实，但按角色、授权和当前工作上下文提供不同投影：
家庭看到长期连续性，照护者看到当前工作与待确认事项。看板可显示与当前角色相关的
`InstitutionWorkflowProjection` 片段，但不拥有 Workflow 事实或 runtime。

Caregiver teacher board 的家庭事项以精确 CareGroup 为共同工作单元：
acknowledge 表示班级已收到，不创建个人认领；同班任一当前合格照护者可在重新授权
检查后追加一条或多条回复。班级是家庭侧主要业务发送主体，个人身份用于操作审计
与可选次级署名；第一条回复解除待回复提醒，但不关闭事项。

## Scope In

- family charter / focus、current focus、daily care、attention 与成长记录的角色化投影。
- caregiver 的 class/work queue、快速记录、photo-first capture 与待发布内容。
- draft → review → publish 的两阶段发布。
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
- [ ] guardian 只看到自己被授权 child scope 的家庭投影。
- [ ] caregiver 只看到授权班级/孩子的工作投影，且不会泄漏其他家庭私密内容。
- [ ] teacher board 不把 acknowledge actor 显示为独占负责人；同一精确 CareGroup
  内其他当前合格照护者仍可回复，跨班级或仅同园区不可操作。
- [ ] 同班不同老师的独立回复可以并发提交并稳定排序；board 不把第一条回复投影成
  terminal/unique reply，也不重复创建待回复 Attention。
- [ ] 任一发布都经历可验证的 draft/review/publish 状态并保留 provenance 与 receipt。
- [ ] AI 整理结果必须可审阅、可修改、可拒绝，且不产生排名或诊断。
- [ ] My-Chat 可通过公共 view-model 实现看板，无需访问 Nurture persistence。
- [ ] two-stage publish 使用 `PublishProcess`，不因多状态或异步投递被归类为 Workflow。
- [ ] Workflow 信息只通过当前授权的 projection 展示；board 不拥有 Run/Step，也不以
  “相同角色”替代 Workspace/scope/visibility 检查。

## Next Step

在 T-004 contract inventory 与 T-005 receipt 语义稳定后，确定双看板共享 read model 与两阶段发布状态机。
