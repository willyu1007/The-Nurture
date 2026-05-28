<!-- INIT:STAGE-A:NFR -->

# Non-functional Requirements (NFR)

## Conclusions (read first)
- Security/privacy: 孕期、产后、家庭、儿童、健康状态、目标、行为记录、复盘和风险信号按高敏感数据处理；公共化必须经过脱敏、确认和 handoff owner 复核。
- Performance: 普通读取与 dashboard 更新应接近交互级；LLM/评估类步骤可异步，但必须有可见状态、超时和重试策略。
- Availability: The Nurture 可有独立服务端和数据库，但不可阻断 My-Chat 主产品；场景不可用时 chat/forum/knowledge 仍可降级运行。
- Compliance: 不承诺医疗或心理诊疗能力；默认避开诊断式、处方式和急救替代表述，保留人工确认、就医提示和审计证据。

## Security and privacy
- Data classification:
  - 高敏感：孕期状态、产后状态、孩子健康状态、孩子画像、年龄阶段事实、行为记录、家庭目标/价值观、复盘内容、风险信号、私域 artifact。
  - 中敏感：活动计划、日程安排、父母偏好、家庭资源约束、执行反馈。
  - 低敏感：公开活动对象元数据、已脱敏公开经验、聚合评分和公共讨论 refs。
- Authentication/authorization:
  - 依赖 `My-Chat` workspace/actor/session 权限模型。
  - 独立 web 操作台和场景服务端必须复用 `My-Chat` 身份、workspace、actor、permission 和 audit/evidence 约束。
  - 双亲共享家庭空间，但关键写入和公开化操作必须记录 actor、workspace、expected version 和 confirmation。
  - Chat/mobile/forum/RAG 等低信任 surface 不得直接读取 L3/L4 私密 artifact 正文。
- Audit/logging:
  - 高风险操作必须写 evidence：公开化、删除/撤回、风险信号确认、目标/价值观重大修改、handoff request/receipt、权限或共享变更。
  - Evidence 只记录 ids、versions、reason codes、policy/resolver keys、actor/workspace、trace/correlation metadata。
  - Evidence、outbox、logs 不得保存私域正文、prompt/provider payload、向量、对象 key、signed URL 或完整 before/after。
- Threat model notes:
  - 孕产妇或儿童健康状态被误判、过度解释或被用户当作医疗诊断。
  - 儿童敏感画像被过度暴露、过度推断或跨 surface 泄露。
  - 场景画像表错误替代 `My-Chat` canonical object identity，导致同一孩子/家庭跨场景不可统一。
  - 私聊/家庭记录未经确认进入论坛或知识库。
  - 社区反馈被误当作事实或专业建议。
  - 双亲权限、分歧和确认边界不清导致错误公开或错误决策。
  - workflow 内部事件被共享消费者误用，形成隐式契约。
- Compliance:
  - 明确非医疗、非心理诊断产品；风险字段只作为低确定性提醒。
  - 基础医疗建议只能用于健康信息整理、观察建议、问题清单、就医/复诊提示和急症升级提示。
  - 不输出诊断、处方、药物剂量、检查替代、急救替代或“无需就医”等高风险结论。
  - 面向儿童相关信息时采用最小化采集、目的限制、可解释引用和可删除/撤回链路。

## Performance and scalability
- Target latency:
  - Discovery、start requirements、dashboard summary：目标为交互级响应，失败时返回 safe unavailable reason。
  - Dashboard cards、run summary、artifact preview：应优先保证 My-Chat shared surfaces 快速读取；必要时用 projection 或预计算 safe presenter output。
  - Run execution、LLM generation、活动评估：允许异步执行，dashboard 必须显示 step 状态、失败原因和下一步 action。
  - Citation/preview：必须优先返回 safe summary，私密正文读取受权限和 exposure level 限制。
- Throughput:
  - 首版按早期场景模块设计，优先保证单家庭闭环和少量并发 workflow runs。
  - 社区/知识下游增长由 My-Chat 对应 owner 承担，The Nurture 只发 handoff 或 refs-only signal。
- Data size expectations:
  - 单家庭会长期积累目标、记录、复盘、计划和画像状态。
  - The Nurture 场景画像会附着在 My-Chat canonical objects 上长期增长，必须支持按 object ref、profile type、version 和 evidence 查询。
  - Dashboard 查询需要高频读取 run/card/action/artifact safe summary，因此数据库设计必须考虑 My-Chat dashboard 聚合查询效率。
  - 活动候选、社区信号和知识 refs 会持续增长，首版不要求完整活动市场。
  - Graph/presenter 视图应读取 canonical refs 和 projections，不复制事实来源。
- Scaling assumptions:
  - Postgres canonical + outbox/reread 模式足够支撑 MVP。
  - 独立数据库与同库独立 schema 均可接受；Stage B 需基于 dashboard、chat summary、web console 和 My-Chat owner 查询路径选择。
  - 后续可以增加专门活动库、搜索、向量或推荐，但不改变 standard workflow API。

## Availability and resilience
- Availability target:
  - 场景模块按生产可用组件设计，但不承担 My-Chat 全局 SLA。
  - 独立服务端/数据库故障时，My-Chat 应能展示该 scenario 暂不可用或只读状态。
  - The Nurture 停用或降级时，不影响 My-Chat chat/forum/knowledge 基础能力。
- Backup/restore expectations:
  - 依赖 My-Chat canonical Postgres 备份与恢复。
  - Workflow run、artifact refs、handoff、evidence、context bindings 必须可重放或可解释恢复。
- Failure modes and degradation:
  - LLM/评估步骤失败：run 标记失败或 retry_requested，dashboard 展示 safe reason。
  - 医疗/健康安全策略不确定：workflow 必须降级为建议咨询医生或专业机构，并停止生成具体医疗判断。
  - Context resolver 失败：Chat 只展示 conflict summary，不暴露 resolver 内部细节。
  - Handoff 下游不可用：保留 request 状态，等待 receipt 或重试，不直接写下游表。
  - 社区/知识不可用：不阻断家庭私域决策主链路。
  - The Nurture 深度操作台不可用：My-Chat dashboard 仍应能展示 safe card、不可用原因和可跳转/重试状态。

## Operability
- Observability:
  - 必须记录结构化日志、关键错误、run/step latency、handoff 状态、high-risk action evidence。
  - 关键指标包括推荐触发率、run 启动率、建议完成率、dashboard card 生成延迟、确认/取消率、复盘完成率、handoff 接收率。
  - 标准 workflow events 与 scenario internal events 必须能区分。
- Support workflows:
  - 支持按 run_id、handoff_id、artifact_id、actor_id、correlation_id 查证问题。
  - 管理员可禁用 scenario/capability、回滚策略版本、修复 projection 或撤回公开 handoff。
  - 医疗相关反馈应支持快速标记、人工复核、风险策略调整和能力降级。
  - 用户数据删除/撤回应触发下游 owner 清理或 invalidation。

## Verification
- Each section has measurable targets or explicit open decisions recorded in `risk-open-questions.md`.
