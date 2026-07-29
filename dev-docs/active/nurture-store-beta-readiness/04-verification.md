# Verification — Store Beta Readiness

## Planning Baseline

| Date | Check | Result |
| --- | --- | --- |
| 2026-07-29 | Current-repo delivery separated from My-Chat store distribution | PASS |
| 2026-07-29 | Stage target fixed to TestFlight Internal + Play Internal | PASS |
| 2026-07-29 | T-002/Pilot external-traffic gates retained | PASS |
| 2026-07-29 | My-Chat/Nurture authenticated interface-call boundary retained; no Nurture code/bundle adoption | PASS |
| 2026-07-29 | Nurture Service Candidate identity separated from interface contract compatibility | PASS |
| 2026-07-29 | Composite validation binding defined across builds, service candidate, contract and environment | PASS |
| 2026-07-29 | T-008 owns Service Candidate identity; T-004 identity format dependency excluded | PASS |

## Task-package Validation

| Date | Command | Result |
| --- | --- | --- |
| 2026-07-29 | `node .ai/scripts/ctl-project-governance.mjs sync --apply --project main` | PASS; regenerated dashboard, feature map and task index |
| 2026-07-29 | `node .ai/scripts/ctl-project-governance.mjs lint --check --project main` | PASS |
| 2026-07-29 | `node .ai/skills/features/context-awareness/scripts/ctl-context.mjs verify --strict` | PASS |
| 2026-07-29 | `git diff --check` | PASS |
| 2026-07-29 | Service Candidate/interface/composite-binding documentation and project-view recheck using the three commands above | PASS |

## Candidate Verification (planned)

- Governance/context/manifest lint.
- Typecheck, unit, integration and DB schema/migration checks.
- Public API/presenter conformance.
- Product terminology conformance：园区管理过程使用 `InstitutionWorkflow` /
  `InstitutionWorkflowProjection`；家庭操作、投递、交流与发布分别使用
  `ActionExecution`、`ActionDelivery`、`CareInteraction`、`PublishProcess`。
- Fixture determinism.
- Six-surface black-box journey.
- Authorization/privacy/concurrency/idempotency/revoke/replay negative suite.
- Exact pin and checksum reproducibility.

## My-Chat Companion Verification (external, planned)

- Consumer conformance against exact interface contract and deployed Nurture Service Candidate.
- My-Chat companion 不把 Handoff/Outbox/retry 或家庭 action 重新包装为产品 Workflow。
- iOS TestFlight Internal install and six-surface journey on real devices.
- Android Play Internal install and six-surface journey on real devices.
- Auth/session recovery, network retry, notification/media where applicable.
- My-Chat build/Nurture Candidate/contract digest/environment/fixture/device matrix recorded without store secrets.

## Completion Evidence

完成记录必须同时引用 Nurture 本地 qualification 与 My-Chat companion 的精确构建/设备结果，并形成 composite validation binding。若 Service Candidate、contract digest、My-Chat build 或 test environment 任一不一致，结果无效。
