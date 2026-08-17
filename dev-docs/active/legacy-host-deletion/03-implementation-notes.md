# Implementation Notes

## 2026-08-17 — 任务建立

- 完成 `apps/backend/tests` 11 文件 / 27 用例逐文件审计（见 `02-architecture.md`）。
- 关键发现：harness 仍承载两组活的 owner 契约路由（user-attention、
  growth-record contribution）；My-Chat 消费端按 baseUrl+路径寻址，搬迁为
  拓扑变更。
- Wave 4 原「frontend 何去何从」决策点被 T-013（institution workbench UI）
  取代：frontend 不退役，改为协调交接 legacy-host 指向。

## 2026-08-17 — Wave 2 完成

- 两组 owner 路由迁入 scenario-service，harness 对应面删除；明细见
  `01-plan.md` Wave 2 结果。x5 joint 验收改打 scenario-service 真实
  ingress，是删除闸条件一在 user-attention 面上的实质达成。
- 本地 x5 配方（此前只有 CI 侧记忆）：nurture_x5 建在 docker
  postgres:16-alpine（5433）；my_chat_x5 必须建在原生 Homebrew
  PostgreSQL 17.7（5432）——My-Chat 的 knowledge-rag 迁移需要 pgvector，
  alpine 容器装不了。`X5_NURTURE_DATABASE_URL` / `X5_MY_CHAT_DATABASE_URL`
  直接传给 `pnpm test:x5`（该 lane 不走 run-with-local-env）。
- 并行会话联动：T-013 在本波期间落地「frontend 脱离 legacy host」
  （d79b4b6），等于提前完成了本任务 Wave 4 第 8 项；其提交使
  `verify:port-topology` 变红，本批顺带把该守卫的 frontend 断言反转为
  「不得引用退休宿主端口」。
- My-Chat 侧的 r4-growth-record qualification lock 钉的是历史 revision，
  属既往资格记录；未来若对 scenario-service 版 resolver 重新资格认证，
  应是 My-Chat 侧的 r5 批次，不阻塞本次搬迁。

## 2026-08-17 — Wave 1 完成

- 三项计划目标动手前发现已有等价覆盖（明细见 `01-plan.md` Wave 1 结果），
  只新增了真实缺口：db 层 owner-boundary 测试一个文件（4 用例）+
  calibrate 跨 issue_type 同构用例 + census 60→61。
- 流程发现：`.githooks/pre-commit` 在 dev-docs 变更时自动跑 governance
  sync 并**自动暂存** hub 文件（registry/dashboard/task-index/缺失的
  `.ai-task.yaml`）。开任务包的提交因此带入了并行会话 T-013 的 hub 元数据
  行——这是 hook 设计行为，T-013 的实质工作（bundle 正文、frontend 改动）
  未被卷入。后续提交预期同样会发生 hub 自动同步。
