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
  **G4-D I3 has started** (design record 86): the authenticated My-Chat
  prospective-contact owner
  (`my-chat.nurture-enrollment-prospective-contact-owner@1.0.0`, My-Chat
  `83c4647`) is landed and disposable-qualified, and the pin is rotated to
  adopt it. Next: the Nurture-side owner composition (contact/native-source/
  current-owner), the enrollment prepared-command ledger + repository and the
  formal scenario-service ingress, all landing together with their consumer;
  then I3 qualification, I4 joint conformance and G4-F. Durable apply remains
  approval-gated; `live_qualified=false` stays a separate activation gate.
  Note: the pin rotation leaves the C30-I3 adoption lock host head at
  `ae563988` — refreshed by the T-002 C30 Step-5 track, not by G4-D I3.
- T-010: I4-C1 drafted and independently reviewed (2026-08-12, review-only —
  no apply): authority/policy schema with composite-FK scope pinning and
  at-most-one active-slot partial uniques. Next is I4-C2 (current-authority
  reader); apply stays behind the C4 approved-disposable gate.
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

1. **Continue G4-D I3** (started 2026-08-12, design record 86; My-Chat
   contact owner landed): implement the Nurture owner composition, the
   enrollment prepared-command ledger and the formal ingress, qualify on a
   disposable DB, then run I4 joint conformance.
2. **Begin T-010 I4-C1**: additive Prisma diff, review-only, no apply.
3. **Execute C30 requalification Step 5** for T-002.
4. `NurtureInstitutionPolicyService` and the G4-D commands still have no
   production caller; I1 evidence is not activation evidence.

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
