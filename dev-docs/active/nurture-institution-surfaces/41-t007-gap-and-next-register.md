# T-007 Gap and Next-step Register

## Status

- Date: 2026-08-09
- Task: T-007
- Purpose: the **live** list of what is not built and what comes next.

This register is the single place that answers "where is T-007 now". The
numbered records `06`…`43` are history: each says what was true when it was
written and is never edited to stay current. Each row below cites the record
that found the gap rather than restating its reasoning — a gap described in two
places drifts in one of them.

## Where the branches stand

| Branch | Freeze | Implementation | Evidence |
| --- | --- | --- | --- |
| 0A inventory | `G4_0A_INVENTORY_PASS` | n/a | [`07`](./07-g4-0a-inventory-record.md) |
| 0B publication policy | frozen `@1.0.0` | provider qualified through T-006's G3 | [`08`](./08-g4-0b-publication-policy-freeze.md) |
| 0C authority & surface | `G4_0C_EXIT_PASS`, six units | **G4-A, four increments** | [`19`](./19-g4-0c-exit-record.md), [`21`](./21-g4-a-increment-1-audit-record.md)–[`24`](./24-g4-a-increment-4-record.md) |
| 0D daily operations | `G4_0D_EXIT_PASS`, five units | **G4-B, nine increments — 0D-1, 0D-2, class-day detail and the 0D-5 policy/composition core** | [`32`](./32-g4-0d-exit-record.md), [`34`](./34-g4-b-increment-1-record.md)–[`43`](./43-g4-b-increment-9-record.md) |
| 0E Workflow & Enrollment Journey | **not started** | none | — |
| 0F knowledge & RAG | **not started** | none | — |

Everything implemented sits at **I1**: exact schema, policy, repository and
service code plus migration authoring, qualified on a disposable PostgreSQL.
No I2 contract release, no I3 owner integration, no I4 joint conformance, no
capability registration, no activation, no traffic.

## Gap register

### G-01 — Nothing has a production caller

Every unit G4-A and G4-B built is exercised by tests only.
`NurtureInstitutionPolicyService`, `NurtureInstitutionAuthorityChain`, the
attendance specs, the preview service, the schedule service and the class-list
and class-day-detail services have no ingress route, no handler and no
registered capability.

That is I1 as frozen, not an oversight — but it bounds every claim made so far:
0C and 0D are validated as **buildable as frozen**, never as running. Wiring is
I2's additive capability rotation.

Cited by: [`20`](./20-g4-a-i1-branch-freeze.md), [`33`](./33-g4-b-i1-branch-freeze.md).

### G-02 — 0D-3 append-only revision and downscope: unimplemented

Frozen in [`28`](./28-g4-0d-3-revision-downscope-freeze.md); no schema, no
domain module, no repository. Nothing in the code references a revision chain or
a downscope decision.

### G-03 — 0D-5 exact deterministic source adapters: partial

The policy schema/migration, actor-safe projection composer, 0C-5 aggregate
guard, stable dedupe, fixed tier/reason and deadline/fixed-subject ordering are
implemented by [`43`](./43-g4-b-increment-9-record.md). This executes 0C-5 §6
fixture 16 synthetically.

What remains is the required real path: six deterministic source adapters must
reuse the exact attendance, business-communication, WorkItem and Workflow
owners. No placeholder adapter is allowed to guess a checkpoint, deadline or
blocker state. Until those adapters and the policy migration are qualified on
an approved disposable database, G-03 is not closed and no class/home consumer
may claim a complete signal list.

### G-04 — 0D-4 child-attribution authority: partial

The authority predicate is correct — G4-A's audit removed `institution_admin`
from `can_confirm_media_attribution` ([`21`](./21-g4-a-increment-1-audit-record.md))
— and T-006's media-attribution transaction exists. What
[`30`](./30-g4-0d-4-attribution-authority-freeze.md) froze on top of that, the
Admin-proposes / caregiver-resolves correction candidate, is unbuilt.

### G-05 — The automatic placement pass is unwired to intake

`isEligibleForAutomaticPass` and `shouldApplyAutomaticPlacement` are implemented
and falsified, but nothing calls them when a capture arrives. Placement rows
therefore exist only when something writes them explicitly.

[`40`](./40-g4-b-increment-7-record.md)'s level 4 reduces the visible harm — an
unplaced photo now reaches the card — but the pass itself still belongs to
whichever increment owns intake.

Cited by: [`37`](./37-g4-b-increment-4-record.md), [`40`](./40-g4-b-increment-7-record.md).

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
only. `20260809180000_g4b_institution_support_signal_policy` is authored and
has not been applied even to the current local test database because no target
and apply approval were supplied. Shared or persistent apply is not authorized
at I1.

### G-09 — The My-Chat pin needs an adoption decision

`verify:workflow-contract-pin` is red. My-Chat no longer sits at the pinned
`567b96c`; its active checkout has continued moving since the earlier recorded
`x5_joint_api` divergence. The latest observed revision is recorded in
[`42`](./42-g4-b-increment-8-record.md), rather than treated as a Nurture pin.

Advancing the pin is an **adoption** of another task's work, not a refresh, and
it needs whoever owns that work to qualify it. Until then this gate stays red
for a stated reason rather than being made green by copying a hash.

Cited by: [`40`](./40-g4-b-increment-7-record.md),
[`42`](./42-g4-b-increment-8-record.md).

## Closed since the 0D Exit

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

1. **Finish 0D-5's exact deterministic owner-source adapters** (G-03), then
   qualify the authored policy migration on an explicitly approved disposable
   database. Wire class/home consumers only after that real source path passes.
2. **0D-3 append-only revision/downscope** (G-02), then wire the already-frozen
   automatic placement pass to capture intake as its own bounded increment
   (G-05). Keep those commits separate: one owns Admin history/downscope, the
   other owns deterministic intake placement.
3. **0D-4's correction candidate** (G-04), the smallest remaining 0D unit.
4. **0E Workflow and Enrollment Journey freeze**, then **0F knowledge and RAG**.
   Both are unstarted at the freeze stage, so each is a 0-branch of its own
   before any implementation.
5. **I2** — capability registration and contract rotation — which is what turns
   G-01 from a bound into a completed step. Not before the branch it publishes
   is done.

G-09 sits outside this order: it is a cross-repository decision, not T-007 work,
and it blocks the pin gate rather than any of the steps above.
