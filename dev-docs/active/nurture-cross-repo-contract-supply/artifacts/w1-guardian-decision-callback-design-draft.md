# W1 Guardian-Decision Callback — Joint Design Draft

Status: DRAFT-FOR-JOINT-REVIEW (2026-08-13). Not frozen. Freezing requires
My-Chat sign-off recorded in this bundle plus the mirrored addendum copy in
My-Chat `dev-docs/archive/growth-record/artifacts/`. Nothing in this draft
activates any capability; the callback is default-off by construction.

## Problem

`family_growth_transport@1.0.0` (frozen 2026-08-07) settles every release
event through one synchronous admission receipt and states "there is no
callback in v1" (addendum section 3). When that receipt is
`pending_guardian_confirmation`, the provider holds a committed pending
admission (`admission_ref`) but never learns the guardian outcome. The
teacher queue therefore shows 待监护人确认 forever, and the My-Chat
component contract v2 explicitly promises "no later v1 provider callback".
The 2026-08-11 cross-repo decision requires this design to conclude before
any T-008 G5-A Candidate Freeze.

## Recommendation: push callback (Option A)

Add one My-Chat → Nurture decision-event channel as an additive
`family_growth_transport@1.1.0` delta. The frozen `1.0.0` addendum and the
`family_growth_material_*` v1 envelope are not mutated.

- Endpoint: `POST /internal/family-growth/guardian-decisions` (Nurture
  validates; one decision event per request, no batching).
- Payload: new transport-owned `family_growth_guardian_decision@1.0.0` with
  `decision_event_id`, `payload_digest`, `admission_ref`,
  `release_event_id`, `decision`, optional `material_ref` (activation only)
  and `decision_time`.
- Decision vocabulary (collapsed, display-safe): `admission_activated`
  (pending admission became the active family material) and
  `admission_closed` (pending admission ended without activation). Decline,
  expiry and revocation are deliberately NOT distinguished, mirroring the
  collapsed `404 rendition_unavailable` philosophy: family-private detail
  never leaks to the provider or the teacher surface.
- Response `200` body is `family_growth_guardian_decision_receipt@1.0.0`
  with `applied | duplicate | rejected | conflict`; only a valid 200 receipt
  settles the event. `rejected`/`conflict` settle as failed and never
  auto-retry; everything else is `outcome_unknown`, retried with the SAME
  id + digest (exponential 30s → 1h cap, ±20% jitter, ops signal at 8
  attempts) — identical to addendum section 3 semantics, carried by
  My-Chat's existing outbox discipline.
- Idempotency: (`decision_event_id`, `payload_digest`) is the replay
  identity; exact replay returns the existing receipt; same id with a
  different digest is `conflict` (fail closed).
- Authentication: new capability-scoped pair
  `FAMILY_GROWTH_DECISION_SERVICE_TOKEN` / `_PREVIOUS`, sent by My-Chat,
  validated by Nurture; static Bearer, timing-safe, minimum 16 characters.
  The rendition token is NOT reused (direction- and capability-scoped, per
  the Q-1 finding-3 discipline). Absence of the key keeps the capability
  off and fail-closed; with the callback off, behavior is byte-identical to
  `1.0.0` (queue stays pending), which is what makes the delta additive.
- Provider duty: persist every consumed decision event append-only
  (`nurture_family_growth_guardian_decision`), settle the teacher-queue
  projection, and treat decision events as delivery evidence only — never
  as authorization (same rule as receipts).
- Ordering: no cross-event guarantee against lifecycle events. Lifecycle
  overlay display precedence (`redacted` > `target_removed` >
  `correction_appended`) already defined in the component contract remains
  authoritative on the teacher surface.

## Rejected alternative: provider polling (Option B)

A read-only status endpoint on My-Chat (the v1.1 candidate noted in
addendum section 6 for `outcome_unknown`) was considered as the decision
channel and rejected: pending admissions can stay open indefinitely, so
polling is unbounded work with no freshness guarantee; push reuses the
already-qualified outbox/retry/replay discipline on both sides. The
section 6 note itself is unchanged — replay remains the `outcome_unknown`
resolution path for release/lifecycle events.

## Teacher queue resolution path

- `admission_activated` → delivery axis displays the `applied` semantics
  (已发布到家庭).
- `admission_closed` → new terminal delivery display "未被接纳" with no
  reason detail and no retry action.
- The component contract v2 line "promises no later v1 provider callback"
  must be revised in a v3 of that contract on the My-Chat side (T-036/T-039
  adoption work) together with the two copy-map additions above.

## Open items for My-Chat sign-off

1. Decision vocabulary: confirm the two-value collapsed enum versus a
   richer enum (privacy recommendation: keep two values).
2. `decision_time` inclusion versus provider-side `received_at` only.
3. Final push-versus-poll confirmation.
4. Token minting owner and rotation runbook for the new pair.
5. Component-contract v3 revision and teacher-facing copy (My-Chat taste
   decision).
6. Whether My-Chat imposes any expiry on pending admissions; if a guardian
   can ignore a pending admission forever, the queue may need an age-based
   display hint (product decision, not transport).

## Boundaries

No schema apply, no runtime, no route, no token minting and no activation
result from this draft. Implementation starts only after the joint design
record is frozen with My-Chat sign-off, and ships default-off behind the
new configuration key.
