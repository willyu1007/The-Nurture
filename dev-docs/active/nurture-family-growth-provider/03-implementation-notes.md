# T-009 Implementation Notes

Running log; newest first.

- 2026-08-07: I2 + I4 landed.
  - I2 schema: migration `20260807080000_t009_family_growth_provider_outbox`
    (outbox + receipt tables, media `content_digest`, hand-authored partial
    unique and CHECK invariants); `PrismaFamilyGrowthOutboxPort`
    (`appendWithin` caller-transaction append, `claimDue`, `recordReceipt`,
    `recordTransportFailure`). Postgres lesson the suite caught: a caught
    unique violation still aborts the surrounding transaction (25P02), so
    receipt-replay idempotency uses `createMany skipDuplicates`
    (ON CONFLICT DO NOTHING), never catch-and-continue.
  - I4 resolution: `target-resolution.ts` pure resolver over a binding read
    port and a canonical-exchange port (the owner reread), all deny reasons
    fail closed, exchange never called for locally denied chains, canonical
    IDs never persisted; `PrismaFamilyGrowthBindingReadPort` reads the
    LATEST association state so revoked chains deny with precise reasons.
    Schema fact worth keeping: an active family association MUST reference
    its child association as current
    (`ck_nurture_family_anchor_assoc_lifecycle`), so "current family
    association over a revoked child association" is unrepresentable in
    rows — that resolver guard is defense-in-depth, unit-tested only.
  - Local dev DB repair before deploy: three failed zero-step attempts of
    the T-007 migration were blocked by its data gate (627 partial-schedule
    test-debris rows); repaired by NULLing the seven schedule fields on
    exactly those rows, resolve --rolled-back, redeploy. Full evidence in
    `artifacts/db/i2/00-sync-evidence.md`.
  - New subpath export `@the-nurture/scenario/family-growth` (types→src,
    import→dist), matching the `binding-owner` pattern, so `nurture-db`
    binds the ports without importing the scenario root.

- 2026-08-07: I1 domain envelope layer landed under
  `packages/nurture-scenario/src/domain/family-growth/`
  (`envelope.ts` wire types + full-pass structural validator, `jcs.ts`
  canonical serialization + payload digests, `assembler.ts` pure
  deterministic assembly, `receipt.ts` receipt parsing/consequences).
  Interop detail worth repeating: the consumer's digest scope is
  `{source,target,admission,material,retention}` for releases and
  `{source,target,correction?}` for lifecycle events — NOT the whole
  envelope — with recursive key-sort + `JSON.stringify` canonicalization;
  the digest tests replicate the consumer algorithm verbatim to lock this.
  No new runtime dependency (self-contained canonicalization per plan).
  Known environmental note: one pre-existing `tsc` error in
  `x5-joint-acceptance.integration.test.ts` from live-sibling drift
  (`resolveNurtureAttentionOpen` removed at My-Chat head); unrelated to I1
  and resolved by the I6 pin rotation.

- 2026-08-07: Task created. T-006 branch merged to `main` (`447e646`),
  making checkpoint `0374087…` and My-Chat's evidence pin `882d80f…`
  reachable from `main`. Decision records D-T009-01…07 written. Transport
  addendum draft v0.1 authored and mirrored to My-Chat. Implementation
  begins with I1 (domain envelope layer).
