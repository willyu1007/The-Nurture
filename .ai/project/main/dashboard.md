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
- Other active tasks: T-003 rescoped toward presenter-contract supply,
  artifacts hand to My-Chat T-036 (D-T009-06).
- Planned chain: T-007 G4-0C remains the next surface unit behind T-002; the
  `0C-min` fast-lane proposal in
  `dev-docs/active/nurture-institution-surfaces/09-0c-min-fast-lane-proposal.md`
  is open and unanswered. T-008 still waits for the complete T-007 Exit.
- Pin-rotation consequence: G4-0A's exact inputs were rebound on 2026-08-08.
  The T-002 owner path is `DEFINED_UNQUALIFIED` because its M5/G1 evidence
  binds the superseded `a019566` / `06303e9` pins. The pending T-002
  requalification is what restores it.
- Boundaries: Candidate Freeze, persistent deployment, activation and external
  traffic remain unauthorized; everything T-009 added stays default-off.
- Semantic detail: see `feature-map.md` F-002, F-003 and F-004 briefs.

### Next Governance Checkpoint

1. **Requalify the merged T-002 tree at current pins (critical path).** The
   merge resolved conflicts and regenerated derived artifacts, but ran no
   gates. Required before any T-002 claim is cited: 23 migrations replayed
   from an empty database with an empty `migrate diff`; every test lane at
   the merged census (unit 63 / production-db 29 / dev-host 11 /
   scenario-service 14 / x5-joint 2); the assert scripts; and the pin
   verifier at `1.17.0` / My-Chat `df7a273…` / Base `8a3ea90…`. Migration
   ordering is expected to be order-independent — the 2026-08-06 C30
   migrations and the 2026-08-07 T-009 migrations touch disjoint tables,
   enums and altered columns — but that expectation is unexecuted until this
   run.
2. That requalification record is also what restores the T-002 owner path
   from `DEFINED_UNQUALIFIED` to `PRESENT_PINNED` in the G4-0A ledger, which
   is why option C was chosen over the two 0C paths.
3. After requalification, only a separately authorized `C30-I4` scope review
   is eligible. I4 implementation, C31-C35, deployment and activation remain
   closed.
4. T-007 G4-0C and the `0C-min` proposal stay open behind the T-002 work;
   T-003 may close independently as a short design track.
5. Preserve T-006 and T-009 as done and archive them only after explicit
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
