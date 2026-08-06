# T-009 Implementation Notes

Running log; newest first.

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
