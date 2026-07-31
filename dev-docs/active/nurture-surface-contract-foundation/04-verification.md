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

## Phase 1 Verification — 2026-07-31

| Check | Result | Evidence |
| --- | --- | --- |
| T-004 recovery and prerequisite state | PASS | Explicit resume selected T-004 at clean head `9a90ab5`; T-002 M0-M4 is complete while exact My-Chat owner-pin drift remains an Owner Integration NO-GO. |
| Normative source boundary | PASS | Interface, capability, surface and visibility JSON sources exist only under `packages/nurture-scenario/contracts/surfaces/v1/source/`; no generated identity, My-Chat runtime, Prisma or provider dependency was added. |
| Capability descriptor closure | PASS AFTER REPAIR | Required domain/execution/delivery axes, schema/policy/handler/presenter bindings, target/confirmation/concurrency policies and dependency gates are closed. Runtime availability was removed from semantic handler binding, and system-only capabilities may have no presenter. |
| Six-surface and visibility contract | PASS AFTER REPAIR | Exactly six role-bound surfaces map to closed conversation/board/workbench content kinds. The visibility matrix totally classifies every data class for every surface and names its canonical My-Chat/Nurture owner; Guardian cross-Institution provenance is allowed only on family surfaces, while Institution/Caregiver views deny other-Institution presence. |
| Institution Admin protected read | PASS | Mobile Admin write boundary is `none`; exact disclosure/Institution/class/original Grant/data class/direction/purpose/source-lifecycle rules are required, and Admin read does not grant CareGroup action. |
| Readiness, snapshot and response semantics | PASS | Four independent readiness axes, surface states, atomic initial snapshot, cursor bindings, refresh/rebase drift, dependency NO-GO, empty/loading/failure/permission/correction/withdrawal semantics are machine-readable. |
| Schema reference review | PASS AFTER REPAIR | Stable HTTPS schema IDs make relative interface-ref references resolvable; one primitive SSOT supplies shared types, system-policy roles are excluded from surface actor contexts, source names are kebab-case and no placeholder digest or generated manifest exists. |
| Focused source contract suite | PASS | `pnpm exec vitest run -c vitest.config.ts packages/nurture-scenario/tests/surface-contract/phase-1-source.test.ts`: 1 file / 10 tests. |
| Scenario TypeScript | PASS | `pnpm --filter @the-nurture/scenario typecheck`. |
| Full unit regression and population | PASS | `pnpm test:unit`: 22 files / 197 tests; `pnpm test:unit:ci && pnpm verify:unit-population` reports 197/197. |
| Test routing and whitespace | PASS | `node scripts/assert-test-routing.mjs` reports 47 files with 22 unit files; `git diff --check` passes. |
| Build boundary | NOT RUN / NOT YET APPLICABLE | Phase 1 intentionally assigns no exact digest and has no generated manifest. Phase 2 lands canonicalization and deterministic build/verify together; no application build was run. |
| Effect boundary | PASS | No runtime capability/manifest, schema/migration, database, external repository, environment, secret, deployment, activation or traffic changed. |

## Phase 2 Verification — 2026-07-31

| Check | Result | Evidence |
| --- | --- | --- |
| Exact generated identity | PASS | `pnpm build:surface-contract` produced `nurture.surface-contract@1.0.0` / `sha256:2edc462f3fd2c2c272355dc7a25d7738e4390bc596feda55280a4599ac1c3129`, 10 capability slices and 6 surface slices. |
| Deterministic rebuild | PASS | `pnpm verify:surface-contract` rebuilt under `.ai/.tmp/`, compared exact bytes and reported shared core `sha256:934db320e11ccdfb073cb1182b809e8076bd38d064bb8ed1b298ec20c7843cbd`. |
| Generator strictness | PASS AFTER REPAIR | `pnpm test:surface-contract-tooling`: 5/5. Duplicate keys, non-finite numbers, non-canonical output names and semantic drift without a version rotation reject; canonical JSON sorts object keys while preserving semantic array order. |
| Source graph and binding closure | PASS | Build validates complete local `$ref` resolution, logical schema refs, descriptor keys/nested bindings, presenter parity, policy/repository refs, unique registries and forbidden port fallback before writing. |
| Focused Phase 2 contract suite | PASS | `pnpm exec vitest run -c vitest.config.ts packages/nurture-scenario/tests/surface-contract/phase-2-contract.test.ts`: 1 file / 17 tests. |
| Exact admission and loader | PASS AFTER REPAIR | Tests reject unknown root/nested fields, mismatched canonical source-set/root digest, version/digest mismatch and missing/mismatched ports; loaded manifests are recursively frozen. Git/source revision provenance is recorded later in qualification evidence and is not mislabeled as the semantic digest. |
| Invocation/business-input separation | PASS AFTER REPAIR | Query/prepare/execute/readResult carry exact contract, trusted context, scope, purpose, nonce and expiry. Target/idempotency/confirmation stay generic; capability input schemas contain only business fields. |
| Confirmation/concurrency/replay | PASS AFTER REPAIR | Private typed confirmation binds target, actor/scope, integrity, heads and expiry; protected low-entropy input requires keyed integrity. Acknowledge declares convergent exact-state semantics, reply declares compatible append, and CommandExecution replay remains separate. |
| Cursor/error/presenter safety | PASS | Private cursor binds digest/actor/scope/query/sort/snapshot/expiry; public errors are closed and actor-safe; six presenter records freeze required/optional fields and Institution board has no action projection. |
| Dependency/default-off boundary | PASS | Missing T-002 Owner Integration returns deterministic dependency NO-GO. G2-C and Admin protected-read capability keys remain absent until separately frozen; no synthetic runtime fallback exists. |
| Scenario TypeScript | PASS | `pnpm --filter @the-nurture/scenario typecheck`. |
| Full unit regression and population | PASS | `pnpm test:unit:ci && pnpm verify:unit-population`: 23 files / 214 tests, all passing. |
| Test routing and whitespace | PASS | `node scripts/assert-test-routing.mjs`: 48 files total, 23 unit; `git diff --check` passes. |
| Application build boundary | NOT RUN | Only the dedicated deterministic contract artifact generator ran. No application/service/frontend build or dev server was run. |
| Effect boundary | PASS | No runtime scenario manifest/capability activation, schema/migration, database, sibling repository, environment, secret, deployment or traffic changed. Owner Integration, Synthetic Qualification and Joint Conformance remain unclaimed. |
