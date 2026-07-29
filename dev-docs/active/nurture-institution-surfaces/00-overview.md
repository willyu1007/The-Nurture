# Overview — 机构端双 Surface

## Status

- State: planned
- Task: T-007
- Milestone / Feature: M-002 / F-003
- Updated: 2026-07-29
- Next step: 以 T-002 authority/grant contract、Workflow 产品语义契约和 T-004 visibility matrix 为准，形成 `InstitutionWorkflowProjection` 字段/角色矩阵与聚合隐私阈值提案。

## Goal

落地 Institution board（mobile read-only）与 Institution workbench（Web）的 Nurture
侧产品能力。当前产品 Workflow 只指园区管理 `InstitutionWorkflow`：mobile board
提供安全聚合、支持信号和只读 Workflow 关键内容/进度投影；Web workbench 是
roster/invite、家长确认、GrantRequest/Grant 与 Workflow 的主要操作面。机构只能
看到被授权的聚合与工作事实，不能汇总家庭私密正文。

## Scope In

- 机构 mobile read-only board：宏观概览、家庭流转、理念到日常工作的可见链路、
  支持信号与 `InstitutionWorkflowProjection`。
- Web workbench：最小 roster/invite、parent confirmation、grant lifecycle 和
  `InstitutionWorkflow` 操作。
- 机构 actor、role、group、enrollment、child scope 与 aggregate policy。
- 去排名、去诊断、隐私安全的聚合规则。
- institution presenters、queries、commands、fixtures 和审计证据。
- 对 T-003 尚未锁定的机构产品细节建立显式 open-question / decision log。

## Scope Out

- 完整 CRM、ERP、排班、计费、人事或市场化机构后台。
- 教师、儿童、家庭、班级或机构排名。
- 家庭 AI 私密对话、未发送草稿或私密正文的机构汇总。
- My-Chat Web/native shell、admin runtime、账号、通知和商店分发。

## Dependencies and Gates

- T-004 公共 surface、visibility 和 aggregate contract。
- T-005 family-care communication 与 owner-reread。
- T-006 care facts、publication 和 role projections。
- T-002 institution/group/enrollment/grant、opaque identity binding 与 qualification gates。
- T-003 机构 surface 仅为框架级输入，未决定内容不得被实现者默认为产品承诺。

## Acceptance Criteria

- [ ] mobile board 为 read-only，且只显示 policy-approved aggregate 与支持信号。
- [ ] mobile board 可查看当前 actor-safe Workflow 关键内容、阶段、里程碑、阻塞和
  下一步，但不暴露 raw Run/Step 或提供隐藏写操作。
- [ ] Web workbench 的 roster/invite/confirmation/grant 操作均有明确 authority、状态和审计。
- [ ] Web 与 mobile 消费同一 `InstitutionWorkflow` 事实与 versioned projection；
  Web 是主要操作面，mobile 不复制或拥有 Workflow。
- [ ] aggregate 无法反推出家庭私密正文或未授权 child-level facts。
- [ ] 产品中不存在教师/孩子/家庭的排名、评分或诊断性结论。
- [ ] institution presenter 可被 My-Chat 消费且不暴露内部 persistence。
- [ ] 所有仍开放的产品问题有 owner、决策门和默认安全行为。

## Next Step

先以 T-002 institution/grant contract、Workflow 产品语义契约和 T-004 visibility
matrix 为准，形成 `InstitutionWorkflowProjection` 字段/角色矩阵与聚合隐私阈值提案。
