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

### B1 — DB SSOT delta and migration are unlanded (internal, largest)

The G3-0 freeze lists ten additive models and five extend-in-place deltas. None
exist in `prisma/schema.prisma`:

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

### B2 — No owner repository implements any T-006 port (internal)

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

### B3 — The capture lane has no declared read port (internal, specification)

`evaluateOrganizeTrigger` takes an assembled `OrganizeTriggerRequestV1`. Every
other lane declares the exact owner port its facts come from, so the capture
batch is the one place where the owner-integration boundary is unspecified.
G3-E should not discover that boundary while wiring the ingress.

### B4 — No T-006 capability is reachable through the formal ingress (internal)

`assert-formal-ingress-contract.mjs` pins `expectedHarnessActionKeys` to the
eight T-005 action keys, and `harness-http.ts` enumerates three query keys, all
T-005. The generic query/prepare/execute routes exist, but no T-006 key is
admitted. G3-E's requirement to run "through the formal NestJS ingress" cannot
be met until the 24 keys are routed and the ingress guard's census is extended.

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

1. **DB SSOT delta** — `prisma/schema.prisma` additive models and extend-in-place
   deltas, generated context, one migration with an evidence-backed legacy
   census that fails closed. Unblocks B1.
2. **Owner repositories** — the fourteen ports plus the atomic per-target release
   transaction, with `test:db` coverage on disposable PostgreSQL. Unblocks B2.
3. **Capture-lane port** — declare it alongside the repositories so every lane
   has one boundary shape. Unblocks B3.
4. **Ingress routing** — admit the 24 T-006 keys, extend the ingress census, keep
   every gate default-off. Unblocks B4.
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
