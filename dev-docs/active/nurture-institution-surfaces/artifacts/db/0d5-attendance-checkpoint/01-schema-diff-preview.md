# Schema Diff Preview — 0D-1 Attendance Checkpoint

The repo Prisma SSOT adds one table,
`nurture_attendance_closeout_policy`, owned by the 0D-1 attendance domain.
Each immutable row is one exact-class policy revision carrying the explicit
wall-clock checkpoint, effective window and Admin audit refs. The final instant
uses the existing Institution local-day owner's timezone; the new table does
not create a second timezone source.

The migration adds:

- one primary key;
- one unique `(workspace_id, care_group_id, policy_revision)` index;
- one effective-read index;
- revision, local-time, effective-window and non-empty checks; and
- restrictive foreign keys to Institution, CareGroup and role assignment.

No existing table, column, enum or row is changed or deleted. The signal
projection remains unstored, and no deadline column is added to the 0D-5
support-signal policy.
