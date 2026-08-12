# Schema Diff Preview — 0E-2 Waitlist and Trial Preparation

The repo Prisma SSOT adds four lifecycle enums and five private owner tables:

- `nurture_enrollment_waitlist_policy`: versioned Institution policy and
  transparent category ordering;
- `nurture_enrollment_waitlist_entry`: server-qualified exact-class FIFO entry
  with pinned policy/category/order and family acceptance actor;
- `nurture_enrollment_waitlist_override`: append-only Admin order/category
  audit tied to an immutable command execution;
- `nurture_enrollment_trial_offer`: explicitly issued, explicitly closed offer
  with frozen trial/review instants;
- `nurture_enrollment_trial_reservation`: exact-class held capacity created
  only by Guardian acceptance.

The additive migration also expands the existing workflow transition carrier
for Guardian action refs. Raw SQL adds monotone policy revision, exact
Workspace/Institution/class/workflow composition, one-current-offer,
append-only, capacity and deferred lifecycle-state guards. The one-held-
reservation rule is a partial index, not a permanent workflow reservation
identity.

No Enrollment/Grant/Child/Family identity, projection table, deadline/blocker
state, automatic timer, workflow outbox or parallel trial-care table is added.
The Prisma diff shadow was destroyed after the generated shape was reviewed.
