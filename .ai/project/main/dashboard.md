# Project Dashboard

Project: `main`

## Focus (index)
- Keep this section concise.
- Do not place semantic extraction body here; semantic details live in `feature-map.md` `Semantic Feature Briefs`.

### Current Focus

- Active tasks: T-002 (institution-mode owner gates, holding after C30), T-008
  (G5-0, final shared-input revision reconciliation and G5-A Candidate Freeze
  complete; G5-B awaits separate authorization), and T-011
  (cross-repo contract supply and guardian-decision callback). Completed T-012
  makes the scenario service the sole normal local runtime while keeping the
  Fastify harness explicitly legacy and removal-gated. T-007
  and T-010 are archived with their exact default-off exits retained.
  2026-08-13 owner decision: authorizations and quota budgets released for the
  agreed sequencing — T-008 G5-0 is complete after the T-011 W1/W2 supply
  steps; C31 stays deferred until after a separately authorized G5-A Candidate
  Freeze. Durable apply, activation, deployment and traffic keep their own
  per-gate decisions.
- Archived baseline (2026-08-11 approval): T-001, T-003, T-004, T-005, T-006,
  T-009. Their exact Exit/handoff identities are unchanged and remain citable —
  G1 `nurture.surface-contract@1.7.0`, G2 `1.8.0`, G3 `1.15.0`, T-009
  `REQUAL_PASS` at `860f73f` / `1.17.0`. Consuming tasks keep referencing them
  by exact pin; archival moves change no evidence.
- Current surface identity: `nurture.surface-contract@1.20.0` /
  `sha256:35d6340f…` (shared core `sha256:7bd8a82d…`, 65 capabilities /
  6 surfaces).
- T-007: `G4_F_EXIT_PASS_DEFAULT_OFF /
  T007_BETA_PROFILE_HANDOFF_ISSUED` (records 95/96). G4-D I4 now includes the
  production native-source owner, exact Admin Web/mobile-query and Guardian
  chat/mobile/formalization lanes, consumed replay and current-owner negatives.
  Final evidence passes 41 migrations, 444 production-DB tests, 1050 unit tests
  and three consecutive 37/37 x5 runs. The T-002 lock is resealed at My-Chat
  `2d415ce` / owner aggregate `856cd6c6…`; disposable targets and ignored build/
  test artifacts were removed. Durable apply, `live_qualified`, Candidate
  Freeze, activation and traffic remain separate gates.
- T-010: closed and archived 2026-08-13 at `I4_C4_EXIT_PASS_DEFAULT_OFF /
  EXACT_OWNER_CONSUMER_AND_CLEANUP_QUALIFIED`. The approved disposable run
  passed 39/39 migrations, 12/12 production-shape cases and zero synthetic
  residue; the joint My-Chat/Nurture suite passes 5/5 and the full x5
  population 35/35. Durable apply, deployment, activation and traffic remain
  separate, unauthorized decisions.
- T-002: `C30_CURRENT_PIN_REQUAL_PASS`; record 26 is authoritative, with its
  2026-08-13 T-042 content-reseal addendum: Base `536638a`, My-Chat `b90cce2`
  (x5_joint_api rotated by the authorization-hardening batch; contract parity
  and wave4 unchanged) and Nurture owner lock `fbbc34c6…` sealed by
  `170edd4`. C31–C35, D and Pilot remain closed.
- Cross-repo contract supply order (decided 2026-08-11): parent-context
  presenter, IR-C01 parent-communication P0 and the read-only director
  presenter are now published, exact-pin adopted and default-off. W3 live local
  owner ports are qualified; deployment/current-context secrets/private path
  and native/accessibility evidence remain W3.2 gates. W4 real owner ports,
  public API/Mobile composition, deployment and device evidence remain later
  gates; Institution Mobile stays action-free and director operations stay Web.
  This supply line and
  the guardian-decision callback joint design (transport 1.0.0 has none;
  teacher queue stops at `pending`) are now owned by T-011; the callback
  design is frozen and satisfied the G5-A precondition, while implementation
  remains optional-absent/default-off.
- Boundaries: G5-A Candidate Freeze is complete; persistent deployment,
  qualification, activation, internal-test enablement and external traffic remain
  unauthorized, and every capability stays default-off.
- Semantic detail: see `feature-map.md` F-002 through F-005 briefs.

### Next Governance Checkpoint

1. **G5-A is frozen** at `nurture.service-candidate@1.0.0` /
   `sha256:c739f929…`, source `e6aba37…`, executable `sha256:74bb40c7…`.
   Keep every provider/consumer/config gate false; the Candidate is undeployed
   and unqualified.
2. **G5-B Deployment Binding & Local Qualification** is the next serial gate
   and requires separate authorization. G5-C may prepare in parallel but cannot
   issue its final handoff before readback-verified Binding. Synthetic token,
   Q3 live qualification and dual-platform devices remain G5-D inputs.
   **Continue T-002 only from C31** under its own authorization. No result
   authorizes durable apply, activation, deployment or traffic.

## Notes (manual)

- Keep this file as a concise focus index. Full semantic narratives belong in
  `feature-map.md`; task execution facts belong in `dev-docs`.

<!-- AUTO-GENERATED:START dashboard -->
## Summary

- Tasks: 12 (planned: 0, in-progress: 3, blocked: 0, done: 1, archived: 8)

## Recent tasks

| Task | Status | Feature | Dev Docs |
| --- | --- | --- | --- |
| T-012 legacy-host-retirement | done | F-003 | dev-docs/active/legacy-host-retirement |
| T-007 nurture-institution-surfaces | archived | F-003 | dev-docs/archive/nurture-institution-surfaces |
| T-008 nurture-store-beta-readiness | in-progress | F-003 | dev-docs/active/nurture-store-beta-readiness |
| T-010 nurture-family-sharing-eligibility | archived | F-005 | dev-docs/archive/nurture-family-sharing-eligibility |
| T-011 nurture-cross-repo-contract-supply | in-progress | F-003 | dev-docs/active/nurture-cross-repo-contract-supply |
| T-001 nurture-mvp | archived | F-001 | dev-docs/archive/nurture-mvp |
| T-003 nurture-uiux-pitch | archived | F-002 | dev-docs/archive/nurture-uiux-pitch |
| T-004 nurture-surface-contract-foundation | archived | F-003 | dev-docs/archive/nurture-surface-contract-foundation |
| T-006 nurture-child-care-boards | archived | F-003 | dev-docs/archive/nurture-child-care-boards |
| T-009 nurture-family-growth-provider | archived | F-004 | dev-docs/archive/nurture-family-growth-provider |
| T-002 nurture-institution-mode | in-progress | F-002 | dev-docs/active/nurture-institution-mode |
| T-005 nurture-family-care-conversation | archived | F-003 | dev-docs/archive/nurture-family-care-conversation |
<!-- AUTO-GENERATED:END dashboard -->
