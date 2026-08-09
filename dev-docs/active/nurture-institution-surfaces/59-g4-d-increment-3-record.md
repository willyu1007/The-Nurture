# G4-D Increment 3 — Capacity Waitlist and Trial Preparation

## Verdict

- Date: 2026-08-10
- Task: T-007
- Input: qualified increment 2 and the frozen 0E-2 contract
  ([`51`](./51-g4-0e-2-waitlist-preparation-freeze.md))
- Verdict: `G4_D_INCREMENT_3_DB_QUALIFIED`
- Database effect: one diff shadow and five exact qualification/rerun databases
  were created on local disposable PostgreSQL and destroyed; no shared or
  persistent target was touched

## Implemented slice

- Added eight closed commands for waitlist qualification, interest review,
  category override, offer issue, offer accept, offer decline/expiry, waitlist
  withdrawal and pre-trial preparation cancellation.
- Added versioned policy, entry, override, offer and reservation carriers under
  one exact Institution/class owner. The default with no policy is
  standard-only FIFO; `waitlistQualifiedAt` is server-owned and policy
  revision/category/order are pinned to the entry.
- Added separate Admin ordered and family-safe query projections. The family
  view contains no rank, queue size, category or other-family facts.
- Guardian acceptance locks the exact class, recounts active Enrollment plus
  held reservations and can create exactly one held reservation. Cancellation
  releases that reservation atomically without creating or changing
  Enrollment, Grant, CareGroup membership or My-Chat identity.
- Reused the existing serializable `NurtureCommandExecution` ledger and
  transition finalizer. PostgreSQL serialization aborts now cross an explicit
  repository rollback-classification port; only
  `command_write_conflict` is same-identity retryable, while business conflicts
  remain terminal.

## Quality repairs

- Current policy selection accepts monotone revisions, while existing entries
  retain their pinned policy/category/order until an explicit append-only Admin
  override.
- Reservation uniqueness is partial over held reservations per workflow, so a
  cancelled preparation does not permanently block a future independent
  qualification.
- Guardian qualification stores the exact owner actor ref, and family reads
  reject an accepted entry unless its workflow is still in active
  `trial_preparation`.
- Guardian review, decline, withdrawal and preparation-cancellation actions
  must occur after the exact state they change; an older valid owner action
  cannot be replayed into a later waitlist/offer/reservation state.
- Concurrent accepts on different offers are serialized by the exact class.
  One succeeds and one returns a definite conflict; a driver serialization
  abort becomes retryable `command_write_conflict`, while a post-lock capacity
  conflict remains terminal. The class never overbooks.
- Policy, entry, override, offer, reservation and transition invariants are
  mirrored in SQL checks/deferred triggers. Append-only/no-delete fences and
  exact command-execution actor/scope links prevent alternate write paths.

## Simplification and final audit

- A behavior-preserving in-place refactor removed repeated payload fields,
  exact-key validation lists and mutation assembly across the eight commands.
  Public type names, command payload shapes and validation strictness did not
  change.
- Shared repository helpers now own Guardian action timestamps, committed
  entity-state mapping and the waitlist contract version used by consumers;
  the former hard-coded `"1.0.0"` consumer values were removed.
- Repeated test command scope and offer-replay setup moved into existing local
  helpers without abstracting the business assertions. The pure-simplification
  checkpoint moved the three files from 3,239 to 3,125 lines (net -114).
- The release audit then added only required owner guards and falsification
  evidence: canonical actions key on object type plus ID; held reservations
  fence direct class capacity/status/deletion downscope; accepted family
  preparation uses the offer review time; Guardian decline records its exact
  occurrence; and the Admin query is a required-field, 500-entry, fail-closed
  read. Final totals are scenario 930, repository 1,273 and DB test 1,011:
  3,239 -> 3,214 (net -25).
- The exact disposable target
  `nurture_t007_g4d_i3_simplify_20260810_03` repeated the clean 31-migration
  deploy, targeted 7/7 and complete 384/384 DB lanes, current-status and
  zero-drift checks, then was destroyed with zero sessions and confirmed absent.
- The final release target `nurture_t007_g4d_i3_release_20260810_05` repeated
  the clean deploy after all audit changes, passed targeted 8/8 and complete
  385/385 DB lanes, current-status and zero-drift checks, then was destroyed
  with zero sessions and confirmed absent.

## Ownership and safety boundary

- No public capability, Host route, manifest registration, deployment,
  activation or traffic was added. Real prospective-contact/native-message and
  My-Chat identity/binding adapters remain later I3 gates.
- No automatic offer, deadline transition, timer, next-offer action, blocker
  lifecycle, Enrollment, Grant or workflow outbox was introduced.
- Wall clock alone changes no business state. Offer expiry/decline and every
  queue/order mutation require an explicit command.

## Verification

| Check | Result |
| --- | --- |
| Targeted unit | PASS — 21/21, 2 files |
| Full unit lane | PASS — 874/874, 79 files |
| Scenario / DB / direct root typecheck | PASS |
| Prisma format / validate / generate | PASS |
| Structural and historical gates | PASS — 148 routed files; five new carriers explicitly declared non-board rows |
| Database feature / strict context | PASS |
| Targeted PostgreSQL | PASS — 8/8, inquiry plus waitlist/preparation |
| Full PostgreSQL lane | PASS — 385/385, 42 files |
| Migration status / datasource drift | PASS — 31 current / zero difference |
| Disposable cleanup | PASS — zero sessions, targets destroyed and absent |
| Nurture exact-runtime self-pin | PASS — `f03b75fb…`, 242 files |
| C30 default-off | PASS — no production action/capability activation |
| C30 local adoption lock | PENDING COMMIT BOUNDARY — current bytes recompute to `57e4759f…`; no false source revision recorded |
| External My-Chat pin | KNOWN RED — expected `567b96c`, observed `fd2a213c`; no adoption |

Detailed disposable-DB evidence is under
[`artifacts/db/0e2-enrollment-waitlist-preparation`](./artifacts/db/0e2-enrollment-waitlist-preparation/00-connection-check.md).

## Next gate

G4-D increment 4 may implement the already frozen 0E-3 phase-migration and
trial-lifecycle slice ([`52`](./52-g4-0e-3-trial-lifecycle-freeze.md)). It must
reuse the same exact-class capacity owner and existing Enrollment/Grant/
CareGroup paths; it must not add a parallel trial identity, care pipeline or
automatic time-driven lifecycle.
