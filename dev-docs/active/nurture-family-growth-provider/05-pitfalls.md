# T-009 Pitfalls

Read before implementing any increment. Most of these are traps that a
correct-looking implementation walks into.

## Contract targeting

- My-Chat has TWO growth tracks. `growth_record_*`
  (`GrowthRecordCandidate/Entry`, `scenario-integrations/growth-record-contribution.ts`,
  six-value data-class vocabulary) is the LEGACY path, mid-cutover. The only
  valid target is `family_growth_material_*` (single
  `data_class=child_growth_record`). Anything that imports or mirrors the
  legacy vocabulary is wrong even if it typechecks and its tests pass.
- The v1 envelope schema is frozen. Do not vendor a modified copy into
  `contracts/`; test-fixture copies live under `tests/` and are labeled as
  fixtures.

## Naming

- "admission" is overloaded. `publish-queue-admission` is the T-007
  publication-policy gate (Nurture-internal). The My-Chat result is always
  `family_growth_admission_receipt` in code, docs and logs. Never shorten to
  "admission receipt" in an ambiguous scope.

## Identity

- Canonical `child_id`/`family_id` exist ONLY inside envelope assembly.
  Persisting them to any Nurture business table — including "just for
  debugging" columns or logs — breaks the identity boundary (AGENTS.md) and
  fails review. The outbox row stores the assembled envelope JSON, which is
  the single sanctioned place a canonical ID appears at rest.
- Resolution is not authorization: an existing binding/association never
  substitutes for the current release authority checks that G3-D already
  performs in-transaction.

## Transaction discipline

- N5 forbids network/object-storage calls inside the release transaction.
  Envelope assembly (including target resolution and digest computation)
  happens BEFORE the transaction; the transaction writes release + receipt +
  outbox and nothing else leaves the process.
- Outbox append must be atomic with the release: a release without an outbox
  row and an outbox row without a release are both defects — cover both
  rollback directions in tests.
- `outcome_unknown` is a provider-side delivery state, never a receipt
  status. It must stay retriable/queryable; assuming success (or failure)
  after a timeout re-creates the receipt-less-release defect class the G3
  repair fixed.

## Correction bodies

- The stored correction body is sealed
  (`protected_content.seal`; only a digest tag enters canonical rows). The
  lifecycle envelope requires `display_safe_text` plaintext and FORBIDS
  protected envelopes. The unseal-for-provider step is explicit, audited,
  and produces display-safe text only — do not "conveniently" widen it into
  a general unseal path.

## Media

- `family_rendition_ref` in v1 resolves to the exact unchanged original
  revision (D-T009-02). Any code path that produces a visually transformed
  derivative inside Nurture violates the qualified G3 design — the four
  `GROUP_PHOTO_RESOLUTION_PATHS` remain the only unblock routes.
- `content_digest` must be a real digest of the actual bytes at that
  revision. Deriving it from `storageRefPayload` metadata or minting
  placeholder digests poisons every downstream verification.
- Envelope media lists carry the target-eligible subset only; leaking a
  sibling child's asset ref into another family's envelope is the highest-
  severity defect class in this task.

## Pins and drift

- Sibling checkouts drift; `pnpm verify:workflow-contract-pin` against live
  siblings can fail for environmental reasons. Qualification always runs in
  detached worktrees at exact pinned revisions (G3 topology discipline).
- Any surface digest / owner revision / self-pin drift invalidates affected
  evidence — that is WHY I6 batches the cession removal, provider additions
  and pin rotation into one `1.16.0` round. Do not land partial
  contract-visible changes outside that batch.

## Ownership wording

- Nurture's provider outbox does not contradict "My-Chat owns the workflow
  outbox": different objects. README/AGENTS carry the amended wording; keep
  new docs consistent with it.
- Teacher surfaces show scenario work results only. Receipt statuses are
  displayable; family archive composition, cultivation and guardian
  organization are never queryable from Nurture, and a receipt is never an
  access grant (N7).
