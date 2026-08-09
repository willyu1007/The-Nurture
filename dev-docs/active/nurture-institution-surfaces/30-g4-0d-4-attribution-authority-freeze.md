# G4-0D-4 Child-attribution Authority — Freeze Record

## Status

- Date: 2026-08-09
- Task: T-007
- Unit: 0D-4, after 0D-3 ([`25-g4-0d-scope-freeze.md`](./25-g4-0d-scope-freeze.md))
- Contract identity: `nurture.child-attribution-authority@1.0.0`
- Consumes: `AttributionCorrectionCandidate` (0D-3), the 0C chain unchanged
- Verdict: `G4_0D_4_FREEZE_PASS`
- Releases: G4-C
- Open points: **none**
- Schema delta: **`REUSE`** — see §8
- **Conflict found with existing code**: §4, `nurture.can_confirm_media_attribution`
  admits `institution_admin`, which this unit freezes as denied
- Non-effects: no code, schema apply, migration, capability, manifest, secret,
  deployment, activation or traffic.

## 1. Owner, consumer and exact source

| Role | Party | Exact ref |
| --- | --- | --- |
| Canonical owner of attribution | T-006 | `NurtureChildMediaAttribution`, capabilities `confirm_child_media_attribution`, `reject_child_media_attribution`, `supersede_child_media_attribution` at `nurture.surface-contract@1.18.0` / `sha256:be84bb23…` |
| Correction candidate | 0D-3 | [`28`](./28-g4-0d-3-revision-downscope-freeze.md) |
| Authority | 0C chain | [`11`](./11-g4-0c-1-active-role-freeze.md), [`13`](./13-g4-0c-3-class-child-scope-freeze.md) |
| Consumer | G4-C | — |
| Product source | `02-architecture.md` "Complete activity records in Web" | — |

**This unit owns no new fact.** Attribution is T-006's, already implemented and
already append-only. 0D-4 freezes the Institution-side **boundary**: what an
Admin may not do to a fact another role owns. That is why it is the only 0D
unit whose schema delta is `REUSE`.

## 2. Type boundaries

| Type | Class | Owner |
| --- | --- | --- |
| `NurtureChildMediaAttribution` in state `confirmed` | canonical | T-006, written only by a current class caregiver |
| the same in state `candidate` | **non-canonical** | produced by automatic matching or by a caregiver's pending action |
| `AttributionCorrectionCandidate` (0D-3) | **non-canonical** | raised by an Admin; resolves nothing by itself |

The distinction that carries the unit: **an Admin's correction candidate and an
attribution candidate are different objects.** The Admin's is a *report that
something looks wrong*; it never becomes the attribution by being accepted,
because accepting is not a thing an Admin can do. A caregiver reading it acts
through T-006's own capability, and their action — not the Admin's report — is
what changes the fact.

Automatic matching retains only its permitted confirmation/provenance result.
**No face embedding is stored or presented, in any field, under any name**, per
0D-3 §3 — restated here because attribution is where the temptation lives.

## 3. Frozen shape

No new shape. The frozen surface is the existing model's authority-bearing
fields:

```text
NurtureChildMediaAttribution
  state                        candidate | confirmed | rejected | superseded
  source                       face_reference | manual | history_match | system
  confirmedByRoleAssignmentId  the caregiver assignment that confirmed
  attributionRevision          append-only; a correction supersedes
  supersededByAttributionId    links forward, never overwrites
```

`confirmedByRoleAssignmentId` is the field this unit is really about: it names
**which role assignment** took responsibility. An attribution confirmed by an
assignment that is not a current class caregiver is a contradiction the schema
cannot express but the predicate must refuse.

## 4. Predicate

### The rule

**Only the current exact CareGroup caregiver may confirm, reject or supersede a
child attribution.** An `institution_admin` may:

- read attributions within their 0C-3 class scope;
- raise an `AttributionCorrectionCandidate` with a source;
- and nothing else.

An Admin may **not** confirm a candidate, add an attribution, replace a
confirmed one, or make content publishable by way of an attribution. A user
holding both roles switches to the caregiver role and passes the same current
class-assignment test — 0C-1's no-merged-super-authority rule, which is why the
switch is a role selection and not a permission union.

The T-006 capabilities already encode this. All three declare
`supportedRoles: ["caregiver", "lead_caregiver"]`, and all three bind
`care_group_scope` with `mode: "must_satisfy"` against
`current_care_group_role@1.0.0`. 0D-4 adds no capability; it freezes that this
list stays closed.

### The conflict this unit found

`nurture.can_confirm_media_attribution`, in
`packages/nurture-scenario/src/domain/institution/institution-policy.ts`,
admits `institution_admin`:

```text
role_kind must be caregiver | lead_caregiver | institution_admin
```

and its `asset_scope_matches` fact carries a matching
`binding.scope_type === "institution"` branch in the Prisma repository. The
admission is deliberate rather than a typo — two files agree on it.

**Reproduced at runtime, not inferred from reading.** Evaluating the policy key
with `role_kind: institution_admin` and otherwise satisfied facts returns
`reason_code: "allowed"`, `allowed: true`. The check was run against current
source and its scaffold discarded; a permanent regression for it is fixture 3
below, which belongs to G4-C's change rather than to this freeze.

So the surface contract denies an Admin what the policy predicate would allow.
**Nothing is exploitable today**: the capability's `supportedRoles` filter
stands in front, and the G4-A increment 1 audit established that
`NurtureInstitutionPolicyService` has no production caller at all. But the
safety is positional rather than designed — the same shape increment 2 repaired
for the actor's scope channel, where a caller-supplied value happened to be
covered by a fact computed elsewhere.

**Frozen resolution.** The rule above is the product decision, and the
predicate is wrong against it. `can_confirm_media_attribution` must drop
`institution_admin` from its role test, and `asset_scope_matches` must drop its
institution branch for this policy key, **before any surface reaches that
predicate**. That is implementation work under G4-C's gate, not 0D — but a
G4-C increment that wires an attribution surface without making this change
ships an Admin path the contract denies.

Recorded here rather than fixed here because 0D authorizes no code. Recorded at
all because a freeze record that stated the rule and stayed silent about the
code contradicting it would be exactly the documentation drift the increment 1
audit found four instances of.

### Why Admin confirmation is refused, not merely restricted

Attribution decides **which family sees a photo**. A wrong confirmation routes
a child's image to another child's family — a disclosure, not a presentation
error, and the reason 0D-2 §4 could reason differently about placement.

The person who can tell is the one who was in the room. An Admin reviewing a
photo in the Web workbench is not, and no amount of scope or purpose makes them
so. This is a limit of knowledge rather than of trust, which is why the answer
is a different actor rather than a stronger permission.

**This unit emits no ordering.**

## 5. Lifecycle, versioning and concurrency

Unchanged from T-006, and restated so an implementer does not re-derive it:

**Append-only.** A confirmed attribution is never overwritten. A correction is
a new revision that supersedes the prior one and links to it, so confirmed
history stays readable.

**Concurrency** is T-006's `exact_state` policy: `child_media_attribution` and
`media_asset_revision` must equal the caller's heads, and `care_group_scope`
must satisfy `current_care_group_role`. A caregiver whose assignment ended
between reading and acting fails the third binding, not the first two — the
scope check is a live predicate rather than a snapshot.

**A correction candidate has no head and no lifecycle of its own.** An Admin
raises one; a caregiver either acts on it or does not. No candidate expires
into a confirmation, and no elapsed time converts one.

## 6. Default-safe behavior

| Condition | Result |
| --- | --- |
| Admin attempts confirm, reject or supersede | deny `not_authorized` |
| Admin attempts to add or replace an attribution | deny `not_authorized` |
| Dual-role user acting under the admin role | deny `not_authorized`; the caregiver role is a separate selection |
| Caregiver whose class assignment is not current | deny `not_authorized` |
| Caregiver of a different class | deny `not_authorized` — indistinguishable from the above |
| Correction candidate with no source | deny `contract_mismatch` |
| Class scope unresolved | inherit 0C-3's deny |
| Owner unavailable | deny `unavailable`; never a cached confirmation |
| Contract version mismatch | deny `contract_mismatch` |

The two caregiver denials sharing one code is deliberate: distinguishing them
would tell a caller whether a given child is in a class they cannot see.

## 7. Fixtures and gates

1. an Admin is denied confirm, reject and supersede, with one code;
2. an Admin cannot add or replace an attribution by any route, including
   through 0D-3's revision chain;
3. **a policy evaluation with `role_kind: institution_admin` against
   `can_confirm_media_attribution` denies** — the regression for §4's conflict,
   and the fixture that fails today;
4. a dual-role user is denied under the admin role and admitted under the
   caregiver role with the same request;
5. a caregiver whose assignment ended between read and action is denied by the
   scope binding, not by a stale head;
6. a caregiver of another class is denied with the same code as a caregiver of
   no class;
7. an Admin correction candidate changes no canonical attribution and no
   publishability;
8. a correction candidate never expires into a confirmation, at any elapsed
   time;
9. a correction candidate with no source denies;
10. a confirmed attribution is superseded, never overwritten, and the prior
    revision stays readable;
11. no response or stored field carries a face embedding;
12. an attribution never becomes publishable through an Admin action.

Synthetic fixtures under I0. Real owner paths stay behind I3, joint conformance
behind I4. Fixture 3 is expected to fail against current code until G4-C makes
the §4 change; that failure is the point of writing it now.

## 8. Schema delta

**`REUSE`.** `NurtureChildMediaAttribution` already carries `state`, `source`,
`confirmedByRoleAssignmentId`, `attributionRevision` and
`supersededByAttributionId`, and is already append-only by construction. The
correction candidate is planned by 0D-3 and is not re-planned here.

This unit therefore adds no table and no column. Its content is a predicate
narrowing and a set of negative fixtures — which is what a boundary unit
should be.

## Exit

`G4_0D_4_FREEZE_PASS` releases G4-C's attribution surfaces. This record opens
no implementation, schema apply, capability rotation, activation, deployment or
traffic.

With 0D-1 through 0D-5 frozen and no open points outstanding, 0D Exit needs
only 0G's cross-contract audit of this branch — which must also confirm the
0C-5 §6 amendment 0D-5 raised, and should treat §4's predicate conflict as a
finding it verifies rather than one it inherits.
