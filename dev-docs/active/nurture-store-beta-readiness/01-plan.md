# Plan — Store Beta Readiness

## Phase 0 — Readiness Inventory

- 汇总 T-004 至 T-007 的 contract versions、fixtures、测试结果和已知限制。
- 对齐 T-002 的最新 source qualification 与 traffic gate。
- 建立候选输入清单，任何漂移都阻止 freeze。

## Phase 1 — Candidate Freeze

- 固定 Nurture revision、Base/My-Chat owner contract pins、manifest/API/presenter/fixture versions。
- 基于 T-004 interface contract identity 生成 Nurture-owned 不可变 Service Candidate identifier、digest 和 evidence index。
- 确认 capability gates default-off。

## Phase 2 — Local Qualification

- 运行 lint/type/unit/integration/DB/context checks。
- 运行 public-contract conformance 与六 surface 黑盒旅程。
- 运行 authorization、privacy、idempotency、concurrency、revoke 和 replay 负例。

## Phase 3 — Interface Handoff

- 产出 My-Chat consumer compatibility matrix。
- 产出逐 surface integration checklist、fixture、expected result 和 rollback。
- 明确 companion 只通过精确 contract version/digest 调用已部署的 Nurture Service Candidate，不导入 Candidate bundle。
- 定义 composite validation binding 所需的 Candidate、contract、My-Chat build 和 environment refs。

## Phase 4 — Companion Coordination

- 将 interface handoff 与测试环境的 Service Candidate binding 交给 `my-chat-nurture-store-beta-validation`。
- 接收 consumer conformance、build identity、contract digest、environment binding 和设备验证结果。
- 若 My-Chat 发现 contract defect，回到对应 T-004 至 T-007 修复并重新 freeze。

## Phase 5 — Internal Beta Decision

- 汇总 TestFlight Internal / Play Internal 安装与旅程结果。
- 记录 PASS、带限制 PASS 或 NO-GO。
- 保持 external beta / production 为独立后续 gate。

## Exit Gate

只有 Nurture 本地 qualification 与 My-Chat 双平台内部真机结果共同形成精确 composite validation binding 时，T-008 才可完成。
