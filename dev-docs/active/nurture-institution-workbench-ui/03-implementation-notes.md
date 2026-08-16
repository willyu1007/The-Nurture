# Implementation Notes

按阶段追加。每个阶段记录：改了什么、为什么这么改、以及任何偏离 `01-plan.md` 的地方。

## 开工前的既有状态（2026-08-17）

`apps/frontend` 现状：

- 3 个路由页面（`/nurture/projects` 列表 / `new` / `[id]`），服务 `family_rule_trial`，
  不属于六个冻结 surface 中的任何一个。
- 通过 `NURTURE_BACKEND_URL`（默认 `:3200`）打 legacy Fastify host。该 host 已在 T-012 降级：
  根 `pnpm dev` 现指向 scenario-service，跑这 3 页需要显式 `pnpm dev:legacy-host`。
- 无认证：`shell.tsx` 硬编码 `accountName="dev"`。
- 无测试。
- kit 六范式只用过三个：List（EntityCard grid）、Form（FormFrame）、Record（tabs + StatStrip）。
  Hub、Queue、Insight 从未使用。

`institution_workbench` 后端现状：28 个能力有契约与领域逻辑，
`enrollment-journey-formal-ingress.ts` 等 ingress 模块存在，但
`apps/scenario-service` 的 15 个 controller 中**没有任何一个**服务该表面。
harness 是 My-Chat→Nurture 的服务间读取通道（`serviceBearerAuth`），能力集是
guardian/caregiver board，接不上 workbench。

## 设计决策来源

四项设计决策与两项前置决策由用户在 2026-08-17 确认，记录在 `00-overview.md`。
设计基准 `~/Desktop/nurture-workbench-mocks/spec-merged.html` 是三个方向
（A 阶段流水线 / B 阻塞优先 / C 时限驱动）的合并结果，不是第四个选项。

合并时相对三版原稿只有一处新增：Record 顶部的阻塞横幅。A 原稿没有，B 有但形态是低密度的
「阻塞 + 三选一」。依据是 `docs/context/product/workflow-product-design-contract.md`
的「状态展示 SHOULD 优先使用当前阶段 + 已完成里程碑 + 下一步/阻塞」——阻塞是被点名要展示的，
A 原稿漏了。无阻塞时横幅不出现。

## P1 — Shell 与导航

改动：`src/components/shell.tsx`、`src/app/globals.css`、`.claude/launch.json`。

### 三处偏离设计基准，都因为 kit 的实际结构与 mock 不同

**1. 角色条不在顶栏，在内容区顶部。**
`AppShell` 的 props 只有 `nav / accountName / badges / accountMenuItems / signOutHref /
onSearch / children`，顶栏内部是 burger + 面包屑 + 空 spacer，**没有宿主插槽**；账号菜单
则在侧边栏而不是顶栏。mock 画的「顶栏右侧角色芯片 + 头像」在 kit 里无处安放。
当前实现把角色条作为内容区的第一条渲染，`Shell` 包裹 `{children}`。
要真正放进顶栏需要 Base 给 kit 加插槽，属跨仓改动，不在本任务范围。

**2. 松林绿用不了。** kit 的 stylelint preset 禁止宿主 CSS 出现任何字面色值
（`"/./": COLOR_LITERAL`，连自定义属性都拦），而 kit 令牌集里没有松林绿
`#2C5F55`。角色条因此使用中性令牌与 kit 的 `.mt-chip` / `.mt-caption` / `.mt-btn`
工具类。松林绿作为场景语义色目前只能存在于移动端；web 侧要用必须先由 Base 加令牌。
P1 无一处需要它。

**3. 概览台的路由从 `/nurture` 改为 `/nurture/overview`。**
`AppShell` 的 `matchPrefix` 是前缀匹配，`activeCrumb` 返回首个命中。概览台排在第一位、
href 为裸 `/nurture` 时会吞掉所有 `/nurture/*` 子路由，导致它在队列页仍被点亮。
验证时实测到该行为后改为同级路由，八个模块统一位于 `/nurture/<module>`。
`02-architecture.md` 的路由表已同步。

### 其他

- 六个未实现模块使用 `NavItemDef.soon`，kit 渲染为「待上线」且不是链接
  （`read_page` 确认它们是 `button` 而非 `link`），因此无需占位路由，也不会 404。
- 角色数据暂以 `ROLES` 常量内联在 `shell.tsx`，P3 移入 fixtures。
- 其他角色不提供切换，只列出并说明该角色的表面——B3-0 规定 caregiver 没有
  domain web workbench，提供一个通向空处的切换比不提供更糟。
- 未加 `badges`：队列计数应来自真实查询，P5 再接。现在挂假数字会误导完成度。

### 计划外改动

`.claude/launch.json` 原本存在且被跟踪，`port` 记的是 3000。我最初的存在性检查因
shell cwd 停留在 `apps/frontend` 而误报「不存在」，Write 直接覆盖了它。
3000 与仓库端口拓扑不符（`assert-port-topology` 要求 frontend=3201，
`apps/frontend/package.json` 也是 `-p 3201`），所以这次覆盖实际是修复，已通过该门禁验证。

`apps/frontend/next-env.d.ts` 由 Next 16 dev server 自动重写
（`.next/types` → `.next/dev/types`），是生成物，随本阶段一起提交。

## P2 — 移除 legacy host 依赖

（待填）

## P3 — Fixtures 层

（待填）

## P4 — Hub

（待填）

## P5 — Queue

（待填）

## P6 — Record

（待填）

## P7 — 强确认组件

（待填）
