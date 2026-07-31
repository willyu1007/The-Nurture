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
| 2026-07-29 | Full T-004 contract reread against product/workflow context, manifest/module and T-005 | PASS |
| 2026-07-29 | Domain/execution/delivery descriptor axes replace the ambiguous single operation-class enum | PASS |
| 2026-07-29 | CapabilityDescriptorV1 and SurfaceEnvelopeV1 minimum fields are explicit and testable | PASS |
| 2026-07-29 | InterfaceContractRefV1 wire placement, canonicalization, exact digest admission and no-latest rule are explicit | PASS |
| 2026-07-29 | Head bindings distinguish strict equality, predicate validity, compatible append and convergent postcondition | PASS |
| 2026-07-29 | Cross-boundary mutation acceptance no longer promises that every action is reversible | PASS |
| 2026-07-29 | Caregiver teacher board covers family-care work plus a separate PublishProcess | PASS |
| 2026-07-30 | T-007 D-04 Admin institution-business communication read separated from CareGroup action authority | PASS |
| 2026-07-30 | Protected Admin read classified as additive versioned contract; current source remains default-off | PASS |

## Implementation Verification (planned)

- Context and manifest validation.
- Typecheck and unit tests for public contracts and policies.
- Black-box contract tests through public module/API boundaries.
- Fixture determinism and snapshot checks.
- Negative authorization, private-data leakage and fail-closed tests.
- Descriptor operation-class tests and negative “async implies Workflow” classification cases.
- Descriptor schema tests for required domain/execution/delivery axes, typed schema refs,
  target/confirmation/concurrency policies, handler/presenter parity and dependency gates.
- Contract identity determinism tests: repeated build yields the same digest; duplicate/unknown
  keys, unordered registry input, missing artifact, changed semantic order and digest mismatch fail.
- Provenance-separation tests proving source revision/build time/environment do not perturb the
  semantic digest when canonical artifacts are identical, while any artifact content change does.
- Exact admission tests proving no version range, mutable latest, silent digest negotiation or
  cross-artifact floating combination.
- Surface envelope tests for one-snapshot required content, actor-safe context, typed union
  closure, dependency NO-GO and absence of arbitrary UI props.
- Cursor tests for contract/actor/scope/query/sort/snapshot/expiry binding and explicit
  refresh/rebase on drift.
- Projection schema tests excluding raw Run/Step/token/internal runtime state.
- Exact-state stale-intent tests proving execute cannot adopt a newer work-state version.
- Exact-state convergence tests proving only a declared already-satisfied postcondition can
  converge across version drift.
- Append-compatible tests proving another legal append does not invalidate confirmation while
  lifecycle/authority drift still fails closed.
- Contract tests proving concurrency precondition and idempotency identity remain independent.
- Protected-input tests proving low-entropy body integrity uses a keyed tag and no bare body hash
  enters confirmation, logs, telemetry, Receipt or presenter output.
- Institution Admin business-communication read tests for channel disclosure, exact
  Institution/Enrollment/CareGroup/original Grant/data class/direction/purpose, current source
  lifecycle, cross-Institution denial and no family-private AI/draft/private-chat leakage.
- Capability-separation tests proving Admin body read never exposes CareGroup
  acknowledge/reply/correction/redaction and does not create a shared transcript.
- Contract identity tests proving addition of the protected Admin projection changes the exact
  interface version/digest and cannot activate against the current display-safe-only manifest.

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
| 2026-07-29 | Full contract-coherence revision: governance sync/lint, strict context verification, relative-link/heading checks and `git diff --check` | PASS |
| 2026-07-30 | T-007 D-04 protected Institution Admin read addendum: governance lint, strict context verification and `git diff --check` | PASS |

## Phase 0 Verification — 2026-07-31

| Check | Result | Evidence |
| --- | --- | --- |
| T-004 recovery and clean baseline | PASS | Explicit `resume --task T-004 --json` resolved T-004 at `13efdb4`; initial worktree was clean and governance lint passed. |
| Registered context census | PASS | Context registry was read first; workflow/product/DB/API artifacts were then inspected according to `docs/context/AGENTS.md`. |
| Current implementation census | PASS | Manifest/module, 13-handler registry, policies, presenters, internal API handlers, repository ports, generated DB context, tests and Fastify dev-host boundaries were mapped in `06-phase-0-discovery-and-gate-matrix.md`. |
| Six-surface authority mapping | PASS | Every surface has a current reusable input, missing contract, downstream owner and safe unavailable/default-off behavior. |
| Synthetic/real-owner separation | PASS | `defaultNurtureDeps` and in-memory ports are classified `CONTRACT_PARALLEL`; formal NestJS ingress plus exact T-002 handoff is required for `OWNER_INTEGRATION`. |
| `node .ai/skills/features/context-awareness/scripts/ctl-context.mjs verify --repo-root . --strict` | PASS | Registered context checksums and built-in schema validation pass. |
| `node scripts/assert-test-routing.mjs` | PASS | 36 files: 21 unit, 5 production DB, 9 dev-host and 1 X5 joint. |
| `node scripts/assert-persistence-boundaries.mjs` | PASS | Scenario business layer and production/dev-host persistence boundaries remain isolated. |
| `node scripts/assert-n1-schema-contract.mjs` | PASS | N1 contract reports 21 tables, 7 partial-unique constraints and 7 checks. |
| `pnpm verify:workflow-contract-pin` | EXPECTED OWNER-GATE NO-GO | Expected My-Chat `f00b868`; actual sibling checkout `e1a5cdd`. No pin or sibling checkout was changed. |
| `node .ai/scripts/ctl-project-governance.mjs sync --apply --project main --changelog` | PASS | Registry, task index, dashboard, feature map and changelog now agree that T-004 is `in-progress`. |
| `node .ai/scripts/lint-docs.mjs --path dev-docs/active/nurture-surface-contract-foundation --strict --check-anchors` | PASS | 7 task files checked with 0 errors and 0 warnings. |
| `node .ai/scripts/ctl-project-governance.mjs lint --check --project main` | PASS | Project governance artifacts are internally consistent after sync. |
| `node .ai/scripts/ctl-project-governance.mjs query --task T-004 --json` and explicit resume | PASS | Both resolve T-004 as `in-progress`, updated `2026-07-31`; resume reports only this task's pending documentation changes. |
| `git diff --check` | PASS | No whitespace errors in the Phase 0 documentation/governance change set. |
| Effect census | PASS | Task/governance documentation only; no product source, schema/migration, DB, artifact, secret, capability, environment, deployment, activation or traffic effect. |

## Evidence Policy

每次运行需记录命令、精确 source revision、结果和失败原因。只接受通过公共契约获得的黑盒证据；直接读取数据库不能作为 consumer 验收证据。
