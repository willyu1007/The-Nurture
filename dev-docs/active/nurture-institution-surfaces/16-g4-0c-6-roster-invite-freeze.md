# G4-0C-6 Roster & Invite, First Increment — Freeze Record

## Status

- Date: 2026-08-08
- Task: T-007
- Unit: 0C-6, last on the 0C critical path
  ([`10-g4-0c-scope-freeze.md`](./10-g4-0c-scope-freeze.md))
- Contract identity: `nurture.institution-roster-invite@1.0.0`
- Consumes: `nurture.institution-grant-aggregate@1.0.0`
  ([`15-g4-0c-5-grant-aggregate-freeze.md`](./15-g4-0c-5-grant-aggregate-freeze.md))
  and 0C-1's `ActiveRoleContextV1`
- Verdict: `G4_0C_6_FREEZE_PASS`
- Releases: G4-C; completes the six-unit 0C chain
- **First unit with a real schema delta.** 0C-1 through 0C-5 were all `REUSE`;
  this one is not. The delta is authored as a plan and **not applied** — G4-0
  executes no migration.
- Non-effects: no code, schema apply, migration, capability, manifest, secret,
  deployment, activation or traffic.

## 1. Owner, consumer and exact source

| Role | Party | Exact ref |
| --- | --- | --- |
| Canonical owner of adult identity, contact details and invitation delivery | My-Chat | `51ad97f721bf74cced3ec75d24f3066c4ef6ab1c` |
| Canonical owner of Participant, RoleAssignment, Enrollment, Grant | Nurture / T-002 | current-pin owner path per `dev-docs/active/nurture-institution-mode/21-c30-landing-requalification-record.md` |
| Consumer | G4-C `people_operations` | — |

**The ownership line is the whole point of this unit.** Contact details belong
to the My-Chat invitation/contact owner; Nurture holds only a Host-owned opaque
contact ref. `02-architecture.md` states this twice and lists it as an exit
checkbox: adults' contact information is held by the Host owner, and Nurture
stores an opaque ref plus safety labels.

So an invite is **not** something Nurture sends. Nurture records that an invite
was asked for, against an opaque ref, and observes its outcome.

## 2. Fact, projection and candidate boundaries

**Canonical facts, existing:** `NurtureParticipant`,
`NurtureCareRoleAssignment`, `NurtureEnrollment`, `NurtureChildLinkGrant`.

**Canonical fact, new (see §7):** the roster invite itself. Nothing in the
schema records one today — there is no Invite or Invitation model — so this
unit's delta is the first genuinely new persisted concept in 0C.

**Never stored by Nurture:** a phone number, email address, WeChat id, display
name obtained from an invite, or any Host account identity. A field that would
hold one reopens this unit.

**Not permitted:** deriving a roster from message senders, attendance rows or
photo attribution. Roster membership comes from an Enrollment or a
RoleAssignment, both explicit.

## 3. Frozen command shape

Single explicit commands only. 0A defers bulk roster/invite, and the register
records that the first increment supports single explicit operations; batch
selection, partial-failure semantics and their audit contract are out of scope.

```text
RequestRosterInviteV1                  -- one invite, one target
  activeRole        ActiveRoleContextV1        (0C-1)
  institutionScope  InstitutionScopeContextV1  (0C-2)
  careGroupRef      opaque                     -- the class being joined
  contactRef        Host-owned opaque ref      -- never a contact value
  invitedRole       "guardian" | "caregiver" | "lead_caregiver"
  idempotencyKey    caller-supplied
  contractVersion   "1.0.0"

RosterInviteStateV1                    -- what an Admin may observe
  inviteRef         opaque
  state             "requested" | "delivered" | "accepted"
                  | "declined" | "expired" | "withdrawn"
  invitedRole       as above
  careGroupRef      opaque
  requestedAt, lastTransitionAt
```

`invitedRole` excludes `institution_admin` and `system_operator`. An Admin
inviting another Admin is an authority-granting act this increment does not
freeze; it denies.

No response carries a contact value, a Host account id, or the invitee's name
before acceptance. `RosterInviteStateV1` is the entire observable surface.

## 4. Predicate

0C-6 adds no authority level. It composes the frozen chain:

```text
active role → institution scope → [class] → Grant terms
```

- `current_institution_admin` at the scoped institution (0C-1, 0C-2).
- The target class resolves into that institution (0C-2), and the request
  names it explicitly — never "the class the contact already belongs to".
- Issuing an invite is **not** a child-level read, so 0C-3's purpose
  requirement does not apply. Reading an invite's state is likewise not a
  child read: the state carries no child fact.
- **Acceptance is the Guardian's, never the Admin's.** An Admin may request,
  withdraw and observe. Only the invitee's own action moves `delivered` to
  `accepted`, and only then do the downstream Nurture facts exist.

### What acceptance creates, and what it does not

On acceptance, and only then, Nurture creates the Participant binding and the
RoleAssignment. Enrollment and Grant are **separate subsequent decisions**, not
consequences of accepting an invite:

- an accepted caregiver invite yields a RoleAssignment, not an Enrollment;
- an accepted guardian invite yields a Participant and RoleAssignment; the
  child's Enrollment and any ChildLinkGrant follow their own paths, and
  **0C-5's rule holds — the Admin never grants**.

An implementation that creates a Grant as part of accepting an invite would
route around 0C-5 entirely. That is the specific failure this section exists to
forbid.

## 5. Lifecycle, idempotency and concurrency

- `idempotencyKey` makes a repeated request the same request. A retry returns
  the existing `inviteRef` and state; it never creates a second invite.
- One outstanding invite per (institution, careGroup, contactRef, invitedRole).
  A second request while one is outstanding returns the existing one.
- `withdrawn` is Admin-initiated and terminal. `expired` is time-driven and
  terminal. Neither deletes history.
- Transitions are one-way; there is no reopening. A withdrawn or expired
  invite is superseded by a **new** invite, not revived.
- Authority is reread per request. An Admin who loses scope between requesting
  and withdrawing cannot withdraw.
- No outbox or replay semantics are frozen here: delivery is My-Chat's, and
  Nurture observes the outcome rather than driving it.

## 6. Default-safe behavior

| Condition | Result |
| --- | --- |
| Active role or institution scope unresolved | inherit 0C-1 / 0C-2 deny |
| Class outside the scoped institution | deny `not_authorized` — identical to a class that never existed |
| `invitedRole` is `institution_admin` or `system_operator` | deny `not_authorized` |
| `contactRef` unknown to the Host owner | deny `not_authorized` — never "no such contact" |
| Outstanding invite exists | return the existing invite; never a duplicate |
| Withdraw on an already-terminal invite | deny `invite_not_current` |
| Host owner unavailable | deny `unavailable`; the invite is not recorded as requested |
| Contract version mismatch | deny `contract_mismatch` |

`contactRef` faults are never distinguishable from authority faults: an Admin
must not be able to probe which contact refs exist.

## 7. Schema delta — planned, not applied

The first non-`REUSE` delta in 0C. Recorded here per the freeze-record
contract; **G4-0 applies nothing**.

```text
NurtureRosterInvite            -- new table
  id, workspaceId
  institutionId                -- scope, indexed with careGroupId
  careGroupId
  contactRef                   -- Host-owned opaque; NOT a contact value
  invitedRole                  -- guardian | caregiver | lead_caregiver
  state                        -- new enum, the six values in §3
  idempotencyKey               -- unique per workspace
  requestedByParticipantId
  requestedAt, lastTransitionAt
  acceptedParticipantId?       -- set only on acceptance
```

Two constraints carry rules the predicate otherwise has to remember:

- a partial unique index over
  `(workspaceId, institutionId, careGroupId, contactRef, invitedRole)` where
  `state` is non-terminal, enforcing "one outstanding invite";
- a unique index on `(workspaceId, idempotencyKey)`.

Notably **absent by design**: any column that could hold a contact value, a
Host account id, or an invitee display name. The absence is the privacy
control, so a later migration adding one reopens this unit.

The delta is authored for a branch to apply after I1 opens. It is not applied,
planned into a migration file, or reflected in `prisma/schema.prisma` by this
unit.

## 8. Fixtures and gates

1. a single invite request succeeds and returns `requested`;
2. an identical retry with the same `idempotencyKey` returns the same
   `inviteRef` and creates nothing;
3. a second request while one is outstanding returns the existing invite;
4. a bulk or multi-target request is rejected as unsupported, not partially
   applied;
5. `invitedRole: institution_admin` denies;
6. a class in another institution denies with the same code as a nonexistent
   class;
7. an unknown `contactRef` denies indistinguishably from an authority failure;
8. no response at any state carries a contact value, Host account id or
   pre-acceptance name;
9. acceptance creates a Participant and RoleAssignment and **no** Grant;
10. withdrawing a terminal invite denies; a new invite is required;
11. an Admin who has lost institution scope cannot withdraw.

Isolated synthetic fixtures under I0. Real owner paths stay behind I3, and the
Host invitation path specifically behind I4 joint conformance — this unit is
the most owner-dependent in 0C and cannot be qualified synthetically alone.

## Exit

`G4_0C_6_FREEZE_PASS` releases G4-C and **completes the six-unit 0C chain**.

0C Exit itself is a separate step: it requires 0G's rolling cross-contract
audit over all six records, plus review of the three open points flagged
conservative along the way — institution wind-down read (0C-2), small-cell
aggregate suppression and workload-magnitude ordering (0C-5). None of the six
records opens implementation, schema apply, activation, deployment or traffic.
