# G4-A Increment 1 — Quality Audit and Repair

## Verdict

- Date: 2026-08-08
- Task: T-007
- Subject: G4-A increment 1 (`nurture.institution_admin_scope`), commit `8367897`
- Method: a 29-agent audit over four independent lenses — correctness against
  the freeze records, dual-track semantics, leftovers and dead code, and
  documentation drift — with every finding adversarially verified against the
  repository before acceptance
- Result: **6 confirmed of 25 verified claims; 19 refuted.** All six repaired
  in this pass.

## Why this matters more than the pass rate

Increment 1 shipped with 31 passing tests and a green suite. Three of the six
confirmed findings are **fail-open authority defects** that those tests could
not see, because every test hand-supplied the facts through the in-memory
repository and never exercised the Prisma computation that produces them.

That is the same shape as the C30 landing earlier the same day: work that was
accepted, tested and green, carrying defects that only a different kind of
scrutiny surfaced.

## Confirmed findings and repairs

### 1. `target_in_institution_scope` failed open (high)

`institution-context.repository.ts` computed the fact with a `: true` fallback
that fired whenever no institution edge resolved. For an institution-scoped
admin, `work_scope` carries no `care_group_id`, and the target switch derives
one only for three family-care object types — so a **class target in another
institution** reached that fallback and returned `allowed`.

That is the exact inverse of 0C-2 §6 (`Target resolves to another institution
| deny not_authorized`) and of its fixture 2. The audit reproduced it at
runtime against a stub client.

The intermediate `enrollment` arm was also dead: `NurtureEnrollment.careGroupId`
is non-nullable and `careGroupId` is assigned from the enrollment above, so a
non-null enrollment always took the first branch.

**Repair.** The boolean became a four-state fact —
`absent | in_scope | out_of_scope | class_not_current` — computed so that a
supplied target which resolves to nothing is `out_of_scope`, not `absent`. The
predicate switches on every state explicitly, so a state added later cannot
fall through to allow.

### 2. The 0C-3 class gate read a different channel than its signal (high)

`institution-policy.ts` gated the class-containment check on
`input.resolved_context.target?.child_care_process_id` — a caller-supplied
optional field — while `child_in_named_class` was computed from a
`childCareProcessId` the repository **resolves** from stored rows at four
sites.

Guard and signal on different channels: a request that omitted the optional
field returned `allowed` even when the repository had already computed
`child_in_named_class: false`. Reproduced with the repository verdict held
constant — same facts, field present denies, field omitted allows.

**Repair.** A new fact `child_target_resolved` is computed from the resolved
channel, and the guard reads it. The record now states the rule plainly: the
guard must read the same channel the fact is computed from.

### 3. `class_not_current` was frozen but never implemented (medium)

0C-3 §6 reserves `class_not_current` for a class inside the admin's own
institution that is not current, distinct from the `not_authorized` a missing
or other-institution class returns. The code never added it to
`NurturePolicyReasonCode`, so both collapsed to `not_authorized` and the
distinction the freeze drew did not exist.

**Repair.** Added to the union, emitted by the new `class_not_current` state.

### 4-6. Documentation contradicting the repository (medium)

Three records still pinned `nurture.surface-contract@1.17.0` with 33
capabilities as `PRESENT_PINNED` after 0C-4 rotated to `1.18.0` — the live 0A-1
ledger row, the 0A "Current Exact Inputs" table (whose My-Chat, Base and
self-pin rows were also stale), and the 0C scope freeze input table.

And `00-overview.md`, the bundle's entry point that `dev-docs/AGENTS.md` sends
a resuming agent to first, still said "**Nothing in 0C has been executed**" —
falsified by commit `8367897`.

**Repair.** All four rotated or corrected, with the pre-rotation values kept
where they are load-bearing history rather than current claims.

## What was refuted, and why that matters

Nineteen claims did not survive verification. The recurring pattern is worth
recording: a reviewer would quote real code accurately and then draw a
consequence that a guard elsewhere already prevented, or that no caller could
reach, or that the freeze records had explicitly chosen. Several targeted
`can_view_child_care_process` and `care_group_matches` as dual-track risks;
verification established both are pre-existing code untouched by this
increment, and that no production caller reaches them at all.

That last point is the audit's most useful non-defect finding.

## The standing fact this audit established

**`NurtureInstitutionPolicyService` has no production caller.** A repo-wide
search for non-test references to the service or any of its policy keys returns
nothing outside its own files.

So increment 1 validated that 0C's chain is **buildable as frozen**, and locked
its most dangerous divergence with a test. It did not validate the chain
against real requests, real data or real integration — those wait for I2, I3
and I4. Any statement that 0C is "validated by execution" should be read with
that limit attached.

## Verification after repair

Typecheck clean; unit suite 694 passed with 34 in the policy file, including
two new regressions that reproduce the fail-open cases; routing census, surface
conformance, g2-exit, g3-0-freeze and both C30 locks green; self-pin re-frozen.

## Non-effects

No schema, migration, capability enablement, contract rotation, deployment,
activation or traffic. The repaired predicate remains reachable only from
tests.
