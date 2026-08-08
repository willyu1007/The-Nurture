# C30 Cross-Repository Landing Plan

## Status

- Date: 2026-08-08
- Task: T-002
- State: **PLAN — no step executed, no authority granted**
- Trigger: the reverted Nurture-only merge (`faee71d`, pitfall recorded in
  `05-pitfalls.md`)

C30 cannot land one repository at a time. This plan records the exact refs,
the known conflict sets, the verified symbol availability and the required
order, so the landing is a mechanical sequence rather than a rediscovery.

Reconnaissance for this plan was read-only. Nothing in My-Chat or
My-Workflow-Base was modified, and this document does not authorize modifying
them — both carry their own governance and their steps belong to their own
task flows.

## Why one repository at a time fails

The Nurture branch's C30-I3 source references contracts that exist only in the
My-Chat branch. Merging the Nurture third alone produced 130 typecheck errors,
80 of them in `src`. The mechanical signal was available before the merge and
was missed: the branch ships its own upstream gate,
`scripts/verify-c30-i3-upstream.mjs`, which hardcodes two sibling heads that
are **not** the repository pins in
`docs/project/integrations/my-chat-workflow-contract.json`.

> A branch whose own gate pins sibling revisions different from the repository
> pins is by definition not independently mergeable.

## Exact Inventory

| Repository | Branch | Head | Ahead / behind its main | Size | Dry-merge conflicts |
| --- | --- | --- | --- | --- | --- |
| My-Workflow-Base | `codex/T-002-c30-i0-base` | `4350086993d837baa8030564f4e19593dedd96b0` | 37 / 0 | 133 files, +19751/-91 | **0 — landed 2026-08-08** |
| My-Chat | `codex/T-035-scenario-host-adoption` | `cd7bbc2623dff8621c2c7155b04d1bf759e8404a` | 23 / 22 | 192 files, +26562/-698 | 11 (9 derived, 2 real) — **landed 2026-08-08 as `dc3607e`** |
| The Nurture | `codex/T-002-c30-i0` | `76ece1f` | 58 / — | 114 files, +25102/-1304 | 5 (3 derived, 2 small) |

Fork points: Base at `8a3ea90` (its current main), My-Chat at `dc4a77b`
(2026-08-05), Nurture at `882d80f`.

Mainline heads observed 2026-08-08: Base `8a3ea90` (unchanged since 08-04),
My-Chat `e655fc5`, Nurture `927ecc8`.

## Verified: the contracts converge

The decisive question was whether a merged My-Chat actually exports what the
Nurture branch needs, given that My-Chat mainline carries `ScenarioManifestV2`
while the Nurture branch codes against `ScenarioContractManifestV1`.

Checked against the dry-merge result tree
`a7d13c4de56c752a13f9aadb9e3e96f815ac4355`
(`packages/workflow-contracts/src`): **both coexist, and V2 carries V1 as an
optional field** rather than replacing it —

```text
ScenarioManifestV2.scenario_contracts?: ScenarioContractManifestV1
```

All eleven symbols the reverted merge reported missing are present in that
tree: `ScenarioContractManifestV1`, `ScenarioHumanPrincipalV1`,
`ScenarioProtectedInteractionContractV1`,
`ScenarioProtectedPlainTextCarrierV1`, `ScenarioPrivateInvocationV1`,
`assertScenarioProtectedBodyFreeControlV1`,
`assertListScenarioSubjectContextsResultActiveV1`,
`assertPresentScenarioSubjectContextExchangeV1`,
`assertResolveScenarioSubjectContextResultActiveV1`, and the union values
`trusted_scenario_invocation_v1` and `scenario_subject_presentation_v1`.

The 130 typecheck errors were therefore caused purely by landing order, not by
a design conflict between the C30 contracts and My-Chat's mainline manifest
work.

## Landing Order

Each step is a precondition for the next. Do not reorder.

### Step 1 — My-Workflow-Base ✅ DONE 2026-08-08

Fast-forward `main` to `codex/T-002-c30-i0-base`. Zero conflicts; Base main had
not moved since 2026-08-04. This is the neutral contract source that both
other repositories adopt.

Executed: branch pushed to `origin/codex/T-002-c30-i0-base` as a backup (it was
local-only), then `main` fast-forwarded `8a3ea90 → 4350086` and pushed.

`pnpm install --frozen-lockfile --ignore-scripts` was required first — the C30
commits add `ajv`, which the primary worktree lacked; the lockfile was already
current and unchanged. `pnpm verify:workflow-contracts` then passed: 441 tests
pass / 0 fail, and `check:workflow-contract-source` reports lock
`d17f23585bb90ab607eb0fc80af629d8ab13ceb4508118de28162e4fd8846383`.

That lock value is Base's own source hash over its own path set — it is not
directly comparable to the `contractSha256` in Nurture's pin file, which uses
Nurture's `sha256-path-content-v1` scheme over a different scope. It does
confirm that Base's contract source moved, so Step 3's pin rotation is
mandatory rather than optional.

### Step 2 — My-Chat ✅ DONE 2026-08-08

Executed: branch pushed to `origin/codex/T-035-scenario-host-adoption` as a
backup (local-only, like the other two), merged as `dc3607e`, pushed. My-Chat
main was `8e2be84`.

Conflict resolution matched the prediction exactly. The nine derived files were
regenerated with My-Chat's own tooling — `ctl-project-governance sync` for
`.ai/project/main/`, `ctl-db-ssot sync-to-context` for the DB contract,
`ctl-api-index generate` for the API index, `ctl-context touch` for the
registry — except `changelog.md`, which is append-only and was hand-merged so
the two T-035 status entries survived taking ours. The two real conflicts were
small: `packages/db/package.json` (both sides added one script, kept both) and
`prisma/schema.prisma` (four hunks, all the same shape — main's field set is a
superset, the branch adds one `identityOperations` relation on `Child`,
`Family`, `FamilyStewardship` and `FamilyChildMembership`).

Verification: `prisma format` + `validate` pass; typecheck green across all 17
workspace projects; unit suite 109 files / 769 tests passed (19 files / 115
tests skipped); **every migration replayed from an empty disposable pgvector
database**, confirming the interleaved ordering is safe rather than assumed.
The disposable container was destroyed after the run and the existing
`nurture-postgres` (5433) and `codex-q4b5-mychat-pg` (55439) were untouched.

`pnpm install --frozen-lockfile --ignore-scripts` was required first, same
`ajv` cause as Base; the lockfile was already current.

**Pre-existing drift found, not introduced by the merge and not fixed here:**
`migrate diff` reports one difference on `guardian_current_focus` — an index
renamed between what `20260808060000_family_growth_cultivation_wave2` wrote and
what the model derives. That migration is main's own, dated 2026-08-08, and the
C30 branch has zero references to that table. It belongs to whoever owns the
cultivation wave.

The original prediction, retained for reference — eleven conflicts:

- Nine are derived or governance files — `.ai/project/main/` (`changelog.md`,
  `dashboard.md`, `feature-map.md`, `registry.yaml`, `task-index.md`) and
  `docs/context/` (`api/API-INDEX.md`, `api/api-index.json`, `db/schema.json`,
  `registry.json`). Resolve by regeneration and by rewriting the hub, exactly
  as the Nurture merge did.
- Two are real: `prisma/schema.prisma` (the branch adds ~480 lines) and
  `packages/db/package.json`.

Migration timestamps **interleave** here, unlike Nurture's case: the branch's
three (`20260806070853_scenario_identity_operation_pair`,
`20260806150000_scenario_invocation_nonce`,
`20260806173000_scenario_identity_recovery_audit`) sit between main's seven
`family_growth_*` migrations (`20260806113000` through `20260808050000`).

The interleaving is safe because the objects are disjoint. The branch creates
`scenario_identity_operations`, `scenario_invocation_nonces` and the types
`ScenarioIdentityOperationBusinessState` /
`ScenarioIdentityOperationQuarantineState`; main's are all `family_growth_*`.
Both alter the `AuditAction` enum, but with disjoint additive values — main
adds six `family_growth_material_*`, the branch adds
`scenario_binding_pair_committed` and
`scenario_identity_operation_recovered`, all via appending `ADD VALUE`.

Confirm rather than assume: replay all migrations from an empty database and
require an empty `migrate diff`.

### Step 3 — Rotate the Nurture pins ✅ DONE 2026-08-08

Landed as `d33276a`, separately from step 4 — it verifies green on its own and
gives a rollback point.

| Pin | Old | New |
| --- | --- | --- |
| `myWorkflowBase.revision` | `8a3ea90…` | `4350086993d837baa8030564f4e19593dedd96b0` |
| `myChat.revision` | `df7a273…` | `dc3607e74b01def9cf855d3eca14ebff7c3c492f` |
| contract parity (both sides) | `8dd53be4…` (11 files) | `98f6c24115e02e4abf0e3c9d855849f1c7993974e2ed9bcc72c868c642433d2f` (21 files) |
| `x5_joint_api` | `30878ba3…` (190 files) | `ba2a4f9fe0b9cf893bf1de40cfd27c404304e3bb38c3d41f4cf90189c211a3d4` (227 files) |
| `wave4_binding_host` | `947b4857…` (20 files) | `604796160dd58230e022585006d0f9fcf608e4428e785ae51be2ca875f758e62` (22 files) |
| `web_workbench` | `815311f7…` | unchanged — the UI kit did not move |
| Nurture self-pin | `c0f97aec…` (185 files) | unchanged **for now**; must be re-frozen after step 4 |

The contract source growing from 11 to 21 files is the C30 contract addition,
and Base and My-Chat compute the **identical** parity hash. That agreement is
the evidence that steps 1 and 2 are mutually consistent rather than two
independent adoptions.

Values were computed by importing `computeContractHash` from
`scripts/verify-workflow-contract-pin.mjs` rather than by trial and error; the
script itself is verify-only and has no update mode.

Verification after rotation: pin verifier all green, prisma clients regenerate,
typecheck 0 errors, routing census unchanged at 57/26/11/14/2, unit suite 616
tests passed. Rotating the pins alone does not disturb existing Nurture main.

This also answers the plan's second open question: a standalone step-3 commit
works and is preferable, because it isolates the rotation from the restore.

### Step 4 — The Nurture ✅ DONE 2026-08-08

Landed as `846c307`. **Typecheck reports 0 errors** — the same tree that
produced 130 errors, 80 in `src`, before steps 1-3. The landing order was the
entire problem.

Three doc conflicts arose from work written after the revert, none from code.
`05-pitfalls.md` is a union, branch entries first and the 2026-08-08 entry
last. `00-overview.md` keeps the branch's per-artifact record as T-002's
authoritative evidence and gains a landing-status block. `dashboard.md` was
rewritten around the landed state.

Self-pin re-frozen: `c0f97aec…` over 185 files → `fdb0eb75653ddb3162906665343f6712d40055425639f16f55ef20eb190d42b1`
over 204. `verify-c30-i3-upstream.mjs` advanced from host `cd7bbc2` to
`dc3607e`; its base head was already exact because Base fast-forwarded to that
branch tip. Only head identities moved — the source-profile checks are
untouched.

Verified: pin verifier all six green, prisma clients regenerate, typecheck 0
errors, routing census back to 63/29/11/14/2 with 0 unclassified, unit suite
63 files / 672 tests passed, `verify:c30-i3-default-off` green at census
`448d37e1…` with every positive count zero.

**Two gates deliberately left unsatisfied, and neither was weakened to pass:**

`verify:c30-i3-upstream` requires clean sibling worktrees; My-Chat's primary
checkout carries unrelated work in progress. The gate is right to refuse — it
is built for step 5's detached topology, not a live checkout.

`verify:c30-i3-owner-adoption` fails because merged bytes differ from what the
branch locked. Nine of 51 locked files differ and all nine are accounted for:
four auto-merged by git (`nurture-scenario` `package.json` and `index.ts`,
`assert-g2-exit-contract.mjs`, `prisma/schema.prisma`), two regenerated
(`docs/context/db/schema.json`, `docs/context/registry.json`), two
hand-resolved (`nurture-db/src/index.ts` kept both sides' exports,
`assert-test-routing.mjs` took the recomputed census), one the upstream head
advance. Re-freezing needs a post-commit `source_revision` plus the tool's own
hardcoded host head, so **it is the first task of step 5**, not something to
hide inside step 4.

For reference, the conflict resolution this step restored:

| File | Resolution already applied |
| --- | --- |
| `packages/nurture-db/src/index.ts` | both sides' exports kept |
| `scripts/assert-test-routing.mjs` | census recomputed to unit 63 / production-db 29 / dev-host 11 / scenario-service 14 / x5-joint 2 |
| `docs/context/db/schema.json` | regenerated (73 tables, 17 c30 entries) |
| `docs/context/registry.json` | regenerated |
| `.ai/project/main/dashboard.md` | rewritten |

Re-verify the census after restoring — if any repository gained test files in
the interim, the numbers move.

### Step 5 — One three-repository requalification

**Open its first task with the two lock re-freezes** deferred from step 4:
regenerate `docs/project/integrations/c30-i3-owner-adoption-lock.json` from the
committed tree (the tool prints the new lock to stdout when run without
`--check`, and its `assertSourceRevision` requires a `source_revision` where the
locked files already have their landed content), and advance the hardcoded
`host.head_revision` inside
`scripts/compute-c30-i3-owner-adoption-hash.mjs` from `cd7bbc2` to `dc3607e`.
Re-freeze because the bytes intentionally changed, never to make a red gate
green — the nine differing files are enumerated under step 4 and each one must
stay explainable.

Then the full scope, following the T-009 closing-requalification discipline:

- three adjacent detached worktrees at the exact new heads, so package links,
  the pin verifier and every lane load the same frozen sources;
- disposable databases created empty and destroyed after the run (do not touch
  the existing `nurture-postgres` on `127.0.0.1:5433` or
  `codex-q4b5-mychat-pg` on `55439`);
- all Nurture migrations replayed from empty with an empty `migrate diff`;
- every lane at the merged census, plus the assert suite, the deterministic
  surface-contract rebuild, `tsc --noEmit` and the pin verifier;
- the branch's own gates: `verify:c30-i3-upstream`,
  `verify:c30-i3-default-off`, `verify:c30-i3-owner-adoption` — note that
  `verify-c30-i3-upstream.mjs` hardcodes the pre-merge sibling heads and MUST
  be updated to the merged heads as part of Step 3 or Step 4;
- the default-off census re-proven.

## What this unlocks

The Step 5 record is the current-pin evidence that T-002's owner path has
lacked since the T-009 rotations. It is what restores the G4-0A ledger row
from `DEFINED_UNQUALIFIED` to `PRESENT_PINNED`
(`dev-docs/active/nurture-institution-surfaces/07-g4-0a-inventory-record.md`,
"Pin Rebind"), which is why option C was chosen over the two T-007 0C paths on
2026-08-08.

## What this does not authorize

Landing C30 does not start or complete `C30-I4`, open C31-C35, satisfy any
T-007 G4 gate, create a Service Candidate, or authorize persistent database
apply, capability activation, deployment, Pilot or traffic. Every C30
capability remains default-off. After Step 5, only a separately authorized
`C30-I4` scope review is eligible.

## Risks

| Risk | Note |
| --- | --- |
| **The staleness clock** | My-Chat's branch is already 22 commits behind an actively developed main (`e655fc5` on 2026-08-08 is same-day family-growth work). This gap widens daily and is the single largest cost driver. Land Step 2 sooner rather than later. |
| Governance boundary | My-Chat and My-Workflow-Base have their own `.ai/project/` hubs and task flows. Steps 1 and 2 belong to those repositories' own processes, not to a Nurture session acting on their behalf. |
| Enum ordinal ordering | `AuditAction` ends with all eight values, but the final ordinal order depends on application sequence. Harmless unless some consumer depends on enum ordering — worth one grep during Step 2 rather than an assumption. |
| Stale hardcoded gate | `verify-c30-i3-upstream.mjs` will fail until its two hardcoded heads are updated. Failing to update it blocks Step 5; updating it carelessly would silence the very check that caught this problem. |
| Requalification surprises | Steps 1-4 are now low-risk: conflict sets enumerated, objects proven disjoint, symbols verified present. The genuine unknown is how much fails when Step 5 actually executes. |

## Open questions

1. Do Steps 1 and 2 run in their own repositories' sessions, or does one
   session drive all three? The plan assumes the former.
2. Should the Nurture pin rotation (Step 3) be its own commit or ride with
   Step 4's restore? T-009 batched pin rotations with their requalification
   round; the same shape probably applies.
