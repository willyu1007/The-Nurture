# Lifecycle Status Redundancy — Cleanup Decision

## Status

- Date: 2026-08-08
- Surfaced by: T-007 G4-0C-2, while freezing institution scope
- Owner of the facts: T-002
- State: **DECISION ACCEPTED — execution routed, not performed here**
- Effect on 0C: closes the 0C-2 open point. 0C freezes current behaviour and
  adds one contract-level rule (§4); it changes no schema.

## What was found

0C-2 needed to freeze what an institution's `status` means for authority. The
investigation found the question was mis-posed, and found a live defect.

### 1. Three identical enums, copied not designed

```text
NurtureChildCareProcessStatus = active | paused | archived | deleted
NurtureCareInstitutionStatus  = active | paused | archived | deleted
NurtureCareGroupStatus        = active | paused | archived | deleted
```

### 2. Two of the four values are unreachable

No production code sets `paused`, `archived` or `deleted` on any of the three
entities. Rows are created `active` — in test fixtures only for institutions —
and never transition. There is no command, handler or migration that produces a
paused or archived institution, care group or care process.

So the question 0C-2 originally posed — "should a paused institution have a
wind-down read path?" — has no business event behind it. Nothing can produce
the state whose handling was being debated.

### 3. `deleted` duplicates `deletedAt`, and the duplication has already split

All three entities carry **both** a `status` with a `deleted` member **and** a
nullable `deletedAt`. Two representations of one fact, free to disagree: a row
may be `status = active` with a non-null `deletedAt`.

The call sites have already diverged on which one they trust:

| Call site | Check |
| --- | --- |
| `institution-context.repository.ts` `roleReachesChild` | `status: "active"` **and** `deletedAt: null` |
| `user-attention.repository.ts:281` | `status === "active" && !deletedAt` |
| `care-capture.read.ts:89` | `status !== "active"` only |
| `care-capture.transaction.ts:90` | `status !== "active"` only |
| `institution-business-communication.read.ts:78,82` | `status !== "active"` only |

**This is a defect today, not a hypothetical.** A soft-deleted institution or
care group — `deletedAt` set, `status` untouched — is currently invisible to
`roleReachesChild` and visible to the capture and communication readers.
Nothing produces such a row yet, which is the only reason it has not bitten.

### 4. The "is this operational?" question is derived

Whether care can happen at an institution is answerable from whether it has
current care groups and enrolments. Storing it as `status` makes a derived fact
canonical — the exact error the 0C freeze records warn against elsewhere
("derived, never persisted as authority").

## Decision

**`paused` and `archived` are to be removed from all three enums, and the
`status` column on these three entities is to converge on `deletedAt` as the
single record-lifecycle fact.**

Rationale: with the two unreachable values gone, `status` carries exactly the
information `deletedAt` already carries, so keeping both perpetuates the split
in §3. A genuine operational-suspension requirement, should one appear later,
needs its own modelling — a real business event, a named actor and a
reversibility rule — rather than the reuse of a value that was copied in
without semantics.

### Staging

**Stage 1 — contract-level, executable now, no schema change.**
Freeze the currency rule as the conjunction: a row of these three entities
counts as current only when `status = active` **and** `deletedAt IS NULL`. That
closes the live split at the predicate level regardless of when the schema
converges. 0C adopts it (§4).

**Stage 2 — schema convergence, routed to T-002.**
Remove `paused` and `archived`; then drop `status` in favour of `deletedAt`.
Postgres cannot `DROP VALUE` from an enum, so each step is a new type plus a
column swap across three tables, with a precondition that no row holds a
removed value — trivially true today and cheap to assert, which is an argument
for doing it sooner rather than after the states become reachable.

### Cost that must not be underestimated

`institution-business-communication.read.ts` is the reader G4-0C-4 promoted to
the public capability `query_institution_communication_review@1.0.0`, and 0C-4
froze it as **consumed unchanged, digest unrotated**
(`sha256:dd1b63fe6c7975bafb4170aff3dccc92463dfaf3e5ea7e5bd3c80f1298d6c921`).

Any Stage 2 edit to lines 78 or 82 rotates that interface digest, which
invalidates the T-005 G2-B evidence referencing the digest and requires
requalifying the affected slice. Stage 2 is therefore not a local schema tidy
but a change with cross-task evidence consequences, and whoever schedules the
work should plan the requalification alongside.

Stage 1 avoids all of that — Stage 1 is a predicate rule, not an edit to that
file.

## Effect on G4-0C

The 0C-2 open point is **closed, not deferred**. Its original framing — a
product choice between strict and permissive — was wrong: denying on non-active
is not a conservative choice this task made, it is behaviour T-005 already
implemented and qualified through G2 Exit. 0C-2 is corrected to say so.

0C adopts Stage 1 and nothing else. No 0C unit changes schema; 0C-6's planned
delta remains the only one, and it is unrelated.

## Non-effects

Accepting this decision changes no code, schema, migration, capability,
manifest, database, secret or configuration. Stage 2 belongs to T-002 and is
not authorized here.
