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

这些术语不属于同一抽象层。`CareInteraction` 是业务 domain，`ActionExecution` 是
提交方式，`ActionDelivery` 是提交后的宿主投递，`InstitutionWorkflow` 与
`PublishProcess` 是不同的持久化业务过程。descriptor MUST 分轴声明，不能把五个术语
压进一个 `operationClass` 枚举，也不得因为 capability 异步、跨 owner、需要 worker
或产生通知就标记为 Workflow。

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

### CapabilityDescriptorV1

每个 descriptor 是发现和绑定元数据，不是 authorization snapshot。V1 最小字段为：

```text
CapabilityDescriptorV1
  capabilityKey
  capabilityVersion
  contract: InterfaceContractRefV1
  domainClass
  executionClass
  deliveryClass
  intentKeys[]
  inputSchemaRef
  resultSchemaRef
  errorSchemaRef
  targetPolicy
  confirmationPolicy
  concurrencyPolicy
  eligibilityPolicyRef
  handlerBinding
  presenterBindings[]
  invalidationScopeKinds[]
  dependencyGates[]
```

字段语义：

- `domainClass` 至少区分 `care_interaction | institution_management |
  publish_process | read_model`。
- `executionClass` 至少区分 `query | action_execution |
  institution_workflow_action | publish_process_transition`。
- `deliveryClass` 为 `none | action_delivery_candidate`；它只声明提交后是否可能产生
  宿主投递，不把投递状态并入 action result。
- `intentKeys` 是版本化、allowlisted 的产品意图 key；自然语言 description 只供解释，
  不能成为 handler binding。
- `targetPolicy` 明确 `none | exact_bound | owner_option_required |
  unique_eligible_default`，并定义 owner-issued option schema。
- `confirmationPolicy` 明确 `none | direct_commit | reviewable_commit |
  strong_confirmation`；技术 prepare/execute 阶段数不是 UI 手势数。
- `eligibilityPolicyRef` 包含 stable key/version。descriptor 可声明适用角色，但执行端
  每次仍根据 current actor/scope/owner facts 计算。
- schema、policy、handler、presenter 或 dependency binding 任一变化都进入新的
  contract artifact/digest；不存在 consumer 自由拼装的半版本组合。

### Invocation, Business Input and Preconditions

- capability-specific `typedInput` 只包含用户实际提供的业务字段，不携带 actor、
  Workspace、raw target、Grant、expected version、command identity 或 transport retry metadata。
- generic invocation context 携带 authenticated principal、surface、capability/version
  与 owner-issued opaque target ref；target ref 不是 authority。
- capability descriptor MUST 声明 concurrency summary class：
  `exact_state`、`lifecycle_authority` 或 `append_compatible`，并提供
  `headBindings[]`。summary class 方便 discovery；真正执行条件以 typed head binding
  schema 为准。
- `prepareAction` 在当前 owner state 下解析精确 target 和该 capability 所需的
  entity/authority/policy heads，并把它们连同 actor/scope、canonical input integrity、
  expiry 和 stable command identity 绑定进 opaque `confirmationRef`。普通输入可使用
  canonical hash；低熵受保护正文必须使用 secret-keyed integrity tag，不能存 bare
  body hash。
- `headBindings[]` 的 mode 为：
  - `must_equal`：execute 时必须等于 prepare 冻结值。
  - `must_satisfy`：execute 时必须继续满足 descriptor 指定的封闭 predicate/version。
  - `compatible_append`：其他合法 append 可以改变集合，但不能改变已冻结的
    lifecycle/authority predicates。
  - `convergent_postcondition`：仅当 descriptor 声明的目标状态已由另一合法命令满足，
    且其他 heads 仍有效时，允许 `already_satisfied`。
- `exact_state` action 默认比较 prepare 时冻结的 work-state version；不得重新解释为
  “使用当前最新版本”。若同时声明 `convergent_postcondition`，只允许向同一已满足
  postcondition 收敛，不能把任意 version drift 当成功。T-005 acknowledge 使用该组合。
- `lifecycle_authority` action 不关心明确列出的正交事实变化，但 frozen lifecycle、
  association、Grant、role、policy 或 retention predicate 任一失效即 stale/denied。
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

## Interface Contract Identity

T-004 的 adoption/pin 单元是一个 exact interface contract ref：

```text
InterfaceContractRefV1
  key: "nurture.surface-contract"
  version: SemVer
  digest: "sha256:<64 lowercase hex>"
```

- discovery document、每个 surface/query/action response 的根部 MUST 返回 exact ref。
- invocation request MUST 提交它已采用的 exact ref；key/version/digest 缺失或不匹配
  fail closed，并返回不含受保护业务状态的 compatibility error。
- `version` 表达 compatibility 意图；`digest` 绑定确切 artifact contents。即使是
  additive optional change，也生成新 version/digest，不原地覆盖旧 artifact。
- 不允许 version range、mutable `latest`、服务器静默协商另一个 digest，或让 API、
  descriptor、presenter、fixture 各自浮动。

digest 输入是一个有序 artifact set：descriptor registry、surface schemas、
invocation/result/error schemas、policy/schema refs、fixture manifest 和 conformance
manifest。每个 artifact 先解析为严格数据模型，拒绝 unknown/duplicate keys，再按 UTF-8
canonical JSON 生成字节：object keys 词典序，数组保持契约语义顺序；registry 类数组
必须先按其 stable key 排序。digest 字段自身不进入 digest 输入。生成器必须能够从相同
contract artifacts 重建相同 digest。

source revision、build time 和生成器运行环境是 registry/evidence provenance，不进入
semantic interface digest；否则没有语义变化的重建也会制造新 contract identity。
不同 source revision 只要规范 artifact bytes 完全相同就得到同一 digest；任何
descriptor/schema/policy ref/fixture/conformance 内容变化仍必须生成新 version/digest。

T-008 只 pin 该 exact ref；Service Candidate identity 和 composite validation binding
仍由 T-008/companion 定义，不进入普通业务 authorization。

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

### G1 four-layer identity/authority chain

G1 的 authenticated protected path 固定为四层，每层只提供下一层所需的最小输入，
不得越级授权：

```text
My-Chat authenticated Workspace/User/Actor principal
  -> My-Chat canonical Child/Family + stewardship/membership + scenario binding
  -> Nurture typed anchor + exact workspace-local association
  -> Nurture current business authority
```

第一层证明成人 principal 和 Workspace；第二层解析平台 owner identity/binding；第三层
只把 opaque typed owner ref 定位到 Nurture local child/process；第四层才依据 current
Participant/RoleAssignment/Enrollment/CareGroup/Grant/purpose/lifecycle/policy 判定当前
请求。service workload credential 与 represented adult 是两份独立证明，任何 service
token、route、binding、anchor 或 association 都不能替代第四层。

只有 Parent/steward 或其明确授权的成人可以创建 platform Child/Family。Institution
Admin、Caregiver 和 Nurture 都不能 mint、推断或用 PII 匹配 canonical identity。
无该 authority 时，Nurture 可保留 provisional local setup/draft，但不能创建 anchor
candidate、猜测 owner ref 或进入 bound surface baseline。

Child/Family anchor namespace 必须分离；anchor 是 body-free、PII-free、
authority-free 的 private locator，仅存在于 My-Chat owner ref、Nurture persistence
或短生命周期 server-to-server envelope。它不能进入 client、Chat、Notification、
Handoff、logs/traces/metrics、search 或 evidence payload。正常状态只有
`reserved | bound_empty | associated | retired`；`revoked | quarantined |
ambiguous` fail closed。Child association 精确绑定
`Workspace + Child anchor + local child/process`；Family association 额外绑定同一
Child association，不能成为跨 child 或跨 Workspace 的 family shortcut。

资格化必须覆盖 no platform identity、no binding、`reserved`、`bound_empty`、
`associated`、`retired`、`revoked`、`quarantined` 和 `ambiguous`。任何恢复都走
owner-issued、versioned transition；禁止自动 merge、猜测 replacement 或静默 rebind。

### G1 transaction and replay boundary

private ingress 首先验证允许的 service workload 与 exact
Workspace/User/Actor/purpose/expiry/nonce/idempotency/canonical request hash。
binding-owner Receipt 的唯一合法写入顺序为：

```text
verify private invocation
  -> begin Nurture transaction
  -> lock exact typed anchor
  -> transaction-scoped reread + lock/CAS exact authority source
  -> validate association/role/purpose/version
  -> insert or exact-replay short-lived owner Receipt
  -> commit
```

后续业务命令把 effect、`CommandExecution` 和 business `Receipt` 放入一个 Nurture
transaction，并 lock/CAS 每个 mutable prerequisite。transaction 外 authority
pre-read 不是执行依据；Nurture transaction 内不发远端 My-Chat 请求。Host
principal/binding admission 发生在 owner attempt 之前；已经 admission 的 in-flight
attempt 可以恰好 commit 一次，但不能在失效后开始新 effect。

same idempotency key + same canonical hash 返回原结果；same key + different hash
冲突。业务唯一键或 CAS 冲突的 loser 重读 canonical winner。revoke-before-lock
拒绝；Receipt-first interleaving 允许该请求提交一次而下一请求拒绝。response loss
只恢复原 `CommandExecution`。private binding-owner Receipt 与 persistent business
Execution/Receipt 的 owner、TTL、replay 和 retention 均不同，wire/schema/storage
不能合并。

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

未解锁的真实能力保持 default-off。presenter 可以诚实返回 `needs_setup`、
`unavailable` 或 machine-readable dependency NO-GO；不得伪造“暂时可用”的成功
路径。T-004 contract baseline milestone 可以在这些 NO-GO 仍存在时完成，但它不是
T-004 task Exit 或 G1 PASS；当时只能声明 synthetic contract qualification，不能
声明真实 owner integration、authenticated public path、notification、native adoption
或 traffic qualification。

纯领域和 surface 工作可以继续进入 T-005～T-007；任何与未稳定 T-002 持久化行、owner API 或 migration 强耦合的实现，必须等 discovery 得到 exact contract/pin 后再接。T-008 immutable candidate 是集成汇合点，不能在所需 T-002 qualification pins 缺失时冻结。

### G1 formal ingress boundary

T-004 contract artifacts 保持 framework-neutral；但是 Joint Conformance 的执行路径
不能是任意测试 harness。当前 P7 Fastify dev-host 只可用于提前证明 owner transaction、
revoke、concurrency 和 replay，证据分类为 provisional Owner Integration Readiness。

最终 G1 必须让同一 T-004 fixture/conformance suite 经过
production-intended NestJS scenario-service ingress 调用 exact pinned owner path。
在此之前 T-002 必须对齐：

- formal route/API index；
- My-Chat service authentication 与 verified principal/envelope middleware；
- request-size、timeout 和 safe error boundary；
- env contract、default-disabled startup 和 no-secret safe denial；
- `PORT=8000`、Nurture backend `3001`、Base-assigned `3200/3201`；
- clean install/build/start/health/contract tests。

该 ingress 仍运行在 disposable、zero-PII、default-off qualification environment，
不构成 persistent deployment、Candidate、activation 或 traffic authority。

### G1 qualification and evidence composition

G1 保持三层独立结论：

1. `Synthetic Contract Qualification` 验证 schema、registry、descriptor/handler/
   presenter consistency、deterministic fixtures、digest rebuild、visibility 和
   dependency fail-closed，不声称真实 owner。
2. `Owner Integration Handoff` 固定 exact revisions/source hashes/private route/env，
   并在 disposable PostgreSQL 验证 service auth、binding lifecycle、transaction
   authority/Receipt、revoke/concurrency、exact replay/response loss、privacy scan 和
   final false/empty；Fastify-only 结果只能是 provisional。
3. `G1 Joint Conformance Record` 精确引用前两项，由同一 T-004 fixtures 经 formal
   NestJS ingress 执行真实 owner path 的 positive 和 negative matrix，并记录 exact
   suite、commands、results、revisions、final census 与
   `PASS | NO_GO | INVALIDATED`。

Joint matrix 至少覆盖正向 binding/association/current authority、wrong
Workspace/User/Actor/purpose、`bound_empty` recovery、post-revoke、owner unavailable、
contract mismatch、stale confirmation/heads、exact replay、response loss、
concurrency、cross-Institution 与 leakage。三层 PASS 不能互相代替。

这三类 artifact/evidence role 直接供 T-008 pre-Candidate gate 引用，不创建额外
release service、database 或 control plane。public contract drift 失效 synthetic +
joint；owner pin/source/ingress drift 失效 owner + joint；fixture/suite drift 失效受影响
synthetic/joint；source population 外的 display-only docs 不失效。auth/privacy/security
风险立即失效并保持 default-off。历史结果 append-only 保留。

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
| Interface contract identity/version/digest | T-004 | 定义 exact wire ref、artifact-set canonicalization、兼容规则和可重复 digest |
| Nurture Service Candidate identity/digest | T-008 | 不设计具体 identifier；只交付 T-008 必须 pin 的 interface contract identity |
| Composite validation binding | T-008 + My-Chat companion | 只定义必须关联 interface identity；不生成 build/environment evidence |

Service Candidate identity 不进入普通业务请求、capability eligibility 或 authorization 判断。Composite validation binding 只用于 qualification、部署和真机证据，也不是 runtime authority。

因此 T-004 不等待 Service Candidate identifier/checksum 格式、发布工具、bundle contents 或回滚保留窗口。顶层责任边界在此收敛；这些细节由 T-008/companion 处理，T-004 下一步进入现有 contract/manifest/module 的 discovery。

## Semantic UI Contract

当前阶段先按 The Nurture 的节奏实现和验证 semantic UI contract，后续再由 My-Chat companion 适配 native/web shell。这里的“展示形式”是产品语义形式，不是像素级 UI。

每次 surface open 返回一个原子一致的 `SurfaceEnvelopeV1`：

```text
SurfaceEnvelopeV1
  contract: InterfaceContractRefV1
  surfaceKey
  surfaceVersion
  state: ready | limited | needs_setup | unavailable
  snapshotRef
  snapshotVersion
  generatedAt
  actorContext
  contentFamily
  content[]
  actions[]
  pageInfo?
  dependencyNoGos[]
```

- `actorContext` 只包含当前角色/工作范围的 display-safe labels 和 opaque refs，不输出
  account、Prisma、anchor、Grant 或 policy internals。
- `content` 和 `actions` 是按 schema ref 封闭的 typed union。每个 action 只携带
  capability/version 与 owner-issued target option ref，不携带可绕过 prepare/
  owner-reread 的完整 command payload。
- `dependencyNoGos` 只表达 machine-readable dependency class/version 和 safe retry/
  setup hint；不暴露另一个 Institution、隐藏对象或具体权限丧失原因。
- `snapshotRef`、cursor 和 target option 都是 body-free locator，不是 authority。

content 分为：

1. Conversation：有序 timeline items，例如 human message、AI structured response、
   boundary preview、clarification、confirmation、receipt 和
   correction/withdrawal/redaction notice。`pending-send` 只在某个 capability
   （例如 PublishProcess 或 ActionDelivery projection）确有 canonical pending
   state 时出现；未确认的 `prepareAction` 本身不是 timeline business fact。
2. Board：有序 semantic modules，例如 guardian current focus、caregiver child-today panel、institution pulse；模块可以独立 pagination/refresh，但不能变成通用视觉 `Card`/`Grid` props。
3. Workbench：Hub/List/Insight operational model，包括 collection、detail、
   `InstitutionWorkflow` queue、filters 和 authorized actions。

初始 envelope 的 required modules/items 来自同一 snapshot。大列表和历史内容通过
module/item cursor 增量读取；cursor 必须绑定 exact contract、actor/scope、query、
sort、snapshot 和 expiry。owner state 前移或 cursor 过期时返回 `refresh | rebase`
而不是把不同 snapshot 静默拼成一个视图。mutation 返回 canonical result、适用的
Receipt refs 与 invalidation scopes，不下发 UI patch；consumer 按 invalidation
重新 `readResult`/query。

### Product Ownership

Nurture owns：

- 输出哪些业务事实、状态和 provenance。
- module/item 的产品语义、顺序、必要/可选属性和 capability actions。
- 跨边界 preview/confirmation、capability-specific pending state、receipt、
  withdrawal/correction/redaction 的表现语义。

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

### T-007 D-04 visibility addendum

园区业务沟通与 Guardian family-private AI conversation 是不同数据面。对于家长发送前
已明确披露为园区业务渠道、且 exact original Grant/data class/direction/purpose
允许 Institution supervision 的 Nurture Message/CareInteraction，T-007 可定义一个
非 canonical、逐请求组合的 `InstitutionBusinessCommunicationProjectionV1`：

- reader 必须是 exact current `institution_admin`，并重新验证 Workspace、
  Institution、Enrollment、CareGroup、child/thread scope、original Grant 和 source
  lifecycle；
- projection 可只读返回当前可见正文、附件、更正/redaction 状态和 source refs；
- My-Chat 只渲染 owner-read 结果，不复制正文为共享 transcript、搜索、缓存或第二
  canonical message；
- Admin read 不授予 acknowledge/reply/correction/redaction。Admin 同时拥有
  caregiver role 时也必须切换 active role，并通过 T-005 exact-CareGroup action policy；
- Guardian 私密 AI、未发送草稿、My-Chat 私人聊天和其他 Institution Enrollment
  始终不可见；
- 后置 AI attention 只能在相同 authorized projection 上生成带来源候选，不能扩大
  visibility 或自动执行 action。

这是 additive、security-sensitive 的 surface contract 变化，必须产生新 interface
version/digest 并通过 owner-read/revoke/redaction/cross-Institution qualification。
当前 manifest/module/source 只提供 display-safe legacy institution items，不能把本
设计 addendum 误报为已实现或已激活。

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
| Caregiver Nurture Chat | caregiver / lead caregiver | current-item explanation and bounded care coordination | 只对精确 CareGroup/current child scope 执行已注册 action |
| Caregiver teacher board | caregiver / lead caregiver | class work queue + family-care detail + PublishProcess | 通过同一 Harness acknowledge/reply；发布仍走独立 PublishProcess |
| Institution board | authorized institution operator | class-first read-only aggregate + explicitly authorized institution-business communication projection + `InstitutionWorkflowProjection` | 无直接事实编辑；Admin read 不授予 CareGroup action |
| Institution workbench | authorized institution operator | `InstitutionWorkflow` operational workspace | 可发 GrantRequest；不能代 Guardian 建立/替换/撤销 Grant |

## Identity and Permission Invariants

- 本地 `NurtureChild.id` 不是平台 `child_id`。
- `child_id`、family association 或 scenario binding 只是 routing / policy input，不是读取事实的充分权限。
- 无权创建平台 child 的 actor 只能保留 provisional local child；它不进入六个正式 surface 的 bound baseline。
- 一个 ChildCareProcess 可有多个相互隔离的 Institution Enrollment；Enrollment、CareGroup 或 route 都不是 Grant。
- GrantRequest 不产生 authority；Grant 由当前 Guardian 确认并绑定 exact Enrollment、data class、direction 和 purpose。
- Institution membership/Admin role 本身不授权园区业务沟通正文；必须同时满足渠道
  disclosure、exact original Grant/data class/direction/purpose 与 current owner-read。
- 不从 PII 推导 canonical identity，不查询 My-Chat 数据库。

## Compatibility Model

- 每个 interface contract registry record 必须声明 source revision 作为 provenance，
  并关联 descriptor/surface/API schema、policy refs 和 fixture/conformance manifest；
  exact version/digest 只由规范 artifact contents 生成，不把 revision/build metadata
  混入 semantic digest。
- capability descriptor 的 intent、domain/execution/delivery、schema refs、
  target/confirmation/concurrency policy 与 eligibility policy reference 都是版本化契约。
- 添加可选字段可在兼容范围内演进；删除、改义、权限放宽均视为 breaking。
- 未知 actor、缺失 grant、pin 不匹配或 authority reread 失败时必须 fail closed。
- consumer admission 始终使用 exact digest。兼容新增不等于服务器可以对旧 consumer
  静默切换 digest；采用新 artifact set 仍需显式 pin 和 conformance。

## Key Risks

- 把 UI 需要的字段误当作读取授权。
- 把 capability descriptor 中的 supported role 或 LLM 选择结果误当作执行授权。
- 把 `CareInteraction`、`ActionExecution`、`ActionDelivery` 和 Workflow/PublishProcess
  塞进一个 operation enum，导致 domain、提交和投递边界漂移。
- 只写一个 concurrency class 而不固定 head bindings/convergence predicate，导致
  acknowledge 的合法收敛与 reply 的合法 append 被实现成同一种 version CAS。
- 对低熵受保护正文保存 bare canonical hash，形成可枚举的内容指纹。
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
- 让 pagination cursor 跨 contract/actor/scope/snapshot 复用，或静默拼接不同 snapshot。
- 用一条演示主线代表整个产品，遗漏反向流、成长连续性、关系建立、机构运营和恢复。
- 把多条 Journey 串成一个可变数据库脚本，导致顺序依赖、重跑不稳定和证据归属不清。
- 为六个 surface 各自复制领域事实，导致来源分裂。
- presenter 泄漏内部 ID、private anchor 或家庭私密正文。
- 以绿色 CI 替代 T-002 的 source qualification / traffic authorization。
