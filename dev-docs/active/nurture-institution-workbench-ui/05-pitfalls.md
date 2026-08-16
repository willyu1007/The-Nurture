# Pitfalls

## 跨仓 pin

`apps/frontend` **不在** `nurtureScenario.contractPaths` 里，所以本任务的前端改动不触发 reseal。
一旦扩展到 `packages/nurture-scenario/src` 或 `apps/scenario-service/src`（后端 ingress），
就会改变 `contractSha256`，需要 reseal。

`verify-workflow-contract-pin` 目前**本来就是红的**：My-Chat sibling revision 漂移
（`c786ae4` vs 钉定 `76651e4`）。这与本任务无关，但后端任务开工前必须先清掉，
否则第一个批次落不干净。

## 共享工作副本

有并发 agent 会话在动 `main`（本任务创建期间已观察到：另一会话在提交之间插入 commit，
并把 `legacy-host-retirement` 从 active 移到 archive）。规矩：

- 提交前先 `git fetch` 并确认工作区完整性。
- `git add` 一律路径限定，不要 `-A`。
- 不要用 `git checkout -- <path>` 回滚测试性改动——会连未提交的正式修改一起冲掉（已踩过）。

## 提交门禁

`hooks.requireTaskTrailer=true`。本任务的提交要带 `Task: T-###` trailer。
只有与任务无关的改动才用 `SKIP_TASK_TRAILER=1`。

pre-commit 会跑 `lint-docs`（全仓 Markdown）与 `assert-surface-terminology`（术语守卫）。
后者会拦截裸写的 `web run workbench` 等 pre-B3-0 措辞——写文档时直接用 `web_domain_workbench`。
引用被禁措辞本身时加反引号即可放行（守卫的 allow 规则就是为此存在）。

## 设计实现

- **不要把 Queue 做成一个带 groupBy 的组件**。四个分组是四个 `<Queue>` 实例，
  否则会诱导出「可切换分组维度」的伪需求，而分组维度是已拍板的产品决策。
- **待办不能用 card**。kit 铁律：card 意味着「点进去看」，可操作的待办必须是带 cta 的 row。
- **强确认组件不要自己判断形态**。由调用方按 action key 指定，否则映射会散落到各处。
- **时限颜色不要各屏自己算**。单一映射来源，否则「逾期」在不同屏会出现不同的红。
- **不要给不存在的模块做假数据**。7 个未实现的 contentKind 进空态，不要为了「看起来完整」
  编造人员、出勤或洞察数据——那会让人误判完成度。

## 语义

`institution_workbench` 是 surface 实例，`web_domain_workbench` 是它所属的表面类。
两者不是同义词：B3-0 另外授权了 guardian 的 family web workbench，只是尚未进 surface registry。
写代码注释和文档时用准确的那个。

## 别扩大范围

`enablement_policy` 对 enrollment journey 与 institution knowledge 都是 `disabled`，
且 pilot readiness 明确不授权 activation。本任务不碰这个开关。
UI 跑在 fixtures 上不是妥协，是当前唯一被授权的形态。
