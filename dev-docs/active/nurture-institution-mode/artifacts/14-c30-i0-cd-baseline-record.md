# C30-I0-C/D Baseline Record

## Verdict

- Date: 2026-08-05
- Task: T-002
- `C30-I0-C`: `COMPLETE`
- `C30-I0-D`: `COMPLETE`
- Overall: `C30_I1_READY_NOT_STARTED`

This record supersedes only the current-state/worktree portions of the 2026-07-21
inventory. The donor disposition remains authoritative: old T-029 work is not merged
as a unit, direct platform refs and umbrella adoption remain prohibited, and C30-I1
does not start from mutable package paths.

## Clean topology

| Repository | Qualified input revision | Source role | State at qualification |
| --- | --- | --- | --- |
| My-Workflow-Base | `20c4b7a7b38bdbec3a273f997bb5a8ec93b09abb` | repaired integration-lock verifier and Base contract source | clean |
| My-Chat | `dc4a77b257f952e2c0f0aede9521e16ac274de9d` | current committed Host source, isolated from the dirty primary file | clean |
| The-Nurture | `cc8b034456121b65a1a575813bd193f72ffa867c` | evidence-only successor over G3-closed runtime checkpoint `882d80f…` | clean |

The Nurture C30 branch was created from runtime checkpoint `882d80f…` and advanced
to the qualified input above only through T-002 evidence documentation. Later
evidence-only documentation may advance the branch without changing the runtime
source population; any later joint run must pin the then-current exact Git HEAD and
recompute the same declared source population hash.

Existing X5, Q4B5, T-029, T-027, release and Claude worktrees were not deleted or
rewritten. Each is clean and remains attributable to its original owner. The only
observed primary-worktree dirt was My-Chat `apps/web/next-env.d.ts`; it was excluded
and untouched.

## Immutable lock evidence

The disposable joint lock used `source=git` for every participant and required exact
checkout HEAD equality. Its normalized path-content hashes were:

| Pin | Logical population | SHA-256 |
| --- | --- | --- |
| Base contract | workflow-contract package metadata, source and schemas | `e2276404811e346bf35688c20b5f7a4ff44ecbdd52fa74eb1769e0da696783cb` |
| My-Chat Host SDK | workflow-contract package metadata, source and schemas | `f675d5059dca93abae2f5006b9b5f6f210babe06cb2fb04bd80108cc1a932dae` |
| Nurture scenario artifact | scenario/DB sources, manifest and production Prisma schema | `d47648e5cb1c8b8d67e1e88f0be307bae75cc267c45b0c6999762fe47ef60d7c` |

The Base verifier now fails closed on symbolic/short revisions, package-path inputs in
joint mode, mismatched checkout HEADs, unknown flags and installed-bin symlink entry
drift. Six focused tests pass. The one-time lock was deleted after successful
verification; the exact values above are sufficient to reconstruct it.

## Repository false/empty evidence

All six locked future C-3 source identities were absent from executable Base,
My-Chat and Nurture paths, for 18 checked combinations:

- `platform_child_family_identity_source_v1`;
- `scenario_interface_source_v1`;
- `scenario_domain_action_source_v1`;
- `scenario_protected_interaction_source_v1`;
- `scenario_notification_continuity_source_v1`;
- `scenario_activation_admission_source_v1`.

The Nurture scenario manifest does not declare `scenario_federation_v1`, and the
My-Chat canonical Prisma schema has no `ScenarioWorkspaceActivation` model. This is
repository false/empty evidence only; no database or environment row census was run.

## Completed build-aware baseline

After explicit authorization, the isolated topology passed the required compiled
baseline:

| Repository | Result |
| --- | --- |
| Base | Full `verify:workflow-contracts`: contract/runtime/scenario/conformance typechecks, canonical-ref lint, 28 runtime tests, 10 scenario tests, all conformance scripts, 6 integration-lock tests and exact source lock. |
| My-Chat | Prisma Client generate/validate with a non-connecting placeholder URL, all 17 workspace typechecks, full lint, and 89 files/504 unit tests; 15 files/58 tests are repository-declared skips. |
| Nurture | Both Prisma Clients and schema validations, build-aware typecheck, frontend lint, 52 files/579 unit tests, 95-file routing census, persistence boundary, N1 schema and X4 replay checks. |

The final disposable joint lock pinned Base `20c4b7a…`, My-Chat `dc4a77b…` and
Nurture `cc8b034…`; all exact revisions and the three hashes above passed. The
18-source repository false/empty census also passed again. The temporary lock was
deleted.

Nurture's historical G1 verifier remains exactly pinned to Base `06303e9…` and
therefore correctly rejects C30 Base `20c4b7a…`. That preserved negative result is
not source drift and is not substituted for the passing C30 joint lock.

`C30-I0-D` is complete. `C30-I1` is eligible for its separately reviewed exact
implementation slice but remains unstarted. This run changed no schema/migration,
database, environment value, secret, capability, deployment, activation,
T-007/T-008, Pilot or traffic state.
