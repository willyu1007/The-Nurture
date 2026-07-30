# Pitfalls — Store Beta Readiness

## Known Guardrails

- 不要把 G5-0 pre-candidate inventory/profile/checklist 当成正式 Candidate，也不要在
  上游 exact handoff 全部通过前分配 Candidate ref/digest。
- 不要把 G5-B/C 的部分并行误解为 platform validation 可绕过 observed Binding 或
  final consumer handoff；G5-D 同时依赖两者和独立 internal-test enablement。
- 不要让 Deployment Binding 自己授权 internal-test capability；它只记录 readback
  observed effective state，授权必须独立、限域、可撤销并在测试后恢复 final false/empty。
- 不要把 T-002 production/external traffic gate 当成 Candidate Freeze 前置；只要求
  beta profile 实际消费的 owner/source subset 精确实现、联合资格化并 pinned。
- 不要在 rollback 时复用旧 Deployment Binding、platform record、Composite 或 PASS；
  回滚状态必须形成新 Binding 并完整重验。
- 不要把 T-005 G2-A/Increment 1、task `done` 标签或占位 G2-C capability 当作
  Candidate Freeze input；必须验证 G2-A/B/C、legacy single-writer cutover 和 exact
  formal-ingress G2 Exit Qualification。
- 不要把 T-006 capture/draft、safe-unavailable direct action 或 task `done` 当作
  Candidate input；必须验证 G3-A～E、真实 G2-C consumer joint qualification 和
  T-007 publication-policy subset。
- 不要因为 AI copy、face match 或 Workflow board module 被标为 optional 就接受缺失
  deterministic/manual fallback；optional 必须由 beta profile 明确声明并有
  absent/default-off 负向证据。

- 不要把“CI 绿”或“设计已完成”当作 store-beta readiness。
- 不要把 Git tag/source revision 单独称为 Service Candidate；Candidate 必须同时固定
  可执行产物、schema/migrations、manifest、interface contracts、gate/config contract
  与 owner-contract pins。
- 不要用一个全局 SemVer 或 Candidate ID 取代 Git revision、migration-set digest、
  interface digest、owner pin、Deployment Binding 和 Composite Validation Binding；
  这些层必须独立版本化后再由 Candidate/validation 精确组合。
- 不要在 The Nurture 内创建独立 native shell 或复制 My-Chat runtime。
- 不要把 My-Chat/Nurture 的接口集成写成代码/Candidate bundle adoption，也不要使用 floating interface contract、未固定服务候选或可变 environment binding。
- 不要把 My-Chat build、测试环境、设备结果或 qualification outcome 塞入 Candidate
  identity；它们通过外部 evidence/binding 精确引用 Candidate。
- 不要在 Candidate identity 分配后原地替换 executable、migration、manifest、
  contract、gate/config 或 owner pin；任何此类变化都必须生成新 Candidate。
- 不要把 Candidate 已生成、已部署或本地 qualification 通过写成 capability 已激活、
  internal beta 已通过或真实流量已授权。
- 不要仅凭 T-004～T-007 的 `done` 状态或 CI 绿冻结 Candidate；必须核对实际 handoff
  artifacts、exact digests、qualification 与负向证据。
- 不要要求整个 T-002 或 production/external traffic 就绪后才 Freeze；只要求
  Candidate 实际依赖的 owner/source 子集实现、联合资格验证并精确 pin。
- 不要把缺失的六 surface 必需路径写成 default-off、限制项或 synthetic-only
  evidence 后继续 Freeze；只有 beta profile 明确排除的后续可选能力可以缺席。
- 不要给 pre-candidate inventory、readiness checklist 或 manifest 草案分配正式
  Candidate identity；正式 identity 只在全部 Freeze inputs 通过后生成。
- 不要把可变的 `test`/`staging` 环境名、desired deployment manifest 或部署命令成功
  当作 Deployment Binding；必须在部署后 readback 实际 executable、migration、
  qualification-relevant config、owner dependencies 和 gates。
- 不要把 secret 值、凭据、数据库内容、PII、My-Chat build、设备结果或流量授权写入
  Deployment Binding；只允许受控的 opaque/version refs 或不可逆证据。
- 不要在同一 Binding 下静默改变资格相关配置、migration、owner deployment 或
  enablement；同一 Candidate 的实际部署状态变化应生成新 Binding。
- 不要让 Deployment Binding 自己授权 capability enablement，也不要在回滚时重写旧
  Binding；enablement 需要独立 gate，回滚部署产生新的 observed Binding。
- 不要让 My-Chat 导入 Candidate bundle、Nurture source/ORM/repository/runtime，或把
  Message、CareItem、PublishProcess、InstitutionWorkflow 等 canonical facts 复制成
  Host-owned 事实。
- 不要使用 `latest`、SemVer range、major-only、环境名或 Candidate 名称替代 exact
  Interface Contract ref/digest；request/response contract mismatch 必须 fail closed。
- 不要把 My-Chat authenticated principal、Workspace、`child_id`/`family_id`、
  scenario binding、Host role 或 opaque ref 当作 Nurture authorization。
- 不要禁止 My-Chat 使用 exact public contract 生成 client/types；禁止的是 Candidate
  bundle/runtime adoption，以及 fixture/migration/evidence 成为运行时 dependency。
- 不要让 My-Chat 直接 patch presenter snapshot/cache，或把旧响应、缓存和 deep link
  当成继续读取/执行权限；写入与 open 都必须回到 versioned action/current owner-read。
- 不要用一个可变“beta passed”标记或两份未绑定的平台 PASS 代替
  `CompositeValidationBindingV1`；iOS/Android 必须引用同一 Candidate、interface、
  Deployment Binding、profile 和 suite。
- 不要用 simulator/emulator 替代 TestFlight Internal 与 Play Internal 的真实设备
  门禁，也不要用浮动的设备清单；覆盖范围必须来自 versioned device/OS profile。
- 不要混合不同 Candidate、contract、Deployment Binding、profile 或 suite 的平台
  evidence。任一共享输入变化都要求双端重测。
- 不要因为仅一个 My-Chat platform build 变化而强制重测未变化平台；在所有共享输入
  完全不变时可复用其 exact passing record，但必须生成新 Composite。
- 不要覆盖旧 platform/composite evidence，也不要把 store credential、签名密钥、
  auth token、真实 PII 或未清理设备日志/截图写入证据。
- 不要用自由文本“已知问题”签发 `PASS_WITH_LIMITATIONS`；每个限制必须结构化证明
  required journeys 和全部安全不变量仍通过，并绑定 safe fallback、owner 与 expiry。
- 不要把 required-path failure、授权/隐私/跨域泄漏、撤权、幂等/并发/replay、
  migration/data-integrity、合同或真机证据问题降级为 limitation；这些一律 NO-GO。
- 不要在测试失败后原地修改 beta profile 把 required 改成 optional；scope 变化需要
  新 profile、重新 qualification、双平台 records、Composite 和 Decision。
- 不要修改旧 `InternalBetaDecisionV1` 或把 PASS/带限制 PASS 当作 external beta、
  production、真实数据或 traffic authorization。
- 不要让 T-008 直接修补 T-004～T-007 领域、T-002/owner contract 或 My-Chat consumer；
  缺陷必须回到最小拥有层并按该层变化生成新 Candidate/Binding/build/evidence。
- 不要因任一缺陷无条件推翻全部上游证据，也不要保留引用失效下游的“当前 PASS”；
  按 defective layer 精确传播并通过 append-only invalidation 取消当前适用性。
- 不要删除、覆盖或改写失败/失效的历史 evidence；旧 PASS 可审计但不能继续解析为
  current readiness。
- 不要把关闭 internal-test gate 当成修复，也不要在 authorization/privacy/data-
  integrity/contract/secret ambiguity 下继续测试以“收集更多证据”。
- 不要仅因为旧 Candidate 曾通过就直接回滚；必须验证 current consumer contract、
  migration head、owner pins 和 gate compatibility，并生成新 Binding 与完整验证链。
- 不要把破坏性 DB down migration 当作默认 rollback。不能证明兼容时使用 forward fix、
  proven forward-compatible Candidate 或明确重建 disposable test environment。
- 不要把 D08-01～D08-07 的 Candidate/evidence tooling 提前塞进 T-004～T-007 的开发
  门禁；上游任务只需交付其本来就拥有的 exact contract/pin/fixture/gate/qualification。
- 不要把 `NurtureServiceCandidateV1`、`DeploymentBindingV1`、Platform/Composite/
  Decision 名称自动实现成新 runtime service、数据库或发布控制平台；优先使用 canonical
  manifest、digest、append-only evidence 和 CI/CLI 校验，确有需求再扩展。
- 不要让 T-008 pre-candidate inventory 打断当前 T-002 owner-source 修复或 T-004
  contract-parallel 工作，也不要让 unrelated production/traffic blocker 停掉可安全
  default-off 的合同、fixture、presenter 和 synthetic conformance 开发。
- 不要让 fixture、conformance suite 或 evidence index 成为 My-Chat/Nurture 的运行时
  dependency；运行时 consumer 只固定并调用发布接口合同。
- 不要把 TestFlight Internal / Play Internal 通过写成 external beta 或生产授权。
- 不要把 store credentials、签名材料、真实儿童 PII 放入任务证据。
- 不要在 contract defect 后继续沿用旧 evidence；修复后必须重新 freeze。
- 不要仅因为异步、跨 owner、需要重试或会被看板展示，就把动作或投递重新命名为
  Workflow；产品 Workflow 当前只指园区管理 `InstitutionWorkflow`。
- 不要让园区移动看板变成第二个 Workflow 操作入口；它只消费角色安全的
  `InstitutionWorkflowProjection`，主要操作仍在 Institution Web workbench。

## Resolved Pitfalls

当前尚未进入 candidate qualification。实际问题解决后按 symptom、root cause、attempts、fix、prevention 记录。
