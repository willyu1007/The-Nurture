# Plan — 儿童照护双看板

## Phase 0 — Fact and Projection Inventory

- 盘点 T-002 中 focus、attention、daily care、media 和 publication 相关事实。
- 将 T-003 两个 board surface 的模块映射到共享事实与角色投影。
- 列出缺失字段、权限来源和待解锁 gate。

## Phase 1 — Shared Care Read Model

- 建立 child-scope-first 的 care timeline / current focus / daily care 查询。
- 分别定义 guardian 与 caregiver presenter。
- 对与当前角色相关的园区管理请求/结果，消费最小
  `InstitutionWorkflowProjection`；不读取 raw Run/Step 或园区内部备注。
- 固定空态、过期、撤回、更正和权限不足状态。

验收：

- 同一事实的两种投影保持一致 provenance。
- 任意 aggregate 均不能绕过 row/fact-level policy。

## Phase 2 — Caregiver Capture and Work Queue

- 定义快速记录、photo/media attribution、attention 和待办/待确认项目。
- 支持草稿保存和后续继续，不把草稿直接发布给家庭。
- AI provider 仅输出结构化建议，不直接提交。

## Phase 3 — Two-stage Publish

- 以 `PublishProcess` 实现 draft → review → publish / reject / correct；不创建
  `InstitutionWorkflow`。
- 在发布事务中重新读取 authority 并产生 receipt。
- 将已发布事实投影到 guardian board 和必要的 conversation item。

## Phase 4 — Qualification

- 跑同一孩子的 caregiver capture → review → family board receipt 旅程。
- 验证错误 child scope、撤销 grant、并发发布、重复提交和媒体归属。
- 验证没有 ranking、诊断或私域泄漏。

## Exit Gate

双看板黑盒旅程通过；宿主相机、原生列表性能和设备交互留给 My-Chat companion。
