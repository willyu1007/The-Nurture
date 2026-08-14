# W3/W4 owner-presenter environment change intent

Register one optional, non-secret, default-false gate for the standalone
parent-communication owner v1 composition. The key does not activate the
interface by itself: runtime composition also requires configured service auth
and complete authority, owner and async-boundary ports.

No existing key is renamed or removed. The change is backward compatible and
does not update any environment-specific value or secret reference.

W4 adds `NURTURE_DIRECTOR_PRESENTER_ENABLED` as a second optional,
non-secret, default-false gate. Exact `true` still requires configured service
auth plus complete current-authority and owner ports. The presenter is
read-only and the gate cannot enable Institution Mobile commands.

W6 adds `NURTURE_TEACHER_CLASS_STREAM_PRESENTER_ENABLED` as a third
optional, non-secret, default-false gate. Exact `true` still requires
configured service auth plus complete caregiver current-authority and owner
ports. The presenter is read-only and admits no class-stream write path.
