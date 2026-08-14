# W7 Scope Freeze — nurture.teacher-organization-owner@1.0.0

Frozen 2026-08-14 under the W6-W11 schedule
(`w6-teacher-supply-schedule.md`). W7 is the first teacher batch with write
paths; it exposes the already-modelled organization loop (captures ->
organize cut -> draft lane -> queue admission) plus the two class-stream
writes, without inventing any new canonical model. Changes after this point
follow the append-only correction convention.

## Interface identity

- Key/version: `nurture.teacher-organization-owner@1.0.0`
- Kind: `private_owner_exchange` (reads plus command exchanges, W3 style)
- Surface baseline: `nurture.surface-contract@1.20.0`, relationship
  `standalone_composition_no_surface_mutation`
- Declared capability dependencies (referenced, not re-declared):
  `organize_care_capture_batch@1.0.0`, `record_caregiver_daily_care@1.0.0`,
  `query_teacher_publish_queue@1.0.0` (lane vocabulary only)
- Transport: POST, JSON, service bearer, `Cache-Control: private, no-store`
- Env gate: `NURTURE_TEACHER_ORGANIZATION_OWNER_ENABLED` (optional,
  non-secret, default false); composition additionally requires the service
  token and complete authority/owner/protected-content ports (fail-closed
  factory)
- Safe reason codes: `teacher_organization_owner_disabled`,
  `invalid_teacher_organization_request`,
  `teacher_organization_contract_mismatch`

## Operations and consumer rows

Base path `/internal/nurture/teacher-organization-owner/v1/`:

| Operation | Path | Serves | Content |
| --- | --- | --- | --- |
| `feed_query` | `feed` | T-F08 | Bounded class-feed page (≤50) over the current collecting/cut batch window: per capture an opaque `capture_ref`, kind (`text`/`voice_transcript`/`media`), `occurred_at`, stability (`stable`/`processing`), explicit upload/processing failure state, media presence flag, and for text kinds a protected-read safe excerpt (≤120 chars). No media bytes; the stream ingress stays reserved. |
| `organization_query` | `organization` | T-F09, T-F11, T-F10 preview | Batch head (state, capture counts, watermark sequence, fallback due, trigger availability preview from the frozen trigger evaluator) plus the ordered draft lane: per organized process an opaque `process_ref`, origin (`agent_organized`/`manual`), `data_class`, purpose key, state (`draft`/`needs_review`/`pending_release`), recipients summary (count + safe labels), quick-adjust window end, edit-hold end, and the admission decision preview (`ready`/`waiting`/`blocked` with its closed reason set). Lane order is owner-persisted; at most one active quick-adjust window is reported per lane. |
| `organize_exchange` | `organize` | T-F02 | Manual organize trigger: idempotent start/resume keyed by `command_request_id`; result mirrors `OrganizeCareCaptureBatchResultV1` (`organized`/`nothing_to_organize`/`needs_review`/`direct_interaction_required` with counts and optional `process_ref`); exact same-command replay returns the recorded result. |
| `supplement_exchange` | `supplement` | T-F05 | Prepare/confirm discriminated union over `record_caregiver_daily_care`: prepare rereads authority and returns a single-use, five-minute, body-free `confirmation_ref` plus preview digest; confirm re-submits the typed input with the digest and lands `committed`/`not_committed`/`outcome_unknown` with same-command reconciliation. |
| `class_note_exchange` | `class-note` | T-F15 | Single-step atomic text class note (1-500 chars) into the collecting batch; class-internal per the cross-cutting rule (no confirmation gesture), actor-bound idempotency, exact replay answers the recorded `capture_ref`. Voice stays excluded. |
| `queue_admission_exchange` | `queue-admission` | T-F10 | Explicit “加入待发” admission of one draft process through the frozen `admitPublishProcessToQueue` rule: `queued`/`already_satisfied`/`waiting`(`quick_adjust_active`/`edit_hold_active`)/`blocked` (closed reason set); the schedule is frozen owner-side in the same transaction. Scheduling policy questions stay under I-Q1 — this command never auto-sends and release remains the separate teacher-release-owner confirm. |

## Authority and command model

- Caller context and forbidden request fields are identical to W6 (routing
  only; `participant_id`/`role`/`care_group_id`/`child_id`/... fatal).
  `class_ref`, `child_ref`, `process_ref`, `capture_ref` are owner-issued
  opaque refs resolved by candidate matching; foreign or stale refs purge
  (`masked`, `access_changed`) without existence leaks.
- Every operation rereads the current caregiver/lead_caregiver RoleAssignment
  for the exact CareGroup through the W6 authority pattern; reads echo the
  resolved authority envelope verbatim (binding-assert discipline unchanged).
- Read vs command admissibility are derived separately (05-pitfalls): the
  organization read reporting a trigger or admission as available is never
  itself authorization; every exchange re-evaluates on execution.
- Command idempotency binds the actor: each exchange's canonical payload
  carries an actor-scoped HMAC (workspace + participant + command_request_id)
  and a negative cross-actor replay test is mandatory per exchange.
- `supplement_exchange` is the only two-step confirm (child-record business
  effect). `organize`, `class_note` and `queue_admission` are class-internal
  single-step commands under the locked cross-cutting principle (园所侧内部
  动作无需确认); admission is additionally idempotent by domain design
  (`already_satisfied`).
- Every exchange result is `committed | not_committed | outcome_unknown`
  shaped (organize/admission map their domain outcomes inside `committed`),
  and `outcome_unknown` recovery is exact same-command replay, never a new
  command.

## Port set (implemented in-wave, W3.1 style)

- `TeacherOrganizationAuthorityResolverV1` — W6-pattern caregiver resolver.
- `TeacherOrganizationOwnerV1` — the six operations over
  `{ request, authority }`.
- Real composition in `packages/nurture-db`:
  `createPrismaTeacherOrganizationBinding({ prisma, integrityKey,
  protectedContent, now })`, reusing `CaptureBatchReadPort` /
  `resolveOrganizeTrigger` / `projectOrganizeResult`, the care-capture and
  publish-process transactions, `admitPublishProcessToQueue`, the
  `record_caregiver_daily_care` write path and the protected-content port for
  text excerpts and note sealing. No schema change is expected; if a gap
  emerges it routes through the DB-SSOT process as its own step.

## Negative matrix (fixture-backed, minimum)

W6 set (not_authorized variants, stale/cross-scope refs, invalid date,
disabled gate, service auth, forbidden request field, hidden payload,
digest mismatch) plus per-write: cross-actor replay denial, confirmation
expiry/single-use/foreign-surface denial (supplement), preview-digest
mismatch (supplement), divergent same-`command_request_id` payload conflict,
`outcome_unknown` then exact-replay recovery, admission `waiting` both
reasons, admission `blocked` closed set, organize on a foreign batch head
(`refresh_required`-class conflict), note length bounds, voice/media note
rejection.

## Implementation order

1. **W7-1 contract artifact**: owner-contract JSON + fixtures + validator +
   README; digest minted to its four homes; validator chained into
   `verify:formal-ingress-contract`.
2. **W7-2 runtime**: 五件套 + config flag + safe codes + e2e (listener-free)
   + config tests; default-off proven; ingress/test-routing censuses.
3. **W7-3 real owner ports**: domain service + Prisma binding + unit lane +
   production-DB lane (writes covered on disposable targets; UTC discipline).
4. **W7-4 registration**: env 5-file set, context registry, candidate fixture
   list, governance sync, full battery.
5. **W7-5 handoff**: digest-pin artifact + My-Chat snapshot refresh + dormant
   strict consumer + matrix rows (T-F02/T-F05/T-F08/T-F09/T-F10/T-F11/T-F15).

## Explicitly out of W7

Voice input, media bytes/stream ingress (reserved; W9), scheduling policy
changes (I-Q1), communication surfaces (W8), any activation, durable apply,
deployment, device or traffic claim. The frozen G5-A Candidate is untouched.
