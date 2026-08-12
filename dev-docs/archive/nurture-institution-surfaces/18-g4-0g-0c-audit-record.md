# G4-0G Cross-contract Audit — G4-0C Branch

## Verdict

- Date: 2026-08-08
- Task: T-007
- Scope: the six 0C freeze records (`11`…`16`) plus the lifecycle decision
  (`17`)
- Verdict: `G4_0G_0C_AUDIT_PASS_AFTER_REPAIR`
- Four findings, all repaired in this pass; none deferred
- Effects: documentation only. No code, schema, contract artifact, capability,
  activation, deployment or traffic change.

0G checks invariants *between* records, which no single freeze record can
check about itself. What follows is what the audit actually found, not a
restatement of what each unit claims.

## What held

**Authority-rule coverage is complete and unambiguous.** Each of the nine rules
the two Institution surfaces assert is closed by exactly one unit, with the one
documented exception that `exact_institution_and_class_scope` is a conjunction
of 0C-2 and 0C-3. 0C-2 mentions all nine only because it carries the routing
table. No rule is unassigned, and none is silently claimed twice.

**The chain is continuous.** Each unit consumes the previous context type
unchanged and adds exactly one level, and the `Consumes` / `Releases` edges
form the DAG the scope freeze fixed: `0C-1 → 0C-2 → {0C-3, 0C-4}`, then
`0C-5 → 0C-6`.

**Schema-delta claims are consistent.** 0C-1 through 0C-5 declare `REUSE` and
each was verified against the schema; 0C-6 carries the only delta, authored as
a plan and not applied.

## Finding 1 — the purpose and grant checks were assigned to two levels

**Severity: real.** Both 0C-3 and 0C-5 evaluated the declared purpose against
the child's grant, and both evaluated grant currency. Neither record said which
owned it.

An implementer reading 0C-3 builds a grant-and-purpose check at level 3;
reading 0C-5 they build another at level 4. Either both are built — duplicated
logic that will drift — or each assumes the other does it, which is a real
authority gap rather than defence in depth.

**Repair.** Ownership split on a principled line:

| Level | Owns | Codes |
| --- | --- | --- |
| 0C-3 | the request **declares** a purpose, and it is a member of the frozen vocabulary | `purpose_required`, `purpose_not_honoured` |
| 0C-5 | the declared purpose is **granted** for that child, with direction, data class and grant currency | `purpose_not_granted`, `data_class_mismatch`, `grant_missing`, `grant_revoked` |

Read as a sentence: 0C-3 requires you to say why, 0C-5 decides whether the
grant permits that why. `grant_missing`, `grant_revoked` and
`purpose_not_granted` are removed from 0C-3 entirely.

Two fixtures were also on the wrong side and were exchanged: 0C-3's "purpose in
the vocabulary but absent from the grant" belongs to 0C-5, and 0C-5's "purpose
granted but outside the vocabulary" belongs to 0C-3.

## Finding 2 — 0C-2 kept reason codes for states its own decision removes

**Severity: real but narrow.** 0C-2's default-safe table emitted
`institution_paused` and `institution_archived`, justified as letting an
operator tell the states apart. The lifecycle decision (`17`) then established
that both states are unreachable and are to be removed from the enum.

Codes for states nothing can produce are dead surface that invites an
implementer to build handling for them, and they contradict the decision the
same record now cites.

**Repair.** Both codes are removed. A non-current institution denies
`not_authorized`, identical to one that never existed, which is what the
currency rule already implies.

## Finding 3 — the Stage 1 currency rule lived in only one record

**Severity: real.** The lifecycle decision's Stage 1 — a row counts as current
only when `status = active` **and** `deletedAt IS NULL` — was stated in 0C-2
and nowhere else. But 0C-3 tests care-group and enrolment currency, and 0C-5
tests grant currency, both without the conjunction.

The whole point of Stage 1 is that call sites had already split on which field
they trust. Fixing that in one record and not the others reproduces the defect
inside the freeze.

**Repair.** The conjunction is stated where each unit tests currency, and named
as inherited from the lifecycle decision rather than restated as a local
choice. Note the deliberate limit: it applies to the three entities that carry
both fields — institution, care group, child care process. `ChildLinkGrant` has
`status` with no `deletedAt`, so its currency stays `status = active` within
the effective window, and 0C-5 says so explicitly rather than leaving a reader
to wonder whether the conjunction was forgotten.

## Finding 4 — contract-version citations were inconsistent across the rotation

**Severity: cosmetic, repaired for legibility.** 0C-1 and 0C-2 cite `1.17.0`;
0C-4 and 0C-5 cite `1.18.0`; 0C-3 and 0C-6 cite no version at all.

Each is defensible on its own — a freeze record should cite the artifact
current when it froze — but a reader comparing them cannot tell whether 0C-3's
silence means "not applicable" or "forgotten", nor whether 0C-1's `1.17.0` is
history or an error.

**Repair.** Records frozen before the rotation keep their citation and gain a
note that 0C-4 later rotated the contract additively with `sharedCoreHash`
unchanged, so their evidence is preserved. Records with no contract dependency
say so explicitly.

## Cross-contract invariants confirmed after repair

1. Every authority decision resolves through the four-level chain in fixed
   order, and each level is owned by exactly one unit.
2. A level not yet frozen denies at that level rather than being skipped —
   consistent across all six records.
3. Identical conditions carry identical reason codes across units; distinct
   conditions carry distinct codes; no code reveals whether a subject exists.
4. Currency is the conjunction wherever both fields exist, and `status`-only
   where only `status` exists, stated at each site.
5. No unit widens a rule another unit narrowed.
6. The only schema delta is 0C-6's, and it is planned rather than applied.

## What 0G does not certify

This audit is over the freeze records. It is not implementation evidence, not
Owner Readiness, not Joint Conformance, and not a Beta Profile Handoff. Every
0C capability remains registered-and-unimplemented or unregistered, and 0C
opens no schema apply, activation, deployment or traffic.

## Exit

With four findings repaired, the 0C branch satisfies 0G's cross-contract audit.
0C Exit is therefore reachable: all six units are frozen, all three open points
are closed, and the cross-contract invariants hold.
