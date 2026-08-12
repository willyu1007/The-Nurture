# G4-0B Publication-policy Fast-lane Freeze

## Status

- Date: 2026-08-01
- Contract identity: `nurture.institution-publication-policy@1.0.0`
- Verdict: `G4_0B_CONTRACT_FREEZE_PASS`
- Implementation candidate: ready; database qualification pending
- Provider/consumer qualification: pending database-backed execution

This record freezes the T-007-owned publication-policy contract consumed by
T-006 G3-D/E. The current implementation candidate adds the owner
table/read repository and T-006 consumer wiring, but no Admin command, policy
write capability, activation or traffic authority. Contract freeze is not
provider/consumer qualification.

## Ownership and Boundary

- Canonical policy owner: Nurture / T-007, exact Institution scope.
- Consumer: T-006 `PublishProcess` policy resolver.
- My-Chat owns terminal UI and authenticated active-role shell context; it does
  not own, cache as authority or mutate the policy fact.
- Device time, locale and client-provided schedule values are never authority.

## Contract Shape

```text
InstitutionPublicationPolicyV1
  policyRef
  institutionRef
  version: positive integer
  policyHead: opaque monotonic head
  timeZone: IANA time-zone identifier
  defaultReleaseLocalTime: HH:mm
  retryCutoffLocalTime: HH:mm
  organizeIdleSeconds: integer >= 60
  organizeFallbackLeadSeconds: integer >= 60
  automaticQuiescenceSeconds: integer >= 30
  captureActivityLeaseSeconds: integer 30..180
  automaticOrganizeEnabled: boolean
  effectiveFrom
  supersededAt?
```

Pilot defaults are frozen as:

- `defaultReleaseLocalTime = 17:00`;
- `retryCutoffLocalTime = 19:00`;
- `organizeIdleSeconds = 600`;
- `organizeFallbackLeadSeconds = 1800`;
- `automaticQuiescenceSeconds = 60`;
- `captureActivityLeaseSeconds = 60`;
- `automaticOrganizeEnabled = true`.

The concrete Institution timezone is required and must be an IANA identifier;
there is no device-time or fixed-offset fallback.

## Resolution and Freeze Semantics

For each new `PublishProcess`, the T-006 provider resolves the current policy
and freezes:

```text
ResolvedPublicationScheduleV1
  policyRef
  policyHead
  timeZone
  sourceWatermark
  quickAdjustDeadline
  scheduledAt
  notAfter
  organizeTrigger: manual | idle | fallback
```

- `scheduledAt` and `notAfter` are server-derived instants using the frozen IANA
  timezone and current effective policy.
- Existing processes retain their frozen `policyHead`, `scheduledAt` and
  `notAfter`; a later policy version never silently rewrites them.
- A future explicit reschedule action must use its own expected schedule/policy
  heads. It is not implied by this contract freeze.
- Policy drift before a process freezes a schedule requires refresh/reprepare.
  Drift after freeze is handled by the T-006 release-time current-policy rule;
  it may block/rebase but never silently change user-visible release intent.

## Organize and Quiescence Rules

- Manual organize by a current exact-CareGroup caregiver bypasses automatic
  quiescence but still freezes a stable source watermark.
- Idle organize becomes eligible after `organizeIdleSeconds` with no qualifying
  caregiver activity.
- Fallback organize becomes due at `default release - fallback lead`; after it
  is due, one `automaticQuiescenceSeconds` quiet interval is required.
- Caregiver capture/add/remove/select/edit activity and a valid activity lease
  reset quiescence. Upload, thumbnail, provider heartbeat and other background
  machine progress do not.
- Content arriving after the frozen watermark or still uploading belongs to a
  later batch. Exact trigger replay cannot create a second process.

## Authority and Failure Closure

- Policy read requires exact Institution scope; policy configuration authority
  is frozen later in 0C and remains absent/default-off until then.
- Missing policy, invalid timezone, unknown version/head, owner unavailable,
  contract mismatch or ambiguous Institution returns dependency unavailable and
  creates no `PublishProcess` or release.
- T-006 cannot accept caller-provided timezone, schedule, cutoff or `policyHead`
  as canonical input.
- At release, T-006 rereads the exact saved revision, edit hold, actor/CareGroup,
  Enrollment, Grant, targets, media and the policy compatibility needed by the
  frozen schedule. Failure skips release and remains visible; it never silently
  chooses a different policy or actor.

## Required Provider/consumer Qualification

Implementation is not complete until T-007 and T-006 jointly prove:

- exact policy identity/version/head and IANA/DST-safe instant derivation;
- manual/idle/fallback trigger behavior and machine-progress exclusion;
- stable source watermark and exact replay;
- policy drift before and after schedule freeze;
- invalid timezone, owner unavailable and contract mismatch fail closed;
- `scheduledAt`/`notAfter` persistence and release-time reread;
- final default-off/false-empty census.

Until then T-006 G3-D/E cannot issue a Beta Profile Handoff. In the candidate,
fact absence still reports the dependency as unavailable; configured rows are
not considered qualified until the database-backed joint evidence passes.
