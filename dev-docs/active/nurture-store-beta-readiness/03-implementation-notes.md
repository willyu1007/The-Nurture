# Implementation Notes — Store Beta Readiness

## 2026-08-05 — Upstream readiness ledger advanced without starting T-008

- T-005 G2 and T-006 G3 now have exact qualified handoffs; T-004 was already done.
- T-007's narrow publication-policy dependency is qualified, but its complete G4 Exit
  remains pending, so G5-0 and Candidate identity stay closed.
- This update changes only the readiness ledger. T-008 implementation, Candidate
  Freeze, build, deployment, activation, internal-store work and Pilot were not started.

## 2026-07-29 — Task package and roadmap created

- 创建 T-008 规划包、总体 requirement 和 roadmap。
- 将本仓库终点锁定为可独立部署、精确识别且 default-off 的 Nurture Service Candidate。
- 将 TestFlight/Google Play 构建和真机分发明确归属 My-Chat companion。
- 本轮渠道锁定为 TestFlight Internal 与 Google Play Internal Testing。
- 当前无候选 freeze、构建、分发或代码变更。

## 2026-07-29 — Service/API boundary corrected

- 用户确认 My-Chat 与 Nurture 是认证接口调用关系，不采用 Nurture 代码或 Candidate bundle。
- Nurture Candidate 被明确为 Nurture-owned Service Candidate，用于独立发布、资格化、部署和回滚。
- My-Chat companion 消费 versioned interface contract，并对测试环境中部署的精确 Service Candidate 运行 consumer/真机验证。
- 完成证据改为 composite validation binding：My-Chat app/backend build + Nurture Service Candidate + interface contract digest + test environment。
- 本次只修正规划与 handoff 文档，无代码、配置、schema、数据库、部署或商店构建变更。
- 当前任务包和治理视图仍在未提交 worktree 中，不能描述为 landed implementation。

## External Companion

- Proposed slug: `my-chat-nurture-store-beta-validation`
- Location: My-Chat repository（本仓库不创建）
- Trigger: T-008 Service Candidate deployed in a test environment with interface handoff ready

## Open Items

- 最终 candidate identifier/checksum 格式。
- interface contract identity 与 composite validation binding 格式。
- My-Chat consumer conformance 的可调用入口。
- 双平台最小设备/OS 矩阵。
- 商店内部测试证据如何回链到当前任务而不复制敏感资料。

## 2026-08-14 — Pre-Freeze shared-input fact closure

- G5-0 remains complete and G5-A remains a separate, not-yet-executed gate.
- T-011 W2, W3/W3.1 and W4 now form the closed source-side shared-input set for
  this reconciliation. W4 is the read-only director presenter; it contributes
  no Mobile command, deployment, activation or device claim.
- Final green source revisions are My-Chat
  `e0e5e937cb16b6b49e918656a4af214ddea41a48` and Nurture W4
  `d5df447ff0ab33911396531e47775364e62b0e4f`; the exact W2/W3/W4 identities
  are recorded in the readiness inventory. T-002 resealed the exact pin at
  `a9e1be9054e5a42e0e985bf491da13c1228b77c9` and committed the current C30
  lock at `035d009b7a5501081f13b2d173242b1d18020e92`. Candidate Freeze starts
  only after this completed reconciliation and separate authorization.

## 2026-07-30 — Stage G5 delivery structure accepted

- G5 复用 T-008，交付结构固定为 G5-0 Readiness/Profile、G5-A Candidate Freeze、
  G5-B Deployment/Local Qualification、G5-C Interface Handoff、G5-D Dual-platform
  Internal Validation 和 G5-E Composite Decision/Evidence Lifecycle。
- 审查确认该结构与 D08-01～D08-07 一致，不重开 Candidate、Binding、consumer、
  composite、verdict 或 rollback 顶层决策。
- G5-A 是严格串行门；B/C 可部分并行；D 的 iOS/Android exact shared-input records
  并行；E 最终汇合。G5 tooling just-in-time，不阻塞 T-004～T-007。
- 明确 internal-test enablement 是独立 gate，Binding 只记录 observed state；T-002
  production/external traffic gate 不作为 Freeze 前置。
- 回滚部署必须生成新 Binding 并完整重验，不能复用旧 PASS。当前仍无 Candidate、
  deployment、schema/database、secret、store build、activation 或 traffic 变更。
- 下一步展开 G5-0 Freeze Readiness inputs、beta profile 和 pre-candidate inventory。

## 2026-07-31 — Beta Profile v0 early freeze accepted

- 用户确认 beta profile 的首个版本化草案提前到 G1 Joint Conformance 前后、
  G2 实施开始之前冻结，不等待 G5-0；所有权保持在 T-008。
- 动机：profile 判定被上游大量消费——T-006 G3-B2/C2 与 G3-A Workflow board
  module 的 required/optional、T-002 必须资格化的 owner/source subset 都取决于
  它；晚定义的失败模式是 G5-0 时发现 required 缺口返工回 G3/G4，或上游为保险
  过度实现 optional 能力。v0 同时是裁剪关键路径的工具：把大块机构侧能力标为
  optional-absent 可显著缩小 required 面并提前 Freeze。
- 决策落点：`01-plan.md` 新增 Beta Profile v0 Early Freeze 小节（v0 两部分内容、
  versioned drift 修订规则、G5-0 职责改为确认/终版化）；`00-overview.md`
  Next step 同步。
- required 面的逐项裁剪（Enrollment Journey、Knowledge/RAG 等）留待 v0 起草时
  决定。本次只更新规划文档，无代码、配置、schema、数据库或部署变更。

## 2026-08-01 — Beta Profile v0 frozen

- Added `06-beta-profile-v0.md` with planning identity
  `nurture.six-surface-beta-profile@0.1.0`.
- Required paths are the six surface core, T-005 G2-A/B/C, T-006 deterministic
  capture/manual attribution/publish/integration, and T-007 authority/mobile/Web/
  Enrollment Journey/source-cited RAG/qualification.
- AI copy, class-scoped face matching, the T-006 Workflow board module, AI
  attention, bulk roster/invite and unapproved family-share are explicitly
  optional-absent/default-off with qualified manual or empty-state fallbacks.
- This is a versioned planning input only. No Candidate, schema/migration,
  database, secret, deployment, store build, activation or traffic effect was
  created.
