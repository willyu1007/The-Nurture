# Implementation Notes

## 2026-08-17 — 任务建立

- 完成 `apps/backend/tests` 11 文件 / 27 用例逐文件审计（见 `02-architecture.md`）。
- 关键发现：harness 仍承载两组活的 owner 契约路由（user-attention、
  growth-record contribution）；My-Chat 消费端按 baseUrl+路径寻址，搬迁为
  拓扑变更。
- Wave 4 原「frontend 何去何从」决策点被 T-013（institution workbench UI）
  取代：frontend 不退役，改为协调交接 legacy-host 指向。

## 2026-08-17 — Wave 1 完成

- 三项计划目标动手前发现已有等价覆盖（明细见 `01-plan.md` Wave 1 结果），
  只新增了真实缺口：db 层 owner-boundary 测试一个文件（4 用例）+
  calibrate 跨 issue_type 同构用例 + census 60→61。
- 流程发现：`.githooks/pre-commit` 在 dev-docs 变更时自动跑 governance
  sync 并**自动暂存** hub 文件（registry/dashboard/task-index/缺失的
  `.ai-task.yaml`）。开任务包的提交因此带入了并行会话 T-013 的 hub 元数据
  行——这是 hook 设计行为，T-013 的实质工作（bundle 正文、frontend 改动）
  未被卷入。后续提交预期同样会发生 hub 自动同步。
