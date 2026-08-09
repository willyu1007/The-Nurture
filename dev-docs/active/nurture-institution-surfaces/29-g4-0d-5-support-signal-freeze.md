# G4-0D-5 Institution Support Signals — Freeze Record

## Status

- Date: 2026-08-09
- Task: T-007
- Unit: 0D-5, after 0D-1 ([`25-g4-0d-scope-freeze.md`](./25-g4-0d-scope-freeze.md))
- Contract identity: `nurture.institution-support-signal@1.0.0`
- Consumes: 0C-5 §5 aggregate privacy, 0D-1's submission state
- Verdict: `G4_0D_5_FREEZE_PASS`
- Releases: G4-B, G4-C
- Open points: **one**, §4 cross-class signal ordering against 0C-5 §6
- Schema delta: **`DELTA`** — planned below, not applied
- Non-effects: no code, schema apply, migration, capability, manifest, secret,
  deployment, activation or traffic.

## 1. Owner, consumer and exact source

| Role | Party | Exact ref |
| --- | --- | --- |
| Canonical owner of the policy | Nurture Institution domain | this record |
| Signal projection | **no canonical owner — composed per request** | see §2 |
| Aggregate rule | 0C-5 §5 | [`15`](./15-g4-0c-5-grant-aggregate-freeze.md), executed by [`24`](./24-g4-a-increment-4-record.md) |
| Attendance checkpoint | 0D-1 | [`26`](./26-g4-0d-1-attendance-closeout-freeze.md) |
| Consumers | G4-B, G4-C | — |
| Product source | `02-architecture.md` "Institution Support Signals" | — |

## 2. Type boundaries

`InstitutionSupportSignalProjectionV1` is **request-composed, non-canonical and
actor-safe**. The consequence is the unit's central rule:

**A signal owns no resolved or closed truth.** Every read recomputes from the
current source and policy. When a source is resolved, withdrawn, corrected,
redacted, revoked, expired or moved out of scope, the signal simply is not in
the next snapshot. There is no "dismiss", no "acknowledge", no stored
resolution.

**Nothing records that a signal once fired.** Where processing history is
needed, what is retained is the Admin's real action on the source, the
WorkItem/Workflow, or the policy revision — never an event meaning "this class
was flagged" or "this teacher was late". That distinction is the whole
difference between an operational aid and a performance record, and a stored
signal history would quietly become the second.

## 3. Frozen shape

```text
InstitutionSupportSignalV1
  category          one of the seven below, closed
  tier              "action_required" | "attention_suggested"
  scopeRef          the class or institution scope the signal is about
  sourceRef         opaque; exactly one current, readable source
  safeReason        a fixed phrase per category — never free prose about people
  currentCount      present only for the two threshold categories
  deadlineAt        present only when the source carries an explicit one
  occurredAt        the source's own time
  policyRevision    the revision that produced this signal
  contractVersion   "1.0.0"
```

```text
category = attendance_submission_overdue
         | business_response_overdue
         | review_backlog_threshold
         | authority_or_source_blocked
         | work_item_or_workflow_blocked
         | configured_load_threshold
         | ai_attention_candidate          -- slot only, see §6
```

A closed seven-member set. Adding a member is an amendment with its own
fixtures.

**Every signal must cite exactly one currently readable source.** A signal with
no source, or whose source the reader cannot open, does not exist for that
reader — it is not degraded to a sourceless notice.

**Fields no response may carry, under any name:** score, band, rank, percentile,
cross-class comparison, historical deviation, teacher activity rate, response
speed, or any freshness figure. 0C-5 §6 is an invariant and this unit restates
it at signal granularity.

**"No activity photo or text" is not a signal.** Absence of records is not
evidence that work did not happen — the same rule 0D-2 froze for placement.

## 4. Predicate

### Tier mapping is fixed, and AI does not own it

| Categories | Tier |
| --- | --- |
| `attendance_submission_overdue`, `business_response_overdue`, `authority_or_source_blocked`, `work_item_or_workflow_blocked` | `action_required` |
| `review_backlog_threshold`, `configured_load_threshold`, `ai_attention_candidate` | `attention_suggested` |

`action_required` maps only to an explicit overdue, an authority/source
blocker, or a canonical WorkItem/Workflow blocker. Absolute load thresholds and
the future AI candidate map to `attention_suggested`. **A future AI provider
cannot raise its own tier**, which is why the mapping is frozen per category
rather than computed.

### Deterministic rules reuse existing business checkpoints

An overdue signal fires against the deadline the business object already
carries — 0D-1's attendance checkpoint, a communication's own response
deadline. **No unit may invent a second, hidden deadline.** A signal whose
timing comes from somewhere the Admin cannot see in the source is unreviewable.

### Thresholds are aggregates

`review_backlog_threshold` and `configured_load_threshold` count members, so
they are aggregates in 0C-5 §5's sense and obey full coverage or nothing. A
count over a class whose members are not all readable returns `unavailable` —
never a figure over the readable ones, and never a suppressed signal that would
be indistinguishable from "below threshold". This unit is the first consumer of
G4-A increment 4 and uses its rule rather than restating one.

### Open point — cross-class ordering against 0C-5 §6

`02-architecture.md` specifies that the Institution home returns at most three
cross-class signals ordered by explicit deadline, then business state, then
`occurredAt`. **0C-5 §6 fixture 15 forbids an ordering derived from "a count,
magnitude, urgency, deadline, signal level or computed score", and names
deadline explicitly.** The two cannot both hold as written.

The tension is real rather than editorial. Ordering *items within one class* —
"what is due first in my class" — compares no subjects. Ordering *items across
classes* and labelling each with its class produces a de facto ranking of
classes, which is exactly the "readable as one" outcome 0C-5 §6 closed the
class-list question to avoid. A three-item cross-class list is a short ranking
of classes wearing a different name.

Three candidate resolutions, none chosen here:

1. **Within-class only.** The home surfaces a per-class entry point and orders
   nothing across classes. Safest, and loses the "what needs me first today"
   view the architecture intended.
2. **Cross-class, unordered.** Return the signals with no order at all, in the
   fixed class order 0C-5 §6 already fixes (`ageBandKey`, then `name`). Keeps
   the cross-class view, drops the triage.
3. **Amend 0C-5 §6 to scope fixture 15 to subject ordering.** Explicitly permit
   ordering *work items* by their own explicit deadline while continuing to
   forbid ordering *subjects* by anything. Most useful, and requires reopening
   0C-5 rather than deciding here.

**This must close before 0D Exit**, and if the answer is (3) it closes by
amending [`15`](./15-g4-0c-5-grant-aggregate-freeze.md), not by 0D-5 overriding
it. A unit that quietly widened a rule another unit narrowed would violate 0G
invariant 5.

### Reads change nothing

The mobile surface has no `dismiss`, `acknowledge` or `escalate` command.
Reading a signal alters no business state. Admin Web may adjust the policy,
open the source, and take an existing source action; creating a WorkItem or
starting an eligible registered Workflow is a separate, explicit, idempotent
business action. **The first increment's ordinary signals may not start
`EnrollmentJourneyWorkflowV1`.**

## 5. Lifecycle, versioning and concurrency

**Stable dedupe identity:** `source type + exact source ref + policy revision +
window`. Two reads of the same underlying condition produce the same identity,
so a client can match them across snapshots without the server storing state.

**Policy** is a versioned `InstitutionSupportSignalPolicy`: exact institution,
optional class or category override, signal type, absolute threshold, fixed
window, the business checkpoint/deadline it reuses, enabled/disabled, effective
period, revision, Admin actor, change reason and audit.

**A signal carries the `policyRevision` that produced it.** A threshold changed
at noon does not retroactively re-describe the morning's signals, and a reader
comparing two snapshots can see that the policy moved rather than the work.

**Concurrency is not a concern for the projection** — it is composed per
request and stored nowhere. Policy edits follow the same
`expectedRevision`/`conflict` rule as 0D-1 and 0D-3.

## 6. Default-safe behavior

| Condition | Result |
| --- | --- |
| No explicit policy for a load category | **disabled** — never a system-guessed default threshold |
| Source unreadable by this actor | the signal does not exist for them; never a sourceless notice |
| Source resolved, withdrawn, redacted, revoked or out of scope | absent from the next snapshot, with no closure record |
| Threshold population partially readable | `unavailable`, per 0C-5 §5 |
| Owner unavailable | signals omitted with a generic unavailable; **never served from a cached signal**, which would leak content whose authority has since changed |
| Policy contract mismatch | deny `contract_mismatch`; the category is disabled rather than defaulted |
| AI provider unavailable, malformed or low-confidence | no `ai_attention_candidate`; the deterministic categories are unaffected |

The load categories failing closed to **disabled** is the one to keep. A guessed
default threshold would fire signals nobody configured, and an Admin cannot
distinguish those from ones their policy produced.

## 7. Fixtures and gates

1. a resolved source removes its signal from the next snapshot, with no closure
   record written anywhere;
2. no store, table or event records that a signal once fired;
3. reading a signal changes no business state, and no dismiss/ack/escalate
   command exists;
4. an unconfigured load category is disabled, not defaulted;
5. an overdue signal fires on the source's own deadline, and no second deadline
   exists anywhere in the unit;
6. a threshold over a partially readable population returns `unavailable`, not
   a count over the readable members, and not a silently absent signal;
7. a signal whose source the reader cannot open is absent for that reader while
   present for one who can;
8. an owner outage omits signals rather than serving cached ones;
9. `ai_attention_candidate` never maps to `action_required`, and a provider
   returning high confidence does not change its tier;
10. a provider outage leaves the six deterministic categories unchanged;
11. no response carries a score, band, rank, percentile, cross-class comparison,
    historical deviation or teacher activity figure;
12. absence of activity records produces no signal;
13. a policy revision change does not re-describe signals produced under the
    previous revision;
14. the same underlying condition yields a stable dedupe identity across reads;
15. an ordinary signal cannot start `EnrollmentJourneyWorkflowV1`.

Synthetic fixtures under I0. Real owner paths stay behind I3, joint conformance
behind I4.

## 8. Schema delta

**`DELTA` — planned, not applied.** One table only.

| Planned | Purpose |
| --- | --- |
| `NurtureInstitutionSupportSignalPolicy` | versioned per institution, with optional class/category override, threshold, window, checkpoint ref, enabled flag, effective period and audit |

The **signal itself gets no table**. Persisting a projection that is defined as
recomputed-per-read would create the closure truth §2 forbids, and would be the
store where "this class was flagged" quietly accumulates.

Migration authoring belongs to G4-B's implementation gate. G4-0 executes no
apply.

## Exit

`G4_0D_5_FREEZE_PASS` releases the support-signal surfaces of G4-B and G4-C.
This record opens no implementation, schema apply, capability rotation,
activation, deployment or traffic. The §4 ordering open point must close before
0D Exit, and closing it in favour of cross-class ordering requires amending
0C-5 §6 rather than overriding that record here.
