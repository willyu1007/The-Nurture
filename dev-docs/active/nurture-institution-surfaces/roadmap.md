# G4-E Institution Knowledge & RAG — Implementation Roadmap

## Goal

- Implement the frozen 0F Institution Knowledge/RAG contracts through G4-E
  I1–I4, preserving Nurture/My-Chat ownership, default-off runtime boundaries,
  exact replay/currentness and the medical/privacy fail-closed posture.

## Execution status

- P0 roadmap/preflight: complete.
- E1 lifecycle/provenance I1.1: `G4_E_I1_1_PASS_STATIC`; see
  [`70`](./70-g4-e-increment-1-record.md). Migration execution remains reserved
  for approved disposable qualification in E4.
- E2 retrieval/currentness I1.2: `G4_E_I1_2_PASS_STATIC`; see
  [`71`](./71-g4-e-increment-2-record.md). It adds no schema, database or
  runtime effect.
- Current node: E3 answer safety/candidate I1.3.
- I3/I4 gates Q1–Q4 remain unresolved; no compatibility fallback is allowed.

## Planning-mode context and merge policy

- Runtime mode signal: Default
- User confirmation when signal is unknown: not-needed; the user explicitly
  requested planning followed by implementation in the same instruction
- Host plan artifact path(s): (none)
- Requirements baseline: records
  [`64`](./64-g4-0f-scope-freeze.md)–[`69`](./69-g4-0f-exit-record.md)
- Merge method: set-union
- Conflict precedence: latest user-confirmed > 0F freeze/Exit records > existing
  task plan/architecture > model inference
- Repository SSOT output:
  `dev-docs/active/nurture-institution-surfaces/roadmap.md`
- Mode fallback used: non-Plan default applied: yes

## Input sources and usage

| Source | Path/reference | Used for | Trust level | Notes |
| --- | --- | --- | --- | --- |
| User-confirmed instructions | Current request | full G4-E closure; per-node quality/sync/commit | highest | authorizes implementation, not unsafe expansion of DB/external-owner effects |
| 0F freeze/Exit | [`64`](./64-g4-0f-scope-freeze.md)–[`69`](./69-g4-0f-exit-record.md) | exact contracts, owner boundaries, release gates | high | `G4_0F_EXIT_PASS` opens G4-E I1 only |
| Existing task bundle | `00-overview.md`, `01-plan.md`, `02-architecture.md`, `03-implementation-notes.md`, `05-pitfalls.md` | product context, sequencing, historical lessons | high | T-007 remains the reused task |
| Project hub | `.ai/project/main/` | M-002/F-003/T-007 mapping and live focus | high | sync after every node |
| Host plan artifact | (none) | N/A | medium | no dual artifact |
| Existing roadmap | (none) | N/A | medium | first roadmap for this task |
| Model inference | N/A | directory-level impact and rollback details | lowest | never overrides frozen contracts |

## Non-goals

- Do not create an independent Nurture app shell, Host route, model gateway,
  vector store, prompt registry, provider SDK or My-Chat ORM copy.
- Do not reuse `NurtureContextMaterial` or `NurtureRuntimeContextPack` as
  Institution knowledge.
- Do not add child/family/private-care retrieval, caregiver/Guardian Knowledge
  surfaces, family share or external delivery.
- Do not let a conflict candidate become a status, hold, eligibility decision,
  deadline/blocker or second review lifecycle.
- Do not apply migrations to shared/persistent/staging/production databases.
- Do not claim I3/I4 closure from synthetic adapters, the moving My-Chat
  checkout, or an unqualified answer-safety provider.

## Open questions and assumptions

### Open questions (must close before the named phase)

- Q1 — Before disposable PostgreSQL qualification: what exact disposable
  target is approved for G4-E migration execution and destruction evidence?
- Q2 — Before I3: which exact My-Chat revision adopts the Institution source,
  retrieval, currentness and replayable generation deltas?
- Q3 — Before I3: which exact deterministic answer-safety provider and
  rule-set/version are owner-qualified?
- Q4 — Before any sibling-repository change: is My-Chat/Base mutation explicitly
  in scope, or must those owner deltas arrive as external handoff artifacts?

### Assumptions

- A1: I1 schema/migration authoring and static verification may proceed without
  connecting to a database (risk: low).
- A2: I2 may publish an exact default-off Surface artifact and synthetic
  adapters without claiming owner readiness (risk: low).
- A3: Unresolved Q1 blocks DB execution only; unresolved Q2–Q4 block I3/I4 but
  do not justify compatibility adapters or local Host-runtime substitutes
  (risk: high if ignored).
- A4: Each numbered implementation node is a revertible commit boundary with
  one `Task: T-007` trailer; the next node starts only from a clean worktree
  after verification and project sync (risk: low).

## Merge decisions and conflict log

| ID | Topic | Conflicting inputs | Chosen decision | Precedence reason | Follow-up |
| --- | --- | --- | --- | --- | --- |
| C1 | Immediate execution after roadmap | plan-maker normally requests a later confirmation; current user already ordered planning then implementation | treat current instruction as execution confirmation | latest user-confirmed instruction | commit roadmap, then start I1 |
| C2 | Full closure versus external readiness | user requests closure; 0F Exit marks scenario/safety bridges unqualified | progress through safe I1/I2, then close exact upstream/DB gates before I3/I4 | frozen safety/owner contract constrains implementation | no invented fallback; report exact gate if unresolved |
| C3 | Candidate safety | conservative hold could appear safer; 0G proved it breaks replay/SSOT | candidate remains immutable non-authoritative evidence | `G4_0G_0F_AUDIT_PASS_AFTER_REPAIR` | regression fixture in I1.3/I4 |

## Scope and impact

- Affected areas/modules: Institution domain and command kernel, scenario
  repository ports, Prisma SSOT/migrations, DB repositories, protected-content
  integration, Surface Contract artifact/adapters, scenario module/manifest,
  verification scripts/tests and task/project docs.
- External interfaces/APIs: exact My-Chat Knowledge/RAG source/retrieval/
  currentness/generation adapters and one deterministic answer-safety owner;
  no generic-purpose remapping.
- Data/storage impact: five planned Nurture tables total — four lifecycle/
  provenance tables and one immutable conflict candidate; existing
  `NurtureCommandExecution` and protected-content storage are reused.
- Backward compatibility: additive and default-off through I2; no existing
  family corpus, Institution operations, Enrollment Journey, manifest key or
  public capability may change meaning.

## Consistency baseline for dual artifacts (if applicable)

- [x] Goal is semantically aligned with the 0F Exit record
- [x] Boundaries/non-goals are aligned
- [x] Constraints are aligned
- [x] Milestones/phases ordering is aligned
- [x] Acceptance criteria are aligned
- Intentional divergences:
  - (none; no host plan artifact exists)

## Project structure change preview (may be empty)

This section is a **non-binding, early hypothesis** to help humans confirm
expected project-structure impact.

### Existing areas likely to change (may be empty)

- Modify:
  - `packages/nurture-scenario/src/domain/institution/`
  - `packages/nurture-scenario/src/` repository/surface/module boundaries
  - `packages/nurture-scenario/tests/institution/` and Surface Contract tests
  - `packages/nurture-db/src/repositories/` and `packages/nurture-db/tests/`
  - `prisma/schema.prisma` and `prisma/migrations/`
  - `packages/nurture-scenario/contracts/surfaces/v1/`
  - `scripts/surface-contract/` and structural gates when exact inventory grows
  - task docs and `.ai/project/main/`
- Delete:
  - (none planned; remove only implementation-discovered duplicate/dead paths)
- Move/Rename:
  - (none planned)

### New additions (landing points) (may be empty)

- New module(s) (preferred):
  - Institution knowledge lifecycle, retrieval policy and answer-safety domain
    modules under the existing Institution domain
  - Knowledge repositories under the existing DB repository layer
- New interface(s)/API(s) (when relevant):
  - Nurture source-change/currentness providers, Host retrieval/generation/
    authority-currentness consumers and deterministic answer-safety port
- New file(s) (optional):
  - two additive Prisma migration directories, subject to implementation review
  - phase-specific implementation/audit records in the existing task bundle

## Phases

1. **P0 — Roadmap and preflight**
   - Deliverable: this SSOT roadmap, live task/project alignment and clean
     baseline verification.
   - Acceptance criteria: docs/governance pass; roadmap commit lands alone.
2. **E1 — G4-E I1.1 lifecycle/provenance**
   - Deliverable: strict domain/policy/ports, four-table Prisma/migration
     artifacts, DB repository implementation and synthetic/static tests.
   - Acceptance criteria: lifecycle, authority, replay, concurrency, protected
     body and migration-static gates pass; runtime remains absent.
3. **E2 — G4-E I1.2 retrieval/currentness**
   - Deliverable: pure index/online/preview eligibility and exact bounded owner
     ports/providers with no new table.
   - Acceptance criteria: future-effective/index split, stable reconciliation,
     denial/unavailable and no-child/no-fallback fixtures pass.
4. **E3 — G4-E I1.3 answer safety/candidate**
   - Deliverable: strict claim/citation/abstention/portable presenter,
     deterministic safety orchestration, immutable candidate policy and fifth
     table/migration artifact.
   - Acceptance criteria: cited positive synthetic paths, privacy/medical
     negatives, replay/drift and candidate-no-hold regressions pass.
5. **E4 — G4-E I1 audit and persistence qualification**
   - Deliverable: cross-increment architecture audit, clean migration lineage
     and disposable PostgreSQL evidence when Q1 is approved.
   - Acceptance criteria: targeted/full unit and DB lanes, drift/context and
     cleanup evidence pass; otherwise DB qualification remains an explicit gate.
6. **E5 — G4-E I2-A public Surface Contract**
   - Deliverable: exact additive Knowledge query/command/action schemas,
     artifact pin, fixtures and conformance coverage.
   - Acceptance criteria: trusted fields excluded, all descriptors covered,
     old contracts remain compatible and runtime remains NO-GO.
7. **E6 — G4-E I2-B default-off Surface adapters**
   - Deliverable: typed validators, role-safe presenters, I1 service adapters
     and fail-closed module/manifest composition.
   - Acceptance criteria: behavior tests cover each descriptor; formal ingress
     remains unrouted and disabled until I3.
8. **E7 — G4-E I3 Owner Integration Readiness**
   - Deliverable: exact adopted My-Chat/safety owner pins/adapters, formal
     scenario-service ingress and disposable PostgreSQL qualification.
   - Acceptance criteria: Q1–Q4 resolved, real owner positive/negative/replay/
     drift paths pass; no synthetic-only readiness claim.
9. **E8 — G4-E I4 Joint Conformance and Exit**
   - Deliverable: formal ingress end-to-end conformance, branch audit, G4-E
     Exit record and updated T-007 gap register.
   - Acceptance criteria: positive cited general/medical paths, no-source,
     conflict, unsafe text, source drift, owner outage, copy/export provenance,
     privacy negatives and final default-off census pass.

## Step-by-step plan (phased)

### Phase P0 — Roadmap and preflight

- Objective: establish one executable sequence and preserve exact release gates.
- Deliverables:
  - roadmap, plan/status synchronization and baseline evidence.
- Verification:
  - strict task-doc lint, project-state, governance lint/sync, exact owner pin,
    clean worktree and commit trailer.
- Rollback:
  - revert the roadmap/status commit; no code or DB effect.

### Phase E1 — Lifecycle/provenance I1.1

- Objective: implement 0F-1 without retrieval/model/Surface concerns.
- Deliverables:
  - pure domain decisions, command specs/ports, repository transaction, four
    tables/migration and targeted tests.
- Verification:
  - targeted unit/DB-static tests, root/package typecheck, Prisma
    format/validate/generate/diff, persistence/port/test-routing gates, full unit
    regression and docs/governance.
- Rollback:
  - revert the E1 commit; migration remains unapplied and runtime absent.

### Phase E2 — Retrieval/currentness I1.2

- Objective: implement exact source discovery, admission, online currentness and
  editor preview without persistence duplication.
- Deliverables:
  - pure policies and provider/consumer ports with bounded, closed results.
- Verification:
  - synthetic owner fixtures, unit/full unit/typecheck, static import/topology
    gates and exact pin verification.
- Rollback:
  - revert E2; E1 facts remain private and unreachable.

### Phase E3 — Answer safety/candidate I1.3

- Objective: implement strict scenario answer boundary and immutable review
  evidence without a local LLM runtime.
- Deliverables:
  - orchestration/presenter/candidate command/repository, fifth migration and
    negative/replay tests.
- Verification:
  - targeted unit/DB-static suites, full unit/typecheck/Prisma/structure gates,
    zero provider/config additions and candidate-no-hold regression.
- Rollback:
  - revert E3; E1/E2 remain private, default-off and non-generative.

### Phase E4 — I1 audit and DB qualification

- Objective: prove all I1 increments compose and the authored migration survives
  real PostgreSQL only on an approved disposable target.
- Deliverables:
  - audit record, DB evidence, context refresh and destroyed-target evidence.
- Verification:
  - empty deploy, targeted/full PostgreSQL suites, migration status, zero drift,
    DB context sync/verify, final absence of target/session.
- Rollback:
  - destroy disposable target; revert only the failing increment after evidence
    capture. Never repair a shared database.

### Phase E5 — I2-A Surface artifact

- Objective: publish exact additive schemas without a caller.
- Deliverables:
  - generated artifact/version/digest, fixtures and conformance inventory.
- Verification:
  - Surface tooling/schema/conformance, typecheck, full unit, formal-ingress
    census and default-off checks.
- Rollback:
  - revert artifact rotation; I1 remains private.

### Phase E6 — I2-B default-off adapters

- Objective: map every public descriptor to one I1 behavior behind one gate.
- Deliverables:
  - validators/presenters/adapters and explicit disabled composition.
- Verification:
  - exact mapping suite, wrong-role/scope/trusted-field negatives, full unit,
    typecheck, Surface conformance and structural gates.
- Rollback:
  - revert adapters/gate; artifact stays contract-only if E5 remains.

### Phase E7 — I3 Owner Integration Readiness

- Objective: bind only exact adopted owner providers and formal ingress.
- Deliverables:
  - adopted pins, adapters, real service composition and disposable evidence.
- Verification:
  - real owner positive/denial/unavailable/drift/replay, authenticated formal
    HTTP, PostgreSQL and source-pin/adoption hashes.
- Rollback:
  - disable the single runtime gate, remove formal routing and destroy the
    disposable target; never fall back to generic public RAG.

### Phase E8 — I4 Joint Conformance and G4-E Exit

- Objective: prove the whole role-safe cited-answer lifecycle and close G4-E.
- Deliverables:
  - joint evidence, cross-contract audit, G4-E Exit and next T-007 checkpoint.
- Verification:
  - full required positive/negative/replay/privacy/safety matrix, all repository
    gates, final false/empty census, docs/context/governance and clean worktree.
- Rollback:
  - retain runtime gate disabled; no activation occurs in G4-E.

## Verification and acceptance criteria

- Build/typecheck:
  - `pnpm typecheck`
  - targeted package typechecks where failure isolation helps
- Automated tests:
  - targeted Institution Knowledge unit/integration suites
  - `pnpm test:unit`
  - repository DB suite only on an approved disposable PostgreSQL target
  - `pnpm verify:surface-conformance` for I2+
- Static/contract checks:
  - Prisma format/validate/generate and schema diff
  - persistence boundaries, port topology, test routing, formal ingress,
    default-off, exact Knowledge/RAG pin and LLM config registry
  - strict Context, project-state, task-doc and governance checks
- Manual checks:
  - no new manifest/module/public caller before its gate
  - no My-Chat ORM/provider/model/vector import in Nurture
  - no question/child/family/private facts in candidate/answer persistence
- Acceptance criteria:
  - every required G4-E DoD path passes on its correct gate;
  - no required owner/DB/formal-ingress evidence is replaced by synthetic proof;
  - every critical node is reviewed, repaired, synchronized and committed before
    the next node;
  - G4-E Exit does not activate capability or traffic and T-007 remains honest.

## Risks and mitigations

| Risk | Likelihood | Impact | Mitigation | Detection | Rollback |
| --- | ---: | ---: | --- | --- | --- |
| External scenario/safety owner contracts remain absent | high | high | stop at exact I3 gate; no compatibility mapping | pin/adoption and real-owner suites | keep gate false; revert I3 only |
| Migration violates existing command/protected-content invariants | medium | high | use repo Prisma SSOT, additive FKs/checks and disposable qualification | schema diff, DB tests, drift | destroy target; revert migration commit |
| Candidate becomes a second review/eligibility lifecycle | medium | high | immutable fact, no status/hold/event; dedicated regression | architecture review + replay tests | revert E3 |
| Model/owner output leaks trusted/private fields | medium | high | strict DTO parsers, closed refs, safety and presenter reconstruction | negative/schema tests | gate unavailable; revert adapter |
| Surface inventory creates duplicate truth | medium | medium | one generated artifact/inventory and derived runtime lists | conformance/formal-ingress census | revert I2 rotation |
| Large increments recreate previous code bloat | medium | medium | one unit per node; reuse command/protected/repository primitives | diff/architecture review after each node | simplify before commit |

## Optional detailed documentation layout (convention)

The existing detailed bundle remains:

```text
dev-docs/active/nurture-institution-surfaces/
  roadmap.md
  00-overview.md
  01-plan.md
  02-architecture.md
  03-implementation-notes.md
  04-verification.md
  05-pitfalls.md
```

The roadmap is the macro execution SSOT. Deep signatures/decisions remain in
the numbered records and architecture notes; implementation evidence remains in
`03-implementation-notes.md` and `04-verification.md`.

## To-dos

- [x] Confirm planning-mode signal handling and fallback record
- [x] Confirm input sources and trust levels
- [x] Confirm merge decisions and conflict log entries
- [x] Confirm open questions and phase gates
- [x] Confirm phase ordering and DoD
- [x] Confirm verification/acceptance criteria
- [x] Confirm rollout/rollback strategy
