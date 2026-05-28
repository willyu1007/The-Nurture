<!-- INIT:STAGE-A:REQUIREMENTS -->

# Requirements

## Conclusions (read first)
- **Project**: The Nurture - 将 `The-Parents` 的育儿决策目标规范化为 `My-Chat` 框架下的标准场景模块。
- **In-scope (MUST)**:
  - 保留 `The-Parents` 的核心目标：围绕孕期/育儿阶段目标、孩子长期目标、阶段事实、家庭约束和候选活动，辅助宝妈和家庭做可复盘的决策。
  - 按 `My-Workflow-Base` 的 scenario/module/API/handoff 契约表达场景能力，作为 `My-Chat` 框架下的标准模块开发。
  - 场景可以拥有多条独立 workflow、独立 web 操作台、独立服务端和场景数据库，但所有对外消费、handoff、事件、权限和对象引用必须遵守 `My-Chat` 与 `My-Workflow-Base` 规范。
  - MVP 参考 `The-Parents` 的目标集合，先把核心育儿决策能力标准模块化，而不是裁成纯薄适配器。
  - 主要用户群体以宝妈/准妈妈为优先，同时支持共同参与的父亲、伴侣和其他监护人。
  - 场景周期从孕期开始，覆盖孕期管理、产后恢复、婴幼儿照护、儿童成长、家庭协作和阶段性教育/活动决策。
  - 长期目标本身也是一种 workflow 形态，可与短期安排、活动比较、复盘学习等 workflow 并存。
  - 本项目可以维护养育场景相关画像表，但画像必须贴附到 `My-Chat` canonical object，例如孩子、家庭、父母、活动对象。
  - 本项目可以维护孕期、产后、孩子健康状态和养育场景画像，并提供基础健康/医疗信息建议，但不得输出诊断、处方、急救替代或高确定性医疗结论。
  - 社区和知识库接入必须通过 `My-Chat` 和 `My-Workflow-Base` 规范化 handoff、public-ready draft、refs-only events 和下游 owner reread。
- **Out-of-scope (OUT)**:
  - 脱离 `My-Chat` 框架的独立育儿产品。
  - 绕过 `My-Chat` 标准消费面、权限、对象表和 handoff 规范的私有集成。
  - 独立聊天系统、独立论坛、独立 RAG/知识库、独立通知系统。
  - 用户自由编辑 workflow DAG、插件市场、动态执行用户上传代码。
  - 医疗、心理健康或发展诊断式结论、处方建议、剂量建议、急救替代或替代线下就医；首版只允许基础健康信息、风险提醒、就医建议和人工确认。
  - 首版复杂多平台日历/待办双向同步。
  - 绕过 `My-Chat` canonical owner 直接读写 forum、knowledge、notification、PPR 或 domain registry。
- **Primary users**:
  - 宝妈/准妈妈：孕期、产后、婴幼儿照护和长期育儿决策的主要使用者。
  - 双亲或监护人共同参与孩子成长决策的家庭。
  - 愿意持续输入家庭目标、孩子事实、活动记录并复盘结果的高参与度家长。
  - My-Chat 管理员/运营，用于发布、禁用、审核和观测该场景模块。
- **Top user journeys**:
  - 准妈妈围绕孕期阶段、产检事项、身体状态和家庭准备启动 pregnancy workflow。
  - 家长在聊天中提出短期育儿诉求，系统推荐并启动 The Nurture workflow。
  - 宝妈记录自己和孩子的健康状态，系统给出非诊断性提醒、观察建议和就医/复诊提示。
  - workflow 读取家庭目标、孩子阶段事实、家庭约束和候选活动，输出可解释的安排建议。
  - 家长在 mobile/web workflow dashboard 查看状态、预览建议、确认行动或取消。
  - 执行后记录结果和复盘，回流为 evidence 与 profile/context 更新依据。
  - 用户确认后，将脱敏的活动经验或复盘摘要 handoff 给 My-Chat forum/knowledge 链路。

## Technology direction (Stage A)
- Language/package: TypeScript + pnpm, aligned with `My-Chat`.
- Backend: NestJS for The Nurture scenario service, aligned with `My-Chat apps/api`; do not inherit the old `The-Parents` Fastify direction.
- Web console: Next.js App Router + React + Tailwind, aligned with `My-Chat apps/web/admin`.
- Database: Postgres + Prisma. The physical layout may be an independent database or a My-Chat database schema/table group; the decision should optimize My-Chat query efficiency, operational ownership, and canonical object attachment.
- Workers: follow My-Chat workflow worker pattern, with BullMQ/Redis if asynchronous steps need durable execution.
- Realtime/dashboard projection: expose safe workflow dashboard data through My-Chat's workflow dashboard contract and projection model; do not create a parallel realtime system unless Stage B proves a concrete gap.
- Auth/permission: reuse My-Chat Logto/OIDC, workspace, actor, permission, PBR, evidence, and audit boundaries.
- API style: standard Workflow API/adapters plus manifest-declared internal Web/Admin APIs where needed.

## Goals (MUST)
- 将 `The-Parents` 从独立产品目标收敛为 `My-Chat` 框架下的受控标准场景模块。
- 让育儿决策 workflow 能复用 `My-Chat` 的标准消费面：chat、mobile dashboard、forum publication、RAG/knowledge、notification、admin、worker runtime。
- 让短期安排建议显式引用长期目标、孩子阶段事实、家庭约束、活动模型和历史证据。
- 让孕期、产后、健康状态和基础医疗建议在受控安全边界内进入 workflow，而不是散落成一次性问答。
- 让每次关键决策都有可追踪的 run、artifact、action、handoff、evidence 和复盘结果。
- 避免把儿童敏感画像、家庭私域内容或未脱敏活动记录直接暴露给公共 surface。
- 允许 The Nurture 在规范内发展自己的 workflow 集合、web 操作台、场景服务端、场景数据库和画像模型。

## Non-goals (OUT)
- 不把本项目做成 `The-Parents` 的完整业务实现或前后端应用。
- 不把本项目做成脱离 `My-Chat` 的独立业务产品；但可以在 `My-Chat` 框架内拥有独立 web 操作台、服务端和场景数据库。
- 不重复定义 `My-Chat` 已拥有的通用聊天、论坛、知识库、通知、PPR、权限和审计产品能力。
- 不在 Stage A 决定数据库表结构、Prisma schema、API controller 或具体页面交互。
- 不承诺自动诊断孕产妇、孩子心理、健康或发展问题，不输出处方、剂量、急救替代或替代医生判断。
- 不把 Graph 作为首版核心主界面；关系图只作为辅助理解方式。

## Users and user journeys

### User types
- 宝妈/准妈妈：围绕孕期检查、身体状态、产后恢复、婴幼儿照护、家庭准备和长期养育目标使用本场景。
- 家长/监护人：输入长期目标、孩子事实、短期诉求、活动候选、执行结果和复盘反馈。
- 共同决策家长：查看对方观点、约束和确认记录，在关键安排前达成一致。
- My-Chat 管理员/运营：管理 scenario 状态、策略版本、风险配置、公开 handoff 与内容治理。
- 下游消费者：My-Chat forum、knowledge、notification、RAG 和 dashboard，只通过标准 refs、presenters 和 handoff 消费该 workflow。

### Top journeys (with acceptance criteria)
1. Journey: 孕期阶段管理 workflow。
   - Acceptance criteria:
     - [ ] 准妈妈可以基于孕周、产检计划、身体状态、家庭准备事项启动 workflow。
     - [ ] 输出只能包含阶段性提醒、准备清单、观察建议、就医/复诊提示和需要确认的问题。
     - [ ] 不输出诊断、处方、药物剂量、急救替代或高确定性医疗结论。
2. Journey: 聊天触发短期育儿决策 workflow。
   - Acceptance criteria:
     - [ ] Chat 可以基于用户诉求推荐 The Nurture scenario/capability，而不是调用场景私有 API。
     - [ ] 启动前能展示所需 start requirements，例如孩子阶段、家庭目标、短期诉求、候选活动和时间约束。
     - [ ] 缺失必要上下文时，Chat 只收集轻量需求或引导到 web/mobile，不直接做高风险决策。
3. Journey: 健康状态记录与基础医疗信息建议。
   - Acceptance criteria:
     - [ ] 用户可以记录孕期/产后/孩子健康状态、症状、观察、产检或儿保结论 refs。
     - [ ] 系统可以给出非诊断性观察建议、风险提醒、就医提示和问题清单。
     - [ ] 高风险或急性症状必须提示尽快联系专业医生或急救渠道，不能让 workflow 自行处理。
4. Journey: workflow 生成可解释的安排建议。
   - Acceptance criteria:
     - [ ] 输出至少包含推荐安排、主要权衡、长期目标关联、阶段约束、家庭约束和待确认项。
     - [ ] 建议能引用 canonical domain context refs 或 snapshot refs，而不是复制私域原文到事件 payload。
     - [ ] 高敏感风险只以提醒/需人工确认方式出现，不输出诊断式判断。
5. Journey: dashboard 承载运行状态与确认动作。
   - Acceptance criteria:
     - [ ] Mobile/web dashboard 能显示 run 状态、当前步骤、失败原因、artifact safe summary、可用 action。
     - [ ] approve/reject/confirm/cancel/retry 等写操作带 expected version、idempotency 和 actor/workspace metadata。
     - [ ] dashboard 不展示 L3/L4 私密 artifact 正文给低信任 surface。
6. Journey: 执行与复盘回流。
   - Acceptance criteria:
     - [ ] 用户可以记录执行结果、观察和复盘结论。
     - [ ] 复盘能绑定到原 run/artifact/action，并作为后续 context/evidence 的输入。
     - [ ] 复盘不会自动改写高敏感画像，必须经过明确策略和人工确认边界。
7. Journey: 公开讨论或知识链路 handoff。
   - Acceptance criteria:
     - [ ] 私域记录或建议不能直接发论坛；必须生成 public-ready draft 并脱敏。
     - [ ] handoff payload 只携带 refs、purpose、expected versions 和 trace metadata，不携带私域正文。
     - [ ] 下游 forum/knowledge owner 接收后重新读取 canonical state 并执行自己的权限、隐私和审核策略。
8. Journey: 长期目标作为 workflow 运行和演进。
   - Acceptance criteria:
     - [ ] 家庭可启动长期目标设定/校准 workflow，而不是只编辑静态配置。
     - [ ] 长期目标 workflow 能产出目标版本、价值权重、阶段策略和待复盘项。
     - [ ] 短期决策 workflow 能引用长期目标 workflow 的输出版本。

### Candidate workflow catalog
- P0 candidate: 孕期阶段管理，包括孕周事项、产检准备、身体状态记录、家庭准备清单和就医问题清单。
- P0 candidate: 长期目标设定/校准，包括家庭价值观、阶段目标、目标版本和阶段策略。
- P0 candidate: 短期育儿决策/安排，包括喂养、睡眠、出行、活动、学习和家庭日程中的具体安排。
- P0 candidate: 活动比较/活动建模，包括课程、兴趣、旅行、运动、娱乐和家庭活动的收益/成本/风险对比。
- P0 candidate: 健康状态记录与基础医疗信息建议，包括孕期/产后/儿童状态记录、非诊断性观察建议、风险提醒和就医/复诊提示。
- P0 candidate: 执行记录与复盘学习，把计划执行结果回流为 evidence、画像更新建议和下一步校准建议。
- P1 candidate: 喂养、睡眠、疫苗/儿保提醒、产后恢复、家庭协作和照护分工等垂直 workflow。
- P2 candidate: 完整活动市场、复杂知识图谱、深度日历/待办双向同步和跨机构健康数据集成。

## Functional requirements (MUST/SHOULD/MAY)

- MUST: 定义 The Nurture scenario 的 capabilities、entrypoints、steps、artifact policies、actions、surface mapping、handoffs 和 event registry。
  - Acceptance criteria: 任何 handler/action/presenter/policy key 都能与 manifest 或等价 TS contract 对齐。
- MUST: 支持多条孕育/育儿 P0 workflow，至少包括孕期阶段管理、长期目标设定/校准、短期育儿安排决策、活动比较/活动建模、执行记录与复盘学习；健康状态记录与基础医疗信息建议作为 P0 横向能力嵌入相关 workflow。
  - Acceptance criteria: 每条进入 MVP 的 workflow 都有 manifest/contract、handler registry、presenter、policy 和 deterministic journey harness。
- MUST: 支持独立 web 操作台，用于复杂输入、目标校准、画像查看、活动建模、复盘、人工确认和场景管理。
  - Acceptance criteria: web 操作台只能调用标准 Workflow API/adapter 或 manifest-declared internal API，不能绕过权限/evidence/handoff。
- MUST: 支持独立场景服务端和场景数据库。
  - Acceptance criteria: 场景服务端采用 NestJS；场景数据库采用 Postgres/Prisma；独立库或同库独立 schema 均可，但必须服务 My-Chat 查询效率；对 My-Chat canonical object 只保存 refs、bindings、scenario profile 或场景事实，不复制平台 canonical owner 的身份事实。
- MUST: 支持 Domain Context refs/snapshots/bindings，读取 family/child/goal/activity/review 等 canonical objects。
  - Acceptance criteria: workflow 不直接拥有或改写平台 domain registry 的 canonical objects。
- MUST: 支持 The Nurture 独立画像模型，并将画像贴附到 My-Chat canonical objects。
  - Acceptance criteria: 例如 `child A` 是 My-Chat 对象；The Nurture 可以维护 `nurture_child_profile`，通过 canonical object ref 绑定到 `child A`，且不阻止 `child A` 进入其他场景。
- MUST: 支持孕产妇和孩子健康状态的受控记录与安全建议边界。
  - Acceptance criteria: 健康状态表/画像必须贴附到 My-Chat canonical object；建议必须标注非诊断性质；高风险输入触发就医/急救提示；不生成处方、剂量或替代医生判断。
- MUST: 支持 dashboard 接入，覆盖 chat dashboard summary、mobile dashboard cards、web run workbench 和 The Nurture 深度 web 操作台。
  - Acceptance criteria: My-Chat dashboard surface 只消费 safe dashboard cards、run summary、artifact preview 和 action availability；The Nurture 深度操作台可展示更丰富的场景视图，但必须通过标准 Workflow API 或 manifest-declared internal API，并遵守 exposure level。
- MUST: 支持标准 ChatWorkflowAdapter 能力：recommend、submit_start_requirements、start_run、confirm_action、get_dashboard_summary、get_citation_package。
  - Acceptance criteria: Chat 只接收 safe summary、action availability、citation package 和 conflict summary。
- MUST: 支持 standard workflow events，事件 payload refs-only、no private body、no PII。
  - Acceptance criteria: 下游共享消费者不依赖 nurture-specific internal events。
- MUST: 支持 handoff 到 public draft/forum/knowledge 的受控链路。
  - Acceptance criteria: handoff 生成 request/receipt，实际发帖、索引、通知由 My-Chat 下游 owner 执行。
- SHOULD: 支持 web/admin internal scenario API，用于复杂导入、诊断、规则预览或人工修复。
- SHOULD: 支持关系视图/图谱式导航的 presenter，但不把图谱作为运行时事实来源。
- MAY: 后续扩展多个孕育/育儿子能力，例如备孕/孕期计划、产后恢复、喂养与睡眠、疫苗/儿保提醒、长期目标校准、活动库维护、旅行计划、兴趣探索、健康习惯复盘。

## Data and integrations (high level)
- Core entities:
  - Scenario、Capability、Run、Step、Artifact、Approval、Action、Handoff、Evidence。
  - Family、Mother/Expectant Mother、Parent/Guardian、Child、Pregnancy Stage、Postpartum Stage、Long-term Goal、Core Value、Development Constraint、Family Constraint。
  - Health State、Medical Observation、Care Reminder、Medical Advice Boundary、Care Provider Ref。
  - Short-term Need、Activity Candidate、Plan/Schedule Item、Journal/Event Record、Review Result。
  - Nurture Profile、Profile Dimension、Profile State、Profile Evidence、Profile Binding。
  - Public-ready Draft、Forum Post/Comment refs、Knowledge Candidate refs。
- External systems:
  - `My-Chat` workflow-contracts/runtime for standard contracts and runtime shell。
  - `My-Chat` canonical domain registry for family/child/goal/activity/review context。
  - `My-Chat` chat/mobile/web/admin surfaces for product consumption。
  - `My-Chat` workflow dashboard contracts for chat summary, mobile cards, web run detail, action execution and artifact previews。
  - `My-Chat` forum/knowledge/notification/RAG/PPR owners through handoff or outbox signals。
  - Calendar/todo systems are deferred; first version may produce internal schedule artifacts only。

## Constraints and assumptions
- Constraints:
  - `My-Chat` remains canonical host; The Nurture is a scenario module, not a separate product.
  - The Nurture may have independent workflow/web/server/db only inside the host framework and contract boundary.
  - Backend stack is NestJS; database stack is Postgres/Prisma.
  - Database physical layout must be chosen for My-Chat query efficiency and operational clarity; object identity remains My-Chat canonical even when scenario data is stored separately.
  - Dashboard output must use My-Chat workflow dashboard contract for shared surfaces; deep scenario console can be richer but cannot bypass Workflow API, permission, evidence, or exposure-level rules.
  - Postgres canonical state and outbox/evidence separation follow My-Chat and Workflow Base rules.
  - Standard workflow events are shared contract; scenario internal events are implementation details only.
  - Sensitive family/child data must stay private unless transformed into confirmed public-ready draft.
  - Pregnancy, postpartum, child health and medical-adjacent data are high-sensitive data and must not be publicized without explicit transformation, consent and downstream policy review.
  - Basic medical suggestions must stay informational and triage-oriented; diagnosis, prescription, dosage, emergency handling and provider replacement are out of scope.
  - All durable writes require idempotency, expected versions where applicable, actor/workspace metadata, and evidence for high-risk actions.
  - Scenario profiles must attach to My-Chat canonical objects and must not replace the object identity owner.
- Assumptions:
  - Families will tolerate lightweight structured intake if advice is visibly tied to their goals and context.
  - A first scenario can validate the value before building a full activity marketplace or standalone community.
  - My-Chat already has or will have the required host runtime, domain registry, forum/knowledge handoff, and mobile dashboard contracts.

## Verification
- This doc is considered complete when:
  - MUST requirements are actionable and testable.
  - Out-of-scope items are explicit.
  - Each top journey has acceptance criteria.
