# Overview — Store Beta Readiness

## Status

- State: planned
- Task: T-008
- Milestone / Feature: M-002 / F-003
- Updated: 2026-08-01
- Next step: Beta Profile v0 已冻结为
  `nurture.six-surface-beta-profile@0.1.0`（见
  [`06-beta-profile-v0.md`](./06-beta-profile-v0.md)）。上游按该 profile 实施；
  G5-0 仅在 T-004～T-007 exact handoff 就绪后确认/终版化 profile 并展开
  pre-candidate inventory，不提前分配 Candidate identity。

## Goal

在 T-004 至 T-007 完成后，冻结并验证一个独立部署的 Nurture 六 surface Service Candidate，提供 conformance suite、接口兼容性矩阵、integration checklist、默认关闭/回滚证据，并协调 My-Chat companion 通过认证接口完成 TestFlight Internal 与 Google Play Internal 真机验证。

## Stage G5 Delivery Structure — Accepted

G5 复用 T-008，把 T-004～T-007 的精确 handoff 组成一个不可变、可独立部署但
capability-default-off 的 Nurture Service Candidate，并将 observed Deployment
Binding、Nurture local qualification、My-Chat iOS/Android internal-store real-device
evidence 组合成可审计的 Internal Beta Decision。

交付结构固定为：

- **G5-0 Readiness Inventory & Beta Profile**；
- **G5-A Service Candidate Freeze**；
- **G5-B Deployment Binding & Local Qualification**；
- **G5-C Interface Handoff & Consumer Readiness**；
- **G5-D Dual-platform Internal Validation**；
- **G5-E Composite Decision & Evidence Lifecycle**。

G5-A 是严格串行 Freeze gate；A 后 B/C 可部分并行，C 的最终 handoff 引用 B 的
readback-verified Binding；D 的 iOS/Android 记录基于同一 shared inputs 并行执行；
E 只组合同一 Candidate/interface/Binding/profile/suite 的 local+iOS+Android evidence。
D08-07 defect routing/invalidation/rollback 是 A～E 的横切规则，不建立新运行时控制
系统。G5 只证明 internal beta 精确组合，不授权 external beta、production 或 traffic。

## Scope In

- 精确 source revision / dependency pin / contract version freeze。
- Service Candidate identity/digest、bundle freeze 和 rollback evidence；消费 T-004 interface contract identity。
- manifest、module、public API、presenters、fixtures、DB/migration compatibility 的资格检查。
- 六 surface 全旅程与权限/隐私负例。
- Workflow terminology conformance：`InstitutionWorkflow`、projection、ActionExecution、
  ActionDelivery、CareInteraction 与 PublishProcess 不漂移。
- immutable candidate evidence index。
- My-Chat interface integration checklist、consumer conformance 和 composite validation/回滚说明。
- 外部 companion 任务的输入/输出与验收定义。

## Scope Out

- My-Chat app 代码、auth、native/web shell、EAS/signing 或 store credentials。
- 在 The Nurture 仓库直接创建 App Store / Play Console 构建。
- TestFlight External、Play Closed/Open、生产发布或真实流量授权。
- 未经单独批准的 production migration / capability activation。

## Dependencies and Gates

- T-004、T-005、T-006、T-007 全部达到各自 exit gate。
- T-005 Stage G2-A/B/C 与 single-writer legacy cutover 通过 formal-ingress G2 Exit
  Qualification；G2-A/Increment 1 或占位 G2-C 不能代替。
- T-006 Stage G3-A～E 全部通过并形成 exact Beta Profile Handoff；其中
  deterministic G3-B1、manual G3-C1、G3-D release 与 G3-E G2-C/policy-owner
  integration 是 required，AI copy/face match/Workflow board module 按 profile
  明确 optional 或 required。
- T-004 已发布可重复验证的 interface contract identity/version/digest 与 compatibility rules。
- T-002 中 Candidate 实际消费的 source qualification、identity、authority、Receipt、
  revoke/concurrency/privacy subset；production/external traffic gates 保持独立，
  不作为 Candidate Freeze 前置。
- My-Chat companion 只通过版本化认证接口连接测试环境中部署的精确 Nurture Service Candidate，不采用 Nurture 代码或 bundle。

## Acceptance Criteria

- [ ] 候选 revision、依赖 pins、manifest/API/presenter/fixture 版本唯一且不可变。
- [ ] 六 surface 主旅程、权限负例、revoke/correction/replay 和 fail-closed 检查通过。
- [ ] DB/migration 状态可重复验证，且没有未经授权的生产 apply。
- [ ] interface handoff 使 My-Chat 无需导入 Nurture 代码、读取 ORM/DB 或下载 Candidate bundle 即可接入。
- [ ] capability 默认关闭且有明确回滚路径。
- [ ] My-Chat companion 的双平台内部测试结果被准确引用，不冒充本仓库自身分发能力。
- [ ] Web Workflow 操作与 board projection 在同一 contract/version 上通过；family-care
  action、delivery 和 PublishProcess 未被误分类为 Workflow。

## Next Step

维护 Beta Profile v0 的显式 drift ledger；等待 T-005 G2、T-006 G3、T-007 G4
exact handoff 后进入 G5-0 Readiness。上游 handoff 未通过前不分配正式 Candidate
identity，也不实现无必要的 release-control runtime。
