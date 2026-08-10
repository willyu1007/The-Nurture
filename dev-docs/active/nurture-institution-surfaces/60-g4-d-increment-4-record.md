# G4-D Increment 4 — Trial Relationship Lifecycle

## Verdict

- Date: 2026-08-10
- Task: T-007
- Input: qualified increment 3 and the frozen 0E-3 contract
  ([`52`](./52-g4-0e-3-trial-lifecycle-freeze.md))
- Verdict: `G4_D_INCREMENT_4_DB_QUALIFIED`
- Database effect: two exact local disposable databases were created and
  destroyed; the configured `nurture` database and every shared/persistent
  target were untouched

## Implemented slice

- Added the nullable `trial | formal` participation phase to the existing
  Enrollment owner. The migration backfills pre-0E-3 active rows to `formal`,
  keeps terminal legacy rows nullable and rejects new active rows without an
  explicit phase.
- Added six private commands: prepare relationship, start trial, explicitly
  mark review reached, extend once, propose formal Enrollment and end trial.
  They reuse the command ledger, immutable workflow transition audit and
  expected workflow/Enrollment/Grant/reservation heads.
- Preparation validates the exact current Child/Family binding owners, local
  association heads, current Guardian principal/role and Grant-terms snapshot.
  It creates only pending/null Enrollment and pending Grant rows and binds the
  existing workflow to the local care process.
- Start revalidates the owner pair and exact class revision under the class
  lock, then atomically activates Enrollment as `active/trial`, activates the
  Grant, converts the held reservation to occupancy and advances the workflow.
- Review time alone writes nothing. Review, extension and formal proposal are
  explicit Admin commands. One extension keeps the same seat; its immutable
  offer schedule plus the updated reservation and append-only transition
  actor/reason form the before/after audit.
- End does not read My-Chat owner state. One local transaction ends the trial
  Enrollment, revokes the Grant, releases the converted reservation and closes
  the workflow as `trial_ended`; it leaves the accepted waitlist/offer history
  intact and creates no automatic next offer.

## Ownership and activation boundary

- No `TrialChild`, trial attendance/media table, second care pipeline, workflow
  outbox, deadline row or blocker state was added.
- Trial members use the existing active Enrollment/Grant/CareGroup paths. A
  phase is classification, never permission; normal Grant checks remain the
  authority gate.
- No module/manifest capability, Host route, public caller, deployment,
  activation or traffic was added. The exact current owner evidence is proven
  against local C30 binding rows at I1; real My-Chat owner adapters remain I3.
- `propose_formal_enrollment` is not Guardian acceptance. 0E-4 still owns the
  formalization transaction and completed/formal workflow outcome.

## Quality repairs

- The workflow identity invariant now permits a canonical local care-process
  binding during active trial stages and retained ended-trial history, while
  preserving the prior completed/formalized case.
- Workflow monotonicity permits only the frozen review/extension stage loop and
  explicit trial due-at changes; the immutable transition chain remains a
  deferred commit requirement.
- Reservation monotonicity now distinguishes held conversion, one converted
  extension and converted release. Deferred checks require active/trial
  Enrollment plus active Grant while occupied, and ended/trial plus revoked
  Grant after trial release.
- Pending Grant uniqueness is scoped to preparation only. An initially broader
  current-Grant index was rejected because existing authority intentionally
  permits multiple active grants with different terms.
- Trial start requires a canonical My-Chat `actor` and the exact current
  Guardian who granted the pending Grant. Persisted directions, data classes,
  purposes and expiry must still match the validated immutable terms snapshot.
  Preparation/start also require active local Child, Family and CareProcess
  rows and a Guardian role inside its effective time window.
- The new current-relationship and phase-aware group indexes replace the
  active-only uniqueness and narrower group index they subsume. No duplicate
  physical enforcement/read path remains.
- All pre-existing active Enrollment fixtures now declare `formal`, including
  the dynamic G4-A helper. This makes tests exercise the new canonical
  semantics instead of relying on an implicit compatibility default.
- Repeated review after the one extension does not append the same milestone
  twice. Extension cannot exceed the stored Grant-terms snapshot expiry, and
  the deferred reservation invariant rejects unaudited reservation/Grant date
  drift that does not match the workflow due date.
- Removed the unused exported all-command payload union; callers consume only
  the six exact command payloads/specs, so there is no speculative alternate
  dispatch contract.

## Verification

| Check | Result |
| --- | --- |
| Targeted unit | PASS — 5/5 |
| Full unit lane | PASS — 876/876, 79 files |
| TypeScript | PASS — root typecheck |
| Prisma format / validate / generate | PASS |
| Structural gates | PASS — routing 148; persistence, port topology and G3 freeze |
| Targeted PostgreSQL | PASS — 6/6 waitlist/trial cases |
| Full PostgreSQL lane | PASS — 386/386, 42 files |
| Explicit clock behavior | PASS — clock advance alone left workflow at head 8 |
| Exact owner / stale head | PASS — stale/inactive local owner facts wrote no Grant; expired Guardian role or wrong Grant signer cannot start |
| Start / extension / end atomicity | PASS — one serializable ledger transaction each |
| Formal-count distinction | PASS — active trial occupied the class but formal active count stayed zero |
| Exact replay | PASS — prepare and end returned frozen replay results |
| Migration apply | PASS — 32 migrations from empty |
| Migration status / drift | PASS — current / empty diff |
| DB context | PASS — checksum `30086d74…` |
| Disposable cleanup | PASS — exact targets destroyed and absent |

Detailed database evidence is under
[`artifacts/db/0e3-trial-lifecycle`](./artifacts/db/0e3-trial-lifecycle/00-connection-check.md).

## Next gate

G4-D increment 5 may implement the already frozen 0E-4 formalization and
completion transaction ([`53`](./53-g4-0e-4-formalization-completion-freeze.md)).
It must consume a real current Guardian acceptance owner fact, move the same
Enrollment from trial to formal and reuse the existing Grant/CareGroup/workflow
heads. It must not treat the Admin proposal as consent or activate a public
caller at I1.
