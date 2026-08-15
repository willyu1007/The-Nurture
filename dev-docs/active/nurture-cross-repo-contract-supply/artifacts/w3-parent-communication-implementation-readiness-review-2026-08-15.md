# W3 parent communication implementation readiness review

Date: 2026-08-15
Scope: current `The-Nurture` and `My-Chat` main worktrees; W3 v1 and W11 v1.1
parent-communication code; the new parent-context selection carrier and local
Enrollment selection owner.
Verdict: `READY_FOR_IMPLEMENTATION / NOT_READY_FOR_STAGING_OR_ACTIVATION`.

## What is ready

- The frozen `nurture.parent-communication-owner@1.0.0` and additive `1.1.0`
  contracts, strict consumer validators, sanitized fixtures, private routes,
  local Prisma read/write owners, confirmation ledger discipline and default-
  false gates already exist.
- `my-chat.parent-context-selection@1.0.0` now defines the missing cross-owner
  routing carrier. It transports only the current My-Chat context version and
  opaque child/family binding owner refs + versions; no platform child/family
  id and no Nurture Enrollment id crosses the boundary.
- Nurture now owns one explicit current parent-context Enrollment selection per
  ChildCareProcess. Trial start creates the first selection, formal acceptance
  explicitly advances it, trial end clears its own selection, and every W2 read
  rereads the selection version and complete Nurture authority.

The remaining W3 work is therefore implementation, not unresolved contract
design. It must reuse the same carrier and local selection owner; a second W3-
specific mapping contract is prohibited.

## Blocking findings

### P0 — replace the old selection seam

`ParentCommunicationContextSelectionPortV1` still models a host adapter that
returns a Nurture-local `enrollment_ref`. That is the pre-carrier design and is
not an acceptable production boundary. Replace it with a Nurture-owned mapper
that consumes `ParentContextSelectionV1`, resolves the exact binding anchors and
association, then reads `NurtureParentContextEnrollmentSelection`. Remove the
old host-selected Enrollment semantics after all W3/W11 call sites and tests
move; do not keep both paths.

### P0 — make My-Chat resolve canonical parent context per request

`ParentCommunicationService` currently checks workspace ACL and forwards the
caller `contextRef` directly. It does not re-resolve the actor's canonical
family-child context, require current Nurture bindings, or send the pinned
selection header. Route W3 through the same `FamilyGrowthParentContextRepository`
selection used by W2, bind the requested context exactly, and have the strict
client emit the shared header for summary, detail, media, prepare and confirm.

### P0 — replace the dormant resolver's ambiguous authority model

The current W3 Prisma resolver starts from host-selected Enrollment, then uses
`ChildCareProcess.primaryFamilyId`; it also issues `Promise.all` queries inside
one interactive transaction and treats multiple valid Guardian roles as
failure before selecting the thread membership's role. Refactor it to the W2
shape: exact child/family anchors and association first, local Enrollment
selection second, then one thread membership and its exact current role. Keep
interactive-transaction queries sequential and reread every selected head on
read and confirm.

### P0 — production composition remains intentionally unavailable

Scenario-service still refuses W3 and W11 production startup because their
selection dependency is absent. Wire both bindings only after the shared mapper
lands. Preserve the current default-off provider gates and fail startup on
missing service auth, database, integrity/protected-content keys, or carrier
contract mismatch.

### P1 — activation evidence remains separate

- Protected media has no private provider stream plus My-Chat proxy; keep it
  explicitly unavailable unless that is separately implemented and reviewed.
- Add a family-scoped allowlist/ramp and low-cardinality telemetry before any
  W3 traffic. A global boolean alone is not a safe gray control.
- Re-run native send/reconcile, accessibility, context-switch purge, offline
  recovery and device tests. W11 must repeat the same carrier/revocation cases
  because it shares the v1 authority resolver.

## Smallest implementation sequence

1. Generalize the Nurture W2 binding-to-local-selection query into one shared
   DB mapper without changing either frozen owner body contract.
2. Add the shared selection header parser to W3/W11 controllers and pass the
   parsed carrier into their authority resolvers.
3. Refactor the W3 resolver to association-first, selected-Enrollment-second
   sequential authority resolution; make W11 consume the same result.
4. Make My-Chat parent communication resolve the exact current parent context
   and extend its strict v1/v1.1 clients with the existing carrier encoder.
5. Wire Nurture production bindings behind unchanged default-false gates; add a
   family allowlist/ramp in My-Chat before deployment qualification.
6. Run cross-repo conformance, disposable-DB read/prepare/confirm/replay/
   revocation tests, then staging migration and gate-off rehearsal. Activation
   remains a later explicit decision.

## Implementation acceptance

- No request body, frozen digest or public Mobile DTO gains Enrollment,
  participant, role, grant, anchor or selection identifiers.
- There is one carrier contract and one Nurture local selection table; the old
  host-selected Enrollment port and its tests are removed in the same cutover.
- Missing/expired/mismatched binding, missing/changed selection, association
  drift, role/grant/thread revocation and cross-actor replay all fail closed.
- Prepare has no business effect; confirm and exact replay remain on the sole
  Nurture command transaction. W11 does not add a second resolver or mapping.
- All provider and consumer gates remain false after implementation readiness
  is achieved. No staging/prod migration or activation is implied by this
  review.
