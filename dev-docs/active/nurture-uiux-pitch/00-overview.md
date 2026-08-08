# Overview — Nurture 六界面 UIUX 初稿 + 园长共创演示 HTML

## Status

- State: done
- **Phase:** E presenter/action contract handoff 已完成；A～D 已完成
- **Milestone/Feature:** M-002 / F-002（Institution ecology 的产品表面具象化与对外共创材料）
- **Updated:** 2026-08-08
- **Owner:** willyu1007
- Next step: My-Chat T-036 按
  `artifacts/presenter-action-contract-handoff.md` 消费精确 presenter/action 映射并冻结组件；
  receiver adoption 不属于 T-003 的剩余工作。后续共创反馈仍为非阻塞设计轨。

Receiver next actions:

1. T-036 admit 精确 contract key/version/digest，并读取 teacher board envelope。
2. 将 handoff fixture 的 queue/target/action 字段映射到 typed components，不补造字段或按钮。
3. 运行 receiver conformance，完成 privacy/product review 后冻结组件与 receipt states。

## Goal

两个耦合产出：

1. **产品 UIUX 初稿**：六个核心 surface 的第一版信息架构、模块构成与关键交互定义。
   这不是纯演示材料——它是后续 IIB（操作台 + 同意 UX）真实产品设计的第一稿输入。
2. **园长共创演示 HTML**：以六界面高保真可交互 demo 为主线的 16:9 翻页 deck，
   用于与托育机构（0-3）园长一对一首次沟通。概念内容极简（开场/收尾各一页），主要靠口头交流。

## Current Semantic Precedence

T-003 是设计输入，不是产品/实现 SSOT。当前 Workflow、对话和 surface 语义分别以
`docs/context/product/workflow-product-design-contract.md` 与 T-004～T-008 最新任务
决策为准：

- 当前产品 Workflow 只指园区管理 `InstitutionWorkflow`。
- Institution Web workbench 是主要操作面，Institution mobile board 只读投影关键内容与进度。
- Guardian/Caregiver 不建立共享聊天室、家园直聊或直接 DM；两侧消费
  `CareInteraction` 的角色安全投影。
- 家庭事项以精确 CareGroup 为业务主体；acknowledge 不表示个人接手，班级老师可
  追加多条班级回复，第一条只解除待回复 Attention 而不关闭事项。
- demo 中与以上规则冲突的画面/文字保留为共创历史，不得直接转译为实现要求。
- T-003 的任务状态、artifact 收尾或后续园长反馈不阻塞 T-004 contract baseline。
  反馈只有在被当前 T-004～T-007 产品合同明确吸收后才成为实现要求。

## 六个 surface（demo 主线，与 Pilot-0-B 锁定表面对应）

| # | Surface | 对应锁定表面 | 定位一句话 |
| --- | --- | --- | --- |
| 1 | 家长 mobile Chat（AI 互动 + 反向推送） | Guardian Nurture Chat | 随口说，AI 接住；园所动态到达处；跨边界必显式确认 |
| 2 | 家长 mobile 看板 | Guardian family board | 以家庭选定理念+长短期目标为核心的成长档案；机构是数据源之一 |
| 3 | 老师 mobile Chat | Caregiver Nurture Chat | 与家长同一套 My-Chat 界面；AI 按角色/场景自动判断处理与引导 |
| 4 | 老师 mobile 看板（班级工作台） | Caregiver teacher board | 老师最常用界面；类微信群交互过渡；拍照第一公民 |
| 5 | 机构 mobile 看板（只读） | Institution board (read-only) | 宏观 + 数据流 + 重点推送；设计未定，作共创话题 |
| 6 | 机构 Web 操作台 | Institution workbench | 便捷性展示：入托、沟通、数据归类、理念传达 |

## Non-Goals

- 不做任何代码/schema/manifest/runtime 实现（T-002 门禁不变，本任务纯设计+HTML 材料）。
- 不定最终视觉品牌；deck 配色（松林奶油）是演示定调，非产品 VI 决策。
- 机构侧两个 surface 不做完整设计（信息不足），以框架+共创提问呈现。
- demo 不承诺产品能力；开场定调"产品设想 · 共创讨论"。

## Acceptance criteria

- [x] 六个产品 surface 的 UIUX 初稿与 9 页自包含 HTML 已交付。
- [x] 当前有效设计决策已沉淀到 mobile UX contract，并与后续产品语义明确分层。
- [x] 六个 surface 已映射到 exact presenter/action contract，老师发布样例通过注册 schema。
- [x] My-Chat T-036 接收边界、superseded 语义和后续 adoption 责任均已明确。
- [x] handoff contract、focused presenter tests、surface conformance、文档与治理校验通过。

## Locked decisions

**当前有效规格的 SSOT 是 `docs/context/product/nurture-mobile-ux-contract.md`**（九轮拍板的
契约化终态）。要点速览（详见契约）：
- 板式：16:9 固定画幅左右翻页 deck，共 9 页；两侧箭头 + 顶部进度条；全文文本可编辑（可导出副本）。
- 品牌：全线 morethan tokens（与 My-Chat / web-workbench 同源）；松林绿降级为场景语义色。
  （早期"松林奶油"主配色已于第五轮被 morethan 替代。）
- demo 形态：家长/老师两台"整机可操作"手机 + 机构双端静态页；两段式发布、场景视图等均真实可点。
- 措辞：孩子泛称"宝宝"、无具体人名、无开发向词汇；文案平实自然档。
- 主线叙事：主事件"要不到东西就哭闹" + 日常场景贯穿。

## Key links

- **正式产出：`docs/context/product/nurture-mobile-ux-contract.md`**（本任务九轮设计决策的
  契约化沉淀，A/C/试点分层，IIB 与移动端实现的设计输入；已注册 context registry）

- 设计细节与讨论沉淀：`02-architecture.md`
- 阶段计划：`01-plan.md`
- 当前产品语义基准：`docs/context/product/workflow-product-design-contract.md`
  （Workflow/Action/Projection/Surface ownership）
- 机构生态设计包：`dev-docs/active/nurture-institution-mode/`（surface 锁定见 09/10）
- T-036 正式交接：`artifacts/presenter-action-contract-handoff.md`
- 老师发布 presenter 样例：`artifacts/teacher-release-presenter-fixture.v1.json`
