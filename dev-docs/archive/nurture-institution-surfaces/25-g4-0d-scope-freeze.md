# G4-0D Daily Operations Facts — Scope Freeze

## Status

- Date: 2026-08-09
- Task: T-007
- Stage: G4-0D Daily Operations Facts
- State: **SCOPE ACCEPTED — no freeze record issued, no implementation opened**
- Input: `G4_0C_EXIT_PASS` ([`19`](./19-g4-0c-exit-record.md)), plus the four
  G4-A increments that executed 0C's chain
  ([`21`](./21-g4-a-increment-1-audit-record.md),
  [`22`](./22-g4-a-increment-2-record.md),
  [`23`](./23-g4-a-increment-3-record.md),
  [`24`](./24-g4-a-increment-4-record.md))

This document fixes what 0D covers, in what order, and what each unit must
produce. It is the scope contract for the freeze work, not the freeze itself.
No unit here grants implementation, schema apply, activation, deployment or
traffic.

## Why 0D opens now and not on 2026-08-08

The I1 branch freeze ([`20`](./20-g4-a-i1-branch-freeze.md)) argued that
freezing 0D, 0E and 0F on predicates no runtime had exercised would repeat, at
four times the scale, the mistake the C30 landing had just demonstrated. That
argument was binding and is now satisfied, but only by having actually run the
chain rather than by elapsed time:

- 0C-1's selection, 0C-2's institution scope and 0C-3's class/child scope are
  executed and adversarially falsified.
- 0C-5's grant predicate and aggregate rule are executed and falsified.
- Three fail-open defects and two authority-channel splits were found and
  repaired **because** the predicates ran. None was visible from the records.

That last point is what 0D inherits. Its own predicates consume 0C's, so a 0D
unit that reads a fact class about a child is already constrained by a chain
whose failure modes have been measured rather than assumed.

**The standing limit still applies.** None of 0C's chain has a production
caller. 0D freezes daily-operations facts against a chain proven *buildable*,
not proven *in service*. Any 0D record claiming otherwise overstates its input.

## Inputs (current, verified 2026-08-09)

| Input | Identity | State |
| --- | --- | --- |
| Surface contract | `nurture.surface-contract@1.18.0` / `sha256:be84bb23…`, 34 capabilities / 6 surfaces | `PRESENT_PINNED` |
| 0C authority chain | records [`11`](./11-g4-0c-1-active-role-freeze.md)…[`16`](./16-g4-0c-6-roster-invite-freeze.md), audited by [`18`](./18-g4-0g-0c-audit-record.md) | `PRESENT_PINNED` |
| 0C chain, executed | `NurtureInstitutionAuthorityChain` — 0C-1 selection, 0C-2/0C-3 scope, 0C-5 §4 grant, 0C-5 §5 aggregate | `IMPLEMENTED_NO_CALLER` |
| My-Chat | `51ad97f721bf74cced3ec75d24f3066c4ef6ab1c` | `PRESENT_PINNED` |
| Nurture self-pin | `3762572257782f0ce1ec72280933522bc4faec6123eb04d5163a9b179ab06f5f` (206 files) | `PRESENT_PINNED` |
| T-006 board/publication/attribution | exact care facts, media attribution, `PublishProcess` | `DEFINED_UNQUALIFIED` |
| T-006 publication policy owner | `nurture.institution-publication-policy@1.0.0`, frozen by [`08`](./08-g4-0b-publication-policy-freeze.md) | `PRESENT_PINNED` |

`IMPLEMENTED_NO_CALLER` is a state 0A's ledger vocabulary does not carry. It is
used deliberately: "implemented" would imply service, and
`DEFINED_UNQUALIFIED` would discard the executed evidence. 0D-1 should either
adopt it into the ledger or cite this row explicitly.

## Units and order

Five scope items decompose into five ordered units. Each produces one freeze
record satisfying all eight requirements of the `01-plan.md` freeze-record
contract.

| Unit | Covers | Depends on | Releases |
| --- | --- | --- | --- |
| **0D-1 Daily attendance closeout** | the four-way type separation (evidence / inference / submission / fact) plus coverage projection; watermark; teacher-only submission; same-day revision by a current class caregiver; cross-day Admin reopen; `unsubmitted` as the default that never auto-settles | 0C-1, 0C-3 | G4-B, 0D-5 |
| **0D-2 Class schedule & activity placement** | one versioned effective schedule per class/date with its three-level resolution; the five-level placement precedence ending in `unplaced`; latest-photo selection; the rule that missing records never mean "no activity" | 0C-3 | G4-B, G4-C, 0D-3 |
| **0D-3 Append-only revision & downscope** | the teacher's original content as immutable in place; Admin placement, note, hide and downscope as appended revisions carrying previous value, actor, reason, timestamp and supersession; no face embedding stored or shown | 0D-2 | G4-C, 0D-4 |
| **0D-4 Child-attribution authority** | Admin may never confirm, add or replace canonical child attribution, and may only raise a sourced correction candidate; only the current exact CareGroup caregiver confirms, rejects or supersedes; a dual-role user must switch roles | 0C-1, 0C-3, 0D-3 | G4-C |
| **0D-5 Institution support signals** | the seven-member closed category set; `action_required` versus `attention_suggested` mapping; versioned `InstitutionSupportSignalPolicy` reusing existing business checkpoints; the no-scoring/no-ranking invariants restated at signal granularity | 0C-5, 0D-1 | G4-B, G4-C |

Critical path: `{0D-1, 0D-2}` in parallel, then `0D-3 → 0D-4`. `0D-5` follows
0D-1 and may run alongside 0D-3.

## Two cross-cutting rules fixed now

**Every 0D authority decision resolves through 0C's chain, unchanged.** 0D adds
fact classes and lifecycles; it does not add a level, reorder the chain, or
introduce a second path to a child fact. A 0D unit that needs an authority
level 0C did not freeze reopens 0C rather than defining one locally.

**A support signal is an aggregate.** 0C-5 §5 names "a support-signal level"
among its examples, so 0D-5's threshold categories — `review_backlog_threshold`
and `configured_load_threshold` — are subject to full-coverage-or-nothing and
must return `unavailable` rather than a figure computed over the readable
members. This is the first consumer of increment 4, and 0D-5 must cite it
rather than re-deriving the rule.

## The ordering fixtures 0C-5 §6 left owed

0C-5 §6 fixtures 14 and 15 — the class list order is identical before and after
a state change that alters counts, and no ordering derives from a count,
magnitude, urgency, deadline, signal level or computed score — could not be
satisfied by G4-A increment 4, because observing them needs a class list and
none exists ([`24`](./24-g4-a-increment-4-record.md)).

**Assignment:** the class list is G4-B's Admin mobile board, and 0D supplies
its contents — effective schedule, attendance submission state, signal level.
The fixtures therefore belong to the board's own freeze, not to a 0D unit. 0D-2
and 0D-5 must each state that they emit no ordering, so the board has nothing
to inherit one from.

> **Amended 2026-08-09 by 0D-5.** Writing 0D-5 established that the assignment
> above is right for the class list and wrong for a signal list.
> `02-architecture.md` orders the home's cross-class signals by explicit
> deadline, which fixture 15 named — but 0C-5 §6's decisive reason, that a
> re-sorting list destroys spatial memory, does not hold for a list whose
> membership is recomputed on every read. 0C-5 §6 is therefore amended to scope
> its prohibition to **subject** lists, with a narrower rule for **work-item**
> lists, and fixture 15 is split accordingly. 0D-2 still emits no ordering;
> 0D-5 now owns the signal ordering rule and is not silent on it. Confirming
> the amendment belongs to 0G's audit of this branch.

## Explicitly deferred

- **AI attention.** `ai_attention_candidate` is the seventh signal category and
  stays absent/default-off per 0A. 0D-5 freezes the category slot and the
  `attention_suggested` mapping, so a later unit cannot introduce the category
  at `action_required`. No inference behaviour is frozen.
- **AI attendance inference** is in scope for 0D-1 as a **type boundary** only:
  which evidence the inference may read, that the output is non-canonical, and
  that no inference can write an `AttendanceFact`. Model, prompt and evaluation
  are not 0D.
- Bulk roster/invite — deferred by 0A, unchanged.
- `InstitutionWorkflow` registry, carrier and projection — 0E. 0D-1's
  unsubmitted/conflict cases route to a responsibility WorkItem, not a
  Workflow, and 0D-1 must fix that boundary without defining the Workflow.
- Knowledge and RAG — 0F.

## Exit

0D Exit requires all five units to hold an exact freeze record with owner, pin,
version, default and negative fixtures, plus a rolling branch release through
0G. Reaching it opens G4-B and the daily-operations half of G4-C. It is not
Owner Readiness, Joint Conformance, a Beta Profile Handoff, Candidate Freeze,
activation or traffic authority, and 0D alone neither starts nor completes
T-007.

## Non-effects of this document

Accepting this scope changes no code, schema, manifest, capability, database,
secret or configuration. The only thing authorized here is authoring 0D-1.
