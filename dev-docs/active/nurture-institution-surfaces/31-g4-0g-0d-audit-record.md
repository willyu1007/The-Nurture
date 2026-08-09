# G4-0G Cross-contract Audit — G4-0D Branch

## Verdict

- Date: 2026-08-09
- Task: T-007
- Scope: the five 0D freeze records ([`26`](./26-g4-0d-1-attendance-closeout-freeze.md)…[`30`](./30-g4-0d-4-attribution-authority-freeze.md)),
  the 0D scope freeze ([`25`](./25-g4-0d-scope-freeze.md)), and the 0C-5 §6
  amendment 0D-5 raised
- Verdict: `G4_0G_0D_AUDIT_PASS_AFTER_REPAIR`
- Four findings, all repaired in this pass; none deferred
- Effects: documentation only. No code, schema, contract artifact, capability,
  activation, deployment or traffic change.

0G checks invariants *between* records. What follows is what the audit found,
not a restatement of what each unit claims.

## What held

**The chain is consumed, never extended.** All five units resolve authority
through 0C's fixed order and none adds a level, reorders one, or defines a
local authority path. The scope freeze's rule that a unit needing an unfrozen
level reopens 0C rather than inventing one was not tested, because no unit
needed to.

**The AI posture is consistent across three units.** 0D-1 holds that an
inference never writes a canonical fact; 0D-2 leaves assisted placement
disabled and keeps its `decidedBy` slot; 0D-5 freezes
`ai_attention_candidate`'s tier per category so a provider cannot raise its
own. Three units, one position, arrived at independently — 0D-2's open point
closed *because* the other two exist.

**The schema deltas do not overlap.** Nine planned tables across four units,
no duplicate and no two units planning the same fact. 0D-4 is `REUSE` and
correctly declines to re-plan 0D-3's correction candidate.

**Derived projections consistently get no table.** Attendance evidence and
coverage (0D-1), effective schedule and latest photo (0D-2), the signal
projection itself (0D-5). Each record states why, and the reasons agree: a
persisted resolution drifts from the inputs that produced it.

**0D-4's predicate conflict was verified, not inherited.** The audit
re-evaluated `nurture.can_confirm_media_attribution` with
`role_kind: institution_admin` against current source and reproduced
`allowed`. The finding is real and correctly recorded; it is G4-C's to fix.

## Finding 1 — the reason-code vocabulary is not the implementation's

**Severity: real, and older than this branch.** 0D's records deny with
`conflict`, `contract_mismatch` and `unavailable`. Checked against
`NurturePolicyReasonCode`:

| Record vocabulary | In the union? |
| --- | --- |
| `conflict` | **no** — introduced by 0D, absent from 0C |
| `contract_mismatch` | **no** — used by all six 0C records too |
| `unavailable` | **no** — the union has `policy_unavailable` |

So three codes the records treat as frozen have no implementation counterpart,
and one differs only in name from something that does. No record declares the
mapping. This is not a 0D defect alone: `unavailable` and `contract_mismatch`
run through all six 0C records, and 0G's audit of that branch did not catch it.

The consequence is not a fail-open, it is improvisation. An implementer reading
"deny `conflict`" finds nothing in the union and must either invent a member —
plausibly under a different name in each unit — or reuse a semantically
different one, which silently discards the distinction the record drew.

**Repair.** The mapping is fixed here, as the single authority:

| Record vocabulary | Implementation | Status |
| --- | --- | --- |
| `unavailable` | `policy_unavailable` | existing; the record name is the product term and the union name is the code term for **the same outcome** |
| `contract_mismatch` | — | **planned additive union member** |
| `conflict` | — | **planned additive union member** |

Both additions are additive to a union that has taken additive members twice
already (increments 2 and 3). Neither may be introduced with a different
spelling per unit, and neither is added by this audit — 0G authorizes no code.

## Finding 2 — two units under-declared what they consume

**Severity: real but narrow.** `Consumes` is where an implementer learns which
records they must have read first.

0D-1 declared the 0C chain through class scope, but its §4 subjects Admin class
aggregates to 0C-5 §5 — a dependency the header omitted. 0D-5 declared 0C-5 §5
and 0D-1's submission state but **not the 0C chain**, although its §6 makes a
signal absent for a reader who cannot open its source, which is a chain
decision on every read.

An implementer building 0D-5 from its header would wire the aggregate rule and
the attendance checkpoint and discover the authority dependency only in §6.

**Repair.** Both headers now declare the full set.

## Finding 3 — one precondition, four spellings

**Severity: cosmetic, repaired for legibility.** The same optimistic-concurrency
precondition appeared as `expectedSubmissionHead` (0D-1),
`expectedPlacementHead` (0D-2), `expectedRevisionHead` (0D-3) and
`expectedRevision` (0D-5). The first three vary by subject, which is correct
and readable. The fourth drops the subject entirely, and 0D-5 compounded it by
citing "the same rule as 0D-1 and 0D-3" — naming two units that spell it
differently, and omitting 0D-2, which has the same rule.

**Repair.** 0D-5 uses `expectedPolicyRevision` and states that the other three
apply the same precondition under their own subject's name.

## Finding 4 — one capability defined by two units

**Severity: real.** `adjust_activity_placement` appeared in the capability
table of **both** 0D-2 §4 and 0D-3 §4. Each referred to the other: 0D-2 said it
"writes through 0D-3's append-only revision", 0D-3 said it changes "placement
within the same class (0D-2 §4)". The references form a loop and neither record
claims ownership.

This is the shape of 0C's own finding 1, where the purpose and grant checks
were assigned to two levels with neither record saying which owned them. The
outcome is the same either way: both units get built and drift, or each assumes
the other did it.

The distinction that resolves it was already latent in both texts and never
stated. **Placement is a rule; a revision is a record of changing one.**

**Repair.** 0D-2 owns the capability — actor, precedence effect, concurrency.
0D-3 owns the **form its write takes**: appended as a `ContentRevision` with
`subjectKind: "placement"` and `decidedByBefore`, never applied in place. The
capability is removed from 0D-3's table and the ownership is stated in both
records.

## The 0C-5 §6 amendment

0D-5 raised it and 0C-5 carries it, which is the correct direction — a unit
quietly widening a rule another unit narrowed would violate invariant 5 below.
The audit confirms the amendment on three counts:

1. **The narrowing matches its argument.** 0C-5 §6 gives two reasons and names
   the second decisive; that one is spatial memory across repeated visits, and
   a signal list recomputed per read has no stable membership for it to apply
   to. The amendment narrows the prohibition to the scope its own reasoning
   covers.
2. **The core is untouched.** The class list's fixed order, the no-scoring
   invariants and the cross-class comparison ban all read as before. Fixture 15
   split into 15 and 16 rather than being weakened.
3. **The fallback is a guard, not a formality.** Ties and missing deadlines
   fall to the fixed subject order and never to level or count, without which a
   deadline-ordered list becomes a level-ordered one whenever deadlines
   coincide.

Records 24 and 25 keep their pre-amendment text and carry notes pointing to it,
following the precedent 0G finding 4 set on the 0C branch.

## Cross-contract invariants confirmed after repair

1. Every 0D authority decision resolves through 0C's chain in its fixed order;
   no unit adds, reorders or bypasses a level.
2. A rule not owned by 0D denies by inheriting the owning unit's deny rather
   than being re-derived locally.
3. Each capability is owned by exactly one unit, and each fact class by exactly
   one owner.
4. Identical conditions carry identical reason codes across units, and the
   record-to-implementation mapping for those codes now has one authority.
5. No unit widens a rule another unit narrowed; the one amendment to a narrowed
   rule was made in the record that owns it.
6. Derived projections are persisted nowhere, and the planned deltas do not
   overlap.
7. The AI boundary is identical across the three units that touch it: no
   canonical fact without human confirmation, and no self-assigned tier.

## What 0G does not certify

This audit is over the freeze records. It is not implementation evidence, not
Owner Readiness, not Joint Conformance, and not a Beta Profile Handoff. Every
0D capability remains unregistered — the surface contract at `1.18.0` carries
none of them — and 0D opens no schema apply, activation, deployment or traffic.

It also does not certify 0D-4's predicate conflict as fixed. The audit
confirmed the conflict exists; the fix is G4-C's, and a G4-C increment wiring
an attribution surface without making it ships an Admin path the contract
denies.

## Exit

With four findings repaired, the 0D branch satisfies 0G's cross-contract audit.
0D Exit is therefore reachable: all five units are frozen, no open points
remain, and the cross-contract invariants hold.
