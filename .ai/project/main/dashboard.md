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
- Other active tasks: T-002 (`C30-I0` cross-repository C/D pending);
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

1. Select the next implementation unit. T-007 G4-0C (Authority & Surface
   Contracts) is the unblocked candidate; a narrower `0C-min` fast lane is
   proposed in
   `dev-docs/active/nurture-institution-surfaces/09-0c-min-fast-lane-proposal.md`
   and requires a separate decision.
2. Rebind G4-0A's exact-input table to `1.17.0` / My-Chat `df7a273…` /
   Base `8a3ea90…` before any 0C freeze record is issued.
3. Preserve T-006 and T-009 as done and archive them only after explicit
   approval; resume T-002 `C30-I0-C/D` when prioritized.

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
