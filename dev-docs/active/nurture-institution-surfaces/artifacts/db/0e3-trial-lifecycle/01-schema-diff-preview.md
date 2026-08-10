# Schema Diff Preview — 0E-3 Trial Lifecycle

The generated Prisma delta contained exactly:

1. enum `NurtureEnrollmentParticipationPhase = trial | formal`;
2. nullable `nurture_enrollment.participation_phase`;
3. replacement of the class/status index by the phase-aware index.

The reviewed SQL migration adds the frozen active-row formal backfill and
phase/status check, one-current relationship and one-pending-Grant preparation
guards, removal of the superseded active-only uniqueness index, plus lifecycle
updates to existing workflow transition and reservation constraints. No new
business table or duplicate index path is introduced.

The final disposable datasource-to-Prisma comparison returned an empty
migration. The diff target was destroyed.
