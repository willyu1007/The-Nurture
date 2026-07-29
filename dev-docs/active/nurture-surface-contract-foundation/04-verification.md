# Verification — 六个核心 Surface 的产品契约基座

## Planning Baseline

| Date | Check | Result |
| --- | --- | --- |
| 2026-07-29 | Scope respects My-Chat / Nurture ownership boundary | PASS |
| 2026-07-29 | T-003 design input referenced without claiming product or implementation authority | PASS |
| 2026-07-29 | T-002 authorization and qualification gates retained | PASS |
| 2026-07-29 | Engine-ready scope confirmed; shared engine excluded from critical path | PASS |
| 2026-07-29 | Capability-first query/command and surface-first presenter split confirmed | PASS |
| 2026-07-29 | LLM selection remains advisory behind deterministic eligibility/execution checks | PASS |
| 2026-07-29 | Nurture-first semantic contract and later My-Chat adaptation confirmed | PASS |
| 2026-07-29 | Atomic envelope plus Conversation/Board/Workbench content families confirmed | PASS |
| 2026-07-29 | Generic server-driven UI and LLM-generated component trees excluded | PASS |
| 2026-07-29 | Five product Journeys plus one resilience Journey confirmed as baseline | PASS |
| 2026-07-29 | Shared versioned world with isolated per-Journey initial state confirmed | PASS |
| 2026-07-29 | Single mutable sequential golden script rejected | PASS |
| 2026-07-29 | Bound identity baseline and product-visible provisional exclusion confirmed | PASS |
| 2026-07-29 | Multiple isolated Institution Enrollments per ChildCareProcess confirmed | PASS |
| 2026-07-29 | Institution GrantRequest separated from Guardian-owned Grant | PASS |
| 2026-07-29 | Guardian Chat synthesis separated from Board-targeted multi-Institution writes | PASS |
| 2026-07-29 | Single-Institution Pilot simplification kept deterministic and non-normative | PASS |
| 2026-07-29 | Contract-first T-002 parallelism with explicit owner-integration and activation fences confirmed | PASS |
| 2026-07-29 | Synthetic owner fixtures prohibited from runtime fallback, migration and activation evidence | PASS |
| 2026-07-29 | T-004 synthetic contract qualification kept distinct from real owner-path qualification | PASS |
| 2026-07-29 | My-Chat immutable single-Candidate adoption unit | SUPERSEDED — My-Chat consumes versioned interfaces; Candidate is Nurture-owned service release identity |
| 2026-07-29 | Independent child contract versions retained for compatibility but excluded as consumer-selectable pins | PASS |
| 2026-07-29 | Exact Service Candidate/contract identities kept separate from qualification, activation and traffic authority | PASS |
| 2026-07-29 | My-Chat/Nurture interface-call boundary and no code/bundle adoption confirmed | PASS |
| 2026-07-29 | Composite validation binding across My-Chat build, Nurture Candidate, contract digest and environment confirmed | PASS |
| 2026-07-29 | T-004 interface identity ownership separated from T-008 Service Candidate identity | PASS |
| 2026-07-29 | Composite validation binding assigned to T-008 + My-Chat companion and excluded from runtime authority | PASS |
| 2026-07-29 | Service Candidate identifier format confirmed non-blocking for T-004 through T-007 | PASS |
| 2026-07-29 | InstitutionWorkflow/Projection separated from ActionExecution/Delivery/CareInteraction/PublishProcess | PASS |
| 2026-07-29 | Golden journey aligned to exact-CareGroup shared responsibility; acknowledge does not create a personal claim | PASS |
| 2026-07-29 | Golden journey aligned to CareGroup-owned multi-reply append and first-reply-only Attention resolution | PASS |
| 2026-07-29 | Business typed input separated from target/concurrency/idempotency metadata; prepare-time precondition binding locked | PASS |
| 2026-07-29 | Exact-state versus append-compatible concurrency classes separated; T-005 reply classified append-compatible | PASS |
| 2026-07-29 | Board Workflow projection kept read-only/non-owning and authority-filtered | PASS |

## Implementation Verification (planned)

- Context and manifest validation.
- Typecheck and unit tests for public contracts and policies.
- Black-box contract tests through public module/API boundaries.
- Fixture determinism and snapshot checks.
- Negative authorization, private-data leakage and fail-closed tests.
- Descriptor operation-class tests and negative “async implies Workflow” classification cases.
- Projection schema tests excluding raw Run/Step/token/internal runtime state.
- Exact-state stale-intent tests proving execute cannot adopt a newer work-state version.
- Append-compatible tests proving another legal append does not invalidate confirmation while
  lifecycle/authority drift still fails closed.
- Contract tests proving concurrency precondition and idempotency identity remain independent.

## Documentation Verification

| Date | Command | Result |
| --- | --- | --- |
| 2026-07-29 | `node .ai/scripts/ctl-project-governance.mjs sync --apply --project main` | PASS |
| 2026-07-29 | `node .ai/scripts/ctl-project-governance.mjs lint --check --project main` | PASS |
| 2026-07-29 | `node .ai/skills/features/context-awareness/scripts/ctl-context.mjs verify --strict` | PASS |
| 2026-07-29 | `git diff --check` | PASS |
| 2026-07-29 | Identity/multi-Institution/GrantRequest/Chat-Board documentation recheck using the three commands above | PASS |
| 2026-07-29 | T-002 parallelism/owner-integration/activation-fence documentation recheck using the three commands above | PASS |
| 2026-07-29 | Immutable Candidate adoption-unit documentation recheck using the three commands above | HISTORICAL PASS — content later superseded by Service/API correction |
| 2026-07-29 | Service/API boundary correction documentation recheck using the three commands above | PASS |
| 2026-07-29 | Interface/Service Candidate/composite identity ownership-split documentation recheck using the three commands above | PASS |
| 2026-07-29 | Workflow/Action/Delivery/Interaction/Publish/Projection terminology SSOT and affected task-package recheck | PASS |

## Evidence Policy

每次运行需记录命令、精确 source revision、结果和失败原因。只接受通过公共契约获得的黑盒证据；直接读取数据库不能作为 consumer 验收证据。
