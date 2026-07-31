# Implementation Notes — 六个核心 Surface 的产品契约基座

## 2026-07-29 — Task package created

- 创建 T-004 规划包。
- 将任务定位为 T-003 设计到产品实现之间的公共契约基座。
- 锁定 My-Chat 只通过版本化场景契约消费，不在本仓库实现宿主 UI。
- 当前无代码、schema、manifest 或 runtime 变更。

## 2026-07-29 — Contract organization aligned

- 用户确认 T-004 只做到 engine-ready，不建设跨 Scenario 共享引擎。
- 锁定双平面模型：capability discovery metadata + deterministic typed execution。
- 锁定 queries/commands 按 capability 组织，presenters 按 surface 组织。
- LLM 只能在 policy-filtered candidates 内选择；权限与写入前置条件由 handler 重验。
- 完整共享引擎留给 My-Workflow-Base / My-Chat 的独立平台任务，不阻塞 Nurture。
- 本次仅更新规划文档，无应用代码、配置、schema 或数据库变更。

## 2026-07-29 — Surface output model aligned

- 用户确认当前先按 The Nurture 项目节奏推进，My-Chat 适配后置到 companion。
- 锁定 atomic surface envelope + 三类 content family：
  Conversation timeline、Board semantic modules、Workbench Hub/List/Insight。
- Nurture owns 输出内容、业务状态、语义顺序和 capability affordances；My-Chat owns 终端组件与交互实现。
- 排除通用 server-driven UI、像素级 layout contract 和 LLM 任意组件树。
- 允许当前项目使用参考 renderer/检验工具验证 contract，但不创建独立 App shell。
- 本次仅更新规划文档，无应用代码、配置、schema 或数据库变更。

## 2026-07-29 — Golden Journey Portfolio baseline aligned

- 用户否决“唯一主线足以代表完整产品”的假设。
- 暂定并记录五条产品 Journey：GJ-1 家庭→照护者、GJ-2 照护者→家庭、GJ-3 成长连续性、GJ-4 关系/授权建立、GJ-5 机构支持。
- 增加 RJ-1 撤权/纠正/恢复作为跨域韧性 Journey。
- 六条 Journey 共用版本化 synthetic world，但各自从 fresh isolated state 独立运行。
- `waiting_and_turn_taking` 仅作为 GJ-1 主题；Journey 细节可在不改变 Portfolio 结构的前提下继续细化。
- 本次仅更新规划文档，无应用代码、配置、schema 或数据库变更。

## 2026-07-29 — Identity, multi-institution and Chat/Board baseline aligned

- 六个正式 surface 不纳入 product-visible provisional child；当前以 synthetic bound fixtures 开发，真实采用必须由家长授权建立 My-Chat Child/Family binding。
- identity binding、Family/Guardian、Institution Enrollment/CareGroup、per-Enrollment Grant 被锁定为独立 authority 轴，不使用单一状态枚举代替 owner-reread。
- 一个 ChildCareProcess 可以同时或先后关联多个彼此隔离的 Institution Enrollment；机构侧不得获知其他机构的存在、数量、名称、状态或内容。
- Enrollment 不是 Grant。机构可以针对自己的 Enrollment 发起 GrantRequest，但请求本身不授权；当前 Guardian 明确确认后才创建 Grant，且首个成功确认者是 sole replace/revoke owner。
- Guardian Chat 定位为 child-centered、跨当前授权来源的反馈和总结入口；Nurture 先做权限过滤、来源整理和多 Enrollment 聚合，LLM 不选择机构 API。
- 需要选择接收机构的开放式写操作默认进入家庭看板；Chat 只直接处理目标已绑定的 action card，或单机构试点中唯一合法目标的确定性动作。
- GJ-1 调整为 Chat 私域理解/整理后在 family board 选择 Enrollment 并显式分享；GJ-3 覆盖带 provenance 的多 Institution 聚合；GJ-4 增加 Institution GrantRequest → Guardian Grant。
- 本次仅更新规划文档，无应用代码、配置、schema 或数据库变更。
- 当前任务包和项目治理视图仍在未提交 worktree 中，尚无携带 `Task: T-004` 的提交；这些决策已落稿但不能描述为 landed implementation。

## 2026-07-29 — T-002 parallelism and activation fence aligned

- 用户确认 T-004 不因 T-002 runtime/qualification 尚未完成而整体 blocked。
- 锁定 contract-first parallel development：capability/schema/ports/presenters/synthetic fixtures/Journey/conformance 可以先行。
- 锁定 owner-integration gate：真实 binding、Enrollment/Grant、authenticated principal、owner-reread、receipt、persistence/public adapters 等待对应 T-002 exact contract/version。
- 锁定 activation gate：T-008 candidate freeze、My-Chat adoption 与真机构建必须等待所需 T-002 adapters 和 qualification pins。
- synthetic owner fixture 只能用于测试和参考呈现，不能成为真实 runtime、fallback、identity/Grant 来源或 migration seed。
- T-004 可完成 synthetic contract qualification，但必须保留 default-off、dependency NO-GO，并准确声明真实 owner path 未实现。
- 本次仅更新规划文档，无应用代码、配置、schema 或数据库变更；worktree 仍未提交。

## 2026-07-29 — Immutable Candidate adoption unit aligned

- 用户确认 My-Chat 采用一个不可变 Candidate bundle。
- Candidate bundle 是唯一 external adoption/pin 单元；My-Chat 不分别选择 capability、surface、fixture、manifest 或 dependency 版本。
- 内部 contract/schema/fixture 仍独立版本化，用于 compatibility、diff 与 evidence，但不成为 consumer 可自由组合的 rollout knobs。
- 任一 pinned 内容变化必须产生新 Candidate identity；禁止 mutable `latest`、版本范围、浮动依赖和原地覆盖。
- exact Candidate pin 与 qualification、activation、internal testing、traffic authorization 保持分离。
- 本次仅更新规划文档，无应用代码、配置、schema 或数据库变更；worktree 仍未提交。

## 2026-07-29 — Service/API boundary correction

- 用户指出 My-Chat 与 Nurture 是接口调用关系，不应描述为 My-Chat 采用 Nurture 代码或 Candidate bundle；该纠正 supersedes 上一节的 adoption-unit 表述。
- Nurture Service Candidate 保留为 Nurture-owned release/qualification/rollback 单元。
- My-Chat 只通过认证私有 API 消费 versioned interface contract，不 import Nurture package/ORM、不下载 bundle、不直连数据库。
- TestFlight/Play 证据改由 composite validation binding 关联 My-Chat build/backend revision、Nurture Service Candidate、interface contract digest 和 test environment。
- Service Candidate、contract compatibility、qualification、deployment、activation 与 traffic authority 保持独立。
- 本次仅更新规划文档，无应用代码、配置、schema 或数据库变更；worktree 仍未提交。

## 2026-07-29 — Identity ownership split locked

- 用户确认按建议锁定三类 identity 的任务归属。
- T-004 只负责 interface contract logical identity、version/digest 语义和兼容规则；
  当时将确切 wire 字段/canonicalization 留给 discovery，该开放项已被本轮合同审阅收敛。
- T-008 负责 Service Candidate identifier/digest、bundle freeze、qualification 和 rollback 证据。
- T-008 与 My-Chat companion 联合负责 composite validation binding。
- Service Candidate identity/composite binding 不进入普通业务请求或 Nurture authorization；其具体格式不阻塞 T-004～T-007。
- T-004 的顶层产品/架构决策至此收敛，下一步进入 Phase 0 discovery。
- 本次仅更新规划文档，无应用代码、配置、schema 或数据库变更；worktree 仍未提交。

## 2026-07-29 — Workflow/Action/Projection terminology aligned

- Workflow 收敛为园区管理 `InstitutionWorkflow`；Web workbench 是主要操作面。
- Boards 可以消费角色安全 `InstitutionWorkflowProjection`，但不拥有 Run/Step 或权限。
- family-care 使用 `CareInteraction`/`ActionExecution`/`ActionDelivery`，caregiver
  two-stage publish 使用 `PublishProcess`。
- 当时要求 capability descriptor 显式 operation class；该单轴表述已被本轮审阅替换为
  domain/execution/delivery 三轴。异步、跨 owner、worker 或通知仍不构成 Workflow
  分类依据。
- 当前只更新文档，无应用代码、配置、manifest、schema 或数据库变更。

## Open Items

- T-002 到 family-care 落地合同的事实/schema 差距已由 T-005
  `06-t002-fact-schema-gap.md` 盘点；T-004 Phase 0 只需验证实际公共接口是否满足
  exact interface contract，不再重复推断数据库事实。
- Phase 1 已创建 interface-ref/descriptor/envelope schemas、六-surface registry、
  visibility matrix、readiness/snapshot rules 和 source parity tests。Phase 2 仍需
  创建 concrete descriptor registry、invocation/result/error/cursor artifacts、
  loader、canonical digest/slice builder、generated manifest 与 deterministic
  build/verify commands。
- 每条 Journey 的详细步骤、最小 fixture 和 negative branch 在对应 capability discovery 后细化，不重新打开 Portfolio 结构。

## 2026-07-29 — Business input and concurrency precondition separated (historical)

- 用户确认采用通用 optimistic-concurrency/idempotency 分层，但不把某一种 wire
  token 形式误称为唯一行业标准。
- capability-specific typed input 只包含业务字段；target、expected version、
  authenticated actor/scope 和 command identity 属于通用 Harness contract。
- 当时使用单一 expected-version/hash 表述；本轮审阅将其替换为 typed
  `headBindings[]` 与 canonical input integrity。protected low-entropy body 使用
  secret-keyed tag；execute 不得自动追随最新状态。
- expected version 与 CommandExecution idempotency identity 保持正交；前者防止
  stale intent/lost update，后者支持 transport retry 与 exact replay。
- 当前只更新规划文档，无应用代码、配置、manifest、schema 或数据库变更。

## 2026-07-29 — Capability-specific concurrency classes locked

- 用户确认 T-005 reply 是 CareGroup-owned append，不存在单一回复 winner。
- 本决策 supersede 将所有 action 一律绑定 whole-aggregate exact version 的解释。
- descriptor 增加 `exact_state | lifecycle_authority | append_compatible`
  concurrency summary class。acknowledge 使用 exact acknowledgement head +
  declared convergence；reply 使用 append-compatible lifecycle/authority/policy heads。
- 另一个合法 reply 不使 confirmation stale；closed/suppressed、Grant/Enrollment/
  CareGroup、role、policy 或 retention 漂移仍失败关闭。
- concurrency precondition 与 CommandExecution idempotency identity 继续正交。
- 当前只更新规划文档，无应用代码、配置、manifest、schema 或数据库变更。

## 2026-07-29 — Full contract coherence and executability review

- 完整审阅 T-004 overview/plan/architecture/verification/pitfalls，并对照 product/workflow
  context、scenario manifest/module 和 T-005 family-care contract。
- 修复“所有跨边界动作都可撤回/更正”的过度承诺，改为逐 capability 明确
  correction/withdrawal/redaction/irreversible audit。
- 发现 `CareInteraction`、`ActionExecution`、`ActionDelivery`、`PublishProcess` 和
  `InstitutionWorkflow` 原本被要求塞进一个 operation class；现改为
  domain/execution/delivery 三轴，固定 `CapabilityDescriptorV1` 最小字段。
- 固定 `InterfaceContractRefV1` 的 exact key/version/digest wire 语义、artifact-set
  canonicalization、admission 和 no-range/no-latest 规则。
- 将 concurrency 从单一 summary enum 扩展为 typed `headBindings[]`，补充
  `must_equal`、`must_satisfy`、`compatible_append` 和
  `convergent_postcondition`。因此 acknowledge 可以在目标状态已满足时合法收敛，
  reply 可以兼容 append，而其他 drift 仍 fail closed。
- 固定 `SurfaceEnvelopeV1` 最小字段、atomic snapshot、cursor binding、refresh/rebase
  和 dependency NO-GO 语义；未确认 prepare 不再被误写为 canonical pending timeline。
- 修正 Caregiver teacher board：它同时承载 family-care work action 和独立
  PublishProcess，不再被描述为“只有两阶段发布”。
- 当前仅修改 T-004 规划合同，无应用代码、manifest、schema 或数据库变更。

## 2026-07-30 — T-007 D-04 Institution Admin protected-read addendum

- T-007 将 Admin mobile 固定为班级优先，并允许 Admin 无需老师升级即可只读查看从
  发送前已披露的园区业务沟通。
- T-004 visibility matrix 增加 planned
  `InstitutionBusinessCommunicationProjectionV1`：逐请求验证 exact current
  Admin、Institution/Enrollment/CareGroup、original Grant/data class/purpose、
  disclosure 与 source lifecycle。
- 该 projection 不包含家庭私密 AI/草稿/私人聊天/其他 Institution，也不授予
  acknowledge/reply/correction/redaction。
- 这是 additive、security-sensitive interface 变化；实现时必须产生新的 exact
  contract version/digest，不得复用旧 interface identity。
- 当前 manifest/module/source 仍只有 display-safe legacy institution owner reads；
  没有新增 route、handler、schema、runtime 或 activation。

## 2026-07-31 — Slice-hash invalidation granularity accepted

- 用户确认在 Phase 2 冻结 `InterfaceContractRefV1` 前采用分片哈希决策。
- 动机：按原字面规则，additive 能力新增旋转 root digest 并使 G1 synthetic +
  joint 证据整体失效，而 G2～G4 全程都在新增能力，G1 证据将处于持续字面失效
  状态；"受影响"缺少机械定义时只能在全量重跑与人工判断之间二选一。
- 决策：conformance manifest 逐 capability/逐 surface 记录 canonical slice hash，
  slice 边界与哈希顺序进入 canonicalization 规则；admission 仍只用 exact root
  digest。失效范围由 slice hash 机械判定：slice 未变化的既有证据保持有效，
  additive 新增只要求新 slice 资格化；共享 invocation/confirmation/error 信封层
  变化仍全量失效，恢复路径是单命令确定性全量重跑。
- 落点：`01-plan.md` Phase 2 条目与验收、G1-07 粒度细化段、`00-overview.md`
  验收条目。
- 当前只更新规划文档，无应用代码、配置、manifest、schema 或数据库变更。

## 2026-07-31 — Conformance manifest AC-reference field accepted

- 配合 T-005/T-006/T-007 的 acceptance-to-check mapping 决策，conformance
  manifest 的 fixture/case 条目增加可选 acceptance-item 引用字段
  （如 `T005-AC-###`），使消费任务能把验收条目机械回链到具体检查。
- 该字段属于 manifest schema；缺失引用不影响 T-004 自身资格化。落点为
  `01-plan.md` Phase 4。本次只更新规划文档，无代码、manifest 或 schema 变更。

## 2026-07-31 — Phase 0 discovery and gate reconciliation completed

- T-004 从 `planned` 转为 `in-progress`；复用现有任务和 M-002/F-003 映射，
  未创建新任务或扩大 scope。
- 新增 `06-phase-0-discovery-and-gate-matrix.md`，完成 context、manifest/module、
  handler/policy/presenter、repository/DB、API/ingress、fixture/test 的当前事实盘点。
- 固定 source decision 为 `REUSE | EXTEND | REPLACE_SEMANTICS | ADD |
  DEFER_SAFE`，execution gate 为 `CONTRACT_PARALLEL | OWNER_INTEGRATION |
  JOINT_CONFORMANCE | ACTIVATION`。
- 确认当前 vNext manifest 为 7 capabilities / 8 entrypoints，默认 module 使用移除
  legacy family-input activation seam 的 pre-activation manifest；当前
  `WorkflowPresenters`、两个 institution safe collection 和 Fastify routes 均不等于
  六 surface contract。
- 确认 CommandExecution/InteractionContext/institution resolver/repository-port
  边界可复用，但 legacy raw-id、whole-Item version、single-reply family-care
  semantics 必须由 T-005 replacement/cutover，不能成为 T-004 public contract。
- 为 Phase 1 预留单一 artifact source、generated manifest、loader、tests 与 ESM
  build/verify 脚本落点；没有创建 interface identity、contract artifact 或发布包。
- Context/test-routing/persistence/N1 checks 通过；exact pin verifier 明确报告
  My-Chat expected `f00b868` / actual `e1a5cdd` drift。该差异保持为
  Owner Integration NO-GO，不通过浮动 repin 或 live-checkout fallback 处理。
- Phase 0 PASS 后，项目主线先进入 T-002 ingress M0→M3/M4，再返回 T-004
  Phase 1-2。无应用代码、schema/migration、数据库、manifest/capability、secret、
  environment、deployment、activation 或 traffic effect。

### Handoff / next three actions

1. 恢复 T-002：运行
   `node .ai/scripts/ctl-project-governance.mjs resume --task T-002 --json`。
2. 以 T-002 的 `12-nestjs-ingress-migration-plan.md` 为入口完成 M0 决策记录，再推进
   M1-M3 与 M4：固定 NestJS port/route、G1-03 route census、wire stability 和
   owner-integration verification；不得用 Fastify dev-host 证据替代正式 ingress。
3. T-002 M0-M3/M4 达到其 gate 后，重新运行
   `node .ai/scripts/ctl-project-governance.mjs resume --task T-004 --json`，按
   `06-phase-0-discovery-and-gate-matrix.md` 的落点实施 Phase 1-2 contract source、
   generated manifest、loader 与 deterministic build/verify tooling。

## 2026-07-31 — Phase 1 capability/surface/visibility source completed

- Created the scenario-owned normative source under
  `packages/nurture-scenario/contracts/surfaces/v1/source/` without copying
  My-Chat runtime or assigning a placeholder interface digest.
- Froze the exact `InterfaceContractRefV1` shape, engine-ready
  `CapabilityDescriptorV1` axes and policies, atomic `SurfaceEnvelopeV1`, three
  closed content families, six role-bound surface records and the visibility
  matrix.
- Separated four readiness axes, current authority from discovery, Guardian
  multi-Institution provenance from Institution isolation, Admin protected
  business read from CareGroup action authority, GrantRequest from Grant and
  writable `InstitutionWorkflow` from its read-only projection.
- Quality review repaired seven contract defects before acceptance:
  resolvable HTTPS schema IDs replaced non-resolvable relative references from
  `urn:` bases; runtime handler availability was removed from the semantic
  digest inputs; and internal system capabilities may have zero presenter
  bindings. The visibility matrix is also total: every data class is explicitly
  read/writable or denied for every surface. Shared keys, versions, schema refs,
  opaque refs and actor roles now come from one primitive schema instead of
  duplicated definitions, while system-policy capability roles remain excluded
  from surface actor contexts. Every visibility data class now also names its
  canonical My-Chat or Nurture owner.
- Added ten contract-source tests for closed keys, descriptor axes, content
  union parity, readiness/snapshot/cursor rules, Admin and multi-Institution
  negatives, primitive/ref resolution, private/runtime-shape exclusion and
  kebab-case source paths.
- The complete unit population is now 22 files / 197 tests, with the JSON CI
  reporter and population gate renewed. Phase 1 changes no runtime
  manifest/capability, schema/migration, database, environment, secret,
  deployment, activation or traffic.

### Handoff to Phase 2

Phase 2 must add the concrete descriptor registry and typed
query/prepare/execute/readResult, result/error/cursor artifacts before assigning
the first exact interface version/digest. Canonicalization, per-capability and
per-surface slice hashes, loader/admission and generated-manifest verification
must land together; no placeholder `generated/` artifact is permitted.

## 2026-07-31 — Phase 2 exact typed contract completed

- Added the closed T-005 V1 capability registry: three queries, six
  author/caregiver actions and one internal policy-redaction action. The
  not-yet-frozen G2-C caregiver-initiated and Admin protected-read capabilities
  remain absent rather than receiving guessed placeholder keys.
- Added capability-specific business input/result schemas plus shared typed
  query, prepare, execute, read-result, eligibility, receipt/event,
  pagination, safe-error, private confirmation-binding and private
  cursor-binding contracts.
- Generic invocation now carries the exact expected interface ref,
  trusted-context/scope refs, purpose, nonce, expiry and operation-specific
  target/idempotency/confirmation metadata. Capability business inputs contain
  only their own fields; acknowledge is empty and protected text is bounded.
- Added six stable presenter records and versioned policy/repository port
  bindings. Missing or mismatched ports and dependency gates fail closed; no
  synthetic owner or version fallback exists.
- Froze canonical JSON, registry sorting, source inventory, root digest,
  shared-core boundary and capability/surface slice boundaries. The generated
  baseline is `nurture.surface-contract@1.0.0` with digest
  `sha256:2edc462f3fd2c2c272355dc7a25d7738e4390bc596feda55280a4599ac1c3129`;
  its shared-core hash is
  `sha256:934db320e11ccdfb073cb1182b809e8076bd38d064bb8ed1b298ec20c7843cbd`.
- Added a strict loader, exact admission, dependency-readiness evaluation and
  exact versioned-port binding helpers under `src/surface-contract/`. Loaded
  manifests reject unknown/malformed structures, require canonical
  source-set/root digest parity
  and are recursively frozen.
- Added ESM `build:surface-contract` and `verify:surface-contract` commands.
  Verification rebuilds under `.ai/.tmp/`, compares exact bytes and removes
  the temporary directory. Generated output is accepted only at the canonical
  kebab-case artifact filename inside the repository, and an existing artifact
  cannot be replaced by changed semantics without a strictly increased
  interface version.
- Quality review repaired six issues before acceptance:
  1. two identical prepare failure branches made `oneOf` ambiguous;
  2. capability slice hashes initially included interface version, which
     would have invalidated every existing slice after an additive root
     version rotation;
  3. private invocation omitted purpose/nonce/expiry;
  4. confirmation/cursor server bindings and protected keyed-integrity rules
     were descriptive rather than typed;
  5. generator/loader strictness did not yet reject non-finite JSON,
     unsafe output names, nested unknown fields or source/digest drift.
  6. the canonical source-set digest was initially mislabeled
     `sourceRevision`, which conflicted with the rule that Git/source revision
     is non-semantic qualification provenance.
- Phase 2 changes no runtime scenario manifest, handler activation,
  schema/migration, database, owner repository, environment, secret,
  deployment or traffic. Synthetic fixtures/conformance remain Phase 3-4;
  Owner Integration remains NO-GO.

## 2026-07-31 — Phase 2 quality closure step 1

- Hardened dependency readiness so every supplied state is validated before
  comparison. Malformed SemVer, unknown gates, unknown fields and duplicate
  dependency keys now throw `invalid_surface_contract` instead of reaching the
  eligible path through JavaScript `NaN`/`undefined` comparison behavior.
- Added generated `surface-contract.artifact-pin.json`. The pin contains the
  exact interface ref plus a canonical manifest digest and must be obtained
  from a separately trusted release/source/configuration boundary.
- Changed manifest loading to require that trusted pin. A valid-looking
  semantic edit that retains the old self-declared interface ref now fails
  content-integrity validation.
- Aligned nested loader checks with generator rules for conditional head
  bindings, schema refs, handler/presenter keys, dependency records, roles,
  invalidation scopes and array uniqueness.
- Added negative tests for malformed/duplicate dependency evidence, semantic
  tampering and missing condition refs. Focused Phase 2 tests pass 19/19;
  full unit population is 216/216; scenario typecheck, tooling 5/5 and
  deterministic manifest/pin verification pass.
- No source contract, interface version/digest, capability activation,
  schema/migration, database, environment, secret, deployment or traffic
  changed in this step. Strict schema/CI closure remains the next step.

## 2026-07-31 — Phase 2 quality closure completed

- Added direct, lockfile-pinned Ajv 2020 and formats development dependencies
  plus `verify:surface-contract-schemas`. The command compiles all 31 normative
  schemas with `strict: true`, validates the generated manifest/artifact pin
  and proves two representative malformed artifacts reject.
- Repaired all three `SurfaceEnvelopeV1` conditional content branches by
  explicitly declaring their array type. The envelope now compiles under
  strict JSON Schema consumers instead of relying on type knowledge from a
  sibling subschema.
- Froze conditional head-binding requirements in the descriptor schema:
  `must_satisfy` requires only `predicateRef`,
  `convergent_postcondition` requires only `postconditionRef`, and equality/
  compatible-append modes forbid both.
- Added a normative artifact-pin schema, registered it and included it in the
  shared-core boundary.
- Added a permanent GitHub Actions step that runs tooling tests, strict schema
  validation and exact manifest/pin rebuild verification.
- Rotated the exact interface to `nurture.surface-contract@1.0.1` /
  `sha256:ee3f83626f6b948ae3e8791890c0c6fafcb2a2c7c4523500cee7c71cf3837f59`.
  The shared-core hash is
  `sha256:be3da7b93e812f3a648adbb251525ef0f75d0c09988377c9e1904633f98c6312`;
  the canonical manifest pin is
  `sha256:961c6b45806cd065daec271cf8981a05bedc3f0af0ec774d3099dbbaf217ca59`.
- All ten capability slice hashes and six surface slice hashes remain stable;
  only shared core rotated. The compatibility policy therefore invalidates all
  surface-contract evidence, but no Synthetic or Joint PASS exists yet, so
  there is no historical qualification record to migrate.
- The first strict compile exposed a nested `strictRequired` formulation in
  the new conditional-head schema. It was repaired with boolean property
  schemas rather than weakening Ajv strictness.
- No capability was activated and no My-Chat pin, owner path, schema/migration,
  database, environment, secret, deployment or traffic state changed.

### Handoff to Phase 3

Create the versioned PII-free synthetic world and independent GJ-1～GJ-5/RJ-1
initial states under `source/fixtures/`, plus capability selection cases.
Adding those normative artifacts must rotate the interface version/digest;
existing capability/surface evidence scope is compared by slice hash, while
the new root ref still requires exact consumer adoption.

## 2026-07-31 Phase 3 execution decomposition

- Phase 3 is decomposed into five verified units `P3-0…P3-4` in
  `07-phase-3-fixture-journey-decomposition.md`: world source freeze,
  per-journey initial states, journey scripts (one value loop plus one
  highest-risk refusal each), selection fixtures, then fixture-manifest
  canonicalization with exact rotation from `1.0.1` and a
  slice-invariance guard.
- Six boundary rules are frozen before implementation, including the
  journey/conformance-matrix split, per-journey state independence and
  a hard stop on shared-envelope edits (`changedSharedCore`).
- Phase 3 is My-Chat-independent; the parallel T-002 pin-advance input
  (`../nurture-institution-mode/15-mychat-drift-census-pin-advance-input.md`)
  gates M5/Joint Conformance sequencing only, not these increments.

## 2026-07-31 P3-0 synthetic world source freeze

- Added `contracts/surfaces/v1/source/fixtures/world/`:
  `synthetic-world.schema.json` (strict 2020-12, whitelisted `syn-` ids
  and `Syn …` labels, closed enums, pilot-profile `$defs`),
  `world-v1.json` (F1 two-guardian family, child C1 with one bound
  care process and two isolated enrollments at institutions Aster/Birch,
  F2/C2 as the cross-family isolation control, grant present for
  `c1-ia` and deliberately absent for `c1-ib` as the readiness-axis
  variants) and `profile-single-institution.json` (deterministic
  unique-enrollment write-target resolution for institution Aster).
- Rotated the interface identity `1.0.1 -> 1.1.0`
  (`sha256:8fb13498…`); the builder's rotation guard enforced the bump.
  Shared-core hash and all 16 existing capability/surface slice hashes
  are byte-identical to the 1.0.1 baseline, mechanically guarded by the
  new `tests/surface-contract/phase-3-world.test.ts` (frozen-hash
  table), so no Phase 2 evidence is invalidated by the additive slices.
- `validate-surface-contract-schemas.mjs` now validates both fixture
  documents against the world schema and rejects a realistic display
  label as the third negative. Peripheral pins updated: phase-2 version
  expectation, tooling-test rotation fixture, unit census 24 -> 25 in
  `assert-test-routing.mjs`, contract README.
- No schema/migration, database, capability, activation, owner-claim or
  traffic change; fixtures are synthetic and contract-local.
