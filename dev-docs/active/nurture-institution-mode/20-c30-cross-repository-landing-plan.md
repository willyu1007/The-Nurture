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
| My-Chat | `codex/T-035-scenario-host-adoption` | `cd7bbc2623dff8621c2c7155b04d1bf759e8404a` | 23 / 22 | 192 files, +26562/-698 | 11 (9 derived, 2 real) |
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

### Step 2 — My-Chat

Merge `codex/T-035-scenario-host-adoption`. Eleven conflicts:

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

### Step 3 — Rotate the Nurture pins

Update `docs/project/integrations/my-chat-workflow-contract.json` to the new
merged My-Chat and Base heads, refresh the contract parity hash and the
`x5_joint_api` / `wave4_binding_host` source pins, and re-freeze the Nurture
self-pin.

### Step 4 — The Nurture

Revert the revert. `git revert faee71d` restores merge `915fa4c` together with
its already-completed conflict resolution:

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

Scope, following the T-009 closing-requalification discipline:

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
