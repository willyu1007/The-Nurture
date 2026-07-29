# Implementation Notes — 机构端双 Surface

## 2026-07-29 — Task package created

- 创建 T-007 规划包。
- 将 institution mobile read-only board 与 Web workbench 作为一个机构权限/聚合领域任务。
- 明确 T-003 对机构端仍是框架级设计，未决细节通过 decision log 处理。
- 当前无代码、schema、aggregate 或 presenter 变更。

## 2026-07-29 — InstitutionWorkflow and board projection semantics locked

- 当前产品 Workflow 收敛为园区管理 `InstitutionWorkflow`。
- Institution Web workbench 是主要操作面；Institution mobile board 只读投影
  Workflow 关键内容、阶段、里程碑、阻塞和下一步。
- 同角色可获得更完整 projection，但不替代 Workspace/scope/assignment/visibility。
- family-care ActionExecution、ActionDelivery 与 caregiver PublishProcess 明确排除在
  Workflow 之外。
- 当前仅更新规划文档，无代码、schema、aggregate、runtime 或 presenter 变更。

## Open Items

- aggregate 的隐私阈值与时间窗口。
- parent confirmation 与 grant 生效的精确先后状态。
- workbench 首轮是否只支持单条操作。
- 支持信号如何避免变成隐性排名。
- 首批 `InstitutionWorkflow` 类型及 `InstitutionWorkflowProjection` 的精确 schema。
