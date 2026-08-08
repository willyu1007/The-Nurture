# Project Dashboard

Project: `main`

## Focus (index)

### Current Focus

- No primary active implementation task. F-004 (T-009) closed its provider
  side on 2026-08-08; the next unit is a governance selection, not a
  resumption.
- Completed checkpoints: T-009 provider is `done` at `860f73f` with closing
  `REQUAL_PASS`; T-006/G3 is `done` at `0374087…` (merged `447e646`).
  Both await separately approved archival.
- Current exact identity: `nurture.surface-contract@1.17.0` /
  `sha256:d22851d9…` (shared core `sha256:7bd8a82d…`, 33 capabilities /
  6 surfaces), self-pin `c0f97aec…`, at My-Chat `df7a273…` / Base
  `8a3ea90…`, contract parity `8dd53be4…`. The `1.16.0` cession batch and
  the `1.17.0` queue-overlay rotation have both landed; no contract batch
  is open.
- Cross-repo posture: `family_growth_transport@1.0.0` is frozen and the
  N8 fixtures pass jointly against the real My-Chat consumer. My-Chat T-031
  owns the remaining consumer half; the guardian planning surface is ceded
  to My-Chat cultivation (D-T009-01), executed at `1.16.0`.
- Other active tasks: T-002 — the real work lives on
  `origin/codex/T-002-c30-i0` (tip `76ece1f`, 58 commits) carrying `C30-I0`
  complete plus `C30-I1`, `C30-I2` and `C30-I3` accepted default-off, which
  is well past this repository's `C30-I0-C/D pending` task doc. **It is not
  independently mergeable**: a 2026-08-08 merge attempt was reverted
  (`faee71d`) after producing 130 typecheck errors, 80 in `src`. C30 spans
  three repositories and all three sides are unmerged — see
  `dev-docs/active/nurture-institution-mode/05-pitfalls.md` 2026-08-08.
  T-003 rescoped toward presenter-contract supply, artifacts hand to
  My-Chat T-036 (D-T009-06).
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

1. **Decide how to land C30 as one coordinated three-repository sequence.**
   2026-08-08: the `0C-min` proposal was answered with option C — prioritize
   T-002, because its owner path is what both 0C options need re-established
   at current pins. Resuming T-002 showed the work is far past this
   repository's task doc, and a Nurture-only merge was attempted and
   reverted. The three unmerged sides are Nurture `codex/T-002-c30-i0`
   (`76ece1f`), My-Chat `codex/T-035-scenario-host-adoption` (`cd7bbc2`) and
   Base `codex/T-002-c30-i0-base` (`4350086`). The branch's own gate
   (`scripts/verify-c30-i3-upstream.mjs`) hardcodes those two sibling heads
   rather than the repository pins, which is the mechanical signal that it is
   not independently mergeable. Expected order: Base, then My-Chat host
   adoption, then a pin rotation, then Nurture, then one requalification.
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

- Tasks: 9 (planned: 2, in-progress: 2, blocked: 0, done: 4, archived: 1)

## Recent tasks

| Task | Status | Feature | Dev Docs |
| --- | --- | --- | --- |
| T-009 nurture-family-growth-provider | done | F-004 | dev-docs/active/nurture-family-growth-provider |
| T-002 nurture-institution-mode | in-progress | F-002 | dev-docs/active/nurture-institution-mode |
| T-006 nurture-child-care-boards | done | F-003 | dev-docs/active/nurture-child-care-boards |
| T-007 nurture-institution-surfaces | planned | F-003 | dev-docs/active/nurture-institution-surfaces |
| T-008 nurture-store-beta-readiness | planned | F-003 | dev-docs/active/nurture-store-beta-readiness |
| T-005 nurture-family-care-conversation | archived | F-003 | dev-docs/archive/nurture-family-care-conversation |
| T-004 nurture-surface-contract-foundation | done | F-003 | dev-docs/active/nurture-surface-contract-foundation |
| T-003 nurture-uiux-pitch | in-progress | F-002 | dev-docs/active/nurture-uiux-pitch |
| T-001 nurture-mvp | done | F-001 | dev-docs/active/nurture-mvp |
<!-- AUTO-GENERATED:END dashboard -->
