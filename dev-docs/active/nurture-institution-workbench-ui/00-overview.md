# Overview — Institution Web workbench 首个垂直切片

## Status

- State: in-progress
- **Updated:** 2026-08-17
- **Feature:** F-003（六表面 store-beta readiness）
- **Owner:** willyu1007
- Next step: 按 `01-plan.md` 的 P1 改造 `apps/frontend` shell 与路由。

## Goal

把 `web_domain_workbench`（当前唯一实例 surface `institution_workbench`）从「契约齐全、零前端」
推进到「一条可操作的垂直流跑得起来」。

本任务只做 `institution_workflow_queue` 一个 contentKind 的
Hub → Queue → Record → 强确认闭环，不铺开做 8 个模块。

## 为什么是这条流

`institution_workbench` 的 8 个 contentKind 里，能力契约的分布极不均匀：

| contentKind | 绑定的 capability 数 |
| --- | --- |
| `institution_workflow_queue` | 20 |
| `knowledge_management` | 7 |
| `communication_review` | 1（只读） |
| `hub` / `insight` / `people_operations` / `daily_operations` / `grant_request_management` | 0 |

`institution_workflow_queue` 是唯一契约完整、无需发明字段的模块（Enrollment Journey 的阶段、
`nextReviewAt`、`trialEndsAt`、`reviewAt <= trialEndsAt` 都是既有硬字段）。同时它一次覆盖
kit 六范式里从未用过的 Hub 与 Queue，以及 8 个 `strong_confirmation` 动作里的大部分。

## Scope

- 改造 `apps/frontend` 为 `institution_workbench` 宿主（route namespace `/nurture`，owner `the-nurture`）。
- 删除 `/nurture/projects/*` 三个 legacy-host dev console 页面及其客户端。
- Shell：8 模块导航 + 显式 active role 绑定与切换。
- 三个界面：Hub（最小版，只聚合本队列）、Queue、Record。
- 强确认组件：Drawer 与全屏两种形态，共用一套 props 契约。
- Fixtures 层：形状对齐 `query_institution_enrollment_journey` 的 result schema。

## Non-goals

- 不做另外 7 个 contentKind。
- 不挂后端 controller、不改 `scenario.manifest.yaml`、不动 `enablement_policy`。后端 ingress 是独立任务。
- 不改 `packages/nurture-scenario`、不触发跨仓 reseal。
- 不做真实认证；active role 在本切片内是 fixture 驱动的展示与路由状态。

## Locked design decisions（2026-08-17，用户确认）

| # | 决策 | 内容 |
| --- | --- | --- |
| A | 宿主 | 改造复用 `apps/frontend`，删掉原有 3 个 projects 页面 |
| B | 角色 | active role 在 shell 中画出来；切换即重载到该角色首页，无二次确认 |
| 1 | 方向 | Queue 按阻塞归属分组 + 时限做行内标签 + Record 用高密度 4-tab |
| 2 | 强确认 | Drawer 为默认；`end_trial` / `close_enrollment` / `revoke_child_link_grant` 升级全屏 |
| 3 | 角色切换 | 无二次确认（切换本身无副作用） |
| 4 | 候补名次 | 队列中保留显示；排的是候补顺序，不是给孩子评分，与 Anti-Metrics 无冲突 |

设计基准（非仓库资产）：`~/Desktop/nurture-workbench-mocks/spec-merged.html`，
另有 A/B/C 三个原始方向与 `index.html` 对比页。

## Acceptance criteria

- [ ] `apps/frontend` 不再引用 legacy host；`lib/api.ts` / `lib/adapters.ts` 已移除或替换。
- [ ] Shell 呈现 8 模块导航与 active role 芯片，切换行为符合决策 3。
- [ ] Hub / Queue / Record 三个路由可访问，数据来自 fixtures。
- [ ] 强确认组件两形态共用一套 props 契约，三个不可逆动作走全屏。
- [ ] 时限语义色映射只有一个来源。
- [ ] `pnpm --filter @the-nurture/frontend lint` 与 `typecheck` 通过。

## Key links

- 设计基准：`~/Desktop/nurture-workbench-mocks/spec-merged.html`
- Surface 契约：`packages/nurture-scenario/contracts/surfaces/v1/source/surfaces/surface-registry.json`
- 能力契约：`packages/nurture-scenario/contracts/surfaces/v1/source/capabilities/capability-registry.json`
- 产品语义：`docs/context/product/workflow-product-design-contract.md`
- 术语：`docs/context/glossary.json`（`web_domain_workbench` / `web_run_workbench`）
- Enrollment Journey 阶段与规则：`dev-docs/active/nurture-institution-mode/09-pilot-readiness.md`（B3-1c）
