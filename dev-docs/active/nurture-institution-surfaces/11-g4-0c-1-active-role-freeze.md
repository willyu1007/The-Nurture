# G4-0C-1 Active Role & Actor Context — Freeze Record

## Status

- Date: 2026-08-08
- Task: T-007
- Unit: 0C-1, first on the 0C critical path
  ([`10-g4-0c-scope-freeze.md`](./10-g4-0c-scope-freeze.md))
- Contract identity: `nurture.institution-active-role@1.0.0`
- Verdict: `G4_0C_1_FREEZE_PASS`
- Releases: 0C-2, and through it every later 0C unit
- Non-effects: no code, schema apply, migration, capability, manifest, secret,
  deployment, activation or traffic. This record freezes a contract; it does
  not implement one.

## 1. Owner, consumer and exact source

| Role | Party | Exact ref |
| --- | --- | --- |
| Canonical owner of the authenticated principal | My-Chat | `51ad97f721bf74cced3ec75d24f3066c4ef6ab1c` |
| Canonical owner of participant, role assignment and scope | Nurture / T-002 | current-pin owner path per `dev-docs/active/nurture-institution-mode/21-c30-landing-requalification-record.md` |
| Surface contract baseline | T-004 | `nurture.surface-contract@1.17.0` / `sha256:d22851d9…`, the artifact current when this unit froze; 0C-4 later rotated it to `1.18.0` additively with `sharedCoreHash` unchanged, so this evidence is preserved |
| Consumers | 0C-2…0C-6, G4-A, and every role-bound surface | — |

My-Chat owns who the human is. Nurture owns what that human may act as. The
two are never the same fact, and no My-Chat identity implies a Nurture role.

## 2. Fact, projection and candidate boundaries

**Canonical facts (Nurture-owned, persisted):**

- `NurtureParticipant` — the workspace-local actor identity bound to a
  My-Chat user.
- `NurtureCareRoleAssignment` — `participantId`, `role`, `scopeType`,
  `scopeId`, `status`, `startsAt`, `endsAt`. One row is one grant of one role
  at one scope.

**Derived (never persisted as authority):**

- `NurtureActorBinding` — the resolved (participant, role assignment, role
  kind, scope type, scope id, work scope) tuple a request executes under.
- The active-role selection itself: a per-request choice among eligible
  bindings, not a stored preference.

**Not permitted:** an AI or heuristic role choice. Selection is either
explicit from the caller or unique by construction; there is no inferred,
remembered or ranked "probably meant this role".

## 3. Frozen vocabulary and shape

```text
NurtureCareRole      = guardian | caregiver | lead_caregiver
                     | institution_admin | system_operator
NurtureCareScopeType = child_care_process | family | institution
                     | care_group | enrollment
```

Both unions are closed. A caller MUST NOT synthesize a role, a scope type, an
`actor_binding_ref`, a `role_assignment_id` or a scope id; every one is issued
by Nurture from a stored row.

`ActiveRoleContextV1`, the envelope every 0C consumer receives:

```text
ActiveRoleContextV1
  participantRef        opaque, workspace-scoped
  roleAssignmentRef     opaque; identifies the exact assignment row
  roleKind              NurtureCareRole
  scopeType             NurtureCareScopeType
  scopeRef              opaque
  selectionMode         "explicit" | "unique"
  contractVersion       "1.0.0"
```

No `permissions`, no capability list, no display name, no My-Chat user id. The
context says which assignment is in force, never what it may do — that is
0C-2 onward.

## 4. Predicate

0C-1 owns the first level of the chain fixed in the scope freeze:

```text
active role → institution scope → class/child scope → Grant/data-class/purpose
     ^^^^ this unit
```

Resolution order, each step failing closed:

1. **Principal** — a My-Chat authenticated principal is present and current.
   Absent or unverifiable denies; a private service identity never substitutes
   for the adult.
2. **Participant** — exactly one active `NurtureParticipant` binds that
   principal in this workspace. `participant_state !== "active"` denies with
   `participant_missing`.
3. **Eligible assignments** — active role assignments for that participant,
   within `startsAt`/`endsAt`. `role_state === "revoked"` denies with
   `role_revoked`; anything else non-active denies with `role_missing`.
4. **Selection** — if exactly one assignment is eligible, `selectionMode` is
   `unique`. If more than one, the caller MUST name the assignment and
   `selectionMode` is `explicit`. **An ambiguous multi-role request denies; it
   never picks, merges or defaults.**

Three invariants, each already true in the implementation and frozen here so
it stays true:

- **No merged super-authority.** A user holding several roles acts under
  exactly one per request. There is no union surface and no "highest role".
- **Lead grants nothing.** `lead_caregiver` is Admin-assigned internal
  labelling. Of the six current policy keys, five test `role_kind` and every
  one of those five names `caregiver` and `lead_caregiver` together; the sixth,
  `nurture.can_write_family_care_message`, tests thread state and message
  state and does not branch on role at all. Both properties are frozen: a
  predicate that admits `lead_caregiver` where it denies `caregiver` reopens
  this unit, and so does one that introduces a role branch giving Lead a path
  `caregiver` lacks.
- **`system_operator` is not an actor role for these surfaces.** It exists in
  the union but appears in no policy predicate today, and 0C freezes it as
  never selectable as an active role for Institution surfaces.

## 5. Lifecycle, versioning and concurrency

- The context is **per request**. It is never cached, never carried across
  requests and never stored as a session preference.
- Authority is reread on every protected request. An assignment revoked
  between two requests denies the second; there is no grace window.
- `roleAssignmentRef` pins the exact row, so an assignment that is revoked and
  re-granted is a different context even for the same participant, role and
  scope.
- No idempotency key, outbox or replay semantics: 0C-1 introduces no command
  and no durable effect.
- `contractVersion` is exact. A consumer receiving an unknown version fails
  closed rather than coercing.

## 6. Default-safe behavior

| Condition | Result |
| --- | --- |
| Principal absent, expired or unverifiable | deny `not_authorized` |
| No active participant for the principal | deny `participant_missing` |
| Assignment revoked | deny `role_revoked` |
| Assignment missing, not yet started or ended | deny `role_missing` |
| Multiple eligible assignments, none named | deny `role_selection_required` |
| Named assignment not eligible for this participant | deny `role_missing` — never fall back to another eligible one |
| Owner unavailable | deny `unavailable`; never serve from cached authority |
| Contract version mismatch | deny `contract_mismatch` |

Every deny is safe-shaped: a reason code and nothing about what exists. A
caller cannot distinguish "no such assignment" from "not yours" from the
response.

## 7. Fixtures and downstream gates

Synthetic fixtures required before 0C-2 may cite this unit:

1. single eligible assignment resolves with `selectionMode: "unique"`;
2. two eligible assignments with no selection deny
   `role_selection_required`;
3. two eligible assignments with an explicit valid selection resolve to that
   exact `roleAssignmentRef`;
4. explicit selection naming another participant's assignment denies
   `role_missing`;
5. revoked assignment denies `role_revoked` even when it was valid moments
   earlier;
6. expired `endsAt` denies `role_missing`;
7. `lead_caregiver` and `caregiver` produce identical outcomes across all six
   current policy keys — the five that test `role_kind` and the one that does
   not;
8. `system_operator` is never selectable for an Institution surface;
9. the emitted context carries no permissions, capability list, display name
   or My-Chat user id.

These are isolated synthetic fixtures under the I0 gate. Real owner paths stay
behind I3 Owner Integration Readiness and joint conformance behind I4; this
record opens neither.

## 8. Schema delta

**None.** `NurtureParticipant` and `NurtureCareRoleAssignment` already carry
every field the contract needs — participant binding, role, scope type, scope
id, status and the `startsAt`/`endsAt` window. 0C-1 is `REUSE`.

No migration is authored, planned or applied by this unit. If a later 0C unit
finds a genuine gap, it declares its own delta; it does not amend this record.

## Exit

`G4_0C_1_FREEZE_PASS` releases 0C-2 Institution scope, which extends the chain
by exactly one level and must consume `ActiveRoleContextV1` unchanged. It does
not open implementation, G4-A, schema apply, activation, deployment or
traffic, and it does not complete 0C.
