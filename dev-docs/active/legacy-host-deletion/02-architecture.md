# Architecture — 审计与边界

## 逐文件审计（apps/backend/tests，11 文件 / 27 用例）

| # | 文件（用例数） | 测的是什么 | 语义归属 | 退役处置 |
|---|---|---|---|---|
| 1 | dev-host-guard (3) | harness 启动锁（loopback / APP_ENV / 端口） | harness 自身 | 陪葬 |
| 2 | single-owner-ingress (1) | harness 必须不提供 binding-owner 路由（ING-D4 反向断言） | harness 自身 | 陪葬；正向覆盖已在 scenario-service（binding-owner-controller、security-boundary） |
| 3 | p4-audit-fixes (1) | 项目详情 workspace 隔离（UUID 不跨 workspace 泄露） | Nurture：`WorkflowProjectRepository`（nurture-db） | Wave 1 下沉 nurture-db 集成测试 |
| 4 | p3-audit-fixes (3) | ① retry_exhausted 停机不悬挂 ② 产物预览 L4 曝光门控 ③ cancel 撤销已批准 approval | ①③ harness 私有 dispatcher/ActionService → host 语义；② presenter=Nurture | ② Wave 1 下沉 presenter 单测；①③ Wave 3 joint |
| 5 | safety-escalation (3) | 诊断意图材料在安全闸停机 + 场景内部事件 + 路由收敛不变量 | 不变量=纯 manifest；停机=handler+host | 不变量 Wave 1 下沉 manifest 单测；停机 Wave 3 joint |
| 6 | two-issue-types (2) | 两种 issue_type 走同一流程 + 时间线三表持久化 | 流程同构=handler/manifest；时间线=nurture-db | 时间线 Wave 1 下沉；同构性 Wave 1 handler 单测；HTTP 外壳陪葬 |
| 7 | approval-pause-resume (2) | 审批闸暂停 / approve 恢复至完成；无 pending 409 | host runtime（approval 账本 + dispatcher） | Wave 3 joint |
| 8 | thin-vertical (2) | start→seed→dispatch→claim/complete→artifact+outbox 全链 | host runtime + Nurture handlers | Wave 3 joint |
| 9 | family-rule-trial-first-slice (1) | 三段 run 验收旅程 + 画像投影更新 + handoff 事件 | 混合：投影/handoff 草稿=Nurture；run 推进=host | 投影 Wave 1 下沉；旅程整体 Wave 3 joint |
| 10 | user-attention-owner-auth (4) | resolve/acknowledge 路由 503/401/400/200 围栏 | 活的 owner 契约路由（逻辑在 `packages/nurture-scenario/src/institution-surfaces.ts`，harness 只是 HTTP 壳） | Wave 2 搬入 scenario-service |
| 11 | growth-record-contribution (5) | contribution resolver 围栏 + display-safe 字段白名单 | 活的 owner 契约路由（`apps/backend/src/growth-record-contribution.ts` 自包含，仅依赖 NurturePrismaClient） | Wave 2 搬入 scenario-service |

## 关键边界事实（已验证）

- My-Chat 消费端 `../My-Chat/packages/scenario-integrations/src/nurture-user-attention.ts`
  用**可配置 baseUrl + 固定路径**寻址 user-attention 两条路由。路径不变、
  baseUrl 改指 scenario-service 即可；搬迁是部署拓扑变更，不是契约变更。
- growth-record contribution 路径在 My-Chat apps/packages 中 grep 无消费者
  （pre-adoption）；Wave 2 动手前需复核。
- scenario-service `security-boundary.e2e.test.ts` 断言
  `/internal/nurture/activation/user-attention/resolve` 与 `/api/workflow/runs`
  在该服务 404 —— Wave 2 搬迁 user-attention 时该断言同步翻转为正向覆盖；
  `/api/workflow/runs` 的 404 断言保留（host 路由永不进 scenario-service）。
- host-runtime 语义的落点是既有 `test:x5` joint 通道
  （`vitest.x5.config.ts`：真 `@my-chat/db`/`@my-chat/domain` + 一次性数据库、
  serializable 事务、fileParallelism: false）。
- CI/bootstrap 依赖面：`.github/workflows/ci.yml` 的 `legacy-host-db` job
  （~:401）与另一处 `legacy-host:db:validate`（~:268）；package.json 的
  `legacy-host:*` / `test:legacy-host*` / `verify:legacy-host-population`；
  `db:generate:all`（`typecheck` 依赖它）包含 `legacy-host:db:generate`；
  `vitest.legacy-host.config.ts`；`assert-test-routing` /
  `assert-persistence-boundaries` / `assert-port-topology` /
  `assert-legacy-host-db-boundary` 四个守卫脚本；`DEV_HOST_*` env 约定。
- population gate 是**下限**（assert-vitest-population：total >= minimum 且全绿），
  legacy-host 通道当前钉 25（实际 27）；Wave 1/2 增加 unit/db/scenario-service
  用例不会触碰任何上限。
- `apps/frontend` 正由 T-013 演进为真 institution_workbench；其对 harness 的
  依赖（`src/lib/api.ts` 的 `NURTURE_BACKEND_URL`→3200、next.config rewrites、
  项目列表页「请运行 pnpm dev:legacy-host」提示）在 Wave 4 与 T-013 协调处理，
  本任务不单方面改动 `apps/frontend`。

## 文件所有权（并行会话协调）

T-014 触碰：`packages/nurture-db/tests`、`packages/nurture-scenario/tests`、
（Wave 2 起）`apps/scenario-service`、（Wave 4）`apps/backend` 删除与根配置。
不触碰：`apps/frontend`（T-013）、`docs/context` 面向契约的正文（除 Wave 2
的 user-attention 承载位置表述）。
