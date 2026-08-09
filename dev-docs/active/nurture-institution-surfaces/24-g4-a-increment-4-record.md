# G4-A Increment 4 — Aggregate Privacy

## Verdict

- Date: 2026-08-09
- Task: T-007
- Branch: G4-A, under [`20`](./20-g4-a-i1-branch-freeze.md)
- Input: [`23`](./23-g4-a-increment-3-record.md) — the grant predicate this rule
  runs per member
- Scope: 0C-5 §5, full coverage or nothing
- Non-effects: no schema, migration, capability enablement, contract rotation,
  deployment, activation or traffic. Still no production caller, and **no
  aggregate value is introduced** — this is the path the future ones must take.

## What the rule is

An aggregate is any value compressing several members' facts into one number,
badge or marker. Three outcomes, and the third must stay distinguishable from
the second:

| Population | Returned |
| --- | --- |
| non-empty, every member readable | the value |
| non-empty, **any** member not readable | `unavailable` with a reason code |
| genuinely empty | `0` |

The population comes from **scope** — who holds a current enrolment in that
exact class — never from the protected facts. Its size is not the secret; what
is gated is a fact class about each member.

## Three places the shape carries the rule rather than a comment

**`countFor` is a callback, invoked only after every member is admitted.** That
is the structural form of 0C-5 §5's "the predicate runs before aggregation,
never after". On a refusal the member facts are never read, so no partial
figure exists to leak and no later edit can compute one first and discard it.
A test asserts the callback is never called on a refusal, which is runtime
evidence rather than a reading of the code.

**The refusal has no `value` field at all.** `0` and `unavailable` cannot be
conflated by a consumer reading a bare number, because the refusal carries no
number to read. The union has exactly two members and the available one has
exactly `status` and `value`, so there is nowhere to put a score, band, rank or
trend — 0C-5 §6 is an invariant, and the type shape holds it.

**One reason code for every refusal, with no count of who was denied.** Fixture
13's leak is differential observation: repeating a refused aggregate after a
grant changes must yield no observable delta. A test asserts the two responses
are `toEqual`, not merely both unavailable.

**Readability is `grantAdmits`, shared with the chain's fourth level.** "No
aggregate bypass" means a count never moves with a fact denied on direct read;
two implementations of "readable" would be two chances to drift apart.

## The chain runs first, and to the class level

`aggregate()` resolves 0C-1 through 0C-3 before reading any population, and
without the content axes — reaching the class is a scope decision, and the
grant level belongs per member. An Admin who cannot reach the class gets the
**scope** denial, so the aggregate never becomes a way to probe scope, and the
population query is not issued at all. A test asserts the repository method is
never called in that case.

## Falsification

| Reverted | Result |
| --- | --- |
| filtered count — drop unreadable members, count the rest | 6 unit, 1 db red |
| count first, discard on refusal | 1 unit red |
| refusal carries the denied-member count | 2 unit red |
| empty population returns `unavailable` | 1 unit, 1 db red |
| population drawn from the whole institution, not the class | 1 db red |
| population read before the scope decision | 1 unit red |

## Not in scope, and why

**0C-5 §6's ordering fixtures (14, 15).** "The class list order is identical
before and after a state change that alters counts" and "no ordering derived
from a count, magnitude, urgency, deadline, signal level or computed score"
both require a class-list endpoint to observe. None exists. The rule they
freeze — a fixed order from stable class attributes, `ageBandKey` then `name` —
belongs with whichever increment first returns a class list, and is recorded
here as owed rather than done.

**0C-5 §2's `grant_request` / `grant` data-class boundary**, unchanged from
increment 3: a surface read/write boundary, not a level of the chain, and
nothing reads grant rows from a surface yet.

## Verification

Typecheck clean; unit 144 in the institution suite; the G4-A db lane 12 passed.
Census unit 65 → 66; C30-I3 lock and the self-pin re-frozen.

## Exit

G4-A's DoD list — active role, Institution/class/child scope, RoleAssignment
and Grant, safe aggregate — is now covered by executed predicates, with two
carve-outs recorded above and the standing limit below.

**The standing limit is unchanged since increment 1.** None of this has a
production caller. Four increments have established that 0C's chain is
buildable as frozen and that its levels deny where the records say they deny.
Whether it holds against real requests, real data and real integration is I2,
I3 and I4.
