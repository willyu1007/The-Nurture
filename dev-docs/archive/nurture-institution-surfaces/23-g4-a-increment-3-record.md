# G4-A Increment 3 — The 0C-5 Grant Level

## Verdict

- Date: 2026-08-09
- Task: T-007
- Branch: G4-A, under [`20`](./20-g4-a-i1-branch-freeze.md)
- Input: [`22`](./22-g4-a-increment-2-record.md) (`ChildScopeContextV1` to consume)
- Scope: 0C-5 §4 — `original_grant_data_class_direction_purpose` as the chain's
  fourth level
- Non-effects: no schema, migration, capability enablement, contract rotation,
  deployment, activation or traffic. Still no production caller.

## Not in scope, and why

0C-5 carries three things. This increment takes only the first.

- **§4 grant evaluation** — built here.
- **§2 the `grant_request` / `grant` data-class boundary** — the status column
  is the contract boundary, and `GrantRequestContextV1` is its context type.
  It is a read/write boundary on a surface, not a level of the authority
  chain, and nothing reads grant rows from a surface yet.
- **§5 aggregate privacy** — increment 4. It runs this level's predicate per
  member, so it needed this one first.

## What was built

`deriveGrantScope` and the exported `grantAdmits`, plus a fourth level in the
chain reached when the caller names a direction or a data class. A request with
neither stops at 0C-3: that is a scope question, and answering it with a grant
verdict would deny reads 0C-3 already settled.

Currency here is deliberately **not** the lifecycle conjunction. 0G finding 3
is explicit: the conjunction applies to the three entities carrying both
`status` and `deletedAt`, and `NurtureChildLinkGrant` has only `status`, so its
currency is `status = active`, not revoked, inside the effective window. The
repository applies that when building the terms.

Per 0C-5 §7, `expired`, `replaced` and `deleted` all report as `missing`. Only
revocation keeps its own code, so a caller learns no lifecycle detail.

## The fact shape had to change, and that is the finding

`grant_directions` and `grant_data_classes` were emitted from **one** grant,
picked as `matchingGrant ?? currentGrants[0]`.

With two axes that was safe: the match already required both together, and the
`[0]` fallback could only deny. Purpose makes it three axes, and 0C-5 §4
requires them "evaluated together" — fixture 5 states that matching two of
three denies. One picked grant cannot express that: which axis gets named in
the reason code would depend on which grant the `[0]` landed on.

So the repository now emits `grant_terms`, one entry per current grant, and the
predicate asks the existence question — **does some single grant carry all the
asked terms**. Two grants that between them cover direction and data class
admit nothing.

This is the `list[0]` shape the T-006 reviews catalogued: a resolver returning
one thing while the underlying list may legitimately hold several. It was
latent rather than exploitable at two axes, and would have become a real
widening at three.

### It also reached the two existing predicates

`can_receive_family_context` and `can_share_to_family` tested
`grant_directions.includes(...)` and `grant_data_classes.includes(...)`
separately. 0C-5 §4 says these predicates "already evaluate direction and data
class this way", and against a single grant they did. Against several they
would have admitted a read whose direction came from one grant and whose data
class came from another. Both now call `grantAdmits`.

## Purpose, and where the vocabulary check really lives

0C-5 §4 step 3 requires the purpose to be a member of the grant's `purposes`
**and** of 0C-3's frozen vocabulary. Through the chain the second half is
unreachable — 0C-3 already denied an unrecognized ask with
`purpose_not_honoured`, which is exactly the split 0G finding 1 drew.

The guard is kept anyway, because `grantAdmits` is exported and its contract
carries both halves for any caller not arriving through 0C-3, and it is
asserted directly on the helper rather than through a chain path that cannot
reach it. **Falsification is what established this**: reverting the filter left
every chain test green, and only a direct test of the helper turns red.

`purpose_not_granted` is emitted only when the other two axes do match some
grant. Otherwise the code would itself reveal that direction and data class
were fine — the elimination probe that 0C-5 §7's shared direction/data-class
code exists to prevent.

## Falsification

| Reverted | Result |
| --- | --- |
| axes satisfied across different grants | 1 unit red |
| stored purposes not filtered to the vocabulary | 1 unit red *(after adding the direct helper test)* |
| revoked folded into missing | 1 unit red |
| `purpose_not_granted` named without checking the other axes | 3 unit red |
| existing predicates back to per-axis `includes` | 1 unit red *(after adding the two-grant case)* |
| grant currency using the lifecycle conjunction | 1 db red |
| grant terms flattened into one merged entry | 1 db red |

Two of the seven initially left everything green. Both gaps were real and are
noted above; the table records the state after closing them.

## A freeze inconsistency to carry back

0C-5 §8 fixture 6 — "a purpose granted but outside 0C-3's vocabulary denies
`purpose_not_honoured`" — is listed under 0C-5, but 0G finding 1 moved that
exact fixture to 0C-3 when it split the two levels. The implementation follows
finding 1, so the fixture is satisfied at 0C-3. **Recommendation:** 0C-5 §8
should cite it as inherited rather than owned, matching the ownership table
finding 1 established.

## Verification

Typecheck clean; unit 134 in the institution suite; the G4-A db lane 11 passed.
No census change — no test file was added.

## Exit

The chain now runs 0C-1 through 0C-5 §4. Increment 4 is the full-coverage
aggregate (0C-5 §5), which evaluates this level per member of a counted
population and returns `unavailable` rather than a filtered count.
