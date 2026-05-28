# START-HERE (项目初始化)

> 面向人的需求 intake + 运行笔记。阶段状态和下一条命令看 `init/INIT-BOARD.md`。

## 当前焦点
- 初始化已完成：Stage A / Stage B / Stage C 均已批准。当前下一步是决定是否迁移 glossary，并是否清理 `init/`。
- 初始化文档语言：中文。
- Stage A / Stage B / Stage C 已批准。

## 当前结论
- 项目定位为 `My-Chat` 框架下的家庭/育儿决策标准场景模块，不是独立产品。
- 场景可以拥有多条独立 workflow、独立 web 操作台、独立服务端和场景数据库，但必须按 `My-Workflow-Base` / `My-Chat` 契约接入。
- `The-Parents` 的核心目标保留为：把原独立产品目标规范化为可接入 `My-Chat` 的标准模块。
- 长期目标本身也是一种 workflow 形态，不只是普通配置数据。
- 育儿画像可以由本项目独立维护，但必须贴附到 `My-Chat` canonical object，例如孩子对象、家庭对象、活动对象。
- 主要用户群体调整为宝妈/准妈妈优先，覆盖孕期、产后、婴幼儿到儿童成长阶段。
- 健康状态与基础医疗建议可以进入场景范围，但必须保持非诊断、非处方、非急救替代的边界。
- Stage B 蓝图采用 monorepo、TypeScript/pnpm、Next.js web console、NestJS scenario service、Postgres/Prisma、workers、dashboard contract、context/db/ui/env/ci/packaging/deployment/release/observability features。
- 技术栈选择已确认：TypeScript、pnpm、Next.js、NestJS、Postgres、Prisma、BullMQ/Redis-compatible workers、My-Chat Auth 和 My-Chat workflow dashboard contract。
- 数据库策略：仓库内 `prisma/schema.prisma` + migrations 是 schema SSOT；本地测试允许 The Nurture 独立 Postgres；云上优先按 My-Chat 查询效率合入 My-Chat Postgres 的专用 schema 或 `nurture_*` table group，但必须经过迁移门禁。
- 数据库合入前置检查已记录到蓝图：My-Chat 云上 Postgres/DATABASE_URL、命名空间预留、canonical object ref 契约、Prisma migration review、热路径索引/投影、测试数据边界、rollback/export/recovery。
- Stage C 已补齐最小 `prisma/schema.prisma`，刷新 DB context，并修正 monorepo tsconfig baseline；`pnpm typecheck` 已通过。
- Stage C 需要继续考虑 `/Users/phoenix/project/My-Workflow-Base` 的 contract：本仓库应提供 The Nurture scenario module、manifest、handlers/actions/presenters/policies 等适配层；My-Chat/host runtime 负责路由、worker、outbox、共享 contract package 和跨场景消费面。
- 已新增 `packages/nurture-scenario`，采用 `scenario.manifest.yaml` + TypeScript registry/module/handlers/actions/adapters/presenters/policies/repositories/tests 的结构。
- 已新增 `docs/context/workflow/nurture-scenario-contract.md` 并注册到 context registry，说明 The Nurture 与 My-Chat host runtime 的所有权边界。
- 本轮校验通过：根仓库 `pnpm typecheck`、`pnpm --filter @the-nurture/scenario typecheck`、`ctl-context verify --strict`。
- Skills 精简 Phase 1 已删除 7 个低风险技能：repo-prisma 已排除的 database mirror/Convex 技能，以及未采用的 Cypress/mobile test framework 技能。
- `gitlab-ci` 是 CI feature 下的嵌套子模板，当前 skill-retention 删除器无法按普通 SSOT skill 识别；先不纳入 Phase 1。
- Phase 1 后剩余 active skills 为 74 个；Phase 2 后剩余 active skills 为 67 个；Phase 3 后剩余 active skills 为 64 个；Phase 4 后剩余 active skills 为 61 个；Phase 5 后剩余 active skills 为 58 个；Stage C `skillRetentionReviewed` 已恢复为 `yes`；`lint-skills --strict` 通过。
- Phase 2 已删除：`iac`、`release`、`agent-builder`、`generate-skills-from-knowledge`、`land-skills-into-repo`、`test-api-postman-newman`、`test-perf-k6`。
- Phase 3 已删除：`docs`、`plan-code-refactors`、`review-implementation-plans`。
- Phase 4 已删除：`frontend-design`、`ui-style-intake-from-image`、`env-cloudctl`。
- Phase 5 已删除：`map-route-changes-for-testing`、`smoke-test-authenticated-api-routes`、`apply-frontend-ui-guidelines`。
- 用户确认停止继续精简 skills，并接受当前骨架结构。
- Root docs 已手工更新为 The Nurture 长期入口：保留初始化期 `init/` 路由，记录 My-Chat / My-Workflow-Base 边界、技术栈、关键路径、数据库策略和常用验证命令。
- 用户明确批准 Stage C；初始化管线状态已进入 `complete`。

## 关键输入

| Key | Value | Status |
|---|---|---|
| Project name | The Nurture | confirmed |
| One-line purpose | 将 The-Parents 规范化为 My-Chat 框架下的育儿决策标准场景模块 | confirmed |
| Primary users | 宝妈/准妈妈优先；共同参与的父母/监护人；My-Chat 管理员/运营 | confirmed |
| Must-have scope | P0 workflows：孕期阶段管理、长期目标/家庭策略、短期照护安排、活动比较、执行复盘；另含画像、健康状态、社区/知识规范接入 | confirmed |
| Out-of-scope | 脱离 My-Chat 的独立产品、绕过契约的消费面、诊断/处方/急救替代、复杂日历双向同步 | confirmed |
| Constraints | 遵守 My-Workflow-Base / My-Chat 契约；场景画像贴附 My-Chat canonical object | confirmed |
| Success metrics | 首个目标设置、短期闭环完成、复盘完成、社区证据引用 | confirmed |
| Tech stack preference | TypeScript + pnpm + NestJS + Next.js + Postgres/Prisma；dashboard 复用 My-Chat workflow surface contract | confirmed |
| Timeline / deadline | 未提供 | tbd |

## AI questions (next to ask)
- [ ] 是否迁移 `init/_work/stage-a-docs/domain-glossary.md` 到 `docs/context/glossary.json`？
- [ ] 是否立即执行 init cleanup/doc-path hygiene，还是先保留 `init/` 作为可追溯初始化记录？

## This round notes
- 已阅读：`The-Parents` 初始化产物、`My-Workflow-Base` workflow 契约、`My-Chat` 需求与 workflow consumption upgrade。
- 已运行 Stage A 严格校验并通过。
- 用户要求先对齐 Stage A。
- 用户确认：The Nurture 是 My-Chat 框架下的场景模块，可有独立 workflow/web/server/db；长期目标也是 workflow；画像独立维护但贴附 My-Chat canonical object。
- 用户认可当前 Stage A 对齐方向和 MVP workflow 候选范围；尚未执行 Stage A 管线审批。
- 用户询问 Stage A 是否还需要对齐技术栈、open questions 等剩余事项。
- 当前讨论主题：技术栈。已确认参考 `My-Chat` 当前实际栈，优先继承 TypeScript/pnpm/NestJS/Next.js/Postgres/Prisma/Convex 等宿主技术方向。
- 用户确认：The Nurture 可以采用 NestJS；数据库独立库或同库独立 schema 均可，主要以 My-Chat 查询效率为判断标准；还需纳入 dashboard 设计。
- 用户确认技术栈方向可以，继续下一个 Stage A 对齐点。
- 用户补充：主要用户群体为宝妈，孕期也需要考虑，后续健康状态和基础医疗建议可以加入。
- 当前讨论主题：MVP workflow catalog 如何从孕期、健康、长期目标、短期安排、复盘和画像中切出第一批闭环。
- 用户确认：活动比较进入 P0；其余 P0 切分方向认可。
- 当前判断：Stage A 已具备审批条件；剩余问题主要进入 Stage B 蓝图收敛。
- 用户明确批准 Stage A；管线已进入 Stage B。
- Stage B 蓝图已起草并通过 validate；suggest-packs 推荐少于当前选择，但当前选择保留 testing/context-core 以匹配 workflow scenario 和初始化治理。
- 当前讨论主题：哪些 skill packs 可以去掉，以及 Stage B 还需要逐点对齐哪些决策。
- 用户确认除数据库问题外其余按建议执行；蓝图已更新为保留全部 skill packs、采用推荐 first journey、dashboard surfaces、handoff 深度和医疗安全策略。
- 用户要求记录数据库同库策略的前置条件，便于后续实施时检查。
- 用户要求明确数据库仓库内 SSOT 和技术栈是否已确认；蓝图已补充 repo-prisma SSOT policy 和 confirmed tech stack。
- 用户明确批准 Stage B；管线已进入 Stage C。
- Stage C apply 已完成；skill retention 已确认保留全部技能；root docs 更新目前只预览未应用。
- 用户补充：Stage C 需要考虑 `/Users/phoenix/project/My-Workflow-Base` 项目的 contract，灵活应用其提供的脚手架。
- 已补齐 Nurture scenario module scaffold；保留 My-Chat host runtime 为宿主项目职责，不复制 host runtime 到本仓库。
- 用户要求开始精简 skills；已应用 Phase 1 / Phase 2 / Phase 3 / Phase 4 / Phase 5，共删除 23 个普通 SSOT skills。Stage C `skillRetentionReviewed` 已回到 `yes`。
- 用户确认：停止精简；接受当前骨架结构；需要更新 root docs。已完成 root docs 手工更新并通过校验。
- 用户明确批准 Stage C；已运行 `approve --stage C`，初始化完成。

---

<details>
<summary>Archive (append-only; folded by default)</summary>

----
### Stage A wrap-up - 2026-05-28
- Summary: 将 `The-Parents` 的育儿决策目标转换为 `My-Chat` 框架下的 The Nurture 标准场景模块需求。
- Decisions landed: 技术栈采用 TypeScript/pnpm/NestJS/Next.js/Postgres/Prisma；允许独立 workflow/web/server/db；画像贴附 My-Chat canonical object；dashboard 复用 My-Chat workflow contract；宝妈/准妈妈优先；P0 包含孕期阶段管理、长期目标/家庭策略、短期照护安排、活动比较/建模、执行记录与复盘学习；健康/基础医疗建议仅限非诊断、非处方、非急救替代。
- Key input changes: 活动比较进入 P0；健康状态与基础医疗信息建议作为横向能力嵌入 P0 workflow。
- Open questions: Stage B 需要收敛第一条 deterministic journey、数据库物理布局、canonical object 最小集合、dashboard MVP surface、handoff 深度和 skills packs。

----
### Stage B wrap-up - 2026-05-28
- Summary: 已将 Stage A 需求收敛为 `init/_work/project-blueprint.json` 并通过 validate / review-packs。
- Decisions landed: 保留全部 skill packs；技术栈确认 TypeScript/pnpm/Next.js/NestJS/Postgres/Prisma；数据库使用 repo-prisma SSOT；本地可独立库，云上优先 My-Chat 同库 schema/table group；P0 first journey 采用长期目标/家庭策略 -> 短期照护安排 -> 活动比较 -> 执行复盘；dashboard 覆盖 chat/mobile/web workbench/nurture console；handoff MVP 可先 public-ready draft + request；医疗安全策略独立、可测试。
- Key input changes: 数据库同库前置条件已进入蓝图 checklist。
- Open questions: Stage C 需要审阅生成文件、技能保留表、root docs 更新和最终 cleanup/init archive 策略。

----
### Stage C progress - 2026-05-28
- Summary: Stage C apply 已生成 monorepo scaffolding、context/db/ui/env/ci/packaging/deployment/release/observability artifacts，并同步 Codex/Claude wrappers。
- Fixes after apply: 新增最小 `prisma/schema.prisma` 作为 repo-prisma SSOT 起点；运行 `ctl-db-ssot sync-to-context` 刷新 DB contract；调整 root `tsconfig.json` 支持 monorepo include；新增 `packages/shared/src/index.ts`；运行 `pnpm install` 和 `pnpm typecheck`。
- Verification: `ctl-context verify --strict` 通过；`pnpm typecheck` 通过；Stage C 状态为 wrappersSynced yes / skillRetentionReviewed yes / approved no。
- Pending: 用户审阅 Stage C 生成结果；root README/AGENTS 更新需要人工决定是否应用；Stage C 仍未批准。

</details>
