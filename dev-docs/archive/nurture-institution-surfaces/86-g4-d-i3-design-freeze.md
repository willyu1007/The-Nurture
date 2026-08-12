# 86 — G4-D I3 design freeze

- Date: 2026-08-11
- Task: T-007 nurture-institution-surfaces (Stage G4-D, I3)
- Status: `G4_D_I3_DESIGN_FROZEN` — implementation may start; nothing here
  activates a capability, weakens a gate or authorizes a durable apply
- Inputs: register Next-steps I3 item; records
  [`61`](./61-g4-d-increment-5-record.md),
  [`63`](./63-g4-d-i2-b-surface-adapter-record.md); 0E freezes
  [`50`](./50-g4-0e-1-workflow-inquiry-freeze.md)–ff.; the G4-E formal-ingress
  precedent ([`82`](./82-g4-e-e7-formal-ingress-contract-audit.md))

## Scope restated

I3 binds the authenticated My-Chat prospective-contact / native-source /
current-owner providers and the formal scenario-service ingress for the
Enrollment Journey surface (3 queries + 21 commands at
`nurture.surface-contract@1.20.0`), retains the exact option/confirmation
heads and the default-off runtime gate, and qualifies on an approved
disposable database. Caller-supplied trusted fields remain forbidden; every
owner fact enters only through the binding port.

## Frozen decisions

1. **Formal ingress lane = trusted verified-invocation (G4-E shape).**
   Record 61 requires authenticated My-Chat transport/signature/nonce
   verification and record 82 already rejected carrying credentials through
   ordinary `internal_api_handlers`. I3 therefore adds three trusted
   operations — `nurture.enrollment_journey.query`,
   `nurture.enrollment_journey.command.prepare`,
   `nurture.enrollment_journey.command.execute` — mirroring the Institution
   Knowledge formal ingress (manifest `scenario_contracts.trusted_invocation`
   entries, typed handlers in the module's `trusted_invocation_handlers`,
   declaration-drift fail-closed). The `surface_mapping.enrollment_journey`
   rows move from the internal `query_handler_key`/`command_handler_key`
   shape to the endpoint-key shape used by
   `web_run_workbench.institution_knowledge`, staying
   `enablement_policy: disabled`. The existing
   `nurture.internal.query/execute_enrollment_journey` internal bridge is
   removed in the same change (single formal track, no compatibility alias) —
   the same single-track discipline the knowledge lane followed.
2. **Provider decomposition = three upstream owners composed into one
   binding implementation** (the G4-E owner-binding shape):
   - `prospectiveContactOwner` — resolves the Host-owned opaque contact ref
     and safe label for `start_enrollment_inquiry`
     (`current_prospective_contact_authority` head). **This is the only net-new
     My-Chat capability**: the pinned sibling has no
     enrollment/prospective/contact provider, so a
     `nurture-enrollment-contact-owner` module is implemented in My-Chat
     first, following the `nurture-teacher-release-owner` /
     `nurture-binding-owner` factory pattern, and the workflow-contract pin is
     rotated once afterwards.
   - `nativeSourceOwner` — reuses Nurture's existing
     `InstitutionBusinessCommunicationReadPort` (owner-read projection,
     `current_business_message_visibility` head) behind the existing
     default-off `NURTURE_INSTITUTION_BUSINESS_COMMUNICATION_READ_ENABLED`
     posture; no second communication track.
   - `currentOwnerProvider` — the guardian/pair/grant/formalization snapshots.
     Pair and formalization evidence consume the existing My-Chat wave4
     binding endpoints' `ScenarioCurrentOwnerBindingPairEvidenceV1` through
     the existing C30 verification primitives
     (`assertScenarioCurrentOwnerBindingPairEvidenceV1`, detached Ed25519,
     nonce); local current-authority rereads use the I1 repositories
     (`PrismaEnrollmentPairOwnerRepository` gains an index export).
3. **Confirmation consumption = a durable enrollment prepared-command
   ledger**, isomorphic to the E7 knowledge ledger: one additive migration
   (deduplication, expiry with the scrubbed-form CHECK branch learned from
   `DR-E7-01`, atomic consume, exact replay, confirmation-reuse rejection),
   consumed in the same transaction as the I1 effect exactly as record 63
   requires. `direct_commit` capabilities bypass the ledger; `reviewable` and
   `strong` confirmation classes go through it. The migration + repository land
   together in the next Nurture-side I3 step (they are not committed ahead of
   their consumer to avoid an orphan table); the migration then follows the E7
   protocol — disposable-qualified, durable apply approval-gated.
4. **Heads and gates are untouched.** The 24 capabilities' option/confirmation
   heads stay byte-identical in the capability registry; the four gate layers
   (registry dependency rows, generated manifest, fail-closed default deps,
   `enablement_policy: disabled`) stay in place; the structural censuses
   (`assert-formal-ingress-contract.mjs` unrouted-gate set, harness/OpenAPI
   inventories, test-routing counts) are updated in the same commits that
   change what they census.

## Order of work

Landed in this checkpoint: the My-Chat prospective-contact owner (My-Chat
`83c4647`, its own disposable qualification) and the single pin rotation that
adopts it (`my-chat-workflow-contract.json` → My-Chat
`83c4647ccea646d33d33fb1980bafbb257a54ab2`, `x5_joint_api` `3c23eef3…`).

Next Nurture-side I3 step (one coherent change, so the ledger table lands with
its consumer): enrollment prepared-command migration + repository + the
three-provider composition (`prospectiveContactOwner` over the adopted
My-Chat owner, `nativeSourceOwner` over the existing
`InstitutionBusinessCommunicationReadPort`, `currentOwnerProvider` over
`PrismaEnrollmentPairOwnerRepository` + `ScenarioCurrentOwnerBindingPairEvidenceV1`)
+ formal trusted ingress + censuses → disposable qualification with the
five-artifact db evidence set (`artifacts/db/t007-enrollment-journey-owners/`)
→ I3 qualification record. I4 joint conformance runs only after every I3 path
qualifies.

## Boundary carried into this checkpoint

`verify:c30-i3-upstream` compares the C30-I3 adoption lock
(`docs/project/integrations/c30-i3-owner-adoption-lock.json`, `host.head`
still `ae563988`) against the sibling head; after this pin rotation to
`83c4647` that check reports a head delta. That lock belongs to the T-002 C30
requalification track (Step 5) and is refreshed there, not by G4-D I3; the
workflow-contract pin used by build/lint/x5 is green.
