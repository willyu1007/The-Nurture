# Execution Log — 0E-3 Trial Lifecycle

## Database qualification

1. Created the isolated diff database and reviewed the additive Prisma delta.
2. The first migration replay exposed a PostgreSQL reserved-word alias in a
   deferred invariant; it was corrected before qualification.
3. Recreated the empty qualification database after each migration repair, so
   every successful run proved the complete 32-migration history from zero.
4. Targeted execution exposed three legacy constraints that were valid before
   0E-3 but too narrow for the frozen lifecycle: active canonical workflow
   binding, explicit trial due-at/stage-loop movement and release after
   occupancy conversion. Each was widened only for the exact 0E-3 states.
5. The targeted waitlist/trial file passed 6/6, including stale owner rejection,
   no clock mutation, formal-count separation, explicit extension, local end,
   replay and no waitlist restore.
6. The first complete DB lane found an implicit active phase in one dynamic
   fixture and a pending/active Grant uniqueness rule that was broader than the
   established multi-Grant authority contract. The fixture now declares
   `formal`; the index now fences pending preparation only.
7. Final architecture review made the Guardian actor type and pending-Grant
   signer/terms exact, required live local Child/Family/CareProcess and Guardian
   role state, removed two superseded Enrollment indexes and added a deferred
   workflow-due parity fence. Negative probes reject inactive local state, an
   expired Guardian role and a wrong signer, and roll back unaudited
   reservation/Grant date drift.
8. The final complete production-DB lane passed 386/386. Migration status was
   current and datasource drift empty.
9. Regenerated `docs/context/db/schema.json` and the context registry checksum
   (`30086d74…`).
10. Dropped both exact databases and confirmed their combined presence count was
   zero.

No shared or persistent database was changed and no credential was recorded.
