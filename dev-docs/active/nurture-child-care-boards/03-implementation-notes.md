# Implementation Notes — 儿童照护双看板

## 2026-07-29 — Task package created

- 创建 T-006 规划包。
- 将 Guardian family board 与 Caregiver teacher board 归为“同一事实、不同投影”的一个任务。
- 锁定 two-stage publish、AI 人工确认和 anti-ranking 边界。
- 当前无代码、schema 或 presenter 变更。

## 2026-07-29 — Workflow terminology and projection boundary aligned

- two-stage publish 统一命名为 `PublishProcess`，不属于当前园区管理 Workflow。
- Guardian/Caregiver board 可以消费与当前角色相关的
  `InstitutionWorkflowProjection` 外部切片，但不拥有 Workflow Run/Step。
- “相同角色”不是充分权限；projection 仍由 Workspace/scope/visibility policy 过滤。
- 当前仅更新规划文档，无代码、schema 或 presenter 变更。

## 2026-07-29 — D-01 operable shared projection boundary locked

- 用户确认双看板共享 canonical facts、模块语义、provenance、snapshot 与投影管线，
  但不新增持久化统一 child-state，也不使用跨角色超级 DTO。
- Guardian 与 Caregiver 使用角色独立的查询策略、fact-level policy 与 public
  presenter；不得先读取完整跨角色事实再在最终响应隐藏字段。
- “read snapshot 非 canonical”不等于“看板只读”。看板是可操作的领域投影窗口，
  允许低打扰内联微调。
- 展示偏好由 surface/host preference 承担；草稿、AI suggestion 与发布时间调整进入
  `PublishProcess`；attribution、focus 等业务调整调用对应 canonical owner capability。
- 已跨边界发布的内容不允许静默覆盖，继续使用明确的 correction、withdrawal、
  redaction 或 replacement 语义。
- 修改完成后通过 invalidation 与 owner-reread 重新投影；客户端 optimistic state
  不能成为权限、Receipt、ActionDelivery 或其他查询的事实来源。
- 当前只更新 T-006 规划合同，无应用代码、schema、数据库或 presenter 变更。

## 2026-07-29 — D-02 PublishProcess purpose boundary locked

- 用户确认 `PublishProcess` 是 caregiver-side 的家庭内容发布领域过程，不是终端产品
  需要暴露的功能名称。
- 它从一条园所内部采集被明确选为家庭发布候选时开始，管理 AI suggestion、归属、
  草稿微调、review、发送时机与发布前取消。
- 拍照、录入或上传成功本身不创建家庭发布；普通班级内部记录可以不进入
  `PublishProcess`。
- 过程在 Nurture 原子提交家庭可见发布事实与 Receipt，或发布前取消时结束。
- 它不拥有 device/upload、AI provider job、T-005 CareInteraction、My-Chat
  ActionDelivery 或 InstitutionWorkflow 的状态。
- AI 只建议；Guardian 只消费授权结果；scheduler/worker 只执行已获业务授权的技术
  调用，不能成为内容作者或审批人。
- 发布后通过 correction/replacement/redaction 等明确 capability 追加事实，不静默
  覆盖已发布内容。
- 当前只更新 T-006 规划合同，无应用代码、schema、数据库或 presenter 变更。

## Open Items

- D-01 已决定使用共享的请求期 projection pipeline 与角色独立 presenter；Phase 0
  仍需盘点哪些 landed facts 可直接复用、哪些需要 adapter 或局部可重建索引。
- daily care 与 attention 在产品上合并展示、领域上分开存储的契约方式。
- media upload ready / failed / removed 状态由哪一侧提供 canonical status。
- T-007 `InstitutionWorkflowProjection` 与 T-006 board external-slice 的最小共享 schema。
- D-02 已固定 `PublishProcess` 的产品用途和 owner 排除边界；精确发布单位、阶段、
  草稿自动保存、review role、scheduled/manual publish authorization、pre-publish
  cancel 与发布后 correction/replacement 衔接仍待逐项对齐。
