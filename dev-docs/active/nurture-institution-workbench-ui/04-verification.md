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

## P3 — Fixtures 层（2026-08-17）

| 命令 | 结果 |
| --- | --- |
| `pnpm --filter @the-nurture/frontend typecheck` | 通过 |
| `pnpm --filter @the-nurture/frontend lint` | 通过 |

契约核对（逐字段对照 schema，非凭印象）：

- `EnrollmentJourneyProjection` 的必填字段、枚举取值与 `const` 约束与
  `enrollment-journey-types.schema.json#/$defs/workflowProjection` 一致。
- `AdminWaitlistEntry` / `AdminWaitlist` 与同文件的对应 `$defs` 一致，
  确认无 rank 字段。
- `WorkbenchModule` / `ActionRef` / `PageInfo` 与
  `surface-envelope.schema.json` 一致，确认 `itemRefs` 为 opaque ref 数组。
- `OwnerTargetOption` 与 `invocation/target-option.schema.json` 一致。

无浏览器验证：本阶段不产生界面，`lib/queries` 的首个消费者在 P4。

## P4 — Hub（2026-08-17）

| 命令 | 结果 |
| --- | --- |
| `pnpm --filter @the-nurture/frontend typecheck` | 通过 |
| `pnpm --filter @the-nurture/frontend lint` | 通过 |

浏览器验证（全新 tab，零控制台错误）：

- 「共 11 条进行中的入园流程」——12 条 fixture 中 1 条已完成被正确过滤。
- StatStrip 五桶：等我 5 / 等家庭 3 / 等老师 1 / 等系统 1 / 推进中 1，合计 11，与 fixture 吻合。
- 待办 5 条，全部是 `responsibleRole === institution_admin` 的 journey，
  按到期先后排序：果果（逾期 14 天）→ 小满（逾期 3 天）→ 豆豆（今天 10:00）
  → 团团（无时限）→ 星星（无时限）。
- 两级色调正确：前三条 accent，后两条 info。

发现并修复的缺陷（静态检查全绿，仅运行时暴露）：

- **`.js` 后缀导入无法被 Turbopack 解析**。P3 的三个 lib 文件用了
  `../contracts/enrollment-journey.js` 形式。`moduleResolution: "bundler"`
  让 typecheck 通过，但 Next 构建报 `Module not found`，页面 500。
  P3 阶段没有运行时消费者，所以直到 P4 才暴露。已全部改为 `@/` 别名。
- **副行文案重复**。fixture 的 `safeBlocker` 内含「已到期 3 天」，
  与 UI 计算的「逾期 3 天」并排出现。已改为只述原因。

## P5 — Queue（2026-08-17）

| 命令 | 结果 |
| --- | --- |
| `pnpm --filter @the-nurture/frontend typecheck` | 通过 |
| `pnpm --filter @the-nurture/frontend lint` | 通过 |

浏览器验证（全新 tab，零控制台错误）：

- 五组齐全且计数吻合：等我 5 / 等家庭 3 / 等老师 1 / 等系统 1 / 推进中 1 = 11。
- 组内按到期排序：等家庭组为 08-20 → 08-21 → 09-01。
- 候补名次按 `orderedEntries` 索引推导：豆豆第 1、牛牛第 2、米米第 3，与 fixture 顺序一致。
- 时限标签与语义色分档正确：逾期 danger、今日 warning、未来 info、无时限 muted。

抽屉交互（用 `javascript_tool` 检查 DOM，Browser pane 的可访问性读取当时不可用）：

- 点击前 DOM 无抽屉内容；点击「复盘」后抽屉出现，含当前阻塞、下一步、里程碑数。
- **`location.pathname` 仍为 `/nurture/queue`** —— 验证了 Queue 铁律「开抽屉，不跳页」。
- 抽屉 footer 的详情链接为 `/nurture/queue/opt_wfr_01h_xiaoman`，指向正确记录。
- 动作按钮共 5 个，全部落在等我组；其余四组为导航行，无按钮。

发现并修复的缺陷：

- **`.mt-caption` 把中文里的英文大写**。「跨 owner 校验中」渲染成「跨 OWNER」。
  kit 的 `components.css` 已记录该类是 Latin eyebrow、双语产品应用 label 类。
  全仓 7 处改为 `.mt-value-label` 后复验为小写。
- **`adminActionVerb` 未覆盖 `trial_in_progress`**，由 typecheck 抓到。

工具限制：Browser pane 中途进入 viewport 0x0 状态，`read_page` 与 `computer`
不可用；`get_page_text` 与 `javascript_tool` 仍可用，验证改走这两条路径。

## P6 — Record（2026-08-17）

| 命令 | 结果 |
| --- | --- |
| `pnpm --filter @the-nurture/frontend typecheck` | 通过 |
| `pnpm --filter @the-nurture/frontend lint` | 通过 |

浏览器验证（全新 tab，零控制台错误），三条 journey 各验一个侧面：

- **豆豆**（候补中）：三个 tab（概览 / 里程碑 3 / 候补）。候补 tab 显示
  「托大班 · 第 1 位」、资格时间 2026-07-30、下次复核 2026-08-17、
  继续意愿「已确认」、限时 offer「进行中」、优先类别 `sibling_priority · v3`。
  无 `safeBlocker`，因此**概览没有渲染阻塞区**——条件渲染成立。
- **小满**（有阻塞、非候补）：只有两个 tab，**没有候补 tab**；阻塞区正确显示原文。
  StatStrip 为 试入园复盘 / 等我 / 逾期 3 天 / 6。
- **乐乐**（等老师）：责任角色显示「等老师」，无候补 tab。

里程碑 tab（`javascript_tool` 读 DOM）：

- 已达成 6 项按 canonical 顺序全部出现。
- **未达成的 0 项泄漏**（检查了取得候补资格 / 家长已接受 / 正式入园已提交 / 流程完成）。
- 末行为「当前停在：试入园复盘」。

其他：

- 无法解析的 ref（`opt_does_not_exist`）返回 404 页面，`notFound()` 生效。
- 加了 `SetBreadcrumb` 后，末级面包屑为截断的 `safeSummary`；
  实测全文在页面中只出现 **1 次**（去掉 `Record` 的 `intro` 之后），无重复。

工具注意：在同一次 `javascript_exec` 里点击 tab 并立刻读 DOM 会读到旧内容，
React 尚未重渲染。点击与断言必须分两次调用。

## P7 — 强确认组件（2026-08-17）

| 命令 | 结果 |
| --- | --- |
| `pnpm --filter @the-nurture/frontend typecheck` | 通过 |
| `pnpm --filter @the-nurture/frontend lint` | 通过 |

浏览器验证（全新 tab，零控制台错误）。以 `trial_review` 阶段的三个动作为样本：

- Record 动作行渲染「延长试入园（primary）/ 提出正式入园（ghost）/
  结束试入园并释放名额（ghost）」——**不可逆动作没有占用 navy pill**。
- **抽屉形态**（`extend_trial`，可逆）：含会立即发生、不会发生、影响范围、
  版本条「重校验于 2026-08-17 01:00 · 期望版本 v7」、可逆性「可再次调整」；
  确认按钮初始 `mt-btn--primary mt-btn--disabled` 且 `disabled === true`。
- **勾选门控**：勾选后按钮变为 `mt-btn mt-btn--primary`，`disabled === false`。
- **全屏形态**（`end_trial`，不可逆）：eyebrow 为「强确认 · end_trial · 不可逆」，
  确认按钮为 `mt-btn--danger`，「不会发生」4 条齐全。
- **提交**：确认后覆盖层关闭并弹出 toast
  「命令通道尚未接入 / …但 end_trial 的执行入口属于后端任务。」

发现并修复的缺陷：

- **全屏层没有全屏**。`position: fixed; inset: 0` 被 kit 的
  `.wb-scene.wb-reveal` 的恒等 `transform` 困住（该属性为 fixed 定位创建
  containing block），面板实测位于 left 308 / top 232 而非 0/0，
  侧栏与顶栏仍可见可点——号称 modal 的确认框并不 modal。
  改用 `createPortal` 到 `document.body`，截图复验覆盖正确。
  **typecheck 与 lint 均不会报此类缺陷。**
- **`ActionButton` 无 danger 变体**，由 typecheck 抓到。确认按钮改用 kit 的
  `.mt-btn--danger` 类构建。

排除的假阳性：

- tab-8 控制台报 `useToast must be used within ToastProvider`。全新 tab 复跑完整
  流程后无此错误，判定为加入 `ToastProvider` 之前 HMR 过渡态的残留。
- 首次读取 toast 为空。两次 `javascript_exec` 之间有秒级往返，toast 已自动消失；
  改为单次 async 调用内 `await` 后读取即可见。

## P1 侧栏返工（2026-08-17，用户看界面后指出）

| 命令 | 结果 |
| --- | --- |
| `pnpm --filter @the-nurture/frontend typecheck` | 通过 |
| `pnpm --filter @the-nurture/frontend lint` | 通过 |

两处与 kit 范式不一致，P1 时漏掉，静态检查看不出：

- **home 与概览台同时高亮。** DOM 实测两个 `.wb-nav__item--active`，href 都是
  `/nurture/overview`。根因是 P1 把概览台从 `/nurture` 挪走以避开前缀碰撞时，
  没有同步调整 `home`。改 `home` 为 `/nurture` 并不解决——`matchPrefix` 对
  `/nurture` 仍是前缀匹配，反而变成所有模块路由都点亮 home。
  正解是 `home: "/"`：`matchPrefix` 对 `"/"` 有精确匹配特例，就是为根路径设计的。
- **缺 `nav.create`。** kit 铁律把全局快捷新建钉在侧栏（这样场景工具栏只留一个
  navy pill），P1 未配置。已加「登记新意向」并标 `soon`——创建流程尚不存在。

复测（`/nurture/queue`）：高亮项只有「流程队列」，`.wb-create` 渲染为「新增」，
home 不再高亮。`/` 与 `/nurture` 均 200 落到 `/nurture/overview`。全新 tab 零控制台错误。

排查中的一次误判：先用 `.wb-nav__add` 判断 create 是否渲染，得出"没生效"。
那个类是 `NavGroupDef.add`（分组级），create 菜单的类是 `.wb-create`——选错了选择器。

## P1 侧栏对齐 The-Education（2026-08-17）

参照 `The-Education/apps/web/src/components/workbench/workbench-shell.tsx`——
同一套 kit 的姊妹实现——补齐三处未用的 `ShellNav` 能力。

| 命令 | 结果 |
| --- | --- |
| `pnpm --filter @the-nurture/frontend typecheck` | 通过 |
| `pnpm --filter @the-nurture/frontend lint` | 通过 |

浏览器实测：

- **分组从 1 个变 4 个。** 原来 8 个模块挤在一个标签为「园区」的分组里，
  而这个标签只是复述表面名，白占一层层级。现改为：概览台（无标签）／
  园区流程／园区管理／资料与洞察。DOM 确认四组结构与归属正确。
- **队列 badge = 5**，来自 `countAwaitingAdmin()`（`responsibleRole ===
  institution_admin` 且 lifecycle active），与概览台 StatStrip 的「等我」一致。
  layout 改为 async 在服务端取数，Shell 仍是纯客户端组件。
- **搜索按钮不再是死的。** kit 无论是否传 `onSearch` 都渲染该按钮，
  之前未接等于发了个点了没反应的按钮。现接 toast 说明未接入。

全新 tab 零控制台错误。

刻意未采纳参考实现的两项：`sections`（本工作台所有路由都已是 nav 项，
`activeCrumb` 能解析，补 sections 是无效冗余）与 `signOutHref`
（尚无认证，指向不存在的登出页会是又一个死入口）。

## 工具经验

- Browser pane 会间歇进入 viewport 0x0 状态：`read_page` / `computer` 不可用，
  `get_page_text` 与 `javascript_tool` 仍可用。此时任何依赖 `innerWidth` 的
  断言都会变成假阳性（0 === 0），需改用截图判定。
- 点击与断言必须分开：同一次 `javascript_exec` 内点击后立即读 DOM 会读到旧内容。
  需要连续操作时用单次 async 调用并在其中 `await`。
- 控制台跨导航累积且不清空，判定「零错误」必须开新 tab。
