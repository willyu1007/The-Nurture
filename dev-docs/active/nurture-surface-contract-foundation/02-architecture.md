# Architecture — 六个核心 Surface 的产品契约基座

## Locked Decision — Engine-ready, not Engine-complete

T-004 采用“语义发现平面 + 确定性执行平面”。它发布可机器发现的 capability descriptors 和 typed execution contracts，但不建设跨 Scenario 共享引擎，不调用 LLM provider，也不把该平台能力作为六 surface 交付前置条件。

## Product Terminology Contract

- `InstitutionWorkflow`：当前仅限园区管理的可恢复业务过程。
- `InstitutionWorkflowRun`：My-Workflow Runtime 中的一次实例。
- `InstitutionWorkflowProjection`：供 mobile/Web/其他授权 surface 消费的角色安全读模型。
- `ActionExecution`：submit/acknowledge/reply 等原子领域动作。
- `ActionDelivery`：Handoff/Outbox/notification/retry 等宿主技术投递。
- `CareInteraction`：家庭与照护者的 Message/CareItem/Event/Receipt 闭环。
- `PublishProcess`：caregiver draft/review/publish 状态机。

T-004 descriptor MUST 显式声明 operation class，不得因为 capability 异步、跨 owner、
需要 worker 或产生通知就标记为 Workflow。

## Two-plane Contract Model

### Discovery / Selection Plane

- Nurture owns capability intent、version、typed schema refs、operation/side-effect class、confirmation requirement、eligibility policy reference 与 presenter binding。
- deterministic eligibility 先依据 actor、role、workspace、child scope、grant、fact visibility 与当前状态过滤。
- selection fixture 可以验证正确候选、澄清、确认和拒绝，但 T-004 不负责 embedding、语义 Top-K 或模型调用。

### Execution / Presentation Plane

- queries 与 commands 按业务 capability 组织。
- handlers 保持强类型，并在执行时重新校验 authority、input、declared concurrency precondition、idempotency 与 confirmation。
- presenters 按六个 surface 组织，只把已授权的 capability 结果转换为 role-safe view-model。
- LLM 的建议或选择没有授权效力。

### Invocation, Business Input and Preconditions

- capability-specific `typedInput` 只包含用户实际提供的业务字段，不携带 actor、
  Workspace、raw target、Grant、expected version、command identity 或 transport retry metadata。
- generic invocation context 携带 authenticated principal、surface、capability/version
  与 owner-issued opaque target ref；target ref 不是 authority。
- capability descriptor MUST 声明 concurrency precondition class：
  `exact_state`、`lifecycle_authority` 或 `append_compatible`。
- `prepareAction` 在当前 owner state 下解析精确 target 和该 capability 所需的
  entity/authority/policy heads，并把它们连同 actor/scope、canonical input hash、
  expiry 和 stable command identity 绑定进 opaque `confirmationRef`。
- `exact_state` action 比较 prepare 时冻结的 work-state version；不得重新解释为
  “使用当前最新版本”。
- `append_compatible` action 只要求 lifecycle/authority/policy 仍允许追加；其他合法
  append 不构成冲突。T-005 reply 属于该类。
- concurrency precondition 解决 stale intent/invalid lifecycle；CommandExecution
  identity 解决 transport retry/exact replay。两者不得压缩成同一个字段。
- 当前 Harness 不再引入第二个重复携带 concurrency heads 的 action token；surface target ref
  负责选择对象，`confirmationRef` 负责确认与并发 precondition。

## Ownership Boundary

The Nurture owns:

- 场景 manifest、handlers、actions、presenters、policies、repository ports 和本地 projection。
- 本地 child profile / care process，以及它们到 My-Chat opaque `child_id` / `family_id` 的绑定。
- 照护事实、授权来源、发布状态、回执和 owner-reread 语义。

My-Chat owns:

- canonical identity、auth、shared Workflow Runtime、routes、workers、outbox 和 ledgers。
- chat/mobile/web shell、navigation、push、notification、admin 和应用商店构建。

## Contract Layers

1. Capability catalog：机器可读的能力语义与 schema references，不包含权限结论。
2. Domain facts：Nurture 内部领域实体，不暴露 Prisma。
3. Policy and authority：将 actor、opaque identity、grant 和 child scope 计算为允许/拒绝。
4. Typed application queries / commands：按 capability 组织的稳定调用面。
5. Surface presenters：面向六个 surface 的 role-aware view-model。
6. Host adapter contract：My-Chat 使用精确版本 pin 调用，不获取数据库访问权。
7. Conformance contract：fixtures、selection cases 与预期 outputs；不进入生产运行。

依赖方向只能由 catalog/surface/host contract 指向 typed application contract，再指向 policy/domain/repository；domain 不得依赖 surface 或 LLM。

## Runtime Ownership and Evolution

- T-004（当前）：engine-ready descriptors、eligibility contract、typed handlers 和 fixtures。
- T-005（后续实现）：Guardian Chat 采用 Nurture 预过滤后的 child-context 聚合，不建设机构 API 路由；目标化跨边界写入以看板为主。
- My-Workflow-Base / My-Chat（独立后续）：跨 Scenario discovery、语义检索、统一 LLM tool selection、telemetry 与 generic invocation engine。
- Nurture 永不直接导入 provider SDK；模型调用由 My-Chat 的统一 LLM gateway 承担。

## Identity, Enrollment and Grant Baseline

身份就绪度由四个相互独立的轴计算，不落成一个 `provisional → bound → enrolled → granted` 状态枚举：

1. My-Chat identity binding：家长创建或明确授权建立的 canonical Child/Family，以及 Nurture typed anchors/workspace associations。
2. Family relationship：当前 Family、Guardian RoleAssignment 与 family-side policy。
3. Institution relationship：每个 Institution 独立的 Enrollment、当前 CareGroup/Caregiver scope 与 lifecycle。
4. Data authorization：绑定具体 Enrollment、scope、data class、direction 与 purpose 的 current Grant。

六个正式 surface 不把 product-visible provisional child 纳入产品基线。当前项目使用版本化 synthetic bound fixtures 推进；真实 My-Chat adoption 必须走家长授权的 binding。没有该 authority 时，Nurture 可以保留本地 setup/draft，但不能 mint/infer global identity，也不能进入六 surface 的正式已绑定路径。Institution `RosterEntry` 只是 intake/audit，不是 provisional child、Enrollment 或 Grant。

surface envelope 的总体状态为 `ready | limited | needs_setup | unavailable`；route 可达不等于 module/action 可用，每个 capability 仍按当前四轴、版本、policy 与 fact lifecycle 独立计算 eligibility。

### Multi-institution isolation

- 一个 ChildCareProcess 可以同时或先后拥有多个 Institution Enrollment；这不是一个 Institution 下的 Campus 层级。
- 每个 Enrollment 拥有独立的 Institution、CareGroup、GrantRequest、Grant、Thread/content 与 receipt scope。
- Institution A 只能解析自己的 Enrollment 切片，不能获知 Institution B 的存在、数量、名称、状态、Grant 或内容。Guardian family surfaces 可以在当前 family-side policy 下聚合自己可读的多 Institution 来源。
- Enrollment 只建立机构照护关系，不授权数据流动。转机构、重新入托或新的 Enrollment 必须重新申请和确认 Grant；旧 authority 不携带、不合并、不复活。
- 试点只有一个 Institution，可把唯一 eligible Enrollment 作为确定性产品简化；公共 contract 和 fixtures 必须保留多个隔离 Enrollment 的语义。

### GrantRequest and Grant authority

- Institution 只能针对自己的 current Enrollment 提交 allowlisted GrantRequest；申请绑定 exact Institution/Enrollment/CareGroup scope、data classes、directions、purposes、期限与安全说明。
- GrantRequest 是请求和送达状态，不是访问权。pending、declined、expired、cancelled 或 superseded 均不允许读取、发送或聚合受保护事实。
- 首期由 authorized Institution operator（当前 profile 为 `institution_admin`）在 Institution Web workbench 发起；Institution mobile board 只呈现安全 readiness/pending aggregate。My-Chat owns notification/device delivery，Nurture owns request scope、lifecycle 与确认结果。
- 任一当前、精确 Family 的 Guardian 可以首次强确认。首个成功确认者写入 `grantedByParticipantId` 并成为 sole replace/revoke owner；其他当前 Guardian 可以在 policy 允许时查看和使用 active Grant，但不继承或转移其所有权。
- Institution Admin、Caregiver、Technical Operator 不能代 Guardian 创建、替换或撤销 Grant。机构 policy 和当前 Caregiver scope 仍是执行侧独立门禁，不能替代家庭授权。
- Grant 按 Enrollment 与 `data class × direction` 解锁具体 capability，而不是解锁整个 surface。T-002 的首个 Pilot profile 可以继续把固定的 family-care question 双向闭环封装成一个严格 Grant，但不能扩张到 media、daily care、health 或任意主动发布。
- revoke、expiry、replacement、owner role loss、Enrollment terminal 或 owner-reread failure 立即 fail closed；新 Grant 不复活旧 Grant 下已经失效的受保护内容。

## Guardian Chat and Board Boundary

Guardian Chat 是 child-centered、宽泛和反馈性的家庭私域入口。概念上的 child-context summary query 由 Nurture 先聚合并过滤 family facts、多个当前可读 Institution Enrollment 的事实和允许使用的机构背景知识，再把带来源、时间与可见性结论的上下文交给 LLM。LLM 只负责总结、解释不确定性和反馈，不选择 Institution API，不看到未授权候选，也不把不同机构的冲突观察擅自合并为一个权威结论。

Guardian family board 是需要目标选择的事务边界：发送家庭关注、选择接收机构、检查发送状态、纠正/重发和完整授权管理都绑定具体 Enrollment。Chat 仍可直接完成两类确定性动作：

1. GrantRequest 等服务端已经绑定 exact Enrollment/target 的 action card。
2. 单机构试点中仅有一个合法目标、且 handler 重新 owner-reread 的既有动作。

当合法目标为多个时，Chat 不让 LLM 静默路由，而是导航到 family board 由 Guardian 选择；为零时只提供家庭私域反馈。该边界不把 Chat 永久降为只读，因此不重解释 T-002 已锁定的 Guardian action reachability，但 T-004 不建设通用多机构事务路由。

## T-002 Parallelism and Activation Fence

T-004 采用 contract-first parallel development，不把 T-002 的完整 runtime/qualification 设为所有契约工作的前置条件；同时设置不可绕过的 activation fence：

| Lane | T-004/T-005～T-007 可交付 | 不得提前声明或接入 |
| --- | --- | --- |
| Contract-parallel | capability descriptors、typed schemas、policy/repository ports、surface presenters、synthetic owner fixtures、Journey/conformance | 真实 identity、Grant、authenticated principal、owner adapter 或 traffic |
| Owner-integration-gated | 在 exact T-002 contract/version 可用后接 binding、Enrollment/Grant、owner-reread、receipt、persistence/public adapter | 不得用 synthetic fixture、local fallback 或 copied My-Chat runtime 替代 |
| Activation-gated | 在所需 owner contracts/adapters/qualification pins 满足后进入 T-008 Service Candidate 和 My-Chat interface integration | 不得因 UI/fixture 测试绿色而解锁真实构建或流量 |

synthetic owner fixture 必须携带明确的测试来源和 fixture version，只能进入 reference renderer、contract/conformance test 与 isolated Journey setup。它不能被 runtime 自动选择，不能生成 canonical identity 或 Grant，不能写入 production migration，也不能作为 owner outage 时的 fallback。

未解锁的真实能力保持 default-off。presenter 可以诚实返回 `needs_setup`、`unavailable` 或 machine-readable dependency NO-GO；不得伪造“暂时可用”的成功路径。T-004 contract baseline 可以在这些 NO-GO 仍存在时完成，但验收只能声明 synthetic contract qualification，不能声明真实 owner integration、authenticated public path、notification、native adoption 或 traffic qualification。

纯领域和 surface 工作可以继续进入 T-005～T-007；任何与未稳定 T-002 持久化行、owner API 或 migration 强耦合的实现，必须等 discovery 得到 exact contract/pin 后再接。T-008 immutable candidate 是集成汇合点，不能在所需 T-002 qualification pins 缺失时冻结。

## Service Candidate and Interface Consumption Boundary

本节取代先前“My-Chat 采用不可变 Candidate bundle”的表述。Nurture 独立拥有、部署和回滚不可变 Service Candidate；My-Chat 不采用 Nurture 代码、package 或 bundle，不 import Nurture ORM，也不直接访问 Nurture DB。

My-Chat 作为 Host consumer，通过认证的私有 API 调用 Nurture，消费 versioned public API/capability/presenter contract。My-Chat 声明支持的 contract version/digest；Nurture 在 ingress、handler 和 presenter 边界验证兼容性并 fail closed。运行时接口不携带 source tree、fixture、migration 或 Candidate bundle。

Nurture Service Candidate bundle 是 Nurture 的 release/qualification 单元。它精确绑定 source revision、manifest、capability/surface contract 集、schema/migration、fixture/evidence profile 和 dependency pins；任一 pinned 内容变化都生成新的 Service Candidate identity，旧 identity 永远指向原集合。

My-Chat consumer integration 与 Nurture Service Candidate release 是两个独立事实。TestFlight/Play 证据通过外部 composite validation binding 同时引用：

- My-Chat app build identity 与 backend revision。
- Nurture Service Candidate identity。
- 双方实际使用的 interface contract version/digest。
- 精确 test environment/deployment binding。

exact Service Candidate、contract compatibility、qualification result、deployment binding、capability gate 和 traffic authorization 均不能互相替代。T-004 定义接口与证据边界，T-008 冻结/资格化 Nurture Service Candidate，My-Chat companion 对已部署服务执行接口与真机验证。

### Identity ownership split

| Identity | Owner task | T-004 responsibility |
| --- | --- | --- |
| Interface contract identity/version/digest | T-004 | 定义逻辑身份、兼容规则和可重复 canonicalization；确切 wire 位置在 discovery 后确定 |
| Nurture Service Candidate identity/digest | T-008 | 不设计具体 identifier；只交付 T-008 必须 pin 的 interface contract identity |
| Composite validation binding | T-008 + My-Chat companion | 只定义必须关联 interface identity；不生成 build/environment evidence |

Service Candidate identity 不进入普通业务请求、capability eligibility 或 authorization 判断。Composite validation binding 只用于 qualification、部署和真机证据，也不是 runtime authority。

因此 T-004 不等待 Service Candidate identifier/checksum 格式、发布工具、bundle contents 或回滚保留窗口。顶层责任边界在此收敛；这些细节由 T-008/companion 处理，T-004 下一步进入现有 contract/manifest/module 的 discovery。

## Semantic UI Contract

当前阶段先按 The Nurture 的节奏实现和验证 semantic UI contract，后续再由 My-Chat companion 适配 native/web shell。这里的“展示形式”是产品语义形式，不是像素级 UI。

每次 surface open 返回一个原子一致的 envelope，至少标识 surface key、contract version、state、snapshot version、actor-safe context 和 content family。content 分为：

1. Conversation：有序 timeline items，例如 human message、AI structured response、boundary preview、clarification、confirmation、pending-send、receipt 和 correction/withdrawal notice。
2. Board：有序 semantic modules，例如 guardian current focus、caregiver child-today panel、institution pulse；模块可以独立 pagination/refresh，但不能变成通用视觉 `Card`/`Grid` props。
3. Workbench：Hub/List/Insight operational model，包括 collection、detail、
   `InstitutionWorkflow` queue、filters 和 authorized actions。

初始 envelope 保证一致快照；大列表和历史内容通过 module/item cursor 增量读取。mutation 返回 canonical result、receipt 与 invalidation scope，不下发 UI patch。

### Product Ownership

Nurture owns：

- 输出哪些业务事实、状态和 provenance。
- module/item 的产品语义、顺序、必要/可选属性和 capability actions。
- 跨边界 preview/confirmation、pending-send、receipt、withdrawal/correction 的表现语义。

My-Chat owns：

- React Native / Web components、responsive layout、animation、navigation、cache 和 device interaction。
- 将 semantic modules 映射到宿主设计系统，但不得改变事实可见性、业务顺序或权限。

当前项目可以实现参考 renderer 或检验工具来证明契约可用，但不得创建独立 App shell。LLM 只能填充已注册 item/module schema，不能发明 component kind、action 或布局。

### Compatibility

- 新增 optional item/module 可以兼容演进；consumer 可忽略并记录 telemetry。
- 未知 required item/module 必须安全失败或要求升级，不能静默缺失。
- 删除、改义、放宽可见性或改变业务顺序属于 breaking。
- 纯视觉变化不改变 Nurture contract version。

## Golden Journey Portfolio

T-004 不以一条故事代表完整产品，而是维护五条代表性产品 Journey 和一条跨域韧性 Journey：

| ID | Journey | Primary proof |
| --- | --- | --- |
| GJ-1 | 家庭关注流向照护者 | Chat family-private summary → board selects Enrollment and explicitly shares → CareGroup acknowledgement → one or more current eligible caregivers append CareGroup replies → family receipts |
| GJ-2 | 照护日常流向家庭 | low-friction capture → AI organize → human review → two-stage publish |
| GJ-3 | 多源事实沉淀为成长连续性 | family + authorized multi-Institution facts → child-context summary/current focus/timeline → source-preserving provenance/correction |
| GJ-4 | 入托、家长确认与授权建立 | roster/invite → parent-owned binding → enrollment → Institution GrantRequest → Guardian grant → surface reachability |
| GJ-5 | 机构理念流向日常支持 | template/adoption → care observations → privacy-safe aggregate/support |
| RJ-1 | 撤权、纠正与恢复 | revoke/redaction/role loss/stale access/replay → fail closed and retained audit |

`waiting_and_turn_taking`（用户侧叙事“要不到东西时会哭闹”）只是 GJ-1 的中性主题，不是唯一产品主线。

### Fixture and Evidence Rules

- 六条 Journey 共用一个版本化 synthetic world contract，但各自从 fresh isolated initial state 运行。
- 背景 synthetic facts 仅用于 aggregate 隐私阈值等明确 setup，必须标记为 fixture，不冒充用户旅程证据。
- 每条 Journey 至少包含一个完整产品闭环和一个最高风险 denial。
- Journey 是代表性证据；exhaustive actor/role/action/surface 矩阵由 conformance tests 覆盖。
- T-004/T-005/T-006/T-007 可用 setup fixture 验证产品契约；T-008 再决定哪些 setup 必须替换为真实 authenticated public paths。
- 不维护一个依靠顺序执行、不断变异的共享数据库作为资格证据。

## Surface Matrix Baseline

| Surface | Actor | Primary mode | Write boundary |
| --- | --- | --- | --- |
| Guardian Nurture Chat | guardian | child-centered private synthesis | 仅执行目标已绑定或唯一目标的确定性动作；不做多机构 LLM 写路由 |
| Guardian family board | guardian | family-owned record and target selection | 按具体 Enrollment 确认、发送、纠正与管理授权 |
| Caregiver Nurture Chat | caregiver | care coordination | 只在被授权 child scope 内写入 |
| Caregiver teacher board | caregiver | class work queue | 两阶段发布，不直接进入家庭私域 |
| Institution board | institution steward | read-only aggregate + `InstitutionWorkflowProjection` | 无直接事实编辑 |
| Institution workbench | authorized institution operator | `InstitutionWorkflow` operational workspace | 可发 GrantRequest；不能代 Guardian 建立/替换/撤销 Grant |

## Identity and Permission Invariants

- 本地 `NurtureChild.id` 不是平台 `child_id`。
- `child_id`、family association 或 scenario binding 只是 routing / policy input，不是读取事实的充分权限。
- 无权创建平台 child 的 actor 只能保留 provisional local child；它不进入六个正式 surface 的 bound baseline。
- 一个 ChildCareProcess 可有多个相互隔离的 Institution Enrollment；Enrollment、CareGroup 或 route 都不是 Grant。
- GrantRequest 不产生 authority；Grant 由当前 Guardian 确认并绑定 exact Enrollment、data class、direction 和 purpose。
- 不从 PII 推导 canonical identity，不查询 My-Chat 数据库。

## Compatibility Model

- 每个候选版本必须声明 source revision、manifest/API/presenter contract 版本和 fixture 版本。
- capability descriptor 的 intent、schema ref、side-effect/confirmation class 与 eligibility policy reference 都是版本化契约。
- 添加可选字段可在兼容范围内演进；删除、改义、权限放宽均视为 breaking。
- 未知 actor、缺失 grant、pin 不匹配或 authority reread 失败时必须 fail closed。

## Key Risks

- 把 UI 需要的字段误当作读取授权。
- 把 capability descriptor 中的 supported role 或 LLM 选择结果误当作执行授权。
- 把唯一机构试点假设固化成“一名孩子只能有一个 Enrollment”，或让 LLM 在多个机构间静默选择写入目标。
- 把 Institution GrantRequest 当成 Grant，或让一个 Enrollment 的授权扩散到另一个 Institution。
- 把 Guardian 可读的跨机构总结暴露给任一 Institution，或丢失来源、时间和原始 Grant fences。
- 把 synthetic owner fixture 接成真实 runtime fallback，或用 contract qualification 绿灯冒充 T-002 owner integration/activation 已通过。
- 为绕过 T-002 gate 复制 identity、authenticated principal、Grant、owner-reread、receipt 或 persistence 实现。
- 让 My-Chat import Nurture 代码/Candidate bundle、直连数据库，或把接口集成误写成代码 adoption。
- 让 My-Chat 浮动组合 API/capability/presenter contract，形成未经共同 conformance 的接口组合。
- 原地修改已发布 Service Candidate identity，或把 Service Candidate/contract pin 误当成 qualification/activation/traffic authority。
- 把 T-008 的 Service Candidate ID、发布工具或真机 evidence schema 拉回 T-004，形成不必要的发布前置依赖。
- 为未来 LLM 使用提前建设完整共享引擎，形成不必要的跨仓关键路径。
- 把 semantic modules 扩张为通用 server-driven UI，或把 My-Chat 视觉布局写入 Nurture contract。
- 让 LLM 生成未经注册的 item/module/action，形成 UI 或权限注入面。
- 用一条演示主线代表整个产品，遗漏反向流、成长连续性、关系建立、机构运营和恢复。
- 把多条 Journey 串成一个可变数据库脚本，导致顺序依赖、重跑不稳定和证据归属不清。
- 为六个 surface 各自复制领域事实，导致来源分裂。
- presenter 泄漏内部 ID、private anchor 或家庭私密正文。
- 以绿色 CI 替代 T-002 的 source qualification / traffic authorization。
