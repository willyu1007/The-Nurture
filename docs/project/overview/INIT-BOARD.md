# INIT-BOARD (初始化看板)

> 阶段状态看这里；需求 intake 和人工结论看 `init/START-HERE.md`。

## 当前焦点
- Stage A 已批准。
- Stage B 已批准。
- Stage C 已批准。
- 初始化管线已完成。
- `My-Workflow-Base` scenario-module 契约适配已补齐。
- Skills 精简 Phase 1 / Phase 2 / Phase 3 / Phase 4 / Phase 5 已应用；用户确认停止继续精简。
- 当前骨架结构已接受。
- Root `README.md` / `AGENTS.md` 已更新。
- 当前下一步：决定是否迁移 glossary，以及是否执行 init cleanup/doc-path hygiene。

## Next actions (human/LLM)
1. Human/LLM：决定是否迁移 `init/_work/stage-a-docs/domain-glossary.md` 到 `docs/context/glossary.json`。
2. Human/LLM：决定是否立即执行 init cleanup/doc-path hygiene，或暂时保留 `init/` 作为可追溯初始化记录。

## Stage C contract additions
- 新增 `packages/nurture-scenario`，按 My-Workflow-Base scenario-module 结构组织 manifest、registry、module、handlers、actions、adapters、presenters、policies、repositories 和 deterministic journey fixture。
- 新增并注册 `docs/context/workflow/nurture-scenario-contract.md`，明确 The Nurture 只拥有场景模块；My-Chat 拥有 host runtime、共享 workflow ledger、worker、outbox、dashboard/downstream consumers。
- 校验通过：`pnpm typecheck`、`pnpm --filter @the-nurture/scenario typecheck`、`ctl-context verify --strict`、init status。

## Skill pruning Phase 1
- 已删除：`sync-code-schema-from-db`、`convex-as-ssot`、`convex-best-practices`、`test-web-cypress`、`test-mobile-appium`、`test-mobile-detox`、`test-mobile-maestro`。
- 不在 Phase 1 删除：`gitlab-ci`，因为它是 CI feature 下的嵌套子模板，当前 skill-retention 删除器不按普通 SSOT skill 识别。
- Phase 1 后 active skills 约 74 个。

## Skill pruning Phase 2
- 已删除：`iac`、`release`、`agent-builder`、`generate-skills-from-knowledge`、`land-skills-into-repo`、`test-api-postman-newman`、`test-perf-k6`。
- Phase 2 后 active skills 约 67 个。

## Skill pruning Phase 3
- 已删除：`docs`、`plan-code-refactors`、`review-implementation-plans`。
- Phase 3 后 active skills 约 64 个。

## Skill pruning Phase 4
- 已删除：`frontend-design`、`ui-style-intake-from-image`、`env-cloudctl`。
- Phase 4 后 active skills 约 61 个。

## Skill pruning Phase 5
- 已删除：`map-route-changes-for-testing`、`smoke-test-authenticated-api-routes`、`apply-frontend-ui-guidelines`。
- 当前状态：`stageC.skillRetentionReviewed = yes`；`lint-skills --strict` 通过；active skills 约 58 个。

## Root docs
- 已手工更新 `README.md` 和 `AGENTS.md`，未采用模板化生成版。
- 内容覆盖 The Nurture 项目定位、My-Chat/My-Workflow-Base 边界、技术栈、关键路径、数据库策略、初始化期路由和常用验证命令。
- 校验通过：模板占位扫描、`pnpm typecheck`、`pnpm --filter @the-nurture/scenario typecheck`、`ctl-context verify --strict`、`lint-skills --strict`。

## Key paths
- `init/START-HERE.md`
- `init/_work/stage-a-docs/`
- `init/_work/project-blueprint.json`
- `init/_work/.init-state.json`

<!-- INIT-BOARD:MACHINE_SNAPSHOT:START -->
## Machine snapshot (pipeline)

- stage: complete
- pipelineLanguage: zh
- llm.language: 中文
- stateUpdatedAt: 2026-05-28T13:19:08.121Z
- lastExitCode: 0

- stageA: mustAsk 8/8; docs 4/4; validated yes; approved yes
- stageB: drafted yes; validated yes; packsReviewed yes; approved yes
- stageC: wrappersSynced yes; skillRetentionReviewed yes; approved yes

### Next (suggested)
- Migrate glossary: transfer terms from `init/_work/stage-a-docs/domain-glossary.md` to `docs/context/glossary.json`, then run `ctl-context touch`.
- Initialization complete. Optional: run `cleanup-init --apply --i-understand` to remove init/.

<!-- INIT-BOARD:MACHINE_SNAPSHOT:END -->
