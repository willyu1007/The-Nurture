# Project Dashboard

Project: `main`

## Focus (index)
- Keep this section concise.
- Do not place semantic extraction body here; semantic details live in `feature-map.md` `Semantic Feature Briefs`.

### Current Focus
- Primary feature: F-003 Six-surface store-beta readiness
- Supporting feature: F-002 Institution ecology
- W0 governance (2026-08-01): T-004 is done at exact
  `nurture.surface-contract@1.7.0` /
  `sha256:b7691a814c2e3cc1f6cc0a906d1ea18bdb2104c1f8ee2adcd1db57336f03b641`;
  T-007 G4-0A inventory is PASS and G4-0B freezes
  `nurture.institution-publication-policy@1.0.0`; T-008 freezes Beta Profile v0
  as `nurture.six-surface-beta-profile@0.1.0`.
- Implementation mainline: T-005 G2 Exit is PASS and the task is done. Exact
  `nurture.surface-contract@1.8.0` / `sha256:4fe91e13…` is Nurture-provider
  qualified against the pinned owner path, with single-writer/default-off guards.
  T-006 G3-0 is frozen as `G3_0_FREEZE_PASS`; G3-A, G3-B1, G3-C1 and G3-D are
  delivered. The 2026-08-02 readiness review is `G3_E_NOT_READY`, so the current
  critical lane is the G3-E preparatory checkpoint rather than G3-E itself.
  Of its blockers, B1 (DB SSOT delta), B2 (all fourteen owner ports including
  the atomic per-target release) and B3 (capture read port) are closed; B4 is
  partial — the six query capabilities and two board writes are routed on the
  formal ingress, and the ingress now admits each capability at its own exact
  registered version. B8's serial foundation unit landed on 2026-08-03 — the
  shared write-spec factory, a per-capability ingress descriptor table that makes
  admitting an unservable key a type error, and `cancel_publish_process` end to
  end on real PostgreSQL — followed by Lane A, the four edit-lane capabilities.
  A 2026-08-03 survey then split the eleven that remain: eight are routable and
  still need an owner write transaction and a command spec each, while
  `release_publish_process`, `reschedule_publish_process` and
  `organize_care_capture_batch` cannot be routed in B8 at all — the first needs
  a multi-command ingress shape, the second waits on the T-007 provider, and the
  third needs a contract decision on its CareGroup binding and outcome enum.
  An independent review of the landed work produced 46 findings; 2 did not hold,
  2 held in part, the rest are fixed or recorded. The sharpest were public
  results carrying raw identifiers, a page cursor readable without a key, and a
  T-005 CHECK constraint silently dropped with its column — each now has a
  mechanical check that was falsified before acceptance.
  Every checkpoint rotated the artifact additively, now at
  `nurture.surface-contract@1.13.0` / `sha256:1919a289…` — shared core and every
  T-005 capability slice stay byte-identical, so the G2 Exit evidence is preserved.
  The G3 adoption set is closed; the G3-C2 face matcher remains unimplemented
  and unregistered, and no real policy-backed schedule or release is claimed.
  T-006 G3-E must still adopt this exact provider on the real owner path and
  cannot infer adoption from T-005 completion.
- Boundary: G1 PASS opens protected implementation only. Candidate Freeze,
  persistent deployment, activation and external traffic remain unauthorized.
- Brief references: `feature-map.md` → `F-002 Institution ecology` and
  `F-003 Six-surface store-beta readiness`

### Coordination Signals
- Blocking dependency: six `TR-P0` plus three `TR-P1` traffic-readiness blockers, strict C30-C35 then C40-C45 qualification, D implementation/complete-candidate assembly, and Pilot-0-E are required before any Pilot-1 decision. The locked ECS/Compose path makes private Alibaba ACR a Pilot-1 prerequisite, not a current action.
- Six-surface owner gate: formal NestJS M3 now supplies the default-disabled
  private owner endpoint plus exact consumer, one atomic
  reservation/authority/Receipt transaction, replay/revoke/privacy and
  lock-concurrency evidence. M4 governance is complete. M5 is complete: the
  handoff is regenerated (`16-owner-integration-handoff-m5.md`) and the
  Fastify P7 route is removed — the formal service is the only owner
  ingress. G1 Joint Conformance is PASS
  (`18-g1-joint-conformance-record.md`), so the owner gate for protected
  T-005～T-007 implementation is satisfied; activation stays separately
  gated.
- T-004 Phase 0-4: the reuse/extend/gate matrix is
  `dev-docs/active/nurture-surface-contract-foundation/06-phase-0-discovery-and-gate-matrix.md`.
  Phase 1 freezes six surfaces, descriptor/envelope schemas, visibility, four
  readiness axes and atomic snapshot/cursor rules. Phase 2 adds the closed
  ten-capability V1 registry, typed invocation/result/error/private bindings
  and strict loader/admission. Phase 3 adds the PII-free synthetic world,
  six independent journey scripts (one value loop plus one highest-risk
  refusal each), five selection-fixture families and eight fixture slices in
  the conformance manifest. Phase 4 adds the conformance-case registry
  (25/25 slice coverage, optional `T###-AC-###` back-links) and the
  single-command suite `pnpm verify:surface-conformance`, now CI's permanent
  gate. Qualified exact identity: `nurture.surface-contract@1.7.0` /
  `sha256:b7691a814c2e3cc1f6cc0a906d1ea18bdb2104c1f8ee2adcd1db57336f03b641`
  (record and T-008 handoff:
  `08-phase-4-synthetic-qualification-and-handoff.md`). T-004 is now done; any
  additive rotation is owned and requalified by the consuming T-005～T-007 task.
  The drift census and pin-advance evidence are
  `dev-docs/active/nurture-institution-mode/15-mychat-drift-census-pin-advance-input.md`.
- T-002 ingress M0-M4: port semantics, the two-route formal v1 surface, G1-03
  satisfied/deferred census and zero-wire-change fence are fixed in
  `dev-docs/active/nurture-institution-mode/13-nestjs-ingress-m0-decision-record.md`.
  The compiled shared composition, real controller, application parity, exact
  pinned consumer and isolated PostgreSQL journeys are green. M4 publishes the
  implementation into API/env/port governance with mechanical CI gates.
- Parallelism: G1 start opens T-005～T-007 design/pure-domain/synthetic work;
  Contract Boundary opens exact public-contract implementation, Owner Readiness
  opens isolated real-adapter integration, and Joint Conformance alone opens
  protected qualification/Beta handoff. T-003 feedback is non-blocking.
- Stage G2: T-005 G2-A Core CareInteraction Loop, G2-B lifecycle/Admin owner-read,
  G2-C caregiver direct-interaction and the final pinned-owner/single-writer Exit are
  PASS. The Nurture-side Beta Profile Handoff is
  `14-g2-exit-qualification-and-beta-handoff.md`; it grants no Candidate, activation
  or traffic authority. T-006 `direct_interaction_required` remains unavailable until
  exact real-consumer adoption in G3-E.
- Stage G3: T-006 is split into G3-A shared boards, G3-B capture/draft, G3-C
  content/media safety, G3-D publish/release and G3-E integration qualification.
  Deterministic/manual lanes are required; AI copy and face match are optional unless
  the beta profile says otherwise. G3-E requires exact G2-C and the T-007
  publication-policy subset without making full T-007 a serial prerequisite.
  Overall audit is PASS. G3-0 froze the contract/fact/schema set and G3-A～G3-D
  are delivered, so remaining work is the G3-E preparatory checkpoint. Its serial
  foundation unit — a shared write-spec factory and a per-capability dispatch
  table — is landed together with the first write capability; what follows is
  three genuinely disjoint owner-aggregate lanes; the first of them (edit) is
  landed, leaving organize, attribution and post-release safety, then the rest of
  the ingress routing.
- Stage G4: T-007 uses G4-0 rolling contract/fact freeze, G4-A authority/aggregate,
  G4-B role-bound mobile, G4-C Admin Workbench Core, G4-D Enrollment Journey,
  G4-E Knowledge/RAG and G4-F qualification/handoff. The publication-policy subset
  ships first for G3; after branch-specific freezes and G4-A, B/C/D/E may proceed
  in parallel and F is the final join. G4-0A～0G scope/order is accepted; next
  checkpoint moves to G5/T-008. G4 implementation uses I0～I4 gates, package DoD,
  six acceptance dimensions and PASS/limited-pass/NO_GO. Exact G4-0A inventory is
  PASS, G4-0B freezes the publication-policy contract, and G4-0C is next; provider
  implementation and qualification are still pending.
- Stage G5: T-008 uses G5-0 readiness/profile, G5-A Candidate Freeze, G5-B
  deployment/local qualification, G5-C consumer handoff, G5-D parallel iOS/Android
  internal validation and G5-E composite decision/evidence lifecycle. Beta Profile v0
  is frozen at `nurture.six-surface-beta-profile@0.1.0`; tooling remains just-in-time
  and does not enter the current upstream critical path.
- Execution backbone (2026-08-01): the recommended single-mainline order is
  T-004 Phase 0 → T-002 ingress M0-M4 (complete; see
  `12-nestjs-ingress-migration-plan.md`) → T-004 Phase 1-2 (complete) →
  T-002 pin advance to the R3 cut (complete) → T-004 Phase 3-4 (complete;
  synthetic qualification at `1.7.0`) → T-002 M5 handoff regeneration (complete) →
  G1 Joint Conformance → W0 governance (T-004 closure + T-007 G4-0A/0B +
  T-008 Beta Profile v0) → T-005 G2-B → G2-C → G2 Exit (complete) →
  T-006 G3-0 through G3-E → remaining T-007 G4 branches → T-008 G5.
  Beta Profile v0 freezes near G1 Joint Conformance (see T-008 plan).
- Controlled-progress rules (2026-07-31): exactly one lane sits on the critical
  path at any time and is reflected in Current Focus; parallel executors take
  only read-only/design work or disjoint-ownership work without pending shared
  freeze inputs, and never co-write one contract artifact; every work unit
  lands as a verified unit (lint/tests plus docs plus a commit point) or is
  rolled back; human decisions occur only at gates (ingress M0 is closed, Contract
  Boundary, Joint Conformance, each G*-0 freeze, Beta Profile v0).
- Decision deadline: before any DB apply, artifact publication, secret configuration, capability/manifest change, external pilot traffic, staging, production, or GA action.

### Next Governance Checkpoint
- Date: T-006 owner-integration preparation, ahead of G3-E.
- Delivered: G3-0 freeze PASS plus G3-A through G3-D on the additively rotated
  `1.13.0` artifact, followed by an implementation quality pass that unified two
  inconsistent public ref issuers, corrected the publish-queue census, closed the
  scheduler/release retry mismatch and added runtime-to-schema conformance for
  every registered T-006 capability.
- Blocking finding: the G3-E readiness review is `G3_E_NOT_READY`. No
  persistence, owner repository or ingress route exists for any of the 24 T-006
  capabilities, and the T-005 direct-interaction consumer action is unbuilt.
- Expected output: DB SSOT delta plus migration, the fourteen owner
  repositories, the capture-lane port, ingress routing and the T-005 consumer
  action — then G3-E's joint runs with T-007 and T-005 G2-C. No Candidate,
  secret, persistent environment, activation or traffic effect.

## Notes (manual)
- Keep human notes here. Everything below the AUTO section is generated by sync.

<!-- AUTO-GENERATED:START dashboard -->
## Summary

- Tasks: 8 (planned: 2, in-progress: 3, blocked: 0, done: 2, archived: 1)

## Recent tasks

| Task | Status | Feature | Dev Docs |
| --- | --- | --- | --- |
| T-005 nurture-family-care-conversation | archived | F-003 | dev-docs/archive/nurture-family-care-conversation |
| T-006 nurture-child-care-boards | in-progress | F-003 | dev-docs/active/nurture-child-care-boards |
| T-004 nurture-surface-contract-foundation | done | F-003 | dev-docs/active/nurture-surface-contract-foundation |
| T-002 nurture-institution-mode | in-progress | F-002 | dev-docs/active/nurture-institution-mode |
| T-007 nurture-institution-surfaces | planned | F-003 | dev-docs/active/nurture-institution-surfaces |
| T-008 nurture-store-beta-readiness | planned | F-003 | dev-docs/active/nurture-store-beta-readiness |
| T-003 nurture-uiux-pitch | in-progress | F-002 | dev-docs/active/nurture-uiux-pitch |
| T-001 nurture-mvp | done | F-001 | dev-docs/active/nurture-mvp |
<!-- AUTO-GENERATED:END dashboard -->
