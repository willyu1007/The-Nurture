# G4-A Increment 2 — The 0C Context Chain

## Verdict

- Date: 2026-08-09
- Task: T-007
- Branch: G4-A Authority & Aggregate Foundation, under
  [`20`](./20-g4-a-i1-branch-freeze.md) (`G4_A_I1_BRANCH_FREEZE_PASS`)
- Scope: the context chain 0C-1 → 0C-2 → 0C-3 froze, plus 0C-1's selection rule
  and 0C-3's purpose declaration
- Non-effects: no schema, migration, capability enablement, contract rotation,
  deployment, activation or traffic. Still no production caller.

## The ordering was reversed against what I1 said, deliberately

[`20`](./20-g4-a-i1-branch-freeze.md) put "the context types as a passed chain"
in the out-of-scope list and argued that increment 1 should not rebuild the
call shape, "because the flaws worth finding are in the predicate logic, not in
the call shape."

That was right for increment 1 and is wrong for what follows it. Both remaining
0C predicates sit **on** the call shape:

- `purposeKey` is a field of `ChildScopeContextV1` (0C-3 §3), and the flat
  `NurturePolicyFactRequest` had nowhere to put it. Evaluating purpose without
  the chain would mean adding an optional field to the flat request and gating
  a predicate on it — the exact shape of increment 1's defect 2.
- 0C-1 §4's selection rule needs an assignment reference the caller may
  legitimately **omit**, and its `role_selection_required` fixture is
  unreachable while the field is mandatory.

So the chain moved ahead of purpose evaluation and the full-coverage aggregate.
The remaining increments are not interchangeable: 0C's type chain makes them
serial — chain, then purpose on the grant side (0C-5), then the aggregate that
runs the grant predicate per member.

## What was built

Three context types, exactly as frozen, in `institution-authority-chain.ts`:
`NurtureActiveRoleContextV1`, `NurtureInstitutionScopeContextV1`,
`NurtureChildScopeContextV1`. Each consumes the previous unchanged. 0C-5's
`GrantRequestContextV1` and 0C-6 are not built.

The chain splits into a pure part and a service part on purpose. The service
does 0C-1 selection over stored bindings and loads facts; the pure
`deriveInstitutionScopeChain` runs levels 0C-2 and 0C-3 over those facts. The
policy key `nurture.institution_admin_scope` now calls the same pure function
rather than carrying a second copy of the rules, so the two entry points cannot
drift.

Denials carry the level that refused, matching 0G invariant 2: a level denies
at itself rather than being skipped.

### The design choice worth recording

The chain does **not** add three per-level repository methods. Every level
derives from the one `loadPolicyFacts` result, and the only new repository
capability is that facts now carry what the stored row said. That keeps a
single authority channel by construction: there is no second query whose answer
could disagree with the first.

## Two authority-channel splits, closed

**The actor's scope.** 0C-1 §3 is explicit — a caller MUST NOT synthesize a
role, a scope type or a scope id; every one is issued by Nurture from a stored
row. The increment 1 predicate read `input.resolved_context.actor.scope_type`,
a caller-supplied value, for the 0C-2 decision. It happened to fail closed only
because `institution_scope_current` is computed from the binding and covered
it. That safety was incidental, not designed.

Facts now carry `actor_scope_type` and `actor_scope_ref`, echoed from the
binding, and the predicate reads those. A test holds the stored row constant
and varies only the caller's claim, in both directions, to prove the caller's
channel is disconnected rather than merely agreeing today.

**The child ref.** `child_target_resolved` was a boolean beside a value the
0C-3 context needs anyway. Keeping both would have been one fact on two
channels — the shape that has now failed twice here. It is replaced by
`resolved_child_process_ref` and `resolved_care_group_ref`, the refs
themselves, which the emitted `ChildScopeContextV1` carries onward. The
predicate gates on the presence of the ref it will pass on.

## Purpose: the declaration half only

0C-3 §4 step 3 and 0G finding 1. This increment checks that a purpose was
**declared and recognized**; whether the child's grant permits it stays with
0C-5 and is not asked here. A test asserts that a revoked, missing or
mismatched grant does not change this level's answer — if it did, the two
levels would have started duplicating and drifting, which is precisely what
finding 1 repaired in the records.

`purpose_key` is typed as a plain string, not the closed union, so an
unrecognized purpose reaches the predicate and denies `purpose_not_honoured`. A
union would make that state unreachable at the type level while callers on the
wire can still send it.

## Falsification

Every new guard was reverted in turn and the suites re-run:

| Reverted | Result |
| --- | --- |
| ambiguous selection picks the first eligible | 1 unit test red |
| a named-but-ineligible assignment falls back | 1 unit, 1 db red |
| missing purpose defaults to `care_coordination` | 1 unit, 1 db red |
| an out-of-vocabulary purpose passes as a wildcard | 1 unit, 1 db red |
| repository emits the caller's scope instead of the row's | 1 db red |
| predicate reads the caller's `scope_type` again | 2 unit red |

## Reason codes added

`role_selection_required` (0C-1 §6), `purpose_required` and
`purpose_not_honoured` (0C-3 §6), all additive to the existing union.

## What this still does not establish

`NurtureInstitutionAuthorityChain` has no production caller, exactly as
`NurtureInstitutionPolicyService` has none. This increment shows the chain is
**buildable as frozen** and that its levels deny where the records say they
deny. It does not show the chain running against real requests — that remains
I2, I3 and I4.

One frozen fixture stays unreachable and is not faked: 0C-1 §7's principal
step ("a My-Chat authenticated principal is present and current") sits above
this chain, which starts from a resolved participant.

## Verification

Typecheck clean; unit 716 passed across 65 files, 124 in the institution suite;
the G4-A db lane 9 passed. Census unit 64 → 65, C30-I3 owner adoption lock
re-frozen accordingly.

## Exit

Increment 2 completes the chain through 0C-3. It releases increment 3 — purpose
on the grant side plus the rest of 0C-5 — which now has a `ChildScopeContextV1`
to consume and a `GrantRequestContextV1` to add.
