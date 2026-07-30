# Plan — Store Beta Readiness

## Top-level Decisions

### D08-01 — Service Candidate Boundary and Identity

- The project MUST use layered exact version identities rather than one repo-wide
  release version: Git revision versions source, migration-set digest versions data
  shape, interface refs/digests version public contracts, owner pins version
  cross-repository dependencies, Candidate identity composes the deployable
  release/qualification unit, and later Deployment/Composite bindings version
  environment and cross-owner validation. Candidate identity MUST NOT replace or
  collapse those independently governed layers.
- `NurtureServiceCandidateV1` MUST be a Nurture-owned, immutable, independently
  deployable server release unit for the six-surface service interface. Independent
  deployment does not make it an independent user-facing product: My-Chat continues
  to own login, shell, navigation, notification, device delivery and store builds.
- Candidate identity MUST freeze the exact Nurture source revision and executable
  artifact digest, Prisma schema and migration-set digest, scenario manifest,
  capability gate matrix, configuration contract, exact API/capability/presenter
  contract refs and digests, conformance/fixture rule versions, and Base/My-Chat
  owner-contract pins.
- Candidate identity MUST NOT contain My-Chat source/runtime/client bundles, iOS or
  Android builds, environment secrets or live configuration values, store
  credentials/signing material, live databases/PII, device results or traffic
  authorization.
- Candidate identity answers “what is being tested” and MAY be minted before local
  qualification. Qualification results, deployment bindings, My-Chat build refs and
  device evidence MUST reference the Candidate through separately versioned evidence;
  they do not become Candidate identity inputs or runtime dependencies.
- Any change to the executable artifact, schema/migrations, manifest, interface
  contracts, gate matrix, configuration contract or pinned owner contracts MUST mint
  a new Candidate. Adding another result for the unchanged inputs MUST NOT change the
  Candidate identity. Changing only environment values MUST create a new Deployment
  Binding; changing only a My-Chat build MUST create a new Composite Validation
  Binding.
- A frozen or qualified Candidate MUST remain capability-default-off. Deployment,
  activation, internal testing and real traffic each require their own later gate;
  none is implied by Candidate creation or qualification.

### D08-02 — Candidate Freeze Readiness Gate

- T-004 through T-007 MUST each complete its task-level Exit Gate and provide exact,
  qualification-complete handoff artifacts before T-008 may freeze a Candidate.
  A `done` task state is necessary but not sufficient: T-008 MUST verify the actual
  contract refs/digests, fixtures, conformance records, negative-test evidence and
  declared limitations supplied by each package.
- T-005 Exit specifically requires Stage G2-A Core CareInteraction Loop, G2-B
  Lifecycle/Admin owner-read, G2-C dedicated caregiver direct-interaction and the
  single-writer legacy cutover to pass one Nurture-side G2 Exit Qualification.
  Increment 1/G2-A alone, a placeholder G2-C key, Fastify-only evidence or a `done`
  status without these artifacts MUST NOT satisfy Freeze Readiness.
- T-006 Exit specifically requires Stage G3-A Shared Board Foundation, G3-B1
  deterministic Capture-to-Draft, G3-C1 manual content/media safety, G3-D
  Publish/Release and G3-E real joint qualification. G3-E MUST bind the exact T-005
  G2-C provider and T-007 publication-policy owner subset through the formal ingress.
  A safe-unavailable direct-action placeholder or synthetic-only policy provider MUST
  NOT satisfy Freeze Readiness.
- G3-B2 AI copy, G3-C2 `ClassScopedFaceMatch` and the G3-A
  `InstitutionWorkflowProjection` module MAY be absent/default-off only when the
  versioned beta profile explicitly marks them optional and the deterministic/manual/
  absent-empty fallback is fully qualified. If marked required, their complete
  provider/privacy/consumer evidence is mandatory.
- The T-002 owner/source subset used by the Candidate MUST be implemented, jointly
  qualified and exactly pinned across Base, My-Chat and Nurture. This includes the
  relevant identity/binding, current-authority reread, Receipt, revoke, concurrency
  and privacy paths; a synthetic adapter or design-complete contract is not sufficient.
- T-002 as a whole MAY remain `in-progress`, and production, external-pilot and
  real-traffic gates MAY remain NO-GO. Candidate Freeze requires the exact owner/source
  dependencies used by the six-surface profile, not unrelated T-002 completion or
  traffic authorization.
- T-008 MUST freeze a versioned six-surface beta profile that distinguishes required
  journeys from explicitly excluded later scope. Any missing or upstream-blocked
  required path MUST prevent Freeze and MUST NOT be hidden by default-off,
  `PASS_WITH_LIMITATIONS` or synthetic-only evidence. An optional capability MAY be
  absent/default-off only when the profile explicitly excludes it.
- Before this gate passes, T-008 MAY prepare a pre-candidate inventory, dependency
  matrix, readiness checklist and manifest draft, but MUST NOT allocate a formal
  Candidate ref/digest. Once all inputs pass, Candidate identity is minted before
  T-008 candidate-level local qualification so every later result has one immutable
  test subject.
- Any input drift before Freeze resets readiness. Any Candidate-defining drift after
  Freeze follows D08-01 and requires a new Candidate; it cannot reopen and mutate the
  existing identity.

### D08-03 — Deployment Binding as Observed Runtime Identity

- `NurtureDeploymentBindingV1` MUST be an immutable, readback-verified statement of
  one exact Candidate's actual deployment state in one exact environment. A desired
  deployment manifest, mutable `test`/`staging` alias or operator assertion MUST NOT
  substitute for observed runtime evidence.
- A binding MUST identify the exact Candidate ref/digest, opaque environment ref and
  environment class, actual release/deployment identity and executable digest,
  observed database schema/migration head, configuration-contract version and
  canonical digest of qualification-relevant values, Base/My-Chat owner service
  contract/deployment refs, effective capability-gate/enablement profile, and
  deployment/readback/verification evidence.
- A binding MUST NOT contain secret values, credentials, internal signing material,
  live database contents, PII, My-Chat client builds, device results or traffic
  authorization. Secret inputs MAY contribute only approved secret-version refs or
  non-reversible evidence.
- Deployment readback MUST prove that the running executable, migration head,
  qualification-relevant configuration, owner dependencies and effective gates match
  the proposed binding. A mismatch MUST fail binding qualification rather than record
  the desired state as fact.
- One Candidate MAY have multiple deployment bindings. Re-deploying the same Candidate,
  changing its environment, migration head, owner-service deployment, effective gates
  or any qualification-relevant configuration MUST create a new immutable binding, not
  a new Candidate and not a mutation of the prior binding.
- The classification of qualification-relevant versus operational-only configuration
  MUST itself be versioned. Changes that can affect contract behavior, authorization,
  privacy, persistence or test outcomes require a new binding; explicitly excluded
  operational settings such as nonsemantic logging or replica-count changes MAY avoid
  rebinding.
- A binding records effective enablement but MUST NOT authorize it. Internal-test
  enablement requires a separate approved gate; Candidate defaults remain off and the
  binding only attests what was actually active.
- Rollback MUST deploy the selected prior Candidate and produce a new observed
  Deployment Binding. Historical bindings remain immutable and MUST NOT be repointed
  to the rollback state.

### D08-04 — Exact Interface Handoff and Consumer Ownership

- My-Chat companion MUST consume a deployed Candidate only through authenticated,
  versioned Nurture interfaces. It MUST NOT import the Candidate executable/source
  bundle, Nurture ORM/repositories/domain runtime, or copy Nurture canonical facts
  into Host-owned persistence.
- Every validated My-Chat build MUST pin the exact accepted Interface Contract
  ref/version/digest and call a compatible exact Deployment Binding. Floating
  `latest`, SemVer ranges, major-version-only admission, environment aliases and
  Candidate names without contract identity MUST NOT authorize consumption.
- My-Chat requests MUST declare the expected exact contract ref, and Nurture
  discovery/query/action responses MUST return the actual ref/digest. A mismatch or
  unsupported contract MUST fail closed with an actor-safe unavailable/upgrade result;
  it MUST NOT fall back to legacy, synthetic, unauthenticated or weakly typed paths.
- The handoff MUST include the exact Candidate, Interface Contract and Deployment
  Binding refs; authenticated trusted-context boundary; capability discovery and
  invocation rules; per-surface schemas; error/recovery/replay semantics; gate and
  exclusion matrix; compatibility matrix; synthetic fixtures/expected results;
  integration checklist; rollback guidance; and defect-routing boundary.
- My-Chat MAY generate or author consumer client/types from the exact published public
  contract as a build-time dependency. Candidate bundles, fixtures, migration/source
  artifacts and evidence indexes MUST NOT become Host runtime dependencies.
- My-Chat owns account authentication, session/Workspace principal, native/web shell,
  navigation/lens, responsive rendering, Handoff/Outbox/notification/deep-link/device
  delivery, protected local cache/offline behavior, iOS/Android builds, store
  distribution and device-side evidence.
- Nurture owns canonical domain facts, capability eligibility, policy and
  current-authority reread, business effects/Receipts, semantic presenters and
  actor-safe invalidation. My-Chat authentication proves who is calling and where;
  it MUST NOT be interpreted as Nurture authorization or replace per-request
  Participant/RoleAssignment/Enrollment/Grant/CareGroup/purpose/source-lifecycle
  checks.
- My-Chat owns component/layout/navigation implementation and MAY cache only
  display-safe contract projections under exact snapshot/cursor/invalidation rules.
  It MUST NOT patch a projection/cache as a canonical write, bypass a versioned
  Nurture action, or reuse a prior response/opaque ref as continuing authority.

### D08-05 — Dual-platform Composite Validation Binding

- My-Chat companion MUST produce a separate immutable
  `PlatformValidationRecordV1` for iOS/TestFlight Internal and Android/Google Play
  Internal. Each record MUST bind its exact app/build identity, declared Interface
  Contract pin, Candidate, Deployment Binding, versioned device/OS coverage profile,
  synthetic test-world/fixture ref, journey/conformance-suite version, execution time,
  results and sanitized evidence refs.
- Each required platform record MUST include installation and journey execution on
  real hardware through its internal-store channel. Simulator/emulator runs MAY
  supplement diagnosis but MUST NOT replace the real-device gate. Exact device counts
  and supported OS coverage belong to the versioned coverage profile rather than an
  unversioned checklist.
- `CompositeValidationBindingV1` MUST immutably reference one passing Nurture local
  qualification record, one passing iOS record and one passing Android record that
  all use the same Candidate ref/digest, Interface Contract ref/digest, Deployment
  Binding, six-surface beta profile and journey/conformance-suite version.
- Evidence from different Candidates, interfaces, Deployment Bindings, beta profiles
  or suite versions MUST NOT be combined. A mutable “beta passed” flag or two
  unbound platform pass statements MUST NOT substitute for the composite identity.
- Candidate, Interface Contract, Deployment Binding, beta-profile or suite-version
  change MUST invalidate both platform records for composite use and require both
  platforms to rerun. If only one My-Chat platform build changes while every shared
  input remains exact and unchanged, only that platform MUST rerun; the unchanged
  platform record MAY be reused, but T-008 MUST mint a new Composite Validation
  Binding for the new pair.
- A rerun with unchanged inputs MUST create a new immutable platform record and MUST
  NOT overwrite prior evidence. The composite selects exact records and preserves
  unsuccessful/incomplete history separately.
- My-Chat companion owns build production, internal-store installation, real-device
  execution and sanitized platform evidence. T-008 owns cross-record consistency
  checks and creation of the final composite binding.
- Platform and composite records MUST NOT contain store credentials, signing secrets,
  auth tokens, real child/family PII or unsanitized device logs/screenshots. A
  Composite Validation Binding proves only the exact internal-beta combination and
  MUST NOT authorize external beta, production or real traffic.

### D08-06 — Internal Beta Verdict and Limitation Fence

- T-008 MUST issue one immutable `InternalBetaDecisionV1` for one exact
  `CompositeValidationBindingV1`. The decision MUST record `PASS`,
  `PASS_WITH_LIMITATIONS` or `NO_GO`, decision time/responsibility, exact evidence
  index and any structured limitation records. Later fixes, reruns or build changes
  MUST create a new Composite and decision rather than mutate the old verdict.
- `PASS` requires every required journey and required negative/safety check in the
  versioned beta profile to pass on Nurture local qualification and both real-device
  platform records, with no required-path defect or unresolved binding/evidence drift.
  Scope explicitly excluded before validation is not a limitation.
- `PASS_WITH_LIMITATIONS` MAY complete T-008 only when every required journey and
  every authorization, privacy, data-integrity, lifecycle and health-safety invariant
  still passes. A limitation MAY affect only an optional capability, non-required
  experience or coverage outside the supported profile, and the affected path MUST
  remain fail-closed/default-off without an ambiguous or unsafe business outcome.
- Each accepted limitation MUST have a stable ID, affected surface/capability/platform,
  reason it is not a required-path failure, user-visible safe behavior, scope/default-
  off restriction, evidence refs, owner/follow-up and review/expiry condition.
- `NO_GO` is mandatory for any missing, failed or unexecuted required journey; identity,
  binding, authorization, Grant/CareGroup/owner-reread defect; cross-child/family/class/
  Institution leakage; revoke/redaction/withdrawal/source-lifecycle bypass; Receipt,
  idempotency, concurrency, replay or outcome-unknown safety failure; migration/data
  corruption or unexplained loss; contract mismatch/fallback; synthetic-only required
  path; missing internal-store real-device evidence; required-path blocking crash;
  health-boundary violation; or unverifiable Candidate/Deployment/evidence identity.
- A failed required item MUST NOT be reclassified as optional within the same
  validation cycle. Any approved beta-profile scope change requires a new profile
  version, renewed qualification/platform records, a new Composite and a new decision.
- `PASS` or a conforming `PASS_WITH_LIMITATIONS` MAY satisfy the T-008 completion gate.
  `NO_GO` MUST keep T-008 incomplete while retaining the immutable Candidate, binding,
  platform, composite and decision history for routing and remediation.
- No verdict in this task authorizes external beta, production, real-child data or
  traffic. Those remain separately scoped later decisions.

### D08-07 — Defect Ownership, Evidence Invalidation and Qualified Rollback

- Every discovered defect MUST be assigned to the smallest owning version layer and
  recorded with the exact affected refs, containment, remediation owner and required
  revalidation scope. T-008 coordinates disposition but MUST NOT absorb or patch
  T-002/T-004～T-007 domain ownership or My-Chat companion ownership.
- A Nurture source/domain/interface/schema or pinned owner-contract defect MUST be
  fixed in its owning task/feature line and mint a new Candidate. A deployment/config/
  infrastructure defect MAY keep the Candidate but MUST create a new Deployment
  Binding. A My-Chat consumer defect MUST create the affected new platform build and
  platform record. Evidence-only loss/corruption MUST recreate only the affected
  evidence layer when all versioned inputs remain exact.
- No Candidate, Deployment Binding, PlatformValidationRecord, CompositeValidationBinding
  or InternalBetaDecision MAY be patched, repointed or overwritten in place. If an
  original task is archived, project governance decides reuse/reopen versus a new
  corrective task, while semantic ownership remains with the originating package.
- Invalidation MUST propagate only from the defective layer downward: Candidate defect
  invalidates its downstream deployment/platform/composite/decision applicability;
  Deployment Binding defect leaves Candidate identity intact but invalidates dependent
  platform/composite/decision use; one platform defect leaves Candidate, binding and
  the unaffected platform record intact but invalidates composites/decisions that cite
  the defective record.
- Historical evidence MUST be retained. Applicability is removed through an immutable,
  append-only invalidation/supersession record containing discovery time, reason,
  affected refs, containment, owning layer, fix route and required reruns. A historical
  PASS remains auditable but MUST NOT resolve as the current valid readiness decision.
- Authorization/privacy leakage, revoke/redaction bypass, migration/data-integrity
  ambiguity, contract fallback, uncertain write scope, or secret/PII evidence leakage
  MUST immediately disable the relevant internal-test enablement while ownership and
  outcome are resolved. Containment is not a repair or rollback authorization.
- Rollback MAY deploy a prior Candidate only after proving its exact Interface Contract
  remains supported by current My-Chat consumers, its schema behavior is compatible
  with the current migration head, its owner pins remain compatible, and gates can
  safely return to default-off. Destructive or unqualified database down migration is
  not a default rollback mechanism; use a proven forward-compatible Candidate, forward
  fix, or explicit rebuild of a disposable test environment.
- Every rollback deployment MUST produce a new readback-verified Deployment Binding and
  rerun binding/local qualification, both platform records, Composite and Internal Beta
  Decision. Prior passing evidence MUST NOT be applied to the new environment state.

## Delivery Sequencing Guard

- D08-01 through D08-07 define T-008 release qualification and evidence composition.
  They MUST NOT become implementation prerequisites for starting T-004～T-007 beyond
  those tasks' already-owned exact contracts, pins, fixtures, default-off gates and
  qualification handoffs.
- G1 is progressive rather than serial. At G1 start, T-008 MAY maintain only the beta
  profile draft, dependency matrix and readiness checklist. Contract Boundary and
  Owner Integration Readiness MAY be recorded independently. No G1 state before Joint
  Conformance may satisfy a protected Candidate input, and no formal Candidate identity
  is allocated from synthetic-only or owner-only evidence.
- The G1 pre-Candidate input has exactly three roles: T-004 `Surface Contract Artifact
  Set`, T-002 `Owner Integration Handoff`, and one `G1 Joint Conformance Record` that
  references both exact inputs and records suite/fixtures/revisions/results/negative
  matrix/final false-empty census. T-008 MUST consume these roles directly rather than
  inventing a duplicate G1 manifest, service, database or control plane.
- The Joint record is acceptable only when the same T-004 fixtures ran through the
  formal NestJS Nurture ingress against the exact pinned owner path. Fastify-only
  dev-host evidence remains provisional and cannot satisfy D08-02 Freeze Readiness.
- Public-contract drift invalidates synthetic and joint evidence; owner pin/source/
  ingress drift invalidates owner and joint evidence; affected fixture/suite drift
  invalidates the corresponding synthetic/joint evidence; auth/privacy/security risk
  invalidates immediately. Historical results remain append-only.
- T-004 owns the shared interface identity/digest baseline. T-005～T-007 MAY proceed
  dependency-aware and in parallel once the required T-004 contracts and relevant
  T-002 source-owner paths are available; they MUST NOT wait for Candidate,
  DeploymentBinding, PlatformValidation, Composite or Decision tooling.
- T-006 `direct_interaction_required` consumes T-005 Stage G2-C. The two tasks MAY
  develop other domain/presenter/synthetic work in parallel, but a required beta-profile
  direct-interaction path cannot be frozen while G2-C is absent, unqualified or outside
  the exact T-004 interface digest.
- T-005 G2-C provider qualification and T-006 G3-E consumer joint qualification are
  separate handoffs on the same exact contract identity; neither task waits for the
  other's full completion in a cycle.
- T-006 scheduled publication consumes the exact T-007 publication-policy subset
  without waiting for full T-007 completion. T-008 MUST verify the provider/consumer
  evidence and persisted schedule-head semantics actually used by the Candidate.
- The `*V1` artifact names in this plan describe versioned evidence roles, not a
  requirement to build a new runtime service, database or release-control platform.
  T-008 SHOULD begin with canonical manifests, digests, append-only evidence files and
  CI/CLI verification, and expand infrastructure only when demonstrated scale or
  integrity needs require it.
- Pre-candidate inventory MAY be drafted while upstream work approaches qualification,
  but full Candidate/binding/composite tooling is implemented just in time in T-008
  after D08-02 inputs are stable. It MUST NOT interrupt the current T-002 repair or
  contract-parallel T-004 work.
- T-002 production/external traffic gates remain separate. Only an unavailable
  source-owner dependency blocks the protected T-004～T-007 path that consumes it;
  unrelated contract, fixture, presenter and synthetic conformance work MAY continue
  with explicit NO-GO/default-off evidence.

## Stage G5 Delivery Structure and Implementation Order — Accepted

### Overall goal

G5 将上游精确 handoff 冻结为一个不可变、independently deployable 但
capability-default-off 的 Nurture Service Candidate，再用 observed deployment、
Nurture local qualification 和 My-Chat 双平台 internal-store real-device evidence
形成一个精确 Composite 与 Internal Beta Decision。Candidate 是服务发布/资格化单元，
不是独立用户产品、全局版本号、My-Chat build 或 traffic authority。

### Delivery packages

| Package | Required delivery | Existing phase mapping |
| --- | --- | --- |
| G5-0 Readiness Inventory & Beta Profile | 验证 T-004～T-007 handoffs、T-002 exact owner/source subset、required/optional profile、known limitations 与 drift；Freeze 前不 mint Candidate | Phase 0 |
| G5-A Service Candidate Freeze | 固定 source/executable、schema/migrations、manifest、gate/config contract、interface/fixture refs 与 owner pins，生成 immutable Candidate | Phase 1 |
| G5-B Deployment Binding & Local Qualification | 部署 exact Candidate、post-deploy readback、生成 immutable Binding，并完成六 surface local black-box/negative qualification | Phase 2 |
| G5-C Interface Handoff & Consumer Readiness | exact interface/Binding refs、compatibility matrix、trusted context、per-surface checklist、fixtures、recovery/rollback 和 companion handoff | Phase 3 |
| G5-D Dual-platform Internal Validation | My-Chat companion 分别形成 TestFlight Internal iOS 与 Play Internal Android real-device Platform Validation Records | Phase 4 |
| G5-E Composite Decision & Evidence Lifecycle | 生成 exact Composite、Internal Beta Decision，执行 limitation fence、defect routing、append-only invalidation 与 qualified rollback | Phase 5 + Exit Gate |

### Dependency and parallel rules

1. G5-0 pre-candidate inventory/profile/checklist 可在上游接近 qualification 时维护，
   但 T-004～T-007 exact handoff 和 beta profile required inputs 全部通过前不得
   mint Candidate。
   G5-0 SHOULD also maintain a read-only Pilot carry-forward census classifying every
   known G6 input as `g5_shared | complete_pilot_only | evidence_only | unknown`。
   The census is planning evidence only：it neither opens G6 nor authorizes cloud/
   deployment state. Known `g5_shared` work SHOULD be completed before G5-A where
   practical to avoid an unnecessary successor Candidate and dual-platform rerun.
2. G5-A 是严格串行门；A 之后的所有 evidence 必须引用同一 immutable Candidate。
3. G5-B 与 G5-C 可部分并行。C 可先生成 exact-contract consumer material，但 final
   handoff 必须引用 B 的 readback-verified Deployment Binding。
4. Internal-test capability enablement 是 Candidate/Binding 之外的独立、限域、可撤销
   gate。Binding 只记录 observed effective state，不授权 enablement；测试结束必须
   回到 final false/empty。
5. G5-D 只有在 B local qualification、C handoff 和 exact internal-test enablement
   就绪后开始；iOS/Android 使用同一 Candidate/interface/Binding/profile/suite 并行。
6. G5-E 只组合 exact matching local/iOS/Android evidence。共享输入漂移要求双端
   重跑；单平台 build-only drift 在共享输入完全不变时只重跑该端，但生成新 Composite。
7. Defect 回到最小 owner：source/domain/interface 变化生成新 Candidate；deployment/
   qualification config 变化生成新 Binding；consumer build 变化生成新 platform
   record；evidence-only defect 只重建受影响 evidence。历史 append-only 保留。
8. Rollback 不是复用旧 PASS：先验证 current interface/migration/owner compatibility，
   部署旧 Candidate 后生成新 Binding，并完整重跑 local、iOS、Android、Composite
   与 Decision；destructive DB down migration 默认禁止。

### Beta Profile v0 Early Freeze — Accepted (2026-07-31)

- beta profile 所有权保持在 T-008，但其首个版本化草案（Beta Profile v0）提前到
  G1 Joint Conformance 前后、G2 实施开始之前冻结，不等待 G5-0。
- v0 内容固定为两部分：已知 optional 能力的逐项 required / optional-absent 判定
  （至少覆盖 G3-B2 AI copy、G3-C2 `ClassScopedFaceMatch`、G3-A Workflow board
  module），以及六 surface 各自的最小 required capability 集合；后者直接推导出
  T-002 必须在 Freeze 前 implemented / jointly qualified / pinned 的 owner/source
  subset 清单。
- v0 是 versioned planning input，不是资格化证据，不改变任何门禁语义。修订按
  drift 对待：optional→required 翻转必须触发受影响 stage 的显式影响分析，禁止
  静默扩 scope。G5-0 的职责相应从"定义 profile"变为"确认并终版化 profile"。
- required 面的具体裁剪（例如 G4-D Enrollment Journey、G4-E Knowledge/RAG 是否
  进入首个 internal beta）在 v0 起草时逐项决定，当前未定；"缺失 required 路径
  阻塞 Freeze 而非降级为占位"的规则不变。

### Critical path

```text
T-004～T-007 exact handoffs + T-002 required owner/source subset
  -> G5-0 Readiness PASS
  -> G5-A Candidate Freeze
  -> G5-B Deployment Binding + Local Qualification
  -> G5-D iOS/Android parallel real-device validation
  -> G5-E Composite + Internal Beta Decision
```

G5-C 必须在 G5-D 前完成，但其编制与 G5-B 可部分并行。T-008 tooling 采用
just-in-time、minimal manifest/digest/append-only evidence/CI-CLI 路径，不成为
T-004～T-007 实施前置，也不建立无必要的新 service/database/control plane。

### G5 Exit

G5-0/A/B/C/D/E 均为 required。T-008 只有在同一 Candidate/interface/Deployment
Binding/profile/suite 的 Nurture local qualification、iOS internal real-device record
和 Android internal real-device record 形成 `CompositeValidationBindingV1`，并签发
`PASS` 或符合 D08-06 的 `PASS_WITH_LIMITATIONS` 时完成。Required/safety gap 一律
`NO_GO`；任何结论均不授权 external beta、production、real data 或 traffic。

## Phase 0 — Readiness Inventory

- 按 D08-02 汇总并验证 T-004 至 T-007 的 Exit Gate、contract versions、fixtures、
  qualification evidence 和已知限制。
- 建立 Pilot carry-forward census，分别登记 Nurture Service Candidate/
  interface/G5 Binding/profile/suite shared inputs、complete-Pilot-only Host/topology/
  operations inputs、evidence-only inputs 和 unknowns。`unknown` MUST block the
  carry-forward classification but does not by itself expand the G5 beta profile.
- 只有 G5 shared-input drift 才触发 successor Candidate 或相应 G5 evidence
  revalidation；纯 complete-Pilot Host/topology/operations drift 留在 G6 lifecycle。
- 对 T-005 单独验证 G2-A/B/C、legacy single-writer cutover、formal-ingress G2 Exit
  Qualification 和 Beta Profile Handoff；不接受 Increment 1 或 task status 代替。
- 对 T-006 单独验证 G3-A～E、G2-C consumer joint qualification、T-007
  publication-policy provider/consumer binding、deterministic/manual required lanes
  与 optional enhancement profile declarations。
- 对齐 Candidate 实际依赖的 T-002 owner/source qualification 与 exact pins，同时把
  production/external traffic NO-GO 保持为独立门禁。
- 建立 pre-candidate inventory、六 surface beta profile 和漂移检查；门禁通过前不
  分配正式 Candidate identity。

## Phase 1 — Candidate Freeze

- 证明 D08-02 的每个 required input 已通过且不存在未声明的必需路径缺口。
- 按 D08-01 固定 Nurture executable、schema/migrations、Base/My-Chat owner contract
  pins、manifest、gate/config contract 和 API/capability/presenter/fixture versions。
- 基于 T-004 interface contract identity 生成 Nurture-owned 不可变 Service
  Candidate identifier 与 digest，并建立引用该 Candidate、但不参与其 identity 的
  versioned evidence index。
- 确认 capability gates default-off。

## Phase 2 — Local Qualification

- 运行 lint/type/unit/integration/DB/context checks。
- 对 D08-03 readback 验证后的 exact Deployment Binding 运行 public-contract
  conformance 与六 surface 黑盒旅程。
- 运行 authorization、privacy、idempotency、concurrency、revoke 和 replay 负例。

## Phase 3 — Interface Handoff

- 按 D08-04 产出 exact My-Chat consumer compatibility matrix、trusted-context boundary
  与 request/response contract-pin 示例。
- 产出逐 surface integration checklist、synthetic fixture、expected result、actor-safe
  failure/recovery 和 rollback。
- 回滚说明必须满足 D08-07：精确 previous Candidate/contract/schema/owner compatibility、
  default-off containment、新 Deployment Binding 和完整 revalidation。
- 明确 companion 只通过认证接口和 exact contract version/digest 调用已部署的
  Nurture Service Candidate；只允许由公共合同生成的 consumer client/types，不导入
  Candidate bundle 或 Nurture runtime。
- 定义 composite validation binding 所需的 Candidate、contract、
  `NurtureDeploymentBindingV1`、My-Chat build 和 device-evidence refs。

## Phase 4 — Companion Coordination

- 将 interface handoff 与 D08-03 验证后的 immutable Deployment Binding 交给
  `my-chat-nurture-store-beta-validation`。
- 要求 companion build 声明 D08-04 exact interface pin，并验证 contract mismatch、
  owner unavailable、revoke 和 stale cache 均 fail closed。
- 接收并验证 D08-05 iOS/Android `PlatformValidationRecordV1`，包括 internal-store
  installation、real-device coverage、build/interface pin 和 sanitized journey evidence。
- 按 D08-07 路由 My-Chat 发现的 defect：Nurture/owner-contract defect 回到拥有任务
  并生成新 Candidate，deployment defect 生成新 Binding，consumer defect 只重建受影响
  build/record；append-only invalidation 保留旧证据。

## Phase 5 — Internal Beta Decision

- 只从同一 Candidate/interface/Deployment Binding/profile/suite 的 Nurture local
  qualification、iOS record 和 Android record 生成 immutable
  `CompositeValidationBindingV1`。
- 按 D08-06 生成 immutable `InternalBetaDecisionV1`；对每个 limitation 验证
  required-path/safety fence、safe fallback、owner 和 expiry。
- 只有 PASS 或符合 D08-06 的 `PASS_WITH_LIMITATIONS` 才允许 T-008 completion；
  required-path/safety defect 一律 NO-GO。
- 保持 external beta / production 为独立后续 gate。

## Exit Gate

只有 Nurture 本地 qualification 与 My-Chat 双平台内部真机结果形成 exact
`CompositeValidationBindingV1`，并基于它签发 D08-06 `PASS` 或符合严格限制门槛的
`PASS_WITH_LIMITATIONS` `InternalBetaDecisionV1` 时，T-008 才可完成。该完成不授权
external beta、production 或真实流量。
