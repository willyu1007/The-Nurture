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
| 0E Workflow & Enrollment Journey | `G4_0E_EXIT_PASS`, four units | **G4-D increments 1–5 private I1; I2-A exact public wire artifact; I2-B default-off surface adapters** | [`55`](./55-g4-0e-exit-record.md), [`57`](./57-g4-d-increment-1-record.md)–[`63`](./63-g4-d-i2-b-surface-adapter-record.md) |
| 0F knowledge & RAG | **scope + all three units frozen; 0G audit passes; Exit open** | none | [`64`](./64-g4-0f-scope-freeze.md)–[`68`](./68-g4-0g-0f-audit-record.md) |

Domain/persistence implementation remains at **I1** and all implemented daily-
operations and G4-D persistence paths are qualified on disposable PostgreSQL.
G4-D additionally has the exact I2-A wire artifact and synthetic I2-B
handler/presenter composition. The scenario module and manifest expose only
fail-closed, explicitly disabled internal adapter keys. No scenario-service
formal ingress, I3 owner integration, I4 joint conformance, runtime capability
activation or traffic exists. 0F now has a mechanically verified generic
My-Chat Knowledge/PBR/RAG source pin, an accepted three-unit decomposition,
the exact Nurture-owned lifecycle/provenance contract, retrieval/source/
currentness bridge and cited-answer/safety/conflict-candidate contract. The 0G
audit passes after removing candidate-as-hold and lifecycle-command ambiguity;
Exit remains open. 0F has no domain, persistence, Surface, model or indexing
implementation.

G4-D increments 2–5 have clean disposable-only DB qualification. Increment 3
adds explicit policy/FIFO/override/offer/reservation/cancellation semantics and
keeps rank/category facts out of the family projection. It introduces no
automatic timer, deadline/blocker lifecycle, Enrollment/Grant side effect or
parallel trial-care path. Increment 4 adds the canonical phase, current pair
and Grant preparation, explicit trial/review/extension/proposal lifecycle and
local outage-safe end. Increment 5 adds one immutable formal proposal, current
Guardian acceptance, same-relationship formalization and atomic workflow
completion. I2-A describes those existing facts publicly; I2-B maps them to
the private I1 ports without adding a real owner or database execution path.

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
`20260810100000_g4d_trial_lifecycle` passed a clean 32-migration deploy,
targeted 6/6 and complete 386/386 DB lanes, current status and zero drift on
`nurture_g4d_i4_trial_20260810`. The separate diff target and qualification
target were destroyed and confirmed absent. Shared or persistent apply remains
unauthorized at I1. `20260810170000_g4d_formalization_completion` passed a
clean 33-migration quality replay after the single-proposal/timing repair,
targeted 9/9 and full 389/389 DB lanes with current status and no datasource
drift on the approved disposable target. The exact target was destroyed and
confirmed absent; no durable target is authorized.

### G-09 — The My-Chat pin needs an adoption decision

`verify:workflow-contract-pin` is red. My-Chat no longer sits at the pinned
`567b96c`; its active checkout has continued moving since the earlier recorded
`x5_joint_api` divergence. The lock rerun observed `66720cd` with no
`packages/workflow-contracts` diff from the pin; C30's independent
upstream lock still expects `51ad97f`
([`46`](./46-g4-b-increment-12-record.md), [`48`](./48-g4-c-increment-2-record.md)).
Neither external head is treated as a Nurture pin.

Advancing the pin is an **adoption** of another task's work, not a refresh, and
it needs whoever owns that work to qualify it. Until then this gate stays red
for a stated reason rather than being made green by copying a hash.

Cited by: [`40`](./40-g4-b-increment-7-record.md),
[`42`](./42-g4-b-increment-8-record.md),
[`44`](./44-g4-b-increment-10-record.md).

### G-10 — Enrollment Journey I2-A/I2-B are complete; I3–I4 remain

G4-D increments 2–5 now supply DB-qualified private inquiry and capacity
waitlist/preparation owners. The latter provides standard-only FIFO by default,
version-pinned policy/category ordering, append-only Admin override, family-
safe no-rank projection, explicit offer, exact-class held reservation and
pre-trial cancellation. All state changes use the existing command ledger and
immutable transition audit; concurrent accepts and direct class capacity
downscope cannot overbook. Admin ordering reads are bounded and fail unavailable
above 500 entries until an explicit pagination contract is frozen.

0E-3 is now implemented at private I1: active legacy rows become formal; exact
current Child/Family owners and local associations gate pending Enrollment/
Grant preparation and start; review/extension/proposal are explicit; and local
trial end atomically revokes access and releases the seat without restoring the
old waitlist. 0E-4 adds the immutable formal proposal, current Guardian
acceptance, exact-head trial-to-formal transaction and completed workflow
outcome without releasing/reacquiring the seat or persisting owner evidence.

I2-A now publishes three queries and the complete 21-command inventory through
the exact `nurture.surface-contract@1.19.0` /
`sha256:6f67d49ca303ad627b6644857a16dde7626cc944bf8c065f09629039025f738e`
artifact. Institution mobile remains query-only; Institution actions appear
only in Workbench; Guardian surfaces receive a rank-free family waitlist result
and only Guardian/mixed waitlist, offer, preparation and formalization actions.
Public inputs carry no trusted Workspace/role, owner snapshot/evidence, private
Workflow ref, expected local head or derived lifecycle field. All 24 descriptors
depend on the unqualified `t007_enrollment_journey_runtime` owner-integration
gate.

I2-B now validates the exact public DTOs before trusted resolution, binds every
action to its existing I1 command spec, reuses the three I1 query paths and
applies the exact Institution/Guardian surface matrix. Its presenters project
only the opaque Workflow Run identity, seal Admin action targets and preserve
the family no-rank/no-category boundary. Query and command internal keys reject
cross-lane payloads; canonical Workflow Run or local scope drift fails
unavailable.

Real prospective-contact and native business-message source adapters remain I3
gates. The authenticated My-Chat formalization evidence adapter and formal
scenario-service ingress are also I3 gates and remain blocked by G-09. The
module's two adapter keys fail closed by default and the manifest marks their
chat/mobile/Web composition disabled. No Host bridge, real owner binding,
database operation, activation or traffic exists; `workflowRunRef` accepts only
the exact My-Chat-owned canonical ref, and the private workflow ref is never
projected.

The revision-bearing local C30 adoption lock is current at quality-repair
revision `1a79e13`, aggregate source hash `ef33c0bd…`; the Nurture exact-runtime
pin is `25b7ad2f…` over 250 files. This closes the local commit-boundary
maintenance step without adopting the divergent My-Chat head.

Cited by: [`58`](./58-g4-d-increment-2-record.md)–[`63`](./63-g4-d-i2-b-surface-adapter-record.md).

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

1. **Sign the 0F Exit.** The unit records and 0G cross-contract audit now pass;
   branch release must preserve external scenario/safety bridges as
   `DEFINED_UNQUALIFIED` and open only G4-E I1.
2. **G4-E I1** — after 0F Exit, implement the frozen Nurture facts and pure
   policy incrementally; keep the My-Chat model/vector/RAG runtime absent.
3. **G4-D I3** — after G-09 adoption, bind the authenticated My-Chat
   prospective-contact/native-source/current-owner providers and formal
   scenario-service ingress. Retain exact option/confirmation heads and the
   default-off runtime gate while qualifying on an approved disposable DB.
4. **G4-D I4** — run joint negative/replay/mobile-Web head conformance only
   after the I3 owner and ingress paths qualify.

G-03's remaining authority/source fact is an external owner gate, not an
actionable implementation step in the current schema. Resume it only when a
business owner exposes a currently readable canonical blocker; do not hold the
independent 0E/0F work behind a signal-local invention.

G-09 is a cross-repository adoption decision, not a hash refresh inside T-007.
It blocks G4-D I3/I4 but does not block the independent 0F freeze.
