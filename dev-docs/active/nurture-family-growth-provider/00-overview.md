# T-009 Nurture Family Growth Provider

## Goal

Implement the Nurture provider side of the frozen My-Chat
`family growth material` v1 contract: after an explicit per-family
`PublicationRelease`, deliver the release as a
`family_growth_material_release@1.0.0` envelope, propagate
correction/target-removal/redaction as `family_growth_material_lifecycle@1.0.0`
events, and consume the `family_growth_material_admission_receipt@1.0.0`
result — so a teacher photo released in Nurture becomes a long-lived family
growth material that My-Chat organizes.

This is the N1–N8 delivery list from
`nurture-family-growth-delivery-requirements.md` (2026-08-06 freeze).

## Exact Upstream Inputs

1. Contract authority: My-Chat commit
   `d4ed0ce1c58c2f6204bb501cc977ee469e7de890`,
   `dev-docs/active/growth-record/artifacts/family-growth-material-contract-v1.schema.json`
   (+ the prose contract beside it). The envelope schema is frozen at `1.0.0`;
   T-009 must not copy-and-extend it.
2. My-Chat consumer state (at `c5ac6c7`): ingress/admission/material/revision/
   blob/family-asset schema and direct-release intake are implemented;
   HTTP ingress, `FamilyGrowthMediaImporter` and
   `FamilyGrowthAdmissionReceiptDelivery` are open ports; transport is
   explicitly unbound on both sides.
3. Nurture provider base: T-006 G3 Exit (`G3_EXIT_PASS_RESTORED`) at
   checkpoint `0374087…`, now reachable from `main` via merge `447e646`.
   My-Chat's design-evidence pin at Nurture `882d80f…` is therefore stable.
4. Delivery requirements doc: N1 target resolution, N2 per-family
   independence (already satisfied by G3-D), N3 envelope, N4 family
   rendition, N5 outbox-in-transaction, N6 lifecycle events, N7 receipt
   consumption, N8 twelve conformance fixtures.

## Scope

- Canonical child/family target resolution port (fail-closed) used only at
  envelope assembly time; canonical IDs are never persisted into Nurture
  business tables.
- RFC 8785 (JCS) canonicalization + SHA-256 `payload_digest`.
- Envelope assembler from canonical release/revision/target/media facts.
- Immutable per-revision media content digest (schema addition).
- Provider outbox rows written inside the existing per-target release
  transaction; delivery worker with same-event-id/digest retry.
- Lifecycle (correction/removal/redaction) outbound mapping, including the
  display-safe correction unseal-for-provider path.
- Admission-receipt consumption/persistence with `outcome_unknown` as a
  retriable state, surfaced to the teacher publish queue.
- v1 family rendition = protected per-family handle to the exact unchanged
  original media revision (see 02-architecture D-T009-02); derivative
  generation stays out of scope.
- Joint transport addendum (draft in `artifacts/`, frozen with My-Chat before
  wire implementation).
- Surface contract `1.16.0` batch: remove `guardian_current_focus` exposure
  (cession decision), add provider status surface fields, rotate the My-Chat
  pin, one requalification round.

## Non-Goals

- No My-Chat-side implementation (ingress controller, media importer,
  receipt delivery, guardian confirmation) — tracked by My-Chat T-031.
- No derivative/cropped/masked rendition generation (later shared-infra
  enhancement; Nurture keeps binding the exact original revision).
- No family growth archive, cultivation or parent-organization data in
  Nurture; no teacher access to family archives.
- No activation, deployment, Candidate, store or traffic effect; everything
  remains default-off.
- T-007 G4-0C+ and T-008 are unchanged and separately gated.

## Status

- State: in-progress
- 2026-08-07: task created. Conflict-resolution decisions D-T009-01…07
  recorded in `02-architecture.md`. T-006 branch merged to `main`.
  Implementation starts with the transport-independent domain increment (I1).
