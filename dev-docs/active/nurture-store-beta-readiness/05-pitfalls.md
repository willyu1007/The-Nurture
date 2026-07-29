# Pitfalls — Store Beta Readiness

## Known Guardrails

- 不要把“CI 绿”或“设计已完成”当作 store-beta readiness。
- 不要在 The Nurture 内创建独立 native shell 或复制 My-Chat runtime。
- 不要把 My-Chat/Nurture 的接口集成写成代码/Candidate bundle adoption，也不要使用 floating interface contract、未固定服务候选或可变 environment binding。
- 不要把 TestFlight Internal / Play Internal 通过写成 external beta 或生产授权。
- 不要把 store credentials、签名材料、真实儿童 PII 放入任务证据。
- 不要在 contract defect 后继续沿用旧 evidence；修复后必须重新 freeze。
- 不要仅因为异步、跨 owner、需要重试或会被看板展示，就把动作或投递重新命名为
  Workflow；产品 Workflow 当前只指园区管理 `InstitutionWorkflow`。
- 不要让园区移动看板变成第二个 Workflow 操作入口；它只消费角色安全的
  `InstitutionWorkflowProjection`，主要操作仍在 Institution Web workbench。

## Resolved Pitfalls

当前尚未进入 candidate qualification。实际问题解决后按 symptom、root cause、attempts、fix、prevention 记录。
