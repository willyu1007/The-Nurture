# Architecture — Store Beta Readiness

## Candidate Composition

一个合格候选至少包含：

- Nurture source revision。
- My-Workflow-Base / My-Chat owner contract revision 或 artifact hash。
- scenario manifest 和 public module contract。
- presenter/view-model contract versions。
- DB schema/migration state。
- fixture dataset version。
- conformance suite revision 与 evidence index。

T-008 owns Service Candidate identifier/digest、canonical bundle composition、freeze、qualification 与 rollback。它消费 T-004 已发布的 interface contract identity；不会把 Candidate ID 反向写入普通业务请求或 Nurture authorization。

## Stage G5 Dependency and Evidence Flow

```text
T-004～T-007 exact handoffs + T-002 required owner/source subset
  -> G5-0 readiness/profile
  -> G5-A immutable Candidate
  -> G5-B observed Deployment Binding + local qualification
  -> G5-C exact consumer handoff
  -> G5-D iOS record | Android record
  -> G5-E Composite + Internal Beta Decision
```

G5-B/C 可部分并行，但 platform validation 同时依赖 readback-verified Binding 和 final
consumer handoff。Candidate 保持 default-off；测试环境 enablement 使用独立、限域、
可撤销的授权，Binding 只记录 observed effective gates。iOS/Android 可以并行，但
必须引用完全相同的 Candidate、interface、Binding、profile 和 suite。

Candidate-defining drift 生成新 Candidate；observed environment/config/owner-deployment
drift 生成新 Binding；单一 consumer build drift 只使对应 platform record 失效；
evidence-only defect 只重建受影响 evidence。Composite 不混合不同 shared inputs，
历史 evidence 只 append/invalidate，不原地覆盖。

## G5 to G6 Handoff Boundary

G5 的 `NurtureServiceCandidateV1`、Deployment Binding、Interface Handoff、
Composite 和 `InternalBetaDecisionV1` 是 G6-0 的版本化输入，不是
`complete_pilot_candidate_id`、Pilot-0-E decision 或 Pilot-1 authority。

如果后续 C-3/C-4/D closure 不改变 Candidate-defining inputs，G6 可以把 exact
G5 Candidate 作为完整 Pilot candidate 的 Nurture component。若 executable、
schema/migrations、manifest、interface、gate/config contract 或 owner pins
发生变化，G6 必须请求 successor Service Candidate，并按 D08-07 重跑受影响的
local/platform/composite decision；旧 G5 PASS 不能外推到新 bytes。无论哪条分支，
G5 都不授权 ACR publication、persistent Pilot deployment、capability activation
或 traffic。

G5-0 maintains a read-only Pilot carry-forward census so this decision is made before
Freeze where possible. It distinguishes:

- `g5_shared`: Nurture Candidate、interface、G5 Binding/profile/suite inputs whose
  drift requires the corresponding G5 successor/revalidation；
- `complete_pilot_only`: Host/topology/operations inputs that create a new complete
  Pilot candidate/D/E chain without automatically rerunning G5；
- `evidence_only`: unchanged inputs with replaceable affected evidence；
- `unknown`: unresolved ownership/version impact, which cannot be silently treated as
  any of the three closed classes.

The census is neither Candidate identity nor release authority. G5's
`NurtureDeploymentBindingV1` also remains distinct from the later persistent
`pilot_deployment_binding_v1`.

## Trust Boundary

The Nurture 的证据证明领域能力、权限、持久化、接口和 presenter 契约。My-Chat 的证据证明接口集成、native/web rendering、auth、device capability、build/signing 和 store distribution。My-Chat 不采用 Nurture 代码或 Candidate bundle；两侧证据通过 composite validation binding 连接，不能相互代替。

## Conformance Interface

My-Chat companion 应能：

- 启动受控 scenario consumer。
- 装载合成 fixture 或调用受控 seed contract。
- 通过公共 query/command 完成六 surface 旅程。
- 对照稳定 view-model 与错误码。
- 在缺 pin、错 pin、无 grant、撤权和离线/重试条件下验证 fail closed / recovery。

不得：

- 直连 Nurture DB。
- import Nurture ORM。
- 从 PII 生成 canonical identity。
- 用 mock 成功代替 Nurture receipt。

## Compatibility Matrix

矩阵至少记录：

- Nurture Service Candidate ↔ Base/My-Chat owner contract dependencies。
- Nurture Service Candidate ↔ interface contract version/digest。
- My-Chat backend/app build ↔ interface contract version/digest。
- iOS build/version ↔ test environment/Nurture Service Candidate binding。
- Android build/version ↔ test environment/Nurture Service Candidate binding。
- fixture/evidence revision ↔ Nurture Service Candidate。

## Rollback Boundary

- Nurture：保持 gate off、回退/部署前一个兼容且重新验证的 Service Candidate，或发布
  修复候选；回滚部署必须生成新的 observed Binding 并完整重跑 local/双平台/Composite/
  Decision，不能直接复用旧 PASS。
- My-Chat：回退到与前一个服务候选兼容的 backend/app build，停止分发或撤回测试 build。
- 数据库：只有单独批准的 repo-SSOT migration 才能 apply；不得以 beta 紧迫性跳过。

## Completion Semantics

T-008 完成表示“一组精确的 My-Chat build、Nurture Service Candidate、interface contract digest 与测试环境绑定已通过本地 qualification 和双平台内部真机验证”，不表示 external beta、生产上架或 Pilot 流量获准。
