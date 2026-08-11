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
- T-007 critical path (in dependency order): qualify the G4-E E7 additive
  migration on an approved disposable PostgreSQL target (approval granted
  2026-08-11 in the planning session; record execution evidence in the task
  bundle when run) → G4-E E8 joint conformance with My-Chat T-040, no traffic →
  G4-D I3 authenticated owner adapters + formal ingress → I4 joint conformance
  → G4-F Exit. The prepared-command migration remains
  `NOT_RUN_APPROVAL_PENDING` until the E7 run; `live_qualified=false` stays a
  separate activation gate — recorded/synthetic transport is never live
  evidence.
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

1. **Run the E7 disposable qualification** (exact authority, concurrency
   consume/replay, expiry scrub, status/drift, destroy) and record it.
2. **Run G4-E E8 joint conformance without traffic**, then issue the G4-E Exit.
3. **Begin T-010 I4-C1**: additive Prisma diff, review-only, no apply.
4. **Execute C30 requalification Step 5** for T-002.
5. `NurtureInstitutionPolicyService` and the G4-D commands still have no
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
