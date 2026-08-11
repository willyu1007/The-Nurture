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
- T-007 critical path: **G4-E is closed** —
  `G4_E_EXIT_PASS_ADAPTER_QUALIFIED` at `8d41be1` (records 83/84/85). E7
  disposable qualification passed at `223daa7`; E8 joint conformance drove
  the real Base dispatcher through the real Nurture owners and the real
  My-Chat retrieval/generation/safety owners on fresh disposable targets —
  12/12 matrix plus the full x5 lane 24/24 (T-009 8/8 and T-002 x5 4/4
  included). The new production `PrismaInstitutionKnowledgeReadOwner` closed
  record 82's read-owner blocker. Next: G4-D I3 authenticated owner adapters
  + formal ingress → I4 joint conformance → G4-F Exit. Durable apply remains
  approval-gated; `live_qualified=false` stays a separate activation gate —
  recorded/synthetic transport is never live evidence.
- T-010: I4-C0 qualified. Next is I4-C1 — produce and review an additive
  Prisma diff without database apply; target approval only after migration
  review.
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

1. **Implement G4-D I3** (authenticated My-Chat owner adapters + formal
   ingress, disposable-DB qualification), then I4 joint conformance
   (G4-E closed 2026-08-11 as records 83/84/85).
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
