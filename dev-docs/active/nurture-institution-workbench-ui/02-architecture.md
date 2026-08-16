# Architecture

## 边界

`apps/frontend` 是 `web_domain_workbench` 的宿主：Nurture 所有，route namespace `/nurture`。
它不是 My-Chat 的 `web_run_workbench`（通用 Workflow Run 面，B3-0 锁定不授予 Nurture 业务访问），
也不再是 legacy host 的 dev console。术语定义见 `docs/context/glossary.json`。

## 路由

```
/nurture                     Hub（最小版，只聚合 institution_workflow_queue）
/nurture/queue               Queue（四个阻塞分组）
/nurture/queue/[id]          Record（4 tab）
```

其余 7 个 contentKind 在导航中占位但不实现，点击进入空态并说明「尚未开放」。
占位是刻意的：让 shell 的信息架构一次成型，避免后续每加一个模块就改一次导航。

## kit 范式映射

| 界面 | kit 组件 | 铁律约束 |
| --- | --- | --- |
| Hub | `<Hub modules>` | 待办是 `EntityRow`，不是 card；stats 是 StatStrip；筛选与快捷动作在 topbar 菜单 |
| Queue | `<Queue items>` × 4 | 行 + 尾部动作按钮；动作开右侧 Drawer，不跳页 |
| Record | `<Record intro tabs>` | 主动作右上角；次动作进 Drawer |
| 强确认 | 新组件 | kit 无对应件，见下 |

全局顶栏只放身份（面包屑 + 角色芯片 + 账号）。主动作是场景工具栏右侧唯一的 navy pill。
分段控件 = 工作流步骤导航，筛选 = 下拉，两者都在场景工具栏左侧且不混用。

## 数据层

```
lib/fixtures/enrollment-journey.ts   ← 本任务
        ↓ 同一 TS 接口
lib/queries/enrollment-journey.ts    ← 后端就绪后替换实现
        ↓
query_institution_enrollment_journey (capability)
```

接口形状对齐 capability 的 result schema。fixtures 与真实实现共用类型，
后端任务落地时只换 `lib/queries` 的实现，界面层不动。

当前无任何 controller 服务 `institution_workbench`（15 个 controller 全部服务
teacher / parent / director-presenter / harness / 基础设施），所以 fixtures 不是临时凑合，
而是这一阶段唯一可行的数据源。

## 强确认组件

一套 props，两种布局：

```ts
type ConsequenceDisclosure = {
  actionKey: string;              // end_trial / extend_trial / ...
  revalidatedAt: string;          // 版本条：重校验时刻
  expectedVersion: string;        // 版本条：expected version
  willHappen: string[];           // 会立即发生
  willNotHappen: string[];        // 不会发生 —— 与前者同等重要
  affects: { label: string; value: string }[];
  reversible: boolean;
  acknowledgement: string;        // 需勾选的理解确认
};
```

形态选择不由组件内部判断，由调用方按 action key 指定，映射表单一来源：

```
FULLSCREEN_ACTIONS = { end_trial, close_enrollment, revoke_child_link_grant }
其余 strong_confirmation / reviewable_commit → Drawer
```

`willNotHappen` 是刻意的一等字段。契约里 revoke/end 类动作必须披露保留行为与可逆性，
而「不会发生什么」往往比「会发生什么」更容易被误解（例如 `end_trial` 不自动联系候补下一位、
不恢复原候补名次、不代表家庭主动退园）。

## 时限语义色

单一映射，禁止各屏自行判定：

| 状态 | tone |
| --- | --- |
| 逾期 | danger |
| 今日到期 | warning |
| 未来 | info |
| 无时限 | quiet |

对应 kit 的语义 tone 来源，符合「Status 始终使用同一个语义 tone 来源」这条铁律。

## Active role

active role 是 shell 状态，不是授权。切换只改变导航与首页，不改变任何读取或动作的权限判定——
每次读取与动作仍需重新校验 workspace、institution、scope、assignment 与 grant 可见性。
本切片内 role 由 fixtures 提供。

## 数据披露约束

界面只展示契约允许的意向字段：孩子称呼、出生月份或年龄段、期望入园时间、目标班型、
照护时间需求、来源渠道、下次触点。联系方式一律显示为 My-Chat 持有的 opaque ref。
不出现法定姓名、完整出生日期、raw 手机号/微信/邮箱，不出现任何孩子、老师或班级的评分与排名。
