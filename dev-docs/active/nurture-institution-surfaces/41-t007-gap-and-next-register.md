# T-007 Gap and Next-step Register

## Status

- Date: 2026-08-10
- Task: T-007
- Purpose: the **live** list of what is not built and what comes next.

This register is the single place that answers "where is T-007 now". The
other numbered records are history: each says what was true when it was
written and is never edited to stay current. Each row below cites the record
that found the gap rather than restating its reasoning — a gap described in two
places drifts in one of them.

## Where the branches stand

| Branch | Freeze | Implementation | Evidence |
| --- | --- | --- | --- |
| 0A inventory | `G4_0A_INVENTORY_PASS` | n/a | [`07`](./07-g4-0a-inventory-record.md) |
| 0B publication policy | frozen `@1.0.0` | provider qualified through T-006's G3 | [`08`](./08-g4-0b-publication-policy-freeze.md) |
| 0C authority & surface | `G4_0C_EXIT_PASS`, six units | **G4-A, four increments** | [`19`](./19-g4-0c-exit-record.md), [`21`](./21-g4-a-increment-1-audit-record.md)–[`24`](./24-g4-a-increment-4-record.md) |
| 0D daily operations | `G4_0D_EXIT_PASS`, five units | **G4-B, twelve increments — 0D-1/checkpoint, 0D-2, class-day detail and 0D-5; G4-C increments 1–2 — 0D-3 revision/downscope, capture intake and 0D-4 correction candidate** | [`32`](./32-g4-0d-exit-record.md), [`34`](./34-g4-b-increment-1-record.md)–[`48`](./48-g4-c-increment-2-record.md) |
| 0E Workflow & Enrollment Journey | `G4_0E_EXIT_PASS`, four units | **G4-D increments 1–3 — registry/state/projection, qualified inquiry carrier and qualified waitlist/policy/offer/reservation/preparation** | [`55`](./55-g4-0e-exit-record.md), [`57`](./57-g4-d-increment-1-record.md)–[`59`](./59-g4-d-increment-3-record.md) |
| 0F knowledge & RAG | **not started** | none | — |

All implementation work remains at **I1**. Persistence increments carry exact
schema, policy, repository/service code and migration authoring, and all
implemented daily-operations and G4-D inquiry/waitlist/preparation persistence
paths are qualified on disposable PostgreSQL. No I2
contract release, no I3 owner integration, no I4 joint conformance, no
capability registration, no activation, no traffic.

G4-D increments 2–3 have clean disposable-only DB qualification. Increment 3
adds explicit policy/FIFO/override/offer/reservation/cancellation semantics and
keeps rank/category facts out of the family projection. It introduces no
automatic timer, deadline/blocker lifecycle, Enrollment/Grant side effect or
parallel trial-care path.

## Gap register

### G-01 — Nothing has a production caller

Every unit G4-A, G4-B and G4-C built is exercised by tests only.
`NurtureInstitutionPolicyService`, `NurtureInstitutionAuthorityChain`, the
attendance specs, the preview service, the schedule service and the class-list
and class-day-detail services have no ingress route, no handler and no
registered capability.

That is I1 as frozen, not an oversight — but it bounds every claim made so far:
0C and 0D are validated as **buildable as frozen**, never as running. Wiring is
I2's additive capability rotation.

Cited by: [`20`](./20-g4-a-i1-branch-freeze.md), [`33`](./33-g4-b-i1-branch-freeze.md).

### G-03 — 0D-5 exact deterministic owner integration: partial

The policy schema/migration, actor-safe projection composer, 0C-5 aggregate
guard, stable dedupe, fixed tier/reason and deadline/fixed-subject ordering are
implemented by [`43`](./43-g4-b-increment-9-record.md). This executes 0C-5 §6
fixture 16 synthetically.

[`44`](./44-g4-b-increment-10-record.md) implements six typed adapters, passes
the resolved active role and effective policy to exact owners, fails the whole
deterministic read closed on one owner outage, and wires class/home consumers
without adding a second ordering or body-bearing card shape.

[`45`](./45-g4-b-increment-11-record.md) binds all six ports to concrete Prisma
owner providers. Every provider rechecks the exact selected Admin role and
Institution, resolves the policy-backed local day and returns actor-bound
opaque refs. Business response, review backlog, a literal blocked
WorkItem/Workflow-driver receipt and configured load are proven through real
owner rows. Reads are bounded and return `unavailable` rather than a partial
result. The 0D-5 policy migration is also qualified on an approved disposable
database and that database has been destroyed.

The post-binding quality pass (`a982aed`, `e1c93ed`, `acbf9eb`, `260174a`) removes
request-object authority caching, requires the disclosure-aware communication
owner before configured-load counting, rejects ambiguous source-item mappings,
uses canonical pending axes, matches blocked receipts to their authorized
source dimensions, and isolates one internal shared owner context without
changing the sole public composition path. A fresh approved disposable target
subsequently qualified these repairs at current head: the exact-owner suite
passed 9/9 and the full production-DB lane passed 357/357 across 37 files. The
target was destroyed and confirmed absent.

[`46`](./46-g4-b-increment-12-record.md) closes the attendance fact gap with a
versioned exact-class 0D-1 policy. The attendance owner, not the signal layer,
resolves its local-time checkpoint through the existing local-day timezone
owner. Missing/ambiguous history remains unavailable, and a policy first
effective after day start cannot backdate a deadline. The clean 27-migration
deploy, exact-owner 12/12 and full DB 360/360 passed on a destroyed disposable
target.

One owner fact remains unavailable by design. The current authority/source
schemas expose no currently readable canonical blocker fact; in particular
revoked, withdrawn, redacted and cancelled sources are unreadable or terminal,
while literal item/workflow-driver blockers belong to the separate
WorkItem/Workflow category. These are owner-contract facts, not permission to
add signal-local blocker state. Until an exact owner exposes a readable
canonical fact for its own business reason, G-03 remains partial and consumers
MUST retain their explicit unavailable arm.

### G-07 — Placement level 4 (assisted semantic judgement) is frozen and disabled

Present in the union, emitted by no code path, with a test asserting that. Not a
defect: enabling it is a deliberate later decision, and the test is what makes
enabling it visible.

Do not confuse it with 0D-2 §4's photo level 4 added by
[`40`](./40-g4-b-increment-7-record.md). Different sections, different
orderings, same number.

### G-08 — Migrations are authored but not applied anywhere durable

`20260809120000_g4b_daily_attendance_closeout` and
`20260809140000_g4b_class_schedule_placement` have run on a disposable database
only. `20260809180000_g4b_institution_support_signal_policy` has now also passed
clean migrate-deploy, real-row constraint and full DB-suite qualification on an
explicitly approved disposable database. That target was destroyed after the
run. `20260809210000_g4b_attendance_checkpoint_policy` passed the same clean
disposable-only qualification with the full 360-test DB lane.
`20260809230000_g4c_content_revision_downscope` passed a clean 28-migration
deploy, direct constraint probes and the full 370-test DB lane. Every target
was destroyed afterward. `20260810010000_g4c_attribution_correction_candidate`
passed a clean 29-migration deploy, append-only/same-Workspace qualification,
zero datasource-to-SSOT drift and the full 377-test DB lane; its target was
also destroyed. `20260810030000_g4d_enrollment_journey_inquiry` passed a clean
30-migration deploy, targeted 3/3 and full 380/380 DB lane.
`20260810050000_g4d_waitlist_trial_preparation` passed a clean 31-migration
deploy, targeted inquiry/waitlist 8/8, concurrent/reverse capacity
falsification and full 385/385 DB lane. The final bounded-query release rerun
used `nurture_t007_g4d_i3_release_20260810_05`; all exact qualification/rerun
targets were destroyed with zero sessions and zero datasource drift. Shared or
persistent apply remains unauthorized at I1.

### G-09 — The My-Chat pin needs an adoption decision

`verify:workflow-contract-pin` is red. My-Chat no longer sits at the pinned
`567b96c`; its active checkout has continued moving since the earlier recorded
`x5_joint_api` divergence. The simplification rerun observed `fd2a213c`; C30's independent
upstream lock still expects `51ad97f`
([`46`](./46-g4-b-increment-12-record.md), [`48`](./48-g4-c-increment-2-record.md)).
Neither external head is treated as a Nurture pin.

Advancing the pin is an **adoption** of another task's work, not a refresh, and
it needs whoever owns that work to qualify it. Until then this gate stays red
for a stated reason rather than being made green by copying a hash.

Cited by: [`40`](./40-g4-b-increment-7-record.md),
[`42`](./42-g4-b-increment-8-record.md),
[`44`](./44-g4-b-increment-10-record.md).

### G-10 — Enrollment Journey I1 is partial; trial/formal units remain

G4-D increments 2–3 now supply DB-qualified private inquiry and capacity
waitlist/preparation owners. The latter provides standard-only FIFO by default,
version-pinned policy/category ordering, append-only Admin override, family-
safe no-rank projection, explicit offer, exact-class held reservation and
pre-trial cancellation. All state changes use the existing command ledger and
immutable transition audit; concurrent accepts and direct class capacity
downscope cannot overbook. Admin ordering reads are bounded and fail unavailable
above 500 entries until an explicit pagination contract is frozen.

0E-3 trial phase migration/lifecycle and 0E-4 formalization/completion are not
implemented. No current My-Chat Child/Family binding revalidation, pending
Enrollment/Grant/CareGroup preparation, trial-start transaction, trial review,
formal phase commit or trial exit transaction exists yet.

Real prospective-contact and native business-message source adapters remain
I3 gates. No Host bridge, public caller, capability registration or traffic
exists; `workflowRunRef` still accepts only the exact My-Chat-owned canonical
ref and the private workflow ref is never projected.

Cited by: [`58`](./58-g4-d-increment-2-record.md),
[`59`](./59-g4-d-increment-3-record.md).

## Closed since the 0D Exit

- **G-04, 0D-4 child-attribution authority** — closed at I1 by the sourced,
  Admin-only, append-only correction report and exact-class caregiver read;
  canonical correction still belongs exclusively to T-006
  ([`48`](./48-g4-c-increment-2-record.md)).
- **G-05, automatic placement intake** — closed at I1 by deriving exact
  class/date/minute from the persisted capture and reusing 0D-2's schedule
  service and storage-time Admin precedence fence
  ([`48`](./48-g4-c-increment-2-record.md)).
- **G-02, 0D-3 append-only revision/downscope** — closed at I1 by the canonical
  revision chain, atomic placement projection, monotone visibility downscope,
  protected note envelope and database-level append-only/continuity guards
  ([`47`](./47-g4-c-increment-1-record.md)).
- **A class with no schedule showed no photo** — closed by 0D-2 §4's level 4
  ([`40`](./40-g4-b-increment-7-record.md)).
- **D-05's "latest text excerpt"** — closed by correcting the architecture to
  "latest text presence 和 source timestamp", the only thing the projection can
  honour without opening a protected-content release path
  ([`40`](./40-g4-b-increment-7-record.md)).
- **0C-5 §6 fixture 14** — closed by the class list
  ([`36`](./36-g4-b-increment-3-record.md)).
- **G-06, `InstitutionClassDayDetailProjectionV1`** — closed at I1 by the
  class-scope authority, actor-safe timeline, exact communication owner-read,
  formal attendance and purpose/grant-gated child drill-down
  ([`42`](./42-g4-b-increment-8-record.md)).

## Next steps, in dependency order

1. **G4-D increment 4 / 0E-3** — implement phase migration and trial lifecycle
   from the existing freeze, reusing exact-class capacity and canonical
   Enrollment/Grant/CareGroup paths without a TrialChild or parallel care
   pipeline.
2. **G4-D increment 5 / 0E-4** — formalization, exit and completion after 0E-3
   is DB-qualified. G-09 must be resolved before claiming real My-Chat owner
   integration at I3.
3. **Commit-boundary local lock refresh** — after the implementation receives
   an exact commit, re-freeze the affected C30 profiles from recomputed
   `57e4759f…`; do not invent a revision for dirty working-tree bytes.
4. **0F Knowledge/RAG freeze** may proceed independently, but it cannot replace
   any required G4-D path.
5. **I2** — capability registration and contract rotation — which is what turns
   G-01 from a bound into a completed step. Not before the branch it publishes
   is done.

G-03's remaining authority/source fact is an external owner gate, not an
actionable implementation step in the current schema. Resume it only when a
business owner exposes a currently readable canonical blocker; do not hold the
independent 0E/0F work behind a signal-local invention.

G-09 sits outside this order: it is a cross-repository decision, not T-007 work,
and it blocks the pin gate rather than any of the steps above.
