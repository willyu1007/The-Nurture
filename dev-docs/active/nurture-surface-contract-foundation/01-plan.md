# Plan — 六个核心 Surface 的产品契约基座

## Controlled-Parallel Entry Contract

- T-004 MUST proceed in parallel with the bounded T-002 owner/source repair. It MUST
  NOT wait for T-002 as a whole, Pilot-0-D/E, Pilot-1, production topology or external
  traffic readiness.
- T-004 MAY freeze public capability/surface schemas, deterministic fixtures,
  dependency failure behavior and `InterfaceContractRefV1` through synthetic
  qualification before the real T-002 adapter is ready.
- Synthetic PASS MUST remain distinct from owner-integration PASS. Missing owner
  dependencies keep the affected capability default-off with explicit dependency
  NO-GO; synthetic adapters MUST NOT appear in candidate or real-integration evidence.
- The Contract Boundary checkpoint precedes protected slice implementation. Owner
  Integration Readiness then binds the exact T-002 endpoint and source pins. Joint
  Conformance finally reruns the same fixtures against that real owner path; only the
  jointly passing capability may enter protected T-005～T-007 implementation.
- Internal T-002 anchor, ORM, repository, authority-evidence and Receipt persistence
  shapes MUST NOT leak into the public T-004 contract. A T-002 implementation or pin
  change that preserves the public behavior renews owner evidence rather than forcing
  an unrelated surface-contract rewrite.
- T-003 supplies non-blocking information architecture and interaction design. Demo
  or feedback changes become implementation requirements only after explicit adoption
  into the current T-004～T-007 product contracts.
- G1 is progressive, not a single serial barrier:
  - G1 start opens downstream product-state design, pure domain/policy logic,
    presenter design and isolated synthetic fixtures.
  - Contract Boundary PASS opens implementation against the exact public contract.
  - Owner Integration Readiness PASS opens isolated real-adapter integration.
  - Joint Conformance PASS alone opens protected qualification and Beta-profile
    handoff.
- None of these gates grants database apply, capability activation, Candidate Freeze,
  internal-store testing or traffic authority.

## G1 Decision Register — Accepted

G1 的目标不是完成某一个 task，而是在不激活能力、不持久化 apply、不创建
Candidate、也不接入真实流量的前提下，完成六 surface 的 exact public contract、
真实 owner/source path 和联合资格化。以下七项顶层决策共同构成 G1，不得用其中
一项 PASS 代替其他项。

### G1-01 — Progressive parallel execution

- G1 start 开放产品状态设计、纯 domain/policy、presenter 设计和隔离 synthetic
  fixtures。
- Contract Boundary PASS 开放针对 exact public contract 的实现。
- Owner Integration Readiness PASS 开放隔离 real-adapter integration。
- Joint Conformance PASS 才开放 protected qualification 和 Beta Profile Handoff。
- 任一层级都不授权 persistent DB apply、Candidate Freeze、internal-store testing、
  activation 或 traffic。

### G1-02 — Four-layer identity and authority chain

1. My-Chat 建立 authenticated Workspace/User/Actor principal。
2. My-Chat 拥有 canonical Child/Family identity、stewardship/membership 和
   scenario binding。
3. Nurture 使用 typed、body-free、PII-free anchor 和 exact workspace-local
   association，把 opaque owner identity 绑定到本地 child/care process。
4. Nurture 在每次 protected request 中解析并重新验证 current business authority。

- 只有 Parent/steward 或其明确授权的成人可以创建平台 Child。Institution Admin、
  Caregiver 和 Nurture 不得 mint、推断或通过 PII 匹配 global identity。
- 缺少创建 authority 时，只能保留 local provisional record；不得产生 anchor
  candidate 或 global identity。
- Child 与 Family anchor 使用不同 namespace；仅允许存在于 My-Chat owner ref、
  Nurture persistence 和短生命周期 private server-to-server envelope 中，不得进入
  client、Chat、Notification、Handoff、log、search 或 evidence payload。
- 正常 anchor lifecycle 为 `reserved | bound_empty | associated | retired`；
  `revoked | quarantined | ambiguous` 一律 fail closed。
- association 必须是 exact workspace-local：Child anchor 只绑定本地
  child/process；Family + Child pair 只绑定 child-scoped family/process。
- principal、binding、anchor、association 和 route 都只是 routing/policy input，
  任何一个都不是 protected-fact authorization。

### G1-03 — Transactional authority, Receipt and replay

- private invocation 同时验证 service workload 与 exact Workspace/User/Actor、
  purpose、expiry、nonce、idempotency key 和 canonical request hash；service token
  不能代表成人身份。
- binding-owner Receipt 的固定顺序为：验证 private invocation → 开启 Nurture
  transaction → lock exact typed anchor → transaction-scoped reread 并 lock/CAS exact
  authority source → 校验 association/role/purpose/version → insert 或 exact replay
  Receipt → commit。
- 后续 business action 必须把 business effect、`CommandExecution` 和 business
  `Receipt` 放在同一个 Nurture transaction；每个 mutable prerequisite 都必须
  lock/CAS。不得使用 transaction 外 pre-read 作为 authority，也不得在 Nurture
  transaction 内调用远端 My-Chat。
- Host principal/binding admission 发生在 owner attempt 之前；已 admission 的
  in-flight attempt 最多提交一次。相同 idempotency key + 相同 hash 返回原结果；
  相同 key + 不同 hash 冲突；业务唯一性/CAS 的 loser 必须重读 canonical winner。
- revoke-before-lock 拒绝；Receipt-first 可以恰好提交一次，后续请求拒绝；响应丢失
  只能恢复原 `Execution`，不能再次执行业务。
- 短生命周期 binding-owner Receipt 与持久 business
  `CommandExecution`/`Receipt` 是两个独立语义，不能合并。

### G1-04 — Exact public surface contract

T-004 交付 `InterfaceContractRefV1`、`SurfaceContractV1`、capability descriptors、
typed query/action/result/error、`SurfaceEnvelopeV1`、confirmation/concurrency/
idempotency/replay contract，以及 fixtures、conformance manifest 和可重建 exact
version/digest。

- capability-specific input 只包含业务字段。generic invocation 承担 exact target、
  actor/scope、expected heads、idempotency、confirmation、expiry 和 expected exact
  interface ref。
- client 不得提交 raw Enrollment/Grant/RoleAssignment/anchor、authority outcome、
  routing/current-permission、internal endpoint 或 owner evidence。
- `prepareAction` 把 exact target、actor/scope、canonical input integrity、concurrency
  heads 和 expiry 绑定进 opaque `confirmationRef`。
- public result 只返回 actor-safe semantic content、opaque refs、current
  affordances、exact contract ref 和 generic safe errors；不得泄漏 Prisma/internal
  ids、anchors、raw platform identity 或 internal lifecycle。
- admission 只接受 exact key/version/digest；禁止 `latest`、version range、
  major-only 或 fallback。
- public behavior 变化必须生成新 interface identity。owner pin/实现变化但 public
  behavior 不变时，更新 Owner Integration Handoff 与 Joint Conformance，不强制改写
  interface identity。

### G1-05 — Formal target-service ingress

- contract boundary 保持 framework-neutral。Owner Integration Readiness 可以先通过
  当前 P7 Fastify dev-host 证明 transaction/revoke/replay，但该证据是 provisional。
- 最终 G1 Joint Conformance 必须经过 production-intended Nurture service ingress；
  当前批准目标是 NestJS scenario service。Fastify-only dev-host 证据不能成为最终
  G1 PASS 或 T-008 输入。
- Joint Conformance 前必须完成 NestJS target ingress、`PORT=8000`、backend
  `3001`、Base-assigned `3200/3201` 端口对齐、formal route/API index、service-auth
  middleware、size/timeout/error boundary、env contract 和 default-disabled startup。
- clean install/build/start/health/contract test 必须通过；缺 secret 必须安全拒绝，
  不得退化为弱认证。
- 该服务仍是 disposable、zero-PII、default-off 的资格化目标，不等于 deployment、
  persistent environment 或 traffic authorization。

### G1-06 — Three distinct qualification layers

| Layer | Required proof | What it cannot claim |
| --- | --- | --- |
| Synthetic Contract Qualification | schema、descriptor/handler/presenter 一致性、deterministic fixtures、digest rebuild、visibility 和 dependency fail-closed | 真实 owner 或 authenticated integration |
| Owner Integration Readiness | exact pins、clean install/build、private endpoint/service auth、binding lifecycle、transaction authority/Receipt、PostgreSQL revoke/concurrency、replay/response-loss、privacy scan、final false/empty | 六 surface 联合通过 |
| Joint Conformance | 相同 T-004 fixtures 经 formal Nurture ingress 运行于真实 pinned owner path，覆盖正向 binding/association/auth、wrong workspace/user/actor/purpose、`bound_empty` recovery、post-revoke、owner unavailable、contract mismatch、stale confirmation/heads、replay、concurrency、leakage 和 final false/empty | Candidate、activation 或 traffic |

只有 Joint Conformance PASS 才完成 G1。

### G1-07 — Delivery roles and invalidation

G1 只交付三类 artifact/evidence role，不建立新服务、数据库或控制平面：

1. T-004 `Surface Contract Artifact Set`：exact interface ref、schemas、registry、
   fixtures 和 conformance manifest。
2. T-002 `Owner Integration Handoff`：exact pins、formal ingress、env/default-off、
   transaction/revoke/replay/privacy evidence 和 final false/empty。
3. `G1 Joint Conformance Record`：精确引用前两者及 suite/fixtures/revisions/
   commands/results/negative cases/final census，结论只能是
   `PASS | NO_GO | INVALIDATED`。

T-008 pre-Candidate gate 直接引用上述三类角色。T-004 public contract drift 使
synthetic + joint 失效；T-002 owner/pin/ingress drift 使 owner + joint 失效；
fixture/suite drift 使受影响 synthetic/joint 失效；source population 之外的纯展示
文档变化不失效。auth/privacy/security 风险立即 `INVALIDATED` 并保持 default-off。
历史 PASS append-only 保留，不删除或改写。

2026-07-31 粒度细化（accepted）："受影响"由 conformance manifest 的
per-capability/per-surface slice hash 机械判定，不依赖人工判断。additive 变更
旋转 root digest 时，slice hash 未变化的既有证据保持有效：绑定旧 ref 的记录
append-only 保留，新 ref 只需资格化新增/变更的 slice，并重跑自动化的共享核心
suite。共享 invocation envelope、confirmation/concurrency 或 error 信封层的
变化仍使全部 synthetic/joint 证据失效；该场景的恢复路径是单命令全量重跑，
不是重新人工联合验证。若无此细化，G2～G4 期间每次能力新增都会使 G1 联合
证据进入字面失效状态。

G1 完成后 T-004 可以转为 done，T-002 仍可继续保持 in-progress；T-005～T-007
获得 protected qualification 入口，T-008 只把 G1 作为 required input。它仍不授权
Candidate Freeze、persistent DB apply、internal-store testing、activation 或 traffic。

## G1 Completion Checklist

- [ ] 四层 principal → canonical identity/binding → typed anchor/association →
  current business authority 链路已实现并验证全部 normal/fail-closed 分支。
- [ ] transaction boundary 在真实 disposable PostgreSQL 上通过 revoke、CAS、
  concurrency、exact replay 和 response-loss tests。
- [ ] T-004 Surface Contract Artifact Set 可由 clean checkout 确定性重建，并且
  exact key/version/digest 双向一致。
- [ ] formal NestJS ingress、env contract、route/API index 和
  `8000/3001/3200/3201` 端口分工在 clean install/build/start/health/contract tests
  中通过。
- [ ] Synthetic、Owner Integration Readiness、Joint Conformance 三层资格化分别
  形成独立 PASS，不互相替代。
- [ ] wrong workspace/user/actor/purpose、cross-Institution、revoked、
  quarantined/ambiguous、owner unavailable、stale heads、contract mismatch 和
  leakage negatives 全部 fail closed。
- [ ] 最终 environment/default capability gates 为 false，active rows 为空，未留下
  persistent environment、PII、secret 或外部 effect。
- [ ] 三类 delivery/evidence role 精确互链，任一 currentness drift 能机械失效受影响
  结果，历史记录 append-only 保留。

## Phase 0 — Discovery and Gate Reconciliation

**Result:** PASS on 2026-07-31. Detailed evidence and the authoritative
reuse/extend/gate matrix are in
[`06-phase-0-discovery-and-gate-matrix.md`](./06-phase-0-discovery-and-gate-matrix.md).

- [x] 读取 workflow、product、DB context contract，以及 scenario manifest/module 的当前公共边界。
- [x] 盘点现有 `capability_key`、entrypoint、handler registry、typed command 与 surface presenter，确认可复用的 discovery/dispatch 基础。
- [x] 将 T-002 的已完成能力、未完成 blocker 和不可越过的授权条件映射到六个 surface。
- [x] 输出“复用 / 扩展 / 待上游解锁”差距表，并把工作项分为 contract-parallel、owner-integration-gated、activation-gated。

验收：

- [x] 不以设计稿或路由存在推断权限。
- [x] 每个待实现项都有 owner、source of truth 与 gate。
- [x] synthetic owner fixture 与真实 owner contract 的来源、可用范围和禁止路径可以机械区分。

Phase 0 PASS 只开放既定执行主线，不开放 protected implementation。T-002 ingress
M0-M4 与 T-004 Phase 1-2 现已完成；Phase 3-4 仍只可准备
contract-parallel fixtures、Journey 和 synthetic qualification。T-002 M5 Owner
Integration Handoff 完成前，不得宣称真实 owner readiness。

## Phase 1 — Capability, Surface and Visibility Contract

**Result:** PASS on 2026-07-31 for the normative Phase 1 source and
contract-parallel verification. This result creates no exact root digest,
capability activation or Owner Integration PASS.

- [x] 定义六个 surface 的 actor、workspace、scope、read/write 与敏感度矩阵。
- [x] 定义 `CapabilityDescriptorV1` 的最小 engine-ready 字段：stable key/version、
  domain/execution/delivery 三轴、intent keys、typed input/result/error schema refs、
  target/confirmation/concurrency policy、eligibility policy key/version、handler binding、
  presenter bindings、invalidation scope kinds 与 dependency gates。
- [x] 锁定 queries/commands 按 capability 组织、presenters 按 surface 组织的单向依赖。
- [x] 定义 `SurfaceEnvelopeV1`：exact contract ref、surface/version、state、snapshot、
  actor-safe context、content family、typed content、actions、page info、dependency NO-GO；
  再按 Conversation timeline、Board semantic modules、Workbench Hub/List/Insight
  三类 content family 建立强类型内容联合。
- [x] 定义同一事实如何投影给 guardian、caregiver、institution，而不复制事实所有权。
- [x] 定义 identity binding、Family/Guardian、多个 Institution Enrollment/CareGroup、per-Enrollment GrantRequest/Grant 四个独立就绪轴，不使用单一状态枚举代替 authority 判断。
- [x] 定义 `ready | limited | needs_setup | unavailable` surface state，并保持 module/action eligibility 独立计算。
- [x] 定义 Guardian Chat 的跨授权来源聚合查询、目标已绑定动作卡，以及家庭看板的 per-Enrollment 目标选择和命令边界。
- [x] 锁定空态、加载、失败、权限不足、已撤回与已更正的语义。

验收：

- [x] 任意 view-model 字段都能追溯到 Nurture-owned fact 或明确的 My-Chat opaque identity / policy input。
- [x] institution 聚合不能读取家庭私密正文。
- [x] T-007 D-04 的园区业务沟通不是 ambient aggregate：定义一个 request-time、
  versioned Admin read-only projection，绑定 exact Institution/Enrollment/CareGroup、
  original Grant/data class/purpose、渠道 disclosure 与 source lifecycle。
- [x] 明确 Admin protected read 不授予 CareGroup action authority；当前 manifest/source
  在新 owner-read contract 和 qualification 完成前保持 default-off。
- [x] capability descriptor 只描述可发现性，不复制或弱化真正的授权 policy。
- [x] content family 只表达产品语义，不携带任意视觉组件树、像素布局或 host navigation。
- [x] 单机构试点路径可确定性收敛到唯一 Enrollment，但多机构时不得由 LLM 静默选择写入目标。
- [x] descriptor 的 supported role/eligibility metadata 只用于发现；它不能替代执行时
  current owner/policy reread。
- [x] 初始 envelope 的所有 required content 来自同一 snapshot；后续 module/item cursor
  绑定 actor/scope/contract/snapshot，过期或状态前移时返回 refresh/rebase，不拼接不一致视图。

## Phase 2 — Typed Capability and Presenter Contract

**Result:** PASS on 2026-07-31 for the exact Phase 2 contract baseline and
deterministic build/verify. This is not Synthetic Qualification, Owner
Integration Readiness, Joint Conformance or activation.

- [x] 版本化 capability-first queries、commands、events/receipts、errors 与 pagination。
- [x] 冻结 `InterfaceContractRefV1` 的 wire 形状、artifact-set canonicalization 与 digest：
  discovery、surface/query/action response 必须返回 exact key/version/digest，invocation
  必须声明 expected exact ref。
- [x] 2026-07-31 已接受的分片哈希决策：artifact set 除 root digest 外，必须在
  conformance manifest 中逐 capability、逐 surface 记录 canonical slice hash；slice
  边界定义与哈希顺序属于 canonicalization 规则本身，一并冻结。admission 仍然只
  使用 exact root digest，不因分片放宽为 version range 或 partial admission。
- [x] 定义 presenter 输出的稳定字段、可选字段和兼容性策略。
- [x] 定义 Nurture-owned semantic order、module/item kinds、actions 与 invalidation scopes；My-Chat 保留响应式布局和组件实现权。
- [x] 定义 deterministic eligibility result 与通用 invocation envelope；不实现 LLM provider、语义检索或跨 Scenario router。
- [x] 将 capability-specific business input 与 generic target/concurrency/idempotency
  metadata 分离；concurrency heads 不进入业务 schema。
- [x] capability descriptor 声明 `exact_state | lifecycle_authority | append_compatible`
  summary class，并用 `headBindings[]` 逐项声明 `must_equal | must_satisfy |
  compatible_append | convergent_postcondition`；prepare 把相应 heads、精确 target、
  actor/scope、受保护输入所需的 keyed integrity tag、expiry 与 stable command identity
  绑定进 opaque confirmation。
- [x] 通过 versioned policy/repository ports 隔离未完成的 T-002 owner runtime；不实现 identity、Grant 或 authenticated principal fallback。
- [x] 把宿主展示需求翻译为协议，不在本仓库实现宿主 UI。

验收：

- [x] 黑盒客户端不依赖 Prisma、内部表名或私有 runtime。
- [x] 写操作均有 authority source、idempotency 与 receipt 语义。
- [x] 参考呈现可以替换为 My-Chat renderer，而不修改 capability 或领域契约。
- [x] 缺少真实 owner adapter 时，capability 保持 default-off，并返回明确 dependency NO-GO，而不是退化为 synthetic runtime。
- [x] exact-state action 只有在 descriptor 声明的 convergent postcondition 已满足且其他
  lifecycle/authority heads 仍有效时，才可返回 `already_satisfied`；其他 version
  漂移必须 stale。
- [x] compatibility 检查以 exact digest 为 admission，optional additive change 仍生成新
  digest/version；consumer 不使用版本范围或 `latest`。
- [x] 证据失效范围可由 slice hash 机械判定：某 slice hash 变化只失效引用该 slice 的
  synthetic/joint 证据；additive 新增 slice 不失效任何既有证据，只要求新 slice
  自身完成资格化；共享 invocation envelope、confirmation/concurrency 与 error
  信封层变化仍使全部受影响证据失效。
- [ ] contract artifact build/verify 已可在 clean checkout 用单条命令确定性重跑；
  Phase 4 conformance suite 尚未实现。全量失效
  后的恢复成本是机器时间，不是一轮人工联合验证。

## Phase 2 Quality Closure

**Result:** IN PROGRESS on 2026-07-31. Runtime fail-closed and trusted-artifact
loading are complete; strict schema compilation, permanent CI wiring and exact
contract rotation remain before Phase 3.

- [x] dependency state 在 SemVer/gate 比较前验证 exact fields、stable key、release
  SemVer、closed gate enum 和唯一 dependency key；非法或重复 evidence 失败关闭。
- [x] generated manifest 增加独立 artifact pin；loader 必须同时获得可信 pin，
  canonical manifest hash 不匹配时拒绝，不能把 self-declared interface ref 当作
  artifact integrity。
- [x] loader 与 generator 对 concurrency condition refs、schema refs、handler/
  presenter stable keys、roles、invalidation scopes 和数组唯一性保持一致。
- [ ] 全部 JSON Schema 通过 Ajv 2020 strict compilation，并验证 generated manifest
  与 artifact pin。
- [ ] tooling tests、schema compilation 和 deterministic manifest/pin rebuild 进入
  GitHub Actions permanent gate。
- [ ] 规范 schema 变化旋转 interface version/digest，更新 exact handoff 文档并完成
  全量 regression。

验收：

- 非法版本、未知 gate、重复 dependency state 不得产生 `eligible`。
- semantic manifest tamper 即使保留原 contract ref 也不得通过 trusted loading。
- compatibility admission 只判断 exact interface ref；artifact integrity 由独立可信
  pin 提供，二者不得互相替代。
- quality closure PASS 前不得进入 Phase 3。

## Phase 3 — Fixtures and Cross-role Journey

- 建立最小合成家庭、孩子、照护者、班级和机构数据集；至少包含一个 bound ChildCareProcess 的两个隔离 Institution Enrollment，以及单机构试点 profile。
- 建立一个版本化 synthetic world，但为每条 Journey 生成独立、可重复的初始状态。
- 固定 Journey Portfolio：
  - GJ-1 家庭关注流向照护者。
  - GJ-2 照护日常流向家庭。
  - GJ-3 多源事实沉淀为成长连续性。
  - GJ-4 入托、家长确认与授权建立。
  - GJ-5 机构理念流向日常支持。
  - RJ-1 撤权、纠正与恢复。
- 为后续 T-005 至 T-008 提供按 Journey 分离的 fixture、输入、预期快照、receipts 和最高风险拒绝路径。
- 增加 capability selection fixtures：候选过滤、正确选择、需要澄清、需要确认与不可用。

验收：

- fixture 不含真实 PII。
- 同一事实的多角色投影一致，且跨边界内容只有在显式发送后出现；任何机构都不能推断另一机构的存在或状态。
- 每条 Journey 可独立重跑，不从另一条 Journey 的可变数据库结果继承状态。
- Portfolio 覆盖六个 surface；完整 role/action 组合由 conformance matrix 而非 Journey 脚本承担。

## Phase 4 — Contract Qualification

- 运行 schema/context、type、unit、contract 与 fixture determinism 检查。
- 验证 catalog → eligibility → typed handler → surface presenter 的确定性链路，不要求共享 LLM 引擎存在。
- 记录 breaking-change policy、consumer adoption checklist 与准确 pin 方法。
- 分别出具 synthetic contract qualification 与真实 owner-integration readiness；前者通过不能替代后者。
- 输出供 T-008 使用的 interface contract identity/version/digest 与 compatibility handoff；Service Candidate identifier、bundle freeze 和 composite validation record 不在 T-004 实现。
- 输出机器可验证的 `SurfaceContractV1` artifact set：descriptor registry、surface
  schemas、invocation/result/error schemas、policy/schema refs、fixture manifest 与
  conformance manifest；这些 artifact 的规范内容共同生成 interface digest。
- conformance manifest 的 fixture/case 条目支持可选的 acceptance-item 引用字段
  （如 `T005-AC-###`），供消费任务把验收条目机械回链到具体检查；该字段属于
  manifest schema，缺失引用不影响 T-004 自身资格化。

验收：

- 形成可供后续任务消费的版本化基线。
- 形成 engine-ready 而非 engine-complete 的交付；未来共享引擎可以消费 descriptor，但不成为 T-004 完成条件。
- T-004 可以在 T-002 runtime 未完成时完成 contract baseline milestone；这不是
  T-004 task Exit 或 G1 PASS，也不能宣称真实 binding、Enrollment/Grant、
  authenticated path、notification 或 traffic 已通过。
- interface contract 变化按 compatibility 规则版本化，不存在 mutable `latest`、浮动 contract 或原地覆盖；T-004 不因 Service Candidate ID 格式尚未确定而 blocked。
- 所有 T-002 未满足门禁继续显示为 NO-GO，而非被本任务“补齐”。
- descriptor registry、surface schemas、invocation/result/error schemas 与 fixture/
  conformance manifests 对同一 contract ref 双向一致；任一引用缺失、重复或 digest
  不一致均 qualification fail。
