# Verification

每次验证运行都记录命令与结果。未跑过的不记，跑红的照实记。

## 本任务的验证集

```bash
pnpm --filter @the-nurture/frontend typecheck
pnpm --filter @the-nurture/frontend lint
node scripts/assert-surface-terminology.mjs
node .ai/scripts/lint-docs.mjs --path . --check-anchors
node .ai/scripts/ctl-project-governance.mjs lint --check --project main
```

前端改动不进 `nurtureScenario.contractPaths`，因此本任务**不需要**
`pnpm verify:workflow-contract-pin` 通过。该门禁当前因 My-Chat sibling revision 漂移
（`c786ae4` vs 钉定 `76651e4`）本来就是红的，属于后端任务的前置，不是本任务的验收项。

界面渲染验证走 `preview_start` + `read_page` / 截图，不靠人工确认。

## 开工前基线（2026-08-17）

| 命令 | 结果 |
| --- | --- |
| `assert-surface-terminology` | OK — 无 pre-B3-0 术语 |
| `ctl-context verify --strict` | ok |
| `ctl-project-governance lint --check` | ok |
| `lint-docs --check-anchors` | Errors 0 / Warnings 0 / 714 文件 |
| `verify-workflow-contract-pin` | **红** — My-Chat revision 漂移（既有，与本任务无关） |

前置事实核查：

- `apps/frontend` 无测试文件。
- 外部对 frontend 的唯一引用是 `pnpm --filter @the-nurture/frontend lint`。
- `dev-docs/archive/legacy-host-retirement` 从未引用 frontend → 删 3 个页面不打断退役证据链。
- `apps/frontend/package.json` 不在跨仓 pin 的 `contractPaths` 内。

## P1 — Shell 与导航（2026-08-17）

| 命令 | 结果 |
| --- | --- |
| `pnpm --filter @the-nurture/frontend typecheck` | 通过 |
| `pnpm --filter @the-nurture/frontend lint` | 通过（eslint + stylelint） |
| `node scripts/assert-port-topology.mjs` | ok — scenario=8000 legacy-host=3001 backend=3200 frontend=3201 |

浏览器验证（`preview_start` name=frontend，:3201）：

- 侧栏渲染 8 个模块；六个 `soon` 项显示为「待上线」，`read_page` 确认它们是 `button`
  而非 `link`，不可导航。
- 角色条渲染「当前角色 / 园长 · 晨光园 / 切换角色」。
- 点击「切换角色」展开菜单，内容为当前角色及其表面、该账号的其他角色及其表面、
  以及「角色本身不授予权限」的说明。
- `read_console_messages --onlyErrors` 无输出。

发现并修复的缺陷（由验证发现，非静态检查）：

- **概览台吞噬子路由**。初版把概览台放在裸 `/nurture`，因 `matchPrefix` 是前缀匹配，
  `/nurture/projects` 也命中概览台并将其点亮。改为 `/nurture/overview` 后复测，
  legacy 路由不再错误点亮任何模块。

## P2 — 移除 legacy host 依赖（2026-08-17）

| 命令 | 结果 |
| --- | --- |
| `pnpm --filter @the-nurture/frontend typecheck` | 通过 |
| `pnpm --filter @the-nurture/frontend lint` | 通过 |
| 残留引用扫描 | 无 —— `NURTURE_BACKEND_URL` / `3200` / `legacy-host` / `projects` 在 `apps/frontend` 内零命中 |

浏览器验证：

- `/` 重定向到 `/nurture/overview`，概览台在侧栏正确点亮，面包屑显示「概览台」。
- 占位页渲染，无 legacy host 连接错误。
- 在**全新 tab** 中 `read_console_messages --onlyErrors` 无输出；当前页面的
  network 请求全部 200/304，零 404。

排除的假阳性：原 tab 的控制台里有 10 条 404。核对 network 日志后确认全部来自本 tab
早前对已删除的 `/nurture/projects` 的导航，是历史残留而非当前缺陷；开新 tab 复测为零。

## P3 — Fixtures 层

（待填）

## P4–P7

（待填）
