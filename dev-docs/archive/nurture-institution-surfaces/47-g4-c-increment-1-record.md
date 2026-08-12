# G4-C Increment 1 — Append-only Content Revision

## Verdict

- Date: 2026-08-09
- Task: T-007
- Implements: 0D-3 append-only revision/downscope at I1
- Contract: `nurture.content-revision-downscope@1.0.0`
- Migration: `20260809230000_g4c_content_revision_downscope`
- Implementation revision: `3a93140`
- Verdict: **I1 PASS; G-02 closed**
- Non-effects: no shared/persistent database apply, production caller,
  capability registration, contract rotation, deployment, activation or
  traffic.

## Owner boundary

One Nurture Content owner now appends placement, visibility and institution-note
revisions. It derives the previous value, actor role assignment, head and
supersession link from exact owner facts; callers supply only the requested
change, expected heads and required reason. Teacher body, media, author and
source time remain unchanged.

Placement advances its current projection and appends the revision in the same
command transaction. The old direct `adjustPlacement` repository port is
deleted, so Admin placement has one writer. Automatic placement remains a
separate deterministic owner path, narrowed to non-Admin decisions and fenced
under the database write against stale reads.

Visibility stores only monotone restrictions: hidden, publication ineligible
and restricted audience keys. It does not copy the Guardian Grant/audience
owner and cannot widen access. Institution notes accept only the closed
protected-content envelope; no face embedding or mutable note column exists.

Every read resolves the exact 0C Admin role and class scope, returns a complete
bounded chain or `unavailable`, and uses 0D-2's single effective schedule when
validating an activity target. A lower-precedence schedule layer is never
merged into that result.

## Persistence and adoption safety

The migration is additive unless a durable database already contains an
untracked `decided_by = admin` placement. Such a database aborts before the new
type/table is created because no truthful actor, reason or prior value can be
invented for a backfill.

PostgreSQL enforces typed lanes, non-empty reason, request hash, object JSON,
head/supersession shape, exact contiguous predecessor value and immutable
update/delete behavior. A mistaken revision is corrected only by another
append.

## Quality review repairs

The post-implementation review found and fixed two defects before closeout:

1. the first repository draft unioned slots from day, class and Institution
   schedule layers; it now reuses the sole effective-schedule owner and admits
   only the winning layer; and
2. automatic placement guarded Admin precedence only before the write; the
   repository now repeats exact class/date, unplaced and non-Admin predicates
   in the write and reports a lost race as skipped.

The legacy Admin write port and all references to it were removed. No backup,
temporary, reject or alternate revision/downscope implementation remains.

## Qualification

- Scenario and DB package typechecks: PASS.
- Full unit lane: 836/836 across 74 files.
- Targeted 0D-3 plus 0D-2 production-DB regression: 22/22 across 2 files.
- Full production-DB lane: 370/370 across 38 files.
- Clean disposable deploy: 28/28 migrations; final status up to date.
- Direct PostgreSQL lane/non-empty/hash/chain/immutability probes: PASS.
- Prisma validation, generated DB context and persistence boundary: PASS.
- Test routing: 139 files; unit 74, production DB 38, dev host 11, scenario
  service 14, X5 joint 2.
- C30 default-off census: unchanged.
- External My-Chat workflow pin: attributed FAIL — expected `567b96c`, observed
  `65b2ccb`; no cross-repository adoption was performed.
- Exact disposable target: zero sessions, destroyed and confirmed absent.

Evidence:
[`artifacts/db/0d3-content-revision`](./artifacts/db/0d3-content-revision/04-post-verify.md).

## Exit

G-02 is closed at I1. The next independent increment is G-05: connect the
already-frozen automatic pass to capture intake without adding an Admin writer.
Then 0D-4 may implement the Admin-proposes / exact-caregiver-resolves
attribution correction candidate.
