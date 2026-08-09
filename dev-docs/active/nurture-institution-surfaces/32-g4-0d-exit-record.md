# G4-0D Exit Record

## Verdict

- Date: 2026-08-09
- Task: T-007
- Stage: G4-0D Daily Operations Facts
- Verdict: **`G4_0D_EXIT_PASS`**
- Opens: G4-B, and the daily-operations half of G4-C
- Effects: documentation only. No schema apply, no migration, no capability
  enablement, no contract rotation, no deployment, no activation, no traffic.

## What is satisfied

**Five ordered units, each with an exact freeze record.**

| Unit | Record | Contract identity | Schema |
| --- | --- | --- | --- |
| 0D-1 Daily attendance closeout | [`26`](./26-g4-0d-1-attendance-closeout-freeze.md) | `nurture.daily-attendance-closeout@1.0.0` | **planned, not applied** |
| 0D-2 Class schedule & activity placement | [`27`](./27-g4-0d-2-schedule-placement-freeze.md) | `nurture.class-schedule-placement@1.0.0` | **planned, not applied** |
| 0D-3 Append-only revision & downscope | [`28`](./28-g4-0d-3-revision-downscope-freeze.md) | `nurture.content-revision-downscope@1.0.0` | **planned, not applied** |
| 0D-4 Child-attribution authority | [`30`](./30-g4-0d-4-attribution-authority-freeze.md) | `nurture.child-attribution-authority@1.0.0` | `REUSE` |
| 0D-5 Institution support signals | [`29`](./29-g4-0d-5-support-signal-freeze.md) | `nurture.institution-support-signal@1.0.0` | **planned, not applied** |

**Three open points closed, none deferred.**

| Point | Outcome |
| --- | --- |
| Concurrent submission by two current caregivers (0D-1 §5) | Mis-posed as a choice between last- and first-writer-wins. `revise` already carried a precondition and `submit` did not; giving `submit` the one it lacked settles it as first-writer-wins and removes a rule rather than adding one. Also surfaced that `reopen` must increment the head. |
| Assisted placement in the first increment (0D-2 §4) | Not enabled. A wrong placement is a presentation error rather than a disclosure, the backlog it would relieve is assumed rather than measured, and its errors are findable only by a person looking. `decidedBy` keeps its `"assisted"` slot so enabling it later is a gate, not a shape change. |
| Cross-class signal ordering against 0C-5 §6 (0D-5 §4) | 0C-5 §6's prohibition was worded more broadly than its own argument: the reason it calls decisive is spatial memory, which a per-read projection has none of. Scoped to subject lists, with a narrower rule for work-item lists, **amended in the record that owns the rule**. |

**0G cross-contract audit passed after repair** —
[`31`](./31-g4-0g-0d-audit-record.md), four findings, all repaired in that pass.

## What 0D delivers on top of 0C

0D adds fact classes and lifecycles. It adds no authority level, reorders
nothing, and defines no local authority path — every decision resolves through
0C's chain unchanged.

```text
active role → institution scope → class/child scope → Grant/data-class/purpose
   0C-1              0C-2               0C-3                    0C-5
                                          ↑
                     0D-1 attendance · 0D-2 placement · 0D-3 revision
                     0D-4 attribution · 0D-5 signals
```

Nine planned tables across four units, no overlap. Derived projections — the
attendance evidence and coverage, the effective schedule, the latest photo, the
signal projection itself — are persisted nowhere, and each record states the
same reason: a stored resolution drifts from the inputs that produced it.

## Exact identity

| Input | Identity |
| --- | --- |
| Surface contract | `nurture.surface-contract@1.18.0` / `sha256:be84bb23…`, 34 capabilities / 6 surfaces — **carrying none of 0D's capabilities** |
| 0C authority chain | records [`11`](./11-g4-0c-1-active-role-freeze.md)…[`16`](./16-g4-0c-6-roster-invite-freeze.md), audited by [`18`](./18-g4-0g-0c-audit-record.md), 0C-5 §6 amended 2026-08-09 |
| 0C chain, executed | G4-A increments 1–4, `IMPLEMENTED_NO_CALLER` |
| Nurture self-pin | `eac48ed6fb709c83fe05880c8c4e57f0a562612dc9f81634ccec3d39aaf4de00` (206 files) |
| My-Chat | `51ad97f721bf74cced3ec75d24f3066c4ef6ab1c` |

Every 0D capability is **unregistered**. Registering them is an additive
rotation belonging to the branch that implements them, not to 0D.

## What this opens

- **G4-B** — the Admin class-first mobile board, and caregiver attendance
  submit/revise.
- **The daily-operations half of G4-C** — Web activity records, revision and
  downscope, attribution surfaces.

Both still need their own implementation gates, and both inherit the
obligations below.

## What this does not open

Not Owner Readiness, not Joint Conformance, not a Beta Profile Handoff, not
Candidate Freeze. No schema apply — all four deltas stay plans. No capability
registration or enablement. No deployment, no activation, no traffic. T-008
continues to wait for the complete T-007 Exit.

## Obligations 0D hands forward

These are not caveats; they are work someone must do, recorded so it is not
rediscovered.

1. **The reason-code vocabulary needs two additive union members.**
   `contract_mismatch` and `conflict` appear across the freeze records and
   exist nowhere in `NurturePolicyReasonCode`; `unavailable` in the records is
   `policy_unavailable` in code. The mapping is fixed in
   [`31`](./31-g4-0g-0d-audit-record.md) §Finding 1 as the single authority.
2. **0C-5 §6's ordering fixtures 14 and 16 still need a surface to observe.**
   Fixture 14 waits on a class list, which is G4-B's board. Fixture 16 is
   0D-5's rule and needs the signal list.
3. **Truncating the home's signal list is G4-B's design decision**, under the
   constraint that the existence of further signals must not be concealed.
4. **0D-2's assisted placement stays off** until an observed `unplaced` rate
   justifies it.

## The honest limitation

**0D freezes against a chain proven buildable, not proven in service.** The
G4-A increments executed 0C-1 through 0C-5 and falsified every guard, which is
why the I1 argument against freezing 0D on unexercised predicates is satisfied.
But `NurtureInstitutionAuthorityChain` still has no production caller. What was
established is that the chain behaves as frozen when driven by tests and by
real stored rows — not that it holds against real requests, which is I2, I3 and
I4.

0D itself has executed nothing at all. Five freeze records, zero predicates.
The same weighing 0C's Exit recorded applies again to whoever plans the next
step: a freeze is a weaker artifact than a passing test, and the branch that
implements 0D will find things these records could not.

One correction to what 0D-4 recorded: its §4 predicate conflict was repaired on
2026-08-09 under an explicit instruction to fix all found problems, ahead of
the G4-C gate the record assigned it to. `can_confirm_media_attribution` no
longer admits `institution_admin`, `asset_scope_matches` no longer carries the
institution branch, and 0D-4 fixture 3 — written to fail — now passes. The
record's assignment is superseded by that repair rather than still outstanding.
