# Overview — 六个核心 Surface 的产品契约基座

## Status

- State: in-progress
- Task: T-004
- Milestone / Feature: M-002 / F-003
- Phase: Phase 0 discovery/gate reconciliation, Phase 1 normative surface
  source, Phase 2 exact typed contract/interface identity and Phase 2 quality
  closure complete; Phase 3 in progress — P3-0 synthetic world source freeze
  complete, P3-1 per-journey initial states next.
- Updated: 2026-07-31
- Next step: 实施 P3-1 per-journey 独立初始状态，随后 P3-2 Journey scripts、
  P3-3 selection fixtures、P3-4 fixture manifest/canonicalization；随后进入
  Phase 4 synthetic qualification。不得把 synthetic PASS 写成
  owner-integration PASS。执行拆解（P3-0～P3-4 与边界规则）见
  [`07-phase-3-fixture-journey-decomposition.md`](./07-phase-3-fixture-journey-decomposition.md)。
- Current gate: T-002 ingress M0-M4 已完成；exact owner pin 仍为 My-Chat
  `f00b868`，浮动 checkout 与该 pin 不同，因此 Owner Integration 保持 NO-GO；
  pin-advance decision input 见 T-002
  `15-mychat-drift-census-pin-advance-input.md`。
  P3-0 后 current exact interface 为
  `nurture.surface-contract@1.1.0` /
  `sha256:8fb13498ca7c925a369f03fb103e6728e2f3b07b6039e2c9e5604f1d7bcefbcb`；
  shared core 与全部既有 capability/surface slice hash 与 1.0.1 基线字节一致
  （由 `phase-3-world.test.ts` 机械守卫）。dependency evidence 仍在比较前严格
  校验；generated manifest 必须匹配独立可信 artifact pin。所有 protected
  capability 继续 default-off。

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
- T-007 D-04 visibility addendum：家长发送前已披露为园区业务渠道的沟通，可通过
  精确 Institution/Enrollment/CareGroup/Grant/purpose owner-read projection 向
  `institution_admin` 返回当前正文/附件；不开放家庭私密 AI/草稿/私人聊天，也不
  授予 CareGroup reply 权限。
- capability-first queries / commands 与 surface-first presenter / view-model 的版本化契约。
- machine-readable capability descriptors：domain/execution/delivery 三轴分类、intent、
  typed input/result/error schemas、eligibility policy reference、target/confirmation/
  concurrency policy 与 handler/presenter binding。
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
- G1 start 即允许 T-005～T-007 同步进行不依赖最终 owner path 的产品状态设计、
  纯领域/policy 逻辑、presenter 设计和隔离 synthetic fixtures。
- Contract Boundary PASS 开放针对 exact public contract 的正式实现；Owner Integration
  Readiness PASS 开放隔离的真实 adapter 集成；Joint Conformance PASS 才开放 protected
  qualification 与 Beta Profile Handoff。
- G1 最终 Joint Conformance 必须通过 production-intended NestJS scenario-service
  ingress；Fastify dev-host 只可提供 provisional owner-readiness evidence。
- 在 T-002 对应的身份、授权、owner-reread、receipt、host pin 门禁未满足前，只允许契约设计与本地合成数据验证，不得宣称跨仓集成或真实流量可用。

## Acceptance Criteria

- [ ] 六个 surface 均有明确的 actor、workspace、read/write、child scope 和数据敏感度定义。
- [ ] Institution Admin 园区业务沟通 read 与 CareGroup action authority 分离：
  Admin 可在披露且精确授权的渠道读取，不因读取获得 acknowledge/reply/correction/
  redaction；家庭私密 AI、草稿、私人聊天和其他 Institution 保持不可见。
- [ ] 所有跨家庭/机构边界的动作均显式授权、可审计，并明确其
  correction/withdrawal/redaction/irreversible 边界；任何动作都不得静默覆盖或删除历史。
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
- [ ] capability catalog 用独立的 domain、execution 和 delivery 字段区分
  `CareInteraction`、`ActionExecution`、`ActionDelivery`、`PublishProcess` 与
  `InstitutionWorkflow`；不得把 domain/process/transport 混进一个枚举，也不以
  异步/跨 owner 作为 Workflow 分类条件。
- [ ] capability-specific typed input 只包含业务字段；target、typed concurrency
  heads、actor/scope 与 idempotency 分别属于通用 invocation/confirmation contract。
- [ ] capability descriptor 声明 concurrency summary class 和逐项 head bindings；
  exact-state transition 可冻结版本并显式声明 already-satisfied convergence，
  append-compatible action 冻结 lifecycle/authority heads，不能一律使用
  whole-aggregate strict CAS。
- [ ] Board envelope 可以承载 Workflow projection，但不包含 raw Run/Step 或
  绕过 current authority 的 action payload。
- [ ] discovery、surface response 与 invocation 均携带 exact interface contract
  key/version/digest；不存在 version range、mutable `latest` 或 digest 缺失时的 fallback。
- [ ] conformance manifest 逐 capability/surface 记录 canonical slice hash；证据
  失效范围由 slice hash 机械判定，additive 新增不失效既有证据；conformance suite
  可单命令确定性全量重跑。

## Next Step

T-004 顶层决策已收敛：契约组织、共享引擎边界、semantic UI、Journey Portfolio、
Identity/Grant、多机构、Chat/Board、T-002 parallelism、Service/API 边界与 interface
identity ownership 均已锁定。本轮合同审阅进一步固定了 descriptor 三轴分类、最小
envelope、contract identity/digest、组合式 concurrency heads 与 exact-state convergence。
G1-01～G1-07 进一步锁定渐进并行、四层 identity/authority、transactional Receipt/
Execution、exact public contract、formal NestJS ingress、三层资格化与三类交付/
失效规则。Phase 0 已完成现有 manifest/module/presenter/repository port 的复用/
扩展/门禁矩阵和 artifact-set 落点；T-002 ingress M0-M4 与 T-004 Phase 1-2
normative/exact contract 已随后落地。Phase 2 已生成可重建的 exact digest、shared
core hash、10 个 capability slice、6 个 surface slice、strict loader/admission 和
deterministic build/verify。Phase 0
结论见
[`06-phase-0-discovery-and-gate-matrix.md`](./06-phase-0-discovery-and-gate-matrix.md)。
当前进入 Phase 3 fixtures/Journey；随后与 T-002 M5 Owner Integration Handoff
汇合执行 Joint Conformance。不得用当前 Phase 2 artifact 或后续 synthetic
evidence 替代真实 owner gate。
