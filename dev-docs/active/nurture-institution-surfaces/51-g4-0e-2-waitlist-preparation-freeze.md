# G4-0E-2 Waitlist, Offer & Trial Preparation — Freeze Record

## Status

- Date: 2026-08-09
- Task: T-007
- Contract identity: `nurture.enrollment-waitlist-preparation@1.0.0`
- Consumes: 0E-1 and the exact Nurture class/capacity owner
- Verdict: `G4_0E_2_FREEZE_PASS`
- Schema delta: **planned, not applied**
- Non-effects: no offer, reservation, Enrollment, schema apply or automatic driver exists.

## 1. Owner and type boundaries

Nurture Enrollment owns waitlist policy, entry, offer and exact-class trial
reservation. `NurtureCareGroup.capacity` is the capacity source; an Admin board
count or Host projection never authorizes a seat.

`capacity_waitlist` is a Workflow business stage. Waiting on a person, owner,
future date or blocker remains 0E-1 waiting state. A due review/offer is a
condition for an explicit command, not a timer-owned transition.

## 2. Frozen shapes

`EnrollmentWaitlistPolicyV1` is immutable per revision and carries Institution,
ordered category definitions, review reminder/deadline durations, offer
validity bounds, effective period, Admin actor and reason. The policy's category
array is the exact allowlist for that revision: one to eight stable keys,
including `standard`; no numeric weight or model score exists. With only
`standard`, ordering is pure FIFO.

`EnrollmentWaitlistEntryV1` carries workflow, exact target CareGroup, expected
entry date/window, server-issued `waitlistQualifiedAt`, immutable tie-break
order key, category/basis from one policy revision, capacity source revision,
continued-interest state, mandatory `nextReviewAt`, last confirmation, current
offer ref, head and lifecycle.

Ordering is category-array order, then `waitlistQualifiedAt`, then immutable
server order key. A later policy revision never silently reorders an existing
entry. A category change is an append-only Admin override with before/after,
actor, reason and both policy revisions. AI never selects category or order.

Family projection contains only status, target-class safe label, last review
and next expected contact. It contains no exact rank, queue length, category or
other-family fact.

`EnrollmentTrialOfferV1` carries entry, exact class, offer head, issued/expiry
time, Admin actor and lifecycle `open|accepted|declined|expired|withdrawn`.
An open offer does not create Enrollment/Grant or reserve capacity.

`EnrollmentTrialReservationV1` is created only by successful Guardian offer
acceptance. It carries exact class, workflow/offer refs, required
`trialStartsAt`, `trialEndsAt`, `reviewAt <= trialEndsAt`, state
`held|converted_to_occupancy|released`, head and release/conversion audit.

## 3. Commands and predicates

```text
qualify_capacity_waitlist
review_waitlist_interest
override_waitlist_category
issue_trial_offer
accept_trial_offer
decline_or_expire_trial_offer
withdraw_from_waitlist
cancel_trial_preparation
query_admin_waitlist
query_family_waitlist
```

Qualification requires all four in one current read: exact class is active and
full, family explicitly accepts waitlisting, target class/window is confirmed,
and 0E-1 minimum inquiry data is complete. `waitlistQualifiedAt` is issued only
after those predicates commit. Inquiry/visit/AI/follow-up timestamps cannot be
supplied as it.

Admin actions use the exact current Institution role. Guardian actions require
the current Host action principal/contact boundary applicable at this stage;
they do not mint platform Child/Family identity. Family views use their own
owner path and never inherit Admin projection authority.

## 4. Transactions, concurrency and replay

- each command reuses `NurtureCommandExecution` and carries the relevant
  expected workflow/entry/offer/reservation/policy heads;
- offer acceptance serializes on the exact CareGroup capacity row, recounts
  current active occupancy plus held reservations, closes the waitlist entry,
  accepts the offer and creates one held reservation in one Nurture transaction;
- if capacity is no longer available, the transaction writes none of those
  effects and returns a recoverable capacity conflict;
- duplicate or concurrent acceptance exact-replays the first result or
  conflicts; it never creates a second reservation;
- decline/expiry is an explicit fenced command after checking stored state and
  `expiresAt`; the wall clock alone changes nothing and sends no next offer;
- `cancel_trial_preparation` closes the accepted/preparation shell and releases
  the held reservation atomically. It does not require Enrollment, Grant or
  CareGroup relationship rows to exist, does not touch My-Chat identity/binding,
  and cannot run after trial-start committed;
- cancellation/withdrawal never restores the old waitlist entry or ordering.

## 5. Default-safe behavior

| Condition | Result |
| --- | --- |
| Class not full | cannot enter `capacity_waitlist` |
| Policy absent | `standard`-only FIFO; no hidden priority category |
| Policy/category mismatch | deny; never map to nearest category |
| `nextReviewAt` absent | reject qualification/review write |
| One unanswered review | `waiting_on_guardian`; never delete or demote |
| Offer passes `expiresAt` | still open until explicit expiry command; no acceptance after fenced expiry |
| Capacity owner unavailable/ambiguous | unavailable; no entry/offer/reservation mutation |
| Accepted-offer cancellation before trial start | local atomic release |
| Trial already started | reject preparation cancellation; use 0E-3 `end_trial` |

## 6. Fixtures and gates

1. only exact full-class capacity can qualify waitlisting;
2. family acceptance + target + minimum data are all required;
3. inquiry/visit time never affects FIFO;
4. one-category policy is pure FIFO; configured categories use category order then FIFO;
5. later policy revisions do not silently reorder existing entries;
6. override is append-only and AI cannot create it;
7. family projection leaks no rank/count/category;
8. `nextReviewAt` is mandatory and one non-response only changes waiting state;
9. vacancy creates at most an Admin task, never an offer or Enrollment;
10. offer acceptance closes entry and creates exactly one held reservation under a class lock;
11. concurrent accept cannot overbook the seat;
12. expiry/decline never sends the next offer automatically;
13. preparation cancellation releases without Enrollment/Grant/identity mutation;
14. cancellation after trial start denies and never releases active occupancy;
15. no path restores old rank or `waitlistQualifiedAt`.

## 7. DB delta

Planned tables: `NurtureEnrollmentWaitlistPolicy`,
`NurtureEnrollmentWaitlistEntry`, `NurtureEnrollmentWaitlistOverride`,
`NurtureEnrollmentTrialOffer`, `NurtureEnrollmentTrialReservation`. Queue and
family projections get no tables. Raw SQL guards/serializable repository logic
must enforce one current offer/reservation per Journey and prevent held
reservations from exceeding exact current capacity. Migration authoring is I1;
apply needs separate disposable-target approval.

## Exit

`G4_0E_2_FREEZE_PASS` releases 0E-3. It does not create or operate a waitlist.

