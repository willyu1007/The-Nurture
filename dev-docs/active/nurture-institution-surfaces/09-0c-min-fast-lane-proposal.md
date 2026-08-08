# G4-0C-min Fast-lane Proposal (communication-review slice)

## Status

- Date: 2026-08-08
- Task: T-007
- Proposed contract identity: `nurture.institution-admin-authority@1.0.0`
- Verdict: **PROPOSAL — awaiting a separate governance decision**
- Effects if rejected: none; T-007 stays `planned` at G4-0C
- Effects if accepted: opens design/freeze work for one narrow lane only

This is a scoping proposal, not a freeze record and not a PASS. It asks one
question: should T-007 issue a narrow `0C-min` freeze that unblocks exactly
one `institution_workbench` read module, instead of waiting for the full
G4-0C Authority & Surface freeze?

The precedent is G4-0B (`08-g4-0b-publication-policy-freeze.md`), which cut a
bounded, default-off provider/consumer lane out of G4-0 so T-006 could
proceed without T-007 completion. `0C-min` proposes the same shape.

## Why this slice and not another

Of the eight `institution_workbench` content kinds, `communication_review` is
the only one whose provider is already built, ingress-exposed and tested.

| Content kind | Provider state | Blocking freeze |
| --- | --- | --- |
| `communication_review` | **implemented, ingress-exposed, default-off** | 0C authority only |
| `hub` | shell enumeration only | 0C |
| `grant_request_management` | write path absent | 0C |
| `people_operations` | roster/invite absent (0A defers bulk) | 0C |
| `daily_operations` | attendance/schedule facts absent | 0D |
| `insight` | support-signal facts absent | 0D |
| `institution_workflow_queue` | Workflow registry/carrier absent | 0E + G4-D |
| `knowledge_management` | knowledge lifecycle absent | 0F |

Everything below `communication_review` in that table is a genuine fact gap —
no freeze wording can conjure a projection over facts that do not exist.
`communication_review` is different: the facts, the reader and the wire are
already there.

## What already exists (T-005 G2-B, verified 2026-08-08)

`packages/nurture-scenario/src/harness/institution-business-communication.ts`
(255 lines) plus its repository and ingress:

- Interface `nurture.institution-business-communication-owner-read@1.0.0`,
  digest `sha256:dd1b63fe6c7975bafb4170aff3dccc92463dfaf3e5ea7e5bd3c80f1298d6c921`,
  self-checked at module load — the module throws if the shape changes without
  an exact digest rotation.
- `institutionAdminDisclosureAuthorizes`: a **closed** policy-snapshot
  predicate requiring `schema_version === 1`, `disclosed === true`, exact
  `institution_id`/`enrollment_id`/`care_group_id` match, and membership of
  the expected direction, data class and purpose. Missing, legacy or partially
  shaped snapshots deny.
- `InstitutionBusinessCommunicationProjectionV1`: `messageRef`, `occurredAt`,
  `businessScope` (enrollment/careGroup/institution refs, dataClass,
  direction, purpose, `adminSupervision: "pre_send_disclosed"`), `author`
  (side/role), `changeState` (content original/corrected/redacted, lifecycle
  active/closed/suppressed with reason), optional unsealed `content.body`,
  `attachments: []` and **`actions: []`**.
- Decision union: `ok` | `denied(not_authorized)` |
  `unavailable(protected_content_unavailable)`.
- Security posture: carrier `private_service_authenticated_no_store`,
  authority `current_exact_owner_read`, `action_authority: none`,
  `protected_content_copy: forbidden`.
- Repository:
  `packages/nurture-db/src/repositories/institution-business-communication.read.ts`.
- Formal NestJS ingress: `INSTITUTION_BUSINESS_COMMUNICATION_READ_PATH` in
  `apps/scenario-service/src/harness.controller.ts`, gated by
  `config.runtime.institutionBusinessCommunicationReadEnabled` and returning
  `institution_business_communication_read_disabled` when off.
- Coverage: `harness-controller.e2e.test.ts` and `harness.db.e2e.test.ts`.

Crucially, this lane sits **deliberately outside the public surface capability
registry** — the source comment says so verbatim. The lane is a
private-service owner-read reserved for later Admin surface composition, so no
caller can reach the projection as a surface capability today. Promoting that
private lane into a public capability is precisely what `0C-min` proposes.

## What is actually missing

1. **No `institution_admin` authority predicate.**
   `NurtureInstitutionPolicyService` carries six policy keys
   (`can_view_child_care_process`, `can_write_family_care_message`,
   `can_receive_family_context`, `can_share_to_family`, `caregiver_scope`,
   `can_confirm_media_attribution`). `institution_admin` appears only as an
   allowed `role_kind` inside otherwise caregiver-shaped predicates. There is
   no admin analogue to `nurture.caregiver_scope` — i.e. no implementation of
   the `current_institution_admin` and `exact_institution_scope` authority
   rules the visibility matrix already asserts for this surface.
2. **Zero public capabilities for the surface.** The registry holds 33
   capabilities at `1.17.0`; all are guardian/caregiver.
3. **`present_institution_workbench`** is declared in `presenter-registry.json`
   but has no implementation under `packages/nurture-scenario/src`.
4. **No institution repository entry** in `interface/port-registry.json`
   (eight repositories, none institution-scoped).
5. **`t007_institution_workbench`** dependency gate is therefore unsatisfiable,
   which is why the surface's only legal state today is `unavailable`.

## Prerequisite — 0A rebind (completed 2026-08-08)

0A's exact-input table pinned inputs that the T-009 rotations superseded. The
rebind is recorded in `07-g4-0a-inventory-record.md` ("Pin Rebind") with the
0A-1 ledger rows updated; current inputs are `nurture.surface-contract@1.17.0`
/ `sha256:d22851d9…` (shared core `sha256:7bd8a82d…`, 33 capabilities /
6 surfaces), Nurture self-pin `c0f97aec…`, My-Chat `df7a273…`, Base
`8a3ea90…`, parity `8dd53be4…`. This step was required whether or not
`0C-min` is accepted; full 0C needs it too.

**The rebind changed one state, and that change affects this proposal.** The
T-002 owner/source path moved from `PRESENT_PINNED` to `DEFINED_UNQUALIFIED`.
The M5 handoff and the G1 Joint Conformance record were produced at My-Chat
`a019566` / Base `06303e9` / self-pin `b2c53eb7…` — all three now rotated —
and T-009's closing requalification re-ran neither the owner-integration lane
nor the G1 joint fixtures. The T-002 G1 PASS is not revoked and remains exact
at its own topology, but no 0C branch may inherit that record as current-pin
evidence.

For `0C-min` the consequence is that **I3 Owner Integration Readiness must
re-establish the owner path at current pins rather than cite T-002's record**.
That is real added cost, accounted for below, and full 0C carries it too.

## Proposed scope

### In scope

1. **Admin authority predicate.** One new policy key
   (`nurture.institution_admin_scope`) implementing `current_institution_admin`
   and `exact_institution_scope` as the exact predicate that full 0C will
   later extend — a subset, never a fork. Active-role context is explicit; a
   user holding multiple roles must select `institution_admin`, and no merged
   super-authority exists.
2. **Surface envelope for `institution_workbench`.** The shell response
   contract: authorized/`unavailable` state resolution, the per-content-kind
   availability report, and the empty-state vocabulary. Content kinds outside
   this slice report `unavailable` through the contract, not through absence.
3. **`hub` content kind.** Enumeration of the modules the current actor is
   authorized for, with the six unbuilt kinds reported unavailable.
4. **`communication_review` content kind.** One new public read capability
   promoting the existing owner-read into a surface capability. The provider,
   its digest and its deny semantics are consumed unchanged; `0C-min` adds the
   surface binding, presenter and capability descriptor, not a second reader.
5. **Freeze record** covering the eight items required by the `01-plan.md`
   freeze-record contract, scoped to this lane.

### Explicitly out of scope

- **All write capabilities.** `writeBoundary`
  (`explicit_institution_admin_capability`) stays unexercised;
  `grant_request` and `institution_workflow` writes remain GAP. The surface
  is read-only in this slice.
- **Six of eight content kinds**, per the table above.
- **Roster/invite** in any form, including the single-item first increment
  0A already scoped to 0C.
- **Any schema delta.** `0C-min` requires no new table, column or migration —
  it reads existing T-005 facts. This is the strongest safety property of the
  slice and should be treated as a hard constraint: a proposal that needs a
  migration is no longer `0C-min`.
- **Admin action authority of any kind.** `actions: []` and
  `action_authority: none` are preserved verbatim. Admin read never becomes
  Admin act, and never grants CareGroup reply.
- Full 0C, 0D, 0E, 0F, and G4-A through G4-F.

### Version consequence

A new public capability is a contract change: this lands at
`nurture.surface-contract@1.18.0`. No batch is currently open (`1.16.0` and
`1.17.0` both closed with T-009), so this slice would own its own rotation and
its own requalification round rather than contending with another task.

## Gates and exit

`0C-min` runs the standard `01-plan.md` implementation gates, scoped to the
lane:

| Gate | Scope in this slice |
| --- | --- |
| I0 Design/Synthetic | admin predicate state machine, envelope shape, synthetic fixtures |
| I1 Branch Freeze | the `0C-min` freeze record itself; opens lane implementation |
| I2 Contract Boundary | capability/presenter/descriptor against the exact `1.18.0` digest |
| I3 Owner Integration Readiness | T-002 owner path **re-established at current pins** (not inherited) plus T-005 adapters, on disposable PostgreSQL |
| I4 Joint Conformance | protected qualification through the formal NestJS ingress |

Exit is a **branch Freeze PASS for the communication-review lane only**,
phrased as 0B was. It explicitly does not mark T-007 in-progress or complete,
does not satisfy G4-A～F, does not authorize schema apply, capability
activation, persistent deployment, Candidate Freeze or traffic, and does not
open T-008. Everything stays default-off behind the existing runtime flag.

## Risks

| Risk | Mitigation |
| --- | --- |
| The `0C-min` admin predicate forks from full 0C | Freeze it as the exact predicate 0C extends; widening it requires a 0C record, never a `0C-min` amendment |
| Read authority drifts into action authority | Preserve `actions: []` / `action_authority: none`; the lane adds no command capability at all |
| A half-built workbench reads as a broken product to My-Chat | The contract's own per-kind `unavailable` state carries this; My-Chat renders declared unavailability, not missing responses |
| 0A's stale pins silently invalidate the record | Rebound 2026-08-08; the T-002 owner path is now correctly `DEFINED_UNQUALIFIED` instead of falsely `PRESENT_PINNED` |
| I3 quietly inherits T-002's out-of-topology G1 evidence | The ledger row now denies it explicitly; I3 must re-establish the owner path at current pins |
| Slice creep into 0D/0E facts | The no-migration constraint makes creep mechanically visible |

## Honest cost/benefit

`0C-min` delivers **one read module**. It does not produce a usable admin
console, and it should not be sold as one.

What it does buy:

1. It proves the `institution_admin` authority chain end-to-end — active role,
   institution scope, disclosure predicate, owner-read, presenter, formal
   ingress — on the one lane whose provider is already qualified-ready. That
   is the highest-risk unknown in full 0C, retired at the smallest possible
   blast radius.
2. It gives My-Chat T-036 a real, versioned surface to design the workbench
   shell against, instead of a contract stub.
3. Scoping this slice forced the 0A rebind, which surfaced the stale T-002
   owner-path evidence before any branch could silently inherit it. Full 0C
   needed that rebind regardless; the finding is now banked for every option.

What it costs: one contract rotation (`1.18.0`) and its requalification round,
the freeze-record authoring, and — newly surfaced by the 0A rebind —
re-establishing the T-002 owner path at current pins, since the G1 evidence no
longer binds this topology.

The owner-path re-establishment is the largest single cost and is **not**
`0C-min`-specific: full 0C incurs the same work. That changes the shape of the
trade. `0C-min` no longer sits far below full 0C on effort, because most of
the delta is now shared owner-path work. What `0C-min` still saves is
implementation and review surface, not gate cost.

If the decision is to run full 0C directly, none of this analysis is wasted:
`0C-min`'s predicate and envelope are the first two items of full 0C either
way, and the owner-path finding applies unchanged. The real trade is whether
to requalify twice in exchange for earlier end-to-end evidence on the
narrowest possible lane.

## Decision requested

The 0A rebind is done, so all three options start from the same rebound
inputs. One of:

- **A — Accept `0C-min`.** Run the lane through I0→I4 to a branch Freeze PASS
  at `1.18.0`, re-establishing the T-002 owner path at I3.
- **B — Reject and run full 0C.** Freeze the complete Authority & Surface
  contract before any implementation. Longer to first evidence, one
  requalification instead of two, same owner-path cost.
- **C — Defer T-007 entirely.** Prioritize T-002 `C30-I0-C/D` — which would
  also be the natural place to re-establish the owner path at current pins —
  or T-009 archival first; revisit after.

Note that option C has become more attractive than it looked before the
rebind: the owner-path re-establishment that A and B both need is T-002's own
work, and T-002 is already the task that owns `C30-I0-C/D`.

No option is executed by this document.
