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

`/nurture/overview` 用 kit 的 `<Hub modules>`，一个 module（入园流程）。
另加 `lib/view/due.ts`（时限分档与语义色的唯一来源）与 `lib/view/journey.ts`
（角色分组、阶段中文、两级判定）。同时补了 `/nurture/queue` 占位页，
让待办行的 href 有落点。

### 决策 (a) 已生效

Record 的「意向信息」区块确认去掉。本阶段的 Hub 只呈现契约给的字段：
`safeSummary` 作标题，阶段 + 时限 + `safeBlocker ?? nextAction` 作副行。

### 两级如何落到 kit 上

`AttentionItem.tone` 只允许 `accent | warning | info`，没有 `danger`——
kit 有意限制了待办的色阶。正好对应产品的两级规则：

- `accent`（橙）= 需要处理，判定是 `needsAdminNow()`：canonical 逾期或 `state === "blocked"`
- `info`（蓝）= 建议关注，园长负责但未触及期限

Hub 只渲染一条统一待办列表（按 `workflow` 标注来源），所以两级靠色调区分而非分区，
这是 kit 的模型，没有对抗它。

### StatStrip 用五个角色桶

空桶保留显示。零是信息；而且列会随数据增减移动的 strip 无法阅读。

### 时钟被钉住

`FIXTURE_NOW = 2026-08-17T03:00Z`，由 `queries.now()` 暴露。不用系统时钟的原因：
fixtures 是写死日期的，跟真实时间走的话几天后每条都会变成「逾期」，
界面看起来像坏了，而原因与代码无关。真实 ingress 落地时这个函数返回 `Date.now()`。

### 验证抓到的缺陷：typecheck 和 lint 都漏掉的构建错误

P3 的 lib 文件用了 `.js` 后缀的相对导入（ESM 写法）。`tsconfig` 的
`moduleResolution: "bundler"` 容忍这种写法，所以 typecheck 全绿；
但 Turbopack 解析不了，运行时 `Module not found`。

它在 P3 没暴露，是因为当时没有任何运行时代码 import 过 `lib/queries`——
P4 的 Hub 是第一个消费者。全部改为 `@/` 别名（页面本来就在用这个约定）。

**这意味着 P3 提交的代码带着一个潜伏缺陷，静态检查不可能发现它。**
后续阶段每新增一个模块都要实际打开页面，不能只看 typecheck。

### 文案

fixture 的 `safeBlocker` 原文写了「复盘已到期 3 天」，与 UI 计算出的
「逾期 3 天」在同一行重复出现。改为只说原因，不说时长——时长由界面算。

## P5 — Queue

`/nurture/queue` 按 `responsibleRole` 分五组。加了 `/nurture/queue/[ref]` 占位页
供行与抽屉落点。

### 只有「等我」组有动作按钮

kit 的 `<Queue>` **强制**要求 `drawer` prop——它锁死「行 + 尾部按钮 → 右侧抽屉」，
没有只读模式。这反而逼出了比原设计更准确的划分：

- **等我**（`responsibleRole === "institution_admin"`）→ `<Queue>`，按钮开抽屉。
- **其余四组** → `<Section>` + `<EntityRow href>`，chevron 导航到详情。

依据是铁律「行内按钮 = 去做，chevron = 去看」：别人负责的流程不是园长可执行的动作，
给它们配动作按钮会谎报可操作性。设计基准里那几组也画了按钮，是错的。

### 抽屉现在只读

`<Queue>` 的抽屉在本阶段展示阻塞、下一步、里程碑数，footer 是「打开完整详情」。
P7 把强确认流程放进 footer。**动作从一开始就走抽屉而不是导航**，因为 Queue 范式
锁死了这个形态，之后再改属于返工。

### 客户端边界

`<Queue>` 是 `"use client"` 且带 `useState`，而它的 `toRow` / `drawer` /
`actionLabel` 都是函数，无法跨 RSC 边界序列化。所以 `admin-queue.client.tsx`
只包住需要它的那一组；其余四组用 server-safe 的 `EntityRow` 直接在 page 里渲染。
视图模型在 server 侧解析完再传纯数据下去。

### 验证抓到的两个缺陷

**1. `.mt-caption` 会把中文里夹的英文单词大写。** 「跨 owner 校验中」渲染成
「跨 OWNER 校验中」。kit 自己的 `components.css` 注释里就写明了这个坑：
`.mt-caption` 是 **Latin eyebrow**（uppercase + tracking），CJK 下 transform 是
空操作但 tracking 仍生效，而夹杂的拉丁字母会被大写；双语产品应改用
`.mt-value-label`（命名读取视图中的值）或 `.mt-field-label`（命名控件）。
全仓 7 处 `.mt-caption` 已换成 `.mt-value-label`，含 P1 的角色条。

**2. `adminActionVerb` 漏了一个 stage。** `trial_in_progress` 未覆盖，
被 `noImplicitReturns` 抓到。10 个 stage 现已全覆盖，无 default 分支——
将来契约加 stage 时会编译失败而不是静默返回 undefined。

## P6 — Record

`/nurture/queue/[ref]`。按决策 (a) 的口径：只呈现 projection 真实携带的字段。

### Tab 从设计基准的四个缩到两个（+ 一个条件 tab）

原基准是「概览 / 时间线 / 授权与绑定 / 照护记录」。后三者里只有时间线有契约支撑：

- **意向信息**——无能力返回（决策 a，已去掉）
- **授权与绑定**——无能力返回，同类问题
- **照护记录**——无能力返回，同类问题

最终结构：

1. **概览**：概要、当前阻塞（有才显示）、下一步 + 责任角色、状态四项
   （`state` / `lifecycle` / `waitingState` / `pendingTransition`）、时间三项。
2. **里程碑**：见下。
3. **候补**：仅当该 journey 在候补列表中才出现。这个 tab 是**有契约支撑的意外收获**——
   `adminWaitlistEntry` 带资格时间、下次复核、最近确认、继续意愿、限时 offer 状态、
   优先类别与 policy revision，都是真实字段。

### 里程碑只显示已达成的

不渲染未达成步骤的阶梯。理由是产品契约明确禁止「没有稳定业务含义的伪百分比进度」——
把 14 个 milestone 排成固定阶梯再标「6/14」正是那个东西，而且其中
`trial_extended` / `preparation_cancelled` / `trial_ended` 是分支，本来就可能永不发生。
所以按 canonical 顺序列出已达成的，末尾接一行「当前停在：<阶段>」。
StatStrip 里也只放计数，不放分数。

### 面包屑与 intro 的取舍

详情页必须自己提供末级面包屑，否则加粗项停在「流程队列」，页面标题就是错的。
用 `SetBreadcrumb`（主入口导出，只吃可序列化的 `Crumb`，可从 server component 用）。

crumb 文案是 `safeSummary` 的**截断**，不是从中解析出来的片段：契约不承诺该字符串
内部有任何结构，按 fixtures 恰好使用的分隔符去 split 等于依赖未保证的格式。

加上 crumb 后发现 `Record` 的 `intro` 与它紧挨着重复同一句话（一个截断一个全文）。
按铁律「加粗面包屑即页面标题，正文不重复」，去掉 `intro`，全文移到概览的「概要」区块——
既不重复，也不丢信息。

### 其他

- 无法解析的 ref 走 `notFound()`，实测返回 404 而不是空白页。

## P7 — 强确认组件

`components/consequence-confirm.tsx`（两种形态共用一套披露渲染）、
`lib/view/consequences.ts`（文案与形态映射）、
`app/nurture/queue/[ref]/journey-actions.client.tsx`（Record 的动作行）。

### 后果文案是前端责任

能力契约给 `confirmationPolicy` 与 `concurrencyPolicy`，**不给任何句子**。
「会发生什么 / 不会发生什么」没有能力返回，只能由前端按已锁定语义撰写。
这与「意向信息」的缺口不同：那是数据缺失，这是 UX 责任——后端即便接入也未必该返回这些文案。
文案来源标注在 `consequences.ts` 的头注释（B3-1c 与 D-07C/D/E）。

`willNotHappen` 与 `willHappen` 同等重要。不可逆动作最危险的误读通常是
「系统接下来会自动做什么」——结束试入园**不会**自动联系候补下一位，也**不代表**家庭主动退园。

### 形态由动作键查表，不由组件猜

`FULLSCREEN_ACTIONS` 是唯一的映射来源。组件自己判断会把策略散落到各处。
集合里声明了三个键，但当前只有 `end_trial` 有能力契约；
`close_enrollment` 与 `revoke_child_link_grant` 先占位，能力出现时无需改组件。

### 确认按钮绕开了 ActionButton

`ActionButton` 只暴露 `primary | ghost`，因为场景工具栏只允许一个 navy pill。
但确认框的 footer 不是工具栏，而 kit 自带 `.mt-btn--danger`。
所以销毁性提交按钮直接用 kit 的类构建，而不是给 ActionButton 塞一个它不提供的颜色。

Record 的动作行里，**不可逆动作永远不占 primary pill**——`journey-actions.client.tsx`
里第一个动作才是 primary，且要求它不在 `FULLSCREEN_ACTIONS` 中。

### 执行通道诚实缺席

没有 controller 服务这个表面，能力也是 default-off。确认走完后弹 toast 说明
「命令通道尚未接入」，而不是静默无事——一个什么都不做的按钮会被读成成功。

`ToastProvider` 加在 `shell.tsx` 里包住 `AppShell`：kit 明确把 toast 留给宿主，
`AppShell` 自己不包。

### 验证抓到的缺陷：全屏层根本没全屏

`position: fixed; inset: 0` 没有覆盖侧栏与顶栏。原因是 kit 的
`.wb-scene.wb-reveal` 带一个恒等 `transform: matrix(1,0,0,1,0,0)`（reveal 动画留下的），
它为 `position: fixed` 创建了 containing block，面板因此被限制在场景盒内
（实测 rect 为 left 308 / top 232，而非 0/0）。

后果不只是难看：导航仍然可见可点，一个号称 modal 的确认框实际并不 modal。
改为 `createPortal` 到 `document.body` escape 掉那个祖先。截图复验后侧栏与顶栏均被覆盖。

**这个缺陷截图能看出来，但 typecheck 和 lint 都不会报。**
