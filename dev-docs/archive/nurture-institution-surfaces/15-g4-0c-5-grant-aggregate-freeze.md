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
- Open points: **both closed** 2026-08-08 — §5 by full-coverage-or-nothing,
  §6 by a fixed class-list order with no system-produced ordering
- Amendments: **2026-08-09**, §6 prohibition scoped to subject lists, with a
  narrower rule for work-item lists. Raised by 0D-5
  ([`29`](./29-g4-0d-5-support-signal-freeze.md)); to be confirmed by 0G's 0D
  branch audit.
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

   > **Why this one is not the conjunction (0G finding 3).** The lifecycle
   > decision's Stage 1 rule — current means `status = active` **and**
   > `deletedAt IS NULL` — applies to the three entities that carry both
   > fields: institution, care group, child care process.
   > `NurtureChildLinkGrant` has `status` and no `deletedAt`, so its currency
   > is `status` plus the effective window, and the difference is deliberate
   > rather than an omission.

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

### Class list order is fixed, and the system produces no ordering

**Open point CLOSED 2026-08-08.** The question was whether an Admin may see
classes ordered by workload magnitude — not a score, but readable as one. The
answer is stronger than permitting or forbidding a particular sort key: **the
system produces no state-derived ordering at all.**

The class list is presented in a **fixed order derived from stable class
attributes** — today `ageBandKey` then `name`, both already stored; later an
explicit display order if a product decision adds one. The order MUST NOT
change as state changes.

Two reasons, and the second is the one that decided it.

**It removes the question rather than answering it.** With no system-produced
ordering, there is no sequence to argue about, no artifact that can be
screenshotted as a ranking, and nothing that accumulates authority as "the list
that says which class is worst". An earlier draft would have permitted ordering
by support-signal level then by age — formally inside the invariant, but still
a system-asserted sequence. Fixed order makes the no-comparison property
structural instead of formal.

**A stable list is better for daily use.** An Admin opens this many times a
day. A list that re-sorts itself destroys spatial memory: every visit requires
re-reading each card to find the one you wanted. A fixed order lets position
become muscle memory.

Triage does not suffer, because triage and location are different jobs. The
card already carries the frozen two-level support signal, so scanning for
"needs handling" is immediate; the order only tells you where things are. **The
marker does triage, the position does location.**

Explicitly forbidden, as consequences of the same rule:

- ordering by any count, magnitude, urgency, deadline or signal level;
- any cross-class numeric comparison, banding, colour grading or trend;
- any ordering derived from a computed score or from AI.

### Scope of the prohibition — amended 2026-08-09

**The prohibition above governs SUBJECT lists** — lists of classes, teachers,
families or institutions. **Work-item lists** — support signals, WorkItems —
are ordered by the unit that owns them, under the narrower rule below.

The amendment was raised by 0D-5 ([`29`](./29-g4-0d-5-support-signal-freeze.md)),
which found that `02-architecture.md` orders the Institution home's cross-class
signals by explicit deadline while the list above names deadline. That
scenario was outside this section's view: the section is titled for the class
list, and its prohibitions were written as consequences of the class-list rule.

The two reasons above were re-checked against a work-item list, and **the one
this section calls decisive does not hold there**. A signal list has no stable
membership — 0D-5 recomputes it per read and a resolved source is simply absent
next time — so there is no spatial memory for a re-sort to destroy. Nor does
"the marker does triage, the position does location" carry over: on a class
card the marker sits on the card, whereas a signal **is** the marker, so the
sentence has no second layer to refer to.

The first reason does carry over, and is what the narrower rule preserves:

**A work-item list MUST NOT be ordered by signal level, count, magnitude, or
any computed or AI-derived value.** Those are system assertions about which
subject needs attention, and ordering by them is the ranking this section
forbids, whatever the list is nominally of.

**A work-item list MAY be ordered by an explicit deadline the business object
itself carries.** A deadline is an external fact on the source, not an
assessment of anyone — 0D-5 §4 requires it to be the object's own and forbids
inventing a second one. Ordering by it asserts which item comes due first, not
which class is worse.

**Ties and missing deadlines fall back to the fixed subject order**
(`ageBandKey`, then `name`), never to level or count. Without that, a
deadline-ordered list would quietly become a level-ordered one whenever
deadlines coincide.

What this amendment does **not** change: the class list's own order, the
no-scoring invariants, the cross-class comparison ban, or anything in §5. It
narrows the scope of one sentence to the scope of the argument that produced
it. The 0G audit of the 0D branch should confirm the narrowing rather than
treat this section as unrevised.

> **Tension recorded rather than hidden.** The class card displays its own
> counts — awaiting response, new parent feedback, institution-pending — so an
> Admin can compare classes by reading them. This rule constrains what the
> system asserts, not what a person can compute, and it does not pretend
> otherwise. Those counts measure the Admin's own outstanding work at that
> entry point, not the class's or the teacher's performance, which is why they
> stay. If the invariant is ever to be airtight, the card's raw counts are
> where to look — a G4-B card-design decision, not this unit's.

The governing sentence is the architecture's own: **the class card is an entry
point to current state, not a KPI panel.** Ordering by volume is the act that
turns one into the other.

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
    both calls are `unavailable`, so no membership change leaks;
14. the class list order is identical before and after a state change that
    alters counts and support-signal levels;
15. no **subject** list carries an ordering derived from a count, magnitude,
    urgency, deadline, signal level or computed score;
16. no **work-item** list is ordered by signal level, count, magnitude or any
    computed or AI-derived value, and one ordered by an explicit deadline falls
    back to the fixed subject order on ties and on missing deadlines, never to
    level or count.

Fixtures 15 and 16 replace the single fixture 15 frozen on 2026-08-08, per the
§6 amendment of 2026-08-09. The original wording is preserved there as the
sentence being narrowed.

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
