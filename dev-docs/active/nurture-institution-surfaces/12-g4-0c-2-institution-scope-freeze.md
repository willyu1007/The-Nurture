# G4-0C-2 Institution Scope — Freeze Record

## Status

- Date: 2026-08-08
- Task: T-007
- Unit: 0C-2, second on the 0C critical path
  ([`10-g4-0c-scope-freeze.md`](./10-g4-0c-scope-freeze.md))
- Contract identity: `nurture.institution-scope@1.0.0`
- Consumes: `nurture.institution-active-role@1.0.0`
  ([`11-g4-0c-1-active-role-freeze.md`](./11-g4-0c-1-active-role-freeze.md))
  unchanged
- Verdict: `G4_0C_2_FREEZE_PASS`
- Releases: 0C-3, 0C-4, and the G4-A authority foundation
- Open point: **closed** 2026-08-08 by
  [`17-lifecycle-status-cleanup-decision.md`](./17-lifecycle-status-cleanup-decision.md)
- Non-effects: no code, schema apply, migration, capability, manifest, secret,
  deployment, activation or traffic.

## 1. Owner, consumer and exact source

| Role | Party | Exact ref |
| --- | --- | --- |
| Canonical owner of Institution, CareGroup, Enrollment | Nurture / T-002 | current-pin owner path per `dev-docs/active/nurture-institution-mode/21-c30-landing-requalification-record.md` |
| Surface authority rules being implemented | T-004 | `visibility-matrix.json` at `nurture.surface-contract@1.17.0` / `sha256:d22851d9…` |
| Consumers | 0C-3, 0C-4, 0C-5, G4-A/B/C | — |

The two Institution surfaces assert **different** scope rules, and the
difference decides what this unit can close:

| Surface | Scope rule | Closed by |
| --- | --- | --- |
| `institution_workbench` | `exact_institution_scope` | **0C-2 alone** |
| `institution_board` | `exact_institution_and_class_scope` | **0C-2 + 0C-3 together** |

So 0C-2 fully satisfies the workbench's scope rule and only half of the
board's. The board's rule is not satisfied until 0C-3 freezes class scope, and
a branch that cites 0C-2 alone as the board's scope authority is citing an
incomplete predicate.

`current_institution_admin` is common to both and is closed here.

Every other rule on those surfaces belongs to a later unit:
`original_grant_data_class_direction_purpose` and `grant_request_is_not_grant`
to 0C-5; `business_channel_disclosed_before_send`, `current_source_lifecycle`
and `admin_read_never_grants_care_group_action` to 0C-4, which owns the
surface envelope and the owner-read promotion those three constrain;
`institution_workflow_actions_are_explicit` to 0E.

## 2. Fact, projection and candidate boundaries

**Canonical facts (Nurture-owned, persisted), each already carrying the edge
this unit needs:**

- `NurtureCareInstitution` — `id`, `workspaceId`, `status`.
- `NurtureCareGroup.institutionId` — the class-to-institution edge.
- `NurtureEnrollment.institutionId` / `careGroupId` / `childCareProcessId` —
  the child-to-institution edge.
- `NurtureCareRoleAssignment` with `scopeType = "institution"` and
  `scopeId = <institution id>` — the grant of admin authority at that scope.

**Derived (never persisted as authority):** `InstitutionScopeContextV1`, the
per-request resolution of an active role into exactly one institution.

**Not permitted:** inferring institution scope from a child, a class, a
message or a workspace. Scope comes from the role assignment row; every other
edge is used only to test whether a target falls inside it.

## 3. Frozen shape

```text
InstitutionScopeContextV1
  activeRole          ActiveRoleContextV1   (unchanged from 0C-1)
  institutionRef      opaque
  institutionState    "active"
  contractVersion     "1.0.0"
```

`institutionState` is a single-member union by construction: a non-current
institution never yields a context (§5). It is present so a later widening is
a visible union change rather than a silent behavioural one.

No institution display name, legal name, profile, policy config or philosophy
payload. A caller MUST NOT synthesize `institutionRef`; it is echoed from the
role assignment row.

## 4. Predicate

0C-2 owns the second level of the chain fixed in the scope freeze:

```text
active role → institution scope → class/child scope → Grant/data-class/purpose
               ^^^^ this unit
```

Entry requires a resolved `ActiveRoleContextV1`. Then, each step failing
closed:

1. **`current_institution_admin`** — `roleKind === "institution_admin"` and
   `scopeType === "institution"`. Any other role kind denies; an
   `institution_admin` assignment at a non-institution scope type denies
   rather than being reinterpreted.
2. **Institution currency** — the institution row exists in this workspace and
   is `active` (§5).
3. **`exact_institution_scope`** — the target resolves to exactly the
   institution in `scopeRef`. Targets resolve through stored edges only:
   a class through `NurtureCareGroup.institutionId`, a child or enrollment
   through `NurtureEnrollment.institutionId`. A target that resolves to a
   different institution, or to none, denies.

For `institution_board` this is only the first half of its
`exact_institution_and_class_scope` rule. 0C-2 establishes that the target is
inside the admin's institution; 0C-3 must then establish that it is inside a
class the request is entitled to. The board's rule is satisfied by the
conjunction, never by this unit alone.

Two invariants frozen here:

- **No cross-institution presence.** `cross_institution_presence` is a
  Nurture-owned data class that the visibility matrix denies to
  `institution_workbench` **and** `institution_board`. An Admin MUST NOT learn
  that a child, family or guardian is present at any other institution — not
  through a count, a badge, an ordering, an error message or an absence that
  differs from a normal empty. Queries scope to the current institution before
  aggregating, never after.
- **Scope is not a purpose.** Being inside the institution is necessary and
  never sufficient. Every child-level read still passes 0C-3, and every
  data-class read still passes 0C-5. A predicate that returns child facts on
  institution scope alone reopens this unit.

## 5. Lifecycle and currency

`NurtureCareInstitutionStatus` is `active | paused | archived | deleted`.
**Only `active` grants institution scope** — behaviour T-005 already
implemented, not a choice made here. `paused` and `archived` are unreachable:
no production code sets them, and the accepted cleanup decision removes them.

Authority is reread per request, inheriting 0C-1's no-cache, no-grace-window
rule. A row that stops being current between two requests denies the second.

> **Open point CLOSED 2026-08-08** —
> [`17-lifecycle-status-cleanup-decision.md`](./17-lifecycle-status-cleanup-decision.md).
>
> The original framing was wrong. Denying on non-active is not a conservative
> choice this unit made: it is behaviour T-005 already implemented and
> qualified through G2 Exit, in `care-capture.read.ts`,
> `care-capture.transaction.ts` and `institution-business-communication.read.ts`.
> This record describes that behaviour rather than deciding it.
>
> Nor was there a wind-down question to answer. No production code sets
> `paused` or `archived` on any institution — the values are unreachable, so no
> business event can produce the state whose handling was being debated.
>
> What the investigation did find is a live defect: `status` and `deletedAt`
> both encode deletion, and call sites have already split on which they trust.
> The accepted decision removes `paused`/`archived` and converges `status` on
> `deletedAt`, with schema execution routed to T-002. 0C adopts only the
> contract-level half, below.

**Currency rule (Stage 1 of that decision), frozen here:** an institution,
care group or child care process counts as current only when
`status = active` **and** `deletedAt IS NULL`. The conjunction is required
because the two fields can disagree, and today some readers check one and some
check both. Every 0C predicate uses the conjunction.

No idempotency, outbox or replay semantics: 0C-2 introduces no command.

## 6. Default-safe behavior

| Condition | Result |
| --- | --- |
| Active role unresolved | inherit 0C-1's deny; 0C-2 adds nothing |
| Role kind is not `institution_admin` | deny `not_authorized` |
| `institution_admin` at a non-institution scope type | deny `not_authorized` |
| Institution row missing in this workspace | deny `not_authorized` — never `not_found` |
| Institution `paused` | deny `institution_paused` |
| Institution `archived` | deny `institution_archived` |
| Institution `deleted` | deny `not_authorized`, indistinguishable from missing |
| Target resolves to another institution | deny `not_authorized` — never a "wrong institution" hint |
| Target resolves to no institution | deny `not_authorized` |
| Owner unavailable | deny `unavailable`; never cached authority |
| Contract version mismatch | deny `contract_mismatch` |

`deleted` and missing share one reason code on purpose: an Admin must not be
able to probe which institution ids ever existed. `paused` and `archived` are
distinguishable only because they are, by definition, institutions the Admin
already had scope over.

## 7. Fixtures and downstream gates

1. `institution_admin` at institution scope resolves for a class inside that
   institution;
2. the same admin denies for a class in another institution, with the same
   reason code as a class that does not exist;
3. `caregiver`, `lead_caregiver`, `guardian` and `system_operator` each deny;
4. `institution_admin` whose assignment `scopeType` is `care_group` denies
   rather than being widened to that group's institution;
5. `paused`, `archived` and `deleted` institutions deny with the frozen codes;
6. a child enrolled at two institutions is visible only through the admin's
   own institution, and the other enrolment is absent from every count,
   ordering and error;
7. an empty result inside the institution is byte-identical to an empty result
   caused by cross-institution filtering;
8. institution scope alone returns no child facts — a child-level read without
   0C-3 denies;
9. the emitted context carries no institution name, profile, policy config or
   philosophy payload.

Isolated synthetic fixtures under I0. Real owner paths stay behind I3, joint
conformance behind I4.

## 8. Schema delta

**None — `REUSE`.** Every edge this unit tests is already stored and indexed:
`NurtureCareRoleAssignment.scopeType`/`scopeId`,
`NurtureCareGroup.institutionId`, `NurtureEnrollment.institutionId`, and
`NurtureCareInstitution.status`.

Fixture 7 — that cross-institution filtering is indistinguishable from a
genuine empty — is a query-shape obligation on the implementer, not a schema
one. No migration is authored, planned or applied here.

## Exit

`G4_0C_2_FREEZE_PASS` releases 0C-3 Class & child scope and 0C-4 Surface
envelope, which may proceed in parallel and must both consume
`InstitutionScopeContextV1` unchanged. It does not open implementation, G4-A,
schema apply, activation, deployment or traffic, and it does not complete 0C.
