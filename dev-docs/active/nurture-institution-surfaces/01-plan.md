# Plan — 机构端双 Surface

## Phase 0 — Product Questions and Data Inventory

- 盘点 T-002 institution/group/enrollment/grant 的实际能力。
- 将 T-003 机构端框架拆成“已决定 / 待共创 / 明确不做”。
- 为每个 aggregate 和 workbench action 指定数据来源与授权规则。
- 盘点当前园区管理过程，固定 `InstitutionWorkflow` 类型、阶段、owner role 与
  mobile/Web projection 深度。

## Phase 1 — Institution Policy and Aggregates

- 定义 institution steward/operator、group、child scope 和 grant policy。
- 建立不含家庭私密正文的 aggregate model。
- 设定小样本、撤权、纠正与删除情况下的隐私安全行为。

## Phase 2 — Mobile Read-only Board

- 提供机构概览、family flow、理念到日常工作和 support signals 的 presenter。
- 提供只读 `InstitutionWorkflowProjection`：安全摘要、当前阶段、关键里程碑、
  blocker、下一步和责任角色。
- 实现加载、空态、数据不足、权限不足和过期状态。
- 保证不存在编辑事实的移动端 command。

## Phase 3 — Web Workbench

- 提供最小 roster/invite、parent confirmation 和 grant lifecycle。
- 提供需机构处理的 `InstitutionWorkflow` queue、detail、steps、forms 与审计结果。
- 所有跨 child/family 作用域操作要求显式 authority 与幂等。

## Phase 4 — Privacy and Black-box Qualification

- 验证 aggregate 不泄漏家庭正文或单个孩子敏感事实。
- 验证撤销 grant、错误机构、错误 group 和并发操作。
- 验证同一 Workflow 在 mobile/Web 的 projection version、状态与里程碑一致，
  同角色仍需通过 Workspace/scope/assignment/visibility。
- 跑 guardian/caregiver 事实 → institution aggregate/workbench 的完整旅程。

## Exit Gate

两个 institution presenter 与最小 commands 可由 My-Chat consumer 使用；未决产品问题不得被隐式实现，应用壳与分发留在 My-Chat companion。
