# Plan

七个阶段，每个阶段结束时可独立 lint/typecheck 通过并提交。

## P1 — Shell 与导航

- `components/shell.tsx`：把单条「养育项目」导航替换为 8 个模块分组。
- 加 active role 芯片（松林绿，场景语义色，不作主色）与展开菜单。
- 切换行为：直接路由到该角色首页，无确认对话。

退出条件：shell 渲染 8 项导航与角色芯片；lint 通过。

## P2 — 移除 legacy host 依赖

- 删除 `src/app/nurture/projects/`（list / new / [id]，共 5 个文件）。
- 删除 `lib/api.ts`、`lib/adapters.ts`。
- `next.config.ts` 的 `NURTURE_BACKEND_URL` rewrite 暂留但不再有调用方；P3 决定去留。
- 更新 `apps/frontend/README.md`：不再描述为 legacy host 的 fixtures 演练场。

退出条件：仓库内无对 legacy host 端点的引用；lint / typecheck 通过。

前置证据（已核）：`apps/frontend` 无测试；外部唯一引用是
`pnpm --filter @the-nurture/frontend lint`；`dev-docs/archive/legacy-host-retirement`
从未引用 frontend。

## P3 — Fixtures 层

- 新建 `lib/fixtures/enrollment-journey.ts`，形状对齐
  `query_institution_enrollment_journey` 的 result schema。
- 数据覆盖四个阻塞分组与四档时限，至少含一条逾期、一条今日到期、一条无时限。
- 所有字段限制在契约允许范围：孩子称呼、出生月份、目标班型、照护需求、来源渠道、
  下次触点、候补名次。联系方式一律 opaque ref。

退出条件：fixtures 有明确的 TS 类型，后端就绪时只换实现不改调用方。

## P4 — Hub

- 路由 `/nurture`。
- StatStrip（等我 / 等家庭 / 等系统 / 推进中）+「需要处理」「建议关注」两级 EntityRow。
- 待办是 row 不是 card。

## P5 — Queue

- 路由 `/nurture/queue`。
- 四个 Queue 实例（等我 / 等家庭 / 等系统 / 推进中），不是一个带 groupBy 的。
- 时限前导标签，组内按时限排序。
- 统一的时限语义色映射，单一来源。

## P6 — Record

- 路由 `/nurture/queue/[id]`。
- 阻塞横幅（有阻塞时）+ StatStrip + 4 tab（概览 / 时间线 / 授权与绑定 / 照护记录）。
- 概览含已完成里程碑、意向信息、下一步三选一。

## P7 — 强确认组件

- 一套 props 契约：版本条 / 会发生 / 不会发生 / 影响范围 / 可逆性 / 确认勾选。
- 两种布局：Drawer（默认）与全屏（`end_trial`、`close_enrollment`、`revoke_child_link_grant`）。
- 组件不自行判定用哪种形态；由调用方按动作 key 指定，映射表单一来源。

## 顺序依赖

P1 → P2 可并行于 P3。P4/P5/P6 依赖 P3。P7 依赖 P6（从 Record 触发）。
