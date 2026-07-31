# Pitfalls — 六个核心 Surface 的产品契约基座

## Known Guardrails

- 不要把 T-003 的可点击 demo 当成已实现产品能力。
- 不要为方便 UI 联调复制 My-Chat identity、auth、route 或 runtime。
- 不要把 opaque `child_id`、family binding 或 scenario binding 当作授权。
- 不要把 authenticated principal、platform binding、typed anchor 或 local association
  中任一层当作 Nurture current business authority。
- 不要让 Institution Admin、Caregiver 或 Nurture 创建、推断、PII 匹配或自动合并/
  rebind My-Chat canonical Child/Family。
- 不要让 service token 同时代表 workload 和成人身份；二者必须独立验证。
- 不要用 transaction 外 pre-read authority 签发 Receipt，也不要在 Nurture
  transaction 内调用远端 My-Chat。
- 不要把短生命周期 binding-owner Receipt 与 business
  `CommandExecution`/`Receipt` 合成一种 replay 或 persistence 语义。
- 不要让 client/LLM 提交 raw Enrollment、Grant、RoleAssignment、anchor、
  authority outcome、current permission 或 owner evidence。
- 不要把 Fastify dev-host-only evidence 当作 G1 Joint Conformance；最终 G1 必须经
  formal NestJS scenario-service ingress。
- 不要因为 task 状态、CI 链接或说明文档存在就认为 G1 已完成；必须精确关联
  Surface Contract Artifact Set、Owner Integration Handoff 和 Joint Conformance
  Record。
- 不要用真实儿童或家庭数据构造 fixture。
- 不要因为调用成功就跳过 authority reread、receipt 或 owner-reread 验证。
- 不要把 capability descriptor、supported role 或 LLM 选择结果当作 authorization grant。
- 不要在 T-004 内建设跨 Scenario 共享 LLM 路由引擎或直接调用 provider SDK。
- 不要把 semantic module 退化为通用 `type + props` component tree 或像素级布局协议。
- 不要让当前参考呈现演化成独立 Nurture shell；My-Chat 仍拥有最终 native/web rendering。
- 不要用一条故事主线替代六个 surface 的代表性产品闭环和反向数据流。
- 不要让多条 Journey 共享一个按顺序变异的数据库状态；必须可独立、确定性重跑。
- 不要把单机构试点固化为“一名孩子只能有一个 Institution Enrollment”；多机构数据必须按 Enrollment 隔离。
- 不要把 Institution 发出的 GrantRequest 当成 Grant，或让机构角色代替当前 Guardian 建立、替换、撤销授权。
- 不要让 LLM 为开放式写操作静默选择 Institution；多目标写入应在 family board 绑定具体 Enrollment。
- 不要把 Guardian 可读的跨机构 child-context summary 暴露给任一 Institution，或在聚合时丢失 provenance 和原始 Grant fence。
- 不要把 T-007 的园区业务沟通只读投影实现成 Institution membership 的 ambient body
  access；必须逐请求校验 disclosure、exact original Grant/data class/purpose 和
  source lifecycle。
- 不要因 Admin 可读园区业务沟通就把 Admin 加入 CareGroup、共享 transcript，或授予
  acknowledge/reply/correction/redaction。
- 不要把 family-private AI、草稿、My-Chat 私人聊天或其他 Institution 内容混入
  `InstitutionBusinessCommunicationProjectionV1`。
- 不要把 synthetic owner fixture 接入真实 runtime、fallback 或 migration，也不要用它替代 T-002 owner-path qualification。
- 不要因为 T-004 contract tests 通过就宣称真实 identity、Enrollment/Grant、authenticated path、notification 或 traffic 已通过。
- 不要为绕过 T-002 gate 复制 My-Chat/T-002 的 identity、auth、owner-reread、receipt 或 persistence 代码。
- 不要把 My-Chat/Nurture 的认证接口调用关系写成 My-Chat 采用 Nurture 代码、package 或 Candidate bundle。
- 不要让 My-Chat 浮动组合 API/capability/presenter contract，也不要把 fixture、migration 或 source bundle 变成运行时 consumer dependency。
- 不要原地修改已经分配 identity 的 Service Candidate，也不要把 Service Candidate/contract pin 当作 qualification、activation 或 traffic authorization。
- 不要让 T-004 设计 T-008 的 Service Candidate identifier、发布工具或 composite device-evidence schema；T-004 只负责 interface contract identity/compatibility。
- 不要把异步、跨 owner、worker、Handoff 或通知当作 Workflow 分类条件。
- 不要把 board 能展示 Workflow 进度误写成 board 拥有 Run/Step 或可绕过 authority。
- 不要用未限定的 `workflow` 指代 CareInteraction、ActionDelivery 或 PublishProcess。
- 不要把 domain、execution、delivery 和持久化 process 压成一个 `operationClass`；
  `CareInteraction`、`ActionExecution` 与 `ActionDelivery` 是不同轴。
- 不要把 concurrency heads 塞进 capability-specific business input，或允许客户端/LLM
  自报；它属于 prepare-time precondition。
- 不要让 exact-state action 在 execute 时“重新获取最新版本后继续”，这会把 stale
  user intent 伪装成有效确认。
- 不要把 strict whole-aggregate CAS 套在 append-compatible action 上；兼容的新
  append 不是冲突。
- 不要用 idempotency key 替代 concurrency precondition；重复请求与状态/authority
  安全是两个问题。
- 不要只声明一个 concurrency enum 而省略 exact head bindings 和 declared
  convergence；否则 acknowledge 的合法收敛会与任意 stale version 混淆。
- 不要对受保护正文保存 bare canonical hash；低熵内容完整性必须使用 secret-keyed
  tag，且正文不得进入 confirmation、日志或 telemetry。
- 不要让 surface cursor 跨 contract digest、actor、scope、query、sort 或 snapshot
  复用，也不要静默把两个 snapshot 拼成一个列表。
- 不要把 source revision、build time 或生成环境混进 semantic interface digest；
  它们是 provenance。contract 内容不变时 identity 应可重建，内容变化时才产生新
  version/digest。
- 不要把未确认 `prepareAction` 或技术调用进行中状态自动投影为 canonical
  `pending-send`；只有对应 capability 确有业务/投递状态时才能展示。

## Resolved Pitfalls

### 2026-07-31 — Relative schema refs under an opaque URN base

- Symptom: Phase 1 schemas used relative `$ref` paths while their `$id` values
  were opaque `urn:` identifiers.
- Root cause: relative URI resolution requires a hierarchical base; an opaque
  URN cannot reliably resolve `../interface/...`.
- What was tried: initial structural tests proved the JSON shape but did not
  exercise URI resolution.
- Fix: assign stable hierarchical HTTPS schema IDs that mirror the normative
  source paths.
- Prevention: every schema using a relative `$ref` must have a hierarchical
  canonical `$id`, and Phase 2 strict admission must resolve the complete graph.

### 2026-07-31 — Runtime availability leaked into semantic handler binding

- Symptom: `handlerBinding` initially required
  `absent | default_off | contract_parallel` availability.
- Root cause: current rollout state was mixed with stable interface semantics;
  toggling an environment gate would have changed the interface digest without
  changing a handler contract.
- What was tried: dependency gates were present but did not eliminate the
  duplicated runtime field.
- Fix: replace availability with stable
  `query | action | institution_workflow | publish_process` binding kind.
  Runtime/default-off state remains outside the semantic artifact.
- Prevention: semantic digest inputs may describe required qualification
  dependencies, but never current deployment, activation or environment state.

### 2026-07-31 — Presenter requirements accidentally exposed system capability

- Symptom: the descriptor schema required at least one presenter binding for
  every capability.
- Root cause: user-discoverable and internal policy capabilities were treated
  as one presentation class.
- What was tried: an optional supported role did not solve the forced UI
  binding.
- Fix: allow an empty presenter list while keeping every listed presenter
  strictly typed. Internal system capabilities can remain absent from user
  discovery.
- Prevention: discovery/presentation requirements must be capability-specific;
  do not force internal safety operations into a user surface.

### 2026-07-31 — Stale test population after adding a contract suite

- Symptom: the new Phase 1 test file passed, but the CI unit population still
  expected 187 tests.
- Root cause: the direct test and TypeScript checks did not run the JSON
  reporter's separate population assertion.
- What was tried: focused and full human-readable Vitest runs both passed.
- Fix: update the exact population to 197 and run
  `test:unit:ci` together with `verify:unit-population`.
- Prevention: every test addition must renew both file routing and result-count
  gates.

### 2026-07-31 — Partial visibility rows and missing owners left implicit defaults

- Symptom: initial surface rows listed some allowed and denied data classes but
  omitted others, leaving their default visibility open to interpretation; the
  data classes also lacked a machine-readable canonical owner.
- Root cause: the matrix tests checked that referenced classes were declared,
  but did not require every surface to classify the complete data-class set or
  trace every class to My-Chat/Nurture ownership.
- What was tried: disjoint read/deny checks caught contradictions but not
  omissions.
- Fix: make every row a total classification and require the union of
  read/write/explicitly-denied classes to equal the declared data-class set.
  Require an exact owner map for the same set.
  Guardian surfaces explicitly retain cross-Institution provenance; all
  Institution/Caregiver surfaces explicitly deny other-Institution presence.
- Prevention: authorization and visibility matrices must be total, not sparse;
  absence is never an implicit allow or deny rule.

### 2026-07-31 — Contract primitives were duplicated across schemas

- Symptom: descriptor and envelope schemas each carried their own stable-key,
  SemVer and opaque-ref definitions.
- Root cause: the initial files were authored independently before the schema
  graph was reviewed as one canonical artifact set.
- What was tried: individual schema tests proved each copy was internally
  valid but could not prevent later semantic drift between copies.
- Fix: add one `contract-primitives.schema.json`, replace local copies with
  relative references and test that every local reference resolves.
- Prevention: shared wire primitives have one normative schema definition;
  consumers reference it instead of copying regexes or enums.

### 2026-07-31 — Shared actor-role primitive widened surface admission

- Symptom: after primitive deduplication, `SurfaceEnvelopeV1.actorContext`
  inherited the internal `system_policy` capability role.
- Root cause: capability discovery roles and user-facing surface roles were
  modeled as one shared enum.
- What was tried: registry tests kept the six configured surfaces human-bound,
  but the envelope schema itself still admitted a system actor.
- Fix: split `capabilityActorRole` from `surfaceActorRole`; only the former
  includes `system_policy`.
- Prevention: shared primitives must not erase trust-boundary distinctions;
  schema-level admission is reviewed independently from current registry data.

### 2026-07-31 — Root interface version leaked into capability slice hashes

- Symptom: the first generator draft included interface key/version in every
  capability slice payload.
- Root cause: exact admission identity and evidence invalidation identity were
  treated as the same hash boundary.
- Impact: adding one new capability would rotate the root version and
  mechanically change every existing capability slice, defeating the accepted
  additive-slice rule.
- Fix: root admission still uses exact key/version/digest, while a capability
  slice hashes only its descriptor source, referenced schema closure and exact
  policy/repository bindings. The generated descriptor receives the root ref
  after slice computation.
- Prevention: never include root digest/version in a local slice; shared-core
  changes invalidate globally through `sharedCoreHash`, not by accidental
  coupling.

### 2026-07-31 — Prepare failure union matched two identical branches

- Symptom: `denied` and `unavailable` both referenced the same safe-failure
  schema as separate `oneOf` alternatives.
- Root cause: semantic labels were modeled as branch names while the actual
  discriminator remained a two-value enum inside one shared schema.
- Impact: a valid safe failure matched both alternatives and therefore failed
  `oneOf`.
- Fix: keep one safe-failure branch with the closed `denied | unavailable`
  discriminator.
- Prevention: each `oneOf` alternative must be mutually exclusive by schema,
  not merely by its local definition name.

### 2026-07-31 — Private invocation omitted replay-protection context

- Symptom: the initial generic invocation schemas carried trusted-context and
  scope refs but omitted purpose, nonce and request expiry.
- Root cause: T-002 private-ingress validation was assumed to remain implicit
  behind `trustedContextRef`.
- Impact: the T-004 public contract did not fully state the G1-03 invocation
  preconditions that the adapter must preserve.
- Fix: query, prepare, execute and readResult now require purpose, nonce and
  expiry; action operations additionally carry generic command identity,
  idempotency and confirmation metadata as applicable.
- Prevention: an opaque principal/context ref may hide identity values, but it
  must not erase explicit freshness, purpose or replay semantics.

### 2026-07-31 — Generator and loader strictness stopped at top-level shape

- Symptom: early validation rejected missing source refs but did not reject
  nested descriptor drift, non-finite JSON numbers, unsafe generated filenames
  or a manifest whose canonical source-set digest disagreed with its root
  digest.
- Root cause: structural checks were added incrementally around the happy path.
- Fix: strict JSON parsing rejects duplicate/non-finite input; source
  validation closes nested bindings and complete reference graphs; generated
  output is constrained to the canonical in-repo filename; loader admission
  checks nested fields, source-set/root parity and recursively freezes the
  result. The semantic field is named `sourceDigest`; Git/source revision
  remains separate qualification provenance.
- Prevention: deterministic generation requires strictness at parse, semantic
  binding, output-path and consumer-load boundaries, not only byte comparison.

### 2026-07-31 — Invalid dependency evidence passed comparison fail-open

- Symptom: a dependency state with `version: "not-semver"` or an unknown gate
  reached `compareSemver`/`gateRank` and returned `eligible`.
- Root cause: TypeScript input types were treated as runtime validation.
  JavaScript `NaN < 0` and `undefined < rank` are both false.
- Impact: malformed owner/dependency evidence could bypass the default-off
  readiness decision once the helper was integrated.
- Fix: validate exact state fields, stable key, release SemVer, closed gate
  enum and unique dependency keys before constructing the comparison map.
- Prevention: every policy/evidence input crossing a runtime boundary must be
  parsed before comparison; static types are never authority evidence.

### 2026-07-31 — Self-declared interface ref was mistaken for manifest integrity

- Symptom: a manifest could retain the original key/version/digest while
  changing a structurally valid semantic field, and loader plus compatibility
  admission would accept it.
- Root cause: compatibility identity and artifact-content authenticity were
  represented by the same self-declared ref.
- Fix: generate a separate canonical manifest artifact pin, require it during
  loading and align nested loader validation with generator semantics.
- Prevention: callers must acquire the artifact pin from an independently
  trusted source revision, Service Candidate or deployment configuration.
  A pin delivered beside a manifest in the same untrusted payload is not a
  trust root; exact interface admission remains a separate compatibility test.

### 2026-07-31 — Structural reference checks missed strict schema compilation

- Symptom: all local `$ref` paths resolved and contract tests passed, but Ajv
  2020 `strict: true` rejected `SurfaceEnvelopeV1` because conditional
  `content.items` branches did not declare their array type.
- Root cause: build validation proved graph closure, not standards-compiler
  acceptance; the dedicated build/verify commands were also absent from CI.
- What was tried: the first conditional-head hardening used nested
  `not.required`; the new strict gate correctly rejected it under
  `strictRequired`.
- Fix: declare array type in every envelope branch, express forbidden
  conditional properties with boolean schemas, add a normative artifact-pin
  schema, and run Ajv compilation plus manifest/pin negatives in CI alongside
  tooling and deterministic rebuild checks.
- Prevention: reference resolution, JSON Schema compilation, generated
  instance validation and source/generated byte parity are four distinct
  checks. A contract baseline is not quality-closed until all four are
  permanent CI gates.
