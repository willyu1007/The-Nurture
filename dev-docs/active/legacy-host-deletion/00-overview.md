# Overview — Legacy Host Deletion

## Status

- State: in-progress
- Task: T-014
- Milestone / Feature: M-002 / F-003
- Updated: 2026-08-17
- Next step: 收尾——等 forgery 清理会话（P0 handlers 标准事件剥离）落地
  后归档本任务。四波全部完成；`apps/backend` 已于 2026-08-17 删除，
  T-012 删除闸三条件销项记录在 `04-verification.md`。

## Goal

满足 T-012 归档记录（`dev-docs/archive/legacy-host-retirement/00-overview.md`）
中的删除闸三条件，删除 `apps/backend`（legacy Fastify workflow harness）：

1. 它独家测试的每条旅程有等价的 owner-boundary 覆盖；
2. CI/bootstrap 不再依赖它的 package、Prisma client 或数据库；
3. 删除后 persistence 与 port topology gate 通过。

## Non-goals

- 不新建任何替代性的假宿主（dev host 2.0）。删除闸要求的是 owner-boundary
  等价覆盖，任何本仓库自建宿主在定义上都不满足。
- 不激活任何 default-off 能力；user-attention / growth-record 路由搬迁保持
  fail-closed（无 token 503）语义原样。
- 不接管 `apps/frontend`：workbench UI 归 T-013
  （nurture-institution-workbench-ui）演进；本任务只在 Wave 4 与其协调
  移除 legacy-host 指向（`NURTURE_BACKEND_URL`/3200 代理与项目页 fixtures）。

## 审计基线

`apps/backend/tests/` 11 个 e2e 文件、27 个用例的逐文件归类见
`02-architecture.md`。核心结论：

- 2 个文件（4 用例）测 harness 自身，随删除消失；
- 小半用例是 Nurture 拥有的语义，下沉到 packages 层（Wave 1）;
- 2 个文件（9 用例）是**活的 owner 契约路由**（user-attention、
  growth-record contribution），需先迁入 scenario-service（Wave 2）；
- 4 条 host-runtime 旅程需要 x5-joint 风格的等价覆盖（Wave 3，关键路径）。
