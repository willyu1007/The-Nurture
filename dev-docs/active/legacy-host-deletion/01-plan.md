# Plan — 四波实施

依赖关系：Wave 1、2、3 相互独立可并行；Wave 4 依赖前三波全部完成。
每波独立成批提交（`Task: T-014`），批后按仓库惯例 reseal 跨仓 pin。

## Wave 1 — 场景语义下沉（S，无跨仓依赖）

新增测试全部落在既有 lane（`test:unit` / `test:db`），不改产品代码。

1. nurture-db 集成测试（进 `test:db`，命名 `*.integration.test.ts`）：
   - `WorkflowProjectRepository.findById` workspace 隔离：本 workspace 命中、
     他 workspace null（对应 p4-audit-fixes）。
   - 时间线三表：capture / checkpoint / review 各 create 一条后按项目读回
     （对应 two-issue-types 后半）。
   - 画像投影应用：投影 upsert 后 `projectionVersion >= 1`、按
     family ref 可读回（对应 first-slice 的投影断言）。
2. packages/nurture-scenario 单测（进 `test:unit`）：
   - `presenters.test.ts` 补 artifact_preview L4 用例：
     `unavailable_reason === "exposure_level_restricted"` 且 safe 字段缺失
     （对应 p3-audit-fixes ②）。
   - manifest 路由收敛不变量：四个共享消费者的 `allowed_events` 不含、
     `forbidden_events` 必含 `nurture.health_state.safety_escalated`
     （对应 safety-escalation ③；落点 `conformance.test.ts`）。
   - handler 流程同构：`calibrate_family_strategy` handler 对
     bedtime / screen 两种 issue_type 产出同构结果（对应 two-issue-types 前半）。

验收：`pnpm test:unit`、`pnpm test:db` 全绿；新增用例与上表一一对应。

### Wave 1 结果（2026-08-17，完成）

动手前核对发现三项计划目标**已有等价覆盖**，无需新增：

- p3-② 产物预览 L4 门控：`presenters.test.ts`「ref-only for a never-exposable
  L0/L4 artifact」（比 harness 版更强，L0/L4 双档 + safe_* 全缺失断言）。
- safety-escalation-③ 路由收敛不变量：`conformance.test.ts`「keeps the
  health-safety escalation event off every shared consumer」（还多断言了
  scenario_internal_events 声明）。
- first-slice 投影自动应用（handler 层）：`handlers.test.ts`「record_review
  auto-applies the profile projection (version+1)」。

实际新增：

- `packages/nurture-db/tests/workflow-project-owner-boundary.integration.test.ts`
  （4 用例）：`PrismaWorkflowProjectRepository.getById` / `getByWorkflowRunId`
  workspace 隔离（p4）、时间线三仓持久化（two-issue-types 后半）、
  `PrismaProfileRepository` upsert/读回/原位版本推进（first-slice DB 层）。
- `handlers.test.ts` calibrate_family_strategy 补 it.each 跨 issue_type 同构
  （two-issue-types 前半，镜像 care_plan 既有模式）。
- `assert-test-routing.mjs` census：productionDb 60→61。

## Wave 2 — 两组 owner 路由搬入 scenario-service（M）

3. `growth-record-contribution`：模块整体迁入 scenario-service，路径
   `/internal/nurture/growth-record/contribution/resolve` 不变；5 个用例
   平移为 scenario-service e2e。动手前复核 My-Chat 侧无既有消费者指向
   harness 端口。
4. user-attention resolve/acknowledge：路由壳迁入 scenario-service
   （逻辑已在 packages）；4 个用例平移；`security-boundary.e2e.test.ts`
   中该路径的 404 断言翻转为正向覆盖。无 token 503 fail-closed 保持原样。
5. 同步 `docs/context/workflow/nurture-scenario-contract.md` 中
   「user_attention 路由不在 scenario-service 运行」的表述；批后 reseal pins。

验收：scenario-service e2e 全绿；harness 中对应路由与测试删除；
`verify:legacy-host-population` 下限同步下调。

## Wave 3 — host runtime 语义的 joint 等价（L，关键路径）

6. 在 `test:x5` joint 通道为四条独家旅程建立等价覆盖（真 My-Chat runtime
   组合 Nurture 模块，不用 harness 的私有 dispatcher / 六表 schema）：
   - thin-vertical 全链（start→步骤推进→artifact+outbox）；
   - 审批闸暂停 / approve 恢复 / cancel 撤销已批准 approval；
   - 安全闸停机 + 场景内部事件不出场景；
   - family_rule_trial 三段式验收旅程（含 retry_exhausted 停机语义）。
7. 明确不选备选方案「等 I3 联合验收自然覆盖」——I3 被 G-09 卡住，时间
   不可控。

验收：`pnpm test:x5` 全绿；02-architecture 审计表中每个 Wave 3 条目
对应至少一个 joint 用例。

## Wave 4 — 拆除（M，机械但面广）

8. 与 T-013 协调 `apps/frontend` 的 legacy-host 指向移除（api.ts /
   next.config rewrites / 列表页提示）。
9. 删除 `apps/backend`、`apps/backend/prisma`、`vitest.legacy-host.config.ts`；
   清 package.json `legacy-host:*` / `test:legacy-host*` /
   `verify:legacy-host-population`；从 `db:generate:all`（`typecheck` 依赖）
   摘除 legacy 分支。
10. CI：删 `legacy-host-db` job 与 `legacy-host:db:validate` 步骤。
11. 守卫脚本反转：`assert-test-routing` / `assert-persistence-boundaries` /
    `assert-port-topology` 改为断言 legacy 通道不存在；删
    `assert-legacy-host-db-boundary.mjs`；清 `DEV_HOST_*` env 约定。
12. 跑 README Verify 全清单收尾；对照删除闸三条件逐条销项；归档本任务。

验收：删除后全量 gate 绿；T-012 删除闸三条件全部满足并记录于
`04-verification.md`。

## 风险

- Wave 3 是工期主体（3–5 天），joint 组合真 runtime 的搭建成本最高。
- Wave 2 搬迁虽为拓扑变更，仍需跨仓 reseal 纪律（见 memory：
  cross-repo pin reseal）。
- 并行会话（T-013 正在改 `apps/frontend`；registry.yaml 有其未提交行）：
  提交必须 path-scoped，见 02-architecture 文件所有权。
