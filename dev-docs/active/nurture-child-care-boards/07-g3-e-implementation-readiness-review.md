# G3-E Implementation Readiness Review

## Verdict

- Task: T-006
- Date: 2026-08-02
- Verdict: `G3_E_NOT_READY`
- Reviewed artifact: `nurture.surface-contract@1.13.0` /
  `sha256:1919a289cabdd9018db83100867dd1985caf6510a7a900e8a1fc654521e26aef`
- Reviewed scope: everything G3-A through G3-D landed, after the 2026-08-02
  implementation-quality pass

G3-E qualifies the real journey on the formal NestJS ingress, the pinned owner
path and disposable PostgreSQL. The domain and contract layers are complete for
that, but **no persistence, no owner repository and no ingress route exists for
any of the 24 T-006 capabilities**. G3-E cannot start against the current tree;
it needs one preparatory checkpoint first.

This review changes no capability, schema, migration, environment, activation or
traffic state.

## What is ready

| Area | State | Evidence |
| --- | --- | --- |
| Domain logic | Complete for G3-A/B1/C1/D | 50 unit files / 504 tests |
| Capability contract | 35 capabilities, adoption set closed | `verify:g3-0-freeze` `reserved-keys=19`, all tracked |
| Typed results | Runtime output validated against every registered result schema | `phase-3-typed-results.test.ts`, 26 cases |
| Synthetic conformance | 16 cases, 50/50 slices | `verify:surface-conformance` |
| Additive-rotation discipline | Shared core and every T-005 slice byte-identical since `1.8.0` | `verify:g2-exit-contract` |
| Role-safety negatives | Institution Admin / Institution-scoped / other-CareGroup refused on every lane | per-lane negative suites |

## Blockers

### B1 — DB SSOT delta and migration are unlanded (internal, largest) — RESOLVED 2026-08-02

> Resolved. The delta is landed in `prisma/schema.prisma`, applied by
> `20260802120000_g3_publish_process_and_media_lifecycle`, reflected in
> `docs/context/db/schema.json` (60 tables), covered by
> `packages/nurture-db/tests/g3-publish-process-schema.integration.test.ts` and
> pinned by `verify:g3-0-freeze`
> (`schema_delta=landed legacy_enums=retired migration_gate=fail_closed`). The
> migration's ambiguity gate was falsified on a scratch database before being
> accepted. See `03-implementation-notes.md` and `04-verification.md`.

The G3-0 freeze lists ten additive models and five extend-in-place deltas. None
existed in `prisma/schema.prisma` at review time:

- Additive: `NurtureFocusGoalChildScope`, `NurtureCareCapture`,
  `NurtureCareCaptureBatch`, `NurturePublishProcess`,
  `NurturePublishProcessRevision`, `NurturePublishProcessTarget`,
  `NurturePublishEditHold`, `NurtureContentSafetyAssessment`,
  `NurturePublicationRelease`, `NurturePublicationVisibilityEvent`
- Extend in place: `NurtureMediaAssetRef` lifecycle/revision,
  `NurtureChildMediaAttribution` lifecycle/supersession,
  `NurtureGrantDataClass += child_growth_record`,
  `NurtureChildLinkReceiptSourceType += publication_release`
- One-time legacy migration for `active/hidden/deleted` and
  `candidate/confirmed/rejected/corrected/hidden/deleted`

The mapping evaluators for that migration already exist and fail closed on
ambiguous rows (`mapLegacyMediaAssetStatus`, `mapLegacyAttributionStatus`), but
the migration itself, its row census and its DB tests do not.

Landing it surfaced one interaction the review had not predicted: the T-005
`ck_nurture_receipt_route_lifecycle` CHECK also governs the new
`publication_release` source type, so B2's `commitTargetRelease` must write a
fully-bound delivered Receipt (grant, enrollment, data class, target scope,
`delivered_at`). Both the accepted and the refused shape are now pinned by a DB
test.

### B2 — No owner repository implements any T-006 port (internal) — RESOLVED 2026-08-02

> The G3-A lane is landed: `PrismaGuardianBoardReadPort`,
> `PrismaCaregiverBoardReadPort`, `PrismaGuardianFocusEligibilityReadPort`,
> `PrismaCaregiverDailyCareEligibilityReadPort` and
> `PrismaBoardMutationTransaction`, covered by
> `packages/nurture-db/tests/g3a-board-owner.integration.test.ts`. The G3-B1
> lane followed: `PrismaPublishLaneReadPort` covers the publish queue, edit
> hold, draft and cancel ports, covered by
> `packages/nurture-db/tests/g3b1-publish-lane-owner.integration.test.ts`.
>
> The G3-C1 lane followed: `PrismaMediaSafetyReadPort` covers the content
> safety, media attribution and media lifecycle ports, covered by
> `packages/nurture-db/tests/g3c1-media-safety-owner.integration.test.ts`.
> Landing it needed a freeze amendment — the fact set had nowhere to record the
> per-source safety markers the port must return — and exposed a fail-open in
> `evaluateContentSafetyRoute` where an unrecognised marker was dropped instead
> of raising the tier. Both are recorded in the freeze and in
> `03-implementation-notes.md`.
>
> The G3-D lane closes it: `PrismaPublicationReleasePort` covers the release and
> post-release safety ports, covered by
> `packages/nurture-db/tests/g3d-publication-release-owner.integration.test.ts`.
> All fourteen ports are implemented.
>
> `commitTargetRelease` lands the release, its Receipt and the immutable
> `CommandExecution` in one transaction. Its committed identity is per (attempt,
> target) — `CommandExecution` is unique per command hash, so the attempt
> identity alone would make the second target collide with the first — with the
> attempt hash recorded as the parent. Atomicity was falsified by blocking the
> audit write mid-transaction and asserting the other two rows do not survive.
>
> One limitation surfaced while landing the Guardian lane and is not a defect in
> the implementation: `NurtureFamily` is one-to-one with
> `NurtureChildCareProcess`, so a guardian of two children reaches two families,
> while the G3-A board contract carries exactly one family scope. The repository
> binds to the earliest-created family and never mixes enrollments across
> families. A multi-child guardian therefore sees one child's board with no way
> to select the other. Closing this needs a contract-level family selector, so
> it belongs to G3-E scope rather than to B2.
>
> **The caregiver side has the same shape and is sharper (recorded 2026-08-02).**
> `resolveCaregiverReach` returns the first active CareGroup-scoped assignment
> whose group is active, so a teacher who holds two classes reaches only one.
> The guardian case is a contract limitation; the caregiver case is not — the
> caregiver lanes already take `care_group_id` as an input.
> `caregiver-board.read.ts:272` and `publish-lane.read.ts:127` receive the
> requested group, resolve a reach that ignores that input, then refuse when the
> two disagree. Asking for the second class is therefore actively denied rather
> than quietly defaulted to the first.
>
> `care-capture.read.ts:31` already resolves the assignment **for the requested
> group** (`scopeId: input.care_group_id`). Adopting the same shape in the
> shared helper is a small change, and would remove the root cause of the
> prepare/execute divergence fixed under A6. The change is recorded here rather
> than made with the review batch because altering which class a request
> resolves to is product-visible behaviour, and belongs to a checkpoint that can
> declare the change.

Fourteen declared ports have zero implementations in `packages/nurture-db`:

`GuardianBoardReadPort`, `CaregiverBoardReadPort`, `TeacherPublishQueueReadPort`,
`GuardianFocusEligibilityReadPort`, `CaregiverDailyCareEligibilityReadPort`,
`NurtureBoardMutationTransaction`, `ContentSafetySourceReadPort`,
`MediaAttributionReadPort`, `PublishEditHoldReadPort`, `PublishDraftReadPort`,
`PublishCancelReadPort`, `PublicationReleasePort`, `PublicationSafetyReadPort`,
`MediaLifecycleReadPort`.

`commitTargetRelease` is the sharpest one: it must land the
`PublicationRelease`, its logical Receipt and the immutable `CommandExecution`
atomically per target. Nothing else in T-006 has that shape.

### B3 — The capture lane has no declared read port (internal, specification) — RESOLVED 2026-08-02

> Resolved. `CaptureBatchReadPort` / `CaptureOrganizeSourceV1` are declared in
> `care-capture-batch.ts` alongside `resolveOrganizeTrigger`, which fixes the
> boundary as "load through the owner port, then evaluate". The policy stays a
> caller input resolved from T-007, not from the capture owner.
> `PrismaCareCaptureReadPort` implements it as a pure read that never opens or
> advances a batch.

`evaluateOrganizeTrigger` takes an assembled `OrganizeTriggerRequestV1`. Every
other lane declares the exact owner port its facts come from, so the capture
batch is the one place where the owner-integration boundary is unspecified.
G3-E should not discover that boundary while wiring the ingress.

### B4 — No T-006 capability is reachable through the formal ingress (internal) — PARTIAL 2026-08-02

> The query lane is routed end to end: the six T-006 query keys reach the real
> owner ports, and the ingress now admits each capability at its own exact
> registered version instead of one version per lane. The guard's census is
> derived from the capability registry and enumerates the eighteen write keys
> that are deliberately not routed yet, so coverage cannot shrink silently.
> Both directions of the census were falsified before acceptance.
>
> Two write keys followed — `update_guardian_current_focus` and
> `record_caregiver_daily_care` — with a DB-backed e2e that commits on the fact
> owner through the real ingress. `direct_commit` was confirmed to describe the
> confirmation strength, not a skipped prepare: the frozen
> `ExecuteActionInvocationV1` requires `confirmationRef` and carries no typed
> input, so every write key goes prepare → execute.
>
> The remaining sixteen write keys are blocked on B8 below, not on routing.

`assert-formal-ingress-contract.mjs` pins `expectedHarnessActionKeys` to the
eight T-005 action keys, and `harness-http.ts` enumerates three query keys, all
T-005. The generic query/prepare/execute routes exist, but no T-006 key is
admitted. G3-E's requirement to run "through the formal NestJS ingress" cannot
be met until the 24 keys are routed and the ingress guard's census is extended.

### B8 — Sixteen write capabilities have no command or owner write (internal)

Discovered while routing B4-2, and not visible when this review was written.
The publish-process, media-attribution and publication-safety capabilities were
delivered as **pure decision functions**: they compute a verdict and return it.
Committing one through the formal ingress needs two layers neither B2 nor B4
built:

1. **An owner write transaction.** B2 delivered read ports plus exactly two
   write paths — the inline board mutations and the per-target release. There is
   no owner write behind acquiring an edit hold, saving a draft, cancelling a
   process, confirming or superseding an attribution, correcting, removing or
   redacting a publication, detaching or discarding media, or rescheduling.
2. **A `NurtureCommandSpec`.** `execute` commits through `NurtureCommandRunner`
   and leaves an immutable `CommandExecution`. Only the two board mutations and
   the T-005 set have specs.

Until both exist per capability, the keys stay off the ingress: admitting a key
the engine cannot serve is the placeholder the freeze forbids. They are carried
in `assert-formal-ingress-contract.mjs` as an explicit unrouted list of sixteen,
so the gap cannot go quiet.

### B5 — The T-005 direct-interaction consumer action is missing (internal)

D-15 requires that when content routes to `direct_interaction_required`, T-006
presents an **owner-issued** T-005 navigation/action whenever
`initiate_caregiver_direct_message` is currently available, and a safe blocked
projection otherwise. Today `createPublishCandidate` returns the route and the
internal source refs but no action ref at all — the safe-blocked half is
implemented, the available half is not. The Exit Gate explicitly refuses a
handoff signed on a safe-unavailable placeholder, so this must be built before
the joint G2-C run.

### B6 — T-007 publication-policy provider is absent (external)

`release_publish_process` and `reschedule_publish_process` carry
`t007_publication_policy@joint_conformance`. Schedule resolution is implemented
and tested against isolated fixtures only. Real policy-backed scheduling stays
`dependency-unavailable` until T-007 ships the provider and the two tasks run a
joint qualification.

### B7 — T-005 G2-C joint qualification not run (external)

The provider is qualified; the joint provider/consumer run through one exact
digest on the formal ingress has not happened, and B5 blocks the consumer side.

## Ordered prerequisites

1. ~~**DB SSOT delta** — `prisma/schema.prisma` additive models and
   extend-in-place deltas, generated context, one migration with an
   evidence-backed legacy census that fails closed. Unblocks B1.~~ **Done
   2026-08-02.**
2. ~~**Owner repositories** — the fourteen ports plus the atomic per-target
   release transaction, with `test:db` coverage on disposable PostgreSQL.
   Unblocks B2.~~ **Done 2026-08-02.**
3. ~~**Capture-lane port** — declare it alongside the repositories so every lane
   has one boundary shape. Unblocks B3.~~ **Done 2026-08-02.**
4. **Ingress routing** — admit the 24 T-006 keys, extend the ingress census, keep
   every gate default-off. Unblocks B4. **Partially done 2026-08-02:** the six
   queries and two board writes are routed; the other sixteen wait on step 4b.
4b. **Write commands and owner writes** for the sixteen decision-only
   capabilities. Unblocks B8, then the rest of B4.
5. **T-005 consumer action** — owner-issued `initiate_caregiver_direct_message`
   action ref from current eligibility, with the safe blocked projection kept
   for the unavailable case. Unblocks B5 and half of B7.
6. **Joint runs** — T-007 provider-backed schedule/release, then the T-005 G2-C
   joint journey. Closes B6 and B7.

Steps 1–5 are T-006's own work and are the natural content of one preparatory
checkpoint. Steps 6 depends on other tasks and cannot be pulled forward.

## Notes on scope

- The first four checkpoints deliberately deferred persistence, and each said so
  in its own record. This review is where that accumulated debt is stated as one
  blocking total rather than four separate deferrals.
- Nothing above weakens a delivered guarantee. The domain-level negatives, the
  role-safety matrix and the typed-result conformance all continue to hold; they
  simply run against ports rather than a database.
