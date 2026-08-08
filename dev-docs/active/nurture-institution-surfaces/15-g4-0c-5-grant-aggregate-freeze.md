# G4-0C-5 Grant Policy & Aggregate Privacy — Freeze Record

## Status

- Date: 2026-08-08
- Task: T-007
- Unit: 0C-5, after 0C-2 and 0C-3
  ([`10-g4-0c-scope-freeze.md`](./10-g4-0c-scope-freeze.md))
- Contract identity: `nurture.institution-grant-aggregate@1.0.0`
- Consumes: `nurture.institution-child-scope@1.0.0`
  ([`13-g4-0c-3-class-child-scope-freeze.md`](./13-g4-0c-3-class-child-scope-freeze.md))
- Verdict: `G4_0C_5_FREEZE_PASS`
- Releases: 0C-6, G4-A, G4-D
- Open points: §5's is **closed** 2026-08-08 (full coverage or nothing);
  §6's remains, flagged for review before 0C Exit
- Non-effects: no code, schema apply, migration, capability, manifest, secret,
  deployment, activation or traffic.

## 1. Owner, consumer and exact source

| Role | Party | Exact ref |
| --- | --- | --- |
| Canonical owner of ChildLinkGrant and ChildLinkReceipt | Nurture / T-002 | current-pin owner path per `dev-docs/active/nurture-institution-mode/21-c30-landing-requalification-record.md` |
| Surface authority rules | T-004 | `visibility-matrix.json` at `nurture.surface-contract@1.18.0` / `sha256:be84bb23…` |
| Consumers | 0C-6, G4-A, G4-D | — |

This unit closes the last two authority rules the Institution surfaces assert:
`original_grant_data_class_direction_purpose` on both, and
`grant_request_is_not_grant` on the workbench.

## 2. The data-class boundary is not a table boundary

**The finding that shapes this unit.** The visibility matrix treats
`grant_request` and `grant` as two distinct data classes: the workbench may
**read and write `grant_request`**, and is **explicitly denied `grant`**.

There is no `GrantRequest` model. Both are `NurtureChildLinkGrant` rows,
separated only by `status`:

```text
NurtureChildLinkGrantStatus = pending | active | revoked | expired
                            | replaced | deleted
```

So the contract's boundary runs through a column, not through a table. A query
that reads `NurtureChildLinkGrant` without constraining `status` crosses from
`grant_request` into `grant` while looking entirely reasonable.

Frozen mapping, exhaustive over the enum:

| Status | Data class | Workbench |
| --- | --- | --- |
| `pending` | `grant_request` | read + write |
| `active` | `grant` | **denied** |
| `revoked`, `expired`, `replaced` | `grant` | **denied** |
| `deleted` | `grant` | **denied** |

`grant_request_is_not_grant` therefore means: an Admin may raise and track a
request, and may never read or mutate the authority that results from it. The
moment a row leaves `pending`, it leaves the Admin's reach — including its own
request's outcome, which is observable only as the request's terminal state,
never by reading the resulting grant.

An Admin also never grants. Only a Guardian's decision moves a row from
`pending` to `active`; a write that sets `active` from an Institution surface
reopens this unit.

## 3. Frozen shape

```text
GrantRequestContextV1
  childScope        ChildScopeContextV1   (unchanged from 0C-3)
  grantRequestRef   opaque; a pending row only
  requested         { directions[], dataClasses[], purposes[] }
  state             "pending" | "withdrawn" | "settled"
  contractVersion   "1.0.0"
```

`state` is the request's own lifecycle, deliberately **not** the row's status
enum: `settled` says the Guardian decided, without saying what they decided.
An Admin learns that their request concluded, not what authority now exists.

`requested` echoes what was asked for. It is never a projection of what was
granted.

## 4. Predicate

0C-5 owns the fourth and final level of the chain:

```text
active role → institution scope → class/child scope → Grant/data-class/purpose
                                                       ^^^^ this unit
```

`original_grant_data_class_direction_purpose` — every read of family-care
content is admitted only by the **original** grant terms, evaluated together:

1. **Direction** — `family_to_org` or `org_to_family`, matching the content's
   own direction. A grant carrying one direction never admits the other.
2. **Data class** — a member of the grant's `dataClasses`, matching the
   content's class exactly. The enum is closed:
   `daily_care_log`, `care_day_note`, `care_constraint_update`,
   `family_care_question`, `family_follow_up_request`,
   `direct_care_communication`, `child_growth_record`.
3. **Purpose** — a member of the grant's `purposes` **and** of 0C-3's frozen
   vocabulary. The column is `String[]` with no database constraint, so an
   unrecognized stored purpose denies rather than widening.
4. **Currency** — `status = active`, within `effectiveFrom`/`expiresAt`, not
   revoked.

"Original" is the operative word. A grant later widened does not retroactively
admit content read under narrower terms, and a grant narrowed does not
retroactively deny history already delivered — but every **new** read uses
current terms. The existing `can_receive_family_context` and
`can_share_to_family` predicates already evaluate direction and data class this
way; 0C-5 adds purpose and freezes the conjunction.

## 5. Aggregate privacy

An aggregate here means any value that compresses several members' facts into
one number, badge or marker shown to an Admin — a class card's pending count, a
support-signal level, a cross-class exception summary, an attendance roll-up.
None exists in code today; all are G4-A and G4-B work for which this unit is
the foundation.

### Full coverage or nothing

**The counted population comes from scope, not from protected facts.** Who is
in a class is visible to the Admin through enrolment; what is gated is a fact
class *about* each member. So the predicate runs per (member, fact class) pair,
and the population size itself is never the secret.

An aggregate is returned only when the grant predicate admits the fact class
for **every** member of the counted population. Three outcomes, and the third
must stay distinguishable from the second:

| Situation | Returned |
| --- | --- |
| Population non-empty, every member readable | the value |
| Population non-empty, **any** member not readable | `unavailable` with a reason code |
| Population genuinely empty | `0` |

`0` means "there is nothing"; `unavailable` means "I cannot tell you". An
implementation that returns `0` for a denied population destroys the
distinction an Admin needs to know they are looking at a partial view.

**A filtered count is forbidden.** The rejected alternative — drop the
unreadable members and return a number computed over the rest — was what an
earlier draft of this record froze. It is worse than refusing, for two
independent reasons.

### Why a filtered count is worse than refusing

**It silently under-reports.** An Admin responsible for safety oversight who
sees `2` when the true figure is `5` has been given a wrong number with no
signal that it is wrong. "I cannot see all of this" is actionable; a confident
wrong number is not.

**It leaks through differential observation, and no threshold fixes that.**
The readable set changes over time as grants are given and revoked and as
enrolments start and end. An Admin watching a filtered count move from 1 to 2
learns that one member transitioned, even for a fact class they may not read
per-member — and in a small class the inference is close to certain.

This is why the open point's original framing, "should we add a numeric
suppression threshold (a k-anonymity floor)", was the wrong question. A
threshold defends static small cells. It does not defend a time series, which
is the only real attack surface here. Adding one would have bought a
configuration knob and a false sense of protection while leaving the actual
leak open.

Full coverage closes it structurally: with no partially-visible population,
there is no membership delta to observe.

### The correct remedy when an aggregate is refused

Widen the authority, not the disclosure. If a count is genuinely needed for
operations, the answer is to establish a legitimate purpose and grant for that
fact class across the population — not to publish a partial figure. That keeps
the decision where it belongs, with the Guardian who grants.

- **No aggregate bypass.** A count, badge, ordering or trend MUST NOT change
  with a fact the requester would be denied on direct read. This is 0C-3's rule
  restated at grant granularity: the predicate runs before aggregation, never
  after.
- **No cross-institution term.** Inherited from 0C-2 without exception.

## 6. No scoring, no ranking

Frozen from `02-architecture.md`, which states these in six separate places:

- No child, teacher, class, family or institution **score** of any kind.
- No ranking, red/amber/green banding, peer comparison or performance history.
- No freshness score, no AI-derived risk score, hidden or displayed.
- Support signals describe work that may need attention. They are not anomaly
  attribution, risk scoring, teacher performance or a Workflow trigger.
- An `InstitutionAttentionCandidate` may highlight and cite. It may not act,
  diagnose, assign blame or accumulate into a performance record.

These are invariants, not defaults: a later unit cannot enable scoring by
configuration. Introducing any of them reopens 0C.

> **Open point.** Whether an Admin may see per-class counts ordered by size —
> which is not a score but can be read as one — is unsettled. Frozen
> conservative: ordering by a support-signal or workload magnitude is not
> frozen as permitted here, and a branch that wants it must amend this record.
> Flagged for review before 0C Exit.

## 7. Default-safe behavior

| Condition | Result |
| --- | --- |
| Child scope unresolved | inherit 0C-3's deny |
| Grant missing | deny `grant_missing` |
| Grant `revoked` | deny `grant_revoked` |
| Grant `expired`, `replaced`, `deleted` | deny `grant_missing` — the caller learns no lifecycle detail |
| Direction mismatch | deny `data_class_mismatch` |
| Data class outside the grant | deny `data_class_mismatch` |
| Purpose outside the grant or outside 0C-3's vocabulary | deny `purpose_not_granted` / `purpose_not_honoured` |
| Read of a non-`pending` grant row from a workbench surface | deny `not_authorized` |
| Write attempting to set `active` from an Institution surface | deny `not_authorized` |
| Aggregate population partially readable | `unavailable` — never a filtered count |
| Aggregate population empty and fully readable | `0`, distinguishable from `unavailable` |
| Owner unavailable | deny `unavailable`; never cached authority |

Direction and data-class faults share one reason code deliberately: telling
them apart would let an Admin probe a grant's exact terms by elimination.

## 8. Fixtures and gates

1. a `pending` row is readable as `grant_request`; the same row once `active`
   denies;
2. `revoked`, `expired`, `replaced` and `deleted` rows all deny with the same
   code as missing;
3. a workbench write setting `active` denies;
4. a request's outcome is observable only as `settled`, never as the resulting
   grant's terms;
5. direction, data class and purpose are evaluated together — matching two of
   three denies;
6. a purpose granted but outside 0C-3's vocabulary denies
   `purpose_not_honoured`;
7. content admitted under narrower terms is not re-admitted by a later
   widening within the same request;
8. an aggregate does not change with a fact denied on direct read;
9. no response carries a score, band, rank or performance field under any
   name;
10. an aggregate whose population is fully readable returns its value;
11. the same aggregate with **one** member unreadable returns `unavailable`,
    never a count over the remaining members;
12. a genuinely empty population returns `0`, and `0` is distinguishable from
    `unavailable` in the response;
13. repeating 11 after a grant is added or revoked yields no observable delta —
    both calls are `unavailable`, so no membership change leaks.

Isolated synthetic fixtures under I0. Real owner paths stay behind I3, joint
conformance behind I4.

## 9. Schema delta

**None — `REUSE`.** `NurtureChildLinkGrant` already carries `directions`,
`dataClasses`, `purposes`, `status` and the effective window;
`NurtureChildLinkReceipt` already records direction and data class per
delivery.

Two properties are predicate obligations rather than schema ones, and both are
the kind an implementer can violate while the build stays green:

- the `status` filter that keeps `grant_request` from becoming `grant`, since
  one table holds both;
- the closed purpose vocabulary, since `purposes` is `String[]`.

Fixtures 1, 2 and 6 exist because a constraint cannot carry these.

## Exit

`G4_0C_5_FREEZE_PASS` releases 0C-6, G4-A and G4-D. It does not open
implementation, schema apply, activation, deployment or traffic. Two open
points are flagged for review before 0C Exit.
