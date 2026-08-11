# T-007 Gap and Next-step Register

## Status

- Date: 2026-08-11
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
| 0F knowledge & RAG | **`G4_0F_EXIT_PASS`, three units + audit** | **G4-E private I1 qualified through E4; I2-A/I2-B exact and default-off; Q2/generation owners adopted; sole `/v2` Q3 adapter qualified; formal ingress and complete owner source bound default-off; E7 DB qualification `PASS` at `223daa7`; E8 joint conformance `PASS` at `8d41be1`; **G4-E Exit issued (`G4_E_EXIT_PASS_ADAPTER_QUALIFIED`, record 85)**; `live_qualified=false` stays the activation gate** | [`64`](./64-g4-0f-scope-freeze.md)–[`85`](./85-g4-e-exit-record.md) |

Domain/persistence implementation remains at **I1** and all implemented daily-
operations and G4-D persistence paths are qualified on disposable PostgreSQL.
G4-D additionally has the exact I2-A wire artifact and synthetic I2-B
handler/presenter composition. Institution Knowledge now exposes only three
fail-closed, explicitly disabled formal trusted handlers; its old internal
adapter keys are removed. The complete owner composition exists only as
default-off source: exact signed-role current authority, encrypted bounded
prepare/confirmation persistence, and principal-bound My-Chat retrieval/final
access. Its additive migration is disposable-qualified
(`G4_E_E7_DB_QUALIFICATION_PASS` at `223daa7`, record
[`83`](./83-g4-e-e7-db-qualification-record.md)); durable apply remains
approval-gated. No I4 joint
conformance, runtime capability activation or traffic exists. 0F now has a mechanically verified generic
My-Chat Knowledge/PBR/RAG source pin, an accepted three-unit decomposition,
the exact Nurture-owned lifecycle/provenance contract, retrieval/source/
currentness bridge and cited-answer/safety/conflict-candidate contract. The 0G
audit removes candidate-as-hold and lifecycle-command ambiguity, and 0F exits
with `G4_0F_EXIT_PASS`. G4-E now has private lifecycle/provenance,
retrieval/currentness/preview and answer-safety/conflict-candidate domain plus
five tables qualified on a destroyed disposable PostgreSQL target. E5 adds the
exact source-only `1.20.0` public wire artifact. The My-Chat T-040 sequence
through `942bd00` now supplies durable Q2 ingestion/currentness, canonical Q3
generation replay and the provider-neutral safety owner/write boundary. Nurture
still has no production caller, Host route, activation or traffic. The My-Chat
service-backed structured safety adapter and V2 owner/runner produced accepted
`2.1.0` `adapter_recorded` evidence: 15 fixtures, two attempts each and 30
unique invocation ids at the complete 13-pin tuple in
[`80`](./80-g4-e-q3-provider-qualification-contract.md). Q3 is
`adapter_qualified`; pre-V2 evidence is invalid/non-current, and
recorded transport is not live evidence.

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
`20260810210000_g4e_institution_knowledge_lifecycle` and
`20260810230000_g4e_institution_knowledge_answer_safety` are newer and have
now passed all 35 migrations, targeted 2/2 and full 391/391 DB lanes, current
status and zero datasource drift on the exact approved disposable target. The
target was destroyed and confirmed absent with zero sessions; no shared or
persistent database received either migration ([`73`](./73-g4-e-i1-audit-qualification-record.md)).

### G-09 — Closed: exact My-Chat workflow/source adoption

The authorized teacher-release migration qualified and adopted My-Chat
revision `6d909bc`, retaining byte-identical Base/My-Chat Workflow contracts
and rotating the exact `x5_joint_api`/binding-host source hashes. The Nurture
self-pin also covers the current provider/runtime population. Exact pin, G2
contract and owner-boundary checks are green.

This closes only the stale cross-repository adoption gate. It does not create
G4-D prospective-contact/native-message/formalization adapters, G4-E safety
provider binding, formal ingress, deployment, activation or traffic.

Cited by: [`79`](./79-teacher-release-owner-v3-migration.md). Earlier red-pin
observations in [`40`](./40-g4-b-increment-7-record.md),
[`42`](./42-g4-b-increment-8-record.md) and
[`44`](./44-g4-b-increment-10-record.md) remain historical evidence.

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
scenario-service ingress are also unimplemented I3 gates. G-09 is closed; the
module's two adapter keys fail closed by default and the manifest marks their
chat/mobile/Web composition disabled. No Host bridge, real owner binding,
database operation, activation or traffic exists; `workflowRunRef` accepts only
the exact My-Chat-owned canonical ref, and the private workflow ref is never
projected.

The revision-bearing local C30 adoption lock remains historical G4-D evidence.
The current cross-repository Workflow/source population is adopted separately
by [`79`](./79-teacher-release-owner-v3-migration.md); neither pin substitutes
for the missing G4-D I3 owner implementations.

Cited by: [`58`](./58-g4-d-increment-2-record.md)–[`63`](./63-g4-d-i2-b-surface-adapter-record.md).

### G-11 — G4-E I1/I2 are qualified; I3–I4 remain

[`70`](./70-g4-e-increment-1-record.md) implements the frozen 0F-1 private
item, sealed immutable revision, atomic authority links, append-only events and
five exact-replay lifecycle commands. Current explicit Admin/Institution scope,
complete bounded history, row-locked revision allocation and expected-item-head
CAS form one write path. The four-table migration is disposable-qualified; no public
Surface, retrieval, model/index runtime or second knowledge lifecycle exists.

[`71`](./71-g4-e-increment-2-record.md) now implements 0F-2's pure
index/online/preview eligibility, body-free change/reconciliation provider,
bounded retrieval/currentness ports and actor-bound opaque preview options.
It adds no table and binds no real Host owner/runtime.

[`72`](./72-g4-e-increment-3-record.md) implements strict cited claims,
structured request/source/draft safety ports, final owner currentness,
medical authority precedence, fixed abstentions/portable provenance and the
one immutable conflict candidate. Its fifth-table migration is disposable-
qualified but not durably applied; no
model, safety provider, Surface or candidate lifecycle is bound.

[`73`](./73-g4-e-i1-audit-qualification-record.md) closes E4/Q1 after real
PostgreSQL repaired the first-publication nullable CAS and stale conditional
export path. All 35 migrations, the 43-file DB lane, current status, zero drift
and destroyed-target evidence pass. [`74`](./74-g4-e-i2-a-contract-artifact-record.md)
adds the exact seven-capability I2-A artifact without a caller: one read-only
preview, one effectful answer action and five lifecycle actions. [`75`](./75-g4-e-i2-b-surface-adapter-record.md)
maps all seven to existing I1 behavior through exact validators/presenters.
The later formal landing removes its two internal Workbench handlers rather
than retaining a compatibility lane. The historical E7 audit
[`76`](./76-g4-e-i3-owner-gate-audit.md) found no scenario owner delta at
`4d22aab`. That external-state finding is superseded by the authorized T-040
sequence adopted in [`78`](./78-g4-e-q2-q3-owner-progress.md): Q2 is closed,
Q3 generation replay and the provider-neutral safety boundary are implemented
and Q4 is closed. The latest user decision in
[`80`](./80-g4-e-q3-provider-qualification-contract.md) accepts a service-
backed structured safety decision through the unified My-Chat gateway. The V2
adapter has passed
`nurture.institution-knowledge-answer-safety-provider-qualification@2.1.0` /
`sha256:b2e39994e712877277b2efa49300a3cf9a8b313db0f03a64fd3ffc59fb9b5741`
as `adapter_qualified`, closing Q3's I3/I4 prerequisite. [`81`](./81-g4-e-e7-owner-composition-record.md)
qualifies exact owner/adapter admission plus the My-Chat default-off owner
composition. [`82`](./82-g4-e-e7-formal-ingress-contract-audit.md) now records
the resolved contract gap: Base/My-Chat provide the committed verified handler
registry, Nurture freezes owner-held prepare/execute confirmation, and the
scenario module exposes only the exact formal trusted handlers. The concrete
owner source is now implemented as one indivisible binding.
[`83`](./83-g4-e-e7-db-qualification-record.md) closes the disposable-DB
qualification with two pre-apply repairs.
[`84`](./84-g4-e-e8-joint-conformance-record.md) closes E8 joint conformance
through the real Base dispatcher at `adapter_qualified` (12/12 matrix plus a
24/24 full x5 lane on fresh disposable targets), and
[`85`](./85-g4-e-exit-record.md) issues the G4-E Exit. Remaining G4-E-adjacent
gates are activation-only (`live_qualified`) and the durable-apply approval;
the open implementation work is G4-D I3/I4 and G4-F.
Model-weight verification and live secrets are not required for that default-
off slice.

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

1. ~~Qualify the G4-E E7 persistence slice~~ — done 2026-08-11 as
   `G4_E_E7_DB_QUALIFICATION_PASS` at `223daa7`
   ([`83`](./83-g4-e-e7-db-qualification-record.md)): 36/36 empty deploy,
   4/4 targeted authority/dedup/expiry-scrub/conflict/consume-replay checks,
   full DB lane 395/395, drift none, destroy census `0/0`, two pre-apply
   repairs recorded.
2. ~~G4-E E8~~ — done 2026-08-11 as `G4_E_E8_JOINT_CONFORMANCE_PASS` at
   `8d41be1` ([`84`](./84-g4-e-e8-joint-conformance-record.md)): the real Base
   dispatcher drove cited-positive general/medical, no-source,
   medical-conflict with one idempotent review candidate, unsafe text,
   provider outage, post-generation currentness, prepare/execute drift,
   ledger replay, privacy negatives and the default-off census, 12/12 plus a
   24/24 full x5 lane on fresh disposable targets. The G4-E Exit is issued as
   [`85`](./85-g4-e-exit-record.md) (`G4_E_EXIT_PASS_ADAPTER_QUALIFIED`)
   without activating anything.
3. **Activation gate, later** — before enabling any Q3 flag or traffic, run a
   real secret-backed request through the same gateway and record
   `live_qualified`. Never label recorded/synthetic transport as live evidence.
4. **G4-D I3** — bind the authenticated My-Chat
   prospective-contact/native-source/current-owner providers and formal
   scenario-service ingress. Retain exact option/confirmation heads and the
   default-off runtime gate while qualifying on an approved disposable DB.
5. **G4-D I4** — run joint negative/replay/mobile-Web head conformance only
   after the I3 owner and ingress paths qualify.

G-03's remaining authority/source fact is an external owner gate, not an
actionable implementation step in the current schema. Resume it only when a
business owner exposes a currently readable canonical blocker; do not hold the
independent 0E/0F work behind a signal-local invention.

G-09 is closed. G4-D I3/I4 now wait on their concrete owner-adapter and formal-
ingress implementation, not on a stale external revision pin.
