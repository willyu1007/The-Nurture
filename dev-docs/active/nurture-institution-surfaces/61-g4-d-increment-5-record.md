# G4-D Increment 5 — Formalization and Completion

## Verdict

- Date: 2026-08-10
- Task: T-007
- Input: qualified increment 4 and frozen 0E-4
  ([`53`](./53-g4-0e-4-formalization-completion-freeze.md))
- Verdict: `G4_D_INCREMENT_5_DB_QUALIFIED`
- Effect boundary: private I1 source/schema only; no public capability, Host
  caller, durable database apply, deployment, activation or traffic

## Implemented slice

- `propose_formal_enrollment` now appends an immutable proposal revision that
  binds the current workflow, trial Enrollment/Grant/reservation, exact
  CareGroup head, Admin role, safe summary, formal start, bounded Grant terms
  and proposal expiry. The current proposal is the greatest revision; there is
  no mutable current-status carrier.
- Added the private `formalize_enrollment` command. Its caller supplies only the
  workflow/proposal/acceptance refs, accepted time, expected local heads and
  purpose-bound current-owner evidence. Caller-created role/scope, lifecycle,
  commit time, evidence hash, transition or result fields are rejected.
- One serializable command-ledger transaction locks the exact proposal,
  workflow, Enrollment, Grant, reservation and CareGroup. It changes the same
  Enrollment `trial -> formal`, narrows the existing Grant to the proposal,
  retains the same occupied seat, records the Guardian acceptance and evidence
  digest, and completes the workflow as `completed/formalized`.
- Exact replay returns the frozen result. A retry MAY refresh volatile evidence
  hash/nonce/timestamps when the acceptance and all business identities remain
  identical; changed acceptance time or expected business state conflicts.

## Ownership and storage boundary

- The existing exact Child/Family verifier is now one shared local adapter for
  trial start and formalization; no second binding/Guardian truth path remains.
- The repository validates the frozen evidence shape and reasserts current
  local anchor versions, associations, authorizations, active Child/Family/
  CareProcess, principal binding and one effective Guardian role. I3 MUST add
  authenticated My-Chat transport/signature/nonce verification before calling
  this I1 boundary; G-09 still blocks that claim.
- Only the non-reversible current-owner evidence hash and six detached metadata
  fields are persisted. The evidence body, raw platform objects and Host
  Run/Step state are not stored.
- No workflow outbox, settling stage, formalization deadline, blocker carrier,
  second Enrollment, second Grant, seat release/reacquire or automatic timer
  was added.

## Quality repairs

- Migration replay preserved the pre-existing Guardian transition shape and
  routed formalization to exactly one validator. An early draft either rejected
  older Guardian actions or ran both generic and formalization validators.
- Proposal timing now requires `formal start < proposal expiry` in both the
  domain and PostgreSQL. Expired or acceptance-stale owner evidence is reported
  as an owner denial, not a business-state conflict.
- Proposal storage has only its primary key and one workflow/revision unique
  index. The transition has one proposal lookup index and one acceptance-action
  uniqueness fence; a proposal ref is mandatory only for propose/formalize and
  forbidden on every unrelated transition.
- Formal Grant purposes/expiry are constrained to the immutable trial policy
  snapshot and the accepted proposal. The integration fixture exercises an
  expiry narrower than the trial policy, not only a no-op terms update.
- Test-only diagnostic throws and temporary instrumentation were removed.

## Verification

| Check | Result |
| --- | --- |
| Targeted unit | PASS — 7/7 |
| Full unit lane | PASS — 878/878, 79 files |
| Targeted PostgreSQL | PASS — 7/7 |
| Full PostgreSQL lane | PASS — 387/387, 42 files |
| TypeScript / Prisma | PASS — root typecheck; format, validate and generate |
| Structural gates | PASS — routing 148; persistence, port topology and G3 freeze |
| Migration replay | PASS — 33 migrations from empty on the approved disposable target |
| Migration status / drift | PASS — current / no datasource-to-SSOT difference |
| Storage census | PASS — no duplicate proposal index; hash + allowlisted metadata only |
| DB context | PASS — checksum `3cc9d48c…` |
| Local qualification locks | PASS — C30 `9a88a32a…` at `c4ac700`; exact runtime `6b8edb81…` over 249 files |
| External My-Chat pin | KNOWN RED — expected `567b96c`, observed `a19ac96`; no adoption performed |
| Disposable cleanup | PASS — zero sessions; exact target destroyed and absent |

Re-run the main qualification with an explicitly disposable database URL:

```bash
pnpm typecheck
pnpm test:unit
pnpm exec vitest run -c vitest.db.config.ts
pnpm verify:test-routing
pnpm verify:persistence-boundaries
pnpm verify:port-topology
```

The DB command MUST receive a URL whose database pathname has been replaced
with the approved disposable target. Expected results are 878 unit tests, 387
DB tests and no migration drift. Never run this qualification against the
configured shared/default database.

## Remaining gates

- I2 may rotate the public contract and register the private capability only
  after this I1 commit boundary is locked.
- I3 must bind the authenticated My-Chat current-owner provider and private
  ingress; it remains blocked by G-09's unadopted My-Chat revision.
- I4 must jointly qualify current-owner negatives, Host replay and identical
  mobile/Web committed-head consumption. Increment 5 does not claim any of
  those gates.
