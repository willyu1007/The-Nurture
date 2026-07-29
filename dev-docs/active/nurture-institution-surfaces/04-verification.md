# Verification — 机构端双 Surface

## Planning Baseline

| Date | Check | Result |
| --- | --- | --- |
| 2026-07-29 | Institution mobile fixed as read-only | PASS |
| 2026-07-29 | Family-private body excluded from aggregates | PASS |
| 2026-07-29 | Open product questions kept explicit | PASS |
| 2026-07-29 | InstitutionWorkflow limited to institution management | PASS |
| 2026-07-29 | Web operation and mobile read-only Workflow projection boundary locked | PASS |
| 2026-07-29 | Context strict verification plus project governance sync/lint after terminology consolidation | PASS |

## Planned Verification

- Institution/group/enrollment/grant policy tests.
- Aggregate privacy, small-sample and revoke/redaction tests.
- Presenter snapshots for mobile and Web.
- Roster/invite/confirmation/grant state-machine tests.
- Cross-institution, cross-group and wrong-child negative tests.
- Black-box six-role fixture segment through public contracts.
- Anti-ranking and non-diagnostic content review.
- Cross-surface projection-version/state/milestone consistency tests.
- Same-role negative tests for wrong Workspace/Institution/scope/assignment.
- Negative tests for raw Run/Step/token/internal-note leakage and mobile mutation.

## Required Evidence

测试必须说明 actor、grant、child/group scope、fixture version 与 source pin。不得用匿名化不足的真实数据验证 aggregate。
