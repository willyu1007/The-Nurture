# G4-0C-3 Class & Child Scope — Freeze Record

## Status

- Date: 2026-08-08
- Task: T-007
- Unit: 0C-3, parallel with 0C-4 after 0C-2
  ([`10-g4-0c-scope-freeze.md`](./10-g4-0c-scope-freeze.md))
- Contract identity: `nurture.institution-child-scope@1.0.0`
- Consumes: `nurture.institution-scope@1.0.0`
  ([`12-g4-0c-2-institution-scope-freeze.md`](./12-g4-0c-2-institution-scope-freeze.md))
  unchanged
- Verdict: `G4_0C_3_FREEZE_PASS`
- Releases: G4-B, G4-C; completes the board's
  `exact_institution_and_class_scope` rule together with 0C-2
- Non-effects: no code, schema apply, migration, capability, manifest, secret,
  deployment, activation or traffic.

## 1. Owner, consumer and exact source

| Role | Party | Exact ref |
| --- | --- | --- |
| Canonical owner of CareGroup, Enrollment, ChildCareProcess, ChildLinkGrant | Nurture / T-002 | current-pin owner path per `dev-docs/active/nurture-institution-mode/21-c30-landing-requalification-record.md` |
| Canonical owner of the platform child identity | My-Chat | `51ad97f721bf74cced3ec75d24f3066c4ef6ab1c` |
| Surface authority rules | T-004 | `visibility-matrix.json` at `1.17.0` / `sha256:d22851d9…`, the artifact current when this unit froze; 0C-4 later rotated it to `1.18.0` additively with `sharedCoreHash` unchanged, so this evidence is preserved |
| Consumers | 0C-4 (child-level content), 0C-5, G4-B, G4-C | — |

This unit closes the **second half** of `institution_board`'s
`exact_institution_and_class_scope`. 0C-2 established that a target is inside
the admin's institution; 0C-3 establishes that it is inside a class the
request is entitled to, and that any child-level fact additionally carries a
purpose. Neither half is sufficient alone.

## 2. Fact, projection and candidate boundaries

**Canonical facts (Nurture-owned, persisted):**

- `NurtureCareGroup` — the class, already carrying `institutionId`.
- `NurtureEnrollment` — `childCareProcessId`, `careGroupId`, `institutionId`,
  `status`. The only edge that places a child in a class.
- `NurtureChildCareProcess` — `childId`, `primaryFamilyId`, `status`.
- `NurtureChildLinkGrant` — **not read by this unit.** The frozen purpose
  vocabulary is defined here (§3), but every test against a grant — purposes,
  directions, data classes and currency — belongs to 0C-5 (0G finding 1).

**Derived (never persisted as authority):** `ChildScopeContextV1`, the
per-request resolution of an institution scope plus a target into a class, an
optional child, and the purpose under which the child fact is read.

**Not permitted:** deriving class membership from a photo, a message, an
attendance row or an attribution. Those are consequences of enrolment, never
evidence of it. A child reachable through content but not through a current
`NurtureEnrollment` is out of scope.

## 3. Frozen shape

```text
ChildScopeContextV1
  institutionScope   InstitutionScopeContextV1   (unchanged from 0C-2)
  careGroupRef       opaque
  childProcessRef    opaque, present only for a child-level read
  purposeKey         frozen vocabulary below, required with childProcessRef
  contractVersion    "1.0.0"
```

No child name, birth date, family reference, care-context summary or payload.
`childProcessRef` is the Nurture-local care-process reference, **never** the
My-Chat `child_id`: the platform child identity is not exposed to an
Institution surface by this unit.

### Purpose vocabulary — fixed at the contract layer

`NurtureChildLinkGrant.purposes` is `String[]` in the schema, an **open**
vocabulary with no database-level constraint. Purpose limitation therefore
cannot lean on the schema, and 0C-3 fixes the closed set that Institution
surfaces honour:

```text
purposeKey = care_coordination      -- day-to-day care of this child
           | family_communication   -- reading or preparing family contact
           | enrollment_admin       -- roster, enrolment and grant lifecycle
           | safety_response        -- an active safety or incident matter
```

A stored purpose outside this set is **not** honoured: it denies rather than
being treated as a wildcard or as an unknown-but-permissive value. Adding a
member is an amendment to this record with its own fixtures, and the
open-typed column means the guard lives in the predicate, not the database.

## 4. Predicate

0C-3 owns the third level of the chain fixed in the scope freeze:

```text
active role → institution scope → class/child scope → Grant/data-class/purpose
                                   ^^^^ this unit
```

Entry requires a resolved `InstitutionScopeContextV1`. Then, each step failing
closed:

1. **Class scope** — the target class exists, its `institutionId` equals the
   scoped institution, and it is current: `status = active` **and**
   `deletedAt IS NULL`, the conjunction inherited from the lifecycle decision
   ([`17`](./17-lifecycle-status-cleanup-decision.md)) because both fields
   exist on this entity and readers have historically split on which to trust. A class in another
   institution was already denied by 0C-2 and must not be re-reachable here.
2. **Child membership** — for a child-level read, a current
   `NurtureEnrollment` places that `childCareProcessId` in that **exact
   `careGroupId`** within that institution.

   > **Do not wire the existing `scope_reaches_child` fact here.** For an
   > institution-scoped binding, `roleReachesChild` matches on `institutionId`
   > alone: any active enrolment of that child anywhere in the institution
   > satisfies it, with no class test. That fact is therefore **looser than
   > this predicate** and cannot stand in for it. 0C-3 requires the
   > `careGroupId` match that the `care_group` branch already performs, applied
   > to institution-scoped admins as well.
3. **Purpose is declared** — `purposeKey` is present and is a member of the
   frozen vocabulary. A child-level read with no declared purpose denies; it
   never defaults to `care_coordination`.

   > **Ownership, fixed by 0G finding 1.** This unit checks only that a
   > purpose was *declared and is recognized*. Whether the child's grant
   > actually **permits** that purpose belongs to 0C-5, together with
   > direction, data class and grant currency. Read as a sentence: 0C-3
   > requires you to say why, 0C-5 decides whether the grant permits that why.
   > A predicate that tests the grant here duplicates 0C-5 and will drift from
   > it.
4. **Visibility** — the fact is currently visible: `child_visible` holds and
   the source lifecycle is not redacted or suppressed.

### This narrows an existing path on two axes, deliberately

`nurture.can_view_child_care_process` today admits `institution_admin` on
`scope_reaches_child` plus `child_visible`. Against that baseline, 0C-3 is
narrower in two independent ways:

| Axis | Today | Under 0C-3 |
| --- | --- | --- |
| **Class containment** | institution-scoped bindings reach any child with an active enrolment anywhere in the institution — `roleReachesChild` tests `institutionId` only | the enrolment must place the child in the **named class** |
| **Purpose** | not tested at all for this key | a declared `purposeKey` from the frozen vocabulary is required; whether the grant permits it is 0C-5's narrowing |

Narrowing is safe and is the intent. `02-architecture.md` already states that
Admin Web authority is not authority to read all child facts, and that every
drill-down needs exact scope, Grant/fact visibility **and** purpose. This unit
turns that prose into a predicate.

The class-containment axis matters most for implementers: the looser fact
already exists and is easy to reuse by accident, which is why fixture 11 tests
it directly rather than trusting the existing helper.

Guardian and caregiver paths through the same policy key are unchanged — 0C-3
constrains Institution surfaces only, and the `care_group`-scoped branch of
`roleReachesChild` already performs the class match this unit requires.

### Aggregates are not a drill-down bypass

An aggregate that an Admin may see at institution or class level MUST NOT
become a way to read a child fact that a direct drill-down would deny. Counts,
badges and orderings are computed over the same scoped-and-purposed set. An
aggregate whose value changes with a fact the requester cannot read directly
reopens this unit.

## 5. Lifecycle and currency

- Per-request reread, inheriting 0C-1 and 0C-2. No cache, no grace window.
- **Enrolment currency decides membership.** An ended enrolment removes class
  scope immediately for new reads. Historical care facts remain owned and
  stored; they simply stop being reachable through this predicate.
- A grant revoked between two requests denies the second.
- A child enrolled in two classes within the same institution is in scope only
  through the class the request names; the other enrolment is absent from the
  response exactly as a cross-institution enrolment is under 0C-2.
- No idempotency, outbox or replay semantics: 0C-3 introduces no command.

## 6. Default-safe behavior

| Condition | Result |
| --- | --- |
| Institution scope unresolved | inherit 0C-2's deny |
| Class missing, or in another institution | deny `not_authorized` — identical to a class that never existed |
| Class not current | deny `class_not_current` |
| No current enrolment placing the child in that class | deny `scope_mismatch` |
| Child-level read with no `purposeKey` | deny `purpose_required` |
| `purposeKey` outside the frozen vocabulary | deny `purpose_not_honoured` |
| Fact redacted or suppressed | deny `child_not_visible` |
| Owner unavailable | deny `unavailable`; never cached authority |
| Contract version mismatch | deny `contract_mismatch` |

`purpose_required` and `purpose_not_honoured` are both contract faults the
caller can fix, which is why both live here. `purpose_not_granted` is an
authority fact the caller cannot fix and belongs to 0C-5. Neither code here
reveals whether the child exists.

## 7. Fixtures and downstream gates

1. admin reads a class in scope; a class in another institution denies with
   the same code as a nonexistent class;
2. child-level read succeeds with a current enrolment and a granted purpose;
3. the same read denies once the enrolment ends, while the stored facts remain;
4. child-level read with no `purposeKey` denies `purpose_required` — no
   default is applied;
5. a stored purpose outside the frozen four denies `purpose_not_honoured`
   rather than acting as a wildcard;
6. a `purposeKey` outside the frozen vocabulary denies `purpose_not_honoured`;
   whether a *recognized* purpose is actually granted is 0C-5's fixture, not
   this unit's;
7. a child in two classes of one institution is reachable only through the
   named class, and the other enrolment appears in no count or ordering;
8. an aggregate visible at class level does not change with a child fact the
   requester would be denied directly;
9. guardian and caregiver outcomes through
   `nurture.can_view_child_care_process` are unchanged by this unit;
10. `childProcessRef` never carries or resolves to a My-Chat `child_id`;
11. **an institution-scoped admin denies a child enrolled in a different class
    of the same institution** — the case the existing `scope_reaches_child`
    fact would allow, proving the predicate does not delegate to it.

Isolated synthetic fixtures under I0. Real owner paths stay behind I3, joint
conformance behind I4.

## 8. Schema delta

**None — `REUSE`.** `NurtureCareGroup.institutionId`,
`NurtureEnrollment.childCareProcessId`/`careGroupId`/`status`,
`NurtureChildCareProcess.status` and `NurtureChildLinkGrant.purposes`/`status`
already carry every fact tested here.

One property is explicitly a predicate obligation rather than a schema one:
because `purposes` is `String[]` with no database constraint, the closed
vocabulary in §3 exists only in the contract. A future unit MAY propose
narrowing the column to an enum, but 0C-3 does not, and until then a
conformance fixture — not a constraint — is what keeps an unknown purpose from
being honoured.

## Exit

`G4_0C_3_FREEZE_PASS` completes the board's `exact_institution_and_class_scope`
together with 0C-2 and releases G4-B and G4-C. It does not open
implementation, schema apply, activation, deployment or traffic, and it does
not complete 0C — 0C-4, 0C-5 and 0C-6 remain.
