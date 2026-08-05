# Plan — Institution Ecology

> 分阶段推进（IA → III）。Pilot-0-C 是 `DECISION COMPLETE / IMPLEMENTATION OPEN / EXTERNAL TRAFFIC NO-GO`；Pilot-0-D 是 `PILOT0_D_DESIGN_LOCKED / C3_C4_D_IMPLEMENTATION_PENDING / EXTERNAL_TRAFFIC_NO_GO`。设计缺陷使用 `DR-P0/DR-P1/DR-P2`，流量阻断使用 `TR-P0/TR-P1`，候选资格化问题使用 `QR-P0/QR-P1`。D-0..D-7 已闭环且不授权 C-3/C4/D 实施、候选组装、Pilot-0-E 或 Pilot-1。当前索引见 `10-pilot0-c-current-decision-index.md` 与 `11-pilot0-d-topology-operations-contract.md`。

---

## 2026-07-30 — Controlled-parallel development and current P7 handoff

The six-surface program MUST run two bounded workstreams in parallel:

1. T-002 completes only the exact owner/source subset consumed by the six surfaces:
   trusted caller/Workspace context, private Child/Family binding evidence,
   transaction-local current-authority reread and Receipt persistence,
   revoke/concurrency/privacy behavior, exact replay and cross-repository pins.
2. T-004 completes the public capability/surface contract, fixtures, deterministic
   synthetic conformance and interface identity without implementing or faking the
   owner runtime.

Wave 4 P7 was the initial Nurture-side input to the controlled-parallel decision. Nurture commit
`e9868c5` and merge `993e0c9` expose the default-disabled private binding-owner
endpoint and pin My-Chat `f00b868`. The endpoint rereads and locks the exact
Guardian-role authority source in the Receipt transaction and passes the real
My-Chat resolver journey. P7 is classified as a bounded prerequisite owner-source
repair; it MUST NOT be used to claim broad C30 functional implementation,
Candidate readiness, activation or traffic authority while C30-I0-C/D remain open.

The 2026-07-31 M3 closure moves that unchanged P7 wire/application contract into
the formal NestJS scenario service, renews the exact-consumer and disposable
PostgreSQL evidence, and preserves the Fastify route only as a temporary M5
transition seam. This completes the implementation portion of formal ingress;
the quality audit additionally proves one reservation/Receipt transaction,
non-UTC effective-window behavior and clean emitted runtime outputs. M4
governance alignment and M5 handoff regeneration remain before any Owner
Integration Readiness claim.

G1 starts as soon as both tracks are owned. At G1 start, T-005～T-007 MAY proceed
with product-state design, pure domain/policy logic, presenter design and clearly
isolated synthetic fixtures. Work that would freeze a public contract, wire a real
owner adapter or claim a protected journey remains gated as follows:

| Gate | Exit |
| --- | --- |
| Contract Boundary | T-004 freezes actor-safe public schemas, dependency failure, opaque refs, version/digest and default-off behavior. The Contract Boundary gate opens downstream implementation against the exact public contract; synthetic qualification MAY pass here. |
| Owner Integration Readiness | T-002 supplies the exact endpoint/source pins plus transaction, replay, revoke, concurrency and privacy evidence. Owner Integration Readiness opens isolated real-adapter integration, but endpoint CI alone does not satisfy surface conformance. |
| Joint Conformance | The same T-004 fixtures execute against the real pinned T-002 owner path. Only this gate opens protected qualification and Beta-profile handoff for the corresponding T-005～T-007 path. |

T-003 remains non-blocking design input. T-002 Pilot-0-D/E/Pilot-1, external
traffic and topology/operations work remain a separate release track. No database
apply, environment mutation, capability activation, artifact publication, secret
configuration or traffic is authorized by this planning decision.

### G1 owner/source obligations — Accepted

T-002 对 G1 的责任只覆盖六 surface 实际消费的 owner/source path，不要求先完成
整个 T-002。交付 `Owner Integration Handoff` 前必须满足：

1. **Four-layer owner chain**
   - My-Chat 提供 authenticated Workspace/User/Actor principal，并独占 canonical
     Child/Family、stewardship/membership 和 scenario binding。
   - Parent/steward 或其明确授权成人之外的 actor 不得创建、推断或通过 PII 匹配
     platform Child。无 authority 时 Nurture 只能保留 provisional local record。
   - Nurture Child/Family anchors 使用独立 namespace，body-free、PII-free、
     authority-free；仅存在于 owner ref、Nurture persistence 和短生命周期 private
     envelope。不得进入 client、Chat、Notification、Handoff、logs、search 或 evidence。
   - lifecycle 为 `reserved | bound_empty | associated | retired`；
     `revoked | quarantined | ambiguous` fail closed。association 必须是 exact
     workspace-local Child→local child/process 或 Family+Child→child-scoped
     family/process。
   - principal、binding、anchor、association 都只是 routing/policy input；protected
     access 始终依赖 Nurture current business authority。

2. **Transactional authority and replay**
   - private invocation 独立验证 service workload 与 exact Workspace/User/Actor、
     purpose、expiry、nonce、idempotency 和 canonical request hash；service token
     不代表成人。
   - binding-owner issuance 固定为：verify invocation → Nurture transaction →
     lock typed anchor → transaction-scoped reread + lock/CAS exact authority source →
     validate association/role/purpose/version → insert or exact replay Receipt → commit。
   - 后续 business effect、`CommandExecution` 和 business `Receipt` 必须同一 Nurture
     transaction；所有 mutable prerequisite 均 lock/CAS。不得依赖 transaction 外
     pre-read，不得在 Nurture transaction 内调用远端 My-Chat。
   - same key/same hash exact replay；same key/different hash conflict；业务
     uniqueness/CAS loser 重读 winner。revoke-before-lock deny；已 admission 的
     in-flight attempt 最多 commit once；response loss 只恢复原 Execution。
   - private short-lived binding-owner Receipt 与 business
     `CommandExecution`/`Receipt` 不得合并。

3. **Formal target-service ingress**
   - 当前 P7 Fastify dev-host 可以生成 provisional owner-readiness evidence，但不能
     完成 G1 Joint Conformance。
   - G1 最终路径必须迁入 production-intended NestJS scenario service，并对齐
     `PORT=8000`、backend `3001`、Base-assigned `3200/3201`、formal route/API
     index、service-auth middleware、body size/timeout/error boundary、env contract
     和 default-disabled startup。
   - clean install/build/start/health/contract test 必须通过；缺少 secret 时安全拒绝，
     不允许 legacy/weak-auth fallback。

4. **Owner Integration Readiness evidence**
   - 固定 exact Base/My-Chat/Nurture revisions、bounded source hashes、private route、
     envelope/interface versions 和环境契约。
   - 在 disposable PostgreSQL 上证明 `reserved`、`bound_empty`、`associated`、
     `retired`、revoke/quarantine/ambiguity、wrong actor/workspace/purpose、并发 revoke、
     exact replay 和 response-loss。
   - 完成 privacy/leakage scan；最终环境/能力 gate 为 false、active rows 为空、
     无 PII、secret、persistent DB apply 或 external effect。

T-002 交付的 `Owner Integration Handoff` 与 T-004 `Surface Contract Artifact Set`
共同进入 `G1 Joint Conformance Record`。owner pin、source population 或 formal
ingress 漂移使 Owner Integration Readiness 与 Joint Conformance 失效；auth/privacy/
security 风险立即失效并保持 default-off。该 handoff 不是 Candidate、activation、
deployment 或 traffic authority。

## 2026-07-30/31 — Stage G6 delivery, scope and acceptance accepted

### G6 overall goal

G6 将 G5 internal-beta handoff 推进到一个 **可被 Pilot-0-E 审查、经单独批准后
可在 Pilot-1 部署、但始终默认关闭** 的完整 Pilot release state。它不把 internal
beta PASS 外推成部署或流量授权，也不把 Nurture Service Candidate、complete
Pilot candidate、E decision、deployment binding 和 stage authorization 合并成
一个版本或状态。

### G6 accepted scope boundary

G6 Scope In：

- exact G5 Service Candidate、Internal Beta Decision、interface、test-environment
  Binding、profile、suite 和 limitation handoff；
- 当前 C-3/C-4 的 Pilot-level implementation/qualification closure，包括
  2026-07-29 CareGroup shared-responsibility/multi-reply override；
- Pilot-0-D 锁定的 release、topology、dual-gate、telemetry、restore、KMS、
  incident、evidence-controller 和 traffic-census implementation；
- immutable complete Pilot candidate、detached signature、disposable D evidence、
  exact `pilot0_traffic_readiness_census_v1` 和 Pilot-0-E；
- 经独立授权后的 Pilot-1 private ACR publication、isolated persistent deployment、
  real secret/KMS binding、readback 和 default-off qualification；
- dual-owner isolated restore、hard-stop/dual-gate evidence、final false/empty census
  和 `pilot2_rehearsal_readiness_seal_v1`。

G6 Scope Out：

- Pilot-2 activation row、Pilot-3 rehearsal 或 Pilot-4 observation；
- real family/child data、external product traffic、native Pilot distribution、
  external push/SMS/email/provider、staging、production、GA 或 cohort expansion；
- 在 T-002/G6 内复制 T-004～T-007 已拥有的 product route、DTO、business fact、
  presenter 或 surface implementation；
- destructive down migration、cross-owner database/credential sharing、direct DB
  repair，或把 Candidate/E/Binding/stage state 折叠成一个 global version；
- 仅为通过 release gate 而增加本轮 beta profile 未要求的新产品 feature。

### G6-0 — Candidate & Evidence Reconciliation

- 冻结 exact G5 Candidate/interface/Deployment Binding/beta profile/suite/
  InternalBetaDecision refs，并登记适用于 Pilot responsive-Web profile 的
  limitations/exclusions。
- 对照 C-3 component、C-4 composite、D complete-candidate recipe 与所有 source/
  schema/migration/manifest/config/owner-pin inputs，输出 exact component mapping。
- G5 Candidate 只有在所有 Candidate-defining inputs 未改变时，才能作为 complete
  Pilot candidate 的 Nurture component。任何 executable、schema/migration、
  manifest、interface、gate/config contract 或 owner pin 变化都走 successor
  Candidate + affected G5 revalidation 分支；不得原地修改或仅“补证据”。
- G6-0 MUST classify every delta as
  `reuse_exact_g5_candidate | successor_service_candidate_required |
  complete_pilot_only_change | no_go`。
- G5 `PASS_WITH_LIMITATIONS` 只有在 limitation 明确 optional、fail-closed、位于
  G6 responsive-Web profile 外，且不触及 authority/privacy/migration/recovery/
  required journey 时才可承接。
- `NurtureDeploymentBindingV1` 只证明 G5 internal-test environment；它不是
  Pilot-1 `pilot_deployment_binding_v1`，不得复用或改名。
- 正式 G6-0 PASS 等待 exact G5 decision；late G5 MAY 维护 read-only Pilot
  carry-forward census 以提前发现 drift，但该 census 不是 G6 entry evidence。
- G6-0 PASS 只开放 G6-A 的精确实现输入，不授权 D evidence、E、Pilot-1 或云状态。

### G6-A — C3/C4/D Implementation Closure

G6-A does not reopen product ownership. T-004～T-007 supply their exact qualified
handoffs；G6-A closes only remaining T-002/My-Chat owner/admission/qualification and
Pilot release/operations gaps.

1. **G6-A1 C-3 closure and qualification**
   - consume T-004～T-006 Guardian/Caregiver handoffs；
   - complete exact identity/binding/admission/current-owner reread and qualification
     controllers without reviving historical exact-claimant evidence；
   - run strict C30～C35 and produce current `C3_QUALIFIED_DEFAULT_OFF`。
2. **G6-A2 C-4 closure and qualification**
   - consume T-007 Institution handoff rather than rebuilding its surfaces；
   - run strict C40～C45 against the current C-3 component；
   - produce current `C4_QUALIFIED_DEFAULT_OFF`。Any C-3 candidate/qualification drift
     invalidates the dependent C-4 result.
3. **G6-A3 D implementation preparation**
   - implement D source/recipe, immutable OCI/SBOM/provenance, migration/config/
     topology/secret-class/operations inputs, dual gates, telemetry, restore,
     rotation/kill-switch, traffic census and evidence controllers；
   - source/IaC/runbook/observability/disposable-environment preparation MAY overlap
     late A1/A2 after exact-input freeze；
   - persistent Pilot resources、real secret/KMS binding 和 ACR publication remain
     forbidden.
4. **G6-A4 complete-candidate assembly**
   - wait for current C-3/C-4 qualification and every candidate-defining D input；
   - assemble/sign one immutable body/secret-free complete candidate；
   - if a G5 shared input changed, first mint a successor Service Candidate and rerun
     the affected G5 local/platform/composite decision；complete-Pilot-only Host/
     topology/operations drift does not by itself rerun G5.
5. **G6-A5 disposable D evidence and readiness census**
   - use only the authorized disposable D environment/profile；
   - seal deployability, recovery, dual-gate, observability and terminal teardown
     evidence with `externalProductTrafficCount=0`；
   - require `QR-P0=0 / QR-P1=0` and the exact E-ready traffic census；
   - finish with no persistent Pilot environment, capability false and rows `[]`。

### G6-B — Pilot-0-E Go/No-Go

- 严格消费 current C-3/C-4 qualification、one immutable complete candidate、
  current D pre-deployment evidence seal、`QR-P0=0 / QR-P1=0`、known-limitations
  digest 和 exact `pilot0_traffic_readiness_census_v1`。
- `TR-P0-1..6` 和 `TR-P1-1|2|3b` MUST be `closed`；only
  `TR-P1-3a-native-external-delivery` MAY be `accepted_scope_exclusion`。Missing、
  unknown、waived、duplicate 或 differently named rows are NO-GO.
- 只产生 exact signed `go|no_go`。`no_go` 返回最小 owning layer 修复。
- Evidence-only defect MAY rebuild only the affected seal when all candidate/current
  inputs remain exact；D/Host candidate drift mints a new complete candidate；G5
  shared-input drift additionally follows the successor Service Candidate branch。
- E 不发布 artifact、不配置 cloud/secret、不迁移 persistent DB、不创建 Workspace/
  activation row，也不自行授权 Pilot-1。

### G6-C — Pilot-1 Private Publication & Default-off Deployment

- 只有 `E=go` 和独立 Pilot-1 authorization 同时 current 时进入。
- 将 E 审核过的 exact OCI bytes 发布到 private Alibaba ACR，不得 rebuild 或依赖
  mutable tag；按 D-locked dedicated VPC/dual-ECS/dual-RDS/Redis/KMS topology
  部署并生成 readback-verified deployment binding。
- My-Chat 与 Nurture 的 owner-separated infrastructure/database/secret/observability
  tracks 可在共同 topology/binding contract 下并行；各自 artifact→migration→
  deployment→readback 的顺序不可跨越，跨 owner 不能共享 DB credentials 或事实。
- Pilot-1 始终以 capability false、active rows `[]` 结束。它可以在 gates closed
  时准备 exact synthetic Workspace/accounts/bootstrap spec，但不得创建业务激活。
- Internal order is:
  1. freeze authorized change window、region/resource/cost/RACI/rollback plan；
  2. publish exact reviewed bytes and provision locked network/compute/database/
     Redis/KMS/telemetry resources；
  3. apply owner-separated ordered migrations and initialize independent backup/PITR；
  4. deploy and bind exact non-secret config plus secret/KMS refs；
  5. read back executable、migration heads、owner deployments、resources、trust and
     effective gates, then sign one current `pilot_deployment_binding_v1`。
- ACR、database、KMS 和 telemetry provisioning MAY overlap where independent, but
  deployment waits for its exact prerequisites and final Binding is a mandatory join.
  Nurture remains private behind My-Chat ingress throughout.

### G6-D — Default-off Qualification & G7 Handoff

- 汇合 exact Candidate、E decision、Pilot-1 deployment binding、current C-3/C-4
  qualification、isolated restore、dual-gate/hard-stop、secret/KMS/trust custody、
  telemetry/audit 和 final false/empty census。
- 形成 G7 Pilot-2 所需的 current `pilot2_rehearsal_readiness_seal_v1`，其输入必须
  证明 `capability=false`、active rows `[]`、
  `externalProductTrafficCount=0` 且无 unresolved outcome/drift。
- G6 Exit 只授权把该 seal 提交给独立的 G7/Pilot-2 stage-authorization review；
  seal、E Go、deployment binding 或 G5 PASS 均不能创建 activation row。
- Internal order is:
  1. reread all current Candidate/E/C-3/C-4/Binding heads；
  2. qualify isolated restore independently for both owner databases；
  3. prove each technical gate denies new work and the infrastructure hard-stop closes
     ingress/private call/claim/worker/Notification send-open seams；
  4. verify real secret/KMS custody、telemetry、audit、backup and drift detection；
  5. prepare the exact synthetic Workspace/accounts/bootstrap spec and bound bootstrap
     operation while gates remain closed and ordinary business remains unavailable；
  6. seal the final false/empty/zero-traffic/no-unresolved census。

### G6 dependency and parallelism

```text
G5 exact handoff
  -> G6-0 reconciliation
  -> G6-A1 C3 qualification -> G6-A2 C4 qualification ------\
       \-> G6-A3 D source/IaC/runbook preparation -----------+-> G6-A4 complete candidate
                                                             -> G6-A5 disposable D seal/census
                                                             -> G6-B Pilot-0-E
                                                             -> separate Pilot-1 authorization
                                                             -> G6-C default-off deployment
                                                             -> G6-D readiness seal
                                                             -> separate G7 review
```

允许的并行只有：

1. G6-A3 的非状态性准备与 G6-A1/A2 后半段依赖感知并行；
2. G6-C 中 My-Chat/Nurture owner-separated provisioning 在共同锁定输入后的并行；
3. 分支内测试、文档、runbook 和 body-free evidence assembly 的局部并行。

严格串行的是 G6-0 entry、A1→A2 qualification、A4/A5 join、Pilot-0-E、独立
Pilot-1 authorization、Pilot-1 deployment 和 G6-D final join。

### G6 acceptance boundary

| Package | Qualifying outcome | Mandatory NO-GO |
| --- | --- | --- |
| G6-0 | exact reuse, controlled successor-Service-Candidate branch, or explicit complete-Pilot-only delta | mutable alias, unclassified drift, required/authority/privacy limitation |
| G6-A | current C-3/C-4 qualifications, signed complete candidate, current D seal, `QR=0`, exact TR census | historical/superseded qualification, missing owner, non-zero traffic, incomplete teardown, persistent Pilot state |
| G6-B | one current signed `go|no_go` over exact inputs | inferred/count-only readiness, waived/missing/ambiguous census or stale input |
| G6-C | one current readback-verified Pilot Binding with deployment complete and false/empty | rebuild, mutable tag, shared DB/credential, positive gate/row or unbound drift |
| G6-D | current Pilot-2 readiness seal over restore/hard-stop/custody/false-empty evidence | active row, non-zero external traffic, incomplete restore/hard-stop, unresolved outcome or stale head |

G6 has no generic `PASS_WITH_LIMITATIONS`. The only pre-authorized E scope
exclusion is exact `TR-P1-3a`；all required-path、authority、privacy、security、
migration、recovery、evidence-integrity or drift gaps are NO-GO. The accepted overall
exit statement is:

```text
G6_DEFAULT_OFF_QUALIFIED
PILOT2_STAGE_AUTHORIZATION_PENDING
EXTERNAL_TRAFFIC_NO_GO
```

G7 MUST reread every current head at entry. Administrative completion of a future G6
task never preserves eligibility after qualification/E/Binding/seal invalidation.

### G6 schedule protection and task boundary

- Late G5 MAY prepare a read-only Pilot carry-forward census so known
  Candidate-defining work can be completed before G5 Freeze where practical.
- G6 remains outside the G1～G5 development critical path. IaC/runbook/evidence-schema
  drafts and read-only region/quota/permission census MAY start early；artifact/ACR、
  persistent DB/cloud resources、real secret/KMS and deployment MUST wait for their
  explicit gates.
- T-002 remains the C/D/Pilot contract SSOT；T-008 owns the G5 Service Candidate and
  internal-beta evidence. G6 execution is proposed as one new future task,
  `nurture-pilot-default-off-release`, with five packages and a separate My-Chat
  companion task. No task or feature is registered by this decision.

## 2026-07-31 — Stage G7 scope, order and acceptance accepted

### G7 overall goal

G7 将 G6 的 default-off Pilot deployment/readiness 推进到一次 **有界内部
synthetic Pilot 演练与 120 小时观察**。它证明 exact deployed topology、双门禁、
owner boundaries、恢复路径和六 surface scripted contract 可以在一个锁定的内部
cohort 上连续运行；它不证明真实家庭价值、机构采用、生产可用性、native delivery
或外部流量 readiness。

### G7 accepted scope boundary

G7 Scope In：

- G6 当前 complete candidate、C-3/C-4 qualification、E decision、final
  Pilot-1 Binding、policy/trust/profile heads 和
  `pilot2_rehearsal_readiness_seal_v1`；
- 一个 exact synthetic cohort：1 internal test Workspace、1 synthetic
  Institution、1 CareGroup、3 child scopes、3 independent families、4
  Guardians、1 Institution Admin、1 sole-Lead Caregiver 和 1 不持有 Nurture
  business role 的 Technical Operator，共 7 个内部账号；
- Pilot-2 stage authorization、dual-gate activation、first-Institution bootstrap
  和真实 product workbench/Guardian flow cohort completion；
- Pilot-3 ordered fault/restore/rotation/delivery/stale-open/revoke/redaction/
  `outcome_unknown`/kill-switch rehearsal；
- Pilot-4 no-reset baseline、新 stage authorization、新 row、五个连续 24 小时
  segment 和 exact seven-question sample；
- terminal false/empty census、daily/stop/result evidence 和下一范围建议。

G7 Scope Out：

- 真实 child/family/institution/caregiver、cohort expansion 或第二
  Workspace/window/cohort；
- cohort 外 external product traffic、external beta、staging、production、GA；
- native mobile、OS push、SMS/email、external provider/recipient delivery；
- protected AI、attachments 或任何为通过 Pilot 而新增的产品 capability；
- A/B experiment、随机/ad hoc business traffic 或未冻结的额外 question/effect；
- SQL、direct fact edit、DB reset/reseed、destructive rollback 或跨 owner
  database/credential sharing；
- 自动批准 real-user next scope、生产 SLA、用户价值、效率或 adoption 结论。

### G7-0 — Stage Entry & Authority Freeze

- 在任何正向 gate mutation 前，MUST reread current complete candidate、C-3/C-4
  qualification、E、final Pilot Binding、Pilot-2 readiness seal、profile/schema/
  migration/config/policy/trust/surface-registry heads、false/empty census 和
  `externalProductTrafficCount=0`。
- MUST 冻结 exact cohort、seven planned question paths、runbook、RACI、time
  source、incident/stop criteria、evidence destinations 和 expected terminal
  state；missing、ambiguous、stale、invalidated 或 unresolved input 均为 NO-GO。
- 独立 `pilot2_rehearsal` stage authorization MUST 只绑定该 exact
  environment/Workspace/candidate/Binding/profile/interval 和 readiness seal。
  Signer 不能 deploy、enable、create row、执行 fault 或持有 Pilot business role。
- G7-0 PASS 只开放 G7-A 的 exact activation input；readiness seal、E、Binding
  或 G6 completion 均不能替代 stage authorization。

### G7-A — Pilot-2 Activation & Cohort Bootstrap

执行顺序固定为：

1. initial Institution Admin 先通过 My-Chat 接受 exact bootstrap invitation 并
   提交 current Workspace membership；
2. `pilot_release_controller` 在 active rows 仍为 `[]` 时启用 environment
   capability，并完成单谓词 fail-closed census；
3. controller 最后创建唯一、time-bounded、exact
   `pilot2_rehearsal` Workspace row；
4. row 首先保持 `bootstrapAdmissionMode=bootstrap_only`，只允许 dedicated C-0
   controller claim/recovery path；
5. Nurture C-0 transaction exact-once 创建一个 Institution、Participant、first
   Institution Admin role 和 CommandExecution；
6. Host 只在 `owner_committed + exact spec consumed + quarantine clear` 后将
   provisioning lineage 推进为 `ordinary_ready`；
7. current Institution Admin 通过真实 workbench 创建 CareGroup、staff、roster
   和三条 Enrollment；Guardians 通过真实 product flow 创建七条计划路径所需的
   current Grant/Thread state。

G7-A qualifying outcome 是 exact cohort ready for rehearsal，不是独立 G7 PASS。
它要求 cohort/cardinality/role/row 精确、七条路径均 eligible、无 authority
ambiguity、无 SQL/operator bypass、无 unresolved outcome，且
`externalProductTrafficCount=0`。Bootstrap response loss 只可恢复 same
operation/spec；不得创建 replacement operation 或猜测成功。

### G7-B — Pilot-3 Rehearsal & Terminal Disable

- 独立 `pilot3_rehearsal_plan_authorization_v1` MUST 在 G7-A current row 和
  Pilot-2 authorization 上冻结 exact ordered fault matrix、executors、expected
  results 和 terminal false/empty state；它不能 mint/re-enable/replace row 或
  扩大 traffic。
- Matrix MUST 覆盖 owner/KMS/Secrets、Outbox/dispatcher/DLQ、stale open、
  Grant revoke/redaction、response loss/`outcome_unknown`、双 owner DB isolated
  restore、credential/key rotation、Workspace-row/capability kill switch 和
  infrastructure hard stop。
- 若 rehearsal revoke 的 Grant 为 Pilot-4 七条路径所需，replacement MUST 在
  final kill switch 之前通过当前真实 Guardian flow 创建；baseline 不得恢复旧
  Grant、使用 SQL/reset/reseed 或暗示事实修复。
- 成功 lineage 只有：

```text
gates_closed
  -> final_binding_bound
  -> plan consumed_success
  -> Pilot-2 stage authorization consumed
  -> pilot3_terminal_rehearsal_seal_v1
```

- Binding-changing rotation 只能产生 same-candidate successor，并只改变 plan
  allowlist 内的 secret/KMS/trust refs。Artifact、schema/migration、topology、
  resource、environment 或 behavior configuration drift 不是合法 successor。
- G7-B MUST 结束为 capability false、active rows `[]`、old Pilot-2 row
  permanently non-restorable、final Binding current 且无 unresolved outcome。
  Failure、expiry、revoke、out-of-order、partial consumption 或 unexpected drift
  产生 non-passing evidence，并阻断 G7-C；修复路由到最小 owning layer。

### G7-C — Pilot-4 Fresh Baseline & 120-hour Observation

1. 在 gates closed 下运行 owner-path census；不得 SQL、DB reset/reseed 或事实
   注入。Census 必须对 exact unchanged cohort、current Grant/Thread、
   Institution/CareGroup/Enrollment、required surfaces、final Binding、
   policy/trust 和 zero unresolved state 签发
   `pilot4_observation_baseline_seal_v1`。
2. 独立签发新的 `pilot4_observation` authorization，并创建新的 exact Workspace
   row。它 MUST 同时绑定 terminal rehearsal seal 和 baseline seal；Pilot-2
   authorization/row 不得复用。
3. 观察窗口严格为 `[T0,T0+120h)`，由五个无 gap/overlap 的 24 小时 segment
   组成。每段至少完成一条 planned authenticated journey，并完成 Institution
   board read、gate/authority/telemetry/backup/incident/unresolved census。
4. 七条计划 question paths 覆盖三个 child scopes、Guardian Chat/family board/
   family workbench，以及 Caregiver `Chat|teacher_board` 的四种
   acknowledge/reply pairing；每条均 explicit acknowledge 且 exactly one reply。
   推荐 runbook 分布为 `2/1/1/1/2`，但具体分布只在 T0 前冻结的 operation plan
   中生效，不升级为产品合同。
5. 每个 admitted technical submit/acknowledge/reply action MUST 在 60 秒内达到
   committed/replayable success 或 safe unavailability；这不是对人工完整
   question-to-reply 时长的约束。In-app Notification MUST 在五分钟内 available
   或 terminally classified。
6. `externalProductTrafficCount=0` 表示没有 cohort 外产品/owner/business/
   Notification/open traffic，不表示七个内部账号没有 planned product traffic。
   Negative probe 只允许 exact synthetic source 在 Nurture admission/owner call
   前被拒绝且产生零 effect；任何 admitted 第八条 question 或 unplanned business
   effect 立即使窗口 `no_pass` 并触发 shutdown。
7. Pilot-4 不重复 Pilot-3 planned faults。SEV0/SEV1、gate shutdown、DB restore、
   Candidate/Binding/schema/migration/config/trust/policy/surface/row change、
   telemetry/audit/backup gap、incomplete daily seal、non-zero external traffic、
   unplanned effect 或 unresolved outcome 均终止当前 clock。修复后 MUST 重新走
   所需最小资格化层，使用新 authorization/row 并从零开始完整 120 小时；不得
   pause/resume、padding 或拼接窗口。

### G7-D — Terminal Evidence & Next-Scope Recommendation

- 到 `Tend` 或提前 stop 时，MUST 关闭/移除 row、关闭 capability 并确认没有
  business route。隔离 evidence lane MAY 使用最多两小时 sealing grace 完成
  terminal daily seal、mandatory stop evidence 和 result；期间不得有 product
  route、owner command、delivery、retry 或 open。
- `pilot4_observation_result_v1` 的 exact result 只有：
  - `pass`：五个连续 passing daily seals + passing terminal false/empty census，
    且没有 stop record；
  - `no_pass`：任一 failed full/partial segment、PASS criterion failure，或五个
    pass seals 后 terminal census/sealing/review failure；
  - `stopped`：preventive/manual/authority withdrawal，且没有 observed PASS
    criterion failure；failure 与 stop 同时成立时 `no_pass` 优先。
- G7 没有 `PASS_WITH_LIMITATIONS`。Evidence-complete 的 `no_pass` 或 `stopped`
  仍不满足 G7 success signal；只有 `pass` 才满足。
- Recommendation 只能是
  `continue_internal | stop | request_separate_next_scope_review`，且任何值都不
  授权下一范围。
- Project summary labels are:
  - pass：`G7_INTERNAL_PILOT_PASS / NEXT_SCOPE_REVIEW_REQUIRED /
    EXTERNAL_TRAFFIC_NO_GO`；
  - no-pass：`G7_INTERNAL_PILOT_NO_GO / GATES_CLOSED`；
  - stopped：`G7_INTERNAL_PILOT_STOPPED / GATES_CLOSED`。
  这些标签是治理摘要，不得替代签名 result 或充当 activation/traffic authority。

### G7 dependency, parallelism and development boundary

```text
G6 current readiness handoff
  -> G7-0 current-head/authority freeze
  -> G7-A Pilot-2 activation + bootstrap/cohort readiness
  -> G7-B Pilot-3 ordered rehearsal + terminal disable
  -> final Binding + no-reset baseline
  -> new Pilot-4 authorization + fresh row
  -> G7-C five contiguous 24h segments
  -> G7-D terminal close/evidence/recommendation
```

Stage spine、Pilot-3 state transitions 和 daily-seal predecessor chain 均严格串行。
只允许 body-free telemetry/evidence collectors 在同一阶段内并行；它们不能签发
authority、改变 facts、调整 cohort 或跨 segment 填补证据。不存在第二
Workspace/window/cohort 作为并行捷径。

未来 successor development MAY 在其他环境/主线继续，但 MUST NOT deploy、repin
或改变被当前 G7 观察的 exact Pilot environment。120 小时窗口不能压缩，执行排期
SHOULD 另外预留 entry/bootstrap、rehearsal、terminal sealing 和失败后 full
restart buffer。G7 冻结的是 observed environment，不是整个 repo 或后续开发。

### G7 acceptance boundary

| Package | Qualifying outcome | Mandatory NO-GO |
| --- | --- | --- |
| G7-0 | exact current heads, exact frozen cohort/runbook and current Pilot-2 authorization | stale/ambiguous/missing head, unresolved state, positive gate/row, cohort or authority ambiguity |
| G7-A | one exact ordinary-ready synthetic cohort and current rehearsal row with all seven paths eligible | SQL/operator bypass, duplicate/wrong role or row, incomplete bootstrap, unresolved outcome, external traffic |
| G7-B | full ordered rehearsal, terminal false/empty, current allowlisted final Binding and terminal seal | re-enable/restore old row, out-of-order/partial plan, unrelated drift, unresolved recovery |
| G7-C | five contiguous passing 24h seals over one unchanged baseline/authorization/row and exact seven paths | pause/padding, planned fault, identity drift, admitted extra effect, SEV0/1, evidence gap or external traffic |
| G7-D | signed `pass|no_pass|stopped`, terminal false/empty census and bounded recommendation | business route during sealing, ambiguous/overlapping evidence, generic limited pass or inferred next authority |

### G7 task-governance boundary

- Governance triage is `NEW_TASK` for future execution because G7 first creates
  business activation and carries a long-running operational evidence lineage that
  must not be merged into G6 default-off release work.
- Proposed slug: `nurture-bounded-pilot-observation`；Task ID remains pending.
  Proposed mapping is `M-002 > proposed F-004 Internal Pilot Operations > pending
  task`，with one G7 Nurture main task and a separate My-Chat companion.
- Pilot-2/3/4 remain one G7 main task because they share one exact
  authorization/row/terminal-seal/baseline/result lineage；splitting them would
  weaken end-to-end ownership and handoff closure.
- This accepted planning text creates no task/Feature and authorizes no code,
  schema/migration, database/cloud, secret/KMS, artifact/deployment, capability,
  row, activation, observation window or traffic mutation.

## 2026-07-29 — Current-project consolidation and readiness gate

The current-project consolidation is merged to Nurture `main` at
`ab92fde6c277ffd1278a85a6165a033918c8be79`. It includes the complete Nurture
T-002 owner-alignment increment and only the fail-closed environment repair
from the stale environment donor. The stale scenario-platform-convergence
worktrees were excluded and have been removed from this repository.

| Work item | State | Exit |
| --- | --- | --- |
| Consolidate Nurture branches | Complete on `main` | T-002 owner-alignment is fully merged; only the reviewed environment commit is harvested; unrelated stale donor source is excluded. Local and remote now retain only `main`. |
| Revalidate static and unit gates | Pass | Frozen install, exact pin, context, environment, governance, docs, typecheck, lint, 187 unit tests, routing, persistence, N1 schema, X4 replay, and strict consumer-boundary checks pass. |
| Rehearse Nurture databases | Pass in disposable PostgreSQL | All five production and one dev-host migrations apply from empty; ownership boundaries pass; production DB is 37/37 and dev-host is 19/19. No persistent database is contacted. |
| Requalify real X5 journey | Complete | My-Chat `a4768fe` accepts legal `CanonicalRef.version=0` and returns deterministic output refs; the exact two-database journey materializes once, exact-replays, and fails closed after revoke. |
| Promote integration branch to `main` | Complete | Merge commit `ab92fde` is on local and remote `main`; exact main CI `30412303062` passes 7/7. |

The Nurture consolidation and P3 joint-requalification gate are closed without
a lossy zero-version workaround. Cross-repository functional development is
still **NO-GO** because `C30-I0-C` is complete only for Nurture and
`C30-I0-D` remains pending.

## 2026-07-28 — My-Chat/T-030 acceptance increment

The 2026-07-28 increment accepts and repairs the Nurture-owned portion of the
cross-repository alignment plan against Base revision
`63d47d2ebc6f5062181b721a25182710f7974b17` and the My-Chat contract/X5
revision `53bf92b5c2d2c1d2e7835e34b1ac50337d64f336`.

| Work item | State | Exit |
| --- | --- | --- |
| Accept repo-qualified ownership | Complete | T-002 owns `X-2`, `RB-2`, `RB-3(a)`, `RB-6`, `DB-4(b)`, `ST-2`, `ST-4(c)`, and `ST-6(b)`; references use repository-qualified task ids. |
| Adopt Base ecosystem policy | Complete | Package distribution, source-boundary, schema-convention, and port-allocation decisions cite Base `63d47d2`; local-path dependencies are development-only and cannot be release evidence. |
| Replace Base web-workbench local link | Complete | Frontend consumes published exact `@willyu1007/web-workbench@0.7.0`; the Base template build/install steps are removed; frozen install, typecheck, lint, unit tests, and strict scan pass. |
| Remove direct sibling-source import | Complete | X5 imports only My-Chat public package exports, including the new worker subpath; the exact X5 source set is revision- and content-pinned; `ECO-CONSUMER-004` is absent. |
| Re-pin and migrate My-Chat workflow packages | Base public-SSOT re-pin verifying | T-002 pins My-Chat `53bf92b5c2d2c1d2e7835e34b1ac50337d64f336` and Base `63d47d2ebc6f5062181b721a25182710f7974b17`, migrates all shared references to canonical-ref schema v1, adds the forward data/constraint migration, builds the pinned contract package in clean CI jobs, and passes native pin, typecheck, 175-unit, migration-replay, persistence, and strict consumer-boundary gates. Historical coordinator run `30343562287` passed the prior exact Base/Nurture revisions; renewed native and four-repository cloud evidence is required for the public publishing SSOT revision. |
| Resolve service-framework timing | In progress — M0/M1/M2/M3/M4 complete | The formal NestJS scenario-service builds, starts and executes the frozen P7 controller through shared compiled composition, disabled-first service auth and production Prisma. Application parity, exact consumer, replay/recovery/revoke/privacy and lock-concurrency evidence are green on disposable PostgreSQL. API/env/port governance is aligned; M5 handoff regeneration and Fastify route disposition remain. |
| Adopt Nurture ports | Complete | `PORT=8000` is scenario-service-only, the dev-host uses dev-only `DEV_HOST_PORT=3001`, the Base-assigned local backend/frontend pair is `3200/3201`, and code/env/docs/tests share one mechanical topology check. |
| Repair API/governance drift | Complete | OpenAPI and generated API index now describe exactly the formal health plus binding-owner routes; CI verifies OpenAPI quality, index freshness, source parity, env validation and topology. |

Ordering through dependency/source cleanup and native consumer verification is
complete. Four-repository qualification closed the N3 federated gate for the
prior exact revisions. A subsequent native-cloud run proved public package
resolution, and run `30347782865` closed all functional and action-runtime
findings with zero annotations. Base then aligned its hashed publishing
manifest to the irreversible public visibility; Nurture has adopted that exact
revision/hash and awaits renewed native/federated cloud evidence. The bounded
framework and M4 governance work is complete. The controlled mainline now
returns to T-004 Phase 1-2 before T-002 M5 regenerates the exact Owner
Integration Handoff. No
shared/staging/production database apply, artifact publication, environment
mutation, activation, provider, or traffic is authorized by the 2026-07-28
increment.

## 2026-07-28 — Wave 4 P2 binding-anchor increment

The bounded Wave 4 increment implements the Nurture-owned P2 source boundary
from My-Chat/T-030 without claiming source qualification, full C30-I3 adoption,
or activation.

| Work item | State | Exit |
| --- | --- | --- |
| Freeze exact Host receipt contract | Exact replacement pinned and CI-green | My-Chat `30792cd48e35cce3720bfa8fb9a1094a59b0ccd7` keeps anchors private and adds durable replay, monotonic versions, CAS, and PostgreSQL race convergence. The expanded 15-file Host source population verifies at `3dadb0...f0c5`; Host CI `30375174861` passes with zero annotations. |
| Add typed body-free anchors | Complete locally | Child and Family owner refs use separate namespaces and random UUID anchors. Normal lifecycle is `reserved|bound_empty|associated|retired`; `revoked|quarantined` fail closed. |
| Add owner authorization adapter | Repair complete locally, default-deny | A transaction-scoped adapter receives the exact Prisma transaction, rereads/locks or CAS-validates the exact authority source after the anchor lock, and persists or exact-replays the receipt in that transaction. Default wiring denies; no production reader is wired. |
| Add exact local association schema | Complete as target schema | Workspace/Child/Process/Family integrity is enforced with composite keys and foreign keys. No sibling ORM/source or cross-database join is introduced. |
| Stop new plaintext birth-date writes | Complete as unapplied migration | A column-scoped trigger blocks non-null inserts and explicit birth-date updates once applied while allowing unrelated updates to historical rows. No existing value is read, deleted, migrated, or inferred. |
| Add derived age/stage boundary | Complete locally | Only `age_band_key`, owner-defined `stage_key`, `as_of_date`, positive `source_version`, and current canonical UTC expiry are accepted; raw birth date, exact age, unknown fields, future as-of dates, and expired values fail closed. |
| P2 negative and replay verification | Repair tests complete locally | Existing negatives remain green. A real PostgreSQL interleaving now locks the exact care-role source, proves concurrent revoke cannot overtake issuance, and proves post-commit revoke denies the next issue. Three target rounds pass. |
| Refresh pins/context/governance and cloud CI | Complete for synchronized repaired source | Exact Host pin, 31-file Nurture source `354bb2...c83f`, normative context contract, strict boundary, context/governance, type/unit, 37 DB tests, dev-host E2E, and frontend gates pass at exact revision `b615a57` in native run `30403774597` with zero annotations. |
| Apply migration or activate consumers | Not authorized | Requires the separate T-027/T-028 environment, row-count, owner-review, release-unit, backup/rollback, and activation decisions. |

The Wave 4 P2 implementation repair and normative contract sync are complete
at exact source `b615a57`.
Transaction-atomic owner authorization, targeted concurrency/privacy,
refreshed pin/source hashes, and native CI pass. Formal joint owner/PR adoption
review remains. The resulting revision is not a C30 component candidate,
qualified Pilot artifact, applied migration, or release approval.

## C30-I0 — Implementation baseline isolation（已完成）

`C30-I0` 只建立可归属、可回放、不可变的实施入口，不实现 C30-I1
合同，也不修改 schema/runtime/database/gate。详细证据见
`artifacts/12-c30-i0-baseline-inventory.md`。

| Sub-gate | State | Exit |
| --- | --- | --- |
| `C30-I0-A` 三仓/worktree/依赖/schema/gate census | Complete | 精确 revision、dirty ownership、重叠路径、migration/source/gate 和验证状态已记录。 |
| `C30-I0-B` T-029 donor disposition | Complete | `artifacts/13-c30-i0-b-t029-disposition.md` 覆盖 Base 57、My-Chat 79、Nurture 40 个候选文件；无文件可原样合并，可抽取机制全部标为 `REWORK`，直接平台 ref、umbrella source、双 manifest/Execution track 和跨节点混合迁移均已排除。 |
| `C30-I0-C` scoped commits and clean worktrees | Complete | Exact isolated branches exist at Base `20c4b7a…` and My-Chat `dc4a77b…`; the Nurture branch was created from runtime checkpoint `882d80f…` and may advance only through T-002 evidence documentation. Historical X5/Q4B5/T-029/T-027/Claude worktrees are clean and retained under their owners; the dirty My-Chat primary `next-env.d.ts` is excluded and untouched. |
| `C30-I0-D` immutable pins and false/empty proof | Complete | Base verifier rejects symbolic revisions, mutable package-path joint candidates, checkout drift and symlink-entry no-ops. Exact three-Git pins/source hashes, repository false/empty census, Base conformance, My-Chat type/lint/unit/schema and Nurture type/lint/unit/static/schema populations pass in the isolated topology. |

`C30-I0-A/B/C/D` 现已全部完成；`C30-I1` 已按独立小片推进到 I1-A 验收和
I1-B1 实施/本地验证。I1-B2 及后续片仍需分别授权。数据库 apply、环境 row
census、capability/Workspace activation、artifact/cloud/secret/traffic 仍需各自
的单独授权。

Current execution record:
[`artifacts/14-c30-i0-cd-baseline-record.md`](./artifacts/14-c30-i0-cd-baseline-record.md).

## C30-I1 — Neutral shared contracts（I1-A/I1-B/I1-C/I1-D 已验收）

The complete Base gate remains cumulative, but execution is ordered into six
reviewable slices so one broad contract change cannot silently mix authorities:

| Slice | State | Boundary |
| --- | --- | --- |
| `C30-I1-A` trusted invocation contract spine | Accepted | Base `ce7118c…` plus source lock `bd69d19…`; principal, ingress and private envelope types/codecs/Schemas/fixtures only. |
| `C30-I1-B` canonical-object binding envelope | Accepted | B1-B3 source `edbcd74…` plus B4 lock `9a15865…`; cumulative Schema/codec/exposure/build/conformance and exact source hash `16be693c…2512` pass. No consumer adoption. |
| `C30-I1-C` subject presentation | Accepted | Successor source `ae0c357…` plus lock `3c30337…`; R1-R6 and repeated Schema/codec/exposure/build/conformance pass at hash `fc35c6b…e5cf3`. No consumer adoption. |
| `C30-I1-D` domain action | Reaccepted | Artifact 35 closes D-R1..D-R5 at source `3580a9b…` plus metadata lock `1cb5691…`; 55 Schemas, 296 Node tests and deterministic build/source evidence pass. Manifest dependency/source convergence remains I1-F. |
| `C30-I1-E` protected interaction | Ready for separate scope review | Protected lifecycle control wire and no-copy negatives only; implementation is not authorized. |
| `C30-I1-F` dependency/source convergence | Blocked by I1-A..E | Atomic dependencies, legacy/vNext exclusion, schema/codec parity and four separate source identities. |

I1-A's exact wire names, fields, validation rules, file-impact preview, acceptance
criteria and non-goals are frozen in
[`artifacts/15-c30-i1-scope-freeze.md`](./artifacts/15-c30-i1-scope-freeze.md).
I1-B's exposure classes, wire families, validation/fixture matrix, impact preview
and four ordered implementation units are frozen in
[`artifacts/16-c30-i1-b-scope-freeze.md`](./artifacts/16-c30-i1-b-scope-freeze.md).
The exact I1-B1 source and verification checkpoint is recorded in
[`artifacts/17-c30-i1-b1-implementation-record.md`](./artifacts/17-c30-i1-b1-implementation-record.md).
The exact I1-B2 source and verification checkpoint is recorded in
[`artifacts/18-c30-i1-b2-implementation-record.md`](./artifacts/18-c30-i1-b2-implementation-record.md).
The exact I1-B3 source and verification checkpoint is recorded in
[`artifacts/19-c30-i1-b3-implementation-record.md`](./artifacts/19-c30-i1-b3-implementation-record.md).
The cumulative I1-B4 qualification and exact source-lock checkpoint is recorded in
[`artifacts/20-c30-i1-b4-qualification-record.md`](./artifacts/20-c30-i1-b4-qualification-record.md).
I1-C's exact provider/presentation wires, bounds, validation matrix, donor
disposition, Base impact and four ordered implementation units are frozen in
[`artifacts/21-c30-i1-c-scope-freeze.md`](./artifacts/21-c30-i1-c-scope-freeze.md).
The exact I1-C1 source and local verification checkpoint is recorded in
[`artifacts/22-c30-i1-c1-implementation-record.md`](./artifacts/22-c30-i1-c1-implementation-record.md).
The exact I1-C2 source and local verification checkpoint is recorded in
[`artifacts/23-c30-i1-c2-implementation-record.md`](./artifacts/23-c30-i1-c2-implementation-record.md).
The exact I1-C3 source and local verification checkpoint is recorded in
[`artifacts/24-c30-i1-c3-implementation-record.md`](./artifacts/24-c30-i1-c3-implementation-record.md).
The cumulative I1-C4 qualification and exact source-lock checkpoint is recorded in
[`artifacts/25-c30-i1-c4-qualification-record.md`](./artifacts/25-c30-i1-c4-qualification-record.md).
Its quality-review reopening and bounded successor-repair scope are recorded in
[`artifacts/26-c30-i1-c4-quality-repair-freeze.md`](./artifacts/26-c30-i1-c4-quality-repair-freeze.md).
The successor repair qualification and source-lock checkpoint are recorded in
[`artifacts/27-c30-i1-c4-quality-repair-qualification-record.md`](./artifacts/27-c30-i1-c4-quality-repair-qualification-record.md).
I1-D's exact standalone action contract, exposure zones, prepare/submit and
assurance wires, direct/claimed identity/result/recovery rules, bounds, negatives
and five ordered implementation units are frozen in
[`artifacts/28-c30-i1-d-scope-freeze.md`](./artifacts/28-c30-i1-d-scope-freeze.md).
The four source checkpoints are recorded in artifacts
[`29`](./artifacts/29-c30-i1-d1-implementation-record.md),
[`30`](./artifacts/30-c30-i1-d2-implementation-record.md),
[`31`](./artifacts/31-c30-i1-d3-implementation-record.md) and
[`32`](./artifacts/32-c30-i1-d4-implementation-record.md). The cumulative quality
review, exact source and metadata lock are recorded in
[`artifact 33`](./artifacts/33-c30-i1-d5-qualification-record.md).
Its acceptance reopening and bounded successor-repair scope are recorded in
[`artifact 34`](./artifacts/34-c30-i1-d5-quality-repair-freeze.md).
The successor repair qualification and source-lock checkpoint are recorded in
[`artifact 35`](./artifacts/35-c30-i1-d5-successor-quality-repair-qualification-record.md).
No I1 sub-slice alone opens C30-I2; the full I1-A..F exit must pass first.

---

## Phase IA — 设计 & 治理登记（本仓，已完成）

**目标：** 把机构生态正式写入项目治理与设计文档，产出可交付的设计包，不改 live manifest，不破坏 conformance。

**步骤：**

1. 写设计包：`00-overview.md` / `01-plan.md` / `02-architecture.md` / `roadmap.md`。
2. 治理登记：`registry.yaml` 加 M-002 / F-002 / T-002；`feature-map.md` 加 F-002 语义 brief；跑 `ctl-project-governance sync --apply`。
3. manifest 增量以 SPEC 形式保留在架构文档里，暂不改 `scenario.manifest.yaml`。

**验收：**

- `node .ai/scripts/ctl-project-governance.mjs lint --check --project main` 绿。
- `node .ai/skills/features/context-awareness/scripts/ctl-context.mjs verify --repo-root . --strict` 绿。
- 现有 conformance 不受影响。

---

## Phase IA.1 — 边界与 `family_to_org` 对齐（本仓，已完成）

**目标：** 在进入 schema/代码实现前，确认 Nurture 的中心对象、场景角色、My-Chat/Nurture ownership 边界，以及班级家庭沟通中枢的 MVP。

**已对齐结论：**

1. **中心对象**：Nurture 的基本单位是 `NurtureChildCareProcess`。家长加入这个过程；老师把这个过程并入班级工作流；机构管理者治理这些过程。
2. **用户边界**：家长、老师、机构管理者都是 My-Chat 用户；小孩不是 My-Chat 用户。
3. **ownership**：My-Chat owns adult account plus protected platform Child/Family identity, stewardship/membership, scenario binding, and shell；Nurture owns body-free typed anchors, exact workspace associations, local Child/Process/child-scoped Family, roles, Enrollment/Grant, and the care ecology graph。
4. **场景关系**：家庭、孩子、机构、班级、老师分配、入托、授权、家园沟通都归 Nurture canonical。
5. **家园沟通**：Nurture 保存 `NurtureFamilyCareMessage` 原文和 `NurtureFamilyCareItem` 结构化事项；My-Chat 只做 shell/render/notification/deep link。
6. **老师痛点**：一个班 10 个孩子产生 10 个私密沟通线程，老师侧必须聚合成 `class_family_inbox`。

**待细化：**

1. `NurtureChildCareProcess`、`NurtureParticipant`、`NurtureCareRoleAssignment`、`NurtureEnrollment` 的字段和生命周期。
2. `NurtureChildLinkGrant` 的 data class、direction、receipt、revoke、保留窗口。
3. `NurtureFamilyCareItem` 的分类、状态机、过期规则和指派规则。
4. My-Chat shell 需要保存哪些 display-safe projection metadata。

**验收：**

- 决策结论写入 `roadmap.md` 和 `02-architecture.md`。
- 关键 tradeoff 写入 `03-implementation-notes.md`。
- `docs/context/workflow/nurture-scenario-contract.md` 同步新 ownership 边界。
- context/governance 校验通过。

---

## Phase IB — Nurture care ecology canonical（本仓，已锁定）

**目标：** 设计 Nurture-owned canonical schema 和 resolver contract，为 IIA 接线准备。

**当前产物：**

- `06-ib-nurture-schema-spec.md`（design-only，不改 Prisma schema，不接 live manifest）
- `07-ib-decision-convergence.md`（child scope baseline + 7 个 IB open decisions 的 implementation defaults）
- IB-D0 through IB-D7 are locked and feed IIA.

**步骤：**

1. Review/lock 核心对象 schema SPEC：
   - `NurtureParticipant`
   - `NurtureChild`
   - `NurtureChildCareProcess`
   - `NurtureCareRoleAssignment`
   - `NurtureFamily`
   - `NurtureCareInstitution`
   - `NurtureCareGroup`
   - `NurtureEnrollment`
   - `NurtureChildLinkGrant`
2. Review/lock 家园沟通 schema SPEC：
   - `NurtureFamilyCareThread`
   - `NurtureFamilyCareMessage`
   - `NurtureFamilyCareItem`
3. Review/lock My-Chat integration contract：
   - `my_chat_user_id` 映射
   - mobile/web render refs
   - notification/deep link payload
   - host workflow runtime refs
4. 设计 policies：
   - `can_view_child_care_process`
   - `can_write_family_care_message`
   - `can_receive_family_context`
   - `can_share_to_family`
   - `caregiver_scope`
5. 收敛 Prisma implementation defaults：
   - `NurtureChildCareProcess` as independent child scope
   - `NurtureParticipant` uniqueness
   - `NurtureFamily` MVP cardinality
   - `NurtureTeacherAttentionItem` projection strategy
   - grant revoke retention semantics
   - data class/category vocabulary model
   - message protection/redaction boundary
   - My-Chat shell metadata envelope

**门禁/依赖：**

- 不改 live manifest。
- 不改 Prisma schema，除非正式进入 schema implementation 并走 DB SSOT 流程。
- My-Chat 只需提供 account/shell/runtime contract，不需要拥有 Nurture care canonical。

**验收：**

- schema SPEC 可解释一个班 10 个小孩、多个家长、多个老师和机构管理者的全关系。
- 所有 child-specific care facts 都能通过 `childCareProcessId` 解释，老师/家长视角只是 child scopes 的聚合/过滤/再组织。
- 7 个 IB open decisions 已有 implementation defaults，且生产 rollout gates 明确。
- `family_to_org` 和 `org_to_family` 都能通过 grant + policy + receipt fail-closed。
- fresh reader 可从 `02-architecture.md` 和 `06-ib-nurture-schema-spec.md` 推导首批表、权限和 UI 工作流。

---

## Phase IIA — 场景契约 + 数据 + 领域逻辑（本仓，当前）

**目标：** 把 IA/IB 的设计接线，跑通机构侧首批 capability 和家园沟通闭环。IIA-0 contract preflight 已锁定；实施按 X0-X5/N1-N2 跨仓门禁推进，不做三仓同时切换。

**步骤：**

1. X0 My-Workflow-Base：以 additive/migration-safe 方式增加 vNext handoff/driver/host-capability 合同和模板 conformance；不实现运行时。
2. X1 My-Chat contract adoption：采用相同类型/validator/worker pass-through，保持旧场景可编译，`workflow_handoff_materialization_v1` 默认关闭。
3. X2 My-Chat Step kernel：实现真实 Postgres `WorkflowRuntimePort`、claim/complete/fail、completion replay 和 host dependency injection。
4. X3 My-Chat Handoff kernel：实现 Handoff Ledger、`complete_step` 原子 materializer、outbox、Admin reconciliation；dev capability 才可开启。
5. N1 Nurture core（可在 X2/X3 期间并行）：按 IB/IIA 设计增加 schema、`NurtureCommandExecution`、`NurtureInteractionContext`、command runner 和首批 inbox/attention 业务；所有 Execution 只允许 explicit `handoffRequestSnapshotsPayload=[]`。
6. X4/N2 双仓 activation：接 claimed driver、non-empty snapshots、manifest `handoff_key`/context refs、`user_attention` owner reread；仍在 feature gate 后。
7. X5 joint acceptance：通过 commit/response loss、same-Step reclaim、wrong-Step denial、partial duplicate、revoke/redaction/cancel/provider failure 矩阵后才启用非空 activation。
8. `scenario.manifest.yaml`：按能力增量声明 `class_family_inbox`、`teacher_attention_board`、`caregiver_daily_care`、`child_media_attribution`；teacher mobile 是 surface composition，不作为 canonical business capability。
9. `prisma/schema.prisma`：进入 N1 时使用 `sync-db-schema-from-code` 工作流；不把 host Handoff Ledger 写进 Nurture schema。
10. handlers：
   - `open_class_family_inbox`
   - `open_today_attention_board`
   - `record_daily_care_log`
   - `classify_child_media_assets`
11. family-care processing：
   - 保存 `NurtureFamilyCareMessage`
   - 提取 `NurtureFamilyCareItem`
   - 指派/确认/回复/跟进状态流转
12. presenters：
   - 老师班级 inbox
   - 今日看板
   - 家长私密线程
   - display-safe notification/deep link summary
13. tests：
   - caregiver scope 越组拒绝
   - family_to_org data class 不匹配拒绝
   - revoke 后新投递拒绝
   - teacher 回复只回到对应小孩家庭线程
   - Chat-entitled guardian/caregiver role-agnostic ingress plus institution Chat denial
   - dashboard role switch validation
   - one active family per child care process
   - message redaction vs projection suppression
   - stale notification/deep link re-resolves through Nurture
   - institution command + at least one existing family-core command share the same CommandExecution repository/runner and replay contract

**IIA-0-C1 implementation sequence：**

1. `class_family_inbox` + `teacher_attention_board` first.
2. `caregiver_daily_care` second.
3. `child_media_attribution` third.

**N1 implementation checkpoints（2026-07-14）：**

| Checkpoint | Status | Scope / exit evidence |
| --- | --- | --- |
| N1-A | Complete | Cross-repo revision/hash pin and explicit-empty activation boundary. |
| N1-B | Complete | Additive production schema/migration/context; migration applied only to the approved local `localhost:5433/nurture` target and catalog boundary verified. |
| N1-C | Complete | Shared CommandExecution runner, InteractionContext, Prisma transaction adapter, and one family-core command migration. |
| N1-D | Complete | Fail-closed resolver, candidate kernel, structured policy, and current-state source adapters. |
| N1-E | Complete | Family input → receipt/item/attention, caregiver acknowledge/reply, grant revoke, source redaction, pre-delivery cancel, class inbox/attention owner reads; explicit `[]` only. |
| N1-F | Complete | Approved production-DB migration apply; 22/22 DB tests; DB-backed capture/replay/revoke/redaction/cancel and direct surface journey; YAML/registry/module conformance; final architecture repairs and N1 review. |

**X4/N2 implementation-entry checkpoints（2026-07-15）：**

| Checkpoint | Status | Scope / exit evidence |
| --- | --- | --- |
| X4-0A | Complete | My-Chat X3 hardening delivered and post-commit verified at final revision `4d40d81`. |
| X4-0B | Complete | Nurture dependency pin updated to X3; Base/My-Chat parity, scenario pin, and negative drift tests pass. |
| X4-0C | Complete | Nurture typecheck, 152 unit tests, Prisma/schema/boundary, routing/population, context, governance, and whitespace gates pass after refreshing the local `file:` dependency snapshot. |
| X4-0D | Complete | Pin/SSOT update committed at `6f2c836`; independent X4 branches created from immutable Nurture/My-Chat baselines; first slice locked to claimed-Step `user_attention` replay seeds without manifest/host activation. |
| X4-A1 | Complete | Command runner validates trusted driver binding before lookup/transaction, persists bounded refs-only snapshots plus canonical original-Step provenance, preserves direct explicit-empty, and fences replay to the same Step. |
| X4-A2 | Complete | Custom CHECK migration preview, strict persisted JSON parser, static contract assertion, unit/privacy/replay tests, and DB-backed test case implemented. No database was connected or mutated. |
| X4-A3 | Complete | Approved disposable database `nurture_x4_validation_e7d4590` is migration-current; 23/23 DB/E2E, 43-table/71-enum boundary, validated CHECK, negative JSON probes, DB context, and public database suite pass. Existing `nurture` was not touched. |
| X4-B | Complete | My-Chat worker bridge converts a claimed Step into the Base-shaped transient driver and converts returned snapshots into whitelisted handoff drafts. Runtime implementation `a9685d5`, final delivery/exact pin `26f57be`; 327 non-DB tests and all delivery gates pass with capability disabled. |
| X4-C1 | Complete | Delivered at `2398d98`. Nurture receives the bridge only through a host-injected port, resolves stable scenario command/request IDs through a scenario-owned source port, replays only on the original Step, returns one opaque CommandExecution output ref, and emits no host-standard event. The handler is registered but absent from the manifest and the default composition has no business-source adapter. |
| X4-C2 | Complete | Added the versioned manifest handoff/context-source declarations, strict production business-source adapter, explicit activation-only module factory, current owner reread, service-auth boundary, My-Chat dev-only owner/capability, idempotent notification/deep-link shell, and isolated PostgreSQL verification. Default Nurture composition plus My-Chat staging/prod remain disabled. |
| X4-C3 | Complete | Final architecture/privacy review repaired Actor/user binding, receipt-open state, unauthorized lifecycle reason leak, notification channel convergence, generic fallback coupling, owner-outage open behavior, and global mobile deep-link routing. Cross-repo pins and full static/DB gates pass. |
| X5 | Complete | Combined fault/privacy/recovery/telemetry matrix passes; pilot enablement remains a separate authorization node. |

**X5 joint-acceptance checkpoints（2026-07-15）：**

| Checkpoint | Status | Scope / exit evidence |
| --- | --- | --- |
| X5-A | Complete | X4 revisions/hashes, existing-vs-missing evidence, and the fresh two-production-DB plus private dev-host DB validation topology are locked without changing activation posture. |
| X5-B | Complete | The real two-database response-loss/reclaim/wrong-Step/revoke/privacy journey and My-Chat Admin technical recovery pass. Existing deterministic tests remain the authority for mixed/rollback, redaction/cancel/withdrawal/policy, provider/dead-letter, and owner-outage rows. |
| X5-C | Complete | Added backend-neutral, refs-only command/owner telemetry for duration, context-ref count, attempts, LLM calls, cache hits, and replay; static privacy tests and both observability registries pass. |
| X5-D | Complete | Three clean isolated databases received the 17/3/1 migration streams with no drift; full suites and three consecutive joint runs pass; the disposable container was removed and port `55436` released. |
| X5-E | Complete | Dual-repo review repaired outcome-unknown handling, version normalization, telemetry composition, Outbox test isolation, source-pin coverage, and Admin actor/causation evidence. Exact revisions/hashes are locked; pilot is recommended but not enabled. |

**Pilot Enablement checkpoints（2026-07-16）：**

| Checkpoint | Status | Scope / exit evidence |
| --- | --- | --- |
| Pilot-0 | Authorized / In progress | Readiness and scope lock only: identify the pilot institution/workspace/cohort, roles and data classes; audit IIB teacher/guardian UX gaps; choose the delivery/environment shape; define observation duration, success/stop criteria, privacy ownership, and rollback evidence. No runtime or environment enablement is authorized. |
| Pilot-1 | Not authorized | Prepare the locked isolated ECS/Compose Pilot environment only after Pilot-0-E Go: publish the exact approved OCI bytes to private Alibaba ACR without rebuild, bind exact revisions/digests, provision owner-separated databases and backup/restore, and configure scoped Secrets Manager/KMS references. Private ACR is an unconditional prerequisite for the selected persistent Pilot topology, while no ACR action is authorized before Pilot-1. |
| Pilot-2 | Not authorized | Under a current `pilot2_rehearsal` authorization, enable the exact complete profile/candidate/deployment/E/current C-3/C-4-qualified environment while rows remain empty, then create one exact Workspace row last; all other Workspaces and environments stay default-off. |
| Pilot-3 | Not authorized | Under the exact rehearsal-plan authorization, rehearse response loss, same-Step reclaim, wrong-Step denial, Grant revoke/redaction, C-4 invitation/transfer cancellation, dead-letter/Admin recovery, stale opens, owner/KMS outage, credential rotation, exact-topology restore, and the complete kill switch; family-care immediate route has no `cancel_route`. Finish with capability false, rows `[]`, terminal evidence, and no reusable row. |
| Pilot-4 | Not authorized | After a fresh baseline seal, stage authorization, and row, run one uninterrupted 120-hour observation window and make only a continue-internal-observation, stop, or separately reviewed next-scope recommendation. Any rollback/restore/gate shutdown ends the window; this stage cannot authorize expansion, staging, production, or GA. |

The 2026-07-16 approval opens only Pilot-0 inside the existing T-002 task bundle. Any database apply, ACR publication, repository/environment secret configuration, capability or manifest-composition change, external pilot traffic, or Pilot-1 through Pilot-4 entry requires a new explicit approval. Pilot rollback remains capability/activation deactivation and must not rewrite committed Nurture business facts.

Pilot-0 detailed evidence and recommendations are canonical in `09-pilot-readiness.md`:

| Pilot-0 checkpoint | Status | Exit |
| --- | --- | --- |
| Pilot-0-A baseline/actual-capability audit | Complete | Exact cross-repo baseline and contract/source hashes pass; actual runtime, UX, provisioning, delivery, security, and observability gaps are classified. |
| Pilot-0-B cohort/role/surface/data lock | Complete | Revised B1/B2, B3-0/B3-1, B3-2a-d, B3-3a-d, and B3-4 are locked. The coverage contract requires complete action/surface conformance, four representative business journeys across three child scopes, Institution/Operator strands, layered fault/privacy evidence, and explicit exit gates. |
| Pilot-0-C IIB/onboarding contract | **DECISION COMPLETE / IMPLEMENTATION OPEN / EXTERNAL TRAFFIC NO-GO** | The late My-Chat Child/Family boundary adds required public C-3 source `platform_child_family_identity_source_v1`, the normative My-Chat binding -> typed Nurture anchor -> workspace association chain, durable parent-owned binding-resolution recovery, Roster-only Institution intake, three executable JI3 journeys/scopes, and separate conformance for all four binding-resolution branches. Three independent final rereviews plus the clarity repair returned `DR-P0=0 / DR-P1=0 / DR-P2=0`; six `TR-P0` and three `TR-P1` remain open, while native/external delivery `TR-P1-3a` is an accepted scope exclusion. `db22de6` is schema-only input, not adoption. C40 still requires a current qualified immutable C-3 and strict C40–C45; no implementation/adoption/schema/runtime/manifest enablement is claimed. |
| Pilot-0-D topology/operations contract | **DESIGN LOCKED / IMPLEMENTATION UNAUTHORIZED** | D-0..D-7 lock the dedicated dual-ECS/dual-RDS Pilot topology, immutable undeployed candidate recipe, ACR-at-Pilot-1 rule, KMS/secret custody, dual technical gates, RACI, incident/recovery, retention/rollback, and fresh-row 120-hour observation contract at `DR-P0=0 / DR-P1=0 / DR-P2=0`. |
| Pilot-0-E Go/No-Go review | Blocked on separately authorized C-3/C-4/D implementation | E requires one assembled immutable complete candidate, current C-3/C-4 qualification, D evidence seal, closed critical traffic blockers, and zero `QR-P0/QR-P1`; it neither deploys nor activates. Pilot-1 remains separately authorized. |

X5 acceptance matrix (each row must have deterministic evidence; adjacent single-repo tests may support but cannot replace the joint boundary where noted):

- business commit success and worker response loss;
- same-Step lease reclaim and wrong-Step replay denial;
- exact duplicate, mixed existing/new partial duplicate, and crash rollback/retry;
- grant revoke, source redaction, pre-delivery cancel, post-delivery withdrawal, and current policy change;
- owner/provider failure, Outbox retry/dead-letter, and authorized Admin technical reconciliation;
- stale notification/deep-link owner reread and owner outage fail-closed behavior;
- contract/source-pin drift and refs-only privacy boundary;
- latency, context size, retry attempts, LLM calls, and cache-hit telemetry.

X5 remains a validation and hardening gate. It does not authorize schema ownership changes, staging/production activation, pilot enablement, or rollback of committed Nurture business facts. Rollback remains capability/manifest deactivation only.

**Cross-repo task ownership：**

- My-Workflow-Base：复用 `dev-docs/active/workflow-base`，因为 X0 是既有模板合同收敛。
- My-Chat：新建 `workflow-handoff-materialization`；现有 `workflow-runtime` task 明确 scope-out concrete persistence/Prisma/DB transaction，禁止事后改写其历史范围。
- The-Nurture：继续复用本 `nurture-institution-mode` task，不拆第二个 Nurture bundle。

**Compatibility/rollback：**

- Base/My-Chat contract first uses additive optional fields plus validator warnings；只有声明 non-empty activation 时提升为 fatal capability requirement。
- Nurture直接依赖 My-Chat contract package，不直接依赖 Base template；N1 must record the adopted My-Chat contract revision/hash。
- Rollback disables host capability and Nurture non-empty manifest path；explicit-empty business facts、Execution and InteractionContext remain valid，不需要跨库回滚。

**验收：**

- 模块过 `validateWorkflowModule` + `loadWorkflowRegistry`。
- Nurture DB migration/schema context 刷新完成。
- 家园沟通闭环：家长私密会话输入 → 班级 inbox item → 老师 workflow action → 可追溯的家庭侧 receipt/response/care outcome；老师无需进入 direct family chat。

---

## Phase IIB — Historical product-delivery decomposition（superseded/delegated）

This section is retained as historical intent only. Current implementation ownership
is delegated to T-004 shared contracts, T-005 family-care interaction, T-006 boards
and publication, and T-007 institution surfaces/workflow. These steps MUST NOT be
implemented as a second product path inside T-002; T-002 supplies only the exact
owner/source prerequisites and separately governed Pilot track.

**目标：** 机构、老师、家长可用；同意/撤销/沟通工作流可演示。

**步骤：**

1. 机构管理者 web/admin：机构、班级、老师、入托、理念/流程配置。
2. 老师 mobile：班级 inbox、今日看板、快速记录、照片归属确认。
3. 家长端：加入小孩养育过程、私密沟通线程、授权/撤销、receipt 查看。
4. org/family 双向流动：daily care 回流、care day note 投递、reply/ack 状态回显。

**验收：** 手动走完"机构建组 → 老师绑定 → 家长加入孩子养育过程 → 家长发今日提醒 → 老师 inbox 处理 → 日结回流 → 家长撤销授权"全旅程。

---

## Phase III — 生态飞轮（双仓）

**目标：** 机构采用驱动在园家庭参与 Nurture 家庭生态。

**步骤：** 招生导入 → 家长加入小孩养育过程 → 授权家园沟通和照护摘要 → 老师日常工作流产生可感知价值 → 家庭生态被激活 → 归因记录。

**验收：** 一条端到端演示通过；机构/老师有直接价值；无排名、无交易、无竞争性评分。

---

## 上线前 gate / 范围外（跟踪，不阻断 IA.1）

- **同意/保留法务签核** PENDING：`ChildLinkGrant` revoke 语义 + 数据保留窗口需产品/合规签核。
- **儿童数据跨角色合规** PENDING：看护者跨组授权、家园沟通原文保留和通知摘要需合规复核。
- **医疗边界** PENDING：family_to_org 中涉及健康观察、用药、急救的内容需要安全闸和线下流程分流。
