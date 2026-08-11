# T-010 Nurture family-sharing eligibility

## Status

- State: in-progress
- Updated: 2026-08-12
- Next step: I4-C1 is drafted — additive schema/migration (review-only, not
  applied), domain record types and the fail-closed read port, DB context
  refreshed; see `artifacts/db/t010-family-sharing-authority/`. Next: close
  the independent migration-SQL review, then I4-C2 current-authority reader
  over these records (no apply; the first apply target is the approved C4
  disposable).

## Goal

Implement Nurture's canonical, current and fail-closed owner decision for
`nurture.family-sharing-eligibility@1.0.0`, including a default-off private
transport and an explicit withdrawal-cleanup owner, without treating identity
or an unrelated Grant as sharing authority.

## Non-goals

- Do not own or copy My-Chat family consent, authorization receipts or global
  Child/Family identity.
- Do not add, relabel, reinterpret or backfill `NurtureGrantDataClass` values
  for `media` or `focus_collaboration`.
- Do not query the My-Chat database or persist raw `child_id`, `family_id`,
  membership ids or protected owner evidence.
- Do not add a synthetic positive provider, production caller, rollout flag,
  deployment or traffic authority.
- Do not project eligibility into My-Chat, Convex, search or a cache used for
  authorization.

## Context

My-Chat has frozen and implemented its canonical consent/withdrawal, receipt,
outbox and query/prepare/confirm boundary. It pins
`nurture.family-sharing-eligibility@1.0.0` at digest
`sha256:0cc3ccc8df55b1c6060c5b39af02fb1026c260dae53727f5fdeff72f2b08f5d8`.
Nurture currently exposes a pure resolver and test seam only. The independent
review at Nurture revision `b20d3317049b2b689811f0ded33b06746a0d7773`
found no exact media/focus authority, no category release/receiving policy,
ambiguous multi-enrollment cardinality and no production private transport.

T-009 remains closed: its explicitly released family-growth material provider
is not the general cross-owner sharing authorization introduced here. T-002
and T-007 continue independently in their existing worktrees.

## Acceptance criteria

- [x] I4-C0 has an explicit owner model for role, pair authority, release
  policy, receiving policy and live source/destination lifecycle.
- [x] Current `NurtureGrantDataClass` values are excluded from the new positive
  media/focus path; no compatibility alias or backfill exists.
- [ ] A reviewed additive Prisma migration persists exact category authority
  and separate release/receiving policy facts.
- [ ] One PostgreSQL repository resolves an exact verified pair and fails
  closed for missing, stale, revoked, duplicate or ambiguous authority.
- [ ] A dedicated private route reuses detached Ed25519 verification, service
  trust, short expiry and database nonce replay protection, and returns
  `private, no-store` responses without protected identifiers.
- [ ] Nurture explicitly owns withdrawal cleanup for its derived media/focus
  stores and returns an idempotent cleanup receipt.
- [ ] Fresh-database migration, owner-negative coverage and joint My-Chat
  grant/withdrawal/outage/stale/replay/response-loss/cleanup conformance pass.
- [ ] Production composition remains unavailable until all activation gates
  are separately approved.
