# T-009 Architecture and Decision Records

These decisions resolve the 2026-08-07 cross-repo review findings (positioning
review against `nurture-family-growth-delivery-requirements.md` and the
My-Chat product architecture). Each record names the conflict, the decision
and the consequence. IDs are stable for later reference.

## D-T009-01 — Guardian planning surface is ceded to My-Chat

Conflict: Nurture's `guardian_current_focus` content kind (+ the
`query/update-guardian-current-focus` capabilities backed by
`NurtureFamilyCharter` / `NurtureFocusCycle` / `NurtureFocusGoal`) implements
family-scoped long-term direction — the same object My-Chat's product
architecture declares as My-Chat-owned `CultivationTheme` /
`CultivationMaterialLink` ("parent-owned cultivation themes … archive
composition"). My-Chat has not implemented cultivation yet (its Phase 4 /
Wave 2), so the conflict is resolvable one-sided.

Decision: cede. Remove `guardian_current_focus` from the
`guardian_family_board` surface and retire the two capabilities in the
surface-contract `1.16.0` batch. The backing tables stay as frozen
scenario-internal legacy (the T-001 family-strategy workflow still reads
them); no new consumer may bind to them. Long-term family direction is a
My-Chat cultivation concern.

Consequence: `guardian_family_board` orderedContentKinds shrinks; contract
minor bump; affected G3 evidence is refreshed in the same requalification
round as the pin rotation (one round, not three).

## D-T009-02 — v1 family rendition binds the unchanged original revision

Conflict: requirement N4 asks for family-specific protected renditions
(crop/mask/derivative for multi-child photos), while the qualified G3 design
forbids visual transformation (`GROUP_PHOTO_RESOLUTION_PATHS`, "a publication
always binds the exact unchanged original revision").

Decision: for the first loop, `family_rendition_ref` resolves to a protected
per-family handle over the exact unchanged original media revision. This is
contract-conformant: the ref is opaque, and fixture 10 explicitly allows
"reject" as the outcome for a partially-authorized group photo. Nurture's
existing eligibility gate already releases only when every clearly visible
child is confirmed and exposure-allowed for the target family, so no visual
transformation is needed on the release path; blocked photos keep the four
resolution paths and fail closed. Derivative generation, when it comes, is a
shared-media-infrastructure capability driven by declarative transform
instructions from Nurture — never Nurture editing pixels itself.

Consequence: N4 is satisfiable without breaking qualified G3 behavior. A new
immutable content digest per media revision is required
(`NurtureMediaAssetRef` currently has `mediaRevision` but no digest column).

## D-T009-03 — Transport: synchronous receipt over service-authenticated ingress

Conflict: both repos left transport unbound (My-Chat: "Nurture transport、
receipt owner … 仍未绑定"); N5/N7 cannot be implemented without it.

Decision (proposal to freeze jointly, draft in
`artifacts/family-growth-transport-addendum-draft.md`): Nurture's outbox
worker POSTs one envelope per request to a service-authenticated My-Chat
ingress endpoint; the synchronous 200 response body is the admission receipt.
Timeout/5xx → `outcome_unknown`, retried with the same `event_id` +
`payload_digest` (My-Chat's ingress ledger already resolves exact replays).
Media travels the other way: My-Chat's importer exchanges
`family_rendition_ref` at a Nurture service-authenticated endpoint for a
short-lived URL + digest and verifies bytes before its DB transaction. The
addendum is versioned independently; the v1 envelope stays frozen.

Consequence: no provider-side receipt callback channel is needed; N7 reduces
to interpreting the synchronous response plus a query path for
`outcome_unknown` replays.

## D-T009-04 — Pin strategy: one rotation, one requalification

Facts: Nurture pins My-Chat `a019566` (pre-contract); the contract landed at
`d4ed0ce`; My-Chat head is `c5ac6c7`; sibling checkouts have drifted past
both pins (verify currently fails against live siblings). My-Chat pins
Nurture design evidence at `882d80f`, now on `main`.

Decision: rotate the My-Chat pin once, to a jointly designated commit
≥ `c5ac6c7`, inside the `1.16.0` batch — together with D-T009-01 removal and
the new provider capabilities — and run a single requalification round in
detached worktrees at exact pins. No intermediate pin hops.

## D-T009-05 — Delivery order: photo loop before T-007 G4-0C

Conflict: Nurture's roadmap said "T-007 G4-0C next"; My-Chat's cadence and
the requirements doc both put the teacher-release photo loop first; T-006
only needed T-007's publication-policy subset, which is already delivered
(G4-0B).

Decision: T-009 is the next implementation task. T-007 resumes at G4-0C
afterwards; T-008 prerequisites are unchanged (complete T-007 Exit).

## D-T009-06 — UIUX consolidation

Decision: Dashboard/shell UIUX (including the teacher release flow) belongs
to My-Chat T-036, which has produced `teacher-release-low-fi.md`. Nurture
T-003 rescopes to presenter/action contract supply; its pitch artifacts are
handed to T-036 as input, and T-003 closes after that handoff. Recorded here;
executed in T-003's own docs when the handoff happens.

## D-T009-07 — Implementation discipline (summary; full list in 05-pitfalls)

- Only `family_growth_material_*` contracts; the legacy My-Chat
  `growth_record_*` path is in cutover and must not be targeted.
- "admission" is overloaded: provider-side code says
  `family_growth_admission_receipt`; `publish-queue-admission` (T-007 policy)
  is unrelated.
- Canonical `child_id`/`family_id` appear only in envelope assembly; they are
  never persisted into Nurture business tables.
- Nurture owns a provider outbox for its own outbound contract events; this
  does not contradict "My-Chat owns the workflow outbox" (different object;
  README/AGENTS wording amended).
- Correction lifecycle events need an explicit unseal-for-provider step: the
  stored correction body is sealed, but the envelope requires display-safe
  text and forbids protected envelopes.

## Component map (target state)

```
packages/nurture-scenario/src/domain/family-growth/
  envelope.ts          # v1 wire types mirroring the frozen schema (no copy-extension)
  jcs.ts               # RFC 8785 canonicalization + payload digest
  assembler.ts         # canonical facts -> release/lifecycle envelope (pure)
  receipt.ts           # admission receipt interpretation + outcome_unknown rules
packages/nurture-db/
  (schema) NurtureMediaAssetRef.contentDigest        # immutable per revision
  (schema) NurtureFamilyGrowthOutboxEvent            # provider outbox
  (schema) NurtureFamilyGrowthAdmissionReceipt       # consumed receipts
  repositories/family-growth-outbox.transaction.ts   # same-tx append + worker claim
apps/scenario-service/
  delivery worker + rendition exchange endpoint (after transport freeze)
```
