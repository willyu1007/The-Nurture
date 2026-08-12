# 87 — G4-D I3 qualification record

## Verdict

- Date: 2026-08-12
- Task: T-007 nurture-institution-surfaces (Stage G4-D, I3)
- Verdict: `G4_D_I3_QUALIFIED_DEFAULT_OFF`
- Opens: G4-D I4 joint conformance (J3) over the qualified I3 paths; G4-F
  consumes this record as its G4-D input
- Effects: none at runtime — no route, flag, product binding, durable apply
  or traffic; `enablement_policy: disabled` unchanged

## What this record covers

The record-86 coherent change, landed as one commit set:

1. **Enrollment prepared-command ledger** — additive preview-only migration
   `20260812100000_t007_enrollment_journey_prepared_command` (E7-isomorphic:
   dedup unique, DR-E7-01 scrubbed-expiry CHECK branch, 18 ledgered
   capability keys, named FKs), domain owner with lane-scoped crypto
   (`ejc1` confirmations, enrollment-specific HMAC/AEAD domains so knowledge
   and enrollment confirmations can never cross-validate), and a Prisma
   ledger with read-only `readExact` plus transaction-scoped `consumeExact`.
2. **Transactional consumption (record 63/86)** — deliberately different from
   the knowledge lane: the execute handler verifies without consuming
   (`verifyConfirmed`), and the production command executor consumes the
   ledger row inside the same advisory-locked Serializable transaction as the
   I1 effect (`transaction.enrollmentPreparedCommands`, an additive optional
   owner on the command transaction). Ledger failures abort atomically via
   `NurtureDeterministicRollback`; the expiry scrub is re-persisted after an
   aborted attempt. The three `direct_commit` capabilities bypass the ledger
   with an owner-derived deterministic command id (`ejd1.…`) so kernel
   idempotency dedups replays.
3. **Three-provider composition** —
   `prospectiveContactOwner` over the adopted My-Chat owner (new
   `prospective_contact` target-option kind carries the
   `current_prospective_contact_authority` selection; every resolve is a live
   Host reread and version drift denies);
   `nativeSourceOwner` over the existing
   `InstitutionBusinessCommunicationReadPort` through the keyed-ref codec;
   `currentOwnerProvider` verifying wave4
   `ScenarioCurrentOwnerBindingPairEvidenceV1` with the C30 structural
   assertion plus `PrismaEnrollmentPairOwnerRepository` local rereads.
4. **Formal trusted ingress** — the three record-86 operations with
   G4-E-shaped declaration-drift fail-closed handlers; the
   `surface_mapping.enrollment_journey` row moved to the endpoint-key shape
   on `web_run_workbench` only; the `nurture.internal.*` enrollment bridge
   removed with no compatibility alias.
5. **Censuses updated in the same change** — trusted-handler population (9),
   test routing (172 files), G3-0 persisted-table census (including the two
   reviewed T-010 tables the C1 commit had not declared), generated manifest.

## Evidence

- `artifacts/db/t007-enrollment-journey-owners/00-…04-…`: empty-target deploy
  39/39; targeted PostgreSQL suite 3/3 (prepare/verify/transactional-consume
  + exact replay, dedup/reuse-conflict/expiry-scrub, prospective-contact
  binding with version-drift denial); full production DB lane 403/403 across
  46 files; datasource drift none; unit 1027/1027; structural gates green;
  disposable destroyed `0` survivors.
- Pre-apply defect repaired: `DR-I3-01` — the binding minted
  `workflow_run_ref` in the `nurture` namespace while the workflow identity
  CHECK requires the Host `my_chat`/`workflow_run` canonical form (workflow
  runs are Host canonical objects). Only real PostgreSQL surfaced it.

## Boundaries (what this record does not claim)

- **I4 interlocks.** The current-owner evidence *transport* (signed wave4
  endpoints, detached Ed25519 + nonce) binds behind the injected
  `NurtureEnrollmentCurrentOwnerEvidenceSourceV1` port at I4 joint
  conformance; this record qualifies the verification and local-reread side.
  End-to-end command commits through real specs (journey/care-group binding
  lanes with live workflow writes) are I4/G4-F harness work — here the
  consume path is qualified transactionally against the real ledger, and the
  journey/care-group option lanes carry unit coverage.
- **Deferred surface.** Touchpoint-correction target options have no
  issuance surface yet; `refs.superseded_touchpoint` stays absent and the
  correction lane fails closed.
- **Guardian lanes.** The workbench ingress can never satisfy guardian
  bindings; guardian-facing capabilities stay fail-closed until a guardian
  ingress exists.
- Not a durable apply, not I4, not G4-F, not Candidate Freeze, not traffic.
