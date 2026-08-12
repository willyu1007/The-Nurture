# G4-A I1 Branch Freeze

## Verdict

- Date: 2026-08-08
- Task: T-007
- Branch: G4-A Authority & Aggregate Foundation
- Gate: I1 Branch Freeze
- Verdict: `G4_A_I1_BRANCH_FREEZE_PASS`
- Input: `G4_0C_EXIT_PASS` ([`19`](./19-g4-0c-exit-record.md))

Per `01-plan.md`, I1 opens this branch's exact schema, policy, repository and
service implementation plus migration authoring. It does **not** authorize
shared or persistent database apply, public contract release (that is I2), real
owner integration (I3), joint conformance (I4), activation or traffic.

## Why this branch first

0C produced six freeze records and zero executed predicates. The C30 landing
earlier the same day is the cautionary case: five defects survived acceptance
and surfaced only when gates ran.

G4-A is the smallest blast radius that exercises 0C's chain — it delivers no
user-visible surface, so a design flaw found here costs code and a freeze-record
amendment rather than a withdrawn product commitment. Freezing 0D, 0E and 0F on
predicates no runtime has exercised would repeat, at four times the scale, the
mistake C30 just demonstrated.

## Increment 1 scope — the authority predicate

Deliberately narrow. The existing `NurtureInstitutionPolicyService` evaluates
one policy key against a resolved context; 0C froze a chain of context types
passed level to level. Increment 1 does **not** rebuild that API. It adds one
policy key with the frozen semantics, because the flaws worth finding are in
the predicate logic, not in the call shape.

In scope:

1. `nurture.institution_admin_scope` — the 0C-1 and 0C-2 levels: an active
   participant, an `institution_admin` role assignment at `scopeType`
   `institution`, a current institution, and a target resolving into exactly
   that institution.
2. **Class containment** as 0C-3 froze it, which is the specific thing worth
   executing: `roleReachesChild` matches `institutionId` alone for
   institution-scoped bindings, so it is looser than the predicate and must not
   be reused. A test proves the case that fact would wrongly admit.
3. **The currency conjunction** from 0G finding 3 — `status = active` **and**
   `deletedAt IS NULL` — at every site that tests institution, care-group or
   child-care-process currency.
4. Reason codes exactly as frozen, added additively to the existing union.

Out of scope for increment 1, and each needs its own increment: the context
types as a passed chain, purpose evaluation (0C-3 declaration and 0C-5 grant
sides), the full-coverage aggregate rule, support-signal foundations (which
need 0D facts first), and roster invite (0C-6's planned schema delta).

## Non-effects

No migration is authored or applied by increment 1 — every fact it reads is
already stored. No capability is enabled, no contract is rotated, and
`t007_institution_workbench` remains unsatisfied.

## Exit

Increment 1 completes when the predicate, its facts and its fixtures pass, and
when the fixtures include the class-containment case the looser existing fact
would admit. That result feeds back into 0C: a predicate that cannot be
implemented as frozen amends its freeze record rather than being quietly
widened.
