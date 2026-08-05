# C30-I1-C4 Quality Repair Scope Freeze

## Decision

- Date: 2026-08-05
- Governance: `REUSE_TASK / M-002 > F-002 > T-002`
- Authorization: repair every finding from the I1-C implementation quality review
- State: `I1_C_ACCEPTANCE_REOPENED / I1_C4_QUALITY_REPAIR_FROZEN`
- Downstream: `I1_D_NO_GO / CONSUMER_ADOPTION_NO_GO / ACTIVATION_NO_GO`

The prior source/lock chain remains historical evidence, but artifact 25 no longer
qualifies current I1-C acceptance. The review found five executable contract gaps
and one acceptance-boundary overclaim. This amendment freezes their repair before
Base source changes and keeps the work inside the original neutral I1-C surface.

## Frozen repair set

| ID | Finding | Required repair and falsification |
| --- | --- | --- |
| `R1` | SafeText URL detection accepts non-HTTP schemes, network-path refs, bare domains and email-like locator text. | Align TypeScript and JSON Schema portable negatives for generic URI schemes, `//host`, bare DNS names and email-address forms; retain codec-only complements where Schema portability ends. |
| `R2` | Structural subject-option validation proves only duration, so a historically expired option can still qualify as current provider output. | Add deterministic, explicitly clocked active-option and active-result assertions. They reject not-yet-issued and expired options without reading the wall clock or extending locators; provider conformance must exercise resolved/list candidates and fail-closed unavailable handling. |
| `R3` | The freeze claimed Base could detect diagnostic/prescriptive prose and every semantic Anti-Metric, although neutral localized prose cannot be classified safely by a shared structural codec. | Reapprove the boundary: Base rejects structural unsafe copy and explicit forbidden metric-key vocabulary; the Scenario owner must run locale/domain-aware disclosure and Anti-Metric policy before constructing I1-C values. Consumer adoption cannot qualify without executable owner-policy negatives. Do not add brittle English keyword parsing to Base. |
| `R4` | A regex-valid but invalid BCP-47 locale can escape as `RangeError`. | Convert `Intl.getCanonicalLocales` failures into the stable contract validation error and add a regression case. |
| `R5` | The frozen default page size 10 is documentary only. | Export default/maximum page constants, provide a validating default resolver, annotate both JSON Schema request slots with `default: 10`, and prove omission/10/20/overflow behavior. |
| `R6` | Item/entry keys are unique only inside one block. | Enforce one response-local namespace across every `item_collection.item_key` and `timeline.entry_key`; add cross-block and cross-kind duplicate negatives. JSON Schema remains the shape layer and the codec owns this cross-array invariant. |

No new wire field, result variant, block variant, runtime provider or product value
is authorized. The only new public exports are neutral validation constants/helpers
needed to make the already frozen expiry and pagination behavior executable.

## Ordered repair and reseal

1. Apply R1, R2, R4, R5 and R6 to Base types/assertions/Schemas/conformance;
   apply the R3 boundary correction to the freeze and acceptance evidence.
2. Commit the complete verified source repair as one reviewable Base source unit.
3. Run the full verifier twice, build twice in isolated output directories and
   compare byte-tree/source-manifest digests.
4. Refresh the exact source lock against the committed source revision, commit
   only lock metadata, and run the full verifier a third time.
5. Issue a successor qualification record and restore `I1_C_ACCEPTED` only if all
   repair negatives, regression populations, source identity and scope checks pass.

## Effect boundary

- Exact Base worktree only for neutral contracts, Schemas, fixtures, tests and the
  final metadata source lock.
- Nurture changes are governance/context evidence only; My-Chat remains byte-clean
  at `dc4a77b257f952e2c0f0aede9521e16ac274de9d`.
- No Prisma/schema/migration, database, runtime/provider/consumer, manifest/module,
  package dependency/version, deployment, capability, activation, T-008, Pilot or
  traffic operation.
- No I1-D source or scope review begins in this repair.

## Exit

The repair exits only through a successor I1-C4 qualification/source-lock record.
Until then, I1-C acceptance is reopened, artifact 25 is superseded as current
qualification evidence, and I1-D is not eligible.
