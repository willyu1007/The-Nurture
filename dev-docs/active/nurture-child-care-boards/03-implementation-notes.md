# Implementation Notes — 儿童照护双看板

## 2026-07-29 — Task package created

- 创建 T-006 规划包。
- 将 Guardian family board 与 Caregiver teacher board 归为“同一事实、不同投影”的一个任务。
- 锁定 two-stage publish、AI 人工确认和 anti-ranking 边界。
- 当前无代码、schema 或 presenter 变更。

## 2026-07-29 — Workflow terminology and projection boundary aligned

- two-stage publish 统一命名为 `PublishProcess`，不属于当前园区管理 Workflow。
- Guardian/Caregiver board 可以消费与当前角色相关的
  `InstitutionWorkflowProjection` 外部切片，但不拥有 Workflow Run/Step。
- “相同角色”不是充分权限；projection 仍由 Workspace/scope/visibility policy 过滤。
- 当前仅更新规划文档，无代码、schema 或 presenter 变更。

## Open Items

- 现有 T-002 read model 是否足以支持两个 presenter，还是需要局部 projection。
- daily care 与 attention 在产品上合并展示、领域上分开存储的契约方式。
- media upload ready / failed / removed 状态由哪一侧提供 canonical status。
- T-007 `InstitutionWorkflowProjection` 与 T-006 board external-slice 的最小共享 schema。
