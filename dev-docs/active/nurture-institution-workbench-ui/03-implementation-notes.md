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

删除 8 个文件：`src/app/nurture/projects/`（5 个）与 `src/lib/`（`api.ts`、`adapters.ts`）。
`lib` 下两个文件只被那 5 个页面引用，删除是自足的，无悬空导入。

### 相对计划的三处扩大

**1. 一并删掉了 `next.config.ts` 的 rewrites。** 计划原写「暂留，P3 决定去留」。
但该 rewrite 指向 `NURTURE_BACKEND_URL`（默认 `:3200`，即已退役的 legacy host），
留着就是指向退役宿主的死配置，与本阶段目标相悖。真实 ingress 出现时会重新加，
届时指向 scenario-service 而不是这个端口。已在 `next.config.ts` 注释里写明。

**2. 新增 `/nurture/overview` 占位页。** 不加的话 P2 结束后应用没有任何可达页面，
`/` 会重定向到 404。占位页刻意不显示任何数字——队列数据还不存在，编造计数会被误读成进度。
P4 用真实 Hub 替换其内容。

**3. 删掉了 `globals.css` 的 `.nurture-card-grid`。** 它只被 `project-list.client.tsx` 使用，
随该文件一同失效。

### 其他

- `src/app/page.tsx` 的重定向改为 `/nurture/overview`。
- `apps/frontend/README.md` 重写：不再描述为 legacy host 的 fixtures 演练场，
  改为说明它承载 `web_domain_workbench`，并明确它不是 My-Chat 的 `web_run_workbench`。

### 验证时发现的铁律违反

占位页初版写了 `<Scene intro="概览台">`，而加粗的面包屑本身就是页面标题，
等于把名字说了两遍。kit 对 `intro` 的定义是「一行场景说明」，不是标题。
占位阶段没有有意义的说明，因此整个省略 `intro`。

## P3 — Fixtures 层

三个文件：`lib/contracts/`（类型，镜像 schema）、`lib/fixtures/`（数据）、
`lib/queries/`（读取面，唯一的替换点）。界面层只 import `lib/queries`。

### 读契约后推翻的四个设计前提

对照 `capabilities/contracts/enrollment-journey-types.schema.json`、
`query-enrollment-journey.schema.json`、`surfaces/surface-envelope.schema.json`
与 `invocation/target-option.schema.json` 后发现，已批准设计有四处依赖契约不提供的东西。

**1. 没有列表能力。** `query_institution_enrollment_journey` 的 input 是空对象、
targetPolicy 为 `owner_option_required`、result 是**单个** `workflow`。
envelope 的 `workbenchModule` 只给 `itemRefs`（opaque ref 数组）与 `pageInfo`，
不含任何可显示字段。因此渲染一屏队列 = 逐条解析，N+1 是**契约形状**而非实现偷懒。
`listQueueRows()` 把这个扇出集中在一处，将来出现列表能力时只改这一个函数体。

**2. 没有结构化的意向字段。** projection 里人类可读的只有 `safeSummary`
（≤500 字符）一行，外加 `safeBlocker` 与 `nextAction`。孩子称呼、出生月份、
目标班型、照护时间需求、来源渠道、联系方式**都不在任何能力的返回里**——
现有 28 个能力中没有意向详情查询。设计基准里 Record 的「意向信息」区块因此
没有契约支撑，P6 必须去掉或先补能力。

**3. 候补没有名次字段。** `adminWaitlistEntry` 无 rank/position，
`adminWaitlist.orderedEntries` 的数组顺序就是名次，且作用域是单个 CareGroup。
`waitlistPositionOf()` 按索引推导，并在注释中写明这一点。

**4. 漏了一个分组。** `waitingState` 枚举含 `waiting_on_caregiver`，
`responsibleRole` 含 `caregiver`——已批准的四分组（等我/等家庭/等系统/推进中）
少了「等老师」。改用 `responsibleRole` 作为分组键：它的五个取值与分组 1:1 对应，
比按 `waitingState` 拼更准确（后者没有「等园长」这个值，等我其实是
`responsibleRole === institution_admin`）。

### Fixtures 覆盖

12 条 journey，覆盖 `responsibleRole` 全部五个取值与四档时限（逾期 / 今日 /
本周 / 无时限），含一条 `waiting_on_caregiver`、一条 `waiting_on_system`、
一条已完成。全部合成数据，`safeSummary` 按 owner 会写的方式撰写。
另有一个 CareGroup 的候补列表（3 条，含一条 `hasOpenOffer`）。

## P4 — Hub

（待填）

## P5 — Queue

（待填）

## P6 — Record

（待填）

## P7 — 强确认组件

（待填）
