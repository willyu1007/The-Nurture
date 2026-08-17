# Implementation Notes

## 2026-08-17 — Wave 3 后续完成：P0 handlers 标准事件草稿剥离

- `p0-handlers.ts` 移除全部标准 `workflow.*` eventDraft（九类：
  step.completed / step.retry_requested / step.manual_review_required /
  approval.requested / artifact.created / context.bound /
  context.rebind_required / evidence.recorded / handoff.requested）；
  场景内部 `nurture.*` 草稿原样保留（三类，与 manifest
  scenario_internal_events 一致）。`manualReview` helper 不再替宿主起草
  review 事件。manifest 无需变更（标准事件 producer 本就声明为
  workflow_ledger）。
- t014 joint 两钉翻转为干净行为：request_approval 原样暂停
  （`manual_review_required` + step.reasonCode null——该列只承载 kernel
  缺陷码；kernel 自发 `workflow.step.manual_review_required`）；
  write_artifact 干净完成（`succeeded` + kernel 自发
  `workflow.step.completed`，无 review 事件）。钉 3（物化缺口）不动。
- `handlers.test.ts` 以 hasStandardDraft 反向断言取代被删事件断言，
  并为安全闸升级路径补「scenario-internal 事件单独出行」钉。
- 边界发现：真 kernel preflight 在伪造检查之后还会以
  `workflow_handoff_event_draft_not_supported` 拒绝任何非空事件草稿
  （X3 不物化场景事件草稿）——`nurture.*` 草稿与产物草稿同属钉 3 的
  future-kernel 物化缺口，保留草稿等待 kernel 能力，不属伪造类。
- 时序协调：与 Wave 4 执行会话确认后，本批排在 teardown（5b23d98）之后
  落；任务原定的「harness 端口 kernel 侧发射 + legacy-host e2e 对齐」
  半边随 lane 删除而取消（thin-vertical / first-slice 的
  context.bound / artifact.created / handoff.requested 断言随 e2e 文件
  一并退场，无需逐事件裁决）。
- 验证（teardown 头之上复跑）：`pnpm test:unit` 105 文件 / 1146 绿；
  `pnpm test:x5` 6 文件 / 40 绿（本地双库配方见 Wave 2 记录）；根
  `pnpm typecheck` 绿。root package.json 未动，无需 c30 重封。

## 2026-08-17 — Wave 3 完成（范围据实修订）

- 新 joint 文件 `t014-host-runtime-joint.integration.test.ts` 用真
  My-Chat kernel 钉了三件真相（明细见 `01-plan.md` Wave 3 结果）。两个
  发现改变了 Wave 4 的判断基础：
  1. **真 kernel 尚无步骤物化**（artifact_drafts / context_bindings →
     `workflow_step_materialization_requires_future_kernel` fail-close）。
     legacy 旅程的产物腿在任何真 owner 路径上都跑不起来——harness 在这些
     腿上的「独家价值」是在模拟一个宿主还不存在的能力。
  2. **P0 handlers 起草标准 workflow.\* 事件在真 kernel 是伪造**
     （`workflow_handoff_standard_event_forgery`）。已开独立后续任务
     （chip：Strip standard-event forgery from Nurture P0 handlers）。
- Wave 4 的删除判断由此变为：条件一对产物腿的「等价覆盖」应解释为
  「缺口已被 joint 测试显式钉住 + 业务语义已有 unit/db 覆盖」，还是
  「等 My-Chat future kernel 落地后重建旅程」。前者今天即可删 harness，
  后者退役时点外部依赖化。建议 Wave 4 开工前由任务负责人拍板。
- 本波未动 package.json / c30 哈希输入，无需重封锁。

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
