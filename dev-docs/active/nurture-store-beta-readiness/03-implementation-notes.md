# Implementation Notes — Store Beta Readiness

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
