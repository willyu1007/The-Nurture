# Overview — Institution Web workbench 首个垂直切片

## Status

- State: in-progress
- **Updated:** 2026-08-17
- **Feature:** F-003（六表面 store-beta readiness）
- **Owner:** willyu1007
- P1–P7 全部完成，垂直切片可运行（fixtures 驱动）。
- Next step: 后端 ingress 是独立任务；接入后把 `lib/queries` 的实现换掉，
  并按 `03-implementation-notes.md` 的 P3 记录处理三个契约缺口。

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
| 5 | 模块命名 | `institution_workflow_queue` 在界面里叫「入园流程」。不用「流程队列」（机制词，UX 契约禁开发向词汇）；不用「入园申请」（园长发起、家庭同意，「申请」会反转施动方） |
| 6 | 侧栏信息架构 | 概览即 `home`，无独立 nav 项；其余按工作性质分「园区管理」「资料与洞察」两组，不按实现进度或使用频率 |

决策 5、6 由用户看实际界面后提出，详见 `02-architecture.md` 的侧栏一节。

设计基准（非仓库资产）：`~/Desktop/nurture-workbench-mocks/`——
Track C 的三个模块 mock 与 `index.html`。第一轮的 A/B/C 方向稿与 `spec-merged.html`
已随目录一次误删丢失，未重建（对应设计已实现完毕，参考价值已消）。

## Acceptance criteria

- [x] `apps/frontend` 不再引用 legacy host；`lib/api.ts` / `lib/adapters.ts` 已移除或替换。
- [x] Shell 呈现 8 模块导航与 active role 芯片，切换行为符合决策 3。
- [x] Hub / Queue / Record 三个路由可访问，数据来自 fixtures。
- [x] 强确认组件两形态共用一套 props 契约。三个不可逆动作中只有 `end_trial`
      有能力契约，另两个已在 `FULLSCREEN_ACTIONS` 中声明待用。
- [x] 时限语义色映射只有一个来源（`lib/view/due.ts`）。
- [x] `pnpm --filter @the-nurture/frontend lint` 与 `typecheck` 通过。

## 三个零契约模块的能力提案

`artifacts/capability-proposal.md` 反推了 `people_operations`、`daily_operations`、
`grant_request_management` 需要哪些当前不存在的能力（26 个），逐条标注契约来源、
确认级别与禁止边界。主要结论：

- **GrantRequest 不是第二个 Workflow——它已经在 Enrollment Journey 里。**
  `start_trial` 与 `propose_formal_enrollment` 的并发 `headBindings` 都含 `grant_head`，
  授权建立已在 journey 的事务内；`02-architecture.md` 也明写 Grant change 不是第二个
  Workflow。因此建议 `grant_request_management` 从 `orderedContentKinds` 移除
  （8 个模块变 7 个），只保留入托关系详情里的只读 coverage 与一个补发起动作。
- Current Scope 是**业务范围**清单而非 Workflow 类型清单（其前两条同样都在
  `EnrollmentJourneyWorkflowV1` 之内），与 Classification Rules 之间**没有冲突**。
  提案早期版本曾把这里报为契约自相矛盾，那是误读，已更正。

## 交付后仍未闭合的契约缺口

这些不是实现遗漏，是契约当前不提供，记录在此供后端任务取用：

1. **没有列表能力**——队列靠逐条解析 `itemRefs`，扇出集中在 `listQueueRows()`。
2. **没有意向详情能力**——孩子称呼、出生月份、目标班型、照护需求、来源渠道、
   联系方式均无能力返回，Record 因此没有意向 facet。
3. **没有授权/照护记录能力**——同上，两个 facet 一并去掉。
4. **候补无名次字段**——名次由 `orderedEntries` 索引推导。
5. **后果文案无能力返回**——属 UX 责任，文案在 `lib/view/consequences.ts`。

## Key links

- 设计基准：`~/Desktop/nurture-workbench-mocks/spec-merged.html`
- Surface 契约：`packages/nurture-scenario/contracts/surfaces/v1/source/surfaces/surface-registry.json`
- 能力契约：`packages/nurture-scenario/contracts/surfaces/v1/source/capabilities/capability-registry.json`
- 产品语义：`docs/context/product/workflow-product-design-contract.md`
- 术语：`docs/context/glossary.json`（`web_domain_workbench` / `web_run_workbench`）
- Enrollment Journey 阶段与规则：`dev-docs/active/nurture-institution-mode/09-pilot-readiness.md`（B3-1c）
