# Project Dashboard

Project: `main`

## Focus (index)

### Current Focus

- Primary active feature: F-002 Institution ecology (T-002). The
  `codex/T-002-c30-i0` branch is merged into `main` on 2026-08-08, carrying
  `C30-I0` complete plus cumulative `C30-I1`, remediated `C30-I2` and
  `C30-I3` accepted default-off. **The merged tree is not yet requalified** —
  see the checkpoint below.
- Completed checkpoints: T-009 provider is `done` at `860f73f` with closing
  `REQUAL_PASS`; T-006/G3 is `done` at `0374087…` (merged `447e646`).
  Both await separately approved archival.
- Current exact identity: `nurture.surface-contract@1.17.0` /
  `sha256:d22851d9…` (shared core `sha256:7bd8a82d…`, 33 capabilities /
  6 surfaces), self-pin `c0f97aec…`, at My-Chat `df7a273…` / Base
  `8a3ea90…`, contract parity `8dd53be4…`. The `1.16.0` cession batch and
  the `1.17.0` queue-overlay rotation have both landed; no contract batch
  is open. The T-002 merge does not touch the surface-contract registries.
- Cross-repo posture: `family_growth_transport@1.0.0` is frozen and the
  N8 fixtures pass jointly against the real My-Chat consumer. My-Chat T-031
  owns the remaining consumer half; the guardian planning surface is ceded
  to My-Chat cultivation (D-T009-01), executed at `1.16.0`.
- Primary active task: T-002 — C30 landed on 2026-08-08 as one coordinated
  three-repository sequence (plan and per-step evidence in
  `dev-docs/active/nurture-institution-mode/20-c30-cross-repository-landing-plan.md`).
  Base main `4350086…`, My-Chat main `dc3607e…`, Nurture pins rotated
  (`d33276a`), Nurture merge restored. `C30-I0` through `C30-I3` are accepted
  default-off on the branch's own evidence. **Step 5, the single
  three-repository requalification, is outstanding** — until it passes, no
  C30 acceptance is current-pin evidence.
  T-003 handed its presenter/action contracts to My-Chat T-036 (D-T009-06)
  and is `done`.
- Planned chain: T-007 G4-0C is now the next unblocked unit (D-T009-05
  satisfied); T-008 still waits for the complete T-007 Exit.
- Pin-rotation consequence: the T-007 G4-0A inventory record binds the
  superseded `1.7.0` / My-Chat `a019566` / Base `06303e9` inputs. Any 0C
  work MUST rebind 0A's exact-input table to the current pins before
  issuing a freeze record.
- Boundaries: Candidate Freeze, persistent deployment, activation and external
  traffic remain unauthorized; everything T-009 added stays default-off.
- Semantic detail: see `feature-map.md` F-002, F-003 and F-004 briefs.

### Next Governance Checkpoint

1. **Run the single three-repository C30 requalification (step 5).** Steps 1-4
   landed on 2026-08-08: Base fast-forward, My-Chat merge, Nurture pin
   rotation, Nurture merge restore. Step 5 is the only remaining unit and
   nothing about C30 counts as current-pin evidence without it. Scope and
   discipline are in
   `dev-docs/active/nurture-institution-mode/20-c30-cross-repository-landing-plan.md`:
   detached worktrees at the exact new heads, disposable databases created
   empty and destroyed, all migrations replayed with an empty `migrate diff`,
   every lane at the merged census, the assert suite, the pin verifier, and
   the branch's own `verify:c30-i3-*` gates.
2. That requalification is also what restores the G4-0A owner-path row from
   `DEFINED_UNQUALIFIED` to `PRESENT_PINNED`. Until then no 0C freeze record
   may cite the T-002 G1 record as current-pin evidence.
3. T-007 G4-0C and the `0C-min` proposal in
   `dev-docs/active/nurture-institution-surfaces/09-0c-min-fast-lane-proposal.md`
   stay open behind the T-002 work. Note that option C is now known to be
   larger than it appeared when chosen.
4. Preserve T-006 and T-009 as done and archive them only after explicit
   approval.

## Notes (manual)

- Keep this file as a concise focus index. Full semantic narratives belong in
  `feature-map.md`; task execution facts belong in `dev-docs`.

<!-- AUTO-GENERATED:START dashboard -->
## Summary

- Tasks: 9 (planned: 2, in-progress: 1, blocked: 0, done: 5, archived: 1)

## Recent tasks

| Task | Status | Feature | Dev Docs |
| --- | --- | --- | --- |
| T-003 nurture-uiux-pitch | done | F-002 | dev-docs/active/nurture-uiux-pitch |
| T-009 nurture-family-growth-provider | done | F-004 | dev-docs/active/nurture-family-growth-provider |
| T-002 nurture-institution-mode | in-progress | F-002 | dev-docs/active/nurture-institution-mode |
| T-006 nurture-child-care-boards | done | F-003 | dev-docs/active/nurture-child-care-boards |
| T-007 nurture-institution-surfaces | planned | F-003 | dev-docs/active/nurture-institution-surfaces |
| T-008 nurture-store-beta-readiness | planned | F-003 | dev-docs/active/nurture-store-beta-readiness |
| T-005 nurture-family-care-conversation | archived | F-003 | dev-docs/archive/nurture-family-care-conversation |
| T-004 nurture-surface-contract-foundation | done | F-003 | dev-docs/active/nurture-surface-contract-foundation |
| T-001 nurture-mvp | done | F-001 | dev-docs/active/nurture-mvp |
<!-- AUTO-GENERATED:END dashboard -->
