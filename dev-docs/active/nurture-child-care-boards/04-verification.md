# Verification — 儿童照护双看板

## Planning Baseline

| Date | Check | Result |
| --- | --- | --- |
| 2026-07-29 | Shared-fact / role-projection model selected | PASS |
| 2026-07-29 | Two-stage publish retained | PASS |
| 2026-07-29 | Ranking and diagnostic behavior excluded | PASS |
| 2026-07-29 | PublishProcess separated from InstitutionWorkflow | PASS |
| 2026-07-29 | Board workflow projection is role-safe and non-owning | PASS |
| 2026-07-29 | Context strict verification plus project governance sync/lint after terminology consolidation | PASS |
| 2026-07-29 | Teacher board aligned to exact-CareGroup shared responsibility without acknowledge-time personal claim | PASS |
| 2026-07-29 | Teacher board aligned to CareGroup-owned multi-reply append stream and first-reply-only Attention resolution | PASS |
| 2026-07-29 | D-01 shared canonical facts/module semantics/projection pipeline with role-specific query and presenter boundary | PASS |
| 2026-07-29 | D-01 board retained as an operable low-interruption surface without making derived snapshots a write authority | PASS |
| 2026-07-29 | D-02 PublishProcess limited to the caregiver-side family-release boundary from explicit candidate to publish/cancel | PASS |
| 2026-07-29 | D-02 raw capture, CareInteraction, ActionDelivery, InstitutionWorkflow and AI-provider ownership excluded | PASS |

## Planned Verification

- Domain and policy unit tests.
- Repository transaction, concurrency and idempotency tests.
- Presenter snapshots for both roles.
- Wrong-child, revoked-grant and cross-family leakage tests.
- AI provider failure / malformed suggestion tests.
- Media attribution and correction tests.
- Full capture → review → publish → guardian reread black-box journey.
- Projection tests proving same-role visibility still requires Workspace/scope/policy.
- Negative tests proving board projections expose no raw Run/Step/internal note and cannot be mutated directly.
- Same-CareGroup alternate-caregiver reply and cross-CareGroup denial tests after acknowledgement.
- Concurrent distinct-reply ordering, same-command replay and no-duplicate-Attention tests.
- Inline adjustment tests proving display preferences, PublishProcess drafts and canonical
  fact mutations use their declared owners and invalidate/re-read the board projection.
- Negative tests proving direct snapshot/cache patching cannot create a business fact,
  Receipt, authority result or ActionDelivery.
- Negative tests proving capture/upload success or an AI suggestion cannot by itself create
  a Guardian-visible publication or Receipt.
- Boundary tests proving published means Nurture fact/Receipt commit rather than Host
  notification, provider or device delivery.

## Required Evidence

证据必须绑定精确 source pin 与 fixture version，并包含失败路径。UI mock、静态截图或数据库直查不能替代发布回执和权限验证。
