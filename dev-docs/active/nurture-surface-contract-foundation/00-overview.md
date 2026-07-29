# Overview — 六个核心 Surface 的产品契约基座

## Status

- State: planned
- Task: T-004
- Milestone / Feature: M-002 / F-003
- Updated: 2026-07-29
- Next step: 顶层决策已收敛；进入 Phase 0 discovery，盘点现有 manifest/module/contracts 与 T-002 可复用/受阻边界。

## Goal

把 T-003 的六界面设计沉淀转换为可实现、可测试、可被 My-Chat 消费的产品契约基座。该任务统一六个 surface 的角色、工作区、可见性、动作、状态、回执、错误与分页语义，并提供 engine-ready capability catalog、跨角色合成数据和验收旅程。

## Scope In

- 六个 surface 的产品级职责与边界：
  - Guardian Nurture Chat
  - Guardian family board
  - Caregiver Nurture Chat
  - Caregiver teacher board
  - Institution board（mobile read-only）
  - Institution workbench（Web）
- actor / role / workspace / child scope / visibility 矩阵。
- capability-first queries / commands 与 surface-first presenter / view-model 的版本化契约。
- machine-readable capability descriptors：intent、typed schemas、eligibility policy reference、side-effect/confirmation class 与 handler/presenter binding。
- atomic surface envelope，以及 Conversation timeline、Board semantic modules、Workbench Hub/List/Insight 三类语义内容模型。
- Nurture-owned 内容、状态、语义顺序与 capability affordances；终端视觉/布局继续归 My-Chat。
- Workflow 术语与投影基线：当前产品 Workflow 只指园区管理
  `InstitutionWorkflow`；Web 是主要操作面，boards 只消费角色安全
  `InstitutionWorkflowProjection`。
- capability selection 的确定性过滤、正确选择、澄清与拒绝 fixtures。
- 一套不含真实个人信息的合成 fixture 数据。
- Golden Journey Portfolio：GJ-1 家庭关注流向照护者、GJ-2 照护日常流向家庭、GJ-3 多源事实沉淀为成长连续性、GJ-4 入托/家长确认/授权建立、GJ-5 机构理念流向日常支持，以及 RJ-1 撤权/纠正/恢复。
- Identity Baseline：正式 surface 使用 parent-authorized bound identity；一个 ChildCareProcess 可有多个隔离的 Institution Enrollment，GrantRequest/Grant 均绑定具体 Enrollment。
- Guardian Chat 负责跨当前授权来源的 child-centered 总结；家庭看板负责需要选择 Institution Enrollment 的开放式写操作。
- T-002 并行策略：contract-first parallel + activation fence；synthetic contract qualification 可先行，真实 owner integration 与 candidate activation 分别等待精确 contract/pin。
- 服务/接口边界：Nurture 独立冻结不可变 Service Candidate；My-Chat 不采用代码或 bundle，只通过认证接口消费 versioned contract；真机证据使用 composite validation binding 关联两侧。
- identity 职责：T-004 只定义 interface contract identity/compatibility；Service Candidate identity 属于 T-008，composite validation binding 属于 T-008 + My-Chat companion，二者均不阻塞当前 surface contract。
- 覆盖家庭、照护者和机构三类角色、六个 surface 的独立黑盒旅程。
- My-Chat 消费侧需要遵守的 pin、兼容性和默认关闭约束。

## Scope Out

- My-Chat 的 React Native / Web 页面、导航、登录、推送或宿主运行时。
- 跨 Scenario capability 语义检索、共享 LLM router、通用 tool-execution engine 或 provider SDK 调用。
- 任意 component tree、像素级布局协议或通用 server-driven UI。
- 独立产品壳、独立身份体系，或复制 My-Chat 代码。
- 生产激活、流量迁移、应用商店分发与证书管理。
- 未经监护人授权创建或推断平台 `child_id` / `family_id`。

## Dependencies and Gates

- 设计输入：`docs/context/product/nurture-mobile-ux-contract.md` 与 T-003。
- 平台和领域输入：T-002 及 `docs/context/workflow/nurture-scenario-contract.md`。
- 在 T-002 对应的身份、授权、owner-reread、receipt、host pin 门禁未满足前，只允许契约设计与本地合成数据验证，不得宣称跨仓集成或真实流量可用。

## Acceptance Criteria

- [ ] 六个 surface 均有明确的 actor、workspace、read/write、child scope 和数据敏感度定义。
- [ ] 所有跨家庭/机构边界的动作均显式授权、可审计、可撤回或可更正。
- [ ] public API 与 presenter/view-model 契约可由 My-Chat 在不访问 Nurture 数据库的前提下消费。
- [ ] capability catalog 可由未来共享 discovery/invocation protocol 消费，但 T-004 不依赖该共享引擎落地。
- [ ] LLM 选择只发生在 deterministic policy 过滤后的候选集中，执行端仍重新验证所有业务前置条件。
- [ ] 三类 surface content family 均有稳定 envelope、强类型 item/module 和兼容性规则。
- [ ] 当前参考呈现能够验证产品语义，但不绑定 My-Chat 的组件、布局或 shell。
- [ ] 合成 fixture 和跨角色旅程能稳定复现六个 surface 的核心状态。
- [ ] 六条 Journey 共用版本化 synthetic world，但每条从独立可重复的初始状态运行，不依赖上一条 Journey 的可变结果。
- [ ] 每条产品 Journey 同时证明一个用户价值闭环和最高风险拒绝路径；RJ-1 证明跨 surface 的 revoke/correction/recovery。
- [ ] 契约明确默认关闭、失败关闭、兼容性 pin 和非诊断健康表达。
- [ ] 未引入 My-Chat ORM、宿主 runtime、shell 或 canonical identity 的本地副本。
- [ ] capability catalog 明确区分 `ActionExecution`、`ActionDelivery`、
  `CareInteraction`、`PublishProcess` 与 `InstitutionWorkflow`，不以异步/跨 owner
  作为 Workflow 分类条件。
- [ ] capability-specific typed input 只包含业务字段；target、expected version、
  actor/scope 与 idempotency 分别属于通用 invocation/confirmation contract。
- [ ] capability descriptor 声明 concurrency precondition class；exact-state transition
  可冻结版本，append-compatible action 冻结 lifecycle/authority heads，不能一律使用
  whole-aggregate strict CAS。
- [ ] Board envelope 可以承载 Workflow projection，但不包含 raw Run/Step 或
  绕过 current authority 的 action payload。

## Next Step

T-004 顶层决策已收敛：契约组织、共享引擎边界、semantic UI、Journey Portfolio、Identity/Grant、多机构、Chat/Board、T-002 parallelism、Service/API 边界与 interface identity ownership 均已锁定。下一步进入 Phase 0 discovery，盘点既有 manifest、module、presenter、repository port 与 context contract，并把结果标为复用、扩展、owner-integration-gated 或 activation-gated。
