# C30-I0 Cross-Repository Baseline Inventory

## Status and boundary

- Captured: 2026-07-21T16:22:52+08:00
- State: `INVENTORY_COMPLETE / BASELINE_NOT_FROZEN / C30-I1_NO_GO`
- Task owner: `T-002 nurture-institution-mode`
- Scope: repository/worktree ownership, exact revisions, contract/source identity,
  schema/migration deltas, dependency form, activation posture, and verification
  reproducibility.
- Excluded: contract implementation, schema or migration edits, database apply,
  artifact publication, capability/Workspace activation, cloud resources,
  secrets, provider calls, and product traffic.

The inventory is evidence for `C30-I0`; the inventory does not satisfy
`C30-I0`. The
locked exit still requires committed decision docs, clean/isolated worktrees,
false/empty C-3 gates, and immutable dependency evidence.

## 1. Canonical baseline selection

The authoritative product/architecture baseline is the current T-002
Pilot-0-C/D decision tree in the primary Nurture worktree. The parallel T-029
`scenario-platform-convergence` worktrees are implementation donors only until
their changes are reconciled against T-002 and committed under exact revisions.
No T-029 checkbox, local test result, package version, path hash, or disposable
database result supersedes T-002.

| Repository | Canonical starting revision | Branch / relation | Primary-worktree state | Baseline meaning |
| --- | --- | --- | --- | --- |
| My-Workflow-Base | `acba4e792c85131c19e63e08a5f671133c481c57` | `main`, equal to `origin/main` | Clean | Historical X0 contract baseline and the only clean C30-I1 starting point. |
| My-Chat | `db22de66c2e58fec5e24be0150458b36c02e9682` | `main`, one commit ahead of `origin/main` (`a1b5e64c84c9865e34abb7068be10352cf42c949`) | 22 tracked/indexed changes plus 19 untracked status entries, owned by cloud-deployment work | Child/Family schema-only design input; not a C30-I2 adoption revision. |
| The-Nurture | `198454ee2efaf8ffb1e9d2a4f78515f18428b9b6` | `codex/t-002-pilot-0-readiness`, 69 commits ahead of `origin/main` | 18 tracked/indexed changes plus 3 untracked status entries | Current code baseline plus uncommitted T-002 C/D decision corpus and a separate untracked T-003 UIUX task. |

Counts above are `git status --short` entries. An untracked directory counts as
one entry and may contain multiple files.

The historical workflow integration pin remains:

- Base revision `acba4e7`, path-content hash
  `0bd8925ec8da88e0b7d0aa76b33bef94c471ff52499651c7b0c2a5da381501aa`;
- My-Chat revision `a1b5e64`, the same path-content hash;
- Base logical-source hash
  `a97a5b149b222e70b5cfb7592414108fa0684887a08b08b3819ce2037577e981`;
- current Nurture scenario source hash
  `e92582d9b710e62f087d92549e1e473a9a22d64b9ad0d058eb010c8c46a67d35`.

The live My-Chat checkout at `db22de6` intentionally fails the historical pin's
revision check. That failure is current-gap detection, not evidence that the
historical contract bytes differ.

## 2. Worktree and task ownership

| Worktree | HEAD | Dirty inventory | Owner | Disposition at inventory time |
| --- | --- | --- | --- | --- |
| Base primary | `acba4e7` | clean | released X0 baseline | Preserve as the C30-I1 starting point. |
| Base `scenario-platform-convergence` | `acba4e7` | 21 tracked/indexed + 24 untracked entries | T-029 | Donor only; all candidate code is uncommitted. |
| My-Chat primary | `db22de6` | 22 tracked/indexed + 19 untracked entries | cloud-deployment task | Do not edit for C30. |
| My-Chat `scenario-platform-convergence` | `db22de6` | 39 tracked/indexed + 23 untracked entries | T-029 | Donor only; not a clean C30-I2 worktree and all candidate code is uncommitted. |
| Nurture primary | `198454e` | 18 tracked/indexed + 3 untracked entries | T-002 plus untracked T-003 | T-002 must be committed separately from T-003 before implementation. |
| Nurture `scenario-platform-convergence` | `198454e` | 27 tracked/indexed + 11 untracked entries | T-029 | Donor only; must not be merged over the newer T-002 decision corpus. |

The Nurture primary and T-029 worktrees overlap on ten paths:

1. `.ai/project/main/registry.yaml`
2. `dev-docs/active/nurture-institution-mode/.ai-task.yaml`
3. `dev-docs/active/nurture-institution-mode/00-overview.md`
4. `dev-docs/active/nurture-institution-mode/01-plan.md`
5. `dev-docs/active/nurture-institution-mode/02-architecture.md`
6. `dev-docs/active/nurture-institution-mode/03-implementation-notes.md`
7. `dev-docs/active/nurture-institution-mode/04-verification.md`
8. `dev-docs/active/nurture-institution-mode/05-pitfalls.md`
9. `docs/context/registry.json`
10. `docs/context/workflow/nurture-scenario-contract.md`

The My-Chat cloud-deployment and T-029 worktrees overlap on the four generated
project-hub views only. No C30 reconciliation may silently choose either copy;
the owning task must regenerate the views after scoped commits converge.

## 3. Contract and source identity inventory

The six locked C-3 source identities are absent from executable source in all
three canonical worktrees and all three T-029 worktrees:

- `platform_child_family_identity_source_v1`
- `scenario_interface_source_v1`
- `scenario_domain_action_source_v1`
- `scenario_protected_interaction_source_v1`
- `scenario_notification_continuity_source_v1`
- `scenario_activation_admission_source_v1`

T-029 adds useful neutral primitives—`CanonicalRefV1`, command/event/receipt
envelopes, registry/activation records, integration-lock v3, owner inbox/outbox,
and response-loss tests—but currently groups Host capability under
`scenario_federation_v1` and `generation_ticket_v1`. It does not implement the
locked trusted-principal/ingress, subject-presentation, domain-action, protected
interaction, Notification-continuity, and admission source boundaries as
separately attributable increments.

T-029's current local candidate hashes are:

| Candidate input | Local source hash | Qualification status |
| --- | --- | --- |
| Base package | `f9e5f65d9818b0a5c556dfa4a22c2c46a049fc20c33098f09d3b4441383e917f` | Mutable local package path; not an accepted C30 source revision. |
| My-Chat contract package | `ab0d800187deb05dcd131b0e606541763d74f4d912a438016a2eb852065ea863` | Mutable local package path; not an accepted C30 source revision. |
| Nurture scenario package | `1c9f81f86633316e47426a160b0751623fa7c5a458e8cb579e6623bd54ff4758` | Mutable local package path; not an accepted C30 source revision. |

The direct integration-lock verifier accepts those hashes in ordinary and
`--joint-candidate` modes, but package-mode joint verification does not require
a Git revision. The standard Nurture `pnpm verify:integration-lock` entrypoint
currently fails because its installed `@workflow-base/conformance` package does
not contain the declared script path. Both issues must be repaired before the
lock is admissible C30 evidence.

## 4. Identity and schema inventory

### Canonical committed schemas

- My-Chat has 18 committed migrations through
  `20260720190000_child_identity_scenario_boundary`. `db22de6` is explicitly
  schema-only and is not independently deployable.
- Nurture production has three committed migrations through
  `20260715070000_nurture_handoff_replay_seed_x4`.
- Neither canonical schema contains the locked C-3 typed-anchor/association or
  C-3 activation/admission implementation.

### Uncommitted T-029 deltas

- My-Chat adds `20260720230000_scenario_platform_federation`, including a
  `ScenarioWorkspaceActivation` table whose row default is `disabled`.
- Nurture adds `20260721003000_scenario_federation_identity`.
- The T-029 Nurture schema stores `platformChildObjectId` directly on
  `NurtureChild` and `platformFamilyObjectId` directly on `NurtureFamily` and
  has no separate `NurtureChildBindingAnchor`, `NurtureFamilyBindingAnchor`,
  `NurtureChildAnchorAssociation`, or `NurtureFamilyAnchorAssociation` models.

That Nurture delta conflicts with the locked chain:

`My-Chat Child/Family -> My-Chat scenario binding ownerRef -> Nurture typed
anchor -> workspace-local association -> local Child/Process/child-scoped
Family`.

The direct-ref migration is therefore `REWORK_REQUIRED`, not a migration to
apply or preserve as authoritative. No database was queried or mutated by the
baseline inventory.

## 5. Dependency and activation posture

The canonical Nurture workspace resolves `@my-chat/workflow-contracts` through
`link:../My-Chat`. T-029 expands mutable links to My-Chat DB, workers,
workflow-contracts, workflow-runtime, and Base conformance packages. Local links
may be used as disposable development plumbing, but no path, current bytes, or
successful local test is release/adoption evidence.

The only committed environment gate observed in My-Chat is the historical X4
`WORKFLOW_HANDOFF_MATERIALIZATION_V1_ENABLED`: `dev=true`,
`staging=false`, `prod=false`. This is not a C-3 activation gate and must not be
misreported as a C-3 violation or C-3 enablement.

All new C-3 capabilities, source identities, qualification rows, and active
Workspace activation rows are absent from the canonical repositories. T-029's
activation schema/capability constants are uncommitted and not wired as a
qualified product composition. No live database census was performed, so the
inventory claims repository absence/defaults only, not environment row counts.

## 6. Verification snapshot

| Scope | Result | Evidence |
| --- | --- | --- |
| Base canonical baseline | PASS | `pnpm verify:workflow-contracts`; typechecks, 19 runtime tests, one scenario test, claim-token/source portability, and source lock pass. |
| Nurture canonical baseline | PASS | `pnpm typecheck`; 19 files / 175 unit tests; test-routing, persistence-boundary, N1 schema, X4 replay checks; production Prisma validate. |
| Nurture dev-host schema | PASS WITH COMMAND-ENV DEBT | Standard command lacks `DEV_HOST_DATABASE_URL`; explicit non-connecting placeholder URL validates the schema. |
| Historical cross-repo pin from live checkout | EXPECTED FAIL | Live My-Chat is `db22de6`; pin requires `a1b5e64`. |
| My-Chat canonical checkout | PASS WITH TOOLCHAIN WARNING | Full monorepo typecheck passes; default shell Node 20 is below the repository's declared Node 22 minimum. |
| Base T-029 donor | PASS / NOT IMMUTABLE | Full candidate verification passes: 25 runtime tests, 10 starter tests, schema/semantic lock tests, and source lock. |
| My-Chat T-029 donor | PASS / NOT IMMUTABLE | Node 24 typecheck and 80 test files / 387 tests pass; six files / 27 tests are skipped. |
| Nurture T-029 donor | PASS / NOT IMMUTABLE | Typecheck and 21 files / 184 unit tests pass. |
| T-029 integration-lock package command | FAIL | Installed CLI target is missing. Direct script invocation passes ordinary and joint modes but does not prove immutable revisions. |
| T-002 docs/governance/context | PASS WITH EXISTING WARNINGS | Governance lint and strict context verification pass; task-doc lint reports 0 errors and 18 existing warnings; `git diff --check` passes. |

## 7. Initial donor disposition

The table is a baseline classification, not final code acceptance.

| T-029 area | Initial disposition | Required next review |
| --- | --- | --- |
| Canonical ref and strict closed-field validation | `REUSE_CANDIDATE` | Check naming, bounds, version semantics, and source ownership against C30-I1. |
| Command/event/receipt identity and response-loss behavior | `REUSE_CANDIDATE` | Reconcile with claimed-Step provenance, direct-empty paths, and existing X2-X5 contracts. |
| Owner inbox/outbox and same-subject My-Chat constraints | `REUSE_CANDIDATE` | Keep Host ownership and prove no cross-owner authority leak. |
| One `scenario_federation_v1` umbrella capability/source | `REWORK_REQUIRED` | Split separately attributable C30/C31/C32/C33/C34/C35 source and capability dependencies. |
| Local-package joint lock | `REWORK_REQUIRED` | Require exact Git revision or content-addressed immutable artifact and make the installed CLI hermetic. |
| Direct platform refs on Nurture Child/Family | `REMOVE_OR_REDESIGN` | Replace with scenario-global typed anchors plus exact workspace associations. |
| Scenario registry/activation/generation foundation | `DEFER_AND_RECONCILE` | Assign the foundation to its locked C30/C34/C35 owner; do not permit a strict-DAG or qualification-vocabulary bypass. |
| T-029 edits to T-002 decision docs | `DO_NOT_MERGE` | Port only verified implementation facts into the newer T-002 corpus after code disposition. |

## 8. C30-I0 remaining gates

1. Commit the current T-002 decision/context corpus without T-003 files.
2. Preserve T-003 as a separately attributable design task and keep T-003
   non-normative for C30 contract evidence.
3. Snapshot T-029 work in exact commits or another content-addressed,
   reviewable form before modifying T-029; do not merge T-029 directly.
4. Complete a file/type-by-type T-029 disposition against C30-I1/I2/I3/I4.
5. Create clean Base, My-Chat, and Nurture implementation branches from the
   selected committed starting revisions.
6. Replace mutable dependency evidence and repair the clean-install verifier.
7. Record repository-level false/empty C-3 gates and, only when separately
   authorized against a named target, environment row census.
8. Rerun the canonical baseline suite. Only then may C30-I1 enter `in_progress`.

## Next three actions

1. Review and approve the T-002 scoped commit set using the inventory artifact as the
   exclusion list for T-003 and T-029.
2. Produce the detailed T-029 `reuse/rework/defer/remove` mapping for Base,
   My-Chat, and Nurture code/schema/tests.
3. Freeze exact starting revisions and create clean C30 worktrees; rerun pin,
   governance, context, typecheck, unit, conformance, schema-validate, and
   whitespace gates without database apply.
