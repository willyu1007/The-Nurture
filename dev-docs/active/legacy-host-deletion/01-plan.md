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

### Wave 2 结果（2026-08-17，完成）

- 两组路由以既有惯用法迁入 scenario-service：
  `user-attention-owner.controller.ts`（guard + controller，逻辑复用
  `NurtureUserAttentionService`）与
  `growth-record-contribution.controller.ts`（resolver 整体平移，含
  ≥16 字符 token 的独立判定）。错误体逐字保持；`SafeExceptionFilter`
  allowlist 补入六个错误码，两个 `*_disabled` 码加入 unhandled 日志豁免。
- 测试平移：`user-attention-owner-controller.e2e.test.ts`（plain lane，
  stub service）+ `growth-record-contribution.db.e2e.test.ts`（db lane，
  真库）；security-boundary 的 404 断言翻转为 fail-closed 503 正向覆盖。
- harness 侧：两组路由、`growth-record-contribution.ts`、两个 e2e 文件
  删除；`NurtureApp` 去掉 owner 成员；`buildServer` 的 token 参数保留为
  ING-D4 证据（带下划线注明故意未用）。
- **x5 joint 升级**：`x5-joint-acceptance` 原来把 harness 当 HTTP 壳，
  现改为 boot scenario-service 真实 Nest ingress——My-Chat 的
  `createNurtureUserAttentionHttpSource` 打到正式服务，joint 全绿
  （5 文件 / 37 用例）。
- smoke 确定性修复：子进程 env 钉 `DATABASE_URL: ""`，新增两条 503
  fail-closed 断言；parent-communication 断言从 CI 专属的深层
  `service_unavailable` 分支改为确定性的
  `parent_communication_owner_disabled`。
- 顺带修复：T-013 的「frontend 脱离 legacy host」提交让
  `verify:port-topology` 变红（frontend 不再含 `NURTURE_BACKEND_URL`），
  守卫改为断言 frontend **不得**再引用退休宿主端口——本属 Wave 4 的
  守卫反转提前落了一小块；T-013 同时完成了原 Wave 4 第 8 项。
- census/floor：legacyHost 11→9 文件、scenarioService 30→32、
  `verify:legacy-host-population` 25→18；root package.json 变更需要
  c30-i3 owner-adoption 锁在提交头重封（同批后续提交）。

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

### Wave 3 结果（2026-08-17，完成；范围据实修订）

动手后发现「四条旅程整体 joint 化」被真宿主两项能力现状挡住，改为**用
joint 测试把真相钉死**（`t014-host-runtime-joint.integration.test.ts`，
3 用例，真 My-Chat kernel：真 schema + PrismaWorkflowRuntimePort +
WorkflowWorker + 真 run-binding verifier + 真 host validator 注册）：

1. **审批暂停**：request_approval 在真 kernel 上停为
   `manual_review_required`、run 保持 running、真 outbox 落
   `workflow.step.manual_review_required`（approval-pause 腿等价达成；
   见下述伪造缺陷的双重原因说明）。
2. **标准事件伪造钉**：真 kernel 以
   `workflow_handoff_standard_event_forgery` 拒绝场景 handler 起草的
   标准 `workflow.*` 事件——P0 handlers 的 eventDraft 是 harness 宽松端
   口纵容的越权行为。已开后续任务：剥离标准事件草稿后，(1) 将原样暂停、
   write_artifact 将干净完成。
3. **物化缺口钉**：calibrate 步骤在真 kernel 上 fail-close 为
   `workflow_step_materialization_requires_future_kernel`，同时 Nurture
   业务写（strategy payloads）落在真 nurture 库——双库都是真的。
   thin-vertical / first-slice 的产物腿**不可能**在今天的真宿主上等价
   复现：这不是覆盖缺口，是宿主 kernel 的能力缺口，删除闸条件一在这些
   腿上转化为对 My-Chat future kernel 的显式外部依赖。
4. 安全闸停机旅程不单独建 joint 用例：其 kernel 映射语义与 (1)(3) 同路
   （handler 分类已有单测层覆盖；其产物草稿同样触发物化缺陷）。

x5 lane 全绿 6 文件 / 40 用例；census x5Joint 5→6（files 213）。

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
