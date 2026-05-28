<!-- INIT:STAGE-A:GLOSSARY -->

# Domain Glossary

## Purpose
Define domain terms used across requirements and implementation.

## Terms

### The Nurture
- Definition: `My-Chat` 框架下的孕育/育儿决策标准场景模块，用于把 `The-Parents` 的目标按规范转换为可接入的 workflow、web 操作台、服务端、数据库和画像能力。
- Synonyms: nurture scenario, parenting workflow scenario。
- Non-examples: 独立育儿 App、独立论坛、独立 RAG 系统。
- Notes: 项目继承 `The-Parents` 的目标，但接入边界遵守 `My-Workflow-Base` 和 `My-Chat`。

### My-Chat
- Definition: 宿主 AI 生态产品，提供 chat、forum、knowledge、workflow runtime、domain registry、mobile dashboard、notification、admin 等消费面。
- Synonyms: host product, 宿主平台。
- Non-examples: The Nurture 内部私有运行时。

### Workflow scenario
- Definition: `My-Workflow-Base` 中的一等场景对象，包含 scenario identity、capabilities、entrypoints、manifest/contract、handler/action/presenter/policy registry；在宿主规范允许下可配备独立 web 操作台、服务端和场景数据库。
- Synonyms: scenario module, 场景模块。
- Non-examples: 用户自由编辑的 DAG、插件市场包、一次性 prompt。

### Capability
- Definition: scenario 暴露的可启动能力，例如孕期阶段管理、短期育儿安排决策、健康状态记录、长期目标校准、活动比较。
- Synonyms: workflow capability, 场景能力。
- Non-examples: My-Chat 全局聊天、论坛发帖、知识库审核。

### Entrypoint
- Definition: capability 下的具体启动入口，定义输入要求、步骤顺序、允许 surface 和版本。
- Synonyms: workflow entrypoint。
- Non-examples: 未登记的内部 API。

### ChatWorkflowAdapter
- Definition: My-Chat chat surface 调用 concrete workflow 的标准 adapter，支持 recommend、submit_start_requirements、start_run、confirm_action、dashboard summary 和 citation package。
- Synonyms: chat workflow control adapter。
- Non-examples: Chat 直接调用 scenario internal API 或数据库。

### Workflow dashboard
- Definition: My-Chat 共享 workflow 消费面，用 dashboard cards、run summary、artifact preview 和 action availability 展示 run 状态并承载轻量确认动作。
- Synonyms: mobile dashboard, chat dashboard summary, dashboard cards。
- Non-examples: The Nurture 深度 web 操作台、原始私密 artifact 查看器、直接写知识库/论坛的按钮。
- Notes: Dashboard 只能展示 safe presenter output；写操作必须 canonical reread 并走 Workflow API action command。

### Web run workbench
- Definition: 面向 web 的 run 详情和操作面，可查看更完整的 run timeline、artifact preview、action 和 handoff，但仍遵守 Workflow API、权限、evidence 和 exposure level。
- Synonyms: web workflow workbench。
- Non-examples: 绕过 workflow ledger 的场景私有后台。

### The Nurture web console
- Definition: The Nurture 独立 web 操作台，用于长期目标 workflow、画像查看、活动建模、复盘、人工确认和场景管理等深度操作。
- Synonyms: nurture console, 场景操作台。
- Non-examples: My-Chat 全局 Admin、通用 forum/knowledge 管理台。
- Notes: 可以使用 manifest-declared internal API，但不能替代 My-Chat shared dashboard contract。

### Domain Context Ref
- Definition: workflow 面向 canonical domain object 的稳定引用，包含 namespace、object_type、object_id、version 和 owner_scope。
- Synonyms: context ref, canonical ref。
- Non-examples: 把家庭私域正文复制进 outbox payload。

### Context Snapshot
- Definition: workflow 在 run/step 中使用的冻结安全视图，用于保证执行时上下文可追踪。
- Synonyms: snapshot ref。
- Non-examples: 可随时变化的 UI projection。

### Context Binding
- Definition: 记录某个 run/step/artifact 依赖了哪些 context refs/snapshots/versions 的 ledger 记录。
- Synonyms: binding record。
- Non-examples: 普通日志行。

### Handoff
- Definition: workflow 向 forum、knowledge、notification、RAG 等下游 owner 提交的请求/回执契约，只传 refs、purpose、versions 和 metadata。
- Synonyms: handoff request, handoff receipt。
- Non-examples: workflow 直接写论坛帖子、知识 chunk、通知投递或 embedding。

### Public-ready draft
- Definition: 从私域记录、建议或复盘中生成的可公开草稿，经过脱敏、风险标记和用户确认后才可进入论坛/知识链路。
- Synonyms: 公开化草稿。
- Non-examples: 私聊原文、家庭原始复盘、未脱敏 artifact。

### Artifact
- Definition: workflow run 产生的结构化输出或可展示预览，带 exposure level、safe title/summary、source refs 和 storage refs。
- Synonyms: workflow artifact。
- Non-examples: 无版本、无来源、无权限边界的临时 UI 文本。

### Evidence record
- Definition: 对权威写入或高风险操作的最小解释性记录，用于合规、调试和重放解释。
- Synonyms: evidence log。
- Non-examples: 全量审计产品、私域正文副本、prompt/provider payload。

### Long-term goal
- Definition: 家庭对孩子成长方向的长期目标或价值导向；在 The Nurture 中它既是短期决策评价标准，也可以是一条独立 workflow 的输入和产出。
- Synonyms: 长期目标。
- Non-examples: 单次活动偏好。

### Mother / expectant mother
- Definition: The Nurture 的优先用户和 canonical object 之一，覆盖备孕、孕期、产后恢复、婴幼儿照护和家庭育儿决策中的主要照护者。
- Synonyms: 宝妈、准妈妈、孕产妇用户。
- Non-examples: 医疗机构账号、医生账号。
- Notes: 健康相关数据属于高敏感信息。

### Pregnancy stage
- Definition: 与孕周、产检节点、身体状态、家庭准备事项相关的阶段上下文。
- Synonyms: 孕期阶段、孕周阶段。
- Non-examples: 医疗诊断结果本身。

### Health state
- Definition: 用户记录的孕期、产后、孩子身体状态、症状观察、儿保/产检结论 refs 和相关证据。
- Synonyms: 健康状态、身体状态。
- Non-examples: 医生诊断、处方、急救处理方案。
- Notes: 可以进入 workflow 作为 context，但输出必须遵守基础医疗建议边界。

### Basic medical guidance
- Definition: 非诊断性的健康信息整理、观察建议、问题清单、就医/复诊提示和急症升级提醒。
- Synonyms: 基础医疗建议、健康提醒。
- Non-examples: 诊断、处方、药物剂量、检查替代、急救替代、无需就医判断。

### Scenario profile
- Definition: The Nurture 维护的孕育/养育场景画像，例如 mother/child/family/parent/activity 的画像维度、状态、趋势、证据和置信度。
- Synonyms: nurture profile, 场景画像。
- Non-examples: My-Chat canonical object identity、全平台通用用户身份、医疗诊断档案。
- Notes: 场景画像必须通过 canonical object ref 贴附到 My-Chat 对象，例如孩子 A、家庭 B、活动 C；同一 canonical object 可以被其他场景继续使用。

### Canonical object
- Definition: `My-Chat` 数据库中的平台对象身份，例如宝妈/准妈妈、孩子、家庭、父母、活动对象或其他跨场景对象。
- Synonyms: My-Chat object, platform object。
- Non-examples: The Nurture 私有画像行、workflow artifact、临时 UI projection。

### Development constraint
- Definition: 与孩子年龄阶段和通用发展规律相关的适配性约束。
- Synonyms: 阶段约束、通用发展约束。
- Non-examples: 某个家庭当天的时间限制。

### Family constraint
- Definition: 家庭本地的预算、时间、节律、父母精力、交通和协作边界。
- Synonyms: 家庭约束。
- Non-examples: 通用年龄阶段规则。

### Activity candidate
- Definition: 可被评估和安排的活动对象，例如课程、旅行、运动、娱乐、学习任务或家庭活动。
- Synonyms: 活动候选、活动对象。
- Non-examples: 无法执行或无法复盘的抽象建议。

### Review result
- Definition: 用户执行计划后的结果记录、观察和复盘结论，用于后续证据和 context 更新。
- Synonyms: 复盘结果。
- Non-examples: 未绑定 run/action 的随手笔记。

## Entity list (optional)
- Entity: Scenario
  - Key fields: scenario_key, status, manifest_version, policy_version, aggregate_version
  - Lifecycle: draft -> pilot -> active -> disabled/archived
- Entity: Family
  - Key fields: workspace_id, guardians, children, goals, constraints
  - Lifecycle: created -> active -> archived/deleted
- Entity: Mother / Expectant Mother
  - Key fields: canonical_object_ref, pregnancy_stage_refs, postpartum_stage_refs, health_state_refs
  - Lifecycle: created -> active -> archived/deleted
- Entity: Child
  - Key fields: age_stage, profile refs, risk signal refs
  - Lifecycle: created -> updated -> archived/deleted
- Entity: Health State
  - Key fields: health_state_id, canonical_object_ref, state_type, observed_at, evidence_refs, risk_flags, care_provider_refs
  - Lifecycle: recorded -> reviewed -> superseded -> archived/deleted
- Entity: Nurture Profile
  - Key fields: profile_id, canonical_object_ref, scenario_key, dimension_key, state, confidence, evidence_refs, version
  - Lifecycle: draft -> active -> superseded -> archived/deleted
- Entity: Workflow Run
  - Key fields: run_id, scenario_key, capability_key, entrypoint_key, status, aggregate_version
  - Lifecycle: created -> running -> waiting/failed/completed/canceled
- Entity: Workflow Dashboard Card
  - Key fields: run_id, scenario_key, capability_key, entrypoint_key, title, status, requires_attention, action_availability, aggregate_version
  - Lifecycle: projected -> refreshed -> invalidated
- Entity: Handoff Request
  - Key fields: handoff_id, source refs, requested_purpose, downstream_owner, expected_versions
  - Lifecycle: requested -> accepted/rejected/invalidated/receipt_recorded

## Verification
- All nouns used in `requirements.md` are defined here (or explicitly marked as common language).
