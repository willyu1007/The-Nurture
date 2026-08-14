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
| 2026-07-30 | T-005 Candidate prerequisite fixed to Stage G2 A/B/C, legacy single-writer cutover and formal-ingress qualification | PASS |
| 2026-07-30 | G2-A/task status/placeholder capability rejected as Candidate Freeze evidence | PASS |
| 2026-07-30 | T-006 Candidate prerequisite fixed to Stage G3-A～E with deterministic/manual required lanes and exact G2-C/T-007 subset integration | PASS |
| 2026-07-30 | AI copy, face match and Workflow board module allowed as optional only with explicit profile exclusion and qualified fallback | PASS |
| 2026-07-30 | Stage G5 overall goal and G5-0/A/B/C/D/E delivery structure aligned with D08-01～D08-07 | PASS |
| 2026-07-30 | G5-A serial Freeze, G5-B/C partial parallelism, dual-platform parallel validation and G5-E final join accepted | PASS |
| 2026-07-30 | Internal-test enablement separated from Candidate/Binding and T-002 traffic gates separated from Freeze Readiness | PASS |
| 2026-07-30 | Rollback fixed to new observed Binding plus full local/dual-platform/composite revalidation | PASS |
| 2026-07-30 | G5→G6 handoff keeps Service Candidate as an exact component input; Candidate-defining G6 drift requires successor Candidate and affected G5 revalidation | PASS |
| 2026-07-31 | G5-0 Pilot carry-forward census separates G5-shared, complete-Pilot-only, evidence-only and unknown inputs without authorizing G6 | PASS |
| 2026-07-31 | Only G5-shared drift reruns affected local/platform/composite evidence; Host/topology/operations-only drift stays in the complete-Pilot lifecycle | PASS |

## Task-package Validation

| Date | Command | Result |
| --- | --- | --- |
| 2026-07-29 | `node .ai/scripts/ctl-project-governance.mjs sync --apply --project main` | PASS; regenerated dashboard, feature map and task index |
| 2026-07-29 | `node .ai/scripts/ctl-project-governance.mjs lint --check --project main` | PASS |
| 2026-07-29 | `node .ai/skills/features/context-awareness/scripts/ctl-context.mjs verify --strict` | PASS |
| 2026-07-29 | `git diff --check` | PASS |
| 2026-07-29 | Service Candidate/interface/composite-binding documentation and project-view recheck using the three commands above | PASS |
| 2026-07-30 | Cross-task G2 Exit dependency review across T-005/T-006/T-008 and project hub | PASS |
| 2026-07-30 | `node .ai/scripts/lint-docs.mjs --path dev-docs/active/nurture-store-beta-readiness --check-anchors` | PASS; no errors, two pre-existing vague-reference warnings |
| 2026-07-30 | Cross-task Stage G3 Exit dependency review across T-005/T-006/T-007/T-008 and project hub | PASS |
| 2026-07-30 | Stage G5 structure sync: governance lint/sync, project-state verify, task-doc anchor lint, strict context verify and `git diff --check` | PASS |
| 2026-07-30 | Stage G6 boundary sync: G5 Service Candidate/complete-Pilot identity separation, governance sync/lint, T-002/T-008 doc lint, strict context verification and `git diff --check` | PASS; doc lint has 0 errors and only non-blocking vague-reference warnings |
| 2026-07-31 | Detailed G6 scope/order/acceptance and G5 carry-forward sync: governance apply/lint, T-002/T-008 doc lint, strict context verify, semantic scan and `git diff --check` | PASS; T-002 0 errors/21 warnings, T-008 0 errors/2 warnings |
| 2026-08-01 | W0 Beta Profile v0 freeze: `nurture.six-surface-beta-profile@0.1.0`, governance apply/lint, strict context verify, scoped docs/anchor lint and `git diff --check` | PASS; required/optional paths are explicit, 9 files checked with 0 errors/0 warnings, and no Candidate/runtime/environment/traffic effect occurred |
| 2026-08-14 | G5 shared-input source closure census after T-011 W4 | PASS; W2/W3/W3.1/W4 are classified, W4 remains read-only/default-off, final green sources are My-Chat `e0e5e937cb16b6b49e918656a4af214ddea41a48` and Nurture W4 `d5df447ff0ab33911396531e47775364e62b0e4f`, and Candidate Freeze was not run |

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
