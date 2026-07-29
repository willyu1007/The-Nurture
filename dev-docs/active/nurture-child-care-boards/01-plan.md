# Plan — 儿童照护双看板

## Phase 0 — Fact and Projection Inventory

- 盘点 T-002 中 focus、attention、daily care、media 和 publication 相关事实。
- 区分园所内部 raw capture、家庭发布候选、published care fact/visibility 与
  ActionDelivery；不得用一个状态表复制所有 owner 的生命周期。
- 将 T-003 两个 board surface 的模块映射到共享事实与角色投影。
- 列出缺失字段、权限来源和待解锁 gate。

## Phase 1 — Shared Care Read Model

- 建立 child-scope-first 的 care timeline / current focus / daily care 查询。
- 建立共享的 board projection pipeline，复用 canonical facts、模块语义、
  provenance、snapshot 和排序规则，但不持久化第二份统一 child state。
- 分别定义 guardian 与 caregiver 的查询策略、policy filter 和 public presenter；
  不建立先加载全部角色数据、再在 presenter 隐藏字段的跨角色超级 DTO。
- 对与当前角色相关的园区管理请求/结果，消费最小
  `InstitutionWorkflowProjection`；不读取 raw Run/Step 或园区内部备注。
- 固定空态、过期、撤回、更正和权限不足状态。

验收：

- 同一事实的两种投影保持一致 provenance。
- 任意 aggregate 均不能绕过 row/fact-level policy。

## Phase 2 — Caregiver Capture and Work Queue

- 定义快速记录、photo/media attribution、attention 和待办/待确认项目。
- 只有内部采集被明确选为家庭发布候选时才创建/进入 `PublishProcess`；普通班级记录
  可以保留在园所内部而不产生家庭发布。
- 支持草稿保存和后续继续，不把草稿直接发布给家庭。
- 支持低打扰内联微调：展示偏好可以本地更新，业务草稿/归属/focus/publication 调整
  调用对应 canonical owner 的 versioned capability；不得直接 patch read snapshot
  或 derived cache。
- AI provider 仅输出结构化建议，不直接提交。

## Phase 3 — Two-stage Publish

- 以 `PublishProcess` 管理 family-publication candidate 的草稿微调、review、发送时机、
  原子 publish 与 pre-publish cancel；精确状态、发布单位与授权规则由 D-03 冻结。
- 不把相机/上传、AI provider execution、T-005 `CareInteraction`、My-Chat
  `ActionDelivery` 或园区 `InstitutionWorkflow` 的状态合并进该过程。
- 在发布事务中重新读取 authority 并产生 receipt。
- 将已发布事实投影到 guardian board 和必要的 conversation item。

## Phase 4 — Qualification

- 跑同一孩子的 caregiver capture → review → family board receipt 旅程。
- 验证看板内联微调提交到正确 canonical owner，并在重新读取后反映；直接修改
  snapshot/cache 不得形成业务事实。
- 验证错误 child scope、撤销 grant、并发发布、重复提交和媒体归属。
- 验证没有 ranking、诊断或私域泄漏。

## Exit Gate

双看板黑盒旅程通过；宿主相机、原生列表性能和设备交互留给 My-Chat companion。
