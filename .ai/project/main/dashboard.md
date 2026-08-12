# Project Dashboard

Project: `main`

## Focus (index)
- Keep this section concise.
- Do not place semantic extraction body here; semantic details live in `feature-map.md` `Semantic Feature Briefs`.

### Current Focus

- Active tasks: T-007 (institution surfaces, primary), T-010 (family-sharing
  eligibility), T-002 (institution-mode owner gates). T-008 stays planned until
  the complete T-007 G4 Exit plus separate authorization.
- Archived baseline (2026-08-11 approval): T-001, T-003, T-004, T-005, T-006,
  T-009. Their exact Exit/handoff identities are unchanged and remain citable —
  G1 `nurture.surface-contract@1.7.0`, G2 `1.8.0`, G3 `1.15.0`, T-009
  `REQUAL_PASS` at `860f73f` / `1.17.0`. Consuming tasks keep referencing them
  by exact pin; archival moves change no evidence.
- Current surface identity: `nurture.surface-contract@1.20.0` /
  `sha256:35d6340f…` (shared core `sha256:7bd8a82d…`, 65 capabilities /
  6 surfaces).
- T-007 critical path: **G4-E is closed** (`G4_E_EXIT_PASS_ADAPTER_QUALIFIED`,
  records 83/84/85) and an independent Codex review of the E7/E8 range is
  resolved — nine findings fixed and re-qualified on fresh disposables
  (production DB 400/400, x5 24/24, E8 12/12); the read owner was rewritten for
  deterministic feed ordering, opaque cursors, watermark reconciliation and
  page batching (records 84 post-review, 04-verification 2026-08-12).
  **G4-D I3 is qualified** (`G4_D_I3_QUALIFIED_DEFAULT_OFF`, record 87,
  2026-08-12): the enrollment prepared-command ledger, the three-provider
  composition (prospective-contact / native-source / current-owner), the
  transactional command executor (consume inside the I1 effect transaction,
  record 63) and the formal trusted ingress landed as one coherent change;
  the internal bridge is removed with no alias, and the disposable
  qualification passed (39/39 deploy, targeted 3/3, full DB 403/403, drift
  zero, `DR-I3-01` repaired pre-apply). The subsequent I4-A protocol gap is
  now locally repaired at Nurture `5d489ac` and My-Chat `9ac8f16`: Host reserve
  creates no Run/event, signed Nurture execution records historical settlement,
  writer-fenced no-effect and Host confirm/abandon are exact and default-off.
  Next: execute the serialized two-database negative/replay/race matrix, then
  G4-F. Durable environment apply remains approval-gated;
  `live_qualified=false` stays a separate activation gate.
  Note: the pin rotation leaves the C30-I3 adoption lock host head at
  `ae563988` — refreshed by the T-002 C30 Step-5 track, not by G4-D I3.
- T-010: I4-C1 is reviewed; I4-C2 current-authority SQL and I4-C3 private
  transport/cleanup owner are contract-qualified. The C4 production-shape
  runner is ready and refuses generic/non-empty/unapproved targets. Next is
  execution on one approved disposable database plus exact My-Chat joint
  grant/withdrawal/replay/response-loss/cleanup conformance.
- T-002: execute C30 three-repository requalification Step 5 so recorded
  acceptances become current-pin evidence; afterwards only a separately
  authorized C30-I4 scope review is eligible. C31–C35, D, Pilot remain closed.
- Cross-repo contract supply order (decided 2026-08-11): parent-context
  presenter first (unblocks the My-Chat parent institution tab), then IR-C01
  parent-communication gates, then the director presenter. Joint design for the
  guardian-decision callback (transport 1.0.0 has none; teacher queue stops at
  `pending`) starts in the next sprint and must conclude before any T-008 G5-A
  Candidate Freeze.
- Boundaries: Candidate Freeze, persistent deployment, activation and external
  traffic remain unauthorized; every capability stays default-off.
- Semantic detail: see `feature-map.md` F-002 through F-005 briefs.

### Next Governance Checkpoint

1. **Execute T-007/T-041 I4-A qualification** on one approved disposable
   My-Chat/Nurture database pair; preserve default-off and unknown quarantine.
2. **Execute T-010 I4-C4** on its separate approved empty disposable target,
   then run the exact My-Chat joint cleanup matrix.
3. **Execute C30 requalification Step 5** for T-002.
4. If all three gates pass, freeze T-007 G4-F inputs and execute its final
   integration/privacy/false-empty census. No result authorizes activation.

## Notes (manual)

- Keep this file as a concise focus index. Full semantic narratives belong in
  `feature-map.md`; task execution facts belong in `dev-docs`.

<!-- AUTO-GENERATED:START dashboard -->
## Summary

- Tasks: 10 (planned: 1, in-progress: 3, blocked: 0, done: 0, archived: 6)

## Recent tasks

| Task | Status | Feature | Dev Docs |
| --- | --- | --- | --- |
| T-001 nurture-mvp | archived | F-001 | dev-docs/archive/nurture-mvp |
| T-003 nurture-uiux-pitch | archived | F-002 | dev-docs/archive/nurture-uiux-pitch |
| T-004 nurture-surface-contract-foundation | archived | F-003 | dev-docs/archive/nurture-surface-contract-foundation |
| T-006 nurture-child-care-boards | archived | F-003 | dev-docs/archive/nurture-child-care-boards |
| T-007 nurture-institution-surfaces | in-progress | F-003 | dev-docs/active/nurture-institution-surfaces |
| T-009 nurture-family-growth-provider | archived | F-004 | dev-docs/archive/nurture-family-growth-provider |
| T-010 nurture-family-sharing-eligibility | in-progress | F-005 | dev-docs/active/nurture-family-sharing-eligibility |
| T-002 nurture-institution-mode | in-progress | F-002 | dev-docs/active/nurture-institution-mode |
| T-008 nurture-store-beta-readiness | planned | F-003 | dev-docs/active/nurture-store-beta-readiness |
| T-005 nurture-family-care-conversation | archived | F-003 | dev-docs/archive/nurture-family-care-conversation |
<!-- AUTO-GENERATED:END dashboard -->
