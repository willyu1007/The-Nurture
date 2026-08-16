# Implementation Notes

## 2026-08-17 — 任务建立

- 完成 `apps/backend/tests` 11 文件 / 27 用例逐文件审计（见 `02-architecture.md`）。
- 关键发现：harness 仍承载两组活的 owner 契约路由（user-attention、
  growth-record contribution）；My-Chat 消费端按 baseUrl+路径寻址，搬迁为
  拓扑变更。
- Wave 4 原「frontend 何去何从」决策点被 T-013（institution workbench UI）
  取代：frontend 不退役，改为协调交接 legacy-host 指向。
